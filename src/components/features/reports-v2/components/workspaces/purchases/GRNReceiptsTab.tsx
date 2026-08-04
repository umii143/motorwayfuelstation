/**
 * @license SPDX-License-Identifier: Apache-2.0
 *
 * FuelPro Enterprise Business Operating System v4.0
 * GRNReceiptsTab — Goods Receipt Notes & Quality/Dip Verification
 */

import React from 'react';
import { EnterpriseRegisterTable } from '../../EnterpriseRegisterTable';
import { ShieldCheck, Plus } from 'lucide-react';

interface GRNReceiptsTabProps {
  lang: 'en' | 'ur';
  onOpenInspector: (record: Record<string, any>) => void;
}

export const GRNReceiptsTab: React.FC<GRNReceiptsTabProps> = ({
  lang,
  onOpenInspector,
}) => {
  const grnRecords = [
    { grnNo: 'GRN-2025-0189', date: 'May 15, 2025', bowserNo: 'BW-2025-0515-001', tank: 'Tank 01 (Super Petrol)', invoiceQty: '16,000.00 L', dipReceivedQty: '15,992.00 L', variance: '-8.00 L', qualityPassed: 'YES', status: 'VERIFIED' },
    { grnNo: 'GRN-2025-0188', date: 'May 14, 2025', bowserNo: 'BW-2025-0514-004', tank: 'Tank 02 (Diesel)', invoiceQty: '18,000.00 L', dipReceivedQty: '18,005.00 L', variance: '+5.00 L', qualityPassed: 'YES', status: 'VERIFIED' },
  ];

  return (
    <div className="space-y-4 font-sans text-slate-800">
      <div className="flex justify-between items-center bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-xs">
        <div>
          <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
            <ShieldCheck size={18} className="text-emerald-600" />
            <span>Goods Receipt Notes (GRN) & Tank Dip Verification</span>
          </h2>
          <p className="text-xs font-bold text-slate-500 mt-0.5">
            Fuel offloading quality checks, dip reading reconciliation, and variance auditing
          </p>
        </div>
        <button className="px-4 py-2 bg-[#0B5C3D] hover:bg-emerald-800 text-white text-xs font-black rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer">
          <Plus size={15} />
          <span>+ Record GRN Offload</span>
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs">
        <EnterpriseRegisterTable
          columns={[
            { id: 'grnNo', header: 'GRN #', headerUr: 'جی آر این #', accessor: 'grnNo', sortable: true },
            { id: 'date', header: 'Offload Date', headerUr: 'تاریخ', accessor: 'date' },
            { id: 'bowserNo', header: 'Bowser #', headerUr: 'باؤزر #', accessor: 'bowserNo' },
            { id: 'tank', header: 'Target Tank', headerUr: 'ٹینک', accessor: 'tank' },
            { id: 'invoiceQty', header: 'Invoice Vol (L)', headerUr: 'انواائس والیم', accessor: 'invoiceQty' },
            { id: 'dipReceivedQty', header: 'Dip Received (L)', headerUr: 'ڈیپ وصولی', accessor: 'dipReceivedQty' },
            { id: 'variance', header: 'Variance', headerUr: 'فرق', accessor: 'variance' },
            { id: 'qualityPassed', header: 'Quality Pass', headerUr: 'کوالٹی ٹیسٹ', accessor: 'qualityPassed' },
            { id: 'status', header: 'Audit Status', headerUr: 'اسٹیٹس', accessor: 'status' },
          ]}
          data={grnRecords}
          language={lang}
          onRowClick={(row: Record<string, any>) => onOpenInspector(row)}
        />
      </div>
    </div>
  );
};
