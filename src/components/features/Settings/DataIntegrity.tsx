import React, { useState, useEffect } from 'react';
import { ShieldCheck, Activity, AlertTriangle, CheckCircle2, XCircle, ArrowRight } from 'lucide-react';
import { GlobalSettings } from '../../../types';
import { 
  getShadowStats, 
  calculateIntegrityScore, 
  getOpenDriftCount,
  getUnresolvedCriticalCount
} from '../../../services/core/integrityDriftLog';

interface DataIntegrityProps {
  settings: GlobalSettings;
  activeStationId: string;
  onNavigate?: (viewId: string) => void;
}

export default function DataIntegrity({ settings, activeStationId, onNavigate }: DataIntegrityProps) {
  const isUrdu = settings.language === 'ur';
  const t = (en: string, ur: string) => (isUrdu ? ur : en);

  const [score, setScore] = useState(100);
  const [openDrift, setOpenDrift] = useState(0);
  const [criticalDrift, setCriticalDrift] = useState(0);
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    setScore(calculateIntegrityScore(activeStationId));
    setOpenDrift(getOpenDriftCount(activeStationId));
    setCriticalDrift(getUnresolvedCriticalCount(activeStationId));
    setStats(getShadowStats(activeStationId));
  }, [activeStationId]);

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="border-b border-slate-200 pb-4">
        <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
          <ShieldCheck className="h-6 w-6 text-indigo-600" />
          {t('Enterprise Data Integrity', 'ڈیٹا کی درستگی کا مرکز')}
        </h2>
        <p className="text-sm text-slate-500 mt-1 font-medium">
          {t('Settings module now serves as a summary. Full controls moved to Enterprise Command Center.', 'سیٹنگز ماڈیول اب خلاصہ دکھاتا ہے۔ مکمل کنٹرولز انٹرپرائز سینٹر میں منتقل کر دیے گئے ہیں۔')}
        </p>
      </div>

      <div className="bg-gradient-to-br from-slate-900 to-indigo-950 rounded-2xl p-6 md:p-8 text-white shadow-xl relative overflow-hidden">
        {/* Decorative background element */}
        <div className="absolute -right-20 -top-20 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl"></div>
        <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-rose-500/10 rounded-full blur-2xl"></div>

        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex-1 space-y-4">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/10 border border-white/20 rounded-full text-xs font-bold text-indigo-200">
              <Activity className="h-3.5 w-3.5" />
              {t('System Health Monitoring', 'سسٹم ہیلتھ مانیٹرنگ')}
            </div>
            
            <h3 className="text-2xl md:text-3xl font-black leading-tight">
              {t('Integrity verification is now active in Shadow Mode.', 'انٹیگریٹی کی تصدیق اب شیڈو موڈ میں فعال ہے۔')}
            </h3>
            
            <p className="text-slate-300 text-sm md:text-base max-w-xl leading-relaxed">
              {t(
                'FuelPro is running parallel validation to ensure complete financial accuracy before migrating to the new Operational Core.',
                'نئے آپریشنل کور پر منتقل ہونے سے پہلے مکمل مالیاتی درستگی کو یقینی بنانے کے لیے متوازی توثیق جاری ہے۔'
              )}
            </p>
            
            <button
              onClick={() => onNavigate && onNavigate('integrity_center')}
              className="mt-2 group flex items-center gap-2 bg-indigo-500 hover:bg-indigo-400 text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-lg shadow-indigo-500/25"
            >
              {t('Open Integrity Center', 'انٹیگریٹی سینٹر کھولیں')}
              <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

          <div className="shrink-0 flex items-center justify-center">
            <div className="relative w-40 h-40">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="45" fill="transparent" stroke="rgba(255,255,255,0.1)" strokeWidth="8" />
                <circle
                  cx="50" cy="50" r="45"
                  fill="transparent"
                  stroke={score >= 98 ? '#10b981' : score >= 90 ? '#f59e0b' : '#ef4444'}
                  strokeWidth="8"
                  strokeDasharray={`${(score / 100) * 283} 283`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-4xl font-black">{score}</span>
                <span className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest">Score</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-500 mb-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            {t('Validated Shifts', 'تصدیق شدہ شِفٹس')}
          </div>
          <div className="text-2xl font-black text-slate-900">{stats?.validatedShifts || 0}</div>
        </div>
        
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-500 mb-2">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            {t('Open Warnings', 'انتباہات')}
          </div>
          <div className="text-2xl font-black text-amber-600">{openDrift - criticalDrift}</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-500 mb-2">
            <XCircle className="h-4 w-4 text-rose-500" />
            {t('Critical Issues', 'اہم مسائل')}
          </div>
          <div className="text-2xl font-black text-rose-600">{criticalDrift}</div>
        </div>
      </div>
    </div>
  );
}
