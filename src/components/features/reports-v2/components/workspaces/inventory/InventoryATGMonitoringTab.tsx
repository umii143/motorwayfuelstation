/**
 * @license SPDX-License-Identifier: Apache-2.0
 *
 * FuelPro Enterprise Business Operating System v4.0
 * InventoryATGMonitoringTab — Automatic Tank Gauge Probe Diagnostics Sub-Workspace
 *
 * Implements Enterprise Rule #149
 * Manual Tank Dip is the Primary System of Record; ATG probe telemetry is an optional overlay.
 */

import React from 'react';
import { Activity, Wifi, RefreshCw, ShieldAlert } from 'lucide-react';
import toast from 'react-hot-toast';

interface InventoryATGMonitoringTabProps {
  lang: 'en' | 'ur';
}

export const InventoryATGMonitoringTab: React.FC<InventoryATGMonitoringTabProps> = ({ lang }) => {
  const isEn = lang === 'en';

  return (
    <div className="space-y-4">
      {/* DIAGNOSTICS BANNER */}
      <div className="bg-slate-900 text-white p-5 rounded-2xl border border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center text-2xl font-bold">
            📡
          </div>
          <div>
            <h2 className="text-base font-black text-white">ATG Hardware Probe Diagnostics & Telemetry</h2>
            <p className="text-xs font-semibold text-slate-300 mt-0.5">
              Manual Tank Dip is the Primary System of Record. ATG probe connections run in optional diagnostic mode.
            </p>
          </div>
        </div>

        <button
          onClick={() => toast.success(isEn ? "Pinging probe telemetry sensors..." : "سینسرز کی تلاش جاری ہے...")}
          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-black rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-2"
        >
          <RefreshCw size={14} />
          <span>Ping Probe Telemetry</span>
        </button>
      </div>

      {/* MANUAL DIP PRIMACY / NO HARDWARE CONNECTED BANNER */}
      <div className="bg-card rounded-2xl border border-border p-8 shadow-xs flex flex-col items-center justify-center text-center space-y-3">
        <div className="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center text-3xl font-black">
          🛡️
        </div>
        <h3 className="text-base font-black text-foreground">
          {isEn ? 'Manual Tank Dip Active (Primary System of Record)' : 'مینوئل ڈیپ فعال ہے (بنیادی ریکارڈ)'}
        </h3>
        <p className="text-xs font-bold text-muted-foreground max-w-lg">
          {isEn
            ? 'FuelPro enforces physical manual tank dips as the authoritative operational record. Automatic Tank Gauge (ATG) probes (Veeder-Root / Tokheim Modbus TCP) can be paired as secondary sensor feeds in settings.'
            : 'فیول پرو فزیکل مینوئل ڈیپ کو حتمی عملیاتی حقیقت تسلیم کرتا ہے۔ اے ٹی جی سینسرز کو سیکنڈری ڈیوائس کے طور پر لنک کیا جا سکتا ہے۔'}
        </p>
        <div className="pt-2 flex items-center gap-3">
          <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 text-xs font-black border border-emerald-500/25">
            ● MANUAL DIP ENGINE VERIFIED
          </span>
          <span className="px-3 py-1 rounded-full bg-amber-500/10 text-amber-600 text-xs font-black border border-amber-500/25">
            OPTIONAL ATG OVERLAY IDLE
          </span>
        </div>
      </div>
    </div>
  );
};
