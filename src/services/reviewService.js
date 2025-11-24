/**
 * Review Service
 * 
 * Service functions for review operations
 */

import * as firestoreService from './firestoreService';
import { createReviewDocument, validateReview, calculateAverageRating } from '../models/reviewModel';

const COLLECTION_NAME = 'reviews';

/**
 * Create a new review
 * @param {Object} reviewData - Review data
 * @returns {Promise<string>} Review ID
 */
export const createReview = async (reviewData) => {
  const validation = validateReview(reviewData);
  if (!validation.valid) {
    throw new Error(validation.errors.join(', '));
  }

  const reviewDoc = createReviewDocument(reviewData);
  const reviewId = await firestoreService.createDocument(COLLECTION_NAME, reviewDoc);
  return reviewId;
};

/**
 * Get review by ID
 * @param {string} reviewId - Review ID
 * @returns {Promise<Object>} Review document
 */
export const getReview = async (reviewId) => {
  return await firestoreService.getDocument(COLLECTION_NAME, reviewId);
};

/**
 * Get reviews for a listing
 * @param {string} listingId - Listing ID
 * @param {Object} filters - Filter options
 * @returns {Promise<Array>} Array of reviews
 */
export const getListingReviews = async (listingId, filters = {}) => {
  const queryFilters = [
    { field: 'listingId', operator: '==', value: listingId },
    { field: 'isPublic', operator: '==', value: true }
  ];

  // Get documents without orderBy to avoid index requirement - sort client-side
  let reviews = await firestoreService.getDocuments(
    COLLECTION_NAME,
    queryFilters,
    null, // No orderBy - will sort client-side
    'asc',
    filters.limit || null
  );

  // Sort client-side
  const orderBy = filters.orderBy || 'createdAt';
  const orderDirection = filters.orderDirection || 'desc';
  
  reviews.sort((a, b) => {
    const aValue = a[orderBy]?.toDate ? a[orderBy].toDate().getTime() : (a[orderBy] || 0);
    const bValue = b[orderBy]?.toDate ? b[orderBy].toDate().getTime() : (b[orderBy] || 0);
    
    if (orderDirection === 'desc') {
      return bValue - aValue;
    }
    return aValue - bValue;
  });

  return reviews;
};

/**
 * Get reviews by a user
 * @param {string} userId - User ID
 * @returns {Promise<Array>} Array of reviews
 */
export const getUserReviews = async (userId) => {
  const queryFilters = [
    { field: 'guestId', operator: '==', value: userId }
  ];

  // Get documents without orderBy to avoid index requirement - sort client-side
  let reviews = await firestoreService.getDocuments(
    COLLECTION_NAME,
    queryFilters,
    null, // No orderBy - will sort client-side
    'asc',
    null
  );

  // Sort client-side by createdAt descending
  reviews.sort((a, b) => {
    const aValue = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : (a.createdAt || 0);
    const bValue = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : (b.createdAt || 0);
    return bValue - aValue;
  });

  return reviews;
};

/**
 * Update review
 * @param {string} reviewId - Review ID
 * @param {Object} updates - Updates to apply
 * @returns {Promise<void>}
 */
export const updateReview = async (reviewId, updates) => {
  await firestoreService.updateDocument(COLLECTION_NAME, reviewId, updates);
};

/**
 * Add host response to review
 * @param {string} reviewId - Review ID
 * @param {string} response - Host response
 * @returns {Promise<void>}
 */
export const addHostResponse = async (reviewId, response) => {
  await updateReview(reviewId, {
    hostResponse: response,
    hostResponseAt: new Date()
  });
};

export { calculateAverageRating };























