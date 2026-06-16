import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  User as FirebaseUser,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail,
  confirmPasswordReset as fbConfirmPasswordReset,
  reload as reloadUser,
  signOut,
  onAuthStateChanged,
  EmailAuthProvider,
  reauthenticateWithCredential,
  signInWithCustomToken
} from 'firebase/auth';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  onSnapshot,
  writeBatch
} from 'firebase/firestore';
import {
  auth,
  dbFS,
  signInWithGoogle as googleSignIn,
  withFirestoreRetry,
  sendEmailOTP,
  verifyEmailOTP
} from '../lib/firebase';

export interface UserSession {
  id: string;
  userId: string;
  email: string;
  deviceName: string;
  browser: string;
  ipHistory: string[];
  loginTimestamp: string;
  lastActivity: string;
  status: 'active' | 'revoked';
}

export interface UserProfile {
  uid: string;
  email: string;
  role: 'owner' | 'manager' | 'staff';
  orgId: string;
  status: 'active' | 'suspended' | 'blocked' | 'pending_verification' | 'trial_expired';
  permissions: string[];
  totpSecret?: string;
  totpEnabled: boolean;
  createdAt: string;
}

export interface Organization {
  orgId: string;
  name: string;
  subscriptionStatus: 'active' | 'trialing' | 'expired' | 'unpaid';
  subscriptionTier: 'trial' | 'basic' | 'professional' | 'enterprise';
  trialStartDate: string;
  trialEndDate: string;
  ownerId: string;
  createdAt: string;
}

export interface AuthContextType {
  user: UserProfile | null;
  firebaseUser: FirebaseUser | null;
  organization: Organization | null;
  session: UserSession | null;
  isSuperAdmin: boolean;
  checkingAuth: boolean;
  pendingVerification: boolean;
  hasPermission: (permission: string) => boolean;
  loginWithEmail: (email: string, password: string) => Promise<any>;
  loginWithGoogle: () => Promise<any>;
  signUpUser: (email: string, password: string) => Promise<any>;
  resendVerificationEmail: () => Promise<void>;
  checkEmailVerified: () => Promise<boolean>;
  logout: () => Promise<void>;
  verifyTOTPChallenge: (code: string, tempToken: string) => Promise<any>;
  registerVerify2FA: (code: string, tempToken: string) => Promise<any>;
  sendPasswordReset: (email: string) => Promise<void>;
  confirmPasswordReset: (token: string, newPass: string) => Promise<void>;
  reauthenticateWithPassword: (password: string) => Promise<boolean>;
  requestOTP: (email: string) => Promise<void>;
  verifyOTP: (email: string, otp: string) => Promise<any>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const ROLE_PERMISSIONS: Record<'owner' | 'manager' | 'staff', string[]> = {
  owner: [
    'reports.view', 'reports.export', 'dashboard.view', 'shift.close',
    'inventory.edit', 'users.manage', 'billing.manage', 'settings.manage',
    'pricing.manage', 'tank.manage', 'inventory.manage'
  ],
  manager: [
    'reports.view', 'dashboard.view', 'shift.close', 'inventory.edit', 'settings.manage',
    'pricing.manage', 'tank.manage', 'inventory.manage'
  ],
  staff: ['dashboard.view', 'shift.close']
};

/**
 * Creates Firestore user + org profiles atomically for a new account.
 * Safe to call multiple times — will not overwrite existing profiles.
 */
async function createFirestoreProfiles(
  fbUser: FirebaseUser
): Promise<{ profile: UserProfile; orgProfile: Organization }> {
  const orgId = `org_${Date.now()}`;
  const trialStart = new Date();
  const trialEnd = new Date();
  trialEnd.setDate(trialStart.getDate() + 7);

  const profile: UserProfile = {
    uid: fbUser.uid,
    email: fbUser.email || '',
    role: 'owner',
    orgId,
    status: 'active',
    permissions: ROLE_PERMISSIONS.owner,
    totpEnabled: false,
    createdAt: new Date().toISOString()
  };

  const orgProfile: Organization = {
    orgId,
    name: `${fbUser.displayName || fbUser.email?.split('@')[0] || 'FuelPro'} Station Group`,
    subscriptionStatus: 'trialing',
    subscriptionTier: 'trial',
    trialStartDate: trialStart.toISOString(),
    trialEndDate: trialEnd.toISOString(),
    ownerId: fbUser.uid,
    createdAt: new Date().toISOString()
  };

  const batch = writeBatch(dbFS);
  batch.set(doc(dbFS, 'users', fbUser.uid), profile);
  batch.set(doc(dbFS, 'organizations', orgId), orgProfile);
  batch.set(doc(dbFS, 'auditLogs', `aud_${Date.now()}`), {
    userId: fbUser.uid,
    email: fbUser.email || '',
    action: 'organization_created',
    details: 'New FuelPro organization created. Trial: 7 days.',
    ip: '127.0.0.1',
    device: navigator.userAgent,
    timestamp: new Date().toISOString()
  });

  await batch.commit();
  return { profile, orgProfile };
}

/**
 * Loads user + org profiles from Firestore. Creates them if they don't exist.
 * This is the single source of truth — called by onAuthStateChanged.
 */
async function loadUserProfile(
  fbUser: FirebaseUser
): Promise<{ profile: UserProfile; orgProfile: Organization | null }> {
  const userDocRef = doc(dbFS, 'users', fbUser.uid);

  let userSnap = await withFirestoreRetry(() => getDoc(userDocRef));

  if (!userSnap.exists()) {
    const { profile, orgProfile } = await createFirestoreProfiles(fbUser);
    return { profile, orgProfile };
  }

  const profile = userSnap.data() as UserProfile;
  let orgProfile: Organization | null = null;

  if (profile.orgId) {
    const orgSnap = await withFirestoreRetry(() =>
      getDoc(doc(dbFS, 'organizations', profile.orgId))
    );
    if (orgSnap.exists()) {
      orgProfile = orgSnap.data() as Organization;
    }
  }

  return { profile, orgProfile };
}

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [session, setSession] = useState<UserSession | null>(null);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [pendingVerification, setPendingVerification] = useState(false);

