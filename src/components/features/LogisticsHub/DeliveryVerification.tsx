import React, { useState, useEffect } from 'react';
import { GlobalSettings, TankerDelivery, TankerSchedule, Tank, Staff } from '../../../types';
import { db } from '../../../data/db';
import { Search, Plus, XCircle, Scale } from 'lucide-react';
import { ResponsiveTable } from '../../shared/ResponsiveTable';

interface DeliveryVerificationProps {
  settings: GlobalSettings;
  stationId: string;
}

export default function DeliveryVerification({ settings, stationId }: DeliveryVerificationProps) {
  const [deliveries, setDeliveries] = useState<TankerDelivery[]>([]);
  const [schedules, setSchedules] = useState<TankerSchedule[]>([]);
  const [tanks, setTanks] = useState<Tank[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Form state
  const [scheduleId, setScheduleId] = useState('');
  const [tankId, setTankId] = useState('');
  const [actualDeliveryDate, setActualDeliveryDate] = useState('');
  const [invoiceQuantity, setInvoiceQuantity] = useState('');
  const [actualDipQuantity, setActualDipQuantity] = useState('');
  const [shortageAmount, setShortageAmount] = useState('');
  const [status, setStatus] = useState<'verified' | 'disputed'>('verified');
  const [decantedBy, setDecantedBy] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
     
     
     
    loadData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stationId]);

  function loadData() {
    setDeliveries(db.getTankerDeliveries(stationId));
    setSchedules(db.getTankerSchedules(stationId));
    setTanks(db.getTanks(stationId));
    setStaff(db.getStaffList(stationId));
  };

  const handleOpenModal = (delivery?: TankerDelivery) => {
    if (delivery) {
      setEditingId(delivery.id);
      setScheduleId(delivery.scheduleId);
      setTankId(delivery.tankId);
      setActualDeliveryDate(delivery.actualDeliveryDate);
      setInvoiceQuantity(delivery.invoiceQuantity.toString());
      setActualDipQuantity(delivery.actualDipQuantity.toString());
      setShortageAmount(delivery.shortageAmount.toString());
      setStatus(delivery.status);
      setDecantedBy(delivery.decantedBy);
      setNotes(delivery.notes || '');
    } else {
      setEditingId(null);
      setScheduleId('');
      setTankId('');
      setActualDeliveryDate(new Date().toISOString().split('T')[0]);
      setInvoiceQuantity('');
      setActualDipQuantity('');
      setShortageAmount('0');
      setStatus('verified');
      setDecantedBy(staff.length > 0 ? staff[0].id : '');
      setNotes('');
    }
    setIsModalOpen(true);
  };

  const handleSave = () => {
    if (!scheduleId || !tankId || !invoiceQuantity || !actualDipQuantity || !decantedBy) {
      alert("Please fill in all required fields.");
      return;
    }

    const currentDeliveries = db.getTankerDeliveries(stationId);
    let updatedDeliveries: TankerDelivery[];
    const now = Date.now();

    const invQty = parseFloat(invoiceQuantity);
    const dipQty = parseFloat(actualDipQuantity);
    const shortageQty = invQty - dipQty;

    if (editingId) {
      updatedDeliveries = currentDeliveries.map(d => 
        d.id === editingId 
        ? { 
            ...d, 
            scheduleId, tankId, actualDeliveryDate, status, decantedBy, notes,
            invoiceQuantity: invQty,
            actualDipQuantity: dipQty,
            shortageQuantity: shortageQty,
            shortageAmount: parseFloat(shortageAmount) || 0,
            updatedAt: now
          } 
        : d
      );
    } else {
      const newDelivery: TankerDelivery = {
        id: `del_${now}`,
        scheduleId,
        tankId,
        actualDeliveryDate,
        invoiceQuantity: invQty,
        actualDipQuantity: dipQty,
        shortageQuantity: shortageQty,
        shortageAmount: parseFloat(shortageAmount) || 0,
        status,
        decantedBy,
        notes,
        createdAt: now,
        updatedAt: now
      };
      updatedDeliveries = [...currentDeliveries, newDelivery];
    }

    db.saveTankerDeliveries(stationId, updatedDeliveries);
    
    // Automatically update the TankerSchedule to "delivered"
    const currentSchedules = db.getTankerSchedules(stationId);
    const updatedSchedules = currentSchedules.map(s => 
      s.id === scheduleId ? { ...s, status: 'delivered' as const, updatedAt: now } : s
    );
    db.saveTankerSchedules(stationId, updatedSchedules);

    loadData();
    setIsModalOpen(false);
  };

  const getScheduleRef = (id: string) => {
    const s = schedules.find(sch => sch.id === id);
    return s ? `PO: ${s.poNumber}` : 'Unknown Schedule';
  };

  const getTankName = (id: string) => {
    const t = tanks.find(tank => tank.id === id);
    return t ? t.name : 'Unknown Tank';
  };

  const getStaffName = (id: string) => {
    const s = staff.find(st => st.id === id);
    return s ? s.name : 'Unknown Staff';
  };

  const filteredDeliveries = deliveries.filter(d => 
    getScheduleRef(d.scheduleId).toLowerCase().includes(searchQuery.toLowerCase()) ||
    getTankName(d.tankId).toLowerCase().includes(searchQuery.toLowerCase())
  ).sort((a, b) => new Date(b.actualDeliveryDate).getTime() - new Date(a.actualDeliveryDate).getTime());

  // Derive shortages visually
  return (
    <div className="space-y-4">
      <div className="flex flex-row justify-between items-center gap-2 mb-2">
        <div className="relative w-full flex-1">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search PO or Tank..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-theme-card border border-theme-main rounded-lg text-xs focus:outline-none focus:border-rose-500"
          />
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="flex items-center gap-1.5 bg-slate-900 dark:bg-slate-800 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-slate-800 transition whitespace-nowrap"
        >
          <Plus className="h-3.5 w-3.5" />
          Log Delivery
        </button>
      </div>

      <div className="bg-theme-card rounded-xl border border-theme-main overflow-hidden shadow-sm">
        <ResponsiveTable
          data={filteredDeliveries}
          columns={[
            {
              header: 'Delivery & PO',
              accessor: (del) => (
                <div className="flex flex-col">
                  <span className="font-bold text-slate-800 dark:text-slate-200 text-[11px]">{new Date(del.actualDeliveryDate).toLocaleDateString()}</span>
                  <span className="text-[10px] text-slate-500">{getScheduleRef(del.scheduleId)}</span>
                </div>
              ),
              isPrimaryMobile: true
            },
            {
              header: 'Tank & Staff',
              accessor: (del) => (
                <div className="flex flex-col">
                  <span className="font-bold text-slate-800 dark:text-slate-200 text-[11px]">{getTankName(del.tankId)}</span>
                  <span className="text-[10px] text-slate-500">By {getStaffName(del.decantedBy)}</span>
                </div>
              )
            },
            {
              header: 'Invoice Qty',
              className: 'text-right',
              accessor: (del) => (
                <span className="font-mono text-[11px] text-slate-700 dark:text-slate-300">{del.invoiceQuantity.toLocaleString()} L</span>
              )
            },
            {
              header: 'Actual Dip Qty',
              className: 'text-right',
              accessor: (del) => (
                <span className="font-mono text-[11px] text-slate-700 dark:text-slate-300">{del.actualDipQuantity.toLocaleString()} L</span>
              )
            },
            {
              header: 'Shortage',
              className: 'text-right',
              accessor: (del) => (
                del.shortageQuantity > 0 ? (
                  <div className="flex flex-col items-end">
                    <span className="font-mono font-bold text-rose-500 text-[11px]">{del.shortageQuantity.toLocaleString()} L</span>
                    <span className="text-[10px] text-rose-400">Val: {settings.currency} {del.shortageAmount.toLocaleString()}</span>
                  </div>
                ) : (
                  <span className="text-emerald-500 font-mono text-[11px]">No Shortage</span>
                )
              )
            },
            {
              header: 'Status',
              accessor: (del) => (
                <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-full ${del.status === 'verified' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                  {del.status}
                </span>
              )
            },
            {
              header: 'Actions',
              className: 'text-right',
              accessor: (del) => (
                <button 
                  onClick={() => handleOpenModal(del)}
                  className="text-rose-600 hover:text-rose-800 dark:hover:text-rose-400 font-bold text-[10px] bg-rose-50 dark:bg-rose-500/10 px-2 py-1 rounded transition"
                >
                  Edit
                </button>
              )
            }
          ]}
          keyExtractor={(d) => d.id}
          emptyMessage="No verified deliveries recorded yet."
        />
      </div>

      {/* Form Modal */}
      {isModalOpen && (
        <div className="premium-modal-overlay">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h2 className="text-lg font-black font-sans text-slate-800">
                {editingId ? 'Edit Delivery Verification' : 'Log & Verify Tanker Delivery'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-rose-500 transition">
                <XCircle className="h-5 w-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="bg-rose-50 border border-rose-100 p-3 rounded-lg flex items-start gap-3">
                <Scale className="h-5 w-5 text-rose-500 mt-0.5" />
                <p className="text-xs text-rose-800 leading-relaxed">
                  <strong>Shortage Monitoring:</strong> Enter the quantity shown on the OMC invoice, and the actual difference seen on your underground tank's dipstick after decanting. The system will automatically calculate the shrinkage/shortage.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">Select Tanker Schedule (PO) *</label>
                  <select value={scheduleId} onChange={e => setScheduleId(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 bg-white">
                    <option value="">-- Select Schedule --</option>
                    {schedules.map(sch => (
                      <option key={sch.id} value={sch.id}>PO: {sch.poNumber} ({new Date(sch.expectedDeliveryDate).toLocaleDateString()})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Decanted Into Tank *</label>
                  <select value={tankId} onChange={e => setTankId(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 bg-white">
                    <option value="">-- Select Tank --</option>
                    {tanks.map(tank => (
                      <option key={tank.id} value={tank.id}>{tank.name} (Current: {tank.currentStock}L)</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Actual Delivery Date *</label>
                  <input type="date" value={actualDeliveryDate} onChange={e => setActualDeliveryDate(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-500" />
                </div>
                
                <div className="border-t border-slate-100 pt-4 md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Invoice Quantity (Liters) *</label>
                    <input type="number" value={invoiceQuantity} onChange={e => setInvoiceQuantity(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-500" placeholder="e.g. 20000" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Actual Dip Difference (Liters) *</label>
                    <input type="number" value={actualDipQuantity} onChange={e => setActualDipQuantity(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-500" placeholder="e.g. 19950" />
                  </div>
                </div>

                <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {parseFloat(invoiceQuantity) - parseFloat(actualDipQuantity) > 0 && (
                    <div className="col-span-1">
                      <label className="block text-xs font-bold text-rose-700 mb-1">Shortage Amount Value ({settings.currency})</label>
                      <input type="number" value={shortageAmount} onChange={e => setShortageAmount(e.target.value)} className="w-full px-3 py-2 border border-rose-200 bg-rose-50 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 text-rose-900" placeholder="Enter monetary value of loss" />
                    </div>
                  )}
                  <div className={parseFloat(invoiceQuantity) - parseFloat(actualDipQuantity) > 0 ? "col-span-1" : "col-span-2"}>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Decanted By (Staff) *</label>
                    <select value={decantedBy} onChange={e => setDecantedBy(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 bg-white">
                      <option value="">-- Select Staff --</option>
                      {staff.map(st => (
                        <option key={st.id} value={st.id}>{st.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                { }
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">Delivery Status</label>
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  <select value={status} onChange={e => setStatus(e.target.value as any)} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 bg-white">
                    <option value="verified">Verified & Accepted</option>
                    <option value="disputed">Disputed (High Shortage)</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">Investigation Notes</label>
                  <textarea value={notes} onChange={e => setNotes(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-500" placeholder="E.g., Shortage due to thermal expansion or seal broken." rows={2}></textarea>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-2">
              <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm font-bold text-slate-600 hover:text-slate-900 transition">Cancel</button>
              <button onClick={handleSave} className="bg-rose-600 text-white px-6 py-3 sm:py-2 min-h-[48px] sm:min-h-[40px] rounded-lg text-sm font-bold hover:bg-rose-700 transition shadow-md shadow-rose-500/20">
                Log Delivery
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
