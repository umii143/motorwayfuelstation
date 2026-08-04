/**
 * @license SPDX-License-Identifier: Apache-2.0
 *
 * FuelPro Enterprise Business Operating System v4.0
 * InventoryATGMonitoringTab — Veeder-Root & Automatic Tank Gauge Probe Diagnostics Sub-Workspace
 *
 * Implements Enterprise Rule #149
 */

import React from 'react';
import { Activity, Wifi, Battery, Server, RefreshCw } from 'lucide-react';

interface InventoryATGMonitoringTabProps {
  lang: 'en' | 'ur';
}

export const InventoryATGMonitoringTab: React.FC<InventoryATGMonitoringTabProps> = ({ lang }) => {
  const isEn = lang === 'en';

  const probes = [
    {
      id: 'PROBE-01',
      tankName: 'Super Petrol Tank #1',
      model: 'Veeder-Root TLS-450PLUS Probe',
      ipAddress: '192.168.1.150:8001',
      serialNumber: 'VR-TLS450-99824',
      status: 'ONLINE_CONNECTED',
      signalPercent: 98,
      batteryPercent: 100,
      firmwareVersion: 'v4.2.1-BETA',
      latencyMs: 12,
      sensorErrorsCount: 0,
      lastHeartbeat: '2 seconds ago',
    },
    {
      id: 'PROBE-02',
      tankName: 'High Speed Diesel Tank #2',
      model: 'Veeder-Root TLS-450PLUS Probe',
      ipAddress: '192.168.1.151:8001',
      serialNumber: 'VR-TLS450-99825',
      status: 'ONLINE_CONNECTED',
      signalPercent: 95,
      batteryPercent: 99,
      firmwareVersion: 'v4.2.1-BETA',
      latencyMs: 15,
      sensorErrorsCount: 0,
      lastHeartbeat: '2 seconds ago',
    },
  ];

  return (
    <div className="space-y-4">
      {/* DIAGNOSTICS BANNER */}
      <div className="bg-slate-900 text-white p-5 rounded-2xl border border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center text-2xl font-bold">
            📡
          </div>
          <div>
            <h2 className="text-base font-black text-white">Veeder-Root TLS-450 ATG Probe Diagnostics (Rule #149)</h2>
            <p className="text-xs font-semibold text-slate-400 mt-0.5">
              Live hardware telemetry, signal quality, battery voltage, and Modbus/TCP latency.
            </p>
          </div>
        </div>

        <button className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-black rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-2">
          <RefreshCw size={14} className="animate-spin" />
          <span>Ping Probe Telemetry</span>
        </button>
      </div>

      {/* PROBES DIAGNOSTICS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {probes.map((p) => (
          <div key={p.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-xs font-black text-slate-400 uppercase tracking-wider">{p.id} • {p.model}</span>
                <h3 className="text-lg font-black text-slate-900">{p.tankName}</h3>
              </div>
              <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-black border border-emerald-200 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>ONLINE CONNECTED</span>
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs font-bold">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                <span className="text-slate-400">Signal Strength</span>
                <span className="font-black text-emerald-700">{p.signalPercent}%</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                <span className="text-slate-400">Battery Level</span>
                <span className="font-black text-emerald-700">{p.batteryPercent}%</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                <span className="text-slate-400">IP Address</span>
                <span className="font-black text-slate-800">{p.ipAddress}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                <span className="text-slate-400">Latency / Ping</span>
                <span className="font-black text-slate-800">{p.latencyMs} ms</span>
              </div>
            </div>

            <div className="text-[11px] font-semibold text-slate-500 pt-2 border-t border-slate-100 flex justify-between">
              <span>Serial: {p.serialNumber}</span>
              <span>Firmware: {p.firmwareVersion}</span>
              <span>Last Sync: {p.lastHeartbeat}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
