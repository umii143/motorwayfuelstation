import React from 'react';
import { Play, ArrowRight, CheckCircle, RotateCcw } from 'lucide-react';
import { Nozzle, Product, Shift } from '../../../types';

interface OpeningReadingsFormProps {
  t: (en: string, ur: string) => string;
  setIsOpeningScannerOpen: (val: boolean) => void;
  nozzles: Nozzle[];
  products: Product[];
  fuelRates: Record<string, number>;
  previousClosingReadings: Record<string, number>;
  openingReadings: Record<string, number>;
  setOpeningReadings: (val: Record<string, number>) => void;
  setWizardStep: (step: number) => void;
  handleConfirmOpenings: () => void;
}

export function OpeningReadingsForm({
  t,
  setIsOpeningScannerOpen,
  nozzles,
  products,
  fuelRates,
  previousClosingReadings,
  openingReadings,
  setOpeningReadings,
  setWizardStep,
  handleConfirmOpenings
}: OpeningReadingsFormProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
          <Play className="h-5 w-5 text-emerald-500" />
          {t("Opening Meter Readings", "ابتدائی میٹر ریڈنگز")}
        </h3>
        <button
          onClick={() => setIsOpeningScannerOpen(true)}
          className="bg-emerald-50 text-emerald-600 px-3 py-1.5 rounded-lg text-sm font-medium border border-emerald-200 hover:bg-emerald-100 transition-colors flex items-center gap-2"
        >
          <span className="material-icons text-sm">qr_code_scanner</span>
          {t("AI Scan", "اے آئی اسکین")}
        </button>
      </div>

      <div className="space-y-6">
        {products.filter(p => p.type === 'fuel').map(product => {
          const prodNozzles = nozzles.filter(n => n.productId === product.id);
          if (prodNozzles.length === 0) return null;

          return (
            <div key={product.id} className="bg-slate-50 p-4 rounded-xl border border-slate-100">
              <h4 className="font-bold text-slate-700 mb-3 flex items-center justify-between">
                <span>{product.name}</span>
                <span className="text-sm font-medium text-slate-500">
                  Rate: Rs {fuelRates[product.id] || 0}/L
                </span>
              </h4>
              <div className="space-y-3">
                {prodNozzles.map(nz => (
                  <div key={nz.id} className="flex flex-row items-center gap-3">
                    <span className="font-medium text-sm text-slate-600 w-24">{nz.name}</span>
                    <div className="flex-1">
                      <input
                        type="number"
                        className="w-full rounded-lg border-slate-200 text-sm focus:ring-emerald-500 focus:border-emerald-500 bg-white"
                        placeholder={t("Opening Reading", "ابتدائی ریڈنگ")}
                        value={openingReadings[nz.id] || ""}
                        onChange={(e) => setOpeningReadings({ ...openingReadings, [nz.id]: Number(e.target.value) })}
                      />
                      {previousClosingReadings[nz.id] !== undefined && (
                        <p className="text-xs text-slate-400 mt-1">
                          Previous close: {previousClosingReadings[nz.id]}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-8 flex justify-between items-center pt-4 border-t border-slate-100">
        <button
          onClick={() => setWizardStep(1)}
          className="text-slate-500 hover:text-slate-700 font-medium text-sm flex items-center gap-1"
        >
          {t("Back", "واپس")}
        </button>
        <button
          onClick={handleConfirmOpenings}
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-lg font-bold flex items-center gap-2 transition-all shadow-sm"
        >
          {t("Confirm Openings & Start Shift", "کنفرم کریں اور شفٹ شروع کریں")}
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}


interface ClosingReadingsFormProps {
  t: (en: string, ur: string) => string;
  setIsClosingScannerOpen: (val: boolean) => void;
  nozzles: Nozzle[];
  products: Product[];
  fuelRates: Record<string, number>;
  activeShift: Shift;
  closingReadings: Record<string, number>;
  setClosingReadings: (val: Record<string, number>) => void;
  setWizardStep: (step: number) => void;
  handleConfirmClosings: () => void;
}

export function ClosingReadingsForm({
  t,
  setIsClosingScannerOpen,
  nozzles,
  products,
  fuelRates,
  activeShift,
  closingReadings,
  setClosingReadings,
  setWizardStep,
  handleConfirmClosings
}: ClosingReadingsFormProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
          <CheckCircle className="h-5 w-5 text-indigo-500" />
          {t("Closing Meter Readings", "اختتامی میٹر ریڈنگز")}
        </h3>
        <button
          onClick={() => setIsClosingScannerOpen(true)}
          className="bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded-lg text-sm font-medium border border-indigo-200 hover:bg-indigo-100 transition-colors flex items-center gap-2"
        >
          <span className="material-icons text-sm">qr_code_scanner</span>
          {t("AI Scan", "اے آئی اسکین")}
        </button>
      </div>

      <div className="space-y-6">
        {products.filter(p => p.type === 'fuel').map(product => {
          const prodNozzles = nozzles.filter(n => n.productId === product.id && activeShift.openingReadings[n.id] !== undefined);
          if (prodNozzles.length === 0) return null;

          return (
            <div key={product.id} className="bg-slate-50 p-4 rounded-xl border border-slate-100">
              <h4 className="font-bold text-slate-700 mb-3 flex items-center justify-between">
                <span>{product.name}</span>
                <span className="text-sm font-medium text-slate-500">
                  Rate: Rs {fuelRates[product.id] || 0}/L
                </span>
              </h4>
              <div className="space-y-3">
                {prodNozzles.map(nz => {
                  const opening = activeShift.openingReadings[nz.id] || 0;
                  const closing = closingReadings[nz.id] || 0;
                  const sold = closing > opening ? closing - opening : 0;
                  return (
                    <div key={nz.id} className="flex flex-row items-center gap-3">
                      <span className="font-medium text-sm text-slate-600 w-24">{nz.name}</span>
                      <div className="flex-1">
                        <input
                          type="number"
                          className="w-full rounded-lg border-slate-200 text-sm focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                          placeholder={t("Closing Reading", "اختتامی ریڈنگ")}
                          value={closingReadings[nz.id] || ""}
                          onChange={(e) => setClosingReadings({ ...closingReadings, [nz.id]: Number(e.target.value) })}
                        />
                        <div className="flex justify-between items-center mt-1">
                          <p className="text-xs text-slate-400">
                            Opening: {opening}
                          </p>
                          {closing > opening && (
                            <p className="text-xs font-bold text-indigo-600">
                              Sales: {sold.toFixed(2)} L
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-8 flex justify-between items-center pt-4 border-t border-slate-100">
        <button
          onClick={() => setWizardStep(3)}
          className="text-slate-500 hover:text-slate-700 font-medium text-sm flex items-center gap-1"
        >
          <RotateCcw className="h-4 w-4" />
          {t("Back to Dashboard", "ڈیش بورڈ پر واپس")}
        </button>
        <button
          onClick={handleConfirmClosings}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-lg font-bold flex items-center gap-2 transition-all shadow-sm"
        >
          {t("Confirm Closings", "اختتامی ریڈنگز کنفرم کریں")}
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
