import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ROUTES } from '../../config/constants';
import * as backendAuthService from '../../services/backendAuthService';
import Button from '../../components/common/Button';

const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState('loading');
  const [message, setMessage] = useState('Verifying your email...');

  useEffect(() => {
    const token = searchParams.get('token');
    if (!token) {
      setStatus('error');
      setMessage('Verification token is missing. Please use the link from your email.');
      return;
    }

    const verify = async () => {
      try {
        const result = await backendAuthService.verifyEmail(token);
        setStatus(result.ok ? 'success' : 'error');
        setMessage(result.message || 'Email verified successfully. You can now log in.');
      } catch (error) {
        setStatus('error');
        setMessage(error.message || 'Unable to verify email. Please try again.');
      }
    };

    verify();
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-12">
      <div className="max-w-lg w-full bg-white shadow-card rounded-2xl p-8 text-center space-y-6">
        <div className="flex flex-col items-center gap-4">
          <div
            className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl ${
              status === 'success'
                ? 'bg-emerald-50 text-emerald-600'
                : status === 'error'
                  ? 'bg-rose-50 text-rose-600'
                  : 'bg-indigo-50 text-indigo-600'
            }`}
          >
            {status === 'success' ? '✅' : status === 'error' ? '⚠️' : '⏳'}
          </div>
          <h1 className="text-2xl font-semibold text-slate-900">
            {status === 'success'
              ? 'Email Verified'
              : status === 'error'
                ? 'Verification Failed'
                : 'Verifying Email'}
          </h1>
          <p className="text-slate-600">{message}</p>
        </div>

        <div className="flex flex-col gap-3">
          <Link to={ROUTES.LOGIN}>
            <Button variant="primary" fullWidth>
              Go to Login
            </Button>
          </Link>
          <Link to={ROUTES.HOME}>
            <Button variant="outline" fullWidth>
              Back to Home
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmail;






















