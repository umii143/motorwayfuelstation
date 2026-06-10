import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/Card';
import { useTreasuryStore } from '../../../stores/useTreasuryStore';
import { useFinancialStore } from '../../../stores/useFinancialStore';
import { Wallet, Landmark, Smartphone, ArrowDownRight, ArrowUpRight, ShieldCheck, Activity } from 'lucide-react';

export default function TreasuryDashboard() {
  const { cashAccounts, treasuryTransactions, ownerDrawings } = useTreasuryStore();
  const { banks, digitalAccounts } = useFinancialStore();

  const metrics = useMemo(() => {
    const cashInHand = cashAccounts
      .filter(a => a.type === 'shift_cash' || a.type === 'main_safe')
      .reduce((sum, a) => sum + a.balance, 0);

    const ownerCash = cashAccounts
      .filter(a => a.type === 'owner_cash')
      .reduce((sum, a) => sum + a.balance, 0);

    const bankBalance = banks.reduce((sum, b) => sum + b.balance, 0);
    const digitalBalance = digitalAccounts.reduce((sum, d) => sum + d.balance, 0);

    const todayStr = new Date().toISOString().split('T')[0];
    
    const todaysDeposits = treasuryTransactions
      .filter(t => t.type === 'deposit' && t.date.startsWith(todayStr))
      .reduce((sum, t) => sum + t.amount, 0);

    const todaysWithdrawals = treasuryTransactions
      .filter(t => (t.type === 'withdrawal' || t.type === 'transfer') && t.date.startsWith(todayStr))
      .reduce((sum, t) => sum + t.amount, 0);

    const thisMonthDrawings = ownerDrawings
      .filter(d => d.date.startsWith(todayStr.slice(0, 7)))
      .reduce((sum, d) => sum + d.amount, 0);

    return {
      cashInHand,
      ownerCash,
      bankBalance,
      digitalBalance,
      todaysDeposits,
      todaysWithdrawals,
      thisMonthDrawings
    };
  }, [cashAccounts, banks, digitalAccounts, treasuryTransactions, ownerDrawings]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-500/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600 dark:text-green-400">Cash In Hand (Vault + Shifts)</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">Rs {metrics.cashInHand.toLocaleString()}</p>
              </div>
              <div className="p-3 bg-green-500/20 rounded-full">
                <Wallet className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-500/10 to-indigo-500/10 border-blue-500/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600 dark:text-blue-400">Bank Balance</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">Rs {metrics.bankBalance.toLocaleString()}</p>
              </div>
              <div className="p-3 bg-blue-500/20 rounded-full">
                <Landmark className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500/10 to-fuchsia-500/10 border-purple-500/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-600 dark:text-purple-400">Digital Wallets</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">Rs {metrics.digitalBalance.toLocaleString()}</p>
              </div>
              <div className="p-3 bg-purple-500/20 rounded-full">
                <Smartphone className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 border-amber-500/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-amber-600 dark:text-amber-400">Owner Cash</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">Rs {metrics.ownerCash.toLocaleString()}</p>
              </div>
              <div className="p-3 bg-amber-500/20 rounded-full">
                <ShieldCheck className="h-6 w-6 text-amber-600 dark:text-amber-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center space-x-2">
              <Activity className="h-5 w-5 text-gray-500" />
              <span>Today's Cash Flow</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-full">
                  <ArrowDownRight className="h-4 w-4 text-green-600 dark:text-green-400" />
                </div>
                <span className="font-medium text-gray-700 dark:text-gray-300">Deposits / In</span>
              </div>
              <span className="font-bold text-green-600 dark:text-green-400">
                + Rs {metrics.todaysDeposits.toLocaleString()}
              </span>
            </div>
            
            <div className="flex justify-between items-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-full">
                  <ArrowUpRight className="h-4 w-4 text-red-600 dark:text-red-400" />
                </div>
                <span className="font-medium text-gray-700 dark:text-gray-300">Withdrawals / Out</span>
              </div>
              <span className="font-bold text-red-600 dark:text-red-400">
                - Rs {metrics.todaysWithdrawals.toLocaleString()}
              </span>
            </div>

            <div className="flex justify-between items-center p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-100 dark:border-amber-900/30">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-amber-100 dark:bg-amber-900/50 rounded-full">
                  <ShieldCheck className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                </div>
                <span className="font-medium text-amber-900 dark:text-amber-300">Owner Drawings (Month)</span>
              </div>
              <span className="font-bold text-amber-600 dark:text-amber-400">
                Rs {metrics.thisMonthDrawings.toLocaleString()}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Recent Treasury Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            {treasuryTransactions.length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                No recent treasury transactions found.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-gray-500 uppercase bg-gray-50 dark:bg-gray-800 dark:text-gray-400">
                    <tr>
                      <th className="px-4 py-3">Date</th>
                      <th className="px-4 py-3">Type</th>
                      <th className="px-4 py-3">Description</th>
                      <th className="px-4 py-3 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {treasuryTransactions.slice(-5).reverse().map(txn => (
                      <tr key={txn.id} className="border-b dark:border-gray-700">
                        <td className="px-4 py-3">{new Date(txn.date).toLocaleString()}</td>
                        <td className="px-4 py-3 capitalize">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            txn.type === 'deposit' || txn.type === 'income' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                            txn.type === 'transfer' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' :
                            'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                          }`}>
                            {txn.type}
                          </span>
                        </td>
                        <td className="px-4 py-3">{txn.description}</td>
                        <td className="px-4 py-3 text-right font-medium">
                          Rs {txn.amount.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
