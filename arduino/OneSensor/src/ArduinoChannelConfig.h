#pragma once

/**
 * ArduinoChannelConfig.h — Arduino-side channel configuration table
 *
 * THIS IS THE SINGLE SOURCE OF TRUTH for sensor-to-Arduino-pin mapping.
 * Each entry maps a SensorType to an Arduino pin (analog or digital),
 * its signal decoder type (DAC or PWM), and its logical min/max range.
 *
 * Default 12-channel wiring:
 *   Ch0:  Temperature   (DAC) → ESP32 GPIO25 → Arduino A0    [0 – 50 °C]
 *   Ch1:  Humidity      (DAC) → ESP32 GPIO26 → Arduino A1    [0 – 100 %]
 *   Ch2:  Gas           (PWM) → ESP32 GPIO18 → Arduino D4    [0 – 1000 ppm]
 *   Ch3:  Light         (PWM) → ESP32 GPIO19 → Arduino D5    [0 – 1000 lux]
 *   Ch4:  Soil Moisture (PWM) → ESP32 GPIO21 → Arduino D6    [0 – 100 %]
 *   Ch5:  Motion X      (PWM) → ESP32 GPIO22 → Arduino D7    [-2.0 – +2.0 g]
 *   Ch6:  Motion Y      (PWM) → ESP32 GPIO23 → Arduino D8    [-2.0 – +2.0 g]
 *   Ch7:  Motion Z      (PWM) → ESP32 GPIO27 → Arduino D9    [-2.0 – +2.0 g]
 *   Ch8:  Proximity     (PWM) → ESP32 GPIO32 → Arduino D10   [2 – 400 cm]
 *   Ch9:  Sound         (PWM) → ESP32 GPIO33 → Arduino D11   [30 – 120 dB]
 *   Ch10: UV Index      (PWM) → ESP32 GPIO14 → Arduino D12   [0 – 11 idx]
 *   Ch11: CO2           (PWM) → ESP32 GPIO12 → Arduino D13   [400 – 5000 ppm]
 *   GND                 Shared reference wire (mandatory)
 */

#include <Arduino.h>

// ─── Sensor type enum (matches ESP32 & Web Protocol) ──────────────────────
enum class SensorType : uint8_t {
    TEMPERATURE   = 0,
    HUMIDITY      = 1,
    GAS           = 2,
    LIGHT         = 3,
    SOIL_MOISTURE = 4,
    MOTION_X      = 5,
    MOTION_Y      = 6,
    MOTION_Z      = 7,
    PROXIMITY     = 8,
    SOUND         = 9,
    UV            = 10,
    CO2           = 11
};

enum class SignalType : uint8_t {
    PWM = 0,
    DAC = 1
};

// ─── Per-channel dynamic config ───────────────────────────────────────────
struct ArduinoChannelConfig {
    SensorType  sensor;
    SignalType  signal;     // PWM or DAC
    uint8_t     pin;        // Arduino pin (e.g. A0, A1, 4..13)
    float       outputMin;  // Dynamic logical min
    float       outputMax;  // Dynamic logical max
};

// ─── Default 12-channel table ─────────────────────────────────────────────
static const ArduinoChannelConfig ARDUINO_CHANNEL_TABLE[] = {
    //  sensor                     signal           pin   outMin   outMax
    {  SensorType::TEMPERATURE,    SignalType::DAC,  A0,    0.0f,    50.0f  }, // ESP32 GPIO25 -> A0
    {  SensorType::HUMIDITY,       SignalType::DAC,  A1,    0.0f,   100.0f  }, // ESP32 GPIO26 -> A1
    {  SensorType::GAS,            SignalType::PWM,   4,    0.0f,  1000.0f  }, // ESP32 GPIO18 -> D4
    {  SensorType::LIGHT,          SignalType::PWM,   5,    0.0f,  1000.0f  }, // ESP32 GPIO19 -> D5
    {  SensorType::SOIL_MOISTURE,  SignalType::PWM,   6,    0.0f,   100.0f  }, // ESP32 GPIO21 -> D6
    {  SensorType::MOTION_X,       SignalType::PWM,   7,   -2.0f,     2.0f  }, // ESP32 GPIO22 -> D7
    {  SensorType::MOTION_Y,       SignalType::PWM,   8,   -2.0f,     2.0f  }, // ESP32 GPIO23 -> D8
    {  SensorType::MOTION_Z,       SignalType::PWM,   9,   -2.0f,     2.0f  }, // ESP32 GPIO27 -> D9
    {  SensorType::PROXIMITY,      SignalType::PWM,  10,    2.0f,   400.0f  }, // ESP32 GPIO32 -> D10
    {  SensorType::SOUND,          SignalType::PWM,  11,   30.0f,   120.0f  }, // ESP32 GPIO33 -> D11
    {  SensorType::UV,             SignalType::PWM,  12,    0.0f,    11.0f  }, // ESP32 GPIO14 -> D12
    {  SensorType::CO2,            SignalType::PWM,  13,  400.0f,  5000.0f  }, // ESP32 GPIO12 -> D13
};

static const uint8_t ARDUINO_CHANNEL_COUNT =
    sizeof(ARDUINO_CHANNEL_TABLE) / sizeof(ARDUINO_CHANNEL_TABLE[0]);
