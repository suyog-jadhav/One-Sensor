import React, { useState, useEffect, useRef } from 'react';
import {
  Thermometer,
  Droplets,
  Wind,
  Sun,
  Sprout,
  Compass,
  Radio,
  Volume2,
  SunMedium,
  CloudFog,
  Zap,
  RotateCcw,
  Activity,
  Cpu,
  Sliders,
  CheckCircle,
  AlertTriangle,
  Layers,
  Grid,
  Maximize2
} from 'lucide-react';
import Sensor2DVisual from './Sensor2DVisual';
import MotionAttitude2D from './MotionAttitude2D';

export const SENSOR_META = [
  {
    key: 'temperature',
    id: 'CH01',
    name: 'Temperature',
    desc: 'Ambient temperature measurement in degrees Celsius',
    unit: '°C',
    icon: Thermometer,
    min: 0,
    max: 50,
    step: 0.5,
    gpio: 'GPIO 34',
    signal: 'ADC1 (Analog)',
    resolution: '12-bit (0-4095)'
  },
  {
    key: 'humidity',
    id: 'CH02',
    name: 'Humidity',
    desc: 'Relative atmospheric moisture level percentage',
    unit: '%RH',
    icon: Droplets,
    min: 0,
    max: 100,
    step: 0.5,
    gpio: 'GPIO 35',
    signal: 'ADC1 (Analog)',
    resolution: '12-bit (0-4095)'
  },
  {
    key: 'gas',
    id: 'CH03',
    name: 'Gas Concentration',
    desc: 'MQ-2 metal oxide combustible gas & smoke detector',
    unit: 'ppm',
    icon: Wind,
    min: 0,
    max: 1000,
    step: 5,
    gpio: 'GPIO 32',
    signal: 'ADC1 (Analog)',
    resolution: '12-bit (0-4095)'
  },
  {
    key: 'light',
    id: 'CH04',
    name: 'Ambient Light',
    desc: 'Photoresistor illuminance level transducer',
    unit: 'lux',
    icon: Sun,
    min: 0,
    max: 2000,
    step: 10,
    gpio: 'GPIO 33',
    signal: 'ADC1 (Analog)',
    resolution: '12-bit (0-4095)'
  },
  {
    key: 'soil',
    id: 'CH05',
    name: 'Soil Moisture',
    desc: 'Capacitive soil water saturation matrix',
    unit: '%',
    icon: Sprout,
    min: 0,
    max: 100,
    step: 0.5,
    gpio: 'GPIO 25',
    signal: 'DAC1 (Analog Out)',
    resolution: '8-bit DAC (0-255)'
  },
  {
    key: 'proximity',
    id: 'CH06',
    name: 'Proximity Distance',
    desc: 'Ultrasonic echo flight-time distance capture',
    unit: 'cm',
    icon: Radio,
    min: 2,
    max: 400,
    step: 1,
    gpio: 'GPIO 26',
    signal: 'DAC2 / PWM',
    resolution: '8-bit DAC (0-255)'
  },
  {
    key: 'sound',
    id: 'CH07',
    name: 'Sound Level',
    desc: 'Electret microphone peak audio decibel amplitude',
    unit: 'dB',
    icon: Volume2,
    min: 30,
    max: 120,
    step: 1,
    gpio: 'GPIO 27',
    signal: 'ADC2 (Analog)',
    resolution: '12-bit (0-4095)'
  },
  {
    key: 'uv',
    id: 'CH08',
    name: 'UV Index',
    desc: 'Solar ultraviolet radiation radiometer',
    unit: 'UVI',
    icon: SunMedium,
    min: 0,
    max: 12,
    step: 0.1,
    gpio: 'GPIO 14',
    signal: 'ADC2 (Analog)',
    resolution: '12-bit (0-4095)'
  },
  {
    key: 'co2',
    id: 'CH09',
    name: 'CO₂ Air Quality',
    desc: 'Indoor air quality carbon dioxide ppm monitor',
    unit: 'ppm',
    icon: CloudFog,
    min: 400,
    max: 5000,
    step: 10,
    gpio: 'GPIO 12',
    signal: 'ADC2 (Analog)',
    resolution: '12-bit (0-4095)'
  },
  {
    key: 'motionX',
    id: 'CH10',
    name: 'Motion X Axis',
    desc: '6-axis inertial motion lateral acceleration',
    unit: 'g',
    icon: Compass,
    min: -2,
    max: 2,
    step: 0.05,
    gpio: 'GPIO 21 (I2C SDA)',
    signal: 'I2C Bus (0x68)',
    resolution: '16-bit Gyro/Acc'
  },
  {
    key: 'motionY',
    id: 'CH11',
    name: 'Motion Y Axis',
    desc: '6-axis inertial motion longitudinal acceleration',
    unit: 'g',
    icon: Compass,
    min: -2,
    max: 2,
    step: 0.05,
    gpio: 'GPIO 21 (I2C SDA)',
    signal: 'I2C Bus (0x68)',
    resolution: '16-bit Gyro/Acc'
  },
  {
    key: 'motionZ',
    id: 'CH12',
    name: 'Motion Z Axis',
    desc: '6-axis inertial motion vertical gravitational acceleration',
    unit: 'g',
    icon: Compass,
    min: -2,
    max: 2,
    step: 0.05,
    gpio: 'GPIO 22 (I2C SCL)',
    signal: 'I2C Bus (0x68)',
    resolution: '16-bit Gyro/Acc'
  },
];

