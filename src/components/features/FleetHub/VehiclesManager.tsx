import React, { useState, useEffect } from 'react';
import { GlobalSettings, FleetVehicle, FleetAccount } from '../../../types';
import { db } from '../../../data/db';
import { Plus, CarFront, Tag, Search, XCircle, AlertTriangle, Building2, BatteryWarning, ScanLine } from 'lucide-react';
import { FixedSizeList as List, ListChildComponentProps } from 'react-window';
import { useScanner } from '../../../contexts/ScannerContext';

interface VehiclesManagerProps {
  settings: GlobalSettings;
  stationId: string;
}

export default function VehiclesManager({ settings, stationId }: VehiclesManagerProps) {
  const { scanBarcode } = useScanner();
  const [vehicles, setVehicles] = useState<FleetVehicle[]>([]);
  const [accounts, setAccounts] = useState<FleetAccount[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterAccount, setFilterAccount] = useState<string>('all');

  // Form State
  const [accountId, setAccountId] = useState('');
  const [registrationNumber, setRegistrationNumber] = useState('');
  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [category, setCategory] = useState<'car' | 'truck' | 'bus' | 'van' | 'heavy_machinery'>('car');
  const [rfidTag, setRfidTag] = useState('');
  const [monthlyFuelLimit, setMonthlyFuelLimit] = useState('');
  const [status, setStatus] = useState<'active' | 'inactive' | 'maintenance'>('active');

  useEffect(() => {
    loadData();
  }, [stationId]);

  const loadData = () => {
    setVehicles(db.getFleetVehicles(stationId));
    setAccounts(db.getFleetAccounts(stationId));
  };

  const handleOpenModal = (vehicle?: FleetVehicle) => {
    if (vehicle) {
      setEditingId(vehicle.id);
      setAccountId(vehicle.accountId);
      setRegistrationNumber(vehicle.registrationNumber);
      setMake(vehicle.make);
      setModel(vehicle.model);
      setCategory(vehicle.category);
      setRfidTag(vehicle.rfidTag || '');
      setMonthlyFuelLimit(vehicle.monthlyFuelLimit.toString());
      setStatus(vehicle.status);
    } else {
      setEditingId(null);
      setAccountId(accounts.length > 0 ? accounts[0].id : '');
      setRegistrationNumber('');
      setMake('');
      setModel('');
      setCategory('car');
      setRfidTag('');
      setMonthlyFuelLimit('1000');
      setStatus('active');
    }
    setIsModalOpen(true);
  };

  const handleSave = () => {
    if (!accountId || !registrationNumber || !make || !model || !monthlyFuelLimit) {
      alert("Please fill in all required fields.");
      return;
    }

    const currentVehicles = db.getFleetVehicles(stationId);
    let updatedVehicles: FleetVehicle[];
    const now = Date.now();

    if (editingId) {
      updatedVehicles = currentVehicles.map(v => 
        v.id === editingId 
        ? { 
            ...v, 
            accountId, registrationNumber, make, model, category, rfidTag, status,
            monthlyFuelLimit: parseFloat(monthlyFuelLimit),
            updatedAt: now
          } 
        : v
      );
    } else {
      const newVehicle: FleetVehicle = {
        id: `veh_${now}`,
        accountId,
        registrationNumber,
        make,
        model,
        category,
        rfidTag,
        status,
        monthlyFuelLimit: parseFloat(monthlyFuelLimit),
        currentMonthConsumption: 0,
        createdAt: now,
        updatedAt: now
      };
      updatedVehicles = [...currentVehicles, newVehicle];
    }

    db.saveFleetVehicles(stationId, updatedVehicles);
    loadData();
    setIsModalOpen(false);
  };

  const getAccountName = (id: string) => {
    const acc = accounts.find(a => a.id === id);
    return acc ? acc.companyName : 'Unknown Account';
  };

  const filteredVehicles = vehicles.filter(v => 
    (filterAccount === 'all' || v.accountId === filterAccount) &&
    (v.registrationNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
     v.rfidTag?.toLowerCase().includes(searchQuery.toLowerCase()) ||
     v.make.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-row justify-between items-start items-center gap-4 bg-white p-4 rounded-xl border border-slate-200">
        <div className="flex flex-row gap-4 w-full sm:w-auto flex-1">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search by Reg No, RFID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
          <select 
            value={filterAccount} 
            onChange={(e) => setFilterAccount(e.target.value)}
            className="w-full sm:w-64 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
          >
            <option value="all">All Corporate Accounts</option>
            {accounts.map(acc => (
              <option key={acc.id} value={acc.id}>{acc.companyName}</option>
            ))}
          </select>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          disabled={accounts.length === 0}
          className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-slate-800 transition whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Plus className="h-4 w-4" />
          Add Vehicle
        </button>
      </div>

      {accounts.length === 0 && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-xl flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
          <div>
            <h4 className="font-bold text-sm">No Corporate Accounts Exist</h4>
            <p className="text-xs mt-1">You must create a corporate fleet account before you can add vehicles.</p>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <div className="min-w-[800px]">
            {/* Header */}
            <div className="flex items-center bg-slate-50 border-b border-slate-200 text-xs text-slate-500 uppercase tracking-wider font-bold">
              <div className="px-4 py-3 w-[25%]">Vehicle Details</div>
              <div className="px-4 py-3 w-[20%]">Corporate Account</div>
              <div className="px-4 py-3 w-[15%]">RFID Tag</div>
              <div className="px-4 py-3 w-[20%]">Monthly Limit / Used</div>
              <div className="px-4 py-3 w-[10%]">Status</div>
              <div className="px-4 py-3 w-[10%] text-right">Actions</div>
            </div>

            {/* Body */}
            <div className="divide-y divide-slate-100 text-sm">
              {filteredVehicles.length === 0 ? (
                <div className="px-4 py-8 text-center text-slate-500 text-sm">
                  No vehicles found matching your criteria.
                </div>
              ) : (
                <List
                  itemCount={filteredVehicles.length}
                  itemSize={72}
                  width="100%"
                  height={Math.min(filteredVehicles.length * 72, 450)}
                >
                  {({ index, style }: ListChildComponentProps) => {
                    const vehicle = filteredVehicles[index];
                    const consumptionPct = vehicle.monthlyFuelLimit > 0 
                      ? (vehicle.currentMonthConsumption / vehicle.monthlyFuelLimit) * 100 
                      : 0;

                    return (
                      <div style={style} className="flex items-center hover:bg-slate-50/50 transition border-b border-slate-100">
                        <div className="px-4 w-[25%]">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-slate-100 rounded-lg text-slate-600 shrink-0">
                              <CarFront className="h-5 w-5" />
                            </div>
                            <div className="truncate">
                              <div className="font-bold text-slate-900 font-mono text-base truncate">{vehicle.registrationNumber}</div>
                              <div className="text-xs text-slate-500 truncate">{vehicle.make} {vehicle.model} • {vehicle.category}</div>
                            </div>
                          </div>
                        </div>
                        <div className="px-4 w-[20%]">
                          <div className="flex items-center gap-2 truncate">
                            <Building2 className="h-4 w-4 text-slate-400 shrink-0" />
                            <span className="font-medium text-slate-700 truncate">{getAccountName(vehicle.accountId)}</span>
                          </div>
                        </div>
                        <div className="px-4 w-[15%] truncate">
                          {vehicle.rfidTag ? (
                            <div className="flex items-center gap-1.5 bg-indigo-50 text-indigo-700 px-2 py-1 rounded-md w-max border border-indigo-100 max-w-full">
                              <Tag className="h-3 w-3 shrink-0" />
                              <span className="font-mono text-xs font-bold truncate">{vehicle.rfidTag}</span>
                            </div>
                          ) : (
                            <span className="text-slate-400 text-xs italic">No tag assigned</span>
                          )}
                        </div>
                        <div className="px-4 w-[20%]">
                          <div className="flex flex-col gap-1 pr-4">
                            <div className="flex justify-between text-xs">
                              <span className="font-bold text-slate-700">{vehicle.currentMonthConsumption} L</span>
                              <span className="text-slate-500">/ {vehicle.monthlyFuelLimit} L</span>
                            </div>
                            <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden shrink-0">
                              <div 
                                className={`h-full rounded-full ${consumptionPct > 90 ? 'bg-rose-500' : consumptionPct > 75 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                                style={{ width: `${Math.min(100, consumptionPct)}%` }}
                              />
                            </div>
                          </div>
                        </div>
                        <div className="px-4 w-[10%]">
                          <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${vehicle.status === 'active' ? 'bg-emerald-100 text-emerald-700' : vehicle.status === 'maintenance' ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'}`}>
                            {vehicle.status}
                          </span>
                        </div>
                        <div className="px-4 w-[10%] text-right flex justify-end">
                          <button 
                            onClick={() => handleOpenModal(vehicle)}
                            className="text-orange-600 hover:text-orange-800 font-bold text-xs bg-orange-50 hover:bg-orange-100 px-3 py-1.5 rounded-lg transition"
                          >
                            Edit
                          </button>
                        </div>
                      </div>
                    );
                  }}
                </List>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Form Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h2 className="text-lg font-black font-sans text-slate-800">
                {editingId ? 'Edit Vehicle Details' : 'Register New Vehicle'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-rose-500 transition">
                <XCircle className="h-5 w-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">Corporate Account *</label>
                  <select value={accountId} onChange={e => setAccountId(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white">
                    {accounts.map(acc => (
                      <option key={acc.id} value={acc.id}>{acc.companyName}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Registration Number *</label>
                  <input type="text" value={registrationNumber} onChange={e => setRegistrationNumber(e.target.value.toUpperCase())} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 font-mono uppercase" placeholder="ABC-1234" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Vehicle Category</label>
                  <select value={category} onChange={e => setCategory(e.target.value as any)} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white">
                    <option value="car">Car (Sedan/Hatchback)</option>
                    <option value="van">Van / Hi-Roof</option>
                    <option value="bus">Bus / Coach</option>
                    <option value="truck">Truck / Dumper</option>
                    <option value="heavy_machinery">Heavy Machinery / Tractor</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Make *</label>
                  <input type="text" value={make} onChange={e => setMake(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" placeholder="e.g. Toyota, Hino" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Model *</label>
                  <input type="text" value={model} onChange={e => setModel(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" placeholder="e.g. Corolla, 300 Series" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">RFID Tag Number (Optional)</label>
                  <div className="relative flex gap-2">
                    <div className="relative flex-1">
                      <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-indigo-400" />
                      <input type="text" value={rfidTag} onChange={e => setRfidTag(e.target.value.toUpperCase())} className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono bg-indigo-50/30" placeholder="Scan or enter Tag ID" />
                    </div>
                    <button 
                      onClick={async () => {
                        const result = await scanBarcode({ title: "Scan Vehicle RFID / Barcode" });
                        if (result) setRfidTag(result);
                      }}
                      className="flex-shrink-0 bg-indigo-600 hover:bg-indigo-700 text-white p-2 rounded-lg transition"
                      title="Scan Barcode"
                    >
                      <ScanLine className="h-5 w-5" />
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Monthly Fuel Limit (Liters) *</label>
                  <input type="number" value={monthlyFuelLimit} onChange={e => setMonthlyFuelLimit(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" placeholder="1000" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">Status</label>
                  <select value={status} onChange={e => setStatus(e.target.value as any)} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white">
                    <option value="active">Active (Allowed to fuel)</option>
                    <option value="inactive">Inactive / Parked</option>
                    <option value="maintenance">Under Maintenance</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-2">
              <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm font-bold text-slate-600 hover:text-slate-900 transition">Cancel</button>
              <button onClick={handleSave} className="bg-orange-600 text-white px-6 py-2 rounded-lg text-sm font-bold hover:bg-orange-700 transition shadow-md shadow-orange-500/20">
                Save Vehicle
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
