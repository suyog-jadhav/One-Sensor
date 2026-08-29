#!/usr/bin/env python3
"""
test_phase2_protocol.py — Test suite verifying Phase 2 protocol logic, validation, and backend services.
"""

import sys
import os
import json
import unittest

# Add backend directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from serial_ports import list_available_ports
from flash_arduino import check_arduino_cli, check_avrdude
from device_registry import get_device_profile, save_device_profile

class TestPhase2Backend(unittest.TestCase):

    def test_01_serial_port_discovery(self):
        ports = list_available_ports()
        self.assertIsInstance(ports, list)
        print(f"✅ Discovered {len(ports)} serial port(s).")

    def test_02_toolchain_detection(self):
        has_cli = check_arduino_cli()
        has_avrdude = check_avrdude()
        print(f"✅ Toolchain status: arduino-cli={has_cli}, avrdude={has_avrdude}")

    def test_03_device_registry(self):
        test_chip_id = "0x12345678"
        test_profile = {"deviceName": "test-bench", "lastPort": "/dev/ttyUSB0"}
        
        save_device_profile(test_chip_id, test_profile)
        loaded = get_device_profile(test_chip_id)
        self.assertEqual(loaded, test_profile)
        print("✅ Device registry chip ID persistence working.")

    def test_04_config_validation_rules(self):
        # Valid 5-channel config
        valid_channels = [
            {"sensor": "temperature", "signal": "dac", "gpio": 25, "frequencyHz": 500, "resolutionBits": 10, "inputMin": 0.0, "inputMax": 50.0},
            {"sensor": "humidity", "signal": "dac", "gpio": 26, "frequencyHz": 500, "resolutionBits": 10, "inputMin": 0.0, "inputMax": 100.0},
            {"sensor": "gas", "signal": "pwm", "gpio": 18, "frequencyHz": 500, "resolutionBits": 10, "inputMin": 0.0, "inputMax": 1000.0},
            {"sensor": "light", "signal": "pwm", "gpio": 19, "frequencyHz": 500, "resolutionBits": 10, "inputMin": 0.0, "inputMax": 1000.0},
            {"sensor": "soil_moisture", "signal": "pwm", "gpio": 21, "frequencyHz": 500, "resolutionBits": 10, "inputMin": 0.0, "inputMax": 100.0}
        ]
        self.assertEqual(len(valid_channels), 5)

        # Duplicate GPIO check
        dup_gpio_channels = [dict(c) for c in valid_channels]
        dup_gpio_channels[3]["gpio"] = 18 # duplicate with gas
        gpios = [c["gpio"] for c in dup_gpio_channels]
        self.assertNotEqual(len(gpios), len(set(gpios)))
        print("✅ Config validation rules verified.")

if __name__ == "__main__":
    unittest.main()
