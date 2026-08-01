import { Product, Tank, Shift, Customer, Supplier, BankAccount, DigitalAccount } from '../types';

export interface AIStationContext {
  date: string;
  time: string;
  stationName: string;
  products: Array<{
    id: string;
    name: string;
    type: string;
    currentStock: number;
    minStock: number;
    rate: number;
    unit: string;
    isLowStock: boolean;
  }>;
  tanks: Array<{
    id: string;
    name: string;
    productName: string;
    currentStock: number;
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
  };
  treasury: {
    totalCashBalance: number;
    totalBankBalance: number;
    banks: Array<{ name: string; balance: number }>;
  };
  customers: {
    totalCount: number;
    totalCredit: number;
  };
  suppliers: {
    totalCount: number;
    totalPayable: number;
  };
}

export function buildAIContext(params: {
  stationName?: string;
  products?: Product[];
  tanks?: Tank[];
  shifts?: Shift[];
  customers?: Customer[];
  suppliers?: Supplier[];
  banks?: BankAccount[];
  digitalAccounts?: DigitalAccount[];
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

  const productsMap = new Map<string, string>();
  productsList.forEach(p => productsMap.set(p.id, p.name));

  const mappedProducts = productsList.map(p => ({
    id: p.id,
    name: p.name,
    type: p.type || 'fuel',
    currentStock: Number(p.currentStock || 0),
    minStock: Number(p.minStock || 0),
    rate: Number(p.rate || p.sellingPrice || p.currentRate || 0),
    unit: p.unit || (p.type === 'lube' ? 'Pcs' : 'Liters'),
    isLowStock: Number(p.currentStock || 0) <= Number(p.minStock || 0) && Number(p.minStock || 0) > 0,
  }));

  const mappedTanks = tanksList.map(t => {
    const productName = t.productName || productsMap.get(t.productId) || 'Fuel Product';
    const cap = Number(t.capacity || 10000);
    const stock = Number(t.currentStock || 0);
    return {
      id: t.id,
      name: t.name,
      productName,
      currentStock: stock,
      capacity: cap,
      safeLevel: Number(t.safeLevel || cap * 0.8),
      criticalLevel: Number(t.criticalLevel || cap * 0.15),
      percentFull: cap > 0 ? Math.round((stock / cap) * 100) : 0,
    };
  });

  const activeShift = shiftsList.find(s => s.status === 'active');
  const mappedActiveShift = activeShift
    ? {
        id: activeShift.id,
        staffId: activeShift.staffId || 'Unassigned',
        date: activeShift.date || dateStr,
        status: activeShift.status,
        submittedCash: Number(activeShift.submittedCash || 0),
      }
    : undefined;

  const totalBankBalance = banksList.reduce((sum, b) => sum + Number(b.balance || 0), 0);
  const totalCredit = customersList.reduce((sum, c) => sum + Math.max(0, Number(c.balance || 0)), 0);
  const totalPayable = suppliersList.reduce((sum, s) => sum + Math.max(0, Number(s.balance || 0)), 0);

  return {
    date: dateStr,
    time: timeStr,
    stationName: params.stationName || 'SHIFTWIZARD ERP',
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
    },
    suppliers: {
      totalCount: suppliersList.length,
      totalPayable,
    },
  };
}
