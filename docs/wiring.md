# OneSensor — Wiring Guide

> **Important:** The GPIO assignments below are **configurable**, not fixed.
> The example wiring below matches `hardware_config.h` and `ArduinoChannelConfig.h`
> as committed. To use different pins, change those two config files only.

## Signal Connections (ESP32 → Arduino Uno)

### Default PWM Transports

| Signal | ESP32 GPIO | Arduino Pin | Transport | Wire Colour (suggestion) |
|--------|-----------|-------------|-----------|--------------------------|
| Temperature | GPIO16 | D2 | PWM | Red |
| Humidity | GPIO17 | D3 | PWM | Orange |
| Gas | GPIO18 | D4 | PWM | Yellow |
| Light | GPIO19 | D5 | PWM | Green |
| Soil Moisture | GPIO21 | D6 | PWM | Blue |
| GND | GND | GND | Shared Reference | Black |

### Optional DAC Transports (ESP32 Hardware DAC)

The ESP32 includes two 8-bit DAC output pins. To configure any channel for analog DAC output:
1. Set `SignalType::DAC` in `hardware_config.h` (ESP32) and `ArduinoChannelConfig.h` (Arduino).
2. Wire the ESP32 DAC pin to an Arduino **Analog Input** pin.

| ESP32 DAC Pin | Hardware Channel | Recommended Arduino Pin | Voltage Range |
|---------------|------------------|------------------------|---------------|
| **GPIO25** | DAC1 | **A0** | 0.0 V – 3.3 V |
| **GPIO26** | DAC2 | **A1** | 0.0 V – 3.3 V |

## Ground Connection (Critical)
Both boards MUST share a common ground. Connect any ESP32 GND pin to any
Arduino GND pin with a jumper wire. Without this, signal measurements (PWM pulses or DAC analog voltages) have no reference and reads will be invalid.

## Notes
- The Arduino's digital input pins need no pull-up or pull-down resistors —
  the ESP32's LEDC output drives them directly.
- Arduino Uno's standard ADC reference is 5.0 V (0–1023 count range). The ESP32's 3.3 V DAC maximum output maps to an ADC reading of ~675. `DacDecoder` automatically normalizes this scale.
- Maximum wire length tested: ~20 cm on a breadboard. Keep wires short and away from noise sources.
