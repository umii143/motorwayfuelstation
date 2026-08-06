import React from 'react';
import { InventoryHubProps } from '../../InventoryHub';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { BarChart3, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';

const mockData = [
  { name: 'Day 1', value: 4000, price: 285 },
  { name: 'Day 5', value: 3000, price: 285 },
  { name: 'Day 10', value: 2000, price: 289 },
  { name: 'Day 15', value: 2780, price: 289 },
  { name: 'Day 20', value: 1890, price: 289 },
  { name: 'Day 25', value: 2390, price: 292 },
  { name: 'Day 30', value: 3490, price: 292 },
];

export const ValuationTab: React.FC<InventoryHubProps> = (props) => {
  const isEn = props.settings.language === 'en';

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-card p-4 rounded-2xl border border-border">
        <div>
          <h3 className="text-lg font-black text-foreground flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary" />
            {isEn ? 'Stock Valuation & Analytics' : 'اسٹاک مالیت اور تجزیات'}
          </h3>
          <p className="text-xs font-bold text-muted-foreground mt-1">
            {isEn ? 'FIFO/WAC valuation tracking and historical pricing impact.' : 'فیفو مالیت اور تاریخی قیمتوں کا اثر۔'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-card border border-border p-5 rounded-2xl shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-black text-muted-foreground uppercase tracking-widest">{isEn ? 'Current Valuation (FIFO)' : 'موجودہ مالیت (فیفو)'}</h3>
            <DollarSign className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-3xl font-black text-foreground">₨ 14,245,000</p>
          <div className="flex items-center gap-1 mt-2 text-emerald-500">
            <TrendingUp className="w-3 h-3" />
            <span className="text-[10px] font-bold">+2.4% vs last week</span>
          </div>
        </div>

        <div className="bg-card border border-border p-5 rounded-2xl shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-black text-muted-foreground uppercase tracking-widest">{isEn ? 'Avg Acquisition Cost' : 'اوسط خریداری لاگت'}</h3>
            <DollarSign className="w-4 h-4 text-sky-500" />
          </div>
          <p className="text-3xl font-black text-foreground">₨ 278.45 <span className="text-sm">/L</span></p>
          <p className="text-[10px] font-bold text-muted-foreground mt-2">Current Retail: ₨ 289.50</p>
        </div>

        <div className="bg-card border border-border p-5 rounded-2xl shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-black text-muted-foreground uppercase tracking-widest">{isEn ? 'Projected Margin' : 'متوقع مارجن'}</h3>
            <TrendingUp className="w-4 h-4 text-primary" />
          </div>
          <p className="text-3xl font-black text-foreground">₨ 11.05 <span className="text-sm">/L</span></p>
          <p className="text-[10px] font-bold text-muted-foreground mt-2">Based on current FIFO batches</p>
        </div>
      </div>

      <div className="bg-card border border-border p-6 rounded-2xl shadow-sm">
        <h3 className="text-sm font-black text-foreground mb-6 uppercase tracking-widest">{isEn ? '30-Day Valuation Trend' : '30 دن کا مالیت رجحان'}</h3>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={mockData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
              <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={10} tickLine={false} axisLine={false} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(val) => `₨${val/1000}k`} />
              <Tooltip 
                contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '0.75rem', fontSize: '12px', fontWeight: 'bold' }}
              />
              <Area type="monotone" dataKey="value" stroke="hsl(var(--primary))" strokeWidth={3} fillOpacity={1} fill="url(#colorValue)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
