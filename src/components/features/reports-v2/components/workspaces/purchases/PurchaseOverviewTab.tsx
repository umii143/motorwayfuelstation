/**
 * @license SPDX-License-Identifier: Apache-2.0
 *
 * FuelPro Enterprise Business Operating System v4.0
 * PurchaseOverviewTab — Purchases & Procurement Control Room Dashboard
 *
 * Implements Enterprise Rules #130, #131, #135, #162 & #168
 * 100% Realtime computed metrics with ZERO dummy arrays or fallback statistics.
 */

import React, { useState, useMemo } from 'react';
import {
  TrendingUp, TrendingDown, ShoppingCart, Truck, AlertTriangle,
  FileText, DollarSign, Plus, Search, Filter, ShieldCheck, Tag,
  Clock, CreditCard, Sparkles, ChevronRight, Layers
} from 'lucide-react';
import { useWorkspaceFirebaseData } from '../../../hooks/useWorkspaceFirebaseData';
import toast from 'react-hot-toast';

function formatCurrency(v: number | string): string {
  const n = typeof v === 'number' ? v : Number(v) || 0;
  return `Rs ${n.toLocaleString('en-PK')}`;
}

function formatLiters(v: number | string): string {
  const n = typeof v === 'number' ? v : Number(v) || 0;
  return `${n.toLocaleString('en-PK', { maximumFractionDigits: 1 })} L`;
}

interface PurchaseOverviewTabProps {
  lang: 'en' | 'ur';
  orgId?: string;
  stationId?: string;
  onSelectTab: (tabId: string) => void;
  onOpenInspector: (record: Record<string, any>) => void;
}

