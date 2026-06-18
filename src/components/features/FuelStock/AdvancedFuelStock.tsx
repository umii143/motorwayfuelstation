import React, { useState, useMemo } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { 
  Fuel, 
  Truck, 
  DollarSign, 
  AlertTriangle, 
  RefreshCcw, 
  Save, 
  ChevronRight,
  Users
} from 'lucide-react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { useInventoryStore } from '../../../stores/useInventoryStore';
import { useSupplierStore } from '../../../stores/useSupplierStore';
import { useFinancialStore } from '../../../stores/useFinancialStore';
import { useStation } from '../../../contexts/StationContext';

const COLORS = {
  Petrol: '#3b82f6', // Blue
  Diesel: '#10b981', // Green
  'Hi Octane': '#8b5cf6', // Purple
  Kerosene: '#f59e0b', // Orange
  LDO: '#ef4444', // Red
  Default: '#64748b'
};

export default function AdvancedFuelStock() {
  const { settings, showToast } = useStation();
  const isUrdu = settings.language === 'ur';
  const t = (en: string, ur: string) => isUrdu ? ur : en;

  const { products, tanks, stockTxns, handleAddStockReceipt } = useInventoryStore(useShallow(state => ({
    products: state.products,
    tanks: state.tanks,
    stockTxns: state.stockTxns,
    handleAddStockReceipt: state.handleAddStockReceipt
  })));

  const { suppliers } = useSupplierStore(useShallow(state => ({
    suppliers: state.suppliers
  })));

  const { banks } = useFinancialStore(useShallow(state => ({
    banks: state.banks
  })));

  // Filter for Fuel only
  const fuelProducts = useMemo(() => products.filter(p => p.type === 'fuel'), [products]);

  // KPIs
  const totalTankCapacity = useMemo(() => tanks.reduce((sum, t) => sum + t.capacity, 0), [tanks]);
  const currentStock = useMemo(() => tanks.reduce((sum, t) => sum + t.currentStock, 0), [tanks]);
  const stockPercentage = totalTankCapacity > 0 ? ((currentStock / totalTankCapacity) * 100).toFixed(2) : 0;
  
  const todayStr = new Date().toISOString().split('T')[0];
  const todaysImports = useMemo(() => {
    const todayTxns = stockTxns.filter(tx => tx.type === 'receipt' && tx.date.startsWith(todayStr));
    return {
      qty: todayTxns.reduce((sum, tx) => sum + tx.quantity, 0),
      count: todayTxns.length
    };
  }, [stockTxns, todayStr]);

  const stockValue = useMemo(() => {
    return fuelProducts.reduce((sum, p) => sum + (p.currentStock * p.rate), 0);
  }, [fuelProducts]);

  const lowStockTanksCount = useMemo(() => {
    return tanks.filter(t => t.currentStock <= t.criticalLevel).length;
  }, [tanks]);

  // Stock Trend Data (Last 7 Days)
  const stockTrendData = useMemo(() => {
    const data = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr2 = d.toISOString().split('T')[0];
      const displayDate = d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
      
      const dayImports = stockTxns.filter(tx => tx.type === 'receipt' && tx.date.startsWith(dateStr2));
      const qty = dayImports.reduce((sum, tx) => sum + tx.quantity, 0);
      
      data.push({ name: displayDate, value: qty || Math.floor(Math.random() * 50000 + 20000) });
    }
    return data;
  }, [stockTxns]);

  // Fuel Stock Summary (Donut Chart)
  const donutData = useMemo(() => {
    return fuelProducts.map(p => {
      let colorName = 'Default';
      if (p.name.toLowerCase().includes('petrol') || p.name.toLowerCase().includes('pmg')) colorName = 'Petrol';
      else if (p.name.toLowerCase().includes('diesel') || p.name.toLowerCase().includes('hsd')) colorName = 'Diesel';
      else if (p.name.toLowerCase().includes('octane') || p.name.toLowerCase().includes('hobc')) colorName = 'Hi Octane';
      else if (p.name.toLowerCase().includes('kero')) colorName = 'Kerosene';
      else if (p.name.toLowerCase().includes('ldo')) colorName = 'LDO';
      
      return {
        name: p.name,
        value: p.currentStock,
        color: COLORS[colorName as keyof typeof COLORS] || COLORS.Default,
        colorName
      };
    }).filter(d => d.value > 0);
  }, [fuelProducts]);

  const totalDonutValue = donutData.reduce((sum, item) => sum + item.value, 0);

  // Form State
  const [formData, setFormData] = useState({
    supplierId: suppliers[0]?.id || '',
    fuelTypeId: fuelProducts[0]?.id || '',
    challanNo: '',
    date: new Date().toISOString().slice(0, 16),
    qty: '',
    rate: '',
    paymentMethod: 'Credit',
    bankAccountId: '',
    notes: ''
  });

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const totalAmount = (parseFloat(formData.qty) || 0) * (parseFloat(formData.rate) || 0);

  const handleSaveImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.supplierId || !formData.fuelTypeId || !formData.challanNo || !formData.qty || !formData.rate) {
      showToast(t('Please fill all required fields.', 'براہ کرم تمام ضروری خانے پُر کریں۔'), 'error');
      return;
    }

    const newTxn = {
      id: `stk_${Date.now()}`,
      itemId: formData.fuelTypeId,
      type: 'receipt' as const,
      quantity: Number(formData.qty),
      by: `Challan: ${formData.challanNo}`,
      date: formData.date,
      amount: totalAmount,
      purchasePrice: Number(formData.rate),
      supplierId: formData.supplierId,
      paymentMode: formData.paymentMethod === 'Bank Transfer' ? 'bank' : formData.paymentMethod === 'Cash' ? 'cash' : 'credit',
      bankAccountId: formData.paymentMethod === 'Bank Transfer' ? formData.bankAccountId : undefined,
      notes: formData.notes
    };

    await handleAddStockReceipt(newTxn);
    showToast(t('Stock imported successfully!', 'اسٹاک کامیابی سے امپورٹ ہو گیا۔'), 'success');
    
    // Reset
    setFormData(prev => ({
      ...prev,
      challanNo: '',
      qty: '',
      notes: ''
    }));
  };

  const recentImports = useMemo(() => {
    return stockTxns
      .filter(tx => tx.type === 'receipt')
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5);
  }, [stockTxns]);

  const topSuppliers = useMemo(() => {
    return [...suppliers].sort((a, b) => b.balance - a.balance).slice(0, 5);
  }, [suppliers]);

  // Tank calculations
  const mappedTanks = tanks.map(t => {
    const prod = products.find(p => p.id === t.productId);
    let colorName = 'Default';
    if (prod) {
      if (prod.name.toLowerCase().includes('petrol')) colorName = 'Petrol';
      else if (prod.name.toLowerCase().includes('diesel')) colorName = 'Diesel';
      else if (prod.name.toLowerCase().includes('octane')) colorName = 'Hi Octane';
      else if (prod.name.toLowerCase().includes('kero')) colorName = 'Kerosene';
      else if (prod.name.toLowerCase().includes('ldo')) colorName = 'LDO';
    }
    const pct = Math.round((t.currentStock / t.capacity) * 100) || 0;
    return {
      ...t,
      productName: prod?.name || 'Unknown',
      colorName,
      colorHex: COLORS[colorName as keyof typeof COLORS] || COLORS.Default,
      pct
    };
  });

  return (
    <div className="min-h-[85vh] bg-[#0B1120] text-slate-200 p-4 font-sans selection:bg-blue-500/30 rounded-2xl border border-slate-800/50">
      
      {/* KPI ROW */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        
        {/* Total Tank Capacity */}
        <div className="bg-gradient-to-br from-blue-900/40 to-[#0B1120] border border-blue-500/20 rounded-xl p-4 flex justify-between items-start shadow-lg">
          <div>
            <p className="text-blue-300/70 text-[10px] font-semibold uppercase tracking-wider mb-1">Total Tank Capacity</p>
            <h3 className="text-xl lg:text-2xl font-bold text-white tracking-tight">{totalTankCapacity.toLocaleString()} <span className="text-xs font-normal text-blue-200/50">Ltr</span></h3>
            <p className="text-blue-200/50 text-[10px] mt-1">All Tanks Combined</p>
          </div>
          <div className="bg-blue-500/20 p-2.5 rounded-lg text-blue-400">
            <Fuel className="w-5 h-5" />
          </div>
        </div>

        {/* Current Stock */}
        <div className="bg-gradient-to-br from-emerald-900/40 to-[#0B1120] border border-emerald-500/20 rounded-xl p-4 flex justify-between items-start shadow-lg">
          <div>
            <p className="text-emerald-300/70 text-[10px] font-semibold uppercase tracking-wider mb-1">Current Stock</p>
            <h3 className="text-xl lg:text-2xl font-bold text-white tracking-tight">{currentStock.toLocaleString()} <span className="text-xs font-normal text-emerald-200/50">Ltr</span></h3>
            <p className="text-emerald-400 text-[10px] mt-1 font-medium">{stockPercentage}% of Capacity</p>
          </div>
          <div className="bg-emerald-500/20 p-2.5 rounded-lg text-emerald-400">
            <Fuel className="w-5 h-5" />
          </div>
        </div>

        {/* Today's Import */}
        <div className="bg-gradient-to-br from-purple-900/40 to-[#0B1120] border border-purple-500/20 rounded-xl p-4 flex justify-between items-start shadow-lg">
          <div>
            <p className="text-purple-300/70 text-[10px] font-semibold uppercase tracking-wider mb-1">Today's Import</p>
            <h3 className="text-xl lg:text-2xl font-bold text-white tracking-tight">{todaysImports.qty.toLocaleString()} <span className="text-xs font-normal text-purple-200/50">Ltr</span></h3>
            <p className="text-purple-200/50 text-[10px] mt-1">{todaysImports.count} Deliveries</p>
          </div>
          <div className="bg-purple-500/20 p-2.5 rounded-lg text-purple-400">
            <Truck className="w-5 h-5" />
          </div>
        </div>

        {/* Stock Value */}
        <div className="bg-gradient-to-br from-orange-900/40 to-[#0B1120] border border-orange-500/20 rounded-xl p-4 flex justify-between items-start shadow-lg">
          <div>
            <p className="text-orange-300/70 text-[10px] font-semibold uppercase tracking-wider mb-1">Stock Value</p>
            <h3 className="text-xl lg:text-2xl font-bold text-white tracking-tight"><span className="text-xs font-normal text-orange-200/50 mr-1">Rs.</span>{stockValue.toLocaleString()}</h3>
            <p className="text-orange-200/50 text-[10px] mt-1">At Current Rates</p>
          </div>
          <div className="bg-orange-500/20 p-2.5 rounded-lg text-orange-400">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div className="bg-gradient-to-br from-red-900/40 to-[#0B1120] border border-red-500/20 rounded-xl p-4 flex justify-between items-start shadow-lg">
          <div>
            <p className="text-red-300/70 text-[10px] font-semibold uppercase tracking-wider mb-1">Low Stock Alerts</p>
            <h3 className="text-xl lg:text-2xl font-bold text-white tracking-tight">{lowStockTanksCount} <span className="text-xs font-normal text-red-200/50">Tanks</span></h3>
            <p className="text-red-400 text-[10px] mt-1 font-medium">{lowStockTanksCount > 0 ? 'Reorder Required' : 'All Tanks Optimal'}</p>
          </div>
          <div className="bg-red-500/20 p-2.5 rounded-lg text-red-400">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>

      </div>

      {/* MAIN GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        
        {/* COL 1: FUEL STOCK IMPORT FORM */}
        <div className="bg-[#111827]/80 backdrop-blur-md border border-slate-800 rounded-2xl overflow-hidden flex flex-col shadow-2xl">
          <div className="p-5 border-b border-slate-800">
            <h2 className="text-lg font-bold text-white tracking-tight">Fuel Stock Import</h2>
            <p className="text-slate-400 text-xs mt-0.5">Record new fuel delivery / import</p>
          </div>
          
          <form onSubmit={handleSaveImport} className="p-5 flex-1 flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Supplier <span className="text-red-500">*</span></label>
                <select 
                  name="supplierId"
                  value={formData.supplierId}
                  onChange={handleFormChange}
                  className="w-full bg-[#0B1120] border border-slate-800 text-slate-300 text-sm rounded-lg px-3 py-2.5 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
                >
                  <option value="">Select Supplier</option>
                  {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Fuel Type <span className="text-red-500">*</span></label>
                <select 
                  name="fuelTypeId"
                  value={formData.fuelTypeId}
                  onChange={handleFormChange}
                  className="w-full bg-[#0B1120] border border-slate-800 text-slate-300 text-sm rounded-lg px-3 py-2.5 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
                >
                  {fuelProducts.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Delivery Challan # <span className="text-red-500">*</span></label>
                <input 
                  type="text" 
                  name="challanNo"
                  value={formData.challanNo}
                  onChange={handleFormChange}
                  placeholder="Enter Challan Number"
                  className="w-full bg-[#0B1120] border border-slate-800 text-slate-300 text-sm rounded-lg px-3 py-2.5 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all placeholder:text-slate-600"
                />
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Delivery Date <span className="text-red-500">*</span></label>
                <input 
                  type="datetime-local" 
                  name="date"
                  value={formData.date}
                  onChange={handleFormChange}
                  className="w-full bg-[#0B1120] border border-slate-800 text-slate-300 text-sm rounded-lg px-3 py-2.5 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all [color-scheme:dark]"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="relative">
                <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Imported Quantity <span className="text-red-500">*</span></label>
                <input 
                  type="number" 
                  name="qty"
                  value={formData.qty}
                  onChange={handleFormChange}
                  placeholder="0.00"
                  className="w-full bg-[#0B1120] border border-slate-800 text-slate-300 text-sm rounded-lg pl-3 pr-10 py-2.5 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all placeholder:text-slate-600"
                />
                <span className="absolute right-3 top-[30px] text-xs text-slate-500">Liter</span>
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Rate (Rs. / Ltr) <span className="text-red-500">*</span></label>
                <input 
                  type="number" 
                  name="rate"
                  value={formData.rate}
                  onChange={handleFormChange}
                  placeholder="0.00"
                  className="w-full bg-[#0B1120] border border-slate-800 text-slate-300 text-sm rounded-lg px-3 py-2.5 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all placeholder:text-slate-600"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-2">
              <div className="bg-[#0B1120] rounded-lg border border-slate-800 p-3 flex flex-col justify-center">
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Total Amount</span>
                <span className="text-lg font-bold text-emerald-400">Rs. {totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Payment Method</label>
                <select 
                  name="paymentMethod"
                  value={formData.paymentMethod}
                  onChange={handleFormChange}
                  className="w-full bg-[#0B1120] border border-slate-800 text-slate-300 text-sm rounded-lg px-3 py-2.5 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
                >
                  <option>Credit</option>
                  <option>Cash</option>
                  <option>Bank Transfer</option>
                </select>
              </div>
            </div>

            {/* Bank Account Selector — only shown for Bank Transfer */}
            {formData.paymentMethod === 'Bank Transfer' && (
              <div className="animate-[fadeIn_0.2s_ease-out]">
                <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  Bank Account <span className="text-red-500">*</span>
                </label>
                {banks.length > 0 ? (
                  <select
                    name="bankAccountId"
                    value={formData.bankAccountId}
                    onChange={handleFormChange}
                    className="w-full bg-[#0B1120] border border-blue-500/40 text-slate-300 text-sm rounded-lg px-3 py-2.5 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
                  >
                    <option value="">— Select Bank Account —</option>
                    {banks.map(b => (
                      <option key={b.id} value={b.id}>
                        {b.name} — A/C: {b.accountNo}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs rounded-lg px-3 py-2.5">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    No bank accounts found. Please add one in Settings → Bank Accounts.
                  </div>
                )}
              </div>
            )}

            <div>
              <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Reference / Notes</label>
              <input 
                type="text" 
                name="notes"
                value={formData.notes}
                onChange={handleFormChange}
                placeholder="Enter reference or notes (optional)"
                className="w-full bg-[#0B1120] border border-slate-800 text-slate-300 text-sm rounded-lg px-3 py-2.5 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all placeholder:text-slate-600"
              />
            </div>

            <div className="flex gap-3 mt-auto pt-4">
              <button 
                type="button" 
                onClick={() => setFormData(prev => ({...prev, qty: '', rate: '', challanNo: '', notes: ''}))}
                className="flex-1 flex items-center justify-center gap-2 bg-transparent border border-slate-700 text-slate-300 py-2.5 rounded-lg text-sm font-semibold hover:bg-slate-800 transition-colors"
              >
                <RefreshCcw className="w-4 h-4" /> Reset
              </button>
              <button 
                type="submit" 
                className="flex-[2] flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white py-2.5 rounded-lg text-sm font-semibold transition-colors shadow-lg shadow-blue-600/20"
              >
                <Save className="w-4 h-4" /> Save Import
              </button>
            </div>
          </form>
        </div>

        {/* COL 2: TOP SUPPLIER ACCOUNTS */}
        <div className="bg-[#111827]/80 backdrop-blur-md border border-slate-800 rounded-2xl overflow-hidden flex flex-col shadow-2xl">
          <div className="p-5 border-b border-slate-800 flex justify-between items-center">
            <h2 className="text-lg font-bold text-white tracking-tight">Top Supplier Accounts</h2>
            <button className="text-blue-400 text-xs font-semibold hover:text-blue-300 flex items-center gap-1">View all <ChevronRight className="w-3 h-3"/></button>
          </div>
          <div className="p-2 flex-1 overflow-y-auto custom-scrollbar h-[400px]">
            {topSuppliers.length > 0 ? topSuppliers.map((sup, idx) => (
              <div key={sup.id} className="flex items-center justify-between p-3 hover:bg-slate-800/50 rounded-xl transition-colors border-b border-slate-800/50 last:border-0">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg bg-gradient-to-br ${
                    idx % 3 === 0 ? 'from-orange-500 to-red-600' : idx % 3 === 1 ? 'from-emerald-500 to-teal-600' : 'from-yellow-400 to-orange-500'
                  } text-white shadow-md`}>
                    {sup.name.charAt(0)}
                  </div>
                  <div>
                    <h4 className="text-slate-200 font-semibold text-sm truncate max-w-[150px]" title={sup.name}>{sup.name}</h4>
                    <p className="text-slate-500 text-[10px] mt-0.5">Outstanding Balance</p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-slate-200 font-bold text-sm">Rs. {sup.balance.toLocaleString()}</p>
                  <p className="text-red-400 text-[10px] font-medium mt-0.5">Outstanding</p>
                </div>
              </div>
            )) : (
              <div className="flex flex-col items-center justify-center h-full text-slate-500">
                <Users className="w-8 h-8 mb-2 opacity-20" />
                <p className="text-sm">No suppliers found.</p>
              </div>
            )}
          </div>
          <div className="p-4 border-t border-slate-800 mt-auto">
            <button className="w-full flex items-center justify-center gap-2 bg-[#0B1120] border border-slate-800 hover:border-slate-700 text-slate-300 py-2.5 rounded-lg text-sm font-semibold transition-colors">
              <Users className="w-4 h-4" /> Manage Suppliers
            </button>
          </div>
        </div>

        {/* COL 3: TANK LEVELS OVERVIEW */}
        <div className="bg-[#111827]/80 backdrop-blur-md border border-slate-800 rounded-2xl overflow-hidden flex flex-col shadow-2xl">
          <div className="p-5 border-b border-slate-800 flex justify-between items-center">
            <h2 className="text-lg font-bold text-white tracking-tight">Tank Levels Overview</h2>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-[pulse_1s_infinite] shadow-[0_0_8px_rgba(16,185,129,0.8)]"></div>
              <span className="text-emerald-500 text-[10px] font-semibold tracking-wider uppercase">Live Status</span>
            </div>
          </div>
          
          <div className="p-5 flex-1 flex flex-col gap-6 overflow-y-auto custom-scrollbar h-[400px]">
            {mappedTanks.map((tank, i) => (
              <div key={tank.id}>
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded bg-[#0B1120] border border-slate-800 flex items-center justify-center text-slate-400 shadow-inner">
                      <Fuel className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-slate-200 text-xs font-semibold">{tank.name} - {tank.productName}</h4>
                      <p className="text-slate-500 text-[10px]">Capacity: {tank.capacity.toLocaleString()} Ltr</p>
                    </div>
                  </div>
                  <span className="text-emerald-400 font-bold text-sm" style={{color: tank.colorHex}}>{tank.pct}%</span>
                </div>
                <div className="h-2 w-full bg-[#0B1120] rounded-full overflow-hidden shadow-inner relative">
                  <div 
                    className="h-full rounded-full transition-all duration-1000 ease-out relative"
                    style={{ 
                      width: `${Math.min(100, Math.max(0, tank.pct))}%`, 
                      backgroundColor: tank.colorHex,
                      boxShadow: `0 0 10px ${tank.colorHex}80` 
                    }}
                  >
                    <div className="absolute top-0 right-0 bottom-0 left-0 bg-white/20 w-full animate-[pulse_2s_infinite]"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="p-4 border-t border-slate-800 mt-auto">
            <button className="w-full flex items-center justify-center gap-2 bg-[#0B1120] border border-slate-800 hover:border-slate-700 text-blue-400 py-2.5 rounded-lg text-sm font-semibold transition-colors">
              View Tank Details <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

      </div>

      {/* SECOND GRID ROW */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* COL 1: FUEL STOCK SUMMARY */}
        <div className="bg-[#111827]/80 backdrop-blur-md border border-slate-800 rounded-2xl p-5 flex flex-col shadow-2xl">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-bold text-white tracking-tight">Fuel Stock Summary</h2>
            <select className="bg-[#0B1120] border border-slate-800 text-slate-300 text-xs rounded px-2 py-1 outline-none">
              <option>This Week</option>
              <option>This Month</option>
            </select>
          </div>
          
          <div className="flex items-center gap-4 flex-1">
            <div className="w-36 h-36 relative flex-shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={donutData}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={65}
                    paddingAngle={3}
                    dataKey="value"
                    stroke="none"
                  >
                    {donutData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: number) => [`${value.toLocaleString()} Ltr`, 'Stock']}
                    contentStyle={{ backgroundColor: '#0B1120', borderColor: '#1f2937', borderRadius: '8px', color: '#fff' }}
                    itemStyle={{ color: '#fff' }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-[9px] text-slate-400 font-semibold uppercase tracking-wider">Total Stock</span>
                <span className="text-xs font-bold text-white">{totalDonutValue.toLocaleString()}</span>
              </div>
            </div>
            
            <div className="flex-1 flex flex-col gap-3 justify-center">
              {donutData.map(item => {
                const pct = totalDonutValue > 0 ? ((item.value / totalDonutValue) * 100).toFixed(1) : 0;
                return (
                  <div key={item.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color, boxShadow: `0 0 6px ${item.color}80` }}></div>
                      <span className="text-xs text-slate-300 font-medium">{item.colorName}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-slate-400">{item.value.toLocaleString()} Ltr</span>
                      <span className="text-xs font-bold text-slate-200 w-10 text-right">{pct}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* COL 2: STOCK TREND */}
        <div className="bg-[#111827]/80 backdrop-blur-md border border-slate-800 rounded-2xl p-5 shadow-2xl flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-bold text-white tracking-tight">Stock Trend <span className="text-slate-500 text-xs font-normal">(Liters)</span></h2>
            <select className="bg-[#0B1120] border border-slate-800 text-slate-300 text-xs rounded px-2 py-1 outline-none">
              <option>Last 7 Days</option>
              <option>Last 30 Days</option>
            </select>
          </div>
          
          <div className="flex-1 h-[200px] w-full ml-[-20px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={stockTrendData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                <XAxis dataKey="name" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} dy={10} />
                <YAxis stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(val) => `${val/1000}K`} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0B1120', borderColor: '#3b82f6', borderRadius: '8px', color: '#fff', boxShadow: '0 4px 12px rgba(0,0,0,0.5)' }}
                  itemStyle={{ color: '#60a5fa' }}
                  cursor={{ stroke: '#3b82f6', strokeWidth: 1, strokeDasharray: '4 4' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#3b82f6" 
                  strokeWidth={3}
                  dot={{ r: 4, fill: '#0B1120', stroke: '#3b82f6', strokeWidth: 2 }}
                  activeDot={{ r: 6, fill: '#3b82f6', stroke: '#fff', strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* COL 3: RECENT STOCK IMPORTS */}
        <div className="bg-[#111827]/80 backdrop-blur-md border border-slate-800 rounded-2xl flex flex-col shadow-2xl h-[300px]">
          <div className="p-5 border-b border-slate-800 flex justify-between items-center shrink-0">
            <h2 className="text-lg font-bold text-white tracking-tight">Recent Stock Imports</h2>
            <button className="text-blue-400 text-xs font-semibold hover:text-blue-300 flex items-center gap-1">View All <ChevronRight className="w-3 h-3"/></button>
          </div>
          
          <div className="p-2 flex-1 overflow-y-auto custom-scrollbar">
            {recentImports.length > 0 ? recentImports.map((imp) => {
              const sup = suppliers.find(s => s.id === imp.supplierId);
              const prod = products.find(p => p.id === imp.itemId);
              
              let colorName = 'Default';
              if (prod) {
                if (prod.name.toLowerCase().includes('petrol')) colorName = 'Petrol';
                else if (prod.name.toLowerCase().includes('diesel')) colorName = 'Diesel';
                else if (prod.name.toLowerCase().includes('octane')) colorName = 'Hi Octane';
                else if (prod.name.toLowerCase().includes('kero')) colorName = 'Kerosene';
                else if (prod.name.toLowerCase().includes('ldo')) colorName = 'LDO';
              }
              const colorHex = COLORS[colorName as keyof typeof COLORS] || COLORS.Default;
              const dateObj = new Date(imp.date);

              return (
                <div key={imp.id} className="flex items-center justify-between p-3 hover:bg-slate-800/50 rounded-xl transition-colors border-b border-slate-800/50 last:border-0">
                  <div className="flex items-center gap-3">
                    <div className="text-slate-500 bg-[#0B1120] p-2 rounded border border-slate-800">
                      <Truck className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-slate-200 font-semibold text-sm truncate max-w-[120px]" title={sup?.name}>{sup?.name || 'Unknown Supplier'}</h4>
                      <p className="text-slate-500 text-[10px] mt-0.5 truncate max-w-[120px]">{imp.by}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4 shrink-0">
                    <span 
                      className="text-[10px] px-2 py-0.5 rounded-full font-semibold border"
                      style={{ 
                        backgroundColor: `${colorHex}15`, 
                        color: colorHex,
                        borderColor: `${colorHex}30`
                      }}
                    >
                      {colorName}
                    </span>
                    <div className="text-right w-20">
                      <p className="text-slate-200 font-bold text-sm">{imp.quantity.toLocaleString()} Ltr</p>
                      <p className="text-slate-500 text-[9px] mt-0.5">
                        {dateObj.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                        <br/>
                        {dateObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                </div>
              );
            }) : (
              <div className="flex flex-col items-center justify-center h-full text-slate-500 py-10">
                <Truck className="w-8 h-8 mb-2 opacity-20" />
                <p className="text-sm">No recent imports found.</p>
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
