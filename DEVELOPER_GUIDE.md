# Guestify OPMS - Developer Guide

## Table of Contents
1. [Project Overview](#project-overview)
2. [Getting Started](#getting-started)
3. [Project Structure](#project-structure)
4. [Technology Stack](#technology-stack)
5. [Development Workflow](#development-workflow)
6. [API Documentation](#api-documentation)
7. [Database Schema](#database-schema)
8. [Component Library](#component-library)
9. [Testing](#testing)
10. [Deployment](#deployment)

## Project Overview

Guestify is an Online Platform Management System (OPMS) built with React and Firebase. It supports three user roles: Guests, Hosts, and Administrators.

### Key Features
- User authentication (Email/Password, SMS ready)
- Listing management (Home, Experience, Service)
- Booking system
- Payment processing
- Messaging system
- Analytics and reporting
- Policy management

## Getting Started

### Prerequisites
- Node.js 16+ and npm
- Firebase account
- Git

### Installation

```bash
# Clone repository
git clone <repository-url>
cd my-react-app

# Install dependencies
npm install --legacy-peer-deps

# Set up environment variables
cp .env.example .env
# Edit .env with your Firebase credentials

# Start development server
npm start
```

### Firebase Setup

1. Create Firebase project at [Firebase Console](https://console.firebase.google.com/)
2. Enable Authentication (Email/Password)
3. Create Firestore Database
4. Enable Storage
5. Copy config to `.env` file
6. Deploy security rules (see `firestore.rules` and `storage.rules`)

## Project Structure

```
my-react-app/
├── public/                 # Static files
├── src/
│   ├── components/         # Reusable components
│   │   ├── common/        # Common UI components
│   │   ├── layout/        # Layout components
│   │   ├── payment/       # Payment components
│   │   └── routes/        # Route components
│   ├── config/            # Configuration files
│   ├── context/           # React Context providers
│   ├── hooks/             # Custom React hooks
│   ├── models/            # Data models
│   ├── pages/             # Page components
│   │   ├── admin/         # Admin pages
│   │   ├── auth/          # Authentication pages
│   │   ├── guest/         # Guest pages
│   │   └── host/          # Host pages
│   ├── routes/            # Routing configuration
│   ├── services/          # API and service functions
│   ├── styles/            # Global styles and theme
│   ├── utils/             # Utility functions
│   └── __tests__/         # Test files
├── firestore.rules        # Firestore security rules
├── firestore.indexes.json # Firestore indexes
└── storage.rules          # Storage security rules
```

## Technology Stack

### Frontend
- **React 19.2.0** - UI library
- **React Router 6.26.2** - Routing
- **Firebase 10.13.2** - Backend services
- **React Toastify** - Notifications
- **React Icons** - Icon library

### Backend
- **Firebase Authentication** - User auth
- **Cloud Firestore** - Database
- **Firebase Storage** - File storage
- **Firebase Analytics** - Analytics (optional)

### Development Tools
- **React Scripts** - Build tooling
- **Jest** - Testing framework
- **React Testing Library** - Component testing

## Development Workflow

### Running the App

```bash
# Development server
npm start

# Build for production
npm run build

# Run tests
npm test

# Run tests with coverage
npm test -- --coverage --watchAll=false
```

### Code Style
- Use functional components with hooks
- Follow React best practices
- Use consistent naming conventions
- Add comments for complex logic

### Git Workflow
1. Create feature branch
2. Make changes
3. Write/update tests
4. Commit with descriptive messages
5. Push and create pull request

## API Documentation

### Authentication Service

```javascript
import * as authService from './services/authService';

// Register user
await authService.registerWithEmail(email, password, displayName);

// Sign in
await authService.signInWithEmail(email, password);

// Sign out
await authService.signOutUser();

// Reset password
await authService.resetPassword(email);
```

### Firestore Service

```javascript
import * as firestoreService from './services/firestoreService';

// Get document
const doc = await firestoreService.getDocument('collection', 'docId');

// Get documents with filters
const docs = await firestoreService.getDocuments(
  'collection',
  [{ field: 'status', operator: '==', value: 'published' }],
  'createdAt',
  'desc',
  10
);

// Create document
const id = await firestoreService.createDocument('collection', data);

// Update document
await firestoreService.updateDocument('collection', 'docId', updates);

// Delete document
await firestoreService.deleteDocument('collection', 'docId');
```

### Storage Service

```javascript
import * as storageService from './services/storageService';

// Upload file
const url = await storageService.uploadFile(file, 'path/', 'filename.jpg');

// Upload with progress
const url = await storageService.uploadFileWithProgress(
  file,
  'path/',
  null,
  (progress) => console.log(progress)
);

// Delete file
await storageService.deleteFile('path/filename.jpg');
```

## Database Schema

See [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md) for complete schema documentation.

### Key Collections
- `users` - User accounts
- `listings` - Property/experience listings
- `bookings` - Reservations
- `reviews` - User reviews
- `messages` - User messages
- `payments` - Payment transactions

## Component Library

### Common Components

#### Button
```javascript
<Button
  variant="primary" // primary, secondary, outline, ghost, danger
  size="md"         // sm, md, lg
  loading={false}
  disabled={false}
  fullWidth={false}
  onClick={handleClick}
>
  Click Me
</Button>
```

#### Input
```javascript
<Input
  label="Email"
  type="email"
  value={email}
  onChange={handleChange}
  error={errors.email}
  required
  fullWidth
/>
```

#### Card
```javascript
<Card
  title="Card Title"
  subtitle="Subtitle"
  footer={<Button>Action</Button>}
  hover
>
  Content
</Card>
```

## Testing

### Running Tests

```bash
# Run all tests
npm test

# Run with coverage
npm test -- --coverage --watchAll=false

# Run specific test file
npm test Button.test.js
```

### Test Structure

```
src/__tests__/
├── components/     # Component tests
├── services/       # Service tests
├── utils/          # Utility tests
└── models/         # Model tests
```

### Writing Tests

```javascript
import { render, screen, fireEvent } from '@testing-library/react';
import MyComponent from '../MyComponent';

describe('MyComponent', () => {
  test('renders correctly', () => {
    render(<MyComponent />);
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });
});
```

## Deployment

### Firebase Hosting

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login
firebase login

# Initialize (if not done)
firebase init hosting

# Build app
npm run build

# Deploy
firebase deploy --only hosting
```

### Environment Variables

Set in Firebase Hosting:
- Go to Firebase Console
- Hosting → Environment Variables
- Add all `REACT_APP_*` variables

### Security Rules

```bash
# Deploy Firestore rules
firebase deploy --only firestore:rules

# Deploy Storage rules
firebase deploy --only storage:rules

# Deploy indexes
firebase deploy --only firestore:indexes
```

## Best Practices

### Code Organization
- Keep components small and focused
- Use custom hooks for reusable logic
- Separate concerns (UI, business logic, data)
- Use TypeScript for type safety (optional)

### Performance
- Lazy load routes
- Optimize images
- Use React.memo for expensive components
- Implement pagination for large lists

### Security
- Never expose API keys
- Validate all user inputs
- Use Firebase Security Rules
- Sanitize user-generated content

### Accessibility
- Use semantic HTML
- Add ARIA labels
- Ensure keyboard navigation
- Test with screen readers

## Troubleshooting

### Common Issues

**Firebase connection errors**
- Check `.env` file
- Verify Firebase project settings
- Check network connectivity

**Build errors**
- Clear `node_modules` and reinstall
- Check Node.js version
- Review error messages

**Test failures**
- Update test snapshots if UI changed
- Check mock implementations
- Verify test environment

## Resources

- [React Documentation](https://react.dev/)
- [Firebase Documentation](https://firebase.google.com/docs)
- [React Router](https://reactrouter.com/)
- [Testing Library](https://testing-library.com/)

---

**Last Updated**: January 2024
**Version**: 1.0.0





