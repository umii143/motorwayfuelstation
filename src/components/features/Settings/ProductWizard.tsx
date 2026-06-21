import React, { useState } from 'react';
import { Plus, Check, X, Fuel } from 'lucide-react';
import { t } from '../../../lib/translations';
import { Product } from '../../../types';

interface ProductWizardProps {
  isLube?: boolean;
  products: Product[];
  language: string;
  onUpdateProducts: (products: Product[]) => void;
  onLogAudit: (category: string, action: string, details: string) => void;
}

const PRESET_FUEL_PRODUCTS = [
  { name: "Petrol", color: "bg-emerald-500" },
  { name: "Diesel", color: "bg-blue-500" },
  { name: "HOBC", color: "bg-amber-500" },
];

const PRESET_LUBE_PRODUCTS = [
  { name: "Engine Oil (1L)", color: "bg-amber-600" },
  { name: "Gear Oil (1L)", color: "bg-slate-600" },
  { name: "Brake Fluid", color: "bg-red-500" },
  { name: "Coolant", color: "bg-blue-400" },
];

export default function ProductWizard({ isLube, products, language, onUpdateProducts, onLogAudit }: ProductWizardProps) {
  const [customName, setCustomName] = useState("");
  const presets = isLube ? PRESET_LUBE_PRODUCTS : PRESET_FUEL_PRODUCTS;
  const productType = (isLube ? 'lube' : 'fuel') as 'lube' | 'fuel';
  const productUnit = isLube ? 'Pieces' : 'Liters';

  const addPresetProduct = (preset: { name: string; color: string }) => {
    if (products.find((p) => p.name === preset.name)) return;
    const newProducts = [
      ...products,
      { 
        id: 'prod_' + Date.now(), 
        name: preset.name,
        urduName: preset.name,
        rate: 0,
        type: productType,
        unit: productUnit,
        currentStock: 0,
        minStock: 100
      },
    ];
    onUpdateProducts(newProducts);
    onLogAudit('Configuration', 'Add Product', `Added preset product: ${preset.name}`);
  };

  const addCustomProduct = () => {
    if (!customName.trim()) return;
    if (products.find((p) => p.name.toLowerCase() === customName.trim().toLowerCase())) return;
    const newProducts = [
      ...products,
      { 
        id: 'prod_' + Date.now(), 
        name: customName.trim(), 
        urduName: customName.trim(),
        rate: 0,
        type: productType,
        unit: productUnit,
        currentStock: 0,
        minStock: 100
      },
    ];
    onUpdateProducts(newProducts);
    onLogAudit('Configuration', 'Add Product', `Added custom product: ${customName}`);
    setCustomName("");
  };

  const removeProduct = (id: string) => {
    const prod = products.find(p => p.id === id);
    onUpdateProducts(products.filter((p) => p.id !== id));
    if (prod) {
      onLogAudit('Configuration', 'Delete Product', `Deleted product: ${prod.name}`);
    }
  };

  const isPresetAdded = (name: string) => products.find((p) => p.name === name);

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
      
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="text-center border-b border-slate-100 p-6 bg-slate-50">
          <div className="flex justify-center mb-4">
            <div className="size-12 rounded-2xl bg-orange-100 flex items-center justify-center">
              <Fuel className="size-6 text-orange-600" />
            </div>
          </div>
          <h2 className="text-2xl font-black text-slate-800">
            {isLube ? t('Lube Products', 'لیوب پراڈکٹس', language) : t('Fuel Products', 'فیول پراڈکٹس', language)}
          </h2>
          <p className="text-slate-500 font-medium mt-2">
            {isLube 
              ? t('Manage the lube products available at your station', 'اپنے اسٹیشن پر دستیاب لیوب کی اقسام کو ترتیب دیں', language)
              : t('Manage the fuel types available at your station', 'اپنے اسٹیشن پر دستیاب فیول کی اقسام کو ترتیب دیں', language)}
          </p>
        </div>

        <div className="p-6 space-y-8">
          
          {/* Quick Add Presets */}
          <div className="space-y-4">
            <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">
              {t('Quick Add', 'جلدی شامل کریں', language)}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {presets.map((preset) => (
                <button
                  key={preset.name}
                  onClick={() => addPresetProduct(preset)}
                  disabled={!!isPresetAdded(preset.name)}
                  className={`h-16 border-2 rounded-2xl flex items-center justify-between px-4 transition-all duration-200 cursor-pointer
                    ${isPresetAdded(preset.name) 
                      ? 'border-emerald-500 bg-emerald-50 opacity-60 cursor-not-allowed' 
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
            <div className="space-y-4 pt-4 border-t border-slate-100">
              <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">
                {t('Configured Products', 'ترتیب دی گئی پراڈکٹس', language)}
              </p>
              <div className="space-y-2">
                {products.map((product) => (
                  <div
                    key={product.id}
                    className="flex items-center justify-between p-4 border border-emerald-200 bg-emerald-50/50 rounded-2xl"
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
      </div>
    </div>
  );
}
