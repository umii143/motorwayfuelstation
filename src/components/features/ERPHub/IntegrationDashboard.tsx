import React from 'react';
import { GlobalSettings } from '../../../types';
import { Activity, CheckCircle2, XCircle, Clock, RefreshCcw } from 'lucide-react';

interface IntegrationDashboardProps {
  settings: GlobalSettings;
  stationId: string;
}

export default function IntegrationDashboard({ settings, stationId }: IntegrationDashboardProps) {
  const integrations = [
    { id: 1, name: 'SAP S/4HANA', type: 'ERP', status: 'connected', lastSync: '2 mins ago', nextSync: 'In 13 mins' },
    { id: 2, name: 'Xero Accounting', type: 'Finance', status: 'connected', lastSync: '1 hour ago', nextSync: 'Tomorrow 00:00' },
    { id: 3, name: 'FleetCor', type: 'Fleet Cards', status: 'error', lastSync: '12 hours ago', nextSync: 'Retrying...' },
    { id: 4, name: 'Custom CRM API', type: 'CRM', status: 'disconnected', lastSync: 'Never', nextSync: 'N/A' },
  ];

  const recentLogs = [
    { id: 1, time: '10:45 AM', level: 'info', message: 'Successfully synced 45 shift records to SAP S/4HANA.' },
    { id: 2, time: '10:30 AM', level: 'info', message: 'Tanker delivery #T-8891 received from Supplier API.' },
    { id: 3, time: '09:15 AM', level: 'error', message: 'FleetCor connection timeout (Error 504).' },
    { id: 4, time: '08:00 AM', level: 'info', message: 'Daily Xero reconciliation report dispatched.' },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-1 lg:grid-cols-3 gap-4">
          {integrations.map(int => (
            <div key={int.id} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md transition">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-bold text-slate-900">{int.name}</h3>
                  <span className="text-xs text-slate-500 uppercase font-bold tracking-wider">{int.type}</span>
                </div>
                {int.status === 'connected' && <CheckCircle2 className="h-5 w-5 text-emerald-500" />}
                {int.status === 'error' && <XCircle className="h-5 w-5 text-rose-500" />}
                {int.status === 'disconnected' && <Clock className="h-5 w-5 text-slate-400" />}
              </div>
              
              <div className="space-y-2 mt-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">Last Sync</span>
                  <span className="font-medium text-slate-800">{int.lastSync}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Next Sync</span>
                  <span className="font-medium text-slate-800">{int.nextSync}</span>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-slate-100 flex gap-2">
                <button className="flex-1 text-center py-2 text-xs font-bold bg-slate-50 text-slate-700 rounded hover:bg-slate-100 transition">
                  Configure
                </button>
                {int.status !== 'disconnected' && (
                  <button className="flex-1 text-center py-2 text-xs font-bold bg-rose-50 text-rose-700 rounded hover:bg-rose-100 transition flex items-center justify-center gap-1">
                    <RefreshCcw className="h-3 w-3" /> Sync Now
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-slate-900 rounded-xl border border-slate-800 p-5 shadow-sm text-slate-300">
        <h3 className="font-bold text-white mb-4 flex items-center gap-2">
          <Activity className="h-4 w-4 text-rose-500" />
          Integration Logs
        </h3>
        <div className="space-y-4">
          {recentLogs.map(log => (
            <div key={log.id} className="text-sm border-l-2 border-slate-700 pl-3 py-1">
              <div className="flex justify-between items-center mb-1">
                <span className={`text-[10px] font-bold uppercase ${log.level === 'error' ? 'text-rose-500' : 'text-emerald-500'}`}>
                  {log.level}
                </span>
                <span className="text-[10px] text-slate-500 font-mono">{log.time}</span>
              </div>
              <p className="text-slate-300 leading-snug">{log.message}</p>
            </div>
          ))}
        </div>
        <button className="w-full mt-6 py-2 border border-slate-700 rounded text-xs font-bold text-slate-400 hover:text-white hover:bg-slate-800 transition">
          View Full Logs
        </button>
      </div>
    </div>
  );
}
