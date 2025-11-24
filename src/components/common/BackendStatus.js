/**
 * BackendStatus Component
 * 
 * Shows backend connection status and helpful error messages
 */

import React, { useState, useEffect } from 'react';
import axios from 'axios';

const BackendStatus = ({ showDetails = false }) => {
  const [status, setStatus] = useState('checking');
  const [error, setError] = useState(null);

  useEffect(() => {
    const checkBackend = async () => {
      try {
        // Server route is /api/health, so full URL is http://localhost:4000/api/health
        // Get base URL from env or use default
        const apiBaseUrl = process.env.REACT_APP_API_URL || 'http://localhost:4000/api';
        
        // Construct health URL - server route is /api/health
        // Default: http://localhost:4000/api/health
        let healthUrl;
        if (apiBaseUrl === 'http://localhost:4000/api' || apiBaseUrl.endsWith('/api')) {
          healthUrl = `${apiBaseUrl}/health`;
        } else if (apiBaseUrl.endsWith('/api/')) {
          healthUrl = `${apiBaseUrl}health`;
        } else {
          // Fallback: construct from base URL
          const base = apiBaseUrl.replace(/\/api.*$/, '').replace(/\/$/, '');
          healthUrl = `${base}/api/health`;
        }
        
        // Debug: log the URL being called
        console.log('[BackendStatus] API Base URL:', apiBaseUrl);
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
        // Extract a cleaner error message
        if (err.code === 'ECONNREFUSED' || err.code === 'ERR_NETWORK' || err.message?.includes('Network Error')) {
          setError('Cannot connect to backend server. Make sure it is running on port 4000.');
        } else {
          setError(err.message || 'Cannot connect to backend');
        }
      }
    };

    checkBackend();
    // Check every 5 seconds
    const interval = setInterval(checkBackend, 5000);
    return () => clearInterval(interval);
  }, []);

  if (!showDetails && status === 'connected') {
    return null; // Don't show anything if connected and not showing details
  }

  if (status === 'checking') {
    return (
      <div style={{ padding: '10px', background: '#fef3c7', color: '#92400e', borderRadius: '4px', margin: '10px 0' }}>
        🔍 Checking backend connection...
      </div>
    );
  }

  if (status === 'disconnected') {
    return (
      <div style={{ padding: '15px', background: '#fee2e2', color: '#991b1b', borderRadius: '4px', margin: '10px 0', border: '1px solid #fca5a5' }}>
        <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>⚠️ Backend Server Not Running</div>
        <div style={{ fontSize: '14px', marginBottom: '8px' }}>
          The backend server must be running on <strong>http://localhost:4000</strong>
        </div>
        <div style={{ fontSize: '13px', background: '#fff', padding: '10px', borderRadius: '4px', marginTop: '8px' }}>
          <strong>To fix this:</strong>
          <ol style={{ margin: '8px 0', paddingLeft: '20px' }}>
            <li>Open a <strong>new terminal/command prompt</strong></li>
            <li>Navigate to the backend folder: <code style={{ background: '#f3f4f6', padding: '2px 6px', borderRadius: '3px' }}>cd backend</code></li>
            <li>Start the server: <code style={{ background: '#f3f4f6', padding: '2px 6px', borderRadius: '3px' }}>npm start</code></li>
            <li>Wait for: <code style={{ background: '#f3f4f6', padding: '2px 6px', borderRadius: '3px' }}>✅ Guestify API running on http://localhost:4000</code></li>
            <li>Keep that terminal open and <strong>refresh this page</strong> (F5 or Ctrl+R)</li>
          </ol>
          <div style={{ marginTop: '10px', padding: '8px', background: '#fef3c7', borderRadius: '4px' }}>
            <strong>💡 Tip:</strong> If the backend is already running, try refreshing this page (F5) to check the connection again.
          </div>
        </div>
      </div>
    );
  }

  if (status === 'connected') {
    return (
      <div style={{ padding: '10px', background: '#d1fae5', color: '#065f46', borderRadius: '4px', margin: '10px 0' }}>
        ✅ Backend connected successfully
      </div>
    );
  }

  return null;
};

export default BackendStatus;

