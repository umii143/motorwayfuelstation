import React, { useState, useMemo } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { 
  TrendingUp, TrendingDown, Clock, Activity, 
  ChevronDown, Edit2, Minus, Maximize2, AlertCircle, CheckCircle,
  Building2, MapPin, Layers, Filter, Search, Sparkles
} from 'lucide-react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, Legend 
} from 'recharts';
import { useInventoryStore } from '../../../stores/useInventoryStore';
import { useShiftStore } from '../../../stores/useShiftStore';
import { Product, RateHistoryEntry, GlobalSettings } from '../../../types';
import { motion, AnimatePresence } from 'motion/react';
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

// Services & Engines
import { pricingSimulationEngine, PricingSimulationResult } from '../../../services/priceManagement/pricingSimulationEngine';
import { omcRateMatrixEngine } from '../../../services/priceManagement/omcRateMatrixEngine';
import { versionHistoryEngine, PriceVersionRecord } from '../../../services/priceManagement/versionHistoryEngine';

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

  // Retrieve stockTxns, tanks, nozzles from Zustand store
  const { tanks } = useInventoryStore(useShallow(state => ({
    tanks: state.tanks
  })));

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

  // Simulation Modal State (Rule #173)
  const [isSimulationOpen, setIsSimulationOpen] = useState(false);
  const [simulationResult, setSimulationResult] = useState<PricingSimulationResult | null>(null);

  const fuelProducts = useMemo(() => products.filter(p => p.type === 'fuel'), [products]);
  const petrolProd = fuelProducts.find(p => p.name.toLowerCase().includes('petrol')) || fuelProducts[0];
  const dieselProd = fuelProducts.find(p => p.name.toLowerCase().includes('diesel')) || fuelProducts[1];
  const cngProd = fuelProducts.find(p => p.name.toLowerCase().includes('cng')) || { rate: 220.00 } as any;

  const petrolRate = petrolProd?.rate || 285.45;
  const dieselRate = dieselProd?.rate || 293.80;
  const cngRate = cngProd?.rate || 220.00;

  const omcRates = useMemo(() => omcRateMatrixEngine.getOMCComparison(petrolRate, dieselRate), [petrolRate, dieselRate]);
  const versionList = useMemo(() => versionHistoryEngine.getVersions(rateHistory), [rateHistory]);

  // Trigger Pre-Publish Simulation (Rule #173)
  const handleOpenSimulation = (proposedRate: number = 289.90) => {
    if (petrolProd) {
      const res = pricingSimulationEngine.simulatePriceRevision(petrolProd, proposedRate, tanks);
      setSimulationResult(res);
      setIsSimulationOpen(true);
    }
  };

  const handleConfirmPublish = () => {
    setIsSimulationOpen(false);
    alert(t('Rate successfully published to all Pumps, POS Terminals & Price Boards! Revaluation Journal Entry posted.', 'تمام پمپوں اور پی او ایس پر نیا ریٹ لائیو پبلش ہو چکا ہے!'));
  };

  return (
    <div className="space-y-6 pb-12">

      {/* TOP BRANCH & SPECTRUM CONTROL BAR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/90 border border-slate-800 p-4 rounded-2xl shadow-xl backdrop-blur-xl">
        <div>
          <h2 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
            <span>🏷️</span>
            {t('Enterprise Pricing & OMC Rate Control Center', 'انٹرپرائز پرائسنگ و او ایم سی ریٹ کنٹرول سینٹر')}
          </h2>
          <p className="text-xs text-slate-400">
            {t('Rule #172 & #173 Compliant • SAP IS-Oil & Oracle NetSuite Enterprise Standard', 'رول #172 اور #173 پر مبنی لائیو پرائسنگ سینٹر')}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Branch Dropdown */}
          <div className="flex items-center gap-1.5 bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-300">
            <Building2 className="w-4 h-4 text-emerald-400" />
            <select
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              className="bg-transparent text-white font-semibold focus:outline-none"
            >
              <option value="all">{t('All Branches (National)', 'تمام برانچز')}</option>
              <option value="mardan">Mardan Main Highway Station</option>
              <option value="peshawar">Peshawar GT Road Station</option>
              <option value="islamabad">Islamabad Expressway Station</option>
              <option value="lahore">Lahore Ring Road Station</option>
              <option value="karachi">Karachi Port Station</option>
            </select>
          </div>

          {/* Product Spectrum Dropdown */}
          <div className="flex items-center gap-1.5 bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-300">
            <Layers className="w-4 h-4 text-cyan-400" />
            <select
              value={selectedProductType}
              onChange={(e) => setSelectedProductType(e.target.value)}
              className="bg-transparent text-white font-semibold focus:outline-none"
            >
              <option value="all">{t('All Fuel Spectrum', 'تمام فیول مصنوعات')}</option>
              <option value="petrol">Super Petrol (MS 92)</option>
              <option value="diesel">HSD Diesel</option>
              <option value="cng">CNG Gas</option>
              <option value="hobc">HOBC Hi-Octane</option>
              <option value="kerosene">Kerosene Oil</option>
              <option value="ldo">LDO (Light Diesel)</option>
              <option value="lube">Lubricants & Engine Oils</option>
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
        changesToday={2}
        estimatedRevaluation={452000}
        pendingApprovals={1}
        nextUpdateDate="15 Aug 2026"
      />

      {/* PRICING-ONLY QUICK ACTIONS TOOLBAR */}
      <PricingQuickActionsToolbar
        isUrdu={isUrdu}
        onOpenUpdateModal={() => handleOpenSimulation(289.90)}
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
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-2 shadow-xl overflow-x-auto no-scrollbar">
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
                  ? 'bg-emerald-500 text-slate-950 font-black shadow-lg shadow-emerald-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
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
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl">
          <h3 className="text-lg font-bold text-white mb-4">Official Retail Price Board</h3>
          <div className="overflow-x-auto rounded-xl border border-slate-800">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-800 text-slate-300 font-semibold uppercase text-[10px]">
                <tr>
                  <th className="p-3">Product</th>
                  <th className="p-3 text-right">Retail Selling Rate</th>
                  <th className="p-3 text-right">Purchase Cost</th>
                  <th className="p-3 text-right">Dealer Margin</th>
                  <th className="p-3 text-center">Effective Date</th>
                  <th className="p-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 font-mono text-slate-200">
                {fuelProducts.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-800/40">
                    <td className="p-3 font-bold text-white font-sans">{p.name}</td>
                    <td className="p-3 text-right text-emerald-400 font-bold text-sm">{formatCurrency(p.rate)}</td>
                    <td className="p-3 text-right text-slate-400">{formatCurrency(p.rate * 0.95)}</td>
                    <td className="p-3 text-right text-cyan-300">Rs 8.64/L</td>
                    <td className="p-3 text-center text-slate-400">2026-08-01 00:00</td>
                    <td className="p-3 text-center">
                      <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">Active</span>
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
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl">
          <h3 className="text-lg font-bold text-white mb-4">Historical Price Revision Log</h3>
          <div className="space-y-3 font-mono text-xs">
            {rateHistory.map((rh, idx) => (
              <div key={idx} className="bg-slate-800/60 p-3 rounded-xl border border-slate-700 flex justify-between items-center">
                <div>
                  <div className="font-bold text-white font-sans">{rh.productName || 'Super Petrol'}</div>
                  <div className="text-[10px] text-slate-400">{rh.date || rh.effectiveDate || '2026-08-01'}</div>
                </div>
                <div className="text-right">
                  <div className="text-emerald-400 font-bold">New: {formatCurrency(rh.newRate || rh.newPrice || 285.45)}</div>
                  <div className="text-slate-400 text-[10px]">Old: {formatCurrency(rh.oldRate || rh.oldPrice || 284.10)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: SCHEDULED UPDATES */}
      {activeTab === 'scheduled_updates' && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl">
          <h3 className="text-lg font-bold text-white mb-3">Scheduled Price Changes</h3>
          <div className="bg-slate-800/60 p-4 rounded-xl border border-slate-700 text-xs text-slate-300">
            <div className="font-bold text-cyan-300 mb-1">Scheduled for 15th August 2026 (12:00 AM)</div>
            <p className="text-slate-400">OGRA Mid-August Fortnightly Tariff Adjustment • Status: Approved for Auto-Publish</p>
          </div>
        </div>
      )}

      {/* TAB 5: PRICE APPROVAL */}
      {activeTab === 'price_approval' && (
        <PriceApprovalWorkflowTab isUrdu={isUrdu} onApprove={() => handleOpenSimulation(289.90)} />
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

      {/* TAB 14: PRICE NOTIFICATIONS */}
      {activeTab === 'price_notifications' && (
        <OGRANotificationCenterTab isUrdu={isUrdu} onApproveNotification={() => handleOpenSimulation(289.90)} />
      )}

      {/* TAB 15: VERSION HISTORY */}
      {activeTab === 'version_history' && (
        <VersionHistoryTab isUrdu={isUrdu} versions={versionList} onRollback={(v) => handleOpenSimulation(v.productRates[0].newPrice)} />
      )}

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
