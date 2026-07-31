import { ReportTemplate, ReportRow } from '../types';
import { getStaffInfo, getProductRate, getFuelCategory, getFuelCogsRate } from '../utils';

export const staffTemplates: ReportTemplate[] = [
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
 }
];
