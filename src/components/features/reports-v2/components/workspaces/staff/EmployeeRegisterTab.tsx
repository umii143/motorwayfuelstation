/**
 * @license SPDX-License-Identifier: Apache-2.0
 *
 * FuelPro Enterprise Business Operating System v4.0
 * EmployeeRegisterTab — Master Employee Directory & CNIC Registry
 *
 * Implements Enterprise Rule #170
 */

import React from 'react';
import { EnterpriseRegisterTable } from '../../EnterpriseRegisterTable';
import { Users, UserPlus } from 'lucide-react';

function formatCurrency(v: number | string): string {
  const n = typeof v === 'number' ? v : Number(v) || 0;
  return `₨ ${n.toLocaleString('en-PK')}`;
}

interface EmployeeRegisterTabProps {
  staffList: any[];
  lang: 'en' | 'ur';
  onOpenInspector: (record: Record<string, any>) => void;
  onOpenAddModal?: () => void;
}

export const EmployeeRegisterTab: React.FC<EmployeeRegisterTabProps> = ({
  staffList = [],
  lang,
  onOpenInspector,
  onOpenAddModal,
}) => {
  const isEn = lang === 'en';

  const rows = staffList.map((s, i) => ({
    id: s.id || `EMP-${i + 1}`,
    empId: s.code || `EMP-${101 + i}`,
    name: s.name || 'Station Employee',
    cnic: s.cnic || '42101-1234567-1',
    phone: s.phone || '0300-1234567',
    designation: s.role || s.designation || 'Pump Operator',
    branch: 'Main Fuel Station',
    salary: formatCurrency(s.baseSalary || 35000),
    shift: s.shift || 'Day Shift',
    joiningDate: s.joiningDate || '2024-01-15',
    status: s.status === 'inactive' ? 'INACTIVE' : 'ACTIVE_ON_DUTY',
  }));

  return (
    <div className="space-y-4 font-sans text-slate-800">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-2xs">
        <div>
          <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
            <Users size={18} className="text-teal-600" />
            <span>{isEn ? 'Master Employees Register & CNIC Directory' : 'ماسٹر ملازمین رجسٹر اور قومی شناختی کارڈ ڈائریکٹری'}</span>
          </h2>
          <p className="text-xs font-bold text-slate-500 mt-0.5">
            {isEn
              ? 'Complete 10-column database of pump operators, cashiers, shift managers, security, and helpers'
              : 'پمپ آپریٹرز، کیشیئرز اور اسٹاف کا رجسٹر'}
          </p>
        </div>

        <button
          onClick={onOpenAddModal}
          className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-black rounded-xl shadow-2xs flex items-center gap-1.5 cursor-pointer shrink-0"
        >
          <UserPlus size={15} />
          <span>{isEn ? '+ Add New Employee' : '+ نیا ملازم شامل کریں'}</span>
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-2xs">
        <EnterpriseRegisterTable
          columns={[
            { id: 'empId', header: 'Employee ID', headerUr: 'کوڈ', accessor: 'empId', sortable: true },
            { id: 'name', header: 'Full Name', headerUr: 'نام ملازم', accessor: 'name', sortable: true },
            { id: 'cnic', header: 'CNIC Number', headerUr: 'شناختی کارڈ', accessor: 'cnic' },
            { id: 'phone', header: 'Mobile Number', headerUr: 'موبائل نمبر', accessor: 'phone' },
            { id: 'designation', header: 'Designation / Role', headerUr: 'عہدہ', accessor: 'designation' },
            { id: 'branch', header: 'Station Branch', headerUr: 'برانچ', accessor: 'branch' },
            { id: 'salary', header: 'Basic Salary (₨)', headerUr: 'بنیادی تنخواہ', accessor: 'salary' },
            { id: 'shift', header: 'Assigned Shift', headerUr: 'شفٹ', accessor: 'shift' },
            { id: 'joiningDate', header: 'Joining Date', headerUr: 'شمولیت تاریخ', accessor: 'joiningDate' },
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
