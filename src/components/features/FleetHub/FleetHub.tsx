import React, { useState, useEffect } from 'react';
import { GlobalSettings } from '../../../types';
import { db } from '../../../data/db';
import FleetDashboard from './FleetDashboard';
import AccountsManager from './AccountsManager';
import VehiclesManager from './VehiclesManager';
import DriversManager from './DriversManager';
import BillingAndReports from './BillingAndReports';
import {
  LayoutDashboard,
  Building2,
  CarFront,
  UsersRound,
  FileSpreadsheet
} from 'lucide-react';

interface FleetHubProps {
  settings: GlobalSettings;
}

export default function FleetHub({ settings }: FleetHubProps) {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'accounts' | 'vehicles' | 'drivers' | 'billing'>('dashboard');
  const stationId = db.getActiveStationId();

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'accounts', label: 'Corporate Accounts', icon: Building2 },
    { id: 'vehicles', label: 'Fleet Vehicles', icon: CarFront },
    { id: 'drivers', label: 'Driver Management', icon: UsersRound },
    { id: 'billing', label: 'Billing & Reports', icon: FileSpreadsheet },
  ] as const;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 border-b border-slate-200 pb-4">
        <div>
          <span className="font-mono text-[9px] font-black text-orange-600 uppercase tracking-widest block mb-0.5">
            ENTERPRISE MODULE
          </span>
          <h2 className="font-sans text-2xl font-black tracking-tight text-slate-900 flex items-center gap-2">
            <CarFront className="h-6 w-6 text-orange-600" />
            <span>Fleet Management Hub</span>
          </h2>
          <p className="font-sans text-xs text-slate-500 mt-1">
            Manage corporate fleets, assign RFID tags, monitor consumption, and handle monthly invoicing.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide border-b border-slate-200">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-t-xl font-sans text-xs font-bold whitespace-nowrap transition-all border-b-2 ${
                isActive
                  ? 'border-orange-500 text-orange-600 bg-orange-50/50'
                  : 'border-transparent text-slate-500 hover:bg-slate-50 hover:text-slate-700'
              }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      <div className="pt-4">
        {activeTab === 'dashboard' && <FleetDashboard settings={settings} stationId={stationId} />}
        {activeTab === 'accounts' && <AccountsManager settings={settings} stationId={stationId} />}
        {activeTab === 'vehicles' && <VehiclesManager settings={settings} stationId={stationId} />}
        {activeTab === 'drivers' && <DriversManager settings={settings} stationId={stationId} />}
        {activeTab === 'billing' && <BillingAndReports settings={settings} stationId={stationId} />}
      </div>
    </div>
  );
}
