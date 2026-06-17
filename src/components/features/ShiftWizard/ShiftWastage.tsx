import React from 'react';
import { Activity } from 'lucide-react';

interface ShiftWastageProps {
  t: (en: string, ur: string) => string;
  testPetrol: string;
  setTestPetrol: (val: string) => void;
  testDiesel: string;
  setTestDiesel: (val: string) => void;
  testCNG: string;
  setTestCNG: (val: string) => void;
  setWizardStep: (step: number) => void;
  handleConfirmTests: () => void;
}

export function ShiftWastage({
  t,
  testPetrol,
  setTestPetrol,
  testDiesel,
  setTestDiesel,
  testCNG,
  setTestCNG,
  setWizardStep,
  handleConfirmTests,
}: ShiftWastageProps) {
  return (
    <div className="mx-auto max-w-xl rounded-2xl border border-slate-700/50 bg-slate-800/80 backdrop-blur-xl p-8 shadow-2xl relative overflow-hidden">
      {/* Decorative background element */}
      <div className="absolute top-0 right-0 w-48 h-48 bg-orange-500/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>

      <div className="flex flex-col sm:flex-row sm:items-center gap-4 border-b border-slate-700/50 pb-6 mb-8 relative z-10">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-500/10 border border-orange-500/20 text-orange-400 shadow-sm shrink-0">
          <Activity className="h-7 w-7" />
        </div>
        <div>
          <h3 className="text-xl font-black text-slate-200">
            {t(
              "Configure Wastage / Test Litres",
              "مرمت ٹیسٹنگ اور ضیاع ایڈجسٹمنٹ",
            )}
          </h3>
          <p className="text-sm text-slate-400 mt-1">
            {t(
              "Volume pumped for calibrations testing (not billed to customers).",
              "پمپ کیلیبریشن یا مرمت کے دوران نکالا گیا تیل جودر حقیقت فروخت نہیں ہوا۔",
            )}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
        {/* Petrol Test */}
        <div className="bg-slate-900/50 p-5 rounded-xl border border-slate-700/50 hover:border-orange-500/30 transition-colors group">
          <label className="flex items-center justify-between font-bold text-slate-300 mb-3">
            <span>{t("Super Petrol Test", "پٹرول ٹیسٹنگ")}</span>
            <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full border border-slate-700">Liters</span>
          </label>
          <input
            type="number"
            value={testPetrol}
            onChange={(e) => setTestPetrol(e.target.value)}
            placeholder="0"
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-lg font-mono font-bold text-orange-400 shadow-inner outline-none transition-all focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
          />
        </div>

        {/* Diesel Test */}
        <div className="bg-slate-900/50 p-5 rounded-xl border border-slate-700/50 hover:border-blue-500/30 transition-colors group">
          <label className="flex items-center justify-between font-bold text-slate-300 mb-3">
            <span>{t("Diesel Test", "ڈیزل ٹیسٹنگ")}</span>
            <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full border border-slate-700">Liters</span>
          </label>
          <input
            type="number"
            value={testDiesel}
            onChange={(e) => setTestDiesel(e.target.value)}
            placeholder="0"
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-lg font-mono font-bold text-blue-400 shadow-inner outline-none transition-all focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
        </div>

        {/* CNG Test */}
        <div className="bg-slate-900/50 p-5 rounded-xl border border-slate-700/50 hover:border-emerald-500/30 transition-colors md:col-span-2 group">
          <label className="flex items-center justify-between font-bold text-slate-300 mb-3">
            <span>{t("CNG Flow Calibration", "سی این جی ٹیسٹنگ")}</span>
            <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full border border-slate-700">KG</span>
          </label>
          <input
            type="number"
            value={testCNG}
            onChange={(e) => setTestCNG(e.target.value)}
            placeholder="0"
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-lg font-mono font-bold text-emerald-400 shadow-inner outline-none transition-all focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
          />
        </div>
      </div>

      <div className="mt-10 flex flex-col sm:flex-row justify-between items-center gap-4 pt-6 border-t border-slate-700/50 relative z-10">
        <button
          onClick={() => setWizardStep(4)}
          className="w-full sm:w-auto px-6 py-3 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-xl font-bold text-sm flex items-center justify-center transition-all"
        >
          {t("← Back", "← واپس جائیں")}
        </button>
        <button
          onClick={handleConfirmTests}
          className="w-full sm:w-auto bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-500 hover:to-orange-400 text-white px-8 py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-orange-500/20 active:scale-95"
        >
          <span>{t("Proceed to Cash Audit →", "کیش فلو اکاؤنٹنگ پر جائیں →")}</span>
        </button>
      </div>
    </div>
  );
}
