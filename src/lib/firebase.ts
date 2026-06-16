/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Firebase Configuration & Authentication Services
 * Uses signInWithRedirect (not popup) to avoid COOP browser blocking.
 */

import { initializeApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  signInWithCredential,
  GoogleAuthProvider,
  onAuthStateChanged,
  signOut,
  signInWithCustomToken,
  type User
} from 'firebase/auth';
import { getFirestore, initializeFirestore } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { Capacitor } from '@capacitor/core';
import { FirebaseAuthentication } from '@capacitor-firebase/authentication';

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

// Force long-polling to avoid strict firewall/websocket blocking issues
// which often manifest as "Failed to get document because the client is offline"
const dbFS = initializeFirestore(app, {
  experimentalForceLongPolling: true
});
const functions = getFunctions(app);
const googleProvider = new GoogleAuthProvider();

// Request email and profile scopes
googleProvider.addScope('email');
googleProvider.addScope('profile');

/**
 * Initiates Google Sign-In using a popup.
 * Ensure server sends Cross-Origin-Opener-Policy: unsafe-none
 */
export async function signInWithGoogle(): Promise<{ user: User, token: string }> {
  try {
    if (Capacitor.isNativePlatform()) {
      const result = await FirebaseAuthentication.signInWithGoogle();
      if (result.credential?.idToken) {
        const credential = GoogleAuthProvider.credential(result.credential.idToken);
        const fbResult = await signInWithCredential(auth, credential);
        return { user: fbResult.user, token: result.credential.idToken };
      }
      throw new Error("No credential returned from native Google Sign-in");
    } else {
      const result = await signInWithPopup(auth, googleProvider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      const token = credential?.accessToken || "";
      return { user: result.user, token };
    }
  } catch (error: any) {
    console.error("[Google Auth] Error during sign in:", error);
    throw error;
  }
}

/**
 * Retries a Firestore operation with simple exponential backoff.
 * Only retries on genuine offline/network errors, NOT on persistence conflicts.
 */
export async function withFirestoreRetry<T>(
  operation: () => Promise<T>,
  maxRetries = 3,
  delayMs = 800
): Promise<T> {
  let lastError: any;
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      if (attempt > 0) {
        await new Promise(resolve => setTimeout(resolve, delayMs * attempt));
      }
      return await operation();
    } catch (err: any) {
      lastError = err;
      const isRetryable =
        err?.message?.includes('client is offline') ||
        err?.message?.includes('Failed to get document') ||
        err?.code === 'unavailable';

      // Do NOT retry on persistence/precondition errors
      if (!isRetryable || attempt === maxRetries - 1) {
        throw err;
      }
      console.warn(`[Firestore] Offline retry ${attempt + 1}/${maxRetries}…`);
    }
  }
  throw lastError;
}

/**
 * Sign out the current Firebase user.
 */
export async function firebaseSignOut(): Promise<void> {
  await signOut(auth);
}

/**
 * Subscribe to Firebase auth state changes.
 */
export function onFirebaseAuthChange(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback);
}

// Cloud Functions for OTP
export const sendEmailOTP = httpsCallable<{ email: string }, { success: boolean }>(functions, 'sendEmailOTP');
export const verifyEmailOTP = httpsCallable<{ email: string, otp: string }, { success: boolean, token: string }>(functions, 'verifyEmailOTP');

import { getStorage } from 'firebase/storage';
const storage = getStorage(app);

export { auth, app, dbFS, functions, storage };
export type { User as FirebaseUser };
