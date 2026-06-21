/**
 * FuelPro — Enterprise Stock IN Form
 * Complete Fuel Costing Engine — Based on Real PSO & Attock Invoices
 * Powered by Umar Ali ⚡ | Motorway Petroleum, Mardan KPK
 */
import React, { useState, useEffect, useCallback } from 'react';
import {
  Truck, Package, Receipt, CheckCircle, Calculator, AlertTriangle,
  Info, ChevronDown, ChevronUp, Shield, FlaskConical, Droplets,
  User, CreditCard, MessageSquare, TrendingUp, TrendingDown,
  ClipboardCheck, X, Clock, Hash, Building2, Gauge, Star
} from 'lucide-react';
import { Product, Supplier, Tank, StockBatch, StockTransaction, Staff, ExpenseEntry } from '../../types';
import { useInventoryStore } from '../../stores/useInventoryStore';
import { useFinancialStore } from '../../stores/useFinancialStore';
import { t } from '../../lib/translations';
import { db } from '../../data/db';
import {
  calculateStockInMetrics,
  validateStockIn,
  validateDipReadings,
  evaluateSealStatus,
  generateBatchNumber,
  generateWhatsAppSummary,
  getSupplierRule,
  StockInMetrics,
  ValidationResult,
} from '../../services/stockInCalculations';

// ─── PROPS ────────────────────────────────────────────────────────────────────
interface StockInFormProps {
  products: Product[];
  suppliers: Supplier[];
  tanks: Tank[];
  staff?: Staff[];
  language: string;
  onClose: () => void;
  isLube: boolean;
}

// ─── SECTION TOGGLE STATE ─────────────────────────────────────────────────────
interface SectionState {
  quantity: boolean;
  pricing: boolean;
  extraCosts: boolean;
  sealVerification: boolean;
  quality: boolean;
  dipReadings: boolean;
  driverInfo: boolean;
  payment: boolean;
}

