import React from 'react';
import { ShieldAlert, Droplets, Receipt, Activity } from 'lucide-react';
import { useInventoryStore } from '../../../../stores/useInventoryStore';
import { useCustomerStore } from '../../../../stores/useCustomerStore';

export function BISmartMetrics({ metrics }: any) {
  const { smartMetrics } = metrics;
  const { products = [] } = useInventoryStore();
  const { customers = [] } = useCustomerStore();

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('en-PK', { style: 'currency', currency: 'PKR', minimumFractionDigits: 0 }).format(val);

  // Calculate Credit Exposure
  const totalCreditExposure = customers.reduce((acc, c) => acc + (c.currentBalance || 0), 0);
  
  // Calculate Avg Stock Turnover (Simplified)
  // For actual turnover we'd need average inventory / COGS
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
      
      {/* Cash Leakage (Test Liters) */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
        <div className="p-4 border-b border-slate-100 bg-rose-50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Droplets className="w-5 h-5 text-rose-600" />
            <h3 className="font-sans font-bold text-slate-900 text-sm">Leakage & Test Liters</h3>
          </div>
        </div>
        <div className="p-5 flex flex-col justify-center flex-1">
          <div className="flex justify-between items-center mb-4">
            <span className="text-sm font-medium text-slate-500">Total Test Liters</span>
            <span className="font-black text-xl text-slate-800">{smartMetrics.totalTestLiters} L</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-1.5 mb-2">
            <div className="bg-rose-500 h-1.5 rounded-full" style={{ width: '45%' }}></div>
          </div>
          <p className="text-xs text-slate-500">Check calibration frequency. High test liters impact profitability directly.</p>
        </div>
      </div>

      {/* Credit Exposure */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
        <div className="p-4 border-b border-slate-100 bg-amber-50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Receipt className="w-5 h-5 text-amber-600" />
            <h3 className="font-sans font-bold text-slate-900 text-sm">Credit Exposure</h3>
          </div>
        </div>
        <div className="p-5 flex flex-col justify-center flex-1">
          <div className="flex justify-between items-center mb-4">
            <span className="text-sm font-medium text-slate-500">Unrecovered Credit</span>
            <span className="font-black text-xl text-slate-800">{formatCurrency(totalCreditExposure)}</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-1.5 mb-2">
            <div className="bg-amber-500 h-1.5 rounded-full" style={{ width: '60%' }}></div>
          </div>
          <p className="text-xs text-slate-500">Ensure prompt recovery to prevent working capital strangulation.</p>
        </div>
      </div>

      {/* Stock Intelligence */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
        <div className="p-4 border-b border-slate-100 bg-indigo-50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-indigo-600" />
            <h3 className="font-sans font-bold text-slate-900 text-sm">Stock Intelligence</h3>
          </div>
        </div>
        <div className="p-5 flex flex-col justify-center flex-1">
          <div className="space-y-3">
            {products.slice(0,2).map(p => {
              const cap = p.capacity || 1;
              const fillPct = (p.currentStock / cap) * 100;
              return (
                <div key={p.id}>
                  <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
                    <span>{p.name} Stock Level</span>
                    <span>{fillPct.toFixed(0)}%</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-1.5">
                    <div className={`h-1.5 rounded-full ${fillPct < 20 ? 'bg-rose-500' : 'bg-indigo-500'}`} style={{ width: `${Math.min(fillPct, 100)}%` }}></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

    </div>
  );
}
