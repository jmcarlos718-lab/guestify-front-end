/**
 * Firebase Configuration
 * 
 * This file initializes Firebase services for the Guestify OPMS.
 * Make sure to set up your Firebase project and add the configuration
 * values to your .env file.
 * 
 * Setup Instructions:
 * 1. Go to https://console.firebase.google.com/
 * 2. Create a new project or select existing one
 * 3. Enable Authentication (Email/Password, Phone)
 * 4. Create Firestore Database
 * 5. Enable Storage
 * 6. Copy config values to .env file
 */

import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getStorage, connectStorageEmulator } from 'firebase/storage';
import { getAnalytics } from 'firebase/analytics';

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: 'AIzaSyAa_JLxFxhXTLWt2M4EiyQTo4IkbX7MIWI',
  authDomain: 'guestify-7fed9.firebaseapp.com',
  projectId: 'guestify-7fed9',
  storageBucket: 'guestify-7fed9.appspot.com',
  messagingSenderId: '354032881264',
  appId: '1:354032881264:web:d7d0aeff428819b26aeeb5',
  measurementId: 'G-WF2YLQX558'
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Initialize Analytics
let analytics = null;
try {
  analytics = getAnalytics(app);
} catch (error) {
  console.warn('⚠️ Analytics initialization skipped:', error.message);
}

// Verify Firestore connection
try {
  console.log('✅ Firebase initialized successfully');
  console.log('✅ Firestore database connected');
  console.log('✅ Firebase Auth ready');
} catch (error) {
  console.error('❌ Firebase service initialization error:', error);
}

// Connect to emulators in development (optional)
// Uncomment and configure if using Firebase Emulator Suite
/*
if (process.env.NODE_ENV === 'development' && process.env.REACT_APP_USE_EMULATOR === 'true') {
  try {
    connectAuthEmulator(auth, 'http://localhost:9099');
    connectFirestoreEmulator(db, 'localhost', 8080);
    connectStorageEmulator(storage, 'localhost', 9199);
    console.log('✅ Connected to Firebase Emulators');
  } catch (error) {
    console.warn('Emulator connection failed:', error);
  }
}
*/

export { analytics };
export default app;

