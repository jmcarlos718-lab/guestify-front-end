/**
 * Payment Service
 * 
 * Handles payment-related operations
 */

import * as firestoreService from './firestoreService';

/**
 * Get payment by booking ID
 * @param {string} bookingId - Booking ID
 * @returns {Promise<Object|null>} Payment document or null
 */
export const getPaymentByBookingId = async (bookingId) => {
  try {
    const payments = await firestoreService.getDocuments(
      'payments',
      [
        { field: 'bookingId', operator: '==', value: bookingId }
      ],
      null,
      'desc'
    );

    return payments.length > 0 ? payments[0] : null;
  } catch (error) {
    console.error('Error getting payment by booking ID:', error);
    throw error;
  }
};

/**
 * Get payments by user ID
 * @param {string} userId - User ID
 * @param {string} role - 'guest' or 'host'
 * @returns {Promise<Array>} Array of payments
 */
export const getPaymentsByUserId = async (userId, role = 'guest') => {
  try {
    const field = role === 'guest' ? 'userId' : 'hostId';
    const payments = await firestoreService.getDocuments(
      'payments',
      [
        { field, operator: '==', value: userId }
      ],
      null,
      'desc'
    );

    return payments;
  } catch (error) {
    console.error('Error getting payments by user ID:', error);
    throw error;
  }
};






