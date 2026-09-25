#pragma once

/**
 * hardware_config.h — ESP32 OneSensor Channel Configuration Table
 *
 * THIS IS THE SINGLE SOURCE OF TRUTH for sensor-to-GPIO mapping on the ESP32.
 * No GPIO number may appear anywhere else in the codebase (not in sensor classes,
 * not in main.cpp, not in the WebSocket handler).
 *
 * Safe GPIO pool (ESP32-WROOM-32):
 *   Output-capable, general-purpose: 4, 5, 12*, 13, 14*, 15*, 16, 17, 18, 19,
 *                                     21, 22, 23, 25, 26, 27, 32, 33
 *   Input-only (cannot be used for PWM output): 34, 35, 36, 37, 38, 39
 *   Strapping pins: 0*, 2*, 12*, 15*
 */

#include <stdint.h>

// ─── Enums ────────────────────────────────────────────────────────────────────

enum class SensorType {
    TEMPERATURE,
    HUMIDITY,
    GAS,
    LIGHT,
    SOIL_MOISTURE,
    MOTION_X,
    MOTION_Y,
    MOTION_Z,
    PROXIMITY,
    SOUND,
    UV,
    CO2
};

enum class SignalType {
    PWM,
    DAC
};

enum class FaultType : uint8_t {
    NONE        = 0,
    DROPOUT     = 1,
    STUCK       = 2,
    NOISE       = 3,
    SPIKE       = 4,
    DRIFT       = 5,
    DISCONNECT  = 6,
    LATENCY     = 7
};

// ─── Channel Fault State ──────────────────────────────────────────────────────

struct ChannelFaultState {
    FaultType type = FaultType::NONE;
    float magnitude = 0.0f;       // noise stddev / stuck value / spike delta / drift rate per sec
    uint32_t latencyMs = 0;       // latency delay in ms
    uint32_t durationMs = 0;      // duration before auto-clear (0 = until cleared)
    uint32_t startedAtMs = 0;     // timestamp when fault was armed
};

// ─── Channel Configuration ───────────────────────────────────────────────────

struct ChannelConfig {
    SensorType  sensor;
    SignalType  signal;
    uint8_t     gpio;           // ESP32 output GPIO pin (PWM pin or DAC pin 25/26)
    uint8_t     ledcChannel;    // LEDC hardware channel index (0–15, ignored for DAC)
    uint32_t    frequencyHz;    // PWM carrier frequency (ignored for DAC)
    uint8_t     resolutionBits; // LEDC duty resolution (e.g. 10 = 0..1023, ignored for DAC)
    float       inputMin;       // Logical sensor minimum
    float       inputMax;       // Logical sensor maximum
    float       defaultValue;   // Value output at boot before any WebSocket command
    float       calOffset;      // Calibration offset (default 0.0f)
    float       calScale;       // Calibration scale factor (default 1.0f)
};

// ─── Active Channel Table (12 Channels Total) ──────────────────────────────────

static const uint8_t MAX_CHANNELS = 12;

static const ChannelConfig DEFAULT_CHANNEL_TABLE[MAX_CHANNELS] = {
    //  sensor                     signal           gpio ledc freq  bits  min     max      def      calOff calScale
    {  SensorType::TEMPERATURE,   SignalType::DAC,   25,  0,   500,  10,    0.0f,   50.0f,   25.0f,   0.0f,  1.0f }, // DAC1 (GPIO25 -> A0)
    {  SensorType::HUMIDITY,      SignalType::DAC,   26,  1,   500,  10,    0.0f,  100.0f,   50.0f,   0.0f,  1.0f }, // DAC2 (GPIO26 -> A1)
    {  SensorType::GAS,           SignalType::PWM,   18,  0,   500,  10,    0.0f, 1000.0f,  300.0f,   0.0f,  1.0f }, // PWM  (GPIO18 -> D2)
    {  SensorType::LIGHT,         SignalType::PWM,   19,  1,   500,  10,    0.0f, 1000.0f,  500.0f,   0.0f,  1.0f }, // PWM  (GPIO19 -> D3)
    {  SensorType::SOIL_MOISTURE,  SignalType::PWM,   21,  2,   500,  10,    0.0f,  100.0f,   50.0f,   0.0f,  1.0f }, // PWM  (GPIO21 -> D4)
    {  SensorType::MOTION_X,      SignalType::PWM,   22,  3,   500,  10,   -2.0f,    2.0f,    0.0f,   0.0f,  1.0f }, // PWM  (GPIO22 -> D5)
    {  SensorType::MOTION_Y,      SignalType::PWM,   23,  4,   500,  10,   -2.0f,    2.0f,    0.0f,   0.0f,  1.0f }, // PWM  (GPIO23 -> D6)
    {  SensorType::MOTION_Z,      SignalType::PWM,   27,  5,   500,  10,   -2.0f,    2.0f,    1.0f,   0.0f,  1.0f }, // PWM  (GPIO27 -> D7)
    {  SensorType::PROXIMITY,     SignalType::PWM,   32,  6,   500,  10,    2.0f,  400.0f,   50.0f,   0.0f,  1.0f }, // PWM  (GPIO32 -> D8)
    {  SensorType::SOUND,         SignalType::PWM,   33,  7,   500,  10,   30.0f,  120.0f,   40.0f,   0.0f,  1.0f }, // PWM  (GPIO33 -> D9)
    {  SensorType::UV,            SignalType::PWM,   14,  8,   500,  10,    0.0f,   11.0f,    2.0f,   0.0f,  1.0f }, // PWM  (GPIO14 -> D10)
    {  SensorType::CO2,           SignalType::PWM,   12,  9,   500,  10,  400.0f, 5000.0f,  420.0f,   0.0f,  1.0f }, // PWM  (GPIO12 -> D11)
};

static const ChannelConfig* const CHANNEL_TABLE = DEFAULT_CHANNEL_TABLE;
static const uint8_t CHANNEL_COUNT = MAX_CHANNELS;

// ─── Valid GPIO Pools ─────────────────────────────────────────────────────────
static const uint8_t VALID_PWM_GPIOS[] = {
    4, 5, 12, 13, 14, 15, 16, 17, 18, 19, 21, 22, 23, 25, 26, 27, 32, 33
};
static const uint8_t VALID_PWM_GPIO_COUNT = sizeof(VALID_PWM_GPIOS) / sizeof(VALID_PWM_GPIOS[0]);

static const uint8_t VALID_DAC_GPIOS[] = { 25, 26 };
static const uint8_t VALID_DAC_GPIO_COUNT = sizeof(VALID_DAC_GPIOS) / sizeof(VALID_DAC_GPIOS[0]);
