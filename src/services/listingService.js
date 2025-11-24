/**
 * Listing Service
 * 
 * Service functions for listing operations
 */

import * as firestoreService from './firestoreService';
import { createListingDocument, validateListing, calculateListingPrice } from '../models/listingModel';
import { LISTING_STATUS } from '../config/constants';
import { timestampToDate } from './firestoreService';

const COLLECTION_NAME = 'listings';

/**
 * Create a new listing
 * @param {Object} listingData - Listing data
 * @returns {Promise<string>} Listing ID
 */
export const createListing = async (listingData) => {
  const validation = validateListing(listingData);
  if (!validation.valid) {
    throw new Error(validation.errors.join(', '));
  }

  const listingDoc = createListingDocument(listingData);
  const listingId = await firestoreService.createDocument(COLLECTION_NAME, listingDoc);
  return listingId;
};

/**
 * Get listing by ID
 * @param {string} listingId - Listing ID
 * @returns {Promise<Object>} Listing document
 */
export const getListing = async (listingId) => {
  return await firestoreService.getDocument(COLLECTION_NAME, listingId);
};

/**
 * Get listings with filters
 * @param {Object} filters - Filter options
 * @returns {Promise<Array>} Array of listings
 */
export const getListings = async (filters = {}) => {
  const {
    category,
    status = LISTING_STATUS.PUBLISHED,
    city,
    hostId,
    minPrice,
    maxPrice,
    limit: limitCount = 20,
    orderBy = 'createdAt',
    orderDirection = 'desc'
  } = filters;

  // Host dashboard: fetch by hostId only and sort/filter locally to avoid composite index requirements.
  if (hostId) {
    let hostListings = await firestoreService.getDocuments(COLLECTION_NAME, [
      { field: 'hostId', operator: '==', value: hostId }
    ]);

    if (status) {
      hostListings = hostListings.filter((listing) => listing.status === status);
    }

    hostListings = hostListings.sort((a, b) => {
      const aValue = a[orderBy] || a.createdAt || 0;
      const bValue = b[orderBy] || b.createdAt || 0;

      if (orderDirection === 'asc') {
        return bValue < aValue ? 1 : -1;
      }
      return aValue < bValue ? 1 : -1;
    });

    if (limitCount) {
      hostListings = hostListings.slice(0, limitCount);
    }

    return hostListings;
  }

  const queryFilters = [];

  if (status) {
    queryFilters.push({ field: 'status', operator: '==', value: status });
  }

  if (category) {
    queryFilters.push({ field: 'category', operator: '==', value: category });
  }

  if (city) {
    queryFilters.push({ field: 'location.city', operator: '==', value: city });
  }

  if (minPrice) {
    queryFilters.push({ field: 'pricing.baseRate', operator: '>=', value: minPrice });
  }

  if (maxPrice) {
    queryFilters.push({ field: 'pricing.baseRate', operator: '<=', value: maxPrice });
  }

  return await firestoreService.getDocuments(
    COLLECTION_NAME,
    queryFilters,
    orderBy,
    orderDirection,
    limitCount
  );
};

/**
 * Update listing
 * @param {string} listingId - Listing ID
 * @param {Object} updates - Updates to apply
 * @returns {Promise<void>}
 */
export const updateListing = async (listingId, updates) => {
  await firestoreService.updateDocument(COLLECTION_NAME, listingId, updates);
};

/**
 * Delete listing
 * @param {string} listingId - Listing ID
 * @returns {Promise<void>}
 */
export const deleteListing = async (listingId) => {
  await firestoreService.deleteDocument(COLLECTION_NAME, listingId);
};

/**
 * Save listing as draft
 * @param {string} listingId - Listing ID
 * @param {Object} listingData - Listing data
 * @returns {Promise<string>} Listing ID
 */
export const saveDraft = async (listingId, listingData) => {
  if (listingId) {
    await updateListing(listingId, {
      ...listingData,
      status: LISTING_STATUS.DRAFT
    });
    return listingId;
  } else {
    const listingDoc = createListingDocument({
      ...listingData,
      status: LISTING_STATUS.DRAFT
    });
    return await firestoreService.createDocument(COLLECTION_NAME, listingDoc);
  }
};

/**
 * Publish listing
 * @param {string} listingId - Listing ID
 * @returns {Promise<void>}
 */
