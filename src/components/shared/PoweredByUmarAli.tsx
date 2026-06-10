import React from 'react';
import { Fuel, Zap } from 'lucide-react';

interface PoweredByUmarAliProps {
  variant?: 'full' | 'compact' | 'receipt' | 'watermark' | 'loading';
  className?: string;
  showLogo?: boolean;
}

export const PoweredByUmarAli: React.FC<PoweredByUmarAliProps> = ({ 
  variant = 'compact', 
  className = '',
  showLogo = true
}) => {
  if (variant === 'full') {
    return (
      <div className={`flex flex-col items-center justify-center p-6 space-y-2 text-slate-800 ${className}`}>
        <div className="w-full flex justify-center mb-2">
          <div className="h-0.5 w-48 bg-slate-200"></div>
        </div>
        {showLogo && (
          <div className="flex items-center gap-2 text-indigo-600 mb-1">
            <Fuel className="w-6 h-6" />
            <span className="font-black text-xl tracking-tight">FuelPro FSMS</span>
          </div>
        )}
        <div className="flex items-center gap-1.5 font-bold text-sm tracking-wide">
          <span>Powered by Umar Ali</span>
          <Zap className="w-4 h-4 text-yellow-500 fill-yellow-500" />
        </div>
        <p className="text-xs text-slate-500 font-medium">Motorway Petroleum, Mardan KPK</p>
        <div className="w-full flex justify-center mt-2">
          <div className="h-0.5 w-48 bg-slate-200"></div>
        </div>
      </div>
    );
  }

  if (variant === 'receipt') {
    return (
      <div className={`font-mono text-center text-xs mt-4 pt-2 border-t border-dashed border-slate-300 ${className}`}>
        <div className="font-bold flex items-center justify-center gap-1 mb-0.5">
          Powered by Umar Ali ⚡
        </div>
        <div className="text-[10px]">FuelPro FSMS v2.0</div>
      </div>
    );
  }

  if (variant === 'loading') {
    return (
      <div className={`flex flex-col items-center justify-center animate-pulse ${className}`}>
        <div className="flex items-center gap-2 font-bold text-indigo-600 mb-2">
          <Fuel className="w-8 h-8 animate-bounce" />
          <span className="text-2xl">FuelPro</span>
        </div>
        <div className="text-xs font-semibold text-slate-500 flex items-center gap-1 uppercase tracking-widest">
          Powered by Umar Ali <Zap className="w-3 h-3 text-yellow-500 fill-yellow-500" />
        </div>
      </div>
    );
  }

  if (variant === 'watermark') {
    return (
      <div className={`absolute inset-0 pointer-events-none flex items-center justify-center overflow-hidden opacity-[0.03] ${className}`}>
        <div className="transform -rotate-45 text-6xl md:text-8xl font-black whitespace-nowrap">
          FuelPro | Umar Ali
        </div>
      </div>
    );
  }

  // default 'compact'
  return (
    <div className={`flex items-center justify-center gap-2 text-xs font-medium text-slate-500 ${className}`}>
      <span>Powered by <span className="font-bold text-slate-700">Umar Ali</span> <Zap className="inline w-3 h-3 text-yellow-500 fill-yellow-500 mb-0.5" /></span>
      <span className="text-slate-300">|</span>
      <span>FuelPro v2.0</span>
    </div>
  );
};
