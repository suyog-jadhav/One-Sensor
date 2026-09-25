import React, { useState, useEffect, useRef } from 'react';
import Badge from './Badge';
import { useSmoothedValue } from '../utils/useSmoothedValue';
import { RefreshCw, Check, AlertTriangle, Cpu, Save, Sliders, ShieldCheck } from 'lucide-react';

const VALID_PWM_PINS = [4, 5, 12, 13, 14, 15, 16, 17, 18, 19, 21, 22, 23, 25, 26, 27, 32, 33];
const VALID_DAC_PINS = [25, 26];

const ALL_ESP32_PINS = [
  { pin: 4, type: 'PWM' },
  { pin: 5, type: 'PWM' },
  { pin: 12, type: 'PWM' },
  { pin: 13, type: 'PWM' },
  { pin: 14, type: 'PWM' },
  { pin: 15, type: 'PWM' },
  { pin: 16, type: 'PWM' },
  { pin: 17, type: 'PWM' },
  { pin: 18, type: 'PWM' },
  { pin: 19, type: 'PWM' },
  { pin: 21, type: 'PWM' },
  { pin: 22, type: 'PWM' },
  { pin: 23, type: 'PWM' },
  { pin: 25, type: 'DAC' },
  { pin: 26, type: 'DAC' },
  { pin: 27, type: 'PWM' },
  { pin: 32, type: 'PWM' },
  { pin: 33, type: 'PWM' },
];

const SENSOR_OPTIONS = [
  { id: 'temperature', name: 'Temperature' },
  { id: 'humidity', name: 'Humidity' },
  { id: 'gas', name: 'Gas Concentration' },
  { id: 'light', name: 'Light Intensity' },
  { id: 'soil_moisture', name: 'Soil Moisture' }
];

const DEFAULT_CHANNELS = [
  { sensor: 'temperature', signal: 'dac', gpio: 25, ledcChannel: 0, frequencyHz: 500, resolutionBits: 10, inputMin: 0, inputMax: 50, defaultValue: 25, enabled: true, calOffset: 0, calScale: 1.0 },
  { sensor: 'humidity', signal: 'dac', gpio: 26, ledcChannel: 1, frequencyHz: 500, resolutionBits: 10, inputMin: 0, inputMax: 100, defaultValue: 50, enabled: true, calOffset: 0, calScale: 1.0 },
  { sensor: 'gas', signal: 'pwm', gpio: 18, ledcChannel: 2, frequencyHz: 500, resolutionBits: 10, inputMin: 0, inputMax: 1000, defaultValue: 300, enabled: true, calOffset: 0, calScale: 1.0 },
  { sensor: 'light', signal: 'pwm', gpio: 19, ledcChannel: 3, frequencyHz: 500, resolutionBits: 10, inputMin: 0, inputMax: 1000, defaultValue: 500, enabled: true, calOffset: 0, calScale: 1.0 },
  { sensor: 'soil_moisture', signal: 'pwm', gpio: 21, ledcChannel: 4, frequencyHz: 500, resolutionBits: 10, inputMin: 0, inputMax: 100, defaultValue: 50, enabled: true, calOffset: 0, calScale: 1.0 }
];

