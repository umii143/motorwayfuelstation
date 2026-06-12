/**
 * FuelPro — FIFO Cost Engine
 * Oldest batch consumed first. Realized P&L tracked per batch per sale.
 * Powered by Umar Ali ⚡ | Motorway Petroleum, Mardan KPK
 */

import { StockBatch, FIFODeduction } from '../types';
import { db } from '../data/db';

// ─── TYPES ────────────────────────────────────────────────────────────────────
export interface FIFODeductionItem {
  batchId: string;
  batchNumber: string;
  litersDeducted: number;
  landedCostPerLiter: number;
  sellingPrice: number;
  realizedRevenue: number;
  realizedCOGS: number;
  realizedMargin: number;
  realizedMarginPerLiter: number;
}

export interface FIFOResult {
  deductions: FIFODeductionItem[];
  totalLiters: number;
  totalRevenue: number;
  totalCOGS: number;
  totalMargin: number;
  avgRealizedMarginPerLiter: number;
  batchesUsed: number;
  hasStockDeficit: boolean;
  deficitLiters: number;
}

// ─── CORE FIFO DEDUCTION ENGINE ───────────────────────────────────────────────
/**
 * Deducts liters from active batches in FIFO order (oldest first).
 * Updates batch qtyRemaining, realized P&L, and batchStatus.
 * Creates FIFODeduction records for each batch consumed.
 *
 * @param stationId     - Current station ID
 * @param tankId        - Tank to deduct from
 * @param productId     - Product being sold
 * @param litersToDeduct - Total liters sold in the shift/segment
 * @param sellingPrice  - OGRA price at time of sale
 * @param shiftId       - Current shift ID
 * @param nozzleId      - Nozzle used
 * @param saleDate      - ISO date string
 */
export async function deductFIFO(
  stationId: string,
  tankId: string,
  productId: string,
  litersToDeduct: number,
  sellingPrice: number,
  shiftId: string,
  nozzleId: string,
  saleDate: string
): Promise<FIFOResult> {
  if (litersToDeduct <= 0) {
    return {
      deductions: [],
      totalLiters: 0,
      totalRevenue: 0,
      totalCOGS: 0,
      totalMargin: 0,
      avgRealizedMarginPerLiter: 0,
      batchesUsed: 0,
      hasStockDeficit: false,
      deficitLiters: 0,
    };
  }

  // Fetch all active batches for this tank/product — OLDEST FIRST
  const allBatches = db.getStockBatches(stationId);
  const activeBatches = allBatches
    .filter(b =>
      (b.tankId === tankId || (!b.tankId && b.productId === productId)) &&
      b.productId === productId &&
      b.status !== 'depleted' &&
      b.status !== 'exhausted' &&
      b.qtyRemaining > 0
    )
    .sort((a, b) => {
      // Sort by delivery date ascending (oldest first = FIFO)
      const dateA = a.deliveryDate || a.date;
      const dateB = b.deliveryDate || b.date;
      return new Date(dateA).getTime() - new Date(dateB).getTime();
    });

  let remaining = litersToDeduct;
  const deductions: FIFODeductionItem[] = [];
  const updatedBatches = [...allBatches];
  const newFIFORecords: FIFODeduction[] = [];

  for (const batch of activeBatches) {
    if (remaining <= 0) break;

    const deduct = Math.min(batch.qtyRemaining, remaining);
    const revenue = deduct * sellingPrice;
    const cogs = deduct * batch.landedCostPerLiter;
    const margin = revenue - cogs;
    const marginPerLiter = margin / deduct;

    // Create FIFO deduction record
    const deductionRecord: FIFODeduction = {
      id: `fifo_${Date.now()}_${batch.id.slice(-6)}`,
      batchId: batch.id,
      shiftId,
      nozzleId,
      litersDeducted: deduct,
      sellingPrice,
      batchLandedCost: batch.landedCostPerLiter,
      realizedRevenue: revenue,
      realizedCOGS: cogs,
      realizedMargin: margin,
      realizedMarginPerLiter: marginPerLiter,
      saleDate,
      createdAt: new Date().toISOString(),
      stationId,
      businessType: 'fuel_station',
      createdAt2: Date.now(),
      updatedAt: Date.now(),
    } as unknown as FIFODeduction;

    newFIFORecords.push(deductionRecord);

    // Build updated batch
    const newQtyRemaining = Math.max(0, batch.qtyRemaining - deduct);
    const newTotalSold = (batch.totalLitersSold || 0) + deduct;
    const newRealizedRevenue = (batch.realizedRevenue || 0) + revenue;
    const newRealizedCOGS = (batch.realizedCOGS || 0) + cogs;
    const newRealizedMargin = (batch.realizedMargin || 0) + margin;
    const newRealizedMarginPerLiter = newTotalSold > 0 ? newRealizedMargin / newTotalSold : 0;

    const newBatchStatus: StockBatch['status'] =
      newQtyRemaining === 0 ? 'exhausted'
      : newQtyRemaining < batch.qtyReceived ? 'partial'
      : 'active';

    const updatedBatch: StockBatch = {
      ...batch,
      qtyRemaining: newQtyRemaining,
      totalLitersSold: newTotalSold,
      realizedRevenue: newRealizedRevenue,
      realizedCOGS: newRealizedCOGS,
      realizedMargin: newRealizedMargin,
      realizedMarginPerLiter: newRealizedMarginPerLiter,
      status: newBatchStatus,
      batchStatus: newBatchStatus === 'depleted' ? 'exhausted' : newBatchStatus,
    };

    // Update in local array
    const idx = updatedBatches.findIndex(b => b.id === batch.id);
    if (idx !== -1) updatedBatches[idx] = updatedBatch;

    deductions.push({
      batchId: batch.id,
      batchNumber: batch.batchNumber,
      litersDeducted: deduct,
      landedCostPerLiter: batch.landedCostPerLiter,
      sellingPrice,
      realizedRevenue: revenue,
      realizedCOGS: cogs,
      realizedMargin: margin,
      realizedMarginPerLiter: marginPerLiter,
    });

    remaining -= deduct;
  }

  // Persist updated batches
  db.saveStockBatches(stationId, updatedBatches);

  // Persist FIFO deduction records
  const existingFIFO = db.getFIFODeductions(stationId);
  db.saveFIFODeductions(stationId, [...newFIFORecords, ...existingFIFO]);

  // Calculate totals
  const totalRevenue = deductions.reduce((s, d) => s + d.realizedRevenue, 0);
  const totalCOGS = deductions.reduce((s, d) => s + d.realizedCOGS, 0);
  const totalMargin = totalRevenue - totalCOGS;
  const actualDeducted = litersToDeduct - Math.max(0, remaining);

  return {
    deductions,
    totalLiters: actualDeducted,
    totalRevenue,
    totalCOGS,
    totalMargin,
    avgRealizedMarginPerLiter: actualDeducted > 0 ? totalMargin / actualDeducted : 0,
    batchesUsed: deductions.length,
    hasStockDeficit: remaining > 0,
    deficitLiters: Math.max(0, remaining),
  };
}

