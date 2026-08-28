#pragma once

/**
 * ArduinoChannelConfig.h — Arduino-side pin assignment table
 *
 * THIS IS THE SINGLE SOURCE OF TRUTH for sensor-to-Arduino-pin mapping.
 * No pin number may appear inside PwmDecoder, sensor classes, or OneSensor.
 * Changing a wire = change one row here only.
 *
 * Each entry maps a SensorType to the Arduino digital pin that receives
 * the corresponding ESP32 PWM signal.
 *
 * Default wiring (matches hardware_config.h on ESP32 side):
 *   Temperature  → ESP32 GPIO16  →  Arduino D2
 *   Humidity     → ESP32 GPIO17  →  Arduino D3
 *   Gas          → ESP32 GPIO18  →  Arduino D4
 *   Light        → ESP32 GPIO19  →  Arduino D5
 *   Soil         → ESP32 GPIO21  →  Arduino D6
 *   GND          → GND shared (required for signal reference)
 */

#include <Arduino.h>

// ─── Sensor type enum (matches ESP32 side) ─────────────────────────────────
enum class SensorType : uint8_t {
    TEMPERATURE   = 0,
    HUMIDITY      = 1,
    GAS           = 2,
    LIGHT         = 3,
    SOIL_MOISTURE = 4
};

// ─── Per-channel config ────────────────────────────────────────────────────
struct ArduinoChannelConfig {
    SensorType  sensor;
    uint8_t     pin;        // Arduino digital pin receiving PWM
    float       outputMin;  // Logical sensor minimum (e.g. 0.0 °C)
    float       outputMax;  // Logical sensor maximum (e.g. 50.0 °C)
};

// ─── Pin assignment table ──────────────────────────────────────────────────
static const ArduinoChannelConfig ARDUINO_CHANNEL_TABLE[] = {
    //  sensor                    pin   outMin   outMax
    {  SensorType::TEMPERATURE,    2,   0.0f,    50.0f  },   // Phase 2+
    {  SensorType::HUMIDITY,       3,   0.0f,   100.0f  },   // Phase 5+
    {  SensorType::GAS,            4,   0.0f,  1000.0f  },   // Phase 5+
    {  SensorType::LIGHT,          5,   0.0f,  1000.0f  },   // Phase 5+
    {  SensorType::SOIL_MOISTURE,  6,   0.0f,   100.0f  },   // Phase 5+
};

static const uint8_t ARDUINO_CHANNEL_COUNT =
    sizeof(ARDUINO_CHANNEL_TABLE) / sizeof(ARDUINO_CHANNEL_TABLE[0]);
