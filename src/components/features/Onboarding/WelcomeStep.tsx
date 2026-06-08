import React from 'react';
import { Droplet, Fuel, Gauge, DollarSign } from 'lucide-react';
import { t } from '../../../lib/translations';

interface Props {
  onContinue: () => void;
  onCancel?: () => void;
  language: string;
}

export function WelcomeStep({ onContinue, onCancel, language }: Props) {
  return (
    <div className="flex items-center justify-center min-h-[80vh] p-4 animate-in fade-in zoom-in duration-500">
      <div className="max-w-2xl w-full bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
        <div className="pt-12 pb-10 px-6 md:px-12 text-center space-y-8">
          <div className="space-y-4">
            <h1 className="text-4xl font-black text-slate-800 tracking-tight">
              {t('Welcome To FuelPro', 'فیول پرو میں خوش آمدید', language)}
            </h1>
            <p className="text-slate-500 text-lg font-medium">
              {t("Let's Configure Your Station", "آئیے آپ کے اسٹیشن کی ترتیب کریں", language)}
            </p>
          </div>

          <div className="space-y-4 text-left max-w-md mx-auto bg-slate-50 p-6 rounded-2xl border border-slate-100">
            <p className="text-slate-600 font-bold text-sm uppercase tracking-wider">
              {t('You only need 4 steps:', 'صرف 4 مراحل درکار ہیں:', language)}
            </p>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="size-10 rounded-full bg-orange-100 flex items-center justify-center shrink-0 shadow-sm">
                  <Droplet className="size-5 text-orange-600" />
                </div>
                <span className="font-semibold text-slate-700">{t('1. Add Fuel Products', '1. فیول پراڈکٹس شامل کریں', language)}</span>
              </div>
              <div className="flex items-center gap-4">
                <div className="size-10 rounded-full bg-emerald-100 flex items-center justify-center shrink-0 shadow-sm">
                  <Fuel className="size-5 text-emerald-600" />
                </div>
                <span className="font-semibold text-slate-700">{t('2. Add Tanks', '2. ٹینکس شامل کریں', language)}</span>
              </div>
              <div className="flex items-center gap-4">
                <div className="size-10 rounded-full bg-blue-100 flex items-center justify-center shrink-0 shadow-sm">
                  <Gauge className="size-5 text-blue-600" />
                </div>
                <span className="font-semibold text-slate-700">{t('3. Add Nozzles', '3. نوزلز شامل کریں', language)}</span>
              </div>
              <div className="flex items-center gap-4">
                <div className="size-10 rounded-full bg-purple-100 flex items-center justify-center shrink-0 shadow-sm">
                  <DollarSign className="size-5 text-purple-600" />
                </div>
                <span className="font-semibold text-slate-700">{t('4. Set Fuel Rates', '4. فیول ریٹس مقرر کریں', language)}</span>
              </div>
            </div>
          </div>

          <div className="pt-6">
            <p className="text-sm font-bold text-slate-400 mb-6 flex items-center justify-center gap-2">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
              {t('Estimated Time: 2 Minutes', 'تخمینی وقت: 2 منٹ', language)}
            </p>
            <button 
              onClick={onContinue} 
              className="w-full md:w-auto md:px-16 py-4 bg-orange-600 hover:bg-orange-700 text-white rounded-xl font-black text-lg transition-all shadow-lg hover:shadow-orange-600/30 active:scale-95 cursor-pointer"
            >
              {t('Start Setup', 'سیٹ اپ شروع کریں', language)}
            </button>
            {onCancel && (
              <button 
                onClick={onCancel}
                className="w-full md:w-auto mt-4 px-8 py-3 text-slate-500 hover:text-slate-700 font-bold transition-colors cursor-pointer"
              >
                {t('Skip for now', 'ابھی چھوڑیں', language)}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
