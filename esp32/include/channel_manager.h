#pragma once

/**
 * channel_manager.h — LEDC PWM Channel Lifecycle & Update Manager
 *
 * Owns the LEDC hardware channels. Responsibilities:
 *   1. Startup validation: check CHANNEL_TABLE for duplicate GPIOs, invalid GPIOs,
 *      input-only GPIOs — halt with Serial error if any conflict found.
 *   2. Init: call ledcSetup() + ledcAttachPin() for each channel in CHANNEL_TABLE.
 *   3. Update: read current SensorState, compute duty via ValueMapper, call ledcWrite().
 *
 * Rules:
 *   - No GPIO numbers appear inside this file's logic — they come from CHANNEL_TABLE.
 *   - Updating one channel must never block or glitch another.
 *   - Never call delay() here.
 */

#include <Arduino.h>
#include <array>
#include "hardware_config.h"
#include "config_store.h"

class ChannelManager {
public:
    /**
     * Load channel config from ConfigStore, validate, then initialise LEDC & DAC channels.
     * Returns false if validation fails.
     */
    bool begin();

    /**
     * Read current SensorState, recompute duty for every channel, and
     * call ledcWrite() / dacWrite() for each. Called every loop iteration.
     */
    void updateAll();

    /**
     * Force a specific duty cycle (0–100%) on a channel by index.
     */
    void setDutyPercent(uint8_t channelIndex, float dutyPercent);

    /**
     * Get current runtime channel configuration.
     */
    const std::array<ChannelConfig, MAX_CHANNELS>& getConfig() const { return _channels; }

    /**
     * Validate and apply a new channel configuration set without rebooting.
     * Updates hardware channels, saves to NVS if valid, and outputs error reason if invalid.
     */
    bool applyConfig(const std::array<ChannelConfig, MAX_CHANNELS>& cfg, String& outErrorReason);

private:
    bool _initialized = false;
    std::array<ChannelConfig, MAX_CHANNELS> _channels;

    /**
     * Validate channel configuration set for:
     *   - Duplicate GPIO numbers across channels
     *   - GPIOs outside the valid PWM/DAC pools
     *   - Input-only GPIOs (34–39 on ESP32)
     *   - More than 2 DAC channels
     *   - DAC GPIOs other than 25/26
     *   - Duplicate LEDC channels for PWM
     */
    bool _validateConfig(const std::array<ChannelConfig, MAX_CHANNELS>& cfg, String& outErrorReason);

    /**
     * Convert duty percent (0–100) to LEDC duty count for a given resolution.
     */
    uint32_t _dutyPercentToCount(float dutyPercent, uint8_t resolutionBits);
};

// Global singleton
extern ChannelManager gChannelManager;

