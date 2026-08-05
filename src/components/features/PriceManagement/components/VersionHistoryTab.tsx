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
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl mb-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-500 to-indigo-600 flex items-center justify-center text-white font-bold shadow-lg shadow-purple-500/20">
            <History className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
              {t('Version History & Rollback System', 'قیمتوں کی ہسٹری اور ورژن رول بیک')}
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-purple-500/20 text-purple-300 border border-purple-500/40">
                SAP IS-Oil Compatible
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              {t('Immutable tariff revision logs with 1-click rollback & version restoration', 'تمام پرانی اور موجودہ قیمتوں کا ورژن کنٹرول ریکارڈ')}
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {versions.map((ver) => (
          <div key={ver.versionCode} className="bg-slate-800/60 border border-slate-700/70 rounded-2xl p-4 transition-all">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-3 pb-3 border-b border-slate-700/60">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40">
                    Version {ver.versionNumber}
                  </span>
                  <h4 className="font-bold text-white text-sm font-mono">{ver.versionCode}</h4>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${ver.status === 'active' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-slate-700 text-slate-400'}`}>
                    {ver.status.toUpperCase()}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1">{ver.notes}</p>
              </div>

              <div className="flex items-center gap-3 text-xs">
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block">{t('Effective Date', 'نافذ العمل تاریخ')}</span>
                  <span className="font-mono text-slate-200">{ver.effectiveDate}</span>
                </div>
                {ver.status !== 'active' && (
                  <button
                    onClick={() => onRollback(ver)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-bold transition-colors"
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
                <div key={p.productId} className="bg-slate-900/60 p-3 rounded-xl border border-slate-800 text-xs">
                  <span className="font-bold text-slate-200 block mb-1">{p.productName}</span>
                  <div className="flex justify-between font-mono">
                    <span className="text-slate-400 line-through">{formatCurrency(p.oldPrice)}</span>
                    <span className="text-emerald-400 font-bold">{formatCurrency(p.newPrice)}</span>
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono mt-1">
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
