import { useMemo } from 'react';
import { useInventoryStore } from '../../stores/useInventoryStore';
import { useShiftStore } from '../../stores/useShiftStore';
import { useFinancialStore } from '../../stores/useFinancialStore';
import { useSupplierStore } from '../../stores/useSupplierStore';

export interface BIFilter {
  startDate: string;
  endDate: string;
  productId: string;
}

export function useBIAggregator(filter: BIFilter) {
  const { products = [], stockBatches: batches = [], rateHistory = [] } = useInventoryStore();
  const { shifts = [] } = useShiftStore();
  const { standaloneExpenses = [] } = useFinancialStore();
  const { suppliers = [] } = useSupplierStore();

  const metrics = useMemo(() => {
    let totalInvested = 0;
    let totalRevenue = 0;
    let totalCogs = 0;
    let totalCarriage = 0;
    let totalOtherExpenses = 0;
    let inventoryGainLoss = 0;
    
    // Process Batches (Purchases & Carriage)
    const filteredBatches = batches.filter(b => {
      const isDateMatch = b.date >= filter.startDate && b.date <= filter.endDate;
      const isProdMatch = filter.productId === 'all' || b.productId === filter.productId;
      return isDateMatch && isProdMatch;
    });

    let totalLitersPurchased = 0;
    let supplierPerformance: Record<string, { batches: number, liters: number, spent: number, count: number }> = {};

    filteredBatches.forEach(b => {
      const stockCost = (b.quantityReceived || 0) * (b.purchasePrice || 0);
      const carriage = b.carriageExpense || 0;
      totalInvested += stockCost + carriage;
      totalCogs += stockCost;
      totalCarriage += carriage;
      
      totalLitersPurchased += (b.quantityReceived || 0);

      if (b.supplierId) {
        if (!supplierPerformance[b.supplierId]) {
          supplierPerformance[b.supplierId] = { batches: 0, liters: 0, spent: 0, count: 0 };
        }
        supplierPerformance[b.supplierId].batches += 1;
        supplierPerformance[b.supplierId].liters += (b.quantityReceived || 0);
        supplierPerformance[b.supplierId].spent += stockCost + carriage;
        supplierPerformance[b.supplierId].count += 1;
      }
    });

    // Process Expenses (Other Expenses)
    const filteredExpenses = standaloneExpenses.filter(e => e.date >= filter.startDate && e.date <= filter.endDate);
    filteredExpenses.forEach(e => {
      totalInvested += e.amount;
      totalOtherExpenses += e.amount;
    });

    // Process Shifts (Revenue, Sales, Test Liters)
    const filteredShifts = shifts.filter(s => s.date >= filter.startDate && s.date <= filter.endDate);
    let totalTestLiters = 0;
    let productSales: Record<string, { revenue: number, liters: number, cogs: number }> = {};
    
    let paymentBreakdown = {
      cash: 0, bank: 0, digital: 0, credit: 0
    };

    filteredShifts.forEach(shift => {
      let shiftRevenue = 0;
      let shiftCogs = 0;
      (shift.nozzleData || []).forEach(n => {
        if (filter.productId === 'all' || n.productId === filter.productId) {
          const liters = n.closingReading - n.openingReading - (n.testLiters || 0);
          totalTestLiters += (n.testLiters || 0);
          const revenue = liters * n.rate;
          const cogs = liters * (n.costPrice || 0); // Simplified cost calculation
          
          shiftRevenue += revenue;
          shiftCogs += cogs;

          if (!productSales[n.productId]) productSales[n.productId] = { revenue: 0, liters: 0, cogs: 0 };
          productSales[n.productId].revenue += revenue;
          productSales[n.productId].liters += liters;
          productSales[n.productId].cogs += cogs;
        }
      });
      totalRevenue += shiftRevenue;
      
      // Breakdown payments
      paymentBreakdown.cash += shift.cashDeposited || 0;
      paymentBreakdown.bank += shift.bankDeposited || 0;
      paymentBreakdown.digital += shift.digitalDeposited || 0;
      paymentBreakdown.credit += shift.creditSales || 0;
    });

    // Process Rate History for Inventory Gain/Loss
    const filteredRates = rateHistory.filter(r => r.date >= filter.startDate && r.date <= filter.endDate);
    filteredRates.forEach(r => {
      if (filter.productId === 'all' || r.productId === filter.productId) {
        inventoryGainLoss += (r.gainLoss || r.impactAmount || 0);
      }
    });

    // Working Capital (Mocked partially from current stock)
    let currentStockValueCost = 0;
    let currentStockValueSell = 0;
    products.forEach(p => {
      if (filter.productId === 'all' || p.id === filter.productId) {
        currentStockValueCost += (p.currentStock || 0) * (p.averageCost || 0);
        currentStockValueSell += (p.currentStock || 0) * (p.rate || 0);
      }
    });

    const totalExpenses = totalCarriage + totalOtherExpenses;
    const netProfit = totalRevenue - totalCogs - totalExpenses + inventoryGainLoss;
    const roi = totalInvested > 0 ? (netProfit / totalInvested) * 100 : 0;

    return {
      kpi: {
        totalInvested,
        totalRevenue,
        netProfit,
        totalLitersPurchased,
        inventoryGainLoss,
        roi
      },
      productSales,
      supplierPerformance,
      paymentBreakdown,
      costs: {
        cogs: totalCogs,
        carriage: totalCarriage,
        otherExpenses: totalOtherExpenses
      },
      stock: {
        valueCost: currentStockValueCost,
        valueSell: currentStockValueSell,
        unrealizedProfit: currentStockValueSell - currentStockValueCost
      },
      smartMetrics: {
        totalTestLiters
      }
    };
  }, [filter, batches, standaloneExpenses, shifts, rateHistory, products]);

  return metrics;
}
