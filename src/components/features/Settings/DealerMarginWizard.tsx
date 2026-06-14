import React, { useState } from 'react';
import { DollarSign, Plus, Save, Activity, Trash2, ShieldAlert } from 'lucide-react';
import { DealerMarginSetting } from '../../../types';
import { useInventoryStore } from '../../../stores/useInventoryStore';
import { t } from '../../../lib/translations';

interface DealerMarginWizardProps {
  language: string;
  onLogAudit: (category: string, action: string, details: string) => void;
  stationId: string;
}

export default function DealerMarginWizard({ language, onLogAudit, stationId }: DealerMarginWizardProps) {
  const dealerMarginSettings = useInventoryStore(state => state.dealerMarginSettings) || [];
  const handleUpdateDealerMargin = useInventoryStore(state => state.handleUpdateDealerMargin);
  
  const [isAdding, setIsAdding] = useState(false);
  const [productType, setProductType] = useState('petrol');
  const [marginPerLiter, setMarginPerLiter] = useState('');
  const [effectiveFrom, setEffectiveFrom] = useState(() => {
    const d = new Date();
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0, 10);
  });
  const [notes, setNotes] = useState('');

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const marginNum = Number(marginPerLiter);
    if (!productType || marginNum <= 0 || !effectiveFrom) return;

    // Previous active setting for this product should be marked as ended
    // We do this by checking if there's an active one that starts before this
    const activeSettings = dealerMarginSettings.filter(s => s.productType === productType && !s.effectiveTo);
    
    // We can just add the new one. The getter logic uses the latest effectiveFrom date that is <= atDate
    const newSetting: DealerMarginSetting = {
      id: `dm_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      productType,
      marginPerLiter: marginNum,
      effectiveFrom: effectiveFrom, // store as YYYY-MM-DD
      effectiveTo: null,
      setBy: 'Admin',
      notes: notes || 'Manual update via Settings',
      createdAt: new Date().toISOString()
    };

    await handleUpdateDealerMargin(newSetting, undefined, stationId);
    onLogAudit('Settings', 'Update Dealer Margin', `Set ${productType} margin to Rs. ${marginNum} effective from ${effectiveFrom}`);
    
    setIsAdding(false);
    setMarginPerLiter('');
    setNotes('');
  };

  // Group settings by product
  const products = ['petrol', 'diesel', 'kerosene', 'ldo'];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
           <h3 className="text-sm font-bold text-slate-800 uppercase tracking-widest flex items-center gap-2">
             <DollarSign className="h-5 w-5 text-orange-600" />
             {t('OGRA Dealer Margins', 'ڈیلر مارجن کی ترتیبات', language)}
           </h3>
           <p className="text-xs text-slate-500 mt-1">
             {t('Manage government fixed dealer margins per liter. These values are used to calculate OMC Invoice Price and true profitability.', 'اوگرا کی طرف سے مقرر کردہ ڈیلر مارجن کو ترتیب دیں۔ یہ منافع کا حساب لگانے کے لیے استعمال ہوتا ہے۔', language)}
           </p>
        </div>
        <button
          onClick={() => setIsAdding(!isAdding)}
          className="flex items-center gap-1 bg-slate-800 hover:bg-slate-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-colors"
        >
          {isAdding ? <Activity className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
          {isAdding ? t('Cancel', 'منسوخ کریں', language) : t('Update Margin', 'نیا مارجن درج کریں', language)}
        </button>
      </div>

      {isAdding && (
        <form onSubmit={handleSave} className="bg-orange-50 border border-orange-100 rounded-xl p-4 animate-in slide-in-from-top-2">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">{t('Fuel Type', 'پراڈکٹ', language)} *</label>
              <select
                value={productType}
                onChange={(e) => setProductType(e.target.value)}
                className="w-full rounded border border-orange-200 px-3 py-2 text-sm bg-white outline-none focus:border-orange-500"
              >
                <option value="petrol">Petrol (PMG)</option>
                <option value="diesel">Diesel (HSD)</option>
                <option value="kerosene">Kerosene (SKO)</option>
                <option value="ldo">Light Diesel Oil (LDO)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">{t('Margin (Rs/Liter)', 'مارجن (روپے فی لیٹر)', language)} *</label>
              <input
                type="number"
                step="0.01"
                required
                value={marginPerLiter}
                onChange={(e) => setMarginPerLiter(e.target.value)}
                className="w-full rounded border border-orange-200 px-3 py-2 text-sm bg-white outline-none focus:border-orange-500"
                placeholder="e.g. 8.64"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">{t('Effective From', 'تاریخ نفاذ', language)} *</label>
              <input
                type="date"
                required
                value={effectiveFrom}
                onChange={(e) => setEffectiveFrom(e.target.value)}
                className="w-full rounded border border-orange-200 px-3 py-2 text-sm bg-white outline-none focus:border-orange-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">{t('Notification Ref / Notes', 'حوالہ جات', language)}</label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full rounded border border-orange-200 px-3 py-2 text-sm bg-white outline-none focus:border-orange-500"
                placeholder="e.g. OGRA Circular Aug 2024"
              />
            </div>
          </div>
          <div className="flex justify-end mt-4">
             <button type="submit" className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2.5 sm:py-2 min-h-[48px] sm:min-h-[40px] rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm">
               <Save className="h-3.5 w-3.5" />
               {t('Save New Margin Rate', 'محفوظ کریں', language)}
             </button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {products.map(prod => {
          const settingsForProd = dealerMarginSettings
            .filter(s => s.productType === prod)
            .sort((a, b) => new Date(b.effectiveFrom).getTime() - new Date(a.effectiveFrom).getTime());
            
          const currentMargin = settingsForProd.length > 0 ? settingsForProd[0].marginPerLiter : 0;
            
          return (
            <div key={prod} className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
               <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex justify-between items-center">
                 <h4 className="font-bold text-slate-800 uppercase">{prod}</h4>
                 <span className="text-xs font-bold bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-full">Current: Rs. {currentMargin.toFixed(2)}</span>
               </div>
               <div className="divide-y divide-slate-100 max-h-64 overflow-y-auto">
                 {settingsForProd.map(s => (
                   <div key={s.id} className="p-4 flex items-center justify-between hover:bg-slate-50">
                     <div>
                       <div className="font-bold text-slate-800 text-sm">Rs. {s.marginPerLiter.toFixed(2)}</div>
                       <div className="text-xs text-slate-500 mt-0.5">Effective: {s.effectiveFrom}</div>
                       {s.notes && <div className="text-[10px] text-slate-400 mt-1 italic">{s.notes}</div>}
                     </div>
                   </div>
                 ))}
                 {settingsForProd.length === 0 && (
                   <div className="p-4 text-center text-xs text-slate-400">No margin history found.</div>
                 )}
               </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