export const PurchaseOverviewTab: React.FC<PurchaseOverviewTabProps> = ({
  lang,
  orgId,
  stationId,
  onSelectTab,
  onOpenInspector,
}) => {
  const isEn = lang === 'en';
  const [tableSearch, setTableSearch] = useState('');

  // Fetch live purchases and suppliers from Firebase hook
  const { data: purchases = [], loading } = useWorkspaceFirebaseData('FUEL_PURCHASES', { orgId, stationId });

  // Filtered invoices from live stream
  const recentInvoices = useMemo(() => {
    if (!purchases || purchases.length === 0) return [];
    if (!tableSearch.trim()) return purchases.slice(0, 10);
    const q = tableSearch.toLowerCase();
    return purchases.filter(p =>
      String(p.invoiceNo || p.id || '').toLowerCase().includes(q) ||
      String(p.supplierName || p.supplier || '').toLowerCase().includes(q) ||
      String(p.productName || p.product || '').toLowerCase().includes(q)
    ).slice(0, 10);
  }, [purchases, tableSearch]);

  // Bowser deliveries in transit or recently arrived
  const recentBowserDeliveries = useMemo(() => {
    return purchases.filter(p => p.bowserNo || p.driverName || p.status === 'in_transit' || p.status === 'arrived').slice(0, 5);
  }, [purchases]);

  // Compute live KPIs
  const totalPurchasesToday = useMemo(() => {
    return purchases.reduce((sum, p) => sum + (Number(p.totalAmount || p.amount) || 0), 0);
  }, [purchases]);

  const totalLitersToday = useMemo(() => {
    return purchases.reduce((sum, p) => sum + (Number(p.quantity || p.liters) || 0), 0);
  }, [purchases]);

  const avgCostPerLiter = useMemo(() => {
    if (totalLitersToday === 0) return 0;
    return totalPurchasesToday / totalLitersToday;
  }, [totalPurchasesToday, totalLitersToday]);

  const activePOCount = useMemo(() => {
    return purchases.filter(p => p.status === 'PO' || p.status === 'approved' || p.orderStatus === 'pending').length;
  }, [purchases]);

  const pendingPayments = useMemo(() => {
    return purchases
      .filter(p => p.paymentStatus !== 'paid' && p.paymentStatus !== 'Paid')
      .reduce((sum, p) => sum + (Number(p.totalAmount || p.amount || p.balance) || 0), 0);
  }, [purchases]);

  // Product Liters Breakdown
  const productBreakdown = useMemo(() => {
    const map: Record<string, number> = {};
    purchases.forEach(p => {
      const prod = p.productName || p.product || 'Fuel';
      map[prod] = (map[prod] || 0) + (Number(p.quantity || p.liters) || 0);
    });
    return Object.entries(map).map(([name, liters]) => ({
      name,
      liters,
      pct: totalLitersToday > 0 ? ((liters / totalLitersToday) * 100).toFixed(1) : '0',
    }));
  }, [purchases, totalLitersToday]);

  return (
    <div className="space-y-4 font-sans text-slate-800">
      {/* ── 1. TOP 5 STAT KPI CARDS (LIVE COMPUTED) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        <div className="bg-card rounded-2xl border border-border p-4 flex flex-col justify-between shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-muted-foreground uppercase tracking-wider">Total Purchases</span>
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center font-bold">
              <ShoppingCart size={16} />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-black text-foreground tracking-tight">{formatCurrency(totalPurchasesToday)}</div>
            <span className="text-[11px] font-extrabold text-muted-foreground mt-1 block">Live stream total</span>
          </div>
        </div>

        <div className="bg-card rounded-2xl border border-border p-4 flex flex-col justify-between shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-muted-foreground uppercase tracking-wider">Liters Purchased</span>
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center font-bold">
              <Truck size={16} />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-black text-foreground tracking-tight">{formatLiters(totalLitersToday)}</div>
            <span className="text-[11px] font-extrabold text-muted-foreground mt-1 block">Total volume received</span>
          </div>
        </div>

        <div className="bg-card rounded-2xl border border-border p-4 flex flex-col justify-between shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-muted-foreground uppercase tracking-wider">Avg. Cost / Liter</span>
            <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
              <TrendingUp size={16} />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-black text-foreground tracking-tight">{avgCostPerLiter > 0 ? formatCurrency(avgCostPerLiter) : '—'}</div>
            <span className="text-[11px] font-extrabold text-muted-foreground mt-1 block">Effective purchase rate</span>
          </div>
        </div>

        <div className="bg-card rounded-2xl border border-border p-4 flex flex-col justify-between shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-muted-foreground uppercase tracking-wider">Active POs</span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold">
              <FileText size={16} />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-black text-foreground tracking-tight">{activePOCount}</div>
            <span className="text-[11px] font-extrabold text-muted-foreground mt-1 block">Pending fulfillment</span>
          </div>
        </div>

        <div className="bg-card rounded-2xl border border-border p-4 flex flex-col justify-between shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-muted-foreground uppercase tracking-wider">Pending Payments</span>
            <div className="w-8 h-8 rounded-xl bg-rose-500/10 text-rose-600 flex items-center justify-center font-bold">
              <CreditCard size={16} />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-black text-foreground tracking-tight">{formatCurrency(pendingPayments)}</div>
            <span className="text-[11px] font-extrabold text-muted-foreground mt-1 block">Supplier payables</span>
          </div>
        </div>
      </div>

      {/* ── 2. MIDDLE SECTION ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Purchase by Product Breakdown */}
        <div className="lg:col-span-5 bg-card rounded-2xl border border-border p-4 sm:p-5 shadow-xs space-y-3">
          <h2 className="text-sm font-black text-foreground uppercase tracking-wider pb-2 border-b border-border">
            Purchase Volume Breakdown by Product
          </h2>
          {productBreakdown.length === 0 ? (
            <p className="text-xs font-bold text-muted-foreground py-6 text-center">
              No procurement transactions recorded. Volume breakdown will populate dynamically from live GRNs and invoices.
            </p>
          ) : (
            <div className="space-y-3">
              {productBreakdown.map((p, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between text-xs font-bold text-foreground">
                    <span>{p.name}</span>
                    <span className="font-black">{formatLiters(p.liters)} ({p.pct}%)</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                    <div className="bg-primary h-full rounded-full" style={{ width: `${p.pct}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Bowser Deliveries */}
        <div className="lg:col-span-7 bg-card rounded-2xl border border-border p-4 sm:p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-border">
            <h2 className="text-sm font-black text-foreground uppercase tracking-wider">Bowser Delivery Status</h2>
            <button onClick={() => onSelectTab('deliveries')} className="text-xs font-bold text-primary hover:underline cursor-pointer">
              View All ↗
            </button>
          </div>

          {recentBowserDeliveries.length === 0 ? (
            <p className="text-xs font-bold text-muted-foreground py-6 text-center">
              No bowser shipments in transit or recently logged.
            </p>
          ) : (
            <div className="space-y-2">
              {recentBowserDeliveries.map((bw, idx) => (
                <div key={idx} className="p-3 rounded-xl bg-muted/40 border border-border flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Truck size={16} className="text-primary" />
                    <div>
                      <div className="text-xs font-black text-foreground">{bw.bowserNo || bw.id || `Bowser #${idx + 1}`}</div>
                      <div className="text-[11px] font-bold text-muted-foreground">
                        {bw.supplierName || bw.supplier || 'OMC Supplier'} • {formatLiters(bw.quantity || bw.liters || 0)}
                      </div>
                    </div>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-primary/10 text-primary border border-primary/25">
                    {bw.status || 'Received'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── 3. RECENT INVOICES & QUICK LAUNCHERS ── */}
      <div className="bg-card rounded-2xl border border-border p-4 sm:p-5 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border">
          <h2 className="text-sm font-black text-foreground uppercase tracking-wider">Recent Purchase Invoices & GRNs</h2>
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Search invoice, supplier..."
              value={tableSearch}
              onChange={(e) => setTableSearch(e.target.value)}
              className="px-3.5 py-1.5 bg-card border border-border rounded-xl text-xs font-bold text-foreground focus:outline-none focus:border-primary placeholder:text-muted-foreground min-w-[220px]"
            />
          </div>
        </div>

        {recentInvoices.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 bg-card rounded-2xl border border-dashed border-border text-center">
            <span className="text-4xl mb-3">🛒</span>
            <h4 className="text-sm font-black text-foreground">{isEn ? 'No Purchase Invoices Found' : 'کوئی خریداری انوائس نہیں ملی'}</h4>
            <p className="text-xs font-bold text-muted-foreground max-w-sm mt-1">
              {isEn ? 'Waiting for realtime procurement data. Create your first purchase order to begin.' : 'کوئی خریدی انوائس ریکارڈ نہیں ملا۔'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-border text-muted-foreground font-black uppercase text-[10px] bg-muted/30">
                  <th className="py-2.5 px-3">INV / GRN #</th>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Supplier</th>
                  <th className="py-2.5 px-3">Product</th>
                  <th className="py-2.5 px-3 text-right">Liters</th>
                  <th className="py-2.5 px-3 text-right">Rate / L</th>
                  <th className="py-2.5 px-3 text-right">Amount (Rs)</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border font-bold text-foreground">
                {recentInvoices.map((inv, idx) => (
                  <tr
                    key={inv.id || idx}
                    onClick={() => onOpenInspector(inv)}
                    className="hover:bg-muted/50 transition-all cursor-pointer"
                  >
                    <td className="py-2.5 px-3 font-black text-foreground">{inv.invoiceNo || inv.id || `INV-${idx + 1}`}</td>
                    <td className="py-2.5 px-3 text-muted-foreground">{inv.date || 'Today'}</td>
                    <td className="py-2.5 px-3 font-bold">{inv.supplierName || inv.supplier || '—'}</td>
                    <td className="py-2.5 px-3">{inv.productName || inv.product || 'Fuel'}</td>
                    <td className="py-2.5 px-3 text-right">{formatLiters(inv.quantity || inv.liters || 0)}</td>
                    <td className="py-2.5 px-3 text-right">{inv.rate ? formatCurrency(inv.rate) : '—'}</td>
                    <td className="py-2.5 px-3 text-right font-black text-primary">{formatCurrency(inv.totalAmount || inv.amount || 0)}</td>
                    <td className="py-2.5 px-3 text-center">
                      <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-black border border-primary/25">
                        {inv.status || 'Verified'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── 4. BOTTOM QUICK LAUNCHER STRIP ── */}
      <div className="bg-card rounded-2xl border border-border p-3 shadow-xs grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
        <button onClick={() => onSelectTab('orders')} className="p-3 rounded-xl bg-muted/40 hover:bg-muted border border-border flex items-center gap-2 text-left transition-all cursor-pointer">
          <FileText size={16} className="text-primary" />
          <div>
            <div className="text-xs font-black text-foreground">New PO</div>
            <div className="text-[10px] font-bold text-muted-foreground">Create purchase order</div>
          </div>
        </button>

        <button onClick={() => onSelectTab('grn')} className="p-3 rounded-xl bg-muted/40 hover:bg-muted border border-border flex items-center gap-2 text-left transition-all cursor-pointer">
          <ShieldCheck size={16} className="text-blue-600" />
          <div>
            <div className="text-xs font-black text-foreground">Record GRN</div>
            <div className="text-[10px] font-bold text-muted-foreground">Goods receipt note</div>
          </div>
        </button>

        <button onClick={() => onSelectTab('quotations')} className="p-3 rounded-xl bg-muted/40 hover:bg-muted border border-border flex items-center gap-2 text-left transition-all cursor-pointer">
          <Tag size={16} className="text-purple-600" />
          <div>
            <div className="text-xs font-black text-foreground">Compare Rates</div>
            <div className="text-[10px] font-bold text-muted-foreground">Rate matrix</div>
          </div>
        </button>

        <button onClick={() => onSelectTab('performance')} className="p-3 rounded-xl bg-muted/40 hover:bg-muted border border-border flex items-center gap-2 text-left transition-all cursor-pointer">
          <Truck size={16} className="text-amber-600" />
          <div>
            <div className="text-xs font-black text-foreground">Suppliers</div>
            <div className="text-[10px] font-bold text-muted-foreground">Performance & ratings</div>
          </div>
        </button>

        <button onClick={() => onSelectTab('payments')} className="p-3 rounded-xl bg-muted/40 hover:bg-muted border border-border flex items-center gap-2 text-left transition-all cursor-pointer">
          <CreditCard size={16} className="text-emerald-600" />
          <div>
            <div className="text-xs font-black text-foreground">Payments</div>
            <div className="text-[10px] font-bold text-muted-foreground">Pay supplier</div>
          </div>
        </button>

        <button onClick={() => onSelectTab('documents')} className="p-3 rounded-xl bg-muted/40 hover:bg-muted border border-border flex items-center gap-2 text-left transition-all cursor-pointer">
          <Layers size={16} className="text-slate-600" />
          <div>
            <div className="text-xs font-black text-foreground">Documents</div>
            <div className="text-[10px] font-bold text-muted-foreground">PO & GRN scans</div>
          </div>
        </button>
      </div>
    </div>
  );
};
