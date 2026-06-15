import React, { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

export function BIInvestmentChart({ shifts = [], batches = [], expenses = [], filter }: any) {
  
  const chartData = useMemo(() => {
    // Basic daily aggregation
    // This is a simplified version. A real cumulative sum would aggregate chronologically
    // over all data points before the current date. For the sake of the dashboard,
    // we assume the data passed is already aggregated or we do a simple day-by-day mapping.

    const dateMap = new Map<string, { invested: number, revenue: number }>();
    
    // Sort all dates
    // In a real app we'd map every single day. Here we just take existing dates
    const allDates = new Set<string>();
    
    batches.forEach((b: any) => allDates.add(b.date));
    shifts.forEach((s: any) => allDates.add(s.date));
    
    const sortedDates = Array.from(allDates).sort();
    
    let cumInvested = 0;
    let cumRevenue = 0;
    
    return sortedDates.map(date => {
      // Find today's specific additions
      let dailyInvested = 0;
      let dailyRevenue = 0;
      
      batches.filter((b:any) => b.date === date).forEach((b:any) => {
        dailyInvested += (b.quantityReceived || 0) * (b.purchasePrice || 0) + (b.carriageExpense || 0);
      });
      
      expenses.filter((e:any) => e.date === date).forEach((e:any) => {
        dailyInvested += e.amount || 0;
      });
      
      shifts.filter((s:any) => s.date === date).forEach((s:any) => {
        (s.nozzleData || []).forEach((n:any) => {
          const liters = n.closingReading - n.openingReading - (n.testLiters || 0);
          dailyRevenue += liters * n.rate;
        });
      });
      
      cumInvested += dailyInvested;
      cumRevenue += dailyRevenue;
      
      return {
        date,
        Invested: cumInvested,
        Revenue: cumRevenue,
        ProfitZone: cumRevenue > cumInvested ? cumRevenue : cumInvested // used for shading
      };
    });
  }, [shifts, batches, expenses]);

  const formatCurrency = (val: number) => {
    if (val >= 10000000) return `Rs. ${(val / 10000000).toFixed(2)} Cr`;
    if (val >= 100000) return `Rs. ${(val / 100000).toFixed(2)} L`;
    return `Rs. ${val.toLocaleString()}`;
  };

  return (
    <div className="premium-card p-5 border mb-6">
      <div className="mb-4">
        <h3 className="font-sans text-lg font-bold text-slate-900">Investment vs Revenue (Cumulative)</h3>
        <p className="text-xs text-slate-500">Track the breakeven point and total capital deployed over time.</p>
      </div>
      
      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorInvested" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
            <XAxis dataKey="date" tick={{fontSize: 10, fill: '#64748b'}} tickLine={false} axisLine={false} />
            <YAxis tickFormatter={formatCurrency} tick={{fontSize: 10, fill: '#64748b'}} tickLine={false} axisLine={false} />
            <Tooltip 
              formatter={(value: number) => new Intl.NumberFormat('en-PK', { style: 'currency', currency: 'PKR', minimumFractionDigits: 0 }).format(value)}
              contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)' }}
            />
            <Area type="monotone" dataKey="Revenue" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
            <Area type="monotone" dataKey="Invested" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorInvested)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
