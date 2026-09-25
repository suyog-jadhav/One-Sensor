/**
 * sensor_state.cpp — SensorState implementation
 */

#include "sensor_state.h"

// ─── Global singleton ─────────────────────────────────────────────────────────
SensorState gSensorState;

// ─── Constructor ──────────────────────────────────────────────────────────────
SensorState::SensorState() : _mux(portMUX_INITIALIZER_UNLOCKED) {
    for (uint8_t i = 0; i < MAX_CHANNELS; i++) {
        _faults[i] = ChannelFaultState();
    }
}

// ─── Thread-safe read ─────────────────────────────────────────────────────────
SensorValues SensorState::get() const {
    SensorValues snap;
    portENTER_CRITICAL(&_mux);
    snap = _values;
    portEXIT_CRITICAL(&_mux);
    return snap;
}

// ─── Thread-safe single-sensor write ─────────────────────────────────────────
void SensorState::set(SensorType sensor, float value) {
    portENTER_CRITICAL(&_mux);
    switch (sensor) {
        case SensorType::TEMPERATURE:   _values.temperature  = value; break;
        case SensorType::HUMIDITY:      _values.humidity     = value; break;
        case SensorType::GAS:           _values.gas          = value; break;
        case SensorType::LIGHT:         _values.light        = value; break;
        case SensorType::SOIL_MOISTURE: _values.soilMoisture = value; break;
        case SensorType::MOTION_X:      _values.motionX      = value; break;
        case SensorType::MOTION_Y:      _values.motionY      = value; break;
        case SensorType::MOTION_Z:      _values.motionZ      = value; break;
        case SensorType::PROXIMITY:     _values.proximity    = value; break;
        case SensorType::SOUND:         _values.sound        = value; break;
        case SensorType::UV:            _values.uv           = value; break;
        case SensorType::CO2:           _values.co2          = value; break;
    }
    portEXIT_CRITICAL(&_mux);
}

// ─── Thread-safe atomic write of 3-axis motion ────────────────────────────────
void SensorState::setMotion(float x, float y, float z) {
    portENTER_CRITICAL(&_mux);
    _values.motionX = x;
    _values.motionY = y;
    _values.motionZ = z;
    portEXIT_CRITICAL(&_mux);
}

// ─── Thread-safe bulk write ───────────────────────────────────────────────────
void SensorState::setAll(const SensorValues& values) {
    portENTER_CRITICAL(&_mux);
    _values = values;
    portEXIT_CRITICAL(&_mux);
}

// ─── Read by type ─────────────────────────────────────────────────────────────
float SensorState::getByType(SensorType sensor) const {
    SensorValues snap = get();
    switch (sensor) {
        case SensorType::TEMPERATURE:   return snap.temperature;
        case SensorType::HUMIDITY:      return snap.humidity;
        case SensorType::GAS:           return snap.gas;
        case SensorType::LIGHT:         return snap.light;
        case SensorType::SOIL_MOISTURE: return snap.soilMoisture;
        case SensorType::MOTION_X:      return snap.motionX;
        case SensorType::MOTION_Y:      return snap.motionY;
        case SensorType::MOTION_Z:      return snap.motionZ;
        case SensorType::PROXIMITY:     return snap.proximity;
        case SensorType::SOUND:         return snap.sound;
        case SensorType::UV:            return snap.uv;
        case SensorType::CO2:           return snap.co2;
    }
    return 0.0f;
}

// ─── Fault State Accessors ────────────────────────────────────────────────────
ChannelFaultState SensorState::getFault(uint8_t channelIndex) const {
    ChannelFaultState f;
    if (channelIndex >= MAX_CHANNELS) return f;
    portENTER_CRITICAL(&_mux);
    f = _faults[channelIndex];
    portEXIT_CRITICAL(&_mux);
    return f;
}

void SensorState::setFault(uint8_t channelIndex, const ChannelFaultState& fault) {
    if (channelIndex >= MAX_CHANNELS) return;
    portENTER_CRITICAL(&_mux);
    _faults[channelIndex] = fault;
    portEXIT_CRITICAL(&_mux);
}

void SensorState::clearFault(uint8_t channelIndex) {
    if (channelIndex >= MAX_CHANNELS) return;
    portENTER_CRITICAL(&_mux);
    _faults[channelIndex] = ChannelFaultState();
    portEXIT_CRITICAL(&_mux);
}

void SensorState::clearAllFaults() {
    portENTER_CRITICAL(&_mux);
    for (uint8_t i = 0; i < MAX_CHANNELS; i++) {
        _faults[i] = ChannelFaultState();
    }
    portEXIT_CRITICAL(&_mux);
}
