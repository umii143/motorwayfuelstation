/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * PartyLedgerModal.tsx
 * --------------------
 * Full-screen A-to-Z Ledger Modal for Customer or Supplier.
 * Opens as an overlay when a party row is clicked in Customers or Suppliers tabs.
 *
 * Features:
 *  ✅ Full chronological transaction history (debit / credit / recovery / payment)
 *  ✅ Running balance column after each entry
 *  ✅ Date range filter (start + end) with quick presets
 *  ✅ Summary totals bar at bottom (total debit, total credit, net balance)
 *  ✅ Print / CSV export
 *  ✅ Fully theme-aware (light / dark)
 *  ✅ Smooth slide-up animation
 */

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Printer,
  Download,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  TrendingDown,
  TrendingUp,
  FileText,
  Phone,
  Hash,
  Filter,
  ChevronRight,
} from 'lucide-react';
import { GlobalSettings } from '../../types';
import { formatCurrency } from '../../lib/currency';

// ==========================================
// LEDGER ENTRY — shared shape
// ==========================================
export interface LedgerEntry {
  id: string;
  date: string;
  time?: string;
  description: string;
  /** Debit = money owed TO US (sale on credit) or money WE OWE to supplier (invoice) */
  debit: number;
  /** Credit = money received FROM party (recovery) or money paid TO supplier (payment) */
  credit: number;
  /** Computed running balance */
  balance: number;
  tag?: string; // e.g. 'Credit Sale', 'Recovery', 'Payment', 'Invoice', 'Opening Balance'
}

// ==========================================
// PARTY INFO
// ==========================================
export interface PartyInfo {
  id: string;
  name: string;
  contact: string;
  address?: string;
  accountNo?: string;
  creditLimit?: number;
  balance: number;
  type: 'customer' | 'supplier';
}

// ==========================================
// PROPS
// ==========================================
interface PartyLedgerModalProps {
  isOpen: boolean;
  onClose: () => void;
  party: PartyInfo | null;
  entries: LedgerEntry[];
  settings: GlobalSettings;
  /** Label for debit column */
  debitLabel?: string;
  /** Label for credit column */
  creditLabel?: string;
  /** Header accent colour class */
  accentColor?: 'orange' | 'violet' | 'blue' | 'emerald';
}

// Preset date ranges
const PRESETS = [
  { id: 'all',     label: 'All Time',    days: 0 },
  { id: 'week',    label: 'This Week',   days: 7 },
  { id: 'month',   label: 'This Month',  days: 30 },
  { id: '3month',  label: '3 Months',    days: 90 },
  { id: 'year',    label: 'This Year',   days: 365 },
];

