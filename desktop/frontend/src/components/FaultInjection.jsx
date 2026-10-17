import React, { useState, useEffect, useRef } from 'react';
import {
  Zap,
  RotateCcw,
  AlertTriangle,
  ShieldOff,
  Check,
  Pause,
  Pin,
  Activity,
  TrendingUp,
  Unplug,
  Clock,
  CheckCircle,
  Play
} from 'lucide-react';

const SENSORS = [
  { key: 'temperature',   name: 'CH01 Temperature',      unit: '°C',   gpio: 'GPIO 34', baseline: 25 },
  { key: 'humidity',      name: 'CH02 Humidity',          unit: '%',    gpio: 'GPIO 35', baseline: 50 },
  { key: 'gas',           name: 'CH03 Gas (MQ-2)',        unit: 'ppm',  gpio: 'GPIO 32', baseline: 300 },
  { key: 'light',         name: 'CH04 Light (LDR)',       unit: 'lux',  gpio: 'GPIO 33', baseline: 600 },
  { key: 'soil',          name: 'CH05 Soil Moisture',     unit: '%',    gpio: 'GPIO 25', baseline: 45 },
  { key: 'proximity',     name: 'CH06 Proximity',         unit: 'cm',   gpio: 'GPIO 26', baseline: 30 },
  { key: 'sound',         name: 'CH07 Sound Level',       unit: 'dB',   gpio: 'GPIO 27', baseline: 55 },
  { key: 'uv',            name: 'CH08 UV Index',          unit: 'UVI',  gpio: 'GPIO 14', baseline: 4 },
  { key: 'co2',           name: 'CH09 CO₂ Air Quality',   unit: 'ppm',  gpio: 'GPIO 12', baseline: 450 },
  { key: 'motionX',       name: 'CH10 Motion X',          unit: 'g',    gpio: 'GPIO 21', baseline: 0 },
  { key: 'motionY',       name: 'CH11 Motion Y',          unit: 'g',    gpio: 'GPIO 21', baseline: 0 },
  { key: 'motionZ',       name: 'CH12 Motion Z',          unit: 'g',    gpio: 'GPIO 22', baseline: 1 },
];

const FAULT_DEFS = [
  { type: 'spike',      label: 'Spike',      icon: Zap,        desc: 'Instantaneous high-amplitude transient spike excursion.' },
  { type: 'noise',      label: 'Noise',      icon: Activity,   desc: 'Gaussian jitter variance added to signal stream.' },
  { type: 'dropout',    label: 'Dropout',    icon: Pause,      desc: 'Freezes or drops ADC packets simulating bus stall.' },
  { type: 'stuck',      label: 'Stuck',      icon: Pin,        desc: 'Pins output to fixed saturated level regardless of physical stimulus.' },
  { type: 'drift',      label: 'Drift',      icon: TrendingUp, desc: 'Gradual linear bias accumulating over time.' },
  { type: 'disconnect', label: 'Disconnect', icon: Unplug,     desc: 'Drives output to zero simulating cable disconnect / open-circuit.' },
  { type: 'latency',    label: 'Latency',    icon: Clock,      desc: 'Injects delayed buffer replay simulating packet congestion.' },
];

