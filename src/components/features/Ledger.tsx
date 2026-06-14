/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from 'react';
import { FixedSizeList as List } from 'react-window';
import {
  BookOpen,
  ArrowUpRight,
  ArrowDownRight,
  Search,
  Scale,
  Users,
  Truck,
  DollarSign,
  ChevronRight,
  CheckCircle,
  TrendingUp,
  FileSpreadsheet
} from 'lucide-react';
import { Customer, Supplier, Shift, Product, GlobalSettings, LubePosSale, JournalEntry } from '../../types';
import { useFinancialStore } from '../../stores/useFinancialStore';
import { useStaffStore } from '../../stores/useStaffStore';
import { useStationStore } from '../../stores/useStationStore';


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
  const activeBType = activeStationId === 'st_lube' ? 'lube' : 'fuel_station';

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

  const RenderRow = ({ index, style }: { index: number; style: React.CSSProperties }) => {
    const log = activePartyLedgerTimeline[index];
    return (
      <div
        style={{
          ...style,
          display: 'flex',
          alignItems: 'center',
          borderBottom: '1px solid #f1f5f9',
          fontSize: '11px',
          color: '#334155'
        }}
        className="hover:bg-slate-50/70"
      >
        <div style={{ width: '15%', padding: '8px 12px', fontFamily: 'monospace', color: '#94a3b8' }}>
          {log.date}
        </div>
        <div style={{ width: '45%', padding: '8px 12px', fontWeight: 600, color: '#1e293b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {log.description}
        </div>
        <div style={{ width: '13%', padding: '8px 12px', textAlign: 'right', fontFamily: 'monospace', fontWeight: 'bold', color: '#ef4444' }}>
          {log.debit > 0 ? `Rs. ${log.debit.toLocaleString()}` : '—'}
        </div>
        <div style={{ width: '13%', padding: '8px 12px', textAlign: 'right', fontFamily: 'monospace', fontWeight: 'bold', color: '#10b981' }}>
          {log.credit > 0 ? `Rs. ${log.credit.toLocaleString()}` : '—'}
        </div>
        <div style={{ width: '14%', padding: '8px 12px', textAlign: 'right', fontFamily: 'monospace', fontWeight: 'bold', color: '#0f172a' }}>
          Rs. {log.balance.toLocaleString()}
        </div>
      </div>
    );
  };




  return (
    <div className="space-y-6 pb-16 lg:pb-0">

      {/* HEADER ROW WITH INTEGRATED DYNAMIC TIME FILTER */}
      <div className="flex flex-row flex-wrap items-start items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <span className="font-mono text-[9px] font-black text-orange-600 uppercase tracking-widest block mb-0.5">OPERATIONS</span>
          <h2 className="font-sans text-2xl font-black tracking-tight text-slate-900 flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-orange-600" />
            <span>{t('Consolidated Ledger Book', 'بنیادی یکجا کاروباری کھاتہ روزنامچہ')}</span>
          </h2>
          <p className="font-sans text-xs text-slate-500 mt-1">
            {t('Unified Vyapar ledger weighing receivables (customers) against payables (wholesale depots).', 'گاہکوں اور آئل کمپنیوں کے بقایاجات، یکساں حساب اور مجموعی کھاتہ چالان کنٹرول پینل۔')}
          </p>
        </div>

        {/* TIME FILTER SELECTOR ROW */}
        <div className="flex bg-slate-100 rounded-lg p-1 border border-slate-200 shadow-sm shrink-0 self-start lg:self-center">
          {(['all', 'weekly', 'monthly', 'yearly'] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => setTimeFilter(filter)}
              className={`px-3 py-1.5 font-sans text-[11px] font-bold uppercase tracking-wider rounded-md transition-all cursor-pointer ${
                timeFilter === filter
                  ? 'bg-orange-600 text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
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
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* AMBER CARD - NET LIQUIDITY */}
        <div className={`rounded-2xl border p-5 shadow-xs flex flex-col justify-between min-h-[110px] relative overflow-hidden transition-all duration-300 ${
          netBookBalance >= 0 
            ? 'border-emerald-200 bg-emerald-50/60' 
            : 'border-rose-200 bg-rose-50/60'
        }`}>
          <div className="flex items-start justify-between">
            <div>
              <span className="font-mono text-[9px] font-black uppercase tracking-widest block mb-1">NET POSITION</span>
              <h3 className={`font-sans text-2xl font-black mt-1 whitespace-nowrap ${
                netBookBalance >= 0 ? 'text-emerald-900' : 'text-rose-900'
              }`}>
                Rs. {netBookBalance.toLocaleString()}
              </h3>
            </div>
            <div className={`rounded-xl p-2 ${
              netBookBalance >= 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
            }`}>
              <Scale className="h-5 w-5" />
            </div>
          </div>
          <div className={`mt-3 flex items-center gap-1 text-[10px] font-bold ${
            netBookBalance >= 0 ? 'text-emerald-700' : 'text-rose-750'
          }`}>
            <span className={`h-1.5 w-1.5 rounded-full ${netBookBalance >= 0 ? 'bg-emerald-500' : 'bg-rose-500'}`} />
            <span>{t('Overall Khata Liquidity Position', 'خالص بقایا تجارتی پوزیشن')}</span>
          </div>
        </div>

        {/* GREEN CARD - TOTAL RECEIVABLES */}
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-5 shadow-xs flex flex-col justify-between min-h-[110px] relative overflow-hidden">
          <div className="flex items-start justify-between">
            <div>
              <span className="font-mono text-[9px] font-black text-emerald-800 uppercase tracking-widest block mb-1">TOTAL RECEIVABLES</span>
              <h3 className="font-sans text-2xl font-black text-emerald-900 mt-1">
                Rs. {receivablesTotal.toLocaleString()}
              </h3>
            </div>
            <div className="rounded-xl bg-emerald-100 p-2 text-emerald-700">
              <ArrowUpRight className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 flex items-center gap-1 text-[10px] text-emerald-700 font-bold">
            <span>Outstanding customer balances</span>
          </div>
        </div>

        {/* CRIMSON CARD - TOTAL PAYABLES */}
        <div className="rounded-2xl border border-rose-200 bg-rose-50/60 p-5 shadow-xs flex flex-col justify-between min-h-[110px] relative overflow-hidden">
          <div className="flex items-start justify-between">
            <div>
              <span className="font-mono text-[9px] font-black text-rose-800 uppercase tracking-widest block mb-1">TOTAL PAYABLES</span>
              <h3 className="font-sans text-2xl font-black text-rose-900 mt-1">
                Rs. {payablesTotal.toLocaleString()}
              </h3>
            </div>
            <div className="rounded-xl bg-rose-100 p-2 text-rose-700">
              <ArrowDownRight className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 flex items-center gap-1 text-[10px] text-rose-700 font-bold">
            <span>{t('Owed wholesale suppliers', 'سپلائر بل بقایاجات')}</span>
          </div>
        </div>

        {/* BLUE CARD - TRANSACTION LOG INDEX */}
        <div className="rounded-2xl border border-blue-200 bg-blue-50/60 p-5 shadow-xs flex flex-col justify-between min-h-[110px] relative overflow-hidden">
          <div className="flex items-start justify-between">
            <div>
              <span className="font-mono text-[9px] font-black text-blue-800 uppercase tracking-widest block mb-1">SHIFT TRANSACTIONS</span>
              <h3 className="font-sans text-2xl font-black text-blue-900 mt-1">
                {kpiStats.txCount}
              </h3>
            </div>
            <div className="rounded-xl bg-blue-100 p-2 text-blue-700">
              <Users className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 flex items-center gap-1 text-[10px] text-blue-700 font-bold">
            <span>{t('Consolidated logs in this period', 'مدت کے دوران درج روزنامچہ')}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6 lg:grid-cols-3">
        
        {/* LEFT COLUMN: ACTIVE PARTIES DATABASE */}
        <div className="space-y-4">
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs space-y-3.5">
            <div className="relative">
              <Search className="absolute top-2.5 left-3 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('Search party name...', 'کھاتہ دار کا نام تلاش کریں...')}
                className="w-full rounded-md border border-slate-200 bg-slate-50 py-1.5 pl-8 pr-3 font-sans text-xs focus:bg-white focus:outline-hidden"
              />
            </div>

            {/* Filter buttons */}
            <div className="flex gap-1.5 border-t border-slate-100 pt-3">
              {[
                { id: 'all', label: 'All', urdu: 'تمام' },
                { id: 'receivables', label: 'Dr (Customers)', urdu: 'صارفین' },
                { id: 'payables', label: 'Cr (Suppliers)', urdu: 'سپلائرز' }
              ].map(f => (
                <button
                  key={f.id}
                  onClick={() => setPartyTypeFilter(f.id as any)}
                  className={`rounded-md px-2.5 py-1 text-[10px] font-sans font-bold cursor-pointer transition-colors ${
                    partyTypeFilter === f.id
                      ? 'bg-slate-800 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
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
                  onClick={() => setSelectedParty({ id: party.id, type: party.type })}
                  className={`relative w-full text-left rounded-xl border p-4 shadow-xs transition-colors flex items-center justify-between cursor-pointer ${
                    isSelected
                      ? 'border-orange-500 bg-orange-50/20'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className={`absolute top-0 bottom-0 left-0 w-1 rounded-l-md ${isCust ? 'bg-emerald-500' : 'bg-red-500'}`}></div>

                  <div className="pl-3">
                    <div className="flex items-center gap-1.5">
                      {isCust ? <Users className="h-3.5 w-3.5 text-emerald-500" /> : <Truck className="h-3.5 w-3.5 text-rose-500" />}
                      <h4 className="font-sans text-xs font-bold text-slate-800">
                        {t(party.name, party.urduName)}
                      </h4>
                    </div>

                    <span className="font-mono text-[9px] text-slate-400 mt-1 block tracking-tight">
                      📞 {party.contact}
                    </span>
                  </div>

                  <div className="text-right">
                    <span className={`font-mono text-xs font-bold block ${isCust ? 'text-emerald-700' : 'text-red-650'}`}>
                      Rs. {outstanding.toLocaleString()}
                    </span>
                    <span className="font-mono text-[8px] text-slate-400 block mt-1 uppercase">
                      {isCust ? t('Receivable', 'واجب الوصول') : t('Payable', 'واجب الادا')}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* RIGHT COLUMN (2/3 WIDTH): PARTY HISTORY TIMELINE */}
        <div className="lg:col-span-2">
          {selectedParty && activePartyDetails ? (
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs space-y-6">
              
              <div className="flex flex-col gap-4 sm:flex-row items-center sm:justify-between border-b border-slate-100 pb-4">
                <div className="flex gap-3 items-center">
                  <div className={`flex h-11 w-11 items-center justify-center rounded-xl text-white ${selectedParty.type === 'customer' ? 'bg-emerald-500' : 'bg-rose-500'}`}>
                    {selectedParty.type === 'customer' ? <Users className="h-5.5 w-5.5" /> : <Truck className="h-5.5 w-5.5" />}
                  </div>
                  <div>
                    <h3 className="font-sans text-sm font-bold text-slate-905 leading-tight">
                      {t(activePartyDetails.name, activePartyDetails.urduName)}
                    </h3>
                    <p className="font-mono text-[10px] text-slate-400 mt-1 block">
                      Type: <span className="uppercase font-bold text-slate-500">{selectedParty.type}</span> | Contact: {activePartyDetails.contact}
                    </p>
                  </div>
                </div>

                <div className="rounded-lg bg-slate-50 border border-slate-100 px-4 py-2 text-right">
                  <span className="font-sans text-[8px] text-slate-400 font-bold uppercase block">
                    {selectedParty.type === 'customer' ? t('Owed to Station:', 'کسٹمر بقایا قرض:') : t('Owed by Station:', 'سپلائر بِل بقایا:')}
                  </span>
                  <strong className="font-mono text-base font-bold text-slate-805 block mt-0.5">Rs. {activePartyDetails.balance.toLocaleString()}</strong>
                </div>
              </div>

              {/* TIMELINE LIST */}
              <div className="space-y-4">
                <h4 className="font-sans text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2 block">
                  {t('Chronological Ledger Transactions History', 'تاریخ برقی کاروباری لیجر')}
                </h4>

                <div className="overflow-x-auto rounded-lg border border-slate-200">
                  <div className="min-w-full max-w-[600px]">
                    <div className="flex bg-slate-50 border-b border-slate-200 text-slate-500 font-bold py-2.5 text-[11px] uppercase tracking-wider select-none">
                      <div style={{ width: '15%', padding: '0 12px' }}>{t('Date', 'تاریخ')}</div>
                      <div style={{ width: '45%', padding: '0 12px' }}>{t('Narrative Description', 'تفصیل')}</div>
                      <div style={{ width: '13%', padding: '0 12px', textAlign: 'right' }}>{t('Debit Amount (+)', 'ڈیمانڈ بل (+)')}</div>
                      <div style={{ width: '13%', padding: '0 12px', textAlign: 'right' }}>{t('Credit Amount (–)', 'رقم ادائیگی (–)')}</div>
                      <div style={{ width: '14%', padding: '0 12px', textAlign: 'right' }}>{t('Running Balance', 'بقایا حاصل')}</div>
                    </div>
                    {activePartyLedgerTimeline.length === 0 ? (
                      <div className="py-8 text-center text-slate-400 font-semibold text-xs">
                        {t('No registered transactions in finalized shifts.', 'سیشنز کے دوران تاحال کوئی انٹری درج نہیں کی گئی ہے۔')}
                      </div>
                    ) : (
                      <List
                        itemCount={activePartyLedgerTimeline.length}
                        itemSize={42}
                        width="100%"
                        height={400}
                      >
                        {RenderRow}
                      </List>
                    )}
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

    </div>
  );
}
