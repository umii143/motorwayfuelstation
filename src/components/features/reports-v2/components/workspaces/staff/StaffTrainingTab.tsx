/**
 * @license SPDX-License-Identifier: Apache-2.0
 *
 * FuelPro Enterprise Business Operating System v4.0
 * StaffTrainingTab — Safety Training & Certification Matrix
 *
 * Implements Enterprise Rule #170
 */

import React from 'react';
import { EnterpriseRegisterTable } from '../../EnterpriseRegisterTable';
import { ShieldCheck, Award } from 'lucide-react';

interface StaffTrainingTabProps {
  lang: 'en' | 'ur';
  onOpenInspector: (record: Record<string, any>) => void;
}

export const StaffTrainingTab: React.FC<StaffTrainingTabProps> = ({ lang, onOpenInspector }) => {
  const isEn = lang === 'en';

  const rows = [
    { employee: 'Ali Raza', course: 'OGRA Fuel Offloading & Fire Safety Certification', completionDate: 'Jan 15, 2025', expiryDate: 'Jan 14, 2026', certNo: 'CERT-OGRA-991', status: 'ACTIVE_VALID' },
    { employee: 'Zahid Hussain', course: 'Hazardous Material & Emergency Protocol', completionDate: 'Feb 10, 2025', expiryDate: 'Feb 09, 2026', certNo: 'CERT-[#0B5C3D]-412', status: 'ACTIVE_VALID' },
    { employee: 'Usama Khan', course: 'Station Fire Safety & First Aid', completionDate: 'Jun 01, 2024', expiryDate: 'May 31, 2025', certNo: 'CERT-SAFE-104', status: 'EXPIRING_SOON' },
  ];

  return (
    <div className="space-y-4 font-sans text-slate-800">
      <div className="flex justify-between items-center bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-2xs">
        <div>
          <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
            <ShieldCheck size={18} className="text-teal-600" />
            <span>{isEn ? 'Fire Safety, OGRA Compliance & Health Certifications' : 'فائر سیفٹی اور اوگرا ٹریننگ سرٹیفکیٹس'}</span>
          </h2>
          <p className="text-xs font-bold text-slate-500 mt-0.5">
            {isEn ? 'Mandatory station safety training, fuel offloading certifications, and expiry alerts' : 'تربیت اور سرٹیفکیٹس کی تفصیل'}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-2xs">
        <EnterpriseRegisterTable
          columns={[
            { id: 'employee', header: 'Employee', headerUr: 'ملازم', accessor: 'employee', sortable: true },
            { id: 'course', header: 'Course / Training', headerUr: 'ٹریننگ کورس', accessor: 'course' },
            { id: 'completionDate', header: 'Issued Date', headerUr: 'تاریخ اجرا', accessor: 'completionDate' },
            { id: 'expiryDate', header: 'Expiry Date', headerUr: 'تاریخ تنسیخ', accessor: 'expiryDate' },
            { id: 'certNo', header: 'Certificate #', headerUr: 'سرٹیفکیٹ #', accessor: 'certNo' },
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
