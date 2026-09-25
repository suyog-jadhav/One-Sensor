#pragma once

/**
 * sensor_state.h — Thread-safe current logical sensor values and channel fault states
 */

#include <Arduino.h>
#include "hardware_config.h"

struct SensorValues {
    float temperature  = 25.0f;   // °C,   range 0–50
    float humidity     = 50.0f;   // %,    range 0–100
    float gas          = 300.0f;  // ppm,  range 0–1000
    float light        = 500.0f;  // lux,  range 0–1000
    float soilMoisture = 50.0f;   // %,    range 0–100
    float motionX      = 0.0f;    // g,    range -2.0 to 2.0
    float motionY      = 0.0f;    // g,    range -2.0 to 2.0
    float motionZ      = 1.0f;    // g,    range -2.0 to 2.0 (resting 1g)
    float proximity    = 50.0f;   // cm,   range 2–400
    float sound        = 40.0f;   // dB,   range 30–120
    float uv           = 2.0f;    // index, range 0–11
    float co2          = 420.0f;  // ppm,  range 400–5000
};

class SensorState {
public:
    SensorState();

    // Thread-safe read of all values (snapshot copy)
    SensorValues get() const;

    // Thread-safe write of a single sensor value by SensorType
    void set(SensorType sensor, float value);

    // Thread-safe atomic write of 3-axis motion
    void setMotion(float x, float y, float z);

    // Thread-safe write of all values at once
    void setAll(const SensorValues& values);

    // Retrieve the logical value for a given SensorType
    float getByType(SensorType sensor) const;

    // ─── Fault State Accessors ──────────────────────────────────────────────
    ChannelFaultState getFault(uint8_t channelIndex) const;
    void setFault(uint8_t channelIndex, const ChannelFaultState& fault);
    void clearFault(uint8_t channelIndex);
    void clearAllFaults();

private:
    SensorValues        _values;
    ChannelFaultState   _faults[MAX_CHANNELS];
    mutable portMUX_TYPE _mux;
};

// Global singleton
extern SensorState gSensorState;
