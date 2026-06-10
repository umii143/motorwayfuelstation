import React, { useMemo } from 'react';
import { useStation } from '../../../contexts/StationContext';
import { generateKPIs } from '../../../services/analytics/kpiEngine';
import { forecastFuelDemand } from '../../../services/analytics/demandForecastEngine';
import { generateBenchmarks } from '../../../services/analytics/benchmarkEngine';
import { LineChart, BarChart } from '../../../services/charts/chartAdapter';
import { TrendingUp, TrendingDown, DollarSign, Fuel, Activity } from 'lucide-react';
import RoleGuard from '../../ui/RoleGuard';

export const BIDashboard: React.FC = () => {
  const { shifts, products, customers, tanks, standaloneExpenses, lubePosSales, nozzles, activeStationId } = useStation();

  const kpis = useMemo(() => generateKPIs(shifts, products, customers, tanks, standaloneExpenses, lubePosSales, activeStationId, nozzles), [shifts, products, customers, tanks, standaloneExpenses, lubePosSales, activeStationId, nozzles]);
  const forecasts = useMemo(() => forecastFuelDemand(shifts, tanks, nozzles, activeStationId), [shifts, tanks, nozzles, activeStationId]);
  const benchmarks = useMemo(() => generateBenchmarks(shifts, products, nozzles, activeStationId), [shifts, products, nozzles, activeStationId]);

  // Calculate real daily trends for the last 7 days
  const last7Days = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const dateStr = d.toISOString().split('T')[0];
    
    let revenue = 0;

    if (activeStationId === 'st_lube') {
      const dailySales = lubePosSales.filter(s => s.date === dateStr);
      revenue = dailySales.reduce((acc, s) => acc + s.total, 0);
    } else {
      const dailyShifts = shifts.filter(s => s.date.startsWith(dateStr) && (!s.orgId || s.orgId === activeStationId));
      
      dailyShifts.forEach(shift => {
        nozzles.forEach(nz => {
          const open = shift.openingReadings?.[nz.id] || 0;
          const close = shift.closingReadings?.[nz.id] || 0;
          let diff = Math.max(0, close - open);
          
          // Deduct test liters if any for this product
          const testLiters = shift.testLiters?.[nz.productId] || 0;
          diff = Math.max(0, diff - testLiters);

          const prod = products.find(p => p.id === nz.productId);
          const rate = prod?.rate || prod?.sellingPrice || 0;
          revenue += diff * rate;
        });
      });
    }

    const profit = revenue * 0.045; // average margin approximation
    return {
      date: dateStr.substring(5), // MM-DD
      Revenue: revenue,
      Profit: profit
    };
  });

  return (
    <RoleGuard allowedRoles={['Owner', 'Manager']} fallbackMessage="Strategic BI Analytics are restricted to Owners and Managers.">
      <div className="space-y-6 animate-fade-in pb-12">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Business Intelligence</h1>
            <p className="text-sm font-semibold text-slate-500 mt-1">Strategic overview and enterprise KPIs</p>
          </div>
          <div className="flex items-center gap-2 rounded-lg bg-orange-50 px-3 py-1.5 border border-orange-100">
            <Activity className="h-4 w-4 text-orange-600" />
            <span className="text-sm font-bold text-orange-600">Live Engine Active</span>
          </div>
        </div>

        {/* Top KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard 
            title="MTD Revenue" 
            value={`${kpis.revenue.mtd.toLocaleString()} PKR`} 
            icon={DollarSign}
            benchmark={benchmarks.monthly[0]}
          />
          <KPICard 
            title="Gross Profit Margin" 
            value={`${kpis.profit.marginPercent.toFixed(1)}%`} 
            icon={TrendingUp}
            benchmark={benchmarks.monthly[1]}
          />
          <KPICard 
            title="Credit Exposure" 
            value={`${kpis.credit.outstanding.toLocaleString()} PKR`} 
            icon={Activity}
            subValue={`${kpis.credit.riskScore} Risk Score`}
          />
          <KPICard 
            title="Avg Daily Sales" 
            value={`${Math.round(kpis.revenue.averageDaily).toLocaleString()} PKR`} 
            icon={Fuel}
            benchmark={benchmarks.daily[0]}
          />
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
            <h3 className="text-base font-bold text-slate-900 mb-6">7-Day Revenue Trend</h3>
            <LineChart 
              data={last7Days} 
              xAxisKey="date" 
              lines={[{ key: 'Revenue', color: '#3b82f6' }]} 
              height={300} 
            />
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
            <h3 className="text-base font-bold text-slate-900 mb-6">Profit vs Revenue</h3>
            <BarChart 
              data={last7Days} 
              xAxisKey="date" 
              bars={[
                { key: 'Revenue', color: '#94a3b8' },
                { key: 'Profit', color: '#10b981' }
              ]} 
              height={300} 
            />
          </div>
        </div>

        {/* Demand Forecasting section */}
        <h2 className="text-xl font-black text-slate-900 tracking-tight mt-8">Fuel Demand Forecast</h2>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {forecasts.map(forecast => (
            <div key={forecast.tankId} className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <Fuel className="h-24 w-24" />
              </div>
              <div className="relative z-10">
                <h3 className="text-lg font-bold text-slate-100">{forecast.tankName}</h3>
                <p className="text-xs font-semibold text-slate-400 mb-4">{forecast.productId}</p>
                
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-400">Current Stock</span>
                    <span className="text-sm font-bold">{forecast.currentStock.toLocaleString()} L</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-400">Daily Burn Rate</span>
                    <span className="text-sm font-bold">{Math.round(forecast.averageConsumption).toLocaleString()} L/day</span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-slate-700">
                    <span className="text-sm text-slate-400">Runs Empty In</span>
                    <span className={`text-sm font-black ${forecast.stockCoverageDays < 3 ? 'text-red-400' : 'text-emerald-400'}`}>
                      {forecast.stockCoverageDays} Days
                    </span>
                  </div>
                  <div className="flex justify-between items-center pt-2">
                    <span className="text-sm text-slate-400">Suggested Order</span>
                    <span className="text-sm font-bold text-orange-400">{forecast.suggestedOrder.toLocaleString()} L</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </RoleGuard>
  );
};

// Mini component for KPI cards
const KPICard = ({ title, value, icon: Icon, benchmark, subValue }: any) => {
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-slate-500">{title}</h3>
        <div className="p-2 rounded-lg bg-slate-50 text-slate-600">
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <div className="text-2xl font-black text-slate-900 mb-1">{value}</div>
      {benchmark && (
        <div className="flex items-center gap-1.5 mt-2">
          {benchmark.trend === 'up' ? (
            <TrendingUp className={`h-3.5 w-3.5 ${benchmark.isPositiveTrend ? 'text-emerald-500' : 'text-red-500'}`} />
          ) : benchmark.trend === 'down' ? (
            <TrendingDown className={`h-3.5 w-3.5 ${benchmark.isPositiveTrend ? 'text-emerald-500' : 'text-red-500'}`} />
          ) : (
            <Activity className="h-3.5 w-3.5 text-slate-400" />
          )}
          <span className={`text-xs font-bold ${
            benchmark.trend === 'flat' ? 'text-slate-500' : 
            benchmark.isPositiveTrend ? 'text-emerald-600' : 'text-red-600'
          }`}>
            {benchmark.percentageChange}% {benchmark.trend === 'up' ? 'Increase' : benchmark.trend === 'down' ? 'Decrease' : 'No Change'}
          </span>
        </div>
      )}
      {subValue && !benchmark && (
        <div className="text-xs font-bold text-slate-400 mt-2">{subValue}</div>
      )}
    </div>
  );
};

export default BIDashboard;
