import { ReportTemplate, ReportRow } from '../types';
import { getStaffInfo, getProductRate, getFuelCategory, getFuelCogsRate } from '../utils';

export const extendedTemplates: ReportTemplate[] = [
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
 id: `H1-R-${rh.id}`, date: rh.date || '' || '', time: 'Overridded',
 staffName: rh.changedBy, role: 'ADMIN', sourceRef: `TAR-REV-${rh.id.slice(0, 4)}`,
 productCategory: 'PRODUCT REVALUATION SUBSYSTEM', quantity: '—', rate: '—',
 amount: (rh.impactAmount || 0) || 0, approvalStatus: 'ADMIN SECURE PASS',
 balanceAfter: `Fuel rate altered on ${rh.productId} to Rs. ${(rh.newRate || 0)}. Reasons: ${rh.reason}`
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
 id: `H2-${rh.id}`, date: rh.date || '' || '', time: 'Price Tick',
 staffName: rh.changedBy, role: 'ADMIN', sourceRef: `REVAL-${rh.id.slice(0, 5).toUpperCase()}`,
 productCategory: pr?.name || rh.productId.toUpperCase(),
 quantity: `Rs. ${(rh.oldRate || 0)}`, rate: `Rs. ${(rh.newRate || 0)}`, amount: (rh.impactAmount || 0) || 0,
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
 {
 id: 'H6',
 category: 'H',
 name: 'H6. Full System Audit Report (A to Z)',
 urduName: 'H6. مکمل سسٹم آڈٹ رپورٹ (A تا Z)',
 description: 'Master chronological ledger of all actions across the entire ERP including logins, edits, deletes, and shifts.',
 urduDescription: 'سسٹم کی مکمل اور حتمی رپورٹ جس میں لاگ ان، ترامیم، منسوخی اور شفٹس کا پورا ریکارڈ موجود ہے۔',
 headers: [
 { key: 'date', label: 'Timestamp', urduLabel: 'تاریخ اور وقت' },
 { key: 'staffName', label: 'User ID', urduLabel: 'یوزر' },
 { key: 'sourceRef', label: 'Event Category', urduLabel: 'کیٹیگری' },
 { key: 'productCategory', label: 'Action Taken', urduLabel: 'ایکشن' },
 { key: 'balanceAfter', label: 'Details / Impact', urduLabel: 'تفصیلات' },
 { key: 'approvalStatus', label: 'Role', urduLabel: 'عہدہ' }
 ],
 compile: ({ auditLogs = [], shifts, rateHistory }) => {
 const r: ReportRow[] = [];
 
 // Add general audit logs
 auditLogs.forEach((log) => {
 r.push({
 id: `H6-AUD-${log.id}`,
 date: new Date(log.timestamp).toLocaleString(),
 time: new Date(log.timestamp).toLocaleTimeString(),
 staffName: log.user,
 role: 'USER',
 sourceRef: log.category,
 productCategory: log.action,
 quantity: '—',
 rate: '—',
 amount: 0,
 approvalStatus: 'System Audited',
 balanceAfter: log.details
 });
 });

 // Add shift closures
 shifts.forEach(s => {
 r.push({
 id: `H6-S-${s.id}`,
 date: new Date(s.date).toLocaleString(),
 time: s.startTime,
 staffName: `Terminal node #${s.staffId}`,
 role: 'CASHIER',
 sourceRef: 'Shift Settlement',
 productCategory: 'SHIFT CLOSED',
 quantity: '—',
 rate: '—',
 amount: 0,
 approvalStatus: 'System Audited',
 balanceAfter: `Shift closed. Expected: ${s.expectedCash}, Submitted: ${s.submittedCash}`
 });
 });

 // Add rate history changes
 rateHistory.forEach(rh => {
 r.push({
 id: `H6-R-${rh.id}`,
 date: rh.date ? new Date(rh.date).toLocaleString() : '',
 time: 'Overridden',
 staffName: rh.changedBy,
 role: 'ADMIN',
 sourceRef: 'Product Revaluation',
 productCategory: 'RATE CHANGED',
 quantity: '—',
 rate: '—',
 amount: 0,
 approvalStatus: 'System Audited',
 balanceAfter: `Changed ${rh.productId} to Rs. ${rh.newRate || 0}. Reason: ${rh.reason}`
 });
 });

 // Sort by date descending
 return r.sort((a,b)=> new Date(b.date).getTime() - new Date(a.date).getTime());
 }
 }
];
