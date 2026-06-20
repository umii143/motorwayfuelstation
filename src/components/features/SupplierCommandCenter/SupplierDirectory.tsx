import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import {
  Users, AlertCircle, Wallet, Clock, Search, ChevronDown, Download, Plus, MapPin, Receipt, CheckCircle, XCircle
} from 'lucide-react';
import { Supplier, Shift, Product, GlobalSettings, BankAccount, StockBatch } from '../../../types';
import { formatCurrency, getCurrencySymbol } from '../../../lib/currency';
import { t as translate } from '../../../lib/translations';
import { useStation } from '../../../contexts/StationContext';
import { AddSupplierModal } from './AddSupplierModal';

interface SuppliersProps {
  settings: GlobalSettings;
  suppliers: Supplier[];
  shifts: Shift[];
  products: Product[];
  banks: BankAccount[];
  batches: StockBatch[];
  onAddSupplier: (supplier: Supplier) => void;
  onUpdateSupplier: (supplier: Supplier) => void;
  onDeleteSupplier: (supplierId: string) => void;
  onDeleteSupplierPayment: (shiftId: string, entryId: string) => void;
  onNavigateToSupplier: (id: string) => void;
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

export default function SupplierDirectory({
  settings, suppliers, shifts, batches, onAddSupplier, onUpdateSupplier, onDeleteSupplier, onNavigateToSupplier
}: SuppliersProps) {
  const { showToast, showConfirm } = useStation();
  const t = (en: string, ur: string) => translate(en, ur, settings);

  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('All Types');
  const [statusFilter, setStatusFilter] = useState('All Status');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const activeSuppliersCount = suppliers.filter(s => s.status !== 'Inactive').length;
  const inactiveSuppliersCount = suppliers.length - activeSuppliersCount;
  const totalOutstanding = suppliers.reduce((sum, s) => sum + s.balance, 0);
  // Dynamically calculate metrics based on real data
  const totalCreditLimit = suppliers.reduce((sum, s) => sum + (s.creditLimit || 0), 0);
  const creditUtilization = totalCreditLimit > 0 ? Math.round((totalOutstanding / totalCreditLimit) * 100) : 0;
  
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const purchasesMTD = batches.reduce((sum, b) => {
    const d = new Date(b.date);
    if (d.getMonth() === currentMonth && d.getFullYear() === currentYear) {
      return sum + (b.invoiceTotalAmount || 0);
    }
    return sum;
  }, 0);

  // Approximate overdue based on balances exceeding payment terms
  const overdueAmount = suppliers.reduce((sum, s) => {
    // If supplier balance is high and they have payment terms (e.g., 30 days)
    // We do a simplified overdue estimation if we don't have deep invoice ageing
    return sum + (s.balance > (s.creditLimit * 0.8) ? (s.balance * 0.2) : 0);
  }, 0);
  const avgCreditDays = suppliers.length > 0 ? Math.round(suppliers.reduce((sum, s) => sum + ((s as any).paymentTermsDays || 0), 0) / suppliers.length) : 0;

  const filteredSuppliers = useMemo(() => {
    return suppliers.filter(s => {
      const matchSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          s.urduName.includes(searchQuery) ||
                          s.contact.includes(searchQuery);
      const matchType = typeFilter === 'All Types' || s.supplierType === typeFilter;
      const matchStatus = statusFilter === 'All Status' || s.status === statusFilter;
      return matchSearch && matchType && matchStatus;
    });
  }, [suppliers, searchQuery, typeFilter, statusFilter]);

  // Handle dark mode globally via body class since FuelPro supports light/dark
  // but we enforce sleek dark card aesthetics where possible.

  return (
    <div className="space-y-6">
      {/* 4 KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Suppliers */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg relative overflow-hidden group">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-xl bg-indigo-500/20 flex items-center justify-center text-indigo-400">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <p className="text-slate-400 text-xs font-semibold mb-1">Total Suppliers</p>
              <h3 className="text-white text-2xl font-bold">{suppliers.length}</h3>
            </div>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-slate-400">Active Suppliers <span className="text-emerald-400 ml-1 font-semibold">{activeSuppliersCount}</span></span>
            <span className="text-slate-400">Inactive <span className="text-rose-400 ml-1 font-semibold">{inactiveSuppliersCount}</span></span>
          </div>
        </div>

        {/* Total Outstanding */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg relative overflow-hidden group">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-xl bg-orange-500/20 flex items-center justify-center text-orange-400">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div>
              <p className="text-slate-400 text-xs font-semibold mb-1">Total Outstanding</p>
              <h3 className="text-white text-2xl font-bold">PKR {formatCurrency(totalOutstanding, settings).replace('Rs.', '').trim()}</h3>
            </div>
          </div>
          <div className="flex flex-col text-xs">
            <span className="text-slate-400 mb-1">Overdue</span>
            <span className="text-rose-500 font-bold">PKR {formatCurrency(overdueAmount, settings).replace('Rs.', '').trim()}</span>
          </div>
        </div>

        {/* Total Purchases (MTD) */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg relative overflow-hidden group">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Wallet className="w-6 h-6" />
            </div>
            <div>
              <p className="text-slate-400 text-xs font-semibold mb-1">Total Purchases (MTD)</p>
              <h3 className="text-white text-2xl font-bold">PKR {formatCurrency(purchasesMTD, settings).replace('Rs.', '').trim()}</h3>
            </div>
          </div>
          <div className="flex items-center text-xs">
            <span className="text-slate-400 mr-2">This Month</span>
            <span className="text-emerald-400 font-bold flex items-center gap-0.5">▲ 12.5%</span>
          </div>
        </div>

        {/* Average Credit Days */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg relative overflow-hidden group">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-400">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <p className="text-slate-400 text-xs font-semibold mb-1">Average Credit Days</p>
              <h3 className="text-white text-2xl font-bold">{avgCreditDays} Days</h3>
            </div>
          </div>
          <div className="flex flex-col text-xs w-full">
            <div className="flex justify-between mb-1.5">
              <span className="text-slate-400">Credit Utilization</span>
              <span className="text-white font-bold">{creditUtilization}%</span>
            </div>
            <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full bg-blue-500 rounded-full" style={{ width: `${creditUtilization}%` }}></div>
            </div>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
        <div className="flex flex-1 gap-3 max-w-3xl">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search supplier by name, contact, NTN..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 text-white text-sm rounded-lg pl-10 pr-4 py-2.5 focus:outline-hidden focus:border-slate-600 transition-colors"
            />
          </div>
          <button className="flex items-center gap-2 bg-slate-900 border border-slate-800 text-slate-300 px-4 py-2.5 rounded-lg text-sm hover:bg-slate-800 transition-colors">
            {typeFilter} <ChevronDown className="w-4 h-4" />
          </button>
          <button className="flex items-center gap-2 bg-slate-900 border border-slate-800 text-slate-300 px-4 py-2.5 rounded-lg text-sm hover:bg-slate-800 transition-colors">
            {statusFilter} <ChevronDown className="w-4 h-4" />
          </button>
          <button className="flex items-center gap-2 bg-slate-900 border border-slate-800 text-slate-300 px-4 py-2.5 rounded-lg text-sm hover:bg-slate-800 transition-colors hidden lg:flex">
            Credit Suppliers <ChevronDown className="w-4 h-4" />
          </button>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 bg-slate-900 border border-slate-800 text-slate-300 px-4 py-2.5 rounded-lg text-sm hover:bg-slate-800 transition-colors">
            <Download className="w-4 h-4" /> Export
          </button>
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors shadow-lg shadow-orange-600/20 cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Add Supplier
          </button>
        </div>
      </div>

      {/* Grid of Supplier Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredSuppliers.map((sup, idx) => {
          const logoUrl = getSupplierLogo(sup.name);
          const isActive = sup.status !== 'Inactive';
          const isOverdue = sup.balance > (sup.creditLimit || 5000000) * 0.8;

          return (
            <motion.div
              key={sup.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              onClick={() => onNavigateToSupplier(sup.id)}
              className="bg-slate-900 border border-slate-800 rounded-xl p-5 hover:border-slate-600 transition-colors cursor-pointer group flex flex-col"
            >
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700 overflow-hidden shadow-inner">
                    {logoUrl ? (
                      <img src={logoUrl} alt={sup.name} className="w-full h-full object-contain p-1.5" />
                    ) : (
                      <span className="text-sm font-bold text-slate-400">{sup.name.substring(0, 2).toUpperCase()}</span>
                    )}
                  </div>
                  <div>
                    <h4 className="text-white font-bold text-sm truncate max-w-[140px]">{t(sup.name, sup.urduName)}</h4>
                    <p className="text-slate-400 text-[11px] mt-0.5">{sup.supplierType || 'Fuel Supplier'}</p>
                  </div>
                </div>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${isActive ? 'bg-emerald-500/10 text-emerald-500' : 'bg-slate-800 text-slate-500'}`}>
                  {isActive ? 'Active' : 'Inactive'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-5">
                <div>
                  <p className="text-slate-500 text-[10px] uppercase font-semibold mb-1">Outstanding</p>
                  <p className={`text-sm font-bold ${isOverdue ? 'text-rose-500' : 'text-rose-500'}`}>
                    PKR {formatCurrency(sup.balance, settings).replace('Rs.', '').trim()}
                  </p>
                </div>
                <div>
                  <p className="text-slate-500 text-[10px] uppercase font-semibold mb-1">Credit Limit</p>
                  <p className="text-white text-sm font-bold">
                    PKR {formatCurrency(sup.creditLimit || 5000000, settings).replace('Rs.', '').trim()}
                  </p>
                </div>
                <div className="col-span-2">
                  <p className="text-slate-500 text-[10px] uppercase font-semibold mb-1">Last Purchase</p>
                  <p className="text-white text-xs font-semibold">2 Days Ago</p>
                </div>
              </div>

              <div className="mt-auto pt-4 border-t border-slate-800 flex justify-between">
                <button className="flex flex-col items-center gap-1.5 text-slate-400 hover:text-white transition-colors">
                  <Users className="w-4 h-4" />
                  <span className="text-[9px]">Profile</span>
                </button>
                <button className="flex flex-col items-center gap-1.5 text-slate-400 hover:text-white transition-colors">
                  <Receipt className="w-4 h-4" />
                  <span className="text-[9px]">Ledger</span>
                </button>
                <button className="flex flex-col items-center gap-1.5 text-slate-400 hover:text-white transition-colors">
                  <Clock className="w-4 h-4" />
                  <span className="text-[9px]">Purchases</span>
                </button>
                <button className="flex flex-col items-center gap-1.5 text-slate-400 hover:text-white transition-colors">
                  <Wallet className="w-4 h-4" />
                  <span className="text-[9px]">Payment</span>
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Add Supplier Modal */}
      {isAddModalOpen && (
        <AddSupplierModal 
          settings={settings}
          onClose={() => setIsAddModalOpen(false)}
          onAdd={onAddSupplier}
        />
      )}
    </div>
  );
}
