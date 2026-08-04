/**
 * @license SPDX-License-Identifier: Apache-2.0
 *
 * FuelPro Enterprise Business Operating System v4.0
 * InvoiceVerificationTab — 3-Way Matching: PO vs GRN vs Invoice
 */

import React from 'react';
import { EnterpriseRegisterTable } from '../../EnterpriseRegisterTable';
import { ShieldCheck, AlertTriangle } from 'lucide-react';

interface InvoiceVerificationTabProps {
  lang: 'en' | 'ur';
  onOpenInspector: (record: Record<string, any>) => void;
}

export const InvoiceVerificationTab: React.FC<InvoiceVerificationTabProps> = ({
  lang,
  onOpenInspector,
}) => {
  const matchingRecords = [
    { invNo: 'INV-2025-0515-001', poNo: 'PO-2025-0112', grnNo: 'GRN-2025-0189', supplier: 'PSO', poQty: '16,000 L', grnQty: '15,992 L', invQty: '16,000 L', poRate: 'Rs 296.45', invRate: 'Rs 296.45', matchStatus: 'MATCHED_PASS', variance: '8 L (Tolerated)' },
    { invNo: 'INV-2025-0515-002', poNo: 'PO-2025-0111', grnNo: 'GRN-2025-0188', supplier: 'Shell', poQty: '12,000 L', grnQty: '12,000 L', invQty: '12,000 L', poRate: 'Rs 311.80', invRate: 'Rs 315.00', matchStatus: 'RATE_MISMATCH', variance: '+Rs 3.20/L Overcharge' },
  ];

  return (
    <div className="space-y-4 font-sans text-slate-800">
      <div className="flex justify-between items-center bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-xs">
        <div>
          <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
            <ShieldCheck size={18} className="text-rose-600" />
            <span>3-Way Invoice Matching Audit Center (PO ↔ GRN ↔ Invoice)</span>
          </h2>
          <p className="text-xs font-bold text-slate-500 mt-0.5">
            Automated verification of purchase order rates, offload GRN volumes, and supplier billing invoices
          </p>
        </div>
        <span className="px-3.5 py-1 rounded-full bg-rose-100 text-rose-800 text-xs font-black border border-rose-300 flex items-center gap-1.5">
          <AlertTriangle size={14} />
          <span>1 Invoice Rate Overcharge Mismatch Flagged</span>
        </span>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs">
        <EnterpriseRegisterTable
          columns={[
            { id: 'invNo', header: 'Invoice #', headerUr: 'انواائس #', accessor: 'invNo', sortable: true },
            { id: 'poNo', header: 'PO Ref #', headerUr: 'پی او #', accessor: 'poNo' },
            { id: 'grnNo', header: 'GRN Ref #', headerUr: 'جی آر این #', accessor: 'grnNo' },
            { id: 'supplier', header: 'Supplier', headerUr: 'سپلائر', accessor: 'supplier' },
            { id: 'poQty', header: 'PO Qty', headerUr: 'پی او مقدار', accessor: 'poQty' },
            { id: 'grnQty', header: 'GRN Received', headerUr: 'وصولی مقدار', accessor: 'grnQty' },
            { id: 'invQty', header: 'Billed Qty', headerUr: 'بل مقدار', accessor: 'invQty' },
            { id: 'invRate', header: 'Billed Rate', headerUr: 'بل ریٹ', accessor: 'invRate' },
            { id: 'matchStatus', header: '3-Way Match Result', headerUr: 'پڑتال نتیجہ', accessor: 'matchStatus' },
            { id: 'variance', header: 'Variance Audit', headerUr: 'فرق آڈٹ', accessor: 'variance' },
          ]}
          data={matchingRecords}
          language={lang}
          onRowClick={(row: Record<string, any>) => onOpenInspector(row)}
        />
      </div>
    </div>
  );
};
