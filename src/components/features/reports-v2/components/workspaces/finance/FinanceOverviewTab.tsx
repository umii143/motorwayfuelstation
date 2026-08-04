/**
 * @license SPDX-License-Identifier: Apache-2.0
 *
 * FuelPro Enterprise Business Operating System v4.0
 * FinanceOverviewTab — Finance & Treasury Control Room Dashboard
 *
 * Pixel-for-pixel match with reference mockup design:
 * - 6 Top Stat KPI Cards (Cash in Hand, Bank Balance, Wallet Balance, Today's Income, Today's Expense, Today's Net Profit)
 * - Cash Flow Trend (This Month) Triple Line Chart (Cash In, Cash Out, Net Cash Flow) + Bottom Summaries
 * - Income vs Expense (This Month) Donut Chart + Net Profit Ratio & Profit Margin
 * - Bank Balance Overview List with Distribution Progress Bars
 * - Recent Transactions Table with Type Filter Chips & Search
 * - Smart Alerts Panel & Quick Financial Summary Box
 * - Bottom Quick Action Launcher Strip
 */

import React, { useState } from 'react';
import {
  TrendingUp, TrendingDown, DollarSign, CreditCard, Wallet, ArrowUpRight,
  ArrowDownRight, RefreshCw, FileText, CheckCircle2, AlertTriangle, Search,
  Filter, Sparkles, Building2, ChevronRight, Layers, PieChart, ShieldCheck
} from 'lucide-react';

interface FinanceOverviewTabProps {
  lang: 'en' | 'ur';
  onSelectTab: (tabId: string) => void;
  onOpenInspector: (record: Record<string, any>) => void;
}

