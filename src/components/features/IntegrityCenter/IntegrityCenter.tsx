import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ShieldCheck, Activity, AlertTriangle, CheckCircle2, XCircle,
  RefreshCw, ChevronRight, Clock, Zap, Lock, TrendingUp, Info,
  Eye, FileText, CheckSquare, ArrowRight, Building, Users, Package,
  Landmark, Smartphone, DollarSign, BarChart3, X
} from 'lucide-react';
import {
  getAllDriftLogs,
  resolveDriftLog,
  getShadowStats,
  calculateIntegrityScore,
  calculateMigrationConfidence,
  isMigrationAuthorized,
  getUnresolvedCriticalCount,
  getOpenDriftCount,
  addDriftLog,
  IntegrityDriftLog,
  ShadowModeStats,
} from '../../../services/core/integrityDriftLog';
import { getAllCustomerBalances, getAllSupplierBalances } from '../../../services/core/ledgerEngine';
import { useFinancialStore } from '../../../stores/useFinancialStore';
import { useCustomerStore } from '../../../stores/useCustomerStore';
import { useSupplierStore } from '../../../stores/useSupplierStore';
import { useAuthStore } from '../../../stores/useAuthStore';

interface IntegrityCenterProps {
  stationId: string;
  onNavigate?: (view: string) => void;
}

