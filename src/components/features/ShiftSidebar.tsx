import React, { useState } from 'react';
import { X, Printer, Download, Search, AlertCircle, ChevronRight, CheckCircle2, Package, CreditCard, Receipt, Building2, Wallet, Gauge, StickyNote, Activity, PlayCircle, ShieldAlert, Fingerprint } from 'lucide-react';
import { useInventoryStore } from '../../stores/useInventoryStore';
import { InvestigationEngine } from '../../lib/investigationEngine';
import { InvestigationModal } from './InvestigationModal';

interface ShiftSidebarProps {
  shift: Shift;
  onClose: () => void;
  staff: Staff[];
  products: Product[];
  customers: Customer[];
  suppliers: Supplier[];
  banks: BankAccount[];
  digitalAccounts: DigitalAccount[];
  nozzles: Nozzle[];
  settings: any;
}

export function ShiftSidebar({
  shift,
  onClose,
  staff,
  products,
  customers,
  suppliers,
  banks,
  digitalAccounts,
  nozzles,
  settings
}: ShiftSidebarProps) {
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const isUrdu = settings.language === 'ur';

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(isUrdu ? 'ur-PK' : 'en-PK', {
      style: 'currency',
      currency: settings.currency || 'PKR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  const getStaffName = (id: string) => {
    const s = staff.find(st => st.id === id);
    return s ? (isUrdu ? s.urduName : s.name) : 'Unknown';
  };

  // Aggregates
  const totalCredits = shift.debitEntries?.reduce((sum, d) => sum + d.amount, 0) || 0;
  const totalRecoveries = shift.recoveryEntries?.reduce((sum, r) => sum + r.amount, 0) || 0;
  const totalExpenses = shift.expenseEntries?.reduce((sum, e) => sum + e.amount, 0) || 0;
  const bankDeposits = shift.bankCashEntries?.reduce((sum, b) => sum + b.amount, 0) || 0;
  
  let grossStationSales = 0;
  if (shift.closingReadings && shift.openingReadings) {
    Object.keys(shift.closingReadings).forEach((nozzleId) => {
      const start = shift.openingReadings![nozzleId] || 0;
      const end = shift.closingReadings![nozzleId] || 0;
      const liters = Math.max(0, end - start);
      
      const nozzle = nozzles.find(n => n.id === nozzleId);
      if (nozzle) {
        const rate = shift.rates?.[nozzle.productId] || 0;
        grossStationSales += (liters * rate);
      }
    });
  }

  const totalSalesGrossMinusCredit = grossStationSales - totalCredits;
  const cashInHand = shift.submittedCash || 0;
  const expectedCash = shift.expectedCash || 0;

  // Real-time Net Profit Calculation using FIFO Deductions
  const fifoDeductions = useInventoryStore.getState().fifoDeductions || [];
  const shiftDeductions = fifoDeductions.filter((d) => d.shiftId === shift.id);
  const grossProfitMargin = shiftDeductions.reduce((sum, d) => sum + d.realizedMargin, 0);
  
  // Revaluation for this shift
  const stockBatches = useInventoryStore.getState().stockBatches || [];
  const uniqueBatchIds = new Set<string>();
  shiftDeductions.forEach((d) => uniqueBatchIds.add(d.batchId));
  const shiftRevaluation = Array.from(uniqueBatchIds).reduce((sum, bId) => {
    const b = stockBatches.find(sb => sb.id === bId);
    return sum + (b?.revaluationGainLoss || 0);
  }, 0);

  const netProfit = grossProfitMargin - totalExpenses + shiftRevaluation;

  const isClosed = shift.status === 'closed';

  // Investigation Engine
  const shiftHealth = InvestigationEngine.evaluateShiftHealth(shift);
  const shiftDNA = InvestigationEngine.generateShiftDNA(shift);
  const timelineEvents = InvestigationEngine.generateShiftTimeline(shift);

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'Low': return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20';
      case 'Medium': return 'text-amber-500 bg-amber-500/10 border-amber-500/20';
      case 'High': return 'text-orange-500 bg-orange-500/10 border-orange-500/20';
      case 'Critical': return 'text-red-500 bg-red-500/10 border-red-500/20';
      default: return 'text-slate-500 bg-slate-500/10 border-slate-500/20';
    }
  };

  return (
    <div className="w-80 lg:w-96 bg-white dark:bg-[#111827] border-l border-slate-200 dark:border-slate-800 flex flex-col h-[calc(100vh-64px)] overflow-y-auto shrink-0 shadow-xl lg:shadow-none animate-in slide-in-from-right duration-300 z-40 fixed lg:sticky top-16 right-0">
      
      {/* HEADER */}
      <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between sticky top-0 bg-white/90 dark:bg-[#111827]/90 backdrop-blur-sm z-10">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Shift Summary</h2>
        </div>
        <div className="flex items-center gap-2">
          {isClosed ? (
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 uppercase tracking-widest">CLOSED</span>
          ) : (
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30 uppercase tracking-widest">OPEN</span>
          )}
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors lg:hidden">
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="p-5 space-y-6">
        
        {/* INVESTIGATION SCORE & DNA */}
        <div className="grid grid-cols-2 gap-3">
          <div className={`p-3 rounded-xl border flex flex-col justify-center items-center text-center ${getRiskColor(shiftHealth.riskLevel)}`}>
            <ShieldAlert className="w-6 h-6 mb-1 opacity-80" />
            <span className="text-xl font-black">{shiftHealth.overallSHI}%</span>
            <span className="text-[10px] uppercase tracking-widest font-bold opacity-80">SHI Score</span>
          </div>
          <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 flex flex-col justify-center items-center text-center text-slate-700 dark:text-slate-300">
            <Fingerprint className="w-6 h-6 mb-1 opacity-50" />
            <span className="text-sm font-bold font-mono tracking-tight">{shiftDNA.split('-')[1]}</span>
            <span className="text-[10px] uppercase tracking-widest font-bold opacity-70">Shift DNA</span>
          </div>
        </div>

        {/* SHIFT INFO TABLE */}
        <div className="space-y-3">
          <InfoRow label="Shift ID" value={`#${shift.id}`} />
          <InfoRow label="Shift Type" value={shift.type === 'day' ? 'Day Shift' : 'Night Shift'} valueColor="text-indigo-600 dark:text-indigo-400 font-medium" />
          <InfoRow label="Operator" value={getStaffName(shift.staffId)} />
          <InfoRow label="Start Time" value={`${shift.date} ${shift.startTime}`} />
          <InfoRow label="End Time" value={shift.endTime ? `${shift.date} ${shift.endTime}` : '-'} />
          <InfoRow label="Duration" value="-" /> {/* Can calculate accurate duration if needed */}
        </div>

        {/* ACTION BUTTONS */}
        <div className="flex gap-3">
          <button className="flex-1 py-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold flex items-center justify-center gap-2 transition-colors text-slate-700 dark:text-slate-300">
            <Printer className="w-3.5 h-3.5" /> Print Report
          </button>
          <button className="flex-1 py-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold flex items-center justify-center gap-2 transition-colors text-slate-700 dark:text-slate-300">
            <Download className="w-3.5 h-3.5" /> Export
          </button>
        </div>

        {/* FINANCIAL OVERVIEW */}
        <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
          <div className="bg-slate-50 dark:bg-slate-800/50 px-4 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2">
            <Wallet className="w-4 h-4 text-slate-500" />
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-700 dark:text-slate-300">Financial Overview</h3>
          </div>
          <div className="p-4 space-y-3">
            <FinancialRow label="Gross Station Sales" value={formatCurrency(grossStationSales)} />
            <FinancialRow label="Credit Sales Given" value={formatCurrency(totalCredits)} />
            <FinancialRow label="Total Sales (Gross - Credit)" value={formatCurrency(totalSalesGrossMinusCredit)} />
            <FinancialRow label="Total Expenses" value={formatCurrency(totalExpenses)} />
            <FinancialRow label="Bank Cash Deposited" value={formatCurrency(bankDeposits)} />
            <FinancialRow label="Recoveries Collected" value={formatCurrency(totalRecoveries)} />
            <FinancialRow label="Cash In Hand" value={formatCurrency(cashInHand)} />
            <FinancialRow label="Expected Cash" value={formatCurrency(expectedCash)} />
            
            <div className="pt-3 mt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
              <span className="text-sm font-bold text-orange-600 dark:text-orange-500">Net Profit / (Loss)</span>
              <span className="text-sm font-black text-orange-600 dark:text-orange-500">{formatCurrency(netProfit)}</span>
            </div>
          </div>
        </div>

        {/* INVESTIGATION BUTTON */}
        <div className="mb-4">
          <button 
            onClick={() => setActiveModal('investigate')}
            className={`w-full py-3 px-4 rounded-xl font-bold flex items-center justify-center gap-2 shadow-sm transition-all hover:scale-[1.02] active:scale-95 ${shiftHealth.overallSHI < 85 ? 'bg-rose-500 hover:bg-rose-600 text-white shadow-rose-500/20' : 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100'}`}
          >
            <Search className="w-5 h-5" />
            Open Deep Investigation
          </button>
        </div>

        {/* DRILL DOWN ACCORDIONS */}
        <div className="space-y-2">
          <DrillDownItem icon={<PlayCircle className="w-4 h-4 text-orange-500" />} label="Timeline Replay" onClick={() => setActiveModal('timeline')} />
          <div className="h-px bg-slate-100 dark:bg-slate-800 my-2"></div>
          <DrillDownItem icon={<Package className="w-4 h-4" />} label="Products Summary" onClick={() => setActiveModal('products')} />
          <DrillDownItem icon={<CreditCard className="w-4 h-4" />} label="Credit Sales Details" onClick={() => setActiveModal('credit')} />
          <DrillDownItem icon={<Receipt className="w-4 h-4" />} label="Expenses Breakdown" onClick={() => setActiveModal('expenses')} />
          <DrillDownItem icon={<Building2 className="w-4 h-4" />} label="Bank Deposits" onClick={() => setActiveModal('bank')} />
          <DrillDownItem icon={<Wallet className="w-4 h-4" />} label="Recoveries" onClick={() => setActiveModal('recoveries')} />
          <DrillDownItem icon={<Gauge className="w-4 h-4" />} label="Meter Readings" onClick={() => setActiveModal('meters')} />
        </div>

      </div>

      {/* MODALS */}
      {activeModal === 'investigate' && (
        <InvestigationModal
          shift={shift}
          onClose={() => setActiveModal(null)}
          staff={staff}
          products={products}
          customers={customers}
          suppliers={suppliers}
          banks={banks}
          digitalAccounts={digitalAccounts}
          nozzles={nozzles}
        />
      )}
      {activeModal === 'timeline' && (
        <TimelineModal
          shift={shift}
          events={timelineEvents}
          onClose={() => setActiveModal(null)}
        />
      )}
      {activeModal === 'credit' && (
        <TransactionModal
          title="Credit Sales Details"
          onClose={() => setActiveModal(null)}
          items={shift.debitEntries || []}
          columns={[
            { key: 'customer', label: 'Customer', render: (item: any) => customers.find(c => c.id === item.customerId)?.name || 'Unknown' },
            { key: 'product', label: 'Product', render: (item: any) => products.find(p => p.id === item.productId)?.name || 'Unknown' },
            { key: 'qty', label: 'Qty', render: (item: any) => item.quantity },
            { key: 'amount', label: 'Amount', render: (item: any) => formatCurrency(item.amount) }
          ]}
        />
      )}

      {activeModal === 'expenses' && (
        <TransactionModal
          title="Expenses Breakdown"
          onClose={() => setActiveModal(null)}
          items={shift.expenseEntries || []}
          columns={[
            { key: 'category', label: 'Category', render: (item: any) => item.category },
            { key: 'amount', label: 'Amount', render: (item: any) => formatCurrency(item.amount) },
            { key: 'desc', label: 'Description', render: (item: any) => item.description || '-' }
          ]}
        />
      )}

      {activeModal === 'bank' && (
        <TransactionModal
          title="Bank Deposits"
          onClose={() => setActiveModal(null)}
          items={shift.bankCashEntries || []}
          columns={[
            { key: 'bank', label: 'Bank', render: (item: any) => banks.find(b => b.id === item.bankAccountId)?.name || 'Unknown' },
            { key: 'amount', label: 'Amount', render: (item: any) => formatCurrency(item.amount) },
            { key: 'ref', label: 'Reference', render: (item: any) => item.reference || '-' }
          ]}
        />
      )}

      {activeModal === 'recoveries' && (
        <TransactionModal
          title="Recoveries"
          onClose={() => setActiveModal(null)}
          items={shift.recoveryEntries || []}
          columns={[
            { key: 'customer', label: 'Customer', render: (item: any) => customers.find(c => c.id === item.customerId)?.name || 'Unknown' },
            { key: 'mode', label: 'Mode', render: (item: any) => item.mode },
            { key: 'amount', label: 'Amount', render: (item: any) => formatCurrency(item.amount) }
          ]}
        />
      )}
    </div>
  );
}

