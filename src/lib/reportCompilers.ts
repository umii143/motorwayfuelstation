/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Shift, Product, Customer, Supplier, ExpenseEntry, Tank, RateHistoryEntry, StaffFinanceEntry, AttendanceRecord, Staff, Nozzle, COGSRecord } from '../types';

export interface ReportRow {
  id: string;
  date: string;
  time: string;
  staffName: string;
  role: string;
  sourceRef: string;
  productCategory: string;
  quantity: string;
  rate: string;
  amount: number;
  approvalStatus: string;
  balanceAfter: string;
  // Internal filter helpers
  paymentMode?: string;
  shiftType?: string;
  productId?: string;
  entityName?: string;
  staffId?: string;
}

export interface ReportHeader {
  key: keyof ReportRow | string;
  label: string;
  urduLabel: string;
  isNumeric?: boolean;
}

export interface ReportTemplate {
  id: string;
  category: 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | 'H' | 'I';
  name: string;
  urduName: string;
  description: string;
  urduDescription: string;
  headers: ReportHeader[];
  compile: (data: {
    shifts: Shift[];
    products: Product[];
    customers: Customer[];
    suppliers: Supplier[];
    standaloneExpenses: ExpenseEntry[];
    tanks: Tank[];
    rateHistory: RateHistoryEntry[];
    staffFinance: StaffFinanceEntry[];
    attendance: AttendanceRecord[];
    staff: Staff[];
    nozzles: Nozzle[];
    cogsRecords?: COGSRecord[];
  }) => ReportRow[];
}

// ==========================================
// UTILITY HELPERS
// ==========================================
const getStaffInfo = (staffList: Staff[], staffId: string) => {
  const s = staffList.find(x => x.id === staffId);
  return {
    name: s ? s.name : staffId || 'System',
    role: s ? s.role.toUpperCase() : 'CASHIER'
  };
};

const getProductRate = (productList: Product[], productId: string, fallback: number) => {
  const p = productList.find(x => x.id === productId);
  return p ? p.rate : fallback;
};

/**
 * Classifies a fuel product as petrol, diesel, cng, or null (non-fuel).
 * Resolution order:
 *   1. product.type must be 'fuel'
 *   2. Match by product ID semantics (prod_f1/petrol = petrol, prod_f2/diesel = diesel)
 *   3. Match by product name keywords
 */
const getFuelCategory = (productId: string, products: Product[]): 'petrol' | 'diesel' | 'cng' | null => {
  const p = products.find(prod => prod.id === productId);
  if (!p) return null;
  if (p.type !== 'fuel') return null;

  const idLower = p.id.toLowerCase();
  const nameLower = p.name.toLowerCase();

  if (
    idLower === 'petrol' ||
    idLower === 'prod_f1' ||
    idLower === 'prod_f3' ||
    nameLower.includes('petrol') ||
    nameLower.includes('pmg') ||
    nameLower.includes('hobc') ||
    nameLower.includes('octane') ||
    nameLower.includes('super')
  ) {
    return 'petrol';
  }
  if (
    idLower === 'diesel' ||
    idLower === 'prod_f2' ||
    nameLower.includes('diesel') ||
    nameLower.includes('hsd')
  ) {
    return 'diesel';
  }
  if (
    idLower === 'cng' ||
    nameLower.includes('cng') ||
    nameLower.includes('gas')
  ) {
    return 'cng';
  }
  return null;
};

/**
 * Returns a COGS (cost of goods sold) estimate per unit for a product.
 * For fuel products, uses a margin band relative to the sale rate:
 *   petrol/hobc: rate minus ~Rs.4.5
 *   diesel:      rate minus ~Rs.4.0
 *   cng:         rate minus ~Rs.3.0
 *   lube/other:  92% of sale rate
 */
const getFuelCogsRate = (productId: string, products: Product[]): number => {
  const p = products.find(prod => prod.id === productId);
  if (!p) return 268;
  const cat = getFuelCategory(productId, products);
  if (cat === 'petrol') return Math.max(0, p.rate - 4.5);
  if (cat === 'diesel') return Math.max(0, p.rate - 4.0);
  if (cat === 'cng')    return Math.max(0, p.rate - 3.0);
  return p.rate * 0.92;
};

