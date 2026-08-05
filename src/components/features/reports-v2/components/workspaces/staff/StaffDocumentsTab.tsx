/**
 * @license SPDX-License-Identifier: Apache-2.0
 *
 * FuelPro Enterprise Business Operating System v4.0
 * StaffDocumentsTab — Employee Document Vault (CNIC, Contracts, Licenses)
 *
 * Implements Enterprise Rule #170
 */

import React from 'react';
import { Paperclip, Eye, Download, FileText, ShieldCheck } from 'lucide-react';

interface StaffDocumentsTabProps {
  staffList: any[];
  lang: 'en' | 'ur';
}

export const StaffDocumentsTab: React.FC<StaffDocumentsTabProps> = ({ staffList = [], lang }) => {
  const isEn = lang === 'en';

  const documents = [
    { title: 'National Identity Card (CNIC Front & Back Color Scan)', category: 'CNIC', employee: 'Ali Raza (Pump Operator)', date: 'Jan 15, 2024', size: '1.2 MB', status: 'VERIFIED' },
    { title: 'Formal Employment Contract & Terms Agreement', category: 'CONTRACT', employee: 'Ali Raza (Pump Operator)', date: 'Jan 15, 2024', size: '2.5 MB', status: 'VERIFIED' },
    { title: 'Police Verification & Character Clearance Certificate', category: 'VERIFICATION', employee: 'Zahid Hussain (Shift Manager)', date: 'Feb 10, 2024', size: '980 KB', status: 'VERIFIED' },
    { title: 'HTV Commercial Driving License (Bowser Driver)', category: 'LICENSE', employee: 'Rashid Minhas (Bowser Driver)', date: 'Mar 01, 2024', size: '1.8 MB', status: 'VERIFIED' },
  ];

  return (
    <div className="space-y-4 font-sans text-slate-800">
      <div className="flex justify-between items-center bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-2xs">
        <div>
          <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
            <Paperclip size={18} className="text-teal-600" />
            <span>{isEn ? 'Employee Document Vault & Verification Scans' : 'ملازمین کاغذی اسکین اور دستاویزی والٹ'}</span>
          </h2>
          <p className="text-xs font-bold text-slate-500 mt-0.5">
            {isEn ? 'CNIC scans, employment contracts, police character certificates, and driver licenses' : 'شناختی کارڈ، معاہدے اور لائسنس کے اسکین'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {documents.map((doc, idx) => (
          <div key={idx} className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-2xs flex justify-between items-center hover:border-teal-300 transition-all">
            <div className="space-y-1">
              <span className="px-2 py-0.5 rounded-md bg-teal-50 text-teal-900 text-[10px] font-black border border-teal-200 uppercase">
                {doc.category}
              </span>
              <h3 className="text-sm font-black text-slate-900 leading-snug">{doc.title}</h3>
              <div className="flex items-center gap-3 text-xs font-bold text-slate-500">
                <span>{doc.employee}</span>
                <span>• {doc.date}</span>
                <span>• {doc.size}</span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button className="p-2 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl cursor-pointer">
                <Eye size={16} />
              </button>
              <button className="p-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl cursor-pointer">
                <Download size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
