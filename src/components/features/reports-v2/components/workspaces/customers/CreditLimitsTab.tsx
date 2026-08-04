/**
 * @license SPDX-License-Identifier: Apache-2.0
 *
 * FuelPro Enterprise Business Operating System v4.0
 * CreditLimitsTab — Credit Risk Control & Limit Sanctioning
 *
 * Implements Enterprise Rules #166 & #167
 */

import React from 'react';
import { CustomerEnrichedRecord } from '../../../../../../lib/reports-v2/engines/LedgerEngine';
import { EnterpriseRegisterTable } from '../../EnterpriseRegisterTable';
import { ShieldCheck, Lock, Unlock, AlertTriangle } from 'lucide-react';

function formatCurrency(v: number | string): string {
  const n = typeof v === 'number' ? v : Number(v) || 0;
  return `₨ ${n.toLocaleString('en-PK')}`;
}

interface CreditLimitsTabProps {
  customers: CustomerEnrichedRecord[];
  lang: 'en' | 'ur';
  onOpenInspector: (record: Record<string, any>) => void;
}

export const CreditLimitsTab: React.FC<CreditLimitsTabProps> = ({
  customers,
  lang,
  onOpenInspector,
}) => {
  const isEn = lang === 'en';

  const rows = customers.map((c) => {
    const limit = c.creditLimit || 1000000;
    const used = c.balance;
    const avail = Math.max(0, limit - used);
    const utilPct = limit > 0 ? Math.round((used / limit) * 100) : 0;

    return {
      name: c.name,
      code: c.code || `CUS-${c.id.substring(0, 4)}`,
      limit: formatCurrency(limit),
      used: formatCurrency(used),
      avail: formatCurrency(avail),
      utilization: `${utilPct}%`,
      riskScore: utilPct > 80 ? 'HIGH_UTILIZATION' : c.isOverdue ? 'OVERDUE_FREEZE' : 'LOW_RISK',
      status: c.isOverdue ? 'CREDIT_HOLD' : utilPct > 90 ? 'LIMIT_WARNING' : 'APPROVED',
    };
  });

  return (
    <div className="space-y-4 font-sans text-slate-800">
      <div className="flex justify-between items-center bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-2xs">
        <div>
          <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
            <ShieldCheck size={18} className="text-blue-600" />
            <span>Customer Credit Limits & Risk Control Management</span>
          </h2>
          <p className="text-xs font-bold text-slate-500 mt-0.5">
            Sanctioned credit limits, live credit utilization tracking, risk scoring, and automatic credit hold controls
          </p>
        </div>

        <div className="px-3.5 py-1.5 rounded-full bg-blue-50 text-blue-900 text-xs font-black border border-blue-200">
          Risk Rule: Auto-Freeze at 100% Limit
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-2xs">
        <EnterpriseRegisterTable
          columns={[
            { id: 'name', header: 'Customer Name', headerUr: 'کسٹمر نام', accessor: 'name', sortable: true },
            { id: 'code', header: 'Account Code', headerUr: 'کوڈ', accessor: 'code' },
            { id: 'limit', header: 'Sanctioned Limit (₨)', headerUr: 'منظور شدہ لمٹ', accessor: 'limit' },
            { id: 'used', header: 'Used Credit (₨)', headerUr: 'استعمال شدہ لمٹ', accessor: 'used' },
            { id: 'avail', header: 'Available Credit (₨)', headerUr: 'موجودہ کریڈٹ', accessor: 'avail' },
            { id: 'utilization', header: 'Utilization %', headerUr: 'استعمال %', accessor: 'utilization' },
            { id: 'riskScore', header: 'Risk Score', headerUr: 'رسک اسکور', accessor: 'riskScore' },
            { id: 'status', header: 'Credit Status', headerUr: 'اسٹیٹس', accessor: 'status' },
          ]}
          data={rows}
          language={lang}
          onRowClick={(row: Record<string, any>) => onOpenInspector(row)}
        />
      </div>
    </div>
  );
};
