/**
 * @license SPDX-License-Identifier: Apache-2.0
 *
 * FuelPro Enterprise Business Operating System v4.0
 * ShiftManagementTab — Shift Assignments & Duty Roster Workspace
 *
 * Implements Enterprise Rule #170
 */

import React from 'react';
import { EnterpriseRegisterTable } from '../../EnterpriseRegisterTable';
import { Activity, Play, Square } from 'lucide-react';

interface ShiftManagementTabProps {
  shifts: any[];
  lang: 'en' | 'ur';
  onOpenInspector: (record: Record<string, any>) => void;
}

export const ShiftManagementTab: React.FC<ShiftManagementTabProps> = ({
  shifts = [],
  lang,
  onOpenInspector,
}) => {
  const isEn = lang === 'en';

  const rows = [
    { shiftName: 'Day Shift (Morning)', supervisor: 'Zahid Hussain', cashier: 'Zahid Hussain', operators: 'Ali Raza, Usama Khan', openTime: '08:00 AM', closeTime: '04:00 PM', status: 'RUNNING_OPEN' },
    { shiftName: 'Evening Shift', supervisor: 'Farhan Khan', cashier: 'Farhan Khan', operators: 'Rashid Minhas, Tariq Mahmood', openTime: '04:00 PM', closeTime: '12:00 AM', status: 'SCHEDULED' },
    { shiftName: 'Night Shift', supervisor: 'Sajid Ali', cashier: 'Sajid Ali', operators: 'Kamran Akmal, Imran Nazir', openTime: '12:00 AM', closeTime: '08:00 AM', status: 'SCHEDULED' },
  ];

  return (
    <div className="space-y-4 font-sans text-slate-800">
      <div className="flex justify-between items-center bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-2xs">
        <div>
          <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
            <Activity size={18} className="text-indigo-600" />
            <span>{isEn ? 'Shift Roster & Nozzle / Bay Staff Assignments' : 'شفٹ روسٹر اور ملازمین ڈیوٹی کارڈ'}</span>
          </h2>
          <p className="text-xs font-bold text-slate-500 mt-0.5">
            {isEn ? 'Shift scheduling, assigned cashiers, pump operators, opening/closing duty logs' : 'شفٹس، کیشیئرز اور آپریٹرز کی تفصیل'}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-2xs">
        <EnterpriseRegisterTable
          columns={[
            { id: 'shiftName', header: 'Shift Name', headerUr: 'شفٹ نام', accessor: 'shiftName', sortable: true },
            { id: 'supervisor', header: 'Supervisor / Manager', headerUr: 'سپروائزر', accessor: 'supervisor' },
            { id: 'cashier', header: 'Assigned Cashier', headerUr: 'کیشیئر', accessor: 'cashier' },
            { id: 'operators', header: 'Pump Operators', headerUr: 'پمپ آپریٹرز', accessor: 'operators' },
            { id: 'openTime', header: 'Opening Time', headerUr: 'آغاز وقت', accessor: 'openTime' },
            { id: 'closeTime', header: 'Closing Time', headerUr: 'اختتام وقت', accessor: 'closeTime' },
            { id: 'status', header: 'Shift Status', headerUr: 'اسٹیٹس', accessor: 'status' },
          ]}
          data={rows}
          language={lang}
          onRowClick={(row: Record<string, any>) => onOpenInspector(row)}
        />
      </div>
    </div>
  );
};
