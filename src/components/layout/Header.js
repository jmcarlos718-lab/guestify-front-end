/**
 * Header Component - Redesigned
 * 
 * Full navigation bar with all pages and mobile hamburger menu
 */

import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthContext } from '../../context/AuthContext';
import { ROUTES, USER_ROLES } from '../../config/constants';
import Button from '../common/Button';
import './Header.css';

const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, userProfile, signOut } = useAuthContext();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate(ROUTES.HOME);
      setShowUserMenu(false);
      setShowMobileMenu(false);
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const getDashboardRoute = () => {
    if (!userProfile) return ROUTES.HOME;
    
    switch (userProfile.role) {
      case USER_ROLES.ADMIN:
        return ROUTES.ADMIN_DASHBOARD;
      case USER_ROLES.HOST:
        return ROUTES.HOST_DASHBOARD;
      case USER_ROLES.GUEST:
        return ROUTES.GUEST_DASHBOARD;
      default:
        return ROUTES.HOME;
    }
  };

  const getSettingsRoute = () => {
    if (!userProfile) return ROUTES.HOME;
    
    switch (userProfile.role) {
      case USER_ROLES.ADMIN:
        return ROUTES.ADMIN_SETTINGS;
      case USER_ROLES.HOST:
        return ROUTES.HOST_SETTINGS;
      case USER_ROLES.GUEST:
        return ROUTES.GUEST_SETTINGS;
      default:
        return ROUTES.HOME;
    }
  };

  const getProfileRoute = () => {
    if (!userProfile) return ROUTES.HOME;
    return userProfile.role === USER_ROLES.GUEST ? ROUTES.GUEST_PROFILE : getDashboardRoute();
  };

  const isActive = (path) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  const offersRoute = ROUTES.OFFERS || ROUTES.BEST_OFFERS;
  const aboutRoute = ROUTES.ABOUT || ROUTES.ABOUT_US;
  const contactRoute = ROUTES.CONTACT || ROUTES.CONTACT_US;
  const wishlistRoute = ROUTES.WISHLIST || ROUTES.GUEST_WISHLIST;

  const navLinks = [
    { path: ROUTES.HOME, label: 'Home' },
    { path: offersRoute, label: 'Offers' },
    { path: aboutRoute, label: 'About Us' },
    { path: contactRoute, label: 'Contact Us' }
  ];

  return (
    <header className="header">
      <div className="header-container">
        <div className="header-left">
          <Link to={ROUTES.HOME} className="header-logo">
            <span className="logo-text">Guestify</span>
          </Link>
        </div>

        <div className="header-right">
          {/* Desktop Navigation - positioned to the right, beside user info */}
          <nav className="header-nav desktop-nav">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`header-nav-link ${isActive(link.path) ? 'active' : ''}`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {isAuthenticated ? (
            <div className="header-user-menu">
              <button
                className="header-user-button"
                onClick={() => setShowUserMenu(!showUserMenu)}
                aria-label="User menu"
              >
                <div className="header-user-avatar">
                  {userProfile?.photoURL ? (
                    <img src={userProfile.photoURL} alt={userProfile.displayName} />
                  ) : (
                    <span>{userProfile?.displayName?.charAt(0)?.toUpperCase() || 'U'}</span>
                  )}
                </div>
                <span className="header-user-name">
                  {userProfile?.displayName || 'User'}
                </span>
                <svg
                  className={`header-dropdown-icon ${showUserMenu ? 'open' : ''}`}
                  width="20"
                  height="20"
                  viewBox="0 0 20 20"
                  fill="none"
                >
                  <path
                    d="M5 7.5L10 12.5L15 7.5"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>

              {showUserMenu && (
                <>
                  <div
                    className="header-menu-overlay"
                    onClick={() => setShowUserMenu(false)}
                  />
                  <div className="header-menu-dropdown">
                    <Link
                      to={getProfileRoute()}
                      className="header-menu-item"
                      onClick={() => setShowUserMenu(false)}
                    >
                      Profile
                    </Link>
                    <Link
                      to={getDashboardRoute()}
                      className="header-menu-item"
                      onClick={() => setShowUserMenu(false)}
                    >
                      Dashboard
                    </Link>
                    <Link
                      to={getSettingsRoute()}
                      className="header-menu-item"
                      onClick={() => setShowUserMenu(false)}
                    >
                      Settings
                    </Link>
                    {userProfile?.role === USER_ROLES.GUEST && (
                      <Link
                        to={ROUTES.GUEST_WISHLIST}
                        className="header-menu-item"
                        onClick={() => setShowUserMenu(false)}
                      >
                        Wishlist
                      </Link>
                    )}
                    <div className="header-menu-divider" />
                    <button
                      className="header-menu-item header-menu-item-danger"
                      onClick={handleSignOut}
                    >
                      Logout
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="header-auth-buttons">
              <Link to={ROUTES.LOGIN}>
                <Button variant="ghost" size="md">
                  Sign In
                </Button>
              </Link>
              <Link to={ROUTES.REGISTER}>
                <Button variant="primary" size="md">
                  Sign Up
                </Button>
              </Link>
            </div>
          )}

          {/* Mobile Menu Toggle */}
          <button
            className="mobile-menu-toggle"
            onClick={() => setShowMobileMenu(!showMobileMenu)}
            aria-label="Toggle menu"
          >
            <span className={`hamburger ${showMobileMenu ? 'active' : ''}`}>
              <span></span>
              <span></span>
              <span></span>
            </span>
          </button>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      <div className={`mobile-nav-drawer ${showMobileMenu ? 'open' : ''}`}>
        <div className="mobile-nav-overlay" onClick={() => setShowMobileMenu(false)} />
        <div className="mobile-nav-content">
          <div className="mobile-nav-header">
            <h3>Menu</h3>
            <button
              className="mobile-nav-close"
              onClick={() => setShowMobileMenu(false)}
            >
              ×
            </button>
          </div>
          <nav className="mobile-nav-links">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`mobile-nav-link ${isActive(link.path) ? 'active' : ''}`}
                onClick={() => setShowMobileMenu(false)}
              >
                {link.label}
              </Link>
            ))}
            {isAuthenticated && (
              <>
                <div className="mobile-nav-divider" />
                <Link
                  to={getProfileRoute()}
                  className="mobile-nav-link"
                  onClick={() => setShowMobileMenu(false)}
                >
                  Profile
                </Link>
                <Link
                  to={getDashboardRoute()}
                  className="mobile-nav-link"
                  onClick={() => setShowMobileMenu(false)}
                >
                  Dashboard
                </Link>
                <Link
                  to={getSettingsRoute()}
                  className="mobile-nav-link"
                  onClick={() => setShowMobileMenu(false)}
                >
                  Settings
                </Link>
                <button
                  className="mobile-nav-link mobile-nav-link-danger"
                  onClick={handleSignOut}
                >
                  Logout
                </button>
              </>
            )}
            {!isAuthenticated && (
              <div className="mobile-nav-auth">
                <Link
                  to={ROUTES.LOGIN}
                  className="mobile-nav-link"
                  onClick={() => setShowMobileMenu(false)}
                >
                  Sign In
                </Link>
                <Link
                  to={ROUTES.REGISTER}
                  className="mobile-nav-link mobile-nav-link-primary"
                  onClick={() => setShowMobileMenu(false)}
                >
                  Sign Up
                </Link>
              </div>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;
