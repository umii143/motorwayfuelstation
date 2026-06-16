import React, { useState, useEffect } from 'react';
import { GlobalSettings, MaintenanceRecord, Asset } from '../../../types';
import { db } from '../../../data/db';
import { Search, CalendarCheck, Wrench, Plus, XCircle } from 'lucide-react';

interface ServiceSchedulesProps {
  settings: GlobalSettings;
  stationId: string;
}

export default function ServiceSchedules({ settings, stationId }: ServiceSchedulesProps) {
  const [records, setRecords] = useState<MaintenanceRecord[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Form state
  const [assetId, setAssetId] = useState('');
  const [type, setType] = useState<'preventive' | 'corrective'>('preventive');
  const [description, setDescription] = useState('');
  const [scheduledDate, setScheduledDate] = useState('');
  const [completedDate, setCompletedDate] = useState('');
  const [cost, setCost] = useState('');
  const [provider, setProvider] = useState('');
  const [status, setStatus] = useState<'scheduled' | 'in_progress' | 'completed' | 'cancelled'>('scheduled');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    loadData();
  }, [stationId]);

  const loadData = () => {
    setRecords(db.getMaintenanceRecords(stationId));
    setAssets(db.getAssets(stationId));
  };

  const handleOpenModal = (record?: MaintenanceRecord) => {
    if (record) {
      setEditingId(record.id);
      setAssetId(record.assetId);
      setType(record.type);
      setDescription(record.description);
      setScheduledDate(record.scheduledDate.split('T')[0]);
      setCompletedDate(record.completedDate ? record.completedDate.split('T')[0] : '');
      setCost(record.cost.toString());
      setProvider(record.provider);
      setStatus(record.status);
      setNotes(record.notes || '');
    } else {
      setEditingId(null);
      setAssetId(assets.length > 0 ? assets[0].id : '');
      setType('preventive');
      setDescription('');
      setScheduledDate(new Date().toISOString().split('T')[0]);
      setCompletedDate('');
      setCost('');
      setProvider('');
      setStatus('scheduled');
      setNotes('');
    }
    setIsModalOpen(true);
  };

  const handleSave = () => {
    if (!assetId || !description || !scheduledDate || !provider) {
      alert("Please fill in required fields (Asset, Description, Date, Provider).");
      return;
    }

    const currentRecords = db.getMaintenanceRecords(stationId);
    let updatedRecords: MaintenanceRecord[];
    const now = Date.now();

    if (editingId) {
      updatedRecords = currentRecords.map(r => 
        r.id === editingId 
        ? { 
            ...r, 
            assetId, type, description, scheduledDate, provider, status,
            completedDate: completedDate || undefined,
            cost: parseFloat(cost) || 0,
            notes: notes || undefined,
            updatedAt: now
          } 
        : r
      );
    } else {
      const newRecord: MaintenanceRecord = {
        id: `maint_${now}`,
        assetId,
        type,
        description,
        scheduledDate,
        completedDate: completedDate || undefined,
        cost: parseFloat(cost) || 0,
        provider,
        status,
        notes: notes || undefined,
        createdAt: now,
        updatedAt: now
      };
      updatedRecords = [...currentRecords, newRecord];
    }

    db.saveMaintenanceRecords(stationId, updatedRecords);
    
    // Automatically update the asset status if needed
    if (status === 'in_progress') {
      const currentAssets = db.getAssets(stationId);
      const updatedAssets = currentAssets.map(a => a.id === assetId ? { ...a, status: 'under_maintenance' as const } : a);
      db.saveAssets(stationId, updatedAssets);
    } else if (status === 'completed' && editingId) {
       // if we complete a record, revert the asset status
       const currentAssets = db.getAssets(stationId);
       const updatedAssets = currentAssets.map(a => a.id === assetId ? { ...a, status: 'active' as const } : a);
       db.saveAssets(stationId, updatedAssets);
    }

    loadData();
    setIsModalOpen(false);
  };

  const getAssetDetails = (id: string) => {
    const a = assets.find(asset => asset.id === id);
    return a ? `${a.name} (${a.type})` : 'Unknown Asset';
  };

  const filteredRecords = records.filter(r => 
    getAssetDetails(r.assetId).toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.description.toLowerCase().includes(searchQuery.toLowerCase())
  ).sort((a, b) => new Date(b.scheduledDate).getTime() - new Date(a.scheduledDate).getTime());

  return (
    <div className="space-y-4">
      <div className="flex flex-row justify-between items-start items-center gap-4 bg-white p-4 rounded-xl border border-slate-200">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search tasks or assets..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
          />
        </div>
        <button 
          onClick={() => handleOpenModal()}
          disabled={assets.length === 0}
          className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-slate-800 transition whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Plus className="h-4 w-4" />
          Schedule Service
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-1 lg:grid-cols-3 gap-4">
        {filteredRecords.map(record => (
          <div key={record.id} className="premium-card border border-slate-200 hover:shadow-md transition">
            <div className="flex justify-between items-start mb-3">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${record.status === 'completed' ? 'bg-emerald-50 text-emerald-600' : record.status === 'in_progress' ? 'bg-amber-50 text-amber-600' : record.status === 'scheduled' ? 'bg-blue-50 text-blue-600' : 'bg-slate-100 text-slate-600'}`}>
                  {record.type === 'preventive' ? <CalendarCheck className="h-5 w-5" /> : <Wrench className="h-5 w-5" />}
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 font-sans tracking-tight capitalize">{record.type} Service</h3>
                  <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${record.status === 'completed' ? 'bg-emerald-100 text-emerald-700' : record.status === 'in_progress' ? 'bg-amber-100 text-amber-700' : record.status === 'scheduled' ? 'bg-blue-100 text-blue-700' : 'bg-slate-200 text-slate-700'}`}>
                    {record.status.replace('_', ' ')}
                  </span>
                </div>
              </div>
              <button 
                onClick={() => handleOpenModal(record)}
                className="text-rose-600 hover:text-rose-800 font-bold text-xs bg-rose-50 hover:bg-rose-100 px-3 py-1.5 rounded-lg transition"
              >
                Edit
              </button>
            </div>
            
            <p className="text-sm font-medium text-slate-800 mb-3 line-clamp-2">{record.description}</p>

            <div className="space-y-2 text-sm text-slate-600 border-t border-slate-100 pt-3">
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Target Asset</span>
                <span className="font-bold text-slate-700 truncate ml-2">{getAssetDetails(record.assetId)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Scheduled For</span>
                <span className="font-medium text-slate-700">{new Date(record.scheduledDate).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Provider</span>
                <span className="font-medium text-slate-700">{record.provider}</span>
              </div>
              {record.cost > 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Estimated Cost</span>
                  <span className="font-mono text-xs font-bold bg-rose-50 text-rose-700 px-1.5 py-0.5 rounded">{settings.currency} {record.cost.toLocaleString()}</span>
                </div>
              )}
            </div>
          </div>
        ))}

        {filteredRecords.length === 0 && (
          <div className="col-span-full py-12 text-center border-2 border-dashed border-slate-200 rounded-xl bg-slate-50">
            <Wrench className="h-8 w-8 text-slate-300 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-slate-700">No Service Records Found</h3>
            <p className="text-xs text-slate-500 mt-1">Schedule preventive maintenance for your registered assets.</p>
          </div>
        )}
      </div>

      {/* Form Modal */}
      {isModalOpen && (
        <div className="premium-modal-overlay">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h2 className="text-lg font-black font-sans text-slate-800">
                {editingId ? 'Edit Service Record' : 'Schedule New Service'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-rose-500 transition">
                <XCircle className="h-5 w-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">Target Asset *</label>
                  <select value={assetId} onChange={e => setAssetId(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 bg-white">
                    {assets.map(a => (
                      <option key={a.id} value={a.id}>{a.name} ({a.type})</option>
                    ))}
                  </select>
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">Description / Issue *</label>
                  <input type="text" value={description} onChange={e => setDescription(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-500" placeholder="e.g. Replace dispenser hose" />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Service Type</label>
                  <select value={type} onChange={e => setType(e.target.value as any)} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 bg-white">
                    <option value="preventive">Preventive (Routine)</option>
                    <option value="corrective">Corrective (Repair)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Service Provider / Technician *</label>
                  <input type="text" value={provider} onChange={e => setProvider(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-500" placeholder="e.g. John (Internal) or ABC Tech" />
                </div>

                <div className="border-t border-slate-100 pt-4 md:col-span-2 grid grid-cols-2 sm:grid-cols-1 lg:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Scheduled Date *</label>
                    <input type="date" value={scheduledDate} onChange={e => setScheduledDate(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Estimated/Actual Cost ({settings.currency})</label>
                    <input type="number" value={cost} onChange={e => setCost(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-500" />
                  </div>
                </div>

                <div className="md:col-span-2 border-t border-slate-100 pt-4">
                  <label className="block text-xs font-bold text-slate-700 mb-1">Service Status</label>
                  <div className="flex gap-2">
                    {['scheduled', 'in_progress', 'completed', 'cancelled'].map((s) => (
                      <button
                        key={s}
                        onClick={() => setStatus(s as any)}
                        className={`flex-1 py-2 text-[11px] font-bold rounded-lg border transition ${
                          status === s 
                            ? (s === 'completed' ? 'bg-emerald-100 border-emerald-500 text-emerald-800' : 
                               s === 'in_progress' ? 'bg-amber-100 border-amber-500 text-amber-800' : 
                               s === 'scheduled' ? 'bg-blue-100 border-blue-500 text-blue-800' :
                               'bg-rose-100 border-rose-500 text-rose-800')
                            : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                        }`}
                      >
                        <span className="capitalize">{s.replace('_', ' ')}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {status === 'completed' && (
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 mb-1">Actual Completion Date</label>
                    <input type="date" value={completedDate} onChange={e => setCompletedDate(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-500" />
                  </div>
                )}

                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">Service Notes</label>
                  <textarea value={notes} onChange={e => setNotes(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-500" placeholder="E.g., Parts replaced: 1x filter." rows={2}></textarea>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-2">
              <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm font-bold text-slate-600 hover:text-slate-900 transition">Cancel</button>
              <button onClick={handleSave} className="bg-rose-600 text-white px-6 py-3 sm:py-2 min-h-[48px] sm:min-h-[40px] rounded-lg text-sm font-bold hover:bg-rose-700 transition shadow-md shadow-rose-500/20">
                Save Service
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
