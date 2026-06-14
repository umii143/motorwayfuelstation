import React, { useState, useEffect } from 'react';
import { GlobalSettings, FleetTransaction, FleetAccount } from '../../../types';
import { db } from '../../../data/db';
import { FileSpreadsheet, Download, Filter, Search, Receipt } from 'lucide-react';

interface BillingAndReportsProps {
  settings: GlobalSettings;
  stationId: string;
}

export default function BillingAndReports({ settings, stationId }: BillingAndReportsProps) {
  const [transactions, setTransactions] = useState<FleetTransaction[]>([]);
  const [accounts, setAccounts] = useState<FleetAccount[]>([]);
  const [filterAccount, setFilterAccount] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');

  useEffect(() => {
    setTransactions(db.getFleetTransactions(stationId));
    setAccounts(db.getFleetAccounts(stationId));

    // Set default date range to current month
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    
    setDateFrom(firstDay.toISOString().split('T')[0]);
    setDateTo(lastDay.toISOString().split('T')[0]);
  }, [stationId]);

  const getAccountName = (id: string) => {
    const acc = accounts.find(a => a.id === id);
    return acc ? acc.companyName : 'Unknown Account';
  };

  const filteredTxns = transactions.filter(t => {
    const txnDate = new Date(t.date).toISOString().split('T')[0];
    const matchAccount = filterAccount === 'all' || t.accountId === filterAccount;
    const matchDate = (!dateFrom || txnDate >= dateFrom) && (!dateTo || txnDate <= dateTo);
    return matchAccount && matchDate;
  }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const totalConsumption = filteredTxns.filter(t => t.type === 'consumption').reduce((sum, t) => sum + t.amount, 0);
  const totalPayments = filteredTxns.filter(t => t.type === 'payment').reduce((sum, t) => sum + t.amount, 0);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-center">
          <span className="text-xs font-bold text-slate-500 uppercase">Total Billed</span>
          <span className="text-2xl font-black font-mono text-rose-600 mt-1">{settings.currency} {totalConsumption.toLocaleString()}</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-center">
          <span className="text-xs font-bold text-slate-500 uppercase">Total Recovered</span>
          <span className="text-2xl font-black font-mono text-emerald-600 mt-1">{settings.currency} {totalPayments.toLocaleString()}</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-center">
          <span className="text-xs font-bold text-slate-500 uppercase">Net Difference</span>
          <span className={`text-2xl font-black font-mono mt-1 ${totalConsumption - totalPayments > 0 ? 'text-rose-600' : 'text-slate-900'}`}>
            {settings.currency} {(totalConsumption - totalPayments).toLocaleString()}
          </span>
        </div>
      </div>

      <div className="flex flex-row justify-between items-start items-center gap-4 bg-white p-4 rounded-xl border border-slate-200">
        <div className="flex flex-row gap-4 w-full sm:w-auto flex-1">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-slate-400" />
            <select 
              value={filterAccount} 
              onChange={(e) => setFilterAccount(e.target.value)}
              className="w-full sm:w-64 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="all">All Corporate Accounts</option>
              {accounts.map(acc => (
                <option key={acc.id} value={acc.id}>{acc.companyName}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <input 
              type="date" 
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
            <span className="text-slate-400 text-sm">to</span>
            <input 
              type="date" 
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
        </div>
        <button 
          className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-slate-800 transition whitespace-nowrap"
        >
          <Download className="h-4 w-4" />
          Export Statement
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs text-slate-500 uppercase tracking-wider font-bold">
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Account</th>
                <th className="px-4 py-3">Transaction Details</th>
                <th className="px-4 py-3 text-right">Debit (Consumption)</th>
                <th className="px-4 py-3 text-right">Credit (Payment)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {filteredTxns.map(txn => (
                <tr key={txn.id} className="hover:bg-slate-50/50 transition">
                  <td className="px-4 py-3 text-slate-500">
                    {new Date(txn.date).toLocaleDateString()} <br/>
                    <span className="text-[10px]">{new Date(txn.date).toLocaleTimeString()}</span>
                  </td>
                  <td className="px-4 py-3 font-medium text-slate-700">
                    {getAccountName(txn.accountId)}
                  </td>
                  <td className="px-4 py-3">
                    {txn.type === 'consumption' ? (
                      <div>
                        <div className="font-bold text-slate-900">{txn.quantity} Liters - {txn.productId === 'p_pmg' ? 'Petrol' : 'Diesel'}</div>
                        <div className="text-xs text-slate-500">Rate: {settings.currency} {txn.rate} / L</div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Receipt className="h-4 w-4 text-emerald-500" />
                        <div>
                          <div className="font-bold text-slate-900">Payment Received</div>
                          <div className="text-xs text-slate-500">Mode: {txn.paymentMode?.toUpperCase()} • Ref: {txn.referenceNumber}</div>
                        </div>
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right font-mono font-bold text-rose-600">
                    {txn.type === 'consumption' ? `${settings.currency} ${txn.amount.toLocaleString()}` : '-'}
                  </td>
                  <td className="px-4 py-3 text-right font-mono font-bold text-emerald-600">
                    {txn.type === 'payment' ? `${settings.currency} ${txn.amount.toLocaleString()}` : '-'}
                  </td>
                </tr>
              ))}
              {filteredTxns.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-slate-500 text-sm">
                    No transactions found for the selected period and account.
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
