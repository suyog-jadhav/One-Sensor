import React from 'react';

/**
 * Tier 1 — Signature Instrument: 3D Precision Thermometer
 * Glass tube with specular reflection streak, fluid column with meniscus,
 * metallic base bulb, tick marks, and grounding shadow.
 */
export function Thermometer3DVisual({ value = 25, min = 0, max = 50, color = 'var(--color-danger)' }) {
  const clamped = Math.min(Math.max(value, min), max);
  const ratio = (clamped - min) / (max - min || 1);
  const fillPct = Math.round(ratio * 100);

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '116px', margin: '6px 0 10px' }}>
      <div style={{ position: 'relative', width: '60px', height: '106px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        {/* Grounding Shadow */}
        <div
          style={{
            position: 'absolute',
            bottom: '0px',
            width: '46px',
            height: '10px',
            borderRadius: '50%',
            background: 'radial-gradient(ellipse at center, rgba(0, 0, 0, 0.7) 0%, rgba(0, 0, 0, 0) 70%)',
            filter: 'blur(3px)',
            pointerEvents: 'none',
          }}
        />

        {/* Thermometer Stem Outer Glass Tube */}
        <div
          style={{
            position: 'relative',
            width: '18px',
            height: '76px',
            borderRadius: '9px 9px 4px 4px',
            background: 'linear-gradient(to right, rgba(255, 255, 255, 0.15) 0%, rgba(255, 255, 255, 0.03) 30%, rgba(0, 0, 0, 0.4) 100%)',
            boxShadow: 'inset 0 1px 2px rgba(255, 255, 255, 0.3), inset 0 -1px 2px rgba(0, 0, 0, 0.6), 0 2px 8px rgba(0, 0, 0, 0.4)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            padding: '2px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-end',
            alignItems: 'center',
            overflow: 'hidden',
            zIndex: 2,
          }}
        >
          {/* Glass Specular Glare Streak (Top-left lighting) */}
          <div
            style={{
              position: 'absolute',
              top: '4px',
              left: '3px',
              width: '2px',
              height: '66px',
              borderRadius: '1px',
              background: 'linear-gradient(to bottom, rgba(255, 255, 255, 0.7) 0%, rgba(255, 255, 255, 0.1) 80%)',
              zIndex: 5,
              pointerEvents: 'none',
            }}
          />

          {/* Fluid Column with Meniscus */}
          <div
            style={{
              width: '10px',
              height: `${Math.max(fillPct, 6)}%`,
              borderRadius: '4px 4px 0 0',
              background: `linear-gradient(to right, #f87171 0%, ${color} 60%, #b91c1c 100%)`,
              boxShadow: `0 0 8px ${color}66`,
              transition: 'height var(--motion-value)',
              position: 'relative',
            }}
          >
            {/* Liquid Meniscus Cap */}
            <div
              style={{
                position: 'absolute',
                top: '-2px',
                left: 0,
                right: 0,
                height: '4px',
                borderRadius: '50%',
                backgroundColor: '#fca5a5',
              }}
            />
          </div>
        </div>

        {/* Metallic & Fluid Bulb Base */}
        <div
          style={{
            position: 'relative',
            marginTop: '-6px',
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            background: `radial-gradient(circle at 35% 30%, #fca5a5 0%, ${color} 45%, #991b1b 85%, #450a0a 100%)`,
            boxShadow: `0 3px 8px rgba(0, 0, 0, 0.6), inset 0 2px 3px rgba(255, 255, 255, 0.4), 0 0 12px ${color}44`,
            border: '1px solid rgba(255, 255, 255, 0.2)',
            zIndex: 3,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {/* Bulb Specular Highlight */}
          <div
            style={{
              position: 'absolute',
              top: '5px',
              left: '7px',
              width: '8px',
              height: '6px',
              borderRadius: '50%',
              background: 'radial-gradient(ellipse, rgba(255, 255, 255, 0.8) 0%, rgba(255, 255, 255, 0) 100%)',
              transform: 'rotate(-25deg)',
            }}
          />
        </div>

        {/* Graduated Scale Ticks alongside stem */}
        <div style={{ position: 'absolute', left: '6px', top: '10px', height: '62px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          {[50, 40, 30, 20, 10, 0].map(tick => (
            <div key={tick} style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
              <div style={{ width: '4px', height: '1px', backgroundColor: 'rgba(255, 255, 255, 0.25)' }} />
              <span style={{ fontSize: '8px', fontFamily: 'var(--font-mono)', color: 'var(--text-dim)', lineHeight: 1 }}>{tick}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Tier 1 — Signature Instrument: 3D Precision Hygrometer
 * Metallic bezel, radial moisture scale, counterbalanced needle with drop shadow.
 */
export function HumidityDial3DVisual({ value = 50, min = 0, max = 100, color = 'var(--color-cyan)' }) {
  const clamped = Math.min(Math.max(value, min), max);
  const ratio = (clamped - min) / (max - min || 1);
  const needleAngle = -120 + ratio * 240;

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '116px', margin: '6px 0 10px' }}>
      <div style={{ position: 'relative', width: '124px', height: '112px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        {/* Grounding Shadow */}
        <div
          style={{
            position: 'absolute',
            bottom: '2px',
            width: '94px',
            height: '12px',
            borderRadius: '50%',
            background: 'radial-gradient(ellipse at center, rgba(0, 0, 0, 0.65) 0%, rgba(0, 0, 0, 0) 70%)',
            filter: 'blur(3px)',
            pointerEvents: 'none',
          }}
        />

        {/* Brushed Bezel Ring */}
        <div
          style={{
            position: 'relative',
            width: '108px',
            height: '108px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #475569 0%, #1e293b 50%, #0f172a 100%)',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.6), inset 0 1px 1px rgba(255, 255, 255, 0.3)',
            padding: '6px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {/* Recessed Dial Surface */}
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
            {/* SVG Arc and Tick Marks */}
            <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0 }}>
              <path d="M 22 78 A 40 40 0 1 1 78 78" fill="none" stroke="rgba(255, 255, 255, 0.08)" strokeWidth="3" strokeLinecap="round" />
              <path
                d="M 22 78 A 40 40 0 1 1 78 78"
                fill="none"
                stroke={color}
                strokeWidth="3.5"
                strokeLinecap="round"
                strokeDasharray="188"
                strokeDashoffset={188 * (1 - ratio * 0.67)}
                style={{ transition: 'stroke-dashoffset var(--motion-value)' }}
              />
            </svg>

            {/* Needle */}
            <div
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                width: '3px',
                height: '35px',
                transformOrigin: 'bottom center',
                transform: `translate(-50%, -100%) rotate(${needleAngle}deg)`,
                transition: 'transform var(--motion-value)',
                filter: 'drop-shadow(2px 3px 2px rgba(0, 0, 0, 0.8))',
                zIndex: 2,
              }}
            >
              <div style={{ width: '100%', height: '100%', background: `linear-gradient(to top, #fff 0%, ${color} 100%)`, borderRadius: '2px' }} />
            </div>

            {/* Pivot Cap */}
            <div
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: '12px',
                height: '12px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #64748b 0%, #1e293b 100%)',
                boxShadow: '0 2px 4px rgba(0,0,0,0.6), inset 0 1px 1px rgba(255,255,255,0.4)',
                zIndex: 3,
              }}
            />

            {/* Glass Lens Glare */}
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.12) 0%, transparent 60%)',
                borderRadius: '50%',
                pointerEvents: 'none',
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Tier 1 — Signature Instrument: 3D Gas Canister / Ionization Chamber
 * Cylindrical metal housing with mesh grill and internal glowing core that responds to ppm.
 */
