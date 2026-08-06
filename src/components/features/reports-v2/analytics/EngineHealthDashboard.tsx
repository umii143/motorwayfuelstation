import React, { useEffect, useState } from 'react';
import { Activity, CheckCircle2, AlertTriangle, XCircle, Clock, Server } from 'lucide-react';
import { EngineHealthMonitor, EngineHealthMetric } from '../../../../services/core/engineHealthMonitor';

export default function EngineHealthDashboard() {
  const [metrics, setMetrics] = useState<EngineHealthMetric[]>([]);

  useEffect(() => {
    // Initial fetch
    setMetrics(EngineHealthMonitor.getEngineHealthSnapshot());
    
    // Subscribe to live updates
    const unsubscribe = EngineHealthMonitor.subscribe((newMetrics: EngineHealthMetric[]) => {
      setMetrics([...newMetrics]);
    });

    return () => unsubscribe();
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ENGINE_HEALTHY': return <CheckCircle2 className="h-5 w-5 text-success" />;
      case 'ENGINE_DEGRADED': return <AlertTriangle className="h-5 w-5 text-amber-500" />;
      case 'ENGINE_DOWN': return <XCircle className="h-5 w-5 text-rose-500" />;
      default: return <Activity className="h-5 w-5 text-slate-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ENGINE_HEALTHY':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-success/10 text-success">Healthy</span>;
      case 'ENGINE_DEGRADED':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800">Degraded</span>;
      case 'ENGINE_DOWN':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-rose-100 text-rose-800">Down</span>;
      default:
        return null;
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
          <Activity className="h-6 w-6 text-indigo-600" />
          Engine Health Dashboard <span className="text-sm font-normal text-slate-500 ml-2">(ANL-05)</span>
        </h1>
        <p className="text-slate-500 mt-1">Live observability and telemetry across all core Enterprise ERP engines.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {metrics.map((metric) => (
          <div key={metric.engineName} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div className="flex items-center gap-3">
                {getStatusIcon(metric.status)}
                <h3 className="font-semibold text-slate-800 tracking-tight">{metric.engineName}</h3>
              </div>
              {getStatusBadge(metric.status)}
            </div>
            
            <div className="p-5 grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                  <Clock className="h-3 w-3" /> Latency
                </p>
                <p className="text-xl font-mono text-slate-700">
                  {metric.avgLatencyMs} <span className="text-sm text-slate-400 font-sans">ms</span>
                </p>
              </div>
              
              <div>
                <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                  <Server className="h-3 w-3" /> Queue
                </p>
                <p className="text-xl font-mono text-slate-700">
                  {metric.queueDepth}
                </p>
              </div>

              <div className="col-span-2 pt-2 border-t border-slate-100 mt-2">
                <div className="flex justify-between items-center">
                  <p className="text-xs text-slate-500">1h Error Rate:</p>
                  <p className={`text-sm font-semibold ${metric.errorRate1h > 0 ? 'text-amber-600' : 'text-success'}`}>
                    {metric.errorRate1h} faults
                  </p>
                </div>
                <div className="flex justify-between items-center mt-1">
                  <p className="text-xs text-slate-500">Last Heartbeat:</p>
                  <p className="text-xs font-mono text-slate-400">
                    {new Date(metric.lastHeartbeat).toLocaleTimeString()}
                  </p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
