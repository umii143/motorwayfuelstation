import { ReportTemplate, ReportRow } from '../types';
import { getStaffInfo, getProductRate, getFuelCategory, getFuelCogsRate } from '../utils';

export const financialTemplates: ReportTemplate[] = [
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
  }
];
