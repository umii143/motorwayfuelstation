import React from 'react';
import { ArrowRight, Truck, Database, Fuel } from 'lucide-react';

export const StockFlowVisualizer: React.FC<{ isEn: boolean }> = ({ isEn }) => {
  return (
    <div className="bg-card p-6 rounded-2xl border border-border shadow-sm">
      <h3 className="text-sm font-black text-foreground mb-6 uppercase tracking-widest flex items-center gap-2">
        <ArrowRight className="w-4 h-4 text-primary" />
        {isEn ? 'Live Stock Flow' : 'لائیو اسٹاک فلو'}
      </h3>
      
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 w-full">
        
        {/* Bowser Source */}
        <div className="flex-1 flex flex-col items-center p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl relative group cursor-help">
          <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-popover text-popover-foreground text-xs p-2 rounded-xl border border-border shadow-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
            <p className="font-black">Bowser Delivery</p>
            <p className="text-[10px]">15,000 L • Pending QC</p>
          </div>
          <div className="w-12 h-12 bg-emerald-500 text-white rounded-full flex items-center justify-center mb-3 shadow-lg shadow-emerald-500/20">
            <Truck className="w-6 h-6" />
          </div>
          <p className="text-xs font-black text-emerald-700 dark:text-emerald-500 uppercase">{isEn ? 'Inflow (GRN)' : 'وصولی (GRN)'}</p>
          <p className="text-xl font-black text-foreground mt-1">15,000 <span className="text-[10px] text-muted-foreground">L</span></p>
          <p className="text-[10px] font-bold text-muted-foreground mt-1">Today</p>
        </div>

        {/* Animated Flow Connector */}
        <div className="hidden md:flex flex-col items-center justify-center relative w-16 h-10 group cursor-help">
          <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-popover text-popover-foreground text-[10px] font-bold px-2 py-1 rounded-lg border border-border shadow-sm opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
            Active Transfer
          </div>
          <div className="absolute inset-0 flex items-center overflow-hidden">
             <div className="w-full h-1 bg-muted rounded-full relative">
               <div className="absolute top-0 bottom-0 left-0 w-1/2 bg-emerald-500 rounded-full animate-[flow_2s_linear_infinite]"></div>
             </div>
          </div>
        </div>

        {/* Tank Farm (Center) */}
        <div className="flex-1 flex flex-col items-center p-4 bg-primary/10 border border-primary/20 rounded-2xl relative overflow-hidden group cursor-help">
          <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-popover text-popover-foreground text-xs p-2 rounded-xl border border-border shadow-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
            <p className="font-black">Live Capacity</p>
            <p className="text-[10px]">Total Vol: 48,250 L (65% Full)</p>
          </div>
          <div className="absolute inset-0 bg-primary/5 group-hover:bg-primary/10 transition-colors"></div>
          <div className="w-12 h-12 bg-primary text-white rounded-full flex items-center justify-center mb-3 shadow-lg shadow-primary/20 z-10">
            <Database className="w-6 h-6" />
          </div>
          <p className="text-xs font-black text-primary uppercase z-10">{isEn ? 'Available Stock' : 'دستیاب اسٹاک'}</p>
          <p className="text-xl font-black text-foreground mt-1 z-10">48,250 <span className="text-[10px] text-muted-foreground">L</span></p>
          <p className="text-[10px] font-bold text-muted-foreground mt-1 z-10">4 Active Tanks</p>
        </div>

        {/* Animated Flow Connector */}
        <div className="hidden md:flex flex-col items-center justify-center relative w-16 h-10 group cursor-help">
          <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-popover text-popover-foreground text-[10px] font-bold px-2 py-1 rounded-lg border border-border shadow-sm opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
            Sales Velocity: 120 L/hr
          </div>
          <div className="absolute inset-0 flex items-center overflow-hidden">
             <div className="w-full h-1 bg-muted rounded-full relative">
               <div className="absolute top-0 bottom-0 left-0 w-1/2 bg-rose-500 rounded-full animate-[flow_1.5s_linear_infinite]"></div>
             </div>
          </div>
        </div>

        {/* Sales Outflow */}
        <div className="flex-1 flex flex-col items-center p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl relative group cursor-help">
          <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-popover text-popover-foreground text-xs p-2 rounded-xl border border-border shadow-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
            <p className="font-black">Sales Outflow</p>
            <p className="text-[10px]">Value: ₨ 1,450,000</p>
          </div>
          <div className="w-12 h-12 bg-rose-500 text-white rounded-full flex items-center justify-center mb-3 shadow-lg shadow-rose-500/20">
            <Fuel className="w-6 h-6" />
          </div>
          <p className="text-xs font-black text-rose-700 dark:text-rose-500 uppercase">{isEn ? 'Outflow (Sales)' : 'فروخت (سیلز)'}</p>
          <p className="text-xl font-black text-foreground mt-1">5,200 <span className="text-[10px] text-muted-foreground">L</span></p>
          <p className="text-[10px] font-bold text-muted-foreground mt-1">Since 06:00 AM</p>
        </div>

      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes flow {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
      `}} />
    </div>
  );
};
