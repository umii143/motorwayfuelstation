import React from 'react';
import { DollarSign, Droplets, Zap, Clock } from 'lucide-react';
import { useFinancialMetrics } from '../../hooks/useFinancialMetrics';
import { useShiftMetrics } from '../../hooks/useShiftMetrics';
import { useStation } from '../../contexts/StationContext';
import { formatCurrency } from '../../lib/currency';

export function HeroPerformanceWidget() {
  const { settings } = useStation();
  const { todayRevenue, todayProfit, todayLiters } = useFinancialMetrics();
  const { activeShifts, totalShiftsToday, activeNozzlesCount, totalNozzles } = useShiftMetrics();

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 h-full">
      {/* Gross Revenue */}
      <div className="bg-white/[0.03] rounded-2xl p-4 sm:p-5 border border-white/[0.05] shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] flex flex-col justify-center relative overflow-hidden group hover:bg-white/[0.05] transition-colors">
        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
          <DollarSign className="w-16 h-16 text-emerald-500" />
        </div>
        <div className="text-[10px] sm:text-xs font-black text-slate-400 uppercase tracking-widest mb-1 sm:mb-2 relative z-10 flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500" /> Today's Revenue
        </div>
        <div className="text-2xl sm:text-3xl lg:text-4xl font-black text-white relative z-10 tracking-tight">
          {formatCurrency(todayRevenue, settings)}
        </div>
      </div>

      {/* Net Profit */}
      <div className="bg-white/[0.03] rounded-2xl p-4 sm:p-5 border border-white/[0.05] shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] flex flex-col justify-center relative overflow-hidden group hover:bg-white/[0.05] transition-colors">
        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
          <Zap className="w-16 h-16 text-indigo-500" />
        </div>
        <div className="text-[10px] sm:text-xs font-black text-slate-400 uppercase tracking-widest mb-1 sm:mb-2 relative z-10 flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-indigo-500" /> Est. Profit
        </div>
        <div className="text-2xl sm:text-3xl lg:text-4xl font-black text-white relative z-10 tracking-tight">
          {formatCurrency(todayProfit, settings)}
        </div>
      </div>

      {/* Sales Volume */}
      <div className="bg-white/[0.03] rounded-2xl p-4 sm:p-5 border border-white/[0.05] shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] flex flex-col justify-center relative overflow-hidden group hover:bg-white/[0.05] transition-colors">
        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
          <Droplets className="w-16 h-16 text-blue-500" />
        </div>
        <div className="text-[10px] sm:text-xs font-black text-slate-400 uppercase tracking-widest mb-1 sm:mb-2 relative z-10 flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-blue-500" /> Sales Volume
        </div>
        <div className="text-2xl sm:text-3xl lg:text-4xl font-black text-white relative z-10 tracking-tight">
          {todayLiters.toLocaleString(undefined, { maximumFractionDigits: 0 })} L
        </div>
      </div>

      {/* Active Operations */}
      <div className="bg-white/[0.03] rounded-2xl p-4 sm:p-5 border border-white/[0.05] shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] flex flex-col justify-center relative overflow-hidden group hover:bg-white/[0.05] transition-colors">
        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
          <Clock className="w-16 h-16 text-orange-500" />
        </div>
        <div className="text-[10px] sm:text-xs font-black text-slate-400 uppercase tracking-widest mb-1 sm:mb-2 relative z-10 flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-orange-500" /> Active Operations
        </div>
        <div className="flex gap-4 relative z-10">
          <div>
            <div className="text-xl sm:text-2xl lg:text-3xl font-black text-white">
              {activeShifts.length}/{totalShiftsToday || activeShifts.length}
            </div>
            <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Shifts</div>
          </div>
          <div className="w-px h-full bg-white/10 mx-2"></div>
          <div>
            <div className="text-xl sm:text-2xl lg:text-3xl font-black text-white">
              {activeNozzlesCount}/{totalNozzles}
            </div>
            <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Nozzles</div>
          </div>
        </div>
      </div>
    </div>
  );
}
