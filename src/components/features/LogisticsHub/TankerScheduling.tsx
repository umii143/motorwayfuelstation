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
      <div className="flex flex-row justify-between items-start items-center gap-4 bg-white p-4 rounded-xl border border-slate-200">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search by PO Number or OMC..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
          />
        </div>
        <button 
          onClick={() => handleOpenModal()}
          disabled={suppliers.length === 0 || products.length === 0}
          className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-slate-800 transition whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Plus className="h-4 w-4" />
          Schedule Tanker
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredSchedules.map(schedule => (
          <div key={schedule.id} className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition">
            <div className="flex justify-between items-start mb-3">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${schedule.status === 'delivered' ? 'bg-emerald-50 text-emerald-600' : schedule.status === 'in_transit' ? 'bg-amber-50 text-amber-600' : schedule.status === 'cancelled' ? 'bg-rose-50 text-rose-600' : 'bg-slate-100 text-slate-600'}`}>
                  <Truck className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 font-sans tracking-tight">PO: {schedule.poNumber}</h3>
                  <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${schedule.status === 'delivered' ? 'bg-emerald-100 text-emerald-700' : schedule.status === 'in_transit' ? 'bg-amber-100 text-amber-700' : schedule.status === 'cancelled' ? 'bg-rose-100 text-rose-700' : 'bg-slate-200 text-slate-700'}`}>
                    {schedule.status.replace('_', ' ')}
                  </span>
                </div>
              </div>
              <button 
                onClick={() => handleOpenModal(schedule)}
                className="text-rose-600 hover:text-rose-800 font-bold text-xs bg-rose-50 hover:bg-rose-100 px-3 py-1.5 rounded-lg transition"
              >
                Edit
              </button>
            </div>
            
            <div className="space-y-2 mt-4 text-sm text-slate-600 border-t border-slate-100 pt-3">
              <div className="flex justify-between items-center">
                <span className="text-slate-400">OMC Supplier</span>
                <span className="font-bold text-slate-700">{getSupplierName(schedule.supplierId)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Product & Qty</span>
                <span className="font-bold text-slate-900">{getProductName(schedule.productId)} - {schedule.orderedQuantity.toLocaleString()} L</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Exp. Delivery</span>
                <span className="font-medium text-slate-700">
                  {schedule.expectedDeliveryDate && !isNaN(new Date(schedule.expectedDeliveryDate).getTime())
                    ? new Date(schedule.expectedDeliveryDate).toLocaleDateString()
                    : 'N/A'}
                </span>
              </div>
              {schedule.eta && (
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">ETA</span>
                  <span className="font-mono text-xs font-bold bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded">{schedule.eta}</span>
                </div>
              )}
            </div>
          </div>
        ))}

        {filteredSchedules.length === 0 && (
          <div className="col-span-full py-12 text-center border-2 border-dashed border-slate-200 rounded-xl bg-slate-50">
            <CalendarClock className="h-8 w-8 text-slate-300 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-slate-700">No Tanker Schedules Found</h3>
            <p className="text-xs text-slate-500 mt-1">Create purchase orders and schedule incoming tankers.</p>
          </div>
        )}
      </div>

      {/* Form Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
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
              <div className="grid grid-cols-2 md:grid-cols-2 gap-4">
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
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
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
              <button onClick={handleSave} className="bg-rose-600 text-white px-6 py-2 rounded-lg text-sm font-bold hover:bg-rose-700 transition shadow-md shadow-rose-500/20">
                Save Schedule
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
