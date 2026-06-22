import React, { useState, useEffect } from 'react';
import { Fingerprint, Delete, ShieldAlert } from 'lucide-react';
import { useNativeAuth } from '../../contexts/NativeAuthContext';

interface ScreenLockProps {
  stationName: string;
  address: string;
  logoUrl?: string;
  correctPin: string;
  biometricEnabled: boolean;
  onUnlock: () => void;
  onEmergencyLogout: () => void;
}

export default function ScreenLock({
  stationName,
  address,
  logoUrl,
  correctPin,
  biometricEnabled,
  onUnlock,
  onEmergencyLogout
}: ScreenLockProps) {
  const { requireBiometric } = useNativeAuth();
  const [pin, setPin] = useState('');
  const [errorText, setErrorText] = useState('');
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockoutUntil, setLockoutUntil] = useState<number | null>(null);
  
  // Shake animation state
  const [shake, setShake] = useState(false);

  useEffect(() => {
    // Check if lockout has expired
    let interval: NodeJS.Timeout;
    if (lockoutUntil) {
      interval = setInterval(() => {
        if (Date.now() > lockoutUntil) {
          setLockoutUntil(null);
          setFailedAttempts(0); // Reset after timeout
          setErrorText('');
        }
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [lockoutUntil]);

  const triggerShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 500);
  };

  const handleKeyPress = (key: string) => {
    if (lockoutUntil) return;

    setErrorText('');
    if (pin.length < 6) {
      const newPin = pin + key;
      setPin(newPin);
      
      if (newPin.length === 6) {
        verifyPin(newPin);
      }
    }
  };

  const handleDelete = () => {
    if (lockoutUntil) return;
    setPin(prev => prev.slice(0, -1));
    setErrorText('');
  };

  const verifyPin = (enteredPin: string) => {
    if (enteredPin === correctPin) {
      setFailedAttempts(0);
      onUnlock();
    } else {
      const newAttempts = failedAttempts + 1;
      setFailedAttempts(newAttempts);
      setPin('');
      triggerShake();
      
      if (newAttempts >= 10) {
        onEmergencyLogout();
      } else if (newAttempts >= 5) {
        setLockoutUntil(Date.now() + 5 * 60 * 1000); // Lock for 5 mins
        setErrorText('Too many failed attempts. Locked for 5 minutes.');
      } else {
        setErrorText(`Incorrect PIN. ${5 - newAttempts} attempts remaining.`);
      }
    }
  };

  const handleBiometric = async () => {
    if (!biometricEnabled || lockoutUntil) return;
    try {
      const success = await requireBiometric('Unlock FuelPro');
      if (success) {
        setFailedAttempts(0);
        onUnlock();
      } else {
        triggerShake();
        setErrorText('Biometric authentication failed.');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const getLockoutRemaining = () => {
    if (!lockoutUntil) return '';
    const diff = Math.ceil((lockoutUntil - Date.now()) / 1000);
    const m = Math.floor(diff / 60);
    const s = diff % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-slate-900/60 backdrop-blur-xl flex flex-col items-center justify-center p-4">
      <div className="absolute inset-0 bg-[url('/station-bg.jpg')] bg-cover bg-center opacity-10 mix-blend-overlay pointer-events-none" />
      
      <div className={`relative w-full max-w-sm bg-white/10 backdrop-blur-2xl border border-white/20 p-8 rounded-3xl shadow-2xl flex flex-col items-center text-center transition-transform ${shake ? 'animate-shake' : ''}`}>
        
        {logoUrl ? (
          <img src={logoUrl} alt="Logo" className="w-16 h-16 rounded-xl shadow-lg mb-4 object-cover" />
        ) : (
          <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg mb-4">
            <ShieldAlert className="h-8 w-8 text-white" />
          </div>
        )}

        <h1 className="text-xl font-bold text-white tracking-wide">🔒 FuelPro Secure Lock</h1>
        <h2 className="text-sm font-semibold text-white/80 mt-1">{stationName}</h2>
        <p className="text-xs text-white/50">{address}</p>

        {lockoutUntil ? (
          <div className="mt-8 mb-6 h-12 flex flex-col items-center justify-center">
            <p className="text-rose-400 font-bold text-sm bg-rose-500/10 px-4 py-2 rounded-lg border border-rose-500/20">
              Locked. Try again in {getLockoutRemaining()}
            </p>
          </div>
        ) : (
          <div className="mt-8 mb-6 h-12 flex flex-col items-center justify-center space-y-2">
            <div className="flex gap-3 justify-center">
              {[...Array(6)].map((_, i) => (
                <div 
                  key={i} 
                  className={`w-3.5 h-3.5 rounded-full transition-all duration-300 ${i < pin.length ? 'bg-white scale-110 shadow-[0_0_10px_rgba(255,255,255,0.8)]' : 'bg-white/20'}`}
                />
              ))}
            </div>
            {errorText && <p className="text-rose-400 text-xs font-bold animate-in fade-in">{errorText}</p>}
          </div>
        )}

        {/* Keypad */}
        <div className="grid grid-cols-3 gap-4 w-full mt-4">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
            <button
              key={num}
              onClick={() => handleKeyPress(num.toString())}
              disabled={!!lockoutUntil}
              className="h-16 rounded-2xl bg-white/5 hover:bg-white/15 active:bg-white/20 border border-white/10 text-2xl font-semibold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {num}
            </button>
          ))}
          
          <button
            onClick={handleBiometric}
            disabled={!biometricEnabled || !!lockoutUntil}
            className={`h-16 rounded-2xl flex items-center justify-center transition-all ${biometricEnabled && !lockoutUntil ? 'bg-amber-500/20 text-amber-400 border-amber-500/30 hover:bg-amber-500/30' : 'bg-white/5 text-white/20 border-white/5'}`}
          >
            <Fingerprint className="w-8 h-8" />
          </button>
          
          <button
            onClick={() => handleKeyPress('0')}
            disabled={!!lockoutUntil}
            className="h-16 rounded-2xl bg-white/5 hover:bg-white/15 active:bg-white/20 border border-white/10 text-2xl font-semibold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            0
          </button>
          
          <button
            onClick={handleDelete}
            disabled={pin.length === 0 || !!lockoutUntil}
            className="h-16 rounded-2xl bg-white/5 hover:bg-white/15 active:bg-white/20 border border-white/10 flex items-center justify-center text-white/80 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <Delete className="w-7 h-7" />
          </button>
        </div>
      </div>
    </div>
  );
}
