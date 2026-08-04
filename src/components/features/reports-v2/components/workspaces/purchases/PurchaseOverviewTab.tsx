/**
 * @license SPDX-License-Identifier: Apache-2.0
 *
 * FuelPro Enterprise Business Operating System v4.0
 * PurchaseOverviewTab — Purchases & Procurement Control Room Dashboard
 *
 * Pixel-for-pixel match with reference mockup design:
 * - 5 Top Stat KPI Cards
 * - Purchase Trend (This Month) Dual Line Chart
 * - Purchase by Product (Liters) Donut Breakdown Chart
 * - Recent Bowser Deliveries List with Status Badges
 * - Recent Purchase Invoices Table with Search & Status Chips
 * - Smart Alerts Panel with Direct Action Triggers
 * - Bottom Quick Action Launcher Strip
 */

import React, { useState } from 'react';
import {
  TrendingUp, TrendingDown, ShoppingCart, Truck, AlertTriangle, ArrowUpRight,
  FileText, CheckCircle2, DollarSign, Plus, Search, Filter, ShieldCheck, Tag,
  Clock, CreditCard, ExternalLink, Sparkles, ChevronRight, Layers
} from 'lucide-react';

interface PurchaseOverviewTabProps {
  lang: 'en' | 'ur';
  onSelectTab: (tabId: string) => void;
  onOpenInspector: (record: Record<string, any>) => void;
}

