import React, { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface Props {
  data: { date: string; Sales: number; Margin: number }[];
}

export function DashboardWeeklyGraph({ data }: Props) {
  const chartData = useMemo(() => {
    // Only take the last 7 items to match "Weekly"
    const last7 = [...data].slice(-7);
    
    return last7.map((item, index) => {
      const dateObj = new Date(item.date);
      const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'short' });
      const isToday = index === last7.length - 1; // Assuming the last item is today
      
      return {
        name: isToday ? 'Today' : dayName,
        Sales: Math.round(item.Sales),
        Profit: Math.round(item.Margin)
      };
    });
  }, [data]);

  return (
    <div className="premium-card p-6 border h-[380px] flex flex-col">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="font-bold text-slate-900 text-lg">Weekly Sales & Profit Intelligence</h3>
          <p className="text-sm text-slate-500">Showing visual records matching 7 days activities</p>
        </div>
      </div>
      <div className="flex-1 min-h-0 w-full relative">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#1e3a8a" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#1e3a8a" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#166534" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#166534" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis 
              dataKey="name" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 12, fill: '#64748b' }} 
              dy={10} 
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 12, fill: '#64748b' }} 
              tickFormatter={(val) => val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}
              dx={-10}
            />
            <Tooltip 
              contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
              itemStyle={{ fontWeight: 'bold' }}
              formatter={(value: any) => [`PKR ${value.toLocaleString()}`, undefined]}
            />
            <Legend verticalAlign="top" align="right" iconType="circle" wrapperStyle={{ paddingBottom: '20px', marginTop: '-40px' }} />
            <Area 
              type="monotone" 
              dataKey="Sales" 
              stroke="#1e3a8a" 
              strokeWidth={2}
              fillOpacity={1} 
              fill="url(#colorSales)" 
              activeDot={{ r: 6, strokeWidth: 0 }}
              animationDuration={1500}
            />
            <Area 
              type="monotone" 
              dataKey="Profit" 
              stroke="#166534" 
              strokeWidth={2}
              fillOpacity={1} 
              fill="url(#colorProfit)" 
              activeDot={{ r: 6, strokeWidth: 0 }}
              animationDuration={1500}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
