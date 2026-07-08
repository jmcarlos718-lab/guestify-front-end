// Utility Helper Functions

/**
 * Format currency
 */
export const formatCurrency = (amount, currency = 'PHP') => {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: currency
  }).format(amount);
};

/**
 * Format a Date as YYYY-MM-DD in local timezone (avoids UTC off-by-one bugs)
 */
export const toLocalDateString = (date) => {
  const d = parseDateValue(date);
  if (!d) return '';
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

export const parseDateValue = (value) => {
  if (!value) return null;
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  // Firestore Timestamp support
  if (typeof value?.toDate === 'function') {
    const converted = value.toDate();
    return Number.isNaN(converted.getTime()) ? null : converted;
  }

  // Firestore-like { seconds, nanoseconds } object
  if (typeof value?.seconds === 'number') {
    const converted = new Date(value.seconds * 1000);
    return Number.isNaN(converted.getTime()) ? null : converted;
  }

  // Some serialized Firestore values use underscored fields
  if (typeof value?._seconds === 'number') {
    const converted = new Date(value._seconds * 1000);
    return Number.isNaN(converted.getTime()) ? null : converted;
  }

  // Some app flows may store a nested date payload
  if (value?.dateValue) {
    return parseDateValue(value.dateValue);
  }

  if (typeof value === 'string') {
    // Normalize YYYY-MM-DD values in local time to avoid parser inconsistencies
    const localDateMatch = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (localDateMatch) {
      const [, year, month, day] = localDateMatch;
      const converted = new Date(
        Number(year),
        Number(month) - 1,
        Number(day),
        12,
        0,
        0,
        0
      );
      return Number.isNaN(converted.getTime()) ? null : converted;
    }
  }

  const converted = new Date(value);
  return Number.isNaN(converted.getTime()) ? null : converted;
};

/**
 * Format date
 */
export const formatDate = (date, format = 'MMM dd, yyyy') => {
  if (!date) return '';
  const d = parseDateValue(date);
  if (!d) return 'Invalid date';
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

/**
 * Format date and time
 */
export const formatDateTime = (date) => {
  if (!date) return '';
  const d = parseDateValue(date);
  if (!d) return 'Invalid date';
  return d.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
};

/**
 * Calculate number of nights between two dates
 */
export const calculateNights = (checkIn, checkOut) => {
  const checkInDate = parseDateValue(checkIn);
  const checkOutDate = parseDateValue(checkOut);
  if (!checkInDate || !checkOutDate) return 0;
  const diffTime = Math.abs(checkOutDate - checkInDate);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

/**
 * Generate unique ID
 */
export const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

/**
 * Validate email
 */
export const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

/**
 * Validate phone number (basic validation)
 */
export const validatePhone = (phone) => {
  const re = /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/;
  return re.test(phone);
};

/**
 * Copy text to clipboard
 */
export const copyToClipboard = async (text) => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    console.error('Failed to copy text: ', err);
    return false;
  }
};

/**
 * Debounce function
 */
export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};













