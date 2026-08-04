/**
 * @license SPDX-License-Identifier: Apache-2.0
 *
 * FuelPro Enterprise Business Operating System v4.0
 * CustomerLedgerTab — Transactional Customer Ledger & Double-Entry Receipts
 *
 * Implements Enterprise Rules #166 & #167
 */

import React from 'react';
import { CustomerEnrichedRecord } from '../../../../../../lib/reports-v2/engines/LedgerEngine';
import { EnterpriseRegisterTable } from '../../EnterpriseRegisterTable';
import { BookOpen, Plus } from 'lucide-react';

function formatCurrency(v: number | string): string {
  const n = typeof v === 'number' ? v : Number(v) || 0;
  return `₨ ${n.toLocaleString('en-PK')}`;
}

interface CustomerLedgerTabProps {
  customers: CustomerEnrichedRecord[];
  lang: 'en' | 'ur';
  onOpenInspector: (record: Record<string, any>) => void;
  onOpenPaymentModal?: (customer: CustomerEnrichedRecord) => void;
}

export const CustomerLedgerTab: React.FC<CustomerLedgerTabProps> = ({
  customers,
  lang,
  onOpenInspector,
  onOpenPaymentModal,
}) => {
  const isEn = lang === 'en';

  const sampleLedgerEntries = [
    { date: 'May 15, 2025 04:30 PM', voucherNo: 'INV-2025-0515-01', customerName: 'Ali Filling & Logistics', description: 'Diesel 500L dispense invoice #99', debit: 'Rs 140,000', credit: 'Rs 0', runningBalance: 'Rs 550,000' },
    { date: 'May 15, 2025 02:15 PM', voucherNo: 'REC-2025-0515-04', customerName: 'Ali Filling & Logistics', description: 'Cash Recovery Payment deposited', debit: 'Rs 0', credit: 'Rs 200,000', runningBalance: 'Rs 410,000' },
    { date: 'May 14, 2025 11:00 AM', voucherNo: 'INV-2025-0514-88', customerName: 'Zahid Goods Transport', description: 'Super Petrol 800L dispense', debit: 'Rs 224,000', credit: 'Rs 0', runningBalance: 'Rs 800,000' },
    { date: 'May 14, 2025 09:45 AM', voucherNo: 'REC-2025-0514-02', customerName: 'Zahid Goods Transport', description: 'HBL Bank Transfer payment', debit: 'Rs 0', credit: 'Rs 600,000', runningBalance: 'Rs 576,000' },
  ];

  return (
    <div className="space-y-4 font-sans text-slate-800">
      <div className="flex justify-between items-center bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-2xs">
        <div>
          <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
            <BookOpen size={18} className="text-emerald-700" />
            <span>Customer Accounts Double-Entry Ledger History</span>
          </h2>
          <p className="text-xs font-bold text-slate-500 mt-0.5">
            Immutable transaction history of sales invoices, fuel dispensations, and recovery receipts
          </p>
        </div>

        {customers.length > 0 && (
          <button
            onClick={() => onOpenPaymentModal?.(customers[0])}
            className="px-4 py-2 bg-[#0B5C3D] hover:bg-emerald-800 text-white text-xs font-black rounded-xl shadow-2xs flex items-center gap-1.5 cursor-pointer"
          >
            <Plus size={15} />
            <span>+ Record Customer Receipt</span>
          </button>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-2xs">
        <EnterpriseRegisterTable
          columns={[
            { id: 'date', header: 'Date & Time', headerUr: 'تاریخ', accessor: 'date', sortable: true },
            { id: 'voucherNo', header: 'Invoice / Voucher #', headerUr: 'واؤچر #', accessor: 'voucherNo' },
            { id: 'customerName', header: 'Customer Account', headerUr: 'کسٹمر نام', accessor: 'customerName' },
            { id: 'description', header: 'Description / Narration', headerUr: 'تفصیل', accessor: 'description' },
            { id: 'debit', header: 'Debit Sales (₨)', headerUr: 'ڈبیٹ (سیلز)', accessor: 'debit' },
            { id: 'credit', header: 'Credit Payments (₨)', headerUr: 'کریڈٹ (وصولی)', accessor: 'credit' },
            { id: 'runningBalance', header: 'Running Balance', headerUr: 'بیلنس', accessor: 'runningBalance' },
          ]}
          data={sampleLedgerEntries}
          language={lang}
          onRowClick={(row: Record<string, any>) => onOpenInspector(row)}
        />
      </div>
    </div>
  );
};
