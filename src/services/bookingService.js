/**
 * Booking Service
 * 
 * Service functions for booking operations
 */

import * as firestoreService from './firestoreService';
import { createBookingDocument, validateBooking, canCancelBooking } from '../models/bookingModel';
import { BOOKING_STATUS, PAYMENT_STATUS } from '../config/constants';
import { processFlexibleRefund, requestRefund } from './refundService';

const COLLECTION_NAME = 'bookings';

/**
 * Create a new booking
 * @param {Object} bookingData - Booking data
 * @returns {Promise<string>} Booking ID
 */
export const createBooking = async (bookingData) => {
  const validation = validateBooking(bookingData);
  if (!validation.valid) {
    throw new Error(validation.errors.join(', '));
  }

  const bookingDoc = createBookingDocument(bookingData);
  const bookingId = await firestoreService.createDocument(COLLECTION_NAME, bookingDoc);
  return bookingId;
};

/**
 * Get booking by ID
 * @param {string} bookingId - Booking ID
 * @returns {Promise<Object>} Booking document
 */
export const getBooking = async (bookingId) => {
  return await firestoreService.getDocument(COLLECTION_NAME, bookingId);
};

/**
 * Get bookings for a user
 * @param {string} userId - User ID
 * @param {string} role - 'guest' or 'host'
 * @param {Object} filters - Additional filters
 * @returns {Promise<Array>} Array of bookings
 */
export const getUserBookings = async (userId, role = 'guest', filters = {}) => {
  const queryFilters = [];

  if (role === 'guest') {
    queryFilters.push({ field: 'guestId', operator: '==', value: userId });
  } else if (role === 'host') {
    queryFilters.push({ field: 'hostId', operator: '==', value: userId });
  }

  if (filters.status) {
    queryFilters.push({ field: 'status', operator: '==', value: filters.status });
  }

  // Get documents without orderBy to avoid index requirement - sort client-side
  let bookings = await firestoreService.getDocuments(
    COLLECTION_NAME,
    queryFilters,
    null, // No orderBy - will sort client-side
    'asc',
    filters.limit
  );

  // Sort client-side by createdAt (most recent first)
  bookings.sort((a, b) => {
    const aDate = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt || 0);
    const bDate = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt || 0);
    return bDate - aDate; // Descending order
  });

  return bookings;
};

/**
 * Get bookings for a listing
 * @param {string} listingId - Listing ID
 * @param {Array} excludeStatuses - Statuses to exclude (e.g., ['cancelled'])
 * @returns {Promise<Array>} Array of bookings
 */
export const getListingBookings = async (listingId, excludeStatuses = [BOOKING_STATUS.CANCELLED]) => {
  const queryFilters = [
    { field: 'listingId', operator: '==', value: listingId }
  ];

  // Get all bookings for the listing without orderBy to avoid index requirement
  let bookings = await firestoreService.getDocuments(
    COLLECTION_NAME,
    queryFilters,
    null, // No orderBy - will sort client-side
    'asc',
    null // No limit - get all bookings
  );

  // Sort client-side by checkIn date
  bookings.sort((a, b) => {
    const aDate = a.checkIn?.toDate ? a.checkIn.toDate() : new Date(a.checkIn || 0);
    const bDate = b.checkIn?.toDate ? b.checkIn.toDate() : new Date(b.checkIn || 0);
    return aDate - bDate; // Ascending order
  });

  // Filter out cancelled bookings (and any other excluded statuses)
  if (excludeStatuses.length > 0) {
    bookings = bookings.filter(booking => !excludeStatuses.includes(booking.status));
  }

  return bookings;
};

/**
 * Check if dates are available for booking
 * @param {string} listingId - Listing ID
 * @param {Date|string} checkIn - Check-in date
 * @param {Date|string} checkOut - Check-out date
 * @returns {Promise<{available: boolean, conflictingBooking: Object|null}>}
 */
export const checkDateAvailability = async (listingId, checkIn, checkOut) => {
  const bookings = await getListingBookings(listingId);
  
  const checkInDate = new Date(checkIn);
  const checkOutDate = new Date(checkOut);
  
  // Check if any booking overlaps with the requested dates
  for (const booking of bookings) {
    const bookingCheckIn = booking.checkIn?.toDate ? booking.checkIn.toDate() : new Date(booking.checkIn);
    const bookingCheckOut = booking.checkOut?.toDate ? booking.checkOut.toDate() : new Date(booking.checkOut);
    
    // Check for overlap: requested dates overlap if:
    // - checkIn is between bookingCheckIn and bookingCheckOut, OR
    // - checkOut is between bookingCheckIn and bookingCheckOut, OR
    // - requested dates completely contain the booking dates
    const checkInOverlaps = checkInDate >= bookingCheckIn && checkInDate < bookingCheckOut;
    const checkOutOverlaps = checkOutDate > bookingCheckIn && checkOutDate <= bookingCheckOut;
    const containsBooking = checkInDate <= bookingCheckIn && checkOutDate >= bookingCheckOut;
    
    if (checkInOverlaps || checkOutOverlaps || containsBooking) {
      return {
        available: false,
        conflictingBooking: booking
      };
    }
  }
  
  return {
    available: true,
    conflictingBooking: null
  };
};

