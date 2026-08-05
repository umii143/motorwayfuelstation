import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Sparkles, TrendingUp, TrendingDown, DollarSign, CheckCircle2, FileText, ArrowRight } from 'lucide-react';
import { PricingSimulationResult } from '../../../../services/priceManagement/pricingSimulationEngine';
import { formatCurrency } from '../../../../lib/currency';

interface PricingSimulationModalProps {
  simulation: PricingSimulationResult | null;
  isOpen: boolean;
  isUrdu: boolean;
  onClose: () => void;
  onConfirmPublish: () => void;
}

export const PricingSimulationModal: React.FC<PricingSimulationModalProps> = ({
  simulation,
  isOpen,
  isUrdu,
  onClose,
  onConfirmPublish
}) => {
  const t = (en: string, ur: string) => (isUrdu ? ur : en);

  if (!isOpen || !simulation) return null;

  const isGain = simulation.inventoryGainLoss >= 0;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 backdrop-blur-md flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-slate-900 border border-slate-800 rounded-3xl max-w-xl w-full text-white shadow-2xl overflow-hidden"
        >
          {/* Modal Header */}
          <div className="p-6 border-b border-slate-800 bg-slate-950 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-slate-950 font-black flex items-center justify-center shadow-lg shadow-emerald-500/20">
                <Sparkles className="w-5 h-5 fill-slate-950" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                  {t('Rule #173 — Pricing Simulation Engine', 'رول #173 پرائسنگ سمیولیشن انجن')}
                </h3>
                <p className="text-xs text-slate-400">
                  {t('Live pre-publish financial & inventory impact analysis', 'ریٹ پبلشنگ سے قبل مالی و اسٹاک اثر کا تجزیہ')}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center hover:bg-slate-700 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body Content */}
          <div className="p-6 space-y-5 text-xs">

            {/* Product Rate Delta Box */}
            <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-4 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-semibold text-slate-400 block">{simulation.productName}</span>
                <div className="flex items-center gap-3 mt-1">
                  <span className="font-mono text-slate-300 font-bold text-base line-through">
                    {formatCurrency(simulation.currentRate)}
                  </span>
                  <ArrowRight className="w-4 h-4 text-emerald-400" />
                  <span className="font-mono text-emerald-400 font-black text-xl">
                    {formatCurrency(simulation.proposedRate)}
                  </span>
                </div>
              </div>
              <div className="text-right font-mono">
                <span className="text-[10px] text-slate-400 block">{t('Rate Difference', 'قیمت کا فرق')}</span>
                <span className={`text-sm font-bold ${simulation.rateDelta >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {simulation.rateDelta >= 0 ? `+Rs ${simulation.rateDelta.toFixed(2)}` : `-Rs ${Math.abs(simulation.rateDelta).toFixed(2)}`} / L
                </span>
              </div>
            </div>

            {/* Impact Metrics Grid */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-800/50 border border-slate-700 p-3.5 rounded-xl">
                <span className="text-slate-400 text-[11px] block">{t('Current Tank Stock Volume', 'موجودہ اسٹاک والیم')}</span>
                <span className="font-mono font-bold text-white text-base">
                  {simulation.stockVolume.toLocaleString()} Liters
                </span>
              </div>

              <div className="bg-slate-800/50 border border-slate-700 p-3.5 rounded-xl">
                <span className="text-slate-400 text-[11px] block">{t('Inventory Gain / Loss Impact', 'اسٹاک ویلیو منافع/نقصان')}</span>
                <span className={`font-mono font-bold text-base ${isGain ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {isGain ? `+${formatCurrency(simulation.inventoryGainLoss)}` : `-${formatCurrency(Math.abs(simulation.inventoryGainLoss))}`}
                </span>
              </div>

              <div className="bg-slate-800/50 border border-slate-700 p-3.5 rounded-xl">
                <span className="text-slate-400 text-[11px] block">{t('Dealer Margin Delta', 'ڈیلر مارجن میں تبدیلی')}</span>
                <span className="font-mono font-bold text-emerald-300 text-sm">
                  +Rs {simulation.dealerMarginDelta.toFixed(2)} / L (New: Rs {simulation.newDealerMargin.toFixed(2)})
                </span>
              </div>

              <div className="bg-slate-800/50 border border-slate-700 p-3.5 rounded-xl">
                <span className="text-slate-400 text-[11px] block">{t('Projected Monthly Profit Impact', 'ماہانہ متوقع منافع')}</span>
                <span className="font-mono font-bold text-cyan-300 text-sm">
                  +{formatCurrency(simulation.projectedMonthlyProfitImpact)}
                </span>
              </div>
            </div>

            {/* Balanced Journal Entry Preview */}
            <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl space-y-2">
              <h4 className="font-bold text-slate-300 uppercase tracking-wider text-[10px] flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-purple-400" />
                {t('Automated Double-Entry Journal Preview', 'جرنل انٹری کا پیشگی نظارہ')}
              </h4>
              <div className="space-y-1 font-mono text-[11px]">
                <div className="flex justify-between text-slate-300">
                  <span>Debit: {simulation.journalEntryPreview.debitAccount}</span>
                  <span className="text-emerald-400 font-bold">{formatCurrency(simulation.journalEntryPreview.amount)}</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Credit: {simulation.journalEntryPreview.creditAccount}</span>
                  <span className="text-emerald-400 font-bold">{formatCurrency(simulation.journalEntryPreview.amount)}</span>
                </div>
                <div className="text-[10px] text-slate-400 pt-1 border-t border-slate-800 italic">
                  "{simulation.journalEntryPreview.description}"
                </div>
              </div>
            </div>

          </div>

          {/* Modal Footer Actions */}
          <div className="p-4 border-t border-slate-800 bg-slate-950 flex items-center justify-between gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-colors"
            >
              {t('Cancel Simulation', 'منسوخ کریں')}
            </button>

            <button
              onClick={onConfirmPublish}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 text-xs font-black shadow-lg shadow-emerald-500/20 transition-all"
            >
              <CheckCircle2 className="w-4 h-4" />
              {t('Confirm & Publish Rate Now', 'تصدیق اور برائے راست پبلش کریں')}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
