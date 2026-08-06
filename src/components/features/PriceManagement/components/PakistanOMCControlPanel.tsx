import React from 'react';
import { OMCRateEntry } from '../../../../services/priceManagement/omcRateMatrixEngine';
import { Building2, Clock, CheckCircle2, AlertCircle, RefreshCw, Send } from 'lucide-react';
import { formatCurrency } from '../../../../lib/currency';

interface PakistanOMCControlPanelProps {
  isUrdu: boolean;
  omcRates: OMCRateEntry[];
  onPublishRates: () => void;
}

export const PakistanOMCControlPanel: React.FC<PakistanOMCControlPanelProps> = ({
  isUrdu,
  omcRates,
  onPublishRates
}) => {
  const t = (en: string, ur: string) => (isUrdu ? ur : en);

  return (
    <div className="bg-[var(--bg-card)] border border-[var(--border-main)] rounded-2xl p-5 shadow-md mb-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4 pb-3 border-b border-[var(--border-main)]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-green-600 to-emerald-500 flex items-center justify-center font-black text-white text-lg shadow-md">
            🇵🇰
          </div>
          <div>
            <h3 className="text-base font-bold text-[var(--text-main)] tracking-tight flex items-center gap-2">
              {t('Pakistan OMC & OGRA Control Panel', 'پاکستان او ایم سی اور اوگرا آن لائن کنٹرول پینل')}
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-500/10 text-emerald-800 dark:text-emerald-400 border border-emerald-500/20 font-bold">
                Official Benchmark
              </span>
            </h3>
            <p className="text-xs text-[var(--text-muted)]">
              {t('Realtime rate matrix across PSO, Shell, Attock, GO, Hascol, APL, Euro Oil & Byco', 'تمام آئل مارکیٹنگ کمپنیوں کے ریٹس کا لائیو موازنہ')}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-[var(--bg-subtle)] px-3 py-1.5 rounded-xl border border-[var(--border-main)] font-mono text-xs flex items-center gap-2">
            <Clock className="w-4 h-4 text-emerald-600 dark:text-emerald-400 animate-pulse" />
            <span className="text-[var(--text-muted)]">{t('Next Govt Revision:', 'اگلی اوگرا تبدیلی:')}</span>
            <span className="text-emerald-700 dark:text-emerald-400 font-bold">Awaiting Circular</span>
          </div>

          <button
            onClick={onPublishRates}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 dark:from-emerald-600 dark:to-teal-600 hover:from-amber-500 hover:to-amber-600 text-white text-xs font-bold shadow-md transition-all"
          >
            <Send className="w-4 h-4" />
            {t('Auto Publish Rates', 'خودکار ریٹ پبلش')}
          </button>
        </div>
      </div>

      {/* OMC Table Matrix */}
      <div className="overflow-x-auto rounded-xl border border-[var(--border-main)]">
        <table className="w-full text-left text-xs">
          <thead className="bg-[var(--bg-subtle)] text-[var(--text-muted)] font-semibold uppercase tracking-wider text-[10px]">
            <tr>
              <th className="p-3">{t('OMC Company', 'کمپنی')}</th>
              <th className="p-3 text-right">{t('Super Petrol (MS)', 'سپر پیٹرول')}</th>
              <th className="p-3 text-right">{t('HSD Diesel', 'ڈیزیل')}</th>
              <th className="p-3 text-right">{t('HOBC Hi-Octane', 'ہائے اوکٹین')}</th>
              <th className="p-3 text-right">{t('Petrol Diff vs Ours', 'پیٹرول کا فرق')}</th>
              <th className="p-3 text-right">{t('Wholesale Price', 'ہول سیل ریٹ')}</th>
              <th className="p-3 text-center">{t('Source & Last Sync', 'ذریعہ و وقت')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border-muted)] text-[var(--text-main)] font-medium">
            {omcRates.map((omc) => (
              <tr key={omc.company} className="hover:bg-[var(--bg-hover)] transition-colors">
                <td className="p-3">
                  <div className="font-bold text-[var(--text-main)] flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    {omc.company}
                  </div>
                </td>
                <td className="p-3 text-right font-mono text-[var(--text-main)]">{formatCurrency(omc.petrolPrice)}</td>
                <td className="p-3 text-right font-mono text-[var(--text-main)]">{formatCurrency(omc.dieselPrice)}</td>
                <td className="p-3 text-right font-mono text-purple-700 dark:text-purple-300 font-bold">{formatCurrency(omc.hobcPrice)}</td>
                <td className="p-3 text-right font-mono">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    omc.petrolDiff === 0 ? 'bg-[var(--bg-subtle)] text-[var(--text-muted)]' : omc.petrolDiff < 0 ? 'bg-rose-500/10 text-rose-700 dark:text-rose-300' : 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                  }`}>
                    {omc.petrolDiff === 0 ? 'Exact Match' : `${omc.petrolDiff > 0 ? '+' : ''}${omc.petrolDiff.toFixed(2)}`}
                  </span>
                </td>
                <td className="p-3 text-right font-mono text-amber-700 dark:text-cyan-400 font-bold">{formatCurrency(omc.wholesalePetrol)}</td>
                <td className="p-3 text-center font-mono text-[10px] text-[var(--text-muted)]">
                  <div>{omc.source}</div>
                  <div className="text-emerald-700 dark:text-emerald-400 font-semibold">{omc.lastUpdated}</div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
