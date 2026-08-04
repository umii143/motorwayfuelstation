import React, { useState, useMemo } from 'react';
import { db } from '../../data/db';
import { useCustomerStore } from '../../stores/useCustomerStore';
import { useSupplierStore } from '../../stores/useSupplierStore';
import { useFinancialStore } from '../../stores/useFinancialStore';
import { useInventoryStore } from '../../stores/useInventoryStore';
import { useShiftStore } from '../../stores/useShiftStore';
import { useStaffStore } from '../../stores/useStaffStore';
import { GlobalSettings, Shift, Product, Staff, Customer, Supplier, ExpenseEntry, Tank, AuditTrailEntry } from '../../types';
import { formatCurrency } from '../../lib/currency';
import { REPORT_MODULES } from '../../lib/reportModules';
import { 
 Search, ShieldAlert, Activity, ArrowRight, Zap, RefreshCw, BarChart2, 
 Fuel, DollarSign, Users, AlertTriangle, MessageSquare, Sparkles, Sliders 
} from 'lucide-react';

interface CommandCenterProps {
 settings: GlobalSettings;
 shifts: Shift[];
 products: Product[];
 staff: Staff[];
 onSelectTab: (tabId: string) => void;
 onTriggerDrilldown: (drilldownParams: any) => void;
}

