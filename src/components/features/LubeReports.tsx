/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * LubeReports.tsx
 * ---------------
 * FULLY INDEPENDENT Lube Business Reports Module.
 *
 * Data sources:
 *   ✅ lubePosSales   — All POS invoice transactions
 *   ✅ products       — Lube products only
 *   ✅ customers      — Lube customers
 *   ✅ staff          — Cashiers / staff
 *   ✅ standaloneExpenses — Business expenses
 *
 * Explicitly EXCLUDED (zero dependency):
 *   ❌ shifts, nozzles, tanks, rateHistory, pumps
 *   ❌ Fuel Station report templates (REPORT_TEMPLATES)
 */

import React, { useState, useMemo } from 'react';
import {
  FileBarChart2,
  TrendingUp,
  Package,
  Users,
  DollarSign,
  Receipt,
  BarChart2,
  Download,
  Printer,
  Search,
  Filter,
  ChevronDown,
  ChevronRight,
  ArrowUpDown,
  ShoppingCart,
  Star,
  Percent,
  Activity,
  CreditCard,
  PieChart as PieIcon,
  Sparkles
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  GlobalSettings,
  LubePosSale,
  Product,
  Customer,
  Staff,
  ExpenseEntry,
  Supplier,
} from '../../types';
import { formatCurrency, getCurrencySymbol } from '../../lib/currency';
import { LUBE_REPORT_TEMPLATES, LubeReportRow, LubeReportTemplate } from '../../lib/lubeReportCompilers';
import { fetchWithAuth } from '../../lib/api';
import EmptyState from '../ui/EmptyState';

// ==========================================
// PROPS
// ==========================================
interface LubeReportsProps {
  settings: GlobalSettings;
  lubePosSales: LubePosSale[];
  products: Product[];
  customers: Customer[];
  suppliers: Supplier[];
  staff: Staff[];
  standaloneExpenses: ExpenseEntry[];
}

// ==========================================
// COLOUR PALETTE
// ==========================================
const LUBE_COLORS = ['#7C3AED', '#0EA5E9', '#10B981', '#F59E0B', '#EF4444', '#EC4899', '#8B5CF6', '#14B8A6'];

