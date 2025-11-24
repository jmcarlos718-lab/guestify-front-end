/**
 * Footer Component
 * 
 * Main footer with links and information
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { ROUTES } from '../../config/constants';
import './Footer.css';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-content">
          <div className="footer-section">
            <h3 className="footer-title">Guestify</h3>
            <p className="footer-description">
              Your trusted platform for hosting and booking experiences, homes, and services.
            </p>
          </div>

          <div className="footer-section">
            <h4 className="footer-heading">For Guests</h4>
            <ul className="footer-links">
              <li>
                <Link to={ROUTES.SEARCH}>Explore Listings</Link>
              </li>
              <li>
                <Link to={ROUTES.GUEST_BOOKINGS}>My Bookings</Link>
              </li>
              <li>
                <Link to={ROUTES.GUEST_WISHLIST}>Wishlist</Link>
              </li>
              <li>
                <Link to={ROUTES.GUEST_SETTINGS}>Account Settings</Link>
              </li>
            </ul>
          </div>

          <div className="footer-section">
            <h4 className="footer-heading">For Hosts</h4>
            <ul className="footer-links">
              <li>
                <Link to={ROUTES.HOST_LISTINGS}>My Listings</Link>
              </li>
              <li>
                <Link to={ROUTES.HOST_DASHBOARD}>Dashboard</Link>
              </li>
              <li>
                <Link to={ROUTES.HOST_CALENDAR}>Calendar</Link>
              </li>
              <li>
                <Link to={ROUTES.HOST_SETTINGS}>Host Settings</Link>
              </li>
            </ul>
          </div>

          <div className="footer-section">
            <h4 className="footer-heading">Support</h4>
            <ul className="footer-links">
              <li>
                <a href="#help">Help Center</a>
              </li>
              <li>
                <a href="#contact">Contact Us</a>
              </li>
              <li>
                <a href="#privacy">Privacy Policy</a>
              </li>
              <li>
                <a href="#terms">Terms of Service</a>
              </li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <p>&copy; {new Date().getFullYear()} Guestify. All rights reserved.</p>
          <div className="footer-social">
            <a href="#" aria-label="Facebook">Facebook</a>
            <a href="#" aria-label="Twitter">Twitter</a>
            <a href="#" aria-label="Instagram">Instagram</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;



























