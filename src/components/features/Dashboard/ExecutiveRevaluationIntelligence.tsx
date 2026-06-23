import React, { useMemo } from 'react';
import { RateHistoryEntry, GlobalSettings } from '../../../types';
import { formatCurrency } from '../../../lib/currency';
import { t } from '../../../lib/translations';
import { DollarSign, Award, AlertTriangle, Calendar, Activity } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Cell } from 'recharts';
import RevaluationDrillDownModal from '../PriceManagement/RevaluationDrillDownModal';

interface ExecutiveRevaluationIntelligenceProps {
  rateHistory: RateHistoryEntry[];
  settings: GlobalSettings;
  language: string;
}

export default function ExecutiveRevaluationIntelligence({
  rateHistory,
  settings,
  language
}: ExecutiveRevaluationIntelligenceProps) {
  
  const [isDrillDownOpen, setIsDrillDownOpen] = React.useState(false);
  const [drillDownContext, setDrillDownContext] = React.useState<'all_time' | 'ytd' | 'month' | 'extremes'>('all_time');

  const openDrillDown = (context: 'all_time' | 'ytd' | 'month' | 'extremes') => {
    setDrillDownContext(context);
    setIsDrillDownOpen(true);
  };

  const stats = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const thisMonth = today.substring(0, 7);
    const thisYear = today.substring(0, 4);

    let todayImpact = 0;
    let monthlyImpact = 0;
    let annualImpact = 0;
    let lifetimeGain = 0;
    let lifetimeLoss = 0;
    let largestGain = 0;
    let largestLoss = 0;

    const monthlyDataMap: Record<string, number> = { /* empty */ };

    rateHistory.forEach(rh => {
      const impact = rh.inventoryImpact ?? rh.impactAmount ?? 0;
      const date = rh.effectiveDate || (rh.date || '');
      
      // Timeframes
      if (date === today) todayImpact += impact;
      if (date.startsWith(thisMonth)) monthlyImpact += impact;
      if (date.startsWith(thisYear)) annualImpact += impact;

      // Lifetime
      if (impact > 0) {
        lifetimeGain += impact;
        if (impact > largestGain) largestGain = impact;
      } else if (impact < 0) {
        lifetimeLoss += Math.abs(impact);
        if (Math.abs(impact) > largestLoss) largestLoss = Math.abs(impact);
      }

      // Heatmap / Trend Data (last 6 months)
      const monthKey = date.substring(0, 7); // YYYY-MM
      monthlyDataMap[monthKey] = (monthlyDataMap[monthKey] || 0) + impact;
    });

    const netReserve = lifetimeGain - lifetimeLoss;

    // Format data for chart (sort chronologically, keep last 6 months)
    const sortedMonths = Object.keys(monthlyDataMap).sort().slice(-6);
    const chartData = sortedMonths.map(m => ({
      name: m,
      impact: monthlyDataMap[m]
    }));

    return {
      todayImpact,
      monthlyImpact,
      annualImpact,
      lifetimeGain,
      lifetimeLoss,
      netReserve,
      largestGain,
      largestLoss,
      chartData
    };
  }, [rateHistory]);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex items-center gap-3 mb-2">
        <div className="p-2 bg-slate-800 rounded-lg">
          <Activity className="size-5 text-emerald-400" />
        </div>
        <div>
          <h2 className="text-xl font-black text-slate-800">
            {t('Executive Revaluation Intelligence', 'ایگزیکٹو ریویلیویشن انٹیلیجنس', language)}
          </h2>
          <p className="text-sm text-slate-500 font-medium">
            {t('Strategic overview of inventory value fluctuations', 'انوینٹری کی قیمتوں میں اتار چڑھاؤ کا اسٹریٹجک جائزہ', language)}
          </p>
        </div>
      </div>

      {/* KPI WIDGETS */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Lifetime Reserve */}
        <div 
          onClick={() => openDrillDown('all_time')}
          className="bg-slate-900 rounded-2xl p-5 shadow-lg relative overflow-hidden text-white cursor-pointer hover:ring-2 hover:ring-emerald-500 transition-all group"
        >
          <div className="absolute -right-6 -top-6 size-24 bg-white/5 rounded-full blur-xl pointer-events-none group-hover:bg-white/10 transition-colors"></div>
          <p className="text-sm font-bold text-slate-400 mb-2 flex items-center gap-2">
            <DollarSign className="size-4 text-amber-400" />
            Lifetime Net Reserve
          </p>
          <p className={`text-3xl font-black ${stats.netReserve >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {stats.netReserve >= 0 ? '+' : ''}{formatCurrency(stats.netReserve, settings)}
          </p>
          <div className="flex items-center gap-4 mt-4 text-xs font-medium border-t border-slate-700 pt-3">
            <span className="text-emerald-400">Gain: {formatCurrency(stats.lifetimeGain, settings)}</span>
            <span className="text-rose-400">Loss: {formatCurrency(stats.lifetimeLoss, settings)}</span>
          </div>
        </div>

        {/* Annual Impact */}
        <div 
          onClick={() => openDrillDown('ytd')}
          className="premium-card p-5 border cursor-pointer hover:border-emerald-400 hover:shadow-md transition-all"
        >
          <p className="text-sm font-bold text-slate-500 mb-2 flex items-center gap-2">
            <Calendar className="size-4" />
            YTD Annual Impact
          </p>
          <p className={`text-2xl font-black ${stats.annualImpact >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
            {stats.annualImpact >= 0 ? '+' : ''}{formatCurrency(stats.annualImpact, settings)}
          </p>
        </div>

        {/* Monthly Impact */}
        <div 
          onClick={() => openDrillDown('month')}
          className="premium-card p-5 border cursor-pointer hover:border-emerald-400 hover:shadow-md transition-all"
        >
          <p className="text-sm font-bold text-slate-500 mb-2 flex items-center gap-2">
            <Calendar className="size-4" />
            Monthly Impact
          </p>
          <p className={`text-2xl font-black ${stats.monthlyImpact >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
            {stats.monthlyImpact >= 0 ? '+' : ''}{formatCurrency(stats.monthlyImpact, settings)}
          </p>
        </div>

        {/* Extreems */}
        <div 
          onClick={() => openDrillDown('extremes')}
          className="premium-card p-5 border flex flex-col justify-between cursor-pointer hover:border-emerald-400 hover:shadow-md transition-all"
        >
          <div>
            <p className="text-xs font-bold text-slate-500 mb-1 flex items-center gap-1">
              <Award className="size-3 text-emerald-500" /> Largest Gain
            </p>
            <p className="text-lg font-black text-emerald-600">+{formatCurrency(stats.largestGain, settings)}</p>
          </div>
          <div className="mt-2">
            <p className="text-xs font-bold text-slate-500 mb-1 flex items-center gap-1">
              <AlertTriangle className="size-3 text-rose-500" /> Largest Loss
            </p>
            <p className="text-lg font-black text-rose-600">-{formatCurrency(stats.largestLoss, settings)}</p>
          </div>
        </div>
      </div>

      {/* HEATMAP / BAR CHART */}
      <div className="premium-card p-6 border">
        <h3 className="text-sm font-bold text-slate-800 mb-6 uppercase tracking-wider">
          {t('6-Month Revaluation Trend (Heatmap)', '6 ماہ کا ریویلیویشن ٹرینڈ', language)}
        </h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={stats.chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `${val / 1000}k`} />
              <Tooltip 
                cursor={{ fill: '#f8fafc' }}
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                formatter={(value: unknown) => [formatCurrency(value, settings), 'Impact']}
              />
              <Bar dataKey="impact" radius={[6, 6, 6, 6]}>
                {stats.chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.impact >= 0 ? '#10b981' : '#f43f5e'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <RevaluationDrillDownModal 
        isOpen={isDrillDownOpen}
        onClose={() => setIsDrillDownOpen(false)}
        rateHistory={rateHistory}
        settings={settings}
        initialContext={drillDownContext}
      />

    </div>
  );
}
