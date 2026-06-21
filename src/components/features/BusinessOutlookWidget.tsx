import React from 'react';
import { TrendingUp, Package, AlertTriangle, Calendar, Activity, BarChart2 } from 'lucide-react';
import { ForecastResult } from '../../workers/forecast.worker';
import { formatCurrency } from '../../lib/currency';
import { GlobalSettings } from '../../types';
import { DeferredWidget } from '../ui/DeferredWidget';

interface BusinessOutlookWidgetProps {
  forecast: ForecastResult | null;
  isComputing: boolean;
  settings: GlobalSettings;
}

export function BusinessOutlookWidget({ forecast, isComputing, settings }: BusinessOutlookWidgetProps) {
  const liquidGlass = "relative overflow-hidden backdrop-blur-[30px] saturate-[150%] bg-gradient-to-br from-white/[0.08] to-white/[0.02] border border-white/[0.08] shadow-[inset_0_1px_1px_rgba(255,255,255,0.1),0_20px_80px_rgba(0,0,0,0.6)] rounded-[24px] transition-all duration-500";

  return (
    <DeferredWidget delay={500} skeleton={<div className={`h-[300px] ${liquidGlass} animate-pulse bg-white/5`}></div>}>
      <div className={`${liquidGlass} p-6 flex flex-col h-full`}>
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-orange-500" /> Business Outlook
            </h2>
            <div className="text-sm font-medium text-slate-300 mt-1">Deterministic Forecast</div>
          </div>
          {forecast && (
            <div className="flex flex-col items-end">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Confidence</span>
              <div className="flex items-center gap-2">
                <div className="w-24 h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full ${forecast.confidenceScore > 75 ? 'bg-emerald-500' : forecast.confidenceScore > 50 ? 'bg-orange-500' : 'bg-red-500'}`} 
                    style={{ width: `${forecast.confidenceScore}%` }} 
                  />
                </div>
                <span className="text-sm font-black text-white">{forecast.confidenceScore}%</span>
              </div>
            </div>
          )}
        </div>

        {isComputing ? (
          <div className="flex-1 flex flex-col items-center justify-center py-8">
            <div className="w-8 h-8 rounded-full border-2 border-orange-500 border-t-transparent animate-spin mb-4" />
            <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">Computing Forecast...</div>
          </div>
        ) : !forecast ? (
          <div className="flex-1 flex flex-col items-center justify-center py-8">
            <Activity className="w-8 h-8 text-slate-600 mb-4" />
            <div className="text-xs font-bold text-slate-400 uppercase tracking-widest text-center">
              Forecast engine initializing...
            </div>
          </div>
        ) : (
          <div className="space-y-6 flex-1 flex flex-col">
            
            {/* Projected Profit */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/[0.03] rounded-2xl p-4 border border-white/[0.05] shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]">
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Proj. Weekly Profit</div>
                {forecast.projectedWeeklyProfit !== null ? (
                  <div className="text-lg font-black text-emerald-400">{formatCurrency(forecast.projectedWeeklyProfit, settings)}</div>
                ) : (
                  <div className="text-sm font-bold text-slate-500">Need more data</div>
                )}
              </div>
              
              <div className="bg-white/[0.03] rounded-2xl p-4 border border-white/[0.05] shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]">
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Proj. 7-Day Demand</div>
                {forecast.demandForecast ? (
                  <div className="text-lg font-black text-blue-400">{forecast.demandForecast.projectedNext7Days.toLocaleString(undefined, {maximumFractionDigits: 0})} L</div>
                ) : (
                  <div className="text-sm font-bold text-slate-500">Need more data</div>
                )}
              </div>
            </div>

            {/* Tank Depletion Risks */}
            <div className="flex-1">
              <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                <Package className="w-3.5 h-3.5 text-slate-400" /> Stock Depletion Risks
              </div>
              <div className="space-y-2 max-h-[140px] overflow-y-auto pr-2 custom-scrollbar">
                {forecast.tankForecasts.length > 0 ? (
                  forecast.tankForecasts.map(tf => {
                    if (tf.status === 'Insufficient Data') return null;
                    if (tf.status === 'Healthy') return null; // Only show risks
                    
                    return (
                      <div key={tf.tankId} className="flex justify-between items-center p-3 rounded-xl bg-white/[0.02] border border-white/[0.05]">
                        <div className="flex items-center gap-3">
                          <AlertTriangle className={`w-4 h-4 ${tf.status === 'Critical' ? 'text-red-500' : 'text-orange-500'}`} />
                          <div>
                            <div className="text-xs font-bold text-white">{tf.tankName}</div>
                            <div className="text-[10px] font-medium text-slate-400">
                              Est. empty: {tf.estimatedStockOutDate ? new Date(tf.estimatedStockOutDate).toLocaleDateString() : 'N/A'}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className={`text-sm font-black ${tf.status === 'Critical' ? 'text-red-400' : 'text-orange-400'}`}>
                            {tf.estimatedRemainingDays} Days
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-4 text-[10px] font-bold text-slate-500">No tank data available</div>
                )}
                
                {forecast.tankForecasts.every(tf => tf.status === 'Healthy' || tf.status === 'Insufficient Data') && forecast.tankForecasts.some(tf => tf.status === 'Healthy') && (
                  <div className="text-center py-4 text-xs font-bold text-emerald-500 flex items-center justify-center gap-2">
                    <Activity className="w-4 h-4" /> All tanks healthy (5+ days stock)
                  </div>
                )}
                {forecast.tankForecasts.every(tf => tf.status === 'Insufficient Data') && (
                  <div className="text-center py-4 text-[10px] font-bold text-slate-500">Need more sales records for depletion forecast</div>
                )}
              </div>
            </div>

          </div>
        )}
      </div>
    </DeferredWidget>
  );
}
