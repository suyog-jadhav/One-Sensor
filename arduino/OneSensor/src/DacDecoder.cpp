/**
 * DacDecoder.cpp — analogRead()-based DAC signal decoder implementation
 */

#include "DacDecoder.h"
#include <Arduino.h>

DacDecoder::DacDecoder()
    : _pin(0), _percent(0.0f),
      _failCount(VALIDITY_WINDOW), _initialized(false)
{}

// ─── begin() ─────────────────────────────────────────────────────────────────
bool DacDecoder::begin(uint8_t pin) {
    _pin = pin;
    pinMode(_pin, INPUT);
    _initialized = true;
    _failCount   = 0;
    return true;
}

// ─── update() ────────────────────────────────────────────────────────────────
bool DacDecoder::update() {
    if (!_initialized) return false;

    int rawAdc = analogRead(_pin);
    if (rawAdc < 0) {
        if (_failCount < VALIDITY_WINDOW) _failCount++;
        return false;
    }

    // 3.3V max from ESP32 DAC into Arduino Uno 5.0V ADC reference (1023 count max)
    // 3.3V / 5.0V * 1023 = 675.18 max count
    const float MAX_DAC_ADC_COUNT = (3.3f / 5.0f) * 1023.0f; // ~675.18
    float pct = ((float)rawAdc / MAX_DAC_ADC_COUNT) * 100.0f;

    _percent   = constrain(pct, 0.0f, 100.0f);
    _failCount = 0;
    return true;
}

// ─── getDutyCycle() ──────────────────────────────────────────────────────────
float DacDecoder::getDutyCycle() {
    return _percent;
}

// ─── getFrequency() ──────────────────────────────────────────────────────────
float DacDecoder::getFrequency() {
    return 0.0f; // DC signal
}

// ─── isValid() ───────────────────────────────────────────────────────────────
bool DacDecoder::isValid() {
    return _initialized && (_failCount < VALIDITY_WINDOW);
}
