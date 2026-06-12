/**
 * FuelPro — Stock IN Calculation Engine
 * Based on real PSO & Attock Petroleum invoices
 * Powered by Umar Ali ⚡ | Motorway Petroleum, Mardan KPK
 */

// ─── SUPPLIER CARRIAGE RULES ─────────────────────────────────────────────────
export interface SupplierRule {
  carriageInvoiced: boolean;   // true = already inside invoice total
  note: string;
  tipCommon: boolean;
  tipRange: [number, number];  // [min, max] in Rs.
}

export const SUPPLIER_CARRIAGE_RULES: Record<string, SupplierRule> = {
  'PSO': {
    carriageInvoiced: true,
    note: 'PSO includes DLVCHRG & LF in invoice. Set carriage = Rs. 0.',
    tipCommon: true,
    tipRange: [200, 500],
  },
  'Attock': {
    carriageInvoiced: false,
    note: 'Attock carriage contractor (e.g. Abdullah Enterprises) bills separately. Enter carriage amount.',
    tipCommon: true,
    tipRange: [300, 600],
  },
  'APL': {
    carriageInvoiced: false,
    note: 'Attock Petroleum carriage billed separately.',
    tipCommon: true,
    tipRange: [300, 600],
  },
  'Shell': {
    carriageInvoiced: true,
    note: 'Shell includes freight in invoice total.',
    tipCommon: true,
    tipRange: [200, 400],
  },
  'Total': {
    carriageInvoiced: false,
    note: 'TotalEnergies uses separate carriage contractors.',
    tipCommon: true,
    tipRange: [300, 500],
  },
  'TotalEnergies': {
    carriageInvoiced: false,
    note: 'TotalEnergies uses separate carriage contractors.',
    tipCommon: true,
    tipRange: [300, 500],
  },
  'GO': {
    carriageInvoiced: false,
    note: 'GO Petroleum uses third-party carriers. Enter carriage amount.',
    tipCommon: true,
    tipRange: [200, 400],
  },
  'Hascol': {
    carriageInvoiced: false,
    note: 'Hascol carriage typically billed separately.',
    tipCommon: true,
    tipRange: [200, 500],
  },
};

export function getSupplierRule(supplierName: string): SupplierRule | null {
  if (!supplierName) return null;
  // Try exact match first, then partial
  const exact = SUPPLIER_CARRIAGE_RULES[supplierName];
  if (exact) return exact;
  const upper = supplierName.toUpperCase();
  for (const [key, rule] of Object.entries(SUPPLIER_CARRIAGE_RULES)) {
    if (upper.includes(key.toUpperCase()) || key.toUpperCase().includes(upper)) {
      return rule;
    }
  }
  return null;
}

// ─── CALCULATION INPUT/OUTPUT ─────────────────────────────────────────────────
export interface StockInInput {
  qtyOnInvoice: number;
  qtyReceived: number;
  invoiceTotalAmount: number;    // Actual total from paper invoice
  carriageAmount: number;        // Separate carriage (0 for PSO)
  driverTipAmount: number;       // Cash tip to driver
  otherCharges: number;
  ograPumpPrice: number;         // From Price Setup
  dealerMargin: number;          // From Settings (e.g. 8.64)
}

export interface CostBreakdownItem {
  label: string;
  amount: number;
  perLiter: number;
}

export interface StockInMetrics {
  // Per-liter breakdown
  invoiceCostPerLiter: number;   // invoiceTotal ÷ qtyReceived
  totalExtraCosts: number;       // carriage + tip + other
  totalLandedCost: number;       // invoice + all extras
  landedCostPerLiter: number;    // totalLandedCost ÷ qtyReceived

  // Margin calculations
  expectedBatchMarginPerLiter: number;   // ograPrice - landedCostPerLiter
  expectedBatchMarginTotal: number;      // margin × qtyReceived
  effectiveMarginVsOGRA: number;         // dealerMargin - expectedBatchMarginPerLiter
  // positive = you're earning less than OGRA's full margin (due to extra costs)
  // negative = you're earning MORE (unlikely)

