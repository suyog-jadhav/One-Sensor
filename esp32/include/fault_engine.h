#pragma once

#include "hardware_config.h"
#include <Arduino.h>

/**
 * fault_engine.h — Runtime Sensor Fault Transformation Engine
 *
 * Implements DROPOUT, STUCK, NOISE, SPIKE, DRIFT, DISCONNECT, LATENCY transformations
 * applied in the signal-generation pipeline between setpoints and physical outputs.
 */

float applyFault(float trueValue, ChannelFaultState& fault, float minRange, float maxRange, uint32_t nowMs, uint8_t channelIndex = 0);
