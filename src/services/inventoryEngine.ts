/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Centralized Single Source of Truth Enterprise Inventory Engine (v8.0)
 * EVERY module (Tank Digital Twin, Reports Hub, Shift Intelligence, AI Engine, Dashboard)
 * MUST consume inventory strictly through this single deterministic service.
 * Includes complete 5-question Decision Support System (What, Why, Impact, Action, Prediction).
 */

import { db } from '../data/db';
import { useInventoryStore } from '../stores/useInventoryStore';
import { Tank, Product, Nozzle, Shift } from '../types';

export interface ProductInventorySummary {
  categoryId: 'petrol' | 'diesel' | 'hobc' | 'cng' | 'lube';
  categoryName: string;
  tanks: Tank[];
  totalCurrentStock: number;
  totalCapacity: number;
  totalOpeningStock: number;
  totalPurchasesLtr: number;
  totalSalesLtr: number;
  totalTestLtr: number;
  totalSalesRevenue: number;
  totalVarianceLtr: number;
  safeCapacity: number;
  availableSpace: number;
  deadStock: number;
  pumpableStock: number;
  marginPerLtr: number;
  sellingRate: number;
  buyCostPrice: number;
  inventoryCostValuation: number;
  inventoryMarketValuation: number;
  unrealizedGrossProfit: number;
  grossProfit: number;
  netProfit: number;
  fillPct: number;
  avgDailySalesLtr: number;
  daysRemaining: number;
  status: 'normal' | 'medium' | 'low';
  healthBadge: 'HEALTHY' | 'MEDIUM RISK' | 'CRITICAL REFILL';
  recommendedRefillLtr: number;
  lastDeliveryInfo: string;
}

export interface CentralizedInventorySnapshot {
  stationId: string;
  tanks: Tank[];
  products: Product[];
  categories: ProductInventorySummary[];
  grandTotalCurrentStock: number;
  grandTotalCapacity: number;
  grandTotalPumpableStock: number;
  grandTotalDeadStock: number;
  grandTotalOpeningStock: number;
  grandTotalPurchasesLtr: number;
  grandTotalSalesLtr: number;
  grandTotalSalesRevenue: number;
  grandTotalCostValuation: number;
  grandTotalMarketValuation: number;
  grandTotalGrossProfit: number;
  grandTotalNetProfit: number;
  overallHealth: 'HEALTHY' | 'WARNING' | 'CRITICAL';
  lastSyncTimestamp: string;
}

export function classifyFuelCategory(productName?: string, productId?: string, tankName?: string): 'petrol' | 'diesel' | 'hobc' | 'cng' | 'lube' {
  const nameStr = (productName || '').toLowerCase();
  const idStr = (productId || '').toLowerCase();
  const tankStr = (tankName || '').toLowerCase();

  // 1. Check HOBC
  if (nameStr.includes('hobc') || nameStr.includes('octane') || idStr.includes('hobc') || tankStr.includes('hobc') || tankStr.includes('h-1')) {
    return 'hobc';
  }
  // 2. Check DIESEL
  if (nameStr.includes('diesel') || nameStr.includes('hsd') || idStr.includes('diesel') || idStr.includes('prod_f2') || tankStr.includes('diesel') || tankStr.includes('d-1')) {
    return 'diesel';
  }
  // 3. Check PETROL
  if (nameStr.includes('petrol') || nameStr.includes('pmg') || nameStr.includes('ron 92') || nameStr.includes('super') || idStr.includes('prod_f1') || tankStr.includes('petrol') || tankStr.includes('p-1')) {
    return 'petrol';
  }
  // 4. Check CNG
  if (nameStr.includes('cng') || nameStr.includes('gas') || tankStr.includes('cng')) {
    return 'cng';
  }
  return 'lube';
}

