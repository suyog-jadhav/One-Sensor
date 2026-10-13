#pragma once

/**
 * OneSensor.h — Public facade for the OneSensor Arduino library
 *
 * Supports all 12 simulated sensors with dynamic runtime configuration,
 * EEPROM persistence, and real-time PWM/DAC decoding.
 */

#include <Arduino.h>
#include "ArduinoChannelConfig.h"
#include "ArduinoConfigStore.h"
#include "SignalDecoder.h"
#include "PwmDecoder.h"
#include "DacDecoder.h"
#include "Calibration.h"

// NOTE: The legacy per-sensor wrapper classes (TemperatureSensor, HumiditySensor, etc.)
// are kept in src/ for reference but are NOT used by OneSensor v2. All 12 channels
// are handled generically through the ArduinoChannelConfig table and SignalDecoder.

class OneSensor {
public:
    OneSensor();

    /**
     * Initialise all decoders using EEPROM config or compiled defaults.
     * Prints ONESENSOR_ARDUINO_READY_FOR_PROVISIONING over Serial.
     * Call once in setup().
     */
    void begin();

    /**
     * Call every loop() iteration. Runs signal updates for all channels
     * and checks for serial provisioning commands.
     */
    void update();

    // ─── 12 Real-Time Sensor Reading Methods ────────────────────────────────
    // Returns NAN if the corresponding channel is invalid or receiving no signal.

    float readTemperature()  const;   // °C,  dynamic (default 0–50)
    float readHumidity()     const;   // %,   dynamic (default 0–100)
    float readGas()          const;   // ppm, dynamic (default 0–1000)
    float readLight()        const;   // lux, dynamic (default 0–1000)
    float readSoilMoisture() const;   // %,   dynamic (default 0–100)
    float readMotionX()      const;   // g,   dynamic (default -2 to +2)
    float readMotionY()      const;   // g,   dynamic (default -2 to +2)
    float readMotionZ()      const;   // g,   dynamic (default -2 to +2)
    float readProximity()    const;   // cm,  dynamic (default 2–400)
    float readSound()        const;   // dB,  dynamic (default 30–120)
    float readUV()           const;   // idx, dynamic (default 0–11)
    float readCO2()          const;   // ppm, dynamic (default 400–5000)

    /**
     * Generic sensor reader by SensorType enum.
     */
    float read(SensorType sensor) const;

    // ─── Dynamic Runtime Configuration ──────────────────────────────────────

    /**
     * Dynamically update the logical minimum and maximum range for a sensor channel.
     * Changes take effect immediately in read() without rebooting.
     * Example: sensor.setRange(SensorType::TEMPERATURE, 0.0f, 100.0f);
     */
    bool setRange(SensorType sensor, float min, float max);

    /**
     * Dynamically update the pin and signal type (PWM or DAC) for a sensor channel.
     */
    bool setPin(SensorType sensor, uint8_t pin, SignalType signal = SignalType::PWM);

    /**
     * Full channel reconfiguration: pin, signal type, min, and max.
     */
    bool configureChannel(SensorType sensor, uint8_t pin, SignalType signal, float min, float max);

    /**
     * Retrieve the active configuration for a sensor channel.
     */
    const ArduinoChannelConfig* getChannelConfig(SensorType sensor) const;

    /**
     * Persist current dynamic configuration to Arduino EEPROM.
     */
    void saveConfig();

    /**
     * Reset configuration to compiled defaults in ARDUINO_CHANNEL_TABLE.
     */
    void resetConfig();

    // ─── Status ─────────────────────────────────────────────────────────────

    /**
     * Returns true if all active channels are receiving valid signals.
     */
    bool isConnected() const;

    /**
     * Returns true if the specified channel is receiving valid signals.
     */
    bool isValid(SensorType sensor) const;

private:
    ArduinoChannelConfig _channels[ARDUINO_CHANNEL_COUNT];
    PwmDecoder _pwmDecoders[ARDUINO_CHANNEL_COUNT];
    DacDecoder _dacDecoders[ARDUINO_CHANNEL_COUNT];
    SignalDecoder* _decoders[ARDUINO_CHANNEL_COUNT];

    int8_t _channelIndexFor(SensorType sensor) const;
    void _reinitDecoders();
    bool _parseAndApplyProvisioning(const String& line, String& errReason);
    void _checkSerialCommands();

    bool _initialized;
};
