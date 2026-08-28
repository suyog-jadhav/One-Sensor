#pragma once
/**
 * LightSensor.h — Logical light sensor (0–1000 lux)
 * Reads a calibrated duty cycle from its SignalDecoder.
 * Never touches GPIO, pulseIn(), or WebSocket.
 */
#include "SignalDecoder.h"
#include "Calibration.h"

class LightSensor {
public:
    explicit LightSensor(SignalDecoder* decoder,
                              CalibrationParams cal = CalibrationParams{},
                              float outputMin = 0.0f,
                              float outputMax = 1000.0f);
    float read() const;
    bool  isValid() const;
private:
    SignalDecoder*    _decoder;
    CalibrationParams _cal;
    float             _outputMin;
    float             _outputMax;
};
