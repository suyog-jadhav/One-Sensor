"""
flash_esp32.py — Flashes merged firmware.bin at offset 0x0 using esptool CLI/module
"""
import os
import sys
import subprocess
import esptool

def flash_esp32_firmware(port: str, firmware_bin_path: str, baud: int = 460800, progress_callback=None):
    """
    Flashes merged ESP32 firmware binary at offset 0x0 using esptool module.
    """
    if not os.path.exists(firmware_bin_path):
        return {"success": False, "reason": f"Firmware file not found: {firmware_bin_path}"}

    command_args = [
        sys.executable, '-m', 'esptool',
        '--chip', 'esp32',
        '--port', port,
        '--baud', str(baud),
        '--before', 'default_reset',
        '--after', 'hard_reset',
        'write_flash',
        '-z',
        '0x0', firmware_bin_path
    ]

    try:
        result = subprocess.run(command_args, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, check=True)
        return {"success": True, "message": "ESP32 firmware flashed successfully", "output": result.stdout}
    except subprocess.CalledProcessError as e:
        return {"success": False, "reason": e.stderr or e.stdout or str(e)}
    except Exception as e:
        return {"success": False, "reason": str(e)}

def get_esp32_chip_id(port: str, baud: int = 115200):
    """
    Reads the unique hardware chip ID of an ESP32 board using esptool.
    """
    try:
        command_args = [
            sys.executable, '-m', 'esptool',
            '--port', port,
            '--baud', str(baud),
            'chip_id'
        ]
        result = subprocess.run(command_args, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, check=True)
        return {"success": True, "chip_id": result.stdout.strip()}
    except Exception as e:
        return {"success": False, "reason": str(e)}
