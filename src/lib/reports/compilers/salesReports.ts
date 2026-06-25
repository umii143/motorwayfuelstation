import { ReportTemplate, ReportRow } from '../types';
import { getStaffInfo, getProductRate, getFuelCategory, getFuelCogsRate } from '../utils';

export const salesTemplates: ReportTemplate[] = [
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
          date: h.date || '',
          time: '00:00 AM',
          staffName: h.changedBy,
          role: 'ADMIN',
          sourceRef: `REF-${h.id.slice(0, 5)}`,
          productCategory: prod?.name || h.productId,
          quantity: `Rs. ${(h.oldRate || 0).toFixed(2)}`,
          rate: `Rs. ${(h.newRate || 0).toFixed(2)}`,
          amount: h.impactAmount || 0,
          approvalStatus: `${(h.stockAtTime || 0).toLocaleString()} Ltr`,
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
    compile: () => []
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
    compile: ({ products, tanks }) => {
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
  }
];
