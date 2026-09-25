import React, { useState } from 'react';
import Badge from './Badge';
import { Zap, RotateCcw, AlertTriangle, ShieldOff, Check } from 'lucide-react';

const SENSORS = [
  { key: 'temperature',   name: 'Temperature',      unit: '°C',   color: '#ef4444' },
  { key: 'humidity',      name: 'Humidity',          unit: '%',    color: '#38bdf8' },
  { key: 'gas',           name: 'Gas',               unit: 'ppm',  color: '#8b5cf6' },
  { key: 'light',         name: 'Light',             unit: 'lux',  color: '#f59e0b' },
  { key: 'soil_moisture', name: 'Soil Moisture',     unit: '%',    color: '#10b981' },
  { key: 'motionX',       name: 'Motion X',          unit: 'g',    color: '#f472b6' },
  { key: 'motionY',       name: 'Motion Y',          unit: 'g',    color: '#a78bfa' },
  { key: 'motionZ',       name: 'Motion Z',          unit: 'g',    color: '#818cf8' },
  { key: 'proximity',     name: 'Proximity',         unit: 'cm',   color: '#fb923c' },
  { key: 'sound',         name: 'Sound Level',       unit: 'dB',   color: '#34d399' },
  { key: 'uv',            name: 'UV Index',          unit: 'idx',  color: '#fbbf24' },
  { key: 'co2',           name: 'CO₂ / Air Quality', unit: 'ppm',  color: '#6ee7b7' },
];

const FAULT_DEFS = [
  { type: 'dropout',    label: 'Dropout',    icon: '⏸', desc: 'Freezes output at last known value — simulates ADC stall / bus lockup.' },
  { type: 'stuck',      label: 'Stuck',      icon: '📌', desc: 'Pins output to the magnitude value regardless of sensor input.' },
  { type: 'noise',      label: 'Noise',      icon: '〰️', desc: 'Adds Gaussian jitter (σ = magnitude) using Box-Muller transform.' },
  { type: 'spike',      label: 'Spike',      icon: '⚡', desc: 'Adds a one-shot excursion by ±magnitude on every update tick.' },
  { type: 'drift',      label: 'Drift',      icon: '📈', desc: 'Accumulates a linear bias of magnitude units/second over time.' },
  { type: 'disconnect', label: 'Disconnect', icon: '🔌', desc: 'Drives output to 0 (NaN internally) — simulates cable pull / open circuit.' },
  { type: 'latency',    label: 'Latency',    icon: '⏳', desc: 'Replays value from a ring-buffer delayed by latencyMs milliseconds.' },
];

const SEVERITY_COLOR = {
  dropout:    '#38bdf8',
  stuck:      '#f59e0b',
  noise:      '#8b5cf6',
  spike:      '#ef4444',
  drift:      '#f472b6',
  disconnect: '#6b7280',
  latency:    '#34d399',
};

