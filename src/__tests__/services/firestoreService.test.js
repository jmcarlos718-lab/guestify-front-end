/**
 * Firestore Service Tests
 */

import * as firestoreService from '../../services/firestoreService';

// Mock Firebase
jest.mock('../../config/firebase', () => ({
  db: {}
}));

describe('Firestore Service', () => {
  // Mock Firestore functions
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('timestampToDate converts Firestore timestamp to Date', () => {
    const mockTimestamp = {
      toDate: () => new Date('2024-01-01')
    };
    const date = firestoreService.timestampToDate(mockTimestamp);
    expect(date).toBeInstanceOf(Date);
  });

  test('timestampToDate handles null', () => {
    expect(firestoreService.timestampToDate(null)).toBeNull();
  });

  test('dateToTimestamp converts Date to Firestore timestamp', () => {
    const date = new Date('2024-01-01');
    const timestamp = firestoreService.dateToTimestamp(date);
    expect(timestamp).toBeDefined();
  });
});





