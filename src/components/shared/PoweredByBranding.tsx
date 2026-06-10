import React from 'react';

interface BrandingProps {
  variant?: 'full' | 'compact' | 'receipt' | 'footer';
  className?: string;
}

export function PoweredByBranding({ variant = 'compact', className = '' }: BrandingProps) {
  if (variant === 'receipt') return (
    <div className={`text-center py-2 border-t border-outline-variant mt-3 ${className}`}>
      <p className="text-xs text-on-surface-variant">
        ─────────────────────────────
      </p>
      <p className="text-sm font-semibold text-secondary mt-1 flex items-center justify-center gap-1">
        Powered by Umar Ali <span className="material-symbols-outlined text-[14px]">bolt</span>
      </p>
      <p className="text-xs text-on-surface-variant">
        FuelPro FSMS v2.0 | Motorway Petroleum
      </p>
    </div>
  );

  if (variant === 'full') return (
    <div className={`flex flex-col items-center gap-1 py-4 ${className}`}>
      <span className="text-2xl">⛽</span>
      <p className="text-base font-bold text-on-surface">FuelPro FSMS</p>
      <p className="text-sm text-secondary font-semibold">Powered by Umar Ali</p>
      <p className="text-xs text-on-surface-variant">
        Motorway Petroleum, Mardan KPK
      </p>
    </div>
  );

  // compact (default) or footer
  return (
    <p className={`text-xs text-on-surface-variant flex items-center gap-1 ${className}`}>
      Powered by Umar Ali <span className="material-symbols-outlined text-[14px] text-secondary">bolt</span> | FuelPro v2.0
    </p>
  );
}
