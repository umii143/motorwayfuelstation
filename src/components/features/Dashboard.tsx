/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Staff,
  Product,
  Nozzle,
  Customer,
  Supplier,
  Shift,
  BankAccount,
  GlobalSettings,
  LubePosSale,
  RateHistoryEntry,
  Tank,
  StockTransaction
} from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { isLubeBusinessStation } from '../../lib/businessScope';
import LubeDashboard from './LubeDashboard';
import FuelDashboard from './FuelDashboard';
import { DashboardShell } from '../widgets/DashboardShell';




interface DashboardProps {
  settings: GlobalSettings;
  activeStationId: string;
  shifts: Shift[];
  products: Product[];
  customers: Customer[];
  suppliers: Supplier[];
  banks: BankAccount[];
  staff: Staff[];
  nozzles: Nozzle[];
  tanks: Tank[];
  lubePosSales: LubePosSale[];
  onNavigate: (view: string) => void;
  onStartShiftQuick?: () => void;
  rateHistory?: RateHistoryEntry[];
  stockTxns?: StockTransaction[];
}

// Dynamic greeting based on time of day

// Relative time helper

export default React.memo(function Dashboard({
  settings,
  activeStationId,
  shifts,
  products,
  customers,
  suppliers,
  banks,
  nozzles,
  tanks,
  lubePosSales,
  onNavigate,
  onStartShiftQuick,
  stockTxns = []
}: DashboardProps) {
  const isLube = isLubeBusinessStation(activeStationId);
  const { user } = useAuth();

  // Logged-in user name
  const userName = user?.email?.split('@')[0]
    ?.replace(/[._]/g, ' ')
    ?.replace(/\b\w/g, c => c.toUpperCase()) || 'User';

  const [useV2, setUseV2] = useState(() => localStorage.getItem('useV2Dashboard') === 'true');

  const toggleV2 = () => {
    const nextState = !useV2;
    setUseV2(nextState);
    localStorage.setItem('useV2Dashboard', String(nextState));
  };

  if (isLube) {
    return (
      <LubeDashboard 
        settings={settings}
        activeStationId={activeStationId}
        lubePosSales={lubePosSales}
        products={products}
        customers={customers}
        suppliers={suppliers}
        banks={banks}
        stockTxns={stockTxns || []}
        onNavigate={onNavigate}
        onToggleV2={toggleV2}
      />
    );
  }

  if (useV2) {
    return (
      <div className="relative">
        <div className="absolute top-4 right-4 z-50">
          <button onClick={toggleV2} className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs font-bold border border-slate-700 hover:bg-slate-700">
            Switch back to V1 Dashboard
          </button>
        </div>
        <DashboardShell onStartShiftQuick={onStartShiftQuick} onNavigate={onNavigate} />
      </div>
    );
  }

  return (
    <div className="relative">
      <FuelDashboard
        settings={settings}
        activeStationId={activeStationId}
        shifts={shifts}
        products={products}
        customers={customers}
        suppliers={suppliers}
        banks={banks}
        nozzles={nozzles}
        tanks={tanks}
        stockTxns={stockTxns}
        onNavigate={onNavigate}
        onStartShiftQuick={onStartShiftQuick}
        userName={userName}
        onToggleV2={toggleV2}
      />
    </div>
  );
});
