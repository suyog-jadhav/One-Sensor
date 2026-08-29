# OneSensor First-Time Setup Wizard Documentation

This document describes the 6-step guided setup flow for first-time developers and system provisioning.

---

## Workflow Steps

### Step 1: Detect ESP32
- Enumerates connected USB serial ports using `serial_ports.py`.
- Identifies candidates using known USB bridge VIDs/PIDs:
  - CP2102 (`0x10C4:0xEA60`)
  - CH340 (`0x1A86:0x7523`)
  - FTDI (`0x0403:0x6001`)

### Step 2: Flash ESP32
- Flashes prebuilt merged binary `esp32/firmware.bin` at offset `0x0` using `esptool.py`.
- **Fallback Handling**: If automatic bootloader entry fails, displays instructions asking user to press and hold the `BOOT` button on the ESP32 dev board while flashing.

### Step 3: Provision Wi-Fi
- Collects Wi-Fi SSID, Password, and Device Name (mDNS).
- Executes Section 4.1 serial handshake:
  - Sends `{"ssid":"...","password":"...","deviceName":"..."}` over Serial.
  - Receives verbatim status responses (`{"status":"connecting"}`, `{"status":"connected", "ip": "...", "mdns": "..."}`).
  - Displays verbatim failure reasons on error (`auth_timeout`, `missing_ssid`).

### Step 4: Confirm Connection
- Verifies Wi-Fi status `connected` and assigned IP.
- Desktop app automatically switches transport from USB Serial to WebSocket (`ws://<esp32-ip>/ws`).

### Step 5: (Optional) Setup Arduino Uno
- Detects connected Arduino Uno board (`0x2341:0x0043` / `0x2341:0x0001`).
- Flashes prebuilt `.hex` binary via `arduino-cli` / `avrdude`.
- Provisions 5-channel pin mapping over serial (`{"channels":[...]}`).
- Skippable for single-board evaluation.

### Step 6: Land in Live Control
- Wizard completes and lands user in the connected Live Control dashboard.
