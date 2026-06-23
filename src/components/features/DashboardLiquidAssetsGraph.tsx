import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { BankAccount } from '../../types';

interface Props {
  cashOnHand: number;
  banks: BankAccount[];
  dueRecovery: number;
}

export function DashboardLiquidAssetsGraph({ cashOnHand, banks, dueRecovery }: Props) {
  const chartData = useMemo(() => {
    const totalBanks = banks.reduce((sum, bank) => sum + bank.balance, 0);

    return [
      {
        name: 'Cash Drawer',
        value: Math.round(cashOnHand),
        color: '#eab308' // Yellow/Orange
      },
      {
        name: 'Bank Accounts',
        value: Math.round(totalBanks),
        color: '#1e3a8a' // Dark Blue
      },
      {
        name: 'Udhar Receivables',
        value: Math.round(dueRecovery),
        color: '#b91c1c' // Red
      }
    ];
  }, [cashOnHand, banks, dueRecovery]);

  return (
    <div className="premium-card p-6 border h-[380px] flex flex-col">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="font-bold text-slate-900 text-lg">Liquid Assets & Receivables</h3>
          <p className="text-sm text-slate-500">Distribution of physical and book balances</p>
        </div>
      </div>
      <div className="flex-1 min-h-0 w-full relative mt-4">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }} barSize={60}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis 
              dataKey="name" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 11, fill: '#64748b', fontWeight: 'bold' }} 
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
              cursor={{ fill: '#f8fafc' }}
              contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
              itemStyle={{ fontWeight: 'bold' }}
              formatter={(value: any) => [`PKR ${value.toLocaleString()}`, 'Balance']}
            />
            <Bar dataKey="value" radius={[6, 6, 0, 0]} animationDuration={1500}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
