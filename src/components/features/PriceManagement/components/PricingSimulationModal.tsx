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
          className="bg-[var(--bg-card)] border border-[var(--border-main)] rounded-3xl max-w-xl w-full text-[var(--text-main)] shadow-2xl overflow-hidden"
        >
          {/* Modal Header */}
          <div className="p-6 border-b border-[var(--border-main)] bg-[var(--bg-subtle)] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-600 to-amber-500 dark:from-emerald-500 dark:to-teal-400 text-white font-black flex items-center justify-center shadow-md">
                <Sparkles className="w-5 h-5 fill-current" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-[var(--text-main)] tracking-tight flex items-center gap-2">
                  {t('Rule #173 — Pricing Simulation Engine', 'رول #173 پرائسنگ سمیولیشن انجن')}
                </h3>
                <p className="text-xs text-[var(--text-muted)]">
                  {t('Live pre-publish financial & inventory impact analysis', 'ریٹ پبلشنگ سے قبل مالی و اسٹاک اثر کا تجزیہ')}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-[var(--bg-subtle)] text-[var(--text-muted)] hover:text-[var(--text-main)] flex items-center justify-center hover:bg-[var(--bg-hover)] transition-colors border border-[var(--border-main)]"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body Content */}
          <div className="p-6 space-y-5 text-xs">

            {/* Product Rate Delta Box */}
            <div className="bg-[var(--bg-subtle)] border border-[var(--border-main)] rounded-2xl p-4 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-semibold text-[var(--text-muted)] block">{simulation.productName}</span>
                <div className="flex items-center gap-3 mt-1">
                  <span className="font-mono text-[var(--text-muted)] font-bold text-base line-through">
                    {formatCurrency(simulation.currentRate)}
                  </span>
                  <ArrowRight className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span className="font-mono text-emerald-700 dark:text-emerald-400 font-black text-xl">
                    {formatCurrency(simulation.proposedRate)}
                  </span>
                </div>
              </div>
              <div className="text-right font-mono">
                <span className="text-[10px] text-[var(--text-muted)] block">{t('Rate Difference', 'قیمت کا فرق')}</span>
                <span className={`text-sm font-bold ${simulation.rateDelta >= 0 ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-700 dark:text-rose-400'}`}>
                  {simulation.rateDelta >= 0 ? `+Rs ${simulation.rateDelta.toFixed(2)}` : `-Rs ${Math.abs(simulation.rateDelta).toFixed(2)}`} / L
                </span>
              </div>
            </div>

            {/* Impact Metrics Grid */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-[var(--bg-subtle)] border border-[var(--border-main)] p-3.5 rounded-xl">
                <span className="text-[var(--text-muted)] text-[11px] block">{t('Current Tank Stock Volume', 'موجودہ اسٹاک والیم')}</span>
                <span className="font-mono font-bold text-[var(--text-main)] text-base">
                  {simulation.stockVolume.toLocaleString()} Liters
                </span>
              </div>

              <div className="bg-[var(--bg-subtle)] border border-[var(--border-main)] p-3.5 rounded-xl">
                <span className="text-[var(--text-muted)] text-[11px] block">{t('Inventory Gain / Loss Impact', 'اسٹاک ویلیو منافع/نقصان')}</span>
                <span className={`font-mono font-bold text-base ${isGain ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-700 dark:text-rose-400'}`}>
                  {isGain ? `+${formatCurrency(simulation.inventoryGainLoss)}` : `-${formatCurrency(Math.abs(simulation.inventoryGainLoss))}`}
                </span>
              </div>

              <div className="bg-[var(--bg-subtle)] border border-[var(--border-main)] p-3.5 rounded-xl">
                <span className="text-[var(--text-muted)] text-[11px] block">{t('Dealer Margin Delta', 'ڈیلر مارجن میں تبدیلی')}</span>
                <span className="font-mono font-bold text-emerald-700 dark:text-emerald-300 text-sm">
                  +Rs {simulation.dealerMarginDelta.toFixed(2)} / L (New: Rs {simulation.newDealerMargin.toFixed(2)})
                </span>
              </div>

              <div className="bg-[var(--bg-subtle)] border border-[var(--border-main)] p-3.5 rounded-xl">
                <span className="text-[var(--text-muted)] text-[11px] block">{t('Projected Monthly Profit Impact', 'ماہانہ متوقع منافع')}</span>
                <span className="font-mono font-bold text-amber-700 dark:text-cyan-300 text-sm">
                  +{formatCurrency(simulation.projectedMonthlyProfitImpact)}
                </span>
              </div>
            </div>

            {/* Balanced Journal Entry Preview */}
            <div className="bg-[var(--bg-subtle)] border border-[var(--border-main)] p-4 rounded-xl space-y-2">
              <h4 className="font-bold text-[var(--text-main)] uppercase tracking-wider text-[10px] flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                {t('Automated Double-Entry Journal Preview', 'جرنل انٹری کا پیشگی نظارہ')}
              </h4>
              <div className="space-y-1 font-mono text-[11px]">
                <div className="flex justify-between text-[var(--text-main)]">
                  <span>Debit: {simulation.journalEntryPreview.debitAccount}</span>
                  <span className="text-emerald-700 dark:text-emerald-400 font-bold">{formatCurrency(simulation.journalEntryPreview.amount)}</span>
                </div>
                <div className="flex justify-between text-[var(--text-main)]">
                  <span>Credit: {simulation.journalEntryPreview.creditAccount}</span>
                  <span className="text-emerald-700 dark:text-emerald-400 font-bold">{formatCurrency(simulation.journalEntryPreview.amount)}</span>
                </div>
                <div className="text-[10px] text-[var(--text-muted)] pt-1 border-t border-[var(--border-muted)] italic">
                  "{simulation.journalEntryPreview.description}"
                </div>
              </div>
            </div>

          </div>

          {/* Modal Footer Actions */}
          <div className="p-4 border-t border-[var(--border-main)] bg-[var(--bg-subtle)] flex items-center justify-between gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-[var(--bg-card)] hover:bg-[var(--bg-hover)] text-[var(--text-main)] border border-[var(--border-main)] text-xs font-bold transition-colors"
            >
              {t('Cancel Simulation', 'منسوخ کریں')}
            </button>

            <button
              onClick={onConfirmPublish}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 dark:from-emerald-500 dark:to-teal-500 text-white text-xs font-black shadow-md transition-all"
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
