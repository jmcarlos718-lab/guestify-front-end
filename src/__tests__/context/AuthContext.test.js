/**
 * AuthContext Tests
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { AuthProvider, useAuthContext } from '../../context/AuthContext';

// Mock Firebase
jest.mock('../../config/firebase', () => ({
  auth: {},
  db: {}
}));

jest.mock('firebase/auth', () => ({
  onAuthStateChanged: jest.fn((auth, callback) => {
    // Simulate no user
    callback(null);
    return jest.fn(); // Return unsubscribe function
  })
}));

jest.mock('../../services/authService', () => ({
  registerWithEmail: jest.fn(),
  signInWithEmail: jest.fn(),
  signOutUser: jest.fn(),
  resetPassword: jest.fn()
}));

jest.mock('../../services/firestoreService', () => ({
  getDocument: jest.fn(),
  createDocument: jest.fn(),
  updateDocument: jest.fn()
}));

const TestComponent = () => {
  const { user, loading, isAuthenticated } = useAuthContext();
  
  if (loading) return <div>Loading...</div>;
  
  return (
    <div>
      {isAuthenticated ? `User: ${user?.email}` : 'Not authenticated'}
    </div>
  );
};

describe('AuthContext', () => {
  test('provides authentication context', async () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Not authenticated')).toBeInTheDocument();
    });
  });
});