  // Revenue estimate
  estimatedRevenue: number;      // ograPrice × qtyReceived

  // Quantity
  qtyShort: number;              // qtyOnInvoice - qtyReceived

  // Breakdown for display
  breakdown: CostBreakdownItem[];
}

export function calculateStockInMetrics(input: StockInInput): StockInMetrics {
  const {
    qtyOnInvoice,
    qtyReceived,
    invoiceTotalAmount,
    carriageAmount,
    driverTipAmount,
    otherCharges,
    ograPumpPrice,
    dealerMargin,
  } = input;

  if (qtyReceived <= 0) throw new Error('Quantity received must be positive');
  if (invoiceTotalAmount <= 0) throw new Error('Invoice amount must be positive');

  const invoiceCostPerLiter = invoiceTotalAmount / qtyReceived;
  const totalExtraCosts = carriageAmount + driverTipAmount + otherCharges;
  const totalLandedCost = invoiceTotalAmount + totalExtraCosts;
  const landedCostPerLiter = totalLandedCost / qtyReceived;
  const expectedBatchMarginPerLiter = ograPumpPrice - landedCostPerLiter;
  const expectedBatchMarginTotal = expectedBatchMarginPerLiter * qtyReceived;
  const effectiveMarginVsOGRA = dealerMargin - expectedBatchMarginPerLiter;
  const estimatedRevenue = ograPumpPrice * qtyReceived;
  const qtyShort = Math.max(0, qtyOnInvoice - qtyReceived);

  // Build cost breakdown for display
  const breakdown: CostBreakdownItem[] = [
    {
      label: 'Invoice Total (incl. delivery & taxes)',
      amount: invoiceTotalAmount,
      perLiter: invoiceCostPerLiter,
    },
  ];

  if (carriageAmount > 0) {
    breakdown.push({
      label: 'Separate Carriage',
      amount: carriageAmount,
      perLiter: carriageAmount / qtyReceived,
    });
  }

  if (driverTipAmount > 0) {
    breakdown.push({
      label: 'Driver Tip / Gratuity',
      amount: driverTipAmount,
      perLiter: driverTipAmount / qtyReceived,
    });
  }

  if (otherCharges > 0) {
    breakdown.push({
      label: 'Other Charges',
      amount: otherCharges,
      perLiter: otherCharges / qtyReceived,
    });
  }

  return {
    invoiceCostPerLiter,
    totalExtraCosts,
    totalLandedCost,
    landedCostPerLiter,
    expectedBatchMarginPerLiter,
    expectedBatchMarginTotal,
    effectiveMarginVsOGRA,
    estimatedRevenue,
    qtyShort,
    breakdown,
  };
}

// ─── VALIDATION ───────────────────────────────────────────────────────────────
export type ValidationSeverity = 'error' | 'warning' | 'info';

export interface ValidationResult {
  severity: ValidationSeverity;
  field?: string;
  message: string;
}

