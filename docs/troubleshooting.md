# OneSensor — Troubleshooting & Known Limitations

## Known Limitations

### 1. WebSocket Has No Authentication
The WebSocket server accepts any client on the local network.
This is **by design for a dev prototype** on an isolated Wi-Fi network.
Do not deploy this on a production or shared network without adding authentication.
This is not an oversight — it is a documented tradeoff.

### 2. `pulseIn()` Timing Bounds (Arduino)
`pulseIn()` has a practical timing floor of ~tens of microseconds (call overhead
+ `micros()` 4 µs granularity on AVR). At 500 Hz (period = 2000 µs), this
represents ~2–5% potential error near 0% and 100% duty cycles.
Mid-range values (20–80%) will be more accurate.
The documented upgrade path is Pin-Change Interrupts (PCINT) — see below.

### 3. Arduino Uno Interrupt Pin Limitation
The ATmega328P has only 2 true external interrupt pins (D2/INT0, D3/INT1).
v1 uses `pulseIn()` on any digital pin, avoiding this constraint.
The v2 upgrade path is the `PinChangeInterrupt` library (covers all digital pins
in groups of 8 via PCINT). Only `PwmDecoder` internals need to change — the
public API (`begin`, `update`, `getDutyCycle`, `isValid`) stays the same.

### 4. `update()` Blocks for Up to 125 ms (5 channels × 25 ms timeout)
If one channel's signal is missing, its `pulseIn()` call waits the full 25 ms
timeout before returning 0. With 5 channels, worst-case blocking is 125 ms.
Mitigation: `isValid()` will return false for that channel after VALIDITY_WINDOW
failures; the sketch can skip printing for invalid channels.

---

## Common Failure Symptoms

| Symptom | Likely Cause | Fix |
|---------|-------------|-----|
| Arduino prints `0.00` or `NAN` | ESP32 not outputting PWM, or wiring fault | Check ESP32 Serial — does it show duty%? Check GND connection |
| Duty reads ~0% always | DC-LOW line — ESP32 not outputting | Verify ESP32 is flashed and running |
| Duty reads ~100% always | DC-HIGH line — pulseIn measuring only one phase | Check `lowUs` in PwmDecoder; verify both edges are present |
| Readings erratic / noisy | Wires too long, or no common ground | Shorten wires; verify GND jumper |
| `ChannelManager] ERROR: GPIO xx assigned to both...` | Duplicate GPIO in `hardware_config.h` | Fix the config table |
| ESP32 doesn't connect to Wi-Fi | Wrong SSID/password in secrets.h | Re-check secrets.h; verify 2.4 GHz network |
| WebSocket connects then drops | ESP32 rebooting (stack overflow, watchdog) | Check Serial for crash dump; reduce stack usage |
