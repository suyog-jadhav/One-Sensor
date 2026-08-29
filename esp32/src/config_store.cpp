/**
 * config_store.cpp — ESP32 NVS Persistence for Channel Configurations
 */

#include "config_store.h"
#include <Arduino.h>

ConfigStore gConfigStore;

static const char* NVS_NAMESPACE = "onesensor";
static const char* KEY_CONFIGURED = "cfg_valid";
static const char* KEY_CHANNELS   = "channels";

bool ConfigStore::begin() {
    if (_initialized) return true;
    _initialized = _prefs.begin(NVS_NAMESPACE, false); // Read/write mode
    if (_initialized) {
        Serial.println(F("[ConfigStore] Initialized NVS namespace 'onesensor'."));
    } else {
        Serial.println(F("[ConfigStore] ERROR: Failed to initialize NVS Preferences."));
    }
    return _initialized;
}

std::array<ChannelConfig, MAX_CHANNELS> ConfigStore::load() {
    std::array<ChannelConfig, MAX_CHANNELS> cfg;

    // Load compiled defaults first
    for (size_t i = 0; i < MAX_CHANNELS; i++) {
        cfg[i] = DEFAULT_CHANNEL_TABLE[i];
    }

    if (!_initialized && !begin()) {
        Serial.println(F("[ConfigStore] NVS not initialized, returning compiled defaults."));
        return cfg;
    }

    bool isConfigured = _prefs.getBool(KEY_CONFIGURED, false);
    if (!isConfigured) {
        Serial.println(F("[ConfigStore] No saved config in NVS. Using compiled factory defaults."));
        return cfg;
    }

    size_t expectedSize = sizeof(ChannelConfig) * MAX_CHANNELS;
    size_t storedSize = _prefs.getBytesLength(KEY_CHANNELS);
    if (storedSize != expectedSize) {
        Serial.printf("[ConfigStore] Warning: Stored NVS config size mismatch (%u vs %u). Resetting to defaults.\n",
                      (unsigned int)storedSize, (unsigned int)expectedSize);
        resetToDefaults();
        return cfg;
    }

    size_t bytesRead = _prefs.getBytes(KEY_CHANNELS, cfg.data(), expectedSize);
    if (bytesRead == expectedSize) {
        Serial.println(F("[ConfigStore] Successfully loaded channel configuration from NVS."));
    } else {
        Serial.println(F("[ConfigStore] Error reading NVS channels blob. Falling back to defaults."));
        for (size_t i = 0; i < MAX_CHANNELS; i++) {
            cfg[i] = DEFAULT_CHANNEL_TABLE[i];
        }
    }

    return cfg;
}

bool ConfigStore::save(const std::array<ChannelConfig, MAX_CHANNELS>& cfg) {
    if (!_initialized && !begin()) {
        Serial.println(F("[ConfigStore] Save failed: NVS not initialized."));
        return false;
    }

    size_t dataSize = sizeof(ChannelConfig) * MAX_CHANNELS;
    size_t written = _prefs.putBytes(KEY_CHANNELS, cfg.data(), dataSize);

    if (written == dataSize) {
        _prefs.putBool(KEY_CONFIGURED, true);
        Serial.println(F("[ConfigStore] Saved configuration to NVS."));
        return true;
    } else {
        Serial.printf("[ConfigStore] ERROR: putBytes wrote %u/%u bytes.\n",
                      (unsigned int)written, (unsigned int)dataSize);
        return false;
    }
}

void ConfigStore::resetToDefaults() {
    if (!_initialized && !begin()) return;
    _prefs.remove(KEY_CHANNELS);
    _prefs.remove(KEY_CONFIGURED);
    Serial.println(F("[ConfigStore] NVS config reset to factory defaults."));
}
