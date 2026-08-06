/**
 * @license SPDX-License-Identifier: Apache-2.0
 *
 * FuelPro Enterprise Business Operating System v4.0
 * InventoryWorkspaceView — Clean Modular Domain Router & Coordinator
 *
 * Implements Enterprise Rules #144, #145, #146, #147, #148, #149, #150, #151 & #152
 * Upgraded to 10-Layer UX standard (Addendum A.12.1) + Phase A Part 4 Audit
 * Manual Tank Dip is the Primary System of Record.
 */

import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useReportExecution } from '../../../../../hooks/useReportExecution';
import { RightInspectorPanel } from '../RightInspectorPanel';
import { DateFilterState } from '../WorkspaceDateFilterMenu';
import { UniversalWorkspaceLayout, WorkspaceLayer, enforceOperationalSSOT } from '../../framework/UniversalWorkspaceLayout';
import { QueryContext } from '../../../../../lib/reports-v2/engines/types';
import { getCentralizedInventorySnapshot } from '../../../../../services/inventoryEngine';
import toast from 'react-hot-toast';

import { InventoryOverviewTab } from './inventory/InventoryOverviewTab';
import { InventoryTankRegisterTab } from './inventory/InventoryTankRegisterTab';
import { InventoryPurchaseRecommendationTab } from './inventory/InventoryPurchaseRecommendationTab';
import { InventoryATGMonitoringTab } from './inventory/InventoryATGMonitoringTab';
import { DomainReportsCenterTab } from './reports-center/DomainReportsCenterTab';

interface InventoryWorkspaceViewProps {
  reportId?: string;
  stationId?: string;
  orgId?: string;
  userId?: string;
  role?: string;
  lang?: 'en' | 'ur';
  onSelectReport?: (reportId: string) => void;
  onDrilldown?: (nextReportId: string, filterContext?: Record<string, any>) => void;
}