export const PurchaseOverviewTab: React.FC<PurchaseOverviewTabProps> = ({
  lang,
  onSelectTab,
  onOpenInspector,
}) => {
  const isEn = lang === 'en';
  const [tableSearch, setTableSearch] = useState('');

  // Mock / Realtime Purchases Data
  const recentInvoices = [
    { id: 'INV-2025-0515-001', date: '15 May 2025', supplier: 'PSO', logo: '⛽', product: 'Petrol', liters: '16,000.00', rate: '296.45', amount: '4,743,200', status: 'Verified', payment: 'Partial' },
    { id: 'INV-2025-0515-002', date: '15 May 2025', supplier: 'Shell', logo: '🐚', product: 'Diesel', liters: '12,000.00', rate: '311.80', amount: '3,741,600', status: 'Verified', payment: 'Unpaid' },
    { id: 'INV-2025-0514-003', date: '14 May 2025', supplier: 'Attock', logo: '🛢️', product: 'Petrol', liters: '14,000.00', rate: '296.45', amount: '4,150,300', status: 'Verified', payment: 'Unpaid' },
    { id: 'INV-2025-0514-004', date: '14 May 2025', supplier: 'Total', logo: '⛽', product: 'Diesel', liters: '18,000.00', rate: '312.10', amount: '5,617,800', status: 'Verified', payment: 'Paid' },
    { id: 'INV-2025-0513-005', date: '13 May 2025', supplier: 'PSO', logo: '⛽', product: 'Kerosene', liters: '2,500.00', rate: '192.00', amount: '480,000', status: 'Verified', payment: 'Paid' },
  ];

  const recentBowserDeliveries = [
    { id: 'BW-2025-0515-001', supplier: 'PSO', product: 'Petrol', liters: '16,000 L', arrival: '09:24 AM', driver: 'Rashid Khan', status: 'Arrived', color: 'emerald' },
    { id: 'BW-2025-0515-002', supplier: 'Shell', product: 'Diesel', liters: '12,000 L', arrival: 'ETA: 11:45 AM', driver: 'Imran Ali', status: 'In Transit', color: 'sky' },
    { id: 'BW-2025-0515-003', supplier: 'Attock', product: 'Petrol', liters: '14,000 L', arrival: 'Departed: 08:10 AM', driver: 'Asif', status: 'Dispatched', color: 'amber' },
    { id: 'BW-2025-0514-004', supplier: 'Total', product: 'Diesel', liters: '18,000 L', arrival: 'Completed: 06:30 AM', driver: 'Zahid', status: 'Completed', color: 'slate' },
  ];

  return (
    <div className="space-y-4 font-sans text-slate-800">
      {/* ── 1. TOP 5 STAT KPI CARDS ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {/* Card 1: Total Purchases Today */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-4 flex flex-col justify-between shadow-xs hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-slate-500 uppercase tracking-wider">Total Purchases (Today)</span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <ShoppingCart size={16} />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-black text-slate-900 tracking-tight">Rs 8,450,000</div>
            <div className="flex items-center gap-1 mt-1 text-[11px] font-bold text-emerald-600">
              <TrendingUp size={13} />
              <span>vs Yesterday +12.4%</span>
            </div>
          </div>
        </div>

        {/* Card 2: Liters Purchased Today */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-4 flex flex-col justify-between shadow-xs hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-slate-500 uppercase tracking-wider">Liters Purchased (Today)</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Truck size={16} />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-black text-slate-900 tracking-tight">28,500.00 L</div>
            <div className="flex items-center gap-1 mt-1 text-[11px] font-bold text-emerald-600">
              <TrendingUp size={13} />
              <span>vs Yesterday +9.8%</span>
            </div>
          </div>
        </div>

        {/* Card 3: Avg Cost / Liter */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-4 flex flex-col justify-between shadow-xs hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-slate-500 uppercase tracking-wider">Avg. Cost / Liter</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <TrendingUp size={16} />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-black text-slate-900 tracking-tight">Rs 297.37</div>
            <div className="flex items-center gap-1 mt-1 text-[11px] font-bold text-rose-600">
              <TrendingDown size={13} />
              <span>vs Yesterday -1.3%</span>
            </div>
          </div>
        </div>

        {/* Card 4: Active Purchase Orders */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-4 flex flex-col justify-between shadow-xs hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-slate-500 uppercase tracking-wider">Active Purchase Orders</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <FileText size={16} />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-black text-slate-900 tracking-tight">7</div>
            <div className="flex items-center gap-1 mt-1 text-[11px] font-bold text-emerald-600">
              <TrendingUp size={13} />
              <span>vs Yesterday +2</span>
            </div>
          </div>
        </div>

        {/* Card 5: Pending Payments */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-4 flex flex-col justify-between shadow-xs hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-slate-500 uppercase tracking-wider">Pending Payments</span>
            <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <CreditCard size={16} />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-black text-slate-900 tracking-tight">Rs 12,680,000</div>
            <div className="flex items-center gap-1 mt-1 text-[11px] font-bold text-rose-600">
              <TrendingUp size={13} />
              <span>vs Yesterday +8.7%</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── 2. MIDDLE 3-COLUMN SECTION ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Column 1: Purchase Trend (This Month) - Dual Line Chart */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider">Purchase Trend (This Month)</h2>
              <div className="flex items-center gap-4 mt-1 text-xs font-extrabold text-slate-500">
                <span className="flex items-center gap-1.5"><span className="w-3 h-1 bg-[#0B5C3D] rounded-full"></span> Amount (Rs)</span>
                <span className="flex items-center gap-1.5"><span className="w-3 h-1 bg-emerald-400 rounded-full"></span> Liters (L)</span>
              </div>
            </div>
            <button onClick={() => onSelectTab('analytics')} className="text-xs font-bold text-[#0B5C3D] hover:underline flex items-center gap-1 cursor-pointer">
              View Analytics →
            </button>
          </div>

          {/* Dual Line SVG Mockup Graph */}
          <div className="py-4">
            <div className="h-44 w-full relative">
              <svg className="w-full h-full overflow-visible" viewBox="0 0 400 150">
                <defs>
                  <linearGradient id="amountGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#0B5C3D" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#0B5C3D" stopOpacity="0.0" />
                  </linearGradient>
                </defs>
                {/* Grid lines */}
                <line x1="0" y1="30" x2="400" y2="30" stroke="#f1f5f9" strokeWidth="1" />
                <line x1="0" y1="75" x2="400" y2="75" stroke="#f1f5f9" strokeWidth="1" />
                <line x1="0" y1="120" x2="400" y2="120" stroke="#f1f5f9" strokeWidth="1" />
                {/* Area under amount line */}
                <path d="M 0 120 Q 80 80 150 100 T 300 40 T 400 60 L 400 140 L 0 140 Z" fill="url(#amountGrad)" />
                {/* Amount Line */}
                <path d="M 0 120 Q 80 80 150 100 T 300 40 T 400 60" fill="none" stroke="#0B5C3D" strokeWidth="3" strokeLinecap="round" />
                {/* Liters Line */}
                <path d="M 0 100 Q 80 110 150 70 T 300 80 T 400 30" fill="none" stroke="#34d399" strokeWidth="2.5" strokeDasharray="4 4" />
                {/* Points */}
                <circle cx="150" cy="100" r="4" fill="#0B5C3D" />
                <circle cx="300" cy="40" r="4" fill="#0B5C3D" />
                <circle cx="400" cy="60" r="4" fill="#0B5C3D" />
              </svg>
            </div>
            <div className="flex justify-between text-[11px] font-bold text-slate-400 mt-2 px-1">
              <span>1 May</span>
              <span>5 May</span>
              <span>10 May</span>
              <span>15 May</span>
            </div>
          </div>
        </div>

        {/* Column 2: Purchase by Product (Liters) Donut Chart */}
        <div className="lg:col-span-3 bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-xs flex flex-col justify-between">
          <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider pb-3 border-b border-slate-100">
            Purchase by Product (Liters)
          </h2>

          <div className="py-3 flex flex-col items-center justify-center">
            {/* Donut CSS Circle */}
            <div className="relative w-32 h-32 rounded-full border-12 border-emerald-500 flex items-center justify-center shadow-inner" style={{ borderTopColor: '#3b82f6', borderRightColor: '#f59e0b', borderBottomColor: '#94a3b8' }}>
              <div className="text-center">
                <span className="text-[10px] font-extrabold text-slate-400 block uppercase">Total</span>
                <span className="text-xs font-black text-slate-900">28,500 L</span>
              </div>
            </div>
          </div>

          <div className="space-y-1.5 text-xs font-extrabold">
            <div className="flex items-center justify-between text-slate-700">
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Petrol</span>
              <span>14,905.00 L (52.3%)</span>
            </div>
            <div className="flex items-center justify-between text-slate-700">
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span> Diesel</span>
              <span>10,490.00 L (36.8%)</span>
            </div>
            <div className="flex items-center justify-between text-slate-700">
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span> Kerosene</span>
              <span>2,055.00 L (7.2%)</span>
            </div>
            <div className="flex items-center justify-between text-slate-700">
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-slate-400"></span> Others</span>
              <span>1,050.00 L (3.7%)</span>
            </div>
          </div>
        </div>

        {/* Column 3: Recent Bowser Deliveries */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-xs flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider">Recent Bowser Deliveries</h2>
            <button onClick={() => onSelectTab('deliveries')} className="text-xs font-bold text-[#0B5C3D] hover:underline cursor-pointer">
              View All
            </button>
          </div>

          <div className="space-y-2.5">
            {recentBowserDeliveries.map((bw) => (
              <div key={bw.id} className="p-2.5 rounded-xl bg-slate-50/80 border border-slate-100 flex items-center justify-between hover:bg-slate-100/80 transition-all">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-emerald-100/70 text-[#0B5C3D] flex items-center justify-center">
                    <Truck size={16} />
                  </div>
                  <div>
                    <div className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                      <span>{bw.id}</span>
                      <span className="text-[10px] font-bold text-slate-500">({bw.supplier} • {bw.liters})</span>
                    </div>
                    <div className="text-[11px] font-bold text-slate-500 mt-0.5">
                      {bw.arrival} • Driver: {bw.driver}
                    </div>
                  </div>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                  bw.status === 'Arrived' ? 'bg-emerald-100 text-emerald-800' :
                  bw.status === 'In Transit' ? 'bg-sky-100 text-sky-800' :
                  bw.status === 'Dispatched' ? 'bg-amber-100 text-amber-800' : 'bg-slate-200 text-slate-700'
                }`}>
                  {bw.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── 3. BOTTOM ROW 2-COLUMN SECTION ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Column: Recent Purchase Invoices Table */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-xs space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider">Recent Purchase Invoices</h2>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search size={14} className="absolute left-2.5 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search invoice, supplier..."
                  value={tableSearch}
                  onChange={(e) => setTableSearch(e.target.value)}
                  className="pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-[#0B5C3D]"
                />
              </div>
              <button className="px-3 py-1.5 bg-slate-100 text-slate-700 text-xs font-bold rounded-xl flex items-center gap-1.5 hover:bg-slate-200 cursor-pointer">
                <Filter size={13} />
                <span>Filters</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-extrabold uppercase tracking-wider text-[10px] bg-slate-50/50">
                  <th className="py-2.5 px-3">INV #</th>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Supplier</th>
                  <th className="py-2.5 px-3">Product</th>
                  <th className="py-2.5 px-3 text-right">Liters</th>
                  <th className="py-2.5 px-3 text-right">Rate / L</th>
                  <th className="py-2.5 px-3 text-right">Amount (Rs)</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                  <th className="py-2.5 px-3 text-center">Payment</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-bold">
                {recentInvoices.map((inv) => (
                  <tr
                    key={inv.id}
                    onClick={() => onOpenInspector(inv)}
                    className="hover:bg-slate-50/80 transition-all cursor-pointer"
                  >
                    <td className="py-2.5 px-3 text-slate-900 font-black">{inv.id}</td>
                    <td className="py-2.5 px-3 text-slate-500">{inv.date}</td>
                    <td className="py-2.5 px-3 text-slate-900 flex items-center gap-1.5">
                      <span>{inv.logo}</span>
                      <span>{inv.supplier}</span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-800">{inv.product}</td>
                    <td className="py-2.5 px-3 text-right text-slate-900">{inv.liters}</td>
                    <td className="py-2.5 px-3 text-right text-slate-600">{inv.rate}</td>
                    <td className="py-2.5 px-3 text-right text-slate-900 font-black">{inv.amount}</td>
                    <td className="py-2.5 px-3 text-center">
                      <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-black border border-emerald-200">
                        {inv.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                        inv.payment === 'Paid' ? 'bg-emerald-100 text-emerald-800' :
                        inv.payment === 'Partial' ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'
                      }`}>
                        {inv.payment}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-slate-50 font-black text-slate-900 border-t border-slate-200">
                  <td colSpan={4} className="py-2.5 px-3">Total (5 Invoices)</td>
                  <td className="py-2.5 px-3 text-right">62,500.00 L</td>
                  <td className="py-2.5 px-3 text-right">—</td>
                  <td className="py-2.5 px-3 text-right text-[#0B5C3D]">18,732,900</td>
                  <td colSpan={2}></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Right Column: Smart Alerts Panel */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-xs space-y-3 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles size={15} className="text-amber-500" />
                <span>Smart Alerts</span>
              </h2>
              <button className="text-xs font-bold text-[#0B5C3D] hover:underline cursor-pointer">
                View All
              </button>
            </div>

            <div className="space-y-2.5 mt-3">
              {/* Alert 1: Low Fuel Stock */}
              <div className="p-3 rounded-xl bg-amber-50/80 border border-amber-200/80 space-y-1">
                <div className="flex items-center justify-between text-xs font-black text-amber-900">
                  <span className="flex items-center gap-1.5">
                    <AlertTriangle size={14} className="text-amber-600" />
                    <span>Low Fuel Stock</span>
                  </span>
                  <span className="text-[10px] font-bold text-amber-700">2 min ago</span>
                </div>
                <p className="text-[11px] font-bold text-amber-800">
                  Tank 'Petrol' stock is running low (2,000 L remaining).
                </p>
                <button onClick={() => onSelectTab('requisitions')} className="text-xs font-black text-[#0B5C3D] hover:underline pt-1 block cursor-pointer">
                  Create Purchase Requisition →
                </button>
              </div>

              {/* Alert 2: Rate Increased */}
              <div className="p-3 rounded-xl bg-purple-50/80 border border-purple-200/80 space-y-1">
                <div className="flex items-center justify-between text-xs font-black text-purple-900">
                  <span className="flex items-center gap-1.5">
                    <TrendingUp size={14} className="text-purple-600" />
                    <span>Rate Increased</span>
                  </span>
                  <span className="text-[10px] font-bold text-purple-700">15 min ago</span>
                </div>
                <p className="text-[11px] font-bold text-purple-800">
                  PSO Petrol rate increased by Rs 1.35 / L.
                </p>
                <button onClick={() => onSelectTab('quotations')} className="text-xs font-black text-purple-700 hover:underline pt-1 block cursor-pointer">
                  View Rate Comparison →
                </button>
              </div>

              {/* Alert 3: GRN Pending */}
              <div className="p-3 rounded-xl bg-sky-50/80 border border-sky-200/80 space-y-1">
                <div className="flex items-center justify-between text-xs font-black text-sky-900">
                  <span className="flex items-center gap-1.5">
                    <FileText size={14} className="text-sky-600" />
                    <span>GRN Pending</span>
                  </span>
                  <span className="text-[10px] font-bold text-sky-700">25 min ago</span>
                </div>
                <p className="text-[11px] font-bold text-sky-800">
                  2 GRN receipts are pending verification.
                </p>
                <button onClick={() => onSelectTab('grn')} className="text-xs font-black text-sky-700 hover:underline pt-1 block cursor-pointer">
                  Verify Receipts →
                </button>
              </div>

              {/* Alert 4: Invoice Mismatch */}
              <div className="p-3 rounded-xl bg-rose-50/80 border border-rose-200/80 space-y-1">
                <div className="flex items-center justify-between text-xs font-black text-rose-900">
                  <span className="flex items-center gap-1.5">
                    <AlertTriangle size={14} className="text-rose-600" />
                    <span>Invoice Mismatch</span>
                  </span>
                  <span className="text-[10px] font-bold text-rose-700">1 hour ago</span>
                </div>
                <p className="text-[11px] font-bold text-rose-800">
                  1 invoice has quantity variance.
                </p>
                <button onClick={() => onSelectTab('register')} className="text-xs font-black text-rose-700 hover:underline pt-1 block cursor-pointer">
                  View Invoice Verification →
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── 4. BOTTOM QUICK LAUNCHER STRIP ── */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-3 shadow-xs grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
        <button onClick={() => onSelectTab('orders')} className="p-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-100 flex items-center gap-2 text-left transition-all cursor-pointer">
          <FileText size={16} className="text-[#0B5C3D]" />
          <div>
            <div className="text-xs font-black text-slate-900">New PO</div>
            <div className="text-[10px] font-bold text-slate-400">Create new PO</div>
          </div>
        </button>

        <button onClick={() => onSelectTab('grn')} className="p-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-100 flex items-center gap-2 text-left transition-all cursor-pointer">
          <ShieldCheck size={16} className="text-blue-600" />
          <div>
            <div className="text-xs font-black text-slate-900">Record GRN</div>
            <div className="text-[10px] font-bold text-slate-400">Goods receipt note</div>
          </div>
        </button>

        <button onClick={() => onSelectTab('quotations')} className="p-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-100 flex items-center gap-2 text-left transition-all cursor-pointer">
          <Tag size={16} className="text-purple-600" />
          <div>
            <div className="text-xs font-black text-slate-900">Compare Rates</div>
            <div className="text-[10px] font-bold text-slate-400">Supplier comparison</div>
          </div>
        </button>

        <button onClick={() => onSelectTab('suppliers')} className="p-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-100 flex items-center gap-2 text-left transition-all cursor-pointer">
          <Truck size={16} className="text-amber-600" />
          <div>
            <div className="text-xs font-black text-slate-900">Supplier Ledger</div>
            <div className="text-[10px] font-bold text-slate-400">View payables</div>
          </div>
        </button>

        <button onClick={() => onSelectTab('payments')} className="p-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-100 flex items-center gap-2 text-left transition-all cursor-pointer">
          <CreditCard size={16} className="text-emerald-600" />
          <div>
            <div className="text-xs font-black text-slate-900">Create Payment</div>
            <div className="text-[10px] font-bold text-slate-400">Pay supplier</div>
          </div>
        </button>

        <button onClick={() => onSelectTab('documents')} className="p-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-100 flex items-center gap-2 text-left transition-all cursor-pointer">
          <Layers size={16} className="text-slate-600" />
          <div>
            <div className="text-xs font-black text-slate-900">Documents</div>
            <div className="text-[10px] font-bold text-slate-400">All documents</div>
          </div>
        </button>
      </div>
    </div>
  );
};
