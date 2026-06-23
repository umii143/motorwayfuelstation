import React, { useState, useEffect } from 'react';
import { GlobalSettings, TankerDelivery, TankerSchedule, Supplier } from '../../../types';
import { db } from '../../../data/db';
import { ArrowRightLeft, TrendingDown, Scale, Truck, AlertTriangle } from 'lucide-react';

interface LogisticsDashboardProps {
  settings: GlobalSettings;
  stationId: string;
}

export default function LogisticsDashboard({ settings, stationId }: LogisticsDashboardProps) {
  const [deliveries, setDeliveries] = useState<TankerDelivery[]>([]);
  const [schedules, setSchedules] = useState<TankerSchedule[]>([]);
   
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);

   
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDeliveries(db.getTankerDeliveries(stationId));
    setSchedules(db.getTankerSchedules(stationId));
    setSuppliers(db.getSuppliers(stationId));
  }, [stationId]);

  const pendingSchedules = schedules.filter(s => s.status === 'pending' || s.status === 'in_transit');
  
  const currentMonthDeliveries = deliveries.filter(d => {
    const txnDate = new Date(d.actualDeliveryDate);
    const now = new Date();
    return txnDate.getMonth() === now.getMonth() && txnDate.getFullYear() === now.getFullYear();
  });

  const mtdReceivedVolume = currentMonthDeliveries.reduce((sum, d) => sum + d.actualDipQuantity, 0);
  const mtdShortageVolume = currentMonthDeliveries.reduce((sum, d) => sum + d.shortageQuantity, 0);
  const mtdShortageLoss = currentMonthDeliveries.reduce((sum, d) => sum + d.shortageAmount, 0);

  const disputedDeliveries = deliveries.filter(d => d.status === 'disputed');

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
        <div className="kpi-card p-3 relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 w-16 h-16 bg-rose-500/10 rounded-full group-hover:scale-110 transition-transform"></div>
          <div className="relative">
            <div className="flex justify-between items-start mb-1">
              <span className="text-[10px] font-bold text-slate-500 uppercase">Incoming Tankers</span>
              <div className="p-1.5 bg-rose-500/10 text-rose-500 rounded-lg">
                <Truck className="h-3.5 w-3.5" />
              </div>
            </div>
            <div className="text-xl font-black font-mono text-slate-800 dark:text-slate-100">{pendingSchedules.length}</div>
            <div className="text-[10px] text-slate-500 mt-1 font-medium truncate">Scheduled & in transit</div>
          </div>
        </div>

        <div className="kpi-card p-3 relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 w-16 h-16 bg-indigo-500/10 rounded-full group-hover:scale-110 transition-transform"></div>
          <div className="relative">
            <div className="flex justify-between items-start mb-1">
              <span className="text-[10px] font-bold text-slate-500 uppercase">MTD Received</span>
              <div className="p-1.5 bg-indigo-500/10 text-indigo-500 rounded-lg">
                <ArrowRightLeft className="h-3.5 w-3.5" />
              </div>
            </div>
            <div className="text-xl font-black font-mono text-slate-800 dark:text-slate-100">{mtdReceivedVolume.toLocaleString()} <span className="text-xs text-slate-500 font-sans">L</span></div>
            <div className="text-[10px] text-slate-500 mt-1 font-medium truncate">Fuel decanted this month</div>
          </div>
        </div>

        <div className="kpi-card p-3 relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 w-16 h-16 bg-amber-500/10 rounded-full group-hover:scale-110 transition-transform"></div>
          <div className="relative">
            <div className="flex justify-between items-start mb-1">
              <span className="text-[10px] font-bold text-slate-500 uppercase">MTD Shortage</span>
              <div className="p-1.5 bg-amber-500/10 text-amber-500 rounded-lg">
                <Scale className="h-3.5 w-3.5" />
              </div>
            </div>
            <div className="text-xl font-black font-mono text-slate-800 dark:text-slate-100">{mtdShortageVolume.toLocaleString()} <span className="text-xs text-slate-500 font-sans">L</span></div>
            <div className="text-[10px] text-slate-500 mt-1 font-medium truncate">Lost in transit/decanting</div>
          </div>
        </div>

        <div className="kpi-card p-3 relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 w-16 h-16 bg-rose-500/10 rounded-full group-hover:scale-110 transition-transform"></div>
          <div className="relative">
            <div className="flex justify-between items-start mb-1">
              <span className="text-[10px] font-bold text-slate-500 uppercase">Shortage Loss</span>
              <div className="p-1.5 bg-rose-500/10 text-rose-500 rounded-lg">
                <TrendingDown className="h-3.5 w-3.5" />
              </div>
            </div>
            <div className="text-xl font-black font-mono text-rose-500 truncate">{settings.currency} {mtdShortageLoss.toLocaleString()}</div>
            <div className="text-[10px] text-slate-500 mt-1 font-medium truncate">Financial impact of MTD losses</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Disputed Deliveries */}
        <div className="bg-theme-card rounded-xl border border-theme-main shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-theme-main flex items-center justify-between">
            <h3 className="font-bold text-xs text-theme-main flex items-center gap-1.5">
              <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
              Disputed Deliveries
            </h3>
            <span className="text-[10px] font-bold bg-amber-500/10 text-amber-500 px-2 py-0.5 rounded-full">
              {disputedDeliveries.length} Pending
            </span>
          </div>
          <div className="divide-y divide-theme-main">
            {disputedDeliveries.map(del => {
              const schedule = schedules.find(s => s.id === del.scheduleId);
              return (
                <div key={del.id} className="p-3 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                  <div>
                    <div className="font-bold text-slate-800 dark:text-slate-200 text-xs">PO: {schedule?.poNumber || 'Unknown'}</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">Date: {new Date(del.actualDeliveryDate).toLocaleDateString()}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono text-xs font-black text-amber-500">Shortage: {del.shortageQuantity} L</div>
                    <div className="text-[10px] text-slate-500 mt-0.5 font-mono">Value: {settings.currency} {del.shortageAmount}</div>
                  </div>
                </div>
              );
            })}
            {disputedDeliveries.length === 0 && (
              <div className="p-6 text-center text-xs text-slate-500 flex flex-col items-center">
                <div className="w-10 h-10 bg-emerald-500/10 rounded-full flex items-center justify-center mb-2">
                  <Scale className="h-5 w-5 text-emerald-500" />
                </div>
                No disputed deliveries. All shortages are within acceptable limits.
              </div>
            )}
          </div>
        </div>

        {/* Supplier Performance */}
        <div className="bg-theme-card rounded-xl border border-theme-main shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-theme-main flex items-center justify-between">
            <h3 className="font-bold text-xs text-theme-main flex items-center gap-1.5">
              <Truck className="h-3.5 w-3.5 text-indigo-500" />
              OMC Supplier Performance
            </h3>
          </div>
          <div className="p-4">
            <p className="text-xs text-slate-500 italic">
              Record more deliveries to generate OMC supplier performance reports. The system will track which suppliers have the highest delivery shortages over time.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
