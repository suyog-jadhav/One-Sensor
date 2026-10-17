import React from 'react';

/**
 * OneSensor Official Brand Logo (Vector SVG)
 * Recreated with mathematical precision from the official brand artwork.
 * Supports:
 *  - variant='full': Icon + OneSensor + VIRTUAL SENSOR WORKBENCH
 *  - variant='mark': Icon only (C-Ring, Core Node, and Waveform Pulse)
 *  - variant='horizontal': Icon + OneSensor (single line, compact)
 *  - theme='light': Slate text (#172033) for white/light surfaces
 *  - theme='dark': White text (#FFFFFF) for midnight-navy surfaces
 */
export default function OneSensorLogo({
  variant = 'full',
  theme = 'light',
  height = 34,
  className = '',
  style = {}
}) {
  const isDark = theme === 'dark';
  const textColor = isDark ? '#FFFFFF' : '#172033';
  const subtitleColor = isDark ? '#8FA0B5' : '#667085';

  // 1. Mark Only (Icon)
  if (variant === 'mark') {
    return (
      <svg
        viewBox="20 18 84 62"
        height={height}
        className={`onesensor-logo mark ${className}`}
        style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0, ...style }}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-label="OneSensor Logomark"
      >
        <defs>
          <linearGradient id="os_ring_grad_m" x1="15%" y1="85%" x2="85%" y2="15%">
            <stop offset="0%" stopColor="#304FFE" />
            <stop offset="40%" stopColor="#0091FF" />
            <stop offset="80%" stopColor="#00D2FF" />
            <stop offset="100%" stopColor="#00E5FF" />
          </linearGradient>
          <linearGradient id="os_core_grad_m" x1="20%" y1="80%" x2="80%" y2="20%">
            <stop offset="0%" stopColor="#2979FF" />
            <stop offset="100%" stopColor="#00D2FF" />
          </linearGradient>
        </defs>

        {/* Outer C-Ring */}
        <path
          d="M 67.04 57.86 A 21 21 0 1 1 67.04 38.14"
          fill="none"
          stroke="url(#os_ring_grad_m)"
          strokeWidth="10"
          strokeLinecap="butt"
        />

        {/* Inner Core Sensor Node */}
        <circle cx="48.5" cy="48" r="8.5" fill="url(#os_core_grad_m)" />

        {/* Horizontal Stem and Waveform Pulse */}
        <path
          d="M 57 48 L 74 48 C 75.8 48, 77.2 42.5, 79 42.5 C 81.2 42.5, 82.2 56, 84.5 56 C 86.8 56, 88.2 43.5, 90.5 43.5 C 92.5 43.5, 93.8 49, 96 49"
          fill="none"
          stroke="#00E5FF"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Waveform Terminal Node & Droplet */}
        <circle cx="98" cy="49" r="3" fill="#00E5FF" />
        <circle cx="97.5" cy="54.5" r="1.5" fill="#00E5FF" />
      </svg>
    );
  }

  // 2. Compact Horizontal (Icon + 'OneSensor' title without subtitle)
  if (variant === 'horizontal') {
    const width = Math.round(height * (245 / 75));
    return (
      <svg
        viewBox="20 18 250 62"
        height={height}
        width={width}
        className={`onesensor-logo horizontal ${className}`}
        style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0, ...style }}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-label="OneSensor"
      >
        <defs>
          <linearGradient id="os_ring_grad_h" x1="15%" y1="85%" x2="85%" y2="15%">
            <stop offset="0%" stopColor="#304FFE" />
            <stop offset="40%" stopColor="#0091FF" />
            <stop offset="80%" stopColor="#00D2FF" />
            <stop offset="100%" stopColor="#00E5FF" />
          </linearGradient>
          <linearGradient id="os_core_grad_h" x1="20%" y1="80%" x2="80%" y2="20%">
            <stop offset="0%" stopColor="#2979FF" />
            <stop offset="100%" stopColor="#00D2FF" />
          </linearGradient>
        </defs>

        {/* Outer C-Ring */}
        <path
          d="M 67.04 57.86 A 21 21 0 1 1 67.04 38.14"
          fill="none"
          stroke="url(#os_ring_grad_h)"
          strokeWidth="10"
          strokeLinecap="butt"
        />

        {/* Inner Core Sensor Node */}
        <circle cx="48.5" cy="48" r="8.5" fill="url(#os_core_grad_h)" />

        {/* Horizontal Stem and Waveform Pulse */}
        <path
          d="M 57 48 L 74 48 C 75.8 48, 77.2 42.5, 79 42.5 C 81.2 42.5, 82.2 56, 84.5 56 C 86.8 56, 88.2 43.5, 90.5 43.5 C 92.5 43.5, 93.8 49, 96 49"
          fill="none"
          stroke="#00E5FF"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Waveform Terminal Node & Droplet */}
        <circle cx="98" cy="49" r="3" fill="#00E5FF" />
        <circle cx="97.5" cy="54.5" r="1.5" fill="#00E5FF" />

        {/* Typography: OneSensor */}
        <g fill={textColor} fontFamily="'Inter', system-ui, -apple-system, sans-serif">
          <text x="108" y="56" fontSize="27" letterSpacing="-0.03em">
            <tspan fontWeight="700">One</tspan>
            <tspan fontWeight="400">Sensor</tspan>
          </text>
        </g>
      </svg>
    );
  }

  // 3. Full Brand Banner (Icon + 'OneSensor' + 'VIRTUAL SENSOR WORKBENCH')
  const width = Math.round(height * (260 / 58));
  return (
    <svg
      viewBox="20 22 260 58"
      height={height}
      width={width}
      className={`onesensor-logo full ${className}`}
      style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0, ...style }}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="OneSensor Virtual Sensor Workbench"
    >
      <defs>
        <linearGradient id="os_ring_grad_f" x1="15%" y1="85%" x2="85%" y2="15%">
          <stop offset="0%" stopColor="#304FFE" />
          <stop offset="40%" stopColor="#0091FF" />
          <stop offset="80%" stopColor="#00D2FF" />
          <stop offset="100%" stopColor="#00E5FF" />
        </linearGradient>
        <linearGradient id="os_core_grad_f" x1="20%" y1="80%" x2="80%" y2="20%">
          <stop offset="0%" stopColor="#2979FF" />
          <stop offset="100%" stopColor="#00D2FF" />
        </linearGradient>
      </defs>

      {/* Outer C-Ring */}
      <path
        d="M 67.04 57.86 A 21 21 0 1 1 67.04 38.14"
        fill="none"
        stroke="url(#os_ring_grad_f)"
        strokeWidth="10"
        strokeLinecap="butt"
      />

      {/* Inner Core Sensor Node */}
      <circle cx="48.5" cy="48" r="8.5" fill="url(#os_core_grad_f)" />

      {/* Horizontal Stem and Waveform Pulse */}
      <path
        d="M 57 48 L 74 48 C 75.8 48, 77.2 42.5, 79 42.5 C 81.2 42.5, 82.2 56, 84.5 56 C 86.8 56, 88.2 43.5, 90.5 43.5 C 92.5 43.5, 93.8 49, 96 49"
        fill="none"
        stroke="#00E5FF"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Waveform Terminal Node & Droplet */}
      <circle cx="98" cy="49" r="3" fill="#00E5FF" />
      <circle cx="97.5" cy="54.5" r="1.5" fill="#00E5FF" />

      {/* Typography: OneSensor */}
      <g fill={textColor} fontFamily="'Inter', system-ui, -apple-system, sans-serif">
        <text x="108" y="55" fontSize="26" letterSpacing="-0.03em">
          <tspan fontWeight="700">One</tspan>
          <tspan fontWeight="400">Sensor</tspan>
        </text>
        <text
          x="109"
          y="72"
          fontSize="8.5"
          fontWeight="600"
          letterSpacing="0.16em"
          fill={subtitleColor}
        >
          VIRTUAL SENSOR WORKBENCH
        </text>
      </g>
    </svg>
  );
}
