"""
device_registry.py — Local device registry tracking physical boards by chip ID
"""
import os
import json

REGISTRY_FILE = os.path.expanduser("~/.onesensor_registry.json")

def load_registry():
    if os.path.exists(REGISTRY_FILE):
        try:
            with open(REGISTRY_FILE, "r") as f:
                return json.load(f)
        except Exception:
            return {}
    return {}

def save_registry(data):
    try:
        with open(REGISTRY_FILE, "w") as f:
            json.dump(data, f, indent=2)
    except Exception as e:
        print(f"Error saving device registry: {e}")

def get_device_profile(chip_id: str):
    registry = load_registry()
    return registry.get(chip_id)

def save_device_profile(chip_id: str, profile_data: dict):
    registry = load_registry()
    registry[chip_id] = profile_data
    save_registry(registry)
