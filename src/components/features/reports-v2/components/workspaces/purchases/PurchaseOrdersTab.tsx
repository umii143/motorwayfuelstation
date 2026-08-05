/**
 * @license SPDX-License-Identifier: Apache-2.0
 *
 * FuelPro Enterprise Business Operating System v4.0
 * PurchaseOrdersTab — Purchase Orders Register
 *
 * 100% Google Firebase Realtime Database Driven — Zero Dummy Records.
 */

import React from 'react';
import { EnterpriseRegisterTable } from '../../EnterpriseRegisterTable';
import { WorkspaceEmptyState } from '../../common/WorkspaceEmptyState';
import { WorkspaceLoadingSkeleton } from '../../common/WorkspaceLoadingSkeleton';
import { useWorkspaceFirebaseData } from '../../../hooks/useWorkspaceFirebaseData';

interface PurchaseOrdersTabProps { lang: 'en' | 'ur'; orgId?: string; stationId?: string; onOpenInspector: (r: Record<string, any>) => void; }

export const PurchaseOrdersTab: React.FC<PurchaseOrdersTabProps> = ({ lang, orgId, stationId, onOpenInspector }) => {
  const { data, loading, isEmpty, refetch } = useWorkspaceFirebaseData('FUEL_PURCHASES', { orgId, stationId });

  if (loading) return <WorkspaceLoadingSkeleton kpiCount={0} rowCount={4} />;
  if (isEmpty) return <WorkspaceEmptyState title="No Purchase Orders" description="Purchase orders will populate once PO records are created in the system." onRefresh={refetch} />;

  const purchaseOrders = data.filter(d => d.type === 'PO' || d.poNo || d.orderStatus);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs space-y-3">
      <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider">Purchase Orders Register</h2>
      <EnterpriseRegisterTable
        columns={[
          { id: 'poNo', header: 'PO #', headerUr: 'آرڈر #', accessor: 'poNo', sortable: true },
          { id: 'date', header: 'Date', headerUr: 'تاریخ', accessor: 'date', sortable: true },
          { id: 'supplier', header: 'Supplier', headerUr: 'سپلائر', accessor: 'supplierName' },
          { id: 'product', header: 'Product', headerUr: 'پروڈکٹ', accessor: 'product' },
          { id: 'quantity', header: 'Liters', headerUr: 'لیٹرز', accessor: 'quantity' },
          { id: 'totalAmount', header: 'Amount (₨)', headerUr: 'رقم', accessor: 'totalAmount' },
          { id: 'status', header: 'Status', headerUr: 'اسٹیٹس', accessor: 'status' },
        ]}
        data={purchaseOrders.length > 0 ? purchaseOrders : data}
        language={lang}
        onRowClick={(row) => onOpenInspector(row)}
      />
    </div>
  );
};
