import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  User as FirebaseUser, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  confirmPasswordReset as fbConfirmPasswordReset,
  signOut, 
  onAuthStateChanged 
} from 'firebase/auth';
import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  collection, 
  addDoc, 
  onSnapshot 
} from 'firebase/firestore';
import { auth, dbFS, signInWithGoogle as googleSignIn } from '../lib/firebase';

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
  checkingAuth: boolean;
  hasPermission: (permission: string) => boolean;
  loginWithEmail: (email: string, password: string) => Promise<any>;
  loginWithGoogle: () => Promise<any>;
  signUpUser: (email: string, password: string) => Promise<any>;
  logout: () => Promise<void>;
  verifyTOTPChallenge: (code: string, tempToken: string) => Promise<any>;
  registerVerify2FA: (code: string, tempToken: string) => Promise<any>;
  sendPasswordReset: (email: string) => Promise<void>;
  confirmPasswordReset: (token: string, newPass: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const ROLE_PERMISSIONS: Record<'owner' | 'manager' | 'staff', string[]> = {
  owner: [
    'reports.view', 'reports.export', 'dashboard.view', 'shift.close', 
    'inventory.edit', 'users.manage', 'billing.manage', 'settings.manage'
  ],
  manager: [
    'reports.view', 'dashboard.view', 'shift.close', 'inventory.edit', 'settings.manage'
  ],
  staff: [
    'dashboard.view', 'shift.close'
  ]
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [session, setSession] = useState<UserSession | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  // Monitor auth state changes AND local Express token
  useEffect(() => {
    let active = true;

    const checkLocalToken = async () => {
      // In a pure Firebase implementation, we rely on onAuthStateChanged.
      // We don't need the legacy /api/auth/me fallback.
      if (!auth.currentUser && active) {
        setCheckingAuth(false);
      }
    };

    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (!active) return;
      setFirebaseUser(fbUser);
      if (fbUser) {
        try {
          const userDocRef = doc(dbFS, 'users', fbUser.uid);
          const userSnap = await getDoc(userDocRef);

          if (userSnap.exists()) {
            const profile = userSnap.data() as UserProfile;
            setUser(profile);

            if (profile.orgId) {
              const orgDocRef = doc(dbFS, 'organizations', profile.orgId);
              const orgSnap = await getDoc(orgDocRef);
              if (orgSnap.exists()) {
                setOrganization(orgSnap.data() as Organization);
              }
            }

            await syncSessionState(fbUser, profile.orgId);
          } else {
            setUser(null);
            setOrganization(null);
            setSession(null);
          }
        } catch (error) {
          console.error("Error loading user SaaS contexts:", error);
        }
        setCheckingAuth(false);
      } else {
        checkLocalToken();
      }
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  // Monitor active session status and force logout if revoked
  useEffect(() => {
    if (!user || !session) return;
    
    // Subscribe to session doc
    const sessionRef = doc(dbFS, 'sessions', session.id);
    const unsubSession = onSnapshot(sessionRef, (snap) => {
      if (snap.exists()) {
        const sessData = snap.data() as UserSession;
        setSession(sessData);
        if (sessData.status === 'revoked') {
          console.warn("Session revoked administratively. Logging out.");
          logout();
        }
      }
    });

    return unsubSession;
  }, [user, session?.id]);

  // Sync / sessions registry
  const syncSessionState = async (fbUser: FirebaseUser, orgId: string) => {
    const userAgent = navigator.userAgent;
    const browserName = getBrowserName(userAgent);
    const ip = "127.0.0.1"; // Stub/fallback for local dev environment

    const sessionId = localStorage.getItem('fuelpro_current_session_id') || `sess_${Date.now()}`;
    localStorage.setItem('fuelpro_current_session_id', sessionId);

    const sessionRef = doc(dbFS, 'sessions', sessionId);
    const sessionSnap = await getDoc(sessionRef);

    const sessionData: UserSession = {
      id: sessionId,
      userId: fbUser.uid,
      email: fbUser.email || '',
      deviceName: userAgent,
      browser: browserName,
      ipHistory: sessionSnap.exists() ? Array.from(new Set([...(sessionSnap.data()?.ipHistory || []), ip])) : [ip],
      loginTimestamp: sessionSnap.exists() ? sessionSnap.data()?.loginTimestamp : new Date().toISOString(),
      lastActivity: new Date().toISOString(),
      status: sessionSnap.exists() ? sessionSnap.data()?.status || 'active' : 'active'
    };

    await setDoc(sessionRef, sessionData, { merge: true });
    setSession(sessionData);

    // If session is revoked, throw error immediately
    if (sessionData.status === 'revoked') {
      logout();
      throw new Error("Terminal session is blocked or revoked.");
    }
  };

  const getBrowserName = (ua: string): string => {
    if (ua.includes("Firefox")) return "Firefox";
    if (ua.includes("Chrome")) return "Chrome";
    if (ua.includes("Safari") && !ua.includes("Chrome")) return "Safari";
    if (ua.includes("Edge")) return "Edge";
    return "Unknown Browser";
  };

  const hasPermission = (permission: string): boolean => {
    if (!user) return false;
    // Blocked/suspended users have no permissions
    if (user.status === 'suspended' || user.status === 'blocked') return false;
    // Check trial expiry
    if (organization?.subscriptionStatus === 'expired') {
      return permission === 'billing.manage'; // expired orgs can only pay
    }
    return user.permissions.includes(permission);
  };

  const loginWithEmail = async (email: string, password: string) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      // For MFA demo, we always bypass real TOTP in this client-only demo unless configured
      const userDocRef = doc(dbFS, 'users', userCredential.user.uid);
      const userSnap = await getDoc(userDocRef);
      const hasMfa = userSnap.exists() && userSnap.data()?.totpEnabled;
      
      if (hasMfa) {
        return { mfaRequired: true, tempMfaToken: "mock_token_" + userCredential.user.uid };
      }
      
      return { mfaRequired: false, user: userCredential.user };
    } catch (error: any) {
      throw new Error(error.message || "Authentication failed.");
    }
  };

  const verifyTOTPChallenge = async (code: string, tempToken: string) => {
    // Client-side mock verification for TOTP
    if (code !== '000000') {
      throw new Error("Invalid TOTP Code.");
    }
    
    // In a real app, this would be a cloud function that verifies the token
    // For now, since they already authenticated with Firebase, we just let them proceed
    const uid = tempToken.replace("mock_token_", "");
    return { token: "firebase_session", user: { id: uid } };
  };

  const signUpUser = async (email: string, password: string) => {
    try {
      // Create user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      // We generate a mock TOTP challenge for them
      return {
        tempRegisterToken: "mock_reg_" + userCredential.user.uid,
        base32Secret: "JBSWY3DPEHPK3PXP",
        qrCodeUrl: "",
        otpauthUrl: `otpauth://totp/FuelPro:${email}?secret=JBSWY3DPEHPK3PXP&issuer=FuelPro`
      };
    } catch (error: any) {
      throw new Error(error.message || "Sign up failed.");
    }
  };

  const registerVerify2FA = async (code: string, tempToken: string) => {
    if (code !== '000000') {
      throw new Error("Invalid TOTP verification code.");
    }
    
    const userId = tempToken.replace("mock_reg_", "");
    const orgId = `org_${Date.now()}`;
    const email = auth.currentUser?.email || '';
    
    const userProfile: UserProfile = {
      uid: userId,
      email: email,
      role: 'owner',
      orgId,
      status: 'active',
      permissions: ROLE_PERMISSIONS['owner'],
      totpEnabled: true,
      createdAt: new Date().toISOString()
    };

    const trialStart = new Date();
    const trialEnd = new Date();
    trialEnd.setDate(trialStart.getDate() + 7);

    const orgProfile: Organization = {
      orgId,
      name: 'PSO Fuel Terminal Organization',
      subscriptionStatus: 'trialing',
      subscriptionTier: 'trial',
      trialStartDate: trialStart.toISOString(),
      trialEndDate: trialEnd.toISOString(),
      ownerId: userId,
      createdAt: new Date().toISOString()
    };

    // Save to Firestore collections
    await setDoc(doc(dbFS, 'users', userId), userProfile);
    await setDoc(doc(dbFS, 'organizations', orgId), orgProfile);

    // Save initial audit log
    const auditLog = {
      id: `aud_${Date.now()}`,
      userId,
      email: email,
      action: 'organization_signup',
      details: `New SaaS organization created with 7-day trial. Tier: ${orgProfile.subscriptionTier.toUpperCase()}`,
      ip: '127.0.0.1',
      device: navigator.userAgent,
      timestamp: new Date().toISOString()
    };
    await setDoc(doc(dbFS, 'auditLogs', auditLog.id), auditLog);

    return { user: userProfile, token: "firebase_session" };
  };

  const loginWithGoogle = async () => {
    const { user: fbUser, token } = await googleSignIn();
    
    // Fetch or check profile
    const userDocRef = doc(dbFS, 'users', fbUser.uid);
    let userSnap = await getDoc(userDocRef);
    let profile: UserProfile;

    if (!userSnap.exists()) {
      // Create new tenant organization
      const orgId = `org_${Date.now()}`;
      
      profile = {
        uid: fbUser.uid,
        email: fbUser.email || '',
        role: 'owner',
        orgId,
        status: 'active',
        permissions: ROLE_PERMISSIONS.owner,
        totpEnabled: false,
        createdAt: new Date().toISOString()
      };

      const trialStart = new Date();
      const trialEnd = new Date();
      trialEnd.setDate(trialStart.getDate() + 7);

      const orgProfile: Organization = {
        orgId,
        name: `${fbUser.displayName || 'Google'} Station Group`,
        subscriptionStatus: 'trialing',
        subscriptionTier: 'trial',
        trialStartDate: trialStart.toISOString(),
        trialEndDate: trialEnd.toISOString(),
        ownerId: fbUser.uid,
        createdAt: new Date().toISOString()
      };

      await setDoc(doc(dbFS, 'users', fbUser.uid), profile);
      await setDoc(doc(dbFS, 'organizations', orgId), orgProfile);

      // Audit logs
      const auditLog = {
        id: `aud_${Date.now()}`,
        userId: fbUser.uid,
        email: fbUser.email || '',
        action: 'organization_signup_google',
        details: `Google signed organization created. Tier: TRIAL`,
        ip: '127.0.0.1',
        device: navigator.userAgent,
        timestamp: new Date().toISOString()
      };
      await setDoc(doc(dbFS, 'auditLogs', auditLog.id), auditLog);
      
      setOrganization(orgProfile);
    } else {
      profile = userSnap.data() as UserProfile;
      const orgSnap = await getDoc(doc(dbFS, 'organizations', profile.orgId));
      if (orgSnap.exists()) {
        setOrganization(orgSnap.data() as Organization);
      }
    }

    setUser(profile);
    await syncSessionState(fbUser, profile.orgId);
    
    // Call server Google link to sync session
    // (Deprecated, handled via onAuthStateChanged)
    
    return { user: profile };
  };

  const logout = async () => {
    try {
      if (session) {
        // Mark session inactive
        await updateDoc(doc(dbFS, 'sessions', session.id), { status: 'revoked' });
      }
      await signOut(auth);
    } catch (err) {
      console.error("Firebase logout error:", err);
    } finally {
      localStorage.removeItem('fuelpro_auth_token');
      localStorage.removeItem('fuelpro_google_access_token');
      localStorage.removeItem('fuelpro_current_session_id');
      setUser(null);
      setOrganization(null);
      setSession(null);
    }
  };

  const sendPasswordReset = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error: any) {
      throw new Error(error.message || "Password reset initiation failed.");
    }
  };

  const confirmPasswordReset = async (token: string, newPass: string) => {
    try {
      await fbConfirmPasswordReset(auth, token, newPass);
    } catch (error: any) {
      throw new Error(error.message || "Failed to update password.");
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      firebaseUser,
      organization,
      session,
      checkingAuth,
      hasPermission,
      loginWithEmail,
      loginWithGoogle,
      signUpUser,
      logout,
      verifyTOTPChallenge,
      registerVerify2FA,
      sendPasswordReset,
      confirmPasswordReset
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
