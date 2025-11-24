/**
 * AuthContext
 * 
 * Global authentication context provider
 * Manages user authentication state across the application
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../config/firebase';
import * as authService from '../services/authService';
import * as firestoreService from '../services/firestoreService';
import * as hostService from '../services/hostService';
import { USER_ROLES } from '../config/constants';
import { createUserDocument } from '../models/userModel';
import { normalizeEmail, getEmailRoleUsage } from '../services/userService';
import * as backendAuthService from '../services/backendAuthService';
import * as adminApi from '../services/adminService';

const AuthContext = createContext(null);

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext must be used within AuthProvider');
  }
  return context;
};

const ADMIN_TOKEN_KEY = 'guestify_admin_token';
const DEFAULT_AUTH_TIMEOUT_MS = 12000;

const waitForAuthUser = (expectedUid, timeoutMs = DEFAULT_AUTH_TIMEOUT_MS) => {
  if (!expectedUid) {
    return Promise.reject(new Error('Expected a UID to wait for authentication state.'));
  }

  if (auth.currentUser?.uid === expectedUid) {
    return Promise.resolve(auth.currentUser);
  }

  return new Promise((resolve, reject) => {
    let settled = false;

    const timeoutId = setTimeout(() => {
      if (!settled) {
        settled = true;
        unsubscribe();
        const timeoutError = new Error(
          'Authentication state did not become ready in time. Please try again.'
        );
        timeoutError.code = 'auth/state-timeout';
        reject(timeoutError);
      }
    }, timeoutMs);

    const unsubscribe = onAuthStateChanged(
      auth,
      (firebaseUser) => {
        if (settled) {
          return;
        }
        if (firebaseUser?.uid === expectedUid) {
          settled = true;
          clearTimeout(timeoutId);
          unsubscribe();
          resolve(firebaseUser);
        }
      },
      (error) => {
        if (settled) {
          return;
        }
        settled = true;
        clearTimeout(timeoutId);
        unsubscribe();
        reject(error);
      }
    );
  });
};

const getRoleSet = (profile) => {
  const roles = new Set();
  if (!profile) return roles;

  if (profile.role) {
    roles.add(profile.role);
  }

  if (Array.isArray(profile.roles)) {
    profile.roles.forEach((role) => roles.add(role));
  }

  return roles;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [userLoading, setUserLoading] = useState(true);
  const [error, setError] = useState(null);
  const [adminProfile, setAdminProfile] = useState(null);
  const [adminToken, setAdminToken] = useState(() => localStorage.getItem(ADMIN_TOKEN_KEY));
  const [adminBootstrapLoading, setAdminBootstrapLoading] = useState(!!adminToken);
  const [adminAuthLoading, setAdminAuthLoading] = useState(false);
  const [adminError, setAdminError] = useState(null);
  const [lastSyncedUid, setLastSyncedUid] = useState(null);
  const syncBackendAccount = async (authUserData, profileData) => {
    if (!authUserData?.uid) {
      return;
    }

    if (lastSyncedUid === authUserData.uid) {
      return;
    }

    try {
      await backendAuthService.syncUser({
        email: authUserData.email,
        name: profileData?.displayName || authUserData.displayName || '',
        userId: authUserData.uid,
        role: profileData?.role || profileData?.roles?.[0] || USER_ROLES.GUEST,
        phone: profileData?.phone || ''
      });
      setLastSyncedUid(authUserData.uid);
    } catch (syncError) {
      console.warn('[AuthContext] Backend sync failed:', syncError.message);
    }
  };


  // Fetch user profile from Firestore
  const fetchUserProfile = async (uid) => {
    try {
      const profile = await firestoreService.getDocument('users', uid);
      if (profile) {
        if (!Array.isArray(profile.roles)) {
          const roles = getRoleSet(profile);
          profile.roles = Array.from(roles);
        }
        setUserProfile(profile);
        return profile;
      }
      return null;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }
  };

  // Create user profile in Firestore
  const createUserProfile = async (uid, userData) => {
    try {
      await waitForAuthUser(uid);
      const profileData = createUserDocument({
        uid,
        email: userData.email,
        displayName: userData.displayName || '',
        role: userData.role || USER_ROLES.GUEST,
        roles: userData.roles || [userData.role || USER_ROLES.GUEST],
        photoURL: userData.photoURL || '',
        phone: userData.phone || ''
      });

      console.log('[AuthContext] Creating user profile in Firestore:', { 
        uid, 
        email: userData.email,
        authUid: auth.currentUser?.uid,
        profileDataUid: profileData.uid,
        isAuthenticated: !!auth.currentUser,
        documentId: uid,
        collectionName: 'users'
      });
      
      // Verify authentication before creating document
      if (!auth.currentUser) {
        console.error('[AuthContext] ERROR: User not authenticated after wait()');
        throw new Error('User not authenticated. Cannot create profile.');
      }
      
      if (auth.currentUser.uid !== uid) {
        console.error('[AuthContext] ERROR: UID mismatch', {
          authUid: auth.currentUser.uid,
          expectedUid: uid
        });
        throw new Error(`UID mismatch: auth.uid=${auth.currentUser.uid}, expected=${uid}`);
      }
      
      console.log('[AuthContext] Calling firestoreService.createDocument with:', {
        collection: 'users',
        docId: uid,
        hasUid: !!profileData.uid
      });
      
      try {
        await firestoreService.createDocument('users', profileData, uid);
        console.log('[AuthContext] ✅ User profile created successfully');
      } catch (createError) {
        console.error('[AuthContext] ❌ Error creating document:', createError);
        console.error('[AuthContext] Error details:', {
          code: createError.code,
          message: createError.message,
          stack: createError.stack
        });
        throw createError;
      }
      setUserProfile(profileData);
      return profileData;
    } catch (error) {
      console.error('[AuthContext] Error creating user profile:', error);
      console.error('[AuthContext] Error code:', error.code);
      console.error('[AuthContext] Error message:', error.message);
      
      // Check if it's a permission error
      if (error.code === 'permission-denied' || error.message?.includes('permission') || error.message?.includes('Permission')) {
        const permissionError = new Error(
          'Firestore permission denied. Please update Firestore security rules in Firebase Console. ' +
          'The rules file has been updated in the codebase - you need to deploy them to Firebase.'
        );
        permissionError.code = 'permission-denied';
        throw permissionError;
      }
      throw error;
    }
  };

  // Listen to authentication state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      async (firebaseUser) => {
        setUserLoading(true);
        setError(null);

        if (firebaseUser) {
          // User is signed in
          const userData = {
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName,
            photoURL: firebaseUser.photoURL,
            emailVerified: firebaseUser.emailVerified
          };

          setUser(userData);

          // Fetch or create user profile
          let profile = await fetchUserProfile(firebaseUser.uid);
          if (!profile) {
            // Create profile if it doesn't exist
            profile = await createUserProfile(firebaseUser.uid, userData);
          }

          await syncBackendAccount(userData, profile || userData);
        } else {
          // User is signed out
          setUser(null);
          setUserProfile(null);
          setLastSyncedUid(null);
        }

        setUserLoading(false);
      },
      (error) => {
        console.error('Auth state change error:', error);
        setError(error.message);
        setUser(null);
        setUserProfile(null);
        setUserLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const bootstrapAdmin = async () => {
      if (!adminToken) {
        adminApi.setAdminAuthToken(null);
        setAdminProfile(null);
        setAdminBootstrapLoading(false);
        return;
      }

      adminApi.setAdminAuthToken(adminToken);
      try {
        const admin = await adminApi.fetchProfile();
        setAdminProfile({
          ...admin,
          role: USER_ROLES.ADMIN,
          displayName: admin.name || admin.email || 'Admin'
        });
      } catch (err) {
        console.warn('Admin session invalid, clearing token.', err);
        localStorage.removeItem(ADMIN_TOKEN_KEY);
        adminApi.setAdminAuthToken(null);
        setAdminToken(null);
        setAdminProfile(null);
      } finally {
        setAdminBootstrapLoading(false);
      }
    };

    bootstrapAdmin();
  }, [adminToken]);

  // Register new user
  const register = async (email, password, displayName, role = USER_ROLES.GUEST, phone = '') => {
    try {
      setError(null);
      setUserLoading(true);

      const normalizedEmail = normalizeEmail(email);

      const {
        existingProfile,
        hostRecord,
        hasGuest,
        hasHost,
        fullyUsed
      } = await getEmailRoleUsage(normalizedEmail);

      if (
        fullyUsed ||
        (role === USER_ROLES.GUEST && hasGuest) ||
        (role === USER_ROLES.HOST && hasHost)
      ) {
        throw new Error('This email is already in use. You cannot create another account with this email.');
      }

      if (existingProfile) {
        try {
          await authService.signInWithEmail(normalizedEmail, password);
        } catch (signInError) {
          throw new Error('This email is already registered. Please enter the correct password for this email to add a new role.');
        }

        const updatedRoles = Array.from(new Set([...getRoleSet(existingProfile), role]));
        await firestoreService.updateDocument('users', existingProfile.id, {
          roles: updatedRoles,
          role: existingProfile.role || updatedRoles[0],
          displayName: displayName || existingProfile.displayName || ''
        });

        if (role === USER_ROLES.HOST && !hostRecord) {
          await hostService.createHostProfile({
            uid: existingProfile.id,
            email: normalizedEmail,
            displayName: displayName || existingProfile.displayName || '',
            phone: phone || existingProfile.phone || ''
          });
        }

        const profile = await fetchUserProfile(existingProfile.id);
        return { user: auth.currentUser, profile };
      }

      const userData = await authService.registerWithEmail(normalizedEmail, password, displayName);

      await waitForAuthUser(userData.uid);

      console.log('[AuthContext] Creating user profile with UID:', userData.uid);
      const profile = await createUserProfile(userData.uid, {
        email: normalizedEmail,
        displayName: displayName || userData.displayName,
        role,
        roles: [role],
        phone
      });

      try {
        await backendAuthService.registerUser({
          email: normalizedEmail,
          name: displayName || userData.displayName || '',
          userId: userData.uid,
          role,
          phone
        });
      } catch (serviceError) {
        // Backend service unavailable - registration still succeeds with Firebase
        console.warn('Backend email verification service unavailable:', serviceError.message);
        // Don't throw - Firebase registration was successful
      }

      if (role === USER_ROLES.HOST) {
        await hostService.createHostProfile({
          uid: userData.uid,
          email: normalizedEmail,
          displayName: displayName || userData.displayName || '',
          phone: phone || ''
        });
      }

    await authService.signOutUser();
    setUser(null);
    setUserProfile(null);

    return { user: null, profile };
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setUserLoading(false);
    }
  };

  // Sign in
  const signIn = async (email, password) => {
    try {
      setError(null);
      setUserLoading(true);
      const authUser = await authService.signInWithEmail(email, password);

      if (!authUser.emailVerified) {
        let backendVerified = false;
        let backendReason = 'Please verify your email before logging in.';

        try {
          const status = await backendAuthService.canLogin(email);
          backendVerified = !!status?.isVerified;
          backendReason = status?.reason || backendReason;
        } catch (statusError) {
          console.warn('[AuthContext] Unable to confirm backend verification status:', statusError.message);
        }

        if (!backendVerified) {
          await authService.signOutUser();
          const verificationError = new Error(backendReason);
          verificationError.code = 'auth/email-not-verified';
          throw verificationError;
        }
      }

      // User state will be updated by onAuthStateChanged
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setUserLoading(false);
    }
  };

  // Sign out
  const signOut = async () => {
    try {
      setError(null);
      if (user) {
        await authService.signOutUser();
        setUser(null);
        setUserProfile(null);
      }
      setLastSyncedUid(null);
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      if (adminProfile || adminToken) {
        adminSignOut();
      }
    }
  };

  const adminSignIn = async (email, password) => {
    try {
      setAdminError(null);
      setAdminAuthLoading(true);
      const { token, admin } = await adminApi.login(email, password);
      localStorage.setItem(ADMIN_TOKEN_KEY, token);
      adminApi.setAdminAuthToken(token);
      setAdminToken(token);
      setAdminProfile({
        ...admin,
        role: USER_ROLES.ADMIN,
        displayName: admin.name || admin.email || 'Admin'
      });
      
      // Ensure admin has a Firestore user document with admin role
      // This is needed for Firestore security rules to recognize the user as admin
      try {
        // Try to get current Firebase Auth user
        const currentUser = auth.currentUser;
        if (currentUser) {
          // Update or create Firestore user document with admin role
          const userDoc = await firestoreService.getDocument('users', currentUser.uid);
          if (userDoc) {
            // Update existing user document with admin role
            await firestoreService.updateDocument('users', currentUser.uid, {
              role: USER_ROLES.ADMIN,
              roles: [USER_ROLES.ADMIN],
              updatedAt: new Date()
            });
          } else {
            // Create new user document with admin role
            await firestoreService.createDocument('users', {
              uid: currentUser.uid,
              email: currentUser.email || email,
              displayName: admin.name || admin.email || 'Admin',
              role: USER_ROLES.ADMIN,
              roles: [USER_ROLES.ADMIN],
              isVerified: true,
              createdAt: new Date(),
              updatedAt: new Date()
            }, currentUser.uid);
          }
        } else {
          // Admin is not authenticated with Firebase Auth
          // Try to sign in with Firebase Auth, or create account if it doesn't exist
          try {
            console.log('[AuthContext] Attempting to authenticate admin with Firebase Auth...');
            let firebaseUser = null;
            
            try {
              // Try to sign in with Firebase Auth using the same credentials
              await authService.signInWithEmail(email, password);
              firebaseUser = auth.currentUser;
              console.log('[AuthContext] Successfully signed in admin with Firebase Auth');
            } catch (signInError) {
              // If sign-in fails, try to create a Firebase Auth account
              // This handles cases where the admin doesn't have a Firebase Auth account yet
              console.log('[AuthContext] Firebase Auth sign-in failed, attempting to create account...', signInError.message);
              try {
                await authService.registerWithEmail(email, password, admin.name || 'Admin');
                firebaseUser = auth.currentUser;
                console.log('[AuthContext] Successfully created Firebase Auth account for admin');
              } catch (createError) {
                const createErrorCode = createError.code || '';
                const createErrorMessage = createError.message || '';
                
                // If account already exists, that's okay - we'll continue
                if (createErrorCode === 'auth/email-already-in-use' || 
                    createErrorMessage.includes('email-already-in-use')) {
                  console.log('[AuthContext] Firebase Auth account already exists. Admin may need to use Firebase Auth password.');
                  console.warn('[AuthContext] Note: Admin backend password and Firebase Auth password may differ.');
                } else {
                  console.warn('[AuthContext] Could not create Firebase Auth account:', createErrorMessage);
                  console.warn('[AuthContext] Admin will not be able to access Firestore. Please create Firebase Auth account manually.');
                }
              }
            }
            
            // Now update/create Firestore user document with admin role
            if (firebaseUser) {
              const userDoc = await firestoreService.getDocument('users', firebaseUser.uid);
              if (userDoc) {
                await firestoreService.updateDocument('users', firebaseUser.uid, {
                  role: USER_ROLES.ADMIN,
                  roles: [USER_ROLES.ADMIN],
                  updatedAt: new Date()
                });
              } else {
                await firestoreService.createDocument('users', {
                  uid: firebaseUser.uid,
                  email: firebaseUser.email || email,
                  displayName: admin.name || admin.email || 'Admin',
                  role: USER_ROLES.ADMIN,
                  roles: [USER_ROLES.ADMIN],
                  isVerified: true,
                  createdAt: new Date(),
                  updatedAt: new Date()
                }, firebaseUser.uid);
              }
              console.log('[AuthContext] Admin Firestore user document updated/created with admin role');
            }
          } catch (authError) {
            console.error('[AuthContext] Could not authenticate admin with Firebase Auth:', authError);
            console.warn('[AuthContext] Admin may not be able to access Firestore. Error:', authError.message);
          }
        }
      } catch (firestoreError) {
        // Log but don't fail admin sign-in if Firestore update fails
        console.warn('[AuthContext] Failed to update Firestore user document for admin:', firestoreError);
      }
      
      return admin;
    } catch (err) {
      const message = err.message || 'Unable to sign in as admin';
      setAdminError(message);
      throw new Error(message);
    } finally {
      setAdminAuthLoading(false);
    }
  };

  const adminSignOut = () => {
    localStorage.removeItem(ADMIN_TOKEN_KEY);
    adminApi.setAdminAuthToken(null);
    setAdminToken(null);
    setAdminProfile(null);
  };

  // Reset password
  const resetPassword = async (email) => {
    try {
      setError(null);
      await authService.resetPassword(email);
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  // Update user profile
  const updateProfile = async (updates) => {
    try {
      setError(null);
      
      // Update Firebase Auth profile
      if (updates.displayName || updates.photoURL) {
        await authService.updateUserProfile({
          displayName: updates.displayName,
          photoURL: updates.photoURL
        });
      }

      // Update Firestore profile
      if (user?.uid) {
        await firestoreService.updateDocument('users', user.uid, updates);
        await fetchUserProfile(user.uid);
      }
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  // Check if user has specific role
  const profileHasRole = (role) => {
    if (role === USER_ROLES.ADMIN && adminProfile) {
      return true;
    }
    if (!userProfile) return false;
    if (Array.isArray(userProfile.roles)) {
      return userProfile.roles.includes(role);
    }
    return userProfile.role === role;
  };

  const hasRole = (role) => profileHasRole(role);

  const isAdmin = () => profileHasRole(USER_ROLES.ADMIN);

  const isHost = () => profileHasRole(USER_ROLES.HOST);

  const isGuest = () => profileHasRole(USER_ROLES.GUEST);

  const isUserAuthenticated = !!user;
  const isAdminAuthenticated = !!adminProfile;
  const loading = userLoading || adminBootstrapLoading;
  const resolvedProfile = adminProfile || userProfile;

  const value = {
    user,
    userProfile: resolvedProfile,
    loading,
    adminProfile,
    adminError,
    adminAuthLoading,
    error,
    register,
    signIn,
    signOut,
    adminSignIn,
    adminSignOut,
    resetPassword,
    updateProfile,
    hasRole,
    isAdmin,
    isHost,
    isGuest,
    isAuthenticated: isUserAuthenticated || isAdminAuthenticated,
    isUserAuthenticated,
    isAdminAuthenticated
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};



