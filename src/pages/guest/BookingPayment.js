/**
 * Booking Payment Page
 * 
 * Payment processing for bookings
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthContext } from '../../context/AuthContext';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import PayPalButton from '../../components/payment/PayPalButton';
import GuestInformationForm from '../../components/booking/GuestInformationForm';
import { ROUTES, BOOKING_STATUS, PAYMENT_STATUS } from '../../config/constants';
import { createBooking, updateBooking } from '../../services/bookingService';
import { createPaymentDocument } from '../../models/paymentModel';
import * as firestoreService from '../../services/firestoreService';
import { calculateListingPrice } from '../../models/listingModel';
import { buildCompleteBookingData } from '../../utils/bookingHelpers';
import { formatCurrency, calculateNights } from '../../utils/helpers';
import { toast } from 'react-toastify';
import './BookingPayment.css';

const BookingPayment = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, userProfile } = useAuthContext();
  const [processing, setProcessing] = useState(false);
  const [bookingData, setBookingData] = useState(null);
  const [pricing, setPricing] = useState(null);
  const [showGuestInfoForm, setShowGuestInfoForm] = useState(true);
  const [guestInformation, setGuestInformation] = useState([]);

  useEffect(() => {
    // Get booking data from location state or load from params
    const state = location.state;
    if (state && state.listing && state.checkIn && state.checkOut) {
      const nights = calculateNights(state.checkIn, state.checkOut);
      const calculatedPricing = calculateListingPrice(
        state.listing,
        new Date(state.checkIn),
        new Date(state.checkOut),
        state.guests || 1
      );
      
      setBookingData({
        listingId: state.listingId || state.listing.id,
        listing: state.listing,
        checkIn: state.checkIn,
        checkOut: state.checkOut,
        guests: state.guests || 1
      });

      setPricing({
        ...calculatedPricing,
        totalWithServiceFee: calculatedPricing.total // Total is already price * guests
      });
    } else {
      toast.error('Invalid booking data');
      navigate(ROUTES.SEARCH);
    }
  }, [location, navigate]);

  const handlePayPalSuccess = async (details) => {
    if (!bookingData || !pricing) return;

    // Check if user is trying to book their own listing
    if (user && bookingData.listing && user.uid === bookingData.listing.hostId) {
      toast.error('You cannot book your own listing');
      setProcessing(false);
      navigate(ROUTES.SEARCH);
      return;
    }

    setProcessing(true);

    try {
      const transactionId =
        details.id || details.purchase_units?.[0]?.payments?.captures?.[0]?.id || null;

      const bookingDoc = buildCompleteBookingData({
        listing: bookingData.listing,
        user,
        userProfile,
        checkIn: bookingData.checkIn,
        checkOut: bookingData.checkOut,
        guests: bookingData.guests,
        guestInformation,
        pricing,
        payment: {
          paymentMethod: 'paypal',
          transactionId,
          paymentStatus: PAYMENT_STATUS.COMPLETED,
          status: BOOKING_STATUS.CONFIRMED
        }
      });

      const bookingId = await createBooking(bookingDoc);

      const totalAmount = bookingDoc.pricing.total;
      const adminIncome = totalAmount * 0.15;
      const hostIncome = totalAmount * 0.85;

      const paymentDoc = createPaymentDocument({
        bookingId,
        userId: user.uid,
        hostId: bookingData.listing.hostId,
        amount: totalAmount,
        currency: bookingDoc.pricing.currency,
        paymentMethod: 'paypal',
        transactionId,
        adminIncome,
        hostIncome,
        payoutStatus: 'pending',
        hostPayoutStatus: 'pending',
        adminPayoutStatus: 'pending',
        status: PAYMENT_STATUS.COMPLETED
      });

      const paymentId = await firestoreService.createDocument('payments', paymentDoc);
      await updateBooking(bookingId, { paymentId });

      toast.success('Payment successful! Booking confirmed.');
      navigate(`${ROUTES.GUEST_BOOKINGS}?booking=${bookingId}`);
    } catch (error) {
      toast.error(error.message || 'Payment processing failed. Please contact support.');
      console.error('Payment error:', error);
    } finally {
      setProcessing(false);
    }
  };

  const handlePayPalError = (error) => {
    console.error('PayPal error:', error);
    toast.error('PayPal payment failed. Please try again.');
    setProcessing(false);
  };

  const handleGuestInfoContinue = (guestData) => {
    // Store guest information
    setGuestInformation(guestData);
    
    // Close guest info form to show payment
    setShowGuestInfoForm(false);
  };

  if (!bookingData || !pricing) {
    return (
      <DashboardLayout>
        <div className="loading-container">
          <p>Loading booking details...</p>
        </div>
      </DashboardLayout>
    );
  }

  // Show guest information form first
  if (showGuestInfoForm) {
    return (
      <DashboardLayout>
        <GuestInformationForm
          isOpen={showGuestInfoForm}
          onClose={() => {
            setShowGuestInfoForm(false);
            navigate(ROUTES.SEARCH);
          }}
          numberOfGuests={bookingData.guests || 1}
          onContinue={handleGuestInfoContinue}
        />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="booking-payment-page">
        <div className="payment-header">
          <h1>Complete Your Booking</h1>
          <p>Review your booking details and complete payment</p>
        </div>

        <div className="payment-content">
          <div className="payment-main">
            {/* Booking Summary */}
            <Card title="Booking Summary" className="summary-card">
              <div className="summary-item">
                <div className="summary-label">Listing</div>
                <div className="summary-value">{bookingData.listing.title}</div>
              </div>
              <div className="summary-item">
                <div className="summary-label">Location</div>
                <div className="summary-value">
                  {bookingData.listing.location?.city}, {bookingData.listing.location?.country}
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

            {/* PayPal Payment */}
            <Card title="Payment Method" className="payment-method-card">
              <div className="paypal-section">
                <div className="paypal-header">
                  <h4>Pay with PayPal</h4>
                  <p>Secure payment powered by PayPal. Complete your booking with a few clicks.</p>
                </div>
                <div className="paypal-button-container">
                  <PayPalButton
                    amount={pricing.total}
                    currency={bookingData.listing.pricing?.currency || 'PHP'}
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
          </div>

          {/* Payment Summary Sidebar */}
          <div className="payment-sidebar">
            <Card className="pricing-card">
              <h3 className="pricing-title">Price Breakdown</h3>
              
              <div className="pricing-details">
                <div className="pricing-row">
                  <span>
                    {formatCurrency(pricing.baseRate, bookingData.listing.pricing?.currency)} × {bookingData.guests} {bookingData.guests === 1 ? 'guest' : 'guests'}
                  </span>
                  <span>{formatCurrency(pricing.total, bookingData.listing.pricing?.currency)}</span>
                </div>
                
                <div className="pricing-divider" />
                
                <div className="pricing-row total">
                  <span>Total</span>
                  <span>{formatCurrency(pricing.total, bookingData.listing.pricing?.currency)}</span>
                </div>
              </div>

              <p className="payment-note">
                By completing payment, you agree to our Terms of Service and Cancellation Policy
              </p>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default BookingPayment;





