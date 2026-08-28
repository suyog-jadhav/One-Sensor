# OneSensor — Project Context (Living Document)

> **Last Updated:** 2026-08-28  
> **Current Phase:** Phase 9 — Dashboard HTML  
> **Overall Status:** 🟢 Phases 1–8 verified. Phase 9 next.

---

## Project Summary

**OneSensor** is a virtual sensor platform that lets developers test Arduino sketches using simulated sensor values — no real sensors required. A web dashboard sends values over Wi-Fi/WebSocket to an ESP32, which encodes them as hardware PWM signals. The Arduino decodes those PWM signals and exposes them through a clean, sensor-like API (`sensor.readTemperature()`, etc.).

```
PC Browser ──WebSocket──▶ ESP32 ──5x PWM wires──▶ Arduino Uno ──OneSensor lib──▶ Sketch
```

---

## Hardware Constraints (Non-Negotiable)
- ✅ 1× ESP32-WROOM-32 DevKit
- ✅ 1× Arduino Uno
- ✅ Jumper wires + USB cables + PC
- ❌ No DAC, ADC, RC filter, mux, external sensors, I2C/SPI expanders

## Transport Mechanism
- ESP32 → LEDC hardware PWM (not `digitalWrite`+`delay`, not DAC pins)
- Arduino → `pulseIn()` round-robin (v1); PCINT upgrade documented for later
- PWM frequency default: **500 Hz** (period = 2000 µs, safe for `pulseIn()` timing)

---

## Five Sensor Channels (v1)

| Sensor | Logical Range | Default | GPIO (example) | Arduino Pin |
|---|---|---|---|---|
| Temperature | 0–50 °C | 25 °C | ESP32 GPIO16 | D2 |
| Humidity | 0–100 % | 50 % | ESP32 GPIO17 | D3 |
| Gas | 0–1000 ppm | 300 ppm | ESP32 GPIO18 | D4 |
| Light | 0–1000 lux | 500 lux | ESP32 GPIO19 | D5 |
| Soil Moisture | 0–100 % | 50 % | ESP32 GPIO21 | D6 |

> GPIO assignments are **config-table-driven** — they can be changed by editing `hardware_config.h` only.

---

## Phase Tracker

| # | Phase | Status | Verified |
|---|---|---|---|
| 1 | ESP32 outputs one fixed 50% PWM signal | ✅ Complete | ✅ |
| 2 | Arduino `PwmDecoder` reads that signal | ✅ Complete | ✅ |
| 3 | Value mapper: 0–50°C → 0–100% duty | ✅ Complete | ✅ |
| 4 | `OneSensor::readTemperature()` API works | ✅ Complete | ✅ |
| 5 | All 5 sensors added, each independently verified | ⬜ Not started | ⬜ |
| 6 | All 5 channels run concurrently without cross-talk | ⬜ Not started | ⬜ |
| 7 | ESP32 joins Wi-Fi, prints IP | ⬜ Not started | ⬜ |
| 8 | WebSocket server accepts connections | ⬜ Not started | ⬜ |
| 9 | Dashboard UI built and connected | ⬜ Not started | ⬜ |
| 10 | Live slider → Arduino value updates within ~1s | ⬜ Not started | ⬜ |
| 11 | Scenario engine: STATIC + RAMP | ⬜ Not started | ⬜ |
| 12 | Calibration + accuracy logging table | ⬜ Not started | ⬜ |

---

## Key Design Decisions

| Decision | Rationale |
|---|---|
| LEDC hardware PWM (not software) | Software PWM jitters, steals CPU from WebSocket task |
| `pulseIn()` round-robin in v1 | Uno only has 2 true interrupt pins; PCINT is the documented upgrade path |
| 500 Hz PWM frequency | `pulseIn()` overhead ~tens of µs; 500 Hz gives 2000 µs period — safe at all duty cycles |
| `SensorState` behind mutex | WebSocket callback and PWM update loop are different FreeRTOS tasks/cores |
| Calibration as a separate layer | Drift correction per-sensor doesn't touch other sensors' math |
| Wi-Fi creds never in source | `secrets.h` excluded via `.gitignore`, or loaded from ESP32 NVS |
| ESP32 as WebSocket server | Known IP on local Wi-Fi; browser connects to it without exposing anything back |