export default function LiveControl({
  state,
  onSetValue,
  onSetMotion,
  onInjectFault,
  onClearFault,
  onConnectESP32
}) {
  const [selectedKey, setSelectedKey] = useState('temperature');
  const [viewMode, setViewMode] = useState('focused'); // 'focused' | 'grid'

  // Fault form state for inspector
  const [faultType, setFaultType] = useState('spike');
  const [faultMag, setFaultMag] = useState(15);
  const [faultDur, setFaultDur] = useState(3000);

  // Time-series history buffer for the selected sensor
  const historyRef = useRef([]);
  const canvasRef = useRef(null);

  const selectedSensor = SENSOR_META.find(s => s.key === selectedKey) || SENSOR_META[0];
  const currentVal = state[selectedKey] !== undefined ? Number(state[selectedKey]) : ((selectedSensor.min + selectedSensor.max) / 2);
  const activeFault = state.faults && state.faults[selectedKey];

  // Update history buffer
  useEffect(() => {
    historyRef.current.push(currentVal);
    if (historyRef.current.length > 100) {
      historyRef.current.shift();
    }
  }, [currentVal, selectedKey]);

  // Clear history on sensor switch
  useEffect(() => {
    historyRef.current = [currentVal];
  }, [selectedKey]);

  // Draw real-time canvas chart
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

    const hist = historyRef.current;
    if (hist.length < 2) return;

    const min = selectedSensor.min;
    const max = selectedSensor.max;
    const range = (max - min) || 1;

    // Translucent gradient fill under telemetry curve
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    if (activeFault) {
      grad.addColorStop(0, 'rgba(220, 69, 69, 0.20)');
      grad.addColorStop(1, 'rgba(220, 69, 69, 0.0)');
    } else {
      grad.addColorStop(0, 'rgba(6, 182, 212, 0.22)');
      grad.addColorStop(1, 'rgba(6, 182, 212, 0.0)');
    }

    ctx.beginPath();
    for (let i = 0; i < hist.length; i++) {
      const x = (i / (hist.length - 1 || 1)) * (w - 20) + 10;
      const normalized = Math.max(0, Math.min(1, (hist[i] - min) / range));
      const y = h - 15 - normalized * (h - 30);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.lineTo(w - 10, h - 5);
    ctx.lineTo(10, h - 5);
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();

    // Vibrant Telemetry Cyan (#06B6D4) or Error Red (#DC4545)
    ctx.beginPath();
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = activeFault ? '#DC4545' : '#06B6D4';

    for (let i = 0; i < hist.length; i++) {
      const x = (i / (hist.length - 1 || 1)) * (w - 20) + 10;
      const normalized = Math.max(0, Math.min(1, (hist[i] - min) / range));
      const y = h - 15 - normalized * (h - 30);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    // Latest value point with soft glowing halo
    const lastX = w - 10;
    const lastNorm = Math.max(0, Math.min(1, (currentVal - min) / range));
    const lastY = h - 15 - lastNorm * (h - 30);

    ctx.beginPath();
    ctx.arc(lastX, lastY, 6, 0, Math.PI * 2);
    ctx.fillStyle = activeFault ? 'rgba(220, 69, 69, 0.25)' : 'rgba(6, 182, 212, 0.25)';
    ctx.fill();

    ctx.beginPath();
    ctx.arc(lastX, lastY, 3.5, 0, Math.PI * 2);
    ctx.fillStyle = activeFault ? '#DC4545' : '#06B6D4';
    ctx.fill();

    ctx.beginPath();
    ctx.arc(lastX, lastY, 1.5, 0, Math.PI * 2);
    ctx.fillStyle = '#FFFFFF';
    ctx.fill();
  }, [currentVal, selectedKey, activeFault, selectedSensor]);

  // Calculate actual statistics from buffer
  const hist = historyRef.current;
  const statMin = hist.length > 0 ? Math.min(...hist) : currentVal;
  const statMax = hist.length > 0 ? Math.max(...hist) : currentVal;
  const statAvg = hist.length > 0 ? (hist.reduce((a, b) => a + b, 0) / hist.length) : currentVal;

  const isMotion = selectedKey === 'motionX' || selectedKey === 'motionY' || selectedKey === 'motionZ';

  return (
    <div className="page-container">
      {/* ── Top Header Row ── */}
      <div className="page-header-row">
        <div>
          <h1 className="page-title">Live Sensor Workbench</h1>
          <p className="page-subtitle">
            Real-time transducer synthesis, signal modulation, calibration adjustments, and fault testing.
          </p>
        </div>

        <div className="page-actions-group">
          {/* View Mode Toggle */}
          <div className="view-mode-toggle">
            <button
              className={`toggle-option ${viewMode === 'focused' ? 'active' : ''}`}
              onClick={() => setViewMode('focused')}
              title="Focused single-channel inspector"
            >
              <Maximize2 size={13} />
              <span>Focused Channel</span>
            </button>
            <button
              className={`toggle-option ${viewMode === 'grid' ? 'active' : ''}`}
              onClick={() => setViewMode('grid')}
              title="All 12 channels matrix"
            >
              <Grid size={13} />
              <span>All 12 Channels</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── Compact Horizontal Channel Strip (All 12 Sensors) (§6) ── */}
      <div className="channel-strip-scroller" role="tablist" aria-label="Sensor Channels">
        {SENSOR_META.map((s) => {
          const isSelected = selectedKey === s.key;
          const val = state[s.key] !== undefined ? Number(state[s.key]) : ((s.min + s.max) / 2);
          const isFault = state.faults && state.faults[s.key];
          const Icon = s.icon;
          const formattedVal = val.toFixed(s.unit === 'g' || s.unit === 'UVI' ? 2 : 1);

          return (
            <button
              key={s.key}
              role="tab"
              aria-selected={isSelected}
              className={`channel-strip-chip ${isSelected ? 'active' : ''} ${isFault ? 'fault' : ''}`}
              onClick={() => setSelectedKey(s.key)}
            >
              <span className="chip-header">
                <span className="chip-id">{s.id}</span>
                {isFault && <span className="chip-fault-dot" title="Active Fault" />}
              </span>
              <div className="chip-title-row">
                <Icon size={12} className="chip-icon" />
                <span className="chip-name">{s.name}</span>
              </div>
              <div className="chip-value-row">
                <span className="chip-val">{formattedVal}</span>
                <span className="chip-unit">{s.unit}</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* ── Mode 1: Focused Channel Workspace (§6) ── */}
      {viewMode === 'focused' ? (
        <div className="focused-sensor-grid">
          {/* Left Column: Primary Instrument & Real-time Chart */}
          <div className="panel-card live-readout-panel" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="panel-header">
              <div className="panel-title">
                <selectedSensor.icon size={16} color="var(--accent-amber)" />
                <span>{selectedSensor.name} — Signal Stream & Modulation</span>
              </div>
              <span className="telemetry-chip">
                <span>{selectedSensor.gpio}</span>
              </span>
            </div>

            {/* Readout Block */}
            <div className="focused-readout-card">
              <div className="readout-left">
                <span className="readout-desc">{selectedSensor.desc}</span>
                <div className="readout-figures">
                  <span className="readout-number">
                    {currentVal.toFixed(selectedSensor.unit === 'g' || selectedSensor.unit === 'UVI' ? 2 : 1)}
                  </span>
                  <span className="readout-unit">{selectedSensor.unit}</span>
                </div>
              </div>

              {/* Statistics calculated from buffer */}
              <div className="readout-stats-grid">
                <div className="stat-box">
                  <span className="stat-title">BUFFER MIN</span>
                  <span className="stat-num">{statMin.toFixed(1)} {selectedSensor.unit}</span>
                </div>
                <div className="stat-box">
                  <span className="stat-title">BUFFER MAX</span>
                  <span className="stat-num">{statMax.toFixed(1)} {selectedSensor.unit}</span>
                </div>
                <div className="stat-box">
                  <span className="stat-title">BUFFER AVG</span>
                  <span className="stat-num">{statAvg.toFixed(1)} {selectedSensor.unit}</span>
                </div>
                <div className="stat-box">
                  <span className="stat-title">STATUS</span>
                  <span className="stat-num" style={{ color: activeFault ? 'var(--color-danger)' : 'var(--color-success)' }}>
                    {activeFault ? 'FAULT ACTIVE' : 'NOMINAL'}
                  </span>
                </div>
              </div>
            </div>

            {/* Real-time Oscilloscope Chart */}
            <div className="focused-chart-wrapper">
              <div className="chart-header-row">
                <span className="chart-label">REAL-TIME SIGNAL TELEMETRY BUFFER (100 SAMPLES)</span>
                <span className="chart-range">{selectedSensor.min} to {selectedSensor.max} {selectedSensor.unit}</span>
              </div>
              <canvas
                ref={canvasRef}
                width={640}
                height={160}
                className="focused-chart-canvas"
              />
            </div>

            {/* Interactive Value Modulation Slider */}
            <div className="control-slider-pod">
              <div className="slider-label-row">
                <span className="slider-label">TRANSDUCER SIGNAL MODULATION</span>
                <div className="slider-val-input-wrap">
                  <input
                    type="number"
                    min={selectedSensor.min}
                    max={selectedSensor.max}
                    step={selectedSensor.step}
                    value={currentVal}
                    onChange={(e) => onSetValue(selectedKey, Number(e.target.value))}
                    className="slider-num-input"
                  />
                  <span className="slider-num-unit">{selectedSensor.unit}</span>
                </div>
              </div>

              <input
                type="range"
                min={selectedSensor.min}
                max={selectedSensor.max}
                step={selectedSensor.step}
                value={currentVal}
                onChange={(e) => onSetValue(selectedKey, Number(e.target.value))}
                className="instrument-range-slider"
              />

              <div className="slider-limits-row">
                <span>{selectedSensor.min} {selectedSensor.unit}</span>
                <span>Range span: {selectedSensor.max - selectedSensor.min} {selectedSensor.unit}</span>
                <span>{selectedSensor.max} {selectedSensor.unit}</span>
              </div>
            </div>

            {/* Sensor Visual: Specialized Motion panel for Motion axes, or 2D Visual */}
            {isMotion ? (
              <div className="motion-embedded-pod">
                <div className="panel-header" style={{ marginBottom: '8px' }}>
                  <div className="panel-title" style={{ fontSize: '12px' }}>
                    <Compass size={13} color="var(--accent-teal)" />
                    <span>6-Axis IMU Spatial Inclinometer (Attitude)</span>
                  </div>
                </div>
                <MotionAttitude2D
                  accelX={state.motionX ?? 0}
                  accelY={state.motionY ?? 0}
                  accelZ={state.motionZ ?? 1}
                  onSetMotion={onSetMotion}
                />
              </div>
            ) : (
              <div className="sensor-2d-embedded">
                <Sensor2DVisual
                  sensorKey={selectedKey}
                  value={currentVal}
                  unit={selectedSensor.unit}
                />
              </div>
            )}
          </div>

          {/* Right Column: Electrical Inspector & Channel Fault Controller */}
          <div className="panel-card live-readout-panel" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="panel-header">
              <div className="panel-title">
                <Layers size={14} color="var(--accent-teal)" />
                <span>Electrical & Channel Inspector</span>
              </div>
              <span className="status-badge-nominal">{selectedSensor.id}</span>
            </div>

            {/* Spec breakdown */}
            <div className="spec-table-list">
              <div className="spec-table-row">
                <span className="spec-label">Hardware Routing:</span>
                <span className="spec-value mono accent">{selectedSensor.gpio}</span>
              </div>
              <div className="spec-table-row">
                <span className="spec-label">Modulation Mode:</span>
                <span className="spec-value mono">{selectedSensor.signal}</span>
              </div>
              <div className="spec-table-row">
                <span className="spec-label">Internal Resolution:</span>
                <span className="spec-value mono teal">{selectedSensor.resolution}</span>
              </div>
              <div className="spec-table-row">
                <span className="spec-label">Transducer Range:</span>
                <span className="spec-value mono">{selectedSensor.min} — {selectedSensor.max} {selectedSensor.unit}</span>
              </div>
              <div className="spec-table-row">
                <span className="spec-label">Resolution Step:</span>
                <span className="spec-value mono green">±{selectedSensor.step} {selectedSensor.unit}</span>
              </div>
            </div>

            {/* Channel Fault Injection Module */}
            <div className="channel-fault-card">
              <div className="fault-card-header">
                <Zap size={14} color="var(--color-danger)" />
                <span className="fault-card-title">Signal Integrity & Fault Injection</span>
              </div>

              <div className="fault-form-group">
                <label className="fault-form-label">FAULT MODEL</label>
                <select
                  value={faultType}
                  onChange={(e) => setFaultType(e.target.value)}
                  className="fault-select-input"
                >
                  <option value="spike">Spike (Transient Excursion)</option>
                  <option value="noise">Noise (Gaussian Jitter)</option>
                  <option value="dropout">Dropout (Zero Signal Loss)</option>
                  <option value="stuck">Stuck (ADC Saturation Pin)</option>
                  <option value="drift">Drift (Linear Bias Accumulation)</option>
                  <option value="disconnect">Disconnect (Open Circuit)</option>
                  <option value="latency">Latency (Buffer Replay Lag)</option>
                </select>
              </div>

              <div className="fault-form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <label className="fault-form-label" style={{ margin: 0 }}>MAGNITUDE / DEVIATION</label>
                  <span className="fault-form-val">±{faultMag} {selectedSensor.unit}</span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={Math.max(10, (selectedSensor.max - selectedSensor.min) * 0.5)}
                  value={faultMag}
                  onChange={(e) => setFaultMag(Number(e.target.value))}
                  className="instrument-range-slider"
                />
              </div>

              <div className="fault-form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <label className="fault-form-label" style={{ margin: 0 }}>FAULT DURATION</label>
                  <span className="fault-form-val">{faultDur === 0 ? 'Indefinite' : `${faultDur} ms`}</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={10000}
                  step={500}
                  value={faultDur}
                  onChange={(e) => setFaultDur(Number(e.target.value))}
                  className="instrument-range-slider"
                />
              </div>

              {activeFault && (
                <div className="active-fault-callout">
                  <AlertTriangle size={13} color="var(--color-danger)" />
                  <span>Fault armed: [{activeFault.type || 'ACTIVE'}]</span>
                </div>
              )}

              <div className="fault-btn-group">
                <button
                  className="btn-danger-outline"
                  onClick={() => onInjectFault(selectedKey, faultType, faultMag, faultDur)}
                >
                  <Zap size={13} />
                  <span>Inject Fault</span>
                </button>
                <button
                  className="btn-secondary"
                  onClick={() => onClearFault(selectedKey)}
                >
                  <RotateCcw size={13} />
                  <span>Clear</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* ── Mode 2: All 12 Channels Grid Matrix (§6) ── */
        <div className="all-channels-grid">
          {SENSOR_META.map((s) => {
            const val = state[s.key] !== undefined ? Number(state[s.key]) : ((s.min + s.max) / 2);
            const isFault = state.faults && state.faults[s.key];
            const Icon = s.icon;
            const displayVal = val.toFixed(s.unit === 'g' || s.unit === 'UVI' ? 2 : 1);

            return (
              <div
                key={s.key}
                className={`all-channel-card ${isFault ? 'fault' : ''} ${selectedKey === s.key ? 'selected' : ''}`}
                onClick={() => {
                  setSelectedKey(s.key);
                  setViewMode('focused');
                }}
              >
                <div className="card-top-row">
                  <div className="card-id-badge">{s.id}</div>
                  <span className="card-gpio">{s.gpio}</span>
                </div>

                <div className="card-name-row">
                  <Icon size={14} color="var(--accent-amber)" />
                  <span className="card-sensor-name">{s.name}</span>
                </div>

                <div className="card-figure-row">
                  <span className="card-val">{displayVal}</span>
                  <span className="card-unit">{s.unit}</span>
                </div>

                <div className="card-slider-wrap" onClick={(e) => e.stopPropagation()}>
                  <input
                    type="range"
                    min={s.min}
                    max={s.max}
                    step={s.step}
                    value={val}
                    onChange={(e) => onSetValue(s.key, Number(e.target.value))}
                    className="instrument-range-slider"
                  />
                </div>

                <div className="card-footer-row">
                  <span className="card-signal-type">{s.signal}</span>
                  {isFault ? (
                    <span className="card-fault-tag">FAULT</span>
                  ) : (
                    <span className="card-nominal-tag">NOMINAL</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