export const publishListing = async (listingId) => {
  try {
    const listing = await getListing(listingId);
    
    if (!listing) {
      throw new Error('Listing not found');
    }
    
    // Validate listing before publishing
    const validation = validateListing(listing);
    
    if (!validation.valid) {
      throw new Error(`Cannot publish listing: ${validation.errors.join(', ')}`);
    }

    // Update status to published
    await updateListing(listingId, {
      status: LISTING_STATUS.PUBLISHED,
      updatedAt: new Date()
    });
  } catch (error) {
    console.error('Publish listing error:', error);
    throw error;
  }
};

/**
 * Search listings
 * @param {Object} searchParams - Search parameters
 * @returns {Promise<Array>} Array of listings
 */
export const searchListings = async (searchParams) => {
  const {
    query: searchQuery,
    location,
    checkIn,
    checkOut,
    guests,
    category,
    minPrice,
    maxPrice,
    amenities = []
  } = searchParams;

  // Build Firestore filters - use only indexed fields to avoid composite index issues
  // Start with just status filter (this has an index)
  const filters = [
    { field: 'status', operator: '==', value: LISTING_STATUS.PUBLISHED }
  ];

  // Only add category if provided (has composite index with status + createdAt)
  if (category) {
    filters.push({ field: 'category', operator: '==', value: category });
  }

  // Note: We avoid adding location.city, pricing.baseRate, and rules.maxGuests to Firestore query
  // because they would require complex composite indexes. Instead, we'll filter client-side.

  // Get all published listings (or filtered by category if provided)
  // Don't use orderBy to avoid index issues - we'll sort client-side
  let listings = await firestoreService.getDocuments(
    COLLECTION_NAME,
    filters,
    null, // No orderBy to avoid index requirement
    'asc',
    100 // Get more results for client-side filtering
  );

  // Client-side filtering for all other filters
  if (location) {
    const locationLower = location.toLowerCase();
    listings = listings.filter(listing =>
      listing.location?.city?.toLowerCase().includes(locationLower) ||
      listing.location?.country?.toLowerCase().includes(locationLower)
    );
  }

  if (minPrice) {
    listings = listings.filter(listing =>
      (listing.pricing?.baseRate || 0) >= minPrice
    );
  }

  if (maxPrice) {
    listings = listings.filter(listing =>
      (listing.pricing?.baseRate || 0) <= maxPrice
    );
  }

  if (guests) {
    const guestCount = parseInt(guests);
    listings = listings.filter(listing =>
      (listing.rules?.maxGuests || 0) >= guestCount
    );
  }

  // Client-side filtering for text search
  if (searchQuery) {
    const queryLower = searchQuery.toLowerCase();
    listings = listings.filter(listing =>
      listing.title?.toLowerCase().includes(queryLower) ||
      listing.description?.toLowerCase().includes(queryLower) ||
      listing.location?.city?.toLowerCase().includes(queryLower)
    );
  }

  if (amenities.length > 0) {
    listings = listings.filter(listing =>
      amenities.every(amenity => listing.amenities?.includes(amenity))
    );
  }

  // Sort by createdAt descending (newest first) - client-side
  listings.sort((a, b) => {
    const aDate = a.createdAt ? (a.createdAt.toDate ? a.createdAt.toDate() : new Date(a.createdAt)) : new Date(0);
    const bDate = b.createdAt ? (b.createdAt.toDate ? b.createdAt.toDate() : new Date(b.createdAt)) : new Date(0);
    return bDate - aDate;
  });

  return listings;
};

/**
 * Subscribe to published listings with real-time updates
 * @param {Object} filters - Filter options (category, location, minPrice, maxPrice, etc.)
 * @param {Function} callback - Callback function that receives (listings, error)
 * @returns {Function} Unsubscribe function
 */
