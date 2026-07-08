import React from 'react';
import { formatCurrency, formatDate, formatDateTime, calculateNights } from '../../utils/helpers';
import { PAYMENT_STATUS } from '../../config/constants';

const BookingDetailsPanel = ({ booking, showBookingId = true }) => {
  if (!booking) return null;

  const nights = booking.pricing?.nights ?? calculateNights(booking.checkIn, booking.checkOut);
  const guests = booking.guestInformation || [];

  return (
    <div className="booking-details-panel">
      {showBookingId && booking.id && (
        <div className="booking-detail-row">
          <strong>Booking ID:</strong> <span>{booking.id}</span>
        </div>
      )}

      {booking.createdAt && (
        <div className="booking-detail-row">
          <strong>Booked On:</strong> <span>{formatDateTime(booking.createdAt)}</span>
        </div>
      )}

      <div className="booking-detail-row">
        <strong>Check-in:</strong> {formatDate(booking.checkIn)}
      </div>
      <div className="booking-detail-row">
        <strong>Check-out:</strong> {formatDate(booking.checkOut)}
      </div>
      <div className="booking-detail-row">
        <strong>Guests:</strong> {booking.guests}
      </div>
      <div className="booking-detail-row">
        <strong>Nights:</strong> {nights}
      </div>

      {booking.guestContact && (
        <div className="booking-detail-section">
          <strong>Contact Person</strong>
          <div className="booking-detail-row">{booking.guestContact.fullName || 'N/A'}</div>
          {booking.guestContact.email && (
            <div className="booking-detail-row">Email: {booking.guestContact.email}</div>
          )}
          {booking.guestContact.phone && (
            <div className="booking-detail-row">Phone: {booking.guestContact.phone}</div>
          )}
        </div>
      )}

      {guests.length > 0 && (
        <div className="booking-detail-section">
          <strong>Guest Information</strong>
          {guests.map((guest, index) => (
            <div key={`${guest.fullName || 'guest'}-${index}`} className="booking-guest-card">
              <div className="booking-detail-row">
                <strong>Guest {guest.guestNumber || index + 1}</strong>
              </div>
              <div className="booking-detail-row">Name: {guest.fullName || 'N/A'}</div>
              {guest.age && <div className="booking-detail-row">Age: {guest.age}</div>}
              {guest.phone && <div className="booking-detail-row">Phone: {guest.phone}</div>}
              {guest.email && <div className="booking-detail-row">Email: {guest.email}</div>}
            </div>
          ))}
        </div>
      )}

      {booking.pricing && (
        <div className="booking-detail-section">
          <strong>Price Breakdown</strong>
          <div className="booking-detail-row">
            Rate: {formatCurrency(booking.pricing.baseRate || 0, booking.pricing.currency)} x {nights} night(s) x {booking.guests} guest(s)
          </div>
          <div className="booking-detail-row">
            Subtotal: {formatCurrency(booking.pricing.subtotal || 0, booking.pricing.currency)}
          </div>
          {booking.pricing.discountAmount > 0 && (
            <div className="booking-detail-row">
              Discount: -{formatCurrency(booking.pricing.discountAmount, booking.pricing.currency)}
            </div>
          )}
          {booking.pricing.cleaningFee > 0 && (
            <div className="booking-detail-row">
              Cleaning fee: {formatCurrency(booking.pricing.cleaningFee, booking.pricing.currency)}
            </div>
          )}
          {booking.pricing.serviceFee > 0 && (
            <div className="booking-detail-row">
              Service fee: {formatCurrency(booking.pricing.serviceFee, booking.pricing.currency)}
            </div>
          )}
          <div className="booking-detail-row booking-detail-total">
            <strong>Total:</strong> {formatCurrency(booking.pricing.total || 0, booking.pricing.currency)}
          </div>
        </div>
      )}

      {(booking.paymentMethod || booking.paymentStatus) && (
        <div className="booking-detail-section">
          <strong>Payment</strong>
          {booking.paymentMethod && (
            <div className="booking-detail-row">Method: {booking.paymentMethod}</div>
          )}
          {booking.paymentStatus && (
            <div className="booking-detail-row">
              Status: {booking.paymentStatus === PAYMENT_STATUS.COMPLETED ? 'Paid' : booking.paymentStatus}
            </div>
          )}
          {booking.transactionId && (
            <div className="booking-detail-row">Transaction: {booking.transactionId}</div>
          )}
        </div>
      )}

      {booking.specialRequests && (
        <div className="booking-detail-section">
          <strong>Special Requests</strong>
          <div className="booking-detail-row">{booking.specialRequests}</div>
        </div>
      )}
    </div>
  );
};

export default BookingDetailsPanel;
