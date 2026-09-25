import React from 'react';
import { useSensors } from '../context/SensorContext';
import { PlayCircle, PauseCircle, RotateCcw, Zap, Sparkles } from 'lucide-react';

export default function QuickActions() {
  const { rampAll, freezeAll, resetAll, sensorValues } = useSensors();

  const isScenarioActive = sensorValues.scenario && sensorValues.scenario !== 'IDLE';

  return (
    <div
      className="glass-panel"
      style={{
        padding: '0.85rem 1.25rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '1rem',
        flexWrap: 'wrap'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <Sparkles size={16} color="var(--accent-indigo)" />
        <span style={{ fontSize: '0.85rem', fontWeight: '700' }}>Global Instrument Controls</span>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          (Broadcast synchronized states to ESP32 hardware in one click)
        </span>
      </div>

      <div style={{ display: 'flex', gap: '0.65rem' }}>
        {/* Ramp All */}
        <button
          onClick={rampAll}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            padding: '0.45rem 0.95rem',
            borderRadius: 'var(--radius-sm)',
            border: 'none',
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            color: '#fff',
            fontSize: '0.8rem',
            fontWeight: '600',
            cursor: 'pointer',
            boxShadow: '0 2px 8px rgba(99, 102, 241, 0.35)',
            transition: 'transform 0.15s ease'
          }}
        >
          <PlayCircle size={15} />
          Ramp All Sweeps
        </button>

        {/* Freeze All */}
        <button
          onClick={freezeAll}
          disabled={!isScenarioActive}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            padding: '0.45rem 0.95rem',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border-subtle)',
            backgroundColor: isScenarioActive ? 'rgba(239, 68, 68, 0.15)' : 'var(--bg-input)',
            color: isScenarioActive ? '#ef4444' : 'var(--text-muted)',
            fontSize: '0.8rem',
            fontWeight: '600',
            cursor: isScenarioActive ? 'pointer' : 'not-allowed',
            transition: 'all 0.15s ease'
          }}
        >
          <PauseCircle size={15} />
          Freeze / Hold
        </button>

        {/* Reset to Defaults */}
        <button
          onClick={resetAll}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            padding: '0.45rem 0.95rem',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border-subtle)',
            backgroundColor: 'var(--bg-input)',
            color: 'var(--text-primary)',
            fontSize: '0.8rem',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
        >
          <RotateCcw size={15} />
          Reset to 50% Defaults
        </button>
      </div>
    </div>
  );
}
