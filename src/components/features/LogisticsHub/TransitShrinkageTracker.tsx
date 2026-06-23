import React, { useMemo } from 'react';
import { AlertTriangle, Droplet, TrendingDown, Thermometer, ShieldAlert, Download } from 'lucide-react';
import { GlobalSettings } from '../../../types';

interface Props {
  settings: GlobalSettings;
  stationId: string;
}

 
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default function TransitShrinkageTracker({ settings, stationId }: Props) {
  // Generate historical delivery datasets for demonstration
  const deliveries = useMemo(() => {
    return [
      { id: 'DEL-8991', date: 'Today, 08:30 AM', supplier: 'Attock Petroleum', product: 'High Speed Diesel', dispatched: 40000, decanted: 39950, temp: '28°C', driver: 'Khalid Mehmood' },
      { id: 'DEL-8985', date: 'Yesterday, 11:15 AM', supplier: 'Pakistan State Oil', product: 'Petrol (Super)', dispatched: 25000, decanted: 24980, temp: '32°C', driver: 'Waseem Akram' },
      { id: 'DEL-8971', date: '14-Jun-2026', supplier: 'Shell Pakistan', product: 'Hi-Octane', dispatched: 10000, decanted: 9850, temp: '35°C', driver: 'Asif Ali' }, // High Loss
      { id: 'DEL-8962', date: '12-Jun-2026', supplier: 'Attock Petroleum', product: 'High Speed Diesel', dispatched: 40000, decanted: 39980, temp: '25°C', driver: 'Khalid Mehmood' },
    ];
  }, []);

  const formatLiters = (val: number) => val.toLocaleString() + ' L';
  const getLossPercentage = (disp: number, dec: number) => (((disp - dec) / disp) * 100).toFixed(2);

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-300">
      
      {/* HEADER CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-[#111827] rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Total Transit Loss (30 Days)</p>
            <h3 className="text-2xl font-black text-rose-500">-220 Liters</h3>
          </div>
          <div className="w-12 h-12 rounded-full bg-rose-500/10 flex items-center justify-center text-rose-500">
            <Droplet className="w-6 h-6" />
          </div>
        </div>
        <div className="bg-white dark:bg-[#111827] rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Avg. Evaporation Rate</p>
            <h3 className="text-2xl font-black text-emerald-500">0.05%</h3>
          </div>
          <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500">
            <Thermometer className="w-6 h-6" />
          </div>
        </div>
        <div className="bg-gradient-to-br from-indigo-900 to-slate-900 rounded-xl border border-indigo-500/20 p-6 shadow-sm flex items-center justify-between relative overflow-hidden">
          <div className="relative z-10">
            <p className="text-xs font-bold text-indigo-200 uppercase tracking-wider mb-1">High Risk Drivers</p>
            <h3 className="text-2xl font-black text-white">1 Flagged</h3>
          </div>
          <div className="relative z-10 w-12 h-12 rounded-full bg-rose-500 flex items-center justify-center text-white shadow-lg animate-pulse">
            <ShieldAlert className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* MATRIX TABLE */}
      <div className="bg-white dark:bg-[#111827] rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col">
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#0B0F19] flex justify-between items-center">
          <div className="flex items-center gap-3">
            <TrendingDown className="w-5 h-5 text-orange-500" />
            <h3 className="font-bold text-slate-900 dark:text-white">Delivery Shrinkage Matrix</h3>
          </div>
          <button className="flex items-center gap-2 text-sm font-bold text-slate-600 dark:text-slate-300 hover:text-indigo-500 transition-colors">
            <Download className="w-4 h-4" /> Export Report
          </button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-100 dark:bg-slate-800/50 text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                <th className="px-6 py-4">Delivery ID</th>
                <th className="px-6 py-4">Supplier / Product</th>
                <th className="px-6 py-4">Driver</th>
                <th className="px-6 py-4 text-center">Dispatched (L)</th>
                <th className="px-6 py-4 text-center">Decanted (L)</th>
                <th className="px-6 py-4 text-center">Variance</th>
                <th className="px-6 py-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
              {deliveries.map((del) => {
                const loss = del.dispatched - del.decanted;
                const percentage = parseFloat(getLossPercentage(del.dispatched, del.decanted));
                
                const isCritical = percentage > 0.5; // Above 0.5% is considered critical theft/loss
                
                return (
                  <tr key={del.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold text-sm text-slate-900 dark:text-white">{del.id}</div>
                      <div className="text-xs text-slate-500">{del.date}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-sm text-slate-700 dark:text-slate-300">{del.supplier}</div>
                      <div className="text-xs text-slate-500">{del.product}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-sm text-slate-700 dark:text-slate-300">{del.driver}</div>
                      <div className="text-xs text-slate-500">Temp: {del.temp}</div>
                    </td>
                    <td className="px-6 py-4 text-center font-mono text-sm">{formatLiters(del.dispatched)}</td>
                    <td className="px-6 py-4 text-center font-mono text-sm font-bold text-slate-900 dark:text-white">{formatLiters(del.decanted)}</td>
                    <td className="px-6 py-4 text-center">
                      <div className={`inline-flex items-center gap-1 font-bold text-sm ${isCritical ? 'text-rose-500' : 'text-slate-500'}`}>
                        -{loss} L
                      </div>
                      <div className={`text-[10px] font-bold ${isCritical ? 'text-rose-400' : 'text-slate-400'}`}>
                        ({percentage}%)
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {isCritical ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-bold">
                          <AlertTriangle className="w-3.5 h-3.5" /> Suspected Theft
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold">
                           Normal Evap.
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
