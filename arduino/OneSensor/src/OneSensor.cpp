/**
 * OneSensor.cpp — Implementation of OneSensor 12-channel dynamic virtual sensor facade
 */

#include "OneSensor.h"
#include <math.h>

// ─── Constructor ──────────────────────────────────────────────────────────────
OneSensor::OneSensor()
    : _channels{},
      _decoders{},
      _initialized(false)
{
}

// ─── begin() ─────────────────────────────────────────────────────────────────
void OneSensor::begin() {
    // 1. Load config from EEPROM or fallback to compiled defaults
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

    // 2. Non-blocking serial listener for dynamic provisioning commands
    _checkSerialCommands();
}

// ─── Dynamic Sensor Readings ─────────────────────────────────────────────────
float OneSensor::read(SensorType sensor) const {
    int8_t idx = _channelIndexFor(sensor);
    if (idx < 0) return NAN;

    const SignalDecoder* dec = _decoders[idx];
    if (!dec || !dec->isValid()) return NAN;

    // Dynamically uses current outputMin and outputMax
    return dutyToLogicalValue(
        dec->getDutyCycle(),
        CalibrationParams{},
        _channels[idx].outputMin,
        _channels[idx].outputMax
    );
}

float OneSensor::readTemperature()  const { return read(SensorType::TEMPERATURE);   }
float OneSensor::readHumidity()     const { return read(SensorType::HUMIDITY);      }
float OneSensor::readGas()          const { return read(SensorType::GAS);           }
float OneSensor::readLight()        const { return read(SensorType::LIGHT);         }
float OneSensor::readSoilMoisture() const { return read(SensorType::SOIL_MOISTURE); }
float OneSensor::readMotionX()      const { return read(SensorType::MOTION_X);      }
float OneSensor::readMotionY()      const { return read(SensorType::MOTION_Y);      }
float OneSensor::readMotionZ()      const { return read(SensorType::MOTION_Z);      }
float OneSensor::readProximity()    const { return read(SensorType::PROXIMITY);     }
float OneSensor::readSound()        const { return read(SensorType::SOUND);         }
float OneSensor::readUV()           const { return read(SensorType::UV);            }
float OneSensor::readCO2()          const { return read(SensorType::CO2);           }

// ─── Dynamic Runtime Configuration ───────────────────────────────────────────
bool OneSensor::setRange(SensorType sensor, float min, float max) {
    if (min >= max) return false;
    int8_t idx = _channelIndexFor(sensor);
    if (idx < 0) return false;

    _channels[idx].outputMin = min;
    _channels[idx].outputMax = max;
    return true;
}

bool OneSensor::setPin(SensorType sensor, uint8_t pin, SignalType signal) {
    int8_t idx = _channelIndexFor(sensor);
    if (idx < 0) return false;

    _channels[idx].pin = pin;
    _channels[idx].signal = signal;

    if (signal == SignalType::DAC) {
        _decoders[idx] = &_dacDecoders[idx];
    } else {
        _decoders[idx] = &_pwmDecoders[idx];
    }
    return _decoders[idx]->begin(pin);
}

bool OneSensor::configureChannel(SensorType sensor, uint8_t pin, SignalType signal, float min, float max) {
    if (!setRange(sensor, min, max)) return false;
    return setPin(sensor, pin, signal);
}

const ArduinoChannelConfig* OneSensor::getChannelConfig(SensorType sensor) const {
    int8_t idx = _channelIndexFor(sensor);
    if (idx < 0) return nullptr;
    return &_channels[idx];
}

void OneSensor::saveConfig() {
    ArduinoConfigStore::save(_channels, ARDUINO_CHANNEL_COUNT);
}

void OneSensor::resetConfig() {
    ArduinoConfigStore::clear();
    for (uint8_t i = 0; i < ARDUINO_CHANNEL_COUNT; i++) {
        _channels[i] = ARDUINO_CHANNEL_TABLE[i];
    }
    _reinitDecoders();
}

// ─── Status ──────────────────────────────────────────────────────────────────
bool OneSensor::isConnected() const {
    if (!_initialized) return false;
    for (uint8_t i = 0; i < ARDUINO_CHANNEL_COUNT; i++) {
        if (!_decoders[i] || !_decoders[i]->isValid()) return false;
    }
    return true;
}

bool OneSensor::isValid(SensorType sensor) const {
    int8_t idx = _channelIndexFor(sensor);
    if (idx < 0) return false;
    return _decoders[idx] && _decoders[idx]->isValid();
}

// ─── Private Helpers ─────────────────────────────────────────────────────────
int8_t OneSensor::_channelIndexFor(SensorType sensor) const {
    for (uint8_t i = 0; i < ARDUINO_CHANNEL_COUNT; i++) {
        if (_channels[i].sensor == sensor) return (int8_t)i;
    }
    return -1;
}

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

    if (line.equalsIgnoreCase("RESET_CONFIG")) {
        resetConfig();
        Serial.println(F("{\"status\":\"reset_ok\"}"));
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
    static const char* const SENSOR_KEYS[ARDUINO_CHANNEL_COUNT] = {
        "temperature", "humidity", "gas", "light", "soil_moisture",
        "motionX", "motionY", "motionZ", "proximity", "sound", "uv", "co2"
    };

    ArduinoChannelConfig tempTable[ARDUINO_CHANNEL_COUNT];
    for (uint8_t i = 0; i < ARDUINO_CHANNEL_COUNT; i++) {
        tempTable[i] = _channels[i];
    }

    for (uint8_t s = 0; s < ARDUINO_CHANNEL_COUNT; s++) {
        int idx = line.indexOf(SENSOR_KEYS[s]);
        if (idx == -1 && s == 4) {
            idx = line.indexOf("soil"); // Alias check
        }
        if (idx == -1) continue; // Partial provisioning allowed for flexibility

        // Parse Pin
        int pinIdx = line.indexOf("\"pin\"", idx);
        if (pinIdx != -1) {
            int colonIdx = line.indexOf(':', pinIdx);
            if (colonIdx != -1) {
                tempTable[s].pin = (uint8_t)line.substring(colonIdx + 1).toInt();
            }
        }

        // Parse Signal
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

        // Parse dynamic min / outMin
        int minIdx = line.indexOf("\"min\"", idx);
        if (minIdx == -1) minIdx = line.indexOf("\"outMin\"", idx);
        if (minIdx != -1) {
            int minColon = line.indexOf(':', minIdx);
            if (minColon != -1) {
                tempTable[s].outputMin = line.substring(minColon + 1).toFloat();
            }
        }

        // Parse dynamic max / outMax
        int maxIdx = line.indexOf("\"max\"", idx);
        if (maxIdx == -1) maxIdx = line.indexOf("\"outMax\"", idx);
        if (maxIdx != -1) {
            int maxColon = line.indexOf(':', maxIdx);
            if (maxColon != -1) {
                tempTable[s].outputMax = line.substring(maxColon + 1).toFloat();
            }
        }
    }

    // Apply & Save to EEPROM
    for (uint8_t i = 0; i < ARDUINO_CHANNEL_COUNT; i++) {
        _channels[i] = tempTable[i];
    }

    saveConfig();
    _reinitDecoders();
    return true;
}
