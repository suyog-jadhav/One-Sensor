/**
 * PwmDecoder.cpp — pulseIn()-based PWM duty cycle decoder
 */

#include "PwmDecoder.h"
#include <Arduino.h>

PwmDecoder::PwmDecoder()
    : _pin(0), _dutyCycle(0.0f), _frequencyHz(0.0f),
      _failCount(VALIDITY_WINDOW), _initialized(false)
{}

// ─── begin() ─────────────────────────────────────────────────────────────────
bool PwmDecoder::begin(uint8_t pin) {
    if (pin == 0) return false;   // 0 used as invalid sentinel on AVR
    _pin = pin;
    pinMode(_pin, INPUT);
    _initialized = true;
    _failCount   = VALIDITY_WINDOW;  // start as invalid until first good read
    return true;
}

// ─── update() ────────────────────────────────────────────────────────────────
bool PwmDecoder::update() {
    if (!_initialized) return false;

    // Measure HIGH pulse duration, then LOW pulse duration.
    // Both calls are bounded by PULSE_TIMEOUT_US — no indefinite blocking.
    uint32_t highUs = pulseIn(_pin, HIGH, PULSE_TIMEOUT_US);
    uint32_t lowUs  = pulseIn(_pin, LOW,  PULSE_TIMEOUT_US);

    // pulseIn() returns 0 on timeout or if no signal is present.
    // A DC-HIGH or DC-LOW line gives highUs>0,lowUs=0 or vice versa.
    // Treat both sub-components being non-zero as a valid reading.
    if (highUs == 0 && lowUs == 0) {
        // No signal at all — increment failure counter
        if (_failCount < VALIDITY_WINDOW) _failCount++;
        return false;
    }

    uint32_t periodUs = highUs + lowUs;

    // Guard: avoid divide-by-zero if one half is zero (DC line)
    if (periodUs == 0) {
        if (_failCount < VALIDITY_WINDOW) _failCount++;
        return false;
    }

    _dutyCycle   = (float)highUs / (float)periodUs * 100.0f;
    _frequencyHz = 1000000.0f / (float)periodUs;
    _failCount   = 0;  // reset on successful read
    return true;
}

// ─── getDutyCycle() ──────────────────────────────────────────────────────────
float PwmDecoder::getDutyCycle() {
    return _dutyCycle;
}

// ─── getFrequency() ──────────────────────────────────────────────────────────
float PwmDecoder::getFrequency() {
    return _frequencyHz;
}

// ─── isValid() ───────────────────────────────────────────────────────────────
bool PwmDecoder::isValid() {
    return _initialized && (_failCount < VALIDITY_WINDOW);
}
