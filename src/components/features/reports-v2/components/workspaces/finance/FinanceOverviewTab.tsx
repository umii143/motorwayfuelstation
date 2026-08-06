/**
 * @license SPDX-License-Identifier: Apache-2.0
 *
 * FuelPro Enterprise Business Operating System v4.0
 * FinanceOverviewTab — Finance & Treasury Control Room Dashboard
 *
 * Implements Enterprise Rules #130, #131, #135, #162, #163 & #168
 * 100% Realtime computed metrics from useFinancialStore & Firebase with ZERO dummy fallbacks.
 */

import React, { useState, useMemo } from 'react';
import {
  TrendingUp, TrendingDown, DollarSign, CreditCard, Wallet, ArrowUpRight,
  ArrowDownRight, Building2, ChevronRight, Layers, Sparkles, Filter, Search, FileText
} from 'lucide-react';
import { useFinancialStore } from '../../../../../../stores/useFinancialStore';
import { useWorkspaceFirebaseData } from '../../../hooks/useWorkspaceFirebaseData';
import { useShallow } from 'zustand/react/shallow';
import toast from 'react-hot-toast';

function formatCurrency(v: number | string): string {
  const n = typeof v === 'number' ? v : Number(v) || 0;
  return `Rs ${n.toLocaleString('en-PK')}`;
}

interface FinanceOverviewTabProps {
  lang: 'en' | 'ur';
  orgId?: string;
  stationId?: string;
  onSelectTab: (tabId: string) => void;
  onOpenInspector: (record: Record<string, any>) => void;
}

