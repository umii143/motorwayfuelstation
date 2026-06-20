import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../ui/Card';
import { useTreasuryStore } from '../../../stores/useTreasuryStore';
import { useFinancialStore } from '../../../stores/useFinancialStore';
import { useAuthStore } from '../../../stores/useAuthStore';
import { useShallow } from 'zustand/react/shallow';
import { UserMinus, AlertCircle, CheckCircle } from 'lucide-react';

export default function OwnerDrawingsForm() {
  const { cashAccounts, recordOwnerDrawing, handleUpdateCashAccount } = useTreasuryStore(useShallow(state => ({
    cashAccounts: state.cashAccounts,
    recordOwnerDrawing: state.recordOwnerDrawing,
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
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  const allAccounts = useMemo(() => {
    return [
      ...cashAccounts.map(a => ({ id: a.id, name: a.name, type: a.type, balance: a.balance })),
      ...banks.map(b => ({ id: b.id, name: b.name, type: 'bank', balance: b.balance })),
      ...digitalAccounts.map(d => ({ id: d.id, name: d.name, type: 'digital', balance: d.balance }))
    ];
  }, [cashAccounts, banks, digitalAccounts]);

  const handleDrawing = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus(null);

    const val = parseFloat(amount);
    if (isNaN(val) || val <= 0) {
      setStatus({ type: 'error', message: 'Please enter a valid amount greater than 0.' });
      return;
    }

    const srcAcc = allAccounts.find(a => a.id === sourceId);
    if (!srcAcc) {
      setStatus({ type: 'error', message: 'Invalid source account selected.' });
      return;
    }

    if (srcAcc.balance < val) {
      // NOTE: Depending on business rules, drawings might be allowed to put an account negative (e.g. Owner Cash).
      // We will enforce a strict balance check here to prevent accidental overdrafts.
      setStatus({ type: 'error', message: `Insufficient funds in ${srcAcc.name}. Available: Rs ${srcAcc.balance}` });
      return;
    }

    try {
      if (['shift_cash', 'main_safe', 'owner_cash'].includes(srcAcc.type)) {
        await recordOwnerDrawing(sourceId, val, description, user?.name || 'Owner', orgId || '', stationId || '');
      } else {
        // Complex withdrawal from bank/digital using standard transaction logic, but storing in ownerDrawings
        // Instead of duplicating store logic for cross-store, let's process standard handleUpdate and then call recordOwnerDrawing manually.
        
        if (srcAcc.type === 'bank') {
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

        // We temporarily add this logic to store it in Treasury store since it has OwnerDrawing.
        // It requires a fake CashAccount match internally in useTreasuryStore, so we bypass and record via internal logic or simply let it fail if the sourceId is missing from cashAccounts.
        // Wait, useTreasuryStore `recordOwnerDrawing` strictly requires `sourceAcc` from `cashAccounts`.
        // To fix this cleanly without refactoring the entire cross-store, we can just inject a dummy transaction.
        // For local first, we'll expose a robust cross-account drawing method or just require transferring to "Owner Cash" first, then drawing.
        
        // Let's enforce that if they want to draw from Bank, they just transfer to Owner Cash, then withdraw from there?
        // No, let's just make it work.
        
        // Actually, let's enforce that source is just recorded properly in the transaction history and owner drawing table:
        const { recordTransaction } = useTreasuryStore.getState();
        
        const drawingId = `dwg_${Date.now()}_${crypto.randomUUID().split('-')[0]}`;
        
        const drawing = {
          id: drawingId,
          date: new Date().toISOString(),
          amount: val,
          sourceAccountId: sourceId,
          sourceAccountType: srcAcc.type as any,
          description,
          withdrawnBy: user?.name || 'Owner',
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };

        const txn = {
          id: `trx_${Date.now()}_${crypto.randomUUID().split('-')[0]}`,
          date: new Date().toISOString(),
          sourceAccountId: sourceId,
          sourceAccountType: srcAcc.type as any,
          amount: val,
          type: 'withdrawal' as any,
          description: `Owner Drawing: ${description}`,
          performedBy: user?.name || 'Owner',
          referenceId: drawingId,
          status: 'completed' as any,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };

        const { db } = await import('../../../data/db');
        const currentDrawings = db.getOwnerDrawings(stationId || '');
        const currentTxns = db.getTreasuryTransactions(stationId || '');
        
        const newDrawings = [...currentDrawings, drawing as any];
        const newTxns = [...currentTxns, txn as any];
        
        db.saveOwnerDrawings(stationId || '', newDrawings);
        db.saveTreasuryTransactions(stationId || '', newTxns);
        
        useTreasuryStore.setState({
          ownerDrawings: newDrawings,
          treasuryTransactions: newTxns
        });
      }

      setStatus({ type: 'success', message: 'Owner drawing recorded successfully.' });
      setAmount('');
      setDescription('');
    } catch (err: any) {
      console.error(err);
      setStatus({ type: 'error', message: err.message || 'An error occurred while recording the drawing.' });
    }
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <div className="flex items-center space-x-2">
          <UserMinus className="h-6 w-6 text-amber-600 dark:text-amber-400" />
          <CardTitle>Owner Drawings</CardTitle>
        </div>
        <CardDescription>Record owner cash withdrawals. This does not impact operational P&L.</CardDescription>
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

        <form onSubmit={handleDrawing} className="space-y-5">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Withdraw From</label>
            <select
              required
              className="w-full p-2 border border-gray-300 rounded focus:ring-amber-500 focus:border-amber-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
              value={sourceId}
              onChange={e => setSourceId(e.target.value)}
            >
              <option value="">Select Account</option>
              {allAccounts.map(a => (
                <option key={a.id} value={a.id}>
                  {a.name} (Rs {a.balance.toLocaleString()}) - {a.type.replace('_', ' ').toUpperCase()}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Withdrawal Amount (Rs)</label>
            <input
              type="number"
              required
              min="1"
              step="0.01"
              placeholder="e.g. 150000"
              className="w-full p-2 border border-gray-300 rounded focus:ring-amber-500 focus:border-amber-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white font-mono text-lg"
              value={amount}
              onChange={e => setAmount(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Description / Reason</label>
            <input
              type="text"
              required
              placeholder="e.g. Monthly Personal Expenses"
              className="w-full p-2 border border-gray-300 rounded focus:ring-amber-500 focus:border-amber-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
              value={description}
              onChange={e => setDescription(e.target.value)}
            />
          </div>

          <div className="pt-4">
            <button
              type="submit"
              className="w-full py-3 px-4 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg transition-colors focus:ring-4 focus:ring-amber-500/50"
            >
              Record Drawing
            </button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
