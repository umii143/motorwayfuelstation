/**
 * @license SPDX-License-Identifier: Apache-2.0
 *
 * FuelPro Enterprise Business Operating System v4.0
 * PaymentSummaryTab — Dedicated Payment Analytics & Collections Sub-Workspace
 *
 * Implements Enterprise Rule #137 & Rule #144
 */

import React from 'react';
import { EnterpriseRegisterTable } from '../../EnterpriseRegisterTable';
import { CreditCard, DollarSign, Smartphone } from 'lucide-react';

interface PaymentSummaryTabProps {
  lang: 'en' | 'ur';
  onSelectRecord?: (record: Record<string, any>) => void;
}

export const PaymentSummaryTab: React.FC<PaymentSummaryTabProps> = ({
  lang,
  onSelectRecord,
}) => {
  const isEn = lang === 'en';

  const paymentMethods = [
    { method: '🛍️ Cash Collections', txns: 210, amount: 'Rs 320,000', percentage: '56.1%', status: 'VERIFIED_IN_HAND' },
    { method: '💳 Card Payments (POS Terminal)', txns: 78, amount: 'Rs 120,000', percentage: '21.1%', status: 'SETTLED_HBL' },
    { method: '📱 EasyPaisa Mobile Wallet', txns: 42, amount: 'Rs 80,000', percentage: '14.0%', status: 'CONFIRMED' },
    { method: '📱 JazzCash Mobile Wallet', txns: 16, amount: 'Rs 30,000', percentage: '5.3%', status: 'CONFIRMED' },
    { method: '🌐 HBL Bank Direct Transfer', txns: 10, amount: 'Rs 20,000', percentage: '3.5%', status: 'POSTED_GL' },
  ];

  return (
    <div className="space-y-4">
      {/* COLLECTIONS KPIS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-emerald-50/80 border border-emerald-200/90 rounded-2xl p-4 flex flex-col justify-between shadow-xs">
          <span className="text-xs font-black text-emerald-900">Total Shift Collections</span>
          <div className="text-2xl font-black text-[#0B5C3D] tracking-tight">Rs 570,000</div>
          <span className="text-[10px] font-extrabold text-emerald-700 mt-1">100% Shift Total</span>
        </div>

        <div className="bg-[#0B5C3D] text-white rounded-2xl p-4 flex flex-col justify-between shadow-xs">
          <span className="text-xs font-black text-emerald-200">Physical Cash In Hand</span>
          <div className="text-2xl font-black text-white tracking-tight">Rs 320,000</div>
          <span className="text-[10px] font-extrabold text-emerald-300 mt-1">56.1% Cash Ratio</span>
        </div>

        <div className="bg-blue-50/80 border border-blue-200/90 rounded-2xl p-4 flex flex-col justify-between shadow-xs">
          <span className="text-xs font-black text-blue-900">Bank Card POS</span>
          <div className="text-2xl font-black text-blue-900 tracking-tight">Rs 120,000</div>
          <span className="text-[10px] font-extrabold text-blue-700 mt-1">21.1% Card Ratio</span>
        </div>

        <div className="bg-purple-50/80 border border-purple-200/90 rounded-2xl p-4 flex flex-col justify-between shadow-xs">
          <span className="text-xs font-black text-purple-900">Digital Wallets</span>
          <div className="text-2xl font-black text-purple-900 tracking-tight">Rs 110,000</div>
          <span className="text-[10px] font-extrabold text-purple-700 mt-1">19.3% EasyPaisa/JazzCash</span>
        </div>
      </div>

      {/* PAYMENT METHODS TABLE */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs space-y-3">
        <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
          <CreditCard size={16} className="text-indigo-600" />
          <span>Payment Methods & Collections Breakdown</span>
        </h2>

        <EnterpriseRegisterTable
          columns={[
            { id: 'method', header: 'Payment Method', headerUr: 'ادائیگی کا طریقہ', accessor: 'method', sortable: true },
            { id: 'txns', header: 'Transactions', headerUr: 'ٹرانزیکشنز', accessor: 'txns', isNumeric: true },
            { id: 'amount', header: 'Total Collected (₨)', headerUr: 'کل رقم', accessor: 'amount' },
            { id: 'percentage', header: 'Share %', headerUr: 'حصہ %', accessor: 'percentage' },
            { id: 'status', header: 'Verification Status', headerUr: 'تصدیق اسٹیٹس', accessor: 'status' },
          ]}
          data={paymentMethods}
          language={lang}
          onRowClick={(row) => onSelectRecord?.(row)}
        />
      </div>
    </div>
  );
};
