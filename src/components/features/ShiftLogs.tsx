import React, { useState, useMemo } from 'react';
import {
  History,
  Filter,
  Search,
  Calendar,
  Download,
  Activity,
  CreditCard,
  Building2,
  Receipt,
  Wallet,
  TrendingUp,
  FolderOpen,
  BrainCircuit,
  ShieldAlert,
  X
} from 'lucide-react';
import { Shift, Staff, Customer, Supplier, BankAccount, DigitalAccount, Product, Tank, Nozzle, GlobalSettings } from '../../types';
import { t as translate } from '../../lib/translations';
import { ShiftSidebar } from './ShiftSidebar';
import { useInventoryStore } from '../../stores/useInventoryStore';
import { InvestigationEngine } from '../../lib/investigationEngine';
import { FuelVarianceHeatmap } from './FuelVarianceHeatmap';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useDebounce } from '../../hooks/useDebounce';

interface ShiftLogsProps {
  shifts: Shift[];
  staff: Staff[];
  customers: Customer[];
  suppliers: Supplier[];
  banks: BankAccount[];
  digitalAccounts: DigitalAccount[];
  products: Product[];
  tanks: Tank[];
  nozzles: Nozzle[];
  settings: GlobalSettings;
}

export default function ShiftLogs({
  shifts,
  staff,
  customers,
  suppliers,
  banks,
  digitalAccounts,
  products,
  tanks,
  nozzles,
  settings
}: ShiftLogsProps) {
   
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const t = (en: string, ur: string) => translate(en, ur, settings);
  const isUrdu = settings.language === 'ur';

  // State
  const [filterType, setFilterType] = useState<string>('all');
  const [operatorFilter, setOperatorFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const [selectedShift, setSelectedShift] = useState<Shift | null>(null);
  const [activeGlobalModal, setActiveGlobalModal] = useState<string | null>(null);
  
  // Pagination / Incremental Loading state
  const [visibleLimit, setVisibleLimit] = useState(100);

  const filteredShifts = useMemo(() => {
    return shifts
      .filter((s) => {
        if (filterType !== 'all' && s.type !== filterType) return false;
        if (statusFilter !== 'all' && s.status !== statusFilter) return false;
        if (operatorFilter !== 'all' && s.staffId !== operatorFilter) return false;
        
        if (debouncedSearchQuery) {
          const sName = getStaffName(s.staffId).toLowerCase();
          return sName.includes(debouncedSearchQuery.toLowerCase()) || s.id.includes(debouncedSearchQuery);
        }
        return true;
      })
       
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shifts, filterType, statusFilter, operatorFilter, debouncedSearchQuery]);

  const parentRef = React.useRef<HTMLDivElement>(null);
  
  // Cap the array passed to virtualizer to prevent massive iteration initially
   
  const displayedShifts = filteredShifts.slice(0, visibleLimit);

  // eslint-disable-next-line react-hooks/incompatible-library
  const rowVirtualizer = useVirtualizer({
    count: displayedShifts.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 64, // Estimated height of a row
    overscan: 10,
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(isUrdu ? 'ur-PK' : 'en-PK', {
      style: 'currency',
      currency: settings.currency || 'PKR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  const getStaffName = (id: string) => {
    const s = staff.find((st) => st.id === id);
    return s ? (isUrdu ? s.urduName : s.name) : 'Unknown';
  };

  // CALCULATE GLOBAL AGGREGATES FOR TOP KPIs BASED ON FILTERED SHIFTS
  const aggregates = useMemo(() => {
    let sales = 0;
    let credits = 0;
    let bankCash = 0;
    let expenses = 0;
    let recoveries = 0;
    let profit = 0;

    const fifoDeductions = useInventoryStore.getState().fifoDeductions || [];
    const stockBatches = useInventoryStore.getState().stockBatches || [];

    filteredShifts.forEach(shift => {
      // Station Sales
      let shiftSales = 0;
      if (shift.closingReadings && shift.openingReadings) {
        Object.keys(shift.closingReadings).forEach((nozzleId) => {
          const start = shift.openingReadings![nozzleId] || 0;
          const end = shift.closingReadings![nozzleId] || 0;
          const liters = Math.max(0, end - start);
          const nozzle = nozzles.find(n => n.id === nozzleId);
          if (nozzle) {
            const rate = shift.rates?.[nozzle.productId] || 0;
            shiftSales += (liters * rate);
          }
        });
      }
      sales += shiftSales;

      // Other metrics
      credits += shift.debitEntries?.reduce((sum, d) => sum + d.amount, 0) || 0;
      bankCash += shift.bankCashEntries?.reduce((sum, b) => sum + b.amount, 0) || 0;
      const shiftExpenses = shift.expenseEntries?.reduce((sum, e) => sum + e.amount, 0) || 0;
      expenses += shiftExpenses;
      recoveries += shift.recoveryEntries?.reduce((sum, r) => sum + r.amount, 0) || 0;

      // Profit
      const shiftDeductions = fifoDeductions.filter((d) => d.shiftId === shift.id);
      const grossMargin = shiftDeductions.reduce((sum, d) => sum + d.realizedMargin, 0);
      const uniqueBatchIds = new Set<string>();
      shiftDeductions.forEach((d) => uniqueBatchIds.add(d.batchId));
      const shiftRevaluation = Array.from(uniqueBatchIds).reduce((sum, bId) => {
        const b = stockBatches.find(sb => sb.id === bId);
        return sum + (b?.revaluationGainLoss || 0);
      }, 0);

      profit += (grossMargin - shiftExpenses + shiftRevaluation);
    });

    let avgSHI = 0;
    if (filteredShifts.length > 0) {
      const totalSHI = filteredShifts.reduce((sum, s) => sum + InvestigationEngine.evaluateShiftHealth(s).overallSHI, 0);
      avgSHI = Math.round(totalSHI / filteredShifts.length);
    }

    return { sales, credits, bankCash, expenses, recoveries, profit, avgSHI };
  }, [filteredShifts, nozzles]);

  return (
    <div className="flex w-full h-[calc(100vh-64px)] overflow-hidden bg-slate-50 dark:bg-[#0B0F19]">
      
      {/* MAIN CONTENT PANE */}
      <div className="flex-1 flex flex-col h-full overflow-y-auto px-4 lg:px-8 py-6">
        
        {/* HEADER */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Activity className="w-6 h-6 text-orange-500" />
              Shift Wizard Logs
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              View, analyze and audit all shift sessions with complete financial details.
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-4 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#111827] text-slate-700 dark:text-slate-300 rounded-lg text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-sm">
              <Download className="w-4 h-4" /> Export
            </button>
            <div className="flex items-center px-4 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#111827] text-slate-700 dark:text-slate-300 rounded-lg text-sm font-medium shadow-sm">
              <Calendar className="w-4 h-4 mr-2" />
              17 May 2025 - 17 Jun 2025
            </div>
            <button className="p-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#111827] text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-sm">
              <Filter className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* INTELLIGENCE ENGINE & TOP KPIs */}
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 mb-8">
          
          {/* AI Decision Panel */}
          <div className="xl:col-span-3 bg-gradient-to-br from-indigo-900 to-slate-900 rounded-xl p-6 text-white shadow-lg relative overflow-hidden flex flex-col justify-between">
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -mt-10 -mr-10"></div>
            <div>
              <div className="flex items-center gap-2 mb-4">
                <BrainCircuit className="w-5 h-5 text-indigo-400" />
                <h3 className="font-bold text-lg text-indigo-50">Decision Intelligence Engine</h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-black bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 uppercase tracking-widest ml-2">Active</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-start gap-3 bg-white/5 border border-white/10 rounded-lg p-3 backdrop-blur-sm">
                  <div className="w-2 h-2 rounded-full bg-rose-500 mt-1.5 shrink-0 animate-pulse"></div>
                  <div>
                    <div className="text-sm font-bold text-white mb-0.5">Recover High Credit Exposure</div>
                    <div className="text-xs text-indigo-200">You have over Rs. 150,000 in unrecovered Udhar from the last 7 shifts. Immediate recovery recommended from Top 3 debtors.</div>
                  </div>
                </div>
                <div className="flex items-start gap-3 bg-white/5 border border-white/10 rounded-lg p-3 backdrop-blur-sm">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5 shrink-0"></div>
                  <div>
                    <div className="text-sm font-bold text-white mb-0.5">Ali is Top Performer</div>
                    <div className="text-xs text-indigo-200">Operator Ali consistently maintains a 98% Cash Integrity score. Shift profit is 12% above station average.</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Station Health Index (SHI) */}
          <div className="bg-white dark:bg-[#111827] rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm flex flex-col items-center justify-center text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-400 to-emerald-600"></div>
            <ShieldAlert className={`w-10 h-10 mb-2 ${aggregates.avgSHI >= 85 ? 'text-emerald-500' : aggregates.avgSHI >= 70 ? 'text-amber-500' : 'text-rose-500'}`} />
            <div className="text-4xl font-black text-slate-900 dark:text-white mb-1">{aggregates.avgSHI}%</div>
            <div className="text-sm font-bold text-slate-500 dark:text-slate-400">Station Health Index</div>
            <div className="mt-4 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-600 dark:text-slate-300">
              {aggregates.avgSHI >= 85 ? 'Excellent Health' : aggregates.avgSHI >= 70 ? 'Needs Attention' : 'Critical Investigation'}
            </div>
          </div>
        </div>

        {/* TOP KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          <KpiCard icon={<TrendingUp className="w-4 h-4 text-emerald-500" />} iconBg="bg-emerald-50 dark:bg-emerald-500/10" border="border-emerald-500/20" title="Total Sales" value={formatCurrency(aggregates.sales)} />
          <KpiCard onClick={() => setActiveGlobalModal('credits')} icon={<CreditCard className="w-4 h-4 text-purple-500" />} iconBg="bg-purple-50 dark:bg-purple-500/10" border="border-purple-500/20" title="Total Credits" value={formatCurrency(aggregates.credits)} />
          <KpiCard onClick={() => setActiveGlobalModal('bank')} icon={<Building2 className="w-4 h-4 text-blue-500" />} iconBg="bg-blue-50 dark:bg-blue-500/10" border="border-blue-500/20" title="Bank Cash" value={formatCurrency(aggregates.bankCash)} />
          <KpiCard onClick={() => setActiveGlobalModal('expenses')} icon={<Receipt className="w-4 h-4 text-red-500" />} iconBg="bg-red-50 dark:bg-red-500/10" border="border-red-500/20" title="Expenses" value={formatCurrency(aggregates.expenses)} />
          <KpiCard onClick={() => setActiveGlobalModal('recoveries')} icon={<Wallet className="w-4 h-4 text-emerald-500" />} iconBg="bg-emerald-50 dark:bg-emerald-500/10" border="border-emerald-500/20" title="Recoveries" value={formatCurrency(aggregates.recoveries)} />
          <KpiCard icon={<Activity className="w-4 h-4 text-orange-500" />} iconBg="bg-orange-50 dark:bg-orange-500/10" border="border-orange-500/20" title="Net Profit / Loss" value={formatCurrency(aggregates.profit)} />
        </div>

        {/* FUEL VARIANCE HEATMAP */}
        <div className="mb-8">
          <FuelVarianceHeatmap tanks={tanks} shifts={filteredShifts} nozzles={nozzles} />
        </div>

        {/* TABLE SECTION */}
        <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm flex flex-col flex-1 min-h-[400px]">
          
          {/* Table Filters */}
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-wrap gap-4 items-center justify-between">
            <div className="relative flex-1 min-w-[250px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search by operator or note..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
            
            <div className="flex items-center gap-3 w-full lg:w-auto">
              <select 
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm px-3 py-2 text-slate-700 dark:text-slate-300 outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="all">All Shift Types</option>
                <option value="day">Day Shifts</option>
                <option value="night">Night Shifts</option>
              </select>

              <select 
                value={operatorFilter}
                onChange={(e) => setOperatorFilter(e.target.value)}
                className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm px-3 py-2 text-slate-700 dark:text-slate-300 outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="all">All Operators</option>
                {staff.filter(s => s.role === 'operator' || s.role === 'manager').map(s => (
                  <option key={s.id} value={s.id}>{isUrdu ? s.urduName : s.name}</option>
                ))}
              </select>

              <select 
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm px-3 py-2 text-slate-700 dark:text-slate-300 outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="all">All Status</option>
                <option value="active">Open</option>
                <option value="closed">Closed</option>
              </select>

              <button 
                onClick={() => { setFilterType('all'); setOperatorFilter('all'); setStatusFilter('all'); setSearchQuery(''); }}
                className="flex items-center gap-2 px-3 py-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 text-sm font-medium transition-colors border border-transparent hover:border-slate-200 dark:hover:border-slate-700 rounded-lg"
              >
                <Filter className="w-4 h-4" /> Clear Filters
              </button>
            </div>
          </div>

          {/* Table Data */}
          <div ref={parentRef} className="overflow-auto flex-1 relative min-h-[400px]">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead className="sticky top-0 z-10">
                <tr className="bg-slate-50 dark:bg-[#0B0F19] text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                  <th className="px-6 py-4 w-[15%]">SHIFT ID</th>
                  <th className="px-6 py-4 w-[15%]">SHIFT TYPE</th>
                  <th className="px-6 py-4 w-[20%]">OPERATOR</th>
                  <th className="px-6 py-4 w-[20%]">DATE & TIME</th>
                  <th className="px-6 py-4 w-[15%]">SALES (Rs.)</th>
                  <th className="px-6 py-4 w-[15%]">CASH IN HAND (Rs.)</th>
                  <th className="px-6 py-4 w-[15%] text-center">STATUS</th>
                </tr>
              </thead>
              <tbody 
                className="divide-y divide-slate-100 dark:divide-slate-800 relative block"
                style={{ height: `${rowVirtualizer.getTotalSize()}px` }}
              >
                {displayedShifts.length === 0 ? (
                  <tr className="absolute w-full flex justify-center">
                    <td className="px-6 py-24 text-center">
                      <div className="flex flex-col items-center justify-center text-slate-400">
                        <FolderOpen className="w-16 h-16 mb-4 opacity-50" />
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">No shift logs found</h3>
                        <p className="text-sm">Try adjusting your filters or date range.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  rowVirtualizer.getVirtualItems().map(virtualRow => {
                    const shift = displayedShifts[virtualRow.index];
                    // Quick calculation for row
                    let shiftSales = 0;
                    if (shift.closingReadings && shift.openingReadings) {
                      Object.keys(shift.closingReadings).forEach((nozzleId) => {
                        const start = shift.openingReadings![nozzleId] || 0;
                        const end = shift.closingReadings![nozzleId] || 0;
                        const liters = Math.max(0, end - start);
                        const nozzle = nozzles.find(n => n.id === nozzleId);
                        if (nozzle) {
                          const rate = shift.rates?.[nozzle.productId] || 0;
                          shiftSales += (liters * rate);
                        }
                      });
                    }

                    const isSelected = selectedShift?.id === shift.id;

                    return (
                      <tr 
                        key={virtualRow.key}
                        data-index={virtualRow.index}
                        ref={rowVirtualizer.measureElement}
                        onClick={() => setSelectedShift(shift)}
                        className={`cursor-pointer transition-colors absolute w-full flex items-center ${isSelected ? 'bg-orange-50 dark:bg-orange-500/10' : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'}`}
                        style={{
                          top: 0,
                          left: 0,
                          transform: `translateY(${virtualRow.start}px)`,
                          height: `${virtualRow.size}px`,
                        }}
                      >
                        <td className="px-6 py-4 text-sm font-bold text-slate-900 dark:text-white w-[15%] truncate">#{shift.id.slice(-5)}</td>
                        <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300 w-[15%] truncate">{shift.type === 'day' ? 'Day Shift' : 'Night Shift'}</td>
                        <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300 w-[20%] truncate">{getStaffName(shift.staffId)}</td>
                        <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300 w-[20%] truncate">{shift.date} <span className="text-slate-400 text-xs ml-1">{shift.startTime}</span></td>
                        <td className="px-6 py-4 text-sm font-bold text-slate-900 dark:text-white w-[15%] truncate">{formatCurrency(shiftSales).replace('PKR', '').trim()}</td>
                        <td className="px-6 py-4 text-sm font-bold text-slate-900 dark:text-white w-[15%] truncate">{formatCurrency(shift.submittedCash || 0).replace('PKR', '').trim()}</td>
                        <td className="px-6 py-4 text-center w-[15%] truncate">
                          {shift.status === 'closed' ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 uppercase tracking-widest">CLOSED</span>
                          ) : (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30 uppercase tracking-widest">OPEN</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
          
          {/* Pagination Footer */}
          <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <div>Showing {displayedShifts.length > 0 ? 1 : 0} to {displayedShifts.length} of {filteredShifts.length} entries</div>
            
            {filteredShifts.length > displayedShifts.length && (
              <button 
                onClick={() => setVisibleLimit(prev => prev + 100)}
                className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-full font-bold transition-colors"
              >
                Load More
              </button>
            )}

            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div> Real-time Virtualized</span>
              <History className="w-3.5 h-3.5" />
            </div>
          </div>
        </div>

      </div>

      {/* RIGHT SIDEBAR - SHIFT DETAILS */}
      {selectedShift ? (
        <ShiftSidebar
          shift={selectedShift}
          onClose={() => setSelectedShift(null)}
          settings={settings}
          staff={staff}
          products={products}
          customers={customers}
          suppliers={suppliers}
          banks={banks}
          digitalAccounts={digitalAccounts}
          nozzles={nozzles}
        />
      ) : (
        <div className="w-80 lg:w-96 bg-slate-50 dark:bg-[#0B0F19] border-l border-slate-200 dark:border-slate-800 hidden lg:flex flex-col items-center justify-center p-8 text-center shrink-0">
          <FolderOpen className="w-16 h-16 mb-4 text-slate-300 dark:text-slate-700" />
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Shift Details</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">Select a shift from the list to view full details and drill-down information.</p>
        </div>
      )}

      {/* GLOBAL MODALS */}
      {activeGlobalModal === 'expenses' && (
        <GlobalTransactionModal
          title="Global Expenses Ledger"
           
          onClose={() => setActiveGlobalModal(null)}
           
          items={filteredShifts.flatMap(s => (s.expenseEntries || []).map(e => ({ ...e, shiftId: s.id, date: s.date })))}
           
          columns={[
             
             
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            { key: 'shift', label: 'Shift ID', render: (item: any) => `#${item.shiftId.slice(-5)}` },
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            { key: 'date', label: 'Date', render: (item: any) => item.date },
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            { key: 'category', label: 'Category', render: (item: any) => item.category },
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            { key: 'amount', label: 'Amount', render: (item: any) => formatCurrency(item.amount) },
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            { key: 'desc', label: 'Description', render: (item: any) => item.description || '-' }
          ]}
        />
       
      )}
 { }

      { }
      {activeGlobalModal === 'credits' && (
         
        <GlobalTransactionModal
           
          title="Global Credit Sales Ledger"
          onClose={() => setActiveGlobalModal(null)}
          items={filteredShifts.flatMap(s => (s.debitEntries || []).map(e => ({ ...e, shiftId: s.id, date: s.date })))}
          columns={[
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            { key: 'shift', label: 'Shift ID', render: (item: any) => `#${item.shiftId.slice(-5)}` },
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            { key: 'date', label: 'Date', render: (item: any) => item.date },
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            { key: 'customer', label: 'Customer', render: (item: any) => customers.find(c => c.id === item.customerId)?.name || 'Unknown' },
             
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            { key: 'product', label: 'Product', render: (item: any) => products.find(p => p.id === item.productId)?.name || 'Unknown' },
             
             
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            { key: 'amount', label: 'Amount', render: (item: any) => formatCurrency(item.amount) }
           
          ]}
         
        />
      )}

      {activeGlobalModal === 'bank' && (
        <GlobalTransactionModal
          title="Global Bank Deposits"
          onClose={() => setActiveGlobalModal(null)}
          items={filteredShifts.flatMap(s => (s.bankCashEntries || []).map(e => ({ ...e, shiftId: s.id, date: s.date })))}
          columns={[
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            { key: 'shift', label: 'Shift ID', render: (item: any) => `#${item.shiftId.slice(-5)}` },
             
             
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            { key: 'date', label: 'Date', render: (item: any) => item.date },
             
             
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            { key: 'bank', label: 'Bank', render: (item: any) => banks.find(b => b.id === item.bankAccountId)?.name || 'Unknown' },
             
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            { key: 'amount', label: 'Amount', render: (item: any) => formatCurrency(item.amount) },
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            { key: 'ref', label: 'Reference', render: (item: any) => item.reference || '-' }
          ]}
        />
      )}

      {activeGlobalModal === 'recoveries' && (
        <GlobalTransactionModal
          title="Global Recoveries Ledger"
          onClose={() => setActiveGlobalModal(null)}
          items={filteredShifts.flatMap(s => (s.recoveryEntries || []).map(e => ({ ...e, shiftId: s.id, date: s.date })))}
           
          columns={[
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            { key: 'shift', label: 'Shift ID', render: (item: any) => `#${item.shiftId.slice(-5)}` },
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            { key: 'date', label: 'Date', render: (item: any) => item.date },
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            { key: 'customer', label: 'Customer', render: (item: any) => customers.find(c => c.id === item.customerId)?.name || 'Unknown' },
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            { key: 'amount', label: 'Amount', render: (item: any) => formatCurrency(item.amount) },
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            { key: 'mode', label: 'Mode', render: (item: any) => item.mode }
          ]}
        />
      )}

    </div>
  );
}

 
// ----------------------------------------------------------------------
// HELPER COMPONENTS
// ----------------------------------------------------------------------

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function KpiCard({ icon, iconBg, border, title, value, onClick }: any) {
  return (
    <div onClick={onClick} className={`bg-white dark:bg-[#111827] rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow cursor-pointer group`}>
      <div className="flex items-center gap-3 mb-4">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center border ${iconBg} ${border}`}>
          {icon}
        </div>
        <div className="text-xs font-bold text-slate-500 dark:text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200 transition-colors">{title}</div>
      </div>
      <div>
        <div className="text-xl font-bold text-slate-900 dark:text-white truncate group-hover:text-orange-500 dark:group-hover:text-orange-400 transition-colors">{value.replace('PKR', '').trim()}</div>
      </div>
      <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/50 flex items-center gap-1 text-[10px] text-slate-400 uppercase tracking-widest font-bold group-hover:text-orange-500 dark:group-hover:text-orange-400 transition-colors">
        { }
        View Details <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
      </div>
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function GlobalTransactionModal({ title, onClose, items, columns }: any) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-4xl bg-white dark:bg-[#111827] rounded-2xl shadow-2xl flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200 overflow-hidden border border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#0B0F19]">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <FolderOpen className="w-5 h-5 text-orange-500" />
            {title}
            <span className="px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-[10px] font-black text-slate-600 dark:text-slate-300 ml-2">{items.length} Entries</span>
          { }
          </h3>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full transition-colors">
            { }
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="overflow-auto flex-1 p-0">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-100 dark:bg-slate-800/50 text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {columns.map((col: any, idx: number) => (
                  <th key={idx} className="px-5 py-3 whitespace-nowrap">{col.label}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
              {items.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className="px-5 py-12 text-center text-slate-500 dark:text-slate-400">
                    <div className="flex flex-col items-center justify-center">
                      <FolderOpen className="w-12 h-12 mb-3 opacity-20" />
                      No records found for the current filters.
                    </div>
                  </td>
                </tr>
              ) : (
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                items.map((item: any, idx: number) => (
                  <tr key={item.id || idx} className="hover:bg-slate-50 dark:bg-slate-900/50 dark:hover:bg-slate-800/80 transition-colors">
                    {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                    {columns.map((col: any, colIdx: number) => (
                      <td key={colIdx} className="px-5 py-3 text-sm text-slate-700 dark:text-slate-300 whitespace-nowrap">
                        {col.render(item)}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
