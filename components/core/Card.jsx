import React from 'react';

/**
 * Card — content surface for House of UGC.
 * Minimal dark surface with optional hover state and padding variants.
 */
export function Card({
  children,
  hoverable = false,
  padding = 'md',
  onClick,
  style: extraStyle = {},
}) {
  const paddings = {
    none: '0',
    sm:   'var(--space-4)',      /* 16px */
    md:   'var(--space-6)',      /* 24px */
    lg:   'var(--space-8)',      /* 32px */
  };

  const base = {
    background: 'var(--color-surface)',
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius-lg)',
    padding: paddings[padding],
    transition: 'border-color 200ms ease, background-color 200ms ease',
    cursor: (onClick || hoverable) ? 'pointer' : 'default',
    ...extraStyle,
  };

  function handleMouseEnter(e) {
    if (!hoverable && !onClick) return;
    e.currentTarget.style.borderColor = 'var(--color-border-strong)';
    e.currentTarget.style.backgroundColor = 'var(--color-surface-elevated)';
  }

  function handleMouseLeave(e) {
    e.currentTarget.style.borderColor = 'var(--color-border)';
    e.currentTarget.style.backgroundColor = 'var(--color-surface)';
  }

  return React.createElement('div', {
    style: base,
    onClick,
    onMouseEnter: handleMouseEnter,
    onMouseLeave: handleMouseLeave,
  }, children);
}
