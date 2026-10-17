import React, { useMemo } from 'react';
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
  Activity,
  Layers,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';

/* ─────────────────────────────────────────────────────────────────────────────
   1. TEMPERATURE 2D INSTRUMENT (PRECISION MERCURY/ALCOHOL GLASS THERMOMETER)
───────────────────────────────────────────────────────────────────────────── */
export function Thermometer2DVisual({ value = 25, min = 0, max = 50, color = '#ef4444' }) {
  const clamped = Math.min(Math.max(value, min), max);
  const ratio = (clamped - min) / (max - min || 1);
  const fillPct = Math.max(6, Math.min(100, Math.round(ratio * 100)));

  // Dynamic heat aura based on temperature
  const glowIntensity = 10 + ratio * 24;
  const bulbColor = ratio > 0.7 ? '#ef4444' : ratio > 0.4 ? '#f97316' : ratio > 0.2 ? '#eab308' : '#38bdf8';

  const ticks = [50, 40, 30, 20, 10, 0];

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', minHeight: '230px', width: '100%', padding: '12px' }}>
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: '18px' }}>
        {/* Scale Ticks alongside stem */}
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '150px', paddingRight: '4px' }}>
          {ticks.map(tick => {
            const isMatch = Math.abs(clamped - tick) < 5;
            return (
              <div key={tick} style={{ display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'flex-end' }}>
                <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: isMatch ? '#fff' : 'var(--text-dim)', fontWeight: isMatch ? '700' : '500' }}>
                  {tick}°
                </span>
                <div style={{ width: tick % 20 === 0 ? '8px' : '4px', height: '1.5px', backgroundColor: isMatch ? bulbColor : 'rgba(255, 255, 255, 0.2)' }} />
              </div>
            );
          })}
        </div>

        {/* Thermometer Stem + Base Bulb */}
        <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          {/* Stem Outer Glass Tube */}
          <div
            style={{
              position: 'relative',
              width: '22px',
              height: '146px',
              borderRadius: '11px 11px 4px 4px',
              background: 'linear-gradient(to right, rgba(255, 255, 255, 0.12) 0%, rgba(255, 255, 255, 0.02) 30%, rgba(0, 0, 0, 0.45) 100%)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              boxShadow: 'inset 0 1px 3px rgba(255, 255, 255, 0.35), inset 0 -1px 3px rgba(0, 0, 0, 0.7), 0 4px 14px rgba(0, 0, 0, 0.6)',
              padding: '3px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'flex-end',
              alignItems: 'center',
              overflow: 'hidden',
              zIndex: 2,
            }}
          >
            {/* Specular glare streak */}
            <div
              style={{
                position: 'absolute',
                top: '4px',
                left: '3px',
                width: '3px',
                height: '136px',
                borderRadius: '2px',
                background: 'linear-gradient(to bottom, rgba(255, 255, 255, 0.75) 0%, rgba(255, 255, 255, 0.05) 85%)',
                zIndex: 6,
                pointerEvents: 'none',
              }}
            />

            {/* Rising Fluid Column */}
            <div
              style={{
                width: '12px',
                height: `${fillPct}%`,
                borderRadius: '5px 5px 0 0',
                background: `linear-gradient(to right, #fca5a5 0%, ${bulbColor} 55%, #991b1b 100%)`,
                boxShadow: `0 0 14px ${bulbColor}88`,
                transition: 'height var(--motion-value), background var(--motion-standard)',
                position: 'relative',
              }}
            >
              {/* Meniscus Cap */}
              <div
                style={{
                  position: 'absolute',
                  top: '-3px',
                  left: 0,
                  right: 0,
                  height: '5px',
                  borderRadius: '50%',
                  backgroundColor: '#fee2e2',
                  boxShadow: '0 0 4px #ffffff',
                }}
              />
            </div>
          </div>

          {/* Bottom Reservoir Bulb */}
          <div
            style={{
              position: 'relative',
              marginTop: '-8px',
              width: '42px',
              height: '42px',
              borderRadius: '50%',
              background: `radial-gradient(circle at 35% 30%, #fecaca 0%, ${bulbColor} 45%, #7f1d1d 90%, #450a0a 100%)`,
              boxShadow: `0 4px 14px rgba(0, 0, 0, 0.7), inset 0 2px 4px rgba(255, 255, 255, 0.45), 0 0 ${glowIntensity}px ${bulbColor}66`,
              border: '1px solid rgba(255, 255, 255, 0.25)',
              zIndex: 3,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'box-shadow var(--motion-value), background var(--motion-standard)',
            }}
          >
            {/* Bulb specular reflection */}
            <div
              style={{
                position: 'absolute',
                top: '7px',
                left: '9px',
                width: '10px',
                height: '7px',
                borderRadius: '50%',
                background: 'radial-gradient(ellipse, rgba(255, 255, 255, 0.85) 0%, rgba(255, 255, 255, 0) 100%)',
                transform: 'rotate(-25deg)',
                pointerEvents: 'none',
              }}
            />
          </div>

          {/* Grounding Shadow */}
          <div
            style={{
              marginTop: '4px',
              width: '54px',
              height: '8px',
              borderRadius: '50%',
              background: 'radial-gradient(ellipse, rgba(0, 0, 0, 0.7) 0%, transparent 70%)',
              filter: 'blur(3px)',
            }}
          />
        </div>

        {/* Ambient status indicator */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', textAlign: 'left' }}>
          <div style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
            STATE
          </div>
          <div style={{ fontSize: '12px', fontWeight: '700', color: bulbColor, fontFamily: 'var(--font-mono)' }}>
            {clamped >= 40 ? 'HEAT CRITICAL' : clamped >= 28 ? 'WARM AMBIENT' : clamped >= 18 ? 'NOMINAL ROOM' : 'COOL CELL'}
          </div>
          <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
            Target: <strong>{clamped.toFixed(1)} °C</strong>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   2. LIGHT SENSOR 2D INSTRUMENT (LUMINOUS GLOW BULB & OPTICAL HALO)
───────────────────────────────────────────────────────────────────────────── */
export function LightGlow2DVisual({ value = 500, min = 0, max = 2000, color = '#eab308' }) {
  const clamped = Math.min(Math.max(value, min), max);
  const ratio = (clamped - min) / (max - min || 1);
  const bloomPx = Math.round(12 + ratio * 48);
  const coreAlpha = (0.25 + ratio * 0.75).toFixed(2);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', minHeight: '230px', width: '100%', padding: '12px' }}>
      <div style={{ position: 'relative', width: '170px', height: '170px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {/* Outer Radiating Aura Rings */}
        <div
          style={{
            position: 'absolute',
            width: `${120 + ratio * 46}px`,
            height: `${120 + ratio * 46}px`,
            borderRadius: '50%',
            background: `radial-gradient(circle, rgba(234, 179, 8, ${ratio * 0.28}) 0%, rgba(234, 179, 8, 0.04) 60%, transparent 80%)`,
            transition: 'all var(--motion-value)',
            pointerEvents: 'none',
          }}
        />

        <div
          style={{
            position: 'absolute',
            width: `${90 + ratio * 32}px`,
            height: `${90 + ratio * 32}px`,
            borderRadius: '50%',
            background: `radial-gradient(circle, rgba(254, 240, 138, ${ratio * 0.45}) 0%, rgba(234, 179, 8, 0.15) 65%, transparent 100%)`,
            boxShadow: `0 0 ${bloomPx}px rgba(234, 179, 8, ${ratio * 0.7})`,
            transition: 'all var(--motion-value)',
            pointerEvents: 'none',
          }}
        />

        {/* Realistic Light Bulb Glass Body */}
        <div
          style={{
            position: 'relative',
            width: '76px',
            height: '92px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            zIndex: 2,
          }}
        >
          {/* Glass Dome */}
          <div
            style={{
              position: 'relative',
              width: '64px',
              height: '64px',
              borderRadius: '50% 50% 35% 35%',
              background: `radial-gradient(circle at 45% 40%, rgba(255, 255, 255, 0.9) 0%, rgba(254, 240, 138, ${coreAlpha}) 40%, rgba(234, 179, 8, ${coreAlpha * 0.7}) 75%, rgba(30, 41, 59, 0.8) 100%)`,
              border: '1px solid rgba(255, 255, 255, 0.35)',
              boxShadow: `inset 0 2px 6px rgba(255, 255, 255, 0.6), 0 0 ${bloomPx}px ${color}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
              transition: 'box-shadow var(--motion-value), background var(--motion-fast)',
            }}
          >
            {/* Filament Loop that burns hot */}
            <svg viewBox="0 0 40 40" style={{ width: '32px', height: '32px', opacity: 0.6 + ratio * 0.4 }}>
              <path
                d="M 14 26 L 17 14 Q 20 9 23 14 L 26 26"
                fill="none"
                stroke={ratio > 0.4 ? '#ffffff' : '#fef08a'}
                strokeWidth="2"
                strokeLinecap="round"
                filter={ratio > 0.3 ? 'drop-shadow(0 0 3px #fef08a)' : 'none'}
              />
              <circle cx="20" cy="14" r={2 + ratio * 3} fill="#fff" opacity={ratio} />
            </svg>

            {/* Glass Glare arc */}
            <div
              style={{
                position: 'absolute',
                top: '6px',
                left: '8px',
                width: '18px',
                height: '14px',
                borderRadius: '50%',
                borderTop: '2px solid rgba(255, 255, 255, 0.75)',
                borderLeft: '1.5px solid rgba(255, 255, 255, 0.4)',
                transform: 'rotate(-25deg)',
                pointerEvents: 'none',
              }}
            />
          </div>

          {/* Brass Screw Collar Base */}
          <div
            style={{
              position: 'relative',
              width: '28px',
              height: '18px',
              marginTop: '-4px',
              borderRadius: '2px 2px 4px 4px',
              background: 'repeating-linear-gradient(to bottom, #ca8a04 0px, #ca8a04 3px, #713f12 3px, #713f12 5px)',
              border: '1px solid rgba(0, 0, 0, 0.5)',
              boxShadow: '0 2px 6px rgba(0, 0, 0, 0.6)',
              zIndex: 3,
            }}
          />
          {/* Black Contact Tip */}
          <div style={{ width: '14px', height: '5px', borderRadius: '0 0 6px 6px', background: '#1e293b' }} />
        </div>
      </div>

      {/* Lux Intensity Readout Bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
        <Sun size={14} color={color} />
        <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: '#fff', fontWeight: '600' }}>
          {clamped >= 1500 ? 'DIRECT SUNLIGHT' : clamped >= 800 ? 'BRIGHT INDOOR' : clamped >= 300 ? 'NORMAL OFFICE' : 'DIM / SHADOW'}
        </span>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   3. PRECISION 240° ANALOG DIAL GAUGE (HUMIDITY, CO2, UV, ETC.)
───────────────────────────────────────────────────────────────────────────── */
export function PrecisionDial2DVisual({
  value = 50,
  min = 0,
  max = 100,
  unit = '%',
  color = '#06b6d4',
  zones = null, // [{ label: 'DRY', upTo: 30, color: '#38bdf8' }, ...]
  label = 'HYGROMETER',
}) {
  const clamped = Math.min(Math.max(value, min), max);
  const ratio = (clamped - min) / (max - min || 1);
  const needleAngle = -120 + ratio * 240;

  // Arc path geometry: radius 48, center (60, 60), sweep 240 deg
  const ticks = useMemo(() => {
    const arr = [];
    const count = 9;
    for (let i = 0; i < count; i++) {
      const t = i / (count - 1);
      const angle = -120 + t * 240;
      const rad = ((angle - 90) * Math.PI) / 180;
      const x1 = 65 + 46 * Math.cos(rad);
      const y1 = 65 + 46 * Math.sin(rad);
      const x2 = 65 + (i % 2 === 0 ? 38 : 41) * Math.cos(rad);
      const y2 = 65 + (i % 2 === 0 ? 38 : 41) * Math.sin(rad);
      const val = Math.round(min + t * (max - min));
      arr.push({ x1, y1, x2, y2, val, isMajor: i % 2 === 0, angle });
    }
    return arr;
  }, [min, max]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', minHeight: '230px', width: '100%', padding: '12px' }}>
      <div style={{ position: 'relative', width: '150px', height: '150px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {/* Outer Brushed Metallic Bezel Ring */}
        <div
          style={{
            position: 'relative',
            width: '144px',
            height: '144px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #475569 0%, #1e293b 50%, #0f172a 100%)',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.7), inset 0 1px 1px rgba(255, 255, 255, 0.35)',
            padding: '7px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {/* Recessed Dial Face Surface */}
          <div
            style={{
              position: 'relative',
              width: '100%',
              height: '100%',
              borderRadius: '50%',
              background: 'radial-gradient(circle at 40% 35%, #182030 0%, #090d16 100%)',
              boxShadow: 'inset 0 3px 8px rgba(0, 0, 0, 0.85), inset 0 0 0 1px rgba(255, 255, 255, 0.05)',
              overflow: 'hidden',
            }}
          >
            {/* SVG Arc and Tick Marks */}
            <svg viewBox="0 0 130 130" style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0 }}>
              {/* Background Arc Track */}
              <path
                d="M 28 98 A 46 46 0 1 1 102 98"
                fill="none"
                stroke="rgba(255, 255, 255, 0.1)"
                strokeWidth="4"
                strokeLinecap="round"
              />

              {/* Active Progress Arc */}
              <path
                d="M 28 98 A 46 46 0 1 1 102 98"
                fill="none"
                stroke={color}
                strokeWidth="4.5"
                strokeLinecap="round"
                strokeDasharray="210"
                strokeDashoffset={210 * (1 - ratio * 0.72)}
                style={{ transition: 'stroke-dashoffset var(--motion-value)' }}
              />

              {/* Ticks */}
              {ticks.map((t, idx) => (
                <line
                  key={idx}
                  x1={t.x1}
                  y1={t.y1}
                  x2={t.x2}
                  y2={t.y2}
                  stroke={t.isMajor ? '#ffffff' : 'rgba(255, 255, 255, 0.4)'}
                  strokeWidth={t.isMajor ? '2' : '1'}
                />
              ))}
            </svg>

            {/* Precision Needle with Cast Shadow */}
            <div
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                width: '3.5px',
                height: '48px',
                transformOrigin: 'bottom center',
                transform: `translate(-50%, -100%) rotate(${needleAngle}deg)`,
                transition: 'transform var(--motion-value)',
                filter: 'drop-shadow(2px 3px 3px rgba(0, 0, 0, 0.85))',
                zIndex: 4,
              }}
            >
              <div
                style={{
                  width: '100%',
                  height: '100%',
                  background: `linear-gradient(to top, #ffffff 0%, ${color} 100%)`,
                  borderRadius: '2px 2px 0 0',
                }}
              />
            </div>

            {/* Center Pivot Cap */}
            <div
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: '16px',
                height: '16px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #94a3b8 0%, #1e293b 100%)',
                boxShadow: '0 2px 6px rgba(0,0,0,0.8), inset 0 1px 1px rgba(255,255,255,0.6)',
                zIndex: 5,
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
                background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.16) 0%, transparent 60%)',
                borderRadius: '50%',
                pointerEvents: 'none',
              }}
            />
          </div>
        </div>
      </div>

      {/* Label & Active Readout Below Dial */}
      <div style={{ marginTop: '6px', textAlign: 'center' }}>
        <div style={{ fontSize: '10px', color: 'var(--text-dim)', letterSpacing: '0.06em', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>
          {label}
        </div>
        <div style={{ fontSize: '13px', fontWeight: '700', color: color, fontFamily: 'var(--font-mono)' }}>
          {clamped.toFixed(max <= 15 ? 1 : 0)} {unit}
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   4. GAS SENSOR 2D INSTRUMENT (MQ-2 CANISTER & IONIZATION FILAMENT)
───────────────────────────────────────────────────────────────────────────── */
export function GasCanister2DVisual({ value = 300, min = 0, max = 1000, color = '#ea580c' }) {
  const clamped = Math.min(Math.max(value, min), max);
  const ratio = (clamped - min) / (max - min || 1);
  const glowIntensity = Math.round(8 + ratio * 28);
  const coreBrightness = (0.3 + ratio * 0.7).toFixed(2);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', minHeight: '230px', width: '100%', padding: '12px' }}>
      <div style={{ position: 'relative', width: '120px', height: '130px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        {/* Metal Canister Dome Housing */}
        <div
          style={{
            position: 'relative',
            width: '84px',
            height: '76px',
            borderRadius: '42px 42px 10px 10px',
            background: 'radial-gradient(circle at 35% 25%, #475569 0%, #1e293b 60%, #0f172a 100%)',
            boxShadow: 'inset 0 2px 5px rgba(255, 255, 255, 0.3), 0 6px 18px rgba(0, 0, 0, 0.7)',
            border: '1px solid rgba(255, 255, 255, 0.18)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
          }}
        >
          {/* Wire Mesh Grid Pattern Overlay */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundImage: 'radial-gradient(rgba(255, 255, 255, 0.2) 1px, transparent 1px)',
              backgroundSize: '5px 5px',
              opacity: 0.85,
            }}
          />

          {/* Internal Ionization Heating Filament Core */}
          <div
            style={{
              position: 'relative',
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              background: `radial-gradient(circle, #ffffff 0%, ${color} 55%, transparent 100%)`,
              opacity: coreBrightness,
              boxShadow: `0 0 ${glowIntensity}px ${color}`,
              transition: 'all var(--motion-value)',
            }}
          />

          {/* Dome Curved Specular Reflection */}
          <div
            style={{
              position: 'absolute',
              top: '6px',
              left: '12px',
              width: '56px',
              height: '24px',
              borderRadius: '50%',
              borderTop: '2px solid rgba(255, 255, 255, 0.55)',
              transform: 'rotate(-12deg)',
              pointerEvents: 'none',
            }}
          />
        </div>

        {/* Anodized Hex Collar Base with Solder Pins */}
        <div
          style={{
            position: 'relative',
            width: '98px',
            height: '22px',
            marginTop: '-3px',
            borderRadius: '4px',
            background: 'linear-gradient(to right, #1e293b 0%, #334155 35%, #475569 50%, #1e293b 100%)',
            boxShadow: '0 3px 8px rgba(0, 0, 0, 0.6), inset 0 1px 1px rgba(255, 255, 255, 0.25)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            display: 'flex',
            justifyContent: 'space-around',
            alignItems: 'center',
            padding: '0 8px',
          }}
        >
          <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#0f172a', border: '1px solid rgba(255,255,255,0.3)' }} />
          <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#0f172a', border: '1px solid rgba(255,255,255,0.3)' }} />
          <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#0f172a', border: '1px solid rgba(255,255,255,0.3)' }} />
        </div>

        {/* Canister Grounding Shadow */}
        <div
          style={{
            marginTop: '3px',
            width: '88px',
            height: '8px',
            borderRadius: '50%',
            background: 'radial-gradient(ellipse, rgba(0, 0, 0, 0.7) 0%, transparent 70%)',
            filter: 'blur(3px)',
          }}
        />
      </div>

      <div style={{ marginTop: '4px', textAlign: 'center' }}>
        <div style={{ fontSize: '11px', fontWeight: '700', color: color, fontFamily: 'var(--font-mono)' }}>
          {clamped >= 700 ? 'HIGH COMBUSTIBLE RISK' : clamped >= 400 ? 'ELEVATED GAS DETECTED' : 'AIR CLEAN / NOMINAL'}
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   5. SOIL MOISTURE 2D INSTRUMENT (STRATUM CONTAINER & WATER SATURATION)
───────────────────────────────────────────────────────────────────────────── */
export function SoilMoisture2DVisual({ value = 50, min = 0, max = 100, color = '#10b981' }) {
  const clamped = Math.min(Math.max(value, min), max);
  const ratio = (clamped - min) / (max - min || 1);
  const fillPct = Math.max(8, Math.round(ratio * 100));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', minHeight: '230px', width: '100%', padding: '12px' }}>
      <div style={{ position: 'relative', width: '110px', height: '140px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        {/* Dual Gold-Plated Immersion Electrodes (Inserted from top) */}
        <div style={{ display: 'flex', gap: '14px', zIndex: 1, marginBottom: '-10px' }}>
          {[-1, 1].map(side => (
            <div
              key={side}
              style={{
                width: '10px',
                height: '42px',
                background: 'linear-gradient(to right, #475569, #1e293b)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                borderRadius: '3px 3px 0 0',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              {/* Gold contact trace */}
              <div style={{ position: 'absolute', bottom: 0, left: '2px', right: '2px', height: '18px', background: '#eab308' }} />
            </div>
          ))}
        </div>

        {/* Soil Sample Vessel / Substrate Reservoir */}
        <div
          style={{
            position: 'relative',
            width: '84px',
            height: '74px',
            borderRadius: '8px',
            background: 'linear-gradient(135deg, #1f2937 0%, #111827 100%)',
            boxShadow: '0 6px 16px rgba(0, 0, 0, 0.6), inset 0 1px 2px rgba(255, 255, 255, 0.15)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-end',
            zIndex: 2,
          }}
        >
          {/* Earth Texture Background */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundImage: 'radial-gradient(rgba(255, 255, 255, 0.06) 1px, transparent 1px)',
              backgroundSize: '5px 5px',
            }}
          />

          {/* Moisture Saturation Column with Water Horizon */}
          <div
            style={{
              width: '100%',
              height: `${fillPct}%`,
              background: `linear-gradient(to top, rgba(16, 185, 129, 0.65) 0%, rgba(56, 189, 248, 0.35) 100%)`,
              borderTop: `2px solid ${color}`,
              boxShadow: `0 0 12px ${color}55`,
              transition: 'height var(--motion-value)',
              position: 'relative',
            }}
          >
            {/* Glistening Water Beads */}
            <div
              style={{
                position: 'absolute',
                top: '-4px',
                left: '20%',
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                background: '#38bdf8',
                boxShadow: '0 0 4px #38bdf8',
              }}
            />
            <div
              style={{
                position: 'absolute',
                top: '-3px',
                right: '25%',
                width: '5px',
                height: '5px',
                borderRadius: '50%',
                background: '#38bdf8',
                boxShadow: '0 0 4px #38bdf8',
              }}
            />
          </div>
        </div>

        {/* Vessel Grounding Shadow */}
        <div
          style={{
            marginTop: '4px',
            width: '92px',
            height: '8px',
            borderRadius: '50%',
            background: 'radial-gradient(ellipse, rgba(0, 0, 0, 0.7) 0%, transparent 70%)',
            filter: 'blur(3px)',
          }}
        />
      </div>

      <div style={{ marginTop: '4px', textAlign: 'center' }}>
        <div style={{ fontSize: '11px', fontWeight: '700', color: color, fontFamily: 'var(--font-mono)' }}>
          {clamped >= 75 ? 'SATURATED / FLOODED' : clamped >= 35 ? 'OPTIMAL MOISTURE' : 'PARCHED / DRY SOIL'}
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   6. ULTRASONIC RANGEFINDER 2D INSTRUMENT (RADAR ARCS & DISTANCE RULER)
───────────────────────────────────────────────────────────────────────────── */
export function ProximityRadar2DVisual({ value = 50, min = 2, max = 400, color = '#0284c7' }) {
  const clamped = Math.min(Math.max(value, min), max);
  const ratio = (clamped - min) / (max - min || 1);
  const targetOffsetPx = Math.round(18 + ratio * 80);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', minHeight: '230px', width: '100%', padding: '12px' }}>
      <div style={{ position: 'relative', width: '160px', height: '130px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        {/* Dual Ultrasonic Transducer Cylinders (T and R) */}
        <div style={{ display: 'flex', gap: '16px', zIndex: 3, marginBottom: '6px' }}>
          {['T', 'R'].map(type => (
            <div
              key={type}
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #e2e8f0 0%, #94a3b8 50%, #475569 100%)',
                boxShadow: '0 4px 10px rgba(0, 0, 0, 0.6), inset 0 1px 2px rgba(255, 255, 255, 0.7)',
                border: '1.5px solid #cbd5e1',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
              }}
            >
              {/* Recessed black mesh grill with letter */}
              <div
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  background: '#0f172a',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#94a3b8',
                  fontSize: '11px',
                  fontWeight: '800',
                  fontFamily: 'var(--font-mono)',
                  boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.8)',
                }}
              >
                {type}
              </div>
            </div>
          ))}
        </div>

        {/* Animated Radar Pulse Waves extending downwards */}
        <div style={{ position: 'relative', width: '120px', height: '60px', overflow: 'hidden', display: 'flex', justifyContent: 'center' }}>
          {[1, 2, 3].map(wave => (
            <div
              key={wave}
              style={{
                position: 'absolute',
                top: 0,
                width: `${30 + wave * 30}px`,
                height: `${20 + wave * 22}px`,
                borderRadius: '50%',
                borderBottom: `2px solid ${color}`,
                opacity: 0.8 - wave * 0.2,
                boxShadow: `0 3px 8px ${color}44`,
                pointerEvents: 'none',
              }}
            />
          ))}

          {/* Target Obstacle Blip Bar */}
          <div
            style={{
              position: 'absolute',
              top: `${Math.min(targetOffsetPx, 52)}px`,
              width: '80px',
              height: '4px',
              borderRadius: '2px',
              background: '#ef4444',
              boxShadow: '0 0 10px #ef4444',
              transition: 'top var(--motion-value)',
            }}
          />
        </div>
      </div>

      {/* Target Distance Readout */}
      <div style={{ marginTop: '4px', textAlign: 'center' }}>
        <div style={{ fontSize: '11px', fontWeight: '700', color: color, fontFamily: 'var(--font-mono)' }}>
          {clamped <= 15 ? 'OBSTACLE IMMINENT' : clamped <= 80 ? 'CLOSE PROXIMITY' : 'CLEAR RANGE'} ({clamped.toFixed(0)} cm)
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   7. SOUND LEVEL 2D INSTRUMENT (AUDIO VU METER & MULTI-TIER LED LADDER)
───────────────────────────────────────────────────────────────────────────── */
export function SoundVUMeter2DVisual({ value = 40, min = 30, max = 120, color = '#8b5cf6' }) {
  const clamped = Math.min(Math.max(value, min), max);
  const ratio = (clamped - min) / (max - min || 1);
  const totalLeds = 14;
  const activeLeds = Math.round(ratio * totalLeds);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', minHeight: '230px', width: '100%', padding: '12px' }}>
      <div
        style={{
          width: '130px',
          background: 'linear-gradient(135deg, #111827 0%, #0b0f17 100%)',
          borderRadius: '12px',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.7), inset 0 1px 1px rgba(255, 255, 255, 0.15)',
          padding: '12px 14px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '8px',
        }}
      >
        <div style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
          DECIBEL VU LADDER
        </div>

        {/* Segmented LED Column (Green -> Amber -> Red) */}
        <div style={{ display: 'flex', flexDirection: 'column-reverse', gap: '3px', width: '100%' }}>
          {Array.from({ length: totalLeds }).map((_, idx) => {
            const isActive = idx < activeLeds;
            const isRed = idx >= 11;
            const isYellow = idx >= 7 && idx < 11;
            const ledColor = isRed ? '#ef4444' : isYellow ? '#f59e0b' : '#10b981';

            return (
              <div
                key={idx}
                style={{
                  height: '6px',
                  borderRadius: '2px',
                  backgroundColor: isActive ? ledColor : 'rgba(255, 255, 255, 0.05)',
                  boxShadow: isActive ? `0 0 8px ${ledColor}` : 'none',
                  border: isActive ? `1px solid ${ledColor}` : '1px solid rgba(255, 255, 255, 0.03)',
                  transition: 'background-color var(--motion-instant)',
                }}
              />
            );
          })}
        </div>

        {/* Live Decibel readout */}
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginTop: '2px' }}>
          <span style={{ fontSize: '18px', fontWeight: '800', fontFamily: 'var(--font-mono)', color: '#fff' }}>
            {clamped.toFixed(1)}
          </span>
          <span style={{ fontSize: '11px', color: color, fontFamily: 'var(--font-mono)' }}>dB</span>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   8. MOTION 2D INSTRUMENTS (SPIRIT LEVEL VIAL & HORIZON TARGET)
───────────────────────────────────────────────────────────────────────────── */
export function MotionLevel2DVisual({ axis = 'X', value = 0, min = -2, max = 2, color = '#38bdf8' }) {
  const clamped = Math.min(Math.max(value, min), max);
  const ratio = (clamped - min) / (max - min || 1); // 0 to 1, 0.5 is 0g

  // For Motion Z (vertical g-force / normal gravity target)
  if (axis === 'Z') {
    const normRatio = Math.max(0, Math.min(1, (clamped - (-2)) / 4));
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', minHeight: '230px', width: '100%', padding: '12px' }}>
        <div
          style={{
            position: 'relative',
            width: '120px',
            height: '120px',
            borderRadius: '50%',
            background: 'radial-gradient(circle at 40% 35%, #182030 0%, #090d16 100%)',
            border: '2px solid rgba(255, 255, 255, 0.15)',
            boxShadow: '0 6px 18px rgba(0, 0, 0, 0.7), inset 0 2px 6px rgba(0, 0, 0, 0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {/* Concentric Gravity Rings */}
          <div style={{ position: 'absolute', width: '80px', height: '80px', borderRadius: '50%', border: '1px dashed rgba(255, 255, 255, 0.15)' }} />
          <div style={{ position: 'absolute', width: '40px', height: '40px', borderRadius: '50%', border: '1px solid rgba(255, 255, 255, 0.25)' }} />
          {/* 1.0g Normal Detent Ring */}
          <div style={{ position: 'absolute', width: '60px', height: '60px', borderRadius: '50%', border: `1.5px solid ${color}`, opacity: 0.6 }} />

          {/* Crosshairs */}
          <div style={{ position: 'absolute', width: '100px', height: '1px', background: 'rgba(255, 255, 255, 0.15)' }} />
          <div style={{ position: 'absolute', height: '100px', width: '1px', background: 'rgba(255, 255, 255, 0.15)' }} />

          {/* Glowing Gravity Center Bubble */}
          <div
            style={{
              position: 'absolute',
              width: `${16 + Math.abs(clamped) * 6}px`,
              height: `${16 + Math.abs(clamped) * 6}px`,
              borderRadius: '50%',
              background: `radial-gradient(circle, #ffffff 0%, ${color} 60%, transparent 100%)`,
              boxShadow: `0 0 12px ${color}`,
              transition: 'all var(--motion-instant)',
            }}
          />
        </div>
        <div style={{ marginTop: '8px', fontSize: '11px', fontWeight: '700', color: color, fontFamily: 'var(--font-mono)' }}>
          VERTICAL LOAD: {clamped >= 0 ? `+${clamped.toFixed(2)}` : clamped.toFixed(2)} g
        </div>
      </div>
    );
  }

  // Horizontal / Vertical Spirit Level Tube for Motion X and Motion Y
  const bubbleOffsetPct = Math.max(10, Math.min(90, Math.round(ratio * 100)));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', minHeight: '230px', width: '100%', padding: '12px' }}>
      <div
        style={{
          width: '150px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '8px',
        }}
      >
        <div style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
          {axis}-AXIS SPIRIT LEVEL
        </div>

        {/* Machined Spirit Vial Tube */}
        <div
          style={{
            position: 'relative',
            width: '140px',
            height: '32px',
            borderRadius: '16px',
            background: 'linear-gradient(to bottom, #1e293b 0%, #0f172a 100%)',
            border: '1.5px solid rgba(255, 255, 255, 0.2)',
            boxShadow: 'inset 0 2px 6px rgba(0, 0, 0, 0.8), 0 4px 12px rgba(0, 0, 0, 0.6)',
            padding: '2px',
            display: 'flex',
            alignItems: 'center',
            overflow: 'hidden',
          }}
        >
          {/* Glass vial fluid fill */}
          <div
            style={{
              position: 'absolute',
              top: '2px',
              left: '2px',
              right: '2px',
              bottom: '2px',
              borderRadius: '14px',
              background: `linear-gradient(to bottom, rgba(56, 189, 248, 0.2) 0%, rgba(14, 165, 233, 0.08) 100%)`,
            }}
          />

          {/* Tolerance Center Tick Marks */}
          <div style={{ position: 'absolute', left: '44%', top: '4px', bottom: '4px', width: '1.5px', background: 'rgba(255, 255, 255, 0.4)' }} />
          <div style={{ position: 'absolute', left: '50%', top: '2px', bottom: '2px', width: '1.5px', background: '#ffffff' }} />
          <div style={{ position: 'absolute', left: '56%', top: '4px', bottom: '4px', width: '1.5px', background: 'rgba(255, 255, 255, 0.4)' }} />

          {/* Floating Spirit Bubble */}
          <div
            style={{
              position: 'absolute',
              left: `${bubbleOffsetPct}%`,
              transform: 'translateX(-50%)',
              width: '24px',
              height: '24px',
              borderRadius: '50%',
              background: `radial-gradient(circle at 35% 35%, #ffffff 0%, ${color} 55%, rgba(30, 58, 138, 0.8) 100%)`,
              boxShadow: `0 0 10px ${color}, inset 0 1px 2px rgba(255, 255, 255, 0.7)`,
              transition: 'left var(--motion-instant)',
            }}
          />
        </div>

        {/* Readout */}
        <div style={{ fontSize: '13px', fontWeight: '700', color: color, fontFamily: 'var(--font-mono)' }}>
          {clamped >= 0 ? `+${clamped.toFixed(2)}` : clamped.toFixed(2)} g
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   MASTER ROUTER: SELECTS THE CORRESPONDING 2D INSTRUMENT PER SENSOR KEY
───────────────────────────────────────────────────────────────────────────── */
export default function Sensor2DVisual({ sensorKey, value, min, max, color, unit }) {
  switch (sensorKey) {
    case 'temperature':
      return <Thermometer2DVisual value={value} min={min} max={max} color={color} />;

    case 'light':
      return <LightGlow2DVisual value={value} min={min} max={max} color={color} />;

    case 'humidity':
      return (
        <PrecisionDial2DVisual
          value={value}
          min={min}
          max={max}
          unit={unit}
          color={color}
          label="PRECISION HYGROMETER"
        />
      );

    case 'gas':
      return <GasCanister2DVisual value={value} min={min} max={max} color={color} />;

    case 'soil':
    case 'soil_moisture':
      return <SoilMoisture2DVisual value={value} min={min} max={max} color={color} />;

    case 'proximity':
      return <ProximityRadar2DVisual value={value} min={min} max={max} color={color} />;

    case 'sound':
      return <SoundVUMeter2DVisual value={value} min={min} max={max} color={color} />;

    case 'uv':
      return (
        <PrecisionDial2DVisual
          value={value}
          min={min}
          max={max}
          unit={unit}
          color={color}
          label="SOLAR UV INDEX"
        />
      );

    case 'co2':
      return (
        <PrecisionDial2DVisual
          value={value}
          min={min}
          max={max}
          unit={unit}
          color={color}
          label="CO₂ AIR QUALITY"
        />
      );

    case 'motionX':
      return <MotionLevel2DVisual axis="X" value={value} min={min} max={max} color={color} />;

    case 'motionY':
      return <MotionLevel2DVisual axis="Y" value={value} min={min} max={max} color={color} />;

    case 'motionZ':
      return <MotionLevel2DVisual axis="Z" value={value} min={min} max={max} color={color} />;

    default:
      return (
        <PrecisionDial2DVisual
          value={value}
          min={min}
          max={max}
          unit={unit}
          color={color}
          label="TRANSDUCER METER"
        />
      );
  }
}
