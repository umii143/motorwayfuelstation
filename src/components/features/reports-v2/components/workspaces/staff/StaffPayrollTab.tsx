/**
 * @license SPDX-License-Identifier: Apache-2.0
 *
 * FuelPro Enterprise Business Operating System v4.0
 * StaffPayrollTab — Salary Processing & Payroll Disbursal Control Room
 *
 * Implements Enterprise Rule #170
 */

import React from 'react';
import { EnterpriseRegisterTable } from '../../EnterpriseRegisterTable';
import { DollarSign, CreditCard, Printer, CheckCircle } from 'lucide-react';

function formatCurrency(v: number | string): string {
  const n = typeof v === 'number' ? v : Number(v) || 0;
  return `₨ ${n.toLocaleString('en-PK')}`;
}

interface StaffPayrollTabProps {
  staffFinance: any[];
  lang: 'en' | 'ur';
  onOpenInspector: (record: Record<string, any>) => void;
}

export const StaffPayrollTab: React.FC<StaffPayrollTabProps> = ({
  staffFinance = [],
  lang,
  onOpenInspector,
}) => {
  const isEn = lang === 'en';

  const rows = [
    { employee: 'Zahid Hussain', designation: 'Shift Manager', basic: 'Rs 60,000', allowance: 'Rs 10,000', deduction: 'Rs 2,000', bonus: 'Rs 5,000', netSalary: 'Rs 73,000', status: 'PAID' },
    { employee: 'Ali Raza', designation: 'Pump Operator', basic: 'Rs 35,000', allowance: 'Rs 5,000', deduction: 'Rs 1,000', bonus: 'Rs 3,000', netSalary: 'Rs 42,000', status: 'PENDING_DISBURSAL' },
    { employee: 'Usama Khan', designation: 'Pump Operator', basic: 'Rs 35,000', allowance: 'Rs 5,000', deduction: 'Rs 1,500', bonus: 'Rs 2,000', netSalary: 'Rs 40,500', status: 'PENDING_DISBURSAL' },
  ];

  return (
    <div className="space-y-4 font-sans text-slate-800">
      <div className="flex justify-between items-center bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-2xs">
        <div>
          <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
            <DollarSign size={18} className="text-blue-600" />
            <span>{isEn ? 'Monthly Payroll, Salary Slips & Allowances Control Room' : 'ماہانہ پے رول اور تنخواہوں کی ادائیگی'}</span>
          </h2>
          <p className="text-xs font-bold text-slate-500 mt-0.5">
            {isEn ? 'Basic salary, allowances, overtime bonuses, staff advance deductions, and net salary slips' : 'تنخواہیں، الاؤنسز اور ایڈوانس کی کٹوتی'}
          </p>
        </div>

        <button className="px-4 py-2 bg-[#0F172A] hover:bg-slate-800 text-white text-xs font-black rounded-xl shadow-2xs flex items-center gap-1.5 cursor-pointer">
          <CreditCard size={15} />
          <span>{isEn ? 'Disburse Batch Payroll' : 'تنخواہیں ادا کریں'}</span>
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-2xs">
        <EnterpriseRegisterTable
          columns={[
            { id: 'employee', header: 'Employee Name', headerUr: 'ملازم', accessor: 'employee', sortable: true },
            { id: 'designation', header: 'Designation', headerUr: 'عہدہ', accessor: 'designation' },
            { id: 'basic', header: 'Basic Salary', headerUr: 'بنیادی تنخواہ', accessor: 'basic' },
            { id: 'allowance', header: 'Allowances', headerUr: 'الاؤنسز', accessor: 'allowance' },
            { id: 'deduction', header: 'Deductions / Advance', headerUr: 'کٹوتی', accessor: 'deduction' },
            { id: 'bonus', header: 'Bonus / Incentives', headerUr: 'بونس', accessor: 'bonus' },
            { id: 'netSalary', header: 'Net Payable Salary', headerUr: 'خالص تنخواہ', accessor: 'netSalary' },
            { id: 'status', header: 'Payment Status', headerUr: 'اسٹیٹس', accessor: 'status' },
          ]}
          data={rows}
          language={lang}
          onRowClick={(row: Record<string, any>) => onOpenInspector(row)}
        />
      </div>
    </div>
  );
};
