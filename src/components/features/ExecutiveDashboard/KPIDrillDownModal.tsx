import React, { useState } from 'react';
import { KPIResult } from '../../../services/analytics/kpiEngine';
import { X, DollarSign, TrendingUp, TrendingDown, Clock, Activity, PieChart as PieChartIcon, CheckCircle2, AlertOctagon, Info } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, Legend, LineChart, Line, CartesianGrid } from 'recharts';

interface KPIDrillDownModalProps {
  isOpen: boolean;
  onClose: () => void;
  kpis: KPIResult;
  metric: 'revenue' | 'profit' | 'expenses' | 'revaluation' | null;
}

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#64748b'];

export const KPIDrillDownModal: React.FC<KPIDrillDownModalProps> = ({ isOpen, onClose, kpis, metric }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'products' | 'expenses' | 'trends' | 'transactions'>('overview');

  if (!isOpen || !metric) return null;

  const breakdowns = kpis.breakdowns;

  // Formatting helpers
  const fmt = (val: number) => `Rs ${val.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;

  // Product Data
  const productRevenueData = Object.entries(breakdowns.revenueByProduct).map(([name, value]) => ({ name, value }));
  const productProfitData = Object.entries(breakdowns.grossProfitByProduct).map(([name, value]) => ({ name, value }));
  
  // Category Data
  const categoryRevenueData = Object.entries(breakdowns.revenueByCategory).map(([name, value]) => ({ name, value }));
  const categoryProfitData = Object.entries(breakdowns.grossProfitByCategory).map(([name, value]) => ({ name, value }));
  const categoryNetProfitData = Object.entries(breakdowns.netProfitByCategory).map(([name, value]) => ({ name, value }));
  
  // Expense Data
  const expensesData = Object.entries(breakdowns.expensesByCategory).map(([name, value]) => ({ name, value }));

  // Validation Checks
  const totalProductRevenue = productRevenueData.reduce((acc, curr) => acc + curr.value, 0);
  const totalProductProfit = productProfitData.reduce((acc, curr) => acc + curr.value, 0);
  const totalCategoryExpenses = expensesData.reduce((acc, curr) => acc + curr.value, 0);

  // We allow small floating point diffs (e.g., 0.1)
  const isRevenueReconciled = Math.abs(totalProductRevenue - kpis.revenue.ytd) < 1;
  const isProfitReconciled = Math.abs(totalProductProfit - kpis.profit.gross) < 1;
  const isExpenseReconciled = Math.abs(totalCategoryExpenses - kpis.expenses.total) < 1;

  const renderTabContent = () => {
    if (metric === 'revaluation') {
      return (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
              <p className="text-xs font-bold text-slate-500 uppercase">Calculation Formula</p>
              <p className="text-sm font-semibold text-slate-700 mt-2">Rate Diff × Stock On Hand</p>
            </div>
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
              <p className="text-xs font-bold text-slate-500 uppercase">Source Records</p>
              <p className="text-sm font-semibold text-slate-700 mt-2">Rate History Ledger</p>
            </div>
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
              <p className="text-xs font-bold text-slate-500 uppercase">Total Lifetime Impact</p>
              <p className={`text-sm font-semibold mt-2 ${kpis.profit.inventoryRevaluation >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                {fmt(kpis.profit.inventoryRevaluation)}
              </p>
            </div>
          </div>
          <div className="bg-white border-2 border-slate-200 rounded-2xl p-6 shadow-sm">
            <h3 className="text-lg font-black text-slate-800 mb-2">Inventory Revaluation</h3>
            <p className="text-sm text-slate-600 mb-4">
              Inventory Revaluation gains and losses are isolated from operational profit. They are calculated dynamically by taking a snapshot of physical stock levels at the precise moment a price change occurs.
            </p>
            <div className="bg-blue-50 text-blue-800 p-4 rounded-xl text-sm font-medium flex items-start gap-3">
              <Info className="h-5 w-5 mt-0.5 shrink-0" />
              <div>
                Revaluation profit is NOT operational cash. It represents the increased (or decreased) value of the existing inventory you are holding. Navigate to "Price Management" from the sidebar to view the full audit ledger of these events.
              </div>
            </div>
          </div>
        </div>
      );
    }

    switch (activeTab) {
      case 'overview':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                <p className="text-xs font-bold text-slate-500 uppercase">Calculation Formula</p>
                {metric === 'profit' ? (
                  <p className="text-sm font-semibold text-slate-700 mt-2">Revenue - COGS - Expenses</p>
                ) : metric === 'revenue' ? (
                  <p className="text-sm font-semibold text-slate-700 mt-2">Qty Sold × Selling Price</p>
                ) : (
                  <p className="text-sm font-semibold text-slate-700 mt-2">Sum of Categorized Shift Expenses</p>
                )}
              </div>
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                <p className="text-xs font-bold text-slate-500 uppercase">Source Records</p>
                <p className="text-sm font-semibold text-slate-700 mt-2">Active Shifts & Transactions</p>
              </div>
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                <p className="text-xs font-bold text-slate-500 uppercase">Timestamp</p>
                <p className="text-sm font-semibold text-slate-700 mt-2">{new Date().toLocaleString()}</p>
              </div>
            </div>

            <div className="bg-white border-2 border-slate-200 rounded-2xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-black text-slate-800">Reconciliation Engine</h3>
                {isRevenueReconciled && isProfitReconciled && isExpenseReconciled ? (
                  <div className="flex items-center gap-2 bg-emerald-50 px-3 py-1.5 rounded-full text-emerald-700 text-sm font-bold">
                    <CheckCircle2 className="h-4 w-4" /> 100% Integrity Verified
                  </div>
                ) : (
                  <div className="flex items-center gap-2 bg-red-50 px-3 py-1.5 rounded-full text-red-700 text-sm font-bold">
                    <AlertOctagon className="h-4 w-4" /> Data Integrity Alert
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b border-slate-100">
                  <span className="text-sm font-semibold text-slate-600">Sum(Product Revenue) = Total Revenue</span>
                  {isRevenueReconciled ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> : <AlertOctagon className="h-4 w-4 text-red-500" />}
                </div>
                <div className="flex justify-between items-center py-2 border-b border-slate-100">
                  <span className="text-sm font-semibold text-slate-600">Sum(Product Profit) = Total Gross Profit</span>
                  {isProfitReconciled ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> : <AlertOctagon className="h-4 w-4 text-red-500" />}
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-sm font-semibold text-slate-600">Sum(Expense Categories) = Total Expenses</span>
                  {isExpenseReconciled ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> : <AlertOctagon className="h-4 w-4 text-red-500" />}
                </div>
              </div>
            </div>
            
            {metric === 'revenue' && (
              <div className="h-64 mt-4">
                <h3 className="text-sm font-bold text-slate-600 mb-2">Revenue Category Distribution</h3>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={categoryRevenueData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={80}>
                      {categoryRevenueData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                    </Pie>
                    <Tooltip formatter={(value: number) => fmt(value)} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        );

      case 'products':
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-black text-slate-800">Product Level Breakdown</h3>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={metric === 'profit' ? productProfitData : productRevenueData}>
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12}} tickFormatter={(value) => `Rs ${value/1000}k`} />
                  <Tooltip formatter={(value: number) => fmt(value)} cursor={{fill: '#f8fafc'}} />
                  <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="overflow-hidden border border-slate-200 rounded-xl">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4 text-xs font-bold text-slate-500">Product</th>
                    <th className="py-3 px-4 text-xs font-bold text-slate-500 text-right">{metric === 'profit' ? 'Gross Profit' : 'Revenue'}</th>
                    <th className="py-3 px-4 text-xs font-bold text-slate-500 text-right">% of Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(metric === 'profit' ? productProfitData : productRevenueData).map((d, i) => {
                    const total = metric === 'profit' ? totalProductProfit : totalProductRevenue;
                    const pct = total > 0 ? (d.value / total) * 100 : 0;
                    return (
                      <tr key={i} className="hover:bg-slate-50">
                        <td className="py-3 px-4 font-semibold text-slate-800">{d.name}</td>
                        <td className="py-3 px-4 text-right font-bold text-slate-700">{fmt(d.value)}</td>
                        <td className="py-3 px-4 text-right text-slate-500 text-sm">{pct.toFixed(1)}%</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        );

      case 'expenses':
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-black text-slate-800">Expense Categorization</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={expensesData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80}>
                    {expensesData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(value: number) => fmt(value)} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
            
            {expensesData.some(e => e.name === 'Uncategorized') && (
              <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl flex items-center gap-3">
                <AlertOctagon className="h-5 w-5" />
                <div>
                  <p className="font-bold">Data Integrity Issue</p>
                  <p className="text-sm">You have Uncategorized expenses. Please assign strict categories.</p>
                </div>
              </div>
            )}

            <div className="overflow-hidden border border-slate-200 rounded-xl">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4 text-xs font-bold text-slate-500">Category</th>
                    <th className="py-3 px-4 text-xs font-bold text-slate-500 text-right">Amount</th>
                    <th className="py-3 px-4 text-xs font-bold text-slate-500 text-right">% of Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {expensesData.map((d, i) => {
                    const pct = totalCategoryExpenses > 0 ? (d.value / totalCategoryExpenses) * 100 : 0;
                    return (
                      <React.Fragment key={i}>
                        <tr className="hover:bg-slate-50">
                          <td className="py-3 px-4 font-semibold text-slate-800">{d.name}</td>
                          <td className="py-3 px-4 text-right font-bold text-slate-700">{fmt(d.value)}</td>
                          <td className="py-3 px-4 text-right text-slate-500 text-sm">{pct.toFixed(1)}%</td>
                        </tr>
                        {d.name === 'salary' && breakdowns.salaryDetails && breakdowns.salaryDetails.length > 0 && (
                          <tr>
                            <td colSpan={3} className="px-4 py-2 bg-slate-50/50">
                              <div className="border border-slate-200 rounded-lg overflow-hidden my-2">
                                <table className="w-full text-left bg-white">
                                  <thead className="bg-slate-100/50 border-b border-slate-200">
                                    <tr>
                                      <th className="py-2 px-3 text-[10px] font-bold text-slate-500 uppercase">Employee</th>
                                      <th className="py-2 px-3 text-[10px] font-bold text-slate-500 uppercase">Description</th>
                                      <th className="py-2 px-3 text-[10px] font-bold text-slate-500 uppercase text-right">Amount</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-slate-100">
                                    {breakdowns.salaryDetails.map((sd, idx) => (
                                      <tr key={idx} className="hover:bg-slate-50">
                                        <td className="py-2 px-3 text-xs font-semibold text-slate-700">{sd.employeeName}</td>
                                        <td className="py-2 px-3 text-xs text-slate-500">{sd.description}</td>
                                        <td className="py-2 px-3 text-xs text-right font-bold text-slate-600">{fmt(sd.amount)}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        );

      case 'trends':
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-black text-slate-800">Historical Trend Analysis</h3>
            <div className="h-80 w-full bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
              {breakdowns.trendData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={breakdowns.trendData} margin={{ top: 10, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#64748b'}} />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{fontSize: 12, fill: '#64748b'}} 
                      tickFormatter={(value) => `Rs ${value/1000}k`} 
                    />
                    <Tooltip 
                      formatter={(value: number) => fmt(value)}
                      labelStyle={{color: '#1e293b', fontWeight: 'bold'}}
                      contentStyle={{borderRadius: '0.75rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}}
                    />
                    <Legend iconType="circle" wrapperStyle={{paddingTop: '20px'}} />
                    {(metric === 'revenue' || metric === null) && <Line type="monotone" dataKey="revenue" name="Revenue" stroke="#3b82f6" strokeWidth={3} dot={{r: 4, fill: '#3b82f6', strokeWidth: 2, stroke: '#fff'}} activeDot={{r: 6}} />}
                    {(metric === 'profit' || metric === null) && <Line type="monotone" dataKey="profit" name="Gross Profit" stroke="#10b981" strokeWidth={3} dot={{r: 4, fill: '#10b981', strokeWidth: 2, stroke: '#fff'}} activeDot={{r: 6}} />}
                    {(metric === 'expenses' || metric === null) && <Line type="monotone" dataKey="expenses" name="Expenses" stroke="#ef4444" strokeWidth={3} dot={{r: 4, fill: '#ef4444', strokeWidth: 2, stroke: '#fff'}} activeDot={{r: 6}} />}
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-slate-400">
                  <Activity className="h-10 w-10 mb-2 opacity-50" />
                  <p>No trend data available for selected period</p>
                </div>
              )}
            </div>
            
            {/* KPI Summary for Trends */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
               <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                 <p className="text-xs font-bold text-blue-600 uppercase mb-1">Avg Daily Revenue</p>
                 <p className="text-xl font-black text-blue-900">{fmt(kpis.revenue.averageDaily)}</p>
               </div>
               <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4">
                 <p className="text-xs font-bold text-emerald-600 uppercase mb-1">Avg Daily Profit</p>
                 <p className="text-xl font-black text-emerald-900">{fmt(kpis.profit.net / (breakdowns.trendData.length || 1))}</p>
               </div>
               <div className="bg-red-50 border border-red-100 rounded-xl p-4">
                 <p className="text-xs font-bold text-red-600 uppercase mb-1">Avg Daily Expenses</p>
                 <p className="text-xl font-black text-red-900">{fmt(kpis.expenses.total / (breakdowns.trendData.length || 1))}</p>
               </div>
            </div>
          </div>
        );

      case 'transactions':
        return (
          <div className="space-y-4">
            <div className="flex justify-between items-end mb-2">
              <h3 className="text-lg font-black text-slate-800">Traceability Ledger</h3>
              <span className="text-xs font-bold text-slate-400 uppercase">{breakdowns.ledgerTransactions.length} Records Found</span>
            </div>
            <div className="overflow-hidden border border-slate-200 rounded-xl bg-white shadow-sm">
              <div className="max-h-[500px] overflow-y-auto">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-slate-50 border-b border-slate-200 sticky top-0 z-10 shadow-sm">
                    <tr>
                      <th className="py-3 px-4 text-xs font-bold text-slate-500">Date</th>
                      <th className="py-3 px-4 text-xs font-bold text-slate-500">Source Type</th>
                      <th className="py-3 px-4 text-xs font-bold text-slate-500">Description</th>
                      <th className="py-3 px-4 text-xs font-bold text-slate-500 text-right">Impact Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {breakdowns.ledgerTransactions.length > 0 ? (
                      breakdowns.ledgerTransactions.map((tx, i) => (
                        <tr key={`${tx.id}-${i}`} className="hover:bg-slate-50 transition-colors">
                          <td className="py-3 px-4 text-sm font-semibold text-slate-700 whitespace-nowrap">{tx.date}</td>
                          <td className="py-3 px-4 text-sm font-medium text-slate-600">
                            <span className={`px-2 py-1 rounded text-xs font-bold ${
                              tx.type.includes('Sales') ? 'bg-blue-100 text-blue-700' :
                              tx.type.includes('Expense') ? 'bg-red-100 text-red-700' :
                              'bg-slate-100 text-slate-700'
                            }`}>
                              {tx.type}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-sm text-slate-600 truncate max-w-xs">{tx.description}</td>
                          <td className={`py-3 px-4 text-right font-bold whitespace-nowrap ${tx.amount >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                            {tx.amount > 0 ? '+' : ''}{fmt(tx.amount)}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="py-12 text-center text-slate-400">
                          <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                          <p className="font-semibold text-slate-500">No source transactions found</p>
                          <p className="text-xs mt-1">Try expanding the selected date period.</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );
    }
  };

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'products', label: 'Products' },
    { id: 'expenses', label: 'Expenses' },
    { id: 'trends', label: 'Trends' },
    { id: 'transactions', label: 'Transactions' }
  ];

  const titleMap = {
    revenue: 'Revenue Traceability',
    profit: 'Profitability Breakdown',
    expenses: 'Expense Analysis Engine'
  };

  const totalValue = metric === 'revenue' ? kpis.revenue.ytd : metric === 'profit' ? kpis.profit.net : kpis.expenses.total;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-slide-up border border-slate-200">
        
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-xl ${
              metric === 'profit' ? 'bg-emerald-100 text-emerald-600' :
              metric === 'revenue' ? 'bg-blue-100 text-blue-600' :
              'bg-amber-100 text-amber-600'
            }`}>
              {metric === 'profit' ? <TrendingUp className="h-6 w-6" /> : metric === 'revenue' ? <DollarSign className="h-6 w-6" /> : <TrendingDown className="h-6 w-6" />}
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900">{titleMap[metric]}</h2>
              <p className="text-sm font-bold text-slate-500">Drill Down & Analytics</p>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="text-right hidden sm:block">
              <p className="text-xs font-bold text-slate-400 uppercase">YTD Total</p>
              <p className="text-xl font-black text-slate-800">{fmt(totalValue)}</p>
            </div>
            <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-full transition-colors">
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="px-6 border-b border-slate-100 flex gap-6 overflow-x-auto">
          {tabs.map(t => (
            <button 
              key={t.id}
              onClick={() => setActiveTab(t.id as any)}
              className={`py-4 text-sm font-bold border-b-2 transition-colors whitespace-nowrap ${
                activeTab === t.id ? 'border-blue-500 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1 bg-slate-50/50">
          {renderTabContent()}
        </div>

      </div>
    </div>
  );
};
