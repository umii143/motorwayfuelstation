import React, { Suspense } from 'react';
import { Wallet } from 'lucide-react';
import { useTreasuryMetrics } from '../../hooks/useTreasuryMetrics';
import { useStation } from '../../contexts/StationContext';
import { formatCurrency } from '../../lib/currency';

function TreasuryContent() {
  const { settings } = useStation();
  const metrics = useTreasuryMetrics();

  return (
    <div className={`w-full h-full p-6 flex flex-col`}>
      <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
        <Wallet className="w-4 h-4 text-orange-500" /> Treasury Center
      </h2>
      <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
        <div className="flex justify-between items-center p-3 rounded-2xl bg-white/[0.03] border border-white/[0.05] shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] hover:bg-white/[0.05] transition-colors">
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Cash in Hand</span>
          <span className="text-sm font-black text-white">{formatCurrency(metrics.cashInHand, settings)}</span>
        </div>
        <div className="flex justify-between items-center p-3 rounded-2xl bg-white/[0.03] border border-white/[0.05] shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] hover:bg-white/[0.05] transition-colors">
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Bank Balance</span>
          <span className="text-sm font-black text-white">{formatCurrency(metrics.bankBalance, settings)}</span>
        </div>
        <div className="flex justify-between items-center p-3 rounded-2xl bg-white/[0.03] border border-white/[0.05] shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] hover:bg-white/[0.05] transition-colors">
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Digital Balance</span>
          <span className="text-sm font-black text-white">{formatCurrency(metrics.digitalBalance, settings)}</span>
        </div>
        <div className="flex justify-between items-center p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]">
          <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">Receivables</span>
          <span className="text-sm font-black text-emerald-400">{formatCurrency(metrics.totalReceivables, settings)}</span>
        </div>
        <div className="flex justify-between items-center p-3 rounded-2xl bg-red-500/10 border border-red-500/20 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]">
          <span className="text-[10px] font-black uppercase tracking-widest text-red-400">Payables</span>
          <span className="text-sm font-black text-red-400">{formatCurrency(metrics.totalPayables, settings)}</span>
        </div>
        <div className="pt-3 mt-3 border-t border-white/10 flex justify-between items-center">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Net Position</span>
          <span className="text-lg font-black text-white">{formatCurrency(metrics.netPosition, settings)}</span>
        </div>
      </div>
    </div>
  );
}

export function TreasuryWidget() {
  return (
    <Suspense fallback={
      <div className="w-full h-full p-6 flex flex-col animate-pulse bg-white/[0.02]">
        <div className="h-4 bg-white/10 w-1/3 rounded mb-6"></div>
        <div className="space-y-3">
          <div className="h-10 bg-white/5 rounded-2xl"></div>
          <div className="h-10 bg-white/5 rounded-2xl"></div>
          <div className="h-10 bg-white/5 rounded-2xl"></div>
          <div className="h-10 bg-white/5 rounded-2xl"></div>
        </div>
      </div>
    }>
      <TreasuryContent />
    </Suspense>
  );
}
