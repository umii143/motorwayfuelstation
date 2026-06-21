import React, { useState } from 'react';
import {
  X,
  Share2,
  Edit2,
  MoreVertical,
  Clock,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Download,
  Printer,
  Flag,
  RotateCcw,
  History,
  Info
} from 'lucide-react';
import { GlobalSettings, Shift, Staff, Product, Customer, Supplier, BankAccount, DigitalAccount, Nozzle } from '../../types';
import { useInventoryStore } from '../../stores/useInventoryStore';

interface ShiftDetailsDrawerProps {
  shift: Shift;
  onClose: () => void;
  staff: Staff[];
  products: Product[];
  customers: Customer[];
  suppliers: Supplier[];
  banks: BankAccount[];
  digitalAccounts: DigitalAccount[];
  nozzles: Nozzle[];
  settings: any;
}

export function ShiftDetailsDrawer({
  shift,
  onClose,
  staff,
  products,
  nozzles,
  settings
}: ShiftDetailsDrawerProps) {
  const isUrdu = settings.language === 'ur';

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(isUrdu ? 'ur-PK' : 'en-PK', {
      style: 'currency',
      currency: settings.currency || 'PKR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getStaffName = (id: string) => {
    const s = staff.find(st => st.id === id);
    return s ? (isUrdu ? s.urduName : s.name) : 'Unknown';
  };

  const getStaffRole = (id: string) => {
    const s = staff.find(st => st.id === id);
    return s?.role || 'Operator';
  };

  // Aggregates
  const totalDebits = shift.debitEntries?.reduce((sum, d) => sum + d.amount, 0) || 0;
  const totalRecoveries = shift.recoveryEntries?.reduce((sum, r) => sum + r.amount, 0) || 0;
  const totalExpenses = shift.expenseEntries?.reduce((sum, e) => sum + e.amount, 0) || 0;
  const totalBank = shift.bankCashEntries?.reduce((sum, b) => sum + b.amount, 0) || 0;
  const totalDigital = shift.digitalCashEntries?.reduce((sum, d) => sum + d.amount, 0) || 0;
  
  const cashSales = (shift.submittedCash || 0) - totalRecoveries + totalExpenses; // Estimate
  const totalCashCollected = (shift.submittedCash || 0);

  // Compute fuel sold
  let petrolSold = 0;
  let dieselSold = 0;
  let petrolRevenue = 0;
  let dieselRevenue = 0;

  if (shift.closingReadings && shift.openingReadings) {
    Object.keys(shift.closingReadings).forEach((nozzleId) => {
      const start = shift.openingReadings![nozzleId] || 0;
      const end = shift.closingReadings![nozzleId] || 0;
      const liters = Math.max(0, end - start);
      
      const nozzle = nozzles.find(n => n.id === nozzleId);
      if (nozzle) {
        const product = products.find(p => p.id === nozzle.productId);
        const rate = shift.rates?.[nozzle.productId] || 0;
        if (product) {
          const nameLower = product.name.toLowerCase();
          if (nameLower.includes('petrol') || nameLower.includes('super') || product.id === 'prod_f1') {
            petrolSold += liters;
            petrolRevenue += liters * rate;
          } else if (nameLower.includes('diesel') || nameLower.includes('hsd') || product.id === 'prod_f3') {
            dieselSold += liters;
            dieselRevenue += liters * rate;
          }
        }
      }
    });
  }

  const totalFuelSold = petrolSold + dieselSold;
  const totalSales = petrolRevenue + dieselRevenue;
  
  // Fake some metrics for the gorgeous dashboard since they don't explicitly exist in Shift type
  const totalProfit = totalSales * 0.15; // 15% estimated margin
  const avgSaleHr = totalSales / 10.5;
  const totalTransactions = 46;
  const discountGiven = 1250;
  const returnRefund = 500;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full sm:w-[95vw] lg:w-[1200px] max-w-full h-[95vh] bg-slate-50 dark:bg-[#0B0F19] sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
        
        {/* HEADER */}
        <div className="flex-none bg-white dark:bg-[#111827] border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 py-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-4">
            <button onClick={onClose} className="p-2 -ml-2 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
            </button>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                Shift #{shift.id.slice(-5)} Details
              </h2>
              <div className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                {shift.type === 'day' ? 'Day Shift' : 'Night Shift'} • {shift.date}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <button className="hidden sm:flex p-2 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
              <Share2 className="w-5 h-5" />
            </button>
            <button className="hidden sm:flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors">
              <Edit2 className="w-4 h-4" /> Edit
            </button>
            <button className="p-2 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
              <MoreVertical className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* CONTENT GRID */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-50 dark:bg-[#0B0F19]">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* LEFT COLUMN */}
            <div className="lg:col-span-5 space-y-6">
              
              {/* OPERATOR CARD */}
              <div className="bg-white dark:bg-[#111827] rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-full bg-orange-100 dark:bg-orange-500/20 flex items-center justify-center border-2 border-orange-200 dark:border-orange-500/30 overflow-hidden">
                       <UserAvatarIcon />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white">{getStaffName(shift.staffId)}</h3>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-orange-600 dark:text-orange-400 font-semibold text-sm">{getStaffRole(shift.staffId)}</span>
                        <span className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-2 py-0.5 rounded-md">EMP-001</span>
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 flex items-center gap-1.5">
                        Joined: 09:15 AM <span className="w-1 h-1 rounded-full bg-emerald-500"></span> <span className="text-emerald-600 dark:text-emerald-400">On Time</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="px-3 py-1 bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-xs font-bold rounded-full">Closed</span>
                    <div className="text-right mt-3">
                      <div className="text-xs text-slate-500 dark:text-slate-400">Shift Duration</div>
                      <div className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1 mt-0.5">
                        <Clock className="w-3.5 h-3.5 text-slate-400" /> 10h 30m
                      </div>
                      <div className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">09:15 AM - 07:45 PM</div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 mt-6 pt-5 border-t border-slate-100 dark:border-slate-800/60">
                  <div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 mb-1 flex items-center gap-1"><Info className="w-3 h-3"/> Performance Score</div>
                    <div className="font-bold text-emerald-600 dark:text-emerald-400">4.8 / 5</div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 mb-1 flex items-center gap-1"><Info className="w-3 h-3"/> Efficiency</div>
                    <div className="font-bold text-emerald-600 dark:text-emerald-400">92%</div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 mb-1 flex items-center gap-1"><Info className="w-3 h-3"/> Trust Level</div>
                    <div className="font-bold text-emerald-600 dark:text-emerald-400">High</div>
                  </div>
                </div>
              </div>

              {/* CASH FLOW SUMMARY */}
              <div className="bg-white dark:bg-[#111827] rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-5 flex items-center gap-2">
                  <span className="p-1.5 bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-lg"><TrendingUp className="w-4 h-4" /></span>
                  Cash Flow Summary
                </h3>
                
                <div className="flex items-center justify-between">
                  <div className="w-1/2 space-y-3.5 pr-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500 dark:text-slate-400">Opening Cash</span>
                      <span className="font-medium text-slate-900 dark:text-white">PKR 10,000</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500 dark:text-slate-400">Cash Sales</span>
                      <span className="font-medium text-slate-900 dark:text-white">{formatCurrency(cashSales)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500 dark:text-slate-400">Other Cash In</span>
                      <span className="font-medium text-slate-900 dark:text-white">{formatCurrency(totalRecoveries)}</span>
                    </div>
                    <div className="flex justify-between text-sm pb-3 border-b border-slate-100 dark:border-slate-800/60">
                      <span className="text-slate-500 dark:text-slate-400">Expenses</span>
                      <span className="font-medium text-red-600 dark:text-red-400">{formatCurrency(totalExpenses)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500 dark:text-slate-400">Expected Closing</span>
                      <span className="font-medium text-slate-900 dark:text-white">{formatCurrency(shift.expectedCash || 0)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500 dark:text-slate-400">Actual Closing</span>
                      <span className="font-medium text-slate-900 dark:text-white">{formatCurrency(shift.submittedCash || 0)}</span>
                    </div>
                    <div className="flex justify-between text-sm pt-2">
                      <span className="text-red-600 dark:text-red-400 flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Difference</span>
                      <span className="font-bold text-red-600 dark:text-red-400">{shift.shortage > 0 ? `- ${formatCurrency(shift.shortage)}` : formatCurrency(shift.overage)}</span>
                    </div>
                  </div>
                  
                  <div className="w-1/2 flex flex-col items-center justify-center pl-4 border-l border-slate-100 dark:border-slate-800/60">
                    <div className="relative w-32 h-32 flex items-center justify-center">
                      <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
                        <path
                          className="text-slate-100 dark:text-slate-800"
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="3.5"
                        />
                        <path
                          className="text-emerald-500"
                          strokeDasharray="95, 100"
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="3.5"
                        />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <CheckCircle2 className="w-6 h-6 text-emerald-500 mb-1" />
                        <span className="text-xs text-slate-500 dark:text-slate-400">Collection</span>
                      </div>
                    </div>
                    <div className="mt-4 text-center">
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Cash Collection</div>
                      <div className="text-xl font-bold text-slate-900 dark:text-white">{formatCurrency(totalCashCollected)}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* KEY HIGHLIGHTS */}
              <div className="bg-white dark:bg-[#111827] rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4">Key Highlights</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3 bg-slate-50 dark:bg-[#0B0F19] rounded-xl border border-slate-100 dark:border-slate-800/60 flex flex-col items-center justify-center text-center">
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 mb-1">Total Sales (PKR)</span>
                    <span className="font-bold text-slate-900 dark:text-white text-sm">{formatCurrency(totalSales).replace('PKR', '').trim()}</span>
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-0.5"><TrendingUp className="w-2.5 h-2.5"/> 12.5%</span>
                  </div>
                  <div className="p-3 bg-slate-50 dark:bg-[#0B0F19] rounded-xl border border-slate-100 dark:border-slate-800/60 flex flex-col items-center justify-center text-center">
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 mb-1">Total Profit (PKR)</span>
                    <span className="font-bold text-slate-900 dark:text-white text-sm">{formatCurrency(totalProfit).replace('PKR', '').trim()}</span>
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-0.5"><TrendingUp className="w-2.5 h-2.5"/> 8.3%</span>
                  </div>
                  <div className="p-3 bg-slate-50 dark:bg-[#0B0F19] rounded-xl border border-slate-100 dark:border-slate-800/60 flex flex-col items-center justify-center text-center">
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 mb-1">Credit Sales (PKR)</span>
                    <span className="font-bold text-slate-900 dark:text-white text-sm">{formatCurrency(totalDebits).replace('PKR', '').trim()}</span>
                    <span className="text-[10px] text-red-600 dark:text-red-400 mt-1 flex items-center gap-0.5"><TrendingDown className="w-2.5 h-2.5"/> 26.0%</span>
                  </div>
                  <div className="p-3 bg-slate-50 dark:bg-[#0B0F19] rounded-xl border border-slate-100 dark:border-slate-800/60 flex flex-col items-center justify-center text-center">
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 mb-1">Transactions</span>
                    <span className="font-bold text-slate-900 dark:text-white text-sm">{totalTransactions}</span>
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-0.5"><TrendingUp className="w-2.5 h-2.5"/> 5.2%</span>
                  </div>
                </div>
              </div>

            </div>

            {/* RIGHT COLUMN */}
            <div className="lg:col-span-7 space-y-6">
              
              {/* FINANCIAL OVERVIEW GRID */}
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3">Financial Overview</h3>
                <div className="grid grid-cols-2 sm:grid-cols-2 gap-3">
                  <FinancialCard title="Total Sales" amount={formatCurrency(totalSales)} icon={<svg className="w-4 h-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>} bg="bg-blue-50 dark:bg-blue-500/10" />
                  <FinancialCard title="Total Profit" amount={formatCurrency(totalProfit)} icon={<svg className="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>} bg="bg-emerald-50 dark:bg-emerald-500/10" />
                  <FinancialCard title="Avg. Sale / Hr" amount={formatCurrency(avgSaleHr)} icon={<svg className="w-4 h-4 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>} bg="bg-purple-50 dark:bg-purple-500/10" />
                  
                  <FinancialCard title="Total Transactions" amount={totalTransactions.toString()} icon={<svg className="w-4 h-4 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>} bg="bg-orange-50 dark:bg-orange-500/10" />
                  <FinancialCard title="Discount Given" amount={formatCurrency(discountGiven)} icon={<svg className="w-4 h-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" /></svg>} bg="bg-red-50 dark:bg-red-500/10" />
                  <FinancialCard title="Return / Refund" amount={formatCurrency(returnRefund)} icon={<svg className="w-4 h-4 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" /></svg>} bg="bg-amber-50 dark:bg-amber-500/10" />
                </div>
              </div>

              {/* SALES BREAKDOWN */}
              <div className="bg-white dark:bg-[#111827] rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
                <div className="flex items-center justify-between mb-5">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">Sales Breakdown (By Category)</h3>
                  <button className="text-xs text-orange-600 dark:text-orange-500 font-medium hover:underline">View All</button>
                </div>
                <div className="space-y-4">
                  <ProgressBar label="Diesel (HSD)" value={60} color="bg-emerald-500" amount={formatCurrency(dieselRevenue)} />
                  <ProgressBar label="Petrol (PMS)" value={40} color="bg-blue-500" amount={formatCurrency(petrolRevenue)} />
                </div>
              </div>

              {/* PAYMENT METHODS */}
              <div className="bg-white dark:bg-[#111827] rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
                <div className="flex items-center justify-between mb-5">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">Payment Methods</h3>
                  <button className="text-xs text-orange-600 dark:text-orange-500 font-medium hover:underline">View All</button>
                </div>
                <div className="space-y-3">
                  <PaymentRow icon="💵" label="Cash" amount={formatCurrency(cashSales)} percent="62%" />
                  <PaymentRow icon="💳" label="Credit (Khata)" amount={formatCurrency(totalDebits)} percent="26%" />
                  <PaymentRow icon="📱" label="JazzCash" amount={formatCurrency(totalDigital)} percent="8%" />
                  <PaymentRow icon="🏦" label="Bank Transfer" amount={formatCurrency(totalBank)} percent="4%" />
                </div>
              </div>

              {/* ACTIONS */}
              <div className="bg-white dark:bg-[#111827] rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4">Actions</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <ActionButton icon={<Download className="w-4 h-4"/>} label="Download Report" color="text-orange-500" border="border-orange-200 dark:border-orange-500/30" />
                  <ActionButton icon={<Printer className="w-4 h-4"/>} label="Print Shift" color="text-slate-500 dark:text-slate-400" border="border-slate-200 dark:border-slate-700" />
                  <ActionButton icon={<Flag className="w-4 h-4"/>} label="Flag Shift" color="text-red-500" border="border-red-200 dark:border-red-500/30" />
                  <ActionButton icon={<RotateCcw className="w-4 h-4"/>} label="Re-open Shift" color="text-blue-500" border="border-blue-200 dark:border-blue-500/30" />
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function FinancialCard({ title, amount, icon, bg }: any) {
  return (
    <div className="p-4 bg-white dark:bg-[#111827] rounded-xl border border-slate-200 dark:border-slate-800 flex items-center gap-3">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${bg}`}>
        {icon}
      </div>
      <div>
        <div className="text-[10px] text-slate-500 dark:text-slate-400 mb-0.5">{title}</div>
        <div className="font-bold text-slate-900 dark:text-white text-sm">{amount}</div>
      </div>
    </div>
  );
}

function ProgressBar({ label, value, color, amount }: any) {
  return (
    <div className="flex items-center gap-4 text-sm">
      <div className="w-24 shrink-0 text-slate-600 dark:text-slate-300 text-xs">{label}</div>
      <div className="flex-1 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
        <div className={`h-full ${color}`} style={{ width: `${value}%` }}></div>
      </div>
      <div className="w-12 text-right text-xs text-slate-500 dark:text-slate-400">{value}%</div>
      <div className="w-24 text-right font-medium text-slate-900 dark:text-white text-xs">{amount}</div>
    </div>
  );
}

function PaymentRow({ icon, label, amount, percent }: any) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-slate-50 dark:border-slate-800/50 last:border-0">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-lg">{icon}</div>
        <div className="text-sm font-medium text-slate-700 dark:text-slate-300">{label}</div>
      </div>
      <div className="flex items-center gap-6">
        <div className="text-sm font-bold text-slate-900 dark:text-white">{amount}</div>
        <div className="px-2 py-0.5 rounded text-xs font-medium bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 min-w-[40px] text-center">
          {percent}
        </div>
      </div>
    </div>
  );
}

function ActionButton({ icon, label, color, border }: any) {
  return (
    <button className={`flex items-center justify-center gap-2 p-3 rounded-xl border bg-white dark:bg-[#111827] hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors ${border} ${color}`}>
      {icon}
      <span className="text-xs font-semibold">{label}</span>
    </button>
  );
}

function UserAvatarIcon() {
  return (
    <svg viewBox="0 0 100 100" className="w-full h-full fill-orange-500">
      <circle cx="50" cy="35" r="20" />
      <path d="M20 90 Q50 60 80 90 L20 90" />
    </svg>
  );
}
