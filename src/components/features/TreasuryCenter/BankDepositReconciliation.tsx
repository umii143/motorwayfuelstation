import React, { useMemo } from 'react';
import { Building2, Search, CheckCircle2, AlertTriangle, ArrowRightLeft } from 'lucide-react';

export default function BankDepositReconciliation() {
  const transactions = useMemo(() => {
    return [
      { id: 'TRX-9122', operatorName: 'Ali', claimedAmount: 150000, bankVerifiedAmount: 150000, status: 'matched', date: 'Today, 10:30 AM' },
      { id: 'TRX-9121', operatorName: 'Kamran', claimedAmount: 45000, bankVerifiedAmount: 0, status: 'pending', date: 'Today, 09:15 AM' },
      { id: 'TRX-9105', operatorName: 'Zahid', claimedAmount: 200000, bankVerifiedAmount: 180000, status: 'mismatched', date: 'Yesterday, 11:45 PM' },
    ];
  }, []);

  const formatCurrency = (val: number) => 'Rs. ' + val.toLocaleString('en-PK');

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="premium-card p-6 border-emerald-500/20 bg-emerald-50 dark:bg-emerald-900/10">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-bold text-emerald-700 dark:text-emerald-400">Successfully Matched</h3>
            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
          </div>
          <p className="text-2xl font-black text-emerald-700 dark:text-emerald-400">Rs. 1,250,000</p>
        </div>
        <div className="premium-card p-6 border-amber-500/20 bg-amber-50 dark:bg-amber-900/10">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-bold text-amber-700 dark:text-amber-400">Pending Verification</h3>
            <Search className="w-5 h-5 text-amber-500" />
          </div>
          <p className="text-2xl font-black text-amber-700 dark:text-amber-400">Rs. 45,000</p>
        </div>
        <div className="premium-card p-6 border-rose-500/20 bg-rose-50 dark:bg-rose-900/10">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-bold text-rose-700 dark:text-rose-400">Critical Mismatches</h3>
            <AlertTriangle className="w-5 h-5 text-rose-500" />
          </div>
          <p className="text-2xl font-black text-rose-700 dark:text-rose-400">Rs. 20,000</p>
        </div>
      </div>

      <div className="premium-card overflow-hidden">
        <div className="p-5 border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <ArrowRightLeft className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h3 className="font-bold text-gray-900 dark:text-white">AI Deposit Matcher</h3>
          </div>
          <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-lg shadow-sm">
            Sync Bank Statement
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-800/50 text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-800">
                <th className="px-6 py-4">Transaction Ref</th>
                <th className="px-6 py-4">Operator Claim</th>
                <th className="px-6 py-4">Bank Verification</th>
                <th className="px-6 py-4 text-center">Variance</th>
                <th className="px-6 py-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800/50">
              {transactions.map((trx) => {
                const variance = trx.claimedAmount - trx.bankVerifiedAmount;
                return (
                  <tr key={trx.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="px-6 py-4">
                      <div className="font-bold text-sm text-gray-900 dark:text-white">{trx.id}</div>
                      <div className="text-xs text-gray-500">{trx.date}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-bold text-gray-900 dark:text-white">{formatCurrency(trx.claimedAmount)}</div>
                      <div className="text-xs text-gray-500">By {trx.operatorName}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className={`text-sm font-bold ${trx.bankVerifiedAmount === 0 ? 'text-gray-400' : 'text-gray-900 dark:text-white'}`}>
                        {trx.bankVerifiedAmount === 0 ? 'Awaiting Sync' : formatCurrency(trx.bankVerifiedAmount)}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {trx.status === 'matched' ? (
                        <span className="text-emerald-500 font-bold text-sm">0</span>
                      ) : trx.status === 'mismatched' ? (
                        <span className="text-rose-500 font-bold text-sm">-{formatCurrency(variance)}</span>
                      ) : (
                        <span className="text-amber-500 font-bold text-sm">Pending</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {trx.status === 'matched' && <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 text-xs font-bold"><CheckCircle2 className="w-3.5 h-3.5" /> Matched</span>}
                      {trx.status === 'pending' && <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-600 text-xs font-bold"><Search className="w-3.5 h-3.5" /> Unverified</span>}
                      {trx.status === 'mismatched' && <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/10 text-rose-600 text-xs font-bold"><AlertTriangle className="w-3.5 h-3.5" /> Shortage</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
