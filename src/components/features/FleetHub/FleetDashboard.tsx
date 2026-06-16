import React, { useState, useEffect } from 'react';
import { GlobalSettings, FleetAccount, FleetVehicle, FleetTransaction } from '../../../types';
import { db } from '../../../data/db';
import { Building2, CarFront, AlertTriangle, TrendingUp, TrendingDown, UsersRound } from 'lucide-react';

interface FleetDashboardProps {
  settings: GlobalSettings;
  stationId: string;
}

export default function FleetDashboard({ settings, stationId }: FleetDashboardProps) {
  const [accounts, setAccounts] = useState<FleetAccount[]>([]);
  const [vehicles, setVehicles] = useState<FleetVehicle[]>([]);
  const [transactions, setTransactions] = useState<FleetTransaction[]>([]);

  useEffect(() => {
    setAccounts(db.getFleetAccounts(stationId));
    setVehicles(db.getFleetVehicles(stationId));
    setTransactions(db.getFleetTransactions(stationId));
  }, [stationId]);

  const totalReceivables = accounts.reduce((sum, acc) => sum + acc.balance, 0);
  const activeAccounts = accounts.filter(a => a.status === 'active').length;
  const totalVehicles = vehicles.length;
  const activeVehicles = vehicles.filter(v => v.status === 'active').length;

  const currentMonthTxns = transactions.filter(t => {
    const txnDate = new Date(t.date);
    const now = new Date();
    return txnDate.getMonth() === now.getMonth() && txnDate.getFullYear() === now.getFullYear();
  });

  const mtdConsumption = currentMonthTxns.filter(t => t.type === 'consumption').reduce((sum, t) => sum + t.amount, 0);
  const mtdVolume = currentMonthTxns.filter(t => t.type === 'consumption').reduce((sum, t) => sum + t.quantity, 0);

  const overLimitAccounts = accounts.filter(a => a.balance >= a.creditLimit);

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="fp-kpi-grid-2x2">
        <div className="fp-kpi-compact kpi-orange relative overflow-hidden">
          <div className="fp-kpi-compact__label">Total Receivables</div>
          <div className="fp-kpi-compact__value">
            {settings.currency} {totalReceivables.toLocaleString()}
          </div>
          <div className="fp-kpi-compact__sub text-orange-400">
            From {accounts.length} corporate accounts
          </div>
          <div className="absolute top-2 right-2 text-orange-500 opacity-20">
            <Building2 className="h-8 w-8" />
          </div>
        </div>

        <div className="fp-kpi-compact kpi-green relative overflow-hidden">
          <div className="fp-kpi-compact__label">Active Fleet</div>
          <div className="fp-kpi-compact__value">
            {activeVehicles} <span className="text-base font-sans">/ {totalVehicles}</span>
          </div>
          <div className="fp-kpi-compact__sub text-emerald-400">
            Vehicles currently registered
          </div>
          <div className="absolute top-2 right-2 text-emerald-500 opacity-20">
            <CarFront className="h-8 w-8" />
          </div>
        </div>

        <div className="fp-kpi-compact kpi-blue relative overflow-hidden">
          <div className="fp-kpi-compact__label">MTD Volume</div>
          <div className="fp-kpi-compact__value">
            {mtdVolume.toLocaleString()} <span className="text-base font-sans">Liters</span>
          </div>
          <div className="fp-kpi-compact__sub text-blue-400">
            Fuel consumed this month
          </div>
          <div className="absolute top-2 right-2 text-blue-500 opacity-20">
            <TrendingUp className="h-8 w-8" />
          </div>
        </div>

        <div className="fp-kpi-compact kpi-purple relative overflow-hidden">
          <div className="fp-kpi-compact__label">MTD Billing</div>
          <div className="fp-kpi-compact__value">
            {settings.currency} {mtdConsumption.toLocaleString()}
          </div>
          <div className="fp-kpi-compact__sub text-purple-400">
            Revenue from fleet sales
          </div>
          <div className="absolute top-2 right-2 text-purple-500 opacity-20">
            <TrendingUp className="h-8 w-8" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Alerts / Credit Limits */}
        <div className="premium-card border overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-rose-500" />
              Credit Limit Alerts
            </h3>
            <span className="text-xs font-bold bg-rose-100 text-rose-700 px-2 py-0.5 rounded-full">
              {overLimitAccounts.length} Alerts
            </span>
          </div>
          <div className="divide-y divide-slate-100">
            {overLimitAccounts.map(acc => (
              <div key={acc.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition">
                <div>
                  <div className="font-bold text-slate-900 text-sm">{acc.companyName}</div>
                  <div className="text-xs text-slate-500 mt-0.5">Contact: {acc.contactPerson} ({acc.phone})</div>
                </div>
                <div className="text-right">
                  <div className="font-mono text-sm font-black text-rose-600">Bal: {settings.currency} {acc.balance.toLocaleString()}</div>
                  <div className="text-xs text-slate-500 mt-0.5 font-mono">Limit: {settings.currency} {acc.creditLimit.toLocaleString()}</div>
                </div>
              </div>
            ))}
            {overLimitAccounts.length === 0 && (
              <div className="p-8 text-center text-sm text-slate-500 flex flex-col items-center">
                <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center mb-3">
                  <TrendingDown className="h-6 w-6 text-emerald-500" />
                </div>
                All corporate accounts are within their credit limits.
              </div>
            )}
          </div>
        </div>

        {/* Top Consumers */}
        <div className="premium-card border overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
              <UsersRound className="h-4 w-4 text-indigo-500" />
              Top Consumers (MTD)
            </h3>
          </div>
          <div className="p-4">
            <p className="text-sm text-slate-500 italic">
              Once more transactions are recorded, the highest consuming corporate accounts and vehicles will be displayed here for easy tracking and contract renewals.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
