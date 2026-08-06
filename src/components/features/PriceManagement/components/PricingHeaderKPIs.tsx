import React from 'react';
import { Fuel, DollarSign, Clock, AlertTriangle, TrendingUp, ShieldCheck, Activity, BarChart3 } from 'lucide-react';
import { formatCurrency } from '../../../../lib/currency';

interface PricingHeaderKPIsProps {
  isUrdu: boolean;
  petrolPrice: number;
  dieselPrice: number;
  cngPrice: number;
  avgMargin: number;
  changesToday: number;
  estimatedRevaluation: number;
  pendingApprovals: number;
  nextUpdateDate: string;
}

export const PricingHeaderKPIs: React.FC<PricingHeaderKPIsProps> = ({
  isUrdu,
  petrolPrice,
  dieselPrice,
  cngPrice,
  avgMargin,
  changesToday,
  estimatedRevaluation,
  pendingApprovals,
  nextUpdateDate
}) => {
  const t = (en: string, ur: string) => (isUrdu ? ur : en);

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3 mb-6">
      {/* 1. Super Petrol */}
      <div className="bg-[var(--bg-card)] border border-[var(--border-main)] rounded-xl p-3.5 shadow-sm text-[var(--text-main)]">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] uppercase font-bold text-[var(--text-muted)] block tracking-wider">
            {t('Super Petrol', 'سپر پیٹرول')}
          </span>
          <Fuel className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
        </div>
        <div className="text-xl font-black text-[var(--text-main)] font-mono">{formatCurrency(petrolPrice || 285.45)}</div>
        <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-semibold flex items-center gap-0.5">
          ▲ +1.35 (0.47%)
        </span>
      </div>

      {/* 2. HSD Diesel */}
      <div className="bg-[var(--bg-card)] border border-[var(--border-main)] rounded-xl p-3.5 shadow-sm text-[var(--text-main)]">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] uppercase font-bold text-[var(--text-muted)] block tracking-wider">
            {t('HSD Diesel', 'ہائی اسپیڈ ڈیزیل')}
          </span>
          <Fuel className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
        </div>
        <div className="text-xl font-black text-[var(--text-main)] font-mono">{formatCurrency(dieselPrice || 293.80)}</div>
        <span className="text-[10px] text-rose-700 dark:text-rose-400 font-semibold flex items-center gap-0.5">
          ▼ -0.80 (-0.27%)
        </span>
      </div>

      {/* 3. CNG Rate */}
      <div className="bg-[var(--bg-card)] border border-[var(--border-main)] rounded-xl p-3.5 shadow-sm text-[var(--text-main)]">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] uppercase font-bold text-[var(--text-muted)] block tracking-wider">
            {t('CNG Rate', 'سی این جی')}
          </span>
          <Fuel className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
        </div>
        <div className="text-xl font-black text-[var(--text-main)] font-mono">{formatCurrency(cngPrice || 220.00)}</div>
        <span className="text-[10px] text-[var(--text-muted)] font-semibold">— Unchanged</span>
      </div>

      {/* 4. Average Margin / Liter */}
      <div className="bg-[var(--bg-card)] border border-[var(--border-main)] rounded-xl p-3.5 shadow-sm text-[var(--text-main)]">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] uppercase font-bold text-[var(--text-muted)] block tracking-wider">
            {t('Avg Margin / L', 'اوسط مارجن فی لیٹر')}
          </span>
          <DollarSign className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
        </div>
        <div className="text-xl font-black text-emerald-700 dark:text-emerald-400 font-mono">Rs {avgMargin.toFixed(2)}</div>
        <span className="text-[10px] text-emerald-700 dark:text-emerald-300 font-semibold">Healthy Margin</span>
      </div>

      {/* 5. Today's Price Changes */}
      <div className="bg-[var(--bg-card)] border border-[var(--border-main)] rounded-xl p-3.5 shadow-sm text-[var(--text-main)]">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] uppercase font-bold text-[var(--text-muted)] block tracking-wider">
            {t("Today's Changes", 'آج کی تبدیلیاں')}
          </span>
          <Activity className="w-3.5 h-3.5 text-amber-600 dark:text-cyan-400" />
        </div>
        <div className="text-xl font-black text-amber-700 dark:text-cyan-400 font-mono">{changesToday}</div>
        <span className="text-[10px] text-amber-800 dark:text-cyan-300 font-semibold">Revisions Sync</span>
      </div>

      {/* 6. Next Scheduled Update */}
      <div className="bg-[var(--bg-card)] border border-[var(--border-main)] rounded-xl p-3.5 shadow-sm text-[var(--text-main)]">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] uppercase font-bold text-[var(--text-muted)] block tracking-wider">
            {t('Next Revision', 'اگلی تبدیلی')}
          </span>
          <Clock className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
        </div>
        <div className="text-sm font-black text-purple-800 dark:text-purple-300 font-mono mt-1">{nextUpdateDate}</div>
        <span className="text-[10px] text-purple-700 dark:text-purple-400 font-semibold">OGRA Fortnightly</span>
      </div>

      {/* 7. Estimated Inventory Revaluation */}
      <div className="bg-[var(--bg-card)] border border-[var(--border-main)] rounded-xl p-3.5 shadow-sm text-[var(--text-main)]">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] uppercase font-bold text-[var(--text-muted)] block tracking-wider">
            {t('Stock Reval Gain', 'اسٹاک ویلیو اثر')}
          </span>
          <BarChart3 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
        </div>
        <div className="text-lg font-black text-emerald-700 dark:text-emerald-400 font-mono">+{formatCurrency(estimatedRevaluation)}</div>
        <span className="text-[10px] text-emerald-700 dark:text-emerald-300 font-semibold">Gain on Stock</span>
      </div>

      {/* 8. Pending Price Approvals */}
      <div className="bg-[var(--bg-card)] border border-[var(--border-main)] rounded-xl p-3.5 shadow-sm text-[var(--text-main)]">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] uppercase font-bold text-[var(--text-muted)] block tracking-wider">
            {t('Pending Approvals', 'منظوری کے منتظر')}
          </span>
          <AlertTriangle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
        </div>
        <div className="text-xl font-black text-rose-700 dark:text-rose-400 font-mono">{pendingApprovals}</div>
        <span className="text-[10px] text-rose-700 dark:text-rose-300 font-semibold">Approval Needed</span>
      </div>
    </div>
  );
};
