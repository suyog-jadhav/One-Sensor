# OneSensor Phase 2 — Master Architecture Prompt
## Runtime Configurability + Desktop Control App + First-Time Setup Wizard

You are extending an already-working OneSensor prototype (ESP32 + Arduino Uno,
5-channel PWM/DAC virtual sensor platform, documented in `docs/architecture.md` and
implemented per the Phase 1 prompt). This document specifies **Phase 2**: a desktop
control application, a runtime configuration protocol that removes most reasons to
reflash, and a guided first-time setup flow for new developers. Read this entire
document before writing code. Do not touch Phase 1's public `OneSensor` Arduino
library API — Phase 2 must not break existing user sketches.

---

## 0. Relationship to the Existing System

| Already built (Phase 1) | Do not rebuild |
|---|---|
| ESP32 firmware: WebSocket server, `SensorState`, `ChannelManager` (LEDC PWM + DAC), `ScenarioEngine`, value mapper | Reuse and extend, don't rewrite |
| Arduino `OneSensor` library: `PwmDecoder`, `DacDecoder`, `SignalDecoder` interface, sensor classes, calibration | Reuse and extend, don't rewrite |
| Web dashboard (browser-based) | Becomes the phone's minimal on-device UI (Section 5), not the primary control surface |
| Channel config: `hardware_config.h` (ESP32), `ArduinoChannelConfig.h` (Arduino) | These become **factory defaults**, no longer the only source of truth |

Phase 2 adds a desktop app as the primary control/config/flashing surface, while the
ESP32 keeps serving a lightweight page for phones on the same LAN.

---

## 1. Non-Negotiable Constraints

| # | Constraint |
|---|---|
| 1 | The Phase 1 `OneSensor` Arduino public API (`begin()`, `update()`, `read*()`, `isConnected()`, `isValid()`) does not change. |
| 2 | Two transports, kept separate, never merged into one channel: **Wi-Fi/WebSocket** for runtime control (values, scenarios, config), **USB Serial** for flashing and for provisioning steps that must happen before Wi-Fi exists. |
| 3 | DAC output is only ever GPIO25/GPIO26 — this is ESP32 hardware fact. Config may choose *which sensors* use DAC, never *which pins*. |
| 4 | Any config change accepted by the ESP32 must be validated (duplicate GPIO, invalid pool, DAC-pin constraint) **before** touching hardware, and persisted to NVS so it survives reboot. |
| 5 | Wi-Fi credentials are never compiled into a firmware binary. They reach the device only via the serial provisioning handshake (Section 4) and are stored in NVS. |
| 6 | The ESP32 WebSocket server must support multiple simultaneous clients (desktop app + phone) and broadcast state/config changes to all of them, not just whichever client sent the change. |
| 7 | The desktop app must offer a path with **zero external toolchain requirements** (Quick Flash, prebuilt binaries bundled in the app) — PlatformIO/arduino-cli are optional, detected, and only unlock an additional "Developer Build" path. |
| 8 | Build and verify in the phase order in Section 11. Do not start phase *N+1* until phase *N* is verified and logged in `docs/progress.md`. |

---

## 2. Full System Architecture

```text
                          ┌─────────────────────────────────────┐
                          │               ESP32                    │
  Phone (LAN) ──HTTP────▶ │  Minimal Web UI (LittleFS, read+write  │
                          │  a small subset of values)             │
                          │        │                               │
                          │        ▼ same endpoint                  │
                          │  WebSocket Server (/ws)  ◀─────broadcast─┼──▶ all clients
  Desktop App ──WS───────▶│        │                               │
  (control-plane,         │        ▼                               │
   Wi-Fi)                 │  ConfigStore (NVS)  ◀──▶ SensorState    │
                          │        │                 (mutex)        │
                          │        ▼                     │          │
                          │  ChannelManager ◀─────────────┘          │
                          │  (LEDC PWM x N, DAC x ≤2)                │
                          └──────────────┬────────────────────────┘
                                         │ 5x signal wires + shared GND
                                         ▼
                          ┌─────────────────────────────────────┐
                          │             Arduino Uno                │
  Desktop App ──USB───────┼─▶ Serial provisioning (pin config →   │
  (flash + provision      │   EEPROM), Section 4                  │
   plane)                 │        │                               │
                          │        ▼                               │
                          │  PwmDecoder/DacDecoder x N              │
                          │        │                               │
                          │        ▼                               │
                          │  OneSensor Library → User Sketch        │
                          └─────────────────────────────────────┘

  Desktop App ──USB───────▶ ESP32  (flash-plane: esptool.py, and
                                    serial provisioning before Wi-Fi exists)
```

