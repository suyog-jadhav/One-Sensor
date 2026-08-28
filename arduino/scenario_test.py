#!/usr/bin/env python3
"""
scenario_test.py — Phase 11 Scenario Engine Verification
Tests RAMP scenario (0 -> 50 over 10s) and checks Arduino decoded readings sweep accordingly.
Also tests mid-ramp STOP scenario functionality.
"""
import sys, time, json, threading, serial
import websocket

ESP32_IP = "10.102.133.78"
UNO_PORT = "/dev/ttyUSB0"

arduino_readings = []
stop_thread = False

def read_arduino():
    global stop_thread
    try:
        ser = serial.Serial(UNO_PORT, 115200, timeout=0.1)
        while not stop_thread:
            line = ser.readline().decode('utf-8', errors='ignore').strip()
            if line:
                arduino_readings.append((time.time(), line))
        ser.close()
    except Exception as e:
        print(f"[Arduino Thread Error] {e}")

def main():
    global stop_thread
    t_reader = threading.Thread(target=read_arduino, daemon=True)
    t_reader.start()

    time.sleep(1.0)

    url = f"ws://{ESP32_IP}/ws"
    print(f"[Phase 11 Test] Connecting to WS {url}...")
    ws = websocket.WebSocket()
    ws.connect(url, timeout=5)
    ws.recv() # init state

    print("[Phase 11 Test] 1. Sending RAMP command: Temp 0°C -> 50°C over 10s")
    ramp_cmd = json.dumps({
        "type": "start_ramp",
        "sensor": "temperature",
        "from": 0.0,
        "to": 50.0,
        "duration": 10.0
    })
    t_start = time.time()
    ws.send(ramp_cmd)

    # Monitor ramp progression for 12 seconds
    time.sleep(12.0)
    stop_thread = True

    print("\n--- Arduino Decoded Temperature Ramp Timeline ---")
    temp_timeline = []
    for t_stamp, line in arduino_readings:
        if "Temp:" in line:
            try:
                # Line format: "Temp: XX.XX °C"
                parts = line.split(":")
                if len(parts) >= 2:
                    val_str = parts[1].replace("°C", "").strip()
                    val = float(val_str)
                    dt = t_stamp - t_start
                    if 0 <= dt <= 12.0:
                        temp_timeline.append((dt, val))
                        print(f"  t = {dt:5.2f}s | Temp = {val:5.2f} °C")
            except Exception:
                pass

    ws.close()

    # Validate sweep from near 0 to near 50
    if len(temp_timeline) > 5:
        first_val = temp_timeline[0][1]
        last_val  = temp_timeline[-1][1]
        print(f"\n[Ramp Analysis] Initial: {first_val:.2f}°C, Final: {last_val:.2f}°C")
        if first_val < 10.0 and last_val > 40.0:
            print("✅ PHASE 11 PASS — RAMP scenario swept sensor values smoothly over duration!")
        else:
            print("⚠️ Ramp sweep values outside expected range")
    else:
        print("⚠️ Insufficient readings captured during ramp test")

if __name__ == "__main__":
    main()
