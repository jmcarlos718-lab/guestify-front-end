/**
 * BackendStatus Component
 *
 * Shows backend connection status and helpful error messages
 */

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL, getHealthCheckUrl, isProductionApiConfigured } from '../../config/api';

const BackendStatus = ({ showDetails = false }) => {
  const [status, setStatus] = useState('checking');
  const [error, setError] = useState(null);

  useEffect(() => {
    const checkBackend = async () => {
      if (!isProductionApiConfigured()) {
        setStatus('disconnected');
        setError('missing_env');
        return;
      }

      const healthUrl = getHealthCheckUrl();
      if (!healthUrl) {
        setStatus('disconnected');
        setError('missing_env');
        return;
      }

      try {
        console.log('[BackendStatus] API Base URL:', API_BASE_URL);
        console.log('[BackendStatus] Health URL:', healthUrl);

        const response = await axios.get(healthUrl, {
          timeout: 5000,
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json'
          }
        });

        console.log('[BackendStatus] Response:', response.data);

        if (response.data?.status === 'ok') {
          setStatus('connected');
          setError(null);
        } else {
          setStatus('error');
          setError('Backend responded but status is not ok');
        }
      } catch (err) {
        console.error('[BackendStatus] Error:', err.message, err.code);
        setStatus('disconnected');

        if (err.response?.status === 403) {
          setError('cors');
          return;
        }

        if (err.code === 'ECONNREFUSED' || err.code === 'ERR_NETWORK' || err.message?.includes('Network Error')) {
          setError('network');
        } else {
          setError(err.message || 'Cannot connect to backend');
        }
      }
    };

    checkBackend();
    const interval = setInterval(checkBackend, 5000);
    return () => clearInterval(interval);
  }, []);

  if (!showDetails && status === 'connected') {
    return null;
  }

  if (status === 'checking') {
    return (
      <div style={{ padding: '10px', background: '#fef3c7', color: '#92400e', borderRadius: '4px', margin: '10px 0' }}>
        Checking backend connection...
      </div>
    );
  }

  if (status === 'disconnected' && error === 'missing_env') {
    return (
      <div style={{ padding: '15px', background: '#fee2e2', color: '#991b1b', borderRadius: '4px', margin: '10px 0', border: '1px solid #fca5a5' }}>
        <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>Backend API URL not configured</div>
        <div style={{ fontSize: '14px', marginBottom: '8px' }}>
          Set <strong>REACT_APP_API_URL</strong> in Vercel to your Railway backend URL.
        </div>
        <div style={{ fontSize: '13px', background: '#fff', padding: '10px', borderRadius: '4px' }}>
          <strong>Example:</strong>
          <code style={{ display: 'block', background: '#f3f4f6', padding: '8px', borderRadius: '4px', marginTop: '8px' }}>
            REACT_APP_API_URL=https://your-app.up.railway.app/api
          </code>
          <div style={{ marginTop: '10px' }}>Redeploy Vercel after saving the variable.</div>
        </div>
      </div>
    );
  }

  if (status === 'disconnected' && error === 'cors') {
    return (
      <div style={{ padding: '15px', background: '#fee2e2', color: '#991b1b', borderRadius: '4px', margin: '10px 0', border: '1px solid #fca5a5' }}>
        <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>Backend blocked this site (CORS)</div>
        <div style={{ fontSize: '14px' }}>
          In Railway, set <strong>CLIENT_URL</strong> to your Vercel URL, then redeploy the backend.
        </div>
      </div>
    );
  }

  if (status === 'disconnected') {
    const apiLabel = API_BASE_URL || 'your Railway API URL';

    if (process.env.NODE_ENV === 'production') {
      return (
        <div style={{ padding: '15px', background: '#fee2e2', color: '#991b1b', borderRadius: '4px', margin: '10px 0', border: '1px solid #fca5a5' }}>
          <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>Cannot reach hosted backend</div>
          <div style={{ fontSize: '14px', marginBottom: '8px' }}>
            The frontend could not connect to <strong>{apiLabel}</strong>
          </div>
          <div style={{ fontSize: '13px', background: '#fff', padding: '10px', borderRadius: '4px' }}>
            <strong>Check:</strong>
            <ol style={{ margin: '8px 0', paddingLeft: '20px' }}>
              <li>Railway backend is deployed and running</li>
              <li><code>/api/health</code> works in the browser</li>
              <li>Vercel has <code>REACT_APP_API_URL=https://your-app.up.railway.app/api</code></li>
              <li>Railway has <code>CLIENT_URL=https://your-app.vercel.app</code></li>
            </ol>
          </div>
        </div>
      );
    }

    return (
      <div style={{ padding: '15px', background: '#fee2e2', color: '#991b1b', borderRadius: '4px', margin: '10px 0', border: '1px solid #fca5a5' }}>
        <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>Backend Server Not Running</div>
        <div style={{ fontSize: '14px', marginBottom: '8px' }}>
          The backend server must be running on <strong>http://localhost:4000</strong>
        </div>
        <div style={{ fontSize: '13px', background: '#fff', padding: '10px', borderRadius: '4px', marginTop: '8px' }}>
          <strong>To fix this:</strong>
          <ol style={{ margin: '8px 0', paddingLeft: '20px' }}>
            <li>Open a new terminal/command prompt</li>
            <li>Navigate to the backend folder: <code style={{ background: '#f3f4f6', padding: '2px 6px', borderRadius: '3px' }}>cd backend</code></li>
            <li>Start the server: <code style={{ background: '#f3f4f6', padding: '2px 6px', borderRadius: '3px' }}>npm start</code></li>
            <li>Wait for: <code style={{ background: '#f3f4f6', padding: '2px 6px', borderRadius: '3px' }}>Guestify API running on http://localhost:4000</code></li>
            <li>Keep that terminal open and refresh this page</li>
          </ol>
        </div>
      </div>
    );
  }

  if (status === 'connected') {
    return (
      <div style={{ padding: '10px', background: '#d1fae5', color: '#065f46', borderRadius: '4px', margin: '10px 0' }}>
        Backend connected successfully
      </div>
    );
  }

  return null;
};

export default BackendStatus;
