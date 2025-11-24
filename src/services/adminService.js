/**
 * Admin Service
 * 
 * Handles all admin-related API calls
 * Manages admin authentication and profile operations
 */

import apiClient, { setAuthToken } from './apiClient';

let adminAuthToken = null;

/**
 * Set the admin authentication token
 * This will be used for all subsequent API calls
 * @param {string|null} token - JWT token or null to clear
 */
export const setAdminAuthToken = (token) => {
  adminAuthToken = token;
  setAuthToken(token);
};

/**
 * Login as admin
 * @param {string} email - Admin email
 * @param {string} password - Admin password
 * @returns {Promise<{token: string, admin: Object}>}
 */
export const login = async (email, password) => {
  try {
    const response = await apiClient.post('/admin/login', {
      email,
      password
    });
    
    const { token, admin } = response.data;
    
    // Set the token for future requests
    setAdminAuthToken(token);
    
    return { token, admin };
  } catch (error) {
    const message = error?.response?.data?.message || error.message || 'Failed to login as admin';
    throw new Error(message);
  }
};

/**
 * Fetch current admin profile
 * Requires authentication token
 * @returns {Promise<Object>} Admin profile
 */
export const fetchProfile = async () => {
  try {
    const response = await apiClient.get('/admin/me');
    return response.data.admin;
  } catch (error) {
    const message = error?.response?.data?.message || error.message || 'Failed to fetch admin profile';
    throw new Error(message);
  }
};

/**
 * Get admin statistics
 * @returns {Promise<Object>} Statistics object
 */
export const getStats = async () => {
  try {
    const response = await apiClient.get('/admin/stats');
    return response.data;
  } catch (error) {
    const message = error?.response?.data?.message || error.message || 'Failed to fetch statistics';
    throw new Error(message);
  }
};

/**
 * Get all users (paginated)
 * @param {Object} params - Query parameters { page, limit, search }
 * @returns {Promise<Object>} Users data with pagination
 */
export const getUsers = async (params = {}) => {
  try {
    const response = await apiClient.get('/admin/users', { params });
    return response.data;
  } catch (error) {
    const message = error?.response?.data?.message || error.message || 'Failed to fetch users';
    throw new Error(message);
  }
};

/**
 * Get all hosts (paginated)
 * @param {Object} params - Query parameters { page, limit, search }
 * @returns {Promise<Object>} Hosts data with pagination
 */
export const getHosts = async (params = {}) => {
  try {
    const response = await apiClient.get('/admin/hosts', { params });
    return response.data;
  } catch (error) {
    const message = error?.response?.data?.message || error.message || 'Failed to fetch hosts';
    throw new Error(message);
  }
};

/**
 * Get all listings (paginated)
 * @param {Object} params - Query parameters { page, limit, search }
 * @returns {Promise<Object>} Listings data with pagination
 */
export const getListings = async (params = {}) => {
  try {
    const response = await apiClient.get('/admin/listings', { params });
    return response.data;
  } catch (error) {
    const message = error?.response?.data?.message || error.message || 'Failed to fetch listings';
    throw new Error(message);
  }
};

// Alias functions for backward compatibility
export const fetchStats = getStats;
export const fetchUsers = getUsers;
export const fetchHosts = getHosts;
export const fetchListings = getListings;

/**
 * Create a new user
 * @param {Object} userData - User data { name, email, role, status, isVerified }
 * @returns {Promise<Object>} Created user
 */
export const createUser = async (userData) => {
  try {
    const response = await apiClient.post('/admin/users', userData);
    return response.data;
  } catch (error) {
    const message = error?.response?.data?.message || error.message || 'Failed to create user';
    throw new Error(message);
  }
};

/**
 * Update an existing user
 * @param {number|string} userId - User ID
 * @param {Object} userData - User data to update
 * @returns {Promise<Object>} Updated user
 */
export const updateUser = async (userId, userData) => {
  try {
    const response = await apiClient.put(`/admin/users/${userId}`, userData);
    return response.data;
  } catch (error) {
    const message = error?.response?.data?.message || error.message || 'Failed to update user';
    throw new Error(message);
  }
};

/**
 * Delete a user
 * @param {number|string} userId - User ID
 * @returns {Promise<void>}
 */
export const deleteUser = async (userId) => {
  try {
    await apiClient.delete(`/admin/users/${userId}`);
  } catch (error) {
    const message = error?.response?.data?.message || error.message || 'Failed to delete user';
    throw new Error(message);
  }
};

/**
 * Create a new host
 * @param {Object} hostData - Host data { name, email, phone, status }
 * @returns {Promise<Object>} Created host
 */
export const createHost = async (hostData) => {
  try {
    const response = await apiClient.post('/admin/hosts', hostData);
    return response.data;
  } catch (error) {
    const message = error?.response?.data?.message || error.message || 'Failed to create host';
    throw new Error(message);
  }
};

/**
 * Update an existing host
 * @param {number|string} hostId - Host ID
 * @param {Object} hostData - Host data to update
 * @returns {Promise<Object>} Updated host
 */
export const updateHost = async (hostId, hostData) => {
  try {
    const response = await apiClient.put(`/admin/hosts/${hostId}`, hostData);
    return response.data;
  } catch (error) {
    const message = error?.response?.data?.message || error.message || 'Failed to update host';
    throw new Error(message);
  }
};

/**
 * Delete a host
 * @param {number|string} hostId - Host ID
 * @returns {Promise<void>}
 */
export const deleteHost = async (hostId) => {
  try {
    await apiClient.delete(`/admin/hosts/${hostId}`);
  } catch (error) {
    const message = error?.response?.data?.message || error.message || 'Failed to delete host';
    throw new Error(message);
  }
};

/**
 * Create a new listing
 * @param {Object} listingData - Listing data { hostId, title, description, price, location, status }
 * @returns {Promise<Object>} Created listing
 */
export const createListing = async (listingData) => {
  try {
    const response = await apiClient.post('/admin/listings', listingData);
    return response.data;
  } catch (error) {
    const message = error?.response?.data?.message || error.message || 'Failed to create listing';
    throw new Error(message);
  }
};

/**
 * Update an existing listing
 * @param {number|string} listingId - Listing ID
 * @param {Object} listingData - Listing data to update
 * @returns {Promise<Object>} Updated listing
 */
export const updateListing = async (listingId, listingData) => {
  try {
    const response = await apiClient.put(`/admin/listings/${listingId}`, listingData);
    return response.data;
  } catch (error) {
    const message = error?.response?.data?.message || error.message || 'Failed to update listing';
    throw new Error(message);
  }
};

/**
 * Delete a listing
 * @param {number|string} listingId - Listing ID
 * @returns {Promise<void>}
 */
export const deleteListing = async (listingId) => {
  try {
    await apiClient.delete(`/admin/listings/${listingId}`);
  } catch (error) {
    const message = error?.response?.data?.message || error.message || 'Failed to delete listing';
    throw new Error(message);
  }
};
