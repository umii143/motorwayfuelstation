import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../ui/Card';
import { useTreasuryStore } from '../../../stores/useTreasuryStore';
import { useAuthStore } from '../../../stores/useAuthStore';
import { useShallow } from 'zustand/react/shallow';
import { Scale, AlertCircle, CheckCircle, Calculator } from 'lucide-react';

export default function CashReconciliationForm() {
  const { cashAccounts, recordReconciliation } = useTreasuryStore(useShallow(state => ({
    cashAccounts: state.cashAccounts,
    recordReconciliation: state.recordReconciliation
  })));
  const { user, orgId, stationId } = useAuthStore(useShallow(state => ({
    user: state.user,
    orgId: state.orgId,
    stationId: state.stationId
  })));

  const [accountId, setAccountId] = useState('');
  const [physicalCash, setPhysicalCash] = useState('');
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  const selectedAccount = cashAccounts.find(a => a.id === accountId);
  
  const expectedCash = selectedAccount ? selectedAccount.balance : 0;
  const physical = parseFloat(physicalCash) || 0;
  const variance = physical - expectedCash;

  const handleReconcile = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus(null);

    if (!selectedAccount) {
      setStatus({ type: 'error', message: 'Please select an account to reconcile.' });
      return;
    }

    if (isNaN(physical) || physical < 0) {
      setStatus({ type: 'error', message: 'Physical cash cannot be negative or invalid.' });
      return;
    }

    try {
      await recordReconciliation(
        selectedAccount.id,
        expectedCash,
        physical,
        notes || (variance === 0 ? 'Matched Perfectly' : 'Routine Reconciliation'),
        user?.name || 'System',
        undefined, // no shift ID explicitly tied here unless we link it
        orgId || '',
        stationId || ''
      );

      setStatus({ type: 'success', message: 'Reconciliation recorded successfully.' });
      setPhysicalCash('');
      setNotes('');
     
     
     
    } catch (err: any) {
      // eslint-disable-next-line no-console
      console.error(err);
      setStatus({ type: 'error', message: err.message || 'Error recording reconciliation.' });
    }
  };

  return (
    <Card className="max-w-3xl mx-auto">
      <CardHeader>
        <div className="flex items-center space-x-2">
          <Scale className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
          <CardTitle>Daily Cash Reconciliation</CardTitle>
        </div>
        <CardDescription>
          Compare System Expected Cash vs Physical Count to track Variance. 
          Formula: <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">Expected Cash = Opening + Inflows - Outflows</code>
        </CardDescription>
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

        <form onSubmit={handleReconcile} className="space-y-6">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Target Cash Account</label>
            <select
              required
              className="w-full p-2 border border-gray-300 rounded focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
              value={accountId}
              onChange={e => setAccountId(e.target.value)}
            >
              <option value="">Select Cash Account (Main Safe, Shift Cash, etc.)</option>
              {cashAccounts.map(a => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </div>

          {selectedAccount && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                <p className="text-sm text-gray-500 dark:text-gray-400">Expected (System)</p>
                <p className="text-2xl font-bold font-mono text-gray-900 dark:text-white mt-1">
                  Rs {expectedCash.toLocaleString()}
                </p>
              </div>

              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-900/50">
                <p className="text-sm text-blue-600 dark:text-blue-400">Physical (Actual)</p>
                <input
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  placeholder="Count..."
                  className="w-full mt-2 bg-transparent text-2xl font-bold font-mono text-blue-900 dark:text-blue-100 border-b-2 border-blue-300 dark:border-blue-700 focus:outline-none focus:border-blue-600 dark:focus:border-blue-400 placeholder-blue-300/50 dark:placeholder-blue-700/50"
                  value={physicalCash}
                  onChange={e => setPhysicalCash(e.target.value)}
                />
              </div>

              <div className={`p-4 rounded-lg border ${
                physicalCash === '' ? 'bg-gray-50 border-gray-200 dark:bg-gray-800 dark:border-gray-700' :
                variance === 0 ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-900/50' :
                'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-900/50'
              }`}>
                <p className={`text-sm ${
                  physicalCash === '' ? 'text-gray-500' :
                  variance === 0 ? 'text-green-600 dark:text-green-400' :
                  'text-red-600 dark:text-red-400'
                }`}>Variance (Alert)</p>
                <p className={`text-2xl font-bold font-mono mt-1 ${
                  physicalCash === '' ? 'text-gray-900 dark:text-white' :
                  variance === 0 ? 'text-green-700 dark:text-green-300' :
                  'text-red-700 dark:text-red-300'
                }`}>
                  {variance > 0 ? '+' : ''}{variance.toLocaleString()}
                </p>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Reconciliation Notes</label>
            <input
              type="text"
              placeholder="e.g. Found Rs 500 missing from drawer due to change issue"
              className="w-full p-2 border border-gray-300 rounded focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
              value={notes}
              onChange={e => setNotes(e.target.value)}
            />
          </div>

          <div className="pt-4">
            <button
              type="submit"
              className="w-full py-3 px-4 premium-button hover:bg-indigo-700 font-bold transition-colors focus:ring-4 focus:ring-indigo-500/50 flex justify-center items-center space-x-2"
            >
              <Calculator className="h-5 w-5" />
              <span>Log Reconciliation & Lock Variance</span>
            </button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
