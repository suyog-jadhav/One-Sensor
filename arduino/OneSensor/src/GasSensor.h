#pragma once
/**
 * GasSensor.h — Logical gas sensor (0–1000 ppm)
 * Reads a calibrated duty cycle from its SignalDecoder.
 * Never touches GPIO, pulseIn(), or WebSocket.
 */
#include "SignalDecoder.h"
#include "Calibration.h"

class GasSensor {
public:
    explicit GasSensor(SignalDecoder* decoder,
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
