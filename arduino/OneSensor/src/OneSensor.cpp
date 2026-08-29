/**
 * OneSensor.cpp — Public facade implementation with EEPROM pin config and Serial provisioning
 */

#include "OneSensor.h"
#include <math.h>

// ─── Constructor ──────────────────────────────────────────────────────────────
OneSensor::OneSensor()
    : _channels{},
      _decoders{},
      _tempSensor(nullptr),
      _humSensor(nullptr),
      _gasSensor(nullptr),
      _lightSensor(nullptr),
      _soilSensor(nullptr),
      _initialized(false)
{
}

// ─── begin() ─────────────────────────────────────────────────────────────────
void OneSensor::begin() {
    // 1. Load config from EEPROM or compiled defaults
    if (!ArduinoConfigStore::load(_channels, ARDUINO_CHANNEL_COUNT)) {
        for (uint8_t i = 0; i < ARDUINO_CHANNEL_COUNT; i++) {
            _channels[i] = ARDUINO_CHANNEL_TABLE[i];
        }
    }

    _reinitDecoders();
    _initialized = true;

    // 2. Announce provisioning readiness per Section 4.2
    Serial.println(F("ONESENSOR_ARDUINO_READY_FOR_PROVISIONING"));
}

// ─── update() ────────────────────────────────────────────────────────────────
void OneSensor::update() {
    if (!_initialized) return;

    // 1. Run signal updates for all channel decoders
    for (uint8_t i = 0; i < ARDUINO_CHANNEL_COUNT; i++) {
        if (_decoders[i]) _decoders[i]->update();
    }

    // 2. Non-blocking serial listener for provisioning commands
    _checkSerialCommands();
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
        if (!_decoders[i] || !_decoders[i]->isValid()) return false;
    }
    return true;
}

bool OneSensor::isValid(SensorType sensor) const {
    const SignalDecoder* d = _decoderFor(sensor);
    return d && d->isValid();
}

// ─── Private helpers ─────────────────────────────────────────────────────────
void OneSensor::_reinitDecoders() {
    for (uint8_t i = 0; i < ARDUINO_CHANNEL_COUNT; i++) {
        if (_channels[i].signal == SignalType::DAC) {
            _decoders[i] = &_dacDecoders[i];
        } else {
            _decoders[i] = &_pwmDecoders[i];
        }
        if (!_decoders[i] || !_decoders[i]->begin(_channels[i].pin)) {
            Serial.print(F("[OneSensor] WARNING: Decoder failed to init on pin "));
            Serial.println(_channels[i].pin);
        }
    }

    _tempSensor  = TemperatureSensor(_decoderFor(SensorType::TEMPERATURE));
    _humSensor   = HumiditySensor(_decoderFor(SensorType::HUMIDITY));
    _gasSensor   = GasSensor(_decoderFor(SensorType::GAS));
    _lightSensor = LightSensor(_decoderFor(SensorType::LIGHT));
    _soilSensor  = SoilMoistureSensor(_decoderFor(SensorType::SOIL_MOISTURE));
}

void OneSensor::_checkSerialCommands() {
    if (!Serial.available()) return;

    String line = Serial.readStringUntil('\n');
    line.trim();
    if (line.length() == 0) return;

    if (line.equalsIgnoreCase("PROVISION")) {
        Serial.println(F("ONESENSOR_ARDUINO_READY_FOR_PROVISIONING"));
        return;
    }

    if (line.startsWith("{") && line.indexOf("channels") != -1) {
        String errReason;
        if (_parseAndApplyProvisioning(line, errReason)) {
            Serial.println(F("{\"status\":\"saved\"}"));
        } else {
            Serial.print(F("{\"status\":\"error\",\"reason\":\""));
            Serial.print(errReason);
            Serial.println(F("\"}"));
        }
    }
}

bool OneSensor::_parseAndApplyProvisioning(const String& line, String& errReason) {
    ArduinoChannelConfig tempTable[ARDUINO_CHANNEL_COUNT];
    for (uint8_t i = 0; i < ARDUINO_CHANNEL_COUNT; i++) {
        tempTable[i] = _channels[i];
    }

    const char* sensorKeys[] = {"temperature", "humidity", "gas", "light", "soil_moisture"};

    for (uint8_t s = 0; s < ARDUINO_CHANNEL_COUNT; s++) {
        int idx = line.indexOf(sensorKeys[s]);
        if (idx == -1 && s == 4) {
            idx = line.indexOf("soil"); // Alias check
        }
        if (idx == -1) {
            errReason = String("missing channel for ") + sensorKeys[s];
            return false;
        }

        // Find pin field
        int pinIdx = line.indexOf("\"pin\"", idx);
        if (pinIdx == -1) pinIdx = line.indexOf("'pin'", idx);
        if (pinIdx == -1) {
            errReason = String("missing pin for ") + sensorKeys[s];
            return false;
        }

        int colonIdx = line.indexOf(':', pinIdx);
        if (colonIdx == -1) {
            errReason = String("malformed pin field for ") + sensorKeys[s];
            return false;
        }

        int pinVal = line.substring(colonIdx + 1).toInt();
        tempTable[s].pin = (uint8_t)pinVal;

        // Find signal field
        int sigIdx = line.indexOf("\"signal\"", idx);
        if (sigIdx != -1) {
            int sigColon = line.indexOf(':', sigIdx);
            if (sigColon != -1) {
                String sigVal = line.substring(sigColon + 1, sigColon + 12);
                sigVal.toLowerCase();
                if (sigVal.indexOf("dac") != -1) {
                    tempTable[s].signal = SignalType::DAC;
                } else {
                    tempTable[s].signal = SignalType::PWM;
                }
            }
        }
    }

    // Check for duplicate pins
    for (uint8_t i = 0; i < ARDUINO_CHANNEL_COUNT; i++) {
        for (uint8_t j = i + 1; j < ARDUINO_CHANNEL_COUNT; j++) {
            if (tempTable[i].pin == tempTable[j].pin) {
                errReason = "pin " + String(tempTable[i].pin) + " assigned twice";
                return false;
            }
        }
    }

    // Save and re-initialize
    for (uint8_t i = 0; i < ARDUINO_CHANNEL_COUNT; i++) {
        _channels[i] = tempTable[i];
    }

    ArduinoConfigStore::save(_channels, ARDUINO_CHANNEL_COUNT);
    _reinitDecoders();
    return true;
}

SignalDecoder* OneSensor::_decoderFor(SensorType sensor) {
    for (uint8_t i = 0; i < ARDUINO_CHANNEL_COUNT; i++) {
        if (_channels[i].sensor == sensor) return _decoders[i];
    }
    return nullptr;
}

const SignalDecoder* OneSensor::_decoderFor(SensorType sensor) const {
    for (uint8_t i = 0; i < ARDUINO_CHANNEL_COUNT; i++) {
        if (_channels[i].sensor == sensor) return _decoders[i];
    }
    return nullptr;
}
