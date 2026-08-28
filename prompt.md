# OneSensor — Antigravity Agent Implementation Prompt

You are acting as a senior embedded systems / IoT engineer (ESP32 + Arduino AVR +
full-stack web). Implement **OneSensor**, a universal virtual sensor platform, as
described below. Read this entire document before writing any code. Where this
document gives you a constraint, follow it exactly; where it gives you a default,
you may change it if you document why in `docs/decisions.md`.

---

## 0. Non-Negotiable Constraints

| # | Constraint |
|---|---|
| 1 | Hardware = exactly 1× ESP32 DevKit (ESP32-WROOM-32), 1× Arduino Uno, jumper wires, USB cables, PC. No DAC, ADC, mux, RC filter, external sensor modules, I2C/SPI expanders, or any other IC. |
| 2 | All five v1 sensor channels transmit over **ESP32 hardware PWM (LEDC)** — not `digitalWrite`+`delay`, not the ESP32 DAC pins (GPIO25/26), not software PWM. |
| 3 | The Arduino decodes duty cycle by **timing the signal** (`pulseIn()` in v1). Never document or treat PWM duty cycle as a DC analog voltage. |
| 4 | Sensor-to-GPIO mapping (both ESP32 and Arduino sides) is **configuration data**, never hard-coded inside a sensor class or decoder class. |
| 5 | The public `OneSensor` Arduino API must not change shape even if the transport changes later (PWM → DAC/UART/etc.). |
| 6 | Build and verify in the phase order in Section 6. Do not start Phase *N+1* until Phase *N* is verified over Serial and noted in `docs/progress.md`. |

---

## 1. Project Objective

```text
PC Web Dashboard --Wi-Fi/WebSocket--> ESP32 --5x hardware PWM--> Arduino Uno --OneSensor library--> Application
```

A developer's Arduino sketch must be able to do exactly this, with no knowledge that
values are remotely generated:

```cpp
#include <OneSensor.h>
OneSensor sensor;

void setup() {
    Serial.begin(115200);
    sensor.begin();
}

void loop() {
    sensor.update();
    Serial.println(sensor.readTemperature());
    Serial.println(sensor.readHumidity());
    Serial.println(sensor.readGas());
    Serial.println(sensor.readLight());
    Serial.println(sensor.readSoilMoisture());
}
```

## 2. Sensors (v1) — configurable, not hard-coded

| Sensor | Default logical range | Default value at boot |
|---|---|---|
| Temperature | 0–50 °C | 25 |
| Humidity | 0–100 % | 50 |
| Gas | 0–1000 ppm | 300 |
| Light | 0–1000 lux | 500 |
| Soil Moisture | 0–100 % | 50 |

