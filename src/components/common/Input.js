/**
 * Input Component
 * 
 * Reusable input component with validation and error states
 */

import React, { forwardRef } from 'react';
import './Input.css';

const Input = forwardRef(({
  label,
  type = 'text',
  placeholder,
  value,
  onChange,
  error,
  helperText,
  required = false,
  disabled = false,
  fullWidth = false,
  className = '',
  icon,
  ...props
}, ref) => {
  const inputClasses = [
    'input-wrapper',
    fullWidth && 'input-full-width',
    error && 'input-error',
    disabled && 'input-disabled',
    icon && 'input-with-icon',
    className
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={inputClasses}>
      {label && (
        <label className="input-label">
          {label}
          {required && <span className="input-required">*</span>}
        </label>
      )}
      <div className="input-container">
        {icon && <span className="input-icon">{icon}</span>}
        <input
          ref={ref}
          type={type}
          className="input-field"
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          disabled={disabled}
          required={required}
          {...props}
        />
      </div>
      {error && <span className="input-error-message">{error}</span>}
      {helperText && !error && (
        <span className="input-helper-text">{helperText}</span>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;




























