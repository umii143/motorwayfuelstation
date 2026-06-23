import React, { useState } from 'react';
import { Sliders, Save, Globe, Monitor, Printer, AlertTriangle } from 'lucide-react';
import { useStation } from '../../../contexts/StationContext';
import { GlobalSettings } from '../../../types';

 
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default function SystemPreferences({ settings, onUpdateSettings, activeStationId }: { settings: GlobalSettings, onUpdateSettings: (s: GlobalSettings) => void, activeStationId: string }) {
  const { showToast } = useStation();

  const isUrdu = settings.language === 'ur';
  const t = (en: string, ur: string) => (isUrdu ? ur : en);

  const [prefs, setPrefs] = useState({
    language: settings.language || 'en',
    currency: settings.currency || 'PKR',
    receiptPrinter: 'thermal_80mm',
    theme: settings.theme || 'light'
  });

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
    const value = e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value;
    setPrefs({ ...prefs, [e.target.name]: value });
  };

  const handleSave = () => {
    onUpdateSettings({ 
      ...settings, 
      language: prefs.language as 'en' | 'ur',
      currency: prefs.currency,
      theme: prefs.theme as 'light' | 'dark' | 'blue' | 'emerald' | 'orange' | 'white'
    });
    showToast(t('System preferences saved.', 'سسٹم کی ترجیحات محفوظ ہو گئیں۔'), 'success');
  };


  return (
    <div className="space-y-6">
      <div className="border-b border-slate-200 pb-4">
        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <Sliders className="h-6 w-6 text-indigo-600" />
          {t('System Preferences', 'سسٹم کی ترجیحات')}
        </h2>
        <p className="text-sm text-slate-500 mt-1">Configure global display formats, language, and hardware connections.</p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-xs max-w-2xl p-6 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
              <Globe className="h-4 w-4" /> {t('Interface Language', 'زبان')}
            </label>
            <select name="language" value={prefs.language} onChange={handleChange} className="w-full px-3 py-2.5 sm:py-2 min-h-[48px] sm:min-h-[40px].5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800">
              <option value="en">English (US)</option>
              <option value="ur">اردو (Urdu)</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
              <span className="font-serif italic font-bold">₨</span> {t('Currency Format', 'کرنسی')}
            </label>
            <select name="currency" value={prefs.currency} onChange={handleChange} className="w-full px-3 py-2.5 sm:py-2 min-h-[48px] sm:min-h-[40px].5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800">
              <option value="PKR">Pakistani Rupee (PKR)</option>
              <option value="USD">US Dollar ($)</option>
              <option value="EUR">Euro (€)</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
              <Printer className="h-4 w-4" /> {t('Default Printer', 'ڈیفالٹ پرنٹر')}
            </label>
            <select name="receiptPrinter" value={prefs.receiptPrinter} onChange={handleChange} className="w-full px-3 py-2.5 sm:py-2 min-h-[48px] sm:min-h-[40px].5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800">
              <option value="thermal_80mm">Standard Thermal (80mm)</option>
              <option value="thermal_58mm">Compact Thermal (58mm)</option>
              <option value="a4">Laser/Inkjet (A4)</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
              <Monitor className="h-4 w-4" /> {t('UI Theme', 'تھیم')}
            </label>
            <select name="theme" value={prefs.theme} onChange={handleChange} className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800">
              <option value="light">Light Mode (Soft)</option>
              <option value="white">Pure White Theme</option>
              <option value="dark">Dark Mode</option>
              <option value="blue">Blue Theme</option>
              <option value="emerald">Emerald Theme</option>
              <option value="orange">Orange Theme</option>
            </select>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
          <button onClick={handleSave} className="px-6 py-3 sm:py-2 min-h-[48px] sm:min-h-[40px].5 bg-slate-900 text-white rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-slate-800 transition-colors cursor-pointer">
            <Save className="h-4 w-4" /> {t('Save Preferences', 'محفوظ کریں')}
          </button>
        </div>
      </div>

      {/* Factory Reset moved to dedicated module: Settings > Factory Reset */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 max-w-2xl flex items-center gap-3">
        <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
        <p className="text-xs text-amber-800 font-semibold">
          {t('To wipe all data and factory reset, navigate to System Administration → Factory Reset.', 'تمام ڈیٹا حذف کرنے کے لیے، سسٹم ایڈمنسٹریشن → فیکٹری ری سیٹ پر جائیں۔')}
        </p>
      </div>
    </div>
  );
}
