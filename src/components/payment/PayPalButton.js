import React, { useEffect, useRef, useState } from 'react';
import { PAYPAL_CLIENT_ID, isPayPalSandbox } from '../../config/paypal';
import './PaymentMethodSelector.css';

// Note: Global error handling for script errors is handled in src/index.js

const loadPayPalScript = (clientId, currency, onError, isTestMode = false) => {
  return new Promise((resolve, reject) => {
    try {
      if (!clientId) {
        reject(new Error('Missing PayPal client ID'));
        return;
      }

      if (window.paypal) {
        resolve(window.paypal);
        return;
      }

      const existingScript = document.querySelector('script[data-paypal-sdk]');
      if (existingScript) {
        existingScript.remove();
      }

      const script = document.createElement('script');
      // Use sandbox mode for testing
      // PayPal sandbox URL: https://www.sandbox.paypal.com/sdk/js
      // This ensures all payments are fake/test payments
      const paypalUrl = isTestMode
        ? `https://www.sandbox.paypal.com/sdk/js?client-id=${clientId}&currency=${currency}`
        : `https://www.paypal.com/sdk/js?client-id=${clientId}&currency=${currency}`;
      script.src = paypalUrl;
      script.async = true;
      script.dataset.paypalSdk = 'true';
      
      script.onload = () => {
        try {
          if (window.paypal) {
            resolve(window.paypal);
          } else {
            reject(new Error('PayPal SDK loaded but window.paypal is not available'));
          }
        } catch (err) {
          reject(err);
        }
      };
      
      script.onerror = (err) => {
        // Check if it's a CORS/script error
        const errorMessage = err?.message || 'Failed to load PayPal SDK';
        if (errorMessage.includes('Script error') || errorMessage === 'Script error.') {
          console.warn('PayPal SDK script error (likely CORS):', err);
          // Try to continue anyway - PayPal might still work if already loaded
          if (window.paypal) {
            resolve(window.paypal);
            return;
          }
        }
        
        const error = new Error('Failed to load PayPal SDK. Please check your internet connection and try again.');
        console.error('PayPal script error:', err);
        if (onError) {
          onError(error);
        }
        reject(error);
      };
      
      document.body.appendChild(script);
    } catch (err) {
      console.error('Error setting up PayPal script:', err);
      reject(err);
    }
  });
};

