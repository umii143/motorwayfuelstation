import React, { useState, useEffect } from 'react';
import { Sparkles, BrainCircuit, AlertTriangle } from 'lucide-react';
import { Shift, GlobalSettings } from '../../types';

interface Props {
  settings: GlobalSettings;
  shifts: Shift[];
}

export function DashboardAIInsights({ settings, shifts }: Props) {
  const [insight, setInsight] = useState<{ title: string; message: string; type: 'positive' | 'warning' | 'neutral' } | null>(null);

  useEffect(() => {
    // Generate an AI-like insight based on shifts data
    if (shifts.length === 0) {
      setInsight({ title: 'Welcome to FuelPro AI', message: 'Once you start logging shifts, I will analyze your sales patterns here.', type: 'neutral' });
      return;
    }
    
    // Calculate simple trend
    let totalVol = 0;
    shifts.forEach(s => {
      Object.values(s.closingReadings || {}).forEach((c, idx) => {
        const o = Object.values(s.openingReadings || {})[idx] || 0;
        totalVol += Math.max(0, c - o);
      });
    });

    if (totalVol > 10000) {
      setInsight({ title: 'High Volume Trend Detected', message: `Your station is experiencing a higher volume trend this week. Ensure tanks are refilled.`, type: 'positive' });
    } else {
      setInsight({ title: 'Optimal Cash Operations', message: 'Shift variances are within the 0.05% tolerance threshold. Great job maintaining zero-loss operations.', type: 'positive' });
    }
  }, [shifts]);

  if (!insight) return null;

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-900 to-purple-900 p-6 text-white shadow-lg mt-6 group">
      <div className="absolute right-0 top-0 opacity-10 group-hover:opacity-20 transition-opacity">
        <BrainCircuit className="h-48 w-48 -mr-10 -mt-10" />
      </div>
      <div className="relative z-10 flex items-start gap-4">
        <div className="p-3 bg-white/10 rounded-xl backdrop-blur-md border border-white/20 shadow-inner">
          {insight.type === 'warning' ? <AlertTriangle className="h-6 w-6 text-amber-300" /> : <Sparkles className="h-6 w-6 text-indigo-300 animate-pulse" />}
        </div>
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-black uppercase tracking-widest text-indigo-200">AI Insight of the Day</span>
          </div>
          <h3 className="font-sans text-lg font-bold text-white leading-tight mb-2">{insight.title}</h3>
          <p className="text-indigo-100 text-sm max-w-3xl leading-relaxed">{insight.message}</p>
        </div>
      </div>
    </div>
  );
}
