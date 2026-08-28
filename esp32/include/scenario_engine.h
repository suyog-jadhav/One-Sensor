/**
 * scenario_engine.h — Modular non-blocking Scenario Engine for OneSensor
 *
 * Supports STATIC and RAMP scenarios.
 * Designed so adding future scenarios (Heat Wave, Gas Leak, Fluctuation)
 * only requires subclassing Scenario, without modifying WebSocket or PWM layers.
 *
 * All scenario updates mutate SensorState directly using millis() timing — no delay()!
 */
#pragma once

#include <Arduino.h>
#include "sensor_state.h"
#include "channel_manager.h"

// ─── Base Abstract Scenario Class ─────────────────────────────────────────────
class Scenario {
public:
    virtual ~Scenario() = default;
    virtual void start(uint32_t startMs) = 0;
    virtual void update(uint32_t nowMs, SensorState& state) = 0;
    virtual bool isFinished(uint32_t nowMs) const = 0;
    virtual SensorType sensorType() const = 0;
    virtual const char* name() const = 0;
};

// ─── Static Scenario: Holds a sensor at a fixed value ─────────────────────────
class StaticScenario : public Scenario {
public:
    StaticScenario(SensorType type, float value)
        : _type(type), _value(value) {}

    void start(uint32_t startMs) override { (void)startMs; }

    void update(uint32_t nowMs, SensorState& state) override {
        (void)nowMs;
        state.set(_type, _value);
    }

    bool isFinished(uint32_t nowMs) const override {
        (void)nowMs;
        return false; // Runs until stopped
    }

    SensorType sensorType() const override { return _type; }
    const char* name() const override { return "STATIC"; }

private:
    SensorType _type;
    float      _value;
};

// ─── Ramp Scenario: Sweeps a sensor linearly from startVal to endVal over duration ─────
class RampScenario : public Scenario {
public:
    RampScenario(SensorType type, float startVal, float endVal, uint32_t durationMs)
        : _type(type), _startVal(startVal), _endVal(endVal), _durationMs(durationMs) {}

    void start(uint32_t startMs) override {
        _startMs = startMs;
    }

    void update(uint32_t nowMs, SensorState& state) override {
        if (_durationMs == 0) {
            state.set(_type, _endVal);
            return;
        }

        uint32_t elapsed = nowMs - _startMs;
        float progress = (float)elapsed / (float)_durationMs;
        if (progress > 1.0f) progress = 1.0f;

        float currentVal = _startVal + progress * (_endVal - _startVal);
        state.set(_type, currentVal);
    }

    bool isFinished(uint32_t nowMs) const override {
        return (nowMs - _startMs) >= _durationMs;
    }

    SensorType sensorType() const override { return _type; }
    const char* name() const override { return "RAMP"; }

private:
    SensorType _type;
    float      _startVal;
    float      _endVal;
    uint32_t   _durationMs;
    uint32_t   _startMs = 0;
};

// ─── Scenario Engine Manager ──────────────────────────────────────────────────
class ScenarioEngine {
public:
    ScenarioEngine();

    // Start a RAMP scenario on a specific sensor channel
    bool startRamp(SensorType type, float startVal, float endVal, uint32_t durationMs);

    // Start a STATIC scenario on a specific sensor channel
    bool startStatic(SensorType type, float value);

    // Stop scenario for a given sensor channel
    void stop(SensorType type);

    // Stop all scenarios
    void stopAll();

    // Update active scenarios — call every loop() tick
    void update(SensorState& state, ChannelManager& channelMgr);

    // Query status
    bool isRunning(SensorType type) const;

private:
    static constexpr uint8_t MAX_SCENARIOS = 5;
    Scenario* _scenarios[MAX_SCENARIOS] = {nullptr};

    uint8_t _typeToIndex(SensorType type) const;
};

extern ScenarioEngine gScenarioEngine;