export const FinanceOverviewTab: React.FC<FinanceOverviewTabProps> = ({
  lang,
  onSelectTab,
  onOpenInspector,
}) => {
  const isEn = lang === 'en';
  const [filterCategory, setFilterCategory] = useState<'all' | 'cash' | 'bank' | 'wallet' | 'income' | 'expense'>('all');
  const [tableSearch, setTableSearch] = useState('');

  // Recent Financial Transactions List
  const recentTransactions = [
    { id: 'CV-2025-0515-001', time: '15 May 2025 04:32 PM', type: 'Income', direction: 'in', description: 'Fuel Sales Collection (Cash Payment)', account: 'Cash In Hand', inAmt: '1,250,000', outAmt: '—', balance: '2,450,000', voucher: 'CV-2025-0515-001' },
    { id: 'PV-2025-0515-045', time: '15 May 2025 03:15 PM', type: 'Expense', direction: 'out', description: 'Fuel Purchase Payment (PSO Invoice #INV-515)', account: 'HBL Account', inAmt: '—', outAmt: '850,000', balance: '8,450,000', voucher: 'PV-2025-0515-045' },
    { id: 'CV-2025-0515-002', time: '15 May 2025 02:40 PM', type: 'Income', direction: 'in', description: 'Lubricants Sales (Cash Payment)', account: 'Cash In Hand', inAmt: '320,000', outAmt: '—', balance: '1,200,000', voucher: 'CV-2025-0515-002' },
    { id: 'TR-2025-0515-012', time: '15 May 2025 01:20 PM', type: 'Transfer', direction: 'transfer', description: 'Cash Deposit to HBL', account: 'Cash → HBL', inAmt: '—', outAmt: '500,000', balance: '—', voucher: 'TR-2025-0515-012' },
    { id: 'PV-2025-0515-044', time: '15 May 2025 11:05 AM', type: 'Expense', direction: 'out', description: 'Electricity Bill (Reference #EB-7788)', account: 'Bank Alfalah', inAmt: '—', outAmt: '125,500', balance: '3,920,000', voucher: 'PV-2025-0515-044' },
  ];

  const bankAccounts = [
    { name: 'HBL Current Account', logo: '🏦', balance: 'Rs 8,450,000', percent: 32.8, color: 'bg-emerald-500' },
    { name: 'MCB Current Account', logo: '🏦', balance: 'Rs 6,780,500', percent: 26.3, color: 'bg-emerald-500' },
    { name: 'UBL Current Account', logo: '🏦', balance: 'Rs 5,230,000', percent: 20.3, color: 'bg-emerald-500' },
    { name: 'Bank Alfalah', logo: '🏦', balance: 'Rs 3,920,000', percent: 15.2, color: 'bg-emerald-500' },
    { name: 'Meezan Bank', logo: '🏦', balance: 'Rs 1,400,000', percent: 5.4, color: 'bg-emerald-500' },
  ];

  return (
    <div className="space-y-4 font-sans text-slate-800">
      {/* ── 1. TOP 6 STAT KPI CARDS ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
        {/* Card 1: Cash In Hand */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-4 flex flex-col justify-between shadow-xs hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-slate-500 uppercase tracking-wider">Cash In Hand</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <DollarSign size={16} />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-xl font-black text-slate-900 tracking-tight">Rs 2,450,000</div>
            <div className="flex items-center gap-1 mt-1 text-[11px] font-bold text-emerald-600">
              <TrendingUp size={13} />
              <span>vs Yesterday +8.4%</span>
            </div>
          </div>
        </div>

        {/* Card 2: Bank Balance */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-4 flex flex-col justify-between shadow-xs hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-slate-500 uppercase tracking-wider">Bank Balance</span>
            <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
              <Building2 size={16} />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-xl font-black text-slate-900 tracking-tight">Rs 25,780,500</div>
            <div className="flex items-center gap-1 mt-1 text-[11px] font-bold text-emerald-600">
              <TrendingUp size={13} />
              <span>vs Yesterday +5.7%</span>
            </div>
          </div>
        </div>

        {/* Card 3: Wallet Balance */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-4 flex flex-col justify-between shadow-xs hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-slate-500 uppercase tracking-wider">Wallet Balance</span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Wallet size={16} />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-xl font-black text-slate-900 tracking-tight">Rs 1,890,250</div>
            <div className="flex items-center gap-1 mt-1 text-[11px] font-bold text-emerald-600">
              <TrendingUp size={13} />
              <span>vs Yesterday +3.2%</span>
            </div>
          </div>
        </div>

        {/* Card 4: Today's Income */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-4 flex flex-col justify-between shadow-xs hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-slate-500 uppercase tracking-wider">Today's Income</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <ArrowUpRight size={16} />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-xl font-black text-slate-900 tracking-tight">Rs 6,540,300</div>
            <div className="flex items-center gap-1 mt-1 text-[11px] font-bold text-emerald-600">
              <TrendingUp size={13} />
              <span>vs Yesterday +12.6%</span>
            </div>
          </div>
        </div>

        {/* Card 5: Today's Expense */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-4 flex flex-col justify-between shadow-xs hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-slate-500 uppercase tracking-wider">Today's Expense</span>
            <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <ArrowDownRight size={16} />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-xl font-black text-slate-900 tracking-tight">Rs 3,245,600</div>
            <div className="flex items-center gap-1 mt-1 text-[11px] font-bold text-rose-600">
              <TrendingDown size={13} />
              <span>vs Yesterday -4.8%</span>
            </div>
          </div>
        </div>

        {/* Card 6: Today's Net Profit */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-4 flex flex-col justify-between shadow-xs hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-slate-500 uppercase tracking-wider">Today's Net Profit</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Sparkles size={16} />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-xl font-black text-[#0B5C3D] tracking-tight">Rs 3,294,700</div>
            <div className="flex items-center gap-1 mt-1 text-[11px] font-bold text-emerald-600">
              <TrendingUp size={13} />
              <span>vs Yesterday +28.1%</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── 2. MIDDLE 3-COLUMN SECTION ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Column 1: Cash Flow Trend (This Month) - Triple Line Chart */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-xs flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div>
              <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider">Cash Flow Trend (This Month)</h2>
              <div className="flex items-center gap-3 mt-1 text-[11px] font-extrabold text-slate-500">
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Cash In</span>
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span> Cash Out</span>
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span> Net Cash Flow</span>
              </div>
            </div>
            <select className="px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-[11px] font-extrabold text-slate-700">
              <option>This Month ▾</option>
            </select>
          </div>

          {/* SVG Triple Line Graph */}
          <div className="py-2">
            <div className="h-40 w-full relative">
              <svg className="w-full h-full overflow-visible" viewBox="0 0 400 150">
                <line x1="0" y1="30" x2="400" y2="30" stroke="#f1f5f9" strokeWidth="1" />
                <line x1="0" y1="75" x2="400" y2="75" stroke="#f1f5f9" strokeWidth="1" />
                <line x1="0" y1="120" x2="400" y2="120" stroke="#f1f5f9" strokeWidth="1" />
                {/* Cash In (Green) */}
                <path d="M 0 50 Q 100 30 200 60 T 400 30" fill="none" stroke="#10b981" strokeWidth="2.5" />
                {/* Cash Out (Red) */}
                <path d="M 0 90 Q 100 80 200 100 T 400 85" fill="none" stroke="#f43f5e" strokeWidth="2.5" />
                {/* Net Flow (Blue) */}
                <path d="M 0 120 Q 100 110 200 90 T 400 65" fill="none" stroke="#3b82f6" strokeWidth="2.5" strokeDasharray="3 3" />
              </svg>
            </div>
            <div className="flex justify-between text-[11px] font-bold text-slate-400 mt-1 px-1">
              <span>1 May</span>
              <span>5 May</span>
              <span>10 May</span>
              <span>15 May</span>
            </div>
          </div>

          {/* Bottom Summaries */}
          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100">
            <div className="p-2 rounded-xl bg-emerald-50 text-center">
              <span className="text-[10px] font-extrabold text-emerald-800 block">Total Cash In</span>
              <span className="text-xs font-black text-emerald-900">Rs 128.45M</span>
            </div>
            <div className="p-2 rounded-xl bg-rose-50 text-center">
              <span className="text-[10px] font-extrabold text-rose-800 block">Total Cash Out</span>
              <span className="text-xs font-black text-rose-900">Rs 89.32M</span>
            </div>
            <div className="p-2 rounded-xl bg-blue-50 text-center">
              <span className="text-[10px] font-extrabold text-blue-800 block">Net Cash Flow</span>
              <span className="text-xs font-black text-blue-900">Rs 39.13M</span>
            </div>
          </div>
        </div>

        {/* Column 2: Income vs Expense (This Month) Donut Chart */}
        <div className="lg:col-span-3 bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-xs flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider">Income vs Expense (This Month)</h2>
            <select className="px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-[11px] font-extrabold text-slate-700">
              <option>This Month ▾</option>
            </select>
          </div>

          <div className="py-2 flex flex-col items-center justify-center">
            <div className="relative w-32 h-32 rounded-full border-12 border-emerald-500 flex items-center justify-center shadow-inner" style={{ borderTopColor: '#3b82f6', borderRightColor: '#f43f5e' }}>
              <div className="text-center">
                <span className="text-[10px] font-extrabold text-slate-400 block uppercase">Net Profit</span>
                <span className="text-xs font-black text-[#0B5C3D]">Rs 39.13M</span>
                <span className="text-[9px] font-bold text-emerald-600 block">31.2% ↗</span>
              </div>
            </div>
          </div>

          <div className="space-y-1.5 text-xs font-extrabold border-t border-slate-100 pt-2">
            <div className="flex items-center justify-between text-slate-700">
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Total Income</span>
              <span>Rs 128.45M</span>
            </div>
            <div className="flex items-center justify-between text-slate-700">
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span> Total Expense</span>
              <span>Rs 89.32M</span>
            </div>
            <div className="flex items-center justify-between text-slate-900 font-black pt-1 border-t border-slate-100">
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span> Net Profit</span>
              <span className="text-[#0B5C3D]">Rs 39.13M</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-[11px] font-extrabold text-slate-600">
            <div>Income / Expense Ratio: <span className="font-black text-slate-900 block">1.44 : 1</span></div>
            <div>Profit Margin: <span className="font-black text-emerald-700 block">30.5%</span></div>
          </div>
        </div>

        {/* Column 3: Bank Balance Overview */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-xs flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider">Bank Balance Overview</h2>
            <button onClick={() => onSelectTab('banks')} className="text-xs font-bold text-[#0B5C3D] hover:underline cursor-pointer">
              View All
            </button>
          </div>

          <div className="space-y-2.5">
            {bankAccounts.map((b) => (
              <div key={b.name} className="space-y-1">
                <div className="flex items-center justify-between text-xs font-extrabold">
                  <span className="flex items-center gap-1.5">
                    <span>{b.logo}</span>
                    <span className="text-slate-900">{b.name}</span>
                  </span>
                  <span className="font-black text-slate-900">{b.balance} <span className="text-[10px] text-slate-400 font-normal">({b.percent}%)</span></span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div className={`h-full ${b.color}`} style={{ width: `${b.percent * 2.5}%` }}></div>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between font-black text-xs">
            <span className="text-slate-600">Total Bank Balance</span>
            <span className="text-slate-900 text-sm">Rs 25,780,500</span>
          </div>
        </div>
      </div>

      {/* ── 3. BOTTOM ROW 2-COLUMN SECTION ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Column: Recent Transactions Table */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-xs space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider mr-2">Recent Transactions</h2>
              {['all', 'cash', 'bank', 'wallet', 'income', 'expense'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setFilterCategory(cat as any)}
                  className={`px-2.5 py-1 rounded-xl text-xs font-extrabold capitalize transition-all cursor-pointer ${
                    filterCategory === cat
                      ? 'bg-emerald-100 text-[#0B5C3D] font-black'
                      : 'text-slate-500 hover:bg-slate-100'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
            <div className="relative">
              <Search size={14} className="absolute left-2.5 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search transactions..."
                value={tableSearch}
                onChange={(e) => setTableSearch(e.target.value)}
                className="pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-[#0B5C3D]"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-extrabold uppercase tracking-wider text-[10px] bg-slate-50/50">
                  <th className="py-2.5 px-3">Date & Time</th>
                  <th className="py-2.5 px-3">Type</th>
                  <th className="py-2.5 px-3">Description</th>
                  <th className="py-2.5 px-3">Account</th>
                  <th className="py-2.5 px-3 text-right">In (Rs)</th>
                  <th className="py-2.5 px-3 text-right">Out (Rs)</th>
                  <th className="py-2.5 px-3 text-right">Balance (Rs)</th>
                  <th className="py-2.5 px-3 text-center">Voucher #</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-bold">
                {recentTransactions.map((txn) => (
                  <tr
                    key={txn.id}
                    onClick={() => onOpenInspector(txn)}
                    className="hover:bg-slate-50/80 transition-all cursor-pointer"
                  >
                    <td className="py-2.5 px-3 text-slate-500">{txn.time}</td>
                    <td className="py-2.5 px-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-black flex items-center gap-1 w-max ${
                        txn.direction === 'in' ? 'bg-emerald-100 text-emerald-800' :
                        txn.direction === 'out' ? 'bg-rose-100 text-rose-800' : 'bg-sky-100 text-sky-800'
                      }`}>
                        {txn.direction === 'in' ? '↑ Income' : txn.direction === 'out' ? '↓ Expense' : '⇆ Transfer'}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-900 font-black">{txn.description}</td>
                    <td className="py-2.5 px-3 text-slate-700">{txn.account}</td>
                    <td className="py-2.5 px-3 text-right text-emerald-700 font-black">{txn.inAmt}</td>
                    <td className="py-2.5 px-3 text-right text-rose-600 font-black">{txn.outAmt}</td>
                    <td className="py-2.5 px-3 text-right text-slate-900 font-black">{txn.balance}</td>
                    <td className="py-2.5 px-3 text-center text-slate-500 font-mono text-[11px]">{txn.voucher}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-slate-50 font-black text-slate-900 border-t border-slate-200">
                  <td colSpan={4} className="py-2.5 px-3">Total (Today)</td>
                  <td className="py-2.5 px-3 text-right text-emerald-700">6,540,300</td>
                  <td className="py-2.5 px-3 text-right text-rose-600">3,245,600</td>
                  <td colSpan={2}></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Right Column: Smart Alerts Panel & Quick Summary */}
        <div className="lg:col-span-4 space-y-4">
          {/* Smart Alerts Box */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles size={15} className="text-amber-500" />
                <span>Smart Alerts</span>
              </h2>
              <button className="text-xs font-bold text-[#0B5C3D] hover:underline cursor-pointer">
                View All
              </button>
            </div>

            <div className="space-y-2.5">
              {/* Alert 1: Low Cash Alert */}
              <div className="p-3 rounded-xl bg-amber-50/80 border border-amber-200/80 space-y-1">
                <div className="flex items-center justify-between text-xs font-black text-amber-900">
                  <span className="flex items-center gap-1.5">
                    <AlertTriangle size={14} className="text-amber-600" />
                    <span>Low Cash Alert</span>
                  </span>
                  <span className="text-[10px] font-bold text-amber-700">10 min ago</span>
                </div>
                <p className="text-[11px] font-bold text-amber-800">
                  Cash in hand is below minimum limit (Rs 2,500,000).
                </p>
                <button onClick={() => onSelectTab('cash')} className="text-xs font-black text-[#0B5C3D] hover:underline pt-1 block cursor-pointer">
                  Record Cash Collection →
                </button>
              </div>

              {/* Alert 2: Upcoming Payment */}
              <div className="p-3 rounded-xl bg-emerald-50/80 border border-emerald-200/80 space-y-1">
                <div className="flex items-center justify-between text-xs font-black text-emerald-900">
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 size={14} className="text-emerald-600" />
                    <span>Upcoming Payment</span>
                  </span>
                  <span className="text-[10px] font-bold text-emerald-700">25 min ago</span>
                </div>
                <p className="text-[11px] font-bold text-emerald-800">
                  PSO payment of Rs 4,250,000 due on 17 May 2025.
                </p>
                <button onClick={() => onSelectTab('expenses')} className="text-xs font-black text-[#0B5C3D] hover:underline pt-1 block cursor-pointer">
                  View Payment Schedule →
                </button>
              </div>

              {/* Alert 3: Bank Reconciliation */}
              <div className="p-3 rounded-xl bg-sky-50/80 border border-sky-200/80 space-y-1">
                <div className="flex items-center justify-between text-xs font-black text-sky-900">
                  <span className="flex items-center gap-1.5">
                    <RefreshCw size={14} className="text-sky-600" />
                    <span>Bank Reconciliation</span>
                  </span>
                  <span className="text-[10px] font-bold text-sky-700">1 hour ago</span>
                </div>
                <p className="text-[11px] font-bold text-sky-800">
                  3 bank accounts need reconciliation.
                </p>
                <button onClick={() => onSelectTab('banks')} className="text-xs font-black text-sky-700 hover:underline pt-1 block cursor-pointer">
                  Reconcile Now →
                </button>
              </div>
            </div>
          </div>

          {/* Quick Summary Box */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-xs space-y-2">
            <h2 className="text-xs font-black text-slate-500 uppercase tracking-wider">Quick Summary</h2>
            <div className="grid grid-cols-2 gap-2 text-xs font-extrabold">
              <div className="p-2 rounded-xl bg-slate-50">
                <span className="text-[10px] text-slate-400 block">Accounts Receivable</span>
                <span className="text-slate-900 font-black">Rs 0</span>
              </div>
              <div className="p-2 rounded-xl bg-slate-50">
                <span className="text-[10px] text-slate-400 block">Accounts Payable</span>
                <span className="text-slate-900 font-black">Rs 14,250,000</span>
              </div>
              <div className="p-2 rounded-xl bg-slate-50">
                <span className="text-[10px] text-slate-400 block">Working Capital</span>
                <span className="text-slate-900 font-black">—</span>
              </div>
              <div className="p-2 rounded-xl bg-slate-50">
                <span className="text-[10px] text-slate-400 block">Current Ratio</span>
                <span className="text-emerald-700 font-black">1.62 : 1</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── 4. BOTTOM QUICK LAUNCHER STRIP ── */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-3 shadow-xs grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
        <button onClick={() => onSelectTab('cash')} className="p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-100 flex items-center gap-2 text-left transition-all cursor-pointer">
          <DollarSign size={16} className="text-[#0B5C3D]" />
          <div>
            <div className="text-xs font-black text-slate-900">Cash Book</div>
            <div className="text-[10px] font-bold text-slate-400">View cash register</div>
          </div>
        </button>

        <button onClick={() => onSelectTab('banks')} className="p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-100 flex items-center gap-2 text-left transition-all cursor-pointer">
          <Building2 size={16} className="text-blue-600" />
          <div>
            <div className="text-xs font-black text-slate-900">Bank Ledger</div>
            <div className="text-[10px] font-bold text-slate-400">View bank transactions</div>
          </div>
        </button>

        <button onClick={() => onSelectTab('income')} className="p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-100 flex items-center gap-2 text-left transition-all cursor-pointer">
          <ArrowUpRight size={16} className="text-emerald-600" />
          <div>
            <div className="text-xs font-black text-slate-900">Income Register</div>
            <div className="text-[10px] font-bold text-slate-400">View all income</div>
          </div>
        </button>

        <button onClick={() => onSelectTab('expenses')} className="p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-100 flex items-center gap-2 text-left transition-all cursor-pointer">
          <ArrowDownRight size={16} className="text-rose-600" />
          <div>
            <div className="text-xs font-black text-slate-900">Expense Register</div>
            <div className="text-[10px] font-bold text-slate-400">View all expenses</div>
          </div>
        </button>

        <button onClick={() => onSelectTab('transfers')} className="p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-100 flex items-center gap-2 text-left transition-all cursor-pointer">
          <RefreshCw size={16} className="text-purple-600" />
          <div>
            <div className="text-xs font-black text-slate-900">Journal Entries</div>
            <div className="text-[10px] font-bold text-slate-400">Add & view journals</div>
          </div>
        </button>

        <button onClick={() => onSelectTab('overview')} className="p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-100 flex items-center gap-2 text-left transition-all cursor-pointer">
          <ShieldCheck size={16} className="text-amber-600" />
          <div>
            <div className="text-xs font-black text-slate-900">Trial Balance</div>
            <div className="text-[10px] font-bold text-slate-400">View trial balance</div>
          </div>
        </button>

        <button onClick={() => onSelectTab('overview')} className="p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-100 flex items-center gap-2 text-left transition-all cursor-pointer">
          <FileText size={16} className="text-sky-600" />
          <div>
            <div className="text-xs font-black text-slate-900">Financial Reports</div>
            <div className="text-[10px] font-bold text-slate-400">View all reports</div>
          </div>
        </button>

        <button onClick={() => onSelectTab('overview')} className="p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-100 flex items-center gap-2 text-left transition-all cursor-pointer">
          <PieChart size={16} className="text-indigo-600" />
          <div>
            <div className="text-xs font-black text-slate-900">Budget & Forecast</div>
            <div className="text-[10px] font-bold text-slate-400">Plan & forecast</div>
          </div>
        </button>
      </div>
    </div>
  );
};
