/**
 * Listing Model
 * 
 * Data model and validation for listing documents
 */

import { LISTING_CATEGORIES, LISTING_STATUS } from '../config/constants';

/**
 * Create a new listing document
 * @param {Object} listingData - Listing data
 * @returns {Object} Listing document
 */
export const createListingDocument = (listingData) => {
  const {
    hostId,
    title,
    description,
    category,
    type,
    location = {},
    pricing = {},
    images = [],
    amenities = [],
    availability = {},
    rules = {},
    status = LISTING_STATUS.DRAFT,
    createdAt = new Date(),
    updatedAt = new Date()
  } = listingData;

  return {
    hostId,
    title,
    description,
    category, // home, experience, service
    type, // e.g., "apartment", "cooking class", "photography service"
    location: {
      address: location.address || '',
      city: location.city || '',
      state: location.state || '',
      country: location.country || '',
      zipCode: location.zipCode || '',
      coordinates: location.coordinates || null, // { lat, lng }
      neighborhood: location.neighborhood || ''
    },
    pricing: {
      baseRate: pricing.baseRate || 0,
      currency: pricing.currency || 'PHP',
      discount: pricing.discount || 0, // percentage
      promoCode: pricing.promoCode || null,
      cleaningFee: pricing.cleaningFee || 0,
      serviceFee: pricing.serviceFee || 0,
      taxes: pricing.taxes || 0,
      minimumStay: pricing.minimumStay || 1, // nights/days
      maximumStay: pricing.maximumStay || null
    },
    images,
    amenities,
    availability: {
      calendar: availability.calendar || {}, // dates and availability
      instantBook: availability.instantBook !== undefined ? availability.instantBook : false,
      checkInTime: availability.checkInTime || '15:00',
      checkOutTime: availability.checkOutTime || '11:00',
      cancellationPolicy: availability.cancellationPolicy || 'moderate' // flexible, moderate, strict
    },
    rules: {
      houseRules: rules.houseRules || [],
      petFriendly: rules.petFriendly !== undefined ? rules.petFriendly : false,
      smokingAllowed: rules.smokingAllowed !== undefined ? rules.smokingAllowed : false,
      partiesAllowed: rules.partiesAllowed !== undefined ? rules.partiesAllowed : false,
      maxGuests: rules.maxGuests || 1,
      ageRestriction: rules.ageRestriction || null
    },
    status,
    isFeatured: false,
    views: 0,
    favoritesCount: 0,
    rating: 0,
    reviewCount: 0,
    createdAt,
    updatedAt
  };
};

/**
 * Validate listing data
 * @param {Object} listingData - Listing data to validate
 * @returns {Object} { valid: boolean, errors: Array }
 */
export const validateListing = (listingData) => {
  const errors = [];

  if (!listingData.title || listingData.title.trim().length < 5) {
    errors.push('Title must be at least 5 characters');
  }

  if (!listingData.description || listingData.description.trim().length < 20) {
    errors.push('Description must be at least 20 characters');
  }

  if (!Object.values(LISTING_CATEGORIES).includes(listingData.category)) {
    errors.push('Invalid listing category');
  }

  if (!listingData.location?.city) {
    errors.push('City is required');
  }

  if (!listingData.pricing?.baseRate || listingData.pricing.baseRate <= 0) {
    errors.push('Base rate must be greater than 0');
  }

  if (!listingData.images || listingData.images.length === 0) {
    errors.push('At least one image is required');
  }

  return {
    valid: errors.length === 0,
    errors
  };
};

/**
 * Calculate total price for a booking
 * Simple calculation: price * number of guests
 * @param {Object} listing - Listing document
 * @param {Date} checkIn - Check-in date
 * @param {Date} checkOut - Check-out date
 * @param {number} guests - Number of guests
 * @returns {Object} Pricing breakdown
 */
export const calculateListingPrice = (listing, checkIn, checkOut, guests = 1) => {
  const baseRate = listing.pricing.baseRate || 0;
  const nights = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));
  
  // Simple calculation: price * number of guests
  const total = baseRate * guests;

  return {
    nights,
    baseRate,
    subtotal: total,
    discount: 0,
    discountAmount: 0,
    discountedSubtotal: total,
    cleaningFee: 0,
    serviceFee: 0,
    total,
    currency: listing.pricing.currency || 'PHP'
  };
};













