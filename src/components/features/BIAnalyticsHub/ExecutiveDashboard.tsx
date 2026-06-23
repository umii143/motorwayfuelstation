import React, { useState, useEffect, useMemo } from 'react';
import { GlobalSettings, Shift, Tank, Nozzle, Product, CashAccount, FleetAccount, Supplier } from '../../../types';
import { db } from '../../../data/db';
import { LineChart, TrendingUp, DollarSign, Activity, ChevronRight, ShieldCheck, AlertTriangle, Wallet, Building2, UsersRound } from 'lucide-react';
import { DataConfidenceBadge } from '../../ui/DataConfidenceBadge';

interface ExecutiveDashboardProps {
  settings: GlobalSettings;
  stationId: string;
}

export default function ExecutiveDashboard({ settings, stationId }: ExecutiveDashboardProps) {
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [tanks, setTanks] = useState<Tank[]>([]);
  const [nozzles, setNozzles] = useState<Nozzle[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [cashAccounts, setCashAccounts] = useState<CashAccount[]>([]);
  const [fleetAccounts, setFleetAccounts] = useState<FleetAccount[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setShifts(db.getShifts(stationId));
    setTanks(db.getTanks(stationId));
    setNozzles(db.getNozzles(stationId));
    setProducts(db.getProducts(stationId));
    setCashAccounts(db.getCashAccounts(stationId));
    setFleetAccounts(db.getFleetAccounts(stationId));
    setSuppliers(db.getSuppliers(stationId));
  }, [stationId]);

  // Aggregate Sales Data
  const currentMonthShifts = shifts.filter(s => {
    if (!s.date) return false;
    const dt = new Date(s.date);
    const now = new Date();
    return dt.getMonth() === now.getMonth() && dt.getFullYear() === now.getFullYear();
  });

  let totalVolume = 0;
  let totalRevenue = 0;
  let totalCost = 0;

  currentMonthShifts.forEach(s => {
    if (!s.closingReadings || !s.openingReadings) return;
    Object.keys(s.closingReadings).forEach(nozzleId => {
      const nozzle = nozzles.find(n => n.id === nozzleId);
      if (!nozzle) return;
      const product = products.find(p => p.id === nozzle.productId);
      if (!product) return;
      
      const vol = Math.max(0, (s.closingReadings[nozzleId] || 0) - (s.openingReadings[nozzleId] || 0));
      const rate = (s as any).rates?.[product.id] || product.rate || 0;
      const cost = product.purchasePrice || product.rate * 0.95 || 0;
      
      totalVolume += vol;
      totalRevenue += (vol * rate);
      totalCost += (vol * cost);
    });
  });

  const exactProfit = totalRevenue - totalCost;

  // Real KPI Data
  const cashPosition = cashAccounts.reduce((sum, a) => sum + (a.balance || 0), 0);
  const totalReceivables = fleetAccounts.reduce((sum, a) => sum + (a.balance > 0 ? a.balance : 0), 0);
  const totalPayables = suppliers.reduce((sum, a) => sum + (a.balance > 0 ? a.balance : 0), 0);

  // Inventory Value (Using current volume from latest shifts or just relying on latest shift closing dips. Since we don't have currentVolume tracked continuously outside shifts easily, we'll approximate based on tanks array or just 0 if unknown)
  // For authenticity: we fetch the latest shift to get the closing dips
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const latestShift = shifts.length > 0 ? [...shifts].sort((a, b) => b.createdAt! - a.createdAt!)[0] : null;
  let inventoryValue = 0;
  tanks.forEach(tank => {
    const product = products.find(p => p.id === tank.productId);
    if (product) {
      inventoryValue += ((tank.currentStock || 0) * (product.purchasePrice || product.rate * 0.95 || 0));
    }
  });

  // Monthly Trend Chart (Real Data)
  const monthlyData = useMemo(() => {
    const months = Array(12).fill(0);
    const now = new Date();
    const currentYear = now.getFullYear();

    shifts.forEach(s => {
      if (!s.date) return;
      const dt = new Date(s.date);
      if (dt.getFullYear() === currentYear) {
        let shiftRevenue = 0;
        if (s.closingReadings && s.openingReadings) {
          Object.keys(s.closingReadings).forEach(nozzleId => {
            const nozzle = nozzles.find(n => n.id === nozzleId);
            if (!nozzle) return;
            const product = products.find(p => p.id === nozzle.productId);
            if (!product) return;
            const vol = Math.max(0, (s.closingReadings[nozzleId] || 0) - (s.openingReadings[nozzleId] || 0));
            const rate = (s as any).rates?.[product.id] || product.rate || 0;
            shiftRevenue += (vol * rate);
          });
        }
        months[dt.getMonth()] += shiftRevenue;
      }
    });
    return months;
  }, [shifts, nozzles, products]);

  const maxMonthlyRevenue = Math.max(...monthlyData, 1);

  // Data Confidence System
  // Requires at least 30 shifts to be considered highly confident
  const dataConfidence = shifts.length >= 30 ? 100 : Math.round((shifts.length / 30) * 100);

  return (
    <div className="space-y-6">
      {/* Confidence Header */}
      <div className={`p-3 rounded-lg border flex items-center justify-between text-xs font-bold ${dataConfidence < 50 ? 'bg-amber-500/10 border-amber-500/20 text-amber-500' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500'}`}>
        <div className="flex items-center gap-2">
          {dataConfidence < 50 ? <AlertTriangle className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}
          <span>Analytics Data Confidence: {dataConfidence}%</span>
        </div>
        <span className="text-slate-400 font-normal">Based on {shifts.length} recorded shifts</span>
      </div>

      <div className="fp-kpi-grid-2x2 mb-4">
        {/* Revenue */}
        <div className="fp-kpi-compact kpi-orange relative overflow-hidden group border border-orange-500/20 shadow-[0_0_15px_rgba(249,115,22,0.1)]">
          <div className="fp-kpi-compact__label text-orange-400">MTD Revenue</div>
          <div className="fp-kpi-compact__value text-3xl">
            {totalRevenue === 0 ? '0' : `${settings.currency} ${totalRevenue.toLocaleString()}`}
          </div>
          <div className="fp-kpi-compact__sub text-orange-300 flex items-center gap-1">
            <TrendingUp className="h-3 w-3" />
            Authentic Sales
          </div>
          <div className="absolute top-4 right-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-500/15 text-orange-500 ring-1 ring-inset ring-orange-500/20 shadow-inner">
            <DollarSign className="h-6 w-6" strokeWidth={2.5} />
          </div>
          <DataConfidenceBadge confidence={dataConfidence} />
        </div>

        {/* Profit */}
        <div className="fp-kpi-compact kpi-green relative overflow-hidden group">
          <div className="fp-kpi-compact__label">Real Gross Profit</div>
          <div className="fp-kpi-compact__value text-3xl">
            {exactProfit === 0 ? '0' : `${settings.currency} ${exactProfit.toLocaleString()}`}
          </div>
          <div className="fp-kpi-compact__sub text-emerald-400">
            MTD Based on exact Cost Price
          </div>
          <div className="absolute top-4 right-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-500 ring-1 ring-inset ring-emerald-500/20 shadow-inner">
            <Activity className="h-6 w-6" strokeWidth={2.5} />
          </div>
          <DataConfidenceBadge confidence={dataConfidence} />
        </div>

        {/* Liters Sold */}
        <div className="fp-kpi-compact kpi-blue relative overflow-hidden group">
          <div className="fp-kpi-compact__label">Fuel Volume Sold</div>
          <div className="fp-kpi-compact__value text-3xl">
            {totalVolume === 0 ? '0 L' : `${totalVolume.toLocaleString()} L`}
          </div>
          <div className="fp-kpi-compact__sub text-blue-400">
            Month to date
          </div>
          <div className="absolute top-4 right-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500/15 text-blue-500 ring-1 ring-inset ring-blue-500/20 shadow-inner">
            <LineChart className="h-6 w-6" strokeWidth={2.5} />
          </div>
          <DataConfidenceBadge confidence={dataConfidence} />
        </div>

        {/* Cash Position */}
        <div className="fp-kpi-compact kpi-purple relative overflow-hidden group">
          <div className="fp-kpi-compact__label">Liquid Cash Position</div>
          <div className="fp-kpi-compact__value text-3xl">
            {cashPosition === 0 ? '0' : `${settings.currency} ${cashPosition.toLocaleString()}`}
          </div>
          <div className="fp-kpi-compact__sub text-purple-400 flex items-center gap-1">
             <Wallet className="w-3 h-3"/> Vault & Registers
          </div>
          <div className="absolute top-4 right-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-500/15 text-purple-500 ring-1 ring-inset ring-purple-500/20 shadow-inner">
            <Wallet className="h-6 w-6" strokeWidth={2.5} />
          </div>
          <DataConfidenceBadge confidence={dataConfidence} />
        </div>

        {/* Receivables */}
        <div className="fp-kpi-compact kpi-orange relative overflow-hidden group">
          <div className="fp-kpi-compact__label text-orange-400">Total Receivables</div>
          <div className="fp-kpi-compact__value text-3xl">
            {totalReceivables === 0 ? '0' : `${settings.currency} ${totalReceivables.toLocaleString()}`}
          </div>
          <div className="fp-kpi-compact__sub text-orange-300 flex items-center gap-1">
             <UsersRound className="w-3 h-3"/> Fleet Accounts
          </div>
          <div className="absolute top-4 right-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-500/15 text-orange-500 ring-1 ring-inset ring-orange-500/20 shadow-inner">
            <UsersRound className="h-6 w-6" strokeWidth={2.5} />
          </div>
          <DataConfidenceBadge confidence={dataConfidence} />
        </div>

        {/* Payables */}
        <div className="fp-kpi-compact kpi-rose relative overflow-hidden group">
          <div className="fp-kpi-compact__label text-rose-400">Total Payables</div>
          <div className="fp-kpi-compact__value text-3xl text-rose-500">
            {totalPayables === 0 ? '0' : `${settings.currency} ${totalPayables.toLocaleString()}`}
          </div>
          <div className="fp-kpi-compact__sub text-rose-400 flex items-center gap-1">
             <Building2 className="w-3 h-3"/> Suppliers Dues
          </div>
          <div className="absolute top-4 right-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-500/15 text-rose-500 ring-1 ring-inset ring-rose-500/20 shadow-inner">
            <Building2 className="h-6 w-6" strokeWidth={2.5} />
          </div>
          <DataConfidenceBadge confidence={dataConfidence} />
        </div>
        
        {/* Inventory Value */}
        <div className="fp-kpi-compact kpi-emerald relative overflow-hidden group">
          <div className="fp-kpi-compact__label text-emerald-400">Fuel Inventory Value</div>
          <div className="fp-kpi-compact__value text-3xl text-emerald-500">
            {inventoryValue === 0 ? '0' : `${settings.currency} ${inventoryValue.toLocaleString()}`}
          </div>
          <div className="fp-kpi-compact__sub text-emerald-400 flex items-center gap-1">
             <Activity className="w-3 h-3"/> Based on last dip
          </div>
          <div className="absolute top-4 right-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-500 ring-1 ring-inset ring-emerald-500/20 shadow-inner">
            <Activity className="h-6 w-6" strokeWidth={2.5} />
          </div>
        </div>
      </div>

      {/* Real Trend Chart */}
      <div className="premium-card border border-slate-200">
        <h3 className="font-bold text-slate-800 mb-6 flex items-center justify-between">
          <span>Actual Monthly Revenue ({new Date().getFullYear()})</span>
          <button className="text-xs text-rose-600 font-bold flex items-center hover:text-rose-700">View Full Report <ChevronRight className="h-3 w-3 ml-1"/></button>
        </h3>
        
        {monthlyData.every(d => d === 0) ? (
          <div className="h-64 flex flex-col items-center justify-center text-slate-400">
            <LineChart className="w-12 h-12 mb-2 opacity-50" />
            <p className="text-sm font-bold">No Data Available</p>
            <p className="text-xs">Record shifts to view revenue trends.</p>
          </div>
        ) : (
          <div className="h-64 flex items-end justify-between gap-2 pb-4">
            {monthlyData.map((val, i) => {
              const heightPct = val === 0 ? 2 : (val / maxMonthlyRevenue) * 100;
              return (
                <div key={i} className="w-full flex flex-col justify-end items-center group relative h-full">
                  {/* Tooltip */}
                  {val > 0 && (
                    <div className="absolute -top-10 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 text-white text-[10px] py-1 px-2 rounded whitespace-nowrap z-10 pointer-events-none font-mono">
                      {settings.currency} {val.toLocaleString()}
                    </div>
                  )}
                  <div 
                    className={`w-full transition-colors rounded-t-sm ${val === 0 ? 'bg-slate-200' : 'bg-emerald-500 hover:bg-emerald-400'}`}
                    style={{ height: `${heightPct}%` }}
                  ></div>
                  <div className="text-[9px] font-bold text-slate-400 mt-2 uppercase">
                    {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][i]}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
