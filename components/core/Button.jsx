import React from 'react';

/**
 * Button — primary interactive element for House of UGC.
 * Supports primary, secondary, ghost, and destructive variants
 * with sm, md, lg sizes. Follows the brand's minimal-luxury aesthetic.
 */
export function Button({
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  onClick,
  type = 'button',
  leftIcon,
  rightIcon,
  fullWidth = false,
}) {
  const base = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    fontFamily: "var(--font-body)",
    fontWeight: 500,
    lineHeight: 1,
    borderRadius: 'var(--radius-md)',
    border: '1px solid transparent',
    cursor: disabled ? 'not-allowed' : 'pointer',
    transition: 'background-color 150ms ease, border-color 150ms ease, opacity 150ms ease, transform 100ms ease',
    outline: 'none',
    width: fullWidth ? '100%' : undefined,
    letterSpacing: '0',
    whiteSpace: 'nowrap',
    userSelect: 'none',
    WebkitFontSmoothing: 'antialiased',
  };

  const sizes = {
    sm: { fontSize: '13px', padding: '7px 14px', height: '32px' },
    md: { fontSize: '14px', padding: '9px 18px', height: '38px' },
    lg: { fontSize: '15px', padding: '11px 24px', height: '44px' },
  };

  const variants = {
    primary: {
      background: disabled ? 'rgba(255,255,255,0.1)' : '#FFFFFF',
      color:      disabled ? 'rgba(255,255,255,0.3)' : '#0A0A0A',
      borderColor: 'transparent',
    },
    secondary: {
      background: disabled ? 'rgba(255,255,255,0.03)' : 'var(--color-surface)',
      color:      disabled ? 'rgba(255,255,255,0.2)' : 'var(--color-fg)',
      borderColor: disabled ? 'rgba(255,255,255,0.05)' : 'var(--color-border-strong)',
    },
    ghost: {
      background: 'transparent',
      color:      disabled ? 'rgba(255,255,255,0.2)' : 'var(--color-fg-secondary)',
      borderColor: 'transparent',
    },
    destructive: {
      background: disabled ? 'rgba(248,113,113,0.05)' : 'rgba(248,113,113,0.1)',
      color:      disabled ? 'rgba(248,113,113,0.3)' : 'var(--color-danger)',
      borderColor: disabled ? 'transparent' : 'rgba(248,113,113,0.2)',
    },
  };

  const style = { ...base, ...sizes[size], ...variants[variant] };

  function handleMouseEnter(e) {
    if (disabled) return;
    if (variant === 'primary') e.currentTarget.style.opacity = '0.88';
    if (variant === 'secondary') e.currentTarget.style.borderColor = 'var(--color-border-focus)';
    if (variant === 'ghost') e.currentTarget.style.backgroundColor = 'var(--color-accent-subtle)';
    if (variant === 'destructive') e.currentTarget.style.backgroundColor = 'rgba(248,113,113,0.18)';
  }

  function handleMouseLeave(e) {
    if (disabled) return;
    if (variant === 'primary') e.currentTarget.style.opacity = '1';
    if (variant === 'secondary') e.currentTarget.style.borderColor = 'var(--color-border-strong)';
    if (variant === 'ghost') e.currentTarget.style.backgroundColor = 'transparent';
    if (variant === 'destructive') e.currentTarget.style.backgroundColor = 'rgba(248,113,113,0.1)';
  }

  function handleMouseDown(e) {
    if (!disabled) e.currentTarget.style.transform = 'scale(0.97)';
  }

  function handleMouseUp(e) {
    e.currentTarget.style.transform = 'scale(1)';
  }

  return React.createElement('button', {
    type,
    disabled,
    onClick: disabled ? undefined : onClick,
    style,
    onMouseEnter: handleMouseEnter,
    onMouseLeave: handleMouseLeave,
    onMouseDown: handleMouseDown,
    onMouseUp: handleMouseUp,
  },
    leftIcon && React.createElement('span', { style: { display: 'flex', alignItems: 'center' } }, leftIcon),
    children,
    rightIcon && React.createElement('span', { style: { display: 'flex', alignItems: 'center' } }, rightIcon),
  );
}
