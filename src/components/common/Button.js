/**
 * Button Component
 * 
 * Reusable button component with variants and sizes
 */

import React from 'react';
import './Button.css';

const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  type = 'button',
  onClick,
  disabled = false,
  loading = false,
  fullWidth = false,
  className = '',
  ...props
}) => {
  const buttonClasses = [
    'btn',
    `btn-${variant}`,
    `btn-${size}`,
    fullWidth && 'btn-full-width',
    loading && 'btn-loading',
    disabled && 'btn-disabled',
    className
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button
      type={type}
      className={buttonClasses}
      onClick={onClick}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <span className="btn-spinner" />}
      <span className={loading ? 'btn-content-loading' : ''}>{children}</span>
    </button>
  );
};

export default Button;



























