import React from 'react';

/**
 * Shared Badge Component
 * Variants:
 *  - 'neutral' (default): subtle gray/border for info, e.g. "NO CONFLICT", "SAVED (SYNC)", "Verified Bin", "Optiboot OK"
 *  - 'success': emerald green, e.g. "OPTIMAL", "HARDWARE LINKED", "CONNECTED"
 *  - 'warning': amber/yellow, e.g. "WARN", "JITTER", "SIMULATED LAB STATE"
 *  - 'danger': red, e.g. "ERROR", "DISCONNECTED"
 *  - 'active-pulse': cyan/indigo with motion-pulse animation, e.g. "STREAMING", "SWEEPING", "LATCHED", "Toolchains Active"
 */
export default function Badge({
  variant = 'neutral',
  children,
  dot = false,
  pulse = false,
  icon = null,
  size = 'sm',
  className = '',
  style = {},
  ...props
}) {
  const isPulse = pulse || variant === 'active-pulse';

  const variantStyles = {
    neutral: {
      background: 'rgba(255, 255, 255, 0.05)',
      color: '#94a3b8',
      border: '1px solid rgba(255, 255, 255, 0.12)',
      dotColor: '#94a3b8',
    },
    success: {
      background: 'rgba(16, 185, 129, 0.12)',
      color: '#34d399',
      border: '1px solid rgba(16, 185, 129, 0.35)',
      dotColor: '#10b981',
      shadow: '0 0 10px rgba(16, 185, 129, 0.25)',
    },
    warning: {
      background: 'rgba(245, 158, 11, 0.12)',
      color: '#fbbf24',
      border: '1px solid rgba(245, 158, 11, 0.35)',
      dotColor: '#f59e0b',
      shadow: '0 0 10px rgba(245, 158, 11, 0.25)',
    },
    danger: {
      background: 'rgba(239, 68, 68, 0.12)',
      color: '#f87171',
      border: '1px solid rgba(239, 68, 68, 0.35)',
      dotColor: '#ef4444',
      shadow: '0 0 10px rgba(239, 68, 68, 0.25)',
    },
    'active-pulse': {
      background: 'rgba(56, 189, 248, 0.12)',
      color: '#38bdf8',
      border: '1px solid rgba(56, 189, 248, 0.4)',
      dotColor: '#38bdf8',
      shadow: '0 0 12px rgba(56, 189, 248, 0.35)',
    },
  };

  const currentTheme = variantStyles[variant] || variantStyles.neutral;

  const sizeStyles = {
    sm: {
      padding: '3px 8px',
      fontSize: '11px',
      dotSize: '6px',
    },
    md: {
      padding: '5px 12px',
      fontSize: '12px',
      dotSize: '8px',
    },
    lg: {
      padding: '7px 16px',
      fontSize: '13px',
      dotSize: '9px',
    }
  };

  const curSize = sizeStyles[size] || sizeStyles.sm;

  return (
    <span
      className={`app-badge ${isPulse ? 'app-badge-pulsing' : ''} ${className}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        borderRadius: '9999px',
        fontWeight: '600',
        letterSpacing: '0.03em',
        fontFamily: 'var(--font-mono)',
        textTransform: 'uppercase',
        transition: 'all var(--motion-fast)',
        userSelect: 'none',
        whiteSpace: 'nowrap',
        background: currentTheme.background,
        color: currentTheme.color,
        border: currentTheme.border,
        boxShadow: currentTheme.shadow || 'none',
        padding: curSize.padding,
        fontSize: curSize.fontSize,
        lineHeight: 1.2,
        ...style,
      }}
      {...props}
    >
      {(dot || isPulse) && (
        <span
          className={`badge-dot ${isPulse ? 'badge-dot-pulse' : ''}`}
          style={{
            width: curSize.dotSize,
            height: curSize.dotSize,
            borderRadius: '50%',
            backgroundColor: currentTheme.dotColor,
            flexShrink: 0,
            display: 'inline-block',
          }}
        />
      )}
      {icon && <span style={{ display: 'inline-flex', alignItems: 'center' }}>{icon}</span>}
      <span>{children}</span>
    </span>
  );
}
