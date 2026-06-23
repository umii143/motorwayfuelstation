import React, { useState } from 'react';
import { GlobalSettings } from '../../../types';
import { db } from '../../../data/db';
import MaintenanceDashboard from './MaintenanceDashboard';
import AssetRegister from './AssetRegister';
import ServiceSchedules from './ServiceSchedules';
import {
  Wrench,
  LayoutDashboard,
  ServerCog,
  CalendarCheck
} from 'lucide-react';

interface MaintenanceHubProps {
  settings: GlobalSettings;
}

export default function MaintenanceHub({ settings }: MaintenanceHubProps) {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'assets' | 'schedules'>('dashboard');
  const stationId = db.getActiveStationId();

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'assets', label: 'Asset Register', icon: ServerCog },
    { id: 'schedules', label: 'Service Schedules', icon: CalendarCheck },
  ] as const;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 border-b border-slate-200 pb-4">
        <div>
          <span className="font-mono text-[9px] font-black text-rose-600 uppercase tracking-widest block mb-0.5">
            ENTERPRISE MODULE
          </span>
          <h2 className="font-sans text-2xl font-black tracking-tight text-slate-900 flex items-center gap-2">
            <Wrench className="h-6 w-6 text-rose-600" />
            <span>Maintenance & Asset Management</span>
          </h2>
          <p className="font-sans text-xs text-slate-500 mt-1">
            Track hardware assets (Pumps, Generators, Compressors), monitor warranties, and schedule preventive maintenance.
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
               
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-t-xl font-sans text-xs font-bold whitespace-nowrap transition-all border-b-2 ${
                isActive
                  ? 'border-rose-500 text-rose-600 bg-rose-50/50'
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
        {activeTab === 'dashboard' && <MaintenanceDashboard settings={settings} stationId={stationId} />}
        {activeTab === 'assets' && <AssetRegister settings={settings} stationId={stationId} />}
        {activeTab === 'schedules' && <ServiceSchedules settings={settings} stationId={stationId} />}
      </div>
    </div>
  );
}
