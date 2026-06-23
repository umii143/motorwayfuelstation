import { Shift } from '../../types';

export interface BenchmarkComparison {
  metricName: string;
  currentValue: number;
  previousValue: number;
  percentageChange: number;
  trend: 'up' | 'down' | 'flat';
  isPositiveTrend: boolean; // e.g. Expenses going up is negative trend, Revenue going up is positive
}

export interface BenchmarkResult {
  daily: BenchmarkComparison[];
  weekly: BenchmarkComparison[];
  monthly: BenchmarkComparison[];
}

export const generateBenchmarks = (
  shifts: Shift[],
  products: unknown[],
  nozzles: unknown[],
  branchId: string = 'main'
): BenchmarkResult => {
  const branchShifts = shifts.filter(s => !s.orgId || s.orgId === branchId);
  const now = new Date();
  
  // Helpers to check date ranges
  const isToday = (d: Date) => d.toDateString() === now.toDateString();
  const isYesterday = (d: Date) => {
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    return d.toDateString() === yesterday.toDateString();
  };
  
  // Simplified weeks and months for MVP
  const getWeekNumber = (d: Date) => Math.ceil(d.getDate() / 7);
  const thisWeekNum = getWeekNumber(now);
  const thisMonthNum = now.getMonth();
  
  let revToday = 0, revYesterday = 0;
  let revThisWeek = 0, revLastWeek = 0;
  let revThisMonth = 0, revLastMonth = 0;

  let profToday = 0, profYesterday = 0;
  let profThisWeek = 0, profLastWeek = 0;
  let profThisMonth = 0, profLastMonth = 0;

  branchShifts.forEach(shift => {
    const shiftDate = new Date(shift.date);
    
    let revenue = 0;
    nozzles.forEach(nz => {
      const open = shift.openingReadings?.[nz.id] || 0;
      const close = shift.closingReadings?.[nz.id] || 0;
      let diff = Math.max(0, close - open);
      const testLiters = shift.testLiters?.[nz.productId] || 0;
      diff = Math.max(0, diff - testLiters);
      
      const prod = products.find(p => p.id === nz.productId);
      const rate = prod?.rate || prod?.sellingPrice || 0;
      revenue += diff * rate;
    });

    const profit = revenue * 0.045; // Estimated 4.5% margin
    
    // Daily
    if (isToday(shiftDate)) { revToday += revenue; profToday += profit; }
    if (isYesterday(shiftDate)) { revYesterday += revenue; profYesterday += profit; }

    // Weekly
    const weekDiff = thisWeekNum - getWeekNumber(shiftDate);
    const sameMonth = shiftDate.getMonth() === thisMonthNum;
    if (sameMonth && weekDiff === 0) { revThisWeek += revenue; profThisWeek += profit; }
    if (sameMonth && weekDiff === 1) { revLastWeek += revenue; profLastWeek += profit; }

    // Monthly
    const monthDiff = thisMonthNum - shiftDate.getMonth();
    if (monthDiff === 0) { revThisMonth += revenue; profThisMonth += profit; }
    if (monthDiff === 1) { revLastMonth += revenue; profLastMonth += profit; }
  });

  const createComparison = (name: string, curr: number, prev: number, higherIsBetter: boolean): BenchmarkComparison => {
    const diff = curr - prev;
    const pct = prev === 0 ? (curr > 0 ? 100 : 0) : (diff / prev) * 100;
    const trend = diff > 0 ? 'up' : diff < 0 ? 'down' : 'flat';
    
    return {
      metricName: name,
      currentValue: curr,
      previousValue: prev,
      percentageChange: Number(Math.abs(pct).toFixed(1)),
      trend,
      isPositiveTrend: diff === 0 ? true : (diff > 0 === higherIsBetter)
    };
  };

  return {
    daily: [
      createComparison('Revenue', revToday, revYesterday, true),
      createComparison('Profit', profToday, profYesterday, true)
    ],
    weekly: [
      createComparison('Revenue', revThisWeek, revLastWeek, true),
      createComparison('Profit', profThisWeek, profLastWeek, true)
    ],
    monthly: [
      createComparison('Revenue', revThisMonth, revLastMonth, true),
      createComparison('Profit', profThisMonth, profLastMonth, true)
    ]
  };
};