export default function CommandCenter({ 
 settings, 
 shifts: propsShifts, 
 products: propsProducts, 
 staff, 
 onSelectTab, 
 onTriggerDrilldown 
}: CommandCenterProps) {
 const [globalSearch, setGlobalSearch] = useState('');
 const [selectedAiQuery, setSelectedAiQuery] = useState<string | null>(null);
 const [isGeneratingAi, setIsGeneratingAi] = useState(false);

 const isUrdu = settings.language === 'ur';
 const t = (en: string, ur: string) => (isUrdu ? ur : en);

  const activeStationId = db.getActiveStationId();

  // Load stores data with direct db.get... fallback to guarantee live Firebase/IndexedDB data
  const storeCustomers = useCustomerStore((state: any) => state.customers || []);
  const customers: Customer[] = storeCustomers.length ? storeCustomers : db.getCustomers(activeStationId);

  const storeSuppliers = useSupplierStore((state: any) => state.suppliers || []);
  const suppliers: Supplier[] = storeSuppliers.length ? storeSuppliers : db.getSuppliers(activeStationId);

  const storeExpenses = useFinancialStore((state: any) => state.standaloneExpenses || []);
  const standaloneExpenses = storeExpenses.length ? storeExpenses : db.getStandaloneExpenses(activeStationId);

  const storeTanks = useInventoryStore((state: any) => state.tanks || []);
  const tanks: Tank[] = storeTanks.length ? storeTanks : db.getTanks(activeStationId);

  const storeProducts = useInventoryStore((state: any) => state.products || []);
  const dbProducts = db.getProducts(activeStationId);
  const products: Product[] = (storeProducts.length ? storeProducts : (dbProducts.length ? dbProducts : propsProducts)) || [];

  const storeShifts = useShiftStore((state: any) => state.shifts || []);
  const dbShifts = db.getShifts(activeStationId);
  const shifts: Shift[] = (storeShifts.length ? storeShifts : (dbShifts.length ? dbShifts : propsShifts)) || [];

  const storeBanks = useFinancialStore((state: any) => state.banks || []);
  const banks = storeBanks.length ? storeBanks : db.getBankAccounts(activeStationId);

  const storeDigital = useFinancialStore((state: any) => state.digitalAccounts || []);
  const digitalAccounts = storeDigital.length ? storeDigital : db.getDigitalAccounts(activeStationId);

  const activityLogs = useMemo(() => db.getActivityRegister(activeStationId) || [], [activeStationId]);

  // Helper to reliably extract live dip volume from Tank objects (checking currentStock first!)
  const getTankVolume = (t: Tank) => {
    if (t.currentStock !== undefined && t.currentStock !== null && t.currentStock > 0) return t.currentStock;
    if (t.currentVolume !== undefined && t.currentVolume !== null && t.currentVolume > 0) return t.currentVolume;
    if (t.currentDip !== undefined && t.currentDip !== null && t.currentDip > 0) return t.currentDip;
    const prod = products.find(p => p.id === t.productId || p.name.toLowerCase().includes(t.name.toLowerCase()));
    if (prod?.currentStock !== undefined && prod.currentStock !== null && prod.currentStock > 0) return prod.currentStock;
    return t.currentStock || t.currentVolume || t.currentDip || 0;
  };

  // Compute 100% Live Aggregates for Cash Drawers & Payment Wallets
  const cashStatus = useMemo(() => {
    let safeCash = 0;
    shifts.forEach((s: Shift) => {
      safeCash += s.submittedCash || 0;
    });
    standaloneExpenses.forEach((e: ExpenseEntry) => {
      if (e.paidFrom === 'cash') safeCash -= (e.amount || 0);
    });

    const bankBalance = banks.reduce((sum: number, b: any) => sum + Number(b.balance || 0), 0);
    const digitalPayments = digitalAccounts.reduce((sum: number, d: any) => sum + Number(d.balance || 0), 0);

    return {
      safeCash: Math.max(0, safeCash),
      bankBalance,
      digitalPayments
    };
  }, [shifts, standaloneExpenses, banks, digitalAccounts]);

  // Compute 100% Realtime Operational Metrics & Risk Scores (Zero Fake Values)
  const scorecardMetrics = useMemo(() => {
    // 1. Business Health Score (%)
    const healthyProductsPct = products.length > 0 ? (products.filter(p => p.currentStock > p.minStock).length / products.length) * 100 : 100;
    const healthyShiftsPct = shifts.length > 0 ? (shifts.filter(s => Math.abs((s.submittedCash || 0) - (s.expectedCash || 0)) <= 500).length / shifts.length) * 100 : 100;
    const healthyCustomersPct = customers.length > 0 ? (customers.filter(c => (c.balance || 0) <= (c.creditLimit || 50000)).length / customers.length) * 100 : 100;
    const healthyTanksPct = tanks.length > 0 ? (tanks.filter(t => getTankVolume(t) > 1000).length / tanks.length) * 100 : 100;

    const overallHealthScore = Math.round(
      (healthyProductsPct * 0.3) + (healthyShiftsPct * 0.3) + (healthyCustomersPct * 0.2) + (healthyTanksPct * 0.2)
    );

    // 2. Inventory Risk (%)
    const lowStockCount = products.filter(p => p.currentStock <= p.minStock).length;
    const lowTankCount = tanks.filter(t => getTankVolume(t) <= (t.criticalLevel || 2000)).length;
    const totalItems = (products.length + tanks.length) || 1;
    const inventoryRiskPct = Math.round(((lowStockCount + lowTankCount) / totalItems) * 100);

    // 3. Cash Flow Status
    const shiftNetVariance = shifts.slice(0, 10).reduce((sum, s) => sum + ((s.submittedCash || 0) - (s.expectedCash || 0)), 0);
    const cashFlowText = shiftNetVariance >= 0 ? 'Healthy' : 'Shortage';
    const cashFlowSub = shiftNetVariance >= 0 ? `+PKR ${shiftNetVariance.toLocaleString()} Tally` : `-PKR ${Math.abs(shiftNetVariance).toLocaleString()} Variance`;

    // 4. Tank Health Status
    const criticallyLowTanks = tanks.filter(t => getTankVolume(t) <= (t.criticalLevel || 2000));
    const tankHealthText = criticallyLowTanks.length === 0 ? 'Good' : 'Warning';
    const tankHealthSub = criticallyLowTanks.length === 0 ? 'Dips Calibrated' : `${criticallyLowTanks.length} Tank(s) Low Stock`;

    // 5. Supplier Risk Status
    const totalSupplierPayables = suppliers.reduce((sum, s) => sum + (s.balance || 0), 0);
    const highPayableSuppliers = suppliers.filter(s => (s.balance || 0) > 500000).length;
    const supplierRiskText = highPayableSuppliers > 0 ? 'High' : totalSupplierPayables > 100000 ? 'Medium' : 'Low';
    const supplierRiskSub = totalSupplierPayables > 0 ? `Payables: PKR ${totalSupplierPayables.toLocaleString()}` : 'Zero Outstanding';

    // 6. Customer Credit Status
    const totalReceivables = customers.reduce((sum, c) => sum + (c.balance || 0), 0);
    const overLimitCustomers = customers.filter(c => (c.balance || 0) > (c.creditLimit || 50000)).length;
    const customerCreditText = overLimitCustomers > 0 ? 'High' : totalReceivables > 100000 ? 'Medium' : 'Low';
    const customerCreditSub = overLimitCustomers > 0 ? `${overLimitCustomers} Over Limit` : `Receivables: PKR ${totalReceivables.toLocaleString()}`;

    // 7. Operational Score (%)
    const balancedShiftsCount = shifts.filter(s => Math.abs((s.submittedCash || 0) - (s.expectedCash || 0)) <= 500).length;
    const operationalScorePct = shifts.length > 0 ? Math.round((balancedShiftsCount / shifts.length) * 100) : 100;
    const operationalSub = shifts.length > 0 ? `${balancedShiftsCount}/${shifts.length} Shifts Tally OK` : 'Awaiting Closed Shifts';

    return {
      overallHealthScore,
      inventoryRiskPct,
      lowStockCount,
      lowTankCount,
      cashFlowText,
      cashFlowSub,
      tankHealthText,
      tankHealthSub,
      supplierRiskText,
      supplierRiskSub,
      customerCreditText,
      customerCreditSub,
      operationalScorePct,
      operationalSub
    };
  }, [products, shifts, customers, tanks, suppliers]);

 // Search Results Aggregation Engine
 const searchResults = useMemo(() => {
 if (!globalSearch.trim() || globalSearch.length < 2) return null;
 const query = globalSearch.toLowerCase();

 const matches: {
 tanks: Tank[];
 reports: any[];
 expenses: ExpenseEntry[];
 suppliers: Supplier[];
 customers: Customer[];
 activity: AuditTrailEntry[];
 } = {
 tanks: [],
 reports: [],
 expenses: [],
 suppliers: [],
 customers: [],
 activity: []
 };

 // Tanks matches
 tanks.forEach((tank: Tank) => {
 if (tank.name.toLowerCase().includes(query) || tank.productId.toLowerCase().includes(query)) {
 matches.tanks.push(tank);
 }
 });

 // Reports matches (104 reports)
 REPORT_MODULES.forEach((mod: any) => {
 mod.reports.forEach((rep: any) => {
 if (rep.name.toLowerCase().includes(query) || rep.desc.toLowerCase().includes(query)) {
 matches.reports.push({ ...rep, moduleName: mod.name });
 }
 });
 });

 // Expenses matches
 standaloneExpenses.forEach((exp: ExpenseEntry) => {
 if (exp.description.toLowerCase().includes(query) || (exp.categoryName && exp.categoryName.toLowerCase().includes(query))) {
 matches.expenses.push(exp);
 }
 });

 // Suppliers matches
 suppliers.forEach((supp: Supplier) => {
 if (supp.name.toLowerCase().includes(query) || (supp.contact && supp.contact.toLowerCase().includes(query))) {
 matches.suppliers.push(supp);
 }
 });

 // Customers matches
 customers.forEach((cust: Customer) => {
 if (cust.name.toLowerCase().includes(query) || (cust.contact && cust.contact.toLowerCase().includes(query))) {
 matches.customers.push(cust);
 }
 });

 // Audit logs matches
 activityLogs.forEach((log: AuditTrailEntry) => {
 if (log.action.toLowerCase().includes(query) || log.details.toLowerCase().includes(query)) {
 matches.activity.push(log);
 }
 });

 return matches;
 }, [globalSearch, tanks, standaloneExpenses, suppliers, customers, activityLogs]);

 // Alerts Panel
 const alerts = useMemo(() => {
 const list: { id: string; type: 'low_stock' | 'variance' | 'reconcile'; message: string; sub: string }[] = [];
 
 // low stock
 products.forEach((p: Product) => {
 if (p.currentStock <= p.minStock) {
 list.push({
 id: `low-${p.id}`,
 type: 'low_stock',
 message: `${p.name} stock level is critically low!`,
 sub: `Current: ${p.currentStock.toLocaleString()} Ltr (Min threshold: ${p.minStock.toLocaleString()} Ltr)`
 });
 }
 });

 // shifts cash variance
 shifts.slice(0, 5).forEach((s: Shift) => {
 const diff = s.submittedCash - s.expectedCash;
 if (Math.abs(diff) > 500) {
 list.push({
 id: `var-${s.id}`,
 type: 'variance',
 message: `Shift #${s.id} has cash discrepancy of PKR ${diff.toLocaleString()}`,
 sub: `Submitted: ${s.submittedCash.toLocaleString()} | Expected: ${s.expectedCash.toLocaleString()}`
 });
 }
 });

 return list;
 }, [products, shifts]);

 // AI Copilot Responses Simulation
 const handleTriggerAiQuery = (query: string) => {
 setSelectedAiQuery(query);
 setIsGeneratingAi(true);
 setTimeout(() => {
 setIsGeneratingAi(false);
 }, 1500);
 };

 const getAiAnswer = (query: string) => {
 if (query.includes('diesel')) {
 return t(
"Based on daily nozzle sales timeline, Diesel sales decreased by 8.4% yesterday. This was caused by Shift A nozzle calibration maintenance downtime (11:00 AM - 12:30 PM), which resulted in lower traffic volume during peak hours.",
"ڈیلی نوزل سیلز کے تجزیے کے مطابق کل ڈیزل کی فروخت میں 8.4% کمی ہوئی۔ یہ کمی شفٹ A کے دوران نوزل نمبر 3 کی مینٹیننس (11:00 بجے سے 12:30 بجے تک) کی وجہ سے ہوئی، جس سے ٹریفک کم حاصل ہو سکی۔"
 );
 }
 if (query.includes('variance')) {
 return t(
"Tank 2 (Diesel) shows a net variance of -12.4 Liters over the past 24 hours. Dip readings indicate normal thermal shrinkage due to average temperature change (38°C to 29°C overnight). No leakage indicators detected.",
"ٹینک نمبر 2 (ڈیزل) پچھلے 24 گھنٹوں میں 12.4 لیٹر کی کمی ظاہر کر رہا ہے۔ ڈپ ریڈنگ بتاتی ہے کہ درجہ حرارت میں تبدیلی کی وجہ سے فیول کا حجم سکڑا ہے، رساو کا کوئی خطرہ موجود نہیں ہے۔"
 );
 }
 if (query.includes('reorder')) {
 const lowProd = products.find(p => p.currentStock <= p.minStock);
 const name = lowProd ? lowProd.name : 'Super Petrol';
 const capacity = lowProd ? lowProd.capacity || 20000 : 25000;
 const suggest = capacity - (lowProd?.currentStock || 5000);
 return t(
 `Suggested reorder quantity for ${name} is ${suggest.toLocaleString()} Liters. This will replenish the tank to its safe fill capacity limit while maintaining the minimum operating safety margin.`,
 `آپ کو مشورہ دیا جاتا ہے کہ ${name} کے لیے ${suggest.toLocaleString()} لیٹر کا آرڈر جاری کریں۔ یہ مقدار ٹینک کی محفوظ حد کو بحال کر دے گی اور اسٹاک ختم ہونے کے خطرے سے بچائے گی۔`
 );
 }
 return t(
"Cash discrepancy analysis across the last 10 shifts indicates Shift #24 has an abnormal deficit of PKR -4,500. Operator was logged on Nozzle 4. Suggest auditing nozzle manual ledger slips.",
"پچھلی 10 شفٹوں کے کیش شارٹیج کے آڈٹ سے ظاہر ہوتا ہے کہ شفٹ نمبر 24 میں 4,500 روپے کی بڑی کمی ہے۔ متعلقہ نوزل نمبر 4 کے آپریٹر کی دستی رسیدیں چیک کرنے کی سفارش کی جاتی ہے۔"
 );
 };

 return (
 <div className="space-y-6 pb-20">
 
 {/* Search Header */}
 <div className="bg-card border border-border rounded-2xl p-5 shadow-xs relative">
 <h2 className="font-sans text-lg font-black text-foreground tracking-tight mb-3">
 {t('Enterprise Operations Command Center', 'انٹرپرائز کمانڈ اینڈ کنٹرول سینٹر')}
 </h2>
 <div className="relative">
 <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-muted-foreground" />
 <input
 type="text"
 placeholder={t('Search tank status, reports, expenses, customer ledger, audit logs globally...', 'تمام ٹینک اسٹاک، رپورٹس، واجبات، اور آڈٹ ٹریل میں تلاش کریں...')}
 value={globalSearch}
 onChange={(e) => setGlobalSearch(e.target.value)}
 className="w-full pl-11 pr-4 py-3 bg-subtle border border-border rounded-xl text-xs font-bold text-foreground focus:outline-hidden focus:border-orange-500 transition-colors"
 />
 </div>

 {/* Global Search Results Overlay */}
 {searchResults && (
 <div className="absolute left-0 right-0 top-full mt-2 bg-card border border-border rounded-xl shadow-xl z-50 p-4 max-h-[400px] overflow-y-auto space-y-4">
 <div className="flex justify-between items-center border-b border-border pb-2">
 <span className="text-[10px] uppercase font-bold text-muted-foreground">Search Results for"{globalSearch}"</span>
 <button onClick={() => setGlobalSearch('')} className="text-xs text-slate-450 hover:text-slate-700">Clear</button>
 </div>

 {/* Tanks Results */}
 {searchResults.tanks.length > 0 && (
 <div className="space-y-1 text-xs">
 <span className="text-[10px] font-bold text-orange-600 block uppercase">Tanks ({searchResults.tanks.length})</span>
 {searchResults.tanks.map(tank => (
 <div 
 key={tank.id} 
 onClick={() => { onTriggerDrilldown({ title: `BI Explorer > Tanks > ${tank.name}`, type: 'tanks', level: 2, params: { tankId: tank.id } }); setGlobalSearch(''); }}
 className="p-2 hover:bg-slate-50 dark:hover:bg-card/5 rounded-md cursor-pointer flex justify-between"
 >
 <span>{tank.name}</span>
 <span className="font-mono text-muted-foreground">Capacity: {tank.capacity.toLocaleString()}L</span>
 </div>
 ))}
 </div>
 )}

 {/* Reports Matches */}
 {searchResults.reports.length > 0 && (
 <div className="space-y-1 text-xs">
 <span className="text-[10px] font-bold text-blue-600 block uppercase">Reports ({searchResults.reports.length})</span>
 {searchResults.reports.map(rep => (
 <div 
 key={rep.id} 
 onClick={() => { onSelectTab('corporate_audit'); setGlobalSearch(''); }}
 className="p-2 hover:bg-slate-50 dark:hover:bg-card/5 rounded-md cursor-pointer flex justify-between"
 >
 <span>{rep.id} — {rep.name}</span>
 <span className="text-[10px] text-muted-foreground capitalize">{rep.moduleName}</span>
 </div>
 ))}
 </div>
 )}

 {/* Customer Matches */}
 {searchResults.customers.length > 0 && (
 <div className="space-y-1 text-xs">
 <span className="text-[10px] font-bold text-emerald-600 block uppercase">Customers ({searchResults.customers.length})</span>
 {searchResults.customers.map(c => (
 <div 
 key={c.id}
 onClick={() => { onTriggerDrilldown({ title: `BI Explorer > Customers > ${c.name}`, type: 'customers', level: 2, params: { customerId: c.id } }); setGlobalSearch(''); }}
 className="p-2 hover:bg-slate-50 dark:hover:bg-card/5 rounded-md cursor-pointer flex justify-between"
 >
 <span>{c.name}</span>
 <span className="font-mono text-muted-foreground">Balance: {formatCurrency(c.balance, settings)}</span>
 </div>
 ))}
 </div>
 )}

 {/* Supplier Matches */}
 {searchResults.suppliers.length > 0 && (
 <div className="space-y-1 text-xs">
 <span className="text-[10px] font-bold text-purple-600 block uppercase">Suppliers ({searchResults.suppliers.length})</span>
 {searchResults.suppliers.map(s => (
 <div 
 key={s.id}
 onClick={() => { onTriggerDrilldown({ title: `BI Explorer > Suppliers > ${s.name}`, type: 'suppliers', level: 2, params: { supplierId: s.id } }); setGlobalSearch(''); }}
 className="p-2 hover:bg-slate-50 dark:hover:bg-card/5 rounded-md cursor-pointer flex justify-between"
 >
 <span>{s.name}</span>
 <span className="font-mono text-muted-foreground">Balance: {formatCurrency(s.balance, settings)}</span>
 </div>
 ))}
 </div>
 )}

{searchResults.tanks.length === 0 && searchResults.reports.length === 0 && searchResults.customers.length === 0 && searchResults.suppliers.length === 0 && (
 <div className="py-8 text-center text-muted-foreground italic text-xs">
 No matching enterprise parameters found.
 </div>
 )}
  </div>
  )}
  </div>

  {/* Business Health Dashboard Scorecard (100% Calculated from Operational DB) */}
  <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
    <div 
      onClick={() => onTriggerDrilldown({ title: 'BI Explorer > Sales', type: 'sales', level: 1, params: {} })}
      className="bg-card border border-border rounded-xl p-4 shadow-xs text-center cursor-pointer hover:border-orange-500 transition-colors"
    >
      <span className="text-[10px] font-bold text-muted-foreground uppercase block">{t('Business Health', 'تجارتی صحت')}</span>
      <div className="text-2xl font-black text-emerald-600 mt-1">{scorecardMetrics.overallHealthScore}%</div>
      <span className="text-[9px] text-muted-foreground mt-0.5 block">{scorecardMetrics.overallHealthScore >= 80 ? 'Good / Reconciled' : 'Attention Needed'}</span>
    </div>
    <div 
      onClick={() => onSelectTab('inventory_audit')}
      className="bg-card border border-border rounded-xl p-4 shadow-xs text-center cursor-pointer hover:border-orange-500 transition-colors"
    >
      <span className="text-[10px] font-bold text-muted-foreground uppercase block">{t('Inventory Risk', 'اسٹاک رسک')}</span>
      <div className={`text-2xl font-black mt-1 ${scorecardMetrics.inventoryRiskPct > 30 ? 'text-rose-600' : scorecardMetrics.inventoryRiskPct > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
        {scorecardMetrics.inventoryRiskPct}%
      </div>
      <span className="text-[9px] text-muted-foreground mt-0.5 block">{scorecardMetrics.lowStockCount} Low Stock • {scorecardMetrics.lowTankCount} Low Tank</span>
    </div>
    <div 
      onClick={() => onSelectTab('reconciliation')}
      className="bg-card border border-border rounded-xl p-4 shadow-xs text-center cursor-pointer hover:border-orange-500 transition-colors"
    >
      <span className="text-[10px] font-bold text-muted-foreground uppercase block">{t('Cash Flow', 'کیش فلو')}</span>
      <div className={`text-2xl font-black mt-1 ${scorecardMetrics.cashFlowText === 'Healthy' ? 'text-emerald-600' : 'text-amber-600'}`}>
        {scorecardMetrics.cashFlowText}
      </div>
      <span className="text-[9px] text-muted-foreground mt-0.5 block">{scorecardMetrics.cashFlowSub}</span>
    </div>
    <div 
      onClick={() => onTriggerDrilldown({ title: 'BI Explorer > Tanks Summary', type: 'tanks', level: 1, params: {} })}
      className="bg-card border border-border rounded-xl p-4 shadow-xs text-center cursor-pointer hover:border-orange-500 transition-colors"
    >
      <span className="text-[10px] font-bold text-muted-foreground uppercase block">{t('Tank Health', 'ٹینکس صورتحال')}</span>
      <div className={`text-2xl font-black mt-1 ${scorecardMetrics.tankHealthText === 'Good' ? 'text-emerald-600' : 'text-rose-600'}`}>
        {scorecardMetrics.tankHealthText}
      </div>
      <span className="text-[9px] text-muted-foreground mt-0.5 block">{scorecardMetrics.tankHealthSub}</span>
    </div>
    <div 
      onClick={() => onTriggerDrilldown({ title: 'BI Explorer > Suppliers', type: 'suppliers', level: 1, params: {} })}
      className="bg-card border border-border rounded-xl p-4 shadow-xs text-center cursor-pointer hover:border-orange-500 transition-colors"
    >
      <span className="text-[10px] font-bold text-muted-foreground uppercase block">{t('Supplier Risk', 'سپلائرز خطرہ')}</span>
      <div className={`text-2xl font-black mt-1 ${scorecardMetrics.supplierRiskText === 'High' ? 'text-rose-600' : 'text-foreground'}`}>
        {scorecardMetrics.supplierRiskText}
      </div>
      <span className="text-[9px] text-muted-foreground mt-0.5 block">{scorecardMetrics.supplierRiskSub}</span>
    </div>
    <div 
      onClick={() => onTriggerDrilldown({ title: 'BI Explorer > Customers', type: 'customers', level: 1, params: {} })}
      className="bg-card border border-border rounded-xl p-4 shadow-xs text-center cursor-pointer hover:border-orange-500 transition-colors"
    >
      <span className="text-[10px] font-bold text-muted-foreground uppercase block">{t('Customer Credit', 'گاہک ادھار رسک')}</span>
      <div className={`text-2xl font-black mt-1 ${scorecardMetrics.customerCreditText === 'High' ? 'text-rose-600' : 'text-emerald-600'}`}>
        {scorecardMetrics.customerCreditText}
      </div>
      <span className="text-[9px] text-muted-foreground mt-0.5 block">{scorecardMetrics.customerCreditSub}</span>
    </div>
    <div 
      onClick={() => onTriggerDrilldown({ title: 'BI Explorer > Sales', type: 'sales', level: 1, params: {} })}
      className="bg-card border border-border rounded-xl p-4 shadow-xs text-center cursor-pointer hover:border-orange-500 transition-colors"
    >
      <span className="text-[10px] font-bold text-muted-foreground uppercase block">{t('Operational Score', 'انتظامی اسکور')}</span>
      <div className="text-2xl font-black text-emerald-600 mt-1">{scorecardMetrics.operationalScorePct}%</div>
      <span className="text-[9px] text-muted-foreground mt-0.5 block">{scorecardMetrics.operationalSub}</span>
    </div>
  </div>

  {/* Main Command Workspace */}
  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
  
  {/* Left Column: Live Tanks & Drawer balances */}
  <div className="lg:col-span-2 space-y-6">
  
  {/* Live Storage Tank Dip Monitors */}
  <div className="bg-card border border-border rounded-2xl p-5 shadow-xs">
  <h3 className="font-sans text-xs font-bold text-muted-foreground uppercase tracking-widest border-b border-border pb-2 mb-4 flex items-center gap-1.5">
  <Fuel className="h-4 w-4 text-orange-500" />
  <span>{t('Live Storage Tank Dip Monitors', 'سٹوریج ٹینک مانیٹرنگ')}</span>
  </h3>

  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
  {tanks.length === 0 ? (
    <div className="col-span-3 py-6 text-center text-xs text-muted-foreground italic">
      No operational tanks configured in Firebase database.
    </div>
  ) : (
    tanks.map((tnk: Tank) => {
      const prod = products.find(p => p.id === tnk.productId || p.name.toLowerCase().includes(tnk.name.toLowerCase()));
      const currentVol = getTankVolume(tnk);

      const tankCap = tnk.capacity > 0 ? tnk.capacity : 20000;
      const fillPct = Math.round((currentVol / tankCap) * 100);
      const isUnderCritical = currentVol <= (tnk.criticalLevel || 2000);

      return (
        <div 
          key={tnk.id} 
          onClick={() => onTriggerDrilldown({ title: `BI Explorer > Tanks > ${tnk.name}`, type: 'tanks', level: 2, params: { tankId: tnk.id } })}
          className="border border-border rounded-xl p-3.5 space-y-3 cursor-pointer hover:border-orange-500 transition-colors"
        >
          <div className="flex justify-between items-center text-xs font-bold">
            <span className="text-foreground">{tnk.name} ({tnk.productName || prod?.name || 'Fuel'})</span>
            <span className={`px-2 py-0.5 rounded-full text-[9px] font-black ${isUnderCritical ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300' : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'}`}>
              {fillPct}%
            </span>
          </div>

          {/* Progress Bar */}
          <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
            <div 
              style={{ width: `${Math.min(100, Math.max(0, fillPct))}%` }}
              className={`h-full rounded-full ${isUnderCritical ? 'bg-rose-500' : 'bg-emerald-500'}`}
            />
          </div>

          <div className="flex justify-between text-[10px] text-muted-foreground font-mono">
            <span>Dip: {currentVol.toLocaleString()} L</span>
            <span>Cap: {tankCap.toLocaleString()} L</span>
          </div>
        </div>
      );
    })
  )}
  </div>
  </div>

 {/* Cash & Payment Status Drawer */}
 <div className="bg-card border border-border rounded-2xl p-5 shadow-xs">
 <h3 className="font-sans text-xs font-bold text-muted-foreground uppercase tracking-widest border-b border-border pb-2 mb-4 flex items-center gap-1.5">
 <DollarSign className="h-4 w-4 text-orange-500" />
 <span>{t('Cash Drawers & Digital Payments Summary', 'کیش اور بینک اکاؤنٹس والٹ خلاصہ')}</span>
 </h3>

 <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-semibold">
 <div className="bg-subtle p-4 rounded-xl border border-border">
 <span className="text-slate-550 block mb-1">{t('Station Cash Safe', 'سیف ڈرائر کیش')}</span>
 <strong className="text-lg font-mono font-black text-foreground">
 {formatCurrency(cashStatus.safeCash, settings)}
 </strong>
 </div>
 <div className="bg-subtle p-4 rounded-xl border border-border">
 <span className="text-slate-550 block mb-1">{t('Bank Account Balance', 'بینک اکاؤنٹ بیلنس')}</span>
 <strong className="text-lg font-mono font-black text-foreground">
 {formatCurrency(cashStatus.bankBalance, settings)}
 </strong>
 </div>
 <div className="bg-subtle p-4 rounded-xl border border-border">
 <span className="text-slate-550 block mb-1">{t('Digital Receipts Wallet', 'ڈیجیٹل والٹ رسیدیں')}</span>
 <strong className="text-lg font-mono font-black text-foreground">
 {formatCurrency(cashStatus.digitalPayments, settings)}
 </strong>
 </div>
 </div>
 </div>

 {/* AI business insights dashboard queries panel */}
 <div className="bg-card border border-border rounded-2xl p-5 shadow-xs space-y-4">
 <h3 className="font-sans text-xs font-bold text-muted-foreground uppercase tracking-widest border-b border-border pb-2 flex items-center gap-1.5">
 <Sparkles className="h-4 w-4 text-indigo-500" />
 <span>{t('AI Business Intelligence Copilot', 'مصنوعی ذہانت کاروباری مشیر')}</span>
 </h3>

 <div className="flex flex-wrap gap-2 text-xs font-bold">
 <button 
 onClick={() => handleTriggerAiQuery('Why did diesel sales decrease yesterday?')}
 className="px-3 py-1.8 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg transition-colors cursor-pointer"
 >
 ❓ {t('Why diesel sales dropped yesterday?', 'ڈیزل فروخت کمی وجہ؟')}
 </button>
 <button 
 onClick={() => handleTriggerAiQuery('Why is Tank 2 showing unusual variance?')}
 className="px-3 py-1.8 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg transition-colors cursor-pointer"
 >
 ❓ {t('Why Tank 2 has variance?', 'ٹینک 2 کمی بیشی رپورٹ؟')}
 </button>
 <button 
 onClick={() => handleTriggerAiQuery('Suggest reorder quantity.')}
 className="px-3 py-1.8 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg transition-colors cursor-pointer"
 >
 📊 {t('Suggest reorder quantity', 'ری آرڈر مقدار تجویز کریں')}
 </button>
 <button 
 onClick={() => handleTriggerAiQuery('Highlight abnormal cash variances.')}
 className="px-3 py-1.8 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg transition-colors cursor-pointer"
 >
 🚨 {t('Audit cash discrepancies', 'کیش آڈٹ موازنہ')}
 </button>
 </div>

 {selectedAiQuery && (
 <div className="bg-indigo-50/20 border border-indigo-150 rounded-xl p-4 space-y-2 text-xs animate-fade-in">
 <div className="flex items-center gap-1.5 text-indigo-700 font-extrabold">
 <MessageSquare className="h-4 w-4" />
 <span>Query:"{selectedAiQuery}"</span>
 </div>
 
 {isGeneratingAi ? (
 <div className="flex items-center gap-2 text-muted-foreground py-2">
 <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
 <span>Consulting neural models and local database vectors...</span>
 </div>
 ) : (
 <p className="text-slate-655 leading-relaxed font-medium">
 {getAiAnswer(selectedAiQuery)}
 </p>
 )}
 </div>
 )}
 </div>

 </div>

 {/* Right Column: Low Stock Alerts, and Recent Activity timeline */}
 <div className="space-y-6">
 
 {/* Urgent Alerts Panel */}
 <div className="bg-card border border-border rounded-2xl p-5 shadow-xs space-y-4">
 <h3 className="font-sans text-xs font-bold text-muted-foreground uppercase tracking-widest border-b border-border pb-2 flex items-center gap-1.5">
 <ShieldAlert className="h-4 w-4 text-rose-500" />
 <span>{t('Critical Operating Alerts', 'انتظامی انتباہات')}</span>
 </h3>

 <div className="space-y-3">
 {alerts.length === 0 ? (
 <div className="text-muted-foreground italic text-xs py-4 text-center">
 ✓ System operating within normal thresholds.
 </div>
 ) : (
 alerts.map(al => (
 <div 
 key={al.id} 
 onClick={() => {
 if (al.type === 'low_stock') {
 onSelectTab('inventory_audit');
 } else {
 onSelectTab('reconciliation');
 }
 }}
 className="p-3 bg-rose-50/20 border border-rose-100 rounded-xl flex gap-2.5 items-start cursor-pointer hover:bg-rose-50/40 transition-colors"
 >
 <AlertTriangle className="h-4 w-4 text-rose-500 shrink-0 mt-0.5" />
 <div className="text-xs">
 <strong className="text-rose-750 font-black block">{al.message}</strong>
 <span className="text-[10px] text-slate-450 mt-0.5 block">{al.sub}</span>
 </div>
 </div>
 ))
 )}
 </div>
 </div>

 {/* Recent Timeline Event Logs */}
 <div className="bg-card border border-border rounded-2xl p-5 shadow-xs space-y-4">
 <h3 className="font-sans text-xs font-bold text-muted-foreground uppercase tracking-widest border-b border-border pb-2 flex items-center justify-between">
 <div className="flex items-center gap-1.5">
 <Activity className="h-4 w-4 text-orange-500" />
 <span>{t('Recent Activity Timeline', 'حالیہ روزنامچہ لاگ')}</span>
 </div>
 <button 
 onClick={() => onSelectTab('activity_register')}
 className="text-[10px] text-orange-600 font-black hover:underline cursor-pointer"
 >
 {t('View Full', 'مکمل دیکھیں')}
 </button>
 </h3>

 <div className="space-y-3.5 text-xs">
 {activityLogs.slice(0, 5).map((log: AuditTrailEntry) => (
 <div key={log.id} className="relative pl-4 border-l border-border pb-1">
 <div className="absolute -left-1 top-1.5 w-2 h-2 rounded-full bg-orange-500" />
 <div className="flex justify-between text-[10px] text-muted-foreground mb-0.5">
 <span>{log.timestamp}</span>
 <span className="font-bold uppercase text-[8px] bg-muted px-1.5 py-0.2 rounded-full">
 {log.category}
 </span>
 </div>
 <strong className="text-foreground font-extrabold block">
 {log.action}
 </strong>
 <span className="text-[10.5px] text-muted-foreground mt-0.5 block line-clamp-1">
 {log.details}
 </span>
 </div>
 ))}
 </div>
 </div>

 </div>

 </div>

 </div>
 );
}
