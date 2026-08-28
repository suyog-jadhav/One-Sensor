# OneSensor — Wiring Guide

> **Important:** The GPIO assignments below are **configurable**, not fixed.
> The example wiring below matches `hardware_config.h` and `ArduinoChannelConfig.h`
> as committed. To use different pins, change those two config files only.

## Signal Connections (ESP32 → Arduino Uno)

| Signal | ESP32 GPIO | Arduino Pin | Wire Colour (suggestion) |
|--------|-----------|-------------|--------------------------|
| Temperature | GPIO16 | D2 | Red |
| Humidity | GPIO17 | D3 | Orange |
| Gas | GPIO18 | D4 | Yellow |
| Light | GPIO19 | D5 | Green |
| Soil Moisture | GPIO21 | D6 | Blue |
| GND | GND | GND | Black |

## Ground Connection (Critical)
Both boards MUST share a common ground. Connect any ESP32 GND pin to any
Arduino GND pin with a jumper wire. Without this, the PWM signal has no
reference and pulseIn() will read garbage or time out.

## Notes
- The Arduino's digital input pins need no pull-up or pull-down resistors —
  the ESP32's LEDC output drives them directly.
- Maximum wire length tested: ~20 cm on a breadboard. Longer runs may
  introduce noise; keep wires short and away from the USB cables.
- The signal is 3.3 V logic from the ESP32. Arduino Uno digital inputs
  accept 3.3 V as a valid HIGH (threshold is ~2.0 V for the ATmega328P at 5 V).
