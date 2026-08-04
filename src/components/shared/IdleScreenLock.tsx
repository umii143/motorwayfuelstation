import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAuthStore } from '../../stores/useAuthStore';
import { useStationStore } from '../../stores/useStationStore';
import { useAuth } from '../../contexts/AuthContext';
import { BiometricService } from '../../services/security/BiometricService';
import { NativeHaptics } from '../../services/hardware/Haptics';
import {
  Lock,
  Fingerprint,
  LogOut,
  MapPin,
  Delete,
  ShieldAlert,
  CheckCircle2,
} from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { motion, AnimatePresence } from 'motion/react';

const MAX_ATTEMPTS = 5;
const LOCKOUT_SECONDS = 30;
const DEFAULT_PIN_LENGTH = 6;

interface KeyButtonProps {
  label: string;
  onClick: () => void;
}

const KeyButton: React.FC<KeyButtonProps> = ({ label, onClick }) => (
  <motion.button
    whileTap={{ scale: 0.92 }}
    onClick={onClick}
    aria-label={`Key ${label}`}
    className="h-14 sm:h-16 rounded-2xl bg-white/5 hover:bg-white/15 border border-white/10 hover:border-orange-500/40 text-xl sm:text-2xl font-bold text-white transition-colors active:bg-white/20"
  >
    {label}
  </motion.button>
);

