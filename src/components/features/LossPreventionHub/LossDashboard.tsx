import React, { useState, useEffect } from 'react';
import { GlobalSettings, VarianceIncident } from '../../../types';
import { db } from '../../../data/db';
import { ShieldAlert, TrendingDown, Scale, DollarSign, Search, Plus, XCircle, Droplets } from 'lucide-react';

interface LossDashboardProps {
  settings: GlobalSettings;
  stationId: string;
}

export default function LossDashboard({ settings, stationId }: LossDashboardProps) {
  const [incidents, setIncidents] = useState<VarianceIncident[]>([]);

  useEffect(() => {
    setIncidents(db.getVarianceIncidents(stationId));
  }, [stationId]);

  const unresolvedIncidents = incidents.filter(i => i.status !== 'resolved');
  const totalFinancialLoss = incidents.filter(i => i.status !== 'resolved').reduce((sum, i) => sum + i.financialLoss, 0);

  const mtdIncidents = incidents.filter(i => {
    const txnDate = new Date(i.date);
    const now = new Date();
    return txnDate.getMonth() === now.getMonth() && txnDate.getFullYear() === now.getFullYear();
  });

  const getSeverityColor = (severity: string) => {
    switch(severity) {
      case 'critical': return 'bg-rose-100 text-rose-700 border-rose-200';
      case 'high': return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'medium': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'low': return 'bg-blue-100 text-blue-700 border-blue-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="premium-card p-5 border-rose-200 shadow-rose-100 relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-rose-50 rounded-full group-hover:scale-110 transition-transform"></div>
          <div className="relative">
            <div className="flex justify-between items-start mb-2">
              <span className="text-xs font-bold text-rose-800 uppercase">Unresolved Incidents</span>
              <div className="p-2 bg-rose-100 text-rose-600 rounded-lg">
                <ShieldAlert className="h-4 w-4" />
              </div>
            </div>
            <div className="text-2xl font-black font-mono text-rose-900">{unresolvedIncidents.length}</div>
            <div className="text-xs text-rose-600 mt-2 font-medium">Require immediate investigation</div>
          </div>
        </div>

        <div className="premium-card p-5 border relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-slate-50 rounded-full group-hover:scale-110 transition-transform"></div>
          <div className="relative">
            <div className="flex justify-between items-start mb-2">
              <span className="text-xs font-bold text-slate-500 uppercase">MTD Incidents</span>
              <div className="p-2 bg-slate-100 text-slate-600 rounded-lg">
                <Scale className="h-4 w-4" />
              </div>
            </div>
            <div className="text-2xl font-black font-mono text-slate-900">{mtdIncidents.length}</div>
            <div className="text-xs text-slate-500 mt-2 font-medium">Total reported this month</div>
          </div>
        </div>

        <div className="premium-card p-5 border relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-rose-50 rounded-full group-hover:scale-110 transition-transform"></div>
          <div className="relative">
            <div className="flex justify-between items-start mb-2">
              <span className="text-xs font-bold text-slate-500 uppercase">Unresolved Value Loss</span>
              <div className="p-2 bg-rose-100 text-rose-600 rounded-lg">
                <TrendingDown className="h-4 w-4" />
              </div>
            </div>
            <div className="text-2xl font-black font-mono text-rose-600">{settings.currency} {totalFinancialLoss.toLocaleString()}</div>
            <div className="text-xs text-slate-500 mt-2 font-medium">Capital tied up in shrinkage/loss</div>
          </div>
        </div>
      </div>

      <div className="premium-card border overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <h3 className="font-bold text-sm text-slate-800">Critical & High Priority Incidents</h3>
        </div>
        <div className="divide-y divide-slate-100">
          {unresolvedIncidents.filter(i => i.severity === 'critical' || i.severity === 'high').map(incident => (
            <div key={incident.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition">
              <div className="flex items-center gap-4">
                <div className={`p-2 rounded-lg border ${getSeverityColor(incident.severity)}`}>
                  {incident.type === 'cash_variance' ? <DollarSign className="h-5 w-5" /> : <Droplets className="h-5 w-5" />}
                </div>
                <div>
                  <div className="font-bold text-slate-900 text-sm capitalize">{incident.type.replace('_', ' ')}</div>
                  <div className="text-xs text-slate-500 mt-0.5">Date: {new Date(incident.date).toLocaleDateString()} | Ref: {incident.sourceId}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-mono text-sm font-black text-rose-600">Loss: {settings.currency} {incident.financialLoss.toLocaleString()}</div>
                <div className="text-xs font-bold uppercase mt-1">
                  <span className={`px-2 py-0.5 rounded ${incident.status === 'investigating' ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'}`}>
                    {incident.status}
                  </span>
                </div>
              </div>
            </div>
          ))}
          {unresolvedIncidents.filter(i => i.severity === 'critical' || i.severity === 'high').length === 0 && (
            <div className="p-8 text-center text-sm text-slate-500 flex flex-col items-center">
              <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center mb-3">
                <ShieldAlert className="h-6 w-6 text-emerald-500" />
              </div>
              No critical or high priority incidents currently active.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
