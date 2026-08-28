/**
 * scenario_engine.cpp — Implementation of ScenarioEngine
 */
#include "scenario_engine.h"

ScenarioEngine gScenarioEngine;

ScenarioEngine::ScenarioEngine() {
    for (uint8_t i = 0; i < MAX_SCENARIOS; i++) {
        _scenarios[i] = nullptr;
    }
}

uint8_t ScenarioEngine::_typeToIndex(SensorType type) const {
    switch (type) {
        case SensorType::TEMPERATURE:   return 0;
        case SensorType::HUMIDITY:      return 1;
        case SensorType::GAS:           return 2;
        case SensorType::LIGHT:         return 3;
        case SensorType::SOIL_MOISTURE: return 4;
        default:                        return 0;
    }
}

bool ScenarioEngine::startRamp(SensorType type, float startVal, float endVal, uint32_t durationMs) {
    uint8_t idx = _typeToIndex(type);
    stop(type); // Clean up existing

    RampScenario* ramp = new RampScenario(type, startVal, endVal, durationMs);
    ramp->start(millis());
    _scenarios[idx] = ramp;

    Serial.printf("[ScenarioEngine] Started RAMP on sensor %d: %.1f -> %.1f over %u ms\n",
                  (int)type, startVal, endVal, durationMs);
    return true;
}

bool ScenarioEngine::startStatic(SensorType type, float value) {
    uint8_t idx = _typeToIndex(type);
    stop(type);

    StaticScenario* stat = new StaticScenario(type, value);
    stat->start(millis());
    _scenarios[idx] = stat;

    Serial.printf("[ScenarioEngine] Started STATIC on sensor %d: value = %.1f\n",
                  (int)type, value);
    return true;
}

void ScenarioEngine::stop(SensorType type) {
    uint8_t idx = _typeToIndex(type);
    if (_scenarios[idx]) {
        Serial.printf("[ScenarioEngine] Stopped scenario on sensor %d (%s)\n",
                      (int)type, _scenarios[idx]->name());
        delete _scenarios[idx];
        _scenarios[idx] = nullptr;
    }
}

void ScenarioEngine::stopAll() {
    for (uint8_t i = 0; i < MAX_SCENARIOS; i++) {
        if (_scenarios[i]) {
            delete _scenarios[i];
            _scenarios[i] = nullptr;
        }
    }
    Serial.println(F("[ScenarioEngine] Stopped ALL scenarios"));
}

void ScenarioEngine::update(SensorState& state, ChannelManager& channelMgr) {
    uint32_t nowMs = millis();
    bool anyUpdated = false;

    for (uint8_t i = 0; i < MAX_SCENARIOS; i++) {
        if (_scenarios[i]) {
            _scenarios[i]->update(nowMs, state);
            anyUpdated = true;

            if (_scenarios[i]->isFinished(nowMs)) {
                Serial.printf("[ScenarioEngine] Finished scenario on sensor index %u (%s)\n",
                              i, _scenarios[i]->name());
                delete _scenarios[i];
                _scenarios[i] = nullptr;
            }
        }
    }

    if (anyUpdated) {
        channelMgr.updateAll();
    }
}

bool ScenarioEngine::isRunning(SensorType type) const {
    uint8_t idx = _typeToIndex(type);
    return _scenarios[idx] != nullptr;
}
