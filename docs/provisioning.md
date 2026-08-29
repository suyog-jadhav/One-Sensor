# OneSensor Serial Provisioning Protocol Specification

This document details the USB Serial provisioning handshakes used for first-time board setup and pin re-configuration.

---

## 1. Overview
Serial provisioning operates exclusively over the USB Serial interface (115200 8N1). It is strictly separated from the Wi-Fi/WebSocket control plane.

---

## 2. Arduino Uno Pin Provisioning (Section 4.2)

### Boot & Command Flow
1. On boot (or upon receiving the string `PROVISION` over serial), the Arduino prints:
   ```text
   ONESENSOR_ARDUINO_READY_FOR_PROVISIONING
   ```

2. The desktop application sends a single-line JSON payload:
   ```json
   {"channels":[{"sensor":"temperature","pin":2,"signal":"pwm"},{"sensor":"humidity","pin":3,"signal":"pwm"},{"sensor":"gas","pin":4,"signal":"pwm"},{"sensor":"light","pin":5,"signal":"pwm"},{"sensor":"soil_moisture","pin":6,"signal":"pwm"}]}
   ```

3. The Arduino validates the proposed pin assignments:
   - Checks that all 5 channels are present.
   - Rejects duplicate pin assignments.

4. Arduino responses:
   - **Success**: Writes to EEPROM and replies:
     ```json
     {"status":"saved"}
     ```
   - **Failure**: Returns exact reason and retains current EEPROM config:
     ```json
     {"status":"error","reason":"pin 2 assigned twice"}
     ```

---

## 3. ESP32 Wi-Fi & Device Provisioning (Section 4.1)

### Boot & Command Flow
1. On boot, if no valid Wi-Fi credentials exist in NVS (or after receiving `{"type":"reset_wifi"}`), the ESP32 prints:
   ```text
   ONESENSOR_READY_FOR_PROVISIONING
   ```

2. The desktop application sends a single-line JSON payload over serial:
   ```json
   {"ssid":"MyWifiNetwork","password":"MySecretPassword","deviceName":"onesensor-bench1"}
   ```

3. The ESP32 attempts Wi-Fi connection and responds over serial:
   - **Connecting**:
     ```json
     {"status":"connecting"}
     ```
   - **Connected**: Saves SSID, password, and device name to NVS, starts mDNS (`<deviceName>.local`), and replies:
     ```json
     {"status":"connected","ip":"192.168.1.42","mdns":"onesensor-bench1.local"}
     ```
   - **Failed**: Returns exact failure reason (e.g. `auth_timeout`, `ssid_not_found`):
     ```json
     {"status":"failed","reason":"auth_timeout"}
     ```
