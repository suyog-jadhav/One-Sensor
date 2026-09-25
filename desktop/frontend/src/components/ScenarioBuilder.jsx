import React, { useState, useEffect, useRef } from 'react';
import Badge from './Badge';
import { useSmoothedValue } from '../utils/useSmoothedValue';
import { Play, Square, Activity, Sliders, Zap, TrendingUp, AlertOctagon } from 'lucide-react';

const SENSORS = [
  { key: 'temperature',  name: 'Temperature',     unit: '°C',  defaultFrom: 0,     defaultTo: 50,   min: 0,    max: 50,   color: '#ef4444' },
  { key: 'humidity',     name: 'Humidity',         unit: '%',   defaultFrom: 0,     defaultTo: 100,  min: 0,    max: 100,  color: '#38bdf8' },
  { key: 'gas',         name: 'Gas Concentration', unit: 'ppm', defaultFrom: 0,     defaultTo: 1000, min: 0,    max: 1000, color: '#8b5cf6' },
  { key: 'light',       name: 'Light Intensity',   unit: 'lux', defaultFrom: 0,     defaultTo: 1000, min: 0,    max: 1000, color: '#f59e0b' },
  { key: 'soil_moisture',name: 'Soil Moisture',    unit: '%',   defaultFrom: 0,     defaultTo: 100,  min: 0,    max: 100,  color: '#10b981' },
  { key: 'motionX',     name: 'Motion X',          unit: 'g',   defaultFrom: -2,    defaultTo: 2,    min: -2,   max: 2,    color: '#f472b6' },
  { key: 'motionY',     name: 'Motion Y',          unit: 'g',   defaultFrom: -2,    defaultTo: 2,    min: -2,   max: 2,    color: '#a78bfa' },
  { key: 'motionZ',     name: 'Motion Z',          unit: 'g',   defaultFrom: -2,    defaultTo: 2,    min: -2,   max: 2,    color: '#818cf8' },
  { key: 'proximity',   name: 'Proximity',         unit: 'cm',  defaultFrom: 2,     defaultTo: 400,  min: 2,    max: 400,  color: '#fb923c' },
  { key: 'sound',       name: 'Sound Level',       unit: 'dB',  defaultFrom: 30,    defaultTo: 120,  min: 30,   max: 120,  color: '#34d399' },
  { key: 'uv',          name: 'UV Index',          unit: 'idx', defaultFrom: 0,     defaultTo: 11,   min: 0,    max: 11,   color: '#fbbf24' },
  { key: 'co2',         name: 'CO₂ / Air Quality', unit: 'ppm', defaultFrom: 400,   defaultTo: 5000, min: 400,  max: 5000, color: '#6ee7b7' },
];

const PRESETS = [
  { name: 'Nominal Lab',      sensor: 'temperature', value: 24.5,   severity: 'neutral' },
  { name: 'Thermal Stress',   sensor: 'temperature', value: 48.0,   severity: 'warning' },
  { name: 'Gas Spike',        sensor: 'gas',         value: 850.0,  severity: 'danger' },
  { name: 'Saturated Flood',  sensor: 'soil_moisture',value: 95.0,  severity: 'cyan' },
  { name: 'Dark Cavity',      sensor: 'light',       value: 15.0,   severity: 'neutral' },
  { name: 'Micro-G Freefall', sensor: 'motionZ',     value: 0.0,    severity: 'cyan' },
  { name: 'Hard Impact',      sensor: 'motionX',     value: 1.9,    severity: 'danger' },
  { name: 'Near Obstacle',    sensor: 'proximity',   value: 5.0,    severity: 'warning' },
  { name: 'Loud Event',       sensor: 'sound',       value: 105.0,  severity: 'danger' },
  { name: 'High UV Exposure', sensor: 'uv',          value: 9.5,    severity: 'warning' },
  { name: 'CO₂ Alarm',        sensor: 'co2',         value: 2500.0, severity: 'danger' },
];

