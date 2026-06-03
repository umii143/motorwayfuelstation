/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Firebase Configuration & Authentication Services
 * Provides Google Sign-In via Firebase Auth
 */

import { initializeApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  signOut,
  type User
} from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Firebase project configuration
const firebaseConfig = {
  apiKey: "AIzaSyBrrm-ipiRL1d1rpvmXx8ojCWK0u58RnW0",
  authDomain: "vyaparfuelstation-50a00.firebaseapp.com",
  projectId: "vyaparfuelstation-50a00",
  storageBucket: "vyaparfuelstation-50a00.firebasestorage.app",
  messagingSenderId: "652067090194",
  appId: "1:652067090194:web:8f2228372a187f55f30dcb"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const dbFS = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

// Add scopes for additional user information
googleProvider.addScope('email');
googleProvider.addScope('profile');

/**
 * Sign in with Google using Firebase popup flow.
 * Returns the Firebase user object and ID token.
 */
export async function signInWithGoogle(): Promise<{ user: User; token: string }> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const token = await result.user.getIdToken();
    return { user: result.user, token };
  } catch (error: any) {
    // Handle specific Firebase auth errors
    if (error.code === 'auth/popup-closed-by-user') {
      throw new Error('Sign-in popup was closed before completing.');
    }
    if (error.code === 'auth/popup-blocked') {
      throw new Error('Sign-in popup was blocked by the browser. Please allow popups.');
    }
    if (error.code === 'auth/cancelled-popup-request') {
      throw new Error('Sign-in was cancelled.');
    }
    throw new Error(error.message || 'Google sign-in failed.');
  }
}

/**
 * Sign out the current Firebase user.
 */
export async function firebaseSignOut(): Promise<void> {
  await signOut(auth);
}

/**
 * Subscribe to Firebase auth state changes.
 * Returns an unsubscribe function.
 */
export function onFirebaseAuthChange(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback);
}

export { auth, app, dbFS };
export type { User as FirebaseUser };