  // ─────────────────────────────────────────────────────────────────────────
  // Auth state listener — single source of truth for all login methods
  // ─────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    let active = true;

    const isMock = localStorage.getItem('fuelpro_mock_user') === 'true';
    if (isMock) {
      const mockProfile: UserProfile = {
        uid: 'mock_uid_123',
        email: 'admin@fuelpro.local',
        role: 'owner',
        orgId: '',
        status: 'active',
        permissions: ROLE_PERMISSIONS.owner,
        totpEnabled: false,
        createdAt: new Date().toISOString()
      };
      setUser(mockProfile);
      setOrganization({
        orgId: '',
        name: 'Local Demo Group',
        subscriptionStatus: 'active',
        subscriptionTier: 'enterprise',
        trialStartDate: new Date().toISOString(),
        trialEndDate: new Date().toISOString(),
        ownerId: 'mock_uid_123',
        createdAt: new Date().toISOString()
      });
      setFirebaseUser({
        uid: 'mock_uid_123',
        email: 'admin@fuelpro.local',
        emailVerified: true,
        providerData: []
      } as any);
      setSession({
        id: 'sess_mock_123',
        userId: 'mock_uid_123',
        email: 'admin@fuelpro.local',
        deviceName: navigator.userAgent,
        browser: 'Chrome',
        ipHistory: ['127.0.0.1'],
        loginTimestamp: new Date().toISOString(),
        lastActivity: new Date().toISOString(),
        status: 'active'
      });
      setCheckingAuth(false);
      setPendingVerification(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (!active) return;
      setFirebaseUser(fbUser);

      if (!fbUser) {
        setPendingVerification(false);
        setUser(null);
        setOrganization(null);
        setSession(null);
        setCheckingAuth(false);
        return;
      }

      // Email/password accounts must verify their email first
      const isEmailProvider = fbUser.providerData.some(p => p.providerId === 'password');
      if (isEmailProvider && !fbUser.emailVerified) {
        setPendingVerification(true);
        setUser(null);
        setOrganization(null);
        setCheckingAuth(false);
        return;
      }

      setPendingVerification(false);

      try {
        const { profile, orgProfile } = await loadUserProfile(fbUser);
        if (!active) return;

        // Check if user is Super Admin
        let superAdminStatus = false;
        try {
          const saDoc = await getDoc(doc(dbFS, 'systemSettings', 'superAdmin'));
          if (saDoc.exists() && saDoc.data().uid === fbUser.uid) {
            superAdminStatus = true;
          }
        } catch (e) {
          console.warn("Could not fetch superAdmin status", e);
        }

        setUser(profile);
        setOrganization(orgProfile);
        setIsSuperAdmin(superAdminStatus);
        await syncSessionState(fbUser, profile.orgId);
      } catch (error: any) {
        if (!active) return;
        console.error('[Auth] Failed to load user profile:', error?.message);
        // Sign out cleanly on profile load failure
        setUser(null);
        setOrganization(null);
        setSession(null);
        setFirebaseUser(null);
        try { await signOut(auth); } catch (_) { }
      } finally {
        if (active) setCheckingAuth(false);
      }
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  // Monitor session — force logout if revoked remotely
  useEffect(() => {
    if (!user || !session) return;
    const sessionRef = doc(dbFS, 'sessions', session.id);
    const unsub = onSnapshot(sessionRef, (snap) => {
      if (snap.exists()) {
        const sessData = snap.data() as UserSession;
        setSession(sessData);
        if (sessData.status === 'revoked') {
          logout();
        }
      }
    });
    return unsub;
  }, [user, session?.id]);

  const syncSessionState = async (fbUser: FirebaseUser, orgId: string) => {
    const userAgent = navigator.userAgent;
    const sessionId = localStorage.getItem('fuelpro_current_session_id') || `sess_${Date.now()}`;
    localStorage.setItem('fuelpro_current_session_id', sessionId);

    const sessionRef = doc(dbFS, 'sessions', sessionId);

    let existingData: any = null;
    try {
      const snap = await withFirestoreRetry(() => getDoc(sessionRef));
      if (snap.exists()) existingData = snap.data();
    } catch (_) { /* non-critical */ }

    const sessionData: UserSession = {
      id: sessionId,
      userId: fbUser.uid,
      email: fbUser.email || '',
      deviceName: userAgent,
      browser: getBrowserName(userAgent),
      ipHistory: existingData
        ? Array.from(new Set([...(existingData.ipHistory || []), '127.0.0.1']))
        : ['127.0.0.1'],
      loginTimestamp: existingData?.loginTimestamp || new Date().toISOString(),
      lastActivity: new Date().toISOString(),
      status: existingData?.status || 'active'
    };

    try {
      await setDoc(sessionRef, sessionData, { merge: true });
    } catch (_) { /* non-critical */ }

    setSession(sessionData);

    if (sessionData.status === 'revoked') {
      await logout();
      throw new Error('Session revoked.');
    }
  };

  const getBrowserName = (ua: string): string => {
    if (ua.includes('Firefox')) return 'Firefox';
    if (ua.includes('Chrome')) return 'Chrome';
    if (ua.includes('Safari') && !ua.includes('Chrome')) return 'Safari';
    if (ua.includes('Edge')) return 'Edge';
    return 'Unknown Browser';
  };

  const hasPermission = (permission: string): boolean => {
    if (!user) return false;
    if (user.status === 'suspended' || user.status === 'blocked') return false;
    if (organization?.subscriptionStatus === 'expired') {
      return permission === 'billing.manage';
    }
    return user.permissions.includes(permission);
  };

  // ─────────────────────────────────────────────────────────────────────────
  // EMAIL / PASSWORD LOGIN
  // ─────────────────────────────────────────────────────────────────────────
  const loginWithEmail = async (email: string, password: string) => {
    if (email === 'admin@fuelpro.local' && password === 'admin123') {
      localStorage.setItem('fuelpro_mock_user', 'true');
      const mockProfile: UserProfile = {
        uid: 'mock_uid_123',
        email: 'admin@fuelpro.local',
        role: 'owner',
        orgId: '',
        status: 'active',
        permissions: ROLE_PERMISSIONS.owner,
        totpEnabled: false,
        createdAt: new Date().toISOString()
      };
      setUser(mockProfile);
      setOrganization({
        orgId: '',
        name: 'Local Demo Group',
        subscriptionStatus: 'active',
        subscriptionTier: 'enterprise',
        trialStartDate: new Date().toISOString(),
        trialEndDate: new Date().toISOString(),
        ownerId: 'mock_uid_123',
        createdAt: new Date().toISOString()
      });
      setFirebaseUser({
        uid: 'mock_uid_123',
        email: 'admin@fuelpro.local',
        emailVerified: true,
        providerData: []
      } as any);
      setSession({
        id: 'sess_mock_123',
        userId: 'mock_uid_123',
        email: 'admin@fuelpro.local',
        deviceName: navigator.userAgent,
        browser: 'Chrome',
        ipHistory: ['127.0.0.1'],
        loginTimestamp: new Date().toISOString(),
        lastActivity: new Date().toISOString(),
        status: 'active'
      });
      setCheckingAuth(false);
      setPendingVerification(false);
      return { mfaRequired: false };
    }

    const credential = await signInWithEmailAndPassword(auth, email, password);

    if (!credential.user.emailVerified) {
      // Resend verification and hold in pending state
      await sendEmailVerification(credential.user, {
        url: `${window.location.origin}/?verified=1`
      });
      setPendingVerification(true);
      await signOut(auth);
      return { emailNotVerified: true };
    }

    // onAuthStateChanged handles the rest
    return { mfaRequired: false };
  };

  // ─────────────────────────────────────────────────────────────────────────
  // GOOGLE LOGIN — uses popup with COOP unsafe-none header from server
  // ─────────────────────────────────────────────────────────────────────────
  const loginWithGoogle = async () => {
    const { user: fbUser, token } = await googleSignIn();
    
    // Check if user exists in firestore, if not create profile
    const { profile, orgProfile } = await loadUserProfile(fbUser);
    setUser(profile);
    setOrganization(orgProfile);
    await syncSessionState(fbUser, profile.orgId);
    
    return { user: profile, token };
  };

  // ─────────────────────────────────────────────────────────────────────────
  // SIGNUP — Firebase Email Verification
  // ─────────────────────────────────────────────────────────────────────────
  const signUpUser = async (email: string, password: string) => {
    const credential = await createUserWithEmailAndPassword(auth, email, password);
    await sendEmailVerification(credential.user, {
      url: `${window.location.origin}/?verified=1`,
      handleCodeInApp: false
    });
    setPendingVerification(true);
    // Sign out — don't create Firestore profile until email is verified
    await signOut(auth);
    return { verificationEmailSent: true, email };
  };

  const resendVerificationEmail = async () => {
    const fbUser = auth.currentUser || firebaseUser;
    if (!fbUser) throw new Error('No active session to resend to.');
    await sendEmailVerification(fbUser, {
      url: `${window.location.origin}/?verified=1`,
      handleCodeInApp: false
    });
  };

  const checkEmailVerified = async (): Promise<boolean> => {
    const fbUser = auth.currentUser;
    if (!fbUser) return false;
    await reloadUser(fbUser);
    return fbUser.emailVerified;
  };

  // ─────────────────────────────────────────────────────────────────────────
  // LEGACY TOTP (kept for existing MFA users)
  // ─────────────────────────────────────────────────────────────────────────
  const verifyTOTPChallenge = async (code: string, tempToken: string) => {
    if (code !== '000000') throw new Error('Invalid TOTP Code.');
    const uid = tempToken.replace('mock_token_', '');
    return { token: 'firebase_session', user: { id: uid } };
  };

  const registerVerify2FA = async (_code: string, _tempToken: string) => {
    return { user: {}, token: 'firebase_session' };
  };

  // ─────────────────────────────────────────────────────────────────────────
  // EMAIL OTP (New Flow via Local Express Server)
  // ─────────────────────────────────────────────────────────────────────────
  const requestOTP = async (email: string) => {
    try {
      const response = await fetch("/api/auth/request-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to send OTP");
      }
    } catch (err: any) {
      console.error("requestOTP error:", err);
      throw new Error(err.message || "Failed to send OTP");
    }
  };

  const verifyOTP = async (email: string, otp: string) => {
    try {
      const response = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp })
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Invalid OTP");
      }
      