export function validateStockIn(
  input: StockInInput,
  metrics: StockInMetrics
): ValidationResult[] {
  const results: ValidationResult[] = [];
  const { qtyReceived, invoiceTotalAmount, ograPumpPrice } = input;
  const { expectedBatchMarginPerLiter, qtyShort, landedCostPerLiter } = metrics;

  // Rule 1: Invoice amount sanity check
  const expectedMin = qtyReceived * (ograPumpPrice - 15);
  const expectedMax = qtyReceived * ograPumpPrice;
  if (invoiceTotalAmount < expectedMin || invoiceTotalAmount > expectedMax) {
    results.push({
      severity: 'warning',
      field: 'invoiceTotalAmount',
      message: `Invoice amount seems unusual. Expected between Rs.${expectedMin.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',')} and Rs.${expectedMax.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}. Please verify.`,
    });
  }

  // Rule 2: Margin too low
  if (expectedBatchMarginPerLiter < 5 && expectedBatchMarginPerLiter > 0) {
    results.push({
      severity: 'warning',
      field: 'invoiceTotalAmount',
      message: `⚠️ Margin Rs.${expectedBatchMarginPerLiter.toFixed(2)}/L is very low. Check: Is invoice total correct? Did you add carriage that's already included in the invoice?`,
    });
  }

  // Rule 3: Margin negative
  if (expectedBatchMarginPerLiter <= 0) {
    results.push({
      severity: 'error',
      field: 'invoiceTotalAmount',
      message: `❌ Landed cost (Rs.${landedCostPerLiter.toFixed(2)}/L) exceeds OGRA pump price (Rs.${ograPumpPrice}/L). This batch would result in a loss. Please verify all amounts.`,
    });
  }

  // Rule 4: Margin suspiciously high
  if (expectedBatchMarginPerLiter > 12) {
    results.push({
      severity: 'warning',
      field: 'ograPumpPrice',
      message: `⚠️ Margin Rs.${expectedBatchMarginPerLiter.toFixed(2)}/L seems unusually high. Is the OGRA pump price correctly set?`,
    });
  }

  // Rule 5: Short quantity warning
  if (qtyShort > 200) {
    results.push({
      severity: 'error',
      field: 'qtyReceived',
      message: `🚨 MAJOR SHORT: ${qtyShort}L missing! Invoice: ${input.qtyOnInvoice}L | Received: ${qtyReceived}L. Consider raising a supplier claim immediately.`,
    });
  } else if (qtyShort > 50) {
    results.push({
      severity: 'warning',
      field: 'qtyReceived',
      message: `⚠️ SHORT: ${qtyShort}L missing (Invoice: ${input.qtyOnInvoice}L | Received: ${qtyReceived}L). Consider raising a claim with the supplier.`,
    });
  } else if (qtyShort > 0) {
    results.push({
      severity: 'info',
      field: 'qtyReceived',
      message: `Note: ${qtyShort}L short (within normal evaporation range ≤50L).`,
    });
  }

  return results;
}

// ─── DIP VARIANCE VALIDATION ──────────────────────────────────────────────────
export function validateDipReadings(
  dipBefore: number,
  dipAfter: number,
  qtyReceived: number
): ValidationResult | null {
  const expectedAfter = dipBefore + qtyReceived;
  const variance = Math.abs(dipAfter - expectedAfter);

  if (variance > 500) {
    return {
      severity: 'error',
      field: 'dipAfter',
      message: `🚨 Large dip variance: ${variance.toLocaleString()}L. Expected ${expectedAfter.toLocaleString()}L, got ${dipAfter.toLocaleString()}L. Re-measure the tank.`,
    };
  }
  if (variance > 100) {
    return {
      severity: 'warning',
      field: 'dipAfter',
      message: `⚠️ Dip variance: ${variance.toLocaleString()}L. Expected ${expectedAfter.toLocaleString()}L, got ${dipAfter.toLocaleString()}L. Check gauge.`,
    };
  }
  return null;
}

// ─── SEAL VERIFICATION ────────────────────────────────────────────────────────
export type SealStatus = 'ok' | 'broken' | 'missing' | 'mismatch' | 'pending';

export function evaluateSealStatus(
  sealNumberFrom: string,
  sealNumberTo: string,
  totalSealsReceived: number | undefined
): { expectedCount: number; status: SealStatus } {
  const from = parseInt(sealNumberFrom || '0', 10);
  const to = parseInt(sealNumberTo || '0', 10);
  const expectedCount = isNaN(from) || isNaN(to) || to < from ? 0 : to - from + 1;

  if (totalSealsReceived === undefined || totalSealsReceived === null) {
    return { expectedCount, status: 'pending' };
  }
  if (totalSealsReceived < expectedCount) return { expectedCount, status: 'missing' };
  if (totalSealsReceived !== expectedCount) return { expectedCount, status: 'mismatch' };
  return { expectedCount, status: 'ok' };
}