export default function FaultInjection({ onInjectFault, onClearFault }) {
  const [selectedSensor, setSelectedSensor] = useState('temperature');
  const [faultType, setFaultType] = useState('spike');
  const [magnitude, setMagnitude] = useState(15);
  const [durationMs, setDurationMs] = useState(4000);
  const [latencyMs, setLatencyMs] = useState(450);
  const [activeFaultState, setActiveFaultState] = useState(null);

  // Timeline events (§20)
  const [timelineEvents, setTimelineEvents] = useState([
    { id: 1, ts: '10:41:52', type: 'info', text: 'All transducer channels calibrated & healthy' },
    { id: 2, ts: '10:42:05', type: 'info', text: 'Nominal telemetry verified at 10 Hz' },
  ]);

  // Real-time oscilloscope canvas
  const canvasRef = useRef(null);
  const historyRef = useRef([]);

  const currentSensorObj = SENSORS.find(s => s.key === selectedSensor) || SENSORS[0];

  const handleInject = () => {
    onInjectFault(selectedSensor, faultType, magnitude, durationMs, faultType === 'latency' ? latencyMs : 0);
    setActiveFaultState({
      sensor: selectedSensor,
      type: faultType,
      magnitude,
      startedAt: Date.now()
    });

    const now = new Date().toLocaleTimeString();
    setTimelineEvents(prev => [
      { id: Date.now(), ts: now, type: 'fault', text: `FAULT INJECTED: [${faultType.toUpperCase()}] on ${currentSensorObj.name} (Mag: ${magnitude}${currentSensorObj.unit})` },
      { id: Date.now() + 1, ts: now, type: 'warning', text: `Telemetry variance threshold exceeded on ${currentSensorObj.gpio}` },
      ...prev.slice(0, 20)
    ]);
  };

  const handleRecover = () => {
    onClearFault(selectedSensor);
    setActiveFaultState(null);

    const now = new Date().toLocaleTimeString();
    setTimelineEvents(prev => [
      { id: Date.now(), ts: now, type: 'success', text: `RECOVERY INITIATED: Channel ${currentSensorObj.name} signal cleared` },
      { id: Date.now() + 1, ts: now, type: 'info', text: `Baseline restored to nominal: ${currentSensorObj.baseline} ${currentSensorObj.unit}` },
      ...prev.slice(0, 20)
    ]);
  };

  const handleClearAll = () => {
    onClearFault('all');
    setActiveFaultState(null);
    const now = new Date().toLocaleTimeString();
    setTimelineEvents(prev => [
      { id: Date.now(), ts: now, type: 'success', text: 'ALL FAULTS PURGED: System returned to nominal state' },
      ...prev.slice(0, 20)
    ]);
  };

  // Oscilloscope Animation Frame
  useEffect(() => {
    let animationFrameId;
    let t = 0;

    const render = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      const w = canvas.width;
      const h = canvas.height;

      // Base sine oscillation
      let val = Math.sin(t * 0.05) * 8;

      // Apply fault distortion
      if (activeFaultState && activeFaultState.sensor === selectedSensor) {
        if (faultType === 'spike') {
          if (Math.sin(t * 0.15) > 0.6) {
            val += magnitude * 1.5;
          }
        } else if (faultType === 'noise') {
          val += (Math.random() - 0.5) * magnitude * 2;
        } else if (faultType === 'stuck') {
          val = magnitude;
        } else if (faultType === 'dropout') {
          val = 0;
        } else if (faultType === 'drift') {
          val += ((t % 150) / 150) * magnitude * 2;
        } else if (faultType === 'disconnect') {
          val = -35;
        } else if (faultType === 'latency') {
          val = Math.sin((t - 25) * 0.05) * 8;
        }
      }

      t += 1;
      historyRef.current.push(val);
      if (historyRef.current.length > w) {
        historyRef.current.shift();
      }

      // Dedicated dark high-contrast oscilloscope viewport (#0F172A)
      ctx.fillStyle = '#0F172A';
      ctx.fillRect(0, 0, w, h);

      // Oscilloscope grid lines
      ctx.strokeStyle = '#1E293B';
      ctx.lineWidth = 1;
      for (let x = 0; x < w; x += 40) {
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

      // Center baseline
      ctx.strokeStyle = '#334155';
      ctx.beginPath();
      ctx.moveTo(0, h / 2);
      ctx.lineTo(w, h / 2);
      ctx.stroke();

      // Cyan #06B6D4 in nominal state, Alert Red #DC4545 during fault injection
      ctx.beginPath();
      ctx.lineWidth = 2;
      ctx.strokeStyle = activeFaultState ? '#DC4545' : '#06B6D4';

      const history = historyRef.current;
      const startX = w - history.length;

      for (let i = 0; i < history.length; i++) {
        const x = startX + i;
        const y = h / 2 - history[i];
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      animationFrameId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animationFrameId);
  }, [activeFaultState, faultType, magnitude, selectedSensor]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* ── Top Header (§18) ── */}
      <div className="panel-card fault-header-panel" style={{ padding: '16px 20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontFamily: 'var(--font-mono)',
              fontSize: '11px',
              color: 'var(--color-danger)',
              marginBottom: '4px'
            }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--color-danger)' }} />
              SIGNAL INTEGRITY TESTING
            </div>
            <h2 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)' }}>
              Fault Lab — Chaos & Degradation Engine
            </h2>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
              Inject precise physical and electrical faults into virtual sensor streams to test downstream firmware error detection and fail-safes.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="btn-secondary" onClick={handleClearAll}>
              <RotateCcw size={13} />
              <span>Purge All Faults</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── Main 2-Column Split: Controls + Live Oscilloscope (§18) ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '5fr 7fr', gap: '20px' }}>
        {/* Left Column: Fault Config Controls */}
        <div className="panel-card fault-config-panel" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="panel-header">
            <div className="panel-title">
              <ShieldOff size={15} color="var(--accent-amber)" />
              <span>Fault Parameters & Target Channel</span>
            </div>
          </div>

          {/* 1. Target Sensor Dropdown */}
          <div>
            <label style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
              TARGET TRANSDUCER CHANNEL
            </label>
            <select
              value={selectedSensor}
              onChange={e => setSelectedSensor(e.target.value)}
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
                  {s.name} ({s.gpio}) — {s.baseline} {s.unit}
                </option>
              ))}
            </select>
          </div>

          {/* 2. Fault Type Selector */}
          <div>
            <label style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
              SELECT FAULT MODEL
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '6px' }}>
              {FAULT_DEFS.map(f => {
                const Icon = f.icon;
                const isSelected = faultType === f.type;
                return (
                  <button
                    key={f.type}
                    onClick={() => setFaultType(f.type)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '8px 10px',
                      borderRadius: 'var(--radius-sm)',
                      background: isSelected ? 'var(--surface-raised)' : 'var(--bg-deep)',
                      border: isSelected ? '1px solid var(--accent-amber)' : '1px solid var(--border-soft)',
                      color: isSelected ? 'var(--accent-amber)' : 'var(--text-secondary)',
                      cursor: 'pointer',
                      textAlign: 'left',
                      fontSize: '12px',
                      fontWeight: isSelected ? 600 : 400
                    }}
                  >
                    <Icon size={14} color={isSelected ? 'var(--accent-amber)' : 'var(--text-muted)'} />
                    <span>{f.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. Magnitude & Duration Sliders */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Fault Magnitude / Deviation:</span>
                <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-amber)', fontWeight: 600 }}>
                  ±{magnitude} {currentSensorObj.unit}
                </span>
              </div>
              <input
                type="range"
                min="1"
                max="80"
                value={magnitude}
                onChange={e => setMagnitude(Number(e.target.value))}
                style={{ width: '100%', accentColor: 'var(--accent-amber)' }}
              />
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Injection Duration:</span>
                <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-teal)' }}>
                  {durationMs === 0 ? 'Persistent / Infinite' : `${durationMs} ms`}
                </span>
              </div>
              <input
                type="range"
                min="1000"
                max="10000"
                step="500"
                value={durationMs}
                onChange={e => setDurationMs(Number(e.target.value))}
                style={{ width: '100%', accentColor: 'var(--accent-teal)' }}
              />
            </div>
          </div>

          {/* Action Triggers */}
          <div style={{ display: 'flex', gap: '10px', marginTop: 'auto', paddingTop: '10px' }}>
            <button
              className="btn-primary"
              onClick={handleInject}
              style={{
                flex: 1,
                justifyContent: 'center',
                backgroundColor: 'var(--color-danger)',
                color: '#fff',
                borderColor: 'var(--color-danger)'
              }}
            >
              <Zap size={14} />
              <span>Inject Fault</span>
            </button>

            <button
              className="btn-secondary"
              onClick={handleRecover}
              style={{ flex: 1, justifyContent: 'center' }}
            >
              <CheckCircle size={14} color="var(--color-success)" />
              <span>Recover Signal</span>
            </button>
          </div>
        </div>

        {/* Right Column: Real-time Oscilloscope & Timeline (§19, §20) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Oscilloscope Panel */}
          <div className="panel-card" style={{ display: 'flex', flexDirection: 'column' }}>
            <div className="panel-header">
              <div className="panel-title">
                <Activity size={15} color="var(--accent-amber)" />
                <span>Live Signal Oscilloscope ({currentSensorObj.name})</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className={`badge-tag ${activeFaultState ? 'danger' : 'healthy'}`}>
                  {activeFaultState ? `FAULT: ${activeFaultState.type.toUpperCase()}` : 'SIGNAL HEALTHY'}
                </span>
                <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                  100 ms/div
                </span>
              </div>
            </div>

            <div className="oscilloscope-box" style={{ height: '220px' }}>
              <canvas
                ref={canvasRef}
                width={600}
                height={220}
                style={{ width: '100%', height: '100%', display: 'block' }}
              />
            </div>
          </div>

          {/* Fault Event Timeline Panel (§20) */}
          <div className="panel-card fault-timeline-panel">
            <div className="panel-header">
              <div className="panel-title">
                <Clock size={15} color="var(--accent-teal)" />
                <span>Fault Event Timeline & Diagnostics Log</span>
              </div>
              <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                {timelineEvents.length} Events Logged
              </span>
            </div>

            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
              maxHeight: '160px',
              overflowY: 'auto',
              fontFamily: 'var(--font-mono)',
              fontSize: '11px'
            }}>
              {timelineEvents.map(evt => (
                <div
                  key={evt.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '6px 8px',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: evt.type === 'fault'
                      ? 'rgba(201, 106, 98, 0.12)'
                      : evt.type === 'warning'
                      ? 'rgba(214, 168, 79, 0.12)'
                      : 'var(--surface-raised)',
                    borderLeft: evt.type === 'fault'
                      ? '2px solid var(--color-danger)'
                      : evt.type === 'warning'
                      ? '2px solid var(--accent-amber)'
                      : '2px solid var(--color-success)'
                  }}
                >
                  <span style={{ color: 'var(--text-muted)' }}>{evt.ts}</span>
                  <span style={{
                    color: evt.type === 'fault'
                      ? 'var(--color-danger)'
                      : evt.type === 'warning'
                      ? 'var(--accent-amber)'
                      : 'var(--color-success)',
                    fontWeight: 600
                  }}>
                    {evt.type.toUpperCase()}
                  </span>
                  <span style={{ color: 'var(--text-primary)' }}>{evt.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
