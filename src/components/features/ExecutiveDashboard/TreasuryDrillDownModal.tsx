import React, { useState, useMemo } from 'react';
import { X, ShieldCheck, Zap, Download, FileText, Wallet, Building2, Smartphone, DollarSign, TrendingUp, TrendingDown, ArrowRightLeft, Landmark } from 'lucide-react';
import { GlobalSettings, CashAccount, TreasuryTransaction, BankAccount, DigitalAccount } from '../../../types';
import { formatCurrency } from '../../../lib/currency';
import { useTreasuryStore } from '../../../stores/useTreasuryStore';
import { useFinancialStore } from '../../../stores/useFinancialStore';

interface TreasuryDrillDownModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: GlobalSettings;
}

export default function TreasuryDrillDownModal({
  isOpen,
  onClose,
  settings
}: TreasuryDrillDownModalProps) {
  
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [sourceFilter, setSourceFilter] = useState('all');

  const cashAccounts = useTreasuryStore(state => state.cashAccounts);
  const treasuryTransactions = useTreasuryStore(state => state.treasuryTransactions);
  const banks = useFinancialStore(state => state.banks);
  const digitalAccounts = useFinancialStore(state => state.digitalAccounts);
  const journalEntries = useFinancialStore(state => state.journalEntries);

  const stats = useMemo(() => {
    const today = new Date();
    const currentMonthPrefix = `${today.getFullYear()}-${(today.getMonth() + 1).toString().padStart(2, '0')}`;

    // KPI 1: Current Balances
    const totalCash = cashAccounts.reduce((sum, a) => sum + a.balance, 0);
    const totalBank = banks.reduce((sum, b) => sum + b.balance, 0);
    const totalDigital = digitalAccounts.reduce((sum, d) => sum + d.balance, 0);
    const totalLiquidity = totalCash + totalBank + totalDigital;

    // We calculate "Owner Funds" drawn this month by looking at withdrawals to 'owner_cash' or OwnerDrawings
    // Wait, let's just see transactions this month
    let monthlyInflow = 0;
    let monthlyOutflow = 0;
    let digitalCollections = 0;

    const timeline: any[] = [];

    // Map Treasury Transactions
    treasuryTransactions.forEach(txn => {
      const isCurrentMonth = txn.date.startsWith(currentMonthPrefix);
      const amount = txn.amount;

      if (txn.type === 'deposit') {
        if (isCurrentMonth) monthlyInflow += amount;
      } else if (txn.type === 'withdrawal' || txn.type === 'supplier_payment') {
        if (isCurrentMonth) monthlyOutflow += amount;
      }

      timeline.push({
        id: txn.id,
        date: txn.date.split('T')[0],
        time: txn.date.includes('T') ? txn.date.split('T')[1].substring(0, 5) : '00:00',
        source: txn.sourceAccountType || txn.type,
        destination: txn.destinationAccountType || '-',
        type: txn.type,
        amount: txn.amount,
        reference: txn.description || txn.referenceId || 'System Transfer',
        user: txn.performedBy || 'System'
      });
    });

    // We can also pull in Journal Entries that affect banks/digital
    // To give a more robust view of money moving
    journalEntries.forEach(j => {
      if (j.partyType === 'bank' || j.partyType === 'digital') {
        // If it's not already covered by treasury txns (simplification: we show all journal entries affecting liquidity)
        const isCurrentMonth = j.date.startsWith(currentMonthPrefix);
        if (j.type === 'debit') {
          // Debit to bank = money in
          if (isCurrentMonth) {
             monthlyInflow += j.amount;
             if (j.partyType === 'digital') digitalCollections += j.amount;
          }
        } else {
          // Credit to bank = money out
          if (isCurrentMonth) monthlyOutflow += j.amount;
        }

        timeline.push({
          id: j.id,
          date: j.date.split('T')[0],
          time: j.date.includes('T') ? j.date.split('T')[1].substring(0, 5) : '00:00',
          source: j.partyType.toUpperCase(),
          destination: j.partyName || '-',
          type: j.type === 'debit' ? 'Collection' : 'Payment',
          amount: j.amount,
          reference: j.description || j.referenceId || 'Journal Entry',
          user: 'System'
        });
      }
    });

    // Sort Timeline
    timeline.sort((a, b) => new Date(b.date + 'T' + b.time).getTime() - new Date(a.date + 'T' + a.time).getTime());

    let viewTimeline = timeline;
    if (dateFrom) viewTimeline = viewTimeline.filter(t => t.date >= dateFrom);
    if (dateTo) viewTimeline = viewTimeline.filter(t => t.date <= dateTo);
    if (sourceFilter !== 'all') viewTimeline = viewTimeline.filter(t => t.source.toLowerCase().includes(sourceFilter.toLowerCase()));

    // AI Insights
    const insights = [];
    insights.push(`Total corporate liquidity stands at ${formatCurrency(totalLiquidity, settings)}.`);
    if (monthlyInflow > monthlyOutflow) {
      insights.push(`Positive cash flow this month. Inflows exceeded outflows by ${formatCurrency(monthlyInflow - monthlyOutflow, settings)}.`);
    } else if (monthlyOutflow > monthlyInflow) {
      insights.push(`Negative cash flow this month. Outflows exceeded inflows by ${formatCurrency(monthlyOutflow - monthlyInflow, settings)}.`);
    }
    
    if (monthlyInflow > 0 && digitalCollections > 0) {
      const digitalPct = ((digitalCollections / monthlyInflow) * 100).toFixed(1);
      insights.push(`Digital collections represent ${digitalPct}% of this month's inflows.`);
    }

    const actions = [];
    if (totalCash > 5000000) { // arbitrary threshold for example
      actions.push(`High physical cash detected (${formatCurrency(totalCash, settings)}). Recommend depositing to bank for security.`);
    }
    actions.push(`Review upcoming supplier payments against current liquidity of ${formatCurrency(totalLiquidity, settings)}.`);
    
    return {
      totalCash,
      totalBank,
      totalDigital,
      totalLiquidity,
      monthlyInflow,
      monthlyOutflow,
      netFlow: monthlyInflow - monthlyOutflow,
      insights,
      actions,
      viewTimeline
    };
  }, [cashAccounts, treasuryTransactions, banks, digitalAccounts, journalEntries, dateFrom, dateTo, sourceFilter, settings]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-slate-50 w-full max-w-full max-w-[1400px] h-[95vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-slate-700/50">
        
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4">
            <div className="p-2 bg-slate-800 rounded-lg">
              <Landmark className="h-6 w-6 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-xl font-black">Treasury & Liquidity Intelligence</h2>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-xs text-slate-400 font-bold tracking-widest uppercase flex items-center gap-1">
                  Powered by Umar Ali <Zap className="h-3 w-3 text-orange-500 fill-current" />
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-500/20 text-emerald-400 rounded-full border border-emerald-500/30 flex items-center gap-1">
                  <ShieldCheck className="h-3 w-3" /> Real-time Sync
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
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
            <div className="bg-slate-900 rounded-xl p-4 shadow-sm relative overflow-hidden lg:col-span-2 border border-slate-700">
              <div className="absolute -right-4 -top-4 size-16 bg-white/5 rounded-full blur-xl pointer-events-none"></div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Total Corporate Liquidity</p>
              <p className="text-3xl font-black text-emerald-400">
                {formatCurrency(stats.totalLiquidity, settings)}
              </p>
              <div className="mt-3 flex gap-4 text-xs font-bold">
                <div className="flex items-center gap-1 text-slate-300">
                  <TrendingUp className="h-3 w-3 text-emerald-400" /> In: {formatCurrency(stats.monthlyInflow, settings)}
                </div>
                <div className="flex items-center gap-1 text-slate-300">
                  <TrendingDown className="h-3 w-3 text-rose-400" /> Out: {formatCurrency(stats.monthlyOutflow, settings)}
                </div>
              </div>
            </div>
            
            <div className="premium-card p-4 border flex flex-col justify-between">
              <div className="flex justify-between items-start">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Physical Cash</p>
                <Wallet className="h-4 w-4 text-slate-400" />
              </div>
              <p className="text-xl font-black text-slate-800">{formatCurrency(stats.totalCash, settings)}</p>
            </div>
            
            <div className="premium-card p-4 border flex flex-col justify-between">
              <div className="flex justify-between items-start">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Bank Balance</p>
                <Building2 className="h-4 w-4 text-slate-400" />
              </div>
              <p className="text-xl font-black text-slate-800">{formatCurrency(stats.totalBank, settings)}</p>
            </div>
            
            <div className="premium-card p-4 border flex flex-col justify-between">
              <div className="flex justify-between items-start">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Digital Wallets</p>
                <Smartphone className="h-4 w-4 text-slate-400" />
              </div>
              <p className="text-xl font-black text-slate-800">{formatCurrency(stats.totalDigital, settings)}</p>
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
                  <Zap className="h-4 w-4" /> Treasury Insights
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
              <div className="premium-card border border-slate-200">
                <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-emerald-500" /> Strategic Recommendations
                </h3>
                <div className="space-y-3">
                  {stats.actions.map((action, idx) => (
                    <div key={idx} className="flex gap-2 items-start bg-emerald-50 p-3 rounded-lg border border-emerald-100">
                      <ArrowRightLeft className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                      <p className="text-xs font-bold text-emerald-900">{action}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column: Ledger Grid */}
            <div className="xl:col-span-3 flex flex-col space-y-4">
              
              {/* Grid Filters */}
              <div className="premium-card border border-slate-200 p-4 flex flex-wrap ga items-end shrink-0">
                <div className="flex-1 min-w-full max-w-[200px]">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 block">Filter Source</label>
                  <select 
                    value={sourceFilter} 
                    onChange={e => setSourceFilter(e.target.value)}
                    className="premium-input text-xs p-2 bg-slate-50 font-semibold"
                  >
                    <option value="all">All Sources</option>
                    <option value="cash">Physical Cash</option>
                    <option value="bank">Bank Accounts</option>
                    <option value="digital">Digital Wallets</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 block">From</label>
                  <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="premium-input text-xs p-2 bg-slate-50" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 block">To</label>
                  <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="premium-input text-xs p-2 bg-slate-50" />
                </div>
                <div className="flex gap-2">
                  <button className="px-3 py-2.5 sm:py-2 min-h-[48px] sm:min-h-[40px] bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-xs font-bold transition-colors">
                    <Download className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Grid Data */}
              <div className="premium-card border flex-1 overflow-hidden flex flex-col min-h-[400px]">
                <div className="flex-1 overflow-auto">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-100 text-[10px] uppercase font-black text-slate-500 sticky top-0 z-10 shadow-sm">
                      <tr>
                        <th className="p-3 border-b border-slate-200 whitespace-nowrap">Date / Time</th>
                        <th className="p-3 border-b border-slate-200 whitespace-nowrap">Type</th>
                        <th className="p-3 border-b border-slate-200 whitespace-nowrap">Source / Context</th>
                        <th className="p-3 border-b border-slate-200 whitespace-nowrap">Reference</th>
                        <th className="p-3 border-b border-slate-200 whitespace-nowrap text-right">Amount</th>
                        <th className="p-3 border-b border-slate-200 whitespace-nowrap text-right">User</th>
                      </tr>
                    </thead>
                    <tbody className="text-xs">
                      {stats.viewTimeline.map((entry, i) => (
                        <tr key={entry.id + i} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                          <td className="p-3 align-top whitespace-nowrap">
                            <p className="font-bold text-slate-800">{entry.date}</p>
                            <p className="text-[10px] text-slate-500">{entry.time}</p>
                          </td>
                          <td className="p-3 align-top">
                            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded uppercase ${
                              ['deposit', 'Collection', 'income'].includes(entry.type) ? 'bg-emerald-100 text-emerald-700' : 
                              ['transfer'].includes(entry.type) ? 'bg-blue-100 text-blue-700' :
                              'bg-rose-100 text-rose-700'
                            }`}>
                              {entry.type}
                            </span>
                          </td>
                          <td className="p-3 align-top">
                            <p className="font-bold text-slate-800 uppercase text-[10px]">{entry.source}</p>
                            {entry.destination !== '-' && (
                              <p className="text-[10px] text-slate-500">→ {entry.destination}</p>
                            )}
                          </td>
                          <td className="p-3 align-top">
                            <p className="font-medium text-slate-700 truncate max-w-full max-w-[200px]">{entry.reference}</p>
                          </td>
                          <td className="p-3 align-top text-right whitespace-nowrap">
                            <p className={`font-black ${
                              ['deposit', 'Collection', 'income'].includes(entry.type) ? 'text-emerald-600' : 
                              ['transfer'].includes(entry.type) ? 'text-slate-600' :
                              'text-rose-600'
                            }`}>
                              {['withdrawal', 'supplier_payment', 'Payment', 'expense'].includes(entry.type) ? '-' : 
                               ['deposit', 'Collection', 'income'].includes(entry.type) ? '+' : ''}
                              {formatCurrency(entry.amount, settings)}
                            </p>
                          </td>
                          <td className="p-3 align-top text-right whitespace-nowrap text-[10px] text-slate-500 font-bold uppercase">
                            {entry.user}
                          </td>
                        </tr>
                      ))}
                      {stats.viewTimeline.length === 0 && (
                        <tr>
                          <td colSpan={6} className="p-8 text-center text-slate-500">
                            No treasury transactions found.
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
