import React, { useMemo } from 'react';

/**
 * Tier 2 Shared Analog Gauge Component
 * Parameterized precision 3D-styled dial with top-left lighting,
 * recessed face, physical needle with cast shadow, and grounding shadow.
 */
export default function AnalogGaugeVisual({
  label,
  unit,
  min = 0,
  max = 100,
  value = 0,
  accentColor = 'var(--color-primary)',
}) {
  const clamped = Math.min(Math.max(value, min), max);
  const ratio = (clamped - min) / (max - min || 1);

  // 240 degree sweep from -120deg to +120deg
  const needleAngle = -120 + ratio * 240;

  // Generate 9 tick marks along the arc
  const ticks = useMemo(() => {
    const list = [];
    const count = 9;
    for (let i = 0; i < count; i++) {
      const tRatio = i / (count - 1);
      const angle = -120 + tRatio * 240;
      const isMajor = i % 2 === 0;
      const isActive = tRatio <= ratio;
      list.push({ angle, isMajor, isActive });
    }
    return list;
  }, [ratio]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', margin: '8px 0 12px' }}>
      {/* 3D Gauge Container with Grounding Shadow */}
      <div
        style={{
          position: 'relative',
          width: '136px',
          height: '116px',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        {/* Grounding Shadow */}
        <div
          style={{
            position: 'absolute',
            bottom: '2px',
            width: '100px',
            height: '14px',
            borderRadius: '50%',
            background: 'radial-gradient(ellipse at center, rgba(0, 0, 0, 0.65) 0%, rgba(0, 0, 0, 0) 70%)',
            filter: 'blur(3px)',
            pointerEvents: 'none',
          }}
        />

        {/* Outer Brushed Bezel (Top-left lighting gradient) */}
        <div
          style={{
            position: 'relative',
            width: '114px',
            height: '114px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #334155 0%, #1e293b 50%, #0f172a 100%)',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5), inset 0 1px 1px rgba(255, 255, 255, 0.25)',
            padding: '7px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {/* Recessed Dial Face with Inner Shadow */}
          <div
            style={{
              position: 'relative',
              width: '100%',
              height: '100%',
              borderRadius: '50%',
              background: 'radial-gradient(circle at 40% 35%, #182030 0%, #0b0f17 100%)',
              boxShadow: 'inset 0 3px 6px rgba(0, 0, 0, 0.8), inset 0 0 0 1px rgba(255, 255, 255, 0.05)',
              overflow: 'hidden',
            }}
          >
            {/* SVG Arc and Ticks */}
            <svg
              viewBox="0 0 100 100"
              style={{
                width: '100%',
                height: '100%',
                position: 'absolute',
                top: 0,
                left: 0,
              }}
            >
              {/* Background Arc */}
              <path
                d="M 22 78 A 40 40 0 1 1 78 78"
                fill="none"
                stroke="rgba(255, 255, 255, 0.08)"
                strokeWidth="3.5"
                strokeLinecap="round"
              />

              {/* Active Value Arc */}
              <path
                d="M 22 78 A 40 40 0 1 1 78 78"
                fill="none"
                stroke={accentColor}
                strokeWidth="3.5"
                strokeLinecap="round"
                strokeDasharray="188"
                strokeDashoffset={188 * (1 - ratio * 0.67)}
                style={{ transition: 'stroke-dashoffset var(--motion-value)' }}
              />

              {/* Dial Center Hub Ring */}
              <circle cx="50" cy="50" r="14" fill="none" stroke="rgba(255, 255, 255, 0.04)" strokeWidth="1" />
            </svg>

            {/* Tick Markers */}
            {ticks.map((t, idx) => (
              <div
                key={idx}
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  width: t.isMajor ? '2px' : '1px',
                  height: t.isMajor ? '7px' : '4px',
                  backgroundColor: t.isActive ? accentColor : 'rgba(255, 255, 255, 0.25)',
                  transformOrigin: 'bottom center',
                  transform: `translate(-50%, -100%) rotate(${t.angle}deg) translateY(-36px)`,
                  transition: 'background-color var(--motion-fast)',
                }}
              />
            ))}

            {/* Needle with Cast Shadow */}
            <div
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                width: '3px',
                height: '38px',
                transformOrigin: 'bottom center',
                transform: `translate(-50%, -100%) rotate(${needleAngle}deg)`,
                transition: 'transform var(--motion-value)',
                filter: 'drop-shadow(2px 3px 2px rgba(0, 0, 0, 0.75))',
                zIndex: 2,
              }}
            >
              {/* Tapered Needle Blade */}
              <div
                style={{
                  width: '100%',
                  height: '100%',
                  background: `linear-gradient(to top, #e2e8f0 0%, ${accentColor} 100%)`,
                  borderRadius: '2px 2px 0 0',
                }}
              />
            </div>

            {/* Center Pivot Cap (metallic with highlight) */}
            <div
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: '14px',
                height: '14px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #64748b 0%, #334155 50%, #1e293b 100%)',
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.6), inset 0 1px 1px rgba(255, 255, 255, 0.4)',
                border: '1px solid rgba(0, 0, 0, 0.6)',
                zIndex: 3,
              }}
            >
              {/* Tiny specular dot */}
              <div
                style={{
                  position: 'absolute',
                  top: '3px',
                  left: '3px',
                  width: '3px',
                  height: '3px',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(255, 255, 255, 0.85)',
                }}
              />
            </div>

            {/* Convex Glass Glare Reflection (Top-left diagonal gloss) */}
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.12) 0%, rgba(255, 255, 255, 0.02) 45%, transparent 60%)',
                borderRadius: '50%',
                pointerEvents: 'none',
                zIndex: 4,
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
