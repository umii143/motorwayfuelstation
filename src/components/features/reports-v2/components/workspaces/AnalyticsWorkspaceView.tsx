/**
 * @license SPDX-License-Identifier: Apache-2.0
 *
 * FuelPro Enterprise Business Operating System v4.0
 * AnalyticsWorkspaceView — 10/10 Executive Cockpit & AI Intelligence Center
 *
 * Implements Enterprise Rule #175 — Analytics Domain Isolation
 * Upgraded to 10-Layer UX standard (Addendum A.12.1) + Phase A Audit 
 */

import React, { useState } from 'react';
import { UniversalWorkspaceLayout, WorkspaceLayer } from '../../framework/UniversalWorkspaceLayout';
import { DateFilterState } from '../WorkspaceDateFilterMenu';
import { useInventoryStore } from '../../../../../stores/useInventoryStore';
import { useCustomerStore } from '../../../../../stores/useCustomerStore';
import { useSupplierStore } from '../../../../../stores/useSupplierStore';
import { useFinancialStore } from '../../../../../stores/useFinancialStore';
import { useStaffStore } from '../../../../../stores/useStaffStore';
import { usePricingStore } from '../../../../../stores/usePricingStore';
import { useShiftStore } from '../../../../../stores/useShiftStore';
import { useAnalyticsComputeEngine } from '../../../../../hooks/useAnalyticsComputeEngine';
import toast from 'react-hot-toast';

// Sub-Modules
import { OverviewAnalyticsTab } from './analytics/OverviewAnalyticsTab';
import { ExecutiveDashboardTab } from './analytics/ExecutiveDashboardTab';
import { SalesAnalyticsTab } from './analytics/SalesAnalyticsTab';
import { FinancialAnalyticsTab } from './analytics/FinancialAnalyticsTab';
import { InventoryAnalyticsTab } from './analytics/InventoryAnalyticsTab';
import { PurchaseAnalyticsTab } from './analytics/PurchaseAnalyticsTab';
import { PricingAnalyticsTab } from './analytics/PricingAnalyticsTab';
import { CustomerAnalyticsTab } from './analytics/CustomerAnalyticsTab';
import { SupplierAnalyticsTab } from './analytics/SupplierAnalyticsTab';
import { StaffAnalyticsTab } from './analytics/StaffAnalyticsTab';
import { ProfitabilityAnalyticsTab } from './analytics/ProfitabilityAnalyticsTab';
import { ForecastAIAnalyticsTab } from './analytics/ForecastAIAnalyticsTab';
import { KPIScorecardsAnalyticsTab } from './analytics/KPIScorecardsAnalyticsTab';
import { DomainReportsCenterTab } from './reports-center/DomainReportsCenterTab';
import { AuditAnalyticsTab } from './analytics/AuditAnalyticsTab';

interface AnalyticsWorkspaceViewProps {
  reportId?: string;
  stationId?: string;
  orgId?: string;
  userId?: string;
  role?: string;
  lang?: 'en' | 'ur';
  onSelectReport?: (reportId: string) => void;
  onDrilldown?: (nextReportId: string, filterContext?: Record<string, any>) => void;
}

