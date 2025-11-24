/**
 * Terms & Conditions Modal
 * 
 * Modal component for displaying Terms & Conditions
 */

import React, { useState } from 'react';
import './TermsModal.css';

const TermsModal = ({ isOpen, onClose, onAccept }) => {
  const [hasScrolled, setHasScrolled] = useState(false);

  if (!isOpen) return null;

  const handleScroll = (e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.target;
    if (scrollTop + clientHeight >= scrollHeight - 10) {
      setHasScrolled(true);
    }
  };

  return (
    <div className="terms-modal-overlay" onClick={onClose}>
      <div className="terms-modal" onClick={(e) => e.stopPropagation()}>
        <div className="terms-modal-header">
          <h2>Terms & Conditions</h2>
          <button className="terms-modal-close" onClick={onClose}>
            ×
          </button>
        </div>
        
        <div className="terms-modal-content" onScroll={handleScroll}>
          <div className="terms-content">
            <section>
              <h3>1. Acceptance of Terms</h3>
              <p>
                By accessing and using Guestify, you accept and agree to be bound by the terms and provision of this agreement.
              </p>
            </section>

            <section>
              <h3>2. User Accounts</h3>
              <p>
                You are responsible for maintaining the confidentiality of your account and password. You agree to accept responsibility for all activities that occur under your account.
              </p>
            </section>

            <section>
              <h3>3. Host Responsibilities</h3>
              <p>
                Hosts are responsible for providing accurate listing information, maintaining their properties, and fulfilling bookings as described. Hosts must have an active subscription to post listings.
              </p>
            </section>

            <section>
              <h3>4. Guest Responsibilities</h3>
              <p>
                Guests are responsible for respecting property rules, treating properties with care, and making timely payments. Cancellation policies apply as stated in each listing.
              </p>
            </section>

            <section>
              <h3>5. Booking and Payments</h3>
              <p>
                All bookings are subject to availability and confirmation. Payment must be made in full at the time of booking unless otherwise specified. Refunds are subject to the cancellation policy.
              </p>
            </section>

            <section>
              <h3>6. Subscription Plans</h3>
              <p>
                Hosts must maintain an active subscription to create and manage listings. Subscription tiers include Basic (1 listing), Standard (5 listings), and Premium (unlimited listings).
              </p>
            </section>

            <section>
              <h3>7. Platform Fees</h3>
              <p>
                Guestify charges a service fee on all bookings. This fee is clearly displayed before booking confirmation.
              </p>
            </section>

            <section>
              <h3>8. Prohibited Activities</h3>
              <p>
                Users may not use the platform for illegal activities, fraud, or to harm others. Violations may result in account termination.
              </p>
            </section>

            <section>
              <h3>9. Limitation of Liability</h3>
              <p>
                Guestify acts as a platform connecting hosts and guests. We are not responsible for the quality, safety, or legality of listings, or for disputes between users.
              </p>
            </section>

            <section>
              <h3>10. Changes to Terms</h3>
              <p>
                We reserve the right to modify these terms at any time. Continued use of the platform after changes constitutes acceptance of the new terms.
              </p>
            </section>

            <section>
              <h3>11. Contact Information</h3>
              <p>
                For questions about these terms, please contact us at support@guestify.com.
              </p>
            </section>
          </div>
        </div>

        <div className="terms-modal-footer">
          <div className="terms-scroll-indicator">
            {!hasScrolled && (
              <span className="scroll-hint">Please scroll to read all terms</span>
            )}
          </div>
          <div className="terms-modal-actions">
            <button className="terms-btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button 
              className="terms-btn-primary" 
              onClick={onAccept}
              disabled={!hasScrolled}
            >
              I Accept
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TermsModal;



