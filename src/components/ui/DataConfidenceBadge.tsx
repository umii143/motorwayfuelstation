import React from 'react';
import { ShieldCheck, ShieldAlert } from 'lucide-react';

interface DataConfidenceBadgeProps {
  confidence: number;
  className?: string;
}

export function DataConfidenceBadge({ confidence, className = '' }: DataConfidenceBadgeProps) {
  const isHigh = confidence >= 90;
  const isMedium = confidence >= 50 && confidence < 90;
  
  let colorClass = 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20';
  let Icon = ShieldCheck;
  
  if (isMedium) {
    colorClass = 'text-amber-500 bg-amber-500/10 border-amber-500/20';
    Icon = ShieldAlert;
  } else if (!isHigh && !isMedium) {
    colorClass = 'text-red-500 bg-red-500/10 border-red-500/20';
    Icon = ShieldAlert;
  }

  // 100% confidence means data is fully derived from real POS/Shift records (no estimation).
  return (
    <div 
      className={`absolute bottom-3 right-4 flex items-center gap-1 px-1.5 py-0.5 rounded border text-[9px] font-bold tracking-wider backdrop-blur-sm ${colorClass} ${className}`}
      title={`Data Confidence: ${confidence}%\n100% means purely real recorded data with no estimation.`}
    >
      <Icon className="w-3 h-3" strokeWidth={2.5} />
      <span>{confidence}% CONF</span>
    </div>
  );
}
