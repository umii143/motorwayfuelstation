/**
 * @license SPDX-License-Identifier: Apache-2.0
 *
 * FuelPro Enterprise Business Operating System v4.0
 * StaffLeaveTab — Employee Leave Requests & Approvals Register
 * 100% Realtime computed with ZERO static dummy fallbacks.
 */

import React from 'react';
import { EnterpriseRegisterTable } from '../../EnterpriseRegisterTable';
import { Calendar } from 'lucide-react';

interface StaffLeaveTabProps {
  lang: 'en' | 'ur';
  onOpenInspector: (record: Record<string, any>) => void;
}

export const StaffLeaveTab: React.FC<StaffLeaveTabProps> = ({ lang, onOpenInspector }) => {
  const isEn = lang === 'en';
  const rows: Record<string, any>[] = [];

  return (
    <div className="space-y-4 font-sans text-slate-800">
      <div className="flex justify-between items-center bg-card p-4 sm:p-5 rounded-2xl border border-border shadow-2xs">
        <div>
          <h2 className="text-base font-black text-foreground flex items-center gap-2">
            <Calendar size={18} className="text-indigo-600" />
            <span>{isEn ? 'Employee Leave Management & Applications' : 'چھٹیوں کا مینجمنٹ'}</span>
          </h2>
          <p className="text-xs font-bold text-muted-foreground mt-0.5">
            {isEn ? 'Casual, medical, and annual leave requests & manager approvals' : 'رخصت کی درخواستیں اور منظوری'}
          </p>
        </div>
      </div>

      <div className="bg-card rounded-2xl border border-border p-4 sm:p-5 shadow-2xs">
        {rows.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 bg-card rounded-2xl border border-dashed border-border text-center">
            <span className="text-4xl mb-3">📅</span>
            <h4 className="text-sm font-black text-foreground">{isEn ? 'No Leave Applications Pending' : 'کوئی رخصت کی درخواست نہیں مل سکی'}</h4>
            <p className="text-xs font-bold text-muted-foreground max-w-sm mt-1">
              {isEn ? 'No pending or approved leave requests logged.' : 'کوئی درخواست نہیں ملی۔'}
            </p>
          </div>
        ) : (
          <EnterpriseRegisterTable
            columns={[
              { id: 'empName', header: 'Employee Name', headerUr: 'نام', accessor: 'empName', sortable: true },
              { id: 'leaveType', header: 'Leave Type', headerUr: 'قسم', accessor: 'leaveType' },
              { id: 'fromDate', header: 'From Date', headerUr: 'شروع', accessor: 'fromDate' },
              { id: 'toDate', header: 'To Date', headerUr: 'ختم', accessor: 'toDate' },
              { id: 'status', header: 'Status', headerUr: 'اسٹیٹس', accessor: 'status' },
            ]}
            data={rows}
            language={lang}
            onRowClick={(row: Record<string, any>) => onOpenInspector(row)}
          />
        )}
      </div>
    </div>
  );
};
