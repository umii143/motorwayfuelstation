import { Shift, Product, Customer, Tank, ExpenseEntry, LubePosSale, RateHistoryEntry } from '../../types';
import { forecastFuelDemand } from './demandForecastEngine';

export interface KPIBreakdowns {
  revenueByProduct: Record<string, number>;
  revenueByCategory: Record<string, number>;
  grossProfitByProduct: Record<string, number>;
  grossProfitByCategory: Record<string, number>;
  netProfitByCategory: Record<string, number>;
  expensesByCategory: Record<string, number>;
  expensesByMonth: Record<string, number>;
  expensesByBranch: Record<string, number>;
  salaryDetails: { employeeName: string; amount: number; description: string }[];
  trendData: { date: string; revenue: number; profit: number; expenses: number }[];
  ledgerTransactions: { id: string; date: string; type: string; description: string; amount: number }[];
}

export interface KPIResult {
  revenue: {
    today: number;
    mtd: number;
    ytd: number;
    averageDaily: number;
  };
  profit: {
    gross: number;
    net: number; // This is purely operational profit now
    inventoryRevaluation: number; // This tracks net revaluation gain/loss
    revaluationGain: number;
    revaluationLoss: number;
    marginPercent: number;
    avgPerLiter: number;
  };
  inventory: {
    value: number;
    potentialRevenue: number;
    stockCoverageDays: number;
    turnover: number;
    deadStockCount: number;
    fastMovingProducts: string[];
  };
  expenses: {
    total: number;
    perLiter: number;
    salary: {
      total: number;
      monthlyAvg: number;
      percentageOfExpenses: number;
    };
  };
  cash: {
    position: number;
  };
  credit: {
    outstanding: number;
    collectionEfficiency: number;
    overdueCustomers: number;
    riskScore: number;
    riskLabel: 'Low' | 'Medium' | 'High' | 'Critical';
  };
  dataQuality: {
    score: number;
  };
  breakdowns: KPIBreakdowns;
  branchId: string;
}

