import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/Card';
import { Wallet, Landmark, Smartphone, ArrowDownRight, ArrowUpRight, ShieldCheck, Activity } from 'lucide-react';
import { useAuthStore } from '../../../stores/useAuthStore';
import { 
  getConsolidatedPosition, 
  TreasuryPosition, 
  TreasuryAccountType 
} from '../../../services/core/treasuryEngine';
import TreasuryLedgerModal from './TreasuryLedgerModal';

export default function TreasuryDashboard() {
  const { stationId } = useAuthStore();
  const [position, setPosition] = useState<TreasuryPosition | null>(null);
  
  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<{type: TreasuryAccountType, title: string} | null>(null);

  useEffect(() => {
    if (stationId) {
      loadPosition();
      // Auto refresh every 30s
      const interval = setInterval(loadPosition, 30000);
      return () => clearInterval(interval);
    }
  }, [stationId]);

  const loadPosition = async () => {
    try {
      const pos = await getConsolidatedPosition(stationId || 'st_default');
      setPosition(pos);
    } catch (e) {
      console.error('Failed to load treasury position', e);
    }
  };

  const openLedger = (type: TreasuryAccountType, title: string) => {
    setSelectedAccount({ type, title });
    setModalOpen(true);
  };

  const cashInHand = (position?.cashDrawer || 0) + (position?.mainSafe || 0);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        <Card 
          className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-500/20 cursor-pointer hover:shadow-lg transition-all"
          onClick={() => openLedger('main_safe', 'Cash In Hand (Safe)')}
        >
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600 dark:text-green-400">Cash In Hand (Vault)</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                  Rs {cashInHand.toLocaleString()}
                </p>
              </div>
              <div className="p-3 bg-green-500/20 rounded-full">
                <Wallet className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card 
          className="bg-gradient-to-br from-blue-500/10 to-indigo-500/10 border-blue-500/20 cursor-pointer hover:shadow-lg transition-all"
          onClick={() => openLedger('bank', 'Consolidated Bank')}
        >
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600 dark:text-blue-400">Bank Balance</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                  Rs {(position?.bankTotal || 0).toLocaleString()}
                </p>
              </div>
              <div className="p-3 bg-blue-500/20 rounded-full">
                <Landmark className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card 
          className="bg-gradient-to-br from-purple-500/10 to-fuchsia-500/10 border-purple-500/20 cursor-pointer hover:shadow-lg transition-all"
          onClick={() => openLedger('pos_terminal', 'Digital Wallets & POS')}
        >
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-600 dark:text-purple-400">Digital Wallets & POS</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                  Rs {((position?.jazzCash || 0) + (position?.easyPaisa || 0) + (position?.posTerminal || 0)).toLocaleString()}
                </p>
              </div>
              <div className="p-3 bg-purple-500/20 rounded-full">
                <Smartphone className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card 
          className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 border-amber-500/20 cursor-pointer hover:shadow-lg transition-all"
          onClick={() => openLedger('owner_cash', 'Owner Cash')}
        >
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-amber-600 dark:text-amber-400">Owner Cash</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                  Rs {(position?.ownerCash || 0).toLocaleString()}
                </p>
              </div>
              <div className="p-3 bg-amber-500/20 rounded-full">
                <ShieldCheck className="h-6 w-6 text-amber-600 dark:text-amber-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg flex items-center space-x-2">
              <Activity className="h-5 w-5 text-gray-500" />
              <span>Network Position summary</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => openLedger('cash_drawer', 'Shift Cash Drawer')}>
              <div className="flex items-center space-x-3">
                <span className="font-medium text-gray-700 dark:text-gray-300">Shift Drawer (Active)</span>
              </div>
              <span className="font-bold text-gray-900 dark:text-white">
                Rs {(position?.cashDrawer || 0).toLocaleString()}
              </span>
            </div>
            
            <div className="flex justify-between items-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => openLedger('jazzcash', 'JazzCash')}>
              <div className="flex items-center space-x-3">
                <span className="font-medium text-gray-700 dark:text-gray-300">JazzCash Ledger</span>
              </div>
              <span className="font-bold text-gray-900 dark:text-white">
                Rs {(position?.jazzCash || 0).toLocaleString()}
              </span>
            </div>

            <div className="flex justify-between items-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => openLedger('easypaisa', 'EasyPaisa')}>
              <div className="flex items-center space-x-3">
                <span className="font-medium text-gray-700 dark:text-gray-300">EasyPaisa Ledger</span>
              </div>
              <span className="font-bold text-gray-900 dark:text-white">
                Rs {(position?.easyPaisa || 0).toLocaleString()}
              </span>
            </div>
            
            <div className="flex justify-between items-center p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg border border-indigo-100 dark:border-indigo-900/30">
              <div className="flex items-center space-x-3">
                <span className="font-bold text-indigo-900 dark:text-indigo-300">Total Liquid Assets</span>
              </div>
              <span className="font-black text-indigo-700 dark:text-indigo-400 text-lg">
                Rs {(position?.totalLiquid || 0).toLocaleString()}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Treasury Operations Tips</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="p-6 bg-blue-50 dark:bg-blue-900/20 rounded-xl text-blue-800 dark:text-blue-300 border border-blue-100 dark:border-blue-900/30">
              <h4 className="font-bold flex items-center gap-2 mb-2">
                <ShieldCheck className="h-5 w-5" />
                Real-time Enterprise Treasury
              </h4>
              <p className="text-sm mb-4">
                The Treasury Center is now directly connected to the Operational Core. It tracks every transaction mathematically using double-entry ledgers.
              </p>
              <ul className="list-disc pl-5 space-y-2 text-sm">
                <li><strong>Drill-down Analytics:</strong> Click any of the KPI cards above to instantly open the detailed Ledger History for that account.</li>
                <li><strong>No Deletions:</strong> Cash movements cannot be hard-deleted. To fix errors, post an opposite entry via the reconciliation tab.</li>
                <li><strong>Shift Cash:</strong> Shift cash is isolated. When a shift closes, it transfers to the Main Safe.</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Ledger Modal */}
      {selectedAccount && (
        <TreasuryLedgerModal
          stationId={stationId || 'st_default'}
          accountType={selectedAccount.type}
          title={selectedAccount.title}
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
        />
      )}
    </div>
  );
}
