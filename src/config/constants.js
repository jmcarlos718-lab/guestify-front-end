// Application Constants

export const USER_ROLES = {
  GUEST: 'guest',
  HOST: 'host',
  ADMIN: 'admin'
};

export const LISTING_CATEGORIES = {
  HOME: 'home',
  EXPERIENCE: 'experience',
  SERVICE: 'service',
  APARTMENT: 'apartment',
  HOTEL: 'hotel',
  RESORT: 'resort',
  ROOM: 'room'
};

export const LISTING_STATUS = {
  DRAFT: 'draft',
  PUBLISHED: 'published',
  ARCHIVED: 'archived'
};

export const BOOKING_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  CANCELLED: 'cancelled',
  COMPLETED: 'completed'
};

export const PAYMENT_STATUS = {
  PENDING: 'pending',
  COMPLETED: 'completed',
  FAILED: 'failed',
  REFUNDED: 'refunded'
};

export const ROUTES = {
  HOME: '/',
  // Friendly marketing aliases
  OFFERS: '/offers',
  WISHLIST: '/wishlist',
  ABOUT: '/about',
  CONTACT: '/contact',
  LOGIN: '/login',
  REGISTER: '/register',
  FORGOT_PASSWORD: '/forgot-password',
  VERIFY_EMAIL: '/verify-email',
  ABOUT_US: '/about-us',
  BOOKING: '/booking',
  BEST_OFFERS: '/best-offers',
  PROMOS: '/promos',
  CONTACT_US: '/contact-us',
  TERMS: '/terms',
  HOST_DASHBOARD: '/host/dashboard',
  HOST_LISTINGS: '/host/listings',
  HOST_BOOKINGS: '/host/bookings',
  HOST_CALENDAR: '/host/calendar',
  HOST_MESSAGES: '/host/messages',
  HOST_SETTINGS: '/host/settings',
  GUEST_DASHBOARD: '/guest/dashboard',
  GUEST_BOOKINGS: '/guest/bookings',
  GUEST_WISHLIST: '/guest/wishlist',
  GUEST_MESSAGES: '/guest/messages',
  GUEST_SETTINGS: '/guest/settings',
  GUEST_PROFILE: '/guest/profile',
  ADMIN_DASHBOARD: '/admin/dashboard',
  ADMIN_LOGIN: '/admin/login',
  ADMIN_ANALYTICS: '/admin/analytics',
  ADMIN_REPORTS: '/admin/reports',
  ADMIN_POLICIES: '/admin/policies',
  ADMIN_SETTINGS: '/admin/settings',
  LISTING_DETAIL: '/listing/:id',
  SEARCH: '/search'
};

export const SOCIAL_SHARE_PLATFORMS = {
  FACEBOOK: 'facebook',
  TWITTER: 'twitter',
  INSTAGRAM: 'instagram',
  LINKEDIN: 'linkedin',
  WHATSAPP: 'whatsapp'
};

export const SUBSCRIPTION_TIERS = {
  BASIC: 'basic',
  STANDARD: 'standard',
  PREMIUM: 'premium'
};

export const SUBSCRIPTION_LIMITS = {
  [SUBSCRIPTION_TIERS.BASIC]: 1,
  [SUBSCRIPTION_TIERS.STANDARD]: 5,
  [SUBSCRIPTION_TIERS.PREMIUM]: Infinity
};

