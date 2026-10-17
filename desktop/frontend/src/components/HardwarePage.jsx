import React, { useState } from 'react';
import { Cpu, CheckCircle, Radio, Activity, Zap, Layers, RefreshCw, Sliders } from 'lucide-react';
import Interactive3DSensorCanvas from './Interactive3DSensorCanvas';

const ESP32_PINS = [
  { pin: 'GPIO 34', name: 'Temperature (DHT11)', mode: 'ANALOG INPUT', adc: 'ADC1_CH6', resolution: '12-bit', rate: 'Continuous (IPC)', desc: 'ADC1 channel input mapped to virtual DHT11 thermal resistance bridge.', sensorKey: 'temperature', capabilities: 'ADC1 only (input-only GPIO). Compatible during active Wi-Fi transmission.' },
  { pin: 'GPIO 35', name: 'Humidity (DHT11)', mode: 'ANALOG INPUT', adc: 'ADC1_CH7', resolution: '12-bit', rate: 'Continuous (IPC)', desc: 'Relative humidity dielectric measurement channel.', sensorKey: 'humidity', capabilities: 'ADC1 only (input-only GPIO). No internal pull-up/down.' },
  { pin: 'GPIO 32', name: 'Gas Concentration (MQ-2)', mode: 'ANALOG INPUT', adc: 'ADC1_CH4', resolution: '12-bit', rate: 'Continuous (IPC)', desc: 'MQ-2 metal oxide gas transducer input for combustible and volatile organic vapors.', sensorKey: 'gas', capabilities: 'ADC1 channel with software configurable attenuation (0dB - 11dB).' },
  { pin: 'GPIO 33', name: 'Ambient Light (LDR)', mode: 'ANALOG INPUT', adc: 'ADC1_CH5', resolution: '12-bit', rate: 'Continuous (IPC)', desc: 'Cadmium-sulfide photoresistor lux level voltage divider channel.', sensorKey: 'light', capabilities: 'ADC1 input. High sensitivity photo-transistor bridge.' },
  { pin: 'GPIO 25', name: 'Soil Moisture (YL-69)', mode: 'DAC / ANALOG OUT', adc: 'DAC1 (8-bit) / ADC2_CH8', resolution: '8-bit DAC', rate: 'Continuous (IPC)', desc: 'Capacitive / resistive soil matrix water saturation level generator.', sensorKey: 'soil', capabilities: 'True analog voltage output via hardware DAC1. Avoid using ADC2 when Wi-Fi active.' },
  { pin: 'GPIO 26', name: 'Proximity Distance (HC-SR04)', mode: 'DAC / DIGITAL PWM', adc: 'DAC2 (8-bit) / ADC2_CH9', resolution: '8-bit DAC / PWM', rate: 'Continuous (IPC)', desc: 'Ultrasonic echo pulse timing capture channel for obstacle distance.', sensorKey: 'proximity', capabilities: 'Hardware DAC2 or LEDC timer peripheral output.' },
  { pin: 'GPIO 27', name: 'Sound Level VU', mode: 'ANALOG INPUT', adc: 'ADC2_CH7', resolution: '12-bit', rate: 'Continuous (IPC)', desc: 'Electret microphone peak audio amplitude & decibel ladder channel.', sensorKey: 'sound', capabilities: 'ADC2 channel input. Routed to simulated pre-amp circuit.' },
  { pin: 'GPIO 14', name: 'UV Index (GY-ML8511)', mode: 'ANALOG INPUT', adc: 'ADC2_CH6', resolution: '12-bit', rate: 'Continuous (IPC)', desc: 'Ultraviolet solar radiation radiometer photo-diode input.', sensorKey: 'uv', capabilities: 'ADC2 channel input. Proportional UV output voltage.' },
  { pin: 'GPIO 12', name: 'CO₂ Air Quality (MQ-135)', mode: 'ANALOG INPUT', adc: 'ADC2_CH5', resolution: '12-bit', rate: 'Continuous (IPC)', desc: 'MQ-135 indoor air quality carbon dioxide ppm concentration monitor.', sensorKey: 'co2', capabilities: 'ADC2 channel input. Note: MTDI strapping pin on ESP32 boot.' },
  { pin: 'GPIO 21', name: 'I2C SDA (MPU-6050 Motion)', mode: 'I2C BUS DATA', adc: 'I2C SDA (400kHz)', resolution: '16-bit Gyro/Acc', rate: '50 Hz (I2C)', desc: 'Inter-Integrated Circuit serial data line for 6-axis inertial motion telemetry.', sensorKey: 'motionX', capabilities: 'Open-drain with internal / external 4.7kΩ pull-up required.' },
  { pin: 'GPIO 22', name: 'I2C SCL (MPU-6050 Motion)', mode: 'I2C BUS CLOCK', adc: 'I2C SCL (400kHz)', resolution: '16-bit Gyro/Acc', rate: '50 Hz (I2C)', desc: 'Inter-Integrated Circuit serial clock sync line for 6-axis MPU-6050 IMU.', sensorKey: 'motionY', capabilities: 'Dedicated hardware I2C master clock line up to 400kHz fast mode.' },
  { pin: 'GPIO 19', name: 'Motion Z / System IRQ', mode: 'DIGITAL IRQ', adc: 'GPIO IRQ', resolution: '1-bit Binary', rate: 'Edge Triggered', desc: 'Hardware interrupt trigger line for inertial anomaly and threshold breach.', sensorKey: 'motionZ', capabilities: 'Configurable rising/falling edge interrupt handler.' },
];

