import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Shield, RefreshCw } from 'lucide-react';

const QUOTES = [
  "Securing your digital assets...",
  "Establishing encrypted connection...",
  "Loading enterprise modules...",
  "Authenticating credentials...",
  "Optimizing performance matrix..."
];

export default function LoadingScreen() {
  const [elapsed, setElapsed] = useState(0);
  const [quoteIndex, setQuoteIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setElapsed(prev => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const quoteTimer = setInterval(() => {
      setQuoteIndex(prev => (prev + 1) % QUOTES.length);
    }, 3000);
    return () => clearInterval(quoteTimer);
  }, []);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <div className="relative min-h-screen w-full flex flex-col justify-center items-center overflow-hidden bg-slate-950 font-sans">
      {/* Background Image with Overlay */}
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat opacity-40 mix-blend-luminosity"
        style={{ backgroundImage: 'url(/bg-station.png)' }}
      />
      <div className="absolute inset-0 z-0 bg-gradient-to-t from-slate-950 via-slate-950/80 to-slate-950/40 backdrop-blur-sm" />

      {/* Main Content Container */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="relative z-10 flex flex-col items-center max-w-md w-full px-6"
      >
        {/* Animated Security Icon */}
        <div className="relative flex items-center justify-center mb-8">
          <motion.div 
            animate={{ rotate: 360 }} 
            transition={{ repeat: Infinity, duration: 8, ease: "linear" }}
            className="absolute inset-0 rounded-full border-t-2 border-orange-500/50 w-24 h-24 -m-2"
          />
          <motion.div 
            animate={{ rotate: -360 }} 
            transition={{ repeat: Infinity, duration: 12, ease: "linear" }}
            className="absolute inset-0 rounded-full border-b-2 border-blue-500/50 w-28 h-28 -m-4"
          />
          <div className="bg-slate-900/80 p-5 rounded-full border border-slate-700 shadow-[0_0_30px_rgba(249,115,22,0.2)]">
            <Shield className="w-10 h-10 text-orange-500" />
          </div>
        </div>

        {/* Primary Status */}
        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-widest uppercase mb-2 text-center drop-shadow-md">
          Decrypting Security Vault
        </h1>
        
        {/* Wait Sir Text */}
        <p className="text-sm font-semibold text-orange-400 mb-8 uppercase tracking-widest flex items-center gap-2">
          <RefreshCw className="w-4 h-4 animate-spin" />
          Please Wait Sir...
        </p>

        {/* Dynamic Quotes Box */}
        <div className="w-full bg-slate-900/60 border border-slate-800 rounded-xl p-4 mb-8 h-16 flex items-center justify-center shadow-inner overflow-hidden relative backdrop-blur-md">
          <AnimatePresence mode="wait">
            <motion.p
              key={quoteIndex}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="text-xs font-mono text-slate-300 text-center uppercase tracking-wider"
            >
              {QUOTES[quoteIndex]}
            </motion.p>
          </AnimatePresence>
        </div>

        {/* Timer UI */}
        <div className="flex flex-col items-center mb-12">
          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">Elapsed Time</span>
          <div className="font-mono text-3xl font-light text-white tracking-widest drop-shadow-lg">
            {formatTime(elapsed)}
          </div>
        </div>

      </motion.div>

      {/* Footer Branding */}
      <div className="absolute bottom-8 z-10 text-center">
        <div className="w-12 h-[1px] bg-gradient-to-r from-transparent via-orange-500 to-transparent mx-auto mb-3" />
        <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">
          Powered By
        </span>
        <h3 className="text-sm font-black text-white uppercase tracking-[0.4em] mt-1 drop-shadow-lg">
          Umar Ali
        </h3>
      </div>
    </div>
  );
}
