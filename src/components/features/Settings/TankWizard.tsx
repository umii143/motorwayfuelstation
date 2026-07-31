import React, { useState } from 'react';
import { Plus, X, Database, AlertTriangle } from 'lucide-react';
import { useStationStore } from '../../../stores/useStationStore';
import { Tank, Product } from '../../../types';
import { t } from '../../../lib/translations';

interface TankWizardProps {
 tanks: Tank[];
 products: Product[];
 language: string;
 onAddTank: (newTank: Tank) => void;
 onUpdateTank: (updatedTank: Tank) => void;
 onDeleteTank: (id: string) => void;
 onLogAudit: (category: string, action: string, details: string) => void;
 onUpdateProducts?: (products: Product[]) => void;
}

export default function TankWizard({ tanks, products, language, onAddTank, onUpdateTank, onDeleteTank }: TankWizardProps) {
 const [showForm, setShowForm] = useState(false);
 const [editingTankId, setEditingTankId] = useState<string | null>(null);
 const [name, setName] = useState("");
 const [productId, setProductId] = useState(products.length > 0 ? products[0].id :"");
 const [capacity, setCapacity] = useState("");
 const [currentStock, setCurrentStock] = useState("");
 const showToast = useStationStore(state => state.showToast);

 const resetForm = () => {
 setName("");
 setProductId(products.length > 0 ? products[0].id :"");
 setCapacity("");
 setCurrentStock("");
 setShowForm(false);
 setEditingTankId(null);
 };

 const handleEdit = (tank: Tank) => {
 setEditingTankId(tank.id);
 setName(tank.name);
 setProductId(tank.productId);
 setCapacity(tank.capacity.toString());
 setCurrentStock(tank.currentStock.toString());
 setShowForm(true);
 };

 const handleSave = () => {
 if (!name) return showToast(t('Please enter a tank name', 'براہ کرم ٹینک کا نام درج کریں', language), 'error');
 if (!productId) return showToast(t('Please select a fuel product', 'براہ کرم فیول پراڈکٹ منتخب کریں', language), 'error');
 if (!capacity) return showToast(t('Please enter capacity', 'براہ کرم گنجائش درج کریں', language), 'error');
 if (!currentStock && currentStock !=="0") return showToast(t('Please enter current stock', 'براہ کرم موجودہ اسٹاک درج کریں', language), 'error');

 if (editingTankId) {
 const existing = tanks.find(t => t.id === editingTankId);
 if (existing) {
 onUpdateTank({
 ...existing,
 name,
 productId,
 capacity: Number(capacity),
 currentStock: Number(currentStock),
 safeLevel: Number(capacity) * 0.8,
 criticalLevel: Number(capacity) * 0.15,
 physicalLabel: name,
 });
 }
 } else {
 onAddTank({
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
 });
 }
 resetForm();
 };

 const getProductName = (prodId: string) => {
 return products.find((p) => p.id === prodId)?.name ||"";
 };

 return (
 <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-right-4 duration-500">
 <div className="bg-card rounded-3xl shadow-sm border border-border overflow-hidden flex flex-col">
 
 <div className="p-6 md:p-8 space-y-8 flex-1">
 
 {!showForm ? (
 <button
 onClick={() => setShowForm(true)}
 className="w-full h-16 border-2 border-dashed border-border rounded-2xl flex items-center justify-center gap-3 text-muted-foreground hover:text-blue-600 hover:border-blue-400 hover:bg-blue-50 transition-all font-bold cursor-pointer"
 >
 <Plus className="size-6" />
 {t('Add New Tank', 'نیا ٹینک شامل کریں', language)}
 </button>
 ) : (
 <div className="border border-border rounded-2xl p-6 space-y-5 bg-subtle shadow-inner animate-in zoom-in-95 duration-200">
 <div className="space-y-2">
 <label className="text-sm font-bold text-foreground">{t('Tank Name', 'ٹینک کا نام', language)}</label>
 <input
 className="w-full h-12 px-4 bg-card border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors font-medium text-foreground"
 placeholder={t("e.g., Main Petrol Tank","مثلاً مین پیٹرول ٹینک", language)}
 value={name}
 onChange={(e) => setName(e.target.value)}
 />
 </div>

 <div className="space-y-2">
 <label className="text-sm font-bold text-foreground">{t('Fuel Product', 'فیول پراڈکٹ', language)}</label>
 {products.length === 0 ? (
 <div className="p-3 bg-orange-50 border border-orange-200 text-orange-700 rounded-xl text-sm flex items-center gap-2">
 <AlertTriangle className="size-4 shrink-0" />
 <span>{t("Please create a fuel product first from the Products menu.","براہ کرم پہلے پراڈکٹس مینو سے فیول پراڈکٹ بنائیں۔", language)}</span>
 </div>
 ) : (
 <select 
 className="w-full h-12 px-4 bg-card border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors font-medium text-foreground appearance-none cursor-pointer"
 value={productId} 
 onChange={(e) => setProductId(e.target.value)}
 >
 <option value="" disabled>{t("Select fuel type","فیول کی قسم منتخب کریں", language)}</option>
 {products.map((product) => (
 <option key={product.id} value={product.id}>
 {product.name}
 </option>
 ))}
 </select>
 )}
 </div>

 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
 <div className="space-y-2">
 <label className="text-sm font-bold text-foreground">{t('Capacity (Liters)', 'گنجائش (لیٹر)', language)}</label>
 <input
 type="number"
 className="w-full h-12 px-4 bg-card border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors font-medium text-foreground"
 placeholder="12000"
 value={capacity}
 onChange={(e) => setCapacity(e.target.value)}
 />
 </div>
 <div className="space-y-2">
 <label className="text-sm font-bold text-foreground">{t('Current Stock (L)', 'موجودہ اسٹاک', language)}</label>
 <input
 type="number"
 className="w-full h-12 px-4 bg-card border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors font-medium text-foreground"
 placeholder="8500"
 value={currentStock}
 onChange={(e) => setCurrentStock(e.target.value)}
 />
 </div>
 </div>

 <div className="flex gap-3 pt-2">
 <button 
 onClick={handleSave} 
 className="flex-1 h-12 premium-button hover:bg-blue-700 font-bold transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-md"
 >
 {editingTankId ? t('Update Tank', 'ٹینک اپڈیٹ کریں', language) : t('Save Tank', 'ٹینک محفوظ کریں', language)}
 </button>
 <button 
 onClick={resetForm} 
 className="flex-1 h-12 bg-card border border-border hover:bg-slate-50 text-foreground rounded-xl font-bold transition-colors cursor-pointer"
 >
 {t('Cancel', 'منسوخ کریں', language)}
 </button>
 </div>
 </div>
 )}

 {tanks.length > 0 && (
 <div className="space-y-4">
 <p className="text-sm font-bold text-muted-foreground uppercase tracking-wider">
 {t('Configured Tanks', 'ترتیب دیے گئے ٹینکس', language)}
 </p>
 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
 {tanks.map((tank, index) => (
 <div
 key={tank.id}
 className="border border-border bg-card shadow-sm rounded-2xl p-5 space-y-3 animate-in fade-in slide-in-from-left-4 transition-all hover:border-blue-300 hover:shadow-md"
 style={{ animationDelay: `${index * 50}ms`, animationFillMode: 'both' }}
 >
 <div className="flex items-start justify-between">
 <div className="space-y-1 flex-1">
 <div className="flex items-center gap-3">
 <div className="size-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
 <Database className="size-4 text-blue-600" />
 </div>
 <h4 className="font-bold text-lg text-foreground">{tank.name}</h4>
 </div>
 <div className="flex items-center gap-2 ml-11">
 {getProductName(tank.productId) ? (
 <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-card border border-border text-muted-foreground">
 {getProductName(tank.productId)}
 </span>
 ) : (
 <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-red-50 border border-red-200 text-red-600 animate-pulse">
 ⚠️ {t('Missing Product (Edit Tank)', 'لاوارث ٹینک (ترمیم کریں)', language)}
 </span>
 )}
 </div>
 </div>
 <div className="flex gap-1">
 <button
 onClick={() => handleEdit(tank)}
 className="size-8 flex items-center justify-center rounded-xl hover:bg-blue-100 text-muted-foreground hover:text-blue-600 transition-colors cursor-pointer"
 >
 <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>
 </button>
 <button
 onClick={() => onDeleteTank(tank.id)}
 className="size-8 flex items-center justify-center rounded-xl hover:bg-red-100 text-muted-foreground hover:text-red-600 transition-colors cursor-pointer"
 >
 <X className="size-4" />
 </button>
 </div>
 </div>
 <div className="ml-11 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm pt-3 border-t border-border mt-3">
 <div>
 <div className="text-muted-foreground text-[10px] font-bold uppercase tracking-wider">{t('Capacity', 'گنجائش', language)}</div>
 <div className="font-black text-foreground">{Number(tank.capacity).toLocaleString()} <span className="text-xs text-muted-foreground font-medium">L</span></div>
 </div>
 <div>
 <div className="text-muted-foreground text-[10px] font-bold uppercase tracking-wider">{t('Stock', 'اسٹاک', language)}</div>
 <div className="font-black text-blue-600">{Number(tank.currentStock).toLocaleString()} <span className="text-xs text-blue-400 font-medium">L</span></div>
 </div>
 </div>
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