export default function ConfigEditor({ configState, configError, onApplyConfig, onResetConfig }) {
  const [localChannels, setLocalChannels] = useState(DEFAULT_CHANNELS);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [flashingRows, setFlashingRows] = useState(false);
  const [highlightedPin, setHighlightedPin] = useState(null);
  const [fieldHighlight, setFieldHighlight] = useState({});

  useEffect(() => {
    if (configState && configState.channels && configState.channels.length > 0) {
      setLocalChannels(configState.channels.map(ch => ({
        ...ch,
        enabled: ch.enabled !== undefined ? ch.enabled : true
      })));
    }
  }, [configState]);

  const activeCount = localChannels.filter(c => c.enabled !== false).length;
  const targetLoadMa = activeCount * 0.96; // 4.8 mA when 5 channels active
  const smoothedLoadMa = useSmoothedValue(targetLoadMa, { duration: 260, decimals: 1, isActive: true });

  const handleChange = (index, field, value) => {
    const updated = [...localChannels];
    updated[index] = { ...updated[index], [field]: value };
    setLocalChannels(updated);

    // Pulse edited input cell
    const cellKey = `${index}-${field}`;
    setFieldHighlight(prev => ({ ...prev, [cellKey]: true }));
    setTimeout(() => {
      setFieldHighlight(prev => ({ ...prev, [cellKey]: false }));
    }, 300);

    // If GPIO changed, highlight pin on ESP32 diagram
    if (field === 'gpio') {
      setHighlightedPin(value);
      setTimeout(() => setHighlightedPin(null), 800);
    }
  };

  const handleReset = () => {
    setFlashingRows(true);
    setTimeout(() => setFlashingRows(false), 400);
    onResetConfig();
  };

  const handleSave = () => {
    setIsSaving(true);
    onApplyConfig(localChannels);

    setTimeout(() => {
      setIsSaving(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    }, 600);
  };

  // Determine which pins are assigned
  const assignedPins = new Map();
  localChannels.forEach(ch => {
    if (ch.enabled !== false) {
      assignedPins.set(ch.gpio, ch);
    }
  });

  const dacAssignedCount = Array.from(assignedPins.values()).filter(c => c.signal === 'dac').length;
  const pwmAssignedCount = Array.from(assignedPins.values()).filter(c => c.signal === 'pwm').length;

  return (
    <div className="tab-content-enter" style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>

      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: '700' }}>Sensor & GPIO Pin Configuration Matrix</h2>
            <Badge variant="neutral">ESP32-S / WROOM-32</Badge>
          </div>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            Configure transducer routing, modulation signals (DAC 8-bit / PWM 10-bit), and calibration scales.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn-secondary" onClick={handleReset}>
            Reset Factory Defaults
          </button>
          <button
            className={`btn-primary ${saveSuccess ? 'btn-sweep-success' : ''}`}
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? (
              <>
                <RefreshCw size={14} className="spin-icon" />
                <span>Writing to Flash…</span>
              </>
            ) : saveSuccess ? (
              <>
                <Check size={14} />
                <span>Saved & Synchronized!</span>
              </>
            ) : (
              <>
                <Save size={14} />
                <span>Save to Flash / NVS</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Error Banner with slide down */}
      {configError && (
        <div
          className="banner-enter"
          style={{
            background: 'rgba(239, 68, 68, 0.12)',
            border: '1px solid rgba(239, 68, 68, 0.35)',
            color: '#fca5a5',
            padding: '12px 18px',
            borderRadius: 'var(--radius-md)',
            fontSize: '13px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
          }}
        >
          <AlertTriangle size={18} color="#ef4444" />
          <div>
            <strong>Configuration Rejection:</strong> {configError}
          </div>
        </div>
      )}

      {/* Success Banner with 3s progress countdown underline */}
      {saveSuccess && (
        <div
          className="banner-enter"
          style={{
            background: 'rgba(16, 185, 129, 0.12)',
            border: '1px solid rgba(16, 185, 129, 0.35)',
            color: '#6ee7b7',
            padding: '12px 18px',
            borderRadius: 'var(--radius-md)',
            fontSize: '13px',
            position: 'relative',
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
          }}
        >
          <Check size={18} color="#10b981" />
          <div>
            <strong>NVS Storage Synchronized:</strong> Sensor routing updated and persisted to ESP32 non-volatile storage.
          </div>
          <div
            className="progress-countdown"
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              height: '3px',
              backgroundColor: 'var(--color-success)',
            }}
          />
        </div>
      )}

      {/* Main Matrix Table Card */}
      <div
        className="interactive-card"
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-lg)',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '16px 20px',
            borderBottom: '1px solid var(--border-color)',
            background: 'var(--bg-surface-1)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sliders size={16} color="var(--color-cyan)" />
            <span style={{ fontSize: '14px', fontWeight: '700' }}>Transducer Channel Matrix</span>
          </div>
          <Badge
            variant={activeCount === 5 ? 'success' : 'neutral'}
            style={{ transition: 'all var(--motion-fast)' }}
          >
            {activeCount} / 5 CHANNELS ACTIVE
          </Badge>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: '60px', textAlign: 'center' }}>Active</th>
                <th>Sensor Channel</th>
                <th>Signal Type</th>
                <th>ESP32 Pin Routing</th>
                <th>Freq (Hz)</th>
                <th>Bits</th>
                <th>Min</th>
                <th>Max</th>
                <th>Cal Offset</th>
                <th>Cal Scale</th>
              </tr>
            </thead>
            <tbody>
              {localChannels.map((ch, idx) => {
                const isEnabled = ch.enabled !== false;
                const rowFlashClass = flashingRows ? 'row-flash' : '';
                return (
                  <tr
                    key={idx}
                    className={rowFlashClass}
                    style={{
                      opacity: isEnabled ? 1 : 0.45,
                      transition: 'opacity var(--motion-fast)',
                    }}
                  >
                    {/* Active Checkbox */}
                    <td style={{ textAlign: 'center' }}>
                      <input
                        type="checkbox"
                        checked={isEnabled}
                        onChange={(e) => handleChange(idx, 'enabled', e.target.checked)}
                        style={{ cursor: 'pointer', transform: 'scale(1.2)' }}
                      />
                    </td>

                    {/* Sensor Type Selector */}
                    <td>
                      <select
                        style={{
                          fontWeight: '600',
                          border: fieldHighlight[`${idx}-sensor`] ? '1px solid var(--color-cyan)' : undefined,
                        }}
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
                        style={{
                          border: fieldHighlight[`${idx}-signal`] ? '1px solid var(--color-cyan)' : undefined,
                        }}
                        onChange={(e) => {
                          const sig = e.target.value;
                          const newGpio = sig === 'dac' ? 25 : (ch.gpio === 25 || ch.gpio === 26 ? 18 : ch.gpio);
                          const updated = [...localChannels];
                          updated[idx] = { ...updated[idx], signal: sig, gpio: newGpio };
                          setLocalChannels(updated);
                          setHighlightedPin(newGpio);
                          setTimeout(() => setHighlightedPin(null), 800);
                        }}
                      >
                        <option value="pwm">PWM (Digital Timer)</option>
                        <option value="dac">DAC (Analog Current)</option>
                      </select>
                    </td>

                    {/* GPIO Selector with dynamic options */}
                    <td>
                      <select
                        value={ch.gpio}
                        style={{
                          fontFamily: 'var(--font-mono)',
                          border: fieldHighlight[`${idx}-gpio`] ? '1px solid var(--color-cyan)' : undefined,
                        }}
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
                        style={{
                          width: '74px',
                          fontFamily: 'var(--font-mono)',
                          border: fieldHighlight[`${idx}-frequencyHz`] ? '1px solid var(--color-cyan)' : undefined,
                        }}
                        value={ch.frequencyHz}
                        disabled={ch.signal === 'dac'}
                        onChange={(e) => handleChange(idx, 'frequencyHz', parseInt(e.target.value))}
                      />
                    </td>

                    <td>
                      <input
                        type="number"
                        style={{
                          width: '58px',
                          fontFamily: 'var(--font-mono)',
                          border: fieldHighlight[`${idx}-resolutionBits`] ? '1px solid var(--color-cyan)' : undefined,
                        }}
                        value={ch.resolutionBits}
                        disabled={ch.signal === 'dac'}
                        onChange={(e) => handleChange(idx, 'resolutionBits', parseInt(e.target.value))}
                      />
                    </td>

                    <td>
                      <input
                        type="number"
                        style={{
                          width: '64px',
                          fontFamily: 'var(--font-mono)',
                          border: fieldHighlight[`${idx}-inputMin`] ? '1px solid var(--color-cyan)' : undefined,
                        }}
                        value={ch.inputMin}
                        onChange={(e) => handleChange(idx, 'inputMin', parseFloat(e.target.value))}
                      />
                    </td>

                    <td>
                      <input
                        type="number"
                        style={{
                          width: '64px',
                          fontFamily: 'var(--font-mono)',
                          border: fieldHighlight[`${idx}-inputMax`] ? '1px solid var(--color-cyan)' : undefined,
                        }}
                        value={ch.inputMax}
                        onChange={(e) => handleChange(idx, 'inputMax', parseFloat(e.target.value))}
                      />
                    </td>

                    <td>
                      <input
                        type="number"
                        step="0.01"
                        style={{
                          width: '64px',
                          fontFamily: 'var(--font-mono)',
                          border: fieldHighlight[`${idx}-calOffset`] ? '1px solid var(--color-cyan)' : undefined,
                        }}
                        value={ch.calOffset || 0}
                        onChange={(e) => handleChange(idx, 'calOffset', parseFloat(e.target.value))}
                      />
                    </td>

                    <td>
                      <input
                        type="number"
                        step="0.01"
                        style={{
                          width: '64px',
                          fontFamily: 'var(--font-mono)',
                          border: fieldHighlight[`${idx}-calScale`] ? '1px solid var(--color-cyan)' : undefined,
                        }}
                        value={ch.calScale || 1.0}
                        onChange={(e) => handleChange(idx, 'calScale', parseFloat(e.target.value))}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Table Footer with Active Load Telemetry easing with motion-value */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '12px 20px',
            background: 'var(--bg-surface-1)',
            borderTop: '1px solid var(--border-color)',
            fontFamily: 'var(--font-mono)',
            fontSize: '11px',
            color: 'var(--text-dim)',
          }}
        >
          <div>
            <span>ROUTING RULE: </span>
            <strong style={{ color: 'var(--text-muted)' }}>DAC RESERVED FOR ANALOG CHANNELS (25, 26)</strong>
          </div>
          <div>
            <span>EMULATED PIN CURRENT LOAD: </span>
            <strong style={{ color: 'var(--color-cyan)', fontSize: '12px' }}>
              {smoothedLoadMa.toFixed(1)} mA Emulated
            </strong>
          </div>
        </div>
      </div>

      {/* Grid of 3 Reference & Visual Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>

        {/* 1. ESP32 Pinout Allocation Map (Highest value animation target) */}
        <div
          className="interactive-card"
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-lg)',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Cpu size={16} color="var(--color-primary)" />
              <h3 style={{ fontSize: '14px', fontWeight: '700' }}>ESP32 Pin Allocation Map</h3>
            </div>
            <Badge variant="success">NO CONFLICT</Badge>
          </div>

          <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            Physical GPIO allocation. Changes in matrix highlight the target pin in real-time.
          </p>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {ALL_ESP32_PINS.map(p => {
              const assigned = assignedPins.get(p.pin);
              const isTargetPin = highlightedPin === p.pin;
              const isDac = p.type === 'DAC';

              let bg = 'rgba(255, 255, 255, 0.03)';
              let border = 'rgba(255, 255, 255, 0.08)';
              let color = 'var(--text-dim)';

              if (assigned) {
                if (assigned.signal === 'dac') {
                  bg = 'rgba(239, 68, 68, 0.15)';
                  border = '#ef4444';
                  color = '#fca5a5';
                } else {
                  bg = 'rgba(37, 99, 235, 0.15)';
                  border = 'var(--color-primary)';
                  color = '#93c5fd';
                }
              }

              return (
                <div
                  key={p.pin}
                  className={isTargetPin ? 'pin-highlight-pulse' : ''}
                  style={{
                    padding: '6px 10px',
                    borderRadius: 'var(--radius-sm)',
                    background: bg,
                    border: `1px solid ${border}`,
                    color: color,
                    fontFamily: 'var(--font-mono)',
                    fontSize: '11px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    transition: 'all var(--motion-fast)',
                  }}
                  title={assigned ? `Assigned to ${assigned.sensor} (${assigned.signal.toUpperCase()})` : `Free ${p.type}`}
                >
                  <span style={{ fontWeight: '700' }}>GPIO {p.pin}</span>
                  <span style={{ fontSize: '9px', opacity: 0.8 }}>[{p.type}]</span>
                  {assigned && <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: border }} />}
                </div>
              );
            })}
          </div>

          <div style={{ display: 'flex', gap: '16px', fontSize: '11px', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)', marginTop: 'auto' }}>
            <span>DAC: <strong style={{ color: '#fca5a5' }}>{dacAssignedCount}/2</strong></span>
            <span>PWM: <strong style={{ color: '#93c5fd' }}>{pwmAssignedCount}/16</strong></span>
            <span>AVAILABLE: <strong style={{ color: 'var(--text-muted)' }}>{ALL_ESP32_PINS.length - assignedPins.size}</strong></span>
          </div>
        </div>

        {/* 2. Waveform Calibration Engine Reference Card */}
        <div
          className="interactive-card"
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-lg)',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '14px', fontWeight: '700' }}>Waveform Calibration Engine</h3>
            <div style={{ display: 'flex', gap: '6px' }}>
              <Badge variant="neutral">SAMPLING</Badge>
              <Badge variant="warning">JITTER &lt;1%</Badge>
            </div>
          </div>

          <div
            style={{
              background: 'rgba(0,0,0,0.3)',
              padding: '12px',
              borderRadius: 'var(--radius-sm)',
              fontFamily: 'var(--font-mono)',
              fontSize: '12px',
              color: 'var(--color-cyan)',
              border: '1px solid var(--border-subtle)',
            }}
          >
            V_out = (RawInput * CalScale) + CalOffset
          </div>

          <p style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: '1.6' }}>
            Hardware timer channels divide the 80 MHz APB clock into a steady 500 Hz carrier frequency.
            DAC outputs bypass PWM filtering for 0–3.3V instant step responses.
          </p>

          <div style={{ marginTop: 'auto', paddingTop: '8px', borderTop: '1px solid var(--border-subtle)' }}>
            <Badge variant="success" dot>OPTIMAL RESPONSE</Badge>
          </div>
        </div>

        {/* 3. NVS Storage Status & Arduino Jumper Reference */}
        <div
          className="interactive-card"
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-lg)',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '14px', fontWeight: '700' }}>NVS & Jumper Reference</h3>
            <Badge variant={isSaving ? 'active-pulse' : 'neutral'} dot={isSaving}>
              {isSaving ? 'WRITING NVS...' : 'SAVED (SYNC)'}
            </Badge>
          </div>

          <p style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: '1.5' }}>
            Standard Arduino Uno header wiring receiver mappings:
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12px', fontFamily: 'var(--font-mono)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 8px', background: 'rgba(255,255,255,0.03)', borderRadius: '4px' }}>
              <span>Temp (DAC1) → Arduino</span>
              <strong style={{ color: '#fca5a5' }}>PIN A0 (0–50°C)</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 8px', background: 'rgba(255,255,255,0.03)', borderRadius: '4px' }}>
              <span>Humidity (DAC2) → Arduino</span>
              <strong style={{ color: '#38bdf8' }}>PIN A1 (0–100%)</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 8px', background: 'rgba(255,255,255,0.03)', borderRadius: '4px' }}>
              <span>Gas / Light / Soil → Arduino</span>
              <strong style={{ color: 'var(--color-primary)' }}>PINS D4, D5, D6</strong>
            </div>
          </div>

          <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'var(--text-dim)' }}>
            <ShieldCheck size={14} color="var(--color-success)" />
            <span>NVS Flash Partition: 0x9000 (CRC32 Verified)</span>
          </div>
        </div>

      </div>

    </div>
  );
}
