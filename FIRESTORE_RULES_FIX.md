# 🔧 Firestore Rules Fix for Sign Up Permission Error

## Issue
"Missing or insufficient permission" error when trying to sign up.

## Solution
The Firestore security rules have been updated to allow:
1. **Reading user profiles** - Needed to check if email already exists
2. **Creating user profiles** - During registration, users can create their own profile

## How to Apply the Fix

### Option 1: Update Rules in Firebase Console (Recommended)

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Go to **Firestore Database** → **Rules** tab
4. Copy the updated rules from `my-react-app/firestore.rules`
5. Paste into the Firebase Console
6. Click **Publish**

### Option 2: Use Firebase CLI

```bash
# Install Firebase CLI if not already installed
npm install -g firebase-tools

# Login to Firebase
firebase login

# Deploy rules
firebase deploy --only firestore:rules
```

## Updated Rules Summary

The key changes:
- **Users collection**: Allow reads for email existence checks
- **Users collection**: Allow authenticated users to create their own profile (document ID must match auth.uid)
- **Hosts collection**: Allow creating host profiles during registration

## Testing

After updating the rules:
1. Try signing up with a new email
2. The registration should complete successfully
3. Check Firestore to verify the user document was created

## Important Notes

- Rules are updated in `my-react-app/firestore.rules`
- You must deploy these rules to Firebase for them to take effect
- Rules in the codebase are just the source - Firebase Console has the active rules




















