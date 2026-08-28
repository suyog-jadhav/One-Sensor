#pragma once

/**
 * PwmDecoder.h — pulseIn()-based PWM duty cycle decoder (v1)
 *
 * Implements SignalDecoder using pulseIn() on any digital pin.
 * This is the v1 strategy. v2 will use Pin-Change Interrupts (PCINT)
 * for all digital pins — the public interface (begin/update/getDutyCycle/
 * getFrequency/isValid) will not change when that swap happens.
 *
 * Design notes:
 *   - pulseIn() timeout is capped at PULSE_TIMEOUT_US (25 ms default).
 *     A stuck/missing signal returns 0 from pulseIn() after the timeout,
 *     never hanging the Arduino loop indefinitely.
 *   - isValid() uses a rolling failure count (VALIDITY_WINDOW). It returns
 *     false only after VALIDITY_WINDOW consecutive failed reads, providing
 *     noise immunity: one bad read does not invalidate a healthy channel.
 *   - getFrequency() is derived from the total period (high + low pulse).
 *
 * Future upgrade path (PCINT):
 *   Replace this class's internals with interrupt-driven ISR bookkeeping.
 *   The public API stays identical, so no sensor class or example changes.
 */

#include "SignalDecoder.h"

class PwmDecoder : public SignalDecoder {
public:
    // Maximum time pulseIn() will wait for a pulse edge (microseconds).
    // At 500 Hz, the full period is 2000 µs — 25 ms gives 12.5× headroom.
    static const uint32_t PULSE_TIMEOUT_US = 25000UL;

    // Number of consecutive failed reads before isValid() returns false.
    static const uint8_t VALIDITY_WINDOW = 5;

    PwmDecoder();

    // Configure decoder for the given pin (sets INPUT mode).
    // Returns false if pin is 0 (invalid sentinel).
    bool begin(uint8_t pin) override;

    // Take one pulseIn() HIGH + LOW measurement with bounded timeout.
    // Returns true on success, false on timeout/no-signal.
    bool update() override;

    // Most recent duty cycle [0.0, 100.0].
    float getDutyCycle() override;

    // Most recent frequency in Hz (derived from period = HIGH + LOW time).
    float getFrequency() override;

    // Returns true if at least one of the last VALIDITY_WINDOW reads succeeded.
    bool isValid() override;

private:
    uint8_t  _pin;
    float    _dutyCycle;     // last valid duty [0.0, 100.0]
    float    _frequencyHz;   // last valid frequency [Hz]
    uint8_t  _failCount;     // consecutive failed reads
    bool     _initialized;
};
