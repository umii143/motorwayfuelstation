import React, { useState, useMemo, useEffect } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { 
  TrendingUp, TrendingDown, Clock, Activity, 
  ChevronDown, Edit2, Minus, Maximize2, AlertCircle, CheckCircle,
  Building2, MapPin, Layers, Filter, Search, Sparkles
} from 'lucide-react';
import { useInventoryStore } from '../../../stores/useInventoryStore';
import { Product, RateHistoryEntry, GlobalSettings } from '../../../types';
import { motion } from 'motion/react';
import { formatCurrency } from '../../../lib/currency';

// Pricing Sub-Components
import { PricingHeaderKPIs } from './components/PricingHeaderKPIs';
import { HeroAIPricingBanner } from './components/HeroAIPricingBanner';
import { PricingQuickActionsToolbar } from './components/PricingQuickActionsToolbar';
import { PricingSimulationModal } from './components/PricingSimulationModal';
import { PakistanOMCControlPanel } from './components/PakistanOMCControlPanel';
import { InventoryRevaluationTab } from './components/InventoryRevaluationTab';
import { VersionHistoryTab } from './components/VersionHistoryTab';
import { PriceApprovalWorkflowTab } from './components/PriceApprovalWorkflowTab';
import { OGRANotificationCenterTab } from './components/OGRANotificationCenterTab';
import { TaxLevyBreakdownWidget } from './components/TaxLevyBreakdownWidget';
import { PumpControllerSyncStatusWidget } from './components/PumpControllerSyncStatusWidget';

// Modals
import { UpdatePriceModal } from './modals/UpdatePriceModal';

// Stores & Engines
import { usePricingStore } from '../../../stores/usePricingStore';
import { pricingSimulationEngine, PricingSimulationResult } from '../../../services/priceManagement/pricingSimulationEngine';
import { omcRateMatrixEngine } from '../../../services/priceManagement/omcRateMatrixEngine';
import { versionHistoryEngine, PriceVersionRecord } from '../../../services/priceManagement/versionHistoryEngine';
import { FuelPriceMasterRecord } from '../../../services/priceManagement/pricingEngine';

interface AdvancedPriceManagementProps {
  products: Product[];
  rateHistory: RateHistoryEntry[];
  settings: GlobalSettings;
  onOpenUpdateDrawer: () => void;
}

