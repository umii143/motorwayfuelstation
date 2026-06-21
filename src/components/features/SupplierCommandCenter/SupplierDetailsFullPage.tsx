import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { 
  ArrowLeft, Building2, User, Phone, Mail, MapPin, CheckCircle, Clock, 
  Download, FileText, Plus, Receipt, Wallet, Activity, Hash, AlertCircle, Calendar
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Supplier, Shift, GlobalSettings, BankAccount, StockBatch } from '../../../types';
import { formatCurrency, getCurrencySymbol } from '../../../lib/currency';
import { t as translate } from '../../../lib/translations';
import { useDebounce } from '../../../hooks/useDebounce';

interface SupplierDetailsFullPageProps {
  supplier: Supplier;
  settings: GlobalSettings;
  shifts: Shift[];
  banks: BankAccount[];
  batches: StockBatch[];
  onBack: () => void;
}

const getSupplierLogo = (name: string) => {
  const n = name.toLowerCase();
  if (n.includes('pso') || n.includes('pakistan state oil')) return 'https://upload.wikimedia.org/wikipedia/en/thumb/f/fa/Pakistan_State_Oil_logo.svg/1200px-Pakistan_State_Oil_logo.svg.png';
  if (n.includes('shell')) return 'https://upload.wikimedia.org/wikipedia/en/thumb/e/e8/Shell_logo.svg/1200px-Shell_logo.svg.png';
  if (n.includes('total') || n.includes('parco')) return 'https://upload.wikimedia.org/wikipedia/en/thumb/9/91/TotalEnergies_logo.svg/1200px-TotalEnergies_logo.svg.png';
  if (n.includes('hascol')) return 'https://upload.wikimedia.org/wikipedia/commons/e/ec/Hascol_Petroleum_Logo.png';
  if (n.includes('attock') || n.includes('apl')) return 'https://upload.wikimedia.org/wikipedia/en/8/87/Attock_Petroleum_logo.png';
  if (n.includes('byco') || n.includes('cnergyico')) return 'https://upload.wikimedia.org/wikipedia/commons/3/3d/Cnergyico_Logo.png';
  if (n.includes('go') || n.includes('gas & oil')) return 'https://upload.wikimedia.org/wikipedia/commons/5/52/GO_Petroleum_Logo.png';
  return null;
};

