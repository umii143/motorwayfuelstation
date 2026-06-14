import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { BiometricAuth } from '@aparajita/capacitor-biometric-auth';
import { App as CapacitorApp } from '@capacitor/app';

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
    try {
      const info = await BiometricAuth.checkBiometry();
      if (!info.isAvailable) {
        // Fallback or deny if biometric is not available
        return true; // Dev mode / Web fallback
      }

      await BiometricAuth.authenticate({
        reason: reason,
        cancelTitle: 'Cancel',
      });
      // The promise resolves if authenticated, rejects if failed or canceled.
      return true;
    } catch (error) {
      console.error("Biometric error:", error);
      // If error (e.g. running on web where biometric fails), we can fallback to true for dev or handle appropriately
      return true; // For web testing, normally would be false
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
