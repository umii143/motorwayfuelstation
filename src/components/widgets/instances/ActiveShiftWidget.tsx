import React from 'react';
import { Power } from 'lucide-react';
import { useShiftMetrics } from '../../hooks/useShiftMetrics';
import { useStation } from '../../contexts/StationContext';
import { formatCurrency } from '../../lib/currency';

export function ActiveShiftWidget() {
  const { settings } = useStation();
  const { activeShift, shiftOperator, expectedCash, openingCash, variance, shiftDuration } = useShiftMetrics();

  if (!activeShift) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center p-6 bg-white/[0.02] rounded-2xl border border-white/[0.05]">
        <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-3 border border-white/10 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]">
          <Power className="w-8 h-8 text-slate-500" />
        </div>
        <h3 className="text-white font-black text-lg">No Active Shift</h3>
        <p className="text-sm text-slate-400 mt-1">Start a shift to track sales.</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-4 px-2">
        <div className="flex items-center gap-2">
           <div className="w-8 h-8 rounded-xl bg-orange-500/20 flex items-center justify-center border border-orange-500/30">
             <Power className="w-4 h-4 text-orange-500" />
           </div>
           <div>
             <h2 className="text-sm font-black text-white">Active Shift</h2>
             <div className="px-2 py-0.5 mt-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold flex items-center gap-1 w-max">
               <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
               Running: {shiftDuration}
             </div>
           </div>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-2 gap-3">
         <div className="bg-white/[0.03] rounded-xl p-3 border border-white/[0.05]">
            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Operator</div>
            <div className="text-sm font-black text-white truncate">{shiftOperator}</div>
         </div>
         <div className="bg-white/[0.03] rounded-xl p-3 border border-white/[0.05]">
            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Expected Cash</div>
            <div className="text-sm font-black text-white truncate">{formatCurrency(expectedCash, settings)}</div>
         </div>
         <div className="bg-white/[0.03] rounded-xl p-3 border border-white/[0.05]">
            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Opening Cash</div>
            <div className="text-sm font-black text-white truncate">{formatCurrency(openingCash, settings)}</div>
         </div>
         <div className={`rounded-xl p-3 border transition-colors ${variance < 0 ? 'bg-red-500/10 border-red-500/20' : variance > 0 ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-white/[0.03] border-white/[0.05]'}`}>
            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Variance</div>
            <div className={`text-sm font-black truncate ${variance < 0 ? 'text-red-400' : variance > 0 ? 'text-emerald-400' : 'text-white'}`}>
              {variance === 0 ? 'Balanced' : formatCurrency(variance, settings)}
            </div>
         </div>
      </div>
    </div>
  );
}
