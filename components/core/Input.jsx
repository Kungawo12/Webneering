import React, { useState } from 'react';

/**
 * Input — text input field for House of UGC forms.
 * Supports label, placeholder, error, disabled, and prefix/suffix.
 */
export function Input({
  label,
  placeholder,
  value,
  onChange,
  type = 'text',
  error,
  hint,
  disabled = false,
  prefix,
  suffix,
  id,
}) {
  const [focused, setFocused] = useState(false);
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  const wrapperStyle = {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--space-1-5)',
    fontFamily: 'var(--font-body)',
  };

  const labelStyle = {
    fontSize: '13px',
    fontWeight: 500,
    color: 'var(--color-fg-secondary)',
    letterSpacing: '0.01em',
  };

  const fieldStyle = {
    display: 'flex',
    alignItems: 'center',
    background: 'var(--color-surface)',
    border: `1px solid ${error ? 'var(--color-danger)' : focused ? 'var(--color-border-focus)' : 'var(--color-border-strong)'}`,
    borderRadius: 'var(--radius-md)',
    transition: 'border-color 150ms ease, box-shadow 150ms ease',
    boxShadow: focused && !error ? 'var(--shadow-focus-sm)' : 'none',
    opacity: disabled ? 0.45 : 1,
  };

  const inputStyle = {
    flex: 1,
    background: 'transparent',
    border: 'none',
    outline: 'none',
    padding: '9px 12px',
    fontSize: '14px',
    color: 'var(--color-fg)',
    fontFamily: 'var(--font-body)',
    lineHeight: '1.4',
    cursor: disabled ? 'not-allowed' : 'text',
  };

  const affixStyle = {
    padding: '0 10px',
    fontSize: '13px',
    color: 'var(--color-fg-tertiary)',
    borderRight: prefix ? '1px solid var(--color-border)' : undefined,
    borderLeft: suffix ? '1px solid var(--color-border)' : undefined,
    display: 'flex',
    alignItems: 'center',
    height: '100%',
    userSelect: 'none',
  };

  return React.createElement('div', { style: wrapperStyle },
    label && React.createElement('label', { htmlFor: inputId, style: labelStyle }, label),
    React.createElement('div', { style: fieldStyle },
      prefix && React.createElement('span', { style: affixStyle }, prefix),
      React.createElement('input', {
        id: inputId,
        type,
        value,
        onChange,
        placeholder,
        disabled,
        style: inputStyle,
        onFocus: () => setFocused(true),
        onBlur:  () => setFocused(false),
      }),
      suffix && React.createElement('span', { style: { ...affixStyle, borderLeft: '1px solid var(--color-border)', borderRight: undefined } }, suffix),
    ),
    error && React.createElement('span', { style: { fontSize: '12px', color: 'var(--color-danger)' } }, error),
    !error && hint && React.createElement('span', { style: { fontSize: '12px', color: 'var(--color-fg-tertiary)' } }, hint),
  );
}
