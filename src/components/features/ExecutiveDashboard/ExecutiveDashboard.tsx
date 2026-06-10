import React, { useMemo } from 'react';
import { useStation } from '../../../contexts/StationContext';
import { generateKPIs } from '../../../services/analytics/kpiEngine';
import { generateHealthScore } from '../../../services/analytics/executiveInsights';
import { Activity, Briefcase, ChevronRight, PieChart, TrendingUp, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import RoleGuard from '../../ui/RoleGuard';
import { KPIDrillDownModal } from './KPIDrillDownModal';

export const ExecutiveDashboard: React.FC = () => {
  const { 
    shifts, 
    products, 
    customers, 
    tanks, 
    standaloneExpenses, 
    lubePosSales,
    nozzles,
    rateHistory,
    activeStationId
  } = useStation();

  const [activeDrillDown, setActiveDrillDown] = React.useState<'revenue' | 'profit' | 'expenses' | 'revaluation' | null>(null);

  const kpis = useMemo(() => 
    generateKPIs(shifts, products, customers, tanks, standaloneExpenses, lubePosSales, activeStationId, nozzles, rateHistory), 
    [shifts, products, customers, tanks, standaloneExpenses, lubePosSales, activeStationId, nozzles, rateHistory]
  );
  
  const health = useMemo(() => generateHealthScore(kpis), [kpis]);

  return (
    <RoleGuard allowedRoles={['Owner', 'Manager']} fallbackMessage="Executive Dashboard is strictly restricted.">
      <div className="space-y-6 animate-fade-in pb-12 max-w-7xl mx-auto">
        <div className="flex items-center justify-between gap-3 mb-8">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-lg">
              <Briefcase className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">Executive Dashboard</h1>
              <p className="text-sm font-semibold text-slate-500">Real-time Enterprise Intelligence Platform</p>
            </div>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Data Integrity Score</span>
            <div className="flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-full">
              {kpis.dataQuality.score >= 90 ? <CheckCircle className="h-4 w-4 text-emerald-500" /> : <AlertTriangle className="h-4 w-4 text-amber-500" />}
              <span className={`text-sm font-bold ${kpis.dataQuality.score >= 90 ? 'text-emerald-700' : 'text-amber-700'}`}>
                {kpis.dataQuality.score}/100
              </span>
            </div>
          </div>
        </div>

        {/* Business Health Score */}
        <div className="bg-gradient-to-br from-indigo-900 via-slate-900 to-slate-900 rounded-3xl p-8 text-white shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
            <PieChart className="h-64 w-64" />
          </div>
          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
            <div className="min-w-[250px]">
              <h2 className="text-lg font-bold text-slate-300 mb-2">Business Health Score</h2>
              <div className="flex items-baseline gap-4">
                <span className="text-6xl md:text-8xl font-black tracking-tighter">{health.score}</span>
                <span className="text-2xl font-bold text-slate-400">/ 100</span>
              </div>
              <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 backdrop-blur-md">
                <div className={`h-2.5 w-2.5 rounded-full ${
                  health.label === 'Excellent' || health.label === 'Good' ? 'bg-emerald-400' :
                  health.label === 'Fair' ? 'bg-amber-400' : 'bg-red-400'
                }`} />
                <span className="text-sm font-bold">{health.label} Status</span>
              </div>
            </div>

            <div className="flex-1 w-full bg-white/5 p-6 rounded-2xl backdrop-blur-sm border border-white/10">
              <h3 className="text-sm font-bold text-slate-300 mb-4">Health Factors</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
                {health.factors.map(f => (
                  <div key={f.name} className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-slate-300">{f.name}</span>
                      <span className="text-xs font-bold text-slate-400">{f.score}/100</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${f.status === 'Positive' ? 'bg-emerald-400' : f.status === 'Negative' ? 'bg-red-400' : 'bg-amber-400'}`} 
                        style={{ width: `${f.score}%` }} 
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Core KPI Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mt-8">
          
          {/* Revenue */}
          <div 
            className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 hover:shadow-md hover:border-blue-300 transition-all cursor-pointer group"
            onClick={() => setActiveDrillDown('revenue')}
          >
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center justify-between">
              Revenue Engine
              <ChevronRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity text-blue-500" />
            </h3>
            <div className="space-y-4">
              <div>
                <p className="text-xs text-slate-500 font-semibold mb-1">YTD Revenue</p>
                <p className="text-2xl font-black text-slate-900">Rs {kpis.revenue.ytd.toLocaleString(undefined, {maximumFractionDigits:0})}</p>
              </div>
              <div className="flex justify-between border-t border-slate-100 pt-3">
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase">MTD</p>
                  <p className="text-sm font-bold text-slate-700">{kpis.revenue.mtd.toLocaleString(undefined, {maximumFractionDigits:0})}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Today</p>
                  <p className="text-sm font-bold text-slate-700">{kpis.revenue.today.toLocaleString(undefined, {maximumFractionDigits:0})}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Operational Profit */}
          <div 
            className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 hover:shadow-md hover:border-emerald-300 transition-all cursor-pointer group"
            onClick={() => setActiveDrillDown('profit')}
          >
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center justify-between">
              Operational Profit
              <ChevronRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity text-emerald-500" />
            </h3>
            <div className="space-y-4">
              <div>
                <p className="text-xs text-slate-500 font-semibold mb-1">YTD Net Profit</p>
                <p className="text-2xl font-black text-emerald-600">Rs {kpis.profit.net.toLocaleString(undefined, {maximumFractionDigits:0})}</p>
              </div>
              <div className="flex justify-between border-t border-slate-100 pt-3">
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Gross Margin</p>
                  <p className="text-sm font-bold text-slate-700">{kpis.profit.marginPercent.toFixed(1)}%</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Gross (PKR)</p>
                  <p className="text-sm font-bold text-slate-700">{kpis.profit.gross.toLocaleString(undefined, {maximumFractionDigits:0})}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Inventory Revaluation */}
          <div 
            className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 hover:shadow-md hover:border-purple-300 transition-all cursor-pointer group"
            onClick={() => setActiveDrillDown('revaluation')}
          >
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center justify-between">
              Inventory Revaluation
              <ChevronRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity text-purple-500" />
            </h3>
            <div className="space-y-4">
              <div>
                <p className="text-xs text-slate-500 font-semibold mb-1">Net Lifetime Impact</p>
                <p className={`text-2xl font-black ${kpis.profit.inventoryRevaluation >= 0 ? 'text-purple-600' : 'text-red-600'}`}>
                  {kpis.profit.inventoryRevaluation >= 0 ? '+' : ''}Rs {kpis.profit.inventoryRevaluation.toLocaleString(undefined, {maximumFractionDigits:0})}
                </p>
              </div>
              <div className="flex justify-between border-t border-slate-100 pt-3">
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Profit Source</p>
                  <p className="text-sm font-bold text-slate-700">Stock Holding</p>
                </div>
              </div>
            </div>
          </div>

          {/* Expenses */}
          <div 
            className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 hover:shadow-md hover:border-amber-300 transition-all cursor-pointer group"
            onClick={() => setActiveDrillDown('expenses')}
          >
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center justify-between">
              Expense Engine
              <ChevronRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity text-amber-500" />
            </h3>
            <div className="space-y-4">
              <div>
                <p className="text-xs text-slate-500 font-semibold mb-1">Total Expenses YTD</p>
                <p className="text-2xl font-black text-amber-600">Rs {kpis.expenses.total.toLocaleString(undefined, {maximumFractionDigits:0})}</p>
              </div>
              <div className="flex justify-between border-t border-slate-100 pt-3">
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Expense Per Liter</p>
                  <p className="text-sm font-bold text-slate-700">{kpis.expenses.perLiter.toFixed(2)} Rs/L</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Net / L</p>
                  <p className="text-sm font-bold text-slate-700">{(kpis.profit.avgPerLiter - kpis.expenses.perLiter).toFixed(2)} Rs/L</p>
                </div>
              </div>
            </div>
          </div>

          {/* Cash Position */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Cash Position</h3>
            <div className="space-y-4">
              <div>
                <p className="text-xs text-slate-500 font-semibold mb-1">Net Flow</p>
                <p className={`text-2xl font-black ${kpis.cash.position >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                  Rs {kpis.cash.position.toLocaleString(undefined, {maximumFractionDigits:0})}
                </p>
              </div>
              <div className="flex justify-between border-t border-slate-100 pt-3">
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Credit Outstanding</p>
                  <p className="text-sm font-bold text-slate-700">{kpis.credit.outstanding.toLocaleString(undefined, {maximumFractionDigits:0})}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Collection Eff.</p>
                  <p className="text-sm font-bold text-slate-700">{kpis.credit.collectionEfficiency.toFixed(1)}%</p>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Secondary Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          
          {/* Inventory Insights */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 flex items-center justify-between">
            <div>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Inventory Value</h3>
              <p className="text-3xl font-black text-slate-900">Rs {kpis.inventory.value.toLocaleString(undefined, {maximumFractionDigits:0})}</p>
              <div className="flex gap-4 mt-2">
                <p className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded">Potential: {kpis.inventory.potentialRevenue.toLocaleString(undefined, {maximumFractionDigits:0})}</p>
                <p className="text-xs font-bold text-slate-500 bg-slate-50 px-2 py-1 rounded">Coverage: {kpis.inventory.stockCoverageDays} Days</p>
              </div>
            </div>
            <div className="h-16 w-16 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center">
              <TrendingUp className="h-8 w-8" />
            </div>
          </div>

          {/* Credit Risk */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 flex items-center justify-between">
            <div>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Credit Risk Engine</h3>
              <p className={`text-3xl font-black ${
                kpis.credit.riskLabel === 'Low' ? 'text-emerald-500' :
                kpis.credit.riskLabel === 'Medium' ? 'text-amber-500' :
                'text-red-500'
              }`}>{kpis.credit.riskLabel} Risk</p>
              <p className="text-xs font-bold text-slate-500 mt-2">{kpis.credit.overdueCustomers} Accounts Near Limit</p>
            </div>
            <div className={`h-16 w-16 rounded-full flex items-center justify-center ${
              kpis.credit.riskLabel === 'Low' ? 'bg-emerald-50 text-emerald-500' :
              kpis.credit.riskLabel === 'Medium' ? 'bg-amber-50 text-amber-500' :
              'bg-red-50 text-red-500'
            }`}>
              {kpis.credit.riskLabel === 'Low' ? <CheckCircle className="h-8 w-8" /> : <AlertTriangle className="h-8 w-8" />}
            </div>
          </div>

          {/* Salary Analytics */}
          <div 
            className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 hover:shadow-md hover:border-purple-300 transition-all cursor-pointer group"
            onClick={() => setActiveDrillDown('expenses')}
          >
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center justify-between">
              Salary Analytics
              <ChevronRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity text-purple-500" />
            </h3>
            <div className="space-y-2">
              <p className="text-3xl font-black text-purple-600">Rs {kpis.expenses.salary.total.toLocaleString(undefined, {maximumFractionDigits:0})}</p>
              <div className="flex justify-between items-center text-xs mt-2">
                <span className="text-slate-500 font-bold">Monthly Avg:</span>
                <span className="text-slate-700 font-black">Rs {kpis.expenses.salary.monthlyAvg.toLocaleString(undefined, {maximumFractionDigits:0})}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500 font-bold">% of Total Exp:</span>
                <span className="text-slate-700 font-black">{kpis.expenses.salary.percentageOfExpenses.toFixed(1)}%</span>
              </div>
            </div>
          </div>

        </div>

      </div>

      <KPIDrillDownModal
        isOpen={activeDrillDown !== null}
        onClose={() => setActiveDrillDown(null)}
        kpis={kpis}
        metric={activeDrillDown}
      />
    </RoleGuard>
  );
};

export default ExecutiveDashboard;
