/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { ResponsiveTable, TableColumn } from '../shared/ResponsiveTable';
import { motion, AnimatePresence } from 'motion/react';
import { useStation } from '../../contexts/StationContext';
import {
  Package,
  ArrowUpRight,
  ArrowDownRight,
  AlertTriangle,
  Search,
  PlusCircle,
  History,
  FileSpreadsheet,
  Layers,
  Wrench,
  CheckCircle,
  BarChart4,
  Layers3,
  Calculator,
  ArrowDownCircle,
  Clock,
  TrendingUp,
  X,
  Gauge,
  Pencil,
  Trash2,
  Sparkles,
  Award,
  Flame,
  Wallet,
  ShieldAlert,
  BarChart2
} from 'lucide-react';
import { Product, StockTransaction, Supplier, GlobalSettings, Tank, RateHistoryEntry } from '../../types';
import { fetchWithAuth } from '../../lib/api';
import { ModuleSearchBar } from '../shared/ModuleSearchBar';
import { ExportToolbar } from '../shared/ExportToolbar';
import { BottomSheet } from '../shared/BottomSheet';
import StockInForm from './StockInForm';
import BatchHistory from './BatchHistory';
import { useInventoryStore } from '../../stores/useInventoryStore';
import { useSupplierStore } from '../../stores/useSupplierStore';
import InventoryDrillDownModal from './ExecutiveDashboard/InventoryDrillDownModal';
import InventoryAgingDashboard from './InventoryAgingDashboard';
import SupplierScorecard from './SupplierCommandCenter/SupplierScorecard';
import SupplierPayablesPanel from './SupplierCommandCenter/SupplierPayablesPanel';
import SupplierClaimsPanel from './SupplierCommandCenter/SupplierClaimsPanel';

interface InventoryProps {
  settings: GlobalSettings;
  activeStationId: string;
  products: Product[];
  suppliers: Supplier[];
  stockTransactions: StockTransaction[];
  onAddStockTransaction: (txn: StockTransaction) => void;
  onUpdateProductStock: (productId: string, newStock: number) => void;
  onUpdateProduct: (product: Product) => void;
  onDeleteProduct: (productId: string) => void;
  onAddProduct: (product: Product) => void;
  tanks: Tank[];
  rateHistory: RateHistoryEntry[];
}

