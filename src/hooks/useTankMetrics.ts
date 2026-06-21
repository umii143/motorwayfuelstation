import { useMemo } from 'react';
import { useStation } from '../contexts/StationContext';

export function useTankMetrics() {
  const { tanks, products, stockTxns } = useStation();

  return useMemo(() => {
    let lowStockCount = 0;
    let outOfStockCount = 0;
    let totalTankCapacity = 0;
    let totalCurrentStock = 0;
    
    const enrichedTanks = (tanks || []).map(t => {
      totalTankCapacity += t.capacity;
      totalCurrentStock += t.currentStock;
      
      const pct = t.capacity > 0 ? (t.currentStock / t.capacity) * 100 : 0;
      if (pct < 15) lowStockCount++;
      if (t.currentStock <= 0) outOfStockCount++;

      const product = products.find(p => p.id === t.productId);
      
      // Calculate average daily consumption based on recent stockTxns
      const tankTxns = stockTxns.filter(tx => (tx as any).tankId === t.id && (tx as any).type === 'dispatch');
      const recentTxns = tankTxns.slice(0, 10);
      let avgDailyConsumption = 0;
      if (recentTxns.length > 0) {
        const totalDisp = recentTxns.reduce((sum, tx) => sum + ((tx as any).quantity || 0), 0);
        avgDailyConsumption = totalDisp / recentTxns.length; // rough estimate
      }

      const daysRemaining = avgDailyConsumption > 0 ? t.currentStock / avgDailyConsumption : 0;

      let healthStatus = 'Healthy';
      if (t.currentStock <= 0) healthStatus = 'Critical';
      else if (pct < 15) healthStatus = 'Low Stock';
      else if ((t as any).calibrationDue && new Date((t as any).calibrationDue) < new Date()) healthStatus = 'Calibration Due';

      return {
        ...t,
        productName: product?.name || 'Unknown',
        productColor: product?.name.toLowerCase().includes('diesel') ? '#10B981' : product?.name.toLowerCase().includes('octane') ? '#8B5CF6' : '#F97316',
        fillPercentage: pct,
        daysRemaining,
        healthStatus,
        avgDailyConsumption
      };
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
