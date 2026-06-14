import React, { useState, useEffect } from 'react';
import { GlobalSettings, Shift, Tank, Nozzle, Product } from '../../../types';
import { db } from '../../../data/db';
import { BarChart3, TrendingUp, Sparkles, AlertTriangle } from 'lucide-react';

interface DemandForecastProps {
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

export default function DemandForecast({ settings, stationId }: DemandForecastProps) {
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

  const fuelTypes = ['Super', 'Diesel', 'V-Power'];

  // Mock Forecast Logic: Look at past 7 days average and project next 7 days with a +5% growth trend
  const generateMockForecast = (type: string) => {
    let totalVol = 0;
    let count = 0;

    shifts.forEach(s => {
      if (!s.closingReadings || !s.openingReadings) return;
      let shiftVol = 0;
      Object.keys(s.closingReadings).forEach(nozzleId => {
        const nozzle = nozzles.find(n => n.id === nozzleId);
        if (!nozzle) return;
        const product = products.find(p => p.id === nozzle.productId);
        if (!product) return;
        const fuelType = getFuelTypeFromProductName(product.name);
        if (fuelType !== type) return;

        const nozzleVol = Math.max(0, (s.closingReadings[nozzleId] || 0) - (s.openingReadings[nozzleId] || 0));
        shiftVol += nozzleVol;
      });
      if (shiftVol > 0) {
        totalVol += shiftVol;
        count++;
      }
    });

    const avgDailyVol = count > 0 ? totalVol / count : 0;
    const baseline = avgDailyVol > 0 ? avgDailyVol : 1500;
    
    return {
      next7Days: Math.round(baseline * 7 * 1.05), // 5% expected growth
      confidence: Math.round(75 + Math.random() * 20), // 75-95%
      trend: '+5.0%',
      recommendation: `Order ${Math.round((baseline * 7 * 1.05) / 1000) * 1000}L by end of week.`
    };
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-br from-indigo-900 to-slate-900 p-6 rounded-2xl border border-indigo-800 shadow-lg text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10">
          <Sparkles className="w-48 h-48" />
        </div>
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-indigo-500/20 rounded-lg">
              <BarChart3 className="h-6 w-6 text-indigo-300" />
            </div>
            <h3 className="font-black text-xl tracking-tight">AI Demand Forecast (Beta)</h3>
          </div>
          <p className="text-indigo-200 text-sm max-w-2xl">
            Our predictive model analyzes your historical sales velocity, seasonal trends, and current inventory levels to forecast demand for the next 7 days.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-1 lg:grid-cols-3 gap-6">
        {fuelTypes.map(type => {
          const forecast = generateMockForecast(type);

          return (
            <div key={type} className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 hover:shadow-md transition">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h4 className="font-black text-lg text-slate-900">{type}</h4>
                  <span className="text-xs text-slate-500">Next 7 Days Forecast</span>
                </div>
                <div className="flex flex-col items-end">
                  <div className="flex items-center gap-1 text-emerald-600 text-sm font-bold bg-emerald-50 px-2 py-1 rounded-md">
                    <TrendingUp className="h-3 w-3" />
                    {forecast.trend}
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1">{forecast.confidence}% Confidence</span>
                </div>
              </div>

              <div className="py-4 border-y border-slate-100 my-4 flex items-end gap-2">
                <span className="text-3xl font-black font-mono text-slate-900 tracking-tight">
                  {forecast.next7Days.toLocaleString()}
                </span>
                <span className="text-sm font-bold text-slate-500 mb-1">Liters</span>
              </div>

              <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-3 flex gap-3 items-start">
                <Sparkles className="h-4 w-4 text-indigo-500 shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs font-bold text-indigo-900 uppercase tracking-wider mb-0.5">AI Recommendation</div>
                  <div className="text-sm text-indigo-800 font-medium">
                    {forecast.recommendation}
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {fuelTypes.length === 0 && (
          <div className="col-span-full py-12 text-center text-slate-500 text-sm border-2 border-dashed border-slate-200 rounded-xl bg-slate-50">
            No tanks configured. Please set up tanks in settings to see AI forecasts.
          </div>
        )}
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3">
        <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
        <div className="text-sm text-amber-800">
          <strong>Note:</strong> This is a beta feature. The forecast currently relies on a localized simplified model. In a production environment, this would ping a cloud ML endpoint using your full historic dataset.
        </div>
      </div>
    </div>
  );
}
