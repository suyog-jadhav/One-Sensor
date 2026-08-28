# OneSensor — Phase-Wise Implementation Plan

> **Rule:** No phase starts until the previous one is verified over Serial and logged in `docs/progress.md`.

---

## Phase 1 — ESP32: One Fixed PWM Signal
**Goal:** Prove the ESP32 can emit a stable hardware PWM signal at a known duty cycle.

### Deliverables
- `esp32/platformio.ini` — PlatformIO project config
- `esp32/include/hardware_config.h` — ChannelConfig table (1 channel only for now)
- `esp32/src/main.cpp` — minimal: init LEDC, output 50% on one GPIO, loop idle

### Exit Criterion
- Serial prints: `PWM Channel 0: GPIO=16, Freq=500Hz, Duty=50%`
- Confirmed ~50% by a second measurement (another ESP32/Arduino, or logic analyzer)

### Key Constraints
- Use `ledcSetup()` + `ledcAttachPin()` + `ledcWrite()` — no software PWM
- GPIO must be validated against safe pool before `ledcSetup()`
- No Wi-Fi, no WebSocket, no sensor math yet

---

## Phase 2 — Arduino: PwmDecoder Reads One Signal
**Goal:** Arduino measures the duty cycle from the Phase 1 PWM wire.

### Deliverables
- `arduino/OneSensor/src/PwmDecoder.h` — class interface
- `arduino/OneSensor/src/PwmDecoder.cpp` — `pulseIn()`-based implementation
- `arduino/OneSensor/src/ArduinoChannelConfig.h` — pin table (1 entry)
- Simple test sketch that prints duty cycle over Serial

### Exit Criterion
- With ESP32 outputting 50%, Arduino Serial consistently prints: `Duty: 50.x%`
- Readings are stable across 10+ consecutive reads
- Disconnected wire → `isValid()` returns false, no crash/hang

### Key Constraints
- `pulseIn()` timeout = 25 ms max per call
- `isValid()` based on N consecutive failures, not just last read
- No GPIO numbers inside `PwmDecoder` class — read from config table

---

## Phase 3 — Value Mapper: Logical Value → Duty Cycle
**Goal:** Map a physical sensor value (e.g. 25 °C) to a PWM duty cycle (50%) on ESP32, and verify Arduino receives the mapped duty.

### Deliverables
- `esp32/include/value_mapper.h` — `normalizeValue()` + `denormalizeValue()`
- `esp32/src/value_mapper.cpp` — single implementation, no per-sensor copies
- `esp32/include/sensor_state.h` — `SensorState` struct (all 5 fields, even if only 1 used)
- `esp32/src/sensor_state.cpp` — mutex init + thread-safe getter/setter

### Exit Criterion
- Set `temperature = 25.0` in code → ESP32 outputs ~50% duty → Arduino reads ~50%
- Set `temperature = 0.0` → ~0% duty; `temperature = 50.0` → ~100% duty
- Math verified: `normalizeValue(25.0, 0.0, 50.0) == 0.5`

### Key Constraints
- `normalizeValue` clamps output to [0.0, 1.0] — no out-of-range duty cycles
- One function, not one per sensor

---

## Phase 4 — Arduino: `OneSensor::readTemperature()` API
**Goal:** Wrap the decoder + calibration into the public `OneSensor` library API for temperature.

### Deliverables
- `arduino/OneSensor/src/Calibration.h / .cpp` — `dutyToLogicalValue()` + `CalibrationParams`
- `arduino/OneSensor/src/TemperatureSensor.h / .cpp`
- `arduino/OneSensor/src/SignalDecoder.h` — thin abstract interface
- `arduino/OneSensor/src/OneSensor.h / .cpp` — facade with `begin()`, `update()`, `readTemperature()`
- `arduino/OneSensor/examples/BasicFiveSensors/BasicFiveSensors.ino` (temperature only for now)
- `arduino/OneSensor/library.properties`

