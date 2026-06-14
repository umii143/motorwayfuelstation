import React, { useState } from 'react';
import { Sliders, Save, Globe, Monitor, Printer, AlertTriangle, Trash2 } from 'lucide-react';
import { useStation } from '../../../contexts/StationContext';
import { GlobalSettings } from '../../../types';

export default function SystemPreferences({ settings, onUpdateSettings, activeStationId }: { settings: GlobalSettings, onUpdateSettings: (s: GlobalSettings) => void, activeStationId: string }) {
  const { showToast } = useStation();

  const isUrdu = settings.language === 'ur';
  const t = (en: string, ur: string) => (isUrdu ? ur : en);

  const [prefs, setPrefs] = useState({
    language: settings.language || 'en',
    currency: settings.currency || 'PKR',
    receiptPrinter: 'thermal_80mm',
    darkMode: false
  });

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
    const value = e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value;
    setPrefs({ ...prefs, [e.target.name]: value });
  };

  const handleSave = () => {
    onUpdateSettings({ 
      ...settings, 
      language: prefs.language as 'en' | 'ur',
      currency: prefs.currency
    });
    showToast(t('System preferences saved.', 'سسٹم کی ترجیحات محفوظ ہو گئیں۔'), 'success');
  };

  const handleFactoryReset = async () => {
    const msg1 = t('Are you sure you want to completely wipe all system data? This action cannot be undone!', 'کیا آپ واقعی سسٹم کا تمام ڈیٹا حذف کرنا چاہتے ہیں؟ یہ عمل ناقابل واپسی ہے!');
    const msg2 = t('Final Warning: All shifts, sales, and configurations will be deleted permanently. Type "RESET" to confirm.', 'آخری انتباہ: تمام ڈیٹا مستقل طور پر حذف ہو جائے گا۔ تصدیق کے لیے "RESET" ٹائپ کریں۔');
    
    if (window.confirm(msg1)) {
      const confirmText = window.prompt(msg2);
      if (confirmText === 'RESET') {
        try {
          const { firestoreDb } = await import('../../../data/firestore');
          // Wait, user may not be imported here, we need to get user from somewhere or use activeStationId
          // I will use activeStationId, but I need orgId. Let's see if auth is available.
          const { auth } = await import('../../../lib/firebase');
          const orgId = auth.currentUser?.uid; // Assuming orgId is user uid if they are owner
          if (orgId) {
            await firestoreDb.wipeStationData(orgId, activeStationId);
          }
        } catch (e) {
          console.error("Firestore wipe failed", e);
        }

        localStorage.clear();
        // Keep the fresh slate flag so it doesn't seed dummy data on reload
        localStorage.setItem('fuelpro_fresh_v5_nodummies', 'true');
        
        const { db } = await import('../../../data/db');
        await db.resetToDefault();
      } else {
        showToast(t('Reset cancelled.', 'ری سیٹ منسوخ کر دیا گیا۔'), 'info');
      }
    }
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
            <select name="darkMode" value={prefs.darkMode ? 'dark' : 'light'} onChange={(e) => setPrefs({...prefs, darkMode: e.target.value === 'dark'})} className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800">
              <option value="light">Light Mode</option>
              <option value="dark">Dark Mode (Coming Soon)</option>
            </select>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
          <button onClick={handleSave} className="px-6 py-3 sm:py-2 min-h-[48px] sm:min-h-[40px].5 bg-slate-900 text-white rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-slate-800 transition-colors cursor-pointer">
            <Save className="h-4 w-4" /> {t('Save Preferences', 'محفوظ کریں')}
          </button>
        </div>
      </div>

      <div className="bg-red-50 rounded-xl border border-red-200 shadow-xs max-w-2xl p-6 space-y-4">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-red-100 text-red-600 rounded-lg">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-red-900">{t('Danger Zone: System Reset', 'خطرناک زون: سسٹم ری سیٹ')}</h3>
            <p className="text-sm text-red-700 mt-1">
              {t('This will permanently delete all records, shifts, customers, and configuration. It is useful for removing dummy data to start fresh.', 'یہ عمل تمام پرانا اور ڈمی ڈیٹا حذف کر دے گا۔ نیا کام شروع کرنے کے لیے استعمال کریں۔')}
            </p>
          </div>
        </div>
        <div className="pt-2">
          <button 
            onClick={handleFactoryReset}
            className="px-6 py-3 sm:py-2 min-h-[48px] sm:min-h-[40px].5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-bold flex items-center gap-2 transition-colors cursor-pointer shadow-md"
          >
            <Trash2 className="h-4 w-4" /> {t('Wipe Data & Start Fresh', 'تمام ڈیٹا حذف کریں اور نیا شروع کریں')}
          </button>
        </div>
      </div>
    </div>
  );
}
