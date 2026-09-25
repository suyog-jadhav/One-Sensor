#include "fault_engine.h"
#include <math.h>

struct LatencySample {
    uint32_t timestamp;
    float value;
};

static const uint8_t RING_SIZE = 32;
static LatencySample s_ringBuffers[MAX_CHANNELS][RING_SIZE];
static uint8_t s_ringIndices[MAX_CHANNELS] = {0};
static float s_lastOutputs[MAX_CHANNELS] = {0};

float applyFault(float trueValue, ChannelFaultState& fault, float minRange, float maxRange, uint32_t nowMs, uint8_t channelIndex) {
    if (channelIndex >= MAX_CHANNELS) channelIndex = 0;

    // Record sample in ring buffer for latency tracking
    uint8_t& idx = s_ringIndices[channelIndex];
    s_ringBuffers[channelIndex][idx] = { nowMs, trueValue };
    idx = (idx + 1) % RING_SIZE;

    // Check auto-expiration if durationMs > 0
    if (fault.type != FaultType::NONE && fault.durationMs > 0) {
        if (nowMs - fault.startedAtMs >= fault.durationMs) {
            fault.type = FaultType::NONE;
        }
    }

    float result = trueValue;

    switch (fault.type) {
        case FaultType::NONE:
            result = trueValue;
            break;

        case FaultType::DROPOUT:
            // Intermittent freeze at last known value
            result = s_lastOutputs[channelIndex];
            break;

        case FaultType::STUCK:
            // Pinned to magnitude setting
            result = fault.magnitude;
            break;

        case FaultType::NOISE: {
            // Gaussian jitter with stddev = fault.magnitude using Box-Muller
            float u1 = ((float)rand() + 1.0f) / ((float)RAND_MAX + 1.0f);
            float u2 = ((float)rand() + 1.0f) / ((float)RAND_MAX + 1.0f);
            float z = sqrtf(-2.0f * logf(u1)) * cosf(2.0f * (float)M_PI * u2);
            result = trueValue + z * fault.magnitude;
            break;
        }

        case FaultType::SPIKE: {
            // Excursion by magnitude or to max boundary
            float spikeDelta = (fabsf(fault.magnitude) > 0.001f) ? fault.magnitude : (maxRange - minRange);
            result = trueValue + spikeDelta;
            break;
        }

        case FaultType::DRIFT: {
            // Linear bias accumulation per second: drift = magnitude * elapsedSeconds
            float elapsedSec = (float)(nowMs - fault.startedAtMs) / 1000.0f;
            result = trueValue + (fault.magnitude * elapsedSec);
            break;
        }

        case FaultType::DISCONNECT:
            // Disconnected channel: returns NAN
            return NAN;

        case FaultType::LATENCY: {
            // Delayed by latencyMs
            uint32_t targetTime = (nowMs > fault.latencyMs) ? (nowMs - fault.latencyMs) : 0;
            float delayedValue = trueValue;
            uint32_t closestDiff = 0xFFFFFFFF;

            for (uint8_t i = 0; i < RING_SIZE; i++) {
                const auto& sample = s_ringBuffers[channelIndex][i];
                if (sample.timestamp == 0) continue;
                uint32_t diff = (sample.timestamp > targetTime) ? (sample.timestamp - targetTime) : (targetTime - sample.timestamp);
                if (diff < closestDiff) {
                    closestDiff = diff;
                    delayedValue = sample.value;
                }
            }
            result = delayedValue;
            break;
        }
    }

    // Clamp value to defined physical range if finite
    if (!isnan(result)) {
        result = constrain(result, minRange, maxRange);
        s_lastOutputs[channelIndex] = result;
    }

    return result;
}
