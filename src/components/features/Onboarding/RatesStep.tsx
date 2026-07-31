import React, { useState, useEffect } from 'react';
import { DollarSign } from 'lucide-react';
import { t } from '../../../lib/translations';
import { Product } from '../../../types';

interface Props {
 products: Product[];
 onUpdate: (products: Product[]) => void;
 onContinue: () => void;
 language: string;
}

export function RatesStep({ products, onUpdate, onContinue, language }: Props) {
 const [rates, setRates] = useState<Record<string, string>>({ /* empty */ });

 useEffect(() => {
 // Initialize rates from products
 const initial: Record<string, string> = { /* empty */ };
 products.forEach((p) => {
 initial[p.id] = p.rate ? p.rate.toString() :"";
 });
 
 // eslint-disable-next-line react-hooks/set-state-in-effect
 setRates(initial);
 }, [products]);

 const updateRate = (id: string, value: string) => {
 setRates((prev) => ({ ...prev, [id]: value }));
 };

 const handleContinue = () => {
 const updatedProducts = products.map((p) => ({
 ...p,
 rate: Number(rates[p.id]) || 0,
 }));
 onUpdate(updatedProducts);
 onContinue();
 };

 const isComplete = products.every((p) => rates[p.id] && Number(rates[p.id]) > 0);

 return (
 <div className="flex items-center justify-center min-h-[80vh] p-4 animate-in fade-in slide-in-from-right-4 duration-500">
 <div className="max-w-2xl w-full bg-card rounded-3xl shadow-xl border border-border overflow-hidden flex flex-col h-[85vh] max-h-[800px]">
 
 <div className="text-center border-b border-border p-6 md:p-8 shrink-0 bg-subtle">
 <div className="flex justify-center mb-4">
 <div className="size-12 rounded-2xl bg-emerald-100 flex items-center justify-center">
 <DollarSign className="size-6 text-emerald-600" />
 </div>
 </div>
 <h2 className="text-2xl font-black text-foreground">
 {t('Set Fuel Rates', 'فیول ریٹس مقرر کریں', language)}
 </h2>
 <p className="text-muted-foreground font-medium mt-2">
 {t('Enter the current selling price per liter', 'فی لیٹر موجودہ فروخت کی قیمت درج کریں', language)}
 </p>
 </div>

 <div className="p-6 md:p-8 space-y-6 overflow-y-auto flex-1 custom-scrollbar">
 
 <div className="space-y-4">
 {products.map((product, index) => (
 <div 
 key={product.id}
 className="p-5 border border-border rounded-2xl bg-card shadow-sm flex flex-row items-center justify-between gap-4 animate-in fade-in slide-in-from-bottom-4"
 style={{ animationDelay: `${index * 100}ms`, animationFillMode: 'both' }}
 >
 <div className="flex items-center gap-4">
 <div className="size-10 rounded-full bg-muted flex items-center justify-center shrink-0">
 <span className="font-black text-foreground text-xl">{product.name.charAt(0)}</span>
 </div>
 <div>
 <h3 className="font-bold text-lg text-foreground">{product.name}</h3>
 <p className="text-sm text-muted-foreground font-medium">{t('per Liter', 'فی لیٹر', language)}</p>
 </div>
 </div>
 <div className="relative w-full sm:w-48">
 <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
 <span className="text-muted-foreground font-bold">Rs</span>
 </div>
 <input
 type="number"
 value={rates[product.id] ||""}
 onChange={(e) => updateRate(product.id, e.target.value)}
 className="w-full h-14 pl-12 pr-4 bg-subtle border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-card focus:border-emerald-500 transition-colors font-bold text-lg text-foreground text-right"
 placeholder="0.00"
 />
 </div>
 </div>
 ))}
 </div>

 </div>

 <div className="p-6 border-t border-border bg-card shrink-0">
 <button
 onClick={handleContinue}
 disabled={!isComplete}
 className="w-full py-4 bg-orange-600 hover:bg-orange-700 text-white rounded-xl font-black text-lg transition-all shadow-lg hover:shadow-orange-600/30 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none disabled:hover:scale-100 cursor-pointer"
 >
 {t('Finish Setup', 'سیٹ اپ مکمل کریں', language)}
 </button>
 </div>
 
 </div>
 </div>
 );
}
