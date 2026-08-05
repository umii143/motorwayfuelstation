/**
 * @license SPDX-License-Identifier: Apache-2.0
 *
 * FuelPro Enterprise Business Operating System v4.0
 * PurchaseRegisterTab — Purchase Invoice Register
 *
 * 100% Google Firebase Realtime Database Driven — Zero Dummy Records.
 */

import React from 'react';
import { EnterpriseRegisterTable } from '../../EnterpriseRegisterTable';
import { WorkspaceEmptyState } from '../../common/WorkspaceEmptyState';
import { WorkspaceLoadingSkeleton } from '../../common/WorkspaceLoadingSkeleton';
import { useWorkspaceFirebaseData } from '../../../hooks/useWorkspaceFirebaseData';

interface PurchaseRegisterTabProps { lang: 'en' | 'ur'; orgId?: string; stationId?: string; onOpenInspector: (r: Record<string, any>) => void; }

export const PurchaseRegisterTab: React.FC<PurchaseRegisterTabProps> = ({ lang, orgId, stationId, onOpenInspector }) => {
  const { data, loading, isEmpty, refetch } = useWorkspaceFirebaseData('FUEL_PURCHASES', { orgId, stationId });

  if (loading) return <WorkspaceLoadingSkeleton kpiCount={0} rowCount={5} />;
  if (isEmpty) return <WorkspaceEmptyState title="No Purchase Invoices" description="Purchase invoices will populate once fuel purchase records are created in the system." onRefresh={refetch} />;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs space-y-3">
      <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider">Purchase Invoice Register</h2>
      <EnterpriseRegisterTable
        columns={[
          { id: 'invoiceNo', header: 'INV #', headerUr: 'انوائس #', accessor: 'invoiceNo', sortable: true },
          { id: 'date', header: 'Date', headerUr: 'تاریخ', accessor: 'date', sortable: true },
          { id: 'supplier', header: 'Supplier', headerUr: 'سپلائر', accessor: 'supplierName' },
          { id: 'product', header: 'Product', headerUr: 'پروڈکٹ', accessor: 'product' },
          { id: 'quantity', header: 'Liters', headerUr: 'لیٹرز', accessor: 'quantity', isNumeric: true },
          { id: 'rate', header: 'Rate / L', headerUr: 'ریٹ', accessor: 'rate', isCurrency: true },
          { id: 'totalAmount', header: 'Amount (₨)', headerUr: 'رقم', accessor: 'totalAmount', isCurrency: true },
          { id: 'status', header: 'Status', headerUr: 'اسٹیٹس', accessor: 'status' },
        ]}
        data={data}
        language={lang}
        onRowClick={(row) => onOpenInspector(row)}
      />
    </div>
  );
};
