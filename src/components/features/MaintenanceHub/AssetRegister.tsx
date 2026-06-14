import React, { useState, useEffect } from 'react';
import { GlobalSettings, Asset } from '../../../types';
import { db } from '../../../data/db';
import { Search, ServerCog, Plus, XCircle, AlertTriangle } from 'lucide-react';

interface AssetRegisterProps {
  settings: GlobalSettings;
  stationId: string;
}

export default function AssetRegister({ settings, stationId }: AssetRegisterProps) {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Form state
  const [name, setName] = useState('');
  const [type, setType] = useState<'pump' | 'nozzle' | 'generator' | 'compressor' | 'other'>('pump');
  const [serialNumber, setSerialNumber] = useState('');
  const [installationDate, setInstallationDate] = useState('');
  const [warrantyExpiryDate, setWarrantyExpiryDate] = useState('');
  const [status, setStatus] = useState<'active' | 'under_maintenance' | 'retired'>('active');

  useEffect(() => {
    loadData();
  }, [stationId]);

  const loadData = () => {
    setAssets(db.getAssets(stationId));
  };

  const handleOpenModal = (asset?: Asset) => {
    if (asset) {
      setEditingId(asset.id);
      setName(asset.name);
      setType(asset.type);
      setSerialNumber(asset.serialNumber || '');
      setInstallationDate(asset.installationDate.split('T')[0]);
      setWarrantyExpiryDate(asset.warrantyExpiryDate ? asset.warrantyExpiryDate.split('T')[0] : '');
      setStatus(asset.status);
    } else {
      setEditingId(null);
      setName('');
      setType('pump');
      setSerialNumber('');
      setInstallationDate(new Date().toISOString().split('T')[0]);
      setWarrantyExpiryDate('');
      setStatus('active');
    }
    setIsModalOpen(true);
  };

  const handleSave = () => {
    if (!name || !installationDate) {
      alert("Please provide the Asset Name and Installation Date.");
      return;
    }

    const currentAssets = db.getAssets(stationId);
    let updatedAssets: Asset[];
    const now = Date.now();

    if (editingId) {
      updatedAssets = currentAssets.map(a => 
        a.id === editingId 
        ? { 
            ...a, 
            name, type, status,
            serialNumber: serialNumber || undefined,
            installationDate,
            warrantyExpiryDate: warrantyExpiryDate || undefined,
            updatedAt: now
          } 
        : a
      );
    } else {
      const newAsset: Asset = {
        id: `ast_${now}`,
        name,
        type,
        serialNumber: serialNumber || undefined,
        installationDate,
        warrantyExpiryDate: warrantyExpiryDate || undefined,
        status,
        createdAt: now,
        updatedAt: now
      };
      updatedAssets = [...currentAssets, newAsset];
    }

    db.saveAssets(stationId, updatedAssets);
    loadData();
    setIsModalOpen(false);
  };

  const isWarrantyExpired = (expiryDate?: string) => {
    if (!expiryDate) return false;
    return new Date(expiryDate).getTime() < Date.now();
  };

  const isWarrantyExpiringSoon = (expiryDate?: string) => {
    if (!expiryDate) return false;
    const daysLeft = (new Date(expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
    return daysLeft > 0 && daysLeft <= 30; // Expiring within 30 days
  };

  const filteredAssets = assets.filter(a => 
    a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (a.serialNumber && a.serialNumber.toLowerCase().includes(searchQuery.toLowerCase()))
  ).sort((a, b) => new Date(b.installationDate).getTime() - new Date(a.installationDate).getTime());

  return (
    <div className="space-y-4">
      <div className="flex flex-row justify-between items-start items-center gap-4 bg-white p-4 rounded-xl border border-slate-200">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search by Asset Name or Serial..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
          />
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-slate-800 transition whitespace-nowrap"
        >
          <Plus className="h-4 w-4" />
          Register Asset
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs text-slate-500 uppercase tracking-wider font-bold">
                <th className="px-4 py-3">Asset Details</th>
                <th className="px-4 py-3">Serial No.</th>
                <th className="px-4 py-3">Installation Date</th>
                <th className="px-4 py-3">Warranty Status</th>
                <th className="px-4 py-3">Current Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {filteredAssets.map(asset => {
                const expired = isWarrantyExpired(asset.warrantyExpiryDate);
                const expiringSoon = isWarrantyExpiringSoon(asset.warrantyExpiryDate);

                return (
                  <tr key={asset.id} className="hover:bg-slate-50/50 transition">
                    <td className="px-4 py-3">
                      <div className="font-bold text-slate-900">{asset.name}</div>
                      <div className="text-[10px] uppercase font-bold text-slate-500">{asset.type}</div>
                    </td>
                    <td className="px-4 py-3 font-mono text-slate-600 text-xs">
                      {asset.serialNumber || 'N/A'}
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      {new Date(asset.installationDate).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      {!asset.warrantyExpiryDate ? (
                        <span className="text-slate-400 italic text-xs">No Warranty</span>
                      ) : expired ? (
                        <div className="flex items-center gap-1 text-rose-600 text-xs font-bold">
                          <AlertTriangle className="h-3 w-3" />
                          Expired
                        </div>
                      ) : expiringSoon ? (
                        <div className="flex items-center gap-1 text-amber-600 text-xs font-bold">
                          <AlertTriangle className="h-3 w-3" />
                          Expiring Soon ({new Date(asset.warrantyExpiryDate).toLocaleDateString()})
                        </div>
                      ) : (
                        <span className="text-emerald-600 text-xs font-bold">Active ({new Date(asset.warrantyExpiryDate).toLocaleDateString()})</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                        asset.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 
                        asset.status === 'under_maintenance' ? 'bg-amber-100 text-amber-700' : 
                        'bg-slate-200 text-slate-700'
                      }`}>
                        {asset.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button 
                        onClick={() => handleOpenModal(asset)}
                        className="text-rose-600 hover:text-rose-800 font-bold text-xs bg-rose-50 hover:bg-rose-100 px-3 py-1.5 rounded-lg transition"
                      >
                        Manage
                      </button>
                    </td>
                  </tr>
                );
              })}
              {filteredAssets.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-500 text-sm">
                    No hardware assets registered.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Form Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h2 className="text-lg font-black font-sans text-slate-800 flex items-center gap-2">
                <ServerCog className="h-5 w-5 text-rose-500" />
                {editingId ? 'Edit Asset Details' : 'Register New Asset'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-rose-500 transition">
                <XCircle className="h-5 w-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">Asset Name *</label>
                  <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-500" placeholder="e.g. Dispenser Pump #1" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Asset Type</label>
                  <select value={type} onChange={e => setType(e.target.value as any)} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 bg-white">
                    <option value="pump">Dispenser / Pump</option>
                    <option value="nozzle">Nozzle / Hose</option>
                    <option value="generator">Generator</option>
                    <option value="compressor">Air Compressor</option>
                    <option value="other">Other Asset</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Serial Number</label>
                  <input type="text" value={serialNumber} onChange={e => setSerialNumber(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 font-mono" placeholder="XYZ-987654321" />
                </div>

                <div className="border-t border-slate-100 pt-4 md:col-span-2 grid grid-cols-1 sm:grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Installation Date *</label>
                    <input type="date" value={installationDate} onChange={e => setInstallationDate(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Warranty Expiry Date</label>
                    <input type="date" value={warrantyExpiryDate} onChange={e => setWarrantyExpiryDate(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-500" />
                  </div>
                </div>

                <div className="md:col-span-2 border-t border-slate-100 pt-4">
                  <label className="block text-xs font-bold text-slate-700 mb-1">Operational Status</label>
                  <div className="flex gap-2">
                    {['active', 'under_maintenance', 'retired'].map((s) => (
                      <button
                        key={s}
                        onClick={() => setStatus(s as any)}
                        className={`flex-1 py-2 text-sm font-bold rounded-lg border transition ${
                          status === s 
                            ? (s === 'active' ? 'bg-emerald-100 border-emerald-500 text-emerald-800' : 
                               s === 'under_maintenance' ? 'bg-amber-100 border-amber-500 text-amber-800' : 
                               'bg-slate-200 border-slate-500 text-slate-800')
                            : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                        }`}
                      >
                        <span className="capitalize">{s.replace('_', ' ')}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-2">
              <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm font-bold text-slate-600 hover:text-slate-900 transition">Cancel</button>
              <button onClick={handleSave} className="bg-rose-600 text-white px-6 py-3 sm:py-2 min-h-[48px] sm:min-h-[40px] rounded-lg text-sm font-bold hover:bg-rose-700 transition shadow-md shadow-rose-500/20">
                Save Asset
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
