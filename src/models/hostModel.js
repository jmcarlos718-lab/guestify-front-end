/**
 * Host Model
 *
 * Data model and validation for host documents
 */

import { USER_ROLES } from '../config/constants';

const normalizeEmail = (email = '') => email.trim().toLowerCase();

/**
 * Create a new host document
 * @param {Object} hostData - Host data
 * @returns {Object} Host document
 */
export const createHostDocument = (hostData) => {
  const {
    uid,
    email,
    displayName = '',
    phone = '',
    verificationStatus = 'pending',
    identityDocuments = [],
    verificationNotes = '',
    createdAt = new Date(),
    updatedAt = new Date()
  } = hostData;

  const normalizedEmail = normalizeEmail(email);

  return {
    uid,
    email: normalizedEmail,
    emailLower: normalizedEmail,
    displayName,
    phone,
    role: USER_ROLES.HOST,
    verificationStatus,
    verificationNotes,
    identityDocuments: identityDocuments.map((doc) => ({
      type: doc?.type || '',
      documentNumber: doc?.documentNumber || '',
      url: doc?.url || '',
      uploadedAt: doc?.uploadedAt || createdAt
    })),
    completedSteps: hostData.completedSteps || [],
    isActive: hostData.isActive !== undefined ? hostData.isActive : true,
    createdAt,
    updatedAt
  };
};

/**
 * Validate host data
 * @param {Object} hostData - Host data to validate
 * @returns {Object} { valid: boolean, errors: Array }
 */
export const validateHost = (hostData) => {
  const errors = [];

  if (!hostData.email) {
    errors.push('Host email is required');
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(hostData.email)) {
    errors.push('Invalid host email format');
  }

  if (!hostData.uid) {
    errors.push('Host UID is required');
  }

  return {
    valid: errors.length === 0,
    errors
  };
};

export const normalizeHostEmail = normalizeEmail;



