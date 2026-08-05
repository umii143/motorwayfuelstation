import React from 'react';
import { PlusCircle, Calendar, CheckSquare, Send, Printer, Calculator, Download, FileText, RotateCcw } from 'lucide-react';

interface PricingQuickActionsToolbarProps {
  isUrdu: boolean;
  onOpenUpdateModal: () => void;
  onOpenScheduleModal: () => void;
  onOpenApproveModal: () => void;
  onPublishRates: () => void;
  onPrintBoard: () => void;
  onOpenMarginCalc: () => void;
  onImportOMC: () => void;
  onExportHistory: () => void;
  onOpenRollback: () => void;
}

export const PricingQuickActionsToolbar: React.FC<PricingQuickActionsToolbarProps> = ({
  isUrdu,
  onOpenUpdateModal,
  onOpenScheduleModal,
  onOpenApproveModal,
  onPublishRates,
  onPrintBoard,
  onOpenMarginCalc,
  onImportOMC,
  onExportHistory,
  onOpenRollback
}) => {
  const t = (en: string, ur: string) => (isUrdu ? ur : en);

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl mb-6">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
          {t('Pricing Operations & Rate Controls', 'قیمت کنٹرول اور اقدامات')}
        </h4>
        <span className="text-[10px] text-emerald-400 font-mono">Pricing Domain Only (Rule #172)</span>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={onOpenUpdateModal}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/20 transition-all"
        >
          <PlusCircle className="w-4 h-4" />
          {t('Update Fuel Price', 'قیمت تبدیل کریں')}
        </button>

        <button
          onClick={onOpenScheduleModal}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 text-xs font-bold transition-colors"
        >
          <Calendar className="w-4 h-4 text-cyan-400" />
          {t('Schedule Change', 'شیڈول تبدیلی')}
        </button>

        <button
          onClick={onOpenApproveModal}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 text-xs font-bold transition-colors"
        >
          <CheckSquare className="w-4 h-4 text-amber-400" />
          {t('Approve Revision', 'قیمت منظوری')}
        </button>

        <button
          onClick={onPublishRates}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-lg shadow-purple-600/20 transition-all"
        >
          <Send className="w-4 h-4" />
          {t('Publish Rates (Sync All)', 'ریٹس لائیو پبلش کریں')}
        </button>

        <button
          onClick={onOpenRollback}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-bold transition-colors"
        >
          <RotateCcw className="w-4 h-4 text-rose-400" />
          {t('Rollback Version', 'ورژن رول بیک')}
        </button>

        <button
          onClick={onOpenMarginCalc}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition-colors"
        >
          <Calculator className="w-4 h-4 text-emerald-400" />
          {t('Margin Calculator', 'مارجن کیلوکولیٹر')}
        </button>

        <button
          onClick={onPrintBoard}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition-colors"
        >
          <Printer className="w-4 h-4 text-slate-400" />
          {t('Print Price Board', 'پرائس بورڈ پرنٹ')}
        </button>

        <button
          onClick={onImportOMC}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition-colors"
        >
          <Download className="w-4 h-4 text-blue-400" />
          {t('Import OMC Rates', 'او ایم سی امپورٹ')}
        </button>

        <button
          onClick={onExportHistory}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition-colors"
        >
          <FileText className="w-4 h-4 text-indigo-400" />
          {t('Export History', 'ہسٹری ایکسپورٹ')}
        </button>
      </div>
    </div>
  );
};
