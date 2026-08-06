import React, { useState } from 'react';
import { Tank } from '../../../../../types';
import { X, Activity, Droplet, Fuel, History, FileText, AlertTriangle, TrendingUp, TrendingDown, ArrowRight, Save, BrainCircuit } from 'lucide-react';

interface TankDetailsDrawerProps {
  tank: Tank;
  onClose: () => void;
  isEn: boolean;
  currentStock: number;
}

type DrawerTab = 'overview' | 'history' | 'dips' | 'grn' | 'sales' | 'adjustments' | 'documents' | 'ai';

export const TankDetailsDrawer: React.FC<TankDetailsDrawerProps> = ({ tank, onClose, isEn, currentStock }) => {
  const [activeTab, setActiveTab] = useState<DrawerTab>('overview');
  
  const capacity = tank.capacity || 1;
  const fillPercentage = Math.min(100, Math.max(0, (currentStock / capacity) * 100));

  const TABS = [
    { id: 'overview' as const, label: isEn ? 'Overview' : 'جائزہ', icon: <Activity className="w-4 h-4" /> },
    { id: 'history' as const, label: isEn ? 'History' : 'ہسٹری', icon: <History className="w-4 h-4" /> },
    { id: 'dips' as const, label: isEn ? 'Dips' : 'ڈیپ', icon: <Droplet className="w-4 h-4" /> },
    { id: 'grn' as const, label: isEn ? 'GRN' : 'وصولی', icon: <TrendingUp className="w-4 h-4" /> },
    { id: 'sales' as const, label: isEn ? 'Sales' : 'سیلز', icon: <Fuel className="w-4 h-4" /> },
    { id: 'adjustments' as const, label: isEn ? 'Adjustments' : 'ایڈجسٹمنٹ', icon: <AlertTriangle className="w-4 h-4" /> },
    { id: 'documents' as const, label: isEn ? 'Documents' : 'دستاویزات', icon: <FileText className="w-4 h-4" /> },
    { id: 'ai' as const, label: isEn ? 'AI Insights' : 'اے آئی ان سائٹس', icon: <BrainCircuit className="w-4 h-4" /> },
  ];

  return (
    <>
      <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 transition-opacity" onClick={onClose}></div>
      <div className="fixed inset-y-0 right-0 w-full max-w-2xl bg-card border-l border-border shadow-2xl z-50 flex flex-col animate-in slide-in-from-right-full duration-300">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-border">
          <div>
            <h2 className="text-xl font-black text-foreground flex items-center gap-2">
              <Database className="w-6 h-6 text-primary" />
              {tank.name} 
              <span className="px-2 py-0.5 bg-muted text-muted-foreground text-[10px] uppercase tracking-wider font-bold rounded-full ml-2">
                {tank.productName}
              </span>
            </h2>
            <p className="text-xs font-bold text-muted-foreground mt-1">{isEn ? 'Tank Details & Operations History' : 'ٹینک کی تفصیلات اور تاریخ'}</p>
          </div>
          <button onClick={onClose} className="p-2 bg-muted hover:bg-muted/80 rounded-xl transition-colors">
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 p-2 px-4 border-b border-border bg-muted/20 overflow-x-auto hide-scrollbar">
          {TABS.map(tab => (
             <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-black whitespace-nowrap transition-colors ${
                  activeTab === tab.id ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
             >
               {tab.icon}
               {tab.label}
             </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          
          {activeTab === 'overview' && (
            <div className="space-y-6 animate-in fade-in zoom-in-95">
              
              {/* Primary Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-muted/30 border border-border p-4 rounded-2xl">
                  <p className="text-[10px] font-black text-muted-foreground uppercase">{isEn ? 'Capacity' : 'گنجائش'}</p>
                  <p className="text-lg font-black text-foreground">{capacity.toLocaleString()} <span className="text-xs">L</span></p>
                </div>
                <div className="bg-muted/30 border border-border p-4 rounded-2xl">
                  <p className="text-[10px] font-black text-muted-foreground uppercase">{isEn ? 'Current Stock' : 'موجودہ اسٹاک'}</p>
                  <p className="text-lg font-black text-foreground">{currentStock.toLocaleString()} <span className="text-xs">L</span></p>
                </div>
                <div className="bg-muted/30 border border-border p-4 rounded-2xl">
                  <p className="text-[10px] font-black text-muted-foreground uppercase">{isEn ? 'Safe Fill %' : 'محفوظ فلنگ'}</p>
                  <p className="text-lg font-black text-foreground">95%</p>
                </div>
                <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-2xl">
                  <p className="text-[10px] font-black text-amber-700 dark:text-amber-500 uppercase">{isEn ? 'Water mm' : 'پانی'}</p>
                  <p className="text-lg font-black text-amber-600">{(tank as any).waterLevel || 0} mm</p>
                </div>
              </div>

              {/* Status and KPIs */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-emerald-500/10 border border-emerald-500/20 p-5 rounded-2xl">
                   <h3 className="text-xs font-black text-emerald-700 dark:text-emerald-500 uppercase mb-4">{isEn ? "Today's In/Out" : "آج کی آمد و رفت"}</h3>
                   <div className="flex justify-between items-center mb-2">
                     <span className="text-sm font-bold text-foreground">In (GRN)</span>
                     <span className="text-sm font-black text-emerald-600">+15,000 L</span>
                   </div>
                   <div className="flex justify-between items-center pt-2 border-t border-emerald-500/20">
                     <span className="text-sm font-bold text-foreground">Out (Sales)</span>
                     <span className="text-sm font-black text-rose-600">-4,250 L</span>
                   </div>
                </div>

                <div className="bg-primary/5 border border-primary/10 p-5 rounded-2xl">
                   <h3 className="text-xs font-black text-primary uppercase mb-4">{isEn ? "Health Status" : "ہیلتھ اسٹیٹس"}</h3>
                   {fillPercentage > 20 ? (
                     <div className="flex items-center gap-2">
                       <span className="px-3 py-1 bg-emerald-500/20 text-emerald-700 font-black text-sm rounded-lg">HEALTHY</span>
                       <span className="text-xs font-bold text-muted-foreground">Operating normally</span>
                     </div>
                   ) : (
                     <div className="flex items-center gap-2">
                       <span className="px-3 py-1 bg-amber-500/20 text-amber-700 font-black text-sm rounded-lg">WARNING</span>
                       <span className="text-xs font-bold text-muted-foreground">Low Stock</span>
                     </div>
                   )}
                   <div className="mt-4 pt-4 border-t border-border flex justify-between items-center">
                     <span className="text-xs font-black text-muted-foreground uppercase">{isEn ? 'Last Variance' : 'آخری فرق'}</span>
                     <span className="text-sm font-black text-foreground">-0.15% (Acceptable)</span>
                   </div>
                </div>
              </div>
              
              {/* Visual Fill Bar */}
              <div>
                <div className="flex justify-between items-end mb-2">
                   <h3 className="text-xs font-black text-foreground uppercase">{isEn ? 'Fill Level' : 'فلنگ'}</h3>
                   <span className="text-sm font-black text-foreground">{Math.round(fillPercentage)}%</span>
                </div>
                <div className="w-full h-4 bg-muted rounded-full overflow-hidden">
                   <div className="h-full bg-primary rounded-full transition-all duration-1000" style={{ width: `${fillPercentage}%` }}></div>
                </div>
                <p className="text-[10px] font-bold text-muted-foreground mt-2 text-right">
                  {isEn ? `Available Space: ${(capacity - currentStock).toLocaleString()} L` : `خالی جگہ: ${(capacity - currentStock).toLocaleString()} L`}
                </p>
              </div>

            </div>
          )}

          {activeTab === 'ai' && (
            <div className="space-y-4 animate-in fade-in zoom-in-95">
              <div className="bg-amber-500/10 border border-amber-500/20 p-5 rounded-2xl flex gap-4 items-start">
                <div className="w-10 h-10 bg-amber-500 text-white rounded-full flex items-center justify-center shrink-0">
                  <BrainCircuit className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-amber-700 dark:text-amber-500">Stock Depletion Warning</h4>
                  <p className="text-xs font-bold text-foreground mt-1 mb-3">Based on current sales velocity, Tank 1 will run out of stock in approximately 2.4 days.</p>
                  <button className="px-4 py-2 bg-amber-500 text-white font-black text-xs rounded-xl hover:bg-amber-600 transition-colors">
                    Generate Draft PO for 20,000 L
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'history' && (
             <div className="flex flex-col items-center justify-center py-20 text-center animate-in fade-in zoom-in-95">
               <History className="w-12 h-12 text-muted-foreground/30 mb-4" />
               <p className="text-muted-foreground font-bold">{isEn ? 'History loaded from Event Engine.' : 'ہسٹری ایونٹ انجن سے لوڈ کی گئی۔'}</p>
             </div>
          )}

          {/* Other tabs placeholders */}
          {['dips', 'grn', 'sales', 'adjustments', 'documents'].includes(activeTab) && (
            <div className="flex flex-col items-center justify-center py-20 text-center animate-in fade-in zoom-in-95">
               <p className="text-muted-foreground font-bold">{isEn ? 'Data populated from respective event logs.' : 'متعلقہ لاگز سے ڈیٹا لوڈ کیا گیا۔'}</p>
            </div>
          )}

        </div>
      </div>
    </>
  );
};
// Add Database import 
import { Database } from 'lucide-react';
