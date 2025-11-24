/**
 * App Router
 * 
 * Main routing configuration for the application
 */

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ROUTES, USER_ROLES } from '../config/constants';
import { useAuthContext } from '../context/AuthContext';
import ProtectedRoute from '../components/routes/ProtectedRoute';

// Pages
import Home from '../pages/Home';
import Login from '../pages/auth/Login';
import Register from '../pages/auth/Register';
import ForgotPassword from '../pages/auth/ForgotPassword';
import VerifyEmail from '../pages/auth/VerifyEmail';

// Dashboard pages
import HostDashboard from '../pages/host/HostDashboard';
import GuestDashboard from '../pages/guest/GuestDashboard';
import AdminDashboard from '../pages/admin/AdminDashboard';
import AdminLogin from '../pages/admin/AdminLogin';

// Admin pages
import AdminAnalytics from '../pages/admin/Analytics';
import AdminReports from '../pages/admin/Reports';
import AdminPolicies from '../pages/admin/Policies';
import AdminSettings from '../pages/admin/Settings';

// Host pages
import Listings from '../pages/host/Listings';
import CreateListing from '../pages/host/CreateListing';
import ViewListing from '../pages/host/ViewListing';
import EditListing from '../pages/host/EditListing';
import HostBookings from '../pages/host/HostBookings';
import HostSettings from '../pages/host/Settings';

// Guest pages
import Search from '../pages/guest/Search';
import ListingDetail from '../pages/guest/ListingDetail';
import GuestBookings from '../pages/guest/Bookings';
import BookingPayment from '../pages/guest/BookingPayment';
import GuestProfile from '../pages/guest/Profile';
import GuestWishlist from '../pages/guest/Wishlist';
import GuestSettings from '../pages/guest/Settings';

// Public pages
import Booking from '../pages/Booking';
import AboutUs from '../pages/AboutUs';
import BestOffers from '../pages/BestOffers';
import Promos from '../pages/Promos';
import ContactUs from '../pages/ContactUs';
import Terms from '../pages/Terms';


// Host Listings Routes
const HostListingsRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<Listings />} />
      <Route path="/create" element={<CreateListing />} />
      <Route path="/:id" element={<ViewListing />} />
      <Route path="/:id/edit" element={<EditListing />} />
    </Routes>
  );
};

