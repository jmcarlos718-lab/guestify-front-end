/**
 * Wishlist Model
 * 
 * Data model for user wishlists
 */

/**
 * Create wishlist document
 * @param {Object} wishlistData - Wishlist data
 * @returns {Object} Wishlist document
 */
export const createWishlistDocument = (wishlistData) => {
  const {
    userId,
    listingId,
    createdAt = new Date(),
    updatedAt = new Date()
  } = wishlistData;

  return {
    userId,
    listingId,
    createdAt,
    updatedAt
  };
};

/**
 * Validate wishlist data
 * @param {Object} wishlistData - Wishlist data to validate
 * @returns {Object} Validation result
 */
export const validateWishlist = (wishlistData) => {
  const errors = [];

  if (!wishlistData.userId) {
    errors.push('User ID is required');
  }

  if (!wishlistData.listingId) {
    errors.push('Listing ID is required');
  }

  return {
    valid: errors.length === 0,
    errors
  };
};



