#pragma once

/**
 * SignalDecoder.h — Abstract interface for PWM (and future) signal decoders
 *
 * PwmDecoder implements this interface. Future decoders (UART, I2C, etc.)
 * will also implement it. OneSensor sensor classes depend only on this
 * interface — they never call pulseIn() or touch GPIO directly.
 *
 * When PCINT or another transport replaces PwmDecoder, the public API
 * (begin, update, getDutyCycle, getFrequency, isValid) does not change.
 */

#include <Arduino.h>

class SignalDecoder {
public:
    virtual ~SignalDecoder() = default;

    /**
     * Configure decoder for the given pin. Returns false if pin is invalid.
     * Must be called once before any other method.
     */
    virtual bool begin(uint8_t pin) = 0;

    /**
     * Take one bounded-timeout measurement.
     * Returns true if a valid reading was obtained.
     * Never blocks longer than the configured timeout.
     */
    virtual bool update() = 0;

    /**
     * Return the most recent duty cycle, 0.0–100.0.
     * Value is undefined if isValid() is false.
     */
    virtual float getDutyCycle() = 0;

    /**
     * Return the measured signal frequency in Hz.
     * Value is undefined if isValid() is false.
     */
    virtual float getFrequency() = 0;

    /**
     * Return true if recent reads have been healthy (not all timed out/failed).
     * Based on a rolling window of N recent readings, not just the last one.
     */
    virtual bool isValid() = 0;
};
