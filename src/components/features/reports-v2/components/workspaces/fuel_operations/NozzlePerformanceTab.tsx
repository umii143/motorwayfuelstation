/**
 * @license SPDX-License-Identifier: Apache-2.0
 *
 * FuelPro Enterprise Business Operating System v4.0
 * NozzlePerformanceTab — Dedicated Nozzle Performance & Meter Readings Sub-Workspace
 *
 * 100% Google Firebase Realtime Database Driven — Zero Dummy Records.
 * Implements Enterprise Rule #1, #137 & Rule #144
 */

import React from 'react';
import { EnterpriseRegisterTable } from '../../EnterpriseRegisterTable';
import { Fuel } from 'lucide-react';
import { WorkspaceEmptyState } from '../../common/WorkspaceEmptyState';
import { WorkspaceLoadingSkeleton } from '../../common/WorkspaceLoadingSkeleton';
import { useWorkspaceFirebaseData } from '../../../hooks/useWorkspaceFirebaseData';

interface NozzlePerformanceTabProps {
  lang: 'en' | 'ur';
  orgId?: string;
  stationId?: string;
  onSelectRecord?: (record: Record<string, any>) => void;
}

export const NozzlePerformanceTab: React.FC<NozzlePerformanceTabProps> = ({
  lang,
  orgId,
  stationId,
  onSelectRecord,
}) => {
  const { data: nozzleData, loading, isEmpty, refetch } = useWorkspaceFirebaseData('NOZZLE_READINGS', {
    orgId,
    stationId,
  });

  if (loading) {
    return <WorkspaceLoadingSkeleton kpiCount={0} rowCount={5} />;
  }

  if (isEmpty) {
    return (
      <WorkspaceEmptyState
        title="No Nozzle Performance Records Found"
        description="Nozzle performance data and meter readings will automatically populate here once nozzle readings are recorded in the system."
        onRefresh={refetch}
      />
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs space-y-4">
      <div className="flex justify-between items-center pb-2 border-b border-slate-100">
        <div>
          <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <Fuel size={16} className="text-blue-600" />
            <span>Nozzle Performance & Mechanical Meter Readings</span>
          </h2>
          <p className="text-xs font-bold text-slate-400">Live electronic totalizer readings and dispensing flow rates</p>
        </div>
      </div>

      <EnterpriseRegisterTable
        columns={[
          { id: 'name', header: 'Nozzle Name', headerUr: 'نوزل نام', accessor: 'name', sortable: true },
          { id: 'product', header: 'Product', headerUr: 'پروڈکٹ', accessor: 'product' },
          { id: 'status', header: 'Live Status', headerUr: 'اسٹیٹس', accessor: 'status' },
          { id: 'flowRate', header: 'Flow Rate', headerUr: 'بہاؤ کی رفتار', accessor: 'flowRate' },
          { id: 'meterReading', header: 'Meter Reading (L)', headerUr: 'میٹر ریڈنگ', accessor: 'meterReading' },
          { id: 'totalRevenue', header: 'Total Revenue (₨)', headerUr: 'کل آمدن', accessor: 'totalRevenue' },
        ]}
        data={nozzleData}
        language={lang}
        onRowClick={(row) => onSelectRecord?.(row)}
      />
    </div>
  );
};
