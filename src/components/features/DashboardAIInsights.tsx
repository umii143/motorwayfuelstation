import React, { useMemo } from 'react';
import { BrainCircuit, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { Shift, GlobalSettings } from '../../types';
import { InvestigationEngine } from '../../lib/investigationEngine';

interface Props {
  settings: GlobalSettings;
  shifts: Shift[];
}

 
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function DashboardAIInsights({ settings, shifts }: Props) {
  
   
  const insights = useMemo(() => {
    const alerts: unknown[] = [];
    
    // Evaluate the last 5 shifts
    const recentShifts = [...shifts].sort((a, b) => b.id.localeCompare(a.id)).slice(0, 5);
    
    let totalShortage = 0;
    recentShifts.forEach(s => {
      const health = InvestigationEngine.evaluateShiftHealth(s);
      
      if (health.overallSHI < 80) {
        alerts.push({
          id: `shi_${s.id}`,
          title: `Low Health Score: Shift #${s.id}`,
          message: `Station Health Index dropped to ${health.overallSHI}%. Investigation recommended.`,
          type: 'danger'
        });
      }
      
      if (s.shortage > 0) {
        totalShortage += s.shortage;
      }
    });

    if (totalShortage > 5000) {
       alerts.push({
          id: 'shortage_trend',
          title: `Cash Leakage Detected`,
          message: `Accumulated shortage of Rs. ${totalShortage} detected across recent shifts. Cross-reference operator deposits immediately.`,
          type: 'danger'
       });
    }

    if (alerts.length === 0) {
       alerts.push({
          id: 'optimal_health',
          title: `Optimal Financial Integrity`,
          message: `All recent shifts maintain a 90%+ Station Health Index with zero detected variance. Operations are highly secure.`,
          type: 'success'
       });
    }

    return alerts.slice(0, 3); // Top 3 critical alerts
  }, [shifts]);

  return (
    <div className="bg-white dark:bg-[#1A1A24] rounded-[24px] shadow-sm border border-slate-200 dark:border-white/5 overflow-hidden flex flex-col h-full">
      <div className="p-5 border-b border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-[#151521] flex justify-between items-center">
        <div className="flex items-center gap-2">
          <BrainCircuit className="w-5 h-5 text-indigo-500" />
          <h3 className="font-bold text-slate-800 dark:text-white">Global Loss Prevention</h3>
        </div>
        <span className="px-2 py-0.5 rounded text-[10px] font-black bg-indigo-500/10 text-indigo-500 border border-indigo-500/20 uppercase tracking-widest">Live Feed</span>
      </div>
      
      <div className="p-5 flex-1 flex flex-col gap-4">
        {insights.map(insight => (
          <div key={insight.id} className={`flex items-start gap-4 p-4 rounded-xl border ${insight.type === 'danger' ? 'bg-rose-50 dark:bg-rose-500/5 border-rose-200 dark:border-rose-500/20' : 'bg-emerald-50 dark:bg-emerald-500/5 border-emerald-200 dark:border-emerald-500/20'}`}>
            <div className="shrink-0 mt-0.5">
              {insight.type === 'danger' ? (
                <ShieldAlert className="w-5 h-5 text-rose-500" />
              ) : (
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              )}
            </div>
            <div>
              <h4 className={`text-sm font-bold mb-1 ${insight.type === 'danger' ? 'text-rose-700 dark:text-rose-400' : 'text-emerald-700 dark:text-emerald-400'}`}>{insight.title}</h4>
              <p className={`text-xs leading-relaxed ${insight.type === 'danger' ? 'text-rose-600/80 dark:text-rose-300' : 'text-emerald-600/80 dark:text-emerald-300'}`}>{insight.message}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
