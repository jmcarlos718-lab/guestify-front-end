/**
 * Login Page - Redesigned
 * 
 * Modern split-screen login page with animated background
 */

import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthContext } from '../../context/AuthContext';
import { ROUTES } from '../../config/constants';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import { validateEmail } from '../../utils/helpers';
import { toast } from 'react-toastify';
import * as backendAuthService from '../../services/backendAuthService';
import './AuthRedesign.css';

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { signIn, loading } = useAuthContext();

  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [verificationMessage, setVerificationMessage] = useState('');
  const [pendingVerificationEmail, setPendingVerificationEmail] = useState('');
  const [resending, setResending] = useState(false);
  const [debugInfo, setDebugInfo] = useState('');
  useEffect(() => {
    setVerificationMessage('');
    setPendingVerificationEmail('');
  }, [formData.email]);


  const from = location.state?.from?.pathname || null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setDebugInfo('Form submitted, validating...');

    if (!validateForm()) {
      console.log('[Login] Form validation failed:', errors);
      setDebugInfo('Validation failed: ' + JSON.stringify(errors));
      return;
    }

    console.log('[Login] Starting login process for:', formData.email);
    setDebugInfo('Starting login...');
    setIsSubmitting(true);

    // Check backend verification status (optional - won't block if backend is unavailable)
    try {
      const loginCheck = await backendAuthService.canLogin(formData.email);
      if (loginCheck && !loginCheck.isVerified && loginCheck.reason) {
        const message = loginCheck.reason || 'Please verify your email before logging in.';
        setVerificationMessage(message);
        setPendingVerificationEmail(formData.email);
        // Don't block login, just show warning
        toast.warn(message);
      } else {
        setVerificationMessage('');
        setPendingVerificationEmail('');
      }
    } catch (error) {
      // Backend unavailable - allow login to proceed with Firebase
      if (error.message && (error.message.toLowerCase().includes('network') || 
          error.message.toLowerCase().includes('cannot connect') ||
          error.message.toLowerCase().includes('unavailable'))) {
        console.warn('Backend verification service unavailable, continuing with Firebase login');
        setVerificationMessage('');
        setPendingVerificationEmail('');
      } else {
        // Other errors - show warning but allow login
        console.warn('Verification check failed:', error.message);
        setVerificationMessage('');
        setPendingVerificationEmail('');
      }
    }

    try {
      console.log('[Login] Calling signIn...');
      setDebugInfo('Calling Firebase signIn...');
      await signIn(formData.email, formData.password);
      console.log('[Login] Sign in successful!');
      setDebugInfo('Login successful! Redirecting...');
      toast.success('Login successful!');
      
      if (from) {
        navigate(from, { replace: true });
      } else {
        navigate(ROUTES.HOME, { replace: true });
      }
    } catch (error) {
      console.error('[Login] Sign in error:', error);
      console.error('[Login] Error code:', error.code);
      console.error('[Login] Error message:', error.message);
      setDebugInfo(`Error: ${error.code || error.message}`);
      
      // Provide user-friendly error messages
      let errorMessage = error.message || 'Login failed. Please try again.';
      
      // Handle specific Firebase errors
      if (error.code) {
        switch (error.code) {
          case 'auth/user-not-found':
            errorMessage = 'No account found with this email. Please check your email or sign up.';
            break;
          case 'auth/wrong-password':
          case 'auth/invalid-credential':
            errorMessage = 'Incorrect email or password. Please try again.';
            break;
          case 'auth/email-not-verified':
            errorMessage = 'Please verify your email before logging in.';
            setVerificationMessage(errorMessage);
            setPendingVerificationEmail(formData.email);
            break;
          case 'auth/invalid-email':
            errorMessage = 'Please enter a valid email address.';
            break;
          case 'auth/too-many-requests':
            errorMessage = 'Too many failed login attempts. Please try again later.';
            break;
          case 'auth/network-request-failed':
            errorMessage = 'Network error. Please check your internet connection and try again.';
            break;
          case 'auth/user-disabled':
            errorMessage = 'This account has been disabled. Please contact support.';
            break;
          default:
            console.error('[Login] Unhandled error code:', error.code);
        }
      }
      
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendVerification = async () => {
    if (!pendingVerificationEmail) return;
    setResending(true);
    try {
      await backendAuthService.resendVerification(pendingVerificationEmail);
      toast.success('Verification email sent! Please check your inbox.');
    } catch (error) {
      const message =
        error.message && error.message.toLowerCase().includes('network')
          ? 'Cannot reach verification service right now. Please try again later.'
          : error.message || 'Unable to resend verification email.';
      toast.error(message);
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="auth-split-container">
      {/* Left Side - Animated Background */}
      <div className="auth-split-left">
        <div className="auth-background-overlay"></div>
        <div className="auth-background-content">
          <h1 className="auth-brand-title">Guestify</h1>
          <p className="auth-brand-subtitle">Your trusted platform for amazing stays</p>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="auth-split-right">
        <div className="auth-form-wrapper">
          <div className="auth-form-header">
            <h1 className="auth-form-title">Welcome Back</h1>
            <p className="auth-form-subtitle">Sign in to your account</p>
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
            <Input
              type="email"
              name="email"
              label="Email Address"
              placeholder="Enter your email"
              value={formData.email}
              onChange={handleChange}
              error={errors.email}
              required
              fullWidth
            />

            <Input
              type="password"
              name="password"
              label="Password"
              placeholder="Enter your password"
              value={formData.password}
              onChange={handleChange}
              error={errors.password}
              required
              fullWidth
            />

            <div className="auth-options">
              <Link to={ROUTES.FORGOT_PASSWORD} className="auth-link">
                Forgot password?
              </Link>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              loading={isSubmitting || loading}
              disabled={isSubmitting || loading}
            >
              Sign In
            </Button>

            {process.env.NODE_ENV === 'development' && debugInfo && (
              <div style={{ marginTop: '10px', padding: '8px', background: '#f3f4f6', borderRadius: '4px', fontSize: '12px', color: '#666' }}>
                Debug: {debugInfo}
              </div>
            )}

            {verificationMessage && (
              <div className="verification-alert">
                <p>{verificationMessage}</p>
                <Button
                  type="button"
                  variant="outline"
                  size="md"
                  fullWidth
                  onClick={handleResendVerification}
                  loading={resending}
                  disabled={resending}
                >
                  Resend Verification Email
                </Button>
              </div>
            )}
          </form>

          <div className="auth-footer">
            <p>
              Don't have an account?{' '}
              <Link to={ROUTES.REGISTER} className="auth-link">
                Sign up
              </Link>
            </p>
            <p className="admin-login-link">
              Are you an admin?{' '}
              <Link to={ROUTES.ADMIN_LOGIN} className="auth-link">
                Access the admin portal
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
