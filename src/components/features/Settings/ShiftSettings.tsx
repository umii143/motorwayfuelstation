import React, { useState } from 'react';
import { Clock, Save } from 'lucide-react';
import { useStation } from '../../../contexts/StationContext';
import { GlobalSettings } from '../../../types';

 
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default function ShiftSettings({ settings, onUpdateSettings, activeStationId }: { settings: GlobalSettings, onUpdateSettings: (s: GlobalSettings) => void, activeStationId: string }) {
  const { showToast } = useStation();

  const isUrdu = settings.language === 'ur';
  const t = (en: string, ur: string) => (isUrdu ? ur : en);

  // Initialize shift settings if undefined
  const [shiftSettings, setShiftSettings] = useState({
    enforceShiftHours: settings.security?.enforceShiftHours ?? false,
    autoCloseShifts: settings.security?.autoCloseShifts ?? false,
    maxShiftDurationHours: settings.security?.maxShiftDurationHours ?? 12,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const value = e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value;
    setShiftSettings({ ...shiftSettings, [e.target.name]: value });
  };

  const handleSave = () => {
    const newSettings = { 
      ...settings, 
      security: {
        ...(settings.security || { /* empty */ }),
        enforceShiftHours: shiftSettings.enforceShiftHours,
        autoCloseShifts: shiftSettings.autoCloseShifts,
        maxShiftDurationHours: Number(shiftSettings.maxShiftDurationHours)
      }
    };
    onUpdateSettings(newSettings);
    showToast(t('Shift settings saved successfully.', 'شفٹ کی ترتیبات کامیابی سے محفوظ ہو گئیں۔'), 'success');
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-200 pb-4">
        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <Clock className="h-6 w-6 text-indigo-600" />
          {t('Shift Settings', 'شفٹ سیٹنگز')}
        </h2>
        <p className="text-sm text-slate-500 mt-1">
          {t('Configure global rules for shift operations and durations.', 'شفٹ آپریشنز اور دورانیے کے لیے عالمی قواعد مرتب کریں۔')}
        </p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden max-w-2xl">
        <div className="p-6 space-y-6">
          
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-bold text-slate-800">{t('Enforce Shift Hours', 'شفٹ کے اوقات نافذ کریں')}</h4>
              <p className="text-xs text-slate-500">{t('Block POS transactions when no active shift is running.', 'جب کوئی فعال شفٹ نہ چل رہی ہو تو پی او ایس لین دین کو روکیں۔')}</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" name="enforceShiftHours" checked={shiftSettings.enforceShiftHours} onChange={handleChange} className="sr-only peer" />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-bold text-slate-800">{t('Auto-Close Abandoned Shifts', 'ترک شدہ شفٹوں کو خودکار بند کریں')}</h4>
              <p className="text-xs text-slate-500">{t('Automatically force-close shifts exceeding max duration.', 'زیادہ سے زیادہ دورانیے سے تجاوز کرنے والی شفٹوں کو خودکار طور پر بند کریں۔')}</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" name="autoCloseShifts" checked={shiftSettings.autoCloseShifts} onChange={handleChange} className="sr-only peer" />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
            </label>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t('Max Shift Duration (Hours)', 'شفٹ کا زیادہ سے زیادہ دورانیہ (گھنٹے)')}</label>
            <input 
              type="number" 
              name="maxShiftDurationHours"
              value={shiftSettings.maxShiftDurationHours}
              onChange={handleChange}
              min={1}
              max={24}
              className="w-full px-3 py-2.5 sm:py-2 min-h-[48px] sm:min-h-[40px].5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 focus:bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div className="pt-6 border-t border-slate-100">
            <button 
              onClick={handleSave}
              className="px-6 py-3 sm:py-2 min-h-[48px] sm:min-h-[40px].5 bg-slate-900 text-white rounded-lg text-sm font-bold shadow-xs hover:bg-slate-800 transition-colors flex items-center gap-2"
            >
              <Save className="h-4 w-4" />
              {t('Save Settings', 'ترتیبات محفوظ کریں')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
