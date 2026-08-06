import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, DollarSign, Calendar, Clock, FileText, CheckCircle2 } from 'lucide-react';
import { Product } from '../../../../types';

interface UpdatePriceModalProps {
  isOpen: boolean;
  isUrdu: boolean;
  products: Product[];
  onClose: () => void;
  onSubmitProposal: (
    productId: string,
    productName: string,
    oldPrice: number,
    newPrice: number,
    effectiveDate: string,
    effectiveTime: string,
    reason: string
  ) => void;
}

export const UpdatePriceModal: React.FC<UpdatePriceModalProps> = ({
  isOpen,
  isUrdu,
  products,
  onClose,
  onSubmitProposal
}) => {
  const t = (en: string, ur: string) => (isUrdu ? ur : en);

  const fuelProducts = products.filter((p) => p.type === 'fuel');
  const [selectedProductId, setSelectedProductId] = useState(fuelProducts[0]?.id || 'p_petrol');
  const selectedProduct = fuelProducts.find((p) => p.id === selectedProductId) || fuelProducts[0];

  const currentRate = selectedProduct?.rate || 285.45;
  const [newRateStr, setNewRateStr] = useState('');
  const [effectiveDate, setEffectiveDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [effectiveTime, setEffectiveTime] = useState('00:00');
  const [reason, setReason] = useState('Official OGRA Fortnightly Revision');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newPrice = parseFloat(newRateStr);
    if (isNaN(newPrice) || newPrice <= 0) {
      alert(t('Please enter a valid selling rate.', 'براہ کرم صحیح قیمت درج کریں۔'));
      return;
    }

    onSubmitProposal(
      selectedProductId,
      selectedProduct?.name || 'Super Petrol',
      currentRate,
      newPrice,
      effectiveDate,
      effectiveTime,
      reason
    );
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 backdrop-blur-md flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-[var(--bg-card)] border border-[var(--border-main)] rounded-3xl max-w-lg w-full text-[var(--text-main)] shadow-2xl overflow-hidden"
        >
          {/* Modal Header */}
          <div className="p-6 border-b border-[var(--border-main)] bg-[var(--bg-subtle)] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-600 to-amber-500 dark:from-emerald-500 dark:to-teal-400 text-white font-black flex items-center justify-center shadow-md">
                <DollarSign className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-[var(--text-main)] tracking-tight">
                  {t('Update Fuel Retail Price', 'فیول ریٹیل قیمت اپ ڈیٹ کریں')}
                </h3>
                <p className="text-xs text-[var(--text-muted)]">
                  {t('Rule #174 — Single Source of Truth Price Master Update', 'سرکاری اوگرا قیمت سازی اور تجویز سائنک')}
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

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">

            {/* Select Product */}
            <div className="space-y-1">
              <label className="text-[var(--text-muted)] font-bold uppercase text-[10px] tracking-wider block">
                {t('Select Fuel Product', 'فیول پروڈکٹ کا انتخاب')}
              </label>
              <select
                value={selectedProductId}
                onChange={(e) => setSelectedProductId(e.target.value)}
                className="w-full bg-[var(--bg-subtle)] border border-[var(--border-main)] rounded-xl p-3 text-[var(--text-main)] text-xs font-semibold focus:outline-none focus:border-amber-600 dark:focus:border-emerald-500"
              >
                {fuelProducts.map((p) => (
                  <option key={p.id} value={p.id} className="bg-[var(--bg-card)] text-[var(--text-main)]">
                    {p.name} (Current: Rs. {p.rate})
                  </option>
                ))}
              </select>
            </div>

            {/* Rate Comparison Box */}
            <div className="bg-[var(--bg-subtle)] border border-[var(--border-main)] rounded-xl p-3.5 flex items-center justify-between font-mono">
              <div>
                <span className="text-[10px] text-[var(--text-muted)] block">{t('Current Active Rate', 'موجودہ جاری ریٹ')}</span>
                <span className="text-base font-bold text-[var(--text-main)]">Rs. {currentRate} / L</span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-[var(--text-muted)] block">{t('Proposed New Rate', 'تجویز کردہ نیا ریٹ')}</span>
                <span className="text-base font-black text-emerald-700 dark:text-emerald-400">
                  {newRateStr ? `Rs. ${parseFloat(newRateStr).toFixed(2)}` : 'Rs. 0.00'} / L
                </span>
              </div>
            </div>

            {/* New Price Input */}
            <div className="space-y-1">
              <label className="text-[var(--text-muted)] font-bold uppercase text-[10px] tracking-wider block">
                {t('New Selling Rate (Rs / Liter)', 'نیا سیلز ریٹ (روپے فی لیٹر)')}
              </label>
              <input
                type="number"
                step="0.01"
                required
                placeholder="e.g. 289.90"
                value={newRateStr}
                onChange={(e) => setNewRateStr(e.target.value)}
                className="w-full bg-[var(--bg-subtle)] border border-[var(--border-main)] rounded-xl p-3 text-emerald-700 dark:text-emerald-400 font-mono font-black text-base focus:outline-none focus:border-amber-600 dark:focus:border-emerald-500"
              />
            </div>

            {/* Effective Date & Time */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[var(--text-muted)] font-bold uppercase text-[10px] tracking-wider block">
                  {t('Effective Date', 'نافذ العمل تاریخ')}
                </label>
                <input
                  type="date"
                  required
                  value={effectiveDate}
                  onChange={(e) => setEffectiveDate(e.target.value)}
                  className="w-full bg-[var(--bg-subtle)] border border-[var(--border-main)] rounded-xl p-2.5 text-[var(--text-main)] font-mono focus:outline-none focus:border-amber-600 dark:focus:border-emerald-500"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[var(--text-muted)] font-bold uppercase text-[10px] tracking-wider block">
                  {t('Effective Time', 'نافذ العمل وقت')}
                </label>
                <input
                  type="time"
                  required
                  value={effectiveTime}
                  onChange={(e) => setEffectiveTime(e.target.value)}
                  className="w-full bg-[var(--bg-subtle)] border border-[var(--border-main)] rounded-xl p-2.5 text-[var(--text-main)] font-mono focus:outline-none focus:border-amber-600 dark:focus:border-emerald-500"
                />
              </div>
            </div>

            {/* Reason */}
            <div className="space-y-1">
              <label className="text-[var(--text-muted)] font-bold uppercase text-[10px] tracking-wider block">
                {t('Revision Reason / Circular Ref', 'تبدیلی کی وجہ / اوگرا سرکلر')}
              </label>
              <input
                type="text"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full bg-[var(--bg-subtle)] border border-[var(--border-main)] rounded-xl p-3 text-[var(--text-main)] focus:outline-none focus:border-amber-600 dark:focus:border-emerald-500"
              />
            </div>

            {/* Actions */}
            <div className="pt-3 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl bg-[var(--bg-card)] hover:bg-[var(--bg-hover)] text-[var(--text-main)] border border-[var(--border-main)] font-bold transition-colors"
              >
                {t('Cancel', 'منسوخ')}
              </button>

              <button
                type="submit"
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 dark:from-emerald-500 dark:to-teal-500 text-white font-black shadow-md transition-all hover:from-amber-500 hover:to-amber-600"
              >
                <CheckCircle2 className="w-4 h-4" />
                {t('Submit Proposal for Approval', 'منظوری کے لیے جمع کریں')}
              </button>
            </div>

          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
