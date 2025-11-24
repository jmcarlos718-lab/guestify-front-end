/**
 * Refund Service
 * 
 * Handles refund requests and processing
 */

import * as firestoreService from './firestoreService';
import { getBooking } from './bookingService';
import { getPaymentByBookingId } from './paymentService';
import { doc, runTransaction } from 'firebase/firestore';
import { db } from '../config/firebase';

/**
 * Get refund percentage based on cancellation policy
 * @param {string} cancellationPolicy - 'strict', 'moderate', or 'flexible'
 * @returns {number} Refund percentage (0.5, 0.7, or 0.85)
 */
export const getRefundPercentage = (cancellationPolicy) => {
  switch (cancellationPolicy) {
    case 'strict':
      return 0.5; // 50% refund
    case 'moderate':
      return 0.7; // 70% refund
    case 'flexible':
      return 0.85; // 85% refund
    default:
      return 0.7; // Default to moderate
  }
};

/**
 * Request refund for a cancelled booking
 * @param {string} bookingId - Booking ID
 * @param {string} reason - Refund reason
 * @param {string} requestedBy - 'guest' or 'host'
 * @returns {Promise<void>}
 */
export const requestRefund = async (bookingId, reason, requestedBy = 'guest') => {
  const booking = await getBooking(bookingId);

  if (!booking) {
    throw new Error('Booking not found');
  }

  if (booking.status !== 'cancelled') {
    throw new Error('Only cancelled bookings can request refund');
  }

  if (booking.refundRequested) {
    throw new Error('Refund already requested for this booking');
  }

  // Get listing to check cancellation policy
  const listing = await firestoreService.getDocument('listings', booking.listingId);
  if (!listing) {
    throw new Error('Listing not found');
  }

  const cancellationPolicy = listing.availability?.cancellationPolicy || 'moderate';
  const refundPercentage = getRefundPercentage(cancellationPolicy);

  // Flexible policy doesn't require refund requests - should be auto-processed
  if (cancellationPolicy === 'flexible') {
    throw new Error('Flexible cancellation policy does not require refund requests. Refund is automatic.');
  }

  // Get payment to calculate refund amount
  const payment = await getPaymentByBookingId(bookingId);
  if (!payment) {
    throw new Error('Payment not found for this booking');
  }

  const refundAmount = payment.amount * refundPercentage;

  // Update booking with refund request
  await firestoreService.updateDocument('bookings', bookingId, {
    refundRequested: true,
    refundRequestedAt: new Date(),
    refundAmount: refundAmount,
    refundStatus: 'pending',
    refundReason: reason,
    refundRequestedBy: requestedBy,
    cancellationPolicy: cancellationPolicy,
    updatedAt: new Date()
  });
};

/**
 * Get refund requests for a host (guest-initiated requests that need host approval)
 * @param {string} hostId - Host ID
 * @returns {Promise<Array>} Array of bookings with refund requests
 */
export const getHostRefundRequests = async (hostId) => {
  try {
    const bookings = await firestoreService.getDocuments(
      'bookings',
      [
        { field: 'hostId', operator: '==', value: hostId },
        { field: 'refundRequested', operator: '==', value: true },
        { field: 'refundStatus', operator: '==', value: 'pending' }
      ],
      null,
      'desc'
    );

    // Filter to only get guest-initiated requests (or requests where refundRequestedBy is not 'host')
    const guestRequests = bookings.filter(booking => booking.refundRequestedBy !== 'host');

    // Load payment and listing details for each booking
    const bookingsWithDetails = await Promise.all(
      guestRequests.map(async (booking) => {
        try {
          const payment = await getPaymentByBookingId(booking.id);
          const listing = await firestoreService.getDocument('listings', booking.listingId);
          return {
            ...booking,
            payment,
            listing
          };
        } catch (error) {
          console.error('Error loading booking details:', error);
          return { ...booking, payment: null, listing: null };
        }
      })
    );

    return bookingsWithDetails;
  } catch (error) {
    console.error('Error getting refund requests:', error);
    throw error;
  }
};

/**
 * Process refund (approve and execute)
 * @param {string} bookingId - Booking ID
 * @param {number} refundPercentage - Refund percentage (0.5, 0.7, or 0.85)
 * @returns {Promise<void>}
 */
const processRefund = async (bookingId, refundPercentage) => {
  const booking = await getBooking(bookingId);
  if (!booking) {
    throw new Error('Booking not found');
  }

  // Get payment
  const payment = await getPaymentByBookingId(bookingId);
  if (!payment) {
    throw new Error('Payment not found');
  }

  const refundAmount = payment.amount * refundPercentage;
  // Host gets 85% of payment, so refund deduction = refundPercentage of original payment amount
  const hostRefundDeduction = payment.amount * refundPercentage;
  // Admin gets 15% of payment, so admin refund = refundPercentage of their 15% share
  const adminRefundDeduction = (payment.amount * 0.15) * refundPercentage;

  // Use transaction to ensure data consistency
  await runTransaction(db, async (transaction) => {
    // Update booking refund status
    const bookingRef = doc(db, 'bookings', bookingId);
    transaction.update(bookingRef, {
      refundStatus: 'approved',
      refundAmount: refundAmount,
      updatedAt: new Date()
    });

    // Update payment with refund information
    const paymentRef = doc(db, 'payments', payment.id);
    transaction.update(paymentRef, {
      refundAmount: refundAmount,
      refundStatus: 'approved',
      refundedAt: new Date(),
      hostIncome: (payment.hostIncome || 0) - hostRefundDeduction,
      adminIncome: (payment.adminIncome || 0) - adminRefundDeduction,
      updatedAt: new Date()
    });
  });
};