These live in one place (`hardware_config.h` on the ESP32 side, mirrored in the
Arduino library's `Calibration`/config header) as a table, not as literals sprinkled
through `.cpp` files.

## 3. GPIO & Signal Configuration Model

```cpp
enum class SensorType { TEMPERATURE, HUMIDITY, GAS, LIGHT, SOIL_MOISTURE };
enum class SignalType { PWM };            // future: DAC, DIGITAL, UART, I2C, SPI

struct ChannelConfig {
    SensorType sensor;
    SignalType signal;
    uint8_t    gpio;
    uint32_t   frequencyHz;
    uint8_t    resolutionBits;   // LEDC resolution, e.g. 10
    float      inputMin;
    float      inputMax;
};
```

- No sensor class or decoder class may reference a GPIO number directly. GPIO
  numbers exist only inside the config table and the hardware layer that reads it.
- Any valid combination of sensor→GPIO must work; there must be no code path that
  assumes, e.g., "Temperature is always GPIO16."

### 3.1 Valid ESP32 PWM (LEDC) GPIO pool

Restrict configurable GPIOs to safe, general-purpose pins and validate against this
pool at startup (exclude input-only pins 34–39, and flag strapping pins 0/2/15/12 as
"usable but caution" in documentation). Reject any configured GPIO not in the pool.

### 3.2 Startup validation (must run before any PWM channel starts)

Check for and clearly report via Serial, then halt PWM startup on failure:

```text
ERROR: GPIO 16 assigned to both GAS and LIGHT
ERROR: GPIO 41 is not a valid PWM-capable GPIO on this board
ERROR: GPIO 34 is input-only and cannot be used for PWM output
```

Validation must cover: duplicate GPIO across channels, GPIO outside the valid pool,
input-only GPIO, and any other configuration that would silently misbehave.

## 4. ESP32 Firmware Architecture

```text
WebSocket ─▶ SensorState (mutex-protected) ─▶ Value Mapper ─▶ PWM Manager (LEDC x5)
```

- **SensorState**: one struct holding the five current logical values. Written by
  the WebSocket message handler, read by the PWM update loop. Protect it with a
  FreeRTOS mutex or a short critical section — do not let a partially-written value
  reach the PWM layer.
- **Value Mapper**: one reusable function pair, used by all five channels:
  ```cpp
  float normalizeValue(float value, float inputMin, float inputMax);   // → 0.0–1.0, clamped
  float denormalizeValue(float normalized, float outputMin, float outputMax);
  ```
  Never duplicate this formula per-sensor.
- **PWM Manager / Channel Manager**: owns the five LEDC channels; on each loop
  iteration (or on state change), recomputes duty cycle from the current
  `SensorState` and calls `ledcWrite()`. Updating one channel must never stop,
  glitch, or block another.
- **Scenario Engine**: advances RAMP/STATIC scenario state on a timer and writes
  results into `SensorState` through the same path a WebSocket update would use —
  it must not reach into the PWM layer directly.

### 4.1 Suggested ESP32 project layout

```text
esp32/
├── platformio.ini
├── include/
│   ├── hardware_config.h     # ChannelConfig table lives here
│   ├── sensor_state.h
│   ├── value_mapper.h
│   ├── pwm_manager.h
│   ├── channel_manager.h
│   ├── websocket_server.h
│   ├── wifi_manager.h
│   └── scenario_engine.h
└── src/
    ├── main.cpp
    ├── wifi_manager.cpp
    ├── websocket_server.cpp
    ├── sensor_state.cpp
    ├── value_mapper.cpp
    ├── pwm_manager.cpp
    ├── channel_manager.cpp
    └── scenario_engine.cpp
```

### 4.2 Libraries (pick one stack and document the choice)

- WebSocket: `ESPAsyncWebServer` + `AsyncTCP` (non-blocking, event-driven — preferred
  over a blocking single-client library) — or `Links2004/WebSockets` if PlatformIO
  dependency resolution favors it. Either is acceptable; document the choice.
- JSON parsing: `ArduinoJson` (v6+). Do not hand-roll JSON parsing.
- Wi-Fi credentials: **never hard-code in source under version control.** Put them
  in a `secrets.h` that is `.gitignore`d, or load from `Preferences`/NVS. Document
  this requirement explicitly in `docs/installation.md`.

### 4.3 PWM frequency — pick a documented default, don't guess

Default to a **low frequency (recommend 500 Hz)** for v1, configurable per channel.
Reasoning to include in documentation: the Arduino decodes via `pulseIn()`, whose
practical timing floor (call overhead + `micros()` granularity) is on the order of
tens of microseconds. At 500 Hz the period is 2000 µs, giving comfortably wide
HIGH/LOW pulses at every duty cycle (including near 0%/100%) relative to that floor.
A much higher frequency (e.g. 5 kHz+) would shrink pulse widths until measurement
error becomes a large fraction of the pulse itself, especially at extreme duty
cycles — do not choose "the highest frequency LEDC supports" by default.

## 5. Arduino Side

### 5.1 Uno interrupt limitation — read before designing the decoder

The ATmega328P has only two true external-interrupt pins (D2/INT0, D3/INT1). Five
simultaneous PWM inputs cannot all get a hardware interrupt via `attachInterrupt()`.
For v1, use `pulseIn()` in a round-robin fashion across the five configured pins,
with a bounded timeout per call (e.g. 25 ms) so one missing/stuck signal cannot hang
the loop indefinitely. Document Pin-Change Interrupts (PCINT, covering all digital
pins in groups of 8) as the designed future replacement, and make sure the
`PwmDecoder` public interface (`begin`, `update`, `getDutyCycle`, `isValid`) would
not need to change when that swap happens — only its internals would.

### 5.2 PwmDecoder

```cpp
class PwmDecoder {
public:
    bool  begin(uint8_t pin);
    bool  update();          // takes one bounded-timeout measurement
    float getDutyCycle();    // 0.0–100.0
    float getFrequency();
    bool  isValid();         // false after N consecutive failed/timeout reads
};
```

Handle gracefully (never crash/reset the Uno): no signal present, 0% duty, 100%
duty, out-of-range period, and noisy/inconsistent readings. `isValid()` should
reflect recent read health, not just the last single sample.

### 5.3 OneSensor library layout

```text
OneSensor/
├── library.properties
├── src/
│   ├── OneSensor.h / .cpp          # public facade: begin(), update(), isConnected(), isValid()
│   ├── TemperatureSensor.h / .cpp
│   ├── HumiditySensor.h / .cpp
│   ├── GasSensor.h / .cpp
│   ├── LightSensor.h / .cpp
│   ├── SoilMoistureSensor.h / .cpp
│   ├── PwmDecoder.h / .cpp
│   ├── SignalDecoder.h / .cpp      # thin interface PwmDecoder implements, for future transports
│   ├── ArduinoChannelConfig.h      # {SensorType, pin} table — Arduino-side pin mapping
│   └── Calibration.h / .cpp        # offset/scale + normalize/denormalize, shared by all sensors
└── examples/
    └── BasicFiveSensors/BasicFiveSensors.ino
```

Sensor classes (`TemperatureSensor`, etc.) call into `OneSensor` core for a decoded,
calibrated value. They must never call `pulseIn`, touch a GPIO, or know about
WebSockets — those are core/decoder-layer responsibilities only.

### 5.4 Calibration layer (centralized, not per-sensor)

```cpp
struct CalibrationParams {
    float pwmMin = 0.0f, pwmMax = 100.0f;   // measured duty-cycle bounds
    float offset = 0.0f, scale = 1.0f;      // linear correction
};

float dutyToLogicalValue(float dutyPercent, const CalibrationParams& cal,
                          float outputMin, float outputMax);
```

One implementation, reused by all five sensor classes with different `CalibrationParams`
and output ranges — never five copies of the same formula.

## 6. WebSocket Protocol

ESP32 = WebSocket **server**. Message format is JSON via `ArduinoJson`.

```json
{ "type": "set_values", "temperature": 28.5, "humidity": 65.0, "gas": 420.0, "light": 750.0, "soil": 48.0 }
```

```json
{ "type": "set_value", "sensor": "temperature", "value": 30.2 }
```

Design the handler as a `type` dispatch so these are easy to add later without
touching unrelated code: `START_SCENARIO`, `STOP_SCENARIO`, `RESET`, `GET_STATUS`.

Reject and report (without crashing) malformed JSON, unknown `sensor` names, and
out-of-range `value`s — clamp or ignore per your documented policy, don't silently
propagate garbage to the PWM layer.

> **Security note (document, don't "fix"):** this prototype's WebSocket has no
> authentication — acceptable on an isolated dev Wi-Fi network for a prototype, but
> call it out explicitly in `docs/troubleshooting.md` as a known limitation, not an
> oversight.

## 7. Web Dashboard

Single-page app (plain HTML/JS is sufficient — no build step required) showing:

- Connection status (Wi-Fi/WebSocket)
- Slider **and** numeric input per sensor (Temperature, Humidity, Gas, Light, Soil),
  synced to each other and sending `set_value` on change without a page reload
- Current sensor values as last confirmed by the ESP32
- Basic scenario controls (start/stop a RAMP scenario) once Phase 11 is reached
- A log/status panel showing the raw ESP32 responses

## 8. Scenario Engine

v1 scenarios only:

| Scenario | Behavior |
|---|---|
| STATIC | Holds a sensor at a fixed value |
| RAMP | Linearly sweeps a sensor from A to B over a configured duration |

Architect the engine so adding "Heat Wave," "Gas Leak," "Random Fluctuation," etc.
later means adding a new scenario handler, not modifying the WebSocket layer or the
PWM layer. Scenario updates must go through `SensorState`, on a non-blocking timer
(e.g. `millis()`-based), never a `delay()` inside the main loop.

## 9. Diagnostics & Validation

- ESP32 Serial: Wi-Fi status/IP, WebSocket server status, current `SensorState`,
  current PWM duty per channel. Gate verbose per-loop logging behind a `DEBUG` flag —
  don't spam Serial every loop by default.
- Arduino Serial: decoded sensor values, and (behind a debug flag) per-channel duty
  cycle readout.
- Provide a simple expected-vs-received accuracy check: for each sensor, log
  `expected`, `received`, absolute error, and percent error. Do not claim a specific
  accuracy number in documentation until this has actually been run and recorded.

## 10. Build Order (do not skip ahead)

| Phase | Deliverable | Exit criterion before moving on |
|---|---|---|
| 1 | ESP32 emits one fixed-duty PWM signal (e.g. 50%) on one LEDC channel | Confirmed ~50% duty by an independent measurement |
| 2 | Arduino `PwmDecoder` reads that one signal via `pulseIn()` | Serial consistently reports ~50% across repeated reads |
| 3 | Map 0–50 °C onto that one channel via the value mapper | Setting 25 °C on ESP32 yields ~50% on Arduino |
| 4 | Wrap it as `OneSensor::readTemperature()` | The example sketch in Section 1 prints ~25.0 for temperature |
| 5 | Add Humidity, Gas, Light, Soil, each its own channel | Each verified independently like Temperature was |
| 6 | Run all five channels concurrently | Changing one sensor's value doesn't disturb the other four |
| 7 | ESP32 joins Wi-Fi | Serial prints an assigned IP |
| 8 | WebSocket server accepts connections | A manual test client connects and receives an ack/status |
| 9 | Dashboard built and connected | Slider move sends a `set_value` message the ESP32 logs |
| 10 | Live updates while running | Dragging a slider changes the Arduino's decoded value within ~1s |
| 11 | Scenario engine (STATIC, RAMP) | A RAMP visibly sweeps a value over its configured duration |
| 12 | Calibration + accuracy logging | Expected/received/error table exists for all five sensors |

At the end of each phase: implement → build → test on real hardware → record result
in `docs/progress.md` → only then start the next phase.

## 11. Documentation to Produce

Create a `docs/` folder with:

| File | Contents |
|---|---|
| `architecture.md` | System diagram, data flow, layer responsibilities |
| `wiring.md` | Text wiring diagram (ESP32 GPIO ↔ Arduino pin ↔ GND), explicitly stating the mapping is configurable and this is only the example used during development |
| `websocket-protocol.md` | Full message schema, current and planned `type` values |
| `library-api.md` | OneSensor public API reference |
| `installation.md` | PlatformIO/Arduino IDE setup, Wi-Fi credential handling, flashing both boards |
| `troubleshooting.md` | Known limitations (WebSocket auth, `pulseIn` timing bounds, Uno interrupt limits), common failure symptoms and fixes |
| `progress.md` | Phase-by-phase log of what was verified and how |
| `decisions.md` | Any point where you deviated from a default in this prompt, and why |

## 12. Code Quality Bar

Follow: single responsibility per file/class, small functions, one source of truth
for configuration, minimal global state, explicit error handling on every
network/parse/GPIO boundary, no magic numbers (name them and put them in config).

Avoid: a monolithic `main.cpp`, GPIO numbers hard-coded outside the config table,
duplicated normalize/denormalize math, blocking `delay()`-based network or scenario
loops, and software-bit-banged PWM anywhere in the ESP32 code.

## 13. Acceptance Criteria

| Area | Requirement |
|---|---|
| Hardware | ESP32 + Arduino Uno only, zero external components |
| Channels | 5 sensors, 5 independent hardware PWM signals, verified running concurrently |
| Configuration | Sensor↔GPIO mapping fully data-driven on both boards; validated at ESP32 startup with clear errors on conflict |
| Networking | Wi-Fi connects; WebSocket server operational; dashboard changes values with no page reload |
| Firmware | Hardware PWM only; non-blocking WebSocket/scenario handling; recoverable error handling throughout |
| Arduino | 5 independent decoders; correct duty-cycle measurement; a stuck/missing channel doesn't hang the others |
| Library | `OneSensor` with `begin()`, `update()`, `isConnected()`, `isValid()`, and all five `read*()` methods, matching the Section 1 example sketch as-is |
| Simulation | STATIC and RAMP scenarios both demonstrably work |
| Validation | Expected-vs-received accuracy table produced for all five sensors, with real measured numbers (not estimates) |
| Docs | All files in Section 11 present and accurate |

## 14. How to Start

1. Inspect any existing project structure (ESP32 firmware, Arduino code, dashboard,
   library, build config) before writing anything new. Reuse what is already correct
   and modular; do not rewrite working code for its own sake.
2. Implement Phase 1 only. Prove the single PWM channel end to end (Phases 1–4)
   before touching Wi-Fi, WebSocket, the dashboard, or the remaining four sensors.
3. Work through Phases 5–12 in order, updating `docs/progress.md` after each.
4. Do not implement DAC/UART/I2C/SPI transports now — keep the `SignalType` enum and
   `SignalDecoder` interface open for them, but ship PWM only in this prototype.
