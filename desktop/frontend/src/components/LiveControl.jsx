import React, { useState, useEffect, useRef, lazy, Suspense } from 'react';
import Badge from './Badge';
import { useSmoothedValue } from '../utils/useSmoothedValue';
import { RefreshCw, Wifi, AlertTriangle, Zap, RotateCcw } from 'lucide-react';

const MotionGizmo3D = lazy(() => import('./MotionGizmo3D'));

const SENSOR_META = [
  { key: 'temperature',  name: 'Temperature',     unit: '°C',    icon: '🌡️',  min: 0,   max: 50,   step: 0.5,  color: '#ef4444', wsKey: 'temperature' },
  { key: 'humidity',     name: 'Humidity',         unit: '%',     icon: '💧',  min: 0,   max: 100,  step: 0.5,  color: '#38bdf8', wsKey: 'humidity' },
  { key: 'gas',         name: 'Gas',               unit: 'ppm',   icon: '☁️',  min: 0,   max: 1000, step: 5,    color: '#8b5cf6', wsKey: 'gas' },
  { key: 'light',       name: 'Light',             unit: 'lux',   icon: '☀️',  min: 0,   max: 1000, step: 5,    color: '#f59e0b', wsKey: 'light' },
  { key: 'soil',        name: 'Soil Moisture',     unit: '%',     icon: '🌱',  min: 0,   max: 100,  step: 0.5,  color: '#10b981', wsKey: 'soil_moisture' },
  { key: 'motionX',     name: 'Motion X',          unit: 'g',     icon: '📐',  min: -2,  max: 2,    step: 0.01, color: '#f472b6', wsKey: 'motionX' },
  { key: 'motionY',     name: 'Motion Y',          unit: 'g',     icon: '📐',  min: -2,  max: 2,    step: 0.01, color: '#a78bfa', wsKey: 'motionY' },
  { key: 'motionZ',     name: 'Motion Z',          unit: 'g',     icon: '📐',  min: -2,  max: 2,    step: 0.01, color: '#818cf8', wsKey: 'motionZ' },
  { key: 'proximity',   name: 'Proximity',         unit: 'cm',    icon: '📡',  min: 2,   max: 400,  step: 1,    color: '#fb923c', wsKey: 'proximity' },
  { key: 'sound',       name: 'Sound Level',       unit: 'dB',    icon: '🔊',  min: 30,  max: 120,  step: 0.5,  color: '#34d399', wsKey: 'sound' },
  { key: 'uv',          name: 'UV Index',          unit: 'idx',   icon: '🌞',  min: 0,   max: 11,   step: 0.1,  color: '#fbbf24', wsKey: 'uv' },
  { key: 'co2',         name: 'CO₂ / Air Quality', unit: 'ppm',   icon: '🍃',  min: 400, max: 5000, step: 10,   color: '#6ee7b7', wsKey: 'co2' },
];

const FAULT_TYPES = ['none', 'dropout', 'stuck', 'noise', 'spike', 'drift', 'disconnect', 'latency'];

const API_BASE = 'http://localhost:8000';

