import React from 'react';
import { PriceVersionRecord } from '../../../../services/priceManagement/versionHistoryEngine';
import { History, RotateCcw, ShieldCheck, CheckCircle2, Clock } from 'lucide-react';
import { formatCurrency } from '../../../../lib/currency';

interface VersionHistoryTabProps {
  isUrdu: boolean;
  versions: PriceVersionRecord[];
  onRollback: (version: PriceVersionRecord) => void;
}

export const VersionHistoryTab: React.FC<VersionHistoryTabProps> = ({
  isUrdu,
  versions,
  onRollback
}) => {
  const t = (en: string, ur: string) => (isUrdu ? ur : en);

  return (
    <div className="bg-[var(--bg-card)] border border-[var(--border-main)] rounded-2xl p-5 shadow-md mb-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5 pb-4 border-b border-[var(--border-main)]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white font-bold shadow-md">
            <History className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-[var(--text-main)] tracking-tight flex items-center gap-2">
              {t('Version History & Rollback System', 'قیمتوں کی ہسٹری اور ورژن رول بیک')}
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-purple-500/10 text-purple-800 dark:text-purple-300 border border-purple-500/20 font-bold">
                SAP IS-Oil Compatible
              </span>
            </h3>
            <p className="text-xs text-[var(--text-muted)]">
              {t('Immutable tariff revision logs with 1-click rollback & version restoration', 'تمام پرانی اور موجودہ قیمتوں کا ورژن کنٹرول ریکارڈ')}
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {versions.map((ver) => (
          <div key={ver.versionCode} className="bg-[var(--bg-subtle)] border border-[var(--border-main)] rounded-2xl p-4 transition-all">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-3 pb-3 border-b border-[var(--border-main)]">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-purple-500/10 text-purple-800 dark:text-purple-300 border border-purple-500/20">
                    Version {ver.versionNumber}
                  </span>
                  <h4 className="font-bold text-[var(--text-main)] text-sm font-mono">{ver.versionCode}</h4>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${ver.status === 'active' ? 'bg-emerald-500/10 text-emerald-800 dark:text-emerald-400 border border-emerald-500/20' : 'bg-[var(--bg-card)] text-[var(--text-muted)] border border-[var(--border-main)]'}`}>
                    {ver.status.toUpperCase()}
                  </span>
                </div>
                <p className="text-xs text-[var(--text-muted)] mt-1">{ver.notes}</p>
              </div>

              <div className="flex items-center gap-3 text-xs">
                <div className="text-right">
                  <span className="text-[10px] text-[var(--text-muted)] block">{t('Effective Date', 'نافذ العمل تاریخ')}</span>
                  <span className="font-mono text-[var(--text-main)]">{ver.effectiveDate}</span>
                </div>
                {ver.status !== 'active' && (
                  <button
                    onClick={() => onRollback(ver)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-800 dark:text-rose-300 border border-rose-500/30 text-xs font-bold transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    {t('Rollback to V' + ver.versionNumber, 'رول بیک')}
                  </button>
                )}
              </div>
            </div>

            {/* Rates Table */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {ver.productRates.map((p) => (
                <div key={p.productId} className="bg-[var(--bg-card)] p-3 rounded-xl border border-[var(--border-main)] text-xs">
                  <span className="font-bold text-[var(--text-main)] block mb-1">{p.productName}</span>
                  <div className="flex justify-between font-mono">
                    <span className="text-[var(--text-muted)] line-through">{formatCurrency(p.oldPrice)}</span>
                    <span className="text-emerald-700 dark:text-emerald-400 font-bold">{formatCurrency(p.newPrice)}</span>
                  </div>
                  <div className="text-[10px] text-[var(--text-muted)] font-mono mt-1">
                    Margin: Rs {p.dealerMargin.toFixed(2)}/L
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
