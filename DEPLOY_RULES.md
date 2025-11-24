# 🚀 Deploy Firestore Rules - Quick Guide

## The Problem
You're getting a "permission denied" or "missing or insufficient permission" error when trying to sign up.

## The Solution
The Firestore security rules in your codebase need to be **deployed to Firebase**. The rules file in your code is just source code - Firebase uses the rules deployed in the Firebase Console.

## ⚡ Quick Fix (Choose One Method)

### Method 1: Use the Deployment Script (Easiest)

1. **Open PowerShell or Command Prompt**
2. **Navigate to the project folder:**
   ```bash
   cd my-react-app
   ```
3. **Run the deployment script:**
   ```bash
   .\deploy-rules.bat
   ```
4. **Wait for "Rules deployed successfully!"**
5. **Wait 10-20 seconds** for rules to propagate
6. **Try signing up again**

### Method 2: Manual Deployment via Firebase Console

1. **Open Firebase Console:**
   - Go to: https://console.firebase.google.com/
   - Select project: **guestify-7fed9**

2. **Go to Firestore Rules:**
   - Click **"Firestore Database"** (left sidebar)
   - Click **"Rules"** tab (top)

3. **Copy Rules:**
   - Open file: `my-react-app/firestore.rules`
   - **Select ALL** (Ctrl+A)
   - **Copy** (Ctrl+C)

4. **Paste in Firebase Console:**
   - **Delete** all existing rules in the Firebase Console editor
   - **Paste** the copied rules (Ctrl+V)
   - Click **"Publish"** button (top right)

5. **Wait & Test:**
   - Wait 10-20 seconds
   - Try signing up again

### Method 3: Use Firebase CLI

1. **Install Firebase CLI** (if not installed):
   ```bash
   npm install -g firebase-tools
   ```

2. **Login to Firebase:**
   ```bash
   firebase login
   ```

3. **Deploy Rules:**
   ```bash
   cd my-react-app
   firebase deploy --only firestore:rules --project guestify-7fed9
   ```

4. **Wait 10-20 seconds** and try signing up again

## ✅ Verify It Worked

After deploying:

1. **Check Firebase Console:**
   - Go to Firestore Database → Rules tab
   - Should show "Last published: [recent time]"

2. **Check Browser Console (F12):**
   - Try signing up
   - Look for logs starting with `[AuthContext]` and `[Register]`
   - Should see "✅ User profile created successfully" if it works

3. **Check Firestore Database:**
   - Go to Firestore Database → Data tab
   - Should see a new document in the `users` collection after successful signup

## 🔍 Troubleshooting

### Still Getting Permission Error?

1. **Check Browser Console (F12):**
   - Look for the exact error code and message
   - Check if `authUid` matches `profileDataUid` in the logs

2. **Verify Rules Were Deployed:**
   - Go to Firebase Console → Firestore → Rules
   - Check the "Last published" timestamp
   - Make sure it's recent (within last few minutes)

3. **Verify Firebase Project:**
   - Make sure you're using project: **guestify-7fed9**
   - Check `my-react-app/.firebaserc` file
   - Check `my-react-app/src/config/firebase.js` - should match

4. **Clear Browser Cache:**
   - Hard refresh: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)

5. **Check Authentication:**
   - Make sure Firebase Authentication is enabled in Firebase Console
   - Go to Authentication → Sign-in method
   - Enable "Email/Password" provider

## 📝 What the Rules Do

The deployed rules allow:
- ✅ **Reading** user/host profiles (for email existence checks)
- ✅ **Creating** user profile if authenticated and document ID matches auth.uid
- ✅ **Creating** host profile if authenticated and document ID matches auth.uid
- ✅ **Updating** own profile
- ✅ **Reading** published listings

## 🆘 Still Not Working?

If you've tried all methods and it's still not working:

1. **Share the browser console logs** (F12 → Console tab)
2. **Share the exact error message** you see
3. **Verify the Firebase project** you're connected to

The rules file is correct - the issue is almost always that they haven't been deployed to Firebase yet.

