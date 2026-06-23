import React, { useState } from 'react';
import { GlobalSettings } from '../../../types';
import { db } from '../../../data/db';
import LogisticsDashboard from './LogisticsDashboard';
import TankerScheduling from './TankerScheduling';
import DeliveryVerification from './DeliveryVerification';
import TransitShrinkageTracker from './TransitShrinkageTracker';
import {
  ArrowRightLeft,
  LayoutDashboard,
  CalendarClock,
  ClipboardCheck,
  TrendingDown
} from 'lucide-react';

interface LogisticsHubProps {
  settings: GlobalSettings;
}

export default function LogisticsHub({ settings }: LogisticsHubProps) {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'scheduling' | 'verification' | 'shrinkage'>('dashboard');
  const stationId = db.getActiveStationId();

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'scheduling', label: 'Tanker Scheduling', icon: CalendarClock },
    { id: 'verification', label: 'Delivery Verification', icon: ClipboardCheck },
    { id: 'shrinkage', label: 'Shrinkage Analysis', icon: TrendingDown },
  ] as const;

  return (
    <div className="w-full flex-1 flex flex-col bg-transparent pb-16">
      {/* COMPACT HEADER */}
      <div className="fp-header">
        <div className="flex items-center gap-2">
          <ArrowRightLeft className="w-5 h-5 text-rose-600" />
          <h1 className="text-lg font-black text-slate-800 dark:text-slate-100">
            {settings?.language === 'ur' ? 'لاجسٹکس' : 'Logistics'}
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
              className={`fp-date-tab flex items-center gap-1.5 ${isActive ? 'fp-date-tab--active !text-rose-600 !border-rose-600 bg-rose-50/50' : ''}`}
            >
              <Icon className="h-3.5 w-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      <div className="pt-4">
        {activeTab === 'dashboard' && <LogisticsDashboard settings={settings} stationId={stationId} />}
        {activeTab === 'scheduling' && <TankerScheduling settings={settings} stationId={stationId} />}
        {activeTab === 'verification' && <DeliveryVerification settings={settings} stationId={stationId} />}
        {activeTab === 'shrinkage' && <TransitShrinkageTracker settings={settings} stationId={stationId} />}
      </div>
    </div>
  );
}
