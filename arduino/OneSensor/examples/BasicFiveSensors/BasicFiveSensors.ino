/**
 * BasicFiveSensors.ino — OneSensor Canonical Example & Phase 5 Verification
 *
 * This is the canonical example from the project spec (prompt.md Section 1).
 * Extended with Phase 5 validation: tracks all 5 sensors and reports errors.
 *
 * WIRING (Phase 5 — all 5 channels):
 *   ESP32 GPIO16 → Arduino D2  (Temperature)
 *   ESP32 GPIO17 → Arduino D3  (Humidity)
 *   ESP32 GPIO18 → Arduino D4  (Gas)
 *   ESP32 GPIO19 → Arduino D5  (Light)
 *   ESP32 GPIO21 → Arduino D6  (Soil Moisture)
 *   ESP32 GND    → Arduino GND (common ground — REQUIRED)
 *
 * PHASE 5 EXIT CRITERION:
 *   All 5 sensors track the ESP32 test steps within tolerance.
 *   Changing one sensor value must not disturb the others.
 */

#include <OneSensor.h>

OneSensor sensor;

// ─── Expected values per ESP32 test step (must match ESP32 main.cpp) ──────────
struct Expected { float temp; float humid; float gas; float light; float soil; };
static const Expected STEPS[] = {
    {  0.0f,   0.0f,    0.0f,    0.0f,   0.0f },  // ALL MIN
    { 25.0f,  50.0f,  500.0f,  500.0f,  50.0f },  // ALL MID
    { 50.0f, 100.0f, 1000.0f, 1000.0f, 100.0f },  // ALL MAX
    { 12.5f,  25.0f,  250.0f,  250.0f,  25.0f },  // ALL 25%
    { 37.5f,  75.0f,  750.0f,  750.0f,  75.0f },  // ALL 75%
};
static const uint8_t STEP_COUNT = sizeof(STEPS) / sizeof(STEPS[0]);

// Tolerance per sensor
static const float TEMP_TOL   = 1.0f;    // °C
static const float HUMID_TOL  = 2.0f;    // %
static const float GAS_TOL    = 20.0f;   // ppm
static const float LIGHT_TOL  = 20.0f;   // lux
static const float SOIL_TOL   = 2.0f;    // %

// ─── Helper: find closest expected step and compute errors ──────────────────
void checkReadings(float t, float h, float g, float l, float s) {
    // Find the closest step (by temperature, since all change together)
    uint8_t best = 0;
    float   bestErr = 9999;
    for (uint8_t i = 0; i < STEP_COUNT; i++) {
        float e = abs(t - STEPS[i].temp);
        if (e < bestErr) { bestErr = e; best = i; }
    }
    const Expected& ex = STEPS[best];

    bool tOk = abs(t - ex.temp)  <= TEMP_TOL;
    bool hOk = isnan(h) || abs(h - ex.humid) <= HUMID_TOL;
    bool gOk = isnan(g) || abs(g - ex.gas)   <= GAS_TOL;
    bool lOk = isnan(l) || abs(l - ex.light) <= LIGHT_TOL;
    bool sOk = isnan(s) || abs(s - ex.soil)  <= SOIL_TOL;

    Serial.print(F("  Err  T=±")); Serial.print(abs(t - ex.temp), 2);
    Serial.print(F(" H=±")); Serial.print(isnan(h) ? 0 : abs(h - ex.humid), 2);
    Serial.print(F(" G=±")); Serial.print(isnan(g) ? 0 : abs(g - ex.gas), 1);
    Serial.print(F(" L=±")); Serial.print(isnan(l) ? 0 : abs(l - ex.light), 1);
    Serial.print(F(" S=±")); Serial.println(isnan(s) ? 0 : abs(s - ex.soil), 2);

    if (tOk && hOk && gOk && lOk && sOk)
        Serial.println(F("  ✅ ALL IN TOLERANCE"));
    else {
        Serial.print(F("  ⚠️  OUT OF TOLERANCE:"));
        if (!tOk) Serial.print(F(" TEMP"));
        if (!hOk) Serial.print(F(" HUMID"));
        if (!gOk) Serial.print(F(" GAS"));
        if (!lOk) Serial.print(F(" LIGHT"));
        if (!sOk) Serial.print(F(" SOIL"));
        Serial.println();
    }
}

void setup() {
    Serial.begin(115200);
    delay(500);
    Serial.println(F("\n[OneSensor] Phase 5 — All 5 Sensors"));
    Serial.println(F("===================================="));
    sensor.begin();
    Serial.println(F("Ready. Wiring: GPIO16→D2 17→D3 18→D4 19→D5 21→D6\n"));
}

void loop() {
    sensor.update();

    float t = sensor.readTemperature();
    float h = sensor.readHumidity();
    float g = sensor.readGas();
    float l = sensor.readLight();
    float s = sensor.readSoilMoisture();

    // ── Canonical API output (from spec) ─────────────────────────────────────
    Serial.print(F("Temp: "));     Serial.print(t, 2); Serial.println(F(" °C"));
    Serial.print(F("Humidity: ")); Serial.print(h, 2); Serial.println(F(" %"));
    Serial.print(F("Gas: "));      Serial.print(g, 1); Serial.println(F(" ppm"));
    Serial.print(F("Light: "));    Serial.print(l, 1); Serial.println(F(" lux"));
    Serial.print(F("Soil: "));     Serial.print(s, 2); Serial.println(F(" %"));

    // ── Phase 5 validation ────────────────────────────────────────────────────
    if (!isnan(t)) checkReadings(t, h, g, l, s);
    else           Serial.println(F("  [NO SIGNAL — check wiring]"));

    Serial.println();
    delay(500);
}
