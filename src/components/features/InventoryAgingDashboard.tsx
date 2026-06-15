/**
 * FuelPro — Inventory Aging Intelligence Dashboard
 * 4-tier aging: Fresh → Watch → Critical → Emergency
 * Powered by Umar Ali ⚡ | Motorway Petroleum, Mardan KPK
 */
import React, { useMemo, useState } from 'react';
import {
  Clock, AlertTriangle, Flame, Zap, CheckCircle, Package,
  TrendingDown, BarChart2, Droplets, Filter, ChevronDown, ChevronUp
} from 'lucide-react';
import { StockBatch, Product, Supplier } from '../../types';
import { getBatchAgingDays } from '../../services/fifoEngine';

interface InventoryAgingDashboardProps {
  batches: StockBatch[];
  products: Product[];
  suppliers: Supplier[];
  language: string;
}

// ─── 4-Tier Aging Classification ─────────────────────────────────────────────
export type AgingTier = 'fresh' | 'watch' | 'critical' | 'emergency';

interface AgingTierConfig {
  tier: AgingTier;
  label: string;
  range: string;
  color: string;
  bgCard: string;
  borderCard: string;
  badgeBg: string;
  badgeText: string;
  icon: React.ElementType;
  pulse: boolean;
  action: string;
}

const AGING_TIERS: AgingTierConfig[] = [
  {
    tier: 'fresh', label: 'Fresh', range: '0–30 Days',
    color: 'text-emerald-600', bgCard: 'bg-emerald-50', borderCard: 'border-emerald-200',
    badgeBg: 'bg-emerald-100', badgeText: 'text-emerald-700',
    icon: CheckCircle, pulse: false, action: 'Normal operations',
  },
  {
    tier: 'watch', label: 'Watch', range: '31–60 Days',
    color: 'text-amber-600', bgCard: 'bg-amber-50', borderCard: 'border-amber-200',
    badgeBg: 'bg-amber-100', badgeText: 'text-amber-700',
    icon: Clock, pulse: false, action: 'Monitor closely',
  },
  {
    tier: 'critical', label: 'Critical', range: '61–90 Days',
    color: 'text-orange-600', bgCard: 'bg-orange-50', borderCard: 'border-orange-200',
    badgeBg: 'bg-orange-100', badgeText: 'text-orange-700',
    icon: AlertTriangle, pulse: true, action: 'Prioritize dispensing',
  },
  {
    tier: 'emergency', label: 'Emergency', range: '90+ Days',
    color: 'text-red-600', bgCard: 'bg-red-50', borderCard: 'border-red-200',
    badgeBg: 'bg-red-100', badgeText: 'text-red-700',
    icon: Flame, pulse: true, action: 'Immediate review required',
  },
];

function getTierForDays(days: number): AgingTierConfig {
  if (days <= 30) return AGING_TIERS[0];
  if (days <= 60) return AGING_TIERS[1];
  if (days <= 90) return AGING_TIERS[2];
  return AGING_TIERS[3];
}

interface BatchWithAging extends StockBatch {
  agingDays: number;
  tier: AgingTierConfig;
  exposureValue: number; // qtyRemaining × landedCostPerLiter
  potentialRevenue: number; // qtyRemaining × ograPumpPrice
}