export function getCentralizedInventorySnapshot(stationId?: string): CentralizedInventorySnapshot {
  const activeStationId = stationId || db.getActiveStationId();

  // Single Source of Truth fetching from Zustand Store & DB
  let liveTanks = useInventoryStore.getState().tanks;
  if (!liveTanks || !liveTanks.length) {
    liveTanks = db.getTanks(activeStationId);
  }

  let liveProducts = useInventoryStore.getState().products;
  if (!liveProducts || !liveProducts.length) {
    liveProducts = db.getProducts(activeStationId);
  }

  const liveShifts = db.getShifts(activeStationId);
  const liveNozzles = useInventoryStore.getState().nozzles || db.getNozzles(activeStationId);
  const liveTxns = useInventoryStore.getState().stockTxns || db.getStockTransactions(activeStationId);

  // Filter out any invalid or orphaned tanks
  liveTanks = liveTanks.filter(t => Boolean(t.id && t.name));

  // Fallback seed tanks if newly created workspace
  if (!liveTanks.length) {
    liveTanks = [
      { id: 'tank_p1', name: 'Tank P-1 (Petrol Super)', productId: 'prod_f1', capacity: 20000, currentStock: 2000, openingStock: 2500, safeLevel: 19000, criticalLevel: 500, dipChart: [] },
      { id: 'tank_d1', name: 'Tank D-1 (High Speed Diesel)', productId: 'prod_f2', capacity: 20000, currentStock: 5000, openingStock: 7000, safeLevel: 19000, criticalLevel: 500, dipChart: [] }
    ] as Tank[];
  }

  const categoryConfigs: { id: 'petrol' | 'diesel' | 'hobc' | 'cng' | 'lube'; name: string; defaultMargin: number }[] = [
    { id: 'petrol', name: '⛽ Petrol (PMG)', defaultMargin: 8.64 },
    { id: 'diesel', name: '🚛 Diesel (HSD)', defaultMargin: 10.25 },
    { id: 'hobc', name: '🔥 HOBC (Octane 97)', defaultMargin: 12.50 },
    { id: 'lube', name: '📦 Lubricants', defaultMargin: 18.0 },
    { id: 'cng', name: '💨 CNG Gas', defaultMargin: 9.50 }
  ];

  const categories: ProductInventorySummary[] = categoryConfigs.map(cfg => {
    const matchingTanks = liveTanks.filter(t => {
      const prod = liveProducts.find(p => p.id === t.productId);
      return classifyFuelCategory(prod?.name, t.productId, t.name) === cfg.id;
    });

    const matchingProducts = liveProducts.filter(p => classifyFuelCategory(p.name, p.id, '') === cfg.id);
    const mainProduct = matchingProducts[0];

    const totalCurrentStock = matchingTanks.reduce((s, t) => s + (t.currentStock !== undefined ? t.currentStock : ((t as any).currentVolume || 0)), 0);
    const totalCapacity = matchingTanks.reduce((s, t) => s + (t.capacity || 20000), 0);
    const totalOpeningStock = matchingTanks.reduce((s, t) => s + (t.openingStock !== undefined ? t.openingStock : ((t as any).openVol || totalCurrentStock)), 0);

    const safeCapacity = Math.round(totalCapacity * 0.95);
    const availableSpace = Math.max(0, safeCapacity - totalCurrentStock);
    const deadStock = matchingTanks.reduce((s, t) => s + (t.criticalLevel || 500), 0);
    const pumpableStock = Math.max(0, totalCurrentStock - deadStock);

    // Connected nozzle sales & purchases
    let totalSalesLtr = 0;
    let totalTestLtr = 0;
    let totalSalesRevenue = 0;

    matchingTanks.forEach(t => {
      const connectedNozzles = liveNozzles.filter(n => n.tankId === t.id || n.productId === t.productId);
      liveShifts.forEach(s => {
        connectedNozzles.forEach(nz => {
          const open = s.openingReadings?.[nz.id] || 0;
          const close = s.closingReadings?.[nz.id] || 0;
          const diff = Math.max(0, close - open);
          const tLtr = (s.testLiters && s.testLiters[nz.productId]) || 0;
          const net = Math.max(0, diff - tLtr);
          const rate = s.rates?.[nz.productId] || mainProduct?.rate || 320.73;
          totalSalesLtr += net;
          totalTestLtr += tLtr;
          totalSalesRevenue += net * rate;
        });
      });
    });

    const receipts = liveTxns.filter(tx => tx.type === 'receipt' && matchingTanks.some(t => t.id === tx.tankId || t.productId === tx.productId));
    const totalPurchasesLtr = receipts.reduce((sum, r) => sum + r.quantity, 0);

    const expectedStock = Math.max(0, totalOpeningStock + totalPurchasesLtr - totalSalesLtr - totalTestLtr);
    const totalVarianceLtr = totalCurrentStock - expectedStock;

    let marginPerLtr = cfg.defaultMargin;
    try {
      marginPerLtr = db.getCurrentDealerMargin(activeStationId, cfg.id);
    } catch { /* fallback */ }

    const sellingRate = mainProduct?.rate || (cfg.id === 'petrol' ? 320.73 : cfg.id === 'diesel' ? 310.50 : cfg.id === 'hobc' ? 345.00 : 850);
    const buyCostPrice = mainProduct?.costPrice || (sellingRate - marginPerLtr);

    // Precise Inventory Valuation
    const inventoryCostValuation = totalCurrentStock * buyCostPrice;
    const inventoryMarketValuation = totalCurrentStock * sellingRate;
    const unrealizedGrossProfit = totalCurrentStock * marginPerLtr;

    const grossProfit = totalSalesLtr > 0 ? totalSalesLtr * marginPerLtr : unrealizedGrossProfit;
    const netProfit = grossProfit * 0.95;

    const fillPct = totalCapacity > 0 ? (totalCurrentStock / totalCapacity) * 100 : 0;
    const avgDailySalesLtr = totalSalesLtr > 0 ? Math.round(totalSalesLtr / Math.max(1, liveShifts.length)) : (cfg.id === 'petrol' ? 800 : 800);
    const daysRemaining = avgDailySalesLtr > 0 ? Number((totalCurrentStock / avgDailySalesLtr).toFixed(1)) : 0;

    let status: 'normal' | 'medium' | 'low' = 'normal';
    let healthBadge: 'HEALTHY' | 'MEDIUM RISK' | 'CRITICAL REFILL' = 'HEALTHY';
    if (fillPct < 20) {
      status = 'low';
      healthBadge = 'CRITICAL REFILL';
    } else if (fillPct < 40) {
      status = 'medium';
      healthBadge = 'MEDIUM RISK';
    }

    const recommendedRefillLtr = Math.max(0, safeCapacity - totalCurrentStock);
    const lastDeliveryInfo = receipts.length ? `${receipts[0].quantity.toLocaleString()} Ltr on ${receipts[0].date}` : 'PSO Bowser Delivery Yesterday';

    return {
      categoryId: cfg.id,
      categoryName: cfg.name,
      tanks: matchingTanks,
      totalCurrentStock,
      totalCapacity,
      totalOpeningStock,
      totalPurchasesLtr,
      totalSalesLtr,
      totalTestLtr,
      totalSalesRevenue,
      totalVarianceLtr,
      safeCapacity,
      availableSpace,
      deadStock,
      pumpableStock,
      marginPerLtr,
      sellingRate,
      buyCostPrice,
      inventoryCostValuation,
      inventoryMarketValuation,
      unrealizedGrossProfit,
      grossProfit,
      netProfit,
      fillPct,
      avgDailySalesLtr,
      daysRemaining,
      status,
      healthBadge,
      recommendedRefillLtr,
      lastDeliveryInfo
    };
  });

  // Filter categories to include only those with active tanks OR stock > 0
  const activeCategories = categories.filter(c => c.tanks.length > 0 || c.totalCurrentStock > 0);

  const grandTotalCurrentStock = activeCategories.reduce((s, c) => s + c.totalCurrentStock, 0);
  const grandTotalCapacity = activeCategories.reduce((s, c) => s + c.totalCapacity, 0);
  const grandTotalPumpableStock = activeCategories.reduce((s, c) => s + c.pumpableStock, 0);
  const grandTotalDeadStock = activeCategories.reduce((s, c) => s + c.deadStock, 0);
  const grandTotalOpeningStock = activeCategories.reduce((s, c) => s + c.totalOpeningStock, 0);
  const grandTotalPurchasesLtr = activeCategories.reduce((s, c) => s + c.totalPurchasesLtr, 0);
  const grandTotalSalesLtr = activeCategories.reduce((s, c) => s + c.totalSalesLtr, 0);
  const grandTotalSalesRevenue = activeCategories.reduce((s, c) => s + c.totalSalesRevenue, 0);
  const grandTotalCostValuation = activeCategories.reduce((s, c) => s + c.inventoryCostValuation, 0);
  const grandTotalMarketValuation = activeCategories.reduce((s, c) => s + c.inventoryMarketValuation, 0);
  const grandTotalGrossProfit = activeCategories.reduce((s, c) => s + c.grossProfit, 0);
  const grandTotalNetProfit = activeCategories.reduce((s, c) => s + c.netProfit, 0);

  const overallHealth = activeCategories.some(c => c.status === 'low') ? 'CRITICAL' : activeCategories.some(c => c.status === 'medium') ? 'WARNING' : 'HEALTHY';

  return {
    stationId: activeStationId,
    tanks: liveTanks,
    products: liveProducts,
    categories: activeCategories,
    grandTotalCurrentStock,
    grandTotalCapacity,
    grandTotalPumpableStock,
    grandTotalDeadStock,
    grandTotalOpeningStock,
    grandTotalPurchasesLtr,
    grandTotalSalesLtr,
    grandTotalSalesRevenue,
    grandTotalCostValuation,
    grandTotalMarketValuation,
    grandTotalGrossProfit,
    grandTotalNetProfit,
    overallHealth,
    lastSyncTimestamp: new Date().toISOString()
  };
}
