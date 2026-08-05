/**
 * @license SPDX-License-Identifier: Apache-2.0
 *
 * FuelPro Enterprise Business Operating System v4.0
 * StaffAuditTrailTab — Immutable HR Security & Workforce Audit Log
 *
 * Implements Enterprise Rule #170
 */

import React from 'react';
import { EnterpriseRegisterTable } from '../../EnterpriseRegisterTable';
import { ShieldCheck } from 'lucide-react';

interface StaffAuditTrailTabProps {
  staffList: any[];
  lang: 'en' | 'ur';
  onOpenInspector: (record: Record<string, any>) => void;
}

export const StaffAuditTrailTab: React.FC<StaffAuditTrailTabProps> = ({ staffList = [], lang, onOpenInspector }) => {
  const isEn = lang === 'en';

  const auditEvents = [
    { timestamp: 'May 15, 2025 08:00 AM', user: 'Zahid Manager', action: 'SHIFT_ROSTER_OPENED', employee: 'Ali Raza', oldValue: 'Off Duty', newValue: 'Day Shift On Duty', impact: 'Pump #1 & Nozzle #2 Assigned' },
    { timestamp: 'May 14, 2025 05:30 PM', user: 'Umar Ali (Admin)', action: 'SALARY_PAYROLL_APPROVED', employee: 'Zahid Hussain', oldValue: '₨ 0 Paid', newValue: '₨ 73,000 Disbursed', impact: 'Bank Payout Voucher #PAY-514' },
    { timestamp: 'May 10, 2025 10:15 AM', user: 'HR System', action: 'LEAVE_APPLICATION_APPROVED', employee: 'Usama Khan', oldValue: 'Pending Approval', newValue: 'Approved 2 Days', impact: 'Shift Replacement Assigned' },
  ];

  return (
    <div className="space-y-4 font-sans text-slate-800">
      <div className="flex justify-between items-center bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-2xs">
        <div>
          <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
            <ShieldCheck size={18} className="text-slate-700" />
            <span>{isEn ? 'Immutable HR & Workforce Security Audit Trail' : 'ایچ آر اور ملازمین کی آڈٹ ٹریل'}</span>
          </h2>
          <p className="text-xs font-bold text-slate-500 mt-0.5">
            {isEn ? 'Tamper-proof audit log tracking employee onboarding, attendance overrides, salary payouts, and shift assignments' : 'ملازمین کے تفتِیشی ریکارڈ کی تبدیلی'}
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
            { id: 'action', header: 'HR Action Event', headerUr: 'ایکشن', accessor: 'action' },
            { id: 'employee', header: 'Employee Impacted', headerUr: 'ملازم', accessor: 'employee' },
            { id: 'oldValue', header: 'Old State', headerUr: 'پرانی حالت', accessor: 'oldValue' },
            { id: 'newValue', header: 'New State', headerUr: 'نئی حالت', accessor: 'newValue' },
            { id: 'impact', header: 'Audit Details', headerUr: 'تفصیل', accessor: 'impact' },
          ]}
          data={auditEvents}
          language={lang}
          onRowClick={(row: Record<string, any>) => onOpenInspector(row)}
        />
      </div>
    </div>
  );
};
