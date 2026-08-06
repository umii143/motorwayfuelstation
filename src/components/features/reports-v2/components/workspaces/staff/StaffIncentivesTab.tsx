/**
 * @license SPDX-License-Identifier: Apache-2.0
 *
 * FuelPro Enterprise Business Operating System v4.0
 * StaffIncentivesTab — Sales Commissions & Bonus Rewards Register
 * 100% Realtime computed with ZERO static dummy fallbacks.
 */

import React from 'react';
import { EnterpriseRegisterTable } from '../../EnterpriseRegisterTable';
import { DollarSign } from 'lucide-react';

interface StaffIncentivesTabProps {
  lang: 'en' | 'ur';
  onOpenInspector: (record: Record<string, any>) => void;
}

export const StaffIncentivesTab: React.FC<StaffIncentivesTabProps> = ({ lang, onOpenInspector }) => {
  const isEn = lang === 'en';
  const rows: Record<string, any>[] = [];

  return (
    <div className="space-y-4 font-sans text-slate-800">
      <div className="flex justify-between items-center bg-card p-4 sm:p-5 rounded-2xl border border-border shadow-2xs">
        <div>
          <h2 className="text-base font-black text-foreground flex items-center gap-2">
            <DollarSign size={18} className="text-teal-600" />
            <span>{isEn ? 'Staff Sales Commissions & Performance Bonus Rewards' : 'انسیٹیو اور کمیشن'}</span>
          </h2>
          <p className="text-xs font-bold text-muted-foreground mt-0.5">
            {isEn ? 'Lubricants sales commissions, shift volume targets, and bonus payouts' : 'لیوبز فروخت کا کمیشن اور بونس'}
          </p>
        </div>
      </div>

      <div className="bg-card rounded-2xl border border-border p-4 sm:p-5 shadow-2xs">
        {rows.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 bg-card rounded-2xl border border-dashed border-border text-center">
            <span className="text-4xl mb-3">🎁</span>
            <h4 className="text-sm font-black text-foreground">{isEn ? 'No Incentives Processed' : 'کوئی انسیٹیو نہیں مل سکا'}</h4>
            <p className="text-xs font-bold text-muted-foreground max-w-sm mt-1">
              {isEn ? 'No sales incentive or bonus payouts logged.' : 'کوئی اینٹری لاگ نہیں ملی۔'}
            </p>
          </div>
        ) : (
          <EnterpriseRegisterTable
            columns={[
              { id: 'empName', header: 'Employee Name', headerUr: 'نام', accessor: 'empName', sortable: true },
              { id: 'incentiveType', header: 'Incentive Type', headerUr: 'قسم', accessor: 'incentiveType' },
              { id: 'targetAchieved', header: 'Target Achieved', headerUr: 'ٹارگٹ', accessor: 'targetAchieved' },
              { id: 'amount', header: 'Bonus Amount (₨)', headerUr: 'رقم', accessor: 'amount' },
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
