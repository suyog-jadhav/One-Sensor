# Installation & Setup Guide

## Hardware Requirements
- ESP32-WROOM-32 Development Board
- Arduino Uno (ATmega328P)
- 6 DuPont jumper wires

## Wiring Table

| Signal | ESP32 Pin | Arduino Uno Pin |
|---|---|---|
| Temperature | GPIO16 | D2 |
| Humidity | GPIO17 | D3 |
| Gas | GPIO18 | D4 |
| Light | GPIO19 | D5 |
| Soil Moisture | GPIO21 | D6 |
| Common Ground | GND | GND |

## ESP32 Firmware Upload
1. Copy `esp32/include/secrets.h.template` to `esp32/include/secrets.h` and configure Wi-Fi credentials.
2. Flash using PlatformIO:
   ```bash
   cd esp32
   pio run --target upload
   ```

## Arduino Sketch Upload
1. Compile and upload using PlatformIO or `arduino-cli`:
   ```bash
   cd arduino/OneSensor/examples/BasicFiveSensors
   python3 ../../../upload_uno.py /dev/ttyUSB0 build/arduino.avr.uno/BasicFiveSensors.ino.hex
   ```

## Web Dashboard Access
Open `http://<ESP32_IP>/` in any browser on the same Wi-Fi network.
