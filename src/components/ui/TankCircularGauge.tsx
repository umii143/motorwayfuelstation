import React from 'react';

interface TankCircularGaugeProps {
  name: string;
  subLabel: string;
  color: string;
  current: number;
  capacity: number;
}

export const TankCircularGauge: React.FC<TankCircularGaugeProps> = ({
  name,
  subLabel,
  color,
  current,
  capacity,
}) => {
  const percentage = Math.min(100, Math.max(0, (current / Math.max(capacity, 1)) * 100));
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="bg-white dark:bg-[#1A1A24] rounded-[24px] p-5 shadow-sm border border-slate-200 dark:border-white/5 flex flex-col items-center justify-between h-full">
      <div className="flex items-center gap-2 w-full justify-start mb-4">
        <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ backgroundColor: `${color}20` }}>
          <div className="w-2.5 h-3.5 rounded-full" style={{ backgroundColor: color, borderTopLeftRadius: '10px', borderTopRightRadius: '10px' }} />
        </div>
        <div className="flex flex-col">
          <span className="text-xs font-bold text-slate-800 dark:text-white leading-tight">{name}</span>
          <span className="text-[10px] text-slate-400 font-medium">{subLabel}</span>
        </div>
      </div>

      <div className="relative w-[120px] h-[120px] mb-4">
        {/* Background Track */}
        <svg className="w-full h-full transform -rotate-90">
          <circle
            cx="60"
            cy="60"
            r={radius}
            stroke="currentColor"
            strokeWidth="8"
            fill="transparent"
            className="text-slate-100 dark:text-white/5"
          />
          {/* Progress Arc */}
          <circle
            cx="60"
            cy="60"
            r={radius}
            stroke={color}
            strokeWidth="8"
            fill="transparent"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-black text-slate-800 dark:text-white">{percentage.toFixed(0)}%</span>
        </div>
      </div>

      <div className="w-full text-center mb-3">
        <span className="text-[11px] font-semibold text-slate-500">
          {current.toLocaleString()} / {capacity.toLocaleString()} L
        </span>
      </div>

      <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-white/5 mb-3 overflow-hidden">
        <div 
          className="h-full rounded-full transition-all duration-1000"
          style={{ width: `${percentage}%`, backgroundColor: color }}
        />
      </div>

      <div className="w-full py-2 rounded-xl border border-slate-200 dark:border-white/10 text-center">
        <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
          {current.toLocaleString()} L Remaining
        </span>
      </div>
    </div>
  );
};
