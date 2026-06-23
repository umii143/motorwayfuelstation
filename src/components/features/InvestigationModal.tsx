import React from 'react';
import { X, Printer, Download, ShieldAlert, AlertTriangle, Fingerprint, Activity, FileText, Lock } from 'lucide-react';
import { Shift, Staff, Product, Customer, Supplier, BankAccount, DigitalAccount, Nozzle } from '../../types';
import { InvestigationEngine } from '../../lib/investigationEngine';

interface InvestigationModalProps {
  shift: Shift;
  onClose: () => void;
  staff: Staff[];
  products: Product[];
  customers: Customer[];
  suppliers: Supplier[];
  banks: BankAccount[];
  digitalAccounts: DigitalAccount[];
  nozzles: Nozzle[];
}

export function InvestigationModal({
  shift, onClose, staff, products, customers, suppliers, banks, digitalAccounts, nozzles
}: InvestigationModalProps) {
  
  const shiftHealth = InvestigationEngine.evaluateShiftHealth(shift);
  const shiftDNA = InvestigationEngine.generateShiftDNA(shift);

  const formatCurrency = (amount: number) => new Intl.NumberFormat('en-PK', { style: 'currency', currency: 'PKR', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount).replace('PKR', '').trim();

  // Fuel sales
  let shiftSales = 0;
  const nozzleSales: { nozzleName: string, start: number, end: number, liters: number, rate: number, total: number }[] = [];
  if (shift.closingReadings && shift.openingReadings) {
    Object.keys(shift.closingReadings).forEach((nozzleId) => {
      const start = shift.openingReadings[nozzleId] || 0;
      const end = shift.closingReadings[nozzleId] || 0;
      const liters = Math.max(0, end - start);
      const nozzle = nozzles.find(n => n.id === nozzleId);
      if (nozzle) {
        const rate = shift.rates?.[nozzle.productId] || 0;
        const total = liters * rate;
        shiftSales += total;
        nozzleSales.push({ nozzleName: nozzle.name, start, end, liters, rate, total });
      }
    });
  }

  const s = staff.find(st => st.id === shift.staffId);
  const staffName = s ? s.name : 'Unknown';

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-900/90 backdrop-blur-md animate-in fade-in duration-300">
      <div className="w-full max-w-6xl bg-white dark:bg-[#111827] rounded-3xl shadow-2xl flex flex-col h-[95vh] animate-in zoom-in-95 duration-300 overflow-hidden border border-slate-200 dark:border-slate-800">
        
        {/* HEADER */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#0B0F19]">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center border border-red-500/20">
              <ShieldAlert className="w-6 h-6 text-red-500" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
                Forensic Investigation Center
                <span className="px-3 py-1 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-bold font-mono border border-slate-300 dark:border-slate-700">
                  {shiftDNA}
                </span>
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                Deep Audit Mode for Shift #{shift.id} — Operated by {staffName} on {shift.date}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => window.print()} className="flex items-center gap-2 px-4 py-2 bg-slate-800 dark:bg-white text-white dark:text-slate-900 rounded-lg text-sm font-bold hover:bg-slate-700 dark:hover:bg-slate-100 transition-colors shadow-sm">
              <Download className="w-4 h-4" /> Export Forensic PDF
            </button>
            <button onClick={onClose} className="p-3 text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full transition-colors">
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* CONTENT */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50 dark:bg-[#0B0F19]">
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            
            {/* SCORECARD */}
            <div className="bg-white dark:bg-[#111827] rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
              <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-6">
                <Activity className="w-5 h-5 text-indigo-500" /> Executive Scorecard
              </h3>
              <div className="space-y-4">
                <ScoreBar label="Station Health Index" score={shiftHealth.overallSHI} color="bg-indigo-500" />
                <ScoreBar label="Cash Integrity" score={shiftHealth.cashIntegrity} color="bg-emerald-500" />
                <ScoreBar label="Recovery Efficiency" score={shiftHealth.recoveryEfficiency} color="bg-blue-500" />
                <ScoreBar label="Expense Control" score={shiftHealth.expenseControl} color="bg-orange-500" />
                <ScoreBar label="Inventory Integrity" score={shiftHealth.inventoryIntegrity} color="bg-purple-500" />
              </div>
            </div>

            {/* CASH RECONCILIATION */}
            <div className="bg-white dark:bg-[#111827] rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
              <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-6">
                <Lock className="w-5 h-5 text-emerald-500" /> Cash Reconciliation
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                  <span className="text-slate-500 dark:text-slate-400 font-medium text-sm">System Expected Cash</span>
                  <span className="text-slate-900 dark:text-white font-bold">{formatCurrency(shift.expectedCash || 0)}</span>
                </div>
                <div className="flex justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                  <span className="text-slate-500 dark:text-slate-400 font-medium text-sm">Operator Submitted Cash</span>
                  <span className="text-slate-900 dark:text-white font-bold">{formatCurrency(shift.submittedCash || 0)}</span>
                </div>
                
                {shift.shortage > 0 && (
                  <div className="flex justify-between p-3 bg-red-50 dark:bg-red-500/10 rounded-lg border border-red-200 dark:border-red-500/20">
                    <span className="text-red-600 dark:text-red-400 font-bold text-sm flex items-center gap-2"><AlertTriangle className="w-4 h-4"/> Shortage Detected</span>
                    <span className="text-red-600 dark:text-red-400 font-black">-{formatCurrency(shift.shortage)}</span>
                  </div>
                )}

                {shift.overage > 0 && (
                  <div className="flex justify-between p-3 bg-emerald-50 dark:bg-emerald-500/10 rounded-lg border border-emerald-200 dark:border-emerald-500/20">
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold text-sm">Overage Detected</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-black">+{formatCurrency(shift.overage)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* AUDIT VAULT LOG */}
            <div className="bg-white dark:bg-[#111827] rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm flex flex-col">
              <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-6">
                <Fingerprint className="w-5 h-5 text-slate-500" /> Audit Vault Status
              </h3>
              <div className="flex-1 flex flex-col justify-center items-center text-center p-4">
                <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mb-4">
                  <ShieldAlert className="w-8 h-8 text-emerald-500" />
                </div>
                <h4 className="text-lg font-bold text-emerald-600 dark:text-emerald-400 mb-2">Vault Secured</h4>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  This shift has been cryptographically locked. All sales, expenses, and dips are immutable.
                </p>
                <button className="mt-6 px-4 py-2 border border-slate-200 dark:border-slate-700 text-sm font-bold text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                  View Vault Reversals
                </button>
              </div>
            </div>

          </div>

          {/* CROSS REFERENCE GRID */}
          <div className="bg-white dark:bg-[#111827] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden mb-8">
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#0B0F19]">
              <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-orange-500" /> Fuel Movement Cross-Reference
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-100 dark:bg-slate-800/50 text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                    <th className="px-6 py-4">Nozzle / Pump</th>
                    <th className="px-6 py-4">Opening Reading</th>
                    <th className="px-6 py-4">Closing Reading</th>
                    <th className="px-6 py-4">Sold Liters</th>
                    <th className="px-6 py-4">Test Liters</th>
                    <th className="px-6 py-4">Rate Implemented</th>
                    <th className="px-6 py-4 text-right">System Revenue</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                  {nozzleSales.length === 0 ? (
                    <tr><td colSpan={7} className="px-6 py-8 text-center text-slate-500">No fuel sales recorded.</td></tr>
                  ) : (
                    nozzleSales.map((n, i) => (
                      <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                        <td className="px-6 py-4 font-bold text-sm text-slate-900 dark:text-white">{n.nozzleName}</td>
                        <td className="px-6 py-4 text-sm font-mono text-slate-600 dark:text-slate-300">{n.start.toLocaleString()}</td>
                        <td className="px-6 py-4 text-sm font-mono text-slate-600 dark:text-slate-300">{n.end.toLocaleString()}</td>
                        <td className="px-6 py-4 text-sm font-bold text-slate-900 dark:text-white">{n.liters.toLocaleString()} L</td>
                        <td className="px-6 py-4 text-sm text-slate-500">0 L</td>
                        <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">Rs. {n.rate}</td>
                        <td className="px-6 py-4 text-sm font-bold text-slate-900 dark:text-white text-right">{formatCurrency(n.total)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

function ScoreBar({ label, score, color }: { label: string, score: number, color: string }) {
  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="font-medium text-slate-700 dark:text-slate-300">{label}</span>
        <span className="font-bold text-slate-900 dark:text-white">{score}%</span>
      </div>
      <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
        <div className={`h-full ${color} rounded-full`} style={{ width: `${score}%` }}></div>
      </div>
    </div>
  );
}