const DURATION_CHIPS = [5, 10, 30, 60];

export default function ScenarioBuilder({ onStartRamp, onStartStatic, onStopScenario, onStopAll, onInjectFault, onClearFault }) {
  const [selectedSensorRamp, setSelectedSensorRamp] = useState('temperature');
  const [fromVal, setFromVal] = useState(0);
  const [toVal, setToVal] = useState(50);
  const [duration, setDuration] = useState(10);
  const [isRampActive, setIsRampActive] = useState(false);
  const [rampProgress, setRampProgress] = useState(0);

  // Static Panel State
  const [selectedSensorStatic, setSelectedSensorStatic] = useState('temperature');
  const [targetStaticVal, setTargetStaticVal] = useState(25);
  const [isStaticActive, setIsStaticActive] = useState(false);
  const [activeChipAnim, setActiveChipAnim] = useState(null);

  // Flash sync state on stop all
  const [syncStopFlash, setSyncStopFlash] = useState(false);

  // SVG Scrubbing State
  const [scrubPosition, setScrubPosition] = useState(null); // x: 0 to 1
  const svgRef = useRef(null);

  // Smoothed Static Output Value Display
  const smoothedStaticDisplay = useSmoothedValue(targetStaticVal, { duration: 260, decimals: 1, isActive: true });

  const currentRampMeta = SENSORS.find(s => s.key === selectedSensorRamp) || SENSORS[0];
  const currentStaticMeta = SENSORS.find(s => s.key === selectedSensorStatic) || SENSORS[0];

  // Animate Ramp progress bar & tracer pip when active
  useEffect(() => {
    let animId;
    if (isRampActive) {
      const startTime = performance.now();
      const totalMs = duration * 1000;

      const updateProgress = (now) => {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / totalMs, 1);
        setRampProgress(progress);

        if (progress < 1) {
          animId = requestAnimationFrame(updateProgress);
        } else {
          setIsRampActive(false);
          setRampProgress(0);
        }
      };

      animId = requestAnimationFrame(updateProgress);
    } else {
      setRampProgress(0);
    }

    return () => {
      if (animId) cancelAnimationFrame(animId);
    };
  }, [isRampActive, duration]);

  const handleStartRampClick = () => {
    setIsRampActive(true);
    onStartRamp(selectedSensorRamp, fromVal, toVal, duration);
  };

  const handleStopRampClick = () => {
    setIsRampActive(false);
    onStopScenario(selectedSensorRamp);
  };

  const handleStartStaticClick = () => {
    setIsStaticActive(true);
    onStartStatic(selectedSensorStatic, targetStaticVal);
  };

  const handleStopStaticClick = () => {
    setIsStaticActive(false);
    onStopScenario(selectedSensorStatic);
  };

  const handleGlobalStop = () => {
    setSyncStopFlash(true);
    setIsRampActive(false);
    setIsStaticActive(false);
    onStopAll();
    setTimeout(() => setSyncStopFlash(false), 300);
  };

  const handlePresetSelect = (preset, index) => {
    setActiveChipAnim(`preset-${index}`);
    setTimeout(() => setActiveChipAnim(null), 250);

    setSelectedSensorStatic(preset.sensor);
    setTargetStaticVal(preset.value);
  };

  const handleDurationSelect = (d) => {
    setActiveChipAnim(`dur-${d}`);
    setTimeout(() => setActiveChipAnim(null), 250);
    setDuration(d);
  };

  // SVG Coordinate calculations
  const graphWidth = 460;
  const graphHeight = 130;
  const pad = 24;

  const y1 = graphHeight - pad - ((fromVal - currentRampMeta.min) / (currentRampMeta.max - currentRampMeta.min || 1)) * (graphHeight - pad * 2);
  const y2 = graphHeight - pad - ((toVal - currentRampMeta.min) / (currentRampMeta.max - currentRampMeta.min || 1)) * (graphHeight - pad * 2);

  // SVG tracer pip position
  const activeT = isRampActive ? rampProgress : (scrubPosition !== null ? scrubPosition : null);
  const pipX = activeT !== null ? pad + activeT * (graphWidth - pad * 2) : null;
  const pipY = activeT !== null ? y1 + activeT * (y2 - y1) : null;
  const pipValue = activeT !== null ? fromVal + activeT * (toVal - fromVal) : null;

  // Handle cursor scrubbing over SVG
  const handleMouseMoveGraph = (e) => {
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const innerX = Math.max(pad, Math.min(graphWidth - pad, (clientX / rect.width) * graphWidth));
    const ratio = (innerX - pad) / (graphWidth - pad * 2);
    setScrubPosition(ratio);
  };

  const handleMouseLeaveGraph = () => {
    setScrubPosition(null);
  };

  const slope = duration > 0 ? ((toVal - fromVal) / duration).toFixed(2) : 0;

  return (
    <div className="tab-content-enter" style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>

      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: '700' }}>Scenario Engine & Waveform Generator</h2>
            <Badge variant="neutral">DUAL GENERATORS</Badge>
          </div>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            Program non-blocking RAMP linear sweeps and high-precision DC STATIC setpoints on live hardware pins.
          </p>
        </div>

        <button
          className="btn-secondary"
          style={{
            borderColor: 'rgba(239, 68, 68, 0.4)',
            color: '#fca5a5',
            gap: '8px',
          }}
          onClick={handleGlobalStop}
        >
          <AlertOctagon size={16} />
          <span>STOP ALL ENGINES</span>
        </button>
      </div>

      {/* Synchronized Flash Alert when Global Stop triggered */}
      {syncStopFlash && (
        <div
          className="banner-enter"
          style={{
            background: 'rgba(239, 68, 68, 0.25)',
            border: '1px solid #ef4444',
            color: '#fff',
            padding: '10px 16px',
            borderRadius: 'var(--radius-sm)',
            fontSize: '12px',
            fontFamily: 'var(--font-mono)',
            textAlign: 'center',
            letterSpacing: '0.04em',
          }}
        >
          ⚡ ALL TRANSDUCER ENGINES FLUSHED TO IDLE
        </div>
      )}

      {/* Dual Generator Panels Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '20px' }}>

        {/* ── 1. RAMP Scenario Panel ── */}
        <div
          className="interactive-card"
          style={{
            background: 'var(--bg-card)',
            border: `1px solid ${isRampActive ? 'rgba(56, 189, 248, 0.4)' : 'var(--border-color)'}`,
            borderRadius: 'var(--radius-lg)',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '18px',
          }}
        >
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <TrendingUp size={18} color="var(--color-cyan)" />
              <h3 style={{ fontSize: '15px', fontWeight: '700' }}>RAMP Scenario Sweep</h3>
            </div>
            <Badge
              variant={isRampActive ? 'active-pulse' : 'neutral'}
              dot
              pulse={isRampActive}
            >
              {isRampActive ? 'SWEEPING' : 'IDLE'}
            </Badge>
          </div>

          {/* Waveform Vector Preview Graph (SVG with Cursor-Scrubbing) */}
          <div
            style={{
              background: 'rgba(0,0,0,0.4)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: '12px 14px',
              position: 'relative',
              cursor: 'crosshair',
              overflow: 'hidden',
            }}
            onMouseMove={handleMouseMoveGraph}
            onMouseLeave={handleMouseLeaveGraph}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-dim)', marginBottom: '4px' }}>
              <span>SLOPE: {slope} {currentRampMeta.unit}/s</span>
              <span>DUR: {duration}s</span>
              {pipValue !== null && (
                <span style={{ color: 'var(--color-cyan)', fontWeight: '700' }}>
                  INSPECT: {pipValue.toFixed(1)} {currentRampMeta.unit}
                </span>
              )}
            </div>

            <svg
              ref={svgRef}
              viewBox={`0 0 ${graphWidth} ${graphHeight}`}
              style={{ width: '100%', height: '110px', display: 'block' }}
            >
              <defs>
                <linearGradient id="rampGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#2563eb" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.9" />
                </linearGradient>
                <linearGradient id="rampAreaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#2563eb" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Grid lines */}
              <line x1={pad} y1={pad} x2={graphWidth - pad} y2={pad} stroke="rgba(255,255,255,0.05)" strokeDasharray="3 3" />
              <line x1={pad} y1={graphHeight / 2} x2={graphWidth - pad} y2={graphHeight / 2} stroke="rgba(255,255,255,0.05)" strokeDasharray="3 3" />
              <line x1={pad} y1={graphHeight - pad} x2={graphWidth - pad} y2={graphHeight - pad} stroke="rgba(255,255,255,0.05)" strokeDasharray="3 3" />

              {/* Polygon Area under curve with smooth transition */}
              <polygon
                points={`${pad},${graphHeight - pad} ${pad},${y1} ${graphWidth - pad},${y2} ${graphWidth - pad},${graphHeight - pad}`}
                fill="url(#rampAreaGradient)"
                style={{ transition: 'all var(--motion-standard)' }}
              />

              {/* Main Vector Slope Line */}
              <line
                x1={pad}
                y1={y1}
                x2={graphWidth - pad}
                y2={y2}
                stroke="url(#rampGradient)"
                strokeWidth="3"
                strokeLinecap="round"
                style={{ transition: 'all var(--motion-standard)' }}
              />

              {/* Anchor Circles */}
              <circle cx={pad} cy={y1} r="4" fill="#2563eb" stroke="#fff" strokeWidth="1.5" />
              <circle cx={graphWidth - pad} cy={y2} r="4" fill="#38bdf8" stroke="#fff" strokeWidth="1.5" />

              {/* Tracer Pip (cursor-scrubbing or live sweep tracking) */}
              {pipX !== null && pipY !== null && (
                <g>
                  <circle cx={pipX} cy={pipY} r="7" fill="var(--color-cyan)" opacity="0.4" className="badge-dot-pulse" />
                  <circle cx={pipX} cy={pipY} r="4" fill="#fff" stroke="var(--color-cyan)" strokeWidth="2" />
                  <line x1={pipX} y1={pad} x2={pipX} y2={graphHeight - pad} stroke="rgba(56, 189, 248, 0.4)" strokeDasharray="2 2" />
                </g>
              )}
            </svg>
          </div>

          {/* Form Controls */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>
                Target Channel
              </label>
              <select
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  background: 'rgba(0,0,0,0.3)',
                  border: '1px solid var(--border-color)',
                  color: '#fff',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '13px',
                }}
                value={selectedSensorRamp}
                onChange={(e) => {
                  setSelectedSensorRamp(e.target.value);
                  const meta = SENSORS.find(s => s.key === e.target.value);
                  if (meta) {
                    setFromVal(meta.defaultFrom);
                    setToVal(meta.defaultTo);
                  }
                }}
              >
                {SENSORS.map(s => <option key={s.key} value={s.key}>{s.name} ({s.unit})</option>)}
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px', fontFamily: 'var(--font-mono)' }}>
                  START ({currentRampMeta.unit})
                </label>
                <input
                  type="number"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    background: 'rgba(0,0,0,0.3)',
                    border: '1px solid var(--border-color)',
                    color: '#fff',
                    borderRadius: 'var(--radius-sm)',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '13px',
                  }}
                  value={fromVal}
                  onChange={(e) => setFromVal(parseFloat(e.target.value) || 0)}
                />
              </div>

              <div>
                <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px', fontFamily: 'var(--font-mono)' }}>
                  TARGET ({currentRampMeta.unit})
                </label>
                <input
                  type="number"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    background: 'rgba(0,0,0,0.3)',
                    border: '1px solid var(--border-color)',
                    color: '#fff',
                    borderRadius: 'var(--radius-sm)',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '13px',
                  }}
                  value={toVal}
                  onChange={(e) => setToVal(parseFloat(e.target.value) || 0)}
                />
              </div>
            </div>

            {/* Duration Input & Quick Duration Chips */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <label style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>
                  Sweep Duration: {duration}s
                </label>
                <div style={{ display: 'flex', gap: '6px' }}>
                  {DURATION_CHIPS.map(d => {
                    const isActive = duration === d;
                    const isBouncing = activeChipAnim === `dur-${d}`;
                    return (
                      <button
                        key={d}
                        type="button"
                        className={isBouncing ? 'chip-scale-bounce' : ''}
                        onClick={() => handleDurationSelect(d)}
                        style={{
                          padding: '3px 8px',
                          borderRadius: 'var(--radius-sm)',
                          fontSize: '11px',
                          fontFamily: 'var(--font-mono)',
                          border: isActive ? '1px solid var(--color-primary)' : '1px solid var(--border-subtle)',
                          background: isActive ? 'var(--color-primary)' : 'rgba(255,255,255,0.04)',
                          color: isActive ? '#fff' : 'var(--text-dim)',
                          cursor: 'pointer',
                        }}
                      >
                        {d}s
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
              <button
                className="btn-primary"
                style={{ flex: 1 }}
                onClick={handleStartRampClick}
                disabled={isRampActive}
              >
                <Play size={14} />
                <span>START RAMP</span>
              </button>
              <button
                className="btn-secondary"
                onClick={handleStopRampClick}
                disabled={!isRampActive}
              >
                <Square size={14} />
                <span>STOP</span>
              </button>
            </div>
          </div>

          {/* Telemetry Footer */}
          <div
            style={{
              marginTop: 'auto',
              paddingTop: '10px',
              borderTop: '1px solid var(--border-subtle)',
              display: 'flex',
              justifyContent: 'space-between',
              fontFamily: 'var(--font-mono)',
              fontSize: '11px',
              color: 'var(--text-dim)',
            }}
          >
            <span>
              {isRampActive ? 'Ramp Generating Active Sweep' : 'Ramp Generator Standby'}
            </span>
            <span style={{ color: isRampActive ? 'var(--color-cyan)' : 'inherit' }}>
              ENGINE ID: SWP_A
            </span>
          </div>
        </div>

        {/* ── 2. STATIC Scenario Panel ── */}
        <div
          className="interactive-card"
          style={{
            background: 'var(--bg-card)',
            border: `1px solid ${isStaticActive ? 'rgba(56, 189, 248, 0.4)' : 'var(--border-color)'}`,
            borderRadius: 'var(--radius-lg)',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '18px',
          }}
        >
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Zap size={18} color="var(--color-cyan)" />
              <h3 style={{ fontSize: '15px', fontWeight: '700' }}>STATIC DC Setpoint</h3>
            </div>
            <Badge
              variant={isStaticActive ? 'active-pulse' : 'neutral'}
              dot
              pulse={isStaticActive}
            >
              {isStaticActive ? 'LATCHED' : 'IDLE'}
            </Badge>
          </div>

          {/* Large Fixed Value Readout with motion-value easing */}
          <div
            style={{
              background: 'rgba(0,0,0,0.4)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: '16px 20px',
              display: 'flex',
              alignItems: 'baseline',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-dim)', display: 'block' }}>
                HOLDING VOLTAGE / DUTY:
              </span>
              <div style={{ fontSize: '36px', fontWeight: '700', color: currentStaticMeta.color, fontFamily: 'var(--font-sans)', letterSpacing: '-0.5px' }}>
                {smoothedStaticDisplay.toFixed(1)}{' '}
                <span style={{ fontSize: '16px', color: 'var(--text-muted)' }}>{currentStaticMeta.unit}</span>
              </div>
            </div>
            <Badge variant={isStaticActive ? 'success' : 'neutral'} size="sm">
              {isStaticActive ? 'DAC LOCK 100%' : 'FLOATING'}
            </Badge>
          </div>

          {/* Form Controls */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>
                Target Transducer
              </label>
              <select
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  background: 'rgba(0,0,0,0.3)',
                  border: '1px solid var(--border-color)',
                  color: '#fff',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '13px',
                }}
                value={selectedSensorStatic}
                onChange={(e) => {
                  setSelectedSensorStatic(e.target.value);
                  const meta = SENSORS.find(s => s.key === e.target.value);
                  if (meta) {
                    setTargetStaticVal(meta.defaultFrom + (meta.defaultTo - meta.defaultFrom) / 2);
                  }
                }}
              >
                {SENSORS.map(s => <option key={s.key} value={s.key}>{s.name} ({s.unit})</option>)}
              </select>
            </div>

            {/* Slider with smooth response */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-dim)', marginBottom: '6px' }}>
                <span>MIN: {currentStaticMeta.min} {currentStaticMeta.unit}</span>
                <span>MAX: {currentStaticMeta.max} {currentStaticMeta.unit}</span>
              </div>
              <input
                type="range"
                min={currentStaticMeta.min}
                max={currentStaticMeta.max}
                step={currentStaticMeta.max > 100 ? 5 : 0.5}
                value={targetStaticVal}
                onChange={(e) => setTargetStaticVal(parseFloat(e.target.value))}
              />
            </div>

            {/* Quick Scenario Preset Chips */}
            <div>
              <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '6px', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>
                Lab Scenario Presets:
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {PRESETS.map((p, idx) => {
                  const isBouncing = activeChipAnim === `preset-${idx}`;
                  const isCurrent = targetStaticVal === p.value && selectedSensorStatic === p.sensor;

                  let border = 'var(--border-subtle)';
                  let color = 'var(--text-muted)';
                  if (p.severity === 'warning') color = '#fbbf24';
                  if (p.severity === 'danger') color = '#f87171';
                  if (p.severity === 'cyan') color = '#38bdf8';

                  return (
                    <button
                      key={p.name}
                      type="button"
                      className={isBouncing ? 'chip-scale-bounce' : ''}
                      onClick={() => handlePresetSelect(p, idx)}
                      style={{
                        padding: '4px 10px',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '11px',
                        fontFamily: 'var(--font-mono)',
                        border: isCurrent ? '1px solid var(--color-cyan)' : `1px solid ${border}`,
                        background: isCurrent ? 'rgba(56, 189, 248, 0.15)' : 'rgba(255,255,255,0.04)',
                        color: isCurrent ? '#fff' : color,
                        cursor: 'pointer',
                      }}
                    >
                      {p.name}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
              <button
                className="btn-primary"
                style={{ flex: 1, background: 'var(--color-primary)' }}
                onClick={handleStartStaticClick}
              >
                <Zap size={14} />
                <span>APPLY STATIC TARGET</span>
              </button>
              <button
                className="btn-secondary"
                onClick={handleStopStaticClick}
                disabled={!isStaticActive}
              >
                <Square size={14} />
                <span>STOP</span>
              </button>
            </div>
          </div>

          {/* Telemetry Footer */}
          <div
            style={{
              marginTop: 'auto',
              paddingTop: '10px',
              borderTop: '1px solid var(--border-subtle)',
              display: 'flex',
              justifyContent: 'space-between',
              fontFamily: 'var(--font-mono)',
              fontSize: '11px',
              color: 'var(--text-dim)',
            }}
          >
            <span>
              {isStaticActive
                ? `Holding DC Output @ ${smoothedStaticDisplay.toFixed(1)} ${currentStaticMeta.unit}`
                : 'DC Output Latch Released'}
            </span>
            <span style={{ color: isStaticActive ? 'var(--color-cyan)' : 'inherit' }}>
              ENGINE ID: DC_FIXED
            </span>
          </div>
        </div>

      </div>

    </div>
  );
}
