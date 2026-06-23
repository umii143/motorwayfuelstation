import React, { useState } from 'react';
import { useBIAggregator, BIFilter } from '../../../lib/bi/biAggregator';
import { useInventoryStore } from '../../../stores/useInventoryStore';
import { useShiftStore } from '../../../stores/useShiftStore';
import { useFinancialStore } from '../../../stores/useFinancialStore';
import { useShallow } from 'zustand/react/shallow';
import { BIDateFilter } from './components/BIDateFilter';
import { BIMasterKPIs } from './components/BIMasterKPIs';
import { BIInvestmentChart } from './components/BIInvestmentChart';
import { BIProductSupplierAnalysis } from './components/BIProductSupplierAnalysis';
import { BIPaymentCostBreakdown } from './components/BIPaymentCostBreakdown';
import { BISmartMetrics } from './components/BISmartMetrics';
import { BIDetailedAnalyticsTable } from './components/BIDetailedAnalyticsTable';
import { BIAIInsights } from './components/BIAIInsights';
import { TrendingUp } from 'lucide-react';

export default function BusinessIntelligenceDashboard() {
  const { products = [], stockBatches: batches = [] } = useInventoryStore(useShallow(state => ({
    products: state.products,
    stockBatches: state.stockBatches
  })));
  const { shifts = [] } = useShiftStore(useShallow(state => ({ shifts: state.shifts })));
  const { standaloneExpenses = [] } = useFinancialStore(useShallow(state => ({ standaloneExpenses: state.standaloneExpenses })));

  const [filter, setFilter] = useState<BIFilter>(() => {
    // Default to 'This Month'
    const start = new Date();
    start.setDate(1);
    return {
      startDate: start.toISOString().split('T')[0],
      endDate: new Date().toISOString().split('T')[0],
      productId: 'all'
    };
  });

  const metrics = useBIAggregator(filter);

  return (
    <div className="pb-20">
      <div className="mb-6">
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Owner's Financial Command Center</h1>
        <p className="text-slate-500 font-medium mt-1">Real-time business intelligence, capital tracking, and profitability analytics.</p>
      </div>

      <BIDateFilter filter={filter} setFilter={setFilter} products={products} />

      {/* ROW 1: KPI Cards */}
      <BIMasterKPIs metrics={metrics} settings={{ /* empty */ }} />

      {/* ROW 2: Charts */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2">
          <BIInvestmentChart shifts={shifts} batches={batches} expenses={standaloneExpenses} filter={filter} />
        </div>
        <div className="premium-card p-5 border mb-6 flex flex-col justify-center items-center text-center">
          <div className="w-16 h-16 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mb-4">
            <TrendingUp className="w-8 h-8" />
          </div>
          <h3 className="font-sans text-lg font-bold text-slate-900 mb-2">Profitability Trend</h3>
          <p className="text-sm text-slate-500">More charts coming in the next sprint.</p>
        </div>
      </div>

      {/* ROW 3: Product and Supplier Analysis */}
      <BIProductSupplierAnalysis metrics={metrics} />

      {/* ROW 4: Cost and Payment Breakdown */}
      <BIPaymentCostBreakdown metrics={metrics} />

      {/* ROW 5: Smart Metrics */}
      <BISmartMetrics metrics={metrics} />

      {/* ROW 6: Month-by-Month Table */}
      <BIDetailedAnalyticsTable filter={filter} />

      {/* ROW 7: AI Insights */}
      <BIAIInsights metrics={metrics} />
      
    </div>
  );
}
