import React, { useState } from 'react';
import { Truck, CheckCircle, Receipt, CreditCard } from 'lucide-react';
import { Supplier, BankAccount, GlobalSettings } from '../../../types';
import { useFinancialStore } from '../../../stores/useFinancialStore';
import { useTreasuryStore } from '../../../stores/useTreasuryStore';
import { useSupplierStore } from '../../../stores/useSupplierStore';
import { useStation } from '../../../contexts/StationContext';
import { t as translate } from '../../../lib/translations';

interface SupplierPaymentsProps {
  suppliers: Supplier[];
  banks: BankAccount[];
  settings: GlobalSettings;
  onClose: () => void;
}

export default function SupplierPayments({ suppliers, banks, settings, onClose }: SupplierPaymentsProps) {
  const { showToast } = useStation();
  const t = (en: string, ur: string) => translate(en, ur, settings);

  const [selectedSupplierId, setSelectedSupplierId] = useState(suppliers[0]?.id || '');
  const [paymentMode, setPaymentMode] = useState<'bank' | 'cash' | 'digital'>('bank');
  const [accountId, setAccountId] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [reference, setReference] = useState('');

  const selectedSupplier = suppliers.find(s => s.id === selectedSupplierId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSupplier) {
      showToast('Please select a supplier.', 'error');
      return;
    }

    const payAmount = Number(amount);
    if (!payAmount || payAmount <= 0) {
      showToast('Please enter a valid amount.', 'error');
      return;
    }

    if (!accountId) {
      showToast('Please select a payment account.', 'error');
      return;
    }

    try {
      const handleUpdateBanks = useFinancialStore.getState().handleUpdateBanks;
      const supplierStore = useSupplierStore.getState();

      const paymentId = `sup_pay_${Date.now()}`;

      // Update Supplier Balance
      await supplierStore.handleUpdateSupplier({
        ...selectedSupplier,
        balance: selectedSupplier.balance - payAmount
      });

      // Update Bank/Cash Balance
      if (paymentMode === 'bank') {
        const updatedBanks = banks.map(b => b.id === accountId ? { ...b, balance: b.balance - payAmount } : b);
        await handleUpdateBanks(updatedBanks);
      } else if (paymentMode === 'cash') {
        const cashAccounts = useTreasuryStore.getState().cashAccounts;
        const acc = cashAccounts.find(a => a.id === accountId);
        if (acc) {
          await useTreasuryStore.getState().handleUpdateCashAccount({ ...acc, balance: acc.balance - payAmount }, '');
        }
      } else if (paymentMode === 'digital') {
        const digitalAccounts = useFinancialStore.getState().digitalAccounts;
        const acc = digitalAccounts.find(a => a.id === accountId);
        if (acc) {
          const updatedDig = digitalAccounts.map(d => d.id === accountId ? { ...d, balance: d.balance - payAmount } : d);
          await useFinancialStore.getState().handleUpdateDigitalAccounts(updatedDig);
        }
      }

      // Generate Journal Entry
      await useFinancialStore.getState().handleAddJournalEntry({
        id: `jr_${Date.now()}`,
        date: new Date(date).toISOString(),
        partyId: selectedSupplier.id,
        partyType: 'supplier',
        partyName: selectedSupplier.name,
        type: 'debit',
        amount: payAmount,
        description: `Supplier Payment (${paymentMode}) - Ref: ${reference || 'N/A'}`,
        referenceId: paymentId
      });

      // Also record in Treasury Center Transactions
      await useTreasuryStore.getState().recordTransaction({
        id: `trx_sup_${Date.now()}`,
        date: new Date(date).toISOString(),
        sourceAccountId: accountId,
        sourceAccountType: paymentMode === 'cash' ? 'shift_cash' : paymentMode as any, // fallback type
        destinationAccountId: selectedSupplier.id,
        destinationAccountType: 'digital', // representation
        amount: payAmount,
        type: 'withdrawal',
        description: `Supplier Payment: ${selectedSupplier.name}`,
        performedBy: 'System',
        status: 'completed'
      }, '', '');

      showToast(t('Payment recorded successfully.', 'ادائیگی کامیابی سے درج ہو گئی۔'), 'success');
      onClose();
    } catch (err: any) {
      console.error(err);
      showToast('Failed to record payment.', 'error');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
      <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-xl relative max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
          <h3 className="font-sans text-base font-bold text-slate-900 flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-emerald-600" />
            <span>{t('Pay Supplier Bill', 'سپلائر بل کی ادائیگی')}</span>
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-650 cursor-pointer font-bold text-xl">&times;</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">{t('Select Supplier:', 'سپلائر منتخب کریں:')}</label>
            <select
              required
              value={selectedSupplierId}
              onChange={(e) => setSelectedSupplierId(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 font-sans text-sm focus:border-emerald-500 outline-none"
            >
              <option value="">{t('-- Select Supplier --', '-- سپلائر منتخب کریں --')}</option>
              {suppliers.map(s => (
                <option key={s.id} value={s.id}>{s.name} (Bal: Rs. {s.balance.toLocaleString()})</option>
              ))}
            </select>
            {selectedSupplier && (
              <div className="mt-2 text-xs text-slate-600 bg-slate-50 p-2 rounded-md border border-slate-200 flex justify-between">
                <span>{t('Current Payable Balance:', 'موجودہ واجب الادا بیلنس:')}</span>
                <strong className={selectedSupplier.balance > 0 ? 'text-red-600' : 'text-emerald-600'}>
                  Rs. {selectedSupplier.balance.toLocaleString()}
                </strong>
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">{t('Payment Method:', 'ادائیگی کا طریقہ:')}</label>
            <select
              value={paymentMode}
              onChange={(e) => {
                setPaymentMode(e.target.value as any);
                setAccountId('');
              }}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 font-sans text-sm focus:border-emerald-500 outline-none"
            >
              <option value="bank">{t('Bank Transfer', 'بینک ٹرانسفر')}</option>
              <option value="cash">{t('Cash / Safe', 'نقد')}</option>
              <option value="digital">{t('Digital Wallet', 'ڈیجیٹل والٹ')}</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">{t('From Account:', 'اکاؤنٹ سے:')}</label>
            <select
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 font-sans text-sm focus:border-emerald-500 outline-none"
            >
              <option value="">{t('-- Select Account --', '-- اکاؤنٹ منتخب کریں --')}</option>
              {paymentMode === 'bank' && banks.map(b => (
                <option key={b.id} value={b.id}>{b.name} (Bal: Rs. {b.balance.toLocaleString()})</option>
              ))}
              {paymentMode === 'cash' && useTreasuryStore(state => state.cashAccounts).map(c => (
                <option key={c.id} value={c.id}>{c.name} (Bal: Rs. {c.balance.toLocaleString()})</option>
              ))}
              {paymentMode === 'digital' && useFinancialStore(state => state.digitalAccounts).map(d => (
                <option key={d.id} value={d.id}>{d.name} (Bal: Rs. {d.balance.toLocaleString()})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">{t('Amount to Pay:', 'ادائیگی کی رقم:')}</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">Rs</span>
              <input
                type="number"
                required
                min="0.01"
                step="0.01"
                max={selectedSupplier?.balance > 0 ? selectedSupplier.balance : undefined}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 py-2 font-mono text-sm focus:border-emerald-500 outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
             <div>
               <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">{t('Date:', 'تاریخ:')}</label>
               <input
                 type="date"
                 required
                 value={date}
                 onChange={(e) => setDate(e.target.value)}
                 className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 font-sans text-sm focus:border-emerald-500 outline-none"
               />
             </div>
             <div>
               <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">{t('Reference No:', 'حوالہ نمبر:')}</label>
               <input
                 type="text"
                 value={reference}
                 onChange={(e) => setReference(e.target.value)}
                 placeholder="e.g. CHQ-293"
                 className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 font-sans text-sm focus:border-emerald-500 outline-none"
               />
             </div>
          </div>

          {selectedSupplier && Number(amount) > 0 && (
             <div className="mt-4 bg-emerald-50 rounded-lg p-3 border border-emerald-100 flex justify-between items-center">
               <span className="text-emerald-800 font-medium text-sm">{t('New Balance:', 'نیا بیلنس:')}</span>
               <strong className="text-emerald-700">
                  Rs. {(selectedSupplier.balance - Number(amount)).toLocaleString()}
               </strong>
             </div>
          )}

          <button
            type="submit"
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-sans text-sm font-bold tracking-wider rounded-lg shadow-md mt-6 cursor-pointer flex justify-center items-center gap-2"
          >
            <CheckCircle className="size-4" />
            {t('CONFIRM PAYMENT', 'ادائیگی کنفرم کریں')}
          </button>
        </form>
      </div>
    </div>
  );
}
