import React, { useState } from 'react';
import { useSensors } from '../context/SensorContext';
import Sparkline from './Sparkline';
import { Play, RotateCcw, Cpu, Activity } from 'lucide-react';

export default function SensorCard({ sensor }) {
  const {
    sensorValues,
    history,
    hoveredSensor,
    setHoveredSensor,
    selectedSensor,
    setSelectedSensor,
    setSingleValue,
    startScenario
  } = useSensors();

  const [isRamping, setIsRamping] = useState(false);

  const value = sensorValues[sensor.key] !== undefined ? sensorValues[sensor.key] : sensor.defaultVal;
  const isHovered = hoveredSensor === sensor.id;
  const isSelected = selectedSensor === sensor.id;

  const handleSliderChange = (e) => {
    const val = parseFloat(e.target.value);
    setSingleValue(sensor.key, val);
  };

  const handleNumberChange = (e) => {
    let val = parseFloat(e.target.value);
    if (isNaN(val)) return;
    val = Math.max(sensor.min, Math.min(sensor.max, val));
    setSingleValue(sensor.key, val);
  };

  const triggerRamp = () => {
    setIsRamping(true);
    startScenario(sensor.key, sensor.min, sensor.max, 15);
    setTimeout(() => setIsRamping(false), 15000);
  };

  const resetToDefault = () => {
    setSingleValue(sensor.key, sensor.defaultVal);
  };

  // Calculate duty cycle / voltage for technical badge
  const percent = ((value - sensor.min) / (sensor.max - sensor.min || 1)) * 100;
  const techLabel = sensor.signal === 'DAC'
    ? `${((percent / 100) * 3.3).toFixed(2)} V`
    : `${percent.toFixed(1)}% Duty`;

  return (
    <div
      className="glass-panel"
      style={{
        padding: '1.25rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
        borderColor: isHovered || isSelected ? sensor.color : 'var(--border-subtle)',
        boxShadow: isHovered || isSelected ? `0 0 20px -2px ${sensor.glowColor}` : 'var(--shadow-card)',
        transform: isHovered ? 'translateY(-2px)' : 'none',
        cursor: 'pointer'
      }}
      onMouseEnter={() => setHoveredSensor(sensor.id)}
      onMouseLeave={() => setHoveredSensor(null)}
      onClick={() => setSelectedSensor(isSelected ? null : sensor.id)}
    >
      {/* Header: Title, Pin badges, Signal Type */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span
              style={{
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                backgroundColor: sensor.color,
                boxShadow: `0 0 8px ${sensor.color}`
              }}
            />
            <h3 style={{ fontSize: '1rem', fontWeight: '700', letterSpacing: '-0.01em' }}>
              {sensor.name}
            </h3>
          </div>
          <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.35rem' }}>
            <span
              className="mono-tag"
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.06)',
                padding: '2px 6px',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--text-secondary)'
              }}
            >
              {sensor.espPin} → {sensor.arduinoPin}
            </span>
            <span
              className="mono-tag"
              style={{
                backgroundColor: sensor.signal === 'DAC' ? 'rgba(6, 182, 212, 0.15)' : 'rgba(99, 102, 241, 0.15)',
                color: sensor.signal === 'DAC' ? 'var(--accent-cyan)' : 'var(--accent-indigo)',
                padding: '2px 6px',
                borderRadius: 'var(--radius-sm)',
                fontWeight: '600'
              }}
            >
              {sensor.signal} ({techLabel})
            </span>
          </div>
        </div>

        {/* Sparkline chart */}
        <div style={{ opacity: 0.85 }}>
          <Sparkline
            data={history[sensor.key]}
            min={sensor.min}
            max={sensor.max}
            color={sensor.color}
            width={90}
            height={32}
          />
        </div>
      </div>

      {/* Main Digital Readout */}
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginTop: '0.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.35rem' }}>
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '2.25rem',
              fontWeight: '700',
              lineHeight: 1,
              color: sensor.color
            }}
          >
            {value.toFixed(sensor.step < 1 ? 1 : 0)}
          </span>
          <span style={{ fontSize: '1rem', color: 'var(--text-secondary)', fontWeight: '600' }}>
            {sensor.unit}
          </span>
        </div>

        {/* Numeric input stepper */}
        <input
          type="number"
          step={sensor.step}
          min={sensor.min}
          max={sensor.max}
          value={value}
          onChange={handleNumberChange}
          onClick={(e) => e.stopPropagation()}
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '0.95rem',
            padding: '0.35rem 0.5rem',
            width: '80px',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border-subtle)',
            backgroundColor: 'var(--bg-input)',
            color: 'var(--text-primary)',
            textAlign: 'right',
            outline: 'none'
          }}
        />
      </div>

      {/* Synchronized Slider */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }} onClick={(e) => e.stopPropagation()}>
        <input
          type="range"
          min={sensor.min}
          max={sensor.max}
          step={sensor.step}
          value={value}
          onChange={handleSliderChange}
          style={{ accentColor: sensor.color }}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
          <span>{sensor.min} {sensor.unit}</span>
          <span>Mid ({sensor.defaultVal})</span>
          <span>{sensor.max} {sensor.unit}</span>
        </div>
      </div>

      {/* Quick Scenarios for this sensor */}
      <div style={{ display: 'flex', gap: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid var(--border-subtle)' }} onClick={(e) => e.stopPropagation()}>
        <button
          onClick={triggerRamp}
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.35rem',
            padding: '0.45rem',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border-subtle)',
            backgroundColor: isRamping ? sensor.color : 'rgba(255, 255, 255, 0.04)',
            color: isRamping ? '#fff' : 'var(--text-primary)',
            fontSize: '0.75rem',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
        >
          <Play size={12} />
          {isRamping ? 'Ramping...' : 'Ramp Sweep (15s)'}
        </button>
        <button
          onClick={resetToDefault}
          title="Reset to default midpoint"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '0.45rem 0.65rem',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border-subtle)',
            backgroundColor: 'rgba(255, 255, 255, 0.04)',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
        >
          <RotateCcw size={12} />
        </button>
      </div>
    </div>
  );
}
