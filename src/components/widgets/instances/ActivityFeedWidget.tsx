import React, { useMemo } from 'react';
import { Activity, Power, Droplets } from 'lucide-react';
import { useStation } from '../../../contexts/StationContext';
import { formatCurrency } from '../../../lib/currency';

export function ActivityFeedWidget() {
  const { shifts, stockTxns, products, settings } = useStation();

  const feed = useMemo(() => {
    return [
      ...shifts.slice(0, 5).map(s => ({
        id: s.id, 
        type: 'shift', 
        title: `Shift ${s.status}`, 
        desc: s.cashierName || 'System', 
        amount: formatCurrency(s.totalSales || 0, settings),
        time: s.time || '12:00 PM', 
        timestamp: new Date(`${s.date} ${s.time || '12:00 PM'}`).getTime(), 
        color: s.status === ('active' as any) || s.status === ('closed' as any) ? 'text-emerald-500' : 'text-slate-400',
      })),
      ...stockTxns.slice(0, 5).map(tx => ({
        id: tx.id, 
        type: 'stock', 
        title: tx.type === 'receipt' ? 'Tank Refilled' : 'Inventory Adj', 
        desc: products.find(p => p.id === tx.itemId)?.name || 'Product', 
        amount: `${tx.quantity}L`,
        time: '10:00 AM', 
        timestamp: new Date(`${tx.date} 10:00 AM`).getTime(), 
        icon: Droplets, 
        color: 'text-blue-500', 
        bg: 'bg-white/5'
      }))
    ].sort((a,b) => b.timestamp - a.timestamp).slice(0, 8);
  }, [shifts, stockTxns, products, settings]);

  return (
    <div className="w-full h-full bg-[#0F172A]/80 backdrop-blur-md rounded-2xl border border-white/5 shadow-xl flex flex-col p-6 overflow-hidden">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
          <Activity className="w-4 h-4 text-orange-500" /> Activity Feed
        </h2>
      </div>
      
      <div className="flex-1 overflow-y-auto pr-2 space-y-4 custom-scrollbar">
        {shifts.slice(0, 5).map(s => {
          const shift = s as any;
          return (
            <div key={shift.id} className="relative flex gap-4 pb-4">
              <div className="absolute left-2.5 top-8 bottom-0 w-px bg-white/5"></div>
              <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 border border-white/10 ${shift.status === 'active' ? 'bg-orange-500/20 text-orange-400' : 'bg-[#0f172a] text-slate-400'}`}>
                <Power className="w-3 h-3" />
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-start mb-1">
                  <span className="text-xs font-black text-white">Shift {shift.status === 'active' ? 'Started' : 'Closed'}</span>
                  <span className="text-[9px] font-bold text-slate-500">{shift.time || '12:00 PM'}</span>
                </div>
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{shift.cashierName || 'System'}</div>
                {shift.status === 'closed' && (
                  <div className="text-xs font-bold text-emerald-400 mt-1">Rs {(shift.totalSales || 0).toLocaleString()}</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