const PayPalButton = ({
  amount,
  currency = 'PHP',
  onApprove,
  onError,
  disabled = false,
  className = ''
}) => {
  const paypalRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const clientId = PAYPAL_CLIENT_ID;
  const isTestMode = isPayPalSandbox();

  useEffect(() => {
    let isMounted = true;
    let buttonInstance = null;

    if (disabled) {
      setLoading(false);
      return undefined;
    }

    // Clear previous button if exists
    if (paypalRef.current) {
      paypalRef.current.innerHTML = '';
    }

    loadPayPalScript(clientId, currency, onError, isTestMode)
      .then((paypal) => {
        if (!isMounted || !paypalRef.current) return;

        try {
          setLoading(false);
          
          if (!paypal || !paypal.Buttons) {
            throw new Error('PayPal SDK is not properly loaded');
          }

          buttonInstance = paypal.Buttons({
            style: {
              layout: 'vertical',
              color: 'gold',
              shape: 'rect',
              label: 'paypal'
            },
            createOrder: (_, actions) => {
              try {
                return actions.order.create({
                  purchase_units: [
                    {
                      amount: {
                        value: parseFloat(amount).toFixed(2),
                        currency_code: currency
                      }
                    }
                  ]
                });
              } catch (err) {
                console.error('Error creating PayPal order:', err);
                if (onError) onError(err);
                throw err;
              }
            },
            onApprove: async (_, actions) => {
              try {
                const details = await actions.order.capture();
                if (onApprove && isMounted) {
                  onApprove(details);
                }
              } catch (err) {
                console.error('Error capturing PayPal order:', err);
                if (onError && isMounted) {
                  onError(err);
                }
              }
            },
            onError: (err) => {
              console.error('PayPal button error:', err);
              if (onError && isMounted) {
                onError(err);
              }
            },
            onCancel: () => {
              // User cancelled - no error needed
              console.log('PayPal payment cancelled by user');
            }
          });

          if (paypalRef.current && buttonInstance) {
            buttonInstance.render(paypalRef.current).catch((err) => {
              console.error('Error rendering PayPal button:', err);
              if (onError && isMounted) {
                onError(err);
              }
              if (isMounted) setLoading(false);
            });
          }
        } catch (err) {
          console.error('Error initializing PayPal button:', err);
          if (onError && isMounted) {
            onError(err);
          }
          if (isMounted) setLoading(false);
        }
      })
      .catch((err) => {
        console.error('Error loading PayPal script:', err);
        if (isMounted) {
          setLoading(false);
          setError(err.message || 'Failed to load PayPal');
          if (onError) {
            onError(err);
          }
        }
      });

    return () => {
      isMounted = false;
      if (buttonInstance && typeof buttonInstance.close === 'function') {
        try {
          buttonInstance.close();
        } catch (err) {
          console.error('Error closing PayPal button:', err);
        }
      }
      if (paypalRef.current) {
        paypalRef.current.innerHTML = '';
      }
    };
  }, [amount, currency, clientId, disabled, onApprove, onError]);

  if (!clientId) {
    return (
      <div className="paypal-placeholder">
        <p><strong>PayPal Sandbox Client ID Required</strong></p>
        <p>To use PayPal in test mode:</p>
        <ol style={{ textAlign: 'left', display: 'inline-block', marginTop: '0.5rem' }}>
          <li>Go to <a href="https://developer.paypal.com/" target="_blank" rel="noopener noreferrer">PayPal Developer</a></li>
          <li>Create a sandbox app and get your Client ID</li>
          <li>Set <code>REACT_APP_PAYPAL_CLIENT_ID</code> in your .env file</li>
          <li>Or use this test ID: <code>sb</code> (for demo purposes)</li>
        </ol>
        <p style={{ marginTop: '1rem', fontSize: '0.875rem', color: '#6B7280' }}>
          <strong>Test PayPal Accounts:</strong><br/>
          Use any email/password from PayPal Sandbox test accounts<br/>
          Or use: buyer@personal.example.com / test1234
        </p>
      </div>
    );
  }

  if (disabled) {
    return (
      <button className="paypal-disabled-btn" disabled>
        Pay with PayPal
      </button>
    );
  }

  if (error) {
    return (
      <div className="paypal-error-message">
        <p>PayPal is temporarily unavailable.</p>
        <p style={{ fontSize: '0.875rem', marginTop: '0.5rem' }}>
          {error}
        </p>
        <button
          className="paypal-retry-btn"
          onClick={() => {
            setError(null);
            setLoading(true);
            // Force re-render by updating key in parent
            if (onError) {
              onError(new Error('Retrying PayPal...'));
            }
          }}
          style={{
            marginTop: '0.75rem',
            padding: '0.5rem 1rem',
            background: '#6366F1',
            color: 'white',
            border: 'none',
            borderRadius: '0.5rem',
            cursor: 'pointer'
          }}
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className={`paypal-button-wrapper ${className}`}>
      {loading && <div className="paypal-loading">Loading PayPal…</div>}
      {isTestMode && !loading && (
        <div style={{
          marginBottom: '0.75rem',
          padding: '0.5rem',
          background: '#FEF3C7',
          border: '1px solid #F59E0B',
          borderRadius: '0.375rem',
          fontSize: '0.75rem',
          color: '#92400E',
          textAlign: 'center'
        }}>
          🧪 Test Mode: Using PayPal Sandbox
        </div>
      )}
      <div ref={paypalRef} />
    </div>
  );
};

export default PayPalButton;

