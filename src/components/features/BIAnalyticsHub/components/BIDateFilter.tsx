import React from 'react';
import { Calendar } from 'lucide-react';

export interface BIFilter {
  startDate: string;
  endDate: string;
  productId: string;
}

interface BIDateFilterProps {
  filter: BIFilter;
  setFilter: (filter: BIFilter) => void;
  products: any[];
}

export function BIDateFilter({ filter, setFilter, products }: BIDateFilterProps) {
  
  const handlePreset = (preset: string) => {
    const today = new Date();
    let start = new Date();
    let end = new Date();
    
    switch (preset) {
      case 'today':
        break;
      case 'this_month':
        start.setDate(1);
        break;
      case 'last_month':
        start.setMonth(start.getMonth() - 1);
        start.setDate(1);
        end.setDate(0); // Last day of previous month
        break;
      case 'this_year':
        start.setMonth(0, 1);
        break;
      case 'all_time':
        start = new Date('2020-01-01');
        break;
      default:
        break;
    }
    
    setFilter({
      ...filter,
      startDate: start.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0]
    });
  };

  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between ga premium-card p-4 border mb-6">
      <div className="flex items-center gap-2">
        <Calendar className="w-5 h-5 text-slate-400" />
        <div className="flex bg-slate-100 p-1 rounded-lg">
          <button onClick={() => handlePreset('today')} className="px-3 py-1.5 text-xs font-bold rounded-md hover:bg-white hover:shadow-sm transition-all text-slate-600 focus:bg-white focus:shadow-sm">Today</button>
          <button onClick={() => handlePreset('this_month')} className="px-3 py-1.5 text-xs font-bold rounded-md hover:bg-white hover:shadow-sm transition-all text-slate-600 focus:bg-white focus:shadow-sm">This Month</button>
          <button onClick={() => handlePreset('this_year')} className="px-3 py-1.5 text-xs font-bold rounded-md hover:bg-white hover:shadow-sm transition-all text-slate-600 focus:bg-white focus:shadow-sm">This Year</button>
          <button onClick={() => handlePreset('all_time')} className="px-3 py-1.5 text-xs font-bold rounded-md hover:bg-white hover:shadow-sm transition-all text-slate-600 focus:bg-white focus:shadow-sm">All Time</button>
        </div>
      </div>
      
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <input 
            type="date" 
            value={filter.startDate} 
            onChange={(e) => setFilter({ ...filter, startDate: e.target.value })}
            className="text-xs font-bold border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:border-rose-500"
          />
          <span className="text-slate-400 text-xs">to</span>
          <input 
            type="date" 
            value={filter.endDate} 
            onChange={(e) => setFilter({ ...filter, endDate: e.target.value })}
            className="text-xs font-bold border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:border-rose-500"
          />
        </div>
        
        <select 
          value={filter.productId}
          onChange={(e) => setFilter({ ...filter, productId: e.target.value })}
          className="text-xs font-bold border border-slate-200 rounded-lg px-3 py-1.5 bg-slate-50 focus:outline-none focus:border-rose-500"
        >
          <option value="all">All Products</option>
          {products.map(p => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
      </div>
    </div>
  );
}
