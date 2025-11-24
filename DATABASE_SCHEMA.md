# Database Schema Documentation

## Overview

This document describes the Firestore database schema for the Guestify OPMS platform.

## Collections

### 1. users

Stores user account information and profiles.

**Document Structure:**
```javascript
{
  uid: string,                    // Firebase Auth UID
  email: string,                  // User email
  displayName: string,            // User's display name
  role: string,                    // 'guest', 'host', or 'admin'
  photoURL: string,               // Profile photo URL
  phone: string,                  // Phone number
  bio: string,                    // User biography
  address: {
    street: string,
    city: string,
    state: string,
    country: string,
    zipCode: string,
    coordinates: { lat: number, lng: number } | null
  },
  preferences: {
    language: string,             // Default: 'en'
    currency: string,             // Default: 'PHP'
    notifications: boolean,
    emailNotifications: boolean
  },
  points: number,                 // Loyalty points
  isVerified: boolean,
  isActive: boolean,
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

**Indexes:**
- `role` (ascending)
- `email` (ascending)
- `createdAt` (descending)

---

### 2. listings

Stores property/experience/service listings.

**Document Structure:**
```javascript
{
  hostId: string,                 // User ID of the host
  title: string,                  // Listing title
  description: string,            // Detailed description
  category: string,               // 'home', 'experience', 'service'
  type: string,                   // e.g., 'apartment', 'cooking class'
  location: {
    address: string,
    city: string,
    state: string,
    country: string,
    zipCode: string,
    coordinates: { lat: number, lng: number } | null,
    neighborhood: string
  },
  pricing: {
    baseRate: number,             // Base price per night/day
    currency: string,              // Default: 'PHP'
    discount: number,              // Percentage discount
    promoCode: string | null,
    cleaningFee: number,
    serviceFee: number,            // Platform service fee percentage
    taxes: number,
    minimumStay: number,          // Minimum nights/days
    maximumStay: number | null
  },
  images: string[],               // Array of image URLs
  amenities: string[],             // Array of amenity names
  availability: {
    calendar: object,             // Date availability object
    instantBook: boolean,
    checkInTime: string,         // Default: '15:00'
    checkOutTime: string,         // Default: '11:00'
    cancellationPolicy: string    // 'flexible', 'moderate', 'strict'
  },
  rules: {
    houseRules: string[],
    petFriendly: boolean,
    smokingAllowed: boolean,
    partiesAllowed: boolean,
    maxGuests: number,
    ageRestriction: number | null
  },
  status: string,                  // 'draft', 'published', 'archived'
  isFeatured: boolean,
  views: number,
  favoritesCount: number,
  rating: number,                 // Average rating (0-5)
  reviewCount: number,
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

**Indexes:**
- `status` + `category` + `createdAt`
- `status` + `location.city` + `pricing.baseRate`
- `hostId` + `status` + `createdAt`

---

### 3. bookings

Stores booking/reservation information.

**Document Structure:**
```javascript
{
  listingId: string,              // Reference to listing
  hostId: string,                 // Host user ID
  guestId: string,                // Guest user ID
  checkIn: Timestamp,              // Check-in date/time
  checkOut: Timestamp,            // Check-out date/time
  guests: number,                  // Number of guests
  pricing: {
    baseRate: number,
    nights: number,
    subtotal: number,
    discount: number,
    discountAmount: number,
    cleaningFee: number,
    serviceFee: number,
    total: number,
    currency: string
  },
  specialRequests: string,
  status: string,                  // 'pending', 'confirmed', 'cancelled', 'completed'
  paymentStatus: string,           // 'pending', 'completed', 'failed', 'refunded'
  paymentMethod: string | null,    // Payment method used
  paymentId: string | null,        // Reference to payment document
  cancellationReason: string | null,
  cancelledAt: Timestamp | null,
  reviewId: string | null,         // Reference to review if reviewed
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

**Indexes:**
- `guestId` + `status` + `createdAt`
- `hostId` + `status` + `createdAt`
- `listingId` + `checkIn` + `checkOut`

---

### 4. reviews

Stores user reviews and ratings.

**Document Structure:**
```javascript
{
  bookingId: string,               // Reference to booking
  listingId: string,               // Reference to listing
  hostId: string,                 // Host user ID
  guestId: string,                // Guest user ID (reviewer)
  rating: number,                 // Overall rating (1-5)
  comment: string,                // Review text
  categories: {
    cleanliness: number,           // 1-5
    communication: number,        // 1-5
    checkIn: number,              // 1-5
    accuracy: number,             // 1-5
    location: number,             // 1-5
    value: number                 // 1-5
  },
  isPublic: boolean,
  hostResponse: string | null,     // Host's response to review
  hostResponseAt: Timestamp | null,
  helpfulCount: number,            // Number of helpful votes
  reported: boolean,               // If review was reported
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

**Indexes:**
- `listingId` + `isPublic` + `createdAt`
- `guestId` + `createdAt`
- `hostId` + `createdAt`

---

### 5. messages

Stores messages between users.

**Document Structure:**
```javascript
{
  conversationId: string,          // Unique conversation ID
  senderId: string,                // Sender user ID
  receiverId: string,              // Receiver user ID
  content: string,                 // Message content
  type: string,                    // 'text', 'image', 'file', 'system'
  attachments: string[],           // Array of attachment URLs
  isRead: boolean,
  readAt: Timestamp | null,
  deletedBy: string[],             // Array of user IDs who deleted
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

**Indexes:**
- `conversationId` + `createdAt`
- `senderId` + `createdAt`
- `receiverId` + `createdAt`

---

### 6. payments

Stores payment transaction information.

**Document Structure:**
```javascript
{
  bookingId: string,              // Reference to booking
  userId: string,                  // Payer user ID
  hostId: string,                  // Host user ID (recipient)
  amount: number,                  // Payment amount
  currency: string,                // Default: 'PHP'
  paymentMethod: string,           // 'credit_card', 'debit_card', 'e_wallet', 'bank_transfer'
  status: string,                  // 'pending', 'completed', 'failed', 'refunded'
  transactionId: string | null,   // External transaction ID
  metadata: {
    cardLast4: string | null,
    cardBrand: string | null,
    walletType: string | null,
    bankName: string | null
  },
  refundAmount: number,            // Refund amount if applicable
  refundReason: string | null,
  refundedAt: Timestamp | null,
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

**Indexes:**
- `userId` + `status` + `createdAt`
- `hostId` + `status` + `createdAt`
- `bookingId` + `createdAt`

---

### 7. favorites

Stores user favorites/wishlist items.

**Document Structure:**
```javascript
{
  userId: string,                  // User ID
  listingId: string,                // Listing ID
  createdAt: Timestamp
}
```

**Indexes:**
- `userId` + `createdAt`

---

### 8. coupons

Stores discount coupons and promo codes.

**Document Structure:**
```javascript
{
  code: string,                    // Coupon code
  type: string,                    // 'percentage' or 'fixed'
  value: number,                   // Discount value
  minPurchase: number,             // Minimum purchase amount
  maxDiscount: number | null,      // Maximum discount amount
  validFrom: Timestamp,
  validUntil: Timestamp,
  usageLimit: number | null,       // Total usage limit
  usageCount: number,               // Current usage count
  active: boolean,
  applicableCategories: string[],    // Categories this coupon applies to
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

---

### 9. points

Stores user loyalty points.

**Document Structure:**
```javascript
{
  userId: string,                  // User ID (document ID)
  totalPoints: number,              // Total points
  transactions: [                  // Array of point transactions
    {
      type: string,                // 'earned', 'redeemed', 'expired'
      amount: number,
      description: string,
      bookingId: string | null,     // Related booking if applicable
      createdAt: Timestamp
    }
  ],
  updatedAt: Timestamp
}
```

---

### 10. admin

Stores admin-only data.

**Document Structure:**
```javascript
{
  // Various admin documents
  // Structure depends on document type
}
```

---

### 11. policies

Stores platform policies and rules.

**Document Structure:**
```javascript
{
  type: string,                    // 'cancellation', 'refund', 'terms', etc.
  title: string,
  content: string,                  // Policy content
  version: number,
  active: boolean,
  effectiveDate: Timestamp,
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

---

### 12. reports

Stores user reports and complaints.

**Document Structure:**
```javascript
{
  reporterId: string,              // User who reported
  reportedType: string,            // 'listing', 'user', 'review', 'message'
  reportedId: string,              // ID of reported item
  reason: string,                  // Report reason
  description: string,             // Additional details
  status: string,                  // 'pending', 'reviewed', 'resolved', 'dismissed'
  adminNotes: string | null,
  resolvedAt: Timestamp | null,
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

---

## Relationships

### User → Listings
- One-to-many: A user (host) can have multiple listings
- Query: `listings` where `hostId == userId`

### Listing → Bookings
- One-to-many: A listing can have multiple bookings
- Query: `bookings` where `listingId == listingId`

### Booking → Review
- One-to-one: A booking can have one review
- Query: `reviews` where `bookingId == bookingId`

### User → Messages
- Many-to-many: Users can send/receive multiple messages
- Query: `messages` where `senderId == userId` OR `receiverId == userId`

### Booking → Payment
- One-to-one: A booking has one payment
- Query: `payments` where `bookingId == bookingId`

## Data Validation

All models include validation functions:
- `validateUser()` - Validates user data
- `validateListing()` - Validates listing data
- `validateBooking()` - Validates booking data
- `validateReview()` - Validates review data
- `validateMessage()` - Validates message data
- `validatePayment()` - Validates payment data

## Indexes

See `firestore.indexes.json` for complete index configuration.

To deploy indexes:
```bash
firebase deploy --only firestore:indexes
```

## Security Rules

See `firestore.rules` for complete security rules configuration.

To deploy rules:
```bash
firebase deploy --only firestore:rules
```













