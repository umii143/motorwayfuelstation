import { Product, Tank, Shift, Customer, Supplier, BankAccount, DigitalAccount, Nozzle, ExpenseEntry } from '../types';

export interface AIStationContext {
  date: string;
  time: string;
  stationName: string;
  businessType: string;
  products: Array<{
    id: string;
    name: string;
    type: string;
    currentStock: number;
    openingStock: number;
    salesToday: number;
    minStock: number;
    rate: number;
    unit: string;
    valuation: number;
    isLowStock: boolean;
    daysRemaining: number;
    recommendedReorder: number;
  }>;
  tanks: Array<{
    id: string;
    name: string;
    productName: string;
    currentStock: number;
    openingStock: number;
    capacity: number;
    safeLevel: number;
    criticalLevel: number;
    percentFull: number;
  }>;
  activeShift?: {
    id: string;
    staffId: string;
    date: string;
    status: string;
    submittedCash: number;
    meterLitersSold: number;
    fuelRevenue: number;
  };
  treasury: {
    totalCashBalance: number;
    totalBankBalance: number;
    banks: Array<{ name: string; balance: number }>;
  };
  customers: {
    totalCount: number;
    totalCredit: number;
    highRiskOverdue: Array<{ name: string; balance: number; limit: number }>;
  };
  suppliers: {
    totalCount: number;
    totalPayable: number;
    topPayables: Array<{ name: string; balance: number }>;
  };
  expensesToday: {
    totalAmount: number;
  };
  activeAlerts: Array<{
    type: 'low_stock' | 'credit_risk' | 'shift_variance' | 'tank_critical';
    severity: 'high' | 'medium' | 'low';
    message: string;
    actionRoute: string;
    actionLabel: string;
  }>;
}

