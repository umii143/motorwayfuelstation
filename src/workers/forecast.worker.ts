// Web Worker for Deterministic Forecasting
// NO ML/AI is used here as per Enterprise Rule Phase 3A

export interface ForecastInput {
  dailyData: {
    date: string;
    totalVolume: number;
    totalProfit: number;
    txnCount: number;
    productVolumes: Record<string, number>;
  }[];
  tanks: {
    id: string;
    name: string;
    productId: string;
    currentStock: number;
  }[];
}

export interface TankForecast {
  tankId: string;
  tankName: string;
  estimatedRemainingDays: number | null;
  estimatedStockOutDate: string | null;
  status: 'Healthy' | 'Warning' | 'Critical' | 'Insufficient Data';
}

export interface ForecastResult {
  demandForecast: {
    ma7: number;
    ma14: number;
    ma30: number;
    projectedNext7Days: number;
  } | null;
  projectedWeeklyProfit: number | null;
  tankForecasts: TankForecast[];
  confidenceScore: number;
  dataQuality: {
    daysAvailable: number;
    txnCount: number;
    isDemandMet: boolean;
    isProfitMet: boolean;
    isTankMet: boolean;
  };
}

const MIN_DAYS_DEMAND = 14;
const MIN_TXNS_PROFIT = 100;
const MIN_RECORDS_TANK = 50;

self.onmessage = (e: MessageEvent<ForecastInput>) => {
  try {
    const { dailyData, tanks } = e.data;
    
    // Sort chronological
    const sortedData = [...dailyData].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    const daysAvailable = sortedData.length;
    const totalTxns = sortedData.reduce((sum, d) => sum + d.txnCount, 0);

    const isDemandMet = daysAvailable >= MIN_DAYS_DEMAND;
    const isProfitMet = totalTxns >= MIN_TXNS_PROFIT;
    const isTankMet = totalTxns >= MIN_RECORDS_TANK;

    // 1. Demand Forecast (Moving Averages)
    let demandForecast = null;
    if (isDemandMet) {
      const getMA = (days: number) => {
        const slice = sortedData.slice(-days);
        if (slice.length === 0) return 0;
        const total = slice.reduce((sum, d) => sum + d.totalVolume, 0);
        return total / slice.length;
      };

      const ma7 = getMA(7);
      const ma14 = getMA(14);
      const ma30 = getMA(30);

      demandForecast = {
        ma7,
        ma14,
        ma30,
        projectedNext7Days: ma7 * 7
      };
    }

    // 2. Profit Projection
    let projectedWeeklyProfit = null;
    if (isProfitMet && daysAvailable > 0) {
      const recentDays = Math.min(daysAvailable, 7);
      const recentData = sortedData.slice(-recentDays);
      const avgDailyProfit = recentData.reduce((sum, d) => sum + d.totalProfit, 0) / recentDays;
      projectedWeeklyProfit = avgDailyProfit * 7;
    }

    // 3. Stock Depletion Forecast
    const tankForecasts: TankForecast[] = tanks.map(tank => {
      if (!isTankMet || daysAvailable === 0) {
        return {
          tankId: tank.id,
          tankName: tank.name,
          estimatedRemainingDays: null,
          estimatedStockOutDate: null,
          status: 'Insufficient Data'
        };
      }

      // Calculate average daily consumption for this specific product
      const recentDaysForTank = Math.min(daysAvailable, 14);
      const recentData = sortedData.slice(-recentDaysForTank);
      
      const totalConsumption = recentData.reduce((sum, d) => {
        return sum + (d.productVolumes[tank.productId] || 0);
      }, 0);
      
      const avgDailyConsumption = totalConsumption / recentDaysForTank;

      let remainingDays = null;
      let stockOutDate = null;
      let status: TankForecast['status'] = 'Healthy';

      if (avgDailyConsumption > 0) {
        remainingDays = Number((tank.currentStock / avgDailyConsumption).toFixed(1));
        
        const date = new Date();
        date.setDate(date.getDate() + Math.floor(remainingDays));
        stockOutDate = date.toISOString().split('T')[0];

        if (remainingDays <= 2) {
          status = 'Critical';
        } else if (remainingDays <= 5) {
          status = 'Warning';
        }
      } else {
        // No consumption, basically infinite
        remainingDays = 999;
      }

      return {
        tankId: tank.id,
        tankName: tank.name,
        estimatedRemainingDays: remainingDays === 999 ? null : remainingDays,
        estimatedStockOutDate: stockOutDate,
        status: remainingDays === 999 ? 'Healthy' : status
      };
    });

    // 4. Confidence Score Calculation
    // Base 50% for having minimum data, then scaling up based on volume of data
    let confidenceScore = 0;
    if (isDemandMet && isProfitMet && isTankMet) {
      confidenceScore += 60; // Baseline for passing thresholds
      
      // Bonus for more days
      if (daysAvailable >= 30) confidenceScore += 15;
      else if (daysAvailable >= 21) confidenceScore += 10;
      else if (daysAvailable >= 14) confidenceScore += 5;

      // Bonus for transaction volume
      if (totalTxns >= 1000) confidenceScore += 15;
      else if (totalTxns >= 500) confidenceScore += 10;
      else if (totalTxns >= 200) confidenceScore += 5;

      // Variance consistency (simplified proxy: if MA7 and MA14 are close, confidence is higher)
      if (demandForecast && demandForecast.ma7 > 0) {
        const diffRatio = Math.abs(demandForecast.ma7 - demandForecast.ma14) / demandForecast.ma7;
        if (diffRatio < 0.1) confidenceScore += 10; // Very consistent
        else if (diffRatio < 0.2) confidenceScore += 5; // Somewhat consistent
      }
    } else {
      // Partial scores
      if (daysAvailable > 0) confidenceScore += Math.min(30, (daysAvailable / MIN_DAYS_DEMAND) * 30);
      if (totalTxns > 0) confidenceScore += Math.min(30, (totalTxns / MIN_TXNS_PROFIT) * 30);
    }

    const result: ForecastResult = {
      demandForecast,
      projectedWeeklyProfit,
      tankForecasts,
      confidenceScore: Math.min(99, Math.round(confidenceScore)), // Cap at 99%, never say 100%
      dataQuality: {
        daysAvailable,
        txnCount: totalTxns,
        isDemandMet,
        isProfitMet,
        isTankMet
      }
    };

    self.postMessage(result);
  } catch (error) {
    console.error('Forecast Worker Error:', error);
    self.postMessage({ error: 'Forecast computation failed' });
  }
};
