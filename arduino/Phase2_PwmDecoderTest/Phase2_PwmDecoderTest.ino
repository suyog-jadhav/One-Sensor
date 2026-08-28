/**
 * Phase2_PwmDecoderTest.ino — Phase 2 Verification Sketch
 *
 * PURPOSE: Verify that the Arduino can decode the PWM signal from the ESP32
 * using PwmDecoder (pulseIn-based). This is the Phase 2 exit criterion.
 *
 * WIRING (minimum for Phase 2):
 *   ESP32 GPIO16  →  Arduino D2   (Temperature PWM channel)
 *   ESP32 GND     →  Arduino GND  (common ground — REQUIRED)
 *
 * EXPECTED SERIAL OUTPUT (with ESP32 running Phase 1 firmware at 50% duty):
 *   [OneSensor Phase 2] PwmDecoder on pin D2
 *   ----------------------------------------
 *   Duty:  50.2%   Freq:  499.8 Hz   Valid: YES
 *   Duty:  50.1%   Freq:  500.1 Hz   Valid: YES
 *   Duty:  50.0%   Freq:  500.0 Hz   Valid: YES
 *   ...
 *
 * EXIT CRITERION (from phases.md):
 *   - Duty reads consistently ~50% across 10+ reads
 *   - Frequency reads ~500 Hz
 *   - isValid() returns YES
 *   - Disconnect wire → Valid: NO (no crash, no hang)
 *
 * PHASE 2 DONE when the above is confirmed. Then log it in docs/progress.md.
 */

// ─── Direct include — not using the full OneSensor library yet ────────────────
// We test PwmDecoder in isolation before wrapping it in the full facade (Phase 4)
#include "PwmDecoder.h"

// Arduino pin receiving ESP32 GPIO16 (Temperature channel, Phase 1)
static const uint8_t PWM_INPUT_PIN = 2;   // D2

// How many readings to take before reporting averages
static const uint8_t SAMPLE_COUNT = 10;

PwmDecoder decoder;

void setup() {
    Serial.begin(115200);
    delay(500);

    Serial.println(F("\n[OneSensor Phase 2] PwmDecoder Verification"));
    Serial.println(F("--------------------------------------------"));
    Serial.print(F("  Input pin      : D"));
    Serial.println(PWM_INPUT_PIN);
    Serial.print(F("  pulseIn timeout: "));
    Serial.print(PwmDecoder::PULSE_TIMEOUT_US / 1000);
    Serial.println(F(" ms"));
    Serial.print(F("  Validity window: "));
    Serial.print(PwmDecoder::VALIDITY_WINDOW);
    Serial.println(F(" consecutive failures"));
    Serial.println(F("--------------------------------------------"));
    Serial.println(F("Wiring: ESP32 GPIO16 → Arduino D2, ESP32 GND → Arduino GND"));
    Serial.println(F("Starting readings...\n"));

    if (!decoder.begin(PWM_INPUT_PIN)) {
        Serial.println(F("[ERROR] decoder.begin() failed — check pin number"));
        while (true) {}
    }
}

void loop() {
    // ── Single-sample mode (prints every 500 ms) ──────────────────────────
    bool ok = decoder.update();

    Serial.print(F("Duty: "));
    Serial.print(decoder.getDutyCycle(), 1);
    Serial.print(F("%   Freq: "));
    Serial.print(decoder.getFrequency(), 1);
    Serial.print(F(" Hz   Valid: "));
    Serial.print(decoder.isValid() ? F("YES") : F("NO "));

    if (!ok) {
        Serial.print(F("   [timeout — check wiring / ESP32 running?]"));
    }
    Serial.println();

    // ── Every 10 readings, print a summary ───────────────────────────────
    static uint8_t  count     = 0;
    static float    sumDuty   = 0;
    static float    sumFreq   = 0;
    static uint8_t  goodReads = 0;

    if (ok) { sumDuty += decoder.getDutyCycle(); sumFreq += decoder.getFrequency(); goodReads++; }
    count++;

    if (count >= SAMPLE_COUNT) {
        Serial.println(F("\n──── 10-sample summary ────"));
        Serial.print(F("  Avg duty  : "));
        if (goodReads > 0) { Serial.print(sumDuty / goodReads, 2); Serial.println(F("%")); }
        else               { Serial.println(F("N/A (all timeouts)")); }
        Serial.print(F("  Avg freq  : "));
        if (goodReads > 0) { Serial.print(sumFreq / goodReads, 1); Serial.println(F(" Hz")); }
        else               { Serial.println(F("N/A")); }
        Serial.print(F("  Good reads: "));
        Serial.print(goodReads); Serial.print(F("/"));
        Serial.println(SAMPLE_COUNT);

        // Phase 2 pass/fail assessment
        if (goodReads >= 8) {
            float avgDuty = sumDuty / goodReads;
            float avgFreq = sumFreq / goodReads;
            bool dutyOk = (avgDuty >= 48.0f && avgDuty <= 52.0f);   // ±2% tolerance
            bool freqOk = (avgFreq >= 450.0f && avgFreq <= 550.0f); // ±10% tolerance
            Serial.println(dutyOk && freqOk
                ? F("  ✅ PHASE 2 PASS — PwmDecoder working correctly")
                : F("  ⚠️  PHASE 2 WARN — readings out of tolerance, check wiring"));
        } else {
            Serial.println(F("  ❌ PHASE 2 FAIL — too many timeouts, check wiring"));
        }
        Serial.println(F("───────────────────────────\n"));

        count = goodReads = 0;
        sumDuty = sumFreq = 0;
    }

    delay(200);  // short gap between reads (not blocking PWM decode itself)
}
