/**
 * main.cpp — ESP32 OneSensor Firmware Entry Point
 *
 * Phase 1: Fixed 50% duty verified ✅
 * Phase 3: SensorState → ValueMapper → LEDC PWM (active now)
 *           Runs a repeating test sequence of known temperatures so the
 *           Arduino side can verify the duty-cycle math without Wi-Fi.
 * Phase 7+: Wi-Fi added; Phase 8+: WebSocket server activated.
 *
 * Phase 3 exit criterion:
 *   Setting temperature = 25.0°C in SensorState → Arduino reads ~50% duty
 *   Setting temperature =  0.0°C               → Arduino reads ~0%  duty
 *   Setting temperature = 50.0°C               → Arduino reads ~100% duty
 */

#include <Arduino.h>
#include "hardware_config.h"
#include "sensor_state.h"
#include "value_mapper.h"
#include "channel_manager.h"

// ─── Phase 3 Test Sequence ────────────────────────────────────────────────────
// The firmware cycles through these temperatures automatically.
// Watch the Arduino serial monitor to verify each maps to the expected duty.
//
// Expected duty = (temp / 50.0) * 100.0
//   0°C  → 0%    | 12.5°C → 25%  | 25°C → 50%
//  37.5°C→ 75%   | 50°C   → 100%
struct TestStep {
    float temperature;   // °C to load into SensorState
    float expectedDuty;  // what Arduino should read (%)
    const char* label;
};

static const TestStep TEST_SEQUENCE[] = {
    {  0.0f,   0.0f, "0°C   →  0% duty" },
    { 12.5f,  25.0f, "12.5°C → 25% duty" },
    { 25.0f,  50.0f, "25°C  → 50% duty"  },   // ← Phase 1 baseline
    { 37.5f,  75.0f, "37.5°C → 75% duty" },
    { 50.0f, 100.0f, "50°C  →100% duty"  },
};
static const uint8_t  TEST_STEP_COUNT    = sizeof(TEST_SEQUENCE) / sizeof(TEST_SEQUENCE[0]);
static const uint32_t STEP_HOLD_MS       = 5000;   // hold each value for 5 s
static const uint32_t STATUS_INTERVAL_MS = 1000;   // print status every 1 s

// ─── setup() ─────────────────────────────────────────────────────────────────
void setup() {
    Serial.begin(115200);
    delay(500);

    Serial.println(F("\n========================================"));
    Serial.println(F("  OneSensor ESP32 Firmware — Phase 3"));
    Serial.println(F("  ValueMapper: SensorState → PWM duty"));
    Serial.println(F("========================================"));
    Serial.printf("  CHANNEL_COUNT : %u\n", CHANNEL_COUNT);
    Serial.printf("  PWM Frequency : %u Hz\n", CHANNEL_TABLE[0].frequencyHz);
    Serial.printf("  Resolution    : %u-bit\n", CHANNEL_TABLE[0].resolutionBits);
    Serial.println(F("----------------------------------------"));

    if (!gChannelManager.begin()) {
        Serial.println(F("[FATAL] Channel init failed. Halting."));
        while (true) { delay(1000); }
    }

    // Phase 3: SensorState starts at defaults (25°C → 50% duty).
    // updateAll() in loop() keeps PWM in sync with SensorState continuously.
    Serial.println(F("\n[Phase 3] Test sequence active (5 s per step)."));
    Serial.println(F("[Phase 3] Monitor Arduino Serial for duty verification.\n"));
}

// ─── loop() ──────────────────────────────────────────────────────────────────
void loop() {
    static uint32_t lastStep   = 0;
    static uint32_t lastStatus = 0;
    static uint8_t  stepIdx    = 0;

    // ── Step advance every STEP_HOLD_MS ──────────────────────────────────────
    if (millis() - lastStep >= STEP_HOLD_MS) {
        lastStep = millis();
        const TestStep& s = TEST_SEQUENCE[stepIdx];

        // Write new temperature into SensorState (thread-safe setter)
        gSensorState.set(SensorType::TEMPERATURE, s.temperature);

        // Push updated state to all PWM channels immediately
        gChannelManager.updateAll();

        Serial.println(F("\n══════════════════════════════════════"));
        Serial.printf("[Phase 3] STEP %u/%u: %s\n",
                      stepIdx + 1, TEST_STEP_COUNT, s.label);
        Serial.printf("  Set temp    = %5.1f °C\n", s.temperature);
        Serial.printf("  Expect duty = %5.1f %%\n", s.expectedDuty);
        Serial.printf("  Mapped duty = %5.1f %%\n",
                      valueToDutyPercent(s.temperature,
                                         CHANNEL_TABLE[0].inputMin,
                                         CHANNEL_TABLE[0].inputMax));
        Serial.println(F("══════════════════════════════════════"));

        stepIdx = (stepIdx + 1) % TEST_STEP_COUNT;  // wrap around
    }

    // ── Continuous PWM update (handles all 5 channels) ───────────────────────
    // This is non-blocking; each ledcWrite() completes in microseconds.
    gChannelManager.updateAll();

    // ── Periodic status print ─────────────────────────────────────────────────
    if (millis() - lastStatus >= STATUS_INTERVAL_MS) {
        lastStatus = millis();

        Serial.println(F("--- OneSensor Status ---"));
        for (uint8_t i = 0; i < CHANNEL_COUNT; i++) {
            const ChannelConfig& ch = CHANNEL_TABLE[i];
            float logVal  = gSensorState.getByType(ch.sensor);
            float dutyPct = valueToDutyPercent(logVal, ch.inputMin, ch.inputMax);
            const char* name = "UNKNOWN";
            switch (ch.sensor) {
                case SensorType::TEMPERATURE:   name = "Temp ";   break;
                case SensorType::HUMIDITY:      name = "Humid";   break;
                case SensorType::GAS:           name = "Gas  ";   break;
                case SensorType::LIGHT:         name = "Light";   break;
                case SensorType::SOIL_MOISTURE: name = "Soil ";   break;
            }
            Serial.printf("  Ch%u %s GPIO%-2u  val=%6.1f  duty=%5.1f%%\n",
                          i, name, ch.gpio, logVal, dutyPct);
        }
        Serial.println(F("------------------------"));
    }
}