export default function FaultInjection({ onInjectFault, onClearFault }) {
  const [activeSensors, setActiveSensors] = useState(['temperature']);
  const [faultType, setFaultType] = useState('noise');
  const [magnitude, setMagnitude] = useState(5);
  const [durationMs, setDurationMs] = useState(0);
  const [latencyMs, setLatencyMs] = useState(300);
  const [injectedLog, setInjectedLog] = useState([]);
  const [lastFlash, setLastFlash] = useState(null);

  const currentFaultDef = FAULT_DEFS.find(f => f.type === faultType);
  const faultColor = SEVERITY_COLOR[faultType] || '#ef4444';

  const toggleSensor = (key) => {
    setActiveSensors(prev =>
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
  };

  const handleInject = () => {
    if (activeSensors.length === 0) return;
    activeSensors.forEach(sensor => {
      onInjectFault(sensor, faultType, magnitude, durationMs, faultType === 'latency' ? latencyMs : 0);
    });
    const entry = {
      id: Date.now(),
      sensors: [...activeSensors],
      type: faultType,
      magnitude,
      durationMs,
      latencyMs: faultType === 'latency' ? latencyMs : 0,
      ts: new Date().toLocaleTimeString(),
    };
    setInjectedLog(prev => [entry, ...prev].slice(0, 20));
    setLastFlash(entry.id);
    setTimeout(() => setLastFlash(null), 1500);
  };

  const handleClearOne = (sensor) => {
    onClearFault(sensor);
    setInjectedLog(prev => prev.filter(e => !e.sensors.includes(sensor)));
  };

  const handleClearAll = () => {
    onClearFault('all');
    setInjectedLog([]);
  };

  return (
    <div className="tab-content-enter" style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
            <ShieldOff size={20} color="#ef4444" />
            <h2 style={{ fontSize: '18px', fontWeight: '700' }}>Fault Injection Engine</h2>
            <Badge variant="danger" dot>LIVE</Badge>
          </div>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            Inject hardware faults per-channel at runtime. All faults are applied before DAC/PWM output — the Arduino receiver sees the corrupted signal.
          </p>
        </div>
        <button className="btn-secondary" onClick={handleClearAll} style={{ borderColor: 'rgba(239,68,68,0.4)', color: '#fca5a5' }}>
          <RotateCcw size={14} />
          <span>Clear All Faults</span>
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '20px', alignItems: 'start' }}>

        {/* Left: Config Panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>

          {/* Fault Type Selector */}
          <div className="interactive-card" style={{
            background: 'var(--bg-card)', border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-lg)', padding: '20px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
              <Zap size={15} color={faultColor} />
              <span style={{ fontSize: '13px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Fault Type</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '10px' }}>
              {FAULT_DEFS.map(f => {
                const isActive = faultType === f.type;
                const col = SEVERITY_COLOR[f.type];
                return (
                  <button
                    key={f.type}
                    onClick={() => setFaultType(f.type)}
                    style={{
                      display: 'flex', flexDirection: 'column', alignItems: 'flex-start',
                      gap: '6px', padding: '12px 14px', borderRadius: 'var(--radius-md)',
                      background: isActive ? `rgba(${hexToRgb(col)}, 0.15)` : 'rgba(255,255,255,0.03)',
                      border: `1px solid ${isActive ? col : 'rgba(255,255,255,0.08)'}`,
                      color: isActive ? '#fff' : 'var(--text-muted)',
                      cursor: 'pointer', textAlign: 'left',
                      transition: 'all var(--motion-fast)',
                    }}
                  >
                    <span style={{ fontSize: '18px' }}>{f.icon}</span>
                    <span style={{ fontSize: '12px', fontWeight: '700', color: isActive ? col : 'var(--text-muted)' }}>{f.label}</span>
                  </button>
                );
              })}
            </div>
            {currentFaultDef && (
              <p style={{
                marginTop: '14px', fontSize: '12px', color: 'var(--text-muted)',
                padding: '10px 14px', background: 'rgba(0,0,0,0.3)',
                borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)',
                borderLeft: `3px solid ${faultColor}`,
              }}>
                {currentFaultDef.desc}
              </p>
            )}
          </div>

          {/* Parameters */}
          <div className="interactive-card" style={{
            background: 'var(--bg-card)', border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-lg)', padding: '20px',
          }}>
            <span style={{ fontSize: '13px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '16px' }}>
              Parameters
            </span>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '18px' }}>
              <div>
                <label style={{ fontSize: '11px', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)', display: 'block', marginBottom: '8px' }}>
                  MAGNITUDE: <span style={{ color: faultColor, fontWeight: '700' }}>{magnitude}</span>
                </label>
                <input
                  type="range" min={0} max={500} step={1}
                  value={magnitude}
                  onChange={e => setMagnitude(Number(e.target.value))}
                  disabled={faultType === 'disconnect' || faultType === 'dropout'}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)', marginTop: '4px' }}>
                  <span>0</span><span>500</span>
                </div>
              </div>
              <div>
                <label style={{ fontSize: '11px', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)', display: 'block', marginBottom: '8px' }}>
                  DURATION: <span style={{ color: 'var(--color-cyan)', fontWeight: '700' }}>{durationMs === 0 ? '∞ (manual clear)' : `${durationMs} ms`}</span>
                </label>
                <input
                  type="range" min={0} max={10000} step={500}
                  value={durationMs}
                  onChange={e => setDurationMs(Number(e.target.value))}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)', marginTop: '4px' }}>
                  <span>∞</span><span>10 s</span>
                </div>
              </div>
              {faultType === 'latency' && (
                <div>
                  <label style={{ fontSize: '11px', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)', display: 'block', marginBottom: '8px' }}>
                    LATENCY DELAY: <span style={{ color: '#34d399', fontWeight: '700' }}>{latencyMs} ms</span>
                  </label>
                  <input
                    type="range" min={0} max={2000} step={50}
                    value={latencyMs}
                    onChange={e => setLatencyMs(Number(e.target.value))}
                  />
                </div>
              )}
              {faultType === 'stuck' && (
                <div>
                  <label style={{ fontSize: '11px', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)', display: 'block', marginBottom: '8px' }}>
                    STUCK VALUE: <span style={{ color: '#f59e0b', fontWeight: '700' }}>{magnitude}</span>
                  </label>
                  <p style={{ fontSize: '11px', color: 'var(--text-dim)' }}>Uses the Magnitude slider above as the pinned output value.</p>
                </div>
              )}
            </div>
          </div>

          {/* Target Sensor Selection */}
          <div className="interactive-card" style={{
            background: 'var(--bg-card)', border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-lg)', padding: '20px',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <span style={{ fontSize: '13px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Target Channels
              </span>
              <Badge variant={activeSensors.length > 0 ? 'danger' : 'neutral'} size="sm">
                {activeSensors.length} SELECTED
              </Badge>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '18px' }}>
              {SENSORS.map(s => {
                const isOn = activeSensors.includes(s.key);
                return (
                  <button
                    key={s.key}
                    onClick={() => toggleSensor(s.key)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '6px',
                      padding: '6px 12px', borderRadius: 'var(--radius-full)',
                      background: isOn ? `rgba(${hexToRgb(s.color)}, 0.18)` : 'rgba(255,255,255,0.04)',
                      border: `1px solid ${isOn ? s.color : 'rgba(255,255,255,0.08)'}`,
                      color: isOn ? '#fff' : 'var(--text-dim)',
                      fontSize: '12px', fontWeight: '600', cursor: 'pointer',
                      transition: 'all var(--motion-fast)',
                    }}
                  >
                    {isOn && <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: s.color, flexShrink: 0 }} />}
                    <span>{s.name}</span>
                  </button>
                );
              })}
            </div>

            <button
              className="btn-primary"
              onClick={handleInject}
              disabled={activeSensors.length === 0}
              style={{
                width: '100%',
                background: activeSensors.length > 0 ? `rgba(${hexToRgb(faultColor)}, 0.2)` : undefined,
                borderColor: activeSensors.length > 0 ? faultColor : undefined,
                color: activeSensors.length > 0 ? faultColor : undefined,
                fontSize: '14px', padding: '12px',
                transition: 'all var(--motion-fast)',
              }}
            >
              <Zap size={16} />
              <span>
                Inject [{faultType.toUpperCase()}] → {activeSensors.length} Channel{activeSensors.length !== 1 ? 's' : ''}
              </span>
            </button>
          </div>
        </div>

        {/* Right: Active Faults / Event Log */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* Per-sensor clear buttons */}
          <div className="interactive-card" style={{
            background: 'var(--bg-card)', border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-lg)', padding: '18px',
          }}>
            <span style={{ fontSize: '13px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '12px' }}>
              Per-Channel Clear
            </span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {SENSORS.map(s => (
                <div key={s.key} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '7px 10px', borderRadius: 'var(--radius-sm)',
                  background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: s.color, flexShrink: 0 }} />
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{s.name}</span>
                  </div>
                  <button
                    onClick={() => handleClearOne(s.key)}
                    style={{
                      padding: '3px 8px', borderRadius: 'var(--radius-sm)',
                      background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)',
                      color: '#fca5a5', fontSize: '10px', fontFamily: 'var(--font-mono)',
                      cursor: 'pointer', transition: 'all var(--motion-fast)',
                    }}
                  >
                    CLEAR
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Injection event log */}
          <div className="interactive-card" style={{
            background: 'var(--bg-card)', border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-lg)', padding: '18px',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <span style={{ fontSize: '13px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Event Log
              </span>
              <Badge variant="neutral" size="sm">{injectedLog.length}</Badge>
            </div>
            {injectedLog.length === 0 ? (
              <p style={{ fontSize: '12px', color: 'var(--text-dim)', textAlign: 'center', padding: '20px 0' }}>
                No faults injected this session.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '340px', overflowY: 'auto' }}>
                {injectedLog.map(entry => {
                  const col = SEVERITY_COLOR[entry.type] || '#ef4444';
                  const isNew = lastFlash === entry.id;
                  return (
                    <div
                      key={entry.id}
                      style={{
                        padding: '8px 10px', borderRadius: 'var(--radius-sm)',
                        background: isNew ? `rgba(${hexToRgb(col)}, 0.12)` : 'rgba(255,255,255,0.03)',
                        border: `1px solid ${isNew ? col : 'rgba(255,255,255,0.06)'}`,
                        transition: 'all var(--motion-fast)',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <span style={{ fontSize: '11px', fontWeight: '700', color: col, fontFamily: 'var(--font-mono)' }}>
                          [{entry.type.toUpperCase()}]
                        </span>
                        <span style={{ fontSize: '10px', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
                          {entry.ts}
                        </span>
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        {entry.sensors.join(', ')}
                        {entry.magnitude > 0 && <span> · mag={entry.magnitude}</span>}
                        {entry.durationMs > 0 && <span> · {entry.durationMs}ms</span>}
                        {entry.latencyMs > 0 && <span> · delay={entry.latencyMs}ms</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}

// Utility: "#rrggbb" → "r, g, b" for rgba()
function hexToRgb(hex) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `${r}, ${g}, ${b}`;
}
