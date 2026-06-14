import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  RefreshCw, TrendingUp, TrendingDown, Shield, CheckCircle2,
  AlertTriangle, ExternalLink, Zap, Clock
} from 'lucide-react';
import { GlobalSettings, Product } from '../../../types';
import { fetchWithAuth } from '../../../lib/api';

interface OGRAPriceEntry {
  product: string;
  productId: string;
  rate: number;
  previousRate: number;
  change: number;
}

interface OGRAResponse {
  source: string;
  sourceUrl: string;
  lastUpdated: string;
  currency: string;
  prices: OGRAPriceEntry[];
  note: string;
}

interface OGRAPriceSyncProps {
  settings: GlobalSettings;
  products: Product[];
  onApplyRates?: (updates: Array<{ productId: string; newRate: number }>) => void;
}

export default function OGRAPriceSync({ settings, products, onApplyRates }: OGRAPriceSyncProps) {
  const [ogra, setOgra] = useState<OGRAResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [appliedProductIds, setAppliedProductIds] = useState<string[]>([]);
  const [selectedMatches, setSelectedMatches] = useState<Record<string, string>>({});
  const [customAdjustments, setCustomAdjustments] = useState<Record<string, number>>({});

  const isUrdu = settings.language === 'ur';

  const fetchOGRAPrices = async () => {
    setLoading(true);
    setError('');
    setAppliedProductIds([]);
    try {
      const resp = await fetchWithAuth('/api/ogra-prices');
      if (!resp.ok) {
        let errText = 'Failed to fetch';
        try {
          const errData = await resp.json();
          errText = errData.error || `Error ${resp.status}: ${resp.statusText}`;
        } catch {
          errText = `HTTP Error ${resp.status}: ${resp.statusText}`;
        }
        throw new Error(errText);
      }
      const data: OGRAResponse = await resp.json();
      setOgra(data);

      // Auto-match OGRA products to station products
      const matches: Record<string, string> = {};
      data.prices.forEach(ogprice => {
        const match = products.find(p => {
          const lp = p.name.toLowerCase();
          const lo = ogprice.product.toLowerCase();
          const lid = ogprice.productId.toLowerCase();
          
          if (lid === 'petrol' && (lp.includes('petrol') || lp.includes('pmg') || lp.includes('super'))) return true;
          if (lid === 'diesel' && (lp.includes('diesel') || lp.includes('hsd'))) return true;
          if (lid === 'kerosene' && (lp.includes('kerosene') || lp.includes('sko'))) return true;
          if (lid === 'ldo' && (lp.includes('ldo') || lp.includes('light diesel'))) return true;
          
          return lp.includes(lid) || lp.includes(lo);
        });
        if (match) matches[ogprice.productId] = match.id;
      });
      setSelectedMatches(matches);
    } catch (err: any) {
      console.error('OGRA Fetch Error:', err);
      setError(isUrdu
        ? 'OGRA قیمتیں حاصل کرنے میں خرابی۔ ' + (err.message || '')
        : 'Failed to fetch OGRA prices. ' + (err.message || 'Check your internet connection.'));
    } finally {
      setLoading(false);
    }
  };

  const applySelected = () => {
    if (!ogra || !onApplyRates) return;
    const updates: Array<{ productId: string; newRate: number }> = [];
    ogra.prices.forEach(ogprice => {
      const stationProductId = selectedMatches[ogprice.productId];
      if (stationProductId) {
        const finalRate = ogprice.rate + (customAdjustments[ogprice.productId] || 0);
        updates.push({ productId: stationProductId, newRate: finalRate });
      }
    });
    onApplyRates(updates);
    setAppliedProductIds(Object.values(selectedMatches));
  };

  const getChangeColor = (change: number) =>
    change > 0 ? 'text-rose-600 bg-rose-50 border-rose-200' : change < 0 ? 'text-emerald-600 bg-emerald-50 border-emerald-200' : 'text-slate-600 bg-slate-50 border-slate-200';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-row items-center justify-between gap-4 bg-gradient-to-br from-emerald-600 to-teal-700 p-6 rounded-2xl text-white shadow-xl shadow-emerald-500/20 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-2 right-8 w-40 h-40 rounded-full bg-white" />
          <div className="absolute -bottom-10 -left-4 w-48 h-48 rounded-full bg-white" />
        </div>
        <div className="relative z-10">
          <span className="font-mono text-[9px] font-black text-emerald-100 uppercase tracking-widest block mb-1">
            PAKISTAN REGULATORY
          </span>
          <h1 className="font-sans text-2xl font-bold tracking-tight">
            {isUrdu ? 'OGRA قیمت سنک' : 'OGRA Price Sync'}
          </h1>
          <p className="font-sans text-sm text-emerald-100 mt-1">
            {isUrdu
              ? 'آئل اینڈ گیس ریگولیٹری اتھارٹی کی تازہ ترین سرکاری قیمتیں چیک کریں'
              : 'Check & apply the latest official Oil & Gas Regulatory Authority petroleum prices'}
          </p>
        </div>
        <div className="relative z-10 flex items-center gap-3">
          <a
            href="https://www.ogra.org.pk/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/20 hover:bg-white/30 transition-colors font-sans text-xs font-bold"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            ogra.org.pk
          </a>
          <button
            onClick={fetchOGRAPrices}
            disabled={loading}
            id="ogra_sync_btn"
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-emerald-700 font-sans text-sm font-bold shadow-md hover:bg-emerald-50 disabled:opacity-60 transition-all"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Fetching...' : (isUrdu ? 'قیمتیں چیک کریں' : 'Check Prices')}
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-rose-50 border border-rose-200">
          <AlertTriangle className="h-5 w-5 text-rose-500 shrink-0" />
          <p className="font-sans text-sm text-rose-700">{error}</p>
        </div>
      )}

      <AnimatePresence>
        {ogra && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            {/* Source info */}
            <div className="flex flex-wrap items-center gap-3 p-4 rounded-xl bg-[var(--bg-hover)] border border-[var(--border-main)]">
              <Shield className="h-5 w-5 text-emerald-600 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-sans text-xs font-bold text-[var(--text-main)]">{ogra.source}</p>
                <p className="font-sans text-xs text-[var(--text-muted)] truncate">
                  Last updated: {new Date(ogra.lastUpdated).toLocaleString('en-PK')}
                </p>
              </div>
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 font-sans text-xs font-bold">
                <Zap className="h-3 w-3" /> Live Data
              </span>
            </div>

            {/* Price Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {ogra.prices.map(price => {
                const matchedProductId = selectedMatches[price.productId];
                const matchedProduct = products.find(p => p.id === matchedProductId);
                const isApplied = matchedProductId && appliedProductIds.includes(matchedProductId);

                return (
                  <div
                    key={price.productId}
                    className={`rounded-2xl border bg-[var(--bg-card)] shadow-sm overflow-hidden transition-all ${isApplied ? 'border-emerald-300' : 'border-[var(--border-main)]'}`}
                  >
                    <div className="p-5 space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="font-sans text-sm font-bold text-[var(--text-main)]">{price.product}</h3>
                          <p className="font-mono text-2xl font-black text-[var(--text-main)] mt-1">
                            {settings.currency} {price.rate.toFixed(2)}
                          </p>
                          <p className="font-sans text-xs text-[var(--text-muted)]">per liter</p>
                        </div>
                        <div className={`flex items-center gap-1 px-2.5 py-1 rounded-lg border font-mono text-sm font-bold ${getChangeColor(price.change)}`}>
                          {price.change > 0 ? <TrendingUp className="h-4 w-4" /> : price.change < 0 ? <TrendingDown className="h-4 w-4" /> : null}
                          {price.change > 0 ? '+' : ''}{price.change.toFixed(2)}
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-xs text-[var(--text-muted)] border-t border-[var(--border-main)] pt-3">
                        <span>Previous: <span className="font-mono font-bold text-[var(--text-main)]">{settings.currency} {price.previousRate.toFixed(2)}</span></span>
                        <span className={`font-bold ${price.change > 0 ? 'text-rose-600' : price.change < 0 ? 'text-emerald-600' : 'text-slate-500'}`}>
                          {price.change > 0 ? '▲ Increased' : price.change < 0 ? '▼ Decreased' : '= Unchanged'}
                        </span>
                      </div>
                    </div>

                    {/* Match to station product */}
                    <div className="px-5 pb-4">
                      <label className="font-sans text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider block mb-1.5">
                        Match to your product
                      </label>
                      <select
                        value={matchedProductId || ''}
                        onChange={e => setSelectedMatches(prev => ({ ...prev, [price.productId]: e.target.value }))}
                        className="w-full rounded-lg border border-[var(--border-main)] bg-[var(--bg-hover)] px-3 py-2 font-sans text-xs text-[var(--text-main)] focus:border-emerald-500 focus:outline-none"
                      >
                        <option value="">— No match —</option>
                        {products.map(p => (
                          <option key={p.id} value={p.id}>{p.name} (current: {settings.currency} {p.rate})</option>
                        ))}
                      </select>

                      {(() => {
                        const adjustment = customAdjustments[price.productId] || 0;
                        const finalRate = price.rate + adjustment;
                        return (
                          <div className="mt-3">
                            <div className="flex items-center justify-between gap-2 mb-2 bg-[var(--bg-main)] rounded-lg p-2 border border-[var(--border-main)] shadow-sm">
                              <label className="font-sans text-[11px] font-bold text-[var(--text-main)]">
                                Union / Carriage Rate (+Rs):
                              </label>
                              <input
                                type="number"
                                step="0.01"
                                placeholder="0.00"
                                value={customAdjustments[price.productId] === undefined ? '' : customAdjustments[price.productId]}
                                onChange={e => setCustomAdjustments(prev => ({ ...prev, [price.productId]: e.target.value ? parseFloat(e.target.value) : 0 }))}
                                className="w-24 text-right rounded-md border border-[var(--border-main)] bg-[var(--bg-card)] px-2 py-1 font-mono text-sm font-bold text-[var(--text-main)] focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                              />
                            </div>
                            
                            {matchedProduct && (
                              <p className={`font-sans text-xs font-medium ${finalRate > matchedProduct.rate ? 'text-rose-600' : finalRate < matchedProduct.rate ? 'text-emerald-600' : 'text-slate-500'}`}>
                                Final Rate vs Current: {settings.currency} {matchedProduct.rate} → {settings.currency} {finalRate.toFixed(2)}
                                {' '}({finalRate > matchedProduct.rate ? '+' : ''}{(finalRate - matchedProduct.rate).toFixed(2)})
                              </p>
                            )}
                            {!matchedProduct && (
                              <p className="font-sans text-xs font-medium text-slate-500">
                                Final Rate: {settings.currency} {finalRate.toFixed(2)} (Select a match to apply)
                              </p>
                            )}
                          </div>
                        );
                      })()}

                      {isApplied && (
                        <div className="flex items-center gap-1.5 mt-2">
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                          <span className="font-sans text-xs font-bold text-emerald-700">Rate applied to inventory</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Apply Button */}
            {onApplyRates && (
              <div className="flex flex-row items-start items-center gap-4 p-5 rounded-2xl bg-amber-50 border border-amber-200">
                <div className="flex items-start gap-3 flex-1">
                  <Clock className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-sans text-sm font-bold text-amber-800">Ready to Save Final Rates</p>
                    <p className="font-sans text-xs text-amber-700 mt-0.5">
                      {ogra.note}
                    </p>
                  </div>
                </div>
                <button
                  onClick={applySelected}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 text-white font-sans text-sm font-bold shadow-md hover:bg-emerald-700 transition-colors whitespace-nowrap"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  {isUrdu ? 'قیمتیں محفوظ کریں' : 'Save Rates'}
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {!ogra && !loading && (
        <div className="flex flex-col items-center justify-center min-h-[200px] rounded-2xl border-2 border-dashed border-[var(--border-main)] text-center p-10">
          <Shield className="h-12 w-12 text-emerald-200 mb-4" />
          <h3 className="font-sans text-base font-bold text-[var(--text-main)]">
            {isUrdu ? 'OGRA سے قیمتیں حاصل کریں' : 'Fetch Official OGRA Rates'}
          </h3>
          <p className="font-sans text-sm text-[var(--text-muted)] mt-2 max-w-sm">
            Click "Check Prices" to get the latest official petroleum product prices from OGRA Pakistan and apply them to your station inventory.
          </p>
        </div>
      )}
    </div>
  );
}
