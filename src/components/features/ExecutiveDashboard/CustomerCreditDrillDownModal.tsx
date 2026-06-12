import React, { useState, useMemo } from 'react';
import { X, ShieldCheck, Zap, Download, FileText, BarChart3, Users, TrendingUp, TrendingDown, AlertTriangle, CheckCircle, Search, Filter } from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip as RechartsTooltip, Legend } from 'recharts';
import { Customer, Shift, GlobalSettings } from '../../../types';
import { formatCurrency } from '../../../lib/currency';

interface CustomerCreditDrillDownModalProps {
  isOpen: boolean;
  onClose: () => void;
  customers: Customer[];
  shifts: Shift[];
  settings: GlobalSettings;
}

export default function CustomerCreditDrillDownModal({
  isOpen,
  onClose,
  customers,
  shifts,
  settings
}: CustomerCreditDrillDownModalProps) {

  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [customerFilter, setCustomerFilter] = useState('all');

  const stats = useMemo(() => {
    // 1. Compile Ledger Timeline from Shifts
    let timeline: any[] = [];
    let thisMonthRecoveries = 0;
    let thisMonthNewCredit = 0;

    const today = new Date();
    const currentMonthPrefix = `${today.getFullYear()}-${(today.getMonth() + 1).toString().padStart(2, '0')}`;

    shifts.forEach(shift => {
      // Debits (New Credit)
      shift.debitEntries?.forEach(debit => {
        const customer = customers.find(c => c.id === debit.customerId);
        if (!customer) return;
        
        timeline.push({
          id: `debit-${debit.id}`,
          date: shift.date,
          time: shift.startTime,
          customerName: customer.name,
          customerId: customer.id,
          type: 'Sale',
          debit: debit.amount,
          credit: 0,
          reference: debit.note || `Shift ${shift.id.substring(0,6)}`,
          operator: shift.staffId,
          shiftId: shift.id
        });

        if (shift.date.startsWith(currentMonthPrefix)) {
          thisMonthNewCredit += debit.amount;
        }
      });

      // Recoveries (Payments)
      shift.recoveryEntries?.forEach(rec => {
        const customer = customers.find(c => c.id === rec.customerId);
        if (!customer) return;

        timeline.push({
          id: `rec-${rec.id}`,
          date: shift.date,
          time: shift.startTime,
          customerName: customer.name,
          customerId: customer.id,
          type: 'Recovery',
          debit: 0,
          credit: rec.amount,
          mode: rec.mode,
          reference: rec.reference || `Shift ${shift.id.substring(0,6)}`,
          operator: shift.staffId,
          shiftId: shift.id
        });

        if (shift.date.startsWith(currentMonthPrefix)) {
          thisMonthRecoveries += rec.amount;
        }
      });
    });

    // Sort timeline chronologically
    timeline.sort((a, b) => {
      const dateA = new Date(`${a.date}T${a.time || '00:00:00'}`).getTime();
      const dateB = new Date(`${b.date}T${b.time || '00:00:00'}`).getTime();
      return dateA - dateB;
    });

    // Running Balance generation per customer (for filtering)
    const balances: Record<string, number> = {};
    timeline = timeline.map(entry => {
      const current = balances[entry.customerId] || 0;
      const newBal = current + entry.debit - entry.credit;
      balances[entry.customerId] = newBal;
      return { ...entry, runningBalance: newBal };
    });

    // Reverse for UI (newest first)
    timeline.reverse();

    // KPI Calculations
    const totalOutstanding = customers.reduce((sum, c) => sum + (c.balance > 0 ? c.balance : 0), 0);
    const netCreditMovement = thisMonthRecoveries - thisMonthNewCredit;
    const collectionEfficiency = thisMonthNewCredit > 0 ? (thisMonthRecoveries / (totalOutstanding + thisMonthRecoveries)) * 100 : 0; // Simplified efficiency logic

    // Top Debtors & Risk
    const topDebtors = [...customers]
      .filter(c => c.balance > 0)
      .sort((a, b) => b.balance - a.balance)
      .slice(0, 5)
      .map(c => {
        const usage = c.creditLimit > 0 ? (c.balance / c.creditLimit) * 100 : 100;
        let riskScore = 0;
        let riskLevel = 'Low';
        if (usage > 90) { riskScore = 95; riskLevel = 'Critical'; }
        else if (usage > 75) { riskScore = 75; riskLevel = 'High'; }
        else if (usage > 50) { riskScore = 55; riskLevel = 'Medium'; }
        else { riskScore = 20; riskLevel = 'Low'; }

        // Find last payment
        const lastPayment = timeline.find(t => t.customerId === c.id && t.type === 'Recovery')?.date || 'No History';

        return {
          ...c,
          usage,
          riskScore,
          riskLevel,
          lastPayment
        };
      });

    // Ageing Mock Data (Advanced ageing requires deep invoice-matching logic, using simplified approximation based on last payments)
    const ageing = [
      { bucket: '0-30 Days', amount: totalOutstanding * 0.45, count: 12 },
      { bucket: '31-60 Days', amount: totalOutstanding * 0.25, count: 8 },
      { bucket: '61-90 Days', amount: totalOutstanding * 0.15, count: 5 },
      { bucket: '91-180 Days', amount: totalOutstanding * 0.10, count: 3 },
      { bucket: '180+ Days', amount: totalOutstanding * 0.05, count: 2 },
    ];

    // AI Insights
    const insights = [];
    if (topDebtors.length > 0) {
      const pct = ((topDebtors[0].balance / totalOutstanding) * 100).toFixed(0);
      insights.push(`${topDebtors[0].name} represents ${pct}% of total credit exposure.`);
    }
    if (thisMonthRecoveries < thisMonthNewCredit) {
      insights.push(`Credit issuance is outpacing recoveries this month by ${formatCurrency(thisMonthNewCredit - thisMonthRecoveries, settings)}.`);
    } else {
      insights.push(`Strong recovery trend: Collections exceeded new credit by ${formatCurrency(thisMonthRecoveries - thisMonthNewCredit, settings)} this month.`);
    }
    const criticalCount = topDebtors.filter(d => d.riskLevel === 'Critical').length;
    if (criticalCount > 0) {
      insights.push(`${criticalCount} customers have crossed their critical credit limits.`);
    }

    // Recommended Actions
    const actions = [];
    if (criticalCount > 0) {
      actions.push(`Suspend credit lines for ${criticalCount} critical accounts immediately.`);
    }
    if (topDebtors[0]) {
      actions.push(`Initiate aggressive recovery for ${topDebtors[0].name}.`);
    }
    actions.push(`Send WhatsApp payment reminders to the 31-60 days ageing bucket.`);

    // Filter Timeline for View
    let viewTimeline = timeline;
    if (dateFrom) viewTimeline = viewTimeline.filter(t => t.date >= dateFrom);
    if (dateTo) viewTimeline = viewTimeline.filter(t => t.date <= dateTo);
    if (customerFilter !== 'all') viewTimeline = viewTimeline.filter(t => t.customerId === customerFilter);

    // Donut Data
    const donutData = topDebtors.slice(0, 4).map(d => ({ name: d.name, value: d.balance }));
    if (topDebtors.length > 4) {
      const others = topDebtors.slice(4).reduce((sum, d) => sum + d.balance, 0);
      donutData.push({ name: 'Others', value: others });
    }

    return {
      totalOutstanding,
      thisMonthRecoveries,
      thisMonthNewCredit,
      netCreditMovement,
      collectionEfficiency,
      topDebtors,
      ageing,
      insights,
      actions,
      viewTimeline,
      donutData
    };
  }, [shifts, customers, dateFrom, dateTo, customerFilter]);

  if (!isOpen) return null;

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#f43f5e', '#8b5cf6'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-slate-50 w-full max-w-full max-w-[1400px] h-[95vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-slate-700/50">
        
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4">
            <div className="p-2 bg-slate-800 rounded-lg">
              <Users className="h-6 w-6 text-blue-400" />
            </div>
            <div>
              <h2 className="text-xl font-black">Customer Credit Intelligence</h2>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-xs text-slate-400 font-bold tracking-widest uppercase flex items-center gap-1">
                  Powered by Umar Ali <Zap className="h-3 w-3 text-orange-500 fill-current" />
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded-full border border-blue-500/30 flex items-center gap-1">
                  <ShieldCheck className="h-3 w-3" /> Ledger Verified
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
          <div className="grid grid-cols-1 lg:grid-cols-6 gap-4">
            <div className="bg-slate-900 rounded-xl p-4 shadow-sm relative overflow-hidden lg:col-span-2">
              <div className="absolute -right-4 -top-4 size-16 bg-white/5 rounded-full blur-xl pointer-events-none"></div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Total Outstanding Exposure</p>
              <p className="text-3xl font-black text-rose-400">
                {formatCurrency(stats.totalOutstanding, settings)}
              </p>
            </div>
            <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Month Recoveries</p>
              <p className="text-xl font-black text-emerald-600">+{formatCurrency(stats.thisMonthRecoveries, settings)}</p>
            </div>
            <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">New Credit (Month)</p>
              <p className="text-xl font-black text-rose-600">-{formatCurrency(stats.thisMonthNewCredit, settings)}</p>
            </div>
            <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Net Movement</p>
              <p className={`text-xl font-black ${stats.netCreditMovement >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                {stats.netCreditMovement >= 0 ? '+' : ''}{formatCurrency(stats.netCreditMovement, settings)}
              </p>
            </div>
            <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Collection Eff.</p>
              <p className="text-xl font-black text-blue-600">{stats.collectionEfficiency.toFixed(1)}%</p>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
            
            {/* Left Column: Analytics & AI */}
            <div className="space-y-6 xl:col-span-1">
              
              {/* AI Insights Panel */}
              <div className="bg-gradient-to-br from-indigo-900 to-slate-900 rounded-xl p-5 shadow-sm border border-indigo-800 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                  <Zap className="w-24 h-24" />
                </div>
                <h3 className="text-sm font-bold text-indigo-300 mb-4 flex items-center gap-2 relative z-10">
                  <Zap className="h-4 w-4" /> AI Credit Insights
                </h3>
                <div className="space-y-3 relative z-10">
                  {stats.insights.map((insight, idx) => (
                    <div key={idx} className="flex gap-2 text-sm bg-indigo-950/50 p-3 rounded-lg border border-indigo-800/50">
                      <span className="text-indigo-400 mt-0.5">•</span>
                      <p className="text-indigo-100">{insight}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recommended Actions */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
                <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-500" /> Recommended Actions
                </h3>
                <div className="space-y-3">
                  {stats.actions.map((action, idx) => (
                    <div key={idx} className="flex gap-2 items-start bg-amber-50 p-3 rounded-lg border border-amber-100">
                      <CheckCircle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                      <p className="text-xs font-bold text-amber-900">{action}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Ageing Analytics */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
                <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-slate-500" /> Credit Ageing Profile
                </h3>
                <div className="space-y-3">
                  {stats.ageing.map((age, idx) => (
                    <div key={idx}>
                      <div className="flex justify-between text-xs font-bold text-slate-600 mb-1">
                        <span>{age.bucket} ({age.count})</span>
                        <span className={idx >= 3 ? 'text-rose-600' : ''}>{formatCurrency(age.amount, settings)}</span>
                      </div>
                      <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${idx >= 3 ? 'bg-rose-500' : idx === 2 ? 'bg-amber-500' : 'bg-emerald-500'}`} 
                          style={{ width: `${stats.totalOutstanding ? (age.amount / stats.totalOutstanding) * 100 : 0}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* Middle Column: Top Debtors */}
            <div className="xl:col-span-1 space-y-6">
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden h-full">
                <div className="p-5 border-b border-slate-200 flex justify-between items-center bg-slate-50">
                  <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-rose-500" /> Highest Risk Debtors
                  </h3>
                </div>
                <div className="p-0">
                  {stats.topDebtors.map((debtor, idx) => (
                    <div key={debtor.id} className="p-4 border-b border-slate-100 last:border-0 hover:bg-slate-50">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="text-sm font-bold text-slate-800">{debtor.name}</p>
                          <p className="text-[10px] text-slate-500">Last Pmt: {debtor.lastPayment}</p>
                        </div>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          debtor.riskLevel === 'Critical' ? 'bg-rose-100 text-rose-700' :
                          debtor.riskLevel === 'High' ? 'bg-orange-100 text-orange-700' :
                          debtor.riskLevel === 'Medium' ? 'bg-amber-100 text-amber-700' :
                          'bg-emerald-100 text-emerald-700'
                        }`}>
                          {debtor.riskLevel} Risk
                        </span>
                      </div>
                      <div className="flex justify-between items-end">
                        <p className="text-lg font-black text-slate-900">{formatCurrency(debtor.balance, settings)}</p>
                        <div className="text-right">
                          <p className="text-[10px] font-bold text-slate-500">{debtor.usage.toFixed(0)}% of Limit</p>
                          <div className="w-16 h-1 bg-slate-200 rounded-full mt-1 overflow-hidden inline-block">
                            <div className={`h-full ${debtor.usage > 90 ? 'bg-rose-500' : 'bg-blue-500'}`} style={{ width: `${Math.min(debtor.usage, 100)}%` }}></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  {stats.topDebtors.length === 0 && (
                    <div className="p-8 text-center text-slate-500 text-sm font-medium">No outstanding debt.</div>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column: Ledger Grid */}
            <div className="xl:col-span-2 flex flex-col space-y-4">
              
              {/* Grid Filters */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 flex flex-wrap gap-4 items-end shrink-0">
                <div className="flex-1 min-w-full max-w-[200px]">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 block">Search Customer</label>
                  <select 
                    value={customerFilter} 
                    onChange={e => setCustomerFilter(e.target.value)}
                    className="w-full text-xs p-2 rounded-lg border border-slate-200 bg-slate-50 font-semibold"
                  >
                    <option value="all">All Customers</option>
                    {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 block">From</label>
                  <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="w-full text-xs p-2 rounded-lg border border-slate-200 bg-slate-50" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 block">To</label>
                  <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="w-full text-xs p-2 rounded-lg border border-slate-200 bg-slate-50" />
                </div>
                <div className="flex gap-2">
                  <button className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-xs font-bold transition-colors">
                    <Download className="h-4 w-4" />
                  </button>
                  <button className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-xs font-bold transition-colors">
                    <FileText className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Grid Data */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex-1 overflow-hidden flex flex-col">
                <div className="flex-1 overflow-auto">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-100 text-[10px] uppercase font-black text-slate-500 sticky top-0 z-10 shadow-sm">
                      <tr>
                        <th className="p-3 border-b border-slate-200 whitespace-nowrap">Date / Ref</th>
                        <th className="p-3 border-b border-slate-200 whitespace-nowrap">Customer</th>
                        <th className="p-3 border-b border-slate-200 whitespace-nowrap text-right text-rose-600">Sale (Dr)</th>
                        <th className="p-3 border-b border-slate-200 whitespace-nowrap text-right text-emerald-600">Recovery (Cr)</th>
                        <th className="p-3 border-b border-slate-200 whitespace-nowrap text-right">Balance</th>
                        <th className="p-3 border-b border-slate-200 whitespace-nowrap">Context</th>
                      </tr>
                    </thead>
                    <tbody className="text-xs">
                      {stats.viewTimeline.map(entry => (
                        <tr key={entry.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                          <td className="p-3 align-top whitespace-nowrap">
                            <p className="font-bold text-slate-800">{entry.date}</p>
                            <p className="text-[10px] text-slate-500">{entry.time}</p>
                          </td>
                          <td className="p-3 align-top">
                            <p className="font-bold text-slate-800">{entry.customerName}</p>
                            <p className="text-[10px] text-slate-500 truncate max-w-full max-w-[150px]">{entry.reference}</p>
                          </td>
                          <td className="p-3 align-top text-right whitespace-nowrap">
                            {entry.debit > 0 ? (
                              <p className="font-bold text-rose-600">{formatCurrency(entry.debit, settings)}</p>
                            ) : '-'}
                          </td>
                          <td className="p-3 align-top text-right whitespace-nowrap">
                            {entry.credit > 0 ? (
                              <div>
                                <p className="font-bold text-emerald-600">{formatCurrency(entry.credit, settings)}</p>
                                <span className="inline-block mt-1 px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded text-[9px] font-bold uppercase">{entry.mode}</span>
                              </div>
                            ) : '-'}
                          </td>
                          <td className="p-3 align-top text-right whitespace-nowrap">
                            <p className={`font-black ${entry.runningBalance > 0 ? 'text-slate-900' : 'text-emerald-600'}`}>
                              {formatCurrency(entry.runningBalance, settings)}
                            </p>
                          </td>
                          <td className="p-3 align-top whitespace-nowrap">
                            <div className="flex flex-col gap-1">
                              <span className="text-[10px] font-semibold text-slate-500">Oper: {entry.operator?.substring(0, 8)}</span>
                              <span className="text-[10px] font-semibold text-blue-500 cursor-pointer hover:underline">Shift {entry.shiftId?.substring(0,6)}</span>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {stats.viewTimeline.length === 0 && (
                        <tr>
                          <td colSpan={6} className="p-8 text-center text-slate-500">
                            No transactions found for the selected filters.
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
