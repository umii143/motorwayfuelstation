import React from 'react';
import { 
  CircleDollarSign, 
  TrendingUp, 
  Activity, 
  Target, 
  Wallet, 
  Database 
} from 'lucide-react';
import { t } from '../../../../lib/translations';

interface BIMasterKPIsProps {
  metrics: any; // Type it with the biAggregator output later
  settings: any;
}

export function BIMasterKPIs({ metrics, settings }: BIMasterKPIsProps) {
  const { kpi, stock } = metrics;
  
  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('en-PK', { style: 'currency', currency: 'PKR', minimumFractionDigits: 0 }).format(val);

  return (
    <div className="grid grid-cols-2 md:grid-cols-1 lg:grid-cols-3 xl:grid-cols-6 gap-3 mb-6">
      
      {/* 1. Total Invested */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex flex-col justify-between">
        <div className="flex justify-between items-start mb-2">
          <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
            <Database className="w-5 h-5" />
          </div>
        </div>
        <div>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Total Invested</p>
          <h3 className="text-xl font-black text-slate-800 mt-1">{formatCurrency(kpi.totalInvested)}</h3>
          <p className="text-xs text-slate-400 mt-1">Purchases + Costs</p>
        </div>
      </div>

      {/* 2. Total Revenue */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex flex-col justify-between">
        <div className="flex justify-between items-start mb-2">
          <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>
        <div>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Total Revenue</p>
          <h3 className="text-xl font-black text-slate-800 mt-1">{formatCurrency(kpi.totalRevenue)}</h3>
          <p className="text-xs text-slate-400 mt-1">All Sales Streams</p>
        </div>
      </div>

      {/* 3. Net Profit */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex flex-col justify-between">
        <div className="flex justify-between items-start mb-2">
          <div className={`p-2 rounded-lg ${kpi.netProfit >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
            <Activity className="w-5 h-5" />
          </div>
          <span className={`text-xs font-bold px-2 py-1 rounded-full ${kpi.netProfit >= 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
            {kpi.netProfit >= 0 ? 'PROFIT' : 'LOSS'}
          </span>
        </div>
        <div>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Net Profit</p>
          <h3 className="text-xl font-black text-slate-800 mt-1">{formatCurrency(kpi.netProfit)}</h3>
          <p className="text-xs text-slate-400 mt-1">Revenue - COGS - Expenses</p>
        </div>
      </div>

      {/* 4. ROI */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex flex-col justify-between">
        <div className="flex justify-between items-start mb-2">
          <div className="p-2 bg-purple-50 rounded-lg text-purple-600">
            <Target className="w-5 h-5" />
          </div>
          <span className={`text-xs font-bold px-2 py-1 rounded-full ${kpi.roi >= 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
            {kpi.roi.toFixed(1)}%
          </span>
        </div>
        <div>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Return on Invest.</p>
          <h3 className="text-xl font-black text-slate-800 mt-1">{kpi.roi.toFixed(2)}%</h3>
          <p className="text-xs text-slate-400 mt-1">Profit / Invested</p>
        </div>
      </div>

      {/* 5. Working Capital (simplified proxy for now) */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex flex-col justify-between">
        <div className="flex justify-between items-start mb-2">
          <div className="p-2 bg-amber-50 rounded-lg text-amber-600">
            <Wallet className="w-5 h-5" />
          </div>
        </div>
        <div>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Working Capital</p>
          <h3 className="text-xl font-black text-slate-800 mt-1">{formatCurrency(stock.valueSell)}</h3>
          <p className="text-xs text-slate-400 mt-1">Total Stock Selling Value</p>
        </div>
      </div>

      {/* 6. Stock Valuation */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex flex-col justify-between">
        <div className="flex justify-between items-start mb-2">
          <div className="p-2 bg-slate-100 rounded-lg text-slate-600">
            <CircleDollarSign className="w-5 h-5" />
          </div>
          <span className="text-xs font-bold px-2 py-1 rounded-full bg-emerald-100 text-emerald-700">
            +{formatCurrency(stock.unrealizedProfit)}
          </span>
        </div>
        <div>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Unrealized Stock Profit</p>
          <h3 className="text-xl font-black text-slate-800 mt-1">{formatCurrency(stock.valueCost)}</h3>
          <p className="text-xs text-slate-400 mt-1">Current Stock Cost</p>
        </div>
      </div>

    </div>
  );
}
