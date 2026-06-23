import React, { useState, useMemo } from 'react';
import { X, ShieldCheck, Zap, Download, FileText, BarChart3, TrendingUp, TrendingDown, Filter, Sparkles, User, Layers, Share2, Eye } from 'lucide-react';
import { ResponsiveContainer, PieChart as RechartsPieChart, Pie, Cell, Tooltip as RechartsTooltip, Legend, LineChart, Line, XAxis, YAxis, CartesianGrid } from 'recharts';
import { RateHistoryEntry, GlobalSettings } from '../../../types';
import { formatCurrency } from '../../../lib/currency';

interface RevaluationDrillDownModalProps {
  isOpen: boolean;
  onClose: () => void;
  rateHistory: RateHistoryEntry[];
  settings: GlobalSettings;
  initialContext?: 'all_time' | 'ytd' | 'month' | 'extremes';
}

type ImpactFilter = 'all' | 'gain' | 'loss';

export default function RevaluationDrillDownModal({
  isOpen,
  onClose,
  rateHistory,
  settings,
  initialContext = 'all_time'
}: RevaluationDrillDownModalProps) {

  // Default filters based on initialContext
  const getInitialDates = () => {
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth() + 1;
    const currentMonthStr = currentMonth < 10 ? `0${currentMonth}` : `${currentMonth}`;
    
    if (initialContext === 'month') {
      return {
        from: `${currentYear}-${currentMonthStr}-01`,
        to: `${currentYear}-${currentMonthStr}-31`
      };
    }
    if (initialContext === 'ytd') {
      return {
        from: `${currentYear}-01-01`,
        to: `${currentYear}-12-31`
      };
    }
    return { from: '', to: '' };
  };

  const [dateFrom, setDateFrom] = useState(getInitialDates().from);
  const [dateTo, setDateTo] = useState(getInitialDates().to);
  const [productFilter, setProductFilter] = useState('all');
  const [impactFilter, setImpactFilter] = useState<ImpactFilter>('all');
  const [reasonFilter, setReasonFilter] = useState('all');
  const [changedByFilter, setChangedByFilter] = useState('all');

  // Generate dynamic options from data
  const uniqueProducts = Array.from(new Set(rateHistory.map(r => r.productName || 'Unknown')));
  const uniqueReasons = Array.from(new Set(rateHistory.map(r => r.reason || 'Unknown')));
  const uniqueUsers = Array.from(new Set(rateHistory.map(r => r.changedBy || 'System')));

  // Filter Data
  const filteredData = useMemo(() => {
    let data = [...rateHistory];
    
    if (dateFrom) {
      data = data.filter(r => (r.effectiveDate || r.date || '') >= dateFrom);
    }
    if (dateTo) {
      data = data.filter(r => (r.effectiveDate || r.date || '') <= dateTo);
    }
    if (productFilter !== 'all') {
      data = data.filter(r => (r.productName || 'Unknown') === productFilter);
    }
    if (impactFilter !== 'all') {
      data = data.filter(r => {
        const impact = r.inventoryImpact ?? r.impactAmount ?? 0;
        return impactFilter === 'gain' ? impact > 0 : impact < 0;
      });
    }
    if (reasonFilter !== 'all') {
      data = data.filter(r => (r.reason || 'Unknown') === reasonFilter);
    }
    if (changedByFilter !== 'all') {
      data = data.filter(r => (r.changedBy || 'System') === changedByFilter);
    }
    
    // Sort descending by date
    return data.sort((a, b) => {
      const dateA = new Date(`${a.effectiveDate || a.date}T${a.effectiveTime || '00:00:00'}`).getTime();
      const dateB = new Date(`${b.effectiveDate || b.date}T${b.effectiveTime || '00:00:00'}`).getTime();
      return dateB - dateA;
    });
  }, [rateHistory, dateFrom, dateTo, productFilter, impactFilter, reasonFilter, changedByFilter]);

  // Calculations
  const stats = useMemo(() => {
    let totalGain = 0;
    let totalLoss = 0;
    let largestGain = { amount: 0, product: '-', date: '-' };
    let largestLoss = { amount: 0, product: '-', date: '-' };
    const productRevisions: Record<string, number> = { /* empty */ };
    let highestStock = { stock: 0, product: '-' };

    const gainByProduct: Record<string, number> = { /* empty */ };
    const lossByProduct: Record<string, number> = { /* empty */ };
    const monthlyTrend: Record<string, number> = { /* empty */ };

    filteredData.forEach(r => {
      const impact = r.inventoryImpact ?? r.impactAmount ?? 0;
      const product = r.productName || 'Unknown';
      const date = r.effectiveDate || r.date || 'Unknown';
      const month = date.substring(0, 7);
      
      productRevisions[product] = (productRevisions[product] || 0) + 1;
      
      const stock = r.stockAtTimeOfChange ?? r.stockAtTime ?? r.stockAtChange ?? 0;
      if (stock > highestStock.stock) {
        highestStock = { stock, product };
      }

      monthlyTrend[month] = (monthlyTrend[month] || 0) + impact;

      if (impact > 0) {
        totalGain += impact;
        gainByProduct[product] = (gainByProduct[product] || 0) + impact;
        if (impact > largestGain.amount) {
          largestGain = { amount: impact, product, date };
        }
      } else if (impact < 0) {
        const absImpact = Math.abs(impact);
        totalLoss += absImpact;
        lossByProduct[product] = (lossByProduct[product] || 0) + absImpact;
        if (absImpact > largestLoss.amount) {
          largestLoss = { amount: absImpact, product, date };
        }
      }
    });

    const netImpact = totalGain - totalLoss;
    const eventsCount = filteredData.length;
    const avgImpact = eventsCount > 0 ? netImpact / eventsCount : 0;
    
    let mostRevisedProduct = '-';
    let maxRevisions = 0;
    Object.entries(productRevisions).forEach(([prod, count]) => {
      if (count > maxRevisions) {
        maxRevisions = count;
        mostRevisedProduct = prod;
      }
    });

    const donutData = Object.entries(gainByProduct).map(([name, value]) => ({ name, value, type: 'Gain' }))
      .concat(Object.entries(lossByProduct).map(([name, value]) => ({ name, value, type: 'Loss' })));

    const trendData = Object.entries(monthlyTrend).sort().map(([month, net]) => ({ month, net }));

    // AI Insights Generator (mocked based on actual data structure)
    const insights = [];
    if (totalGain > 0) {
      const topGainProduct = Object.entries(gainByProduct).sort((a,b) => b[1]-a[1])[0];
      if (topGainProduct) {
        const pct = ((topGainProduct[1] / totalGain) * 100).toFixed(0);
        insights.push(`${topGainProduct[0]} generated ${pct}% of total gains in this period.`);
      }
    }
    if (totalLoss > 0) {
      const topLossProduct = Object.entries(lossByProduct).sort((a,b) => b[1]-a[1])[0];
      if (topLossProduct) {
        insights.push(`${topLossProduct[0]} accounted for the most significant loss exposure.`);
      }
    }
    if (eventsCount > 0) {
      const manualCount = filteredData.filter(r => r.reason === 'Manual Correction').length;
      if (manualCount > 0) {
        const pct = ((manualCount / eventsCount) * 100).toFixed(0);
        insights.push(`Manual corrections contributed to ${pct}% of total revaluation events.`);
      } else {
        insights.push(`All revaluations in this period were system/official driven. Zero manual corrections.`);
      }
    }

    return {
      totalGain,
      totalLoss,
      netImpact,
      eventsCount,
      avgImpact,
      largestGain,
      largestLoss,
      mostRevisedProduct,
      maxRevisions,
      highestStock,
      donutData,
      trendData,
      insights
    };
  }, [filteredData]);

  if (!isOpen) return null;

   
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const COLORS = ['#10b981', '#34d399', '#6ee7b7', '#f43f5e', '#fb7185', '#fda4af'];

  return (
    <div className="premium-modal-overlay">
      <div className="bg-slate-50 w-full max-w-7xl h-[95vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-slate-700/50">
        
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4">
            <div className="p-2 bg-slate-800 rounded-lg">
              <Zap className="h-6 w-6 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-xl font-black">Inventory Revaluation Intelligence</h2>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-xs text-slate-400 font-bold tracking-widest uppercase flex items-center gap-1">
                  Powered by Umar Ali <Zap className="h-3 w-3 text-orange-500 fill-current" />
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-500/20 text-emerald-400 rounded-full border border-emerald-500/30 flex items-center gap-1">
                  <ShieldCheck className="h-3 w-3" /> OGRA Auditable
                </span>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-full transition-colors text-slate-400 hover:text-white">
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* Executive KPI Header */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="premium-card p-4 border">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Total Gain</p>
              <p className="text-2xl font-black text-emerald-600">+{formatCurrency(stats.totalGain, settings)}</p>
            </div>
            <div className="premium-card p-4 border">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Total Loss</p>
              <p className="text-2xl font-black text-rose-600">-{formatCurrency(stats.totalLoss, settings)}</p>
            </div>
            <div className="bg-slate-900 rounded-xl p-4 shadow-sm relative overflow-hidden">
              <div className="absolute -right-4 -top-4 size-16 bg-white/5 rounded-full blur-xl pointer-events-none"></div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Net Impact</p>
              <p className={`text-2xl font-black ${stats.netImpact >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {stats.netImpact >= 0 ? '+' : ''}{formatCurrency(stats.netImpact, settings)}
              </p>
            </div>
            <div className="premium-card p-4 border">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Events Count</p>
              <p className="text-2xl font-black text-slate-800">{stats.eventsCount}</p>
            </div>
            <div className="premium-card p-4 border">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Avg Impact / Event</p>
              <p className="text-2xl font-black text-blue-600">{formatCurrency(stats.avgImpact, settings)}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            
            {/* Left Sidebar: Filters & Mini Analytics */}
            <div className="space-y-6">
              
              {/* Advanced Filters */}
              <div className="premium-card border border-slate-200">
                <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <Filter className="h-4 w-4 text-blue-600" /> Advanced Filters
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-slate-500 mb-1 block">Date Range</label>
                    <div className="flex gap-2">
                      <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="premium-input text-xs p-2 bg-slate-50" />
                      <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="premium-input text-xs p-2 bg-slate-50" />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 mb-1 block">Product</label>
                    <select value={productFilter} onChange={e => setProductFilter(e.target.value)} className="premium-input text-xs p-2 bg-slate-50 font-semibold">
                      <option value="all">All Products</option>
                      {uniqueProducts.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 mb-1 block">Impact Type</label>
                    <select value={impactFilter} onChange={e => setImpactFilter(e.target.value as ImpactFilter)} className="premium-input text-xs p-2 bg-slate-50 font-semibold">
                      <option value="all">All Impacts</option>
                      <option value="gain">Gain Only</option>
                      <option value="loss">Loss Only</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 mb-1 block">Reason</label>
                    <select value={reasonFilter} onChange={e => setReasonFilter(e.target.value)} className="premium-input text-xs p-2 bg-slate-50 font-semibold">
                      <option value="all">All Reasons</option>
                      {uniqueReasons.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 mb-1 block">Changed By</label>
                    <select value={changedByFilter} onChange={e => setChangedByFilter(e.target.value)} className="premium-input text-xs p-2 bg-slate-50 font-semibold">
                      <option value="all">All Users</option>
                      {uniqueUsers.map(u => <option key={u} value={u}>{u}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              {/* AI Intelligence Panel */}
              <div className="bg-gradient-to-br from-indigo-900 to-slate-900 rounded-xl p-5 shadow-sm border border-indigo-800 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                  <Sparkles className="w-24 h-24" />
                </div>
                <h3 className="text-sm font-bold text-indigo-300 mb-4 flex items-center gap-2 relative z-10">
                  <Sparkles className="h-4 w-4" /> AI Revaluation Insights
                </h3>
                <div className="space-y-3 relative z-10">
                  {stats.insights.length > 0 ? stats.insights.map((insight, idx) => (
                    <div key={idx} className="flex gap-2 text-sm bg-indigo-950/50 p-3 rounded-lg border border-indigo-800/50">
                      <span className="text-indigo-400 mt-0.5">•</span>
                      <p className="text-indigo-100">{insight}</p>
                    </div>
                  )) : (
                    <p className="text-sm text-indigo-300 italic">No significant insights for current filter.</p>
                  )}
                </div>
              </div>

              {/* Executive Mini Analytics */}
              <div className="premium-card border border-slate-200 space-y-4">
                <h3 className="text-sm font-bold text-slate-800 mb-2 flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-emerald-600" /> Key Extremes
                </h3>
                <div className="bg-emerald-50 rounded-lg p-3 border border-emerald-100">
                  <p className="text-[10px] font-bold text-emerald-600 uppercase mb-1">Largest Gain</p>
                  <p className="text-lg font-black text-emerald-700">+{formatCurrency(stats.largestGain.amount, settings)}</p>
                  <p className="text-xs text-emerald-600 mt-1">{stats.largestGain.product} &bull; {stats.largestGain.date}</p>
                </div>
                <div className="bg-rose-50 rounded-lg p-3 border border-rose-100">
                  <p className="text-[10px] font-bold text-rose-600 uppercase mb-1">Largest Loss</p>
                  <p className="text-lg font-black text-rose-700">-{formatCurrency(stats.largestLoss.amount, settings)}</p>
                  <p className="text-xs text-rose-600 mt-1">{stats.largestLoss.product} &bull; {stats.largestLoss.date}</p>
                </div>
                <div className="bg-blue-50 rounded-lg p-3 border border-blue-100">
                  <p className="text-[10px] font-bold text-blue-600 uppercase mb-1">Most Revised Product</p>
                  <p className="text-sm font-bold text-blue-800">{stats.mostRevisedProduct}</p>
                  <p className="text-xs text-blue-600 mt-0.5">{stats.maxRevisions} revisions</p>
                </div>
                <div className="bg-amber-50 rounded-lg p-3 border border-amber-100">
                  <p className="text-[10px] font-bold text-amber-600 uppercase mb-1">Highest Stock Exposure</p>
                  <p className="text-sm font-bold text-amber-800">{stats.highestStock.stock.toLocaleString()} L</p>
                  <p className="text-xs text-amber-600 mt-0.5">{stats.highestStock.product}</p>
                </div>
              </div>

            </div>

            {/* Main Content Area */}
            <div className="lg:col-span-3 space-y-6">
              
              {/* Visual Analytics */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="premium-card p-5 border h-72">
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4 text-center">Impact Distribution (Gain/Loss by Product)</h4>
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPieChart>
                      <Pie data={stats.donutData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                        {stats.donutData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.type === 'Gain' ? '#10b981' : '#f43f5e'} />
                        ))}
                      </Pie>
                      <RechartsTooltip formatter={(val: any) => formatCurrency(val, settings)} />
                      <Legend />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </div>
                <div className="premium-card p-5 border h-72">
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4 text-center">Monthly Net Revaluation Trend</h4>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={stats.trendData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="month" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                      <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(val) => `${val / 1000}k`} />
                      <RechartsTooltip formatter={(val: any) => formatCurrency(val, settings)} />
                      <Line type="monotone" dataKey="net" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4, fill: '#3b82f6', strokeWidth: 2, stroke: '#fff' }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Enterprise Ledger Grid */}
              <div className="premium-card border overflow-hidden flex flex-col h-[600px]">
                <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50 shrink-0">
                  <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                    <Layers className="h-4 w-4 text-slate-500" /> Enterprise Revaluation Ledger
                  </h3>
                  <div className="flex items-center gap-2">
                    <button className="px-3 py-1.5 bg-white border border-slate-200 text-slate-600 rounded-lg text-xs font-bold hover:bg-slate-50 flex items-center gap-2">
                      <Download className="h-3 w-3" /> Export PDF
                    </button>
                    <button className="px-3 py-1.5 bg-white border border-slate-200 text-slate-600 rounded-lg text-xs font-bold hover:bg-slate-50 flex items-center gap-2">
                      <FileText className="h-3 w-3" /> Export Excel
                    </button>
                  </div>
                </div>
                <div className="flex-1 overflow-auto">
                  <table className="premium-table">
                    <thead className="text-[10px] font-black sticky top-0 z-10 shadow-sm">
                      <tr>
                        <th className="p-3">Event Info</th>
                        <th className="p-3">Product</th>
                        <th className="p-3">Rate Change</th>
                        <th className="p-3">Snapshot</th>
                        <th className="p-3 text-right">Net Impact</th>
                        <th className="p-3">Context</th>
                        <th className="p-3 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredData.map(entry => {
                        const impact = entry.inventoryImpact ?? entry.impactAmount ?? 0;
                        const isGain = impact > 0;
                        const oldRate = entry.oldPrice ?? entry.oldRate ?? 0;
                        const newRate = entry.newPrice ?? entry.newRate ?? 0;
                        const diff = entry.difference ?? entry.change ?? (newRate - oldRate);
                        const stock = entry.stockAtTimeOfChange ?? entry.stockAtTime ?? entry.stockAtChange ?? 0;

                        return (
                          <tr key={entry.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors group">
                            <td className="p-3 align-top">
                              <p className="font-bold text-slate-800">{entry.effectiveDate || entry.date}</p>
                              <p className="text-[10px] text-slate-500">{entry.effectiveTime || '12:00'}</p>
                              <div className="mt-1 flex items-center gap-1">
                                <User className="h-3 w-3 text-slate-400" />
                                <p className="text-[10px] font-semibold text-slate-600">{entry.changedBy || 'System'}</p>
                              </div>
                            </td>
                            <td className="p-3 align-top">
                              <p className="font-bold text-slate-800">{entry.productName}</p>
                              <span className="inline-block mt-1 px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[9px] font-bold uppercase tracking-wider">Fuel</span>
                            </td>
                            <td className="p-3 align-top">
                              <div className="flex items-center gap-2">
                                <span className="text-slate-500 line-through">{oldRate.toFixed(2)}</span>
                                <span className="text-slate-400">→</span>
                                <span className="font-bold text-slate-900">{newRate.toFixed(2)}</span>
                              </div>
                              <p className={`text-[10px] font-bold mt-1 flex items-center gap-0.5 ${diff > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                {diff > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                                {Math.abs(diff).toFixed(2)} / L
                              </p>
                            </td>
                            <td className="p-3 align-top">
                              <p className="font-bold text-slate-800">{stock.toLocaleString()} L</p>
                              <p className="text-[10px] text-slate-500 mt-1">Value B/A: N/A</p> {/* Future Integration */}
                            </td>
                            <td className="p-3 align-top text-right">
                              <p className={`font-black text-sm ${isGain ? 'text-emerald-600' : 'text-rose-600'}`}>
                                {isGain ? '+' : ''}{formatCurrency(impact, settings)}
                              </p>
                              <p className="text-[10px] font-bold text-slate-500 mt-1 uppercase tracking-wider">
                                {isGain ? 'Reserve Gain' : 'Reserve Loss'}
                              </p>
                            </td>
                            <td className="p-3 align-top">
                              <span className="inline-block px-2 py-1 bg-blue-50 text-blue-700 rounded text-[10px] font-bold border border-blue-100">
                                {entry.reason || 'Manual Correction'}
                              </span>
                              {entry.notes && <p className="text-[10px] text-slate-500 mt-1 truncate max-w-full max-w-[150px]" title={entry.notes}>{entry.notes}</p>}
                            </td>
                            <td className="p-3 align-top text-center">
                              <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg transition-colors" title="View Snapshot">
                                  <Eye className="h-3.5 w-3.5" />
                                </button>
                                <button className="p-1.5 bg-green-50 hover:bg-green-100 text-green-600 rounded-lg transition-colors" title="WhatsApp Summary">
                                  <Share2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                      {filteredData.length === 0 && (
                        <tr>
                          <td colSpan={7} className="p-8 text-center text-slate-500">
                            No revaluation events found for the selected filters.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
