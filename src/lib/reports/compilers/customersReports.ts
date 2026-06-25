import { ReportTemplate, ReportRow } from '../types';
import { getStaffInfo, getProductRate, getFuelCategory, getFuelCogsRate } from '../utils';

export const customersTemplates: ReportTemplate[] = [
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
  }
];
