# OneSensor Project Progress Log

## Phase Overview & Status Summary

| Phase | Description | Status | Verification Metric |
|---|---|---|---|
| 1 | ESP32 LEDC PWM Hardware Engine | ✅ Complete | 50% duty @ 500 Hz on GPIO16 |
| 2 | Arduino PwmDecoder (pulseIn) | ✅ Complete | Signal decoded on D2 |
| 3 | ValueMapper Round-Trip | ✅ Complete | ±0.01°C error |
| 4 | `OneSensor::readTemperature()` API | ✅ Complete | BasicFiveSensors.ino running |
| 5 | All 5 Sensors Live | ✅ Complete | All 5 channels reading in parallel |
| 6 | 5 Channels Concurrent Stress Test | ✅ Complete | 30s run, zero cross-talk |
| 7 | ESP32 Wi-Fi Connection | ✅ Complete | IP: 10.102.133.78, RSSI: −19 dBm |
| 8 | WebSocket Server (/ws) | ✅ Complete | Live set/get JSON protocol |
| 9 | Embedded Glassmorphism Dashboard | ✅ Complete | Single-page app served from ESP32 |
| 10 | End-to-End Live Updates | ✅ Complete | E2E update latency: 742.6 ms |
| 11 | Scenario Engine (STATIC + RAMP) | ✅ Complete | 10s RAMP sweep 0°C -> 50°C verified |
| 12 | Calibration & Accuracy Logging | ✅ Complete | 17-point accuracy benchmark PASSED |

---

## Phase 12 — Calibration + Accuracy Benchmark Results

Hardware benchmark performed across 17 test points covering all 5 sensors.

### Measured Accuracy Table

| Test Point | Expected | Received | Abs Error | % Full Scale Error | Status |
|------------|----------|----------|-----------|--------------------|--------|
| Temp 0%    |   0.0 °C |   0.0 °C |  0.00 °C  |  0.00%             | ✅ PASS |
| Temp 25%   |  12.5 °C |  12.6 °C |  0.09 °C  |  0.18%             | ✅ PASS |
| Temp 50%   |  25.0 °C |  25.0 °C |  0.00 °C  |  0.00%             | ✅ PASS |
| Temp 75%   |  37.5 °C |  37.5 °C |  0.01 °C  |  0.02%             | ✅ PASS |
| Temp 100%  |  50.0 °C |  50.0 °C |  0.00 °C  |  0.00%             | ✅ PASS |
| Humid 25%  |  25.0 %  |  25.1 %  |  0.15 %   |  0.15%             | ✅ PASS |
| Humid 50%  |  50.0 %  |  50.0 %  |  0.00 %   |  0.00%             | ✅ PASS |
| Humid 75%  |  75.0 %  |  75.0 %  |  0.03 %   |  0.03%             | ✅ PASS |
| Gas 25%    | 250.0 ppm| 251.5 ppm|  1.50 ppm |  0.15%             | ✅ PASS |
| Gas 50%    | 500.0 ppm| 500.3 ppm|  0.30 ppm |  0.03%             | ✅ PASS |
| Gas 75%    | 750.0 ppm| 750.1 ppm|  0.10 ppm |  0.01%             | ✅ PASS |
| Light 25%  | 250.0 lux| 251.4 lux|  1.40 lux |  0.14%             | ✅ PASS |
| Light 50%  | 500.0 lux| 499.7 lux|  0.30 lux |  0.03%             | ✅ PASS |
| Light 75%  | 750.0 lux| 750.1 lux|  0.10 lux |  0.01%             | ✅ PASS |
| Soil 25%   |  25.0 %  |  24.8 %  |  0.16 %   |  0.16%             | ✅ PASS |
| Soil 50%   |  50.0 %  |  50.0 %  |  0.03 %   |  0.03%             | ✅ PASS |
| Soil 75%   |  75.0 %  |  74.8 %  |  0.24 %   |  0.24%             | ✅ PASS |

**Max Full Scale Error**: **0.24%** (worst case across all test points)  
**Min Error**: **0.00%**  
**All 17 Test Points**: ✅ **100% PASS**
