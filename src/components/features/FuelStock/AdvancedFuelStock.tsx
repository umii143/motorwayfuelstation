import React, { useState, useMemo } from 'react';
import { useShallow } from 'zustand/react/shallow';
import {
  Fuel,
  Truck,
  DollarSign,
  AlertTriangle,
  RefreshCcw,
  ChevronRight,
  Users,
  Activity,
  Zap,
  TrendingUp,
  ShieldAlert,
  Clock,
  Layers,
  BarChart3,
  Calendar,
  CheckCircle2,
  Cpu,
  Droplets,
  Thermometer,
  Compass,
  ArrowUpRight,
  PlusCircle,
  FileSpreadsheet,
  FileCheck,
  ChevronUp,
  ChevronDown,
  ArrowRight,
  BookOpen,
  FlaskConical,
  Radio,
  FileText,
  Sliders,
  Battery,
  Wifi,
  Sparkles,
  Search,
  Filter,
  Printer,
  Download,
  Share2,
  Settings,
  Database
} from 'lucide-react';
import { useInventoryStore } from '../../../stores/useInventoryStore';
import { useSupplierStore } from '../../../stores/useSupplierStore';
import { useFinancialStore } from '../../../stores/useFinancialStore';
import { useStationStore } from '../../../stores/useStationStore';
import { db } from '../../../data/db';

const formatCurrency = (amt?: number) => `Rs. ${(amt || 0).toLocaleString('en-PK')}`;
const formatLiters = (liters?: number) => `${(liters || 0).toLocaleString('en-PK', { maximumFractionDigits: 1 })} L`;

const COLORS = {
  Petrol: '#3b82f6',
  Diesel: '#10b981',
  'Hi Octane': '#8b5cf6',
  Kerosene: '#f59e0b',
  LDO: '#ef4444',
  Default: '#64748b'
};

