import React, { useState, useEffect } from 'react';
import { Activity } from 'lucide-react';
import { Product, Tank, RateHistoryEntry, GlobalSettings } from '../../../types';
import { t } from '../../../lib/translations';

import MidShiftRateModal from './MidShiftRateModal';
import PriceImpactSimulatorModal from './PriceImpactSimulatorModal';
import { useShiftStore } from '../../../stores/useShiftStore';
import { useInventoryStore } from '../../../stores/useInventoryStore';

interface RateWizardProps {
  isLube?: boolean;
  products: Product[];
  tanks: Tank[];
  rateHistory: RateHistoryEntry[];
  language: string;
  onUpdateProductRate: (
    productId: string,
    newRate: number,
    reason?: string,
    changedBy?: string,
    dateStr?: string,
    orgId?: string,
    stationId?: string,
     
     
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    checkPerm?: any,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    attachments?: any[]
  ) => void;
  onLogAudit: (category: string, action: string, details: string) => void;
  onUpdateProducts?: (products: Product[]) => void;
  settings: GlobalSettings;
}

export default function RateWizard({
   
  isLube,
  products,
   
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  tanks,
  rateHistory,
  language,
   
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  settings,
  onUpdateProductRate,
  onLogAudit,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onUpdateProducts
}: RateWizardProps) {
   
  const [selectedProduct, setSelectedProduct] = useState<string>('');
  const [targetRate, setTargetRate] = useState<string>('');
  const [targetDate, setTargetDate] = useState<string>('');
  
  const activeShifts = useShiftStore(state => state.shifts).filter(s => s.status === 'active');
   
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [rateUpdateQueue, setRateUpdateQueue] = useState<{productId: string, newRate: number, reason: string, author: string, dateStr?: string, attachments?: any[]}[]>([]);
  const [modalProduct, setModalProduct] = useState<Product | null>(null);
  const [simulatingProduct, setSimulatingProduct] = useState<{ product: Product, newRate: number, dateStr?: string } | null>(null);

  const activeProduct = products.find(p => p.id === selectedProduct);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const currentRate = activeProduct?.rate || 0;
  
  useEffect(() => {
    if (rateUpdateQueue.length > 0 && !modalProduct) {
      const nextUpdate = rateUpdateQueue[0];
      const isProductInActiveShift = activeShifts.some(shift => 
         
        Object.keys(shift.openingReadings).some(nozzleId => {
          const nz = useInventoryStore.getState().nozzles.find(n => n.id === nozzleId);
          return nz && nz.productId === nextUpdate.productId;
        })
      );

      if (isProductInActiveShift) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setModalProduct(products.find(p => p.id === nextUpdate.productId) || null);
      } else {
        // process immediately
        onUpdateProductRate(nextUpdate.productId, nextUpdate.newRate, nextUpdate.reason, nextUpdate.author, nextUpdate.dateStr, undefined, undefined, undefined, nextUpdate.attachments);
        const product = products.find(p => p.id === nextUpdate.productId);
        if (product) {
           onLogAudit(
             'Tariff', 
             nextUpdate.reason === 'OGRA Sync' ? 'OGRA Sync' : 'Update Rate', 
             `Product ${product.name} tariff updated to Rs. ${nextUpdate.newRate.toFixed(2)}.`
           );
        }
        setRateUpdateQueue(prev => prev.slice(1));
      }
    }
  }, [rateUpdateQueue, modalProduct, activeShifts, products, onUpdateProductRate, onLogAudit]);

  const handleMidShiftConfirm = async (readings: Record<string, number>) => {
    if (rateUpdateQueue.length === 0 || !modalProduct) return;
    const update = rateUpdateQueue[0];
    
    // Call useShiftStore handleMidShiftSplit
    await useShiftStore.getState().handleMidShiftSplit(update.productId, readings, update.dateStr || new Date().toISOString());
    
    // Now update the product rate
    onUpdateProductRate(update.productId, update.newRate, update.reason, update.author, update.dateStr, undefined, undefined, undefined, update.attachments);
    onLogAudit(
      'Tariff', 
      update.reason === 'OGRA Sync' ? 'OGRA Sync' : 'Update Rate', 
      `Product ${modalProduct.name} tariff updated mid-shift to Rs. ${update.newRate.toFixed(2)}.`
    );
    
    setModalProduct(null);
    setRateUpdateQueue(prev => prev.slice(1));
  };

  const handleMidShiftCancel = () => {
    setModalProduct(null);
    setRateUpdateQueue(prev => prev.slice(1)); // skip this update
  };

  const handleSaveRate = () => {
     
    if (!selectedProduct || !targetRate || isNaN(Number(targetRate))) return;
    const rateVal = Number(targetRate);
    const prod = products.find(p => p.id === selectedProduct);
    if (!prod) return;
    
    setSimulatingProduct({ product: prod, newRate: rateVal, dateStr: targetDate || new Date().toISOString() });
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleSimulatorConfirm = (reason: string, attachments: any[]) => {
    if (!simulatingProduct) return;
    setRateUpdateQueue(prev => [...prev, { 
      productId: simulatingProduct.product.id, 
      newRate: simulatingProduct.newRate, 
      reason, 
      author: 'System Admin',
       
      dateStr: simulatingProduct.dateStr,
      attachments 
    }]);
    setSimulatingProduct(null);
    setTargetRate('');
    setSelectedProduct('');
    setTargetDate('');
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleOgraApply = (updates: Array<{ productId: string; newRate: number }>) => {
    const newQueueItems = updates.map(update => ({
      productId: update.productId,
      newRate: update.newRate,
      reason: 'OGRA Sync',
      author: 'System Admin',
      dateStr: new Date().toISOString()
    }));
    setRateUpdateQueue(prev => [...prev, ...newQueueItems]);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
      
      <PriceImpactSimulatorModal
        isOpen={!!simulatingProduct}
        product={simulatingProduct?.product || null}
        newRate={simulatingProduct?.newRate || 0}
        language={language}
        onConfirm={handleSimulatorConfirm}
        onCancel={() => setSimulatingProduct(null)}
      />

      <MidShiftRateModal
        isOpen={!!modalProduct}
        product={modalProduct}
        newRate={rateUpdateQueue.length > 0 ? rateUpdateQueue[0].newRate : 0}
        activeShifts={activeShifts}
        language={language}
        onConfirm={handleMidShiftConfirm}
        onCancel={handleMidShiftCancel}
      />
      
      {/* RATES EDITOR CARDS */}
      <div className="bg-white dark:bg-[#111827] rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden mt-4">
        <div className="text-center border-b border-slate-100 dark:border-slate-800 p-6 bg-slate-50 dark:bg-[#1f2937]">
          <div className="flex justify-center mb-4">
            <div className="size-12 rounded-2xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
              <span className="material-symbols-outlined text-emerald-600 dark:text-emerald-400 text-3xl">currency_rupee</span>
            </div>
          </div>
          <h2 className="text-2xl font-black text-slate-800 dark:text-white">
            {isLube ? t('Set Product Rates', 'پراڈکٹ ریٹس مقرر کریں', language) : t('Set Fuel Rates', 'فیول ریٹس مقرر کریں', language)}
          </h2>
          <p className="text-slate-500 dark:text-slate-400 font-medium mt-2">
            {isLube
              ? t('Enter the exact effective date and current selling price', 'مؤثر تاریخ اور موجودہ فروخت کی قیمت درج کریں', language)
              : t('Enter the exact effective date and current selling price per liter', 'مؤثر تاریخ اور موجودہ فروخت کی قیمت فی لیٹر درج کریں', language)}
          </p>
        </div>

        <div className="p-6 space-y-4">
          {products.filter(p => isLube ? p.type === 'lube' : p.type !== 'lube').length === 0 ? (
             <div className="text-center py-6 text-slate-400 bg-slate-50 dark:bg-slate-800/30 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
               {isLube 
                 ? t('No lube products configured yet.', 'ابھی تک کوئی لیوب پراڈکٹس شامل نہیں ہیں۔', language)
                 : t('No fuel products configured yet.', 'ابھی تک کوئی فیول پراڈکٹس شامل نہیں ہیں۔', language)}
             </div>
          ) : (
            products.filter(p => isLube ? p.type === 'lube' : p.type !== 'lube').map((product) => (
              <div 
                key={product.id}
                className="p-5 border border-slate-200 dark:border-slate-700 rounded-2xl bg-white dark:bg-[#0B1120] shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
              >
                <div className="flex items-center gap-4">
                  <div className="size-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                    <span className="font-black text-slate-700 dark:text-slate-300 text-xl">{product.name.charAt(0)}</span>
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-slate-800 dark:text-white">{product.name}</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Rs. {product.rate} {isLube ? t('per Item', 'فی آئٹم', language) : t('per Liter', 'فی لیٹر', language)}</p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-end sm:items-center gap-3 w-full md:w-auto mt-4 md:mt-0">
                  {/* Effective Date Picker */}
                  <div className="relative w-full sm:w-48 group">
                    <label className="text-[10px] uppercase font-bold text-slate-400 absolute -top-5 left-1 transition-opacity duration-300 opacity-0 group-focus-within:opacity-100">{t('Effective Date', 'تاریخ اور وقت', language)}</label>
                    <input 
                      type="datetime-local"
                      value={selectedProduct === product.id && targetDate ? targetDate : new Date().toISOString().slice(0, 16)}
                      onChange={(e) => {
                        setSelectedProduct(product.id);
                        setTargetDate(e.target.value);
                      }}
                      onFocus={() => {
                        setSelectedProduct(product.id);
                        if (!targetDate) setTargetDate(new Date().toISOString().slice(0, 16));
                        if (!targetRate) setTargetRate(product.rate.toString());
                      }}
                      className="w-full h-14 px-3 bg-slate-50 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white dark:focus:bg-[#1e293b] focus:border-emerald-500 transition-colors font-bold text-sm text-slate-800 dark:text-white"
                    />
                  </div>

                  {/* Price Input */}
                  <div className="relative w-full sm:w-40">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <span className="text-slate-400 font-bold">Rs</span>
                    </div>
                    <input
                      type="number"
                      step="0.01"
                      value={selectedProduct === product.id ? targetRate : product.rate}
                      onChange={(e) => {
                        setSelectedProduct(product.id);
                        setTargetRate(e.target.value);
                      }}
                      onFocus={() => {
                        setSelectedProduct(product.id);
                        if (!targetDate) setTargetDate(new Date().toISOString().slice(0, 16));
                        setTargetRate(product.rate.toString());
                      }}
                      className="w-full h-14 pl-12 pr-4 bg-slate-50 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white dark:focus:bg-[#1e293b] focus:border-emerald-500 transition-colors font-bold text-lg text-slate-800 dark:text-white text-right"
                      placeholder="0.00"
                    />
                  </div>

                  {selectedProduct === product.id && targetRate && Number(targetRate) !== product.rate && (
                    <button
                      onClick={handleSaveRate}
                      className="h-14 px-6 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition-all shadow-md active:scale-95 cursor-pointer shrink-0 w-full sm:w-auto"
                    >
                      {t('Save', 'محفوظ کریں', language)}
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* PRICE HISTORY AUDIT LIST */}
      <div className="bg-white dark:bg-[#111827] rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800">
          <h3 className="font-bold text-lg text-slate-800 dark:text-white flex items-center gap-2">
            <Activity className="size-5 text-slate-400" />
            <span>{t('Historical Rate Changes', 'ریفائنری قیمت تبدیلی کا ریکارڈ', language)}</span>
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="premium-table">
            <thead>
              <tr>
                <th className="font-semibold">{t('Date & Time', 'تاریخ و وقت', language)}</th>
                <th className="font-semibold">{t('Product', 'پراڈکٹ', language)}</th>
                <th className="font-semibold">{t('Old Rate', 'پرانا ریٹ', language)}</th>
                <th className="font-semibold">{t('New Rate', 'نیا ریٹ', language)}</th>
              </tr>
            </thead>
            <tbody>
              {rateHistory.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-slate-400">
                    {t('No price revision logs registered yet.', 'پٹرول ریٹ تبدیلی کی ہسٹری خالی ہے۔', language)}
                  </td>
                </tr>
              ) : (
                rateHistory.slice(0, 10).map(rh => {
                  const prod = products.find(p => p.id === rh.productId);
                  const displayDate = rh.effectiveDate ? `${rh.effectiveDate} ${rh.effectiveTime || ''}` : (rh.date || '');
                  const displayOld = rh.oldPrice ?? (rh.oldRate || 0) ?? 0;
                  const displayNew = rh.newPrice ?? (rh.newRate || 0) ?? 0;

                  return (
                    <tr key={rh.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="text-slate-600">{displayDate}</td>
                      <td>
                        {prod ? prod.name : rh.productId}
                      </td>
                      <td>
                        {displayOld === 0 ? (
                          <span className="px-2 py-1 bg-slate-100 text-slate-500 text-xs font-bold rounded-md">
                            {t('Initial Setup', 'ابتدائی سیٹ اپ', language)}
                          </span>
                        ) : (
                          `Rs. ${displayOld.toFixed(2)}`
                        )}
                      </td>
                      <td className="text-emerald-600">Rs. {displayNew.toFixed(2)}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
      
    </div>
  );
}
