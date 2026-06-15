import React, { useState, useEffect } from 'react';
import { GlobalSettings, Shift, Tank, Nozzle, Product } from '../../../types';
import { db } from '../../../data/db';
import { LineChart, TrendingUp, DollarSign, Activity, ChevronRight } from 'lucide-react';

interface ExecutiveDashboardProps {
  settings: GlobalSettings;
  stationId: string;
}

export default function ExecutiveDashboard({ settings, stationId }: ExecutiveDashboardProps) {
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

  // Aggregate Sales Data
  const currentMonthShifts = shifts.filter(s => {
    if (!s.date) return false;
    const dt = new Date(s.date);
    const now = new Date();
    return dt.getMonth() === now.getMonth() && dt.getFullYear() === now.getFullYear();
  });

  let totalVolume = 0;
  let totalRevenue = 0;

  currentMonthShifts.forEach(s => {
    if (!s.closingReadings || !s.openingReadings) return;
    Object.keys(s.closingReadings).forEach(nozzleId => {
      const nozzle = nozzles.find(n => n.id === nozzleId);
      if (!nozzle) return;
      const product = products.find(p => p.id === nozzle.productId);
      if (!product) return;
      
      const vol = Math.max(0, (s.closingReadings[nozzleId] || 0) - (s.openingReadings[nozzleId] || 0));
      const rate = (s as any).rates?.[product.id] || product.rate || 0;
      totalVolume += vol;
      totalRevenue += (vol * rate);
    });
  });

  const mockTargetRevenue = totalRevenue > 0 ? totalRevenue * 1.2 : 50000;
  const targetAchievedPercent = totalRevenue > 0 ? (totalRevenue / mockTargetRevenue) * 100 : 0;

  // Mock Profit Calculation (Assuming 15% margin for demo purposes since we don't have exact cost price per drop mapped to sales easily here)
  const estimatedProfit = totalRevenue * 0.15;

  return (
    <div className="space-y-6">
      <div className="fp-kpi-grid-2x2 mb-4">
        <div className="fp-kpi-compact kpi-orange relative overflow-hidden group border border-orange-500/20 shadow-[0_0_15px_rgba(249,115,22,0.1)]">
          <div className="fp-kpi-compact__label text-orange-400">MTD Revenue</div>
          <div className="fp-kpi-compact__value">
            {settings.currency} {totalRevenue.toLocaleString()}
          </div>
          <div className="fp-kpi-compact__sub text-orange-300 flex items-center gap-1">
            <TrendingUp className="h-3 w-3" />
            Tracking against targets
          </div>
          <div className="absolute top-2 right-2 text-orange-500 opacity-20">
            <DollarSign className="h-8 w-8" />
          </div>
        </div>

        <div className="fp-kpi-compact kpi-green relative overflow-hidden group">
          <div className="fp-kpi-compact__label">Est. Gross Profit</div>
          <div className="fp-kpi-compact__value">
            {settings.currency} {estimatedProfit.toLocaleString()}
          </div>
          <div className="fp-kpi-compact__sub text-emerald-400">
            Based on 15% avg margin
          </div>
          <div className="absolute top-2 right-2 text-emerald-500 opacity-20">
            <Activity className="h-8 w-8" />
          </div>
        </div>

        <div className="fp-kpi-compact kpi-blue relative overflow-hidden group">
          <div className="fp-kpi-compact__label">Fuel Volume Sold</div>
          <div className="fp-kpi-compact__value">
            {totalVolume.toLocaleString()} L
          </div>
          <div className="fp-kpi-compact__sub text-blue-400">
            Month to date
          </div>
          <div className="absolute top-2 right-2 text-blue-500 opacity-20">
            <LineChart className="h-8 w-8" />
          </div>
        </div>

        <div className="fp-kpi-compact kpi-purple relative overflow-hidden group">
          <div className="fp-kpi-compact__label">Target Progress</div>
          <div className="fp-kpi-compact__value">
            {targetAchievedPercent.toFixed(1)}%
          </div>
          <div className="fp-kpi-compact__sub w-full mt-1">
            <div className="w-full bg-slate-800/50 rounded-full h-1">
              <div className="bg-purple-500 h-1 rounded-full" style={{ width: `${Math.min(targetAchievedPercent, 100)}%` }}></div>
            </div>
          </div>
          <div className="absolute top-2 right-2 text-purple-500 opacity-20">
            <TrendingUp className="h-8 w-8" />
          </div>
        </div>
      </div>

      {/* Monthly Trend Mock Chart */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <h3 className="font-bold text-slate-800 mb-6 flex items-center justify-between">
          <span>Revenue vs Target Trend</span>
          <button className="text-xs text-rose-600 font-bold flex items-center hover:text-rose-700">View Full Report <ChevronRight className="h-3 w-3 ml-1"/></button>
        </h3>
        
        <div className="h-64 flex items-end justify-between gap-2 pb-4">
          {[65, 78, 55, 82, 90, 70, 85, 95, 88, 100, 75, 80].map((val, i) => (
            <div key={i} className="w-full flex flex-col justify-end items-center group relative h-full">
              {/* Tooltip */}
              <div className="absolute -top-10 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 text-white text-[10px] py-1 px-2 rounded whitespace-nowrap z-10 pointer-events-none font-mono">
                {settings.currency} {(val * 1000).toLocaleString()}
              </div>
              <div 
                className="w-full bg-rose-500 hover:bg-rose-400 transition-colors rounded-t-sm"
                style={{ height: `${val}%` }}
              ></div>
              <div className="text-[9px] font-bold text-slate-400 mt-2 uppercase">
                {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][i]}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