export const AnalyticsWorkspaceView: React.FC<AnalyticsWorkspaceViewProps> = ({
  lang = 'en',
  onSelectReport,
  onDrilldown
}) => {
  const isEn = lang === 'en';

  const [dateFilter, setDateFilter] = useState<DateFilterState>({
    preset: 'today',
    startDate: '2025-05-15',
    endDate: '2025-05-15',
    label: 'May 15, 2025',
  });

  const [selectedBranch, setSelectedBranch] = useState('all');

  // Live Firestore Store State Access
  const products = useInventoryStore((state) => state.products || []);
  const tanks = useInventoryStore((state) => state.tanks || []);
  const customers = useCustomerStore((state) => state.customers || []);
  const suppliers = useSupplierStore((state) => state.suppliers || []);
  const banks = useFinancialStore((state) => state.banks || []);
  const digitalAccounts = useFinancialStore((state) => state.digitalAccounts || []);
  const standaloneExpenses = useFinancialStore((state) => state.standaloneExpenses || []);
  const staff = useStaffStore((state) => state.staff || []);
  const auditLogs = usePricingStore((state) => state.auditLogs || []);
  const shifts = useShiftStore((state) => state.shifts || []);

  const {
    kpiMetrics: metrics,
    branches,
    pumps,
    tankTelemetry,
    abcAnalysis,
    alerts,
    resolveAiQuery
  } = useAnalyticsComputeEngine(
    shifts, tanks, products, customers, suppliers, banks, digitalAccounts, standaloneExpenses, staff, auditLogs, selectedBranch
  );

  // Sub-Navigation States
  const [overviewSubTab, setOverviewSubTab] = useState<'overview' | 'executive'>('overview');
  const [kpiSubTab, setKpiSubTab] = useState<'scorecard' | 'profitability'>('scorecard');
  const [analyticsSubTab, setAnalyticsSubTab] = useState<'sales' | 'finance' | 'inventory' | 'purchases' | 'pricing' | 'customers' | 'suppliers' | 'staff'>('sales');

  const renderEmptyState = (messageEn: string, messageUr: string) => (
    <div className="flex flex-col items-center justify-center p-12 bg-card rounded-2xl border border-dashed border-border">
      <span className="text-4xl mb-4">🚧</span>
      <h3 className="text-lg font-black text-foreground">
        {isEn ? 'Under Construction' : 'زیر تعمیر'}
      </h3>
      <p className="text-sm font-bold text-muted-foreground max-w-md text-center mt-2">
        {isEn ? messageEn : messageUr}
      </p>
    </div>
  );

  const renderOverviewLayer = () => (
    <div className="space-y-3">
      <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-xl border border-border overflow-x-auto">
        {[
          { id: 'overview', label: 'Overview Summary' },
          { id: 'executive', label: 'Executive Dashboard' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setOverviewSubTab(tab.id as any)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
              overviewSubTab === tab.id ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
      {overviewSubTab === 'overview' && <OverviewAnalyticsTab metrics={metrics} alerts={alerts} lang={lang} onDrilldown={onDrilldown} />}
      {overviewSubTab === 'executive' && <ExecutiveDashboardTab branches={branches} pumps={pumps} tankTelemetry={tankTelemetry} lang={lang} />}
    </div>
  );

  const renderKpiLayer = () => (
    <div className="space-y-3">
      <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-xl border border-border overflow-x-auto">
        {[
          { id: 'scorecard', label: 'KPI Scorecards' },
          { id: 'profitability', label: 'Profitability Analysis' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setKpiSubTab(tab.id as any)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
              kpiSubTab === tab.id ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
      {kpiSubTab === 'scorecard' && <KPIScorecardsAnalyticsTab metrics={metrics} lang={lang} />}
      {kpiSubTab === 'profitability' && <ProfitabilityAnalyticsTab metrics={metrics} lang={lang} />}
    </div>
  );

  const renderAnalyticsLayer = () => (
    <div className="space-y-3">
      <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-xl border border-border overflow-x-auto">
        {[
          { id: 'sales', label: 'Sales' },
          { id: 'finance', label: 'Financial' },
          { id: 'inventory', label: 'Inventory' },
          { id: 'purchases', label: 'Purchases' },
          { id: 'pricing', label: 'Pricing' },
          { id: 'customers', label: 'Customers' },
          { id: 'suppliers', label: 'Suppliers' },
          { id: 'staff', label: 'Staff' }
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
      {analyticsSubTab === 'sales' && <SalesAnalyticsTab metrics={metrics} pumps={pumps} lang={lang} />}
      {analyticsSubTab === 'finance' && <FinancialAnalyticsTab metrics={metrics} lang={lang} />}
      {analyticsSubTab === 'inventory' && <InventoryAnalyticsTab tankTelemetry={tankTelemetry} abcAnalysis={abcAnalysis} metrics={metrics} lang={lang} />}
      {analyticsSubTab === 'purchases' && <PurchaseAnalyticsTab metrics={metrics} lang={lang} />}
      {analyticsSubTab === 'pricing' && <PricingAnalyticsTab metrics={metrics} lang={lang} />}
      {analyticsSubTab === 'customers' && <CustomerAnalyticsTab metrics={metrics} lang={lang} />}
      {analyticsSubTab === 'suppliers' && <SupplierAnalyticsTab metrics={metrics} lang={lang} />}
      {analyticsSubTab === 'staff' && <StaffAnalyticsTab branches={branches} lang={lang} />}
    </div>
  );

  const renderLayer = (layer: WorkspaceLayer) => {
    switch (layer) {
      case 'overview':
        return renderOverviewLayer();
      case 'kpis':
        return renderKpiLayer();
      case 'analytics':
        return renderAnalyticsLayer();
      case 'ai':
        return <ForecastAIAnalyticsTab metrics={metrics} resolveAiQuery={resolveAiQuery} lang={lang} />;
      case 'audit':
        return <AuditAnalyticsTab auditLogs={auditLogs} lang={lang} />;
      case 'reports':
        return <DomainReportsCenterTab domainName="analytics" lang={lang} />;
      case 'register':
        return renderEmptyState(
          'Executive Analytics Workspace does not contain operational registers. Navigate to Fuel Operations or Inventory domains to view registers.',
          'یہ ایگزیکٹو ڈیش بورڈ ہے۔ براہ کرم رجسٹرز دیکھنے کیلئے فیول یا انوینٹری ڈومین میں جائیں۔'
        );
      case 'workflow':
        return renderEmptyState(
          'Workflow & Approvals are managed at the operational domain level.',
          'ورک فلو اور منظوری آپریشنل سطح پر موجود ہیں۔'
        );
      case 'documents':
      case 'settings':
        return renderEmptyState('This section is reserved for future executive configuration.', 'یہ سیکشن مستقبل کی ترتیبات کیلئے مخصوص ہے۔');
      default:
        return null;
    }
  };

  return (
    <UniversalWorkspaceLayout
      lang={lang}
      title="Executive Analytics Cockpit"
      titleUr="ایگزیکٹو اینالیٹکس کنٹرول سینٹر"
      icon="📊"
      domainName="analytics"
      dateFilter={dateFilter}
      onDateFilterChange={setDateFilter}
      renderLayer={renderLayer}
      onNavigateRelated={onSelectReport}
    />
  );
};
