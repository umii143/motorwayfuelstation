import React, { useState, useEffect } from 'react';
import { GlobalSettings, FleetTransaction, FleetAccount } from '../../../types';
import { db } from '../../../data/db';
import { Download, Filter, Receipt } from 'lucide-react';
import { ResponsiveTable } from '../../shared/ResponsiveTable';

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
     
    // eslint-disable-next-line react-hooks/set-state-in-effect
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
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="premium-card p-4 border flex flex-col justify-center">
          <span className="text-xs font-bold text-slate-500 uppercase">Total Billed</span>
          <span className="text-2xl font-black font-mono text-rose-600 mt-1">{settings.currency} {totalConsumption.toLocaleString()}</span>
        </div>
        <div className="premium-card p-4 border flex flex-col justify-center">
          <span className="text-xs font-bold text-slate-500 uppercase">Total Recovered</span>
          <span className="text-2xl font-black font-mono text-emerald-600 mt-1">{settings.currency} {totalPayments.toLocaleString()}</span>
        </div>
        <div className="premium-card p-4 border flex flex-col justify-center">
          <span className="text-xs font-bold text-slate-500 uppercase">Net Difference</span>
          <span className={`text-2xl font-black font-mono mt-1 ${totalConsumption - totalPayments > 0 ? 'text-rose-600' : 'text-slate-900'}`}>
            {settings.currency} {(totalConsumption - totalPayments).toLocaleString()}
          </span>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-2">
        <div className="flex flex-row gap-2 w-full flex-1 overflow-x-auto scrollbar-hide">
          <div className="flex items-center gap-1.5 shrink-0">
            <Filter className="h-3.5 w-3.5 text-slate-400" />
            <select 
              value={filterAccount} 
              onChange={(e) => setFilterAccount(e.target.value)}
              className="w-[140px] px-2 py-1.5 bg-theme-card border border-theme-main rounded-lg text-xs focus:outline-none focus:border-orange-500"
            >
              <option value="all">All Accounts</option>
              {accounts.map(acc => (
                <option key={acc.id} value={acc.id}>{acc.companyName}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <input 
              type="date" 
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-[110px] px-2 py-1.5 bg-theme-card border border-theme-main rounded-lg text-xs focus:outline-none focus:border-orange-500"
            />
            <span className="text-slate-400 text-xs">to</span>
            <input 
              type="date" 
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-[110px] px-2 py-1.5 bg-theme-card border border-theme-main rounded-lg text-xs focus:outline-none focus:border-orange-500"
            />
          </div>
        </div>
        <button 
          className="flex items-center gap-1.5 bg-slate-900 dark:bg-slate-800 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-slate-800 transition whitespace-nowrap shrink-0 w-full sm:w-auto justify-center"
        >
          <Download className="h-3.5 w-3.5" />
          Export
        </button>
      </div>

      <div className="bg-theme-card rounded-xl border border-theme-main overflow-hidden shadow-sm">
        <ResponsiveTable
          data={filteredTxns}
          columns={[
            {
              header: 'Date & Time',
              accessor: (txn) => (
                <div className="flex flex-col">
                  <span className="font-bold text-slate-800 dark:text-slate-200 text-[11px]">{new Date(txn.date).toLocaleDateString()}</span>
                  <span className="text-[10px] text-slate-500">{new Date(txn.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                </div>
              ),
              isPrimaryMobile: true
            },
            {
              header: 'Account',
              accessor: (txn) => (
                <span className="font-medium text-[11px] text-slate-700 dark:text-slate-300 truncate block max-w-[120px]">
                  {getAccountName(txn.accountId)}
                </span>
              )
            },
            {
              header: 'Details',
              accessor: (txn) => (
                txn.type === 'consumption' ? (
                  <div className="flex flex-col">
                    <span className="font-bold text-slate-900 dark:text-white text-[11px]">{txn.quantity}L {txn.productId === 'p_pmg' ? 'Petrol' : 'Diesel'}</span>
                    <span className="text-[10px] text-slate-500">Rate: {txn.rate}/L</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5">
                    <Receipt className="h-3.5 w-3.5 text-emerald-500" />
                    <div className="flex flex-col">
                      <span className="font-bold text-slate-900 dark:text-white text-[11px]">Payment</span>
                      <span className="text-[10px] text-slate-500 uppercase">{txn.paymentMode}</span>
                    </div>
                  </div>
                )
              )
            },
            {
              header: 'Debit',
              className: 'text-right',
              accessor: (txn) => (
                <span className="font-mono font-bold text-rose-500 text-[11px]">
                  {txn.type === 'consumption' ? `${settings.currency} ${txn.amount.toLocaleString()}` : '-'}
                </span>
              )
            },
            {
              header: 'Credit',
              className: 'text-right',
              accessor: (txn) => (
                <span className="font-mono font-bold text-emerald-500 text-[11px]">
                  {txn.type === 'payment' ? `${settings.currency} ${txn.amount.toLocaleString()}` : '-'}
                </span>
              )
            }
          ]}
          keyExtractor={(t) => t.id}
          emptyMessage="No transactions found for the selected period."
        />
      </div>
    </div>
  );
}