export function GasCanister3DVisual({ value = 300, min = 0, max = 1000, color = 'var(--color-warning)' }) {
  const clamped = Math.min(Math.max(value, min), max);
  const intensity = (clamped - min) / (max - min || 1);

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '116px', margin: '6px 0 10px' }}>
      <div style={{ position: 'relative', width: '90px', height: '106px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        {/* Grounding Shadow */}
        <div
          style={{
            position: 'absolute',
            bottom: '2px',
            width: '74px',
            height: '12px',
            borderRadius: '50%',
            background: 'radial-gradient(ellipse at center, rgba(0, 0, 0, 0.7) 0%, rgba(0, 0, 0, 0) 70%)',
            filter: 'blur(3px)',
            pointerEvents: 'none',
          }}
        />

        {/* Mesh Canister Dome */}
        <div
          style={{
            position: 'relative',
            width: '64px',
            height: '62px',
            borderRadius: '32px 32px 8px 8px',
            background: 'radial-gradient(circle at 35% 25%, #475569 0%, #1e293b 60%, #0f172a 100%)',
            boxShadow: 'inset 0 2px 4px rgba(255, 255, 255, 0.25), 0 4px 12px rgba(0, 0, 0, 0.6)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
          }}
        >
          {/* Wire Mesh Texture Overlay */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundImage: 'radial-gradient(rgba(255, 255, 255, 0.15) 1px, transparent 1px)',
              backgroundSize: '4px 4px',
              opacity: 0.8,
            }}
          />

          {/* Internal Ionization Filament (glows proportionally to gas concentration) */}
          <div
            style={{
              width: '26px',
              height: '26px',
              borderRadius: '50%',
              background: `radial-gradient(circle, #fff 0%, ${color} 50%, transparent 100%)`,
              opacity: 0.3 + intensity * 0.7,
              boxShadow: `0 0 ${10 + intensity * 18}px ${color}`,
              transition: 'opacity var(--motion-value), box-shadow var(--motion-value)',
            }}
          />

          {/* Top-Left Dome Specular Curve */}
          <div
            style={{
              position: 'absolute',
              top: '4px',
              left: '8px',
              width: '46px',
              height: '18px',
              borderRadius: '50%',
              borderTop: '2px solid rgba(255, 255, 255, 0.45)',
              transform: 'rotate(-15deg)',
              pointerEvents: 'none',
            }}
          />
        </div>

        {/* Anodized Hex Collar Base */}
        <div
          style={{
            position: 'relative',
            width: '74px',
            height: '18px',
            marginTop: '-2px',
            borderRadius: '4px',
            background: 'linear-gradient(to right, #1e293b 0%, #334155 30%, #475569 50%, #1e293b 100%)',
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.5), inset 0 1px 1px rgba(255, 255, 255, 0.2)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            justifyContent: 'space-around',
            alignItems: 'center',
            padding: '0 6px',
          }}
        >
          {/* Subtle screw pins */}
          <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#0f172a', border: '1px solid rgba(255,255,255,0.2)' }} />
          <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#0f172a', border: '1px solid rgba(255,255,255,0.2)' }} />
          <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#0f172a', border: '1px solid rgba(255,255,255,0.2)' }} />
        </div>
      </div>
    </div>
  );
}

