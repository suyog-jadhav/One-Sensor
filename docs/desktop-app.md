# OneSensor Desktop Application Documentation

This document describes the desktop control suite, its module architecture, frontend-backend communication, and developer instructions.

---

## Stack & Architecture

| Layer | Choice | Role |
|---|---|---|
| Frontend | React + Vite + Vanilla CSS | Modern responsive control dashboard, setup wizard, and configuration interface |
| Backend | Python FastAPI / Uvicorn | Hardware interaction (serial ports, esptool, avrdude, WS proxy, device registry) |
| IPC Transport | WebSocket (`ws://127.0.0.1:8000/ws`) + REST APIs | Real-time bi-directional telemetry stream & hardware action requests |

---

## Backend Modules (`desktop/backend/`)

- `app.py`: FastAPI server application exposing REST endpoints and local WebSocket endpoint `/ws`.
- `device_ws_client.py`: Async WebSocket client connecting to ESP32 (`ws://<esp32-ip>/ws`), bridging state & config state broadcasts to frontend.
- `serial_ports.py`: Pyserial device discovery with USB VID/PID hint detection (CP2102, CH340, FTDI, Arduino Uno).
- `serial_provisioning.py`: Section 4.1 (ESP32 Wi-Fi serial handshake) & Section 4.2 (Arduino pin config serial handshake).
- `serial_monitor.py`: Async USB Serial reader streaming real-time ESP32 serial logs over WebSocket to the dashboard.
- `flash_esp32.py`: Imports `esptool.py` directly as a library to flash merged `firmware.bin` at offset `0x0`.
- `flash_arduino.py`: Subprocess wrapper around `arduino-cli` / `avrdude` for uploading `.hex` to Arduino Uno.
- `discovery.py`: mDNS LAN discovery for `<deviceName>.local` ESP32 nodes.
- `device_registry.py`: Hardware chip ID tracking and configuration profile storage (`~/.onesensor_registry.json`).

---

## Frontend Layout (`desktop/frontend/src/`)

- `components/LiveControl.jsx`: 5-channel real-time controls (sliders, numeric steppers, live telemetry values).
- `components/ConfigEditor.jsx`: Channel pin mapping & calibration table. Round-trips via WebSocket `set_config` and displays on-device validation errors.
- `components/ScenarioBuilder.jsx`: Generator for synthetic RAMP sweeps and STATIC value targets.
- `components/FlashPanel.jsx`: Quick Flash prebuilt binaries & Developer Build toolchain indicator.
- `components/SetupWizard.jsx`: Guided 6-step first-time setup flow.
- `components/ConsoleLog.jsx`: Real-time ESP32 Serial Monitor stream (port selection, baud rate control, auto-scroll) combined with WebSocket traffic and event log.


---

## Running in Development Mode

### 1. Start Python Backend Sidecar
```bash
cd desktop/backend
pip install -r requirements.txt
python app.py
```
Backend runs at `http://127.0.0.1:8000`.

### 2. Start Frontend Dev Server
```bash
cd desktop/frontend
npm install
npm run dev
```
Frontend opens at `http://localhost:3000`.
