/**
 * Wishlist Service
 * 
 * Service functions for wishlist operations
 */

import * as firestoreService from './firestoreService';
import { createWishlistDocument, validateWishlist } from '../models/wishlistModel';

const COLLECTION_NAME = 'wishlists';

/**
 * Add listing to wishlist
 * @param {string} userId - User ID
 * @param {string} listingId - Listing ID
 * @returns {Promise<string>} Wishlist item ID
 */
export const addToWishlist = async (userId, listingId) => {
  // Check if already in wishlist
  const existing = await getWishlistItem(userId, listingId);
  if (existing) {
    throw new Error('Listing is already in your wishlist');
  }

  const wishlistData = {
    userId,
    listingId
  };

  const validation = validateWishlist(wishlistData);
  if (!validation.valid) {
    throw new Error(validation.errors.join(', '));
  }

  const wishlistDoc = createWishlistDocument(wishlistData);
  return await firestoreService.createDocument(COLLECTION_NAME, wishlistDoc);
};

/**
 * Remove listing from wishlist
 * @param {string} userId - User ID
 * @param {string} listingId - Listing ID
 * @returns {Promise<void>}
 */
export const removeFromWishlist = async (userId, listingId) => {
  const item = await getWishlistItem(userId, listingId);
  if (!item) {
    throw new Error('Listing is not in your wishlist');
  }

  await firestoreService.deleteDocument(COLLECTION_NAME, item.id);
};

/**
 * Get wishlist item
 * @param {string} userId - User ID
 * @param {string} listingId - Listing ID
 * @returns {Promise<Object|null>} Wishlist item or null
 */
export const getWishlistItem = async (userId, listingId) => {
  try {
    const items = await firestoreService.getDocuments(COLLECTION_NAME, [
      { field: 'userId', operator: '==', value: userId },
      { field: 'listingId', operator: '==', value: listingId }
    ]);

    if (items.length === 0) {
      return null;
    }

    return { id: items[0].id, ...items[0] };
  } catch (error) {
    console.error('Error getting wishlist item:', error);
    return null;
  }
};

/**
 * Check if listing is in wishlist
 * @param {string} userId - User ID
 * @param {string} listingId - Listing ID
 * @returns {Promise<boolean>} True if in wishlist
 */
export const isInWishlist = async (userId, listingId) => {
  const item = await getWishlistItem(userId, listingId);
  return item !== null;
};

/**
 * Get user wishlist
 * @param {string} userId - User ID
 * @returns {Promise<Array>} Array of wishlist items with listing data
 */
export const getUserWishlist = async (userId) => {
  try {
    // Get documents without orderBy to avoid index requirement - sort client-side
    let items = await firestoreService.getDocuments(
      COLLECTION_NAME,
      [{ field: 'userId', operator: '==', value: userId }],
      null, // No orderBy - will sort client-side
      'asc'
    );

    // Sort client-side by createdAt (most recent first)
    items.sort((a, b) => {
      const aDate = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt || 0);
      const bDate = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt || 0);
      return bDate - aDate; // Descending order
    });

    // Fetch listing data for each wishlist item
    const { getListing } = await import('./listingService');
    const wishlistWithListings = await Promise.all(
      items.map(async (item) => {
        try {
          const listing = await getListing(item.listingId);
          return {
            id: item.id,
            listingId: item.listingId,
            listing: listing || null,
            createdAt: item.createdAt
          };
        } catch (error) {
          console.error(`Error fetching listing ${item.listingId}:`, error);
          return {
            id: item.id,
            listingId: item.listingId,
            listing: null,
            createdAt: item.createdAt
          };
        }
      })
    );

    // Filter out items with null listings (deleted listings)
    return wishlistWithListings.filter(item => item.listing !== null);
  } catch (error) {
    console.error('Error getting user wishlist:', error);
    return [];
  }
};



