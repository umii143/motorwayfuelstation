/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * lubeReportCompilers.ts
 * ----------------------
 * COMPLETELY INDEPENDENT Lube POS Report Templates.
 * This module has ZERO dependency on Fuel Station concepts:
 *   - No Shift, Nozzle, Tank, RateHistory, Pump
 *   - No fuel-type logic, no meter readings
 *
 * Data sources: LubePosSale[], Product[], Customer[], Staff[], ExpenseEntry[]
 */

import { LubePosSale, Product, Customer, Staff, ExpenseEntry } from '../types';

// ==========================================
// LUBE REPORT ROW INTERFACE
// ==========================================
export interface LubeReportRow {
  id: string;
  date: string;
  time: string;
  ref: string;
  category: string;
  description: string;
  quantity: string;
  unitPrice: string;
  amount: number;
  paymentMode: string;
  status: string;
  balance: string;
  // internal filter helpers
  productId?: string;
  customerId?: string;
  staffId?: string;
  entityName?: string;
}

export interface LubeReportHeader {
  key: keyof LubeReportRow | string;
  label: string;
  urduLabel: string;
  isNumeric?: boolean;
}

export interface LubeReportTemplate {
  id: string;
  category: 'L';
  name: string;
  urduName: string;
  description: string;
  urduDescription: string;
  headers: LubeReportHeader[];
  compile: (data: {
    lubePosSales: LubePosSale[];
    products: Product[];
    customers: Customer[];
    staff: Staff[];
    standaloneExpenses: ExpenseEntry[];
  }) => LubeReportRow[];
}

// ==========================================
// INTERNAL UTILITY HELPERS
// ==========================================
const getStaffName = (staffList: Staff[], staffId: string): string => {
  const s = staffList.find(x => x.id === staffId);
  return s ? s.name : staffId || 'Cashier';
};

const getProductName = (productList: Product[], productId: string): string => {
  const p = productList.find(x => x.id === productId);
  return p ? p.name : productId;
};

const getCustomerName = (customerList: Customer[], customerId: string): string => {
  const c = customerList.find(x => x.id === customerId);
  return c ? c.name : customerId;
};

const formatPayment = (mode: string): string => {
  const modes: Record<string, string> = {
    cash: 'Cash',
    bank: 'Bank Transfer',
    digital: 'Digital Wallet',
    credit: 'Credit / Ledger'
  };
  return modes[mode] || mode.toUpperCase();
};

