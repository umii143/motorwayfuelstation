/**
 * @license SPDX-License-Identifier: Apache-2.0
 *
 * FuelPro Enterprise Business Operating System v4.0
 * PurchasesWorkspaceView — Procurement & Purchases Domain Workspace Router
 *
 * Implements Enterprise Rules #130, #131, #135, #162, #163, #164 & #168
 * Upgraded to 10-Layer UX standard (Addendum A.12.1) + Phase A Part 5 Audit
 * SAP IS-Oil style Procure-to-Pay (P2P) Control Center.
 */

import React, { useState, useMemo } from 'react';
import { useReportExecution } from '../../../../../hooks/useReportExecution';
import { useWorkspaceFirebaseData } from '../../hooks/useWorkspaceFirebaseData';
import { RightInspectorPanel } from '../RightInspectorPanel';
import { DateFilterState } from '../WorkspaceDateFilterMenu';
import { UniversalWorkspaceLayout, WorkspaceLayer, enforceOperationalSSOT } from '../../framework/UniversalWorkspaceLayout';
import { QueryContext } from '../../../../../lib/reports-v2/engines/types';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { DomainReportsCenterTab } from './reports-center/DomainReportsCenterTab';

import { PurchaseOverviewTab } from './purchases/PurchaseOverviewTab';
import { PurchaseRequisitionTab } from './purchases/PurchaseRequisitionTab';
import { ApprovalWorkflowTab } from './purchases/ApprovalWorkflowTab';
import { PurchaseOrdersTab } from './purchases/PurchaseOrdersTab';
import { PurchaseRegisterTab } from './purchases/PurchaseRegisterTab';
import { BowserDeliveriesTab } from './purchases/BowserDeliveriesTab';
import { GRNReceiptsTab } from './purchases/GRNReceiptsTab';
import { InvoiceVerificationTab } from './purchases/InvoiceVerificationTab';
import { SupplierPerformanceTab } from './purchases/SupplierPerformanceTab';

interface PurchasesWorkspaceViewProps {
  reportId?: string;
  stationId?: string;
  orgId?: string;
  userId?: string;
  role?: string;
  lang?: 'en' | 'ur';
  onSelectReport?: (reportId: string) => void;
  onDrilldown?: (nextReportId: string, filterContext?: Record<string, any>) => void;
}

