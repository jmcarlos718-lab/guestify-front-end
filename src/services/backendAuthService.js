import apiClient from './apiClient';

export const registerUser = async ({ email, name, userId, role, phone }) => {
  try {
    return await apiClient.post('/auth/register', {
      email,
      name,
      userId,
      role,
      phone
    });
  } catch (error) {
    // If backend is unavailable, log warning but don't block registration
    if (!error.response || error.message?.includes('Cannot connect')) {
      console.warn('Backend service unavailable, registration will proceed with Firebase only:', error.message);
      throw new Error('Backend service unavailable. Registration will proceed with Firebase authentication only.');
    }
    throw error;
  }
};

export const resendVerification = async (email) => {
  try {
    return await apiClient.post('/auth/resend-verification', { email });
  } catch (error) {
    if (!error.response || error.message?.includes('Cannot connect')) {
      throw new Error('Backend service unavailable. Please try again later or check your email for the verification link.');
    }
    throw error;
  }
};

export const canLogin = async (email) => {
  try {
    const { data } = await apiClient.post('/auth/can-login', { email });
    return data;
  } catch (error) {
    // If backend is unavailable, allow login to proceed (Firebase will handle auth)
    if (!error.response || error.message?.includes('Cannot connect') || error.message?.includes('Network')) {
      console.warn('Backend service unavailable, allowing login to proceed:', error.message);
      // Return a response that allows login
      return { isVerified: true, canLogin: true };
    }
    // For other errors, re-throw
    throw error;
  }
};

export const verifyEmail = async (token) => {
  try {
    const { data } = await apiClient.post('/auth/verify-email', { token });
    return data;
  } catch (error) {
    if (!error.response || error.message?.includes('Cannot connect')) {
      throw new Error('Backend service unavailable. Please try again later.');
    }
    throw error;
  }
};

export const syncUser = async ({ email, name, userId, role, phone }) => {
  try {
    return await apiClient.post('/auth/sync', {
      email,
      name,
      userId,
      role,
      phone
    });
  } catch (error) {
    throw error;
  }
};


