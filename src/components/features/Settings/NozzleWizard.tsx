import React, { useState } from 'react';
import {
  Trash2, Edit, Fuel, Plus, Droplets, Database, Info, AlertTriangle, Save, X
} from 'lucide-react';
import { useStation } from '../../../contexts/StationContext';
import { Nozzle, Tank, Pump, Product } from '../../../types';
import { t as translate } from '../../../lib/translations';

interface NozzleWizardProps {
  nozzles: Nozzle[];
  pumps: Pump[];
  tanks: Tank[];
  products: Product[];
  language: string;
  onAddNozzle: (newNozzle: Nozzle) => void;
  onUpdateNozzle: (updatedNozzle: Nozzle) => void;
  onDeleteNozzle: (id: string) => void;
  onLogAudit: (category: string, action: string, details: string) => void;
  onUpdateProducts?: (products: Product[]) => void;
  onAddTank?: (tank: Tank) => void;
  onUpdatePumps?: (pumps: Pump[]) => void;
}

const FUEL_CONFIG: Record<string, any> = {
  petrol: { label: 'Petrol (PMG)', urdu: 'پیٹرول', color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-400', icon: '⛽', badgeBg: 'bg-emerald-100', badgeText: 'text-emerald-800', fillColor: 'from-emerald-500 to-teal-400', headerBg: 'bg-emerald-600', ring: 'ring-emerald-500' },
  diesel: { label: 'Diesel (HSD)', urdu: 'ڈیزل', color: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-400', icon: '🛢️', badgeBg: 'bg-blue-100', badgeText: 'text-blue-800', fillColor: 'from-blue-500 to-cyan-400', headerBg: 'bg-blue-600', ring: 'ring-blue-500' },
  hobc: { label: 'HOBC (High Octane)', urdu: 'ہائی اوکٹین', color: 'text-orange-700', bg: 'bg-orange-50', border: 'border-orange-400', icon: '🔥', badgeBg: 'bg-orange-100', badgeText: 'text-orange-800', fillColor: 'from-orange-500 to-amber-400', headerBg: 'bg-orange-600', ring: 'ring-orange-500' },
  cng: { label: 'CNG (Gas)', urdu: 'سی این جی', color: 'text-purple-700', bg: 'bg-purple-50', border: 'border-purple-400', icon: '💨', badgeBg: 'bg-purple-100', badgeText: 'text-purple-800', fillColor: 'from-purple-500 to-violet-400', headerBg: 'bg-purple-600', ring: 'ring-purple-500' },
  other: { label: 'Other', urdu: 'دیگر', color: 'text-slate-700', bg: 'bg-slate-50', border: 'border-slate-400', icon: '🏭', badgeBg: 'bg-slate-100', badgeText: 'text-slate-800', fillColor: 'from-slate-500 to-slate-400', headerBg: 'bg-slate-600', ring: 'ring-slate-500' }
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

export default function NozzleWizard({
  nozzles, pumps, tanks, products, language,
  onAddNozzle, onUpdateNozzle, onDeleteNozzle, onLogAudit,
  onUpdateProducts, onAddTank, onUpdatePumps
}: NozzleWizardProps) {
  const { showConfirm, showToast } = useStation();
  const t = (en: string, ur: string) => translate(en, ur, language);

  const [editingNozzle, setEditingNozzle] = useState<Nozzle | null>(null);
  const [showForm, setShowForm] = useState<boolean>(false);
  
  // Modals for inline creation
  const [showProductModal, setShowProductModal] = useState<boolean>(false);
  const [showTankModal, setShowTankModal] = useState<boolean>(false);
  const [showPumpModal, setShowPumpModal] = useState<boolean>(false);

  // Modal states
  const [newProductName, setNewProductName] = useState('');
  const [newProductRate, setNewProductRate] = useState<number | ''>('');
  
  const [newTankName, setNewTankName] = useState('');
  const [newTankCapacity, setNewTankCapacity] = useState<number | ''>('');
  
  const [newPumpName, setNewPumpName] = useState('');

  const [nozzleForm, setNozzleForm] = useState({
    name: '',
    pumpId: pumps[0]?.id || '',
    productId: '',
    tankId: '',
    startReading: 150000,
    currentReading: 150000
  });

  const matchingTanks = tanks.filter(tk => tk.productId === nozzleForm.productId);

  const handleOpenAdd = () => {
    setEditingNozzle(null);
    setNozzleForm({
      name: 'Nozzle ' + (nozzles.length + 1),
      pumpId: pumps[0]?.id || '',
      productId: products[0]?.id || '',
      tankId: tanks.find(t => t.productId === products[0]?.id)?.id || '',
      startReading: 150000,
      currentReading: 150000
    });
    setShowForm(true);
  };

  const handleOpenEdit = (nz: Nozzle) => {
    setEditingNozzle(nz);
    setNozzleForm({
      name: nz.name,
      pumpId: nz.pumpId,
      productId: nz.productId,
      tankId: nz.tankId || (tanks.find(t => t.productId === nz.productId)?.id || ''),
      startReading: nz.startReading || 0,
      currentReading: nz.currentReading || 0
    });
    setShowForm(true);
  };

  const handleSaveNozzle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nozzleForm.productId || !nozzleForm.tankId || !nozzleForm.pumpId || !nozzleForm.name) {
      showToast(t('Please complete all required selections.', 'تمام ضروری فیلڈز مکمل کریں۔'), 'error');
      return;
    }
    
    if (editingNozzle) {
      onUpdateNozzle({
        ...editingNozzle,
        ...nozzleForm
      });
      onLogAudit('Nozzle', 'Update', `Nozzle "${nozzleForm.name}" updated.`);
      showToast(t('Nozzle updated successfully!', 'نوزل کامیابی سے اپ ڈیٹ ہو گئی!'), 'success');
    } else {
      const newNz: Nozzle = {
        ...nozzleForm,
        id: 'nz_' + Date.now() + Math.floor(Math.random()*100)
      };
      onAddNozzle(newNz);
      onLogAudit('Nozzle', 'Create', `Nozzle "${nozzleForm.name}" created.`);
      showToast(t('Nozzle created successfully!', 'نوزل کامیابی سے بن گئی!'), 'success');
    }
    setShowForm(false);
  };

  const handleCreateProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProductName || !newProductRate) return;
    const prod: Product = { id: 'prod_' + Date.now(), name: newProductName, urduName: newProductName, rate: Number(newProductRate), type: 'fuel', unit: 'Liters', currentStock: 0, minStock: 100 };
    if (onUpdateProducts) {
      onUpdateProducts([...products, prod]);
      setNozzleForm(p => ({ ...p, productId: prod.id, tankId: '' }));
      setShowProductModal(false);
      setNewProductName(''); setNewProductRate('');
    }
  };

  const handleCreateTank = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTankName || !newTankCapacity || !nozzleForm.productId) return;
    const tnk: Tank = {
      id: 'tank_' + Date.now(),
      name: newTankName,
      productId: nozzleForm.productId,
      capacity: Number(newTankCapacity),
      currentStock: 0,
      openingStock: 0,
      safeLevel: 1000,
      criticalLevel: 500,
      physicalLabel: 'T-' + (tanks.length + 1),
      dipChart: []
    };
    if (onAddTank) {
      onAddTank(tnk);
      setNozzleForm(p => ({ ...p, tankId: tnk.id }));
      setShowTankModal(false);
      setNewTankName(''); setNewTankCapacity('');
    }
  };

  const handleCreatePump = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPumpName) return;
    const pmp: Pump = { id: 'pump_' + Date.now(), name: newPumpName, nozzleCount: 1 };
    if (onUpdatePumps) {
      onUpdatePumps([...pumps, pmp]);
      setNozzleForm(p => ({ ...p, pumpId: pmp.id }));
      setShowPumpModal(false);
      setNewPumpName('');
    }
  };

  // Grouping for view mode
  const productGroups = products.map(p => ({
    product: p,
    cfg: getFuelConfig(p),
    nozzleList: nozzles.filter(n => n.productId === p.id)
  })).filter(g => g.nozzleList.length > 0);

  const unGroupedNozzles = nozzles.filter(n => !products.find(p => p.id === n.productId));

  return (
    <div className="space-y-6 pb-20">
      {!showForm && (
        <div className="flex justify-between items-center bg-slate-50 p-4 rounded-xl border border-slate-200">
          <span className="text-slate-500 font-sans text-sm">{t('Manage your dispenser nozzles and map them to tanks.', 'اپنے نوزل میٹرز کو ٹینکس کے ساتھ جوڑیں۔')}</span>
          <button onClick={() => handleOpenAdd()} className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 cursor-pointer shadow-sm">
            <Plus className="w-4 h-4" /> {t('Add Nozzle', 'نوزل شامل کریں')}
          </button>
        </div>
      )}

      {showForm ? (
        <form onSubmit={handleSaveNozzle} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col relative">
          <div className="bg-slate-800 px-5 py-4">
            <h4 className="text-white font-black text-lg flex items-center gap-2">
              <Fuel className="w-5 h-5 text-orange-500" />
              {editingNozzle ? t('Edit Nozzle', 'نوزل میں ترمیم کریں') : t('Add New Nozzle', 'نئی نوزل شامل کریں')}
            </h4>
          </div>

          <div className="p-5 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t('Nozzle / Dispenser Name *', 'نوزل کا نام *')}</label>
                <input type="text" required value={nozzleForm.name} onChange={e => setNozzleForm(p => ({...p, name: e.target.value}))} className="w-full border border-slate-300 rounded-xl p-3 text-sm font-bold outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500" placeholder="e.g. Nozzle 1 (Petrol)" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t('Assign to Machine / Pump *', 'مشین منتخب کریں *')}</label>
                {pumps.length === 0 ? (
                  <div className="bg-red-50 border border-red-200 p-2.5 rounded-xl flex items-center justify-between">
                     <span className="text-red-600 text-xs font-bold">{t('No Pumps found.', 'کوئی پمپ نہیں ملا')}</span>
                     <button type="button" onClick={() => setShowPumpModal(true)} className="bg-red-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg cursor-pointer">+{t('Create', 'بنائیں')}</button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <select required value={nozzleForm.pumpId} onChange={e => setNozzleForm(p => ({...p, pumpId: e.target.value}))} className="flex-1 border border-slate-300 rounded-xl p-3 text-sm font-bold bg-slate-50 focus:border-orange-500 outline-none">
                      <option value="" disabled>{t('Select Pump...', 'پمپ منتخب کریں...')}</option>
                      {pumps.map(pm => <option key={pm.id} value={pm.id}>{pm.name}</option>)}
                    </select>
                    {onUpdatePumps && (
                      <button type="button" onClick={() => setShowPumpModal(true)} className="bg-slate-100 text-slate-600 hover:bg-slate-200 px-3 py-3 rounded-xl font-bold flex items-center shrink-0 cursor-pointer text-xs"><Plus className="w-3.5 h-3.5"/></button>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-slate-100 pt-5">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t('Fuel Product *', 'فیول پراڈکٹ *')}</label>
                {products.length === 0 ? (
                   <div className="bg-red-50 border border-red-200 p-2.5 rounded-xl flex items-center justify-between">
                     <span className="text-red-600 text-xs font-bold">{t('No Products found.', 'کوئی پراڈکٹ نہیں')}</span>
                     <button type="button" onClick={() => setShowProductModal(true)} className="bg-red-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg cursor-pointer">+{t('Create', 'بنائیں')}</button>
                   </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <select required value={nozzleForm.productId} onChange={e => setNozzleForm(p => ({...p, productId: e.target.value, tankId: ''}))} className="flex-1 border border-slate-300 rounded-xl p-3 text-sm font-bold bg-slate-50 focus:border-orange-500 outline-none">
                      <option value="" disabled>{t('Select Product...', 'پراڈکٹ منتخب کریں...')}</option>
                      {products.map(pr => <option key={pr.id} value={pr.id}>{pr.name}</option>)}
                    </select>
                    {onUpdateProducts && (
                      <button type="button" onClick={() => setShowProductModal(true)} className="bg-slate-100 text-slate-600 hover:bg-slate-200 px-3 py-3 rounded-xl font-bold flex items-center shrink-0 cursor-pointer text-xs"><Plus className="w-3.5 h-3.5"/></button>
                    )}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t('Link to Storage Tank *', 'سٹوریج ٹینک *')}</label>
                {nozzleForm.productId ? (
                  matchingTanks.length === 0 ? (
                    <div className="bg-amber-50 border border-amber-200 p-2.5 rounded-xl flex items-center justify-between">
                      <span className="text-amber-700 text-xs font-bold">{t('No Tanks for this product.', 'کوئی ٹینک نہیں')}</span>
                      {onAddTank && <button type="button" onClick={() => setShowTankModal(true)} className="bg-amber-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg cursor-pointer">+{t('Create', 'بنائیں')}</button>}
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <select required value={nozzleForm.tankId} onChange={e => setNozzleForm(p => ({...p, tankId: e.target.value}))} className="flex-1 border border-slate-300 rounded-xl p-3 text-sm font-bold bg-slate-50 focus:border-orange-500 outline-none">
                        <option value="" disabled>{t('Select Storage Tank...', 'ٹینک منتخب کریں...')}</option>
                        {matchingTanks.map(tk => <option key={tk.id} value={tk.id}>{tk.name}</option>)}
                      </select>
                      {onAddTank && (
                        <button type="button" onClick={() => setShowTankModal(true)} className="bg-slate-100 text-slate-600 hover:bg-slate-200 px-3 py-3 rounded-xl font-bold flex items-center shrink-0 cursor-pointer text-xs"><Plus className="w-3.5 h-3.5"/></button>
                      )}
                    </div>
                  )
                ) : (
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-400 text-sm font-bold">
                    {t('Select Product First', 'پہلے پراڈکٹ منتخب کریں')}
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-slate-100 pt-5">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t('Start Reading (Meter) *', 'میٹر ریڈنگ (آغاز) *')}</label>
                <input type="number" min="0" required value={nozzleForm.startReading} onChange={e => setNozzleForm(p => ({...p, startReading: Number(e.target.value)}))} className="w-full border border-slate-300 rounded-xl p-3 text-sm font-mono outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t('Current Reading (Meter) *', 'موجودہ ریڈنگ *')}</label>
                <input type="number" min="0" required value={nozzleForm.currentReading} onChange={e => setNozzleForm(p => ({...p, currentReading: Number(e.target.value)}))} className="w-full border border-slate-300 rounded-xl p-3 text-sm font-mono outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500" />
              </div>
            </div>

            {/* STICKY FOOTER ACTIONS FOR MOBILE */}
            <div className="sticky bottom-0 bg-white border-t border-slate-200 p-4 -mx-5 -mb-5 flex justify-end gap-3 z-10 shadow-[0_-10px_20px_-10px_rgba(0,0,0,0.1)]">
              <button type="button" onClick={() => setShowForm(false)} className="px-6 py-3 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 cursor-pointer">
                {t('Cancel', 'کینسل')}
              </button>
              <button type="submit" disabled={!nozzleForm.productId || !nozzleForm.tankId} className={`px-8 py-3 rounded-xl font-black text-white shadow-md flex items-center gap-2 cursor-pointer transition-colors ${(!nozzleForm.productId || !nozzleForm.tankId) ? 'bg-emerald-400 opacity-70' : 'bg-emerald-600 hover:bg-emerald-700'}`}>
                <Save className="w-5 h-5" /> {t('Save Nozzle', 'نوزل محفوظ کریں')}
              </button>
            </div>
          </div>
        </form>
      ) : (
        <div className="space-y-6">
          {productGroups.map(({ product, cfg, nozzleList }) => (
            <div key={product.id} className={`rounded-2xl border ${cfg.border} overflow-hidden`}>
              <div className={`${cfg.bg} border-b ${cfg.border} px-5 py-3 flex items-center justify-between`}>
                <div className="flex items-center gap-2">
                  <span className="text-lg">{cfg.icon}</span>
                  <strong className={`font-sans text-sm font-black ${cfg.color}`}>{t(cfg.label, cfg.urdu)}</strong>
                </div>
              </div>
              <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {nozzleList.map(nz => (
                  <div key={nz.id} className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm flex flex-col justify-between hover:border-orange-300 transition-colors">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-2">
                        <Fuel className="w-4 h-4 text-slate-400" />
                        <strong className="text-slate-800 font-bold">{nz.name}</strong>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => handleOpenEdit(nz)} className="text-slate-400 hover:text-orange-500 cursor-pointer"><Edit className="w-4 h-4"/></button>
                        <button onClick={() => showConfirm("Delete Nozzle", "Are you sure?", () => onDeleteNozzle(nz.id))} className="text-slate-400 hover:text-red-500 cursor-pointer"><Trash2 className="w-4 h-4"/></button>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs font-mono mt-3">
                      <div className="bg-slate-50 p-2 rounded-lg border border-slate-100"><span className="text-slate-400 block text-[10px] uppercase font-sans font-bold">Tank</span>{tanks.find(t=>t.id===nz.tankId)?.name || 'N/A'}</div>
                      <div className="bg-slate-50 p-2 rounded-lg border border-slate-100"><span className="text-slate-400 block text-[10px] uppercase font-sans font-bold">Reading</span>{nz.currentReading}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {unGroupedNozzles.length > 0 && (
            <div className="rounded-2xl border border-slate-300 overflow-hidden">
               <div className="bg-slate-100 border-b border-slate-300 px-5 py-3">
                 <strong className="font-sans text-sm font-black text-slate-700">Uncategorized / Invalid Nozzles</strong>
               </div>
               <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                 {unGroupedNozzles.map(nz => (
                    <div key={nz.id} className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm flex flex-col justify-between hover:border-orange-300 transition-colors">
                      <div className="flex justify-between items-start mb-2">
                        <strong className="text-slate-800 font-bold">{nz.name}</strong>
                        <div className="flex gap-2">
                          <button onClick={() => handleOpenEdit(nz)} className="text-slate-400 hover:text-orange-500 cursor-pointer"><Edit className="w-4 h-4"/></button>
                          <button onClick={() => showConfirm("Delete Nozzle", "Are you sure?", () => onDeleteNozzle(nz.id))} className="text-slate-400 hover:text-red-500 cursor-pointer"><Trash2 className="w-4 h-4"/></button>
                        </div>
                      </div>
                    </div>
                 ))}
               </div>
            </div>
          )}

          {nozzles.length === 0 && (
             <div className="text-center py-12 bg-slate-50 border border-slate-200 rounded-2xl">
             <Fuel className="w-12 h-12 text-slate-300 mx-auto mb-3" />
             <p className="text-slate-500 font-bold mb-4">{t('Get started by adding a nozzle!', 'پہلی نوزل بنانے کے لیے کلک کریں۔')}</p>
             <button onClick={() => handleOpenAdd()} className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-2 rounded-xl text-sm font-bold flex items-center gap-2 mx-auto cursor-pointer shadow-sm">
               <Plus className="w-4 h-4" /> {t('Add First Nozzle', 'پہلی نوزل شامل کریں')}
             </button>
           </div>
          )}
        </div>
      )}

      {/* PRODUCT CREATION MODAL */}
      {showProductModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form onSubmit={handleCreateProduct} className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl">
            <div className="bg-slate-800 px-5 py-4 flex justify-between items-center">
              <h3 className="text-white font-bold flex items-center gap-2"><Droplets className="w-4 h-4 text-orange-500"/> {t('Create Fuel Product', 'فیول پراڈکٹ بنائیں')}</h3>
              <button type="button" onClick={() => setShowProductModal(false)} className="text-white/70 hover:text-white cursor-pointer"><X className="w-5 h-5"/></button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">{t('Product Name *', 'پراڈکٹ کا نام *')}</label>
                <input type="text" required value={newProductName} onChange={e => setNewProductName(e.target.value)} className="w-full border border-slate-300 rounded-xl p-3 outline-none focus:border-orange-500 font-bold" />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">{t('Current Selling Rate (Rs) *', 'موجودہ ریٹ (Rs) *')}</label>
                <input type="number" step="0.01" min="1" required value={newProductRate} onChange={e => setNewProductRate(Number(e.target.value))} className="w-full border border-slate-300 rounded-xl p-3 font-mono font-bold outline-none focus:border-orange-500" />
              </div>
            </div>
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-2">
              <button type="button" onClick={() => setShowProductModal(false)} className="px-5 py-2.5 text-slate-600 font-bold rounded-xl hover:bg-slate-200 cursor-pointer">{t('Cancel', 'کینسل')}</button>
              <button type="submit" className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-sm cursor-pointer">{t('Save Product', 'محفوظ کریں')}</button>
            </div>
          </form>
        </div>
      )}

      {/* TANK CREATION MODAL */}
      {showTankModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form onSubmit={handleCreateTank} className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl">
            <div className="bg-slate-800 px-5 py-4 flex justify-between items-center">
              <h3 className="text-white font-bold flex items-center gap-2"><Database className="w-4 h-4 text-orange-500"/> {t('Create Tank for', 'کے لیے ٹینک')} {products.find(p=>p.id===nozzleForm.productId)?.name}</h3>
              <button type="button" onClick={() => setShowTankModal(false)} className="text-white/70 hover:text-white cursor-pointer"><X className="w-5 h-5"/></button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">{t('Tank Name *', 'ٹینک کا نام *')}</label>
                <input type="text" required value={newTankName} onChange={e => setNewTankName(e.target.value)} className="w-full border border-slate-300 rounded-xl p-3 outline-none focus:border-orange-500 font-bold" />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">{t('Capacity (Liters) *', 'گنجائش *')}</label>
                <input type="number" min="1" required value={newTankCapacity} onChange={e => setNewTankCapacity(Number(e.target.value))} className="w-full border border-slate-300 rounded-xl p-3 font-mono font-bold outline-none focus:border-orange-500" />
              </div>
            </div>
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-2">
              <button type="button" onClick={() => setShowTankModal(false)} className="px-5 py-2.5 text-slate-600 font-bold rounded-xl hover:bg-slate-200 cursor-pointer">{t('Cancel', 'کینسل')}</button>
              <button type="submit" className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-sm cursor-pointer">{t('Save Tank', 'محفوظ کریں')}</button>
            </div>
          </form>
        </div>
      )}

      {/* PUMP CREATION MODAL */}
      {showPumpModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form onSubmit={handleCreatePump} className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl">
            <div className="bg-slate-800 px-5 py-4 flex justify-between items-center">
              <h3 className="text-white font-bold flex items-center gap-2"><Plus className="w-4 h-4 text-orange-500"/> {t('Add Machine / Pump', 'پمپ شامل کریں')}</h3>
              <button type="button" onClick={() => setShowPumpModal(false)} className="text-white/70 hover:text-white cursor-pointer"><X className="w-5 h-5"/></button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">{t('Pump Name *', 'پمپ کا نام *')}</label>
                <input type="text" required value={newPumpName} onChange={e => setNewPumpName(e.target.value)} placeholder="e.g. Pump 1" className="w-full border border-slate-300 rounded-xl p-3 outline-none focus:border-orange-500 font-bold" />
              </div>
            </div>
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-2">
              <button type="button" onClick={() => setShowPumpModal(false)} className="px-5 py-2.5 text-slate-600 font-bold rounded-xl hover:bg-slate-200 cursor-pointer">{t('Cancel', 'کینسل')}</button>
              <button type="submit" className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-sm cursor-pointer">{t('Save Pump', 'محفوظ کریں')}</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