// ==========================================
// LUBE REPORT TEMPLATES CATALOGUE (L1–L9)
// ==========================================
export const LUBE_REPORT_TEMPLATES: LubeReportTemplate[] = [

  // ----------------------------------------
  // L1: DAILY SALES SUMMARY
  // ----------------------------------------
  {
    id: 'L1',
    category: 'L',
    name: 'L1. Daily Sales Summary Report',
    urduName: 'L1. یومیہ فروخت خلاصہ رپورٹ',
    description: 'Aggregated daily revenue totals: gross sales, discounts, tax, and net per day.',
    urduDescription: 'روزانہ کی مجموعی فروخت، چھوٹ، ٹیکس اور خالص آمدنی کا تفصیلی خلاصہ۔',
    headers: [
      { key: 'date',        label: 'Date',              urduLabel: 'تاریخ' },
      { key: 'ref',         label: 'Invoices Count',    urduLabel: 'انوائسز' },
      { key: 'quantity',    label: 'Total Discount',    urduLabel: 'کل چھوٹ' },
      { key: 'unitPrice',   label: 'Total Tax',         urduLabel: 'کل ٹیکس' },
      { key: 'amount',      label: 'Net Revenue (PKR)', urduLabel: 'خالص آمدنی', isNumeric: true },
      { key: 'status',      label: 'Top Product',       urduLabel: 'سب سے زیادہ فروخت' },
    ],
    compile: ({ lubePosSales, products }) => {
      const byDate: Record<string, { invoices: number; discount: number; tax: number; revenue: number; prodCounts: Record<string, number> }> = {};
      lubePosSales.forEach(sale => {
        if (!byDate[sale.date]) byDate[sale.date] = { invoices: 0, discount: 0, tax: 0, revenue: 0, prodCounts: {} };
        const d = byDate[sale.date];
        d.invoices += 1;
        d.discount += sale.discount;
        d.tax      += sale.tax;
        d.revenue  += sale.total;
        sale.items.forEach(item => {
          d.prodCounts[item.productId] = (d.prodCounts[item.productId] || 0) + item.quantity;
        });
      });

      return Object.entries(byDate)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, d]) => {
          const topProdId = Object.entries(d.prodCounts).sort(([,a],[,b]) => b - a)[0]?.[0] || '';
          return {
            id: `L1-${date}`,
            date,
            time: 'Daily Summary',
            ref: `${d.invoices} Invoice(s)`,
            category: 'Sales',
            description: 'Daily aggregated POS totals',
            quantity: `Rs. ${d.discount.toFixed(2)}`,
            unitPrice: `Rs. ${d.tax.toFixed(2)}`,
            amount: d.revenue,
            paymentMode: 'Mixed',
            status: getProductName(products, topProdId) || '—',
            balance: '—',
          };
        });
    }
  },

  // ----------------------------------------
  // L2: INVOICE-WISE TRANSACTION LOG
  // ----------------------------------------
  {
    id: 'L2',
    category: 'L',
    name: 'L2. Invoice Transaction Log',
    urduName: 'L2. مکمل انوائس ٹرانزیکشن لاگ',
    description: 'Every POS invoice with customer name, cashier, payment mode, and line totals.',
    urduDescription: 'ہر انوائس کی مکمل تفصیل: کسٹمر، کیشیئر، ادائیگی طریقہ اور رقم۔',
    headers: [
      { key: 'date',        label: 'Date',              urduLabel: 'تاریخ' },
      { key: 'time',        label: 'Time',              urduLabel: 'وقت' },
      { key: 'ref',         label: 'Invoice No',        urduLabel: 'انوائس نمبر' },
      { key: 'category',    label: 'Cashier',           urduLabel: 'کیشیئر' },
      { key: 'description', label: 'Customer',          urduLabel: 'کسٹمر' },
      { key: 'quantity',    label: 'Items Count',       urduLabel: 'آئٹمز' },
      { key: 'unitPrice',   label: 'Discount',          urduLabel: 'چھوٹ' },
      { key: 'paymentMode', label: 'Payment Mode',      urduLabel: 'ادائیگی' },
      { key: 'amount',      label: 'Net Total (PKR)',   urduLabel: 'کل رقم', isNumeric: true },
      { key: 'status',      label: 'Type',              urduLabel: 'قسم' },
    ],
    compile: ({ lubePosSales, customers, staff }) => {
      return lubePosSales
        .sort((a, b) => `${b.date}${b.time}`.localeCompare(`${a.date}${a.time}`))
        .map(sale => ({
          id: `L2-${sale.id}`,
          date: sale.date,
          time: sale.time,
          ref: sale.invoiceNo,
          category: getStaffName(staff, sale.cashierId),
          description: sale.customerName || (sale.customerId ? getCustomerName(customers, sale.customerId) : 'Walk-in Customer'),
          quantity: `${sale.items.reduce((s, i) => s + i.quantity, 0)} item(s)`,
          unitPrice: `Rs. ${sale.discount.toFixed(2)}`,
          paymentMode: formatPayment(sale.paymentMode),
          amount: sale.total,
          status: sale.isReturn ? 'RETURN' : sale.isAdjustment ? 'ADJUST' : sale.isRecovery ? 'RECOVERY' : 'SALE',
          balance: `Change: Rs. ${sale.changeGiven.toFixed(2)}`,
          customerId: sale.customerId,
          staffId: sale.cashierId,
          entityName: sale.customerName || '',
        }));
    }
  },

  // ----------------------------------------
  // L3: PRODUCT-WISE SALES PERFORMANCE
  // ----------------------------------------
  {
    id: 'L3',
    category: 'L',
    name: 'L3. Product-wise Sales Performance',
    urduName: 'L3. پروڈکٹ وائز فروخت کارکردگی',
    description: 'Total quantity sold, revenue, and ranking for each lube product.',
    urduDescription: 'ہر لیوب پراڈکٹ کی کل فروخت مقدار، آمدنی اور درجہ بندی۔',
    headers: [
      { key: 'description', label: 'Product Name',         urduLabel: 'پروڈکٹ' },
      { key: 'category',    label: 'Unit',                 urduLabel: 'یونٹ' },
      { key: 'quantity',    label: 'Quantity Sold',        urduLabel: 'فروخت مقدار' },
      { key: 'unitPrice',   label: 'Avg Unit Price',       urduLabel: 'اوسط ریٹ' },
      { key: 'amount',      label: 'Total Revenue (PKR)',  urduLabel: 'مجموعی آمدنی', isNumeric: true },
      { key: 'status',      label: 'Rank',                 urduLabel: 'درجہ' },
    ],
    compile: ({ lubePosSales, products }) => {
      const prodData: Record<string, { qty: number; revenue: number; count: number }> = {};
      lubePosSales.forEach(sale => {
        if (sale.isReturn) return; // exclude returns
        sale.items.forEach(item => {
          if (!prodData[item.productId]) prodData[item.productId] = { qty: 0, revenue: 0, count: 0 };
          prodData[item.productId].qty     += item.quantity;
          prodData[item.productId].revenue += item.lineTotal;
          prodData[item.productId].count   += 1;
        });
      });

      const sorted = Object.entries(prodData).sort(([,a],[,b]) => b.revenue - a.revenue);

      return sorted.map(([productId, d], idx) => {
        const prod = products.find(p => p.id === productId);
        const avgUnit = d.qty > 0 ? d.revenue / d.qty : 0;
        return {
          id: `L3-${productId}`,
          date: 'Period Total',
          time: '—',
          ref: `P-${productId}`,
          category: prod?.unit || 'pcs',
          description: prod?.name || productId,
          quantity: `${d.qty.toLocaleString()} ${prod?.unit || 'pcs'}`,
          unitPrice: `Rs. ${avgUnit.toFixed(2)}`,
          amount: d.revenue,
          paymentMode: '—',
          status: `#${idx + 1}`,
          balance: `${d.count} sale(s)`,
          productId,
        };
      });
    }
  },

  // ----------------------------------------
  // L4: CUSTOMER CREDIT OUTSTANDING
  // ----------------------------------------
  {
    id: 'L4',
    category: 'L',
    name: 'L4. Customer Credit Outstanding Ledger',
    urduName: 'L4. کسٹمر ادھار بقایا کھاتہ',
    description: 'All credit customers with current outstanding balance and credit limit utilization.',
    urduDescription: 'کریڈٹ کسٹمرز کی مکمل بقایا فہرست اور ادھار حد کا استعمال۔',
    headers: [
      { key: 'description', label: 'Customer Name',        urduLabel: 'کسٹمر نام' },
      { key: 'category',    label: 'Contact',              urduLabel: 'رابطہ' },
      { key: 'quantity',    label: 'Credit Limit',         urduLabel: 'ادھار حد' },
      { key: 'unitPrice',   label: 'Total Purchases',      urduLabel: 'کل خریداری' },
      { key: 'amount',      label: 'Outstanding Balance',  urduLabel: 'بقایا رقم', isNumeric: true },
      { key: 'status',      label: 'Risk Level',           urduLabel: 'خطرے کی سطح' },
    ],
    compile: ({ lubePosSales, customers }) => {
      // aggregate purchases per customer
      const custPurchases: Record<string, number> = {};
      lubePosSales.forEach(sale => {
        if (sale.customerId && sale.paymentMode === 'credit' && !sale.isReturn) {
          custPurchases[sale.customerId] = (custPurchases[sale.customerId] || 0) + sale.total;
        }
      });

      return customers.map(c => {
        const totalPurchases = custPurchases[c.id] || 0;
        const utilPct = c.creditLimit > 0 ? (c.balance / c.creditLimit) * 100 : 0;
        const risk = utilPct >= 90 ? 'HIGH' : utilPct >= 60 ? 'MEDIUM' : 'LOW';
        return {
          id: `L4-${c.id}`,
          date: '—',
          time: '—',
          ref: c.id,
          category: c.contact || '—',
          description: c.name,
          quantity: `Rs. ${c.creditLimit.toLocaleString()}`,
          unitPrice: `Rs. ${totalPurchases.toLocaleString()}`,
          amount: c.balance,
          paymentMode: 'credit',
          status: risk,
          balance: `${utilPct.toFixed(0)}% Utilized`,
          customerId: c.id,
          entityName: c.name,
        };
      });
    }
  },

  // ----------------------------------------
  // L5: PAYMENT MODE BREAKDOWN
  // ----------------------------------------
  {
    id: 'L5',
    category: 'L',
    name: 'L5. Payment Mode Analysis Report',
    urduName: 'L5. ادائیگی طریقہ تجزیہ رپورٹ',
    description: 'Revenue split across payment channels: cash, bank transfer, digital wallet, credit.',
    urduDescription: 'نقد، بینک، ڈیجیٹل اور ادھار فروخت کا تقابلی جائزہ۔',
    headers: [
      { key: 'description', label: 'Payment Channel',      urduLabel: 'ادائیگی چینل' },
      { key: 'ref',         label: 'Invoice Count',        urduLabel: 'انوائس تعداد' },
      { key: 'quantity',    label: 'Share %',              urduLabel: 'حصہ فیصد' },
      { key: 'amount',      label: 'Total Collected (PKR)', urduLabel: 'وصول شدہ رقم', isNumeric: true },
      { key: 'status',      label: 'Avg Transaction',      urduLabel: 'اوسط رقم' },
    ],
    compile: ({ lubePosSales }) => {
      const modes: Record<string, { count: number; total: number }> = {
        cash: { count: 0, total: 0 },
        bank: { count: 0, total: 0 },
        digital: { count: 0, total: 0 },
        credit: { count: 0, total: 0 },
      };

      lubePosSales.forEach(sale => {
        if (!sale.isReturn) {
          const m = modes[sale.paymentMode] || { count: 0, total: 0 };
          m.count++;
          m.total += sale.total;
          modes[sale.paymentMode] = m;
        }
      });

      const grandTotal = Object.values(modes).reduce((s, m) => s + m.total, 0);

      return Object.entries(modes)
        .filter(([, m]) => m.count > 0)
        .sort(([,a],[,b]) => b.total - a.total)
        .map(([mode, m]) => ({
          id: `L5-${mode}`,
          date: 'Period Total',
          time: '—',
          ref: `${m.count} invoice(s)`,
          category: mode,
          description: formatPayment(mode),
          quantity: `${grandTotal > 0 ? ((m.total / grandTotal) * 100).toFixed(1) : '0'}%`,
          unitPrice: '—',
          amount: m.total,
          paymentMode: mode,
          status: m.count > 0 ? `Rs. ${(m.total / m.count).toFixed(2)} avg` : '—',
          balance: '—',
        }));
    }
  },

  // ----------------------------------------
  // L6: STAFF / CASHIER PERFORMANCE
  // ----------------------------------------
  {
    id: 'L6',
    category: 'L',
    name: 'L6. Staff & Cashier Performance Report',
    urduName: 'L6. اسٹاف اور کیشیئر سیلز کارکردگی',
    description: 'Sales volume, invoice count, and revenue performance per cashier/staff member.',
    urduDescription: 'ہر کیشیئر اور اسٹاف کی فروخت مقدار، انوائس تعداد اور کارکردگی کا موازنہ۔',
    headers: [
      { key: 'description', label: 'Cashier / Staff',      urduLabel: 'کیشیئر / عملہ' },
      { key: 'ref',         label: 'Invoices Processed',   urduLabel: 'انوائس' },
      { key: 'quantity',    label: 'Items Sold',           urduLabel: 'آئٹمز فروخت' },
      { key: 'unitPrice',   label: 'Avg Invoice Value',    urduLabel: 'اوسط رقم' },
      { key: 'amount',      label: 'Total Revenue (PKR)',  urduLabel: 'کل آمدنی', isNumeric: true },
      { key: 'status',      label: 'Rank',                 urduLabel: 'درجہ' },
    ],
    compile: ({ lubePosSales, staff }) => {
      const staffData: Record<string, { invoices: number; items: number; revenue: number }> = {};
      lubePosSales.forEach(sale => {
        if (sale.isReturn) return;
        if (!staffData[sale.cashierId]) staffData[sale.cashierId] = { invoices: 0, items: 0, revenue: 0 };
        const d = staffData[sale.cashierId];
        d.invoices += 1;
        d.items    += sale.items.reduce((s, i) => s + i.quantity, 0);
        d.revenue  += sale.total;
      });

      const sorted = Object.entries(staffData).sort(([,a],[,b]) => b.revenue - a.revenue);

      return sorted.map(([cashierId, d], idx) => ({
        id: `L6-${cashierId}`,
        date: 'Period Total',
        time: '—',
        ref: `${d.invoices} invoice(s)`,
        category: cashierId,
        description: getStaffName(staff, cashierId),
        quantity: `${d.items.toLocaleString()} pcs`,
        unitPrice: `Rs. ${d.invoices > 0 ? (d.revenue / d.invoices).toFixed(2) : '0'}`,
        amount: d.revenue,
        paymentMode: '—',
        status: `#${idx + 1}`,
        balance: '—',
        staffId: cashierId,
      }));
    }
  },

  // ----------------------------------------
  // L7: DISCOUNT & TAX ANALYSIS
  // ----------------------------------------
  {
    id: 'L7',
    category: 'L',
    name: 'L7. Discount & Tax Analysis Report',
    urduName: 'L7. چھوٹ اور ٹیکس تجزیہ رپورٹ',
    description: 'Invoice-by-invoice breakdown of discounts given and taxes collected.',
    urduDescription: 'ہر انوائس پر دی گئی چھوٹ اور وصول کیے گئے ٹیکس کی تفصیلی رپورٹ۔',
    headers: [
      { key: 'date',        label: 'Date',                urduLabel: 'تاریخ' },
      { key: 'ref',         label: 'Invoice No',          urduLabel: 'انوائس نمبر' },
      { key: 'category',    label: 'Cashier',             urduLabel: 'کیشیئر' },
      { key: 'description', label: 'Customer',            urduLabel: 'کسٹمر' },
      { key: 'quantity',    label: 'Gross Subtotal',      urduLabel: 'خام رقم' },
      { key: 'unitPrice',   label: 'Discount Amount',     urduLabel: 'چھوٹ رقم' },
      { key: 'amount',      label: 'Tax Collected (PKR)', urduLabel: 'ٹیکس رقم', isNumeric: true },
      { key: 'status',      label: 'Net Total',           urduLabel: 'خالص رقم' },
    ],
    compile: ({ lubePosSales, customers, staff }) => {
      return lubePosSales
        .filter(sale => sale.discount > 0 || sale.tax > 0)
        .sort((a, b) => `${b.date}${b.time}`.localeCompare(`${a.date}${a.time}`))
        .map(sale => ({
          id: `L7-${sale.id}`,
          date: sale.date,
          time: sale.time,
          ref: sale.invoiceNo,
          category: getStaffName(staff, sale.cashierId),
          description: sale.customerName || (sale.customerId ? getCustomerName(customers, sale.customerId) : 'Walk-in'),
          quantity: `Rs. ${sale.subtotal.toFixed(2)}`,
          unitPrice: `Rs. ${sale.discount.toFixed(2)}`,
          amount: sale.tax,
          paymentMode: formatPayment(sale.paymentMode),
          status: `Rs. ${sale.total.toFixed(2)}`,
          balance: '—',
          customerId: sale.customerId,
          staffId: sale.cashierId,
        }));
    }
  },

  // ----------------------------------------
  // L8: RETURN & ADJUSTMENT LOG
  // ----------------------------------------
  {
    id: 'L8',
    category: 'L',
    name: 'L8. Returns & Adjustments Log',
    urduName: 'L8. واپسی اور ایڈجسٹمنٹ لاگ',
    description: 'Record of all product returns, credit notes, and manual adjustments to POS invoices.',
    urduDescription: 'تمام واپسی انوائسز، کریڈٹ نوٹس اور دستی ایڈجسٹمنٹ کا مکمل لاگ۔',
    headers: [
      { key: 'date',        label: 'Date',                urduLabel: 'تاریخ' },
      { key: 'ref',         label: 'Return Invoice No',   urduLabel: 'واپسی انوائس' },
      { key: 'description', label: 'Original Invoice',    urduLabel: 'اصل انوائس' },
      { key: 'category',    label: 'Type',                urduLabel: 'قسم' },
      { key: 'unitPrice',   label: 'Customer',            urduLabel: 'کسٹمر' },
      { key: 'amount',      label: 'Refund Amount (PKR)', urduLabel: 'واپسی رقم', isNumeric: true },
      { key: 'status',      label: 'Cashier',             urduLabel: 'کیشیئر' },
    ],
    compile: ({ lubePosSales, customers, staff }) => {
      return lubePosSales
        .filter(sale => sale.isReturn || sale.isAdjustment)
        .sort((a, b) => `${b.date}${b.time}`.localeCompare(`${a.date}${a.time}`))
        .map(sale => ({
          id: `L8-${sale.id}`,
          date: sale.date,
          time: sale.time,
          ref: sale.invoiceNo,
          category: sale.isReturn ? 'RETURN' : 'ADJUSTMENT',
          description: sale.returnedSaleId ? `Ref: ${sale.returnedSaleId}` : '—',
          quantity: '—',
          unitPrice: sale.customerName || (sale.customerId ? getCustomerName(customers, sale.customerId) : 'Walk-in'),
          amount: sale.total,
          paymentMode: formatPayment(sale.paymentMode),
          status: getStaffName(staff, sale.cashierId),
          balance: sale.notes || '—',
          customerId: sale.customerId,
          staffId: sale.cashierId,
        }));
    }
  },

  // ----------------------------------------
  // L9: EXPENSE & NET PROFIT STATEMENT
  // ----------------------------------------
  {
    id: 'L9',
    category: 'L',
    name: 'L9. Expense & Net Profit Statement',
    urduName: 'L9. اخراجات اور خالص منافع گوشوارہ',
    description: 'Period net profit: POS revenue minus standalone operational expenses.',
    urduDescription: 'کاروباری آمدنی اور خرچہ جات کو ملا کر خالص منافع کا تخمینہ۔',
    headers: [
      { key: 'date',        label: 'Date',                urduLabel: 'تاریخ' },
      { key: 'category',    label: 'Entry Type',          urduLabel: 'قسم' },
      { key: 'description', label: 'Description',         urduLabel: 'تفصیل' },
      { key: 'ref',         label: 'Reference',           urduLabel: 'حوالہ' },
      { key: 'paymentMode', label: 'Paid Via',            urduLabel: 'بذریعہ' },
      { key: 'amount',      label: 'Amount (PKR)',        urduLabel: 'رقم', isNumeric: true },
      { key: 'status',      label: 'Impact',              urduLabel: 'اثر' },
    ],
    compile: ({ lubePosSales, standaloneExpenses }) => {
      const rows: LubeReportRow[] = [];

      // Revenue lines (daily summaries)
      const byDate: Record<string, number> = {};
      lubePosSales.forEach(sale => {
        if (!sale.isReturn && !sale.isAdjustment) {
          byDate[sale.date] = (byDate[sale.date] || 0) + sale.total;
        }
      });
      Object.entries(byDate).sort(([a],[b]) => a.localeCompare(b)).forEach(([date, total]) => {
        rows.push({
          id: `L9-REV-${date}`,
          date,
          time: '—',
          ref: 'POS Revenue',
          category: 'INCOME',
          description: 'Daily POS Sales Revenue',
          quantity: '—',
          unitPrice: '—',
          amount: total,
          paymentMode: 'Mixed',
          status: '+INCOME',
          balance: '—',
        });
      });

      // Expense lines
      standaloneExpenses.forEach(exp => {
        rows.push({
          id: `L9-EXP-${exp.id}`,
          date: exp.date,
          time: '—',
          ref: exp.category.toUpperCase(),
          category: 'EXPENSE',
          description: exp.description || exp.category,
          quantity: '—',
          unitPrice: '—',
          amount: -exp.amount,
          paymentMode: exp.paidFrom,
          status: '-EXPENSE',
          balance: '—',
        });
      });

      return rows.sort((a, b) => a.date.localeCompare(b.date));
    }
  },
];
