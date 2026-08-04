/**
 * @license SPDX-License-Identifier: Apache-2.0
 *
 * FuelPro Enterprise Business Operating System v4.0
 * CustomerLedgersTab — Debtors Receivables Ledger & Credit Limit Cards
 */

import React from 'react';
import { EnterpriseRegisterTable } from '../../EnterpriseRegisterTable';
import { Users, Plus } from 'lucide-react';

interface CustomerLedgersTabProps {
  lang: 'en' | 'ur';
  onOpenInspector: (record: Record<string, any>) => void;
}

export const CustomerLedgersTab: React.FC<CustomerLedgersTabProps> = ({ lang, onOpenInspector }) => {
  const customerLedgers = [
    { customerName: 'Ali Filling & Logistics', accountCode: '120101-001', creditLimit: 'Rs 1,000,000', openingBal: 'Rs 450,000', salesInvoiced: 'Rs 300,000', paymentsReceived: 'Rs 200,000', outstandingBal: 'Rs 550,000', status: 'ACTIVE' },
    { customerName: 'Zahid Goods Transport', accountCode: '120101-002', creditLimit: 'Rs 2,500,000', openingBal: 'Rs 800,000', salesInvoiced: 'Rs 600,000', paymentsReceived: 'Rs 600,000', outstandingBal: 'Rs 800,000', status: 'ACTIVE' },
    { customerName: 'Malik Bus Service', accountCode: '120101-003', creditLimit: 'Rs 500,000', openingBal: 'Rs 0', salesInvoiced: 'Rs 150,000', paymentsReceived: 'Rs 150,000', outstandingBal: 'Rs 0', status: 'CLEAR' },
  ];

  return (
    <div className="space-y-4 font-sans text-slate-800">
      {/* Top Customer KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-black text-slate-500">TOTAL DEBTORS</span>
          <div className="text-xl font-black text-slate-900 mt-1">3 Accounts</div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-black text-slate-500">TOTAL RECEIVABLE</span>
          <div className="text-xl font-black text-[#0B5C3D] mt-1">Rs 1,350,000</div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-black text-slate-500">CREDIT LIMIT ISSUED</span>
          <div className="text-xl font-black text-blue-600 mt-1">Rs 4,000,000</div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-black text-slate-500">OVERDUE DEBTORS</span>
          <div className="text-xl font-black text-amber-600 mt-1">1 Account</div>
        </div>
      </div>

      <div className="flex justify-between items-center bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-xs">
        <div>
          <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
            <Users size={18} className="text-emerald-600" />
            <span>Accounts Receivable Customer Credit Ledgers</span>
          </h2>
          <p className="text-xs font-bold text-slate-500 mt-0.5">
            Individual customer credit accounts, sales invoices, recovery receipts, and credit limits
          </p>
        </div>
        <button className="px-4 py-2 bg-[#0B5C3D] hover:bg-emerald-800 text-white text-xs font-black rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer">
          <Plus size={15} />
          <span>+ Receive Customer Payment</span>
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs">
        <EnterpriseRegisterTable
          columns={[
            { id: 'customerName', header: 'Customer Name', headerUr: 'کسٹمر نام', accessor: 'customerName', sortable: true },
            { id: 'accountCode', header: 'Account Code', headerUr: 'کوڈ', accessor: 'accountCode' },
            { id: 'creditLimit', header: 'Credit Limit (₨)', headerUr: 'کریڈٹ لمٹ', accessor: 'creditLimit' },
            { id: 'openingBal', header: 'Opening (₨)', headerUr: 'اوپننگ', accessor: 'openingBal' },
            { id: 'salesInvoiced', header: 'Invoiced Sales', headerUr: 'سیلز انوائس', accessor: 'salesInvoiced' },
            { id: 'paymentsReceived', header: 'Payments Received', headerUr: 'وصولی', accessor: 'paymentsReceived' },
            { id: 'outstandingBal', header: 'Net Outstanding', headerUr: 'بقایا جات', accessor: 'outstandingBal' },
            { id: 'status', header: 'Status', headerUr: 'اسٹیٹس', accessor: 'status' },
          ]}
          data={customerLedgers}
          language={lang}
          onRowClick={(row: Record<string, any>) => onOpenInspector(row)}
        />
      </div>
    </div>
  );
};
