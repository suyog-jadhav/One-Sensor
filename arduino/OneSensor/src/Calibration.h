#pragma once

/**
 * Calibration.h — Linear calibration layer for all sensor channels
 *
 * dutyToLogicalValue() is the SINGLE implementation converting a raw PWM
 * duty cycle to a logical sensor value. It is used by all five sensor classes
 * with different CalibrationParams and output ranges — never five copies.
 *
 * CalibrationParams lets per-sensor drift be corrected (offset/scale) without
 * touching any other sensor's code. Default params (offset=0, scale=1) mean
 * no correction — straight duty→value conversion.
 *
 * Math:
 *   1. normalise duty from [pwmMin, pwmMax] to [0, 1]
 *   2. apply linear correction: corrected = normalised * scale + offset
 *   3. clamp to [0, 1]
 *   4. map to [outputMin, outputMax]
 */

#include <Arduino.h>

struct CalibrationParams {
    float pwmMin  = 0.0f;    // Measured duty-cycle lower bound (default: 0%)
    float pwmMax  = 100.0f;  // Measured duty-cycle upper bound (default: 100%)
    float offset  = 0.0f;    // Linear correction additive term
    float scale   = 1.0f;    // Linear correction multiplicative term
};

/**
 * Convert a raw duty cycle percentage to a calibrated logical sensor value.
 *
 * @param dutyPercent  Raw duty cycle [0.0, 100.0]
 * @param cal          Per-sensor calibration parameters
 * @param outputMin    Sensor logical minimum (e.g. 0.0 °C)
 * @param outputMax    Sensor logical maximum (e.g. 50.0 °C)
 * @return             Calibrated logical value in [outputMin, outputMax]
 */
float dutyToLogicalValue(float dutyPercent,
                          const CalibrationParams& cal,
                          float outputMin,
                          float outputMax);
