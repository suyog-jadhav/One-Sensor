/**
 * Calibration.cpp — dutyToLogicalValue implementation
 */

#include "Calibration.h"

float dutyToLogicalValue(float dutyPercent,
                          const CalibrationParams& cal,
                          float outputMin,
                          float outputMax) {
    // 1. Normalise duty from [pwmMin, pwmMax] → [0, 1]
    float range = cal.pwmMax - cal.pwmMin;
    if (range == 0.0f) return outputMin;   // degenerate config guard
    float normalized = (dutyPercent - cal.pwmMin) / range;

    // 2. Apply linear calibration correction
    float corrected = normalized * cal.scale + cal.offset;

    // 3. Clamp to [0, 1]
    if (corrected < 0.0f) corrected = 0.0f;
    if (corrected > 1.0f) corrected = 1.0f;

    // 4. Map to logical output range
    return outputMin + corrected * (outputMax - outputMin);
}