// ==========================================
// MAIN COMPONENT
// ==========================================
export default function LubeReports({
  settings,
  lubePosSales,
  products,
  customers,
  suppliers,
  staff,
  standaloneExpenses,
}: LubeReportsProps) {
  const isUrdu = settings.language === 'ur';
  const t = (en: string, ur: string) => (isUrdu ? ur : en);

  // Active tab
  type TabId = 'analytics' | 'invoice_ledger' | 'product_perf' | 'customer_outstanding' | 'financial_summary';
  const [activeTab, setActiveTab] = useState<TabId>('analytics');

  // Corporate reports state
  const [selectedReportId, setSelectedReportId] = useState<string>('L1');
  const [expandedCategory, setExpandedCategory] = useState<string>('L');
  const [copiedCSV, setCopiedCSV] = useState(false);

  // Filters
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [filterStaffId, setFilterStaffId] = useState('all');
  const [filterProductId, setFilterProductId] = useState('all');
  const [filterEntityName, setFilterEntityName] = useState('all');
  const [filterPaymentMode, setFilterPaymentMode] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Sorting
  const [sortField, setSortField] = useState('');
  const [sortAscending, setSortAscending] = useState(true);

  // AI Analysis
  const [isGeneratingAiAnalysis, setIsGeneratingAiAnalysis] = useState(false);
  const [aiAnalysisResult, setAiAnalysisResult] = useState<string | null>(null);

  const generateAIReportAnalysis = async () => {
    if (sortedRows.length === 0) return;
    setIsGeneratingAiAnalysis(true);
    setAiAnalysisResult(null);
    try {
      const contextRows = sortedRows.slice(0, 50);
      const reportContext = {
        reportName: activeTemplate.name,
        totalAmount: tableAggregates.sumAmount,
        totalRecords: tableAggregates.recordsCount,
        data: contextRows
      };

      const response = await fetchWithAuth('/api/ai-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemPrompt: 'You are an AI financial auditor. Analyze the provided Lube report data. Highlight key trends, anomalies, top performers, or risk areas. Provide a concise professional summary in 3-4 sentences.',
          userMessage: JSON.stringify(reportContext),
          language: settings.language,
          conversationHistory: []
        })
      });

      if (!response.ok) throw new Error('Failed to generate AI analysis');
      const data = await response.json();
      setAiAnalysisResult(data.reply);
    } catch (error) {
      console.error(error);
      setAiAnalysisResult(t("⚠️ Could not generate AI analysis.", "⚠️ AI تجزیہ تیار نہیں ہو سکا۔"));
    } finally {
      setIsGeneratingAiAnalysis(false);
    }
  };

  // ========================================
  // KPI SUMMARY CARDS
  // ========================================
  const kpis = useMemo(() => {
    const sales = lubePosSales.filter(s => !s.isReturn && !s.isAdjustment);
    const totalRevenue = sales.reduce((s, x) => s + x.total, 0);
    const totalInvoices = sales.length;
    const avgInvoice = totalInvoices > 0 ? totalRevenue / totalInvoices : 0;
    const totalDiscount = sales.reduce((s, x) => s + x.discount, 0);
    const totalTax = sales.reduce((s, x) => s + x.tax, 0);

    // Top product
    const prodCounts: Record<string, number> = {};
    sales.forEach(sale => {
      sale.items.forEach(item => {
        prodCounts[item.productId] = (prodCounts[item.productId] || 0) + item.lineTotal;
      });
    });
    const topProdId = Object.entries(prodCounts).sort(([,a],[,b]) => b - a)[0]?.[0] || '';
    const topProd = products.find(p => p.id === topProdId);

    const totalExpenses = standaloneExpenses.reduce((s, e) => s + e.amount, 0);
    const netProfit = totalRevenue - totalExpenses;

    return { totalRevenue, totalInvoices, avgInvoice, totalDiscount, totalTax, topProd, netProfit, totalExpenses };
  }, [lubePosSales, products, standaloneExpenses]);

  // ========================================
  // ANALYTICS TAB: Daily Sales Trend
  // ========================================
  const dailySalesTrend = useMemo(() => {
    const byDate: Record<string, { date: string; Revenue: number; Invoices: number }> = {};
    lubePosSales
      .filter(s => !s.isReturn && !s.isAdjustment)
      .forEach(sale => {
        if (!byDate[sale.date]) byDate[sale.date] = { date: sale.date, Revenue: 0, Invoices: 0 };
        byDate[sale.date].Revenue  += sale.total;
        byDate[sale.date].Invoices += 1;
      });
    return Object.values(byDate).sort((a, b) => a.date.localeCompare(b.date));
  }, [lubePosSales]);

  // ========================================
  // ANALYTICS TAB: Product Revenue Pie
  // ========================================
  const productRevenuePie = useMemo(() => {
    const prodRev: Record<string, number> = {};
    lubePosSales
      .filter(s => !s.isReturn && !s.isAdjustment)
      .forEach(sale => {
        sale.items.forEach(item => {
          prodRev[item.productId] = (prodRev[item.productId] || 0) + item.lineTotal;
        });
      });
    return Object.entries(prodRev)
      .map(([productId, value]) => ({
        name: products.find(p => p.id === productId)?.name || productId,
        value,
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
  }, [lubePosSales, products]);

  // ========================================
  // ANALYTICS TAB: Payment Mode Chart
  // ========================================
  const paymentModeData = useMemo(() => {
    const modes: Record<string, number> = { cash: 0, bank: 0, digital: 0, credit: 0 };
    lubePosSales
      .filter(s => !s.isReturn && !s.isAdjustment)
      .forEach(sale => {
        modes[sale.paymentMode] = (modes[sale.paymentMode] || 0) + sale.total;
      });
    return Object.entries(modes)
      .filter(([,v]) => v > 0)
      .map(([name, value]) => ({
        name: name === 'cash' ? 'Cash' : name === 'bank' ? 'Bank' : name === 'digital' ? 'Digital' : 'Credit',
        value,
      }));
  }, [lubePosSales]);

  // ========================================
  // CORPORATE REPORTS: Compile active template
  // ========================================
  const activeTemplate = useMemo<LubeReportTemplate>(() => {
    return LUBE_REPORT_TEMPLATES.find(t => t.id === selectedReportId) || LUBE_REPORT_TEMPLATES[0];
  }, [selectedReportId]);

  const compiledRawRows = useMemo<LubeReportRow[]>(() => {
    return activeTemplate.compile({ lubePosSales, products, customers, staff, standaloneExpenses });
  }, [activeTemplate, lubePosSales, products, customers, staff, standaloneExpenses]);

  // Apply filters
  const filteredRows = useMemo(() => {
    return compiledRawRows.filter(row => {
      if (startDate && row.date && row.date !== '—' && row.date < startDate) return false;
      if (endDate && row.date && row.date !== '—' && row.date > endDate) return false;
      if (filterStaffId !== 'all' && row.staffId && row.staffId !== filterStaffId) return false;
      if (filterProductId !== 'all' && row.productId && row.productId !== filterProductId) return false;
      if (filterEntityName !== 'all' && row.entityName && !row.entityName.toLowerCase().includes(filterEntityName.toLowerCase())) return false;
      if (filterPaymentMode !== 'all' && row.paymentMode && row.paymentMode.toLowerCase() !== filterPaymentMode.toLowerCase()) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const strVal = Object.values(row).join(' ').toLowerCase();
        if (!strVal.includes(q)) return false;
      }
      return true;
    });
  }, [compiledRawRows, startDate, endDate, filterStaffId, filterProductId, filterEntityName, filterPaymentMode, searchQuery]);

  // Apply sorting
  const sortedRows = useMemo(() => {
    if (!sortField) return filteredRows;
    return [...filteredRows].sort((a, b) => {
      const aVal = (a as any)[sortField];
      const bVal = (b as any)[sortField];
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortAscending ? aVal - bVal : bVal - aVal;
      }
      const aStr = String(aVal || '').toLowerCase();
      const bStr = String(bVal || '').toLowerCase();
      return sortAscending ? aStr.localeCompare(bStr) : bStr.localeCompare(aStr);
    });
  }, [filteredRows, sortField, sortAscending]);

  const tableAggregates = useMemo(() => {
    const sumAmount = sortedRows.reduce((s, r) => s + (typeof r.amount === 'number' ? r.amount : 0), 0);
    return { sumAmount, recordsCount: sortedRows.length };
  }, [sortedRows]);

  // CSV Export
  const triggerCSVExport = () => {
    if (sortedRows.length === 0) return;
    const headers = activeTemplate.headers.map(h => h.label).join(',');
    const csvLines = sortedRows.map(r =>
      activeTemplate.headers.map(h => {
        let v: any = (r as any)[h.key as string] ?? '';
        if (typeof v === 'string') v = `"${v.replace(/"/g, '""')}"`;
        return v;
      }).join(',')
    );
    const built = [headers, ...csvLines].join('\n');
    const blob = new Blob([built], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `LubeReports_${activeTemplate.id}_Export.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setCopiedCSV(true);
    setTimeout(() => setCopiedCSV(false), 3000);
  };

  const TABS = [
    { id: 'analytics',            label: '📈 Sales Analytics',        urdu: '📈 فروخت تجزیہ' },
    { id: 'invoice_ledger',       label: '🧾 Invoice Ledger (50+ Reports)', urdu: '🧾 انوائس لیجر' },
    { id: 'product_perf',         label: '📦 Product Performance',    urdu: '📦 پروڈکٹ کارکردگی' },
    { id: 'customer_outstanding', label: '👥 Customer Outstanding',   urdu: '👥 کسٹمر بقایا' },
    { id: 'financial_summary',    label: '💰 Financial Summary',      urdu: '💰 مالیاتی خلاصہ' },
  ];

  // ========================================
  // CUSTOMER OUTSTANDING (tab)
  // ========================================
  const customerBalances = useMemo(() => {
    return customers
      .filter(c => c.balance > 0)
      .sort((a, b) => b.balance - a.balance);
  }, [customers]);

  // ========================================
  // PRODUCT PERFORMANCE (tab)
  // ========================================
  const productPerformance = useMemo(() => {
    const prodData: Record<string, { qty: number; revenue: number; invoices: number }> = {};
    lubePosSales
      .filter(s => !s.isReturn && !s.isAdjustment)
      .forEach(sale => {
        sale.items.forEach(item => {
          if (!prodData[item.productId]) prodData[item.productId] = { qty: 0, revenue: 0, invoices: 0 };
          prodData[item.productId].qty     += item.quantity;
          prodData[item.productId].revenue += item.lineTotal;
          prodData[item.productId].invoices++;
        });
      });

    return Object.entries(prodData)
      .map(([productId, d]) => ({ productId, ...d, product: products.find(p => p.id === productId) }))
      .sort((a, b) => b.revenue - a.revenue);
  }, [lubePosSales, products]);

  // ========================================
  // FINANCIAL SUMMARY (tab)
  // ========================================
  const financialPeriod = useMemo(() => {
    const totalRevenue = lubePosSales
      .filter(s => !s.isReturn && !s.isAdjustment)
      .reduce((s, x) => s + x.total, 0);
    const totalReturns = lubePosSales
      .filter(s => s.isReturn)
      .reduce((s, x) => s + x.total, 0);
    const netRevenue  = totalRevenue - Math.abs(totalReturns);
    const expenses    = standaloneExpenses.reduce((s, e) => s + e.amount, 0);
    const netProfit   = netRevenue - expenses;

    const byMonth: Record<string, { month: string; Revenue: number; Expenses: number }> = {};
    lubePosSales
      .filter(s => !s.isReturn && !s.isAdjustment)
      .forEach(sale => {
        const m = sale.date.slice(0, 7);
        if (!byMonth[m]) byMonth[m] = { month: m, Revenue: 0, Expenses: 0 };
        byMonth[m].Revenue += sale.total;
      });
    standaloneExpenses.forEach(exp => {
      const m = exp.date.slice(0, 7);
      if (!byMonth[m]) byMonth[m] = { month: m, Revenue: 0, Expenses: 0 };
      byMonth[m].Expenses += exp.amount;
    });

    const monthlyTrend = Object.values(byMonth).sort((a, b) => a.month.localeCompare(b.month));

    return { totalRevenue, totalReturns: Math.abs(totalReturns), netRevenue, expenses, netProfit, monthlyTrend };
  }, [lubePosSales, standaloneExpenses]);

  // ========================================
  // RENDER
  // ========================================
  return (
    <div className="space-y-6 pb-20 lg:pb-5">

      {/* HEADER */}
      <div className="flex flex-col gap-4 sm:flex-row items-center sm:justify-between border-b border-[var(--border-main)] pb-4">
        <div>
          <h2 className="font-sans text-2xl font-bold tracking-tight text-[var(--text-main)] flex items-center gap-2">
            <FileBarChart2 className="h-6 w-6 text-violet-600" />
            <span>{t('Lube Business Reports & Analytics', 'لیوب بزنس رپورٹس اور تجزیات')}</span>
          </h2>
          <p className="font-sans text-xs text-[var(--text-muted)] mt-1">
            {t('Independent reporting ecosystem for your Lubricants POS business — invoices, products, customers, financials.', 'لیوب پی او ایس بزنس کا مکمل آزاد رپورٹنگ نظام — انوائسز، پراڈکٹس، کسٹمرز اور مالیاتی تجزیہ۔')}
          </p>
        </div>
        <button
          onClick={() => window.print()}
          className="flex items-center justify-center gap-1.5 rounded-lg border border-[var(--border-main)] bg-[var(--bg-card)] px-4 py-2 font-sans text-xs font-bold text-[var(--text-main)] shadow-xs hover:opacity-80 transition-all cursor-pointer self-start sm:self-center"
        >
          <Printer className="h-4 w-4" />
          <span>{t('Print Page', 'پرنٹ کریں')}</span>
        </button>
      </div>

      {/* KPI CARDS ROW */}
      <div className="grid grid-cols-1 sm:grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {[
          { label: t('Total Revenue', 'کل آمدنی'),    value: formatCurrency(kpis.totalRevenue, settings),     icon: DollarSign,   color: 'text-violet-600' },
          { label: t('Invoices Issued', 'انوائسز'),   value: String(kpis.totalInvoices),                      icon: Receipt,      color: 'text-sky-600' },
          { label: t('Avg Invoice', 'اوسط انوائس'),   value: formatCurrency(kpis.avgInvoice, settings),       icon: BarChart2,    color: 'text-emerald-600' },
          { label: t('Discounts Given', 'چھوٹ دی'),   value: formatCurrency(kpis.totalDiscount, settings),    icon: Percent,      color: 'text-amber-600' },
          { label: t('Top Seller', 'سب سے زیادہ'),    value: kpis.topProd?.name || '—',                       icon: Star,         color: 'text-pink-600' },
          { label: t('Net Profit Est.', 'تخمینہ بچت'), value: formatCurrency(kpis.netProfit, settings),       icon: TrendingUp,   color: kpis.netProfit >= 0 ? 'text-emerald-600' : 'text-rose-600' },
        ].map((kpi, i) => (
          <div key={i} className="rounded-xl border border-[var(--border-main)] bg-[var(--bg-card)] p-3.5 shadow-sm flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="font-sans text-[9.5px] font-bold text-[var(--text-muted)] uppercase tracking-widest leading-tight">{kpi.label}</span>
              <kpi.icon className={`h-4 w-4 ${kpi.color} opacity-70`} />
            </div>
            <strong className={`font-mono text-sm font-bold tracking-tight ${kpi.color}`}>{kpi.value}</strong>
          </div>
        ))}
      </div>

      {/* TAB SELECTOR */}
      <div className="flex flex-wrap gap-1 border-b border-[var(--border-main)] pb-0">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as TabId)}
            className={`px-4 py-2.5 font-sans text-xs font-bold transition-all border-b-2 cursor-pointer ${
              activeTab === tab.id
                ? 'border-violet-600 text-violet-600 font-extrabold'
                : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-main)]'
            }`}
          >
            {t(tab.label, tab.urdu)}
          </button>
        ))}
      </div>

      {/* ================================================
          TAB 1: SALES ANALYTICS
          ================================================ */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">

          {/* Daily Revenue Trend */}
          <div className="rounded-xl border border-[var(--border-main)] bg-[var(--bg-card)] p-5 shadow-sm space-y-4">
            <h3 className="font-sans text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest flex items-center gap-1.5 border-b border-[var(--border-main)] pb-2 mb-3">
              <TrendingUp className="h-4 w-4 text-violet-500" />
              <span>{t('Daily Revenue Trend', 'یومیہ آمدنی رجحان')}</span>
            </h3>
            {dailySalesTrend.length === 0 ? (
              <EmptyState icon={Activity} title={t('No sales recorded yet.', 'ابھی تک کوئی فروخت درج نہیں۔')} description={t('Complete a Lube POS sale to see charts here.', 'چارٹ دیکھنے کے لیے لیوب پی او ایس سے پہلی فروخت کریں۔')} />
            ) : (
              <div className="h-64 w-full text-xs font-mono">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={dailySalesTrend} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <defs>
                      <linearGradient id="lubeRevGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#7C3AED" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#7C3AED" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-main)" />
                    <XAxis dataKey="date" stroke="var(--text-muted)" />
                    <YAxis stroke="var(--text-muted)" />
                    <Tooltip formatter={(v: any) => formatCurrency(Number(v), settings)} />
                    <Legend />
                    <Area type="monotone" dataKey="Revenue" stroke="#7C3AED" strokeWidth={2} fillOpacity={1} fill="url(#lubeRevGrad)" name={t('Net Revenue', 'خالص آمدنی')} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 lg:grid-cols-2">

            {/* Product Revenue Pie */}
            <div className="rounded-xl border border-[var(--border-main)] bg-[var(--bg-card)] p-5 shadow-sm space-y-4">
              <h3 className="font-sans text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest flex items-center gap-1.5 border-b border-[var(--border-main)] pb-2 mb-3">
                <PieIcon className="h-4 w-4 text-sky-500" />
                <span>{t('Revenue by Product', 'پروڈکٹ وائز آمدنی')}</span>
              </h3>
              {productRevenuePie.length === 0 ? (
                <div className="h-48 flex items-center justify-center text-[var(--text-muted)] text-xs">{t('No product data.', 'پروڈکٹ ڈیٹا نہیں۔')}</div>
              ) : (
                <div className="h-48 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={productRevenuePie} cx="50%" cy="50%" outerRadius={80} dataKey="value" nameKey="name" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                        {productRevenuePie.map((_, i) => (
                          <Cell key={`cell-${i}`} fill={LUBE_COLORS[i % LUBE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v: any) => formatCurrency(Number(v), settings)} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            {/* Payment Mode Bar */}
            <div className="rounded-xl border border-[var(--border-main)] bg-[var(--bg-card)] p-5 shadow-sm space-y-4">
              <h3 className="font-sans text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest flex items-center gap-1.5 border-b border-[var(--border-main)] pb-2 mb-3">
                <CreditCard className="h-4 w-4 text-emerald-500" />
                <span>{t('Revenue by Payment Channel', 'ادائیگی چینل وائز آمدنی')}</span>
              </h3>
              {paymentModeData.length === 0 ? (
                <div className="h-48 flex items-center justify-center text-[var(--text-muted)] text-xs">{t('No payment data.', 'ادائیگی ڈیٹا نہیں۔')}</div>
              ) : (
                <div className="h-48 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={paymentModeData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-main)" />
                      <XAxis dataKey="name" stroke="var(--text-muted)" />
                      <YAxis stroke="var(--text-muted)" />
                      <Tooltip formatter={(v: any) => formatCurrency(Number(v), settings)} />
                      <Bar dataKey="value" radius={[4, 4, 0, 0]} name={t('Revenue', 'آمدنی')}>
                        {paymentModeData.map((_, i) => (
                          <Cell key={`cell-${i}`} fill={LUBE_COLORS[i % LUBE_COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

          </div>
        </div>
      )}

      {/* ================================================
          TAB 2: INVOICE LEDGER (Corporate Report Console)
          ================================================ */}
      {activeTab === 'invoice_ledger' && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 items-start">

          {/* LEFT: Report Directory */}
          <div className="rounded-xl border border-[var(--border-main)] bg-[var(--bg-card)] p-4 shadow-xs space-y-3 lg:sticky lg:top-5">
            <span className="font-sans text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-widest block border-b border-[var(--border-main)] pb-1.5">
              {t('Lube Report Directory', 'لیوب رپورٹس انڈیکس')}
            </span>
            <div className="space-y-1">
              <button
                onClick={() => setExpandedCategory(expandedCategory === 'L' ? '' : 'L')}
                className={`w-full flex items-center justify-between p-2.5 rounded-lg font-sans text-xs font-bold text-left transition-colors cursor-pointer ${
                  expandedCategory === 'L' ? 'bg-violet-50 text-violet-700' : 'bg-[var(--bg-secondary)] text-[var(--text-main)] hover:opacity-80'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <FileBarChart2 className="h-4 w-4" />
                  <span>{t('Lube POS Reports (L1–L9)', 'لیوب پی او ایس رپورٹیں')}</span>
                </div>
                {expandedCategory === 'L' ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
              </button>

              {expandedCategory === 'L' && (
                <div className="p-1.5 bg-[var(--bg-card)] space-y-1">
                  {LUBE_REPORT_TEMPLATES.map(rep => {
                    const isActive = selectedReportId === rep.id;
                    return (
                      <button
                        key={rep.id}
                        onClick={() => setSelectedReportId(rep.id)}
                        className={`w-full text-left p-2 rounded-md font-sans text-[11px] font-semibold transition-all cursor-pointer block ${
                          isActive
                            ? 'bg-slate-900 text-white font-extrabold'
                            : 'text-[var(--text-muted)] hover:bg-[var(--bg-secondary)] hover:text-[var(--text-main)]'
                        }`}
                      >
                        {isUrdu ? rep.urduName : rep.name}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* RIGHT: Active Report + Filters + Table */}
          <div className="lg:col-span-3 space-y-5">

            {/* Report Description */}
            <div className="rounded-xl border border-[var(--border-main)] bg-[var(--bg-card)] p-5 shadow-xs relative">
              <span className="font-mono text-[9px] font-bold text-violet-600 uppercase tracking-widest bg-violet-50 px-2 py-0.5 rounded-sm absolute top-4 right-4">
                Ref: {activeTemplate.id}
              </span>
              <h3 className="font-sans text-lg font-extrabold text-[var(--text-main)] tracking-tight">
                {isUrdu ? activeTemplate.urduName : activeTemplate.name}
              </h3>
              <p className="font-sans text-xs text-[var(--text-muted)] mt-1 italic">
                {isUrdu ? activeTemplate.urduDescription : activeTemplate.description}
              </p>
            </div>

            {/* Filter Controls */}
            <div className="rounded-xl border border-[var(--border-main)] bg-[var(--bg-secondary)] p-4 space-y-3">
              <div className="flex items-center gap-1 text-xs font-bold text-[var(--text-main)]">
                <Filter className="h-3.5 w-3.5 text-violet-500" />
                <span>{t('Filter & Search Controls', 'فلٹر اور تلاش')}</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:grid-cols-4 text-xs font-sans">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-[var(--text-muted)] mb-1">{t('Start Date', 'شروع تاریخ')}</label>
                  <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
                    className="w-full rounded-lg border border-[var(--border-main)] bg-[var(--bg-card)] p-2 text-[11px] font-semibold text-[var(--text-main)] outline-hidden focus:border-violet-500" />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-[var(--text-muted)] mb-1">{t('End Date', 'آخری تاریخ')}</label>
                  <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)}
                    className="w-full rounded-lg border border-[var(--border-main)] bg-[var(--bg-card)] p-2 text-[11px] font-semibold text-[var(--text-main)] outline-hidden focus:border-violet-500" />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-[var(--text-muted)] mb-1">{t('Cashier / Staff', 'کیشیئر')}</label>
                  <select value={filterStaffId} onChange={e => setFilterStaffId(e.target.value)}
                    className="w-full rounded-lg border border-[var(--border-main)] bg-[var(--bg-card)] p-2 text-[11px] font-semibold text-[var(--text-main)] outline-hidden focus:border-violet-500">
                    <option value="all">{t('— All Staff —', 'تمام عملہ')}</option>
                    {staff.map(st => <option key={st.id} value={st.id}>{st.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-[var(--text-muted)] mb-1">{t('Payment Mode', 'ادائیگی')}</label>
                  <select value={filterPaymentMode} onChange={e => setFilterPaymentMode(e.target.value)}
                    className="w-full rounded-lg border border-[var(--border-main)] bg-[var(--bg-card)] p-2 text-[11px] font-semibold text-[var(--text-main)] outline-hidden focus:border-violet-500">
                    <option value="all">{t('— All Modes —', 'تمام طریقے')}</option>
                    <option value="cash">Cash</option>
                    <option value="bank">Bank Transfer</option>
                    <option value="digital">Digital Wallet</option>
                    <option value="credit">Credit</option>
                  </select>
                </div>
              </div>
              <div className="relative">
                <Search className="h-3.5 w-3.5 text-[var(--text-muted)] absolute left-2.5 top-2.5" />
                <input type="text" placeholder={t('Search report data...', 'رپورٹ میں تلاش کریں...')}
                  value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-8 rounded-lg border border-[var(--border-main)] bg-[var(--bg-card)] p-2 text-[11px] font-semibold text-[var(--text-main)] outline-hidden focus:border-violet-500" />
              </div>
            </div>

            {/* Aggregates + Export Bar */}
            <div className="flex flex-col gap-3 sm:flex-row items-center sm:justify-between bg-slate-900 rounded-xl p-4 text-white font-sans text-xs shadow-xs">
              <div className="flex items-center gap-4">
                <div>
                  <span className="text-slate-400 block text-[9px] uppercase tracking-wider">{t('MATCHED RECORDS', 'کل ریکارڈز')}</span>
                  <span className="font-mono text-sm font-extrabold">{tableAggregates.recordsCount} {t('Rows', 'لائنز')}</span>
                </div>
                {tableAggregates.sumAmount !== 0 && (
                  <div className="border-l border-slate-700 pl-4">
                    <span className="text-slate-400 block text-[9px] uppercase tracking-wider">{t('TOTAL AMOUNT', 'کل مبلغ')}</span>
                    <span className="font-mono text-sm font-extrabold text-violet-400">{formatCurrency(tableAggregates.sumAmount, settings)}</span>
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={generateAIReportAnalysis}
                  disabled={isGeneratingAiAnalysis || sortedRows.length === 0}
                  className={`flex items-center justify-center gap-1.5 rounded-lg bg-violet-600 px-4 py-2 font-sans text-xs font-bold text-white shadow-sm hover:bg-violet-700 transition-colors cursor-pointer ${isGeneratingAiAnalysis ? 'opacity-50' : ''}`}
                >
                  <Sparkles className={`h-4 w-4 ${isGeneratingAiAnalysis ? 'animate-spin' : ''}`} />
                  <span>{t('AI Analysis', 'اے آئی تجزیہ')}</span>
                </button>
                <button onClick={triggerCSVExport}
                  className="flex items-center justify-center gap-1.5 rounded-lg bg-orange-600 px-4 py-2.5 sm:py-2 min-h-[48px] sm:min-h-[40px] font-sans text-xs font-bold text-white shadow-sm hover:bg-orange-700 transition-colors cursor-pointer">
                  <Download className="h-4 w-4" />
                  <span>{copiedCSV ? t('Downloaded!', 'ڈاؤنلوڈ مکمل!') : t('Export CSV', 'ایکسل ڈاؤنلوڈ')}</span>
                </button>
              </div>
            </div>

            {aiAnalysisResult && (
              <div className="rounded-xl border border-violet-200 bg-violet-50 p-4 shadow-sm relative">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="h-4 w-4 text-violet-500" />
                  <span className="font-bold text-violet-800 text-sm">{t('AI Report Analysis', 'اے آئی رپورٹ کا تجزیہ')}</span>
                </div>
                <div className="prose prose-sm max-w-none text-violet-900 whitespace-pre-wrap leading-relaxed text-xs">
                  {aiAnalysisResult}
                </div>
              </div>
            )}

            {/* Data Table */}
            <div className="rounded-xl border border-[var(--border-main)] bg-[var(--bg-card)] shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left font-sans text-xs">
                  <thead>
                    <tr className="bg-[var(--bg-secondary)] border-b border-[var(--border-main)] text-[var(--text-muted)] font-bold select-none whitespace-nowrap">
                      {activeTemplate.headers.map(h => (
                        <th
                          key={h.key}
                          onClick={() => {
                            if (sortField === h.key) setSortAscending(!sortAscending);
                            else { setSortField(h.key); setSortAscending(true); }
                          }}
                          className={`py-3 px-4 text-[11px] uppercase tracking-wider cursor-pointer hover:bg-[var(--bg-card)] transition-colors ${h.isNumeric ? 'text-right' : ''}`}
                        >
                          <div className={`flex items-center gap-1.5 ${h.isNumeric ? 'justify-end' : ''}`}>
                            <span>{isUrdu ? h.urduLabel : h.label}</span>
                            <ArrowUpDown className="h-3 w-3 text-[var(--text-muted)] opacity-50" />
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border-main)] font-medium">
                    {sortedRows.length === 0 ? (
                      <tr>
                        <td colSpan={activeTemplate.headers.length} className="py-24 text-center text-[var(--text-muted)] font-sans italic">
                          {t('No records match your filter criteria.', 'فلٹر معیار کے مطابق کوئی ریکارڈ نہیں ملا۔')}
                        </td>
                      </tr>
                    ) : (
                      sortedRows.map((row, idx) => (
                        <tr key={row.id} className={`hover:bg-[var(--bg-secondary)] transition-colors ${idx % 2 === 0 ? 'bg-[var(--bg-card)]' : 'bg-[var(--bg-secondary)]/30'}`}>
                          {activeTemplate.headers.map(h => {
                            const cellValue = (row as any)[h.key as string];
                            if (h.key === 'amount') {
                              const numVal = Number(cellValue || 0);
                              return (
                                <td key={h.key} className="py-2.5 px-4 text-right font-mono font-bold">
                                  <span className={numVal >= 0 ? 'text-[var(--text-main)]' : 'text-rose-600'}>
                                    {formatCurrency(numVal, settings)}
                                  </span>
                                </td>
                              );
                            }
                            let formatted = String(cellValue ?? '');
                            if (formatted.includes('Rs.')) {
                              formatted = formatted.replace(/Rs\./g, getCurrencySymbol(settings));
                            }
                            return (
                              <td key={h.key} className={`py-2.5 px-4 text-[var(--text-main)] ${h.isNumeric ? 'text-right font-mono' : ''}`}>
                                {formatted}
                              </td>
                            );
                          })}
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================================================
          TAB 3: PRODUCT PERFORMANCE
          ================================================ */}
      {activeTab === 'product_perf' && (
        <div className="space-y-6">
          <div className="rounded-xl border border-[var(--border-main)] bg-[var(--bg-card)] p-5 shadow-sm">
            <h3 className="font-sans text-sm font-bold text-[var(--text-main)] uppercase tracking-wider border-b border-[var(--border-main)] pb-2 mb-4 flex items-center gap-2">
              <Package className="h-4 w-4 text-sky-500" />
              <span>{t('Product Sales Performance Ranking', 'پروڈکٹ فروخت کارکردگی رینکنگ')}</span>
            </h3>
            {productPerformance.length === 0 ? (
              <EmptyState icon={Package} title={t('No product sales yet.', 'پروڈکٹ فروخت ڈیٹا نہیں۔')} description="" />
            ) : (
              <div className="overflow-x-auto rounded-lg border border-[var(--border-main)]">
                <table className="w-full border-collapse text-left font-sans text-xs">
                  <thead>
                    <tr className="bg-[var(--bg-secondary)] border-b border-[var(--border-main)] text-[var(--text-muted)] font-bold">
                      <th className="py-2.5 px-4">#</th>
                      <th className="py-2.5 px-4">{t('Product Name', 'پروڈکٹ')}</th>
                      <th className="py-2.5 px-4">{t('Unit', 'یونٹ')}</th>
                      <th className="py-2.5 px-4 text-right">{t('Qty Sold', 'مقدار')}</th>
                      <th className="py-2.5 px-4 text-right">{t('Revenue (PKR)', 'آمدنی')}</th>
                      <th className="py-2.5 px-4 text-right">{t('Avg Unit Price', 'اوسط ریٹ')}</th>
                      <th className="py-2.5 px-4">{t('Stock Level', 'اسٹاک')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border-main)] text-[var(--text-main)] font-medium">
                    {productPerformance.map((item, idx) => {
                      const avgUnit = item.qty > 0 ? item.revenue / item.qty : 0;
                      const isLowStock = item.product && item.product.currentStock <= item.product.minStock;
                      return (
                        <tr key={item.productId} className="hover:bg-[var(--bg-secondary)]/50">
                          <td className="py-3 px-4">
                            <span className={`font-mono font-bold text-sm ${idx === 0 ? 'text-amber-500' : idx === 1 ? 'text-slate-400' : idx === 2 ? 'text-orange-600' : 'text-[var(--text-muted)]'}`}>
                              #{idx + 1}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-bold text-[var(--text-main)]">{item.product?.name || item.productId}</td>
                          <td className="py-3 px-4 text-[var(--text-muted)]">{item.product?.unit || 'pcs'}</td>
                          <td className="py-3 px-4 text-right font-mono font-bold">{item.qty.toLocaleString()}</td>
                          <td className="py-3 px-4 text-right font-mono font-bold text-violet-600">{formatCurrency(item.revenue, settings)}</td>
                          <td className="py-3 px-4 text-right font-mono text-[var(--text-muted)]">{formatCurrency(avgUnit, settings)}</td>
                          <td className="py-3 px-4">
                            {item.product ? (
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${isLowStock ? 'bg-rose-50 text-rose-700' : 'bg-emerald-50 text-emerald-700'}`}>
                                {isLowStock ? '⚠ Low Stock' : '✓ In Stock'} ({item.product.currentStock} {item.product.unit})
                              </span>
                            ) : '—'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================================================
          TAB 4: CUSTOMER OUTSTANDING
          ================================================ */}
      {activeTab === 'customer_outstanding' && (
        <div className="space-y-6">
          <div className="rounded-xl border border-[var(--border-main)] bg-[var(--bg-card)] p-5 shadow-sm">
            <h3 className="font-sans text-sm font-bold text-[var(--text-main)] uppercase tracking-wider border-b border-[var(--border-main)] pb-2 mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-amber-500" />
                <span>{t('Credit Customer Outstanding Balances', 'کریڈٹ کسٹمرز بقایا کھاتہ')}</span>
              </div>
              <span className="font-mono text-xs font-bold text-[var(--text-muted)]">
                {t('Total Debtors:', 'کل کھاتہ دار:')} {customerBalances.length}
              </span>
            </h3>
            {customerBalances.length === 0 ? (
              <EmptyState icon={Users} title={t('No outstanding balances.', 'کوئی بقایا رقم نہیں۔')} description={t('All customer accounts are settled.', 'تمام کسٹمر کھاتے صاف ہیں۔')} />
            ) : (
              <div className="overflow-x-auto rounded-lg border border-[var(--border-main)]">
                <table className="w-full border-collapse text-left font-sans text-xs">
                  <thead>
                    <tr className="bg-[var(--bg-secondary)] border-b border-[var(--border-main)] text-[var(--text-muted)] font-bold">
                      <th className="py-2.5 px-4">{t('Customer Name', 'کسٹمر نام')}</th>
                      <th className="py-2.5 px-4">{t('Contact', 'رابطہ')}</th>
                      <th className="py-2.5 px-4 text-right">{t('Credit Limit', 'ادھار حد')}</th>
                      <th className="py-2.5 px-4 text-right">{t('Outstanding Balance', 'بقایا رقم')}</th>
                      <th className="py-2.5 px-4 text-center">{t('Utilization', 'استعمال')}</th>
                      <th className="py-2.5 px-4 text-center">{t('Risk', 'خطرہ')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border-main)] text-[var(--text-main)] font-medium">
                    {customerBalances.map(cust => {
                      const utilPct = cust.creditLimit > 0 ? (cust.balance / cust.creditLimit) * 100 : 100;
                      const risk = utilPct >= 90 ? 'HIGH' : utilPct >= 60 ? 'MEDIUM' : 'LOW';
                      const riskColor = risk === 'HIGH' ? 'bg-rose-50 text-rose-700' : risk === 'MEDIUM' ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700';
                      return (
                        <tr key={cust.id} className="hover:bg-[var(--bg-secondary)]/50">
                          <td className="py-3 px-4 font-bold">{cust.name}</td>
                          <td className="py-3 px-4 font-mono text-[var(--text-muted)]">{cust.contact || '—'}</td>
                          <td className="py-3 px-4 text-right font-mono">{formatCurrency(cust.creditLimit, settings)}</td>
                          <td className="py-3 px-4 text-right font-mono font-extrabold text-rose-600">{formatCurrency(cust.balance, settings)}</td>
                          <td className="py-3 px-4 text-center">
                            <div className="flex flex-col items-center gap-1">
                              <span className="text-[10px] font-bold text-[var(--text-muted)]">{utilPct.toFixed(0)}%</span>
                              <div className="h-1.5 w-16 bg-[var(--bg-secondary)] rounded-full overflow-hidden">
                                <div className={`h-full rounded-full ${risk === 'HIGH' ? 'bg-rose-500' : risk === 'MEDIUM' ? 'bg-amber-500' : 'bg-emerald-500'}`}
                                  style={{ width: `${Math.min(100, utilPct)}%` }} />
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${riskColor}`}>{risk}</span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================================================
          TAB 5: FINANCIAL SUMMARY
          ================================================ */}
      {activeTab === 'financial_summary' && (
        <div className="space-y-6">

          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {[
              { label: t('Gross Revenue', 'خام آمدنی'),       value: financialPeriod.totalRevenue,   color: 'text-violet-600',  bg: 'bg-violet-50' },
              { label: t('Product Returns', 'واپسی'),          value: -financialPeriod.totalReturns,  color: 'text-rose-600',    bg: 'bg-rose-50' },
              { label: t('Net Revenue', 'خالص آمدنی'),         value: financialPeriod.netRevenue,     color: 'text-sky-600',     bg: 'bg-sky-50' },
              { label: t('Total Expenses', 'کل اخراجات'),      value: -financialPeriod.expenses,      color: 'text-amber-600',   bg: 'bg-amber-50' },
              { label: t('Net Profit', 'خالص منافع'),           value: financialPeriod.netProfit,      color: financialPeriod.netProfit >= 0 ? 'text-emerald-600' : 'text-rose-600', bg: financialPeriod.netProfit >= 0 ? 'bg-emerald-50' : 'bg-rose-50' },
            ].map((item, i) => (
              <div key={i} className={`rounded-xl border border-[var(--border-main)] p-4 shadow-sm flex flex-col gap-1.5 ${item.bg}`}>
                <span className="font-sans text-[9.5px] font-bold text-[var(--text-muted)] uppercase tracking-widest">{item.label}</span>
                <strong className={`font-mono text-sm font-bold ${item.color}`}>{formatCurrency(item.value, settings)}</strong>
              </div>
            ))}
          </div>

          {/* Monthly Trend Chart */}
          <div className="rounded-xl border border-[var(--border-main)] bg-[var(--bg-card)] p-5 shadow-sm">
            <h3 className="font-sans text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest flex items-center gap-1.5 border-b border-[var(--border-main)] pb-2 mb-3">
              <TrendingUp className="h-4 w-4 text-violet-500" />
              <span>{t('Monthly Revenue vs Expenses Trend', 'ماہانہ آمدنی بمقابلہ اخراجات')}</span>
            </h3>
            {financialPeriod.monthlyTrend.length === 0 ? (
              <div className="h-56 flex items-center justify-center text-[var(--text-muted)] text-xs font-sans">{t('No financial data available.', 'مالیاتی ڈیٹا دستیاب نہیں۔')}</div>
            ) : (
              <div className="h-56 w-full text-xs font-mono">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={financialPeriod.monthlyTrend} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-main)" />
                    <XAxis dataKey="month" stroke="var(--text-muted)" />
                    <YAxis stroke="var(--text-muted)" />
                    <Tooltip formatter={(v: any) => formatCurrency(Number(v), settings)} />
                    <Legend />
                    <Bar dataKey="Revenue"  fill="#7C3AED" radius={[3, 3, 0, 0]} name={t('Revenue', 'آمدنی')} />
                    <Bar dataKey="Expenses" fill="#EF4444" radius={[3, 3, 0, 0]} name={t('Expenses', 'اخراجات')} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

        </div>
      )}

    </div>
  );
}
