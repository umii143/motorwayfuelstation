import React from 'react';
import { InventoryHubProps } from '../../InventoryHub';
import { StockFlowVisualizer } from './StockFlowVisualizer';
import { Activity, Droplet, Fuel, AlertTriangle, ArrowRight, HeartPulse, BrainCircuit, History, ArrowDownToLine } from 'lucide-react';

export const InventoryDashboardTab: React.FC<InventoryHubProps> = (props) => {
  const isEn = props.settings.language === 'en';

  // Calculate simple mock KPIs based on props
  const totalTanks = props.tanks.length;
  const criticalTanks = props.tanks.filter(t => {
    // For demo: pretend tanks with capacity < some amount are critical or just random
    return false; // Real logic goes here
  }).length;

  return (
    <div className="space-y-6">
      
      {/* Overview KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        
        <div className="bg-card border border-emerald-500/30 p-5 rounded-2xl shadow-sm flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 w-16 h-16 bg-emerald-500/10 rounded-full group-hover:scale-150 transition-transform duration-500 pointer-events-none"></div>
          <div className="flex items-center justify-between mb-2 z-10">
            <h3 className="text-xs font-black text-emerald-600 uppercase tracking-widest">{isEn ? 'Health Score' : 'ہیلتھ اسکور'}</h3>
            <HeartPulse className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="z-10 flex items-center gap-2">
            <p className="text-2xl font-black text-emerald-600">94%</p>
            <span className="text-[10px] font-bold text-emerald-500/80 leading-tight">System<br/>Healthy</span>
          </div>
        </div>

        <div className="bg-card border border-border p-5 rounded-2xl shadow-sm flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 w-16 h-16 bg-primary/10 rounded-full group-hover:scale-150 transition-transform duration-500 pointer-events-none"></div>
          <div className="flex items-center justify-between mb-2 z-10">
            <h3 className="text-xs font-black text-muted-foreground uppercase tracking-widest">{isEn ? 'Total Fuel Value' : 'کل فیول مالیت'}</h3>
            <Activity className="w-4 h-4 text-primary" />
          </div>
          <p className="text-2xl font-black text-foreground z-10">
            <span className="text-sm font-bold text-muted-foreground mr-1">₨</span>
            14.2M
          </p>
        </div>

        <div className="bg-card border border-border p-5 rounded-2xl shadow-sm flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 w-16 h-16 bg-emerald-500/10 rounded-full group-hover:scale-150 transition-transform duration-500 pointer-events-none"></div>
          <div className="flex items-center justify-between mb-2 z-10">
            <h3 className="text-xs font-black text-muted-foreground uppercase tracking-widest">{isEn ? 'Total Volume' : 'کل حجم'}</h3>
            <Droplet className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-black text-foreground z-10">
            48,250 <span className="text-sm font-bold text-muted-foreground">L</span>
          </p>
        </div>

        <div className="bg-card border border-border p-5 rounded-2xl shadow-sm flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 w-16 h-16 bg-sky-500/10 rounded-full group-hover:scale-150 transition-transform duration-500 pointer-events-none"></div>
          <div className="flex items-center justify-between mb-2 z-10">
            <h3 className="text-xs font-black text-muted-foreground uppercase tracking-widest">{isEn ? 'Active Tanks' : 'ایکٹو ٹینکس'}</h3>
            <Fuel className="w-4 h-4 text-sky-500" />
          </div>
          <p className="text-2xl font-black text-foreground z-10">
            {totalTanks}
          </p>
        </div>

        <div className="bg-card border border-rose-500/30 p-5 rounded-2xl shadow-sm flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 w-16 h-16 bg-rose-500/10 rounded-full group-hover:scale-150 transition-transform duration-500 pointer-events-none"></div>
          <div className="flex items-center justify-between mb-2 z-10">
            <h3 className="text-xs font-black text-rose-500 uppercase tracking-widest">{isEn ? 'Alerts' : 'الرٹس'}</h3>
            <AlertTriangle className="w-4 h-4 text-rose-500" />
          </div>
          <div className="z-10 flex items-center gap-2">
            <p className="text-2xl font-black text-rose-600">{criticalTanks}</p>
            <span className="text-[10px] font-bold text-rose-500/80 leading-tight">Critical<br/>Levels</span>
          </div>
        </div>

      </div>

      {/* Middle Section: Flow & AI Advisor */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
           <StockFlowVisualizer isEn={isEn} />
        </div>
        
        <div className="bg-card border border-border p-5 rounded-2xl shadow-sm flex flex-col">
          <h3 className="text-sm font-black text-foreground mb-4 uppercase tracking-widest flex items-center gap-2">
            <BrainCircuit className="w-4 h-4 text-primary" />
            {isEn ? 'AI Advisor' : 'اے آئی ایڈوائزر'}
          </h3>
          
          <div className="space-y-3 flex-1 overflow-y-auto pr-2">
            
            <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl relative overflow-hidden">
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-rose-500"></div>
              <div className="flex items-start gap-2">
                <span className="text-[10px] font-black text-white bg-rose-500 px-1.5 py-0.5 rounded">CRITICAL</span>
                <div>
                  <h4 className="text-xs font-black text-rose-700 dark:text-rose-400">Tank 2 (HOBC) Depletion</h4>
                  <p className="text-[10px] font-bold text-muted-foreground mt-1">Stock out in 2 days at current velocity.</p>
                  <button className="mt-2 text-[10px] font-black text-rose-600 hover:underline">Draft PO (15,000L)</button>
                </div>
              </div>
            </div>

            <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl relative overflow-hidden">
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-amber-500"></div>
              <div className="flex items-start gap-2">
                <span className="text-[10px] font-black text-amber-800 bg-amber-400 px-1.5 py-0.5 rounded">WARNING</span>
                <div>
                  <h4 className="text-xs font-black text-amber-700 dark:text-amber-500">Variance Increasing</h4>
                  <p className="text-[10px] font-bold text-muted-foreground mt-1">Variance increased to 0.32% in Tank 1. Recommend immediate manual dip.</p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Quick Access or Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-card border border-border p-5 rounded-2xl shadow-sm">
          <h3 className="text-sm font-black text-foreground mb-4 uppercase tracking-widest flex items-center gap-2">
            <History className="w-4 h-4 text-primary" />
            {isEn ? 'Enterprise Timeline' : 'انٹرپرائز ٹائم لائن'}
          </h3>
          
          <div className="relative pl-4 space-y-6 before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-border before:to-transparent">
             
             <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
               <div className="flex items-center justify-center w-6 h-6 rounded-full border border-white bg-emerald-500 text-white shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2">
                 <ArrowDownToLine className="w-3 h-3" />
               </div>
               <div className="w-[calc(100%-3rem)] md:w-[calc(50%-2rem)] p-3 rounded-xl border border-border bg-card shadow-sm">
                 <div className="flex items-center justify-between space-x-2 mb-1">
                   <div className="font-black text-foreground text-xs">Bowser Received</div>
                   <time className="font-bold text-muted-foreground text-[10px]">09:10 AM</time>
                 </div>
                 <div className="text-[10px] font-bold text-muted-foreground">15,000 L GRN logged by user.</div>
               </div>
             </div>

             <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
               <div className="flex items-center justify-center w-6 h-6 rounded-full border border-white bg-primary text-white shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2">
                 <Droplet className="w-3 h-3" />
               </div>
               <div className="w-[calc(100%-3rem)] md:w-[calc(50%-2rem)] p-3 rounded-xl border border-border bg-card shadow-sm">
                 <div className="flex items-center justify-between space-x-2 mb-1">
                   <div className="font-black text-foreground text-xs">Tank Filled</div>
                   <time className="font-bold text-muted-foreground text-[10px]">09:18 AM</time>
                 </div>
                 <div className="text-[10px] font-bold text-muted-foreground">Tank 1 level updated.</div>
               </div>
             </div>

             <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
               <div className="flex items-center justify-center w-6 h-6 rounded-full border border-white bg-amber-500 text-white shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2">
                 <Activity className="w-3 h-3" />
               </div>
               <div className="w-[calc(100%-3rem)] md:w-[calc(50%-2rem)] p-3 rounded-xl border border-amber-500/30 bg-amber-500/5 shadow-sm">
                 <div className="flex items-center justify-between space-x-2 mb-1">
                   <div className="font-black text-amber-700 text-xs">Variance Found</div>
                   <time className="font-bold text-amber-700/70 text-[10px]">11:00 AM</time>
                 </div>
                 <div className="text-[10px] font-bold text-amber-700/70">Manual Dip revealed -45L variance.</div>
               </div>
             </div>

          </div>
        </div>
        
        <div className="bg-card border border-border p-5 rounded-2xl shadow-sm">
           <h3 className="text-sm font-black text-foreground mb-4 uppercase tracking-widest flex items-center gap-2">
             <Activity className="w-4 h-4 text-amber-500" />
             {isEn ? 'Evaporation & Variance' : 'کمی اور فرق'}
           </h3>
           <div className="flex flex-col items-center justify-center h-32">
             <p className="text-3xl font-black text-foreground">0.12%</p>
             <p className="text-xs font-bold text-muted-foreground mt-1 text-center">
               {isEn ? 'Average monthly variance (Book vs Physical). Well within OGRA allowance.' : 'اوسط ماہانہ فرق۔ اوگرا کی حد کے اندر ہے۔'}
             </p>
           </div>
        </div>
      </div>

    </div>
  );
};
