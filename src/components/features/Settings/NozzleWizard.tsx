import React, { useState } from 'react';
import {
  ChevronRight, ArrowLeft, Trash2, Edit, CheckCircle, Fuel, Plus
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
}

// Fuel configuration — shared with TankWizard pattern
const FUEL_CONFIG: Record<string, {
  label: string; urdu: string; color: string; bg: string;
  border: string; icon: string; badgeBg: string; badgeText: string;
  headerBg: string; ring: string;
}> = {
  petrol: {
    label: 'Petrol (PMG)', urdu: 'پیٹرول',
    color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-400',
    icon: '⛽', badgeBg: 'bg-emerald-100', badgeText: 'text-emerald-800',
    headerBg: 'bg-emerald-600', ring: 'ring-emerald-500'
  },
  diesel: {
    label: 'Diesel (HSD)', urdu: 'ڈیزل',
    color: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-400',
    icon: '🛢️', badgeBg: 'bg-blue-100', badgeText: 'text-blue-800',
    headerBg: 'bg-blue-600', ring: 'ring-blue-500'
  },
  hobc: {
    label: 'HOBC (High Octane)', urdu: 'ہائی اوکٹین',
    color: 'text-orange-700', bg: 'bg-orange-50', border: 'border-orange-400',
    icon: '🔥', badgeBg: 'bg-orange-100', badgeText: 'text-orange-800',
    headerBg: 'bg-orange-600', ring: 'ring-orange-500'
  },
  cng: {
    label: 'CNG (Gas)', urdu: 'سی این جی',
    color: 'text-purple-700', bg: 'bg-purple-50', border: 'border-purple-400',
    icon: '💨', badgeBg: 'bg-purple-100', badgeText: 'text-purple-800',
    headerBg: 'bg-purple-600', ring: 'ring-purple-500'
  },
  other: {
    label: 'Other', urdu: 'دیگر',
    color: 'text-slate-700', bg: 'bg-slate-50', border: 'border-slate-400',
    icon: '🏭', badgeBg: 'bg-slate-100', badgeText: 'text-slate-800',
    headerBg: 'bg-slate-600', ring: 'ring-slate-500'
  }
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
  onAddNozzle, onUpdateNozzle, onDeleteNozzle, onLogAudit
}: NozzleWizardProps) {
  const { showConfirm, showToast } = useStation();
  const t = (en: string, ur: string) => translate(en, ur, language);

  const [wizardStep, setWizardStep] = useState<number>(1);
  const [editingNozzle, setEditingNozzle] = useState<Nozzle | null>(null);
  const [showForm, setShowForm] = useState<boolean>(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const [nozzleForm, setNozzleForm] = useState({
    name: '',
    pumpId: pumps[0]?.id || '',
    productId: '',
    tankId: '',
    startReading: 150000,
    currentReading: 150000
  });

  const clearErrors = () => setFieldErrors({});
  const selectedProduct = products.find(p => p.id === nozzleForm.productId);
  const fuelCfg = getFuelConfig(selectedProduct);
  const matchingTanks = tanks.filter(t => t.productId === nozzleForm.productId);

  const handleOpenAdd = (productId?: string) => {
    clearErrors();
    setEditingNozzle(null);
    const pid = productId || '';
    const autoTankId = pid ? (tanks.find(t => t.productId === pid)?.id || '') : '';
    setNozzleForm({
      name: 'Nozzle ' + (nozzles.length + 1),
      pumpId: pumps[0]?.id || '',
      productId: pid,
      tankId: autoTankId,
      startReading: 150000,
      currentReading: 150000
    });
    setWizardStep(productId ? 2 : 1);
    setShowForm(true);
  };

  const handleOpenEdit = (nz: Nozzle) => {
    clearErrors();
    setEditingNozzle(nz);
    setNozzleForm({
      name: nz.name,
      pumpId: nz.pumpId,
      productId: nz.productId,
      tankId: nz.tankId || (tanks.find(t => t.productId === nz.productId)?.id || ''),
      startReading: nz.startReading || 0,
      currentReading: nz.currentReading || 0
    });
    setWizardStep(1);
    setShowForm(true);
  };

  const validate = (step: number): boolean => {
    const errs: Record<string, string> = {};
    if (step === 1 && !nozzleForm.productId) errs.productId = t('Please select a fuel type!', 'براہ کرم فیول کی قسم منتخب کریں!');
    if (step === 2 && !nozzleForm.tankId) errs.tankId = t('Please select a storage tank!', 'براہ کرم اسٹوریج ٹینک منتخب کریں!');
    if (step === 3 && !nozzleForm.pumpId) errs.pumpId = t('Please select a pump!', 'براہ کرم پمپ منتخب کریں!');
    if (step === 4 && !nozzleForm.name.trim()) errs.name = t('Nozzle name is required.', 'نوزل کا نام ضروری ہے۔');
    if (step === 5 && (nozzleForm.startReading < 0 || nozzleForm.currentReading < 0)) {
      errs.readings = t('Meter readings cannot be negative!', 'میٹر ریڈنگ منفی نہیں ہو سکتی!');
    }
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleNextStep = () => { if (validate(wizardStep)) setWizardStep(p => p + 1); };
  const handlePrevStep = () => { clearErrors(); setWizardStep(p => Math.max(1, p - 1)); };

  const handleSaveNozzle = () => {
    if (editingNozzle) {
      onUpdateNozzle({
        ...editingNozzle,
        name: nozzleForm.name, pumpId: nozzleForm.pumpId,
        productId: nozzleForm.productId, tankId: nozzleForm.tankId,
        startReading: Number(nozzleForm.startReading),
        currentReading: Number(nozzleForm.currentReading)
      });
      onLogAudit('Nozzle', 'Update', `Nozzle "${nozzleForm.name}" (ID: ${editingNozzle.id}) updated.`);
    } else {
      const newNz: Nozzle = {
        id: 'nz_' + Date.now(), name: nozzleForm.name, pumpId: nozzleForm.pumpId,
        productId: nozzleForm.productId, tankId: nozzleForm.tankId,
        startReading: Number(nozzleForm.startReading), currentReading: Number(nozzleForm.currentReading)
      };
      onAddNozzle(newNz);
      onLogAudit('Nozzle', 'Create', `New nozzle "${nozzleForm.name}" registered under pump ${nozzleForm.pumpId} & tank ${nozzleForm.tankId}.`);
    }
    setShowForm(false);
    clearErrors();
    showToast(t('Nozzle registered successfully!', 'نوزل کامیابی سے محفوظ ہو گئی!'), 'success');
  };

  const handleDeleteNozzleRecord = (id: string) => {
    showConfirm(
      t('Confirm Nozzle Deletion', 'نوزل حذف کرنے کی تصدیق'),
      t('Delete this nozzle? Shift logs may be affected.', 'اس نوزل کو حذف کریں؟ شفٹ لاگز متاثر ہو سکتے ہیں۔'),
      () => {
        const nz = nozzles.find(n => n.id === id);
        onDeleteNozzle(id);
        onLogAudit('Nozzle', 'Delete', `Nozzle "${nz?.name}" (ID: ${id}) deleted.`);
        showToast(t('Nozzle removed.', 'نوزل حذف کر دی گئی۔'), 'success');
      }
    );
  };

  const totalSteps = 6;

  // ─── WIZARD ──────────────────────────────────────────────────
  const renderWizardForm = () => (
    <div className="rounded-2xl border-2 border-slate-200 bg-white shadow-lg overflow-hidden">
      {/* Colored header */}
      <div className={`${selectedProduct ? fuelCfg.headerBg : 'bg-slate-700'} px-5 py-4`}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-white/70 text-[10px] font-mono uppercase tracking-widest">
              {editingNozzle ? t('EDITING NOZZLE', 'نوزل ایڈٹ') : t('NEW NOZZLE SETUP', 'نئی نوزل')}
            </p>
            <h4 className="text-white font-sans text-sm font-black mt-0.5 flex items-center gap-2">
              <Fuel className="h-4 w-4" />
              {editingNozzle ? t('Modify Nozzle Config', 'نوزل ترتیب تبدیل کریں') : t('Register New Nozzle', 'نئی نوزل رجسٹر کریں')}
            </h4>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] bg-white/20 text-white px-2.5 py-1 rounded-full font-sans font-bold">
              {t(`Step ${wizardStep} / ${totalSteps}`, `مرحلہ ${wizardStep} / ${totalSteps}`)}
            </span>
            <button onClick={() => { setShowForm(false); clearErrors(); }} className="text-white/60 hover:text-white text-lg leading-none font-bold">×</button>
          </div>
        </div>
        {/* Progress */}
        <div className="mt-3 flex gap-1">
          {Array.from({ length: totalSteps }, (_, i) => (
            <div key={i} className={`h-1 flex-1 rounded-full transition-all ${wizardStep > i ? 'bg-white' : 'bg-white/25'}`} />
          ))}
        </div>
      </div>

      <div className="p-5 space-y-5">
        {/* STEP 1: FUEL TYPE */}
        {wizardStep === 1 && (
          <div className="space-y-4">
            <div>
              <h5 className="font-sans text-xs font-black text-slate-700 uppercase tracking-widest mb-0.5">{t('Step 1: Select Fuel Type', 'مرحلہ 1: فیول کی قسم')}</h5>
              <p className="text-slate-400 text-[11px]">{t('Which type of fuel will this nozzle dispense?', 'یہ نوزل کس قسم کا فیول فراہم کرے گی؟')}</p>
            </div>
            {products.length === 0 ? (
              <div className="p-6 text-center border-2 border-dashed border-slate-200 rounded-xl text-slate-400 text-xs">
                {t('No fuel products configured. Add products in Accounts tab first.', 'کوئی پراڈکٹ نہیں۔ پہلے اکاؤنٹس ٹیب میں پراڈکٹ بنائیں۔')}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {products.map(p => {
                  const cfg = getFuelConfig(p);
                  const isSelected = nozzleForm.productId === p.id;
                  return (
                    <button
                      key={p.id} type="button"
                      onClick={() => {
                        clearErrors();
                        const autoTank = tanks.find(tk => tk.productId === p.id)?.id || '';
                        setNozzleForm(prev => ({ ...prev, productId: p.id, tankId: autoTank }));
                      }}
                      className={`relative p-4 rounded-xl border-2 text-left transition-all ${isSelected ? `${cfg.border} ${cfg.bg} shadow-md` : 'border-slate-200 hover:border-slate-300 bg-white'}`}
                    >
                      {isSelected && <CheckCircle className={`absolute top-2.5 right-2.5 h-4 w-4 ${cfg.color}`} />}
                      <span className="text-2xl block mb-2">{cfg.icon}</span>
                      <strong className={`block font-sans text-sm font-black ${isSelected ? cfg.color : 'text-slate-700'}`}>{t(cfg.label, cfg.urdu)}</strong>
                      <span className="block text-[10px] text-slate-400 mt-0.5 font-mono">{t(p.name, p.urduName)} · Rs. {p.rate?.toFixed(2)}/L</span>
                    </button>
                  );
                })}
              </div>
            )}
            {fieldErrors.productId && <p className="text-red-500 text-[11px] font-bold mt-1">⚠ {fieldErrors.productId}</p>}
          </div>
        )}

        {/* STEP 2: TANK */}
        {wizardStep === 2 && (
          <div className="space-y-4">
            <div>
              <h5 className="font-sans text-xs font-black text-slate-700 uppercase tracking-widest mb-0.5">{t('Step 2: Link Storage Tank', 'مرحلہ 2: اسٹوریج ٹینک لنک کریں')}</h5>
              <p className="text-slate-400 text-[11px]">{t('Select which tank supplies fuel to this nozzle.', 'کون سا ٹینک اس نوزل کو فیول فراہم کرتا ہے؟')}</p>
            </div>
            {matchingTanks.length === 0 ? (
              <div className={`p-5 border-2 border-dashed ${fuelCfg.border} rounded-xl ${fuelCfg.bg} text-center text-xs text-slate-500 leading-relaxed`}>
                {t(`No ${selectedProduct?.name || 'fuel'} tanks found. Please configure tanks first.`, `کوئی ٹینک نہیں ملا۔ پہلے ٹینکس سیٹ اپ کریں۔`)}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {matchingTanks.map(tk => {
                  const isSelected = nozzleForm.tankId === tk.id;
                  const fillPct = tk.capacity > 0 ? Math.round((tk.currentStock / tk.capacity) * 100) : 0;
                  return (
                    <button
                      key={tk.id} type="button"
                      onClick={() => { clearErrors(); setNozzleForm(p => ({ ...p, tankId: tk.id })); }}
                      className={`p-4 rounded-xl border-2 text-left transition-all ${isSelected ? `${fuelCfg.border} ${fuelCfg.bg} shadow-md` : 'border-slate-200 hover:border-slate-300 bg-white'}`}
                    >
                      {isSelected && <CheckCircle className={`float-right h-4 w-4 ${fuelCfg.color}`} />}
                      <strong className={`block font-sans text-xs font-black ${isSelected ? fuelCfg.color : 'text-slate-700'} uppercase`}>{tk.physicalLabel || tk.name}</strong>
                      <span className="block text-[10px] text-slate-500 mt-0.5">{tk.name}</span>
                      <div className="mt-2 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                        <div style={{ width: `${fillPct}%` }} className={`h-full rounded-full bg-gradient-to-r ${isSelected ? 'from-current' : 'from-slate-400 to-slate-300'}`} />
                      </div>
                      <span className="text-[10px] font-mono font-bold text-slate-500 mt-1 block">{tk.currentStock.toLocaleString()} L · {fillPct}%</span>
                    </button>
                  );
                })}
              </div>
            )}
            {fieldErrors.tankId && <p className="text-red-500 text-[11px] font-bold mt-1">⚠ {fieldErrors.tankId}</p>}
          </div>
        )}

        {/* STEP 3: PUMP */}
        {wizardStep === 3 && (
          <div className="space-y-4">
            {/* Header */}
            <div className="space-y-1">
              <h5 className="font-sans text-xs font-black text-slate-700 uppercase tracking-widest">
                {t('Step 3: Choose Pump Machine', 'مرحلہ 3: پمپ مشین منتخب کریں')}
              </h5>
              <p className="text-slate-500 text-[11px] leading-relaxed">
                {t(
                  'A pump machine is the physical dispenser unit standing at your forecourt. Each machine can have 2 or 4 nozzle outlets. Choose which machine this nozzle hose is attached to.',
                  'پمپ مشین وہ ڈسپنسر ہے جو فلنگ اسٹیشن پر کھڑی ہوتی ہے۔ ہر مشین میں 2 یا 4 نوزل نکاس ہوتے ہیں۔ منتخب کریں کہ یہ نوزل کس مشین سے جڑی ہے۔'
                )}
              </p>
            </div>

            {/* Visual guide */}
            <div className="flex items-start gap-2 bg-blue-50 border border-blue-200 rounded-xl px-3 py-2.5">
              <span className="text-base shrink-0">💡</span>
              <p className="text-[11px] text-blue-800 font-medium leading-snug">
                {t(
                  'Not sure which pump? Look at the pump number painted on the machine, e.g. "Pump 1", "Pump 2".',
                  'یقین نہیں؟ مشین پر لکھا نمبر دیکھیں، مثلاً "پمپ 1"، "پمپ 2"۔'
                )}
              </p>
            </div>

            {pumps.length === 0 ? (
              <div className="p-6 text-center border-2 border-dashed border-slate-200 rounded-xl text-slate-400 text-xs">
                {t('No pump machines configured. Add pumps in Settings first.', 'کوئی پمپ مشین نہیں۔ پہلے سیٹنگز میں پمپ شامل کریں۔')}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {pumps.map((p, idx) => {
                  const isSelected = nozzleForm.pumpId === p.id;
                  // Count nozzles already on this pump
                  const existingNozzles = nozzles.filter(nz => nz.pumpId === p.id);
                  const maxNozzles = p.nozzleCount || 4;
                  const slotsUsed = existingNozzles.length;
                  const slotsLeft = Math.max(0, maxNozzles - slotsUsed);
                  const isFull = slotsLeft === 0;
                  // Group existing nozzles by fuel type
                  const fuelTypes = [...new Set(
                    existingNozzles
                      .map(nz => products.find(pr => pr.id === nz.productId))
                      .filter(Boolean)
                      .map(pr => getFuelType(pr!))
                  )];

                  return (
                    <button
                      key={p.id} type="button"
                      disabled={isFull}
                      onClick={() => { clearErrors(); setNozzleForm(prev => ({ ...prev, pumpId: p.id })); }}
                      className={`relative p-4 rounded-xl border-2 text-left transition-all w-full
                        ${isFull ? 'opacity-50 cursor-not-allowed border-slate-200 bg-slate-50' :
                          isSelected
                            ? `${fuelCfg.border} ${fuelCfg.bg} shadow-md ring-2 ${fuelCfg.ring} ring-offset-1`
                            : 'border-slate-200 hover:border-slate-400 hover:shadow-sm bg-white cursor-pointer'
                        }`}
                    >
                      {/* Selected tick */}
                      {isSelected && !isFull && (
                        <CheckCircle className={`absolute top-3 right-3 h-4 w-4 ${fuelCfg.color}`} />
                      )}
                      {isFull && (
                        <span className="absolute top-3 right-3 text-[9px] font-black text-red-500 bg-red-50 border border-red-200 px-1.5 py-0.5 rounded-full">
                          {t('FULL', 'مکمل')}
                        </span>
                      )}

                      {/* Pump icon + name */}
                      <div className="flex items-center gap-2.5 mb-3">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg font-black shrink-0
                          ${isSelected ? fuelCfg.bg + ' border-2 ' + fuelCfg.border : 'bg-slate-100 border-2 border-slate-200'}`}>
                          {idx + 1}
                        </div>
                        <div>
                          <strong className={`block font-sans text-sm font-black ${isSelected ? fuelCfg.color : 'text-slate-800'}`}>
                            {p.name}
                          </strong>
                          <span className="block text-[10px] text-slate-400 font-mono">
                            {t('Station position', 'اسٹیشن پوزیشن')} #{idx + 1}
                          </span>
                        </div>
                      </div>

                      {/* Nozzle slot bar */}
                      <div className="mb-2">
                        <div className="flex items-center justify-between text-[10px] mb-1">
                          <span className="text-slate-500 font-semibold">{t('Nozzle slots', 'نوزل سلاٹس')}</span>
                          <span className={`font-black font-mono ${isFull ? 'text-red-500' : isSelected ? fuelCfg.color : 'text-slate-700'}`}>
                            {slotsUsed} / {maxNozzles} {t('used', 'استعمال')}
                          </span>
                        </div>
                        <div className="flex gap-1">
                          {Array.from({ length: maxNozzles }, (_, i) => (
                            <div key={i} className={`flex-1 h-2.5 rounded-sm border transition-all
                              ${i < slotsUsed
                                ? (isSelected ? fuelCfg.bg + ' border-current' : 'bg-slate-300 border-slate-400')
                                : 'bg-white border-dashed border-slate-300'
                              }`}
                            />
                          ))}
                        </div>
                        <div className="flex gap-1 mt-0.5">
                          {Array.from({ length: maxNozzles }, (_, i) => (
                            <div key={i} className="flex-1 text-center text-[8px] text-slate-400 font-mono">
                              {i + 1}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Existing fuel types on this pump */}
                      {fuelTypes.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2 pt-2 border-t border-slate-100">
                          <span className="text-[9px] text-slate-400 font-semibold uppercase self-center">{t('Fuels:', 'فیول:')}</span>
                          {fuelTypes.map(ft => (
                            <span key={ft} className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${FUEL_CONFIG[ft].badgeBg} ${FUEL_CONFIG[ft].badgeText}`}>
                              {FUEL_CONFIG[ft].icon} {t(FUEL_CONFIG[ft].label, FUEL_CONFIG[ft].urdu)}
                            </span>
                          ))}
                        </div>
                      )}
                      {slotsLeft > 0 && !isFull && (
                        <p className="text-[10px] text-emerald-600 font-bold mt-2">
                          ✓ {slotsLeft} {t('slot(s) available', 'سلاٹ دستیاب')}
                        </p>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
            {fieldErrors.pumpId && <p className="text-red-500 text-[11px] font-bold mt-1">⚠ {fieldErrors.pumpId}</p>}
          </div>
        )}

        {/* STEP 4: NAME */}
        {wizardStep === 4 && (
          <div className="space-y-4">
            <div>
              <h5 className="font-sans text-xs font-black text-slate-700 uppercase tracking-widest mb-0.5">{t('Step 4: Nozzle Name & Position', 'مرحلہ 4: نوزل کا نام اور پوزیشن')}</h5>
              <p className="text-slate-400 text-[11px]">{t('Enter a clear label for this nozzle position.', 'اس نوزل کی پوزیشن کے لیے واضح نام درج کریں۔')}</p>
            </div>
            <div className={`flex items-center gap-2 p-3 rounded-xl ${fuelCfg.bg} border ${fuelCfg.border}`}>
              <span className="text-lg">{fuelCfg.icon}</span>
              <div className="text-xs">
                <span className={`font-bold uppercase tracking-widest text-[9px] ${fuelCfg.color}`}>{t('Fuel Type', 'فیول')}</span>
                <strong className={`block font-black ${fuelCfg.color}`}>{selectedProduct ? t(selectedProduct.name, selectedProduct.urduName) : '—'}</strong>
              </div>
              <div className="ml-auto text-xs text-right">
                <span className="text-slate-400 text-[9px] uppercase tracking-wider block">Tank</span>
                <strong className="text-slate-700 font-mono">{tanks.find(tk => tk.id === nozzleForm.tankId)?.physicalLabel || '—'}</strong>
              </div>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">{t('Nozzle Display Name / Position Label:', 'نوزل کا نام / پوزیشن لیبل:')}</label>
              <input
                type="text"
                placeholder={t('e.g. Nozzle 1A / Petrol Left Side', 'مثلاً: نوزل 1A / پیٹرول بائیں طرف')}
                value={nozzleForm.name}
                onChange={e => { setNozzleForm(p => ({ ...p, name: e.target.value })); clearErrors(); }}
                className={`w-full rounded-xl border ${fieldErrors.name ? 'border-red-400 bg-red-50' : 'border-slate-200'} px-3 py-2.5 text-xs font-sans outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20`}
              />
              {fieldErrors.name && <p className="text-red-500 text-[10px] font-bold mt-1">⚠ {fieldErrors.name}</p>}
            </div>
          </div>
        )}

        {/* STEP 5: METER READINGS */}
        {wizardStep === 5 && (
          <div className="space-y-4">
            <div>
              <h5 className="font-sans text-xs font-black text-slate-700 uppercase tracking-widest mb-0.5">{t('Step 5: Meter Readings', 'مرحلہ 5: میٹر ریڈنگ')}</h5>
              <p className="text-slate-400 text-[11px]">{t('Enter the opening and current meter wheel readings for this nozzle.', 'اس نوزل کی ابتدائی اور موجودہ میٹر ریڈنگ درج کریں۔')}</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">{t('Opening Meter Reading (L):', 'ابتدائی میٹر ریڈنگ (L):')}</label>
                <input
                  type="number" min={0}
                  value={nozzleForm.startReading}
                  onChange={e => setNozzleForm(p => ({ ...p, startReading: Number(e.target.value), currentReading: Number(e.target.value) }))}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-mono font-bold outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">{t('Current Active Meter (L):', 'موجودہ میٹر ریڈنگ (L):')}</label>
                <input
                  type="number" min={0}
                  value={nozzleForm.currentReading}
                  onChange={e => setNozzleForm(p => ({ ...p, currentReading: Number(e.target.value) }))}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-mono font-bold outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
                />
              </div>
            </div>
            {fieldErrors.readings && <p className="text-red-500 text-[11px] font-bold">⚠ {fieldErrors.readings}</p>}
            <div className="bg-slate-50 rounded-xl p-3 text-[11px] text-slate-500 font-sans">
              {t('Total dispensed since installation:', 'تنصیب کے بعد سے کل فراہمی:')}{' '}
              <strong className="font-mono text-slate-800">{(nozzleForm.currentReading - nozzleForm.startReading).toLocaleString()} L</strong>
            </div>
          </div>
        )}

        {/* STEP 6: REVIEW */}
        {wizardStep === 6 && (
          <div className="space-y-4">
            <div>
              <h5 className="font-sans text-xs font-black text-emerald-700 uppercase tracking-widest mb-0.5">{t('Step 6: Review & Register', 'مرحلہ 6: جائزہ اور رجسٹریشن')}</h5>
              <p className="text-slate-400 text-[11px]">{t('Confirm nozzle configuration before saving.', 'محفوظ کرنے سے پہلے نوزل کی ترتیب کا جائزہ لیں۔')}</p>
            </div>

            <div className={`rounded-xl border-2 ${fuelCfg.border} ${fuelCfg.bg} p-4 space-y-3`}>
              <div className="flex items-center gap-3">
                <div className={`h-12 w-12 rounded-xl ${fuelCfg.headerBg} flex items-center justify-center text-white text-xl shrink-0`}>
                  {fuelCfg.icon}
                </div>
                <div>
                  <strong className={`font-sans text-sm font-black ${fuelCfg.color}`}>{nozzleForm.name}</strong>
                  <span className={`block text-[10px] font-mono ${fuelCfg.color} opacity-70`}>{selectedProduct ? t(selectedProduct.name, selectedProduct.urduName) : '—'}</span>
                </div>
                <span className={`ml-auto text-[9px] font-black px-2 py-0.5 rounded-full ${fuelCfg.badgeBg} ${fuelCfg.badgeText} uppercase`}>Active</span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px] border-t border-white/50 pt-3">
                {[
                  { label: t('Fuel Type', 'فیول'), value: selectedProduct ? t(selectedProduct.name, selectedProduct.urduName) : '—' },
                  { label: t('Storage Tank', 'ٹینک'), value: tanks.find(tk => tk.id === nozzleForm.tankId)?.physicalLabel || '—' },
                  { label: t('Pump', 'پمپ'), value: pumps.find(p => p.id === nozzleForm.pumpId)?.name || '—' },
                  { label: t('Opening Meter', 'ابتدائی میٹر'), value: `${nozzleForm.startReading.toLocaleString()} L` },
                  { label: t('Current Meter', 'موجودہ میٹر'), value: `${nozzleForm.currentReading.toLocaleString()} L` },
                  { label: t('Dispensed', 'فراہم'), value: `${(nozzleForm.currentReading - nozzleForm.startReading).toLocaleString()} L` },
                ].map(({ label, value }) => (
                  <div key={label} className="bg-white/60 rounded-lg px-3 py-2">
                    <span className="text-slate-400 text-[9px] uppercase tracking-wider block">{label}</span>
                    <strong className={`font-mono font-bold text-xs ${fuelCfg.color}`}>{value}</strong>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* NAV */}
        <div className="flex justify-between border-t border-slate-100 pt-4">
          <button type="button" disabled={wizardStep === 1} onClick={handlePrevStep}
            className={`px-4 py-2 font-sans text-xs font-bold rounded-xl flex items-center gap-1.5 ${wizardStep === 1 ? 'bg-slate-50 text-slate-300 cursor-not-allowed' : 'bg-slate-100 text-slate-600 hover:bg-slate-200 cursor-pointer'}`}
          >
            <ArrowLeft className="h-3.5 w-3.5" /> {t('Back', 'پیچھے')}
          </button>
          {wizardStep < totalSteps ? (
            <button type="button" onClick={handleNextStep}
              className={`px-5 py-2 text-white font-sans text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-sm cursor-pointer ${selectedProduct ? `${fuelCfg.headerBg} hover:opacity-90` : 'bg-orange-600 hover:bg-orange-700'}`}
            >
              {t('Continue', 'آگے')} <ChevronRight className="h-3.5 w-3.5" />
            </button>
          ) : (
            <button type="button" onClick={handleSaveNozzle}
              className={`px-6 py-2 text-white font-sans text-xs font-extrabold rounded-xl flex items-center gap-1.5 shadow-md cursor-pointer ${selectedProduct ? `${fuelCfg.headerBg} hover:opacity-90` : 'bg-emerald-600 hover:bg-emerald-700'}`}
            >
              <CheckCircle className="h-4 w-4" />
              {editingNozzle ? t('UPDATE NOZZLE', 'نوزل اپ ڈیٹ کریں') : t('REGISTER NOZZLE', 'نوزل محفوظ کریں')}
            </button>
          )}
        </div>
      </div>
    </div>
  );

  // ─── NOZZLE CARD ───────────────────────────────────────────────
  const renderNozzleCard = (nz: Nozzle) => {
    const linkedTank = tanks.find(t => t.id === nz.tankId);
    const linkedPump = pumps.find(p => p.id === nz.pumpId);
    const linkedProd = products.find(p => p.id === nz.productId);
    const cfg = getFuelConfig(linkedProd);

    return (
      <div key={nz.id} className={`rounded-xl border-2 ${cfg.border} bg-white shadow-sm hover:shadow-md transition-all overflow-hidden`}>
        <div className={`${cfg.headerBg} px-4 py-2.5 flex items-center justify-between`}>
          <strong className="text-white font-sans text-xs font-black">{nz.name}</strong>
          <span className={`text-[9px] font-black px-2 py-0.5 rounded-full bg-white/20 text-white uppercase`}>
            {linkedProd ? t(linkedProd.name, linkedProd.urduName).split(' ')[0] : 'Fuel'}
          </span>
        </div>
        <div className="p-3 space-y-2">
          <div className="grid grid-cols-2 gap-1.5 text-[10px] font-sans text-slate-600">
            <div className="bg-slate-50 rounded-lg px-2.5 py-1.5">
              <span className="text-slate-400 text-[9px] block uppercase tracking-wider">Tank</span>
              <strong className="font-mono text-slate-700">{linkedTank?.physicalLabel || 'N/A'}</strong>
            </div>
            <div className="bg-slate-50 rounded-lg px-2.5 py-1.5">
              <span className="text-slate-400 text-[9px] block uppercase tracking-wider">Pump</span>
              <strong className="text-slate-700">{linkedPump?.name || 'Unknown'}</strong>
            </div>
            <div className="bg-slate-50 rounded-lg px-2.5 py-1.5">
              <span className="text-slate-400 text-[9px] block uppercase tracking-wider">Opening</span>
              <strong className="font-mono text-slate-700">{(nz.startReading || 0).toLocaleString()} L</strong>
            </div>
            <div className="bg-emerald-50 rounded-lg px-2.5 py-1.5">
              <span className="text-emerald-600 text-[9px] block uppercase tracking-wider">Current</span>
              <strong className="font-mono text-emerald-700">{(nz.currentReading || 0).toLocaleString()} L</strong>
            </div>
          </div>
          <div className="flex justify-end gap-2 border-t border-slate-100 pt-2">
            <button onClick={() => handleOpenEdit(nz)}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-200 bg-white text-slate-600 hover:border-orange-400 hover:text-orange-600 font-sans text-[10px] font-bold transition-all cursor-pointer"
            >
              <Edit className="h-3 w-3" /> {t('Edit', 'ترمیم')}
            </button>
            <button onClick={() => handleDeleteNozzleRecord(nz.id)}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg border border-red-100 bg-red-50 text-red-600 hover:bg-red-100 font-sans text-[10px] font-bold transition-all cursor-pointer"
            >
              <Trash2 className="h-3 w-3" /> {t('Delete', 'حذف')}
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Group nozzles by fuel product type
  const nozzleGroups = products.map(p => ({
    product: p,
    cfg: getFuelConfig(p),
    nozzleList: nozzles.filter(n => n.productId === p.id)
  })).filter(g => g.nozzleList.length > 0);

  const ungroupedNozzles = nozzles.filter(n => !products.find(p => p.id === n.productId));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between bg-slate-50 p-3 rounded-xl border border-slate-200">
        <span className="text-xs text-slate-500 font-sans">
          {t('Configure physical nozzle dispensers, link to storage tanks and initialize meter readings.', 'فزیکل نوزل ڈسپنسرز، اسٹوریج ٹینک کنکشن اور میٹر ریڈنگ یہاں ترتیب دیں۔')}
        </span>
        {!showForm && (
          <div className="flex flex-wrap gap-2">
            {products.length > 0 ? (
              products.map(p => {
                const cfg = getFuelConfig(p);
                return (
                  <button key={p.id} onClick={() => handleOpenAdd(p.id)}
                    className={`px-3 py-1.5 ${cfg.headerBg} text-white font-sans text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer shadow-sm whitespace-nowrap hover:opacity-90`}
                  >
                    <Plus className="h-3.5 w-3.5" /> {t(`+ ${p.name} Nozzle`, `+ ${p.urduName} نوزل`)}
                  </button>
                );
              })
            ) : (
              <button onClick={() => handleOpenAdd()}
                className="px-3 py-1.5 bg-orange-600 hover:bg-orange-700 text-white font-sans text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                <Plus className="h-3.5 w-3.5" /> {t('Add Nozzle', 'نوزل شامل کریں')}
              </button>
            )}
          </div>
        )}
      </div>

      {showForm ? renderWizardForm() : (
        nozzles.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 p-12 text-center space-y-3">
            <Fuel className="h-10 w-10 text-slate-300 mx-auto" />
            <h3 className="font-sans text-sm font-bold text-slate-400">{t('No Nozzles Configured', 'کوئی نوزل نہیں')}</h3>
            <p className="text-xs text-slate-400">{t('Add your first fuel nozzle to get started.', 'شروع کرنے کے لیے پہلی نوزل شامل کریں۔')}</p>
            <button onClick={() => handleOpenAdd()} className="mx-auto flex items-center gap-1.5 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white font-sans text-xs font-bold rounded-xl shadow-sm cursor-pointer">
              <Plus className="h-3.5 w-3.5" /> {t('Add First Nozzle', 'پہلی نوزل شامل کریں')}
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Grouped by fuel type */}
            {nozzleGroups.map(({ product, cfg, nozzleList }) => (
              <div key={product.id} className={`rounded-2xl border-2 ${cfg.border} overflow-hidden`}>
                <div className={`${cfg.bg} border-b ${cfg.border} px-5 py-3 flex items-center justify-between`}>
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{cfg.icon}</span>
                    <div>
                      <strong className={`font-sans text-sm font-black ${cfg.color}`}>{t(cfg.label, cfg.urdu)}</strong>
                      <span className="block text-slate-400 text-[10px]">{nozzleList.length} {t('nozzle(s)', 'نوزل')}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleOpenAdd(product.id)}
                    className={`px-3 py-1.5 ${cfg.headerBg} text-white font-sans text-xs font-bold rounded-lg flex items-center gap-1 cursor-pointer shadow-sm hover:opacity-90`}
                  >
                    <Plus className="h-3.5 w-3.5" /> {t('Add Nozzle', 'نوزل شامل کریں')}
                  </button>
                </div>
                <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {nozzleList.map(renderNozzleCard)}
                </div>
              </div>
            ))}

            {/* Ungrouped */}
            {ungroupedNozzles.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {ungroupedNozzles.map(renderNozzleCard)}
              </div>
            )}
          </div>
        )
      )}
    </div>
  );
}
