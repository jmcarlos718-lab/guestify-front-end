/**
 * Custom Hook: useAuth
 * 
 * Provides authentication state and methods
 * Uses Firebase Auth to manage user authentication
 */

import { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../config/firebase';
import * as authService from '../services/authService';

export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Listen for authentication state changes
    const unsubscribe = onAuthStateChanged(
      auth,
      (firebaseUser) => {
        if (firebaseUser) {
          setUser({
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName,
            photoURL: firebaseUser.photoURL,
            emailVerified: firebaseUser.emailVerified
          });
        } else {
          setUser(null);
        }
        setLoading(false);
        setError(null);
      },
      (error) => {
        setError(error);
        setLoading(false);
        setUser(null);
      }
    );

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  // Register with email and password
  const register = async (email, password, displayName = null) => {
    try {
      setError(null);
      const userData = await authService.registerWithEmail(email, password, displayName);
      return userData;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  // Sign in with email and password
  const signIn = async (email, password) => {
    try {
      setError(null);
      const userData = await authService.signInWithEmail(email, password);
      return userData;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  // Sign out
  const signOut = async () => {
    try {
      setError(null);
      await authService.signOutUser();
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  // Reset password
  const resetPassword = async (email) => {
    try {
      setError(null);
      await authService.resetPassword(email);
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  // Update user profile
  const updateProfile = async (updates) => {
    try {
      setError(null);
      await authService.updateUserProfile(updates);
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  // Update password
  const updatePassword = async (currentPassword, newPassword) => {
    try {
      setError(null);
      await authService.updateUserPassword(currentPassword, newPassword);
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  return {
    user,
    loading,
    error,
    register,
    signIn,
    signOut,
    resetPassword,
    updateProfile,
    updatePassword,
    isAuthenticated: !!user
  };
};




























