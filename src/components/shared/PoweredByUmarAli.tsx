import React from 'react';
import { Fuel, Zap, Phone, ShieldCheck, Cloud, Headphones } from 'lucide-react';

interface PoweredByUmarAliProps {
  variant?: 'full' | 'compact' | 'receipt' | 'watermark' | 'loading' | 'dashboard';
  className?: string;
  showLogo?: boolean;
}

export const PoweredByUmarAli: React.FC<PoweredByUmarAliProps> = ({ 
  variant = 'compact', 
  className = '',
  showLogo = true
}) => {
  const whatsappSvg = (
    <svg className="h-3 w-3 sm:h-3.5 sm:w-3.5 fill-emerald-400 shrink-0 drop-shadow-[0_0_2px_rgba(52,211,153,0.8)]" viewBox="0 0 24 24">
      <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.058 5.348 5.4 0 12.008 0c3.2 0 6.21 1.244 8.475 3.512 2.262 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.346 12.003-11.95 12.003-2.002-.001-3.968-.5-5.713-1.448L0 24zm6.59-4.817c1.661.988 3.287 1.477 4.912 1.478 5.483 0 9.95-4.466 9.953-9.95 0-2.657-1.035-5.155-2.914-7.034C16.711 1.797 14.198.761 11.53.761c-5.485 0-9.952 4.467-9.955 9.953-.001 1.944.512 3.844 1.487 5.534l-.98 3.578 3.665-.961zm11.332-6.526c-.347-.174-2.054-1.014-2.372-1.129-.317-.116-.549-.174-.78.174-.23.348-.895 1.129-1.096 1.359-.202.232-.404.261-.751.087-.348-.174-1.468-.541-2.798-1.728-1.034-.922-1.731-2.06-1.933-2.408-.202-.348-.022-.536.152-.709.157-.156.347-.406.52-.609.174-.203.232-.348.348-.58.116-.232.058-.435-.028-.609-.087-.174-.78-1.884-1.069-2.58-.282-.677-.568-.584-.78-.595-.201-.01-.433-.012-.664-.012-.231 0-.606.087-.923.435-.317.348-1.211 1.188-1.211 2.9s1.24 3.362 1.413 3.593c.174.232 2.44 3.725 5.911 5.225.824.356 1.468.57 1.969.729.829.263 1.583.226 2.18.136.664-.1 2.053-.84 2.34-1.652.287-.812.287-1.507.202-1.651-.086-.144-.316-.231-.663-.405z"/>
    </svg>
  );

  const DeveloperTag = () => (
    <span className="inline-flex items-center gap-1 font-black tracking-tight">
      <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#FF7A00] to-[#FF004D] drop-shadow-[0_0_8px_rgba(255,122,0,0.5)]">UMAR ALI</span>
      <Zap className="w-3.5 h-3.5 text-[#FFD700] fill-[#FFD700] drop-shadow-[0_0_6px_rgba(255,215,0,0.8)] animate-pulse" />
    </span>
  );

  const ContactTag = () => (
    <a 
      href="https://wa.me/923168432329" 
      target="_blank" 
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 hover:scale-105 transition-transform bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-md backdrop-blur-sm group"
      title="Contact Developer on WhatsApp"
      onClick={(e) => e.stopPropagation()}
    >
      {whatsappSvg}
      <span className="font-mono font-bold text-[10px] sm:text-xs text-emerald-400 group-hover:text-emerald-300 drop-shadow-[0_0_4px_rgba(52,211,153,0.4)]">0316-8432329</span>
    </a>
  );

  if (variant === 'full') {
    return (
      <div className={`flex flex-col items-center justify-center p-6 space-y-3 ${className}`}>
        <div className="w-full flex justify-center mb-1">
          <div className="h-[1px] w-full max-w-[200px] bg-gradient-to-r from-transparent via-slate-500/30 to-transparent"></div>
        </div>
        {showLogo && (
          <div className="flex items-center gap-2 mb-2 drop-shadow-md text-[var(--text-main,inherit)]">
            <Fuel className="w-7 h-7 text-indigo-500" />
            <span className="font-black text-2xl tracking-tight">FuelPro FSMS</span>
          </div>
        )}
        <div className="flex items-center gap-1.5 text-sm tracking-wide bg-slate-500/10 border border-slate-500/20 px-4 py-1.5 rounded-full shadow-xs backdrop-blur-sm">
          <span className="font-medium text-[var(--text-muted,inherit)]">Powered by</span>
          <DeveloperTag />
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <p className="text-xs font-bold bg-slate-500/10 text-[var(--text-muted,inherit)] px-3 py-1 rounded-full border border-slate-500/20">Motorway Petroleum, Mardan KPK</p>
          <ContactTag />
        </div>
        <div className="w-full flex justify-center mt-3">
          <div className="h-[1px] w-full max-w-[200px] bg-gradient-to-r from-transparent via-[#FF7A00]/30 to-transparent"></div>
        </div>
      </div>
    );
  }

  if (variant === 'receipt') {
    return (
      <div className={`font-mono text-center text-[10px] sm:text-xs mt-6 pt-3 border-t-2 border-dashed border-slate-300 ${className}`}>
        <div className="font-bold flex flex-col sm:flex-row items-center justify-center gap-x-2 gap-y-1 mb-1">
          <span className="flex items-center gap-1 text-slate-800">
            Powered by Umar Ali <Zap className="w-3 h-3 text-slate-800 fill-slate-800" />
          </span>
          <span className="hidden sm:inline text-slate-400">|</span>
          <span className="flex items-center gap-1">
            WA: 0316-8432329
          </span>
        </div>
        <div className="text-[9px] sm:text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1 border border-slate-200 inline-block px-2 py-0.5 rounded-md">FuelPro FSMS v2.0</div>
      </div>
    );
  }

  if (variant === 'loading') {
    return (
      <div className={`flex flex-col items-center justify-center ${className}`}>
        <div className="flex items-center gap-2 font-black text-indigo-600 mb-3 drop-shadow-lg">
          <Fuel className="w-10 h-10 animate-bounce text-[#FF7A00]" />
          <span className="text-3xl bg-clip-text text-transparent bg-gradient-to-br from-indigo-700 to-violet-500">FuelPro</span>
        </div>
        <div className="flex flex-col items-center gap-2">
          <div className="text-xs sm:text-sm font-semibold text-slate-700 flex items-center gap-1.5 uppercase tracking-widest bg-white/80 backdrop-blur-md px-4 py-1.5 rounded-full shadow-lg border border-white/40">
            Powered by <DeveloperTag />
          </div>
          <div className="bg-white/90 backdrop-blur-md px-1 py-1 rounded-lg shadow-lg border border-emerald-100/50">
            <ContactTag />
          </div>
        </div>
      </div>
    );
  }

  if (variant === 'watermark') {
    return (
      <div className={`absolute inset-0 pointer-events-none flex flex-col items-center justify-center overflow-hidden opacity-[0.04] ${className}`}>
        <div className="transform -rotate-45 text-6xl md:text-8xl font-black whitespace-nowrap bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
          FuelPro | Umar Ali
        </div>
        <div className="transform -rotate-45 text-4xl md:text-5xl font-black whitespace-nowrap mt-4 text-slate-800">
          WA: 0316-8432329
        </div>
      </div>
    );
  }

  if (variant === 'dashboard') {
    return (
      <div className={`w-full bg-[#161618] border border-white/5 rounded-2xl md:rounded-3xl p-4 md:p-6 relative overflow-hidden flex flex-col md:flex-row items-center md:items-stretch gap-4 md:gap-6 shadow-2xl ${className}`}>
        
        {/* Version Badge */}
        <div className="absolute top-4 right-4 bg-white/5 px-2.5 py-1 rounded-lg border border-white/10">
          <span className="text-white/40 text-[11px] font-mono font-medium tracking-wider">v2.5</span>
        </div>

        {/* Left Section */}
        <div className="flex flex-col items-center md:items-start justify-center pt-1 md:pt-0">
          <span className="text-[9px] md:text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-0.5">Powered By</span>
          <div className="flex items-center gap-1.5 font-black text-xl md:text-2xl tracking-tight mb-2 md:mb-4 drop-shadow-[0_0_8px_rgba(255,122,0,0.15)]">
             <span className="text-white">UMAR</span>
             <span className="text-orange-500">ALI</span>
             <Zap className="w-4 h-4 md:w-5 md:h-5 text-orange-500 fill-orange-500 ml-0.5" />
          </div>
          
          <a 
            href="https://wa.me/923168432329" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-2 bg-[#1A251D] border border-[#233524] px-3 py-1.5 md:px-4 md:py-2 rounded-xl transition-all hover:bg-[#1E2B22]"
          >
            <Phone className="w-3 h-3 md:w-4 md:h-4 text-emerald-400" />
            <span className="text-emerald-400 font-medium text-xs md:text-sm">0316-8432329</span>
          </a>
        </div>

        {/* Divider */}
        <div className="hidden md:block w-px bg-white/5 my-2 mx-2"></div>
        <div className="block md:hidden h-px w-3/4 mx-auto bg-white/5 my-0.5"></div>

        {/* Right Section */}
        <div className="flex-1 w-full grid grid-cols-3 gap-2 sm:gap-2 items-start justify-items-center md:pt-2 pb-1 md:pb-2">
           {/* Item 1 */}
           <div className="flex flex-col items-center text-center gap-1 md:gap-2">
             <ShieldCheck className="w-5 h-5 md:w-7 md:h-7 text-orange-500 stroke-[1.5]" />
             <div className="flex flex-col items-center gap-0.5 md:mt-1">
               <span className="text-orange-500 text-[8px] md:text-xs font-bold uppercase tracking-wider leading-tight text-center">Fast & Secure</span>
               <span className="hidden md:block text-slate-400 text-[9px] md:text-[10px] leading-tight max-w-[120px]">Your data is always protected</span>
             </div>
           </div>
           
           {/* Item 2 */}
           <div className="flex flex-col items-center text-center gap-1 md:gap-2">
             <Cloud className="w-5 h-5 md:w-7 md:h-7 text-orange-500 stroke-[1.5]" />
             <div className="flex flex-col items-center gap-0.5 md:mt-1">
               <span className="text-orange-500 text-[8px] md:text-xs font-bold uppercase tracking-wider leading-tight text-center">Cloud Sync</span>
               <span className="hidden md:block text-slate-400 text-[9px] md:text-[10px] leading-tight max-w-[120px]">Real-time backup and sync</span>
             </div>
           </div>

           {/* Item 3 */}
           <div className="flex flex-col items-center text-center gap-1 md:gap-2">
             <Headphones className="w-5 h-5 md:w-7 md:h-7 text-orange-500 stroke-[1.5]" />
             <div className="flex flex-col items-center gap-0.5 md:mt-1">
               <span className="text-orange-500 text-[8px] md:text-xs font-bold uppercase tracking-wider leading-tight text-center">24/7 Support</span>
               <span className="hidden md:block text-slate-400 text-[9px] md:text-[10px] leading-tight max-w-[120px]">We are always here to help</span>
             </div>
           </div>
        </div>

      </div>
    );
  }

  // premium sleek 'compact' variant perfect for dark sidebars
  return (
    <div className={`w-full flex flex-col gap-2 p-3 rounded-xl bg-gradient-to-b from-white/5 to-white/0 border border-white/5 backdrop-blur-sm relative overflow-hidden group ${className}`}>
      {/* Subtle shine effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:animate-[shimmer_2s_infinite] pointer-events-none" />
      
      <div className="flex items-center justify-between w-full">
        <span className="text-[10px] font-medium text-[var(--text-muted,#94a3b8)] uppercase tracking-widest">Powered By</span>
        <span className="text-[9px] font-bold text-white/30 bg-white/5 px-1.5 py-0.5 rounded backdrop-blur-md border border-white/5">v2.0</span>
      </div>
      
      <div className="flex flex-col items-start gap-1">
        <DeveloperTag />
      </div>
      
      <div className="mt-0.5 w-full">
        <ContactTag />
      </div>
    </div>
  );
};