// ─── INVENTORY AGING ──────────────────────────────────────────────────────────
export interface AgingCategory {
  label: string;
  color: 'green' | 'orange' | 'red';
  status: 'fresh' | 'watch' | 'critical';
  days: number;
}

export function getBatchAgingDays(batch: StockBatch): number {
  const dateStr = batch.deliveryDate || batch.date;
  const deliveryDate = new Date(dateStr);
  const today = new Date();
  const diffMs = today.getTime() - deliveryDate.getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

export function getAgingCategory(days: number): AgingCategory {
  if (days <= 30) {
    return { label: '0–30 days', color: 'green', status: 'fresh', days };
  }
  if (days <= 60) {
    return { label: '31–60 days', color: 'orange', status: 'watch', days };
  }
  return { label: '60+ days', color: 'red', status: 'critical', days };
}

// ─── INVENTORY REVALUATION ────────────────────────────────────────────────────
export interface RevaluationResult {
  totalGainLoss: number;
  impactType: 'gain' | 'loss' | 'neutral';
  batchesRevalued: number;
  details: {
    batchId: string;
    batchNumber: string;
    qtyRemaining: number;
    rateDelta: number;
    gainLossAmount: number;
  }[];
}

/**
 * Called when OGRA pump price changes. Revalues all active batch margins.
 * Does NOT change the landed cost — only updates the expected margin.
 */
export function revaluateInventory(
  stationId: string,
  productId: string,
  oldOGRAPrice: number,
  newOGRAPrice: number
): RevaluationResult {
  const delta = newOGRAPrice - oldOGRAPrice;
  const allBatches = db.getStockBatches(stationId);

  const activeBatches = allBatches.filter(b =>
    b.productId === productId &&
    b.status !== 'depleted' &&
    b.status !== 'exhausted' &&
    b.qtyRemaining > 0
  );

  if (activeBatches.length === 0) {
    return { totalGainLoss: 0, impactType: 'neutral', batchesRevalued: 0, details: [] };
  }

  let totalGainLoss = 0;
  const details: RevaluationResult['details'] = [];
  const updatedBatches = [...allBatches];

  for (const batch of activeBatches) {
    const batchImpact = delta * batch.qtyRemaining;
    totalGainLoss += batchImpact;

    const updatedBatch: StockBatch = {
      ...batch,
      ograPumpPrice: newOGRAPrice,
      expectedBatchMarginPerLiter: newOGRAPrice - batch.landedCostPerLiter,
      expectedBatchMarginTotal: (newOGRAPrice - batch.landedCostPerLiter) * batch.qtyRemaining,
      grossMarginPerLiter: newOGRAPrice - batch.landedCostPerLiter, // legacy compat
      revaluationGainLoss: (batch.revaluationGainLoss || 0) + batchImpact,
      lastRevaluationAt: new Date().toISOString(),
    };

    const idx = updatedBatches.findIndex(b => b.id === batch.id);
    if (idx !== -1) updatedBatches[idx] = updatedBatch;

    details.push({
      batchId: batch.id,
      batchNumber: batch.batchNumber,
      qtyRemaining: batch.qtyRemaining,
      rateDelta: delta,
      gainLossAmount: batchImpact,
    });
  }

  db.saveStockBatches(stationId, updatedBatches);

  return {
    totalGainLoss,
    impactType: totalGainLoss > 0 ? 'gain' : totalGainLoss < 0 ? 'loss' : 'neutral',
    batchesRevalued: activeBatches.length,
    details,
  };
}

// ─── SUPPLIER PERFORMANCE SCORE ───────────────────────────────────────────────
export interface SupplierMonthlyMetrics {
  deliveries: number;
  onTime: number;
  totalQtyShort: number;
  totalQtyDelivered: number;
  claimsRaised: number;
  claimsResolved: number;
  avgMargin: number;
  marginStdDeviation: number;
  qualityIssues: number;
}

export function calculateSupplierScore(metrics: SupplierMonthlyMetrics): {
  score: number;
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  recommendation: string;
} {
  const {
    deliveries, onTime, totalQtyShort, totalQtyDelivered,
    claimsRaised, claimsResolved, marginStdDeviation, qualityIssues,
  } = metrics;

  if (deliveries === 0) {
    return { score: 0, grade: 'F', recommendation: 'No delivery data available.' };
  }

  // Timeliness score (0–100): on-time %
  const timelinessScore = (onTime / deliveries) * 100;

  // Shortage score (0–100): lower shortage = higher score
  const shortageRate = totalQtyDelivered > 0 ? totalQtyShort / totalQtyDelivered : 0;
  const shortageScore = Math.max(0, 100 - shortageRate * 10000);

  // Claim resolution score (0–100)
  const claimScore = claimsRaised === 0 ? 100 : (claimsResolved / claimsRaised) * 100;

  // Margin consistency (0–100): lower std dev = higher score
  const marginScore = marginStdDeviation < 0.5 ? 100 : Math.max(0, 100 - marginStdDeviation * 20);

  // Quality score (0–100)
  const qualityScore = qualityIssues === 0 ? 100 : Math.max(0, 100 - qualityIssues * 20);

  // Weighted total (weights sum to 100)
  const score = Math.round(
    timelinessScore  * 0.25 +
    shortageScore    * 0.25 +
    claimScore       * 0.20 +
    marginScore      * 0.20 +
    qualityScore     * 0.10
  );

  const grade: 'A' | 'B' | 'C' | 'D' | 'F' =
    score >= 90 ? 'A' :
    score >= 75 ? 'B' :
    score >= 60 ? 'C' :
    score >= 40 ? 'D' : 'F';

  const recommendation =
    grade === 'A' ? '🟢 Primary Supplier — Keep as priority' :
    grade === 'B' ? '🟡 Secondary OK — Monitor performance' :
    grade === 'C' ? '🟠 Below Average — Require improvement plan' :
    grade === 'D' ? '🔴 Poor — Consider alternate suppliers' :
    '⛔ Critical — Suspend and review immediately';

  return { score, grade, recommendation };
}

// ─── CLAIM NUMBER GENERATOR ───────────────────────────────────────────────────
export function generateClaimNumber(existingClaims: { claimNumber: string }[]): string {
  const year = new Date().getFullYear();
  const existing = existingClaims
    .map(c => {
      const match = c.claimNumber?.match(/CLM-\d{4}-(\d+)/);
      return match ? parseInt(match[1], 10) : 0;
    })
    .filter(n => !isNaN(n));
  const nextNum = existing.length > 0 ? Math.max(...existing) + 1 : 1;
  return `CLM-${year}-${String(nextNum).padStart(4, '0')}`;
}
