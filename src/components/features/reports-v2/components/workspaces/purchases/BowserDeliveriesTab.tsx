/**
 * @license SPDX-License-Identifier: Apache-2.0
 *
 * FuelPro Enterprise Business Operating System v4.0
 * BowserDeliveriesTab — Bowser Delivery Tracking Register
 *
 * 100% Google Firebase Realtime Database Driven — Zero Dummy Records.
 */

import React from 'react';
import { EnterpriseRegisterTable } from '../../EnterpriseRegisterTable';
import { WorkspaceEmptyState } from '../../common/WorkspaceEmptyState';
import { WorkspaceLoadingSkeleton } from '../../common/WorkspaceLoadingSkeleton';
import { useWorkspaceFirebaseData } from '../../../hooks/useWorkspaceFirebaseData';

interface BowserDeliveriesTabProps { lang: 'en' | 'ur'; orgId?: string; stationId?: string; onOpenInspector: (r: Record<string, any>) => void; }

export const BowserDeliveriesTab: React.FC<BowserDeliveriesTabProps> = ({ lang, orgId, stationId, onOpenInspector }) => {
  const { data, loading, isEmpty, refetch } = useWorkspaceFirebaseData('FUEL_PURCHASES', { orgId, stationId });

  if (loading) return <WorkspaceLoadingSkeleton kpiCount={0} rowCount={4} />;
  if (isEmpty) return <WorkspaceEmptyState title="No Bowser Deliveries" description="Bowser delivery records will populate once fuel deliveries are logged in the system." onRefresh={refetch} />;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs space-y-3">
      <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider">Bowser Delivery Tracking Register</h2>
      <EnterpriseRegisterTable
        columns={[
          { id: 'bowserNo', header: 'Bowser #', headerUr: 'باؤزر #', accessor: 'bowserNo', sortable: true },
          { id: 'date', header: 'Date', headerUr: 'تاریخ', accessor: 'date', sortable: true },
          { id: 'supplierName', header: 'Supplier', headerUr: 'سپلائر', accessor: 'supplierName' },
          { id: 'product', header: 'Product', headerUr: 'پروڈکٹ', accessor: 'product' },
          { id: 'quantity', header: 'Liters', headerUr: 'لیٹرز', accessor: 'quantity' },
          { id: 'driver', header: 'Driver', headerUr: 'ڈرائیور', accessor: 'driver' },
          { id: 'status', header: 'Status', headerUr: 'اسٹیٹس', accessor: 'status' },
        ]}
        data={data}
        language={lang}
        onRowClick={(row) => onOpenInspector(row)}
      />
    </div>
  );
};
