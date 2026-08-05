/**
 * @license SPDX-License-Identifier: Apache-2.0
 *
 * FuelPro Enterprise Business Operating System v4.0
 * SupplierPaymentCenterTab — Actionable Vendor Payment & Disbursement Workspace
 *
 * Implements Enterprise Rules #168 & #169
 */

import React from 'react';
import { SupplierEnrichedRecord } from '../../../../../../lib/reports-v2/engines/LedgerEngine';
import {
  CreditCard, DollarSign, Printer, CheckCircle2, Building2, Send, Wallet, FileText, CheckCircle
} from 'lucide-react';

function formatCurrency(v: number | string): string {
  const n = typeof v === 'number' ? v : Number(v) || 0;
  return `₨ ${n.toLocaleString('en-PK')}`;
}

interface SupplierPaymentCenterTabProps {
  payableSuppliers: SupplierEnrichedRecord[];
  lang: 'en' | 'ur';
  onOpenInspector: (record: Record<string, any>) => void;
  onOpenPaymentModal: (supplier: SupplierEnrichedRecord) => void;
}

export const SupplierPaymentCenterTab: React.FC<SupplierPaymentCenterTabProps> = ({
  payableSuppliers,
  lang,
  onOpenInspector,
  onOpenPaymentModal,
}) => {
  const isEn = lang === 'en';

  return (
    <div className="space-y-4 font-sans text-slate-800">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-2xs">
        <div>
          <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
            <span>💰</span>
            <span>{isEn ? 'Accounts Payable Payment & Disbursement Control Room' : 'سپلائر پے منٹ سینٹر اور رقم کی ادائیگی'}</span>
          </h2>
          <p className="text-xs font-bold text-slate-500 mt-0.5">
            {isEn
              ? 'Direct settlement panel for bank transfers, cash disbursements, cheque postings, digital wallets, and journal entries'
              : 'بینک ٹرانسفر، کیش اور چیک کے ذریعے سپلائر کی ادائیگی کا کنٹرول روم'}
          </p>
        </div>
        <span className="px-3 py-1 rounded-full bg-amber-50 text-amber-900 text-xs font-black border border-amber-200 shrink-0">
          {payableSuppliers.length} Pending OMC Disbursements
        </span>
      </div>

      <div className="space-y-3">
        {payableSuppliers.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center">
            <CheckCircle2 size={36} className="mx-auto text-emerald-500 mb-2" />
            <h3 className="text-base font-black text-slate-900">Zero Open Payables!</h3>
            <p className="text-xs font-extrabold text-slate-500 mt-1">All OMC supplier invoices and bills are paid in full.</p>
          </div>
        ) : (
          payableSuppliers.map((supplier) => (
            <div
              key={supplier.id}
              className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-2xs flex flex-col xl:flex-row xl:items-center justify-between gap-4 hover:border-amber-300 transition-all"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-black text-slate-900">{supplier.name}</h3>
                  <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-black">
                    {supplier.vendorCode || `SUP-${supplier.id.substring(0, 4)}`}
                  </span>
                  {supplier.isOverdue && (
                    <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-800 text-[10px] font-black border border-red-300">
                      URGENT DUE
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-4 text-xs font-extrabold text-slate-500 flex-wrap">
                  <span>Contact: <strong className="text-slate-800">{supplier.contactPerson || 'Zahid Sales Officer'}</strong></span>
                  <span>Terms: <strong className="text-slate-800">{supplier.creditTerms || 'Net 15 Days'}</strong></span>
                  <span>City: <strong className="text-slate-800">{supplier.city || 'Karachi'}</strong></span>
                </div>
              </div>

              <div className="flex items-center gap-3 flex-wrap xl:flex-nowrap shrink-0">
                <div className="text-right pr-2">
                  <span className="text-[10px] font-black text-slate-400 uppercase">Outstanding Payable</span>
                  <div className="text-lg font-black text-red-900">{formatCurrency(supplier.balance)}</div>
                </div>

                <div className="flex items-center gap-1.5 flex-wrap">
                  <button
                    onClick={() => onOpenPaymentModal(supplier)}
                    className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-black rounded-xl shadow-2xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <CreditCard size={14} />
                    <span>Make Payment</span>
                  </button>

                  <button
                    onClick={() => onOpenPaymentModal(supplier)}
                    className="px-2.5 py-2 bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1"
                    title="Bank Transfer"
                  >
                    <Building2 size={14} />
                    <span>Bank</span>
                  </button>

                  <button
                    onClick={() => onOpenPaymentModal(supplier)}
                    className="px-2.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1"
                    title="Cash Disbursement"
                  >
                    <DollarSign size={14} />
                    <span>Cash</span>
                  </button>

                  <button
                    onClick={() => onOpenPaymentModal(supplier)}
                    className="px-2.5 py-2 bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1"
                    title="Cheque Disbursed"
                  >
                    <FileText size={14} />
                    <span>Cheque</span>
                  </button>

                  <button
                    onClick={() => onOpenPaymentModal(supplier)}
                    className="px-2.5 py-2 bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1"
                    title="EasyPaisa / Digital Wallet"
                  >
                    <Wallet size={14} />
                    <span>EasyPaisa</span>
                  </button>

                  <button
                    onClick={() => onOpenInspector(supplier)}
                    className="p-2 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl transition-all cursor-pointer"
                    title="Print Remittance Advice"
                  >
                    <Printer size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
