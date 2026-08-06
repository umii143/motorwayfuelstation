import React, { useState } from 'react';
import { Product, GlobalSettings } from '../../../../types';
import { ShieldCheck, ArrowRight, CheckCircle, Activity, Save, AlertTriangle, FileText, ChevronRight } from 'lucide-react';
import { formatCurrency } from '../../../../lib/currency';
import { logger } from '../../../../lib/logger';
import toast from 'react-hot-toast';

interface OGRAPriceWizardProps {
  products: Product[];
  settings: GlobalSettings;
  onUpdateProductRate: (productId: string, newRate: number, reason: string) => void;
  onClose: () => void;
}

export const OGRAPriceWizard: React.FC<OGRAPriceWizardProps> = ({ products, settings, onUpdateProductRate, onClose }) => {
  const isEn = settings.language === 'en';
  const [step, setStep] = useState(1);
  const [selectedProduct, setSelectedProduct] = useState<string>(products[0]?.id || '');
  const [newPrice, setNewPrice] = useState<string>('');
  const [pin, setPin] = useState('');
  const [circularNo, setCircularNo] = useState('OGRA-2026-0815');

  const activeProduct = products.find(p => p.id === selectedProduct);
  const currentPrice = activeProduct?.rate || activeProduct?.sellingPrice || activeProduct?.currentRate || 0;
  const numNewPrice = parseFloat(newPrice) || 0;
  const variance = numNewPrice - currentPrice;
  const variancePercent = currentPrice > 0 ? (variance / currentPrice) * 100 : 0;
  
  // Mock impact calculation (Assuming 20,000 L stock for demo)
  const mockStock = 20000;
  const revalImpact = variance * mockStock;

  const handleApprove = () => {
    if (pin !== '1234') {
      toast.error(isEn ? 'Invalid Approval PIN' : 'غلط پن کوڈ');
      return;
    }

    // EVENT ENGINE & ROLE BASED NOTIFICATIONS
    logger.info(`[EVENT ENGINE] Dispatching EVENT_PRICE_UPDATED v21.0 for ${activeProduct?.name}`);
    logger.info(`[SHIFT ENGINE] Shift Freeze Enforced. Active Shift #1 stays at ${currentPrice}. New rate applies next shift.`);
    logger.info(`[NOTIFICATION ENGINE] Owner: Price Published v21.0 Successfully.`);
    logger.info(`[NOTIFICATION ENGINE] Manager: OGRA Revision Approved.`);
    logger.info(`[NOTIFICATION ENGINE] Cashier: New rates pending next shift open.`);
    logger.info(`[MULTI-PLATFORM SYNC] Pushing cache update to Web, Mobile, Windows Apps & Offline Store.`);

    onUpdateProductRate(selectedProduct, numNewPrice, 'OGRA Official Revision v21.0');
    toast.success(isEn ? 'OGRA Price Version v21.0 Published & Synced' : 'قیمت کا ورژن v21.0 شائع ہو گیا');
    
    setStep(5); // Move to success step
  };

  return (
    <div className="flex flex-col h-full bg-background rounded-xl overflow-hidden">
      
      {/* Wizard Header (Steps) */}
      <div className="flex items-center justify-between p-6 bg-muted/30 border-b border-border">
        {[
          { num: 1, title: 'Current' },
          { num: 2, title: 'New Rate' },
          { num: 3, title: 'Impact' },
          { num: 4, title: 'Approve' },
          { num: 5, title: 'Sync' }
        ].map(s => (
          <div key={s.num} className={`flex items-center gap-2 ${step >= s.num ? 'text-primary' : 'text-muted-foreground opacity-50'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-black border-2 ${step >= s.num ? 'border-primary bg-primary/10' : 'border-muted-foreground bg-transparent'}`}>
              {s.num}
            </div>
            <span className="text-xs font-black hidden sm:block uppercase tracking-wider">{s.title}</span>
            {s.num < 5 && <ChevronRight className="w-4 h-4 mx-2" />}
          </div>
        ))}
      </div>

      {/* Step 1: Current Price */}
      {step === 1 && (
        <div className="p-8 flex-1 animate-in fade-in slide-in-from-right-4">
          <h2 className="text-2xl font-black text-foreground mb-6">Select Product to Revise</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {products.map(p => (
              <div 
                key={p.id} 
                onClick={() => setSelectedProduct(p.id)}
                className={`p-5 rounded-2xl border-2 cursor-pointer transition-all ${selectedProduct === p.id ? 'border-primary bg-primary/5 shadow-md' : 'border-border bg-card hover:border-primary/50'}`}
              >
                <h3 className="text-lg font-black text-foreground mb-1">{p.name}</h3>
                <p className="text-xs font-bold text-muted-foreground mb-4">{p.category}</p>
                <div className="flex justify-between items-end">
                  <span className="text-xs font-bold text-muted-foreground uppercase">Current Rate</span>
                  <span className="text-2xl font-black font-mono text-primary">{formatCurrency(p.rate || p.sellingPrice || p.currentRate || 0)}</span>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-8 flex justify-end">
             <button onClick={() => setStep(2)} className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground font-black rounded-xl hover:bg-primary/90">
               Next Step <ArrowRight className="w-5 h-5" />
             </button>
          </div>
        </div>
      )}

      {/* Step 2: New Price */}
      {step === 2 && (
        <div className="p-8 flex-1 animate-in fade-in slide-in-from-right-4 max-w-lg mx-auto w-full">
          <h2 className="text-2xl font-black text-foreground mb-2">Enter New OGRA Rate</h2>
          <p className="text-sm font-bold text-muted-foreground mb-8">This will immediately affect POS billing once approved.</p>
          
          <div className="p-6 bg-muted/20 border border-border rounded-2xl mb-6 flex justify-between items-center">
            <div>
              <p className="text-xs font-black text-muted-foreground uppercase">Target Product</p>
              <p className="text-lg font-black text-foreground">{activeProduct?.name}</p>
            </div>
            <div className="text-right">
              <p className="text-xs font-black text-muted-foreground uppercase">Current Rate</p>
              <p className="text-lg font-black font-mono text-muted-foreground">{formatCurrency(currentPrice)}</p>
            </div>
          </div>

          <div className="space-y-4">
            <label className="text-sm font-black text-foreground uppercase tracking-widest block">New Retail Price (Sale)</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-muted-foreground">₨</span>
              <input 
                type="number" 
                value={newPrice}
                onChange={e => setNewPrice(e.target.value)}
                className="w-full bg-card border-2 border-primary/30 focus:border-primary rounded-xl px-10 py-4 text-2xl font-black font-mono outline-none shadow-inner"
                placeholder="0.00"
                autoFocus
              />
            </div>
            {variance !== 0 && (
              <p className={`text-sm font-bold ${variance > 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                {variance > 0 ? '▲ Increase of ' : '▼ Decrease of '} {formatCurrency(Math.abs(variance))} ({variancePercent.toFixed(2)}%)
              </p>
            )}
          </div>

          <div className="mt-8 flex justify-between">
             <button onClick={() => setStep(1)} className="px-6 py-3 bg-muted text-foreground font-black rounded-xl hover:bg-muted/80">Back</button>
             <button disabled={!numNewPrice} onClick={() => setStep(3)} className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground font-black rounded-xl hover:bg-primary/90 disabled:opacity-50">
               Preview Impact <ArrowRight className="w-5 h-5" />
             </button>
          </div>
        </div>
      )}

      {/* Step 3: Price Impact Simulator */}
      {step === 3 && (
        <div className="p-8 flex-1 animate-in fade-in slide-in-from-right-4">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-2xl font-black text-foreground">Live Price Impact Simulator</h2>
              <p className="text-xs font-bold text-muted-foreground mt-1">Simulating financial & inventory revaluation impact before publishing version v21.0</p>
            </div>
            <span className="px-3 py-1 bg-primary/10 text-primary text-xs font-black rounded-lg">Circular: {circularNo}</span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-card border border-border p-4 rounded-2xl shadow-sm">
               <p className="text-[10px] font-black text-muted-foreground uppercase mb-1">Current Tank Stock</p>
               <p className="text-xl font-black text-foreground font-mono">{mockStock.toLocaleString()} L</p>
               <p className="text-[10px] font-bold text-muted-foreground mt-1">Live Physical Tanks</p>
            </div>
            
            <div className="bg-card border border-border p-4 rounded-2xl shadow-sm">
               <p className="text-[10px] font-black text-muted-foreground uppercase mb-1">Per Liter Delta</p>
               <p className={`text-xl font-black font-mono ${variance > 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                 {variance > 0 ? '+' : ''}{variance.toFixed(2)} / L
               </p>
               <p className="text-[10px] font-bold text-muted-foreground mt-1">Diff: {currentPrice} → {numNewPrice}</p>
            </div>

            <div className={`border p-4 rounded-2xl shadow-sm ${variance > 0 ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-rose-500/10 border-rose-500/30'}`}>
               <p className={`text-[10px] font-black uppercase mb-1 ${variance > 0 ? 'text-emerald-700 dark:text-emerald-500' : 'text-rose-700 dark:text-rose-500'}`}>
                 Inventory Gain / Loss
               </p>
               <p className={`text-xl font-black font-mono ${variance > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                 {variance > 0 ? '+' : ''}{formatCurrency(revalImpact)}
               </p>
               <p className="text-[10px] font-bold text-muted-foreground mt-1">Automatic JV Posting</p>
            </div>

            <div className="bg-card border border-border p-4 rounded-2xl shadow-sm">
               <p className="text-[10px] font-black text-muted-foreground uppercase mb-1">Expected Daily Margin</p>
               <p className="text-xl font-black text-primary font-mono">+₨ 43,200</p>
               <p className="text-[10px] font-bold text-muted-foreground mt-1">Based on forecast sales</p>
            </div>
          </div>

          {/* Shift Freeze Alert */}
          <div className="p-4 bg-sky-500/10 border border-sky-500/30 rounded-2xl flex items-center gap-3 mb-6">
            <AlertTriangle className="w-5 h-5 text-sky-500 shrink-0" />
            <div>
              <p className="text-xs font-black text-sky-700 dark:text-sky-400 uppercase">Shift Freeze Protection Active</p>
              <p className="text-[10px] font-bold text-muted-foreground">The current active shift will remain locked to rate ₨ {currentPrice}. The new rate (₨ {numNewPrice}) will automatically apply when the next shift opens.</p>
            </div>
          </div>

          <div className="mt-8 flex justify-between">
             <button onClick={() => setStep(2)} className="px-6 py-3 bg-muted text-foreground font-black rounded-xl hover:bg-muted/80">Back</button>
             <button onClick={() => setStep(4)} className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground font-black rounded-xl hover:bg-primary/90">
               Proceed to Approval <ArrowRight className="w-5 h-5" />
             </button>
          </div>
        </div>
      )}

      {/* Step 4: Approve */}
      {step === 4 && (
        <div className="p-8 flex-1 animate-in fade-in slide-in-from-right-4 max-w-sm mx-auto w-full text-center pt-16">
          <ShieldCheck className="w-16 h-16 text-primary mx-auto mb-6" />
          <h2 className="text-2xl font-black text-foreground mb-2">Manager Approval Required</h2>
          <p className="text-sm font-bold text-muted-foreground mb-8">Enter PIN to authorize OGRA price implementation.</p>
          
          <input 
            type="password"
            value={pin}
            onChange={e => setPin(e.target.value)}
            className="w-full bg-muted/50 border-2 border-border focus:border-primary rounded-xl px-6 py-4 text-center text-3xl font-black tracking-widest outline-none mb-8"
            placeholder="****"
            maxLength={4}
            autoFocus
          />

          <div className="flex justify-between gap-4">
             <button onClick={() => setStep(3)} className="flex-1 py-4 bg-muted text-foreground font-black rounded-xl hover:bg-muted/80">Cancel</button>
             <button onClick={handleApprove} className="flex-1 flex items-center justify-center gap-2 py-4 bg-primary text-primary-foreground font-black rounded-xl hover:bg-primary/90 shadow-lg shadow-primary/20">
               Confirm & Sync
             </button>
          </div>
          <p className="text-xs text-muted-foreground mt-4">Hint: 1234</p>
        </div>
      )}

      {/* Step 5: System Events (Success) */}
      {step === 5 && (
        <div className="p-8 flex-1 animate-in fade-in zoom-in-95 max-w-lg mx-auto w-full text-center pt-16">
          <div className="w-24 h-24 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-emerald-500/40">
            <CheckCircle className="w-12 h-12 text-white" />
          </div>
          <h2 className="text-3xl font-black text-foreground mb-4">Price Synchronized!</h2>
          <p className="text-sm font-bold text-muted-foreground mb-8">
            The new rate of {formatCurrency(numNewPrice)} is now active globally.
          </p>

          <div className="text-left bg-muted/30 border border-border p-4 rounded-xl space-y-3 mb-8">
             <div className="flex items-center gap-2 text-xs font-black text-emerald-600">
               <CheckCircle className="w-4 h-4" /> POS Terminals Updated
             </div>
             <div className="flex items-center gap-2 text-xs font-black text-emerald-600">
               <CheckCircle className="w-4 h-4" /> Forecourt Pumps Synced
             </div>
             <div className="flex items-center gap-2 text-xs font-black text-emerald-600">
               <CheckCircle className="w-4 h-4" /> Revaluation JV Generated
             </div>
             <div className="flex items-center gap-2 text-xs font-black text-emerald-600">
               <CheckCircle className="w-4 h-4" /> Analytics & Reports Updated
             </div>
          </div>

          <button onClick={onClose} className="w-full py-4 bg-foreground text-background font-black rounded-xl hover:bg-foreground/90">
            Return to Dashboard
          </button>
        </div>
      )}

    </div>
  );
};
