#pragma once
/**
 * HumiditySensor.h — Logical humidity sensor (0–100 %)
 * Reads a calibrated duty cycle from its SignalDecoder.
 * Never touches GPIO, pulseIn(), or WebSocket.
 */
#include "SignalDecoder.h"
#include "Calibration.h"

class HumiditySensor {
public:
    explicit HumiditySensor(SignalDecoder* decoder,
                              CalibrationParams cal = CalibrationParams{},
                              float outputMin = 0.0f,
                              float outputMax = 100.0f);
    float read() const;
    bool  isValid() const;
private:
    SignalDecoder*    _decoder;
    CalibrationParams _cal;
    float             _outputMin;
    float             _outputMax;
};
