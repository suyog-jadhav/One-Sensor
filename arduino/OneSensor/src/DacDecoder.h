#pragma once

/**
 * DacDecoder.h — analogRead()-based DAC signal decoder
 *
 * Implements SignalDecoder for Arduino analog input pins (A0–A5).
 * Reads the analog output voltage emitted by an ESP32 DAC pin (0.0 V – 3.3 V max).
 *
 * Scaling:
 *   - ESP32 DAC outputs 0.0 V to 3.3 V (0–255 8-bit resolution).
 *   - Arduino Uno 10-bit ADC reference defaults to 5.0 V (0–1023 count range).
 *   - At 3.3 V max ESP32 output, ADC count is ~675 (1023 * 3.3 / 5.0).
 *   - DacDecoder scales the 0–675 ADC reading to a 0.0 – 100.0% signal percentage.
 */

#include "SignalDecoder.h"

class DacDecoder : public SignalDecoder {
public:
    static const uint8_t VALIDITY_WINDOW = 5;

    DacDecoder();

    // Configure decoder for the given analog pin (e.g. A0).
    bool begin(uint8_t pin) override;

    // Perform an analogRead() and update the internal signal percentage.
    bool update() override;

    // Most recent signal level [0.0, 100.0].
    float getDutyCycle() override;

    // Frequency is 0.0 Hz for DC analog voltage.
    float getFrequency() override;

    // Returns true if decoder has been initialized and reading is valid.
    bool isValid() override;

private:
    uint8_t  _pin;
    float    _percent;      // signal percent [0.0, 100.0]
    uint8_t  _failCount;
    bool     _initialized;
};
