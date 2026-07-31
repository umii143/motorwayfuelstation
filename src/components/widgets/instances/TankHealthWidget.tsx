import React, { Suspense } from 'react';
import { Database } from 'lucide-react';
import { useTankMetrics } from '../../../hooks/useTankMetrics';

function TankHealthContent() {
  const { tanks } = useTankMetrics();

  return (
    <div className="w-full h-full p-6 flex flex-col bg-card rounded-2xl border border-border">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
          <Database className="w-4 h-4 text-orange-500" /> Tank Intelligence Center
        </h2>
      </div>
      <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
        {tanks.length > 0 ? tanks.map((t) => {
          return (
            <div key={t.id} className="bg-subtle rounded-2xl p-5 border border-border">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <div className="text-sm font-bold text-foreground">{t.name}</div>
                  <div className="text-xs font-medium text-muted-foreground">{t.productName}</div>
                </div>
                <div className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg ${t.fillPercentage < 15 ? 'bg-red-500/20 text-red-600 dark:text-red-400 border border-red-500/30' : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'}`}>
                  {t.healthStatus}
                </div>
              </div>
              <div className="flex justify-between text-xs font-bold text-foreground mb-2">
                <span>{t.currentStock.toLocaleString(undefined, { maximumFractionDigits: 0 })} L Available</span>
                <span className="text-orange-500 font-extrabold">{t.fillPercentage.toFixed(1)}%</span>
              </div>
              <div className="w-full h-3 bg-card rounded-full overflow-hidden mb-3 border border-border">
                <div 
                  className={`h-full rounded-full relative overflow-hidden ${t.fillPercentage < 15 ? 'bg-red-500' : t.fillPercentage < 30 ? 'bg-orange-500' : 'bg-emerald-500'}`} 
                  style={{ width: `${Math.min(100, Math.max(0, t.fillPercentage))}%` }}
                >
                  <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_0%,rgba(255,255,255,0.4)_50%,transparent_100%)] w-[200%] animate-[shimmer_2s_infinite]"></div>
                </div>
              </div>
              <div className="flex justify-between text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                <span>Max Cap: {t.capacity.toLocaleString()} L</span>
                <span>Est: {Math.max(0, Math.round(t.daysRemaining))} Days Left</span>
              </div>
            </div>
          );
        }) : (
          <div className="text-center py-8 text-xs font-bold text-muted-foreground">No tank data available. Configure tanks in System Settings to enable inventory intelligence.</div>
        )}
      </div>
    </div>
  );
}

export function TankHealthWidget() {
  return (
    <Suspense fallback={
      <div className="w-full h-full p-6 flex flex-col animate-pulse bg-card rounded-2xl border border-border">
        <div className="h-4 bg-subtle w-1/3 rounded mb-6"></div>
        <div className="space-y-4">
          <div className="h-32 bg-subtle rounded-2xl"></div>
          <div className="h-32 bg-subtle rounded-2xl"></div>
        </div>
      </div>
    }>
      <TankHealthContent />
    </Suspense>
  );
}
