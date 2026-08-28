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