/**
 * Approve refund request
 * @param {string} bookingId - Booking ID
 * @returns {Promise<void>}
 */
export const approveRefund = async (bookingId) => {
  const booking = await getBooking(bookingId);

  if (!booking) {
    throw new Error('Booking not found');
  }

  if (!booking.refundRequested || booking.refundStatus !== 'pending') {
    throw new Error('No pending refund request for this booking');
  }

  // Get refund percentage from booking or calculate from cancellation policy
  let refundPercentage;
  if (booking.cancellationPolicy) {
    refundPercentage = getRefundPercentage(booking.cancellationPolicy);
  } else {
    // Fallback: get from listing
    const listing = await firestoreService.getDocument('listings', booking.listingId);
    const cancellationPolicy = listing?.availability?.cancellationPolicy || 'moderate';
    refundPercentage = getRefundPercentage(cancellationPolicy);
  }

  await processRefund(bookingId, refundPercentage);
};

/**
 * Reject refund request
 * @param {string} bookingId - Booking ID
 * @param {string} reason - Rejection reason
 * @returns {Promise<void>}
 */
export const rejectRefund = async (bookingId, reason) => {
  const booking = await getBooking(bookingId);

  if (!booking) {
    throw new Error('Booking not found');
  }

  if (!booking.refundRequested || booking.refundStatus !== 'pending') {
    throw new Error('No pending refund request for this booking');
  }

  await firestoreService.updateDocument('bookings', bookingId, {
    refundStatus: 'rejected',
    refundRejectionReason: reason,
    updatedAt: new Date()
  });
};

/**
 * Get refund requests for a guest
 * @param {string} guestId - Guest ID
 * @returns {Promise<Array>} Array of bookings with refund requests
 */
export const getGuestRefundRequests = async (guestId) => {
  try {
    const bookings = await firestoreService.getDocuments(
      'bookings',
      [
        { field: 'guestId', operator: '==', value: guestId },
        { field: 'refundRequested', operator: '==', value: true }
      ],
      null,
      'desc'
    );

    return bookings;
  } catch (error) {
    console.error('Error getting guest refund requests:', error);
    throw error;
  }
};

/**
 * Get refund requests initiated by a host (when host cancels booking)
 * @param {string} hostId - Host ID
 * @returns {Promise<Array>} Array of bookings with host-initiated refund requests
 */
export const getHostInitiatedRefundRequests = async (hostId) => {
  try {
    const bookings = await firestoreService.getDocuments(
      'bookings',
      [
        { field: 'hostId', operator: '==', value: hostId },
        { field: 'refundRequested', operator: '==', value: true },
        { field: 'refundRequestedBy', operator: '==', value: 'host' }
      ],
      null,
      'desc'
    );

    // Load payment and listing details for each booking
    const bookingsWithDetails = await Promise.all(
      bookings.map(async (booking) => {
        try {
          const payment = await getPaymentByBookingId(booking.id);
          const listing = await firestoreService.getDocument('listings', booking.listingId);
          return {
            ...booking,
            payment,
            listing
          };
        } catch (error) {
          console.error('Error loading booking details:', error);
          return { ...booking, payment: null, listing: null };
        }
      })
    );

    return bookingsWithDetails;
  } catch (error) {
    console.error('Error getting host-initiated refund requests:', error);
    throw error;
  }
};

/**
 * Automatically process refund for flexible cancellation policy
 * @param {string} bookingId - Booking ID
 * @returns {Promise<void>}
 */
export const processFlexibleRefund = async (bookingId) => {
  const booking = await getBooking(bookingId);
  if (!booking) {
    throw new Error('Booking not found');
  }

  if (booking.status !== 'cancelled') {
    throw new Error('Only cancelled bookings can be refunded');
  }

  // Get listing to check cancellation policy
  const listing = await firestoreService.getDocument('listings', booking.listingId);
  if (!listing) {
    throw new Error('Listing not found');
  }

  const cancellationPolicy = listing.availability?.cancellationPolicy || 'moderate';
  if (cancellationPolicy !== 'flexible') {
    throw new Error('This function is only for flexible cancellation policy');
  }

  // Check if refund already processed
  if (booking.refundStatus === 'approved') {
    throw new Error('Refund already processed for this booking');
  }

  const refundPercentage = getRefundPercentage('flexible'); // 85%

  // Mark as refund requested and process immediately
  await firestoreService.updateDocument('bookings', bookingId, {
    refundRequested: true,
    refundRequestedAt: new Date(),
    refundStatus: 'pending',
    cancellationPolicy: cancellationPolicy,
    updatedAt: new Date()
  });

  // Process the refund
  await processRefund(bookingId, refundPercentage);
};

