#pragma once

/**
 * sensor_state.h — Thread-safe current logical sensor values
 *
 * SensorState holds the five live logical values (e.g. temperature in °C).
 * It is the ONLY mutable shared data between:
 *   - The WebSocket message handler (writes new values from dashboard)
 *   - The Scenario Engine (writes ramp/static values)
 *   - The Channel Manager / PWM update loop (reads to compute duty cycles)
 *
 * Protection: FreeRTOS mutex (portMUX_TYPE / critical section).
 * Rule: Never read or write fields directly — always use get()/set() below.
 * A partial write (torn float on dual-core ESP32) reaching the PWM layer is
 * a real bug that mutex/critical-section prevents.
 */

#include <Arduino.h>
#include "hardware_config.h"

struct SensorValues {
    float temperature  = 25.0f;   // °C,  range 0–50
    float humidity     = 50.0f;   // %,   range 0–100
    float gas          = 300.0f;  // ppm, range 0–1000
    float light        = 500.0f;  // lux, range 0–1000
    float soilMoisture = 50.0f;   // %,   range 0–100
};

class SensorState {
public:
    SensorState();

    // Thread-safe read of all values (snapshot copy)
    SensorValues get() const;

    // Thread-safe write of a single sensor value by SensorType
    void set(SensorType sensor, float value);

    // Thread-safe write of all values at once
    void setAll(const SensorValues& values);

    // Retrieve the logical value for a given SensorType
    float getByType(SensorType sensor) const;

private:
    SensorValues        _values;
    mutable portMUX_TYPE _mux;
};

// Global singleton — declared here, defined in sensor_state.cpp
extern SensorState gSensorState;
