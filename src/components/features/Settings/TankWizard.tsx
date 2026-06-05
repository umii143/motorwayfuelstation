import React, { useState } from 'react';
import {
  ChevronRight, ArrowLeft, Trash2, Edit, CheckCircle, Database, Plus,
  Droplets, AlertTriangle, TrendingUp, Gauge
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
}

// Fuel type config: color palette, labels, icons
const FUEL_CONFIG: Record<string, {
  label: string; urdu: string; color: string; bg: string;
  border: string; icon: string; badgeBg: string; badgeText: string;
  fillColor: string; headerBg: string; dot: string;
}> = {
  petrol: {
    label: 'Petrol (PMG)', urdu: 'پیٹرول',
    color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-400',
    icon: '⛽', badgeBg: 'bg-emerald-100', badgeText: 'text-emerald-800',
    fillColor: 'from-emerald-500 to-teal-400', headerBg: 'bg-emerald-600',
    dot: 'bg-emerald-500'
  },
  diesel: {
    label: 'Diesel (HSD)', urdu: 'ڈیزل',
    color: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-400',
    icon: '🛢️', badgeBg: 'bg-blue-100', badgeText: 'text-blue-800',
    fillColor: 'from-blue-500 to-cyan-400', headerBg: 'bg-blue-600',
    dot: 'bg-blue-500'
  },
  hobc: {
    label: 'HOBC (High Octane)', urdu: 'ہائی اوکٹین',
    color: 'text-orange-700', bg: 'bg-orange-50', border: 'border-orange-400',
    icon: '🔥', badgeBg: 'bg-orange-100', badgeText: 'text-orange-800',
    fillColor: 'from-orange-500 to-amber-400', headerBg: 'bg-orange-600',
    dot: 'bg-orange-500'
  },
  cng: {
    label: 'CNG (Gas)', urdu: 'سی این جی',
    color: 'text-purple-700', bg: 'bg-purple-50', border: 'border-purple-400',
    icon: '💨', badgeBg: 'bg-purple-100', badgeText: 'text-purple-800',
    fillColor: 'from-purple-500 to-violet-400', headerBg: 'bg-purple-600',
    dot: 'bg-purple-500'
  },
  other: {
    label: 'Other Fuel', urdu: 'دیگر',
    color: 'text-slate-700', bg: 'bg-slate-50', border: 'border-slate-400',
    icon: '🏭', badgeBg: 'bg-slate-100', badgeText: 'text-slate-800',
    fillColor: 'from-slate-500 to-slate-400', headerBg: 'bg-slate-600',
    dot: 'bg-slate-500'
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

export default function TankWizard({
  tanks,
  products,
  language,
  onAddTank,
  onUpdateTank,
  onDeleteTank,
  onLogAudit
}: TankWizardProps) {
  const { showConfirm, showToast } = useStation();
  const t = (en: string, ur: string) => translate(en, ur, language);

  const [wizardStep, setWizardStep] = useState<number>(1);
  const [editingTank, setEditingTank] = useState<Tank | null>(null);
  const [showForm, setShowForm] = useState<boolean>(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

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

  const selectedProduct = products.find(p => p.id === tankForm.productId);
  const fuelCfg = getFuelConfig(selectedProduct);

  const clearErrors = () => setFieldErrors({});

  const handleOpenAdd = (productId?: string) => {
    clearErrors();
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
    setTempDipChart([
      { cm: 10, liters: 400 },
      { cm: 50, liters: 2000 },
      { cm: 100, liters: 5000 },
      { cm: 200, liters: 12000 },
      { cm: 300, liters: 20000 }
    ]);
    setWizardStep(productId ? 2 : 1);
    setShowForm(true);
  };

  const handleOpenEdit = (tk: Tank) => {
    clearErrors();
    setEditingTank(tk);
    setTankForm({
      name: tk.name,
      productId: tk.productId,
      capacity: tk.capacity,
      safeLevel: tk.safeLevel,
      criticalLevel: tk.criticalLevel,
      openingStock: tk.openingStock,
      physicalLabel: tk.physicalLabel || '',
      dipChartCm: '',
      dipChartLiters: ''
    });
    setTempDipChart(tk.dipChart || []);
    setWizardStep(1);
    setShowForm(true);
  };

  const handleAddTempDipPoint = () => {
    const cm = Number(tankForm.dipChartCm);
    const lit = Number(tankForm.dipChartLiters);
    if (isNaN(cm) || isNaN(lit) || cm <= 0 || lit <= 0) {
      showToast(t('Please enter valid centimeters and liters!', 'براہ کرم درست ڈِپ سینٹی میٹر اور لیٹر لکھیں!'), 'error');
      return;
    }
    const updated = [...tempDipChart, { cm, liters: lit }].sort((a, b) => a.cm - b.cm);
    setTempDipChart(updated);
    setTankForm(prev => ({ ...prev, dipChartCm: '', dipChartLiters: '' }));
  };

  const handleRemoveTempDipPoint = (idx: number) => {
    setTempDipChart(tempDipChart.filter((_, i) => i !== idx));
  };

  const validate = (step: number): boolean => {
    const errs: Record<string, string> = {};
    if (step === 1) {
      if (!tankForm.productId) errs.productId = t('Please select a fuel type!', 'براہ کرم فیول کی قسم منتخب کریں!');
    }
    if (step === 2) {
      if (!tankForm.name.trim()) errs.name = t('Tank name is required.', 'ٹینک کا نام ضروری ہے۔');
      if (!tankForm.physicalLabel.trim()) errs.physicalLabel = t('Physical label/code is required.', 'فزیکل لیبل ضروری ہے۔');
    }
    if (step === 3) {
      if (Number(tankForm.capacity) <= 0) errs.capacity = t('Capacity must be greater than 0.', 'گنجائش صفر سے زیادہ ہونی چاہیے۔');
      if (Number(tankForm.safeLevel) <= 0) errs.safeLevel = t('Safe level must be greater than 0.', 'محفوظ سطح صفر سے زیادہ ہونی چاہیے۔');
      if (Number(tankForm.criticalLevel) <= 0) errs.criticalLevel = t('Critical level must be greater than 0.', 'تنقیدی سطح صفر سے زیادہ ہونی چاہیے۔');
      if (Number(tankForm.criticalLevel) >= Number(tankForm.safeLevel)) errs.criticalLevel = t('Critical level must be less than safe level.', 'تنقیدی سطح محفوظ سطح سے کم ہونی چاہیے۔');
    }
    if (step === 4) {
      if (Number(tankForm.openingStock) < 0) errs.openingStock = t('Opening stock cannot be negative.', 'ابتدائی اسٹاک منفی نہیں ہو سکتا۔');
      if (Number(tankForm.openingStock) > Number(tankForm.capacity)) errs.openingStock = t('Opening stock cannot exceed capacity.', 'ابتدائی اسٹاک گنجائش سے زیادہ نہیں ہو سکتا۔');
    }
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleNextStep = () => {
    if (!validate(wizardStep)) return;
    setWizardStep(prev => prev + 1);
  };

  const handlePrevStep = () => {
    clearErrors();
    setWizardStep(prev => Math.max(1, prev - 1));
  };

  const handleSaveTank = () => {
    if (editingTank) {
      onUpdateTank({
        ...editingTank,
        name: tankForm.name,
        productId: tankForm.productId,
        capacity: Number(tankForm.capacity),
        safeLevel: Number(tankForm.safeLevel),
        criticalLevel: Number(tankForm.criticalLevel),
        openingStock: Number(tankForm.openingStock),
        physicalLabel: tankForm.physicalLabel,
        dipChart: tempDipChart
      });
      onLogAudit('Tank', 'Update', `Storage Tank "${tankForm.name}" (ID: ${editingTank.id}, Code: ${tankForm.physicalLabel}) was updated.`);
    } else {
      const newTk: Tank = {
        id: 'tank_' + Date.now(),
        name: tankForm.name,
        productId: tankForm.productId,
        capacity: Number(tankForm.capacity),
        safeLevel: Number(tankForm.safeLevel),
        criticalLevel: Number(tankForm.criticalLevel),
        currentStock: Number(tankForm.openingStock),
        openingStock: Number(tankForm.openingStock),
        physicalLabel: tankForm.physicalLabel,
        dipChart: tempDipChart
      };
      onAddTank(newTk);
      onLogAudit('Tank', 'Create', `New Storage Tank "${tankForm.name}" (Code: ${tankForm.physicalLabel}) registered with opening stock of ${tankForm.openingStock}L.`);
    }
    setShowForm(false);
    clearErrors();
    showToast(t('Tank configured successfully!', 'ٹینک سیٹنگز کامیابی سے محفوظ ہو گئیں!'), 'success');
  };

  const handleDeleteTankRecord = (id: string) => {
    showConfirm(
      t('Confirm Tank Deletion', 'پٹرولیم ٹینک حذف کرنے کی تصدیق'),
      t('Are you sure you want to delete this storage tank? Connected nozzles may be affected.', 'کیا آپ واقعی اس پٹرولیم ٹینک کو ڈیلیٹ کرنا چاہتے ہیں؟'),
      () => {
        const tk = tanks.find(t => t.id === id);
        onDeleteTank(id);
        onLogAudit('Tank', 'Delete', `Storage Tank "${tk?.name}" (ID: ${id}) was deleted manually.`);
        showToast(t('Storage Tank deleted successfully.', 'ٹینک سسٹم سے کامیابی سے حذف کر دیا گیا ہے۔'), 'success');
      }
    );
  };

  const totalSteps = 6;
  const fillPct = tankForm.capacity > 0 ? Math.round((Number(tankForm.openingStock) / Number(tankForm.capacity)) * 100) : 0;

  // ─── WIZARD FORM ───────────────────────────────────────────────
  const renderWizardForm = () => (
    <div className="rounded-2xl border-2 border-slate-200 bg-white shadow-lg overflow-hidden">
      {/* Wizard header with color accent */}
      <div className={`${selectedProduct ? fuelCfg.headerBg : 'bg-slate-700'} px-5 py-4`}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-white/70 text-[10px] font-mono uppercase tracking-widest">
              {editingTank ? t('EDITING TANK', 'ٹینک ایڈٹ') : t('NEW TANK SETUP', 'نیا ٹینک')}
            </p>
            <h4 className="text-white font-sans text-sm font-black mt-0.5 flex items-center gap-2">
              <Database className="h-4 w-4" />
              {editingTank ? t('Modify Tank Configuration', 'ٹینک ترتیب تبدیل کریں') : t('Register New Storage Tank', 'نیا اسٹوریج ٹینک شامل کریں')}
            </h4>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] bg-white/20 text-white px-2.5 py-1 rounded-full font-sans font-bold">
              {t(`Step ${wizardStep} / ${totalSteps}`, `مرحلہ ${wizardStep} / ${totalSteps}`)}
            </span>
            <button onClick={() => { setShowForm(false); clearErrors(); }} className="text-white/60 hover:text-white text-lg leading-none font-bold">×</button>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-3 flex gap-1">
          {Array.from({ length: totalSteps }, (_, i) => (
            <div key={i} className={`h-1 flex-1 rounded-full transition-all duration-300 ${wizardStep > i ? 'bg-white' : 'bg-white/25'}`} />
          ))}
        </div>
      </div>

      <div className="p-5 space-y-5">
        {/* STEP 1: FUEL TYPE */}
        {wizardStep === 1 && (
          <div className="space-y-4">
            <div>
              <h5 className="font-sans text-xs font-black text-slate-700 uppercase tracking-widest mb-0.5">{t('Step 1: Select Fuel Type', 'مرحلہ 1: فیول کی قسم منتخب کریں')}</h5>
              <p className="text-slate-400 text-[11px]">{t('Choose the type of fuel this tank will store.', 'اس ٹینک میں ذخیرہ ہونے والے فیول کی قسم منتخب کریں۔')}</p>
            </div>

            {products.length === 0 ? (
              <div className="p-6 text-center border-2 border-dashed border-slate-200 rounded-xl text-slate-400 text-xs">
                {t('No fuel products configured yet. Add products first in Accounts tab.', 'ابھی تک کوئی پراڈکٹ نہیں بنائی گئی۔ پہلے اکاؤنٹس ٹیب میں پراڈکٹ بنائیں۔')}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {products.map(p => {
                  const cfg = getFuelConfig(p);
                  const isSelected = tankForm.productId === p.id;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => { setTankForm(prev => ({ ...prev, productId: p.id })); clearErrors(); }}
                      className={`relative p-4 rounded-xl border-2 text-left transition-all duration-150 ${isSelected ? `${cfg.border} ${cfg.bg} shadow-md` : 'border-slate-200 hover:border-slate-300 bg-white'}`}
                    >
                      {isSelected && (
                        <CheckCircle className={`absolute top-2.5 right-2.5 h-4 w-4 ${cfg.color}`} />
                      )}
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

        {/* STEP 2: TANK NAME & LABEL */}
        {wizardStep === 2 && (
          <div className="space-y-4">
            <div>
              <h5 className="font-sans text-xs font-black text-slate-700 uppercase tracking-widest mb-0.5">{t('Step 2: Tank Identity', 'مرحلہ 2: ٹینک کی شناخت')}</h5>
              <p className="text-slate-400 text-[11px]">{t('Give this tank a name and a short physical label code for identification.', 'ٹینک کا نام اور شناختی کوڈ درج کریں۔')}</p>
            </div>

            <div className={`flex items-center gap-2 p-3 rounded-xl ${fuelCfg.bg} border ${fuelCfg.border}`}>
              <span className="text-lg">{fuelCfg.icon}</span>
              <div>
                <span className={`text-[10px] font-bold uppercase tracking-widest ${fuelCfg.color}`}>{t('Fuel Type', 'فیول قسم')}</span>
                <strong className={`block text-xs font-black ${fuelCfg.color}`}>{selectedProduct ? t(selectedProduct.name, selectedProduct.urduName) : '—'}</strong>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">{t('Tank Name / Title:', 'ٹینک کا نام:')}</label>
                <input
                  type="text"
                  placeholder={t('e.g. Main Petrol Tank A', 'مثلاً: پیٹرول ٹینک A')}
                  value={tankForm.name}
                  onChange={e => { setTankForm(p => ({ ...p, name: e.target.value })); if (fieldErrors.name) clearErrors(); }}
                  className={`w-full rounded-xl border ${fieldErrors.name ? 'border-red-400 bg-red-50' : 'border-slate-200'} px-3 py-2 text-xs font-sans outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20`}
                />
                {fieldErrors.name && <p className="text-red-500 text-[10px] font-bold mt-1">⚠ {fieldErrors.name}</p>}
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">{t('Physical Label / Code:', 'فزیکل لیبل کوڈ:')}</label>
                <input
                  type="text"
                  placeholder={t('e.g. T-1 or TK-P1', 'مثلاً: T-1 یا TK-P1')}
                  value={tankForm.physicalLabel}
                  onChange={e => { setTankForm(p => ({ ...p, physicalLabel: e.target.value })); if (fieldErrors.physicalLabel) clearErrors(); }}
                  className={`w-full rounded-xl border ${fieldErrors.physicalLabel ? 'border-red-400 bg-red-50' : 'border-slate-200'} px-3 py-2 text-xs font-mono font-bold uppercase outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20`}
                />
                {fieldErrors.physicalLabel && <p className="text-red-500 text-[10px] font-bold mt-1">⚠ {fieldErrors.physicalLabel}</p>}
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: CAPACITY & THRESHOLDS */}
        {wizardStep === 3 && (
          <div className="space-y-4">
            <div>
              <h5 className="font-sans text-xs font-black text-slate-700 uppercase tracking-widest mb-0.5">{t('Step 3: Capacity & Safety Levels', 'مرحلہ 3: گنجائش اور حفاظتی سطحیں')}</h5>
              <p className="text-slate-400 text-[11px]">{t('Set the maximum capacity and define the safe and critical threshold levels in liters.', 'زیادہ سے زیادہ گنجائش اور محفوظ، تنقیدی سطحیں لیٹرز میں درج کریں۔')}</p>
            </div>

            {/* Visual threshold display */}
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-2">
              <div className="flex justify-between text-[10px] font-mono font-bold text-slate-500 mb-1">
                <span>0 L</span><span>{Number(tankForm.capacity).toLocaleString()} L (Capacity)</span>
              </div>
              <div className="relative h-5 bg-slate-200 rounded-full overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-red-400 via-amber-400 to-emerald-500 opacity-30 rounded-full" />
                {tankForm.capacity > 0 && (
                  <>
                    <div
                      className="absolute top-0 bottom-0 bg-red-500 opacity-70 rounded-l-full"
                      style={{ width: `${Math.min(100, (Number(tankForm.criticalLevel) / Number(tankForm.capacity)) * 100)}%` }}
                    />
                    <div
                      className="absolute top-0 bottom-0 bg-amber-400 opacity-50"
                      style={{ left: `${(Number(tankForm.criticalLevel) / Number(tankForm.capacity)) * 100}%`, width: `${((Number(tankForm.safeLevel) - Number(tankForm.criticalLevel)) / Number(tankForm.capacity)) * 100}%` }}
                    />
                  </>
                )}
              </div>
              <div className="flex gap-4 text-[10px] font-bold">
                <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-red-500" /> {t('Critical', 'تنقیدی')}</span>
                <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-amber-400" /> {t('Warning', 'انتباہ')}</span>
                <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-emerald-500" /> {t('Optimal', 'بہترین')}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1 flex items-center gap-1">
                  <Gauge className="h-3 w-3 text-slate-400" /> {t('Total Capacity (L):', 'کل گنجائش (L):')}
                </label>
                <input
                  type="number" min={0}
                  value={tankForm.capacity}
                  onChange={e => { setTankForm(p => ({ ...p, capacity: Number(e.target.value) })); if (fieldErrors.capacity) clearErrors(); }}
                  className={`w-full rounded-xl border ${fieldErrors.capacity ? 'border-red-400 bg-red-50' : 'border-slate-200'} px-3 py-2 text-xs font-mono font-bold outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20`}
                />
                {fieldErrors.capacity && <p className="text-red-500 text-[10px] font-bold mt-1">⚠ {fieldErrors.capacity}</p>}
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1 flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3 text-amber-500" /> {t('Safe Level (L):', 'محفوظ سطح (L):')}
                </label>
                <input
                  type="number" min={0}
                  value={tankForm.safeLevel}
                  onChange={e => { setTankForm(p => ({ ...p, safeLevel: Number(e.target.value) })); if (fieldErrors.safeLevel) clearErrors(); }}
                  className={`w-full rounded-xl border ${fieldErrors.safeLevel ? 'border-red-400 bg-red-50' : 'border-amber-200'} px-3 py-2 text-xs font-mono font-bold outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20`}
                />
                {fieldErrors.safeLevel && <p className="text-red-500 text-[10px] font-bold mt-1">⚠ {fieldErrors.safeLevel}</p>}
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1 flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3 text-red-500" /> {t('Critical Level (L):', 'تنقیدی سطح (L):')}
                </label>
                <input
                  type="number" min={0}
                  value={tankForm.criticalLevel}
                  onChange={e => { setTankForm(p => ({ ...p, criticalLevel: Number(e.target.value) })); if (fieldErrors.criticalLevel) clearErrors(); }}
                  className={`w-full rounded-xl border ${fieldErrors.criticalLevel ? 'border-red-400 bg-red-50' : 'border-red-200'} px-3 py-2 text-xs font-mono font-bold outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20`}
                />
                {fieldErrors.criticalLevel && <p className="text-red-500 text-[10px] font-bold mt-1">⚠ {fieldErrors.criticalLevel}</p>}
              </div>
            </div>
          </div>
        )}

        {/* STEP 4: OPENING STOCK */}
        {wizardStep === 4 && (
          <div className="space-y-4">
            <div>
              <h5 className="font-sans text-xs font-black text-slate-700 uppercase tracking-widest mb-0.5">{t('Step 4: Opening Stock', 'مرحلہ 4: ابتدائی اسٹاک')}</h5>
              <p className="text-slate-400 text-[11px]">{t('Enter the current physical fuel level in this tank today.', 'آج اس ٹینک میں موجود اصل فیول کی مقدار لیٹرز میں لکھیں۔')}</p>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">{t('Opening / Current Stock (Liters):', 'ابتدائی / موجودہ اسٹاک (لیٹرز):')}</label>
              <input
                type="number" min={0} max={tankForm.capacity}
                value={tankForm.openingStock}
                onChange={e => { setTankForm(p => ({ ...p, openingStock: Number(e.target.value) })); if (fieldErrors.openingStock) clearErrors(); }}
                className={`w-full rounded-xl border ${fieldErrors.openingStock ? 'border-red-400 bg-red-50' : 'border-slate-200'} px-3 py-2.5 text-sm font-mono font-bold outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20`}
              />
              {fieldErrors.openingStock && <p className="text-red-500 text-[10px] font-bold mt-1">⚠ {fieldErrors.openingStock}</p>}
            </div>

            {/* Visual fill indicator */}
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-2">
              <div className="flex justify-between text-[11px] font-mono font-bold">
                <span className="text-slate-500">{t('Fill Level:', 'بھرنے کی سطح:')}</span>
                <span className={fillPct < 20 ? 'text-red-600' : fillPct < 50 ? 'text-amber-600' : 'text-emerald-600'}>
                  {fillPct}% ({Number(tankForm.openingStock).toLocaleString()} / {Number(tankForm.capacity).toLocaleString()} L)
                </span>
              </div>
              <div className="h-6 bg-slate-200 rounded-full overflow-hidden shadow-inner">
                <div
                  style={{ width: `${Math.min(100, fillPct)}%` }}
                  className={`h-full rounded-full transition-all duration-500 bg-gradient-to-r ${fuelCfg.fillColor}`}
                />
              </div>
              <div className="flex gap-3 text-[10px] font-bold text-slate-500">
                <span>Critical: &lt; {Number(tankForm.criticalLevel).toLocaleString()} L</span>
                <span>Safe: &gt; {Number(tankForm.safeLevel).toLocaleString()} L</span>
              </div>
            </div>
          </div>
        )}

        {/* STEP 5: DIP CHART */}
        {wizardStep === 5 && (
          <div className="space-y-4">
            <div>
              <h5 className="font-sans text-xs font-black text-slate-700 uppercase tracking-widest mb-0.5">{t('Step 5: Calibration Dip Chart', 'مرحلہ 5: کیلیبریشن ڈِپ چارٹ')}</h5>
              <p className="text-slate-400 text-[11px]">{t('Add cm-to-liters mapping from your tank\'s certified calibration chart.', 'سرٹیفائیڈ ڈِپ چارٹ سے سینٹی میٹر سے لیٹرز کا نقشہ شامل کریں۔')}</p>
            </div>

            <div className="flex gap-2">
              <input
                type="number" placeholder={t('cm depth', 'گہرائی cm')}
                value={tankForm.dipChartCm}
                onChange={e => setTankForm(p => ({ ...p, dipChartCm: e.target.value }))}
                className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-xs font-mono outline-none focus:border-orange-500"
              />
              <input
                type="number" placeholder={t('liters', 'لیٹرز')}
                value={tankForm.dipChartLiters}
                onChange={e => setTankForm(p => ({ ...p, dipChartLiters: e.target.value }))}
                className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-xs font-mono outline-none focus:border-orange-500"
              />
              <button
                type="button"
                onClick={handleAddTempDipPoint}
                className="px-3 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="max-h-40 overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-100">
              {tempDipChart.length === 0 ? (
                <p className="py-6 text-center text-slate-400 text-xs">{t('No dip points added yet.', 'ابھی تک کوئی ڈِپ پوائنٹ نہیں جوڑا گیا۔')}</p>
              ) : tempDipChart.map((pt, idx) => (
                <div key={idx} className="flex justify-between items-center px-4 py-2 text-xs font-mono">
                  <span className="text-slate-500">{pt.cm} cm</span>
                  <span className="font-bold text-slate-800">{pt.liters.toLocaleString()} L</span>
                  <button type="button" onClick={() => handleRemoveTempDipPoint(idx)} className="text-red-400 hover:text-red-600 cursor-pointer">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
            <p className="text-slate-400 text-[10px]">{t(`${tempDipChart.length} dip points configured.`, `${tempDipChart.length} ڈِپ پوائنٹس موجود ہیں۔`)}</p>
          </div>
        )}

        {/* STEP 6: REVIEW */}
        {wizardStep === 6 && (
          <div className="space-y-4">
            <div>
              <h5 className="font-sans text-xs font-black text-emerald-700 uppercase tracking-widest mb-0.5">{t('Step 6: Review & Confirm', 'مرحلہ 6: جائزہ اور تصدیق')}</h5>
              <p className="text-slate-400 text-[11px]">{t('Review your tank settings before saving.', 'محفوظ کرنے سے پہلے ٹینک کی ترتیبات کا جائزہ لیں۔')}</p>
            </div>

            {/* Preview card */}
            <div className={`rounded-xl border-2 ${fuelCfg.border} ${fuelCfg.bg} p-4 space-y-3`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{fuelCfg.icon}</span>
                  <div>
                    <strong className={`text-sm font-black font-sans ${fuelCfg.color}`}>{tankForm.name || '—'}</strong>
                    <span className={`block text-[10px] font-mono font-bold ${fuelCfg.color} opacity-70`}>{tankForm.physicalLabel}</span>
                  </div>
                </div>
                <span className={`text-[10px] font-black px-2.5 py-1 rounded-full ${fuelCfg.badgeBg} ${fuelCfg.badgeText} uppercase tracking-wider`}>
                  {selectedProduct ? t(selectedProduct.name, selectedProduct.urduName) : '—'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px] font-sans border-t border-white/50 pt-3">
                {[
                  { label: t('Capacity', 'گنجائش'), value: `${Number(tankForm.capacity).toLocaleString()} L` },
                  { label: t('Opening Stock', 'ابتدائی اسٹاک'), value: `${Number(tankForm.openingStock).toLocaleString()} L` },
                  { label: t('Safe Level', 'محفوظ سطح'), value: `> ${Number(tankForm.safeLevel).toLocaleString()} L` },
                  { label: t('Critical Level', 'تنقیدی سطح'), value: `< ${Number(tankForm.criticalLevel).toLocaleString()} L` },
                  { label: t('Dip Points', 'ڈِپ پوائنٹس'), value: `${tempDipChart.length} points` },
                  { label: t('Fill %', 'بھرنے %'), value: `${fillPct}%` },
                ].map(({ label, value }) => (
                  <div key={label} className="bg-white/60 rounded-lg px-3 py-2">
                    <span className="text-slate-500 text-[9px] uppercase tracking-wider block">{label}</span>
                    <strong className={`font-mono font-bold ${fuelCfg.color}`}>{value}</strong>
                  </div>
                ))}
              </div>

              {/* Fill bar */}
              <div className="h-2.5 bg-white/40 rounded-full overflow-hidden">
                <div style={{ width: `${Math.min(100, fillPct)}%` }} className={`h-full rounded-full bg-gradient-to-r ${fuelCfg.fillColor}`} />
              </div>
            </div>
          </div>
        )}

        {/* Navigation buttons */}
        <div className="flex justify-between border-t border-slate-100 pt-4">
          <button
            type="button"
            disabled={wizardStep === 1}
            onClick={handlePrevStep}
            className={`px-4 py-2 font-sans text-xs font-bold rounded-xl flex items-center gap-1.5 ${wizardStep === 1 ? 'bg-slate-50 text-slate-300 cursor-not-allowed' : 'bg-slate-100 text-slate-600 hover:bg-slate-200 cursor-pointer'}`}
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            {t('Back', 'پیچھے')}
          </button>

          {wizardStep < totalSteps ? (
            <button
              type="button"
              onClick={handleNextStep}
              disabled={wizardStep === 1 && products.length === 0}
              className={`px-5 py-2 text-white font-sans text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-sm cursor-pointer ${selectedProduct ? `${fuelCfg.headerBg} hover:opacity-90` : 'bg-orange-600 hover:bg-orange-700'}`}
            >
              {t('Continue', 'آگے')}
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSaveTank}
              className={`px-6 py-2 text-white font-sans text-xs font-extrabold rounded-xl flex items-center gap-1.5 shadow-md cursor-pointer ${selectedProduct ? `${fuelCfg.headerBg} hover:opacity-90` : 'bg-emerald-600 hover:bg-emerald-700'}`}
            >
              <CheckCircle className="h-4 w-4" />
              {editingTank ? t('UPDATE TANK', 'ٹینک اپ ڈیٹ کریں') : t('REGISTER TANK', 'ٹینک محفوظ کریں')}
            </button>
          )}
        </div>
      </div>
    </div>
  );

  // ─── TANK LIST CARD ────────────────────────────────────────────
  const renderTankCard = (tnk: Tank) => {
    const prod = products.find(p => p.id === tnk.productId);
    const cfg = getFuelConfig(prod);
    const fillPct = tnk.capacity > 0 ? Math.round((tnk.currentStock / tnk.capacity) * 100) : 0;
    const isUnderCritical = tnk.currentStock < tnk.criticalLevel;
    const isUnderSafe = tnk.currentStock < tnk.safeLevel;

    const statusBadge = isUnderCritical
      ? { label: t('🚨 CRITICAL', '🚨 تنقیدی'), cls: 'bg-red-100 text-red-700 border-red-200' }
      : isUnderSafe
        ? { label: t('⚠ LOW STOCK', '⚠ کم اسٹاک'), cls: 'bg-amber-100 text-amber-700 border-amber-200' }
        : { label: t('✅ OPTIMAL', '✅ بہترین'), cls: 'bg-emerald-100 text-emerald-700 border-emerald-200' };

    return (
      <div key={tnk.id} className={`rounded-2xl border-2 bg-white shadow-sm hover:shadow-md transition-all overflow-hidden ${cfg.border}`}>
        {/* Color header strip */}
        <div className={`${cfg.headerBg} px-4 py-3 flex items-center justify-between`}>
          <div className="flex items-center gap-2">
            <span className="text-lg">{cfg.icon}</span>
            <div>
              <strong className="text-white font-sans text-sm font-black">{tnk.name}</strong>
              <span className="block text-white/70 text-[10px] font-mono">{tnk.physicalLabel || 'No Label'}</span>
            </div>
          </div>
          <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${statusBadge.cls}`}>{statusBadge.label}</span>
        </div>

        <div className="p-4 space-y-3">
          {/* Fuel type badge */}
          <div className="flex items-center justify-between">
            <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full ${cfg.badgeBg} ${cfg.badgeText}`}>
              {prod ? t(prod.name, prod.urduName) : tnk.productId}
            </span>
            <span className="text-[10px] font-mono font-bold text-slate-400">{fillPct}% full</span>
          </div>

          {/* Fill bar */}
          <div>
            <div className="h-3 bg-slate-100 rounded-full overflow-hidden shadow-inner">
              <div
                style={{ width: `${Math.min(100, fillPct)}%` }}
                className={`h-full rounded-full bg-gradient-to-r transition-all duration-700 ${
                  isUnderCritical ? 'from-red-500 to-red-400' : isUnderSafe ? 'from-amber-500 to-amber-400' : `${cfg.fillColor}`
                }`}
              />
            </div>
          </div>

          {/* Key stats */}
          <div className="grid grid-cols-2 gap-2 text-[11px] font-sans">
            <div className="bg-slate-50 rounded-lg px-3 py-2">
              <span className="text-slate-400 text-[9px] uppercase tracking-wider block">Current Stock</span>
              <strong className="font-mono font-bold text-slate-800">{tnk.currentStock.toLocaleString()} L</strong>
            </div>
            <div className="bg-slate-50 rounded-lg px-3 py-2">
              <span className="text-slate-400 text-[9px] uppercase tracking-wider block">Capacity</span>
              <strong className="font-mono font-bold text-slate-800">{tnk.capacity.toLocaleString()} L</strong>
            </div>
            <div className="bg-amber-50 rounded-lg px-3 py-2">
              <span className="text-amber-600 text-[9px] uppercase tracking-wider block">Safe Level</span>
              <strong className="font-mono font-bold text-amber-700">&gt; {tnk.safeLevel.toLocaleString()} L</strong>
            </div>
            <div className="bg-red-50 rounded-lg px-3 py-2">
              <span className="text-red-600 text-[9px] uppercase tracking-wider block">Critical Level</span>
              <strong className="font-mono font-bold text-red-700">&lt; {tnk.criticalLevel.toLocaleString()} L</strong>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 border-t border-slate-100 pt-3">
            <button
              onClick={() => handleOpenEdit(tnk)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:border-orange-400 hover:text-orange-600 font-sans text-[11px] font-bold transition-all cursor-pointer"
            >
              <Edit className="h-3.5 w-3.5" />
              {t('Edit', 'ترمیم')}
            </button>
            <button
              onClick={() => handleDeleteTankRecord(tnk.id)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-100 bg-red-50 text-red-600 hover:bg-red-100 font-sans text-[11px] font-bold transition-all cursor-pointer"
            >
              <Trash2 className="h-3.5 w-3.5" />
              {t('Delete', 'حذف')}
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Group tanks by fuel type for the list view
  const fuelGroups = products.map(p => ({
    product: p,
    cfg: getFuelConfig(p),
    tankList: tanks.filter(t => t.productId === p.id)
  })).filter(g => g.tankList.length > 0);

  const unGroupedTanks = tanks.filter(t => !products.find(p => p.id === t.productId));

  return (
    <div className="space-y-6">
      {/* Header controls */}
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between bg-slate-50 p-3 rounded-xl border border-slate-200">
        <span className="text-xs text-slate-500 font-sans">
          {t('Configure underground fuel storage tanks, set safety thresholds and calibration dip charts.', 'زمین دوز پٹرولیم ٹینک، حفاظتی سطحیں اور ڈِپ چارٹ یہاں مینیج کریں۔')}
        </span>
        {!showForm && (
          <div className="flex flex-wrap gap-2">
            {products.length > 0 ? (
              products.map(p => {
                const cfg = getFuelConfig(p);
                return (
                  <button
                    key={p.id}
                    onClick={() => handleOpenAdd(p.id)}
                    className={`px-3 py-1.5 ${cfg.headerBg} text-white font-sans text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer shadow-sm whitespace-nowrap hover:opacity-90 transition-opacity`}
                  >
                    <Plus className="h-3.5 w-3.5" />
                    {t(`+ ${p.name} Tank`, `+ ${p.urduName} ٹینک`)}
                  </button>
                );
              })
            ) : (
              <button
                onClick={() => handleOpenAdd()}
                className="px-3 py-1.5 bg-orange-600 hover:bg-orange-700 text-white font-sans text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                <Plus className="h-3.5 w-3.5" />
                {t('Add Tank', 'ٹینک شامل کریں')}
              </button>
            )}
          </div>
        )}
      </div>

      {showForm ? renderWizardForm() : (
        tanks.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 p-12 text-center space-y-3">
            <Droplets className="h-10 w-10 text-slate-300 mx-auto" />
            <h3 className="font-sans text-sm font-bold text-slate-400">{t('No Storage Tanks Configured', 'کوئی اسٹوریج ٹینک نہیں')}</h3>
            <p className="text-xs text-slate-400">{t('Add your first fuel storage tank to get started.', 'شروع کرنے کے لیے پہلا فیول اسٹوریج ٹینک شامل کریں۔')}</p>
            <button onClick={() => handleOpenAdd()} className="mx-auto flex items-center gap-1.5 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white font-sans text-xs font-bold rounded-xl shadow-sm cursor-pointer">
              <Plus className="h-3.5 w-3.5" /> {t('Add First Tank', 'پہلا ٹینک شامل کریں')}
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Grouped by fuel type */}
            {fuelGroups.map(({ product, cfg, tankList }) => (
              <div key={product.id} className={`rounded-2xl border ${cfg.border} overflow-hidden`}>
                <div className={`${cfg.bg} border-b ${cfg.border} px-5 py-3 flex items-center justify-between`}>
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{cfg.icon}</span>
                    <div>
                      <strong className={`font-sans text-sm font-black ${cfg.color}`}>{t(cfg.label, cfg.urdu)}</strong>
                      <span className="block text-slate-400 text-[10px]">{tankList.length} {t('tank(s)', 'ٹینک')}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 uppercase tracking-wider block">{t('Total Stock', 'کل اسٹاک')}</span>
                      <strong className={`font-mono text-sm font-black ${cfg.color}`}>
                        {tankList.reduce((s, t) => s + t.currentStock, 0).toLocaleString()} L
                      </strong>
                    </div>
                    <button
                      onClick={() => handleOpenAdd(product.id)}
                      className={`px-3 py-1.5 ${cfg.headerBg} text-white font-sans text-xs font-bold rounded-lg flex items-center gap-1 cursor-pointer shadow-sm hover:opacity-90`}
                    >
                      <Plus className="h-3.5 w-3.5" /> {t('Add Tank', 'ٹینک شامل کریں')}
                    </button>
                  </div>
                </div>
                <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                  {tankList.map(renderTankCard)}
                </div>
              </div>
            ))}

            {/* Ungrouped tanks (no matching product) */}
            {unGroupedTanks.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {unGroupedTanks.map(renderTankCard)}
              </div>
            )}
          </div>
        )
      )}
    </div>
  );
}