### Exit Criterion
- Example sketch compiles and uploads to Uno
- With ESP32 set to 25 °C, `sensor.readTemperature()` prints `~25.0`
- Matches the exact sketch format in prompt Section 1

### Key Constraints
- `TemperatureSensor` must NOT call `pulseIn()`, touch GPIO, or know about WebSocket
- `OneSensor` public API shape must not change in future phases

---

## Phase 5 — All 5 Sensors (Independent Verification)
**Goal:** Add Humidity, Gas, Light, Soil Moisture — each on its own GPIO/pin, each independently verified.

### Deliverables
- `hardware_config.h` updated: all 5 `ChannelConfig` entries
- `ArduinoChannelConfig.h` updated: all 5 pin entries
- `esp32/src/channel_manager.h / .cpp` — manages all 5 LEDC channels
- `arduino/OneSensor/src/` — all 5 sensor classes added
- `OneSensor` facade: all 5 `read*()` methods implemented

### Exit Criterion
- Each sensor tested individually: set value in ESP32 firmware → verify on Arduino Serial
- Humidity at 75% → ~75% duty → `readHumidity()` ≈ 75.0
- Gas at 500 ppm → ~50% duty → `readGas()` ≈ 500.0
- Light at 250 lux → ~25% duty → `readLight()` ≈ 250.0
- Soil at 80% → ~80% duty → `readSoilMoisture()` ≈ 80.0

---

## Phase 6 — All 5 Channels Concurrent
**Goal:** Run all 5 PWM channels simultaneously; confirm no cross-talk.

### Deliverables
- ESP32 `main.cpp` updated: all 5 channels running in parallel
- Arduino sketch: reads all 5 in round-robin loop, prints all values
- `docs/progress.md` — cross-talk test results logged

### Exit Criterion
- Changing temperature value does NOT affect humidity/gas/light/soil readings
- All 5 sensors stable within ±2% of expected duty across 30-second continuous run

### Key Constraints
- `channel_manager` update loop must touch all 5 channels without blocking
- Each `ledcWrite()` call is independent — one slow channel cannot block another

---

## Phase 7 — ESP32 Joins Wi-Fi
**Goal:** ESP32 connects to a local Wi-Fi network and prints its IP.

### Deliverables
- `esp32/include/wifi_manager.h` + `esp32/src/wifi_manager.cpp`
- `esp32/include/secrets.h` (gitignored template only)
- `.gitignore` — excludes `secrets.h`
- `docs/installation.md` — how to create `secrets.h` with SSID/password

### Exit Criterion
- Serial prints: `WiFi connected. IP: 192.168.x.x`
- PWM channels from Phase 6 continue running during/after Wi-Fi connect

### Key Constraints
- Credentials NEVER in source under version control
- Wi-Fi connect is non-blocking for PWM loop (use event callbacks or timeout)

---

## Phase 8 — WebSocket Server Accepts Connections
**Goal:** ESP32 WebSocket server is reachable; a manual test client connects and gets an ack.

### Deliverables
- `esp32/include/websocket_server.h` + `esp32/src/websocket_server.cpp`
- JSON message dispatcher: handles `set_value`, `set_values`, stubs for future types
- `SensorState` updates now go through WebSocket handler → mutex → PWM layer
- `docs/websocket-protocol.md`

### Exit Criterion
- Browser console: `new WebSocket("ws://ESP32_IP/ws")` → connection established
- Send `{"type":"set_value","sensor":"temperature","value":30.0}` → ESP32 Serial confirms receipt
- Malformed JSON → no crash, error message logged to Serial

### Key Constraints
- Use `ESPAsyncWebServer` + `AsyncTCP` (non-blocking, event-driven)
- Use `ArduinoJson` v6+ for parsing — no hand-rolled JSON
- WebSocket handler writes to `SensorState` via mutex; never touches LEDC directly

---

## Phase 9 — Web Dashboard Built & Connected
**Goal:** Single-page dashboard in `dashboard/index.html` connects to ESP32 and can control sensors.

