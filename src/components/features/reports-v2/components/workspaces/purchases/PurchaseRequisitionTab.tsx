/**
 * @license SPDX-License-Identifier: Apache-2.0
 *
 * FuelPro Enterprise Business Operating System v4.0
 * PurchaseRequisitionTab — Purchase Requisitions Register
 *
 * 100% Google Firebase Realtime Database Driven — Zero Dummy Records.
 */

import React from 'react';
import { EnterpriseRegisterTable } from '../../EnterpriseRegisterTable';
import { WorkspaceEmptyState } from '../../common/WorkspaceEmptyState';
import { WorkspaceLoadingSkeleton } from '../../common/WorkspaceLoadingSkeleton';
import { useWorkspaceFirebaseData } from '../../../hooks/useWorkspaceFirebaseData';

interface PurchaseRequisitionTabProps { lang: 'en' | 'ur'; orgId?: string; stationId?: string; onOpenInspector: (r: Record<string, any>) => void; }

export const PurchaseRequisitionTab: React.FC<PurchaseRequisitionTabProps> = ({ lang, orgId, stationId, onOpenInspector }) => {
  const { data, loading, isEmpty, refetch } = useWorkspaceFirebaseData('FUEL_PURCHASES', { orgId, stationId });

  if (loading) return <WorkspaceLoadingSkeleton kpiCount={0} rowCount={4} />;
  if (isEmpty) return <WorkspaceEmptyState title="No Purchase Requisitions" description="Purchase requisition records will populate once requisitions are created in the system." onRefresh={refetch} />;

  const requisitions = data.filter(d => d.type === 'REQUISITION' || d.reqNo || d.requisitionStatus);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs space-y-3">
      <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider">Purchase Requisitions</h2>
      <EnterpriseRegisterTable
        columns={[
          { id: 'reqNo', header: 'REQ #', headerUr: 'ریکوئزیشن #', accessor: 'reqNo', sortable: true },
          { id: 'date', header: 'Date', headerUr: 'تاریخ', accessor: 'date', sortable: true },
          { id: 'product', header: 'Product', headerUr: 'پروڈکٹ', accessor: 'product' },
          { id: 'quantity', header: 'Quantity', headerUr: 'مقدار', accessor: 'quantity' },
          { id: 'estimatedAmt', header: 'Est. Amount (₨)', headerUr: 'تخمینی رقم', accessor: 'estimatedAmt' },
          { id: 'priority', header: 'Priority', headerUr: 'ترجیح', accessor: 'priority' },
          { id: 'status', header: 'Status', headerUr: 'اسٹیٹس', accessor: 'status' },
        ]}
        data={requisitions.length > 0 ? requisitions : data}
        language={lang}
        onRowClick={(row) => onOpenInspector(row)}
      />
    </div>
  );
};
