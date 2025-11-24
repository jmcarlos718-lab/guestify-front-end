/**
 * User Model
 * 
 * Data model and validation for user documents
 */

import { USER_ROLES } from '../config/constants';

const normalizeEmail = (email = '') => email.trim().toLowerCase();

/**
 * Create a new user document
 * @param {Object} userData - User data
 * @returns {Object} User document
 */
export const createUserDocument = (userData) => {
  const {
    uid,
    email,
    displayName = '',
    role = USER_ROLES.GUEST,
    roles = [],
    photoURL = '',
    phone = '',
    age = null,
    bio = '',
    address = {},
    preferences = {},
    points = 0,
    createdAt = new Date(),
    updatedAt = new Date()
  } = userData;

  const normalizedEmail = normalizeEmail(email);
  const uniqueRoles = Array.from(
    new Set([
      role,
      ...(Array.isArray(roles) ? roles : [])
    ].filter(Boolean))
  );
  const primaryRole = uniqueRoles[0] || USER_ROLES.GUEST;

  return {
    uid,
    email: normalizedEmail,
    emailLower: normalizedEmail,
    displayName,
    role: primaryRole,
    roles: uniqueRoles,
    photoURL,
    phone,
    age,
    bio,
    address: {
      street: address.street || '',
      city: address.city || '',
      state: address.state || '',
      country: address.country || '',
      zipCode: address.zipCode || '',
      coordinates: address.coordinates || null
    },
    preferences: {
      language: preferences.language || 'en',
      currency: preferences.currency || 'PHP',
      notifications: preferences.notifications !== undefined ? preferences.notifications : true,
      emailNotifications: preferences.emailNotifications !== undefined ? preferences.emailNotifications : true
    },
    points,
    isVerified: false,
    isActive: true,
    createdAt,
    updatedAt
  };
};

/**
 * Validate user data
 * @param {Object} userData - User data to validate
 * @returns {Object} { valid: boolean, errors: Array }
 */
export const validateUser = (userData) => {
  const errors = [];

  if (!userData.email) {
    errors.push('Email is required');
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userData.email)) {
    errors.push('Invalid email format');
  }

  if (!userData.displayName || userData.displayName.trim().length < 2) {
    errors.push('Display name must be at least 2 characters');
  }

  const roles = userData.roles || [userData.role];
  if (
    !Array.isArray(roles) ||
    roles.some((role) => !Object.values(USER_ROLES).includes(role))
  ) {
    errors.push('Invalid user role');
  }

  return {
    valid: errors.length === 0,
    errors
  };
};

/**
 * Update user document
 * @param {Object} currentUser - Current user data
 * @param {Object} updates - Updates to apply
 * @returns {Object} Updated user document
 */
export const updateUserDocument = (currentUser, updates) => {
  return {
    ...currentUser,
    ...updates,
    updatedAt: new Date()
  };
};



