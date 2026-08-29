"""
app.py — FastAPI backend sidecar application exposing WebSocket IPC & hardware management
"""
import os
import sys
import json
import asyncio
import subprocess
import time
import serial
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from serial_ports import list_available_ports
from serial_provisioning import provision_esp32_wifi, provision_arduino_pins
from flash_esp32 import flash_esp32_firmware, get_esp32_chip_id
from flash_arduino import flash_arduino_firmware, check_arduino_cli, check_avrdude
from discovery import discover_esp32_mdns
from device_ws_client import DeviceWSClient, get_last_ip
from device_registry import get_device_profile, save_device_profile
from serial_monitor import SerialMonitor

app = FastAPI(title="OneSensor Desktop Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

frontend_clients = set()
device_client = None

async def broadcast_to_frontend(data: dict):
    message = json.dumps(data)
    disconnected = set()
    for client in frontend_clients:
        try:
            await client.send_text(message)
        except Exception:
            disconnected.add(client)
    for client in disconnected:
        frontend_clients.remove(client)

device_client = DeviceWSClient(broadcast_callback=broadcast_to_frontend)
serial_monitor = SerialMonitor(broadcast_callback=broadcast_to_frontend)

@app.on_event("startup")
async def on_startup():
    """Auto-connect to last-used ESP32 IP on backend startup."""
    last_ip = get_last_ip()
    if last_ip:
        print(f"[Startup] Auto-connecting to last ESP32 IP: {last_ip}")
        device_client.start_connection(last_ip)

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    frontend_clients.add(websocket)
    print("[Backend] Frontend WebSocket client connected.")
    
    try:
        while True:
            text = await websocket.receive_text()
            try:
                data = json.loads(text)
                msg_type = data.get("type", "")
                
                if msg_type in ["set", "set_value", "start_ramp", "start_static", "stop_scenario", "stop_all_scenarios", "get_config", "set_config", "reset_config"]:
                    await device_client.send(data)
            except json.JSONDecodeError:
                pass
    except WebSocketDisconnect:
        frontend_clients.remove(websocket)
        print("[Backend] Frontend WebSocket client disconnected.")

@app.get("/api/ports")
def get_ports():
    return {"ports": list_available_ports()}

class StartSerialMonitorRequest(BaseModel):
    port: str
    baudrate: int = 115200
    device: str = "esp32"   # 'esp32' | 'arduino'

@app.post("/api/serial/start")
async def start_serial_monitor(req: StartSerialMonitorRequest):
    success, msg = serial_monitor.start(req.port, req.baudrate, device=req.device)
    if success:
        return {"success": True, "port": req.port, "baudrate": req.baudrate, "device": req.device, "message": msg}
    else:
        return {"success": False, "reason": msg}

class StopSerialMonitorRequest(BaseModel):
    device: str = "esp32"   # 'esp32' | 'arduino' | 'all'

@app.post("/api/serial/stop")
async def stop_serial_monitor(req: StopSerialMonitorRequest):
    if req.device == "all":
        serial_monitor.stop_all()
    else:
        serial_monitor.stop(req.device)
    return {"success": True}

@app.get("/api/serial/status")
def serial_monitor_status():
    return {"monitors": serial_monitor.status()}



@app.get("/api/toolchain")
def get_toolchain_status():

    import shutil
    has_pio = shutil.which("pio") is not None
    has_arduino_cli = check_arduino_cli()
    return {
        "developer_build_available": has_pio or has_arduino_cli,
        "platformio": has_pio,
        "arduino_cli": has_arduino_cli,
        "avrdude": check_avrdude()
    }

class ESP32ProvisionRequest(BaseModel):
    port: str
    ssid: str
    password: str
    deviceName: str = "onesensor"

@app.post("/api/provision/esp32")
async def provision_esp32(req: ESP32ProvisionRequest):
    result = provision_esp32_wifi(req.port, req.ssid, req.password, req.deviceName)
    if result.get("success") and result.get("ip"):
        device_client.start_connection(result["ip"])
    return result

class ArduinoProvisionRequest(BaseModel):
    port: str
    channels: list

@app.post("/api/provision/arduino")
def provision_arduino(req: ArduinoProvisionRequest):
    return provision_arduino_pins(req.port, req.channels)

BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.abspath(os.path.join(BACKEND_DIR, "..", ".."))
ESP32_DIR    = os.path.join(PROJECT_ROOT, "esp32")
SECRETS_H    = os.path.join(ESP32_DIR, "include", "secrets.h")

class FlashESP32Request(BaseModel):
    port: str

@app.post("/api/flash/esp32")
def flash_esp32(req: FlashESP32Request):

    candidates = [
        os.path.join(PROJECT_ROOT, "esp32", ".pio", "build", "esp32dev", "firmware.bin"),
        os.path.join(PROJECT_ROOT, "esp32", "firmware.bin"),
        os.path.abspath("../esp32/.pio/build/esp32dev/firmware.bin"),
        os.path.abspath("esp32/.pio/build/esp32dev/firmware.bin")
    ]
    firmware_path = None
    for cand in candidates:
        if os.path.exists(cand):
            firmware_path = cand
            break

    if not firmware_path:
        return {"success": False, "reason": f"Firmware file not found. Checked: {candidates[0]}"}

    return flash_esp32_firmware(req.port, firmware_path)


# ── Build & Flash with embedded Wi-Fi credentials ────────────────────────────
class BuildFlashESP32Request(BaseModel):
    port: str
    ssid: str
    password: str
    device_name: str = "onesensor"

@app.post("/api/build_flash_esp32")
async def build_flash_esp32(req: BuildFlashESP32Request):
    """Write Wi-Fi credentials to secrets.h, compile with PlatformIO,
    flash via esptool, then read serial to capture the assigned IP."""

    # 1. Write secrets.h
    try:
        secrets_content = (
            f'/**\n'
            f' * secrets.h — auto-generated by OneSensor Desktop. Do not commit.\n'
            f' */\n'
            f'#pragma once\n\n'
            f'#define WIFI_SSID     "{req.ssid}"\n'
            f'#define WIFI_PASSWORD "{req.password}"\n'
        )
        with open(SECRETS_H, "w") as f:
            f.write(secrets_content)
    except Exception as e:
        return {"success": False, "stage": "write_secrets", "reason": str(e)}

    # 2. Compile with PlatformIO
    pio_exe = "pio"
    try:
        build_result = subprocess.run(
            [pio_exe, "run"],
            cwd=ESP32_DIR,
            capture_output=True,
            text=True,
            timeout=120
        )
        if build_result.returncode != 0:
            return {
                "success": False,
                "stage": "build",
                "reason": build_result.stderr[-800:] or build_result.stdout[-800:]
            }
    except FileNotFoundError:
        return {"success": False, "stage": "build", "reason": "PlatformIO (pio) not found. Please install it first."}
    except subprocess.TimeoutExpired:
        return {"success": False, "stage": "build", "reason": "Build timed out after 120 seconds."}
    except Exception as e:
        return {"success": False, "stage": "build", "reason": str(e)}

    # 3. Flash via esptool (bootloader + partitions + app at correct offsets)
    firmware_bin   = os.path.join(ESP32_DIR, ".pio", "build", "esp32dev", "firmware.bin")
    bootloader_bin = os.path.join(ESP32_DIR, ".pio", "build", "esp32dev", "bootloader.bin")
    partitions_bin = os.path.join(ESP32_DIR, ".pio", "build", "esp32dev", "partitions.bin")

    if not os.path.exists(firmware_bin):
        return {"success": False, "stage": "flash", "reason": f"Compiled firmware not found: {firmware_bin}"}

    flash_args = [
        sys.executable, "-m", "esptool",
        "--chip", "esp32",
        "--port", req.port,
        "--baud", "460800",
        "--before", "default-reset",
        "--after", "hard-reset",
        "write-flash", "-z",
    ]
    if os.path.exists(bootloader_bin) and os.path.exists(partitions_bin):
        flash_args += [
            "0x1000",  bootloader_bin,
            "0x8000",  partitions_bin,
            "0x10000", firmware_bin,
        ]
    else:
        flash_args += ["0x0", firmware_bin]

    try:
        flash_result = subprocess.run(
            flash_args, capture_output=True, text=True, timeout=90
        )
        if flash_result.returncode != 0:
            return {
                "success": False,
                "stage": "flash",
                "reason": (flash_result.stderr or flash_result.stdout)[-800:]
            }
    except subprocess.TimeoutExpired:
        return {"success": False, "stage": "flash", "reason": "Flash timed out."}
    except Exception as e:
        return {"success": False, "stage": "flash", "reason": str(e)}

    # 4. Read serial output to capture IP
    ip_address = None
    try:
        ser = serial.Serial(req.port, 115200, timeout=1)
        ser.dtr = False
        ser.rts = False
        deadline = time.time() + 18  # wait up to 18s for connection
        while time.time() < deadline:
            raw = ser.readline()
            line = raw.decode("utf-8", errors="ignore").strip()
            if "IP address:" in line:
                ip_address = line.split("IP address:")[-1].strip()
                break
        ser.close()
    except Exception:
        pass  # IP capture is best-effort

    if ip_address:
        device_client.start_connection(ip_address)
        return {"success": True, "ip": ip_address, "device_name": req.device_name}
    else:
        # Flash succeeded but couldn't read IP — user can connect manually
        return {
            "success": True,
            "ip": None,
            "device_name": req.device_name,
            "note": "Flashed successfully but could not auto-detect IP. Use mDNS (onesensor.local) or enter IP manually."
        }


@app.get("/api/esp32_status")
def esp32_status():
    """Returns whether the backend is currently connected to the ESP32."""
    return {
        "connected": device_client.is_connected,
        "ip": device_client.esp32_ip
    }


class ConnectESP32Request(BaseModel):
    ip: str

@app.post("/api/connect_esp32")
async def connect_esp32(req: ConnectESP32Request):
    device_client.start_connection(req.ip)
    return {"success": True, "ip": req.ip}


@app.get("/api/discover")
def discover():
    return {"devices": discover_esp32_mdns()}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)
