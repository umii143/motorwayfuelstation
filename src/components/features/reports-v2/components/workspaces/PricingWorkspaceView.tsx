/**
 * @license SPDX-License-Identifier: Apache-2.0
 *
 * FuelPro Enterprise Business Operating System v4.0
 * PricingWorkspaceView — Dedicated Enterprise Pricing & OMC Control Center
 *
 * Implements Rule #172 (Strict Pricing Domain Isolation) & Rule #173 (Pricing Simulation Engine)
 * Upgraded to 10-Layer UX standard (Addendum A.12.1) + Phase A Part 2 Audit
 */

import React, { useState, useMemo, useEffect } from 'react';
import { UniversalWorkspaceLayout, WorkspaceLayer } from '../../framework/UniversalWorkspaceLayout';
import { DateFilterState } from '../WorkspaceDateFilterMenu';
import { useInventoryStore } from '../../../../../stores/useInventoryStore';
import { usePricingStore } from '../../../../../stores/usePricingStore';
import { pricingSimulationEngine, PricingSimulationResult } from '../../../../../services/priceManagement/pricingSimulationEngine';
import { omcRateMatrixEngine } from '../../../../../services/priceManagement/omcRateMatrixEngine';
import { versionHistoryEngine } from '../../../../../services/priceManagement/versionHistoryEngine';
import toast from 'react-hot-toast';
import { formatCurrency } from '../../../../../lib/currency';
import { useShallow } from 'zustand/react/shallow';
import { DomainReportsCenterTab } from './reports-center/DomainReportsCenterTab';

// Sub-components
import { PakistanOMCControlPanel } from '../../../PriceManagement/components/PakistanOMCControlPanel';
import { InventoryRevaluationTab } from '../../../PriceManagement/components/InventoryRevaluationTab';
import { VersionHistoryTab } from '../../../PriceManagement/components/VersionHistoryTab';
import { PriceApprovalWorkflowTab } from '../../../PriceManagement/components/PriceApprovalWorkflowTab';
import { OGRANotificationCenterTab } from '../../../PriceManagement/components/OGRANotificationCenterTab';
import { TaxLevyBreakdownWidget } from '../../../PriceManagement/components/TaxLevyBreakdownWidget';
import { PumpControllerSyncStatusWidget } from '../../../PriceManagement/components/PumpControllerSyncStatusWidget';
import { DiscountReportsTab } from './pricing/DiscountReportsTab';

// Modals
import { UpdatePriceModal } from '../../../PriceManagement/modals/UpdatePriceModal';
import { PricingSimulationModal } from '../../../PriceManagement/components/PricingSimulationModal';

interface PricingWorkspaceViewProps {
  reportId?: string;
  stationId?: string;
  orgId?: string;
  userId?: string;
  role?: string;
  lang?: 'en' | 'ur';
  onSelectReport?: (reportId: string) => void;
  onDrilldown?: (nextReportId: string, filterContext?: Record<string, any>) => void;
}

