import React from 'react';
import { TableProperties } from 'lucide-react';
import { useInventoryStore } from '../../../../stores/useInventoryStore';
import { useShiftStore } from '../../../../stores/useShiftStore';
import { useFinancialStore } from '../../../../stores/useFinancialStore';

export function BIDetailedAnalyticsTable({ filter }: any) {
  const { stockBatches: batches = [] } = useInventoryStore();
  const { shifts = [] } = useShiftStore();
  const { standaloneExpenses = [] } = useFinancialStore();

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('en-PK', { style: 'currency', currency: 'PKR', minimumFractionDigits: 0 }).format(val);

  // Group data by Month (YYYY-MM)
  const monthlyData: Record<string, { revenue: number, invested: number, expenses: number }> = {};

  const getMonthKey = (date: string) => {
    return date ? date.substring(0, 7) : 'Unknown';
  };

  shifts.forEach(s => {
    if (filter.productId !== 'all') return; // Simplified: Table only accurate for 'all' products currently
    const key = getMonthKey(s.date);
    if (!monthlyData[key]) monthlyData[key] = { revenue: 0, invested: 0, expenses: 0 };
    
    let shiftRev = s.expectedCash || 0;
    // We'd ideally reconstruct sales accurately from expectedCash formula or just use expectedCash.
    monthlyData[key].revenue += shiftRev;
  });

  batches.forEach(b => {
    if (filter.productId !== 'all' && b.productId !== filter.productId) return;
    const key = getMonthKey(b.date);
    if (!monthlyData[key]) monthlyData[key] = { revenue: 0, invested: 0, expenses: 0 };
    
    const amountReceived = b.qtyReceived * b.omcInvoicePrice;
    const totalCost = amountReceived + (b.carriageTotal || 0);
    monthlyData[key].invested += totalCost;
  });

  standaloneExpenses.forEach(e => {
    const key = getMonthKey(e.date);
    if (!monthlyData[key]) monthlyData[key] = { revenue: 0, invested: 0, expenses: 0 };
    monthlyData[key].expenses += e.amount || 0;
  });

  const sortedMonths = Object.keys(monthlyData).sort((a,b) => b.localeCompare(a)); // Descending

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mb-6">
      <div className="p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TableProperties className="w-5 h-5 text-slate-600" />
          <h3 className="font-sans text-lg font-bold text-slate-900">Month-by-Month Financial Table</h3>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="bg-white text-slate-500 border-b border-slate-100">
              <th className="py-4 px-5 font-semibold">Month</th>
              <th className="py-4 px-5 font-semibold text-right">Revenue</th>
              <th className="py-4 px-5 font-semibold text-right">Invested/Purchases</th>
              <th className="py-4 px-5 font-semibold text-right">Expenses</th>
              <th className="py-4 px-5 font-semibold text-right">Net Profit (Est.)</th>
              <th className="py-4 px-5 font-semibold text-right">ROI</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {sortedMonths.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-slate-400">No data available.</td>
              </tr>
            ) : (
              sortedMonths.map(month => {
                const data = monthlyData[month];
                const getShiftProductSales = (shiftId: string, productId: string) => {
                  const shift = shifts.find(s => s.id === shiftId);
                  if (!shift) return 0;
                  
                  // Reconstruct sales from shift entries if needed or just use 0 as a placeholder
                  // This is a complex query that should really be done in an aggregator, so let's simplify for now
                  return 0;
                };
                const netProfit = data.revenue - data.invested - data.expenses; // Highly simplified for table
                const roi = data.invested > 0 ? (netProfit / data.invested) * 100 : 0;
                
                // Format Month name
                const [year, m] = month.split('-');
                const monthName = new Date(parseInt(year), parseInt(m) - 1).toLocaleString('default', { month: 'long' });

                return (
                  <tr key={month} className="hover:bg-slate-50 transition-colors">
                    <td className="py-4 px-5 font-bold text-slate-800">{monthName} {year}</td>
                    <td className="py-4 px-5 font-bold text-emerald-700 text-right">{formatCurrency(data.revenue)}</td>
                    <td className="py-4 px-5 text-slate-700 text-right">{formatCurrency(data.invested)}</td>
                    <td className="py-4 px-5 text-rose-600 text-right">{formatCurrency(data.expenses)}</td>
                    <td className={`py-4 px-5 font-black text-right ${netProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {formatCurrency(netProfit)}
                    </td>
                    <td className="py-4 px-5 text-right">
                      <span className={`text-xs font-bold px-2 py-1 rounded-md ${roi >= 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                        {roi.toFixed(1)}%
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
