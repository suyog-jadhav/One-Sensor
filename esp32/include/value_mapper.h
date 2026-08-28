#pragma once

/**
 * value_mapper.h — Normalize / Denormalize logical sensor values
 *
 * This is the single implementation of the sensor-value ↔ duty-cycle conversion.
 * It is used by ALL channels — never duplicated per sensor.
 *
 * normalizeValue:   logical value  →  0.0–1.0  (clamped, never out-of-range)
 * denormalizeValue: 0.0–1.0       →  logical value
 *
 * Example:
 *   normalizeValue(25.0, 0.0, 50.0)   == 0.5
 *   normalizeValue(-5.0, 0.0, 50.0)   == 0.0   (clamped)
 *   normalizeValue(60.0, 0.0, 50.0)   == 1.0   (clamped)
 *   denormalizeValue(0.5, 0.0, 50.0)  == 25.0
 */

/**
 * Map a logical sensor value into the normalized [0.0, 1.0] range.
 * Clamps the result to [0.0, 1.0] — never returns < 0 or > 1.
 *
 * @param value    The raw logical value (e.g. 32.5 °C)
 * @param inputMin Sensor logical minimum (e.g. 0.0 °C)
 * @param inputMax Sensor logical maximum (e.g. 50.0 °C)
 * @return         Normalized value in [0.0, 1.0]
 */
float normalizeValue(float value, float inputMin, float inputMax);

/**
 * Map a normalized [0.0, 1.0] value back into a logical range.
 * Does NOT clamp — caller must supply a valid normalized input.
 *
 * @param normalized Value in [0.0, 1.0]
 * @param outputMin  Target minimum
 * @param outputMax  Target maximum
 * @return           Value in [outputMin, outputMax]
 */
float denormalizeValue(float normalized, float outputMin, float outputMax);

/**
 * Convenience: convert a logical sensor value to PWM duty in [0.0, 100.0].
 * Equivalent to: normalizeValue(value, inputMin, inputMax) * 100.0
 */
float valueToDutyPercent(float value, float inputMin, float inputMax);
