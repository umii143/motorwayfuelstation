import { useMemo } from 'react';
import { useStation } from '../contexts/StationContext';

export interface FinancialMetricsResult {
  todayRevenue: number;
  todayProfit: number;
  todayLiters: number;
  totalTxns: number;
}

export function useFinancialMetrics(): FinancialMetricsResult {
  const { shifts, stockTxns, products } = useStation();

  return useMemo<FinancialMetricsResult>(() => {
    // Basic Financial Metrics from Today's shifts
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let todayRevenue = 0;
    let todayProfit = 0;
    let todayLiters = 0;
    const totalTxns = stockTxns.filter(t => new Date(t.date) >= today).length;

    // Process shifts for today
    shifts.forEach(shift => {
      const shiftDate = new Date(shift.startTime);
      shiftDate.setHours(0,0,0,0);
      
      if (shiftDate.getTime() === today.getTime()) {
        todayRevenue += shift.totalSales || 0;
        
        // Calculate Liter volume and Profit from nozzle readings
        (shift as Shift & { pumpReadings?: { nozzleReadings?: { currentReading: number, previousReading: number, productId: string }[] }[] }).pumpReadings?.forEach((reading) => {
          reading.nozzleReadings?.forEach((nr) => {
            const vol = nr.currentReading - nr.previousReading;
            if (vol > 0) {
              todayLiters += vol;
              const product = products.find(p => p.id === nr.productId);
              if (product) {
                // Estimated profit per liter = rate - purchasePrice (assuming purchaseRate exists, or use a default margin)
                const currentRate = product.currentRate || product.rate;
                const purchaseRate = product.purchaseRate || product.purchasePrice;
                const margin = purchaseRate ? (currentRate - purchaseRate) : (currentRate * 0.05);
                todayProfit += vol * margin;
              }
            }
          });
        });
      }
    });

    return {
      todayRevenue,
      todayProfit,
      todayLiters,
      totalTxns
    };
  }, [shifts, stockTxns, products]);
}
