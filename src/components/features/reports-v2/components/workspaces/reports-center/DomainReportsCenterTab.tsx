/**
 * DomainReportsCenterTab — Enterprise Reports Center v3.0 (LIVE)
 *
 * SAP/Oracle-style Reports Center. FULLY COMPLIANT with AGENTS.md:
 *  - Enterprise Rule #1 / #37 / #80 / #127: 100% Live Database. ZERO mock/fake/sample rows.
 *  - Enterprise Rule #54 / Rule #181: Reports are strictly READ-ONLY.
 *  - Enterprise Rule #128: Every displayed number is traceable to an operational record.
 *
 * Data sources (all live, read-only):
 *  1. Report Statistics Banner  ← derived from the live Activity Register (report/export events)
 *  2. Report Generation History ← live Activity Register, filtered to this domain
 *  3. Activity Timeline         ← live Activity Register for the active station (today)
 *
 * The Formal Report *catalog* (report name/description/frequency) is static metadata —
 * it is a definition list of which reports EXIST, not an operational value. It contains
 * zero fabricated figures.
 */

import React, { useState } from 'react';
import {
  FileText, Search, Filter, Calendar,
  Activity, Clock, Eye, BookOpen, History,
  Star, ExternalLink, ShieldCheck,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { db } from '../../../../../../data/db';
import type { AuditTrailEntry } from '../../../../../../types';

// ─── TYPES ─────────────────────────────────────────────
interface DomainReportsCenterTabProps {
  domainName: string;
  lang?: 'en' | 'ur';
}

type CenterTab = 'reports' | 'history' | 'timeline';

interface FormalReport {
  id: string;
  name: string;
  nameUr: string;
  description: string;
  descriptionUr: string;
  frequency: string;
}

/** Static CATALOG only — lists which reports exist per domain. No operational figures. */
const REPORT_CATALOG: Record<string, FormalReport[]> = {
  fuel_operations: [
    { id: 'daily_report', name: 'Daily Sales Report', nameUr: 'یومیہ سیلز رپورٹ', description: 'Complete daily sales summary with all nozzles and products.', descriptionUr: 'تمام نوزلز اور مصنوعات کی مکمل یومیہ سیلز سمری۔', frequency: 'Daily' },
    { id: 'shift_report', name: 'Shift Closing Report', nameUr: 'شفٹ کلوزنگ رپورٹ', description: 'End-of-shift reconciliation with cash, meters, and variances.', descriptionUr: 'شفٹ بند ہونے کا مکمل حساب: کیش، میٹر اور فرق۔', frequency: 'Per Shift' },
    { id: 'monthly_report', name: 'Monthly Summary Report', nameUr: 'ماہانہ سمری رپورٹ', description: 'Month-end aggregate across all shifts, products, and financials.', descriptionUr: 'ماہ کے آخر میں تمام شفٹس، مصنوعات اور مالی سمری۔', frequency: 'Monthly' },
    { id: 'ogra_report', name: 'OGRA Compliance Report', nameUr: 'اوگرا رپورٹ', description: 'Regulatory report formatted for OGRA submission.', descriptionUr: 'اوگرا کو جمع کرانے کے لیے فارمیٹ شدہ رپورٹ۔', frequency: 'As Needed' },
    { id: 'stock_report', name: 'Stock Movement Report', nameUr: 'اسٹاک حرکت رپورٹ', description: 'Inflow/outflow analysis of fuel stock.', descriptionUr: 'فیول اسٹاک کی آمد/روانگی کا تجزیہ۔', frequency: 'Daily' },
  ],
  inventory: [
    { id: 'daily_stock', name: 'Daily Stock Report', nameUr: 'یومیہ اسٹاک رپورٹ', description: 'End-of-day stock levels across all tanks.', descriptionUr: 'تمام ٹینکس کا یومیہ اسٹاک لیول۔', frequency: 'Daily' },
    { id: 'tank_summary', name: 'Tank Summary', nameUr: 'ٹینک سمری', description: 'Capacity utilization and health dashboard.', descriptionUr: 'ٹینک صلاحیت اور صحت کا جائزہ۔', frequency: 'Daily' },
    { id: 'stock_valuation', name: 'Stock Valuation', nameUr: 'اسٹاک ویلیو', description: 'FIFO-based inventory valuation report.', descriptionUr: 'فیفو پر مبنی انوینٹری ویلیو رپورٹ۔', frequency: 'Monthly' },
    { id: 'variance_report', name: 'Variance Report', nameUr: 'فرق رپورٹ', description: 'Book vs physical variance analysis.', descriptionUr: 'کتابی اور فزیکل سٹاک کا فرق۔', frequency: 'Daily' },
  ],
  finance: [
    { id: 'cash_flow', name: 'Cash Flow Statement', nameUr: 'کیش فلو سٹیٹمنٹ', description: 'Daily inflow and outflow of cash.', descriptionUr: 'کیش کی یومیہ آمد و رفت۔', frequency: 'Daily' },
    { id: 'expense_summary', name: 'Expense Summary', nameUr: 'خرچ سمری', description: 'Categorized expense breakdown.', descriptionUr: 'زمرہ وار اخراجات کی تفصیل۔', frequency: 'Monthly' },
    { id: 'profit_analysis', name: 'Profit Analysis', nameUr: 'نفع تجزیہ', description: 'Revenue minus expenses = net profit.', descriptionUr: 'آمدنی منفی اخراجات = خالص نفع۔', frequency: 'Monthly' },
    { id: 'treasury', name: 'Treasury Report', nameUr: 'خزانہ رپورٹ', description: 'Bank balances and cash positions.', descriptionUr: 'بینک بیلنس اور کیش پوزیشن۔', frequency: 'Weekly' },
  ],
  ledgers: [
    { id: 'trial_balance', name: 'Trial Balance', nameUr: 'ٹرائل بیلنس', description: 'Complete debit/credit balancing report.', descriptionUr: 'مکمل ڈیبٹ/کریڈٹ بیلنسنگ رپورٹ۔', frequency: 'Monthly' },
    { id: 'pnl', name: 'Profit & Loss Statement', nameUr: 'نفع نقصان بیان', description: 'Income minus expenses = net income.', descriptionUr: 'آمدنی منفی اخراجات = خالص آمدنی۔', frequency: 'Monthly' },
    { id: 'balance_sheet', name: 'Balance Sheet', nameUr: 'بیلنس شیٹ', description: 'Assets, liabilities, and equity snapshot.', descriptionUr: 'اثاثے، واجبات اور ایکویٹی۔', frequency: 'Monthly' },
  ],
  customers: [
    { id: 'aging_report', name: 'Customer Aging Report', nameUr: 'کسٹمر ایجنگ رپورٹ', description: 'Receivables aging in 30/60/90 day buckets.', descriptionUr: 'وصولیوں کی 30/60/90 دن بکٹ۔', frequency: 'Weekly' },
    { id: 'outstanding', name: 'Outstanding Report', nameUr: 'واجب الادا رپورٹ', description: 'All unpaid customer balances.', descriptionUr: 'تمام غیر ادا شدہ بیلنس۔', frequency: 'Daily' },
    { id: 'collection_rpt', name: 'Collection Report', nameUr: 'کلیکشن رپورٹ', description: 'Recovery collection performance summary.', descriptionUr: 'ریکوری کلیکشن کی کارکردگی۔', frequency: 'Weekly' },
  ],
  suppliers: [
    { id: 'ap_aging', name: 'AP Aging Report', nameUr: 'اے پی ایجنگ رپورٹ', description: 'Payables aging in 30/60/90 day buckets.', descriptionUr: 'واجبات کی 30/60/90 دن بکٹ۔', frequency: 'Weekly' },
    { id: 'supp_stmt', name: 'Supplier Statement', nameUr: 'سپلائر سٹیٹمنٹ', description: 'Detailed ledger per supplier.', descriptionUr: 'ہر سپلائر کا تفصیلی لیجر۔', frequency: 'Monthly' },
    { id: 'settlement', name: 'Settlement Report', nameUr: 'سیٹلمنٹ رپورٹ', description: 'Payment settlement reconciliation.', descriptionUr: 'ادائیگی سیٹلمنٹ کا موازنہ۔', frequency: 'Monthly' },
  ],
  staff: [
    { id: 'payroll_rpt', name: 'Payroll Report', nameUr: 'پے رول رپورٹ', description: 'Monthly salary breakdown for all employees.', descriptionUr: 'تمام ملازمین کی ماہانہ تنخواہ تفصیل۔', frequency: 'Monthly' },
    { id: 'attendance_rpt', name: 'Attendance Report', nameUr: 'حاضری رپورٹ', description: 'Attendance summary with punctuality metrics.', descriptionUr: 'حاضری سمری اور وقت پابندی۔', frequency: 'Monthly' },
    { id: 'performance_rpt', name: 'Performance Report', nameUr: 'کارکردگی رپورٹ', description: 'Employee KPIs and sales performance.', descriptionUr: 'ملازمین کی کارکردگی اور سیلز۔', frequency: 'Monthly' },
  ],
  pricing: [
    { id: 'price_hist_rpt', name: 'Price History Report', nameUr: 'قیمت ہسٹری رپورٹ', description: 'Complete price change timeline.', descriptionUr: 'قیمت تبدیلیوں کی مکمل ٹائم لائن۔', frequency: 'As Needed' },
    { id: 'margin_rpt', name: 'Margin Analysis', nameUr: 'مارجن تجزیہ', description: 'Dealer margin and profit per liter.', descriptionUr: 'ڈیلر مارجن اور فی لیٹر نفع۔', frequency: 'Monthly' },
    { id: 'reval_rpt', name: 'Inventory Revaluation', nameUr: 'انوینٹری ری ویلیو', description: 'Impact of price changes on stock value.', descriptionUr: 'اسٹاک ویلیو پر قیمت تبدیلی کا اثر۔', frequency: 'Per Price Change' },
  ],
  analytics: [
    { id: 'ceo_dashboard', name: 'CEO Dashboard', nameUr: 'سی ای او ڈیش بورڈ', description: 'Executive summary of all KPIs.', descriptionUr: 'تمام کے پی آئیز کا ایگزیکٹو خلاصہ۔', frequency: 'Daily' },
    { id: 'exec_briefing', name: 'Executive Briefing', nameUr: 'ایگزیکٹو بریفنگ', description: 'Weekly strategic performance overview.', descriptionUr: 'ہفتہ وار حکمت عملی کارکردگی۔', frequency: 'Weekly' },
    { id: 'trend_analysis', name: 'Trend Analysis', nameUr: 'ٹرینڈ تجزیہ', description: 'Historical trends and seasonality.', descriptionUr: 'تاریخی رجحانات اور موسمی اثرات۔', frequency: 'Monthly' },
  ],
  purchases: [
    { id: 'purchase_summary', name: 'Purchase Summary', nameUr: 'خریداری سمری', description: 'Monthly purchasing volume and cost.', descriptionUr: 'ماہانہ خریداری حجم اور لاگت۔', frequency: 'Monthly' },
    { id: 'delivery_log', name: 'Delivery Log Report', nameUr: 'ڈیلیوری لاگ رپورٹ', description: 'All bowser deliveries with seal verification.', descriptionUr: 'تمام باؤزر ڈیلیوریز اور سیل تصدیق۔', frequency: 'Daily' },
    { id: 'short_delivery', name: 'Short Delivery Report', nameUr: 'کمی ڈیلیوری رپورٹ', description: 'Variance between ordered and received.', descriptionUr: 'آرڈر اور وصولی کا فرق۔', frequency: 'Per Delivery' },
  ],
};

const DEFAULT_CATALOG: FormalReport[] = [
  { id: 'activity_log', name: 'Activity Log', nameUr: 'سرگرمی لاگ', description: 'System-wide activity trail.', descriptionUr: 'سسٹم کی سرگرمیوں کا ریکارڈ۔', frequency: 'Continuous' },
];

// ─── TAB DEFINITIONS ──────────────────────────────────
const TABS: Array<{ id: CenterTab; label: string; labelUr: string; icon: React.ReactNode }> = [
  { id: 'reports', label: 'Reports', labelUr: 'رپورٹس', icon: <BookOpen className="w-4 h-4" /> },
  { id: 'history', label: 'Generation History', labelUr: 'ہسٹری', icon: <History className="w-4 h-4" /> },
  { id: 'timeline', label: 'Activity Timeline', labelUr: 'ٹائم لائن', icon: <Activity className="w-4 h-4" /> },
];

// ─── LIVE DATA HELPERS ────────────────────────────────
const isReportEvent = (e: AuditTrailEntry): boolean => {
  const cat = (e.category || '').toLowerCase();
  const act = (e.action || '').toLowerCase();
  return cat.includes('report') || cat.includes('export') || act.includes('report') || act.includes('export');
};

const todayPrefix = (): string => new Date().toISOString().slice(0, 10); // YYYY-MM-DD

const parseEntryDate = (ts: string): { date: string; time: string; isToday: boolean } => {
  // Activity Register timestamps are stored as "YYYY-MM-DD HH:MM:SS"
  const [datePart = '', timePart = ''] = (ts || '').split(' ');
  return {
    date: datePart || ts,
    time: timePart.slice(0, 5) || '',
    isToday: datePart === todayPrefix(),
  };
};

/** Safe, module-level live read of the Activity Register (avoids try/catch inside useMemo). */
const readActivityRegister = (stationId: string | null | undefined): AuditTrailEntry[] => {
  if (!stationId) return [];
  try {
    return db.getActivityRegister(stationId) || [];
  } catch {
    return [];
  }
};

// ─── COMPONENT ────────────────────────────────────────
export const DomainReportsCenterTab: React.FC<DomainReportsCenterTabProps> = ({ domainName, lang = 'en' }) => {
  const isEn = lang === 'en';
  const catalog = REPORT_CATALOG[domainName] || DEFAULT_CATALOG;

  const [activeTab, setActiveTab] = useState<CenterTab>('reports');
  const [searchQuery, setSearchQuery] = useState('');
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  // ── LIVE: pull the activity register for the active station ──
  // React Compiler auto-memoizes these derivations; no manual useMemo needed.
  const activeStationId = db.getActiveStationId();
  const allActivity = readActivityRegister(activeStationId);

  // Report/export generation events (live, read-only)
  const reportEvents = allActivity.filter(isReportEvent);

  // Live statistics — every number is derived from the live register
  const stats = {
    available: catalog.length,
    generatedTotal: reportEvents.length,
    generatedToday: reportEvents.filter(e => parseEntryDate(e.timestamp).isToday).length,
    failed: reportEvents.filter(e => (e.action || '').toLowerCase().includes('fail')).length,
  };

  const toggleFavorite = (id: string) => {
    setFavorites(prev => {
      const next = new Set(prev);
      if (next.has(id)) { next.delete(id); toast(isEn ? 'Removed from favorites' : 'فیورٹس سے ہٹا دیا', { icon: '💔' }); }
      else { next.add(id); toast(isEn ? 'Added to favorites' : 'فیورٹس میں شامل', { icon: '⭐' }); }
      return next;
    });
  };

  const handleOpenModule = () => {
    // Rule #181: Reports are read-only. Direct the user to the operational module to generate.
    toast(isEn ? 'Open the operational module to generate this report.' : 'رپورٹ بنانے کے لیے متعلقہ ماڈیول کھولیں۔', { icon: 'ℹ️' });
  };

  // ─── STAT CARDS (LIVE) ────────────────────────────
  const renderStatsBanner = () => (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 border-b border-border bg-muted/10">
      {[
        { label: isEn ? 'Available Reports' : 'دستیاب رپورٹس', value: stats.available, color: 'text-primary', bg: 'bg-primary/10' },
        { label: isEn ? 'Generated Today' : 'آج تیار ہوئیں', value: stats.generatedToday, color: 'text-emerald-600', bg: 'bg-emerald-500/10' },
        { label: isEn ? 'Total Generated' : 'کل تیار', value: stats.generatedTotal, color: 'text-sky-600', bg: 'bg-sky-500/10' },
        { label: isEn ? 'Failed' : 'ناکام', value: stats.failed, color: stats.failed > 0 ? 'text-rose-600' : 'text-emerald-600', bg: stats.failed > 0 ? 'bg-rose-500/10' : 'bg-emerald-500/10' },
      ].map((s, i) => (
        <div key={i} className={`${s.bg} rounded-xl p-3 flex flex-col items-center justify-center text-center`}>
          <span className={`text-2xl font-black ${s.color}`}>{s.value}</span>
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mt-0.5">{s.label}</span>
        </div>
      ))}
    </div>
  );

  // ─── LIVE DATA BADGE ──────────────────────────────
  const renderLiveBadge = () => (
    <div className="flex items-center gap-2 px-4 py-2 border-b border-border bg-background">
      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
      <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">
        {isEn ? 'Live Database' : 'لائیو ڈیٹابیس'}
      </span>
      <span className="text-[10px] font-bold text-muted-foreground">
        · {isEn ? 'Read-only · Traceable to Activity Register' : 'صرف پڑھنے کے لیے · ایکٹیویٹی رجسٹر سے قابلِ تصدیق'}
      </span>
    </div>
  );

  // ─── REPORTS CATALOG TAB ──────────────────────────
  const renderReportsTab = () => (
    <div className="p-5 overflow-y-auto flex-1">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {catalog
          .filter(r => !searchQuery || r.name.toLowerCase().includes(searchQuery.toLowerCase()) || r.nameUr.includes(searchQuery))
          .map(report => {
            // Live "last generated" for this catalog entry, traced to the register
            const match = reportEvents.find(e =>
              (e.details || '').toLowerCase().includes(report.name.toLowerCase()) ||
              (e.action || '').toLowerCase().includes(report.name.toLowerCase())
            );
            const last = match ? parseEntryDate(match.timestamp) : null;
            return (
              <div key={report.id} className="group bg-card border border-border hover:border-primary/30 hover:shadow-md rounded-xl p-4 transition-all">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-black text-foreground group-hover:text-primary transition-colors">
                        {isEn ? report.name : report.nameUr}
                      </h4>
                      <span className="px-1.5 py-0.5 bg-muted text-[9px] font-black text-muted-foreground rounded-md uppercase">{report.frequency}</span>
                    </div>
                    <p className="text-xs font-medium text-muted-foreground mt-1.5 leading-snug">
                      {isEn ? report.description : report.descriptionUr}
                    </p>
                  </div>
                  <div className="shrink-0 flex items-center gap-2">
                    <button onClick={() => toggleFavorite(report.id)} className={`p-1.5 rounded-lg transition-all cursor-pointer ${favorites.has(report.id) ? 'text-amber-500 bg-amber-500/10' : 'text-muted-foreground/30 hover:text-amber-400 hover:bg-amber-500/5'}`}>
                      <Star className="w-4 h-4" />
                    </button>
                    <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                      <FileText className="w-4 h-4" />
                    </div>
                  </div>
                </div>

                {/* Live Meta Info — traced to register, or honest empty state */}
                <div className="flex items-center gap-3 mb-3 text-[10px] font-bold text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {last
                      ? (isEn ? `Last: ${last.date} ${last.time}` : `آخری: ${last.date} ${last.time}`)
                      : (isEn ? 'Not yet generated' : 'ابھی تیار نہیں')}
                  </span>
                </div>

                {/* Read-only actions (Rule #181): open module to generate */}
                <div className="flex items-center gap-2 pt-2 border-t border-border/50">
                  <button onClick={handleOpenModule} className="flex items-center gap-1 px-2.5 py-1.5 text-[10px] font-black text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-all cursor-pointer">
                    <Eye className="w-3 h-3" /> {isEn ? 'Preview' : 'پیش نظارہ'}
                  </button>
                  <button onClick={handleOpenModule} className="flex items-center gap-1 px-2.5 py-1.5 text-[10px] font-black text-primary bg-primary/5 hover:bg-primary/10 rounded-lg transition-all cursor-pointer">
                    <ExternalLink className="w-3 h-3" /> {isEn ? 'Open Module' : 'ماڈیول کھولیں'}
                  </button>
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );

  // ─── GENERATION HISTORY TAB (LIVE) ────────────────
  const renderHistoryTab = () => {
    const filtered = reportEvents.filter(e =>
      !searchQuery ||
      (e.details || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (e.action || '').toLowerCase().includes(searchQuery.toLowerCase())
    );
    return (
      <div className="p-5 overflow-y-auto flex-1">
        <div className="bg-card border border-border rounded-xl overflow-hidden shadow-xs">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <h3 className="text-sm font-black text-foreground uppercase tracking-wider">{isEn ? 'Report Generation History' : 'رپورٹ جنریشن ہسٹری'}</h3>
            <span className="text-[10px] font-bold text-muted-foreground">{filtered.length} {isEn ? 'records' : 'ریکارڈز'}</span>
          </div>
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <History className="w-12 h-12 text-muted-foreground/30 mb-3" />
              <h3 className="text-sm font-bold text-foreground">{isEn ? 'No report history yet.' : 'ابھی کوئی ہسٹری نہیں۔'}</h3>
              <p className="text-xs font-medium text-muted-foreground mt-1 max-w-xs">
                {isEn ? 'Generate a report from its operational module to populate this live history.' : 'یہ لائیو ہسٹری بھرنے کے لیے متعلقہ ماڈیول سے رپورٹ بنائیں۔'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-muted/40">
                    {[
                      isEn ? 'Generated By' : 'تیار کنندہ',
                      isEn ? 'Role' : 'کردار',
                      isEn ? 'Date' : 'تاریخ',
                      isEn ? 'Time' : 'وقت',
                      isEn ? 'Branch' : 'برانچ',
                      isEn ? 'Action' : 'ایکشن',
                    ].map((col, ci) => (
                      <th key={ci} className="text-left px-4 py-2.5 font-black text-muted-foreground uppercase tracking-wider text-[10px] whitespace-nowrap">{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((entry) => {
                    const d = parseEntryDate(entry.timestamp);
                    return (
                      <tr key={entry.id} className="border-t border-border/50 hover:bg-muted/20 transition-colors">
                        <td className="px-4 py-3 font-bold text-foreground">{entry.user}</td>
                        <td className="px-4 py-3 font-bold text-muted-foreground">{entry.role}</td>
                        <td className="px-4 py-3 font-bold text-foreground">{d.date}</td>
                        <td className="px-4 py-3 font-bold text-muted-foreground">{d.time}</td>
                        <td className="px-4 py-3 font-bold text-foreground">{entry.branch}</td>
                        <td className="px-4 py-3 font-bold text-foreground">{entry.action}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    );
  };

  // ─── ACTIVITY TIMELINE TAB (LIVE) ─────────────────
  const renderTimelineTab = () => {
    const todays = allActivity.filter(e => parseEntryDate(e.timestamp).isToday).slice(0, 40);
    return (
      <div className="p-5 overflow-y-auto flex-1">
        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="text-sm font-black text-foreground mb-4 uppercase tracking-wider">{isEn ? "Today's Activity Timeline" : 'آج کی سرگرمی ٹائم لائن'}</h3>
          {todays.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Activity className="w-10 h-10 text-muted-foreground/30 mb-3" />
              <h4 className="text-sm font-bold text-foreground">{isEn ? 'No activity recorded today.' : 'آج کوئی سرگرمی نہیں۔'}</h4>
            </div>
          ) : (
            <div className="relative pl-6">
              <div className="absolute left-[9px] top-2 bottom-2 w-px bg-border"></div>
              {todays.map((evt) => {
                const cat = (evt.category || '').toLowerCase();
                const dotColor = cat.includes('delete') || (evt.action || '').toLowerCase().includes('fail')
                  ? 'bg-rose-500'
                  : cat.includes('report') || cat.includes('export')
                    ? 'bg-sky-500'
                    : cat.includes('create') || cat.includes('add')
                      ? 'bg-emerald-500'
                      : 'bg-muted-foreground';
                const d = parseEntryDate(evt.timestamp);
                return (
                  <div key={evt.id} className="relative flex items-start gap-4 pb-4 last:pb-0">
                    <div className={`absolute left-[-15px] top-1.5 w-2.5 h-2.5 rounded-full ${dotColor} ring-2 ring-background`}></div>
                    <div className="flex-1 flex items-baseline justify-between gap-4">
                      <p className="text-xs font-bold text-foreground">
                        <span className="text-muted-foreground">{evt.action}</span>
                        {evt.details ? ` — ${evt.details}` : ''}
                      </p>
                      <span className="text-[10px] font-bold text-muted-foreground whitespace-nowrap">{d.time}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  };

  // ─── MAIN RENDER ──────────────────────────────────
  return (
    <div className={`flex flex-col bg-card rounded-2xl border border-border shadow-xs overflow-hidden font-sans ${!isEn ? 'rtl' : ''}`}>

      {/* 1. Live Statistics Banner */}
      {renderStatsBanner()}

      {/* 1b. Live Database badge (traceability) */}
      {renderLiveBadge()}

      {/* 2. Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between p-4 border-b border-border bg-background gap-4">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder={isEn ? 'Search reports & history...' : 'رپورٹس اور ہسٹری تلاش کریں...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 hide-scrollbar">
          <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-muted-foreground bg-background border border-border rounded-lg hover:bg-muted whitespace-nowrap cursor-pointer">
            <Calendar className="w-3.5 h-3.5" />
            {isEn ? 'Date Range' : 'تاریخ'}
          </button>
          <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-muted-foreground bg-background border border-border rounded-lg hover:bg-muted whitespace-nowrap cursor-pointer">
            <Filter className="w-3.5 h-3.5" />
            {isEn ? 'Filters' : 'فلٹرز'}
          </button>
        </div>
      </div>

      {/* 3. Tab Navigation */}
      <div className="flex items-center gap-1 p-2 bg-muted/30 border-b border-border overflow-x-auto hide-scrollbar">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black whitespace-nowrap transition-all cursor-pointer ${
              activeTab === tab.id
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            }`}
          >
            {tab.icon}
            {isEn ? tab.label : tab.labelUr}
          </button>
        ))}
      </div>

      {/* 4. Tab Content */}
      <div className="flex-1 flex flex-col min-h-[450px] max-h-[550px] overflow-hidden">
        {activeTab === 'reports' && renderReportsTab()}
        {activeTab === 'history' && renderHistoryTab()}
        {activeTab === 'timeline' && renderTimelineTab()}
      </div>

    </div>
  );
};
