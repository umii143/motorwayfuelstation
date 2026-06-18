import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Lock, Fingerprint, KeyRound, LogOut, MapPin, ShieldCheck } from 'lucide-react';
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
    <div className="fixed inset-0 z-[10000] bg-[#050B14] flex flex-col items-center justify-between overflow-y-auto overflow-x-hidden font-sans">
      {/* Cinematic Background with Rain/Reflections Effect */}
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat opacity-25 mix-blend-screen"
        style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?q=80&w=2000&auto=format&fit=crop)' }}
      />
      <div className="absolute inset-0 z-0 bg-gradient-to-t from-[#02050A] via-[#050B14]/80 to-[#02050A]/90" />
      
      {/* Dot Grid Pattern Overlay */}
      <div 
        className="absolute inset-0 z-0 opacity-[0.03] mix-blend-overlay"
        style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '24px 24px' }}
      />

      {/* Main Content */}
      <div className="relative z-10 w-full flex-1 flex flex-col items-center justify-center pt-16 pb-8">
        
        {/* Animated Glowing Shield */}
        <div className="relative flex items-center justify-center mb-10">
          <div className="absolute w-[600px] h-[600px] bg-[radial-gradient(circle_at_center,rgba(255,100,0,0.1),transparent_50%)] pointer-events-none mix-blend-screen" />
          
          <motion.div animate={{ scale: [1, 1.4], opacity: [0.6, 0] }} transition={{ repeat: Infinity, duration: 2.5, ease: "linear" }} className="absolute w-28 h-28 border border-orange-500/40 rounded-full" />
          <motion.div animate={{ scale: [1, 1.8], opacity: [0.3, 0] }} transition={{ repeat: Infinity, duration: 2.5, ease: "linear", delay: 0.8 }} className="absolute w-28 h-28 border border-orange-500/20 rounded-full" />
          <motion.div animate={{ scale: [1, 2.2], opacity: [0.1, 0] }} transition={{ repeat: Infinity, duration: 2.5, ease: "linear", delay: 1.6 }} className="absolute w-28 h-28 border border-orange-500/10 rounded-full" />
          
          <div className="relative z-10 p-5 rounded-full border-2 border-orange-500 bg-[#050B14]/90 backdrop-blur-md shadow-[0_0_40px_rgba(255,100,0,0.3)]">
            <Lock className="w-10 h-10 text-orange-500" strokeWidth={1.5} />
          </div>
        </div>

        {/* Brand Title */}
        <div className="text-center mb-10">
          <h1 className="text-5xl font-black text-white tracking-tight flex items-center justify-center gap-4 drop-shadow-2xl">
            FuelPro <span className="text-orange-500 font-light text-4xl opacity-50">|</span> <span className="font-[Noto_Nastaliq_Urdu] text-4xl font-normal leading-relaxed mt-2 drop-shadow-lg">فیول پرو</span>
          </h1>
          <div className="flex items-center justify-center gap-4 mt-3">
            <div className="h-[1px] w-12 bg-gradient-to-r from-transparent to-orange-500/80" />
            <span className="text-orange-400 font-[Noto_Nastaliq_Urdu] text-xl drop-shadow-md">آپ کا اپنا فیول اسٹیشن</span>
            <div className="h-[1px] w-12 bg-gradient-to-l from-transparent to-orange-500/80" />
          </div>
        </div>

        {/* Lock Notification Card */}
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="bg-[#0A1120]/70 backdrop-blur-2xl border border-white/5 rounded-3xl p-6 w-[90%] max-w-sm shadow-[0_20px_50px_rgba(0,0,0,0.5)] mb-8 flex items-start gap-4"
        >
          <div className="shrink-0 mt-0.5">
            <Lock className="w-8 h-8 text-orange-500 drop-shadow-[0_0_10px_rgba(255,100,0,0.8)]" />
          </div>
          <div>
            <h3 className="text-white font-bold text-lg mb-1 tracking-wide">Application Locked</h3>
            <p className="text-slate-400 text-[13px] leading-relaxed font-medium">
              {showPin ? "Enter your 6-digit PIN to resume your session securely." : "For your security, the application has been locked due to inactivity. Please authenticate to continue."}
            </p>
          </div>
        </motion.div>

        {error && (
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="w-[90%] max-w-sm bg-red-500/10 border border-red-500/20 py-3 px-4 rounded-xl mb-6 flex items-center gap-3">
            <ShieldCheck className="w-5 h-5 text-red-500 shrink-0" />
            <p className="text-red-400 text-sm font-medium">{error}</p>
          </motion.div>
        )}

        {/* Interactive Authentication Area */}
        <div className="w-[90%] max-w-sm space-y-6">
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
                  }
                } catch (err: any) {
                  NativeHaptics.error();
                  setShowPin(true);
                }
              }}
              className="relative w-full rounded-2xl transition-all active:scale-[0.98] group overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-orange-400 via-orange-600 to-orange-400 opacity-100 group-hover:scale-105 transition-transform duration-700" />
              <div className="absolute inset-[1px] bg-gradient-to-b from-orange-500 to-[#d04500] rounded-[15px]" />
              <div className="relative py-4 px-6 flex items-center justify-center gap-4 shadow-[0_0_40px_rgba(255,100,0,0.5)]">
                <div className="p-1 rounded-full bg-white/20 backdrop-blur-sm">
                  <Fingerprint className="w-7 h-7 text-white" />
                </div>
                <span className="text-white font-bold text-lg tracking-wide drop-shadow-md">Tap to Unlock</span>
              </div>
            </button>
          ) : (
            <div className="space-y-4">
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
                className="w-full bg-[#03060A]/80 backdrop-blur-xl border border-orange-500/30 rounded-2xl p-4 text-center text-white text-3xl tracking-[0.5em] focus:outline-none focus:border-orange-500 shadow-[inset_0_2px_20px_rgba(0,0,0,0.5)] transition-colors"
              />
              <button 
                onClick={() => {
                  const savedPin = localStorage.getItem('fuelpro_device_pin') || '123456';
                  if (pin === savedPin) { 
                    NativeHaptics.success();
                    forceUnlock();
                    setPin('');
                    setError('');
                  } else {
                    NativeHaptics.heavyClick();
                    NativeHaptics.error();
                    NativeHaptics.vibrate(500);
                    setError('Invalid PIN. Please try again.');
                    setPin('');
                  }
                }}
                disabled={pin.length < 6}
                className="relative w-full rounded-2xl transition-all active:scale-[0.98] group overflow-hidden disabled:opacity-50 disabled:active:scale-100"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-orange-400 via-orange-600 to-orange-400 opacity-100" />
                <div className="absolute inset-[1px] bg-gradient-to-b from-orange-500 to-[#d04500] rounded-[15px]" />
                <div className="relative py-4 px-6 flex items-center justify-center gap-3 shadow-[0_0_30px_rgba(255,100,0,0.4)]">
                  <KeyRound className="w-6 h-6 text-white" />
                  <span className="text-white font-bold text-lg tracking-wide drop-shadow-md">Unlock App</span>
                </div>
              </button>
            </div>
          )}

          {/* Divider */}
          <div className="flex items-center gap-4 py-2">
            <div className="flex-1 h-[1px] bg-gradient-to-r from-transparent to-white/10" />
            <span className="text-orange-500 text-[11px] font-black tracking-widest">OR</span>
            <div className="flex-1 h-[1px] bg-gradient-to-l from-transparent to-white/10" />
          </div>

          {/* Sign Out Button */}
          <button 
            onClick={async () => {
              await logout();
              window.location.reload();
            }}
            className="w-full bg-[#0A1120]/50 backdrop-blur-md border border-white/5 hover:border-orange-500/30 hover:bg-[#0A1120]/80 text-slate-300 font-medium py-3.5 rounded-2xl flex items-center justify-center gap-3 transition-all active:scale-[0.98]"
          >
            <LogOut className="w-5 h-5 text-orange-500/70" />
            <span className="tracking-wide">Sign Out Instead</span>
          </button>
        </div>
      </div>

      {/* Footer Branding */}
      <div className="relative z-10 w-full pb-8 flex flex-col items-center mt-auto">
        <div className="flex items-center gap-3 mb-2 opacity-80">
          <div className="w-8 h-[1px] bg-orange-500" />
          <span className="text-[10px] font-bold text-orange-500 tracking-[0.25em] uppercase">Powered By</span>
          <div className="w-8 h-[1px] bg-orange-500" />
        </div>
        <h2 className="text-white font-black text-xl tracking-[0.35em] mb-2 uppercase drop-shadow-lg">Umar Ali</h2>
        <p className="text-orange-500 text-xs font-bold tracking-[0.15em] mb-4 uppercase drop-shadow-md">Motorway Petroleum, Mardan</p>
        <div className="flex items-center gap-1.5 text-slate-400">
          <MapPin className="w-4 h-4 text-orange-600" />
          <span className="text-[11px] font-medium tracking-wide">Mardan, Khyber Pakhtunkhwa</span>
        </div>
      </div>

    </div>
  );
};
