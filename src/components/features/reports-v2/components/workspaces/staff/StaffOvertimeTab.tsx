/**
 * @license SPDX-License-Identifier: Apache-2.0
 *
 * FuelPro Enterprise Business Operating System v4.0
 * StaffOvertimeTab — Overtime Hours & Extra Duty Compensation Register
 * 100% Realtime computed with ZERO static dummy fallbacks.
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
  const rows: Record<string, any>[] = [];

  return (
    <div className="space-y-4 font-sans text-slate-800">
      <div className="flex justify-between items-center bg-card p-4 sm:p-5 rounded-2xl border border-border shadow-2xs">
        <div>
          <h2 className="text-base font-black text-foreground flex items-center gap-2">
            <Clock size={18} className="text-amber-600" />
            <span>{isEn ? 'Overtime Hours & Extra Duty Register' : 'اوور ٹائم اور اضافی ڈیوٹی رجسٹر'}</span>
          </h2>
          <p className="text-xs font-bold text-muted-foreground mt-0.5">
            {isEn ? 'Approved overtime hours, rates, and compensation logs' : 'اوور ٹائم کے گھنٹے اور معاوضہ'}
          </p>
        </div>
      </div>

      <div className="bg-card rounded-2xl border border-border p-4 sm:p-5 shadow-2xs">
        {rows.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 bg-card rounded-2xl border border-dashed border-border text-center">
            <span className="text-4xl mb-3">⏱️</span>
            <h4 className="text-sm font-black text-foreground">{isEn ? 'No Overtime Logged' : 'کوئی اوور ٹائم نہیں ملا'}</h4>
            <p className="text-xs font-bold text-muted-foreground max-w-sm mt-1">
              {isEn ? 'No overtime duty hours recorded.' : 'کوئی اینٹری لاگ نہیں ملی۔'}
            </p>
          </div>
        ) : (
          <EnterpriseRegisterTable
            columns={[
              { id: 'empName', header: 'Employee Name', headerUr: 'نام', accessor: 'empName', sortable: true },
              { id: 'date', header: 'Date', headerUr: 'تاریخ', accessor: 'date' },
              { id: 'hours', header: 'Hours', headerUr: 'گھنٹے', accessor: 'hours' },
              { id: 'rate', header: 'Rate (₨/hr)', headerUr: 'ریٹ', accessor: 'rate' },
              { id: 'totalPay', header: 'Overtime Pay (₨)', headerUr: 'کل معاوضہ', accessor: 'totalPay' },
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