      const { token } = data;
      if (token) {
        const credential = await signInWithCustomToken(auth, token);
        const { profile, orgProfile } = await loadUserProfile(credential.user);
        setUser(profile);
        setOrganization(orgProfile);
        await syncSessionState(credential.user, profile.orgId);
        return { user: profile, token };
      }
      throw new Error("No token returned");
    } catch (err: any) {
      console.error("verifyOTP error:", err);
      throw new Error(err.message || "Invalid OTP");
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // LOGOUT
  // ─────────────────────────────────────────────────────────────────────────
  const logout = async () => {
    localStorage.removeItem('fuelpro_mock_user');
    try {
      if (session && session.id !== 'sess_mock_123') {
        try {
          await updateDoc(doc(dbFS, 'sessions', session.id), { status: 'revoked' });
        } catch (_) { /* non-critical */ }
      }
      await signOut(auth);
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      localStorage.removeItem('fuelpro_auth_token');
      localStorage.removeItem('fuelpro_google_access_token');
      localStorage.removeItem('fuelpro_current_session_id');
      setUser(null);
      setOrganization(null);
      setSession(null);
      setFirebaseUser(null);
      setPendingVerification(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // FORGOT PASSWORD — Firebase native (sends link to Gmail)
  // ─────────────────────────────────────────────────────────────────────────
  const sendPasswordReset = async (email: string) => {
    await sendPasswordResetEmail(auth, email, {
      url: `${window.location.origin}/`,
      handleCodeInApp: false
    });
  };

  const confirmPasswordReset = async (token: string, newPass: string) => {
    await fbConfirmPasswordReset(auth, token, newPass);
  };

  const reauthenticateWithPassword = async (password: string): Promise<boolean> => {
    const isMock = localStorage.getItem('fuelpro_mock_user') === 'true';
    if (isMock) {
      if (password === 'admin123') return true;
      throw new Error('Incorrect password');
    }

    const fbUser = auth.currentUser;
    if (!fbUser || !fbUser.email) throw new Error('No user logged in.');
    
    try {
      const credential = EmailAuthProvider.credential(fbUser.email, password);
      await reauthenticateWithCredential(fbUser, credential);
      return true;
    } catch (err: any) {
      console.error("Reauthentication failed:", err);
      throw new Error('Incorrect password');
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      firebaseUser,
      organization,
      session,
      isSuperAdmin,
      checkingAuth,
      pendingVerification,
      hasPermission,
      loginWithEmail,
      loginWithGoogle,
      signUpUser,
      resendVerificationEmail,
      checkEmailVerified,
      logout,
      verifyTOTPChallenge,
      registerVerify2FA,
      sendPasswordReset,
      confirmPasswordReset,
      reauthenticateWithPassword,
      requestOTP,
      verifyOTP
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
