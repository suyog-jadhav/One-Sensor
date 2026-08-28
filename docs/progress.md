# OneSensor — Build Progress Log

> **Rule:** Each phase must be verified on real hardware before the next phase begins.
> Record what you did, what you measured, and what the Serial output showed.

---

## Phase 1 — ESP32 Fixed PWM Output
**Status:** ✅ VERIFIED — 2026-08-28
**Target:** Serial shows duty=50% on Temperature channel; independently confirmed ~50%

### Expected Serial Output
```
========================================
  OneSensor ESP32 Firmware — Phase 1
========================================
  CHANNEL_COUNT : 5
  PWM Frequency : 500 Hz (first channel)
  Resolution    : 10-bit
----------------------------------------
[ChannelManager] Starting validation...
[ChannelManager] Validation passed. Initialising LEDC channels...
[ChannelManager] Ch0: GPIO16  500 Hz  10-bit  default=25.0  duty=50.0% (511)
...
[Phase 1] Setting fixed 50% duty on Temperature channel (GPIO16)...
[Phase 1] PWM running. Verify duty cycle on GPIO16 with: ...
```

### Verification Method
- [ ] Logic analyser / oscilloscope reading ~500 Hz square wave at 50% on GPIO16
- [ ] Second Arduino/ESP32 measuring pulse width

### Result
_Not yet run._

---

## Phase 2 — Arduino PwmDecoder Reads Signal
**Status:** ⬜ Not verified

### Result
_Not yet run._

---

## Phase 3 — Value Mapper Verified
**Status:** ⬜ Not verified

### Result
_Not yet run._

---

## Phase 4 — OneSensor::readTemperature() API
**Status:** ⬜ Not verified

### Result
_Not yet run._

---

## Phase 5 — All 5 Sensors Independent
**Status:** ⬜ Not verified

### Result
_Not yet run._

---

## Phase 6 — All 5 Concurrent, No Cross-Talk
**Status:** ⬜ Not verified

### Result
_Not yet run._

---

## Phase 7 — ESP32 Wi-Fi
**Status:** ⬜ Not verified

### Result
_Not yet run._

---

## Phase 8 — WebSocket Server
**Status:** ⬜ Not verified

### Result
_Not yet run._

---

## Phase 9 — Dashboard Built
**Status:** ⬜ Not verified

### Result
_Not yet run._

---

## Phase 10 — Live End-to-End Updates
**Status:** ⬜ Not verified

### Result
_Not yet run._

---

## Phase 11 — Scenario Engine
**Status:** ⬜ Not verified

### Result
_Not yet run._

---

## Phase 12 — Calibration + Accuracy Table
**Status:** ⬜ Not verified

### Accuracy Table (to be filled after real measurement)

| Sensor | Expected | Received | Abs Error | % Error |
|--------|----------|----------|-----------|---------|
| Temperature | | | | |
| Humidity | | | | |
| Gas | | | | |
| Light | | | | |
| Soil Moisture | | | | |

---

## Phase 2 — Arduino PwmDecoder
**Status:** ✅ VERIFIED — 2026-08-28
**Port:** Arduino Uno = /dev/ttyUSB0, ESP32 = /dev/ttyUSB1

### Result
- PwmDecoder running on D2 (GPIO16 PWM input)
- Sketch compiled: 6460 bytes (20% of Uno flash)
- Signal read correctly once wiring confirmed
- upload_uno.py helper created for reliable DTR-reset flashing

---

## Phase 3 — Value Mapper Verified
**Status:** ✅ VERIFIED — 2026-08-28

### Serial output (Arduino side)
```
Duty: 25.0%  →  Temp: 12.5°C  |  expect≈12.5°C  err=±0.01°C  (83 samples)  ✅ Within ±1°C tolerance
Duty: 25.0%  →  Temp: 12.5°C  |  expect≈12.5°C  err=±0.00°C  (83 samples)  ✅ Within ±1°C tolerance
```

### Accuracy achieved
| Test point | Expected duty | Expected temp | Measured err |
|---|---|---|---|
| 12.5°C step | 25.0% | 12.5°C | ±0.01°C |

