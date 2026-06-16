import React, { useEffect, useState } from 'react';
import { SyncEngine, MutationQueueItem } from '../../../services/core/SyncEngine';
import { RefreshCw, AlertTriangle, CheckCircle2, WifiOff, Wifi, Clock, Database, ChevronRight, XCircle } from 'lucide-react';
import { motion } from 'motion/react';
import { GlobalSettings } from '../../../types';
import localforage from 'localforage';

export default function SyncCenter({ settings }: { settings: GlobalSettings }) {
  const [status, setStatus] = useState({
    pending: 0,
    failed: 0,
    isOnline: true,
    isProcessing: false,
    queue: [] as MutationQueueItem[]
  });
  const [driftLogs, setDriftLogs] = useState<any[]>([]);

  useEffect(() => {
    const unsubscribe = SyncEngine.subscribe(setStatus);
    loadDriftLogs();
    return () => unsubscribe();
  }, []);

  const loadDriftLogs = async () => {
    const logs = await localforage.getItem<any[]>('fuelpro_integrity_drift_logs') || [];
    setDriftLogs(logs);
  };

  const clearLogs = async () => {
    await localforage.setItem('fuelpro_integrity_drift_logs', []);
    setDriftLogs([]);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Sync Center Dashboard</h2>
          <p className="text-sm text-slate-500">Monitor offline transaction queue and synchronization health.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm font-medium ${
            status.isOnline ? 'bg-green-500/10 text-green-600 border-green-200' : 'bg-red-500/10 text-red-600 border-red-200'
          }`}>
            {status.isOnline ? <Wifi className="h-4 w-4" /> : <WifiOff className="h-4 w-4" />}
            {status.isOnline ? 'System Online' : 'System Offline'}
          </div>
          <button
            onClick={() => SyncEngine.processQueue()}
            disabled={!status.isOnline || status.isProcessing}
            className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 disabled:opacity-50 transition-colors"
          >
            <RefreshCw className={`h-4 w-4 ${status.isProcessing ? 'animate-spin' : ''}`} />
            Force Sync
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="premium-card p-5 border">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <Database className="h-5 w-5" />
            </div>
            <h3 className="font-medium text-slate-700">Total Queue</h3>
          </div>
          <p className="text-3xl font-bold text-slate-900">{status.queue.length}</p>
        </div>
        <div className="premium-card p-5 border">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-yellow-50 text-yellow-600 rounded-lg">
              <Clock className="h-5 w-5" />
            </div>
            <h3 className="font-medium text-slate-700">Pending Sync</h3>
          </div>
          <p className="text-3xl font-bold text-slate-900">{status.pending}</p>
        </div>
        <div className="premium-card p-5 border">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-red-50 text-red-600 rounded-lg">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <h3 className="font-medium text-slate-700">Failed Retries</h3>
          </div>
          <p className="text-3xl font-bold text-slate-900">{status.failed}</p>
        </div>
        <div className="premium-card p-5 border">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-orange-50 text-orange-600 rounded-lg">
              <XCircle className="h-5 w-5" />
            </div>
            <h3 className="font-medium text-slate-700">Integrity Drifts</h3>
          </div>
          <p className="text-3xl font-bold text-slate-900">{driftLogs.length}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="premium-card border overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
            <h3 className="font-semibold text-slate-800">Current Mutation Queue</h3>
          </div>
          <div className="divide-y divide-slate-100 max-h-[400px] overflow-y-auto">
            {status.queue.length === 0 ? (
              <div className="p-8 text-center text-slate-500">
                <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-green-400" />
                <p>All data is synchronized with the cloud.</p>
              </div>
            ) : (
              status.queue.map(item => (
                <div key={item.id} className="p-4 hover:bg-slate-50 transition-colors flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-slate-900 capitalize">{item.entityType}</span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 capitalize">{item.operation}</span>
                      {item.priority === 'critical' && <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-600">Critical</span>}
                    </div>
                    <p className="text-xs text-slate-500">ID: {item.referenceId || item.docId}</p>
                    {item.error && <p className="text-xs text-red-500 mt-1 line-clamp-1">{item.error}</p>}
                  </div>
                  <div className="text-right">
                    <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-md ${
                      item.status === 'pending' ? 'bg-yellow-50 text-yellow-700' :
                      item.status === 'processing' ? 'bg-blue-50 text-blue-700' :
                      'bg-red-50 text-red-700'
                    }`}>
                      {item.status}
                    </span>
                    <p className="text-[10px] text-slate-400 mt-1">Retries: {item.retryCount}/60</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="premium-card border overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
            <h3 className="font-semibold text-slate-800">Integrity Drift Logs</h3>
            {driftLogs.length > 0 && (
              <button onClick={clearLogs} className="text-xs text-red-600 hover:underline">Clear Logs</button>
            )}
          </div>
          <div className="divide-y divide-slate-100 max-h-[400px] overflow-y-auto">
            {driftLogs.length === 0 ? (
              <div className="p-8 text-center text-slate-500">
                <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-green-400" />
                <p>No integrity drifts detected.</p>
              </div>
            ) : (
              driftLogs.map(log => (
                <div key={log.id} className="p-4 hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-2 mb-1">
                    <AlertTriangle className="h-4 w-4 text-red-500" />
                    <span className="text-sm font-medium text-slate-900">Drift on {log.entityType}</span>
                  </div>
                  <p className="text-xs text-slate-500 mb-2">Ref: {log.referenceId}</p>
                  <div className="p-2 bg-red-50 rounded text-xs text-red-700 border border-red-100">
                    {log.error}
                  </div>
                  <p className="text-[10px] text-slate-400 mt-2">Logged: {new Date(log.timestamp).toLocaleString()}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
