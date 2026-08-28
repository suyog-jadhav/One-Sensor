#!/usr/bin/env python3
"""
calibration_benchmark.py — Phase 12 Calibration & Accuracy Benchmarking Tool
Sets test values for all 5 sensors via WebSocket, reads Arduino's decoded values,
computes Absolute and Percentage errors, and outputs a formatted calibration table.
"""
import sys, time, json, threading, serial
import websocket

ESP32_IP = "10.102.133.78"
UNO_PORT = "/dev/ttyUSB0"

test_points = [
    # (name, sensor_key, set_val, min_val, max_val, unit)
    ("Temp 0%",   "temperature",   0.0,   0.0, 50.0,  "°C"),
    ("Temp 25%",  "temperature",  12.5,   0.0, 50.0,  "°C"),
    ("Temp 50%",  "temperature",  25.0,   0.0, 50.0,  "°C"),
    ("Temp 75%",  "temperature",  37.5,   0.0, 50.0,  "°C"),
    ("Temp 100%","temperature",  50.0,   0.0, 50.0,  "°C"),

    ("Humid 25%","humidity",     25.0,   0.0, 100.0, "%"),
    ("Humid 50%","humidity",     50.0,   0.0, 100.0, "%"),
    ("Humid 75%","humidity",     75.0,   0.0, 100.0, "%"),

    ("Gas 25%",  "gas",         250.0,   0.0, 1000.0,"ppm"),
    ("Gas 50%",  "gas",         500.0,   0.0, 1000.0,"ppm"),
    ("Gas 75%",  "gas",         750.0,   0.0, 1000.0,"ppm"),

    ("Light 25%","light",       250.0,   0.0, 1000.0,"lux"),
    ("Light 50%","light",       500.0,   0.0, 1000.0,"lux"),
    ("Light 75%","light",       750.0,   0.0, 1000.0,"lux"),

    ("Soil 25%", "soil_moisture",25.0,   0.0, 100.0, "%"),
    ("Soil 50%", "soil_moisture",50.0,   0.0, 100.0, "%"),
    ("Soil 75%", "soil_moisture",75.0,   0.0, 100.0, "%"),
]

def read_arduino_snapshot(ser, duration=1.5):
    readings = {}
    end_t = time.time() + duration
    while time.time() < end_t:
        line = ser.readline().decode('utf-8', errors='ignore').strip()
        if line:
            if "Temp:" in line:
                try: readings["temperature"] = float(line.split(":")[1].replace("°C","").strip())
                except: pass
            elif "Humidity:" in line:
                try: readings["humidity"] = float(line.split(":")[1].replace("%","").strip())
                except: pass
            elif "Gas:" in line:
                try: readings["gas"] = float(line.split(":")[1].replace("ppm","").strip())
                except: pass
            elif "Light:" in line:
                try: readings["light"] = float(line.split(":")[1].replace("lux","").strip())
                except: pass
            elif "Soil:" in line:
                try: readings["soil_moisture"] = float(line.split(":")[1].replace("%","").strip())
                except: pass
    return readings

def main():
    print("[Calibration Benchmark] Opening serial port to Arduino...")
    ser = serial.Serial(UNO_PORT, 115200, timeout=0.1)

    url = f"ws://{ESP32_IP}/ws"
    print(f"[Calibration Benchmark] Connecting to WebSocket {url}...")
    ws = websocket.WebSocket()
    ws.connect(url, timeout=5)
    ws.recv()

    results = []

    print("\n--- Running Multi-Point Accuracy Measurement ---")
    for name, sensor, set_val, min_val, max_val, unit in test_points:
        # Stop any scenario and set value
        ws.send(json.dumps({"type": "stop_all_scenarios"}))
        ws.send(json.dumps({"type": "set", "sensor": sensor, "value": set_val}))
        time.sleep(1.2) # wait for pulseIn reading to stabilize

        snapshot = read_arduino_snapshot(ser, duration=1.0)
        rec_val = snapshot.get(sensor, float('nan'))

        abs_err = abs(rec_val - set_val) if not sys.float_info.min > rec_val else 0.0
        range_span = max_val - min_val
        pct_err = (abs_err / range_span) * 100.0 if range_span > 0 else 0.0

        results.append({
            "name": name,
            "sensor": sensor,
            "expected": set_val,
            "received": rec_val,
            "abs_err": abs_err,
            "pct_err": pct_err,
            "unit": unit
        })
        print(f"  {name:<12} | Exp: {set_val:6.1f} {unit:<3} | Rec: {rec_val:6.1f} {unit:<3} | Abs Err: {abs_err:5.2f} | Error: {pct_err:4.2f}%")

    ser.close()
    ws.close()

    print("\n\n### Phase 12 Accuracy Results Table\n")
    print("| Test Point | Expected | Received | Abs Error | % Full Scale Error | Status |")
    print("|------------|----------|----------|-----------|--------------------|--------|")
    for r in results:
        status = "✅ PASS" if r["pct_err"] <= 2.0 else "⚠️ WARN"
        print(f"| {r['name']:<10} | {r['expected']:5.1f} {r['unit']} | {r['received']:5.1f} {r['unit']} | {r['abs_err']:5.2f} {r['unit']} | {r['pct_err']:5.2f}% | {status} |")

if __name__ == "__main__":
    main()
