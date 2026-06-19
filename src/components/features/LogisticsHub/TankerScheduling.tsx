import React, { useState, useEffect } from 'react';
import { GlobalSettings, TankerSchedule, Supplier, Product } from '../../../types';
import { db } from '../../../data/db';
import { Plus, CalendarClock, Search, XCircle, Truck, Phone, Hash } from 'lucide-react';

interface TankerSchedulingProps {
  settings: GlobalSettings;
  stationId: string;
}

export default function TankerScheduling({ settings, stationId }: TankerSchedulingProps) {
  const [schedules, setSchedules] = useState<TankerSchedule[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Form state
  const [supplierId, setSupplierId] = useState('');
  const [poNumber, setPoNumber] = useState('');
  const [productId, setProductId] = useState('');
  const [orderedQuantity, setOrderedQuantity] = useState('');
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState('');
  const [eta, setEta] = useState('');
  const [driverName, setDriverName] = useState('');
  const [driverPhone, setDriverPhone] = useState('');
  const [vehicleRegNo, setVehicleRegNo] = useState('');
  const [status, setStatus] = useState<'pending' | 'in_transit' | 'delivered' | 'cancelled'>('pending');

  useEffect(() => {
    loadData();
  }, [stationId]);

  const loadData = () => {
    setSchedules(db.getTankerSchedules(stationId));
    setSuppliers(db.getSuppliers(stationId));
    setProducts(db.getProducts(stationId).filter(p => p.type === 'fuel'));
  };

  const handleOpenModal = (schedule?: TankerSchedule) => {
    if (schedule) {
      setEditingId(schedule.id);
      setSupplierId(schedule.supplierId);
      setPoNumber(schedule.poNumber);
      setProductId(schedule.productId);
      setOrderedQuantity(schedule.orderedQuantity.toString());
      setExpectedDeliveryDate(schedule.expectedDeliveryDate.split('T')[0]); // Just the date part if it has time
      setEta(schedule.eta || '');
      setDriverName(schedule.driverName || '');
      setDriverPhone(schedule.driverPhone || '');
      setVehicleRegNo(schedule.vehicleRegNo || '');
      setStatus(schedule.status);
    } else {
      setEditingId(null);
      setSupplierId(suppliers.length > 0 ? suppliers[0].id : '');
      setPoNumber(`PO-${Math.floor(1000 + Math.random() * 9000)}`);
      setProductId(products.length > 0 ? products[0].id : '');
      setOrderedQuantity('');
      setExpectedDeliveryDate(new Date().toISOString().split('T')[0]);
      setEta('');
      setDriverName('');
      setDriverPhone('');
      setVehicleRegNo('');
      setStatus('pending');
    }
    setIsModalOpen(true);
  };

  const handleSave = () => {
    if (!supplierId || !poNumber || !productId || !orderedQuantity || !expectedDeliveryDate) {
      alert("Please fill in all required fields.");
      return;
    }

    const currentSchedules = db.getTankerSchedules(stationId);
    let updatedSchedules: TankerSchedule[];
    const now = Date.now();

    if (editingId) {
      updatedSchedules = currentSchedules.map(s => 
        s.id === editingId 
        ? { 
            ...s, 
            supplierId, poNumber, productId, status,
            orderedQuantity: parseFloat(orderedQuantity),
            expectedDeliveryDate,
            eta: eta || undefined,
            driverName: driverName || undefined,
            driverPhone: driverPhone || undefined,
            vehicleRegNo: vehicleRegNo || undefined,
            updatedAt: now
          } 
        : s
      );
    } else {
      const newSchedule: TankerSchedule = {
        id: `sch_${now}`,
        supplierId,
        poNumber,
        productId,
        orderedQuantity: parseFloat(orderedQuantity),
        expectedDeliveryDate,
        eta: eta || undefined,
        driverName: driverName || undefined,
        driverPhone: driverPhone || undefined,
        vehicleRegNo: vehicleRegNo || undefined,
        status,
        createdAt: now,
        updatedAt: now
      };
      updatedSchedules = [...currentSchedules, newSchedule];
    }

    db.saveTankerSchedules(stationId, updatedSchedules);
    loadData();
    setIsModalOpen(false);
  };

  const getSupplierName = (id: string) => {
    const s = suppliers.find(sup => sup.id === id);
    return s ? s.name : 'Unknown OMC';
  };

  const getProductName = (id: string) => {
    const p = products.find(prod => prod.id === id);
    return p ? p.name : 'Unknown Product';
  };

  const filteredSchedules = schedules.filter(s => 
    s.poNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
    getSupplierName(s.supplierId).toLowerCase().includes(searchQuery.toLowerCase())
  ).sort((a, b) => {
    const timeA = a.expectedDeliveryDate ? new Date(a.expectedDeliveryDate).getTime() : 0;
    const timeB = b.expectedDeliveryDate ? new Date(b.expectedDeliveryDate).getTime() : 0;
    return timeB - timeA;
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-row justify-between items-center gap-2 mb-2">
        <div className="relative w-full flex-1">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search PO Number or OMC..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-theme-card border border-theme-main rounded-lg text-xs focus:outline-none focus:border-rose-500"
          />
        </div>
        <button 
          onClick={() => handleOpenModal()}
          disabled={suppliers.length === 0 || products.length === 0}
          className="flex items-center gap-1.5 bg-slate-900 dark:bg-slate-800 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-slate-800 transition whitespace-nowrap disabled:opacity-50"
        >
          <Plus className="h-3.5 w-3.5" />
          Schedule
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {filteredSchedules.map(schedule => (
          <div key={schedule.id} className="kpi-card p-2">
            <div className="flex justify-between items-start mb-2">
              <div className="flex items-center gap-2 truncate">
                <div className={`w-6 h-6 rounded flex items-center justify-center shrink-0 ${schedule.status === 'delivered' ? 'bg-emerald-500/10 text-emerald-600' : schedule.status === 'in_transit' ? 'bg-amber-500/10 text-amber-600' : schedule.status === 'cancelled' ? 'bg-rose-500/10 text-rose-600' : 'bg-slate-500/10 text-slate-600'}`}>
                  <Truck className="h-3.5 w-3.5" />
                </div>
                <div className="truncate">
                  <h3 className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate leading-tight">PO: {schedule.poNumber}</h3>
                  <span className={`text-[9px] font-bold uppercase ${schedule.status === 'delivered' ? 'text-emerald-500' : schedule.status === 'in_transit' ? 'text-amber-500' : schedule.status === 'cancelled' ? 'text-rose-500' : 'text-slate-500'}`}>
                    {schedule.status.replace('_', ' ')}
                  </span>
                </div>
              </div>
              <button 
                onClick={() => handleOpenModal(schedule)}
                className="text-rose-600 hover:text-rose-800 dark:hover:text-rose-400 font-bold text-[10px] bg-rose-50 dark:bg-rose-500/10 px-2 py-1 rounded transition"
              >
                Edit
              </button>
            </div>
            
            <div className="space-y-1.5 mt-2 text-[10px] text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800/50 pt-2">
              <div className="flex justify-between items-center truncate">
                <span className="text-slate-400">OMC</span>
                <span className="font-medium text-slate-700 dark:text-slate-300 truncate ml-2">{getSupplierName(schedule.supplierId)}</span>
              </div>
              <div className="flex justify-between items-center truncate">
                <span className="text-slate-400">Product</span>
                <span className="font-bold text-slate-900 dark:text-slate-100">{getProductName(schedule.productId)} - {schedule.orderedQuantity}L</span>
              </div>
              <div className="flex justify-between items-center truncate">
                <span className="text-slate-400">Exp. Date</span>
                <span className="font-medium text-slate-700 dark:text-slate-300">
                  {schedule.expectedDeliveryDate && !isNaN(new Date(schedule.expectedDeliveryDate).getTime())
                    ? new Date(schedule.expectedDeliveryDate).toLocaleDateString()
                    : 'N/A'}
                </span>
              </div>
              {schedule.eta && (
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">ETA</span>
                  <span className="font-mono text-[9px] font-bold bg-amber-500/10 text-amber-600 px-1 py-0.5 rounded">{schedule.eta}</span>
                </div>
              )}
            </div>
          </div>
        ))}

        {filteredSchedules.length === 0 && (
          <div className="col-span-2 py-8 text-center border border-dashed border-theme-main rounded-xl bg-theme-card">
            <CalendarClock className="w-6 h-6 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
            <h3 className="text-xs font-bold text-theme-main">No Schedules Found</h3>
            <p className="text-[10px] text-slate-500 mt-1">Create purchase orders.</p>
          </div>
        )}
      </div>

      {/* Form Modal */}
      {isModalOpen && (
        <div className="premium-modal-overlay">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h2 className="text-lg font-black font-sans text-slate-800">
                {editingId ? 'Edit Tanker Schedule' : 'Schedule Tanker Delivery'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-rose-500 transition">
                <XCircle className="h-5 w-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">OMC / Supplier *</label>
                  <select value={supplierId} onChange={e => setSupplierId(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 bg-white">
                    {suppliers.map(sup => (
                      <option key={sup.id} value={sup.id}>{sup.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Purchase Order (PO) No. *</label>
                  <input type="text" value={poNumber} onChange={e => setPoNumber(e.target.value.toUpperCase())} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 font-mono" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Fuel Product *</label>
                  <select value={productId} onChange={e => setProductId(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 bg-white">
                    {products.map(prod => (
                      <option key={prod.id} value={prod.id}>{prod.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Ordered Quantity (Liters) *</label>
                  <input type="number" value={orderedQuantity} onChange={e => setOrderedQuantity(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-500" placeholder="e.g. 20000" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Expected Delivery Date *</label>
                  <input type="date" value={expectedDeliveryDate} onChange={e => setExpectedDeliveryDate(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-500" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">ETA (Optional)</label>
                  <input type="time" value={eta} onChange={e => setEta(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-500" />
                </div>
                
                <div className="md:col-span-2 pt-4 border-t border-slate-100">
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Logistics Details (Optional)</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Tanker Reg No.</label>
                      <input type="text" value={vehicleRegNo} onChange={e => setVehicleRegNo(e.target.value.toUpperCase())} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 font-mono uppercase" placeholder="TTR-123" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Driver Name</label>
                      <input type="text" value={driverName} onChange={e => setDriverName(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-500" placeholder="John Doe" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Driver Phone</label>
                      <input type="text" value={driverPhone} onChange={e => setDriverPhone(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-500" placeholder="03xx-xxxxxxx" />
                    </div>
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">Status</label>
                  <select value={status} onChange={e => setStatus(e.target.value as any)} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 bg-white">
                    <option value="pending">Pending (PO Sent)</option>
                    <option value="in_transit">In Transit</option>
                    <option value="delivered">Delivered</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-2">
              <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm font-bold text-slate-600 hover:text-slate-900 transition">Cancel</button>
              <button onClick={handleSave} className="bg-rose-600 text-white px-6 py-3 sm:py-2 min-h-[48px] sm:min-h-[40px] rounded-lg text-sm font-bold hover:bg-rose-700 transition shadow-md shadow-rose-500/20">
                Save Schedule
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
