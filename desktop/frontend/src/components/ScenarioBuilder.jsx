import React, { useState } from 'react';

const SENSORS = [
  { key: 'temperature', name: 'Temperature (°C)', defaultFrom: 0, defaultTo: 50 },
  { key: 'humidity', name: 'Humidity (%)', defaultFrom: 0, defaultTo: 100 },
  { key: 'gas', name: 'Gas (ppm)', defaultFrom: 0, defaultTo: 1000 },
  { key: 'light', name: 'Light (lux)', defaultFrom: 0, defaultTo: 1000 },
  { key: 'soil_moisture', name: 'Soil Moisture (%)', defaultFrom: 0, defaultTo: 100 }
];

export default function ScenarioBuilder({ onStartRamp, onStartStatic, onStopScenario, onStopAll }) {
  const [selectedSensor, setSelectedSensor] = useState('temperature');
  const [staticVal, setStaticVal] = useState(25);
  const [fromVal, setFromVal] = useState(0);
  const [toVal, setToVal] = useState(50);
  const [duration, setDuration] = useState(10);

  const currentSensorMeta = SENSORS.find(s => s.key === selectedSensor);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: '700' }}>Scenario Engine Control</h2>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            Generate synthetic RAMP sweeps and STATIC signals across virtual sensors
          </p>
        </div>
        <button className="btn-secondary" style={{ color: '#fca5a5', borderColor: 'rgba(239, 68, 68, 0.4)' }} onClick={onStopAll}>
          Stop All Scenarios
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        {/* RAMP Scenario */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '16px', padding: '24px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px', color: 'var(--accent-primary)' }}>
            📈 RAMP Scenario Sweep
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Target Sensor</label>
              <select
                style={{ width: '100%', padding: '8px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', color: '#fff', borderRadius: '8px' }}
                value={selectedSensor}
                onChange={(e) => {
                  setSelectedSensor(e.target.value);
                  const meta = SENSORS.find(s => s.key === e.target.value);
                  if (meta) { setFromVal(meta.defaultFrom); setToVal(meta.defaultTo); }
                }}
              >
                {SENSORS.map(s => <option key={s.key} value={s.key}>{s.name}</option>)}
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Start Value</label>
                <input
                  type="number"
                  style={{ width: '100%', padding: '8px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', color: '#fff', borderRadius: '8px' }}
                  value={fromVal}
                  onChange={(e) => setFromVal(parseFloat(e.target.value))}
                />
              </div>
              <div>
                <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>End Value</label>
                <input
                  type="number"
                  style={{ width: '100%', padding: '8px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', color: '#fff', borderRadius: '8px' }}
                  value={toVal}
                  onChange={(e) => setToVal(parseFloat(e.target.value))}
                />
              </div>
            </div>

            <div>
              <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Duration (Seconds)</label>
              <input
                type="number"
                style={{ width: '100%', padding: '8px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', color: '#fff', borderRadius: '8px' }}
                value={duration}
                onChange={(e) => setDuration(parseFloat(e.target.value))}
              />
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
              <button
                className="btn-primary"
                style={{ flex: 1 }}
                onClick={() => onStartRamp(selectedSensor, fromVal, toVal, duration)}
              >
                Start RAMP
              </button>
              <button
                className="btn-secondary"
                onClick={() => onStopScenario(selectedSensor)}
              >
                Stop
              </button>
            </div>
          </div>
        </div>

        {/* STATIC Scenario */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '16px', padding: '24px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px', color: 'var(--accent-cyan)' }}>
            🎯 STATIC Value Target
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Target Sensor</label>
              <select
                style={{ width: '100%', padding: '8px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', color: '#fff', borderRadius: '8px' }}
                value={selectedSensor}
                onChange={(e) => setSelectedSensor(e.target.value)}
              >
                {SENSORS.map(s => <option key={s.key} value={s.key}>{s.name}</option>)}
              </select>
            </div>

            <div>
              <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Fixed Output Value</label>
              <input
                type="number"
                style={{ width: '100%', padding: '8px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', color: '#fff', borderRadius: '8px' }}
                value={staticVal}
                onChange={(e) => setStaticVal(parseFloat(e.target.value))}
              />
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '54px' }}>
              <button
                className="btn-primary"
                style={{ flex: 1, background: 'var(--accent-cyan)' }}
                onClick={() => onStartStatic(selectedSensor, staticVal)}
              >
                Start STATIC
              </button>
              <button
                className="btn-secondary"
                onClick={() => onStopScenario(selectedSensor)}
              >
                Stop
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
