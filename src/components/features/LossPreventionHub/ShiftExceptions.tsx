import React, { useState, useEffect } from 'react';
import { GlobalSettings, VarianceIncident, Shift } from '../../../types';
import { db } from '../../../data/db';
import { Search, DollarSign, AlertTriangle, Plus, XCircle } from 'lucide-react';

interface ShiftExceptionsProps {
  settings: GlobalSettings;
  stationId: string;
}

export default function ShiftExceptions({ settings, stationId }: ShiftExceptionsProps) {
  const [incidents, setIncidents] = useState<VarianceIncident[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Form state
  const [date, setDate] = useState('');
  const [sourceId, setSourceId] = useState(''); // Shift ID
  const [severity, setSeverity] = useState<'low' | 'medium' | 'high' | 'critical'>('low');
  const [expectedAmount, setExpectedAmount] = useState('');
  const [actualAmount, setActualAmount] = useState('');
  const [status, setStatus] = useState<'open' | 'investigating' | 'resolved'>('open');
  const [resolutionNotes, setResolutionNotes] = useState('');

  useEffect(() => {
     
     
     
    loadData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stationId]);

  function loadData() {
    const allIncidents = db.getVarianceIncidents(stationId);
    setIncidents(allIncidents.filter(i => i.type === 'cash_variance'));
    setShifts(db.getShifts(stationId));
  };

  const handleOpenModal = (incident?: VarianceIncident) => {
    if (incident) {
      setEditingId(incident.id);
      setDate(incident.date.split('T')[0]);
      setSeverity(incident.severity);
      setSourceId(incident.sourceId);
      setExpectedAmount(incident.expectedAmount.toString());
      setActualAmount(incident.actualAmount.toString());
      setStatus(incident.status);
      setResolutionNotes(incident.resolutionNotes || '');
    } else {
      setEditingId(null);
      setDate(new Date().toISOString().split('T')[0]);
      setSeverity('low');
      setSourceId('');
      setExpectedAmount('');
      setActualAmount('');
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
    const financialLoss = Math.abs(varianceAmount); // Any variance is a financial anomaly

    if (editingId) {
      updatedIncidents = currentIncidents.map(i => 
        i.id === editingId 
        ? { 
            ...i, 
            date, severity, sourceId, status, resolutionNotes,
            expectedAmount: expAmt,
            actualAmount: actAmt,
            varianceAmount,
            financialLoss,
            updatedAt: now
          } 
        : i
      );
    } else {
      const newIncident: VarianceIncident = {
        id: `var_${now}`,
        date,
        type: 'cash_variance',
        severity,
        sourceId,
        expectedAmount: expAmt,
        actualAmount: actAmt,
        varianceAmount,
        financialLoss,
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

  const getShiftDetails = (id: string) => {
    const s = shifts.find(shift => shift.id === id);
    return s ? `Shift ${new Date(s.startTime).toLocaleDateString()} (${s.type})` : `Shift ${id.substring(0,6)}...`;
  };

  const filteredIncidents = incidents.filter(i => 
    getShiftDetails(i.sourceId).toLowerCase().includes(searchQuery.toLowerCase()) ||
    i.severity.toLowerCase().includes(searchQuery.toLowerCase())
  ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="space-y-4">
      <div className="flex flex-row justify-between items-start items-center gap-4 bg-white p-4 rounded-xl border border-slate-200">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search by Shift or Severity..."
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
          Log Cash Exception
        </button>
      </div>

      <div className="premium-card border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="premium-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Shift Source</th>
                <th className="text-right">Expected Cash</th>
                <th className="text-right">Actual Handed Over</th>
                <th className="text-right">Variance</th>
                <th>Status</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredIncidents.map(inc => {
                const isShortage = inc.varianceAmount > 0;
                return (
                  <tr key={inc.id} className="hover:bg-slate-50/50 transition">
                    <td>
                      <div className="font-medium text-slate-900">{new Date(inc.date).toLocaleDateString()}</div>
                      <div className="text-[10px] uppercase font-bold text-slate-500 mt-1 flex items-center gap-1">
                        <AlertTriangle className={`h-3 w-3 ${inc.severity === 'critical' ? 'text-rose-500' : 'text-amber-500'}`} />
                        {inc.severity} Severity
                      </div>
                    </td>
                    <td>
                      <div className="font-medium text-slate-900">{getShiftDetails(inc.sourceId)}</div>
                    </td>
                    <td className="text-right font-mono text-slate-600">
                      {settings.currency} {inc.expectedAmount.toLocaleString()}
                    </td>
                    <td className="text-right font-mono">
                      {settings.currency} {inc.actualAmount.toLocaleString()}
                    </td>
                    <td className="text-right">
                      <span className={`font-mono font-bold ${isShortage ? 'text-rose-600' : 'text-emerald-600'}`}>
                        {isShortage ? '-' : '+'}{settings.currency} {Math.abs(inc.varianceAmount).toLocaleString()}
                      </span>
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
                        Audit
                      </button>
                    </td>
                  </tr>
                );
              })}
              {filteredIncidents.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-500 text-sm">
                    No cash exceptions or shift variances recorded.
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
              <h2 className="text-lg font-black font-sans text-slate-800 flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-rose-500" />
                {editingId ? 'Audit Cash Exception' : 'Log Cash Exception'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-rose-500 transition">
                <XCircle className="h-5 w-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Date *</label>
                  <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-500" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Shift Source *</label>
                  <select value={sourceId} onChange={e => setSourceId(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 bg-white">
                    <option value="">-- Select Shift --</option>
                    {shifts.map(shift => (
                      <option key={shift.id} value={shift.id}>{getShiftDetails(shift.id)}</option>
                    ))}
                  </select>
                </div>
                { }
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">Severity Level</label>
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  <select value={severity} onChange={e => setSeverity(e.target.value as any)} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 bg-white">
                    <option value="low">Low (Acceptable loose change error)</option>
                    <option value="medium">Medium</option>
                    <option value="high">High (Requires audit)</option>
                    <option value="critical">Critical (Suspected theft)</option>
                  </select>
                </div>

                <div className="border-t border-slate-100 pt-4 md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Expected Cash ({settings.currency}) *</label>
                    <input type="number" value={expectedAmount} onChange={e => setExpectedAmount(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Actual Cash Handed Over ({settings.currency}) *</label>
                    <input type="number" value={actualAmount} onChange={e => setActualAmount(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-500" />
                  </div>
                </div>

                <div className="md:col-span-2 border-t border-slate-100 pt-4">
                  <label className="block text-xs font-bold text-slate-700 mb-1">Investigation Status</label>
                  <div className="flex gap-2">
                    { }
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
                  <label className="block text-xs font-bold text-slate-700 mb-1">Audit Notes & Actions Taken</label>
                  <textarea value={resolutionNotes} onChange={e => setResolutionNotes(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-500" placeholder="E.g., Recovered shortage from pump attendant's salary." rows={3}></textarea>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-2">
              <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm font-bold text-slate-600 hover:text-slate-900 transition">Cancel</button>
              <button onClick={handleSave} className="bg-rose-600 text-white px-6 py-3 sm:py-2 min-h-[48px] sm:min-h-[40px] rounded-lg text-sm font-bold hover:bg-rose-700 transition shadow-md shadow-rose-500/20">
                Save Exception
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
