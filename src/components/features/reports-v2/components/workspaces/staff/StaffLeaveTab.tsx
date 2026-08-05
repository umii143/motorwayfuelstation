/**
 * @license SPDX-License-Identifier: Apache-2.0
 *
 * FuelPro Enterprise Business Operating System v4.0
 * StaffLeaveTab — Employee Leave Management & Approval Workflows
 *
 * Implements Enterprise Rule #170
 */

import React from 'react';
import { EnterpriseRegisterTable } from '../../EnterpriseRegisterTable';
import { Calendar, CheckCircle2, XCircle } from 'lucide-react';

interface StaffLeaveTabProps {
  lang: 'en' | 'ur';
  onOpenInspector: (record: Record<string, any>) => void;
}

export const StaffLeaveTab: React.FC<StaffLeaveTabProps> = ({ lang, onOpenInspector }) => {
  const isEn = lang === 'en';

  const rows = [
    { employee: 'Bilal Ahmed', leaveType: 'Annual Vacation', startDate: 'May 18, 2025', endDate: 'May 24, 2025', totalDays: '7 Days', reason: 'Family Visit', status: 'PENDING_APPROVAL' },
    { employee: 'Usama Khan', leaveType: 'Sick Leave', startDate: 'May 02, 2025', endDate: 'May 03, 2025', totalDays: '2 Days', reason: 'Fever & Medical Rest', status: 'APPROVED' },
  ];

  return (
    <div className="space-y-4 font-sans text-slate-800">
      <div className="flex justify-between items-center bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-2xs">
        <div>
          <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
            <Calendar size={18} className="text-teal-600" />
            <span>{isEn ? 'Leave Management & Approval Workflows' : 'رخصت کی درخواستیں اور منظوری'}</span>
          </h2>
          <p className="text-xs font-bold text-slate-500 mt-0.5">
            {isEn ? 'Annual, sick, and emergency leave applications and shift replacement tracking' : 'ماہانہ اور سالانہ چھٹیوں کا ریکارڈ'}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-2xs">
        <EnterpriseRegisterTable
          columns={[
            { id: 'employee', header: 'Employee', headerUr: 'ملازم', accessor: 'employee', sortable: true },
            { id: 'leaveType', header: 'Leave Category', headerUr: 'چھٹی کی قسم', accessor: 'leaveType' },
            { id: 'startDate', header: 'Start Date', headerUr: 'شروع تاریخ', accessor: 'startDate' },
            { id: 'endDate', header: 'End Date', headerUr: 'اختتام تاریخ', accessor: 'endDate' },
            { id: 'totalDays', header: 'Total Days', headerUr: 'ایام', accessor: 'totalDays' },
            { id: 'reason', header: 'Reason / Notes', headerUr: 'وجہ', accessor: 'reason' },
            { id: 'status', header: 'Approval Status', headerUr: 'منظوری اسٹیٹس', accessor: 'status' },
          ]}
          data={rows}
          language={lang}
          onRowClick={(row: Record<string, any>) => onOpenInspector(row)}
        />
      </div>
    </div>
  );
};