export default function HardwarePage({ sensorState }) {
  const [selectedPin, setSelectedPin] = useState(ESP32_PINS[0]);

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header-row">
        <div>
          <h1 className="page-title">Devices & 3D Hardware Inspector</h1>
          <p className="page-subtitle">
            Inspect physical ESP32 SoC pinout, ADC/DAC capabilities, bus allocations, and real-time register states.
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span className="telemetry-chip">
            <Cpu size={12} color="var(--accent-teal)" />
            <span>Target: ESP32 DevKit V1 (Profile)</span>
          </span>
          <span className="badge-tag info">SIMULATION PROFILE</span>
        </div>
      </div>

      {/* Main 2-Column Grid (§9) */}
      <div className="hardware-inspect-grid">
        {/* Left: 3D Board Canvas */}
        <div className="panel-card hardware-3d-panel" style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="panel-header">
            <div className="panel-title">
              <Cpu size={14} color="var(--accent-amber)" />
              <span>ESP32 Physical 3D Model & Interactive Orbit View</span>
            </div>
            <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--accent-teal)' }}>
              Active Pin: {selectedPin.pin}
            </span>
          </div>

          <div className="hardware-3d-viewport">
            <Interactive3DSensorCanvas
              activeSensorKey={selectedPin.sensorKey}
              sensorState={sensorState}
              onSelectSensor={() => {}}
            />
          </div>

          {/* Quick Pin Selector Grid */}
          <div style={{ marginTop: '16px' }}>
            <div style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', marginBottom: '8px', letterSpacing: '0.04em' }}>
              SELECT HARDWARE GPIO TO INSPECT REGISTERS:
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {ESP32_PINS.map((p) => {
                const isSelected = selectedPin.pin === p.pin;
                return (
                  <button
                    key={p.pin}
                    onClick={() => setSelectedPin(p)}
                    className={`pin-select-chip ${isSelected ? 'active' : ''}`}
                    aria-label={`Select ${p.pin}`}
                  >
                    {p.pin}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right: Technical Pin Inspector (§9) */}
        <div className="panel-card hardware-info-panel" style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="panel-header">
            <div className="panel-title">
              <Layers size={14} color="var(--accent-teal)" />
              <span>Pin Register & Electrical Telemetry</span>
            </div>
            <span className="status-badge-nominal">CONFIGURED</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', flex: 1 }}>
            {/* Header info */}
            <div className="pin-detail-banner">
              <div style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--accent-amber)', marginBottom: '2px', letterSpacing: '0.04em' }}>
                TARGET PHYSICAL PIN
              </div>
              <div style={{ fontSize: '22px', fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
                {selectedPin.pin}
              </div>
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                {selectedPin.name}
              </div>
            </div>

            {/* Spec Table */}
            <div className="spec-table-list">
              <div className="spec-table-row">
                <span className="spec-label">Electrical Mode:</span>
                <span className="spec-value mono accent">{selectedPin.mode}</span>
              </div>
              <div className="spec-table-row">
                <span className="spec-label">ADC/Bus Channel:</span>
                <span className="spec-value mono">{selectedPin.adc}</span>
              </div>
              <div className="spec-table-row">
                <span className="spec-label">Hardware Resolution:</span>
                <span className="spec-value mono teal">{selectedPin.resolution}</span>
              </div>
              <div className="spec-table-row">
                <span className="spec-label">Sampling Rate:</span>
                <span className="spec-value mono green">{selectedPin.rate}</span>
              </div>
              <div className="spec-table-row">
                <span className="spec-label">Current Live Reading:</span>
                <span className="spec-value mono accent-large">
                  {typeof sensorState[selectedPin.sensorKey] === 'number'
                    ? sensorState[selectedPin.sensorKey].toFixed(2)
                    : (sensorState[selectedPin.sensorKey] ?? 'NOMINAL')}
                </span>
              </div>
            </div>

            {/* Circuit Description */}
            <div className="circuit-desc-box">
              <div style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', marginBottom: '4px', letterSpacing: '0.04em' }}>
                CIRCUIT TOPOLOGY & ATTENUATION
              </div>
              <p style={{ margin: 0, lineHeight: 1.5 }}>{selectedPin.desc}</p>
            </div>

            {/* Hardware Limitations & Electrical Capabilities */}
            <div className="circuit-desc-box" style={{ borderColor: 'var(--border)' }}>
              <div style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--accent-amber)', marginBottom: '4px', letterSpacing: '0.04em' }}>
                ELECTRICAL CAPABILITIES & CONSTRAINTS
              </div>
              <p style={{ margin: 0, lineHeight: 1.5 }}>{selectedPin.capabilities}</p>
            </div>

            {/* Electrical Integrity */}
            <div style={{ marginTop: 'auto', paddingTop: '10px' }}>
              <div className="pin-verified-banner">
                <CheckCircle size={14} />
                <span>Internal Pull-Up Engaged • Impedance Verified (10kΩ)</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
