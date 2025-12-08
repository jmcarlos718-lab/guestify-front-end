# Firebase Setup Guide for Guestify OPMS

This guide will walk you through setting up Firebase for the Guestify project.

## 📋 Prerequisites

- Google account
- Firebase account (free tier is sufficient)
- Node.js and npm installed

## 🚀 Step-by-Step Setup

### Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click **"Add project"** or **"Create a project"**
3. Enter project name: `guestify-opms` (or your preferred name)
4. Click **Continue**
5. (Optional) Enable Google Analytics - you can skip this for now
6. Click **Create project**
7. Wait for project creation (usually takes 30-60 seconds)
8. Click **Continue**

### Step 2: Register Web App

1. In your Firebase project dashboard, click the **Web icon** (`</>`)
2. Register your app:
   - App nickname: `Guestify Web App`
   - (Optional) Check "Also set up Firebase Hosting"
   - Click **Register app**
3. **Copy the Firebase configuration object** - you'll need this for your `.env` file

The config will look like this:
```javascript
const firebaseConfig = {
  apiKey: "AIza...",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123",
  measurementId: "G-XXXXXXXXXX"
};
```

### Step 3: Enable Authentication

1. In Firebase Console, go to **Build** → **Authentication**
2. Click **Get started**
3. Go to **Sign-in method** tab
4. Enable the following providers:
   - **Email/Password**: Click → Enable → Save
   - **Phone**: Click → Enable → Save (optional, for SMS authentication)

### Step 4: Create Firestore Database

1. In Firebase Console, go to **Build** → **Firestore Database**
2. Click **Create database**
3. Choose **Start in test mode** (we'll add security rules later)
4. Select a location (choose closest to your users)
5. Click **Enable**

**Important**: We'll update security rules in Step 2. For now, test mode is fine for development.

### Step 5: Enable Storage

1. In Firebase Console, go to **Build** → **Storage**
2. Click **Get started**
3. Choose **Start in test mode** (we'll add security rules later)
4. Select a location (should match Firestore location)
5. Click **Done**

### Step 6: Configure Environment Variables

1. In your project root (`my-react-app`), create a `.env` file (if it doesn't exist)
2. Copy the following template and fill in your Firebase config values:

```env
# Firebase Configuration
REACT_APP_FIREBASE_API_KEY=your_api_key_here
REACT_APP_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your-project-id
REACT_APP_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
REACT_APP_FIREBASE_APP_ID=your_app_id
REACT_APP_FIREBASE_MEASUREMENT_ID=your_measurement_id

# App Configuration
REACT_APP_API_URL=http://localhost:3001
REACT_APP_ENV=development
```

3. Replace all placeholder values with your actual Firebase config values

### Step 7: Verify Setup

1. Start your development server:
   ```bash
   cd my-react-app
   npm start
   ```

2. Check the browser console for any Firebase errors
3. You should see: "✅ Firebase initialized successfully" (if you add logging)

## 🔒 Security Rules Setup

### Firestore Security Rules

Go to **Firestore Database** → **Rules** tab and add:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users collection
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Listings collection
    match /listings/{listingId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow update, delete: if request.auth != null && 
        resource.data.hostId == request.auth.uid;
    }
    
    // Bookings collection
    match /bookings/{bookingId} {
      allow read: if request.auth != null && (
        resource.data.guestId == request.auth.uid ||
        resource.data.hostId == request.auth.uid
      );
      allow create: if request.auth != null;
      allow update: if request.auth != null && (
        resource.data.guestId == request.auth.uid ||
        resource.data.hostId == request.auth.uid
      );
    }
    
    // Messages collection
    match /messages/{messageId} {
      allow read, write: if request.auth != null && (
        resource.data.senderId == request.auth.uid ||
        resource.data.receiverId == request.auth.uid
      );
    }
    
    // Admin collection (admin only)
    match /admin/{document=**} {
      allow read, write: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
  }
}
```

### Storage Security Rules

Go to **Storage** → **Rules** tab and add:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // User profile images
    match /users/{userId}/{allPaths=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Listing images
    match /listings/{listingId}/{allPaths=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }
    
    // General uploads
    match /uploads/{userId}/{allPaths=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

**Note**: These are basic rules. We'll refine them in later steps based on your specific requirements.

## 📱 Optional: Enable Phone Authentication (SMS)

If you want SMS authentication:

1. Go to **Authentication** → **Sign-in method** → **Phone**
2. Enable it
3. For production, you'll need to:
   - Verify your app in Firebase Console
   - Set up reCAPTCHA (Firebase handles this automatically)
   - Add billing (Phone auth requires a paid plan after free tier)

## 🧪 Testing Firebase Connection

Create a test file to verify Firebase is working:

```javascript
// src/test-firebase.js (temporary test file)
import { auth, db, storage } from './config/firebase';
import { collection, getDocs } from 'firebase/firestore';

console.log('Firebase Auth:', auth);
console.log('Firebase Firestore:', db);
console.log('Firebase Storage:', storage);
```

## 🐛 Troubleshooting

### Common Issues

1. **"Firebase: Error (auth/configuration-not-found)"**
   - Check your `.env` file exists and has correct values
   - Restart your development server after creating `.env`
   - Ensure all environment variables start with `REACT_APP_`

2. **"Firebase: Error (auth/invalid-api-key)"**
   - Verify your API key in Firebase Console
   - Check that you copied the correct values to `.env`

3. **"Firestore permission denied"**
   - Check Firestore security rules
   - Ensure you're authenticated
   - Verify rules are published

4. **Storage upload fails**
   - Check Storage security rules
   - Verify file size limits
   - Check network connection

## ✅ Verification Checklist

- [ ] Firebase project created
- [ ] Web app registered
- [ ] Authentication enabled (Email/Password)
- [ ] Firestore database created
- [ ] Storage enabled
- [ ] `.env` file created with correct values
- [ ] Security rules added (basic)
- [ ] Development server starts without errors
- [ ] No Firebase errors in console

## 📚 Additional Resources

- [Firebase Documentation](https://firebase.google.com/docs)
- [Firestore Documentation](https://firebase.google.com/docs/firestore)
- [Firebase Auth Documentation](https://firebase.google.com/docs/auth)
- [Firebase Storage Documentation](https://firebase.google.com/docs/storage)

## 🎯 Next Steps

After completing this setup:
1. ✅ Firebase is configured
2. ✅ Ready for Step 3: Authentication System
3. ✅ Services are ready to use

---

**Status**: Firebase Setup Complete ✅
**Next**: Step 3 - Authentication System Implementation




























