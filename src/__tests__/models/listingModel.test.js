/**
 * Listing Model Tests
 */

import {
  createListingDocument,
  validateListing,
  calculateListingPrice
} from '../../models/listingModel';
import { LISTING_CATEGORIES, LISTING_STATUS } from '../../config/constants';

describe('Listing Model', () => {
  describe('createListingDocument', () => {
    test('creates listing document with required fields', () => {
      const listingData = {
        hostId: 'host123',
        title: 'Test Listing',
        description: 'This is a test listing description',
        category: LISTING_CATEGORIES.HOME,
        type: 'Apartment'
      };

      const listing = createListingDocument(listingData);
      
      expect(listing.hostId).toBe('host123');
      expect(listing.title).toBe('Test Listing');
      expect(listing.category).toBe(LISTING_CATEGORIES.HOME);
      expect(listing.status).toBe(LISTING_STATUS.DRAFT);
      expect(listing.pricing).toBeDefined();
      expect(listing.location).toBeDefined();
    });

    test('sets default values for optional fields', () => {
      const listingData = {
        hostId: 'host123',
        title: 'Test',
        description: 'Test description',
        category: LISTING_CATEGORIES.HOME
      };

      const listing = createListingDocument(listingData);
      
      expect(listing.pricing.baseRate).toBe(0);
      expect(listing.pricing.currency).toBe('PHP');
      expect(listing.images).toEqual([]);
      expect(listing.amenities).toEqual([]);
    });
  });

  describe('validateListing', () => {
    test('validates correct listing data', () => {
      const listingData = {
        title: 'Beautiful Apartment',
        description: 'This is a detailed description of the listing',
        category: LISTING_CATEGORIES.HOME,
        location: { city: 'New York' },
        pricing: { baseRate: 100 },
        images: ['image1.jpg']
      };

      const validation = validateListing(listingData);
      expect(validation.valid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    test('rejects listing with short title', () => {
      const listingData = {
        title: 'Test',
        description: 'Valid description',
        category: LISTING_CATEGORIES.HOME
      };

      const validation = validateListing(listingData);
      expect(validation.valid).toBe(false);
      expect(validation.errors.length).toBeGreaterThan(0);
    });

    test('rejects listing without images', () => {
      const listingData = {
        title: 'Valid Title',
        description: 'Valid description',
        category: LISTING_CATEGORIES.HOME,
        images: []
      };

      const validation = validateListing(listingData);
      expect(validation.valid).toBe(false);
    });
  });

  describe('calculateListingPrice', () => {
    test('calculates price correctly', () => {
      const listing = {
        pricing: {
          baseRate: 100,
          discount: 10,
          cleaningFee: 50,
          serviceFee: 5,
          currency: 'PHP'
        }
      };

      const checkIn = new Date('2024-01-01');
      const checkOut = new Date('2024-01-05');
      const guests = 2;

      const pricing = calculateListingPrice(listing, checkIn, checkOut, guests);
      
      expect(pricing.nights).toBe(4);
      expect(pricing.baseRate).toBe(100);
      expect(pricing.subtotal).toBe(400);
      expect(pricing.discount).toBe(10);
      expect(pricing.total).toBeGreaterThan(0);
    });
  });
});





