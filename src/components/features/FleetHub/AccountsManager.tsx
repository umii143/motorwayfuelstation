import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'motion/react';
import { GlobalSettings, FleetAccount, Shift } from '../../../types';
import { db } from '../../../data/db';
import { formatCurrency } from '../../../lib/currency';
import { 
  Building2, Plus, Search, ChevronDown, Download, Users, AlertCircle, Wallet, Clock, UsersRound, XCircle, MoreVertical
} from 'lucide-react';

interface AccountsManagerProps {
  settings: GlobalSettings;
  stationId: string;
}

const getCustomerLogo = (name: string) => {
  const n = name.toLowerCase();
  if (n.includes('dhl')) return 'https://upload.wikimedia.org/wikipedia/commons/b/b3/DHL_Express_logo.svg';
  if (n.includes('tcs')) return 'https://upload.wikimedia.org/wikipedia/commons/2/29/TCS_Couriers_logo.png';
  if (n.includes('leopards')) return 'https://leopardscourier.com/assets/images/logo.png';
  if (n.includes('foodpanda')) return 'https://upload.wikimedia.org/wikipedia/commons/1/14/Foodpanda_logo.svg';
  return null;
};

export default function AccountsManager({ settings, stationId }: AccountsManagerProps) {
  const [accounts, setAccounts] = useState<FleetAccount[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All Status');

  // Form State
  const [companyName, setCompanyName] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [creditLimit, setCreditLimit] = useState('');
  const [status, setStatus] = useState<'active' | 'suspended' | 'closed'>('active');

  useEffect(() => {
    loadData();
  }, [stationId]);

  const loadData = () => {
    setAccounts(db.getFleetAccounts(stationId));
    setShifts(db.getShifts(stationId));
  };

  const handleOpenModal = (account?: FleetAccount) => {
    if (account) {
      setEditingId(account.id);
      setCompanyName(account.companyName);
      setContactPerson(account.contactPerson);
      setPhone(account.phone);
      setEmail(account.email || '');
      setAddress(account.address || '');
      setCreditLimit(account.creditLimit.toString());
      setStatus(account.status);
    } else {
      setEditingId(null);
      setCompanyName('');
      setContactPerson('');
      setPhone('');
      setEmail('');
      setAddress('');
      setCreditLimit('');
      setStatus('active');
    }
    setIsModalOpen(true);
  };

  const handleSave = () => {
    if (!companyName || !contactPerson || !phone || !creditLimit) {
      alert("Please fill in all required fields.");
      return;
    }

    const currentAccounts = db.getFleetAccounts(stationId);
    let updatedAccounts: FleetAccount[];
    const now = Date.now();

    if (editingId) {
      updatedAccounts = currentAccounts.map(acc => 
        acc.id === editingId 
        ? { 
            ...acc, 
            companyName, contactPerson, phone, email, address, status,
            creditLimit: parseFloat(creditLimit),
            updatedAt: now
          } 
        : acc
      );
    } else {
      const newAccount: FleetAccount = {
        id: `fleet_acc_${now}`,
        companyName,
        contactPerson,
        phone,
        email,
        address,
        creditLimit: parseFloat(creditLimit),
        balance: 0,
        status,
        createdAt: now,
        updatedAt: now
      };
      updatedAccounts = [...currentAccounts, newAccount];
    }

    db.saveFleetAccounts(stationId, updatedAccounts);
    loadData();
    setIsModalOpen(false);
  };

  // KPIs
  const activeAccountsCount = accounts.filter(a => a.status === 'active').length;
  const suspendedAccountsCount = accounts.filter(a => a.status === 'suspended').length;
  const totalReceivables = accounts.reduce((sum, a) => sum + (a.balance > 0 ? a.balance : 0), 0);
  const totalCreditLimit = accounts.reduce((sum, a) => sum + (a.creditLimit || 0), 0);
  const creditUtilization = totalCreditLimit > 0 ? Math.round((totalReceivables / totalCreditLimit) * 100) : 0;

  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  
  // Real Sales MTD
  const salesMTD = shifts.flatMap(s => s.debitEntries || []).reduce((sum, d) => {
    const date = new Date(d.date || new Date().toISOString());
    if (date.getMonth() === currentMonth && date.getFullYear() === currentYear) {
      return sum + d.amount;
    }
    return sum;
  }, 0);

  const filteredAccounts = useMemo(() => {
    return accounts.filter(acc => {
      const matchSearch = acc.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          acc.contactPerson.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          acc.phone.includes(searchQuery);
      const matchStatus = statusFilter === 'All Status' || 
                          (statusFilter === 'Active' && acc.status === 'active') ||
                          (statusFilter === 'Suspended' && acc.status === 'suspended');
      return matchSearch && matchStatus;
    });
  }, [accounts, searchQuery, statusFilter]);

  return (
    <div className="space-y-6">
      {/* 4 KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Accounts */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg relative overflow-hidden group">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-xl bg-indigo-500/20 flex items-center justify-center text-indigo-400">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <p className="text-slate-400 text-xs font-semibold mb-1">Total Corporate</p>
              <h3 className="text-white text-2xl font-bold">{accounts.length}</h3>
            </div>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-slate-400">Active <span className="text-emerald-400 ml-1 font-semibold">{activeAccountsCount}</span></span>
            <span className="text-slate-400">Suspended <span className="text-amber-400 ml-1 font-semibold">{suspendedAccountsCount}</span></span>
          </div>
        </div>

        {/* Total Receivables */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg relative overflow-hidden group">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-xl bg-rose-500/20 flex items-center justify-center text-rose-400">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div>
              <p className="text-slate-400 text-xs font-semibold mb-1">Total Receivables</p>
              <h3 className="text-white text-2xl font-bold">PKR {formatCurrency(totalReceivables, settings).replace('Rs.', '').trim()}</h3>
            </div>
          </div>
          <div className="flex flex-col text-xs">
            <span className="text-slate-400 mb-1">Credit Limit Utilized</span>
            <span className="text-white font-bold">{creditUtilization}%</span>
          </div>
        </div>

        {/* Total Sales (MTD) */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg relative overflow-hidden group">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Wallet className="w-6 h-6" />
            </div>
            <div>
              <p className="text-slate-400 text-xs font-semibold mb-1">Total Sales (MTD)</p>
              <h3 className="text-white text-2xl font-bold">PKR {formatCurrency(salesMTD, settings).replace('Rs.', '').trim()}</h3>
            </div>
          </div>
          <div className="flex items-center text-xs">
            <span className="text-slate-400 mr-2">This Month</span>
            <span className="text-emerald-400 font-bold flex items-center gap-0.5">▲ Realtime</span>
          </div>
        </div>

        {/* Average Credit Limit */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg relative overflow-hidden group">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-400">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <p className="text-slate-400 text-xs font-semibold mb-1">Avg Credit Limit</p>
              <h3 className="text-white text-2xl font-bold">PKR {accounts.length ? formatCurrency(totalCreditLimit / accounts.length, settings).replace('Rs.', '').trim() : 0}</h3>
            </div>
          </div>
          <div className="flex flex-col text-xs w-full">
            <div className="flex justify-between mb-1.5">
              <span className="text-slate-400">Utilization</span>
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
              placeholder="Search customers by name, contact..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 text-white text-sm rounded-lg pl-10 pr-4 py-2.5 focus:outline-none focus:border-slate-600 transition-colors"
            />
          </div>
          <button 
            onClick={() => setStatusFilter(statusFilter === 'All Status' ? 'Active' : statusFilter === 'Active' ? 'Suspended' : 'All Status')}
            className="flex items-center gap-2 bg-slate-900 border border-slate-800 text-slate-300 px-4 py-2.5 rounded-lg text-sm hover:bg-slate-800 transition-colors"
          >
            {statusFilter} <ChevronDown className="w-4 h-4" />
          </button>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 bg-slate-900 border border-slate-800 text-slate-300 px-4 py-2.5 rounded-lg text-sm hover:bg-slate-800 transition-colors">
            <Download className="w-4 h-4" /> Export
          </button>
          <button 
            onClick={() => handleOpenModal()}
            className="flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors shadow-lg shadow-orange-600/20"
          >
            <Plus className="w-4 h-4" /> Add Customer
          </button>
        </div>
      </div>

      {/* Grid of Accounts */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredAccounts.map((acc, idx) => {
          const logoUrl = getCustomerLogo(acc.companyName);
          const isActive = acc.status === 'active';
          const isOverdue = acc.balance > (acc.creditLimit || 0) * 0.9; // 90% utilized

          return (
            <motion.div
              key={acc.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              onClick={() => window.history.pushState({}, '', '/fleet/' + acc.id)}
              className="bg-slate-900 border border-slate-800 rounded-xl p-5 hover:border-slate-600 transition-colors cursor-pointer group flex flex-col"
            >
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700 overflow-hidden shadow-inner">
                    {logoUrl ? (
                      <img src={logoUrl} alt={acc.companyName} className="w-full h-full object-contain p-1.5" />
                    ) : (
                      <span className="text-sm font-bold text-slate-400">{acc.companyName.substring(0, 2).toUpperCase()}</span>
                    )}
                  </div>
                  <div>
                    <h4 className="text-white font-bold text-sm truncate max-w-[140px]">{acc.companyName}</h4>
                    <p className="text-slate-400 text-[11px] mt-0.5">Corporate Fleet</p>
                  </div>
                </div>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${isActive ? 'bg-emerald-500/10 text-emerald-500' : acc.status === 'suspended' ? 'bg-amber-500/10 text-amber-500' : 'bg-slate-800 text-slate-500'}`}>
                  {acc.status}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-5">
                <div>
                  <p className="text-slate-500 text-[10px] uppercase font-semibold mb-1">Receivable</p>
                  <p className={`text-sm font-bold ${isOverdue ? 'text-rose-500' : 'text-emerald-500'}`}>
                    PKR {formatCurrency(acc.balance, settings).replace('Rs.', '').trim()}
                  </p>
                </div>
                <div>
                  <p className="text-slate-500 text-[10px] uppercase font-semibold mb-1">Credit Limit</p>
                  <p className="text-white text-sm font-bold">
                    PKR {formatCurrency(acc.creditLimit || 0, settings).replace('Rs.', '').trim()}
                  </p>
                </div>
                <div className="col-span-2">
                  <p className="text-slate-500 text-[10px] uppercase font-semibold mb-1">Contact Details</p>
                  <div className="flex items-center justify-between text-white text-xs font-semibold">
                    <span className="flex items-center gap-1"><UsersRound className="w-3 h-3 text-slate-400"/> {acc.contactPerson}</span>
                    <span className="text-slate-400">{acc.phone}</span>
                  </div>
                </div>
              </div>

              <div className="mt-auto pt-4 border-t border-slate-800 flex justify-between">
                <button 
                  onClick={(e) => { e.stopPropagation(); window.history.pushState({}, '', '/fleet/' + acc.id); }}
                  className="flex flex-col items-center gap-1.5 text-slate-400 hover:text-white transition-colors"
                >
                  <Building2 className="w-4 h-4" />
                  <span className="text-[9px]">Dashboard</span>
                </button>
                <button 
                  onClick={(e) => { e.stopPropagation(); handleOpenModal(acc); }}
                  className="flex flex-col items-center gap-1.5 text-slate-400 hover:text-white transition-colors"
                >
                  <MoreVertical className="w-4 h-4" />
                  <span className="text-[9px]">Edit</span>
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>

      {filteredAccounts.length === 0 && (
        <div className="py-12 text-center border border-dashed border-slate-800 rounded-xl bg-slate-900/50">
          <Building2 className="w-8 h-8 text-slate-600 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-white mb-1">No Corporate Accounts Found</h3>
          <p className="text-xs text-slate-500">Adjust your search or add a new customer.</p>
        </div>
      )}

      {/* Form Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="bg-slate-900 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-800 flex flex-col max-h-[90vh]"
          >
            <div className="px-6 py-4 border-b border-slate-800 flex justify-between items-center bg-slate-900 sticky top-0 z-10">
              <h2 className="text-lg font-bold text-white">
                {editingId ? 'Edit Customer Account' : 'New Customer Account'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-rose-400 transition-colors">
                <XCircle className="h-6 w-6" />
              </button>
            </div>
            
            <div className="p-6 space-y-5 overflow-y-auto custom-scrollbar">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1.5">Company Name *</label>
                  <input type="text" value={companyName} onChange={e => setCompanyName(e.target.value)} className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 text-white rounded-lg text-sm focus:outline-none focus:border-orange-500" placeholder="e.g. DHL Express" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1.5">Contact Person *</label>
                  <input type="text" value={contactPerson} onChange={e => setContactPerson(e.target.value)} className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 text-white rounded-lg text-sm focus:outline-none focus:border-orange-500" placeholder="Name of Fleet Manager" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1.5">Phone Number *</label>
                  <input type="text" value={phone} onChange={e => setPhone(e.target.value)} className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 text-white rounded-lg text-sm focus:outline-none focus:border-orange-500" placeholder="03xx-xxxxxxx" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1.5">Email Address</label>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 text-white rounded-lg text-sm focus:outline-none focus:border-orange-500" placeholder="billing@company.com" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-400 mb-1.5">Office Address</label>
                  <input type="text" value={address} onChange={e => setAddress(e.target.value)} className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 text-white rounded-lg text-sm focus:outline-none focus:border-orange-500" placeholder="Company HQ Address" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1.5">Credit Limit ({settings.currency}) *</label>
                  <input type="number" value={creditLimit} onChange={e => setCreditLimit(e.target.value)} className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 text-white rounded-lg text-sm focus:outline-none focus:border-orange-500" placeholder="500000" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1.5">Account Status</label>
                  <select value={status} onChange={e => setStatus(e.target.value as any)} className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 text-white rounded-lg text-sm focus:outline-none focus:border-orange-500">
                    <option value="active">Active</option>
                    <option value="suspended">Suspended</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-slate-800 bg-slate-900 flex justify-end gap-3 sticky bottom-0 z-10">
              <button onClick={() => setIsModalOpen(false)} className="px-4 py-2.5 text-sm font-bold text-slate-400 hover:text-white transition-colors">Cancel</button>
              <button onClick={handleSave} className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-2.5 rounded-lg text-sm font-bold transition-colors shadow-lg shadow-orange-600/20">
                Save Account
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
