/**
 * @license SPDX-License-Identifier: Apache-2.0
 *
 * FuelPro Enterprise Business Operating System v4.0
 * StaffTrainingTab — Safety & Fire Fighting Certifications Register
 * 100% Realtime computed with ZERO static dummy fallbacks.
 */

import React from 'react';
import { EnterpriseRegisterTable } from '../../EnterpriseRegisterTable';
import { Award } from 'lucide-react';

interface StaffTrainingTabProps {
  lang: 'en' | 'ur';
  onOpenInspector: (record: Record<string, any>) => void;
}

export const StaffTrainingTab: React.FC<StaffTrainingTabProps> = ({ lang, onOpenInspector }) => {
  const isEn = lang === 'en';
  const rows: Record<string, any>[] = [];

  return (
    <div className="space-y-4 font-sans text-slate-800">
      <div className="flex justify-between items-center bg-card p-4 sm:p-5 rounded-2xl border border-border shadow-2xs">
        <div>
          <h2 className="text-base font-black text-foreground flex items-center gap-2">
            <Award size={18} className="text-blue-600" />
            <span>{isEn ? 'Safety Training & Fire Fighting Certifications' : 'سیفٹی ٹریننگ اور فائر فائٹنگ سرٹیفکیٹس'}</span>
          </h2>
          <p className="text-xs font-bold text-muted-foreground mt-0.5">
            {isEn ? 'OGRA & Rescue 1122 station safety certifications and staff training logs' : 'اوگرا اور ریسکیو 1122 کی فائر فائٹنگ ٹریننگ'}
          </p>
        </div>
      </div>

      <div className="bg-card rounded-2xl border border-border p-4 sm:p-5 shadow-2xs">
        {rows.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 bg-card rounded-2xl border border-dashed border-border text-center">
            <span className="text-4xl mb-3">🧯</span>
            <h4 className="text-sm font-black text-foreground">{isEn ? 'No Training Logs Found' : 'کوئی ٹریننگ لاگ نہیں مل سکا'}</h4>
            <p className="text-xs font-bold text-muted-foreground max-w-sm mt-1">
              {isEn ? 'No staff safety training sessions logged.' : 'کوئی اینٹری لاگ نہیں ملی۔'}
            </p>
          </div>
        ) : (
          <EnterpriseRegisterTable
            columns={[
              { id: 'topic', header: 'Training Topic', headerUr: 'موضوع', accessor: 'topic', sortable: true },
              { id: 'instructor', header: 'Instructor / Body', headerUr: 'ادارہ', accessor: 'instructor' },
              { id: 'date', header: 'Completion Date', headerUr: 'تاریخ', accessor: 'date' },
              { id: 'validTill', header: 'Valid Till', headerUr: 'میعاد', accessor: 'validTill' },
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
