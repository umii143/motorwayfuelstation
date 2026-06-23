import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { 
  ArrowLeft, Building2, User, Phone, Mail, MapPin, CheckCircle, Clock, 
  Download, FileText, Plus, Receipt, Wallet, Activity, Hash, AlertCircle, Calendar
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { FleetAccount, Shift, GlobalSettings, BankAccount, FleetVehicle, Driver } from '../../../types';
import { formatCurrency, getCurrencySymbol } from '../../../lib/currency';
import { t as translate } from '../../../lib/translations';

interface CustomerDetailsFullPageProps {
  account: FleetAccount;
  settings: GlobalSettings;
  shifts: Shift[];
  banks: BankAccount[];
  vehicles: FleetVehicle[];
  drivers: Driver[];
  onBack: () => void;
}

const getCustomerLogo = (name: string) => {
  const n = name.toLowerCase();
  if (n.includes('dhl')) return 'https://upload.wikimedia.org/wikipedia/commons/b/b3/DHL_Express_logo.svg';
  if (n.includes('tcs')) return 'https://upload.wikimedia.org/wikipedia/commons/2/29/TCS_Couriers_logo.png';
  if (n.includes('leopards')) return 'https://leopardscourier.com/assets/images/logo.png';
  if (n.includes('foodpanda')) return 'https://upload.wikimedia.org/wikipedia/commons/1/14/Foodpanda_logo.svg';
  return null;
};

export default function CustomerDetailsFullPage({ account, settings, shifts, banks, vehicles, drivers, onBack }: CustomerDetailsFullPageProps) {
  const t = (en: string, ur: string) => translate(en, ur, settings);
  const [activeTab, setActiveTab] = useState('Overview');

  const logoUrl = getCustomerLogo(account.companyName);
  const isActive = account.status !== 'closed';
  const creditLimit = account.creditLimit || 5000000;
  const availableCredit = Math.max(0, creditLimit - account.balance);
  const utilization = ((account.balance / creditLimit) * 100).toFixed(1);

  // 1. Extract real data
  const customerSales = useMemo(() => {
    return shifts.flatMap(s => s.debitEntries || [])
      .filter(d => d.customerId === account.id)
      .sort((a, b) => new Date(a.date || '').getTime() - new Date(b.date || '').getTime());
  }, [shifts, account.id]);

  const customerRecoveries = useMemo(() => {
    return shifts.flatMap(s => s.recoveryEntries || [])
      .filter(r => r.customerId === account.id)
      .sort((a, b) => new Date(a.date || '').getTime() - new Date(b.date || '').getTime());
  }, [shifts, account.id]);

  // 2. Compute KPI values
  const totalSalesYear = useMemo(() => customerSales.reduce((sum, s) => sum + s.amount, 0), [customerSales]);
  const totalRecoveriesYear = useMemo(() => customerRecoveries.reduce((sum, r) => sum + r.amount, 0), [customerRecoveries]);
  
  const totalOrders = customerSales.length;
  const averageOrderValue = totalOrders > 0 ? totalSalesYear / totalOrders : 0;
  
  const lastPurchaseDate = customerSales.length > 0 
    ? customerSales[customerSales.length - 1].date 
    : 'No Sales';

  // Calculate health score dynamically
  const healthScore = useMemo(() => {
    let score = 100;
    const utilizationPercent = (account.balance / creditLimit) * 100;
    if (utilizationPercent > 90) score -= 30;
    else if (utilizationPercent > 70) score -= 15;
    if (account.balance > 0 && totalRecoveriesYear === 0) score -= 20;
    return Math.max(0, Math.min(100, Math.round(score)));
  }, [account.balance, creditLimit, totalRecoveriesYear]);

  // 3. Prepare Chart Data (group sales/recoveries by month for the current year)
  const chartData = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentYear = new Date().getFullYear();
    const data = months.map(m => ({ name: m, sales: 0, recoveries: 0 }));
    
    customerSales.forEach(b => {
      const d = new Date(b.date || '');
      if (d.getFullYear() === currentYear) {
        data[d.getMonth()].sales += b.amount;
      }
    });

    customerRecoveries.forEach(p => {
      const d = new Date(p.date || '');
      if (d.getFullYear() === currentYear) {
        data[d.getMonth()].recoveries += p.amount;
      }
    });
    return data;
  }, [customerSales, customerRecoveries]);

  const pieData = useMemo(() => [
    { name: 'Recovered', value: totalRecoveriesYear, color: '#10b981' }, 
    { name: 'Outstanding', value: account.balance, color: '#ef4444' }, 
    { name: 'Available Credit', value: availableCredit, color: '#3b82f6' } 
  ], [totalRecoveriesYear, account.balance, availableCredit]);

  // 4. Construct Unified Transaction Ledger
  const transactions = useMemo(() => {
    const combined: Array<{
      id: string;
      date: string;
      type: 'Credit Sale' | 'Recovery';
      ref: string;
      desc: string;
      debit: number;
      credit: number;
      by: string;
      branch: string;
      status: string;
      timestamp: number;
    }> = [];
    
    customerSales.forEach(s => {
      combined.push({
        id: s.id,
        date: s.date || '',
        type: 'Credit Sale',
        ref: s.slipNumber || s.vehicleNo || 'N/A',
        desc: `${s.productType?.toUpperCase() || 'Product'} ${s.quantity} Liters`,
        debit: s.amount, // Credit sale adds to customer balance
        credit: 0,
        by: 'Admin',
        branch: 'Main',
        status: 'Completed',
        timestamp: new Date(s.date || '').getTime()
      });
    });

    customerRecoveries.forEach(r => {
      combined.push({
        id: r.id,
        date: r.date || '',
        type: 'Recovery',
        ref: r.receiptNumber || r.paymentMode || 'N/A',
        desc: `Payment via ${r.paymentMode}`,
        debit: 0,
        credit: r.amount, // Recovery reduces customer balance
        by: 'Finance',
        branch: 'HQ',
        status: 'Completed',
        timestamp: new Date(r.date || '').getTime()
      });
    });

    combined.sort((a, b) => a.timestamp - b.timestamp);

    let runningBal = 0; 
    return combined.map(t => {
      runningBal += t.debit;
      runningBal -= t.credit;
      return { ...t, bal: runningBal };
    }).reverse();
  }, [customerSales, customerRecoveries]);

  return (
    <div className="min-h-screen bg-slate-950 pb-20 -mx-4 lg:-mx-8 -mt-4 lg:-mt-8">
      {/* Top Header */}
      <div className="bg-slate-900 border-b border-slate-800 sticky top-0 z-30">
        <div className="px-6 py-4">
          <button onClick={onBack} className="flex items-center gap-2 text-slate-400 hover:text-white mb-4 transition-colors cursor-pointer w-max">
            <ArrowLeft className="w-4 h-4" /> Back to Directory
          </button>
          
          <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700 overflow-hidden shadow-inner p-2">
                {logoUrl ? (
                  <img src={logoUrl} alt={account.companyName} className="w-full h-full object-contain" />
                ) : (
                  <span className="text-xl font-bold text-slate-400">{account.companyName.substring(0, 2).toUpperCase()}</span>
                )}
              </div>
              <div>
                <h1 className="text-2xl font-black text-white">
                  {account.companyName}
                </h1>
                <div className="flex items-center gap-3 text-sm text-slate-400 mt-1">
                  <span className="flex items-center gap-1.5"><Building2 className="w-4 h-4" /> {account.address || 'No Address'}</span>
                  <span className="flex items-center gap-1.5"><Phone className="w-4 h-4" /> {account.phone}</span>
                  <span className="flex items-center gap-1.5"><User className="w-4 h-4" /> {account.contactPerson}</span>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-4">
              <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/50 min-w-[140px]">
                <p className="text-xs text-slate-400 mb-1">Health Score</p>
                <p className="text-xl font-bold text-emerald-400 flex items-center gap-2">
                  {healthScore}% <Activity className="w-4 h-4 opacity-50"/>
                </p>
              </div>
              <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/50 min-w-[140px]">
                <p className="text-xs text-slate-400 mb-1">Outstanding</p>
                <p className="text-xl font-bold text-rose-500">{settings.currency} {formatCurrency(account.balance)}</p>
              </div>
              <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/50 min-w-[140px]">
                <p className="text-xs text-slate-400 mb-1">Credit Limit</p>
                <p className="text-xl font-bold text-white">{settings.currency} {formatCurrency(creditLimit)}</p>
              </div>
            </div>
          </div>

          {/* Timeline Snippet */}
          <div className="mt-6 flex items-center gap-6 overflow-x-auto no-scrollbar pb-2">
            {transactions.slice(0, 3).map((t, i) => (
              <React.Fragment key={t.id}>
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${t.type === 'Credit Sale' ? 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)]' : 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]'}`}></div>
                  <div>
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">{t.date}</p>
                    <p className="text-xs text-white">{t.type === 'Credit Sale' ? 'Sale Created' : 'Recovery Received'}</p>
                  </div>
                </div>
                {i < Math.min(transactions.length - 1, 2) && <div className="w-8 h-px bg-slate-700"></div>}
              </React.Fragment>
            ))}
            {transactions.length === 0 && (
              <p className="text-xs text-slate-500 italic">No recent timeline activity.</p>
            )}
          </div>
        </div>
      </div>

      {/* TABS */}
      <div className="border-b border-slate-800 px-4 lg:px-8 mt-6">
        <div className="flex gap-6">
          {['Overview', 'Ledger & Transactions', 'Vehicles', 'Drivers'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-3 text-sm font-bold border-b-2 transition-colors ${activeTab === tab ? 'border-orange-500 text-orange-500' : 'border-transparent text-slate-400 hover:text-slate-300'}`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div className="p-4 lg:p-8">
        {activeTab === 'Overview' && (
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
            
            {/* Left Column (Info & Charts) */}
            <div className="xl:col-span-4 space-y-6">
              
              {/* Purchase Summary */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
                <h3 className="text-white font-semibold mb-4 pb-3 border-b border-slate-800">Sales Summary (This Year)</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 text-sm">Total Sales</span>
                    <span className="text-white font-bold text-sm">{settings.currency} {formatCurrency(totalSalesYear)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 text-sm">Total Recoveries</span>
                    <span className="text-white font-bold text-sm">{settings.currency} {formatCurrency(totalRecoveriesYear)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 text-sm">Total Orders</span>
                    <span className="text-white font-bold text-sm">{totalOrders}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 text-sm">Average Order Value</span>
                    <span className="text-white font-bold text-sm">{settings.currency} {formatCurrency(averageOrderValue)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 text-sm">Last Sale</span>
                    <span className="text-white font-bold text-sm">{lastPurchaseDate !== 'No Sales' ? new Date(lastPurchaseDate || '').toLocaleDateString() : 'No Sales'}</span>
                  </div>
                </div>
              </div>

            </div>

            {/* Right/Center Column (Transactions) */}
            <div className="xl:col-span-8 space-y-6">
              
              {/* Transactions Table */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden flex flex-col h-[520px]">
                <div className="p-4 border-b border-slate-800 flex justify-between items-center flex-wrap gap-4">
                  <h3 className="text-white font-semibold">Transactions (A to Z)</h3>
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <input type="text" placeholder="Search transactions..." className="bg-slate-800 border border-slate-700 text-white text-xs rounded-lg px-3 py-2 focus:outline-hidden" />
                    </div>
                    <select className="bg-slate-800 border border-slate-700 text-white text-xs rounded-lg px-3 py-2 outline-hidden">
                      <option>All Types</option>
                      <option>Purchases</option>
                      <option>Payments</option>
                    </select>
                    <select className="bg-slate-800 border border-slate-700 text-white text-xs rounded-lg px-3 py-2 outline-hidden">
                      <option>All Time</option>
                      <option>This Month</option>
                    </select>
                    <button className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white px-3 py-2 rounded-lg text-xs font-semibold transition-colors">
                      <Download className="w-3.5 h-3.5" /> Export
                    </button>
                  </div>
                </div>
                <div className="flex-1 overflow-auto custom-scrollbar">
                  <table className="w-full text-left text-xs whitespace-nowrap">
                    <thead className="text-slate-400 bg-slate-800/50 sticky top-0 z-10">
                      <tr>
                        <th className="px-4 py-3 font-medium">Date</th>
                        <th className="px-4 py-3 font-medium">Type</th>
                        <th className="px-4 py-3 font-medium">Reference No.</th>
                        <th className="px-4 py-3 font-medium">Description</th>
                        <th className="px-4 py-3 font-medium text-right">Debit (PKR)</th>
                        <th className="px-4 py-3 font-medium text-right">Credit (PKR)</th>
                        <th className="px-4 py-3 font-medium text-right">Balance (PKR)</th>
                        <th className="px-4 py-3 font-medium">Created By</th>
                        <th className="px-4 py-3 font-medium">Branch</th>
                        <th className="px-4 py-3 font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 text-slate-300">
                      {transactions.map(txn => (
                        <tr key={txn.id} className="hover:bg-slate-800/30 transition-colors">
                          <td className="px-4 py-3">{txn.date}</td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${txn.type === 'Recovery' ? 'bg-blue-500/10 text-blue-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
                              {txn.type}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-slate-400">{txn.ref}</td>
                          <td className="px-4 py-3 truncate max-w-[150px]" title={txn.desc}>{txn.desc}</td>
                          <td className="px-4 py-3 text-right">{txn.debit > 0 ? txn.debit.toLocaleString() : '—'}</td>
                          <td className="px-4 py-3 text-right">{txn.credit > 0 ? txn.credit.toLocaleString() : '—'}</td>
                          <td className="px-4 py-3 text-right font-medium">{txn.bal.toLocaleString()}</td>
                          <td className="px-4 py-3">{txn.by}</td>
                          <td className="px-4 py-3">{txn.branch}</td>
                          <td className="px-4 py-3 text-emerald-500">{txn.status}</td>
                        </tr>
                      ))}
                      {transactions.length === 0 && (
                        <tr>
                          <td colSpan={10} className="px-4 py-8 text-center text-slate-500 italic">No transactions found for this customer.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
                <div className="p-3 border-t border-slate-800 flex justify-between items-center text-xs text-slate-400 bg-slate-800/20">
                  <span>Showing {transactions.length > 0 ? 1 : 0} to {Math.min(10, transactions.length)} of {transactions.length} records</span>
                  <div className="flex gap-1">
                    <button className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-50" disabled>Prev</button>
                    <button className="px-2 py-1 rounded bg-orange-600 text-white">1</button>
                    <button className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-50" disabled>Next</button>
                  </div>
                </div>
              </div>

              {/* Bottom Row inside Right Column */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Payment Summary */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
                  <h3 className="text-white font-semibold mb-4 text-sm">Payment Summary</h3>
                  <div className="flex items-center gap-4">
                    <div className="w-24 h-24 flex items-center justify-center">
                        <PieChart width={96} height={96}>
                          <Pie
                            data={pieData}
                            innerRadius={25}
                            outerRadius={40}
                            paddingAngle={5}
                            dataKey="value"
                            stroke="none"
                          >
                            {pieData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                        </PieChart>
                    </div>
                    <div className="flex-1 space-y-2">
                      <div className="flex justify-between items-center text-xs">
                        <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-emerald-500"></div><span className="text-slate-400">Paid Amount</span></div>
                        <span className="text-white font-medium">
                          {pieData.reduce((s, d) => s + d.value, 0) > 0 ? ((totalRecoveriesYear / pieData.reduce((s, d) => s + d.value, 0)) * 100).toFixed(1) : 0}%
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-rose-500"></div><span className="text-slate-400">Outstanding</span></div>
                        <span className="text-white font-medium">
                          {pieData.reduce((s, d) => s + d.value, 0) > 0 ? ((account.balance / pieData.reduce((s, d) => s + d.value, 0)) * 100).toFixed(1) : 0}%
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-blue-500"></div><span className="text-slate-400">Available</span></div>
                        <span className="text-white font-medium">
                          {pieData.reduce((s, d) => s + d.value, 0) > 0 ? ((availableCredit / pieData.reduce((s, d) => s + d.value, 0)) * 100).toFixed(1) : 100}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Recent Documents */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-white font-semibold text-sm">Recent Documents</h3>
                    <button className="text-xs text-orange-500 hover:text-orange-400">View All</button>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded bg-slate-800 flex items-center justify-center text-rose-400"><FileText className="w-4 h-4"/></div>
                        <div>
                          <p className="text-xs text-white font-medium">NTN Certificate</p>
                          <p className="text-[10px] text-slate-500">Uploaded May 12, 2024</p>
                        </div>
                      </div>
                      <button className="text-slate-400 hover:text-white"><Download className="w-4 h-4"/></button>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded bg-slate-800 flex items-center justify-center text-rose-400"><FileText className="w-4 h-4"/></div>
                        <div>
                          <p className="text-xs text-white font-medium">STRN Certificate</p>
                          <p className="text-[10px] text-slate-500">Uploaded May 12, 2024</p>
                        </div>
                      </div>
                      <button className="text-slate-400 hover:text-white"><Download className="w-4 h-4"/></button>
                    </div>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
                  <h3 className="text-white font-semibold mb-4 text-sm">Quick Actions</h3>
                  <div className="space-y-2.5">
                    <button className="w-full flex items-center justify-center gap-2 bg-orange-600 hover:bg-orange-700 text-white py-2 rounded-lg text-xs font-semibold transition-colors shadow-lg shadow-orange-600/20">
                      <Plus className="w-3.5 h-3.5" /> Create Purchase
                    </button>
                    <button className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white py-2 rounded-lg text-xs font-semibold transition-colors shadow-lg shadow-emerald-600/20">
                      <Wallet className="w-3.5 h-3.5" /> Record Payment
                    </button>
                    <button className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg text-xs font-semibold transition-colors shadow-lg shadow-blue-600/20">
                      <Receipt className="w-3.5 h-3.5" /> View Ledger
                    </button>
                    <button className="w-full flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-white py-2 rounded-lg text-xs font-semibold transition-colors border border-slate-700">
                      Customer Statement
                    </button>
                  </div>
                </div>

              </div>
            </div>
          </div>
        )}
        
        
        {/* Placeholder for other tabs */}
        {!['Overview', 'Vehicles', 'Drivers'].includes(activeTab) && (
          <div className="flex flex-col items-center justify-center h-64 bg-slate-900 border border-slate-800 rounded-xl">
            <Activity className="w-12 h-12 text-slate-700 mb-4" />
            <h2 className="text-white font-semibold">{activeTab}</h2>
            <p className="text-slate-400 text-sm mt-1">This module is part of the Enterprise architecture.</p>
          </div>
        )}

        {/* VEHICLES TAB */}
        {activeTab === 'Vehicles' && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
            <div className="p-6 border-b border-slate-800">
              <h3 className="text-lg font-bold text-white">Registered Fleet Vehicles</h3>
            </div>
            <div className="p-6">
              {vehicles.filter(v => v.accountId === account.id).length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {vehicles.filter(v => v.accountId === account.id).map((v) => (
                    <div key={v.id} className="p-4 bg-slate-800/50 rounded-lg border border-slate-700">
                      <div className="font-bold text-white">{v.registrationNumber}</div>
                      <div className="text-sm text-slate-400 mt-1">{v.make} {v.model} ({v.category})</div>
                      <div className="mt-3 flex gap-2 text-xs">
                        <span className="px-2 py-1 bg-slate-800 rounded-md text-slate-300">Monthly: {settings.currency} {v.monthlyFuelLimit}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-slate-500">
                  No vehicles registered for this customer.
                </div>
              )}
            </div>
          </div>
        )}

        {/* DRIVERS TAB */}
        {activeTab === 'Drivers' && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
            <div className="p-6 border-b border-slate-800">
              <h3 className="text-lg font-bold text-white">Registered Drivers</h3>
            </div>
            <div className="p-6">
              {drivers.filter(d => d.accountId === account.id).length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {drivers.filter(d => d.accountId === account.id).map((d) => (
                    <div key={d.id} className="p-4 bg-slate-800/50 rounded-lg border border-slate-700">
                      <div className="font-bold text-white">{d.name}</div>
                      <div className="text-sm text-slate-400 mt-1">License: {d.licenseNumber}</div>
                      <div className="text-sm text-slate-400">Phone: {d.phone}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-slate-500">
                  No drivers registered for this customer.
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
