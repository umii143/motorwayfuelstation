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
        icon: Power, 
        color: s.status === 'Open' || s.status === 'active' ? 'text-emerald-500' : 'text-slate-400', 
        bg: 'bg-white/5'
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
        {feed.length > 0 ? feed.map((item, idx) => (
          <div key={`${item.id}-${idx}`} className="flex gap-3 relative">
            {idx !== feed.length - 1 && (
              <div className="absolute top-8 left-4 bottom-[-16px] w-px bg-white/10 -translate-x-1/2"></div>
            )}
            <div className={`w-8 h-8 rounded-full ${item.bg} border border-white/10 flex items-center justify-center shrink-0 z-10 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]`}>
              <item.icon className={`w-3.5 h-3.5 ${item.color}`} />
            </div>
            <div className="pt-1.5 flex-1 pb-2">
              <div className="flex justify-between items-start">
                <span className="text-xs font-black text-white">{item.title}</span>
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">{item.time}</span>
              </div>
              <div className="text-[10px] font-bold text-slate-400 mt-0.5">{item.desc} • {item.amount}</div>
            </div>
          </div>
        )) : (
          <div className="text-center py-6 text-[10px] font-black uppercase tracking-widest text-slate-500">
            No activity recorded.
          </div>
        )}
      </div>
    </div>
  );
}