/**
 * Tier 1 — Signature Instrument: 3D Photometer / Optical Lux Dome
 * Hemispherical optical collector with concentric Fresnel lens rings and dynamic radiance.
 */
export function Photometer3DVisual({ value = 500, min = 0, max = 1000, color = 'var(--color-warning)' }) {
  const clamped = Math.min(Math.max(value, min), max);
  const intensity = (clamped - min) / (max - min || 1);

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '116px', margin: '6px 0 10px' }}>
      <div style={{ position: 'relative', width: '100px', height: '106px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        {/* Grounding Shadow */}
        <div
          style={{
            position: 'absolute',
            bottom: '2px',
            width: '80px',
            height: '12px',
            borderRadius: '50%',
            background: 'radial-gradient(ellipse at center, rgba(0, 0, 0, 0.65) 0%, rgba(0, 0, 0, 0) 70%)',
            filter: 'blur(3px)',
            pointerEvents: 'none',
          }}
        />

        {/* Optical Sensor Bezel */}
        <div
          style={{
            position: 'relative',
            width: '86px',
            height: '86px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #334155 0%, #1e293b 60%, #0f172a 100%)',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5), inset 0 1px 1px rgba(255, 255, 255, 0.25)',
            padding: '6px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {/* Inner Convex Lens */}
          <div
            style={{
              position: 'relative',
              width: '100%',
              height: '100%',
              borderRadius: '50%',
              background: `radial-gradient(circle at 40% 35%, rgba(255,255,255,0.2) 0%, #182030 65%, #0b0f17 100%)`,
              boxShadow: 'inset 0 3px 6px rgba(0, 0, 0, 0.8)',
              overflow: 'hidden',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {/* Concentric Fresnel Rings */}
            <div style={{ position: 'absolute', width: '56px', height: '56px', borderRadius: '50%', border: '1px solid rgba(255, 255, 255, 0.08)' }} />
            <div style={{ position: 'absolute', width: '40px', height: '40px', borderRadius: '50%', border: '1px solid rgba(255, 255, 255, 0.08)' }} />
            <div style={{ position: 'absolute', width: '24px', height: '24px', borderRadius: '50%', border: '1px solid rgba(255, 255, 255, 0.1)' }} />

            {/* Core Luminescence Aperture (radiates proportional to lux) */}
            <div
              style={{
                width: '18px',
                height: '18px',
                borderRadius: '50%',
                background: `radial-gradient(circle, #fff 0%, ${color} 70%, transparent 100%)`,
                opacity: 0.35 + intensity * 0.65,
                boxShadow: `0 0 ${12 + intensity * 16}px ${color}`,
                transition: 'all var(--motion-value)',
              }}
            />

            {/* Specular Curved Glare */}
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.18) 0%, transparent 55%)',
                borderRadius: '50%',
                pointerEvents: 'none',
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Tier 1 — Signature Instrument: 3D Soil Moisture Capacitive Probe
 * Soil container with dual PCB electrodes and liquid saturation horizon.
 */
export function SoilProbe3DVisual({ value = 50, min = 0, max = 100, color = 'var(--color-success)' }) {
  const clamped = Math.min(Math.max(value, min), max);
  const satRatio = (clamped - min) / (max - min || 1);
  const satPct = Math.round(satRatio * 100);

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '116px', margin: '6px 0 10px' }}>
      <div style={{ position: 'relative', width: '90px', height: '106px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        {/* Grounding Shadow */}
        <div
          style={{
            position: 'absolute',
            bottom: '2px',
            width: '76px',
            height: '12px',
            borderRadius: '50%',
            background: 'radial-gradient(ellipse at center, rgba(0, 0, 0, 0.65) 0%, rgba(0, 0, 0, 0) 70%)',
            filter: 'blur(3px)',
            pointerEvents: 'none',
          }}
        />

        {/* Dual PCB Probe Prongs (Inserted from top) */}
        <div style={{ display: 'flex', gap: '8px', zIndex: 1, marginBottom: '-8px' }}>
          <div
            style={{
              width: '8px',
              height: '34px',
              background: 'linear-gradient(to right, #334155, #1e293b)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '2px 2px 0 0',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {/* Gold immersion contact trace */}
            <div style={{ position: 'absolute', bottom: 0, left: '2px', right: '2px', height: '12px', background: '#eab308', opacity: 0.8 }} />
          </div>
          <div
            style={{
              width: '8px',
              height: '34px',
              background: 'linear-gradient(to right, #334155, #1e293b)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '2px 2px 0 0',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {/* Gold immersion contact trace */}
            <div style={{ position: 'absolute', bottom: 0, left: '2px', right: '2px', height: '12px', background: '#eab308', opacity: 0.8 }} />
          </div>
        </div>

        {/* Soil Sample Vessel / Substrate Block */}
        <div
          style={{
            position: 'relative',
            width: '68px',
            height: '52px',
            borderRadius: '6px',
            background: 'linear-gradient(135deg, #1f2937 0%, #111827 100%)',
            boxShadow: '0 4px 10px rgba(0, 0, 0, 0.5), inset 0 1px 1px rgba(255, 255, 255, 0.1)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-end',
            zIndex: 2,
          }}
        >
          {/* Earth Texture Stipple */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundImage: 'radial-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px)',
              backgroundSize: '5px 5px',
            }}
          />

          {/* Moisture Saturation Column */}
          <div
            style={{
              width: '100%',
              height: `${Math.max(satPct, 8)}%`,
              background: `linear-gradient(to top, rgba(16, 185, 129, 0.55) 0%, rgba(56, 189, 248, 0.25) 100%)`,
              borderTop: `2px solid ${color}`,
              boxShadow: `0 0 10px ${color}44`,
              transition: 'height var(--motion-value)',
              position: 'relative',
            }}
          />

          {/* Front Bevel Highlight */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '1px',
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
            }}
          />
        </div>
      </div>
    </div>
  );
}
