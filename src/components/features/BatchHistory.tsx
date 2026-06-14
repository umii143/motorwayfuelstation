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
    <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-slate-100">
        <div className="flex flex-row justify-between gap-4 items-center mb-4">
          <div>
            <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
              <Package className="size-5 text-indigo-600" />
              <span>{t('FIFO Batch Ledger', 'بیچ لیجر (FIFO)', language)}</span>
            </h3>
            <p className="text-sm text-slate-500 mt-0.5">
              {t('Tracking active and exhausted stock batches for precise cost calculations.', 'دقیق قیمت کے حساب کے لیے بیچز کا ریکارڈ۔', language)}
            </p>
          </div>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={t('Search batch, invoice...', 'تلاش کریں...', language)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white text-sm"
            />
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Active Batches', value: stats.activeBatches, icon: Package, color: 'text-indigo-600' },
            { label: 'Total Remaining', value: `${stats.totalRemaining.toLocaleString()}L`, icon: Droplets, color: 'text-blue-600' },
            { label: 'Expected Profit', value: `Rs.${stats.totalExpectedProfit.toLocaleString('en-PK', { maximumFractionDigits: 0 })}`, icon: TrendingUp, color: 'text-emerald-600' },
            { label: 'Realized Margin', value: `Rs.${stats.totalRealizedMargin.toLocaleString('en-PK', { maximumFractionDigits: 0 })}`, icon: BarChart2, color: 'text-orange-600' },
          ].map((stat, i) => (
            <div key={i} className="bg-slate-50 rounded-xl p-3 border border-slate-100">
              <p className="text-xs text-slate-500 flex items-center gap-1 mb-1">
                <stat.icon className={`size-3.5 ${stat.color}`} />
                {stat.label}
              </p>
              <p className="font-bold text-slate-800 text-sm">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2 mt-4">
          {(['all', 'active', 'partial', 'exhausted'] as const).map(s => (
            <button key={s} onClick={() => setFilterStatus(s)}
              className={`px-3 py-1 rounded-full text-xs font-semibold border transition-colors ${filterStatus === s ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'}`}>
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
          <div className="ml-auto flex items-center gap-2 text-xs text-slate-500">
            Sort:
            {(['date', 'margin', 'remaining'] as const).map(s => (
              <button key={s} onClick={() => setSortBy(s)}
                className={`px-2 py-1 rounded ${sortBy === s ? 'bg-indigo-50 text-indigo-600 font-bold' : 'hover:bg-slate-50'}`}>
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left font-sans text-sm">
          <thead>
            <tr className="bg-slate-50 text-slate-500">
              <th className="py-4 px-4 font-semibold">Batch Ref</th>
              <th className="py-4 px-4 font-semibold">Date</th>
              <th className="py-4 px-4 font-semibold">Product</th>
              <th className="py-4 px-4 font-semibold text-right">Received</th>
              <th className="py-4 px-4 font-semibold text-right">Remaining</th>
              <th className="py-4 px-4 font-semibold text-right">Landed Cost</th>
              <th className="py-4 px-4 font-semibold">
                <div className="flex flex-col">
                  <span>Expected Margin</span>
                  <span className="text-xs text-slate-400 font-normal">Realized Margin</span>
                </div>
              </th>
              <th className="py-4 px-4 font-semibold text-center">Age</th>
              <th className="py-4 px-4 font-semibold text-center">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-12 text-center text-slate-400">
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
                      className={`hover:bg-slate-50/50 transition-colors cursor-pointer ${aging.status === 'critical' && batch.status === 'active' ? 'bg-red-50/30' : ''}`}
                      onClick={() => setExpandedId(isExpanded ? null : batch.id)}
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <Hash className="size-4 text-slate-400" />
                          <span className="font-mono text-slate-700 font-medium text-xs bg-slate-100 px-2 py-0.5 rounded-md">
                            {batch.batchNumber}
                          </span>
                          {batch.invoiceNumber && (
                            <span className="text-xs text-slate-400 hidden xl:inline">#{batch.invoiceNumber}</span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        <div className="text-xs">
                          <div className="flex items-center gap-1">
                            <Clock className="size-3 text-slate-400" />
                            {new Date(batch.deliveryDate || batch.date).toLocaleDateString('en-PK', { day: '2-digit', month: 'short' })}
                          </div>
                          {batch.deliveryTime && <span className="text-slate-400 ml-4">{batch.deliveryTime}</span>}
                        </div>
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-800 text-sm">
                        {product ? t(product.name, product.urduName, language) : batch.productId}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-medium text-slate-600 text-sm">
                        {batch.qtyReceived.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div>
                          <span className={`font-bold font-mono text-sm ${batch.qtyRemaining > 0 ? 'text-indigo-600' : 'text-slate-400'}`}>
                            {batch.qtyRemaining.toLocaleString()}
                          </span>
                          {pctSold > 0 && (
                            <div className="mt-1">
                              <MarginBar current={pctSold} max={100} />
                              <p className="text-xs text-slate-400 text-right mt-0.5">{pctSold.toFixed(0)}% sold</p>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div>
                          <span className="font-mono font-medium text-slate-600 text-sm">
                            Rs. {batch.landedCostPerLiter.toFixed(2)}
                          </span>
                          {batch.invoiceCostPerLiter && batch.invoiceCostPerLiter !== batch.landedCostPerLiter && (
                            <p className="text-xs text-slate-400">Invoice: Rs.{batch.invoiceCostPerLiter.toFixed(2)}</p>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="space-y-1">
                          {/* Expected Margin */}
                          <div className="flex items-center gap-1.5">
                            {expectedMargin > 0
                              ? <TrendingUp className="size-3.5 text-emerald-500 shrink-0" />
                              : <TrendingDown className="size-3.5 text-red-500 shrink-0" />
                            }
                            <span className={`font-bold text-sm ${expectedMargin > 0 ? 'text-emerald-700' : 'text-red-600'}`}>
                              Rs. {expectedMargin.toFixed(2)}/L
                            </span>
                          </div>
                          <MarginBar current={expectedMargin} max={maxMargin} />
                          {/* Realized Margin */}
                          {hasRealizedData && (
                            <div className="flex items-center gap-1.5 mt-1">
                              <span className="text-xs text-slate-400">Realized:</span>
                              <span className={`text-xs font-semibold ${realizedMarginPL >= expectedMargin ? 'text-emerald-600' : 'text-amber-600'}`}>
                                Rs. {realizedMarginPL.toFixed(2)}/L
                                {realizedMarginPL >= expectedMargin ? ' ✅' : ' ⚠️'}
                              </span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        {batch.status !== 'depleted' && batch.status !== 'exhausted' ? (
                          <AgingBadge days={days} />
                        ) : <span className="text-slate-300 text-xs">—</span>}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex flex-col items-center gap-1">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border ${getStatusColor(batch)}`}>
                            {getStatusLabel(batch)}
                          </span>
                          {isExpanded ? <ChevronUp className="size-3.5 text-slate-400" /> : <ChevronDown className="size-3.5 text-slate-400" />}
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