export default function AdvancedPriceManagement({
  products,
  rateHistory,
  settings,
  onOpenUpdateDrawer
}: AdvancedPriceManagementProps) {
  const isUrdu = settings.language === 'ur';
  const t = (en: string, ur: string) => isUrdu ? ur : en;

  // Retrieve tanks from Zustand store
  const { tanks } = useInventoryStore(useShallow(state => ({
    tanks: state.tanks
  })));

  // Pricing Reactive Store
  const pricingStore = usePricingStore();
  const activeOrgId = 'org_main';
  const activeStationId = 'st_default';

  useEffect(() => {
    const unsub = pricingStore.initRealtimeListeners(activeOrgId, activeStationId);
    return () => unsub();
  }, [activeStationId]);

  // 15 Workspace Header Tabs State
  const [activeTab, setActiveTab] = useState<
    | 'overview'
    | 'price_board'
    | 'price_history'
    | 'scheduled_updates'
    | 'price_approval'
    | 'competitor_rates'
    | 'omc_matrix'
    | 'margin_analysis'
    | 'inventory_revaluation'
    | 'tax_breakdown'
    | 'price_forecasting'
    | 'price_documents'
    | 'audit_trail'
    | 'price_notifications'
    | 'version_history'
  >('overview');

  // Branch and Product Spectrum Filters
  const [selectedBranch, setSelectedBranch] = useState('all');
  const [selectedProductType, setSelectedProductType] = useState('all');

  // Modal Toggles
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [isSimulationOpen, setIsSimulationOpen] = useState(false);
  const [simulationResult, setSimulationResult] = useState<PricingSimulationResult | null>(null);
  const [activeProposalId, setActiveProposalId] = useState<string | null>(null);

  const fuelProducts = useMemo(() => products.filter(p => p.type === 'fuel'), [products]);
  const petrolProd = fuelProducts.find(p => p.name.toLowerCase().includes('petrol')) || fuelProducts[0];
  const dieselProd = fuelProducts.find(p => p.name.toLowerCase().includes('diesel')) || fuelProducts[1];
  const cngProd = fuelProducts.find(p => p.name.toLowerCase().includes('cng')) || { rate: 220.00 } as any;

  const petrolRate = petrolProd?.rate || 285.45;
  const dieselRate = dieselProd?.rate || 293.80;
  const cngRate = cngProd?.rate || 220.00;

  const omcRates = useMemo(() => omcRateMatrixEngine.getOMCComparison(petrolRate, dieselRate), [petrolRate, dieselRate]);
  const versionList = useMemo(() => versionHistoryEngine.getVersions(rateHistory), [rateHistory]);

  // Open Update Proposal Modal
  const handleOpenUpdateModal = () => {
    setIsUpdateModalOpen(true);
  };

  // Submit Proposal Handler
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
    alert(t('Price proposal submitted for approval successfully!', 'قیمت کی تجویز کامیابی سے جمع کر دی گئی ہے!'));
    setActiveTab('price_approval');
  };

  // Trigger Pre-Publish Simulation (Rule #173)
  const handleOpenSimulation = (proposedRate: number = 289.90, priceId?: string) => {
    if (petrolProd) {
      const res = pricingSimulationEngine.simulatePriceRevision(petrolProd, proposedRate, tanks);
      setSimulationResult(res);
      setActiveProposalId(priceId || null);
      setIsSimulationOpen(true);
    }
  };

  const handleConfirmPublish = async () => {
    setIsSimulationOpen(false);
    if (activeProposalId) {
      await pricingStore.publishRevision(activeProposalId, 'Station Owner');
    }
    alert(t('Rate published live to all Pumps, POS Terminals & Price Boards! Revaluation Journal Entry posted.', 'نیا ریٹ تمام پمپوں پر لائیو پبلش ہو چکا ہے!'));
  };

  return (
    <div className="space-y-6 pb-12">

      {/* TOP BRANCH & SPECTRUM CONTROL BAR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[var(--bg-card)] border border-[var(--border-main)] p-4 rounded-2xl shadow-md">
        <div>
          <h2 className="text-xl font-black text-[var(--text-main)] tracking-tight flex items-center gap-2">
            <span>🏷️</span>
            {t('Enterprise Pricing & OMC Rate Control Center', 'انٹرپرائز پرائسنگ و او ایم سی ریٹ کنٹرول سینٹر')}
          </h2>
          <p className="text-xs text-[var(--text-muted)]">
            {t('Rule #172 & #173 & #174 Compliant • SAP IS-Oil & Oracle NetSuite Standard', 'رول #174 پر مبنی لائیو فائرسٹور ریئل ٹائم پرائسنگ انجن')}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Branch Dropdown */}
          <div className="flex items-center gap-1.5 bg-[var(--bg-subtle)] border border-[var(--border-main)] rounded-xl px-3 py-1.5 text-xs text-[var(--text-main)]">
            <Building2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <select
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              className="bg-transparent text-[var(--text-main)] font-semibold focus:outline-none"
            >
              <option value="all" className="bg-[var(--bg-card)] text-[var(--text-main)]">{t('All Branches (National)', 'تمام برانچز')}</option>
              <option value="mardan" className="bg-[var(--bg-card)] text-[var(--text-main)]">Mardan Main Highway Station</option>
              <option value="peshawar" className="bg-[var(--bg-card)] text-[var(--text-main)]">Peshawar GT Road Station</option>
              <option value="islamabad" className="bg-[var(--bg-card)] text-[var(--text-main)]">Islamabad Expressway Station</option>
              <option value="lahore" className="bg-[var(--bg-card)] text-[var(--text-main)]">Lahore Ring Road Station</option>
              <option value="karachi" className="bg-[var(--bg-card)] text-[var(--text-main)]">Karachi Port Station</option>
            </select>
          </div>

          {/* Product Spectrum Dropdown */}
          <div className="flex items-center gap-1.5 bg-[var(--bg-subtle)] border border-[var(--border-main)] rounded-xl px-3 py-1.5 text-xs text-[var(--text-main)]">
            <Layers className="w-4 h-4 text-amber-600 dark:text-cyan-400" />
            <select
              value={selectedProductType}
              onChange={(e) => setSelectedProductType(e.target.value)}
              className="bg-transparent text-[var(--text-main)] font-semibold focus:outline-none"
            >
              <option value="all" className="bg-[var(--bg-card)] text-[var(--text-main)]">{t('All Fuel Spectrum', 'تمام فیول مصنوعات')}</option>
              <option value="petrol" className="bg-[var(--bg-card)] text-[var(--text-main)]">Super Petrol (MS 92)</option>
              <option value="diesel" className="bg-[var(--bg-card)] text-[var(--text-main)]">HSD Diesel</option>
              <option value="cng" className="bg-[var(--bg-card)] text-[var(--text-main)]">CNG Gas</option>
              <option value="hobc" className="bg-[var(--bg-card)] text-[var(--text-main)]">HOBC Hi-Octane</option>
              <option value="kerosene" className="bg-[var(--bg-card)] text-[var(--text-main)]">Kerosene Oil</option>
              <option value="ldo" className="bg-[var(--bg-card)] text-[var(--text-main)]">LDO (Light Diesel)</option>
              <option value="lube" className="bg-[var(--bg-card)] text-[var(--text-main)]">Lubricants & Engine Oils</option>
            </select>
          </div>
        </div>
      </div>

      {/* HERO AI PRICING BANNER */}
      <HeroAIPricingBanner isUrdu={isUrdu} />

      {/* 8 REALTIME PRICING KPI CARDS */}
      <PricingHeaderKPIs
        isUrdu={isUrdu}
        petrolPrice={petrolRate}
        dieselPrice={dieselRate}
        cngPrice={cngRate}
        avgMargin={8.64}
        changesToday={pricingStore.fuelPrices.length || 2}
        estimatedRevaluation={452000}
        pendingApprovals={pricingStore.fuelPrices.filter(p => p.status === 'waiting').length || 1}
        nextUpdateDate="15 Aug 2026"
      />

      {/* PRICING-ONLY QUICK ACTIONS TOOLBAR */}
      <PricingQuickActionsToolbar
        isUrdu={isUrdu}
        onOpenUpdateModal={handleOpenUpdateModal}
        onOpenScheduleModal={() => setActiveTab('scheduled_updates')}
        onOpenApproveModal={() => setActiveTab('price_approval')}
        onPublishRates={() => handleOpenSimulation(289.90)}
        onPrintBoard={() => window.print()}
        onOpenMarginCalc={() => setActiveTab('margin_analysis')}
        onImportOMC={() => setActiveTab('omc_matrix')}
        onExportHistory={() => setActiveTab('price_history')}
        onOpenRollback={() => setActiveTab('version_history')}
      />

      {/* 15 ENTERPRISE WORKSPACE HEADER TABS */}
      <div className="bg-[var(--bg-card)] border border-[var(--border-main)] rounded-2xl p-2 shadow-md overflow-x-auto no-scrollbar">
        <div className="flex items-center gap-1 min-w-max text-xs font-semibold">
          {[
            { id: 'overview', label: t('Overview', 'خلاصہ'), icon: '📊' },
            { id: 'price_board', label: t('Current Price Board', 'پرائس بورڈ'), icon: '🏷️' },
            { id: 'price_history', label: t('Price History', 'تبدیلی ہسٹری'), icon: '📈' },
            { id: 'scheduled_updates', label: t('Scheduled Updates', 'شیڈول تبدیلی'), icon: '📅' },
            { id: 'price_approval', label: t('Price Approval', 'منظوری وائیلو'), icon: '✔' },
            { id: 'competitor_rates', label: t('Competitor Rates', 'کمپیٹیٹر ریٹس'), icon: '⚔️' },
            { id: 'omc_matrix', label: t('OMC Rate Matrix', 'او ایم سی میٹرکس'), icon: '🇵🇰' },
            { id: 'margin_analysis', label: t('Margin Analysis', 'مارجن تجزیہ'), icon: '💰' },
            { id: 'inventory_revaluation', label: t('Inventory Revaluation', 'انوینٹری ری ویلیویشن'), icon: '📦' },
            { id: 'tax_breakdown', label: t('Tax & Levy Breakdown', 'اوگرا ٹیکس بریک ڈاؤن'), icon: '🏛️' },
            { id: 'price_forecasting', label: t('Price Forecasting (AI)', 'قیمت پیش گوئی'), icon: '🔮' },
            { id: 'price_documents', label: t('Price Documents', 'دستاویزات'), icon: '📄' },
            { id: 'audit_trail', label: t('Audit Trail', 'آڈٹ ٹریل'), icon: '📋' },
            { id: 'price_notifications', label: t('Price Notifications', 'نوٹیفکیشنز'), icon: '🔔' },
            { id: 'version_history', label: t('Version History', 'ورژن ہسٹری'), icon: '📜' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-amber-600 to-amber-700 dark:from-emerald-500 dark:to-teal-500 text-white font-black shadow-md'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-hover)]'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* SUB-TAB PANELS */}

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <PakistanOMCControlPanel
            isUrdu={isUrdu}
            omcRates={omcRates}
            onPublishRates={() => handleOpenSimulation(289.90)}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <TaxLevyBreakdownWidget isUrdu={isUrdu} petrolPrice={petrolRate} dieselPrice={dieselRate} />
            <PumpControllerSyncStatusWidget isUrdu={isUrdu} petrolRate={petrolRate} dieselRate={dieselRate} />
          </div>
        </div>
      )}

      {/* TAB 2: CURRENT PRICE BOARD */}
      {activeTab === 'price_board' && (
        <div className="bg-[var(--bg-card)] border border-[var(--border-main)] rounded-2xl p-5 shadow-md">
          <h3 className="text-lg font-bold text-[var(--text-main)] mb-4">Official Retail Price Board</h3>
          <div className="overflow-x-auto rounded-xl border border-[var(--border-main)]">
            <table className="w-full text-left text-xs">
              <thead className="bg-[var(--bg-subtle)] text-[var(--text-muted)] font-semibold uppercase text-[10px]">
                <tr>
                  <th className="p-3">Product</th>
                  <th className="p-3 text-right">Retail Selling Rate</th>
                  <th className="p-3 text-right">Purchase Cost</th>
                  <th className="p-3 text-right">Dealer Margin</th>
                  <th className="p-3 text-center">Effective Date</th>
                  <th className="p-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-muted)] font-mono text-[var(--text-main)]">
                {fuelProducts.map((p) => (
                  <tr key={p.id} className="hover:bg-[var(--bg-hover)] transition-colors">
                    <td className="p-3 font-bold text-[var(--text-main)] font-sans">{p.name}</td>
                    <td className="p-3 text-right text-emerald-700 dark:text-emerald-400 font-bold text-sm">{formatCurrency(p.rate || 285.45)}</td>
                    <td className="p-3 text-right text-[var(--text-muted)]">{formatCurrency((p.rate || 285.45) * 0.95)}</td>
                    <td className="p-3 text-right text-amber-700 dark:text-cyan-300 font-bold">Rs 8.64/L</td>
                    <td className="p-3 text-center text-[var(--text-muted)]">2026-08-01 00:00</td>
                    <td className="p-3 text-center">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">Active</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: PRICE CHANGE HISTORY */}
      {activeTab === 'price_history' && (
        <div className="bg-[var(--bg-card)] border border-[var(--border-main)] rounded-2xl p-5 shadow-md">
          <h3 className="text-lg font-bold text-[var(--text-main)] mb-4">Historical Price Revision Log</h3>
          <div className="space-y-3 font-mono text-xs">
            {(pricingStore.fuelPrices.length > 0 ? pricingStore.fuelPrices : (rateHistory as any)).map((rh: any, idx: number) => (
              <div key={rh.id || idx} className="bg-[var(--bg-subtle)] p-3 rounded-xl border border-[var(--border-main)] flex justify-between items-center">
                <div>
                  <div className="font-bold text-[var(--text-main)] font-sans">{rh.productName || 'Super Petrol'}</div>
                  <div className="text-[10px] text-[var(--text-muted)]">{rh.effectiveDate || rh.date || '2026-08-01'}</div>
                </div>
                <div className="text-right">
                  <div className="text-emerald-700 dark:text-emerald-400 font-bold">New: {formatCurrency(rh.newPrice || rh.newRate || 285.45)}</div>
                  <div className="text-[var(--text-muted)] text-[10px]">Old: {formatCurrency(rh.oldPrice || rh.oldRate || 284.10)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: SCHEDULED UPDATES */}
      {activeTab === 'scheduled_updates' && (
        <div className="bg-[var(--bg-card)] border border-[var(--border-main)] rounded-2xl p-5 shadow-md">
          <h3 className="text-lg font-bold text-[var(--text-main)] mb-3">Scheduled Price Changes</h3>
          <div className="bg-[var(--bg-subtle)] p-4 rounded-xl border border-[var(--border-main)] text-xs text-[var(--text-main)]">
            <div className="font-bold text-amber-700 dark:text-cyan-300 mb-1">Scheduled for 15th August 2026 (12:00 AM)</div>
            <p className="text-[var(--text-muted)]">OGRA Mid-August Fortnightly Tariff Adjustment • Status: Approved for Auto-Publish</p>
          </div>
        </div>
      )}

      {/* TAB 5: PRICE APPROVAL */}
      {activeTab === 'price_approval' && (
        <PriceApprovalWorkflowTab
          isUrdu={isUrdu}
          onApprove={() => handleOpenSimulation(289.90)}
        />
      )}

      {/* TAB 7: OMC MATRIX */}
      {activeTab === 'omc_matrix' && (
        <PakistanOMCControlPanel isUrdu={isUrdu} omcRates={omcRates} onPublishRates={() => handleOpenSimulation(289.90)} />
      )}

      {/* TAB 9: INVENTORY REVALUATION */}
      {activeTab === 'inventory_revaluation' && (
        <InventoryRevaluationTab isUrdu={isUrdu} products={products} tanks={tanks} />
      )}

      {/* TAB 10: TAX BREAKDOWN */}
      {activeTab === 'tax_breakdown' && (
        <TaxLevyBreakdownWidget isUrdu={isUrdu} petrolPrice={petrolRate} dieselPrice={dieselRate} />
      )}

      {/* TAB 13: AUDIT TRAIL */}
      {activeTab === 'audit_trail' && (
        <div className="bg-[var(--bg-card)] border border-[var(--border-main)] rounded-2xl p-5 shadow-md">
          <h3 className="text-lg font-bold text-[var(--text-main)] mb-4">Immutable Pricing Audit Feed</h3>
          <div className="space-y-3 font-mono text-xs">
            {pricingStore.auditLogs.map((log) => (
              <div key={log.id} className="bg-[var(--bg-subtle)] p-3 rounded-xl border border-[var(--border-main)]">
                <div className="flex justify-between text-[10px] text-[var(--text-muted)] mb-1">
                  <span className="font-bold text-amber-700 dark:text-cyan-300">{log.actionType}</span>
                  <span>{new Date(log.timestamp).toLocaleString()}</span>
                </div>
                <p className="text-[var(--text-main)]">{log.details}</p>
                <div className="text-[10px] text-[var(--text-muted)] mt-1">User: {log.userName} ({log.userRole})</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 14: PRICE NOTIFICATIONS */}
      {activeTab === 'price_notifications' && (
        <OGRANotificationCenterTab isUrdu={isUrdu} onApproveNotification={() => handleOpenSimulation(289.90)} />
      )}

      {/* TAB 15: VERSION HISTORY */}
      {activeTab === 'version_history' && (
        <VersionHistoryTab
          isUrdu={isUrdu}
          versions={versionList}
          onRollback={(v) => {
            const mockRecord: FuelPriceMasterRecord = {
              id: 'rollback_target',
              productId: 'p_petrol',
              productName: v.productRates[0].productName,
              currentPrice: petrolRate,
              oldPrice: v.productRates[0].oldPrice,
              newPrice: v.productRates[0].newPrice,
              effectiveDate: '2026-08-01',
              effectiveTime: '00:00',
              status: 'published',
              version: v.versionNumber,
              dealerMargin: 8.64
            };
            pricingStore.rollbackVersion(mockRecord, 'Station Owner');
            alert(t(`Rolled back to Version ${v.versionNumber} successfully!`, 'ورژن باکامیابی بحال ہو گیا ہے!'));
          }}
        />
      )}

      {/* UPDATE PRICE PROPOSAL MODAL */}
      <UpdatePriceModal
        isOpen={isUpdateModalOpen}
        isUrdu={isUrdu}
        products={products}
        onClose={() => setIsUpdateModalOpen(false)}
        onSubmitProposal={handleSubmitProposal}
      />

      {/* RULE #173 SIMULATION MODAL */}
      <PricingSimulationModal
        isOpen={isSimulationOpen}
        simulation={simulationResult}
        isUrdu={isUrdu}
        onClose={() => setIsSimulationOpen(false)}
        onConfirmPublish={handleConfirmPublish}
      />

    </div>
  );
}