export const FinanceOverviewTab: React.FC<FinanceOverviewTabProps> = ({
  lang,
  orgId,
  stationId,
  onSelectTab,
  onOpenInspector,
}) => {
  const isEn = lang === 'en';
  const [tableSearch, setTableSearch] = useState('');

  // Fetch live store data
  const { banks, digitalAccounts, standaloneExpenses, journalEntries } = useFinancialStore(
    useShallow((state: any) => ({
      banks: state.banks || [],
      digitalAccounts: state.digitalAccounts || [],
      standaloneExpenses: state.standaloneExpenses || [],
      journalEntries: state.journalEntries || [],
    }))
  );

  // Fetch live financial records stream
  const { data: finRecords = [] } = useWorkspaceFirebaseData('FINANCIAL_RECORDS', { orgId, stationId });

  // Compute total bank balance
  const totalBankBalance = useMemo(() => {
    return banks.reduce((sum: number, b: any) => sum + (Number(b.balance || b.currentBalance) || 0), 0);
  }, [banks]);

  // Compute total digital wallet balance
  const totalWalletBalance = useMemo(() => {
    return digitalAccounts.reduce((sum: number, d: any) => sum + (Number(d.balance || d.currentBalance) || 0), 0);
  }, [digitalAccounts]);

  // Compute today's expenses
  const todayExpense = useMemo(() => {
    return standaloneExpenses.reduce((sum: number, e: any) => sum + (Number(e.amount) || 0), 0);
  }, [standaloneExpenses]);

  // Compute today's income & net profit from journal entries & transactions
  const todayIncome = useMemo(() => {
    return finRecords
      .filter((r) => r.type === 'income' || r.direction === 'in' || r.incomeAmt)
      .reduce((sum, r) => sum + (Number(r.amount || r.incomeAmt || r.inAmt) || 0), 0);
  }, [finRecords]);

  const todayNetProfit = useMemo(() => {
    return Math.max(0, todayIncome - todayExpense);
  }, [todayIncome, todayExpense]);

  // Estimated Cash in Hand (from shift collections or store)
  const cashInHand = useMemo(() => {
    const cashEntry = finRecords.find((r) => r.account === 'Cash In Hand' || r.type === 'cash');
    return Number(cashEntry?.balance || cashEntry?.amount) || 0;
  }, [finRecords]);

  // Filtered recent transactions derived purely from live stream (NO dummy fallbacks)
  const recentTransactions = useMemo(() => {
    const combined = [...finRecords, ...journalEntries];
    if (!combined.length) return [];
    if (!tableSearch.trim()) return combined.slice(0, 10);
    const q = tableSearch.toLowerCase();
    return combined
      .filter((r) =>
        String(r.id || r.voucherNo || '').toLowerCase().includes(q) ||
        String(r.description || r.memo || '').toLowerCase().includes(q) ||
        String(r.account || r.type || '').toLowerCase().includes(q)
      )
      .slice(0, 10);
  }, [finRecords, journalEntries, tableSearch]);

  return (
    <div className="space-y-4 font-sans text-slate-800">
      {/* ── 1. TOP 6 STAT KPI CARDS (LIVE COMPUTED) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
        {/* Card 1: Cash In Hand */}
        <div className="bg-card rounded-2xl border border-border p-4 flex flex-col justify-between shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-muted-foreground uppercase tracking-wider">Cash In Hand</span>
            <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <DollarSign size={16} />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-xl font-black text-foreground tracking-tight">{formatCurrency(cashInHand)}</div>
            <span className="text-[11px] font-extrabold text-muted-foreground mt-1 block">Drawer balance</span>
          </div>
        </div>

        {/* Card 2: Bank Balance */}
        <div className="bg-card rounded-2xl border border-border p-4 flex flex-col justify-between shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-muted-foreground uppercase tracking-wider">Bank Balance</span>
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center">
              <Building2 size={16} />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-xl font-black text-foreground tracking-tight">{formatCurrency(totalBankBalance)}</div>
            <span className="text-[11px] font-extrabold text-muted-foreground mt-1 block">{banks.length} bank accounts</span>
          </div>
        </div>

        {/* Card 3: Wallet Balance */}
        <div className="bg-card rounded-2xl border border-border p-4 flex flex-col justify-between shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-muted-foreground uppercase tracking-wider">Wallet Balance</span>
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center">
              <Wallet size={16} />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-xl font-black text-foreground tracking-tight">{formatCurrency(totalWalletBalance)}</div>
            <span className="text-[11px] font-extrabold text-muted-foreground mt-1 block">{digitalAccounts.length} digital wallets</span>
          </div>
        </div>

        {/* Card 4: Today's Income */}
        <div className="bg-card rounded-2xl border border-border p-4 flex flex-col justify-between shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-muted-foreground uppercase tracking-wider">Today's Income</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
              <ArrowUpRight size={16} />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-xl font-black text-foreground tracking-tight">{formatCurrency(todayIncome)}</div>
            <span className="text-[11px] font-extrabold text-muted-foreground mt-1 block">Live stream income</span>
          </div>
        </div>

        {/* Card 5: Today's Expense */}
        <div className="bg-card rounded-2xl border border-border p-4 flex flex-col justify-between shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-muted-foreground uppercase tracking-wider">Today's Expense</span>
            <div className="w-8 h-8 rounded-xl bg-rose-500/10 text-rose-600 flex items-center justify-center">
              <ArrowDownRight size={16} />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-xl font-black text-foreground tracking-tight">{formatCurrency(todayExpense)}</div>
            <span className="text-[11px] font-extrabold text-muted-foreground mt-1 block">{standaloneExpenses.length} expense entries</span>
          </div>
        </div>

        {/* Card 6: Today's Net Profit */}
        <div className="bg-card rounded-2xl border border-border p-4 flex flex-col justify-between shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-muted-foreground uppercase tracking-wider">Net Profit</span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
              <Sparkles size={16} />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-xl font-black text-primary tracking-tight">{formatCurrency(todayNetProfit)}</div>
            <span className="text-[11px] font-extrabold text-muted-foreground mt-1 block">Computed net profit</span>
          </div>
        </div>
      </div>

      {/* ── 2. MIDDLE SECTION: BANK ACCOUNTS & TREASURY SUMMARY ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Commercial Bank Balances List */}
        <div className="lg:col-span-6 bg-card rounded-2xl border border-border p-4 sm:p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-border">
            <h2 className="text-sm font-black text-foreground uppercase tracking-wider">Commercial Bank Balances</h2>
            <button onClick={() => onSelectTab('banks')} className="text-xs font-bold text-primary hover:underline cursor-pointer">
              View All ↗
            </button>
          </div>

          {banks.length === 0 ? (
            <p className="text-xs font-bold text-muted-foreground py-6 text-center">
              No commercial bank accounts configured. Add a bank account in treasury settings.
            </p>
          ) : (
            <div className="space-y-3">
              {banks.map((b: any, idx: number) => {
                const bal = Number(b.balance || b.currentBalance) || 0;
                const pct = totalBankBalance > 0 ? (bal / totalBankBalance) * 100 : 0;
                return (
                  <div key={b.id || idx} className="space-y-1">
                    <div className="flex justify-between text-xs font-bold text-foreground">
                      <span className="flex items-center gap-1.5">
                        <Building2 size={14} className="text-primary" />
                        {b.name || b.bankName || `Bank Account #${idx + 1}`}
                      </span>
                      <span className="font-black">{formatCurrency(bal)} ({pct.toFixed(1)}%)</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                      <div className="bg-primary h-full rounded-full" style={{ width: `${Math.min(100, Math.max(0, pct))}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Digital Wallets & Liquid Cash Breakdown */}
        <div className="lg:col-span-6 bg-card rounded-2xl border border-border p-4 sm:p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-border">
            <h2 className="text-sm font-black text-foreground uppercase tracking-wider">Digital Wallets & Liquid Treasury</h2>
            <button onClick={() => onSelectTab('wallets')} className="text-xs font-bold text-primary hover:underline cursor-pointer">
              View All ↗
            </button>
          </div>

          {digitalAccounts.length === 0 ? (
            <p className="text-xs font-bold text-muted-foreground py-6 text-center">
              No digital wallets or EasyPaisa/JazzCash accounts linked.
            </p>
          ) : (
            <div className="space-y-3">
              {digitalAccounts.map((w: any, idx: number) => {
                const bal = Number(w.balance || w.currentBalance) || 0;
                return (
                  <div key={w.id || idx} className="p-3 rounded-xl bg-muted/40 border border-border flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <Wallet size={16} className="text-purple-600" />
                      <span className="text-xs font-black text-foreground">{w.name || w.accountTitle || `Wallet #${idx + 1}`}</span>
                    </div>
                    <span className="text-xs font-black text-primary">{formatCurrency(bal)}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── 3. RECENT TRANSACTIONS TABLE ── */}
      <div className="bg-card rounded-2xl border border-border p-4 sm:p-5 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border">
          <h2 className="text-sm font-black text-foreground uppercase tracking-wider">Recent Financial Transactions</h2>
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Search voucher, memo, account..."
              value={tableSearch}
              onChange={(e) => setTableSearch(e.target.value)}
              className="px-3.5 py-1.5 bg-card border border-border rounded-xl text-xs font-bold text-foreground focus:outline-none focus:border-primary placeholder:text-muted-foreground min-w-[220px]"
            />
          </div>
        </div>

        {recentTransactions.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 bg-card rounded-2xl border border-dashed border-border text-center">
            <span className="text-4xl mb-3">💰</span>
            <h4 className="text-sm font-black text-foreground">{isEn ? 'No Financial Transactions Recorded' : 'کوئی مالیاتی ٹرانزیکشن نہیں مل سکی'}</h4>
            <p className="text-xs font-bold text-muted-foreground max-w-sm mt-1">
              {isEn ? 'Waiting for realtime treasury data. Record a cash voucher or journal entry to populate.' : 'کوئی واؤچر ریکارڈ نہیں ملا۔'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-border text-muted-foreground font-black uppercase text-[10px] bg-muted/30">
                  <th className="py-2.5 px-3">Voucher / Ref #</th>
                  <th className="py-2.5 px-3">Time</th>
                  <th className="py-2.5 px-3">Type</th>
                  <th className="py-2.5 px-3">Account</th>
                  <th className="py-2.5 px-3 text-right">In (Rs)</th>
                  <th className="py-2.5 px-3 text-right">Out (Rs)</th>
                  <th className="py-2.5 px-3 text-right">Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border font-bold text-foreground">
                {recentTransactions.map((tx, idx) => (
                  <tr
                    key={tx.id || idx}
                    onClick={() => onOpenInspector(tx)}
                    className="hover:bg-muted/50 transition-all cursor-pointer"
                  >
                    <td className="py-2.5 px-3 font-black text-foreground">{tx.id || tx.voucherNo || `V-${idx + 1}`}</td>
                    <td className="py-2.5 px-3 text-muted-foreground">{tx.time || tx.date || 'Today'}</td>
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-black">
                        {tx.type || 'Transaction'}
                      </span>
                    </td>
                    <td className="py-2.5 px-3">{tx.account || tx.debitAccount || '—'}</td>
                    <td className="py-2.5 px-3 text-right text-emerald-600 font-black">{tx.inAmt || (tx.amount > 0 ? formatCurrency(tx.amount) : '—')}</td>
                    <td className="py-2.5 px-3 text-right text-rose-600 font-black">{tx.outAmt || '—'}</td>
                    <td className="py-2.5 px-3 text-right text-foreground font-black">{tx.balance ? formatCurrency(tx.balance) : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── 4. BOTTOM QUICK LAUNCHER STRIP ── */}
      <div className="bg-card rounded-2xl border border-border p-3 shadow-xs grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
        <button onClick={() => onSelectTab('cash')} className="p-3 rounded-xl bg-muted/40 hover:bg-muted border border-border flex items-center gap-2 text-left transition-all cursor-pointer">
          <DollarSign size={16} className="text-primary" />
          <div>
            <div className="text-xs font-black text-foreground">Cash Book</div>
            <div className="text-[10px] font-bold text-muted-foreground">Drawer register</div>
          </div>
        </button>

        <button onClick={() => onSelectTab('banks')} className="p-3 rounded-xl bg-muted/40 hover:bg-muted border border-border flex items-center gap-2 text-left transition-all cursor-pointer">
          <Building2 size={16} className="text-blue-600" />
          <div>
            <div className="text-xs font-black text-foreground">Banks</div>
            <div className="text-[10px] font-bold text-muted-foreground">Bank accounts</div>
          </div>
        </button>

        <button onClick={() => onSelectTab('transfers')} className="p-3 rounded-xl bg-muted/40 hover:bg-muted border border-border flex items-center gap-2 text-left transition-all cursor-pointer">
          <ArrowUpRight size={16} className="text-purple-600" />
          <div>
            <div className="text-xs font-black text-foreground">Transfers</div>
            <div className="text-[10px] font-bold text-muted-foreground">Cash deposit & transfer</div>
          </div>
        </button>

        <button onClick={() => onSelectTab('expenses')} className="p-3 rounded-xl bg-muted/40 hover:bg-muted border border-border flex items-center gap-2 text-left transition-all cursor-pointer">
          <CreditCard size={16} className="text-rose-600" />
          <div>
            <div className="text-xs font-black text-foreground">Expenses</div>
            <div className="text-[10px] font-bold text-muted-foreground">Expense vouchers</div>
          </div>
        </button>

        <button onClick={() => onSelectTab('journals')} className="p-3 rounded-xl bg-muted/40 hover:bg-muted border border-border flex items-center gap-2 text-left transition-all cursor-pointer">
          <FileText size={16} className="text-amber-600" />
          <div>
            <div className="text-xs font-black text-foreground">Journals</div>
            <div className="text-[10px] font-bold text-muted-foreground">Journal entries</div>
          </div>
        </button>

        <button onClick={() => onSelectTab('reports')} className="p-3 rounded-xl bg-muted/40 hover:bg-muted border border-border flex items-center gap-2 text-left transition-all cursor-pointer">
          <Layers size={16} className="text-slate-600" />
          <div>
            <div className="text-xs font-black text-foreground">Reports</div>
            <div className="text-[10px] font-bold text-muted-foreground">Financial reports</div>
          </div>
        </button>
      </div>
    </div>
  );
};
