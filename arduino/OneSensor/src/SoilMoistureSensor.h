#pragma once
/**
 * SoilMoistureSensor.h — Logical soil moisture sensor (0–100 %)
 * Reads a calibrated duty cycle from its SignalDecoder.
 * Never touches GPIO, pulseIn(), or WebSocket.
 */
#include "SignalDecoder.h"
#include "Calibration.h"

class SoilMoistureSensor {
public:
    explicit SoilMoistureSensor(SignalDecoder* decoder,
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
