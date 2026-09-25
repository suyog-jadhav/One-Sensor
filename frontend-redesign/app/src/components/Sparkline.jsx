import React from 'react';

export default function Sparkline({ data, min, max, color, width = 120, height = 36 }) {
  if (!data || data.length < 2) return <div style={{ width, height }} />;

  const range = max - min || 1;
  const stepX = width / (data.length - 1);

  // Generate SVG path coordinates
  const points = data.map((val, idx) => {
    const normY = (val - min) / range;
    const clampedY = Math.max(0, Math.min(1, normY));
    const y = height - clampedY * (height - 6) - 3;
    const x = idx * stepX;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });

  const pathD = `M ${points.join(' L ')}`;
  const areaD = `${pathD} L ${width},${height} L 0,${height} Z`;

  return (
    <svg width={width} height={height} style={{ overflow: 'visible' }}>
      <defs>
        <linearGradient id={`grad-${color}`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={color} stopOpacity={0.35} />
          <stop offset="100%" stopColor={color} stopOpacity={0.0} />
        </linearGradient>
      </defs>
      <path d={areaD} fill={`url(#grad-${color})`} />
      <path d={pathD} fill="none" stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
      {/* Glow dot on latest point */}
      <circle
        cx={width}
        cy={height - (Math.max(0, Math.min(1, (data[data.length - 1] - min) / range))) * (height - 6) - 3}
        r="3"
        fill={color}
      />
    </svg>
  );
}
