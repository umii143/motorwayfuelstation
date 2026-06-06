import React, { useState, useEffect } from 'react';
import { Clock, Gauge, Droplets, ArrowUpCircle } from 'lucide-react';
import { Tank, GlobalSettings, Product } from '../../types';
import { db } from '../../data/db';

export function DashboardRealtimeGauges({ settings, products = [], activeStationId }: { settings: GlobalSettings; products?: Product[]; activeStationId: string }) {
  const [time, setTime] = useState(new Date());
  const [tanks, setTanks] = useState<Tank[]>([]);

  useEffect(() => {
    setTanks(db.getTanks(activeStationId));
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, [activeStationId]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
      <div className="bg-slate-900 rounded-2xl p-6 shadow-xl border border-slate-800 text-center flex flex-col justify-center items-center">
        <Clock className="h-10 w-10 text-orange-500 mb-3" />
        <h3 className="font-mono text-3xl font-black text-white tracking-widest">{time.toLocaleTimeString()}</h3>
        <p className="text-slate-400 font-sans text-xs mt-1 font-bold uppercase tracking-widest">Local Station Time</p>
      </div>

      {tanks.slice(0, 3).map(tank => {
        // Sync with real product stock if available
        const relatedProduct = products.find(p => p.id === tank.productId);
        const actualStock = relatedProduct ? relatedProduct.currentStock : tank.currentStock;
        const capacity = relatedProduct?.capacity || tank.capacity;
        
        const fillPercentage = capacity > 0 ? (actualStock / capacity) * 100 : 0;
        const isLow = actualStock <= tank.criticalLevel;
        
        return (
          <div key={tank.id} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 relative overflow-hidden group">
            <div className="absolute inset-x-0 bottom-0 bg-slate-100 h-2">
              <div 
                className={`h-full transition-all duration-1000 ease-in-out ${isLow ? 'bg-rose-500' : 'bg-emerald-500'}`}
                style={{ width: `${Math.min(100, Math.max(0, fillPercentage))}%` }}
              />
            </div>
            <div className="flex justify-between items-start mb-4">
              <div>
                <h4 className="font-sans font-black text-slate-800 text-lg">{tank.name}</h4>
                <p className="font-sans text-xs font-bold text-slate-400 uppercase tracking-widest">Live Level</p>
              </div>
              <div className={`p-2 rounded-xl ${isLow ? 'bg-rose-100 text-rose-600' : 'bg-emerald-100 text-emerald-600'}`}>
                {isLow ? <AlertTriangle className="h-5 w-5" /> : <Droplets className="h-5 w-5" />}
              </div>
            </div>
            
            <div className="flex items-end gap-2">
              <span className={`font-mono text-3xl font-black tracking-tight ${isLow ? 'text-rose-600' : 'text-emerald-600'}`}>
                {Math.round(actualStock).toLocaleString()}
              </span>
              <span className="font-sans text-sm font-bold text-slate-400 mb-1">/ {capacity.toLocaleString()} L</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Stub AlertTriangle for quick inline use
function AlertTriangle(props: any) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
      <line x1="12" y1="9" x2="12" y2="13"/>
      <line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
  );
}
