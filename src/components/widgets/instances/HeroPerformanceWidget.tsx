import React from 'react';
import { DollarSign, Droplets, Zap, Clock } from 'lucide-react';
import { useFinancialMetrics } from '../../../hooks/useFinancialMetrics';
import { useShiftMetrics } from '../../../hooks/useShiftMetrics';
import { useStationStore } from '../../../stores/useStationStore';
import { formatCurrency } from '../../../lib/currency';

export function HeroPerformanceWidget() {
  const settings = useStationStore((state) => state.settings);
  const { todayRevenue, todayProfit, todayLiters } = useFinancialMetrics();
  const { activeShifts, totalShiftsToday, activeNozzlesCount, totalNozzles } = useShiftMetrics();

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 h-full">
      {/* Gross Revenue */}
      <div className="bg-card rounded-2xl p-4 sm:p-5 border border-border shadow-xs flex flex-col justify-center relative overflow-hidden group hover:border-orange-500/30 transition-all">
        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
          <DollarSign className="w-16 h-16 text-emerald-500" />
        </div>
        <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1 sm:mb-2 relative z-10 flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500" /> Today's Revenue
        </div>
        <div className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-foreground relative z-10 tracking-tight">
          {formatCurrency(todayRevenue, settings)}
        </div>
      </div>

      {/* Net Profit */}
      <div className="bg-card rounded-2xl p-4 sm:p-5 border border-border shadow-xs flex flex-col justify-center relative overflow-hidden group hover:border-indigo-500/30 transition-all">
        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
          <Zap className="w-16 h-16 text-indigo-500" />
        </div>
        <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1 sm:mb-2 relative z-10 flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-indigo-500" /> Est. Profit
        </div>
        <div className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-foreground relative z-10 tracking-tight">
          {formatCurrency(todayProfit, settings)}
        </div>
      </div>

      {/* Sales Volume */}
      <div className="bg-card rounded-2xl p-4 sm:p-5 border border-border shadow-xs flex flex-col justify-center relative overflow-hidden group hover:border-blue-500/30 transition-all">
        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
          <Droplets className="w-16 h-16 text-blue-500" />
        </div>
        <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1 sm:mb-2 relative z-10 flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-blue-500" /> Sales Volume
        </div>
        <div className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-foreground relative z-10 tracking-tight">
          {todayLiters.toLocaleString(undefined, { maximumFractionDigits: 0 })} L
        </div>
      </div>

      {/* Active Operations */}
      <div className="bg-card rounded-2xl p-4 sm:p-5 border border-border shadow-xs flex flex-col justify-center relative overflow-hidden group hover:border-orange-500/30 transition-all">
        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
          <Clock className="w-16 h-16 text-orange-500" />
        </div>
        <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1 sm:mb-2 relative z-10 flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-orange-500" /> Active Operations
        </div>
        <div className="flex gap-4 relative z-10">
          <div>
            <div className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-foreground">
              {activeShifts.length}/{totalShiftsToday || activeShifts.length}
            </div>
            <div className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider mt-1">Shifts</div>
          </div>
          <div className="w-px h-full bg-border mx-2"></div>
          <div>
            <div className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-foreground">
              {activeNozzlesCount}/{totalNozzles}
            </div>
            <div className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider mt-1">Nozzles</div>
          </div>
        </div>
      </div>
    </div>
  );
}
