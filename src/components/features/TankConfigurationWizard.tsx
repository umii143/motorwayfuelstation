import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Cylinder, Fuel, CheckCircle2, RefreshCw, ChevronLeft, 
  Plus, Trash2, ArrowRight, Hash, X
} from 'lucide-react';
import { GlobalSettings, Tank, Nozzle, Product } from '../../types';

interface TankConfigurationWizardProps {
  onComplete: (data: {
    tanks: Partial<Tank>[];
    nozzles: Partial<Nozzle>[];
    products: Partial<Product>[];
  }) => void;
  onCancel: () => void;
  currentLanguage?: string;
  settings?: GlobalSettings;
}

export default function TankConfigurationWizard({ onComplete, onCancel, currentLanguage = 'en' }: TankConfigurationWizardProps) {
  const [step, setStep] = useState(1);
  const [isGenerating, setIsGenerating] = useState(false);

  // STEP 1: Products
  interface WizardProduct {
    name: string;
    type: 'fuel' | 'lube' | 'other';
    rate: number;
    unit: string;
  }
  const [products, setProducts] = useState<WizardProduct[]>([]);
  const [newProduct, setNewProduct] = useState<WizardProduct>({ name: '', type: 'fuel', rate: 0, unit: 'Liters' });

  // STEP 2: Tanks
  interface WizardTank {
    name: string;
    productName: string;
    capacity: number;
    currentStock: number;
  }
  const [tanks, setTanks] = useState<WizardTank[]>([]);
  const [newTank, setNewTank] = useState<WizardTank>({ name: '', productName: '', capacity: 20000, currentStock: 0 });

  // STEP 3: Nozzles
  interface WizardNozzle {
    name: string;
    pumpId: string;
    tankName: string; 
    openingReading: number;
  }
  const [nozzles, setNozzles] = useState<WizardNozzle[]>([]);
  const [newNozzle, setNewNozzle] = useState<WizardNozzle>({ name: '', pumpId: '1', openingReading: 0, tankName: '' });

  const handleAddProduct = () => {
    if (!newProduct.name.trim()) return;
    setProducts([...products, { ...newProduct }]);
    setNewProduct({ name: '', type: 'fuel', rate: 0, unit: 'Liters' });
  };

  const handleAddTank = () => {
    if (!newTank.name.trim()) return;
    setTanks([...tanks, { ...newTank }]);
    setNewTank({ name: '', productName: products.length > 0 ? products[0].name : '', capacity: 20000, currentStock: 0 });
  };

  const handleAddNozzle = () => {
    if (!newNozzle.name.trim()) return;
    setNozzles([...nozzles, { ...newNozzle }]);
    setNewNozzle({ ...newNozzle, name: '', openingReading: 0 });
  };

  const handleFinish = async () => {
    setIsGenerating(true);
    await new Promise(r => setTimeout(r, 1000));

    // Map to Partial domain objects
    const compiledProducts: Partial<Product>[] = products.map((p, idx) => ({
      id: `prod_wiz_${Date.now()}_${idx}`,
      name: p.name,
      urduName: p.name,
      type: p.type,
      rate: p.rate,
      unit: p.unit as any,
      currentStock: 0,
      minStock: 0
    }));

    const compiledTanks: Partial<Tank>[] = tanks.map((t, idx) => {
      const matchedProd = compiledProducts.find(p => p.name === t.productName);
      return {
        id: `tank_wiz_${Date.now()}_${idx}`,
        name: t.name,
        productId: matchedProd ? matchedProd.id : '',
        capacity: t.capacity,
        currentStock: t.currentStock,
        openingStock: t.currentStock,
        safeLevel: t.capacity * 0.2,
        criticalLevel: t.capacity * 0.1,
        dipChart: []
      };
    });

    const compiledNozzles: Partial<Nozzle>[] = nozzles.map((n, idx) => {
      const matchedTank = compiledTanks.find(t => t.name === n.tankName);
      return {
        id: `nzl_wiz_${Date.now()}_${idx}`,
        pumpId: `pump_${n.pumpId}`,
        name: n.name,
        tankId: matchedTank ? matchedTank.id : '',
        productId: matchedTank ? matchedTank.productId : '',
        currentReading: n.openingReading
      };
    });

    onComplete({
      products: compiledProducts,
      tanks: compiledTanks,
      nozzles: compiledNozzles
    });
  };

  const nextStep = () => setStep(s => Math.min(3, s + 1));
  const prevStep = () => setStep(s => Math.max(1, s - 1));

  const steps = [
    { title: 'Products', num: 1 },
    { title: 'Tanks', num: 2 },
    { title: 'Nozzles', num: 3 }
  ];

  return (
    <div className="fixed inset-0 z-[9000] bg-slate-950/80 backdrop-blur-sm flex flex-col items-center justify-center p-4 sm:p-6 overflow-hidden">
      {/* Background Decor */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-orange-600/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-amber-600/10 blur-[120px] rounded-full" />
      </div>

      <div className="w-full max-w-2xl bg-[var(--bg-card)] border border-[var(--border-main)] rounded-3xl shadow-2xl relative z-10 flex flex-col max-h-[90dvh]">
        
        {/* Wizard Header / Stepper */}
        <div className="p-6 border-b border-[var(--border-main)] shrink-0">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-black text-[var(--text-main)] uppercase tracking-wider">
              Tank Configuration Wizard
            </h2>
            <button onClick={onCancel} className="p-2 text-slate-500 hover:text-[var(--text-main)] hover:bg-slate-100 dark:hover:bg-white/5 rounded-full transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <div className="relative flex justify-between">
            {/* Connecting line */}
            <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-slate-200 dark:bg-slate-800 -translate-y-1/2 z-0" />
            
            {steps.map((s) => {
              const isActive = step === s.num;
              const isCompleted = step > s.num;
              
              return (
                <div key={s.num} className="relative z-10 flex flex-col items-center gap-2">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-colors duration-300 border-2 ${
                    isCompleted ? 'bg-emerald-500 border-emerald-500 text-white' : 
                    isActive ? 'bg-[var(--primary-accent)] border-[var(--primary-accent)] text-white shadow-lg shadow-[var(--primary-accent)]/30' : 
                    'bg-[var(--bg-card)] border-slate-300 dark:border-slate-700 text-slate-500'
                  }`}>
                    {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : s.num}
                  </div>
                  <span className={`text-[10px] font-bold uppercase tracking-wider hidden sm:block ${
                    isActive ? 'text-[var(--primary-accent)]' : isCompleted ? 'text-emerald-500' : 'text-slate-500'
                  }`}>
                    {s.title}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Wizard Body */}
        <div className="p-6 overflow-y-auto flex-1 relative scrollbar-hide">
          <AnimatePresence mode="wait">
            
            {/* STEP 1: PRODUCTS */}
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="text-center mb-6">
                  <h3 className="text-xl font-black text-[var(--text-main)] mb-1">Set Up Products</h3>
                  <p className="text-[var(--text-muted)] text-sm">Add the fuel/lube products your station sells.</p>
                </div>

                {products.length > 0 && (
                  <div className="space-y-2 mb-4">
                    {products.map((p, idx) => (
                      <div key={idx} className="flex items-center justify-between bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3 border border-slate-200 dark:border-slate-700/50">
                        <div>
                          <p className="text-sm font-bold text-[var(--text-main)]">{p.name} <span className="text-xs text-slate-500 font-normal">({p.type})</span></p>
                          <p className="text-xs font-semibold text-[var(--primary-accent)]">Rs {p.rate} / {p.unit}</p>
                        </div>
                        <button onClick={() => setProducts(products.filter((_, i) => i !== idx))} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="bg-slate-50 dark:bg-[var(--bg-app)] border border-slate-200 dark:border-[var(--border-main)] rounded-2xl p-4 space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <input 
                      placeholder="Product Name (e.g. Super Petrol)" 
                      value={newProduct.name}
                      onChange={e => setNewProduct({...newProduct, name: e.target.value})}
                      className="col-span-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm text-[var(--text-main)] focus:border-[var(--primary-accent)] focus:ring-1 focus:ring-[var(--primary-accent)] outline-none transition-all"
                    />
                    <select 
                      value={newProduct.type}
                      onChange={e => setNewProduct({...newProduct, type: e.target.value as any})}
                      className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm text-[var(--text-main)] focus:border-[var(--primary-accent)] outline-none"
                    >
                      <option value="fuel">Fuel</option>
                      <option value="lube">Lube</option>
                      <option value="other">Other</option>
                    </select>
                    <input 
                      type="number"
                      placeholder="Rate (Price)" 
                      value={newProduct.rate || ''}
                      onChange={e => setNewProduct({...newProduct, rate: parseFloat(e.target.value) || 0})}
                      className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm text-[var(--text-main)] focus:border-[var(--primary-accent)] outline-none"
                    />
                  </div>
                  <button 
                    onClick={handleAddProduct}
                    disabled={!newProduct.name.trim()}
                    className="w-full py-3 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 disabled:opacity-50 text-slate-700 dark:text-slate-300 text-sm font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
                  >
                    <Plus className="w-4 h-4" /> Add Product
                  </button>
                </div>
              </motion.div>
            )}

            {/* STEP 2: TANKS */}
            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="text-center mb-6">
                  <h3 className="text-xl font-black text-[var(--text-main)] mb-1">Set Up Tanks</h3>
                  <p className="text-[var(--text-muted)] text-sm">Create storage tanks and link them to products.</p>
                </div>

                {tanks.length > 0 && (
                  <div className="space-y-2 mb-4">
                    {tanks.map((t, idx) => (
                      <div key={idx} className="flex items-center justify-between bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3 border border-slate-200 dark:border-slate-700/50">
                        <div>
                          <p className="text-sm font-bold text-[var(--text-main)]">{t.name}</p>
                          <p className="text-xs font-semibold text-slate-500">Links to: <span className="text-[var(--primary-accent)]">{t.productName || 'None'}</span> • {t.capacity.toLocaleString()}L</p>
                        </div>
                        <button onClick={() => setTanks(tanks.filter((_, i) => i !== idx))} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="bg-slate-50 dark:bg-[var(--bg-app)] border border-slate-200 dark:border-[var(--border-main)] rounded-2xl p-4 space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <input 
                      placeholder="Tank Name (e.g. Tank 1)" 
                      value={newTank.name}
                      onChange={e => setNewTank({...newTank, name: e.target.value})}
                      className="col-span-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm text-[var(--text-main)] focus:border-orange-500 outline-none"
                    />
                    <select 
                      value={newTank.productName}
                      onChange={e => setNewTank({...newTank, productName: e.target.value})}
                      className="col-span-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm text-[var(--text-main)] focus:border-orange-500 outline-none"
                    >
                      <option value="" disabled>Link to Product (Optional)</option>
                      {products.map((p, i) => (
                        <option key={i} value={p.name}>{p.name}</option>
                      ))}
                    </select>
                    <input 
                      type="number"
                      placeholder="Capacity (L)" 
                      value={newTank.capacity || ''}
                      onChange={e => setNewTank({...newTank, capacity: parseInt(e.target.value) || 0})}
                      className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm text-[var(--text-main)] focus:border-orange-500 outline-none"
                    />
                    <input 
                      type="number"
                      placeholder="Current Stock (L)" 
                      value={newTank.currentStock || ''}
                      onChange={e => setNewTank({...newTank, currentStock: parseInt(e.target.value) || 0})}
                      className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm text-[var(--text-main)] focus:border-orange-500 outline-none"
                    />
                  </div>
                  <button 
                    onClick={handleAddTank}
                    disabled={!newTank.name.trim()}
                    className="w-full py-3 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 disabled:opacity-50 text-slate-700 dark:text-slate-300 text-sm font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
                  >
                    <Plus className="w-4 h-4" /> Add Tank
                  </button>
                </div>
              </motion.div>
            )}

            {/* STEP 3: NOZZLES */}
            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="text-center mb-6">
                  <h3 className="text-xl font-black text-[var(--text-main)] mb-1">Set Up Nozzles</h3>
                  <p className="text-[var(--text-muted)] text-sm">Add dispensing nozzles and link them to tanks.</p>
                </div>

                {nozzles.length > 0 && (
                  <div className="space-y-2 mb-4">
                    {nozzles.map((n, idx) => (
                      <div key={idx} className="flex items-center justify-between bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3 border border-slate-200 dark:border-slate-700/50">
                        <div>
                          <p className="text-sm font-bold text-[var(--text-main)]">{n.name}</p>
                          <p className="text-xs font-semibold text-slate-500">Pump {n.pumpId} • Links to: <span className="text-emerald-500">{n.tankName || 'None'}</span></p>
                        </div>
                        <button onClick={() => setNozzles(nozzles.filter((_, i) => i !== idx))} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="bg-slate-50 dark:bg-[var(--bg-app)] border border-slate-200 dark:border-[var(--border-main)] rounded-2xl p-4 space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <input 
                      placeholder="Nozzle Name (e.g. N1)" 
                      value={newNozzle.name}
                      onChange={e => setNewNozzle({...newNozzle, name: e.target.value})}
                      className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm text-[var(--text-main)] focus:border-orange-500 outline-none"
                    />
                    <select 
                      value={newNozzle.tankName}
                      onChange={e => setNewNozzle({...newNozzle, tankName: e.target.value})}
                      className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm text-[var(--text-main)] focus:border-orange-500 outline-none"
                    >
                      <option value="" disabled>Link to Tank (Optional)</option>
                      {tanks.map((t, i) => (
                        <option key={i} value={t.name}>{t.name}</option>
                      ))}
                    </select>
                    <input 
                      type="number"
                      placeholder="Pump No. (e.g. 1)" 
                      value={newNozzle.pumpId || ''}
                      onChange={e => setNewNozzle({...newNozzle, pumpId: e.target.value})}
                      className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm text-[var(--text-main)] focus:border-orange-500 outline-none"
                    />
                    <input 
                      type="number"
                      placeholder="Opening Reading" 
                      value={newNozzle.openingReading || ''}
                      onChange={e => setNewNozzle({...newNozzle, openingReading: parseFloat(e.target.value) || 0})}
                      className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm text-[var(--text-main)] focus:border-orange-500 outline-none"
                    />
                  </div>
                  <button 
                    onClick={handleAddNozzle}
                    disabled={!newNozzle.name.trim()}
                    className="w-full py-3 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 disabled:opacity-50 text-slate-700 dark:text-slate-300 text-sm font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
                  >
                    <Plus className="w-4 h-4" /> Add Nozzle
                  </button>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>

        {/* Wizard Footer / Controls */}
        <div className="p-6 border-t border-[var(--border-main)] shrink-0 bg-slate-50 dark:bg-[var(--bg-card)] rounded-b-3xl">
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
            {/* Left side actions (Back & Skip) */}
            <div className="flex gap-2 w-full sm:w-auto">
              {step > 1 && (
                <button
                  onClick={prevStep}
                  disabled={isGenerating}
                  className="px-5 py-3.5 rounded-xl font-bold text-xs uppercase tracking-wider bg-white dark:bg-[var(--bg-app)] border border-slate-200 dark:border-[var(--border-main)] text-[var(--text-main)] hover:bg-slate-50 dark:hover:bg-[var(--bg-hover)] transition-colors flex items-center gap-2 disabled:opacity-50 flex-1 sm:flex-none justify-center"
                >
                  <ChevronLeft className="w-4 h-4" /> Back
                </button>
              )}
              
              {step < 3 ? (
                <button
                  onClick={nextStep}
                  disabled={isGenerating}
                  className="px-5 py-3.5 rounded-xl font-bold text-xs uppercase tracking-wider bg-transparent border border-slate-300 dark:border-slate-700 text-slate-500 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors flex-1 sm:flex-none"
                >
                  Skip Step
                </button>
              ) : (
                <button
                  onClick={handleFinish}
                  disabled={isGenerating}
                  className="px-5 py-3.5 rounded-xl font-bold text-xs uppercase tracking-wider bg-transparent border border-slate-300 dark:border-slate-700 text-slate-500 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors flex-1 sm:flex-none"
                >
                  Skip & Finish
                </button>
              )}
            </div>

            {/* Right side actions (Continue / Save) */}
            <div className="w-full sm:w-auto mt-2 sm:mt-0">
              {step < 3 ? (
                <button
                  onClick={nextStep}
                  className="w-full sm:w-48 bg-[var(--primary-accent)] hover:bg-orange-500 text-white py-3.5 rounded-xl font-bold text-sm uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-lg shadow-[var(--primary-accent)]/20"
                >
                  <span>Continue</span>
                  <ArrowRight className="w-5 h-5" />
                </button>
              ) : (
                <button
                  onClick={handleFinish}
                  disabled={isGenerating}
                  className="w-full sm:w-48 bg-emerald-600 hover:bg-emerald-500 text-white py-3.5 rounded-xl font-bold text-sm uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-70"
                >
                  {isGenerating ? (
                    <>
                      <RefreshCw className="w-5 h-5 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-5 h-5" />
                      <span>Save Config</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
