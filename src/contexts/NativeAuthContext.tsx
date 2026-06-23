import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { BiometricAuth } from '@aparajita/capacitor-biometric-auth';
import { App as CapacitorApp } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';

interface NativeAuthContextType {
  isLocked: boolean;
  unlock: () => Promise<boolean>;
  requireBiometric: (reason: string) => Promise<boolean>;
  lockApp: () => void;
  forceUnlock: () => void;
}

const NativeAuthContext = createContext<NativeAuthContextType | undefined>(undefined);

export const NativeAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isLocked, setIsLocked] = useState(false);
  const [backgroundTime, setBackgroundTime] = useState<number | null>(null);

  useEffect(() => {
    // Listen to App state changes
    const listener = CapacitorApp.addListener('appStateChange', ({ isActive }) => {
      if (!isActive) {
        setBackgroundTime(Date.now());
      } else {
        if (backgroundTime) {
          const timeInBackground = Date.now() - backgroundTime;
          // Lock after 2 minutes (120,000 ms)
          if (timeInBackground > 120000) {
            setIsLocked(true);
          }
        }
        setBackgroundTime(null);
      }
    });

    return () => {
      listener.then(l => l.remove());
    };
  }, [backgroundTime]);

  const requireBiometric = useCallback(async (reason: string): Promise<boolean> => {
    if (!Capacitor.isNativePlatform()) {
      return true; // Auto-pass for web development
    }
    
    try {
      const info = await BiometricAuth.checkBiometry();
      if (!info.isAvailable) {
        // eslint-disable-next-line no-console
        console.warn("Biometrics not available on device");
        return false; // Real device without biometry fails security check
      }

      await BiometricAuth.authenticate({
        reason: reason,
        cancelTitle: 'Cancel',
      });
      // The promise resolves if authenticated, rejects if failed or canceled.
      return true;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Biometric error:", error);
      // FAILED AUTHENTICATION
      return false; 
    }
  }, []);

  const unlock = async () => {
    const success = await requireBiometric('Unlock FuelPro Enterprise');
    if (success) {
      setIsLocked(false);
    }
    return success;
  };

  const lockApp = () => {
    setIsLocked(true);
  };

  const forceUnlock = () => {
    setIsLocked(false);
  };

  return (
    <NativeAuthContext.Provider value={{ isLocked, unlock, requireBiometric, lockApp, forceUnlock }}>
      {children}
    </NativeAuthContext.Provider>
  );
};

export const useNativeAuth = () => {
  const context = useContext(NativeAuthContext);
  if (!context) {
    throw new Error('useNativeAuth must be used within NativeAuthProvider');
  }
  return context;
};
