import React, { useState, useEffect } from 'react';
import { GlobalSettings, Shift, Tank, Nozzle, Product } from '../../../types';
import { db } from '../../../data/db';
import { TrendingUp, TrendingDown, DollarSign } from 'lucide-react';

interface MarginAnalysisProps {
  settings: GlobalSettings;
  stationId: string;
}

const getFuelTypeFromProductName = (name: string) => {
  const lower = name.toLowerCase();
  if (lower.includes('octane') || lower.includes('hobc') || lower.includes('v-power') || lower.includes('high')) {
    return 'V-Power';
  }
  if (lower.includes('diesel') || lower.includes('hsd') || lower.includes('euro')) {
    return 'Diesel';
  }
  return 'Super'; // default to Super / PMG / Petrol
};

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

  // We will mock cost prices to demonstrate margin analysis if actual costs aren't available per sale.
  // In a real system, cost is pulled from TankerDeliveries (FIFO).
  const mockCosts: Record<string, number> = {
    'Super': 140,
    'Diesel': 130,
    'V-Power': 160
  };

  const getFuelTypeStats = (type: string) => {
    let volume = 0;
    let revenue = 0;

    shifts.forEach(s => {
      if (!s.closingReadings || !s.openingReadings) return;
      Object.keys(s.closingReadings).forEach(nozzleId => {
        const nozzle = nozzles.find(n => n.id === nozzleId);
        if (!nozzle) return;
        const product = products.find(p => p.id === nozzle.productId);
        if (!product) return;
        const fuelType = getFuelTypeFromProductName(product.name);
        if (fuelType !== type) return;

        const nozzleVol = Math.max(0, (s.closingReadings[nozzleId] || 0) - (s.openingReadings[nozzleId] || 0));
        const nozzleRate = (s as any).rates?.[product.id] || product.rate || 0;
        volume += nozzleVol;
        revenue += (nozzleVol * nozzleRate);
      });
    });

    const avgSellingPrice = volume > 0 ? revenue / volume : 0;
    
    const estCost = mockCosts[type] || 0;
    const marginPerLiter = avgSellingPrice > 0 ? avgSellingPrice - estCost : 0;
    const totalProfit = volume * marginPerLiter;
    const marginPercent = avgSellingPrice > 0 ? (marginPerLiter / avgSellingPrice) * 100 : 0;

    return { volume, revenue, avgSellingPrice, estCost, marginPerLiter, totalProfit, marginPercent };
  };

  const fuelTypes = ['Super', 'Diesel', 'V-Power'];

  return (
    <div className="space-y-4">
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-emerald-500" />
          Gross Margin Analysis by Fuel Grade
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-1 lg:grid-cols-3 gap-6">
          {fuelTypes.map(type => {
            const stats = getFuelTypeStats(type);
            const isProfitable = stats.marginPercent > 0;

            return (
              <div key={type} className="border border-slate-100 rounded-xl p-5 bg-slate-50/50">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h4 className="font-black text-lg text-slate-900">{type}</h4>
                    <span className="text-xs text-slate-500">{stats.volume.toLocaleString()} L Sold Total</span>
                  </div>
                  <div className={`p-2 rounded-full ${isProfitable ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                    {isProfitable ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-500">Avg Selling Price</span>
                    <span className="font-mono font-bold text-slate-700">{settings.currency} {stats.avgSellingPrice.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm border-b border-slate-200 pb-2">
                    <span className="text-slate-500">Est. Unit Cost</span>
                    <span className="font-mono font-bold text-slate-700">{settings.currency} {stats.estCost.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm pt-1">
                    <span className="font-bold text-slate-800">Margin / Liter</span>
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
                  <div className="text-xs text-slate-500 uppercase font-bold mb-1">Total Estimated Profit</div>
                  <div className="text-xl font-black font-mono text-slate-900">
                    {settings.currency} {stats.totalProfit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                </div>
              </div>
            );
          })}
          {fuelTypes.length === 0 && (
            <div className="col-span-full py-12 text-center text-slate-500 text-sm border-2 border-dashed border-slate-200 rounded-xl bg-slate-50">
              No tanks configured. Please set up tanks in settings first.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
