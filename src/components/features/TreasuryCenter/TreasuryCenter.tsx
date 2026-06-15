import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '../../ui/Card';
import { Landmark, ArrowRightLeft, UserMinus, Scale, ShieldCheck } from 'lucide-react';
import { useTreasuryStore } from '../../../stores/useTreasuryStore';
import { useAuthStore } from '../../../stores/useAuthStore';
import { useShallow } from 'zustand/react/shallow';
import TreasuryDashboard from './TreasuryDashboard';
import FundTransferForm from './FundTransferForm';
import CashReconciliationForm from './CashReconciliationForm';
import OwnerDrawingsForm from './OwnerDrawingsForm';

export default function TreasuryCenter() {
  const stationId = useAuthStore(state => state.stationId);
  const { loadTreasuryData, cashAccounts, handleAddCashAccount } = useTreasuryStore(useShallow(state => ({
    loadTreasuryData: state.loadTreasuryData,
    cashAccounts: state.cashAccounts,
    handleAddCashAccount: state.handleAddCashAccount
  })));
  const [activeTab, setActiveTab] = useState<'dashboard' | 'transfers' | 'reconciliation' | 'drawings'>('dashboard');

  useEffect(() => {
    if (stationId) {
      loadTreasuryData(stationId);
    }
  }, [stationId, loadTreasuryData]);

  // Seed default cash accounts if none exist
  useEffect(() => {
    if (cashAccounts.length === 0 && stationId) {
      const seedDefaults = async () => {
        await handleAddCashAccount({
          id: `cash_${Date.now()}_main`,
          name: 'Main Safe',
          type: 'main_safe',
          balance: 0,
          createdAt: Date.now(),
          updatedAt: Date.now()
        }, '', stationId);
        
        await handleAddCashAccount({
          id: `cash_${Date.now()}_owner`,
          name: 'Owner Vault',
          type: 'owner_cash',
          balance: 0,
          createdAt: Date.now(),
          updatedAt: Date.now()
        }, '', stationId);
      };
      seedDefaults();
    }
  }, [cashAccounts.length, stationId, handleAddCashAccount]);

  const renderTab = () => {
    switch (activeTab) {
      case 'dashboard':
        return <TreasuryDashboard />;
      case 'transfers':
        return <FundTransferForm />;
      case 'reconciliation':
        return <CashReconciliationForm />;
      case 'drawings':
        return <OwnerDrawingsForm />;
      default:
        return <TreasuryDashboard />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center space-x-3">
          <Landmark className="h-8 w-8 text-blue-600 dark:text-blue-400" />
          <span>Enterprise Treasury Center</span>
        </h1>
      </div>

      <div className="flex overflow-x-auto premium-card dark:bg-gray-800 p-1 border-gray-100 dark:border-gray-700">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`flex-1 flex items-center justify-center space-x-2 py-3 px-4 rounded-md transition-colors ${
            activeTab === 'dashboard' ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 font-medium' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
          }`}
        >
          <ShieldCheck className="h-4 w-4" />
          <span>Dashboard & Overview</span>
        </button>
        <button
          onClick={() => setActiveTab('transfers')}
          className={`flex-1 flex items-center justify-center space-x-2 py-3 px-4 rounded-md transition-colors ${
            activeTab === 'transfers' ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 font-medium' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
          }`}
        >
          <ArrowRightLeft className="h-4 w-4" />
          <span>Fund Transfers</span>
        </button>
        <button
          onClick={() => setActiveTab('reconciliation')}
          className={`flex-1 flex items-center justify-center space-x-2 py-3 px-4 rounded-md transition-colors ${
            activeTab === 'reconciliation' ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 font-medium' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
          }`}
        >
          <Scale className="h-4 w-4" />
          <span>Daily Reconciliation</span>
        </button>
        <button
          onClick={() => setActiveTab('drawings')}
          className={`flex-1 flex items-center justify-center space-x-2 py-3 px-4 rounded-md transition-colors ${
            activeTab === 'drawings' ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 font-medium' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
          }`}
        >
          <UserMinus className="h-4 w-4" />
          <span>Owner Drawings</span>
        </button>
      </div>

      <div className="mt-6">
        {renderTab()}
      </div>
    </div>
  );
}
