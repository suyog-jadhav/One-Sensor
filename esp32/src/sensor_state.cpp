/**
 * sensor_state.cpp — SensorState implementation
 */

#include "sensor_state.h"

// ─── Global singleton ─────────────────────────────────────────────────────────
SensorState gSensorState;

// ─── Constructor ──────────────────────────────────────────────────────────────
SensorState::SensorState() : _mux(portMUX_INITIALIZER_UNLOCKED) {
    // _values is zero-initialized by its struct defaults
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
    }
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
    }
    return 0.0f;
}
