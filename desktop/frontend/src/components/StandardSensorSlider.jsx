import React, { useRef, useState, useCallback, useEffect } from 'react';

/**
 * StandardSensorSlider
 * 
 * Reusable, high-contrast hardware slider matching the reference images:
 * - Sleek pill track with subtle inset depth
 * - Glowing gradient progress fill
 * - Circular glowing knob handle with neon halo
 * - Pointer drag + keyboard accessibility
 * - Milestone labels below (Min / Max with custom units & notes)
 */
export default function StandardSensorSlider({
  value = 0,
  min = 0,
  max = 100,
  step = 1,
  unit = '',
  color = '#38bdf8',
  gradient,
  onChange,
  disabled = false,
  minLabel,
  maxLabel,
}) {
  const trackRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  // Clamp percentage between 0 and 100
  const range = max - min || 1;
  const pct = Math.max(0, Math.min(100, ((Number(value) - min) / range) * 100));

  // Determine gradient fill
  const activeGradient = gradient || `linear-gradient(90deg, ${color}44 0%, ${color} 100%)`;

  const updateValueFromPointer = useCallback((clientX) => {
    if (disabled || !trackRef.current || !onChange) return;
    const rect = trackRef.current.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const rawVal = min + ratio * (max - min);
    
    // Snap to step precision
    const stepsCount = Math.round((rawVal - min) / step);
    let snappedVal = min + stepsCount * step;
    
    // Avoid floating point jitter
    const decimals = (step.toString().split('.')[1] || '').length;
    snappedVal = parseFloat(snappedVal.toFixed(Math.min(decimals, 4)));
    snappedVal = Math.max(min, Math.min(max, snappedVal));
    
    onChange(snappedVal);
  }, [min, max, step, disabled, onChange]);

  const handlePointerDown = (e) => {
    if (disabled) return;
    setIsDragging(true);
    e.currentTarget.setPointerCapture?.(e.pointerId);
    updateValueFromPointer(e.clientX);
  };

  const handlePointerMove = (e) => {
    if (isDragging) {
      updateValueFromPointer(e.clientX);
    }
  };

  const handlePointerUp = (e) => {
    if (isDragging) {
      setIsDragging(false);
      try {
        e.currentTarget.releasePointerCapture?.(e.pointerId);
      } catch {
        // ignore
      }
    }
  };

  return (
    <div
      style={{
        width: '100%',
        userSelect: 'none',
        opacity: disabled ? 0.5 : 1,
        transition: 'opacity var(--motion-fast)',
      }}
    >
      {/* Slider Track Area */}
      <div
        ref={trackRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={() => setIsDragging(false)}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        style={{
          position: 'relative',
          height: '28px',
          display: 'flex',
          alignItems: 'center',
          cursor: disabled ? 'not-allowed' : 'pointer',
          touchAction: 'none',
        }}
      >
        {/* Recessed Track Base */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            height: '10px',
            borderRadius: '9999px',
            background: 'rgba(255, 255, 255, 0.07)',
            boxShadow: 'inset 0 1px 3px rgba(0, 0, 0, 0.6), 0 1px 0 rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.05)',
            overflow: 'hidden',
          }}
        >
          {/* Active Gradient Fill Bar */}
          <div
            style={{
              width: `${pct}%`,
              height: '100%',
              borderRadius: '9999px',
              background: activeGradient,
              boxShadow: `0 0 12px ${color}88, inset 0 1px 0 rgba(255, 255, 255, 0.3)`,
              transition: isDragging ? 'none' : 'width var(--motion-fast)',
            }}
          />
        </div>

        {/* Circular Glowing Thumb Knob */}
        <div
          style={{
            position: 'absolute',
            left: `${pct}%`,
            top: '50%',
            transform: `translate(-50%, -50%) scale(${isDragging ? 1.2 : isHovered ? 1.1 : 1})`,
            width: '22px',
            height: '22px',
            borderRadius: '50%',
            backgroundColor: '#ffffff',
            border: `3px solid ${color}`,
            boxShadow: `0 0 16px ${color}, 0 2px 8px rgba(0, 0, 0, 0.7)`,
            transition: isDragging
              ? 'transform var(--motion-instant)'
              : 'left var(--motion-fast), transform var(--motion-fast)',
            pointerEvents: 'none',
            zIndex: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {/* Inner Accent Core Dot */}
          <div
            style={{
              width: '4px',
              height: '4px',
              borderRadius: '50%',
              backgroundColor: color,
            }}
          />
        </div>

        {/* Hidden Accessible Native Range for Keyboard / A11y */}
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          disabled={disabled}
          onChange={(e) => onChange && onChange(parseFloat(e.target.value))}
          style={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            opacity: 0,
            cursor: disabled ? 'not-allowed' : 'pointer',
            margin: 0,
            zIndex: 3,
          }}
          aria-label="Sensor Value Slider"
        />
      </div>

      {/* Min / Max Milestone Labels Below Track */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: '6px',
          fontSize: '11px',
          fontFamily: 'var(--font-mono)',
          color: 'var(--text-dim)',
          letterSpacing: '0.02em',
        }}
      >
        <span style={{ transition: 'color var(--motion-fast)' }}>
          {minLabel !== undefined ? minLabel : `${min} ${unit}`}
        </span>
        <span style={{ transition: 'color var(--motion-fast)' }}>
          {maxLabel !== undefined ? maxLabel : `${max} ${unit}`}
        </span>
      </div>
    </div>
  );
}