// ─── COMPONENT ────────────────────────────────────────────────────────────────
export default function StockInForm({
  products,
  suppliers,
  tanks,
  staff = [],
  language,
  onClose,
  isLube,
}: StockInFormProps) {

  const stationId = db.getActiveStationId();
  const banks = useFinancialStore(state => state.banks);
  const stockBatches = useInventoryStore(state => state.stockBatches);

  // ─── SECTION 1: DELIVERY INFO ───────────────────────────────────────────────
  const [selectedProductId, setSelectedProductId] = useState(products[0]?.id || '');
  const [supplierId, setSupplierId] = useState(suppliers[0]?.id || '');
  const [selectedTankId, setSelectedTankId] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [doNumber, setDoNumber] = useState('');
  const [tokenNumber, setTokenNumber] = useState('');
  const [deliveryDate, setDeliveryDate] = useState(() => {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    return now.toISOString().slice(0, 16);
  });
  const [receivedBy, setReceivedBy] = useState(staff[0]?.id || '');

  // ─── SECTION 2: QUANTITY ────────────────────────────────────────────────────
  const [qtyOnInvoice, setQtyOnInvoice] = useState('');
  const [qtyReceived, setQtyReceived] = useState('');
  const [dipBefore, setDipBefore] = useState('');
  const [dipAfter, setDipAfter] = useState('');

  // ─── SECTION 3: INVOICE PRICING ─────────────────────────────────────────────
  const [priceEntryMode, setPriceEntryMode] = useState<'total' | 'perLiter'>('total');
  const [invoiceTotalAmount, setInvoiceTotalAmount] = useState('');
  const [invoicePerLiterRate, setInvoicePerLiterRate] = useState('');
  const [ograPumpPrice, setOgraPumpPrice] = useState('');

  // ─── SECTION 4: EXTRA COSTS ─────────────────────────────────────────────────
  const [carriageAmount, setCarriageAmount] = useState('0');
  const [carriagePaidTo, setCarriagePaidTo] = useState('');
  const [driverTipAmount, setDriverTipAmount] = useState('0');
  const [autoAddTipToExpenses, setAutoAddTipToExpenses] = useState(true);
  const [autoAddCarriageToExpenses, setAutoAddCarriageToExpenses] = useState(true);
  const [otherCharges, setOtherCharges] = useState('0');

  // ─── SECTION 5: SEAL VERIFICATION ──────────────────────────────────────────
  const [sealFrom, setSealFrom] = useState('');
  const [sealTo, setSealTo] = useState('');
  const [sealsReceived, setSealsReceived] = useState('');
  const [sealStatusOverride, setSealStatusOverride] = useState<'ok' | 'broken' | 'missing' | 'mismatch'>('ok');
  const [sealNotes, setSealNotes] = useState('');

  // ─── SECTION 6: QUALITY / TRACEABILITY ─────────────────────────────────────
  const [observedGravity, setObservedGravity] = useState('');
  const [observedTemp, setObservedTemp] = useState('');
  const [calibrationNumber, setCalibrationNumber] = useState('');
  const [calibrationExpiry, setCalibrationExpiry] = useState('');
  const [batchTestReport, setBatchTestReport] = useState('');

  // ─── SECTION 7: DRIVER INFO ─────────────────────────────────────────────────
  const [driverName, setDriverName] = useState('');
  const [driverNic, setDriverNic] = useState('');
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [notes, setNotes] = useState('');

  // ─── SECTION 8: PAYMENT ─────────────────────────────────────────────────────
  const [paymentMethod, setPaymentMethod] = useState<'credit' | 'cash' | 'bank' | 'partial'>('credit');
  const [amountPaid, setAmountPaid] = useState('');
  const [bankAccountId, setBankAccountId] = useState('');
  const [dueDate, setDueDate] = useState('');

  // ─── UI STATE ────────────────────────────────────────────────────────────────
  const [openSections, setOpenSections] = useState<SectionState>({
    quantity: true,
    pricing: true,
    extraCosts: true,
    sealVerification: false,
    quality: false,
    dipReadings: true,
    driverInfo: false,
    payment: true,
  });
  const [savedBatch, setSavedBatch] = useState<StockBatch | null>(null);
  const [showClaimPrompt, setShowClaimPrompt] = useState(false);
  const [pendingClaimData, setPendingClaimData] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [validationMessages, setValidationMessages] = useState<ValidationResult[]>([]);

  // ─── DERIVED DATA ────────────────────────────────────────────────────────────
  const currentProd = products.find(p => p.id === selectedProductId);
  const currentSupplier = suppliers.find(s => s.id === supplierId);
  const supplierRule = getSupplierRule(currentSupplier?.name || '');
  const dealerMargin = currentProd ? db.getCurrentDealerMargin(stationId, currentProd.name) : 8.64;
  const numOgraPrice = Number(ograPumpPrice) || 0;

  // Compute effective invoice total based on entry mode
  const numQtyReceived = Number(qtyReceived) || 0;
  const numQtyOnInvoice = Number(qtyOnInvoice) || numQtyReceived;
  const effectiveInvoiceTotal = priceEntryMode === 'total'
    ? Number(invoiceTotalAmount) || 0
    : (Number(invoicePerLiterRate) || 0) * numQtyReceived;

  const numCarriage = Number(carriageAmount) || 0;
  const numTip = Number(driverTipAmount) || 0;
  const numOther = Number(otherCharges) || 0;

  // Seal evaluation
  const sealEval = sealFrom && sealTo
    ? evaluateSealStatus(sealFrom, sealTo, sealsReceived ? Number(sealsReceived) : undefined)
    : null;

  // Live metrics (only when we have the minimums)
  const metrics: StockInMetrics | null = (numQtyReceived > 0 && effectiveInvoiceTotal > 0 && numOgraPrice > 0)
    ? calculateStockInMetrics({
        qtyOnInvoice: numQtyOnInvoice,
        qtyReceived: numQtyReceived,
        invoiceTotalAmount: effectiveInvoiceTotal,
        carriageAmount: numCarriage,
        driverTipAmount: numTip,
        otherCharges: numOther,
        ograPumpPrice: numOgraPrice,
        dealerMargin,
      })
    : null;

  // Dip validation
  const dipValidation = (dipBefore && dipAfter && numQtyReceived > 0)
    ? validateDipReadings(Number(dipBefore), Number(dipAfter), numQtyReceived)
    : null;

  // ─── EFFECTS ─────────────────────────────────────────────────────────────────
  // Auto-select tank & OGRA price on product change
  useEffect(() => {
    if (!selectedProductId) return;
    const matchingTanks = tanks.filter(t => t.productId === selectedProductId);
    if (matchingTanks.length > 0) setSelectedTankId(matchingTanks[0].id);
    const prod = products.find(p => p.id === selectedProductId);
    if (prod) setOgraPumpPrice(prod.rate.toString());
  }, [selectedProductId, tanks, products]);

  // Auto-apply supplier carriage rules
  useEffect(() => {
    if (supplierRule) {
      if (supplierRule.carriageInvoiced) {
        setCarriageAmount('0');
      }
    }
  }, [supplierId, supplierRule]);

  // Run validation
  useEffect(() => {
    if (!metrics) { setValidationMessages([]); return; }
    const msgs = validateStockIn(
      {
        qtyOnInvoice: numQtyOnInvoice,
        qtyReceived: numQtyReceived,
        invoiceTotalAmount: effectiveInvoiceTotal,
        carriageAmount: numCarriage,
        driverTipAmount: numTip,
        otherCharges: numOther,
        ograPumpPrice: numOgraPrice,
        dealerMargin,
      },
      metrics
    );
    if (dipValidation) msgs.push(dipValidation);
    setValidationMessages(msgs);
  }, [metrics, dipValidation]);

  // Per-liter sync when switching modes
  useEffect(() => {
    if (priceEntryMode === 'perLiter' && metrics) {
      setInvoicePerLiterRate(metrics.invoiceCostPerLiter.toFixed(4));
    }
  }, [priceEntryMode]);

  // ─── SECTION TOGGLE ──────────────────────────────────────────────────────────
  const toggleSection = (key: keyof SectionState) => {
    setOpenSections(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // ─── SUBMIT HANDLER ──────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Basic validation
    if (!selectedProductId || numQtyReceived <= 0) {
      alert('Please select a product and enter the quantity received.');
      return;
    }
    if (!isLube && currentProd?.type === 'fuel' && !selectedTankId) {
      alert('Please select a destination tank.');
      return;
    }
    if (!supplierId) {
      alert('Please select a supplier.');
      return;
    }
    if (!receivedBy && staff.length > 0) {
      alert('Please select who received this delivery.');
      return;
    }
    if (effectiveInvoiceTotal <= 0) {
      alert('Please enter the invoice total amount.');
      return;
    }
    if (numOgraPrice <= 0) {
      alert('Please enter the OGRA pump price.');
      return;
    }
    if (!metrics) {
      alert('Please fill all required fields before saving.');
      return;
    }

    // Error-level validations block save
    const errors = validationMessages.filter(v => v.severity === 'error');
    if (errors.length > 0) {
      alert(`Please fix the following errors:\n${errors.map(e => e.message).join('\n')}`);
      return;
    }

    setSaving(true);

    try {
      const batchDate = new Date(deliveryDate).toISOString();
      const batchNum = generateBatchNumber(currentProd?.name || 'FUEL', stockBatches.length);
      const qtyShort = Math.max(0, numQtyOnInvoice - numQtyReceived);
      const dipExpectedAfter = dipBefore ? Number(dipBefore) + numQtyReceived : undefined;
      const dipVarianceVal = (dipBefore && dipAfter)
        ? Math.abs(Number(dipAfter) - (Number(dipBefore) + numQtyReceived))
        : undefined;

      // Seal status
      const finalSealStatus = sealFrom && sealTo && sealsReceived
        ? sealEval?.status === 'pending' ? 'ok' : sealEval?.status || 'ok'
        : sealStatusOverride;

      const batch: StockBatch = {
        id: `batch_${Date.now()}`,
        batchNumber: batchNum,
        productId: selectedProductId,
        productType: currentProd?.name?.toLowerCase().includes('diesel') ? 'diesel'
          : currentProd?.name?.toLowerCase().includes('petrol') ? 'petrol'
          : currentProd?.name?.toLowerCase().includes('super') ? 'super'
          : currentProd?.name?.toLowerCase().includes('kerosene') ? 'kerosene'
          : 'fuel',
        tankId: (!isLube && currentProd?.type === 'fuel') ? selectedTankId : undefined,
        supplierId,
        date: batchDate,
        deliveryDate: batchDate.split('T')[0],
        deliveryTime: deliveryDate.slice(11, 16),

        // Invoice
        invoiceNumber: invoiceNumber || undefined,
        doNumber: doNumber || undefined,
        tokenNumber: tokenNumber || undefined,

        // Quantity
        qtyOnInvoice: numQtyOnInvoice,
        qtyReceived: numQtyReceived,
        qtyShort,
        qtyRemaining: numQtyReceived,

        // Invoice pricing
        invoiceTotalAmount: effectiveInvoiceTotal,
        invoiceCostPerLiter: metrics.invoiceCostPerLiter,

        // Legacy pricing fields (backward compat)
        ograPumpPrice: numOgraPrice,
        dealerMargin,
        omcInvoicePrice: numOgraPrice - dealerMargin, // legacy

        // Extra costs
        carriageAmount: numCarriage,
        carriagePaidTo: carriagePaidTo || undefined,
        driverTipAmount: numTip,
        otherCharges: numOther,
        supplierCarriageInvoiced: supplierRule?.carriageInvoiced ?? false,

        // Landed cost
        totalExtraCosts: metrics.totalExtraCosts,
        totalLandedCost: metrics.totalLandedCost,
        landedCostPerLiter: metrics.landedCostPerLiter,

        // Legacy landed fields
        carriageTotal: numCarriage,
        carriagePerLiter: numQtyReceived > 0 ? numCarriage / numQtyReceived : 0,
        otherChargesTotal: numOther,
        otherPerLiter: numQtyReceived > 0 ? numOther / numQtyReceived : 0,

        // Expected Batch Margin
        expectedBatchMarginPerLiter: metrics.expectedBatchMarginPerLiter,
        expectedBatchMarginTotal: metrics.expectedBatchMarginTotal,

        // Legacy margin fields
        grossMarginPerLiter: metrics.expectedBatchMarginPerLiter,
        netMarginPerLiter: metrics.expectedBatchMarginPerLiter,
        expectedGrossProfit: metrics.expectedBatchMarginTotal,
        expectedNetProfit: metrics.expectedBatchMarginTotal,

        // Realized (starts at 0)
        totalLitersSold: 0,
        realizedRevenue: 0,
        realizedCOGS: 0,
        realizedMargin: 0,

        // Seal
        sealNumberFrom: sealFrom || undefined,
        sealNumberTo: sealTo || undefined,
        totalSealsExpected: sealEval?.expectedCount,
        totalSealsReceived: sealsReceived ? Number(sealsReceived) : undefined,
        sealStatus: finalSealStatus as any,
        sealNotes: sealNotes || undefined,

        // Quality
        observedGravity: observedGravity ? Number(observedGravity) : undefined,
        observedTemp: observedTemp ? Number(observedTemp) : undefined,
        calibrationNumber: calibrationNumber || undefined,
        calibrationExpiry: calibrationExpiry || undefined,
        batchTestReport: batchTestReport || undefined,

        // Dip
        dipBefore: dipBefore ? Number(dipBefore) : undefined,
        dipAfter: dipAfter ? Number(dipAfter) : undefined,
        dipExpectedAfter,
        dipVariance: dipVarianceVal,

        // Driver
        driverName: driverName || undefined,
        driverNic: driverNic || undefined,
        vehicleNumber: vehicleNumber || undefined,

        // Payment
        paymentMethod,
        amountPaid: Number(amountPaid) || 0,
        outstandingBalance: metrics.totalLandedCost - (Number(amountPaid) || 0),
        paymentDueDate: dueDate || undefined,

        // Metadata
        receivedBy: receivedBy || undefined,
        status: 'active',
        batchStatus: 'active',
        qualityStatus: 'clear',
        agingAlertSent: false,
        revaluationGainLoss: 0,
        notes: notes || undefined,

        stationId,
        businessType: 'fuel_station',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      // Legacy StockTransaction for compatibility
      const newTxn: StockTransaction = {
        id: `stk_${Date.now()}`,
        itemId: selectedProductId,
        type: 'receipt',
        quantity: numQtyReceived,
        by: invoiceNumber || `${currentSupplier?.name || 'Supplier'} Delivery`,
        date: batchDate.split('T')[0],
        amount: effectiveInvoiceTotal,
        purchasePrice: metrics.landedCostPerLiter,
        sellingPrice: numOgraPrice,
        fuelType: currentProd?.type === 'fuel' ? currentProd.name : undefined,
        supplierId,
        carriageCost: metrics.totalExtraCosts,
        tankId: batch.tankId,
        paymentMode: paymentMethod === 'partial' ? 'cash' : paymentMethod,
        amountPaid: Number(amountPaid) || 0,
        bankAccountId: paymentMethod === 'bank' ? bankAccountId : undefined,
        dueDate: paymentMethod === 'credit' ? dueDate : undefined,
        invoiceNo: invoiceNumber,
        stationId,
        businessType: 'fuel_station',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      const inventoryStore = useInventoryStore.getState();
      await inventoryStore.handleAddStockBatch(batch);
      await inventoryStore.handleAddStockReceipt(newTxn);

      // Auto-create expense for Driver Tip
      if (numTip > 0 && autoAddTipToExpenses) {
        const { useFinancialStore: useFS } = await import('../../stores/useFinancialStore');
        const financialStore = useFS.getState();
        await financialStore.handleAddStandaloneExpense({
          id: `exp_tip_${batch.id}`,
          categoryId: 'driver_gratuity',
          categoryName: 'Driver Gratuity',
          amount: numTip,
          description: `Driver tip — ${currentSupplier?.name || ''} delivery${invoiceNumber ? ` Invoice ${invoiceNumber}` : ''} (Batch ${batchNum})`,
          date: batchDate.split('T')[0],
          paidFrom: 'cash',
        } as ExpenseEntry, undefined, stationId);
      }

      // Auto-create expense for separate Carriage
      if (numCarriage > 0 && autoAddCarriageToExpenses && !supplierRule?.carriageInvoiced) {
        const { useFinancialStore: useFS } = await import('../../stores/useFinancialStore');
        const financialStore = useFS.getState();
        await financialStore.handleAddStandaloneExpense({
          id: `exp_carr_${batch.id}`,
          categoryId: 'carriage_freight',
          categoryName: 'Carriage & Freight',
          amount: numCarriage,
          description: `Carriage${carriagePaidTo ? ` (${carriagePaidTo})` : ''} — Batch ${batchNum}`,
          date: batchDate.split('T')[0],
          paidFrom: 'cash',
        } as ExpenseEntry, undefined, stationId);
      }

      setSavedBatch(batch);

      // Auto-prompt claim if short > 50L
      if (qtyShort > 50) {
        const claimAmount = qtyShort * numOgraPrice;
        setPendingClaimData({
          batchId: batch.id,
          supplierId,
          supplierName: currentSupplier?.name || '',
          qtyShort,
          claimAmount,
          invoiceNumber,
          batchNumber: batchNum,
          claimType: 'short_quantity',
        });
        setShowClaimPrompt(true);
      } else if (finalSealStatus !== 'ok') {
        setPendingClaimData({
          batchId: batch.id,
          supplierId,
          supplierName: currentSupplier?.name || '',
          claimAmount: 0,
          invoiceNumber,
          batchNumber: batchNum,
          claimType: 'seal_broken',
          description: `Seal ${finalSealStatus.toUpperCase()}: Seals ${sealFrom}–${sealTo}`
        });
        setShowClaimPrompt(true);
      }

    } catch (err) {
      console.error('Error saving Stock IN:', err);
      alert('Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // ─── SECTION HEADER ───────────────────────────────────────────────────────────
  const SectionHeader = ({
    title, icon: Icon, sectionKey, badge, badgeColor = 'emerald'
  }: {
    title: string;
    icon: React.ElementType;
    sectionKey: keyof SectionState;
    badge?: string;
    badgeColor?: 'emerald' | 'orange' | 'blue' | 'red';
  }) => (
    <button
      type="button"
      onClick={() => toggleSection(sectionKey)}
      className="w-full flex items-center justify-between text-left py-3 px-4 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors group border border-slate-200"
    >
      <div className="flex items-center gap-2.5">
        <div className="size-7 rounded-lg bg-orange-100 flex items-center justify-center">
          <Icon className="size-3.5 text-orange-600" />
        </div>
        <span className="font-bold text-sm text-slate-800 uppercase tracking-wide">{title}</span>
        {badge && (
          <span className={`text-xs px-2 py-0.5 rounded-full font-semibold
            ${badgeColor === 'emerald' ? 'bg-emerald-100 text-emerald-700' :
              badgeColor === 'orange' ? 'bg-orange-100 text-orange-700' :
              badgeColor === 'blue' ? 'bg-blue-100 text-blue-700' :
              'bg-red-100 text-red-700'}`}>
            {badge}
          </span>
        )}
      </div>
      {openSections[sectionKey]
        ? <ChevronUp className="size-4 text-slate-400 group-hover:text-slate-600" />
        : <ChevronDown className="size-4 text-slate-400 group-hover:text-slate-600" />
      }
    </button>
  );

  // ─── FIELD WRAPPER ────────────────────────────────────────────────────────────
  const Field = ({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) => (
    <div>
      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">{label}</label>
      {children}
      {hint && <p className="text-xs text-slate-400 mt-1">{hint}</p>}
    </div>
  );

  const inputCls = "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-800 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none text-sm transition-colors";
  const selectCls = "w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-slate-800 focus:border-orange-500 focus:bg-white focus:outline-none text-sm";

  // ─── POST-SAVE RECEIPT VIEW ───────────────────────────────────────────────────
  if (savedBatch) {
    return (
      <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-0 sm:p-4 bg-slate-900/70 backdrop-blur-sm overflow-y-auto">
        <div className="bg-white rounded-none sm:rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden sm:my-8">
          {/* Receipt Header */}
          <div className="bg-gradient-to-br from-emerald-600 to-emerald-700 px-6 py-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="size-12 rounded-xl bg-white/20 flex items-center justify-center">
                  <CheckCircle className="size-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">Batch Saved! ✅</h2>
                  <p className="text-emerald-100 text-sm">#{savedBatch.batchNumber}</p>
                </div>
              </div>
              <button onClick={onClose} className="p-2 text-white/70 hover:text-white rounded-full hover:bg-white/10">
                <X className="size-5" />
              </button>
            </div>
          </div>

          <div className="p-6 space-y-4">
            {/* Cost Summary */}
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
              <h3 className="font-bold text-sm text-slate-700 uppercase tracking-wide mb-3 flex items-center gap-2">
                <Receipt className="size-4 text-orange-600" /> WHAT YOU PAID
              </h3>
              <div className="space-y-2">
                {savedBatch.invoiceTotalAmount && (
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Invoice ({currentSupplier?.name})</span>
                    <span className="font-semibold">Rs. {savedBatch.invoiceTotalAmount.toLocaleString('en-PK', { minimumFractionDigits: 2 })}</span>
                  </div>
                )}
                {(savedBatch.driverTipAmount || 0) > 0 && (
                  <div className="flex justify-between text-sm text-orange-700">
                    <span>Driver Tip</span>
                    <span className="font-semibold">Rs. {savedBatch.driverTipAmount?.toLocaleString()}</span>
                  </div>
                )}
                {(savedBatch.carriageAmount || 0) > 0 && (
                  <div className="flex justify-between text-sm text-orange-700">
                    <span>Separate Carriage</span>
                    <span className="font-semibold">Rs. {savedBatch.carriageAmount?.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-bold text-slate-800 border-t border-slate-200 pt-2 mt-2">
                  <span>TOTAL LANDED COST</span>
                  <span>Rs. {(savedBatch.totalLandedCost || 0).toLocaleString('en-PK', { minimumFractionDigits: 2 })}</span>
                </div>
                <p className="text-xs text-slate-400">{savedBatch.landedCostPerLiter.toFixed(4)}/L</p>
              </div>
            </div>

            {/* Profit Preview */}
            <div className="bg-slate-800 rounded-xl p-4 text-white">
              <h3 className="font-bold text-sm text-slate-200 uppercase tracking-wide mb-3 flex items-center gap-2">
                <TrendingUp className="size-4 text-emerald-400" /> EXPECTED BATCH MARGIN
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-slate-400 text-xs">Per Liter</p>
                  <p className="text-2xl font-bold text-emerald-400">
                    Rs. {(savedBatch.expectedBatchMarginPerLiter || 0).toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-slate-400 text-xs">Total ({savedBatch.qtyReceived.toLocaleString()}L)</p>
                  <p className="text-2xl font-bold text-emerald-400">
                    Rs. {(savedBatch.expectedBatchMarginTotal || 0).toLocaleString('en-PK', { maximumFractionDigits: 0 })}
                  </p>
                </div>
              </div>
              <p className="text-slate-400 text-xs mt-2">OGRA: Rs. {savedBatch.ograPumpPrice}/L | Landed: Rs. {savedBatch.landedCostPerLiter.toFixed(2)}/L</p>
            </div>

            {/* WhatsApp Summary */}
            <div className="bg-green-50 border border-green-200 rounded-xl p-4">
              <h3 className="font-bold text-sm text-green-800 mb-2 flex items-center gap-2">
                <MessageSquare className="size-4" /> WhatsApp Summary
              </h3>
              <pre className="text-xs text-green-700 whitespace-pre-wrap font-mono leading-relaxed">
                {generateWhatsAppSummary({
                  stationName: db.getSettings(stationId).stationName,
                  supplierName: currentSupplier?.name || '',
                  productName: currentProd?.name || '',
                  qtyReceived: savedBatch.qtyReceived,
                  invoiceNumber: savedBatch.invoiceNumber,
                  deliveryDate: savedBatch.deliveryDate || savedBatch.date,
                  invoiceTotalAmount: savedBatch.invoiceTotalAmount || 0,
                  driverTipAmount: savedBatch.driverTipAmount || 0,
                  totalLandedCost: savedBatch.totalLandedCost || 0,
                  landedCostPerLiter: savedBatch.landedCostPerLiter,
                  ograPumpPrice: savedBatch.ograPumpPrice,
                  expectedBatchMarginPerLiter: savedBatch.expectedBatchMarginPerLiter || 0,
                  expectedBatchMarginTotal: savedBatch.expectedBatchMarginTotal || 0,
                  dipBefore: savedBatch.dipBefore,
                  dipAfter: savedBatch.dipAfter,
                  batchNumber: savedBatch.batchNumber,
                })}
              </pre>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={onClose}
                className="flex-1 py-3 rounded-xl font-bold text-white bg-orange-600 hover:bg-orange-700 transition-colors"
              >
                Close ✓
              </button>
            </div>
          </div>
        </div>

        {/* Claim Prompt Modal */}
        {showClaimPrompt && pendingClaimData && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/50">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="size-12 rounded-xl bg-red-100 flex items-center justify-center">
                  <AlertTriangle className="size-6 text-red-600" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800">
                    {pendingClaimData.claimType === 'seal_broken' ? 'Seal Integrity Issue!' : 'Short Quantity Detected!'}
                  </h3>
                  <p className="text-sm text-slate-500">Raise a claim with {pendingClaimData.supplierName}?</p>
                </div>
              </div>
              
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4">
                {pendingClaimData.claimType === 'seal_broken' ? (
                  <div className="text-sm">
                    <p className="text-red-600 font-semibold mb-1">Issue Description</p>
                    <p className="font-bold text-red-700">{pendingClaimData.description}</p>
                    <p className="text-xs text-red-500 mt-2">Enter claim amount in the claims dashboard.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-red-600 font-semibold">Short Quantity</p>
                      <p className="text-xl font-bold text-red-700">{pendingClaimData.qtyShort}L</p>
                    </div>
                    <div>
                      <p className="text-red-600 font-semibold">Claim Amount</p>
                      <p className="text-xl font-bold text-red-700">
                        Rs. {pendingClaimData.claimAmount.toLocaleString('en-PK', { maximumFractionDigits: 0 })}
                      </p>
                    </div>
                  </div>
                )}
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => { setShowClaimPrompt(false); }}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-medium hover:bg-slate-50"
                >
                  Skip for Now
                </button>
                <button
                  onClick={() => {
                    setShowClaimPrompt(false);
                    // Claim creation logic would open ClaimsPanel
                    alert(`Claim CLM-${new Date().getFullYear()}-XXXX will be created for Rs. ${Math.round(pendingClaimData.claimAmount).toLocaleString()}. Open Supplier Claims module to complete.`);
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-red-600 text-white font-bold hover:bg-red-700"
                >
                  Raise Claim →
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ─── MAIN FORM ────────────────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-none sm:rounded-2xl shadow-2xl w-full max-w-5xl overflow-hidden sm:my-8 min-h-screen sm:min-h-0 flex flex-col">

        {/* ─── HEADER ─────────────────────────────────────────────────────────── */}
        <div className="bg-gradient-to-r from-orange-600 to-orange-500 px-4 sm:px-6 py-4 sm:py-5 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
              <Truck className="size-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-white leading-tight">
                Record Fuel Purchase
              </h2>
              <p className="text-orange-100 text-xs">Enterprise Costing Engine · Batch {generateBatchNumber(currentProd?.name || 'FUEL', stockBatches.length)}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-white/70 hover:text-white rounded-full hover:bg-white/10 transition-colors">
            <X className="size-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-0 xl:gap-6 p-4 sm:p-6 pb-24 sm:pb-6">

            {/* ─── LEFT+MIDDLE: Form Sections (2/3 width) ─────────────────────── */}
            <div className="xl:col-span-2 space-y-4">

              {/* DELIVERY INFO — always visible */}
              <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                  <Building2 className="size-4 text-orange-600" />
                  <h3 className="font-bold text-sm text-slate-800 uppercase tracking-wide">Delivery Info</h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="Supplier *">
                    <select value={supplierId} onChange={e => setSupplierId(e.target.value)} className={selectCls} required>
                      <option value="">— Select Supplier —</option>
                      {suppliers.map(s => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                    {supplierRule && (
                      <p className={`text-xs mt-1 px-2 py-1 rounded-md ${supplierRule.carriageInvoiced ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                        {supplierRule.carriageInvoiced ? 'ℹ️ Delivery included in invoice' : 'ℹ️ Carriage billed separately'}
                      </p>
                    )}
                  </Field>

                  <Field label="Product *">
                    <select value={selectedProductId} onChange={e => setSelectedProductId(e.target.value)} className={selectCls} required>
                      {products.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </Field>

                  {!isLube && currentProd?.type === 'fuel' && (
                    <Field label="Destination Tank *">
                      <select value={selectedTankId} onChange={e => setSelectedTankId(e.target.value)} className={selectCls} required>
                        <option value="">— Choose Tank —</option>
                        {tanks.filter(t => t.productId === selectedProductId).map(tank => (
                          <option key={tank.id} value={tank.id}>{tank.name}</option>
                        ))}
                      </select>
                    </Field>
                  )}

                  <Field label="Invoice No.">
                    <input type="text" value={invoiceNumber} onChange={e => setInvoiceNumber(e.target.value)}
                      className={inputCls} placeholder="e.g. 8810/02293" />
                  </Field>

                  <Field label="DO Number">
                    <input type="text" value={doNumber} onChange={e => setDoNumber(e.target.value)}
                      className={inputCls} placeholder="e.g. 11807" />
                  </Field>

                  <Field label="Token No.">
                    <input type="text" value={tokenNumber} onChange={e => setTokenNumber(e.target.value)}
                      className={inputCls} placeholder="e.g. 1011815761" />
                  </Field>

                  <Field label="Delivery Date & Time *">
                    <input type="datetime-local" value={deliveryDate} onChange={e => setDeliveryDate(e.target.value)}
                      className={inputCls} required />
                  </Field>

                  {staff.length > 0 && (
                    <Field label="Received By *">
                      <select value={receivedBy} onChange={e => setReceivedBy(e.target.value)} className={selectCls} required>
                        <option value="">— Select Staff —</option>
                        {staff.filter(s => s.active).map(s => (
                          <option key={s.id} value={s.id}>{s.name} — {s.role}</option>
                        ))}
                      </select>
                    </Field>
                  )}
                </div>
              </div>

              {/* ─── QUANTITY & DIP ─────────────────────────────────────────────── */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <SectionHeader title="Quantity & Dip Readings" icon={Gauge} sectionKey="quantity" />
                {openSections.quantity && (
                  <div className="p-4 space-y-4 bg-white">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Field label="Qty on Invoice (L) *">
                        <div className="relative">
                          <input type="number" step="1" value={qtyOnInvoice}
                            onChange={e => setQtyOnInvoice(e.target.value)}
                            className={inputCls} placeholder="10,000" />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">L</span>
                        </div>
                      </Field>

                      <Field label="Qty Received (Actual) *">
                        <div className="relative">
                          <input type="number" step="1" value={qtyReceived}
                            onChange={e => setQtyReceived(e.target.value)}
                            className={inputCls} placeholder="10,000" required />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">L</span>
                        </div>
                      </Field>

                      <Field label="Short Quantity">
                        <div className={`rounded-lg border px-3 py-2 text-sm font-bold
                          ${metrics && metrics.qtyShort > 50 ? 'bg-red-50 border-red-300 text-red-700' :
                            metrics && metrics.qtyShort > 0 ? 'bg-amber-50 border-amber-200 text-amber-700' :
                            'bg-emerald-50 border-emerald-200 text-emerald-700'}`}>
                          {metrics ? (
                            <span>{metrics.qtyShort > 0 ? `⚠️ ${metrics.qtyShort}L Short` : '✅ 0L — Perfect'}</span>
                          ) : <span className="text-slate-400">Auto-calculated</span>}
                        </div>
                      </Field>
                    </div>

                    {/* Dip Readings */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
                      <Field label="Tank Dip Before">
                        <div className="relative">
                          <input type="number" step="1" value={dipBefore}
                            onChange={e => setDipBefore(e.target.value)}
                            className={inputCls} placeholder="e.g. 3,200" />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">L</span>
                        </div>
                      </Field>

                      <Field label="Tank Dip After">
                        <div className="relative">
                          <input type="number" step="1" value={dipAfter}
                            onChange={e => setDipAfter(e.target.value)}
                            className={inputCls} placeholder="e.g. 13,200" />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">L</span>
                        </div>
                      </Field>

                      <Field label="Expected After">
                        <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-mono text-slate-600">
                          {dipBefore && numQtyReceived > 0
                            ? `${(Number(dipBefore) + numQtyReceived).toLocaleString()} L`
                            : '—'}
                        </div>
                      </Field>
                    </div>

                    {dipValidation && (
                      <div className={`text-sm rounded-lg px-3 py-2 flex items-center gap-2
                        ${dipValidation.severity === 'error' ? 'bg-red-50 text-red-700 border border-red-200' :
                          'bg-amber-50 text-amber-700 border border-amber-200'}`}>
                        <AlertTriangle className="size-4 shrink-0" />
                        <span>{dipValidation.message}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* ─── INVOICE PRICING ──────────────────────────────────────────── */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <SectionHeader title="Invoice Pricing" icon={Receipt} sectionKey="pricing" badge="KEY" badgeColor="orange" />
                {openSections.pricing && (
                  <div className="p-4 space-y-4 bg-white">

                    {/* Entry Mode Toggle */}
                    <div className="flex rounded-xl overflow-hidden border border-slate-200">
                      <button type="button"
                        onClick={() => setPriceEntryMode('total')}
                        className={`flex-1 py-2.5 text-sm font-semibold transition-colors ${priceEntryMode === 'total' ? 'bg-orange-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-50'}`}>
                        ● Enter Total Invoice Amount (Recommended)
                      </button>
                      <button type="button"
                        onClick={() => setPriceEntryMode('perLiter')}
                        className={`flex-1 py-2.5 text-sm font-semibold transition-colors ${priceEntryMode === 'perLiter' ? 'bg-orange-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-50'}`}>
                        ○ Enter Custom Purchase Price (w/ Discount)
                      </button>
                    </div>

                    {priceEntryMode === 'total' ? (
                      <Field label="Total Invoice Amount (Rs.) *"
                        hint="Enter the exact total from the paper invoice. Includes all charges.">
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-500">Rs.</span>
                          <input type="number" step="0.01" value={invoiceTotalAmount}
                            onChange={e => setInvoiceTotalAmount(e.target.value)}
                            className={`${inputCls} pl-10 text-lg font-bold`}
                            placeholder="3,751,951.36" required />
                        </div>
                        {metrics && (
                          <div className="mt-2 flex items-center gap-2 text-sm bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
                            <Calculator className="size-4 text-emerald-600 shrink-0" />
                            <span className="text-emerald-700">
                              Invoice Cost/Liter: <strong>Rs. {metrics.invoiceCostPerLiter.toFixed(4)}</strong>
                              {supplierRule?.carriageInvoiced && (
                                <span className="ml-2 text-emerald-600 text-xs">(incl. delivery & all taxes)</span>
                              )}
                            </span>
                          </div>
                        )}
                      </Field>
                    ) : (
                      <Field label="Custom Purchase Price / Liter (Rs.) *" hint="Enter the actual purchase rate you got from the supplier (including any special discounts) to calculate correct profit margins.">
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-500">Rs.</span>
                          <input type="number" step="0.0001" value={invoicePerLiterRate}
                            onChange={e => setInvoicePerLiterRate(e.target.value)}
                            className={`${inputCls} pl-10`}
                            placeholder="375.2000" />
                        </div>
                        {numQtyReceived > 0 && invoicePerLiterRate && (
                          <p className="text-xs text-slate-500 mt-1">
                            = Rs. {(Number(invoicePerLiterRate) * numQtyReceived).toLocaleString('en-PK', { minimumFractionDigits: 2 })} total invoice value
                          </p>
                        )}
                      </Field>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Field label="OGRA Pump Price (Rs./L) *" hint="Auto-filled from Price Setup">
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-500">Rs.</span>
                          <input type="number" step="0.01" value={ograPumpPrice}
                            onChange={e => setOgraPumpPrice(e.target.value)}
                            className={`${inputCls} pl-10 font-semibold`} required />
                        </div>
                      </Field>

                      <div>
                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                          OGRA Dealer Margin 🔒
                        </label>
                        <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm flex items-center justify-between">
                          <span className="text-slate-600">Fixed by OGRA</span>
                          <span className="font-bold text-slate-800">Rs. {dealerMargin.toFixed(2)}/L</span>
                        </div>
                      </div>
                    </div>

                    {supplierRule?.carriageInvoiced && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg px-3 py-2.5 flex items-start gap-2">
                        <Info className="size-4 text-blue-600 shrink-0 mt-0.5" />
                        <p className="text-xs text-blue-700">
                          <strong>{currentSupplier?.name}</strong> includes delivery charges (DLVCHRG, SSLF) in the invoice total.
                          You do <strong>NOT</strong> need to add separate carriage for this supplier.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* ─── EXTRA COSTS ──────────────────────────────────────────────── */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <SectionHeader title="Extra Costs" icon={CreditCard} sectionKey="extraCosts" />
                {openSections.extraCosts && (
                  <div className="p-4 space-y-4 bg-white">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <Field label="Separate Carriage (Rs.)" hint={supplierRule?.carriageInvoiced ? 'PSO/Shell: leave as 0 — included in invoice' : 'Attock/GO: enter the separate carriage bill amount'}>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-500">Rs.</span>
                            <input type="number" step="0.01" value={carriageAmount}
                              onChange={e => setCarriageAmount(e.target.value)}
                              className={`${inputCls} pl-9`}
                              disabled={supplierRule?.carriageInvoiced}
                              placeholder="0.00" />
                          </div>
                          {numCarriage > 0 && numQtyReceived > 0 && (
                            <p className="text-xs text-slate-500 mt-1">= Rs. {(numCarriage / numQtyReceived).toFixed(4)}/L</p>
                          )}
                        </Field>
                        {numCarriage > 0 && !supplierRule?.carriageInvoiced && (
                          <div className="mt-2">
                            <input type="text" value={carriagePaidTo} onChange={e => setCarriagePaidTo(e.target.value)}
                              className={`${inputCls} text-xs`} placeholder="Carriage paid to (e.g. Abdullah Enterprises)" />
                            <label className="flex items-center gap-2 mt-1.5 cursor-pointer">
                              <input type="checkbox" checked={autoAddCarriageToExpenses}
                                onChange={e => setAutoAddCarriageToExpenses(e.target.checked)}
                                className="rounded" />
                              <span className="text-xs text-slate-500">Auto-add to Expenses → Carriage & Freight</span>
                            </label>
                          </div>
                        )}
                      </div>

                      <div>
                        <Field label="Driver Tip/Gratuity (Rs.)"
                          hint="Cash tip to delivery driver (common: Rs. 200–500)">
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-500">Rs.</span>
                            <input type="number" step="1" value={driverTipAmount}
                              onChange={e => setDriverTipAmount(e.target.value)}
                              className={`${inputCls} pl-9`} placeholder="500" />
                          </div>
                        </Field>
                        {numTip > 0 && (
                          <label className="flex items-center gap-2 mt-1.5 cursor-pointer">
                            <input type="checkbox" checked={autoAddTipToExpenses}
                              onChange={e => setAutoAddTipToExpenses(e.target.checked)}
                              className="rounded" />
                            <span className="text-xs text-slate-500">Auto-add to Expenses → Driver Gratuity</span>
                          </label>
                        )}
                      </div>
                    </div>

                    <Field label="Other Charges (Rs.)">
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-500">Rs.</span>
                        <input type="number" step="0.01" value={otherCharges}
                          onChange={e => setOtherCharges(e.target.value)}
                          className={`${inputCls} pl-9`} placeholder="0.00" />
                      </div>
                    </Field>
                  </div>
                )}
              </div>

              {/* ─── SEAL VERIFICATION ────────────────────────────────────────── */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <SectionHeader title="Seal Verification" icon={Shield} sectionKey="sealVerification"
                  badge={sealEval && sealEval.status !== 'ok' && sealEval.status !== 'pending' ? sealEval.status.toUpperCase() : undefined}
                  badgeColor="red" />
                {openSections.sealVerification && (
                  <div className="p-4 space-y-4 bg-white">
                    <div className="grid grid-cols-2 sm:grid-cols-2 sm:grid-cols-4 gap-4">
                      <Field label="Seal No. From">
                        <input type="text" value={sealFrom} onChange={e => setSealFrom(e.target.value)}
                          className={inputCls} placeholder="920851" />
                      </Field>
                      <Field label="Seal No. To">
                        <input type="text" value={sealTo} onChange={e => setSealTo(e.target.value)}
                          className={inputCls} placeholder="920862" />
                      </Field>
                      <Field label="Expected Count">
                        <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600 font-mono">
                          {sealEval ? sealEval.expectedCount : '—'}
                        </div>
                      </Field>
                      <Field label="Seals Received">
                        <input type="number" step="1" value={sealsReceived}
                          onChange={e => setSealsReceived(e.target.value)}
                          className={inputCls} placeholder="12" />
                      </Field>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {(['ok', 'broken', 'missing', 'mismatch'] as const).map(status => (
                        <label key={status}
                          className={`flex items-center gap-2 px-3 py-1.5 rounded-full border cursor-pointer text-sm font-medium transition-colors
                            ${(sealEval?.status === status || (!sealEval && sealStatusOverride === status))
                              ? status === 'ok' ? 'bg-emerald-600 border-emerald-600 text-white'
                                : 'bg-red-600 border-red-600 text-white'
                              : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'}`}>
                          <input type="radio" name="sealStatus" value={status}
                            checked={sealEval ? sealEval.status === status : sealStatusOverride === status}
                            onChange={() => setSealStatusOverride(status)}
                            className="hidden" />
                          {status === 'ok' ? '✅ OK' : status === 'broken' ? '⚠️ Broken' : status === 'missing' ? '❌ Missing' : '⚠️ Mismatch'}
                        </label>
                      ))}
                    </div>

                    {sealEval && sealEval.status !== 'ok' && sealEval.status !== 'pending' && (
                      <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                        <p className="text-sm font-semibold text-red-700">
                          🚨 SEAL {sealEval.status.toUpperCase()}! Expected {sealEval.expectedCount} seals, received {sealsReceived || '?'}.
                        </p>
                        <p className="text-xs text-red-600 mt-1">A supplier claim will be suggested after saving.</p>
                      </div>
                    )}

                    <Field label="Seal Notes">
                      <input type="text" value={sealNotes} onChange={e => setSealNotes(e.target.value)}
                        className={inputCls} placeholder="Any notes about seal condition..." />
                    </Field>
                  </div>
                )}
              </div>

              {/* ─── QUALITY / TRACEABILITY ───────────────────────────────────── */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <SectionHeader title="Batch Quality Data" icon={FlaskConical} sectionKey="quality" />
                {openSections.quality && (
                  <div className="p-4 space-y-4 bg-white">
                    <div className="grid grid-cols-1 sm:grid-cols-1 sm:grid-cols-2 gap-4">
                      <Field label="Observed Gravity" hint="From Attock/PSO invoice">
                        <input type="number" step="0.0001" value={observedGravity}
                          onChange={e => setObservedGravity(e.target.value)}
                          className={inputCls} placeholder="0.7210" />
                      </Field>
                      <Field label="Temperature (°C)" hint="From invoice">
                        <input type="number" step="0.1" value={observedTemp}
                          onChange={e => setObservedTemp(e.target.value)}
                          className={inputCls} placeholder="92" />
                      </Field>
                      <Field label="Calibration No." hint="From tanker calibration doc">
                        <input type="text" value={calibrationNumber}
                          onChange={e => setCalibrationNumber(e.target.value)}
                          className={inputCls} placeholder="7499" />
                      </Field>
                      <Field label="Calibration Expiry">
                        <input type="date" value={calibrationExpiry}
                          onChange={e => setCalibrationExpiry(e.target.value)}
                          className={inputCls} />
                      </Field>
                      <Field label="Batch Test Report">
                        <input type="text" value={batchTestReport}
                          onChange={e => setBatchTestReport(e.target.value)}
                          className={inputCls} placeholder="Optional" />
                      </Field>
                    </div>
                  </div>
                )}
              </div>

              {/* ─── DRIVER INFO ──────────────────────────────────────────────── */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <SectionHeader title="Driver Info" icon={User} sectionKey="driverInfo" />
                {openSections.driverInfo && (
                  <div className="p-4 space-y-4 bg-white">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Field label="Driver Name">
                        <input type="text" value={driverName} onChange={e => setDriverName(e.target.value)}
                          className={inputCls} placeholder="e.g. Sohail (PSO Tanker)" />
                      </Field>
                      <Field label="Driver NIC">
                        <input type="text" value={driverNic} onChange={e => setDriverNic(e.target.value)}
                          className={inputCls} placeholder="e.g. 1601-7852847-1" />
                      </Field>
                      <Field label="Vehicle / Tanker No.">
                        <input type="text" value={vehicleNumber} onChange={e => setVehicleNumber(e.target.value)}
                          className={inputCls} placeholder="e.g. TAL-945" />
                      </Field>
                    </div>
                    <Field label="Notes">
                      <textarea value={notes} onChange={e => setNotes(e.target.value)}
                        rows={2} className={`${inputCls} resize-none`}
                        placeholder="Any additional notes about this delivery..." />
                    </Field>
                  </div>
                )}
              </div>

              {/* ─── PAYMENT ──────────────────────────────────────────────────── */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <SectionHeader title="Payment" icon={CreditCard} sectionKey="payment" />
                {openSections.payment && (
                  <div className="p-4 space-y-4 bg-white">
                    <div className="grid grid-cols-2 sm:grid-cols-2 sm:grid-cols-4 gap-3">
                      {(['credit', 'cash', 'bank', 'partial'] as const).map(mode => (
                        <button key={mode} type="button"
                          onClick={() => { setPaymentMethod(mode); if (mode === 'cash' || mode === 'bank') setAmountPaid((metrics?.totalLandedCost || 0).toFixed(2)); if (mode === 'credit') setAmountPaid(''); }}
                          className={`py-2.5 rounded-xl text-sm font-semibold border transition-colors ${paymentMethod === mode ? 'bg-orange-600 border-orange-600 text-white' : 'bg-white border-slate-200 text-slate-600 hover:border-orange-300'}`}>
                          {mode === 'credit' ? '📝 Credit' : mode === 'cash' ? '💵 Cash' : mode === 'bank' ? '🏦 Bank' : '💳 Partial'}
                        </button>
                      ))}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {(paymentMethod === 'cash' || paymentMethod === 'bank' || paymentMethod === 'partial') && (
                        <Field label="Amount Paid (Rs.)">
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-500">Rs.</span>
                            <input type="number" step="0.01" value={amountPaid}
                              onChange={e => setAmountPaid(e.target.value)}
                              className={`${inputCls} pl-9`} />
                          </div>
                          {metrics && amountPaid && (
                            <p className="text-xs mt-1">
                              Remaining: <strong className="text-orange-600">
                                Rs. {(metrics.totalLandedCost - Number(amountPaid)).toLocaleString('en-PK', { maximumFractionDigits: 2 })}
                              </strong>
                            </p>
                          )}
                        </Field>
                      )}

                      {paymentMethod === 'bank' && (
                        <Field label="Bank Account">
                          <select value={bankAccountId} onChange={e => setBankAccountId(e.target.value)} className={selectCls}>
                            <option value="">— Select Bank —</option>
                            {banks.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                          </select>
                        </Field>
                      )}

                      {(paymentMethod === 'credit' || paymentMethod === 'partial') && (
                        <Field label="Payment Due Date">
                          <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)}
                            className={inputCls} />
                        </Field>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* ─── RIGHT: Live Profit Preview ───────────────────────────────────── */}
            <div className="xl:col-span-1 space-y-4">
              {/* Sticky on desktop */}
              <div className="xl:sticky xl:top-4 space-y-4">

                {/* Live Profit Preview */}
                <div className="bg-slate-900 rounded-2xl p-5 text-white shadow-xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-40 h-40 rounded-full bg-orange-500/10 -mr-12 -mt-12 blur-2xl" />
                  <div className="absolute bottom-0 left-0 w-32 h-32 rounded-full bg-emerald-500/10 -ml-8 -mb-8 blur-2xl" />

                  <div className="relative">
                    <div className="flex items-center gap-2 mb-4">
                      <Calculator className="size-4 text-orange-400" />
                      <h3 className="text-xs font-bold text-slate-300 uppercase tracking-widest">LIVE PROFIT PREVIEW</h3>
                    </div>

                    {metrics ? (
                      <div className="space-y-4">
                        {/* What You Paid */}
                        <div className="space-y-2 border-b border-white/10 pb-4">
                          <p className="text-xs text-slate-400 uppercase tracking-wide">What You Paid</p>
                          <div className="flex justify-between items-baseline">
                            <span className="text-xs text-slate-400">Invoice</span>
                            <span className="text-sm font-mono">Rs. {effectiveInvoiceTotal.toLocaleString('en-PK', { maximumFractionDigits: 0 })}</span>
                          </div>
                          {numTip > 0 && (
                            <div className="flex justify-between items-baseline">
                              <span className="text-xs text-amber-400">Driver Tip</span>
                              <span className="text-sm font-mono text-amber-400">+ Rs. {numTip.toLocaleString()}</span>
                            </div>
                          )}
                          {numCarriage > 0 && (
                            <div className="flex justify-between items-baseline">
                              <span className="text-xs text-amber-400">Carriage</span>
                              <span className="text-sm font-mono text-amber-400">+ Rs. {numCarriage.toLocaleString()}</span>
                            </div>
                          )}
                          <div className="flex justify-between items-baseline pt-1 border-t border-white/10">
                            <span className="text-xs text-slate-300 font-semibold">Total Landed</span>
                            <span className="font-bold">Rs. {metrics.totalLandedCost.toLocaleString('en-PK', { maximumFractionDigits: 0 })}</span>
                          </div>
                          <p className="text-xs text-slate-500 text-right">Rs. {metrics.landedCostPerLiter.toFixed(4)}/L</p>
                        </div>

                        {/* What You'll Earn */}
                        <div className="space-y-2 border-b border-white/10 pb-4">
                          <p className="text-xs text-slate-400 uppercase tracking-wide">What You'll Earn</p>
                          <div className="flex justify-between items-baseline">
                            <span className="text-xs text-slate-400">Revenue ({numQtyReceived.toLocaleString()}L)</span>
                            <span className="text-sm font-mono">Rs. {metrics.estimatedRevenue.toLocaleString('en-PK', { maximumFractionDigits: 0 })}</span>
                          </div>
                          <div className="flex justify-between items-baseline text-red-400">
                            <span className="text-xs">Total Cost</span>
                            <span className="text-sm font-mono">- Rs. {metrics.totalLandedCost.toLocaleString('en-PK', { maximumFractionDigits: 0 })}</span>
                          </div>
                        </div>

                        {/* Expected Batch Margin */}
                        <div className={`rounded-xl p-3 ${metrics.expectedBatchMarginPerLiter > 0 ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-red-500/10 border border-red-500/20'}`}>
                          <p className="text-xs text-slate-400 mb-1">Expected Batch Margin</p>
                          <p className={`text-2xl font-black ${metrics.expectedBatchMarginPerLiter > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                            Rs. {metrics.expectedBatchMarginTotal.toLocaleString('en-PK', { maximumFractionDigits: 0 })}
                          </p>
                          <p className={`text-sm font-bold mt-0.5 ${metrics.expectedBatchMarginPerLiter > 0 ? 'text-emerald-300' : 'text-red-300'}`}>
                            Rs. {metrics.expectedBatchMarginPerLiter.toFixed(4)}/L
                            {metrics.expectedBatchMarginPerLiter > 0 ? ' ✅' : ' ❌'}
                          </p>
                        </div>

                        {/* OGRA Comparison */}
                        <div className="space-y-1.5 text-xs">
                          <div className="flex justify-between">
                            <span className="text-slate-400">OGRA Fixed Margin</span>
                            <span className="text-slate-300">Rs. {dealerMargin.toFixed(2)}/L</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">Your Actual Margin</span>
                            <span className="text-slate-300">Rs. {metrics.expectedBatchMarginPerLiter.toFixed(2)}/L</span>
                          </div>
                          {metrics.effectiveMarginVsOGRA !== 0 && (
                            <div className={`flex justify-between font-semibold ${metrics.effectiveMarginVsOGRA > 0 ? 'text-orange-400' : 'text-emerald-400'}`}>
                              <span>Difference</span>
                              <span>{metrics.effectiveMarginVsOGRA > 0 ? '- ' : '+ '}Rs. {Math.abs(metrics.effectiveMarginVsOGRA).toFixed(2)}/L
                                {metrics.effectiveMarginVsOGRA > 0 ? ' (extra costs)' : ' (above OGRA)'}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="text-center text-slate-500 py-8">
                        <Calculator className="size-10 mx-auto mb-3 opacity-30" />
                        <p className="text-sm">Enter invoice data to see live profit preview</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Validation Messages */}
                {validationMessages.length > 0 && (
                  <div className="space-y-2">
                    {validationMessages.map((msg, i) => (
                      <div key={i} className={`rounded-xl px-3 py-2.5 text-xs flex items-start gap-2
                        ${msg.severity === 'error' ? 'bg-red-50 text-red-700 border border-red-200' :
                          msg.severity === 'warning' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                          'bg-blue-50 text-blue-700 border border-blue-100'}`}>
                        <AlertTriangle className="size-3.5 mt-0.5 shrink-0" />
                        <span className="leading-relaxed">{msg.message}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Batch Info Preview */}
                {metrics && (
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2 text-xs">
                    <p className="font-bold text-slate-700 text-sm">Batch Preview</p>
                    <div className="space-y-1.5 text-slate-600">
                      <div className="flex justify-between">
                        <span>Invoice Cost/L</span>
                        <span className="font-mono">Rs. {metrics.invoiceCostPerLiter.toFixed(4)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Landed Cost/L</span>
                        <span className="font-mono font-semibold">Rs. {metrics.landedCostPerLiter.toFixed(4)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>OGRA Price/L</span>
                        <span className="font-mono">Rs. {numOgraPrice.toFixed(2)}</span>
                      </div>
                      {metrics.qtyShort > 0 && (
                        <div className="flex justify-between text-red-600">
                          <span>Short Qty</span>
                          <span className="font-mono font-semibold">{metrics.qtyShort}L ⚠️</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ─── FOOTER ACTIONS ───────────────────────────────────────────────── */}
          <div className="sticky bottom-0 bg-white border-t border-slate-200 px-4 sm:px-6 py-4 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-3">
            <button type="button" onClick={onClose}
              className="px-6 py-3 sm:py-2.5 rounded-xl font-medium text-slate-600 hover:bg-slate-100 transition-colors w-full sm:w-auto text-center border border-slate-200">
              Cancel
            </button>
            <button type="submit" disabled={saving || validationMessages.some(v => v.severity === 'error')}
              className="px-8 py-3 sm:py-2.5 rounded-xl font-bold text-white bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 transition-all flex items-center justify-center gap-2 shadow-lg shadow-orange-600/20 disabled:opacity-50 w-full sm:w-auto">
              {saving ? (
                <>
                  <div className="size-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Package className="size-4" />
                  💾 Save Stock IN →
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
