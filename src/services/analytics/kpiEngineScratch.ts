import { Shift, Product, Customer, Tank } from '../../types';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { forecastFuelDemand } from './demandForecastEngine';

export interface KPIResult {
  revenue: {
    today: number;
    mtd: number;
    ytd: number;
    averageDaily: number;
  };
  profit: {
    cogs: number;
    gross: number;
    net: number;
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
  cash: {
    position: number;
  };
  expenses: {
    total: number;
    perLiter: number;
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
}

export const generateKPIs = (
  shifts: Shift[],
  products: Product[],
  customers: Customer[],
  tanks: Tank[],
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  branchId: string = 'main'
): KPIResult => {
  return {
    revenue: { today: 0, mtd: 0, ytd: 0, averageDaily: 0 },
    profit: { cogs: 0, gross: 0, net: 0, marginPercent: 0, avgPerLiter: 0 },
    inventory: { value: 0, potentialRevenue: 0, stockCoverageDays: 0, turnover: 0, deadStockCount: 0, fastMovingProducts: [] },
    cash: { position: 0 },
    expenses: { total: 0, perLiter: 0 },
    credit: { outstanding: 0, collectionEfficiency: 0, overdueCustomers: 0, riskScore: 0, riskLabel: 'Low' },
    dataQuality: { score: 100 }
  };
};
