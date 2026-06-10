import { KPIResult } from './kpiEngine';

export interface HealthScoreResult {
  score: number;
  label: 'Critical' | 'Poor' | 'Fair' | 'Good' | 'Excellent';
  factors: {
    name: string;
    score: number;
    weight: number;
    status: 'Positive' | 'Negative' | 'Neutral';
  }[];
}

export const generateHealthScore = (kpis: KPIResult): HealthScoreResult => {
  // Factors calculation out of 100
  
  // 1. Sales Trend (Weight: 20%)
  // Compare today vs avg daily
  const salesScore = Math.min(100, Math.max(0, (kpis.revenue.today / (kpis.revenue.averageDaily || 1)) * 100));
  
  // 2. Profitability (Weight: 20%)
  // Ideal margin is 10%
  const profitScore = Math.min(100, Math.max(0, (kpis.profit.marginPercent / 10) * 100));

  // 3. Credit Risk (Weight: 15%)
  // Score drops as risk increases. Risk score is 0-100 where 100 is bad.
  const creditScore = Math.max(0, 100 - kpis.credit.riskScore);

  // 4. Inventory Health (Weight: 15%)
  // Ideal coverage is 3 to 14 days
  let inventoryScore = 100;
  if (kpis.inventory.stockCoverageDays < 2) inventoryScore -= 50; 
  if (kpis.inventory.stockCoverageDays > 14) inventoryScore -= 30; 
  if (kpis.inventory.deadStockCount > 5) inventoryScore -= 20;

  // 5. Cash Position (Weight: 15%)
  // Positive cash flow is good
  const cashScore = kpis.cash.position > 0 ? 100 : (kpis.cash.position === 0 ? 50 : 0); 

  // 6. Operations & Data Quality (Weight: 15%)
  const opsScore = kpis.dataQuality.score;

  // Penalty Rule
  let multiplier = 1.0;
  if (salesScore < 40 || profitScore < 40 || creditScore < 40 || inventoryScore < 40 || cashScore < 40 || opsScore < 40) {
    multiplier = 0.8; // 20% penalty if any core pillar is failing
  }

  // Weighted Total
  const rawScore = (
    (salesScore * 0.20) +
    (profitScore * 0.20) +
    (creditScore * 0.15) +
    (inventoryScore * 0.15) +
    (cashScore * 0.15) +
    (opsScore * 0.15)
  );

  const finalScore = Math.round(rawScore * multiplier);

  let label: HealthScoreResult['label'] = 'Excellent';
  if (finalScore < 30) label = 'Critical';
  else if (finalScore < 50) label = 'Poor';
  else if (finalScore < 70) label = 'Fair';
  else if (finalScore < 85) label = 'Good';

  return {
    score: finalScore,
    label,
    factors: [
      { name: 'Sales Trend', score: Math.round(salesScore), weight: 20, status: salesScore >= 80 ? 'Positive' : salesScore < 50 ? 'Negative' : 'Neutral' },
      { name: 'Profitability', score: Math.round(profitScore), weight: 20, status: profitScore >= 80 ? 'Positive' : profitScore < 50 ? 'Negative' : 'Neutral' },
      { name: 'Credit Risk', score: Math.round(creditScore), weight: 15, status: creditScore >= 80 ? 'Positive' : creditScore < 50 ? 'Negative' : 'Neutral' },
      { name: 'Inventory Health', score: Math.round(inventoryScore), weight: 15, status: inventoryScore >= 80 ? 'Positive' : inventoryScore < 50 ? 'Negative' : 'Neutral' },
      { name: 'Cash Flow', score: Math.round(cashScore), weight: 15, status: cashScore >= 80 ? 'Positive' : cashScore < 50 ? 'Negative' : 'Neutral' },
      { name: 'Data Quality', score: Math.round(opsScore), weight: 15, status: opsScore >= 80 ? 'Positive' : opsScore < 50 ? 'Negative' : 'Neutral' }
    ]
  };
};
