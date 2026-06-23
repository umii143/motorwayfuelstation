import React from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { formatCurrency } from '../../../lib/currency';
import { GlobalSettings } from '../../../types';

interface CashFlowChartProps {
   
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any[];
  settings: GlobalSettings;
}

export default function LubeCashFlowChart({ data, settings }: CashFlowChartProps) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#f97316" stopOpacity={0.4}/>
            <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
          </linearGradient>
          <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
            <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
          </linearGradient>
        </defs>
        <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} dy={10} />
        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} tickFormatter={(val) => `Rs${val/1000}k`} />
        <Tooltip 
          contentStyle={{ borderRadius: '16px', border: 'none', backgroundColor: 'var(--tooltip-bg, rgba(3, 7, 18, 0.9))', backdropFilter: 'blur(20px)', color: 'var(--tooltip-color, #fff)', boxShadow: '0 20px 40px rgba(0,0,0,0.5)' }}
          itemStyle={{ fontWeight: 'bold' }}
          formatter={(value: any) => formatCurrency(value, settings)}
        />
        <Area type="monotone" dataKey="sales" stroke="#f97316" strokeWidth={3} fillOpacity={1} fill="url(#colorSales)" />
        <Area type="monotone" dataKey="profit" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorProfit)" />
      </AreaChart>
    </ResponsiveContainer>
  );
}
