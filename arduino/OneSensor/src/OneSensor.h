#pragma once

/**
 * OneSensor.h — Public facade for the OneSensor Arduino library
 *
 * The application sketch only needs this header. It never sees PwmDecoder,
 * pulseIn(), GPIO numbers, or WebSocket internals.
 *
 * Required sketch pattern (must compile and work as-is):
 *
 *   #include <OneSensor.h>
 *   OneSensor sensor;
 *   void setup() { Serial.begin(115200); sensor.begin(); }
 *   void loop()  {
 *       sensor.update();
 *       Serial.println(sensor.readTemperature());
 *       Serial.println(sensor.readHumidity());
 *       Serial.println(sensor.readGas());
 *       Serial.println(sensor.readLight());
 *       Serial.println(sensor.readSoilMoisture());
 *   }
 *
 * This API shape must not change even if the transport changes (PWM → DAC/UART).
 * Only OneSensor internals and the decoder layer change for new transports.
 */

#include <Arduino.h>
#include "ArduinoChannelConfig.h"
#include "PwmDecoder.h"
#include "TemperatureSensor.h"
#include "HumiditySensor.h"
#include "GasSensor.h"
#include "LightSensor.h"
#include "SoilMoistureSensor.h"

class OneSensor {
public:
    OneSensor();

    /**
     * Initialise all decoders using the pin table in ArduinoChannelConfig.h.
     * Call once in setup().
     */
    void begin();

    /**
     * Call every loop() iteration. Runs one pulseIn() measurement per channel
     * in round-robin order. Each call blocks for at most PwmDecoder::PULSE_TIMEOUT_US
     * per active channel — at 5 channels × 25 ms = 125 ms worst case.
     */
    void update();

    // ─── Sensor readings ────────────────────────────────────────────────────
    // Returns NAN if the corresponding channel is not valid (no signal, etc.).

    float readTemperature()  const;   // °C,  range 0–50
    float readHumidity()     const;   // %,   range 0–100
    float readGas()          const;   // ppm, range 0–1000
    float readLight()        const;   // lux, range 0–1000
    float readSoilMoisture() const;   // %,   range 0–100

    // ─── Status ─────────────────────────────────────────────────────────────

    /**
     * Returns true if all configured channels are currently valid.
     * Individual channel health available via isValid(SensorType).
     */
    bool isConnected() const;

    /**
     * Returns true if the specified sensor channel has received valid
     * readings recently (not all timeouts).
     */
    bool isValid(SensorType sensor) const;

private:
    // One PwmDecoder per channel
    PwmDecoder _decoders[ARDUINO_CHANNEL_COUNT];

    // Sensor classes — each holds a pointer to its decoder
    TemperatureSensor   _tempSensor;
    HumiditySensor      _humSensor;
    GasSensor           _gasSensor;
    LightSensor         _lightSensor;
    SoilMoistureSensor  _soilSensor;

    // Helper to find the decoder for a given SensorType
    PwmDecoder* _decoderFor(SensorType sensor);
    const PwmDecoder* _decoderFor(SensorType sensor) const;

    bool _initialized;
};
