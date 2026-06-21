import React, { Suspense } from 'react';
import { Database } from 'lucide-react';
import { useTankMetrics } from '../../../hooks/useTankMetrics';

function TankHealthContent() {
  const { tanks } = useTankMetrics();

  const liquidGlass = "relative overflow-hidden backdrop-blur-[30px] saturate-[150%] bg-gradient-to-br from-white/[0.08] to-white/[0.02] border border-white/[0.08] shadow-[inset_0_1px_1px_rgba(255,255,255,0.1),0_20px_80px_rgba(0,0,0,0.6)] rounded-[24px]";

  return (
    <div className={`w-full h-full p-6 flex flex-col`}>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
          <Database className="w-4 h-4 text-orange-500" /> Tank Intelligence Center
        </h2>
      </div>
      <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
        {tanks.length > 0 ? tanks.map((t) => {
          return (
            <div key={t.id} className="bg-white/[0.03] rounded-2xl p-5 border border-white/[0.05] shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <div className="text-sm font-black text-white">{t.name}</div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t.productName}</div>
                </div>
                <div className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg ${t.fillPercentage < 15 ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'}`}>
                  {t.healthStatus}
                </div>
              </div>
              <div className="flex justify-between text-xs font-black text-white mb-2">
                  <span>{t.currentStock.toLocaleString(undefined, { maximumFractionDigits: 0 })} L Available</span>
                  <span className="text-orange-500">{t.fillPercentage.toFixed(1)}%</span>
              </div>
              <div className="w-full h-3 bg-[#0F172A] rounded-full overflow-hidden mb-3 shadow-[inset_0_2px_4px_rgba(0,0,0,0.8)] border border-white/5">
                <div 
                  className={`h-full rounded-full relative overflow-hidden ${t.fillPercentage < 15 ? 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.8)]' : t.fillPercentage < 30 ? 'bg-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.8)]' : 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.8)]'}`} 
                  style={{ width: `${Math.min(100, Math.max(0, t.fillPercentage))}%` }}
                >
                  <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_0%,rgba(255,255,255,0.4)_50%,transparent_100%)] w-[200%] animate-[shimmer_2s_infinite]"></div>
                </div>
              </div>
              <div className="flex justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  <span>Max Cap: {t.capacity.toLocaleString()} L</span>
                  <span>Est: {Math.max(0, Math.round(t.daysRemaining))} Days Left</span>
              </div>
            </div>
          );
        }) : (
          <div className="text-center py-6 text-[10px] font-black uppercase tracking-widest text-slate-500">No tank data available. Configure tanks to enable inventory intelligence.</div>
        )}
      </div>
    </div>
  );
}

// Ensure the widget loads with a Skeleton wrapper via Suspense
export function TankHealthWidget() {
  return (
    <Suspense fallback={
      <div className="w-full h-full p-6 flex flex-col animate-pulse bg-white/[0.02]">
        <div className="h-4 bg-white/10 w-1/3 rounded mb-6"></div>
        <div className="space-y-4">
          <div className="h-32 bg-white/5 rounded-2xl"></div>
          <div className="h-32 bg-white/5 rounded-2xl"></div>
        </div>
      </div>
    }>
      <TankHealthContent />
    </Suspense>
  );
}
