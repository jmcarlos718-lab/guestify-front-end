/**
 * Helper Functions Tests
 */

import {
  formatCurrency,
  formatDate,
  calculateNights,
  validateEmail,
  validatePhone,
  copyToClipboard
} from '../../utils/helpers';

describe('Helper Functions', () => {
  describe('formatCurrency', () => {
    test('formats PHP currency correctly', () => {
      expect(formatCurrency(100)).toBe('₱100.00');
      expect(formatCurrency(1000)).toBe('₱1,000.00');
      expect(formatCurrency(99.99)).toBe('₱99.99');
    });

    test('formats different currencies', () => {
      expect(formatCurrency(100, 'EUR')).toContain('100');
      expect(formatCurrency(100, 'GBP')).toContain('100');
    });
  });

  describe('formatDate', () => {
    test('formats date correctly', () => {
      const date = new Date('2024-01-15');
      const formatted = formatDate(date);
      expect(formatted).toBeTruthy();
      expect(typeof formatted).toBe('string');
    });

    test('handles null/undefined', () => {
      expect(formatDate(null)).toBe('');
      expect(formatDate(undefined)).toBe('');
    });
  });

  describe('calculateNights', () => {
    test('calculates nights correctly', () => {
      const checkIn = new Date('2024-01-01');
      const checkOut = new Date('2024-01-05');
      expect(calculateNights(checkIn, checkOut)).toBe(4);
    });

    test('handles same day', () => {
      const date = new Date('2024-01-01');
      expect(calculateNights(date, date)).toBe(0);
    });
  });

  describe('validateEmail', () => {
    test('validates correct email addresses', () => {
      expect(validateEmail('test@example.com')).toBe(true);
      expect(validateEmail('user.name@domain.co.uk')).toBe(true);
    });

    test('rejects invalid email addresses', () => {
      expect(validateEmail('invalid')).toBe(false);
      expect(validateEmail('@example.com')).toBe(false);
      expect(validateEmail('test@')).toBe(false);
    });
  });

  describe('validatePhone', () => {
    test('validates correct phone numbers', () => {
      expect(validatePhone('+1234567890')).toBe(true);
      expect(validatePhone('(123) 456-7890')).toBe(true);
    });

    test('rejects invalid phone numbers', () => {
      expect(validatePhone('123')).toBe(false);
      expect(validatePhone('abc')).toBe(false);
    });
  });
});





