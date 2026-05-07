/**
 * Forgot Password Page
 * 
 * Password reset request page
 */

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuthContext } from '../../context/AuthContext';
import { ROUTES } from '../../config/constants';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Card from '../../components/common/Card';
import { validateEmail } from '../../utils/helpers';
import { toast } from 'react-toastify';
import './Auth.css';

const ForgotPassword = () => {
  const { resetPassword } = useAuthContext();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email) {
      setError('Email is required');
      return;
    }

    if (!validateEmail(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      await resetPassword(email);
      setIsSubmitted(true);
      toast.success('Password reset email sent! Check your inbox.');
    } catch (err) {
      setError(err.message || 'Failed to send reset email. Please try again.');
      toast.error(err.message || 'Failed to send reset email.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="auth-container">
        <div className="auth-wrapper">
          <Card className="auth-card">
            <div className="auth-header">
              <h1 className="auth-title">Check Your Email</h1>
              <p className="auth-subtitle">
                We've sent a password reset link to {email}
              </p>
            </div>

            <div style={{ padding: '2rem', textAlign: 'center' }}>
              <p style={{ color: '#6B7280', marginBottom: '1.5rem' }}>
                Click the link in the email to reset your password.
                If you don't see it, check your spam folder.
              </p>

              <Button
                variant="primary"
                size="lg"
                fullWidth
                onClick={() => {
                  setIsSubmitted(false);
                  setEmail('');
                }}
              >
                Resend Email
              </Button>
            </div>

            <div className="auth-footer">
              <Link to={ROUTES.LOGIN} className="auth-link">
                Back to Sign In
              </Link>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-container">
      <div className="auth-wrapper">
        <Card className="auth-card">
          <div className="auth-header">
            <h1 className="auth-title">Reset Password</h1>
            <p className="auth-subtitle">
              Enter your email and we'll send you a reset link
            </p>
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
            <Input
              type="email"
              label="Email Address"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError('');
              }}
              error={error}
              required
              fullWidth
            />

            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              loading={isSubmitting}
              disabled={isSubmitting}
            >
              Send Reset Link
            </Button>
          </form>

          <div className="auth-footer">
            <Link to={ROUTES.LOGIN} className="auth-link">
              Back to Sign In
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default ForgotPassword;






























