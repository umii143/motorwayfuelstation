import React, { useState, useEffect } from 'react';
import { DollarSign, Activity, Trash2, CheckCircle, Info, Edit, ArrowLeft } from 'lucide-react';
import { Product, Tank, RateHistoryEntry, GlobalSettings } from '../../../types';
import { t } from '../../../lib/translations';
import OGRAPriceSync from '../OGRAPriceSync/OGRAPriceSync';
import MidShiftRateModal from './MidShiftRateModal';
import PriceImpactSimulatorModal from './PriceImpactSimulatorModal';
import { useShiftStore } from '../../../stores/useShiftStore';
import { useInventoryStore } from '../../../stores/useInventoryStore';

interface RateWizardProps {
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
    checkPerm?: any,
    attachments?: any[]
  ) => void;
  onLogAudit: (category: string, action: string, details: string) => void;
  onUpdateProducts?: (products: Product[]) => void;
  settings: GlobalSettings;
}

export default function RateWizard({
  products,
  tanks,
  rateHistory,
  language,
  settings,
  onUpdateProductRate,
  onLogAudit,
  onUpdateProducts
}: RateWizardProps) {
  const [selectedProduct, setSelectedProduct] = useState<string>('');
  const [targetRate, setTargetRate] = useState<string>('');
  
  const activeShifts = useShiftStore(state => state.shifts).filter(s => s.status === 'active');
  const [rateUpdateQueue, setRateUpdateQueue] = useState<{productId: string, newRate: number, reason: string, author: string, attachments?: any[]}[]>([]);
  const [modalProduct, setModalProduct] = useState<Product | null>(null);
  const [simulatingProduct, setSimulatingProduct] = useState<{ product: Product, newRate: number } | null>(null);

  const activeProduct = products.find(p => p.id === selectedProduct);
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
        setModalProduct(products.find(p => p.id === nextUpdate.productId) || null);
      } else {
        // process immediately
        onUpdateProductRate(nextUpdate.productId, nextUpdate.newRate, nextUpdate.reason, nextUpdate.author, undefined, undefined, undefined, undefined, nextUpdate.attachments);
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
    await useShiftStore.getState().handleMidShiftSplit(update.productId, readings, new Date().toISOString());
    
    // Now update the product rate
    onUpdateProductRate(update.productId, update.newRate, update.reason, update.author, undefined, undefined, undefined, undefined, update.attachments);
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
    
    setSimulatingProduct({ product: prod, newRate: rateVal });
  };

  const handleSimulatorConfirm = (reason: string, attachments: any[]) => {
    if (!simulatingProduct) return;
    setRateUpdateQueue(prev => [...prev, { 
      productId: simulatingProduct.product.id, 
      newRate: simulatingProduct.newRate, 
      reason, 
      author: 'System Admin',
      attachments 
    }]);
    setSimulatingProduct(null);
    setTargetRate('');
    setSelectedProduct('');
  };

  const handleOgraApply = (updates: Array<{ productId: string; newRate: number }>) => {
    const newQueueItems = updates.map(update => ({
      productId: update.productId,
      newRate: update.newRate,
      reason: 'OGRA Sync',
      author: 'System Admin'
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
      
      {/* OGRA PRICE SYNC MODULE */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6">
        <div className="mb-6 border-b border-slate-100 pb-4">
           <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
             <Activity className="size-5 text-emerald-600" />
             <span>{t('Automated OGRA Sync', 'آٹومیٹڈ اوگرا سنک', language)}</span>
           </h3>
           <p className="text-sm text-slate-500 mt-1">
             {t('Automatically fetch and apply the latest official fuel rates from OGRA Pakistan.', 'اوگرا پاکستان سے تازہ ترین سرکاری فیول ریٹس خود بخود حاصل کریں اور لاگو کریں۔', language)}
           </p>
        </div>
        <OGRAPriceSync 
          settings={settings} 
          products={products} 
          onApplyRates={handleOgraApply} 
        />
      </div>

      {/* RATES EDITOR CARDS */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="text-center border-b border-slate-100 p-6 bg-slate-50">
          <div className="flex justify-center mb-4">
            <div className="size-12 rounded-2xl bg-emerald-100 flex items-center justify-center">
              <span className="material-symbols-outlined text-emerald-600 text-3xl">currency_rupee</span>
            </div>
          </div>
          <h2 className="text-2xl font-black text-slate-800">
            {t('Set Fuel Rates', 'فیول ریٹس مقرر کریں', language)}
          </h2>
          <p className="text-slate-500 font-medium mt-2">
            {t('Enter the current selling price per liter', 'فی لیٹر موجودہ فروخت کی قیمت درج کریں', language)}
          </p>
        </div>

        <div className="p-6 space-y-4">
          {products.filter(p => p.type === 'fuel').map((product) => (
            <div 
              key={product.id}
              className="p-5 border border-slate-200 rounded-2xl bg-white shadow-sm flex flex-row items-center justify-between gap-4"
            >
              <div className="flex items-center gap-4">
                <div className="size-10 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                  <span className="font-black text-slate-700 text-xl">{product.name.charAt(0)}</span>
                </div>
                <div>
                  <h3 className="font-bold text-lg text-slate-800">{product.name}</h3>
                  <p className="text-sm text-slate-500 font-medium">{t('per Liter', 'فی لیٹر', language)}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <div className="relative w-full sm:w-48">
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
                      setTargetRate(product.rate.toString());
                    }}
                    className="w-full h-14 pl-12 pr-4 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white focus:border-emerald-500 transition-colors font-bold text-lg text-slate-800 text-right"
                    placeholder="0.00"
                  />
                </div>
                {selectedProduct === product.id && targetRate && Number(targetRate) !== product.rate && (
                  <button
                    onClick={handleSaveRate}
                    className="h-14 px-6 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition-all shadow-md active:scale-95 cursor-pointer shrink-0"
                  >
                    {t('Save', 'محفوظ کریں', language)}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* PRICE HISTORY AUDIT LIST */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-100">
          <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
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
                  return (
                    <tr key={rh.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="text-slate-600">{rh.date}</td>
                      <td>
                        {prod ? prod.name : rh.productId}
                      </td>
                      <td>
                        {rh.oldRate === 0 ? (
                          <span className="px-2 py-1 bg-slate-100 text-slate-500 text-xs font-bold rounded-md">
                            {t('Initial Setup', 'ابتدائی سیٹ اپ', language)}
                          </span>
                        ) : (
                          `Rs. ${rh.oldRate?.toFixed(2)}`
                        )}
                      </td>
                      <td className="text-emerald-600">Rs. {rh.newRate?.toFixed(2)}</td>
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
