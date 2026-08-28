#pragma once
/**
 * TemperatureSensor.h — Logical temperature sensor (0–50 °C)
 * Reads a calibrated duty cycle from its SignalDecoder and returns °C.
 * Never touches GPIO, pulseIn(), or WebSocket — those are core-layer concerns.
 */
#include "SignalDecoder.h"
#include "Calibration.h"

class TemperatureSensor {
public:
    explicit TemperatureSensor(SignalDecoder* decoder,
                                CalibrationParams cal = CalibrationParams{},
                                float outputMin = 0.0f,
                                float outputMax = 50.0f);
    float read() const;      // Returns temperature in °C; NaN if !isValid()
    bool  isValid() const;
private:
    SignalDecoder*   _decoder;
    CalibrationParams _cal;
    float            _outputMin;
    float            _outputMax;
};
