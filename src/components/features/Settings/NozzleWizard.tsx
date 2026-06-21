import React, { useState } from 'react';
import { Plus, Check, X, Gauge, AlertTriangle } from 'lucide-react';
import { useStationStore } from '../../../stores/useStationStore';
import { Nozzle, Tank, Pump, Product } from '../../../types';
import { t } from '../../../lib/translations';

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

export default function NozzleWizard({
  nozzles, pumps, tanks, products, language,
  onAddNozzle, onDeleteNozzle, onUpdatePumps
}: NozzleWizardProps) {
  const [showForm, setShowForm] = useState(false);
  const [pumpName, setPumpName] = useState("Pump 1");
  const [name, setName] = useState("");
  const [tankId, setTankId] = useState(tanks.length > 0 ? tanks[0].id : "");
  const [startReading, setStartReading] = useState("");
  const showToast = useStationStore(state => state.showToast);

  const resetForm = () => {
    setName("");
    setTankId(tanks.length > 0 ? tanks[0].id : "");
    setStartReading("");
    setShowForm(false);
  };

  const handleAdd = () => {
    if (!pumpName) return showToast(t('Please enter a pump name', 'براہ کرم پمپ کا نام درج کریں', language), 'error');
    if (!name) return showToast(t('Please enter a nozzle name', 'براہ کرم نوزل کا نام درج کریں', language), 'error');
    if (!tankId) return showToast(t('Please select a tank', 'براہ کرم ٹینک منتخب کریں', language), 'error');
    if (!startReading && startReading !== "0") return showToast(t('Please enter an opening reading', 'براہ کرم ابتدائی ریڈنگ درج کریں', language), 'error');

    let targetPump = pumps.find(p => p.name.toLowerCase() === pumpName.trim().toLowerCase());
    const newPumps = [...pumps];
    
    if (!targetPump) {
      targetPump = {
        id: 'pump_' + Date.now() + '_' + crypto.randomUUID().split('-')[0],
        name: pumpName.trim(),
        nozzleCount: 0
      };
      newPumps.push(targetPump);
      if (onUpdatePumps) onUpdatePumps(newPumps);
    } else {
      targetPump = { ...targetPump, nozzleCount: (targetPump.nozzleCount || 0) + 1 };
      if (onUpdatePumps) {
        onUpdatePumps(newPumps.map(p => p.id === targetPump?.id ? targetPump : p));
      }
    }

    const selectedTank = tanks.find(t => t.id === tankId);
    
    const newNozzle: Nozzle = {
      id: 'nzl_' + Date.now() + '_' + crypto.randomUUID().split('-')[0],
      pumpId: targetPump.id,
      name,
      tankId,
      productId: selectedTank?.productId || '',
      startReading: Number(startReading),
      currentReading: Number(startReading)
    };

    onAddNozzle(newNozzle);
    
    // Auto-increment nozzle name for convenience if it's a number
    const numMatch = name.match(/(\d+)$/);
    if (numMatch) {
      const nextNum = parseInt(numMatch[1]) + 1;
      setName(name.replace(/\d+$/, nextNum.toString()));
    } else {
      setName("");
    }
    
    setStartReading("");
  };

  const getTankDetails = (tid: string) => {
    const tank = tanks.find((t) => t.id === tid);
    if (!tank) return null;
    const product = products.find((p) => p.id === tank.productId);
    return { tank, product };
  };

  return (
    <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-right-4 duration-500">
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
        
        <div className="p-6 md:p-8 space-y-8 flex-1">
          
          {!showForm ? (
            <button
              onClick={() => setShowForm(true)}
              className="w-full h-16 border-2 border-dashed border-slate-300 rounded-2xl flex items-center justify-center gap-3 text-slate-500 hover:text-purple-600 hover:border-purple-400 hover:bg-purple-50 transition-all font-bold cursor-pointer"
            >
              <Plus className="size-6" />
              {t('Add New Nozzle', 'نئی نوزل شامل کریں', language)}
            </button>
          ) : (
            <div className="border border-slate-200 rounded-2xl p-6 space-y-5 bg-slate-50 shadow-inner animate-in zoom-in-95 duration-200">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">{t('Pump Name', 'پمپ کا نام', language)}</label>
                  <input
                    className="w-full h-12 px-4 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors font-medium text-slate-800"
                    placeholder="Pump 1"
                    value={pumpName}
                    onChange={(e) => setPumpName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">{t('Nozzle Name/No', 'نوزل کا نام', language)}</label>
                  <input
                    className="w-full h-12 px-4 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors font-medium text-slate-800"
                    placeholder="Nozzle 1"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">{t('Link to Tank', 'ٹینک سے منسلک کریں', language)}</label>
                {tanks.length === 0 ? (
                  <div className="p-3 bg-orange-50 border border-orange-200 text-orange-700 rounded-xl text-sm flex items-center gap-2">
                    <AlertTriangle className="size-4 shrink-0" />
                    <span>{t("Please setup a tank first from the Tanks menu.", "براہ کرم پہلے ٹینکس مینو سے ایک ٹینک بنائیں۔", language)}</span>
                  </div>
                ) : (
                  <select 
                    className="w-full h-12 px-4 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors font-medium text-slate-800 appearance-none cursor-pointer"
                    value={tankId} 
                    onChange={(e) => setTankId(e.target.value)}
                  >
                    <option value="" disabled>{t("Select tank", "ٹینک منتخب کریں", language)}</option>
                    {tanks.map((tank) => (
                      <option key={tank.id} value={tank.id}>
                        {tank.name} ({getTankDetails(tank.id)?.product?.name || 'Unknown'})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">{t('Opening Reading', 'ابتدائی ریڈنگ', language)}</label>
                <input
                  type="number"
                  className="w-full h-12 px-4 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors font-medium text-slate-800"
                  placeholder="0.00"
                  value={startReading}
                  onChange={(e) => setStartReading(e.target.value)}
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button 
                  onClick={handleAdd} 
                  className="flex-1 h-12 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-bold transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-md"
                >
                  {t('Save Nozzle', 'محفوظ کریں', language)}
                </button>
                <button 
                  onClick={resetForm} 
                  className="flex-[0.4] h-12 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl font-bold transition-colors cursor-pointer"
                >
                  {t('Cancel', 'منسوخ کریں', language)}
                </button>
              </div>
            </div>
          )}

          {nozzles.length > 0 && (
            <div className="space-y-4">
              <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">
                {t('Configured Nozzles', 'ترتیب دی گئی نوزلز', language)}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {nozzles.map((nozzle, index) => {
                  const details = getTankDetails(nozzle.tankId || '');
                  const pump = pumps.find(p => p.id === nozzle.pumpId);
                  
                  return (
                    <div
                      key={nozzle.id}
                      className="border border-slate-200 bg-white shadow-sm rounded-2xl p-5 space-y-3 animate-in fade-in slide-in-from-left-4 transition-all hover:border-purple-300 hover:shadow-md"
                      style={{ animationDelay: `${index * 50}ms`, animationFillMode: 'both' }}
                    >
                      <div className="flex items-start justify-between">
                        <div className="space-y-1 flex-1">
                          <div className="flex items-center gap-3">
                            <div className="size-8 rounded-full bg-purple-100 flex items-center justify-center shrink-0">
                              <Gauge className="size-4 text-purple-600" />
                            </div>
                            <h4 className="font-bold text-lg text-slate-800">{nozzle.name} <span className="text-sm font-medium text-slate-500 ml-1">({pump?.name})</span></h4>
                          </div>
                          <div className="flex items-center gap-2 ml-11">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-white border border-slate-200 text-slate-600">
                              {details?.tank?.name}
                            </span>
                            <span className="text-slate-400 text-sm">•</span>
                            <span className="text-slate-600 text-sm font-medium">
                              {details?.product?.name}
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={() => onDeleteNozzle(nozzle.id)}
                          className="size-8 flex items-center justify-center rounded-xl hover:bg-red-100 text-slate-400 hover:text-red-600 transition-colors cursor-pointer"
                        >
                          <X className="size-4" />
                        </button>
                      </div>
                      <div className="ml-11 text-sm pt-3 border-t border-slate-100 mt-3">
                        <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">{t('Opening Reading', 'ابتدائی ریڈنگ', language)} </span>
                        <span className="font-black text-slate-700 ml-2">{Number(nozzle.startReading).toLocaleString()}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