export default function IdleScreenLock() {
  const { isScreenLocked, setScreenLocked } = useAuthStore();
  const { settings } = useStationStore();
  const { logout } = useAuth();

  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [attempts, setAttempts] = useState(0);
  const [lockoutRemaining, setLockoutRemaining] = useState(0);
  const [lockoutTotal, setLockoutTotal] = useState(LOCKOUT_SECONDS);
  const [unlocked, setUnlocked] = useState(false);
  const [shakeKey, setShakeKey] = useState(0);
  const [currentTime, setCurrentTime] = useState(new Date());

  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const unlockTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const screenLockEnabled = settings.security?.screenLockEnabled ?? false;
  const timeoutMinutes = settings.security?.sessionTimeoutMinutes ?? 0;
  const stationName = settings.stationName || 'Fuel Station';
  const stationUrduName = settings.stationUrduName || 'فیول اسٹیشن';
  const stationAddress = settings.address || '';
  const biometricAvailable = Boolean(settings.security?.biometricEnabled) && Capacitor.isNativePlatform();

  // ─── Live clock ───────────────────────────────────────────────
  useEffect(() => {
    if (!isScreenLocked) return;
    const interval = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, [isScreenLocked]);

  // ─── Idle detection logic ─────────────────────────────────────
  const handleActivity = useCallback(() => {
    if (!screenLockEnabled || timeoutMinutes <= 0 || isScreenLocked) return;
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
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
        }, 1000);
      }
    };

    events.forEach((event) => {
      window.addEventListener(event, throttleActivity, { passive: true });
    });

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      events.forEach((event) => {
        window.removeEventListener(event, throttleActivity);
      });
    };
  }, [handleActivity, screenLockEnabled, timeoutMinutes, isScreenLocked]);

  // ─── Lockout cooldown countdown ──────────────────────────────
  useEffect(() => {
    if (lockoutRemaining <= 0) return;
    const t = setInterval(() => {
      setLockoutRemaining((r) => Math.max(0, r - 1));
      if (lockoutRemaining <= 1) {
        setAttempts(0);
        setError('');
      }
    }, 1000);
    return () => clearInterval(t);
  }, [lockoutRemaining]);

  // ─── Cleanup unlock timer ─────────────────────────────────────
  useEffect(() => {
    return () => {
      if (unlockTimeoutRef.current) clearTimeout(unlockTimeoutRef.current);
    };
  }, []);

  // ─── Valid PIN sources (settings-first, device fallback) ──────
  const getValidPins = useCallback((): Set<string> => {
    const pins = new Set<string>();
    const sec = settings.security;
    if (sec?.screenLockPin?.trim()) pins.add(sec.screenLockPin.trim());
    if (sec?.masterPin?.trim()) pins.add(sec.masterPin.trim());
    const devicePin = localStorage.getItem('fuelpro_device_pin');
    if (devicePin?.trim()) pins.add(devicePin.trim());
    // Last-resort default only when nothing is configured, to avoid deadlocks
    if (pins.size === 0) pins.add('123456');
    return pins;
  }, [settings]);

  // Any real PIN configured (vs the last-resort default)?
  const hasConfiguredPin = [...getValidPins()].some((p) => p !== '123456');

  // Display length: longest configured PIN, or the default 6. Submission is
  // length-agnostic: any configured PIN is accepted the moment it is fully typed.
  const pinLength = useMemo(() => {
    const pins = [...getValidPins()];
    const lengths = pins.map((p) => p.length).filter((l) => l >= 4);
    return lengths.length ? Math.max(...lengths) : DEFAULT_PIN_LENGTH;
  }, [getValidPins]);

  // ─── Unlock flow ──────────────────────────────────────────────
  const finishUnlock = useCallback(() => {
    if (unlocked) return;
    setError('');
    setUnlocked(true);
    NativeHaptics.success();
    unlockTimeoutRef.current = setTimeout(() => {
      setScreenLocked(false);
      setPin('');
      setError('');
      setAttempts(0);
      setUnlocked(false);
    }, 700);
  }, [unlocked, setScreenLocked]);

  const handleWrongPin = () => {
    const next = attempts + 1;
    setAttempts(next);
    setPin('');
    setShakeKey((k) => k + 1);
    NativeHaptics.heavyClick();
    NativeHaptics.error();
    NativeHaptics.vibrate(400);

    if (next >= MAX_ATTEMPTS) {
      setLockoutTotal(LOCKOUT_SECONDS);
      setLockoutRemaining(LOCKOUT_SECONDS);
      setError(`Too many failed attempts. Locked for ${LOCKOUT_SECONDS} seconds.`);
    } else {
      const remaining = MAX_ATTEMPTS - next;
      setError(`Invalid PIN. ${remaining} attempt${remaining === 1 ? '' : 's'} remaining.`);
    }
  };

  const verifyPin = (enteredPin: string) => {
    if (lockoutRemaining > 0 || unlocked) return;
    if (!enteredPin) return;

    // If no PIN is configured at all, unlock instantly to prevent deadlocks
    // (no success animation — nothing was actually verified)
    if (!hasConfiguredPin) {
      setScreenLocked(false);
      setPin('');
      setError('');
      setAttempts(0);
      return;
    }

    if (getValidPins().has(enteredPin)) {
      finishUnlock();
    } else {
      handleWrongPin();
    }
  };

  const handleKeyPress = (key: string) => {
    if (lockoutRemaining > 0 || unlocked || !isScreenLocked) return;

    if (key === 'del') {
      setPin((prev) => prev.slice(0, -1));
      setError('');
      return;
    }
    if (!/^\d$/.test(key)) return;
    if (pin.length >= pinLength) return;

    setError('');
    NativeHaptics.lightClick();
    const next = pin + key;
    setPin(next);
    if (getValidPins().has(next) || next.length >= pinLength) {
      verifyPin(next);
    }
  };

  // ─── Physical keyboard support (bound once, always reads fresh state) ─
  const keyHandlerRef = useRef<(e: KeyboardEvent) => void>(() => {});

  useEffect(() => {
    keyHandlerRef.current = (e: KeyboardEvent) => {
      if (!isScreenLocked) return;
      if (e.key >= '0' && e.key <= '9') handleKeyPress(e.key);
      else if (e.key === 'Backspace') handleKeyPress('del');
      else if (e.key === 'Enter' && pin.length === pinLength) verifyPin(pin);
      else if (e.key === 'Escape') {
        setPin('');
        setError('');
      }
    };
  });

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => keyHandlerRef.current(e);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // ─── Biometric flow ───────────────────────────────────────────
  const handleBiometric = async () => {
    if (lockoutRemaining > 0 || unlocked || !isScreenLocked) return;
    NativeHaptics.lightClick();
    // BiometricService already resolves to false on failure/cancel — no throw path
    const success = await BiometricService.authenticate('Unlock FuelPro Enterprise');
    if (success) {
      finishUnlock();
    } else {
      NativeHaptics.error();
      setError('Biometric authentication unavailable. Please use your PIN.');
      setShakeKey((k) => k + 1);
    }
  };

  // ─── Sign out ─────────────────────────────────────────────────
  const handleSignOut = async () => {
    NativeHaptics.heavyClick();
    await logout();
    window.location.reload();
  };

  if (!isScreenLocked) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="fixed inset-0 z-[9999] overflow-y-auto overflow-x-hidden font-sans bg-[#02050A]"
    >
      {/* Cinematic CSS-only background (offline-safe, no external assets) */}
      <div className="fixed inset-0 bg-gradient-to-b from-[#030812] via-[#050B14] to-[#02050A]" />
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_50%_-10%,rgba(255,120,20,0.16),transparent_55%)] pointer-events-none" />
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_85%_110%,rgba(255,100,0,0.10),transparent_50%)] pointer-events-none" />
      <div
        className="fixed inset-0 opacity-[0.04] mix-blend-overlay pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
          backgroundSize: '24px 24px',
        }}
      />

      <div className="relative z-10 min-h-full flex flex-col items-center justify-between gap-6 px-4 py-8">
        {/* ─── Top: Live clock + station badge ─────────────────── */}
        <header className="w-full max-w-md flex flex-col items-center pt-2">
          <motion.time
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-6xl sm:text-7xl font-black text-white tracking-tighter drop-shadow-lg tabular-nums"
          >
            {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </motion.time>
          <p className="text-white/60 font-semibold mt-1.5 tracking-wide">
            {currentTime.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
          <div className="flex items-center gap-2 mt-4 bg-white/5 border border-white/10 rounded-full px-4 py-1.5">
            <MapPin className="w-3.5 h-3.5 text-orange-400" />
            <span className="text-xs font-bold text-white/80">{stationName}</span>
            <span className="text-white/30">•</span>
            <span className="text-xs font-semibold text-white/50">{stationUrduName}</span>
          </div>
        </header>

        {/* ─── Center: Auth card ───────────────────────────────── */}
        <div className="w-full flex flex-col items-center">
          <motion.div
            key={shakeKey}
            animate={shakeKey > 0 ? { x: [0, -12, 12, -9, 9, -5, 5, 0] } : { x: 0 }}
            transition={{ duration: 0.45 }}
            className="w-[92%] max-w-sm bg-[#0B1424]/90 backdrop-blur-2xl border border-white/10 rounded-3xl p-6 sm:p-7 shadow-[0_20px_60px_rgba(0,0,0,0.55)] flex flex-col items-center text-center"
          >
            {/* Glowing shield */}
            <div className="relative flex items-center justify-center mb-5">
              <motion.div
                animate={{ scale: [1, 1.5], opacity: [0.5, 0] }}
                transition={{ repeat: Infinity, duration: 2.2, ease: 'linear' }}
                className="absolute w-16 h-16 border border-orange-500/40 rounded-full"
              />
              <motion.div
                animate={{ scale: [1, 1.9], opacity: [0.25, 0] }}
                transition={{ repeat: Infinity, duration: 2.2, ease: 'linear', delay: 0.7 }}
                className="absolute w-16 h-16 border border-orange-500/20 rounded-full"
              />
              <div
                className={`relative z-10 p-4 rounded-2xl border-2 bg-[#0B1424] shadow-[0_0_30px_rgba(255,100,0,0.3)] transition-colors duration-500 ${
                  unlocked ? 'border-emerald-400' : error ? 'border-rose-500' : 'border-orange-500'
                }`}
              >
                {unlocked ? (
                  <CheckCircle2 className="w-7 h-7 text-emerald-400" />
                ) : (
                  <Lock className="w-7 h-7 text-orange-500" strokeWidth={1.5} />
                )}
              </div>
            </div>

            <h1 className="text-2xl font-black text-white tracking-tight">
              {unlocked ? 'Session Resumed' : 'Station Locked'}
            </h1>
            <p className="text-orange-400 font-[Noto_Nastaliq_Urdu] text-base mt-1">
              {unlocked ? 'سیشن دوبارہ شروع ہو گیا' : 'اسٹیشن لاک ہے'}
            </p>
            <p className="text-white/50 text-xs font-medium mt-2 max-w-[260px]">
              {lockoutRemaining > 0
                ? 'Too many attempts detected. Please wait for the security cooldown to finish.'
                : `Enter your ${pinLength}-digit PIN to resume your session securely.`}
            </p>

            {/* Screen-reader status announcement */}
            <span className="sr-only" aria-live="polite">
              {unlocked
                ? 'Unlocked'
                : lockoutRemaining > 0
                  ? `Locked for ${lockoutRemaining} seconds`
                  : error || `${pin.length} of ${pinLength} digits entered`}
            </span>

            {/* Error banner */}
            <AnimatePresence>
              {error && !unlocked && (
                <motion.p
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="text-rose-400 text-sm font-bold mt-4"
                >
                  {error}
                </motion.p>
              )}
            </AnimatePresence>

            {/* ─── Lockout panel ─────────────────────────────── */}
            {lockoutRemaining > 0 ? (
              <div className="w-full flex flex-col items-center py-8">
                <ShieldAlert className="w-10 h-10 text-rose-500 mb-3" />
                <p className="text-white font-bold">Vault Temporarily Locked</p>
                <p className="text-rose-400 text-sm font-semibold mt-1">
                  Try again in {lockoutRemaining}s
                </p>
                <div className="w-48 h-1.5 bg-white/10 rounded-full mt-5 overflow-hidden">
                  <div
                    className="h-full bg-rose-500 rounded-full transition-all duration-1000"
                    style={{ width: `${(lockoutRemaining / lockoutTotal) * 100}%` }}
                  />
                </div>
              </div>
            ) : (
              <div className="w-full mt-6 space-y-5">
                {/* PIN dots */}
                <div className="flex items-center justify-center gap-3" aria-live="polite">
                  {Array.from({ length: pinLength }).map((_, i) => (
                    <motion.div
                      key={i}
                      animate={{
                        scale: i < pin.length ? [1, 1.35, 1] : 1,
                        y: i < pin.length ? [0, -6, 0] : 0,
                      }}
                      transition={{ duration: 0.25 }}
                      className={`w-3.5 h-3.5 rounded-full transition-colors duration-200 ${
                        i < pin.length
                          ? 'bg-orange-500 shadow-[0_0_12px_rgba(255,140,20,0.8)]'
                          : error
                            ? 'bg-rose-500/70'
                            : 'bg-white/15 border border-white/20'
                      }`}
                    />
                  ))}
                </div>

                {/* Keypad */}
                <div className="grid grid-cols-3 gap-3 w-full">
                  {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((k) => (
                    <KeyButton key={k} label={k} onClick={() => handleKeyPress(k)} />
                  ))}
                  {biometricAvailable ? (
                    <motion.button
                      whileTap={{ scale: 0.92 }}
                      onClick={handleBiometric}
                      aria-label="Use biometrics"
                      className="h-14 sm:h-16 rounded-2xl bg-orange-500/15 hover:bg-orange-500/25 border border-orange-500/30 text-orange-400 flex items-center justify-center transition-colors cursor-pointer"
                    >
                      <Fingerprint className="w-6 h-6" />
                    </motion.button>
                  ) : (
                    <div />
                  )}
                  <KeyButton label="0" onClick={() => handleKeyPress('0')} />
                  <motion.button
                    whileTap={{ scale: 0.92 }}
                    onClick={() => handleKeyPress('del')}
                    aria-label="Delete"
                    className="h-14 sm:h-16 rounded-2xl bg-white/5 hover:bg-white/15 border border-white/10 text-white/60 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                  >
                    <Delete className="w-6 h-6" />
                  </motion.button>
                </div>

                {pin.length > 0 && (
                  <button
                    onClick={() => {
                      setPin('');
                      setError('');
                    }}
                    className="w-full text-center text-xs text-white/40 hover:text-white/80 font-semibold transition-colors cursor-pointer"
                  >
                    Clear PIN
                  </button>
                )}
              </div>
            )}
          </motion.div>

          {/* Sign out */}
          <button
            onClick={handleSignOut}
            className="w-[92%] max-w-sm mt-5 bg-white/5 backdrop-blur-md border border-white/10 hover:border-orange-500/40 hover:bg-white/10 text-white/70 hover:text-white font-semibold py-3.5 rounded-2xl flex items-center justify-center gap-3 transition-all active:scale-[0.98] cursor-pointer"
          >
            <LogOut className="w-5 h-5 text-orange-500/70" />
            <span>Sign Out Instead</span>
          </button>
        </div>

        {/* ─── Footer branding ─────────────────────────────────── */}
        <footer className="w-full max-w-md flex flex-col items-center pt-2 pb-1">
          <div className="flex items-center gap-3 mb-2 opacity-70">
            <div className="w-8 h-px bg-orange-500" />
            <span className="text-[10px] font-bold text-orange-500 tracking-[0.25em] uppercase">
              Powered By
            </span>
            <div className="w-8 h-px bg-orange-500" />
          </div>
          <p className="text-white/40 text-[11px] font-medium mt-1 flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-orange-600" />
            {stationAddress || stationName}
          </p>
        </footer>
      </div>

      {/* ─── Success overlay ───────────────────────────────────── */}
      <AnimatePresence>
        {unlocked && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[10001] bg-[#02050A]/90 backdrop-blur-xl flex flex-col items-center justify-center"
          >
            <motion.div
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 260, damping: 20 }}
              className="w-24 h-24 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-[0_0_60px_rgba(16,185,129,0.5)]"
            >
              <CheckCircle2 className="w-12 h-12 text-white" />
            </motion.div>
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mt-6 text-white text-xl font-bold tracking-wide"
            >
              Welcome Back
            </motion.p>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.35 }}
              className="text-orange-400 font-[Noto_Nastaliq_Urdu] text-lg mt-1"
            >
              خوش آمدید
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
