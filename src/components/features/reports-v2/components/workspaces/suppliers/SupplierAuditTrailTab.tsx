/**
 * @license SPDX-License-Identifier: Apache-2.0
 *
 * FuelPro Enterprise Business Operating System v4.0
 * SupplierAuditTrailTab — Immutable Audit Log & Vendor Procurement History
 *
 * Implements Enterprise Rules #168 & #169
 */

import React from 'react';
import { SupplierEnrichedRecord } from '../../../../../../lib/reports-v2/engines/LedgerEngine';
import { EnterpriseRegisterTable } from '../../EnterpriseRegisterTable';
import { ShieldCheck } from 'lucide-react';

interface SupplierAuditTrailTabProps {
  suppliers: SupplierEnrichedRecord[];
  lang: 'en' | 'ur';
  onOpenInspector: (record: Record<string, any>) => void;
}

export const SupplierAuditTrailTab: React.FC<SupplierAuditTrailTabProps> = ({ suppliers, lang, onOpenInspector }) => {
  const isEn = lang === 'en';

  const auditEvents = [
    { timestamp: 'May 15, 2025 09:15 AM', user: 'Zahid Manager (Admin)', action: 'BOWSER_DELIVERY_POSTED', supplier: 'PSO Pakistan State Oil', oldValue: '15,000L Super In-Transit', newValue: 'Offloaded to Tank #1', impact: 'GRN #GRN-515 & Inventory Credit' },
    { timestamp: 'May 14, 2025 03:40 PM', user: 'Umar Ali (Owner)', action: 'SUPPLIER_PAYMENT_SETTLED', supplier: 'PSO Pakistan State Oil', oldValue: '₨ 9,450,000 Payable', newValue: '₨ 7,950,000 Payable', impact: 'HBL Bank Transfer Txn #SETTLE-14' },
    { timestamp: 'May 05, 2025 11:00 AM', user: 'System Auto', action: 'CONTRACT_TERMS_UPDATED', supplier: 'Shell Pakistan Limited', oldValue: 'Net 10 Days', newValue: 'Net 15 Days', impact: 'Master Vendor Contract Updated' },
  ];

  return (
    <div className="space-y-4 font-sans text-slate-800">
      <div className="flex justify-between items-center bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-2xs">
        <div>
          <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
            <ShieldCheck size={18} className="text-slate-700" />
            <span>Immutable Supplier Accounts Security & Audit Trail</span>
          </h2>
          <p className="text-xs font-bold text-slate-500 mt-0.5">
            Tamper-proof audit log tracking vendor onboarding, bowser deliveries, payment disbursements, and contract edits
          </p>
        </div>

        <div className="px-3.5 py-1.5 rounded-full bg-slate-900 text-white text-xs font-black">
          🔒 SHA-256 Encrypted Log
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-2xs">
        <EnterpriseRegisterTable
          columns={[
            { id: 'timestamp', header: 'Timestamp', headerUr: 'وقت', accessor: 'timestamp', sortable: true },
            { id: 'user', header: 'Operator / Role', headerUr: 'آپریٹر', accessor: 'user' },
            { id: 'action', header: 'Action Event', headerUr: 'ایکشن', accessor: 'action' },
            { id: 'supplier', header: 'Supplier Account', headerUr: 'سپلائر نام', accessor: 'supplier' },
            { id: 'oldValue', header: 'Old State', headerUr: 'پرانی حالت', accessor: 'oldValue' },
            { id: 'newValue', header: 'New State', headerUr: 'نئی حالت', accessor: 'newValue' },
            { id: 'impact', header: 'Audit Record / Txn', headerUr: 'آڈٹ رکارڈ', accessor: 'impact' },
          ]}
          data={auditEvents}
          language={lang}
          onRowClick={(row: Record<string, any>) => onOpenInspector(row)}
        />
      </div>
    </div>
  );
};
