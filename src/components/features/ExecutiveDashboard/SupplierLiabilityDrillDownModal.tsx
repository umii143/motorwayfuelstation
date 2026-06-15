import React, { useState, useMemo } from 'react';
import { X, ShieldCheck, Zap, Download, FileText, PieChart as PieChartIcon, Truck, TrendingDown, TrendingUp, AlertTriangle, CheckCircle, Search } from 'lucide-react';
import { Supplier, GlobalSettings } from '../../../types';
import { formatCurrency } from '../../../lib/currency';
import { useFinancialStore } from '../../../stores/useFinancialStore';
import { useStation } from '../../../contexts/StationContext';
import { useInventoryStore } from '../../../stores/useInventoryStore';

interface SupplierLiabilityDrillDownModalProps {
  isOpen: boolean;
  onClose: () => void;
  suppliers: Supplier[];
  settings: GlobalSettings;
}

export default function SupplierLiabilityDrillDownModal({
  isOpen,
  onClose,
  suppliers,
  settings
}: SupplierLiabilityDrillDownModalProps) {

  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [supplierFilter, setSupplierFilter] = useState('all');

  // We need journal entries to calculate the true ledger for suppliers
  const journalEntries = useFinancialStore(state => state.journalEntries);
  const { shifts } = useStation();
  const stockTxns = useInventoryStore(state => state.stockTxns);

  const stats = useMemo(() => {
    let timeline: any[] = [];
    let thisMonthPayments = 0;
    let thisMonthPurchases = 0;

    const today = new Date();
    const currentMonthPrefix = `${today.getFullYear()}-${(today.getMonth() + 1).toString().padStart(2, '0')}`;

    // Filter to only supplier related journal entries
    const supplierEntries = journalEntries.filter(j => j.partyType === 'supplier');
    const processedRefIds = new Set<string>();

    supplierEntries.forEach(j => {
      const supplier = suppliers.find(s => s.id === j.partyId);
      if (!supplier) return;

      if (j.referenceId) processedRefIds.add(j.referenceId);

      const isPayment = j.type === 'debit'; // Payment to supplier reduces payable (Debit)
      const isPurchase = j.type === 'credit'; // Stock invoice increases payable (Credit)

      timeline.push({
        id: j.id,
        date: j.date.split('T')[0],
        time: j.date.includes('T') ? j.date.split('T')[1].substring(0, 5) : '00:00',
        supplierName: supplier.name,
        supplierId: supplier.id,
        type: isPayment ? 'Payment' : 'Purchase',
        invoiceAmount: isPurchase ? j.amount : 0,
        paymentAmount: isPayment ? j.amount : 0,
        mode: isPayment ? (j.description.includes('Cash') ? 'Cash' : j.description.includes('Bank') ? 'Bank' : j.description.includes('Digital') ? 'Digital' : 'Transfer') : '-',
        reference: j.description || j.referenceId || 'N/A',
      });

      if (j.date.startsWith(currentMonthPrefix)) {
        if (isPayment) thisMonthPayments += j.amount;
        if (isPurchase) thisMonthPurchases += j.amount;
      }
    });

    // Legacy Payments from Shifts
    shifts.forEach(shift => {
      shift.supplierPayments?.forEach(p => {
        if (processedRefIds.has(p.id)) return;
        processedRefIds.add(p.id);
        
        const supplier = suppliers.find(s => s.id === p.supplierId);
        if (!supplier) return;
        
        timeline.push({
          id: p.id,
          date: shift.date,
          time: '00:00',
          supplierName: supplier.name,
          supplierId: supplier.id,
          type: 'Payment',
          invoiceAmount: 0,
          paymentAmount: p.amount,
          mode: p.paymentMode,
          reference: `Legacy Payment (Ref: ${p.reference || 'N/A'})`
        });

        if (shift.date.startsWith(currentMonthPrefix)) {
          thisMonthPayments += p.amount;
        }
      });
    });

    // Legacy Purchases from Stock Txns
    stockTxns.forEach(txn => {
      if (!txn.supplierId) return;
      if (processedRefIds.has(txn.id)) return;
      processedRefIds.add(txn.id);

      const supplier = suppliers.find(s => s.id === txn.supplierId);
      if (!supplier) return;
      
      const totalBill = (txn.amount || 0) + (txn.carriageCost || 0);
      
      timeline.push({
        id: txn.id,
        date: txn.date.split('T')[0],
        time: '00:00',
        supplierName: supplier.name,
        supplierId: supplier.id,
        type: 'Purchase',
        invoiceAmount: totalBill,
        paymentAmount: 0,
        mode: '-',
        reference: `Legacy Invoice: ${txn.invoiceNo || 'N/A'}`
      });

      if (txn.date.startsWith(currentMonthPrefix)) {
        thisMonthPurchases += totalBill;
      }
      
      // If it had a payment right then
      if (txn.amountPaid && txn.amountPaid > 0) {
        timeline.push({
          id: `pay_${txn.id}`,
          date: txn.date.split('T')[0],
          time: '00:01',
          supplierName: supplier.name,
          supplierId: supplier.id,
          type: 'Payment',
          invoiceAmount: 0,
          paymentAmount: txn.amountPaid,
          mode: txn.paymentMode || 'Cash',
          reference: `Payment for Legacy Invoice ${txn.invoiceNo || 'N/A'}`
        });
        if (txn.date.startsWith(currentMonthPrefix)) {
          thisMonthPayments += txn.amountPaid;
        }
      }
    });

    // Sort timeline chronologically (oldest first for balance calc)
    timeline.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Running Balance generation per supplier
    const balances: Record<string, number> = {};
    timeline = timeline.map(entry => {
      const current = balances[entry.supplierId] || 0;
      // Credit (Purchases) increase liability, Debit (Payments) reduce it.
      const newBal = current + entry.invoiceAmount - entry.paymentAmount;
      balances[entry.supplierId] = newBal;
      return { ...entry, runningBalance: newBal };
    });

    // Reverse for UI (newest first)
    timeline.reverse();

    // KPI Calculations
    const totalPayables = suppliers.reduce((sum, s) => sum + (s.balance > 0 ? s.balance : 0), 0);
    const netLiabilityMovement = thisMonthPurchases - thisMonthPayments;
    const paymentEfficiency = thisMonthPurchases > 0 ? (thisMonthPayments / (totalPayables + thisMonthPayments)) * 100 : 0;

    // Largest Creditors
    const largestCreditors = [...suppliers]
      .filter(s => s.balance > 0)
      .sort((a, b) => b.balance - a.balance)
      .slice(0, 5);

    // Filter Timeline for View
    let viewTimeline = timeline;
    if (dateFrom) viewTimeline = viewTimeline.filter(t => t.date >= dateFrom);
    if (dateTo) viewTimeline = viewTimeline.filter(t => t.date <= dateTo);
    if (supplierFilter !== 'all') viewTimeline = viewTimeline.filter(t => t.supplierId === supplierFilter);

    // AI Insights
    const insights = [];
    if (largestCreditors.length > 0) {
      const pct = ((largestCreditors[0].balance / totalPayables) * 100).toFixed(0);
      insights.push(`${largestCreditors[0].name} accounts for ${pct}% of total liabilities.`);
    }
    if (thisMonthPurchases > thisMonthPayments) {
      insights.push(`Liabilities grew this month. Purchases exceeded payments by ${formatCurrency(thisMonthPurchases - thisMonthPayments, settings)}.`);
    } else {
      insights.push(`Strong liquidity management. Debt was reduced by ${formatCurrency(thisMonthPayments - thisMonthPurchases, settings)} this month.`);
    }
    const overdueCount = suppliers.filter(s => s.balance > 1000000).length; // Simulated overdue definition
    if (overdueCount > 0) {
      insights.push(`${overdueCount} suppliers have critical overdue balances exceeding 1M.`);
    }

    // Recommended Actions
    const actions = [];
    if (largestCreditors[0]) {
      actions.push(`Schedule an immediate payment of at least 30% to ${largestCreditors[0].name} to reduce high exposure.`);
    }
    actions.push(`Review stock purchasing terms to negotiate longer credit periods.`);
    if (overdueCount > 0) {
      actions.push(`Resolve critical overdue accounts to prevent supply chain disruption.`);
    }

    return {
      totalPayables,
      thisMonthPayments,
      thisMonthPurchases,
      netLiabilityMovement,
      paymentEfficiency,
      largestCreditors,
      insights,
      actions,
      viewTimeline,
      overdueCount
    };
  }, [journalEntries, suppliers, dateFrom, dateTo, supplierFilter]);

  if (!isOpen) return null;

  return (
    <div className="premium-modal-overlay">
      <div className="bg-slate-50 w-full max-w-full max-w-[1400px] h-[95vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-slate-700/50">
        
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4">
            <div className="p-2 bg-slate-800 rounded-lg">
              <Truck className="h-6 w-6 text-amber-400" />
            </div>
            <div>
              <h2 className="text-xl font-black">Supplier Liability Intelligence</h2>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-xs text-slate-400 font-bold tracking-widest uppercase flex items-center gap-1">
                  Powered by Umar Ali <Zap className="h-3 w-3 text-orange-500 fill-current" />
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 bg-amber-500/20 text-amber-400 rounded-full border border-amber-500/30 flex items-center gap-1">
                  <ShieldCheck className="h-3 w-3" /> Audit Verified
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
            <div className="bg-slate-900 rounded-xl p-4 shadow-sm relative overflow-hidden lg:col-span-2 border border-slate-700">
              <div className="absolute -right-4 -top-4 size-16 bg-white/5 rounded-full blur-xl pointer-events-none"></div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Total Outstanding Payables</p>
              <p className="text-3xl font-black text-amber-400">
                {formatCurrency(stats.totalPayables, settings)}
              </p>
            </div>
            <div className="premium-card p-4 border">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Payments Made (Month)</p>
              <p className="text-xl font-black text-emerald-600">-{formatCurrency(stats.thisMonthPayments, settings)}</p>
            </div>
            <div className="premium-card p-4 border">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">New Purchases (Month)</p>
              <p className="text-xl font-black text-rose-600">+{formatCurrency(stats.thisMonthPurchases, settings)}</p>
            </div>
            <div className="premium-card p-4 border">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Net Liability Movement</p>
              <p className={`text-xl font-black ${stats.netLiabilityMovement <= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                {stats.netLiabilityMovement > 0 ? '+' : ''}{formatCurrency(stats.netLiabilityMovement, settings)}
              </p>
            </div>
            <div className="premium-card p-4 border">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Overdue Suppliers</p>
              <p className={`text-xl font-black ${stats.overdueCount > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                {stats.overdueCount} Accounts
              </p>
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
                  <Zap className="h-4 w-4" /> AI Supplier Insights
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
            </div>

            {/* Middle Column: Top Creditors */}
            <div className="xl:col-span-1 space-y-6">
              <div className="premium-card border overflow-hidden h-full">
                <div className="p-5 border-b border-slate-200 flex justify-between items-center bg-slate-50">
                  <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-amber-500" /> Largest Creditors
                  </h3>
                </div>
                <div className="p-0">
                  {stats.largestCreditors.map((creditor, idx) => (
                    <div key={creditor.id} className="p-4 border-b border-slate-100 last:border-0 hover:bg-slate-50">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="text-sm font-bold text-slate-800">{creditor.name}</p>
                          <p className="text-[10px] text-slate-500 truncate max-w-full max-w-[150px]">IBAN: {creditor.accountNo}</p>
                        </div>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          idx === 0 ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'
                        }`}>
                          {idx === 0 ? 'Highest Risk' : 'High Payables'}
                        </span>
                      </div>
                      <p className="text-lg font-black text-slate-900">{formatCurrency(creditor.balance, settings)}</p>
                    </div>
                  ))}
                  {stats.largestCreditors.length === 0 && (
                    <div className="p-8 text-center text-slate-500 text-sm font-medium">No outstanding payables.</div>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column: Ledger Grid */}
            <div className="xl:col-span-2 flex flex-col space-y-4">
              
              {/* Grid Filters */}
              <div className="premium-card border border-slate-200 p-4 flex flex-wrap ga items-end shrink-0">
                <div className="flex-1 min-w-full max-w-[200px]">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 block">Search Supplier</label>
                  <select 
                    value={supplierFilter} 
                    onChange={e => setSupplierFilter(e.target.value)}
                    className="premium-input text-xs p-2 bg-slate-50 font-semibold"
                  >
                    <option value="all">All Suppliers</option>
                    {suppliers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
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
                  <button className="px-3 py-2.5 sm:py-2 min-h-[48px] sm:min-h-[40px] bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-xs font-bold transition-colors">
                    <FileText className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Grid Data */}
              <div className="premium-card border flex-1 overflow-hidden flex flex-col">
                <div className="flex-1 overflow-auto">
                  <table className="premium-table">
                    <thead className="text-[10px] font-black sticky top-0 z-10 shadow-sm">
                      <tr>
                        <th className="p-3">Date</th>
                        <th className="p-3">Supplier</th>
                        <th className="p-3 text-right text-rose-600">Stock Invoice (Cr)</th>
                        <th className="p-3 text-right text-emerald-600">Payment (Dr)</th>
                        <th className="p-3 text-right text-amber-600">Payable Bal</th>
                        <th className="p-3">Context</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.viewTimeline.map(entry => (
                        <tr key={entry.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                          <td className="p-3 align-top">
                            <p className="font-bold text-slate-800">{entry.date}</p>
                            <p className="text-[10px] text-slate-500">{entry.time}</p>
                          </td>
                          <td className="p-3 align-top">
                            <p className="font-bold text-slate-800">{entry.supplierName}</p>
                            <p className="text-[10px] text-slate-500 truncate max-w-full max-w-[150px]">{entry.reference}</p>
                          </td>
                          <td className="p-3 align-top text-right">
                            {entry.invoiceAmount > 0 ? (
                              <p className="font-bold text-rose-600">+{formatCurrency(entry.invoiceAmount, settings)}</p>
                            ) : '-'}
                          </td>
                          <td className="p-3 align-top text-right">
                            {entry.paymentAmount > 0 ? (
                              <div>
                                <p className="font-bold text-emerald-600">-{formatCurrency(entry.paymentAmount, settings)}</p>
                                <span className="inline-block mt-1 px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded text-[9px] font-bold uppercase">{entry.mode}</span>
                              </div>
                            ) : '-'}
                          </td>
                          <td className="p-3 align-top text-right">
                            <p className={`font-black ${entry.runningBalance > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                              {formatCurrency(entry.runningBalance, settings)}
                            </p>
                          </td>
                          <td className="p-3 align-top">
                            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                              entry.type === 'Purchase' ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'
                            }`}>
                              {entry.type}
                            </span>
                          </td>
                        </tr>
                      ))}
                      {stats.viewTimeline.length === 0 && (
                        <tr>
                          <td colSpan={6} className="p-8 text-center text-slate-500">
                            No ledger transactions found for the selected filters.
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
