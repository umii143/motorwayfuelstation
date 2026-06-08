import React, { useState } from 'react';
import {
  Trash2, Edit, CheckCircle, Database, Plus,
  Droplets, AlertTriangle, TrendingUp, Gauge, Save, X
} from 'lucide-react';
import { useStation } from '../../../contexts/StationContext';
import { Tank, Product } from '../../../types';
import { t as translate } from '../../../lib/translations';

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

const FUEL_CONFIG: Record<string, any> = {
  petrol: { label: 'Petrol (PMG)', urdu: 'پیٹرول', color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-400', icon: '⛽', badgeBg: 'bg-emerald-100', badgeText: 'text-emerald-800', fillColor: 'from-emerald-500 to-teal-400', headerBg: 'bg-emerald-600' },
  diesel: { label: 'Diesel (HSD)', urdu: 'ڈیزل', color: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-400', icon: '🛢️', badgeBg: 'bg-blue-100', badgeText: 'text-blue-800', fillColor: 'from-blue-500 to-cyan-400', headerBg: 'bg-blue-600' },
  hobc: { label: 'HOBC (High Octane)', urdu: 'ہائی اوکٹین', color: 'text-orange-700', bg: 'bg-orange-50', border: 'border-orange-400', icon: '🔥', badgeBg: 'bg-orange-100', badgeText: 'text-orange-800', fillColor: 'from-orange-500 to-amber-400', headerBg: 'bg-orange-600' },
  cng: { label: 'CNG (Gas)', urdu: 'سی این جی', color: 'text-purple-700', bg: 'bg-purple-50', border: 'border-purple-400', icon: '💨', badgeBg: 'bg-purple-100', badgeText: 'text-purple-800', fillColor: 'from-purple-500 to-violet-400', headerBg: 'bg-purple-600' },
  other: { label: 'Other Fuel', urdu: 'دیگر', color: 'text-slate-700', bg: 'bg-slate-50', border: 'border-slate-400', icon: '🏭', badgeBg: 'bg-slate-100', badgeText: 'text-slate-800', fillColor: 'from-slate-500 to-slate-400', headerBg: 'bg-slate-600' }
};

function getFuelType(product: Product): string {
  const n = product.name.toLowerCase();
  if (n.includes('hobc') || n.includes('high octane')) return 'hobc';
  if (n.includes('petrol') || n.includes('pmg')) return 'petrol';
  if (n.includes('diesel') || n.includes('hsd')) return 'diesel';
  if (n.includes('cng')) return 'cng';
  return 'other';
}

function getFuelConfig(product?: Product) {
  if (!product) return FUEL_CONFIG.other;
  return FUEL_CONFIG[getFuelType(product)] || FUEL_CONFIG.other;
}

export default function TankWizard({ tanks, products, language, onAddTank, onUpdateTank, onDeleteTank, onLogAudit, onUpdateProducts }: TankWizardProps) {
  const { showConfirm, showToast } = useStation();
  const t = (en: string, ur: string) => translate(en, ur, language);

  const [editingTank, setEditingTank] = useState<Tank | null>(null);
  const [showForm, setShowForm] = useState<boolean>(false);
  const [showProductModal, setShowProductModal] = useState<boolean>(false);
  
  // Modal for new product
  const [newProductName, setNewProductName] = useState('');
  const [newProductRate, setNewProductRate] = useState<number | ''>('');

  const [tankForm, setTankForm] = useState({
    name: '',
    productId: products[0]?.id || '',
    capacity: 20000,
    safeLevel: 3000,
    criticalLevel: 1000,
    openingStock: 10000,
    physicalLabel: '',
    dipChartCm: '',
    dipChartLiters: ''
  });
  const [tempDipChart, setTempDipChart] = useState<{ cm: number; liters: number }[]>([]);

  const handleOpenAdd = (productId?: string) => {
    setEditingTank(null);
    const pid = productId || products[0]?.id || '';
    setTankForm({
      name: '',
      productId: pid,
      capacity: 20000,
      safeLevel: 3000,
      criticalLevel: 1000,
      openingStock: 10000,
      physicalLabel: 'T-' + (tanks.length + 1),
      dipChartCm: '',
      dipChartLiters: ''
    });
    setTempDipChart([]);
    setShowForm(true);
  };

  const handleOpenEdit = (tk: Tank) => {
    setEditingTank(tk);
    setTankForm({
      name: tk.name,
      productId: tk.productId,
      capacity: tk.capacity,
      safeLevel: tk.safeLevel,
      criticalLevel: tk.criticalLevel,
      openingStock: tk.openingStock || tk.currentStock,
      physicalLabel: tk.physicalLabel || '',
      dipChartCm: '',
      dipChartLiters: ''
    });
    setTempDipChart(tk.dipChart || []);
    setShowForm(true);
  };

  const handleSaveTank = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tankForm.name || !tankForm.productId || tankForm.capacity <= 0) {
      showToast(t('Please fill all required fields.', 'براہ کرم تمام ضروری خانے پُر کریں۔'), 'error');
      return;
    }
    
    if (editingTank) {
      onUpdateTank({ ...editingTank, ...tankForm, currentStock: tankForm.openingStock, dipChart: tempDipChart });
      onLogAudit('Tank', 'Update', `Tank "${tankForm.name}" updated.`);
    } else {
      onAddTank({ ...tankForm, id: 'tank_' + Date.now(), currentStock: tankForm.openingStock, dipChart: tempDipChart });
      onLogAudit('Tank', 'Create', `Tank "${tankForm.name}" created.`);
    }
    setShowForm(false);
    showToast(t('Tank saved successfully!', 'ٹینک کامیابی سے محفوظ ہو گیا!'), 'success');
  };

  const handleCreateProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProductName || !newProductRate || newProductRate <= 0) return;
    const newProd: Product = {
      id: 'prod_' + Date.now(),
      name: newProductName,
      urduName: newProductName,
      rate: Number(newProductRate),
      type: 'fuel',
      unit: 'Liters',
      currentStock: 0,
      minStock: 100
    };
    if (onUpdateProducts) {
      onUpdateProducts([...products, newProd]);
      setTankForm(prev => ({ ...prev, productId: newProd.id }));
      setShowProductModal(false);
      setNewProductName('');
      setNewProductRate('');
      showToast(t('Fuel product created successfully!', 'فیول پراڈکٹ کامیابی سے شامل ہو گئی۔'), 'success');
    }
  };

  // Group tanks by fuel type for the list view
  const fuelGroups = products.map(p => ({
    product: p,
    cfg: getFuelConfig(p),
    tankList: tanks.filter(t => t.productId === p.id)
  })).filter(g => g.tankList.length > 0);
  const unGroupedTanks = tanks.filter(t => !products.find(p => p.id === t.productId));

  return (
    <div className="space-y-6 pb-20">
      {!showForm && (
        <div className="flex justify-between items-center bg-slate-50 p-4 rounded-xl border border-slate-200">
          <span className="text-slate-500 font-sans text-sm">{t('Manage your underground fuel storage tanks.', 'زمین دوز پٹرولیم ٹینکس کا انتظام کریں۔')}</span>
          <button onClick={() => handleOpenAdd()} className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2">
            <Plus className="w-4 h-4" /> {t('Add Tank', 'ٹینک شامل کریں')}
          </button>
        </div>
      )}

      {showForm ? (
        <form onSubmit={handleSaveTank} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col relative">
          <div className="bg-slate-800 px-5 py-4">
            <h4 className="text-white font-black text-lg flex items-center gap-2">
              <Database className="w-5 h-5 text-orange-500" />
              {editingTank ? t('Edit Tank', 'ٹینک میں ترمیم کریں') : t('Add New Tank', 'نیا ٹینک بنائیں')}
            </h4>
          </div>

          <div className="p-5 space-y-6">
            {/* FUEL PRODUCT SELECTOR */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t('Fuel Product *', 'فیول پراڈکٹ *')}</label>
              {products.length === 0 ? (
                <div className="bg-red-50 border border-red-200 p-4 rounded-xl flex items-center justify-between">
                  <span className="text-red-600 text-sm font-bold">{t('No products found.', 'کوئی پراڈکٹ نہیں ملی۔')}</span>
                  <button type="button" onClick={() => setShowProductModal(true)} className="bg-red-600 hover:bg-red-700 transition-colors text-white px-4 py-2 rounded-lg text-sm font-bold shadow-sm cursor-pointer whitespace-nowrap">
                    + {t('Create Fuel Product', 'پراڈکٹ بنائیں')}
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <select
                    value={tankForm.productId}
                    onChange={(e) => setTankForm(p => ({ ...p, productId: e.target.value }))}
                    className="flex-1 border border-slate-300 rounded-xl p-3 text-sm font-bold bg-slate-50 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none"
                    required
                  >
                    <option value="" disabled>{t('Select Product...', 'پراڈکٹ منتخب کریں...')}</option>
                    {products.map(p => <option key={p.id} value={p.id}>{p.name} (Rs {p.rate})</option>)}
                  </select>
                  {onUpdateProducts && (
                    <button type="button" onClick={() => setShowProductModal(true)} className="bg-slate-100 text-slate-600 hover:bg-slate-200 px-4 py-3 rounded-xl font-bold flex items-center gap-1 shrink-0 cursor-pointer">
                      <Plus className="w-4 h-4" /> {t('Add New', 'نیا')}
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* TANK BASIC INFO */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t('Tank Name *', 'ٹینک کا نام *')}</label>
                <input type="text" required value={tankForm.name} onChange={e => setTankForm(p => ({...p, name: e.target.value}))} className="w-full border border-slate-300 rounded-xl p-3 text-sm font-bold outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500" placeholder={t('e.g. Main Petrol Tank A', 'مثلاً پیٹرول ٹینک')} />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t('Tank Label / Code *', 'ٹینک لیبل / کوڈ *')}</label>
                <input type="text" required value={tankForm.physicalLabel} onChange={e => setTankForm(p => ({...p, physicalLabel: e.target.value}))} className="w-full border border-slate-300 rounded-xl p-3 text-sm font-mono outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500" placeholder="e.g. T-1" />
              </div>
            </div>

            {/* CAPACITY & LEVELS */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-slate-100 pt-5">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t('Total Capacity (Liters) *', 'کل گنجائش (Liters) *')}</label>
                <input type="number" min="1" required value={tankForm.capacity} onChange={e => setTankForm(p => ({...p, capacity: Number(e.target.value)}))} className="w-full border border-slate-300 rounded-xl p-3 text-sm font-mono outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t('Opening Stock (Liters) *', 'ابتدائی اسٹاک (Liters) *')}</label>
                <input type="number" min="0" required value={tankForm.openingStock} onChange={e => setTankForm(p => ({...p, openingStock: Number(e.target.value)}))} className="w-full border border-slate-300 rounded-xl p-3 text-sm font-mono outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t('Safe Level (Liters) *', 'محفوظ سطح (Liters) *')}</label>
                <input type="number" min="1" required value={tankForm.safeLevel} onChange={e => setTankForm(p => ({...p, safeLevel: Number(e.target.value)}))} className="w-full border border-amber-300 rounded-xl p-3 text-sm font-mono outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t('Critical Level (Liters) *', 'تنقیدی سطح (Liters) *')}</label>
                <input type="number" min="1" required value={tankForm.criticalLevel} onChange={e => setTankForm(p => ({...p, criticalLevel: Number(e.target.value)}))} className="w-full border border-red-300 rounded-xl p-3 text-sm font-mono outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500" />
              </div>
            </div>

            {/* STICKY FOOTER ACTIONS FOR MOBILE */}
            <div className="sticky bottom-0 bg-white border-t border-slate-200 p-4 -mx-5 -mb-5 flex justify-end gap-3 z-10 shadow-[0_-10px_20px_-10px_rgba(0,0,0,0.1)]">
              <button type="button" onClick={() => setShowForm(false)} className="px-6 py-3 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 cursor-pointer">
                {t('Cancel', 'کینسل')}
              </button>
              <button type="submit" disabled={!tankForm.productId} className={`px-8 py-3 rounded-xl font-black text-white shadow-md flex items-center gap-2 cursor-pointer transition-colors ${!tankForm.productId ? 'bg-emerald-400 opacity-70' : 'bg-emerald-600 hover:bg-emerald-700'}`}>
                <Save className="w-5 h-5" /> {t('Save Tank', 'ٹینک محفوظ کریں')}
              </button>
            </div>
          </div>
        </form>
      ) : (
        <div className="space-y-6">
          {fuelGroups.map(({ product, cfg, tankList }) => (
            <div key={product.id} className={`rounded-2xl border ${cfg.border} overflow-hidden`}>
              <div className={`${cfg.bg} border-b ${cfg.border} px-5 py-3 flex items-center justify-between`}>
                <div className="flex items-center gap-2">
                  <span className="text-lg">{cfg.icon}</span>
                  <strong className={`font-sans text-sm font-black ${cfg.color}`}>{t(cfg.label, cfg.urdu)}</strong>
                </div>
              </div>
              <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                {tankList.map(tnk => (
                  <div key={tnk.id} className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm flex flex-col justify-between hover:border-orange-300 transition-colors">
                    <div>
                      <div className="flex justify-between items-start mb-2">
                        <strong className="text-slate-800 font-bold">{tnk.name} <span className="text-slate-400 font-mono text-xs ml-2">({tnk.physicalLabel})</span></strong>
                        <div className="flex gap-2">
                          <button onClick={() => handleOpenEdit(tnk)} className="text-slate-400 hover:text-orange-500 cursor-pointer"><Edit className="w-4 h-4"/></button>
                          <button onClick={() => {
                            showConfirm("Delete Tank", "Are you sure?", () => onDeleteTank(tnk.id));
                          }} className="text-slate-400 hover:text-red-500 cursor-pointer"><Trash2 className="w-4 h-4"/></button>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs font-mono mt-3">
                        <div className="bg-slate-50 p-2 rounded-lg border border-slate-100"><span className="text-slate-400 block text-[10px] uppercase">Stock</span>{tnk.currentStock} L</div>
                        <div className="bg-slate-50 p-2 rounded-lg border border-slate-100"><span className="text-slate-400 block text-[10px] uppercase">Cap</span>{tnk.capacity} L</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
          {products.length > 0 && tanks.length === 0 && (
            <div className="text-center py-12 bg-slate-50 border border-slate-200 rounded-2xl">
              <Database className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 font-bold">{t('No tanks configured yet.', 'ابھی تک کوئی ٹینک نہیں بنایا گیا۔')}</p>
            </div>
          )}
          {products.length === 0 && tanks.length === 0 && (
             <div className="text-center py-12 bg-slate-50 border border-slate-200 rounded-2xl">
             <Droplets className="w-12 h-12 text-slate-300 mx-auto mb-3" />
             <p className="text-slate-500 font-bold mb-4">{t('Get started by adding a tank!', 'پہلا ٹینک بنانے کے لیے کلک کریں۔')}</p>
             <button onClick={() => handleOpenAdd()} className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-2 rounded-xl text-sm font-bold flex items-center gap-2 mx-auto cursor-pointer">
               <Plus className="w-4 h-4" /> {t('Add First Tank', 'پہلا ٹینک شامل کریں')}
             </button>
           </div>
          )}
        </div>
      )}

      {/* PRODUCT CREATION MODAL */}
      {showProductModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form onSubmit={handleCreateProduct} className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl scale-100 transition-all">
            <div className="bg-slate-800 px-5 py-4 flex justify-between items-center">
              <h3 className="text-white font-bold flex items-center gap-2"><Droplets className="w-4 h-4 text-orange-500"/> {t('Create Fuel Product', 'فیول پراڈکٹ بنائیں')}</h3>
              <button type="button" onClick={() => setShowProductModal(false)} className="text-white/70 hover:text-white cursor-pointer"><X className="w-5 h-5"/></button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">{t('Product Name *', 'پراڈکٹ کا نام *')}</label>
                <input type="text" required value={newProductName} onChange={e => setNewProductName(e.target.value)} placeholder={t('e.g. Petrol, Diesel', 'مثلاً پیٹرول')} className="w-full border border-slate-300 rounded-xl p-3 outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 font-bold" />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">{t('Current Selling Rate (Rs) *', 'موجودہ ریٹ (Rs) *')}</label>
                <input type="number" step="0.01" min="1" required value={newProductRate} onChange={e => setNewProductRate(Number(e.target.value))} placeholder="0.00" className="w-full border border-slate-300 rounded-xl p-3 font-mono font-bold outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500" />
              </div>
            </div>
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-2">
              <button type="button" onClick={() => setShowProductModal(false)} className="px-5 py-2.5 text-slate-600 font-bold rounded-xl hover:bg-slate-200 cursor-pointer">{t('Cancel', 'کینسل')}</button>
              <button type="submit" className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-sm cursor-pointer">{t('Save Product', 'محفوظ کریں')}</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
