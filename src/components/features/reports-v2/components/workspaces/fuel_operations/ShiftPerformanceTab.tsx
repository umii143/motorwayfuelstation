/**
 * @license SPDX-License-Identifier: Apache-2.0
 *
 * FuelPro Enterprise Business Operating System v4.0
 * ShiftPerformanceTab — Dedicated Shift Performance & Operator Ledger Sub-Workspace
 *
 * 100% Google Firebase Realtime Database Driven — Zero Dummy Records.
 * Implements Enterprise Rule #1, #137 & Rule #144
 */

import React, { useMemo } from 'react';
import { EnterpriseRegisterTable } from '../../EnterpriseRegisterTable';
import { Users } from 'lucide-react';
import { WorkspaceEmptyState } from '../../common/WorkspaceEmptyState';
import { WorkspaceLoadingSkeleton } from '../../common/WorkspaceLoadingSkeleton';
import { useWorkspaceFirebaseData } from '../../../hooks/useWorkspaceFirebaseData';

function formatCurrency(v: number): string {
  return `Rs ${v.toLocaleString('en-PK')}`;
}

interface ShiftPerformanceTabProps {
  salesRows?: Record<string, any>[];
  lang: 'en' | 'ur';
  orgId?: string;
  stationId?: string;
  onSelectRecord?: (record: Record<string, any>) => void;
}

export const ShiftPerformanceTab: React.FC<ShiftPerformanceTabProps> = ({
  salesRows = [],
  lang,
  orgId,
  stationId,
  onSelectRecord,
}) => {
  const isEn = lang === 'en';

  // Fetch live shift and employee data from Firebase
  const { data: shiftData, loading: shiftsLoading } = useWorkspaceFirebaseData('SHIFTS', { orgId, stationId });
  const { data: employeeData, loading: employeesLoading } = useWorkspaceFirebaseData('EMPLOYEES', { orgId, stationId });

  const loading = shiftsLoading || employeesLoading;

  // Compute operator performance from live sales data
  const operators = useMemo(() => {
    if (salesRows.length === 0) return [];

    const grouped: Record<string, { role: string; shift: string; txns: number; liters: number; totalSale: number; rates: number[] }> = {};

    salesRows.forEach((row) => {
      const name = row.operatorName || row.staffName || row.createdBy || 'Unknown';
      if (!grouped[name]) {
        grouped[name] = { role: row.role || 'Operator', shift: row.shiftName || row.shiftId || '—', txns: 0, liters: 0, totalSale: 0, rates: [] };
      }
      grouped[name].txns += 1;
      grouped[name].liters += Number(row.quantity || row.liters) || 0;
      grouped[name].totalSale += Number(row.totalAmount || row.amount) || 0;
    });

    return Object.entries(grouped).map(([name, g]) => ({
      name,
      role: g.role,
      shift: g.shift,
      txns: g.txns,
      liters: `${g.liters.toLocaleString('en-PK', { maximumFractionDigits: 2 })} L`,
      totalSale: formatCurrency(g.totalSale),
      avgSale: g.txns > 0 ? formatCurrency(Math.round(g.totalSale / g.txns)) : '—',
      status: 'ACTIVE_ON_DUTY',
    })).sort((a, b) => b.txns - a.txns);
  }, [salesRows]);

  // Compute KPIs from live data
  const activeShift = shiftData.find(s => s.status === 'OPEN' || s.status === 'ACTIVE' || s.shiftStatus === 'OPEN');
  const totalTxns = operators.reduce((s, o) => s + o.txns, 0);
  const topOperator = operators.length > 0 ? operators[0] : null;

  if (loading) {
    return <WorkspaceLoadingSkeleton kpiCount={4} rowCount={4} />;
  }

  if (operators.length === 0) {
    return (
      <WorkspaceEmptyState
        title="No Shift Performance Data Available"
        description="Shift performance and operator rankings will automatically populate once sales transactions are recorded during active shifts."
      />
    );
  }

  return (
    <div className="space-y-4">
      {/* SHIFT KPIS — computed from live data */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-amber-50/80 border border-amber-200/90 rounded-2xl p-4 flex flex-col justify-between shadow-xs">
          <span className="text-xs font-black text-amber-900">Active Shift Session</span>
          <div className="text-2xl font-black text-amber-900 tracking-tight">{activeShift?.name || activeShift?.shiftName || 'No Active Shift'}</div>
          <span className="text-[10px] font-extrabold text-amber-700 mt-1">{activeShift?.startTime || '—'} – {activeShift?.endTime || '—'}</span>
        </div>

        <div className="bg-purple-50/80 border border-purple-200/90 rounded-2xl p-4 flex flex-col justify-between shadow-xs">
          <span className="text-xs font-black text-purple-900">Active Staff On Duty</span>
          <div className="text-2xl font-black text-purple-900 tracking-tight">{operators.length} Operators</div>
          <span className="text-[10px] font-extrabold text-purple-700 mt-1">From live sales records</span>
        </div>

        <div className="bg-blue-50/80 border border-blue-200/90 rounded-2xl p-4 flex flex-col justify-between shadow-xs">
          <span className="text-xs font-black text-blue-900">Total Shift Transactions</span>
          <div className="text-2xl font-black text-blue-900 tracking-tight">{totalTxns} Txns</div>
          <span className="text-[10px] font-extrabold text-blue-700 mt-1">From live database</span>
        </div>

        <div className="bg-emerald-50/80 border border-emerald-200/90 rounded-2xl p-4 flex flex-col justify-between shadow-xs">
          <span className="text-xs font-black text-emerald-900">Top Performing Operator</span>
          <div className="text-xl font-black text-[#0B5C3D] tracking-tight">{topOperator?.name || '—'}</div>
          <span className="text-[10px] font-extrabold text-emerald-700 mt-1">{topOperator?.liters || '—'} Dispensed</span>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs space-y-3">
        <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
          <Users size={16} className="text-amber-600" />
          <span>Shift Operators Performance & Dispense Ranking Ledger</span>
        </h2>

        <EnterpriseRegisterTable
          columns={[
            { id: 'name', header: 'Operator Name', headerUr: 'آپریٹر', accessor: 'name', sortable: true },
            { id: 'role', header: 'Shift Role', headerUr: 'عہدہ', accessor: 'role' },
            { id: 'shift', header: 'Shift Session', headerUr: 'شفٹ سیشن', accessor: 'shift' },
            { id: 'txns', header: 'Transactions', headerUr: 'ٹرانزیکشنز', accessor: 'txns', isNumeric: true },
            { id: 'liters', header: 'Liters Dispensed', headerUr: 'لیٹرز', accessor: 'liters' },
            { id: 'totalSale', header: 'Total Sales (₨)', headerUr: 'کل سیلز', accessor: 'totalSale' },
            { id: 'avgSale', header: 'Avg Sale / Txn', headerUr: 'اوسط سیل', accessor: 'avgSale' },
          ]}
          data={operators}
          language={lang}
          onRowClick={(row) => onSelectRecord?.(row)}
        />
      </div>
    </div>
  );
};
