import React, { useState, useEffect } from 'react';
import { GlobalSettings, Asset, MaintenanceRecord } from '../../../types';
import { db } from '../../../data/db';
import { Wrench, ServerCog, AlertTriangle, CalendarCheck, TrendingUp } from 'lucide-react';

interface MaintenanceDashboardProps {
  settings: GlobalSettings;
  stationId: string;
}

export default function MaintenanceDashboard({ settings, stationId }: MaintenanceDashboardProps) {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [records, setRecords] = useState<MaintenanceRecord[]>([]);

  useEffect(() => {
    setAssets(db.getAssets(stationId));
    setRecords(db.getMaintenanceRecords(stationId));
  }, [stationId]);

  const underMaintenance = assets.filter(a => a.status === 'under_maintenance');
  const activeSchedules = records.filter(r => r.status === 'scheduled' || r.status === 'in_progress');
  
  const currentMonthRecords = records.filter(r => {
    if (!r.completedDate) return false;
    const dt = new Date(r.completedDate);
    const now = new Date();
    return dt.getMonth() === now.getMonth() && dt.getFullYear() === now.getFullYear();
  });

  const mtdMaintenanceCost = currentMonthRecords.reduce((sum, r) => sum + r.cost, 0);

  const isWarrantyExpiringSoon = (expiryDate?: string) => {
    if (!expiryDate) return false;
    const daysLeft = (new Date(expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
    return daysLeft > 0 && daysLeft <= 30;
  };

  const expiringAssets = assets.filter(a => isWarrantyExpiringSoon(a.warrantyExpiryDate));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="premium-card p-5 border relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-amber-50 rounded-full group-hover:scale-110 transition-transform"></div>
          <div className="relative">
            <div className="flex justify-between items-start mb-2">
              <span className="text-xs font-bold text-amber-800 uppercase">Under Maintenance</span>
              <div className="p-2 bg-amber-100 text-amber-600 rounded-lg">
                <Wrench className="h-4 w-4" />
              </div>
            </div>
            <div className="text-2xl font-black font-mono text-amber-900">{underMaintenance.length}</div>
            <div className="text-xs text-amber-700 mt-2 font-medium">Assets currently down</div>
          </div>
        </div>

        <div className="premium-card p-5 border relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-blue-50 rounded-full group-hover:scale-110 transition-transform"></div>
          <div className="relative">
            <div className="flex justify-between items-start mb-2">
              <span className="text-xs font-bold text-slate-500 uppercase">Active Schedules</span>
              <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                <CalendarCheck className="h-4 w-4" />
              </div>
            </div>
            <div className="text-2xl font-black font-mono text-slate-900">{activeSchedules.length}</div>
            <div className="text-xs text-slate-500 mt-2 font-medium">Pending or in progress</div>
          </div>
        </div>

        <div className="premium-card p-5 border relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-rose-50 rounded-full group-hover:scale-110 transition-transform"></div>
          <div className="relative">
            <div className="flex justify-between items-start mb-2">
              <span className="text-xs font-bold text-slate-500 uppercase">MTD Repair Costs</span>
              <div className="p-2 bg-rose-100 text-rose-600 rounded-lg">
                <TrendingUp className="h-4 w-4" />
              </div>
            </div>
            <div className="text-2xl font-black font-mono text-rose-600">{settings.currency} {mtdMaintenanceCost.toLocaleString()}</div>
            <div className="text-xs text-slate-500 mt-2 font-medium">Total spent this month</div>
          </div>
        </div>

        <div className="premium-card p-5 border relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-indigo-50 rounded-full group-hover:scale-110 transition-transform"></div>
          <div className="relative">
            <div className="flex justify-between items-start mb-2">
              <span className="text-xs font-bold text-slate-500 uppercase">Total Assets</span>
              <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
                <ServerCog className="h-4 w-4" />
              </div>
            </div>
            <div className="text-2xl font-black font-mono text-slate-900">{assets.length}</div>
            <div className="text-xs text-slate-500 mt-2 font-medium">Registered hardware</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Warranty Alerts */}
        <div className="premium-card border overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              Warranty Expiring Soon (30 Days)
            </h3>
            <span className="text-xs font-bold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
              {expiringAssets.length} Assets
            </span>
          </div>
          <div className="divide-y divide-slate-100">
            {expiringAssets.map(asset => (
              <div key={asset.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition">
                <div>
                  <div className="font-bold text-slate-900 text-sm">{asset.name}</div>
                  <div className="text-xs text-slate-500 mt-0.5 uppercase">{asset.type}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-bold text-amber-600">Expires: {asset.warrantyExpiryDate ? new Date(asset.warrantyExpiryDate).toLocaleDateString() : ''}</div>
                </div>
              </div>
            ))}
            {expiringAssets.length === 0 && (
              <div className="p-8 text-center text-sm text-slate-500 flex flex-col items-center">
                <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center mb-3">
                  <ServerCog className="h-6 w-6 text-emerald-500" />
                </div>
                No warranties expiring in the next 30 days.
              </div>
            )}
          </div>
        </div>

        {/* Upcoming Services */}
        <div className="premium-card border overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
              <CalendarCheck className="h-4 w-4 text-blue-500" />
              Upcoming Scheduled Services
            </h3>
          </div>
          <div className="divide-y divide-slate-100">
            {activeSchedules.slice(0, 5).map(record => {
              const asset = assets.find(a => a.id === record.assetId);
              return (
                <div key={record.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition">
                  <div>
                    <div className="font-bold text-slate-900 text-sm">{asset?.name || 'Unknown Asset'}</div>
                    <div className="text-xs text-slate-500 mt-0.5 line-clamp-1">{record.description}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono text-sm font-bold text-slate-700">{new Date(record.scheduledDate).toLocaleDateString()}</div>
                    <div className="text-[10px] font-bold uppercase mt-1">
                      <span className={`px-2 py-0.5 rounded ${record.status === 'in_progress' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>
                        {record.status.replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
            {activeSchedules.length === 0 && (
              <div className="p-8 text-center text-sm text-slate-500">
                No active maintenance schedules pending.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
