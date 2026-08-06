import React from 'react';
import { Zap, Database, CheckCircle2 } from 'lucide-react';
import { Shift, Product, Nozzle } from '../../../types';
import { usePricingStore } from '../../../stores/usePricingStore';

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
 const { snapshots } = usePricingStore();
 const latestSSOTSnapshot = snapshots.length > 0 ? snapshots[0] : null;

 const hasPendingRevisions = activeShift?.pendingPriceRevisions && activeShift.pendingPriceRevisions.length > 0;
 const hasSSOTSnapshot = latestSSOTSnapshot !== null;

 if (!hasPendingRevisions && !hasSSOTSnapshot) return null;

 return (
 <div className="space-y-4">
 <h3 className="font-sans text-sm font-bold text-foreground border-b border-border pb-2 mb-4 flex items-center justify-between">
 <span className="flex items-center gap-2">
 <Database className="h-5 w-5 text-indigo-500 animate-pulse" />
 {t("Price Revision Impact Engine (SSOT Snapshot)","پرائس ریویژن سنگل سورس آف ٹروتھ")}
 </span>
 <span className="text-xs font-mono bg-emerald-500/10 text-emerald-500 px-2.5 py-0.5 rounded-md border border-emerald-500/20 font-bold">
   Next Shift New Price Active
 </span>
 </h3>

 {latestSSOTSnapshot && (
   <div className="bg-gradient-to-r from-slate-900 to-indigo-950 border border-indigo-500/30 rounded-2xl p-5 text-white space-y-3">
     <div className="flex items-center justify-between">
       <div className="flex items-center gap-2">
         <CheckCircle2 className="w-5 h-5 text-emerald-400" />
         <span className="font-black text-sm text-indigo-200">Active Snapshot #{latestSSOTSnapshot.versionLabel}</span>
       </div>
       <span className="text-xs text-indigo-300/80 font-mono">{latestSSOTSnapshot.circularNo}</span>
     </div>
     <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs pt-2 border-t border-indigo-500/20">
       <div>
         <div className="text-indigo-300">Product</div>
         <div className="font-bold text-white mt-0.5">{latestSSOTSnapshot.productName}</div>
       </div>
       <div>
         <div className="text-indigo-300">Rate Change</div>
         <div className="font-mono font-bold text-emerald-400 mt-0.5">Rs. {latestSSOTSnapshot.oldRate} → Rs. {latestSSOTSnapshot.newRate}</div>
       </div>
       <div>
         <div className="text-indigo-300">Sold Before Revision</div>
         <div className="font-mono font-bold text-amber-400 mt-0.5">{latestSSOTSnapshot.soldBeforeRevisionLiters.toLocaleString()} L</div>
       </div>
       <div>
         <div className="text-indigo-300">Stock Revaluation Gain</div>
         <div className="font-mono font-bold text-emerald-400 mt-0.5">+Rs. {latestSSOTSnapshot.inventoryGainAmount.toLocaleString()}</div>
       </div>
     </div>
   </div>
 )}

 {activeShift?.pendingPriceRevisions && activeShift.pendingPriceRevisions.map((rev) => {
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
 className="bg-card border border-red-500/20 rounded-xl p-5 mb-4 shadow-lg"
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
 className="flex flex-row items-center gap-3 bg-card p-2 rounded-lg border border-border"
 >
 <span className="font-bold text-sm text-muted-foreground w-24 pl-2">
 {nz.name}
 </span>
 <input
 type="number"
 className="flex-1 w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none transition-all font-mono"
 placeholder={t("Current Meter Reading","موجودہ میٹر ریڈنگ")}
 value={snapshotReadings[nz.id] ||""}
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

 <div className="mt-5 pt-4 border-t border-border">
 <label className="flex items-center gap-3 text-sm text-red-400 font-medium mb-3 cursor-pointer">
 <input
 type="checkbox"
 checked={snapshotOverride}
 onChange={(e) => setSnapshotOverride(e.target.checked)}
 className="w-4 h-4 rounded border-border bg-card text-red-500 focus:ring-red-500 focus:ring-offset-slate-800 transition-all"
 />
 {t(
"Owner Override (Apply new rate to entire shift without snapshot)",
"مالک کا اوور رائیڈ (نئی قیمت پوری شفٹ پر لاگو کریں)"
 )}
 </label>

 {snapshotOverride && (
 <input
 type="password"
 placeholder={t("Owner Price Override PIN","قیمت اوور رائیڈ پن")}
 value={snapshotPin}
 onChange={(e) => setSnapshotPin(e.target.value)}
 className="w-full sm:w-auto rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground focus:border-red-500 outline-none transition-all"
 />
 )}
 </div>

 <div className="mt-5 flex sm:justify-end">
 <button
 onClick={() => handleCaptureSnapshot(rev.productId)}
 className="w-full sm:w-auto bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white px-6 py-2.5 rounded-lg font-bold text-sm shadow-lg shadow-red-500/20 transition-all active:scale-95"
 >
 {t("Save Snapshot & Apply","سنیپ شاٹ محفوظ کریں")}
 </button>
 </div>
 </div>
 );
 })}
 </div>
 );
}
