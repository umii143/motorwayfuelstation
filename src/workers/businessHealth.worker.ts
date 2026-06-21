/**
 * Business Health Score Web Worker
 * Calculates overall business score, warnings, and statistical volatility 
 * off the main thread.
 */

self.onmessage = (e: MessageEvent) => {
  const { summary } = e.data;
  
  let score = 100;
  const issues: string[] = [];
  
  // Basic KPI Deductions
  if (summary.lowStockTanks > 0) {
    score -= 15;
    issues.push(`${summary.lowStockTanks} tank(s) running extremely low on fuel.`);
  }
  
  if (summary.maintenanceNozzles > 0) {
    score -= (summary.maintenanceNozzles * 5);
    issues.push(`${summary.maintenanceNozzles} nozzle(s) require urgent maintenance.`);
  }
  
  if (Math.abs(summary.maxVariance) > 100) {
    score -= 20;
    issues.push(`High variance detected: ${summary.maxVariance.toFixed(1)}L.`);
  }
  
  if (summary.totalPayables > summary.totalCash * 1.5) {
    score -= 10;
    issues.push(`Critical Liquidity Risk: Payables exceed 1.5x of available cash.`);
  }

  // Statistical Volatility Algorithm (Simulating heavy computation over daily arrays)
  let profitVolatility = 0;
  if (summary.dailyProfits && summary.dailyProfits.length > 0) {
     const len = summary.dailyProfits.length;
     const avgProfit = summary.dailyProfits.reduce((a:number, b:number) => a + b, 0) / len;
     
     let varianceSum = 0;
     for(let i = 0; i < len; i++) {
        varianceSum += Math.pow(summary.dailyProfits[i] - avgProfit, 2);
     }
     
     const stdDev = Math.sqrt(varianceSum / len);
     profitVolatility = avgProfit > 0 ? (stdDev / avgProfit) : 1;
     
     if (profitVolatility > 0.4) {
        score -= 5;
        issues.push(`High profit volatility (${(profitVolatility * 100).toFixed(0)}%) detected in recent trends.`);
     }
  }

  const finalScore = Math.max(0, Math.min(100, Math.round(score)));
  
  let level = "Excellent";
  if (finalScore < 50) level = "Critical";
  else if (finalScore < 75) level = "Warning";
  else if (finalScore < 90) level = "Good";

  self.postMessage({
    score: finalScore,
    level,
    issues,
    volatility: profitVolatility
  });
};
