/**
 * value_mapper.cpp — Normalize / Denormalize sensor value ↔ duty cycle
 */

#include "value_mapper.h"
#include <Arduino.h>  // constrain()

float normalizeValue(float value, float inputMin, float inputMax) {
    if (inputMax == inputMin) return 0.0f;  // guard: avoid divide-by-zero
    float normalized = (value - inputMin) / (inputMax - inputMin);
    return constrain(normalized, 0.0f, 1.0f);
}

float denormalizeValue(float normalized, float outputMin, float outputMax) {
    return outputMin + normalized * (outputMax - outputMin);
}

float valueToDutyPercent(float value, float inputMin, float inputMax) {
    return normalizeValue(value, inputMin, inputMax) * 100.0f;
}
