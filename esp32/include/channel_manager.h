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

class ChannelManager {
public:
    /**
     * Validate CHANNEL_TABLE, then initialise all LEDC channels.
     * Prints errors to Serial and returns false if validation fails.
     * Must be called once in setup() before any updateAll().
     */
    bool begin();

    /**
     * Read current SensorState, recompute duty for every channel, and
     * call ledcWrite() for each. Called every loop iteration.
     * Non-blocking — no delay(), no pulseIn(), no network calls.
     */
    void updateAll();

    /**
     * Force a specific duty cycle (0–100%) on a channel by index.
     * Used during Phase 1 testing to emit a fixed known duty.
     */
    void setDutyPercent(uint8_t channelIndex, float dutyPercent);

private:
    bool _initialized = false;

    /**
     * Validate CHANNEL_TABLE for:
     *   - Duplicate GPIO numbers across channels
     *   - GPIOs outside the VALID_PWM_GPIOS pool
     *   - Input-only GPIOs (34–39 on ESP32-WROOM-32)
     * Returns false and prints specific errors if any issue found.
     */
    bool _validateConfig();

    /**
     * Convert duty percent (0–100) to LEDC duty count for a given resolution.
     * Example: 50.0% at 10-bit resolution → 511
     */
    uint32_t _dutyPercentToCount(float dutyPercent, uint8_t resolutionBits);
};

// Global singleton
extern ChannelManager gChannelManager;
