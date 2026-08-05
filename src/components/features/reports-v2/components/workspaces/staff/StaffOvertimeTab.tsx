/**
 * @license SPDX-License-Identifier: Apache-2.0
 *
 * FuelPro Enterprise Business Operating System v4.0
 * StaffOvertimeTab — Overtime Hours & Compensation Tracker
 *
 * Implements Enterprise Rule #170
 */

import React from 'react';
import { EnterpriseRegisterTable } from '../../EnterpriseRegisterTable';
import { Clock } from 'lucide-react';

interface StaffOvertimeTabProps {
  lang: 'en' | 'ur';
  onOpenInspector: (record: Record<string, any>) => void;
}

export const StaffOvertimeTab: React.FC<StaffOvertimeTabProps> = ({ lang, onOpenInspector }) => {
  const isEn = lang === 'en';

  const rows = [
    { employee: 'Ali Raza', month: 'May 2025', overtimeHours: '12.5 Hrs', hourlyRate: 'Rs 250 / Hr', totalPay: 'Rs 3,125', supervisor: 'Zahid Hussain', status: 'VERIFIED' },
    { employee: 'Rashid Minhas', month: 'May 2025', overtimeHours: '18.0 Hrs', hourlyRate: 'Rs 250 / Hr', totalPay: 'Rs 4,500', supervisor: 'Farhan Khan', status: 'VERIFIED' },
  ];

  return (
    <div className="space-y-4 font-sans text-slate-800">
      <div className="flex justify-between items-center bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-2xs">
        <div>
          <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
            <Clock size={18} className="text-indigo-600" />
            <span>{isEn ? 'Staff Overtime Tracking & Extra Hours Compensation' : 'اور ٹائم گھنٹے اور معاوضہ'}</span>
          </h2>
          <p className="text-xs font-bold text-slate-500 mt-0.5">
            {isEn ? 'Approved overtime logs, hourly rates, and payroll integration' : 'ماہانہ اضافی ڈیوٹی اور ادائیگی کا حساب'}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-2xs">
        <EnterpriseRegisterTable
          columns={[
            { id: 'employee', header: 'Employee Name', headerUr: 'ملازم نام', accessor: 'employee', sortable: true },
            { id: 'month', header: 'Month', headerUr: 'مہینہ', accessor: 'month' },
            { id: 'overtimeHours', header: 'Overtime Hours', headerUr: 'اور ٹائم گھنٹے', accessor: 'overtimeHours' },
            { id: 'hourlyRate', header: 'Hourly Rate (₨)', headerUr: 'فی گھنٹہ ریٹ', accessor: 'hourlyRate' },
            { id: 'totalPay', header: 'Total Overtime Pay', headerUr: 'کل اور ٹائم رقم', accessor: 'totalPay' },
            { id: 'supervisor', header: 'Approving Manager', headerUr: 'منظور کنندہ', accessor: 'supervisor' },
            { id: 'status', header: 'Status', headerUr: 'اسٹیٹس', accessor: 'status' },
          ]}
          data={rows}
          language={lang}
          onRowClick={(row: Record<string, any>) => onOpenInspector(row)}
        />
      </div>
    </div>
  );
};
