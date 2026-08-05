/**
 * @license SPDX-License-Identifier: Apache-2.0
 *
 * FuelPro Enterprise Business Operating System v4.0
 * InvoiceVerificationTab — Three-Way Invoice Matching & Verification
 *
 * 100% Google Firebase Realtime Database Driven — Zero Dummy Records.
 */

import React from 'react';
import { EnterpriseRegisterTable } from '../../EnterpriseRegisterTable';
import { WorkspaceEmptyState } from '../../common/WorkspaceEmptyState';
import { WorkspaceLoadingSkeleton } from '../../common/WorkspaceLoadingSkeleton';
import { useWorkspaceFirebaseData } from '../../../hooks/useWorkspaceFirebaseData';

interface InvoiceVerificationTabProps { lang: 'en' | 'ur'; orgId?: string; stationId?: string; onOpenInspector: (r: Record<string, any>) => void; }

export const InvoiceVerificationTab: React.FC<InvoiceVerificationTabProps> = ({ lang, orgId, stationId, onOpenInspector }) => {
  const { data, loading, isEmpty, refetch } = useWorkspaceFirebaseData('FUEL_PURCHASES', { orgId, stationId });

  if (loading) return <WorkspaceLoadingSkeleton kpiCount={0} rowCount={4} />;
  if (isEmpty) return <WorkspaceEmptyState title="No Invoice Verification Records" description="Invoice verification records will populate once fuel purchases are recorded with GRN and PO matching data." onRefresh={refetch} />;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs space-y-3">
      <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider">Three-Way Invoice Matching & Verification</h2>
      <EnterpriseRegisterTable
        columns={[
          { id: 'invoiceNo', header: 'INV #', headerUr: 'انوائس #', accessor: 'invoiceNo', sortable: true },
          { id: 'poNo', header: 'PO #', headerUr: 'آرڈر #', accessor: 'poNo' },
          { id: 'grnNo', header: 'GRN #', headerUr: 'جی آر این #', accessor: 'grnNo' },
          { id: 'supplierName', header: 'Supplier', headerUr: 'سپلائر', accessor: 'supplierName' },
          { id: 'quantity', header: 'Invoice Qty', headerUr: 'انوائس مقدار', accessor: 'quantity' },
          { id: 'rate', header: 'Rate', headerUr: 'ریٹ', accessor: 'rate' },
          { id: 'matchStatus', header: 'Match Status', headerUr: 'میچ اسٹیٹس', accessor: 'matchStatus' },
          { id: 'variance', header: 'Variance', headerUr: 'فرق', accessor: 'variance' },
        ]}
        data={data}
        language={lang}
        onRowClick={(row) => onOpenInspector(row)}
      />
    </div>
  );
};
