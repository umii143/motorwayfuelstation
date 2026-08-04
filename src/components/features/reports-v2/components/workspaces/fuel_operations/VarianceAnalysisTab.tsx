/**
 * @license SPDX-License-Identifier: Apache-2.0
 *
 * FuelPro Enterprise Business Operating System v4.0
 * VarianceAnalysisTab — Dedicated Operational Variance Audit Sub-Workspace
 *
 * Implements Enterprise Rule #137 & Rule #144
 */

import React from 'react';
import { EnterpriseRegisterTable } from '../../EnterpriseRegisterTable';
import { ShieldCheck, AlertTriangle } from 'lucide-react';

interface VarianceAnalysisTabProps {
  lang: 'en' | 'ur';
  onSelectRecord?: (record: Record<string, any>) => void;
}

export const VarianceAnalysisTab: React.FC<VarianceAnalysisTabProps> = ({
  lang,
  onSelectRecord,
}) => {
  const isEn = lang === 'en';

  const varianceAudits = [
    { id: 'VAR-001', category: 'Cash Collection Variance', expected: 'Rs 320,000', actual: 'Rs 320,000', difference: 'Rs 0', status: 'AUDIT_VERIFIED_OK' },
    { id: 'VAR-002', category: 'Nozzle Totalizer Meter Variance', expected: '4,750.25 L', actual: '4,750.25 L', difference: '0.00 L', status: 'AUDIT_VERIFIED_OK' },
    { id: 'VAR-003', category: 'Test Liters Dispense Audit', expected: '150.00 L', actual: '150.00 L', difference: '0.00 L', status: 'AUDIT_VERIFIED_OK' },
  ];

  return (
    <div className="space-y-4">
      {/* AUDIT SUMMARY KPIS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        <div className="bg-emerald-50/80 border border-emerald-200/90 rounded-2xl p-4 flex flex-col justify-between shadow-xs">
          <span className="text-xs font-black text-emerald-900">Total Shift Cash Variance</span>
          <div className="text-2xl font-black text-[#0B5C3D] tracking-tight">Rs 0</div>
          <span className="text-[10px] font-extrabold text-emerald-700 mt-1">100% Cash Matched</span>
        </div>

        <div className="bg-emerald-50/80 border border-emerald-200/90 rounded-2xl p-4 flex flex-col justify-between shadow-xs">
          <span className="text-xs font-black text-emerald-900">Total Nozzle Meter Variance</span>
          <div className="text-2xl font-black text-[#0B5C3D] tracking-tight">0.00 L</div>
          <span className="text-[10px] font-extrabold text-emerald-700 mt-1">100% Mechanical Meter Matched</span>
        </div>

        <div className="bg-blue-50/80 border border-blue-200/90 rounded-2xl p-4 flex flex-col justify-between shadow-xs">
          <span className="text-xs font-black text-blue-900">Audit Status</span>
          <div className="text-xl font-black text-blue-900 tracking-tight">PASSED</div>
          <span className="text-[10px] font-extrabold text-blue-700 mt-1">Zero Discrepancy Flagged</span>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs space-y-3">
        <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
          <ShieldCheck size={16} className="text-emerald-700" />
          <span>Operational Cash & Nozzle Meter Discrepancy Audit Log</span>
        </h2>

        <EnterpriseRegisterTable
          columns={[
            { id: 'id', header: 'Audit Code', headerUr: 'آڈٹ کوڈ', accessor: 'id', sortable: true },
            { id: 'category', header: 'Variance Category', headerUr: 'قسم', accessor: 'category' },
            { id: 'expected', header: 'Expected System Value', headerUr: 'ایکسپیکٹڈ', accessor: 'expected' },
            { id: 'actual', header: 'Actual Recorded Value', headerUr: 'فزیکل', accessor: 'actual' },
            { id: 'difference', header: 'Discrepancy / Difference', headerUr: 'فرق', accessor: 'difference' },
            { id: 'status', header: 'Audit Verification', headerUr: 'تصدیق', accessor: 'status' },
          ]}
          data={varianceAudits}
          language={lang}
          onRowClick={(row) => onSelectRecord?.(row)}
        />
      </div>
    </div>
  );
};
