import React, { useState, useEffect } from 'react';
import { GlobalSettings, VarianceIncident, Tank } from '../../../types';
import { db } from '../../../data/db';
import { Search, Droplets, ThermometerSun, ShieldAlert, Plus, XCircle } from 'lucide-react';

interface TankVarianceAnalysisProps {
  settings: GlobalSettings;
  stationId: string;
}

export default function TankVarianceAnalysis({ settings, stationId }: TankVarianceAnalysisProps) {
  const [incidents, setIncidents] = useState<VarianceIncident[]>([]);
  const [tanks, setTanks] = useState<Tank[]>([]);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Form state
  const [date, setDate] = useState('');
  const [type, setType] = useState<'tank_shrinkage' | 'thermal_expansion' | 'suspected_theft'>('tank_shrinkage');
  const [severity, setSeverity] = useState<'low' | 'medium' | 'high' | 'critical'>('low');
  const [sourceId, setSourceId] = useState(''); // Tank ID
  const [expectedAmount, setExpectedAmount] = useState('');
  const [actualAmount, setActualAmount] = useState('');
  const [financialLoss, setFinancialLoss] = useState('');
  const [status, setStatus] = useState<'open' | 'investigating' | 'resolved'>('open');
  const [resolutionNotes, setResolutionNotes] = useState('');

  useEffect(() => {
    loadData();
  }, [stationId]);

  const loadData = () => {
    // Only get tank-related variances
    const allIncidents = db.getVarianceIncidents(stationId);
    setIncidents(allIncidents.filter(i => ['tank_shrinkage', 'thermal_expansion', 'suspected_theft'].includes(i.type)));
    setTanks(db.getTanks(stationId));
  };

  const handleOpenModal = (incident?: VarianceIncident) => {
    if (incident) {
      setEditingId(incident.id);
      setDate(incident.date.split('T')[0]);
      setType(incident.type as any);
      setSeverity(incident.severity);
      setSourceId(incident.sourceId);
      setExpectedAmount(incident.expectedAmount.toString());
      setActualAmount(incident.actualAmount.toString());
      setFinancialLoss(incident.financialLoss.toString());
      setStatus(incident.status);
      setResolutionNotes(incident.resolutionNotes || '');
    } else {
      setEditingId(null);
      setDate(new Date().toISOString().split('T')[0]);
      setType('tank_shrinkage');
      setSeverity('low');
      setSourceId(tanks.length > 0 ? tanks[0].id : '');
      setExpectedAmount('');
      setActualAmount('');
      setFinancialLoss('0');
      setStatus('open');
      setResolutionNotes('');
    }
    setIsModalOpen(true);
  };

  const handleSave = () => {
    if (!sourceId || !expectedAmount || !actualAmount) {
      alert("Please fill in required fields.");
      return;
    }

    const currentIncidents = db.getVarianceIncidents(stationId);
    let updatedIncidents: VarianceIncident[];
    const now = Date.now();

    const expAmt = parseFloat(expectedAmount);
    const actAmt = parseFloat(actualAmount);
    const varianceAmount = expAmt - actAmt; // Positive means shortage

    if (editingId) {
      updatedIncidents = currentIncidents.map(i => 
        i.id === editingId 
        ? { 
            ...i, 
            date, type, severity, sourceId, status, resolutionNotes,
            expectedAmount: expAmt,
            actualAmount: actAmt,
            varianceAmount,
            financialLoss: parseFloat(financialLoss) || 0,
            updatedAt: now
          } 
        : i
      );
    } else {
      const newIncident: VarianceIncident = {
        id: `var_${now}`,
        date,
        type,
        severity,
        sourceId,
        expectedAmount: expAmt,
        actualAmount: actAmt,
        varianceAmount,
        financialLoss: parseFloat(financialLoss) || 0,
        status,
        resolutionNotes,
        createdAt: now,
        updatedAt: now
      };
      updatedIncidents = [...currentIncidents, newIncident];
    }

    db.saveVarianceIncidents(stationId, updatedIncidents);
    loadData();
    setIsModalOpen(false);
  };

  const getTankName = (id: string) => {
    const t = tanks.find(tank => tank.id === id);
    return t ? t.name : 'Unknown Tank';
  };

  const filteredIncidents = incidents.filter(i => 
    getTankName(i.sourceId).toLowerCase().includes(searchQuery.toLowerCase()) ||
    i.type.toLowerCase().replace('_', ' ').includes(searchQuery.toLowerCase())
  ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="space-y-4">
      <div className="flex flex-row justify-between items-start items-center gap-4 bg-white p-4 rounded-xl border border-slate-200">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search by Tank or Variance Type..."
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
          Log Tank Variance
        </button>
      </div>

      <div className="premium-card border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="premium-table">
            <thead>
              <tr>
                <th>Date & Type</th>
                <th>Tank Source</th>
                <th className="text-right">Expected Vol.</th>
                <th className="text-right">Actual Dip Vol.</th>
                <th className="text-right">Variance Loss</th>
                <th>Status</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredIncidents.map(inc => {
                return (
                  <tr key={inc.id} className="hover:bg-slate-50/50 transition">
                    <td>
                      <div className="font-medium text-slate-900 flex items-center gap-2">
                        {inc.type === 'suspected_theft' ? <ShieldAlert className="h-4 w-4 text-rose-500" /> : 
                         inc.type === 'thermal_expansion' ? <ThermometerSun className="h-4 w-4 text-amber-500" /> : 
                         <Droplets className="h-4 w-4 text-blue-500" />}
                        <span className="capitalize">{inc.type.replace('_', ' ')}</span>
                      </div>
                      <div className="text-xs text-slate-500">{new Date(inc.date).toLocaleDateString()}</div>
                    </td>
                    <td>
                      <div className="font-medium text-slate-900">{getTankName(inc.sourceId)}</div>
                    </td>
                    <td className="text-right font-mono text-slate-600">
                      {inc.expectedAmount.toLocaleString()} L
                    </td>
                    <td className="text-right font-mono">
                      {inc.actualAmount.toLocaleString()} L
                    </td>
                    <td className="text-right">
                      <div className="flex flex-col items-end">
                        <span className="font-mono font-bold text-rose-600">{inc.varianceAmount.toLocaleString()} L</span>
                        <span className="text-[10px] text-rose-500 font-mono">Val: {settings.currency} {inc.financialLoss.toLocaleString()}</span>
                      </div>
                    </td>
                    <td>
                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                        inc.status === 'resolved' ? 'bg-emerald-100 text-emerald-700' : 
                        inc.status === 'investigating' ? 'bg-amber-100 text-amber-700' : 
                        'bg-rose-100 text-rose-700'
                      }`}>
                        {inc.status}
                      </span>
                    </td>
                    <td className="text-right">
                      <button 
                        onClick={() => handleOpenModal(inc)}
                        className="text-rose-600 hover:text-rose-800 font-bold text-xs bg-rose-50 hover:bg-rose-100 px-3 py-1.5 rounded-lg transition"
                      >
                        Investigate
                      </button>
                    </td>
                  </tr>
                );
              })}
              {filteredIncidents.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-500 text-sm">
                    No tank variances recorded.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Form Modal */}
      {isModalOpen && (
        <div className="premium-modal-overlay">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h2 className="text-lg font-black font-sans text-slate-800">
                {editingId ? 'Investigate Tank Variance' : 'Log Tank Variance Incident'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-rose-500 transition">
                <XCircle className="h-5 w-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-1 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Date *</label>
                  <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-500" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Tank Source *</label>
                  <select value={sourceId} onChange={e => setSourceId(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 bg-white">
                    {tanks.map(tank => (
                      <option key={tank.id} value={tank.id}>{tank.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Variance Type</label>
                  <select value={type} onChange={e => setType(e.target.value as any)} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 bg-white">
                    <option value="tank_shrinkage">Normal Shrinkage (Evaporation)</option>
                    <option value="thermal_expansion">Thermal Expansion / Contraction</option>
                    <option value="suspected_theft">Suspected Theft / Leakage</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Severity Level</label>
                  <select value={severity} onChange={e => setSeverity(e.target.value as any)} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 bg-white">
                    <option value="low">Low (Acceptable limits)</option>
                    <option value="medium">Medium</option>
                    <option value="high">High (Requires investigation)</option>
                    <option value="critical">Critical (Immediate action required)</option>
                  </select>
                </div>

                <div className="border-t border-slate-100 pt-4 md:col-span-2 grid grid-cols-2 sm:grid-cols-1 lg:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Expected System Volume (Liters) *</label>
                    <input type="number" value={expectedAmount} onChange={e => setExpectedAmount(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Actual Dip Volume (Liters) *</label>
                    <input type="number" value={actualAmount} onChange={e => setActualAmount(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-500" />
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-rose-700 mb-1">Financial Loss Value ({settings.currency})</label>
                  <input type="number" value={financialLoss} onChange={e => setFinancialLoss(e.target.value)} className="w-full px-3 py-2 border border-rose-200 bg-rose-50 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 text-rose-900" placeholder="Monetary value of lost fuel" />
                </div>

                <div className="md:col-span-2 border-t border-slate-100 pt-4">
                  <label className="block text-xs font-bold text-slate-700 mb-1">Investigation Status</label>
                  <div className="flex gap-2">
                    {['open', 'investigating', 'resolved'].map((s) => (
                      <button
                        key={s}
                        onClick={() => setStatus(s as any)}
                        className={`flex-1 py-2 text-sm font-bold rounded-lg border transition ${
                          status === s 
                            ? (s === 'resolved' ? 'bg-emerald-100 border-emerald-500 text-emerald-800' : 
                               s === 'investigating' ? 'bg-amber-100 border-amber-500 text-amber-800' : 
                               'bg-rose-100 border-rose-500 text-rose-800')
                            : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                        }`}
                      >
                        <span className="capitalize">{s}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">Investigation & Resolution Notes</label>
                  <textarea value={resolutionNotes} onChange={e => setResolutionNotes(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-500" placeholder="E.g., Adjusted calibration settings. CCTV verified no theft." rows={3}></textarea>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-2">
              <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm font-bold text-slate-600 hover:text-slate-900 transition">Cancel</button>
              <button onClick={handleSave} className="bg-rose-600 text-white px-6 py-3 sm:py-2 min-h-[48px] sm:min-h-[40px] rounded-lg text-sm font-bold hover:bg-rose-700 transition shadow-md shadow-rose-500/20">
                Save Incident
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
