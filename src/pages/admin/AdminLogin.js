import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthContext } from '../../context/AuthContext';
import { ROUTES } from '../../config/constants';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import BackendStatus from '../../components/common/BackendStatus';
import { validateEmail } from '../../utils/helpers';
import { toast } from 'react-toastify';

const AdminLogin = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { adminSignIn, adminAuthLoading, isAdminAuthenticated } = useAuthContext();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const from = location.state?.from?.pathname || ROUTES.ADMIN_DASHBOARD;

  // Redirect to dashboard if already authenticated
  useEffect(() => {
    if (isAdminAuthenticated) {
      navigate(ROUTES.ADMIN_DASHBOARD, { replace: true });
    }
  }, [isAdminAuthenticated, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Enter a valid email address';
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
    if (!validateForm()) return;

    setSubmitting(true);
    try {
      await adminSignIn(formData.email, formData.password);
      toast.success('Welcome back, admin!');
      // Navigation will be handled by useEffect when isAdminAuthenticated becomes true
      // This ensures the state is properly updated before redirecting
    } catch (error) {
      toast.error(error.message || 'Unable to sign in as admin');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="w-full max-w-4xl">
        <BackendStatus showDetails={true} />
        <div className="grid md:grid-cols-2 gap-6 shadow-card rounded-3xl bg-white overflow-hidden">
        <div className="bg-gradient-to-br from-brand-500 to-brand-700 text-white p-10 flex flex-col justify-between">
          <div>
            <p className="text-sm uppercase tracking-widest opacity-80">Guestify Admin</p>
            <h1 className="text-3xl font-semibold mt-4 leading-tight">
              Secure access to manage users, hosts, and listings.
            </h1>
          </div>
          <div className="space-y-2 text-sm opacity-90">
            <p>• View real-time platform stats</p>
            <p>• Moderate hosts and listings</p>
            <p>• Monitor guest activity</p>
          </div>
        </div>

        <div className="p-10">
          <div className="space-y-2 mb-8">
            <p className="text-sm font-semibold text-brand-600">Administrator Login</p>
            <h2 className="text-2xl font-semibold text-slate-900">Welcome back</h2>
            <p className="text-slate-500 text-sm">
              Use your admin credentials to access the control center.
            </p>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit}>
            <Input
              type="email"
              name="email"
              label="Admin Email"
              placeholder="admin@guestify.com"
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

            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              loading={submitting || adminAuthLoading}
              disabled={submitting || adminAuthLoading}
            >
              Sign In
            </Button>
          </form>

          <div className="mt-8 text-sm text-slate-500 text-center space-y-2">
            <p>
              Need to manage listings as a host instead?{' '}
              <Link to={ROUTES.LOGIN} className="text-brand-600 font-medium">
                Go to user login
              </Link>
            </p>
            <p className="text-xs">
              Protected area. Unauthorized access is prohibited and monitored.
            </p>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
};

export default AdminLogin;



