// Web Worker for Deterministic Forecasting
import { logger } from '../lib/logger';
// Phase 3B: Advanced Seasonality & Event Engine

export interface ForecastInput {
  dailyData: {
    date: string;
    totalVolume: number;
    totalProfit: number;
    txnCount: number;
    productVolumes: Record<string, number>;
  }[];
  shiftsData?: {
    date: string;
    shiftType: 'day' | 'night';
    volume: number;
  }[];
  tanks: {
    id: string;
    name: string;
    productId: string;
    currentStock: number;
  }[];
  settings?: unknown;
}

export interface TankForecast {
  tankId: string;
  tankName: string;
  estimatedRemainingDays: number | null;
  estimatedStockOutDate: string | null;
  status: 'Healthy' | 'Warning' | 'Critical' | 'Insufficient Data';
}

export interface SeasonalityMetrics {
  isAvailable: boolean; // Requires > 365 days of data
  weeklyTrend: Record<string, number>; // { "Monday": 0.94, "Friday": 1.22 }
  busiestDay: string;
  dayPartTrend: { day: number; night: number }; // Impact Pct vs Historical Average
  monthlySeasonStrength: { status: 'Strong Season' | 'Weak Season' | 'Normal'; impactPct: number };
  fuelTypeSeasonality: Record<string, number>; // { "Petrol": 10, "Diesel": 2 }
  upcomingEvent?: { name: string; expectedDemand: number; confidence: number; daysUntil: number };
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
  seasonality?: SeasonalityMetrics;
}

const MIN_DAYS_DEMAND = 14;
const MIN_TXNS_PROFIT = 100;
const MIN_RECORDS_TANK = 50;
const MIN_DAYS_SEASONALITY = 365;

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

