import React, { useState, useEffect } from 'react';
import { GlobalSettings, FleetAccount } from '../../../types';
import { db } from '../../../data/db';
import { Plus, Building2, Phone, Mail, CreditCard, MoreVertical, Search, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';

interface AccountsManagerProps {
  settings: GlobalSettings;
  stationId: string;
}

export default function AccountsManager({ settings, stationId }: AccountsManagerProps) {
  const [accounts, setAccounts] = useState<FleetAccount[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Form State
  const [companyName, setCompanyName] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [creditLimit, setCreditLimit] = useState('');
  const [status, setStatus] = useState<'active' | 'suspended' | 'closed'>('active');

  useEffect(() => {
    loadAccounts();
  }, [stationId]);

  const loadAccounts = () => {
    setAccounts(db.getFleetAccounts(stationId));
  };

  const handleOpenModal = (account?: FleetAccount) => {
    if (account) {
      setEditingId(account.id);
      setCompanyName(account.companyName);
      setContactPerson(account.contactPerson);
      setPhone(account.phone);
      setEmail(account.email);
      setAddress(account.address);
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
    loadAccounts();
    setIsModalOpen(false);
  };

  const filteredAccounts = accounts.filter(acc => 
    acc.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    acc.contactPerson.toLowerCase().includes(searchQuery.toLowerCase()) ||
    acc.phone.includes(searchQuery)
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-row justify-between items-start items-center gap-4 bg-white p-4 rounded-xl border border-slate-200">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search corporate accounts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          />
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-slate-800 transition whitespace-nowrap"
        >
          <Plus className="h-4 w-4" />
          Add Corporate Account
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {filteredAccounts.map(account => (
          <div key={account.id} className="kpi-card p-2">
            <div className="flex justify-between items-start mb-2">
              <div className="flex items-center gap-2 truncate">
                <div className={`w-6 h-6 rounded flex items-center justify-center shrink-0 ${account.status === 'active' ? 'bg-emerald-500/20 text-emerald-600' : account.status === 'suspended' ? 'bg-amber-500/20 text-amber-600' : 'bg-rose-500/20 text-rose-600'}`}>
                  <Building2 className="w-3.5 h-3.5" />
                </div>
                <div className="truncate">
                  <h3 className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate leading-tight">{account.companyName}</h3>
                  <span className={`text-[9px] font-bold uppercase ${account.status === 'active' ? 'text-emerald-500' : account.status === 'suspended' ? 'text-amber-500' : 'text-rose-500'}`}>
                    {account.status}
                  </span>
                </div>
              </div>
              <button 
                onClick={() => handleOpenModal(account)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 p-0.5"
              >
                <MoreVertical className="w-4 h-4" />
              </button>
            </div>
            
            <div className="space-y-1 mt-2 text-[10px] text-slate-500 dark:text-slate-400">
              <div className="flex items-center justify-between gap-1">
                <div className="flex items-center gap-1 truncate">
                  <UsersRound className="w-3 h-3 text-slate-400 shrink-0" />
                  <span className="truncate">{account.contactPerson}</span>
                </div>
                <span className="font-mono">{account.phone}</span>
              </div>
              
              <div className="flex items-center justify-between mt-1.5 pt-1.5 border-t border-slate-100 dark:border-slate-800/50">
                <span className="text-[9px] uppercase">Limit</span>
                <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
                  {settings.currency} {account.creditLimit.toLocaleString()}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[9px] uppercase">Bal</span>
                <span className={`font-mono font-bold ${account.balance > 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
                  {settings.currency} {account.balance.toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        ))}

        {filteredAccounts.length === 0 && (
          <div className="col-span-2 py-8 text-center border border-dashed border-theme-main rounded-xl bg-theme-card">
            <Building2 className="w-6 h-6 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
            <h3 className="text-xs font-bold text-theme-main">No Corporate Accounts</h3>
            <p className="text-[10px] text-slate-500 mt-1">Add a corporate fleet account.</p>
          </div>
        )}
      </div>

      {/* Form Modal */}
      {isModalOpen && (
        <div className="premium-modal-overlay">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h2 className="text-lg font-black font-sans text-slate-800">
                {editingId ? 'Edit Corporate Account' : 'New Corporate Account'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-rose-500 transition">
                <XCircle className="h-5 w-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-1 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Company Name *</label>
                  <input type="text" value={companyName} onChange={e => setCompanyName(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" placeholder="e.g. DHL Express" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Contact Person *</label>
                  <input type="text" value={contactPerson} onChange={e => setContactPerson(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" placeholder="Name of Fleet Manager" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Phone Number *</label>
                  <input type="text" value={phone} onChange={e => setPhone(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" placeholder="03xx-xxxxxxx" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Email Address</label>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" placeholder="billing@company.com" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">Office Address</label>
                  <input type="text" value={address} onChange={e => setAddress(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" placeholder="Company HQ Address" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Monthly Credit Limit ({settings.currency}) *</label>
                  <input type="number" value={creditLimit} onChange={e => setCreditLimit(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" placeholder="500000" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Account Status</label>
                  <select value={status} onChange={e => setStatus(e.target.value as any)} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500">
                    <option value="active">Active (Allowed to fuel)</option>
                    <option value="suspended">Suspended (Credit Hold)</option>
                    <option value="closed">Closed (Terminated)</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-2">
              <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm font-bold text-slate-600 hover:text-slate-900 transition">Cancel</button>
              <button onClick={handleSave} className="bg-orange-600 text-white px-6 py-3 sm:py-2 min-h-[48px] sm:min-h-[40px] rounded-lg text-sm font-bold hover:bg-orange-700 transition shadow-md shadow-orange-500/20">
                Save Account
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Temporary imports to avoid errors until we create other files
import { UsersRound, FileSpreadsheet } from 'lucide-react';
