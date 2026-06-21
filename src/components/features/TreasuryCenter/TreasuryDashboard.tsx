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
import { DataConfidenceBadge } from '../../ui/DataConfidenceBadge';

export default function TreasuryDashboard() {
  const stationId = useAuthStore((s) => s.stationId);
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
      <div className="fp-kpi-grid-2x2 mb-4">
        
        <div 
          className="fp-kpi-compact kpi-green cursor-pointer relative overflow-hidden group"
          onClick={() => openLedger('main_safe', 'Cash In Hand (Safe)')}
        >
          <div className="fp-kpi-compact__label">Cash In Hand (Vault)</div>
          <div className="fp-kpi-compact__value text-3xl">
            Rs {cashInHand.toLocaleString()}
          </div>
          <div className="absolute top-4 right-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-500 ring-1 ring-inset ring-emerald-500/20 shadow-inner">
            <Wallet className="h-6 w-6" strokeWidth={2.5} />
          </div>
          <DataConfidenceBadge confidence={100} />
        </div>

        <div 
          className="fp-kpi-compact kpi-blue cursor-pointer relative overflow-hidden group"
          onClick={() => openLedger('bank', 'Consolidated Bank')}
        >
          <div className="fp-kpi-compact__label">Bank Balance</div>
          <div className="fp-kpi-compact__value text-3xl">
            Rs {(position?.bankTotal || 0).toLocaleString()}
          </div>
          <div className="absolute top-4 right-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500/15 text-blue-500 ring-1 ring-inset ring-blue-500/20 shadow-inner">
            <Landmark className="h-6 w-6" strokeWidth={2.5} />
          </div>
          <DataConfidenceBadge confidence={100} />
        </div>

        <div 
          className="fp-kpi-compact kpi-purple cursor-pointer relative overflow-hidden group"
          onClick={() => openLedger('pos_terminal', 'Digital Wallets & POS')}
        >
          <div className="fp-kpi-compact__label">Digital Wallets & POS</div>
          <div className="fp-kpi-compact__value text-3xl">
            Rs {((position?.jazzCash || 0) + (position?.easyPaisa || 0) + (position?.posTerminal || 0)).toLocaleString()}
          </div>
          <div className="absolute top-4 right-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-500/15 text-purple-500 ring-1 ring-inset ring-purple-500/20 shadow-inner">
            <Smartphone className="h-6 w-6" strokeWidth={2.5} />
          </div>
          <DataConfidenceBadge confidence={100} />
        </div>

        <div 
          className="fp-kpi-compact kpi-orange cursor-pointer relative overflow-hidden group"
          onClick={() => openLedger('owner_cash', 'Owner Cash')}
        >
          <div className="fp-kpi-compact__label">Owner Cash</div>
          <div className="fp-kpi-compact__value text-3xl">
            Rs {(position?.ownerCash || 0).toLocaleString()}
          </div>
          <div className="absolute top-4 right-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-500/15 text-orange-500 ring-1 ring-inset ring-orange-500/20 shadow-inner">
            <ShieldCheck className="h-6 w-6" strokeWidth={2.5} />
          </div>
          <DataConfidenceBadge confidence={100} />
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
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
