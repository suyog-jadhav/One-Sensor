/**
 * channel_manager.cpp — LEDC channel init, validation, update loop, and NVS config sync
 */

#include "channel_manager.h"
#include "hardware_config.h"
#include "sensor_state.h"
#include "value_mapper.h"
#include <Arduino.h>

// ─── Global singleton ─────────────────────────────────────────────────────────
ChannelManager gChannelManager;

// ─── begin() ─────────────────────────────────────────────────────────────────
bool ChannelManager::begin() {
    Serial.println(F("[ChannelManager] Loading configuration from ConfigStore..."));
    _channels = gConfigStore.load();

    String errorReason;
    if (!_validateConfig(_channels, errorReason)) {
        Serial.printf("[ChannelManager] FATAL: Config validation failed (%s). PWM/DAC not started.\n",
                      errorReason.c_str());
        return false;
    }

    Serial.println(F("[ChannelManager] Validation passed. Initialising LEDC & DAC channels..."));

    for (uint8_t i = 0; i < MAX_CHANNELS; i++) {
        const ChannelConfig& ch = _channels[i];

        float dutyPct = valueToDutyPercent(ch.defaultValue, ch.inputMin, ch.inputMax);

        if (ch.signal == SignalType::DAC) {
            uint8_t dacVal = (uint8_t)((constrain(dutyPct, 0.0f, 100.0f) / 100.0f) * 255.0f + 0.5f);
            dacWrite(ch.gpio, dacVal);
            Serial.printf("[ChannelManager] Ch%u: GPIO%u  [DAC]  default=%.1f  duty=%.1f%% (%u counts)\n",
                          i, ch.gpio, ch.defaultValue, dutyPct, dacVal);
        } else {
            // Setup LEDC timer + channel
            ledcSetup(ch.ledcChannel, ch.frequencyHz, ch.resolutionBits);
            ledcAttachPin(ch.gpio, ch.ledcChannel);

            // Output default value at boot
            uint32_t dutyCnt = _dutyPercentToCount(dutyPct, ch.resolutionBits);
            ledcWrite(ch.ledcChannel, dutyCnt);

            Serial.printf("[ChannelManager] Ch%u: GPIO%u  [PWM] %u Hz  %u-bit  default=%.1f  duty=%.1f%% (%lu)\n",
                          i, ch.gpio, ch.frequencyHz, ch.resolutionBits,
                          ch.defaultValue, dutyPct, (unsigned long)dutyCnt);
        }
    }

    _initialized = true;
    Serial.println(F("[ChannelManager] All channels initialised."));
    return true;
}

// ─── updateAll() ─────────────────────────────────────────────────────────────
void ChannelManager::updateAll() {
    if (!_initialized) return;

    for (uint8_t i = 0; i < MAX_CHANNELS; i++) {
        const ChannelConfig& ch = _channels[i];
        float logicalValue = gSensorState.getByType(ch.sensor);
        float dutyPct      = valueToDutyPercent(logicalValue, ch.inputMin, ch.inputMax);

        if (ch.signal == SignalType::DAC) {
            uint8_t dacVal = (uint8_t)((constrain(dutyPct, 0.0f, 100.0f) / 100.0f) * 255.0f + 0.5f);
            dacWrite(ch.gpio, dacVal);
        } else {
            uint32_t dutyCnt = _dutyPercentToCount(dutyPct, ch.resolutionBits);
            ledcWrite(ch.ledcChannel, dutyCnt);
        }
    }
}

// ─── setDutyPercent() ────────────────────────────────────────────────────────
void ChannelManager::setDutyPercent(uint8_t channelIndex, float dutyPercent) {
    if (channelIndex >= MAX_CHANNELS) return;
    const ChannelConfig& ch = _channels[channelIndex];
    if (ch.signal == SignalType::DAC) {
        uint8_t dacVal = (uint8_t)((constrain(dutyPercent, 0.0f, 100.0f) / 100.0f) * 255.0f + 0.5f);
        dacWrite(ch.gpio, dacVal);
        Serial.printf("[ChannelManager] Manual duty set: Ch%u GPIO%u [DAC] = %.1f%% (%u counts)\n",
                      channelIndex, ch.gpio, dutyPercent, dacVal);
    } else {
        uint32_t cnt = _dutyPercentToCount(dutyPercent, ch.resolutionBits);
        ledcWrite(ch.ledcChannel, cnt);
        Serial.printf("[ChannelManager] Manual duty set: Ch%u GPIO%u [PWM] = %.1f%% (%lu counts)\n",
                      channelIndex, ch.gpio, dutyPercent, (unsigned long)cnt);
    }
}

