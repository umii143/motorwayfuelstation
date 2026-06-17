import React from 'react';
import { Zap } from 'lucide-react';
import { Shift, Product, Nozzle } from '../../../types';

interface ShiftNozzleReadingsProps {
  t: (en: string, ur: string) => string;
  activeShift: Shift;
  products: Product[];
  nozzles: Nozzle[];
  snapshotReadings: Record<string, string>;
  setSnapshotReadings: (val: Record<string, string>) => void;
  snapshotOverride: boolean;
  setSnapshotOverride: (val: boolean) => void;
  snapshotPin: string;
  setSnapshotPin: (val: string) => void;
  handleCaptureSnapshot: (productId: string) => void;
}

export function ShiftNozzleReadings({
  t,
  activeShift,
  products,
  nozzles,
  snapshotReadings,
  setSnapshotReadings,
  snapshotOverride,
  setSnapshotOverride,
  snapshotPin,
  setSnapshotPin,
  handleCaptureSnapshot,
}: ShiftNozzleReadingsProps) {
  if (!activeShift?.pendingPriceRevisions) return null;

  return (
    <div className="space-y-4">
      <h3 className="font-sans text-sm font-bold text-slate-200 border-b border-slate-700/50 pb-2 mb-4 flex items-center justify-between">
        <span className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-red-500" />
          {t("Mid-Shift Price Revision Snapshot", "قیمت میں تبدیلی کا سنیپ شاٹ")}
        </span>
      </h3>
      
      {activeShift.pendingPriceRevisions.map((rev) => {
        const prod = products.find((p) => p.id === rev.productId);
        const prodNozzles = nozzles.filter(
          (n) =>
            activeShift.openingReadings[n.id] !== undefined &&
            n.productId === rev.productId
        );
        if (!prod) return null;

        return (
          <div
            key={rev.id}
            className="bg-slate-800/50 border border-red-500/20 rounded-xl p-5 mb-4 shadow-lg"
          >
            <div className="flex flex-row items-center justify-between mb-4 gap-2 sm:gap-0">
              <div>
                <h4 className="font-bold text-red-400 text-sm tracking-wide">{prod.name}</h4>
                <p className="text-xs text-red-300/80 mt-1 font-mono">
                  Old: Rs {rev.oldRate} → New: Rs {rev.newRate}
                </p>
              </div>
              <div className="text-left sm:text-right text-xs text-red-400/80 font-mono bg-red-500/10 px-3 py-1 rounded-full border border-red-500/20">
                Effective: {new Date(rev.effectiveAt).toLocaleTimeString()}
              </div>
            </div>

            <div className="space-y-3">
              {prodNozzles.map((nz) => (
                <div
                  key={nz.id}
                  className="flex flex-row items-center gap-3 bg-slate-900/50 p-2 rounded-lg border border-slate-700/50"
                >
                  <span className="font-bold text-sm text-slate-300 w-24 pl-2">
                    {nz.name}
                  </span>
                  <input
                    type="number"
                    className="flex-1 w-full rounded-md border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-slate-200 focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none transition-all font-mono"
                    placeholder={t("Current Meter Reading", "موجودہ میٹر ریڈنگ")}
                    value={snapshotReadings[nz.id] || ""}
                    onChange={(e) =>
                      setSnapshotReadings({
                        ...snapshotReadings,
                        [nz.id]: e.target.value,
                      })
                    }
                  />
                </div>
              ))}
            </div>

            <div className="mt-5 pt-4 border-t border-slate-700/50">
              <label className="flex items-center gap-3 text-sm text-red-400 font-medium mb-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={snapshotOverride}
                  onChange={(e) => setSnapshotOverride(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-red-500 focus:ring-red-500 focus:ring-offset-slate-800 transition-all"
                />
                {t(
                  "Owner Override (Apply new rate to entire shift without snapshot)",
                  "مالک کا اوور رائیڈ (نئی قیمت پوری شفٹ پر لاگو کریں)"
                )}
              </label>

              {snapshotOverride && (
                <input
                  type="password"
                  placeholder={t("Owner Price Override PIN", "قیمت اوور رائیڈ پن")}
                  value={snapshotPin}
                  onChange={(e) => setSnapshotPin(e.target.value)}
                  className="w-full sm:w-auto rounded-md border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-slate-200 focus:border-red-500 outline-none transition-all"
                />
              )}
            </div>

            <div className="mt-5 flex sm:justify-end">
              <button
                onClick={() => handleCaptureSnapshot(rev.productId)}
                className="w-full sm:w-auto bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white px-6 py-2.5 rounded-lg font-bold text-sm shadow-lg shadow-red-500/20 transition-all active:scale-95"
              >
                {t("Save Snapshot & Apply", "سنیپ شاٹ محفوظ کریں")}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
