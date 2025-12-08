/**
 * Card Component
 * 
 * Reusable card component for content containers
 */

import React from 'react';
import './Card.css';

const Card = ({
  children,
  title,
  subtitle,
  footer,
  className = '',
  onClick,
  hover = false,
  ...props
}) => {
  const cardClasses = [
    'card',
    hover && 'card-hover',
    onClick && 'card-clickable',
    className
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={cardClasses} onClick={onClick} {...props}>
      {(title || subtitle) && (
        <div className="card-header">
          {title && <h3 className="card-title">{title}</h3>}
          {subtitle && <p className="card-subtitle">{subtitle}</p>}
        </div>
      )}
      <div className="card-body">{children}</div>
      {footer && <div className="card-footer">{footer}</div>}
    </div>
  );
};

export default Card;




























