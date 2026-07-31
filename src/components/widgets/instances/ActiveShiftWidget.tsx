import React from 'react';
import { Power } from 'lucide-react';
import { useShiftMetrics } from '../../../hooks/useShiftMetrics';
import { useStationStore } from '../../../stores/useStationStore';
import { formatCurrency } from '../../../lib/currency';

export function ActiveShiftWidget() {
 const settings = useStationStore((state) => state.settings);
 const { activeShift, shiftOperator, expectedCash, openingCash, variance, shiftDuration } = useShiftMetrics();

 if (!activeShift) {
 return (
 <div className="w-full h-full flex flex-col items-center justify-center p-6 bg-card rounded-2xl border border-border">
 <h3 className="text-foreground font-bold text-sm flex items-center gap-2">
 <Power className="w-4 h-4 text-muted-foreground" />
 No Active Shift
 </h3>
 <p className="text-xs text-muted-foreground mt-1 text-center">No active shift is currently running for this station.</p>
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
 <h2 className="text-sm font-bold text-foreground">Active Shift</h2>
 <div className="px-2 py-0.5 mt-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold flex items-center gap-1 w-max">
 <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
 Running: {shiftDuration}
 </div>
 </div>
 </div>
 </div>

 <div className="flex-1 grid grid-cols-2 gap-3">
 <div className="bg-card border border-border rounded-xl p-3">
 <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Operator</div>
 <div className="text-sm font-bold text-foreground truncate">{shiftOperator}</div>
 </div>
 <div className="bg-card border border-border rounded-xl p-3">
 <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Expected Cash</div>
 <div className="text-sm font-bold text-foreground truncate">{formatCurrency(expectedCash, settings)}</div>
 </div>
 <div className="bg-card border border-border rounded-xl p-3">
 <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Opening Cash</div>
 <div className="text-sm font-bold text-foreground truncate">{formatCurrency(openingCash, settings)}</div>
 </div>
 <div className={`rounded-xl p-3 border transition-colors ${variance < 0 ? 'bg-red-500/10 border-red-500/20' : variance > 0 ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-card border-border'}`}>
 <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Variance</div>
 <div className={`text-sm font-bold truncate ${variance < 0 ? 'text-red-600 dark:text-red-400' : variance > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-foreground'}`}>
 {variance === 0 ? 'Balanced' : formatCurrency(variance, settings)}
 </div>
 </div>
 </div>
 </div>
 );
}