export default function PartyLedgerModal({
  isOpen,
  onClose,
  party,
  entries,
  settings,
  debitLabel = 'Debit (Dr)',
  creditLabel = 'Credit (Cr)',
  accentColor = 'orange',
}: PartyLedgerModalProps) {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [activePreset, setActivePreset] = useState('all');
  const [searchText, setSearchText] = useState('');

  const accentClasses = {
    orange:  { bg: 'bg-orange-600',  text: 'text-orange-600',  light: 'bg-orange-50',  border: 'border-orange-200' },
    violet:  { bg: 'bg-violet-600',  text: 'text-violet-600',  light: 'bg-violet-50',  border: 'border-violet-200' },
    blue:    { bg: 'bg-blue-600',    text: 'text-blue-600',    light: 'bg-blue-50',    border: 'border-blue-200' },
    emerald: { bg: 'bg-emerald-600', text: 'text-emerald-600', light: 'bg-emerald-50', border: 'border-emerald-200' },
  }[accentColor];

  // Apply preset
  const applyPreset = (presetId: string) => {
    setActivePreset(presetId);
    if (presetId === 'all') {
      setStartDate('');
      setEndDate('');
      return;
    }
    const preset = PRESETS.find(p => p.id === presetId);
    if (!preset) return;
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - preset.days);
    setEndDate(end.toISOString().slice(0, 10));
    setStartDate(start.toISOString().slice(0, 10));
  };

  // Filtered entries
  const filteredEntries = useMemo(() => {
    return entries.filter(entry => {
      if (startDate && entry.date < startDate) return false;
      if (endDate   && entry.date > endDate)   return false;
      if (searchText) {
        const q = searchText.toLowerCase();
        if (!entry.description.toLowerCase().includes(q) && !entry.date.includes(q) && !(entry.tag || '').toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [entries, startDate, endDate, searchText]);

  // Totals
  const totals = useMemo(() => {
    const totalDebit  = filteredEntries.reduce((s, e) => s + e.debit,  0);
    const totalCredit = filteredEntries.reduce((s, e) => s + e.credit, 0);
    const net = totalDebit - totalCredit;
    return { totalDebit, totalCredit, net };
  }, [filteredEntries]);

  // CSV Export
  const exportCSV = () => {
    if (!party) return;
    const headers = ['Date', 'Description', 'Tag', debitLabel, creditLabel, 'Running Balance'].join(',');
    const lines = [...filteredEntries].reverse().map(e =>
      [
        e.date,
        `"${e.description.replace(/"/g, '""')}"`,
        e.tag || '',
        e.debit > 0 ? e.debit.toFixed(2) : '',
        e.credit > 0 ? e.credit.toFixed(2) : '',
        e.balance.toFixed(2),
      ].join(',')
    );
    const csv = [headers, ...lines].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Ledger_${party.name.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0,10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // Print
  const handlePrint = () => {
    window.print();
  };

  if (!party) return null;

  const isPositiveBalance = party.balance >= 0;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="ledger-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4"
          onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
          <motion.div
            key="ledger-panel"
            initial={{ y: 60, opacity: 0, scale: 0.97 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 60, opacity: 0, scale: 0.97 }}
            transition={{ type: 'spring', damping: 28, stiffness: 380 }}
            className="relative w-full max-w-5xl max-h-[96vh] sm:max-h-[92vh] bg-[var(--bg-card)] rounded-t-2xl sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-[var(--border-main)]"
          >

            {/* ─── HEADER ─── */}
            <div className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-5 py-4 border-b border-[var(--border-main)] ${accentClasses.light} print:hidden`}>
              <div className="flex items-center gap-3 min-w-0">
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${accentClasses.bg} text-white`}>
                  <FileText className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <h2 className="font-sans text-base font-extrabold text-[var(--text-main)] truncate flex items-center gap-1.5">
                    <span>{party.name}</span>
                    <span className="text-[var(--text-muted)] font-normal text-xs">— Full Account Ledger</span>
                  </h2>
                  <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-0.5 text-[11px] font-sans text-[var(--text-muted)] font-semibold">
                    {party.contact && <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{party.contact}</span>}
                    {party.accountNo && <span className="flex items-center gap-1"><Hash className="h-3 w-3" />{party.accountNo}</span>}
                    {party.address && <span>📍 {party.address}</span>}
                  </div>
                </div>
              </div>

              {/* Balance badge */}
              <div className={`shrink-0 rounded-xl px-4 py-2 border text-center ${isPositiveBalance ? 'bg-rose-50 border-rose-200' : 'bg-emerald-50 border-emerald-200'}`}>
                <span className="font-sans text-[9px] font-bold uppercase tracking-widest block text-[var(--text-muted)]">
                  {party.type === 'customer' ? 'Outstanding Balance' : 'Payable Balance'}
                </span>
                <strong className={`font-mono text-lg font-extrabold block ${isPositiveBalance ? 'text-rose-600' : 'text-emerald-600'}`}>
                  {formatCurrency(party.balance, settings)}
                </strong>
              </div>

              <button
                onClick={onClose}
                className="absolute top-4 right-4 flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--bg-secondary)] text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--border-main)] transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* ─── FILTERS ROW ─── */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 px-5 py-3 border-b border-[var(--border-main)] bg-[var(--bg-secondary)] print:hidden">
              {/* Quick Presets */}
              <div className="flex gap-1 flex-wrap">
                {PRESETS.map(preset => (
                  <button
                    key={preset.id}
                    onClick={() => applyPreset(preset.id)}
                    className={`px-2.5 py-1 rounded-md font-sans text-[10px] font-bold transition-all cursor-pointer ${
                      activePreset === preset.id
                        ? `${accentClasses.bg} text-white`
                        : 'bg-[var(--bg-card)] text-[var(--text-muted)] hover:text-[var(--text-main)] border border-[var(--border-main)]'
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>

              {/* Date range */}
              <div className="flex items-center gap-2 text-xs font-sans text-[var(--text-muted)] flex-wrap">
                <Calendar className="h-3.5 w-3.5 shrink-0" />
                <input
                  type="date" value={startDate}
                  onChange={e => { setStartDate(e.target.value); setActivePreset(''); }}
                  className="rounded-lg border border-[var(--border-main)] bg-[var(--bg-card)] px-2 py-1 text-[11px] font-mono text-[var(--text-main)] outline-none focus:border-orange-500"
                />
                <ChevronRight className="h-3.5 w-3.5" />
                <input
                  type="date" value={endDate}
                  onChange={e => { setEndDate(e.target.value); setActivePreset(''); }}
                  className="rounded-lg border border-[var(--border-main)] bg-[var(--bg-card)] px-2 py-1 text-[11px] font-mono text-[var(--text-main)] outline-none focus:border-orange-500"
                />
              </div>

              {/* Search */}
              <div className="relative flex-1 min-w-full max-w-[140px]">
                <Filter className="absolute left-2.5 top-2 h-3.5 w-3.5 text-[var(--text-muted)]" />
                <input
                  type="text"
                  value={searchText}
                  onChange={e => setSearchText(e.target.value)}
                  placeholder="Search description..."
                  className="w-full rounded-lg border border-[var(--border-main)] bg-[var(--bg-card)] pl-7 pr-3 py-1.5 text-[11px] font-sans text-[var(--text-main)] outline-none focus:border-orange-500"
                />
              </div>

              {/* Actions */}
              <div className="flex gap-2 shrink-0">
                <button
                  onClick={exportCSV}
                  className="flex items-center gap-1 rounded-lg border border-[var(--border-main)] bg-[var(--bg-card)] px-3 py-1.5 font-sans text-[11px] font-bold text-[var(--text-main)] hover:opacity-80 cursor-pointer transition-all"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>CSV</span>
                </button>
                <button
                  onClick={handlePrint}
                  className={`flex items-center gap-1 rounded-lg ${accentClasses.bg} px-3 py-1.5 font-sans text-[11px] font-bold text-white hover:opacity-90 cursor-pointer transition-all`}
                >
                  <Printer className="h-3.5 w-3.5" />
                  <span>Print</span>
                </button>
              </div>
            </div>

            {/* ─── TRANSACTION TABLE ─── */}
            <div className="flex-1 overflow-auto">
              <table className="w-full border-collapse text-left font-sans text-xs min-w-full max-w-[640px]">
                <thead className="sticky top-0 z-10">
                  <tr className="bg-[var(--bg-secondary)] border-b border-[var(--border-main)] text-[var(--text-muted)] font-bold select-none">
                    <th className="py-3 px-4 w-full max-w-[100px]">Date</th>
                    <th className="py-3 px-4">Description</th>
                    <th className="py-3 px-2 w-full max-w-[80px]">Type</th>
                    <th className="py-3 px-4 text-right w-full max-w-[120px]">{debitLabel}</th>
                    <th className="py-3 px-4 text-right w-full max-w-[120px]">{creditLabel}</th>
                    <th className="py-3 px-4 text-right w-full max-w-[130px]">Balance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-main)]">
                  {filteredEntries.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-20 text-center text-[var(--text-muted)] font-sans italic">
                        No transactions found for selected date range.
                      </td>
                    </tr>
                  ) : (
                    filteredEntries.map((entry, idx) => {
                      const isDebit  = entry.debit  > 0;
                      const isCredit = entry.credit > 0;
                      const balancePositive = entry.balance >= 0;

                      return (
                        <motion.tr
                          key={entry.id}
                          initial={{ opacity: 0, x: -6 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: Math.min(idx * 0.02, 0.25) }}
                          className={`hover:bg-[var(--bg-secondary)]/70 transition-colors ${idx % 2 === 0 ? 'bg-[var(--bg-card)]' : 'bg-[var(--bg-secondary)]/20'}`}
                        >
                          {/* Date */}
                          <td className="py-3 px-4">
                            <span className="font-mono text-[10.5px] text-[var(--text-muted)] font-semibold block">{entry.date}</span>
                            {entry.time && <span className="font-mono text-[9px] text-[var(--text-muted)]/60 block">{entry.time}</span>}
                          </td>

                          {/* Description */}
                          <td className="py-3 px-4">
                            <span className="font-sans text-[11.5px] font-semibold text-[var(--text-main)] leading-snug">{entry.description}</span>
                          </td>

                          {/* Tag */}
                          <td className="py-3 px-2">
                            {entry.tag && (
                              <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-bold ${
                                isDebit
                                  ? 'bg-rose-50 text-rose-700'
                                  : 'bg-emerald-50 text-emerald-700'
                              }`}>
                                {isDebit ? <ArrowUpRight className="h-2.5 w-2.5" /> : <ArrowDownRight className="h-2.5 w-2.5" />}
                                {entry.tag}
                              </span>
                            )}
                          </td>

                          {/* Debit */}
                          <td className="py-3 px-4 text-right">
                            {isDebit ? (
                              <span className="font-mono text-[12px] font-bold text-rose-600">
                                {formatCurrency(entry.debit, settings)}
                              </span>
                            ) : (
                              <span className="text-[var(--text-muted)]/30 font-mono text-[10px]">—</span>
                            )}
                          </td>

                          {/* Credit */}
                          <td className="py-3 px-4 text-right">
                            {isCredit ? (
                              <span className="font-mono text-[12px] font-bold text-emerald-600">
                                {formatCurrency(entry.credit, settings)}
                              </span>
                            ) : (
                              <span className="text-[var(--text-muted)]/30 font-mono text-[10px]">—</span>
                            )}
                          </td>

                          {/* Running Balance */}
                          <td className="py-3 px-4 text-right">
                            <span className={`font-mono text-[12px] font-extrabold ${balancePositive ? 'text-rose-500' : 'text-emerald-600'}`}>
                              {formatCurrency(Math.abs(entry.balance), settings)}
                            </span>
                            <span className={`block text-[8.5px] font-bold uppercase tracking-wider mt-0.5 ${balancePositive ? 'text-rose-400' : 'text-emerald-400'}`}>
                              {balancePositive ? 'Dr' : 'Cr'}
                            </span>
                          </td>
                        </motion.tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* ─── TOTALS FOOTER ─── */}
            <div className="border-t-2 border-[var(--border-main)] bg-[var(--bg-secondary)] px-5 py-4 print:fixed print:bottom-0 print:w-full">
              <div className="grid grid-cols-1 sm:grid-cols-2 sm:grid-cols-4 gap-4 text-center">

                <div className="rounded-xl bg-[var(--bg-card)] border border-[var(--border-main)] p-3">
                  <span className="font-sans text-[9px] font-bold uppercase tracking-widest text-[var(--text-muted)] block">Transactions</span>
                  <strong className="font-mono text-lg font-black text-[var(--text-main)] block mt-0.5">{filteredEntries.length}</strong>
                </div>

                <div className="rounded-xl bg-rose-50 border border-rose-100 p-3">
                  <span className="font-sans text-[9px] font-bold uppercase tracking-widest text-rose-600 block flex items-center justify-center gap-1">
                    <TrendingUp className="h-3 w-3" /> Total {debitLabel}
                  </span>
                  <strong className="font-mono text-base font-black text-rose-700 block mt-0.5">{formatCurrency(totals.totalDebit, settings)}</strong>
                </div>

                <div className="rounded-xl bg-emerald-50 border border-emerald-100 p-3">
                  <span className="font-sans text-[9px] font-bold uppercase tracking-widest text-emerald-600 block flex items-center justify-center gap-1">
                    <TrendingDown className="h-3 w-3" /> Total {creditLabel}
                  </span>
                  <strong className="font-mono text-base font-black text-emerald-700 block mt-0.5">{formatCurrency(totals.totalCredit, settings)}</strong>
                </div>

                <div className={`rounded-xl p-3 border ${totals.net >= 0 ? 'bg-rose-50 border-rose-100' : 'bg-emerald-50 border-emerald-100'}`}>
                  <span className="font-sans text-[9px] font-bold uppercase tracking-widest text-[var(--text-muted)] block">
                    Net {party.type === 'customer' ? 'Receivable' : 'Payable'}
                  </span>
                  <strong className={`font-mono text-base font-black block mt-0.5 ${totals.net >= 0 ? 'text-rose-700' : 'text-emerald-700'}`}>
                    {formatCurrency(Math.abs(totals.net), settings)}
                    <span className="text-[10px] ml-1 font-bold">{totals.net >= 0 ? 'Dr' : 'Cr'}</span>
                  </strong>
                </div>
              </div>
            </div>

          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
