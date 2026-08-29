"""
flash_arduino.py — Arduino Uno hex flashing wrapper via arduino-cli or avrdude
"""
import shutil
import subprocess

def check_arduino_cli():
    """Returns true if arduino-cli is present on PATH."""
    return shutil.which("arduino-cli") is not None

def check_avrdude():
    """Returns true if avrdude is present on PATH."""
    return shutil.which("avrdude") is not None

def flash_arduino_firmware(port: str, hex_path: str):
    """
    Flashes prebuilt .hex binary to Arduino Uno via arduino-cli or avrdude.
    """
    if check_arduino_cli():
        cmd = ["arduino-cli", "upload", "-p", port, "--fqbn", "arduino:avr:uno", "-i", hex_path]
    elif check_avrdude():
        cmd = ["avrdude", "-v", "-p", "atmega328p", "-c", "arduino", "-P", port, "-b", "115200", "-D", f"-Uflash:w:{hex_path}:i"]
    else:
        return {"success": False, "reason": "Neither arduino-cli nor avrdude found on PATH"}

    try:
        result = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, check=True)
        return {"success": True, "output": result.stdout}
    except subprocess.CalledProcessError as e:
        return {"success": False, "reason": e.stderr or e.stdout or str(e)}