export const generateKPIs = (
  shifts: Shift[] = [],
  products: Product[] = [],
  customers: Customer[] = [],
  tanks: Tank[] = [],
  standaloneExpenses: ExpenseEntry[] = [],
  lubePosSales: LubePosSale[] = [],
  branchId: string = 'main',
  nozzles: any[] = [],
  rateHistory: RateHistoryEntry[] = [],
  dateRange?: { from: string; to: string }
): KPIResult => {
  if (!shifts) shifts = [];
  if (!products) products = [];
  if (!customers) customers = [];
  if (!tanks) tanks = [];
  if (!standaloneExpenses) standaloneExpenses = [];
  if (!lubePosSales) lubePosSales = [];
  if (!rateHistory) rateHistory = [];

  // Breakdowns
  const breakdowns: KPIBreakdowns = {
    revenueByProduct: {},
    revenueByCategory: {},
    grossProfitByProduct: {},
    grossProfitByCategory: {},
    netProfitByCategory: {},
    expensesByCategory: {},
    expensesByMonth: {},
    expensesByBranch: {},
    salaryDetails: [],
    trendData: [],
    ledgerTransactions: []
  };

  const getProductCategory = (p?: Product) => p?.category === 'lubricant' ? 'Lubricants' : 'Fuel';
  const getProductName = (p?: Product) => p?.name || 'Unknown Product';
  const getExpenseCategory = (exp: ExpenseEntry) => exp.categoryName || exp.categoryId || exp.category || 'Uncategorized';

  // Filter 
  const branchShifts = shifts.filter(s => !s.orgId || s.orgId === branchId);
  const branchCustomers = customers.filter(c => !c.orgId || c.orgId === branchId);

  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  const thisMonthStr = todayStr.substring(0, 7);
  
  // Helper to check if a date is within the targeted period
  const isDateInPeriod = (dateStr: string) => {
    if (!dateRange || (!dateRange.from && !dateRange.to)) {
      // Default: All time (no filter) if dateRange is empty
      return true;
    }
    const d = dateStr.split('T')[0];
    if (dateRange.from && d < dateRange.from) return false;
    if (dateRange.to && d > dateRange.to) return false;
    return true;
  };
  
  // Trend helper
  const addTrend = (d: string, rev: number, prof: number, exp: number) => {
    const existing = breakdowns.trendData.find(t => t.date === d);
    if (existing) {
      existing.revenue += rev;
      existing.profit += prof;
      existing.expenses += exp;
    } else {
      breakdowns.trendData.push({ date: d, revenue: rev, profit: prof, expenses: exp });
    }
  };

  // === Data Quality Engine ===
  let dataIssues = 0;
  let totalDataPoints = 0;

  // === Inventory Engine ===
  let inventoryValue = 0;
  let potentialRevenue = 0;

  products.forEach(p => {
    totalDataPoints += 2;
    if (!p.purchasePrice) dataIssues++;
    if (!p.sellingPrice && !p.rate) dataIssues++;

    const pp = p.purchasePrice || (p.rate ? p.rate * 0.9 : 0);
    const sp = p.sellingPrice || p.rate || 0;
    
    inventoryValue += (p.currentStock * pp);
    potentialRevenue += (p.currentStock * sp);
  });

  const deadStockCount = products.filter(p => p.currentStock < 100).length;

  const forecasts = forecastFuelDemand(shifts, tanks, nozzles, branchId);
  let minCoverage = 999;
  forecasts.forEach(f => {
    if (f.stockCoverageDays < minCoverage) minCoverage = f.stockCoverageDays;
  });
  if (minCoverage === 999) minCoverage = 0;

  // === Revenue & COGS & Expense Engine ===
  let todayRevenue = 0;
  let mtdRevenue = 0;
  let ytdRevenue = 0;

  let totalRevenue = 0;
  let totalCogs = 0;
  let totalLitersSold = 0;
  let totalExpenses = 0;
  let totalCashReceived = 0;

  // Standalone Expenses
  standaloneExpenses.forEach(exp => {
    const d = exp.date.split('T')[0];
    if (isDateInPeriod(d)) {
      totalExpenses += exp.amount;
      addTrend(d, 0, 0, exp.amount);
      breakdowns.ledgerTransactions.push({ id: exp.id, date: d, type: 'Expense', description: exp.description || getExpenseCategory(exp), amount: -exp.amount });
      const cat = getExpenseCategory(exp);
      breakdowns.expensesByCategory[cat] = (breakdowns.expensesByCategory[cat] || 0) + exp.amount;
      
      const monthStr = d.substring(0, 7);
      breakdowns.expensesByMonth[monthStr] = (breakdowns.expensesByMonth[monthStr] || 0) + exp.amount;
      
      const bId = branchId;
      breakdowns.expensesByBranch[bId] = (breakdowns.expensesByBranch[bId] || 0) + exp.amount;

      if (cat.toLowerCase() === 'salary') {
        let empName = 'Unknown';
        if (exp.description) {
          // E.g. "Salary Payment for Ali (May 2026)"
          const match = exp.description.match(/for\s+([^()]+)/i);
          if (match && match[1]) {
            empName = match[1].trim();
          } else {
            empName = exp.description;
          }
        }
        breakdowns.salaryDetails.push({ employeeName: empName, amount: exp.amount, description: exp.description });
      }
    }
  });

  // Lube POS Sales (if not part of shifts)
  lubePosSales.forEach(sale => {
    const d = sale.date.split('T')[0];
    if (d === todayStr) todayRevenue += sale.total;
    if (d.startsWith(thisMonthStr)) mtdRevenue += sale.total;
    
    if (isDateInPeriod(d)) {
      ytdRevenue += sale.total;
      totalRevenue += sale.total;
      totalCashReceived += sale.amountReceived;
      
      breakdowns.ledgerTransactions.push({ id: sale.id, date: d, type: 'Lube Sale', description: 'Direct Lube Sale POS', amount: sale.total });
      
      // Calculate Lube COGS
      sale.items.forEach(item => {
        const p = products.find(prod => prod.id === item.productId);
        const pp = p?.purchasePrice || (p?.rate ? p.rate * 0.7 : 0);
        const cogs = (item.quantity * pp);
        totalCogs += cogs;

        const pName = getProductName(p);
        const pCat = getProductCategory(p);
        const revenue = item.lineTotal;
        const profit = revenue - cogs;

        addTrend(d, revenue, profit, 0);

        breakdowns.revenueByProduct[pName] = (breakdowns.revenueByProduct[pName] || 0) + revenue;
        breakdowns.revenueByCategory[pCat] = (breakdowns.revenueByCategory[pCat] || 0) + revenue;
        breakdowns.grossProfitByProduct[pName] = (breakdowns.grossProfitByProduct[pName] || 0) + profit;
        breakdowns.grossProfitByCategory[pCat] = (breakdowns.grossProfitByCategory[pCat] || 0) + profit;
      });
    }
  });

  // Shifts
  const productSalesMap: Record<string, number> = {};

  branchShifts.forEach(shift => {
    const d = shift.date.split('T')[0];
    let shiftRev = 0;
    let shiftCogs = 0;
    let shiftLiters = 0;

    // Fuel Sales
    if (shift.segments) {
      shift.segments.forEach(seg => {
        shiftRev += seg.revenue;
        shiftLiters += seg.litersSold;
        
        const p = products.find(prod => prod.id === seg.productId);
        const pp = p?.purchasePrice || (p?.rate ? p.rate * 0.9 : 0);
        const cogs = (seg.litersSold * pp);
        shiftCogs += cogs;

        if (isDateInPeriod(d)) {
          const pName = getProductName(p);
          const pCat = getProductCategory(p);
          const profit = seg.revenue - cogs;

          addTrend(d, seg.revenue, profit, 0);

          breakdowns.revenueByProduct[pName] = (breakdowns.revenueByProduct[pName] || 0) + seg.revenue;
          breakdowns.revenueByCategory[pCat] = (breakdowns.revenueByCategory[pCat] || 0) + seg.revenue;
          breakdowns.grossProfitByProduct[pName] = (breakdowns.grossProfitByProduct[pName] || 0) + profit;
          breakdowns.grossProfitByCategory[pCat] = (breakdowns.grossProfitByCategory[pCat] || 0) + profit;
        }

        productSalesMap[seg.productId] = (productSalesMap[seg.productId] || 0) + seg.litersSold;
      });
       // Fallback for legacy shifts
       let legacyRev = 0;
       nozzles.forEach(nz => {
         const open = shift.openingReadings?.[nz.id] || 0;
         const close = shift.closingReadings?.[nz.id] || 0;
         const diff = Math.max(0, close - open);
         const prod = products.find(p => p.id === nz.productId);
         const rate = prod?.rate || prod?.sellingPrice || 0;
         legacyRev += diff * rate;
       });
       shiftRev += legacyRev;
    }



    // Shift Expenses
    shift.expenseEntries?.forEach(exp => {
      if (isDateInPeriod(d)) {
        totalExpenses += exp.amount;
        addTrend(d, 0, 0, exp.amount);
        breakdowns.ledgerTransactions.push({ id: exp.id, date: d, type: 'Shift Expense', description: exp.description || getExpenseCategory(exp), amount: -exp.amount });

        const cat = getExpenseCategory(exp);
        breakdowns.expensesByCategory[cat] = (breakdowns.expensesByCategory[cat] || 0) + exp.amount;
        
        const monthStr = d.substring(0, 7);
        breakdowns.expensesByMonth[monthStr] = (breakdowns.expensesByMonth[monthStr] || 0) + exp.amount;
        
        const bId = branchId;
        breakdowns.expensesByBranch[bId] = (breakdowns.expensesByBranch[bId] || 0) + exp.amount;
      }
    });

    // Recoveries
    shift.recoveryEntries?.forEach(rec => {
      if (isDateInPeriod(d)) {
        totalCashReceived += rec.amount;
      }
    });

    if (d === todayStr) todayRevenue += shiftRev;
    if (d.startsWith(thisMonthStr)) mtdRevenue += shiftRev;
    if (isDateInPeriod(d)) {
      ytdRevenue += shiftRev;
      totalRevenue += shiftRev;
      totalCogs += shiftCogs;
      totalLitersSold += shiftLiters;
      totalCashReceived += (shift.submittedCash || 0);
      
      if (shiftRev > 0) {
         breakdowns.ledgerTransactions.push({ id: shift.id, date: d, type: 'Shift Sales', description: `Shift Fuel & Lube Sales (${shift.type})`, amount: shiftRev });
      }
    }
  });

  // Sort trend data and ledger
  breakdowns.trendData.sort((a, b) => a.date.localeCompare(b.date));
  breakdowns.ledgerTransactions.sort((a, b) => b.date.localeCompare(a.date));

  const grossProfit = totalRevenue - totalCogs;
  const netProfit = grossProfit - totalExpenses;
  const marginPercent = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;
  const avgPerLiter = totalLitersSold > 0 ? (totalExpenses / totalLitersSold) : 0; // Expense per liter

  // Calculate netProfitByCategory
  // We allocate expenses proportionally to categories based on revenue
  Object.keys(breakdowns.grossProfitByCategory).forEach(cat => {
    const catRevenue = breakdowns.revenueByCategory[cat] || 0;
    const revShare = totalRevenue > 0 ? (catRevenue / totalRevenue) : 0;
    const catExpenses = totalExpenses * revShare;
    breakdowns.netProfitByCategory[cat] = (breakdowns.grossProfitByCategory[cat] || 0) - catExpenses;
  });

  const uniqueDays = new Set(branchShifts.map(s => s.date.split('T')[0])).size || 1;
  const averageDaily = ytdRevenue / uniqueDays;

  const cashPosition = totalCashReceived - totalExpenses; // Simplified cash position

  // Fast Moving Products
  const fastMovingProducts = Object.entries(productSalesMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([id]) => products.find(p => p.id === id)?.name || id);

  // === Credit Risk Engine ===
  let outstanding = 0;
  let overdueCustomers = 0;
  let activeCustomers = 0;

  branchCustomers.forEach(c => {
    totalDataPoints += 1;
    if (!c.contact) dataIssues++;

    if (c.balance > 0) {
      outstanding += c.balance;
      activeCustomers++;
      if (c.balance >= c.creditLimit * 0.9) {
        overdueCustomers++;
      }
    }
  });

  const collectionEfficiency = activeCustomers > 0 ? Math.max(0, 100 - ((overdueCustomers / activeCustomers) * 100)) : 100;
  
  // Dynamic Risk Score
  let riskScore = 0;
  if (outstanding > 1000000) riskScore += 40;
  else if (outstanding > 500000) riskScore += 20;
  
  if (collectionEfficiency < 50) riskScore += 40;
  else if (collectionEfficiency < 80) riskScore += 20;

  let riskLabel: 'Low' | 'Medium' | 'High' | 'Critical' = 'Low';
  if (riskScore >= 80) riskLabel = 'Critical';
  else if (riskScore >= 50) riskLabel = 'High';
  else if (riskScore >= 20) riskLabel = 'Medium';

  const dataQualityScore = totalDataPoints > 0 ? Math.round(Math.max(0, 100 - ((dataIssues / totalDataPoints) * 100))) : 100;

  // Calculate Revaluation Gain/Loss
  let totalRevaluation = 0;
  let revaluationGain = 0;
  let revaluationLoss = 0;

  rateHistory.forEach(rh => {
    // Determine the year to match the current YTD logic if needed,
    // or keep it lifetime. Let's make it lifetime or YTD based on date.
    // The instructions say "Net Lifetime Impact" on dashboard, so let's do lifetime.
    const impact = rh.inventoryImpact ?? rh.impactAmount ?? 0;
    totalRevaluation += impact;
    if (impact > 0) {
      revaluationGain += impact;
    } else if (impact < 0) {
      revaluationLoss += Math.abs(impact);
    }
  });

  return {
    revenue: {
      today: todayRevenue,
      mtd: mtdRevenue,
      ytd: ytdRevenue,
      averageDaily
    },
    profit: {
      gross: grossProfit,
      net: netProfit,
      inventoryRevaluation: totalRevaluation,
      revaluationGain,
      revaluationLoss,
      marginPercent,
      avgPerLiter: totalLitersSold > 0 ? grossProfit / totalLitersSold : 0
    },
    inventory: {
      value: inventoryValue,
      potentialRevenue,
      stockCoverageDays: minCoverage,
      turnover: totalLitersSold > 0 ? totalLitersSold / 30 : 0, // Approx turnover
      deadStockCount,
      fastMovingProducts
    },
    expenses: {
      total: totalExpenses,
      perLiter: totalLitersSold > 0 ? totalExpenses / totalLitersSold : 0,
      salary: {
        total: breakdowns.expensesByCategory['salary'] || 0,
        monthlyAvg: (breakdowns.expensesByCategory['salary'] || 0) / Math.max(1, Object.keys(breakdowns.expensesByMonth).length),
        percentageOfExpenses: totalExpenses > 0 ? ((breakdowns.expensesByCategory['salary'] || 0) / totalExpenses) * 100 : 0
      }
    },
    cash: {
      position: cashPosition
    },
    credit: {
      outstanding,
      collectionEfficiency,
      overdueCustomers,
      riskScore,
      riskLabel
    },
    dataQuality: {
      score: dataQualityScore
    },
    breakdowns,
    branchId
  };
};
