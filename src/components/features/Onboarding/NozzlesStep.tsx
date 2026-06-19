import React, { useState } from 'react';
import { Plus, Check, X, Gauge } from 'lucide-react';
import { t } from '../../../lib/translations';
import { Tank, Product, Nozzle, Pump } from '../../../types';

interface Props {
  nozzles: Nozzle[];
  pumps: Pump[];
  tanks: Tank[];
  products: Product[];
  onUpdate: (nozzles: Nozzle[], pumps: Pump[]) => void;
  onContinue: () => void;
  language: string;
}

export function NozzlesStep({ nozzles, pumps, tanks, products, onUpdate, onContinue, language }: Props) {
  const [showForm, setShowForm] = useState(false);
  const [pumpName, setPumpName] = useState("Pump 1");
  const [name, setName] = useState("");
  const [tankId, setTankId] = useState("");
  const [startReading, setStartReading] = useState("");

  const resetForm = () => {
    setName("");
    setTankId("");
    setStartReading("");
    setShowForm(false);
  };

  const addNozzle = () => {
    if (!pumpName || !name || !tankId || !startReading) return;

    let targetPump = pumps.find(p => p.name.toLowerCase() === pumpName.trim().toLowerCase());
    let newPumps = [...pumps];
    
    if (!targetPump) {
      targetPump = {
        id: 'pump_' + Date.now() + '_' + Math.floor(Math.random()*1000),
        name: pumpName.trim(),
        nozzleCount: 0
      };
      newPumps.push(targetPump);
    }

    const selectedTank = tanks.find(t => t.id === tankId);
    
    const newNozzle: Nozzle = {
      id: 'nzl_' + Date.now() + '_' + Math.floor(Math.random()*1000),
      pumpId: targetPump.id,
      name,
      tankId,
      productId: selectedTank?.productId || '',
      startReading: Number(startReading),
      currentReading: Number(startReading)
    };

    targetPump.nozzleCount = (targetPump.nozzleCount || 0) + 1;

    onUpdate([...nozzles, newNozzle], newPumps);
    
    // Auto-increment nozzle name for convenience if it's a number
    const numMatch = name.match(/(\d+)$/);
    if (numMatch) {
      const nextNum = parseInt(numMatch[1]) + 1;
      setName(name.replace(/\d+$/, nextNum.toString()));
    } else {
      setName("");
    }
    
    setStartReading("");
    // Keep form open for rapid entry
  };

  const removeNozzle = (id: string) => {
    const nozzleToRemove = nozzles.find(n => n.id === id);
    if (!nozzleToRemove) return;
    
    const newNozzles = nozzles.filter(n => n.id !== id);
    const newPumps = [...pumps];
    
    const targetPump = newPumps.find(p => p.id === nozzleToRemove.pumpId);
    if (targetPump && targetPump.nozzleCount) {
      targetPump.nozzleCount -= 1;
    }
    
    onUpdate(newNozzles, newPumps.filter(p => (p.nozzleCount || 0) > 0));
  };

  const getTankDetails = (tid: string) => {
    const tank = tanks.find((t) => t.id === tid);
    if (!tank) return null;
    const product = products.find((p) => p.id === tank.productId);
    return { tank, product };
  };

  return (
    <div className="flex items-center justify-center min-h-[80vh] p-4 animate-in fade-in slide-in-from-right-4 duration-500">
      <div className="max-w-2xl w-full bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden flex flex-col h-[85vh] max-h-[800px]">
        
        <div className="text-center border-b border-slate-100 p-6 md:p-8 shrink-0 bg-slate-50/50">
          <div className="flex justify-center mb-4">
            <div className="size-12 rounded-2xl bg-purple-100 flex items-center justify-center">
              <Gauge className="size-6 text-purple-600" />
            </div>
          </div>
          <h2 className="text-2xl font-black text-slate-800">
            {t('Add Nozzles', 'نوزلز شامل کریں', language)}
          </h2>
          <p className="text-slate-500 font-medium mt-2">
            {t('Configure dispenser nozzles and link to tanks', 'ڈسپنسر نوزلز کی ترتیب کریں اور ٹینکس سے منسلک کریں', language)}
          </p>
        </div>

        <div className="p-6 md:p-8 space-y-8 overflow-y-auto flex-1 custom-scrollbar">
          
          {!showForm ? (
            <button
              onClick={() => setShowForm(true)}
              className="w-full h-16 border-2 border-dashed border-slate-300 rounded-2xl flex items-center justify-center gap-3 text-slate-500 hover:text-purple-600 hover:border-purple-400 hover:bg-purple-50 transition-all font-bold cursor-pointer"
            >
              <Plus className="size-6" />
              {t('Add New Nozzle', 'نئی نوزل شامل کریں', language)}
            </button>
          ) : (
            <div className="border border-slate-200 rounded-2xl p-6 space-y-5 bg-slate-50/50 shadow-sm animate-in zoom-in-95 duration-200">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
                  onClick={addNozzle} 
                  disabled={!pumpName || !name || !tankId || !startReading}
                  className="flex-1 h-12 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-bold transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-md"
                >
                  {t('Save & Add Another', 'محفوظ کریں اور مزید شامل کریں', language)}
                </button>
                <button 
                  onClick={resetForm} 
                  className="flex-[0.4] h-12 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl font-bold transition-colors cursor-pointer"
                >
                  {t('Done', 'مکمل', language)}
                </button>
              </div>
            </div>
          )}

          {nozzles.length > 0 && (
            <div className="space-y-4">
              <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">
                {t('Configured Nozzles', 'ترتیب دی گئی نوزلز', language)}
              </p>
              <div className="space-y-3">
                {nozzles.map((nozzle, index) => {
                  const details = getTankDetails(nozzle.tankId || '');
                  const pump = pumps.find(p => p.id === nozzle.pumpId);
                  
                  return (
                    <div
                      key={nozzle.id}
                      className="border border-purple-200 bg-purple-50/50 rounded-2xl p-5 space-y-3 animate-in fade-in slide-in-from-left-4"
                      style={{ animationDelay: `${index * 50}ms`, animationFillMode: 'both' }}
                    >
                      <div className="flex items-start justify-between">
                        <div className="space-y-1 flex-1">
                          <div className="flex items-center gap-3">
                            <div className="size-6 rounded-full bg-purple-200 flex items-center justify-center shrink-0">
                              <Check className="size-4 text-purple-700" />
                            </div>
                            <h4 className="font-bold text-lg text-slate-800">{nozzle.name} <span className="text-sm font-medium text-slate-500 ml-2">({pump?.name})</span></h4>
                          </div>
                          <div className="flex items-center gap-2 ml-9">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-white border border-purple-200 text-purple-700">
                              {details?.tank?.name}
                            </span>
                            <span className="text-slate-400 text-sm">•</span>
                            <span className="text-slate-600 text-sm font-medium">
                              {details?.product?.name}
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={() => removeNozzle(nozzle.id)}
                          className="size-10 flex items-center justify-center rounded-xl hover:bg-red-100 text-slate-400 hover:text-red-600 transition-colors cursor-pointer"
                        >
                          <X className="size-5" />
                        </button>
                      </div>
                      <div className="ml-9 text-sm pt-2 border-t border-purple-100/50">
                        <span className="text-slate-500 font-medium">{t('Opening Reading:', 'ابتدائی ریڈنگ:', language)} </span>
                        <span className="font-bold text-slate-700">{Number(nozzle.startReading).toLocaleString()}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

        </div>

        <div className="p-6 border-t border-slate-100 bg-white shrink-0">
          <button
            onClick={onContinue}
            disabled={nozzles.length === 0}
            className="w-full py-4 bg-orange-600 hover:bg-orange-700 text-white rounded-xl font-black text-lg transition-all shadow-lg hover:shadow-orange-600/30 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none disabled:hover:scale-100 cursor-pointer"
          >
            {t('Continue', 'جاری رکھیں', language)}
          </button>
        </div>
        
      </div>
    </div>
  );
}
