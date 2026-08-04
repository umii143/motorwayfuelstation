/**
 * @license SPDX-License-Identifier: Apache-2.0
 *
 * FuelPro Enterprise Business Operating System v4.0
 * ShiftPerformanceTab — Dedicated Shift Performance & Operator Ledger Sub-Workspace
 *
 * Implements Enterprise Rule #137 & Rule #144
 */

import React from 'react';
import { EnterpriseRegisterTable } from '../../EnterpriseRegisterTable';
import { Users, Clock, Award } from 'lucide-react';

interface ShiftPerformanceTabProps {
  lang: 'en' | 'ur';
  onSelectRecord?: (record: Record<string, any>) => void;
}

export const ShiftPerformanceTab: React.FC<ShiftPerformanceTabProps> = ({
  lang,
  onSelectRecord,
}) => {
  const isEn = lang === 'en';

  const operators = [
    { name: 'Ali Raza', role: 'Head Cashier', shift: 'Morning Shift #1', txns: 156, liters: '2,125.40 L', totalSale: 'Rs 606,100', avgSale: 'Rs 3,654', status: 'ACTIVE_ON_DUTY' },
    { name: 'Umer Farooq', role: 'Nozzle Attendant', shift: 'Morning Shift #1', txns: 112, liters: '1,450.80 L', totalSale: 'Rs 359,520', avgSale: 'Rs 3,210', status: 'ACTIVE_ON_DUTY' },
    { name: 'Bilal Ahmed', role: 'Nozzle Attendant', shift: 'Morning Shift #1', txns: 68, liters: '890.10 L', totalSale: 'Rs 196,520', avgSale: 'Rs 2,890', status: 'ACTIVE_ON_DUTY' },
    { name: 'Zeeshan Khan', role: 'Junior Attendant', shift: 'Morning Shift #1', txns: 20, liters: '284.95 L', totalSale: 'Rs 42,500', avgSale: 'Rs 2,125', status: 'ACTIVE_ON_DUTY' },
  ];

  return (
    <div className="space-y-4">
      {/* SHIFT KPIS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-amber-50/80 border border-amber-200/90 rounded-2xl p-4 flex flex-col justify-between shadow-xs">
          <span className="text-xs font-black text-amber-900">Active Shift Session</span>
          <div className="text-2xl font-black text-amber-900 tracking-tight">Morning Shift #1</div>
          <span className="text-[10px] font-extrabold text-amber-700 mt-1">09:00 AM – 05:00 PM</span>
        </div>

        <div className="bg-purple-50/80 border border-purple-200/90 rounded-2xl p-4 flex flex-col justify-between shadow-xs">
          <span className="text-xs font-black text-purple-900">Active Staff On Duty</span>
          <div className="text-2xl font-black text-purple-900 tracking-tight">4 Operators</div>
          <span className="text-[10px] font-extrabold text-purple-700 mt-1">1 Cashier | 3 Attendants</span>
        </div>

        <div className="bg-blue-50/80 border border-blue-200/90 rounded-2xl p-4 flex flex-col justify-between shadow-xs">
          <span className="text-xs font-black text-blue-900">Total Shift Transactions</span>
          <div className="text-2xl font-black text-blue-900 tracking-tight">356 Txns</div>
          <span className="text-[10px] font-extrabold text-blue-700 mt-1">56.2 Txns / Hour</span>
        </div>

        <div className="bg-emerald-50/80 border border-emerald-200/90 rounded-2xl p-4 flex flex-col justify-between shadow-xs">
          <span className="text-xs font-black text-emerald-900">Top Performing Operator</span>
          <div className="text-xl font-black text-[#0B5C3D] tracking-tight">Ali Raza</div>
          <span className="text-[10px] font-extrabold text-emerald-700 mt-1">2,125.40 L Dispensed</span>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs space-y-3">
        <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
          <Users size={16} className="text-amber-600" />
          <span>Shift Operators Performance & Dispense Ranking Ledger</span>
        </h2>

        <EnterpriseRegisterTable
          columns={[
            { id: 'name', header: 'Operator Name', headerUr: 'آپریٹر', accessor: 'name', sortable: true },
            { id: 'role', header: 'Shift Role', headerUr: 'عہدہ', accessor: 'role' },
            { id: 'shift', header: 'Shift Session', headerUr: 'شفٹ سیشن', accessor: 'shift' },
            { id: 'txns', header: 'Transactions', headerUr: 'ٹرانزیکشنز', accessor: 'txns', isNumeric: true },
            { id: 'liters', header: 'Liters Dispensed', headerUr: 'لیٹرز', accessor: 'liters' },
            { id: 'totalSale', header: 'Total Sales (₨)', headerUr: 'کل سیلز', accessor: 'totalSale' },
            { id: 'avgSale', header: 'Avg Sale / Txn', headerUr: 'اوسط سیل', accessor: 'avgSale' },
          ]}
          data={operators}
          language={lang}
          onRowClick={(row) => onSelectRecord?.(row)}
        />
      </div>
    </div>
  );
};