Two planes, two transports, and neither one should ever have to imitate the other:
flashing and pre-Wi-Fi provisioning are Serial; everything after the device has
joined Wi-Fi is WebSocket.

---

## 3. ESP32 Firmware Additions

### 3.1 ConfigStore module

```text
esp32/
├── include/config_store.h
└── src/config_store.cpp
```

```cpp
struct ChannelConfig {
    SensorType sensor;
    SignalType signal;       // PWM or DAC
    uint8_t    gpio;
    uint32_t   frequencyHz;  // PWM only
    uint8_t    resolutionBits;
    float      inputMin;
    float      inputMax;
    float      calOffset;
    float      calScale;
};

class ConfigStore {
public:
    bool  begin();
    std::array<ChannelConfig, MAX_CHANNELS> load();     // NVS, else compiled defaults
    bool  save(const std::array<ChannelConfig, MAX_CHANNELS>& cfg);
    void  resetToDefaults();
};
```

- Wraps the `Preferences` library behind one namespace (e.g. `"onesensor"`). No other
  file calls `Preferences` directly.
- `load()` returns compiled `hardware_config.h` defaults only if NVS has never been
  written — after the first successful `save()`, NVS is authoritative.

### 3.2 Config validation (runs on every `set_config`, before any hardware change)

Reject the whole proposed config (not per-channel — the set must be internally
consistent) if any of:

```text
duplicate GPIO across channels
GPIO outside the valid PWM pool (see Phase 1 spec, Section 3.1)
more than 2 channels requesting SignalType::DAC
a DAC channel's gpio field is anything other than 25 or 26
```

Report the specific failure back to the requesting client; do not apply a partial
config.

### 3.3 Applying a validated config without reboot

```cpp
void ChannelManager::applyConfig(const std::array<ChannelConfig, MAX_CHANNELS>& cfg);
```

For each channel whose GPIO or signal type changed: `ledcDetachPin()` the old
assignment (if PWM), reconfigure (`ledcSetup` + `ledcAttachPin`, or `dacWrite` setup
for DAC), and only then update the live `ChannelConfig` used by the mapping loop.
Do this per-channel so an in-progress reconfigure of one channel never stops PWM
output on the other four.

### 3.4 WebSocket protocol additions

```json
{ "type": "get_config" }
{ "type": "set_config", "channels": [ { "sensor": "gas", "signal": "pwm", "gpio": 23, "frequencyHz": 500, "resolutionBits": 10, "inputMin": 0, "inputMax": 1000, "calOffset": 0, "calScale": 1 }, "..." ] }
{ "type": "reset_config" }
{ "type": "config_state", "channels": [ "... current confirmed config, broadcast to all clients after any successful change ..." ] }
{ "type": "config_error", "reason": "GPIO 16 assigned to both GAS and LIGHT" }
```

`config_state` is pushed to **every** connected client whenever the confirmed config
changes — this is how the desktop app and the phone UI both stay in sync, and how
the desktop app confirms a `set_config` actually landed rather than assuming success.

### 3.5 Multi-client broadcast (applies to values too, not just config)

Any change to `SensorState` — from a WebSocket client, from the phone UI, or from a
running scenario tick — results in a `sensor_state` broadcast to all connected
clients. No client should have to poll or guess that another client changed
something.

### 3.6 mDNS

On successful Wi-Fi connect, start `ESPmDNS` advertising the configured device name
(`<deviceName>.local`). This is best-effort — the desktop app must not treat mDNS
failure as a hard error (see Section 7.3).

---

## 4. Serial Provisioning Protocol (setup-time only, both boards)

Deliberately separate from the WebSocket protocol above — different transport,
different lifecycle (runs once at setup, or after a factory reset), never confused
with runtime messages.

### 4.1 ESP32 — Wi-Fi + device name provisioning

```text
Device (after flash, on boot, if no Wi-Fi credentials in NVS) prints:
  ONESENSOR_READY_FOR_PROVISIONING

Desktop sends (one line, JSON):
  {"ssid":"MyWifi","password":"...","deviceName":"onesensor-bench1"}

Device replies, one of:
  {"status":"connecting"}
  {"status":"connected","ip":"192.168.1.42","mdns":"onesensor-bench1.local"}
  {"status":"failed","reason":"auth_timeout"}
```

