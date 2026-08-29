"""
serial_ports.py — USB Serial port discovery with VID/PID board identification hints
"""
import serial.tools.list_ports

KNOWN_BRIDGES = {
    (0x10C4, 0xEA60): "ESP32 (CP2102)",
    (0x1A86, 0x7523): "ESP32/Arduino (CH340)",
    (0x0403, 0x6001): "ESP32/Arduino (FTDI)",
    (0x2341, 0x0043): "Arduino Uno (R3)",
    (0x2341, 0x0001): "Arduino Uno",
    (0x2A03, 0x0043): "Arduino Uno (org)",
}

def list_available_ports():
    """
    Returns a list of dictionaries with details for all available serial ports.
    """
    ports = serial.tools.list_ports.comports()
    result = []
    for port in ports:
        vid_pid = (port.vid, port.pid) if port.vid and port.pid else None
        hint = KNOWN_BRIDGES.get(vid_pid, "Generic Serial Device") if vid_pid else "Unknown Device"
        result.append({
            "device": port.device,
            "description": port.description,
            "hwid": port.hwid,
            "vid": hex(port.vid) if port.vid else None,
            "pid": hex(port.pid) if port.pid else None,
            "hint": hint,
            "is_esp32_candidate": "CP2102" in hint or "CH340" in hint or "FTDI" in hint,
            "is_arduino_candidate": "Arduino" in hint or "CH340" in hint
        })
    return result
