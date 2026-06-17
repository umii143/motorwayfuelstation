/**
 * FuelPro — Upgraded FIFO Batch Ledger
 * Shows Expected Batch Margin + Realized Margin + Aging Status
 * Powered by Umar Ali ⚡ | Motorway Petroleum, Mardan KPK
 */
import React, { useState, useMemo } from 'react';
import {
  Package, Clock, Hash, CheckCircle, Search, TrendingUp,
  TrendingDown, AlertTriangle, ChevronDown, ChevronUp,
  Shield, Truck, Droplets, Star, BarChart2
} from 'lucide-react';
import { StockBatch, Product } from '../../types';
import { getBatchAgingDays, getAgingCategory } from '../../services/fifoEngine';
import { t } from '../../lib/translations';

interface BatchHistoryProps {
  batches: StockBatch[];
  products: Product[];
  language: string;
}

function AgingBadge({ days }: { days: number }) {
  const cat = getAgingCategory(days);
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold border
      ${cat.color === 'green' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
        cat.color === 'orange' ? 'bg-amber-50 text-amber-700 border-amber-200' :
        'bg-red-50 text-red-700 border-red-200'}`}>
      <Clock className="size-3" />
      {days}d
    </span>
  );
}

function MarginBar({ current, max }: { current: number; max: number }) {
  if (max <= 0) return null;
  const pct = Math.min(100, Math.max(0, (current / max) * 100));
  return (
    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
      <div
        className={`h-full rounded-full ${pct > 60 ? 'bg-emerald-500' : pct > 30 ? 'bg-amber-400' : 'bg-red-400'}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

export default function BatchHistory({ batches, products, language }: BatchHistoryProps) {
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'partial' | 'exhausted'>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'date' | 'margin' | 'remaining'>('date');

  const filtered = useMemo(() => {
    return batches
      .filter(b => {
        const q = search.toLowerCase();
        const prod = products.find(p => p.id === b.productId);
        const matchSearch = !q || b.batchNumber.toLowerCase().includes(q)
          || (prod?.name || '').toLowerCase().includes(q)
          || (b.invoiceNumber || '').toLowerCase().includes(q)
          || (b.supplierName || '').toLowerCase().includes(q);
        const matchStatus = filterStatus === 'all' || b.status === filterStatus
          || b.batchStatus === filterStatus;
        return matchSearch && matchStatus;
      })
      .sort((a, b) => {
        if (sortBy === 'date') {
          return new Date(b.deliveryDate || b.date).getTime() - new Date(a.deliveryDate || a.date).getTime();
        }
        if (sortBy === 'margin') {
          return (b.expectedBatchMarginPerLiter || b.grossMarginPerLiter || 0) - (a.expectedBatchMarginPerLiter || a.grossMarginPerLiter || 0);
        }
        return b.qtyRemaining - a.qtyRemaining;
      });
  }, [batches, products, search, filterStatus, sortBy]);

  const getStatusColor = (batch: StockBatch) => {
    const s = batch.batchStatus || batch.status;
    if (s === 'active') return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    if (s === 'partial') return 'bg-amber-100 text-amber-700 border-amber-200';
    return 'bg-slate-100 text-slate-500 border-slate-200';
  };

  const getStatusLabel = (batch: StockBatch) => {
    const s = batch.batchStatus || batch.status;
    if (s === 'active') return '🟢 Active';
    if (s === 'partial') return '🟡 Partial';
    return '⬜ Exhausted';
  };

  const maxMargin = Math.max(
    ...batches.map(b => b.expectedBatchMarginPerLiter || b.grossMarginPerLiter || 0),
    1
  );

  // Summary stats
  const stats = useMemo(() => {
    const active = batches.filter(b => b.status === 'active' || b.batchStatus === 'active');
    const totalRemaining = active.reduce((s, b) => s + b.qtyRemaining, 0);
    const totalExpectedProfit = active.reduce((s, b) => s + (b.expectedBatchMarginTotal || 0), 0);
    const totalRealizedMargin = batches.reduce((s, b) => s + (b.realizedMargin || 0), 0);
    return { activeBatches: active.length, totalRemaining, totalExpectedProfit, totalRealizedMargin };
  }, [batches]);

  return (
    <div className="kpi-card p-4 overflow-hidden">
      {/* Header */}
      <div className="border-b border-theme-main pb-3 mb-3">
        <div className="flex flex-col sm:flex-row justify-between gap-3 items-start sm:items-center mb-3">
          <div>
            <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
              <Package className="size-4 text-orange-600" />
              <span>{t('FIFO Batch Ledger', 'بیچ لیجر (FIFO)', language)}</span>
            </h3>
            <p className="text-[10px] text-slate-500 mt-0.5">
              {t('Tracking active and exhausted stock batches for precise cost calculations.', 'دقیق قیمت کے حساب کے لیے بیچز کا ریکارڈ۔', language)}
            </p>
          </div>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={t('Search batch...', 'تلاش کریں...', language)}
              className="w-full pl-8 pr-3 py-1.5 bg-theme-main border-none rounded outline-hidden focus:ring-1 focus:ring-orange-500 text-xs"
            />
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {[
            { label: 'Active', value: stats.activeBatches, icon: Package, color: 'text-indigo-600' },
            { label: 'Remaining', value: `${stats.totalRemaining.toLocaleString()}L`, icon: Droplets, color: 'text-blue-600' },
            { label: 'Expected PnL', value: `Rs.${stats.totalExpectedProfit.toLocaleString('en-PK', { maximumFractionDigits: 0 })}`, icon: TrendingUp, color: 'text-emerald-600' },
            { label: 'Realized', value: `Rs.${stats.totalRealizedMargin.toLocaleString('en-PK', { maximumFractionDigits: 0 })}`, icon: BarChart2, color: 'text-orange-600' },
          ].map((stat, i) => (
            <div key={i} className="bg-slate-50/50 dark:bg-slate-800/50 rounded-lg p-2 border border-theme-main">
              <p className="text-[9px] text-slate-500 dark:text-slate-400 flex items-center gap-1 mb-0.5 uppercase tracking-wide">
                <stat.icon className={`size-3 ${stat.color}`} />
                {stat.label}
              </p>
              <p className="font-bold text-slate-800 dark:text-slate-100 text-xs truncate">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2 mt-3 fp-date-tabs">
          {(['all', 'active', 'partial', 'exhausted'] as const).map(s => (
            <button key={s} onClick={() => setFilterStatus(s)}
              className={`fp-date-tab ${filterStatus === s ? 'fp-date-tab--active !text-slate-800 dark:!text-slate-100 !border-slate-800 dark:!border-slate-500 bg-slate-200/50 dark:bg-slate-700/50' : ''}`}>
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
          <div className="ml-auto flex items-center gap-1.5 text-[10px] text-slate-500 font-bold uppercase tracking-wide">
            Sort:
            {(['date', 'margin', 'remaining'] as const).map(s => (
              <button key={s} onClick={() => setSortBy(s)}
                className={`px-2 py-1 rounded transition-colors ${sortBy === s ? 'bg-orange-500/10 text-orange-600' : 'hover:bg-theme-main text-slate-400'}`}>
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto no-scrollbar">
        <table className="premium-table">
          <thead>
            <tr className="bg-theme-main text-[10px]">
              <th className="py-2.5 px-3">Batch Ref</th>
              <th className="py-2.5 px-3">Date</th>
              <th className="py-2.5 px-3">Product</th>
              <th className="py-2.5 px-3 text-right">Received</th>
              <th className="py-2.5 px-3 text-right">Remaining</th>
              <th className="py-2.5 px-3 text-right">Landed Cost</th>
              <th className="py-2.5 px-3">
                <div className="flex flex-col">
                  <span>Expected Margin</span>
                  <span className="text-[9px] text-slate-400 font-normal">Realized Margin</span>
                </div>
              </th>
              <th className="py-2.5 px-3 text-center">Age</th>
              <th className="py-2.5 px-3 text-center">Status</th>
            </tr>
          </thead>
          <tbody className="divide-theme-main">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-8 text-center text-slate-400 text-xs">
                  {t('No stock batches found.', 'کوئی اسٹاک بیچ نہیں ملا۔', language)}
                </td>
              </tr>
            ) : (
              filtered.map(batch => {
                const product = products.find(p => p.id === batch.productId);
                const days = getBatchAgingDays(batch);
                const aging = getAgingCategory(days);
                const expectedMargin = batch.expectedBatchMarginPerLiter ?? batch.grossMarginPerLiter ?? 0;
                const realizedMarginPL = batch.realizedMarginPerLiter ?? 0;
                const hasRealizedData = (batch.totalLitersSold ?? 0) > 0;
                const pctSold = batch.qtyReceived > 0 ? ((batch.totalLitersSold || 0) / batch.qtyReceived) * 100 : 0;
                const isExpanded = expandedId === batch.id;

                return (
                  <React.Fragment key={batch.id}>
                    <tr
                      className={`hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer ${aging.status === 'critical' && batch.status === 'active' ? 'bg-red-500/10' : ''}`}
                      onClick={() => setExpandedId(isExpanded ? null : batch.id)}
                    >
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-1.5">
                          <Hash className="size-3.5 text-slate-400" />
                          <span className="font-mono text-slate-700 dark:text-slate-200 font-bold text-[11px] bg-theme-main px-1.5 py-0.5 rounded">
                            {batch.batchNumber}
                          </span>
                          {batch.invoiceNumber && (
                            <span className="text-[10px] text-slate-400 hidden xl:inline">#{batch.invoiceNumber}</span>
                          )}
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400">
                        <div className="text-[11px]">
                          <div className="flex items-center gap-1">
                            <Clock className="size-3 text-slate-400" />
                            {new Date(batch.deliveryDate || batch.date).toLocaleDateString('en-PK', { day: '2-digit', month: 'short' })}
                          </div>
                          {batch.deliveryTime && <span className="text-slate-400 ml-4 text-[9px]">{batch.deliveryTime}</span>}
                        </div>
                      </td>
                      <td className="py-2.5 px-3 dark:text-slate-100">
                        {product ? t(product.name, product.urduName, language) : batch.productId}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-slate-600 dark:text-slate-300 text-[11px]">
                        {batch.qtyReceived.toLocaleString()}
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <div>
                          <span className={`font-bold font-mono text-[11px] ${batch.qtyRemaining > 0 ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'}`}>
                            {batch.qtyRemaining.toLocaleString()}
                          </span>
                          {pctSold > 0 && (
                            <div className="mt-1 flex flex-col items-end">
                              <div className="w-16"><MarginBar current={pctSold} max={100} /></div>
                              <p className="text-[9px] text-slate-400 mt-0.5">{pctSold.toFixed(0)}% sold</p>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <div>
                          <span className="font-mono font-bold text-slate-600 dark:text-slate-300 text-[11px]">
                            Rs.{batch.landedCostPerLiter.toFixed(2)}
                          </span>
                          {batch.invoiceCostPerLiter && batch.invoiceCostPerLiter !== batch.landedCostPerLiter && (
                            <p className="text-[9px] text-slate-400">Inv: Rs.{batch.invoiceCostPerLiter.toFixed(2)}</p>
                          )}
                        </div>
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="space-y-1">
                          {/* Expected Margin */}
                          <div className="flex items-center gap-1">
                            {expectedMargin > 0
                              ? <TrendingUp className="size-3 text-emerald-500 shrink-0" />
                              : <TrendingDown className="size-3 text-red-500 shrink-0" />
                            }
                            <span className={`font-bold text-[11px] ${expectedMargin > 0 ? 'text-emerald-700 dark:text-emerald-400' : 'text-red-600'}`}>
                              Rs.{expectedMargin.toFixed(2)}/L
                            </span>
                          </div>
                          <div className="w-20"><MarginBar current={expectedMargin} max={maxMargin} /></div>
                          {/* Realized Margin */}
                          {hasRealizedData && (
                            <div className="flex items-center gap-1 mt-0.5">
                              <span className="text-[9px] text-slate-400">Realized:</span>
                              <span className={`text-[9px] font-bold ${realizedMarginPL >= expectedMargin ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
                                Rs.{realizedMarginPL.toFixed(2)}
                                {realizedMarginPL >= expectedMargin ? ' ✅' : ' ⚠️'}
                              </span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        {batch.status !== 'depleted' && batch.status !== 'exhausted' ? (
                          <AgingBadge days={days} />
                        ) : <span className="text-slate-300 text-xs">—</span>}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <div className="flex flex-col items-center gap-1">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] uppercase tracking-wider font-bold border ${getStatusColor(batch)}`}>
                            {getStatusLabel(batch)}
                          </span>
                          {isExpanded ? <ChevronUp className="size-3 text-slate-400" /> : <ChevronDown className="size-3 text-slate-400" />}
                        </div>
                      </td>
                    </tr>

                    {/* Expanded Detail Row */}
                    {isExpanded && (
                      <tr className="bg-slate-50/80">
                        <td colSpan={9} className="px-4 pb-4 pt-2">
                          <div className="grid grid-cols-2 sm:grid-cols-2 sm:grid-cols-4 xl:grid-cols-6 gap-3 text-xs">
                            {[
                              { label: 'Invoice Total', value: batch.invoiceTotalAmount ? `Rs. ${batch.invoiceTotalAmount.toLocaleString('en-PK', { maximumFractionDigits: 0 })}` : '—' },
                              { label: 'Total Landed', value: batch.totalLandedCost ? `Rs. ${batch.totalLandedCost.toLocaleString('en-PK', { maximumFractionDigits: 0 })}` : '—' },
                              { label: 'Driver Tip', value: batch.driverTipAmount ? `Rs. ${batch.driverTipAmount}` : '—' },
                              { label: 'Carriage', value: batch.carriageAmount ? `Rs. ${batch.carriageAmount}` : (batch.supplierCarriageInvoiced ? 'In Invoice' : '—') },
                              { label: 'Exp. Margin Total', value: batch.expectedBatchMarginTotal ? `Rs. ${batch.expectedBatchMarginTotal.toLocaleString('en-PK', { maximumFractionDigits: 0 })}` : '—', highlight: 'emerald' },
                              { label: 'Realized Margin', value: batch.realizedMargin ? `Rs. ${batch.realizedMargin.toLocaleString('en-PK', { maximumFractionDigits: 0 })}` : 'Pending', highlight: 'blue' },
                              { label: 'Seal Status', value: batch.sealStatus ? batch.sealStatus.toUpperCase() : '—', highlight: batch.sealStatus === 'ok' ? 'emerald' : batch.sealStatus ? 'red' : undefined },
                              { label: 'Qty Short', value: batch.qtyShort ? `${batch.qtyShort}L ⚠️` : '0L ✅', highlight: batch.qtyShort ? 'orange' : 'emerald' },
                              { label: 'Driver', value: batch.driverName || '—' },
                              { label: 'Vehicle', value: batch.vehicleNumber || '—' },
                              { label: 'DO Number', value: batch.doNumber || '—' },
                              { label: 'Payment', value: batch.paymentMethod ? batch.paymentMethod.charAt(0).toUpperCase() + batch.paymentMethod.slice(1) : '—' },
                            ].map((item, i) => (
                              <div key={i} className={`rounded-lg p-2.5 border ${
                                item.highlight === 'emerald' ? 'bg-emerald-50 border-emerald-100 text-emerald-800' :
                                item.highlight === 'blue' ? 'bg-blue-50 border-blue-100 text-blue-800' :
                                item.highlight === 'orange' ? 'bg-orange-50 border-orange-100 text-orange-800' :
                                item.highlight === 'red' ? 'bg-red-50 border-red-100 text-red-800' :
                                'bg-white border-slate-200 text-slate-600'
                              }`}>
                                <p className="text-slate-400 mb-0.5">{item.label}</p>
                                <p className="font-bold">{item.value}</p>
                              </div>
                            ))}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
