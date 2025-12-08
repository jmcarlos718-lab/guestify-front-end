/**
 * Payment Model
 * 
 * Data model and validation for payment documents
 */

import { PAYMENT_STATUS } from '../config/constants';

/**
 * Create a new payment document
 * @param {Object} paymentData - Payment data
 * @returns {Object} Payment document
 */
export const createPaymentDocument = (paymentData) => {
  const {
    bookingId,
    userId,
    hostId,
    amount,
    currency = 'PHP',
    paymentMethod,
    status = PAYMENT_STATUS.PENDING,
    transactionId = null,
    metadata = {},
    adminIncome = null,
    hostIncome = null,
    payoutStatus = 'pending',
    hostPayoutStatus = 'pending',
    adminPayoutStatus = 'pending',
    createdAt = new Date(),
    updatedAt = new Date()
  } = paymentData;

  // Calculate distribution if not provided (15% admin, 85% host)
  const calculatedAdminIncome = adminIncome !== null ? adminIncome : amount * 0.15;
  const calculatedHostIncome = hostIncome !== null ? hostIncome : amount * 0.85;

  return {
    bookingId,
    userId,
    hostId,
    amount,
    currency,
    paymentMethod, // credit_card, debit_card, e_wallet, bank_transfer, paypal
    status,
    transactionId,
    adminIncome: calculatedAdminIncome,
    hostIncome: calculatedHostIncome,
    payoutStatus, // deprecated, kept for backward compatibility
    hostPayoutStatus,
    adminPayoutStatus,
    metadata: {
      cardLast4: metadata.cardLast4 || null,
      cardBrand: metadata.cardBrand || null,
      walletType: metadata.walletType || null,
      bankName: metadata.bankName || null,
      ...metadata
    },
    refundAmount: 0,
    refundReason: null,
    refundedAt: null,
    createdAt,
    updatedAt
  };
};

/**
 * Validate payment data
 * @param {Object} paymentData - Payment data to validate
 * @returns {Object} { valid: boolean, errors: Array }
 */
export const validatePayment = (paymentData) => {
  const errors = [];

  if (!paymentData.bookingId) {
    errors.push('Booking ID is required');
  }

  if (!paymentData.userId) {
    errors.push('User ID is required');
  }

  if (!paymentData.amount || paymentData.amount <= 0) {
    errors.push('Amount must be greater than 0');
  }

  if (!paymentData.paymentMethod) {
    errors.push('Payment method is required');
  }

  const validMethods = ['credit_card', 'debit_card', 'e_wallet', 'bank_transfer', 'paypal'];
  if (!validMethods.includes(paymentData.paymentMethod)) {
    errors.push('Invalid payment method');
  }

  return {
    valid: errors.length === 0,
    errors
  };
};

/**
 * Calculate service fee
 * @param {number} amount - Base amount
 * @param {number} serviceFeePercentage - Service fee percentage (default 10%)
 * @returns {Object} Fee breakdown
 */
export const calculateServiceFee = (amount, serviceFeePercentage = 10) => {
  const serviceFee = (amount * serviceFeePercentage) / 100;
  const total = amount + serviceFee;

  return {
    baseAmount: amount,
    serviceFee,
    serviceFeePercentage,
    total
  };
};