---

## Architecture Layers

```
┌─────────────────────────────────────────────────────────┐
│                   PC Web Dashboard                      │
│  Sliders + Numeric Inputs + Scenario Controls + Log     │
└─────────────────────────┬───────────────────────────────┘
                          │ WebSocket JSON
┌─────────────────────────▼───────────────────────────────┐
│                   ESP32 Firmware                        │
│  WS Server → SensorState (mutex) → ValueMapper → LEDC  │
│  ScenarioEngine writes into SensorState (same path)    │
└─────────────────────────┬───────────────────────────────┘
                          │ 5× PWM GPIO wires
┌─────────────────────────▼───────────────────────────────┐
│                  Arduino Uno Library                    │
│  PwmDecoder (pulseIn) → Calibration → SensorClasses    │
│  OneSensor facade: begin(), update(), read*()           │
└─────────────────────────────────────────────────────────┘
```

---

## Upcoming File/Folder Structure

```
One-Sensor/
├── esp32/
│   ├── platformio.ini
│   ├── include/
│   │   ├── hardware_config.h      ← ChannelConfig table
│   │   ├── sensor_state.h
│   │   ├── value_mapper.h
│   │   ├── pwm_manager.h
│   │   ├── channel_manager.h
│   │   ├── websocket_server.h
│   │   ├── wifi_manager.h
│   │   └── scenario_engine.h
│   └── src/
│       ├── main.cpp
│       ├── wifi_manager.cpp
│       ├── websocket_server.cpp
│       ├── sensor_state.cpp
│       ├── value_mapper.cpp
│       ├── pwm_manager.cpp
│       ├── channel_manager.cpp
│       └── scenario_engine.cpp
│
├── arduino/
│   └── OneSensor/
│       ├── library.properties
│       ├── src/
│       │   ├── OneSensor.h / .cpp
│       │   ├── TemperatureSensor.h / .cpp
│       │   ├── HumiditySensor.h / .cpp
│       │   ├── GasSensor.h / .cpp
│       │   ├── LightSensor.h / .cpp
│       │   ├── SoilMoistureSensor.h / .cpp
│       │   ├── PwmDecoder.h / .cpp
│       │   ├── SignalDecoder.h / .cpp
│       │   ├── ArduinoChannelConfig.h
│       │   └── Calibration.h / .cpp
│       └── examples/
│           └── BasicFiveSensors/BasicFiveSensors.ino
│
├── dashboard/
│   └── index.html
│
└── docs/
    ├── architecture.md
    ├── wiring.md
    ├── websocket-protocol.md
    ├── library-api.md
    ├── installation.md
    ├── troubleshooting.md
    ├── progress.md
    └── decisions.md
```

---

## WebSocket Protocol Summary

```json
// Bulk set
{ "type": "set_values", "temperature": 28.5, "humidity": 65.0, "gas": 420.0, "light": 750.0, "soil": 48.0 }

// Single set
{ "type": "set_value", "sensor": "temperature", "value": 30.2 }

// Future types (stub dispatcher now)
// "START_SCENARIO", "STOP_SCENARIO", "RESET", "GET_STATUS"
```

---

## Open Questions / Risks

| # | Item | Resolution |
|---|---|---|
| 1 | `pulseIn()` blocks briefly — at 5 sensors with 25 ms timeout, worst case = 125 ms round-trip per sensor | Documented; acceptable for v1; PCINT is the upgrade path |
| 2 | Wi-Fi credentials storage method | Use `secrets.h` + `.gitignore` for simplicity; NVS as optional upgrade |
| 3 | ESP32 LEDC timer sharing — 5 channels may need to share timers | LEDC has 4 timers; assign one timer per frequency group; all 5 share if same freq |
| 4 | Startup GPIO validation must run before any `ledcSetup()` call | Enforced in `channel_manager.cpp` init sequence |

---

## Notes for Agent Continuity

- **Never start Phase N+1 before Phase N is verified over Serial**
- Always record phase completion in `docs/progress.md`
- Any deviation from prompt defaults must be logged in `docs/decisions.md`
- Sensor classes must NEVER touch GPIO numbers or call `pulseIn()`
- GPIO numbers exist ONLY in `hardware_config.h` (ESP32) and `ArduinoChannelConfig.h` (Arduino)