/**
 * Update booking
 * @param {string} bookingId - Booking ID
 * @param {Object} updates - Updates to apply
 * @returns {Promise<void>}
 */
export const updateBooking = async (bookingId, updates) => {
  await firestoreService.updateDocument(COLLECTION_NAME, bookingId, updates);
};

/**
 * Cancel booking
 * @param {string} bookingId - Booking ID
 * @param {string} reason - Cancellation reason
 * @param {string} cancellationPolicy - Cancellation policy (optional for host cancellation)
 * @param {string} cancelledBy - 'guest' or 'host' (default: 'guest')
 * @returns {Promise<void>}
 */
export const cancelBooking = async (bookingId, reason, cancellationPolicy = null, cancelledBy = 'guest', requestRefundForHost = false) => {
  const booking = await getBooking(bookingId);

  if (!booking) {
    throw new Error('Booking not found');
  }

  // Get listing to check cancellation policy
  const listing = await firestoreService.getDocument('listings', booking.listingId);
  const actualCancellationPolicy = cancellationPolicy || listing?.availability?.cancellationPolicy || 'moderate';

  // Hosts can always cancel their bookings (regardless of cancellation policy)
  if (cancelledBy === 'host') {
    if (booking.status === BOOKING_STATUS.CANCELLED) {
      throw new Error('Booking is already cancelled');
    }
    if (booking.status === BOOKING_STATUS.COMPLETED) {
      throw new Error('Cannot cancel a completed booking');
    }
  } else {
    // For guests, check cancellation policy
    if (!canCancelBooking(booking, actualCancellationPolicy)) {
      throw new Error('Booking cannot be cancelled based on cancellation policy');
    }
  }

  // Cancel the booking
  await updateBooking(bookingId, {
    status: BOOKING_STATUS.CANCELLED,
    cancellationReason: reason,
    cancelledBy: cancelledBy,
    cancelledAt: new Date()
  });

  // Handle refunds based on cancellation policy
  if (actualCancellationPolicy === 'flexible') {
    // Flexible: automatic 85% refund
    try {
      await processFlexibleRefund(bookingId);
    } catch (error) {
      console.error('Error processing flexible refund:', error);
      // Don't throw - booking is already cancelled
    }
  } else if (cancelledBy === 'host' && requestRefundForHost) {
    // Host cancelling and requesting refund (for strict/moderate policies)
    try {
      await requestRefund(bookingId, reason, 'host');
    } catch (error) {
      console.error('Error requesting refund for host:', error);
      // Don't throw - booking is already cancelled
    }
  }
  // For guests with strict/moderate: they need to request refund separately
};

/**
 * Confirm booking
 * @param {string} bookingId - Booking ID
 * @returns {Promise<void>}
 */
export const confirmBooking = async (bookingId) => {
  await updateBooking(bookingId, {
    status: BOOKING_STATUS.CONFIRMED
  });
};

/**
 * Complete booking
 * @param {string} bookingId - Booking ID
 * @returns {Promise<void>}
 */
export const completeBooking = async (bookingId) => {
  await updateBooking(bookingId, {
    status: BOOKING_STATUS.COMPLETED
  });
};

/**
 * Subscribe to bookings for a listing with real-time updates
 * @param {string} listingId - Listing ID
 * @param {Function} callback - Callback function that receives (bookings, error)
 * @param {Array} excludeStatuses - Statuses to exclude (e.g., ['cancelled'])
 * @returns {Function} Unsubscribe function
 */
export const subscribeToListingBookings = (listingId, callback, excludeStatuses = [BOOKING_STATUS.CANCELLED]) => {
  const queryFilters = [
    { field: 'listingId', operator: '==', value: listingId }
  ];

  return firestoreService.subscribeToDocuments(
    COLLECTION_NAME,
    queryFilters,
    null, // No orderBy to avoid index requirement - we'll sort client-side
    'asc',
    null, // No limit
    (documents, error) => {
      if (error) {
        console.error('Error loading bookings:', error);
        callback([], error);
        return;
      }

      // Filter out cancelled bookings (and any other excluded statuses)
      let bookings = documents;
      if (excludeStatuses.length > 0) {
        bookings = bookings.filter(booking => !excludeStatuses.includes(booking.status));
      }

      // Sort by checkIn date (client-side)
      bookings.sort((a, b) => {
        const aDate = a.checkIn?.toDate ? a.checkIn.toDate() : new Date(a.checkIn);
        const bDate = b.checkIn?.toDate ? b.checkIn.toDate() : new Date(b.checkIn);
        return aDate - bDate;
      });

      callback(bookings, null);
    }
  );
};

export { canCancelBooking };



