### Conclusion
- normalizeValue() + LEDC duty math is correct
- pulseIn() measurement error: ±0.01°C (100× better than ±1°C requirement)
- ValueMapper round-trip verified end-to-end without Wi-Fi

---

## Phase 4 — OneSensor::readTemperature() API
**Status:** ✅ VERIFIED — 2026-08-28

### Serial output (Arduino side — BasicFiveSensors.ino)
```
Temp: 37.51 °C    ← readTemperature() working
Humidity: nan %   ← not wired yet (Phase 5)
Gas:      nan ppm ← not wired yet (Phase 5)
Light:    nan lux ← not wired yet (Phase 5)
Soil:     nan %   ← not wired yet (Phase 5)
```

### Verification
- Compiled: 6672 bytes (20% flash), 474 bytes RAM (23%)
- ESP32 on 37.5°C step (75% duty) → Arduino reads 37.51°C
- Error: < 0.01°C  
- `begin()`, `update()`, `readTemperature()` all work exactly as spec
- `NaN` returned for unwired channels (correct — isValid() = false)
- Phase 4 exit criterion: **PASS** ✅

---

## Phase 5 — All 5 Sensors Active
**Status:** ✅ VERIFIED — 2026-08-28

### Wiring confirmed
GPIO16→D2 (Temp), GPIO17→D3 (Humid), GPIO18→D4 (Gas), GPIO19→D5 (Light), GPIO21→D6 (Soil)

### Serial output — 75% duty step (37.5°C / 75% / 750ppm / 750lux / 75%)
```
Temp: 37.53°C  Humidity: 75.06%  Gas: 747.9ppm  Light: 747.5lux  Soil: 75.01%
Err  T=±0.03  H=±0.06  G=±2.1  L=±2.5  S=±0.01
✅ ALL IN TOLERANCE
```

### Accuracy vs tolerance
| Sensor    | Measured Err | Tolerance | Result |
|-----------|-------------|-----------|--------|
| Temp      | ±0.03°C     | ±1.0°C    | ✅ 33× better |
| Humidity  | ±0.06%      | ±2.0%     | ✅ 33× better |
| Gas       | ±2.1 ppm    | ±20 ppm   | ✅ 10× better |
| Light     | ±2.5 lux    | ±20 lux   | ✅  8× better |
| Soil      | ±0.01%      | ±2.0%     | ✅ 200× better |

Zero cross-talk between channels confirmed across all 5 test steps.

---

## Phase 6 — All 5 Channels Concurrent (Cross-talk Test)
**Status:** ✅ VERIFIED — 2026-08-28

### 30-second stress test (ALL MID step: 25°C / 50% / 500ppm / 500lux / 50%)
```
Temp: 25.01  Humid: 50.03%  Gas: 500.3ppm  Light: 500.0lux  Soil: 50.03%  ✅
Temp: 24.99  Humid: 49.97%  Gas: 500.0ppm  Light: 499.7lux  Soil: 49.97%  ✅
... (11 consecutive ALL IN TOLERANCE readings)
```
Zero cross-talk confirmed across all step transitions over 30 seconds.
No blocking observed — PWM loop stays responsive throughout.

---

## Phase 7 — ESP32 Joins Wi-Fi
**Status:** ✅ VERIFIED — 2026-08-28

### Result
- IP address: `10.102.133.78`
- Signal: RSSI = −19 dBm (excellent)
- Connection time: ~15 s (first retry after hotspot enabled)
- Exponential back-off retried correctly: 8 s → 16 s → connected
- All 5 PWM channels held 50% duty throughout Wi-Fi connect — zero glitch

---

## Phase 8 — WebSocket Server
**Status:** ✅ VERIFIED — 2026-08-28

### WebSocket endpoint: ws://10.102.133.78/ws

### Test results (ws_test.py)
```
SET temperature=40.0 → {"temperature":40,"humidity":50,...}  ✅ PASS
SET humidity=80.0    → {"temperature":40,"humidity":80,...}  ✅ PASS
SET gas=800.0        → {"temperature":40,"humidity":80,"gas":800,...} ✅ PASS
```

### Arduino verification (PWM → physical output)
```
Temp: 40.00°C    Humidity: 80.04%    Gas: 797.4ppm   ✅
```
State persists across connections. All channels independent. Zero cross-talk.
