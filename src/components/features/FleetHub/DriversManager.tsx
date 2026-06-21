import React, { useState, useEffect } from 'react';
import { GlobalSettings, Driver, FleetAccount, FleetVehicle } from '../../../types';
import { db } from '../../../data/db';
import { Plus, UsersRound, Search, XCircle, Building2, CarFront, Contact, AlertTriangle } from 'lucide-react';

interface DriversManagerProps {
  settings: GlobalSettings;
  stationId: string;
}

export default function DriversManager({ settings, stationId }: DriversManagerProps) {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [accounts, setAccounts] = useState<FleetAccount[]>([]);
  const [vehicles, setVehicles] = useState<FleetVehicle[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterAccount, setFilterAccount] = useState<string>('all');

  // Form State
  const [accountId, setAccountId] = useState('');
  const [name, setName] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [phone, setPhone] = useState('');
  const [assignedVehicleId, setAssignedVehicleId] = useState('');
  const [status, setStatus] = useState<'active' | 'suspended'>('active');

  useEffect(() => {
    loadData();
  }, [stationId]);

  const loadData = () => {
    setDrivers(db.getFleetDrivers(stationId));
    setAccounts(db.getFleetAccounts(stationId));
    setVehicles(db.getFleetVehicles(stationId));
  };

  const handleOpenModal = (driver?: Driver) => {
    if (driver) {
      setEditingId(driver.id);
      setAccountId(driver.accountId);
      setName(driver.name);
      setLicenseNumber(driver.licenseNumber);
      setPhone(driver.phone);
      setAssignedVehicleId(driver.assignedVehicleId || '');
      setStatus(driver.status);
    } else {
      setEditingId(null);
      setAccountId(accounts.length > 0 ? accounts[0].id : '');
      setName('');
      setLicenseNumber('');
      setPhone('');
      setAssignedVehicleId('');
      setStatus('active');
    }
    setIsModalOpen(true);
  };

  const handleSave = () => {
    if (!accountId || !name || !licenseNumber) {
      alert("Please fill in all required fields.");
      return;
    }

    const currentDrivers = db.getFleetDrivers(stationId);
    let updatedDrivers: Driver[];
    const now = Date.now();

    if (editingId) {
      updatedDrivers = currentDrivers.map(d => 
        d.id === editingId 
        ? { 
            ...d, 
            accountId, name, licenseNumber, phone, status,
            assignedVehicleId: assignedVehicleId === '' ? undefined : assignedVehicleId,
            updatedAt: now
          } 
        : d
      );
    } else {
      const newDriver: Driver = {
        id: `drv_${now}`,
        accountId,
        name,
        licenseNumber,
        phone,
        status,
        assignedVehicleId: assignedVehicleId === '' ? undefined : assignedVehicleId,
        createdAt: now,
        updatedAt: now
      };
      updatedDrivers = [...currentDrivers, newDriver];
    }

    db.saveFleetDrivers(stationId, updatedDrivers);
    loadData();
    setIsModalOpen(false);
  };

  const getAccountName = (id: string) => {
    const acc = accounts.find(a => a.id === id);
    return acc ? acc.companyName : 'Unknown Account';
  };

  const getVehicleReg = (id?: string) => {
    if (!id) return null;
    const v = vehicles.find(v => v.id === id);
    return v ? v.registrationNumber : 'Unknown Vehicle';
  };

  const filteredDrivers = drivers.filter(d => 
    (filterAccount === 'all' || d.accountId === filterAccount) &&
    (d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
     d.licenseNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
     d.phone.includes(searchQuery))
  );

  const availableVehiclesForAccount = vehicles.filter(v => v.accountId === accountId);

  return (
    <div className="space-y-4">
      <div className="flex flex-row justify-between items-center gap-2 mb-2">
        <div className="flex flex-row gap-2 w-full flex-1">
          <div className="relative w-full">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search Name, License..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-theme-card border border-theme-main rounded-lg text-xs focus:outline-none focus:border-orange-500"
            />
          </div>
          <select 
            value={filterAccount} 
            onChange={(e) => setFilterAccount(e.target.value)}
            className="w-full px-2 py-1.5 bg-theme-card border border-theme-main rounded-lg text-xs focus:outline-none focus:border-orange-500"
          >
            <option value="all">All Accounts</option>
            {accounts.map(acc => (
              <option key={acc.id} value={acc.id}>{acc.companyName}</option>
            ))}
          </select>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          disabled={accounts.length === 0}
          className="flex items-center gap-1.5 bg-slate-900 dark:bg-slate-800 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-slate-800 transition whitespace-nowrap disabled:opacity-50"
        >
          <Plus className="h-3.5 w-3.5" />
          Add
        </button>
      </div>

      {accounts.length === 0 && (
        <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 text-amber-800 dark:text-amber-500 p-3 rounded-xl flex items-start gap-2 mb-2">
          <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
          <div>
            <h4 className="font-bold text-xs">No Corporate Accounts Exist</h4>
            <p className="text-[10px] mt-0.5 opacity-80">You must create a corporate fleet account before you can add drivers.</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-2">
        {filteredDrivers.map(driver => (
          <div key={driver.id} className="kpi-card p-2">
            <div className="flex justify-between items-start mb-2">
              <div className="flex items-center gap-2 truncate">
                <div className={`w-6 h-6 rounded flex items-center justify-center shrink-0 ${driver.status === 'active' ? 'bg-indigo-500/20 text-indigo-600' : 'bg-rose-500/20 text-rose-600'}`}>
                  <Contact className="w-3.5 h-3.5" />
                </div>
                <div className="truncate">
                  <h3 className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate leading-tight">{driver.name}</h3>
                  <span className={`text-[9px] font-bold uppercase ${driver.status === 'active' ? 'text-emerald-500' : 'text-rose-500'}`}>
                    {driver.status}
                  </span>
                </div>
              </div>
              <button 
                onClick={() => handleOpenModal(driver)}
                className="text-orange-600 hover:text-orange-800 dark:hover:text-orange-400 font-bold text-[10px] bg-orange-50 dark:bg-orange-500/10 px-2 py-1 rounded transition"
              >
                Edit
              </button>
            </div>
            
            <div className="space-y-1.5 mt-2 text-[10px] text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800/50 pt-2">
              <div className="flex items-center gap-1.5 truncate">
                <Building2 className="w-3 h-3 text-slate-400 shrink-0" />
                <span className="font-medium text-slate-700 dark:text-slate-300 truncate">{getAccountName(driver.accountId)}</span>
              </div>
              <div className="flex items-center gap-1.5 truncate">
                <Contact className="w-3 h-3 text-slate-400 shrink-0" />
                <span className="truncate">Lic: <span className="font-mono text-slate-800 dark:text-slate-200">{driver.licenseNumber}</span></span>
              </div>
              <div className="flex items-center gap-1.5 truncate">
                <CarFront className="w-3 h-3 text-slate-400 shrink-0" />
                {driver.assignedVehicleId ? (
                  <span className="truncate">Assigned: <span className="font-mono font-bold text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded">{getVehicleReg(driver.assignedVehicleId)}</span></span>
                ) : (
                  <span className="text-slate-400 dark:text-slate-500 italic truncate">No vehicle</span>
                )}
              </div>
            </div>
          </div>
        ))}

        {filteredDrivers.length === 0 && (
          <div className="col-span-2 py-8 text-center border border-dashed border-theme-main rounded-xl bg-theme-card">
            <UsersRound className="w-6 h-6 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
            <h3 className="text-xs font-bold text-theme-main">No Drivers Found</h3>
            <p className="text-[10px] text-slate-500 mt-1">Add drivers to track consumption.</p>
          </div>
        )}
      </div>

      {/* Form Modal */}
      {isModalOpen && (
        <div className="premium-modal-overlay">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h2 className="text-lg font-black font-sans text-slate-800">
                {editingId ? 'Edit Driver Details' : 'Register New Driver'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-rose-500 transition">
                <XCircle className="h-5 w-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">Corporate Account *</label>
                  <select 
                    value={accountId} 
                    onChange={e => {
                      setAccountId(e.target.value);
                      setAssignedVehicleId(''); // Reset vehicle selection when account changes
                    }} 
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
                  >
                    {accounts.map(acc => (
                      <option key={acc.id} value={acc.id}>{acc.companyName}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Driver Name *</label>
                  <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" placeholder="Full Name" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Driving License Number *</label>
                  <input type="text" value={licenseNumber} onChange={e => setLicenseNumber(e.target.value.toUpperCase())} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 font-mono uppercase" placeholder="License ID" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Phone Number</label>
                  <input type="text" value={phone} onChange={e => setPhone(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" placeholder="03xx-xxxxxxx" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Assign to Vehicle (Optional)</label>
                  <select value={assignedVehicleId} onChange={e => setAssignedVehicleId(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white">
                    <option value="">None (Floating Driver)</option>
                    {availableVehiclesForAccount.map(v => (
                      <option key={v.id} value={v.id}>{v.registrationNumber} ({v.make} {v.model})</option>
                    ))}
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">Status</label>
                  <select value={status} onChange={e => setStatus(e.target.value as any)} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white">
                    <option value="active">Active (Allowed to fuel)</option>
                    <option value="suspended">Suspended / Fired</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-2">
              <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm font-bold text-slate-600 hover:text-slate-900 transition">Cancel</button>
              <button onClick={handleSave} className="bg-orange-600 text-white px-6 py-3 sm:py-2 min-h-[48px] sm:min-h-[40px] rounded-lg text-sm font-bold hover:bg-orange-700 transition shadow-md shadow-orange-500/20">
                Save Driver
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