export function buildAIContext(params: {
  stationName?: string;
  businessType?: string;
  products?: Product[];
  tanks?: Tank[];
  nozzles?: Nozzle[];
  shifts?: Shift[];
  customers?: Customer[];
  suppliers?: Supplier[];
  banks?: BankAccount[];
  digitalAccounts?: DigitalAccount[];
  expenses?: ExpenseEntry[];
}): AIStationContext {
  const now = new Date();
  const dateStr = now.toISOString().split('T')[0];
  const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const productsList = params.products || [];
  const tanksList = params.tanks || [];
  const shiftsList = params.shifts || [];
  const customersList = params.customers || [];
  const suppliersList = params.suppliers || [];
  const banksList = params.banks || [];
  const expensesList = params.expenses || [];

  const productsMap = new Map<string, string>();
  productsList.forEach(p => productsMap.set(p.id, p.name));

  const activeShift = shiftsList.find(s => s.status === 'active');

  const alerts: AIStationContext['activeAlerts'] = [];

  const mappedProducts = productsList.map(p => {
    const stock = Number(p.currentStock || 0);
    const min = Number(p.minStock || 0);
    const rate = Number(p.rate || p.sellingPrice || p.currentRate || 0);
    const isLow = stock <= min && min > 0;

    // Estimate daily sales & days remaining
    const estimatedDailySales = Math.max(100, Math.round(stock * 0.15));
    const daysRemaining = Number((stock / estimatedDailySales).toFixed(1));
    const reorderQty = isLow ? Math.max(5000, min * 3 - stock) : 0;

    if (isLow) {
      alerts.push({
        type: 'low_stock',
        severity: stock <= min * 0.5 ? 'high' : 'medium',
        message: `${p.name} stock is low (${stock.toLocaleString()} ${p.unit || 'L'} left). Reorder recommended.`,
        actionRoute: '/inventory',
        actionLabel: 'Create Purchase Order',
      });
    }

    return {
      id: p.id,
      name: p.name,
      type: p.type || 'fuel',
      currentStock: stock,
      openingStock: Number(p.capacity || stock * 1.5),
      salesToday: Math.max(0, Number(p.capacity || 0) - stock),
      minStock: min,
      rate,
      unit: p.unit || (p.type === 'lube' ? 'Pcs' : 'Liters'),
      valuation: stock * rate,
      isLowStock: isLow,
      daysRemaining,
      recommendedReorder: reorderQty,
    };
  });

  const mappedTanks = tanksList.map(t => {
    const productName = t.productName || productsMap.get(t.productId) || 'Fuel Product';
    const cap = Number(t.capacity || 10000);
    const stock = Number(t.currentStock || 0);
    const percentFull = cap > 0 ? Math.round((stock / cap) * 100) : 0;

    if (percentFull <= 15) {
      alerts.push({
        type: 'tank_critical',
        severity: 'high',
        message: `${t.name} (${productName}) is at critical level (${percentFull}% full).`,
        actionRoute: '/dip-calculator',
        actionLabel: 'Open Wet Stock & Dip Calculator',
      });
    }

    return {
      id: t.id,
      name: t.name,
      productName,
      currentStock: stock,
      openingStock: Number(t.openingStock || stock),
      capacity: cap,
      safeLevel: Number(t.safeLevel || cap * 0.8),
      criticalLevel: Number(t.criticalLevel || cap * 0.15),
      percentFull,
    };
  });

  const mappedActiveShift = activeShift
    ? {
        id: activeShift.id,
        staffId: activeShift.staffId || 'Unassigned',
        date: activeShift.date || dateStr,
        status: activeShift.status,
        submittedCash: Number(activeShift.submittedCash || 0),
        meterLitersSold: 0,
        fuelRevenue: Number(activeShift.submittedCash || 0),
      }
    : undefined;

  const totalBankBalance = banksList.reduce((sum, b) => sum + Number(b.balance || 0), 0);
  const totalCredit = customersList.reduce((sum, c) => sum + Math.max(0, Number(c.balance || 0)), 0);
  const totalPayable = suppliersList.reduce((sum, s) => sum + Math.max(0, Number(s.balance || 0)), 0);

  const highRiskCustomers = customersList
    .filter(c => Number(c.balance || 0) > Number(c.creditLimit || 50000))
    .slice(0, 5)
    .map(c => ({ name: c.name, balance: Number(c.balance || 0), limit: Number(c.creditLimit || 0) }));

  if (highRiskCustomers.length > 0) {
    alerts.push({
      type: 'credit_risk',
      severity: 'medium',
      message: `${highRiskCustomers.length} customer(s) exceeded credit limit.`,
      actionRoute: '/customers',
      actionLabel: 'Open Customer Credit Center',
    });
  }

  const topPayables = suppliersList
    .filter(s => Number(s.balance || 0) > 0)
    .slice(0, 5)
    .map(s => ({ name: s.name, balance: Number(s.balance || 0) }));

  if (totalPayable > 100000) {
    alerts.push({
      type: 'credit_risk',
      severity: 'medium',
      message: `Outstanding supplier payables total Rs ${totalPayable.toLocaleString()}.`,
      actionRoute: '/suppliers',
      actionLabel: 'Settle Supplier Payment',
    });
  }

  const todayExpenses = expensesList
    .filter(e => e.date === dateStr)
    .reduce((sum, e) => sum + Number(e.amount || 0), 0);

  return {
    date: dateStr,
    time: timeStr,
    stationName: params.stationName || 'SHIFTWIZARD ERP',
    businessType: params.businessType || 'fuel_station',
    products: mappedProducts,
    tanks: mappedTanks,
    activeShift: mappedActiveShift,
    treasury: {
      totalCashBalance: 0,
      totalBankBalance,
      banks: banksList.map(b => ({ name: b.name, balance: Number(b.balance || 0) })),
    },
    customers: {
      totalCount: customersList.length,
      totalCredit,
      highRiskOverdue: highRiskCustomers,
    },
    suppliers: {
      totalCount: suppliersList.length,
      totalPayable,
      topPayables,
    },
    expensesToday: {
      totalAmount: todayExpenses,
    },
    activeAlerts: alerts,
  };
}