### Deliverables
- `dashboard/index.html` — full SPA: sliders + numeric inputs per sensor, connection status, log panel
- Slider ↔ numeric input are synced
- `set_value` JSON sent on every change (no page reload)
- Last confirmed values displayed

### Exit Criterion
- Dashboard opens in browser, connects to ESP32 WebSocket
- Moving Temperature slider → WebSocket message sent → ESP32 logs it
- Connection status indicator works (connected/disconnected)

### Design Requirements
- Plain HTML/CSS/JS — no build step, no framework, no CDN required for offline use
- Responsive layout (works on mobile too)
- Premium UI: dark mode, smooth sliders, glassmorphism panels, live connection badge

---

## Phase 10 — Live Updates End-to-End
**Goal:** Dashboard slider change → Arduino decoded value changes within ~1 second.

### Deliverables
- `esp32/src/main.cpp` fully wired: WS → SensorState → ValueMapper → PWM (already in place, verify)
- Arduino sketch: continuous read loop, prints all 5 values every 500ms
- Latency validation: stopwatch from slider move to Serial value change

### Exit Criterion
- Dragging a slider on the dashboard changes the Arduino's decoded reading within ~1s
- No observed cross-talk between sensors during rapid slider movement
- Arduino loop continues normally if WebSocket disconnects temporarily

---

## Phase 11 — Scenario Engine (STATIC + RAMP)
**Goal:** Automated sensor value changes without user interaction.

### Deliverables
- `esp32/include/scenario_engine.h` + `esp32/src/scenario_engine.cpp`
- STATIC: holds a sensor at a value indefinitely
- RAMP: linearly sweeps sensor from A to B over N seconds using `millis()` timer
- WebSocket message types: `START_SCENARIO`, `STOP_SCENARIO`
- Dashboard: scenario start/stop controls per sensor

### Exit Criterion
- Start RAMP(temperature, from=0, to=50, duration=10s) → Arduino reading sweeps 0→50 over 10 seconds
- No `delay()` anywhere in scenario or main loop
- Stopping scenario mid-ramp halts sweep immediately

### Key Constraints
- ScenarioEngine writes to `SensorState` via same path as WebSocket handler
- Engine must NOT reach into PWM layer directly
- Adding new scenario types (Heat Wave, Gas Leak, etc.) = add one handler, no other files change

---

## Phase 12 — Calibration + Accuracy Logging
**Goal:** Measure and document the actual accuracy of the system.

### Deliverables
- `Calibration.h` — `CalibrationParams` with `offset` and `scale` fields, per-sensor
- `arduino/OneSensor/src/Calibration.cpp` — `dutyToLogicalValue()` with calibration applied
- Accuracy test script / sketch: for each sensor, set expected → read received → compute error
- `docs/progress.md` — table with real measured numbers for all 5 sensors:

```
| Sensor | Expected | Received | Abs Error | % Error |
|--------|----------|----------|-----------|---------|
| Temp   | 25.0 °C  | 24.8 °C  | 0.2       | 0.8%    |
| ...    | ...      | ...      | ...       | ...     |
```

### Exit Criterion
- Table exists with real measured numbers (not estimates)
- Calibration layer demonstrably reduces error vs. uncalibrated baseline
- All `docs/` files from Section 11 of prompt exist and are accurate

---

## Documentation Checklist

| File | Created | Accurate |
|---|---|---|
| `docs/architecture.md` | ✅ | ✅ |
| `docs/wiring.md` | ✅ | ✅ |
| `docs/websocket-protocol.md` | ✅ | ✅ |
| `docs/library-api.md` | ✅ | ✅ |
| `docs/installation.md` | ✅ | ✅ |
| `docs/troubleshooting.md` | ✅ | ✅ |
| `docs/progress.md` | ✅ | ✅ |
| `docs/decisions.md` | ✅ | ✅ |
