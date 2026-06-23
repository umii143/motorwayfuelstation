import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Mail, Phone, MapPin, Calendar, Clock, CreditCard, Receipt, FileText, ArrowUpRight, ArrowDownRight, User } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Supplier, GlobalSettings, Shift } from '../../../types';
import { formatCurrency } from '../../../lib/currency';
import { t as translate } from '../../../lib/translations';

interface SupplierDetailsPanelProps {
  supplier: Supplier | null;
  settings: GlobalSettings;
  shifts: Shift[];
  onClose: () => void;
}

 
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function SupplierDetailsPanel({ supplier, settings, shifts, onClose }: SupplierDetailsPanelProps) {
  const t = (en: string, ur: string) => translate(en, ur, settings);

  // Generate mock chart data since real purchase history by month needs deep aggregation
  const chartData = useMemo(() => {
    return [
      { name: 'Jan', purchases: 400000, payments: 240000 },
      { name: 'Feb', purchases: 300000, payments: 139800 },
      { name: 'Mar', purchases: 200000, payments: 980000 },
      { name: 'Apr', purchases: 278000, payments: 390800 },
      { name: 'May', purchases: 189000, payments: 480000 },
      { name: 'Jun', purchases: 239000, payments: 380000 },
      { name: 'Jul', purchases: 349000, payments: 430000 },
      { name: 'Aug', purchases: 200000, payments: 250000 },
      { name: 'Sep', purchases: 278000, payments: 300000 },
      { name: 'Oct', purchases: 189000, payments: 200000 },
      { name: 'Nov', purchases: 239000, payments: 270000 },
      { name: 'Dec', purchases: 349000, payments: 400000 },
    ];
  }, []);

  if (!supplier) return null;

  const isActive = supplier.status !== 'Inactive';
  const typeLabel = supplier.supplierType || 'Fuel Supplier';
  
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, x: 300 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 300 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="fixed inset-y-0 right-0 z-50 w-full max-w-xl bg-slate-900 border-l border-slate-800 shadow-2xl overflow-y-auto flex flex-col"
      >
        {/* Header Section */}
        <div className="p-6 border-b border-slate-800">
          <div className="flex justify-between items-start mb-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-700 flex items-center justify-center border border-slate-600 shadow-inner">
                <span className="text-2xl font-black text-white">
                  {supplier.name.substring(0, 2).toUpperCase()}
                </span>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h2 className="text-2xl font-bold text-white tracking-tight">{t(supplier.name, supplier.urduName)}</h2>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${isActive ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'}`}>
                    {isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <p className="text-sm text-slate-400 font-medium">{typeLabel}</p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Tabs */}
          <div className="flex gap-6 border-b border-slate-800 mt-4">
            {['Overview', 'Ledger', 'Purchases', 'Payments', 'Documents'].map((tab, idx) => (
              <button 
                key={tab}
                className={`pb-3 text-sm font-semibold transition-colors cursor-pointer ${idx === 0 ? 'text-white border-b-2 border-blue-500' : 'text-slate-400 hover:text-slate-200'}`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Content Section */}
        <div className="flex-1 p-6 space-y-8">
          
          {/* Info Grid */}
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <User className="w-4 h-4 text-slate-500 mt-0.5" />
                <div>
                  <p className="text-xs text-slate-500 mb-0.5">Contact Person</p>
                  <p className="text-sm text-white font-medium">{supplier.name.split(' ')[0]} Admin</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Phone className="w-4 h-4 text-slate-500 mt-0.5" />
                <div>
                  <p className="text-xs text-slate-500 mb-0.5">Phone</p>
                  <p className="text-sm text-white font-medium">{supplier.contact || 'N/A'}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Mail className="w-4 h-4 text-slate-500 mt-0.5" />
                <div>
                  <p className="text-xs text-slate-500 mb-0.5">Email</p>
                  <p className="text-sm text-white font-medium">{supplier.email || 'info@company.com'}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <FileText className="w-4 h-4 text-slate-500 mt-0.5" />
                <div>
                  <p className="text-xs text-slate-500 mb-0.5">NTN</p>
                  <p className="text-sm text-white font-medium">{supplier.ntn || '1234567-8'}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-slate-500 mt-0.5" />
                <div>
                  <p className="text-xs text-slate-500 mb-0.5">Address</p>
                  <p className="text-sm text-white font-medium">{supplier.address || 'Head Office, Pakistan'}</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <CreditCard className="w-4 h-4 text-slate-500 mt-0.5" />
                <div>
                  <p className="text-xs text-slate-500 mb-0.5">Credit Limit</p>
                  <p className="text-sm text-white font-medium">{formatCurrency(supplier.creditLimit || 5000000, settings)}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <ArrowUpRight className="w-4 h-4 text-rose-500 mt-0.5" />
                <div>
                  <p className="text-xs text-slate-500 mb-0.5">Outstanding</p>
                  <p className="text-sm text-rose-400 font-medium">{formatCurrency(supplier.balance, settings)}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <ArrowDownRight className="w-4 h-4 text-emerald-500 mt-0.5" />
                <div>
                  <p className="text-xs text-slate-500 mb-0.5">Available Credit</p>
                  <p className="text-sm text-emerald-400 font-medium">
                    {formatCurrency(Math.max(0, (supplier.creditLimit || 5000000) - supplier.balance), settings)}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Clock className="w-4 h-4 text-slate-500 mt-0.5" />
                <div>
                  <p className="text-xs text-slate-500 mb-0.5">Average Credit Days</p>
                  <p className="text-sm text-white font-medium">18 Days</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Calendar className="w-4 h-4 text-slate-500 mt-0.5" />
                <div>
                  <p className="text-xs text-slate-500 mb-0.5">Supplier Since</p>
                  <p className="text-sm text-white font-medium">{supplier.supplierSince || 'Jan 15, 2023'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Chart Section */}
          <div className="bg-slate-800/50 rounded-xl p-5 border border-slate-700/50">
            <h3 className="text-white font-semibold mb-4 text-sm">Purchase Analytics (This Year)</h3>
            <div className="flex gap-6 mb-6">
              <div>
                <p className="text-xs text-slate-400 mb-1">Total Purchases</p>
                <p className="text-sm text-white font-bold">PKR 12,450,000</p>
              </div>
              <div>
                <p className="text-xs text-slate-400 mb-1">Total Payments</p>
                <p className="text-sm text-white font-bold">PKR 11,200,000</p>
              </div>
              <div>
                <p className="text-xs text-slate-400 mb-1">Orders</p>
                <p className="text-sm text-white font-bold">24</p>
              </div>
              <div>
                <p className="text-xs text-slate-400 mb-1">Average Order Value</p>
                <p className="text-sm text-white font-bold">PKR 518,750</p>
              </div>
            </div>
            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorPurchases" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f97316" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                  <XAxis dataKey="name" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(value) => `${value / 1000}K`} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                    itemStyle={{ color: '#f1f5f9' }}
                  />
                  <Area type="monotone" dataKey="purchases" stroke="#f97316" strokeWidth={2} fillOpacity={1} fill="url(#colorPurchases)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Quick Actions */}
          <div>
            <h3 className="text-white font-semibold mb-3 text-sm">Quick Actions</h3>
            <div className="grid grid-cols-4 gap-3">
              <button className="flex flex-col items-center justify-center gap-2 p-3 bg-slate-800 hover:bg-slate-700 rounded-xl border border-slate-700 transition-colors cursor-pointer group">
                <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400 group-hover:bg-emerald-500/20">
                  <CreditCard className="w-5 h-5" />
                </div>
                <span className="text-xs text-slate-300 font-medium text-center">Record Payment</span>
              </button>
              <button className="flex flex-col items-center justify-center gap-2 p-3 bg-slate-800 hover:bg-slate-700 rounded-xl border border-slate-700 transition-colors cursor-pointer group">
                <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center text-orange-400 group-hover:bg-orange-500/20">
                  <Receipt className="w-5 h-5" />
                </div>
                <span className="text-xs text-slate-300 font-medium text-center">Create Purchase</span>
              </button>
              <button className="flex flex-col items-center justify-center gap-2 p-3 bg-slate-800 hover:bg-slate-700 rounded-xl border border-slate-700 transition-colors cursor-pointer group">
                <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400 group-hover:bg-blue-500/20">
                  <FileText className="w-5 h-5" />
                </div>
                <span className="text-xs text-slate-300 font-medium text-center">View Ledger</span>
              </button>
              <button className="flex flex-col items-center justify-center gap-2 p-3 bg-slate-800 hover:bg-slate-700 rounded-xl border border-slate-700 transition-colors cursor-pointer group">
                <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-400 group-hover:bg-purple-500/20">
                  <FileText className="w-5 h-5" />
                </div>
                <span className="text-xs text-slate-300 font-medium text-center">Statement</span>
              </button>
            </div>
          </div>

        </div>
      </motion.div>
    </AnimatePresence>
  );
}
