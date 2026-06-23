import { useState, useEffect, useRef, useCallback } from 'react';
import { GlobalSettings } from '../types';

export function useAppLock(settings: GlobalSettings) {
  const [isAppLocked, setIsAppLocked] = useState(false);
  const lockTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const screenLockEnabled = settings.security?.screenLockEnabled ?? false;
  const sessionTimeoutMinutes = settings.security?.sessionTimeoutMinutes ?? 5; // Default 5 mins
  const timeoutMs = sessionTimeoutMinutes * 60 * 1000;

  const lockApp = useCallback(() => {
    if (screenLockEnabled) {
      setIsAppLocked(true);
    }
  }, [screenLockEnabled]);

  const resetTimer = useCallback(() => {
    if (lockTimeoutRef.current) {
      clearTimeout(lockTimeoutRef.current);
    }
    
    if (screenLockEnabled && sessionTimeoutMinutes > 0) {
      lockTimeoutRef.current = setTimeout(lockApp, timeoutMs);
    }
  }, [screenLockEnabled, sessionTimeoutMinutes, timeoutMs, lockApp]);

  const unlockApp = useCallback(() => {
    setIsAppLocked(false);
    resetTimer();
  }, [resetTimer]);

  useEffect(() => {
    // Initial setup
    resetTimer();

    // Event listeners for activity
    const activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    const handleActivity = () => {
      if (!isAppLocked) {
        resetTimer();
      }
    };

    activityEvents.forEach(event => {
      window.addEventListener(event, handleActivity, { passive: true });
    });

    // App Lifecycle protection (Minimized, switched app, screen off)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden' && screenLockEnabled) {
        lockApp();
      } else if (document.visibilityState === 'visible' && !isAppLocked) {
        resetTimer();
      }
    };

    const handleWindowBlur = () => {
      if (screenLockEnabled) {
        lockApp();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);
    // Note: When locking on blur, it might lock when opening a select dropdown or iframe.
    // So we'll rely mainly on visibilitychange for minimizing, but adding blur covers tab switching.

    return () => {
      if (lockTimeoutRef.current) {
        clearTimeout(lockTimeoutRef.current);
      }
      activityEvents.forEach(event => {
        window.removeEventListener(event, handleActivity);
      });
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
    };
  }, [screenLockEnabled, isAppLocked, lockApp, resetTimer]);

  return {
    isAppLocked,
    unlockApp,
    lockApp
  };
}