export default function SupplierDetailsFullPage({ supplier, settings, shifts, banks, batches, onBack }: SupplierDetailsFullPageProps) {
  const t = (en: string, ur: string) => translate(en, ur, settings);
  const [activeTab, setActiveTab] = useState('Overview');

  const logoUrl = getSupplierLogo(supplier.name);
  const isActive = supplier.status !== 'Inactive';
  const creditLimit = supplier.creditLimit || 5000000;
  const availableCredit = Math.max(0, creditLimit - supplier.balance);
  const utilization = ((supplier.balance / creditLimit) * 100).toFixed(1);

  // 1. Extract real data
  const supplierBatches = useMemo(() => {
    return batches.filter(b => b.supplierId === supplier.id).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [batches, supplier.id]);

  const supplierPayments = useMemo(() => {
    return shifts.flatMap(s => s.supplierPayments || [])
      .filter(p => p.supplierId === supplier.id)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [shifts, supplier.id]);

  // 2. Compute KPI values
  const totalPurchasesYear = useMemo(() => supplierBatches.reduce((sum, b) => sum + (b.invoiceTotalAmount || (b.qtyReceived * (b.invoiceCostPerLiter || 0))), 0), [supplierBatches]);
  const totalPaymentsYear = useMemo(() => supplierPayments.reduce((sum, p) => sum + p.amount, 0), [supplierPayments]);
  
  const totalOrders = supplierBatches.length;
  const averageOrderValue = totalOrders > 0 ? totalPurchasesYear / totalOrders : 0;
  
  const lastPurchaseDate = supplierBatches.length > 0 
    ? supplierBatches[supplierBatches.length - 1].date 
    : 'No Purchases';

  // Calculate health score dynamically
  const healthScore = useMemo(() => {
    let score = 100;
    const utilizationPercent = (supplier.balance / creditLimit) * 100;
    if (utilizationPercent > 90) score -= 30;
    else if (utilizationPercent > 70) score -= 15;
    if (supplier.balance > 0 && totalPaymentsYear === 0) score -= 20;
    return Math.max(0, Math.min(100, Math.round(score)));
  }, [supplier.balance, creditLimit, totalPaymentsYear]);

  // 3. Prepare Chart Data (group purchases/payments by month for the current year)
  const chartData = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentYear = new Date().getFullYear();
    const data = months.map(m => ({ name: m, purchases: 0, payments: 0 }));
    
    supplierBatches.forEach(b => {
      const d = new Date(b.date);
      if (d.getFullYear() === currentYear) {
        const amt = b.invoiceTotalAmount || (b.qtyReceived * (b.invoiceCostPerLiter || 0));
        data[d.getMonth()].purchases += amt;
      }
    });

    supplierPayments.forEach(p => {
      const d = new Date(p.date);
      if (d.getFullYear() === currentYear) {
        data[d.getMonth()].payments += p.amount;
      }
    });
    return data;
  }, [supplierBatches, supplierPayments]);

  const pieData = useMemo(() => [
    { name: 'Paid', value: totalPaymentsYear, color: '#10b981' }, 
    { name: 'Outstanding', value: supplier.balance, color: '#ef4444' }, 
    { name: 'Available Credit', value: availableCredit, color: '#3b82f6' } 
  ], [totalPaymentsYear, supplier.balance, availableCredit]);

  const [visibleLimit, setVisibleLimit] = useState(100);
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const [isPending, startTransition] = React.useTransition();

  // 4. Construct Unified Transaction Ledger
  const transactions = useMemo(() => {
    const combined: any[] = [];
    
    supplierBatches.forEach(b => {
      const amt = b.invoiceTotalAmount || (b.qtyReceived * (b.invoiceCostPerLiter || 0));
      combined.push({
        id: b.id,
        date: b.date,
        type: 'Purchase',
        ref: b.invoiceNumber || b.batchNumber || 'N/A',
        desc: `${b.productType?.toUpperCase() || 'Product'} ${b.qtyReceived} Liters`,
        debit: amt,
        credit: 0,
        by: 'Admin',
        branch: 'Main',
        status: 'Completed',
        timestamp: new Date(b.date).getTime()
      });
    });

    supplierPayments.forEach(p => {
      combined.push({
        id: p.id,
        date: p.date,
        type: 'Payment',
        ref: p.reference || 'N/A',
        desc: `Payment via ${p.mode}`,
        debit: 0,
        credit: p.amount,
        by: 'Finance',
        branch: 'HQ',
        status: 'Completed',
        timestamp: new Date(p.date).getTime()
      });
    });

    combined.sort((a, b) => a.timestamp - b.timestamp);

    let runningBal = 0; 
    return combined.map(t => {
      runningBal += t.debit;
      runningBal -= t.credit;
      return { ...t, bal: runningBal };
    }).reverse();
  }, [supplierBatches, supplierPayments]);

  const filteredTransactions = useMemo(() => {
    if (!debouncedSearchTerm) return transactions;
    const lower = debouncedSearchTerm.toLowerCase();
    return transactions.filter(t => 
      t.desc.toLowerCase().includes(lower) || 
      t.ref.toLowerCase().includes(lower) || 
      t.type.toLowerCase().includes(lower)
    );
  }, [transactions, debouncedSearchTerm]);

  const displayedTransactions = filteredTransactions.slice(0, visibleLimit);

  return (
    <div className="min-h-screen bg-slate-950 pb-20 -mx-4 lg:-mx-8 -mt-4 lg:-mt-8">
      {/* Top Header */}
      <div className="bg-slate-900 border-b border-slate-800 sticky top-0 z-30">
        <div className="px-6 py-4">
          <button onClick={onBack} className="flex items-center gap-2 text-slate-400 hover:text-white mb-4 transition-colors cursor-pointer w-max">
            <ArrowLeft className="w-4 h-4" /> Back to Suppliers
          </button>
          
          <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700 overflow-hidden shadow-inner p-2">
                {logoUrl ? (
                  <img src={logoUrl} alt={supplier.name} className="w-full h-full object-contain" />
                ) : (
                  <span className="text-xl font-bold text-slate-400">{supplier.name.substring(0, 2).toUpperCase()}</span>
                )}
              </div>
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <h1 className="text-2xl font-bold text-white tracking-tight">{t(supplier.name, supplier.urduName)}</h1>
                  <span className={`px-2.5 py-0.5 rounded-md text-xs font-bold ${isActive ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'}`}>
                    {isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-sm text-slate-400 font-medium">
                  <span className="flex items-center gap-1.5"><Building2 className="w-3.5 h-3.5"/> {supplier.supplierType || 'Fuel Supplier'}</span>
                  <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5"/> Since {supplier.supplierSince || 'Jan 15, 2022'}</span>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-4">
              <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/50 min-w-[140px]">
                <p className="text-xs text-slate-400 mb-1">Supplier Health</p>
                <p className="text-xl font-bold text-emerald-400 flex items-center gap-2">
                  {healthScore}% <Activity className="w-4 h-4 opacity-50"/>
                </p>
              </div>
              <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/50 min-w-[140px]">
                <p className="text-xs text-slate-400 mb-1">Outstanding</p>
                <p className="text-xl font-bold text-rose-500">PKR {formatCurrency(supplier.balance, settings).replace('Rs.', '').trim()}</p>
              </div>
              <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/50 min-w-[140px]">
                <p className="text-xs text-slate-400 mb-1">Credit Limit</p>
                <p className="text-xl font-bold text-white">PKR {formatCurrency(creditLimit, settings).replace('Rs.', '').trim()}</p>
              </div>
              <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/50 min-w-[140px]">
                <p className="text-xs text-slate-400 mb-1">Available Credit</p>
                <p className="text-xl font-bold text-emerald-400">PKR {formatCurrency(availableCredit, settings).replace('Rs.', '').trim()}</p>
              </div>
            </div>
          </div>

          {/* Supplier Timeline Snippet */}
          <div className="mt-6 flex items-center gap-6 overflow-x-auto no-scrollbar pb-2">
            {transactions.slice(0, 3).map((t, i) => (
              <React.Fragment key={t.id}>
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${t.type === 'Purchase' ? 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)]' : 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]'}`}></div>
                  <div>
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">{t.date}</p>
                    <p className="text-xs text-white">{t.type === 'Purchase' ? 'Purchase Created' : 'Payment Sent'}</p>
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

        {/* Enterprise Tabs */}
        <div className="px-6 flex gap-8 border-t border-slate-800 overflow-x-auto no-scrollbar">
          {['Overview', 'Ledger & Transactions', 'Purchases', 'Payments', 'Documents', 'Contacts', 'Notes', 'Analytics', 'Statements', 'Credit History', 'Audit Logs', 'Attachments'].map((tab) => (
            <button 
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-3.5 text-sm font-semibold whitespace-nowrap transition-colors cursor-pointer border-b-2 ${
                activeTab === tab ? 'text-orange-500 border-orange-500' : 'text-slate-400 border-transparent hover:text-slate-200'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="p-6">
        {activeTab === 'Overview' && (
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
            
            {/* Left Column (Info & Charts) */}
            <div className="xl:col-span-4 space-y-6">
              
              {/* Info Card */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
                <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-800/20">
                  <h3 className="text-white font-semibold">Supplier Information</h3>
                  <button className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 cursor-pointer"><User className="w-3.5 h-3.5"/> Edit</button>
                </div>
                <div className="p-0">
                  <table className="w-full text-sm text-left">
                    <tbody className="divide-y divide-slate-800">
                      <tr className="hover:bg-slate-800/30 transition-colors">
                        <td className="py-3 px-4 text-slate-400 w-1/3">Company Name</td>
                        <td className="py-3 px-4 text-white font-medium">{supplier.name}</td>
                      </tr>
                      <tr className="hover:bg-slate-800/30 transition-colors">
                        <td className="py-3 px-4 text-slate-400">Supplier Type</td>
                        <td className="py-3 px-4 text-white">{supplier.supplierType || 'Fuel Supplier'}</td>
                      </tr>
                      <tr className="hover:bg-slate-800/30 transition-colors">
                        <td className="py-3 px-4 text-slate-400">NTN</td>
                        <td className="py-3 px-4 text-white">{supplier.ntn || '1234567-8'}</td>
                      </tr>
                      <tr className="hover:bg-slate-800/30 transition-colors">
                        <td className="py-3 px-4 text-slate-400">STRN</td>
                        <td className="py-3 px-4 text-white">3277876123456</td>
                      </tr>
                      <tr className="hover:bg-slate-800/30 transition-colors">
                        <td className="py-3 px-4 text-slate-400">Contact Person</td>
                        <td className="py-3 px-4 text-white">Muhammad Ahmad</td>
                      </tr>
                      <tr className="hover:bg-slate-800/30 transition-colors">
                        <td className="py-3 px-4 text-slate-400">Phone</td>
                        <td className="py-3 px-4 text-white">{supplier.contact || 'N/A'}</td>
                      </tr>
                      <tr className="hover:bg-slate-800/30 transition-colors">
                        <td className="py-3 px-4 text-slate-400">Email</td>
                        <td className="py-3 px-4 text-white">{supplier.email || 'info@company.com'}</td>
                      </tr>
                      <tr className="hover:bg-slate-800/30 transition-colors">
                        <td className="py-3 px-4 text-slate-400">Address</td>
                        <td className="py-3 px-4 text-white">{supplier.address || 'Head Office, Pakistan'}</td>
                      </tr>
                      <tr className="hover:bg-slate-800/30 transition-colors">
                        <td className="py-3 px-4 text-slate-400">Payment Terms</td>
                        <td className="py-3 px-4 text-white">30 Days</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Purchase Summary */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
                <h3 className="text-white font-semibold mb-4 pb-3 border-b border-slate-800">Purchase Summary (This Year)</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 text-sm">Total Purchases</span>
                    <span className="text-white font-bold text-sm">PKR {formatCurrency(totalPurchasesYear, settings).replace('Rs.', '').trim()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 text-sm">Total Payments</span>
                    <span className="text-white font-bold text-sm">PKR {formatCurrency(totalPaymentsYear, settings).replace('Rs.', '').trim()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 text-sm">Total Orders</span>
                    <span className="text-white font-bold text-sm">{totalOrders}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 text-sm">Average Order Value</span>
                    <span className="text-white font-bold text-sm">PKR {formatCurrency(averageOrderValue, settings).replace('Rs.', '').trim()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 text-sm">Last Purchase</span>
                    <span className="text-white font-bold text-sm">{lastPurchaseDate !== 'No Purchases' ? new Date(lastPurchaseDate).toLocaleDateString() : 'No Purchases'}</span>
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
                      <input 
                        type="text" 
                        placeholder="Search transactions..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="bg-slate-800 border border-slate-700 text-white text-xs rounded-lg px-3 py-2 focus:outline-hidden" 
                      />
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
                      {displayedTransactions.map(txn => (
                        <tr key={txn.id} className="hover:bg-slate-800/30 transition-colors">
                          <td className="px-4 py-3">{txn.date}</td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${txn.type === 'Purchase' ? 'bg-blue-500/10 text-blue-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
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
                      {displayedTransactions.length === 0 && (
                        <tr>
                          <td colSpan={10} className="px-4 py-8 text-center text-slate-500 italic">No transactions found.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                  
                  {filteredTransactions.length > displayedTransactions.length && (
                    <div className="p-4 flex justify-center border-t border-slate-800 shrink-0">
                      <button 
                        onClick={() => setVisibleLimit(prev => prev + 100)}
                        className="px-6 py-2 bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white rounded-full font-bold text-sm transition-colors border border-slate-700"
                      >
                        Load More Transactions ({filteredTransactions.length - displayedTransactions.length} remaining)
                      </button>
                    </div>
                  )}
                </div>
                <div className="p-3 border-t border-slate-800 flex justify-between items-center text-xs text-slate-400 bg-slate-800/20">
                  <span>Showing {displayedTransactions.length > 0 ? 1 : 0} to {displayedTransactions.length} of {filteredTransactions.length} records</span>
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
                          {pieData.reduce((s, d) => s + d.value, 0) > 0 ? ((totalPaymentsYear / pieData.reduce((s, d) => s + d.value, 0)) * 100).toFixed(1) : 0}%
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-rose-500"></div><span className="text-slate-400">Outstanding</span></div>
                        <span className="text-white font-medium">
                          {pieData.reduce((s, d) => s + d.value, 0) > 0 ? ((supplier.balance / pieData.reduce((s, d) => s + d.value, 0)) * 100).toFixed(1) : 0}%
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
                      Supplier Statement
                    </button>
                  </div>
                </div>

              </div>
            </div>
          </div>
        )}
        
        {/* Placeholder for other tabs */}
        {activeTab !== 'Overview' && (
          <div className="flex flex-col items-center justify-center h-64 bg-slate-900 border border-slate-800 rounded-xl">
            <Activity className="w-12 h-12 text-slate-700 mb-4" />
            <h2 className="text-white font-semibold">{activeTab}</h2>
            <p className="text-slate-400 text-sm mt-1">This module is part of the Enterprise architecture.</p>
          </div>
        )}
      </div>
    </div>
  );
}
