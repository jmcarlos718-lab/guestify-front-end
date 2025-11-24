/**
 * ProtectedRoute Component
 * 
 * Route guard that requires authentication and optionally specific roles
 */

import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthContext } from '../../context/AuthContext';
import { ROUTES, USER_ROLES } from '../../config/constants';

const ProtectedRoute = ({ children, requiredRole = null }) => {
  const {
    isAuthenticated,
    userProfile,
    loading,
    isAdminAuthenticated,
    isUserAuthenticated,
    hasRole
  } = useAuthContext();
  const location = useLocation();

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh'
      }}>
        <div className="loading-spinner" style={{
          width: '40px',
          height: '40px',
          border: '4px solid #F3F4F6',
          borderTopColor: '#6366F1',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }} />
      </div>
    );
  }

  if (requiredRole === USER_ROLES.ADMIN) {
    if (!isAdminAuthenticated) {
      return <Navigate to={ROUTES.ADMIN_LOGIN} state={{ from: location }} replace />;
    }
    return children;
  }

  if (!isUserAuthenticated) {
    if (isAdminAuthenticated) {
      return <Navigate to={ROUTES.ADMIN_DASHBOARD} replace />;
    }
    return <Navigate to={ROUTES.LOGIN} state={{ from: location }} replace />;
  }

  if (requiredRole && !hasRole(requiredRole)) {
    if (hasRole(USER_ROLES.ADMIN)) {
      return <Navigate to={ROUTES.ADMIN_DASHBOARD} replace />;
    }
    if (hasRole(USER_ROLES.HOST)) {
      return <Navigate to={ROUTES.HOST_DASHBOARD} replace />;
    }
    return <Navigate to={ROUTES.GUEST_DASHBOARD} replace />;
  }

  return children;
};

export default ProtectedRoute;








