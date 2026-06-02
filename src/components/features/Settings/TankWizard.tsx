import React, { useState } from 'react';
import { Layers, ChevronRight, ArrowLeft, Trash2, Edit, CheckCircle, Info, Database, Plus } from 'lucide-react';
import { Tank, Product } from '../../../types';
import EmptyState from '../../ui/EmptyState';
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

export default function TankWizard({
  tanks,
  products,
  language,
  onAddTank,
  onUpdateTank,
  onDeleteTank,
  onLogAudit
}: TankWizardProps) {
  const t = (en: string, ur: string) => translate(en, ur, language);

  // States
  const [wizardStep, setWizardStep] = useState<number>(1);
  const [editingTank, setEditingTank] = useState<Tank | null>(null);
  const [showForm, setShowForm] = useState<boolean>(false);

  // Tank parameters state
  const [tankForm, setTankForm] = useState({
    name: '',
    productId: products[0]?.id || '',
    capacity: 25000,
    safeLevel: 3000,
    criticalLevel: 1000,
    openingStock: 12000,
    physicalLabel: '',
    dipChartCm: '',
    dipChartLiters: ''
  });

  const [tempDipChart, setTempDipChart] = useState<{ cm: number; liters: number }[]>([]);

  const handleOpenAdd = () => {
    setEditingTank(null);
    setTankForm({
      name: '',
      productId: products[0]?.id || '',
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
    setWizardStep(1);
    setShowForm(true);
  };

  const handleOpenEdit = (tk: Tank) => {
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
      alert(t('Please enter valid centimeters and liters!', 'براہ کرم درست ڈِپ سینٹی میٹر اور لیٹر لکھیں!'));
      return;
    }
    const updated = [...tempDipChart, { cm, liters: lit }].sort((a, b) => a.cm - b.cm);
    setTempDipChart(updated);
    setTankForm(prev => ({ ...prev, dipChartCm: '', dipChartLiters: '' }));
  };

  const handleRemoveTempDipPoint = (idx: number) => {
    setTempDipChart(tempDipChart.filter((_, i) => i !== idx));
  };

  const handleNextStep = () => {
    if (wizardStep === 1) {
      if (!tankForm.name || !tankForm.physicalLabel) {
        alert(t('Please complete tank names and physical labels!', 'براہ کرم ٹینک کا نام اور کوڈ درج کریں!'));
        return;
      }
    }
    if (wizardStep === 2) {
      if (tankForm.capacity <= 0 || tankForm.safeLevel <= 0 || tankForm.criticalLevel <= 0) {
        alert(t('Please complete valid volumetric values!', 'براہ کرم درست مقدار کے لیٹرز درج کریں!'));
        return;
      }
    }
    setWizardStep(prev => prev + 1);
  };

  const handlePrevStep = () => {
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

      onLogAudit(
        'Tank',
        'Update',
        `Storage Tank "${tankForm.name}" (ID: ${editingTank.id}, Code: ${tankForm.physicalLabel}) was updated.`
      );
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

      onLogAudit(
        'Tank',
        'Create',
        `New Storage Tank "${tankForm.name}" (Code: ${tankForm.physicalLabel}) registered with opening stock of ${tankForm.openingStock}L.`
      );
    }

    setShowForm(false);
    alert(t('Tank parameters configured successfully!', 'ٹینک سیٹنگز کامیابی سے محفوظ ہو گئیں!'));
  };

  const handleDeleteTankRecord = (id: string) => {
    const doubleCheck = window.confirm(t('Are you sure you want to delete this storage tank? Connected nozzles metadata check is highly recommended.', 'کیا آپ واقعی اس پٹرولیم ٹینک کو ڈیلیٹ کرنا چاہتے ہیں؟'));
    if (!doubleCheck) return;

    const tk = tanks.find(t => t.id === id);
    onDeleteTank(id);
    onLogAudit('Tank', 'Delete', `Storage Tank "${tk?.name}" (ID: ${id}) was deleted manually.`);
    alert(t('Storage Tank deleted successfully.', 'ٹینک سسٹم سے کامیابی سے حذف کر دیا گیا ہے۔'));
  };

  return (
    <div className="space-y-6">
      {/* HEADER SWITCH */}
      <div className="flex justify-between items-center bg-slate-50 p-3 rounded-lg border border-slate-200">
        <span className="text-xs text-slate-500 font-sans font-medium">
          {t('Manage and configure physical storage tank units below.', 'اندرونِ زمین پٹرولیم ٹینک اور ڈِپ چارٹ کنفیگریشن یہاں مینیج کریں۔')}
        </span>
        {!showForm && (
          <button
            onClick={handleOpenAdd}
            className="px-3 py-1.5 bg-orange-600 hover:bg-orange-700 text-white font-sans text-xs font-bold rounded-lg flex items-center gap-1 cursor-pointer shadow-xs whitespace-nowrap"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>{t('Add New Tank Unit', 'نیا ٹینک سیٹ اپ کریں')}</span>
          </button>
        )}
      </div>

      {showForm ? (
        /* WIZARD FORM */
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h4 className="font-sans text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <Database className="h-4.5 w-4.5 text-orange-600" />
              <span>{editingTank ? t('Modify Tank Parameters', 'ٹینک کی معلومات تبدیل کریں') : t('Register Storage Tank', 'نیا ٹینک کنفیگر کریں')}</span>
            </h4>
            <div className="flex items-center gap-2">
              <span className="text-[10px] bg-orange-50 text-orange-700 px-2.5 py-0.5 rounded-full font-sans font-bold">
                {t(`Step ${wizardStep} of 4`, `مرحلہ ${wizardStep} سے 4`)}
              </span>
              <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600">
                <XButton className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* STEPPER STATUS MARKS */}
          <div className="flex items-center justify-center gap-2 py-1 max-w-sm mx-auto">
            {[1, 2, 3, 4].map(idx => (
              <div key={idx} className="flex-1 flex items-center gap-1">
                <div className={`h-2 w-2 rounded-full ${wizardStep >= idx ? 'bg-orange-600' : 'bg-slate-200'}`} />
                {idx < 4 && <div className={`flex-1 h-[2px] ${wizardStep > idx ? 'bg-orange-600' : 'bg-slate-200'}`} />}
              </div>
            ))}
          </div>

          {/* STEP 1: IDENTITY */}
          {wizardStep === 1 && (
            <div className="space-y-4 text-xs font-sans">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest">
                {t('Step 1: Tank Base Specifications:', 'مرحلہ 1: ٹینک کا ظاہری نام اور کوڈ:')}
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-505 font-bold mb-1">{t('Tank Structural Name:', 'ٹینک کا مخصوص نام:')}</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Tank 1 (Super Petrol)"
                    value={tankForm.name}
                    onChange={(e) => setTankForm({ ...tankForm, name: e.target.value })}
                    className="w-full rounded-lg border border-slate-205 px-3 py-2 outline-hidden focus:border-orange-500 font-sans"
                  />
                </div>

                <div>
                  <label className="block text-slate-505 font-bold mb-1">{t('Physical Tag / Label Code:', 'ظاہری کوڈ نشان:')}</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. T-1, D-1"
                    value={tankForm.physicalLabel}
                    onChange={(e) => setTankForm({ ...tankForm, physicalLabel: e.target.value })}
                    className="w-full rounded-lg border border-slate-205 px-3 py-2 outline-hidden focus:border-orange-500 font-sans"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-slate-505 font-bold mb-1">{t('Assigned Fuel Product:', 'منسلک پٹرول ڈیزل یا گیس پراڈکٹ:')}</label>
                  <select
                    value={tankForm.productId}
                    onChange={(e) => setTankForm({ ...tankForm, productId: e.target.value })}
                    className="w-full rounded-lg border border-slate-205 bg-white px-3 py-2 outline-hidden focus:border-orange-500"
                  >
                    {products.length === 0 ? (
                      <option value="">{t('-- Register Fuel Products First --', '-- پہلے فیول پراڈکٹ شامل کریں --')}</option>
                    ) : (
                      products.map(p => (
                        <option key={p.id} value={p.id}>{t(p.name, p.urduName)} (Current Rate: Rs. {p.rate?.toFixed(2)})</option>
                      ))
                    )}
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: CAPACITY LIMITS */}
          {wizardStep === 2 && (
            <div className="space-y-4 text-xs font-sans">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest">
                {t('Step 2: Tank Storage Capacity Warnings:', 'مرحلہ 2: ٹینک کی گنجائش اور سیکیورٹی الارم لیولز:')}
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-slate-550 font-bold mb-1">{t('Max capacity (Liters):', 'ٹینک کی کل گنجائش (لیٹرز):')}</label>
                  <input
                    type="number"
                    required
                    value={tankForm.capacity}
                    onChange={(e) => setTankForm({ ...tankForm, capacity: Number(e.target.value) })}
                    className="w-full rounded-lg border border-slate-205 px-3 py-2 font-mono outline-hidden focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-550 font-bold mb-1">{t('Water Safe Limit (Liters):', 'سیف واٹر لمٹ (لیٹرز):')}</label>
                  <input
                    type="number"
                    required
                    value={tankForm.safeLevel}
                    onChange={(e) => setTankForm({ ...tankForm, safeLevel: Number(e.target.value) })}
                    className="w-full rounded-lg border border-slate-205 px-3 py-2 font-mono outline-hidden focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-550 font-bold mb-1">{t('Critical safety level (Liters):', 'خطرے کا انتہائی آخری لیول (لیٹرز):')}</label>
                  <input
                    type="number"
                    required
                    value={tankForm.criticalLevel}
                    onChange={(e) => setTankForm({ ...tankForm, criticalLevel: Number(e.target.value) })}
                    className="w-full rounded-lg border border-slate-205 px-3 py-2 font-mono outline-hidden focus:border-orange-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: INITIAL STOCKS & CALIBRATION */}
          {wizardStep === 3 && (
            <div className="space-y-4 text-xs font-sans">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest">
                {t('Step 3: Stocks Initialization & Dip Chart Points:', 'مرحلہ 3: ابتدائی اسٹاک اور ڈِپ سینٹی میٹر کیلیبریشن:')}
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-550 font-bold mb-1">{t('Opening Stock Quantity (Ltrs):', 'ابتدائی اسٹاک کی مقدار (لیٹرز):')}</label>
                  <input
                    type="number"
                    required
                    value={tankForm.openingStock}
                    onChange={(e) => setTankForm({ ...tankForm, openingStock: Number(e.target.value) })}
                    className="w-full rounded-lg border border-slate-205 px-3 py-2 font-mono outline-hidden focus:border-orange-500"
                  />
                </div>

                <div className="border border-slate-100 p-3 rounded-lg bg-slate-50 flex flex-col justify-center">
                  <span className="font-bold text-[10px] text-slate-500 uppercase">{t('Calibration Points Count:', 'کل رجسٹرڈ ڈِپ پوائنٹس:')}</span>
                  <span className="font-mono text-lg font-extrabold text-orange-600 mt-0.5">{tempDipChart.length} Points</span>
                </div>
              </div>

              {/* CALIBRATION ENTRY BOX */}
              <div className="border border-slate-150 rounded-lg p-3 space-y-2">
                <span className="block font-bold text-[10px] text-slate-500 uppercase tracking-wider">{t('Register Calibration Dip Line Point:', 'نیا سینٹی میٹر چارٹ ریفرنس پوائنٹ شامل کریں:')}</span>
                <div className="flex gap-2 items-end">
                  <div className="flex-1">
                    <label className="block text-[10px] text-slate-400 mb-0.5">{t('cm Height:', 'ڈِپ سینٹی میٹر (cm):')}</label>
                    <input
                      type="number"
                      placeholder="e.g. 100"
                      value={tankForm.dipChartCm}
                      onChange={(e) => setTankForm({ ...tankForm, dipChartCm: e.target.value })}
                      className="w-full bg-white p-1.5 border border-slate-200 rounded font-mono text-[11px]"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-[10px] text-slate-400 mb-0.5">{t('Absolute Liters:', 'مساوی لیٹرز (L):')}</label>
                    <input
                      type="number"
                      placeholder="e.g. 5000"
                      value={tankForm.dipChartLiters}
                      onChange={(e) => setTankForm({ ...tankForm, dipChartLiters: e.target.value })}
                      className="w-full bg-white p-1.5 border border-slate-200 rounded font-mono text-[11px]"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleAddTempDipPoint}
                    className="bg-orange-600 text-white px-3 py-1.5 rounded hover:bg-orange-700 font-bold uppercase shrink-0 text-[10px]"
                  >
                    {t('Add Level', 'شامل کریں')}
                  </button>
                </div>

                {/* CURRENT LIST BOX */}
                {tempDipChart.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1.5">
                    {tempDipChart.map((pt, idx) => (
                      <span key={idx} className="bg-slate-100 text-slate-700 text-[10px] py-0.5 px-2 rounded-full inline-flex items-center gap-1">
                        <span className="font-mono">{pt.cm}cm = {pt.liters}L</span>
                        <button type="button" onClick={() => handleRemoveTempDipPoint(idx)} className="text-red-500 hover:text-red-750 font-sans font-bold">×</button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STEP 4: VISUAL CYLINDRICAL GAUGE PREVIEW */}
          {wizardStep === 4 && (
            <div className="space-y-4">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest text-orange-600">
                {t('Step 4: Storage Tank Liquid Gauge Preview:', 'مرحلہ 4: ڈسپلے ریشو سلنڈر ٹینک پری ویو:')}
              </label>

              {/* PREVIEW CONTAINER */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                
                {/* 1. STRUCTURAL DATA */}
                <div className="md:col-span-2 space-y-2.5 text-xs text-slate-600">
                  <div className="flex justify-between border-b border-slate-100 pb-1.5">
                    <span className="font-medium text-slate-400">{t('Unit ID & Tag:', 'ٹینک شناخت اور لیبل:')}</span>
                    <strong className="text-slate-800 uppercase">{tankForm.physicalLabel} — {tankForm.name || t('Unnamed Tank', 'بغیر نام ٹینک')}</strong>
                  </div>
                  <div className="flex justify-between border-b border-slate-100 pb-1.5">
                    <span className="font-medium text-slate-400">{t('Target fuel Product:', 'منسلک بائیو فیول:')}</span>
                    <strong className="text-slate-800">{t(products.find(p => p.id === tankForm.productId)?.name || t('Unknown Product', 'نامعلوم'), '')}</strong>
                  </div>
                  <div className="flex justify-between border-b border-slate-100 pb-1.5">
                    <span className="font-medium text-slate-400">{t('Aggregate Volume:', 'ٹوٹل گنجائش سائز:')}</span>
                    <strong className="text-slate-800 font-mono">{tankForm.capacity.toLocaleString()} Liters</strong>
                  </div>
                  <div className="flex justify-between border-b border-slate-100 pb-1.5">
                    <span className="font-medium text-slate-400">{t('Initial Active Stocks:', 'ایکٹو ابتدائی اسٹاک:')}</span>
                    <strong className="text-emerald-600 font-mono">{tankForm.openingStock.toLocaleString()} Liters</strong>
                  </div>
                  <div className="flex justify-between border-b border-slate-100 pb-1.5 font-mono">
                    <span className="font-medium text-slate-400">{t('Unsafe Warning levels (Critical/Safe):', 'سیکیورٹی واٹر حدود:')}</span>
                    <strong className="text-rose-500 font-bold">{tankForm.criticalLevel}L</strong> / <strong className="text-amber-500 font-bold">{tankForm.safeLevel}L</strong>
                  </div>
                </div>

                {/* 2. INLINE CYLINDRICAL VISUAL DESIGN */}
                <div className="flex flex-col items-center justify-center border-l border-slate-100 pl-4 space-y-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t('Active Liquid Level', 'ٹینک لکویڈ لیول پری ویو')}</span>
                  
                  {/* Cylinder Tube */}
                  <div className="relative w-20 h-40 border-2 border-slate-400 rounded-t-3xl rounded-b-3xl bg-slate-100 overflow-hidden flex flex-col justify-end shadow-inner">
                    <div
                      style={{ height: `${Math.min(100, Math.max(0, (tankForm.openingStock / (tankForm.capacity || 10000)) * 100))}%` }}
                      className="w-full bg-gradient-to-t from-orange-500 to-amber-300 transition-all duration-300 rounded-b-3xl flex items-center justify-center relative shadow-sm"
                    >
                      {/* Fluid ripples effect */}
                      <div className="absolute top-0 left-0 right-0 h-1 bg-white/40 animate-pulse" />
                    </div>

                    {/* Safe limit indicator marker */}
                    <div
                      style={{ bottom: `${(tankForm.safeLevel / (tankForm.capacity || 10000)) * 100}%` }}
                      className="absolute left-0 right-0 h-[2px] bg-amber-500 border-dashed opacity-80"
                      title="Safe level line"
                    />

                    {/* Critical safety indicator marker */}
                    <div
                      style={{ bottom: `${(tankForm.criticalLevel / (tankForm.capacity || 10000)) * 100}%` }}
                      className="absolute left-0 right-0 h-[2px] bg-rose-600 opacity-90"
                      title="Critical level line"
                    />

                    {/* Numeric percentage center label */}
                    <span className="absolute inset-x-0 bottom-2 text-center font-mono text-[10px] font-extrabold text-slate-700 bg-white/50 backdrop-blur-xs py-0.5 select-none">
                      {((tankForm.openingStock / (tankForm.capacity || 1)) * 100).toFixed(0)}%
                    </span>
                  </div>
                  <span className="font-mono text-[9px] text-slate-400">Cap: {tankForm.capacity.toLocaleString()}L</span>
                </div>
              </div>
            </div>
          )}

          {/* CONTROLS AREA */}
          <div className="flex justify-between border-t border-slate-100 pt-3">
            <button
              type="button"
              disabled={wizardStep === 1}
              onClick={handlePrevStep}
              className={`px-3 py-1.5 font-sans text-xs font-bold rounded-lg flex items-center gap-1 ${
                wizardStep === 1
                  ? 'bg-slate-50 text-slate-300 cursor-not-allowed'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>{t('Back', 'پیچھے')}</span>
            </button>

            {wizardStep < 4 ? (
              <button
                type="button"
                onClick={handleNextStep}
                className="px-4 py-1.5 bg-orange-600 hover:bg-orange-700 text-white font-sans text-xs font-bold rounded-lg flex items-center gap-1 cursor-pointer select-none shadow-xs"
              >
                <span>{t('Continue', 'اگلا مرحلہ')}</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSaveTank}
                className="px-5 py-2 bg-orange-600 hover:bg-orange-705 text-white font-sans text-xs font-extrabold rounded-lg flex items-center gap-1 cursor-pointer hover:bg-orange-700 shadow-sm"
              >
                <CheckCircle className="h-4 w-4" />
                <span>{editingTank ? t('PUBLISH TANK PARAMETERS ALTERATION', 'تبدیلیوں کے ساتھ محفوظ کریں (Update)') : t('CONFIRM NEW STORAGE TANK BASE', 'نیا اسٹوریج ٹینک محفوظ کریں (Save)')}</span>
              </button>
            )}
          </div>
        </div>
      ) : (
        /* REGISTERED LIST VIEW - SEPARATE PREVIEWS, EDIT AND DELETE */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {tanks.length === 0 ? (
            <div className="col-span-2">
              <EmptyState
                icon={Database}
                title={t('No tanks added yet.', 'کوئی ٹینک موجود نہیں ہے۔')}
                description={t('Add your first tank to get started.', 'کام شروع کرنے کے لیے اپنا پہلا ٹینک شامل کریں۔')}
                actionLabel={t('+ Add First Tank', '+ پہلا ٹینک شامل کریں')}
                onAction={handleOpenAdd}
              />
            </div>
          ) : (
            tanks.map(tk => {
              const connectedProduct = products.find(p => p.id === tk.productId);
              const stockRatio = tk.capacity > 0 ? tk.currentStock / tk.capacity : 0;
              const warnCritical = tk.currentStock <= tk.criticalLevel;
              const warnSafe = tk.currentStock <= tk.safeLevel;

              return (
                <div key={tk.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs hover:shadow-xs transition-shadow flex items-stretch gap-4 relative overflow-hidden">
                  
                  {/* Vertical Level Cylinder Preview Column */}
                  <div className="w-12 bg-slate-50 border border-slate-100 rounded-lg p-1.5 flex flex-col items-center justify-between shrink-0">
                    <span className="font-mono text-[9px] font-bold text-slate-400 select-none uppercase">{tk.physicalLabel || 'T'}</span>
                    
                    {/* Visual Cylinder Gauge minified */}
                    <div className="relative w-6 h-16 border border-slate-400 bg-white rounded-md overflow-hidden flex flex-col justify-end shadow-2xs">
                      <div
                        style={{ height: `${Math.min(100, Math.max(0, stockRatio * 100))}%` }}
                        className={`w-full ${
                          warnCritical
                            ? 'bg-rose-500'
                            : warnSafe
                            ? 'bg-amber-400'
                            : 'bg-emerald-500'
                        }`}
                      />
                    </div>
                    <span className="font-mono text-[9px] font-extrabold text-slate-650">{(stockRatio * 100).toFixed(0)}%</span>
                  </div>

                  {/* Text Details Area */}
                  <div className="flex-1 flex flex-col justify-between py-0.5">
                    <div>
                      <div className="flex justify-between items-start">
                        <h4 className="font-sans text-xs font-bold text-slate-800 uppercase tracking-tight">{tk.name}</h4>
                        <span className="font-mono text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full select-none font-bold uppercase">{tk.physicalLabel}</span>
                      </div>
                      
                      <div className="mt-2 grid grid-cols-2 gap-1.5 font-sans leading-relaxed text-[11px] text-slate-500">
                        <div>
                          {t('Product Type:', 'پراڈکٹ:')}{' '}
                          <strong className="text-slate-800">{connectedProduct ? t(connectedProduct.name, connectedProduct.urduName) : tk.productId}</strong>
                        </div>
                        <div>
                          {t('Calibration Stock:', 'موجودہ مقدار:')}{' '}
                          <strong className="text-slate-800 font-mono">{tk.currentStock?.toLocaleString()} L</strong>
                        </div>
                        <div>
                          {t('Safeguard warning:', 'سیف لمیٹ حدود:')}{' '}
                          <strong className="text-amber-500 font-mono font-bold">{tk.safeLevel}L</strong>
                        </div>
                        <div>
                          {t('Critical Alarm line:', 'خطرہ فیس لیول:')}{' '}
                          <strong className="text-rose-500 font-mono font-bold">{tk.criticalLevel}L</strong>
                        </div>
                      </div>
                    </div>

                    {/* SEPARATE ALTER ACTION CONTROLS */}
                    <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100/60 mt-3 select-none">
                      <button
                        onClick={() => handleOpenEdit(tk)}
                        className="text-xs text-orange-600 hover:text-orange-850 inline-flex items-center gap-1 cursor-pointer font-bold select-none"
                      >
                        <Edit className="h-3.5 w-3.5" />
                        <span>{t('Change Config (Update)', 'تبدیل کریں')}</span>
                      </button>

                      <button
                        onClick={() => handleDeleteTankRecord(tk.id)}
                        className="text-xs text-red-500 hover:text-red-700 inline-flex items-center gap-1 cursor-pointer font-bold select-none"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        <span>{t('Delete Unit (Delete)', 'حذف کریں')}</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

// Inline support component for modal X sign
function XButton({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18s12-12 12-12M6 6s12 12 12 12" />
    </svg>
  );
}
