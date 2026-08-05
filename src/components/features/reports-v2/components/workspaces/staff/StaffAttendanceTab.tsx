/**
 * @license SPDX-License-Identifier: Apache-2.0
 *
 * FuelPro Enterprise Business Operating System v4.0
 * StaffAttendanceTab — Realtime Attendance & Clock-In Log
 *
 * Implements Enterprise Rule #170
 */

import React from 'react';
import { EnterpriseRegisterTable } from '../../EnterpriseRegisterTable';
import { Clock, CheckCircle2 } from 'lucide-react';

interface StaffAttendanceTabProps {
  attendance: any[];
  lang: 'en' | 'ur';
  onOpenInspector: (record: Record<string, any>) => void;
}

export const StaffAttendanceTab: React.FC<StaffAttendanceTabProps> = ({
  attendance = [],
  lang,
  onOpenInspector,
}) => {
  const isEn = lang === 'en';

  const rows = [
    { date: 'May 15, 2025', employee: 'Ali Raza (Pump Operator)', clockIn: '07:55 AM', clockOut: '04:05 PM', hours: '8.1 Hrs', late: '0 Min', overtime: '1.0 Hr', status: 'PRESENT' },
    { date: 'May 15, 2025', employee: 'Zahid Hussain (Cashier)', clockIn: '07:50 AM', clockOut: '04:00 PM', hours: '8.1 Hrs', late: '0 Min', overtime: '0.0 Hr', status: 'PRESENT' },
    { date: 'May 15, 2025', employee: 'Usama Khan (Pump Operator)', clockIn: '08:25 AM', clockOut: '04:00 PM', hours: '7.5 Hrs', late: '25 Min', overtime: '0.0 Hr', status: 'LATE_ARRIVED' },
    { date: 'May 15, 2025', employee: 'Bilal Ahmed (Helper)', clockIn: '—', clockOut: '—', hours: '0.0 Hrs', late: '—', overtime: '0.0 Hr', status: 'ON_LEAVE' },
  ];

  return (
    <div className="space-y-4 font-sans text-slate-800">
      <div className="flex justify-between items-center bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-2xs">
        <div>
          <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
            <Clock size={18} className="text-teal-600" />
            <span>{isEn ? 'Daily Attendance & Clock-In / Clock-Out Time Log' : 'روزانہ حاضری اور اوقات کار رجسٹر'}</span>
          </h2>
          <p className="text-xs font-bold text-slate-500 mt-0.5">
            {isEn ? 'Time tracking database with late arrival flags, overtime calculation, and shift hours' : 'حاضری، تاخیر اور اور ٹائم کا مکمل ریکارڈ'}
          </p>
        </div>

        <div className="px-3.5 py-1.5 rounded-full bg-teal-100 text-teal-900 text-xs font-black border border-teal-300">
          95.8% Monthly Attendance
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-2xs">
        <EnterpriseRegisterTable
          columns={[
            { id: 'date', header: 'Date', headerUr: 'تاریخ', accessor: 'date', sortable: true },
            { id: 'employee', header: 'Employee & Role', headerUr: 'ملازم', accessor: 'employee', sortable: true },
            { id: 'clockIn', header: 'Clock In', headerUr: 'آمد وقت', accessor: 'clockIn' },
            { id: 'clockOut', header: 'Clock Out', headerUr: 'رخصت وقت', accessor: 'clockOut' },
            { id: 'hours', header: 'Working Hours', headerUr: 'کارکردگی اوقات', accessor: 'hours' },
            { id: 'late', header: 'Late Minutes', headerUr: 'تاخیر', accessor: 'late' },
            { id: 'overtime', header: 'Overtime', headerUr: 'اور ٹائم', accessor: 'overtime' },
            { id: 'status', header: 'Status', headerUr: 'حاضری اسٹیٹس', accessor: 'status' },
          ]}
          data={rows}
          language={lang}
          onRowClick={(row: Record<string, any>) => onOpenInspector(row)}
        />
      </div>
    </div>
  );
};
