import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../ui/Card';
import { useTreasuryStore } from '../../../stores/useTreasuryStore';
import { useFinancialStore } from '../../../stores/useFinancialStore';
import { useAuthStore } from '../../../stores/useAuthStore';
import { useShallow } from 'zustand/react/shallow';
import { ArrowRightLeft, AlertCircle, CheckCircle } from 'lucide-react';
import { logger } from '../../../lib/logger';

export default function FundTransferForm() {
  const { cashAccounts, recordTransaction, handleUpdateCashAccount } = useTreasuryStore(useShallow(state => ({
    cashAccounts: state.cashAccounts,
    recordTransaction: state.recordTransaction,
    handleUpdateCashAccount: state.handleUpdateCashAccount
  })));
  const { banks, digitalAccounts, handleUpdateBanks, handleUpdateDigitalAccounts } = useFinancialStore(useShallow(state => ({
    banks: state.banks,
    digitalAccounts: state.digitalAccounts,
    handleUpdateBanks: state.handleUpdateBanks,
    handleUpdateDigitalAccounts: state.handleUpdateDigitalAccounts
  })));
  const { user, orgId, stationId } = useAuthStore(useShallow(state => ({
    user: state.user,
    orgId: state.orgId,
    stationId: state.stationId
  })));

  const [sourceId, setSourceId] = useState('');
  const [destId, setDestId] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  // Unified account list for the dropdowns
  const allAccounts = useMemo(() => {
    return [
      ...cashAccounts.map(a => ({ id: a.id, name: a.name, type: a.type, balance: a.balance })),
      ...banks.map(b => ({ id: b.id, name: b.name, type: 'bank', balance: b.balance })),
      ...digitalAccounts.map(d => ({ id: d.id, name: d.name, type: 'digital', balance: d.balance }))
    ];
  }, [cashAccounts, banks, digitalAccounts]);

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus(null);

    if (sourceId === destId) {
      setStatus({ type: 'error', message: 'Source and Destination accounts cannot be the same.' });
      return;
    }

    const val = parseFloat(amount);
    if (isNaN(val) || val <= 0) {
      setStatus({ type: 'error', message: 'Please enter a valid amount greater than 0.' });
      return;
    }

    const srcAcc = allAccounts.find(a => a.id === sourceId);
    const destAcc = allAccounts.find(a => a.id === destId);

    if (!srcAcc || !destAcc) {
      setStatus({ type: 'error', message: 'Invalid accounts selected.' });
      return;
    }

    if (srcAcc.balance < val) {
      setStatus({ type: 'error', message: `Insufficient funds in ${srcAcc.name}. Available: Rs ${srcAcc.balance}` });
      return;
    }

    try {
      // 1. Deduct from Source
      if (['shift_cash', 'main_safe', 'owner_cash'].includes(srcAcc.type)) {
        const acc = cashAccounts.find(a => a.id === sourceId);
        if (acc) {
          await handleUpdateCashAccount({ ...acc, balance: acc.balance - val }, stationId || '');
        }
      } else if (srcAcc.type === 'bank') {
        const acc = banks.find(a => a.id === sourceId);
        if (acc) {
          const updatedBanks = banks.map(b => b.id === sourceId ? { ...b, balance: b.balance - val } : b);
          await handleUpdateBanks(updatedBanks, orgId, stationId);
        }
      } else if (srcAcc.type === 'digital') {
        const acc = digitalAccounts.find(a => a.id === sourceId);
        if (acc) {
          const updatedDig = digitalAccounts.map(d => d.id === sourceId ? { ...d, balance: d.balance - val } : d);
          await handleUpdateDigitalAccounts(updatedDig, orgId, stationId);
        }
      }

      // 2. Add to Destination
      if (['shift_cash', 'main_safe', 'owner_cash'].includes(destAcc.type)) {
        const acc = cashAccounts.find(a => a.id === destId);
        if (acc) {
          // fetch latest to avoid race condition if both were cash accounts (though handled sequentially here)
          const latestAcc = useTreasuryStore.getState().cashAccounts.find(a => a.id === destId) || acc;
          await handleUpdateCashAccount({ ...latestAcc, balance: latestAcc.balance + val }, stationId || '');
        }
      } else if (destAcc.type === 'bank') {
        // we must fetch fresh state in case source was also a bank
        const currentBanks = useFinancialStore.getState().banks;
        const updatedBanks = currentBanks.map(b => b.id === destId ? { ...b, balance: b.balance + val } : b);
        await handleUpdateBanks(updatedBanks, orgId, stationId);
      } else if (destAcc.type === 'digital') {
        const currentDig = useFinancialStore.getState().digitalAccounts;
        const updatedDig = currentDig.map(d => d.id === destId ? { ...d, balance: d.balance + val } : d);
        await handleUpdateDigitalAccounts(updatedDig, orgId, stationId);
      }

      // 3. Record the central TreasuryTransaction
      await recordTransaction({
        id: `trx_${Date.now()}_${crypto.randomUUID().split('-')[0]}`,
        date: new Date().toISOString(),
        sourceAccountId: sourceId,
         
        sourceAccountType: srcAcc.type as any,
         
        destinationAccountId: destId,
        destinationAccountType: destAcc.type as any,
        amount: val,
        type: 'transfer',
        description: description || `Internal transfer from ${srcAcc.name} to ${destAcc.name}`,
        performedBy: user?.name || 'System',
        status: 'completed'
      }, orgId || '', stationId || '');

      setStatus({ type: 'success', message: 'Funds transferred successfully!' });
       
      setAmount('');
       
      setDescription('');
    } catch (err: unknown) {
      logger.error(err);
      setStatus({ type: 'error', message: err.message || 'An error occurred during transfer.' });
    }
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <div className="flex items-center space-x-2">
          <ArrowRightLeft className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          <CardTitle>Internal Fund Transfer</CardTitle>
        </div>
        <CardDescription>Move money securely between your internal safes, banks, and digital wallets.</CardDescription>
      </CardHeader>
      <CardContent>
        {status && (
          <div className={`p-4 mb-6 rounded-lg flex items-start space-x-3 ${
            status.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'
          }`}>
            {status.type === 'success' ? <CheckCircle className="h-5 w-5 mt-0.5" /> : <AlertCircle className="h-5 w-5 mt-0.5" />}
            <span>{status.message}</span>
          </div>
        )}

        <form onSubmit={handleTransfer} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Source Account</label>
              <select
                required
                className="w-full p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                value={sourceId}
                onChange={e => setSourceId(e.target.value)}
              >
                <option value="">Select Source Account</option>
                {allAccounts.map(a => (
                  <option key={a.id} value={a.id}>
                    {a.name} (Rs {a.balance.toLocaleString()}) - {a.type.replace('_', ' ').toUpperCase()}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Destination Account</label>
              <select
                required
                className="w-full p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                value={destId}
                onChange={e => setDestId(e.target.value)}
              >
                <option value="">Select Destination Account</option>
                {allAccounts.map(a => (
                  <option key={a.id} value={a.id}>
                    {a.name} (Rs {a.balance.toLocaleString()}) - {a.type.replace('_', ' ').toUpperCase()}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Transfer Amount (Rs)</label>
            <input
              type="number"
              required
              min="1"
              step="0.01"
              placeholder="e.g. 50000"
              className="w-full p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white font-mono text-lg"
              value={amount}
              onChange={e => setAmount(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Description / Reference</label>
            <input
              type="text"
              placeholder="e.g. Bank deposit from Main Safe"
              className="w-full p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
              value={description}
              onChange={e => setDescription(e.target.value)}
            />
          </div>

          <div className="pt-4">
            <button
              type="submit"
              className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors focus:ring-4 focus:ring-blue-500/50"
            >
              Execute Transfer
            </button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
