# 🚨 URGENT: Fix Sign Up Permission Error

## The Problem
"Missing or insufficient permission" error when signing up.

## ⚡ THE FIX (2 minutes)

### You MUST deploy the Firestore rules to Firebase Console!

The rules file in your codebase is **just source code**. Firebase uses the rules in the **Firebase Console**, not your local file.

### Steps:

1. **Open Firebase Console**
   - Go to: https://console.firebase.google.com/
   - Select project: **guestify-opms**

2. **Go to Firestore Rules**
   - Click **"Firestore Database"** (left menu)
   - Click **"Rules"** tab (top)

3. **Copy Rules from File**
   - Open: `my-react-app/firestore.rules`
   - **Select ALL** (Ctrl+A)
   - **Copy** (Ctrl+C)

4. **Paste in Firebase Console**
   - **DELETE** all existing rules in Firebase Console
   - **PASTE** the copied rules
   - Click **"Publish"** button (top right)

5. **Wait & Test**
   - Wait 10-20 seconds
   - Try signing up again

## ✅ What Changed in Rules

The updated rules now allow:
- ✅ Reading users/hosts collections (for email checks)
- ✅ Creating user profile if authenticated and UID matches
- ✅ Creating host profile during registration

## 🔍 Verify It Worked

After publishing, check:
- Rules show "Published" with timestamp
- Try signing up - should work now!

## ❌ Still Not Working?

1. **Check browser console (F12)** for exact error
2. **Verify rules were published** - check timestamp in Firebase Console
3. **Try hard refresh** - Ctrl+Shift+R
4. **Check Firebase project** - make sure you're in the right project

## 📝 Quick Copy

The rules are in: `my-react-app/firestore.rules`

Just copy the entire file and paste into Firebase Console → Firestore → Rules tab.



















