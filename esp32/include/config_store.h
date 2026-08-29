#pragma once

/**
 * config_store.h — ESP32 NVS Persistence for Channel Configurations
 *
 * Wraps the ESP32 Preferences library behind the ConfigStore class.
 * Ensures runtime channel configuration changes persist across reboots.
 */

#include "hardware_config.h"
#include <Preferences.h>
#include <array>

class ConfigStore {
public:
    /**
     * Initialize NVS storage namespace ("onesensor").
     */
    bool begin();

    /**
     * Load channel configurations from NVS.
     * Returns compiled DEFAULT_CHANNEL_TABLE if NVS is empty or uninitialized.
     */
    std::array<ChannelConfig, MAX_CHANNELS> load();

    /**
     * Save channel configurations to NVS.
     */
    bool save(const std::array<ChannelConfig, MAX_CHANNELS>& cfg);

    /**
     * Erase saved configuration from NVS, reverting to factory defaults.
     */
    void resetToDefaults();

private:
    Preferences _prefs;
    bool _initialized = false;
};

extern ConfigStore gConfigStore;
