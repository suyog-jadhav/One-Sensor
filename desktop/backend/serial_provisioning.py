"""
serial_provisioning.py — Serial provisioning handshakes for ESP32 and Arduino Uno
"""
import time
import json
import serial

def provision_esp32_wifi(port: str, ssid: str, password: str, device_name: str, baudrate: int = 115200, timeout: float = 15.0):
    """
    Runs Section 4.1 serial Wi-Fi provisioning handshake with ESP32.
    """
    try:
        ser = serial.Serial(port, baudrate, timeout=2.0)
        time.sleep(0.5)
        
        # Flush initial boot logs
        ser.read_all()
        
        payload = json.dumps({"ssid": ssid, "password": password, "deviceName": device_name}) + "\n"
        ser.write(payload.encode('utf-8'))
        ser.flush()

        start_time = time.time()
        last_status = {"status": "connecting"}
        
        while time.time() - start_time < timeout:
            line = ser.readline().decode('utf-8', errors='ignore').strip()
            if not line:
                continue
                
            if line.startswith("{") and "status" in line:
                try:
                    data = json.loads(line)
                    status = data.get("status")
                    if status == "connected":
                        ser.close()
                        return {"success": True, "ip": data.get("ip"), "mdns": data.get("mdns"), "data": data}
                    elif status == "failed":
                        ser.close()
                        return {"success": False, "reason": data.get("reason", "unknown_error"), "data": data}
                    elif status == "connecting":
                        last_status = data
                except json.JSONDecodeError:
                    pass
        
        ser.close()
        return {"success": False, "reason": "auth_timeout", "data": last_status}
    except Exception as e:
        return {"success": False, "reason": str(e)}

def provision_arduino_pins(port: str, channels: list, baudrate: int = 115200, timeout: float = 5.0):
    """
    Runs Section 4.2 serial pin provisioning handshake with Arduino Uno.
    """
    try:
        ser = serial.Serial(port, baudrate, timeout=2.0)
        time.sleep(1.5)  # Wait for DTR reset
        
        ser.read_all()
        ser.write(b"PROVISION\n")
        ser.flush()
        
        time.sleep(0.3)
        
        payload = json.dumps({"channels": channels}) + "\n"
        ser.write(payload.encode('utf-8'))
        ser.flush()

        start_time = time.time()
        while time.time() - start_time < timeout:
            line = ser.readline().decode('utf-8', errors='ignore').strip()
            if not line:
                continue
                
            if line.startswith("{") and "status" in line:
                try:
                    data = json.loads(line)
                    status = data.get("status")
                    if status == "saved":
                        ser.close()
                        return {"success": True, "data": data}
                    elif status == "error":
                        ser.close()
                        return {"success": False, "reason": data.get("reason", "Unknown Arduino error"), "data": data}
                except json.JSONDecodeError:
                    pass
                    
        ser.close()
        return {"success": False, "reason": "provisioning_timeout"}
    except Exception as e:
        return {"success": False, "reason": str(e)}
