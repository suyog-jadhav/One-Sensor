/**
 * Phase3_ValueMapperTest.ino — Phase 3 Verification Sketch
 *
 * PURPOSE: Verify the full round-trip:
 *   ESP32: logical °C → normalise → duty%
 *   Wire:  duty% as PWM signal
 *   Arduino: pulseIn → duty% → denormalise → logical °C
 *
 * WIRING (same as Phase 2 — only Temperature channel):
 *   ESP32 GPIO16  →  Arduino D2
 *   ESP32 GND     →  Arduino GND
 *
 * HOW TO USE:
 *   1. Flash Phase 3 firmware to ESP32 (pio run --target upload)
 *   2. Flash this sketch to Arduino (python3 ../upload_uno.py /dev/ttyUSB0 ...)
 *   3. Open Arduino Serial Monitor at 115200
 *   4. ESP32 cycles through 5 test temperatures every 5 seconds
 *   5. Arduino prints measured temp and error for each step
 *
 * EXIT CRITERION (phases.md Phase 3):
 *   - Each measured temperature within ±1°C of expected
 *   - 0°C → ~0%,  25°C → ~50%,  50°C → ~100%  all confirmed
 *
 * CALIBRATION PARAMS (default — Phase 12 will tune these):
 *   pwmMin = 0%, pwmMax = 100%, offset = 0, scale = 1
 *   dutyToTemp(d) = (d / 100.0) * 50.0
 */

// ─── Library headers (from OneSensor library) ─────────────────────────────────
#include "PwmDecoder.h"

// ─── Configuration ─────────────────────────────────────────────────────────────
static const uint8_t  TEMP_PIN       = 2;       // D2 ← ESP32 GPIO16
static const float    TEMP_MIN       = 0.0f;    // °C logical minimum
static const float    TEMP_MAX       = 50.0f;   // °C logical maximum
static const uint8_t  SAMPLES        = 5;       // readings to average per report
static const uint32_t REPORT_INTERVAL_MS = 500; // ms between printouts

// Known test steps (must match Phase 3 ESP32 firmware)
struct ExpectedStep {
    float tempC;
    float dutyPct;
};
static const ExpectedStep STEPS[] = {
    {  0.0f,   0.0f },
    { 12.5f,  25.0f },
    { 25.0f,  50.0f },
    { 37.5f,  75.0f },
    { 50.0f, 100.0f },
};
static const uint8_t STEP_COUNT = sizeof(STEPS) / sizeof(STEPS[0]);

// ─── Helpers ───────────────────────────────────────────────────────────────────
/** Convert duty% to temperature °C using linear denormalization */
float dutyToTemp(float dutyPct) {
    return (dutyPct / 100.0f) * (TEMP_MAX - TEMP_MIN) + TEMP_MIN;
}

/** Find closest expected step to a measured duty and return error */
float closestError(float measuredDuty, float& expectedDuty) {
    float best = 9999.0f;
    for (uint8_t i = 0; i < STEP_COUNT; i++) {
        float diff = abs(measuredDuty - STEPS[i].dutyPct);
        if (diff < best) { best = diff; expectedDuty = STEPS[i].dutyPct; }
    }
    return best;
}

// ─── Globals ───────────────────────────────────────────────────────────────────
PwmDecoder decoder;

void setup() {
    Serial.begin(115200);
    delay(500);

    Serial.println(F("\n[OneSensor Phase 3] ValueMapper Round-Trip Verification"));
    Serial.println(F("======================================================="));
    Serial.println(F("  Formula: duty% = (tempC / 50.0) * 100.0"));
    Serial.println(F("  ESP32 cycles: 0 → 12.5 → 25 → 37.5 → 50°C (5s each)"));
    Serial.println(F("=======================================================\n"));

    decoder.begin(TEMP_PIN);
}

void loop() {
    static uint32_t lastReport = 0;
    static float    dutySum    = 0;
    static uint8_t  sampleN    = 0;
    static uint32_t stepStart  = 0;
    static uint8_t  stepIdx    = 0;

    // Take one pulseIn measurement
    bool ok = decoder.update();
    if (ok) {
        dutySum += decoder.getDutyCycle();
        sampleN++;
    }

    // Report every REPORT_INTERVAL_MS
    if (millis() - lastReport >= REPORT_INTERVAL_MS) {
        lastReport = millis();

        if (sampleN == 0) {
            Serial.println(F("  [NO SIGNAL] — check wiring or ESP32 running?"));
        } else {
            float avgDuty   = dutySum / sampleN;
            float measTemp  = dutyToTemp(avgDuty);

            // Find expected step and compute error
            float expectedDuty = 0;
            float dutyError    = closestError(avgDuty, expectedDuty);
            float expectedTemp = dutyToTemp(expectedDuty);
            float tempError    = abs(measTemp - expectedTemp);

            Serial.print(F("  Duty: "));
            Serial.print(avgDuty, 1);
            Serial.print(F("%  →  Temp: "));
            Serial.print(measTemp, 1);
            Serial.print(F("°C   |  expect≈"));
            Serial.print(expectedTemp, 1);
            Serial.print(F("°C  err=±"));
            Serial.print(tempError, 2);
            Serial.print(F("°C  ("));
            Serial.print(sampleN);
            Serial.println(F(" samples)"));

            // Phase 3 pass assessment
            if (tempError <= 1.0f && decoder.isValid()) {
                Serial.println(F("    ✅ Within ±1°C tolerance"));
            } else if (!decoder.isValid()) {
                Serial.println(F("    ⚠️  Signal invalid — too many timeouts"));
            } else {
                Serial.println(F("    ⚠️  Error > ±1°C — check calibration"));
            }
        }

        dutySum = 0;
        sampleN = 0;
    }
}
