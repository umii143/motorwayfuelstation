/**
 * @license SPDX-License-Identifier: Apache-2.0
 *
 * FuelPro Enterprise Business Operating System v4.0
 * FuelOperationsWorkspaceView — Pixel-Match Shift Wise Sales Control Room Router
 *
 * Implements Enterprise Rules #130, #131, #132, #133, #134, #135, #136, #137, #138, #144, #161 & #162
 * Metadata-Driven Navigation via WorkspaceRegistry.ts
 */

import React, { useState, useMemo, useEffect } from 'react';
import { useReportExecution } from '../../../../../hooks/useReportExecution';
import { RightInspectorPanel } from '../RightInspectorPanel';
import { WorkspaceDateFilterMenu, DateFilterState } from '../WorkspaceDateFilterMenu';
import { resolveWorkspaceRoute } from '../../../../../lib/reports-v2/config/WorkspaceRegistry';
import { QueryContext } from '../../../../../lib/reports-v2/engines/types';
import { Plus } from 'lucide-react';

import { ShiftOverviewTab } from './fuel_operations/ShiftOverviewTab';
import { FuelSalesRegisterTab } from './fuel_operations/FuelSalesRegisterTab';
import { ProductWiseSalesTab } from './fuel_operations/ProductWiseSalesTab';
import { NozzlePerformanceTab } from './fuel_operations/NozzlePerformanceTab';
import { PaymentSummaryTab } from './fuel_operations/PaymentSummaryTab';
import { ShiftPerformanceTab } from './fuel_operations/ShiftPerformanceTab';
import { CashReconciliationTab } from './fuel_operations/CashReconciliationTab';
import { VarianceAnalysisTab } from './fuel_operations/VarianceAnalysisTab';

interface FuelOperationsWorkspaceViewProps {
  reportId: string;
  stationId: string;
  orgId: string;
  userId: string;
  role: string;
  lang: 'en' | 'ur';
  onSelectReport?: (reportId: string) => void;
  onDrilldown?: (nextReportId: string, filterContext?: Record<string, any>) => void;
}

