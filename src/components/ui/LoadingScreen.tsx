import React from 'react';
import { motion } from 'motion/react';
import { Shield } from 'lucide-react';

export default function LoadingScreen() {
  return (
    <div className="relative min-h-screen w-full flex flex-col justify-center items-center overflow-hidden bg-slate-950 font-sans">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="relative z-10 flex flex-col items-center"
      >
        <div className="relative flex items-center justify-center mb-4">
          <motion.div 
            animate={{ rotate: 360 }} 
            transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
            className="absolute inset-0 rounded-full border-t-2 border-orange-500/50 w-16 h-16 -m-2"
          />
          <div className="bg-slate-900/80 p-3 rounded-full border border-slate-700 shadow-[0_0_30px_rgba(249,115,22,0.2)]">
            <Shield className="w-6 h-6 text-orange-500" />
          </div>
        </div>
        <h1 className="text-sm font-bold text-slate-300 tracking-widest uppercase text-center animate-pulse">
          Loading FuelPro...
        </h1>
      </motion.div>
    </div>
  );
}
