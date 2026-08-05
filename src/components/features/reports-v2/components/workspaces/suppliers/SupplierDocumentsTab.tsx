/**
 * @license SPDX-License-Identifier: Apache-2.0
 *
 * FuelPro Enterprise Business Operating System v4.0
 * SupplierDocumentsTab — Vendor Document Vault & Compliance Attachments
 *
 * Implements Enterprise Rules #168 & #169
 */

import React from 'react';
import { SupplierEnrichedRecord } from '../../../../../../lib/reports-v2/engines/LedgerEngine';
import { FileText, ShieldCheck, Download, Eye, Paperclip } from 'lucide-react';

interface SupplierDocumentsTabProps {
  suppliers: SupplierEnrichedRecord[];
  lang: 'en' | 'ur';
}

export const SupplierDocumentsTab: React.FC<SupplierDocumentsTabProps> = ({ suppliers, lang }) => {
  const isEn = lang === 'en';

  const documents = [
    { title: 'PSO Dealership & Franchise Supply Agreement 2025', category: 'CONTRACT', vendor: 'PSO Pakistan State Oil', date: 'Jan 05, 2025', size: '2.4 MB', status: 'VERIFIED' },
    { title: 'National Tax Number (NTN) & STRN Registration Certificate', category: 'TAX_CERT', vendor: 'PSO Pakistan State Oil', date: 'Jan 02, 2025', size: '850 KB', status: 'VERIFIED' },
    { title: 'Hydrocarbon Development Institute (HDIP) Fuel Quality Test Report', category: 'LAB_REPORT', vendor: 'Shell Pakistan', date: 'May 10, 2025', size: '1.2 MB', status: 'VERIFIED' },
    { title: 'Bowser Offloading Chamber Chamber Density & Seal Verification Photo', category: 'INSPECTION', vendor: 'Attock Petroleum', date: 'May 12, 2025', size: '3.1 MB', status: 'ATTACHED' },
  ];

  return (
    <div className="space-y-4 font-sans text-slate-800">
      <div className="flex justify-between items-center bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-2xs">
        <div>
          <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
            <Paperclip size={18} className="text-amber-600" />
            <span>Supplier Document Vault & Legal Compliance Attachments</span>
          </h2>
          <p className="text-xs font-bold text-slate-500 mt-0.5">
            Central repository for dealership agreements, NTN/STRN certificates, OGRA licenses, and HDIP lab quality reports
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {documents.map((doc, idx) => (
          <div key={idx} className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-2xs flex justify-between items-center hover:border-amber-300 transition-all">
            <div className="space-y-1">
              <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-900 text-[10px] font-black border border-amber-200 uppercase">
                {doc.category}
              </span>
              <h3 className="text-sm font-black text-slate-900 leading-snug">{doc.title}</h3>
              <div className="flex items-center gap-3 text-xs font-bold text-slate-500">
                <span>{doc.vendor}</span>
                <span>• {doc.date}</span>
                <span>• {doc.size}</span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button className="p-2 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl cursor-pointer">
                <Eye size={16} />
              </button>
              <button className="p-2 bg-[#0F172A] hover:bg-slate-800 text-white rounded-xl cursor-pointer">
                <Download size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
