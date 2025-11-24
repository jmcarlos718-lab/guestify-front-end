/**
 * Register Page - Redesigned
 * 
 * Modern split-screen registration page with Terms & Conditions
 */

import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthContext } from '../../context/AuthContext';
import { ROUTES, USER_ROLES } from '../../config/constants';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import TermsModal from '../../components/common/TermsModal';
import { validateEmail, validatePhone } from '../../utils/helpers';
import { getEmailRoleUsage } from '../../services/userService';
import { toast } from 'react-toastify';
import './AuthRedesign.css';

const Register = () => {
  const navigate = useNavigate();
  const { register, loading } = useAuthContext();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    displayName: '',
    phone: '',
    role: USER_ROLES.GUEST
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [emailStatus, setEmailStatus] = useState({
    checking: false,
    blocked: false,
    message: ''
  });

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

    if (!formData.displayName) {
      newErrors.displayName = 'Name is required';
    } else if (formData.displayName.length < 2) {
      newErrors.displayName = 'Name must be at least 2 characters';
    }

    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    } else if (emailStatus.blocked) {
      newErrors.email = emailStatus.message;
    }

    if (formData.phone && !validatePhone(formData.phone)) {
      newErrors.phone = 'Please enter a valid phone number';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      newErrors.password = 'Password must contain uppercase, lowercase, and number';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (!acceptedTerms) {
      newErrors.terms = 'You must accept the Terms & Conditions';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  useEffect(() => {
    let isMounted = true;
    const checkEmail = async () => {
      if (!formData.email || !validateEmail(formData.email)) {
        if (isMounted) {
          setEmailStatus({ checking: false, blocked: false, message: '' });
        }
        return;
      }

      setEmailStatus((prev) => ({ ...prev, checking: true }));
      try {
        const { hasGuest, hasHost, fullyUsed } = await getEmailRoleUsage(formData.email);

        let blocked = false;
        let message = '';

        if (
          fullyUsed ||
          (formData.role === USER_ROLES.GUEST && hasGuest) ||
          (formData.role === USER_ROLES.HOST && hasHost)
        ) {
          blocked = true;
          message = 'This email is already in use. You cannot create another account with this email.';
        } else if (hasGuest || hasHost) {
          message = 'This email already has another role. Enter the same password to add this role.';
        }

        if (isMounted) {
          setEmailStatus({
            checking: false,
            blocked,
            message
          });
        }
      } catch (error) {
        console.error('Email pre-check failed:', error);
        if (isMounted) {
          setEmailStatus({ checking: false, blocked: false, message: '' });
        }
      }
    };

    const delay = setTimeout(checkEmail, 400);
    return () => {
      isMounted = false;
      clearTimeout(delay);
    };
  }, [formData.email, formData.role]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    console.log('[Register] Form submitted');
    console.log('[Register] Form data:', { email: formData.email, role: formData.role, acceptedTerms });
    
    if (!validateForm()) {
      console.log('[Register] Form validation failed:', errors);
      if (!acceptedTerms) {
        setShowTermsModal(true);
      }
      return;
    }

    console.log('[Register] Starting registration process...');
    setIsSubmitting(true);

    try {
      if (emailStatus.blocked) {
        toast.error(emailStatus.message);
        setIsSubmitting(false);
        return;
      }

      console.log('[Register] Calling register function...');
      await register(
        formData.email,
        formData.password,
        formData.displayName,
        formData.role,
        formData.phone
      );
      
      console.log('[Register] Registration successful!');
      toast.success('Registration successful! Please check your email to verify your account before signing in.');
      navigate(ROUTES.LOGIN, { replace: true });
    } catch (error) {
      console.error('[Register] Registration error:', error);
      console.error('[Register] Error code:', error.code);
      console.error('[Register] Error message:', error.message);
      console.error('[Register] Error stack:', error.stack);
      console.error('[Register] Full error object:', JSON.stringify(error, null, 2));
      
      // Provide user-friendly error messages
      let errorMessage = error.message || 'Registration failed. Please try again.';
      
      // Handle specific Firebase errors
      if (error.code) {
        switch (error.code) {
          case 'auth/email-already-in-use':
            errorMessage = 'This email is already registered. Please sign in instead.';
            break;
          case 'auth/invalid-email':
            errorMessage = 'Please enter a valid email address.';
            break;
          case 'auth/weak-password':
            errorMessage = 'Password is too weak. Please use a stronger password with uppercase, lowercase, and numbers.';
            break;
          case 'auth/network-request-failed':
            errorMessage = 'Network error. Please check your internet connection and try again.';
            break;
          case 'permission-denied':
          case 'PERMISSION_DENIED':
            errorMessage = 'Firestore permission denied. The security rules need to be deployed to Firebase. Check the browser console (F12) for details.';
            break;
          default:
            console.error('[Register] Unhandled error code:', error.code);
            // Check if it's a Firestore permission error
            if (error.message?.includes('permission') || error.message?.includes('Permission') || error.code?.includes('permission')) {
              errorMessage = `Firestore permission error (${error.code || 'unknown'}). Please deploy Firestore rules to Firebase Console. See DEPLOY_RULES.md for instructions.`;
            } else {
              // Show the actual error for debugging
              errorMessage = `${error.message || 'Registration failed'} (Code: ${error.code || 'unknown'})`;
            }
        }
      } else if (error.message?.includes('permission') || error.message?.includes('Permission')) {
        errorMessage = 'Firestore permission denied. Please deploy Firestore security rules to Firebase Console.';
      }
      
      toast.error(errorMessage);
      console.error('[Register] Displayed error to user:', errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAcceptTerms = () => {
    setAcceptedTerms(true);
    setShowTermsModal(false);
  };

  return (
    <>
      <div className="auth-split-container">
        {/* Left Side - Animated Background */}
        <div className="auth-split-left">
          <div className="auth-background-overlay"></div>
          <div className="auth-background-content">
            <h1 className="auth-brand-title">Guestify</h1>
            <p className="auth-brand-subtitle">Join thousands of hosts and guests</p>
          </div>
        </div>

        {/* Right Side - Form */}
        <div className="auth-split-right">
          <div className="auth-form-wrapper">
            <div className="auth-form-header">
              <h1 className="auth-form-title">Create Account</h1>
              <p className="auth-form-subtitle">Join Guestify and start your journey</p>
            </div>

            <form onSubmit={handleSubmit} className="auth-form">
              <div className="role-selection">
                <label className="role-label">I want to:</label>
                <div className="role-options">
                  <button
                    type="button"
                    className={`role-option ${formData.role === USER_ROLES.GUEST ? 'active' : ''}`}
                    onClick={() => setFormData(prev => ({ ...prev, role: USER_ROLES.GUEST }))}
                  >
                    Book Experiences
                  </button>
                  <button
                    type="button"
                    className={`role-option ${formData.role === USER_ROLES.HOST ? 'active' : ''}`}
                    onClick={() => setFormData(prev => ({ ...prev, role: USER_ROLES.HOST }))}
                  >
                    Host Listings
                  </button>
                </div>
              </div>

              <Input
                type="text"
                name="displayName"
                label="Full Name"
                placeholder="Enter your full name"
                value={formData.displayName}
                onChange={handleChange}
                error={errors.displayName}
                required
                fullWidth
              />

              <Input
                type="email"
                name="email"
                label="Email Address"
                placeholder="Enter your email"
                value={formData.email}
                onChange={handleChange}
                error={errors.email || (emailStatus.blocked ? emailStatus.message : '')}
                helperText={!errors.email && !emailStatus.blocked ? emailStatus.message : undefined}
                required
                fullWidth
              />

              <Input
                type="tel"
                name="phone"
                label="Phone Number (Optional)"
                placeholder="Enter your phone number"
                value={formData.phone}
                onChange={handleChange}
                error={errors.phone}
                fullWidth
              />

              <Input
                type="password"
                name="password"
                label="Password"
                placeholder="Create a password"
                value={formData.password}
                onChange={handleChange}
                error={errors.password}
                helperText="Must contain uppercase, lowercase, and number"
                required
                fullWidth
              />

              <Input
                type="password"
                name="confirmPassword"
                label="Confirm Password"
                placeholder="Confirm your password"
                value={formData.confirmPassword}
                onChange={handleChange}
                error={errors.confirmPassword}
                required
                fullWidth
              />

              <div className="terms-checkbox-container">
                <label className="terms-checkbox-label">
                  <input
                    type="checkbox"
                    checked={acceptedTerms}
                    onChange={(e) => {
                      if (!e.target.checked) {
                        setAcceptedTerms(false);
                      } else {
                        setShowTermsModal(true);
                      }
                    }}
                    className="terms-checkbox"
                  />
                  <span>
                    I have read and agree to the{' '}
                    <button
                      type="button"
                      className="terms-link-button"
                      onClick={(e) => {
                        e.preventDefault();
                        setShowTermsModal(true);
                      }}
                    >
                      Terms & Conditions
                    </button>
                  </span>
                </label>
                {errors.terms && (
                  <span className="input-error">{errors.terms}</span>
                )}
              </div>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                fullWidth
                loading={isSubmitting || loading}
                disabled={
                  isSubmitting ||
                  loading ||
                  !acceptedTerms ||
                  emailStatus.blocked ||
                  emailStatus.checking
                }
              >
                Create Account
              </Button>
            </form>

            <div className="auth-footer">
              <p>
                Already have an account?{' '}
                <Link to={ROUTES.LOGIN} className="auth-link">
                  Sign in
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>

      <TermsModal
        isOpen={showTermsModal}
        onClose={() => setShowTermsModal(false)}
        onAccept={handleAcceptTerms}
      />
    </>
  );
};

export default Register;
