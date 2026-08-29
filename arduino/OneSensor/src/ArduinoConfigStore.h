#pragma once

/**
 * ArduinoConfigStore.h — EEPROM persistence & provisioning for Arduino OneSensor
 */

#include <Arduino.h>
#include <EEPROM.h>
#include "ArduinoChannelConfig.h"

class ArduinoConfigStore {
public:
    static const uint8_t MAGIC_BYTE = 0x5A;
    static const uint16_t EEPROM_ADDR = 0;

    /**
     * Load channel configurations from EEPROM.
     * Returns true if valid stored config was found.
     */
    static bool load(ArduinoChannelConfig* cfgArray, uint8_t count) {
        if (EEPROM.read(EEPROM_ADDR) != MAGIC_BYTE) {
            return false;
        }

        uint16_t addr = EEPROM_ADDR + 1;
        for (uint8_t i = 0; i < count; i++) {
            EEPROM.get(addr, cfgArray[i]);
            addr += sizeof(ArduinoChannelConfig);
        }
        return true;
    }

    /**
     * Save channel configurations to EEPROM.
     */
    static void save(const ArduinoChannelConfig* cfgArray, uint8_t count) {
        EEPROM.update(EEPROM_ADDR, MAGIC_BYTE);
        uint16_t addr = EEPROM_ADDR + 1;
        for (uint8_t i = 0; i < count; i++) {
            EEPROM.put(addr, cfgArray[i]);
            addr += sizeof(ArduinoChannelConfig);
        }
    }

    /**
     * Clear EEPROM magic byte to force fall back to compiled defaults.
     */
    static void clear() {
        EEPROM.update(EEPROM_ADDR, 0xFF);
    }
};