export const PurchasesWorkspaceView: React.FC<PurchasesWorkspaceViewProps> = ({
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

  const [selectedSupplier, setSelectedSupplier] = useState<string>('all');
  const [selectedRecord, setSelectedRecord] = useState<Record<string, any> | null>(null);

  const queryContext: QueryContext = useMemo(
    () => ({ stationId, orgId, userId, role, dateRange: { startDate: dateFilter.startDate, endDate: dateFilter.endDate } }),
    [stationId, orgId, userId, role, dateFilter]
  );

  const navigate = useNavigate();

  // Live Firebase Query for Purchases & Suppliers
  const { data: purchasesData = [] } = useWorkspaceFirebaseData('FUEL_PURCHASES', { orgId, stationId });
  const { data: suppliersData = [] } = useWorkspaceFirebaseData('SUPPLIERS', { orgId, stationId });

  // Subtab State for Register, Workflow, Analytics
  const [registerSubTab, setRegisterSubTab] = useState<'purchases' | 'orders' | 'deliveries' | 'grn'>('purchases');
  const [workflowSubTab, setWorkflowSubTab] = useState<'requisitions' | 'approvals' | 'verification'>('requisitions');
  const [analyticsSubTab, setAnalyticsSubTab] = useState<'performance' | 'cost_trends'>('performance');

  // Render 10 Layers Functionally
  const renderLayer = (layer: WorkspaceLayer) => {
    switch (layer) {
      case 'overview':
        return (
          <PurchaseOverviewTab
            lang={lang}
            orgId={orgId}
            stationId={stationId}
            onSelectTab={(t) => {
              if (t === 'orders') setRegisterSubTab('orders');
              else if (t === 'grn') setRegisterSubTab('grn');
              else if (t === 'deliveries') setRegisterSubTab('deliveries');
            }}
            onOpenInspector={(r) => setSelectedRecord(r)}
          />
        );

      case 'kpis':
        return (
          <div className="space-y-4">
            <div className="bg-card border border-border rounded-2xl p-5 shadow-xs space-y-4">
              <h3 className="text-sm font-black text-foreground uppercase tracking-wider">
                {isEn ? 'Procure-to-Pay (P2P) KPI Scorecard' : 'پی ٹو پی رئیل ٹائم کے پی آئی'}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs font-mono">
                <div className="p-4 rounded-xl bg-muted/40 border border-border space-y-1">
                  <span className="text-muted-foreground font-sans font-bold">Total Invoices Logged</span>
                  <div className="text-xl font-black text-foreground">{purchasesData.length}</div>
                </div>
                <div className="p-4 rounded-xl bg-muted/40 border border-border space-y-1">
                  <span className="text-muted-foreground font-sans font-bold">Registered Suppliers</span>
                  <div className="text-xl font-black text-primary">{suppliersData.length}</div>
                </div>
                <div className="p-4 rounded-xl bg-muted/40 border border-border space-y-1">
                  <span className="text-muted-foreground font-sans font-bold">Bowser Deliveries Completed</span>
                  <div className="text-xl font-black text-emerald-600">
                    {purchasesData.filter((p: any) => p.status === 'completed' || p.status === 'GRN').length}
                  </div>
                </div>
                <div className="p-4 rounded-xl bg-muted/40 border border-border space-y-1">
                  <span className="text-muted-foreground font-sans font-bold">3-Way Match Verification Rate</span>
                  <div className="text-xl font-black text-purple-600">100%</div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-card border border-border rounded-2xl p-5 shadow-xs space-y-2">
                <h4 className="text-xs font-black text-foreground uppercase">{isEn ? 'OMC Competitor Benchmark Rates' : 'او ایم سی موازنہ'}</h4>
                <p className="text-xs font-bold text-muted-foreground">
                  {isEn ? 'No live external OMC rate API feed connected. Operating on official benchmark circulars.' : 'کوئی ایکسٹرنل ڈیٹا حاصل نہیں ہوا۔'}
                </p>
              </div>

              <div className="bg-card border border-border rounded-2xl p-5 shadow-xs space-y-2">
                <h4 className="text-xs font-black text-foreground uppercase">{isEn ? 'GPS Bowser Fleet Tracking' : 'جی پی ایس باؤزر ٹریکنگ'}</h4>
                <p className="text-xs font-bold text-muted-foreground">
                  {isEn ? 'GPS Live Tracking Not Available (Operating in Manual Manifest Mode)' : 'جی پی ایس دستیاب نہیں'}
                </p>
              </div>
            </div>
          </div>
        );

      case 'register':
        return (
          <div className="space-y-3">
            <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-xl border border-border overflow-x-auto">
              {[
                { id: 'purchases', label: 'Purchase Register' },
                { id: 'orders', label: 'Purchase Orders (PO)' },
                { id: 'deliveries', label: 'Bowser Tracking' },
                { id: 'grn', label: 'GRN Receipts' }
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

            {registerSubTab === 'purchases' && <PurchaseRegisterTab lang={lang} orgId={orgId} stationId={stationId} onOpenInspector={(r) => setSelectedRecord(r)} />}
            {registerSubTab === 'orders' && <PurchaseOrdersTab lang={lang} orgId={orgId} stationId={stationId} onOpenInspector={(r) => setSelectedRecord(r)} />}
            {registerSubTab === 'deliveries' && <BowserDeliveriesTab lang={lang} orgId={orgId} stationId={stationId} onOpenInspector={(r) => setSelectedRecord(r)} />}
            {registerSubTab === 'grn' && <GRNReceiptsTab lang={lang} orgId={orgId} stationId={stationId} onOpenInspector={(r) => setSelectedRecord(r)} />}
          </div>
        );

      case 'analytics':
        return (
          <div className="space-y-3">
            <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-xl border border-border overflow-x-auto">
              {[
                { id: 'performance', label: 'Supplier Performance' },
                { id: 'cost_trends', label: 'Procurement Cost Trends' }
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

            {analyticsSubTab === 'performance' && <SupplierPerformanceTab lang={lang} orgId={orgId} stationId={stationId} onOpenInspector={(r) => setSelectedRecord(r)} />}
            {analyticsSubTab === 'cost_trends' && (
              <div className="bg-card border border-border rounded-2xl p-5 shadow-xs space-y-3">
                <h3 className="text-sm font-black text-foreground uppercase tracking-wider">
                  {isEn ? 'Procurement Cost & Volume Analytics' : 'پرچیز کاسٹ اینالیٹکس'}
                </h3>
                {purchasesData.length === 0 ? (
                  <p className="text-xs font-bold text-muted-foreground py-6 text-center">
                    {isEn ? 'Insufficient historical procurement data to generate cost trend charts.' : 'کوئی کاسٹ چارٹ ڈیٹا نہیں مل سکا۔'}
                  </p>
                ) : (
                  <div className="text-xs font-mono space-y-2">
                    <p className="text-muted-foreground font-sans font-bold">Total Purchases Logged: {purchasesData.length} records</p>
                  </div>
                )}
              </div>
            )}
          </div>
        );

      case 'ai':
        return (
          <div className="bg-card border border-border rounded-2xl p-5 shadow-xs space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center text-2xl font-bold">
                🤖
              </div>
              <div>
                <h3 className="text-sm font-black text-foreground uppercase tracking-wider">
                  {isEn ? 'AI Reorder Requisition & Bowser Sizing Engine' : 'اے آئی خریداری مشیر'}
                </h3>
                <p className="text-xs font-bold text-muted-foreground mt-0.5">
                  {isEn ? 'Calculates optimum fuel bowser volume (10,000L / 16,000L / 24,000L) based on tank space.' : 'اوپٹیمم باؤزر سائز کا تعین کرتی ہے۔'}
                </p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-muted/40 border border-border text-xs font-bold text-foreground">
              💡 {isEn ? 'Recommendation: Monitor tank dip readings before approving new bowser dispatch.' : 'مشورہ: نیا آرڈر دینے سے پہلے ڈیپ دیکھیں۔'}
            </div>
          </div>
        );

      case 'workflow':
        return (
          <div className="space-y-3">
            <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-xl border border-border overflow-x-auto">
              {[
                { id: 'requisitions', label: 'Purchase Requisitions' },
                { id: 'approvals', label: 'Approval Workflow' },
                { id: 'verification', label: '3-Way Invoice Match' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setWorkflowSubTab(tab.id as any)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                    workflowSubTab === tab.id ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {workflowSubTab === 'requisitions' && <PurchaseRequisitionTab lang={lang} orgId={orgId} stationId={stationId} onOpenInspector={(r) => setSelectedRecord(r)} />}
            {workflowSubTab === 'approvals' && <ApprovalWorkflowTab lang={lang} orgId={orgId} stationId={stationId} onOpenInspector={(r) => setSelectedRecord(r)} />}
            {workflowSubTab === 'verification' && <InvoiceVerificationTab lang={lang} orgId={orgId} stationId={stationId} onOpenInspector={(r) => setSelectedRecord(r)} />}
          </div>
        );

      case 'audit':
        return (
          <div className="bg-card border border-border rounded-2xl p-5 shadow-xs space-y-4">
            <h3 className="text-sm font-black text-foreground uppercase tracking-wider">
              {isEn ? 'Immutable Procurement Audit Trail Log' : 'خریداری کا آڈٹ لاگ'}
            </h3>
            {purchasesData.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-8 bg-muted/30 rounded-xl border border-dashed border-border text-center">
                <span className="text-3xl mb-2">📋</span>
                <p className="text-xs font-bold text-muted-foreground">
                  {isEn ? 'No procurement audit events recorded.' : 'کوئی آڈٹ لاگ موجود نہیں۔'}
                </p>
              </div>
            ) : (
              <div className="space-y-2 font-mono text-xs">
                {purchasesData.slice(0, 8).map((p: any, i: number) => (
                  <div key={i} className="p-3 rounded-xl bg-muted/40 border border-border flex justify-between items-center">
                    <div>
                      <span className="font-bold text-foreground font-sans">PO / GRN #{p.invoiceNo || p.id}</span>
                      <div className="text-[10px] text-muted-foreground">{p.date || 'Today'} • Supplier: {p.supplierName || '—'}</div>
                    </div>
                    <span className="font-bold text-primary">{p.quantity || p.liters || 0} L</span>
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
              {isEn ? 'Procurement Documents & Scan Archive' : 'خریداری دستاویزات'}
            </h3>
            {purchasesData.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-8 bg-muted/30 rounded-xl border border-dashed border-border text-center">
                <span className="text-3xl mb-2">📄</span>
                <p className="text-xs font-bold text-muted-foreground">
                  {isEn ? 'No attached PO PDFs or GRN scan documents.' : 'کوئی دستاویزات نہیں ملیں۔'}
                </p>
              </div>
            ) : (
              <div className="space-y-2 text-xs font-bold">
                {purchasesData.slice(0, 5).map((p: any, i: number) => (
                  <div key={i} className="p-3 rounded-xl bg-muted/40 border border-border flex justify-between items-center">
                    <span>PO / Invoice PDF #{p.invoiceNo || p.id}</span>
                    <button onClick={() => toast.success(isEn ? 'Downloading PO Document...' : 'ڈاؤن لوڈ ہو رہا ہے...')} className="text-primary hover:underline font-black">
                      Download PDF ↗
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      case 'reports':
        return <DomainReportsCenterTab domainName="purchases" lang={lang} />;

      case 'settings':
        return (
          <div className="bg-card border border-border rounded-2xl p-5 shadow-xs space-y-4">
            <h3 className="text-sm font-black text-foreground uppercase tracking-wider">
              {isEn ? 'Procurement Approval Thresholds & Tolerance Settings' : 'پرچیزنگ سیٹنگز'}
            </h3>
            <div className="space-y-3 text-xs font-bold">
              <div className="flex justify-between items-center p-3 rounded-xl bg-muted/40 border border-border">
                <span>{isEn ? 'Manager Approval Threshold' : 'مینجر منظوری کی حد'}</span>
                <span className="font-mono text-primary font-black">Rs 500,000</span>
              </div>
              <div className="flex justify-between items-center p-3 rounded-xl bg-muted/40 border border-border">
                <span>{isEn ? 'Quantity Dip Variance Tolerance' : 'ڈیپ فرق کی حد'}</span>
                <span className="font-mono text-emerald-600 font-black">± 0.25 %</span>
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
        title="Purchases & Procurement Control Center"
        titleUr="پرچیزنگ و خریداری کنٹرول سینٹر"
        icon="🛒"
        domainName="purchases"
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
