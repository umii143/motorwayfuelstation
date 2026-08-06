import React, { useEffect, useState } from 'react';
import { Database, ShieldAlert, CheckCircle2, AlertOctagon, AlertTriangle, RefreshCw, ChevronDown, ChevronRight } from 'lucide-react';
import { DataQualityEngine, DataQualityCheckResult } from '../../../../services/core/dataQualityEngine';
import { useStation } from '../../../../contexts/StationContext';
import { useAuth } from '../../../../contexts/AuthContext';

export default function DataQualityDashboard() {
  const { activeStationId } = useStation();
  const { organization } = useAuth();
  const [results, setResults] = useState<DataQualityCheckResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedCheck, setExpandedCheck] = useState<string | null>(null);

  const runChecks = async () => {
    if (!activeStationId) return;
    setLoading(true);
    try {
      // In a real app we'd get orgId from context, fallback to 'legacy'
      const oId = organization?.orgId || 'legacy';
      const r = await DataQualityEngine.runAllChecks(activeStationId, oId);
      setResults(r);
      setExpandedCheck(null);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runChecks();
  }, [activeStationId, organization?.orgId]);

  const getSeverityIcon = (severity: string, count: number) => {
    if (count === 0) return <CheckCircle2 className="h-5 w-5 text-primary" />;
    switch (severity) {
      case 'HIGH': return <AlertOctagon className="h-5 w-5 text-rose-500" />;
      case 'MEDIUM': return <AlertTriangle className="h-5 w-5 text-amber-500" />;
      case 'LOW': return <ShieldAlert className="h-5 w-5 text-indigo-500" />;
      default: return <ShieldAlert className="h-5 w-5 text-slate-400" />;
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
            <Database className="h-6 w-6 text-indigo-600" />
            Data Quality Center <span className="text-sm font-normal text-slate-500 ml-2">(ANL-06)</span>
          </h1>
          <p className="text-slate-500 mt-1">Automated anomaly detection and operational record integrity checks.</p>
        </div>
        <button
          onClick={runChecks}
          disabled={loading}
          className="flex items-center gap-2 bg-indigo-50 text-indigo-700 px-4 py-2 rounded-lg font-medium hover:bg-indigo-100 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Run Checks
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="grid grid-cols-12 gap-4 p-4 border-b border-slate-200 bg-slate-50 font-semibold text-slate-600 text-sm">
          <div className="col-span-1">Status</div>
          <div className="col-span-4">Check Name</div>
          <div className="col-span-5">Description</div>
          <div className="col-span-2 text-right">Anomalies</div>
        </div>

        {results.length === 0 && !loading && (
          <div className="p-8 text-center text-slate-500">No checks run yet.</div>
        )}

        {results.map((r) => {
          const isExpanded = expandedCheck === r.checkId;
          const hasAnomalies = r.affectedRecords > 0;
          
          return (
            <React.Fragment key={r.checkId}>
              <div 
                className={`grid grid-cols-12 gap-4 p-4 border-b border-slate-100 items-center transition-colors ${hasAnomalies ? 'hover:bg-slate-50 cursor-pointer' : 'opacity-80'}`}
                onClick={() => hasAnomalies && setExpandedCheck(isExpanded ? null : r.checkId)}
              >
                <div className="col-span-1 flex justify-center">
                  {getSeverityIcon(r.severity, r.affectedRecords)}
                </div>
                <div className="col-span-4 font-medium text-slate-800 flex items-center gap-2">
                  {hasAnomalies && (isExpanded ? <ChevronDown className="h-4 w-4 text-slate-400" /> : <ChevronRight className="h-4 w-4 text-slate-400" />)}
                  {!hasAnomalies && <div className="w-4" />}
                  {r.name}
                  <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded ml-2 font-mono">{r.checkId}</span>
                </div>
                <div className="col-span-5 text-sm text-slate-600 truncate" title={r.description}>
                  {r.description}
                </div>
                <div className="col-span-2 text-right">
                  {hasAnomalies ? (
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${r.severity === 'HIGH' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'}`}>
                      {r.affectedRecords} found
                    </span>
                  ) : (
                    <span className="text-sm text-slate-400">Clean</span>
                  )}
                </div>
              </div>

              {/* Expanded details */}
              {isExpanded && hasAnomalies && (
                <div className="col-span-12 bg-slate-50 p-4 border-b border-slate-200">
                  <div className="pl-14 pr-4">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">Affected Records ({r.affectedRecords})</h4>
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {r.details.map((d: { id: string; msg: string; context: any }, idx: number) => (
                        <div key={idx} className="bg-white border border-slate-200 rounded p-3 text-sm flex flex-col gap-1">
                          <div className="font-medium text-slate-800">{d.msg}</div>
                          <div className="font-mono text-xs text-slate-500 flex justify-between">
                            <span>ID: {d.id}</span>
                            <span>{JSON.stringify(d.context)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}
