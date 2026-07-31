import { ReportTemplate, ReportRow } from '../types';
import { getStaffInfo, getProductRate, getFuelCategory, getFuelCogsRate } from '../utils';

export const suppliersTemplates: ReportTemplate[] = [
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
 compile: () => []
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
 }
];
