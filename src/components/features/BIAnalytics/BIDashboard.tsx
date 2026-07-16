import React, { useMemo } from 'react';
import { useShiftStore } from '../../../stores/useShiftStore';
import { useInventoryStore } from '../../../stores/useInventoryStore';
import { useCustomerStore } from '../../../stores/useCustomerStore';
import { useFinancialStore } from '../../../stores/useFinancialStore';
import { useStationStore } from '../../../stores/useStationStore';
import { generateKPIs } from '../../../services/analytics/kpiEngine';
import { forecastFuelDemand } from '../../../services/analytics/demandForecastEngine';
import { generateBenchmarks } from '../../../services/analytics/benchmarkEngine';
import { LineChart, BarChart } from '../../../services/charts/chartAdapter';
import { TrendingUp, TrendingDown, DollarSign, Fuel, Activity, RefreshCw } from 'lucide-react';
import RoleGuard from '../../ui/RoleGuard';
import { isLubeBusinessStation } from '../../../lib/businessScope';

export const BIDashboard: React.FC = () => {
  const shifts = useShiftStore((state) => state.shifts);
  const products = useInventoryStore((state) => state.products);
  const customers = useCustomerStore((state) => state.customers);
  const tanks = useInventoryStore((state) => state.tanks);
  const standaloneExpenses = useFinancialStore((state) => state.standaloneExpenses);
  const lubePosSales = useFinancialStore((state) => state.lubePosSales);
  const nozzles = useInventoryStore((state) => state.nozzles);
  const activeStationId = useStationStore((state) => state.activeStationId);
  const settings = useStationStore((state) => state.settings);

  const isUrdu = settings.language === 'ur';
  const t = (en: string, ur: string) => (isUrdu ? ur : en);

  const kpis = useMemo(() => generateKPIs(shifts, products, customers, tanks, standaloneExpenses, lubePosSales, activeStationId, nozzles), [shifts, products, customers, tanks, standaloneExpenses, lubePosSales, activeStationId, nozzles]);
  const forecasts = useMemo(() => forecastFuelDemand(shifts, tanks, nozzles, activeStationId), [shifts, tanks, nozzles, activeStationId]);
  const benchmarks = useMemo(() => generateBenchmarks(shifts, products, nozzles, activeStationId), [shifts, products, nozzles, activeStationId]);

  // Calculate real daily trends for the last 7 days including active shift totalSales fallback
  const last7Days = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const dateStr = d.toISOString().split('T')[0];
    
    let revenue = 0;

    if (isLubeBusinessStation(activeStationId)) {
      const dailySales = lubePosSales.filter(s => s.date === dateStr);
      revenue = dailySales.reduce((acc, s) => acc + s.total, 0);
    } else {
      const dailyShifts = shifts.filter(s => s.date.startsWith(dateStr) && (!s.orgId || s.orgId === activeStationId));
      
      dailyShifts.forEach(shift => {
        if (shift.status === 'active' || !shift.closingReadings || Object.keys(shift.closingReadings).length === 0) {
          // Real-time fallback for open active shifts
          revenue += shift.totalSales || 0;
        } else {
          // Closed shifts
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
        }
      });
    }

    const profit = revenue * 0.045; // average margin approximation
    return {
      date: dateStr.substring(5), // MM-DD
      Revenue: revenue,
      Profit: profit
    };
  });

  const handleSeedData = () => {
    const now = new Date();
    const formatDate = (daysAgo: number) => {
      const d = new Date(now);
      d.setDate(now.getDate() - daysAgo);
      return d.toISOString().split('T')[0];
    };

    const sId = activeStationId;
    const isLube = isLubeBusinessStation(sId);

    if (isLube) {
      // Seed Lube Products
      const lubeProducts = [
        { id: 'lube_p1', orgId: '', stationId: sId, name: 'Premium Motor Oil 4L', urduName: 'پریمیم موٹر آئل 4L', category: 'lubricant' as const, sellingPrice: 4500, purchasePrice: 3800, currentStock: 120, minStock: 20, rate: 4500, unit: 'L', type: 'lube' },
        { id: 'lube_p2', orgId: '', stationId: sId, name: 'Synthetic Blend 1L', urduName: 'سنتھیٹک بلینڈ 1L', category: 'lubricant' as const, sellingPrice: 1300, purchasePrice: 1100, currentStock: 250, minStock: 30, rate: 1300, unit: 'L', type: 'lube' }
      ];
      useInventoryStore.getState().setProducts(lubeProducts as any);

      // Seed lube POS sales
      const lubeSales = Array.from({ length: 15 }).map((_, i) => {
        const dateStr = formatDate(i);
        const qty1 = Math.floor(Math.random() * 5) + 1;
        const qty2 = Math.floor(Math.random() * 8) + 2;
        const total = (qty1 * 4500) + (qty2 * 1300);
        return {
          id: `lube_sale_${i}`,
          orgId: '',
          stationId: sId,
          invoiceNo: `INV-${1000 + i}`,
          cashierId: 'st_demo_cashier',
          cashierName: 'Ahmad Crew',
          date: dateStr,
          time: '14:30:00',
          items: [
            { productId: 'lube_p1', quantity: qty1, rate: 4500, lineTotal: qty1 * 4500 },
            { productId: 'lube_p2', quantity: qty2, rate: 1300, lineTotal: qty2 * 1300 }
          ],
          subtotal: total,
          discount: 0,
          total,
          netAmount: total,
          amountReceived: total,
          paymentMode: 'cash' as const
        };
      });
      useFinancialStore.getState().setLubePosSales(lubeSales as any);

      // Seed a couple credit customers
      const lubeCustomers = [
        { id: 'cust_l1', orgId: '', stationId: sId, name: 'Daewoo Express Lube', urduName: 'ڈائیوو ایکسپریس لیوب', contact: '03001234567', address: 'Lahore', balance: 120000, creditLimit: 300000 },
        { id: 'cust_l2', orgId: '', stationId: sId, name: 'Faisal Movers Lube', urduName: 'فیصل موورز لیوب', contact: '03217654321', address: 'Multan', balance: 80000, creditLimit: 200000 }
      ];
      useCustomerStore.getState().setCustomers(lubeCustomers as any);
    } else {
      // Seed Fuel Station
      const fuelProducts = [
        { id: 'prod_p petrol', orgId: '', stationId: sId, name: 'Super Petrol', urduName: 'سپر پٹرول', category: 'fuel' as const, sellingPrice: 280, purchasePrice: 268, currentStock: 18500, minStock: 5000, rate: 280, unit: 'L', type: 'fuel' },
        { id: 'prod_d diesel', orgId: '', stationId: sId, name: 'High Speed Diesel', urduName: 'ہائی اسپیڈ ڈیزل', category: 'fuel' as const, sellingPrice: 290, purchasePrice: 275, currentStock: 22000, minStock: 6000, rate: 290, unit: 'L', type: 'fuel' }
      ];
      useInventoryStore.getState().setProducts(fuelProducts as any);

      const fuelTanks = [
        { id: 'tank_petrol', orgId: '', stationId: sId, name: 'Petrol Main Tank', capacity: 25000, currentStock: 18500, productId: 'prod_p petrol', safeLevel: 20000, criticalLevel: 2000, openingStock: 18500, dipChart: [] },
        { id: 'tank_diesel', orgId: '', stationId: sId, name: 'Diesel Main Tank', capacity: 35000, currentStock: 22000, productId: 'prod_d diesel', safeLevel: 30000, criticalLevel: 3000, openingStock: 22000, dipChart: [] }
      ];
      useInventoryStore.getState().setTanks(fuelTanks as any);

      const fuelNozzles = [
        { id: 'nz_p1', orgId: '', stationId: sId, name: 'Petrol Dispenser 1', tankId: 'tank_petrol', productId: 'prod_p petrol', pumpId: 'pump_1' },
        { id: 'nz_p2', orgId: '', stationId: sId, name: 'Petrol Dispenser 2', tankId: 'tank_petrol', productId: 'prod_p petrol', pumpId: 'pump_1' },
        { id: 'nz_d1', orgId: '', stationId: sId, name: 'Diesel Dispenser 1', tankId: 'tank_diesel', productId: 'prod_d diesel', pumpId: 'pump_2' },
        { id: 'nz_d2', orgId: '', stationId: sId, name: 'Diesel Dispenser 2', tankId: 'tank_diesel', productId: 'prod_d diesel', pumpId: 'pump_2' }
      ];
      useInventoryStore.getState().setNozzles(fuelNozzles as any);

      // Seed credit customers
      const fuelCustomers = [
        { id: 'cust_f1', orgId: '', stationId: sId, name: 'Daewoo Express Fleet', urduName: 'ڈائیوو ایکسپریس فلیٹ', contact: '03001234567', address: 'Karachi', balance: 450000, creditLimit: 1000000 },
        { id: 'cust_f2', orgId: '', stationId: sId, name: 'Bismillah Logistics', urduName: 'بسم اللہ لاجسٹکس', contact: '03217654321', address: 'Islamabad', balance: 320000, creditLimit: 800000 }
      ];
      useCustomerStore.getState().setCustomers(fuelCustomers as any);

      // Seed 15 shifts over the last 15 days
      const fuelShifts = Array.from({ length: 15 }).map((_, i) => {
        const dateStr = formatDate(i + 1); // start from yesterday
        const shiftId = `sh_demo_${i}`;
        const openVal = 5000 + (15 - i) * 600;
        const closeVal = openVal + Math.floor(Math.random() * 500) + 300;
        
        const openValD = 12000 + (15 - i) * 800;
        const closeValD = openValD + Math.floor(Math.random() * 600) + 400;

        const litersP = (closeVal - openVal) * 2;
        const litersD = (closeValD - openValD) * 2;
        const rev = (litersP * 280) + (litersD * 290);

        return {
          id: shiftId,
          orgId: '',
          stationId: sId,
          staffId: 'st_demo_cashier',
          cashierName: 'Ahmad Crew',
          type: (i % 2 === 0 ? 'day' : 'night') as 'day' | 'night',
          date: dateStr,
          startTime: `${dateStr}T08:00:00.000Z`,
          endTime: `${dateStr}T16:00:00.000Z`,
          status: 'closed' as const,
          openingReadings: { 'nz_p1': openVal, 'nz_p2': openVal, 'nz_d1': openValD, 'nz_d2': openValD },
          closingReadings: { 'nz_p1': closeVal, 'nz_p2': closeVal, 'nz_d1': closeValD, 'nz_d2': closeValD },
          testLiters: { 'prod_p petrol': 5, 'prod_d diesel': 5 },
          totalSales: rev,
          expectedCash: rev - 5000,
          submittedCash: rev - 5000,
          shortage: 0,
          overage: 0,
          debitEntries: [],
          recoveryEntries: [],
          expenseEntries: [],
          bankCashEntries: [],
          digitalCashEntries: [],
          supplierPayments: []
        };
      });

      // Active Shift for Today (Real-time demonstration)
      const todayStr = formatDate(0);
      const activeShift = {
        id: `sh_demo_active`,
        orgId: '',
        stationId: sId,
        staffId: 'st_demo_cashier',
        cashierName: 'Ahmad Crew',
        type: 'day' as const,
        date: todayStr,
        startTime: `${todayStr}T08:00:00.000Z`,
        status: 'active' as const,
        openingReadings: { 'nz_p1': 15000, 'nz_p2': 15000, 'nz_d1': 25000, 'nz_d2': 25000 },
        closingReadings: {},
        testLiters: { 'prod_p petrol': 0, 'prod_d diesel': 0 },
        totalSales: 45000, // running sales for active shift
        expectedCash: 45000,
        submittedCash: 0,
        shortage: 0,
        overage: 0,
        debitEntries: [],
        recoveryEntries: [],
        expenseEntries: [],
        bankCashEntries: [],
        digitalCashEntries: [],
        supplierPayments: []
      };

      useShiftStore.getState().setShifts([activeShift, ...fuelShifts] as any);

      // Seed a few standalone expenses
      const expenses = [
        { id: 'exp_1', orgId: '', stationId: sId, date: formatDate(5), categoryName: 'Electricity', category: 'Utility', amount: 48000, description: 'MEPCO Electric Bill', paidFrom: 'cash' },
        { id: 'exp_2', orgId: '', stationId: sId, date: formatDate(2), categoryName: 'Salary', category: 'Salary', amount: 15000, description: 'Advance Salary for Imran', paidFrom: 'cash' }
      ];
      useFinancialStore.getState().setStandaloneExpenses(expenses as any);
    }

    useStationStore.getState().showToast(
      isLube ? t('Lube demo data seeded successfully!', 'ڈیمو ایل او بی ڈیٹا کامیابی سے لوڈ ہو گیا ہے!') : t('Fuel Station demo data seeded successfully!', 'فیول اسٹیشن کا ڈیمو ڈیٹا کامیابی سے لوڈ ہو گیا ہے!'),
      'success'
    );
  };

  return (
    <RoleGuard allowedRoles={['Owner', 'Manager']} fallbackMessage={t('Strategic BI Analytics are restricted to Owners and Managers.', 'اسٹریٹجک بی آئی تجزیات صرف مالکان اور مینیجرز کے لیے مخصوص ہیں۔')}>
      <div className="space-y-6 animate-fade-in pb-12">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              {t('Business Intelligence', 'بزنس انٹیلی جنس')}
            </h1>
            <p className="text-sm font-semibold text-slate-500 mt-1">
              {t('Strategic overview and enterprise KPIs', 'اسٹریٹجک جائزہ اور کاروباری کلیدی کارکردگی کے اشارے')}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {kpis.revenue.mtd === 0 && (
              <button
                onClick={handleSeedData}
                className="flex items-center gap-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white px-3.5 py-1.5 text-xs font-bold shadow-md cursor-pointer transition-colors duration-150"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                <span>{t('Load Demo Data', 'ڈیمو ڈیٹا لوڈ کریں')}</span>
              </button>
            )}
            <div className="flex items-center gap-2 rounded-lg bg-orange-50 px-3 py-1.5 border border-orange-100 dark:bg-orange-500/10 dark:border-orange-500/20">
              <Activity className="h-4 w-4 text-orange-600 dark:text-orange-400" />
              <span className="text-sm font-bold text-orange-600 dark:text-orange-400">
                {t('Live Engine Active', 'لائیو انجن فعال')}
              </span>
            </div>
          </div>
        </div>

        {/* Top KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard 
            title={t('MTD Revenue', 'اس مہینے کی آمدن')} 
            value={`${kpis.revenue.mtd.toLocaleString()} PKR`} 
            icon={DollarSign}
            benchmark={benchmarks.monthly[0]}
            t={t}
          />
          <KPICard 
            title={t('Gross Profit Margin', 'مجموعی منافع کا تناسب')} 
            value={`${kpis.profit.marginPercent.toFixed(1)}%`} 
            icon={TrendingUp}
            benchmark={benchmarks.monthly[1]}
            t={t}
          />
          <KPICard 
            title={t('Credit Exposure', 'ادھار کی حد')} 
            value={`${kpis.credit.outstanding.toLocaleString()} PKR`} 
            icon={Activity}
            subValue={`${kpis.credit.riskScore} ${t('Risk Score', 'رسک اسکور')}`}
            t={t}
          />
          <KPICard 
            title={t('Avg Daily Sales', 'اوسط روزانہ کی فروخت')} 
            value={`${Math.round(kpis.revenue.averageDaily).toLocaleString()} PKR`} 
            icon={Fuel}
            benchmark={benchmarks.daily[0]}
            t={t}
          />
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="premium-card p-6 border border-slate-200 dark:border-white/10 bg-white dark:bg-[#151521] rounded-2xl">
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-6">
              {t('7-Day Revenue Trend', '7 دن کی آمدنی کا رجحان')}
            </h3>
            <LineChart 
              data={last7Days} 
              xAxisKey="date" 
              lines={[{ key: 'Revenue', color: '#3b82f6' }]} 
              height={300} 
            />
          </div>
          <div className="premium-card p-6 border border-slate-200 dark:border-white/10 bg-white dark:bg-[#151521] rounded-2xl">
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-6">
              {t('Profit vs Revenue', 'منافع بمقابلہ آمدنی')}
            </h3>
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
        <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight mt-8">
          {t('Fuel Demand Forecast', 'ایندھن کی طلب کی پیش گوئی')}
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
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
                    <span className="text-sm text-slate-400">{t('Current Stock', 'موجودہ اسٹاک')}</span>
                    <span className="text-sm font-bold">{forecast.currentStock.toLocaleString()} L</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-400">{t('Daily Burn Rate', 'روزانہ کے استعمال کی شرح')}</span>
                    <span className="text-sm font-bold">{Math.round(forecast.averageConsumption).toLocaleString()} L/{t('day', 'دن')}</span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-slate-700">
                    <span className="text-sm text-slate-400">{t('Runs Empty In', 'خالی ہونے کا وقت')}</span>
                    <span className={`text-sm font-black ${forecast.stockCoverageDays < 3 ? 'text-red-400' : 'text-emerald-400'}`}>
                      {forecast.stockCoverageDays} {t('Days', 'دن')}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pt-2">
                    <span className="text-sm text-slate-400">{t('Suggested Order', 'تجویز کردہ آرڈر')}</span>
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
const KPICard = React.memo(({ title, value, icon: Icon, benchmark, subValue, t }: any) => {
  return (
    <div className="premium-card p-5 border border-slate-200 dark:border-white/10 bg-white dark:bg-[#151521] rounded-2xl shadow-xs">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-slate-500">{title}</h3>
        <div className="p-2 rounded-lg bg-slate-50 dark:bg-white/5 text-slate-600 dark:text-slate-400">
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <div className="text-2xl font-black text-slate-900 dark:text-white mb-1">{value}</div>
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
            {benchmark.percentageChange}% {
              benchmark.trend === 'up' ? t('Increase', 'اضافہ') : 
              benchmark.trend === 'down' ? t('Decrease', 'کمی') : 
              t('No Change', 'کوئی تبدیلی نہیں')
            }
          </span>
        </div>
      )}
      {subValue && !benchmark && (
        <div className="text-xs font-bold text-slate-400 mt-2">{subValue}</div>
      )}
    </div>
  );
});

export default BIDashboard;
