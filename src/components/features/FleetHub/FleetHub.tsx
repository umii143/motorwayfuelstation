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
    <div className="w-full flex-1 flex flex-col bg-transparent pb-16">
      {/* COMPACT HEADER */}
      <div className="fp-header">
        <div className="flex items-center gap-2">
          <CarFront className="w-5 h-5 text-orange-600" />
          <h1 className="text-lg font-black text-slate-800 dark:text-slate-100">
            {settings?.language === 'ur' ? 'فلیٹ منیجمنٹ' : 'Fleet Hub'}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          {/* Optional actions */}
        </div>
      </div>

      {/* COMPACT TABS */}
      <div className="fp-date-tabs mb-4 px-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`fp-date-tab flex items-center gap-1.5 ${isActive ? 'fp-date-tab--active' : ''}`}
            >
              <Icon className="h-3.5 w-3.5" />
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
