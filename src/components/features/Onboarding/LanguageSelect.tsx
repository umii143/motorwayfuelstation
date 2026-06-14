import React from 'react';
import { motion } from 'motion/react';
import { Globe } from 'lucide-react';
import { PoweredByUmarAli } from '../../shared/PoweredByUmarAli';

interface LanguageSelectProps {
  onSelect: (lang: 'en' | 'ur') => void;
}

export const LanguageSelect: React.FC<LanguageSelectProps> = ({ onSelect }) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.5 }}
      className="fixed inset-0 z-[9000] bg-slate-950 flex flex-col items-center justify-center p-6"
    >
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-orange-600/10 blur-[120px] rounded-full mix-blend-screen" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-600/10 blur-[120px] rounded-full mix-blend-screen" />
      </div>

      <div className="relative z-10 w-full max-w-sm flex flex-col items-center">
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="w-20 h-20 rounded-3xl bg-orange-500/10 flex items-center justify-center border border-orange-500/20 mb-8 shadow-[0_0_40px_rgba(249,115,22,0.1)]"
        >
          <Globe className="w-10 h-10 text-orange-500" />
        </motion.div>

        <motion.h2
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-2xl font-black text-white text-center mb-2 font-sans tracking-tight"
        >
          Select Your Language
        </motion.h2>
        <motion.p
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-slate-400 text-center mb-10 text-sm font-medium"
        >
          اپنی پسندیدہ زبان کا انتخاب کریں
        </motion.p>

        <div className="w-full flex flex-col gap-4">
          <motion.button
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
            whileHover={{ scale: 1.02, backgroundColor: 'rgba(255,255,255,0.1)' }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onSelect('ur')}
            className="w-full bg-orange-600 hover:bg-orange-500 border border-orange-500/50 p-5 rounded-2xl flex flex-col items-center justify-center gap-1 shadow-[0_10px_30px_rgba(249,115,22,0.2)] transition-colors group cursor-pointer"
          >
            <span className="text-2xl font-bold text-white tracking-wide">اردو</span>
            <span className="text-orange-200/80 text-[10px] uppercase tracking-widest font-bold">Urdu - Recommended</span>
          </motion.button>

          <motion.button
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5 }}
            whileHover={{ scale: 1.02, backgroundColor: 'rgba(255,255,255,0.15)' }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onSelect('en')}
            className="w-full bg-white/5 hover:bg-white/10 border border-white/10 p-5 rounded-2xl flex flex-col items-center justify-center gap-1 transition-colors cursor-pointer"
          >
            <span className="text-xl font-bold text-white tracking-wide font-sans">English</span>
            <span className="text-slate-400 text-[10px] uppercase tracking-widest font-bold">English Language</span>
          </motion.button>
        </div>
      </div>

      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="absolute bottom-8"
      >
        <PoweredByUmarAli variant="compact" showLogo={false} className="text-slate-500" />
      </motion.div>
    </motion.div>
  );
};
