import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import './styles/global.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

// Global error handler for uncaught errors
if (typeof window !== 'undefined') {
  // Store original console.error to filter script errors
  const originalConsoleError = console.error;
  console.error = function(...args) {
    // Check if any argument contains "Script error" (case-insensitive)
    const message = args.join(' ').toLowerCase();
    if (message.includes('script error') || message.includes('script error.')) {
      // Suppress script errors from console.error
      console.warn('[Suppressed] Script error (likely external script/CORS):', args);
      return;
    }
    // Call original console.error for other errors
    originalConsoleError.apply(console, args);
  };

  // Override window.onerror (this runs before addEventListener)
  const originalOnError = window.onerror;
  window.onerror = function(message, source, lineno, colno, error) {
    const messageStr = String(message || '');
    
    // Suppress generic "Script error" messages (usually from external scripts/CORS)
    if (messageStr === 'Script error.' || messageStr === 'Script error' || 
        messageStr.includes('Script error') || messageStr.includes('script error')) {
      console.warn('[Suppressed] External script error (likely CORS):', {
        message,
        source,
        lineno,
        colno
      });
      return true; // Suppress the error
    }
    
    // Suppress errors from bundle.js that are script errors
    if (source && (source.includes('bundle.js') || source.includes('chunk.js')) && 
        (messageStr.includes('Script error') || messageStr.includes('script error'))) {
      console.warn('[Suppressed] Script error from bundle (likely external script):', {
        message,
        source,
        lineno
      });
      return true;
    }
    
    // Suppress PayPal-related errors
    if (source && (source.includes('paypal') || source.includes('paypal.com'))) {
      console.warn('[Suppressed] PayPal script error (non-critical):', message);
      return true;
    }
    
    // Call original handler if it exists
    if (originalOnError) {
      return originalOnError(message, source, lineno, colno, error);
    }
    return false;
  };

  // Handle uncaught errors via addEventListener (backup)
  window.addEventListener('error', (event) => {
    const messageStr = String(event.message || '');
    
    // Suppress generic "Script error" messages (usually from external scripts/CORS)
    if (messageStr === 'Script error.' || messageStr === 'Script error' ||
        messageStr.includes('Script error') || messageStr.includes('script error')) {
      console.warn('[Suppressed] External script error detected (likely CORS):', {
        message: event.message,
        source: event.filename,
        lineno: event.lineno,
        colno: event.colno
      });
      event.preventDefault(); // Prevent default error handling
      event.stopPropagation(); // Stop event bubbling
      event.stopImmediatePropagation(); // Stop all other handlers
      return;
    }
    
    // Suppress errors from bundle.js that are script errors
    if (event.filename && (event.filename.includes('bundle.js') || event.filename.includes('chunk.js')) &&
        (messageStr.includes('Script error') || messageStr.includes('script error'))) {
      console.warn('[Suppressed] Script error from bundle (likely external script):', {
        message: event.message,
        source: event.filename,
        lineno: event.lineno
      });
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      return;
    }
    
    // Suppress PayPal-related errors
    if (event.filename && (event.filename.includes('paypal') || event.filename.includes('paypal.com'))) {
      console.warn('[Suppressed] PayPal script error (non-critical):', event.message);
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      return;
    }
  }, true); // Use capture phase
  
  // Override window.onunhandledrejection
  const originalOnUnhandledRejection = window.onunhandledrejection;
  window.onunhandledrejection = function(event) {
    const reason = event?.reason;
    
    // Suppress generic script errors
    if (reason?.message === 'Script error.' || reason?.message === 'Script error' ||
        (typeof reason?.message === 'string' && reason?.message.includes('Script error'))) {
      console.warn('[Suppressed] Unhandled promise rejection (likely external script):', reason);
      event.preventDefault();
      return;
    }
    
    // Suppress PayPal-related rejections
    if (reason?.message?.includes('paypal') || reason?.toString().includes('paypal')) {
      console.warn('[Suppressed] PayPal promise rejection (non-critical):', reason);
      event.preventDefault();
      return;
    }
    
    // Call original handler if it exists
    if (originalOnUnhandledRejection) {
      return originalOnUnhandledRejection(event);
    }
  };
  
  // Handle unhandled promise rejections via addEventListener (backup)
  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason;
    
    // Suppress generic script errors
    if (reason?.message === 'Script error.' || reason?.message === 'Script error' ||
        (typeof reason?.message === 'string' && reason?.message.includes('Script error'))) {
      console.warn('[Suppressed] Unhandled promise rejection (likely external script):', reason);
      event.preventDefault();
      return;
    }
    
    // Suppress PayPal-related rejections
    if (reason?.message?.includes('paypal') || reason?.toString().includes('paypal')) {
      console.warn('[Suppressed] PayPal promise rejection (non-critical):', reason);
      event.preventDefault();
      return;
    }
  });
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
