import React from 'react';
import { SENSORS, GROUND_WIRE } from '../utils/constants';
import { useSensors } from '../context/SensorContext';
import { Cpu, ShieldCheck } from 'lucide-react';

export default function PinConfigTable() {
  const { sensorValues, hoveredSensor, setHoveredSensor, selectedSensor, setSelectedSensor } = useSensors();

  return (
    <div className="glass-panel" style={{ padding: '1.25rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Cpu size={16} color="var(--accent-cyan)" />
          <h3 style={{ fontSize: '0.95rem', fontWeight: '700' }}>Active Hardware Routing Table</h3>
        </div>
        <span className="mono-tag" style={{ color: 'var(--text-muted)' }}>
          LEDC 500Hz / 8-Bit DAC
        </span>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)' }}>
              <th style={{ padding: '0.5rem 0.75rem' }}>Channel</th>
              <th style={{ padding: '0.5rem 0.75rem' }}>ESP32 GPIO</th>
              <th style={{ padding: '0.5rem 0.75rem' }}>Arduino Pin</th>
              <th style={{ padding: '0.5rem 0.75rem' }}>Transport</th>
              <th style={{ padding: '0.5rem 0.75rem' }}>Live Electrical Signal</th>
              <th style={{ padding: '0.5rem 0.75rem' }}>Logical Reading</th>
            </tr>
          </thead>
          <tbody>
            {SENSORS.map(s => {
              const val = sensorValues[s.key] !== undefined ? sensorValues[s.key] : s.defaultVal;
              const pct = ((val - s.min) / (s.max - s.min || 1)) * 100;
              const electrical = s.signal === 'DAC'
                ? `${((pct / 100) * 3.3).toFixed(2)} V (Analog)`
                : `${pct.toFixed(1)}% Duty @ 500 Hz`;

              const isRowActive = hoveredSensor === s.id || selectedSensor === s.id;

              return (
                <tr
                  key={s.id}
                  style={{
                    borderBottom: '1px solid var(--border-subtle)',
                    backgroundColor: isRowActive ? `${s.color}15` : 'transparent',
                    cursor: 'pointer',
                    transition: 'background-color 0.15s ease'
                  }}
                  onMouseEnter={() => setHoveredSensor(s.id)}
                  onMouseLeave={() => setHoveredSensor(null)}
                  onClick={() => setSelectedSensor(selectedSensor === s.id ? null : s.id)}
                >
                  <td style={{ padding: '0.65rem 0.75rem', fontWeight: '600', color: s.color, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: s.color }} />
                    {s.name}
                  </td>
                  <td style={{ padding: '0.65rem 0.75rem', fontFamily: 'var(--font-mono)' }}>{s.espPin}</td>
                  <td style={{ padding: '0.65rem 0.75rem', fontFamily: 'var(--font-mono)' }}>{s.arduinoPin}</td>
                  <td style={{ padding: '0.65rem 0.75rem' }}>
                    <span
                      className="mono-tag"
                      style={{
                        padding: '2px 6px',
                        borderRadius: 'var(--radius-sm)',
                        backgroundColor: s.signal === 'DAC' ? 'rgba(6, 182, 212, 0.15)' : 'rgba(99, 102, 241, 0.15)',
                        color: s.signal === 'DAC' ? 'var(--accent-cyan)' : 'var(--accent-indigo)',
                        fontWeight: '600'
                      }}
                    >
                      {s.signal}
                    </span>
                  </td>
                  <td style={{ padding: '0.65rem 0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>
                    {electrical}
                  </td>
                  <td style={{ padding: '0.65rem 0.75rem', fontFamily: 'var(--font-mono)', fontWeight: '700', color: s.color }}>
                    {val.toFixed(s.step < 1 ? 1 : 0)} {s.unit}
                  </td>
                </tr>
              );
            })}

            {/* Common Ground row */}
            <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)' }}>
              <td style={{ padding: '0.65rem 0.75rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: GROUND_WIRE.color }} />
                {GROUND_WIRE.name}
              </td>
              <td style={{ padding: '0.65rem 0.75rem', fontFamily: 'var(--font-mono)' }}>{GROUND_WIRE.espPin}</td>
              <td style={{ padding: '0.65rem 0.75rem', fontFamily: 'var(--font-mono)' }}>{GROUND_WIRE.arduinoPin}</td>
              <td style={{ padding: '0.65rem 0.75rem' }}>
                <span className="mono-tag" style={{ padding: '2px 6px', borderRadius: 'var(--radius-sm)', backgroundColor: 'rgba(255, 255, 255, 0.05)' }}>
                  GND REF
                </span>
              </td>
              <td style={{ padding: '0.65rem 0.75rem', fontFamily: 'var(--font-mono)' }}>0.0 V (Shared Ground)</td>
              <td style={{ padding: '0.65rem 0.75rem', fontFamily: 'var(--font-mono)' }}>Required</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
