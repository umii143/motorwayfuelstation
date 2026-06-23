import React, { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp } from 'lucide-react';
import { useStation } from '../../../contexts/StationContext';
import { formatCurrency } from '../../../lib/currency';

export function SalesOverviewWidget() {
  const { shifts, settings } = useStation();

  const chartData = useMemo(() => {
    const data = Array.from({length: 7}, (_, i) => {
      const d = new Date(); d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const dayShifts = shifts.filter(s => s.date === dateStr);
      let dayRev = 0;
      dayShifts.forEach(s => dayRev += (s.totalSales || 0));
      return { date: d.toLocaleDateString('en-US', { weekday: 'short' }), revenue: dayRev };
    }).reverse();
    return data;
  }, [shifts]);

  const totalWeekRevenue = chartData.reduce((sum, item) => sum + item.revenue, 0);

  return (
    <div className="w-full h-full bg-[#0F172A]/80 backdrop-blur-md rounded-2xl border border-white/5 shadow-xl flex flex-col p-6 overflow-hidden">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-orange-500" /> 7-Day Revenue Trend
          </h2>
          <div className="text-2xl font-black text-white mt-1">{formatCurrency(totalWeekRevenue, settings)}</div>
        </div>
      </div>
      
      <div className="flex-1 min-h-[150px] -mx-2 -mb-4">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#F97316" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#F97316" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} dy={10} />
            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} tickFormatter={(value) => `Rs ${value / 1000}k`} />
            <Tooltip 
              contentStyle={{ backgroundColor: '#0F172A', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px' }}
              itemStyle={{ color: '#fff', fontSize: '12px', fontWeight: 'bold' }}
              formatter={(value: any) => [formatCurrency(value, settings), 'Revenue']}
            />
            <Area type="monotone" dataKey="revenue" stroke="#F97316" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
