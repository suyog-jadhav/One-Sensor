#!/usr/bin/env python3
"""
upload_uno.py — DTR-pulse reset + avrdude upload for Arduino Uno / FT232R clones

Usage:
    python3 upload_uno.py <port> <hex_file>

Example:
    python3 upload_uno.py /dev/ttyUSB1 build/arduino.avr.uno/Phase2_PwmDecoderTest.ino.hex

How it works:
    Some Arduino Uno clones with FT232R chips don't reliably respond to avrdude's
    built-in DTR toggle. This script manually pulses DTR (which triggers the reset
    circuit on the Uno) then immediately launches avrdude within the 1-second
    bootloader window.
"""

import sys
import time
import subprocess
import os
import serial  # pyserial

AVRDUDE     = os.path.expanduser(
    "~/.arduino15/packages/arduino/tools/avrdude/8.0.0-arduino1/bin/avrdude")
AVRDUDE_CONF = os.path.expanduser(
    "~/.arduino15/packages/arduino/tools/avrdude/8.0.0-arduino1/etc/avrdude.conf")

def pulse_dtr(port: str, baud: int = 115200, pulse_ms: int = 100):
    """Open port, pull DTR LOW then HIGH to trigger bootloader reset."""
    print(f"[reset] Opening {port} to pulse DTR...", flush=True)
    try:
        s = serial.Serial(port, baud, timeout=0.1)
        s.setDTR(False)          # pull LOW → Uno reset pin goes LOW
        time.sleep(pulse_ms / 1000.0)
        s.setDTR(True)           # back HIGH → Uno releases reset, bootloader starts
        time.sleep(0.05)
        s.close()
        print(f"[reset] DTR pulsed. Bootloader window: ~1 second.", flush=True)
    except Exception as e:
        print(f"[reset] WARNING: {e}", flush=True)

def upload(port: str, hex_file: str):
    """Run avrdude immediately after DTR pulse."""
    cmd = [
        AVRDUDE,
        f"-C{AVRDUDE_CONF}",
        "-v",
        "-patmega328p",
        "-carduino",
        f"-P{port}",
        "-b115200",
        "-D",
        f"-Uflash:w:{hex_file}:i",
    ]
    print(f"[avrdude] Uploading {hex_file} → {port}", flush=True)
    result = subprocess.run(cmd, capture_output=False)
    return result.returncode

def main():
    if len(sys.argv) < 3:
        print(f"Usage: {sys.argv[0]} <port> <hex_file>")
        sys.exit(1)

    port     = sys.argv[1]
    hex_file = sys.argv[2]

    if not os.path.exists(hex_file):
        print(f"ERROR: hex file not found: {hex_file}")
        sys.exit(1)
    if not os.path.exists(AVRDUDE):
        print(f"ERROR: avrdude not found at {AVRDUDE}")
        sys.exit(1)

    # 1. Pulse DTR to reset the Uno into bootloader
    pulse_dtr(port)

    # 2. Small delay — bootloader takes ~50 ms to start after reset
    time.sleep(0.15)

    # 3. Run avrdude immediately within the bootloader window
    rc = upload(port, hex_file)

    if rc == 0:
        print("\n✅ Upload successful!")
    else:
        print("\n❌ Upload failed. Try pressing the RESET button on the Uno")
        print("   manually right before running this script.")
    sys.exit(rc)

if __name__ == "__main__":
    main()
