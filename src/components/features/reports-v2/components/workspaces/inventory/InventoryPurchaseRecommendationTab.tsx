/**
 * @license SPDX-License-Identifier: Apache-2.0
 *
 * FuelPro Enterprise Business Operating System v4.0
 * InventoryPurchaseRecommendationTab — AI Purchase Order Advisor & OMC Supplier Rate Matrix
 *
 * Implements Enterprise Rules #148 & #160
 */

import React from 'react';
import { ShoppingCart, Award, Clock, DollarSign, Truck, AlertCircle } from 'lucide-react';

interface InventoryPurchaseRecommendationTabProps {
  lang: 'en' | 'ur';
  onSelectReport?: (reportId: string) => void;
}

export const InventoryPurchaseRecommendationTab: React.FC<InventoryPurchaseRecommendationTabProps> = ({
  lang,
  onSelectReport,
}) => {
  const isEn = lang === 'en';

  const omcSuppliers = [
    {
      name: 'Pakistan State Oil (PSO)',
      logo: '🇵🇰',
      superPrice: 285.00,
      dieselPrice: 275.00,
      creditDays: '30 Days',
      deliveryEta: '4 Hours',
      rating: '4.9 ★',
      status: 'RECOMMENDED_BEST',
    },
    {
      name: 'Shell Pakistan',
      logo: '🐚',
      superPrice: 286.50,
      dieselPrice: 276.20,
      creditDays: '15 Days',
      deliveryEta: '6 Hours',
      rating: '4.8 ★',
      status: 'AVAILABLE',
    },
    {
      name: 'TotalEnergies / PARCO',
      logo: '🔴',
      superPrice: 287.00,
      dieselPrice: 277.00,
      creditDays: '7 Days',
      deliveryEta: '8 Hours',
      rating: '4.7 ★',
      status: 'AVAILABLE',
    },
    {
      name: 'Attock Petroleum (APL)',
      logo: '⛽',
      superPrice: 284.80,
      dieselPrice: 274.50,
      creditDays: 'Cash / Advanced',
      deliveryEta: '12 Hours',
      rating: '4.6 ★',
      status: 'CASH_ONLY',
    },
  ];

  const recommendations = [
    {
      product: 'Super Petrol',
      tank: 'Super Petrol Tank #1',
      currentStock: 2000,
      reorderThreshold: 3000,
      dailyConsumption: 1000,
      daysRemaining: 2.0,
      recommendedOrderLiters: 18000,
      bestSupplier: 'Pakistan State Oil (PSO)',
      estimatedRate: 285,
      estimatedTotalCost: 5130000,
      urgency: 'HIGH_CRITICAL',
      reason: 'Stock will reach critical dry level in 48 hours based on weekend traffic velocity.',
    },
    {
      product: 'High Speed Diesel',
      tank: 'High Speed Diesel Tank #2',
      currentStock: 5000,
      reorderThreshold: 4000,
      dailyConsumption: 980,
      daysRemaining: 5.1,
      recommendedOrderLiters: 15000,
      bestSupplier: 'Shell Pakistan',
      estimatedRate: 275,
      estimatedTotalCost: 4125000,
      urgency: 'NORMAL_SCHEDULED',
      reason: 'Stock is currently healthy. Recommended order window: 3 days.',
    },
  ];

  return (
    <div className="space-y-5">
      {/* AI ADVISOR BANNER */}
      <div className="bg-indigo-900 text-white p-5 rounded-2xl border border-indigo-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-800 border border-indigo-700 flex items-center justify-center text-2xl font-bold">
            🤖
          </div>
          <div>
            <h2 className="text-base font-black text-white">AI Purchase Order Advisor & Procurement Engine (Rules #148 & #160)</h2>
            <p className="text-xs font-semibold text-indigo-200 mt-0.5">
              Automated reorder velocity analysis, OMC rate matrix optimization, and fuel bowser shipment sizing.
            </p>
          </div>
        </div>

        <button
          onClick={() => onSelectReport?.('PUR_REGISTER')}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black rounded-xl shadow-xs transition-all cursor-pointer whitespace-nowrap"
        >
          + Create Purchase Order ↗
        </button>
      </div>

      {/* OMC SUPPLIER RATE & CREDIT COMPARISON MATRIX (RULE #160) */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
        <div className="flex justify-between items-center pb-2 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
              📊 OMC Supplier Rate & Credit Comparison Matrix (Rule #160)
            </h3>
            <p className="text-xs font-bold text-slate-400">Live rate comparison across all registered OMC oil suppliers</p>
          </div>
          <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black">LIVE OMC RATES</span>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-700 uppercase font-black text-[11px] border-b border-slate-200">
              <tr>
                <th className="p-3">OMC Supplier</th>
                <th className="p-3 text-right">Super Petrol Rate</th>
                <th className="p-3 text-right">Diesel Rate</th>
                <th className="p-3 text-center">Credit Days</th>
                <th className="p-3 text-center">Delivery ETA</th>
                <th className="p-3 text-center">Vendor Rating</th>
                <th className="p-3 text-center">Recommendation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-bold text-slate-800">
              {omcSuppliers.map((s, idx) => (
                <tr key={idx} className={s.status === 'RECOMMENDED_BEST' ? 'bg-emerald-50/50' : 'hover:bg-slate-50'}>
                  <td className="p-3 font-extrabold text-slate-900 flex items-center gap-2">
                    <span className="text-base">{s.logo}</span>
                    <span>{s.name}</span>
                  </td>
                  <td className="p-3 text-right font-black text-indigo-900">₨ {s.superPrice.toFixed(2)}/L</td>
                  <td className="p-3 text-right font-black text-indigo-900">₨ {s.dieselPrice.toFixed(2)}/L</td>
                  <td className="p-3 text-center text-slate-600">{s.creditDays}</td>
                  <td className="p-3 text-center text-slate-600">{s.deliveryEta}</td>
                  <td className="p-3 text-center text-amber-600 font-extrabold">{s.rating}</td>
                  <td className="p-3 text-center">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black ${
                      s.status === 'RECOMMENDED_BEST'
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : 'bg-slate-100 text-slate-700'
                    }`}>
                      {s.status === 'RECOMMENDED_BEST' ? '★ OPTIMAL CHOICE' : 'AVAILABLE'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* RECOMMENDATIONS CARDS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {recommendations.map((rec, i) => (
          <div key={i} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-xs font-black text-slate-400 uppercase tracking-wider">{rec.tank}</span>
                <h3 className="text-lg font-black text-slate-900">{rec.product}</h3>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-black ${
                rec.urgency === 'HIGH_CRITICAL'
                  ? 'bg-red-100 text-red-800 border border-red-200 animate-pulse'
                  : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
              }`}>
                {rec.urgency === 'HIGH_CRITICAL' ? '⚠️ NEED IMMEDIATE PURCHASE' : '🟢 SCHEDULED'}
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700">
              💡 <span className="font-bold text-slate-900">AI Reasoning:</span> {rec.reason}
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs font-bold">
              <div className="p-3 rounded-xl bg-slate-50">
                <span className="text-slate-400 block text-[11px]">Current Stock</span>
                <span className="font-black text-slate-900 text-sm">{rec.currentStock.toLocaleString()} L ({rec.daysRemaining} Days)</span>
              </div>
              <div className="p-3 rounded-xl bg-indigo-50 text-indigo-900">
                <span className="text-indigo-600 block text-[11px]">Recommended Bowser Order</span>
                <span className="font-black text-indigo-900 text-sm">{rec.recommendedOrderLiters.toLocaleString()} L</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50">
                <span className="text-slate-400 block text-[11px]">Optimal OMC Supplier</span>
                <span className="font-black text-slate-900">{rec.bestSupplier}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50">
                <span className="text-slate-400 block text-[11px]">Estimated Order Cost</span>
                <span className="font-black text-indigo-700 text-sm">₨ {rec.estimatedTotalCost.toLocaleString()}</span>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => onSelectReport?.('PUR_REGISTER')}
                className="w-full py-2.5 rounded-xl bg-[#0B5C3D] hover:bg-emerald-800 text-white text-xs font-black transition-all shadow-xs cursor-pointer flex items-center justify-center gap-2"
              >
                <ShoppingCart size={15} />
                <span>Issue Fuel Bowser Purchase Requisition</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
