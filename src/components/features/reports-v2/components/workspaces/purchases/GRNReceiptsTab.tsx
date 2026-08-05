/**
 * @license SPDX-License-Identifier: Apache-2.0
 *
 * FuelPro Enterprise Business Operating System v4.0
 * GRNReceiptsTab — Goods Receipt Notes Register
 *
 * 100% Google Firebase Realtime Database Driven — Zero Dummy Records.
 */

import React from 'react';
import { EnterpriseRegisterTable } from '../../EnterpriseRegisterTable';
import { WorkspaceEmptyState } from '../../common/WorkspaceEmptyState';
import { WorkspaceLoadingSkeleton } from '../../common/WorkspaceLoadingSkeleton';
import { useWorkspaceFirebaseData } from '../../../hooks/useWorkspaceFirebaseData';

interface GRNReceiptsTabProps { lang: 'en' | 'ur'; orgId?: string; stationId?: string; onOpenInspector: (r: Record<string, any>) => void; }

export const GRNReceiptsTab: React.FC<GRNReceiptsTabProps> = ({ lang, orgId, stationId, onOpenInspector }) => {
  const { data, loading, isEmpty, refetch } = useWorkspaceFirebaseData('FUEL_PURCHASES', { orgId, stationId });

  if (loading) return <WorkspaceLoadingSkeleton kpiCount={0} rowCount={4} />;

  const grnRecords = data.filter(d => d.grnNo || d.type === 'GRN' || d.grnStatus);

  if (grnRecords.length === 0 && isEmpty) return <WorkspaceEmptyState title="No GRN Receipts" description="Goods receipt notes will populate once bowser deliveries are received and verified." onRefresh={refetch} />;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs space-y-3">
      <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider">Goods Receipt Notes (GRN)</h2>
      <EnterpriseRegisterTable
        columns={[
          { id: 'grnNo', header: 'GRN #', headerUr: 'جی آر این #', accessor: 'grnNo', sortable: true },
          { id: 'date', header: 'Date', headerUr: 'تاریخ', accessor: 'date', sortable: true },
          { id: 'supplierName', header: 'Supplier', headerUr: 'سپلائر', accessor: 'supplierName' },
          { id: 'product', header: 'Product', headerUr: 'پروڈکٹ', accessor: 'product' },
          { id: 'quantity', header: 'Received Qty', headerUr: 'وصول شدہ مقدار', accessor: 'quantity' },
          { id: 'status', header: 'GRN Status', headerUr: 'اسٹیٹس', accessor: 'status' },
        ]}
        data={grnRecords.length > 0 ? grnRecords : data}
        language={lang}
        onRowClick={(row) => onOpenInspector(row)}
      />
    </div>
  );
};
