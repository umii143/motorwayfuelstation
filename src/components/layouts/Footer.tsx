import React from 'react';
import { ShieldCheck, Cloud, HeadphonesIcon, Zap } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="w-full mt-auto border-t border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-[#0F172A]/80 backdrop-blur-xl relative z-10 px-2 pt-3 pb-[5.5rem] lg:p-6 transition-colors">
      <div className="max-w-[1800px] mx-auto flex flex-col lg:flex-row items-center justify-between gap-3 lg:gap-0 relative">
        
        {/* Left: Branding & Contact */}
        <div className="flex flex-row items-center gap-3 w-full lg:w-auto justify-center lg:justify-start">
          <div className="flex flex-col items-center sm:items-start">
            <span className="text-[8px] sm:text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 leading-tight">Powered By</span>
            <div className="flex items-center gap-1 mt-0.5">
              <span className="text-[11px] sm:text-sm font-black text-slate-800 dark:text-white uppercase tracking-wider leading-tight">UMAR ALI</span>
              <Zap className="w-3 h-3 sm:w-4 sm:h-4 text-orange-500 fill-orange-500" />
            </div>
          </div>
          <div className="h-6 sm:h-10 w-px bg-slate-200 dark:bg-white/10"></div>
          <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-white/5 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-lg border border-slate-200 dark:border-white/5">
            <HeadphonesIcon className="w-3 h-3 sm:w-4 sm:h-4 text-emerald-500" />
            <span className="text-[9px] sm:text-xs font-bold text-slate-700 dark:text-slate-300">0316-8432329</span>
          </div>
        </div>

        {/* Center: Value Props */}
        <div className="grid grid-cols-3 w-full sm:flex sm:items-center sm:justify-center gap-2 sm:gap-6 md:gap-12 flex-1">
          <div className="flex flex-col items-center text-center px-1">
            <ShieldCheck className="w-5 h-5 text-orange-500 mb-1" />
            <span className="text-[8px] sm:text-[10px] font-black uppercase tracking-widest text-orange-500 leading-tight">Fast & Secure</span>
            <span className="hidden sm:block text-[9px] font-bold text-slate-500 mt-0.5">Your data is always protected</span>
          </div>
          <div className="flex flex-col items-center text-center px-1">
            <Cloud className="w-5 h-5 text-orange-500 mb-1" />
            <span className="text-[8px] sm:text-[10px] font-black uppercase tracking-widest text-orange-500 leading-tight">Cloud Sync</span>
            <span className="hidden sm:block text-[9px] font-bold text-slate-500 mt-0.5">Real-time backup and sync</span>
          </div>
          <div className="flex flex-col items-center text-center px-1">
            <HeadphonesIcon className="w-5 h-5 text-orange-500 mb-1" />
            <span className="text-[8px] sm:text-[10px] font-black uppercase tracking-widest text-orange-500 leading-tight">24/7 Support</span>
            <span className="hidden sm:block text-[9px] font-bold text-slate-500 mt-0.5">We are always here to help</span>
          </div>
        </div>

        {/* Right: Version */}
        <div className="absolute right-0 -top-1 lg:static lg:flex items-center justify-center">
          <div className="px-1.5 py-0.5 lg:px-3 lg:py-1 bg-slate-200 dark:bg-white/5 rounded md:rounded-lg border border-slate-300 dark:border-white/10">
            <span className="text-[8px] lg:text-xs font-bold text-slate-500 dark:text-slate-400">V2.5</span>
          </div>
        </div>

      </div>
    </footer>
  );
};
