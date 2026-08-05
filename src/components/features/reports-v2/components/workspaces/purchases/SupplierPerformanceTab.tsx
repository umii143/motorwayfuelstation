/**
 * @license SPDX-License-Identifier: Apache-2.0
 *
 * FuelPro Enterprise Business Operating System v4.0
 * SupplierPerformanceTab (Purchases) — Supplier Performance Scorecard
 *
 * 100% Google Firebase Realtime Database Driven — Zero Dummy Records.
 */

import React from 'react';
import { EnterpriseRegisterTable } from '../../EnterpriseRegisterTable';
import { WorkspaceEmptyState } from '../../common/WorkspaceEmptyState';
import { WorkspaceLoadingSkeleton } from '../../common/WorkspaceLoadingSkeleton';
import { useWorkspaceFirebaseData } from '../../../hooks/useWorkspaceFirebaseData';

interface SupplierPerformanceTabProps { lang: 'en' | 'ur'; orgId?: string; stationId?: string; onOpenInspector: (r: Record<string, any>) => void; }

export const SupplierPerformanceTab: React.FC<SupplierPerformanceTabProps> = ({ lang, orgId, stationId, onOpenInspector }) => {
  const { data, loading, isEmpty, refetch } = useWorkspaceFirebaseData('SUPPLIERS', { orgId, stationId });

  if (loading) return <WorkspaceLoadingSkeleton kpiCount={0} rowCount={4} />;
  if (isEmpty) return <WorkspaceEmptyState title="No Supplier Performance Data" description="Supplier performance scorecard will populate once supplier records and purchase history are available." onRefresh={refetch} />;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs space-y-3">
      <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider">Supplier Performance Scorecard</h2>
      <EnterpriseRegisterTable
        columns={[
          { id: 'name', header: 'Supplier', headerUr: 'سپلائر', accessor: 'name', sortable: true },
          { id: 'totalOrders', header: 'Total Orders', headerUr: 'کل آرڈرز', accessor: 'totalOrders', isNumeric: true },
          { id: 'onTimeDelivery', header: 'On-Time %', headerUr: 'وقت پر %', accessor: 'onTimeDelivery' },
          { id: 'qualityScore', header: 'Quality Score', headerUr: 'کوالٹی اسکور', accessor: 'qualityScore' },
          { id: 'avgDeliveryTime', header: 'Avg Delivery', headerUr: 'اوسط ترسیل', accessor: 'avgDeliveryTime' },
          { id: 'status', header: 'Rating', headerUr: 'درجہ بندی', accessor: 'status' },
        ]}
        data={data}
        language={lang}
        onRowClick={(row) => onOpenInspector(row)}
      />
    </div>
  );
};
