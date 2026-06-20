import React, { useMemo } from 'react';
import { AlertTriangle, TrendingDown, Thermometer, Droplet, Calendar as CalendarIcon, CheckCircle2, ShieldCheck } from 'lucide-react';
import { Tank, Shift, Nozzle } from '../../types';

interface FuelVarianceHeatmapProps {
  tanks: Tank[];
  shifts: Shift[];
  nozzles: Nozzle[];
}

export function FuelVarianceHeatmap({ tanks, shifts, nozzles }: FuelVarianceHeatmapProps) {
  // Get last 7 closed shifts (or fewer if not available)
  const last7Shifts = useMemo(() => {
    return [...shifts]
      .filter(s => s.status === 'closed' && s.date)
      .sort((a, b) => new Date(b.date!).getTime() - new Date(a.date!).getTime())
      .slice(0, 7)
      .reverse(); // chronological order left to right
  }, [shifts]);

  const dataConfidence = last7Shifts.length >= 7 ? 100 : Math.round((last7Shifts.length / 7) * 100);

  const heatmapData = useMemo(() => {
    if (last7Shifts.length === 0) return [];
    
    return tanks.map(tank => {
      let total7DayLoss = 0;
      const history = last7Shifts.map(shift => {
        return { varianceLiters: 0, status: 'normal', label: '0L' };
      });

      return {
        tank,
        history,
        total7DayLoss: Math.round(total7DayLoss * 100) / 100
      };
    });
  }, [tanks, last7Shifts, nozzles]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'normal': return 'bg-emerald-500/20 border-emerald-500/30 text-emerald-600 dark:text-emerald-400';
      case 'watch': return 'bg-amber-500/20 border-amber-500/30 text-amber-600 dark:text-amber-400';
      case 'investigate': return 'bg-rose-500/20 border-rose-500/30 text-rose-600 dark:text-rose-400';
      default: return 'bg-slate-500/20 border-slate-500/30 text-slate-600 dark:text-slate-400';
    }
  };

  return (
    <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden flex flex-col">
      {/* HEADER */}
      <div className="p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#0B0F19] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center border border-orange-500/20">
            <Droplet className="w-5 h-5 text-orange-500" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Fuel Variance Heatmap</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">7-Day Tank Shrinkage & Expansion Analysis</p>
          </div>
        </div>
        <div className="flex items-center gap-4 text-xs font-bold text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-emerald-500/20 border border-emerald-500/30"></div> Normal</div>
          <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-amber-500/20 border border-amber-500/30"></div> Watch</div>
          <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-rose-500/20 border border-rose-500/30"></div> Investigate</div>
        </div>
      </div>

      {/* CONFIDENCE BAR */}
      <div className={`px-5 py-2 border-b text-xs font-bold flex items-center gap-2 ${dataConfidence < 100 ? 'bg-amber-500/10 border-amber-500/20 text-amber-500' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500'}`}>
        {dataConfidence < 100 ? <AlertTriangle className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}
        <span>Data Confidence: {dataConfidence}%</span>
        <span className="text-slate-400 font-normal">({last7Shifts.length} of 7 shifts available)</span>
      </div>

      {/* HEATMAP GRID */}
      <div className="p-0 overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-100 dark:bg-slate-800/50 text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
              <th className="px-5 py-3 whitespace-nowrap w-48">Tank Identity</th>
              {last7Shifts.map((shift, idx) => (
                <th key={idx} className="px-3 py-3 text-center w-24">
                  <div className="flex flex-col items-center justify-center gap-1">
                    <CalendarIcon className="w-3.5 h-3.5 opacity-50" />
                    {new Date(shift.date!).toLocaleDateString(undefined, { weekday: 'short' })}
                  </div>
                </th>
              ))}
              {last7Shifts.length === 0 && (
                <th className="px-3 py-3 text-center">Historical Shifts</th>
              )}
              <th className="px-5 py-3 text-right">Trend</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
            {heatmapData.length === 0 ? (
              <tr><td colSpan={9} className="p-8 text-center">
                <div className="flex flex-col items-center justify-center">
                   <AlertTriangle className="w-10 h-10 text-slate-300 mb-3" />
                   <p className="text-slate-500 font-bold">No Data Available</p>
                   <p className="text-xs text-slate-400">Close at least one shift with tank dips to see variance heatmap.</p>
                </div>
              </td></tr>
            ) : (
              heatmapData.map((data, idx) => (
                <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                  <td className="px-5 py-4">
                    <div className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                      <Thermometer className="w-4 h-4 text-slate-400" />
                      {data.tank.name}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">{data.tank.capacity.toLocaleString()}L Capacity</div>
                  </td>
                  
                  {data.history.map((dayData, i) => (
                    <td key={i} className="px-2 py-4 text-center">
                      <div className={`mx-auto w-16 py-2 rounded-lg border flex flex-col items-center justify-center ${getStatusColor(dayData.status)}`}>
                        <span className="text-[10px] font-black">
                          {dayData.label}
                        </span>
                      </div>
                    </td>
                  ))}
                  
                  <td className="px-5 py-4 text-right">
                    <div className="flex flex-col items-end justify-center">
                      <div className={`flex items-center gap-1 font-black text-sm ${data.total7DayLoss < -30 ? 'text-rose-500' : 'text-slate-600 dark:text-slate-300'}`}>
                        {data.total7DayLoss < -30 ? <AlertTriangle className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                        {data.total7DayLoss}L
                      </div>
                      <div className="text-[10px] uppercase tracking-widest text-slate-500 dark:text-slate-400 font-bold">Total Loss</div>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
