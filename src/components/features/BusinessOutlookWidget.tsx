import React from 'react';
import { TrendingUp, Package, AlertTriangle, Calendar, Activity } from 'lucide-react';
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
  const enterpriseCard = "bg-card border border-border rounded-[24px] shadow-xs p-6 transition-all duration-300";

  return (
    <DeferredWidget delay={500} skeleton={<div className={`h-[300px] ${enterpriseCard} animate-pulse`}></div>}>
      <div className={`${enterpriseCard} flex flex-col h-full`}>
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-orange-500" /> Business Outlook
            </h2>
            <div className="text-xs font-semibold text-muted-foreground mt-1">Deterministic Forecast</div>
          </div>
          {forecast && (
            <div className="flex flex-col items-end">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Confidence</span>
              <div className="flex items-center gap-2">
                <div className="w-20 h-1.5 bg-subtle border border-border rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full ${forecast.confidenceScore > 75 ? 'bg-emerald-500' : forecast.confidenceScore > 50 ? 'bg-orange-500' : 'bg-red-500'}`} 
                    style={{ width: `${forecast.confidenceScore}%` }} 
                  />
                </div>
                <span className="text-xs font-extrabold text-foreground">{forecast.confidenceScore}%</span>
              </div>
            </div>
          )}
        </div>

        {isComputing ? (
          <div className="flex-1 flex flex-col items-center justify-center py-8">
            <div className="w-8 h-8 rounded-full border-2 border-orange-500 border-t-transparent animate-spin mb-4" />
            <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Computing Forecast...</div>
          </div>
        ) : !forecast ? (
          <div className="flex-1 flex flex-col items-center justify-center py-8">
            <Activity className="w-8 h-8 text-muted-foreground mb-4" />
            <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider text-center">
              Forecast engine initializing...
            </div>
          </div>
        ) : (
          <div className="space-y-6 flex-1 flex flex-col overflow-y-auto pr-2 custom-scrollbar">
            
            {/* Projected Profit & Demand */}
            <div className="grid grid-cols-2 gap-3 shrink-0">
              <div className="bg-subtle rounded-2xl p-4 border border-border">
                <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Proj. Weekly Profit</div>
                {forecast.projectedWeeklyProfit !== null ? (
                  <div className="text-base font-extrabold text-emerald-600 dark:text-emerald-400">{formatCurrency(forecast.projectedWeeklyProfit, settings)}</div>
                ) : (
                  <div className="text-xs font-bold text-muted-foreground">Need more data</div>
                )}
              </div>
              
              <div className="bg-subtle rounded-2xl p-4 border border-border">
                <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Proj. 7-Day Demand</div>
                {forecast.demandForecast ? (
                  <div className="text-base font-extrabold text-blue-600 dark:text-blue-400">{forecast.demandForecast.projectedNext7Days.toLocaleString(undefined, {maximumFractionDigits: 0})} L</div>
                ) : (
                  <div className="text-xs font-bold text-muted-foreground">Need more data</div>
                )}
              </div>
            </div>

            {/* Seasonality Outlook */}
            {forecast.seasonality && (
              <div className="shrink-0 space-y-4">
                <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                  <Calendar className="w-3.5 h-3.5 text-muted-foreground" /> Seasonal Outlook
                </div>
                
                {!forecast.seasonality.isAvailable ? (
                  <div className="p-4 rounded-xl bg-subtle border border-border text-center">
                    <div className="text-xs font-bold text-muted-foreground">Insufficient Seasonal History</div>
                    <div className="text-[10px] font-semibold text-muted-foreground mt-1">Requires 12 months of data</div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Busiest Day */}
                    <div className="p-3 rounded-xl bg-subtle border border-border">
                      <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Busiest Day</div>
                      <div className="text-xs font-extrabold text-indigo-600 dark:text-indigo-400">{forecast.seasonality.busiestDay}</div>
                      {forecast.seasonality.weeklyTrend[forecast.seasonality.busiestDay] && (
                        <div className="text-[10px] font-bold text-muted-foreground mt-1">
                          {(forecast.seasonality.weeklyTrend[forecast.seasonality.busiestDay] * 100 - 100).toFixed(0)}% above avg
                        </div>
                      )}
                    </div>
                    
                    {/* Month Trend */}
                    <div className="p-3 rounded-xl bg-subtle border border-border">
                      <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Month Trend</div>
                      <div className="text-xs font-extrabold text-foreground">{forecast.seasonality.monthlySeasonStrength.status}</div>
                      <div className="text-[10px] font-bold text-muted-foreground mt-1">
                        {forecast.seasonality.monthlySeasonStrength.impactPct > 0 ? '+' : ''}{forecast.seasonality.monthlySeasonStrength.impactPct}% vs Year Avg
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Tank Depletion Risks */}
            <div className="shrink-0 mt-2">
              <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                <Package className="w-3.5 h-3.5 text-muted-foreground" /> Stock Depletion Risks
              </div>
              <div className="space-y-2">
                {forecast.tankForecasts.length > 0 ? (
                  forecast.tankForecasts.map(tf => {
                    if (tf.status === 'Insufficient Data' || tf.status === 'Healthy') return null;
                    
                    return (
                      <div key={tf.tankId} className="flex justify-between items-center p-3 rounded-xl bg-subtle border border-border">
                        <div className="flex items-center gap-3">
                          <AlertTriangle className={`w-4 h-4 ${tf.status === 'Critical' ? 'text-red-500' : 'text-orange-500'}`} />
                          <div>
                            <div className="text-xs font-bold text-foreground">{tf.tankName}</div>
                            <div className="text-[10px] font-medium text-muted-foreground">
                              Est. empty: {tf.estimatedStockOutDate ? new Date(tf.estimatedStockOutDate).toLocaleDateString() : 'N/A'}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className={`text-xs font-extrabold ${tf.status === 'Critical' ? 'text-red-600 dark:text-red-400' : 'text-orange-500'}`}>
                            {tf.estimatedRemainingDays} Days
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-4 text-[10px] font-bold text-muted-foreground">No tank data available</div>
                )}
                
                {forecast.tankForecasts.every(tf => tf.status === 'Healthy' || tf.status === 'Insufficient Data') && forecast.tankForecasts.some(tf => tf.status === 'Healthy') && (
                  <div className="text-center py-3 text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center justify-center gap-2 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
                    <Activity className="w-4 h-4" /> All tanks healthy (5+ days stock)
                  </div>
                )}
                {forecast.tankForecasts.every(tf => tf.status === 'Insufficient Data') && (
                  <div className="text-center py-4 text-[10px] font-bold text-muted-foreground bg-subtle rounded-xl border border-border">Need more sales records for depletion forecast</div>
                )}
              </div>
            </div>

          </div>
        )}
      </div>
    </DeferredWidget>
  );
}
