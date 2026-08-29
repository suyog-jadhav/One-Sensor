import React, { useState, useEffect } from 'react';

const VALID_PWM_PINS = [4, 5, 12, 13, 14, 15, 16, 17, 18, 19, 21, 22, 23, 25, 26, 27, 32, 33];
const VALID_DAC_PINS = [25, 26];

const SENSOR_OPTIONS = [
  { id: 'temperature', name: 'Temperature' },
  { id: 'humidity', name: 'Humidity' },
  { id: 'gas', name: 'Gas Concentration' },
  { id: 'light', name: 'Light Intensity' },
  { id: 'soil_moisture', name: 'Soil Moisture' }
];

const DEFAULT_CHANNELS = [
  { sensor: 'temperature', signal: 'dac', gpio: 25, ledcChannel: 0, frequencyHz: 500, resolutionBits: 10, inputMin: 0, inputMax: 50, defaultValue: 25, enabled: true },
  { sensor: 'humidity', signal: 'dac', gpio: 26, ledcChannel: 1, frequencyHz: 500, resolutionBits: 10, inputMin: 0, inputMax: 100, defaultValue: 50, enabled: true },
  { sensor: 'gas', signal: 'pwm', gpio: 18, ledcChannel: 2, frequencyHz: 500, resolutionBits: 10, inputMin: 0, inputMax: 1000, defaultValue: 300, enabled: true },
  { sensor: 'light', signal: 'pwm', gpio: 19, ledcChannel: 3, frequencyHz: 500, resolutionBits: 10, inputMin: 0, inputMax: 1000, defaultValue: 500, enabled: true },
  { sensor: 'soil_moisture', signal: 'pwm', gpio: 21, ledcChannel: 4, frequencyHz: 500, resolutionBits: 10, inputMin: 0, inputMax: 100, defaultValue: 50, enabled: true }
];

export default function ConfigEditor({ configState, configError, onApplyConfig, onResetConfig }) {
  const [localChannels, setLocalChannels] = useState(DEFAULT_CHANNELS);

  useEffect(() => {
    if (configState && configState.channels && configState.channels.length > 0) {
      setLocalChannels(configState.channels.map(ch => ({
        ...ch,
        enabled: ch.enabled !== undefined ? ch.enabled : true
      })));
    }
  }, [configState]);

  const handleChange = (index, field, value) => {
    const updated = [...localChannels];
    updated[index] = { ...updated[index], [field]: value };
    setLocalChannels(updated);
  };

  const handleSave = () => {
    onApplyConfig(localChannels);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: '700' }}>Sensor & GPIO Pin Configuration</h2>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            Configure which ESP32 GPIO pin maps to which sensor, select active sensors (1 or more), and set PWM/DAC parameters.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="btn-secondary" onClick={onResetConfig}>
            Reset Factory Defaults
          </button>
          <button className="btn-primary" onClick={handleSave}>
            Apply & Save to NVS
          </button>
        </div>
      </div>

      {configError && (
        <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid #ef4444', color: '#fca5a5', padding: '14px 18px', borderRadius: '12px', fontSize: '14px' }}>
          <strong>Config Validation Error:</strong> {configError}
        </div>
      )}

      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '16px', overflow: 'hidden' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th style={{ width: '60px', textAlign: 'center' }}>Active</th>
              <th>Sensor Selection</th>
              <th>Signal Type</th>
              <th>ESP32 GPIO Pin</th>
              <th>Freq (Hz)</th>
              <th>Bits</th>
              <th>Min</th>
              <th>Max</th>
              <th>Cal Offset</th>
              <th>Cal Scale</th>
            </tr>
          </thead>
          <tbody>
            {localChannels.map((ch, idx) => (
              <tr key={idx} style={{ opacity: ch.enabled === false ? 0.5 : 1 }}>
                {/* Active Checkbox */}
                <td style={{ textAlign: 'center' }}>
                  <input
                    type="checkbox"
                    checked={ch.enabled !== false}
                    onChange={(e) => handleChange(idx, 'enabled', e.target.checked)}
                    style={{ cursor: 'pointer', transform: 'scale(1.2)' }}
                  />
                </td>

                {/* Sensor Type Selector */}
                <td>
                  <select
                    style={{ fontWeight: '600' }}
                    value={ch.sensor}
                    onChange={(e) => handleChange(idx, 'sensor', e.target.value)}
                  >
                    {SENSOR_OPTIONS.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </td>

                {/* Signal Type Selector */}
                <td>
                  <select
                    value={ch.signal}
                    onChange={(e) => {
                      const sig = e.target.value;
                      const newGpio = sig === 'dac' ? 25 : (ch.gpio === 25 || ch.gpio === 26 ? 18 : ch.gpio);
                      const updated = [...localChannels];
                      updated[idx] = { ...updated[idx], signal: sig, gpio: newGpio };
                      setLocalChannels(updated);
                    }}
                  >
                    <option value="pwm">PWM (Digital)</option>
                    <option value="dac">DAC (Analog)</option>
                  </select>
                </td>

                {/* GPIO Selector */}
                <td>
                  <select
                    value={ch.gpio}
                    onChange={(e) => handleChange(idx, 'gpio', parseInt(e.target.value))}
                  >
                    {(ch.signal === 'dac' ? VALID_DAC_PINS : VALID_PWM_PINS).map((pin) => (
                      <option key={pin} value={pin}>
                        GPIO {pin} {pin === 25 ? '(DAC1 / A0)' : pin === 26 ? '(DAC2 / A1)' : ''}
                      </option>
                    ))}
                  </select>
                </td>

                <td>
                  <input
                    type="number"
                    style={{ width: '80px' }}
                    value={ch.frequencyHz}
                    disabled={ch.signal === 'dac'}
                    onChange={(e) => handleChange(idx, 'frequencyHz', parseInt(e.target.value))}
                  />
                </td>

                <td>
                  <input
                    type="number"
                    style={{ width: '60px' }}
                    value={ch.resolutionBits}
                    disabled={ch.signal === 'dac'}
                    onChange={(e) => handleChange(idx, 'resolutionBits', parseInt(e.target.value))}
                  />
                </td>

                <td>
                  <input
                    type="number"
                    style={{ width: '70px' }}
                    value={ch.inputMin}
                    onChange={(e) => handleChange(idx, 'inputMin', parseFloat(e.target.value))}
                  />
                </td>

                <td>
                  <input
                    type="number"
                    style={{ width: '70px' }}
                    value={ch.inputMax}
                    onChange={(e) => handleChange(idx, 'inputMax', parseFloat(e.target.value))}
                  />
                </td>

                <td>
                  <input
                    type="number"
                    step="0.01"
                    style={{ width: '70px' }}
                    value={ch.calOffset || 0}
                    onChange={(e) => handleChange(idx, 'calOffset', parseFloat(e.target.value))}
                  />
                </td>

                <td>
                  <input
                    type="number"
                    step="0.01"
                    style={{ width: '70px' }}
                    value={ch.calScale || 1.0}
                    onChange={(e) => handleChange(idx, 'calScale', parseFloat(e.target.value))}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
