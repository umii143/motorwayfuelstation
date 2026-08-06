/**
 * @license SPDX-License-Identifier: Apache-2.0
 *
 * FuelPro Enterprise Business Operating System v4.0
 * RecoveryCenterTab — Actionable Receivables Collection & Recovery Workspace
 *
 * Implements Enterprise Rules #166 & #167
 */

import React from 'react';
import { CustomerEnrichedRecord } from '../../../../../../lib/reports-v2/engines/LedgerEngine';
import {
  PhoneCall, MessageSquare, Printer, DollarSign, Send, ShieldAlert, CheckCircle2, Clock
} from 'lucide-react';

function formatCurrency(v: number | string): string {
  const n = typeof v === 'number' ? v : Number(v) || 0;
  return `₨ ${n.toLocaleString('en-PK')}`;
}

interface RecoveryCenterTabProps {
  debtorCustomers: CustomerEnrichedRecord[];
  lang: 'en' | 'ur';
  onOpenInspector: (record: Record<string, any>) => void;
  onOpenPaymentModal: (customer: CustomerEnrichedRecord) => void;
}

export const RecoveryCenterTab: React.FC<RecoveryCenterTabProps> = ({
  debtorCustomers,
  lang,
  onOpenInspector,
  onOpenPaymentModal,
}) => {
  const isEn = lang === 'en';

  const sendWhatsAppReminder = (customer: CustomerEnrichedRecord) => {
    const text = encodeURIComponent(
      `Dear ${customer.name}, your outstanding fuel account balance is ${formatCurrency(customer.balance)}. Please deposit your payment to avoid credit limit hold. Thank you - FuelPro Enterprise Station.`
    );
    const phone = customer.phone ? customer.phone.replace(/[^0-9]/g, '') : '923001234567';
    window.open(`https://wa.me/${phone}?text=${text}`, '_blank');
  };

  return (
    <div className="space-y-4 font-sans text-slate-800">
      <div className="flex justify-between items-center bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-2xs">
        <div>
          <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
            <span>💰</span>
            <span>Accounts Receivable Recovery Command Workspace</span>
          </h2>
          <p className="text-xs font-bold text-slate-500 mt-0.5">
            Direct action panel for immediate cash collection, WhatsApp reminders, phone calls, and statement prints
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-black border border-primary/25">
            {debtorCustomers.length} Active Recovery Priority Accounts
          </span>
        </div>
      </div>

      <div className="space-y-3">
        {debtorCustomers.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center">
            <CheckCircle2 size={36} className="mx-auto text-primary mb-2" />
            <h3 className="text-base font-black text-slate-900">Zero Overdue Dues!</h3>
            <p className="text-xs font-extrabold text-slate-500 mt-1">All trade debtor accounts are paid and clear.</p>
          </div>
        ) : (
          debtorCustomers.map((customer) => (
            <div
              key={customer.id}
              className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-primary/35 transition-all"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-black text-slate-900">{customer.name}</h3>
                  <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-black">
                    {customer.code || `CUS-${customer.id.substring(0, 4)}`}
                  </span>
                  {customer.isOverdue && (
                    <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-800 text-[10px] font-black border border-red-300">
                      OVERDUE (&gt;60 DAYS)
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-4 text-xs font-extrabold text-slate-500 flex-wrap">
                  <span>Phone: <strong className="text-slate-800">{customer.phone || '0300-1234567'}</strong></span>
                  <span>Credit Limit: <strong className="text-slate-800">{formatCurrency(customer.creditLimit || 1000000)}</strong></span>
                  <span>Officer: <strong className="text-slate-800">{customer.salesman || 'Zahid Manager'}</strong></span>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <div className="text-right">
                  <span className="text-[10px] font-black text-slate-400 uppercase">Outstanding Due</span>
                  <div className="text-lg font-black text-primary">{formatCurrency(customer.balance)}</div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => onOpenPaymentModal(customer)}
                    className="px-3.5 py-2 bg-primary hover:bg-primary-hover text-white text-xs font-black rounded-xl shadow-2xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <DollarSign size={14} />
                    <span>Receive Payment</span>
                  </button>

                  <button
                    onClick={() => sendWhatsAppReminder(customer)}
                    className="p-2 bg-primary/10 hover:bg-primary/15 text-primary border border-primary/25 rounded-xl transition-all cursor-pointer"
                    title="Send WhatsApp Reminder"
                  >
                    <MessageSquare size={16} />
                  </button>

                  <a
                    href={`tel:${customer.phone || '03001234567'}`}
                    className="p-2 bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 rounded-xl transition-all cursor-pointer"
                    title="Call Customer"
                  >
                    <PhoneCall size={16} />
                  </a>

                  <button
                    onClick={() => onOpenInspector(customer)}
                    className="p-2 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl transition-all cursor-pointer"
                    title="Print Statement"
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
