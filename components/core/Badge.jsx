import React from 'react';

/**
 * Badge — compact status indicator for House of UGC.
 * Communicates states: default, success, warning, danger, outline.
 */
export function Badge({
  children,
  variant = 'default',
  size = 'md',
  dot = false,
}) {
  const base = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '5px',
    fontFamily: 'var(--font-body)',
    fontWeight: 500,
    lineHeight: 1,
    borderRadius: 'var(--radius-full)',
    border: '1px solid transparent',
    letterSpacing: '0.02em',
    whiteSpace: 'nowrap',
  };

  const sizes = {
    sm: { fontSize: '11px', padding: '3px 8px' },
    md: { fontSize: '12px', padding: '4px 10px' },
  };

  const variants = {
    default: {
      background: 'var(--color-accent-muted)',
      color: 'var(--color-fg-secondary)',
      borderColor: 'var(--color-border)',
    },
    success: {
      background: 'var(--color-success-subtle)',
      color: 'var(--color-success)',
      borderColor: 'rgba(74,222,128,0.2)',
    },
    warning: {
      background: 'var(--color-warning-subtle)',
      color: 'var(--color-warning)',
      borderColor: 'rgba(251,191,36,0.2)',
    },
    danger: {
      background: 'var(--color-danger-subtle)',
      color: 'var(--color-danger)',
      borderColor: 'rgba(248,113,113,0.2)',
    },
    outline: {
      background: 'transparent',
      color: 'var(--color-fg-tertiary)',
      borderColor: 'var(--color-border-strong)',
    },
  };

  const dotColors = {
    default: 'var(--color-fg-tertiary)',
    success: 'var(--color-success)',
    warning: 'var(--color-warning)',
    danger:  'var(--color-danger)',
    outline: 'var(--color-fg-disabled)',
  };

  const style = { ...base, ...sizes[size], ...variants[variant] };

  return React.createElement('span', { style },
    dot && React.createElement('span', {
      style: {
        width: '6px', height: '6px', borderRadius: '50%',
        background: dotColors[variant], flexShrink: 0,
      }
    }),
    children,
  );
}