const AppRouter = () => {
  const { isAuthenticated, userProfile, loading, isHost, isAdmin, isAdminAuthenticated } = useAuthContext();

  // Redirect authenticated users away from auth pages
  const PublicRoute = ({ children }) => {
    if (loading) {
      return (
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh'
        }}>
          <div className="loading-spinner" />
        </div>
      );
    }

    // Check admin authentication first (more specific)
    if (isAdminAuthenticated || isAdmin()) {
        return <Navigate to={ROUTES.ADMIN_DASHBOARD} replace />;
      }

    if (isAuthenticated) {
      if (isHost()) {
        return <Navigate to={ROUTES.HOST_DASHBOARD} replace />;
      }

      if (
        userProfile?.role === USER_ROLES.GUEST ||
        (Array.isArray(userProfile?.roles) && userProfile.roles.includes(USER_ROLES.GUEST))
      ) {
        return <Navigate to={ROUTES.GUEST_DASHBOARD} replace />;
      }

      return <Navigate to={ROUTES.HOME} replace />;
    }

    return children;
  };

  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path={ROUTES.HOME} element={<Home />} />
        <Route path={ROUTES.VERIFY_EMAIL} element={<VerifyEmail />} />
        
        <Route
          path={ROUTES.LOGIN}
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          }
        />
        
        <Route
          path={ROUTES.REGISTER}
          element={
            <PublicRoute>
              <Register />
            </PublicRoute>
          }
        />
        
        <Route
          path={ROUTES.FORGOT_PASSWORD}
          element={
            <PublicRoute>
              <ForgotPassword />
            </PublicRoute>
          }
        />

        <Route
          path={ROUTES.ADMIN_LOGIN}
          element={
            <PublicRoute>
              <AdminLogin />
            </PublicRoute>
          }
        />

        {/* Public Pages */}
        <Route path={ROUTES.BOOKING} element={<Booking />} />
        {/* Marketing-friendly aliases */}
        <Route path={ROUTES.OFFERS} element={<BestOffers />} />
        <Route path={ROUTES.BEST_OFFERS} element={<BestOffers />} />
        <Route path={ROUTES.ABOUT} element={<AboutUs />} />
        <Route path={ROUTES.ABOUT_US} element={<AboutUs />} />
        <Route path={ROUTES.PROMOS} element={<Promos />} />
        <Route path={ROUTES.CONTACT} element={<ContactUs />} />
        <Route path={ROUTES.CONTACT_US} element={<ContactUs />} />
        <Route path={ROUTES.TERMS} element={<Terms />} />

        {/* Protected Routes - Guest */}
        <Route
          path={ROUTES.GUEST_DASHBOARD}
          element={
            <ProtectedRoute requiredRole={USER_ROLES.GUEST}>
              <GuestDashboard />
            </ProtectedRoute>
          }
        />
        
        <Route
          path={ROUTES.SEARCH}
          element={<Search />}
        />
        
        <Route
          path={ROUTES.LISTING_DETAIL}
          element={<ListingDetail />}
        />
        
        <Route
          path={ROUTES.GUEST_BOOKINGS}
          element={
            <ProtectedRoute requiredRole={USER_ROLES.GUEST}>
              <GuestBookings />
            </ProtectedRoute>
          }
        />
        
        <Route
          path={`${ROUTES.GUEST_BOOKINGS}/payment`}
          element={
            <ProtectedRoute requiredRole={USER_ROLES.GUEST}>
              <BookingPayment />
            </ProtectedRoute>
          }
        />

        <Route
          path={ROUTES.GUEST_PROFILE}
          element={
            <ProtectedRoute requiredRole={USER_ROLES.GUEST}>
              <GuestProfile />
            </ProtectedRoute>
          }
        />

        <Route
          path={ROUTES.GUEST_WISHLIST}
          element={
            <ProtectedRoute requiredRole={USER_ROLES.GUEST}>
              <GuestWishlist />
            </ProtectedRoute>
          }
        />

        <Route
          path={ROUTES.GUEST_SETTINGS}
          element={
            <ProtectedRoute requiredRole={USER_ROLES.GUEST}>
              <GuestSettings />
            </ProtectedRoute>
          }
        />

        {/* Public-facing wishlist URL, still protected for guests */}
        <Route
          path={ROUTES.WISHLIST}
          element={
            <ProtectedRoute requiredRole={USER_ROLES.GUEST}>
              <GuestWishlist />
            </ProtectedRoute>
          }
        />

        {/* Protected Routes - Host */}
        <Route
          path={ROUTES.HOST_DASHBOARD}
          element={
            <ProtectedRoute requiredRole={USER_ROLES.HOST}>
              <HostDashboard />
            </ProtectedRoute>
          }
        />
        
        <Route
          path={`${ROUTES.HOST_LISTINGS}/*`}
          element={
            <ProtectedRoute requiredRole={USER_ROLES.HOST}>
              <HostListingsRoutes />
            </ProtectedRoute>
          }
        />

        <Route
          path={ROUTES.HOST_BOOKINGS}
          element={
            <ProtectedRoute requiredRole={USER_ROLES.HOST}>
              <HostBookings />
            </ProtectedRoute>
          }
        />

        <Route
          path={ROUTES.HOST_SETTINGS}
          element={
            <ProtectedRoute requiredRole={USER_ROLES.HOST}>
              <HostSettings />
            </ProtectedRoute>
          }
        />

        {/* Protected Routes - Admin */}
        <Route
          path={ROUTES.ADMIN_DASHBOARD}
          element={
            <ProtectedRoute requiredRole={USER_ROLES.ADMIN}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        
        <Route
          path={ROUTES.ADMIN_ANALYTICS}
          element={
            <ProtectedRoute requiredRole={USER_ROLES.ADMIN}>
              <AdminAnalytics />
            </ProtectedRoute>
          }
        />
        
        <Route
          path={ROUTES.ADMIN_REPORTS}
          element={
            <ProtectedRoute requiredRole={USER_ROLES.ADMIN}>
              <AdminReports />
            </ProtectedRoute>
          }
        />
        
        <Route
          path={ROUTES.ADMIN_POLICIES}
          element={
            <ProtectedRoute requiredRole={USER_ROLES.ADMIN}>
              <AdminPolicies />
            </ProtectedRoute>
          }
        />

        <Route
          path={ROUTES.ADMIN_SETTINGS}
          element={
            <ProtectedRoute requiredRole={USER_ROLES.ADMIN}>
              <AdminSettings />
            </ProtectedRoute>
          }
        />

        {/* Catch all - redirect to home */}
        <Route path="*" element={<Navigate to={ROUTES.HOME} replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default AppRouter;

