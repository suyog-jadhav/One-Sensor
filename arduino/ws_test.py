#!/usr/bin/env python3
"""
ws_test.py — Phase 8 WebSocket verification
Connects to the ESP32 WebSocket, reads the initial state,
sends a set command, reads the response, then exits.

Usage: python3 ws_test.py <ip> <sensor> <value>
Example: python3 ws_test.py 10.102.133.78 temperature 40.0
"""
import sys, json, time
import websocket  # pip: websocket-client

def main():
    ip     = sys.argv[1] if len(sys.argv) > 1 else "10.102.133.78"
    sensor = sys.argv[2] if len(sys.argv) > 2 else "temperature"
    value  = float(sys.argv[3]) if len(sys.argv) > 3 else 40.0

    url = f"ws://{ip}/ws"
    print(f"[WS] Connecting to {url} ...")

    ws = websocket.WebSocket()
    ws.connect(url, timeout=5)
    print(f"[WS] Connected!")

    # Read initial state broadcast
    initial = ws.recv()
    print(f"[WS] ← Initial state: {initial}")

    # Send set command
    cmd = json.dumps({"type": "set", "sensor": sensor, "value": value})
    print(f"[WS] → Sending: {cmd}")
    ws.send(cmd)

    # Read state update response
    response = ws.recv()
    print(f"[WS] ← Response:      {response}")

    # Parse and validate
    data = json.loads(response)
    if data.get("type") == "state":
        actual = data.get(sensor if sensor != "soil_moisture" else "soil")
        print(f"\n[RESULT] {sensor} = {actual} (expected {value})")
        if actual is not None and abs(float(actual) - value) < 0.1:
            print("✅ PHASE 8 PASS — WebSocket set/get working correctly!")
        else:
            print(f"⚠️  Value mismatch — got {actual}, expected {value}")
    else:
        print(f"⚠️  Unexpected response type: {data.get('type')}")

    ws.close()

if __name__ == "__main__":
    main()
