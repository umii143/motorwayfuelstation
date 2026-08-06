/**
 * @license SPDX-License-Identifier: Apache-2.0
 *
 * FuelPro Enterprise Business Operating System v4.0
 * FuelOperationsWorkspaceView — Shift Wise Sales Control Room Router
 *
 * Implements Enterprise Rules #130, #131, #132, #133, #134, #135, #136, #137, #138, #144, #161 & #162
 * Upgraded to 10-Layer UX standard (Addendum A.12.1) + Phase A Part 3 Audit
 */

import React, { useState, useMemo, useEffect } from 'react';
import { useReportExecution } from '../../../../../hooks/useReportExecution';
import { RightInspectorPanel } from '../RightInspectorPanel';
import { DateFilterState } from '../WorkspaceDateFilterMenu';
import { UniversalWorkspaceLayout, WorkspaceLayer, enforceOperationalSSOT } from '../../framework/UniversalWorkspaceLayout';
import { QueryContext } from '../../../../../lib/reports-v2/engines/types';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { DomainReportsCenterTab } from './reports-center/DomainReportsCenterTab';

import { ShiftOverviewTab } from './fuel_operations/ShiftOverviewTab';
import { FuelSalesRegisterTab } from './fuel_operations/FuelSalesRegisterTab';
import { ProductWiseSalesTab } from './fuel_operations/ProductWiseSalesTab';
import { NozzlePerformanceTab } from './fuel_operations/NozzlePerformanceTab';
import { PaymentSummaryTab } from './fuel_operations/PaymentSummaryTab';
import { ShiftPerformanceTab } from './fuel_operations/ShiftPerformanceTab';
import { CashReconciliationTab } from './fuel_operations/CashReconciliationTab';
import { VarianceAnalysisTab } from './fuel_operations/VarianceAnalysisTab';
import { TestLitersReportTab } from './fuel_operations/TestLitersReportTab';

interface FuelOperationsWorkspaceViewProps {
  reportId?: string;
  stationId?: string;
  orgId?: string;
  userId?: string;
  role?: string;
  lang?: 'en' | 'ur';
  onSelectReport?: (reportId: string) => void;
  onDrilldown?: (nextReportId: string, filterContext?: Record<string, any>) => void;
}