export const InventoryWorkspaceView: React.FC<InventoryWorkspaceViewProps> = ({
  stationId = 'st_default',
  orgId = 'org_main',
  userId = 'u_default',
  role = 'owner',
  lang = 'en',
  onSelectReport,
}) => {
  const isEn = lang === 'en';
  const isUr = lang === 'ur';

  // Global Date Filter State
  const [dateFilter, setDateFilter] = useState<DateFilterState>({
    preset: 'today',
    startDate: '2025-05-15',
    endDate: '2025-05-15',
    label: 'May 15, 2025',
  });

  const queryContext: QueryContext = useMemo(
    () => ({ stationId, orgId, userId, role, dateRange: { startDate: dateFilter.startDate, endDate: dateFilter.endDate } }),
    [stationId, orgId, userId, role, dateFilter]
  );

  const navigate = useNavigate();

  // Firestore Live Stream Queries
  const tanksQuery = useReportExecution('INV_TANK_REG', queryContext);
  const dipsQuery = useReportExecution('INV_DIP', queryContext);
  const purchasesQuery = useReportExecution('PUR_REGISTER', queryContext);

  const [selectedRecord, setSelectedRecord] = useState<Record<string, any> | null>(null);

  const tankRows: Record<string, any>[] = tanksQuery.result?.register?.rows || [];
  const dipRows: Record<string, any>[] = dipsQuery.result?.register?.rows || [];
  const purchaseRows: Record<string, any>[] = purchasesQuery.result?.register?.rows || [];

  const snapshot = useMemo(() => getCentralizedInventorySnapshot(stationId), [stationId]);

  // Layer rendering
  const renderLayer = (layer: WorkspaceLayer) => {
    switch (layer) {
      case 'overview':
        return (
          <InventoryOverviewTab
            tanks={tankRows}
            dips={dipRows}
            purchases={purchaseRows}
            role={role}
            lang={lang}
            onSelectReport={onSelectReport}
            onSelectRecord={(r) => setSelectedRecord(r)}
          />
        );

      case 'kpis':
        return (
          <div className="space-y-4">
            <div className="bg-card border border-border rounded-2xl p-5 shadow-xs space-y-4">
              <h3 className="text-sm font-black text-foreground uppercase tracking-wider">
                {isEn ? 'ABC & XYZ Inventory Analysis Matrix' : 'اے بی سی تجزیہ ماڈیول'}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-xs">
                {snapshot.categories.map((cat: any) => (
                  <div key={cat.categoryId} className="p-4 rounded-xl bg-muted/40 border border-border space-y-2">
                    <div className="flex justify-between items-center font-sans font-bold text-foreground text-xs">
                      <span>{cat.categoryName}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] bg-primary/10 text-primary font-black uppercase">{cat.healthBadge}</span>
                    </div>
                    <div className="flex justify-between items-baseline font-bold">
                      <span className="text-lg text-foreground">{cat.totalCurrentStock.toLocaleString()} L</span>
                      <span className="text-xs text-primary">{cat.fillPct.toFixed(1)}% Fill</span>
                    </div>
                    <div className="text-[10px] text-muted-foreground pt-1 border-t border-border flex justify-between">
                      <span>Dead Stock: {cat.deadStock.toLocaleString()} L</span>
                      <span>Space: {cat.availableSpace.toLocaleString()} L</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-card border border-border rounded-2xl p-5 shadow-xs space-y-2">
                <h4 className="text-xs font-black text-foreground uppercase">{isEn ? 'Evaporation & Thermal Variance' : 'بخارات اور حرارتی فرق'}</h4>
                <p className="text-xs font-bold text-muted-foreground">
                  {isEn ? 'Live physical vs book stock variance tolerance: ±0.5%' : 'موجودہ اسٹاک کا کتابی فرق: ±0.5%'}
                </p>
                <div className="text-2xl font-black text-primary">
                  {snapshot.categories.reduce((acc: number, c: any) => acc + c.totalVarianceLtr, 0)} L
                </div>
              </div>

              <div className="bg-card border border-border rounded-2xl p-5 shadow-xs space-y-2">
                <h4 className="text-xs font-black text-foreground uppercase">{isEn ? 'Reorder Threshold Status' : 'ری آرڈر کی حد کا اسٹیٹس'}</h4>
                <p className="text-xs font-bold text-muted-foreground">
                  {isEn ? 'Safe capacity buffer maintained per fuel type' : 'محفوظ گنجائش بفر'}
                </p>
                <div className="text-2xl font-black text-emerald-600">
                  {snapshot.overallHealth}
                </div>
              </div>
            </div>
          </div>
        );

      case 'register':
        return (
          <InventoryTankRegisterTab
            tanks={tankRows}
            lang={lang}
            onSelectRecord={(r) => setSelectedRecord(r)}
          />
        );

      case 'analytics':
        return (
          <div className="space-y-4">
            <div className="bg-card border border-border rounded-2xl p-5 shadow-xs space-y-3">
              <h3 className="text-sm font-black text-foreground uppercase tracking-wider">
                {isEn ? 'FIFO Shadow & WAC Valuation Engine' : 'اسٹاک ویلیویشن ماڈیول'}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
                <div className="p-4 rounded-xl bg-muted/40 border border-border space-y-1">
                  <span className="text-muted-foreground font-sans font-bold">Total Cost Valuation (WAC)</span>
                  <div className="text-xl font-black text-foreground">Rs {snapshot.grandTotalCostValuation.toLocaleString('en-PK')}</div>
                </div>
                <div className="p-4 rounded-xl bg-muted/40 border border-border space-y-1">
                  <span className="text-muted-foreground font-sans font-bold">Total Retail Market Valuation</span>
                  <div className="text-xl font-black text-primary">Rs {snapshot.grandTotalMarketValuation.toLocaleString('en-PK')}</div>
                </div>
              </div>
            </div>

            <InventoryATGMonitoringTab lang={lang} />
          </div>
        );

      case 'ai':
        return (
          <InventoryPurchaseRecommendationTab
            lang={lang}
            onSelectReport={onSelectReport}
          />
        );

      case 'workflow':
        return (
          <div className="bg-card border border-border rounded-2xl p-5 shadow-xs space-y-4">
            <h3 className="text-sm font-black text-foreground uppercase tracking-wider">
              {isEn ? 'Manual Tank Dip & Revaluation Workflow' : 'مینوئل ڈیپ اور ری ویلیویشن ورک فلو'}
            </h3>
            <p className="text-xs font-bold text-muted-foreground">
              {isEn ? 'Record daily physical dip measurements to recalculate book variance.' : 'یومیہ ڈیپ ریکارڈ درج کریں۔'}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => enforceOperationalSSOT(navigate, 'Dip Calculator', '/dip-calculator', isEn)}
                className="px-4 py-2 bg-primary text-primary-foreground text-xs font-black rounded-xl hover:bg-primary/90 cursor-pointer"
              >
                + {isEn ? 'Open Dip Calculator' : 'ڈیپ کیلکولیٹر کھولیں'}
              </button>
            </div>
          </div>
        );

      case 'audit':
        return (
          <div className="bg-card border border-border rounded-2xl p-5 shadow-xs space-y-4">
            <h3 className="text-sm font-black text-foreground uppercase tracking-wider">
              {isEn ? 'Immutable Stock Audit Trail & Sensor Calibration Log' : 'اسٹاک آڈٹ لاگ'}
            </h3>
            {dipRows.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-8 bg-muted/30 rounded-xl border border-dashed border-border text-center">
                <span className="text-3xl mb-2">📋</span>
                <p className="text-xs font-bold text-muted-foreground">
                  {isEn ? 'No recent dip audit entries logged.' : 'کوئی آڈٹ ریکارڈ موجود نہیں۔'}
                </p>
              </div>
            ) : (
              <div className="space-y-2 font-mono text-xs">
                {dipRows.map((r, i) => (
                  <div key={i} className="p-3 rounded-xl bg-muted/40 border border-border flex justify-between items-center">
                    <div>
                      <span className="font-bold text-foreground font-sans">{r.tankName || r.tankId}</span>
                      <div className="text-[10px] text-muted-foreground">{r.timestamp || r.date}</div>
                    </div>
                    <span className="font-bold text-primary">{r.dipMm} mm</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      case 'documents':
        return (
          <div className="bg-card border border-border rounded-2xl p-5 shadow-xs space-y-4">
            <h3 className="text-sm font-black text-foreground uppercase tracking-wider">
              {isEn ? 'GRN Impact & Tank Inspection Documents' : 'اسٹاک دستاویزات'}
            </h3>
            {purchaseRows.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-8 bg-muted/30 rounded-xl border border-dashed border-border text-center">
                <span className="text-3xl mb-2">📄</span>
                <p className="text-xs font-bold text-muted-foreground">
                  {isEn ? 'No attached GRN documents or delivery receipts found.' : 'کوئی دستاویزات موجود نہیں ہیں۔'}
                </p>
              </div>
            ) : (
              <div className="space-y-2 text-xs">
                {purchaseRows.map((p, i) => (
                  <div key={i} className="p-3 rounded-xl bg-muted/40 border border-border flex justify-between items-center">
                    <span className="font-bold text-foreground">GRN Invoice #{p.invoiceNo || p.id}</span>
                    <span className="text-xs font-black text-primary">{p.quantity} L</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      case 'reports':
        return <DomainReportsCenterTab domainName="inventory" lang={lang} />;

      case 'settings':
        return (
          <div className="bg-card border border-border rounded-2xl p-5 shadow-xs space-y-4">
            <h3 className="text-sm font-black text-foreground uppercase tracking-wider">
              {isEn ? 'Tank Calibration & Safety Threshold Settings' : 'ٹینک کیلیبریشن سیٹنگز'}
            </h3>
            <div className="space-y-3 text-xs font-bold">
              <div className="flex justify-between items-center p-3 rounded-xl bg-muted/40 border border-border">
                <span>{isEn ? 'Thermal Expansion Variance Limit' : 'حرارتی حد'}</span>
                <span className="font-mono text-primary font-black">± 0.50 %</span>
              </div>
              <div className="flex justify-between items-center p-3 rounded-xl bg-muted/40 border border-border">
                <span>{isEn ? 'Critical Low Stock Trigger' : 'کریٹیکل لیول ہنگامی الرٹ'}</span>
                <span className="font-mono text-rose-600 font-black">15.0 % Capacity</span>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <>
      <UniversalWorkspaceLayout
        lang={lang}
        title="Inventory & Tank Stock Control Center"
        titleUr="انوینٹری و ٹینک اسٹاک کنٹرول سینٹر"
        icon="🛢️"
        domainName="inventory"
        dateFilter={dateFilter}
        onDateFilterChange={setDateFilter}
        renderLayer={renderLayer}
        onNavigateRelated={onSelectReport}
      />

      {/* 7-TAB RIGHT INSPECTOR DRAWER */}
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
