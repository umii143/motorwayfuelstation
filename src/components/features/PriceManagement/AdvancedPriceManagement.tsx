import React, { useMemo } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { 
  TrendingUp, TrendingDown, Clock, Activity, 
  ChevronDown, Edit2, Minus, Maximize2, AlertCircle, CheckCircle
} from 'lucide-react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell 
} from 'recharts';
import { useInventoryStore } from '../../../stores/useInventoryStore';
import { Product, RateHistoryEntry, GlobalSettings } from '../../../types';
import { motion } from 'motion/react';

interface AdvancedPriceManagementProps {
  products: Product[];
  rateHistory: RateHistoryEntry[];
  settings: GlobalSettings;
  onOpenUpdateDrawer: () => void;
}

const COLORS: Record<string, string> = {
  Petrol: '#3b82f6', // Blue
  Diesel: '#10b981', // Green
  'Hi Octane': '#8b5cf6', // Purple
  Kerosene: '#f59e0b', // Orange
  LDO: '#ef4444', // Red
  Default: '#64748b'
};

const getProductColor = (name: string) => {
  for (const key in COLORS) {
    if (name.toLowerCase().includes(key.toLowerCase())) return COLORS[key];
  }
  return COLORS.Default;
};

export default function AdvancedPriceManagement({
  products,
  rateHistory,
  settings,
  onOpenUpdateDrawer
}: AdvancedPriceManagementProps) {
  const isUrdu = settings.language === 'ur';
  const t = (en: string, ur: string) => isUrdu ? ur : en;

  // Retrieve stockTxns to calculate margin
  const { stockTxns } = useInventoryStore(useShallow(state => ({
    stockTxns: state.stockTxns
  })));

  const fuelProducts = useMemo(() => products.filter(p => p.type === 'fuel'), [products]);

  // Calculate Average Price
  const avgPrice = fuelProducts.length > 0 
    ? fuelProducts.reduce((sum, p) => sum + p.rate, 0) / fuelProducts.length 
    : 0;

  // Calculate Last Update Time
  const lastUpdate = rateHistory.length > 0 ? rateHistory[0] : null;

  // Calculate total price changes this month
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const changesThisMonth = rateHistory.filter(rh => {
    const d = new Date((rh.date || '') || rh.effectiveDate || Date.now());
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  }).length;

  // Compute stats per product
  const productStats = useMemo(() => {
    return fuelProducts.map(product => {
      // Find latest change
      const latestChange = rateHistory.find(rh => rh.productId === product.id);
      const oldRate = latestChange ? (latestChange.oldRate ?? latestChange.oldPrice ?? product.rate) : product.rate;
      const changeAmt = product.rate - oldRate;
      const changePct = oldRate > 0 ? (changeAmt / oldRate) * 100 : 0;

      // Find latest purchase to calculate margin
      const latestReceipt = stockTxns
        .filter(t => t.type === 'receipt' && t.itemId === product.id)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];

      const purchaseRate = latestReceipt && latestReceipt.purchasePrice ? latestReceipt.purchasePrice : (product.rate * 0.95); // fallback to 5% margin if no purchases
      const margin = product.rate - purchaseRate;

      return {
        ...product,
        changeAmt,
        changePct,
        margin,
        effectiveTime: latestChange ? (latestChange.effectiveDate || latestChange.date) : 'Initial',
        color: getProductColor(product.name)
      };
    });
  }, [fuelProducts, rateHistory, stockTxns]);

  // Summary Metrics
  let increasedCount = 0;
  let decreasedCount = 0;
  let unchangedCount = 0;
  
  productStats.forEach(p => {
    if (p.changeAmt > 0) increasedCount++;
    else if (p.changeAmt < 0) decreasedCount++;
    else unchangedCount++;
  });

  const donutData = [
    { name: 'Increased', value: increasedCount, color: '#10b981' },
    { name: 'Decreased', value: decreasedCount, color: '#ef4444' },
    { name: 'No Change', value: unchangedCount, color: '#f59e0b' },
  ].filter(d => d.value > 0);

  const highestPrice = [...productStats].sort((a, b) => b.rate - a.rate)[0];
  const lowestPrice = [...productStats].sort((a, b) => a.rate - b.rate)[0];
  
  const avgChange = productStats.length > 0 
    ? productStats.reduce((sum, p) => sum + p.changeAmt, 0) / productStats.length 
    : 0;
    
  // Calculate Margin Impact based on actual rate history changes
  const marginImpact = avgPrice - avgChange > 0 
    ? `${avgChange > 0 ? '+' : ''}${(avgChange / (avgPrice - avgChange) * 100).toFixed(2)}%`
    : '0.00%';
  
  const maxChange = [...productStats].sort((a, b) => Math.abs(b.changeAmt) - Math.abs(a.changeAmt))[0];

  // Price History Line Chart Data
  // Group by date, create keys for each product
  const historyData = useMemo(() => {
    const dates = Array.from(new Set(rateHistory.map(r => r.effectiveDate || r.date).filter(Boolean).slice(0, 10))).reverse() as string[];
    return dates.map(date => {
      const point: any = { date };
      fuelProducts.forEach(p => {
        // find the price at this date or the last known price before this date
        const historyUpToDate = rateHistory.filter(r => (r.effectiveDate || r.date || '') <= date && r.productId === p.id);
        point[p.name] = historyUpToDate.length > 0 ? (historyUpToDate[0]?.newRate ?? historyUpToDate[0]?.newPrice) : p.rate;
      });
      return point;
    });
  }, [rateHistory, fuelProducts]);

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto animate-in fade-in duration-500 text-slate-200">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            Price Management
          </h1>
          <p className="text-slate-400 text-sm">Manage fuel rates, taxes, margins and price history</p>
        </div>
        
        {/* Right side actions - Optional search / settings mock per screenshot */}
        <div className="flex items-center gap-3">
          <button 
            onClick={onOpenUpdateDrawer}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2.5 rounded-lg text-sm font-semibold transition-all shadow-lg shadow-blue-500/20"
          >
            <span className="text-lg leading-none">+</span> Update Prices
            <ChevronDown className="w-4 h-4 ml-1 opacity-70" />
          </button>
        </div>
      </div>

      {/* TOP KPI CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Current Avg Price */}
        <div className="bg-[#0f1a2e] border border-blue-900/30 rounded-xl p-4 flex flex-col justify-between shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-20">
             <Activity className="w-16 h-16 text-blue-400" />
          </div>
          <span className="text-xs font-semibold text-blue-400 uppercase tracking-wider mb-2 relative z-10">Current Avg Price</span>
          <div className="flex items-end gap-2 relative z-10">
            <span className="text-2xl font-bold text-white">Rs. {avgPrice.toFixed(2)}</span>
            <span className="text-sm text-slate-400 mb-1">/Ltr</span>
          </div>
          <span className="text-xs text-slate-500 mt-1 relative z-10">All Products Average</span>
        </div>

        {/* Price Updated */}
        <div className="bg-[#0b1b17] border border-emerald-900/30 rounded-xl p-4 flex flex-col justify-between shadow-xl relative overflow-hidden">
          <div className="absolute top-4 right-4 bg-emerald-500/20 p-2 rounded-full">
             <CheckCircle className="w-6 h-6 text-emerald-400" />
          </div>
          <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-2 relative z-10">Price Updated</span>
          <div className="flex items-end gap-2 relative z-10">
            <span className="text-xl font-bold text-white">{lastUpdate ? (lastUpdate.effectiveDate || lastUpdate.date || '').split(' ')[0] : 'N/A'}</span>
          </div>
          <span className="text-xs text-slate-500 mt-1 relative z-10">Last Update Time</span>
        </div>

        {/* Total Price Changes */}
        <div className="bg-[#1a1124] border border-purple-900/30 rounded-xl p-4 flex flex-col justify-between shadow-xl relative overflow-hidden">
          <div className="absolute top-4 right-4 bg-purple-500/20 p-2 rounded-lg">
             <Activity className="w-6 h-6 text-purple-400" />
          </div>
          <span className="text-xs font-semibold text-purple-400 uppercase tracking-wider mb-2 relative z-10">Total Price Changes</span>
          <div className="flex items-end gap-2 relative z-10">
            <span className="text-2xl font-bold text-white">{changesThisMonth}</span>
          </div>
          <span className="text-xs text-slate-500 mt-1 relative z-10">This Month</span>
        </div>

        {/* Impact on Margin */}
        <div className="bg-[#1b140f] border border-orange-900/30 rounded-xl p-4 flex flex-col justify-between shadow-xl relative overflow-hidden">
           <div className="absolute top-4 right-4 bg-orange-500/20 p-2 rounded-lg">
             <TrendingUp className="w-6 h-6 text-orange-400" />
          </div>
          <span className="text-xs font-semibold text-orange-400 uppercase tracking-wider mb-2 relative z-10">Impact on Margin</span>
          <div className="flex items-end gap-2 relative z-10">
            <span className="text-2xl font-bold text-white">{marginImpact}</span>
          </div>
          <span className="text-xs text-slate-500 mt-1 relative z-10">vs Last Update</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* LEFT COLUMN: Current Fuel Prices */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-[#111827]/80 backdrop-blur-md border border-slate-800 rounded-2xl p-6 shadow-2xl flex flex-col h-full">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-lg font-bold text-white">Current Fuel Prices</h3>
                <p className="text-xs text-slate-400">Manage your current fuel rates</p>
              </div>
              <button 
                onClick={onOpenUpdateDrawer}
                className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors"
              >
                <Maximize2 className="w-3 h-3" /> Bulk Update
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-xs font-semibold text-slate-500">
                    <th className="pb-3 px-2 font-medium">Product</th>
                    <th className="pb-3 px-2 font-medium">Current Price (Rs./Ltr)</th>
                    <th className="pb-3 px-2 font-medium">Change (Rs.)</th>
                    <th className="pb-3 px-2 font-medium">Margin (Rs./Ltr)</th>
                    <th className="pb-3 px-2 font-medium">Effective Time</th>
                    <th className="pb-3 px-2 font-medium text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {productStats.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-800/30 transition-colors group">
                      <td className="py-4 px-2">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: `${p.color}20` }}>
                            <span className="font-bold text-sm" style={{ color: p.color }}>{p.name.charAt(0)}</span>
                          </div>
                          <div>
                            <p className="text-sm font-bold text-white">{p.name}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-2">
                        <span className="text-base font-bold text-white" style={{ color: p.color }}>
                          {p.rate.toFixed(2)}
                        </span>
                      </td>
                      <td className="py-4 px-2">
                        <div className="flex flex-col">
                          {p.changeAmt > 0 ? (
                            <span className="text-sm font-bold text-emerald-400 flex items-center gap-1">
                              +{p.changeAmt.toFixed(2)} <TrendingUp className="w-3 h-3" />
                            </span>
                          ) : p.changeAmt < 0 ? (
                            <span className="text-sm font-bold text-red-400 flex items-center gap-1">
                              {p.changeAmt.toFixed(2)} <TrendingDown className="w-3 h-3" />
                            </span>
                          ) : (
                            <span className="text-sm font-bold text-slate-500 flex items-center gap-1">
                              No Change <Minus className="w-3 h-3" />
                            </span>
                          )}
                          <span className="text-xs text-slate-500">
                            {p.changePct > 0 ? '+' : ''}{p.changePct.toFixed(2)}%
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-2">
                        <div className="bg-blue-500/10 border border-blue-500/20 text-blue-400 px-2.5 py-1 rounded-md inline-block font-semibold text-xs text-center min-w-[3rem]">
                          {p.margin.toFixed(2)}
                        </div>
                      </td>
                      <td className="py-4 px-2">
                        <span className="text-xs text-slate-400">{(p.effectiveTime || '').split(' ')[0]}</span>
                      </td>
                      <td className="py-4 px-2 text-right">
                        <button 
                          onClick={onOpenUpdateDrawer}
                          className="bg-[#0B1120] border border-slate-700 hover:border-slate-500 text-slate-300 px-3 py-1.5 rounded-md text-xs font-semibold transition-all flex items-center gap-2 ml-auto"
                        >
                          Edit <ChevronDown className="w-3 h-3" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Price Summary Cards */}
        <div className="flex flex-col gap-4">
          <div className="bg-[#111827]/80 backdrop-blur-md border border-slate-800 rounded-2xl p-6 shadow-2xl flex-1 flex flex-col justify-center">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-base font-bold text-white">Price Summary</h3>
                <p className="text-xs text-slate-400">Today's overview</p>
              </div>
            </div>
            
            <div className="flex items-center gap-6 mb-6">
              <div className="w-24 h-24 relative">
                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                  <PieChart>
                    <Pie
                      data={donutData}
                      innerRadius={30}
                      outerRadius={45}
                      paddingAngle={5}
                      dataKey="value"
                      stroke="none"
                    >
                      {donutData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-xl font-bold text-white">{fuelProducts.length}</span>
                  <span className="text-[9px] text-slate-400 uppercase">Products</span>
                </div>
              </div>
              <div className="flex-1 space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <div className="flex items-center gap-2 text-slate-300">
                    <div className="w-2 h-2 rounded-full bg-emerald-500"></div> Increased
                  </div>
                  <span className="font-bold text-white">{increasedCount}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <div className="flex items-center gap-2 text-slate-300">
                    <div className="w-2 h-2 rounded-full bg-red-500"></div> Decreased
                  </div>
                  <span className="font-bold text-white">{decreasedCount}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <div className="flex items-center gap-2 text-slate-300">
                    <div className="w-2 h-2 rounded-full bg-amber-500"></div> No Change
                  </div>
                  <span className="font-bold text-white">{unchangedCount}</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mt-auto">
               <div className="bg-[#1a1124] border border-purple-900/30 rounded-xl p-3 flex flex-col relative overflow-hidden">
                  <span className="text-[10px] font-semibold text-purple-400 uppercase tracking-wider mb-1">Highest Price</span>
                  <span className="text-lg font-bold text-white">Rs. {highestPrice?.rate.toFixed(2)}</span>
                  <span className="text-xs text-slate-400 truncate">{highestPrice?.name}</span>
               </div>
               <div className="bg-[#1b140f] border border-orange-900/30 rounded-xl p-3 flex flex-col relative overflow-hidden">
                  <span className="text-[10px] font-semibold text-orange-400 uppercase tracking-wider mb-1">Lowest Price</span>
                  <span className="text-lg font-bold text-white">Rs. {lowestPrice?.rate.toFixed(2)}</span>
                  <span className="text-xs text-slate-400 truncate">{lowestPrice?.name}</span>
               </div>
               <div className="bg-[#0b1b17] border border-emerald-900/30 rounded-xl p-3 flex flex-col relative overflow-hidden">
                  <span className="text-[10px] font-semibold text-emerald-400 uppercase tracking-wider mb-1">Average Change</span>
                  <span className="text-lg font-bold text-emerald-400">+{avgChange.toFixed(2)} Rs.</span>
                  <span className="text-[9px] text-slate-400 truncate mt-0.5">vs Last Update</span>
               </div>
               <div className="bg-[#1a1c18] border border-yellow-900/30 rounded-xl p-3 flex flex-col relative overflow-hidden">
                  <span className="text-[10px] font-semibold text-yellow-500 uppercase tracking-wider mb-1">Max Change</span>
                  <span className="text-lg font-bold text-white">{maxChange?.changeAmt > 0 ? '+' : ''}{maxChange?.changeAmt.toFixed(2)} Rs.</span>
                  <span className="text-[9px] text-slate-400 truncate mt-0.5">{maxChange?.name}</span>
               </div>
            </div>

          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Price History Chart */}
        <div className="lg:col-span-2 bg-[#111827]/80 backdrop-blur-md border border-slate-800 rounded-2xl p-6 shadow-2xl">
           <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-lg font-bold text-white">Price History</h3>
                <p className="text-xs text-slate-400">Track all price changes and trends</p>
              </div>
            </div>
            
            <div className="h-64 mt-4 relative w-full">
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                <LineChart data={historyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1f2937" />
                  <XAxis dataKey="date" stroke="#6b7280" tick={{ fontSize: 10 }} tickMargin={10} axisLine={false} tickLine={false} />
                  <YAxis stroke="#6b7280" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} domain={['auto', 'auto']} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0B1120', border: '1px solid #1f2937', borderRadius: '8px', color: '#f8fafc' }}
                    itemStyle={{ fontSize: 12, fontWeight: 500 }}
                    labelStyle={{ color: '#94a3b8', marginBottom: '4px', fontSize: 11 }}
                  />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: 11, color: '#94a3b8' }} />
                  {fuelProducts.map((product) => (
                    <Line 
                      key={product.id}
                      type="monotone" 
                      dataKey={product.name} 
                      stroke={getProductColor(product.name)} 
                      strokeWidth={2}
                      dot={{ r: 3, fill: '#0B1120', strokeWidth: 2 }}
                      activeDot={{ r: 5, strokeWidth: 0 }}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
        </div>

        {/* Recent Price Changes List */}
        <div className="bg-[#111827]/80 backdrop-blur-md border border-slate-800 rounded-2xl p-6 shadow-2xl flex flex-col h-full overflow-hidden">
          <div className="flex justify-between items-center mb-4">
              <h3 className="text-base font-bold text-white">Recent Price Changes</h3>
              <button className="text-xs font-semibold text-blue-400 hover:text-blue-300">View All →</button>
          </div>

          <div className="flex-1 overflow-y-auto pr-2 space-y-4 custom-scrollbar">
            {rateHistory.slice(0, 8).map(rh => {
              const product = products.find(p => p.id === rh.productId);
              const color = product ? getProductColor(product.name) : COLORS.Default;
              const diff = (rh.newRate || 0) - (rh.oldRate || 0);
              const isIncrease = diff >= 0;

              return (
                <div key={rh.id} className="flex gap-3 items-center border-b border-slate-800/50 pb-3 last:border-0 last:pb-0">
                   <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: `${color}20` }}>
                     <Activity className="w-4 h-4" style={{ color }} />
                   </div>
                   <div className="flex-1 min-w-0">
                     <div className="flex justify-between items-start mb-0.5">
                       <span className="text-xs font-bold text-slate-200 truncate">{product?.name || 'Product'} Price Updated</span>
                       <span className={`text-[10px] font-bold ${isIncrease ? 'text-emerald-400' : 'text-red-400'}`}>
                         {isIncrease ? '+' : ''}{diff.toFixed(2)} Rs./Ltr
                       </span>
                     </div>
                     <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                       <span className="flex items-center gap-2">
                         <span>Previous: {(rh.oldRate || 0).toFixed(2)}</span>
                         <span>→</span>
                         <span className="text-slate-300">New: {(rh.newRate || 0).toFixed(2)}</span>
                       </span>
                     </div>
                   </div>
                   <div className="text-right shrink-0">
                      <p className="text-[9px] text-slate-500 mb-0.5">{(rh.date || '').split(' ')[0]}</p>
                      <p className="text-[9px] font-medium text-slate-400 max-w-[60px] truncate">{rh.changedBy}</p>
                   </div>
                </div>
              );
            })}

            {rateHistory.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full py-10 text-slate-500">
                <AlertCircle className="w-8 h-8 mb-2 opacity-50" />
                <p className="text-sm">No recent price changes</p>
              </div>
            )}
          </div>
        </div>
      </div>

    </div>
  );
}
