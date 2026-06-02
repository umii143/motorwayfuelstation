/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
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
  Gauge
} from 'lucide-react';
import { Product, StockTransaction, Supplier, GlobalSettings, Tank, RateHistoryEntry } from '../../types';

interface InventoryProps {
  settings: GlobalSettings;
  products: Product[];
  suppliers: Supplier[];
  stockTransactions: StockTransaction[];
  onAddStockTransaction: (txn: StockTransaction) => void;
  onUpdateProductStock: (productId: string, newStock: number) => void;
  tanks: Tank[];
  rateHistory: RateHistoryEntry[];
}

export default function Inventory({
  settings,
  products,
  suppliers,
  stockTransactions,
  onAddStockTransaction,
  onUpdateProductStock,
  tanks = [],
  rateHistory = []
}: InventoryProps) {
  const isUrdu = settings.language === 'ur';
  const t = (en: string, ur: string) => (isUrdu ? ur : en);

  // Detect if this is a Lube-only business (no fuel products)
  const isLube = products.some(p => p.type === 'lube') && !products.some(p => p.type === 'fuel');

  // Filter States
  const [activeTab, setActiveTab] = useState<'inventory' | 'tanks_calibration' | 'pricing_logs'>('inventory');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'fuel' | 'lube' | 'low'>('all');

  // Interactive Calibrator Calculator
  const [calcTankId, setCalcTankId] = useState('');
  const [calcDepthCm, setCalcDepthCm] = useState('');

  // Input States
  const [showAddStockModal, setShowAddStockModal] = useState(false);
  const [showReconcileModal, setShowReconcileModal] = useState(false);

  // New stock receipt form states
  const [selectedProductId, setSelectedProductId] = useState(products[0]?.id || '');
  const [supplierId, setSupplierId] = useState(suppliers[0]?.id || '');
  const [receiptQty, setReceiptQty] = useState('');
  const [receiptCost, setReceiptCost] = useState('');
  const [invoiceRef, setInvoiceRef] = useState('');

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
  }, [products, searchQuery, filterType]);

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
  // HANDLERS
  // ==========================================

  const handleAddStockSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const qty = Number(receiptQty);
    const cost = Number(receiptCost);

    if (!selectedProductId || qty <= 0) {
       alert(t('Please fill all fields with correct numbers.', 'درست اندراج کیجئے۔'));
       return;
    }

    const prod = products.find(p => p.id === selectedProductId);
    if (!prod) return;

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
      carriageCost: Number(carriageCost) || undefined
    };

    onAddStockTransaction(newTxn);
    onUpdateProductStock(selectedProductId, prod.currentStock + qty);

    // Reset Form
    setReceiptQty('');
    setReceiptCost('');
    setInvoiceRef('');
    setPurchasePrice('');
    setSellingPrice('');
    setFuelType('Petrol');
    setCarriageCost('');
    setShowAddStockModal(false);
    alert(t('Stock inventory updated successfully!', 'اسٹاک بک اپ ڈیٹ ہو گئی ہے!'));
  };

  const handleReconcileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const actual = Number(reconActualQty);

    if (!reconProductId || isNaN(actual) || actual < 0) {
      alert(t('Please enter a valid actual stock level.', 'براہ مہربانی درست اسٹاک مقدار درج کریں۔'));
      return;
    }

    const prod = products.find(p => p.id === reconProductId);
    if (!prod) return;

    const diff = actual - prod.currentStock;
    if (diff === 0) {
      alert(t('No difference found. No adjustments saved.', 'کوئی فرق نہیں پایا گیا۔'));
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
    alert(t('Inventory reconciled, stock adjusted!', 'اسٹاک کی جسمانی تصدیق اور تصحیح ہو چکی ہے!'));
  };

  return (
    <div className="space-y-6 pb-20 lg:pb-5">

      {/* HEADER SECTION */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-4">
        <div>
          <h2 className="font-sans text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <Package className="h-6 w-6 text-orange-600" />
            <span>{isLube
              ? t('Product & Parts Inventory', 'پروڈکٹ اور پارٹس انوینٹری')
              : t('Inventory, Price Revisions & Tanks Calibration', 'ٹینکس اسٹاک، قیمت تبدیلی اور کیلیبریشن')}
            </span>
          </h2>
          <p className="font-sans text-xs text-slate-500 mt-1">
            {isLube
              ? t('Manage lubricant stock, register supplier deliveries, and track price revisions.', 'لیوبریکنٹ اسٹاک، سپلائر ڈیلیوری اور قیمتوں کی تبدیلی کا انتظام۔')
              : t('Audit fuel tank dip measurements, register lubricant wholesale receipts, and track revaluation gain/loss.', 'پٹرولیم ٹینکوں، موبل آئل کی وصولی، قیمتوں میں فلو تبدیلیاں مانیٹرنگ اور فزیکل اسٹاک ایڈجسٹمنٹ کھاتا۔')}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setShowReconcileModal(true)}
            className="flex items-center justify-center gap-1.5 rounded-lg border border-orange-200 bg-orange-50 px-3.5 py-2 font-sans text-xs font-bold text-orange-700 hover:bg-orange-100 transition-all cursor-pointer"
          >
            <CheckCircle className="h-4 w-4" />
            <span>{isLube
              ? t('Physical Stock Count', 'جسمانی اسٹاک گنتی')
              : t('Reconcile Stock (Dip Check)', 'فزیکل ٹینک ڈپ پڑتال')}
            </span>
          </button>

          <button
            onClick={() => setShowAddStockModal(true)}
            className="flex items-center justify-center gap-1.5 rounded-lg bg-orange-600 px-4 py-2 font-sans text-xs font-bold text-white shadow-md hover:bg-orange-700 transition-all cursor-pointer"
          >
            <PlusCircle className="h-4 w-4" />
            <span>{t('Supplier Stock Receipt', 'نیا اسٹاک وصول کریں')}</span>
          </button>
        </div>
      </div>

      {/* BEN-TO ROW INVENTORY STATS OVERVIEWS */}
      <div className={`grid grid-cols-1 gap-4 ${isLube ? 'sm:grid-cols-2' : 'sm:grid-cols-3'}`}>
        {/* Total Fuels — hidden for lube businesses */}
        {!isLube && (
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-orange-600">
            <Layers className="h-5 w-5" />
          </div>
          <div>
            <span className="font-sans text-[10px] font-bold text-slate-400 uppercase tracking-widest block">{t('Total Fuel In Storage Tanks', 'ٹینکس میں موجود کل فیول والیم')}</span>
            <strong className="font-mono text-base font-bold text-slate-800 tracking-tight mt-1 block">
              {totalFuelVolume.toLocaleString()} Litres
            </strong>
          </div>
        </div>
        )}

        {/* Total Lubes */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-sky-600">
            <Package className="h-5 w-5" />
          </div>
          <div>
            <span className="font-sans text-[10px] font-bold text-slate-400 uppercase tracking-widest block">{t('Lubricants / Accessories', 'کل انجن آئل اسٹاک')}</span>
            <strong className="font-mono text-base font-bold text-slate-800 tracking-tight mt-1 block">
              {totalLubricantsQty.toLocaleString()} Units
            </strong>
          </div>
        </div>

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
      <div className="flex items-center gap-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('inventory')}
          className={`px-4 py-2 font-sans text-xs font-bold border-b-2 transition-all cursor-pointer ${
            activeTab === 'inventory'
              ? 'border-orange-600 text-orange-600 font-extrabold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          📦 {t('Product Stock List', 'پراڈکٹس اسٹاک لسٹ')}
        </button>

        {!isLube && (
        <button
          onClick={() => setActiveTab('tanks_calibration')}
          className={`px-4 py-2 font-sans text-xs font-bold border-b-2 transition-all cursor-pointer ${
            activeTab === 'tanks_calibration'
              ? 'border-orange-600 text-orange-600 font-extrabold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          🛢️ {t('Storage Tanks & Calibration Dip Chart', 'سٹوریج ٹینکس اور الیکٹرانک ڈپ ناپ')}
        </button>
        )}

        <button
          onClick={() => setActiveTab('pricing_logs')}
          className={`px-4 py-2 font-sans text-xs font-bold border-b-2 transition-all cursor-pointer ${
            activeTab === 'pricing_logs'
              ? 'border-orange-600 text-orange-600 font-extrabold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          📈 {t('Price Revisions History Log', 'ریٹ تبدیلی اور اسٹاک نفع نقصان')}
        </button>
      </div>

      {/* CORE ACTIVE WORKSPACE MODULES */}
      {activeTab === 'inventory' && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* LEFT PANEL (2/3 WIDTH): PRODUCTS DATABASE DETAIL BOARD */}
          <div className="lg:col-span-2 space-y-4">
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs flex flex-col gap-3.5 sm:flex-row sm:items-center sm:justify-between">
              {/* Categorization controls */}
              <div className="flex flex-wrap gap-1.5">
                {[
                  { id: 'all', label: 'All Stock', urdu: 'کل اسٹاک' },
                  { id: 'fuel', label: 'Fuels Only', urdu: 'صرح پیٹرولیم' },
                  { id: 'lube', label: 'Lubes & Oils', urdu: 'انجن آئل' },
                  { id: 'low', label: 'Low Alert', urdu: 'انتباہی اسٹاک' }
                ].map(f => (
                  <button
                    key={f.id}
                    onClick={() => setFilterType(f.id as any)}
                    className={`rounded-md px-3 py-1 font-sans text-xs font-bold cursor-pointer transition-all ${
                      filterType === f.id
                        ? 'bg-orange-600 text-white shadow-xs'
                        : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
                    }`}
                  >
                    {t(f.label, f.urdu)}
                  </button>
                ))}
              </div>

              {/* Keyword lookup */}
              <div className="relative w-full sm:w-60">
                <Search className="absolute top-2.5 left-3 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t('Search products...', 'پراڈکٹ تلاش کریں...')}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 py-1.5 pl-8 pr-3 font-sans text-xs outline-hidden focus:border-orange-500 focus:bg-white focus:outline-hidden"
                />
              </div>
            </div>

            {/* List items */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
                      className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-orange-500/10 hover:border-orange-200"
                    >
                      <div className="absolute inset-0 bg-linear-to-br from-orange-500/0 to-orange-500/5 opacity-0 transition-opacity group-hover:opacity-100 pointer-events-none" />
                      <div className="relative z-10 space-y-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <strong className="font-sans text-sm font-black text-slate-800 block group-hover:text-orange-600 transition-colors">{t(prod.name, prod.urduName)}</strong>
                            <span className="font-sans text-[10px] uppercase font-bold tracking-wider text-slate-400 mt-1 block">{prod.type} Item</span>
                          </div>
                          {isLow ? (
                            <span className="rounded-full bg-red-50 text-red-700 px-2.5 py-1 text-[9px] font-black uppercase tracking-wider select-none animate-pulse border border-red-100 shadow-xs shadow-red-500/20">
                              ⚠️ {t('LOW STOCK', 'اسٹاک کم')}
                            </span>
                          ) : (
                            <span className="rounded-full bg-emerald-50 text-emerald-700 px-2.5 py-1 text-[9px] font-black uppercase tracking-wider select-none border border-emerald-100">
                              {t('Sufficient', 'اسٹاک مناسب')}
                            </span>
                          )}
                        </div>

                        {/* Visual liquid volume indicator if fuel */}
                        {prod.type === 'fuel' && fillPct !== null && (
                          <div className="space-y-1.5 py-1">
                            <div className="flex justify-between items-center text-[10px] font-mono font-bold text-slate-500">
                              <span>{t('Stock Depth:', 'ٹینکر پوزیشن:')}</span>
                              <span className={fillPct < 20 ? 'text-red-500' : fillPct < 50 ? 'text-orange-500' : 'text-teal-600'}>{fillPct}%</span>
                            </div>
                            <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden shadow-inner">
                              <div 
                                style={{ width: `${Math.min(100, fillPct)}%` }} 
                                className={`h-full rounded-full transition-all duration-1000 ${fillPct < 20 ? 'bg-linear-to-r from-red-500 to-red-400' : fillPct < 50 ? 'bg-linear-to-r from-orange-500 to-amber-400' : 'bg-linear-to-r from-teal-500 to-emerald-400'}`}
                              />
                            </div>
                          </div>
                        )}

                        <div className="flex justify-between items-center py-3 border-t border-b border-slate-100 text-slate-700 font-mono text-xs mt-2">
                          <div>
                            <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wide block font-sans">{t('Physical Stock', 'موجودہ اسٹاک')}</span>
                            <strong className="text-slate-900 text-base font-black drop-shadow-xs">{prod.currentStock.toLocaleString()} <span className="text-xs text-slate-500 font-semibold">{prod.unit}</span></strong>
                          </div>
                          <div className="text-right">
                            <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wide block font-sans">{t('Current Pricing', 'موجودہ قیمت')}</span>
                            <strong className="text-orange-600 text-base font-black drop-shadow-xs">Rs. {prod.rate.toFixed(2)}</strong>
                          </div>
                        </div>
                      </div>

                      <div className="relative z-10 mt-3 text-[10px] font-semibold text-slate-400 flex justify-between items-center bg-slate-50/50 backdrop-blur-sm p-2.5 rounded-xl border border-slate-100">
                        <span>Min Threshold: <strong className="text-slate-600">{prod.minStock.toLocaleString()} {prod.unit}</strong></span>
                        <span className="uppercase tracking-widest bg-white px-2 py-0.5 rounded-md shadow-xs">Unit: {prod.unit}</span>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          </div>

          {/* RIGHT SIDEBAR (1/3 WIDTH): DETAILED LIVE REAL-TIME STOCK TRANSACTION LEDGER */}
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs space-y-4">
            <h3 className="font-sans text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5 border-b border-slate-100 pb-2">
              <History className="h-4 w-4 text-slate-450" />
              <span>{t('Inventory Transaction Audits', 'اسٹاک فلو آڈٹ ٹرانزیکشنز')}</span>
            </h3>

            <div className="space-y-3.5 max-h-[360px] overflow-y-auto pr-1">
              {stockTransactions.length === 0 ? (
                <p className="py-12 text-center text-slate-400 text-xs font-sans">
                  {t('No inventory transactions logged yet.', 'اسٹاک کی کوئی انٹری اس شیٹ میں موجود نہیں۔')}
                </p>
              ) : (
                [...stockTransactions].reverse().map(txn => {
                  const prod = products.find(p => p.id === txn.itemId);
                  const isRec = txn.type === 'receipt';
                  const isSale = txn.type === 'sale';
                  const isAdj = txn.type === 'adjustment';

                  return (
                    <div key={txn.id} className="flex justify-between items-start text-xs border-b border-slate-50 pb-3">
                      <div className="flex gap-2">
                        <div className={`mt-0.5 rounded-full p-1 ${isRec ? 'bg-teal-50 text-teal-650' : isSale ? 'bg-orange-50 text-orange-650' : 'bg-amber-50 text-amber-650'}`}>
                          {isRec ? <ArrowUpRight className="h-3 w-3" /> : isSale ? <ArrowDownRight className="h-3 w-3" /> : <Wrench className="h-3 w-3" />}
                        </div>
                        <div>
                          <strong className="text-slate-800 leading-normal block">
                            {prod ? t(prod.name, prod.urduName) : txn.itemId}
                          </strong>
                          <span className="text-[10px] text-slate-400 block mt-0.5">{txn.date} • {txn.by}</span>
                        </div>
                      </div>

                      <div className="text-right">
                        <strong className={`font-mono text-[11.5px] block ${isRec ? 'text-teal-600' : isSale ? 'text-slate-700' : txn.quantity > 0 ? 'text-teal-600' : 'text-red-500'}`}>
                          {isRec ? '+' : isSale ? '-' : txn.quantity > 0 ? '+' : ''}
                          {txn.quantity.toLocaleString()} {prod?.unit || 'Ltr'}
                        </strong>
                        {txn.amount && (
                          <span className="text-[10px] text-slate-450 font-mono block">Cost: Rs. {txn.amount.toLocaleString()}</span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* ==========================================
          TAB 2: TANKS CALIBRATION MODULE (MODULE B2/B3/D2)
          ========================================== */}
      {activeTab === 'tanks_calibration' && (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {/* TANKS LIST BOARD WITH CYLINDERS */}
          <div className="md:col-span-2 space-y-4">
            <h3 className="font-sans text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5 border-b border-slate-100 pb-2">
              <Layers3 className="h-4 w-4 text-slate-450" />
              <span>{t('Storage Tank Capacities & Stock Ratios', 'سٹوریج ٹینکس کی گنجائش اور فزیکل والیم')}</span>
            </h3>

            {tanks.length === 0 ? (
              <div className="p-8 text-center rounded-xl border border-slate-150 bg-slate-50 text-slate-400 text-xs">
                {t('No storage tanks has been configured in Settings yet.', 'ٹھیکیدار کی ترجیحات میں کوئی سٹوریج ٹینک نہیں پایا گیا۔ پہلے ٹینکس ترتیب کھڑا کریں۔')}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {tanks.map(tnk => {
                  const prod = products.find(p => p.id === tnk.productId);
                  const fillPct = Math.round((tnk.currentStock / tnk.capacity) * 100);
                  const isUnderSafe = tnk.currentStock < tnk.safeLevel;
                  const isUnderCritical = tnk.currentStock < tnk.criticalLevel;

                  return (
                    <div key={tnk.id} className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs flex gap-5 items-center relative overflow-hidden">
                      {/* CYLINDER VISUAL */}
                      <div className="relative w-16 h-32 select-none border border-slate-300 rounded-t-lg rounded-b-lg bg-slate-100 flex items-end shrink-0 shadow-inner">
                        {/* Fuel liquid level */}
                        <div 
                          style={{ height: `${Math.min(100, Math.max(0, fillPct))}%` }} 
                          className={`w-full rounded-b-md transition-all ${
                            isUnderCritical ? 'bg-red-500/80 animate-pulse' : isUnderSafe ? 'bg-orange-400/85' : 'bg-teal-500/80'
                          }`}
                        />
                        <div className="absolute inset-0 flex flex-col justify-between items-center py-2 text-[10px] font-mono select-none font-bold text-slate-755 z-10 text-center leading-tight">
                          <span>{tnk.capacity.toLocaleString()}L</span>
                          <span className="bg-white/80 px-1 py-0.5 rounded shadow-xs text-[11px] font-mono font-extrabold text-slate-900">{fillPct}%</span>
                          <span>{tnk.physicalLabel || tnk.name}</span>
                        </div>
                      </div>

                      <div className="space-y-2 flex-grow">
                        <div>
                          <strong className="text-slate-800 text-xs font-bold font-sans flex items-center gap-1.5 leading-normal">
                            <span>{tnk.name}</span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 font-bold ml-1 text-slate-500">{prod ? t(prod.name, prod.urduName) : tnk.productId}</span>
                          </strong>
                          <span className="font-mono text-[10px] text-slate-400 block mt-0.5">Label: {tnk.physicalLabel || 'Unspecified'}</span>
                        </div>

                        <div className="space-y-1 font-mono text-[11px]">
                          <div className="flex justify-between">
                            <span className="text-slate-400 font-sans">{t('Current Fuel Level:', 'حالیہ اسٹاک حجم:')}</span>
                            <strong className="text-slate-800">{tnk.currentStock.toLocaleString()} Ltr</strong>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400 font-sans">{t('Safe Operations Threshold', 'محفوظ رینج لمٹ:')}</span>
                            <strong className="text-teal-650 font-bold">&gt; {tnk.safeLevel.toLocaleString()} Ltr</strong>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400 font-sans">{t('Critical Refueling Alarms', 'وارننگ الرٹ لمٹ:')}</span>
                            <strong className="text-red-500 font-bold">&lt; {tnk.criticalLevel.toLocaleString()} Ltr</strong>
                          </div>
                        </div>

                        <div className="flex gap-1">
                          {isUnderCritical ? (
                            <span className="rounded-full bg-red-50 text-red-700 px-2.5 py-0.5 text-[9px] font-bold border border-red-200">
                              🚨 CRITICAL REFUELLING REQUIRED
                            </span>
                          ) : isUnderSafe ? (
                            <span className="rounded-full bg-amber-50 text-amber-700 px-2.5 py-0.5 text-[9px] font-bold border border-amber-200">
                              ⚠️ LOW STOCK LEVEL RUNNING
                            </span>
                          ) : (
                            <span className="rounded-full bg-teal-50 text-teal-700 px-2.5 py-0.5 text-[9px] font-bold border border-teal-200">
                              ✅ OPTIMAL RUNNING RANGE
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
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
            <h3 className="font-sans text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5 border-b border-slate-100 pb-2">
              <Calculator className="h-4 w-4 text-slate-450" />
              <span>{t('Calibration Dip stick Calculator', ' ٹینک ڈپ سٹک لیٹر کنورٹر کیلکولیٹر')}</span>
            </h3>

            <p className="font-sans text-[11.5px] text-slate-400 leading-normal leading-relaxed">
              {t(
                'Convert physical wet-height measurements in centimeters automatically directly to fuel balance volumes based on certified laboratory dip charts.',
                'سٹک پیمائش ناپ کا ہندسہ اینٹی میٹر (Centimeter) میں لکھیں، سسٹم فارمولا اور لیبارٹری گراف کے مطابق بقایا لیٹرز خود بخود نکال دیگا۔'
              )}
            </p>

            <div className="space-y-4 font-sans text-xs">
              <div>
                <label className="block text-slate-505 font-bold mb-1.5">{t('Select Storage Tank to Audit:', 'سٹوریج ٹینک منتخب کریں:')}</label>
                <select
                  value={calcTankId}
                  onChange={(e) => setCalcTankId(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 outline-hidden focus:border-orange-500"
                >
                  <option value="">{t('-- Choose Tank --', '-- منتخب ٹینک کریں --')}</option>
                  {tanks.map(t => <option key={t.id} value={t.id}>{t.name} ({t.productId.toUpperCase()})</option>)}
                </select>
              </div>

              <div>
                <label className="block text-slate-505 font-bold mb-1.5">{t('Measured Height in Centimeters (cm):', 'پیمائش سٹک ہائٹ سینٹی میٹرز میں:')}</label>
                <input
                  type="number"
                  min="0"
                  max="400"
                  placeholder="e.g. 120"
                  value={calcDepthCm}
                  onChange={(e) => setCalcDepthCm(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 outline-hidden focus:border-orange-500 font-mono text-sm"
                />
              </div>

              {/* CALIBRATED OUTPUT BLOCK */}
              {calculatedCalibratedVolume !== null && (
                <div className="rounded-xl border border-teal-150 bg-teal-50/50 p-4 shadow-inner text-center space-y-1">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-teal-650 block">🎉 {t('CONVERTED VOLUME RESULT', 'حساب شدہ فیول والیم')}</span>
                  <strong className="text-2xl font-mono text-teal-800 block">{calculatedCalibratedVolume.toLocaleString()} <span className="text-sm font-sans font-normal text-teal-600">Litres</span></strong>
                  <span className="text-[10px] text-teal-450 font-medium block">Linear Interpolated Chart Mapped</span>
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
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
          <div className="border-b border-slate-100 pb-3 flex justify-between items-center flex-wrap gap-2">
            <div>
              <h3 className="font-sans text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="h-4 w-4 text-orange-600" />
                <span>{t('Certified Corporate Tariff Pricing logs', 'ریٹ تبدیلی اور اسٹاک ویلیویشن لاگر ریکارڈ')}</span>
              </h3>
              <p className="font-sans text-[11.5px] text-slate-400 mt-1">
                {t('Track fuel rate modification history, auditor remarks, and estimated inventory evaluation gain/loss impact.', 'پٹرولیم فنڈز کی قیمت تبدیل کرنے کے دوران موجود اسٹاک ویلیویشن کے نقصان یا منافع کا ریکارڈ۔')}
              </p>
            </div>
          </div>

          <div className="overflow-x-auto text-xs font-sans">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-150 text-slate-500 font-bold uppercase tracking-wider text-[10px] text-center">
                  <th className="py-2.5 px-3 text-left">{t('Audit Timestamp', 'تاریخ')}</th>
                  <th className="py-2.5 px-2 text-left">{t('Product Grade', 'پراڈکٹ')}</th>
                  <th className="py-2.5 px-2">{t('Old Tariff Rate', 'کلو ز ریٹ')}</th>
                  <th className="py-2.5 px-2">{t('New Tariff Revised', 'نیا نافذ ریٹ')}</th>
                  <th className="py-2.5 px-2">{t('Revision Diff', 'ریٹ میں تبدیلی')}</th>
                  <th className="py-2.5 px-2">{t('Stock Volume at Revision', 'موجودہ والیم')}</th>
                  <th className="py-2.5 px-2">{t('Audit P&L Impact', 'ویلیویشن منافع/نقصان')}</th>
                  <th className="py-2.5 px-3 text-right">{t('Revision Trigger Narrative', 'ترمیم ریمارکس')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-center text-slate-700">
                {rateHistory.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400">
                      {t('No price revisions logged. Use Settings panel to revise fuel grades pricing rates.', 'قیمتیں تبدیل کرنے کا کوئی سابقہ ریکارڈ نہیں ملا۔ تبدیلی کیلئے سیٹنگز پینل استعمال کریں۔')}
                    </td>
                  </tr>
                ) : (
                  [...rateHistory].reverse().map(log => {
                    const prod = products.find(p => p.id === log.productId);
                    const isGain = log.impactAmount >= 0;

                    return (
                      <tr key={log.id} className="hover:bg-slate-50/50">
                        <td className="py-3 px-3 text-left font-mono text-slate-500 whitespace-nowrap">{log.date}</td>
                        <td className="py-3 px-2 text-left font-bold text-slate-800">
                          {prod ? t(prod.name, prod.urduName) : log.productId.toUpperCase()}
                        </td>
                        <td className="py-3 px-2 font-mono text-slate-500">Rs. {log.oldRate.toFixed(2)}</td>
                        <td className="py-3 px-2 font-mono font-bold text-slate-800">Rs. {log.newRate.toFixed(2)}</td>
                        <td className={`py-3 px-2 font-mono font-semibold ${log.change >= 0 ? 'text-teal-605' : 'text-red-500'}`}>
                          {log.change >= 0 ? `+${log.change.toFixed(2)}` : log.change.toFixed(2)}
                        </td>
                        <td className="py-3 px-2 font-mono font-bold text-slate-800">
                          {log.stockAtTime.toLocaleString()} Ltr
                        </td>
                        <td className={`py-3 px-2 font-mono font-extrabold ${isGain ? 'text-teal-600' : 'text-red-500'}`}>
                          {isGain ? '+' : '-'}Rs. {Math.abs(log.impactAmount).toLocaleString()}
                        </td>
                        <td className="py-3 px-3 text-right text-slate-450 font-medium whitespace-nowrap overflow-hidden max-w-xs text-ellipsis">
                          <span className="block font-semibold text-slate-700">{log.reason}</span>
                          <span className="block text-[9px] text-slate-400 font-mono">By: {log.changedBy}</span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL 1: SUPPLIER STOCK RECEIPT (Module-C) */}
      <AnimatePresence>
        {showAddStockModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs"
          >
              <motion.div
                initial={{ scale: 0.95, y: 15, opacity: 0 }}
                animate={{ scale: 1, y: 0, opacity: 1 }}
                exit={{ scale: 0.95, y: 15, opacity: 0 }}
                transition={{ type: "spring", damping: 25, stiffness: 350 }}
                className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-xl border border-slate-200 bg-white p-6 shadow-xl"
              >
                <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                  <h3 className="font-sans text-base font-bold text-slate-900 flex items-center gap-2">
                    <PlusCircle className="h-5 w-5 text-orange-600" />
                    <span>{t('Register Supplier Stock Receipt', 'نیا اسٹاک سپلائی کھاتہ انٹری')}</span>
                  </h3>
                  <button onClick={() => setShowAddStockModal(false)} className="text-slate-400 hover:text-slate-650 cursor-pointer font-bold text-xl">&times;</button>
                </div>

                <form onSubmit={handleAddStockSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-555 uppercase tracking-wider mb-1">{t('Select Product Grade:', 'پراڈکٹ منتخب کریں:')}</label>
                      <select
                        value={selectedProductId}
                        onChange={(e) => setSelectedProductId(e.target.value)}
                        className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 font-sans text-xs focus:border-orange-500 focus:outline-hidden"
                      >
                        {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-555 uppercase tracking-wider mb-1">{t('Suppliers Depot:', 'سپلائر انتخاب کریں:')}</label>
                      <select
                        value={supplierId}
                        onChange={(e) => setSupplierId(e.target.value)}
                        className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 font-sans text-xs focus:border-orange-500 focus:outline-hidden"
                      >
                        {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {!isLube && (
                    <div>
                      <label className="block text-[10px] font-bold text-slate-555 uppercase tracking-wider mb-1">{t('Fuel Stock Grade Type:', 'فیول گریڈ قسم:')}</label>
                      <select
                        value={fuelType}
                        onChange={(e) => setFuelType(e.target.value)}
                        className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 font-sans text-xs focus:border-orange-500 focus:outline-hidden"
                      >
                        {productSubtypes.map(sub => (
                          <option key={sub.value} value={sub.value}>{sub.label}</option>
                        ))}
                      </select>
                    </div>
                    )}

                    <div className={isLube ? 'col-span-2' : ''}>
                      <label className="block text-[10px] font-bold text-slate-555 uppercase tracking-wider mb-1">{isLube ? t('Received Qty (Units):', 'موصول مقدار (یونٹس):') : t('Delivered Qty (Ltr):', 'سپلائی مقدار (لیٹرز):')}</label>
                      <input
                        type="number"
                        required
                        value={receiptQty}
                        onChange={(e) => setReceiptQty(e.target.value)}
                        placeholder={isLube ? 'e.g. 24' : 'e.g. 5000'}
                        className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1 font-mono text-xs focus:border-orange-500 focus:outline-hidden"
                      />
                    </div>
                  </div>

                  <div className={`grid gap-3 ${isLube ? 'grid-cols-1' : 'grid-cols-2'}`}>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-555 uppercase tracking-wider mb-1">{t('Total Base Value (Rs):', 'مجموعی خرید قیمت:')}</label>
                      <input
                        type="text"
                        readOnly
                        value={receiptCost ? `Rs. ${Number(receiptCost).toLocaleString('en-PK')}` : ''}
                        placeholder={t('Auto-calculated (Qty * Rate)', 'خودکار حساب (مقدار * قیمت)')}
                        className="w-full rounded-lg border border-slate-200 bg-slate-50 text-slate-500 font-bold px-2 py-1 font-mono text-xs cursor-not-allowed focus:outline-hidden"
                      />
                    </div>

                    {!isLube && (
                    <div>
                      <label className="block text-[10px] font-bold text-slate-555 uppercase tracking-wider mb-1">{t('Carriage / Karaya (Rs):', 'گاڑی کرایہ / فریٹ (روپے):')}</label>
                      <input
                        type="number"
                        value={carriageCost}
                        onChange={(e) => setCarriageCost(e.target.value)}
                        placeholder="e.g. 15000"
                        className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1 font-mono text-xs focus:border-orange-500 focus:outline-hidden"
                      />
                    </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-555 uppercase tracking-wider mb-1">{isLube ? t('Purchase Unit Rate:', 'خرید فی یونٹ ریٹ:') : t('Purchase Unit Rate (P/L):', 'خرید فی لیٹر ریٹ:')}</label>
                      <input
                        type="number"
                        required
                        value={purchasePrice}
                        onChange={(e) => setPurchasePrice(e.target.value)}
                        placeholder={isLube ? 'e.g. 850' : 'e.g. 265'}
                        className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1 font-mono text-xs focus:border-orange-500 focus:outline-hidden"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-555 uppercase tracking-wider mb-1">{isLube ? t('Selling Unit Rate:', 'فروخت فی یونٹ ریٹ:') : t('Selling Unit Rate (P/L):', 'فروخت فی لیٹر ریٹ:')}</label>
                      <input
                        type="number"
                        value={sellingPrice}
                        onChange={(e) => setSellingPrice(e.target.value)}
                        placeholder={isLube ? 'e.g. 1100' : 'e.g. 282'}
                        className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1 font-mono text-xs focus:border-orange-500 focus:outline-hidden"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-555 uppercase tracking-wider mb-1">{t('Supplier Invoice / Delivery Order (D.O):', 'سپلائر بل نمبر / ڈیلیوری آرڈر:')}</label>
                    <input
                      type="text"
                      required
                      value={invoiceRef}
                      onChange={(e) => setInvoiceRef(e.target.value)}
                      placeholder="PSO-DE-883"
                      className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs focus:border-orange-500 focus:outline-hidden"
                    />
                  </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-orange-600 hover:bg-orange-700 text-white font-sans text-sm font-bold tracking-wider rounded-lg shadow-md mt-4 cursor-pointer"
                >
                  {t('UPGRADE STOCK QUANTITY', 'اسٹاک بڑھائیں')}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MODAL 2: TANKS RECONCILIATION PHYSICAL DIP MEASUREMENT VERIFICATIONS */}
      <AnimatePresence>
        {showReconcileModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs"
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
                    className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-2 font-sans text-sm focus:border-orange-500 focus:outline-hidden"
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
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 font-mono text-sm focus:border-orange-500 focus:outline-hidden"
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
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 font-sans text-xs focus:border-orange-500 focus:outline-hidden"
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

    </div>
  );
}
