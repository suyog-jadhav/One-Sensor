import React, { useState, useEffect, useRef } from 'react';
import { Play, Square, Activity, Sliders, Zap, TrendingUp, RotateCcw, Clock, Layers } from 'lucide-react';

const SENSORS = [
  { key: 'temperature',   name: 'CH01 Temperature',      unit: '°C',  min: 0,   max: 50,   defaultOffset: 25, defaultAmp: 10 },
  { key: 'humidity',      name: 'CH02 Humidity',          unit: '%',   min: 0,   max: 100,  defaultOffset: 50, defaultAmp: 25 },
  { key: 'gas',           name: 'CH03 Gas Concentration', unit: 'ppm', min: 0,   max: 1000, defaultOffset: 300, defaultAmp: 200 },
  { key: 'light',         name: 'CH04 Light Intensity',   unit: 'lux', min: 0,   max: 2000, defaultOffset: 650, defaultAmp: 400 },
  { key: 'soil',          name: 'CH05 Soil Moisture',     unit: '%',   min: 0,   max: 100,  defaultOffset: 45, defaultAmp: 20 },
  { key: 'proximity',     name: 'CH06 Proximity',         unit: 'cm',  min: 2,   max: 400,  defaultOffset: 50, defaultAmp: 30 },
  { key: 'sound',         name: 'CH07 Sound Level',       unit: 'dB',  min: 30,  max: 120,  defaultOffset: 60, defaultAmp: 25 },
  { key: 'uv',            name: 'CH08 UV Index',          unit: 'UVI', min: 0,   max: 12,   defaultOffset: 5, defaultAmp: 3 },
  { key: 'co2',           name: 'CH09 CO₂ Air Quality',   unit: 'ppm', min: 400, max: 5000, defaultOffset: 800, defaultAmp: 500 },
  { key: 'motionX',       name: 'CH10 Motion X',          unit: 'g',   min: -2,  max: 2,    defaultOffset: 0, defaultAmp: 1 },
  { key: 'motionY',       name: 'CH11 Motion Y',          unit: 'g',   min: -2,  max: 2,    defaultOffset: 0, defaultAmp: 1 },
  { key: 'motionZ',       name: 'CH12 Motion Z',          unit: 'g',   min: -2,  max: 2,    defaultOffset: 1, defaultAmp: 0.5 },
];

const PRESETS = [
  {
    name: 'Room Temperature Cycle',
    desc: 'Sinusoidal thermal oscillation 20°C → 30°C → 20°C',
    sensor: 'temperature',
    waveform: 'sine',
    offset: 25,
    amplitude: 8,
    duration: 30,
    frequency: 0.1
  },
  {
    name: 'Gas Leak Rapid Spike',
    desc: 'Nominal baseline → sharp rise to 750 ppm → gradual decay',
    sensor: 'gas',
    waveform: 'ramp',
    offset: 300,
    amplitude: 500,
    duration: 20,
    frequency: 0.05
  },
  {
    name: 'Brightness Transition',
    desc: 'Dawn low-light (80 lux) → bright daylight (1200 lux) ramp',
    sensor: 'light',
    waveform: 'triangle',
    offset: 650,
    amplitude: 500,
    duration: 25,
    frequency: 0.08
  },
  {
    name: 'Soil Drying Cycle',
    desc: 'Simulates evaporation from saturated 75% down to 25%',
    sensor: 'soil',
    waveform: 'ramp',
    offset: 50,
    amplitude: -25,
    duration: 40,
    frequency: 0.04
  },
  {
    name: 'Inertial Motion Burst',
    desc: 'High-frequency vibration impulse on X-axis (±1.5g)',
    sensor: 'motionX',
    waveform: 'square',
    offset: 0,
    amplitude: 1.5,
    duration: 15,
    frequency: 0.4
  }
];