function InfoRow({ label, value, valueColor = "text-slate-900 dark:text-white font-medium" }: { label: string, value: string, valueColor?: string }) {
  return (
    <div className="flex justify-between items-center text-xs">
      <span className="text-slate-500 dark:text-slate-400 flex items-center gap-2">
        <div className="w-3 h-3 border border-slate-300 dark:border-slate-600 rounded-sm flex items-center justify-center">
          <div className="w-1.5 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-sm"></div>
        </div>
        {label}
      </span>
      <span className={valueColor}>{value}</span>
    </div>
  );
}

function FinancialRow({ label, value }: { label: string, value: string }) {
  return (
    <div className="flex justify-between items-center text-xs">
      <span className="text-slate-600 dark:text-slate-400">{label}</span>
      <span className="font-medium text-slate-900 dark:text-white">{value}</span>
    </div>
  );
}

function DrillDownItem({ icon, label, onClick }: { icon: React.ReactNode, label: string, onClick?: () => void }) {
  return (
    <button onClick={onClick} className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-slate-700 dark:text-slate-300 group border border-transparent hover:border-slate-200 dark:hover:border-slate-700">
      <div className="flex items-center gap-3">
        <div className="text-slate-400 group-hover:text-slate-600 dark:group-hover:text-white transition-colors">{icon}</div>
        <span className="text-sm font-medium">{label}</span>
      </div>
      <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-white transition-colors" />
    </button>
  );
}