export default function InventoryAgingDashboard({
  batches, products, suppliers, language
}: InventoryAgingDashboardProps) {
  const t = (en: string, ur: string) => language === 'ur' ? ur : en;
  const [filterTier, setFilterTier] = useState<AgingTier | 'all'>('all');
  const [filterProduct, setFilterProduct] = useState('all');
  const [expandedBatchId, setExpandedBatchId] = useState<string | null>(null);

  // Only active batches with remaining stock
  const activeBatches = useMemo<BatchWithAging[]>(() => {
    return batches
      .filter(b => b.qtyRemaining > 0 && b.status !== 'depleted' && b.status !== 'exhausted')
      .map(b => {
        const days = getBatchAgingDays(b);
        const tier = getTierForDays(days);
        return {
          ...b,
          agingDays: days,
          tier,
          exposureValue: b.qtyRemaining * b.landedCostPerLiter,
          potentialRevenue: b.qtyRemaining * b.ograPumpPrice,
        };
      })
      .filter(b => {
        if (filterTier !== 'all' && b.tier.tier !== filterTier) return false;
        if (filterProduct !== 'all' && b.productId !== filterProduct) return false;
        return true;
      })
      .sort((a, b) => b.agingDays - a.agingDays); // Oldest first
  }, [batches, filterTier, filterProduct]);

  // Tier summaries (pre-filter, for the header cards)
  const tierStats = useMemo(() => {
    const active = batches.filter(b => b.qtyRemaining > 0 && b.status !== 'depleted' && b.status !== 'exhausted');
    return AGING_TIERS.map(tier => {
      const inTier = active.filter(b => getTierForDays(getBatchAgingDays(b)).tier === tier.tier);
      return {
        ...tier,
        count: inTier.length,
        totalQty: inTier.reduce((s, b) => s + b.qtyRemaining, 0),
        totalExposure: inTier.reduce((s, b) => s + b.qtyRemaining * b.landedCostPerLiter, 0),
      };
    });
  }, [batches]);

  // Overall exposure metrics
  const exposure = useMemo(() => {
    const all = batches.filter(b => b.qtyRemaining > 0 && b.status !== 'depleted' && b.status !== 'exhausted');
    const totalStockValue = all.reduce((s, b) => s + b.qtyRemaining * b.landedCostPerLiter, 0);
    const totalPotentialRevenue = all.reduce((s, b) => s + b.qtyRemaining * b.ograPumpPrice, 0);
    const expectedMargin = totalPotentialRevenue - totalStockValue;
    const atRiskBatches = all.filter(b => getBatchAgingDays(b) > 60);
    const inventoryAtRisk = atRiskBatches.reduce((s, b) => s + b.qtyRemaining * b.landedCostPerLiter, 0);
    return { totalStockValue, totalPotentialRevenue, expectedMargin, inventoryAtRisk, atRiskCount: atRiskBatches.length };
  }, [batches]);

  // By-product breakdown
  const byProduct = useMemo(() => {
    const map = new Map<string, { product: Product | undefined; qty: number; value: number; maxDays: number }>();
    const active = batches.filter(b => b.qtyRemaining > 0 && b.status !== 'depleted' && b.status !== 'exhausted');
    for (const b of active) {
      const days = getBatchAgingDays(b);
      const existing = map.get(b.productId) || { product: products.find(p => p.id === b.productId), qty: 0, value: 0, maxDays: 0 };
      map.set(b.productId, {
        ...existing,
        qty: existing.qty + b.qtyRemaining,
        value: existing.value + b.qtyRemaining * b.landedCostPerLiter,
        maxDays: Math.max(existing.maxDays, days),
      });
    }
    return Array.from(map.values()).sort((a, b) => b.maxDays - a.maxDays);
  }, [batches, products]);

  const hasCritical = tierStats[2].count + tierStats[3].count > 0;

  // Unique products for filter
  const activeProductIds = [...new Set(batches.filter(b => b.qtyRemaining > 0).map(b => b.productId))];
  const activeProducts = products.filter(p => activeProductIds.includes(p.id));

  return (
    <div className="space-y-3">
      {/* Critical alert banner */}
      {hasCritical && (
        <div className="bg-gradient-to-r from-red-600 to-orange-600 rounded-lg p-3 text-white shadow-xs flex items-center gap-3">
          <Flame className="size-6 shrink-0 animate-pulse" />
          <div className="flex-1">
            <p className="font-black text-sm">
              {t('⚠️ Aging Alert', '⚠️ پرانا اسٹاک')} — {tierStats[2].count + tierStats[3].count} {t('batches require immediate action', 'بیچز فوری توجہ مانگتے ہیں')}
            </p>
            <p className="text-red-100 text-[10px] mt-0.5">
              {t(`Inventory at risk: Rs.${exposure.inventoryAtRisk.toLocaleString('en-PK', { maximumFractionDigits: 0 })} · ${exposure.atRiskCount} batches over 60 days old.`,
                `خطرے میں اسٹاک: Rs.${exposure.inventoryAtRisk.toLocaleString('en-PK', { maximumFractionDigits: 0 })} · ${exposure.atRiskCount} بیچز 60 دن سے زیادہ پرانے ہیں۔`
              )}
            </p>
          </div>
        </div>
      )}

      {/* Exposure Engine */}
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-lg p-3 text-white shadow-xs">
        <div className="flex items-center gap-2 mb-2">
          <BarChart2 className="size-4 text-orange-400" />
          <h3 className="font-bold text-xs uppercase tracking-widest text-slate-300">{t('Inventory Exposure Engine', 'انوینٹری ایکسپوژر انجن')}</h3>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {[
            { label: t('Current Stock Value', 'موجودہ اسٹاک قیمت'), value: `Rs.${(exposure.totalStockValue / 1000000).toFixed(2)}M`, sub: 'Landed Cost × Qty Remaining', color: 'text-blue-300' },
            { label: t('Potential Revenue', 'ممکنہ آمدنی'), value: `Rs.${(exposure.totalPotentialRevenue / 1000000).toFixed(2)}M`, sub: 'OGRA Price × Qty Remaining', color: 'text-emerald-300' },
            { label: t('Expected Margin', 'متوقع منافع'), value: `Rs.${(exposure.expectedMargin / 1000).toFixed(0)}K`, sub: 'Revenue − Landed Cost', color: 'text-yellow-300' },
            { label: t('Inventory At Risk', 'خطرے میں اسٹاک'), value: `Rs.${(exposure.inventoryAtRisk / 1000).toFixed(0)}K`, sub: `${exposure.atRiskCount} batches 60+ days`, color: exposure.inventoryAtRisk > 0 ? 'text-red-300' : 'text-emerald-300' },
          ].map((s, i) => (
            <div key={i} className="bg-white/10 rounded-lg p-2 backdrop-blur-xs">
              <p className="text-slate-400 text-[9px] font-semibold uppercase tracking-wide">{s.label}</p>
              <p className={`text-base font-black ${s.color} mt-0.5`}>{s.value}</p>
              <p className="text-slate-500 text-[9px] mt-0.5 leading-tight">{s.sub}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Tier Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {tierStats.map(ts => {
          const TierIcon = ts.icon;
          return (
            <button
              key={ts.tier}
              onClick={() => setFilterTier(filterTier === ts.tier ? 'all' : ts.tier)}
              className={`rounded-lg p-3 border text-left transition-all hover:shadow-xs ${
                filterTier === ts.tier ? `${ts.bgCard} ${ts.borderCard} shadow-xs ring-1 ring-offset-1 ${ts.borderCard}` : 'bg-white dark:bg-slate-800 border-theme-main'
              }`}
            >
              <div className="flex items-center gap-1.5 mb-1.5">
                <TierIcon className={`size-3.5 ${ts.color} ${ts.pulse ? 'animate-pulse' : ''}`} />
                <span className={`text-[9px] font-black uppercase tracking-widest ${ts.color}`}>{ts.label}</span>
              </div>
              <p className="text-xl font-black text-slate-800 dark:text-slate-100">{ts.count}</p>
              <p className="text-[10px] text-slate-400 font-semibold">{ts.range}</p>
              {ts.count > 0 && (
                <>
                  <p className="text-[10px] font-bold text-slate-600 dark:text-slate-400 mt-1">{ts.totalQty.toLocaleString()}L remaining</p>
                  <p className="text-[9px] text-slate-400">Rs.{(ts.totalExposure / 1000).toFixed(0)}K exposure</p>
                </>
              )}
            </button>
          );
        })}
      </div>

      {/* Aging By Product */}
      <div className="kpi-card p-3">
        <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-1.5">
          <Droplets className="size-3.5" />
          {t('Aging by Product', 'مصنوع کے مطابق پرانا پن')}
        </h3>
        <div className="space-y-2">
          {byProduct.map(({ product, qty, value, maxDays }) => {
            const tier = getTierForDays(maxDays);
            const TierIcon = tier.icon;
            return (
              <div key={product?.id || 'unknown'} className="flex items-center gap-2">
                <div className={`size-6 rounded flex items-center justify-center shrink-0 ${tier.badgeBg}`}>
                  <TierIcon className={`size-3 ${tier.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center mb-0.5">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{product?.name || 'Unknown'}</span>
                    <span className={`text-[9px] font-black px-1.5 py-0.5 rounded ${tier.badgeBg} ${tier.badgeText}`}>
                      Max {maxDays}d — {tier.label}
                    </span>
                  </div>
                  <div className="h-1.5 bg-theme-main rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${tier.tier === 'fresh' ? 'bg-emerald-500' : tier.tier === 'watch' ? 'bg-amber-400' : tier.tier === 'critical' ? 'bg-orange-500' : 'bg-red-600'}`}
                      style={{ width: `${Math.min(100, (maxDays / 120) * 100)}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[9px] text-slate-400 mt-0.5 font-mono">
                    <span>{qty.toLocaleString()}L remaining</span>
                    <span>Rs.{(value / 1000).toFixed(0)}K exposure</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Batch List */}
      <div className="kpi-card overflow-hidden">
        <div className="p-3 border-b border-theme-main flex flex-row gap-3 items-center justify-between">
          <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
            <Package className="size-3.5" />
            {t('Batch Aging Detail', 'بیچ پرانا پن تفصیل')}
            {activeBatches.length > 0 && (
              <span className="bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 px-1.5 py-0.5 rounded font-black text-[9px]">{activeBatches.length}</span>
            )}
          </h3>
          <select
            value={filterProduct}
            onChange={e => setFilterProduct(e.target.value)}
            className="text-[10px] border-none rounded px-2 py-1 bg-theme-main text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-orange-500 uppercase font-bold"
          >
            <option value="all">All Products</option>
            {activeProducts.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>

        <div className="divide-y divide-theme-main">
          {activeBatches.length === 0 ? (
            <div className="py-8 text-center text-slate-400 text-xs">
              <Package className="size-8 mx-auto mb-2 opacity-30" />
              <p>{t('No active batches found.', 'کوئی بیچ نہیں ملا۔')}</p>
            </div>
          ) : (
            activeBatches.map(b => {
              const product = products.find(p => p.id === b.productId);
              const supplier = suppliers.find(s => s.id === b.supplierId);
              const TierIcon = b.tier.icon;
              const isExpanded = expandedBatchId === b.id;

              return (
                <div key={b.id} className={`${b.tier.tier === 'emergency' ? 'bg-red-500/10' : b.tier.tier === 'critical' ? 'bg-orange-500/10' : ''}`}>
                  <div
                    className="p-3 flex items-center gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors"
                    onClick={() => setExpandedBatchId(isExpanded ? null : b.id)}
                  >
                    {/* Aging days badge */}
                    <div className={`size-10 rounded flex flex-col items-center justify-center shrink-0 border ${b.tier.badgeBg} ${b.tier.borderCard}`}>
                      <span className={`text-base font-black leading-none ${b.tier.color}`}>{b.agingDays}</span>
                      <span className="text-[8px] text-slate-500 font-bold uppercase">days</span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-xs font-bold text-slate-700 dark:text-slate-200">{b.batchNumber}</span>
                        <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold ${b.tier.badgeBg} ${b.tier.badgeText}`}>
                          <TierIcon className="size-2.5" />
                          {b.tier.label} — {b.tier.range}
                        </span>
                        {b.qualityStatus === 'quarantined' && (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-purple-500/20 text-purple-600">
                            🔒 Quarantined
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-500 mt-0.5">
                        {product?.name} · {supplier?.name || '—'} · {new Date(b.deliveryDate || b.date).toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: '2-digit' })}
                      </p>
                    </div>

                    <div className="text-right shrink-0 hidden sm:block">
                      <p className="text-xs font-black text-slate-800 dark:text-slate-200">{b.qtyRemaining.toLocaleString()}L</p>
                      <p className="text-[10px] text-slate-400">Rs.{(b.exposureValue / 1000).toFixed(0)}K</p>
                    </div>

                    <div className="text-right shrink-0">
                      <p className={`text-[10px] font-bold ${b.tier.color}`}>{b.tier.action}</p>
                      {isExpanded ? <ChevronUp className="size-3 text-slate-400 ml-auto mt-1" /> : <ChevronDown className="size-3 text-slate-400 ml-auto mt-1" />}
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="px-3 pb-3 pt-0">
                      <div className="bg-theme-main rounded border border-theme-main p-2 grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px]">
                        {[
                          { label: 'Invoice #', value: b.invoiceNumber || '—' },
                          { label: 'Received', value: `${b.qtyReceived.toLocaleString()}L` },
                          { label: 'Remaining', value: `${b.qtyRemaining.toLocaleString()}L` },
                          { label: 'Sold %', value: `${b.qtyReceived > 0 ? (((b.totalLitersSold || 0) / b.qtyReceived) * 100).toFixed(1) : '0'}%` },
                          { label: 'Landed Cost', value: `Rs.${b.landedCostPerLiter.toFixed(2)}/L` },
                          { label: 'OGRA Price', value: `Rs.${b.ograPumpPrice.toFixed(2)}/L` },
                          { label: 'Exp. Margin', value: `Rs.${((b.expectedBatchMarginPerLiter || 0)).toFixed(2)}/L`, highlight: 'emerald' },
                          { label: 'Exposure', value: `Rs.${(b.exposureValue / 1000).toFixed(1)}K`, highlight: b.tier.tier === 'emergency' ? 'red' : b.tier.tier === 'critical' ? 'orange' : '' },
                        ].map((item, i) => (
                          <div key={i} className={`rounded p-1.5 border ${
                            item.highlight === 'emerald' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600' :
                            item.highlight === 'red' ? 'bg-red-500/10 border-red-500/20 text-red-600' :
                            item.highlight === 'orange' ? 'bg-orange-500/10 border-orange-500/20 text-orange-600' :
                            'bg-slate-50/50 dark:bg-slate-800/50 border-theme-main text-slate-600 dark:text-slate-400'
                          }`}>
                            <p className="text-slate-400 mb-0.5">{item.label}</p>
                            <p className="font-bold">{item.value}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