// ─── Individual Sensor Card ────────────────────────────────────────────────────
function LiveSensorCard({ sensor, rawVal, isConnected, onSetValue, activeFault }) {
  const numVal = rawVal !== undefined ? Number(rawVal) : ((sensor.min + sensor.max) / 2);
  const smoothedVal = useSmoothedValue(numVal, { duration: 260, decimals: sensor.step < 0.1 ? 3 : 1, isActive: true });
  const [pulseActive, setPulseActive] = useState(false);
  const prevValRef = useRef(numVal);

  useEffect(() => {
    if (Math.abs(prevValRef.current - numVal) > 0.05) {
      setPulseActive(true);
      const t = setTimeout(() => setPulseActive(false), 200);
      prevValRef.current = numVal;
      return () => clearTimeout(t);
    }
  }, [numVal]);

  const hasFault = activeFault && activeFault !== 'none';

  return (
    <div
      className="sensor-card interactive-card"
      style={{
        opacity: isConnected ? 1 : 0.75,
        border: hasFault
          ? '1px solid rgba(239,68,68,0.5)'
          : pulseActive
          ? `1px solid ${sensor.color}`
          : '1px solid var(--border-color)',
        transition: 'border-color var(--motion-fast), opacity var(--motion-standard)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {hasFault && (
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: '2px',
          background: 'linear-gradient(90deg, #ef4444, #f59e0b)',
          animation: 'shimmer 1.5s linear infinite',
        }} />
      )}
      <div className="card-top">
        <span className="sensor-name">{sensor.name}</span>
        <span style={{ fontSize: '20px' }}>{sensor.icon}</span>
      </div>

      <div
        className="sensor-value-large"
        style={{
          color: hasFault ? '#f59e0b' : sensor.color,
          transform: pulseActive ? 'scale(1.02)' : 'scale(1)',
          transition: 'transform var(--motion-instant)',
        }}
      >
        {rawVal !== undefined ? smoothedVal.toFixed(sensor.step < 0.1 ? 3 : 1) : '--'}{' '}
        <span className="unit">{sensor.unit}</span>
      </div>

      {hasFault && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: '5px',
          fontSize: '10px', fontFamily: 'var(--font-mono)',
          color: '#f59e0b', marginBottom: '6px',
        }}>
          <AlertTriangle size={10} />
          <span>FAULT: {activeFault.toUpperCase()}</span>
        </div>
      )}

      <div className="slider-container">
        <input
          type="range"
          min={sensor.min}
          max={sensor.max}
          step={sensor.step}
          value={numVal}
          disabled={!isConnected}
          onChange={(e) => onSetValue(sensor.wsKey, parseFloat(e.target.value))}
          title={isConnected ? '' : 'Connect to ESP32 first'}
          style={{ cursor: isConnected ? 'pointer' : 'not-allowed' }}
        />
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px', fontSize: '11px', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
        <span>MIN: {sensor.min}</span>
        <span>MAX: {sensor.max} {sensor.unit}</span>
      </div>
    </div>
  );
}