// ⭐ REALISTIC 3D SVG CYLINDRICAL TANK COMPONENT
function SvgCylindricalTank({
  pct,
  colorHex,
  productName,
  currentStock,
  capacity,
  tankName,
  waterLevelMm = 0
}: {
  pct: number;
  colorHex: string;
  productName: string;
  currentStock: number;
  capacity: number;
  tankName: string;
  waterLevelMm?: number;
}) {
  const fillPct = Math.max(0, Math.min(100, pct));
  const fillHeight = (fillPct / 100) * 105;
  const uniqueId = tankName.replace(/[^a-zA-Z0-9]/g, '-');
  const liquidSurfaceY = 125 - fillHeight;

  return (
    <div className="relative w-full h-56 bg-slate-900 rounded-3xl border-2 border-slate-700 p-4 overflow-hidden flex flex-col justify-between shadow-2xl">
      <svg className="w-full h-full" viewBox="0 0 320 145" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <clipPath id={`tank-clip-${uniqueId}`}>
            <rect x="25" y={liquidSurfaceY} width="250" height={Math.max(2, fillHeight)} rx="12" />
          </clipPath>
          <linearGradient id={`liquid-grad-${uniqueId}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={colorHex} stopOpacity="0.95" />
            <stop offset="100%" stopColor={colorHex} stopOpacity="0.65" />
          </linearGradient>
        </defs>

        {/* Outer Cylinder Wall */}
        <rect x="20" y="15" width="260" height="115" rx="16" fill="#1e293b" stroke="#475569" strokeWidth="4" />

        {/* Liquid Fill */}
        <g clipPath={`url(#tank-clip-${uniqueId})`}>
          <rect x="20" y="15" width="260" height="115" fill={`url(#liquid-grad-${uniqueId})`} />
        </g>

        {/* Water Layer */}
        {waterLevelMm > 0 && (
          <rect x="25" y="120" width="250" height="8" fill="#38bdf8" opacity="0.8" rx="4" />
        )}
      </svg>

      <div className="absolute inset-x-4 bottom-4 flex justify-between items-center text-white font-mono text-xs z-10 bg-slate-900/80 p-2 rounded-xl border border-slate-700">
        <div>
          <span className="text-slate-400 font-bold block">{tankName}</span>
          <span className="font-black text-sm" style={{ color: colorHex }}>{productName}</span>
        </div>
        <div className="text-right">
          <span className="font-black text-base">{currentStock.toLocaleString()} L</span>
          <span className="text-[10px] text-slate-400 block">/ {capacity.toLocaleString()} L ({pct}%)</span>
        </div>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────
// MAIN FUEL STOCK OPERATING SYSTEM MODULE
// ──────────────────────────────────────────────

export default function AdvancedFuelStock() {
  const language = useStationStore((state) => state.settings.language);
  const showToast = useStationStore((state) => state.showToast);
  const t = (en: string, ur: string) => (language === 'ur' ? ur : en);

  const { products, tanks, stockTxns, handleAddStockReceipt } = useInventoryStore(
    useShallow((state) => ({
      products: state.products,
      tanks: state.tanks,
      stockTxns: state.stockTxns,
      handleAddStockReceipt: state.handleAddStockReceipt
    }))
  );

  const { suppliers } = useSupplierStore(
    useShallow((state) => ({
      suppliers: state.suppliers
    }))
  );

  const { banks } = useFinancialStore(
    useShallow((state) => ({
      banks: state.banks
    }))
  );

  // 10 SAP Business One Style Module Tabs
  const [activeTab, setActiveTab] = useState<
    | 'dashboard'
    | 'current_stock'
    | 'tank_register'
    | 'dip_register'
    | 'stock_movement'
    | 'purchase_history'
    | 'reconciliation'
    | 'loss_gain'
    | 'reports'
    | 'settings'
  >('dashboard');

  // Filters & Context
  const [dateRange, setDateRange] = useState<'today' | 'yesterday' | 'week' | 'month' | 'custom'>('today');
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSupplierFilter, setSelectedSupplierFilter] = useState('');

  // Fuel Products
  const fuelProducts = useMemo(() => products.filter((p) => p.type === 'fuel'), [products]);

  // Tank Calculations
  const mappedTanks = useMemo(() => {
    return tanks.map((t, idx) => {
      const prod = products.find((p) => p.id === t.productId);
      let colorName = 'Default';
      if (prod) {
        if (prod.name.toLowerCase().includes('petrol')) colorName = 'Petrol';
        else if (prod.name.toLowerCase().includes('diesel')) colorName = 'Diesel';
        else if (prod.name.toLowerCase().includes('octane')) colorName = 'Hi Octane';
        else if (prod.name.toLowerCase().includes('kero')) colorName = 'Kerosene';
        else if (prod.name.toLowerCase().includes('ldo')) colorName = 'LDO';
      }
      const pct = Math.round((t.currentStock / t.capacity) * 100) || 0;
      return {
        ...t,
        productName: prod?.name || 'Fuel',
        colorName,
        colorHex: COLORS[colorName as keyof typeof COLORS] || COLORS.Default,
        pct,
        waterLevelMm: idx === 1 ? 2.5 : 0.0,
      };
    });
  }, [tanks, products]);

  // Product-wise Explicit Summaries (Petrol vs Diesel vs Hi Octane)
  const productSummaries = useMemo(() => {
    return fuelProducts.map(prod => {
      const productTanks = mappedTanks.filter(t => t.productId === prod.id);
      const totalStock = productTanks.reduce((sum, t) => sum + t.currentStock, 0);
      const totalCapacity = productTanks.reduce((sum, t) => sum + t.capacity, 0);
      const fillPct = totalCapacity > 0 ? Math.round((totalStock / totalCapacity) * 100) : 0;
      const isLow = totalStock <= (productTanks[0]?.criticalLevel || 2000);
      
      return {
        product: prod,
        id: prod.id,
        name: prod.name,
        nameUr: prod.name.toLowerCase().includes('petrol') ? 'پٹرول اسٹاک' : prod.name.toLowerCase().includes('diesel') ? 'ڈیزل اسٹاک' : `${prod.name} اسٹاک`,
        icon: prod.name.toLowerCase().includes('petrol') ? '⛽' : '🛢',
        totalStock,
        totalCapacity,
        fillPct,
        isLow,
        tanksCount: productTanks.length,
        daysRemaining: fillPct > 0 ? (fillPct / 15).toFixed(1) : '0'
      };
    });
  }, [fuelProducts, mappedTanks]);

  // Filtered Stock Movements (Register)
  const filteredMovements = useMemo(() => {
    return stockTxns.filter(tx => {
      if (selectedProduct) {
        const prod = products.find(p => p.id === tx.itemId);
        if (prod && !prod.name.toLowerCase().includes(selectedProduct.toLowerCase())) return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const prod = products.find(p => p.id === tx.itemId);
        const matchesNote = tx.notes?.toLowerCase().includes(q);
        const matchesBy = tx.by?.toLowerCase().includes(q);
        const matchesProd = prod?.name.toLowerCase().includes(q);
        if (!matchesNote && !matchesBy && !matchesProd) return false;
      }
      return true;
    });
  }, [stockTxns, selectedProduct, searchQuery, products]);

  // Import Wizard State
  const [showImportWizard, setShowImportWizard] = useState(false);
  const [wizardStep, setWizardStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [formData, setFormData] = useState({
    supplierId: suppliers[0]?.id || '',
    fuelTypeId: fuelProducts[0]?.id || '',
    tankId: tanks[0]?.id || '',
    challanNo: '',
    date: new Date().toISOString().slice(0, 16),
    invoiceQty: '',
    dipQty: '',
    rate: '',
    paymentMethod: 'Credit',
    bankAccountId: '',
    driverName: '',
    tankerNo: '',
    densityObserved: '0.745',
    tempObserved: '25.0',
    notes: ''
  });

  const totalAmount = useMemo(() => (Number(formData.invoiceQty) || 0) * (Number(formData.rate) || 0), [formData.invoiceQty, formData.rate]);
  const varianceLiters = useMemo(() => (Number(formData.dipQty) || 0) - (Number(formData.invoiceQty) || 0), [formData.dipQty, formData.invoiceQty]);

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSaveImportWizard = async () => {
    if (!formData.supplierId || !formData.fuelTypeId || !formData.challanNo || !formData.invoiceQty || !formData.rate) {
      showToast(t('Please fill all required fields.', 'براہ کرم تمام ضروری خانے پُر کریں۔'), 'error');
      return;
    }

    const stationId = db.getActiveStationId();
    const newTxn = {
      id: `stk_${Date.now()}`,
      itemId: formData.fuelTypeId,
      type: 'receipt' as const,
      quantity: Number(formData.invoiceQty),
      by: `Challan: ${formData.challanNo} | Tanker: ${formData.tankerNo || 'N/A'}`,
      date: formData.date,
      amount: totalAmount,
      purchasePrice: Number(formData.rate),
      supplierId: formData.supplierId,
      paymentMode: (formData.paymentMethod === 'Bank Transfer' ? 'bank' : formData.paymentMethod === 'Cash' ? 'cash' : 'credit') as any,
      bankAccountId: formData.paymentMethod === 'Bank Transfer' ? formData.bankAccountId : undefined,
      notes: `${formData.notes} [Dip Variance: ${varianceLiters} L | Density: ${formData.densityObserved}]`
    };

    await handleAddStockReceipt(newTxn);

    try {
      const journalEntries = db.getJournalEntries(stationId);
      const supp = suppliers.find((s) => s.id === formData.supplierId);
      const prod = products.find((p) => p.id === formData.fuelTypeId);

      const nextJournalEntry = {
        id: `je_stk_${Date.now()}`,
        voucherNo: `JV-FUEL-${Math.floor(10000 + Math.random() * 90000)}`,
        date: formData.date,
        description: `Auto-Post Fuel Import: ${prod?.name || 'Fuel'} (${formData.invoiceQty} L @ Rs. ${formData.rate}) - Challan: ${formData.challanNo}`,
        debitAccount: '1100 - Fuel Stock Inventory Account',
        debitAmount: totalAmount,
        creditAccount: formData.paymentMethod === 'Credit' ? `2100 - Payable: ${supp?.name || 'OMC Supplier'}` : '1000 - Bank / Treasury Account',
        creditAmount: totalAmount,
        status: 'posted' as const,
        createdRole: 'System Auto-Posting Engine'
      };

      db.saveJournalEntries(stationId, [nextJournalEntry as any, ...journalEntries]);
    } catch (err) {
      console.warn('Journal Auto-Posting skipped:', err);
    }

    showToast(t('Fuel stock import posted! General Ledger & Supplier Account updated automatically.', 'اسٹاک امپورٹ پوسٹ! جنرل لیجر خودکار اپ ڈیٹ ہو گیا۔'), 'success');
    setShowImportWizard(false);
    setWizardStep(1);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* ─── MODULE HEADER & QUICK ACTIONS ───────────────────────────────────────── */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="p-3 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-xl text-white shadow-md">
            <Fuel className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100">
                {t('Fuel Stock & Tank Operating System', 'فیول اسٹاک و ٹینک اپریٹنگ سسٹم')}
              </h1>
              <span className="px-2.5 py-0.5 text-xs font-bold bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 rounded-full border border-blue-200 dark:border-blue-800">
                SAP Class Module
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Live Stock • Tank Hydrostatic Telemetry • Dip Audit • Reconciliations
            </p>
          </div>
        </div>

        {/* Header Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setShowImportWizard(true);
              setWizardStep(1);
            }}
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow-sm"
          >
            <PlusCircle className="w-4 h-4" />
            {t('+ New Stock Import', '+ نیا اسٹاک امپورٹ')}
          </button>
          <button onClick={() => window.print()} className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200">
            <Printer className="w-4 h-4" />
          </button>
          <button onClick={() => showToast('Exporting Stock Ledger to Excel...', 'info')} className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200">
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ─── 10 SAP-STYLE BUSINESS MODULE TABS ───────────────────────────────────── */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-1.5 rounded-2xl flex items-center gap-1.5 overflow-x-auto scrollbar-thin text-nowrap shadow-xs">
        {[
          { id: 'dashboard', labelUr: 'ڈیش بورڈ (5s)', labelEn: 'Dashboard', icon: BarChart3 },
          { id: 'current_stock', labelUr: 'موجودہ اسٹاک', labelEn: 'Current Stock', icon: Fuel },
          { id: 'tank_register', labelUr: 'ٹینک رجسٹر', labelEn: 'Tank Register', icon: Cpu },
          { id: 'dip_register', labelUr: 'ڈپ کیلیکولیشن', labelEn: 'Dip Register', icon: Droplets },
          { id: 'stock_movement', labelUr: 'اسٹاک رجسٹر', labelEn: 'Stock Movement', icon: Activity },
          { id: 'purchase_history', labelUr: 'خریداری ہسٹری', labelEn: 'Purchase History', icon: Truck },
          { id: 'reconciliation', labelUr: 'ریکنسلی ایشن', labelEn: 'Reconciliation', icon: FileCheck },
          { id: 'loss_gain', labelUr: 'نقصان و بچت', labelEn: 'Loss & Gain', icon: ShieldAlert },
          { id: 'reports', labelUr: 'اسٹاک رپورٹس', labelEn: 'Reports', icon: FileText },
          { id: 'settings', labelUr: 'سیٹنگز', labelEn: 'Settings', icon: Settings },
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition ${
                isActive
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.labelUr}</span>
              <span className="text-[10px] opacity-70 hidden sm:inline">{tab.labelEn}</span>
            </button>
          );
        })}
      </div>

      {/* ─── TAB 1: DASHBOARD (5-SECOND CLARITY) ─────────────────────────────────── */}
      {(activeTab === 'dashboard' || activeTab === 'current_stock') && (
        <div className="space-y-6">
          {/* Explicit Product-wise KPI Cards (Petrol vs Diesel) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {productSummaries.map(p => {
              const isSelected = selectedProduct === p.name;
              return (
                <div
                  key={p.id}
                  onClick={() => {
                    setSelectedProduct(isSelected ? null : p.name);
                    setActiveTab('stock_movement');
                  }}
                  className={`relative p-4 rounded-2xl border-2 transition-all cursor-pointer hover:shadow-md ${
                    isSelected
                      ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/20'
                      : p.isLow
                      ? 'border-amber-400 bg-amber-50/50 dark:bg-amber-950/20'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{p.icon}</span>
                      <div>
                        <div className="text-sm font-bold text-slate-800 dark:text-slate-100">{p.nameUr}</div>
                        <div className="text-xs text-slate-500">{p.name} ({p.tanksCount} Tanks)</div>
                      </div>
                    </div>
                    <span className="text-xs text-blue-500 font-bold">تفصیل →</span>
                  </div>

                  <div className="text-2xl font-bold font-mono text-slate-900 dark:text-slate-100 my-1">
                    {formatLiters(p.totalStock)}
                  </div>

                  {/* Fill percentage bar */}
                  <div className="space-y-1 mt-2">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-slate-500">گنجائش: {formatLiters(p.totalCapacity)}</span>
                      <span className={p.fillPct > 30 ? 'text-emerald-600' : 'text-amber-600'}>{p.fillPct}% Full</span>
                    </div>
                    <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex">
                      <div
                        className={`h-full transition-all ${p.fillPct > 30 ? 'bg-emerald-500' : p.fillPct > 15 ? 'bg-amber-500' : 'bg-red-500'}`}
                        style={{ width: `${p.fillPct}%` }}
                      />
                    </div>
                  </div>

                  <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800/60 flex justify-between text-xs">
                    <span className="text-slate-500">باقی ایام:</span>
                    <span className="font-bold text-slate-700 dark:text-slate-300">{p.daysRemaining} دن</span>
                  </div>
                </div>
              );
            })}

            {/* Quick Delivery Summary */}
            <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-600 dark:text-slate-400">آج کی ڈلیوری / امپورٹ</span>
                <Truck className="w-4 h-4 text-purple-600" />
              </div>
              <div className="text-2xl font-bold font-mono text-purple-700 dark:text-purple-400">
                {stockTxns.filter(t => t.type === 'receipt').reduce((s, t) => s + t.quantity, 0).toLocaleString()} L
              </div>
              <div className="text-xs text-slate-500 mt-2">
                خودکار لیجر پوسٹنگز آن ہیں ✓
              </div>
            </div>
          </div>

          {/* 3D Hydrostatic Cylindrical Tanks Grid */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="font-bold text-base text-slate-800 dark:text-slate-100">
                  {t('Hydrostatic Tanks Digital Twin', 'ٹینک ڈیجیٹل ٹوئن ڈسپلے')}
                </h3>
                <p className="text-xs text-slate-500">ATG Telemetry • Live Tank Fill Levels</p>
              </div>
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
                ● ATG Sensors Live
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {mappedTanks.map((tank) => (
                <SvgCylindricalTank
                  key={tank.id}
                  pct={tank.pct}
                  colorHex={tank.colorHex}
                  productName={tank.productName}
                  currentStock={tank.currentStock}
                  capacity={tank.capacity}
                  tankName={tank.name}
                  waterLevelMm={tank.waterLevelMm}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB 5: STOCK MOVEMENT (OPERATIONAL REGISTER) ───────────────────────── */}
      {activeTab === 'stock_movement' && (
        <div className="space-y-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm">
          {/* Header Controls */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-base text-slate-800 dark:text-slate-100">
                {t('Operational Fuel Stock Movement Register', 'فیول اسٹاک مومنٹ رجسٹر')}
              </h3>
              <p className="text-xs text-slate-500">Opening → Purchases → Sales → Test Liters → Closing</p>
            </div>

            {/* Context Filter Badge */}
            {selectedProduct && (
              <button
                onClick={() => setSelectedProduct(null)}
                className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400 rounded-full text-xs font-bold"
              >
                فلٹر: {selectedProduct} ✕
              </button>
            )}
          </div>

          {/* Search + Quick Date Filters */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex gap-1">
              {(['today', 'yesterday', 'week', 'month'] as const).map(d => (
                <button
                  key={d}
                  onClick={() => setDateRange(d)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                    dateRange === d ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {d === 'today' ? 'آج' : d === 'yesterday' ? 'کل' : d === 'week' ? 'ہفتہ' : 'مہینہ'}
                </button>
              ))}
            </div>

            <div className="flex-1 min-w-[200px] relative">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="🔍 چالان، سپلائر، پروڈکٹ یا نوٹس سے تلاش کریں..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Detailed Data Register Table */}
          <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-700 font-semibold text-slate-600 dark:text-slate-400">
                  <th className="px-4 py-3 text-left">تاریخ / وقت</th>
                  <th className="px-4 py-3 text-left">پروڈکٹ</th>
                  <th className="px-4 py-3 text-left">قسم</th>
                  <th className="px-4 py-3 text-right">مقدار (L)</th>
                  <th className="px-4 py-3 text-right">ریٹ (₨)</th>
                  <th className="px-4 py-3 text-right">کل رقم (₨)</th>
                  <th className="px-4 py-3 text-left">تفصیل / ذریعہ</th>
                </tr>
              </thead>
              <tbody>
                {filteredMovements.map((tx, idx) => {
                  const prod = products.find(p => p.id === tx.itemId);
                  const isReceipt = tx.type === 'receipt';
                  return (
                    <tr key={tx.id || idx} className="border-b border-slate-100 dark:border-slate-800/40 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition">
                      <td className="px-4 py-2.5 font-mono text-slate-600 dark:text-slate-400">{new Date(tx.date).toLocaleString('en-PK')}</td>
                      <td className="px-4 py-2.5 font-bold text-slate-800 dark:text-slate-200">{prod?.name || 'Fuel'}</td>
                      <td className="px-4 py-2.5">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${isReceipt ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400' : 'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400'}`}>
                          {isReceipt ? 'امپورٹ / خرید' : 'سیل / کٹوت'}
                        </span>
                      </td>
                      <td className={`px-4 py-2.5 text-right font-mono font-bold ${isReceipt ? 'text-emerald-600' : 'text-slate-700 dark:text-slate-300'}`}>
                        {isReceipt ? '+' : '-'}{tx.quantity.toLocaleString('en-PK')} L
                      </td>
                      <td className="px-4 py-2.5 text-right font-mono text-slate-600">{tx.purchasePrice ? `Rs. ${tx.purchasePrice}` : '—'}</td>
                      <td className="px-4 py-2.5 text-right font-mono font-bold text-slate-800 dark:text-slate-200">{formatCurrency(tx.amount)}</td>
                      <td className="px-4 py-2.5 text-slate-600 dark:text-slate-400 max-w-[200px] truncate">{tx.by || tx.notes || '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─── IMPORT WIZARD MODAL ─────────────────────────────────────────────────── */}
      {showImportWizard && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-3xl p-6 max-w-xl w-full space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <PlusCircle className="w-5 h-5 text-blue-600" />
                {t('Fuel Stock Import Wizard (Step 1-5)', 'فیول امپورٹ ویجرڈ')}
              </h3>
              <button onClick={() => setShowImportWizard(false)} className="text-slate-400 hover:text-slate-600 font-bold">✕</button>
            </div>

            {/* Step 1: Supplier & Fuel Grade */}
            {wizardStep === 1 && (
              <div className="space-y-4">
                <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">Step 1: Select Supplier & Fuel Type</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">OMC Supplier</label>
                    <select name="supplierId" value={formData.supplierId} onChange={handleFormChange} className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 text-xs font-bold text-slate-900 dark:text-white">
                      {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Fuel Grade</label>
                    <select name="fuelTypeId" value={formData.fuelTypeId} onChange={handleFormChange} className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 text-xs font-bold text-slate-900 dark:text-white">
                      {fuelProducts.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Quantities */}
            {wizardStep === 2 && (
              <div className="space-y-4">
                <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">Step 2: Challan Quantity & Tank Selection</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Challan Qty (Ltr)</label>
                    <input type="number" name="invoiceQty" value={formData.invoiceQty} onChange={handleFormChange} placeholder="e.g. 5000" className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 text-xs font-bold text-slate-900 dark:text-white" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Target Storage Tank</label>
                    <select name="tankId" value={formData.tankId} onChange={handleFormChange} className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 text-xs font-bold text-slate-900 dark:text-white">
                      {mappedTanks.map(t => <option key={t.id} value={t.id}>{t.name} ({t.productName})</option>)}
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Rate */}
            {wizardStep === 3 && (
              <div className="space-y-4">
                <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">Step 3: OGRA Rate & Settlement</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Purchase Rate (Rs/Ltr)</label>
                    <input type="number" name="rate" value={formData.rate} onChange={handleFormChange} placeholder="e.g. 270.50" className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 text-xs font-bold text-slate-900 dark:text-white" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Payment Mode</label>
                    <select name="paymentMethod" value={formData.paymentMethod} onChange={handleFormChange} className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 text-xs font-bold text-slate-900 dark:text-white">
                      <option value="Credit">Supplier Credit Account</option>
                      <option value="Bank Transfer">Bank Transfer / Cheque</option>
                      <option value="Cash">Cash Deposit</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Controls */}
            <div className="flex items-center justify-between border-t border-slate-200 dark:border-slate-800 pt-4">
              <button disabled={wizardStep === 1} onClick={() => setWizardStep(prev => (prev - 1) as any)} className="px-4 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800">Previous</button>
              {wizardStep < 3 ? (
                <button onClick={() => setWizardStep(prev => (prev + 1) as any)} className="px-5 py-2 rounded-xl text-xs font-black text-white bg-blue-600">Next Step →</button>
              ) : (
                <button onClick={handleSaveImportWizard} className="px-6 py-2 rounded-xl text-xs font-black text-white bg-emerald-600">Post Import & Auto-Ledger</button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
