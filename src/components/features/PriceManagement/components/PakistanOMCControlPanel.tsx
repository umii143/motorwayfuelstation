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
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl mb-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-green-600 to-emerald-500 flex items-center justify-center font-black text-white text-lg shadow-lg shadow-green-600/20">
            🇵🇰
          </div>
          <div>
            <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
              {t('Pakistan OMC & OGRA Control Panel', 'پاکستان او ایم سی اور اوگرا آن لائن کنٹرول پینل')}
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                Official Benchmark
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              {t('Realtime rate matrix across PSO, Shell, Attock, GO, Hascol, APL, Euro Oil & Byco', 'تمام آئل مارکیٹنگ کمپنیوں کے ریٹس کا لائیو موازنہ')}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-700 font-mono text-xs flex items-center gap-2">
            <Clock className="w-4 h-4 text-emerald-400 animate-pulse" />
            <span className="text-slate-300">{t('Next Govt Revision:', 'اگلی اوگرا تبدیلی:')}</span>
            <span className="text-emerald-400 font-bold">15 Aug 2026 (09d 04h)</span>
          </div>

          <button
            onClick={onPublishRates}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/20 transition-all"
          >
            <Send className="w-4 h-4" />
            {t('Auto Publish Rates', 'خودکار ریٹ پبلش')}
          </button>
        </div>
      </div>

      {/* OMC Table Matrix */}
      <div className="overflow-x-auto rounded-xl border border-slate-800">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-800/80 text-slate-300 font-semibold uppercase tracking-wider text-[10px]">
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
          <tbody className="divide-y divide-slate-800 text-slate-200 font-medium">
            {omcRates.map((omc) => (
              <tr key={omc.company} className="hover:bg-slate-800/40 transition-colors">
                <td className="p-3">
                  <div className="font-bold text-white flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                    {omc.company}
                  </div>
                </td>
                <td className="p-3 text-right font-mono text-slate-200">{formatCurrency(omc.petrolPrice)}</td>
                <td className="p-3 text-right font-mono text-slate-200">{formatCurrency(omc.dieselPrice)}</td>
                <td className="p-3 text-right font-mono text-purple-300">{formatCurrency(omc.hobcPrice)}</td>
                <td className="p-3 text-right font-mono">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    omc.petrolDiff === 0 ? 'bg-slate-800 text-slate-400' : omc.petrolDiff < 0 ? 'bg-rose-500/20 text-rose-300' : 'bg-emerald-500/20 text-emerald-300'
                  }`}>
                    {omc.petrolDiff === 0 ? 'Exact Match' : `${omc.petrolDiff > 0 ? '+' : ''}${omc.petrolDiff.toFixed(2)}`}
                  </span>
                </td>
                <td className="p-3 text-right font-mono text-cyan-400">{formatCurrency(omc.wholesalePetrol)}</td>
                <td className="p-3 text-center font-mono text-[10px] text-slate-400">
                  <div>{omc.source}</div>
                  <div className="text-emerald-400">{omc.lastUpdated}</div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
