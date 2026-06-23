import { useMemo } from 'react';
import { useStation } from '../contexts/StationContext';
import { Tank } from '../types';

export interface EnrichedTank extends Tank {
  productName: string;
  productColor: string;
  fillPercentage: number;
  daysRemaining: number;
  healthStatus: string;
  avgDailyConsumption: number;
}

export interface TankMetricsResult {
  tanks: EnrichedTank[];
  totalTankCapacity: number;
  totalCurrentStock: number;
  lowStockCount: number;
  outOfStockCount: number;
  tankHealthPct: number;
}

export function useTankMetrics(): TankMetricsResult {
  const { tanks, products, stockTxns } = useStation();

  return useMemo<TankMetricsResult>(() => {
    let lowStockCount = 0;
    let outOfStockCount = 0;
    let totalTankCapacity = 0;
    let totalCurrentStock = 0;
    
    const enrichedTanks: EnrichedTank[] = [];
    
    (tanks || []).forEach(t => {
      totalTankCapacity += t.capacity;
      totalCurrentStock += t.currentStock;
      
      const pct = t.capacity > 0 ? (t.currentStock / t.capacity) * 100 : 0;
      if (pct < 15) lowStockCount++;
      if (t.currentStock <= 0) outOfStockCount++;

      const product = products.find(p => p.id === t.productId);
      
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const tankTxns = stockTxns.filter(tx => tx.tankId === t.id && (tx as any).type === 'sale');
      const recentTxns = tankTxns.slice(0, 10);
      let avgDailyConsumption = 0;
      if (recentTxns.length > 0) {
        const totalDisp = recentTxns.reduce((sum, tx) => sum + (tx.quantity || 0), 0);
        avgDailyConsumption = totalDisp / recentTxns.length; 
      }

      const daysRemaining = avgDailyConsumption > 0 ? t.currentStock / avgDailyConsumption : 0;

      let healthStatus = 'Healthy';
      if (t.currentStock <= 0) healthStatus = 'Critical';
      else if (pct < 15) healthStatus = 'Low Stock';
      else if (t.calibrationDue && new Date(t.calibrationDue) < new Date()) healthStatus = 'Calibration Due';

      enrichedTanks.push({
        ...t,
        productName: product?.name || 'Unknown',
        productColor: product?.name.toLowerCase().includes('diesel') ? '#10B981' : product?.name.toLowerCase().includes('octane') ? '#8B5CF6' : '#F97316',
        fillPercentage: pct,
        daysRemaining,
        healthStatus,
        avgDailyConsumption
      });
    });

    const tankHealthPct = totalTankCapacity > 0 ? (totalCurrentStock / totalTankCapacity) * 100 : 100;

    return {
      tanks: enrichedTanks,
      totalTankCapacity,
      totalCurrentStock,
      lowStockCount,
      outOfStockCount,
      tankHealthPct
    };
  }, [tanks, products, stockTxns]);
}
