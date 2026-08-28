#include "HumiditySensor.h"
#include <math.h>

HumiditySensor::HumiditySensor(SignalDecoder* decoder,
                                   CalibrationParams cal,
                                   float outputMin, float outputMax)
    : _decoder(decoder), _cal(cal), _outputMin(outputMin), _outputMax(outputMax) {}

float HumiditySensor::read() const {
    if (!_decoder || !_decoder->isValid()) return NAN;
    return dutyToLogicalValue(_decoder->getDutyCycle(), _cal, _outputMin, _outputMax);
}

bool HumiditySensor::isValid() const {
    return _decoder && _decoder->isValid();
}
