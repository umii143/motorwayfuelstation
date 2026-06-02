import React, { useState, useMemo } from 'react';
import { DollarSign, ChevronRight, Activity, Trash2, CheckCircle, Info, Edit, ArrowLeft } from 'lucide-react';
import { Product, Tank, RateHistoryEntry } from '../../../types';
import { t as translate } from '../../../lib/translations';

interface RateWizardProps {
  products: Product[];
  tanks: Tank[];
  rateHistory: RateHistoryEntry[];
  language: string;
  onUpdateProductRate: (
    productId: string,
    newRate: number,
    reason?: string,
    changedBy?: string,
    dateStr?: string
  ) => void;
  onLogAudit: (category: string, action: string, details: string) => void;
  onUpdateProducts?: (products: Product[]) => void;
}

export default function RateWizard({
  products,
  tanks,
  rateHistory,
  language,
  onUpdateProductRate,
  onLogAudit,
  onUpdateProducts
}: RateWizardProps) {
  const t = (en: string, ur: string) => translate(en, ur, language);

  // States
  const [wizardStep, setWizardStep] = useState<number>(1);
  const [selectedProduct, setSelectedProduct] = useState<string>('');
  const [targetRate, setTargetRate] = useState<string>('');
  const [rateReason, setRateReason] = useState<string>('OGRA Fortnight Circular');
  const [rateEffectiveDate, setRateEffectiveDate] = useState<string>(() => {
    return new Date().toISOString().substring(0, 16);
  });
  const [rateAuthor, setRateAuthor] = useState<string>('Sajid Mahmood (Manager)');
  const [timeFilter, setTimeFilter] = useState<'all' | 'weekly' | 'monthly' | 'yearly'>('all');

  // Time filter checking helper
  const isWithinTimeFilter = (dateStr?: string) => {
    if (!dateStr) return true;
    if (timeFilter === 'all') return true;
    const baseline = new Date('2026-06-01');
    const target = new Date(dateStr);
    if (isNaN(target.getTime())) return true;
    const diffDays = (baseline.getTime() - target.getTime()) / (1000 * 3600 * 24);
    if (timeFilter === 'weekly') return diffDays >= 0 && diffDays <= 7;
    if (timeFilter === 'monthly') return diffDays >= 0 && diffDays <= 30;
    if (timeFilter === 'yearly') return diffDays >= 0 && diffDays <= 365;
    return true;
  };

  const filteredRateHistory = useMemo(() => {
    return rateHistory.filter(entry => isWithinTimeFilter(entry.date));
  }, [rateHistory, timeFilter]);

  const kpiStats = useMemo(() => {
    const fuelProducts = products.filter(p => p.type === 'fuel');
    const activeFuelsCount = fuelProducts.length;
    const revisionsCount = filteredRateHistory.length;
    const avgTariff = activeFuelsCount > 0 ? (fuelProducts.reduce((sum, p) => sum + (p.rate || 0), 0) / activeFuelsCount) : 0;
    const lastAlteration = filteredRateHistory[0]
      ? new Date(filteredRateHistory[0].date).toLocaleDateString()
      : '—';

    return {
      activeFuelsCount,
      revisionsCount,
      avgTariff,
      lastAlteration
    };
  }, [products, filteredRateHistory]);

  // Selected Product Information
  const activeProduct = products.find(p => p.id === selectedProduct);
  const relevantTanks = tanks.filter(t => t.productId === selectedProduct);
  const estimatedStock = relevantTanks.reduce((sum, tk) => sum + tk.currentStock, 0) || (activeProduct?.currentStock || 0);

  // Compute Impact before saving
  const currentRate = activeProduct?.rate || 0;
  const numNewRate = Number(targetRate) || 0;
  const rateDiff = numNewRate - currentRate;
  const priceImpact = rateDiff * estimatedStock;

  // Manual History Edit/Delete states
  const [editingLogId, setEditingLogId] = useState<string | null>(null);
  const [editLogForm, setEditLogForm] = useState<Partial<RateHistoryEntry>>({});

  const handleNextStep = () => {
    if (wizardStep === 1 && !selectedProduct) {
      alert(t('Please select a product first!', 'براہ کرم پہلے پروڈکٹ منتخب کریں!'));
      return;
    }
    if (wizardStep === 2) {
      if (!targetRate || isNaN(Number(targetRate)) || Number(targetRate) <= 0) {
        alert(t('Please enter a valid decimal rate!', 'براہ کرم درست ریٹ نمبر درج کریں!'));
        return;
      }
    }
    setWizardStep(prev => prev + 1);
  };

  const handlePrevStep = () => {
    setWizardStep(prev => Math.max(1, prev - 1));
  };

  const handleSaveRate = () => {
    if (!selectedProduct || !targetRate) return;
    const rateVal = Number(targetRate);

    // Update state via callback in App
    onUpdateProductRate(
      selectedProduct,
      rateVal,
      rateReason,
      rateAuthor,
      rateEffectiveDate.replace('T', ' ')
    );

    // Log the Audit alteration
    onLogAudit(
      'Tariff',
      'Update Rate',
      `Product ${activeProduct?.name} tariff updated from Rs. ${currentRate.toFixed(2)} to Rs. ${rateVal.toFixed(2)}. Authorized by ${rateAuthor}. Stock impact: Rs. ${priceImpact.toFixed(2)}`
    );

    // Reset Form
    setSelectedProduct('');
    setTargetRate('');
    setWizardStep(1);
    alert(t('Tariff rate updated and inventory value readjusted!', 'پٹرولیم ریٹس کامیابی سے تبدیل ہو گئے!'));
  };

  const handleDeleteHistoryLog = (id: string) => {
    const confirmDelete = window.confirm(t('Are you sure you want to delete this historical rate entry?', 'کیا آپ واقعی اس ریٹ ہسٹری لاگ کو ڈیلیٹ کرنا چاہتے ہیں؟'));
    if (!confirmDelete) return;

    // Remove log element and notify
    const entry = rateHistory.find(r => r.id === id);
    onLogAudit('Tariff', 'Delete Log', `Historical rate entry for ${entry?.productId} on ${entry?.date} was manually deleted.`);
    alert(t('History log record deleted.', 'تاریخی لاگ ریکارڈ خارج کر دیا گیا ہے۔'));
  };

  return (
    <div className="space-y-6">

      {/* HEADER SECTION WITH INTEGRATED DYNAMIC TIME FILTER */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between border-b border-slate-200 pb-2">
        <div>
          <span className="font-mono text-[9px] font-black text-orange-600 uppercase tracking-widest block mb-0.5">TARIFF CONTROL CENTER</span>
          <h2 className="font-sans text-xl font-black tracking-tight text-slate-950 flex items-center gap-2">
            <DollarSign className="h-5.5 w-5.5 text-orange-600 animate-pulse" />
            <span>{t('Certified Pricing & Gas Tariffs', 'سرٹیفائیڈ قیمت و پٹرولیم نرخ کنٹرول ڈیش بورڈ')}</span>
          </h2>
          <p className="font-sans text-xs text-slate-500 mt-1">
            {t('Review active nozzle unit pricing, execute formal OGRA oil tariffs transitions and track historic pricing timeline.', 'فعال نوزل کی قیمتوں کا موازنہ کرنے، اوگرا نوٹیفکیشن جاری کرنے اور تاریخی ریٹ لاگ آڈٹ کا خودکار مرکز۔')}
          </p>
        </div>

        {/* TIME FILTER & TRIGGER ROW */}
        <div className="flex bg-slate-100 rounded-lg p-1 border border-slate-200 shadow-sm shrink-0 self-start lg:self-center">
          {(['all', 'weekly', 'monthly', 'yearly'] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => setTimeFilter(filter)}
              className={`px-3 py-1.5 font-sans text-[11px] font-bold uppercase tracking-wider rounded-md transition-all cursor-pointer ${
                timeFilter === filter
                  ? 'bg-orange-600 text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
              }`}
            >
              {filter === 'all' && t('All-Time', 'کل وقت')}
              {filter === 'weekly' && t('Weekly', 'ہفتہ وار')}
              {filter === 'monthly' && t('Monthly', 'ماہانہ')}
              {filter === 'yearly' && t('Yearly', 'سالانہ')}
            </button>
          ))}
        </div>
      </div>

      {/* DYNAMIC KPI CARDS SECTION */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* AMBER CARD - AVERAGE FUEL PRICE */}
        <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-5 shadow-xs flex flex-col justify-between min-h-[110px] relative overflow-hidden">
          <div className="flex items-start justify-between">
            <div>
              <span className="font-mono text-[9px] font-black text-amber-800 uppercase tracking-widest block mb-1">AVERAGE UNIT TARIFF</span>
              <h3 className="font-sans text-2xl font-black text-amber-900 mt-1 whitespace-nowrap animate-pulse">
                Rs. {kpiStats.avgTariff.toFixed(2)}
              </h3>
            </div>
            <div className="rounded-xl bg-amber-100 p-2 text-amber-700 animate-bounce">
              <DollarSign className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 flex items-center gap-1 text-[10px] text-amber-700 font-bold">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
            <span>Mean tariff across petroleum grades</span>
          </div>
        </div>

        {/* GREEN CARD - ACTIVE FUEL PRODUCTS */}
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-5 shadow-xs flex flex-col justify-between min-h-[110px] relative overflow-hidden">
          <div className="flex items-start justify-between">
            <div>
              <span className="font-mono text-[9px] font-black text-emerald-800 uppercase tracking-widest block mb-1">FUEL COMMODITIES</span>
              <h3 className="font-sans text-2xl font-black text-emerald-900 mt-1">
                {kpiStats.activeFuelsCount} {t('Grades', 'گریڈز')}
              </h3>
            </div>
            <div className="rounded-xl bg-emerald-100 p-2 text-emerald-700">
              <Activity className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 flex items-center gap-1 text-[10px] text-emerald-700 font-bold">
            <span>{t('Active octane fuels & high-speed diesels', 'انڈسٹری کے فعال پٹرول گریڈز')}</span>
          </div>
        </div>

        {/* CRIMSON CARD - REVISIONS COUNT IN SELECTION */}
        <div className="rounded-2xl border border-rose-200 bg-rose-50/60 p-5 shadow-xs flex flex-col justify-between min-h-[110px] relative overflow-hidden">
          <div className="flex items-start justify-between">
            <div>
              <span className="font-mono text-[9px] font-black text-rose-800 uppercase tracking-widest block mb-1">PERIOD ALTERATIONS</span>
              <h3 className="font-sans text-2xl font-black text-rose-900 mt-1">
                {kpiStats.revisionsCount} {t('Changes', 'تبدیلیاں')}
              </h3>
            </div>
            <div className="rounded-xl bg-rose-100 p-2 text-rose-700">
              <Trash2 className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 flex items-center gap-1 text-[10px] text-rose-700 font-bold">
            <span>Official price revisions in period</span>
          </div>
        </div>

        {/* BLUE CARD - LAST TARIFF TRANSITION DATE */}
        <div className="rounded-2xl border border-blue-200 bg-blue-50/60 p-5 shadow-xs flex flex-col justify-between min-h-[110px] relative overflow-hidden">
          <div className="flex items-start justify-between">
            <div>
              <span className="font-mono text-[9px] font-black text-blue-800 uppercase tracking-widest block mb-1">LAST REVISED DATE</span>
              <h3 className="font-sans text-sm font-extrabold text-blue-900 mt-2 truncate max-w-full">
                {kpiStats.lastAlteration}
              </h3>
            </div>
            <div className="rounded-xl bg-blue-100 p-2 text-blue-700">
              <CheckCircle className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 flex items-center gap-1 text-[10px] text-blue-700 font-bold text-ellipsis overflow-hidden whitespace-nowrap">
            <span>Most recent official OGRA action</span>
          </div>
        </div>
      </div>

      {/* WIZARD CARD PANEL */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="font-sans text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <DollarSign className="h-4.5 w-4.5 text-emerald-600" />
            <span>{t('Certified Pricing Manager', 'سرٹیفائیڈ قیمت مینیجر')}</span>
          </h3>
          <span className="text-[10px] bg-emerald-50 text-emerald-700 px-2.5 py-0.5 rounded-full font-sans font-bold">
            {t(`Step ${wizardStep} of 4`, `مرحلہ ${wizardStep} سے 4`)}
          </span>
        </div>

        {/* STEPPER METADATA TRAIL */}
        <div className="flex items-center justify-center gap-2 py-1 max-w-md mx-auto">
          {[1, 2, 3, 4].map(idx => (
            <div key={idx} className="flex-1 flex items-center gap-1">
              <div className={`h-2.5 w-2.5 rounded-full ${wizardStep >= idx ? 'bg-emerald-600' : 'bg-slate-200'}`} />
              {idx < 4 && <div className={`flex-1 h-[2px] ${wizardStep > idx ? 'bg-emerald-600' : 'bg-slate-200'}`} />}
            </div>
          ))}
        </div>

        {/* STEP 1: CHOOSE FUEL TYPE */}
        {wizardStep === 1 && (
          <div className="space-y-3">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest">
              {t('Step 1: Select Fuel Product to Adjust:', 'مرحلہ 1: پٹرول یا ڈیزل پراڈکٹ منتخب کریں:')}
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {products.length === 0 ? (
                <div className="md:col-span-2 py-6 text-center text-slate-400 text-xs border border-dashed border-slate-200 rounded-lg">
                  {t('No registered products yet! Add products in settings first.', 'کوئی پراڈکٹ موجود نہیں، پہلے نئی پراڈکٹ سیٹ اپ کریں۔')}
                </div>
              ) : (
                products.filter(p => p.type === 'fuel').map(prod => (
                  <button
                    key={prod.id}
                    type="button"
                    onClick={() => setSelectedProduct(prod.id)}
                    className={`flex items-center justify-between p-4 rounded-xl border text-left transition-all ${
                      selectedProduct === prod.id
                        ? 'border-emerald-500 bg-emerald-50/20 shadow-xs'
                        : 'border-slate-200 hover:border-slate-350 bg-slate-50/10'
                    }`}
                  >
                    <div>
                      <span className="block font-sans text-xs font-bold text-slate-700">{t(prod.name, prod.urduName)}</span>
                      <span className="block font-mono text-[10px] text-slate-400 mt-0.5">{prod.unit}</span>
                    </div>
                    <div className="text-right">
                      <span className="block font-mono text-xs font-extrabold text-emerald-600">Rs. {prod.rate?.toFixed(2)}</span>
                      <span className="block text-[8px] text-slate-400 uppercase tracking-wider">{t('Active Rate', 'موجودہ قیمت')}</span>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        )}

        {/* STEP 2: INPUT TARGET PRICE */}
        {wizardStep === 2 && activeProduct && (
          <div className="space-y-4">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest">
              {t('Step 2: Enter New Base Tariff Rate:', 'مرحلہ 2: نیا لاگو ہونے والا دفتری ریٹ درج کریں:')}
            </label>
            <div className="bg-slate-50 p-4 rounded-lg flex items-center justify-between">
              <div>
                <span className="block text-[10px] text-slate-400 uppercase tracking-wider font-semibold">{t('Currently Active:', 'موجودہ لاگو قیمت:')}</span>
                <span className="block font-sans text-xs font-bold text-slate-700">{t(activeProduct.name, activeProduct.urduName)}</span>
              </div>
              <span className="font-mono text-xs font-bold text-slate-800">Rs. {currentRate.toFixed(2)} / {activeProduct.unit}</span>
            </div>

            <div className="space-y-1">
              <label className="block text-[11px] font-bold text-slate-600">{t('New Certified Price (Rs.):', 'نیا ریٹ (روپوں میں):')}</label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-mono text-xs text-slate-400">Rs.</span>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="e.g. 285.50"
                  value={targetRate}
                  onChange={(e) => setTargetRate(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3.5 py-3 font-mono text-xs font-bold outline-hidden focus:border-emerald-500"
                />
              </div>
            </div>

            {/* REAL-TIME DELTA PREVIEW */}
            {targetRate && !isNaN(Number(targetRate)) && (
              <div className="p-3.5 rounded-lg border border-slate-100 bg-slate-50 flex items-center justify-between text-xs">
                <span className="font-sans font-medium text-slate-500">{t('Price Difference Delta:', 'ریٹ میں فرق کی شرح:')}</span>
                <div className="text-right">
                  <span className={`font-mono font-bold ${rateDiff >= 0 ? 'text-teal-600' : 'text-rose-500'}`}>
                    {rateDiff >= 0 ? '+' : ''}{rateDiff.toFixed(2)} Rs / {activeProduct.unit}
                  </span>
                  <span className="block text-[9px] text-slate-400">({((rateDiff / (currentRate || 1)) * 100).toFixed(2)}%)</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* STEP 3: MOTIVE & DATE */}
        {wizardStep === 3 && activeProduct && (
          <div className="space-y-4">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest">
              {t('Step 3: Effective Date & Certificate Signatory:', 'مرحلہ 3: باقاعدہ دفتری نفاذ اور دستاویز کارنامہ:')}
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1.5">{t('Motive / Ref Circular No:', 'تبدیلی کی منظوری یا وجہ:')}</label>
                <input
                  type="text"
                  required
                  value={rateReason}
                  onChange={(e) => setRateReason(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 font-sans text-xs outline-hidden focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1.5">{t('Authorized Signatory Supervisor:', 'منظور کرنے والا نگران:')}</label>
                <input
                  type="text"
                  required
                  value={rateAuthor}
                  onChange={(e) => setRateAuthor(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 font-sans text-xs outline-hidden focus:border-emerald-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[11px] font-bold text-slate-600 mb-1.5">{t('Inaugural Effective Date-Time:', 'باقاعدہ نفاذ کی تاریخ و وقت:')}</label>
                <input
                  type="datetime-local"
                  required
                  value={rateEffectiveDate}
                  onChange={(e) => setRateEffectiveDate(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 font-mono text-xs outline-hidden focus:border-emerald-500"
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 4: PREVIEW STOCK VALUE IMPACT */}
        {wizardStep === 4 && activeProduct && (
          <div className="space-y-4">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest text-emerald-600">
              {t('Step 4: Final Stock Gain/Loss & Impact Verification:', 'مرحلہ 4: پٹرولیم نفع/نقصان اور اسٹاک امپیکٹ تضاد:')}
            </label>

            <div className="rounded-xl border border-slate-205 p-4 bg-slate-50 space-y-3">
              <div className="flex justify-between text-xs border-b border-slate-100 pb-2">
                <span className="text-slate-500">{t('Product Target Name:', 'تبدیل ہونے والی پراڈکٹ:')}</span>
                <span className="font-sans font-bold text-slate-800">{t(activeProduct.name, activeProduct.urduName)}</span>
              </div>
              <div className="flex justify-between text-xs border-b border-slate-100 pb-2">
                <span className="text-slate-500">{t('Price Shift Delta:', 'قیمت میں فرق:')}</span>
                <span className={`font-mono font-bold ${rateDiff >= 0 ? 'text-teal-600' : 'text-rose-500'}`}>
                  {rateDiff >= 0 ? 'Increase (اضافہ)' : 'Decrease (کمی)'} rs. {rateDiff.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-xs border-b border-slate-100 pb-2">
                <span className="text-slate-500">{t('Connected Physical Tanks Inventory:', 'منسلک اسٹوریج ٹینک اسٹاک:')}</span>
                <span className="font-mono font-bold text-slate-800">{estimatedStock.toLocaleString()} {activeProduct.unit}s</span>
              </div>
              <div className="flex justify-between text-xs pt-1">
                <span className="text-slate-600 font-bold">{t('Estimated Inventory Balance Sheet Impact:', 'تخمینہ منافع نقصان بیلنس شیٹ:')}</span>
                <span className={`font-mono text-sm font-extrabold ${priceImpact >= 0 ? 'text-teal-600' : 'text-red-500'}`}>
                  {priceImpact >= 0 ? '+' : ''}Rs. {priceImpact.toFixed(2)}
                </span>
              </div>
            </div>

            <div className="rounded-lg p-3 bg-blue-50 text-[10px] text-blue-700 font-sans flex gap-2">
              <Info className="h-5 w-5 shrink-0" />
              <p className="leading-relaxed">
                {t(
                  'Confirming this operation compiles an instant inventory valuation adjustment and automatically updates active pump rates.',
                  'اسے کنفرم کرنے سے اسٹاک لیجر اور پمپ قیمتیں منٹوں میں آٹومیٹک پبلش ہو جائیں گی۔'
                )}
              </p>
            </div>
          </div>
        )}

        {/* OPERATIONS CONTROLS PANEL */}
        <div className="flex justify-between pt-3 border-t border-slate-100">
          <button
            type="button"
            disabled={wizardStep === 1}
            onClick={handlePrevStep}
            className={`px-3.5 py-1.5 font-sans text-xs font-bold rounded-lg flex items-center gap-1 cursor-pointer select-none ${
              wizardStep === 1
                ? 'bg-slate-100 text-slate-350 cursor-not-allowed'
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
              className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-sans text-xs font-bold rounded-lg flex items-center gap-1 cursor-pointer select-none shadow-xs"
            >
              <span>{t('Continue', 'مزد آگے بڑھیں')}</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSaveRate}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-sans text-xs font-extrabold rounded-lg flex items-center gap-1 cursor-pointer select-none shadow-sm"
            >
              <CheckCircle className="h-4 w-4" />
              <span>{t('PUBLISH NEW OFFICIAL RATES', 'دفتر ریٹ لاگو کریں')}</span>
            </button>
          )}
        </div>
      </div>

      {/* PRICE HISTORY AUDIT LIST */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
        <h3 className="font-sans text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-2">
          <Activity className="h-4 w-4 text-slate-400" />
          <span>{t('Historical Rate Alteration Timeline', 'ریفائنری قیمت تبدیلی کا دفتری ریکارڈ')}</span>
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left font-sans text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-150 text-[10px] font-bold uppercase tracking-wider text-slate-400 text-center">
                <th className="py-2.5 px-2 text-left">{t('Effective Time', 'تاریخ و وقت')}</th>
                <th className="py-2.5 px-2 text-left">{t('Product', 'پراڈکٹ')}</th>
                <th className="py-2.5 px-2">{t('Old Rate', 'پرانا ریٹ')}</th>
                <th className="py-2.5 px-2">{t('New Rate', 'نیا ریٹ')}</th>
                <th className="py-2.5 px-2">{t('Stock Balance', 'موجودہ اسٹاک')}</th>
                <th className="py-2.5 px-2">{t('Total Impact', 'نفع / نقصان')}</th>
                <th className="py-2.5 px-2 text-right">{t('Operator / Action', 'وجہ / تبدیل کنندہ')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRateHistory.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-6 text-center text-slate-400 text-xs">
                    {t('No price revision logs registered yet in this period.', 'اس مدت کے دوران پٹرول ریٹ تبدیلی کی ہسٹری خالی ہے۔')}
                  </td>
                </tr>
              ) : (
                filteredRateHistory.map(rh => {
                  const prod = products.find(p => p.id === rh.productId);
                  return (
                    <tr key={rh.id} className="hover:bg-slate-50/40 text-[11px] text-center">
                      <td className="py-2.5 px-2 text-left font-mono text-slate-500 whitespace-nowrap">{rh.date}</td>
                      <td className="py-2.5 px-2 text-left font-bold text-slate-800">
                        {prod ? t(prod.name, prod.urduName) : rh.productId}
                      </td>
                      <td className="py-2.5 px-2 font-mono text-slate-500">Rs. {rh.oldRate?.toFixed(2)}</td>
                      <td className="py-2.5 px-2 font-mono font-bold text-slate-800">Rs. {rh.newRate?.toFixed(2)}</td>
                      <td className="py-2.5 px-2 font-mono text-slate-500">{(rh.stockAtTime || 0).toLocaleString()}</td>
                      <td className={`py-2.5 px-2 font-mono font-bold ${rh.impactAmount >= 0 ? 'text-teal-600' : 'text-red-500'}`}>
                        {rh.impactAmount >= 0 ? '+' : ''}Rs. {Number(rh.impactAmount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-2.5 px-2 text-right">
                        <div className="font-medium text-slate-700">{rh.reason}</div>
                        <div className="text-[9px] text-slate-400">By: {rh.changedBy}</div>
                        <button
                          onClick={() => handleDeleteHistoryLog(rh.id)}
                          className="text-[10px] mt-1 text-red-500 hover:text-red-700 inline-flex items-center gap-0.5 cursor-pointer"
                        >
                          <Trash2 className="h-3 w-3" />
                          <span>{t('Delete Log', 'حذف کریں')}</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
