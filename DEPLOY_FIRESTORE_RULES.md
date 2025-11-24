# 🚨 URGENT: Deploy Firestore Rules to Fix Sign Up Error

## The Problem
You're getting "missing or insufficient permission" error because the Firestore security rules in Firebase Console don't match the updated rules in your codebase.

## ⚡ Quick Fix (5 minutes)

### Step 1: Open Firebase Console
1. Go to: https://console.firebase.google.com/
2. Select your project: **guestify-opms** (or your project name)

### Step 2: Update Firestore Rules
1. Click **Firestore Database** in the left menu
2. Click the **Rules** tab at the top
3. **DELETE ALL** the existing rules
4. **COPY** the entire contents of `my-react-app/firestore.rules` file
5. **PASTE** into the Firebase Console editor
6. Click **Publish** button

### Step 3: Verify
1. Wait 10-20 seconds for rules to deploy
2. Try signing up again
3. The error should be gone!

## 📋 What the Updated Rules Do

The new rules allow:
- ✅ Reading user profiles (for email existence checks)
- ✅ Creating user profiles during registration (if authenticated and document ID matches user UID)
- ✅ Creating host profiles during registration

## 🔍 Verify Rules Are Deployed

After publishing, you should see in Firebase Console:
- Rules version updated
- Last published timestamp updated

## ⚠️ Important

**The rules file in your codebase (`my-react-app/firestore.rules`) is just source code.**
**You MUST deploy it to Firebase Console for it to work!**

## 🆘 Still Not Working?

1. Check browser console (F12) for specific error messages
2. Verify you're logged into the correct Firebase project
3. Make sure you clicked "Publish" (not just "Save")
4. Wait a few seconds after publishing for rules to propagate

## 📝 Alternative: Use Firebase CLI

If you prefer command line:

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login
firebase login

# Deploy rules
cd C:\Users\Admin\OneDrive\Documents\IT305\IT305Project
firebase deploy --only firestore:rules
```



















