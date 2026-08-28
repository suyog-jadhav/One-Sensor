#!/usr/bin/env python3
"""Read ESP32 serial for 20 seconds and print text lines only."""
import serial, time, sys

port = sys.argv[1] if len(sys.argv) > 1 else "/dev/ttyUSB1"
keywords = ["WiFi", "IP", "Connected", "RSSI", "address", "Timeout", "Retry",
            "Status", "duty", "Temp", "Humid", "Soil", "Gas", "Light"]

try:
    s = serial.Serial(port, 115200, timeout=1)
    deadline = time.time() + 20
    while time.time() < deadline:
        line = s.readline()
        try:
            text = line.decode("utf-8", errors="ignore").strip()
            if text:
                print(text)
        except Exception:
            pass
    s.close()
except Exception as e:
    print(f"Error: {e}")
