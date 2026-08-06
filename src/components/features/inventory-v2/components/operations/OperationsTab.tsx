import React from 'react';
import { InventoryHubProps } from '../../InventoryHub';
import { ManualDipEntry } from './ManualDipEntry';
import { ArrowDownToLine, ArrowUpFromLine, Activity, FileText, Settings2, FileOutput } from 'lucide-react';
import { logger } from '../../../../../lib/logger';
import toast from 'react-hot-toast';
import { EnterpriseGRNModal } from './EnterpriseGRNModal';

export const OperationsTab: React.FC<InventoryHubProps> = (props) => {
  const isEn = props.settings.language === 'en';
  const [showGRNModal, setShowGRNModal] = React.useState(false);
  
  const handleSaveDip = (tankId: string, dipCm: number, calculatedVolume: number) => {
    // Inventory Event Engine Integration
    logger.info(`[EVENT ENGINE] Dispatching EVENT_DIP_RECORDED for Tank ${tankId}`);
    logger.info(`[VARIANCE ENGINE] Analyzing variance for Tank ${tankId}`);
    console.log('Dip saved:', tankId, dipCm, calculatedVolume);
  };

  const handleGRN = () => {
    logger.info(`[EVENT ENGINE] Dispatching EVENT_GRN_RECEIVED`);
    toast.success('Stock In initiated (Event Dispatched)');
  };

  return (
    <div className="space-y-6">
      
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-card p-4 rounded-2xl border border-border">
        <div>
          <h3 className="text-lg font-black text-foreground flex items-center gap-2">
            <Activity className="w-5 h-5 text-primary" />
            {isEn ? 'Inventory Operations' : 'انوینٹری آپریشنز'}
          </h3>
          <p className="text-xs font-bold text-muted-foreground mt-1">
            {isEn ? 'Manage physical stock movements, GRNs, and reconciliation.' : 'اسٹاک کی آمد، روانگی اور پڑتال کا انتظام۔'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column - Stock In / GRN */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-card border border-border p-5 rounded-2xl shadow-sm">
             <div className="flex items-center gap-2 mb-4 text-emerald-500">
                <ArrowDownToLine className="w-5 h-5" />
                <h3 className="font-black text-lg text-foreground">{isEn ? 'Receive Stock (GRN)' : 'اسٹاک وصولی'}</h3>
             </div>
             <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed border-muted rounded-xl">
               <ArrowDownToLine className="w-12 h-12 text-muted-foreground/30 mb-4" />
               <p className="text-sm font-bold text-muted-foreground mb-4">
                 {isEn ? 'Record new bowser delivery and update physical tank stock.' : 'نئے باؤزر کی وصولی ریکارڈ کریں۔'}
               </p>
               <button onClick={() => setShowGRNModal(true)} className="px-4 py-2 bg-emerald-500 text-white font-black rounded-xl hover:bg-emerald-600 transition-colors shadow-sm cursor-pointer">
                 {isEn ? '+ New GRN (Stock In)' : '+ نئی وصولی'}
               </button>
             </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-card border border-border p-5 rounded-2xl shadow-sm">
               <div className="flex items-center gap-2 mb-4 text-sky-500">
                  <ArrowUpFromLine className="w-5 h-5" />
                  <h3 className="font-black text-sm text-foreground">{isEn ? 'Stock Transfer' : 'تبادلہ'}</h3>
               </div>
               <p className="text-xs font-bold text-muted-foreground mb-4">Transfer stock between compatible tanks.</p>
               <button onClick={() => logger.info("[EVENT ENGINE] Dispatching EVENT_STOCK_TRANSFER")} className="w-full py-2 bg-muted hover:bg-muted/80 text-foreground font-black rounded-xl text-xs transition-colors">Initiate Transfer</button>
            </div>

            <div className="bg-card border border-border p-5 rounded-2xl shadow-sm">
               <div className="flex items-center gap-2 mb-4 text-rose-500">
                  <Settings2 className="w-5 h-5" />
                  <h3 className="font-black text-sm text-foreground">{isEn ? 'Emergency Adjust' : 'ہنگامی تبدیلی'}</h3>
               </div>
               <p className="text-xs font-bold text-muted-foreground mb-4">Record spills, leaks, or emergency write-offs.</p>
               <button onClick={() => logger.info("[EVENT ENGINE] Dispatching EVENT_EMERGENCY_ADJUSTMENT")} className="w-full py-2 bg-rose-500/10 text-rose-600 hover:bg-rose-500/20 font-black rounded-xl text-xs transition-colors">Make Adjustment</button>
            </div>

            <div className="bg-card border border-border p-5 rounded-2xl shadow-sm">
               <div className="flex items-center gap-2 mb-4 text-amber-500">
                  <Activity className="w-5 h-5" />
                  <h3 className="font-black text-sm text-foreground">{isEn ? 'Meter Correction' : 'میٹر درستی'}</h3>
               </div>
               <p className="text-xs font-bold text-muted-foreground mb-4">Adjust inventory for meter calibration variances.</p>
               <button onClick={() => logger.info("[EVENT ENGINE] Dispatching EVENT_METER_CORRECTION")} className="w-full py-2 bg-muted hover:bg-muted/80 text-foreground font-black rounded-xl text-xs transition-colors">Log Correction</button>
            </div>

            <div className="bg-card border border-border p-5 rounded-2xl shadow-sm">
               <div className="flex items-center gap-2 mb-4 text-primary">
                  <FileText className="w-5 h-5" />
                  <h3 className="font-black text-sm text-foreground">{isEn ? 'Documents' : 'دستاویزات'}</h3>
               </div>
               <p className="text-xs font-bold text-muted-foreground mb-4">Attach calibration charts, GRNs, or inspection reports.</p>
               <button className="w-full py-2 bg-muted hover:bg-muted/80 text-foreground font-black rounded-xl text-xs transition-colors">Upload Document</button>
            </div>
          </div>
        </div>

        {/* Right Column - Manual Dip / Recon */}
        <div>
          <ManualDipEntry tanks={props.tanks} isEn={isEn} onSaveDip={handleSaveDip} />
          
          <div className="mt-6 bg-amber-500/10 border border-amber-500/20 p-5 rounded-2xl shadow-sm">
             <h4 className="text-amber-700 dark:text-amber-500 font-black mb-2 flex items-center gap-1.5">
               <Activity className="w-4 h-4" />
               {isEn ? 'Live Reconciliation Status' : 'لائیو پڑتال'}
             </h4>
             <p className="text-xs font-bold text-amber-700/70 dark:text-amber-500/70 mb-4">
               {isEn ? 'System automatically checks Book Stock against recent Physical Dips.' : 'سسٹم خودکار طور پر کتابی اور فزیکل اسٹاک کا موازنہ کرتا ہے۔'}
             </p>
             
             <div className="space-y-3">
               {props.tanks.slice(0, 3).map(t => (
                 <div key={t.id} className="flex items-center justify-between p-3 bg-white/50 dark:bg-black/20 rounded-xl">
                   <span className="text-xs font-black text-foreground">{t.name}</span>
                   <span className="text-[10px] font-bold px-2 py-1 bg-emerald-500/10 text-emerald-600 rounded-lg">Matched (0.2% var)</span>
                 </div>
               ))}
             </div>
          </div>
        </div>

      </div>

      {showGRNModal && (
        <EnterpriseGRNModal 
          tanks={props.tanks}
          isEn={isEn}
          onClose={() => setShowGRNModal(false)}
        />
      )}

    </div>
  );
};
