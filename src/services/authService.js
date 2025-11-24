/**
 * Authentication Service
 * 
 * Handles all authentication operations using Firebase Auth
 * Supports Email/Password and Phone (SMS) authentication
 */

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  sendEmailVerification,
  updatePassword,
  deleteUser,
  reauthenticateWithCredential,
  EmailAuthProvider
} from 'firebase/auth';
import { auth } from '../config/firebase';

/**
 * Register a new user with email and password
 * @param {string} email - User email
 * @param {string} password - User password
 * @param {string} displayName - User display name (optional)
 * @returns {Promise<Object>} User object with uid and email
 */
export const registerWithEmail = async (email, password, displayName = null) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Update profile with display name if provided
    if (displayName) {
      await updateProfile(user, { displayName });
    }

    // Always send Firebase verification email as fallback
    try {
      await sendEmailVerification(user);
    } catch (error) {
      console.warn('Failed to send Firebase verification email:', error);
    }

    return {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      emailVerified: user.emailVerified
    };
  } catch (error) {
    throw handleAuthError(error);
  }
};

/**
 * Sign in with email and password
 * @param {string} email - User email
 * @param {string} password - User password
 * @returns {Promise<Object>} User object
 */
export const signInWithEmail = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    return {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      emailVerified: user.emailVerified,
      photoURL: user.photoURL
    };
  } catch (error) {
    throw handleAuthError(error);
  }
};

/**
 * Sign out current user
 * @returns {Promise<void>}
 */
export const signOutUser = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    throw handleAuthError(error);
  }
};

/**
 * Send password reset email
 * @param {string} email - User email
 * @returns {Promise<void>}
 */
export const resetPassword = async (email) => {
  try {
    await sendPasswordResetEmail(auth, email);
  } catch (error) {
    throw handleAuthError(error);
  }
};

/**
 * Update user password
 * @param {string} currentPassword - Current password
 * @param {string} newPassword - New password
 * @returns {Promise<void>}
 */
export const updateUserPassword = async (currentPassword, newPassword) => {
  try {
    const user = auth.currentUser;
    if (!user || !user.email) {
      throw new Error('No authenticated user');
    }

    // Re-authenticate user
    const credential = EmailAuthProvider.credential(user.email, currentPassword);
    await reauthenticateWithCredential(user, credential);

    // Update password
    await updatePassword(user, newPassword);
  } catch (error) {
    throw handleAuthError(error);
  }
};

/**
 * Update user profile
 * @param {Object} updates - Profile updates { displayName, photoURL }
 * @returns {Promise<void>}
 */
export const updateUserProfile = async (updates) => {
  try {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('No authenticated user');
    }

    await updateProfile(user, updates);
  } catch (error) {
    throw handleAuthError(error);
  }
};

/**
 * Delete user account
 * @param {string} password - User password for re-authentication
 * @returns {Promise<void>}
 */
export const deleteUserAccount = async (password) => {
  try {
    const user = auth.currentUser;
    if (!user || !user.email) {
      throw new Error('No authenticated user');
    }

    // Re-authenticate before deletion
    const credential = EmailAuthProvider.credential(user.email, password);
    await reauthenticateWithCredential(user, credential);

    // Delete user
    await deleteUser(user);
  } catch (error) {
    throw handleAuthError(error);
  }
};

/**
 * Get current authenticated user
 * @returns {Object|null} Current user or null
 */
export const getCurrentUser = () => {
  return auth.currentUser;
};


/**
 * Handle Firebase Auth errors and return user-friendly messages
 * @param {Error} error - Firebase error
 * @returns {Error} Formatted error with user-friendly message
 */
const handleAuthError = (error) => {
  let message = 'An authentication error occurred';

  switch (error.code) {
    case 'auth/email-already-in-use':
      message = 'This email is already registered';
      break;
    case 'auth/invalid-email':
      message = 'Invalid email address';
      break;
    case 'auth/operation-not-allowed':
      message = 'This operation is not allowed';
      break;
    case 'auth/weak-password':
      message = 'Password is too weak. Please use a stronger password';
      break;
    case 'auth/user-disabled':
      message = 'This account has been disabled';
      break;
    case 'auth/user-not-found':
      message = 'No account found with this email';
      break;
    case 'auth/wrong-password':
      message = 'Incorrect password';
      break;
    case 'auth/invalid-credential':
      message = 'Invalid email or password';
      break;
    case 'auth/too-many-requests':
      message = 'Too many failed attempts. Please try again later';
      break;
    case 'auth/network-request-failed':
      message = 'Network error. Please check your connection';
      break;
    default:
      message = error.message || message;
  }

  return new Error(message);
};





