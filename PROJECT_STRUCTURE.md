# Guestify OPMS - Project Structure

## Folder Structure

```
my-react-app/
├── public/
│   ├── index.html
│   ├── favicon.ico
│   └── manifest.json
│
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── common/          # Common components (Button, Input, Card, etc.)
│   │   ├── layout/          # Layout components (Header, Footer, Sidebar, etc.)
│   │   ├── forms/           # Form components
│   │   └── modals/          # Modal components
│   │
│   ├── pages/               # Page components
│   │   ├── auth/            # Authentication pages (Login, Register)
│   │   ├── host/            # Host-specific pages
│   │   │   ├── Dashboard.js
│   │   │   ├── Listings/
│   │   │   ├── Calendar/
│   │   │   ├── Messages/
│   │   │   └── Settings/
│   │   ├── guest/           # Guest-specific pages
│   │   │   ├── Dashboard.js
│   │   │   ├── Bookings/
│   │   │   ├── Wishlist/
│   │   │   ├── Messages/
│   │   │   └── Settings/
│   │   ├── admin/           # Admin-specific pages
│   │   │   ├── Dashboard.js
│   │   │   ├── Analytics/
│   │   │   ├── Reports/
│   │   │   └── Policies/
│   │   ├── listing/         # Listing detail pages
│   │   └── search/          # Search and browse pages
│   │
│   ├── context/             # React Context providers
│   │   ├── AuthContext.js
│   │   ├── ThemeContext.js
│   │   └── AppContext.js
│   │
│   ├── hooks/               # Custom React hooks
│   │   ├── useAuth.js
│   │   ├── useFirestore.js
│   │   └── useStorage.js
│   │
│   ├── services/            # API and service functions
│   │   ├── authService.js
│   │   ├── listingService.js
│   │   ├── bookingService.js
│   │   ├── paymentService.js
│   │   └── storageService.js
│   │
│   ├── config/             # Configuration files
│   │   ├── firebase.js
│   │   └── constants.js
│   │
│   ├── utils/              # Utility functions
│   │   ├── helpers.js
│   │   ├── validators.js
│   │   └── formatters.js
│   │
│   ├── styles/             # Styling files
│   │   ├── global.css
│   │   ├── theme.js
│   │   └── components/     # Component-specific styles
│   │
│   ├── routes/             # Routing configuration
│   │   └── AppRouter.js
│   │
│   ├── __tests__/          # Test files
│   │   ├── components/
│   │   ├── services/
│   │   └── utils/
│   │
│   ├── App.js              # Main App component
│   ├── App.css
│   ├── index.js            # Entry point
│   └── index.css
│
├── .env                    # Environment variables (not in git)
├── .env.example            # Environment variables template
├── .gitignore
├── package.json
└── README.md
```

## Key Directories Explained

### `/src/components`
Reusable UI components that can be used across different pages:
- **common/**: Basic components like Button, Input, Card, Badge, etc.
- **layout/**: Layout components like Header, Footer, Navigation, Sidebar
- **forms/**: Form-specific components
- **modals/**: Modal and dialog components

### `/src/pages`
Page-level components organized by user role:
- **auth/**: Login, Register, Forgot Password
- **host/**: All host-related pages
- **guest/**: All guest-related pages
- **admin/**: All admin-related pages
- **listing/**: Listing detail and view pages
- **search/**: Search and browse functionality

### `/src/context`
React Context API for global state management:
- **AuthContext**: User authentication state
- **ThemeContext**: Theme and UI preferences
- **AppContext**: General app state

### `/src/services`
Business logic and API interactions:
- **authService.js**: Authentication operations
- **listingService.js**: Listing CRUD operations
- **bookingService.js**: Booking management
- **paymentService.js**: Payment processing
- **storageService.js**: File uploads to Firebase Storage

### `/src/config`
Configuration files:
- **firebase.js**: Firebase initialization
- **constants.js**: App-wide constants (routes, statuses, etc.)

### `/src/utils`
Helper functions and utilities:
- **helpers.js**: General utility functions
- **validators.js**: Form validation functions
- **formatters.js**: Data formatting functions

### `/src/styles`
Styling and design system:
- **global.css**: Global styles and resets
- **theme.js**: Design tokens (colors, typography, spacing)
- **components/**: Component-specific CSS modules

### `/src/__tests__`
Test files organized by category:
- Unit tests for components, services, and utilities
- Integration tests for features
- E2E tests (if applicable)






























