/**
 * Booking Model Tests
 */

import {
  createBookingDocument,
  validateBooking,
  calculateBookingNights,
  canCancelBooking
} from '../../models/bookingModel';
import { BOOKING_STATUS } from '../../config/constants';

describe('Booking Model', () => {
  describe('createBookingDocument', () => {
    test('creates booking document with required fields', () => {
      const bookingData = {
        listingId: 'listing123',
        hostId: 'host123',
        guestId: 'guest123',
        checkIn: new Date('2024-01-01'),
        checkOut: new Date('2024-01-05'),
        guests: 2,
        pricing: {
          total: 400
        }
      };

      const booking = createBookingDocument(bookingData);
      
      expect(booking.listingId).toBe('listing123');
      expect(booking.guestId).toBe('guest123');
      expect(booking.guests).toBe(2);
      expect(booking.status).toBe(BOOKING_STATUS.PENDING);
    });
  });

  describe('validateBooking', () => {
    test('validates correct booking data', () => {
      const bookingData = {
        listingId: 'listing123',
        guestId: 'guest123',
        checkIn: new Date('2024-06-01'),
        checkOut: new Date('2024-06-05'),
        guests: 2,
        pricing: { total: 400 }
      };

      const validation = validateBooking(bookingData);
      expect(validation.valid).toBe(true);
    });

    test('rejects booking without listing ID', () => {
      const bookingData = {
        guestId: 'guest123',
        checkIn: new Date('2024-06-01'),
        checkOut: new Date('2024-06-05'),
        guests: 2
      };

      const validation = validateBooking(bookingData);
      expect(validation.valid).toBe(false);
    });

    test('rejects booking with invalid dates', () => {
      const bookingData = {
        listingId: 'listing123',
        guestId: 'guest123',
        checkIn: new Date('2024-06-05'),
        checkOut: new Date('2024-06-01'),
        guests: 2,
        pricing: { total: 400 }
      };

      const validation = validateBooking(bookingData);
      expect(validation.valid).toBe(false);
    });
  });

  describe('calculateBookingNights', () => {
    test('calculates nights correctly', () => {
      const checkIn = new Date('2024-01-01');
      const checkOut = new Date('2024-01-05');
      expect(calculateBookingNights(checkIn, checkOut)).toBe(4);
    });
  });

  describe('canCancelBooking', () => {
    test('allows cancellation with flexible policy', () => {
      const booking = {
        status: BOOKING_STATUS.CONFIRMED,
        checkIn: new Date(Date.now() + 24 * 60 * 60 * 1000) // Tomorrow
      };
      expect(canCancelBooking(booking, 'flexible')).toBe(true);
    });

    test('prevents cancellation with strict policy if too late', () => {
      const booking = {
        status: BOOKING_STATUS.CONFIRMED,
        checkIn: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000) // 5 days
      };
      expect(canCancelBooking(booking, 'strict')).toBe(false);
    });
  });
});