export const subscribeToPublishedListings = (filters = {}, callback) => {
  const {
    category,
    location,
    minPrice,
    maxPrice,
    guests,
    limitCount = 100 // Increased limit to allow more client-side filtering
  } = filters;

  // Build Firestore query filters - use only indexed fields to avoid composite index issues
  // Start with just status filter (this has an index)
  const queryFilters = [
    { field: 'status', operator: '==', value: LISTING_STATUS.PUBLISHED }
  ];

  // Only add category if provided (has composite index with status + createdAt)
  if (category) {
    queryFilters.push({ field: 'category', operator: '==', value: category });
  }

  // Note: We avoid adding location.city, pricing.baseRate, and rules.maxGuests to Firestore query
  // because they would require complex composite indexes. Instead, we'll filter client-side.

  // Subscribe with real-time listener
  // Note: We don't use orderBy in the query to avoid index requirements
  // We'll sort client-side instead
  const unsubscribe = firestoreService.subscribeToDocuments(
    'listings',
    queryFilters,
    null, // No orderBy to avoid index requirement
    'asc',
    limitCount,
    (documents, error) => {
      if (error) {
        console.error('Firestore query error:', error);
        // If it's an index error, provide helpful message
        if (error.code === 'failed-precondition' || error.message?.includes('index')) {
          console.warn('Firestore index may be missing. Please deploy indexes: firebase deploy --only firestore:indexes');
        }
        callback([], error);
        return;
      }

      // Convert Firestore timestamps to dates
      const listings = documents.map(doc => {
        const listing = { ...doc };
        // Convert Firestore Timestamp to JavaScript Date
        if (listing.createdAt) {
          if (listing.createdAt.toDate && typeof listing.createdAt.toDate === 'function') {
            listing.createdAt = listing.createdAt.toDate();
          } else if (listing.createdAt.seconds) {
            // Handle Timestamp object
            listing.createdAt = new Date(listing.createdAt.seconds * 1000);
          } else if (typeof listing.createdAt === 'number') {
            // Already a timestamp in milliseconds
            listing.createdAt = new Date(listing.createdAt);
          }
        } else {
          // Default to current date if createdAt is missing
          listing.createdAt = new Date();
        }
        if (listing.updatedAt) {
          if (listing.updatedAt.toDate && typeof listing.updatedAt.toDate === 'function') {
            listing.updatedAt = listing.updatedAt.toDate();
          } else if (listing.updatedAt.seconds) {
            listing.updatedAt = new Date(listing.updatedAt.seconds * 1000);
          } else if (typeof listing.updatedAt === 'number') {
            listing.updatedAt = new Date(listing.updatedAt);
          }
        }
        return listing;
      });

      // Apply client-side filtering for all other filters
      let filteredListings = listings;
      
      // Filter by location (client-side)
      if (location) {
        const locationLower = location.toLowerCase();
        filteredListings = filteredListings.filter(listing =>
          listing.location?.city?.toLowerCase().includes(locationLower) ||
          listing.location?.country?.toLowerCase().includes(locationLower)
        );
      }

      // Filter by price range (client-side)
      if (minPrice) {
        filteredListings = filteredListings.filter(listing =>
          (listing.pricing?.baseRate || 0) >= minPrice
        );
      }

      if (maxPrice) {
        filteredListings = filteredListings.filter(listing =>
          (listing.pricing?.baseRate || 0) <= maxPrice
        );
      }

      // Filter by guests (client-side)
      if (guests) {
        const guestCount = parseInt(guests);
        filteredListings = filteredListings.filter(listing =>
          (listing.rules?.maxGuests || 0) >= guestCount
        );
      }

      // Filter by text search (client-side)
      if (filters.query) {
        const queryLower = filters.query.toLowerCase();
        filteredListings = filteredListings.filter(listing =>
          listing.title?.toLowerCase().includes(queryLower) ||
          listing.description?.toLowerCase().includes(queryLower) ||
          listing.location?.city?.toLowerCase().includes(queryLower)
        );
      }

      // Filter by amenities (client-side)
      if (filters.amenities && filters.amenities.length > 0) {
        filteredListings = filteredListings.filter(listing =>
          filters.amenities.every(amenity => listing.amenities?.includes(amenity))
        );
      }

      // Sort by createdAt descending (newest first) - client-side
      filteredListings.sort((a, b) => {
        const aDate = a.createdAt ? (a.createdAt.toDate ? a.createdAt.toDate() : new Date(a.createdAt)) : new Date(0);
        const bDate = b.createdAt ? (b.createdAt.toDate ? b.createdAt.toDate() : new Date(b.createdAt)) : new Date(0);
        return bDate - aDate; // Descending order (newest first)
      });

      callback(filteredListings, null);
    }
  );

  return unsubscribe;
};

export { calculateListingPrice };



