/**
 * channel_manager.cpp — LEDC channel init, validation, and update loop
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
    Serial.println(F("[ChannelManager] Starting validation..."));

    if (!_validateConfig()) {
        Serial.println(F("[ChannelManager] FATAL: Config validation failed. PWM not started."));
        return false;
    }

    Serial.println(F("[ChannelManager] Validation passed. Initialising LEDC channels..."));

    for (uint8_t i = 0; i < CHANNEL_COUNT; i++) {
        const ChannelConfig& ch = CHANNEL_TABLE[i];

        // Setup LEDC timer + channel
        ledcSetup(ch.ledcChannel, ch.frequencyHz, ch.resolutionBits);
        ledcAttachPin(ch.gpio, ch.ledcChannel);

        // Output default value at boot
        float dutyPct = valueToDutyPercent(ch.defaultValue, ch.inputMin, ch.inputMax);
        uint32_t dutyCnt = _dutyPercentToCount(dutyPct, ch.resolutionBits);
        ledcWrite(ch.ledcChannel, dutyCnt);

        Serial.printf("[ChannelManager] Ch%u: GPIO%u  %u Hz  %u-bit  default=%.1f  duty=%.1f%% (%lu)\n",
                      i, ch.gpio, ch.frequencyHz, ch.resolutionBits,
                      ch.defaultValue, dutyPct, (unsigned long)dutyCnt);
    }

    _initialized = true;
    Serial.println(F("[ChannelManager] All channels initialised."));
    return true;
}

// ─── updateAll() ─────────────────────────────────────────────────────────────
void ChannelManager::updateAll() {
    if (!_initialized) return;

    for (uint8_t i = 0; i < CHANNEL_COUNT; i++) {
        const ChannelConfig& ch = CHANNEL_TABLE[i];
        float logicalValue = gSensorState.getByType(ch.sensor);
        float dutyPct      = valueToDutyPercent(logicalValue, ch.inputMin, ch.inputMax);
        uint32_t dutyCnt   = _dutyPercentToCount(dutyPct, ch.resolutionBits);
        ledcWrite(ch.ledcChannel, dutyCnt);

#ifdef DEBUG
        Serial.printf("[ChannelManager] Ch%u update: value=%.2f  duty=%.1f%%  count=%lu\n",
                      i, logicalValue, dutyPct, (unsigned long)dutyCnt);
#endif
    }
}

// ─── setDutyPercent() — Phase 1 test helper ─────────────────────────────────
void ChannelManager::setDutyPercent(uint8_t channelIndex, float dutyPercent) {
    if (channelIndex >= CHANNEL_COUNT) return;
    const ChannelConfig& ch = CHANNEL_TABLE[channelIndex];
    uint32_t cnt = _dutyPercentToCount(dutyPercent, ch.resolutionBits);
    ledcWrite(ch.ledcChannel, cnt);
    Serial.printf("[ChannelManager] Manual duty set: Ch%u GPIO%u = %.1f%% (%lu counts)\n",
                  channelIndex, ch.gpio, dutyPercent, (unsigned long)cnt);
}

// ─── _validateConfig() ───────────────────────────────────────────────────────
bool ChannelManager::_validateConfig() {
    bool ok = true;

    // 1. Check each GPIO is in the valid pool and not input-only
    for (uint8_t i = 0; i < CHANNEL_COUNT; i++) {
        uint8_t gpio = CHANNEL_TABLE[i].gpio;
        bool found = false;

        // Input-only pins (ESP32-WROOM-32): 34–39
        if (gpio >= 34 && gpio <= 39) {
            Serial.printf("[ChannelManager] ERROR: GPIO %u is input-only and cannot be used for PWM output (channel %u)\n",
                          gpio, i);
            ok = false;
            continue;
        }

        for (uint8_t v = 0; v < VALID_PWM_GPIO_COUNT; v++) {
            if (VALID_PWM_GPIOS[v] == gpio) { found = true; break; }
        }
        if (!found) {
            Serial.printf("[ChannelManager] ERROR: GPIO %u is not in the valid PWM-capable GPIO pool (channel %u)\n",
                          gpio, i);
            ok = false;
        }
    }

    // 2. Check for duplicate GPIOs across channels
    for (uint8_t i = 0; i < CHANNEL_COUNT; i++) {
        for (uint8_t j = i + 1; j < CHANNEL_COUNT; j++) {
            if (CHANNEL_TABLE[i].gpio == CHANNEL_TABLE[j].gpio) {
                Serial.printf("[ChannelManager] ERROR: GPIO %u is assigned to both channel %u and channel %u\n",
                              CHANNEL_TABLE[i].gpio, i, j);
                ok = false;
            }
        }
    }

    // 3. Check for duplicate LEDC channel indices
    for (uint8_t i = 0; i < CHANNEL_COUNT; i++) {
        for (uint8_t j = i + 1; j < CHANNEL_COUNT; j++) {
            if (CHANNEL_TABLE[i].ledcChannel == CHANNEL_TABLE[j].ledcChannel) {
                Serial.printf("[ChannelManager] ERROR: LEDC channel %u is assigned to both sensor channel %u and %u\n",
                              CHANNEL_TABLE[i].ledcChannel, i, j);
                ok = false;
            }
        }
    }

    return ok;
}

// ─── _dutyPercentToCount() ───────────────────────────────────────────────────
uint32_t ChannelManager::_dutyPercentToCount(float dutyPercent, uint8_t resolutionBits) {
    uint32_t maxCount = (1u << resolutionBits) - 1;
    float clamped = constrain(dutyPercent, 0.0f, 100.0f);
    return (uint32_t)((clamped / 100.0f) * (float)maxCount + 0.5f);
}
