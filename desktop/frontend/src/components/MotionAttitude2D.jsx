import React, { useMemo } from 'react';
import {
  Compass,
  RotateCcw,
  TrendingUp,
  Move3d,
  Layers,
  Shield,
  Zap,
  Activity,
  Maximize2
} from 'lucide-react';

const PRESETS = [
  { label: 'Level Flat', icon: Compass, x: 0, y: 0, z: 1.0, desc: 'Resting flat on workbench' },
  { label: 'Inverted', icon: RotateCcw, x: 0, y: 0, z: -1.0, desc: 'Upside down (180°)' },
  { label: 'Pitch +45°', icon: TrendingUp, x: 0, y: 0.707, z: 0.707, desc: 'Nose pitched upwards' },
  { label: 'Roll +45°', icon: Move3d, x: 0.707, y: 0, z: 0.707, desc: 'Tilted rightwards' },
  { label: 'Portrait', icon: Layers, x: 0, y: 1.0, z: 0, desc: 'Standing vertical' },
  { label: 'Zero-G (0g)', icon: Shield, x: 0, y: 0, z: 0, desc: 'Freefall simulation' },
  { label: 'High-G Shock', icon: Zap, x: 1.4, y: 1.4, z: 1.4, desc: 'Extreme acceleration' },
];

