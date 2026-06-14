import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  AlertTriangle,
  History,
  Activity,
  CheckCircle,
  Database,
  Search,
  Filter
} from 'lucide-react';
import { useStation } from '../../../contexts/StationContext';
import { formatCurrency } from '../../../lib/currency';
import { GlobalSettings, Shift, Staff } from '../../../types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts';

interface ShiftDrillDownModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: GlobalSettings;
}

export default function ShiftDrillDownModal({
  isOpen,
  onClose,
  settings
}: ShiftDrillDownModalProps) {
  const { shifts, staff } = useStation();

  const [activeTab, setActiveTab] = useState<'overview' | 'ledger'>('overview');
  const [searchQuery, setSearchQuery] = useState('');

  // 1. Process Shift Data for Intelligence
  const processedShifts = useMemo(() => {
    let filtered = [...shifts].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(s => 
        (staff.find(st => st.id === s.staffId)?.name.toLowerCase().includes(q)) ||
        s.date.includes(q) ||
        s.status.toLowerCase().includes(q)
      );
    }
    return filtered;
  }, [shifts, searchQuery, staff]);

  // KPIs
  const kpis = useMemo(() => {
    let totalCashCollected = 0;
    let totalShortage = 0;
    let totalOverage = 0;
    let totalShifts = processedShifts.length;
    let closedShifts = 0;
    let activeShifts = 0;
    
    const staffPerformance: Record<string, { totalCash: number; shortage: number; overage: number; shifts: number }> = {};

    processedShifts.forEach(shift => {
      totalCashCollected += shift.submittedCash || 0;
      if (shift.shortage > 0) totalShortage += shift.shortage;
      if (shift.overage > 0) totalOverage += shift.overage;
      
      if (shift.status === 'closed') closedShifts++;
      if (shift.status === 'active') activeShifts++;

      const staffName = staff.find(st => st.id === shift.staffId)?.name || 'Unknown Staff';
      if (!staffPerformance[staffName]) {
        staffPerformance[staffName] = { totalCash: 0, shortage: 0, overage: 0, shifts: 0 };
      }
      staffPerformance[staffName].totalCash += shift.submittedCash || 0;
      staffPerformance[staffName].shortage += shift.shortage || 0;
      staffPerformance[staffName].overage += shift.overage || 0;
      staffPerformance[staffName].shifts++;
    });

    const netVariance = totalOverage - totalShortage;

    // Identify top staff with highest shortage
    let highestShortageStaff = 'N/A';
    let highestShortageValue = -1;
    Object.entries(staffPerformance).forEach(([name, data]) => {
      if (data.shortage > highestShortageValue) {
        highestShortageValue = data.shortage;
        highestShortageStaff = name;
      }
    });

    return {
      totalCashCollected,
      totalShortage,
      totalOverage,
      netVariance,
      totalShifts,
      closedShifts,
      activeShifts,
      staffPerformance,
      highestShortageStaff,
      highestShortageValue
    };
  }, [processedShifts, staff]);

  // AI Insights Generator
  const generateInsights = () => {
    const insights = [];

    insights.push(`Analyzed ${kpis.totalShifts} shifts. ${kpis.activeShifts} currently active, ${kpis.closedShifts} closed.`);
    
    if (kpis.netVariance < 0) {
      insights.push(`Overall cash variance is negative (${formatCurrency(Math.abs(kpis.netVariance), settings)} net shortage). Immediate cash handling review recommended.`);
    } else if (kpis.netVariance > 0) {
      insights.push(`Overall cash variance is positive (${formatCurrency(kpis.netVariance, settings)} net overage). Investigate potential unrecorded sales.`);
    } else {
      insights.push(`Cash variance is perfectly balanced. Excellent cash management.`);
    }

    if (kpis.highestShortageValue > 0) {
      insights.push(`"${kpis.highestShortageStaff}" has accumulated the highest total shortage of ${formatCurrency(kpis.highestShortageValue, settings)} across ${kpis.staffPerformance[kpis.highestShortageStaff]?.shifts || 0} shifts.`);
    }

    const totalExpected = kpis.totalCashCollected + kpis.totalShortage - kpis.totalOverage;
    if (totalExpected > 0) {
      const accuracy = (1 - (kpis.totalShortage / totalExpected)) * 100;
      insights.push(`Overall Cash Collection Accuracy: ${accuracy.toFixed(2)}%.`);
    }

    return insights;
  };

  const insights = generateInsights();

  // Prepare chart data
  const chartData = Object.entries(kpis.staffPerformance)
    .map(([name, data]) => ({
      name,
      shortage: data.shortage,
      overage: data.overage,
    }))
    .sort((a, b) => b.shortage - a.shortage)
    .slice(0, 5); // Top 5 by shortage

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
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                <History className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-xl font-black text-slate-900 tracking-tight">Enterprise Shift Intelligence</h2>
                <p className="text-sm font-medium text-slate-500">Cash Integrity & Staff Performance Analytics</p>
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Total Cash Collected</span>
                <h3 className="text-2xl font-black text-slate-900">{formatCurrency(kpis.totalCashCollected, settings)}</h3>
                <div className="mt-2 flex items-center gap-1.5 text-xs font-bold text-slate-500">
                  <Database className="h-3.5 w-3.5" />
                  Lifetime Collections
                </div>
              </div>

              <div className="bg-red-50 rounded-xl border border-red-200 p-5 shadow-sm">
                <span className="text-[10px] font-black text-red-800 uppercase tracking-widest block mb-1">Total Shortages</span>
                <h3 className="text-2xl font-black text-red-900">{formatCurrency(kpis.totalShortage, settings)}</h3>
                <div className="mt-2 flex items-center gap-1.5 text-xs font-bold text-red-700">
                  <TrendingDown className="h-3.5 w-3.5" />
                  Accumulated Loss
                </div>
              </div>

              <div className="bg-emerald-50 rounded-xl border border-emerald-200 p-5 shadow-sm">
                <span className="text-[10px] font-black text-emerald-800 uppercase tracking-widest block mb-1">Total Overages</span>
                <h3 className="text-2xl font-black text-emerald-900">{formatCurrency(kpis.totalOverage, settings)}</h3>
                <div className="mt-2 flex items-center gap-1.5 text-xs font-bold text-emerald-700">
                  <TrendingUp className="h-3.5 w-3.5" />
                  Accumulated Excess
                </div>
              </div>

              <div className={`${kpis.netVariance >= 0 ? 'bg-indigo-50 border-indigo-200' : 'bg-orange-50 border-orange-200'} rounded-xl border p-5 shadow-sm`}>
                <span className={`text-[10px] font-black uppercase tracking-widest block mb-1 ${kpis.netVariance >= 0 ? 'text-indigo-800' : 'text-orange-800'}`}>Net Variance</span>
                <h3 className={`text-2xl font-black ${kpis.netVariance >= 0 ? 'text-indigo-900' : 'text-orange-900'}`}>
                  {kpis.netVariance >= 0 ? '+' : ''}{formatCurrency(kpis.netVariance, settings)}
                </h3>
                <div className={`mt-2 flex items-center gap-1.5 text-xs font-bold ${kpis.netVariance >= 0 ? 'text-indigo-700' : 'text-orange-700'}`}>
                  <Activity className="h-3.5 w-3.5" />
                  Net Balance Diff
                </div>
              </div>
            </div>

            {/* AI INSIGHTS */}
            <div className="bg-gradient-to-br from-amber-900 via-slate-900 to-slate-900 rounded-xl p-6 text-white shadow-lg relative overflow-hidden">
              <div className="absolute top-0 right-0 p-6 opacity-10 pointer-events-none">
                <AlertTriangle className="h-48 w-48" />
              </div>
              <div className="relative z-10 flex flex-col md:flex-row gap-6 items-start">
                <div className="flex-none">
                  <div className="bg-amber-500/20 p-3 rounded-xl border border-amber-500/30">
                    <Activity className="h-8 w-8 text-amber-400" />
                  </div>
                </div>
                <div className="flex-1 space-y-3">
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    Executive Cash Integrity Analysis
                  </h3>
                  <div className="space-y-2">
                    {insights.map((insight, idx) => (
                      <div key={idx} className="flex items-start gap-2">
                        <div className="h-1.5 w-1.5 rounded-full bg-amber-400 mt-2 shrink-0" />
                        <p className="text-sm text-amber-100 leading-relaxed font-medium">{insight}</p>
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
                      ? 'border-amber-600 text-amber-600'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  General Overview
                </button>
                <button
                  onClick={() => setActiveTab('ledger')}
                  className={`px-4 py-2 font-sans text-xs font-bold border-b-2 transition-all cursor-pointer ${
                    activeTab === 'ledger'
                      ? 'border-amber-600 text-amber-600'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Shift Ledger
                </button>
              </div>
            </div>

            {/* CONTENT VIEWS */}
            {activeTab === 'overview' && (
              <div className="grid grid-cols-2 lg:grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                
                {/* Staff Performance Chart */}
                <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                  <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4">
                    Top 5 Staff Shortages
                  </h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                        <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `Rs ${val/1000}k`} />
                        <Tooltip 
                          cursor={{fill: '#f1f5f9'}}
                          contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#f8fafc' }}
                        />
                        <Bar dataKey="shortage" name="Shortage" fill="#ef4444" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="overage" name="Overage" fill="#10b981" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Staff Breakdown List */}
                <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm flex flex-col h-full max-h-[350px]">
                  <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4 flex-none">
                    Detailed Staff Performance
                  </h3>
                  <div className="flex-1 overflow-y-auto pr-2 space-y-4">
                    {Object.entries(kpis.staffPerformance)
                      .sort((a, b) => b[1].shortage - a[1].shortage)
                      .map(([name, data]) => (
                      <div key={name} className="flex flex-col gap-1.5 pb-3 border-b border-slate-100 last:border-0 last:pb-0">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-bold text-slate-700">{name} <span className="text-xs font-medium text-slate-400">({data.shifts} shifts)</span></span>
                          <div className="flex items-center gap-4">
                            <span className="text-xs font-black text-red-600" title="Total Shortage">
                              -{formatCurrency(data.shortage, settings)}
                            </span>
                            <span className="text-xs font-black text-emerald-600" title="Total Overage">
                              +{formatCurrency(data.overage, settings)}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                    {Object.keys(kpis.staffPerformance).length === 0 && (
                      <div className="text-center py-6 text-sm text-slate-500 font-medium">No staff data available.</div>
                    )}
                  </div>
                </div>

              </div>
            )}

            {activeTab === 'ledger' && (
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Comprehensive Shift Ledger</h3>
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2 h-4 w-4 text-slate-400" />
                    <input 
                      type="text" 
                      placeholder="Search staff, date..."
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      className="pl-8 pr-3 py-1.5 border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white w-64"
                    />
                  </div>
                </div>

                <div className="overflow-x-auto max-h-[400px]">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-white sticky top-0 z-10 shadow-sm">
                      <tr className="border-b border-slate-100 text-[10px] uppercase tracking-wider font-black text-slate-400">
                        <th className="p-3">Date / Time</th>
                        <th className="p-3">Staff</th>
                        <th className="p-3 text-right">Cash Submitted</th>
                        <th className="p-3 text-right">Shortage</th>
                        <th className="p-3 text-right">Overage</th>
                        <th className="p-3 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {processedShifts.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="p-8 text-center text-slate-500 text-sm font-medium">
                            No shifts found matching your criteria.
                          </td>
                        </tr>
                      ) : (
                        processedShifts.map((txn) => {
                          const staffName = staff.find(st => st.id === txn.staffId)?.name || 'Unknown';
                          return (
                            <tr key={txn.id} className="hover:bg-slate-50/50 transition-colors">
                              <td className="p-3">
                                <div className="font-bold text-slate-700 text-xs">{txn.date}</div>
                                <div className="text-[10px] font-medium text-slate-400">{txn.startTime}</div>
                              </td>
                              <td className="p-3">
                                <div className="font-bold text-slate-800 text-xs">{staffName}</div>
                              </td>
                              <td className="p-3 text-right">
                                <span className="font-mono text-xs font-bold text-slate-700">{formatCurrency(txn.submittedCash || 0, settings)}</span>
                              </td>
                              <td className="p-3 text-right">
                                <span className={`font-mono text-xs font-black ${txn.shortage > 0 ? 'text-red-600' : 'text-slate-400'}`}>
                                  {txn.shortage > 0 ? formatCurrency(txn.shortage, settings) : '-'}
                                </span>
                              </td>
                              <td className="p-3 text-right">
                                <span className={`font-mono text-xs font-black ${txn.overage > 0 ? 'text-emerald-600' : 'text-slate-400'}`}>
                                  {txn.overage > 0 ? formatCurrency(txn.overage, settings) : '-'}
                                </span>
                              </td>
                              <td className="p-3 text-center">
                                {txn.status === 'active' ? (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-amber-100 text-amber-700">Active</span>
                                ) : (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-slate-100 text-slate-600">Closed</span>
                                )}
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
