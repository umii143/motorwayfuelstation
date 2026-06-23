import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useAuthStore } from '../../stores/useAuthStore';
import { useStationStore } from '../../stores/useStationStore';
import { Lock, ShieldAlert, Fingerprint, MapPin } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function IdleScreenLock() {
  const { isScreenLocked, setScreenLocked } = useAuthStore();
  const { settings } = useStationStore();
  
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockoutTime, setLockoutTime] = useState<number | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const screenLockEnabled = settings.security?.screenLockEnabled ?? false;
  const timeoutMinutes = settings.security?.sessionTimeoutMinutes ?? 0;
  const stationName = settings.stationName || 'Fuel Station';

  // --- Clock update ---
  useEffect(() => {
    if (!isScreenLocked) return;
    const interval = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, [isScreenLocked]);

  // --- Idle Detection Logic ---
  const handleActivity = useCallback(() => {
    // Only track if feature is enabled and timeout > 0, and not currently locked
    if (!screenLockEnabled || timeoutMinutes <= 0 || isScreenLocked) return;

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      setScreenLocked(true);
    }, timeoutMinutes * 60 * 1000);
  }, [screenLockEnabled, timeoutMinutes, isScreenLocked, setScreenLocked]);

  useEffect(() => {
    if (!screenLockEnabled || timeoutMinutes <= 0 || isScreenLocked) {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      return;
    }

    // Initial trigger
    handleActivity();

    const events = ['mousemove', 'keydown', 'touchstart', 'scroll', 'click'];
    
    // Throttled event listener to avoid excessive state updates
    let throttled = false;
    const throttleActivity = () => {
      if (!throttled) {
        handleActivity();
        throttled = true;
        setTimeout(() => {
          throttled = false;
        }, 1000); // Only run activity handler at most once per second
      }
    };

    events.forEach(event => {
      window.addEventListener(event, throttleActivity, { passive: true });
    });

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      events.forEach(event => {
        window.removeEventListener(event, throttleActivity);
      });
    };
  }, [handleActivity, screenLockEnabled, timeoutMinutes, isScreenLocked]);

  // --- Lockout Timer Logic ---
  useEffect(() => {
    if (lockoutTime && lockoutTime > 0) {
      const interval = setInterval(() => {
        setLockoutTime((prev) => {
          if (prev && prev > 1) return prev - 1;
          return null;
        });
      }, 1000);
      return () => clearInterval(interval);
    } else if (lockoutTime === 0) {
      // setLockoutTime(null);
    }
  }, [lockoutTime]);

  // --- PIN Handling ---
  const verifyPin = (enteredPin: string) => {
    if (lockoutTime !== null) return;
    
    if (!enteredPin) return;

    const screenLockPin = settings.security?.screenLockPin?.trim() || null;
    const masterPin = settings.security?.masterPin?.trim() || null;

    if (!screenLockPin && !masterPin) {
      // If somehow no PIN is configured at all, unlock immediately to prevent deadlocks
      unlock();
      return;
    }

    const isValid = (screenLockPin && enteredPin === screenLockPin) || (masterPin && enteredPin === masterPin);

    if (isValid) {
      unlock();
    } else {
      setError('Invalid PIN. Please try again.');
      setPin('');
      
      const newAttempts = failedAttempts + 1;
      setFailedAttempts(newAttempts);

      if (newAttempts >= 5) {
        setLockoutTime(30); // 30 seconds cooldown
        setFailedAttempts(0);
        setError('Too many failed attempts. Try again in 30 seconds.');
      }
    }
  };

  const handlePinSubmit = () => {
    verifyPin(pin.trim());
  };

  const unlock = () => {
    setScreenLocked(false);
    setPin('');
    setError('');
    setFailedAttempts(0);
    // setLockoutTime(null);
  };

  const handleKeyPress = (digit: string) => {
    if (lockoutTime !== null) return;
    setError('');
    
    if (digit === 'C') {
      setPin('');
      return;
    }
    
    if (digit === '<') {
      setPin((prev) => prev.slice(0, -1));
      return;
    }
    
    if (pin.length < 6) {
      const newPin = pin + digit;
      setPin(newPin);
      if (newPin.length === 6) {
        verifyPin(newPin);
      }
    }
  };

  // Handle physical keyboard input
  useEffect(() => {
    if (!isScreenLocked || lockoutTime !== null) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key >= '0' && e.key <= '9') {
        handleKeyPress(e.key);
      } else if (e.key === 'Backspace') {
        handleKeyPress('<');
      } else if (e.key === 'Escape' || e.key === 'Delete') {
        handleKeyPress('C');
      } else if (e.key === 'Enter') {
        handlePinSubmit();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isScreenLocked, pin, lockoutTime]);


  if (!isScreenLocked) return null;

  return (
    <AnimatePresence>
      {isScreenLocked && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-[9999] bg-slate-900/60 backdrop-blur-xl flex flex-col items-center justify-center p-4"
        >
          {/* Top Brand Banner */}
          <div className="absolute top-8 left-0 right-0 flex justify-center">
            <div className="flex flex-col items-center gap-2">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center shadow-lg border border-indigo-400/30">
                <ShieldAlert className="h-6 w-6 text-white" />
              </div>
              <h1 className="text-xl font-bold tracking-tight text-white/90 drop-shadow-md">
                Motorway Petroleum
              </h1>
              <div className="flex items-center gap-1.5 text-slate-300/80 bg-slate-800/40 px-3 py-1 rounded-full border border-slate-700/50">
                <MapPin className="h-3 w-3" />
                <span className="text-xs font-semibold">{stationName}</span>
              </div>
            </div>
          </div>

          {/* Center Clock */}
          <div className="mb-10 text-center">
            <motion.h2 
              className="text-5xl md:text-7xl font-bold tracking-tighter text-white drop-shadow-lg"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1 }}
            >
              {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </motion.h2>
            <p className="text-slate-300 font-medium mt-2 tracking-wide">
              {currentTime.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })}
            </p>
          </div>

          {/* PIN Pad Container */}
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="w-full max-w-sm bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-6 md:p-8 shadow-2xl flex flex-col items-center"
          >
            <div className="flex items-center justify-center h-12 w-12 rounded-full bg-slate-800/50 border border-slate-600/50 mb-4">
              <Lock className="h-5 w-5 text-indigo-300" />
            </div>
            
            <h3 className="text-lg font-bold text-white mb-2">Station Locked</h3>
            <p className="text-sm text-slate-300 mb-6 text-center">
              {lockoutTime !== null 
                ? `Too many attempts. Locked for ${lockoutTime}s.`
                : 'Enter your PIN or Master PIN to unlock'}
            </p>

            {/* PIN Indicators */}
            <div className="flex items-center justify-center gap-3 mb-6">
              {[...Array(6)].map((_, i) => (
                <div 
                  key={i} 
                  className={`w-3.5 h-3.5 rounded-full transition-all duration-200 ${
                    i < pin.length 
                      ? 'bg-indigo-400 scale-110 shadow-[0_0_10px_rgba(129,140,248,0.7)]' 
                      : 'bg-slate-700/50 border border-slate-600/50'
                  }`}
                />
              ))}
            </div>

            {error && !lockoutTime && (
              <motion.p 
                initial={{ opacity: 0, y: -10 }} 
                animate={{ opacity: 1, y: 0 }} 
                className="text-rose-400 text-sm font-bold mb-4 text-center"
              >
                {error}
              </motion.p>
            )}

            {/* Keypad */}
            <div className="grid grid-cols-3 gap-3 w-full">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', '<'].map((key) => (
                <button
                  key={key}
                  onClick={() => handleKeyPress(key)}
                  disabled={lockoutTime !== null}
                  className={`h-14 sm:h-16 rounded-2xl text-xl sm:text-2xl font-semibold flex items-center justify-center transition-all duration-200 ${
                    lockoutTime !== null 
                      ? 'bg-slate-800/30 text-slate-500 cursor-not-allowed'
                      : key === 'C' 
                        ? 'bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 hover:text-rose-300 border border-rose-500/20' 
                        : key === '<'
                          ? 'bg-slate-700/40 text-slate-300 hover:bg-slate-600/60 border border-slate-600/30'
                          : 'bg-white/5 text-white hover:bg-white/15 border border-white/10 hover:border-white/20 active:scale-95'
                  }`}
                >
                  {key}
                </button>
              ))}
            </div>

            {settings.security?.biometricEnabled && (
              <button className="mt-6 flex items-center gap-2 text-sm font-semibold text-indigo-300 hover:text-indigo-200 transition-colors bg-indigo-500/10 px-4 py-2 rounded-full border border-indigo-500/20">
                <Fingerprint className="h-4 w-4" />
                Unlock with Biometrics
              </button>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
