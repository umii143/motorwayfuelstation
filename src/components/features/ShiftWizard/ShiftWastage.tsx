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
    <div className="mx-auto max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center gap-3 border-b border-slate-100 pb-4 mb-5">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-100 text-orange-600 animate-pulse">
          <Activity className="h-5 w-5" />
        </div>
        <div>
          <h3 className="font-sans text-base font-bold text-slate-900">
            {t(
              "Configure Wastage / Test Litres",
              "مرمت ٹیسٹنگ اور ضیاع ایڈجسٹمنٹ",
            )}
          </h3>
          <p className="font-sans text-xs text-slate-400 mt-0.5">
            {t(
              "Volume pumped for calibrations testing (not billed to customers).",
              "پمپ کیلیبریشن یا مرمت کے دوران نکالا گیا تیل جودر حقیقت فروخت نہیں ہوا۔",
            )}
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block font-sans text-xs font-bold text-slate-500 uppercase mb-1.5">
            {t("Super Petrol Test (Litres):", "پٹرول ٹیسٹنگ مقدار (لیٹر):")}
          </label>
          <input
            type="number"
            value={testPetrol}
            onChange={(e) => setTestPetrol(e.target.value)}
            placeholder="0"
            className="premium-input border bg-white px-3 font-mono text-sm focus:border-orange-500 focus:outline-hidden"
          />
        </div>

        <div>
          <label className="block font-sans text-xs font-bold text-slate-500 uppercase mb-1.5">
            {t("Diesel Test (Litres):", "ڈیزل ٹیسٹنگ مقدار (لیٹر):")}
          </label>
          <input
            type="number"
            value={testDiesel}
            onChange={(e) => setTestDiesel(e.target.value)}
            placeholder="0"
            className="premium-input border bg-white px-3 font-mono text-sm focus:border-orange-500 focus:outline-hidden"
          />
        </div>

        <div>
          <label className="block font-sans text-xs font-bold text-slate-500 uppercase mb-1.5">
            {t(
              "CNG Flow Calibration test (KG):",
              "سی این جی ٹیسٹنگ مقدار (کلو گرام):",
            )}
          </label>
          <input
            type="number"
            value={testCNG}
            onChange={(e) => setTestCNG(e.target.value)}
            placeholder="0"
            className="premium-input border bg-white px-3 font-mono text-sm focus:border-orange-500 focus:outline-hidden"
          />
        </div>

        <div className="flex gap-3 pt-4 border-t border-slate-100">
          <button
            onClick={() => setWizardStep(4)}
            className="w-1/3 py-3 rounded-lg border border-slate-200 bg-white text-slate-600 font-sans text-xs font-bold hover:bg-slate-50"
          >
            {t("← Back", "← واپس جائیں")}
          </button>
          <button
            onClick={handleConfirmTests}
            className="flex-1 py-3 bg-orange-600 text-white font-sans text-xs font-bold rounded-lg hover:bg-orange-700 shadow-md shadow-orange-500/10 transition-all cursor-pointer"
          >
            {t("Proceed to Cash Audit →", "کیش فلو اکاؤنٹنگ پر جائیں →")}
          </button>
        </div>
      </div>
    </div>
  );
}
