/**
 * Booking Model
 * 
 * Data model and validation for booking documents
 */

import { BOOKING_STATUS, PAYMENT_STATUS } from '../config/constants';

/**
 * Create a new booking document
 * @param {Object} bookingData - Booking data
 * @returns {Object} Booking document
 */
export const createBookingDocument = (bookingData) => {
  const {
    listingId,
    hostId,
    guestId,
    checkIn,
    checkOut,
    guests,
    guestInformation = [], // Array of guest information objects
    pricing = {},
    specialRequests = '',
    status = BOOKING_STATUS.PENDING,
    paymentStatus = PAYMENT_STATUS.PENDING,
    createdAt = new Date(),
    updatedAt = new Date()
  } = bookingData;

  return {
    listingId,
    hostId,
    guestId,
    checkIn: checkIn instanceof Date ? checkIn : new Date(checkIn),
    checkOut: checkOut instanceof Date ? checkOut : new Date(checkOut),
    guests,
    guestInformation: Array.isArray(guestInformation) ? guestInformation : [],
    pricing: {
      baseRate: pricing.baseRate || 0,
      nights: pricing.nights || 0,
      subtotal: pricing.subtotal || 0,
      discount: pricing.discount || 0,
      discountAmount: pricing.discountAmount || 0,
      cleaningFee: pricing.cleaningFee || 0,
      serviceFee: pricing.serviceFee || 0,
      total: pricing.total || 0,
      currency: pricing.currency || 'PHP'
    },
    specialRequests,
    status,
    paymentStatus,
    paymentMethod: null,
    paymentId: null,
    cancellationReason: null,
    cancelledAt: null,
    cancelledBy: null,
    refundRequested: false,
    refundRequestedAt: null,
    refundAmount: null,
    refundStatus: null, // 'pending', 'approved', 'rejected', 'processed'
    refundReason: null,
    reviewId: null,
    createdAt,
    updatedAt
  };
};

/**
 * Validate booking data
 * @param {Object} bookingData - Booking data to validate
 * @returns {Object} { valid: boolean, errors: Array }
 */
export const validateBooking = (bookingData) => {
  const errors = [];

  if (!bookingData.listingId) {
    errors.push('Listing ID is required');
  }

  if (!bookingData.guestId) {
    errors.push('Guest ID is required');
  }

  // Prevent host from booking their own listing
  if (bookingData.guestId && bookingData.hostId && bookingData.guestId === bookingData.hostId) {
    errors.push('You cannot book your own listing');
  }

  if (!bookingData.checkIn) {
    errors.push('Check-in date is required');
  }

  if (!bookingData.checkOut) {
    errors.push('Check-out date is required');
  }

  if (bookingData.checkIn && bookingData.checkOut) {
    const checkIn = new Date(bookingData.checkIn);
    const checkOut = new Date(bookingData.checkOut);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (checkIn < today) {
      errors.push('Check-in date cannot be in the past');
    }

    if (checkOut <= checkIn) {
      errors.push('Check-out date must be after check-in date');
    }
  }

  if (!bookingData.guests || bookingData.guests < 1) {
    errors.push('Number of guests must be at least 1');
  }

  if (!bookingData.pricing?.total || bookingData.pricing.total <= 0) {
    errors.push('Total price must be greater than 0');
  }

  return {
    valid: errors.length === 0,
    errors
  };
};

/**
 * Calculate booking duration in nights
 * @param {Date} checkIn - Check-in date
 * @param {Date} checkOut - Check-out date
 * @returns {number} Number of nights
 */
export const calculateBookingNights = (checkIn, checkOut) => {
  const checkInDate = new Date(checkIn);
  const checkOutDate = new Date(checkOut);
  const diffTime = Math.abs(checkOutDate - checkInDate);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

/**
 * Check if booking can be cancelled
 * @param {Object} booking - Booking document
 * @param {string} cancellationPolicy - Cancellation policy
 * @returns {boolean} Whether booking can be cancelled
 */
export const canCancelBooking = (booking, cancellationPolicy) => {
  if (booking.status === BOOKING_STATUS.CANCELLED) {
    return false;
  }

  if (booking.status === BOOKING_STATUS.COMPLETED) {
    return false;
  }

  const checkIn = new Date(booking.checkIn);
  const today = new Date();
  const daysUntilCheckIn = Math.ceil((checkIn - today) / (1000 * 60 * 60 * 24));

  switch (cancellationPolicy) {
    case 'flexible':
      return true; // Can cancel anytime
    case 'moderate':
      return daysUntilCheckIn >= 5; // Must cancel at least 5 days before
    case 'strict':
      return daysUntilCheckIn >= 14; // Must cancel at least 14 days before
    default:
      return daysUntilCheckIn >= 7; // Default: 7 days
  }
};