export const FuelOperationsWorkspaceView: React.FC<FuelOperationsWorkspaceViewProps> = ({
  reportId,
  stationId,
  orgId,
  userId,
  role,
  lang,
  onSelectReport,
}) => {
  const isEn = lang === 'en';

  // Interactive Global Filters State
  const [dateFilter, setDateFilter] = useState<DateFilterState>({
    preset: 'today',
    startDate: '2025-05-15',
    endDate: '2025-05-15',
    label: 'May 15, 2025',
  });

  const [selectedShift, setSelectedShift] = useState<string>('ALL');

  const queryContext: QueryContext = useMemo(
    () => ({
      stationId,
      orgId,
      userId,
      role,
      dateRange: { startDate: dateFilter.startDate, endDate: dateFilter.endDate },
      shiftId: selectedShift !== 'ALL' ? selectedShift : undefined,
    }),
    [stationId, orgId, userId, role, dateFilter, selectedShift]
  );

  // Realtime Firestore Queries
  const salesQuery = useReportExecution('FS_REGISTER', queryContext);

  const [selectedRecord, setSelectedRecord] = useState<Record<string, any> | null>(null);

  // Metadata-Driven Active Tab Resolution (Rule #162)
  const resolvedRoute = useMemo(() => resolveWorkspaceRoute(reportId), [reportId]);

  const [activeTab, setActiveTab] = useState<
    'overview' | 'sales' | 'products' | 'nozzles' | 'payments' | 'shifts' | 'reconciliation' | 'variance'
  >((resolvedRoute?.tabId as any) || 'overview');

  // Reactively switch activeTab when reportId changes from Sidebar/Favorites/Command Palette
  useEffect(() => {
    if (resolvedRoute?.tabId) {
      setActiveTab(resolvedRoute.tabId as any);
    }
  }, [reportId, resolvedRoute]);

  const salesRows: Record<string, any>[] = salesQuery.result?.register?.rows || [];

  // Filter Sales Rows Reactively
  const filteredSalesRows = useMemo(() => {
    let rows = salesRows;
    if (selectedShift !== 'ALL') {
      rows = rows.filter((r) => String(r.shiftName || r.shiftId || '').toLowerCase().includes(selectedShift.toLowerCase()));
    }
    return rows;
  }, [salesRows, selectedShift]);

  const totalRevenue = useMemo(() => {
    return filteredSalesRows.reduce((acc: number, r: Record<string, any>) => acc + (Number(r.totalAmount || r.amount) || 0), 0);
  }, [filteredSalesRows]);

  const totalLiters = useMemo(() => {
    return filteredSalesRows.reduce((acc: number, r: Record<string, any>) => acc + (Number(r.quantity || r.liters) || 0), 0);
  }, [filteredSalesRows]);

  return (
    <div className={`space-y-4 font-sans text-slate-800 pb-8 ${lang === 'ur' ? 'rtl' : ''}`}>
      {/* ── 1. WORKSPACE HEADER & TOP INTERACTIVE CONTROLS ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-xs">
        <div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight leading-tight flex items-center gap-2">
            <span>⛽</span>
            <span>Shift Wise Sales</span>
          </h1>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-[11px] font-black border border-emerald-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Live Firebase Stream
            </span>
            <span className="text-xs font-bold text-slate-500">
              Operational Sales Monitoring
            </span>
          </div>
        </div>

        {/* Right Top Interactive Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Interactive Date Range Popover Picker */}
          <WorkspaceDateFilterMenu
            value={dateFilter}
            onChange={(newVal) => setDateFilter(newVal)}
            lang={lang}
          />

          {/* Shift Filter Dropdown */}
          <select
            value={selectedShift}
            onChange={(e) => setSelectedShift(e.target.value)}
            className="px-3.5 py-2 bg-slate-50 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 focus:outline-none cursor-pointer"
          >
            <option value="ALL">All Shifts</option>
            <option value="MORNING">Morning Shift</option>
            <option value="EVENING">Evening Shift</option>
            <option value="NIGHT">Night Shift</option>
          </select>

          {/* Open Shift Action Button */}
          <button
            onClick={() => onSelectReport?.('C2')}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#0B5C3D] hover:bg-emerald-800 text-white text-xs font-black rounded-xl shadow-xs transition-all cursor-pointer"
          >
            <Plus size={15} />
            <span>+ Open Shift</span>
          </button>
        </div>
      </div>

      {/* ── 2. SUB-NAVIGATION TABS (8 TABS — MODULAR COMPONENT ROUTER) ── */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-2 shadow-xs flex items-center gap-1 overflow-x-auto custom-horizontal-scrollbar" data-horizontal-scroll="true">
        {[
          { id: 'overview', label: 'Overview' },
          { id: 'sales', label: 'Fuel Sales Register' },
          { id: 'products', label: 'Product-wise Sales' },
          { id: 'nozzles', label: 'Nozzle Performance' },
          { id: 'payments', label: 'Payment Summary' },
          { id: 'shifts', label: 'Shift Performance' },
          { id: 'reconciliation', label: 'Cash Reconciliation' },
          { id: 'variance', label: 'Variance Analysis' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold whitespace-nowrap transition-all cursor-pointer ${
              activeTab === tab.id
                ? 'bg-[#0B5C3D] text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── 3. MODULAR SUB-TAB COMPONENT ROUTING (ALL 8 TABS DEDICATED) ── */}

      {activeTab === 'overview' && (
        <ShiftOverviewTab
          salesRows={filteredSalesRows}
          totalRevenue={totalRevenue}
          totalLiters={totalLiters}
          lang={lang}
          onSelectReport={onSelectReport}
          onNavigateTab={(tab) => setActiveTab(tab as any)}
        />
      )}

      {activeTab === 'sales' && (
        <FuelSalesRegisterTab
          salesRows={filteredSalesRows}
          lang={lang}
          onSelectRecord={(r) => setSelectedRecord(r)}
        />
      )}

      {activeTab === 'products' && (
        <ProductWiseSalesTab
          lang={lang}
          onSelectRecord={(r) => setSelectedRecord(r)}
        />
      )}

      {activeTab === 'nozzles' && (
        <NozzlePerformanceTab
          lang={lang}
          onSelectRecord={(r) => setSelectedRecord(r)}
        />
      )}

      {activeTab === 'payments' && (
        <PaymentSummaryTab
          lang={lang}
          onSelectRecord={(r) => setSelectedRecord(r)}
        />
      )}

      {activeTab === 'shifts' && (
        <ShiftPerformanceTab
          lang={lang}
          onSelectRecord={(r) => setSelectedRecord(r)}
        />
      )}

      {activeTab === 'reconciliation' && (
        <CashReconciliationTab
          lang={lang}
          onSelectRecord={(r) => setSelectedRecord(r)}
        />
      )}

      {activeTab === 'variance' && (
        <VarianceAnalysisTab
          lang={lang}
          onSelectRecord={(r) => setSelectedRecord(r)}
        />
      )}

      {/* ── 7-TAB RIGHT INSPECTOR DRAWER ── */}
      <RightInspectorPanel
        isOpen={!!selectedRecord}
        onClose={() => setSelectedRecord(null)}
        record={selectedRecord}
        language={lang}
        onNavigateRelated={(repId) => onSelectReport?.(repId)}
      />
    </div>
  );
};
