import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  TrendingUp, 
  TrendingDown, 
  AlertOctagon, 
  Package, 
  Info, 
  Database,
  BarChart3,
  Calendar,
  Layers,
  Sparkles,
  ArrowRightLeft,
  Search
} from 'lucide-react';
import { useStation } from '../../../contexts/StationContext';
import { formatCurrency } from '../../../lib/currency';
import { GlobalSettings, RateHistoryEntry, Product, Tank } from '../../../types';

interface InventoryDrillDownModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: GlobalSettings;
}

export default function InventoryDrillDownModal({
  isOpen,
  onClose,
  settings
}: InventoryDrillDownModalProps) {
  const { rateHistory, products, tanks } = useStation();

  const [activeTab, setActiveTab] = useState<'overview' | 'revaluation_ledger'>('overview');
  const [excludeManual, setExcludeManual] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // 1. Process Rate History for Revaluation Intelligence
  const processedRateHistory = useMemo(() => {
    let filtered = [...rateHistory].sort((a, b) => b.timestamp - a.timestamp);
    
    if (excludeManual) {
      filtered = filtered.filter(r => !r.reason.toLowerCase().includes('manual'));
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(r => 
        r.reason.toLowerCase().includes(q) ||
        r.changedBy.toLowerCase().includes(q) ||
        products.find(p => p.id === r.productId)?.name.toLowerCase().includes(q)
      );
    }

    return filtered;
  }, [rateHistory, excludeManual, searchQuery, products]);

  // KPIs
  const kpis = useMemo(() => {
    let totalGain = 0;
    let totalLoss = 0;
    const productImpacts: Record<string, number> = {};
    const userImpacts: Record<string, number> = {};

    processedRateHistory.forEach(entry => {
      const impact = entry.revaluationImpact || 0;
      if (impact > 0) totalGain += impact;
      else if (impact < 0) totalLoss += Math.abs(impact);

      const prodName = products.find(p => p.id === entry.productId)?.name || 'Unknown Product';
      productImpacts[prodName] = (productImpacts[prodName] || 0) + impact;

      userImpacts[entry.changedBy] = (userImpacts[entry.changedBy] || 0) + 1;
    });

    const netImpact = totalGain - totalLoss;
    
    // Highest product impact
    let highestProduct = 'N/A';
    let highestImpact = -Infinity;
    Object.entries(productImpacts).forEach(([prod, val]) => {
      if (val > highestImpact) {
        highestImpact = val;
        highestProduct = prod;
      }
    });

    return {
      totalGain,
      totalLoss,
      netImpact,
      highestProduct: highestImpact === -Infinity ? 'N/A' : highestProduct,
      highestProductValue: highestImpact === -Infinity ? 0 : highestImpact,
      totalChanges: processedRateHistory.length,
      productImpacts
    };
  }, [processedRateHistory, products]);

  // Current Stock Value
  const currentStockValue = useMemo(() => {
    return products.reduce((sum, p) => sum + (p.currentStock * p.rate), 0);
  }, [products]);

  const totalPhysicalStock = useMemo(() => {
    return products.reduce((sum, p) => sum + p.currentStock, 0);
  }, [products]);

  // AI Insights Generator
  const generateInsights = () => {
    const insights = [];

    if (kpis.netImpact > 0) {
      insights.push(`Your inventory strategy resulted in a net revaluation GAIN of ${formatCurrency(kpis.netImpact, settings)}. Holding stock during OGRA price hikes was highly profitable.`);
    } else if (kpis.netImpact < 0) {
      insights.push(`Your inventory suffered a net revaluation LOSS of ${formatCurrency(Math.abs(kpis.netImpact), settings)}. Consider keeping leaner stock levels prior to expected OGRA price drops.`);
    } else {
      insights.push(`Revaluation impact is neutral. Prices have been relatively stable or gains offset losses perfectly.`);
    }

    if (kpis.highestProduct !== 'N/A') {
      insights.push(`"${kpis.highestProduct}" generated the highest revaluation variance (${formatCurrency(kpis.highestProductValue, settings)}).`);
    }

    if (excludeManual) {
      insights.push(`By excluding manual corrections, these figures reflect pure market/OGRA compliance impacts.`);
    }

    return insights;
  };

  const insights = generateInsights();

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
        />

        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-6xl max-h-[90vh] bg-slate-50 rounded-2xl shadow-2xl overflow-hidden flex flex-col"
        >
          {/* HEADER */}
          <div className="flex-none bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between z-10">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
                <Database className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-xl font-black text-slate-900 tracking-tight">Enterprise Inventory Intelligence</h2>
                <p className="text-sm font-medium text-slate-500">Revaluation, Stock Worth & Price Change Analytics</p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="h-10 w-10 flex items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-700 transition-colors cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* MAIN SCROLLABLE CONTENT */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">

            {/* EXECUTIVE KPI HEADER */}
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Current Stock Value</span>
                <h3 className="text-2xl font-black text-slate-900">{formatCurrency(currentStockValue, settings)}</h3>
                <div className="mt-2 flex items-center gap-1.5 text-xs font-bold text-slate-500">
                  <Package className="h-3.5 w-3.5" />
                  Total Active Inventory
                </div>
              </div>

              <div className="bg-emerald-50 rounded-xl border border-emerald-200 p-5 shadow-sm">
                <span className="text-[10px] font-black text-emerald-800 uppercase tracking-widest block mb-1">Total Revaluation Gains</span>
                <h3 className="text-2xl font-black text-emerald-900">+{formatCurrency(kpis.totalGain, settings)}</h3>
                <div className="mt-2 flex items-center gap-1.5 text-xs font-bold text-emerald-700">
                  <TrendingUp className="h-3.5 w-3.5" />
                  OGRA price hikes on existing stock
                </div>
              </div>

              <div className="bg-red-50 rounded-xl border border-red-200 p-5 shadow-sm">
                <span className="text-[10px] font-black text-red-800 uppercase tracking-widest block mb-1">Total Revaluation Losses</span>
                <h3 className="text-2xl font-black text-red-900">-{formatCurrency(kpis.totalLoss, settings)}</h3>
                <div className="mt-2 flex items-center gap-1.5 text-xs font-bold text-red-700">
                  <TrendingDown className="h-3.5 w-3.5" />
                  OGRA price drops on existing stock
                </div>
              </div>

              <div className={`${kpis.netImpact >= 0 ? 'bg-purple-50 border-purple-200' : 'bg-orange-50 border-orange-200'} rounded-xl border p-5 shadow-sm`}>
                <span className={`text-[10px] font-black uppercase tracking-widest block mb-1 ${kpis.netImpact >= 0 ? 'text-purple-800' : 'text-orange-800'}`}>Net Lifetime Impact</span>
                <h3 className={`text-2xl font-black ${kpis.netImpact >= 0 ? 'text-purple-900' : 'text-orange-900'}`}>
                  {kpis.netImpact >= 0 ? '+' : ''}{formatCurrency(kpis.netImpact, settings)}
                </h3>
                <div className={`mt-2 flex items-center gap-1.5 text-xs font-bold ${kpis.netImpact >= 0 ? 'text-purple-700' : 'text-orange-700'}`}>
                  <BarChart3 className="h-3.5 w-3.5" />
                  Net Hidden Profit/Loss
                </div>
              </div>
            </div>

            {/* AI INSIGHTS */}
            <div className="bg-gradient-to-br from-indigo-900 via-slate-900 to-slate-900 rounded-xl p-6 text-white shadow-lg relative overflow-hidden">
              <div className="absolute top-0 right-0 p-6 opacity-10 pointer-events-none">
                <Sparkles className="h-48 w-48" />
              </div>
              <div className="relative z-10 flex flex-col md:flex-row gap-6 items-start">
                <div className="flex-none">
                  <div className="bg-indigo-500/20 p-3 rounded-xl border border-indigo-500/30">
                    <Sparkles className="h-8 w-8 text-indigo-400" />
                  </div>
                </div>
                <div className="flex-1 space-y-3">
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    Executive Inventory Analysis
                  </h3>
                  <div className="space-y-2">
                    {insights.map((insight, idx) => (
                      <div key={idx} className="flex items-start gap-2">
                        <div className="h-1.5 w-1.5 rounded-full bg-indigo-400 mt-2 shrink-0" />
                        <p className="text-sm text-indigo-100 leading-relaxed font-medium">{insight}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* TOGGLES & TABS */}
            <div className="flex flex-row items-center justify-between gap-4 border-b border-slate-200 pb-2">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveTab('overview')}
                  className={`px-4 py-2 font-sans text-xs font-bold border-b-2 transition-all cursor-pointer ${
                    activeTab === 'overview'
                      ? 'border-purple-600 text-purple-600'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  General Overview
                </button>
                <button
                  onClick={() => setActiveTab('revaluation_ledger')}
                  className={`px-4 py-2 font-sans text-xs font-bold border-b-2 transition-all cursor-pointer ${
                    activeTab === 'revaluation_ledger'
                      ? 'border-purple-600 text-purple-600'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Price Revision Ledger
                </button>
              </div>

              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 cursor-pointer bg-white px-3 py-1.5 border border-slate-200 rounded-lg shadow-sm hover:bg-slate-50 transition-colors">
                  <input 
                    type="checkbox" 
                    checked={excludeManual} 
                    onChange={e => setExcludeManual(e.target.checked)}
                    className="rounded border-slate-300 text-purple-600 focus:ring-purple-500"
                  />
                  <span className="text-xs font-bold text-slate-700">Exclude Manual Corrections</span>
                </label>
              </div>
            </div>

            {/* CONTENT VIEWS */}
            {activeTab === 'overview' && (
              <div className="grid grid-cols-2 lg:grid-cols-2 gap-6">
                
                {/* Product Impact Breakdown */}
                <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                  <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <Layers className="h-4 w-4 text-slate-400" />
                    Revaluation Impact by Product
                  </h3>
                  <div className="space-y-4">
                    {Object.entries(kpis.productImpacts).map(([prod, impact]) => (
                      <div key={prod} className="flex flex-col gap-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-bold text-slate-700">{prod}</span>
                          <span className={`text-xs font-black ${impact >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                            {impact >= 0 ? '+' : ''}{formatCurrency(impact, settings)}
                          </span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full ${impact >= 0 ? 'bg-emerald-400' : 'bg-red-400'}`} 
                            style={{ width: `${Math.min(100, Math.abs(impact) / Math.max(kpis.totalGain, kpis.totalLoss) * 100)}%` }} 
                          />
                        </div>
                      </div>
                    ))}
                    {Object.keys(kpis.productImpacts).length === 0 && (
                      <div className="text-center py-6 text-sm text-slate-500 font-medium">No price changes recorded yet.</div>
                    )}
                  </div>
                </div>

                {/* Info Block */}
                <div className="bg-slate-50 rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
                  <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                    <Info className="h-4 w-4 text-slate-400" />
                    How Revaluation Works
                  </h3>
                  <p className="text-sm text-slate-600 leading-relaxed font-medium">
                    Inventory Revaluation occurs automatically whenever a product's price is updated in the Price Management center. 
                  </p>
                  <p className="text-sm text-slate-600 leading-relaxed font-medium">
                    The system calculates the exact physical stock you are holding at the exact moment the price is changed.
                  </p>
                  <div className="bg-slate-800 text-slate-200 p-3 rounded-lg font-mono text-xs">
                    Revaluation Impact = (New Rate - Old Rate) × Stock On Hand
                  </div>
                  <p className="text-sm text-slate-600 leading-relaxed font-medium">
                    If OGRA increases the price by Rs 10 and you have 5000 Liters in your tanks, you instantly gain Rs 50,000 in "Hidden Profit" (Revaluation Reserve).
                  </p>
                </div>
              </div>
            )}

            {activeTab === 'revaluation_ledger' && (
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Comprehensive Price Revision Ledger</h3>
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2 h-4 w-4 text-slate-400" />
                    <input 
                      type="text" 
                      placeholder="Search reason or user..."
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      className="pl-8 pr-3 py-1.5 border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white w-64"
                    />
                  </div>
                </div>

                <div className="overflow-x-auto max-h-[400px]">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-white sticky top-0 z-10 shadow-sm">
                      <tr className="border-b border-slate-100 text-[10px] uppercase tracking-wider font-black text-slate-400">
                        <th className="p-3">Date / Time</th>
                        <th className="p-3">Product</th>
                        <th className="p-3 text-center">Rate Shift</th>
                        <th className="p-3 text-right">Stock On Hand</th>
                        <th className="p-3 text-right">Value Impact</th>
                        <th className="p-3">Reason / Authority</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {processedRateHistory.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="p-8 text-center text-slate-500 text-sm font-medium">
                            No price revisions found matching your criteria.
                          </td>
                        </tr>
                      ) : (
                        processedRateHistory.map((txn) => {
                          const prod = products.find(p => p.id === txn.productId);
                          const impact = txn.revaluationImpact || 0;
                          return (
                            <tr key={txn.id} className="hover:bg-slate-50/50 transition-colors">
                              <td className="p-3">
                                <div className="font-bold text-slate-700 text-xs">{new Date(txn.timestamp).toLocaleDateString()}</div>
                                <div className="text-[10px] font-medium text-slate-400">{new Date(txn.timestamp).toLocaleTimeString()}</div>
                              </td>
                              <td className="p-3">
                                <div className="font-bold text-slate-800 text-xs">{prod?.name || 'Unknown'}</div>
                              </td>
                              <td className="p-3">
                                <div className="flex items-center justify-center gap-2">
                                  <span className="font-mono text-xs text-slate-500">{txn.oldRate.toFixed(2)}</span>
                                  <ArrowRightLeft className="h-3 w-3 text-slate-300" />
                                  <span className="font-mono text-xs font-bold text-slate-900">{txn.newRate.toFixed(2)}</span>
                                </div>
                                <div className={`text-[10px] font-bold text-center mt-0.5 ${txn.newRate > txn.oldRate ? 'text-emerald-600' : 'text-red-600'}`}>
                                  {txn.newRate > txn.oldRate ? '+' : ''}{(txn.newRate - txn.oldRate).toFixed(2)} Rs
                                </div>
                              </td>
                              <td className="p-3 text-right">
                                <span className="font-mono text-xs font-bold text-slate-700">{txn.stockOnHand?.toLocaleString() || 0}</span>
                              </td>
                              <td className="p-3 text-right">
                                <span className={`font-mono text-xs font-black px-2 py-1 rounded-md ${impact >= 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                                  {impact >= 0 ? '+' : ''}{formatCurrency(impact, settings)}
                                </span>
                              </td>
                              <td className="p-3">
                                <div className="font-bold text-slate-700 text-xs truncate max-w-full max-w-[150px]">{txn.reason}</div>
                                <div className="text-[10px] font-medium text-slate-400">{txn.changedBy}</div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
