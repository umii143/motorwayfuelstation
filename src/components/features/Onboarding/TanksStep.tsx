import React, { useState } from 'react';
import { Plus, Check, X, Database } from 'lucide-react';
import { t } from '../../../lib/translations';
import { Tank, Product } from '../../../types';

interface Props {
  tanks: Tank[];
  products: Product[];
  onUpdate: (tanks: Tank[]) => void;
  onContinue: () => void;
  language: string;
}

export function TanksStep({ tanks, products, onUpdate, onContinue, language }: Props) {
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [productId, setProductId] = useState("");
  const [capacity, setCapacity] = useState("");
  const [currentStock, setCurrentStock] = useState("");

  const resetForm = () => {
    setName("");
    setProductId("");
    setCapacity("");
    setCurrentStock("");
    setShowForm(false);
  };

  const addTank = () => {
    if (!name || !productId || !capacity || !currentStock) return;

    onUpdate([
      ...tanks,
      {
        id: 'tank_' + Date.now(),
        name,
        productId,
        capacity: Number(capacity),
        currentStock: Number(currentStock),
        openingStock: Number(currentStock),
        safeLevel: Number(capacity) * 0.8,
        criticalLevel: Number(capacity) * 0.15,
        physicalLabel: name,
        dipChart: []
      },
    ]);
    resetForm();
  };

  const removeTank = (id: string) => {
    onUpdate(tanks.filter((t) => t.id !== id));
  };

  const getProductName = (prodId: string) => {
    return products.find((p) => p.id === prodId)?.name || "";
  };

  return (
    <div className="flex items-center justify-center min-h-[80vh] p-4 animate-in fade-in slide-in-from-right-4 duration-500">
      <div className="max-w-2xl w-full bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden flex flex-col h-[85vh] max-h-[800px]">
        
        <div className="text-center border-b border-slate-100 p-6 md:p-8 shrink-0 bg-slate-50/50">
          <div className="flex justify-center mb-4">
            <div className="size-12 rounded-2xl bg-blue-100 flex items-center justify-center">
              <Database className="size-6 text-blue-600" />
            </div>
          </div>
          <h2 className="text-2xl font-black text-slate-800">
            {t('Add Storage Tanks', 'اسٹوریج ٹینکس شامل کریں', language)}
          </h2>
          <p className="text-slate-500 font-medium mt-2">
            {t('Configure your fuel storage tanks', 'اپنے فیول اسٹوریج ٹینکس کی ترتیب کریں', language)}
          </p>
        </div>

        <div className="p-6 md:p-8 space-y-8 overflow-y-auto flex-1 custom-scrollbar">
          
          {!showForm ? (
            <button
              onClick={() => setShowForm(true)}
              className="w-full h-16 border-2 border-dashed border-slate-300 rounded-2xl flex items-center justify-center gap-3 text-slate-500 hover:text-blue-600 hover:border-blue-400 hover:bg-blue-50 transition-all font-bold cursor-pointer"
            >
              <Plus className="size-6" />
              {t('Add New Tank', 'نیا ٹینک شامل کریں', language)}
            </button>
          ) : (
            <div className="border border-slate-200 rounded-2xl p-6 space-y-5 bg-slate-50/50 shadow-sm animate-in zoom-in-95 duration-200">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">{t('Tank Name', 'ٹینک کا نام', language)}</label>
                <input
                  className="w-full h-12 px-4 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors font-medium text-slate-800"
                  placeholder={t("e.g., Main Petrol Tank", "مثلاً مین پیٹرول ٹینک", language)}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">{t('Fuel Product', 'فیول پراڈکٹ', language)}</label>
                <select 
                  className="w-full h-12 px-4 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors font-medium text-slate-800 appearance-none cursor-pointer"
                  value={productId} 
                  onChange={(e) => setProductId(e.target.value)}
                >
                  <option value="" disabled>{t("Select fuel type", "فیول کی قسم منتخب کریں", language)}</option>
                  {products.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">{t('Capacity (Liters)', 'گنجائش (لیٹر)', language)}</label>
                  <input
                    type="number"
                    className="w-full h-12 px-4 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors font-medium text-slate-800"
                    placeholder="12000"
                    value={capacity}
                    onChange={(e) => setCapacity(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">{t('Current Stock (L)', 'موجودہ اسٹاک', language)}</label>
                  <input
                    type="number"
                    className="w-full h-12 px-4 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors font-medium text-slate-800"
                    placeholder="8500"
                    value={currentStock}
                    onChange={(e) => setCurrentStock(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button 
                  onClick={addTank} 
                  disabled={!name || !productId || !capacity || !currentStock}
                  className="flex-1 h-12 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-bold transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-md"
                >
                  {t('Save Tank', 'ٹینک محفوظ کریں', language)}
                </button>
                <button 
                  onClick={resetForm} 
                  className="flex-1 h-12 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl font-bold transition-colors cursor-pointer"
                >
                  {t('Cancel', 'منسوخ کریں', language)}
                </button>
              </div>
            </div>
          )}

          {tanks.length > 0 && (
            <div className="space-y-4">
              <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">
                {t('Configured Tanks', 'ترتیب دیے گئے ٹینکس', language)}
              </p>
              <div className="space-y-3">
                {tanks.map((tank, index) => (
                  <div
                    key={tank.id}
                    className="border border-blue-200 bg-blue-50/50 rounded-2xl p-5 space-y-3 animate-in fade-in slide-in-from-left-4"
                    style={{ animationDelay: `${index * 50}ms`, animationFillMode: 'both' }}
                  >
                    <div className="flex items-start justify-between">
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-3">
                          <div className="size-6 rounded-full bg-blue-200 flex items-center justify-center shrink-0">
                            <Check className="size-4 text-blue-700" />
                          </div>
                          <h4 className="font-bold text-lg text-slate-800">{tank.name}</h4>
                        </div>
                        <div className="flex items-center gap-2 ml-9">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-white border border-blue-200 text-blue-700">
                            {getProductName(tank.productId)}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => removeTank(tank.id)}
                        className="size-10 flex items-center justify-center rounded-xl hover:bg-red-100 text-slate-400 hover:text-red-600 transition-colors cursor-pointer"
                      >
                        <X className="size-5" />
                      </button>
                    </div>
                    <div className="ml-9 grid grid-cols-1 sm:grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 text-sm pt-2 border-t border-blue-100/50">
                      <div>
                        <span className="text-slate-500 font-medium">{t('Capacity:', 'گنجائش:', language)} </span>
                        <span className="font-bold text-slate-700">{Number(tank.capacity).toLocaleString()} L</span>
                      </div>
                      <div>
                        <span className="text-slate-500 font-medium">{t('Stock:', 'اسٹاک:', language)} </span>
                        <span className="font-bold text-slate-700">{Number(tank.currentStock).toLocaleString()} L</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        <div className="p-6 border-t border-slate-100 bg-white shrink-0">
          <button
            onClick={onContinue}
            disabled={tanks.length === 0}
            className="w-full py-4 bg-orange-600 hover:bg-orange-700 text-white rounded-xl font-black text-lg transition-all shadow-lg hover:shadow-orange-600/30 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none disabled:hover:scale-100 cursor-pointer"
          >
            {t('Continue', 'جاری رکھیں', language)}
          </button>
        </div>
        
      </div>
    </div>
  );
}