export default function Inventory({
  settings,
  activeStationId,
  products,
  suppliers,
  stockTransactions,
  onAddStockTransaction,
  onUpdateProductStock,
  onUpdateProduct,
  onDeleteProduct,
  onAddProduct,
  tanks = [],
  rateHistory = []
}: InventoryProps) {
  const { showConfirm, showToast } = useStation();
  const isUrdu = settings.language === 'ur';
  const t = (en: string, ur: string) => (isUrdu ? ur : en);

  // Single source of truth: use activeStationId, not product-type heuristic
  const isLube = activeStationId === 'st_lube';
  const { stockBatches, supplierClaims } = useInventoryStore(useShallow(state => ({
    stockBatches: state.stockBatches,
    supplierClaims: state.supplierClaims
  })));
  const { suppliers: storeSuppliers, handleUpdateSupplier } = useSupplierStore(useShallow(state => ({
    suppliers: state.suppliers,
    handleUpdateSupplier: state.handleUpdateSupplier
  })));

  // Merge passed-in suppliers with store (store is source of truth for balances)
  const allSuppliers = useMemo(() => {
    const storeMap = new Map(storeSuppliers.map(s => [s.id, s]));
    return suppliers.map(s => storeMap.get(s.id) || s);
  }, [suppliers, storeSuppliers]);

  // Filter States
  const [activeTab, setActiveTab] = useState<'inventory' | 'tanks_calibration' | 'pricing_logs' | 'batch_history' | 'aging' | 'supplier_perf' | 'payables' | 'claims'>('inventory');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'fuel' | 'lube' | 'low'>('all');
  const [isInventoryDrillDownOpen, setIsInventoryDrillDownOpen] = useState(false);
  const [isAuditSheetOpen, setIsAuditSheetOpen] = useState(false);

  // Interactive Calibrator Calculator
  const [calcTankId, setCalcTankId] = useState('');
  const [calcDepthCm, setCalcDepthCm] = useState('');
  const [showExport, setShowExport] = useState(false);

  // Modal state for Add/Edit Product
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Add/Edit Product form fields
  const [prodName, setProdName] = useState('');
  const [prodUrduName, setProdUrduName] = useState('');
  const [prodRate, setProdRate] = useState('');
  const [prodUnit, setProdUnit] = useState('Pcs');
  const [prodType, setProdType] = useState<'lube' | 'fuel' | 'other'>('lube');
  const [prodMinStock, setProdMinStock] = useState('');
  const [prodOpeningStock, setProdOpeningStock] = useState('');

  const openAddProduct = () => {
    setEditingProduct(null);
    setProdName(''); setProdUrduName(''); setProdRate(''); setProdUnit('Pcs');
    // Default type is 'fuel' for fuel stations, 'lube' for lube businesses
    setProdType(isLube ? 'lube' : 'fuel');
    setProdMinStock(''); setProdOpeningStock('');
    setShowAddProductModal(true);
  };

  const openEditProduct = (prod: Product) => {
    setEditingProduct(prod);
    setProdName(prod.name); setProdUrduName(prod.urduName); setProdRate(String(prod.rate));
    setProdUnit(prod.unit); setProdType(prod.type as any); setProdMinStock(String(prod.minStock));
    setProdOpeningStock(String(prod.currentStock));
    setShowAddProductModal(true);
  };

  const handleProductModalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prodName || !prodRate) return;
    if (editingProduct) {
      onUpdateProduct({
        ...editingProduct,
        name: prodName,
        urduName: prodUrduName || prodName,
        rate: Number(prodRate),
        unit: prodUnit,
        type: prodType,
        minStock: Number(prodMinStock) || 0
      });
    } else {
      onAddProduct({
        id: `prod_${Date.now()}`,
        name: prodName,
        urduName: prodUrduName || prodName,
        rate: Number(prodRate),
        unit: prodUnit,
        type: prodType,
        currentStock: Number(prodOpeningStock) || 0,
        minStock: Number(prodMinStock) || 0,
        capacity: 0
      });
    }
    setShowAddProductModal(false);
  };

  const handleDeleteProduct = (prod: Product) => {
    const msg = t(
      `Are you sure you want to delete "${prod.name}"? This cannot be undone.`,
      `کیا آپ "${prod.urduName}" کو حذف کرنا چاہتے ہیں؟ یہ واپس نہیں ہو سکتا۔`
    );
    showConfirm(
      t('Confirm Product Deletion', 'پروڈکٹ حذف کرنے کی تصدیق'),
      msg,
      () => {
        onDeleteProduct(prod.id);
      }
    );
  };

  // Input States
  const [showAddStockModal, setShowAddStockModal] = useState(false);
  const [showReconcileModal, setShowReconcileModal] = useState(false);

  // New stock receipt form states
  const [selectedProductId, setSelectedProductId] = useState(products[0]?.id || '');
  const [supplierId, setSupplierId] = useState(suppliers[0]?.id || '');
  const [receiptQty, setReceiptQty] = useState('');
  const [receiptCost, setReceiptCost] = useState('');
  const [invoiceRef, setInvoiceRef] = useState('');
  const [selectedTankId, setSelectedTankId] = useState('');

  // Expanded stock fields state
  const [purchasePrice, setPurchasePrice] = useState('');
  const [sellingPrice, setSellingPrice] = useState('');
  const [fuelType, setFuelType] = useState('Petrol');
  const [carriageCost, setCarriageCost] = useState('');

  // Reconciliation form states
  const [reconProductId, setReconProductId] = useState(products[0]?.id || '');
  const [reconActualQty, setReconActualQty] = useState('');
  const [reconReason, setReconReason] = useState('');

  // Memoized product subtypes based on first selection for Stock Receipt
  const productSubtypes = useMemo(() => {
    const selectedProd = products.find(p => p.id === selectedProductId);
    if (!selectedProd) return [];
    
    const nameLower = selectedProd.name.toLowerCase();
    if (selectedProd.id === 'petrol' || nameLower.includes('petrol')) {
      return [
        { value: 'Petrol', label: t('Super Petrol (PMG)', 'سپر پیٹرول') },
        { value: 'High-Octane', label: t('High Octane (HOBC)', 'ہائی اوکٹین') }
      ];
    } else if (selectedProd.id === 'diesel' || nameLower.includes('diesel')) {
      return [
        { value: 'Diesel', label: t('High Speed Diesel (HSD)', 'ڈیزل') },
        { value: 'Diesel A', label: t('Diesel A', 'ڈیزل اے') }
      ];
    } else if (selectedProd.id === 'cng' || nameLower.includes('cng')) {
      return [
        { value: 'CNG', label: t('Compressed Natural Gas (CNG)', 'سی این جی') }
      ];
    } else {
      return [
        { value: 'Lube / Oil', label: t('Lubricants / Lube Oil', 'موبل آئل') }
      ];
    }
  }, [selectedProductId, products, isUrdu]);

  // Sync selected subtype
  React.useEffect(() => {
    if (productSubtypes.length > 0) {
      const exists = productSubtypes.some(sub => sub.value === fuelType);
      if (!exists) {
        setFuelType(productSubtypes[0].value);
      }
    }
  }, [productSubtypes, fuelType]);

  // Auto-calculate Total Base Value
  React.useEffect(() => {
    const qty = parseFloat(receiptQty) || 0;
    const rate = parseFloat(purchasePrice) || 0;
    const computedTotal = qty * rate;
    setReceiptCost(computedTotal > 0 ? computedTotal.toString() : '');
  }, [receiptQty, purchasePrice]);

  // Auto-initialize stock modal dropdown values on open
  React.useEffect(() => {
    if (showAddStockModal && products.length > 0) {
      setSelectedProductId(products[0].id);
      if (suppliers.length > 0) {
        setSupplierId(suppliers[0].id);
      }
    }
  }, [showAddStockModal, products, suppliers]);

  // Auto-initialize reconciliation modal values on open
  React.useEffect(() => {
    if (showReconcileModal && products.length > 0) {
      setReconProductId(products[0].id);
    }
  }, [showReconcileModal, products]);

  // Auto-select first matching storage tank when selected product changes
  React.useEffect(() => {
    if (!selectedProductId) {
      setSelectedTankId('');
      return;
    }
    const matchingTanks = tanks.filter(t => t.productId === selectedProductId);
    if (matchingTanks.length > 0) {
      setSelectedTankId(matchingTanks[0].id);
    } else {
      setSelectedTankId('');
    }
  }, [selectedProductId, tanks]);

  // Memoized filter lists
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesSearch = 
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        p.urduName.includes(searchQuery);

      if (!matchesSearch) return false;

      if (filterType === 'fuel') return p.type === 'fuel';
      if (filterType === 'lube') return p.type === 'lube';
      if (filterType === 'low') return p.currentStock <= p.minStock;
      
      return true;
    });
  }, [products, searchQuery, filterType, isLube]);

  const exportColumns = [
    { key: 'name', label: 'Product Name', urduLabel: 'پروڈکٹ کا نام' },
    { key: 'type', label: 'Type', urduLabel: 'قسم' },
    { key: 'currentStock', label: 'Current Stock', urduLabel: 'موجودہ اسٹاک' },
    { key: 'unit', label: 'Unit', urduLabel: 'یونٹ' },
    { key: 'rate', label: 'Rate', urduLabel: 'ریٹ' },
    { key: 'purchasePrice', label: 'Purchase Price', urduLabel: 'خرید قیمت' }
  ];

  // Calibration lookup result
  const calculatedCalibratedVolume = useMemo(() => {
    if (!calcTankId) return null;
    const tnk = tanks.find(t => t.id === calcTankId);
    if (!tnk || !calcDepthCm) return null;

    const cmVal = Math.round(Number(calcDepthCm));
    if (isNaN(cmVal) || cmVal < 0) return null;

    // Search exact matches or linear interpolate
    const sortedChart = [...(tnk.dipChart || [])].sort((a, b) => a.cm - b.cm);
    if (sortedChart.length === 0) return null;

    // Exact match
    const exact = sortedChart.find(x => x.cm === cmVal);
    if (exact) return exact.liters;

    // Boundary check
    if (cmVal <= sortedChart[0].cm) return sortedChart[0].liters;
    if (cmVal >= sortedChart[sortedChart.length - 1].cm) return sortedChart[sortedChart.length - 1].liters;

    // Find interpolation interval
    for (let i = 0; i < sortedChart.length - 1; i++) {
      const p1 = sortedChart[i];
      const p2 = sortedChart[i + 1];
      if (cmVal >= p1.cm && cmVal <= p2.cm) {
        // Linear interpolation
        const fraction = (cmVal - p1.cm) / (p2.cm - p1.cm);
        return Math.round(p1.liters + fraction * (p2.liters - p1.liters));
      }
    }
    return null;
  }, [calcTankId, calcDepthCm, tanks]);

  // Aggregate stats
  const totalFuelVolume = useMemo(() => {
    return (tanks && tanks.length > 0)
      ? tanks.reduce((sum, t) => sum + t.currentStock, 0)
      : products.filter(p => p.type === 'fuel').reduce((sum, p) => sum + p.currentStock, 0);
  }, [products, tanks]);

  const totalLubricantsQty = useMemo(() => {
    return products
      .filter(p => p.type === 'lube')
      .reduce((sum, p) => sum + p.currentStock, 0);
  }, [products]);

  const lowStockCount = useMemo(() => {
    return products.filter(p => p.currentStock <= p.minStock).length;
  }, [products]);


  // ==========================================
  // AI Stock Analysis State
  // ==========================================
  const [isGeneratingAiInsights, setIsGeneratingAiInsights] = useState(false);
  const [aiInsightsResult, setAiInsightsResult] = useState<string | null>(null);

  const generateAIStockInsights = async () => {
    setIsGeneratingAiInsights(true);
    setAiInsightsResult(null);
    try {
      const inventoryContext = {
        isLube,
        totalFuelVolume,
        totalLubricantsQty,
        lowStockCount,
        products: products.map(p => ({ name: p.name, type: p.type, current: p.currentStock, min: p.minStock, unit: p.unit })),
        tanks: tanks.map(t => ({ name: t.name, product: t.productId, fillPct: Math.round((t.currentStock / t.capacity) * 100), isLow: t.currentStock < t.criticalLevel }))
      };

      const response = await fetchWithAuth('/api/ai-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemPrompt: 'You are an AI inventory manager for a fuel station. Analyze the current stock levels, highlight low stock alerts, and suggest reorder quantities or strategic actions in 3-4 concise sentences.',
          userMessage: JSON.stringify(inventoryContext),
          language: settings.language,
          conversationHistory: []
        })
      });

      if (!response.ok) throw new Error('Failed to generate AI insights');
      const data = await response.json();
      setAiInsightsResult(data.reply);
    } catch (error) {
      console.error(error);
      setAiInsightsResult(t("⚠️ Could not generate AI stock analysis.", "⚠️ اسٹاک کا اے آئی تجزیہ تیار نہیں ہو سکا۔"));
    } finally {
      setIsGeneratingAiInsights(false);
    }
  };

  // ==========================================
  // HANDLERS
  // ==========================================

  const handleAddStockSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const qty = Number(receiptQty);
    const cost = Number(receiptCost);

    if (!selectedProductId || qty <= 0) {
       showToast(t('Please fill all fields with correct numbers.', 'درست اندراج کیجئے۔'), 'error');
       return;
    }

    const prod = products.find(p => p.id === selectedProductId);
    if (!prod) return;

    if (!isLube && prod.type === 'fuel' && !selectedTankId) {
       showToast(t('Please select a storage tank for fuel delivery.', 'براہ کرم فیول کے لیے ٹینک منتخب کریں۔'), 'error');
       return;
    }

    // Create stockTransaction
    const newTxn: StockTransaction = {
      id: `stk_${Date.now()}`,
      itemId: selectedProductId,
      type: 'receipt',
      quantity: qty,
      by: invoiceRef || t(`Supplier Delivery Receipt`, `سپلائر گاڑی سپلائی`),
      date: new Date().toISOString().split('T')[0],
      amount: cost || undefined,
      purchasePrice: Number(purchasePrice) || (cost / (qty || 1)),
      sellingPrice: Number(sellingPrice) || undefined,
      fuelType: fuelType,
      supplierId: supplierId,
      carriageCost: Number(carriageCost) || undefined,
      tankId: (!isLube && prod.type === 'fuel') ? selectedTankId : undefined
    };

    onAddStockTransaction(newTxn);

    // Reset Form
    setReceiptQty('');
    setReceiptCost('');
    setInvoiceRef('');
    setPurchasePrice('');
    setSellingPrice('');
    setFuelType('Petrol');
    setCarriageCost('');
    setSelectedTankId('');
    setShowAddStockModal(false);
    showToast(t('Stock inventory updated successfully!', 'اسٹاک بک اپ ڈیٹ ہو گئی ہے!'), 'success');
  };

  const handleReconcileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const actual = Number(reconActualQty);

    if (!reconProductId || isNaN(actual) || actual < 0) {
      showToast(t('Please enter a valid actual stock level.', 'براہ مہربانی درست اسٹاک مقدار درج کریں۔'), 'error');
      return;
    }

    const prod = products.find(p => p.id === reconProductId);
    if (!prod) return;

    const diff = actual - prod.currentStock;
    if (diff === 0) {
      showToast(t('No difference found. No adjustments saved.', 'کوئی فرق نہیں پایا گیا۔'), 'info');
      return;
    }

    // Capture stock reconciliation transaction log
    const newTxn: StockTransaction = {
      id: `stk_${Date.now()}`,
      itemId: reconProductId,
      type: 'adjustment',
      quantity: diff, // Positive for gain, negative for loss wastage
      by: reconReason || t(`Physical Dip reconciliation check`, `فزیکل ڈپ پیمائش پڑتال`),
      date: new Date().toISOString().split('T')[0]
    };

    onAddStockTransaction(newTxn);
    onUpdateProductStock(reconProductId, actual);

    // Reset Form
    setReconActualQty('');
    setReconReason('');
    setShowReconcileModal(false);
    showToast(t('Inventory reconciled, stock adjusted!', 'اسٹاک کی جسمانی تصدیق اور تصحیح ہو چکی ہے!'), 'success');
  };

  return (
    <div className="space-y-6 pb-20 lg:pb-5">
      {showExport && (
        <ExportToolbar
          isOpen={showExport}
          data={filteredProducts}
          columns={exportColumns}
          title="Inventory Report"
          filenamePrefix="inventory-report"
          onClose={() => setShowExport(false)}
        />
      )}

      {/* HEADER SECTION */}
      <div className="fp-header flex-col items-start gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-theme-main pb-3 mb-4">
        <div className="flex flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5 text-orange-600 shrink-0" />
            <h1 className="text-lg font-black text-slate-800 dark:text-slate-100 truncate">
              {isLube
                ? t('Product Inventory', 'پروڈکٹ انوینٹری')
                : t('Inventory & Tanks', 'ٹینکس اسٹاک')}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar w-full sm:w-auto">
          <button
            onClick={generateAIStockInsights}
            disabled={isGeneratingAiInsights || products.length === 0}
            className={`shrink-0 flex items-center justify-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 font-sans text-xs font-bold text-white hover:bg-indigo-700 transition-all cursor-pointer ${isGeneratingAiInsights ? 'opacity-50' : ''}`}
          >
            <Sparkles className={`h-3.5 w-3.5 ${isGeneratingAiInsights ? 'animate-spin' : ''}`} />
            <span>{t('Insights', 'تجزیہ')}</span>
          </button>

          <button
            onClick={() => setShowReconcileModal(true)}
            className="shrink-0 flex items-center justify-center gap-1.5 rounded-lg border border-orange-500/20 bg-orange-500/10 px-3 py-1.5 font-sans text-xs font-bold text-orange-600 hover:bg-orange-500/20 transition-all cursor-pointer"
          >
            <CheckCircle className="h-3.5 w-3.5" />
            <span>{isLube ? t('Count', 'جسمانی اسٹاک') : t('Reconcile', 'فزیکل ٹینک ڈپ')}</span>
          </button>

          <button
            onClick={() => setShowAddStockModal(true)}
            className="shrink-0 flex items-center justify-center gap-1.5 rounded-lg bg-orange-600 px-3 py-1.5 font-sans text-xs font-bold text-white hover:bg-orange-700 transition-all cursor-pointer"
          >
            <PlusCircle className="h-3.5 w-3.5" />
            <span>{t('Receipt', 'نیا اسٹاک')}</span>
          </button>

          {/* Register Product — only shown for Lube businesses */}
          {isLube && (
          <button
            onClick={openAddProduct}
            className="shrink-0 flex items-center justify-center gap-1.5 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 font-sans text-xs font-bold text-emerald-600 hover:bg-emerald-500/20 transition-all cursor-pointer"
          >
            <PlusCircle className="h-3.5 w-3.5" />
            <span>{t('Product', 'نئی پروڈکٹ')}</span>
          </button>
          )}
        </div>
      </div>

      {aiInsightsResult && (
        <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-4 shadow-sm relative">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="h-4 w-4 text-indigo-500" />
            <span className="font-bold text-indigo-800 text-sm">{t('AI Stock Analysis', 'اے آئی اسٹاک تجزیہ')}</span>
          </div>
          <div className="prose prose-sm max-w-none text-indigo-900 whitespace-pre-wrap leading-relaxed text-xs">
            {aiInsightsResult}
          </div>
        </div>
      )}

      {/* UNIVERSAL MODULE SEARCH BAR */}
      <ModuleSearchBar
        moduleName={t('Inventory', 'انوینٹری')}
        placeholder={t('Search products...', 'پراڈکٹ تلاش کریں...')}
        onSearch={setSearchQuery}
        onFilter={() => setFilterType(prev => prev === 'all' ? (isLube ? 'lube' : 'fuel') : 'all')}
        onExport={() => showToast(t('Export coming soon', 'ایکسپورٹ جلد آرہا ہے'), 'info')}
      />

      {/* BEN-TO ROW INVENTORY STATS OVERVIEWS */}
      <div className={`grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 min-h-[90px] gap-3 sm:gap-4 ${isLube ? 'sm:grid-cols-3' : 'sm:grid-cols-2'}`}>
        {/* Total Fuels — hidden for lube businesses */}
        {!isLube && (
        <div 
           className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs flex items-center gap-3 cursor-pointer hover:border-orange-300 hover:bg-orange-50/30 transition-colors group"
           onClick={() => setIsInventoryDrillDownOpen(true)}
           title="Open Enterprise Inventory Intelligence"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-orange-600 group-hover:scale-110 transition-transform">
            <Layers className="h-5 w-5" />
          </div>
          <div>
            <span className="font-sans text-[10px] font-bold text-slate-400 uppercase tracking-widest block group-hover:text-orange-500 transition-colors">{t('Total Fuel In Storage Tanks', 'ٹینکس میں موجود کل فیول والیم')}</span>
            <strong className="font-mono text-base font-bold text-slate-800 tracking-tight mt-1 block">
              {totalFuelVolume.toLocaleString()} Litres
            </strong>
          </div>
        </div>
        )}

        {/* Total Lubes — ONLY shown for lube businesses */}
        {isLube && (
        <div 
           className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs flex items-center gap-3 cursor-pointer hover:border-sky-300 hover:bg-sky-50/30 transition-colors group"
           onClick={() => setIsInventoryDrillDownOpen(true)}
           title="Open Enterprise Inventory Intelligence"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-sky-600 group-hover:scale-110 transition-transform">
            <Package className="h-5 w-5" />
          </div>
          <div>
            <span className="font-sans text-[10px] font-bold text-slate-400 uppercase tracking-widest block group-hover:text-sky-600 transition-colors">{t('Lubricants / Accessories', 'کل انجن آئل اسٹاک')}</span>
            <strong className="font-mono text-base font-bold text-slate-800 tracking-tight mt-1 block">
              {totalLubricantsQty.toLocaleString()} Units
            </strong>
          </div>
        </div>
        )}

        {/* Low warning stock items */}
        <div className={`rounded-xl border p-4 shadow-xs flex items-center gap-3 transition-colors ${lowStockCount > 0 ? 'border-red-250 bg-red-50/20' : 'border-slate-200 bg-white'}`}>
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${lowStockCount > 0 ? 'bg-red-100 text-red-655' : 'bg-slate-100 text-slate-400'}`}>
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div>
            <span className="font-sans text-[10px] font-bold text-slate-400 uppercase tracking-widest block">{t('Low Stock Alarms', 'انتباہی اسٹاک الرٹ')}</span>
            <strong className={`font-mono text-base font-bold tracking-tight mt-1 block ${lowStockCount > 0 ? 'text-red-650' : 'text-slate-800'}`}>
              {lowStockCount} {t('Products Low', 'آئٹم انتہائی کم')}
            </strong>
          </div>
        </div>
      </div>

      {/* SUBTABS BAR */}
      <div className="fp-date-tabs mt-4">
        <button
          onClick={() => setActiveTab('inventory')}
          className={`fp-date-tab ${
            activeTab === 'inventory'
              ? 'fp-date-tab--active !text-orange-600 !border-orange-600 bg-orange-50/50 dark:bg-orange-500/10'
              : ''
          }`}
        >
          📦 {t('Product Stock List', 'پراڈکٹس اسٹاک لسٹ')}
        </button>

        {!isLube && (
        <button
          onClick={() => setActiveTab('tanks_calibration')}
          className={`fp-date-tab ${
            activeTab === 'tanks_calibration'
              ? 'fp-date-tab--active !text-orange-600 !border-orange-600 bg-orange-50/50 dark:bg-orange-500/10'
              : ''
          }`}
        >
          🛢️ {t('Storage Tanks & Calibration Dip Chart', 'سٹوریج ٹینکس اور الیکٹرانک ڈپ ناپ')}
        </button>
        )}

        <button
          onClick={() => setActiveTab('pricing_logs')}
          className={`fp-date-tab ${
            activeTab === 'pricing_logs'
              ? 'fp-date-tab--active !text-orange-600 !border-orange-600 bg-orange-50/50 dark:bg-orange-500/10'
              : ''
          }`}
        >
          📈 {t('Price Revisions History Log', 'ریٹ تبدیلی اور اسٹاک نفع نقصان')}
        </button>

        <button
          onClick={() => setActiveTab('batch_history')}
          className={`fp-date-tab ${
            activeTab === 'batch_history'
              ? 'fp-date-tab--active !text-orange-600 !border-orange-600 bg-orange-50/50 dark:bg-orange-500/10'
              : ''
          }`}
        >
          🏷️ {t('FIFO Batches', 'فیفو بیچز')}
        </button>

        {!isLube && (
        <button
          onClick={() => setActiveTab('aging')}
          className={`fp-date-tab ${
            activeTab === 'aging'
              ? 'fp-date-tab--active !text-orange-600 !border-orange-600 bg-orange-50/50 dark:bg-orange-500/10'
              : ''
          }`}
        >
          🔥 {t('Aging Intel', 'عمر تجزیہ')}
          {stockBatches.filter(b => b.qtyRemaining > 0 && (() => { const d = new Date().getTime() - new Date(b.deliveryDate || b.date).getTime(); return Math.floor(d / 86400000) > 60; })()).length > 0 && (
            <span className="ml-1 px-1.5 py-0.5 rounded-full text-[9px] font-black bg-red-600 text-white animate-pulse">
              !
            </span>
          )}
        </button>
        )}

        <button
          onClick={() => setActiveTab('supplier_perf')}
          className={`fp-date-tab ${
            activeTab === 'supplier_perf'
              ? 'fp-date-tab--active !text-orange-600 !border-orange-600 bg-orange-50/50 dark:bg-orange-500/10'
              : ''
          }`}
        >
          🏆 {t('Supplier Scores', 'سپلائر اسکور')}
        </button>

        <button
          onClick={() => setActiveTab('payables')}
          className={`fp-date-tab ${
            activeTab === 'payables'
              ? 'fp-date-tab--active !text-orange-600 !border-orange-600 bg-orange-50/50 dark:bg-orange-500/10'
              : ''
          }`}
        >
          💳 {t('Payables', 'واجبات')}
          {allSuppliers.filter(s => s.balance > 0).length > 0 && (
            <span className="ml-1 px-1.5 py-0.5 rounded-full text-[9px] font-black bg-amber-500 text-white">
              {allSuppliers.filter(s => s.balance > 0).length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('claims')}
          className={`fp-date-tab ${
            activeTab === 'claims'
              ? 'fp-date-tab--active !text-orange-600 !border-orange-600 bg-orange-50/50 dark:bg-orange-500/10'
              : ''
          }`}
        >
          ⚖️ {t('Claims', 'کلیمز')}
          {supplierClaims.filter(c => c.status === 'pending' || c.status === 'submitted').length > 0 && (
            <span className="ml-1 px-1.5 py-0.5 rounded-full text-[9px] font-black bg-red-600 text-white">
              {supplierClaims.filter(c => c.status === 'pending' || c.status === 'submitted').length}
            </span>
          )}
        </button>
      </div>

      {/* CORE ACTIVE WORKSPACE MODULES */}
      {activeTab === 'inventory' && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* LEFT PANEL (2/3 WIDTH): PRODUCTS DATABASE DETAIL BOARD */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex flex-col gap-3.5 sm:flex-row items-center sm:justify-between">
              {/* Categorization controls */}
              <div className="fp-date-tabs w-full sm:w-auto">
                {[
                  { id: 'all', label: 'All Stock', urdu: 'کل اسٹاک', show: true },
                  { id: 'fuel', label: 'Fuels Only', urdu: 'صرف پیٹرولیم', show: !isLube },
                  { id: 'lube', label: 'Lubes & Oils', urdu: 'انجن آئل', show: isLube },
                  { id: 'low', label: 'Low Alert', urdu: 'انتباہی اسٹاک', show: true }
                ].filter(f => f.show).map(f => (
                  <button
                    key={f.id}
                    onClick={() => setFilterType(f.id as any)}
                    className={`fp-date-tab flex-1 sm:flex-none ${
                      filterType === f.id
                        ? 'fp-date-tab--active !text-slate-800 dark:!text-slate-100 !border-slate-800 dark:!border-slate-500 bg-slate-200/50 dark:bg-slate-700/50'
                        : ''
                    }`}
                  >
                    {t(f.label, f.urdu)}
                  </button>
                ))}
              </div>
            </div>

            {/* Mobile Actions: Show Audit Log */}
            <div className="lg:hidden w-full flex justify-end mb-4">
              <button
                onClick={() => setIsAuditSheetOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-theme-card text-slate-700 dark:text-slate-300 font-bold rounded-lg shadow-sm border border-theme-main text-xs"
              >
                <History className="w-3.5 h-3.5" />
                {t('Audit Logs', 'آڈٹ لاگز')}
              </button>
            </div>

            {/* PRODUCT LISTING CARD GRID */}
            <div className="grid grid-cols-1 sm:grid-cols-1 lg:grid-cols-3 gap-4">
              <AnimatePresence>
                {filteredProducts.map((prod, idx) => {
                  const capacity = prod.capacity || 100;
                  const fillPct = prod.type === 'fuel' ? Math.round((prod.currentStock / capacity) * 100) : null;
                  const isLow = prod.currentStock <= prod.minStock;

                  return (
                    <motion.div 
                      layout
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      key={prod.id} 
                      className="kpi-card p-2 group"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="truncate pr-2">
                          <strong className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate block group-hover:text-orange-600 transition-colors leading-tight">{t(prod.name, prod.urduName)}</strong>
                          <span className="text-[9px] uppercase font-bold text-slate-400 mt-0.5 block truncate">
                            {prod.type === 'fuel' ? t('Fuel Product', 'پٹرولیم پراڈکٹ') : prod.type === 'lube' ? t('Lubricant / Oil', 'لیوب آئل') : t('Other Item', 'دیگر آئٹم')}
                          </span>
                        </div>
                        {isLow ? (
                          <span className="shrink-0 rounded bg-red-500/10 text-red-600 px-1.5 py-0.5 text-[9px] font-bold uppercase select-none border border-red-500/20">
                            {t('LOW', 'اسٹاک کم')}
                          </span>
                        ) : (
                          <span className="shrink-0 rounded bg-emerald-500/10 text-emerald-600 px-1.5 py-0.5 text-[9px] font-bold uppercase select-none">
                            {t('OK', 'اسٹاک مناسب')}
                          </span>
                        )}
                      </div>

                      {/* Visual liquid volume indicator if fuel */}
                      {prod.type === 'fuel' && fillPct !== null && (
                        <div className="space-y-1 py-0.5">
                          <div className="flex justify-between items-center text-[9px] font-mono font-bold text-slate-500">
                            <span>{t('Tank Level', 'ٹینکر پوزیشن')}</span>
                            <span className={fillPct < 20 ? 'text-red-500' : fillPct < 50 ? 'text-orange-500' : 'text-teal-600'}>{fillPct}%</span>
                          </div>
                          <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div 
                              style={{ width: `${Math.min(100, fillPct)}%` }} 
                              className={`h-full rounded-full transition-all duration-1000 ${fillPct < 20 ? 'bg-red-500' : fillPct < 50 ? 'bg-orange-500' : 'bg-teal-500'}`}
                            />
                          </div>
                        </div>
                      )}

                      <div className="flex justify-between items-center py-2 border-t border-b border-theme-main text-slate-700 dark:text-slate-300 font-mono text-[10px] mt-1.5 mb-1.5">
                        <div className="truncate">
                          <span className="text-slate-400 dark:text-slate-500 text-[9px] uppercase block font-sans truncate">{t('Stock', 'اسٹاک')}</span>
                          <strong className="text-slate-900 dark:text-slate-100 text-sm font-bold truncate block">{prod.currentStock.toLocaleString()} <span className="text-[10px] text-slate-500">{prod.unit}</span></strong>
                        </div>
                        <div className="text-right truncate pl-2">
                          <span className="text-slate-400 dark:text-slate-500 text-[9px] uppercase block font-sans truncate">{t('Price', 'قیمت')}</span>
                          <strong className="text-orange-600 text-sm font-bold truncate block">Rs. {prod.rate.toFixed(2)}</strong>
                        </div>
                      </div>

                      <div className="flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50 p-1.5 rounded text-[9px] font-bold text-slate-500 mb-2">
                        <span>Min: <strong className="text-slate-700 dark:text-slate-300">{prod.minStock.toLocaleString()}</strong></span>
                        <span className="uppercase">Unit: {prod.unit}</span>
                      </div>

                      {/* Edit / Delete action bar */}
                      <div className="flex gap-1.5">
                        <button
                          onClick={() => openEditProduct(prod)}
                          className="flex-1 flex items-center justify-center gap-1 py-1 rounded bg-theme-card border border-theme-main text-slate-600 dark:text-slate-300 hover:border-orange-500 hover:text-orange-500 font-bold text-[10px] transition-colors"
                        >
                          <Pencil className="h-3 w-3" />
                          {t('Edit', 'ترمیم')}
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(prod)}
                          className="flex items-center justify-center gap-1 px-2 py-1 rounded bg-red-500/10 text-red-600 hover:bg-red-500/20 font-bold text-[10px] transition-colors"
                        >
                          <Trash2 className="h-3 w-3" />
                          {t('Del', 'حذف')}
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          </div>

          {/* RIGHT SIDEBAR (1/3 WIDTH): DETAILED LIVE REAL-TIME STOCK TRANSACTION LEDGER */}
          <div className="hidden lg:block bg-theme-card rounded-xl border border-theme-main p-3 shadow-sm space-y-3">
            <h3 className="font-sans text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5 border-b border-theme-main pb-2">
              <History className="h-3.5 w-3.5" />
              <span>{t('Inventory Audits', 'اسٹاک آڈٹ')}</span>
            </h3>

            <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
              {stockTransactions.length === 0 ? (
                <p className="py-8 text-center text-slate-400 text-[10px] font-sans">
                  {t('No inventory transactions logged yet.', 'اسٹاک کی کوئی انٹری اس شیٹ میں موجود نہیں۔')}
                </p>
              ) : (
                <div className="w-full">
                  <ResponsiveTable
                    data={[...stockTransactions].reverse()}
                    columns={[
                      {
                        header: t('Item', 'آئٹم'),
                        accessor: (txn) => {
                          const prod = products.find(p => p.id === txn.itemId);
                          const isRec = txn.type === 'receipt';
                          const isSale = txn.type === 'sale';
                          return (
                            <div className="flex gap-1.5 items-center">
                              <div className={`rounded p-1 shrink-0 ${isRec ? 'bg-teal-500/10 text-teal-500' : isSale ? 'bg-orange-500/10 text-orange-500' : 'bg-amber-500/10 text-amber-500'}`}>
                                {isRec ? <ArrowUpRight className="h-3 w-3" /> : isSale ? <ArrowDownRight className="h-3 w-3" /> : <Wrench className="h-3 w-3" />}
                              </div>
                              <div className="flex flex-col justify-center">
                                <strong className="text-slate-800 dark:text-slate-100 block truncate max-w-[100px] text-[11px]">
                                  {prod ? t(prod.name, prod.urduName) : txn.itemId}
                               </strong>
                                <span className="text-[9px] text-slate-400 dark:text-slate-500 block mt-0.5">{txn.date} • {txn.by}</span>
                              </div>
                            </div>
                          );
                        },
                        isPrimaryMobile: true
                      },
                      {
                        header: t('Quantity', 'مقدار'),
                        className: 'text-right',
                        accessor: (txn) => {
                          const prod = products.find(p => p.id === txn.itemId);
                          const isRec = txn.type === 'receipt';
                          const isSale = txn.type === 'sale';
                          return (
                            <div className="flex flex-col justify-center text-right">
                              <strong className={`font-mono text-[10px] block ${isRec ? 'text-teal-500' : isSale ? 'text-slate-700 dark:text-slate-300' : txn.quantity > 0 ? 'text-teal-500' : 'text-red-500'}`}>
                                {isRec ? '+' : isSale ? '-' : txn.quantity > 0 ? '+' : ''}
                                {txn.quantity.toLocaleString()} {prod?.unit || 'Ltr'}
                              </strong>
                              {txn.amount && (
                                <span className="text-[9px] text-slate-400 dark:text-slate-500 font-mono block mt-0.5">Rs. {txn.amount.toLocaleString()}</span>
                              )}
                            </div>
                          );
                        },
                        isSecondaryMobile: true
                      }
                    ]}
                    keyExtractor={(txn) => txn.id}
                    emptyMessage={t('No inventory transactions logged yet.', 'اسٹاک کی کوئی انٹری اس شیٹ میں موجود نہیں۔')}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MOBILE BOTTOM SHEET FOR AUDIT LOGS */}
      <BottomSheet isOpen={isAuditSheetOpen} onClose={() => setIsAuditSheetOpen(false)} title={t('Inventory Transaction Audits', 'اسٹاک فلو آڈٹ ٹرانزیکشنز')} snapPoints={['80vh']}>
        <div className="space-y-3.5 max-h-[70vh] overflow-y-auto pr-1">
          {stockTransactions.length === 0 ? (
            <p className="py-12 text-center text-slate-400 text-xs font-sans">
              {t('No inventory transactions logged yet.', 'اسٹاک کی کوئی انٹری اس شیٹ میں موجود نہیں۔')}
            </p>
          ) : (
            <div className="w-full pb-8">
              <ResponsiveTable
                data={[...stockTransactions].reverse()}
                columns={[
                  {
                    header: t('Item', 'آئٹم'),
                    accessor: (txn) => {
                      const prod = products.find(p => p.id === txn.itemId);
                      const isRec = txn.type === 'receipt';
                      const isSale = txn.type === 'sale';
                      return (
                        <div className="flex gap-1.5 items-center">
                          <div className={`rounded p-1 shrink-0 ${isRec ? 'bg-teal-500/10 text-teal-500' : isSale ? 'bg-orange-500/10 text-orange-500' : 'bg-amber-500/10 text-amber-500'}`}>
                            {isRec ? <ArrowUpRight className="h-3.5 w-3.5" /> : isSale ? <ArrowDownRight className="h-3.5 w-3.5" /> : <Wrench className="h-3.5 w-3.5" />}
                          </div>
                          <div className="flex flex-col justify-center">
                            <strong className="text-slate-800 dark:text-slate-100 block text-xs">
                              {prod ? t(prod.name, prod.urduName) : txn.itemId}
                            </strong>
                            <span className="text-[10px] text-slate-400 dark:text-slate-500 block mt-0.5">{txn.date} • {txn.by}</span>
                          </div>
                        </div>
                      );
                    },
                    isPrimaryMobile: true
                  },
                  {
                    header: t('Quantity', 'مقدار'),
                    className: 'text-right',
                    accessor: (txn) => {
                      const prod = products.find(p => p.id === txn.itemId);
                      const isRec = txn.type === 'receipt';
                      const isSale = txn.type === 'sale';
                      return (
                        <div className="text-right flex flex-col justify-center">
                          <strong className={`font-mono text-xs block ${isRec ? 'text-teal-500' : isSale ? 'text-slate-700 dark:text-slate-300' : txn.quantity > 0 ? 'text-teal-500' : 'text-red-500'}`}>
                            {isRec ? '+' : isSale ? '-' : txn.quantity > 0 ? '+' : ''}
                            {txn.quantity.toLocaleString()} {prod?.unit || 'Ltr'}
                          </strong>
                          {txn.amount && (
                            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono block mt-0.5">Rs. {txn.amount.toLocaleString()}</span>
                          )}
                        </div>
                      );
                    },
                    isSecondaryMobile: true
                  }
                ]}
                keyExtractor={(txn) => txn.id}
                emptyMessage={t('No inventory transactions logged yet.', 'اسٹاک کی کوئی انٹری اس شیٹ میں موجود نہیں۔')}
              />
            </div>
          )}
        </div>
      </BottomSheet>

      {/* ==========================================
          TAB 2: TANKS CALIBRATION MODULE (MODULE B2/B3/D2)
          ========================================== */}
      {activeTab === 'tanks_calibration' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* TANKS LIST BOARD WITH CYLINDERS */}
          <div className="md:col-span-2 space-y-3">
            <h3 className="font-sans text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5 border-b border-theme-main pb-2">
              <Layers3 className="h-3.5 w-3.5 text-slate-400" />
              <span>{t('Storage Tank Capacities & Stock Ratios', 'سٹوریج ٹینکس کی گنجائش اور فزیکل والیم')}</span>
            </h3>

            {tanks.length === 0 ? (
              <div className="p-4 text-center rounded-xl bg-theme-card border border-theme-main text-slate-400 text-xs">
                {t('No storage tanks has been configured in Settings yet.', 'ٹھیکیدار کی ترجیحات میں کوئی سٹوریج ٹینک نہیں پایا گیا۔ پہلے ٹینکس ترتیب کھڑا کریں۔')}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {tanks.map(tnk => {
                  const prod = products.find(p => p.id === tnk.productId);
                  const fillPct = Math.round((tnk.currentStock / tnk.capacity) * 100);
                  const isUnderSafe = tnk.currentStock < tnk.safeLevel;
                  const isUnderCritical = tnk.currentStock < tnk.criticalLevel;

                  return (
                    <div key={tnk.id} className="kpi-card p-3 flex gap-4 items-center">
                      {/* CYLINDER VISUAL */}
                      <div className="relative w-12 h-24 border border-theme-main rounded bg-slate-100 dark:bg-slate-800 flex items-end shrink-0 shadow-inner overflow-hidden">
                        {/* Fuel liquid level */}
                        <div 
                          style={{ height: `${Math.min(100, Math.max(0, fillPct))}%` }} 
                          className={`w-full transition-all ${
                            isUnderCritical ? 'bg-red-500/80 animate-pulse' : isUnderSafe ? 'bg-orange-500/85' : 'bg-teal-500/80'
                          }`}
                        />
                        <div className="absolute inset-0 flex flex-col justify-between items-center py-1 text-[8px] font-mono font-bold text-slate-700 dark:text-slate-200 z-10 text-center leading-tight">
                          <span>{tnk.capacity.toLocaleString()}L</span>
                          <span className="bg-white/80 dark:bg-black/60 px-1 py-0.5 rounded text-[9px] font-mono font-extrabold">{fillPct}%</span>
                          <span className="truncate w-full px-1">{tnk.physicalLabel || tnk.name}</span>
                        </div>
                      </div>

                      <div className="space-y-1.5 flex-grow truncate">
                        <div className="truncate">
                          <strong className="text-slate-800 dark:text-slate-100 text-sm font-bold truncate block">
                            {tnk.name}
                          </strong>
                          <span className="text-[9px] text-slate-500 uppercase flex items-center gap-1 mt-0.5 truncate">
                            {prod ? t(prod.name, prod.urduName) : tnk.productId} 
                            <span className="opacity-50">•</span> 
                            {tnk.physicalLabel || 'Unspecified'}
                          </span>
                        </div>

                        <div className="space-y-0.5 font-mono text-[10px]">
                          <div className="flex justify-between items-center">
                            <span className="text-slate-400 dark:text-slate-500 font-sans">{t('Level:', 'اسٹاک:')}</span>
                            <strong className="text-slate-800 dark:text-slate-100">{tnk.currentStock.toLocaleString()}L</strong>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-slate-400 dark:text-slate-500 font-sans">{t('Safe:', 'محفوظ:')}</span>
                            <strong className="text-teal-600 dark:text-teal-400">&gt;{tnk.safeLevel.toLocaleString()}L</strong>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-slate-400 dark:text-slate-500 font-sans">{t('Crit:', 'الرٹ:')}</span>
                            <strong className="text-red-500 dark:text-red-400">&lt;{tnk.criticalLevel.toLocaleString()}L</strong>
                          </div>
                        </div>

                        <div className="pt-1">
                          {isUnderCritical ? (
                            <span className="rounded bg-red-500/10 text-red-600 px-1.5 py-0.5 text-[8px] font-bold uppercase block text-center truncate">
                              🚨 CRITICAL REFUELLING
                            </span>
                          ) : isUnderSafe ? (
                            <span className="rounded bg-orange-500/10 text-orange-600 px-1.5 py-0.5 text-[8px] font-bold uppercase block text-center truncate">
                              ⚠️ LOW STOCK LEVEL
                            </span>
                          ) : (
                            <span className="rounded bg-teal-500/10 text-teal-600 px-1.5 py-0.5 text-[8px] font-bold uppercase block text-center truncate">
                              ✅ OPTIMAL RANGE
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* CALIBRATION DIP stick CALCULATOR (Interactive!) */}
          <div className="kpi-card p-4 space-y-4">
            <h3 className="font-sans text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5 border-b border-theme-main pb-2">
              <Calculator className="h-3.5 w-3.5 text-slate-400" />
              <span>{t('Dip stick Calculator', ' ٹینک ڈپ سٹک کیلکولیٹر')}</span>
            </h3>

            <p className="font-sans text-[10px] text-slate-500 leading-normal">
              {t(
                'Convert physical wet-height measurements in centimeters automatically directly to fuel balance volumes based on certified laboratory dip charts.',
                'سٹک پیمائش ناپ کا ہندسہ اینٹی میٹر (Centimeter) میں لکھیں، سسٹم فارمولا اور لیبارٹری گراف کے مطابق بقایا لیٹرز خود بخود نکال دیگا۔'
              )}
            </p>

            <div className="space-y-3 font-sans text-xs">
              <div>
                <label className="block text-slate-600 dark:text-slate-300 font-bold mb-1 text-[11px]">{t('Select Storage Tank:', 'سٹوریج ٹینک منتخب کریں:')}</label>
                <select
                  value={calcTankId}
                  onChange={(e) => setCalcTankId(e.target.value)}
                  className="w-full rounded bg-theme-main border-none px-2.5 py-2 outline-hidden focus:ring-1 focus:ring-orange-500 text-xs"
                >
                  <option value="">{t('-- Choose Tank --', '-- منتخب ٹینک کریں --')}</option>
                  {tanks.map(t => <option key={t.id} value={t.id}>{t.name} ({t.productId.toUpperCase()})</option>)}
                </select>
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-300 font-bold mb-1 text-[11px]">{t('Measured Height (cm):', 'پیمائش سٹک (cm):')}</label>
                <input
                  type="number"
                  min="0"
                  max="400"
                  placeholder="120"
                  value={calcDepthCm}
                  onChange={(e) => setCalcDepthCm(e.target.value)}
                  className="w-full rounded bg-theme-main border-none px-2.5 py-2 outline-hidden focus:ring-1 focus:ring-orange-500 font-mono text-xs"
                />
              </div>

              {/* CALIBRATED OUTPUT BLOCK */}
              {calculatedCalibratedVolume !== null && (
                <div className="rounded border border-teal-500/20 bg-teal-500/10 p-3 text-center space-y-0.5 mt-2">
                  <span className="text-[9px] uppercase font-bold tracking-wider text-teal-600 dark:text-teal-400 block">🎉 {t('CONVERTED VOLUME', 'حساب شدہ والیم')}</span>
                  <strong className="text-xl font-mono text-teal-700 dark:text-teal-300 block">{calculatedCalibratedVolume.toLocaleString()} <span className="text-[10px] font-sans font-normal text-teal-600/70">Litres</span></strong>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ==========================================
          TAB 3: PRICING REVISIONS LOGS (MODULE B4 / D1)
          ========================================== */}
      {activeTab === 'pricing_logs' && (
        <div className="kpi-card p-4 space-y-4">
          <div className="border-b border-theme-main pb-2 flex justify-between items-center flex-wrap gap-2">
            <div>
              <h3 className="font-sans text-xs font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="h-4 w-4 text-orange-600" />
                <span>{t('Certified Corporate Tariff Pricing logs', 'ریٹ تبدیلی اور اسٹاک ویلیویشن لاگر ریکارڈ')}</span>
              </h3>
              <p className="font-sans text-[10px] text-slate-500 mt-0.5">
                {t('Track fuel rate modification history, auditor remarks, and estimated inventory evaluation gain/loss impact.', 'پٹرولیم فنڈز کی قیمت تبدیل کرنے کے دوران موجود اسٹاک ویلیویشن کے نقصان یا منافع کا ریکارڈ۔')}
              </p>
            </div>
          </div>

          <div className="w-full">
            <ResponsiveTable
              data={[...rateHistory].reverse()}
              columns={[
                {
                  header: t('Audit Timestamp', 'تاریخ'),
                  accessor: (log) => <span className="font-mono text-slate-500 whitespace-nowrap">{log.date}</span>,
                  isSecondaryMobile: true
                },
                {
                  header: t('Product Grade', 'پراڈکٹ'),
                  accessor: (log) => {
                    const prod = products.find(p => p.id === log.productId);
                    return <span className="font-bold text-slate-800">{prod ? t(prod.name, prod.urduName) : log.productId.toUpperCase()}</span>;
                  },
                  isPrimaryMobile: true
                },
                {
                  header: t('Old Tariff Rate', 'کلو ز ریٹ'),
                  accessor: (log) => <span className="font-mono text-slate-500">Rs. {log.oldRate.toFixed(2)}</span>
                },
                {
                  header: t('New Tariff Revised', 'نیا نافذ ریٹ'),
                  accessor: (log) => <span className="font-mono font-bold text-slate-800">Rs. {log.newRate.toFixed(2)}</span>
                },
                {
                  header: t('Revision Diff', 'ریٹ میں تبدیلی'),
                  accessor: (log) => <span className={`font-mono font-semibold ${log.change >= 0 ? 'text-teal-605' : 'text-red-500'}`}>{log.change >= 0 ? `+${log.change.toFixed(2)}` : log.change.toFixed(2)}</span>
                },
                {
                  header: t('Stock Volume at Revision', 'موجودہ والیم'),
                  accessor: (log) => <span className="font-mono font-bold text-slate-800">{log.stockAtTime.toLocaleString()} Ltr</span>
                },
                {
                  header: t('Audit P&L Impact', 'ویلیویشن منافع/نقصان'),
                  accessor: (log) => {
                    const isGain = log.impactAmount >= 0;
                    return <span className={`font-mono font-extrabold ${isGain ? 'text-teal-600' : 'text-red-500'}`}>{isGain ? '+' : '-'}Rs. {Math.abs(log.impactAmount).toLocaleString()}</span>;
                  }
                },
                {
                  header: t('Revision Trigger Narrative', 'ترمیم ریمارکس'),
                  className: 'text-right',
                  accessor: (log) => (
                    <div className="text-right whitespace-nowrap overflow-hidden max-w-[150px] text-ellipsis">
                      <span className="block font-semibold text-slate-700 truncate">{log.reason}</span>
                      <span className="block text-[9px] text-slate-400 font-mono">By: {log.changedBy}</span>
                    </div>
                  )
                }
              ]}
              keyExtractor={(log) => log.id}
              emptyMessage={t('No price revisions logged. Use Settings panel to revise fuel grades pricing rates.', 'قیمتیں تبدیل کرنے کا کوئی سابقہ ریکارڈ نہیں ملا۔ تبدیلی کیلئے سیٹنگز پینل استعمال کریں۔')}
            />
          </div>
        </div>
      )}

      {/* ==========================================
          TAB 4: BATCH HISTORY
          ========================================== */}
      {activeTab === 'batch_history' && (
        <BatchHistory batches={stockBatches} products={products} language={settings.language} />
      )}

      {/* ==========================================
          TAB 5: INVENTORY AGING INTELLIGENCE
          ========================================== */}
      {activeTab === 'aging' && (
        <InventoryAgingDashboard
          batches={stockBatches}
          products={products}
          suppliers={allSuppliers}
          language={settings.language}
        />
      )}

      {/* ==========================================
          TAB 6: SUPPLIER PERFORMANCE SCORECARD
          ========================================== */}
      {activeTab === 'supplier_perf' && (
        <SupplierScorecard
          suppliers={allSuppliers}
          batches={stockBatches}
          supplierClaims={supplierClaims}
          language={settings.language}
        />
      )}

      {/* ==========================================
          TAB 7: SUPPLIER PAYABLES INTELLIGENCE
          ========================================== */}
      {activeTab === 'payables' && (
        <SupplierPayablesPanel
          suppliers={allSuppliers}
          batches={stockBatches}
          language={settings.language}
          onRecordPayment={async (supplierId, amount, note) => {
            const supplier = allSuppliers.find(s => s.id === supplierId);
            if (!supplier) return;
            const newBalance = Math.max(0, (supplier.balance || 0) - amount);
            await handleUpdateSupplier({ ...supplier, balance: newBalance });
            showToast(
              t(
                `Rs.${amount.toLocaleString()} payment recorded for ${supplier.name}`,
                `${supplier.name} کو Rs.${amount.toLocaleString()} ادائیگی ریکارڈ ہوئی`
              ),
              'success'
            );
          }}
        />
      )}

      {/* ==========================================
          TAB 8: SUPPLIER CLAIMS MANAGEMENT
          ========================================== */}
      {activeTab === 'claims' && (
        <SupplierClaimsPanel
          batches={stockBatches}
          suppliers={allSuppliers}
          language={settings.language}
        />
      )}

      {/* MODAL 1: SUPPLIER STOCK RECEIPT (Module-C) */}
      <AnimatePresence>
        {showAddStockModal && (
          <StockInForm
            products={products}
            suppliers={suppliers}
            tanks={tanks}
            language={settings.language}
            onClose={() => setShowAddStockModal(false)}
            isLube={isLube}
          />
        )}
      </AnimatePresence>

      {/* MODAL 2: TANKS RECONCILIATION PHYSICAL DIP MEASUREMENT VERIFICATIONS */}
      <AnimatePresence>
        {showReconcileModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="premium-modal-overlay"
          >
            <motion.div
              initial={{ scale: 0.95, y: 15, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 15, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 350 }}
              className="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-6 shadow-xl"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                <h3 className="font-sans text-base font-bold text-slate-900 flex items-center gap-2">
                  <Wrench className="h-5 w-5 text-amber-610" />
                  <span>{isLube
                    ? t('Physical Stock Count', 'جسمانی اسٹاک گنتی')
                    : t('Tanks Reconciliation (Dip Check)', 'جسمانی پیمائش و موازنہ اسٹاک')}
                  </span>
                </h3>
                <button onClick={() => setShowReconcileModal(false)} className="text-slate-400 hover:text-slate-650 cursor-pointer font-bold text-xl">&times;</button>
              </div>

              <p className="font-sans text-[11px] text-slate-400 leading-normal pb-3 border-b border-slate-100 mb-4">
                {t(
                  'Note: Use this when the physical fuel dip stick calculation differs from the electronic system balance due to evaporation index adjustments.',
                  'تنبیہ: گیس چوری، پٹرول اڑنے یا فزیکل ڈپ سٹک ناپ کے دوران واٹس ایپ پر ظاہر کردہ اسٹاک فالتو یا کم ہونے کی صورت میں موازنہ انٹری درج کریں۔'
                )}
              </p>

              <form onSubmit={handleReconcileSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-555 uppercase tracking-wider mb-1.5">{t('Select Product for Dip Adjust:', 'پراڈکٹ منتخب کریں:')}</label>
                  <select
                    value={reconProductId}
                    onChange={(e) => setReconProductId(e.target.value)}
                    className="premium-input border bg-white px-2.5 font-sans text-sm focus:border-orange-500 focus:outline-hidden"
                  >
                    {products.map(p => <option key={p.id} value={p.id}>{p.name} ({p.currentStock} {p.unit} in hand)</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-555 uppercase tracking-wider mb-1.5">{t('Measured Physical Actual Stock:', 'جسمانی طور پر ناپی گئی حقیقی مقدار:')}</label>
                  <input
                    type="number"
                    required
                    value={reconActualQty}
                    onChange={(e) => setReconActualQty(e.target.value)}
                    placeholder="e.g. 14200"
                    className="premium-input border bg-white px-3 .5 font-mono text-sm focus:border-orange-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-555 uppercase tracking-wider mb-1.5">{t('Reconcile Narrative / Discrepancy reason:', 'وجوہات موازنہ:')}</label>
                  <input
                    type="text"
                    required
                    value={reconReason}
                    onChange={(e) => setReconReason(e.target.value)}
                    placeholder="e.g. Weekly physical calibration check correction"
                    className="premium-input border bg-white px-3 font-sans text-xs focus:border-orange-500 focus:outline-hidden"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-slate-800 hover:bg-slate-900 text-white font-sans text-sm font-bold tracking-wider rounded-lg shadow-md mt-4 cursor-pointer"
                >
                  {t('SUBMIT RECONCILIATION CORRECTION', 'ڈپ بک اپ ڈیٹ کریں')}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ==========================================
          ADD / EDIT PRODUCT MODAL
          ========================================== */}
      <AnimatePresence>
        {showAddProductModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="premium-modal-overlay"
          >
            <motion.div
              initial={{ scale: 0.95, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 20, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-5">
                <h3 className="font-sans text-base font-bold text-slate-900 flex items-center gap-2">
                  <Package className="h-5 w-5 text-emerald-600" />
                  <span>{editingProduct
                    ? t('Edit Product', 'پروڈکٹ ترمیم')
                    : t('Register New Product', 'نئی پروڈکٹ رجسٹر کریں')
                  }</span>
                </h3>
                <button onClick={() => setShowAddProductModal(false)} className="text-slate-400 hover:text-slate-700 text-xl font-bold cursor-pointer">&times;</button>
              </div>

              <form onSubmit={handleProductModalSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-1 lg:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">{t('Product Name (English):', 'نام (انگریزی):')}</label>
                    <input type="text" required value={prodName} onChange={e => setProdName(e.target.value)}
                      placeholder="e.g. Mobil 1 5W-30"
                      className="premium-input border bg-white px-3 font-sans text-sm focus:border-emerald-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">{t('Product Name (Urdu):', 'نام (اردو):')}</label>
                    <input type="text" value={prodUrduName} onChange={e => setProdUrduName(e.target.value)}
                      placeholder="مثال: موبل ون"
                      className="premium-input border bg-white px-3 font-sans text-sm focus:border-emerald-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">{t('Selling Rate (Rs):', 'فروخت قیمت (روپے):')}</label>
                    <input type="number" required min="0" step="0.01" value={prodRate} onChange={e => setProdRate(e.target.value)}
                      placeholder="e.g. 1500"
                      className="premium-input border bg-white px-3 font-mono text-sm focus:border-emerald-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">{t('Unit of Measure:', 'پیمائش کی اکائی:')}</label>
                    <select value={prodUnit} onChange={e => setProdUnit(e.target.value)}
                      className="premium-input border bg-white px-3 font-sans text-sm focus:border-emerald-500 outline-none">
                      <option value="Pcs">Pcs (Pieces)</option>
                      <option value="Ltr">Ltr (Litres)</option>
                      <option value="Kg">Kg (Kilogram)</option>
                      <option value="Box">Box</option>
                      <option value="Pack">Pack</option>
                      <option value="Can">Can</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">{t('Product Type:', 'پروڈکٹ کی قسم:')}</label>
                    <div className="flex gap-2">
                      {/* For Fuel Station: only fuel & other. For Lube: all types */}
                      {(['lube', 'fuel', 'other'] as const)
                        .filter(pt => isLube || pt !== 'lube')
                        .map(pt => (
                        <button type="button" key={pt} onClick={() => setProdType(pt)}
                          className={`flex-1 py-1.5 rounded-lg border font-sans text-xs font-bold cursor-pointer ${
                            prodType === pt
                              ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                              : 'border-slate-200 text-slate-500'
                          }`}>
                          {pt === 'fuel' ? '⛽ Fuel' : pt === 'lube' ? '🛢️ Lube' : '📦 Other'}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">{t('Min Stock Alert Level:', 'انتباہی اسٹاک حد:')}</label>
                    <input type="number" min="0" value={prodMinStock} onChange={e => setProdMinStock(e.target.value)}
                      placeholder="e.g. 10"
                      className="premium-input border bg-white px-3 font-mono text-sm focus:border-emerald-500 outline-none" />
                  </div>
                  {!editingProduct && (
                    <div className="sm:col-span-2">
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">{t('Opening Stock Quantity:', 'ابتدائی اسٹاک مقدار:')}</label>
                      <input type="number" min="0" value={prodOpeningStock} onChange={e => setProdOpeningStock(e.target.value)}
                        placeholder="e.g. 50"
                        className="premium-input border bg-white px-3 font-mono text-sm focus:border-emerald-500 outline-none" />
                    </div>
                  )}
                </div>

                <button type="submit"
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-sans text-sm font-bold tracking-wider rounded-lg shadow-md mt-2 cursor-pointer">
                  {editingProduct
                    ? t('SAVE CHANGES', 'تبدیلیاں محفوظ کریں')
                    : t('REGISTER PRODUCT', 'پروڈکٹ رجسٹر کریں')
                  }
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <ExportToolbar
        isOpen={showExport}
        onClose={() => setShowExport(false)}
        data={filteredProducts}
        columns={exportColumns}
        title="Inventory Report"
        filenamePrefix="inventory_report"
      />

      <InventoryDrillDownModal 
        isOpen={isInventoryDrillDownOpen}
        onClose={() => setIsInventoryDrillDownOpen(false)}
        settings={settings}
      />
    </div>
  );
}
