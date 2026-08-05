/**
 * @license SPDX-License-Identifier: Apache-2.0
 *
 * FuelPro Enterprise Business Operating System v4.0
 * StaffPerformanceTab — Individual Employee Sales & Productivity Matrix
 *
 * Implements Enterprise Rule #170
 */

import React from 'react';
import { EnterpriseRegisterTable } from '../../EnterpriseRegisterTable';
import { Award, TrendingUp } from 'lucide-react';

function formatCurrency(v: number | string): string {
  const n = typeof v === 'number' ? v : Number(v) || 0;
  return `₨ ${n.toLocaleString('en-PK')}`;
}

interface StaffPerformanceTabProps {
  staffList: any[];
  lang: 'en' | 'ur';
  onOpenInspector: (record: Record<string, any>) => void;
}

export const StaffPerformanceTab: React.FC<StaffPerformanceTabProps> = ({
  staffList = [],
  lang,
  onOpenInspector,
}) => {
  const isEn = lang === 'en';

  const rows = [
    { employee: 'Ali Raza', designation: 'Pump Operator', salesAmount: 'Rs 420,000', transactions: '142 Txns', avgTicket: 'Rs 2,957', fuelLiters: '1,500 L', rating: '⭐ 4.9', score: '98 / 100', status: 'TOP_PERFORMER' },
    { employee: 'Usama Khan', designation: 'Pump Operator', salesAmount: 'Rs 380,000', transactions: '128 Txns', avgTicket: 'Rs 2,968', fuelLiters: '1,350 L', rating: '⭐ 4.8', score: '95 / 100', status: 'EXCELLENT' },
    { employee: 'Zahid Hussain', designation: 'Shift Manager', salesAmount: 'Rs 1,250,000', transactions: '410 Txns', avgTicket: 'Rs 3,048', fuelLiters: '4,500 L', rating: '⭐ 5.0', score: '99 / 100', status: 'TOP_MANAGER' },
  ];

  return (
    <div className="space-y-4 font-sans text-slate-800">
      <div className="flex justify-between items-center bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-2xs">
        <div>
          <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
            <Award size={18} className="text-amber-500" />
            <span>{isEn ? 'Individual Employee Sales & Productivity Performance Matrix' : 'انفرادی ملازمین کی فروخت اور کارکردگی میٹرکس'}</span>
          </h2>
          <p className="text-xs font-bold text-slate-500 mt-0.5">
            {isEn ? 'Sales per employee, transaction volume, average ticket size, fuel liters dispensed, and customer satisfaction rating' : 'ملازمین کی فروخت اور رینکنگ'}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-2xs">
        <EnterpriseRegisterTable
          columns={[
            { id: 'employee', header: 'Employee Name', headerUr: 'ملازم نام', accessor: 'employee', sortable: true },
            { id: 'designation', header: 'Designation', headerUr: 'عہدہ', accessor: 'designation' },
            { id: 'salesAmount', header: 'Sales Amount (₨)', headerUr: 'فروخت رقم', accessor: 'salesAmount' },
            { id: 'transactions', header: 'Transactions', headerUr: 'ٹرانزیکشنز', accessor: 'transactions' },
            { id: 'avgTicket', header: 'Avg Ticket Size', headerUr: 'اوسط انوائس', accessor: 'avgTicket' },
            { id: 'fuelLiters', header: 'Fuel Dispensed', headerUr: 'فیول والیم', accessor: 'fuelLiters' },
            { id: 'rating', header: 'Customer Rating', headerUr: 'ریٹنگ', accessor: 'rating' },
            { id: 'score', header: 'Performance Score', headerUr: 'اسکور', accessor: 'score' },
            { id: 'status', header: 'Ranking', headerUr: 'رینکنگ', accessor: 'status' },
          ]}
          data={rows}
          language={lang}
          onRowClick={(row: Record<string, any>) => onOpenInspector(row)}
        />
      </div>
    </div>
  );
};
