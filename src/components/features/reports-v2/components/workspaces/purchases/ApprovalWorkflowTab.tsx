/**
 * @license SPDX-License-Identifier: Apache-2.0
 *
 * FuelPro Enterprise Business Operating System v4.0
 * ApprovalWorkflowTab — Purchase Approval Workflow Register
 *
 * 100% Google Firebase Realtime Database Driven — Zero Dummy Records.
 */

import React from 'react';
import { EnterpriseRegisterTable } from '../../EnterpriseRegisterTable';
import { WorkspaceEmptyState } from '../../common/WorkspaceEmptyState';
import { WorkspaceLoadingSkeleton } from '../../common/WorkspaceLoadingSkeleton';
import { useWorkspaceFirebaseData } from '../../../hooks/useWorkspaceFirebaseData';

interface ApprovalWorkflowTabProps { lang: 'en' | 'ur'; orgId?: string; stationId?: string; onOpenInspector: (r: Record<string, any>) => void; }

export const ApprovalWorkflowTab: React.FC<ApprovalWorkflowTabProps> = ({ lang, orgId, stationId, onOpenInspector }) => {
  const { data, loading, isEmpty, refetch } = useWorkspaceFirebaseData('FUEL_PURCHASES', { orgId, stationId });

  if (loading) return <WorkspaceLoadingSkeleton kpiCount={0} rowCount={4} />;

  const approvalItems = data.filter(d => d.approvalStatus || d.deptApproval || d.financeApproval || d.type === 'REQUISITION');

  if (approvalItems.length === 0 && isEmpty) return <WorkspaceEmptyState title="No Approval Records" description="Approval workflow records will populate once purchase requisitions requiring approval are submitted." onRefresh={refetch} />;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs space-y-3">
      <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider">Purchase Approval Workflow</h2>
      <EnterpriseRegisterTable
        columns={[
          { id: 'reqNo', header: 'REQ #', headerUr: 'ریکوئزیشن #', accessor: 'reqNo', sortable: true },
          { id: 'date', header: 'Date', headerUr: 'تاریخ', accessor: 'date', sortable: true },
          { id: 'product', header: 'Product', headerUr: 'پروڈکٹ', accessor: 'product' },
          { id: 'quantity', header: 'Quantity', headerUr: 'مقدار', accessor: 'quantity' },
          { id: 'estimatedAmt', header: 'Est. Amount', headerUr: 'تخمینی رقم', accessor: 'estimatedAmt' },
          { id: 'deptApproval', header: 'Dept Approval', headerUr: 'محکمہ منظوری', accessor: 'deptApproval' },
          { id: 'financeApproval', header: 'Finance Approval', headerUr: 'مالی منظوری', accessor: 'financeApproval' },
          { id: 'status', header: 'Status', headerUr: 'اسٹیٹس', accessor: 'status' },
        ]}
        data={approvalItems.length > 0 ? approvalItems : data}
        language={lang}
        onRowClick={(row) => onOpenInspector(row)}
      />
    </div>
  );
};
