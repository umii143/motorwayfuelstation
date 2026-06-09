import React, { useState, useEffect } from 'react';
import { Package, Truck, Receipt, CheckCircle, Calculator, Info, AlertTriangle } from 'lucide-react';
import { Product, Supplier, Tank, StockBatch, StockTransaction } from '../../types';
import { useInventoryStore } from '../../stores/useInventoryStore';
import { useFinancialStore } from '../../stores/useFinancialStore';
import { t } from '../../lib/translations';
import { db } from '../../data/db';

interface StockInFormProps {
  products: Product[];
  suppliers: Supplier[];
  tanks: Tank[];
  language: string;
  onClose: () => void;
  isLube: boolean;
}

export default function StockInForm({
  products,
  suppliers,
  tanks,
  language,
  onClose,
  isLube
}: StockInFormProps) {
  const [selectedProductId, setSelectedProductId] = useState(products[0]?.id || '');
  const [supplierId, setSupplierId] = useState(suppliers[0]?.id || '');
  const [selectedTankId, setSelectedTankId] = useState('');
  
  const [receiptQty, setReceiptQty] = useState('');
  const [invoiceQty, setInvoiceQty] = useState('');
  
  const [ograPumpPrice, setOgraPumpPrice] = useState('');
  const [carriageCost, setCarriageCost] = useState('');
  const [otherCharges, setOtherCharges] = useState('');
  const [invoiceRef, setInvoiceRef] = useState('');
  
  const [dipBefore, setDipBefore] = useState('');
  const [dipAfter, setDipAfter] = useState('');

  const [purchaseDate, setPurchaseDate] = useState(() => {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    return now.toISOString().slice(0, 16);
  });

  // Payment State
  const [paymentMode, setPaymentMode] = useState<'cash' | 'bank' | 'credit'>('credit');
  const [amountPaid, setAmountPaid] = useState('');
  const [bankAccountId, setBankAccountId] = useState('');
  const [dueDate, setDueDate] = useState('');

  const banks = useFinancialStore(state => state.banks);
  const currentProd = products.find(p => p.id === selectedProductId);
  const stationId = db.getActiveStationId();

  // Derived metrics
  const dealerMargin = currentProd ? db.getCurrentDealerMargin(stationId, currentProd.name) : 0;
  const numOgraPrice = Number(ograPumpPrice) || 0;
  const omcInvoicePrice = numOgraPrice - dealerMargin;
  
  const qty = Number(receiptQty) || 0;
  const carriageTotal = Number(carriageCost) || 0;
  const otherTotal = Number(otherCharges) || 0;
  
  const carriagePerLiter = qty > 0 ? carriageTotal / qty : 0;
  const otherPerLiter = qty > 0 ? otherTotal / qty : 0;
  const landedCostPerLiter = omcInvoicePrice + carriagePerLiter + otherPerLiter;
  
  const grossMarginPerLiter = dealerMargin;
  const netMarginPerLiter = numOgraPrice - landedCostPerLiter;
  
  const totalInvoiceAmount = omcInvoicePrice * qty;
  const totalCostWithCarriage = totalInvoiceAmount + carriageTotal + otherTotal;
  
  const expectedGrossProfit = grossMarginPerLiter * qty;
  const expectedNetProfit = netMarginPerLiter * qty;

  // Auto-select tank & pre-fill OGRA rate when product changes
  useEffect(() => {
    if (!selectedProductId) {
      setSelectedTankId('');
      setOgraPumpPrice('');
      return;
    }
    const matchingTanks = tanks.filter(t => t.productId === selectedProductId);
    if (matchingTanks.length > 0) {
      setSelectedTankId(matchingTanks[0].id);
    } else {
      setSelectedTankId('');
    }
    
    const prod = products.find(p => p.id === selectedProductId);
    if (prod) {
      setOgraPumpPrice(prod.rate.toString());
    }
  }, [selectedProductId, tanks, products]);

  const handleAddStockSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedProductId || qty <= 0 || numOgraPrice <= 0) {
      alert(t('Please fill all required fields with valid positive numbers.', 'براہ کرم تمام خانے درست نمبرز کے ساتھ پر کریں۔', language));
      return;
    }

    if (!isLube && currentProd?.type === 'fuel' && !selectedTankId) {
       alert(t('Please select a storage tank for fuel delivery.', 'براہ کرم فیول کے لیے ٹینک منتخب کریں۔', language));
       return;
    }

    if (!supplierId) {
       alert(t('Please select a supplier.', 'براہ کرم سپلائر منتخب کریں۔', language));
       return;
    }

    // Validations (±Re.0.50 tolerance check is implicit in the logic by locking the calculation, but we can check net margins)
    if (netMarginPerLiter <= 0) {
      alert(t('Net margin is zero or negative! Carriage/Other costs exceed dealer margin. Please check amounts.', 'خالص مارجن صفر یا منفی ہے! کرایہ/دیگر اخراجات ڈیلر مارجن سے زیادہ ہیں۔ براہ کرم رقم چیک کریں۔', language));
      return;
    }

    const paid = Number(amountPaid) || 0;
    if (paid > totalCostWithCarriage) {
       alert(t('Amount paid cannot exceed total bill.', 'ادا کی گئی رقم کل بل سے زیادہ نہیں ہو سکتی۔', language));
       return;
    }

    if (paymentMode === 'bank' && paid > 0 && !bankAccountId) {
       alert(t('Please select a bank account.', 'براہ کرم بینک اکاؤنٹ منتخب کریں۔', language));
       return;
    }

    if (paymentMode === 'credit' && !dueDate) {
       alert(t('Please enter a due date for credit purchase.', 'براہ کرم ادھار خریداری کے لیے آخری تاریخ درج کریں۔', language));
       return;
    }

    const batchDate = new Date(purchaseDate).toISOString();

    const batch: StockBatch = {
      id: `batch_${Date.now()}`,
      batchNumber: `BATCH-${batchDate.split('T')[0].replace(/-/g, '')}-${Math.floor(Math.random() * 1000)}`,
      productId: selectedProductId,
      tankId: (!isLube && currentProd?.type === 'fuel') ? selectedTankId : undefined,
      date: batchDate,
      supplierId: supplierId,
      qtyReceived: qty,
      qtyRemaining: qty,
      
      ograPumpPrice: numOgraPrice,
      dealerMargin: dealerMargin,
      omcInvoicePrice: omcInvoicePrice,
      carriageTotal: carriageTotal,
      carriagePerLiter: carriagePerLiter,
      otherChargesTotal: otherTotal,
      otherPerLiter: otherPerLiter,
      landedCostPerLiter: landedCostPerLiter,
      
      grossMarginPerLiter: grossMarginPerLiter,
      netMarginPerLiter: netMarginPerLiter,
      expectedGrossProfit: expectedGrossProfit,
      expectedNetProfit: expectedNetProfit,
      
      dipBefore: dipBefore ? Number(dipBefore) : undefined,
      dipAfter: dipAfter ? Number(dipAfter) : undefined,

      status: 'active'
    };

    const newTxn: StockTransaction = {
      id: `stk_${Date.now()}`,
      itemId: selectedProductId,
      type: 'receipt',
      quantity: qty,
      by: invoiceRef || t(`Supplier Delivery`, `سپلائر کی ترسیل`, language),
      date: batchDate.split('T')[0],
      amount: totalInvoiceAmount,
      purchasePrice: omcInvoicePrice,
      fuelType: currentProd?.type === 'fuel' ? currentProd.name : undefined,
      supplierId: supplierId,
      carriageCost: carriageTotal + otherTotal,
      tankId: batch.tankId,
      paymentMode,
      amountPaid: paid,
      bankAccountId: paymentMode === 'bank' ? bankAccountId : undefined,
      dueDate: paymentMode === 'credit' ? dueDate : undefined,
      invoiceNo: invoiceRef
    };

    const inventoryStore = useInventoryStore.getState();
    await inventoryStore.handleAddStockBatch(batch);
    await inventoryStore.handleAddStockReceipt(newTxn);
    
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-none sm:rounded-2xl shadow-xl w-full max-w-4xl overflow-hidden animate-in zoom-in-95 duration-200 sm:my-8 min-h-screen sm:min-h-0 flex flex-col">
        <div className="bg-orange-600 px-4 sm:px-6 py-4 sm:py-5 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-3">
             <div className="size-8 sm:size-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
               <Truck className="size-4 sm:size-5 text-white" />
             </div>
             <h2 className="text-base sm:text-xl font-bold text-white line-clamp-1">
               {t('Record Fuel Purchase (Stock IN)', 'نیا فیول درج کریں (اسٹاک ان)', language)}
             </h2>
          </div>
          <button onClick={onClose} className="p-2 text-white/70 hover:text-white rounded-full hover:bg-white/10 transition-colors shrink-0">
            <CheckCircle className="size-5 sm:size-6" />
          </button>
        </div>

        <form onSubmit={handleAddStockSubmit} className="p-4 sm:p-6 pb-24 sm:pb-6 flex-1 overflow-y-auto">
          
          {/* HEADER SECTION */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">{t('Product', 'پراڈکٹ', language)} *</label>
              <select 
                value={selectedProductId}
                onChange={(e) => setSelectedProductId(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-slate-800 focus:border-orange-500 focus:bg-white focus:outline-none text-sm"
                required
              >
                {products.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            
            {!isLube && currentProd?.type === 'fuel' && (
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">{t('Destination Tank', 'منزل ٹینک', language)} *</label>
                <select
                  value={selectedTankId}
                  onChange={(e) => setSelectedTankId(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-slate-800 focus:border-orange-500 focus:bg-white focus:outline-none text-sm"
                  required
                >
                  <option value="">{t('-- Choose Tank --', '-- ٹینک منتخب کریں --', language)}</option>
                  {tanks.filter(t => t.productId === selectedProductId).map(tank => (
                    <option key={tank.id} value={tank.id}>{tank.name}</option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">{t('Supplier', 'سپلائر', language)} *</label>
              <select
                value={supplierId}
                onChange={(e) => setSupplierId(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-slate-800 focus:border-orange-500 focus:bg-white focus:outline-none text-sm"
                required
              >
                <option value="">{t('-- Select Supplier --', '-- سپلائر منتخب کریں --', language)}</option>
                {suppliers.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">{t('Invoice/DO No', 'بل نمبر', language)}</label>
              <input
                type="text"
                value={invoiceRef}
                onChange={(e) => setInvoiceRef(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-slate-800 focus:border-orange-500 focus:bg-white focus:outline-none text-sm"
                placeholder="e.g. DO-2026-4521"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* LEFT COLUMN: Input Fields */}
            <div className="space-y-6">
              
              {/* QUANTITY SECTION */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                <h3 className="text-sm font-bold text-slate-800 mb-4 border-b border-slate-200 pb-2">{t('QUANTITY', 'مقدار', language)}</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1.5">{t('Quantity Received', 'موصول شدہ مقدار', language)} *</label>
                    <div className="relative">
                      <input
                        type="number"
                        step="1"
                        value={receiptQty}
                        onChange={(e) => setReceiptQty(e.target.value)}
                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-800 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none pr-12"
                        placeholder="0"
                        required
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">Liters</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1.5">{t('Invoice Quantity', 'بل پر مقدار', language)}</label>
                    <div className="relative">
                      <input
                        type="number"
                        step="1"
                        value={invoiceQty}
                        onChange={(e) => setInvoiceQty(e.target.value)}
                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-800 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none pr-12"
                        placeholder="0"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">Liters</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* PRICING SECTION */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                <h3 className="text-sm font-bold text-slate-800 mb-4 border-b border-slate-200 pb-2 flex items-center justify-between">
                  {t('PRICING (AUTO-CALCULATED)', 'قیمت (خودکار)', language)}
                  <span className="text-xs font-normal text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full">OGRA Standard</span>
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1.5 flex justify-between">
                      <span>{t('OGRA Pump Price (Selling Rate)', 'اوگرا پمپ کی قیمت', language)} *</span>
                      <span className="text-slate-400 text-[10px]">(auto-filled from Price Setup)</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-slate-500">Rs.</span>
                      <input
                        type="number"
                        step="0.01"
                        value={ograPumpPrice}
                        onChange={(e) => setOgraPumpPrice(e.target.value)}
                        className="w-full rounded-lg border border-slate-300 bg-white pl-9 pr-3 py-2 text-slate-800 font-semibold focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none"
                        required
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">/ Liter</span>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-white border border-slate-200 rounded-lg p-3 gap-2 sm:gap-0">
                    <div>
                      <div className="text-sm font-semibold text-slate-700">{t('Dealer Margin', 'ڈیلر مارجن', language)}</div>
                      <div className="text-xs text-slate-500">{t('(Set by OGRA — see Settings)', '(اوگرا کی طرف سے مقرر کردہ)', language)}</div>
                    </div>
                    <div className="text-left sm:text-right flex items-center gap-2">
                      <span className="text-sm font-bold text-slate-800">Rs. {dealerMargin.toFixed(2)}</span>
                      <span className="text-xs text-slate-400">/ Liter</span>
                      <span title="Fixed Rate" className="text-slate-400 text-xs">🔒 FIXED</span>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-emerald-50 border border-emerald-200 rounded-lg p-3 gap-2 sm:gap-0">
                    <div>
                      <div className="text-sm font-bold text-emerald-800">{t('OMC Invoice Price', 'او ایم سی انوائس پرائس', language)}</div>
                      <div className="text-xs text-emerald-600">{t('(OGRA Price - Dealer Margin)', '(اوگرا پرائس - ڈیلر مارجن)', language)}</div>
                    </div>
                    <div className="text-left sm:text-right flex items-center gap-2">
                      <span className="text-base font-bold text-emerald-700">Rs. {omcInvoicePrice.toFixed(2)}</span>
                      <span className="text-xs text-emerald-600">/ Liter</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* ADDITIONAL COSTS */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                <h3 className="text-sm font-bold text-slate-800 mb-4 border-b border-slate-200 pb-2">{t('ADDITIONAL COSTS', 'دیگر اخراجات', language)}</h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1.5">{t('Total Carriage/Freight', 'کرایہ / فریٹ کی قیمت', language)}</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-slate-500">Rs.</span>
                      <input
                        type="number"
                        step="0.01"
                        value={carriageCost}
                        onChange={(e) => setCarriageCost(e.target.value)}
                        className="w-full rounded-lg border border-slate-300 bg-white pl-9 pr-3 py-2 text-slate-800 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none"
                        placeholder="0.00"
                      />
                    </div>
                    {qty > 0 && Number(carriageCost) > 0 && (
                      <div className="text-xs text-slate-500 mt-1 pl-1">
                        = Rs. {(Number(carriageCost)/qty).toFixed(2)} / Liter
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1.5">{t('Other Charges', 'دیگر چارجز', language)}</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-slate-500">Rs.</span>
                      <input
                        type="number"
                        step="0.01"
                        value={otherCharges}
                        onChange={(e) => setOtherCharges(e.target.value)}
                        className="w-full rounded-lg border border-slate-300 bg-white pl-9 pr-3 py-2 text-slate-800 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none"
                        placeholder="0.00"
                      />
                    </div>
                    {qty > 0 && Number(otherCharges) > 0 && (
                      <div className="text-xs text-slate-500 mt-1 pl-1">
                        = Rs. {(Number(otherCharges)/qty).toFixed(2)} / Liter
                      </div>
                    )}
                  </div>
                </div>
              </div>

            </div>

            {/* RIGHT COLUMN: Profit Summary & Payment */}
            <div className="space-y-6">
              
              {/* PROFIT SUMMARY */}
              <div className="bg-slate-800 rounded-xl p-5 text-white shadow-inner relative overflow-hidden">
                <div className="absolute top-0 right-0 bg-white/10 w-32 h-32 rounded-full -mr-10 -mt-10 blur-2xl"></div>
                
                <h3 className="text-sm font-bold text-slate-200 mb-5 flex items-center gap-2 uppercase tracking-wide">
                  <Calculator className="size-4 text-orange-400" />
                  {t('PROFIT SUMMARY (LIVE)', 'منافع کا خلاصہ (لائیو)', language)}
                </h3>
                
                <div className="space-y-3 mb-5 border-b border-white/10 pb-4">
                  <div className="flex flex-col sm:flex-row justify-between sm:items-center text-sm gap-1 sm:gap-0">
                    <span className="text-slate-300">{t('Total Invoice Amount', 'کل بل', language)}:</span>
                    <span className="font-medium text-lg">Rs. {totalInvoiceAmount.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                  </div>
                  <div className="text-xs text-slate-400 flex justify-between">
                    <span>({qty}L × Rs. {omcInvoicePrice.toFixed(2)})</span>
                  </div>
                </div>

                <div className="space-y-2 mb-5 border-b border-white/10 pb-4">
                  <div className="flex justify-between items-start text-sm gap-2">
                    <span className="text-slate-300">{t('Gross Margin/Liter', 'خالص مارجن/لیٹر', language)}:</span>
                    <span className="text-right">Rs. {grossMarginPerLiter.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-start text-sm text-rose-300 gap-2">
                    <span>{t('Carriage/Other per Liter', 'کرایہ وغیرہ/لیٹر', language)}:</span>
                    <span className="text-right">- Rs. {(carriagePerLiter + otherPerLiter).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm font-bold text-emerald-400 pt-2 border-t border-white/10 mt-2 gap-2">
                    <span>{t('Net Margin/Liter', 'خالص منافع/لیٹر', language)}:</span>
                    <span className="flex items-center gap-1 text-right">Rs. {netMarginPerLiter.toFixed(2)} {netMarginPerLiter > 0 && '✅'}</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex flex-col sm:flex-row justify-between sm:items-center text-sm gap-1 sm:gap-0">
                    <span className="text-slate-300">{t('Expected Gross Profit', 'متوقع کل منافع', language)}:</span>
                    <span className="font-bold">Rs. {expectedGrossProfit.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                  </div>
                  <div className="flex flex-col sm:flex-row justify-between sm:items-center text-sm gap-1 sm:gap-0">
                    <span className="text-slate-300">{t('Expected Net Profit', 'متوقع خالص منافع', language)}:</span>
                    <span className="font-bold text-emerald-400 text-lg">Rs. {expectedNetProfit.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                  </div>
                  <div className="text-[10px] text-slate-400">
                    {t('(after carriage, before staff/utility expenses)', '(کرایہ کے بعد، عملے/بلوں کے اخراجات سے پہلے)', language)}
                  </div>
                </div>
              </div>

              {/* DIP READINGS */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                <h3 className="text-sm font-bold text-slate-800 mb-4 border-b border-slate-200 pb-2">{t('DIP READINGS', 'ڈِپ ریڈنگز', language)}</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1.5">{t('Tank Level Before', 'ٹینک لیول (پہلے)', language)}</label>
                    <div className="relative">
                      <input
                        type="number"
                        step="1"
                        value={dipBefore}
                        onChange={(e) => setDipBefore(e.target.value)}
                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-800 outline-none text-sm"
                        placeholder="e.g. 2800"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">L</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1.5">{t('Tank Level After', 'ٹینک لیول (بعد میں)', language)}</label>
                    <div className="relative">
                      <input
                        type="number"
                        step="1"
                        value={dipAfter}
                        onChange={(e) => setDipAfter(e.target.value)}
                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-800 outline-none text-sm"
                        placeholder="e.g. 7800"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">L</span>
                    </div>
                  </div>
                </div>
                {dipBefore && dipAfter && (
                  <div className={`mt-3 text-sm font-semibold flex items-center justify-between p-2 rounded-lg ${(Number(dipAfter) - Number(dipBefore)) === qty ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                    <span>Difference:</span>
                    <span>{(Number(dipAfter) - Number(dipBefore)).toLocaleString()} L {(Number(dipAfter) - Number(dipBefore)) === qty ? '✅ Matches' : '⚠️ Differs'}</span>
                  </div>
                )}
              </div>

              {/* PAYMENT SECTION */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                 <h3 className="text-sm font-bold text-slate-800 mb-3 border-b border-slate-200 pb-2">{t('PAYMENT', 'ادائیگی', language)}</h3>
                 
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1.5">{t('Payment Method', 'ادائیگی کا طریقہ', language)}</label>
                      <select
                        value={paymentMode}
                        onChange={(e) => {
                          setPaymentMode(e.target.value as any);
                          if (e.target.value === 'credit') setAmountPaid('');
                          if (e.target.value === 'cash' || e.target.value === 'bank') setAmountPaid(totalCostWithCarriage.toString());
                        }}
                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-800 outline-none text-sm"
                      >
                        <option value="credit">{t('Credit (Udhar)', 'ادھار', language)}</option>
                        <option value="cash">{t('Cash', 'نقد', language)}</option>
                        <option value="bank">{t('Bank Transfer', 'بینک ٹرانسفر', language)}</option>
                      </select>
                    </div>

                    {paymentMode === 'bank' && (
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1.5">{t('Bank Account', 'بینک اکاؤنٹ', language)}</label>
                        <select
                          value={bankAccountId}
                          onChange={(e) => setBankAccountId(e.target.value)}
                          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-800 outline-none text-sm"
                        >
                          <option value="">{t('-- Select Bank --', '-- بینک منتخب کریں --', language)}</option>
                          {banks.map(b => (
                            <option key={b.id} value={b.id}>{b.name}</option>
                          ))}
                        </select>
                      </div>
                    )}

                    {paymentMode === 'credit' && (
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1.5">{t('Due Date', 'ادائیگی کی آخری تاریخ', language)}</label>
                        <input
                          type="date"
                          value={dueDate}
                          onChange={(e) => setDueDate(e.target.value)}
                          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-800 outline-none text-sm"
                        />
                      </div>
                    )}
                 </div>

                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:items-end">
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1.5">{t('Amount Paid Now', 'ادا کردہ رقم', language)}</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-slate-500">Rs.</span>
                        <input
                          type="number"
                          step="0.01"
                          max={totalCostWithCarriage}
                          value={amountPaid}
                          onChange={(e) => setAmountPaid(e.target.value)}
                          className="w-full rounded-lg border border-slate-300 bg-white pl-9 pr-3 py-2 text-slate-800 outline-none text-sm"
                          placeholder="0.00"
                        />
                      </div>
                    </div>
                    <div className="bg-orange-50 rounded-lg p-2 border border-orange-100 flex flex-col justify-center h-[38px] text-right">
                       <span className="text-orange-800 text-[10px] uppercase font-bold leading-none">{t('Remaining', 'بقیہ', language)}</span>
                       <span className="text-orange-600 font-bold text-sm leading-tight">Rs. {(totalCostWithCarriage - (Number(amountPaid) || 0)).toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                    </div>
                 </div>
              </div>

              {/* PURCHASE DATE */}
              <div className="flex flex-col sm:flex-row gap-4 sm:items-center justify-end pt-4 border-t border-slate-200">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full sm:w-auto">
                  <label className="text-xs font-medium text-slate-600 shrink-0">{t('Date & Time', 'تاریخ و وقت', language)}:</label>
                  <input
                    type="datetime-local"
                    value={purchaseDate}
                    onChange={(e) => setPurchaseDate(e.target.value)}
                    className="w-full sm:w-auto rounded-lg border border-slate-300 bg-white px-3 py-2 sm:py-1.5 text-slate-800 outline-none text-sm"
                  />
                </div>
              </div>

            </div>
          </div>

          <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-3 pt-6 mt-6 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 sm:py-2.5 rounded-xl font-medium text-slate-600 hover:bg-slate-100 transition-colors w-full sm:w-auto text-center"
            >
              {t('Cancel', 'منسوخ کریں', language)}
            </button>
            <button
              type="submit"
              className="px-6 py-3 sm:py-2.5 rounded-xl font-bold text-white bg-orange-600 hover:bg-orange-700 transition-colors flex items-center justify-center gap-2 shadow-sm w-full sm:w-auto"
            >
              <Package className="size-4" />
              {t('Save Stock IN →', 'اسٹاک محفوظ کریں', language)}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
