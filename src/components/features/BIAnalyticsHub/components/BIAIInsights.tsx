import React, { useMemo, useState } from 'react';
import { ShieldAlert, Sparkles, AlertTriangle, Info, BrainCircuit, Loader2 } from 'lucide-react';
import { useCustomerStore } from '../../../../stores/useCustomerStore';
import { useInventoryStore } from '../../../../stores/useInventoryStore';
import { useSupplierStore } from '../../../../stores/useSupplierStore';
import { useShallow } from 'zustand/react/shallow';
import { fetchWithAuth } from '../../../../lib/api';

export function BIAIInsights({ metrics }: any) {
  const customers = useCustomerStore(useShallow(state => state.customers || []));
  const products = useInventoryStore(useShallow(state => state.products || []));
  const suppliers = useSupplierStore(useShallow(state => state.suppliers || []));
  
  const [aiReport, setAiReport] = useState<string | null>(null);
  const [loadingAi, setLoadingAi] = useState(false);
  
  const insights = useMemo(() => {
    const generatedInsights = [];

    const { kpi, productSales, supplierPerformance, smartMetrics } = metrics;
    const totalCreditExposure = customers.reduce((acc, c) => acc + (c.balance || 0), 0);
    const totalRevenue = kpi.totalRevenue || 0;
    const netProfit = kpi.netProfit || 0;

    // 1. Credit Exposure Insight
    if (totalRevenue > 0) {
      const creditRatio = (totalCreditExposure / totalRevenue) * 100;
      if (creditRatio > 15) {
        generatedInsights.push({
          type: 'warning',
          title: 'High Credit Exposure',
          description: `Credit exposure is currently at ${creditRatio.toFixed(1)}% of selected period revenue. Consider tightening credit limits.`,
          icon: <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
        });
      } else if (creditRatio > 0 && creditRatio <= 5) {
        generatedInsights.push({
          type: 'success',
          title: 'Healthy Credit Ratio',
          description: `Credit exposure is well controlled at ${creditRatio.toFixed(1)}% of revenue. Excellent liquidity management.`,
          icon: <Sparkles className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
        });
      }
    }

    // 2. Top Performer Insight
    if (Object.keys(productSales).length > 0 && netProfit > 0) {
      let topProduct = null;
      let highestMargin = 0;
      
      Object.entries(productSales).forEach(([pid, data]: [string, any]) => {
        const margin = data.revenue - data.cogs;
        if (margin > highestMargin) {
          highestMargin = margin;
          topProduct = pid;
        }
      });

      if (topProduct && highestMargin > 0) {
        const prod = products.find(p => p.id === topProduct);
        const marginContribution = (highestMargin / netProfit) * 100;
        generatedInsights.push({
          type: 'success',
          title: 'Top Performer',
          description: `${prod?.name || 'Product'} generated ${marginContribution.toFixed(1)}% of your total net profit this period.`,
          icon: <Sparkles className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
        });
      }
    }

    // 3. Supplier Cost Insight
    if (Object.keys(supplierPerformance).length > 1) {
      let totalLiters = 0;
      let totalSpent = 0;
      
      Object.values(supplierPerformance).forEach((data: any) => {
        totalLiters += data.liters;
        totalSpent += data.spent;
      });

      const avgMarketCost = totalLiters > 0 ? totalSpent / totalLiters : 0;
      
      let mostExpensiveSupplier = null;
      let highestCostDiff = 0;

      Object.entries(supplierPerformance).forEach(([sid, data]: [string, any]) => {
        const supplierCost = data.liters > 0 ? data.spent / data.liters : 0;
        if (supplierCost > avgMarketCost) {
          const diff = ((supplierCost - avgMarketCost) / avgMarketCost) * 100;
          if (diff > highestCostDiff) {
            highestCostDiff = diff;
            mostExpensiveSupplier = sid;
          }
        }
      });

      if (mostExpensiveSupplier && highestCostDiff > 2) {
        const supp = suppliers.find(s => s.id === mostExpensiveSupplier);
        generatedInsights.push({
          type: 'warning',
          title: 'High Supplier Cost',
          description: `${supp?.name || 'Supplier'} costs are ${highestCostDiff.toFixed(1)}% higher than your average procurement cost.`,
          icon: <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
        });
      }
    }

    // 4. Leakage Insight
    if (smartMetrics.totalTestLiters > 0) {
      const estimatedLostRevenue = smartMetrics.totalTestLiters * 250; // Approximated Rs. 250/L
      if (smartMetrics.totalTestLiters > 50) {
        generatedInsights.push({
          type: 'warning',
          title: 'High Test Liters',
          description: `${smartMetrics.totalTestLiters}L used for testing. This is approximately Rs. ${estimatedLostRevenue.toLocaleString()} in tied-up capital. Ensure recovery.`,
          icon: <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
        });
      }
    }

    // Default insight if none trigger
    if (generatedInsights.length === 0) {
      generatedInsights.push({
        type: 'info',
        title: 'Steady Operations',
        description: `Operations are steady. Run a longer date range to uncover deeper strategic insights.`,
        icon: <Info className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
      });
    }

    return generatedInsights.slice(0, 4); // Show max 4
  }, [metrics, customers, products, suppliers]);

  const generateGeminiReport = async () => {
    setLoadingAi(true);
    setAiReport(null);
    try {
      const summaryPayload = {
        totalRevenue: metrics.kpi.totalRevenue,
        netProfit: metrics.kpi.netProfit,
        roi: metrics.kpi.roi,
        unrealizedStockProfit: metrics.stock.unrealizedProfit,
        costBreakdown: metrics.costs,
        testLiters: metrics.smartMetrics.totalTestLiters
      };

      const systemPrompt = `
        You are FuelPro AI, an expert Financial Analyst for a fuel station. 
        Analyze the following exact mathematical metrics provided by the BI engine for this period.
        Write a very concise, professional, 2-paragraph executive summary highlighting what the station owner is doing well, and what they need to watch out for. Use markdown formatting.
        Do not use dummy numbers, only use the provided numbers.
        BI Engine Metrics: ${JSON.stringify(summaryPayload)}
      `;

      const response = await fetchWithAuth('/api/ai-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemPrompt,
          userMessage: "Generate the Executive Summary for these BI metrics.",
          conversationHistory: []
        })
      });

      if (!response.ok) throw new Error('API Error');
      const data = await response.json();
      setAiReport(data.reply);
    } catch (err) {
      setAiReport("⚠️ Failed to connect to Gemini API. Please check your network or API keys.");
    } finally {
      setLoadingAi(false);
    }
  };

  return (
    <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-2xl p-6 shadow-lg text-white">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Sparkles className="w-6 h-6 text-amber-400" />
          <h2 className="text-lg font-bold">FuelPro Real-Time Business Insights</h2>
        </div>
        <button 
          onClick={generateGeminiReport}
          disabled={loadingAi}
          className="flex items-center gap-2 premium-button hover:bg-indigo-700 disabled:bg-slate-700 px-4 py-2.5 sm:py-2 min-h-[48px] sm:min-h-[40px] text-sm font-bold transition-all shadow-sm"
        >
          {loadingAi ? <Loader2 className="w-4 h-4 animate-spin" /> : <BrainCircuit className="w-4 h-4" />}
          {loadingAi ? "Analyzing..." : "Ask Gemini AI"}
        </button>
      </div>

      {aiReport && (
        <div className="mb-6 p-5 bg-white/10 border border-indigo-500/30 rounded-xl">
          <div className="flex items-center gap-2 mb-2 text-indigo-300 font-bold text-xs uppercase tracking-wider">
            <BrainCircuit className="w-4 h-4" /> Gemini Executive Summary
          </div>
          <div className="prose prose-sm prose-invert max-w-none text-slate-200" dangerouslySetInnerHTML={{ 
            __html: aiReport.replace(/\n/g, '<br />') 
          }} />
        </div>
      )}
      
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {insights.map((insight, index) => (
          <div key={index} className="bg-white/10 rounded-xl p-4 border border-white/10 hover:bg-white/20 transition-colors cursor-default">
            <div className="flex items-start gap-3">
              {insight.icon}
              <div>
                <p className="font-bold text-sm">{insight.title}</p>
                <p className="text-xs text-slate-300 mt-1">{insight.description}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
