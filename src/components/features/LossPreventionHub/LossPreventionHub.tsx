import React, { useState } from 'react';
import { GlobalSettings } from '../../../types';
import { db } from '../../../data/db';
import LossDashboard from './LossDashboard';
import TankVarianceAnalysis from './TankVarianceAnalysis';
import ShiftExceptions from './ShiftExceptions';
import {
  ShieldAlert,
  LayoutDashboard,
  Droplets,
  Receipt
} from 'lucide-react';

interface LossPreventionHubProps {
  settings: GlobalSettings;
}

export default function LossPreventionHub({ settings }: LossPreventionHubProps) {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'tank_variance' | 'shift_exceptions'>('dashboard');
  const stationId = db.getActiveStationId();

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'tank_variance', label: 'Tank Variance & Shrinkage', icon: Droplets },
    { id: 'shift_exceptions', label: 'Shift Exceptions', icon: Receipt },
  ] as const;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 border-b border-slate-200 pb-4">
        <div>
          <span className="font-mono text-[9px] font-black text-rose-600 uppercase tracking-widest block mb-0.5">
            ENTERPRISE MODULE
          </span>
          <h2 className="font-sans text-2xl font-black tracking-tight text-slate-900 flex items-center gap-2">
            <ShieldAlert className="h-6 w-6 text-rose-600" />
            <span>Loss Prevention & Compliance</span>
          </h2>
          <p className="font-sans text-xs text-slate-500 mt-1">
            Analyze tank variances, investigate cash shortages, detect theft, and maintain audit trails.
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
        {activeTab === 'dashboard' && <LossDashboard settings={settings} stationId={stationId} />}
        {activeTab === 'tank_variance' && <TankVarianceAnalysis settings={settings} stationId={stationId} />}
        {activeTab === 'shift_exceptions' && <ShiftExceptions settings={settings} stationId={stationId} />}
      </div>
    </div>
  );
}
