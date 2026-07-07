/**
 * PayPal Payment Modal
 * 
 * Modal component for PayPal payment processing
 */

import React, { useState } from 'react';
import Modal from '../common/Modal';
import PayPalButton from './PayPalButton';
import Card from '../common/Card';
import { isPayPalSandbox } from '../../config/paypal';
import { formatCurrency, calculateNights } from '../../utils/helpers';
import './PayPalModal.css';

const PayPalModal = ({
  isOpen,
  onClose,
  listing,
  bookingData,
  pricing,
  onSuccess,
  onError
}) => {
  const [processing, setProcessing] = useState(false);

  if (!isOpen || !listing || !bookingData || !pricing) {
    return null;
  }

  const handlePayPalSuccess = async (details) => {
    setProcessing(true);
    try {
      await onSuccess(details);
      onClose();
    } catch (error) {
      if (onError) {
        onError(error);
      }
    } finally {
      setProcessing(false);
    }
  };

  const handlePayPalError = (error) => {
    console.error('PayPal error:', error);
    if (onError) {
      onError(error);
    }
    setProcessing(false);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Complete Payment"
      size="large"
    >
      <div className="paypal-modal-content">
        {/* Booking Summary */}
        <Card title="Booking Summary" className="summary-card">
          <div className="summary-item">
            <div className="summary-label">Listing</div>
            <div className="summary-value">{listing.title}</div>
          </div>
          <div className="summary-item">
            <div className="summary-label">Location</div>
            <div className="summary-value">
              {listing.location?.city}, {listing.location?.country}
            </div>
          </div>
          <div className="summary-item">
            <div className="summary-label">Check-in</div>
            <div className="summary-value">
              {new Date(bookingData.checkIn).toLocaleDateString()}
            </div>
          </div>
          <div className="summary-item">
            <div className="summary-label">Check-out</div>
            <div className="summary-value">
              {new Date(bookingData.checkOut).toLocaleDateString()}
            </div>
          </div>
          <div className="summary-item">
            <div className="summary-label">Guests</div>
            <div className="summary-value">{bookingData.guests}</div>
          </div>
          <div className="summary-item">
            <div className="summary-label">Nights</div>
            <div className="summary-value">
              {calculateNights(bookingData.checkIn, bookingData.checkOut)}
            </div>
          </div>
        </Card>

        {/* Price Breakdown */}
        <Card className="pricing-card">
          <h3 className="pricing-title">Price Breakdown</h3>
          
          <div className="pricing-details">
            <div className="pricing-row">
              <span>
                {formatCurrency(pricing.baseRate, listing.pricing?.currency)} × {bookingData.guests} {bookingData.guests === 1 ? 'guest' : 'guests'}
              </span>
              <span>{formatCurrency(pricing.total, listing.pricing?.currency)}</span>
            </div>
            
            <div className="pricing-divider" />
            
            <div className="pricing-row total">
              <span>Total</span>
              <span>{formatCurrency(pricing.total, listing.pricing?.currency)}</span>
            </div>
          </div>
        </Card>

        {/* PayPal Payment */}
        <Card title="Payment Method" className="payment-method-card">
          <div className="paypal-section">
            <div className="paypal-header">
              <h4>Pay with PayPal</h4>
              <p>Secure payment powered by PayPal. Complete your booking with a few clicks.</p>
              {isPayPalSandbox() ? (
                <div style={{
                  marginTop: '0.75rem',
                  padding: '0.5rem',
                  background: '#FEF3C7',
                  border: '1px solid #F59E0B',
                  borderRadius: '0.375rem',
                  fontSize: '0.875rem',
                  color: '#92400E'
                }}>
                  🧪 <strong>Test Mode:</strong> Using PayPal Sandbox - No real money will be charged
                </div>
              ) : null}
            </div>
            <div className="paypal-button-container">
              <PayPalButton
                amount={pricing.total}
                currency={listing.pricing?.currency || 'PHP'}
                onApprove={handlePayPalSuccess}
                onError={handlePayPalError}
                disabled={processing}
              />
            </div>
            {processing && (
              <div className="payment-processing">
                <p>Processing your payment...</p>
              </div>
            )}
          </div>
        </Card>

        <p className="payment-note">
          By completing payment, you agree to our Terms of Service and Cancellation Policy
        </p>
      </div>
    </Modal>
  );
};

export default PayPalModal;

