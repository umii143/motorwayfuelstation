/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from 'react';
import { ResponsiveTable, TableColumn } from '../shared/ResponsiveTable';
import {
  BookOpen,
  Search,
  Scale,
  Users,
  Truck,
  TrendingUp,
  TrendingDown,
  FileSpreadsheet
} from 'lucide-react';
import { BottomSheet } from '../shared/BottomSheet';
import { Customer, Supplier, Shift, Product, GlobalSettings, LubePosSale, JournalEntry } from '../../types';
import { useFinancialStore } from '../../stores/useFinancialStore';
import { useStaffStore } from '../../stores/useStaffStore';
import { useStationStore } from '../../stores/useStationStore';
import { DataConfidenceBadge } from '../ui/DataConfidenceBadge';
import { isLubeBusinessStation } from '../../lib/businessScope';


interface LedgerProps {
  settings: GlobalSettings;
  customers: Customer[];
  suppliers: Supplier[];
  shifts: Shift[];
  products: Product[];
  lubePosSales: LubePosSale[];
}

export default function Ledger({
  settings,
  customers,
  suppliers,
  shifts,
  products,
  lubePosSales
}: LedgerProps) {
  const isUrdu = settings.language === 'ur';
  const t = (en: string, ur: string) => (isUrdu ? ur : en);

  // States
  const [searchQuery, setSearchQuery] = useState('');
  const [partyTypeFilter, setPartyTypeFilter] = useState<'all' | 'receivables' | 'payables'>('all');
  const [selectedParty, setSelectedParty] = useState<{ id: string; type: 'customer' | 'supplier' } | null>(null);
  const [isLedgerSheetOpen, setIsLedgerSheetOpen] = useState(false);
  const [timeFilter, setTimeFilter] = useState<'all' | 'weekly' | 'monthly' | 'yearly'>('all');

  // Time filter checking helper
  const isWithinTimeFilter = (dateStr: string) => {
    if (timeFilter === 'all') return true;
    const baseline = new Date('2026-06-01');
    const target = new Date(dateStr);
    if (isNaN(target.getTime())) return true;
    const diffDays = (baseline.getTime() - target.getTime()) / (1000 * 3600 * 24);
    if (timeFilter === 'weekly') return diffDays >= 0 && diffDays <= 7;
    if (timeFilter === 'monthly') return diffDays >= 0 && diffDays <= 30;
    if (timeFilter === 'yearly') return diffDays >= 0 && diffDays <= 365;
    return true;
  };

  // ==========================================
  // UNIFIED ANALYTICS COMPILATION
  // ==========================================

  // Let's compute dynamic trade metrics representation
  const kpiStats = useMemo(() => {
    // 1. Receivables (sum of customer balances)
    const recTotal = customers.reduce((sum, c) => (c.balance > 0 ? sum + c.balance : sum), 0);

    // 2. Payables (sum of supplier balances)
    const payTotal = suppliers.reduce((sum, s) => sum + s.balance, 0);

    // 3. Net book balance
    const netBal = recTotal - payTotal;

    // 4. Trade transactions inside matches filter
    let txCount = 0;
    shifts.forEach(sh => {
      if (!isWithinTimeFilter(sh.date)) return;
      txCount += sh.debitEntries.length;
      txCount += sh.recoveryEntries.length;
      txCount += sh.supplierPayments.length;
    });

    return {
      recTotal,
      payTotal,
      netBal,
      txCount
    };
   
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customers, suppliers, shifts, timeFilter]);

  const receivablesTotal = kpiStats.recTotal;
  const payablesTotal = kpiStats.payTotal;
  const netBookBalance = kpiStats.netBal;

  // Combined Party Listings
  const unifiedParties = useMemo(() => {
    const list: Array<{
      id: string;
      name: string;
      urduName: string;
      contact: string;
      balance: number;
      type: 'customer' | 'supplier';
    }> = [];

    customers.forEach(c => {
      list.push({
        id: c.id,
        name: c.name,
        urduName: c.urduName,
        contact: c.contact,
        balance: c.balance, // (+ receivable)
        type: 'customer'
      });
    });

    suppliers.forEach(s => {
      list.push({
        id: s.id,
        name: s.name,
        urduName: s.urduName,
        contact: s.contact,
        balance: s.balance, // (+ we owe them)
        type: 'supplier'
      });
    });

    // Filtering
    return list.filter(p => {
      const matchesSearch = 
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        p.urduName.includes(searchQuery) ||
        p.contact.includes(searchQuery);

      if (!matchesSearch) return false;

      if (partyTypeFilter === 'receivables') return p.type === 'customer';
      if (partyTypeFilter === 'payables') return p.type === 'supplier';

      return true;
    });
  }, [customers, suppliers, searchQuery, partyTypeFilter]);

  const journalEntries = useFinancialStore((state) => state.journalEntries);
  const staff = useStaffStore((state) => state.staff);
  const activeStationId = useStationStore((state) => state.activeStationId);
  const activeBType = isLubeBusinessStation(activeStationId) ? 'lube' : 'fuel_station';

  // Bootstrapping auto-seeding for legacy data
  useEffect(() => {
    if (journalEntries.length === 0 && (shifts.length > 0 || lubePosSales.length > 0)) {
      const seeded: JournalEntry[] = [];
      
      shifts.forEach(sh => {
        if (sh.status === 'closed') {
          const dateStr = sh.date + 'T' + (sh.endTime || '16:00:00') + '.000Z';
          
          sh.debitEntries.forEach(d => {
            const pName = products.find(p => p.id === d.productId)?.name || 'Fuel';
            seeded.push({
              id: `jr_deb_${d.id}`,
              date: dateStr,
              partyId: d.customerId,
              partyType: 'customer',
              type: 'debit',
              amount: d.amount,
              description: `Credit Sale: ${pName} ${d.quantity}L @ Rs. ${d.rate} (Shift #${sh.id})`,
              referenceId: sh.id,
              stationId: activeStationId,
              businessType: activeBType,
              createdAt: Date.now(),
              updatedAt: Date.now()
            });
          });

          sh.recoveryEntries.forEach(r => {
            seeded.push({
              id: `jr_rec_${r.id}`,
              date: dateStr,
              partyId: r.customerId,
              partyType: 'customer',
              type: 'credit',
              amount: r.amount,
              description: `Payment Recovery via ${r.mode.toUpperCase()} (Shift #${sh.id})`,
              referenceId: sh.id,
              stationId: activeStationId,
              businessType: activeBType,
              createdAt: Date.now(),
              updatedAt: Date.now()
            });
          });

          sh.supplierPayments.forEach(sp => {
            seeded.push({
              id: `jr_supp_${sp.id}`,
              date: dateStr,
              partyId: sp.supplierId,
              partyType: 'supplier',
              type: 'debit',
              amount: sp.amount,
              description: `Supplier payment (${sp.mode.toUpperCase()}) (Shift #${sh.id})`,
              referenceId: sh.id,
              stationId: activeStationId,
              businessType: activeBType,
              createdAt: Date.now(),
              updatedAt: Date.now()
            });
          });

          sh.expenseEntries.forEach(exp => {
            seeded.push({
              id: `jr_exp_${exp.id}`,
              date: dateStr,
              partyType: 'expense',
              type: 'debit',
              amount: exp.amount,
              description: `Expense - ${exp.category}: ${exp.description} (Shift #${sh.id})`,
              referenceId: sh.id,
              stationId: activeStationId,
              businessType: activeBType,
              createdAt: Date.now(),
              updatedAt: Date.now()
            });
          });

          if (sh.shortage && sh.shortage > 0) {
            const staffObj = staff.find(s => s.id === sh.staffId);
            const sName = staffObj ? staffObj.name : 'Crew';
            seeded.push({
              id: `jr_short_${sh.id}`,
              date: dateStr,
              partyId: sh.staffId,
              partyType: 'staff',
              partyName: sName,
              type: 'debit',
              amount: sh.shortage,
              description: `Salary Advance via Shift Cash Shortage (Shift #${sh.id})`,
              referenceId: sh.id,
              stationId: activeStationId,
              businessType: activeBType,
              createdAt: Date.now(),
              updatedAt: Date.now()
            });
          }
        }
      });

      lubePosSales.forEach(sale => {
        const dateStr = sale.date + 'T' + (sale.time || '12:00:00') + '.000Z';
        if (sale.isRecovery) {
          if (sale.customerId) {
            seeded.push({
              id: `jr_rec_${sale.id}_cust`,
              date: dateStr,
              partyId: sale.customerId,
              partyType: 'customer',
              partyName: sale.customerName,
              type: 'credit',
              amount: sale.total,
              description: `Lube POS Recovery Payment (Inv: ${sale.invoiceNo})`,
              referenceId: sale.id,
              stationId: activeStationId,
              businessType: activeBType,
              createdAt: Date.now(),
              updatedAt: Date.now()
            });
          }
        } else if (sale.isReturn) {
          if (sale.paymentMode === 'credit' && sale.customerId) {
            seeded.push({
              id: `jr_ret_${sale.id}_cust`,
              date: dateStr,
              partyId: sale.customerId,
              partyType: 'customer',
              partyName: sale.customerName,
              type: 'credit',
              amount: sale.total,
              description: `Lube POS Return (Inv: ${sale.invoiceNo})`,
              referenceId: sale.id,
              stationId: activeStationId,
              businessType: activeBType,
              createdAt: Date.now(),
              updatedAt: Date.now()
            });
          }
        } else {
          if (sale.paymentMode === 'credit' && sale.customerId) {
            seeded.push({
              id: `jr_sale_${sale.id}_cust`,
              date: dateStr,
              partyId: sale.customerId,
              partyType: 'customer',
              partyName: sale.customerName,
              type: 'debit',
              amount: sale.total,
              description: `Lube POS Credit Sale (Inv: ${sale.invoiceNo})`,
              referenceId: sale.id,
              stationId: activeStationId,
              businessType: activeBType,
              createdAt: Date.now(),
              updatedAt: Date.now()
            });
          }
        }
      });

      if (seeded.length > 0) {
        useFinancialStore.getState().setJournalEntries(seeded);
      }
     
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [journalEntries, shifts, lubePosSales]);

  // Selected party full details
  const activePartyDetails = useMemo(() => {
    if (!selectedParty) return null;
    if (selectedParty.type === 'customer') {
      return customers.find(c => c.id === selectedParty.id) || null;
    } else {
      return suppliers.find(s => s.id === selectedParty.id) || null;
    }
  }, [selectedParty, customers, suppliers]);

  // Consolidated ledger logs for selected party
  const activePartyLedgerTimeline = useMemo(() => {
    if (!selectedParty || !activePartyDetails) return [];

    const partyJournals = journalEntries.filter(
      (j) => j.partyId === selectedParty.id && j.partyType === selectedParty.type
    );

    const entries = partyJournals.map((j) => ({
      id: j.id,
      date: j.date.substring(0, 10),
      description: j.description,
      debit: j.type === 'debit' ? j.amount : 0,
      credit: j.type === 'credit' ? j.amount : 0,
      balance: 0
    }));

    entries.sort((a, b) => a.date.localeCompare(b.date));

    let runningAmt = 0;
    const computed = entries.map(item => {
      if (selectedParty.type === 'customer') {
        runningAmt += item.debit - item.credit;
      } else {
        runningAmt += item.credit - item.debit;
      }
      return {
        ...item,
        balance: runningAmt
      };
    });

    return computed.reverse();
   
  }, [selectedParty, activePartyDetails, journalEntries]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ledgerColumns: TableColumn<any>[] = [
    {
      header: t('Date', 'تاریخ'),
      accessor: (log) => (
        <span className="font-mono text-[11px] text-slate-500">{log.date}</span>
      ),
      isSecondaryMobile: true
    },
    {
      header: t('Description', 'تفصیل'),
      accessor: (log) => (
        <span className="font-sans text-[11px] font-semibold text-slate-800 leading-tight block">
          {log.description}
        </span>
      ),
      isPrimaryMobile: true
    },
    {
      header: t('Debit Amount (+)', 'ڈیمانڈ بل (+)'),
      className: 'text-right',
      accessor: (log) => (
        log.debit > 0 
          ? <span className="font-mono text-xs font-bold text-red-500">Rs. {log.debit.toLocaleString()}</span> 
          : <span className="text-slate-300">—</span>
      )
    },
    {
      header: t('Credit Amount (–)', 'رقم ادائیگی (–)'),
      className: 'text-right',
      accessor: (log) => (
        log.credit > 0 
          ? <span className="font-mono text-xs font-bold text-emerald-500">Rs. {log.credit.toLocaleString()}</span> 
          : <span className="text-slate-300">—</span>
      )
    },
    {
      header: t('Balance', 'بقایا'),
      className: 'text-right',
      accessor: (log) => (
        <span className="font-mono text-xs font-bold text-slate-900">
          Rs. {log.balance.toLocaleString()}
        </span>
      )
    }
  ];




  return (
    <div className="space-y-6 pb-16 lg:pb-0">

      {/* HEADER ROW WITH INTEGRATED DYNAMIC TIME FILTER */}
      <div className="fp-header flex-col items-start gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-theme-main pb-3 mb-4">
        <div className="flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-orange-600" />
          <h1 className="text-lg font-black text-slate-800 dark:text-slate-100">
            {t('Consolidated Ledger', 'بنیادی یکجا کھاتہ')}
          </h1>
        </div>

        {/* TIME FILTER SELECTOR ROW */}
        <div className="fp-date-tabs">
          {(['all', 'weekly', 'monthly', 'yearly'] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => setTimeFilter(filter)}
              className={`fp-date-tab ${
                timeFilter === filter
                  ? 'fp-date-tab--active !text-orange-600 !border-orange-600 bg-orange-50/50 dark:bg-orange-500/10'
                  : ''
              }`}
            >
              {filter === 'all' && t('All-Time', 'کل وقت')}
              {filter === 'weekly' && t('Weekly', 'ہفتہ وار')}
              {filter === 'monthly' && t('Monthly', 'ماہانہ')}
              {filter === 'yearly' && t('Yearly', 'سالانہ')}
            </button>
          ))}
        </div>
      </div>

      {/* DYNAMIC KPI CARDS SECTION */}
      <div className="fp-kpi-grid-2x2 lg:grid-cols-4 lg:gap-4 lg:px-0">
        {/* AMBER CARD - NET LIQUIDITY */}
        <div className={`fp-kpi-compact ${netBookBalance >= 0 ? 'kpi-green' : 'kpi-red'} relative overflow-hidden`}>
          <p className="fp-kpi-compact__label">Net Position</p>
          <p className="fp-kpi-compact__value text-3xl">Rs. {netBookBalance.toLocaleString()}</p>
          <p className="fp-kpi-compact__sub text-slate-400">⚖️ Liquidity</p>
          <div className={`absolute top-4 right-4 flex h-12 w-12 items-center justify-center rounded-2xl ring-1 ring-inset shadow-inner ${netBookBalance >= 0 ? 'bg-emerald-500/15 text-emerald-500 ring-emerald-500/20' : 'bg-red-500/15 text-red-500 ring-red-500/20'}`}>
            <Scale className="h-6 w-6" strokeWidth={2.5} />
          </div>
          <DataConfidenceBadge confidence={100} />
        </div>

        {/* GREEN CARD - TOTAL RECEIVABLES */}
        <div className="fp-kpi-compact kpi-green relative overflow-hidden">
          <p className="fp-kpi-compact__label">Receivables</p>
          <p className="fp-kpi-compact__value text-3xl">Rs. {receivablesTotal.toLocaleString()}</p>
          <p className="fp-kpi-compact__sub text-slate-400">↗️ Due from Customers</p>
          <div className="absolute top-4 right-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-500 ring-1 ring-inset ring-emerald-500/20 shadow-inner">
            <TrendingUp className="h-6 w-6" strokeWidth={2.5} />
          </div>
          <DataConfidenceBadge confidence={100} />
        </div>

        {/* CRIMSON CARD - TOTAL PAYABLES */}
        <div className="fp-kpi-compact kpi-red relative overflow-hidden">
          <p className="fp-kpi-compact__label">Payables</p>
          <p className="fp-kpi-compact__value text-3xl">Rs. {payablesTotal.toLocaleString()}</p>
          <p className="fp-kpi-compact__sub text-slate-400">↘️ Owed to Suppliers</p>
          <div className="absolute top-4 right-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-red-500/15 text-red-500 ring-1 ring-inset ring-red-500/20 shadow-inner">
            <TrendingDown className="h-6 w-6" strokeWidth={2.5} />
          </div>
          <DataConfidenceBadge confidence={100} />
        </div>

        {/* BLUE CARD - TRANSACTION LOG INDEX */}
        <div className="fp-kpi-compact kpi-blue relative overflow-hidden">
          <p className="fp-kpi-compact__label">Transactions</p>
          <p className="fp-kpi-compact__value text-3xl">{kpiStats.txCount}</p>
          <p className="fp-kpi-compact__sub text-slate-400">👥 Shift Logs</p>
          <div className="absolute top-4 right-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500/15 text-blue-500 ring-1 ring-inset ring-blue-500/20 shadow-inner">
            <FileSpreadsheet className="h-6 w-6" strokeWidth={2.5} />
          </div>
          <DataConfidenceBadge confidence={100} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6 lg:grid-cols-3">
        
        {/* LEFT COLUMN: ACTIVE PARTIES DATABASE */}
        <div className="space-y-4">
          <div className="rounded-xl border border-theme-main bg-theme-card p-4 shadow-xs space-y-3.5">
            <div className="relative">
              <Search className="absolute top-2.5 left-3 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('Search party name...', 'کھاتہ دار کا نام تلاش کریں...')}
                className="w-full rounded-md border border-theme-main bg-theme-bg py-1.5 pl-8 pr-3 font-sans text-xs focus:bg-white focus:outline-hidden"
              />
            </div>

            {/* Filter buttons */}
            <div className="fp-date-tabs mt-2 w-full">
              {[
                { id: 'all', label: 'All', urdu: 'تمام' },
                { id: 'receivables', label: 'Dr (Customers)', urdu: 'صارفین' },
                { id: 'payables', label: 'Cr (Suppliers)', urdu: 'سپلائرز' }
               
              ].map(f => (
                <button
                  key={f.id}
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  onClick={() => setPartyTypeFilter(f.id as any)}
                  className={`fp-date-tab ${
                    partyTypeFilter === f.id
                      ? 'fp-date-tab--active !text-slate-800 dark:!text-slate-100 !border-slate-800 dark:!border-slate-500 bg-slate-200/50 dark:bg-slate-700/50'
                      : ''
                  }`}
                >
                  {t(f.label, f.urdu)}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2 max-h-[460px] overflow-y-auto">
            {unifiedParties.map(party => {
              const isCust = party.type === 'customer';
              const outstanding = party.balance;
              const isSelected = selectedParty?.id === party.id && selectedParty?.type === party.type;

              return (
                <button
                  key={`${party.type}_${party.id}`}
                  onClick={() => {
                    setSelectedParty({ id: party.id, type: party.type });
                    setIsLedgerSheetOpen(true);
                  }}
                  className={`relative w-full text-left kpi-card p-2 flex items-center justify-between cursor-pointer ${
                    isSelected
                      ? 'border-orange-500 bg-orange-50/20 dark:bg-orange-500/10'
                      : ''
                  }`}
                >
                  <div className={`absolute top-0 bottom-0 left-0 w-0.5 rounded-l ${isCust ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>

                  <div className="pl-2 truncate flex-1">
                    <div className="flex items-center gap-1.5 truncate">
                      {isCust ? <Users className="h-3 w-3 text-emerald-500 shrink-0" /> : <Truck className="h-3 w-3 text-rose-500 shrink-0" />}
                      <h4 className="font-sans text-xs font-bold text-slate-800 dark:text-slate-100 truncate">
                        {t(party.name, party.urduName)}
                      </h4>
                    </div>

                    <span className="font-mono text-[9px] text-slate-400 dark:text-slate-500 mt-0.5 block tracking-tight truncate">
                      📞 {party.contact}
                    </span>
                  </div>

                  <div className="text-right shrink-0 ml-2">
                    <span className={`font-mono text-xs font-bold block ${isCust ? 'text-emerald-600' : 'text-rose-600'}`}>
                      Rs. {outstanding.toLocaleString()}
                    </span>
                    <span className="font-mono text-[8px] text-slate-400 dark:text-slate-500 block mt-0.5 uppercase">
                      {isCust ? t('Receivable', 'واجب الوصول') : t('Payable', 'واجب الادا')}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* RIGHT COLUMN (2/3 WIDTH): PARTY HISTORY TIMELINE (DESKTOP) */}
        <div className="hidden lg:block lg:col-span-2">
          {selectedParty && activePartyDetails ? (
            <div className="bg-theme-card rounded-xl border border-theme-main p-4 shadow-sm space-y-4">
              
              <div className="flex flex-col gap-3 sm:flex-row items-center sm:justify-between border-b border-theme-main pb-3">
                <div className="flex gap-2.5 items-center">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-xl text-white ${selectedParty.type === 'customer' ? 'bg-emerald-500' : 'bg-rose-500'}`}>
                    {selectedParty.type === 'customer' ? <Users className="h-5 w-5" /> : <Truck className="h-5 w-5" />}
                  </div>
                  <div>
                    <h3 className="font-sans text-sm font-bold text-slate-900 dark:text-slate-100 leading-tight">
                      {t(activePartyDetails.name, activePartyDetails.urduName)}
                    </h3>
                    <p className="font-mono text-[9px] text-slate-400 dark:text-slate-500 mt-0.5 block">
                      Type: <span className="uppercase font-bold text-slate-500">{selectedParty.type}</span> | Contact: {activePartyDetails.contact}
                    </p>
                  </div>
                </div>

                <div className="rounded-lg bg-slate-50/50 dark:bg-slate-800/50 border border-theme-main px-3 py-1.5 text-right">
                  <span className="font-sans text-[8px] text-slate-400 font-bold uppercase block">
                    {selectedParty.type === 'customer' ? t('Owed to Station:', 'کسٹمر بقایا قرض:') : t('Owed by Station:', 'سپلائر بِل بقایا:')}
                  </span>
                  <strong className="font-mono text-sm font-bold text-slate-800 dark:text-slate-200 block mt-0.5">Rs. {activePartyDetails.balance.toLocaleString()}</strong>
                </div>
              </div>

              {/* TIMELINE LIST */}
              <div className="space-y-3">
                <h4 className="font-sans text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-theme-main pb-1 block">
                  {t('Chronological Ledger Transactions History', 'تاریخ برقی کاروباری لیجر')}
                </h4>

                <div className="overflow-x-auto rounded-lg border border-theme-main">
                  <div className="min-w-full max-w-[600px]">
                    <ResponsiveTable
                      data={activePartyLedgerTimeline}
                      columns={ledgerColumns}
                      keyExtractor={(_, idx) => idx.toString()}
                      emptyMessage={t('No registered transactions in finalized shifts.', 'سیشنز کے دوران تاحال کوئی انٹری درج نہیں کی گئی ہے۔')}
                    />
                  </div>
                </div>
              </div>

            </div>
          ) : (
            <div className="h-full rounded-xl border border-dashed border-slate-250 py-32 text-center text-slate-400 font-sans text-xs flex flex-col justify-center items-center gap-3">
              <BookOpen className="h-10 w-10 text-slate-300" />
              <span>{t('Select an outstanding customer or oil vendor on the left to inspect combined accounts.', 'بائیں پینل سے کسی گاہک یا سپلائر کا انتخاب کریں تاکہ مشترکہ کھاتہ تفاصیل ظاہر ہو سکیں')}</span>
            </div>
          )}
        </div>

        </div>


      {/* MOBILE BOTTOM SHEET FOR LEDGER DETAILS */}
      <BottomSheet 
        isOpen={isLedgerSheetOpen} 
        onClose={() => setIsLedgerSheetOpen(false)} 
        title={activePartyDetails ? t(activePartyDetails.name, activePartyDetails.urduName) : ''}
        snapPoints={['90vh']}
      >
        {selectedParty && activePartyDetails && (
          <div className="space-y-6">
            <div className="flex flex-col gap-4 items-center border-b border-slate-100 pb-4">
              <div className="rounded-lg bg-theme-bg border border-slate-100 px-4 py-3 text-center w-full">
                <span className="font-sans text-[10px] text-slate-400 font-bold uppercase block mb-1">
                  {selectedParty.type === 'customer' ? t('Owed to Station:', 'کسٹمر بقایا قرض:') : t('Owed by Station:', 'سپلائر بِل بقایا:')}
                </span>
                <strong className="font-mono text-2xl font-black text-slate-805 block">Rs. {activePartyDetails.balance.toLocaleString()}</strong>
              </div>
            </div>

            {/* TIMELINE LIST */}
            <div className="space-y-4">
              <h4 className="font-sans text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2 block">
                {t('Chronological Ledger Transactions History', 'تاریخ برقی کاروباری لیجر')}
              </h4>

              <div className="overflow-x-auto rounded-lg border border-theme-main">
                <div className="min-w-full max-w-[600px]">
                  <ResponsiveTable
                    data={activePartyLedgerTimeline}
                    columns={ledgerColumns}
                    keyExtractor={(_, idx) => idx.toString()}
                    emptyMessage={t('No registered transactions.', 'کوئی انٹری درج نہیں کی گئی ہے۔')}
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </BottomSheet>

    </div>
  );
}
