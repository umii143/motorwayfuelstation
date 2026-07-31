import React, { useState, useMemo } from 'react';
import { 
  Fuel, Power, Sparkles, Droplets, TrendingUp, Search, 
  ChevronRight, RefreshCw, ChevronDown, CheckCircle2, ShieldCheck, UserCheck, Briefcase, Crown,
  TrendingDown, Wrench, X, History, PlusCircle
} from 'lucide-react';
import { 
  GlobalSettings, Shift, Product, Customer, Supplier, BankAccount, Nozzle, Tank, StockTransaction 
} from '../../types';
import { formatCurrency } from '../../lib/currency';
import { LiveClock } from '../ui/LiveClock';

interface MobileFuelDashboardProps {
  settings: GlobalSettings;
  activeStationId: string;
  shifts: Shift[];
  products: Product[];
  customers: Customer[];
  suppliers: Supplier[];
  banks: BankAccount[];
  nozzles: Nozzle[];
  tanks: Tank[];
  stockTxns: StockTransaction[];
  onNavigate: (view: string) => void;
  onStartShiftQuick?: () => void;
  userName: string;
}

export type MobileRoleMode = 'owner' | 'cashier' | 'manager' | 'technician';

export const MobileFuelDashboard: React.FC<MobileFuelDashboardProps> = ({
  settings,
  shifts,
  products,
  customers,
  suppliers,
  banks,
  nozzles,
  tanks,
  stockTxns,
  onNavigate,
  onStartShiftQuick,
  userName
}) => {
  const [roleMode, setRoleMode] = useState<MobileRoleMode>('owner');
  const [showDetailsSheet, setShowDetailsSheet] = useState(false);
  const [showAISheet, setShowAISheet] = useState(false);
  const todayStr = new Date().toISOString().split('T')[0];

  const activeShift = shifts.find(s => s.status === 'active');
  const activeStationName = settings.stationName || 'PSO Fuel Station';

  // --- COMPACT REALTIME DATA CALCULATIONS ---
  const stats = useMemo(() => {
    const todayShifts = shifts.filter(s => s.date === todayStr);
    let todayRevenue = 0;
    let todayLiters = 0;
    let todayProfit = 0;
    let totalTxns = 0;
    
    todayShifts.forEach((shift: any) => {
      todayRevenue += shift.totalSales || 0;
      totalTxns += (shift.nozzleReadings?.length || 0) + (shift.salesEntries?.length || 0);
      shift.nozzleReadings?.forEach((nr: any) => {
        const product = products.find(p => p.id === nr.productId);
        const saleVolume = nr.closingReading > 0 ? Math.max(0, nr.closingReading - nr.openingReading) : 0;
        todayLiters += saleVolume;
        if (product) {
          const cost = product.purchasePrice || product.rate || 0;
          todayProfit += saleVolume * ((nr.rate || product.rate || 0) - cost);
        }
      });
    });

    const totalCash = banks.reduce((sum, b) => sum + (b.balance || 0), 0);
    const totalReceivables = customers.reduce((sum, c) => c.balance > 0 ? sum + c.balance : sum, 0);
    const totalPayables = suppliers.reduce((sum, s) => s.balance > 0 ? sum + s.balance : sum, 0); 
    const netPosition = totalCash + totalReceivables - totalPayables;

    let lowStockCount = 0;
    let totalTankCapacity = 0;
    let totalCurrentStock = 0;
    
    tanks.forEach(t => {
      totalTankCapacity += t.capacity || 0;
      totalCurrentStock += t.currentStock || 0;
      const pct = t.capacity > 0 ? (t.currentStock / t.capacity) * 100 : 0;
      if (pct < 15) lowStockCount++;
    });
    
    const tankHealthPct = totalTankCapacity > 0 ? (totalCurrentStock / totalTankCapacity) * 100 : 100;
    const onlineNozzles = (nozzles as any[]).filter(n => n.status === 'Active' || !n.status).length;
    const maintenanceNozzles = (nozzles as any[]).filter(n => n.status === 'Maintenance').length;
    const stationHealthScore = Math.round(tankHealthPct) || 92;

    const shiftOperator = (activeShift as any)?.cashierName || userName || 'Cashier';
    const openingCash = (activeShift as any)?.openingCash || 0;
    const expectedCash = (activeShift as any)?.totalSales || 0;
    const variance = (activeShift as any)?.difference || 0;

    // Rich Tanks mapped dynamically
    const richTanks = tanks.length > 0 ? tanks.map((tank, idx) => {
      const matchingProduct = products.find(p => p.name?.toLowerCase() === tank.productName?.toLowerCase() || p.id === tank.productId) || products[idx % Math.max(1, products.length)];
      const productName = matchingProduct?.name || tank.productName || 'Fuel Product';
      const capacity = tank.capacity || 20000;
      const currentStock = Math.max(0, tank.currentStock || 0);
      const tankPct = capacity > 0 ? Math.min(100, Math.max(0, Math.round((currentStock / capacity) * 100))) : 0;
      return {
        id: tank.id,
        name: tank.name || `${productName.split(' ')[0]} Tank ${idx + 1}`,
        productName,
        capacity,
        currentStock,
        tankPct,
        rate: matchingProduct?.rate || 0,
        badgeClass: tankPct < 30 ? 'bg-red-500/10 text-red-600 border-red-500/20' : tankPct < 70 ? 'bg-amber-500/10 text-amber-600 border-amber-500/20' : 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
      };
    }) : products.filter(p => p.type === 'fuel' || !p.type).map((p, idx) => ({
      id: p.id,
      name: `${p.name} Tank ${idx + 1}`,
      productName: p.name,
      capacity: p.capacity || 20000,
      currentStock: Math.max(0, p.currentStock || 0),
      tankPct: (p.capacity && p.capacity > 0) ? Math.min(100, Math.max(0, Math.round(((p.currentStock || 0) / p.capacity) * 100))) : 0,
      rate: p.rate || 0,
      badgeClass: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
    }));

    return {
      todayRevenue, todayProfit, todayLiters, totalTxns,
      totalCash, totalReceivables, totalPayables, netPosition,
      stationHealthScore, shiftOperator, openingCash, expectedCash, variance,
      richTanks, onlineNozzles, maintenanceNozzles, lowStockCount
    };
  }, [shifts, products, customers, suppliers, banks, tanks, nozzles, todayStr, userName, activeShift]);

  return (
    <div className="min-h-screen bg-background text-foreground pb-20 px-3 pt-3 space-y-3">
      
      {/* 1. ULTRA-COMPACT MOBILE HEADER */}
      <header className="bg-card border border-border rounded-2xl p-3 shadow-xs flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-orange-500 flex items-center justify-center text-white font-black shrink-0 shadow-xs">
            <Fuel className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 truncate">
              <h1 className="text-sm font-black text-foreground truncate">{activeStationName}</h1>
              <span className="text-[9px] font-extrabold text-emerald-600 bg-emerald-500/10 px-1.5 py-0.2 rounded border border-emerald-500/20 shrink-0">
                🟢 Live
              </span>
            </div>
            <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground mt-0.5">
              <span>Shift #{activeShift ? (activeShift as any).id?.slice(-4) : '4853'}</span>
              <span>•</span>
              <span className="truncate">{stats.shiftOperator}</span>
            </div>
          </div>
        </div>

        <button 
          onClick={() => setShowDetailsSheet(true)}
          className="p-2 rounded-xl bg-subtle hover:bg-card border border-border text-foreground text-xs font-bold shrink-0 flex items-center gap-1 cursor-pointer active:scale-95"
        >
          <LiveClock className="text-[10px] font-extrabold" iconClassName="w-3 h-3" />
          <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
        </button>
      </header>

      {/* 2. COMPACT SEARCH BAR FOR MOBILE */}
      <div className="relative">
        <button 
          onClick={() => {
            const event = new KeyboardEvent('keydown', { key: 'k', ctrlKey: true });
            window.dispatchEvent(event);
          }}
          className="w-full bg-card border border-border rounded-xl p-2.5 text-left text-xs font-semibold text-muted-foreground flex items-center justify-between shadow-xs cursor-pointer active:scale-98"
        >
          <div className="flex items-center gap-2">
            <Search className="w-4 h-4 text-orange-500" />
            <span>Search everything (Shift, Customer, Tank)...</span>
          </div>
          <span className="text-[9px] font-bold uppercase bg-subtle px-1.5 py-0.5 rounded border border-border">Tap</span>
        </button>
      </div>

      {/* 3. MOBILE ROLE-BASED TAB SWITCHER */}
      <div className="grid grid-cols-4 gap-1 p-1 bg-subtle rounded-xl border border-border text-[10px] font-extrabold">
        <button 
          onClick={() => setRoleMode('owner')}
          className={`py-1.5 rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer ${roleMode === 'owner' ? 'bg-orange-600 text-white shadow-xs' : 'text-muted-foreground'}`}
        >
          <Crown className="w-3 h-3" /> Owner
        </button>
        <button 
          onClick={() => setRoleMode('cashier')}
          className={`py-1.5 rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer ${roleMode === 'cashier' ? 'bg-emerald-600 text-white shadow-xs' : 'text-muted-foreground'}`}
        >
          <UserCheck className="w-3 h-3" /> Cashier
        </button>
        <button 
          onClick={() => setRoleMode('manager')}
          className={`py-1.5 rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer ${roleMode === 'manager' ? 'bg-blue-600 text-white shadow-xs' : 'text-muted-foreground'}`}
        >
          <Briefcase className="w-3 h-3" /> Manager
        </button>
        <button 
          onClick={() => setRoleMode('technician')}
          className={`py-1.5 rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer ${roleMode === 'technician' ? 'bg-purple-600 text-white shadow-xs' : 'text-muted-foreground'}`}
        >
          <Wrench className="w-3 h-3" /> Tech
        </button>
      </div>

      {/* 4. COMPACT HEALTH & REVENUE STRIP */}
      <div className="bg-card border border-border rounded-2xl p-3 shadow-xs space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-orange-500/10 text-orange-600 font-black text-xs flex items-center justify-center border border-orange-500/20">
              {stats.stationHealthScore}%
            </div>
            <span className="text-xs font-black text-foreground">Station Health</span>
          </div>
          <span className="text-[10px] font-bold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
            Optimal
          </span>
        </div>

        {/* 2x2 COMPACT METRICS GRID */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="bg-subtle p-2.5 rounded-xl border border-border">
            <span className="text-[9px] font-bold text-muted-foreground uppercase block">Today's Sales</span>
            <strong className="text-sm font-black text-foreground">{formatCurrency(stats.todayRevenue, settings)}</strong>
          </div>
          <div className="bg-subtle p-2.5 rounded-xl border border-border">
            <span className="text-[9px] font-bold text-muted-foreground uppercase block">Est. Profit</span>
            <strong className="text-sm font-black text-emerald-600">{formatCurrency(stats.todayProfit, settings)}</strong>
          </div>
          <div className="bg-subtle p-2.5 rounded-xl border border-border">
            <span className="text-[9px] font-bold text-muted-foreground uppercase block">Liters Sold</span>
            <strong className="text-sm font-black text-foreground">{stats.todayLiters.toLocaleString()} L</strong>
          </div>
          <div className="bg-subtle p-2.5 rounded-xl border border-border">
            <span className="text-[9px] font-bold text-muted-foreground uppercase block">Net Position</span>
            <strong className="text-sm font-black text-foreground">{formatCurrency(stats.netPosition, settings)}</strong>
          </div>
        </div>
      </div>

      {/* 5. COMPACT AI INTELLIGENCE BANNER */}
      <div 
        onClick={() => setShowAISheet(true)}
        className="bg-gradient-to-r from-orange-500/10 via-amber-500/10 to-emerald-500/10 border border-orange-500/20 rounded-xl p-2.5 flex items-center justify-between shadow-xs cursor-pointer active:scale-98"
      >
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-orange-500" />
          <span className="text-xs font-extrabold text-foreground">AI Intelligence • 3 Realtime Insights</span>
        </div>
        <ChevronRight className="w-4 h-4 text-muted-foreground" />
      </div>

      {/* 6. ROLE-TAILORED CONTENT SECTION */}
      {roleMode === 'owner' && (
        <div className="space-y-3">
          {/* TREASURY STRIP */}
          <div className="bg-card border border-border rounded-2xl p-3 shadow-xs space-y-2">
            <div className="flex justify-between items-center text-xs font-bold text-muted-foreground">
              <span>TREASURY & KHATA</span>
              <button onClick={() => onNavigate('bank_cash')} className="text-orange-600 text-[10px]">View All</button>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs font-bold">
              <div className="p-2 rounded-xl bg-subtle border border-border">
                <span className="text-[9px] text-muted-foreground block">Receivables</span>
                <span className="text-emerald-600 font-black">{formatCurrency(stats.totalReceivables, settings)}</span>
              </div>
              <div className="p-2 rounded-xl bg-subtle border border-border">
                <span className="text-[9px] text-muted-foreground block">Payables</span>
                <span className="text-red-600 font-black">{formatCurrency(stats.totalPayables, settings)}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {roleMode === 'cashier' && (
        <div className="bg-card border border-border rounded-2xl p-3 shadow-xs space-y-2">
          <div className="flex justify-between items-center text-xs font-bold">
            <span className="text-muted-foreground">ACTIVE SHIFT OPERATIONS</span>
            <span className="text-emerald-600">Running</span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-2 rounded-xl bg-subtle border border-border">
              <span className="text-[9px] text-muted-foreground block">Opening Cash</span>
              <span className="font-black text-foreground">{formatCurrency(stats.openingCash, settings)}</span>
            </div>
            <div className="p-2 rounded-xl bg-subtle border border-border">
              <span className="text-[9px] text-muted-foreground block">Expected Cash</span>
              <span className="font-black text-foreground">{formatCurrency(stats.expectedCash, settings)}</span>
            </div>
          </div>
          {!activeShift && (
            <button onClick={onStartShiftQuick} className="w-full py-2 bg-orange-600 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-xs">
              <Power className="w-3.5 h-3.5" /> Start Today's Shift
            </button>
          )}
        </div>
      )}

      {/* 7. REALTIME TANK TELEMETRY CAROUSEL/LIST */}
      <div className="bg-card border border-border rounded-2xl p-3 shadow-xs space-y-2.5">
        <div className="flex justify-between items-center">
          <span className="text-xs font-black text-foreground flex items-center gap-1.5">
            <Droplets className="w-4 h-4 text-orange-500" /> Fuel Tank Gauges
          </span>
          <button onClick={() => onNavigate('inventory')} className="text-[10px] font-bold text-orange-600">Manage</button>
        </div>

        <div className="space-y-2">
          {stats.richTanks.slice(0, 3).map((tank: any, idx: number) => (
            <div key={idx} className="p-2.5 rounded-xl bg-subtle border border-border flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-12 rounded-lg bg-card border border-border p-0.5 flex flex-col justify-end overflow-hidden shrink-0">
                  <div className="w-full bg-orange-500 rounded-md transition-all duration-500" style={{ height: `${tank.tankPct}%` }}></div>
                </div>
                <div>
                  <div className="text-xs font-black text-foreground">{tank.name}</div>
                  <div className="text-[10px] text-muted-foreground font-bold">{tank.currentStock.toLocaleString()} L / {tank.capacity.toLocaleString()} L</div>
                </div>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-black text-foreground block">{tank.tankPct}%</span>
                <span className={`text-[8px] font-extrabold uppercase px-1.5 py-0.5 rounded border ${tank.badgeClass}`}>
                  {tank.tankPct >= 30 ? 'Adequate' : 'Low Stock'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* EXPANDABLE BOTTOM SHEET FOR TELEMETRY DETAILS */}
      {showDetailsSheet && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex flex-col justify-end animate-in fade-in duration-200">
          <div className="bg-card border-t border-border rounded-t-3xl p-4 space-y-4 max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-2 border-b border-border">
              <h3 className="text-sm font-black text-foreground">Live Telemetry Details</h3>
              <button onClick={() => setShowDetailsSheet(false)} className="p-1 rounded-full bg-subtle text-muted-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-2 text-xs font-semibold">
              <div className="flex justify-between py-1 border-b border-border">
                <span className="text-muted-foreground">Active Station:</span>
                <strong className="text-foreground">{activeStationName}</strong>
              </div>
              <div className="flex justify-between py-1 border-b border-border">
                <span className="text-muted-foreground">Network Connection:</span>
                <strong className="text-emerald-600">Online (0ms)</strong>
              </div>
              <div className="flex justify-between py-1 border-b border-border">
                <span className="text-muted-foreground">Cloud Sync Engine:</span>
                <strong className="text-blue-600">Realtime Synchronized</strong>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* EXPANDABLE BOTTOM SHEET FOR AI INSIGHTS */}
      {showAISheet && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex flex-col justify-end animate-in fade-in duration-200">
          <div className="bg-card border-t border-border rounded-t-3xl p-4 space-y-4 max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-2 border-b border-border">
              <h3 className="text-sm font-black text-foreground flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-orange-500" /> AI Realtime Insights
              </h3>
              <button onClick={() => setShowAISheet(false)} className="p-1 rounded-full bg-subtle text-muted-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-2 text-xs font-semibold">
              <div className="p-3 bg-subtle rounded-xl border border-border space-y-1">
                <span className="text-[10px] font-black text-orange-600 uppercase">Stock Alert</span>
                <p className="text-foreground">Tank levels monitored in realtime. Super Petrol sales velocity active.</p>
              </div>
              <button 
                onClick={() => {
                  setShowAISheet(false);
                  onNavigate('jarvis');
                }}
                className="w-full py-2.5 bg-orange-600 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2"
              >
                Ask AI Assistant Anything
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