On `"connected"`, the device persists SSID/password/deviceName to NVS and continues
normal boot. A subsequent boot with valid stored credentials skips straight to
normal WebSocket server startup — `ONESENSOR_READY_FOR_PROVISIONING` is only printed
when NVS has no credentials, or after an explicit `{"type":"reset_wifi"}` is sent
over serial.

### 4.2 Arduino — pin config provisioning

```text
Device (on boot, or after a serial "PROVISION" command) prints:
  ONESENSOR_ARDUINO_READY_FOR_PROVISIONING

Desktop sends:
  {"channels":[{"sensor":"temperature","pin":2,"signal":"pwm"}, "..."]}

Device replies:
  {"status":"saved"}
  {"status":"error","reason":"pin 2 assigned twice"}
```

Saved to EEPROM; read back at boot instead of the compiled `ArduinoChannelConfig.h`
defaults, mirroring the ESP32's NVS-overrides-compiled-defaults pattern.

---

## 5. ESP32-Hosted Minimal Web UI (phone path)

- Served from LittleFS, no build step required on-device (plain HTML/JS/CSS, single
  file or a handful of small files).
- Deliberately minimal: current values (read-only or simple +/- steppers), a
  connect/status indicator. **No** channel/GPIO configuration exposed here — that
  stays desktop-only, since a phone on the LAN is not where you want someone
  accidentally reassigning GPIOs.
- Connects to the same `/ws` endpoint, using the existing `set_value`/`sensor_state`
  message types only — it must not need any Phase 2 message types to remain useful.

---

## 6. Desktop Application

### 6.1 Stack

| Layer | Choice | Notes |
|---|---|---|
| Shell | Tauri | Small install size; supports bundling the Python backend as a sidecar binary |
| Frontend | React (Vite) | UI only — no hardware access from JS |
| Backend | Python (FastAPI/uvicorn), packaged with PyInstaller as the Tauri sidecar | Owns serial ports, `esptool.py` (imported as a library, not shelled out), `arduino-cli`/`avrdude`, the WS client to the ESP32, and local persistence |
| Frontend↔Backend | One local WebSocket (`ws://127.0.0.1:<port>`) | Same typed-JSON-envelope philosophy as the ESP32 protocol |

### 6.2 Backend module layout

```text
backend/
├── app.py                    # FastAPI app; local WS to the React frontend
├── device_ws_client.py       # WS client to ESP32 control-plane; re-broadcasts to frontend
├── serial_provisioning.py    # Section 4 handshakes, both boards
├── discovery.py              # mDNS browse + serial-log IP fallback
├── device_registry.py        # known boards (by chip ID) → last-used config profile
├── config_sync.py            # get_config/set_config/config_state client logic
├── flash_esp32.py            # esptool.py wrapper, merged-binary flashing, progress callback
├── flash_arduino.py          # arduino-cli/avrdude wrapper
└── serial_ports.py           # pyserial port discovery, VID/PID hints for board identification
```

### 6.3 Frontend module layout

```text
frontend/
├── SetupWizard/          # Section 8, step-by-step first-run flow
├── ConfigEditor/         # channel table; round-trips via config_sync.py, no reflash
├── LiveControl/          # sliders/numeric inputs, mirrors phone UI
├── ScenarioBuilder/      # STATIC/RAMP controls
├── FlashPanel/           # Quick Flash + Developer Build, shared by wizard and later re-flashes
└── ConsoleLog/           # merged WS traffic + serial monitor view
```

### 6.4 Device registry

