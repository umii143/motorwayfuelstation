/**
 * @license SPDX-License-Identifier: Apache-2.0
 *
 * FuelPro Enterprise Business Operating System v4.0
 * CustomerRegisterTab — Enriched Master Customer Directory
 *
 * Implements Enterprise Rules #166 & #167
 */

import React from 'react';
import { CustomerEnrichedRecord } from '../../../../../../lib/reports-v2/engines/LedgerEngine';
import { EnterpriseRegisterTable } from '../../EnterpriseRegisterTable';
import { Users, Plus, ShieldCheck } from 'lucide-react';

function formatCurrency(v: number | string): string {
  const n = typeof v === 'number' ? v : Number(v) || 0;
  return `₨ ${n.toLocaleString('en-PK')}`;
}

interface CustomerRegisterTabProps {
  customers: CustomerEnrichedRecord[];
  lang: 'en' | 'ur';
  onOpenInspector: (record: Record<string, any>) => void;
  onOpenNewCustomerModal?: () => void;
}

export const CustomerRegisterTab: React.FC<CustomerRegisterTabProps> = ({
  customers,
  lang,
  onOpenInspector,
  onOpenNewCustomerModal,
}) => {
  const isEn = lang === 'en';

  const registerRows = customers.map((c) => {
    const limit = c.creditLimit || 1000000;
    const avail = Math.max(0, limit - c.balance);
    return {
      id: c.id,
      name: c.name,
      code: c.code || `CUS-${c.id.substring(0, 4)}`,
      phone: c.phone || '0300-1234567',
      cnic: c.cnic || '35202-1234567-1',
      ntn: c.ntn || 'NTN-998811',
      businessType: c.businessType || 'Fleet Operator',
      creditLimit: formatCurrency(limit),
      balance: formatCurrency(c.balance),
      availableCredit: formatCurrency(avail),
      salesman: c.salesman || 'Zahid Manager',
      status: c.isOverdue ? 'OVERDUE' : c.balance > 0 ? 'ACTIVE_DEBT' : 'ACTIVE',
    };
  });

  return (
    <div className="space-y-4 font-sans text-slate-800">
      <div className="flex justify-between items-center bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-2xs">
        <div>
          <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
            <Users size={18} className="text-primary" />
            <span>Master Customer Directory & Credit Register</span>
          </h2>
          <p className="text-xs font-bold text-slate-500 mt-0.5">
            Complete database of commercial fleet, regular, and VIP customer accounts
          </p>
        </div>

        <button
          onClick={onOpenNewCustomerModal}
          className="px-4 py-2 bg-primary hover:bg-primary-hover text-white text-xs font-black rounded-xl shadow-2xs flex items-center gap-1.5 cursor-pointer"
        >
          <Plus size={15} />
          <span>+ Create Customer Account</span>
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-2xs">
        <EnterpriseRegisterTable
          columns={[
            { id: 'name', header: 'Customer Name', headerUr: 'کسٹمر نام', accessor: 'name', sortable: true },
            { id: 'code', header: 'Account Code', headerUr: 'کوڈ', accessor: 'code' },
            { id: 'phone', header: 'Phone Number', headerUr: 'فون', accessor: 'phone' },
            { id: 'cnic', header: 'CNIC / NTN', headerUr: 'شناختی کارڈ / NTN', accessor: 'cnic' },
            { id: 'businessType', header: 'Business Type', headerUr: 'قسم', accessor: 'businessType' },
            { id: 'creditLimit', header: 'Credit Limit (₨)', headerUr: 'کریڈٹ لمٹ', accessor: 'creditLimit' },
            { id: 'balance', header: 'Net Balance (₨)', headerUr: 'بقایا رقم', accessor: 'balance' },
            { id: 'availableCredit', header: 'Available Credit', headerUr: 'موجودہ کریڈٹ', accessor: 'availableCredit' },
            { id: 'salesman', header: 'Account Officer', headerUr: 'افسر', accessor: 'salesman' },
            { id: 'status', header: 'Status', headerUr: 'اسٹیٹس', accessor: 'status' },
          ]}
          data={registerRows}
          language={lang}
          onRowClick={(row: Record<string, any>) => onOpenInspector(row)}
        />
      </div>
    </div>
  );
};
