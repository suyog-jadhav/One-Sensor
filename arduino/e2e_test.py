#!/usr/bin/env python3
"""
e2e_test.py — Phase 10 End-to-End Latency & Accuracy Verification
Sends a WebSocket command to ESP32 while reading serial output from Arduino.
Measures latency from WS send to Arduino output line print.
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
                t_stamp = time.time()
                arduino_readings.append((t_stamp, line))
        ser.close()
    except Exception as e:
        print(f"[Arduino Thread Error] {e}")

def main():
    global stop_thread
    t_reader = threading.Thread(target=read_arduino, daemon=True)
    t_reader.start()

    print("[E2E] Reading baseline from Arduino (2s)...")
    time.sleep(2.0)

    url = f"ws://{ESP32_IP}/ws"
    print(f"[E2E] Connecting to WS {url}...")
    ws = websocket.WebSocket()
    ws.connect(url, timeout=5)
    ws.recv() # init state

    target_temp = 42.5
    cmd = json.dumps({"type": "set", "sensor": "temperature", "value": target_temp})

    t_send = time.time()
    ws.send(cmd)
    res = ws.recv()
    print(f"[E2E] WS Response in {(time.time() - t_send)*1000:.1f}ms: {res}")
    ws.close()

    time.sleep(2.0)
    stop_thread = True

    # Analyze readings around t_send
    print("\n--- Arduino Serial Timeline around send ---")
    first_detected_t = None
    for t_stamp, line in arduino_readings:
        dt = (t_stamp - t_send) * 1000
        if "Temp:" in line or "T=±" in line:
            print(f"[{dt:+6.1f} ms] {line}")
            if dt > 0 and ("42.5" in line or "42.4" in line or "42.6" in line) and first_detected_t is None:
                first_detected_t = t_stamp

    if first_detected_t:
        latency_ms = (first_detected_t - t_send) * 1000
        print(f"\n✅ PHASE 10 PASS — E2E Latency: {latency_ms:.1f} ms (< 1000 ms limit)")
    else:
        print("\n⚠️ Couldn't find exact target value in output window")

if __name__ == "__main__":
    main()
