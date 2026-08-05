/**
 * @license SPDX-License-Identifier: Apache-2.0
 *
 * FuelPro Enterprise Business Operating System v4.0
 * StaffIncentivesTab — Sales Commissions & Incentive Scorecard
 *
 * Implements Enterprise Rule #170
 */

import React from 'react';
import { EnterpriseRegisterTable } from '../../EnterpriseRegisterTable';
import { Award, TrendingUp } from 'lucide-react';

interface StaffIncentivesTabProps {
  lang: 'en' | 'ur';
  onOpenInspector: (record: Record<string, any>) => void;
}

export const StaffIncentivesTab: React.FC<StaffIncentivesTabProps> = ({ lang, onOpenInspector }) => {
  const isEn = lang === 'en';

  const rows = [
    { employee: 'Ali Raza', target: '100,000 Liters', achievement: '112,000 Liters (112%)', commission: 'Rs 5,600', bonus: 'Rs 2,500', totalPayout: 'Rs 8,100', status: 'QUALIFIED' },
    { employee: 'Usama Khan', target: '100,000 Liters', achievement: '105,000 Liters (105%)', commission: 'Rs 2,500', bonus: 'Rs 1,000', totalPayout: 'Rs 3,500', status: 'QUALIFIED' },
  ];

  return (
    <div className="space-y-4 font-sans text-slate-800">
      <div className="flex justify-between items-center bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-2xs">
        <div>
          <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
            <Award size={18} className="text-amber-500" />
            <span>{isEn ? 'Sales Targets, Volume Commissions & Performance Bonuses' : 'سیلز کمیشن، انعام اور بونس'}</span>
          </h2>
          <p className="text-xs font-bold text-slate-500 mt-0.5">
            {isEn ? 'Monthly volume target achievement, per-liter commissions, and zero-shortage bonuses' : 'ماہانہ ٹارگٹ اور کمیشن کی تفصیل'}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-2xs">
        <EnterpriseRegisterTable
          columns={[
            { id: 'employee', header: 'Employee', headerUr: 'ملازم', accessor: 'employee', sortable: true },
            { id: 'target', header: 'Monthly Target', headerUr: 'ٹارگٹ', accessor: 'target' },
            { id: 'achievement', header: 'Volume Achieved', headerUr: 'حاصل کردہ فیصد', accessor: 'achievement' },
            { id: 'commission', header: 'Commission (₨)', headerUr: 'کمیشن', accessor: 'commission' },
            { id: 'bonus', header: 'Performance Bonus', headerUr: 'بونس', accessor: 'bonus' },
            { id: 'totalPayout', header: 'Total Incentive Payout', headerUr: 'کل انعامی رقم', accessor: 'totalPayout' },
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