// ─── BATCH NUMBER GENERATOR ───────────────────────────────────────────────────
export function generateBatchNumber(productName: string, existingCount: number): string {
  const upper = productName.toUpperCase();
  let prefix = 'FUEL';
  if (upper.includes('DIESEL') || upper.includes('HSD')) prefix = 'HSD';
  else if (upper.includes('PETROL') || upper.includes('PMG') || upper.includes('MS')) prefix = 'PTR';
  else if (upper.includes('SUPER') || upper.includes('HOBC')) prefix = 'SHO';
  else if (upper.includes('KEROSENE') || upper.includes('SKO')) prefix = 'SKO';
  else if (upper.includes('LDO')) prefix = 'LDO';

  const year = new Date().getFullYear();
  const seq = String(existingCount + 1).padStart(4, '0');
  return `${prefix}-${year}-${seq}`;
}

// ─── WHATSAPP SUMMARY GENERATOR ──────────────────────────────────────────────
export interface WhatsAppSummaryInput {
  stationName: string;
  supplierName: string;
  productName: string;
  qtyReceived: number;
  invoiceNumber?: string;
  deliveryDate: string;
  invoiceTotalAmount: number;
  driverTipAmount: number;
  totalLandedCost: number;
  landedCostPerLiter: number;
  ograPumpPrice: number;
  expectedBatchMarginPerLiter: number;
  expectedBatchMarginTotal: number;
  dipBefore?: number;
  dipAfter?: number;
  batchNumber: string;
}

export function generateWhatsAppSummary(input: WhatsAppSummaryInput): string {
  const {
    stationName, supplierName, productName, qtyReceived, invoiceNumber,
    deliveryDate, invoiceTotalAmount, driverTipAmount, totalLandedCost,
    landedCostPerLiter, ograPumpPrice, expectedBatchMarginPerLiter,
    expectedBatchMarginTotal, dipBefore, dipAfter, batchNumber,
  } = input;

  const fmt = (n: number) => n.toLocaleString('en-PK', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  const fmtL = (n: number) => n.toFixed(2);

  const date = new Date(deliveryDate).toLocaleDateString('en-PK', {
    day: '2-digit', month: 'short', year: 'numeric',
  });

  let msg = `⛽ *${stationName}*\n`;
  msg += `📦 *Fuel Received — ${supplierName}*\n\n`;
  msg += `Product: ${productName}\n`;
  msg += `Quantity: ${fmt(qtyReceived)} Liters\n`;
  if (invoiceNumber) msg += `Invoice #: ${invoiceNumber}\n`;
  msg += `Batch #: ${batchNumber}\n`;
  msg += `Date: ${date}\n\n`;

  msg += `*COST BREAKDOWN:*\n`;
  msg += `Invoice:      Rs. ${fmt(invoiceTotalAmount)}\n`;
  if (driverTipAmount > 0) msg += `Driver Tip:   Rs. ${fmt(driverTipAmount)}\n`;
  msg += `Total Paid:   Rs. ${fmt(totalLandedCost)} (Rs.${fmtL(landedCostPerLiter)}/L)\n\n`;

  msg += `*PROFIT ESTIMATE:*\n`;
  msg += `OGRA Price:   Rs. ${fmtL(ograPumpPrice)}/L\n`;
  msg += `Margin:       Rs. ${fmtL(expectedBatchMarginPerLiter)}/L\n`;
  msg += `Total Profit: Rs. ${fmt(expectedBatchMarginTotal)} ✅\n`;

  if (dipBefore !== undefined && dipAfter !== undefined) {
    msg += `\nDip Before:  ${fmt(dipBefore)} L\n`;
    msg += `Dip After:   ${fmt(dipAfter)} L `;
    msg += Math.abs(dipAfter - dipBefore - qtyReceived) < 100 ? '✅\n' : '⚠️\n';
  }

  msg += `\n_Powered by Umar Ali | FuelPro_`;
  return msg;
}