export const FuelOperationsWorkspaceView: React.FC<FuelOperationsWorkspaceViewProps> = ({
  stationId = 'st_default',
  orgId = 'org_main',
  userId = 'u_default',
  role = 'owner',
  lang = 'en',
  onSelectReport,
}) => {
  const isEn = lang === 'en';
  const isUrdu = lang === 'ur';

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

  const navigate = useNavigate();

  // Realtime Firestore Queries
  const salesQuery = useReportExecution('FS_REGISTER', queryContext);

  const [selectedRecord, setSelectedRecord] = useState<Record<string, any> | null>(null);

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

  const [registerSubTab, setRegisterSubTab] = useState<'sales' | 'products' | 'nozzles' | 'shifts' | 'test_liters'>('sales');
  const [analyticsSubTab, setAnalyticsSubTab] = useState<'reconciliation' | 'variance'>('reconciliation');

  const renderEmptyState = () => (
    <div className="flex flex-col items-center justify-center p-12 bg-card rounded-2xl border border-dashed border-border">
      <span className="text-4xl mb-4">⛽</span>
      <h3 className="text-lg font-black text-foreground">
        {isEn ? 'No Active Shift' : 'کوئی فعال شفٹ نہیں'}
      </h3>
      <p className="text-sm font-bold text-muted-foreground max-w-md text-center mt-2">
        {isEn ? 'Start a shift to begin operations and start recording fuel sales.' : 'آپریشن شروع کرنے اور سیلز ریکارڈ کرنے کے لیے شفٹ شروع کریں۔'}
      </p>
    </div>
  );

  const hasData = filteredSalesRows.length > 0;

  const renderOverviewLayer = () => {
    if (!hasData) return renderEmptyState();
    return (
      <ShiftOverviewTab
        salesRows={filteredSalesRows}
        totalRevenue={totalRevenue}
        totalLiters={totalLiters}
        lang={lang}
        onSelectReport={onSelectReport}
        onNavigateTab={(tab) => {}} // Navigation mapping handled by outer layout now if needed
      />
    );
  };

  const renderRegisterLayer = () => {
    if (!hasData) return renderEmptyState();
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-xl border border-border overflow-x-auto">
          {[
            { id: 'sales', label: 'Fuel Sales' },
            { id: 'products', label: 'Product Wise' },
            { id: 'nozzles', label: 'Nozzle Performance' },
            { id: 'shifts', label: 'Shift Performance' },
            { id: 'test_liters', label: '🧪 Test Liters (SSOT)' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setRegisterSubTab(tab.id as any)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                registerSubTab === tab.id ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        
        {registerSubTab === 'sales' && <FuelSalesRegisterTab salesRows={filteredSalesRows} lang={lang} onSelectRecord={setSelectedRecord} />}
        {registerSubTab === 'products' && <ProductWiseSalesTab lang={lang} onSelectRecord={setSelectedRecord} />}
        {registerSubTab === 'nozzles' && <NozzlePerformanceTab lang={lang} onSelectRecord={setSelectedRecord} />}
        {registerSubTab === 'shifts' && <ShiftPerformanceTab lang={lang} onSelectRecord={setSelectedRecord} />}
        {registerSubTab === 'test_liters' && <TestLitersReportTab lang={lang} onOpenInspector={setSelectedRecord} />}
      </div>
    );
  };

  const renderWorkflowLayer = () => {
    if (!hasData) return renderEmptyState();
    return <PaymentSummaryTab lang={lang} onSelectRecord={setSelectedRecord} />;
  };

  const renderAnalyticsLayer = () => {
    if (!hasData) return renderEmptyState();
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-xl border border-border overflow-x-auto">
          {[
            { id: 'reconciliation', label: 'Cash Reconciliation' },
            { id: 'variance', label: 'Variance Analysis' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setAnalyticsSubTab(tab.id as any)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                analyticsSubTab === tab.id ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        
        {analyticsSubTab === 'reconciliation' && <CashReconciliationTab lang={lang} onSelectRecord={setSelectedRecord} />}
        {analyticsSubTab === 'variance' && <VarianceAnalysisTab lang={lang} onSelectRecord={setSelectedRecord} />}
      </div>
    );
  };

  const renderAuditLayer = () => (
    <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
      <div className="flex flex-col items-center justify-center p-12 bg-muted/30 rounded-2xl border border-dashed border-border">
        <span className="text-4xl mb-4">📋</span>
        <h3 className="text-lg font-black text-foreground">
          {isEn ? 'Audit Feed' : 'آڈٹ فیڈ'}
        </h3>
        <p className="text-sm font-bold text-muted-foreground max-w-md text-center mt-2">
          {isEn ? 'No recent operations audited for the selected date range.' : 'اس تاریخ کے لیے کوئی آڈٹ ریکارڈ موجود نہیں۔'}
        </p>
      </div>
    </div>
  );

  const renderLayer = (layer: WorkspaceLayer) => {
    switch (layer) {
      case 'overview': return renderOverviewLayer();
      case 'register': return renderRegisterLayer();
      case 'workflow': return renderWorkflowLayer();
      case 'analytics': return renderAnalyticsLayer();
      case 'audit': return renderAuditLayer();
      case 'reports': return <DomainReportsCenterTab domainName="fuel_operations" lang={lang} />;
      default:
        return (
          <div className="flex flex-col items-center justify-center p-12 bg-card rounded-2xl border border-dashed border-border">
            <span className="text-4xl mb-4">📭</span>
            <h3 className="text-lg font-black text-foreground">
              {isEn ? 'Module Inactive' : 'ماڈیول فعال نہیں'}
            </h3>
            <p className="text-sm font-bold text-muted-foreground max-w-md text-center mt-2">
              {isEn ? 'This module is not active for the Fuel Operations domain.' : 'اس ڈومین کیلئے یہ ماڈیول فعال نہیں۔'}
            </p>
          </div>
        );
    }
  };

  return (
    <>
      <UniversalWorkspaceLayout
        lang={lang}
        title="Fuel Operations"
        titleUr="فیول آپریشنز"
        icon="⛽"
        domainName="fuel_operations"
        dateFilter={dateFilter}
        onDateFilterChange={setDateFilter}
        renderLayer={renderLayer}
        onNavigateRelated={onSelectReport}
      />
      <RightInspectorPanel
        isOpen={!!selectedRecord}
        onClose={() => setSelectedRecord(null)}
        record={selectedRecord}
        language={lang}
        onNavigateRelated={(repId) => onSelectReport?.(repId)}
      />
    </>
  );
};
