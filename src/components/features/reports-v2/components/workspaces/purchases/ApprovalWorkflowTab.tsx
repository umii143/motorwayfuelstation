/**
 * @license SPDX-License-Identifier: Apache-2.0
 *
 * FuelPro Enterprise Business Operating System v4.0
 * ApprovalWorkflowTab — Department & Finance 2-Stage Requisition Approvals
 */

import React from 'react';
import { EnterpriseRegisterTable } from '../../EnterpriseRegisterTable';
import { ShieldCheck, CheckCircle2, XCircle, Clock } from 'lucide-react';

interface ApprovalWorkflowTabProps {
  lang: 'en' | 'ur';
  onOpenInspector: (record: Record<string, any>) => void;
}

export const ApprovalWorkflowTab: React.FC<ApprovalWorkflowTabProps> = ({
  lang,
  onOpenInspector,
}) => {
  const approvalItems = [
    { reqNo: 'REQ-2025-0045', date: 'May 15, 2025', product: 'Super Petrol', qty: '18,000 L', estimatedAmt: 'Rs 5,336,100', deptApproval: 'APPROVED (Station Mgr)', financeApproval: 'PENDING (Finance Lead)', priority: 'URGENT', status: 'FINANCE_REVIEW' },
    { reqNo: 'REQ-2025-0044', date: 'May 14, 2025', product: 'High Speed Diesel', qty: '14,000 L', estimatedAmt: 'Rs 4,365,200', deptApproval: 'APPROVED (Station Mgr)', financeApproval: 'APPROVED (CFO)', priority: 'MEDIUM', status: 'APPROVED' },
    { reqNo: 'REQ-2025-0042', date: 'May 10, 2025', product: 'Kerosene Oil', qty: '3,000 L', estimatedAmt: 'Rs 576,000', deptApproval: 'REJECTED (Budget Exceeded)', financeApproval: '—', priority: 'NORMAL', status: 'REJECTED' },
  ];

  return (
    <div className="space-y-4 font-sans text-slate-800">
      <div className="flex justify-between items-center bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-xs">
        <div>
          <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
            <ShieldCheck size={18} className="text-[#0B5C3D]" />
            <span>Purchase Requisition Approval Workflow (2-Stage Approval)</span>
          </h2>
          <p className="text-xs font-bold text-slate-500 mt-0.5">
            Department head sign-off and finance budget authorization before Purchase Order generation
          </p>
        </div>
        <span className="px-3.5 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-black border border-amber-300">
          1 Requisition Pending Finance Sign-off
        </span>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs">
        <EnterpriseRegisterTable
          columns={[
            { id: 'reqNo', header: 'Requisition #', headerUr: 'درخواست #', accessor: 'reqNo', sortable: true },
            { id: 'date', header: 'Date', headerUr: 'تاریخ', accessor: 'date' },
            { id: 'product', header: 'Product', headerUr: 'پروڈکٹ', accessor: 'product' },
            { id: 'qty', header: 'Quantity (L)', headerUr: 'مقدار', accessor: 'qty' },
            { id: 'estimatedAmt', header: 'Est. Amount (₨)', headerUr: 'تخمینہ رقم', accessor: 'estimatedAmt' },
            { id: 'deptApproval', header: 'Department Sign-off', headerUr: 'محکمہ منظوری', accessor: 'deptApproval' },
            { id: 'financeApproval', header: 'Finance Approval', headerUr: 'مالیات منظوری', accessor: 'financeApproval' },
            { id: 'priority', header: 'Priority', headerUr: 'ترجیح', accessor: 'priority' },
            { id: 'status', header: 'Workflow State', headerUr: 'حالت', accessor: 'status' },
          ]}
          data={approvalItems}
          language={lang}
          onRowClick={(row: Record<string, any>) => onOpenInspector(row)}
        />
      </div>
    </div>
  );
};