export default function MotionAttitude2D({ accelX = 0, accelY = 0, accelZ = 1, onSetMotion }) {
  const ax = Number(accelX) || 0;
  const ay = Number(accelY) || 0;
  const az = Number(accelZ) || 0;

  // Calculate pitch & roll in degrees from accelerometer
  const { pitchDeg, rollDeg, gMag } = useMemo(() => {
    const mag = Math.sqrt(ax * ax + ay * ay + az * az);
    const pitch = Math.atan2(ay, Math.sqrt(ax * ax + az * az)) * (180 / Math.PI);
    const roll = Math.atan2(-ax, az) * (180 / Math.PI);
    return {
      pitchDeg: isNaN(pitch) ? 0 : Math.max(-90, Math.min(90, pitch)),
      rollDeg: isNaN(roll) ? 0 : Math.max(-180, Math.min(180, roll)),
      gMag: mag.toFixed(2),
    };
  }, [ax, ay, az]);

  return (
    <div
      style={{
        background: 'var(--bg-card)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border-color)',
        padding: '20px 24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
      }}
    >
      {/* Header Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: 'var(--radius-sm)',
              background: 'rgba(56, 189, 248, 0.12)',
              border: '1px solid rgba(56, 189, 248, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Compass size={20} color="var(--color-cyan)" />
          </div>
          <div>
            <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#fff' }}>2D Motion Attitude & Inclinometer</h3>
            <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Precision aircraft-grade pitch, roll and vector horizon telemetry</p>
          </div>
        </div>

        {/* Telemetry pill */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontFamily: 'var(--font-mono)', fontSize: '12px' }}>
          <span>PITCH: <strong style={{ color: 'var(--color-cyan)' }}>{pitchDeg.toFixed(1)}°</strong></span>
          <span>ROLL: <strong style={{ color: '#a855f7' }}>{rollDeg.toFixed(1)}°</strong></span>
          <span>G-LOAD: <strong style={{ color: 'var(--color-warning)' }}>{gMag} g</strong></span>
        </div>
      </div>

      {/* Main Instrument Display Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', alignItems: 'center' }}>
        {/* Left: 2D Artificial Horizon (Attitude Indicator) */}
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <div
            style={{
              position: 'relative',
              width: '210px',
              height: '210px',
              borderRadius: '50%',
              background: '#0b0f17',
              border: '3px solid #334155',
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.7), inset 0 2px 8px rgba(0, 0, 0, 0.9)',
              overflow: 'hidden',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {/* Rotating Horizon Sphere Group */}
            <div
              style={{
                position: 'absolute',
                width: '320px',
                height: '320px',
                transform: `rotate(${rollDeg}deg) translateY(${pitchDeg * 1.2}px)`,
                transition: 'transform var(--motion-instant)',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              {/* Sky Half (Deep Blue) */}
              <div
                style={{
                  height: '160px',
                  background: 'linear-gradient(to bottom, #1e3a8a 0%, #0284c7 100%)',
                  borderBottom: '2px solid #ffffff',
                  display: 'flex',
                  alignItems: 'flex-end',
                  justifyContent: 'center',
                  paddingBottom: '8px',
                }}
              >
                {/* Sky Pitch Ladder lines */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', opacity: 0.7 }}>
                  <div style={{ width: '40px', height: '1.5px', background: '#fff' }} />
                  <div style={{ width: '24px', height: '1.5px', background: '#fff' }} />
                </div>
              </div>

              {/* Ground Half (Earthy Brown / Charcoal) */}
              <div
                style={{
                  height: '160px',
                  background: 'linear-gradient(to bottom, #78350f 0%, #451a03 100%)',
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'center',
                  paddingTop: '8px',
                }}
              >
                {/* Ground Pitch Ladder lines */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', opacity: 0.7 }}>
                  <div style={{ width: '24px', height: '1.5px', background: '#fff' }} />
                  <div style={{ width: '40px', height: '1.5px', background: '#fff' }} />
                </div>
              </div>
            </div>

            {/* Fixed Airplane Reticle Symbol in center */}
            <div
              style={{
                position: 'absolute',
                zIndex: 5,
                width: '100px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                pointerEvents: 'none',
              }}
            >
              <div style={{ width: '30px', height: '4px', background: '#eab308', borderRadius: '2px', boxShadow: '0 0 6px #000' }} />
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#eab308', boxShadow: '0 0 6px #000' }} />
              <div style={{ width: '30px', height: '4px', background: '#eab308', borderRadius: '2px', boxShadow: '0 0 6px #000' }} />
            </div>

            {/* Outer Roll Angle Pointer Marks */}
            <svg viewBox="0 0 200 200" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 6 }}>
              {/* Zero roll triangle mark */}
              <polygon points="100,10 94,22 106,22" fill="#eab308" />
              {/* 30, 45, 60 degree ticks */}
              {[-60, -45, -30, 30, 45, 60].map(deg => {
                const rad = ((deg - 90) * Math.PI) / 180;
                const x1 = 100 + 94 * Math.cos(rad);
                const y1 = 100 + 94 * Math.sin(rad);
                const x2 = 100 + 84 * Math.cos(rad);
                const y2 = 100 + 84 * Math.sin(rad);
                return <line key={deg} x1={x1} y1={y1} x2={x2} y2={y2} stroke="rgba(255,255,255,0.6)" strokeWidth="1.5" />;
              })}
            </svg>

            {/* Lens Reflection Glare */}
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.15) 0%, transparent 55%)',
                pointerEvents: 'none',
                zIndex: 7,
              }}
            />
          </div>
        </div>

        {/* Right: Presets & Tri-Axis Micro-Meters */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Quick Attitude Presets:
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {PRESETS.map(p => {
              const Icon = p.icon;
              return (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => onSetMotion && onSetMotion(p.x, p.y, p.z)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 12px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--bg-surface-1)',
                    border: '1px solid var(--border-color)',
                    color: '#fff',
                    fontSize: '12px',
                    cursor: 'pointer',
                    fontWeight: '500',
                    transition: 'all var(--motion-fast)',
                  }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--color-primary)'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-color)'}
                >
                  <Icon size={13} color="var(--color-cyan)" />
                  <span>{p.label}</span>
                </button>
              );
            })}
          </div>

          {/* Tri-Axis Vectors Bar */}
          <div
            style={{
              marginTop: '6px',
              padding: '10px 14px',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--bg-surface-1)',
              border: '1px solid var(--border-color)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontFamily: 'var(--font-mono)',
              fontSize: '11px',
            }}
          >
            <span>X: <strong style={{ color: '#38bdf8' }}>{ax >= 0 ? `+${ax.toFixed(2)}` : ax.toFixed(2)} g</strong></span>
            <span>Y: <strong style={{ color: '#a855f7' }}>{ay >= 0 ? `+${ay.toFixed(2)}` : ay.toFixed(2)} g</strong></span>
            <span>Z: <strong style={{ color: '#f59e0b' }}>{az >= 0 ? `+${az.toFixed(2)}` : az.toFixed(2)} g</strong></span>
          </div>
        </div>
      </div>
    </div>
  );
}
