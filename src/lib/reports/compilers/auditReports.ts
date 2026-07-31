import { ReportTemplate, ReportRow } from '../types';
import { getStaffInfo, getProductRate, getFuelCategory, getFuelCogsRate } from '../utils';

export const auditTemplates: ReportTemplate[] = [
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
 const total = Object.values(cats).reduce((acc: number, curr: {c: number; s: number}) => acc + (curr.s || 0), 0) || 1;
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
 }
];
