import React from 'react';
import { motion } from 'motion/react';
import { Lock, Fingerprint } from 'lucide-react';
import { useNativeAuth } from '../../contexts/NativeAuthContext';

export const SecurityScreen: React.FC = () => {
  const { unlock } = useNativeAuth();

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
        <p className="text-slate-400 text-center text-sm mb-12">
          For your security, the application has been locked due to inactivity. Please authenticate to continue.
        </p>

        <button
          onClick={unlock}
          className="w-full bg-gradient-to-r from-indigo-500 to-cyan-500 text-white font-bold py-4 rounded-2xl shadow-lg hover:shadow-indigo-500/25 transition-all active:scale-95 flex items-center justify-center gap-3"
        >
          <Fingerprint className="w-6 h-6" />
          <span>Tap to Unlock</span>
        </button>
      </motion.div>
    </div>
  );
};
