/**
 * Loading Component
 * 
 * Reusable loading spinner component
 */

import React from 'react';
import './Loading.css';

const Loading = ({ size = 'md', fullScreen = false, message = 'Loading...' }) => {
  const sizeClass = `loading-${size}`;
  const containerClass = fullScreen ? 'loading-fullscreen' : 'loading-container';

  return (
    <div className={containerClass}>
      <div className={`loading-spinner ${sizeClass}`}>
        <div className="spinner"></div>
      </div>
      {message && <p className="loading-message">{message}</p>}
    </div>
  );
};

export default Loading;





