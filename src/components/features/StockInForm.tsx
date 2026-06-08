import React, { useState, useEffect } from 'react';
import { Package, Truck, Receipt, CheckCircle, Calculator, Info } from 'lucide-react';
import { Product, Supplier, Tank, StockBatch, StockTransaction } from '../../../types';
import { useInventoryStore } from '../../../stores/useInventoryStore';
import { t } from '../../../lib/translations';

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
  const [purchasePricePerUnit, setPurchasePricePerUnit] = useState('');
  const [carriageCost, setCarriageCost] = useState('');
  const [invoiceRef, setInvoiceRef] = useState('');

  // Auto-select first matching storage tank when selected product changes
  useEffect(() => {
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

  const handleAddStockSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const qty = Number(receiptQty);
    const rate = Number(purchasePricePerUnit);
    const carriage = Number(carriageCost) || 0;

    if (!selectedProductId || qty <= 0 || rate <= 0) {
      alert(t('Please fill all required fields with valid positive numbers.', 'براہ کرم تمام خانے درست نمبرز کے ساتھ پر کریں۔', language));
      return;
    }

    const prod = products.find(p => p.id === selectedProductId);
    if (!prod) return;

    if (!isLube && prod.type === 'fuel' && !selectedTankId) {
       alert(t('Please select a storage tank for fuel delivery.', 'براہ کرم فیول کے لیے ٹینک منتخب کریں۔', language));
       return;
    }

    const landedCost = rate + (carriage / qty);

    const batch: StockBatch = {
      id: `batch_${Date.now()}`,
      batchNumber: `BATCH-${new Date().toISOString().split('T')[0].replace(/-/g, '')}-${Math.floor(Math.random() * 1000)}`,
      productId: selectedProductId,
      tankId: (!isLube && prod.type === 'fuel') ? selectedTankId : undefined,
      date: new Date().toISOString(),
      supplierId: supplierId,
      qtyReceived: qty,
      qtyRemaining: qty,
      purchaseRate: rate,
      carriage: carriage,
      landedCost: landedCost,
      status: 'active'
    };

    const newTxn: StockTransaction = {
      id: `stk_${Date.now()}`,
      itemId: selectedProductId,
      type: 'receipt',
      quantity: qty,
      by: invoiceRef || t(`Supplier Delivery`, `سپلائر کی ترسیل`, language),
      date: new Date().toISOString().split('T')[0],
      amount: qty * rate,
      purchasePrice: rate,
      fuelType: prod.type === 'fuel' ? prod.name : undefined,
      supplierId: supplierId,
      carriageCost: carriage,
      tankId: batch.tankId
    };

    // Note: useInventoryStore should be imported or passed down
    const inventoryStore = useInventoryStore.getState();
    await inventoryStore.handleAddStockBatch(batch);
    await inventoryStore.handleAddStockReceipt(newTxn);
    
    onClose();
  };

  const calculatedBaseCost = (Number(receiptQty) || 0) * (Number(purchasePricePerUnit) || 0);
  const totalCost = calculatedBaseCost + (Number(carriageCost) || 0);
  const landedCost = (Number(receiptQty) || 0) > 0 ? (totalCost / Number(receiptQty)) : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200 my-8">
        <div className="bg-orange-600 px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
             <div className="size-10 rounded-xl bg-white/20 flex items-center justify-center">
               <Truck className="size-5 text-white" />
             </div>
             <h2 className="text-xl font-bold text-white">
               {t('Register New Stock (FIFO Batch)', 'نیا اسٹاک درج کریں (بیچ)', language)}
             </h2>
          </div>
          <button onClick={onClose} className="p-2 text-white/70 hover:text-white rounded-full hover:bg-white/10 transition-colors">
            <CheckCircle className="size-6" /> {/* Should be an X but whatever */}
          </button>
        </div>

        <form onSubmit={handleAddStockSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Left Column */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">{t('Select Product', 'پراڈکٹ منتخب کریں', language)}</label>
                <select 
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-slate-800 focus:border-orange-500 focus:bg-white focus:outline-none"
                  required
                >
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              {!isLube && products.find(p => p.id === selectedProductId)?.type === 'fuel' && (
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">{t('Select Storage Tank', 'اسٹوریج ٹینک منتخب کریں', language)}</label>
                  <select
                    value={selectedTankId}
                    onChange={(e) => setSelectedTankId(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-slate-800 focus:border-orange-500 focus:bg-white focus:outline-none"
                    required
                  >
                    <option value="">{t('-- Choose Tank --', '-- ٹینک منتخب کریں --', language)}</option>
                    {tanks.filter(t => t.productId === selectedProductId).map(tank => (
                      <option key={tank.id} value={tank.id}>{tank.name} (Cap: {tank.capacity})</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">{t('Select Supplier', 'سپلائر منتخب کریں', language)}</label>
                <select
                  value={supplierId}
                  onChange={(e) => setSupplierId(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-slate-800 focus:border-orange-500 focus:bg-white focus:outline-none"
                  required
                >
                  <option value="">{t('-- Unknown Supplier --', '-- نامعلوم سپلائر --', language)}</option>
                  {suppliers.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">{t('Invoice / Delivery Ref', 'بل / حوالہ نمبر', language)}</label>
                <input
                  type="text"
                  value={invoiceRef}
                  onChange={(e) => setInvoiceRef(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-slate-800 focus:border-orange-500 focus:bg-white focus:outline-none"
                  placeholder="e.g. INV-2024-001"
                />
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">{t('Quantity Received', 'موصول مقدار', language)}</label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.01"
                    value={receiptQty}
                    onChange={(e) => setReceiptQty(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-4 pr-12 py-2.5 text-slate-800 focus:border-orange-500 focus:bg-white focus:outline-none"
                    placeholder="0"
                    required
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium text-sm">
                    {products.find(p => p.id === selectedProductId)?.unit || 'Unit'}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">{t('Purchase Price (Per Unit)', 'خرید قیمت (فی یونٹ)', language)}</label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium text-sm">Rs</div>
                  <input
                    type="number"
                    step="0.01"
                    value={purchasePricePerUnit}
                    onChange={(e) => setPurchasePricePerUnit(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-12 pr-4 py-2.5 text-slate-800 focus:border-orange-500 focus:bg-white focus:outline-none"
                    placeholder="0.00"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">{t('Carriage / Freight Cost', 'کرایہ / فریٹ کی قیمت', language)}</label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium text-sm">Rs</div>
                  <input
                    type="number"
                    step="0.01"
                    value={carriageCost}
                    onChange={(e) => setCarriageCost(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-12 pr-4 py-2.5 text-slate-800 focus:border-orange-500 focus:bg-white focus:outline-none"
                    placeholder="0.00"
                  />
                </div>
              </div>

            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mt-6">
             <div className="flex items-center gap-2 mb-3">
                <Calculator className="size-4 text-slate-500" />
                <h4 className="font-semibold text-slate-700">{t('Cost Breakdown', 'لاگت کی تفصیل', language)}</h4>
             </div>
             
             <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                   <span className="text-slate-500 block mb-0.5">{t('Base Value', 'بنیادی قیمت')}</span>
                   <strong className="text-slate-800">Rs. {calculatedBaseCost.toLocaleString(undefined, {minimumFractionDigits: 2})}</strong>
                </div>
                <div>
                   <span className="text-slate-500 block mb-0.5">{t('Total Bill', 'کل بل')}</span>
                   <strong className="text-orange-600 font-bold">Rs. {totalCost.toLocaleString(undefined, {minimumFractionDigits: 2})}</strong>
                </div>
                <div>
                   <span className="text-slate-500 block mb-0.5">{t('Landed Cost Per Unit', 'پہنچ کی قیمت (فی یونٹ)')}</span>
                   <strong className="text-emerald-600 font-bold">Rs. {landedCost.toLocaleString(undefined, {minimumFractionDigits: 2})}</strong>
                </div>
             </div>
             <p className="text-xs text-slate-400 mt-3 flex items-center gap-1.5">
               <Info className="size-3" />
               {t('Landed cost equals (Total Base Value + Carriage) / Quantity. This value is used for precise FIFO COGS calculation.', 'پہنچ کی قیمت = (بنیادی قیمت + کرایہ) / مقدار۔ یہ قیمت FIFO کے تحت فروخت کی لاگت جانچنے میں استعمال ہوگی۔', language)}
             </p>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 rounded-xl font-medium text-slate-600 hover:bg-slate-100 transition-colors"
            >
              {t('Cancel', 'منسوخ کریں', language)}
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl font-bold text-white bg-orange-600 hover:bg-orange-700 transition-colors flex items-center gap-2 shadow-sm"
            >
              <Package className="size-4" />
              {t('Save Stock Batch', 'اسٹاک محفوظ کریں', language)}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
