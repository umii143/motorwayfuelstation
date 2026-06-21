import { useMemo } from 'react';
import { useStation } from '../contexts/StationContext';

export function useFinancialMetrics() {
  const { shifts, stockTxns, products } = useStation();

  return useMemo(() => {
    // Basic Financial Metrics from Today's shifts
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let todayRevenue = 0;
    let todayProfit = 0;
    let todayLiters = 0;
    let totalTxns = stockTxns.filter(t => new Date(t.date) >= today).length;

    // Process shifts for today
    shifts.forEach(shift => {
      const shiftDate = new Date(shift.startTime);
      shiftDate.setHours(0,0,0,0);
      
      if (shiftDate.getTime() === today.getTime()) {
        todayRevenue += shift.totalSales || 0;
        
        // Calculate Liter volume and Profit from nozzle readings
        shift.pumpReadings?.forEach(reading => {
          reading.nozzleReadings?.forEach(nr => {
            const vol = nr.currentReading - nr.previousReading;
            if (vol > 0) {
              todayLiters += vol;
              const product = products.find(p => p.id === nr.productId);
              if (product) {
                // Estimated profit per liter = rate - purchasePrice (assuming purchaseRate exists, or use a default margin)
                const margin = product.purchaseRate ? (product.currentRate - product.purchaseRate) : (product.currentRate * 0.05);
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