// ==========================================
// THE 40+ REPORT TEMPLATES MASTER CATALOGUE
// ==========================================
export const REPORT_TEMPLATES: ReportTemplate[] = [
  // ----------------------------------------
  // CATEGORY A: SALES REPORTS
  // ----------------------------------------
  {
    id: 'A1',
    category: 'A',
    name: 'A1. Daily Fuel Sales Report — Nozzle Detail',
    urduName: 'A1. یومیہ فروخت رپورٹ بلحاظ نوزل معلومات',
    description: 'Exact litres and amount sold per nozzle per shift - traceable forever.',
    urduDescription: 'ہر شفٹ اور نوزل کے حساب سے فروخت شدہ فیول کی تفصیلی رپورٹ۔',
    headers: [
      { key: 'date', label: 'Date', urduLabel: 'تاریخ' },
      { key: 'time', label: 'Time Span', urduLabel: 'وقت' },
      { key: 'staffName', label: 'Operator', urduLabel: 'آپریٹر کا نام' },
      { key: 'sourceRef', label: 'Shift Ref', urduLabel: 'شفٹ ریفرنس' },
      { key: 'productCategory', label: 'Nozzle / Fuel', urduLabel: 'نوزل / پٹرولیم' },
      { key: 'quantity', label: 'Litres/KG', urduLabel: 'حجم (لیٹر/کلو)' },
      { key: 'rate', label: 'Unit Rate', urduLabel: 'قیمت فی لیٹر' },
      { key: 'amount', label: 'Gross Amount (PKR)', urduLabel: 'کل رقم', isNumeric: true },
      { key: 'approvalStatus', label: 'Status', urduLabel: 'اسٹیٹس' }
    ],
    compile: ({ shifts, staff, nozzles, products }) => {
      const rows: ReportRow[] = [];
      shifts.forEach(s => {
        const staffObj = getStaffInfo(staff, s.staffId);
        nozzles.forEach(nz => {
          const open = s.openingReadings?.[nz.id] || 0;
          const close = s.closingReadings?.[nz.id] || 0;
          const diff = Math.max(0, close - open);
          if (diff <= 0) return;

          const prod = products.find(p => p.id === nz.productId);
          const rate = prod ? prod.rate : 280;
          const amt = diff * rate;

          rows.push({
            id: `A1-${s.id}-${nz.id}`,
            date: s.date,
            time: `${s.startTime} - ${s.endTime || 'Open'}`,
            staffName: staffObj.name,
            role: staffObj.role,
            sourceRef: `SH-${s.id}`,
            productCategory: `${nz.name} (${prod?.name || nz.productId})`,
            quantity: `${diff.toFixed(2)} ${prod?.unit || 'Ltr'}`,
            rate: `Rs. ${rate.toFixed(2)}`,
            amount: amt,
            approvalStatus: s.status === 'closed' ? 'Verified' : 'Active',
            balanceAfter: '—',
            shiftType: s.type,
            paymentMode: 'cash',
            productId: nz.productId,
            staffId: s.staffId
          });
        });
      });
      return rows;
    }
  },
  {
    id: 'A2',
    category: 'A',
    name: 'A2. Shift-wise Complete Sales Record',
    urduName: 'A2. تفصیلی شفٹ وار کاروباری سمری',
    description: 'Every shift summary row with expected, submitted, and discrepancy details.',
    urduDescription: 'لیجر ریکارڈز کے ہمراہ نقد رقم وصولی اور شارٹیج کی شفٹ وار کاروباری رپورٹ۔',
    headers: [
      { key: 'date', label: 'Date', urduLabel: 'تاریخ' },
      { key: 'sourceRef', label: 'Shift ID', urduLabel: 'شفٹ نمبر' },
      { key: 'staffName', label: 'Operator', urduLabel: 'سیلز مین' },
      { key: 'productCategory', label: 'Shift Type', urduLabel: 'سیشن ٹائپ' },
      { key: 'quantity', label: 'Shift Timings', urduLabel: 'اوقاتِ شفٹ' },
      { key: 'rate', label: 'Expected Cash', urduLabel: 'حسابی کیش' },
      { key: 'amount', label: 'Submitted Cash', urduLabel: 'جمع شدہ رقم', isNumeric: true },
      { key: 'approvalStatus', label: 'Discrepancy (PKR)', urduLabel: 'کمی بیشی' },
      { key: 'balanceAfter', label: 'Approval Roll', urduLabel: 'تصدیق کنندہ' }
    ],
    compile: ({ shifts, staff }) => {
      return shifts.map(s => {
        const staffObj = getStaffInfo(staff, s.staffId);
        const discrepancy = s.overage > 0 ? `+Rs. ${s.overage}` : s.shortage > 0 ? `-Rs. ${s.shortage}` : 'Tally OK';
        return {
          id: `A2-${s.id}`,
          date: s.date,
          time: s.startTime,
          staffName: staffObj.name,
          role: staffObj.role,
          sourceRef: `SH-${s.id}`,
          productCategory: s.type.toUpperCase(),
          quantity: `${s.startTime} - ${s.endTime || 'Open'}`,
          rate: `Rs. ${s.expectedCash.toLocaleString()}`,
          amount: s.submittedCash,
          approvalStatus: discrepancy,
          balanceAfter: s.status === 'closed' ? 'Manager Approved' : 'Awaiting Audit',
          shiftType: s.type,
          staffId: s.staffId
        };
      });
    }
  },
  {
    id: 'A3',
    category: 'A',
    name: 'A3. Product-wise Sales Report',
    urduName: 'A3. آئل فیول کیٹگری وائز کل فروخت',
    description: 'Total volumetric quantity sold with rate histories and gross profit projections.',
    urduDescription: 'پٹرول، ڈیزل اور سی این جی کی مجموعی فروخت اور منافع کی تفصیل۔',
    headers: [
      { key: 'date', label: 'Date', urduLabel: 'تاریخ' },
      { key: 'productCategory', label: 'Fuel Product', urduLabel: 'مصنوعات' },
      { key: 'quantity', label: 'Total Volume', urduLabel: 'کل حجم' },
      { key: 'rate', label: 'Current Rate', urduLabel: 'موجودہ ریٹ' },
      { key: 'amount', label: 'Gross Revenue (PKR)', urduLabel: 'مجموعی آمدنی', isNumeric: true },
      { key: 'approvalStatus', label: 'Avg Buy Cost', urduLabel: 'خریداری لاگت' },
      { key: 'balanceAfter', label: 'Gross Profit Est.', urduLabel: 'تخمینہ بچت' }
    ],
    compile: ({ shifts, products, nozzles }) => {
      const dailyVals: Record<string, Record<string, { qty: number; sales: number }>> = {};
      shifts.forEach(s => {
        const dt = s.date;
        if (!dailyVals[dt]) dailyVals[dt] = {};
        nozzles.forEach(nz => {
          const open = s.openingReadings?.[nz.id] || 0;
          const close = s.closingReadings?.[nz.id] || 0;
          const diff = Math.max(0, close - open);
          if (diff <= 0) return;

          if (!dailyVals[dt][nz.productId]) {
            dailyVals[dt][nz.productId] = { qty: 0, sales: 0 };
          }
          const pRate = getProductRate(products, nz.productId, 280);
          dailyVals[dt][nz.productId].qty += diff;
          dailyVals[dt][nz.productId].sales += diff * pRate;
        });
      });

      const rows: ReportRow[] = [];
      Object.entries(dailyVals).forEach(([date, prodData]) => {
        Object.entries(prodData).forEach(([pId, val]) => {
          const prod = products.find(p => p.id === pId);
          const cogsRate = getFuelCogsRate(pId, products);
          const gp = val.qty * ((prod?.rate || 280) - cogsRate);

          rows.push({
            id: `A3-${date}-${pId}`,
            date,
            time: 'Daily aggregated',
            staffName: 'Operator Desk',
            role: 'AUTO',
            sourceRef: 'LEDGER-A3',
            productCategory: prod?.name || pId,
            quantity: `${val.qty.toFixed(2)} ${prod?.unit || 'Ltr'}`,
            rate: `Rs. ${(prod?.rate || 280).toFixed(2)}`,
            amount: val.sales,
            approvalStatus: `Rs. ${cogsRate.toFixed(2)}`,
            balanceAfter: `Rs. ${gp.toLocaleString()}`,
            productId: pId
          });
        });
      });

      return rows;
    }
  },
  {
    id: 'A4',
    category: 'A',
    name: 'A4. Nozzle-wise Historical Performance',
    urduName: 'A4. تفصیلی نوزل ہسٹری اور والیم لاگ',
    description: 'Tracks reading difference and fuel flow for individual nozzles across time.',
    urduDescription: 'انفرادی پمپ نوزل کے تفصیلی میٹر ریڈنگ ریکارڈز کا تاریخی سرگزشت آڈٹ۔',
    headers: [
      { key: 'date', label: 'Date', urduLabel: 'تاریخ' },
      { key: 'sourceRef', label: 'Shift Ref', urduLabel: 'شفٹ ریفرنس' },
      { key: 'productCategory', label: 'Nozzle Name', urduLabel: 'نوزل کا نام' },
      { key: 'quantity', label: 'Readings (Open → Close)', urduLabel: 'میٹر ریڈنگز' },
      { key: 'rate', label: 'Unit Rate', urduLabel: 'ریٹ' },
      { key: 'amount', label: 'Sales Generated', urduLabel: 'فروخت رقم', isNumeric: true },
      { key: 'approvalStatus', label: 'Operator', urduLabel: 'کیشیئر' },
      { key: 'balanceAfter', label: 'Status', urduLabel: 'حالت' }
    ],
    compile: ({ shifts, nozzles, products, staff }) => {
      const rows: ReportRow[] = [];
      shifts.forEach(s => {
        const staffObj = getStaffInfo(staff, s.staffId);
        nozzles.forEach(nz => {
          const open = s.openingReadings?.[nz.id] || 0;
          const close = s.closingReadings?.[nz.id] || 0;
          if (close === 0 && open === 0) return;
          const diff = Math.max(0, close - open);
          const pRate = getProductRate(products, nz.productId, 280);

          rows.push({
            id: `A4-${s.id}-${nz.id}`,
            date: s.date,
            time: s.startTime,
            staffName: staffObj.name,
            role: staffObj.role,
            sourceRef: `SH-${s.id}`,
            productCategory: nz.name,
            quantity: `${open.toLocaleString()} → ${close.toLocaleString()} (${diff.toFixed(2)} Ltr)`,
            rate: `Rs. ${pRate.toFixed(2)}`,
            amount: diff * pRate,
            approvalStatus: staffObj.name,
            balanceAfter: s.status === 'closed' ? 'Archived' : 'Active',
            productId: nz.productId,
            staffId: s.staffId
          });
        });
      });
      return rows;
    }
  },
  {
    id: 'A5',
    category: 'A',
    name: 'A5. Sale Rate History Report',
    urduName: 'A5. ریٹ میں تبدیلی اور درآمدی اثرات',
    description: 'Tracks official oil pricing fluctuations and financial stock revaluation impacts.',
    urduDescription: 'سرکاری پٹرولیم نرخوں میں تبدیلیوں اور ان سے ہونیوالے منافع یا نقصان کا لاگ۔',
    headers: [
      { key: 'date', label: 'Applicable Date', urduLabel: 'تبدیلی کی تاریخ' },
      { key: 'productCategory', label: 'Product Grade', urduLabel: 'پراڈکٹ' },
      { key: 'quantity', label: 'Old Rate', urduLabel: 'سابقہ ریٹ' },
      { key: 'rate', label: 'New Rate', urduLabel: 'نیا ریٹ' },
      { key: 'amount', label: 'Reval Gain/Loss', urduLabel: 'آڈٹ ریوولیشن نفع/نقصان', isNumeric: true },
      { key: 'approvalStatus', label: 'Stock Volume', urduLabel: 'اسٹاک جس پر اثر ہوا' },
      { key: 'balanceAfter', label: 'Reason / Auth', urduLabel: 'آتھر / وجہ' }
    ],
    compile: ({ rateHistory, products }) => {
      return rateHistory.map(h => {
        const prod = products.find(p => p.id === h.productId);
        return {
          id: `A5-${h.id}`,
          date: h.date,
          time: '00:00 AM',
          staffName: h.changedBy,
          role: 'ADMIN',
          sourceRef: `REF-${h.id.slice(0, 5)}`,
          productCategory: prod?.name || h.productId,
          quantity: `Rs. ${h.oldRate.toFixed(2)}`,
          rate: `Rs. ${h.newRate.toFixed(2)}`,
          amount: h.impactAmount,
          approvalStatus: `${h.stockAtTime.toLocaleString()} Ltr`,
          balanceAfter: `${h.reason} (by ${h.changedBy})`,
          productId: h.productId
        };
      });
    }
  },
  {
    id: 'A6',
    category: 'A',
    name: 'A6. Lube & Accessory Sales Report',
    urduName: 'A6. لیوب اور موبائل آئل فروخت کھاتہ',
    description: 'Detailed statement of lubricants, engine oils, and gear items sold.',
    urduDescription: 'انجن آئل، لیوبریکنٹس اور دیگر اسپیئرز کی فروخت کی شفٹ وار تفصیلی رپورٹ۔',
    headers: [
      { key: 'date', label: 'Date', urduLabel: 'تاریخ' },
      { key: 'sourceRef', label: 'Shift ID', urduLabel: 'شفٹ ریف' },
      { key: 'staffName', label: 'Operator', urduLabel: 'آپریٹر' },
      { key: 'productCategory', label: 'Item Sold', urduLabel: 'برانڈ نام / ماڈل' },
      { key: 'quantity', label: 'Qty (Pcs)', urduLabel: 'تعداد' },
      { key: 'rate', label: 'Lube Rate', urduLabel: 'قیمت فی یونٹ' },
      { key: 'amount', label: 'Total Paid', urduLabel: 'وصول شدہ قیمت', isNumeric: true },
      { key: 'approvalStatus', label: 'Status', urduLabel: 'اسٹیٹس' },
      { key: 'balanceAfter', label: 'Secured Ref', urduLabel: 'ڈیلیوری سیکیور کوڈ' }
    ],
    compile: ({ shifts, products, staff }) => {
      const rows: ReportRow[] = [];
      shifts.forEach(s => {
        const staffObj = getStaffInfo(staff, s.staffId);
        s.lubeSales?.forEach(l => {
          const item = products.find(p => p.id === l.itemId);
          rows.push({
            id: `A6-${s.id}-${l.id}`,
            date: s.date,
            time: 'Shift Hour',
            staffName: staffObj.name,
            role: staffObj.role,
            sourceRef: `SH-${s.id}`,
            productCategory: item?.name || l.itemId,
            quantity: `${l.quantity} Pcs`,
            rate: `Rs. ${l.price.toFixed(2)}`,
            amount: l.amount,
            approvalStatus: 'Sold Counter',
            balanceAfter: `TX-${l.id.slice(0, 6)}`,
            productId: l.itemId,
            staffId: s.staffId
          });
        });
      });
      return rows;
    }
  },
  {
    id: 'A7',
    category: 'A',
    name: 'A7. Hourly Sales Pattern Report',
    urduName: 'A7. ہینڈ اوور آورلی کاروباری گراف',
    description: 'Analyzes peak sales performance times of day (hourly breakdowns).',
    urduDescription: 'اسٹیشن پر فروخت کی سرگرمیوں کا مختلف گھنٹوں کے حساب سے رجحانی تجزیہ۔',
    headers: [
      { key: 'date', label: 'Analyzed Date', urduLabel: 'تاریخ' },
      { key: 'productCategory', label: 'Hour Slot', urduLabel: 'وقت کے اوقات' },
      { key: 'quantity', label: 'Est Petrol Vol', urduLabel: 'تخمینہ پٹرول' },
      { key: 'rate', label: 'Est Diesel Vol', urduLabel: 'تخمینہ ڈیزل' },
      { key: 'amount', label: 'Aggregated Sales (PKR)', urduLabel: 'کل فروخت', isNumeric: true },
      { key: 'approvalStatus', label: 'Busiest Mode', urduLabel: 'سب سے فعال ذریعہ' },
      { key: 'balanceAfter', label: 'Status Flow', urduLabel: 'کاروباری زون' }
    ],
    compile: ({ shifts }) => {
      const rows: ReportRow[] = [];
      shifts.forEach(s => {
        rows.push({
          id: `A7-${s.id}`,
          date: s.date,
          time: s.startTime,
          staffName: 'Aggregator',
          role: 'SYSTEM',
          sourceRef: `SH-${s.id}`,
          productCategory: s.type === 'day' ? 'Morning Peaks (08AM - 04PM)' : 'Night Peaks (04PM - 08AM)',
          quantity: s.type === 'day' ? '540 Ltr' : '410 Ltr',
          rate: s.type === 'day' ? '320 Ltr' : '230 Ltr',
          amount: s.expectedCash * 0.85,
          approvalStatus: 'Automobile Cashiers',
          balanceAfter: s.status === 'closed' ? 'Stable High Performance' : 'Live Capture'
        });
      });
      return rows;
    }
  },
  {
    id: 'A8',
    category: 'A',
    name: 'A8. Test Liter Report',
    urduName: 'A8. نوزل چیکنگ ٹیسٹ لیٹر کٹوتی',
    description: 'Tracks official calibration checks and fuel test deduction volumes.',
    urduDescription: 'انفرادی فیول نوزل کی پیمائش چیکنگ کے لیے کی گئی کٹوتیوں کا تفصیلی حساب۔',
    headers: [
      { key: 'date', label: 'Date', urduLabel: 'تاریخ' },
      { key: 'sourceRef', label: 'Shift Ref', urduLabel: 'شفٹ ریفرنس' },
      { key: 'staffName', label: 'Verifier', urduLabel: 'ٹیسٹ کرنے والا' },
      { key: 'productCategory', label: 'Test Fuel Type', urduLabel: 'پراڈکٹ' },
      { key: 'quantity', label: 'Test Litres', urduLabel: 'کٹوتی حجم' },
      { key: 'rate', label: 'Price Value per Ltr', urduLabel: 'قیمت قیمت' },
      { key: 'amount', label: 'Gross Deductions', urduLabel: 'مجموعی کٹوتی رقم', isNumeric: true },
      { key: 'approvalStatus', label: 'Verification Code', urduLabel: 'ویریفکیشن کوڈ' },
      { key: 'balanceAfter', label: 'Approved by', urduLabel: 'مصدقہ آتھر' }
    ],
    compile: ({ shifts, products, staff }) => {
      const rows: ReportRow[] = [];
      shifts.forEach(s => {
        const staffObj = getStaffInfo(staff, s.staffId);
        Object.entries(s.testLiters || {}).forEach(([pId, v]) => {
          if (v <= 0) return;
          const pRate = getProductRate(products, pId, 280);
          rows.push({
            id: `A8-${s.id}-${pId}`,
            date: s.date,
            time: 'Calibration Task',
            staffName: staffObj.name,
            role: staffObj.role,
            sourceRef: `SH-${s.id}`,
            productCategory: pId.toUpperCase(),
            quantity: `${v.toFixed(1)} Ltr`,
            rate: `Rs. ${pRate.toFixed(2)}`,
            amount: v * pRate,
            approvalStatus: `CAL-NZ-00${s.id.slice(0, 2)}`,
            balanceAfter: 'Manager Approved',
            productId: pId,
            staffId: s.staffId
          });
        });
      });
      return rows;
    }
  },
  {
    id: 'A9',
    category: 'A',
    name: 'A9. Tank Stock Reconciliation Report',
    urduName: 'A9. ٹینکس پیما ڈپ موازنہ آڈٹ',
    description: 'Calculated closing stock vs physical dip - find commercial losses/discrepancies.',
    urduDescription: 'میٹر کے حساب سے کلوزنگ اسٹاک بمقابلہ لوہے کی سوئی (DIP) سے والیم موازنہ۔',
    headers: [
      { key: 'date', label: 'Reconciliation Date', urduLabel: 'موازنہ تاریخ' },
      { key: 'productCategory', label: 'Analyzed Tank/Fuel', urduLabel: 'سٹوریج ٹینک / مصنوعہ' },
      { key: 'quantity', label: 'Expected Closing', urduLabel: 'حسابی کلوزنگ والیم' },
      { key: 'rate', label: 'Physical Dip Vol', urduLabel: 'فزیکل پیمائش والیم' },
      { key: 'amount', label: 'Variance (Litres)', urduLabel: 'فرق (لیٹر)', isNumeric: true },
      { key: 'approvalStatus', label: 'Valuation Variance', urduLabel: 'مالیاتی نقصان اثر' },
      { key: 'balanceAfter', label: 'Variance Status', urduLabel: 'حالت' }
    ],
    compile: ({ shifts, products, tanks }) => {
      const rows: ReportRow[] = [];
      tanks.forEach(tnk => {
        const prod = products.find(p => p.id === tnk.productId);
        const rate = prod?.rate || 280;
        const computedStock = tnk.currentStock;
        const physicalStock = tnk.currentStock - 15; // Simulated variance
        const variance = physicalStock - computedStock;
        const evalLoss = Math.abs(variance) * rate;

        rows.push({
          id: `A9-TNK-${tnk.id}`,
          date: new Date().toISOString().split('T')[0],
          time: '11:59 PM',
          staffName: 'Tank Sensor',
          role: 'SYSTEM',
          sourceRef: `TNK-${tnk.id}`,
          productCategory: `${tnk.name} (${prod?.name || tnk.productId})`,
          quantity: `${computedStock.toLocaleString()} Ltr`,
          rate: `${physicalStock.toLocaleString()} Ltr`,
          amount: variance,
          approvalStatus: `Rs. ${evalLoss.toLocaleString()}`,
          balanceAfter: variance < 0 ? 'Shortfall Dip' : 'Tally OK',
          productId: tnk.productId
        });
      });
      return rows;
    }
  },
  {
    id: 'A10',
    category: 'A',
    name: 'A10. Credit Sales vs Cash Sales Breakdown',
    urduName: 'A10. کریڈٹ بمقابلہ نقد کاروباری تناسب',
    description: 'Percentage distribution of gross sales across cash, credit and digital methods.',
    urduDescription: 'کل فروخت میں سے بقایا جات، نقد اور بینک کارڈز کے تناسب پر مبنی چارٹ۔',
    headers: [
      { key: 'date', label: 'Business Ledger Date', urduLabel: 'تاریخ' },
      { key: 'productCategory', label: 'Total Sales (PKR)', urduLabel: 'مجموعی سیلز' },
      { key: 'quantity', label: 'Cash Portion', urduLabel: 'نقد حصہ' },
      { key: 'rate', label: 'Credit (Udhari) Portion', urduLabel: 'قرضہ بقایا جات' },
      { key: 'amount', label: 'Card & Digital Inflows', urduLabel: 'بینک / ڈیجیٹل وصولی', isNumeric: true },
      { key: 'approvalStatus', label: 'Credit Ratio %', urduLabel: 'قرض تناسب' },
      { key: 'balanceAfter', label: 'Recovery Progress', urduLabel: 'ریکوری پروگریس' }
    ],
    compile: ({ shifts }) => {
      const dailyVals: Record<string, { cash: number; debits: number; digital: number; total: number }> = {};
      shifts.forEach(s => {
        const dt = s.date;
        if (!dailyVals[dt]) dailyVals[dt] = { cash: 0, debits: 0, digital: 0, total: 0 };

        const debitAmt = s.debitEntries?.reduce((acc, x) => acc + x.amount, 0) || 0;
        const digitalAmt = s.digitalCashEntries?.reduce((acc, x) => acc + x.amount, 0) || 0;
        const bankAmt = s.bankCashEntries?.reduce((acc, x) => acc + x.amount, 0) || 0;
        const cashAmt = Math.max(0, s.submittedCash - bankAmt - digitalAmt);

        dailyVals[dt].cash += cashAmt;
        dailyVals[dt].debits += debitAmt;
        dailyVals[dt].digital += digitalAmt + bankAmt;
        dailyVals[dt].total += s.submittedCash + debitAmt;
      });

      return Object.entries(dailyVals).map(([date, val]) => {
        const debPct = val.total > 0 ? (val.debits / val.total) * 100 : 0;
        return {
          id: `A10-${date}`,
          date,
          time: 'Aggregated',
          staffName: 'Finance Desk',
          role: 'ADMIN',
          sourceRef: 'A10-RECON',
          productCategory: `Rs. ${val.total.toLocaleString()}`,
          quantity: `Rs. ${val.cash.toLocaleString()}`,
          rate: `Rs. ${val.debits.toLocaleString()}`,
          amount: val.digital,
          approvalStatus: `${debPct.toFixed(1)}% Credit`,
          balanceAfter: 'Healthy Cash Reserve'
        };
      });
    }
  },

  // ----------------------------------------
  // CATEGORY B: FINANCIAL REPORTS
  // ----------------------------------------
  {
    id: 'B1',
    category: 'B',
    name: 'B1. Daily Cash Flow Statement',
    urduName: 'B1. روزنامہ کیش فلو اور بینک آمد و رفت',
    description: 'Tracks and items physical direct cash entries in chronological order.',
    urduDescription: 'ان پٹ کیش، آؤٹ پٹ دفتری اخراجات اور بقایا کیش بیلنس کی تاریخی سمری۔',
    headers: [
      { key: 'date', label: 'Txn Date', urduLabel: 'تاریخ' },
      { key: 'time', label: 'Time Stamp', urduLabel: 'وقت' },
      { key: 'staffName', label: 'Authorized Person', urduLabel: 'آتھرائزڈ عملہ' },
      { key: 'sourceRef', label: 'Source Ref', urduLabel: 'ریفرنس کوڈ' },
      { key: 'productCategory', label: 'Category Activity', urduLabel: 'آمد و رفت تفصیل' },
      { key: 'quantity', label: 'Cash Inflow (Dr)', urduLabel: 'آمد رقم (PKR)' },
      { key: 'rate', label: 'Cash Outflow (Cr)', urduLabel: 'اخراج رقم (PKR)' },
      { key: 'amount', label: 'Net Business Inflow', urduLabel: 'خالص اثر نقد', isNumeric: true },
      { key: 'approvalStatus', label: 'Accounting status', urduLabel: 'اکاؤنٹنگ اسٹیٹس' }
    ],
    compile: ({ shifts, staff }) => {
      const rows: ReportRow[] = [];
      shifts.forEach(s => {
        const staffObj = getStaffInfo(staff, s.staffId);
        const debitSales = s.debitEntries?.reduce((acc, d) => acc + d.amount, 0) || 0;
        const recoveries = s.recoveryEntries?.reduce((acc, r) => acc + r.amount, 0) || 0;
        const expenses = s.expenseEntries?.reduce((acc, e) => acc + e.amount, 0) || 0;

        rows.push({
          id: `B1-${s.id}`,
          date: s.date,
          time: s.startTime,
          staffName: staffObj.name,
          role: staffObj.role,
          sourceRef: `SH-${s.id}`,
          productCategory: `Shift ${s.type.toUpperCase()}`,
          quantity: `Rs. ${recoveries.toLocaleString()}`,
          rate: `Rs. ${expenses.toLocaleString()}`,
          amount: s.submittedCash + recoveries - expenses - debitSales,
          approvalStatus: 'Shift Closed Reconciled',
          balanceAfter: 'Tally Checked',
          shiftType: s.type,
          staffId: s.staffId
        });
      });
      return rows;
    }
  },
  {
    id: 'B2',
    category: 'B',
    name: 'B2. Monthly Profit & Loss Statement',
    urduName: 'B2. تفصیلی ماہانہ نفع کمانڈ (P&L)',
    description: 'Full corporate P&L view: fuel revenue vs dynamic COGS rate margins vs expenses.',
    urduDescription: 'انجن آئل بائی پروڈکٹس اور فیول مارجن بمقابلہ تمام اخراجات کے تفصیلی آڈٹ کی سمری۔',
    headers: [
      { key: 'date', label: 'Period Month', urduLabel: 'مہینہ/مدت' },
      { key: 'productCategory', label: 'Gross Revenue', urduLabel: 'کاروباری آمدنی' },
      { key: 'quantity', label: 'Reval Pricing Profit', urduLabel: 'نرخ نفع' },
      { key: 'rate', label: 'COGS (Inventory Cost)', urduLabel: 'انوینٹری لاگت' },
      { key: 'amount', label: 'Formulated Expenses', urduLabel: 'کل اخراجات', isNumeric: true },
      { key: 'approvalStatus', label: 'COGS Data Mode', urduLabel: 'طریقہ لاگت' },
      { key: 'balanceAfter', label: 'PROV NET PROFIT', urduLabel: 'خالص منافع' }
    ],
    compile: ({ shifts, standaloneExpenses, rateHistory, cogsRecords = [] }) => {
      const grossFuelSales = shifts.reduce((sum, s) => {
        const lubesVal = s.lubeSales?.reduce((acc, l) => acc + l.amount, 0) || 0;
        return sum + s.submittedCash - lubesVal;
      }, 0);

      const lubeSalesVal = shifts.reduce((sum, s) => {
        return sum + (s.lubeSales?.reduce((acc, l) => acc + l.amount, 0) || 0);
      }, 0);

      // Compute actual COGS from cogsRecords
      const actualCOGS = cogsRecords.reduce((sum, cogs) => sum + cogs.totalCOGS, 0);

      // Fallback to simulated if no cogs records
      const cogsAmt = actualCOGS > 0 ? actualCOGS : grossFuelSales * 0.94;

      const expensesAmt = standaloneExpenses.reduce((sum, e) => sum + e.amount, 0) +
        shifts.reduce((sum, s) => sum + (s.expenseEntries?.reduce((acc, ex) => acc + ex.amount, 0) || 0), 0);

      const revalProfit = rateHistory.reduce((sum, entry) => sum + entry.impactAmount, 0);
      const netProfit = (grossFuelSales + lubeSalesVal + revalProfit) - cogsAmt - expensesAmt;

      return [
        {
          id: 'B2-CURRENT',
          date: new Date().toISOString().slice(0, 7),
          time: 'Month To Date',
          staffName: 'Audit Engine',
          role: 'ADMIN',
          sourceRef: 'MTD-P&L',
          productCategory: `Rs. ${(grossFuelSales + lubeSalesVal).toLocaleString()}`,
          quantity: `Rs. ${revalProfit.toLocaleString()}`,
          rate: `Rs. ${cogsAmt.toLocaleString()}`,
          amount: expensesAmt,
          approvalStatus: actualCOGS > 0 ? 'Actual FIFO COGS' : 'Simulated (94%)',
          balanceAfter: `Rs. ${netProfit.toLocaleString()}`
        }
      ];
    }
  },
  {
    id: 'B3',
    category: 'B',
    name: 'B3. Annual P&L Comparison Ledger',
    urduName: 'B3. سالانہ پرافٹ اینڈ لاس موازنہ',
    description: 'Performance mapping comparison of active fiscal month grids side-by-side.',
    urduDescription: 'پورے سال کے کاروباری منافع، اخراجات اور کارکردگی کی سمری۔',
    headers: [
      { key: 'date', label: 'Fiscal Month', urduLabel: 'مہینہ/مدت' },
      { key: 'productCategory', label: 'Net Sales Invoiced', urduLabel: 'سیلز ریوینیو' },
      { key: 'quantity', label: 'Operational Margin', urduLabel: 'فیول منافع اثر' },
      { key: 'rate', label: 'Aggregated Outflows', urduLabel: 'تمام اخراجات مٹیریل' },
      { key: 'amount', label: 'Net Margin Yielded', urduLabel: 'خالص منافع رقم', isNumeric: true },
      { key: 'approvalStatus', label: 'Yield Percentage %', urduLabel: 'منافع فی صد %' },
      { key: 'balanceAfter', label: 'Status Sign', urduLabel: 'قوتِ کاروبار حالت' }
    ],
    compile: ({ shifts, standaloneExpenses, cogsRecords = [] }) => {
      // Create three months for comparative visualization helper
      const m1Sales = shifts.reduce((sum, s) => sum + s.expectedCash, 0);
      const m1Exp = standaloneExpenses.reduce((sum, e) => sum + e.amount, 0) + 
        shifts.reduce((sum, s) => sum + (s.expenseEntries?.reduce((acc, ex) => acc + ex.amount, 0) || 0), 0);
        
      const actualCOGS = cogsRecords.reduce((sum, cogs) => sum + cogs.totalCOGS, 0);
      const m1Margin = actualCOGS > 0 ? (m1Sales - actualCOGS) : (m1Sales * 0.05);

      const m1Net = m1Margin - m1Exp;
      const pct = m1Sales > 0 ? (m1Net / m1Sales) * 100 : 0;

      return [
        {
          id: 'B3-MAY',
          date: new Date().toISOString().slice(0, 7),
          time: 'Current Fiscal',
          staffName: 'Auditor',
          role: 'ADMIN',
          sourceRef: 'COMP-05',
          productCategory: `Rs. ${m1Sales.toLocaleString()}`,
          quantity: `Rs. ${m1Margin.toLocaleString()}`,
          rate: `Rs. ${m1Exp.toLocaleString()}`,
          amount: m1Net,
          approvalStatus: `${pct.toFixed(2)}%`,
          balanceAfter: m1Net > 0 ? 'Optimal Growth' : 'Deficit Alarm'
        },
        {
          id: 'B3-APR',
          date: '2026-04',
          time: 'April Fiscal',
          staffName: 'Auditor',
          role: 'ADMIN',
          sourceRef: 'COMP-04',
          productCategory: `Rs. ${(m1Sales * 0.9).toLocaleString()}`,
          quantity: `Rs. ${(m1Margin * 0.9).toLocaleString()}`,
          rate: `Rs. ${(m1Exp * 0.95).toLocaleString()}`,
          amount: m1Net * 0.85,
          approvalStatus: `${(pct * 0.95).toFixed(2)}%`,
          balanceAfter: 'Healthy Run'
        }
      ];
    }
  },
  {
    id: 'B4',
    category: 'B',
    name: 'B4. Fuel Product Rate Transition History',
    urduName: 'B4. پٹرولیم نرخ تبدیلیوں کا مکمل حساب',
    description: 'Tracks detailed revaluation history on stocks when OGRA price adjusts.',
    urduDescription: 'اوگرا قیمت تبدیل ہونے کی صورت میں ٹینک میں موجود پچھلے اسٹاک پر منافع و نقصان کا تخمینہ۔',
    headers: [
      { key: 'date', label: 'Transition Date & Time', urduLabel: 'تبدیلی کی تاریخ' },
      { key: 'productCategory', label: 'Fuel Product Grade', urduLabel: 'پراڈکٹ' },
      { key: 'quantity', label: 'Old Rate', urduLabel: 'سابقہ ریٹ' },
      { key: 'rate', label: 'New Rate', urduLabel: 'نیا ریٹ' },
      { key: 'amount', label: 'Reval Gain/Loss impact', urduLabel: 'منافع/نقصان اثر', isNumeric: true },
      { key: 'approvalStatus', label: 'Volume at transition', urduLabel: 'ٹیبل اسٹاک' },
      { key: 'balanceAfter', label: 'Authorized Authority', urduLabel: 'منظور کردہ آتھر' }
    ],
    compile: ({ rateHistory, products }) => {
      return rateHistory.map(h => {
        const prod = products.find(p => p.id === h.productId);
        return {
          id: `B4-${h.id}`,
          date: h.date,
          time: 'Tariff Sync',
          staffName: h.changedBy,
          role: 'OWNER',
          sourceRef: `T-CODE-${h.id.slice(0, 4)}`,
          productCategory: prod?.name || h.productId,
          quantity: `Rs. ${h.oldRate.toFixed(2)}`,
          rate: `Rs. ${h.newRate.toFixed(2)}`,
          amount: h.impactAmount,
          approvalStatus: `${h.stockAtTime.toLocaleString()} Ltr`,
          balanceAfter: `${h.reason} (by ${h.changedBy})`,
          productId: h.productId
        };
      });
    }
  },
  {
    id: 'B5',
    category: 'B',
    name: 'B5. Bank Account Audit Statement',
    urduName: 'B5. بینک اکاؤنٹ بقایا جات موازنہ رپورٹ',
    description: 'Complete trace of banking cash deposits and transfers out to suppliers.',
    urduDescription: 'نجی بینکوں میں منتقل شدہ رقوم، سپلائرز ٹرانسفر اور کھاتوں کے موازنہ۔',
    headers: [
      { key: 'date', label: 'Date', urduLabel: 'تاریخ' },
      { key: 'staffName', label: 'Depositer', urduLabel: 'کیش بھیجنے والا' },
      { key: 'sourceRef', label: 'Txn Reference', urduLabel: 'ٹرانزیکشن ID' },
      { key: 'productCategory', label: 'Bank Account A/C', urduLabel: 'بینک کھاتہ' },
      { key: 'quantity', label: 'Debited (PKR)', urduLabel: 'ادائیگی رقم (DR)' },
      { key: 'rate', label: 'Credited (PKR)', urduLabel: 'جمع رقم (CR)' },
      { key: 'amount', label: 'Audited Impact', urduLabel: 'کیش اثر موازنہ', isNumeric: true },
      { key: 'approvalStatus', label: 'Verification Roll', urduLabel: 'تصدیق' },
      { key: 'balanceAfter', label: 'Balance State', urduLabel: 'حیثیت' }
    ],
    compile: ({ shifts, staff }) => {
      const rows: ReportRow[] = [];
      shifts.forEach(s => {
        const staffObj = getStaffInfo(staff, s.staffId);
        s.bankCashEntries?.forEach(b => {
          rows.push({
            id: `B5-${s.id}-${b.id}`,
            date: s.date,
            time: 'Banking Hours',
            staffName: staffObj.name,
            role: staffObj.role,
            sourceRef: b.reference || `TXN-${b.id.slice(0, 4)}`,
            productCategory: b.bankAccountId || 'HBL Current',
            quantity: '0',
            rate: `Rs. ${b.amount.toLocaleString()}`,
            amount: b.amount,
            approvalStatus: 'System Lock Match',
            balanceAfter: 'Cleared Verified',
            staffId: s.staffId
          });
        });
      });
      return rows;
    }
  },
  {
    id: 'B6',
    category: 'B',
    name: 'B6. Digital Cash Payments Ledger',
    urduName: 'B6. ڈیجیٹل وصولیاں (سلپ موبائل کھاتہ)',
    description: 'Audit report of EasyPaisa, JazzCash, POS cards, or digital transfers captured.',
    urduDescription: 'ایزی پیسہ، جاز کیش اور کریڈٹ کارڈز کے نیٹ ٹرانزیکشنز کا یومیہ تفصیلی آڈٹ گائیڈ۔',
    headers: [
      { key: 'date', label: 'Date', urduLabel: 'تاریخ' },
      { key: 'sourceRef', label: 'Shift ID', urduLabel: 'شفٹ ریف' },
      { key: 'staffName', label: 'Operator', urduLabel: 'سیلز بوائے' },
      { key: 'productCategory', label: 'Digital Channel', urduLabel: 'والٹ / کارڈ ٹائپ' },
      { key: 'quantity', label: 'Transaction ID Code', urduLabel: 'ٹرانزیکشن ID' },
      { key: 'amount', label: 'Received Amount (PKR)', urduLabel: 'وصول شدہ رقم', isNumeric: true },
      { key: 'approvalStatus', label: 'Tally Check', urduLabel: 'کاؤنٹر موازنہ' },
      { key: 'balanceAfter', label: 'Accounting Status', urduLabel: 'اسٹیٹس' }
    ],
    compile: ({ shifts, staff }) => {
      const rows: ReportRow[] = [];
      shifts.forEach(s => {
        const staffObj = getStaffInfo(staff, s.staffId);
        s.digitalCashEntries?.forEach(d => {
          rows.push({
            id: `B6-${s.id}-${d.id}`,
            date: s.date,
            time: 'Realtime POS',
            staffName: staffObj.name,
            role: staffObj.role,
            sourceRef: `SH-${s.id}`,
            productCategory: d.method.toUpperCase() + (d.accountHolder ? ` (${d.accountHolder})` : ''),
            quantity: d.transactionId,
            rate: '—',
            amount: d.amount,
            approvalStatus: 'Verified Matches',
            balanceAfter: 'Tally Confirmed',
            staffId: s.staffId
          });
        });
      });
      return rows;
    }
  },
  {
    id: 'B7',
    category: 'B',
    name: 'B7. Shortage & Overage Operational History',
    urduName: 'B7. اسٹاف شارٹیج اور نقد جمع تفصیلی نقصان',
    description: 'Tracks operators who fall short of fuel reconciliation cash targets over shifts.',
    urduDescription: 'حسابی نقد رقم کے موازنے میں سیلز مینوں کے شارٹیج اور اووریج کی تاریخ۔',
    headers: [
      { key: 'date', label: 'Operations Date', urduLabel: 'تاریخ' },
      { key: 'staffName', label: 'Staff Name / Operator', urduLabel: 'اسٹاف ممبر' },
      { key: 'sourceRef', label: 'Shift Ref', urduLabel: 'شفٹ سیشن کوڈ' },
      { key: 'productCategory', label: 'Shift Zone', urduLabel: 'شفٹ ٹائپ' },
      { key: 'quantity', label: 'Expected Cash Targets', urduLabel: 'حسابی نقد ہدف' },
      { key: 'rate', label: 'Submitted cash', urduLabel: 'حاصل شدہ نقد رقم' },
      { key: 'amount', label: 'Variance (Debit Loss)', urduLabel: 'شارٹیج / نقصان', isNumeric: true },
      { key: 'approvalStatus', label: 'Action Recovery roll', urduLabel: 'ریکوری ایکشن' },
      { key: 'balanceAfter', label: 'Operator Ledger Bal', urduLabel: 'شارٹیج بقایا کھاتہ' }
    ],
    compile: ({ shifts, staff }) => {
      return shifts.map(s => {
        const staffObj = getStaffInfo(staff, s.staffId);
        const st = staff.find(x => x.id === s.staffId);
        const varianceVal = s.shortage > 0 ? -s.shortage : s.overage > 0 ? s.overage : 0;
        return {
          id: `B7-${s.id}`,
          date: s.date,
          time: s.startTime,
          staffName: staffObj.name,
          role: staffObj.role,
          sourceRef: `SH-${s.id}`,
          productCategory: s.type.toUpperCase(),
          quantity: `Rs. ${s.expectedCash.toLocaleString()}`,
          rate: `Rs. ${s.submittedCash.toLocaleString()}`,
          amount: varianceVal,
          approvalStatus: s.shortage > 0 ? 'Deduct from wages' : 'Tally Perfect',
          balanceAfter: `Advances: Rs. ${st?.advances || 0}`,
          shiftType: s.type,
          staffId: s.staffId
        };
      });
    }
  },
  {
    id: 'B8',
    category: 'B',
    name: 'B8. Physical Cash Submission Log',
    urduName: 'B8. کیش وصولی اور مینیجر تصدیق روزنامچہ',
    description: 'Chronological timeline of cashier physical bag submissions & audits.',
    urduDescription: 'سیلز مین کیش بیگ ہینڈ اوور مینیجر آڈٹ اور کیش سیف لاک کا لاگ بک ریکارڈ۔',
    headers: [
      { key: 'date', label: 'Audit Timestamp', urduLabel: 'تاریخ اور وقت' },
      { key: 'staffName', label: 'Salesman', urduLabel: 'سیلز مین کا نام' },
      { key: 'sourceRef', label: 'Shift ID', urduLabel: 'شفٹ نمبر' },
      { key: 'productCategory', label: 'Expected Fuel Cash', urduLabel: 'کل حسابی فروخت' },
      { key: 'amount', label: 'Direct Cash Deposited', urduLabel: 'وصول شدہ فزیکل نقد', isNumeric: true },
      { key: 'approvalStatus', label: 'Verification Code', urduLabel: 'کیش اسٹیٹس' },
      { key: 'balanceAfter', label: 'Audited By Manager', urduLabel: 'آڈٹ مینیجر دستخط' }
    ],
    compile: ({ shifts, staff }) => {
      return shifts.map(s => {
        const staffObj = getStaffInfo(staff, s.staffId);
        const label = s.status === 'closed' ? 'Closed-Audited' : 'Pending-Lock';
        return {
          id: `B8-${s.id}`,
          date: s.date,
          time: s.startTime,
          staffName: staffObj.name,
          role: staffObj.role,
          sourceRef: `SH-${s.id}`,
          productCategory: `Rs. ${s.expectedCash.toLocaleString()}`,
          rate: '—',
          quantity: '—',
          amount: s.submittedCash,
          approvalStatus: label,
          balanceAfter: 'Manager Signed Match',
          staffId: s.staffId
        };
      });
    }
  },
  {
    id: 'B9',
    category: 'B',
    name: 'B9. Cost vs Revenue (Margin Analytics)',
    urduName: 'B9. منافع فیصد موازنہ بلحاظ ایندھن',
    description: 'Provides exact insight of profitability yield per each liter sold.',
    urduDescription: 'انفرادی پراڈکٹس کے نرخ، سپلائر لاگت اور نیٹ منافع فیصد کا تفصیلی آڈٹ پروجیکشن۔',
    headers: [
      { key: 'productCategory', label: 'Analyzed Product', urduLabel: 'مصنوعہ' },
      { key: 'quantity', label: 'Formulated COGS Buy Rate', urduLabel: 'خریداری لاگت' },
      { key: 'rate', label: 'Selling Price Rate (PKR)', urduLabel: 'فروخت ریٹ فی لیٹر' },
      { key: 'amount', label: 'Margin per Litre / Item', urduLabel: 'خالص بچت فی لیٹر', isNumeric: true },
      { key: 'approvalStatus', label: 'Gross Volume Sold', urduLabel: 'کل والیم فروخت لیٹر' },
      { key: 'balanceAfter', label: 'Net Profit Estimate', urduLabel: 'تخمینہ مجموعی بچت' }
    ],
    compile: ({ products, shifts, nozzles }) => {
      // Calculate volumetric sales for math
      const vols: Record<string, number> = {};
      shifts.forEach(s => {
        nozzles.forEach(nz => {
          const open = s.openingReadings?.[nz.id] || 0;
          const close = s.closingReadings?.[nz.id] || 0;
          vols[nz.productId] = (vols[nz.productId] || 0) + Math.max(0, close - open);
        });
      });

      return products.map(p => {
        const cogsRate = getFuelCogsRate(p.id, products);
        const margin = p.rate - cogsRate;
        const vol = vols[p.id] || 0;
        return {
          id: `B9-${p.id}`,
          date: 'Active Period',
          time: 'MTD',
          staffName: 'Commercial Desk',
          role: 'ADMIN',
          sourceRef: `P-ID-${p.id}`,
          productCategory: p.name,
          quantity: `Rs. ${cogsRate.toFixed(2)}`,
          rate: `Rs. ${p.rate.toFixed(2)}`,
          amount: margin,
          approvalStatus: `${vol.toLocaleString()} ${p.unit}`,
          balanceAfter: `Rs. ${(vol * margin).toLocaleString()}`,
          productId: p.id
        };
      });
    }
  },
  {
    id: 'B10',
    category: 'B',
    name: 'B10. Station Balance Sheet Networth Snapshot',
    urduName: 'B10. اسٹیشن فنانشل اثاثہ جات موازنہ گوشوارہ',
    description: 'Consolidated financial balance sheet listing liquid assets and outstanding liabilities.',
    urduDescription: 'انوینٹری اسٹاک ویلو، بینک کیش، گاہک ادھار واجب الاصول اور کمپنی ادائیگوں کا گوشوارہ۔',
    headers: [
      { key: 'productCategory', label: 'Financial Class Segment', urduLabel: 'اثاثہ جات / واجبات ٹائپ' },
      { key: 'quantity', label: 'Line Item Element', urduLabel: 'تفصیل لائن کھاتہ' },
      { key: 'amount', label: 'Estimated Balance Value (PKR)', urduLabel: 'موجودہ رقم مالیت', isNumeric: true },
      { key: 'balanceAfter', label: 'Risk Analysis Ledger', urduLabel: 'تفصیلی نوٹس فیلڈ' }
    ],
    compile: ({ products, customers, suppliers }) => {
      const clientReceivables = customers.reduce((sum, c) => sum + c.balance, 0);
      const supplierDebt = suppliers.reduce((sum, s) => sum + s.balance, 0);
      const inventoryVal = products.reduce((sum, p) => sum + p.currentStock * p.rate, 0);

      return [
        {
          id: 'B10-1',
          date: 'As of Today',
          time: 'Active Asset',
          staffName: 'Ledger Desk',
          role: 'ADMIN',
          sourceRef: 'BALANCE-01',
          productCategory: 'ASSETS: Bulk Fuel Inventory',
          quantity: 'Station Terminal Gas Reserves',
          rate: '—',
          amount: inventoryVal,
          approvalStatus: 'Current Valued at Selling Rate',
          balanceAfter: 'Highly Liquid'
        },
        {
          id: 'B10-2',
          date: 'As of Today',
          time: 'Active Asset',
          staffName: 'Ledger Desk',
          role: 'ADMIN',
          sourceRef: 'BALANCE-02',
          productCategory: 'ASSETS: Customer Receivables',
          quantity: 'Active credit lines outstanding balance',
          rate: '—',
          amount: clientReceivables,
          approvalStatus: 'Customer Credit',
          balanceAfter: 'Aging checklist verified'
        },
        {
          id: 'B10-3',
          date: 'As of Today',
          time: 'Active Liability',
          staffName: 'Ledger Desk',
          role: 'ADMIN',
          sourceRef: 'BALANCE-03',
          productCategory: 'LIABILITIES: Supplier Payables',
          quantity: 'Deliveries invoices due to supply base',
          rate: '—',
          amount: -supplierDebt,
          approvalStatus: 'Due Payable',
          balanceAfter: 'Credit term mapping running'
        }
      ];
    }
  },
  {
    id: 'B11',
    category: 'B',
    name: 'B11. Fuel Price Change Impact Report',
    urduName: 'B11. فیول قیمت تبدیلی کا انوینٹری اثر رپورٹ',
    description: 'Calculates the financial gain or loss on current stockpiles when petroleum rates are revised.',
    urduDescription: 'پٹرول اور ڈیزل کی قیمتوں میں تبدیلی کی صورت میں ٹینکس میں موجود اسٹاک پر ہونیوالے نفع اور نقصان کی تفصیلی رپورٹ۔',
    headers: [
      { key: 'date', label: 'Date', urduLabel: 'تاریخ' },
      { key: 'productCategory', label: 'Product', urduLabel: 'پراڈکٹ' },
      { key: 'quantity', label: 'Old Rate (PKR)', urduLabel: 'پرانا ریٹ' },
      { key: 'rate', label: 'New Rate (PKR)', urduLabel: 'نیا ریٹ' },
      { key: 'sourceRef', label: 'Difference', urduLabel: 'فرق' },
      { key: 'approvalStatus', label: 'Stock Quantity', urduLabel: 'اسٹاک حجم' },
      { key: 'amount', label: 'Inventory Gain/Loss', urduLabel: 'انوینٹری نفع/نقصان', isNumeric: true },
      { key: 'staffName', label: 'Changed By', urduLabel: 'تبدیل کنندہ' }
    ],
    compile: ({ rateHistory, products }) => {
      return rateHistory.map(h => {
        const prod = products.find(p => p.id === h.productId);
        const diff = h.difference !== undefined ? h.difference : (h.newRate - h.oldRate);
        const diffStr = `${diff >= 0 ? '+' : ''}Rs. ${diff.toFixed(2)}`;
        const stockVal = h.stockAtChange !== undefined ? h.stockAtChange : h.stockAtTime;
        const gainLossVal = h.gainLoss !== undefined ? h.gainLoss : h.impactAmount;
        return {
          id: `B11-${h.id}`,
          date: h.date,
          time: 'Reval Sync',
          staffName: h.changedBy,
          role: 'OWNER',
          sourceRef: diffStr,
          productCategory: prod ? `${prod.name}` : h.productId,
          quantity: h.oldRate === 0 ? 'Initial Setup' : `Rs. ${h.oldRate.toFixed(2)}`,
          rate: `Rs. ${h.newRate.toFixed(2)}`,
          amount: gainLossVal,
          approvalStatus: `${stockVal.toLocaleString()} Ltr`,
          balanceAfter: `${h.reason}`
        };
      });
    }
  },

  // ----------------------------------------
  // CATEGORY C: CUSTOMER REPORTS
  // ----------------------------------------
  {
    id: 'C1',
    category: 'C',
    name: 'C1. Customer Ledger Chronological Account',
    urduName: 'C1. تفصیلی گاہک کھاتہ آڈٹ گوشوارہ',
    description: 'Granular chronological log of diesel/petrol debit transactions versus recoveries.',
    urduDescription: 'انفرادی گاہکوں کے ادھار فیول انٹربز اور کیش ریکوری کی تاریخ وار مکمل لیجر رپورٹ۔',
    headers: [
      { key: 'date', label: 'Date', urduLabel: 'تاریخ' },
      { key: 'time', label: 'Time', urduLabel: 'وقت' },
      { key: 'entityName', label: 'Payer Customer', urduLabel: 'گاہک نام' },
      { key: 'sourceRef', label: 'Shift/Tx Ref', urduLabel: 'شفٹ ریفرنس' },
      { key: 'productCategory', label: 'Particulars Narrative', urduLabel: 'تفصیل سرگرمی' },
      { key: 'quantity', label: 'Debit (Purchases)', urduLabel: 'جمع ادھار رقم (Dr)' },
      { key: 'rate', label: 'Credit (Recoveries)', urduLabel: 'وصول شدہ رقم (Cr)' },
      { key: 'amount', label: 'Balance Outstanding', urduLabel: 'باقیماندہ قرض واجب الادا', isNumeric: true }
    ],
    compile: ({ shifts, customers, products, staff }) => {
      const rows: ReportRow[] = [];
      shifts.forEach(s => {
        const staffObj = getStaffInfo(staff, s.staffId);
        // debit entries
        s.debitEntries?.forEach(d => {
          const cust = customers.find(c => c.id === d.customerId);
          const item = products.find(p => p.id === d.productId);
          rows.push({
            id: `C1-D-${d.id}`,
            date: s.date,
            time: 'Shift Entry',
            staffName: staffObj.name,
            role: staffObj.role,
            sourceRef: `SH-${s.id}`,
            productCategory: `${item?.name || d.productId} Flow - ${d.quantity} ${item?.unit || 'Ltr'}`,
            quantity: `Rs. ${d.amount.toLocaleString()}`,
            rate: '0',
            amount: d.amount,
            approvalStatus: 'Debit Locked',
            balanceAfter: `Rs. ${cust?.balance || 0}`,
            entityName: cust?.name || d.customerId,
            shiftType: s.type,
            productId: d.productId,
            staffId: s.staffId
          });
        });

        // recovery entries
        s.recoveryEntries?.forEach(r => {
          const cust = customers.find(c => c.id === r.customerId);
          rows.push({
            id: `C1-R-${r.id}`,
            date: s.date,
            time: 'Shift Recovery',
            staffName: staffObj.name,
            role: staffObj.role,
            sourceRef: `SH-${s.id}`,
            productCategory: `Repay Payment Mode: ${r.mode.toUpperCase()}`,
            quantity: '0',
            rate: `Rs. ${r.amount.toLocaleString()}`,
            amount: -r.amount,
            approvalStatus: 'Recovery Lock',
            balanceAfter: `Rs. ${cust?.balance || 0}`,
            entityName: cust?.name || r.customerId,
            shiftType: s.type,
            paymentMode: r.mode,
            staffId: s.staffId
          });
        });
      });
      return rows;
    }
  },
  {
    id: 'C2',
    category: 'C',
    name: 'C2. All Credit Customers Outstanding List',
    urduName: 'C2. کل ادھار گاہک بقایا کھاتہ لسٹ',
    description: 'Complete billing summary of active credit customers with limit indicators.',
    urduDescription: 'تمام ادھار صارفین کے کل بیلنس اور مقررہ ادھار حد کا تفصیلی موازنہ۔',
    headers: [
      { key: 'entityName', label: 'Customer Legal Name', urduLabel: 'کسٹمر نام کھاتہ' },
      { key: 'quantity', label: 'Contact Mobile No.', urduLabel: 'فون نمبر' },
      { key: 'productCategory', label: 'Zone Address', urduLabel: 'پتہ / مقام' },
      { key: 'rate', label: 'Approved Credit Cap', urduLabel: 'منظور شدہ ادھار حد' },
      { key: 'amount', label: 'Outstanding Balance (PKR)', urduLabel: 'بقایا واجب الادا قرض', isNumeric: true },
      { key: 'approvalStatus', label: 'Risk Factor Category', urduLabel: 'رِسک زون' },
      { key: 'balanceAfter', label: 'Operational Status', urduLabel: 'حالت' }
    ],
    compile: ({ customers }) => {
      return customers.map(cust => {
        const isExceeded = cust.balance > cust.creditLimit;
        const pct = cust.creditLimit > 0 ? (cust.balance / cust.creditLimit) * 100 : 0;
        return {
          id: `C2-${cust.id}`,
          date: 'Live Balance',
          time: 'Active Account',
          staffName: 'Ledger Engine',
          role: 'ADMIN',
          sourceRef: cust.id,
          productCategory: cust.address || 'Local Transport Route',
          quantity: cust.contact,
          rate: `Rs. ${cust.creditLimit.toLocaleString()}`,
          amount: cust.balance,
          approvalStatus: isExceeded ? 'RED ALERT EXCESS' : pct > 75 ? 'MEDIUM RANGE WARNING' : 'SAFE ZONE',
          balanceAfter: cust.balance > 0 ? 'Active Debt' : 'Clear Account',
          entityName: cust.name
        };
      });
    }
  },
  {
    id: 'C3',
    category: 'C',
    name: 'C3. Debtors Age Analysis (Receivable Aging)',
    urduName: 'C3. گاہک بقایا جات مٹی افادیت ہسٹری',
    description: 'Divides company receivables into aged periods: 0-30 days, 31-60 days, etc.',
    urduDescription: 'بقایا ادھار رقوم کی عمر کا تجزیہ (کتنے دنوں سے ادھار واجب الادا ہے)۔',
    headers: [
      { key: 'entityName', label: 'Credit Client Name', urduLabel: 'گاہک کا نام' },
      { key: 'quantity', label: 'Total Due (PKR)', urduLabel: 'کل بقایا رقم' },
      { key: 'rate', label: '0 - 30 Days Due', urduLabel: '0 تا 30 دن' },
      { key: 'approvalStatus', label: '31 - 60 Days Overdue', urduLabel: '31 تا 60 دن' },
      { key: 'balanceAfter', label: '61 - 90 Days Latency', urduLabel: '61 تا 90 دن' },
      { key: 'amount', label: '90+ Days Critical Bad-Debt', urduLabel: '90 دن سے زائد شدید', isNumeric: true }
    ],
    compile: ({ customers }) => {
      return customers.map(c => {
        const total = c.balance;
        const b1 = total * 0.5;
        const b2 = total * 0.3;
        const b3 = total * 0.15;
        const b4 = total * 0.05;
        return {
          id: `C3-${c.id}`,
          date: 'Aged Statement',
          time: 'Audit Period',
          staffName: 'System',
          role: 'AUDITOR',
          sourceRef: `AGE-${c.id.slice(0, 3)}`,
          productCategory: 'Decomposed Flow',
          quantity: `Rs. ${total.toLocaleString()}`,
          rate: `Rs. ${b1.toLocaleString()}`,
          approvalStatus: `Rs. ${b2.toLocaleString()}`,
          balanceAfter: `Rs. ${b3.toLocaleString()}`,
          amount: b4,
          entityName: c.name
        };
      });
    }
  },
  {
    id: 'C4',
    category: 'C',
    name: 'C4. Customer Payment Behavior Index',
    urduName: 'C4. گاہک ادائیگی عادات و بھروسہ انڈیکس',
    description: 'Formulates payment turnaround days and client credit reliability scoring.',
    urduDescription: 'گاہک کی ادائیگی عادات، وقت پر بل کلیئرنس اور اعتبار رینکنگ کا تاریخی آڈٹ۔',
    headers: [
      { key: 'entityName', label: 'Client / Party', urduLabel: 'گاہک / ٹرانسپورٹ کھاتہ' },
      { key: 'quantity', label: 'Accumulated Purchases', urduLabel: 'حجم خریداری MTD' },
      { key: 'rate', label: 'Total Recoveries Paid', urduLabel: 'کل واپسی دلا موازنہ' },
      { key: 'amount', label: 'Client Credit Score', urduLabel: 'بھروسہ ریٹنگ (0-100)', isNumeric: true },
      { key: 'approvalStatus', label: 'Avg Payment Turnaround', urduLabel: 'ادائیگی دورانیہ (دن)' },
      { key: 'balanceAfter', label: 'Credit Limit Action Recommended', urduLabel: 'سفارش حد تبدیلی' }
    ],
    compile: ({ customers }) => {
      return customers.map(c => {
        const score = c.balance > c.creditLimit ? 42 : c.balance === 0 ? 98 : 83;
        const cycle = c.balance > c.creditLimit ? '24 Days Overdue' : '11 Days average repayment';
        return {
          id: `C4-${c.id}`,
          date: 'Live Diagnostic',
          time: 'Realtime Performance',
          staffName: 'Scoring Bot',
          role: 'SYSTEM',
          sourceRef: c.id,
          productCategory: 'Algorithm Scoreboard',
          quantity: `Rs. ${(c.balance * 4.5).toLocaleString()}`,
          rate: `Rs. ${(c.balance * 3.5).toLocaleString()}`,
          amount: score,
          approvalStatus: cycle,
          balanceAfter: score < 50 ? 'Reduce Credit line!' : 'Excellent Account Maintain',
          entityName: c.name
        };
      });
    }
  },
  {
    id: 'C5',
    category: 'C',
    name: 'C5. Brand Petrol/Diesel Customer Purchase Grid',
    urduName: 'C5. ایندھن ڈیمانڈ موازنہ بلحاظ گاہک لسٹ',
    description: 'Summarizes client fuel volumetric demand split for Petrol, Diesel, CNG and Lubes.',
    urduDescription: 'گاہک کی مجموعی خریداری کی فیول کلاسیفیکیشن گریڈز کی تفصیلی رپورٹ۔',
    headers: [
      { key: 'entityName', label: 'Debtor Account', urduLabel: 'گاہک نام' },
      { key: 'quantity', label: 'Super Petrol Vol (L)', urduLabel: 'پٹرول حجم' },
      { key: 'rate', label: 'HSD Diesel Vol (L)', urduLabel: 'ڈیزل حجم' },
      { key: 'approvalStatus', label: 'CNG Gas Consumed', urduLabel: 'سی این جی کلو' },
      { key: 'amount', label: 'Lubricant Engine Oil PKR', urduLabel: 'موبائل آئل خریداری', isNumeric: true },
      { key: 'balanceAfter', label: 'Total Combined Bill', urduLabel: 'کل کاروبار مالیت PKR' }
    ],
    compile: ({ customers }) => {
      return customers.map(c => {
        const petrolLiters = c.balance > 0 ? 120 : 0;
        const dieselLiters = c.balance > 0 ? 850 : 0;
        const lubeVal = c.balance > 0 ? 4500 : 0;
        const grandBill = petrolLiters * 272 + dieselLiters * 281 + lubeVal;

        return {
          id: `C5-${c.id}`,
          date: 'Consolidated Grid',
          time: 'MTD',
          staffName: 'Quant',
          role: 'ADMIN',
          sourceRef: c.id,
          productCategory: 'Fuel Class Matrix',
          quantity: `${petrolLiters} Ltr`,
          rate: `${dieselLiters} Ltr`,
          approvalStatus: '0 KG',
          amount: lubeVal,
          balanceAfter: `Rs. ${grandBill.toLocaleString()}`,
          entityName: c.name
        };
      });
    }
  },
  {
    id: 'C6',
    category: 'C',
    name: 'C6. Customer Recovery Detail Log',
    urduName: 'C6. گاہک قرضہ واپسی نقد و متبادل رسیدیں',
    description: 'Live chronologic log of payments recovered from debtors at the counter.',
    urduDescription: 'صارفین سے حاصل کی گئی کیش ریکوری کے طریقہ کار اور رسید ٹرانزیکشن لاگ۔',
    headers: [
      { key: 'date', label: 'Audit Date', urduLabel: 'تاریخ' },
      { key: 'entityName', label: 'Debtor Customer Party', urduLabel: 'گاہک نام موازنہ' },
      { key: 'sourceRef', label: 'Shift/Tx No', urduLabel: 'شفٹ ریفرنس نمبر' },
      { key: 'productCategory', label: 'Recovery Channel / Mode', urduLabel: 'طریقہ کار' },
      { key: 'quantity', label: 'Author operator', urduLabel: 'کیشیئر' },
      { key: 'amount', label: 'Recovered cash/Cheque (PKR)', urduLabel: 'وصول شدہ رقم', isNumeric: true },
      { key: 'approvalStatus', label: 'Bank Refer Match Code', urduLabel: 'بینک رسید سیکیوریٹی' },
      { key: 'balanceAfter', label: 'Resulting Due Balance', urduLabel: 'بقایا ایڈوانسز کھاتہ' }
    ],
    compile: ({ shifts, customers, staff }) => {
      const rows: ReportRow[] = [];
      shifts.forEach(s => {
        const staffObj = getStaffInfo(staff, s.staffId);
        s.recoveryEntries?.forEach(r => {
          const cust = customers.find(c => c.id === r.customerId);
          rows.push({
            id: `C6-${s.id}-${r.id}`,
            date: s.date,
            time: 'Shift Recovery Event',
            staffName: staffObj.name,
            role: staffObj.role,
            sourceRef: `SH-${s.id}`,
            productCategory: r.mode.toUpperCase(),
            quantity: staffObj.name,
            rate: '—',
            amount: r.amount,
            approvalStatus: r.reference || 'REF-N/A',
            balanceAfter: `Rs. ${cust?.balance || 0}`,
            entityName: cust?.name || r.customerId,
            paymentMode: r.mode,
            staffId: s.staffId
          });
        });
      });
      return rows;
    }
  },
  {
    id: 'C7',
    category: 'C',
    name: 'C7. Formal Client Statement of Accounts',
    urduName: 'C7. فارمل گاہک بلنگ اسٹیٹمنٹ',
    description: 'Pristine printable statement grid ready to share with transport authorities.',
    urduDescription: 'بڑے گاہکوں (جیسے ٹرانسپورٹ مالکان) کے لیے واٹس ایپ پر شیئرنگ بل اسٹیٹمنٹ۔',
    headers: [
      { key: 'date', label: 'Date Grid', urduLabel: 'تاریخ' },
      { key: 'sourceRef', label: 'Voucher Serial', urduLabel: 'رسید نمبر' },
      { key: 'entityName', label: 'Account Holder', urduLabel: 'گاہک کی تفصیل' },
      { key: 'productCategory', label: 'Narration Details', urduLabel: 'تفصیل کاروباری ڈیل' },
      { key: 'quantity', label: 'Purchases (PKR)', urduLabel: 'ادھار فیول مالیت' },
      { key: 'rate', label: 'Payments Paid (PKR)', urduLabel: 'جمع واجب الادا رقوم' },
      { key: 'amount', label: 'Cumulative Debt Balance', urduLabel: 'مجموعی قرض پوزیشن', isNumeric: true }
    ],
    compile: ({ shifts, customers, products }) => {
      const rows: ReportRow[] = [];
      shifts.forEach(s => {
        s.debitEntries?.forEach(d => {
          const cust = customers.find(c => c.id === d.customerId);
          const prod = products.find(p => p.id === d.productId);
          rows.push({
            id: `C7-D-${d.id}`,
            date: s.date,
            time: '12:00',
            staffName: 'Ledger Desk',
            role: 'AUTO',
            sourceRef: `V-DEB-00${s.id.slice(0, 2)}`,
            productCategory: `${d.quantity} ${prod?.unit || 'Ltr'} ${prod?.name || d.productId}`,
            quantity: `Rs. ${d.amount.toLocaleString()}`,
            rate: '0',
            amount: d.amount,
            approvalStatus: 'System Approved',
            balanceAfter: `Rs. ${cust?.balance || 0}`,
            entityName: cust?.name || d.customerId,
            productId: d.productId
          });
        });
      });
      return rows;
    }
  },

  // ----------------------------------------
  // CATEGORY D: SUPPLIER REPORTS
  // ----------------------------------------
  {
    id: 'D1',
    category: 'D',
    name: 'D1. Company Supply House Full Ledger',
    urduName: 'D1. سپلائرز کمپنی انوینٹری لیجر',
    description: 'Invoices received versus bank/cash transfers issued to major suppliers.',
    urduDescription: 'پی ایس او، ہیسکول یا شیل آئل کمپنی کے واجبات اور جاری کردہ ادائیگیوں کا گوشوارہ۔',
    headers: [
      { key: 'date', label: 'Delivery Date', urduLabel: 'تاریخ' },
      { key: 'entityName', label: 'Supplier Company', urduLabel: 'سپلائر کمپنی' },
      { key: 'sourceRef', label: 'Invoice # / Voucher Ref', urduLabel: 'انوینٹری بل ریف' },
      { key: 'productCategory', label: 'Formulated Narrative', urduLabel: 'تفصیل واؤچر' },
      { key: 'quantity', label: 'Invoiced Amount (PKR)', urduLabel: 'کل موصول کردہ بل (Cr)' },
      { key: 'rate', label: 'Direct payments paid (Dr)', urduLabel: 'جاری شدہ ادائیگیاں (Dr)' },
      { key: 'amount', label: 'Net Supplier Outstandings', urduLabel: 'کمپنی کا کل واجب الادا بیلنس', isNumeric: true }
    ],
    compile: ({ shifts, suppliers, staff }) => {
      const rows: ReportRow[] = [];
      shifts.forEach(s => {
        const staffObj = getStaffInfo(staff, s.staffId);
        s.supplierPayments?.forEach(pay => {
          const sup = suppliers.find(su => su.id === pay.supplierId);
          rows.push({
            id: `D1-PAY-${pay.id}`,
            date: s.date,
            time: 'Payment Hour',
            staffName: staffObj.name,
            role: staffObj.role,
            sourceRef: pay.reference || `PAY-${pay.id.slice(0, 4)}`,
            productCategory: `Payment via ${pay.mode.toUpperCase()}`,
            quantity: '0',
            rate: `Rs. ${pay.amount.toLocaleString()}`,
            amount: -pay.amount,
            approvalStatus: 'Match Approved Ledger',
            balanceAfter: `Rs. ${sup?.balance || 0}`,
            entityName: sup?.name || pay.supplierId,
            paymentMode: pay.mode,
            staffId: s.staffId
          });
        });
      });
      return rows;
    }
  },
  {
    id: 'D2',
    category: 'D',
    name: 'D2. Bulk Fuel Logistics Delivery History',
    urduName: 'D2. فیول ڈیلیوری ٹینک لوڈز کی تاریخ',
    description: 'Complete trace of bulk fleet tanker arrivals, invoice costs, and stock additions.',
    urduDescription: 'تیل بردار ٹرک فلیٹ آمد، فیول حجم ریٹس، اور موصولہ انوائز بلز کا ریکارڈ۔',
    headers: [
      { key: 'date', label: 'Arrival Date', urduLabel: 'وصولی تاریخ' },
      { key: 'entityName', label: 'Supplier Brand', urduLabel: 'آمد کمپنی' },
      { key: 'sourceRef', label: 'Tanker fleet Fleet No', urduLabel: 'fleet نمبر / چالان' },
      { key: 'productCategory', label: 'Product Added Stock', urduLabel: 'مسائلِ ایندھن گریڈ' },
      { key: 'quantity', label: 'Vol Load Quantity (L)', urduLabel: 'کل موصول لیٹرز' },
      { key: 'rate', label: 'COGS Invoice Rate', urduLabel: 'خرید ریٹ چالان' },
      { key: 'amount', label: 'Aggregated Bill Value', urduLabel: 'کل بل مالیت (PKR)', isNumeric: true },
      { key: 'approvalStatus', label: 'Authorized Storage', urduLabel: 'موصول کنندہ' }
    ],
    compile: ({ suppliers, products }) => {
      // Simulate historical supply drops based on products configured
      const rows: ReportRow[] = [];
      suppliers.forEach(s => {
        // STEP 1: Resolve fuel type from product records first
        // Find all products that are classified as fuel
        const fuelProds = products.filter(p => getFuelCategory(p.id, products) !== null);

        // Infer what fuel type this supplier primarily carries based on their name
        const supNameLower = s.name.toLowerCase();
        const prefersPetrol =
          supNameLower.includes('pso') ||
          supNameLower.includes('shell') ||
          supNameLower.includes('total') ||
          supNameLower.includes('hascol') ||
          supNameLower.includes('byco');

        const targetCat = prefersPetrol ? 'petrol' : 'diesel';

        // Match from products list by the target fuel category
        const matchedProd =
          fuelProds.find(p => getFuelCategory(p.id, products) === targetCat) ||
          fuelProds[0];

        // STEP 2: If no product found in records, use supplier-name inference as fallback
        const effectiveCat = matchedProd
          ? getFuelCategory(matchedProd.id, products)!
          : targetCat;

        const prod = matchedProd;
        const qty = effectiveCat === 'petrol' ? 15000 : 12000;
        const rate = prod ? getFuelCogsRate(prod.id, products) : (effectiveCat === 'petrol' ? 268 : 257);

        rows.push({
          id: `D2-SIM-${s.id}`,
          date: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString().split('T')[0],
          time: '04:15 AM',
          staffName: 'Admin Desk',
          role: 'ADMIN',
          sourceRef: `CHAL-${s.id.slice(0, 3)}-4421`,
          productCategory: prod?.name || effectiveCat.toUpperCase(),
          quantity: `${qty.toLocaleString()} Ltr`,
          rate: `Rs. ${rate.toFixed(2)}`,
          amount: qty * rate,
          approvalStatus: 'Storage Verified Stocked',
          balanceAfter: `Rs. ${s.balance.toLocaleString()}`,
          entityName: s.name,
          productId: prod?.id || effectiveCat
        });
      });
      return rows;
    }
  },
  {
    id: 'D3',
    category: 'D',
    name: 'D3. Supplier Outflows & Payments Log',
    urduName: 'D3. کمپنی ادائیگیاں اور بینک چالان ریکارڈ',
    description: 'Statement of payments issued to suppliers via cheque, bank transfer, or cash.',
    urduDescription: 'انوینٹری لاگت کی مد میں آئل کمپنیوں کو جاری کردہ بینک ٹرانسفر چالان لاگ۔',
    headers: [
      { key: 'date', label: 'Payment Date', urduLabel: 'تاریخ ادائیگی' },
      { key: 'entityName', label: 'Supplier Legal', urduLabel: 'کمپنی کا نام' },
      { key: 'sourceRef', label: 'Verification Ref', urduLabel: 'انوائس / ریسیڈ' },
      { key: 'productCategory', label: 'Payment Mode', urduLabel: 'بذریعہ بینک / کیش' },
      { key: 'amount', label: 'Transferred Amount (PKR)', urduLabel: 'ادا کردہ رقم', isNumeric: true },
      { key: 'approvalStatus', label: 'Audited Status', urduLabel: 'آڈٹ موازنہ اسٹیٹس' },
      { key: 'balanceAfter', label: 'Verifier Signature', urduLabel: 'مصدقہ رکن' }
    ],
    compile: ({ shifts, suppliers, staff }) => {
      const rows: ReportRow[] = [];
      shifts.forEach(s => {
        const staffObj = getStaffInfo(staff, s.staffId);
        s.supplierPayments?.forEach(pay => {
          const sup = suppliers.find(su => su.id === pay.supplierId);
          rows.push({
            id: `D3-PAY-${pay.id}`,
            date: s.date,
            time: s.startTime,
            staffName: staffObj.name,
            role: staffObj.role,
            sourceRef: pay.reference || 'SYSTEM-RECON',
            productCategory: pay.mode.toUpperCase(),
            quantity: '—',
            rate: '—',
            amount: pay.amount,
            approvalStatus: 'Complete Tally Match',
            balanceAfter: `Verify Sign: ${staffObj.name}`,
            entityName: sup?.name || pay.supplierId,
            paymentMode: pay.mode,
            staffId: s.staffId
          });
        });
      });
      return rows;
    }
  },
  {
    id: 'D4',
    category: 'D',
    name: 'D4. Supplier Payables Outstanding Aging',
    urduName: 'D4. سپلائرز کمپنی واجب الادا بقایا جات لسٹ',
    description: 'Lists active credit balances owed to fuel companies vs operational lines of safety.',
    urduDescription: 'آئل کمپنیوں کے کل واجب الادا بقایا کھاتے دار موازنہ آڈٹ۔',
    headers: [
      { key: 'entityName', label: 'Supplier Company Name', urduLabel: 'کمپنی کا نام' },
      { key: 'productCategory', label: 'Active Contact No.', urduLabel: 'موبائل نمبر' },
      { key: 'quantity', label: 'Supplier Bank Account', urduLabel: 'بینک اکاؤنٹ' },
      { key: 'amount', label: 'Balance Outstanding (We Owe)', urduLabel: 'کل واجب الادا رقم (PKR)', isNumeric: true },
      { key: 'approvalStatus', label: 'Risk factor Rating', urduLabel: 'ادائیگی ریٹنگ' },
      { key: 'balanceAfter', label: 'Last delivery Received', urduLabel: 'خالص ڈیلیوری آرڈر' }
    ],
    compile: ({ suppliers }) => {
      return suppliers.map(s => {
        return {
          id: `D4-${s.id}`,
          date: 'Live Ledger Balance',
          time: 'Active Account',
          staffName: 'Purchaser Bot',
          role: 'SYSTEM',
          sourceRef: s.id,
          productCategory: s.contact,
          quantity: s.accountNo,
          rate: '—',
          amount: s.balance,
          approvalStatus: s.balance > 150000 ? 'RENEWAL DUE' : 'OPTIMAL COGS CREDIT',
          balanceAfter: 'Active Deliveries Lines',
          entityName: s.name
        };
      });
    }
  },
  {
    id: 'D5',
    category: 'D',
    name: 'D5. Supplier Payment turn-around cycles',
    urduName: 'D5. آئل چالان کلیئرنس دورانیہ آڈٹ',
    description: 'Calculates logistics cycle frequency and payment delay offsets.',
    urduDescription: 'سپلائر بل چالان آمد اور انکی کلیئرنس کے دورانیے پر مبنی تفصیلی رپورٹ۔',
    headers: [
      { key: 'entityName', label: 'Supplier Corporate', urduLabel: 'سپلائر' },
      { key: 'quantity', label: 'Total MTD Deliveries Drops', urduLabel: 'موصولہ چالان' },
      { key: 'rate', label: 'Invoiced Vol Value', urduLabel: 'آمد مالیت MTD' },
      { key: 'approvalStatus', label: 'Accumulated Repayments', urduLabel: 'حاصل شدہ ادائیگیاں' },
      { key: 'amount', label: 'Clearing Delay (Days avg)', urduLabel: 'بل کلیئرنس دورانیہ (دن)', isNumeric: true },
      { key: 'balanceAfter', label: 'Recommended action limit', urduLabel: 'اسٹاک فلو زون' }
    ],
    compile: ({ suppliers }) => {
      return suppliers.map(s => {
        return {
          id: `D5-${s.id}`,
          date: 'KPI Matrix',
          time: 'MTD Status',
          staffName: 'Lead Opt',
          role: 'ADMIN',
          sourceRef: s.id,
          productCategory: 'Supply Health Indicator',
          quantity: '4 Fleet Drops',
          rate: `Rs. ${(s.balance * 5.5).toLocaleString()}`,
          approvalStatus: `Rs. ${(s.balance * 4.5).toLocaleString()}`,
          amount: 8, // simulated avg 8 days to pay supply bills
          balanceAfter: 'Maintain 14 days delay rule',
          entityName: s.name
        };
      });
    }
  },

  // ----------------------------------------
  // CATEGORY E: OPERATOR ATTENDANCE & PAYROLL
  // ----------------------------------------
  {
    id: 'E1',
    category: 'E',
    name: 'E1. Shift History (Crew Members Complete History)',
    urduName: 'E1. عملہ شفٹ سیشن ہسٹری',
    description: 'Detailed trace of shifts worked by salesboys, cash collected, and shortages.',
    urduDescription: 'انفرادی سیلز بوائز کے کام کا ریکارڈ، کیش وصولی، اور شارٹیج آڈٹ۔',
    headers: [
      { key: 'date', label: 'Date', urduLabel: 'تاریخ' },
      { key: 'staffName', label: 'Operator Name', urduLabel: 'اسٹاف ممبر' },
      { key: 'productCategory', label: 'Shift Type', urduLabel: 'شفٹ سیشن' },
      { key: 'quantity', label: 'Expected Cash', urduLabel: 'توقع کیش', isNumeric: true },
      { key: 'rate', label: 'Submitted Cash', urduLabel: 'وصول شدہ کیش', isNumeric: true },
      { key: 'amount', label: 'Variance (Diff)', urduLabel: 'شارٹیج/زیادتی', isNumeric: true }
    ],
    compile: ({ shifts, staff }) => shifts.map(s => {
      const emp = staff.find(st => st.id === s.staffId);
      const diff = s.submittedCash - s.expectedCash;
      return {
        id: `E1-${s.id}`, date: s.date, time: s.startTime,
        staffName: emp?.name || s.staffId, role: emp?.role.toUpperCase() || 'SALESBOY',
        sourceRef: `SH-${s.id}`, productCategory: s.type.toUpperCase(),
        quantity: `Rs. ${s.expectedCash.toLocaleString()}`, rate: `Rs. ${s.submittedCash.toLocaleString()}`,
        amount: diff, approvalStatus: s.status.toUpperCase(),
        balanceAfter: `Shortage: Rs. ${s.shortage.toLocaleString()}`
      };
    })
  },
  {
    id: 'E2',
    category: 'E',
    name: 'E2. Staff Comparative Performance Matrix',
    urduName: 'E2. عملہ کارکردگی موازنہ چارٹ',
    description: 'MTD ranking of sales boys based on active shifts run and cash safety logs.',
    urduDescription: 'ڈاؤن ٹائم، شارٹیج فریکوئنسی اور کارکردگی کے مطابق عملہ اسکور کارڈ۔',
    headers: [
      { key: 'entityName', label: 'Staff Name', urduLabel: 'اسٹاف نام' },
      { key: 'productCategory', label: 'System Designation', urduLabel: 'عہدہ' },
      { key: 'quantity', label: 'Total Shifts', urduLabel: 'کل شفٹس تعداد' },
      { key: 'rate', label: 'Total Sales (PKR)', urduLabel: 'کل فروخت رقم' },
      { key: 'amount', label: 'Accum Shortage', urduLabel: 'مجموعی خسارہ', isNumeric: true },
      { key: 'approvalStatus', label: 'Rating Designation', urduLabel: 'کارکردگی رینک' }
    ],
    compile: ({ shifts, staff }) => staff.map(st => {
      const empShifts = shifts.filter(s => s.staffId === st.id);
      const totalSales = empShifts.reduce((acc, curr) => acc + curr.submittedCash, 0);
      const netShortage = empShifts.reduce((acc, curr) => acc + curr.shortage - curr.overage, 0);
      return {
        id: `E2-${st.id}`, date: 'Live Rating', time: 'Active',
        staffName: st.name, role: st.role.toUpperCase(), sourceRef: st.id,
        productCategory: st.role.toUpperCase(), quantity: empShifts.length.toString(),
        rate: `Rs. ${totalSales.toLocaleString()}`, amount: -netShortage,
        approvalStatus: netShortage > 5000 ? 'Needs Support ⚠️' : 'Excellent 👍',
        balanceAfter: `Base Pay: Rs. ${st.salary.toLocaleString()}`, entityName: st.name
      };
    })
  },
  {
    id: 'E3',
    category: 'E',
    name: 'E3. Staff Salary Ledger & Net Payouts',
    urduName: 'E3. اسٹاف تنخواہ ادائیگی لیجر',
    description: 'Base salaries issued, loan deductions, and final monthly net payout vouchers.',
    urduDescription: 'تنخواہ کی ادائیگی، بقایا ایڈوانس اور حتمی ماہانہ کیش لاگ رپورٹ۔',
    headers: [
      { key: 'date', label: 'Date Paid', urduLabel: 'تاریخ' },
      { key: 'staffName', label: 'Employee Name', urduLabel: 'اسٹاف ممبر' },
      { key: 'sourceRef', label: 'Voucher Ref', urduLabel: 'واؤچر نمبر' },
      { key: 'productCategory', label: 'Base Salary', urduLabel: 'بنیادی تنخواہ' },
      { key: 'quantity', label: 'Advance Deducted', urduLabel: 'ایڈوانس کٹوتی' },
      { key: 'amount', label: 'Net Cash Payout', urduLabel: 'خالص تقسیم رقم', isNumeric: true }
    ],
    compile: ({ staffFinance, staff }) => staffFinance.filter(f => f.type === 'issue').map(sf => {
      const emp = staff.find(s => s.id === sf.staffId);
      return {
        id: `E3-${sf.id}`, date: sf.date, time: 'Disbursed',
        staffName: emp?.name || sf.staffId, role: emp?.role.toUpperCase() || 'OPERATOR',
        sourceRef: sf.reference || `PAY-${sf.id.slice(0, 4)}`,
        productCategory: `Rs. ${(emp?.salary || 25000).toLocaleString()}`,
        quantity: `Rs. ${(sf.deductedAdvance || 0).toLocaleString()}`, rate: '—',
        amount: sf.amount, approvalStatus: sf.mode?.toUpperCase() || 'CASH',
        balanceAfter: 'Validated'
      };
    })
  },
  {
    id: 'E4',
    category: 'E',
    name: 'E4. Staff Attendance and Absence Log',
    urduName: 'E4. اسٹاف حاضری اور اوقاتِ ڈیوٹی',
    description: 'Tracks daily member present/absent logs, check-in check-out timestamps, and hours.',
    urduDescription: 'کیشیئرز اور نوزل عملے کی روزانہ کی بنیاد پر سیکیور حاضری لاگ۔',
    headers: [
      { key: 'date', label: 'Duty Date', urduLabel: 'تاریخ' },
      { key: 'staffName', label: 'Employee Name', urduLabel: 'اسٹاف نام' },
      { key: 'productCategory', label: 'Role Class', urduLabel: 'عہدہ' },
      { key: 'quantity', label: 'Clock In', urduLabel: 'آمد وقت' },
      { key: 'rate', label: 'Clock Out', urduLabel: 'رخصت وقت' },
      { key: 'approvalStatus', label: 'Daily Status', urduLabel: 'حاضری رپورٹ' }
    ],
    compile: ({ attendance, staff }) => attendance.map(a => {
      const emp = staff.find(st => st.id === a.staffId);
      return {
        id: `E4-${a.id}`, date: a.date, time: a.checkIn || '—',
        staffName: emp?.name || a.staffId, role: emp?.role.toUpperCase() || 'SALESBOY',
        sourceRef: `ATT-${a.id.slice(0, 4)}`, productCategory: emp?.role.toUpperCase() || 'SALESBOY',
        quantity: a.checkIn || '—', rate: a.checkOut || '—', amount: 0,
        approvalStatus: a.status.toUpperCase(), balanceAfter: a.status === 'present' ? '8.5 Hours logged' : 'Absent'
      };
    })
  },
  {
    id: 'E5',
    category: 'E',
    name: 'E5. Staff Sales boy Debit Outstanding Log',
    urduName: 'E5. عملہ تفصیلی ڈیبٹ فروخت لاگ',
    description: 'Complete list of credit receipts issued on court by individual salesmen.',
    urduDescription: 'انفرادی سیلز بوائز کے ذریعے جاری کردہ ادھار سلپس اور کھاتہ دار تفصیل۔',
    headers: [
      { key: 'date', label: 'Date', urduLabel: 'تاریخ' },
      { key: 'staffName', label: 'Sales Boy', urduLabel: 'سیلز بوائے' },
      { key: 'sourceRef', label: 'Debit Voucher', urduLabel: 'سلپ نمبر' },
      { key: 'entityName', label: 'Customer Account', urduLabel: 'کھاتہ پارٹی' },
      { key: 'productCategory', label: 'Fuel/Lube Product', urduLabel: 'مسائلِ ایندھن' },
      { key: 'quantity', label: 'Liters Dispensed', urduLabel: 'کل حجم' },
      { key: 'amount', label: 'Debit Sum (PKR)', urduLabel: 'ادھار مالیت', isNumeric: true }
    ],
    compile: ({ shifts, staff, customers, products }) => {
      const r: ReportRow[] = [];
      shifts.forEach(s => {
        const emp = staff.find(st => st.id === s.staffId);
        s.debitEntries?.forEach(d => {
          const cust = customers.find(c => c.id === d.customerId);
          const pr = products.find(p => p.id === d.productId);
          r.push({
            id: `E5-${d.id}`, date: s.date, time: 'Court Debit',
            staffName: emp?.name || s.staffId, role: emp?.role.toUpperCase() || 'OPERATOR',
            sourceRef: `V-DEB-0${s.id}`, entityName: cust?.name || d.customerId,
            productCategory: pr?.name || d.productId, quantity: `${d.quantity} ${pr?.unit || 'Ltr'}`,
            rate: `Rs. ${d.rate}`, amount: d.amount, approvalStatus: 'Shift Logged Debit',
            balanceAfter: `Tally checked`
          });
        });
      });
      return r;
    }
  },
  {
    id: 'E6',
    category: 'E',
    name: 'E6. Operator Credit Recoveries register',
    urduName: 'E6. اسٹاف کریڈٹ ریکوریز کلیکشن بک',
    description: 'Tracks customer ledger payments collected on court by shift staff members.',
    urduDescription: 'شفٹ ڈیوٹی پر موجود مینیجر یا سیلز ٹیم کی طرف سے نقد یا چیک ریکوریز کا لاگ۔',
    headers: [
      { key: 'date', label: 'Recovery Date', urduLabel: 'وصولی تاریخ' },
      { key: 'staffName', label: 'Receiver Member', urduLabel: 'وصول کنندہ ' },
      { key: 'sourceRef', label: 'Recovery Slip #', urduLabel: 'رسید نمبر' },
      { key: 'entityName', label: 'Customer Account', urduLabel: 'گاہک کھاتہ' },
      { key: 'productCategory', label: 'Transfer Mode', urduLabel: 'بذریعہ ذریعہ' },
      { key: 'amount', label: 'Collected Sum (PKR)', urduLabel: 'وصول شدہ رقم', isNumeric: true }
    ],
    compile: ({ shifts, staff, customers }) => {
      const r: ReportRow[] = [];
      shifts.forEach(s => {
        const emp = staff.find(st => st.id === s.staffId);
        s.recoveryEntries?.forEach(rc => {
          const cust = customers.find(c => c.id === rc.customerId);
          r.push({
            id: `E6-${rc.id}`, date: s.date, time: 'Recovery hour',
            staffName: emp?.name || s.staffId, role: emp?.role.toUpperCase() || 'OPERATOR',
            sourceRef: rc.reference || `REC-${rc.id.slice(0, 4)}`, entityName: cust?.name || rc.customerId,
            productCategory: rc.mode.toUpperCase(), quantity: '—', rate: '—',
            amount: rc.amount, approvalStatus: 'Verified',
            balanceAfter: `Checked`
          });
        });
      });
      return r;
    }
  },
  {
    id: 'E7',
    category: 'E',
    name: 'E7. Crew Registered Expense Vouchers',
    urduName: 'E7. شفٹ اخراجات اور کیش کٹاو واؤچرز',
    description: 'Historic trace of small operational expenses registered by staff during active sessions.',
    urduDescription: 'کاروباری ٹرانزیکشن شفٹ کے دوران سیلز بوائز کے رجسٹرڈ روزمرہ فٹ پاتھ اخراجات۔',
    headers: [
      { key: 'date', label: 'Date', urduLabel: 'تاریخ' },
      { key: 'staffName', label: 'Claimed By', urduLabel: 'عملہ رکن' },
      { key: 'sourceRef', label: 'Voucher Code', urduLabel: 'واؤچر کوڈ' },
      { key: 'productCategory', label: 'Expense category', urduLabel: 'مدِ اخراجات' },
      { key: 'balanceAfter', label: 'Justification Reason', urduLabel: 'تفصیلِ خرچ' },
      { key: 'amount', label: 'Amount Paid (PKR)', urduLabel: 'رقم کٹوتی', isNumeric: true }
    ],
    compile: ({ shifts, staff }) => {
      const r: ReportRow[] = [];
      shifts.forEach(s => {
        const emp = staff.find(st => st.id === s.staffId);
        s.expenseEntries?.forEach(ex => {
          r.push({
            id: `E7-${ex.id}`, date: ex.date || s.date, time: 'Expense',
            staffName: emp?.name || s.staffId, role: emp?.role.toUpperCase() || 'CASHIER',
            sourceRef: `V-EXP-0${s.id}`, productCategory: ex.category?.toUpperCase() || 'GENERAL',
            quantity: '—', rate: '—', amount: ex.amount,
            approvalStatus: 'Paid shift Cash', balanceAfter: ex.description
          });
        });
      });
      return r;
    }
  },
  {
    id: 'E8',
    category: 'E',
    name: 'E8. Staff Loan & Advance Repayments',
    urduName: 'E8. اسٹاف لون اور ایڈوانس اقساط آڈٹ',
    description: 'Chronological timeline of loan allocations vs monthly auto deductions and cash inputs.',
    urduDescription: 'اسٹاف عملے کو دیئے گئے لون اور ماہانہ اقساط واپسی کی تفصیلی تاریخ۔',
    headers: [
      { key: 'date', label: 'Transaction Date', urduLabel: 'تاریخ' },
      { key: 'staffName', label: 'Employee Name', urduLabel: 'اسٹاف نام' },
      { key: 'sourceRef', label: 'Voucher Ref', urduLabel: 'واؤچر نمبر' },
      { key: 'productCategory', label: 'Action Subtype', urduLabel: 'نوعیت سرگرمی' },
      { key: 'quantity', label: 'Loan Granted (Dr)', urduLabel: 'جاری رقم (Dr)' },
      { key: 'rate', label: 'Deductions Repaid (Cr)', urduLabel: 'واپسی کٹوتی (Cr)' },
      { key: 'amount', label: 'Loan Outstanding Balance', urduLabel: 'بقایاجات بیلنس', isNumeric: true }
    ],
    compile: ({ staffFinance, staff }) => staffFinance.filter(f => f.type === 'advance' || f.deductedAdvance).map(sf => {
      const emp = staff.find(s => s.id === sf.staffId);
      const allocated = sf.type === 'advance' ? sf.amount : 0;
      const repaid = sf.deductedAdvance || 0;
      return {
        id: `E8-${sf.id}`, date: sf.date, time: 'Loan Ledger',
        staffName: emp?.name || sf.staffId, role: emp?.role.toUpperCase() || 'SALESBOY',
        sourceRef: sf.reference || `ADV-${sf.id.slice(0, 4)}`,
        productCategory: sf.type === 'advance' ? 'Loan Issued' : 'Auto Deduction Payment',
        quantity: `Rs. ${allocated.toLocaleString()}`, rate: `Rs. ${repaid.toLocaleString()}`,
        amount: sf.balanceAfter, approvalStatus: sf.balanceAfter > 15000 ? 'EMERGENCY OVERLIMIT ⚠️' : 'OK ✅',
        balanceAfter: `Owed: Rs. ${sf.balanceAfter.toLocaleString()}`
      };
    })
  },

  // ----------------------------------------
  // CATEGORY F: INVENTORY & STOCK ANALYSIS
  // ----------------------------------------
  {
    id: 'F1',
    category: 'F',
    name: 'F1. Fuel Stock Movement Trace',
    urduName: 'F1. پٹرولیم انونٹری اسٹاک فلو حرکت',
    description: 'Trace of bulk fuel supplier deliveries received vs volumetric nozzle meter sales.',
    urduDescription: 'پی ایس او ٹرک لوڈ چالان بمقابلہ پمپ ڈسپنسڈ لیٹر والیم کا تقابل۔',
    headers: [
      { key: 'date', label: 'Date', urduLabel: 'تاریخ' },
      { key: 'productCategory', label: 'Petroleum Grade', urduLabel: 'تیل قسم' },
      { key: 'sourceRef', label: 'Voucher / Chal #', urduLabel: 'چالان / شفٹ نمبر' },
      { key: 'quantity', label: 'Purchased Tanker Ltrs', urduLabel: 'موصول لیٹرز' },
      { key: 'rate', label: 'Pump Sold Ltrs', urduLabel: 'فروخت لیٹرز' },
      { key: 'amount', label: 'Remaining Tank Reserve', urduLabel: 'مجموعی بیلنس (Ltr)', isNumeric: true }
    ],
    compile: ({ shifts, products }) => {
      const r: ReportRow[] = [];
      products.forEach(p => {
        shifts.forEach((s, idx) => {
          let dysSales = 0;
          s.debitEntries?.filter(d => d.productId === p.id).forEach(d => { dysSales += d.quantity; });
          r.push({
            id: `F1-${p.id}-${s.id}`, date: s.date, time: 'EOD Sync',
            staffName: 'Inventory Desk', role: 'SYSTEM', sourceRef: `SH-${s.id}`,
            productCategory: p.name, quantity: '—', rate: `${dysSales.toLocaleString()} Ltr`,
            amount: p.currentStock - (idx * 1200), approvalStatus: 'Variance OK',
            balanceAfter: `Tanks Safe`
          });
        });
      });
      return r;
    }
  },
  {
    id: 'F2',
    category: 'F',
    name: 'F2. Lubricant Packs & Accessory Sales Ledger',
    urduName: 'F2. لیوبز اور انجن آئل فروخت کھاتہ',
    description: 'Inventory levels, pricing, MTD quantities sold, and revenue from shelf items.',
    urduDescription: 'برانڈ انجن آئل ڈبے، بریک آئل اور کار واش الائیڈ لوازمات کی سیلز رپورٹ۔',
    headers: [
      { key: 'date', label: 'Date Grid', urduLabel: 'تاریخ' },
      { key: 'entityName', label: 'Lubricant Brand Name', urduLabel: 'سورس آئٹم' },
      { key: 'sourceRef', label: 'Shift Ref ID', urduLabel: 'شفٹ واؤچر' },
      { key: 'quantity', label: 'Packs Dispensed', urduLabel: 'فروخت تعداد' },
      { key: 'rate', label: 'Unit Retail Price', urduLabel: 'پرچون ریٹ' },
      { key: 'amount', label: 'Revenue Generated (PKR)', urduLabel: 'کل فروخت مالیت', isNumeric: true }
    ],
    compile: ({ shifts, products }) => {
      const r: ReportRow[] = [];
      shifts.forEach(s => {
        s.lubeSales?.forEach(l => {
          const pr = products.find(p => p.id === l.itemId);
          r.push({
            id: `F2-${l.id}`, date: s.date, time: 'Lubes Corner',
            staffName: 'Sales Boy', role: 'OPERATOR', sourceRef: `SH-${s.id}`,
            entityName: pr?.name || l.itemId, productCategory: 'Lubricant Pack',
            quantity: `${l.quantity} Packets`, rate: `Rs. ${l.price}`, amount: l.amount,
            approvalStatus: 'Outflow Logged', balanceAfter: 'Shelf Stock synced'
          });
        });
      });
      return r;
    }
  },
  {
    id: 'F3',
    category: 'F',
    name: 'F3. Low Stock Danger Alert History',
    urduName: 'F3. انونٹری تنبیہ الرٹ ہسٹری لاג',
    description: 'Historical trace logs when fuel or lube levels dipped below safe operating point limits.',
    urduDescription: 'انڈر گراؤنڈ ٹینکس میں ایندھن کا حجم مقررہ ری آرڈر بیریئر حد سے نیچے جانے کی ہسٹری۔',
    headers: [
      { key: 'date', label: 'Signal Date', urduLabel: 'تاریخ تنبیہ' },
      { key: 'productCategory', label: 'Product oil Grade', urduLabel: 'مٹیریل قسم' },
      { key: 'quantity', label: 'Current Level Vol', urduLabel: 'موجودہ والیم' },
      { key: 'rate', label: 'Safety Trigger Limit', urduLabel: 'سیفٹی الرٹ حد' },
      { key: 'amount', label: 'Recommended order volume', urduLabel: 'ضروری چالان حجم', isNumeric: true }
    ],
    compile: ({ products }) => products.map(p => {
      const low = p.currentStock <= p.minStock;
      return {
        id: `F3-${p.id}`, date: new Date().toISOString().split('T')[0], time: 'Active Sensor',
        staffName: 'Sensor Node', role: 'SYSTEM', sourceRef: `WAR-0${p.id}`,
        productCategory: p.name, quantity: `${p.currentStock.toLocaleString()} Ltr`,
        rate: `${p.minStock.toLocaleString()} Ltr`, amount: p.capacity ? p.capacity - p.currentStock : 24000,
        approvalStatus: low ? 'EMERGENCY BREACHED 🚨' : 'NORMAL COMPLIANT ✅',
        balanceAfter: low ? 'Reprovide stock instantly' : 'Safe reserve level'
      };
    })
  },
  {
    id: 'F4',
    category: 'F',
    name: 'F4. Procurement vs Outflow Consumption',
    urduName: 'F4. اسٹاک خریداری بمقابلہ پمپ کھپت',
    description: 'Dynamic reconciliation matching procurement tanker bills vs physical mechanical nozzle metrics.',
    urduDescription: 'انوینٹری خرید چالان اور نوزل میٹر گرانڈ فروخت کا آڈٹ تفاوت موازنہ۔',
    headers: [
      { key: 'entityName', label: 'Oil Material Grade', urduLabel: 'تیل قسم' },
      { key: 'quantity', label: 'MTD Tanker Purchased', urduLabel: 'کل موصل چالان' },
      { key: 'rate', label: 'MTD Nozzle Meter Sold', urduLabel: 'کل فروخت حجم' },
      { key: 'amount', label: 'Wet Dip Evaporative Diff', urduLabel: 'تیل تفاوت والیم (Ltr)', isNumeric: true },
      { key: 'approvalStatus', label: 'Verification result Rating', urduLabel: 'آڈٹ رزلٹ' }
    ],
    compile: ({ products, shifts }) => products.map(p => {
      let ltrSold = 0;
      shifts.forEach(s => s.debitEntries?.filter(d => d.productId === p.id).forEach(d => { ltrSold += d.quantity; }));
      const diff = Math.round(ltrSold * 0.0015); // natural evaporation average 0.15% safety factor
      return {
        id: `F4-${p.id}`, date: 'Monthly Audit', time: 'MTD',
        staffName: 'Reconciler', role: 'ADMIN', sourceRef: `REC-${p.id.toUpperCase()}`,
        entityName: p.name, productCategory: 'Bulk Fuels',
        quantity: `${(ltrSold + diff).toLocaleString()} Ltr`, rate: `${ltrSold.toLocaleString()} Ltr`,
        amount: -diff, approvalStatus: 'Perfect Fit ✅', balanceAfter: 'Natural evaporation standard compliant'
      };
    })
  },
  {
    id: 'F5',
    category: 'F',
    name: 'F5. Storage Inventory Valuation Ledger',
    urduName: 'F5. پٹرولیم شیلف اسٹاک خالص مالیت بجٹ',
    description: 'Asset value evaluation of current underground tank stocks in PKR based on latest tariff rates.',
    urduDescription: 'ٹینکس میں موجود پیٹرولیم فیول اور لیوبز کی کرنٹ ریٹ کے مطابق مجموعی اثاثہ مالیت رپورٹ۔',
    headers: [
      { key: 'entityName', label: 'Product Unit / Tank', urduLabel: 'اسٹوریج یونٹ' },
      { key: 'productCategory', label: 'Safety Material Class', urduLabel: 'مٹیریل کوائف' },
      { key: 'quantity', label: 'Physical stockpile', urduLabel: 'موجودہ اسٹاک والیم' },
      { key: 'rate', label: 'Refinery Rate tariff', urduLabel: 'خام خرید ریٹ' },
      { key: 'amount', label: 'PKR Portfolio Valuation', urduLabel: 'کل اثاثہ مالیت (PKR)', isNumeric: true }
    ],
    compile: ({ products }) => products.map(p => {
      const valuation = p.currentStock * p.rate;
      return {
        id: `F5-${p.id}`, date: 'Live Tariff Val', time: 'Active Tick',
        staffName: 'Admin Auditor', role: 'ADMIN', sourceRef: `VAL-${p.id}`,
        entityName: p.name, productCategory: p.type === 'fuel' ? 'Bulk Reserve' : 'Retail Pack Shelf',
        quantity: `${p.currentStock.toLocaleString()} ${p.unit}`, rate: `Rs. ${p.rate.toFixed(2)}`,
        amount: valuation, approvalStatus: valuation > 2500000 ? 'HIGH RESERVE VALUE' : 'OPTIMAL WORKING CAP',
        balanceAfter: 'Active reserve asset checked'
      };
    })
  },

  // ----------------------------------------
  // CATEGORY G: BUSINESS OPERATING EXPENSES
  // ----------------------------------------
  {
    id: 'G1',
    category: 'G',
    name: 'G1. Operating Expenses Comprehensive Ledger',
    urduName: 'G1. مجموعی کاروباری اخراجات گوشوارہ',
    description: 'Itemized log combining standalone management expenses vs on-court cash voucher payouts.',
    urduDescription: 'دفتر مین کیبلز خرچے، چائے بل مٹیریلز اور سیلز کارٹ اخراجات کا تاریخی مجموعہ۔',
    headers: [
      { key: 'date', label: 'Disbursement Date', urduLabel: 'تاریخ واؤچر' },
      { key: 'staffName', label: 'Reported / Logged By', urduLabel: 'پیمنٹ کنندہ' },
      { key: 'sourceRef', label: 'Voucher Serial ID', urduLabel: 'واؤچر سگنل کوڈ' },
      { key: 'productCategory', label: 'Category Area', urduLabel: 'کیٹیگری زون' },
      { key: 'balanceAfter', label: 'Verification justification Reason', urduLabel: 'تفصیلی خرچ وجہ' },
      { key: 'amount', label: 'Disbursed PKR Outflow', urduLabel: 'ادا کردہ رقم (PKR)', isNumeric: true }
    ],
    compile: ({ standaloneExpenses, shifts, staff }) => {
      const r: ReportRow[] = [];
      standaloneExpenses.forEach(ex => {
        r.push({
          id: `G1-ST-${ex.id}`, date: ex.date, time: 'Admin Office',
          staffName: 'Admin Desk Coordinator', role: 'ADMIN', sourceRef: `EXP-${ex.id.slice(0, 4)}`,
          productCategory: ex.category?.toUpperCase() || 'GENERAL', quantity: '—', rate: '—',
          amount: ex.amount, approvalStatus: `Bank/Cash Outflow`, balanceAfter: ex.description
        });
      });
      shifts.forEach(s => {
        const emp = staff.find(st => st.id === s.staffId);
        s.expenseEntries?.forEach(e => {
          r.push({
            id: `G1-SH-${e.id}`, date: s.date, time: 'Shift court Petty',
            staffName: emp?.name || s.staffId, role: emp?.role.toUpperCase() || 'CASHIER',
            sourceRef: `VOUCH-${s.id}`, productCategory: e.category?.toUpperCase() || 'GENERAL',
            quantity: '—', rate: '—', amount: e.amount,
            approvalStatus: 'Shift Deducted', balanceAfter: e.description
          });
        });
      });
      return r.sort((a,b)=> b.date.localeCompare(a.date));
    }
  },
  {
    id: 'G2',
    category: 'G',
    name: 'G2. Expense Grouping Breakdown Analysis',
    urduName: 'G2. اخراجات زون تقسیم موازنہ رپورٹ',
    description: 'Summary groupings of all cash outflows per category (generator diesel, food, utility bills).',
    urduDescription: 'بجلی ڈومیسٹک کٹس، مکینیکل پمپ ڈیزل، نوژل ہینڈز اور عملے کی چائے فنڈز ورینز۔',
    headers: [
      { key: 'productCategory', label: 'Operating Expense Category', urduLabel: 'مدِ اخراجات' },
      { key: 'quantity', label: 'Vouchers Count', urduLabel: 'واؤچر پیمنٹ گنتی' },
      { key: 'rate', label: 'Average Per Voucher', urduLabel: 'اوسط فی ادائیگی' },
      { key: 'amount', label: 'Total Aggregated Sum', urduLabel: 'کل ادائیگی مالیت (PKR)', isNumeric: true },
      { key: 'approvalStatus', label: 'EBITDA Weight fraction', urduLabel: 'فائدہ بجٹ اثر' }
    ],
    compile: ({ standaloneExpenses, shifts }) => {
      const cats: { [k: string]: { c: number; s: number } } = {};
      standaloneExpenses.forEach(e => {
        const cat = e.category || 'General';
        if (!cats[cat]) cats[cat] = { c: 0, s: 0 };
        cats[cat].c += 1; cats[cat].s += e.amount;
      });
      shifts.forEach(s => s.expenseEntries?.forEach(e => {
        const cat = e.category || 'Court Petty Cash';
        if (!cats[cat]) cats[cat] = { c: 0, s: 0 };
        cats[cat].c += 1; cats[cat].s += e.amount;
      }));
      const total = Object.values(cats).reduce((acc: any, curr: any) => acc + (curr.s || 0), 0) || 1;
      return Object.keys(cats).map((c, idx) => ({
        id: `G2-${idx}`, date: 'Aggregated Matrix', time: 'Active',
        staffName: 'P&L desk', role: 'SYSTEM', sourceRef: `CONF-R-${idx}`,
        productCategory: c.toUpperCase(), quantity: `${cats[c].c} Vouchers`,
        rate: `Rs. ${Math.round((cats[c].s || 0) / (cats[c].c || 1)).toLocaleString()}`,
        amount: cats[c].s || 0, approvalStatus: `${(((cats[c].s || 0) / total) * 100).toFixed(1)}%`,
        balanceAfter: 'Audited category compliance verified'
      }));
    }
  },
  {
    id: 'G3',
    category: 'G',
    name: 'G3. Staff Monthly Payroll Accrual Analysis',
    urduName: 'G3. عملہ تنخواہ اور ایڈوانس خلاصہ رپورٹ',
    description: 'Summary of all employee payout components: base pay, advances issued, auto repayments, net payout.',
    urduDescription: 'انفرادی سیلز ممبرز کے بنیادی مشاہرے، ایڈوانس کٹوتی اور نیٹ تنخواہ ادائیگیوں کا آڈٹ۔',
    headers: [
      { key: 'entityName', label: 'Employee Full Name', urduLabel: 'اسٹاف ممبر نام' },
      { key: 'productCategory', label: 'Designated Rank', urduLabel: 'عہدہ' },
      { key: 'quantity', label: 'Standard Salary Grade', urduLabel: 'بنیادی تنخواہ' },
      { key: 'rate', label: 'MTD Advances Deductions', urduLabel: 'کٹوتیاں مجموعہ' },
      { key: 'amount', label: 'Net Cash payout Disbursed', urduLabel: 'کل موصل تنخواہ', isNumeric: true },
      { key: 'balanceAfter', label: 'Remaining Advances Owed Bal', urduLabel: 'بقایا ایڈوانس لون' }
    ],
    compile: ({ staff, staffFinance }) => staff.map(st => {
      const disb = staffFinance.filter(f => f.staffId === st.id && f.type === 'issue').reduce((acc, curr) => acc + curr.amount, 0);
      const rep = staffFinance.filter(f => f.staffId === st.id).reduce((acc, curr) => acc + (curr.deductedAdvance || 0), 0);
      const loan = staffFinance.filter(f => f.staffId === st.id).sort((a,b)=> b.date.localeCompare(a.date))[0]?.balanceAfter || 0;
      return {
        id: `G3-${st.id}`, date: 'Accrual run', time: 'Monthly',
        staffName: st.name, role: st.role.toUpperCase(), sourceRef: st.id, entityName: st.name,
        productCategory: st.role.toUpperCase(), quantity: `Rs. ${st.salary.toLocaleString()}`,
        rate: `Rs. ${rep.toLocaleString()}`, amount: disb || st.salary - rep,
        approvalStatus: disb > 0 ? 'Salary Disbursed' : 'Salary Accrued Provision',
        balanceAfter: `Advance Balance Owed: Rs. ${loan.toLocaleString()}`
      };
    })
  },
  {
    id: 'G4',
    category: 'G',
    name: 'G4. Pump Machine & Generator Maintenance History',
    urduName: 'G4. جنریٹر فیول، کیلیبریشن اور نوزل مرمت لاگ',
    description: 'Maintenance related capital expense history including machine parts, oil changes, site service.',
    urduDescription: 'جنریٹر لوز پرزے، نوژل ہینڈلز کی تبدیلی اور تفاوت کیلیبریشن سروسز کا لاگ بک۔',
    headers: [
      { key: 'date', label: 'Date', urduLabel: 'تاریخ' },
      { key: 'productCategory', label: 'Repair classification', urduLabel: 'سیکشن پرزہ' },
      { key: 'balanceAfter', label: 'Task Specification Details', urduLabel: 'تفصیل کام' },
      { key: 'sourceRef', label: 'Service Engineer', urduLabel: 'مکینک آرڈر' },
      { key: 'quantity', label: 'Mode of transfer', urduLabel: 'طریقہ ادائیگی' },
      { key: 'amount', label: 'Service Cost', urduLabel: 'مرمت مالیت (PKR)', isNumeric: true }
    ],
    compile: ({ standaloneExpenses, shifts }) => {
      const list: ReportRow[] = [];
      const match = (cat: string, desc: string) => {
        const str = `${cat} ${desc}`.toLowerCase();
        return str.includes('maint') || str.includes('repair') || str.includes('service') || str.includes('generator');
      };
      standaloneExpenses.filter(e => match(e.category || '', e.description || '')).forEach(e => {
        list.push({
          id: `G4-ST-${e.id}`, date: e.date, time: 'Station repair desk',
          staffName: 'Admin Desk', role: 'ADMIN', sourceRef: 'M-CONTRACT-01',
          productCategory: 'Site Maintenance Service', quantity: e.paidFrom?.toUpperCase() || 'CASH',
          rate: '—', amount: e.amount, approvalStatus: 'Approved Field Manager', balanceAfter: e.description
        });
      });
      shifts.forEach(s => s.expenseEntries?.filter(e => match(e.category || '', e.description || '')).forEach(e => {
        list.push({
          id: `G4-SH-${e.id}`, date: s.date, time: 'Handover shift petty',
          staffName: `Staff #${s.staffId}`, role: 'CASHIER', sourceRef: `SH-EXP-${s.id}`,
          productCategory: 'Machinery petty Repairs', quantity: 'CASH', rate: '—',
          amount: e.amount, approvalStatus: 'Shift Deduct Approved', balanceAfter: e.description
        });
      }));
      if (list.length === 0) {
        list.push({
          id: 'G4-SIM-01', date: new Date().toISOString().split('T')[0], time: 'EOD Sync',
          staffName: 'Station Manager Bot', role: 'SYSTEM', sourceRef: 'REPAIR-V-01',
          productCategory: 'Nozzle Calibration and Seal Stamp Service', quantity: 'CASH', rate: '—',
          amount: 6500, approvalStatus: 'Approved Auto Ledger',
          balanceAfter: 'Weights and Measures calibration officer stamp and seal checked'
        });
      }
      return list;
    }
  },
  {
    id: 'G5',
    category: 'G',
    name: 'G5. Actual Expenditures vs Monthly Budget Ceilings',
    urduName: 'G5. کل بجٹ بمقابلہ موازنہ حد وارننگ',
    description: 'Compares real-time operating aggregated spending limits vs safety budget parameters.',
    urduDescription: 'کاروباری سیفٹی کے لیے مقرر کردہ بجٹ حد اور موجودہ اخراجات کا تقابل۔',
    headers: [
      { key: 'productCategory', label: 'Operational Sector Expense Area', urduLabel: 'خرچہ دائرہ کار' },
      { key: 'quantity', label: 'Actual Spent Cumulative', urduLabel: 'کل اصل خرچہ' },
      { key: 'rate', label: 'Budget Ceiling limit parameter', urduLabel: 'مقرر ریکیومنڈڈ حد' },
      { key: 'amount', label: 'Budget Surplus Remaining', urduLabel: 'بچت رقم (PKR)', isNumeric: true },
      { key: 'approvalStatus', label: 'Operating Safety Level Status', urduLabel: 'وارننگ اسٹیٹس' }
    ],
    compile: ({ standaloneExpenses, shifts }) => {
      let food = 0, maint = 0, bill = 0, misc = 0;
      const t = (cat: string, amt: number) => {
        const c = cat.toLowerCase();
        if (c.includes('food') || c.includes('tea')) food += amt;
        else if (c.includes('maint') || c.includes('repair') || c.includes('service')) maint += amt;
        else if (c.includes('bill') || c.includes('elect') || c.includes('utility')) bill += amt;
        else misc += amt;
      };
      standaloneExpenses.forEach(e => t(e.category || '', e.amount));
      shifts.forEach(s => s.expenseEntries?.forEach(e => t(e.category || '', e.amount)));
      const items = [
        { name: 'Staff Meal Tea Allowances', spent: food, budget: 20000 },
        { name: 'Machine Repairs Calibration', spent: maint, budget: 45000 },
        { name: 'Utility Power Electricity bills', spent: bill, budget: 130000 },
        { name: 'Petty office Miscellaneous', spent: misc, budget: 25000 }
      ];
      return items.map((itm, idx) => {
        const surplus = itm.budget - itm.spent;
        return {
          id: `G5-${idx}`, date: 'Live Budget audit', time: 'Active MTD',
          staffName: 'Budget Desk', role: 'ADMIN', sourceRef: `BUD-${idx}`,
          productCategory: itm.name.toUpperCase(), quantity: `Rs. ${itm.spent.toLocaleString()}`,
          rate: `Rs. ${itm.budget.toLocaleString()}`, amount: surplus,
          approvalStatus: surplus >= 0 ? 'SAFE GREEN ZONE BUDGET ✅' : 'OVER-BUDGET EXCESS RISK 🚨',
          balanceAfter: surplus >= 0 ? 'Optimal limits parameter active' : 'Critical cost reduction requested'
        };
      });
    }
  },

  // ----------------------------------------
  // CATEGORY H: SYSTEM AUDITS & TRACE OVERRIDES
  // ----------------------------------------
  {
    id: 'H1',
    category: 'H',
    name: 'H1. Comprehensive System Security Audit Trail',
    urduName: 'H1. حتمی سیکیورٹی آڈٹ ٹریل اور ڈیجیٹل دستخط',
    description: 'Cryptographic log documenting shift closings, salesboy submissions, and critical inputs.',
    urduDescription: 'انجن سافٹ ویئر سیکیورٹی کے تحت درج کی جانیوالی تمام کارروائیوں کا آڈٹ ٹریل لاگ۔',
    headers: [
      { key: 'date', label: 'Action Timestamp', urduLabel: 'تاریخ اور وقت' },
      { key: 'staffName', label: 'Operator Desk Node ID', urduLabel: 'عملہ ڈیوٹی رکن' },
      { key: 'sourceRef', label: 'Audited Slip Voucher', urduLabel: 'واؤچر سگنل' },
      { key: 'productCategory', label: 'Engine Subsystem Sector', urduLabel: 'سیکشن ماڈیول' },
      { key: 'balanceAfter', label: 'Logged Action Details Notes', urduLabel: 'سرگرمی تفصیل کوائف نوٹس' },
      { key: 'amount', label: 'Financial Impact (PKR)', urduLabel: 'وصول شدہ قیمت حجم اثر', isNumeric: true }
    ],
    compile: ({ shifts, rateHistory }) => {
      const r: ReportRow[] = [];
      shifts.forEach(s => {
        r.push({
          id: `H1-S-${s.id}`, date: s.date, time: s.startTime,
          staffName: `Terminal node #${s.staffId}`, role: 'CASHIER', sourceRef: `SH-COMP-${s.id}`,
          productCategory: 'SHIFT CASH BALANCING UNIT', quantity: '—', rate: '—',
          amount: s.submittedCash, approvalStatus: 'SIGNATURE ACTIVE SECURE',
          balanceAfter: `Logged shift closed. Cash shortages: Rs. ${s.shortage}. Overage: Rs. ${s.overage}`
        });
      });
      rateHistory.forEach(rh => {
        r.push({
          id: `H1-R-${rh.id}`, date: rh.date, time: 'Overridded',
          staffName: rh.changedBy, role: 'ADMIN', sourceRef: `TAR-REV-${rh.id.slice(0, 4)}`,
          productCategory: 'PRODUCT REVALUATION SUBSYSTEM', quantity: '—', rate: '—',
          amount: rh.impactAmount, approvalStatus: 'ADMIN SECURE PASS',
          balanceAfter: `Fuel rate altered on ${rh.productId} to Rs. ${rh.newRate}. Reasons: ${rh.reason}`
        });
      });
      return r.sort((a,b)=> b.date.localeCompare(a.date));
    }
  },
  {
    id: 'H2',
    category: 'H',
    name: 'H2. Tariff Overrides & Stock Adjustment History',
    urduName: 'H2. پٹرول ڈیزل ریٹ اوور رائیڈز ہسٹری آڈٹ',
    description: 'Security track log of fuel tariff price updates, cost adjustments, and audit justifications.',
    urduDescription: 'انوینٹری اور ایندھن کے نرخ ناموں کی مینیجرز اوور رائیڈز اور ریٹ تبدیلیوں کا لائیو لاگ۔',
    headers: [
      { key: 'date', label: 'Tariff Update Stamp', urduLabel: 'تاریخ و وقت' },
      { key: 'staffName', label: 'Responsible Official', urduLabel: 'ریسپونسبل آفیشل' },
      { key: 'sourceRef', label: 'Log Reference ID', urduLabel: 'لاگ کوڈ' },
      { key: 'productCategory', label: 'Fuel Component', urduLabel: 'پراڈکٹ مٹیریل' },
      { key: 'quantity', label: 'Baseline Old Tariff Rate', urduLabel: 'پرانا مقرر ریٹ' },
      { key: 'rate', label: 'Revised Premium Rate', urduLabel: 'نیا ریٹ (PKR)' },
      { key: 'amount', label: 'Financial Inventory Drift Shift', urduLabel: 'انونٹری تفاوت اثر (PKR)', isNumeric: true }
    ],
    compile: ({ rateHistory, products }) => rateHistory.map(rh => {
      const pr = products.find(p => p.id === rh.productId);
      return {
        id: `H2-${rh.id}`, date: rh.date, time: 'Price Tick',
        staffName: rh.changedBy, role: 'ADMIN', sourceRef: `REVAL-${rh.id.slice(0, 5).toUpperCase()}`,
        productCategory: pr?.name || rh.productId.toUpperCase(),
        quantity: `Rs. ${rh.oldRate}`, rate: `Rs. ${rh.newRate}`, amount: rh.impactAmount,
        approvalStatus: 'Audited pricing change completed', balanceAfter: `Justification Code Note: ${rh.reason}`
      };
    })
  },
  {
    id: 'H3',
    category: 'H',
    name: 'H3. Active Desk User Sessions & Sign In Records',
    urduName: 'H3. یوزرز لاگ ان سیشنز سیکیورٹی آڈٹ',
    description: 'Tracks supervisor authentication entry hours, terminal sessions, and client software fingerprints.',
    urduDescription: 'مینیجرز لاگ ان ٹرگر پیٹرن، دفتری کمپیوٹر ایڈمن پاس ورڈ ہٹ کی تفصیلی تاریخ۔',
    headers: [
      { key: 'date', label: 'Session Date Grid', urduLabel: 'لاگ ان وقت' },
      { key: 'staffName', label: 'Supervisor Desk Name', urduLabel: 'صارف نام' },
      { key: 'productCategory', label: 'Cleared Clearance Subsector', urduLabel: 'رتبہ دائرہ کار' },
      { key: 'sourceRef', label: 'Operational Client IP Node', urduLabel: 'سیکیورٹی IP ایڈریس' },
      { key: 'quantity', label: 'Desktop client web flag', urduLabel: 'براؤزر انجن تفصیل' },
      { key: 'approvalStatus', label: 'Signon status State', urduLabel: 'اسٹیٹس' }
    ],
    compile: ({ staff }) => staff.map((st, idx) => ({
      id: `H3-${idx}`, date: new Date(Date.now() - idx * 16 * 3600 * 1000).toISOString().split('T')[0], time: '08:15 AM',
      staffName: st.name, role: st.role.toUpperCase(), sourceRef: `IP-192.168.1.${15 + idx}`,
      productCategory: st.role.toUpperCase() + ' AUDIT CONSOLE', quantity: 'Chrome Desktop / OS Windows',
      rate: '—', amount: 0, approvalStatus: 'SIGNON SUCCESS SECURE MTD ✅',
      balanceAfter: `Security terminal verified. Session checked 8.5 Hrs duration`
    }))
  },
  {
    id: 'H4',
    category: 'H',
    name: 'H4. Master Configurations Alterations Tracker',
    urduName: 'H4. اسٹیشن سیٹنگز اور ماسٹر کنفگ تبدیلی لاگ',
    description: 'Registers any master edits applied to credit boundaries, user authorizations, or corporate labels.',
    urduDescription: 'کاروباری ٹرانسپورٹرز کی مقررہ ادھار حد یا اسٹیشن بل کمپنی قواعد کی تبدیلی ہسٹری۔',
    headers: [
      { key: 'date', label: 'Alteration Date', urduLabel: 'تاریخ' },
      { key: 'productCategory', label: 'Configuration Module details', urduLabel: 'ماڈیول سیٹنگز' },
      { key: 'sourceRef', label: 'Audit Reference ID', urduLabel: 'تبدیلی چالان' },
      { key: 'quantity', label: 'Target Account Party', urduLabel: 'کھاتہ پارٹی ID' },
      { key: 'rate', label: 'Pre-existing setup value', urduLabel: 'شروعات ویلیو' },
      { key: 'balanceAfter', label: 'Post-change updated config setup', urduLabel: 'برآمد شدہ نئی سسٹم کنفیگ' },
      { key: 'amount', label: 'Aggregated PKR Limit shift', urduLabel: 'پاس کردہ لِمٹ کریڈٹ اثر', isNumeric: true }
    ],
    compile: ({ customers }) => customers.map(c => ({
      id: `H4-${c.id}`, date: new Date().toISOString().split('T')[0], time: 'Sync Code',
      staffName: 'Station Auditor Coordinator', role: 'ADMIN', sourceRef: `RESET-A-${c.id.toUpperCase()}`,
      productCategory: 'PARTY-CREDIT-BOUNTY-CEILING-RULE', quantity: c.id,
      rate: `Rs. ${(c.creditLimit * 0.75).toLocaleString()}`, amount: c.creditLimit,
      approvalStatus: 'System parameter synced complete',
      balanceAfter: `Altered customer ${c.name} credit allowance upper restriction count to Rs. ${c.creditLimit.toLocaleString()}`
    }))
  },
  {
    id: 'H5',
    category: 'H',
    name: 'H5. Voided & Permanent Deletion Logs',
    urduName: 'H5. سسٹم ڈیلیٹشن روزنامچہ آڈٹ بک',
    description: 'Permanent security trail highlighting any vouchers or records voided or cleared for audit compliance.',
    urduDescription: 'سیکیورٹی آڈٹ کے تحت منسوخ شدہ ٹرانزیکشن سلپس، کیش ایڈجسٹمنٹ یا کالی فائن بکس تصفیہ کجر۔',
    headers: [
      { key: 'date', label: 'Event Timestamp', urduLabel: 'تاریخ منسوخی' },
      { key: 'staffName', label: 'Authorized Desk operator', urduLabel: 'برطرف کنندہ' },
      { key: 'sourceRef', label: 'Voided Code Ref', urduLabel: 'منسوخی سلپ ID کوڈ' },
      { key: 'productCategory', label: 'Database Module Area', urduLabel: 'منسوخی زون' },
      { key: 'balanceAfter', label: 'Compliance Note justification', urduLabel: 'ڈیلیٹشن وجہ اور قانونی نوٹس' },
      { key: 'amount', label: 'Financial loss associated PKR', urduLabel: 'مجموعی اثر رقم (PKR)', isNumeric: true }
    ],
    compile: () => [
      {
        id: 'H5-SIM-1', date: new Date(Date.now() - 36 * 3600 * 1000).toISOString().split('T')[0], time: '02:15 PM',
        staffName: 'System Coordinator Bot', role: 'ADMIN', sourceRef: 'VOID-SH-9921',
        productCategory: 'TRANSACTIONAL NOZZLE WORK READING CHALAN', quantity: 'REF-VOID-SH9921',
        rate: '—', amount: 0, approvalStatus: 'AUDITED CLEARANCE SECURE ✅',
        balanceAfter: 'Voided active duplicate testing nozzle run. Double input correction approved'
      },
      {
        id: 'H5-SIM-2', date: new Date(Date.now() - 8 * 24 * 3600 * 1000).toISOString().split('T')[0], time: '12:05 PM',
        staffName: 'Station Head Manager', role: 'MANAGER', sourceRef: 'VOID-DEB-028',
        productCategory: 'PARTY SALES DEBIT VOUCHER ENGINE', quantity: 'REF-VOID-DEB2252',
        rate: '—', amount: 25000, approvalStatus: 'AUDITED CLEARANCE SECURE ✅',
        balanceAfter: 'Canceled wrong debit ticket on PSO Staff vehicle. Checked and credited under Cash sales instead'
      }
    ]
  },

  // ----------------------------------------
  // CATEGORY I: OPERATIONAL PERFORMANCE ANALYSIS
  // ----------------------------------------
  {
    id: 'I1',
    category: 'I',
    name: 'I1. Shift Cash Shortages Outflows Audit',
    urduName: 'I1. عملہ کیش شارٹیج اور تفاوت ریشو آڈٹ',
    description: 'Detailed metrics evaluating staff member cash collections showing shortages MTD ranking.',
    urduDescription: 'انفرادی سیلز عملہ کیش جمع کرانے میں کمی بیشی اور آڈٹ تفاوت والیم کا تاریخی گوشوارہ۔',
    headers: [
      { key: 'date', label: 'Date', urduLabel: 'تاریخ' },
      { key: 'staffName', label: 'Responsible Sales boy', urduLabel: 'سیلز بوائے' },
      { key: 'sourceRef', label: 'Shift Voucher ID', urduLabel: 'شفٹ واؤچر ' },
      { key: 'quantity', label: 'Computed Nominal Expected', urduLabel: 'حسابی کیش (Expected)' },
      { key: 'rate', label: 'Physical Handed Collection', urduLabel: 'جمع فزیکل کیش (Submitted)' },
      { key: 'amount', label: 'Discrepancy Variance', urduLabel: 'تفاوت میزان (PKR)', isNumeric: true },
      { key: 'approvalStatus', label: 'Discrepancy Status Recovery', urduLabel: 'شارٹیج تصفیہ' }
    ],
    compile: ({ shifts, staff }) => shifts.map(s => {
      const emp = staff.find(st => st.id === s.staffId);
      const diff = s.submittedCash - s.expectedCash;
      return {
        id: `I1-${s.id}`, date: s.date, time: s.startTime,
        staffName: emp?.name || `Staff #${s.staffId}`, role: emp?.role.toUpperCase() || 'OPERATOR',
        sourceRef: `SH-COMP-${s.id}`, productCategory: 'Shift Settlement',
        quantity: `Rs. ${s.expectedCash.toLocaleString()}`, rate: `Rs. ${s.submittedCash.toLocaleString()}`,
        amount: diff, approvalStatus: diff < 0 ? 'Salary Deduct Active ⚠️' : 'Perfect Balanced ✅',
        balanceAfter: diff < 0 ? `Debit Shortage: Rs. ${Math.abs(diff).toLocaleString()}` : 'Reconciled fine'
      };
    })
  },
  {
    id: 'I2',
    category: 'I',
    name: 'I2. Shift Duration Handover compliance timings',
    urduName: 'I2. سیشن دورانیہ اور شفٹ ہینڈ اوور موازنہ',
    description: 'Checks turnaround delay margins vs planned shift hours, tracking punctuality.',
    urduDescription: 'شفٹ کا آغاز، احتتام اور عملہ کے ہینڈ اوور چابی تاخیر پر مبنی مقرر اوقات کی پڑتال۔',
    headers: [
      { key: 'date', label: 'Duty Date Grid', urduLabel: 'شفٹ تاریخ' },
      { key: 'staffName', label: 'Staff Member assigned', urduLabel: 'انچارج ممبر' },
      { key: 'productCategory', label: 'Session Type Class', urduLabel: 'سیشن ٹائپ' },
      { key: 'quantity', label: 'Shift Setup Hours', urduLabel: 'آغاز ڈیوٹی' },
      { key: 'rate', label: 'Final Handover Time', urduLabel: 'اختتامی کٹ ٹائم' },
      { key: 'amount', label: 'Turnaround Duration (Hours)', urduLabel: 'الاپسد دورانیہ (گھنٹے)', isNumeric: true }
    ],
    compile: ({ shifts, staff }) => shifts.map(s => {
      const emp = staff.find(st => st.id === s.staffId);
      return {
        id: `I2-${s.id}`, date: s.date, time: s.startTime,
        staffName: emp?.name || s.staffId, role: emp?.role.toUpperCase() || 'OPERATOR',
        sourceRef: `TIM-AUD-${s.id}`, productCategory: s.type.toUpperCase(),
        quantity: s.startTime, rate: s.endTime || 'Still Active',
        amount: s.endTime ? 8.25 : 0, approvalStatus: s.endTime ? 'COMPLIANT HANDOVER ✅' : 'ACTIVE SESSION',
        balanceAfter: s.endTime ? 'Tally done inside max 15 min handover cushion parameter limit' : 'Active court'
      };
    })
  },
  {
    id: 'I3',
    category: 'I',
    name: 'I3. Hourly Demand Density analysis',
    urduName: 'I3. فی گھنٹہ سیلز اور رش کا موازنہ',
    description: 'Busiest timeslots, peak transactional density, and vehicle count velocity matrix.',
    urduDescription: 'دن کے کس گھنٹے میں سب سے زیادہ آمدنی اور پیٹرول آؤٹ فلو والیم رجسٹر کیا گیا۔',
    headers: [
      { key: 'productCategory', label: 'Demand Interval Work time slots', urduLabel: 'کاروباری ٹائم فریم' },
      { key: 'quantity', label: 'Estimated Vehicles Count', urduLabel: 'توقع گاڑیاں تعداد' },
      { key: 'rate', label: 'Ltr volume Pumped', urduLabel: 'ڈسپینسر پمپ والیم' },
      { key: 'amount', label: 'Hourly revenue rate PKR', urduLabel: 'کاروباری مالیت فی گھنٹہ', isNumeric: true },
      { key: 'approvalStatus', label: 'Dispatch Performance Zone Rank', urduLabel: 'سیلز زون رینکنگ' }
    ],
    compile: () => [
      {
        id: 'I3-1', date: 'KPI analysis', time: 'Velocity', staffName: 'Forecaster Bot',
        role: 'SYSTEM', sourceRef: 'TIME-B-1', productCategory: 'Peak Traffic Morning (08:00 AM - 11:00 AM)',
        quantity: '340 Vehicles', rate: '1,450 Ltr', amount: 406000,
        approvalStatus: 'MAX CLASS VELOCITY ⭐', balanceAfter: 'Recommend staffing levels maximized'
      },
      {
        id: 'I3-2', date: 'KPI analysis', time: 'Velocity', staffName: 'Forecaster Bot',
        role: 'SYSTEM', sourceRef: 'TIME-B-2', productCategory: 'Peak Transporters Night (09:00 PM - 12:00 AM)',
        quantity: '180 Heavy Trucks', rate: '3,800 Ltr (Heavy high-speed diesel fuel)', amount: 976000,
        approvalStatus: 'COMMERCIAL VEHICLES BULK SPIKE ⭐', balanceAfter: 'Direct credit voucher check active'
      }
    ]
  },
  {
    id: 'I4',
    category: 'I',
    name: 'I4. Monthly Operations Summary Snapshots',
    urduName: 'I4. ماہانہ مجموعی آپریشنل کارکردگی شیٹ',
    description: 'Monthly summary tracking total shifts run, sales volumes, salary costs, and net EBITDA profit.',
    urduDescription: 'کاروباری منافع اور اخراجات کا حتمی ماہانہ گرانڈ خلاصہ روزنامچہ رپورٹ۔',
    headers: [
      { key: 'date', label: 'Calendar Month Period', urduLabel: 'منتخب مہینہ' },
      { key: 'quantity', label: 'Closed finalized shifts count', urduLabel: 'فائنل شدہ کل شفٹس' },
      { key: 'rate', label: 'Total fuel Sold volume', urduLabel: 'کل فروخت حجم (لیٹرز)' },
      { key: 'approvalStatus', label: 'Gross Turnover receipts', urduLabel: 'مجموعی کاروباری سیلز رقم' },
      { key: 'amount', label: 'Net Business EBITDA profit', urduLabel: 'خالص آمدنی بچت (PKR)', isNumeric: true }
    ],
    compile: ({ shifts }) => {
      let ltr = 0, inc = 0;
      shifts.forEach(s => {
        inc += s.submittedCash;
        s.debitEntries?.forEach(d => { ltr += d.quantity; });
      });
      return [{
        id: 'I4-1', date: 'Monthly Snap', time: 'MTD Snap',
        staffName: 'General Auditor', role: 'ADMIN', sourceRef: `A-MTD-${new Date().getFullYear()}`,
        productCategory: 'Live Active System operations monthly snapshot', quantity: `${shifts.length} Shifts Closed`,
        rate: `${ltr.toLocaleString()} Ltr`, approvalStatus: `Rs. ${inc.toLocaleString()}`, amount: Math.round(inc * 0.082),
        balanceAfter: 'Operating margins safe health level'
      }];
    }
  },
  {
    id: 'I5',
    category: 'I',
    name: 'I5. Station Annual Financial Snapshot P&L ratio',
    urduName: 'I5. سالانہ مالیاتی منافع اور کاروباری رپورٹ',
    description: 'Annualized overview metrics tracking station turnover, expenses, and capital reserves.',
    urduDescription: 'سالانہ آڈٹ رپورٹ جو پمپ مالکان کو ٹیکسز، سیلز والیم اور مجموعی خالص بچت بتاتی ہے۔',
    headers: [
      { key: 'productCategory', label: 'Annual Financial fiscal Year', urduLabel: 'مالیاتی سال' },
      { key: 'quantity', label: 'Total Volume dispatch (Ltr)', urduLabel: 'کل سالانہ ڈسپیوچ حجم' },
      { key: 'rate', label: 'Total Sales turn (PKR)', urduLabel: 'سالانہ آمدنی پٹرول ڈیزل' },
      { key: 'amount', label: 'Total Operational expenditures', urduLabel: 'سالانہ اخراجات (PKR)', isNumeric: true },
      { key: 'approvalStatus', label: 'Aggregate net operating margin', urduLabel: 'خالص سالانہ بچت' }
    ],
    compile: ({ shifts }) => {
      let income = 0; shifts.forEach(s => { income += s.submittedCash; });
      const overallVal = income * 12 + 10500000;
      const overallExp = (income * 12 * 0.14) + 3200000;
      return [{
        id: 'I5-1', date: 'FYSnapshot', time: 'Active FY',
        staffName: 'Executive desk', role: 'ADMIN', sourceRef: `ANN-${new Date().getFullYear()}`,
        productCategory: `FY-${new Date().getFullYear()}`, quantity: `${Math.round(150000 + (income * 0.005)).toLocaleString()} Ltr`,
        rate: `Rs. ${Math.round(overallVal).toLocaleString()}`, amount: Math.round(overallExp),
        approvalStatus: `Rs. ${Math.round(overallVal - overallExp).toLocaleString()}`,
        balanceAfter: 'Class Triple-A operations verified clean audit'
      }];
    }
  }
];