export const PricingWorkspaceView: React.FC<PricingWorkspaceViewProps> = ({
  stationId = 'st_default',
  orgId = 'org_main',
  lang = 'en',
  onSelectReport,
  onDrilldown
}) => {
  const isEn = lang === 'en';
  const isUrdu = lang === 'ur';
  const t = (en: string, ur: string) => (isUrdu ? ur : en);

  const [dateFilter, setDateFilter] = useState<DateFilterState>({
    preset: 'today',
    startDate: '2025-05-15',
    endDate: '2025-05-15',
    label: 'May 15, 2025',
  });

  const { tanks, products, rateHistory } = useInventoryStore(useShallow(state => ({
    tanks: state.tanks || [],
    products: state.products || [],
    rateHistory: state.rateHistory || []
  })));

  const pricingStore = usePricingStore();

  useEffect(() => {
    const unsub = pricingStore.initRealtimeListeners(orgId, stationId);
    return () => unsub();
  }, [stationId, orgId]);

  const fuelProducts = useMemo(() => products.filter(p => p.type === 'fuel'), [products]);
  const petrolProd = fuelProducts.find(p => p.name.toLowerCase().includes('petrol')) || fuelProducts[0];
  const dieselProd = fuelProducts.find(p => p.name.toLowerCase().includes('diesel')) || fuelProducts[1];

  const petrolRate = petrolProd?.rate || 0;
  const dieselRate = dieselProd?.rate || 0;

  const omcRates = useMemo(() => omcRateMatrixEngine.getOMCComparison(petrolRate, dieselRate), [petrolRate, dieselRate]);
  const versionList = useMemo(() => versionHistoryEngine.getVersions(rateHistory), [rateHistory]);

  const [registerSubTab, setRegisterSubTab] = useState<'price_board' | 'price_history' | 'scheduled_updates' | 'discounts'>('price_board');
  const [workflowSubTab, setWorkflowSubTab] = useState<'price_approval' | 'price_notifications' | 'version_history'>('price_approval');
  const [analyticsSubTab, setAnalyticsSubTab] = useState<'inventory_revaluation' | 'omc_matrix'>('inventory_revaluation');

  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [isSimulationOpen, setIsSimulationOpen] = useState(false);
  const [simulationResult, setSimulationResult] = useState<PricingSimulationResult | null>(null);
  const [activeProposalId, setActiveProposalId] = useState<string | null>(null);

  const handleOpenSimulation = (proposedRate: number, priceId?: string) => {
    if (petrolProd) {
      const res = pricingSimulationEngine.simulatePriceRevision(petrolProd, proposedRate, tanks);
      setSimulationResult(res);
      setActiveProposalId(priceId || null);
      setIsSimulationOpen(true);
    } else {
      toast.error('No products configured for simulation.');
    }
  };

  const handleConfirmPublish = async () => {
    setIsSimulationOpen(false);
    if (activeProposalId) {
      await pricingStore.publishRevision(activeProposalId, 'Station Owner');
    }
    toast.success(t('Rate published live to all Pumps, POS Terminals & Price Boards!', 'نیا ریٹ تمام پمپوں پر لائیو پبلش ہو چکا ہے!'));
  };

  const handleSubmitProposal = async (
    productId: string,
    productName: string,
    oldPrice: number,
    newPrice: number,
    effectiveDate: string,
    effectiveTime: string,
    reason: string
  ) => {
    await pricingStore.createDraftProposal(
      productId,
      productName,
      oldPrice,
      newPrice,
      effectiveDate,
      effectiveTime,
      reason,
      'Zahid Manager'
    );
    toast.success(t('Price proposal submitted for approval successfully!', 'قیمت کی تجویز کامیابی سے جمع کر دی گئی ہے!'));
  };

  const renderEmptyState = (messageEn: string, messageUr: string) => (
    <div className="flex flex-col items-center justify-center p-12 bg-card rounded-2xl border border-dashed border-border">
      <span className="text-4xl mb-4">📭</span>
      <h3 className="text-lg font-black text-foreground">
        {isEn ? 'No Data Available' : 'کوئی ڈیٹا موجود نہیں'}
      </h3>
      <p className="text-sm font-bold text-muted-foreground max-w-md text-center mt-2">
        {isEn ? messageEn : messageUr}
      </p>
    </div>
  );

  const renderOverviewLayer = () => {
    if (!petrolProd && !dieselProd) {
      return renderEmptyState('No fuel products configured to display overview.', 'اوور ویو دکھانے کیلئے کوئی فیول پروڈکٹ موجود نہیں۔');
    }
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <TaxLevyBreakdownWidget isUrdu={isUrdu} petrolPrice={petrolRate} dieselPrice={dieselRate} />
          <PumpControllerSyncStatusWidget isUrdu={isUrdu} petrolRate={petrolRate} dieselRate={dieselRate} />
        </div>
      </div>
    );
  };

  const renderRegisterLayer = () => (
    <div className="space-y-3">
      <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-xl border border-border overflow-x-auto">
        {[
          { id: 'price_board', label: 'Official Price Board' },
          { id: 'price_history', label: 'Price History Log' },
          { id: 'scheduled_updates', label: 'Scheduled Updates' },
          { id: 'discounts', label: '🏷️ Discount Reports (SSOT)' }
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
      {registerSubTab === 'price_board' && (
        <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
          {fuelProducts.length === 0 ? (
            renderEmptyState('No active fuel products found.', 'کوئی فعال فیول پروڈکٹ نہیں ملی۔')
          ) : (
            <div className="overflow-x-auto rounded-xl border border-border">
              <table className="w-full text-left text-xs">
                <thead className="bg-muted text-muted-foreground font-semibold uppercase text-[10px]">
                  <tr>
                    <th className="p-3">Product</th>
                    <th className="p-3 text-right">Retail Selling Rate</th>
                    <th className="p-3 text-right">Purchase Cost</th>
                    <th className="p-3 text-right">Dealer Margin</th>
                    <th className="p-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border font-mono text-foreground">
                  {fuelProducts.map((p) => {
                    const margin = (p.rate || 0) - (p.purchasePrice || 0);
                    return (
                      <tr key={p.id} className="hover:bg-muted/50 transition-colors">
                        <td className="p-3 font-bold text-foreground font-sans">{p.name}</td>
                        <td className="p-3 text-right text-emerald-600 dark:text-emerald-400 font-bold text-sm">{formatCurrency(p.rate || 0)}</td>
                        <td className="p-3 text-right text-muted-foreground">{p.purchasePrice ? formatCurrency(p.purchasePrice) : 'N/A'}</td>
                        <td className="p-3 text-right text-amber-600 dark:text-amber-400 font-bold">{p.purchasePrice ? `Rs ${margin.toFixed(2)}/L` : 'N/A'}</td>
                        <td className="p-3 text-center">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">Active</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
      {registerSubTab === 'price_history' && (
        <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
          {pricingStore.fuelPrices.length === 0 ? (
            renderEmptyState('No historical price revisions found.', 'پرائس ہسٹری کا کوئی ریکارڈ موجود نہیں۔')
          ) : (
            <div className="space-y-3 font-mono text-xs">
              {pricingStore.fuelPrices.map((rh: any, idx: number) => (
                <div key={rh.id || idx} className="bg-muted/30 p-3 rounded-xl border border-border flex justify-between items-center">
                  <div>
                    <div className="font-bold text-foreground font-sans">{rh.productName || 'Unknown Product'}</div>
                    <div className="text-[10px] text-muted-foreground">{rh.effectiveDate || rh.date || 'N/A'}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-emerald-600 dark:text-emerald-400 font-bold">New: {formatCurrency(rh.newPrice || rh.newRate || 0)}</div>
                    <div className="text-muted-foreground text-[10px]">Old: {formatCurrency(rh.oldPrice || rh.oldRate || 0)}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      {registerSubTab === 'scheduled_updates' && (
        renderEmptyState('No upcoming scheduled price changes.', 'آنے والی کوئی طے شدہ پرائس اپ ڈیٹ نہیں ہے۔')
      )}
      {registerSubTab === 'discounts' && <DiscountReportsTab lang={lang} onOpenInspector={(rec) => toast.success(`Inspecting discount entry #${rec.id}`)} />}
    </div>
  );

  const renderWorkflowLayer = () => (
    <div className="space-y-3">
      <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-xl border border-border overflow-x-auto">
        {[
          { id: 'price_approval', label: 'Approval Workflow' },
          { id: 'price_notifications', label: 'OGRA Circulars' },
          { id: 'version_history', label: 'Version Rollback' }
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
      {workflowSubTab === 'price_approval' && <PriceApprovalWorkflowTab isUrdu={isUrdu} onApprove={() => toast.success('OGRA Rate proposal approved.')} />}
      {workflowSubTab === 'price_notifications' && <OGRANotificationCenterTab isUrdu={isUrdu} onApproveNotification={() => toast.success('Circular acknowledged.')} />}
      {workflowSubTab === 'version_history' && (
        <VersionHistoryTab
          isUrdu={isUrdu}
          versions={versionList}
          onRollback={(v) => {
            if (!petrolProd) return;
            const mockRecord = {
              id: 'rollback_target',
              productId: petrolProd.id,
              productName: v.productRates[0].productName,
              currentPrice: petrolRate,
              oldPrice: v.productRates[0].oldPrice,
              newPrice: v.productRates[0].newPrice,
              effectiveDate: new Date().toISOString(),
              effectiveTime: '00:00',
              status: 'published' as const,
              version: v.versionNumber,
              dealerMargin: 0
            };
            pricingStore.rollbackVersion(mockRecord, 'Station Owner');
            toast.success(t(`Rolled back to Version ${v.versionNumber} successfully!`, 'ورژن باکامیابی بحال ہو گیا ہے!'));
          }}
        />
      )}
    </div>
  );

  const renderAnalyticsLayer = () => (
    <div className="space-y-3">
      <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-xl border border-border overflow-x-auto">
        {[
          { id: 'inventory_revaluation', label: 'Inventory Revaluation' },
          { id: 'omc_matrix', label: 'OMC Rate Comparison' }
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
      {analyticsSubTab === 'inventory_revaluation' && <InventoryRevaluationTab isUrdu={isUrdu} products={products} tanks={tanks} />}
      {analyticsSubTab === 'omc_matrix' && (
        omcRates.length > 0 
          ? <PakistanOMCControlPanel isUrdu={isUrdu} omcRates={omcRates} onPublishRates={() => toast.success('Syncing with OMC...')} /> 
          : renderEmptyState('No OMC comparison data currently available.', 'کوئی کمپیٹیٹر ریٹس موجود نہیں۔')
      )}
    </div>
  );

  const renderAuditLayer = () => (
    <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
      {pricingStore.auditLogs.length === 0 ? (
        renderEmptyState('No audit logs recorded for pricing.', 'پرائسنگ کا کوئی آڈٹ لاگ موجود نہیں۔')
      ) : (
        <div className="space-y-3 font-mono text-xs">
          {pricingStore.auditLogs.map((log) => (
            <div key={log.id} className="bg-muted/30 p-3 rounded-xl border border-border">
              <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
                <span className="font-bold text-amber-600 dark:text-cyan-400">{log.actionType}</span>
                <span>{new Date(log.timestamp).toLocaleString()}</span>
              </div>
              <p className="text-foreground">{log.details}</p>
              <div className="text-[10px] text-muted-foreground mt-1">User: {log.userName} ({log.userRole})</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderLayer = (layer: WorkspaceLayer) => {
    switch (layer) {
      case 'overview':
        return renderOverviewLayer();
      case 'register':
        return renderRegisterLayer();
      case 'workflow':
        return renderWorkflowLayer();
      case 'analytics':
        return renderAnalyticsLayer();
      case 'audit':
        return renderAuditLayer();
      case 'reports':
        return <DomainReportsCenterTab domainName="pricing" lang={lang} />;
      case 'kpis':
      case 'ai':
      case 'documents':
      case 'settings':
        return renderEmptyState(
          'Module not yet active for the Pricing domain.',
          'اس ڈومین کیلئے یہ ماڈیول فعال نہیں۔'
        );
      default:
        return null;
    }
  };

  return (
    <>
      <UniversalWorkspaceLayout
        lang={lang}
        title="Pricing & OMC Control Center"
        titleUr="انٹرپرائز پرائسنگ کنٹرول سینٹر"
        icon="🏷️"
        domainName="pricing"
        dateFilter={dateFilter}
        onDateFilterChange={setDateFilter}
        renderLayer={renderLayer}
        onNavigateRelated={onSelectReport}
      />
      <UpdatePriceModal
        isOpen={isUpdateModalOpen}
        isUrdu={isUrdu}
        products={products}
        onClose={() => setIsUpdateModalOpen(false)}
        onSubmitProposal={handleSubmitProposal}
      />
      <PricingSimulationModal
        isOpen={isSimulationOpen}
        simulation={simulationResult}
        isUrdu={isUrdu}
        onClose={() => setIsSimulationOpen(false)}
        onConfirmPublish={handleConfirmPublish}
      />
    </>
  );
};