function TransactionModal({ title, onClose, items, columns }: any) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-white dark:bg-[#111827] rounded-2xl shadow-2xl flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200 overflow-hidden border border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#0B0F19]">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">{title}</h3>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="overflow-auto flex-1 p-0">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-100 dark:bg-slate-800/50 text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                {columns.map((col: any, idx: number) => (
                  <th key={idx} className="px-5 py-3">{col.label}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
              {items.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className="px-5 py-8 text-center text-slate-500 dark:text-slate-400">No records found.</td>
                </tr>
              ) : (
                items.map((item: any, idx: number) => (
                  <tr key={item.id || idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/20">
                    {columns.map((col: any, colIdx: number) => (
                      <td key={colIdx} className="px-5 py-3 text-sm text-slate-700 dark:text-slate-300">
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

function TimelineModal({ shift, events, onClose }: any) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-3xl bg-white dark:bg-[#111827] rounded-2xl shadow-2xl flex flex-col h-[85vh] animate-in zoom-in-95 duration-200 overflow-hidden border border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#0B0F19]">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <PlayCircle className="w-5 h-5 text-orange-500" />
              Business Replay Mode
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Chronological playback for Shift #{shift.id}</p>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="overflow-y-auto flex-1 p-6 relative bg-slate-50 dark:bg-[#0B0F19]">
          <div className="absolute left-10 top-0 bottom-0 w-0.5 bg-slate-200 dark:bg-slate-800"></div>
          <div className="space-y-6">
            {events.map((evt: any, idx: number) => {
              const Icon = evt.type === 'expense' ? Receipt : evt.type === 'credit' ? CreditCard : evt.type === 'recovery' ? Wallet : evt.type === 'bank' ? Building2 : Activity;
              const color = evt.type === 'expense' ? 'text-red-500 bg-red-100 dark:bg-red-500/20' : evt.type === 'credit' ? 'text-purple-500 bg-purple-100 dark:bg-purple-500/20' : evt.type === 'recovery' ? 'text-emerald-500 bg-emerald-100 dark:bg-emerald-500/20' : 'text-blue-500 bg-blue-100 dark:bg-blue-500/20';

              return (
                <div key={idx} className="flex gap-6 relative z-10">
                  <div className={`w-8 h-8 rounded-full flex shrink-0 items-center justify-center border-4 border-white dark:border-[#0B0F19] ${color}`}>
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <div className="flex-1 bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 p-4 rounded-xl shadow-sm">
                    <div className="flex justify-between items-start mb-2">
                      <div className="font-bold text-sm text-slate-900 dark:text-white">{evt.title}</div>
                      <div className="text-xs font-mono text-slate-500 dark:text-slate-400">{evt.timestamp.split('T')[1]?.slice(0,5) || '12:00'}</div>
                    </div>
                    <div className="text-sm text-slate-600 dark:text-slate-400 mb-3">{evt.description}</div>
                    {evt.amount > 0 && (
                      <div className="inline-block px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300">
                        Rs. {evt.amount.toLocaleString()}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
