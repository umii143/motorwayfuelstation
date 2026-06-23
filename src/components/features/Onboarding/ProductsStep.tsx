import React, { useState } from 'react';
import { Plus, Check, X, Fuel } from 'lucide-react';
import { t } from '../../../lib/translations';
import { Product } from '../../../types';

interface Props {
  products: Product[];
  onUpdate: (products: Product[]) => void;
  onContinue: () => void;
  language: string;
}

const PRESET_PRODUCTS = [
  { name: "Petrol", color: "bg-emerald-500" },
  { name: "Diesel", color: "bg-blue-500" },
  { name: "HOBC", color: "bg-amber-500" },
];

export function ProductsStep({ products, onUpdate, onContinue, language }: Props) {
  const [customName, setCustomName] = useState("");

  const addPresetProduct = (preset: { name: string; color: string }) => {
    if (products.find((p) => p.name === preset.name)) return;
    onUpdate([
      ...products,
      { 
         
        // eslint-disable-next-line react-hooks/purity
        id: 'prod_' + Date.now(), 
        name: preset.name,
        urduName: preset.name,
        rate: 0,
        type: 'fuel',
        unit: 'Liters',
        currentStock: 0,
        minStock: 100
      },
    ]);
  };

  const addCustomProduct = () => {
    if (!customName.trim()) return;
    if (products.find((p) => p.name.toLowerCase() === customName.trim().toLowerCase())) return;
    onUpdate([
      ...products,
      { 
        id: 'prod_' + Date.now(), 
        name: customName.trim(), 
        urduName: customName.trim(),
        rate: 0,
        type: 'fuel',
        unit: 'Liters',
        currentStock: 0,
        minStock: 100
      },
    ]);
    setCustomName("");
  };

  const removeProduct = (id: string) => {
    onUpdate(products.filter((p) => p.id !== id));
  };

  const isPresetAdded = (name: string) => products.find((p) => p.name === name);

  return (
    <div className="flex items-center justify-center min-h-[80vh] p-4 animate-in fade-in slide-in-from-right-4 duration-500">
      <div className="max-w-2xl w-full bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden flex flex-col h-[85vh] max-h-[800px]">
        
        <div className="text-center border-b border-slate-100 p-6 md:p-8 shrink-0 bg-slate-50/50">
          <div className="flex justify-center mb-4">
            <div className="size-12 rounded-2xl bg-orange-100 flex items-center justify-center">
              <Fuel className="size-6 text-orange-600" />
            </div>
          </div>
          <h2 className="text-2xl font-black text-slate-800">
            {t('Add Fuel Products', 'فیول پراڈکٹس شامل کریں', language)}
          </h2>
          <p className="text-slate-500 font-medium mt-2">
            {t('Select the fuel types available at your station', 'اپنے اسٹیشن پر دستیاب فیول کی اقسام منتخب کریں', language)}
          </p>
        </div>

        <div className="p-6 md:p-8 space-y-8 overflow-y-auto flex-1 custom-scrollbar">
          
          {/* Quick Add Presets */}
          <div className="space-y-4">
            <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">
              {t('Quick Add', 'جلدی شامل کریں', language)}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {PRESET_PRODUCTS.map((preset) => (
                <button
                  key={preset.name}
                  onClick={() => addPresetProduct(preset)}
                  disabled={!!isPresetAdded(preset.name)}
                  className={`h-16 border-2 rounded-2xl flex items-center justify-between px-4 transition-all duration-200 cursor-pointer
                    ${isPresetAdded(preset.name) 
                      ? 'border-emerald-500 bg-emerald-50/50 opacity-60 cursor-not-allowed' 
                      : 'border-slate-200 hover:border-orange-500 hover:shadow-md bg-white'
                    }`}
                >
                  <span className="flex items-center gap-3 font-bold text-slate-700">
                    <div className={`size-4 rounded-full shadow-sm ${preset.color}`} />
                    {preset.name}
                  </span>
                  {isPresetAdded(preset.name) && (
                    <Check className="size-5 text-emerald-500" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Custom Product */}
          <div className="space-y-4">
            <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">
              {t('Add Custom Product', 'اپنی مرضی کی پراڈکٹ شامل کریں', language)}
            </p>
            <div className="flex gap-2">
              <input
                className="flex-1 h-14 px-4 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white transition-colors font-medium text-slate-700"
                placeholder={t("e.g., Premium Diesel", "مثلاً پریمیئم ڈیزل", language)}
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addCustomProduct()}
              />
              <button 
                onClick={addCustomProduct} 
                disabled={!customName.trim()}
                className="size-14 bg-slate-800 text-white rounded-xl flex items-center justify-center hover:bg-slate-900 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shrink-0 shadow-md"
              >
                <Plus className="size-6" />
              </button>
            </div>
          </div>

          {/* Added Products List */}
          {products.length > 0 && (
            <div className="space-y-4 animate-in slide-in-from-bottom-4 fade-in duration-300">
              <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">
                {t('Configured Products', 'ترتیب دی گئی پراڈکٹس', language)}
              </p>
              <div className="space-y-2">
                {products.map((product, index) => (
                  <div
                    key={product.id}
                    className="flex items-center justify-between p-4 border border-emerald-200 bg-emerald-50/50 rounded-2xl animate-in fade-in slide-in-from-left-4"
                    style={{ animationDelay: `${index * 50}ms`, animationFillMode: 'both' }}
                  >
                    <div className="flex items-center gap-4">
                      <div className="size-8 rounded-full bg-emerald-100 flex items-center justify-center">
                        <Check className="size-4 text-emerald-600" />
                      </div>
                      <span className="font-bold text-slate-800 text-lg">{product.name}</span>
                    </div>
                    <button
                      onClick={() => removeProduct(product.id)}
                      className="size-10 flex items-center justify-center rounded-xl hover:bg-red-100 text-slate-400 hover:text-red-600 transition-colors cursor-pointer"
                    >
                      <X className="size-5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        <div className="p-6 border-t border-slate-100 bg-white shrink-0">
          <button
            onClick={onContinue}
            disabled={products.length === 0}
            className="w-full py-4 bg-orange-600 hover:bg-orange-700 text-white rounded-xl font-black text-lg transition-all shadow-lg hover:shadow-orange-600/30 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none disabled:hover:scale-100 cursor-pointer"
          >
            {t('Continue', 'جاری رکھیں', language)}
          </button>
        </div>
        
      </div>
    </div>
  );
}