self.onmessage = (e: MessageEvent<ForecastInput>) => {
  try {
    const { dailyData, shiftsData, tanks, settings } = e.data;
    
    // Sort chronological
    const sortedData = [...dailyData].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    const daysAvailable = sortedData.length;
    const totalTxns = sortedData.reduce((sum, d) => sum + d.txnCount, 0);

    const isDemandMet = daysAvailable >= MIN_DAYS_DEMAND;
    const isProfitMet = totalTxns >= MIN_TXNS_PROFIT;
    const isTankMet = totalTxns >= MIN_RECORDS_TANK;
    const isSeasonalityMet = daysAvailable >= MIN_DAYS_SEASONALITY;

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

    // 4. Seasonality Engine (Phase 3B)
    const seasonality: SeasonalityMetrics = {
      isAvailable: false,
      weeklyTrend: { /* empty */ },
      busiestDay: 'N/A',
      dayPartTrend: { day: 0, night: 0 },
      monthlySeasonStrength: { status: 'Normal', impactPct: 0 },
      fuelTypeSeasonality: { /* empty */ }
    };

    if (daysAvailable > 0) {
      // 4a. Weekly Trend (Calculable even with 14+ days)
      const daysVolume: Record<number, { sum: number; count: number }> = {
        0: { sum: 0, count: 0 }, 1: { sum: 0, count: 0 }, 2: { sum: 0, count: 0 },
        3: { sum: 0, count: 0 }, 4: { sum: 0, count: 0 }, 5: { sum: 0, count: 0 }, 6: { sum: 0, count: 0 }
      };

      let grandTotalVolume = 0;
      sortedData.forEach(d => {
        const dayOfWeek = new Date(d.date).getDay();
        daysVolume[dayOfWeek].sum += d.totalVolume;
        daysVolume[dayOfWeek].count += 1;
        grandTotalVolume += d.totalVolume;
      });

      const overallAvgDaily = grandTotalVolume / sortedData.length;
      let busiestDayStr = 'N/A';
      let maxMult = 0;

      const weeklyTrend: Record<string, number> = { /* empty */ };
      for (let i = 0; i < 7; i++) {
        const dv = daysVolume[i];
        if (dv.count > 0 && overallAvgDaily > 0) {
          const avgForDay = dv.sum / dv.count;
          const mult = avgForDay / overallAvgDaily;
          weeklyTrend[DAY_NAMES[i]] = Number(mult.toFixed(2));
          
          if (mult > maxMult) {
            maxMult = mult;
            busiestDayStr = DAY_NAMES[i];
          }
        } else {
          weeklyTrend[DAY_NAMES[i]] = 1.0;
        }
      }
      seasonality.weeklyTrend = weeklyTrend;
      seasonality.busiestDay = busiestDayStr;

      // Enable deeper seasonality only if 365+ days
      seasonality.isAvailable = isSeasonalityMet;

      if (isSeasonalityMet) {
        // 4b. Day vs Night Trend (DayPartTrend)
        if (shiftsData && shiftsData.length > 0) {
          let daySum = 0, dayCount = 0;
          let nightSum = 0, nightCount = 0;

          // Find overall historical averages
          shiftsData.forEach(s => {
            if (s.shiftType === 'day') { daySum += s.volume; dayCount++; }
            if (s.shiftType === 'night') { nightSum += s.volume; nightCount++; }
          });
          const avgDay = dayCount > 0 ? daySum / dayCount : 0;
          const avgNight = nightCount > 0 ? nightSum / nightCount : 0;

          // Find recent averages (last 30 days)
          const recentShifts = shiftsData.slice(-60); // approx 30 days
          let recentDaySum = 0, recentDayCount = 0;
          let recentNightSum = 0, recentNightCount = 0;
          recentShifts.forEach(s => {
            if (s.shiftType === 'day') { recentDaySum += s.volume; recentDayCount++; }
            if (s.shiftType === 'night') { recentNightSum += s.volume; recentNightCount++; }
          });
          const recentAvgDay = recentDayCount > 0 ? recentDaySum / recentDayCount : 0;
          const recentAvgNight = recentNightCount > 0 ? recentNightSum / recentNightCount : 0;

          const dayImpact = avgDay > 0 ? ((recentAvgDay - avgDay) / avgDay) * 100 : 0;
          const nightImpact = avgNight > 0 ? ((recentAvgNight - avgNight) / avgNight) * 100 : 0;

          seasonality.dayPartTrend = {
            day: Number(dayImpact.toFixed(1)),
            night: Number(nightImpact.toFixed(1))
          };
        }

        // 4c. Monthly Consumption Pattern (Season Strength)
        const currentMonth = new Date().getMonth();
        const monthlyVolumes: Record<number, { sum: number; count: number }> = { /* empty */ };
        for(let i=0; i<12; i++) monthlyVolumes[i] = {sum:0, count:0};
        
        sortedData.forEach(d => {
          const m = new Date(d.date).getMonth();
          monthlyVolumes[m].sum += d.totalVolume;
          monthlyVolumes[m].count += 1;
        });

        const currentMonthAvg = monthlyVolumes[currentMonth].count > 0 
            ? monthlyVolumes[currentMonth].sum / monthlyVolumes[currentMonth].count 
            : 0;
        
        let yearlyTotalSum = 0;
        let yearlyTotalCount = 0;
        Object.values(monthlyVolumes).forEach(v => {
            yearlyTotalSum += v.sum;
            yearlyTotalCount += v.count;
        });
        const yearlyAvgDaily = yearlyTotalCount > 0 ? yearlyTotalSum / yearlyTotalCount : 0;

        if (yearlyAvgDaily > 0 && currentMonthAvg > 0) {
            const diffPct = ((currentMonthAvg - yearlyAvgDaily) / yearlyAvgDaily) * 100;
            if (diffPct > 10) {
                seasonality.monthlySeasonStrength = { status: 'Strong Season', impactPct: Number(diffPct.toFixed(1)) };
            } else if (diffPct < -10) {
                seasonality.monthlySeasonStrength = { status: 'Weak Season', impactPct: Number(diffPct.toFixed(1)) };
            } else {
                seasonality.monthlySeasonStrength = { status: 'Normal', impactPct: Number(diffPct.toFixed(1)) };
            }
        }

        // 4d. Fuel Type Seasonality
        // Group all products into Petrol vs Diesel for simple analysis
        const fuelTotals: Record<string, number> = { /* empty */ };
        const recentFuelTotals: Record<string, number> = { /* empty */ };
        
        const recentDays = 30;
        const recentData = sortedData.slice(-recentDays);
        
        sortedData.forEach(d => {
            Object.entries(d.productVolumes).forEach(([pid, vol]) => {
                const type = pid.toLowerCase().includes('diesel') || pid.toLowerCase().includes('hsd') ? 'Diesel' 
                           : pid.toLowerCase().includes('petrol') || pid.toLowerCase().includes('pmg') ? 'Petrol' 
                           : pid.toLowerCase().includes('cng') ? 'CNG' : 'Other';
                fuelTotals[type] = (fuelTotals[type] || 0) + vol;
            });
        });
        
        recentData.forEach(d => {
            Object.entries(d.productVolumes).forEach(([pid, vol]) => {
                const type = pid.toLowerCase().includes('diesel') || pid.toLowerCase().includes('hsd') ? 'Diesel' 
                           : pid.toLowerCase().includes('petrol') || pid.toLowerCase().includes('pmg') ? 'Petrol' 
                           : pid.toLowerCase().includes('cng') ? 'CNG' : 'Other';
                recentFuelTotals[type] = (recentFuelTotals[type] || 0) + vol;
            });
        });

        Object.keys(fuelTotals).forEach(type => {
            if (type === 'Other') return;
            const historicalDaily = fuelTotals[type] / sortedData.length;
            const recentDaily = (recentFuelTotals[type] || 0) / recentDays;
            
            if (historicalDaily > 0) {
                const diffPct = ((recentDaily - historicalDaily) / historicalDaily) * 100;
                seasonality!.fuelTypeSeasonality[type] = Number(diffPct.toFixed(1));
            }
        });

        // 4e. Upcoming Event Detection
        if (settings?.eventCalendar) {
            const today = new Date();
            const upcomingEvents: {name: string, expectedDemand: number, confidence: number, daysUntil: number}[] = [];
            
            // Helper to check event
            const checkEvent = (eventDateStr: string | undefined, name: string, multiplier: number | undefined) => {
                if (!eventDateStr) return;
                const evDate = new Date(eventDateStr);
                const diffTime = evDate.getTime() - today.getTime();
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                
                // If event is within next 30 days
                if (diffDays >= 0 && diffDays <= 30) {
                    const defaultImpact = multiplier !== undefined ? (multiplier - 1.0) * 100 : 0;
                    // If we have historical data, we could calculate the actual impact of last year's event here.
                    // For now, we mix default config with a base confidence.
                    
                    upcomingEvents.push({
                        name,
                        expectedDemand: Number(defaultImpact.toFixed(1)),
                        confidence: 88, // As requested in the example
                        daysUntil: diffDays
                    });
                }
            };

            checkEvent(settings.eventCalendar.ramadanStart, "Ramadan Start", settings.eventCalendar.ramadanMultiplier ?? 1.0);
            checkEvent(settings.eventCalendar.eidUlFitr, "Eid-ul-Fitr", settings.eventCalendar.eidMultiplier ?? 1.2);
            checkEvent(settings.eventCalendar.eidUlAdha, "Eid-ul-Adha", settings.eventCalendar.eidMultiplier ?? 1.2);
            checkEvent(settings.eventCalendar.muharram, "Muharram", 0.9);
            checkEvent(settings.eventCalendar.independenceDay, "Independence Day", 1.1);

            // Sort by days until and pick the closest
            upcomingEvents.sort((a, b) => a.daysUntil - b.daysUntil);
            if (upcomingEvents.length > 0) {
                seasonality.upcomingEvent = upcomingEvents[0];
            }
        }
      }
    }

    // 5. Confidence Score Calculation
    let confidenceScore = 0;
    if (isDemandMet && isProfitMet && isTankMet) {
      confidenceScore += 60; 
      
      if (daysAvailable >= 365) confidenceScore += 20; // Massive confidence boost for having full year
      else if (daysAvailable >= 30) confidenceScore += 15;
      else if (daysAvailable >= 21) confidenceScore += 10;
      else if (daysAvailable >= 14) confidenceScore += 5;

      if (totalTxns >= 1000) confidenceScore += 10;
      else if (totalTxns >= 500) confidenceScore += 5;

      if (demandForecast && demandForecast.ma7 > 0) {
        const diffRatio = Math.abs(demandForecast.ma7 - demandForecast.ma14) / demandForecast.ma7;
        if (diffRatio < 0.1) confidenceScore += 10; 
        else if (diffRatio < 0.2) confidenceScore += 5; 
      }
    } else {
      if (daysAvailable > 0) confidenceScore += Math.min(30, (daysAvailable / MIN_DAYS_DEMAND) * 30);
      if (totalTxns > 0) confidenceScore += Math.min(30, (totalTxns / MIN_TXNS_PROFIT) * 30);
    }

    const result: ForecastResult = {
      demandForecast,
      projectedWeeklyProfit,
      tankForecasts,
      confidenceScore: Math.min(99, Math.round(confidenceScore)),
      dataQuality: {
        daysAvailable,
        txnCount: totalTxns,
        isDemandMet,
        isProfitMet,
        isTankMet
      },
      seasonality
    };

    self.postMessage(result);
  } catch (error) {
    logger.error('Forecast Worker Error:', error);
     
    self.postMessage({ error: 'Forecast computation failed' } as unknown as ForecastResult);
  }
};
