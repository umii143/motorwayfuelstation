import React from 'react';
import { Play, ArrowRight, CheckCircle, RotateCcw, AlertTriangle, Info } from 'lucide-react';
import { Nozzle, Product, Shift } from '../../../types';

// Helper to determine color theme based on product type
const getProductTheme = (productName: string) => {
  const name = productName.toLowerCase();
  if (name.includes('petrol') || name.includes('super') || name.includes('hobc')) {
    return {
      bg: 'bg-orange-500/10',
      border: 'border-orange-500/20',
      text: 'text-orange-400',
      accent: 'text-orange-400',
      inputRing: 'focus:ring-orange-500 focus:border-orange-500',
      gradient: 'from-orange-500 to-red-500',
      badgeBg: 'bg-orange-500/20',
      badgeText: 'text-orange-300'
    };
  }
  if (name.includes('diesel') || name.includes('hsd')) {
    return {
      bg: 'bg-blue-500/10',
      border: 'border-blue-500/20',
      text: 'text-blue-400',
      accent: 'text-blue-400',
      inputRing: 'focus:ring-blue-500 focus:border-blue-500',
      gradient: 'from-blue-600 to-indigo-600',
      badgeBg: 'bg-blue-500/20',
      badgeText: 'text-blue-300'
    };
  }
  return {
    bg: 'bg-slate-800/50',
    border: 'border-slate-700/50',
    text: 'text-slate-300',
    accent: 'text-slate-400',
    inputRing: 'focus:ring-slate-500 focus:border-slate-500',
    gradient: 'from-slate-600 to-slate-800',
    badgeBg: 'bg-slate-800',
    badgeText: 'text-slate-300'
  };
};

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
    <div className="rounded-2xl border border-slate-700/50 bg-slate-800/80 backdrop-blur-xl p-6 shadow-2xl relative overflow-hidden">
      {/* Decorative background element */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 relative z-10">
        <div>
          <h3 className="text-xl font-black text-slate-200 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400 shadow-sm border border-emerald-500/20">
              <Play className="h-5 w-5" />
            </div>
            {t("Opening Meter Readings", "ابتدائی میٹر ریڈنگز")}
          </h3>
          <p className="text-sm text-slate-400 mt-1 ml-13">
            {t("Verify starting meters before initiating the session.", "سیشن شروع کرنے سے پہلے ابتدائی میٹرز کی تصدیق کریں۔")}
          </p>
        </div>
        <button
          onClick={() => setIsOpeningScannerOpen(true)}
          className="bg-slate-700 text-slate-200 px-4 py-2.5 rounded-xl text-sm font-bold shadow-md hover:bg-slate-600 transition-all flex items-center justify-center gap-2 active:scale-95 border border-slate-600"
        >
          <span className="material-icons text-base">qr_code_scanner</span>
          {t("Scan Meters with AI", "اے آئی سے اسکین کریں")}
        </button>
      </div>

      <div className="space-y-8 relative z-10">
        {products.filter(p => p.type === 'fuel').map(product => {
          const prodNozzles = nozzles.filter(n => n.productId === product.id);
          if (prodNozzles.length === 0) return null;

          const theme = getProductTheme(product.name);

          return (
            <div key={product.id} className="space-y-4">
              <div className="flex items-center gap-3 border-b border-slate-700/50 pb-2">
                <div className={`w-3 h-8 rounded-full bg-gradient-to-b ${theme.gradient}`}></div>
                <h4 className={`text-lg font-black ${theme.text}`}>
                  {product.name}
                </h4>
                <div className={`px-2.5 py-1 rounded-md text-xs font-bold ${theme.badgeBg} ${theme.badgeText} ml-auto shadow-sm border border-slate-700/50`}>
                  Rate: Rs {fuelRates[product.id] || 0}/L
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {prodNozzles.map(nz => {
                  const prevVal = previousClosingReadings[nz.id];
                  const currentVal = openingReadings[nz.id];
                  const isMatching = prevVal !== undefined && Number(currentVal) === Number(prevVal);
                  
                  return (
                    <div key={nz.id} className={`rounded-xl border ${isMatching ? 'border-emerald-500/30 bg-emerald-500/10' : theme.border + ' ' + theme.bg} p-4 shadow-sm transition-all hover:shadow-md`}>
                      <div className="flex justify-between items-start mb-3">
                        <span className={`font-black text-base ${theme.text}`}>{nz.name}</span>
                        {isMatching ? (
                          <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded-full border border-emerald-500/30">
                            <CheckCircle className="w-3 h-3" /> MATCH
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-[10px] font-bold text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full border border-slate-600">
                            <AlertTriangle className="w-3 h-3" /> VERIFY
                          </span>
                        )}
                      </div>
                      
                      <div className="relative">
                        <input
                          type="number"
                          className={`w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-3 text-lg font-mono font-bold text-slate-200 shadow-inner outline-none transition-all ${theme.inputRing} ${isMatching ? 'focus:border-emerald-500 focus:ring-emerald-500' : ''}`}
                          placeholder="0.00"
                          value={currentVal || ""}
                          onChange={(e) => setOpeningReadings({ ...openingReadings, [nz.id]: Number(e.target.value) })}
                        />
                      </div>
                      
                      <div className="mt-3 flex justify-between items-center text-xs">
                        <span className="text-slate-500 font-medium">Previous Close:</span>
                        <span className={`font-mono font-bold ${prevVal !== undefined ? 'text-slate-300' : 'text-slate-600'}`}>
                          {prevVal !== undefined ? prevVal.toLocaleString() : 'N/A'}
                        </span>
                      </div>
                      
                      {prevVal !== undefined && currentVal !== undefined && Number(currentVal) !== Number(prevVal) && (
                        <div className="mt-2 text-[10px] font-bold text-orange-400 bg-orange-500/10 p-1.5 rounded text-center flex items-center justify-center gap-1 border border-orange-500/30">
                          <Info className="w-3 h-3" />
                          <span>Reading differs from previous close</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-10 flex flex-col sm:flex-row justify-between items-center gap-4 pt-6 border-t border-slate-700/50 relative z-10">
        <button
          onClick={() => setWizardStep(1)}
          className="w-full sm:w-auto px-5 py-2.5 text-slate-400 hover:text-slate-200 hover:bg-slate-700 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all border border-transparent hover:border-slate-600"
        >
          <RotateCcw className="h-4 w-4" />
          {t("Back to Setup", "واپس")}
        </button>
        <button
          onClick={handleConfirmOpenings}
          className="w-full sm:w-auto bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white px-8 py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-500/30 active:scale-95"
        >
          <span>{t("CONFIRM & START SHIFT", "کنفرم کریں اور شفٹ شروع کریں")}</span>
          <ArrowRight className="h-5 w-5" />
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
    <div className="rounded-2xl border border-slate-700/50 bg-slate-800/80 backdrop-blur-xl p-6 shadow-2xl relative overflow-hidden">
      {/* Decorative background element */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 relative z-10">
        <div>
          <h3 className="text-xl font-black text-slate-200 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/20 text-indigo-400 shadow-sm border border-indigo-500/20">
              <CheckCircle className="h-5 w-5" />
            </div>
            {t("Closing Meter Readings", "اختتامی میٹر ریڈنگز")}
          </h3>
          <p className="text-sm text-slate-400 mt-1 ml-13">
            {t("Record final meters to calculate total sales for this shift.", "اس شفٹ کی فروخت کا حساب لگانے کے لیے آخری میٹرز درج کریں۔")}
          </p>
        </div>
        <button
          onClick={() => setIsClosingScannerOpen(true)}
          className="bg-slate-700 text-slate-200 px-4 py-2.5 rounded-xl text-sm font-bold shadow-md hover:bg-slate-600 transition-all flex items-center justify-center gap-2 active:scale-95 border border-slate-600"
        >
          <span className="material-icons text-base">qr_code_scanner</span>
          {t("Scan Meters with AI", "اے آئی سے اسکین کریں")}
        </button>
      </div>

      <div className="space-y-8 relative z-10">
        {products.filter(p => p.type === 'fuel').map(product => {
          const prodNozzles = nozzles.filter(n => n.productId === product.id && activeShift.openingReadings[n.id] !== undefined);
          if (prodNozzles.length === 0) return null;

          const theme = getProductTheme(product.name);

          return (
            <div key={product.id} className="space-y-4">
              <div className="flex items-center gap-3 border-b border-slate-700/50 pb-2">
                <div className={`w-3 h-8 rounded-full bg-gradient-to-b ${theme.gradient}`}></div>
                <h4 className={`text-lg font-black ${theme.text}`}>
                  {product.name}
                </h4>
                <div className={`px-2.5 py-1 rounded-md text-xs font-bold ${theme.badgeBg} ${theme.badgeText} ml-auto shadow-sm border border-slate-700/50`}>
                  Rate: Rs {fuelRates[product.id] || 0}/L
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {prodNozzles.map(nz => {
                  const opening = activeShift.openingReadings[nz.id] || 0;
                  const closing = closingReadings[nz.id] || 0;
                  const sold = closing >= opening ? closing - opening : 0;
                  const hasInput = closingReadings[nz.id] !== undefined && closing > opening;
                  const isError = closing !== 0 && closing < opening;
                  
                  return (
                    <div key={nz.id} className={`rounded-xl border ${isError ? 'border-red-500/50 bg-red-500/10' : theme.border + ' ' + theme.bg} p-4 shadow-sm transition-all hover:shadow-md relative overflow-hidden`}>
                      
                      {/* Sale Volume Watermark */}
                      {hasInput && !isError && (
                        <div className="absolute -bottom-2 -right-2 text-[60px] font-black text-emerald-500/5 pointer-events-none select-none z-0">
                          {sold.toFixed(0)}L
                        </div>
                      )}

                      <div className="flex justify-between items-start mb-3 relative z-10">
                        <span className={`font-black text-base ${theme.text}`}>{nz.name}</span>
                        {isError && (
                          <span className="flex items-center gap-1 text-[10px] font-bold text-red-400 bg-red-500/20 px-2 py-0.5 rounded-full border border-red-500/30">
                            <AlertTriangle className="w-3 h-3" /> INVALID
                          </span>
                        )}
                        {!isError && hasInput && (
                          <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded-full border border-emerald-500/30 shadow-sm">
                            +{sold.toFixed(1)} L SOLD
                          </span>
                        )}
                      </div>
                      
                      <div className="relative z-10">
                        <input
                          type="number"
                          className={`w-full bg-slate-900 border ${isError ? 'border-red-500 focus:ring-red-500 focus:border-red-500 text-red-400' : 'border-slate-700 text-slate-200 ' + theme.inputRing} rounded-lg px-3 py-3 text-xl font-mono font-black shadow-inner outline-none transition-all`}
                          placeholder={opening.toString()}
                          value={closingReadings[nz.id] || ""}
                          onChange={(e) => setClosingReadings({ ...closingReadings, [nz.id]: Number(e.target.value) })}
                        />
                      </div>
                      
                      <div className="mt-3 flex justify-between items-center text-xs relative z-10">
                        <div className="flex flex-col">
                          <span className="text-slate-500 font-semibold text-[10px] uppercase">Opening</span>
                          <span className="font-mono font-bold text-slate-400">{opening.toLocaleString()}</span>
                        </div>
                        {hasInput && !isError && (
                          <div className="flex flex-col items-end">
                            <span className="text-slate-500 font-semibold text-[10px] uppercase">Amount</span>
                            <span className={`font-mono font-black ${theme.accent}`}>Rs. {(sold * (fuelRates[product.id] || 0)).toLocaleString(undefined, {maximumFractionDigits: 0})}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-10 flex flex-col sm:flex-row justify-between items-center gap-4 pt-6 border-t border-slate-700/50 relative z-10">
        <button
          onClick={() => setWizardStep(3)}
          className="w-full sm:w-auto px-5 py-2.5 text-slate-400 hover:text-slate-200 hover:bg-slate-700 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all border border-transparent hover:border-slate-600"
        >
          <RotateCcw className="h-4 w-4" />
          {t("Back to Active Session", "ڈیش بورڈ پر واپس")}
        </button>
        <button
          onClick={handleConfirmClosings}
          className="w-full sm:w-auto bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white px-8 py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-500/30 active:scale-95"
        >
          <span>{t("CONFIRM CLOSING READINGS", "اختتامی ریڈنگز کنفرم کریں")}</span>
          <ArrowRight className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