// ─── applyConfig() ───────────────────────────────────────────────────────────
bool ChannelManager::applyConfig(const std::array<ChannelConfig, MAX_CHANNELS>& cfg, String& outErrorReason) {
    if (!_validateConfig(cfg, outErrorReason)) {
        Serial.printf("[ChannelManager] Config rejected: %s\n", outErrorReason.c_str());
        return false;
    }

    // Detach pins if pin/signal changed
    for (uint8_t i = 0; i < MAX_CHANNELS; i++) {
        if (_initialized && (_channels[i].gpio != cfg[i].gpio || _channels[i].signal != cfg[i].signal)) {
            if (_channels[i].signal == SignalType::PWM) {
                ledcDetachPin(_channels[i].gpio);
                Serial.printf("[ChannelManager] Detached PWM pin GPIO%u (Ch%u)\n", _channels[i].gpio, i);
            }
        }
    }

    _channels = cfg;

    // Re-initialize hardware channels per new config
    for (uint8_t i = 0; i < MAX_CHANNELS; i++) {
        const ChannelConfig& ch = _channels[i];
        float logicalValue = gSensorState.getByType(ch.sensor);
        float dutyPct      = valueToDutyPercent(logicalValue, ch.inputMin, ch.inputMax);

        if (ch.signal == SignalType::DAC) {
            uint8_t dacVal = (uint8_t)((constrain(dutyPct, 0.0f, 100.0f) / 100.0f) * 255.0f + 0.5f);
            dacWrite(ch.gpio, dacVal);
        } else {
            ledcSetup(ch.ledcChannel, ch.frequencyHz, ch.resolutionBits);
            ledcAttachPin(ch.gpio, ch.ledcChannel);
            uint32_t dutyCnt = _dutyPercentToCount(dutyPct, ch.resolutionBits);
            ledcWrite(ch.ledcChannel, dutyCnt);
        }
    }

    _initialized = true;

    // Save to NVS
    gConfigStore.save(_channels);
    Serial.println(F("[ChannelManager] New configuration applied and saved to NVS."));
    return true;
}

// ─── _validateConfig() ───────────────────────────────────────────────────────
bool ChannelManager::_validateConfig(const std::array<ChannelConfig, MAX_CHANNELS>& cfg, String& outErrorReason) {
    uint8_t dacCount = 0;

    // 1. Check each GPIO against valid pool for its signal type
    for (uint8_t i = 0; i < MAX_CHANNELS; i++) {
        uint8_t gpio = cfg[i].gpio;
        SignalType signal = cfg[i].signal;

        if (signal == SignalType::DAC) {
            dacCount++;
            if (dacCount > 2) {
                outErrorReason = "More than 2 channels requesting SignalType::DAC";
                return false;
            }

            bool foundDac = false;
            for (uint8_t d = 0; d < VALID_DAC_GPIO_COUNT; d++) {
                if (VALID_DAC_GPIOS[d] == gpio) { foundDac = true; break; }
            }
            if (!foundDac) {
                outErrorReason = "GPIO " + String(gpio) + " is not a valid hardware DAC pin (must be 25 or 26)";
                return false;
            }
        } else {
            // Input-only pins (ESP32-WROOM-32): 34–39
            if (gpio >= 34 && gpio <= 39) {
                outErrorReason = "GPIO " + String(gpio) + " is input-only and cannot be used for PWM output";
                return false;
            }

            bool foundPwm = false;
            for (uint8_t v = 0; v < VALID_PWM_GPIO_COUNT; v++) {
                if (VALID_PWM_GPIOS[v] == gpio) { foundPwm = true; break; }
            }
            if (!foundPwm) {
                outErrorReason = "GPIO " + String(gpio) + " is not in the valid PWM-capable GPIO pool";
                return false;
            }
        }
    }

    // 2. Check for duplicate GPIOs across channels
    for (uint8_t i = 0; i < MAX_CHANNELS; i++) {
        for (uint8_t j = i + 1; j < MAX_CHANNELS; j++) {
            if (cfg[i].gpio == cfg[j].gpio) {
                outErrorReason = "GPIO " + String(cfg[i].gpio) + " is assigned to multiple channels";
                return false;
            }
        }
    }

    // 3. Check for duplicate LEDC channel indices (for PWM channels)
    for (uint8_t i = 0; i < MAX_CHANNELS; i++) {
        if (cfg[i].signal != SignalType::PWM) continue;
        for (uint8_t j = i + 1; j < MAX_CHANNELS; j++) {
            if (cfg[j].signal != SignalType::PWM) continue;
            if (cfg[i].ledcChannel == cfg[j].ledcChannel) {
                outErrorReason = "LEDC channel " + String(cfg[i].ledcChannel) + " is assigned to multiple PWM channels";
                return false;
            }
        }
    }

    return true;
}

// ─── _dutyPercentToCount() ───────────────────────────────────────────────────
uint32_t ChannelManager::_dutyPercentToCount(float dutyPercent, uint8_t resolutionBits) {
    uint32_t maxCount = (1u << resolutionBits) - 1;
    float clamped = constrain(dutyPercent, 0.0f, 100.0f);
    return (uint32_t)((clamped / 100.0f) * (float)maxCount + 0.5f);
}
