/**
 * Sidebar Component
 * 
 * Navigation sidebar for dashboard pages
 */

import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuthContext } from '../../context/AuthContext';
import { ROUTES, USER_ROLES } from '../../config/constants';
import './Sidebar.css';

const Sidebar = () => {
  const location = useLocation();
  const { userProfile } = useAuthContext();

  const isActive = (path) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  const getNavItems = () => {
    if (!userProfile) return [];

    switch (userProfile.role) {
      case USER_ROLES.HOST:
        return [
          { path: ROUTES.HOST_DASHBOARD, label: 'Dashboard', icon: '📊' },
          { path: ROUTES.HOST_LISTINGS, label: 'Listings', icon: '🏠' },
          { path: ROUTES.HOST_CALENDAR, label: 'Calendar', icon: '📅' },
          { path: ROUTES.HOST_MESSAGES, label: 'Messages', icon: '💬' },
          { path: ROUTES.HOST_SETTINGS, label: 'Settings', icon: '⚙️' }
        ];
      case USER_ROLES.GUEST:
        return [
          { path: ROUTES.GUEST_DASHBOARD, label: 'Dashboard', icon: '📊' },
          { path: ROUTES.GUEST_BOOKINGS, label: 'My Bookings', icon: '📋' },
          { path: ROUTES.GUEST_WISHLIST, label: 'Wishlist', icon: '❤️' },
          { path: ROUTES.GUEST_MESSAGES, label: 'Messages', icon: '💬' },
          { path: ROUTES.GUEST_SETTINGS, label: 'Settings', icon: '⚙️' }
        ];
      case USER_ROLES.ADMIN:
        return [
          { path: ROUTES.ADMIN_DASHBOARD, label: 'Dashboard', icon: '📊' },
          { path: ROUTES.ADMIN_ANALYTICS, label: 'Analytics', icon: '📈' },
          { path: ROUTES.ADMIN_REPORTS, label: 'Reports', icon: '📄' },
          { path: ROUTES.ADMIN_POLICIES, label: 'Policies', icon: '📜' }
        ];
      default:
        return [];
    }
  };

  const navItems = getNavItems();

  return (
    <aside className="sidebar">
      <nav className="sidebar-nav">
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`sidebar-nav-item ${isActive(item.path) ? 'active' : ''}`}
          >
            <span className="sidebar-nav-icon">{item.icon}</span>
            <span className="sidebar-nav-label">{item.label}</span>
          </Link>
        ))}
      </nav>
    </aside>
  );
};

export default Sidebar;



