const SEVERITY_CONFIG = {
  CRITICAL: { color: 'text-rose-600', bg: 'bg-rose-50', border: 'border-rose-200', badge: 'bg-rose-600 text-white', icon: XCircle },
  WARNING: { color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200', badge: 'bg-amber-500 text-white', icon: AlertTriangle },
  INFO: { color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200', badge: 'bg-blue-500 text-white', icon: Info },
};

const MODULE_CONFIG: Record<string, { label: string; icon: React.ElementType; unit: string }> = {
  customer: { label: 'Customer Ledger', icon: Users, unit: 'PKR' },
  supplier: { label: 'Supplier Ledger', icon: Building, unit: 'PKR' },
  bank: { label: 'Bank Account', icon: Landmark, unit: 'PKR' },
  cash: { label: 'Cash Drawer', icon: DollarSign, unit: 'PKR' },
  digital_wallet: { label: 'Digital Wallet', icon: Smartphone, unit: 'PKR' },
  inventory: { label: 'Inventory', icon: Package, unit: 'Liters' },
  treasury: { label: 'Treasury', icon: BarChart3, unit: 'PKR' },
  shift_variance: { label: 'Shift Variance', icon: Activity, unit: 'PKR' },
};

export default function IntegrityCenter({ stationId, onNavigate }: IntegrityCenterProps) {
  const [driftLogs, setDriftLogs] = useState<IntegrityDriftLog[]>([]);
  const [stats, setStats] = useState<ShadowModeStats | null>(null);
  const [integrityScore, setIntegrityScore] = useState(100);
  const [migrationConfidence, setMigrationConfidence] = useState(0);
  const [migrationAuthorized, setMigrationAuthorized] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'all' | 'unresolved' | 'critical'>('unresolved');
  const [selectedLog, setSelectedLog] = useState<IntegrityDriftLog | null>(null);
  const [resolveNotes, setResolveNotes] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const user = useAuthStore.getState().user;

  const refresh = useCallback(async () => {
    setIsRefreshing(true);
    const logs = getAllDriftLogs(stationId);
    const s = getShadowStats(stationId);
    const score = calculateIntegrityScore(stationId);
    const confidence = calculateMigrationConfidence(stationId);
    const authorized = isMigrationAuthorized(stationId);
    setDriftLogs(logs);
    setStats(s);
    setIntegrityScore(score);
    setMigrationConfidence(confidence);
    setMigrationAuthorized(authorized);
    setTimeout(() => setIsRefreshing(false), 600);
  }, [stationId]);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 30000); // Auto-refresh every 30s
    return () => clearInterval(interval);
  }, [refresh]);

  const handleResolve = () => {
    if (!selectedLog || !resolveNotes.trim()) return;
    resolveDriftLog(stationId, selectedLog.id, user?.name || 'Owner', resolveNotes.trim());
    setSelectedLog(null);
    setResolveNotes('');
    refresh();
  };

  const filteredLogs = driftLogs.filter(l => {
    if (activeFilter === 'unresolved') return !l.resolved;
    if (activeFilter === 'critical') return !l.resolved && l.severity === 'CRITICAL';
    return true;
  }).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  const unresolvedCritical = getUnresolvedCriticalCount(stationId);
  const openCount = getOpenDriftCount(stationId);

  // Aggregate drift by module
  const driftByModule = driftLogs
    .filter(l => !l.resolved)
    .reduce<Record<string, number>>((acc, l) => {
      acc[l.module] = (acc[l.module] || 0) + l.difference;
      return acc;
    }, {});

  const scoreColor = integrityScore >= 98 ? 'text-emerald-600' : integrityScore >= 90 ? 'text-amber-500' : integrityScore >= 75 ? 'text-orange-500' : 'text-rose-600';
  const scoreStroke = integrityScore >= 98 ? '#10b981' : integrityScore >= 90 ? '#f59e0b' : integrityScore >= 75 ? '#f97316' : '#ef4444';
  const scoreArc = (integrityScore / 100) * 283;

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-6 space-y-6">

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="flex flex-row items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
            <ShieldCheck className="h-7 w-7 text-indigo-600" />
            Enterprise Integrity Center
          </h1>
          <p className="text-sm text-slate-500 mt-1 font-medium">
            Shadow Mode Validation · Trust-Before-Migration · Powered by Umar Ali ⚡
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Shadow Mode Badge */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white rounded-full text-xs font-bold">
            <span className="w-2 h-2 bg-white/70 rounded-full animate-pulse" />
            SHADOW MODE ACTIVE
          </div>
          <button
            onClick={() => {
              addDriftLog(stationId, {
                shiftId: 'simulated_test',
                timestamp: new Date().toISOString(),
                module: 'bank',
                legacyValue: 1500000,
                operationalValue: 1400000,
                difference: 100000,
                severity: 'CRITICAL',
                stationId,
                description: 'SIMULATED DRIFT: Bank "Main HBL" balance mismatch: Legacy PKR 1,500,000 vs EOC PKR 1,400,000',
              });
              refresh();
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 text-rose-700 border border-rose-200 rounded-lg text-xs font-bold hover:bg-rose-100 transition-colors shadow-sm"
          >
            <AlertTriangle className="h-3.5 w-3.5" />
            Simulate Drift
          </button>
          <button
            onClick={refresh}
            disabled={isRefreshing}
            className="flex items-center ga.5 px-3 py-1.5 premium-card border text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin text-indigo-600' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* ── Top KPI Row ──────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-1 lg:grid-cols-3 gap-4">
        {[
          { label: 'Shifts Processed', value: stats?.totalShiftsProcessed ?? 0, icon: Activity, color: 'text-indigo-600', bg: 'bg-indigo-50' },
          { label: 'Validated', value: stats?.validatedShifts ?? 0, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Matched', value: stats?.matchedShifts ?? 0, icon: CheckSquare, color: 'text-teal-600', bg: 'bg-teal-50' },
          { label: 'Mismatched', value: stats?.mismatchedShifts ?? 0, icon: XCircle, color: 'text-rose-600', bg: 'bg-rose-50' },
          { label: 'Open Drift Logs', value: openCount, icon: FileText, color: 'text-amber-600', bg: 'bg-amber-50' },
          { label: 'Critical Issues', value: unresolvedCritical, icon: AlertTriangle, color: unresolvedCritical > 0 ? 'text-rose-600' : 'text-slate-400', bg: unresolvedCritical > 0 ? 'bg-rose-50' : 'bg-slate-50' },
        ].map((kpi, i) => (
          <motion.div
            key={kpi.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="premium-card border border-slate-200"
          >
            <div className={`w-8 h-8 ${kpi.bg} rounded-lg flex items-center justify-center mb-2`}>
              <kpi.icon className={`h-4 w-4 ${kpi.color}`} />
            </div>
            <div className="text-2xl font-black text-slate-900">{kpi.value.toLocaleString()}</div>
            <div className="text-xs font-semibold text-slate-500 mt-0.5">{kpi.label}</div>
          </motion.div>
        ))}
      </div>

      {/* ── Main Body ─────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* LEFT: Integrity Score + Migration Gate */}
        <div className="space-y-4">

          {/* Score Gauge */}
          <div className="premium-card border border-slate-200 text-center">
            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4">System Integrity Score</h3>
            <div className="relative w-44 h-44 mx-auto">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="45" fill="transparent" stroke="#f1f5f9" strokeWidth="8" />
                <circle
                  cx="50" cy="50" r="45"
                  fill="transparent"
                  stroke={scoreStroke}
                  strokeWidth="8"
                  strokeDasharray={`${scoreArc} 283`}
                  strokeLinecap="round"
                  className="transition-all duration-1000 ease-out"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className={`text-5xl font-black ${scoreColor}`}>{integrityScore}</span>
                <span className="text-xs font-bold text-slate-400 mt-1">/ 100</span>
              </div>
            </div>
            <div className="mt-4">
              {integrityScore >= 98 ? (
                <div className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-full text-xs font-bold">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Perfect Synchronization
                </div>
              ) : integrityScore >= 90 ? (
                <div className="inline-flex items-center gap-1.5 bg-amber-50 text-amber-700 px-3 py-1.5 rounded-full text-xs font-bold">
                  <AlertTriangle className="h-3.5 w-3.5" /> Minor Drift
                </div>
              ) : integrityScore >= 75 ? (
                <div className="inline-flex items-center gap-1.5 bg-orange-50 text-orange-700 px-3 py-1.5 rounded-full text-xs font-bold">
                  <AlertTriangle className="h-3.5 w-3.5" /> Requires Investigation
                </div>
              ) : (
                <div className="inline-flex items-center gap-1.5 bg-rose-50 text-rose-700 px-3 py-1.5 rounded-full text-xs font-bold">
                  <XCircle className="h-3.5 w-3.5" /> Migration Blocked
                </div>
              )}
            </div>
            {stats?.lastValidatedAt && (
              <p className="text-[10px] text-slate-400 font-mono mt-3">
                Last validated: {new Date(stats.lastValidatedAt).toLocaleString()}
              </p>
            )}
          </div>

          {/* Migration Confidence + Gate */}
          <div className="premium-card border border-slate-200">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2">
                <Lock className="h-4 w-4 text-indigo-500" />
                Migration Gate
              </h3>
              <span className={`text-xs font-black px-2 py-0.5 rounded-full ${migrationAuthorized ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                {migrationAuthorized ? 'AUTHORIZED' : 'BLOCKED'}
              </span>
            </div>

            <div className="mb-3">
              <div className="flex justify-between text-xs font-semibold text-slate-500 mb-1">
                <span>Migration Confidence</span>
                <span className="font-black text-slate-800">{migrationConfidence.toFixed(1)}%</span>
              </div>
              <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${migrationConfidence >= 99 ? 'bg-emerald-500' : migrationConfidence >= 75 ? 'bg-amber-500' : 'bg-rose-500'}`}
                  style={{ width: `${Math.min(100, migrationConfidence)}%` }}
                />
              </div>
            </div>

            <ul className="space-y-1.5 text-xs">
              {[
                { label: 'Min 50 Shifts Validated', done: (stats?.validatedShifts ?? 0) >= 50, value: `${stats?.validatedShifts ?? 0}/50` },
                { label: 'Integrity Score ≥ 98', done: integrityScore >= 98, value: `${integrityScore}/100` },
                { label: 'Confidence ≥ 99%', done: migrationConfidence >= 99, value: `${migrationConfidence.toFixed(1)}%` },
                { label: 'No Critical Drift', done: unresolvedCritical === 0, value: `${unresolvedCritical} open` },
              ].map((req) => (
                <li key={req.label} className="flex items-center justify-between gap-2 py-1 border-b border-slate-50 last:border-0">
                  <div className="flex items-center gap-1.5">
                    {req.done
                      ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                      : <XCircle className="h-3.5 w-3.5 text-rose-400 shrink-0" />}
                    <span className={req.done ? 'text-slate-600' : 'text-slate-500'}>{req.label}</span>
                  </div>
                  <span className={`font-black ${req.done ? 'text-emerald-600' : 'text-rose-500'}`}>{req.value}</span>
                </li>
              ))}
            </ul>

            {migrationAuthorized && (
              <div className="mt-3 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-bold text-emerald-700 flex items-center gap-2">
                <Zap className="h-4 w-4" />
                Ready for Phase 4 — Dashboard Migration
              </div>
            )}
          </div>
        </div>

        {/* RIGHT: Drift Widgets + Log Table */}
        <div className="lg:col-span-2 space-y-4">

          {/* Drift Widgets */}
          <div className="grid grid-cols-1 sm:grid-cols-2 sm:grid-cols-4 gap-3">
            {(['bank', 'cash', 'customer', 'supplier', 'digital_wallet', 'inventory', 'treasury', 'shift_variance'] as const).map((mod) => {
              const drift = driftByModule[mod] ?? 0;
              const cfg = MODULE_CONFIG[mod];
              const hasDrift = drift > 0;
              const isCritical = (mod === 'bank' || mod === 'cash' || mod === 'digital_wallet' || mod === 'treasury') && hasDrift;
              return (
                <div
                  key={mod}
                  className={`rounded-xl border p-3 text-center transition-all ${
                    isCritical ? 'bg-rose-50 border-rose-200' :
                    hasDrift ? 'bg-amber-50 border-amber-200' :
                    'bg-white border-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-center mb-1">
                    <cfg.icon className={`h-4 w-4 ${isCritical ? 'text-rose-500' : hasDrift ? 'text-amber-500' : 'text-slate-400'}`} />
                  </div>
                  <div className={`text-sm font-black ${isCritical ? 'text-rose-700' : hasDrift ? 'text-amber-700' : 'text-slate-400'}`}>
                    {hasDrift ? `${cfg.unit === 'PKR' ? 'Rs ' : ''}${Math.round(drift).toLocaleString()} ${cfg.unit !== 'PKR' ? cfg.unit : ''}` : '0'}
                  </div>
                  <div className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mt-0.5">{cfg.label}</div>
                  {hasDrift && <div className="text-[9px] mt-1">{isCritical ? '🚨' : '⚠️'}</div>}
                </div>
              );
            })}
          </div>

          {/* Drift Log Table */}
          <div className="premium-card border overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <FileText className="h-4 w-4 text-slate-400" />
                Drift Log
                {openCount > 0 && (
                  <span className="text-xs font-black bg-rose-600 text-white px-2 py-0.5 rounded-full">{openCount} open</span>
                )}
              </h3>
              <div className="flex gap-1">
                {(['unresolved', 'critical', 'all'] as const).map(f => (
                  <button
                    key={f}
                    onClick={() => setActiveFilter(f)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors ${activeFilter === f ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
                  >
                    {f.charAt(0).toUpperCase() + f.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {filteredLogs.length === 0 ? (
              <div className="py-16 text-center">
                <CheckCircle2 className="h-10 w-10 text-emerald-400 mx-auto mb-3" />
                <p className="text-sm font-bold text-slate-500">
                  {activeFilter === 'critical' ? 'No critical drift detected.' :
                   activeFilter === 'unresolved' ? 'All drifts resolved. System is clean.' :
                   'No drift logs recorded yet.'}
                </p>
                <p className="text-xs text-slate-400 mt-1">Close shifts to start Shadow Mode validation.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-50 max-h-96 overflow-y-auto">
                {filteredLogs.map((log) => {
                  const sev = SEVERITY_CONFIG[log.severity];
                  const mod = MODULE_CONFIG[log.module] || { label: log.module, icon: Activity, unit: 'PKR' };
                  return (
                    <div
                      key={log.id}
                      onClick={() => setSelectedLog(log)}
                      className={`p-4 cursor-pointer hover:bg-slate-50 transition-colors ${log.resolved ? 'opacity-60' : ''}`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${sev.bg} border ${sev.border}`}>
                          <sev.icon className={`h-4 w-4 ${sev.color}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`text-[9px] font-black px-1.5 py-0.5 rounded ${sev.badge}`}>{log.severity}</span>
                            <span className="text-[10px] font-bold text-slate-500 uppercase">{mod.label}</span>
                            {log.resolved && (
                              <span className="text-[9px] font-bold bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded">RESOLVED</span>
                            )}
                          </div>
                          <p className="text-sm font-semibold text-slate-800 mt-0.5 truncate">{log.description}</p>
                          <div className="flex items-center gap-3 mt-1 text-xs text-slate-400">
                            <span>Shift: {log.shiftId.slice(0, 12)}...</span>
                            <span>{new Date(log.timestamp).toLocaleString()}</span>
                            <span className="font-bold text-rose-500">Δ {Math.round(log.difference).toLocaleString()} {mod.unit}</span>
                          </div>
                        </div>
                        {!log.resolved && (
                          <ChevronRight className="h-4 w-4 text-slate-300 shrink-0 mt-1" />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Resolve Modal ──────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {selectedLog && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg"
            >
              <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                <h3 className="font-black text-slate-900">Drift Investigation</h3>
                <button onClick={() => { setSelectedLog(null); setResolveNotes(''); }} className="p-1 rounded-lg hover:bg-slate-100">
                  <X className="h-4 w-4 text-slate-500" />
                </button>
              </div>

              <div className="p-5 space-y-4">
                {/* Severity Badge */}
                <div className={`flex items-center gap-2 p-3 rounded-xl border ${SEVERITY_CONFIG[selectedLog.severity].bg} ${SEVERITY_CONFIG[selectedLog.severity].border}`}>
                  <span className={`text-xs font-black px-2 py-0.5 rounded ${SEVERITY_CONFIG[selectedLog.severity].badge}`}>{selectedLog.severity}</span>
                  <span className="text-sm font-bold text-slate-700">{selectedLog.description}</span>
                </div>

                {/* Values Comparison */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-center">
                  <div className="p-3 bg-slate-50 rounded-xl">
                    <div className="text-xs font-bold text-slate-500 mb-1">Legacy Value</div>
                    <div className="text-lg font-black text-slate-800">Rs {Math.round(selectedLog.legacyValue).toLocaleString()}</div>
                  </div>
                  <div className="p-3 bg-rose-50 rounded-xl">
                    <div className="text-xs font-bold text-rose-500 mb-1">Difference</div>
                    <div className="text-lg font-black text-rose-700">Rs {Math.round(selectedLog.difference).toLocaleString()}</div>
                  </div>
                  <div className="p-3 bg-indigo-50 rounded-xl">
                    <div className="text-xs font-bold text-indigo-500 mb-1">EOC Value</div>
                    <div className="text-lg font-black text-indigo-800">Rs {Math.round(selectedLog.operationalValue).toLocaleString()}</div>
                  </div>
                </div>

                {/* Details */}
                <div className="grid grid-cols-1 sm:grid-cols-1 lg:grid-cols-3 gap-4 text-xs text-slate-600">
                  <div><span className="font-bold text-slate-800">Shift: </span>{selectedLog.shiftId}</div>
                  <div><span className="font-bold text-slate-800">Module: </span>{MODULE_CONFIG[selectedLog.module]?.label || selectedLog.module}</div>
                  <div><span className="font-bold text-slate-800">Detected: </span>{new Date(selectedLog.timestamp).toLocaleString()}</div>
                </div>

                {selectedLog.resolved ? (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-sm">
                    <div className="font-bold text-emerald-700 mb-1">Resolved by {selectedLog.resolvedBy}</div>
                    <div className="text-slate-600 text-xs">{selectedLog.resolutionNotes}</div>
                    <div className="text-[10px] text-slate-400 mt-1">{new Date(selectedLog.resolvedAt!).toLocaleString()}</div>
                  </div>
                ) : (
                  <>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        Resolution Notes <span className="text-rose-500">*</span> (mandatory)
                      </label>
                      <textarea
                        value={resolveNotes}
                        onChange={e => setResolveNotes(e.target.value)}
                        rows={3}
                        placeholder="Explain the cause and how it was resolved. E.g. 'Legacy supplier advance entered manually outside shift. EOC transaction created manually. Verified by Owner.'"
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm font-medium text-slate-700 focus:border-indigo-500 focus:outline-none resize-none"
                      />
                    </div>
                    <button
                      onClick={handleResolve}
                      disabled={!resolveNotes.trim()}
                      className="w-full flex items-center justify-center gap-2 bg-indigo-600 text-white rounded-xl py-2.5 text-sm font-bold hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      Mark as Resolved
                    </button>
                  </>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
