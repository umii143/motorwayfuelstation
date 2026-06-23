import React, { useMemo } from 'react';
import { useInventoryStore } from '../../stores/useInventoryStore';
import { useShiftStore } from '../../stores/useShiftStore';
import { Zap, Clock, ShieldAlert, CheckCircle, TrendingUp } from 'lucide-react';
import { GlobalSettings } from '../../types';

interface PriceIntelligenceHubProps {
  settings: GlobalSettings;
}

export default function PriceIntelligenceHub({ settings }: PriceIntelligenceHubProps) {
  const t = (en: string, ur: string) => settings?.language === 'ur' ? ur : en;
  const shifts = useShiftStore((s) => s.shifts);
  const products = useInventoryStore((s) => s.products);

  // Extract all mid-shift price segments across all shifts to generate compliance metrics
  const priceRevisionEvents = useMemo(() => {
     
    const events: unknown[] = [];
    shifts.forEach(shift => {
      if (shift.segments && shift.segments.length > 0) {
        // Group segments by nozzle to find the first price segment (since a price change causes segment splitting)
        // Wait, multiple nozzles are split per product, but they share the same effectiveAt.
         
        // We can group by effectiveAt & shiftId
        const groups: Record<string, unknown> = { /* empty */ };
        shift.segments.forEach(seg => {
          if (!seg.effectiveAt || !seg.capturedAt) return; // Only count new ShiftPriceSegment types
          const key = `${shift.id}_${seg.productId}_${seg.effectiveAt}`;
          if (!groups[key]) {
            groups[key] = {
              shiftId: shift.id,
              shiftDate: shift.date,
              productId: seg.productId,
              productName: products.find(p => p.id === seg.productId)?.name || 'Product',
              oldRate: seg.oldRate,
              newRate: seg.newRate,
              effectiveAt: seg.effectiveAt,
              capturedAt: seg.capturedAt,
              delayMinutes: seg.delayMinutes,
              delayStatus: seg.delayStatus,
              nozzlesCount: 1,
            };
          } else {
            groups[key].nozzlesCount++;
          }
        });
        Object.values(groups).forEach(g => events.push(g));
      }
    });
    // Sort newest first
    return events.sort((a, b) => new Date(b.effectiveAt).getTime() - new Date(a.effectiveAt).getTime());
  }, [shifts, products]);

  // Compliance Score calculation
  const complianceScore = useMemo(() => {
    if (priceRevisionEvents.length === 0) return 100;
    const total = priceRevisionEvents.length;
    let score = 0;
    priceRevisionEvents.forEach(e => {
      if (e.delayStatus === 'normal') score += 100;
      else if (e.delayStatus === 'warning') score += 50;
      else if (e.delayStatus === 'critical') score += 0;
    });
    return Math.round(score / total);
  }, [priceRevisionEvents]);

  return (
    <div className="space-y-6">
      <div className="flex flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 font-sans tracking-tight flex items-center gap-2">
            <Zap className="h-6 w-6 text-yellow-500" />
            {t("Price Intelligence Ledger", "پرائس انٹیلیجنس لیجر")}
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            {t("Audit trail of mid-shift price revisions and snapshot compliance.", "قیمت کی تبدیلی اور سنیپ شاٹ کا مکمل ریکارڈ")}
          </p>
        </div>
        
        <div className="premium-card px-5 py-3 border border-slate-200 flex items-center ga w-full sm:w-auto">
          <div>
            <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">{t("Compliance Score", "کمپلائنس اسکور")}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className={`text-2xl font-bold font-mono ${
                complianceScore >= 90 ? 'text-green-600' :
                complianceScore >= 70 ? 'text-yellow-600' : 'text-red-600'
              }`}>
                {complianceScore}%
              </span>
              {complianceScore >= 90 && <TrendingUp className="h-4 w-4 text-green-500" />}
            </div>
          </div>
        </div>
      </div>

      <div className="premium-card border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="premium-table">
            <thead>
              <tr>
                <th className="text-slate-600">{t("Shift & Date", "شفٹ اور تاریخ")}</th>
                <th className="text-slate-600">{t("Product", "پراڈکٹ")}</th>
                <th className="text-slate-600">{t("Rate Change", "نئی قیمت")}</th>
                <th className="text-slate-600">{t("Effective", "لاگو وقت")}</th>
                <th className="text-slate-600">{t("Captured", "درج وقت")}</th>
                <th className="text-slate-600">{t("Delay", "تاخیر")}</th>
                <th className="text-slate-600">{t("Status", "سٹیٹس")}</th>
              </tr>
            </thead>
            <tbody className="font-mono">
              {priceRevisionEvents.map((ev, i) => (
                <tr key={i} className="hover:bg-slate-50">
                  <td>
                    <span className="font-sans font-medium text-indigo-600">#{ev.shiftId.slice(-6)}</span>
                    <br/>
                    <span className="text-xs text-slate-500">{new Date(ev.shiftDate).toLocaleDateString()}</span>
                  </td>
                  <td>{ev.productName}</td>
                  <td>
                    Rs {ev.oldRate} → <span className="text-red-600 font-bold">Rs {ev.newRate}</span>
                  </td>
                  <td className="text-slate-600">
                    {new Date(ev.effectiveAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  </td>
                  <td className="text-slate-600">
                    {new Date(ev.capturedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  </td>
                  <td>
                    {ev.delayMinutes} min
                  </td>
                  <td>
                    {ev.delayStatus === 'normal' && <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-2.5 py-1 text-xs font-bold text-green-700 font-sans"><CheckCircle className="h-3.5 w-3.5"/> Normal</span>}
                    {ev.delayStatus === 'warning' && <span className="inline-flex items-center gap-1.5 rounded-full bg-yellow-50 px-2.5 py-1 text-xs font-bold text-yellow-700 font-sans"><Clock className="h-3.5 w-3.5"/> Warning</span>}
                    {ev.delayStatus === 'critical' && <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-2.5 py-1 text-xs font-bold text-red-700 font-sans"><ShieldAlert className="h-3.5 w-3.5"/> Critical</span>}
                  </td>
                </tr>
              ))}
              {priceRevisionEvents.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-500 font-sans">
                    {t("No mid-shift price revisions recorded yet.", "ابھی تک کوئی مڈ-شفٹ تبدیلی کا ریکارڈ موجود نہیں ہے۔")}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
