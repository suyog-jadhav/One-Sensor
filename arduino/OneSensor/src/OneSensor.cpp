/**
 * OneSensor.cpp — Public facade implementation
 */

#include "OneSensor.h"
#include <math.h>

// ─── Constructor ──────────────────────────────────────────────────────────────
// Wire each sensor class to its corresponding decoder by SensorType lookup.
OneSensor::OneSensor()
    : _tempSensor(_decoderFor(SensorType::TEMPERATURE)),
      _humSensor (_decoderFor(SensorType::HUMIDITY)),
      _gasSensor (_decoderFor(SensorType::GAS)),
      _lightSensor(_decoderFor(SensorType::LIGHT)),
      _soilSensor (_decoderFor(SensorType::SOIL_MOISTURE)),
      _initialized(false)
{}

// ─── begin() ─────────────────────────────────────────────────────────────────
void OneSensor::begin() {
    for (uint8_t i = 0; i < ARDUINO_CHANNEL_COUNT; i++) {
        uint8_t pin = ARDUINO_CHANNEL_TABLE[i].pin;
        if (!_decoders[i].begin(pin)) {
            Serial.print(F("[OneSensor] WARNING: PwmDecoder failed to init on pin "));
            Serial.println(pin);
        }
    }
    _initialized = true;
    Serial.println(F("[OneSensor] begin() complete. Channels:"));
    for (uint8_t i = 0; i < ARDUINO_CHANNEL_COUNT; i++) {
        Serial.print(F("  Pin "));
        Serial.print(ARDUINO_CHANNEL_TABLE[i].pin);
        Serial.print(F(" → sensor "));
        Serial.println((uint8_t)ARDUINO_CHANNEL_TABLE[i].sensor);
    }
}

// ─── update() ────────────────────────────────────────────────────────────────
void OneSensor::update() {
    if (!_initialized) return;
    // Round-robin: each call to update() measures all channels once.
    // Each PwmDecoder::update() blocks at most PULSE_TIMEOUT_US (25 ms).
    // Worst case: 5 × 25 ms = 125 ms. Acceptable for v1 (documented in troubleshooting.md).
    for (uint8_t i = 0; i < ARDUINO_CHANNEL_COUNT; i++) {
        _decoders[i].update();
    }
}

// ─── Sensor readings ─────────────────────────────────────────────────────────
float OneSensor::readTemperature()  const { return _tempSensor.read(); }
float OneSensor::readHumidity()     const { return _humSensor.read();  }
float OneSensor::readGas()          const { return _gasSensor.read();  }
float OneSensor::readLight()        const { return _lightSensor.read(); }
float OneSensor::readSoilMoisture() const { return _soilSensor.read(); }

// ─── Status ──────────────────────────────────────────────────────────────────
bool OneSensor::isConnected() const {
    if (!_initialized) return false;
    for (uint8_t i = 0; i < ARDUINO_CHANNEL_COUNT; i++) {
        if (!_decoders[i].isValid()) return false;
    }
    return true;
}

bool OneSensor::isValid(SensorType sensor) const {
    const PwmDecoder* d = _decoderFor(sensor);
    return d && d->isValid();
}

// ─── Private helpers ─────────────────────────────────────────────────────────
PwmDecoder* OneSensor::_decoderFor(SensorType sensor) {
    for (uint8_t i = 0; i < ARDUINO_CHANNEL_COUNT; i++) {
        if (ARDUINO_CHANNEL_TABLE[i].sensor == sensor) return &_decoders[i];
    }
    return nullptr;
}

const PwmDecoder* OneSensor::_decoderFor(SensorType sensor) const {
    for (uint8_t i = 0; i < ARDUINO_CHANNEL_COUNT; i++) {
        if (ARDUINO_CHANNEL_TABLE[i].sensor == sensor) return &_decoders[i];
    }
    return nullptr;
}