// ─── Fault Injection Panel ────────────────────────────────────────────────────
function FaultInjectionPanel({ onInjectFault, onClearFault }) {
  const [selectedSensor, setSelectedSensor] = useState('temperature');
  const [faultType, setFaultType] = useState('noise');
  const [magnitude, setMagnitude] = useState(5);
  const [durationMs, setDurationMs] = useState(0);
  const [latencyMs, setLatencyMs] = useState(200);
  const [lastInjected, setLastInjected] = useState(null);

  const handleInject = () => {
    onInjectFault(selectedSensor, faultType, magnitude, durationMs, latencyMs);
    setLastInjected({ sensor: selectedSensor, type: faultType });
    setTimeout(() => setLastInjected(null), 2500);
  };

  return (
    <div
      className="interactive-card"
      style={{
        background: 'rgba(239,68,68,0.04)',
        border: '1px solid rgba(239,68,68,0.2)',
        borderRadius: 'var(--radius-lg)',
        padding: '20px 24px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px' }}>
        <Zap size={16} color="#ef4444" />
        <h3 style={{ fontSize: '14px', fontWeight: '700', color: '#ef4444', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Fault Injection Engine
        </h3>
        <Badge variant="danger" size="sm">LIVE</Badge>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '14px', marginBottom: '16px' }}>
        {/* Sensor selector */}
        <div>
          <label style={{ fontSize: '11px', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)', display: 'block', marginBottom: '6px' }}>TARGET SENSOR</label>
          <select
            value={selectedSensor}
            onChange={e => setSelectedSensor(e.target.value)}
            style={{
              width: '100%', padding: '7px 10px', borderRadius: 'var(--radius-sm)',
              background: 'var(--bg-surface-3)', border: '1px solid var(--border-color)',
              color: 'var(--text-main)', fontFamily: 'var(--font-mono)', fontSize: '12px',
            }}
          >
            {SENSOR_META.map(s => <option key={s.wsKey} value={s.wsKey}>{s.name}</option>)}
          </select>
        </div>

        {/* Fault type */}
        <div>
          <label style={{ fontSize: '11px', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)', display: 'block', marginBottom: '6px' }}>FAULT TYPE</label>
          <select
            value={faultType}
            onChange={e => setFaultType(e.target.value)}
            style={{
              width: '100%', padding: '7px 10px', borderRadius: 'var(--radius-sm)',
              background: 'var(--bg-surface-3)', border: '1px solid var(--border-color)',
              color: 'var(--text-main)', fontFamily: 'var(--font-mono)', fontSize: '12px',
            }}
          >
            {FAULT_TYPES.filter(f => f !== 'none').map(f => (
              <option key={f} value={f}>{f.toUpperCase()}</option>
            ))}
          </select>
        </div>

        {/* Magnitude */}
        <div>
          <label style={{ fontSize: '11px', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)', display: 'block', marginBottom: '6px' }}>
            MAGNITUDE: <span style={{ color: 'var(--text-main)' }}>{magnitude}</span>
          </label>
          <input
            type="range" min={0} max={500} step={1}
            value={magnitude}
            onChange={e => setMagnitude(Number(e.target.value))}
          />
        </div>

        {/* Duration */}
        <div>
          <label style={{ fontSize: '11px', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)', display: 'block', marginBottom: '6px' }}>
            DURATION: <span style={{ color: 'var(--text-main)' }}>{durationMs === 0 ? '∞' : `${durationMs}ms`}</span>
          </label>
          <input
            type="range" min={0} max={10000} step={500}
            value={durationMs}
            onChange={e => setDurationMs(Number(e.target.value))}
          />
        </div>

        {/* Latency (only relevant for latency fault) */}
        {faultType === 'latency' && (
          <div>
            <label style={{ fontSize: '11px', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)', display: 'block', marginBottom: '6px' }}>
              LATENCY: <span style={{ color: 'var(--text-main)' }}>{latencyMs}ms</span>
            </label>
            <input
              type="range" min={0} max={2000} step={50}
              value={latencyMs}
              onChange={e => setLatencyMs(Number(e.target.value))}
            />
          </div>
        )}
      </div>

      {lastInjected && (
        <div className="banner-enter" style={{
          padding: '8px 14px', marginBottom: '12px', borderRadius: 'var(--radius-sm)',
          background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)',
          fontSize: '12px', fontFamily: 'var(--font-mono)', color: '#fca5a5',
        }}>
          ✓ Fault [{lastInjected.type.toUpperCase()}] armed on {lastInjected.sensor}
        </div>
      )}

      <div style={{ display: 'flex', gap: '10px' }}>
        <button className="btn-primary" onClick={handleInject}
          style={{ background: 'rgba(239,68,68,0.2)', borderColor: 'rgba(239,68,68,0.5)', color: '#fca5a5' }}
        >
          <Zap size={14} />
          <span>Inject Fault</span>
        </button>
        <button className="btn-secondary" onClick={() => onClearFault(selectedSensor)}>
          <RotateCcw size={14} />
          <span>Clear Sensor</span>
        </button>
        <button className="btn-secondary" onClick={() => onClearFault('all')}>
          <RotateCcw size={14} />
          <span>Clear ALL</span>
        </button>
      </div>
    </div>
  );
}

// ─── Main LiveControl Component ───────────────────────────────────────────────
export default function LiveControl({ state, onSetValue, onSetMotion, onInjectFault, onClearFault, onConnectESP32 }) {
  const [targetIP, setTargetIP] = useState('');
  const [connecting, setConnecting] = useState(false);
  const [esp32Connected, setEsp32Connected] = useState(false);
  const [esp32IP, setEsp32IP] = useState(null);
  const [activeFilter, setActiveFilter] = useState(
    Object.fromEntries(SENSOR_META.map(s => [s.key, true]))
  );
  const [latency, setLatency] = useState(14);
  const [isFlickering, setIsFlickering] = useState(false);
  const [showFaultPanel, setShowFaultPanel] = useState(false);
  const pollRef = useRef(null);

  // Poll /api/esp32_status every 3s
  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const start = performance.now();
        const res = await fetch(`${API_BASE}/api/esp32_status`);
        const data = await res.json();
        const roundTrip = Math.round(performance.now() - start);
        setIsFlickering(true);
        setTimeout(() => setIsFlickering(false), 80);
        setLatency(roundTrip > 0 ? roundTrip : 12);
        setEsp32Connected(data.connected);
        if (data.ip) { setEsp32IP(data.ip); setTargetIP(prev => prev || data.ip); }
      } catch (_) {}
    };
    fetchStatus();
    pollRef.current = setInterval(fetchStatus, 3000);
    return () => clearInterval(pollRef.current);
  }, []);

  const handleConnect = async () => {
    if (!targetIP) return;
    setConnecting(true);
    const res = await onConnectESP32(targetIP);
    setConnecting(false);
    if (res && res.success) { setEsp32Connected(true); setEsp32IP(targetIP); }
  };

  const toggleSensorFilter = (key) => {
    setActiveFilter(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const visibleSensors = SENSOR_META.filter(s => activeFilter[s.key]);
  const faults = state.faults || {};

  return (
    <div className="tab-content-enter" style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>

      {/* Top Banner */}
      <div
        className="interactive-card"
        style={{
          background: 'var(--bg-surface-2)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-lg)',
          padding: '20px 24px',
          backdropFilter: 'blur(16px)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div
            style={{
              width: '46px', height: '46px', borderRadius: '12px',
              background: esp32Connected ? 'rgba(16,185,129,0.15)' : 'rgba(245,158,11,0.15)',
              border: `1px solid ${esp32Connected ? 'rgba(16,185,129,0.35)' : 'rgba(245,158,11,0.35)'}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '22px', transition: 'all var(--motion-fast)',
            }}
          >{esp32Connected ? '⚡' : '🔬'}</div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: '700' }}>Live Transducer Control</h2>
              <Badge variant={esp32Connected ? 'success' : 'warning'} dot pulse={esp32Connected}>
                {esp32Connected ? 'HARDWARE LINKED' : 'SIMULATED LAB STATE'}
              </Badge>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
              12-channel real-time synthesis — direct hardware parameter modulation
              {esp32IP && <span style={{ fontFamily: 'var(--font-mono)', marginLeft: '8px', color: 'var(--text-main)', opacity: 0.85 }}>[{esp32IP}]</span>}
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            background: 'rgba(0,0,0,0.3)', padding: '6px 12px',
            borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)',
          }}>
            <span style={{ fontSize: '12px', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>TARGET:</span>
            <input
              type="text"
              placeholder="10.x.x.x or onesensor.local"
              style={{ background: 'transparent', border: 'none', color: '#fff', fontSize: '13px', fontFamily: 'var(--font-mono)', width: '180px', outline: 'none' }}
              value={targetIP}
              onChange={e => setTargetIP(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleConnect()}
            />
          </div>
          <button className="btn-primary" onClick={handleConnect} disabled={connecting} style={{ minWidth: '120px' }}>
            {connecting ? (<><RefreshCw size={14} className="spin-icon" /><span>Linking…</span></>) :
             esp32Connected ? (<><RefreshCw size={14} /><span>Reconnect</span></>) :
             (<><Wifi size={14} /><span>Connect</span></>)}
          </button>
          <button
            className="btn-secondary"
            onClick={() => setShowFaultPanel(p => !p)}
            style={{ borderColor: showFaultPanel ? 'rgba(239,68,68,0.5)' : undefined }}
          >
            <Zap size={14} />
            <span>{showFaultPanel ? 'Hide Faults' : 'Fault Engine'}</span>
          </button>
        </div>
      </div>

      {/* Disconnected warning */}
      {!esp32Connected && (
        <div className="banner-enter" style={{
          background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.3)',
          borderRadius: 'var(--radius-md)', padding: '12px 18px',
          fontSize: '13px', color: '#fcd34d',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '18px' }}>⚠️</span>
            <div>
              <strong>ESP32 hardware not linked.</strong> Controls are operating in local preview loop.
              {esp32IP && <span> Last endpoint: <code style={{ fontFamily: 'var(--font-mono)' }}>{esp32IP}</code></span>}
            </div>
          </div>
          <Badge variant="warning" size="sm">PREVIEW</Badge>
        </div>
      )}

      {/* Fault Injection Panel (collapsible) */}
      {showFaultPanel && (
        <FaultInjectionPanel onInjectFault={onInjectFault} onClearFault={onClearFault} />
      )}

      {/* Channel Filter Pills */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: 'var(--bg-surface-1)', border: '1px solid var(--border-color)',
        padding: '12px 18px', borderRadius: 'var(--radius-md)', flexWrap: 'wrap', gap: '12px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Active Channels:
          </span>
          {SENSOR_META.map(s => {
            const isActive = activeFilter[s.key];
            return (
              <button key={s.key} type="button" onClick={() => toggleSensorFilter(s.key)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '6px',
                  padding: '5px 10px', borderRadius: 'var(--radius-full)',
                  background: isActive ? 'rgba(37,99,235,0.2)' : 'rgba(255,255,255,0.04)',
                  border: isActive ? '1px solid var(--color-primary)' : '1px solid var(--border-color)',
                  color: isActive ? '#fff' : 'var(--text-dim)',
                  fontSize: '11px', fontWeight: '600', cursor: 'pointer',
                  userSelect: 'none', transition: 'all var(--motion-fast)',
                }}
              >
                <span>{s.icon}</span>
                <span>{s.name}</span>
                {isActive && <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: 'var(--color-primary)' }} />}
              </button>
            );
          })}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--color-cyan)' }}>
          <span className="badge-dot-pulse" style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--color-cyan)', boxShadow: '0 0 8px var(--color-cyan)', display: 'inline-block' }} />
          <span>SYNTHESIS: 250 HZ</span>
        </div>
      </div>

      {/* 3D Motion Gizmo (shown when any motion axis is active) */}
      {(activeFilter.motionX || activeFilter.motionY || activeFilter.motionZ) && (
        <Suspense fallback={
          <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-dim)', background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)' }}>
            Loading 3D Gyroscope…
          </div>
        }>
          <MotionGizmo3D
            accelX={state.motionX ?? 0}
            accelY={state.motionY ?? 0}
            accelZ={state.motionZ ?? 1}
            onSetMotion={onSetMotion}
          />
        </Suspense>
      )}

      {/* Cards Grid */}
      {visibleSensors.length === 0 ? (
        <div style={{
          padding: '40px', textAlign: 'center', color: 'var(--text-muted)',
          background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)',
        }}>
          No transducer channels selected. Enable one or more channels above.
        </div>
      ) : (
        <div className="cards-grid">
          {visibleSensors.map(s => {
            const rawVal = state[s.key] !== undefined ? state[s.key] : undefined;
            const activeFault = faults[s.wsKey]?.type;
            return (
              <LiveSensorCard
                key={s.key}
                sensor={s}
                rawVal={rawVal}
                isConnected={esp32Connected}
                onSetValue={onSetValue}
                activeFault={activeFault}
              />
            );
          })}
        </div>
      )}

      {/* Bottom diagnostics bar */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '10px 16px', background: 'var(--bg-surface-1)',
        border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)',
        fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-dim)',
        flexWrap: 'wrap', gap: '12px',
      }}>
        <div style={{ display: 'flex', gap: '20px' }}>
          <span>INSTRUMENTS: <strong style={{ color: 'var(--text-muted)' }}>{visibleSensors.length} / 12 ONLINE</strong></span>
          <span>FRAME-SYNC: <strong style={{ color: 'var(--color-success)' }}>4.0 HZ LOCKED</strong></span>
          <span>LATENCY:{' '}
            <strong style={{ color: 'var(--color-cyan)', opacity: isFlickering ? 0.4 : 1, transition: 'opacity var(--motion-instant)' }}>
              {latency} MS
            </strong>
          </span>
        </div>
        <div><span>ESP32 12-CH DAC/PWM BRIDGE ENGINE v2.0</span></div>
      </div>

    </div>
  );
}
