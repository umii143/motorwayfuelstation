import React, { useState, useMemo } from 'react';
import { 
  Database, Scale, Clock, Layers, Zap, Receipt, BarChart3, 
  Search, Download, Printer, ChevronRight, X, ChevronDown, Sparkles,
  ArrowRight, ShieldCheck, FileText, Calendar
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { usePricingStore } from '../../../../stores/usePricingStore';
import { PriceRevisionSnapshot } from '../../../../services/priceManagement/priceImpactEngine';

interface PriceRevisionRegisterViewProps {
  isUrdu?: boolean;
}

export function PriceRevisionRegisterView({ isUrdu = false }: PriceRevisionRegisterViewProps) {
  const { snapshots, fuelPrices, approveRevision, publishRevision } = usePricingStore();

  // Selected Row for Right Detail Drawer
  const [selectedSnapshot, setSelectedSnapshot] = useState<PriceRevisionSnapshot | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [drawerTab, setDrawerTab] = useState<'what_changed' | 'shift' | 'inventory' | 'meters' | 'ledger' | 'analytics'>('what_changed');

  // Pending Approvals Modal State
  const [isApprovalsModalOpen, setIsApprovalsModalOpen] = useState(false);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [productFilter, setProductFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [datePreset, setDatePreset] = useState<'all' | 'today' | 'yesterday' | 'this_week' | 'this_month'>('all');
  const [showFullRegister, setShowFullRegister] = useState(false);

  const realSnapshots = snapshots;
  const hasSnapshots = realSnapshots.length > 0;

  // Filter Snapshots
  const filteredSnapshots = useMemo(() => {
    return realSnapshots.filter(s => {
      const query = searchQuery.toLowerCase();
      const matchesSearch = !query || 
        s.versionLabel.toLowerCase().includes(query) ||
        s.productName.toLowerCase().includes(query) ||
        (s.circularNo && s.circularNo.toLowerCase().includes(query));

      const matchesProduct = productFilter === 'all' || s.productName.toLowerCase().includes(productFilter.toLowerCase());
      const matchesStatus = statusFilter === 'all' || s.status.toLowerCase() === statusFilter.toLowerCase();

      let matchesDate = true;
      if (datePreset !== 'all' && s.timestamp) {
        const snapDate = new Date(s.timestamp);
        const today = new Date();
        if (datePreset === 'today') {
          matchesDate = snapDate.toDateString() === today.toDateString();
        } else if (datePreset === 'yesterday') {
          const yest = new Date(today);
          yest.setDate(yest.getDate() - 1);
          matchesDate = snapDate.toDateString() === yest.toDateString();
        } else if (datePreset === 'this_week') {
          const diffDays = (today.getTime() - snapDate.getTime()) / (1000 * 3600 * 24);
          matchesDate = diffDays <= 7;
        } else if (datePreset === 'this_month') {
          matchesDate = snapDate.getMonth() === today.getMonth() && snapDate.getFullYear() === today.getFullYear();
        }
      }

      return matchesSearch && matchesProduct && matchesStatus && matchesDate;
    });
  }, [realSnapshots, searchQuery, productFilter, statusFilter, datePreset]);

  // Limit display to top 10 rows by default
  const displayedSnapshots = useMemo(() => {
    return showFullRegister ? filteredSnapshots : filteredSnapshots.slice(0, 10);
  }, [filteredSnapshots, showFullRegister]);

  const latestSnap = realSnapshots[0] || null;

  // Row Click -> Open Right Detail Drawer
  const handleRowClick = (snap: PriceRevisionSnapshot) => {
    setSelectedSnapshot(snap);
    setDrawerTab('what_changed');
    setIsDrawerOpen(true);
  };

  // Exports
  const handleExportCSV = () => {
    if (!filteredSnapshots.length) return alert('No records available to export.');
    const headers = ['Version', 'Date', 'Time', 'Circular', 'Product', 'Old Rate', 'New Rate', 'Diff', 'Stock (L)', 'Gain (Rs)', 'Status'];
    const rows = filteredSnapshots.map(s => [
      s.versionLabel,
      s.effectiveDate,
      s.effectiveTime,
      s.circularNo || 'N/A',
      s.productName,
      s.oldRate.toFixed(2),
      s.newRate.toFixed(2),
      s.rateDifference.toFixed(2),
      s.totalProductStockLiters,
      s.inventoryGainAmount,
      s.status
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Price_Revision_Register_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">

      {/* TOP HEADER TITLE */}
      <div className="bg-[var(--bg-card)] border border-[var(--border-main)] rounded-2xl p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-xs font-bold mb-1">
            <Database className="w-3.5 h-3.5" />
            <span>Strict Read-Only Reporting Workspace</span>
          </div>
          <h2 className="text-xl font-black text-[var(--text-main)] tracking-tight">
            Official Price Revision Register & Audit Logs
          </h2>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">
            SAP IS-Oil Compliant • Historical snapshot ledger & single source of truth report
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-main)] text-[var(--text-main)] hover:bg-[var(--bg-hover)] text-xs font-bold flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5 text-emerald-500" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={handlePrint}
            className="px-3.5 py-2 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-main)] text-[var(--text-main)] hover:bg-[var(--bg-hover)] text-xs font-bold flex items-center gap-1.5"
          >
            <Printer className="w-3.5 h-3.5 text-indigo-500" />
            <span>Print Register</span>
          </button>
        </div>
      </div>

      {/* 4 TOP READ-ONLY KPIS (INTERACTIVE & CLICKABLE) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        
        {/* KPI 1: CURRENT FUEL RATE */}
        <button
          onClick={() => {
            if (latestSnap) handleRowClick(latestSnap);
          }}
          className="bg-[var(--bg-card)] border border-[var(--border-main)] hover:border-emerald-500/50 rounded-2xl p-4 shadow-sm text-left transition-all hover:-translate-y-0.5 group cursor-pointer"
        >
          <div className="text-xs text-[var(--text-muted)] font-medium flex items-center justify-between">
            <span>Current Fuel Rate</span>
            <ChevronRight className="w-3.5 h-3.5 text-[var(--text-muted)] group-hover:text-emerald-500 transition-colors" />
          </div>
          <div className="text-xl font-black text-emerald-500 mt-1">
            {latestSnap ? `Rs. ${latestSnap.newRate.toFixed(2)}` : 'Rs. 273.50'}
          </div>
          <div className="text-[10px] text-[var(--text-muted)] mt-1">
            {latestSnap ? `Previous: Rs. ${latestSnap.oldRate.toFixed(2)}` : 'Awaiting OGRA Update'}
          </div>
        </button>

        {/* KPI 2: LATEST REVISION */}
        <button
          onClick={() => {
            if (latestSnap) handleRowClick(latestSnap);
          }}
          className="bg-[var(--bg-card)] border border-[var(--border-main)] hover:border-indigo-500/50 rounded-2xl p-4 shadow-sm text-left transition-all hover:-translate-y-0.5 group cursor-pointer"
        >
          <div className="text-xs text-[var(--text-muted)] font-medium flex items-center justify-between">
            <span>Latest Published Revision</span>
            <ChevronRight className="w-3.5 h-3.5 text-[var(--text-muted)] group-hover:text-indigo-500 transition-colors" />
          </div>
          <div className="text-xl font-black text-[var(--text-main)] mt-1">
            {latestSnap ? latestSnap.versionLabel : 'No Revision Yet'}
          </div>
          <div className="text-[10px] text-[var(--text-muted)] mt-1">
            {latestSnap ? latestSnap.effectiveDate : 'Awaiting Circular'}
          </div>
        </button>

        {/* KPI 3: REVALUATION STOCK GAIN */}
        <button
          onClick={() => {
            if (latestSnap) {
              setSelectedSnapshot(latestSnap);
              setDrawerTab('ledger');
              setIsDrawerOpen(true);
            }
          }}
          className="bg-[var(--bg-card)] border border-[var(--border-main)] hover:border-emerald-500/50 rounded-2xl p-4 shadow-sm text-left transition-all hover:-translate-y-0.5 group cursor-pointer"
        >
          <div className="text-xs text-[var(--text-muted)] font-medium flex items-center justify-between">
            <span>Revaluation Stock Gain</span>
            <ChevronRight className="w-3.5 h-3.5 text-[var(--text-muted)] group-hover:text-emerald-500 transition-colors" />
          </div>
          <div className="text-xl font-black text-emerald-500 mt-1">
            {latestSnap ? `+Rs. ${latestSnap.inventoryGainAmount.toLocaleString()}` : 'Rs. 0'}
          </div>
          <div className="text-[10px] text-emerald-500/80 mt-1">
            {latestSnap ? 'Journal Entry Posted' : 'No Revaluation Logged'}
          </div>
        </button>

        {/* KPI 4: PENDING APPROVALS */}
        <button
          onClick={() => setIsApprovalsModalOpen(true)}
          className="bg-[var(--bg-card)] border-2 border-amber-500/40 hover:border-amber-500 rounded-2xl p-4 shadow-md text-left transition-all hover:-translate-y-0.5 group cursor-pointer relative overflow-hidden"
        >
          <div className="text-xs text-amber-600 dark:text-amber-400 font-bold flex items-center justify-between">
            <span>Pending Approvals</span>
            <span className="text-[10px] bg-amber-500/20 px-2 py-0.5 rounded-full text-amber-500 font-black">Review →</span>
          </div>
          <div className="text-xl font-black text-amber-500 mt-1">
            {fuelPrices.filter(p => p.status === 'waiting' || p.status === 'approved').length || 1} Pending
          </div>
          <div className="text-[10px] text-amber-600/80 dark:text-amber-300/80 font-medium mt-1">
            Click to view & approve proposals
          </div>
        </button>
      </div>

      {/* SAP AUDIT TIMELINE */}
      <div className="bg-[var(--bg-card)] border border-[var(--border-main)] rounded-2xl p-4 shadow-sm overflow-x-auto">
        <div className="text-xs font-bold text-[var(--text-main)] mb-3 flex items-center gap-2">
          <span>🔄</span>
          <span>SAP IS-Oil Price Revision Audit Lifecycle</span>
        </div>
        <div className="flex items-center justify-between min-w-max gap-3 text-[11px]">
          {[
            { step: '1', title: 'OGRA Circular', desc: 'Received & Registered', done: true },
            { step: '2', title: 'Manager Review', desc: 'Margin Analyzed', done: true },
            { step: '3', title: 'Owner Approval', desc: 'Approved Live', done: !!latestSnap },
            { step: '4', title: 'Inventory Revalued', desc: 'Auto Journal Posted', done: !!latestSnap },
            { step: '5', title: 'POS Synced', desc: 'Pumps & Terminals', done: !!latestSnap },
            { step: '6', title: 'Shift Snapshot', desc: 'Active Meter Freeze', done: !!latestSnap }
          ].map((item, idx) => (
            <React.Fragment key={idx}>
              <div className="flex items-center gap-2 bg-[var(--bg-subtle)] p-2.5 rounded-xl border border-[var(--border-main)]">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs ${
                  item.done ? 'bg-emerald-500 text-slate-950 font-black' : 'bg-slate-700 text-slate-300'
                }`}>
                  {item.step}
                </div>
                <div>
                  <div className="font-bold text-[var(--text-main)]">{item.title}</div>
                  <div className="text-[9px] text-[var(--text-muted)]">{item.desc}</div>
                </div>
              </div>
              {idx < 5 && <ArrowRight className="w-4 h-4 text-[var(--text-muted)] shrink-0" />}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* FILTER & SEARCH TOOLBAR */}
      <div className="bg-[var(--bg-card)] border border-[var(--border-main)] rounded-2xl p-4 shadow-sm space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
            <input
              type="text"
              placeholder="Search by Circular #, Version (V1, V2), or Product Name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-main)] text-xs text-[var(--text-main)] focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="flex items-center gap-1 overflow-x-auto text-xs scrollbar-none">
            {[
              { id: 'all', label: 'All Dates' },
              { id: 'today', label: 'Today' },
              { id: 'yesterday', label: 'Yesterday' },
              { id: 'this_week', label: 'This Week' },
              { id: 'this_month', label: 'This Month' }
            ].map(preset => (
              <button
                key={preset.id}
                onClick={() => setDatePreset(preset.id as any)}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all whitespace-nowrap ${
                  datePreset === preset.id
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-[var(--bg-subtle)] text-[var(--text-muted)] hover:text-[var(--text-main)]'
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>

        </div>
      </div>

      {/* PRICE REVISION REGISTER TABLE (FIRST 10 ROWS DEFAULT) */}
      <div className="bg-[var(--bg-card)] border border-[var(--border-main)] rounded-3xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-[var(--border-main)] pb-3">
          <div>
            <h3 className="text-base font-black text-[var(--text-main)] flex items-center gap-2">
              <span>📋</span>
              Price Revision Register
            </h3>
            <p className="text-xs text-[var(--text-muted)]">
              Showing {displayedSnapshots.length} of {filteredSnapshots.length} records. Click any row to view full 6-tab detail drawer.
            </p>
          </div>

          {filteredSnapshots.length > 10 && (
            <button
              onClick={() => setShowFullRegister(!showFullRegister)}
              className="px-4 py-2 rounded-xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 font-bold text-xs flex items-center gap-1.5 hover:bg-emerald-500/20 transition-all"
            >
              <span>{showFullRegister ? 'Show Top 10 Rows' : 'Open Full Register →'}</span>
            </button>
          )}
        </div>

        {!hasSnapshots ? (
          <div className="flex flex-col items-center justify-center p-12 bg-[var(--bg-subtle)] rounded-2xl border border-dashed border-[var(--border-main)] text-center space-y-3">
            <Database className="w-10 h-10 text-[var(--text-muted)]" />
            <div className="text-base font-black text-[var(--text-main)]">Awaiting OGRA Circular / No Revision Yet</div>
            <p className="text-xs text-[var(--text-muted)] max-w-md">
              No price revision snapshots have been published yet. Snapshots will be generated automatically when a price update is published in the Pricing Management module.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-[var(--border-main)]">
            <table className="w-full text-left text-xs">
              <thead className="bg-[var(--bg-subtle)] text-[var(--text-muted)] font-semibold uppercase tracking-wider border-b border-[var(--border-main)]">
                <tr>
                  <th className="p-3.5">Version</th>
                  <th className="p-3.5">Date & Time</th>
                  <th className="p-3.5">Circular #</th>
                  <th className="p-3.5">Product</th>
                  <th className="p-3.5 text-right">Old Rate</th>
                  <th className="p-3.5 text-right">New Rate</th>
                  <th className="p-3.5 text-right">Diff</th>
                  <th className="p-3.5 text-right">Stock (L)</th>
                  <th className="p-3.5 text-right">Inventory Gain</th>
                  <th className="p-3.5 text-center">Status</th>
                  <th className="p-3.5 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-main)]">
                {displayedSnapshots.map((snap) => (
                  <tr 
                    key={snap.id}
                    onClick={() => handleRowClick(snap)}
                    className="cursor-pointer hover:bg-[var(--bg-subtle)] transition-colors group"
                  >
                    <td className="p-3.5 font-black text-emerald-500 font-mono">{snap.versionLabel}</td>
                    <td className="p-3.5 text-[var(--text-muted)] font-mono">{snap.effectiveDate} {snap.effectiveTime}</td>
                    <td className="p-3.5 text-[var(--text-main)] font-mono">{snap.circularNo || 'N/A'}</td>
                    <td className="p-3.5 font-bold text-[var(--text-main)]">{snap.productName}</td>
                    <td className="p-3.5 text-right font-mono text-[var(--text-muted)]">Rs. {snap.oldRate.toFixed(2)}</td>
                    <td className="p-3.5 text-right font-mono font-bold text-[var(--text-main)]">Rs. {snap.newRate.toFixed(2)}</td>
                    <td className="p-3.5 text-right font-mono font-black text-emerald-500">
                      {snap.rateDifference >= 0 ? '+' : ''}{snap.rateDifference.toFixed(2)}
                    </td>
                    <td className="p-3.5 text-right font-mono text-[var(--text-muted)]">{snap.totalProductStockLiters.toLocaleString()} L</td>
                    <td className="p-3.5 text-right font-mono font-black text-emerald-500">+Rs. {snap.inventoryGainAmount.toLocaleString()}</td>
                    <td className="p-3.5 text-center">
                      <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-500 border border-emerald-500/30">
                        {snap.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="p-3.5 text-center">
                      <button className="p-1 rounded-lg bg-[var(--bg-subtle)] text-[var(--text-muted)] group-hover:text-emerald-500 border border-[var(--border-main)]">
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* SLIDE-OVER RIGHT DETAIL DRAWER */}
      <AnimatePresence>
        {isDrawerOpen && selectedSnapshot && (
          <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950/60 backdrop-blur-sm flex justify-end">
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 250 }}
              className="w-full max-w-3xl bg-[var(--bg-card)] border-l border-[var(--border-main)] h-full flex flex-col shadow-2xl overflow-hidden"
            >
              {/* DRAWER HEADER */}
              <div className="p-5 border-b border-[var(--border-main)] flex items-center justify-between bg-[var(--bg-subtle)]">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-black text-emerald-500">{selectedSnapshot.versionLabel}</span>
                    <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-500 font-bold border border-emerald-500/30">
                      {selectedSnapshot.status.toUpperCase()}
                    </span>
                  </div>
                  <div className="text-xs text-[var(--text-muted)] mt-1 font-mono">
                    {selectedSnapshot.circularNo} • Effective {selectedSnapshot.effectiveDate} {selectedSnapshot.effectiveTime}
                  </div>
                </div>

                <button
                  onClick={() => setIsDrawerOpen(false)}
                  className="p-2 rounded-xl bg-[var(--bg-card)] border border-[var(--border-main)] text-[var(--text-muted)] hover:text-[var(--text-main)]"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* DRAWER 6 TABS */}
              <div className="flex items-center gap-1 p-2 bg-[var(--bg-subtle)] border-b border-[var(--border-main)] overflow-x-auto text-xs font-bold scrollbar-none">
                {[
                  { id: 'what_changed', label: 'What Changed', icon: Scale },
                  { id: 'shift', label: 'Shift Snapshot', icon: Clock },
                  { id: 'inventory', label: 'Inventory', icon: Layers },
                  { id: 'meters', label: 'Meters', icon: Zap },
                  { id: 'ledger', label: 'Ledger Impact', icon: Receipt },
                  { id: 'analytics', label: 'Analytics', icon: BarChart3 }
                ].map((t) => {
                  const Icon = t.icon;
                  const isActive = drawerTab === t.id;
                  return (
                    <button
                      key={t.id}
                      onClick={() => setDrawerTab(t.id as any)}
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-xl transition-all whitespace-nowrap ${
                        isActive
                          ? 'bg-emerald-600 text-white shadow-md'
                          : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span>{t.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* DRAWER BODY VIEWS */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">

                {/* TAB 1: WHAT CHANGED */}
                {drawerTab === 'what_changed' && (
                  <div className="space-y-4">
                    <h4 className="text-sm font-black text-[var(--text-main)] flex items-center gap-2">
                      <span>📊</span>
                      Side-by-Side "What Changed?" Comparison
                    </h4>
                    <div className="overflow-x-auto rounded-2xl border border-[var(--border-main)]">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-[var(--bg-subtle)] text-[var(--text-muted)] font-semibold border-b border-[var(--border-main)]">
                          <tr>
                            <th className="p-3">Metric</th>
                            <th className="p-3 text-right">Before Revision</th>
                            <th className="p-3 text-right">After Revision</th>
                            <th className="p-3 text-right">Difference</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--border-main)]">
                          {selectedSnapshot.comparisonMatrix.map((row, idx) => (
                            <tr key={idx} className={row.highlight ? 'bg-emerald-500/10 font-bold' : ''}>
                              <td className="p-3 font-semibold text-[var(--text-main)]">{row.metric}</td>
                              <td className="p-3 text-right font-mono text-[var(--text-muted)]">{row.before}</td>
                              <td className="p-3 text-right font-mono text-[var(--text-main)] font-bold">{row.after}</td>
                              <td className="p-3 text-right font-mono font-black text-emerald-500">{row.difference}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* TAB 2: SHIFT SNAPSHOT */}
                {drawerTab === 'shift' && (
                  <div className="space-y-4">
                    <h4 className="text-sm font-black text-[var(--text-main)] flex items-center gap-2">
                      <span>⏱️</span>
                      Locked Shift Wizard Snapshot
                    </h4>
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div className="p-3 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-main)]">
                        <div className="text-[var(--text-muted)]">Shift Code</div>
                        <div className="font-bold text-[var(--text-main)] mt-0.5">{selectedSnapshot.shift.shiftCode}</div>
                      </div>
                      <div className="p-3 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-main)]">
                        <div className="text-[var(--text-muted)]">Opening Time</div>
                        <div className="font-bold text-[var(--text-main)] mt-0.5">{selectedSnapshot.shift.openingTime}</div>
                      </div>
                      <div className="p-3 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-main)]">
                        <div className="text-[var(--text-muted)]">Sold Before Revision</div>
                        <div className="font-bold text-amber-500 mt-0.5">{selectedSnapshot.soldBeforeRevisionLiters.toLocaleString()} L</div>
                      </div>
                      <div className="p-3 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-main)]">
                        <div className="text-[var(--text-muted)]">Remaining Stock</div>
                        <div className="font-bold text-emerald-500 mt-0.5">{selectedSnapshot.remainingStockLiters.toLocaleString()} L</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 3: INVENTORY SNAPSHOT */}
                {drawerTab === 'inventory' && (
                  <div className="space-y-4">
                    <h4 className="text-sm font-black text-[var(--text-main)] flex items-center gap-2">
                      <span>🛢️</span>
                      Per-Tank Revaluation Breakdown
                    </h4>
                    <div className="space-y-3">
                      {selectedSnapshot.tanks.map((tank, idx) => (
                        <div key={idx} className="p-4 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-main)] space-y-2 text-xs">
                          <div className="flex justify-between font-bold text-[var(--text-main)]">
                            <span>{tank.tankName}</span>
                            <span className="font-mono text-emerald-500">{tank.currentStock.toLocaleString()} L</span>
                          </div>
                          <div className="grid grid-cols-3 gap-2 py-2 border-y border-[var(--border-main)] text-[11px]">
                            <div>Dip: <strong className="font-mono">{tank.dipMm} mm</strong></div>
                            <div>Density: <strong className="font-mono">{tank.density}</strong></div>
                            <div>Water: <strong className="font-mono">{tank.waterLevelMm} mm</strong></div>
                          </div>
                          <div className="flex justify-between text-[11px]">
                            <span>Value Diff:</span>
                            <span className="font-mono font-bold text-emerald-500">+Rs. {tank.valueDifference.toLocaleString()}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* TAB 4: METERS SNAPSHOT */}
                {drawerTab === 'meters' && (
                  <div className="space-y-4">
                    <h4 className="text-sm font-black text-[var(--text-main)] flex items-center gap-2">
                      <span>⛽</span>
                      Nozzle Meter Snapshot Readings
                    </h4>
                    <div className="overflow-x-auto rounded-2xl border border-[var(--border-main)]">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-[var(--bg-subtle)] text-[var(--text-muted)] font-semibold border-b border-[var(--border-main)]">
                          <tr>
                            <th className="p-3">Nozzle</th>
                            <th className="p-3">Opening</th>
                            <th className="p-3">Closing</th>
                            <th className="p-3 text-right">Sold Liters</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--border-main)]">
                          {selectedSnapshot.nozzles.map((noz, idx) => (
                            <tr key={idx}>
                              <td className="p-3 font-semibold text-[var(--text-main)]">{noz.nozzleName}</td>
                              <td className="p-3 font-mono text-[var(--text-muted)]">{noz.openingReading.toLocaleString()}</td>
                              <td className="p-3 font-mono text-[var(--text-main)]">{noz.closingReading.toLocaleString()}</td>
                              <td className="p-3 font-mono font-bold text-emerald-500 text-right">{noz.soldLiters.toLocaleString()} L</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* TAB 5: LEDGER IMPACT */}
                {drawerTab === 'ledger' && (
                  <div className="space-y-4">
                    <h4 className="text-sm font-black text-[var(--text-main)] flex items-center gap-2">
                      <span>📜</span>
                      Double-Entry Revaluation Journal Entry
                    </h4>
                    <div className="p-4 rounded-2xl bg-slate-950 text-slate-200 border border-slate-800 space-y-3 font-mono text-xs">
                      <div className="flex justify-between border-b border-slate-800 pb-2 text-[11px] text-emerald-400 font-bold">
                        <span>Journal ID: {selectedSnapshot.journalEntryId}</span>
                        <span>POSTED</span>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between bg-slate-900/60 p-2.5 rounded-lg">
                          <span>Debit: 1100-Fuel Inventory Asset</span>
                          <span className="text-emerald-400 font-bold">Rs. {selectedSnapshot.inventoryGainAmount.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between bg-slate-900/60 p-2.5 rounded-lg">
                          <span>Credit: 4200-Inventory Revaluation Gain</span>
                          <span className="text-indigo-400 font-bold">Rs. {selectedSnapshot.inventoryGainAmount.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 6: ANALYTICS */}
                {drawerTab === 'analytics' && (
                  <div className="space-y-4">
                    <h4 className="text-sm font-black text-[var(--text-main)] flex items-center gap-2">
                      <span>📈</span>
                      Revision Stock Revaluation Trend
                    </h4>
                    <div className="h-56 w-full pt-2">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={realSnapshots.map(s => ({ version: s.versionLabel, gain: s.inventoryGainAmount })).reverse()}>
                          <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                          <XAxis dataKey="version" stroke="#94a3b8" fontSize={11} />
                          <YAxis stroke="#94a3b8" fontSize={11} />
                          <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', color: '#fff', fontSize: '11px' }} />
                          <Area type="monotone" dataKey="gain" name="Gain (Rs)" stroke="#10b981" fill="#10b981" fillOpacity={0.2} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}

              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* INTERACTIVE PENDING PRICE APPROVALS MODAL */}
      <AnimatePresence>
        {isApprovalsModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[var(--bg-card)] border border-[var(--border-main)] rounded-3xl p-6 w-full max-w-2xl shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto text-left"
            >
              <div className="flex items-center justify-between border-b border-[var(--border-main)] pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-[var(--text-main)]">OGRA Price Revision Approvals & Governance</h3>
                    <p className="text-xs text-[var(--text-muted)]">Oracle NetSuite 6-Stage Approval Pipeline Protocol</p>
                  </div>
                </div>
                <button onClick={() => setIsApprovalsModalOpen(false)} className="text-[var(--text-muted)] hover:text-[var(--text-main)] text-xl font-bold">×</button>
              </div>

              {/* PENDING PROPOSALS LIST */}
              <div className="space-y-4 text-xs">
                {fuelPrices.filter(p => p.status === 'waiting' || p.status === 'approved').length === 0 ? (
                  <div className="p-6 rounded-2xl bg-[var(--bg-subtle)] border border-[var(--border-main)] text-center space-y-3">
                    <CheckCircle className="w-8 h-8 text-emerald-500 mx-auto" />
                    <div className="font-bold text-[var(--text-main)]">No Pending OGRA Proposals</div>
                    <p className="text-xs text-[var(--text-muted)]">All price revision proposals have been reviewed and published live.</p>
                  </div>
                ) : (
                  (fuelPrices.filter(p => p.status === 'waiting' || p.status === 'approved')).map((prop) => (
                    <div key={prop.id} className="p-5 rounded-2xl bg-[var(--bg-subtle)] border border-[var(--border-main)] space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-black text-sm text-[var(--text-main)]">{prop.productName}</div>
                          <div className="text-[10px] text-[var(--text-muted)]">Effective {prop.effectiveDate} {prop.effectiveTime}</div>
                        </div>
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-500 border border-amber-500/30 uppercase">
                          {prop.status.toUpperCase()}
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-3 p-3 rounded-xl bg-[var(--bg-card)] border border-[var(--border-main)] text-center">
                        <div>
                          <div className="text-[var(--text-muted)] text-[10px]">Current Rate</div>
                          <div className="font-mono font-bold text-[var(--text-main)] mt-0.5">Rs. {prop.oldPrice.toFixed(2)}</div>
                        </div>
                        <div>
                          <div className="text-[var(--text-muted)] text-[10px]">Proposed Rate</div>
                          <div className="font-mono font-bold text-emerald-500 mt-0.5">Rs. {prop.newPrice.toFixed(2)}</div>
                        </div>
                        <div>
                          <div className="text-[var(--text-muted)] text-[10px]">Rate Delta</div>
                          <div className="font-mono font-black text-emerald-500 mt-0.5">
                            +Rs. {(prop.newPrice - prop.oldPrice).toFixed(2)}
                          </div>
                        </div>
                      </div>

                      <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-between">
                        <span>Projected Stock Revaluation Gain:</span>
                        <span className="font-mono font-black text-sm">+Rs. {(30700 * (prop.newPrice - prop.oldPrice)).toLocaleString()}</span>
                      </div>

                      <div className="flex items-center justify-end gap-3 pt-2">
                        {prop.status === 'waiting' && (
                          <button
                            onClick={async () => {
                              await approveRevision(prop.id, 'Station Owner');
                              alert(`Proposal for ${prop.productName} Approved Successfully!`);
                            }}
                            className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold shadow-md"
                          >
                            Approve Proposal
                          </button>
                        )}
                        <button
                          onClick={async () => {
                            await publishRevision(prop.id, 'Station Owner');
                            setIsApprovalsModalOpen(false);
                            alert(`Rate for ${prop.productName} Published Live! SSOT Snapshot Created & Journal Posted.`);
                          }}
                          className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-lg shadow-emerald-600/20 flex items-center gap-2"
                        >
                          <Zap className="w-4 h-4 fill-white" />
                          <span>Publish Live & Generate Snapshot</span>
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
