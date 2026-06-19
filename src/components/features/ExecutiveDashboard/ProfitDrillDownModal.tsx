import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  TrendingUp, 
  TrendingDown, 
  Activity,
  AlertTriangle,
  PieChart as PieChartIcon,
  BarChart2,
  DollarSign,
  Info
} from 'lucide-react';
import { formatCurrency } from '../../../lib/currency';
import { GlobalSettings } from '../../../types';
import { KPIResult } from '../../../services/analytics/kpiEngine';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  CartesianGrid, 
  Cell,
  PieChart,
  Pie,
  Legend,
  LineChart,
  Line
} from 'recharts';

interface ProfitDrillDownModalProps {
  isOpen: boolean;
  onClose: () => void;
  kpis: KPIResult;
  settings: GlobalSettings;
}

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899', '#64748b'];

export default function ProfitDrillDownModal({
  isOpen,
  onClose,
  kpis,
  settings
}: ProfitDrillDownModalProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'products' | 'trends'>('overview');

  const breakdowns = kpis.breakdowns;

  // Process Data
  const productProfitData = useMemo(() => {
    return Object.entries(breakdowns.grossProfitByProduct)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [breakdowns]);

  const categoryProfitData = useMemo(() => {
    return Object.entries(breakdowns.grossProfitByCategory)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [breakdowns]);

  const totalGrossProfit = productProfitData.reduce((sum, item) => sum + item.value, 0);
  const totalNetProfit = kpis.profit.net;
  const totalExpenses = kpis.expenses.total;
  
  const profitMarginPercent = totalGrossProfit > 0 ? (totalNetProfit / kpis.revenue.ytd) * 100 : 0;

  // AI Insights Generator
  const generateInsights = () => {
    const insights = [];

    insights.push(`Your overall Net Profit is ${formatCurrency(totalNetProfit, settings)}, with a net margin of ${profitMarginPercent.toFixed(2)}% on total revenue.`);
    
    if (productProfitData.length > 0) {
      const topProduct = productProfitData[0];
      const percentage = ((topProduct.value / totalGrossProfit) * 100).toFixed(1);
      insights.push(`"${topProduct.name}" is your primary profit driver, contributing ${percentage}% (${formatCurrency(topProduct.value, settings)}) to your total gross profit.`);
    }

    if (totalExpenses > totalGrossProfit) {
      insights.push(`Critical Alert: Operational expenses (${formatCurrency(totalExpenses, settings)}) exceed gross profit (${formatCurrency(totalGrossProfit, settings)}). You are operating at a net loss.`);
    } else {
      const expenseRatio = ((totalExpenses / totalGrossProfit) * 100).toFixed(1);
      insights.push(`Operational expenses consume ${expenseRatio}% of your gross profit. ` + 
        (Number(expenseRatio) > 70 ? `This is unusually high. Review the Expense Engine immediately.` : `This is a healthy ratio.`));
    }

    if (kpis.profit.avgPerLiter > 0 && kpis.expenses.perLiter > 0) {
      const netPerLiter = kpis.profit.avgPerLiter - kpis.expenses.perLiter;
      insights.push(`Average dealer margin is ${formatCurrency(kpis.profit.avgPerLiter, settings)}/L, minus ${formatCurrency(kpis.expenses.perLiter, settings)}/L expenses = ${formatCurrency(netPerLiter, settings)}/L net profit.`);
    }

    return insights;
  };

  const insights = generateInsights();

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
        />

        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-6xl max-h-[90vh] bg-slate-50 rounded-2xl shadow-2xl overflow-hidden flex flex-col"
        >
          {/* HEADER */}
          <div className="flex-none bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between z-10">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                <DollarSign className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-xl font-black text-slate-900 tracking-tight">Enterprise Profit Intelligence</h2>
                <p className="text-sm font-medium text-slate-500">Gross Margins, Net Income & Operational Efficiency</p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="h-10 w-10 flex items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-700 transition-colors cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* MAIN SCROLLABLE CONTENT */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">

            {/* EXECUTIVE KPI HEADER */}
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="premium-card border border-slate-200">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Total Gross Profit</span>
                <h3 className="text-2xl font-black text-slate-900">{formatCurrency(totalGrossProfit, settings)}</h3>
                <div className="mt-2 flex items-center gap-1.5 text-xs font-bold text-slate-500">
                  <Activity className="h-3.5 w-3.5" />
                  Revenue - COGS
                </div>
              </div>

              <div className="bg-red-50 rounded-xl border border-red-200 p-5 shadow-sm">
                <span className="text-[10px] font-black text-red-800 uppercase tracking-widest block mb-1">Total Expenses</span>
                <h3 className="text-2xl font-black text-red-900">{formatCurrency(totalExpenses, settings)}</h3>
                <div className="mt-2 flex items-center gap-1.5 text-xs font-bold text-red-700">
                  <TrendingDown className="h-3.5 w-3.5" />
                  Operational Drain
                </div>
              </div>

              <div className="bg-emerald-50 rounded-xl border border-emerald-200 p-5 shadow-sm">
                <span className="text-[10px] font-black text-emerald-800 uppercase tracking-widest block mb-1">Net Profit</span>
                <h3 className="text-2xl font-black text-emerald-900">{formatCurrency(totalNetProfit, settings)}</h3>
                <div className="mt-2 flex items-center gap-1.5 text-xs font-bold text-emerald-700">
                  <TrendingUp className="h-3.5 w-3.5" />
                  Gross - Expenses
                </div>
              </div>

              <div className={`${profitMarginPercent >= 5 ? 'bg-indigo-50 border-indigo-200' : 'bg-orange-50 border-orange-200'} rounded-xl border p-5 shadow-sm`}>
                <span className={`text-[10px] font-black uppercase tracking-widest block mb-1 ${profitMarginPercent >= 5 ? 'text-indigo-800' : 'text-orange-800'}`}>Net Margin %</span>
                <h3 className={`text-2xl font-black ${profitMarginPercent >= 5 ? 'text-indigo-900' : 'text-orange-900'}`}>
                  {profitMarginPercent.toFixed(2)}%
                </h3>
                <div className={`mt-2 flex items-center gap-1.5 text-xs font-bold ${profitMarginPercent >= 5 ? 'text-indigo-700' : 'text-orange-700'}`}>
                  <PieChartIcon className="h-3.5 w-3.5" />
                  Profitability Ratio
                </div>
              </div>
            </div>

            {/* AI INSIGHTS */}
            <div className="bg-gradient-to-br from-emerald-900 via-slate-900 to-slate-900 rounded-xl p-6 text-white shadow-lg relative overflow-hidden">
              <div className="absolute top-0 right-0 p-6 opacity-10 pointer-events-none">
                <DollarSign className="h-48 w-48" />
              </div>
              <div className="relative z-10 flex flex-col md:flex-row gap-6 items-start">
                <div className="flex-none">
                  <div className="bg-emerald-500/20 p-3 rounded-xl border border-emerald-500/30">
                    <Activity className="h-8 w-8 text-emerald-400" />
                  </div>
                </div>
                <div className="flex-1 space-y-3">
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    Executive Profitability Analysis
                  </h3>
                  <div className="space-y-2">
                    {insights.map((insight, idx) => (
                      <div key={idx} className="flex items-start gap-2">
                        <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 mt-2 shrink-0" />
                        <p className="text-sm text-emerald-100 leading-relaxed font-medium">{insight}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* TOGGLES & TABS */}
            <div className="flex flex-row items-center justify-between gap-4 border-b border-slate-200 pb-2">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveTab('overview')}
                  className={`px-4 py-2 font-sans text-xs font-bold border-b-2 transition-all cursor-pointer ${
                    activeTab === 'overview'
                      ? 'border-emerald-600 text-emerald-600'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Margin Overview
                </button>
                <button
                  onClick={() => setActiveTab('products')}
                  className={`px-4 py-2 font-sans text-xs font-bold border-b-2 transition-all cursor-pointer ${
                    activeTab === 'products'
                      ? 'border-emerald-600 text-emerald-600'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Product Margins
                </button>
              </div>
            </div>

            {/* CONTENT VIEWS */}
            {activeTab === 'overview' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                
                {/* Category Profit Chart */}
                <div className="premium-card border border-slate-200">
                  <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4">
                    Gross Profit By Category
                  </h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie 
                          data={categoryProfitData} 
                          dataKey="value" 
                          nameKey="name" 
                          cx="50%" 
                          cy="50%" 
                          innerRadius={60} 
                          outerRadius={90}
                          paddingAngle={2}
                        >
                          {categoryProfitData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip 
                          formatter={(value: number) => formatCurrency(value, settings)}
                          contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Profit Waterfall / Reconciliation */}
                <div className="premium-card border border-slate-200 flex flex-col h-full">
                  <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4 flex-none">
                    Profit Waterfall
                  </h3>
                  <div className="flex-1 overflow-y-auto space-y-4">
                    <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
                      <span className="text-sm font-bold text-slate-600">Total Revenue</span>
                      <span className="text-sm font-black text-slate-900">{formatCurrency(kpis.revenue.ytd, settings)}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-100">
                      <span className="text-sm font-bold text-red-600">Cost of Goods Sold (COGS)</span>
                      <span className="text-sm font-black text-red-700">-{formatCurrency(kpis.revenue.ytd - totalGrossProfit, settings)}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                      <span className="text-sm font-bold text-emerald-800">Gross Profit</span>
                      <span className="text-sm font-black text-emerald-700">{formatCurrency(totalGrossProfit, settings)}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-100">
                      <span className="text-sm font-bold text-red-600">Total Expenses</span>
                      <span className="text-sm font-black text-red-700">-{formatCurrency(totalExpenses, settings)}</span>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-indigo-50 rounded-lg border-2 border-indigo-200">
                      <span className="text-sm font-black text-indigo-900 uppercase">Net Profit</span>
                      <span className="text-lg font-black text-indigo-700">{formatCurrency(totalNetProfit, settings)}</span>
                    </div>
                  </div>
                </div>

              </div>
            )}

            {activeTab === 'products' && (
              <div className="premium-card border overflow-hidden flex flex-col">
                <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Product Margins Ledger</h3>
                </div>

                <div className="overflow-x-auto">
                  <table className="premium-table">
                    <thead className="sticky top-0 z-10 shadow-sm">
                      <tr className="text-[10px] font-black">
                        <th className="p-3">Product Name</th>
                        <th className="p-3 text-right">Gross Profit Contribution</th>
                        <th className="p-3 text-right">% of Total Margin</th>
                      </tr>
                    </thead>
                    <tbody>
                      {productProfitData.length === 0 ? (
                        <tr>
                          <td colSpan={3} className="p-8 text-center text-slate-500 text-sm font-medium">
                            No product profit data available.
                          </td>
                        </tr>
                      ) : (
                        productProfitData.map((prod, idx) => {
                          const percentage = totalGrossProfit > 0 ? (prod.value / totalGrossProfit) * 100 : 0;
                          return (
                            <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                              <td className="p-3">
                                <div className="font-bold text-slate-800 text-sm">{prod.name}</div>
                              </td>
                              <td className="p-3 text-right">
                                <span className="font-mono text-sm font-bold text-emerald-600">{formatCurrency(prod.value, settings)}</span>
                              </td>
                              <td className="p-3 text-right">
                                <span className="font-mono text-xs font-bold text-slate-600">{percentage.toFixed(2)}%</span>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
