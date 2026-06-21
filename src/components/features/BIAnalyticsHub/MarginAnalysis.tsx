import React, { useState, useEffect } from 'react';
import { GlobalSettings, Shift, Tank, Nozzle, Product } from '../../../types';
import { db } from '../../../data/db';
import { TrendingUp, TrendingDown, DollarSign } from 'lucide-react';

interface MarginAnalysisProps {
  settings: GlobalSettings;
  stationId: string;
}

export default function MarginAnalysis({ settings, stationId }: MarginAnalysisProps) {
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [tanks, setTanks] = useState<Tank[]>([]);
  const [nozzles, setNozzles] = useState<Nozzle[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    setShifts(db.getShifts(stationId));
    setTanks(db.getTanks(stationId));
    setNozzles(db.getNozzles(stationId));
    setProducts(db.getProducts(stationId));
  }, [stationId]);

  const getProductStats = (productId: string) => {
    let volume = 0;
    let revenue = 0;

    shifts.forEach(s => {
      if (!s.closingReadings || !s.openingReadings) return;
      Object.keys(s.closingReadings).forEach(nozzleId => {
        const nozzle = nozzles.find(n => n.id === nozzleId);
        if (!nozzle || nozzle.productId !== productId) return;

        const nozzleVol = Math.max(0, (s.closingReadings[nozzleId] || 0) - (s.openingReadings[nozzleId] || 0));
        const nozzleRate = (s as any).rates?.[productId] || products.find(p => p.id === productId)?.rate || 0;
        volume += nozzleVol;
        revenue += (nozzleVol * nozzleRate);
      });
    });

    const product = products.find(p => p.id === productId);
    const avgSellingPrice = volume > 0 ? revenue / volume : (product?.rate || 0);
    
    const purchasePrice = product?.purchasePrice || 0;
    // CRITICAL RULE 4: effectiveMargin = sellingPrice - purchasePrice - additionalCosts
    // Currently, additional costs are 0 natively but formula is ready for future expansion
    const additionalCosts = 0; // e.g., Freight, Leakage, Operational Cost

    const marginPerLiter = avgSellingPrice > 0 ? avgSellingPrice - purchasePrice - additionalCosts : 0;
    const totalProfit = volume * marginPerLiter;
    const marginPercent = avgSellingPrice > 0 ? (marginPerLiter / avgSellingPrice) * 100 : 0;

    return { volume, revenue, avgSellingPrice, purchasePrice, additionalCosts, marginPerLiter, totalProfit, marginPercent };
  };

  return (
    <div className="space-y-4">
      <div className="premium-card p-6 border">
        <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-emerald-500" />
          Real Gross Margin Analysis by Product
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {products.map(product => {
            const stats = getProductStats(product.id);
            const isProfitable = stats.marginPercent >= 0;

            return (
              <div key={product.id} className="border border-slate-100 rounded-xl p-5 bg-slate-50/50">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h4 className="font-black text-lg text-slate-900">{product.name}</h4>
                    <span className="text-xs text-slate-500">{stats.volume.toLocaleString()} L Sold Total</span>
                  </div>
                  <div className={`p-2 rounded-full ${isProfitable ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                    {isProfitable ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-500">Selling Price</span>
                    <span className="font-mono font-bold text-slate-700">{settings.currency} {stats.avgSellingPrice.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-500">Unit Cost</span>
                    <span className="font-mono font-bold text-slate-700">{settings.currency} {stats.purchasePrice.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm border-b border-slate-200 pb-2">
                    <span className="text-slate-500">Additional Costs</span>
                    <span className="font-mono font-bold text-slate-700">{settings.currency} {stats.additionalCosts.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm pt-1">
                    <span className="font-bold text-slate-800">Effective Margin / L</span>
                    <span className={`font-mono font-black ${isProfitable ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {settings.currency} {stats.marginPerLiter.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="font-bold text-slate-800">Gross Margin %</span>
                    <span className={`font-mono font-black ${isProfitable ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {stats.marginPercent.toFixed(1)}%
                    </span>
                  </div>
                </div>

                <div className="mt-5 pt-4 border-t border-slate-200">
                  <div className="text-xs text-slate-500 uppercase font-bold mb-1">Total Effective Profit</div>
                  <div className="text-xl font-black font-mono text-slate-900">
                    {settings.currency} {stats.totalProfit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                </div>
              </div>
            );
          })}
          {products.length === 0 && (
            <div className="col-span-full py-12 text-center text-slate-500 text-sm border-2 border-dashed border-slate-200 rounded-xl bg-slate-50">
              No products configured. Please set up products in settings first.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
