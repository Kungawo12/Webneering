import React from 'react';

/**
 * Tag — small label chip for categories, metadata, and filters.
 * Typically rendered in ALL CAPS with wide letter-spacing.
 */
export function Tag({
  children,
  variant = 'default',
  size = 'md',
  onClick,
}) {
  const base = {
    display: 'inline-flex',
    alignItems: 'center',
    fontFamily: 'var(--font-body)',
    fontWeight: 500,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    borderRadius: 'var(--radius-sm)',
    border: '1px solid transparent',
    cursor: onClick ? 'pointer' : 'default',
    transition: 'border-color 150ms ease, background 150ms ease',
    userSelect: 'none',
  };

  const sizes = {
    sm: { fontSize: '10px', padding: '3px 7px' },
    md: { fontSize: '11px', padding: '4px 9px' },
  };

  const variants = {
    default: {
      background: 'var(--color-accent-subtle)',
      color: 'var(--color-fg-tertiary)',
      borderColor: 'var(--color-border)',
    },
    active: {
      background: 'var(--color-accent-muted)',
      color: 'var(--color-fg)',
      borderColor: 'var(--color-border-strong)',
    },
  };

  const style = { ...base, ...sizes[size], ...variants[variant] };

  function handleMouseEnter(e) {
    if (!onClick) return;
    e.currentTarget.style.borderColor = 'var(--color-border-strong)';
    e.currentTarget.style.backgroundColor = 'var(--color-accent-muted)';
  }

  function handleMouseLeave(e) {
    if (!onClick) return;
    e.currentTarget.style.borderColor = variants[variant].borderColor;
    e.currentTarget.style.backgroundColor = variants[variant].background;
  }

  return React.createElement('span', {
    style,
    onClick,
    onMouseEnter: handleMouseEnter,
    onMouseLeave: handleMouseLeave,
  }, children);
}
