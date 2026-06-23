import React, { useState } from 'react';
import { Landmark, DollarSign, ShieldAlert, Banknote, Save, ChevronRight, TrendingDown, Clock } from 'lucide-react';
import { useStation } from '../../../contexts/StationContext';
import { GlobalSettings } from '../../../types';

interface TreasurySettingsProps {
  settings: GlobalSettings;
  onUpdateSettings: (s: GlobalSettings) => void;
  activeStationId: string;
}

 
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default function TreasurySettings({ settings, onUpdateSettings, activeStationId }: TreasurySettingsProps) {
  const { showToast } = useStation();
  const isUrdu = settings.language === 'ur';
  const t = (en: string, ur: string) => (isUrdu ? ur : en);

   
  const [config, setConfig] = useState({
     
     
    openingCashFloat:   (settings as any).treasury?.openingCashFloat   ?? 5000,
     
     
    safeDropLimit:      (settings as any).treasury?.safeDropLimit       ?? 50000,
     
    pettyCashBudget:    (settings as any).treasury?.pettyCashBudget     ?? 3000,
    enableSafeDropAlert:(settings as any).treasury?.enableSafeDropAlert ?? true,
    endOfDayAutoReconcile: (settings as any).treasury?.endOfDayAutoReconcile ?? false,
     
    cashCountReminderMin: (settings as any).treasury?.cashCountReminderMin ?? 240,
  });

  const handleSave = () => {
    onUpdateSettings({
      ...settings,
      treasury: {
        ...(settings as any).treasury,
        ...config,
      }
    } as GlobalSettings);
    showToast(t('Treasury settings saved.', 'ٹریژری سیٹنگز محفوظ ہو گئیں۔'), 'success');
  };

  const toggleSwitch = (key: keyof typeof config) => {
    setConfig(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-slate-200 pb-4">
        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <Landmark className="h-5 w-5 text-indigo-600" />
          {t('Treasury Configuration', 'ٹریژری ترتیبات')}
        </h2>
        <p className="text-sm text-slate-500 mt-1">
          {t('Configure cash handling rules, safe-drop limits, and petty cash thresholds.', 'نقد رقم کے قواعد، سیف ڈراپ حد اور پیٹی کیش کی حد مرتب کریں۔')}
        </p>
      </div>

      {/* Cash Rules */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-100 bg-slate-50 flex items-center gap-2">
          <Banknote className="h-4 w-4 text-slate-500" />
          <h3 className="text-sm font-bold text-slate-700">{t('Cash Flow Rules', 'نقدی کے قواعد')}</h3>
        </div>
        <div className="p-5 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Opening Float */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <DollarSign className="h-3.5 w-3.5" />
                {t('Opening Cash Float', 'ابتدائی نقد رقم')}
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">₨</span>
                <input
                  type="number"
                  min={0}
                  value={config.openingCashFloat}
                  onChange={e => setConfig({ ...config, openingCashFloat: Number(e.target.value) })}
                  className="w-full pl-7 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 font-medium focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 transition-all"
                />
              </div>
              <p className="text-[11px] text-slate-400">{t('Cash kept in drawer at shift start', 'شفٹ شروع ہونے پر دراز میں رقم')}</p>
            </div>

            {/* Safe Drop Limit */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <ShieldAlert className="h-3.5 w-3.5" />
                {t('Safe Drop Limit', 'سیف ڈراپ حد')}
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">₨</span>
                <input
                  type="number"
                  min={0}
                  value={config.safeDropLimit}
                  onChange={e => setConfig({ ...config, safeDropLimit: Number(e.target.value) })}
                  className="w-full pl-7 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 font-medium focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 transition-all"
                />
              </div>
              <p className="text-[11px] text-slate-400">{t('Alert when cash exceeds this amount', 'اس رقم سے زیادہ ہونے پر اطلاع')}</p>
            </div>

            {/* Petty Cash */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <TrendingDown className="h-3.5 w-3.5" />
                {t('Petty Cash Budget', 'پیٹی کیش بجٹ')}
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">₨</span>
                <input
                  type="number"
                  min={0}
                  value={config.pettyCashBudget}
                  onChange={e => setConfig({ ...config, pettyCashBudget: Number(e.target.value) })}
                  className="w-full pl-7 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 font-medium focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 transition-all"
                />
              </div>
              <p className="text-[11px] text-slate-400">{t('Daily petty cash allowance', 'روزانہ پیٹی کیش الاؤنس')}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Automation Toggles */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-100 bg-slate-50 flex items-center gap-2">
          <Clock className="h-4 w-4 text-slate-500" />
          <h3 className="text-sm font-bold text-slate-700">{t('Automation & Alerts', 'خودکار اطلاعات')}</h3>
        </div>
        <div className="divide-y divide-slate-100">
          {/* Safe Drop Alert */}
          <div className="flex items-center justify-between px-5 py-4">
            <div>
              <h4 className="text-sm font-bold text-slate-800">{t('Safe Drop Alerts', 'سیف ڈراپ الرٹ')}</h4>
              <p className="text-xs text-slate-500 mt-0.5">{t('Notify cashier when cash reaches the safe drop limit', 'نقدی حد تک پہنچنے پر کیشیر کو مطلع کریں')}</p>
            </div>
            <button
              onClick={() => toggleSwitch('enableSafeDropAlert')}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
                config.enableSafeDropAlert ? 'bg-indigo-600' : 'bg-slate-200'
              }`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${
                config.enableSafeDropAlert ? 'translate-x-6' : 'translate-x-1'
              }`} />
            </button>
          </div>

          {/* EOD Auto Reconcile */}
          <div className="flex items-center justify-between px-5 py-4">
            <div>
              <h4 className="text-sm font-bold text-slate-800">{t('EOD Auto-Reconcile', 'روزانہ خودکار ملان')}</h4>
              <p className="text-xs text-slate-500 mt-0.5">{t('Auto-generate treasury summary at end of each day', 'ہر دن کے اختتام پر ٹریژری خلاصہ خود بنائیں')}</p>
            </div>
            <button
              onClick={() => toggleSwitch('endOfDayAutoReconcile')}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
                config.endOfDayAutoReconcile ? 'bg-indigo-600' : 'bg-slate-200'
              }`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${
                config.endOfDayAutoReconcile ? 'translate-x-6' : 'translate-x-1'
              }`} />
            </button>
          </div>

          {/* Cash Count Reminder */}
          <div className="flex items-center justify-between px-5 py-4">
            <div className="flex-1 min-w-0 pr-4">
              <h4 className="text-sm font-bold text-slate-800">{t('Cash Count Reminder', 'نقدی گنتی یاددہانی')}</h4>
              <p className="text-xs text-slate-500 mt-0.5">{t('Remind cashier to count cash every N minutes', 'ہر N منٹ بعد کیشیر کو نقدی گننے کی یاددہانی')}</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <input
                type="number"
                min={30}
                max={480}
                step={30}
                value={config.cashCountReminderMin}
                onChange={e => setConfig({ ...config, cashCountReminderMin: Number(e.target.value) })}
                className="w-20 px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-center text-slate-800 font-bold focus:outline-none focus:border-indigo-400"
              />
              <span className="text-xs text-slate-500 font-medium">min</span>
            </div>
          </div>
        </div>
      </div>

      {/* Go to Banks & Wallets shortcut */}
      <button
        className="w-full flex items-center justify-between p-4 bg-indigo-50 border border-indigo-100 rounded-2xl hover:bg-indigo-100 transition-colors group cursor-pointer"
        onClick={() => {/* handled in parent via setActiveTab */}}
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center">
            <Landmark className="h-5 w-5 text-white" />
          </div>
          <div className="text-left">
            <p className="text-sm font-bold text-indigo-900">{t('Manage Bank Accounts & Wallets', 'بینک اکاؤنٹس اور والٹس')}</p>
            <p className="text-xs text-indigo-600">{t('Add banks, digital wallets, and petty cash boxes', 'بینک، ڈیجیٹل والٹ اور پیٹی کیش باکس شامل کریں')}</p>
          </div>
        </div>
        <ChevronRight className="h-5 w-5 text-indigo-400 group-hover:translate-x-1 transition-transform" />
      </button>

      {/* Save */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold shadow-sm shadow-indigo-200 transition-all cursor-pointer"
        >
          <Save className="h-4 w-4" />
          {t('Save Treasury Config', 'ٹریژری ترتیبات محفوظ کریں')}
        </button>
      </div>
    </div>
  );
}
