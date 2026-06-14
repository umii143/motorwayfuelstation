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
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);

  useEffect(() => {
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-rose-50 rounded-full group-hover:scale-110 transition-transform"></div>
          <div className="relative">
            <div className="flex justify-between items-start mb-2">
              <span className="text-xs font-bold text-slate-500 uppercase">Incoming Tankers</span>
              <div className="p-2 bg-rose-100 text-rose-600 rounded-lg">
                <Truck className="h-4 w-4" />
              </div>
            </div>
            <div className="text-2xl font-black font-mono text-slate-900">{pendingSchedules.length}</div>
            <div className="text-xs text-slate-500 mt-2 font-medium">Scheduled & in transit</div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-indigo-50 rounded-full group-hover:scale-110 transition-transform"></div>
          <div className="relative">
            <div className="flex justify-between items-start mb-2">
              <span className="text-xs font-bold text-slate-500 uppercase">MTD Received</span>
              <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
                <ArrowRightLeft className="h-4 w-4" />
              </div>
            </div>
            <div className="text-2xl font-black font-mono text-slate-900">{mtdReceivedVolume.toLocaleString()} <span className="text-base text-slate-500 font-sans">Liters</span></div>
            <div className="text-xs text-slate-500 mt-2 font-medium">Fuel decanted this month</div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-amber-50 rounded-full group-hover:scale-110 transition-transform"></div>
          <div className="relative">
            <div className="flex justify-between items-start mb-2">
              <span className="text-xs font-bold text-slate-500 uppercase">MTD Shortage</span>
              <div className="p-2 bg-amber-100 text-amber-600 rounded-lg">
                <Scale className="h-4 w-4" />
              </div>
            </div>
            <div className="text-2xl font-black font-mono text-slate-900">{mtdShortageVolume.toLocaleString()} <span className="text-base text-slate-500 font-sans">Liters</span></div>
            <div className="text-xs text-slate-500 mt-2 font-medium">Lost in transit/decanting</div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-rose-50 rounded-full group-hover:scale-110 transition-transform"></div>
          <div className="relative">
            <div className="flex justify-between items-start mb-2">
              <span className="text-xs font-bold text-slate-500 uppercase">Shortage Loss</span>
              <div className="p-2 bg-rose-100 text-rose-600 rounded-lg">
                <TrendingDown className="h-4 w-4" />
              </div>
            </div>
            <div className="text-2xl font-black font-mono text-rose-600">{settings.currency} {mtdShortageLoss.toLocaleString()}</div>
            <div className="text-xs text-slate-500 mt-2 font-medium">Financial impact of MTD losses</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {/* Disputed Deliveries */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              Disputed Deliveries
            </h3>
            <span className="text-xs font-bold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
              {disputedDeliveries.length} Pending
            </span>
          </div>
          <div className="divide-y divide-slate-100">
            {disputedDeliveries.map(del => {
              const schedule = schedules.find(s => s.id === del.scheduleId);
              return (
                <div key={del.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition">
                  <div>
                    <div className="font-bold text-slate-900 text-sm">PO: {schedule?.poNumber || 'Unknown'}</div>
                    <div className="text-xs text-slate-500 mt-0.5">Date: {new Date(del.actualDeliveryDate).toLocaleDateString()}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono text-sm font-black text-amber-600">Shortage: {del.shortageQuantity} L</div>
                    <div className="text-xs text-slate-500 mt-0.5 font-mono">Value: {settings.currency} {del.shortageAmount}</div>
                  </div>
                </div>
              );
            })}
            {disputedDeliveries.length === 0 && (
              <div className="p-8 text-center text-sm text-slate-500 flex flex-col items-center">
                <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center mb-3">
                  <Scale className="h-6 w-6 text-emerald-500" />
                </div>
                No disputed deliveries. All shortages are within acceptable limits.
              </div>
            )}
          </div>
        </div>

        {/* Supplier Performance */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
              <Truck className="h-4 w-4 text-indigo-500" />
              OMC Supplier Performance
            </h3>
          </div>
          <div className="p-4">
            <p className="text-sm text-slate-500 italic">
              Record more deliveries to generate OMC supplier performance reports. The system will track which suppliers have the highest delivery shortages over time.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
