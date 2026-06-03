import React, { useState } from 'react';
import { Sliders, ChevronRight, ArrowLeft, Trash2, Edit, CheckCircle, Info, Fuel, Plus } from 'lucide-react';
import { useStation } from '../../../contexts/StationContext';
import { Nozzle, Tank, Pump, Product } from '../../../types';
import EmptyState from '../../ui/EmptyState';
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

export default function NozzleWizard({
  nozzles,
  pumps,
  tanks,
  products,
  language,
  onAddNozzle,
  onUpdateNozzle,
  onDeleteNozzle,
  onLogAudit
}: NozzleWizardProps) {
  const { showConfirm, showToast } = useStation();
  const t = (en: string, ur: string) => translate(en, ur, language);

  // States
  const [wizardStep, setWizardStep] = useState<number>(1);
  const [editingNozzle, setEditingNozzle] = useState<Nozzle | null>(null);
  const [showForm, setShowForm] = useState<boolean>(false);

  // Nozzle parameters state
  const [nozzleForm, setNozzleForm] = useState({
    name: '',
    pumpId: '',
    productId: '',
    tankId: '',
    startReading: 100000,
    currentReading: 100000
  });

  const handleOpenAdd = () => {
    setEditingNozzle(null);
    setNozzleForm({
      name: 'Nozzle ' + (nozzles.length + 1),
      pumpId: pumps[0]?.id || '',
      productId: products[0]?.id || '',
      tankId: tanks[0]?.id || '',
      startReading: 150000,
      currentReading: 150000
    });
    setWizardStep(1);
    setShowForm(true);
  };

  const handleOpenEdit = (nz: Nozzle) => {
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

  const handleNextStep = () => {
    if (wizardStep === 1) {
      if (!nozzleForm.productId) {
        showToast(t('Please select a fuel product type!', 'براہ کرم پٹرولیم پراڈکٹ منتخب کریں!'), 'error');
        return;
      }
    }
    if (wizardStep === 2) {
      if (!nozzleForm.tankId) {
        showToast(t('Please choose a connected supply tank!', 'براہ کرم منسلک اسٹوریج ٹینک منتخب کریں!'), 'error');
        return;
      }
    }
    if (wizardStep === 3) {
      if (!nozzleForm.pumpId) {
        showToast(t('Please link a dispenser pump station!', 'براہ کرم پمپ اسٹیشن لنک کریں!'), 'error');
        return;
      }
    }
    if (wizardStep === 4) {
      if (!nozzleForm.name) {
        showToast(t('Please enter a nozzle name / position label!', 'براہ کرم نوزل کا مخصوص نام کوڈ لکھیں!'), 'error');
        return;
      }
    }
    if (wizardStep === 5) {
      if (nozzleForm.startReading < 0 || nozzleForm.currentReading < 0) {
        showToast(t('Meter readings cannot be negative values!', 'میٹر ریڈنگ صفر سے کم نہیں ہوسکتی!'), 'error');
        return;
      }
    }
    setWizardStep(prev => prev + 1);
  };

  const handlePrevStep = () => {
    setWizardStep(prev => Math.max(1, prev - 1));
  };

  const handleSaveNozzle = () => {
    if (editingNozzle) {
      onUpdateNozzle({
        ...editingNozzle,
        name: nozzleForm.name,
        pumpId: nozzleForm.pumpId,
        productId: nozzleForm.productId,
        tankId: nozzleForm.tankId,
        startReading: Number(nozzleForm.startReading),
        currentReading: Number(nozzleForm.currentReading)
      });

      onLogAudit(
        'Nozzle',
        'Update',
        `Nozzle hardware "${nozzleForm.name}" (ID: ${editingNozzle.id}) linked to tank: ${nozzleForm.tankId} updated.`
      );
    } else {
      const newNz: Nozzle = {
        id: 'nz_' + Date.now(),
        name: nozzleForm.name,
        pumpId: nozzleForm.pumpId,
        productId: nozzleForm.productId,
        tankId: nozzleForm.tankId,
        startReading: Number(nozzleForm.startReading),
        currentReading: Number(nozzleForm.currentReading)
      };
      onAddNozzle(newNz);

      onLogAudit(
        'Nozzle',
        'Create',
        `New mechanical nozzle "${nozzleForm.name}" registered under pump ${nozzleForm.pumpId} & tank ${nozzleForm.tankId}.`
      );
    }

    setShowForm(false);
    showToast(t('Nozzle hardware mapping registered successfully!', 'نوزل ترتیب کامیابی سے محفوظ ہو گئی!'), 'success');
  };

  const handleDeleteNozzleRecord = (id: string) => {
    showConfirm(
      t('Confirm Nozzle Deletion', 'نوزل حذف کرنے کی تصدیق'),
      t('Are you sure you want to delete this hardware nozzle? Shifts with archived logs might get disturbed.', 'کیا آپ واقعی اس نوزل کو ڈیلیٹ کرنا چاہتے ہیں؟'),
      () => {
        const nz = nozzles.find(n => n.id === id);
        onDeleteNozzle(id);
        onLogAudit('Nozzle', 'Delete', `Hardware Nozzle "${nz?.name}" (ID: ${id}) was deleted manuals.`);
        showToast(t('Nozzle removed successfully.', 'نوزل کو کامیابی سے خارج کر دیا گیا ہے۔'), 'success');
      }
    );
  };

  // Filter tanks matching the selected fuel type
  const matchingTanks = tanks.filter(t => t.productId === nozzleForm.productId);

  return (
    <div className="space-y-6">
      {/* HEADER CONTROLS */}
      <div className="flex justify-between items-center bg-slate-50 p-3 rounded-lg border border-slate-200">
        <span className="text-xs text-slate-500 font-sans font-medium">
          {t('Configure physical dispensers, match with storage tanks and initialize starting meter wheels.', 'پٹرول نوزلز، پمپ پوزیشن اور ابتدائی ڈیجیٹل میٹر تضادات یہاں ترتیب دیں۔')}
        </span>
        {!showForm && (
          <button
            onClick={handleOpenAdd}
            className="px-3 py-1.5 bg-orange-600 hover:bg-orange-700 text-white font-sans text-xs font-bold rounded-lg flex items-center gap-1 cursor-pointer shadow-xs whitespace-nowrap"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>{t('Link Hardware Nozzle', 'نیا نوزل شامل کریں')}</span>
          </button>
        )}
      </div>

      {showForm ? (
        /* WIZARD BUILDER */
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h4 className="font-sans text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <Fuel className="h-4.5 w-4.5 text-orange-600" />
              <span>{editingNozzle ? t('Modify Nozzle Hardware', 'نوزل ترتیب تبدیل کریں') : t('Register Nozzle Dispenser', 'نیا نوزل کنفیگر کریں')}</span>
            </h4>
            <div className="flex items-center gap-2">
              <span className="text-[10px] bg-orange-50 text-orange-700 px-2.5 py-0.5 rounded-full font-sans font-bold">
                {t(`Step ${wizardStep} of 6`, `مرحلہ ${wizardStep} سے 6`)}
              </span>
              <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600">×</button>
            </div>
          </div>

          {/* STEPPER METALLIC DOTS */}
          <div className="flex items-center justify-center gap-2 py-1 max-w-sm mx-auto">
            {[1, 2, 3, 4, 5, 6].map(idx => (
              <div key={idx} className="flex-1 flex items-center gap-0.5">
                <div className={`h-2 w-2 rounded-full ${wizardStep >= idx ? 'bg-orange-600' : 'bg-slate-200'}`} />
                {idx < 6 && <div className={`flex-1 h-[2px] ${wizardStep > idx ? 'bg-orange-600' : 'bg-slate-200'}`} />}
              </div>
            ))}
          </div>

          {/* STEP 1: FUEL PRODUCT */}
          {wizardStep === 1 && (
            <div className="space-y-3 font-sans text-xs">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest">
                {t('Step 1: Select Nozzle Fuel Type Product:', 'مرحلہ 1: پٹرولیم فیول کی پراڈکٹ منتخب کریں:')}
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {products.length === 0 ? (
                  <div className="md:col-span-2 py-6 text-center text-slate-400">
                    {t('Please configure active fuel products first!', 'پہلے فیول پراڈکٹ شامل کریں۔')}
                  </div>
                ) : (
                  products.map(p => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setNozzleForm(prev => ({ ...prev, productId: p.id, tankId: tanks.find(tk => tk.productId === p.id)?.id || '' }))}
                      className={`p-4 rounded-xl border text-left flex items-center justify-between transition-all ${
                        nozzleForm.productId === p.id
                          ? 'border-orange-500 bg-orange-50/15'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div>
                        <span className="block font-sans font-bold text-slate-800">{t(p.name, p.urduName)}</span>
                        <span className="block text-[9px] text-slate-400 font-mono mt-0.5">Unit: {p.unit}</span>
                      </div>
                      <span className="font-mono font-extrabold text-orange-600">Rs. {p.rate?.toFixed(2)}</span>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}

          {/* STEP 2: CONNECTED TANK */}
          {wizardStep === 2 && (
            <div className="space-y-3 font-sans text-xs">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest">
                {t('Step 2: Assign Connected Liquid Storage Tank:', 'مرحلہ 2: منسلک اسٹوریج ٹینک لنک کریں:')}
              </label>

              {matchingTanks.length === 0 ? (
                <div className="p-5 border border-dashed rounded-lg bg-orange-50/10 text-center text-slate-500 text-[11px] leading-relaxed">
                  {t('No registered storage tanks matching this product type yet! Configure matching tanks first.', 'اس بائیو فیول مصنوع کیلئے رجسٹرڈ ٹینک موجود نہیں، پہلے پٹرول اسٹوریج ٹینکس ٹیب میں ٹینک بنائیں')}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {matchingTanks.map(t => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setNozzleForm(p => ({ ...p, tankId: t.id }))}
                      className={`p-4 rounded-xl border text-left transition-all flex items-center justify-between ${
                        nozzleForm.tankId === t.id
                          ? 'border-orange-500 bg-orange-50/15'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div>
                        <span className="block font-sans font-bold text-slate-800 uppercase leading-none">{t.physicalLabel}</span>
                        <span className="block text-[10px] text-slate-500 mt-1">{t.name}</span>
                      </div>
                      <span className="font-mono text-[10px] bg-slate-100 text-slate-650 rounded-full px-2 py-0.5 font-bold">
                        {t.currentStock.toLocaleString()} L
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* STEP 3: PUMP LINKING */}
          {wizardStep === 3 && (
            <div className="space-y-3 font-sans text-xs">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest">
                {t('Step 3: Link Associated Pump Dispatch Station Unit:', 'مرحلہ 3: پمپ اسٹیشن کے ساتھ لنک کریں:')}
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {pumps.length === 0 ? (
                  <div className="col-span-2 py-6 text-center text-slate-400">
                    {t('No pump machine stations registered yet! Configure pump machines first.', 'کوئی پمپ اسٹینڈ رکارڈ نہیں ہے، پہلے نیا پمپ مینیجر شامل کریں۔')}
                  </div>
                ) : (
                  pumps.map(p => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setNozzleForm(prev => ({ ...prev, pumpId: p.id }))}
                      className={`p-3.5 rounded-xl border text-left transition-all ${
                        nozzleForm.pumpId === p.id
                          ? 'border-orange-500 bg-orange-50/15'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <strong className="block text-slate-850 font-sans font-bold text-xs">{p.name}</strong>
                      <span className="block text-[9px] text-slate-450 uppercase tracking-wider font-mono mt-0.5">Dispenser Machine ID: {p.id}</span>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}

          {/* STEP 4: POSITION & IDENTIFICATION */}
          {wizardStep === 4 && (
            <div className="space-y-3 font-sans text-xs">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest">
                {t('Step 4: Set Nozzle Name & Location Side Tag:', 'مرحلہ 4: نوزل کا مخصوص نام اور سمت نشان:')}
              </label>

              <div className="space-y-1">
                <label className="block text-slate-550 font-bold mb-1">{t('Nozzle Display Label / Side:', 'شناختی نام یا لوکیشن کوڈ (مثال کے طور Nozzle 1A):')}</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Nozzle 1-A / Petrol Side"
                  value={nozzleForm.name}
                  onChange={(e) => setNozzleForm({ ...nozzleForm, name: e.target.value })}
                  className="w-full rounded-lg border border-slate-205 px-3 py-2 outline-hidden focus:border-orange-500"
                />
              </div>
            </div>
          )}

          {/* STEP 5: METER REGISTRATION */}
          {wizardStep === 5 && (
            <div className="space-y-4 font-sans text-xs">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest">
                {t('Step 5: Initialize Starting Mechanical Meter Wheels:', 'مرحلہ 5: میٹر کی ابتدائی اور موجودہ ریڈنگ سیٹ کریں:')}
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-550 font-bold mb-1">{t('Opening Meter Reading (Ltrs):', 'ابتدائی میٹر ریڈنگ (لیٹرز):')}</label>
                  <input
                    type="number"
                    required
                    value={nozzleForm.startReading}
                    onChange={(e) => setNozzleForm({ ...nozzleForm, startReading: Number(e.target.value), currentReading: Number(e.target.value) })}
                    className="w-full rounded-lg border border-slate-205 px-3 py-2 outline-hidden focus:border-orange-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-550 font-bold mb-1">{t('Current Active Meter (Ltrs):', 'موجودہ ایکٹو ریڈنگ (لیٹرز):')}</label>
                  <input
                    type="number"
                    required
                    value={nozzleForm.currentReading}
                    onChange={(e) => setNozzleForm({ ...nozzleForm, currentReading: Number(e.target.value) })}
                    className="w-full rounded-lg border border-slate-205 px-3 py-2 outline-hidden focus:border-orange-550 font-mono"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 6: GAS HOSE HANDLE PREVIEW */}
          {wizardStep === 6 && (
            <div className="space-y-4">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest text-orange-600">
                {t('Step 6: Live Hardware Mockup Preview:', 'مرحلہ 6: نوزل ہارڈویئر ڈیزائن موک اپ پری ویو:')}
              </label>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                {/* Visual Specifications Summary card */}
                <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 text-xs text-slate-650 space-y-2.5">
                  <div className="flex justify-between border-b pb-1">
                    <span className="text-slate-400 font-medium">{t('Nozzle ID & Position:', 'نوزل شناخت کوڈ:')}</span>
                    <strong className="text-slate-800 uppercase">{nozzleForm.name}</strong>
                  </div>
                  <div className="flex justify-between border-b pb-1">
                    <span className="text-slate-400 font-medium">{t('Assigned Material:', 'منسلک بائیو فیول پراڈکٹ:')}</span>
                    <strong className="text-slate-800">{t(products.find(p => p.id === nozzleForm.productId)?.name || '', '')}</strong>
                  </div>
                  <div className="flex justify-between border-b pb-1">
                    <span className="text-slate-400 font-medium">{t('Connected Supply Storage:', 'منسلک پٹرول اسٹوریج ٹینک:')}</span>
                    <strong className="text-slate-800 font-mono uppercase">{tanks.find(t=>t.id===nozzleForm.tankId)?.physicalLabel || t('None', 'کوئی نہیں')}</strong>
                  </div>
                  <div className="flex justify-between border-b pb-1">
                    <span className="text-slate-400 font-medium">{t('Initial meter starting reading:', 'ابتدائی میٹر لیٹر:')}</span>
                    <strong className="text-slate-850 font-mono">{nozzleForm.startReading.toLocaleString()} Ltrs</strong>
                  </div>
                  <div className="flex justify-between pb-1">
                    <span className="text-slate-400 font-medium">{t('Dispenser Station Unit:', 'پمپ ہارڈویئر منسلک پوزیشن:')}</span>
                    <strong className="text-slate-850 uppercase">{pumps.find(p=>p.id===nozzleForm.pumpId)?.name || 'Pump Unit'}</strong>
                  </div>
                </div>

                {/* Simulated nozzle mockup */}
                <div className="border border-slate-150 p-4 rounded-xl flex items-center justify-center gap-4 bg-slate-50/50">
                  {/* Graphical gas handle handle */}
                  <div className="relative w-14 h-24 bg-slate-800 rounded-xl flex items-center justify-center relative shadow-xs shrink-0 border-2 border-slate-600">
                    <div className="absolute top-1/2 -translate-y-1/2 left-full w-6 h-3 bg-slate-500 border border-slate-400 rounded-r-md flex items-center justify-end" />
                    {/* Metal cylinder spout */}
                    <div className="absolute top-[35%] left-full w-10 h-1.5 bg-silver border border-slate-400 rounded-r-full rotate-[-15deg] origin-left bg-slate-400" />
                    {/* Fuel product label marker sticker */}
                    <div className="w-10 h-10 rounded-full bg-orange-600 flex items-center justify-center text-white text-[9px] font-sans font-black uppercase">
                      {nozzleForm.name.slice(0, 3)}
                    </div>
                  </div>

                  <div className="text-xs">
                    <span className="block text-[10px] font-bold text-slate-400 uppercase">{t('Dispenser Status', 'ڈسپنسر اسٹیٹس')}</span>
                    <span className="block font-sans font-bold text-emerald-600 flex items-center gap-1 mt-0.5">
                      <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulseinline-block" />
                      <span>{t('Active Mapping Ready', 'رابطہ درست اور ایکٹو')}</span>
                    </span>
                    <p className="text-[10px] text-slate-500 leading-normal mt-1 max-w-[130px]">
                      {t('Linked cleanly. Submitting registers mechanical gears instantly.', 'طبعی ترتیب درست ہے۔ سیو کرنے پر پمپ مشین سے منکشف ہو جائے گا۔')}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ACTIONS ROW */}
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

            {wizardStep < 6 ? (
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
                onClick={handleSaveNozzle}
                className="px-5 py-2 bg-orange-600 hover:bg-orange-705 text-white font-sans text-xs font-extrabold rounded-lg flex items-center gap-1 cursor-pointer hover:bg-orange-700 shadow-sm"
              >
                <CheckCircle className="h-4 w-4" />
                <span>{editingNozzle ? t('PUBLISH NOZZLE ALTERATION (UPDATE)', 'تبدیلی کے ساتھ محفوظ کریں') : t('REGISTER NEW NOZZLE MAPPING (SAVE)', 'ہارڈویئر نوزل محفوظ کریں')}</span>
              </button>
            )}
          </div>
        </div>
      ) : (
        /* REGISTERED LIST VIEW - SEPARATE PREVIEWS & CONTROLS */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {nozzles.length === 0 ? (
            <div className="col-span-2">
              <EmptyState
                icon={Fuel}
                title={t('No nozzles configured.', 'کوئی نوزل موجود نہیں ہے۔')}
                description={t('Configure physical dispensers, match with storage tanks.', 'کام شروع کرنے کے لیے اپنے فیول ڈسپنسرز اٹیچ کریں۔')}
                actionLabel={t('+ Add First Nozzle', '+ پہلا نوزل لنک کریں')}
                onAction={handleOpenAdd}
              />
            </div>
          ) : (
            nozzles.map(nz => {
              const linkedTank = tanks.find(t => t.id === nz.tankId);
              const linkedPump = pumps.find(p => p.id === nz.pumpId);
              const linkedProd = products.find(p => p.id === nz.productId);

              return (
                <div key={nz.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs hover:shadow-xs transition-shadow flex gap-4 relative overflow-hidden">
                  
                  {/* Decorative Side gas pump column */}
                  <div className="w-10 bg-slate-50 border border-slate-100 rounded-lg p-1.5 flex flex-col items-center justify-center shrink-0">
                    <Fuel className="h-5 w-5 text-orange-600" />
                    <span className="font-mono text-[9px] font-bold text-slate-400 mt-1 select-none">ACT</span>
                  </div>

                  {/* Details block */}
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start">
                        <h4 className="font-sans text-xs font-bold text-slate-800 uppercase tracking-tight">{nz.name}</h4>
                        <span className="text-[10px] bg-slate-100 text-slate-650 rounded-full px-2 py-0.5 leading-none font-mono font-bold">
                          {linkedProd ? t(linkedProd.name, linkedProd.urduName).split(' ')[0] : 'Fuel'}
                        </span>
                      </div>

                      <div className="mt-2 grid grid-cols-2 gap-1.5 font-sans text-[11px] text-slate-550 leading-relaxed">
                        <div>
                          {t('Connected Tank ID:', 'ٹینک کنکشن:')}{' '}
                          <strong className="text-slate-800 uppercase font-mono">{linkedTank ? linkedTank.physicalLabel : 'N/A'}</strong>
                        </div>
                        <div>
                          {t('At Pump Machine:', 'پمپ اسٹینڈ:')}{' '}
                          <strong className="text-slate-800">{linkedPump ? linkedPump.name : 'Unknown'}</strong>
                        </div>
                        <div>
                          {t('Opening Meter Wheel:', 'ابتدائی میٹر:')}{' '}
                          <strong className="text-slate-700 font-mono">{(nz.startReading || 0).toLocaleString()} L</strong>
                        </div>
                        <div>
                          {t('Current active meter:', 'موجودہ میٹر:')}{' '}
                          <strong className="text-emerald-600 font-mono font-bold">{(nz.currentReading || 0).toLocaleString()} L</strong>
                        </div>
                      </div>
                    </div>

                    {/* SEPARATE ACTIONS LIST */}
                    <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100/60 mt-3 select-none">
                      <button
                        onClick={() => handleOpenEdit(nz)}
                        className="text-xs text-orange-600 hover:text-orange-850 inline-flex items-center gap-1 cursor-pointer font-bold select-none"
                      >
                        <Edit className="h-3.5 w-3.5" />
                        <span>{t('Change Config (Update)', 'تبدیل کریں')}</span>
                      </button>

                      <button
                        onClick={() => handleDeleteNozzleRecord(nz.id)}
                        className="text-xs text-red-500 hover:text-red-700 inline-flex items-center gap-1 cursor-pointer font-bold select-none"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        <span>{t('Remove Hardware (Delete)', 'حذف کریں')}</span>
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
