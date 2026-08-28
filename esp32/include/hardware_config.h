#pragma once

/**
 * hardware_config.h — ESP32 OneSensor Channel Configuration Table
 *
 * THIS IS THE SINGLE SOURCE OF TRUTH for sensor-to-GPIO mapping on the ESP32.
 * No GPIO number may appear anywhere else in the codebase (not in sensor classes,
 * not in main.cpp, not in the WebSocket handler).
 *
 * To reassign a GPIO: change it here only. To add a sensor: add one row here only.
 *
 * Safe GPIO pool (ESP32-WROOM-32):
 *   Output-capable, general-purpose: 4, 5, 12*, 13, 14*, 15*, 16, 17, 18, 19,
 *                                     21, 22, 23, 25, 26, 27, 32, 33
 *   Input-only (cannot be used for PWM output): 34, 35, 36, 37, 38, 39
 *   Strapping pins (usable but require care): 0*, 2*, 12*, 15*
 *   (* = caution: affects boot mode if held LOW/HIGH at reset)
 *
 * Startup validation in channel_manager.cpp will reject:
 *   - Duplicate GPIOs across channels
 *   - GPIOs outside the valid pool (input-only, out of range)
 *   - Any configuration that would silently misbehave
 */

#include <stdint.h>

// ─── Enums ────────────────────────────────────────────────────────────────────

enum class SensorType {
    TEMPERATURE,
    HUMIDITY,
    GAS,
    LIGHT,
    SOIL_MOISTURE
};

enum class SignalType {
    PWM
    // Future: DAC, UART, I2C, SPI
    // Adding a new SignalType requires a new ChannelManager strategy only —
    // sensor classes and SensorState remain unchanged.
};

// ─── Channel Configuration ───────────────────────────────────────────────────

struct ChannelConfig {
    SensorType  sensor;
    SignalType  signal;
    uint8_t     gpio;           // ESP32 output GPIO pin
    uint8_t     ledcChannel;    // LEDC hardware channel index (0–15)
    uint32_t    frequencyHz;    // PWM carrier frequency
    uint8_t     resolutionBits; // LEDC duty resolution (e.g. 10 = 0..1023)
    float       inputMin;       // Logical sensor minimum (e.g. 0.0 °C)
    float       inputMax;       // Logical sensor maximum (e.g. 50.0 °C)
    float       defaultValue;   // Value output at boot before any WebSocket command
};

// ─── Active Channel Table ─────────────────────────────────────────────────────
//
// Phase 1: Only TEMPERATURE channel is active (one wire to verify end-to-end).
// Phase 5: Uncomment/add the remaining four channels.
//
// Wiring used during development (change here if you rewire — nowhere else):
//   Temperature  → ESP32 GPIO16  →  Arduino D2
//   Humidity     → ESP32 GPIO17  →  Arduino D3
//   Gas          → ESP32 GPIO18  →  Arduino D4
//   Light        → ESP32 GPIO19  →  Arduino D5
//   Soil         → ESP32 GPIO21  →  Arduino D6
//   GND          → GND shared between both boards (REQUIRED)

static const ChannelConfig CHANNEL_TABLE[] = {
    //  sensor               signal        gpio  ledcCh  freq    bits  min    max    default
    {  SensorType::TEMPERATURE, SignalType::PWM,  16,    0,   500,    10,   0.0f,  50.0f,  25.0f },  // Phase 1+
    {  SensorType::HUMIDITY,    SignalType::PWM,  17,    1,   500,    10,   0.0f, 100.0f,  50.0f },  // Phase 5+
    {  SensorType::GAS,         SignalType::PWM,  18,    2,   500,    10,   0.0f,1000.0f, 300.0f },  // Phase 5+
    {  SensorType::LIGHT,       SignalType::PWM,  19,    3,   500,    10,   0.0f,1000.0f, 500.0f },  // Phase 5+
    {  SensorType::SOIL_MOISTURE,SignalType::PWM, 21,    4,   500,    10,   0.0f, 100.0f,  50.0f },  // Phase 5+
};

static const uint8_t CHANNEL_COUNT = sizeof(CHANNEL_TABLE) / sizeof(CHANNEL_TABLE[0]);

// ─── Valid GPIO Pool ──────────────────────────────────────────────────────────
// GPIOs safe for PWM output on ESP32-WROOM-32.
// Startup validation checks every configured GPIO against this list.
static const uint8_t VALID_PWM_GPIOS[] = {
    4, 5, 12, 13, 14, 15, 16, 17, 18, 19, 21, 22, 23, 25, 26, 27, 32, 33
};
static const uint8_t VALID_PWM_GPIO_COUNT = sizeof(VALID_PWM_GPIOS) / sizeof(VALID_PWM_GPIOS[0]);
