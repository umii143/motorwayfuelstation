import React from 'react';
import { ShieldCheck, Cloud, HeadphonesIcon, Zap } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="w-full mt-auto border-t border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-[#0F172A]/80 backdrop-blur-xl relative z-10 p-4 md:p-6 pb-20 lg:pb-6 transition-colors">
      <div className="max-w-[1800px] mx-auto flex flex-col lg:flex-row items-center justify-between gap-6 lg:gap-0">
        
        {/* Left: Branding & Contact */}
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full lg:w-auto justify-center lg:justify-start">
          <div className="flex flex-col items-center sm:items-start">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Powered By</span>
            <div className="flex items-center gap-1">
              <span className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-wider">UMAR ALI</span>
              <Zap className="w-4 h-4 text-orange-500 fill-orange-500" />
            </div>
          </div>
          <div className="h-10 w-px bg-slate-200 dark:bg-white/10 hidden sm:block"></div>
          <div className="flex items-center gap-2 bg-slate-100 dark:bg-white/5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-white/5">
            <HeadphonesIcon className="w-4 h-4 text-emerald-500" />
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">0316-8432329</span>
          </div>
        </div>

        {/* Center: Value Props */}
        <div className="flex items-center justify-center gap-6 md:gap-12 flex-wrap flex-1">
          <div className="flex flex-col items-center text-center">
            <ShieldCheck className="w-5 h-5 text-orange-500 mb-1" />
            <span className="text-[10px] font-black uppercase tracking-widest text-orange-500">Fast & Secure</span>
            <span className="text-[9px] font-bold text-slate-500 mt-0.5">Your data is always protected</span>
          </div>
          <div className="flex flex-col items-center text-center">
            <Cloud className="w-5 h-5 text-orange-500 mb-1" />
            <span className="text-[10px] font-black uppercase tracking-widest text-orange-500">Cloud Sync</span>
            <span className="text-[9px] font-bold text-slate-500 mt-0.5">Real-time backup and sync</span>
          </div>
          <div className="flex flex-col items-center text-center">
            <HeadphonesIcon className="w-5 h-5 text-orange-500 mb-1" />
            <span className="text-[10px] font-black uppercase tracking-widest text-orange-500">24/7 Support</span>
            <span className="text-[9px] font-bold text-slate-500 mt-0.5">We are always here to help</span>
          </div>
        </div>

        {/* Right: Version */}
        <div className="flex items-center justify-center w-full lg:w-auto">
          <div className="px-3 py-1 bg-slate-200 dark:bg-white/5 rounded-lg border border-slate-300 dark:border-white/10">
            <span className="text-xs font-bold text-slate-600 dark:text-slate-400">V2.5</span>
          </div>
        </div>

      </div>
    </footer>
  );
};
