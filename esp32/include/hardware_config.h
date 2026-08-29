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
    PWM,
    DAC
    // Future: UART, I2C, SPI
    // Adding a new SignalType requires a new ChannelManager strategy only —
    // sensor classes and SensorState remain unchanged.
};

// ─── Channel Configuration ───────────────────────────────────────────────────

struct ChannelConfig {
    SensorType  sensor;
    SignalType  signal;
    uint8_t     gpio;           // ESP32 output GPIO pin (PWM pin or DAC pin 25/26)
    uint8_t     ledcChannel;    // LEDC hardware channel index (0–15, ignored for DAC)
    uint32_t    frequencyHz;    // PWM carrier frequency (ignored for DAC)
    uint8_t     resolutionBits; // LEDC duty resolution (e.g. 10 = 0..1023, ignored for DAC)
    float       inputMin;       // Logical sensor minimum (e.g. 0.0 °C)
    float       inputMax;       // Logical sensor maximum (e.g. 50.0 °C)
    float       defaultValue;   // Value output at boot before any WebSocket command
    float       calOffset;      // Calibration offset (default 0.0f)
    float       calScale;       // Calibration scale factor (default 1.0f)
};

// ─── Active Channel Table ─────────────────────────────────────────────────────

static const uint8_t MAX_CHANNELS = 5;

static const ChannelConfig DEFAULT_CHANNEL_TABLE[MAX_CHANNELS] = {
    //  sensor               signal        gpio  ledcCh  freq    bits  min    max    default calOff calScale
    {  SensorType::TEMPERATURE, SignalType::DAC,  25,    0,   500,    10,   0.0f,  50.0f,  25.0f,  0.0f,   1.0f },  // Hardware DAC1 (GPIO25 -> A0)
    {  SensorType::HUMIDITY,    SignalType::DAC,  26,    1,   500,    10,   0.0f, 100.0f,  50.0f,  0.0f,   1.0f },  // Hardware DAC2 (GPIO26 -> A1)
    {  SensorType::GAS,         SignalType::PWM,  18,    2,   500,    10,   0.0f,1000.0f, 300.0f,  0.0f,   1.0f },  // LEDC PWM (GPIO18 -> D4)
    {  SensorType::LIGHT,       SignalType::PWM,  19,    3,   500,    10,   0.0f,1000.0f, 500.0f,  0.0f,   1.0f },  // LEDC PWM (GPIO19 -> D5)
    {  SensorType::SOIL_MOISTURE,SignalType::PWM, 21,    4,   500,    10,   0.0f, 100.0f,  50.0f,  0.0f,   1.0f },  // LEDC PWM (GPIO21 -> D6)
};

static const ChannelConfig* const CHANNEL_TABLE = DEFAULT_CHANNEL_TABLE;
static const uint8_t CHANNEL_COUNT = MAX_CHANNELS;

// ─── Valid GPIO Pools ─────────────────────────────────────────────────────────
// GPIOs safe for PWM output on ESP32-WROOM-32.
static const uint8_t VALID_PWM_GPIOS[] = {
    4, 5, 12, 13, 14, 15, 16, 17, 18, 19, 21, 22, 23, 25, 26, 27, 32, 33
};
static const uint8_t VALID_PWM_GPIO_COUNT = sizeof(VALID_PWM_GPIOS) / sizeof(VALID_PWM_GPIOS[0]);

// ESP32 hardware DAC pins (8-bit output 0–3.3V)
static const uint8_t VALID_DAC_GPIOS[] = { 25, 26 };
static const uint8_t VALID_DAC_GPIO_COUNT = sizeof(VALID_DAC_GPIOS) / sizeof(VALID_DAC_GPIOS[0]);

