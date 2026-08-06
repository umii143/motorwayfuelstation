import React from 'react';
import { Sparkles, CheckCircle2, ShieldCheck, TrendingUp, Bell } from 'lucide-react';

interface HeroAIPricingBannerProps {
  isUrdu: boolean;
}

export const HeroAIPricingBanner: React.FC<HeroAIPricingBannerProps> = ({ isUrdu }) => {
  const t = (en: string, ur: string) => (isUrdu ? ur : en);

  return (
    <div className="bg-gradient-to-r from-amber-100/70 via-[var(--bg-card)] to-amber-50/80 dark:from-emerald-950 dark:via-slate-900 dark:to-teal-950 border border-amber-300/60 dark:border-emerald-500/30 rounded-2xl p-4 shadow-md mb-6 relative overflow-hidden">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-600 to-amber-500 dark:from-emerald-500 dark:to-teal-400 flex items-center justify-center text-white font-black shadow-md">
            <Sparkles className="w-5 h-5 fill-current" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-[var(--text-main)] tracking-tight">
                {t('AI Pricing Intelligence', 'ای آئی قیمت سمارٹ انٹیلی جنس')}
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-800 dark:text-emerald-300 border border-amber-500/20 dark:border-emerald-500/40">
                Rule #173 Active
              </span>
            </div>
            <p className="text-xs text-[var(--text-muted)]">
              {t('Current pricing synchronized across POS & Dispensers.', 'قیمتیں لائیو پی او ایس اور ڈسپینسر پر ہم آہنگ ہیں۔')}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="px-2.5 py-1 rounded-lg bg-[var(--bg-subtle)] text-emerald-700 dark:text-emerald-400 border border-[var(--border-main)] font-semibold flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            {t('OMC rates verified', 'او ایم سی قیمتیں تصدیق شدہ')}
          </span>
          <span className="px-2.5 py-1 rounded-lg bg-[var(--bg-subtle)] text-emerald-700 dark:text-emerald-400 border border-[var(--border-main)] font-semibold flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            {t('Government levy updated', 'حکومتی لیوی اپ ڈیٹڈ')}
          </span>
          <span className="px-2.5 py-1 rounded-lg bg-[var(--bg-subtle)] text-emerald-700 dark:text-emerald-400 border border-[var(--border-main)] font-semibold flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            {t('Margin healthy', 'مارجن تسلی بخش')}
          </span>
          <span className="px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-900 dark:text-emerald-300 border border-amber-500/30 dark:border-emerald-500/40 font-mono font-bold flex items-center gap-1">
            <Bell className="w-3.5 h-3.5 text-amber-700 dark:text-emerald-300" />
            {t('Next Revision: 15 Aug', 'اگلی تبدیلی: 15 اگست')}
          </span>
        </div>
      </div>
    </div>
  );
};
