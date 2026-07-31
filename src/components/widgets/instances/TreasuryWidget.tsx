import React, { Suspense } from 'react';
import { Wallet } from 'lucide-react';
import { useTreasuryMetrics } from '../../../hooks/useTreasuryMetrics';
import { useStationStore } from '../../../stores/useStationStore';
import { formatCurrency } from '../../../lib/currency';

function TreasuryContent() {
  const settings = useStationStore((state) => state.settings);
  const metrics = useTreasuryMetrics();

  return (
    <div className="w-full h-full p-6 flex flex-col bg-card rounded-2xl border border-border">
      <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
        <Wallet className="w-4 h-4 text-orange-500" /> Treasury Center
      </h2>
      <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
        <div className="flex justify-between items-center p-3 rounded-xl bg-subtle border border-border transition-colors">
          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Cash in Hand</span>
          <span className="text-sm font-bold text-foreground">{formatCurrency(metrics.cashInHand, settings)}</span>
        </div>
        <div className="flex justify-between items-center p-3 rounded-xl bg-subtle border border-border transition-colors">
          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Bank Balance</span>
          <span className="text-sm font-bold text-foreground">{formatCurrency(metrics.bankBalance, settings)}</span>
        </div>
        <div className="flex justify-between items-center p-3 rounded-xl bg-subtle border border-border transition-colors">
          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Digital Balance</span>
          <span className="text-sm font-bold text-foreground">{formatCurrency(metrics.digitalBalance, settings)}</span>
        </div>
        <div className="flex justify-between items-center p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Receivables</span>
          <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(metrics.totalReceivables, settings)}</span>
        </div>
        <div className="flex justify-between items-center p-3 rounded-xl bg-red-500/10 border border-red-500/20">
          <span className="text-xs font-bold uppercase tracking-wider text-red-600 dark:text-red-400">Payables</span>
          <span className="text-sm font-bold text-red-600 dark:text-red-400">{formatCurrency(metrics.totalPayables, settings)}</span>
        </div>
        <div className="pt-3 mt-3 border-t border-border flex justify-between items-center">
          <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Net Position</span>
          <span className="text-lg font-extrabold text-foreground">{formatCurrency(metrics.netPosition, settings)}</span>
        </div>
      </div>
    </div>
  );
}

export function TreasuryWidget() {
  return (
    <Suspense fallback={
      <div className="w-full h-full p-6 flex flex-col animate-pulse bg-card rounded-2xl border border-border">
        <div className="h-4 bg-subtle w-1/3 rounded mb-6"></div>
        <div className="space-y-3">
          <div className="h-10 bg-subtle rounded-xl"></div>
          <div className="h-10 bg-subtle rounded-xl"></div>
          <div className="h-10 bg-subtle rounded-xl"></div>
        </div>
      </div>
    }>
      <TreasuryContent />
    </Suspense>
  );
}
