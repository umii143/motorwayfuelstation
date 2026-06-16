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
        <h1 className="text-2xl font-black text-slate-100 tracking-wide text-center mt-2 flex items-center justify-center gap-3">
          <span>FuelPro</span>
          <span className="text-orange-500 font-normal">|</span>
          <span dir="rtl" className="font-urdu">فیول پرو</span>
        </h1>
        <p className="text-sm font-medium text-orange-400 mt-2 text-center tracking-wide" dir="rtl">
          آپ کا اپنا فیول اسٹیشن
        </p>
        
        <div className="absolute fixed bottom-12 left-0 w-full flex flex-col items-center justify-center opacity-60">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] text-center leading-relaxed">
            Powered By Umar Ali<br/>
            <span className="text-orange-500/80">Motorway Petroleum, Mardan</span>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
