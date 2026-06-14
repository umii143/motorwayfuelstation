import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Lock, Fingerprint, KeyRound } from 'lucide-react';
import { useNativeAuth } from '../../contexts/NativeAuthContext';
import { useAuth } from '../../contexts/AuthContext';
import { BiometricService } from '../../services/security/BiometricService';
import { NativeHaptics } from '../../services/hardware/Haptics';

export const SecurityScreen: React.FC = () => {
  const { unlock, forceUnlock, lockApp } = useNativeAuth();
  const { logout } = useAuth();
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [showPin, setShowPin] = useState(false);

  return (
    <div className="fixed inset-0 z-[10000] bg-[#0F172A] flex flex-col items-center justify-center p-6 overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-rose-500/10 to-transparent rounded-full" />

      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="relative z-10 flex flex-col items-center max-w-sm w-full"
      >
        <div className="bg-rose-500/20 p-6 rounded-full border border-rose-500/30 mb-8 shadow-[0_0_40px_rgba(244,63,94,0.3)]">
          <Lock className="w-12 h-12 text-rose-500" />
        </div>

        <h1 className="text-2xl font-black text-white mb-2 tracking-tight text-center">
          FuelPro Enterprise Locked
        </h1>
        <p className="text-slate-400 text-center text-sm mb-8">
          {showPin ? "Enter your 6-digit PIN to resume your session." : "For your security, the application has been locked due to inactivity. Please authenticate to continue."}
        </p>

        {error && <p className="text-red-400 text-sm mb-4 text-center">{error}</p>}

        <div className="w-full space-y-4">
          {!showPin ? (
            <button
              onClick={async () => {
                try {
                  const success = await BiometricService.authenticate('Unlock FuelPro');
                  if (success) {
                    NativeHaptics.success();
                    forceUnlock();
                  } else {
                    NativeHaptics.error();
                    setShowPin(true);
                    setError('Biometric authentication failed. Please enter PIN.');
                  }
                } catch (err: any) {
                  NativeHaptics.error();
                  console.error(err);
                  setShowPin(true);
                  setError('Biometric error. Please enter PIN.');
                }
              }}
              className="w-full bg-gradient-to-r from-indigo-500 to-cyan-500 text-white font-bold py-4 rounded-2xl shadow-lg hover:shadow-indigo-500/25 transition-all active:scale-95 flex items-center justify-center gap-3"
            >
              <Fingerprint className="w-6 h-6" />
              <span>Tap to Unlock</span>
            </button>
          ) : (
            <>
              <input 
                type="password" 
                maxLength={6}
                value={pin}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '');
                  if (val.length > pin.length) NativeHaptics.lightClick();
                  setPin(val);
                }}
                placeholder="Enter PIN"
                className="w-full bg-slate-900/50 border border-slate-700 rounded-xl p-4 text-center text-white text-2xl tracking-[0.5em] focus:outline-none focus:border-orange-500"
              />
              
              <button 
                onClick={() => {
                  if (pin === '123456') { // Mock PIN validation
                    NativeHaptics.success();
                    forceUnlock();
                    setPin('');
                    setError('');
                  } else {
                    NativeHaptics.error();
                    NativeHaptics.vibrate(300);
                    setError('Invalid PIN');
                    setPin('');
                  }
                }}
                disabled={pin.length < 6}
                className="w-full bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2"
              >
                <KeyRound className="h-5 w-5" />
                Unlock App
              </button>
            </>
          )}
        </div>

        <button 
          onClick={async () => {
            await logout();
            window.location.reload();
          }}
          className="mt-8 text-sm text-slate-500 hover:text-slate-300 transition-colors"
        >
          Sign Out Instead
        </button>
      </motion.div>
    </div>
  );
};