export default function ScenarioBuilder({
  onStartRamp,
  onStartStatic,
  onStopScenario,
  onStopAll
}) {
  const [selectedSensor, setSelectedSensor] = useState('temperature');
  const [waveform, setWaveform] = useState('sine');
  const [offset, setOffset] = useState(25);
  const [amplitude, setAmplitude] = useState(8);
  const [frequency, setFrequency] = useState(0.2);
  const [duration, setDuration] = useState(30);
  const [noisePercent, setNoisePercent] = useState(2);
  const [isRunning, setIsRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);

  const canvasRef = useRef(null);
  const currentSensor = SENSORS.find(s => s.key === selectedSensor) || SENSORS[0];

  const applyPreset = (preset) => {
    setSelectedSensor(preset.sensor);
    setWaveform(preset.waveform);
    setOffset(preset.offset);
    setAmplitude(preset.amplitude);
    setDuration(preset.duration);
    setFrequency(preset.frequency);
  };

  const handleStart = () => {
    setIsRunning(true);
    setElapsed(0);
    const fromVal = offset - amplitude;
    const toVal = offset + amplitude;
    onStartRamp(selectedSensor, fromVal, toVal, duration);
  };

  const handleStop = () => {
    setIsRunning(false);
    onStopScenario(selectedSensor);
  };

  // Timer loop when running
  useEffect(() => {
    if (!isRunning) return;
    const interval = setInterval(() => {
      setElapsed(prev => {
        if (prev >= duration) {
          setIsRunning(false);
          return duration;
        }
        return prev + 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isRunning, duration]);

  // Waveform Preview Generator (§21)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;

    // Light-grey plotting surface matching slate engineering tokens
    ctx.fillStyle = '#F4F7FA';
    ctx.fillRect(0, 0, w, h);

    // Subtle grid lines
    ctx.strokeStyle = '#DCE4EC';
    ctx.lineWidth = 1;
    for (let x = 0; x < w; x += 50) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = 0; y < h; y += 30) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    // Midline baseline
    ctx.strokeStyle = '#CBD5E1';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, h / 2);
    ctx.lineTo(w, h / 2);
    ctx.stroke();

    // Draw synthesized mathematical waveform with violet accent (#8B7AE8)
    ctx.beginPath();
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = '#8B7AE8';

    const points = [];
    for (let x = 0; x < w; x++) {
      const tNorm = (x / w) * duration;
      let yVal = 0;

      if (waveform === 'sine') {
        yVal = Math.sin(tNorm * frequency * Math.PI * 2);
      } else if (waveform === 'square') {
        yVal = Math.sin(tNorm * frequency * Math.PI * 2) >= 0 ? 1 : -1;
      } else if (waveform === 'triangle') {
        const period = 1 / frequency;
        const phase = (tNorm % period) / period;
        yVal = phase < 0.5 ? (phase * 4 - 1) : ((1 - phase) * 4 - 1);
      } else if (waveform === 'ramp') {
        const period = 1 / frequency;
        yVal = ((tNorm % period) / period) * 2 - 1;
      } else if (waveform === 'constant') {
        yVal = 0;
      }

      // Add noise jitter
      const noise = ((Math.random() - 0.5) * (noisePercent / 100)) * 2;
      yVal += noise;

      // Scale to canvas height
      const yPixel = (h / 2) - (yVal * (h / 3));
      points.push({ x, y: yPixel });
    }

    for (let i = 0; i < points.length; i++) {
      if (i === 0) ctx.moveTo(points[i].x, points[i].y);
      else ctx.lineTo(points[i].x, points[i].y);
    }
    ctx.stroke();

    // Progress line if running
    if (isRunning && duration > 0) {
      const progressX = (elapsed / duration) * w;
      ctx.strokeStyle = '#15966A';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(progressX, 0);
      ctx.lineTo(progressX, h);
      ctx.stroke();
    }
  }, [waveform, offset, amplitude, frequency, duration, noisePercent, isRunning, elapsed]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* ── Top Header (§21) ── */}
      <div className="panel-card scenario-header-panel" style={{ padding: '16px 20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontFamily: 'var(--font-mono)',
              fontSize: '11px',
              color: 'var(--accent-amber)',
              marginBottom: '4px'
            }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--accent-amber)' }} />
              SIGNAL GENERATOR & WAVEFORM SYNTHESIZER
            </div>
            <h2 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)' }}>
              Scenario Builder & Automated Signal Generation
            </h2>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
              Generate mathematical sensor profiles (Sine, Square, Triangle, Ramp) and test physical response over real-time hardware telemetry.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="btn-secondary" onClick={onStopAll}>
              <RotateCcw size={13} />
              <span>Halt All Scenarios</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── Main 2-Column Split: Signal Parameters + Live Graph Preview (§21) ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '5fr 7fr', gap: '20px' }}>
        {/* Left Column: Signal Synthesis Parameters */}
        <div className="panel-card scenario-config-panel" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="panel-header">
            <div className="panel-title">
              <Sliders size={15} color="var(--accent-amber)" />
              <span>Signal Configuration</span>
            </div>
            {isRunning && (
              <span className="badge-tag healthy">RUNNING ({elapsed}s / {duration}s)</span>
            )}
          </div>

          {/* 1. Target Sensor */}
          <div>
            <label style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
              TARGET TRANSDUCER
            </label>
            <select
              value={selectedSensor}
              onChange={e => {
                const s = SENSORS.find(x => x.key === e.target.value);
                setSelectedSensor(e.target.value);
                if (s) {
                  setOffset(s.defaultOffset);
                  setAmplitude(s.defaultAmp);
                }
              }}
              style={{
                width: '100%',
                backgroundColor: 'var(--bg-deep)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-sm)',
                padding: '8px 10px',
                fontSize: '13px',
                fontFamily: 'var(--font-sans)',
                outline: 'none'
              }}
            >
              {SENSORS.map(s => (
                <option key={s.key} value={s.key}>
                  {s.name} ({s.min} – {s.max} {s.unit})
                </option>
              ))}
            </select>
          </div>

          {/* 2. Waveform Selector */}
          <div>
            <label style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
              WAVEFORM SYNTHESIS MODEL
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' }}>
              {['sine', 'square', 'triangle', 'ramp'].map(w => (
                <button
                  key={w}
                  onClick={() => setWaveform(w)}
                  style={{
                    padding: '8px 0',
                    textAlign: 'center',
                    borderRadius: 'var(--radius-sm)',
                    background: waveform === w ? 'var(--surface-raised)' : 'var(--bg-deep)',
                    border: waveform === w ? '1px solid var(--accent-amber)' : '1px solid var(--border-soft)',
                    color: waveform === w ? 'var(--accent-amber)' : 'var(--text-secondary)',
                    fontSize: '11px',
                    fontFamily: 'var(--font-mono)',
                    fontWeight: waveform === w ? 600 : 400,
                    cursor: 'pointer',
                    textTransform: 'uppercase'
                  }}
                >
                  {w}
                </button>
              ))}
            </div>
          </div>

          {/* 3. Parameter Sliders */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Baseline Center Offset:</span>
                <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-amber)', fontWeight: 600 }}>
                  {offset} {currentSensor.unit}
                </span>
              </div>
              <input
                type="range"
                min={currentSensor.min}
                max={currentSensor.max}
                value={offset}
                onChange={e => setOffset(Number(e.target.value))}
                style={{ width: '100%', accentColor: 'var(--accent-amber)' }}
              />
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Oscillation Amplitude:</span>
                <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-teal)' }}>
                  ±{amplitude} {currentSensor.unit}
                </span>
              </div>
              <input
                type="range"
                min="1"
                max={Math.max(10, Math.floor((currentSensor.max - currentSensor.min) / 2))}
                value={amplitude}
                onChange={e => setAmplitude(Number(e.target.value))}
                style={{ width: '100%', accentColor: 'var(--accent-teal)' }}
              />
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Frequency:</span>
                <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>
                  {frequency} Hz (Period: {(1 / frequency).toFixed(1)}s)
                </span>
              </div>
              <input
                type="range"
                min="0.05"
                max="1.0"
                step="0.05"
                value={frequency}
                onChange={e => setFrequency(Number(e.target.value))}
                style={{ width: '100%', accentColor: 'var(--text-primary)' }}
              />
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Session Duration:</span>
                <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-amber)' }}>
                  {duration} seconds
                </span>
              </div>
              <input
                type="range"
                min="5"
                max="120"
                step="5"
                value={duration}
                onChange={e => setDuration(Number(e.target.value))}
                style={{ width: '100%', accentColor: 'var(--accent-amber)' }}
              />
            </div>
          </div>

          {/* Action Triggers */}
          <div style={{ display: 'flex', gap: '10px', marginTop: 'auto', paddingTop: '10px' }}>
            {isRunning ? (
              <button
                className="btn-danger"
                onClick={handleStop}
                style={{ flex: 1, justifyContent: 'center' }}
              >
                <Square size={14} fill="currentColor" />
                <span>Stop Scenario</span>
              </button>
            ) : (
              <button
                className="btn-primary"
                onClick={handleStart}
                style={{ flex: 1, justifyContent: 'center' }}
              >
                <Play size={14} fill="currentColor" />
                <span>Execute Scenario</span>
              </button>
            )}
          </div>
        </div>

        {/* Right Column: Waveform Preview & Presets (§21, §22) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Waveform Preview Canvas */}
          <div className="panel-card" style={{ display: 'flex', flexDirection: 'column' }}>
            <div className="panel-header">
              <div className="panel-title">
                <TrendingUp size={15} color="var(--accent-amber)" />
                <span>Synthesized Signal Waveform Preview</span>
              </div>
              <div style={{ display: 'flex', gap: '12px', fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                <span>MIN: <strong style={{ color: 'var(--text-primary)' }}>{(offset - amplitude).toFixed(1)} {currentSensor.unit}</strong></span>
                <span>MAX: <strong style={{ color: 'var(--text-primary)' }}>{(offset + amplitude).toFixed(1)} {currentSensor.unit}</strong></span>
                <span>MEAN: <strong style={{ color: 'var(--accent-amber)' }}>{offset.toFixed(1)} {currentSensor.unit}</strong></span>
              </div>
            </div>

            <div className="oscilloscope-box" style={{ height: '220px' }}>
              <canvas
                ref={canvasRef}
                width={620}
                height={220}
                style={{ width: '100%', height: '100%', display: 'block' }}
              />
            </div>
          </div>

          {/* One-Click Presets Grid (§22) */}
          <div className="panel-card scenario-presets-panel">
            <div className="panel-header">
              <div className="panel-title">
                <Layers size={15} color="var(--accent-teal)" />
                <span>One-Click Engineering Test Presets</span>
              </div>
              <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                5 Presets Available
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {PRESETS.map((p, idx) => (
                <div
                  key={idx}
                  onClick={() => applyPreset(p)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 12px',
                    background: 'var(--bg-deep)',
                    border: '1px solid var(--border-soft)',
                    borderRadius: 'var(--radius-sm)',
                    cursor: 'pointer',
                    transition: 'all var(--motion-fast)'
                  }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent-amber)'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-soft)'}
                >
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {p.name}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                      {p.desc}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span className="badge-tag neutral">{p.waveform.toUpperCase()}</span>
                    <button
                      className="btn-secondary"
                      onClick={(e) => {
                        e.stopPropagation();
                        applyPreset(p);
                        handleStart();
                      }}
                      style={{ padding: '3px 8px', fontSize: '11px' }}
                    >
                      <Play size={10} fill="currentColor" />
                      <span>Run</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
