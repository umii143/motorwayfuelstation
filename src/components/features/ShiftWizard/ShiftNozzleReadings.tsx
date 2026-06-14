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
      <h3 className="font-sans text-sm font-bold text-slate-800 border-b border-slate-100 pb-2 mb-4 flex items-center justify-between">
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
            className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4"
          >
            <div className="flex flex-row items-center justify-between mb-3 gap-2 sm:gap-0">
              <div>
                <h4 className="font-bold text-red-800 text-sm">{prod.name}</h4>
                <p className="text-xs text-red-600">
                  Old: Rs {rev.oldRate} → New: Rs {rev.newRate}
                </p>
              </div>
              <div className="text-left sm:text-right text-xs text-red-500">
                Effective: {new Date(rev.effectiveAt).toLocaleTimeString()}
              </div>
            </div>

            <div className="space-y-3">
              {prodNozzles.map((nz) => (
                <div
                  key={nz.id}
                  className="flex flex-row items-center gap-2"
                >
                  <span className="font-medium text-sm text-slate-700 w-24">
                    {nz.name}
                  </span>
                  <input
                    type="number"
                    className="flex-1 w-full rounded-md border-slate-200 text-sm"
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

            <div className="mt-4 pt-4 border-t border-red-200">
              <label className="flex items-center gap-2 text-sm text-red-800 font-medium mb-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={snapshotOverride}
                  onChange={(e) => setSnapshotOverride(e.target.checked)}
                  className="rounded border-red-300 text-red-600 focus:ring-red-500"
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
                  className="mt-2 w-full sm:w-auto rounded-md border-slate-200 text-sm"
                />
              )}
            </div>

            <div className="mt-4 flex sm:justify-end">
              <button
                onClick={() => handleCaptureSnapshot(rev.productId)}
                className="w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md font-bold text-sm"
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