Identify a physical board by its ESP32 chip ID (`esptool.py chip_id`, stable across
reflashes and across which USB port it's plugged into) — not by serial port name or
IP address, both of which can change. On connect, look up the chip ID in
`device_registry.py`; if known, offer "restore last config" (calls `set_config`
with the stored profile) rather than treating a familiar board as brand new.

---

## 7. Flashing Subsystem

### 7.1 ESP32

- Ship one merged `.bin` per firmware version (`esptool.py merge_bin` combining
  bootloader + partition table + app), flashed at offset `0x0`. The desktop app
  tracks one file and one offset, not three.
- Use `esptool.py` as an imported Python module (it's already Python — no subprocess
  stdout-scraping needed) and surface its write-progress callback directly to the
  UI's progress bar.
- Standard erase-then-write sequence; auto-baud and DTR/RTS reset handling are
  esptool's job, don't reimplement bootloader-entry sequencing by hand.

### 7.2 Arduino Uno

- Ship one prebuilt `.hex` per firmware version.
- Flash via `arduino-cli upload -p <port> --fqbn arduino:avr:uno -i firmware.hex`
  (or `avrdude` directly if not depending on arduino-cli) — no on-machine compile
  required for Quick Flash.

### 7.3 Quick Flash vs Developer Build

| Mode | Requirements | Behavior |
|---|---|---|
| Quick Flash | None — binaries bundled in the app | Default path; shown always |
| Developer Build | PlatformIO and/or arduino-cli detected on `PATH` | Only shown when detected; builds from the local firmware source tree, then flashes the result |

Detect toolchain presence at app startup (not at click-time) so the UI never offers
a button that's guaranteed to fail.

---

## 8. First-Time Setup Wizard (the primary new UX)

```text
Step 1  Detect ESP32        List serial ports; flag likely candidates via known
                             USB-bridge VID/PID (CP2102, CH340, FTDI). User confirms
                             or picks manually if detection is ambiguous.

Step 2  Flash ESP32         Quick Flash by default (Section 7.1). Progress bar,
                             clear failure messages (wrong port, permissions,
                             board not in bootloader mode — give the manual
                             BOOT-button fallback instructions here).

Step 3  Provision Wi-Fi     Form: SSID, password, device name. Runs the Section 4.1
                             handshake over the same serial port. On failure, show
                             the device's own {"status":"failed","reason":...} verbatim
                             plus a retry button — don't paper over the real reason.

Step 4  Confirm connection  Wait for {"status":"connected", "ip":..., "mdns":...}.
                             Desktop app now switches its control-plane transport
                             from serial to WebSocket (Section 6.2/discovery.py)
                             for the rest of the session.

Step 5  (Optional) Arduino  Offer to detect + flash the Uno (Section 7.2) and run
                             the Section 4.2 pin-provisioning handshake. Skippable —
                             not everyone rewires on day one.

Step 6  Land in Live Control Wizard closes; main screen opens already connected,
                             showing current sensor_state and config_state as
                             confirmed by the device, not assumed by the wizard.
```

Error handling principle for the whole wizard: **never advance a step on an assumed
success.** Each step waits for the device's own confirmation message before the
"Next" state becomes available, and every failure path shows the device's actual
reported reason rather than a generic "something went wrong."

---

## 9. Config Sync Logic (desktop ↔ ESP32, ongoing after setup)

```text
Desktop opens WS connection
        │
        ▼
Desktop sends {"type":"get_config"}
        │
        ▼
ESP32 replies {"type":"config_state", channels:[...]}   ← desktop's ConfigEditor
        │                                                  populates from this,
        ▼                                                  never from local cache alone
User edits in ConfigEditor, clicks Apply
        │
        ▼
Desktop sends {"type":"set_config", channels:[...]}
        │
        ▼
ESP32 validates → applies → persists → broadcasts new {"type":"config_state"}
        │
        ▼
Desktop's ConfigEditor updates from the broadcast (not from the request it sent) —
this is what makes it correct even when the phone UI or another desktop instance
changes config concurrently.
```

The rule to hold onto: the desktop app's displayed config is always a reflection of
the last `config_state` broadcast it received, never a locally-optimistic guess.

---

## 10. Security & Validation Notes (document, don't silently "fix")

| Item | Position for this prototype |
|---|---|
| WebSocket has no authentication | Acceptable on an isolated dev/lab Wi-Fi network; document as a known limitation in `docs/troubleshooting.md`, not as an oversight |
| Serial provisioning sends Wi-Fi password in plaintext over USB | Acceptable — USB is physically local; do not attempt to encrypt this channel for the prototype, but don't log the password to any file or the ConsoleLog panel either |
| Config validation happens on the ESP32, not just in the desktop UI | Required — the phone UI or a hand-rolled WS client could otherwise send an invalid config; the device must be the final authority |

---

## 11. Build Order

| Phase | Deliverable | Exit criterion |
|---|---|---|
| 1 | `ConfigStore` + NVS load/save/reset on ESP32 | Restarting the ESP32 preserves a manually-set config (verify via Serial log) |
| 2 | `get_config`/`set_config`/`reset_config`/`config_state` over existing WebSocket server | A manual WS test client can read and change config; invalid configs are rejected with a clear reason and no partial apply |
| 3 | Multi-client broadcast for both `sensor_state` and `config_state` | Two WS clients connected simultaneously; a change from either is reflected on both without polling |
| 4 | Arduino EEPROM pin config + Section 4.2 serial handshake | Rewiring + re-running the handshake changes decoded readings without recompiling the Uno sketch |
| 5 | ESP32 serial provisioning handshake (Section 4.1) + mDNS | A freshly-flashed board can be given Wi-Fi credentials over serial and is reachable at `<name>.local` afterward |
| 6 | Desktop app skeleton (Tauri + React + FastAPI sidecar, local WS working) | App launches, backend sidecar starts, frontend can send/receive a trivial message through it |
| 7 | `flash_esp32.py` + FlashPanel (Quick Flash only) | A blank ESP32 is flashed successfully from the UI with a visible progress bar |
| 8 | Setup Wizard steps 1–4 (ESP32 only) | New-machine test: blank ESP32 → wizard → connected Live Control, no manual steps outside the wizard |
| 9 | `flash_arduino.py` + wizard step 5 | Same test, now including the Uno, ends with both boards flashed and provisioned |
| 10 | `ConfigEditor` wired to `config_sync.py` | Changing a channel's GPIO in the desktop UI updates the physical output with no reflash |
| 11 | `device_registry.py` + reconnect flow | Unplug/replug a known board; desktop app offers to restore its last config |
| 12 | Developer Build mode | With PlatformIO/arduino-cli installed, the alternate build-from-source path also succeeds |

Do not start a phase before the previous one is verified on real hardware and logged
in `docs/progress.md`.

---

## 12. Documentation to Produce (additions to Phase 1's `docs/`)

| File | Contents |
|---|---|
| `docs/config-protocol.md` | Full `get_config`/`set_config`/`reset_config`/`config_state`/`config_error` schema |
| `docs/provisioning.md` | Section 4 handshakes for both boards, with example transcripts |
| `docs/desktop-app.md` | Module layout, how frontend/backend talk, how to run in dev mode |
| `docs/setup-wizard.md` | Step-by-step wizard flow with screenshots/mockups and failure-path handling |
| `docs/troubleshooting.md` | Updated with Phase 2 failure modes: board not detected, provisioning auth_timeout, mDNS unavailable, toolchain not found |

---

## 13. Acceptance Criteria (Phase 2, full list)

| Area | Requirement |
|---|---|
| Backward compatibility | Existing `OneSensor` Arduino sketches and the Phase 1 WS protocol continue working unmodified |
| Runtime config | Channel GPIO/signal/frequency/range/calibration all changeable from the desktop app with no reflash, persisted across reboot |
| Multi-client | Desktop app and phone UI can be connected simultaneously; changes from either broadcast to both |
| Provisioning | Wi-Fi credentials never appear in a flashed binary; set only via serial handshake |
| Discovery | Desktop app reconnects via mDNS with a serial-log-IP fallback, no hard dependency on mDNS |
| Setup wizard | A developer with blank ESP32 + blank Uno and only the desktop app installed reaches connected Live Control with zero manual CLI steps |
| Flashing | Quick Flash requires no external toolchain; Developer Build only appears when a toolchain is actually detected |
| Device identity | Boards are tracked by chip ID; replugging a known board offers config restore |
| Validation | Every config change is validated on-device before being applied or persisted; invalid configs are rejected with a specific, actionable reason |
| Documentation | All files in Section 12 present and accurate |

---

## 14. How to Start

1. Confirm the Phase 1 system builds and runs as documented before adding anything —
   Phase 2 is additive, and a broken Phase 1 baseline will make every later phase
   here impossible to verify correctly.
2. Implement Phase 2's Section 11 phases in order. Phases 1–5 (ESP32/Arduino
   firmware side) can be fully verified with nothing but a serial monitor and a
   manual WebSocket test client — do this before writing any desktop app code, so
   protocol bugs are caught without a second layer of UI complexity on top.
3. Only after the firmware-side protocol is solid, build the desktop app shell
   (Phase 6) and work outward from there.
4. Do not add authentication, encryption, or additional transports in this phase —
   they're explicitly out of scope per Section 10 and the original Phase 1
   constraint on not over-building beyond what's asked.
