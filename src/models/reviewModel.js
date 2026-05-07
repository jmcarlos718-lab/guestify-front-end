/**
 * Review Model
 * 
 * Data model and validation for review documents
 */

/**
 * Create a new review document
 * @param {Object} reviewData - Review data
 * @returns {Object} Review document
 */
export const createReviewDocument = (reviewData) => {
  const {
    bookingId,
    listingId,
    hostId,
    guestId,
    rating,
    comment = '',
    categories = {},
    isPublic = true,
    createdAt = new Date(),
    updatedAt = new Date()
  } = reviewData;

  return {
    bookingId,
    listingId,
    hostId,
    guestId,
    rating, // 1-5
    comment,
    categories: {
      cleanliness: categories.cleanliness || rating,
      communication: categories.communication || rating,
      checkIn: categories.checkIn || rating,
      accuracy: categories.accuracy || rating,
      location: categories.location || rating,
      value: categories.value || rating
    },
    isPublic,
    hostResponse: null,
    hostResponseAt: null,
    helpfulCount: 0,
    reported: false,
    createdAt,
    updatedAt
  };
};

/**
 * Validate review data
 * @param {Object} reviewData - Review data to validate
 * @returns {Object} { valid: boolean, errors: Array }
 */
export const validateReview = (reviewData) => {
  const errors = [];

  if (!reviewData.bookingId) {
    errors.push('Booking ID is required');
  }

  if (!reviewData.listingId) {
    errors.push('Listing ID is required');
  }

  if (!reviewData.guestId) {
    errors.push('Guest ID is required');
  }

  if (!reviewData.rating || reviewData.rating < 1 || reviewData.rating > 5) {
    errors.push('Rating must be between 1 and 5');
  }

  if (reviewData.comment && reviewData.comment.trim().length < 10) {
    errors.push('Comment must be at least 10 characters');
  }

  return {
    valid: errors.length === 0,
    errors
  };
};

/**
 * Calculate average rating from reviews
 * @param {Array} reviews - Array of review documents
 * @returns {Object} Rating statistics
 */
export const calculateAverageRating = (reviews) => {
  if (!reviews || reviews.length === 0) {
    return {
      average: 0,
      count: 0,
      breakdown: {
        5: 0,
        4: 0,
        3: 0,
        2: 0,
        1: 0
      }
    };
  }

  const total = reviews.reduce((sum, review) => sum + review.rating, 0);
  const average = total / reviews.length;

  const breakdown = reviews.reduce((acc, review) => {
    acc[review.rating] = (acc[review.rating] || 0) + 1;
    return acc;
  }, { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 });

  return {
    average: Math.round(average * 10) / 10,
    count: reviews.length,
    breakdown
  };
};






























