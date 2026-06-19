/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { ResponsiveTable, TableColumn } from '../shared/ResponsiveTable';
import {
  FileBarChart2,
  Calendar,
  Layers,
  Coins,
  TrendingUp,
  FileText,
  Printer,
  Share2,
  DollarSign,
  Package,
  Users,
  CheckCircle,
  Eye,
  Percent,
  TrendingDown,
  Activity,
  AlertCircle,
  HelpCircle,
  Clock,
  Search,
  ArrowUpDown,
  ChevronDown,
  ChevronRight,
  Download,
  Filter,
  Shield,
  Sliders,
  Sparkles
} from 'lucide-react';
import EmptyState from '../ui/EmptyState';
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
  Cell
} from 'recharts';
import { Shift, Product, Customer, Supplier, ExpenseEntry, GlobalSettings, Tank, RateHistoryEntry, StaffFinanceEntry, AttendanceRecord, Staff, Nozzle, BankAccount, DigitalAccount } from '../../types';
import { REPORT_TEMPLATES, ReportRow, ReportTemplate } from '../../lib/reportCompilers';
import { formatCurrency, getCurrencySymbol } from '../../lib/currency';
import { db } from '../../data/db';
import { fetchWithAuth } from '../../lib/api';
import { useInventoryStore } from '../../stores/useInventoryStore';

const getFuelCategory = (productId: string, products: Product[]): 'petrol' | 'diesel' | 'cng' | null => {
  const p = products.find((prod) => prod.id === productId);
  if (!p) return null;
  if (p.type !== 'fuel') return null;

  const idLower = p.id.toLowerCase();
  const nameLower = p.name.toLowerCase();

  if (
    idLower === 'petrol' ||
    idLower === 'prod_f1' ||
    idLower === 'prod_f3' ||
    nameLower.includes('petrol') ||
    nameLower.includes('pmg') ||
    nameLower.includes('hobc') ||
    nameLower.includes('octane') ||
    nameLower.includes('super')
  ) {
    return 'petrol';
  }
  if (
    idLower === 'diesel' ||
    idLower === 'prod_f2' ||
    nameLower.includes('diesel') ||
    nameLower.includes('hsd')
  ) {
    return 'diesel';
  }
  if (
    idLower === 'cng' ||
    nameLower.includes('cng') ||
    nameLower.includes('gas')
  ) {
    return 'cng';
  }
  return null;
};

interface ReportsProps {
  activeStationId: string;
  settings: GlobalSettings;
  shifts: Shift[];
  products: Product[];
  customers: Customer[];
  suppliers: Supplier[];
  standaloneExpenses: ExpenseEntry[];
  tanks: Tank[];
  rateHistory: RateHistoryEntry[];
  staffFinance: StaffFinanceEntry[];
  attendance: AttendanceRecord[];
  staff: Staff[];
  nozzles: Nozzle[];
  banks?: BankAccount[];
  digitalAccounts?: DigitalAccount[];
}

export default function Reports({
  activeStationId,
  settings,
  shifts,
  products,
  customers,
  suppliers,
  standaloneExpenses,
  tanks = [],
  rateHistory = [],
  staffFinance = [],
  attendance = [],
  staff = [],
  nozzles = [],
  banks = [],
  digitalAccounts = []
}: ReportsProps) {
  const isUrdu = settings.language === 'ur';
  const t = (en: string, ur: string) => (isUrdu ? ur : en);

  // Fuel Station / CNG Reports (Lube business uses LubeReports component)

  // States
  const [activeReportTab, setActiveReportTab] = useState<'sales_pnl' | 'corporate_audit' | 'party_outstanding' | 'inventory_audit' | 'shift_sheets' | 'reconciliation'>('corporate_audit');
  const [selectedHistoricalShiftId, setSelectedHistoricalShiftId] = useState<string | null>(null);

  const cogsRecords = useInventoryStore(useShallow(state => state.cogsRecords));

  // Reconciled Shift IDs state
  const [reconciledShiftIds, setReconciledShiftIds] = useState<string[]>(() =>
    db.getReconciledShiftIds(activeStationId)
  );

  useEffect(() => {
    setReconciledShiftIds(db.getReconciledShiftIds(activeStationId));
  }, [activeStationId]);

  const handleToggleReconcile = (shiftId: string) => {
    const isReconciled = reconciledShiftIds.includes(shiftId);
    let updated: string[];
    if (isReconciled) {
      updated = reconciledShiftIds.filter(id => id !== shiftId);
    } else {
      updated = [...reconciledShiftIds, shiftId];
    }
    setReconciledShiftIds(updated);
    db.saveReconciledShiftIds(activeStationId, updated);
  };

  // Corporate Audits state
  const [selectedReportId, setSelectedReportId] = useState<string>('A1');
  const [expandedCategory, setExpandedCategory] = useState<string>('A');
  const [copiedCSV, setCopiedCSV] = useState<boolean>(false);
  const [csvContent, setCsvContent] = useState<string | null>(null);

  // Filters State
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [filterStaffId, setFilterStaffId] = useState<string>('all');
  const [filterProductId, setFilterProductId] = useState<string>('all');
  const [filterEntityName, setFilterEntityName] = useState<string>('all');
  const [filterShiftType, setFilterShiftType] = useState<string>('all');
  const [filterPaymentMode, setFilterPaymentMode] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Sorting State
  const [sortField, setSortField] = useState<string>('');
  const [sortAscending, setSortAscending] = useState<boolean>(true);

  // AI Analysis State
  const [isGeneratingAiAnalysis, setIsGeneratingAiAnalysis] = useState(false);
  const [aiAnalysisResult, setAiAnalysisResult] = useState<string | null>(null);

  const generateAIReportAnalysis = async () => {
    if (sortedRows.length === 0) return;
    setIsGeneratingAiAnalysis(true);
    setAiAnalysisResult(null);
    try {
      // Limit to max 50 rows to avoid token limit
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
          systemPrompt: 'You are an AI financial auditor. Analyze the provided report data. Highlight key trends, anomalies, top performers, or risk areas. Provide a concise professional summary in 3-4 sentences.',
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

  // Color palette for charts
  const FUEL_COLORS = ['#FF6B00', '#00C49A', '#1A1A2E'];

  // All Expenses union
  const consolidatedExpenses = useMemo(() => {
    const list: { category: string; amount: number; description: string; date: string; paidFrom: string }[] = [];
    standaloneExpenses.forEach(exp => {
      list.push({
        category: exp.category,
        amount: exp.amount,
        description: exp.description,
        date: exp.date,
        paidFrom: exp.paidFrom
      });
    });
    shifts.forEach(s => {
      s.expenseEntries.forEach(e => {
        list.push({
          category: e.category,
          amount: e.amount,
          description: e.description,
          date: s.date,
          paidFrom: 'cash'
        });
      });
    });
    staffFinance.filter(f => f.type === 'issue').forEach(sf => {
      list.push({
        category: 'payroll',
        amount: sf.amount,
        description: `${t('Crew salary payout to', 'تنخواہ کی ادائیگی برائے')}: ${staff.find(s => s.id === sf.staffId)?.name || sf.staffId}`,
        date: sf.date,
        paidFrom: sf.mode || 'cash'
      });
    });
    return list;
  }, [shifts, standaloneExpenses, staffFinance, staff]);

  const pricingRevaluationImpact = useMemo(() => {
    return rateHistory.reduce((sum, entry) => sum + entry.impactAmount, 0);
  }, [rateHistory]);

  // Aggregate stats per date for visual Area Chart
  const statsTimelineData = useMemo(() => {
    const dataByDate: Record<string, { date: string; Sales: number; Profit: number; Expense: number }> = {};
    const petrolProduct = products.find(p => getFuelCategory(p.id, products) === 'petrol');
    const dieselProduct = products.find(p => getFuelCategory(p.id, products) === 'diesel');
    const cngProduct = products.find(p => getFuelCategory(p.id, products) === 'cng');

    const petrolRate = petrolProduct?.rate || 272.50;
    const dieselRate = dieselProduct?.rate || 281.20;
    const cngRate = cngProduct?.rate || 205.00;

    shifts.forEach(s => {
      if (!dataByDate[s.date]) {
        dataByDate[s.date] = { date: s.date, Sales: 0, Profit: 0, Expense: 0 };
      }
      let pLiters = 0;
      let dLiters = 0;
      let cKgs = 0;

      nozzles.forEach(nz => {
        const open = s.openingReadings?.[nz.id] || 0;
        const close = s.closingReadings?.[nz.id] || 0;
        const diff = Math.max(0, close - open);
        const fuelCat = getFuelCategory(nz.productId, products);
        if (fuelCat === 'petrol') pLiters += diff;
        else if (fuelCat === 'diesel') dLiters += diff;
        else if (fuelCat === 'cng') cKgs += diff;
      });

      pLiters = Math.max(0, pLiters - (s.testLiters?.petrol || 0));
      dLiters = Math.max(0, dLiters - (s.testLiters?.diesel || 0));
      cKgs = Math.max(0, cKgs - (s.testLiters?.cng || 0));

      const pSales = pLiters * petrolRate;
      const dSales = dLiters * dieselRate;
      const cSales = cKgs * cngRate;
      const shiftSales = pSales + dSales + cSales;
      const shiftMargin = shiftSales * 0.045;

      dataByDate[s.date].Sales += shiftSales;
      dataByDate[s.date].Profit += shiftMargin;
    });

    consolidatedExpenses.forEach(exp => {
      if (!dataByDate[exp.date]) {
        dataByDate[exp.date] = { date: exp.date, Sales: 0, Profit: 0, Expense: 0 };
      }
      dataByDate[exp.date].Expense += exp.amount;
    });

    return Object.values(dataByDate).sort((a, b) => a.date.localeCompare(b.date));
  }, [shifts, products, consolidatedExpenses, nozzles]);

  const fuelSalesVolData = useMemo(() => {
    let petrolLiters = 0;
    let dieselLiters = 0;
    let cngKgs = 0;

    shifts.forEach(s => {
      let p = 0;
      let d = 0;
      let c = 0;

      nozzles.forEach(nz => {
        const open = s.openingReadings?.[nz.id] || 0;
        const close = s.closingReadings?.[nz.id] || 0;
        const diff = Math.max(0, close - open);
        const fuelCat = getFuelCategory(nz.productId, products);
        if (fuelCat === 'petrol') p += diff;
        else if (fuelCat === 'diesel') d += diff;
        else if (fuelCat === 'cng') c += diff;
      });

      petrolLiters += Math.max(0, p - (s.testLiters?.petrol || 0));
      dieselLiters += Math.max(0, d - (s.testLiters?.diesel || 0));
      cngKgs += Math.max(0, c - (s.testLiters?.cng || 0));
    });

    return [
      { name: t('Super Petrol', 'پٹرول PMU'), Litres: petrolLiters },
      { name: t('HSD Diesel', 'ڈیزل HSD'), Litres: dieselLiters },
      { name: t('CNG Gas', 'سی این جی'), Litres: cngKgs }
    ];
  }, [shifts, nozzles]);

  const summaryTotals = useMemo(() => {
    const totalSales = statsTimelineData.reduce((sum, item) => sum + item.Sales, 0);
    const totalProfit = statsTimelineData.reduce((sum, item) => sum + item.Profit, 0) + pricingRevaluationImpact;
    const totalExpense = statsTimelineData.reduce((sum, item) => sum + item.Expense, 0);
    const netEarning = totalProfit - totalExpense;

    return {
      totalSales,
      totalProfit,
      totalExpense,
      netEarning
    };
  }, [statsTimelineData, pricingRevaluationImpact]);

  // Active Selected Historical Shift
  const activeShiftToReceipt = useMemo(() => {
    if (!selectedHistoricalShiftId) return null;
    return shifts.find(s => s.id === selectedHistoricalShiftId) || null;
  }, [selectedHistoricalShiftId, shifts]);

  // ==========================================
  // MASTER COMPILER & FILTER EVALUATOR
  // ==========================================
  const activeTemplate = useMemo(() => {
    return REPORT_TEMPLATES.find(t => t.id === selectedReportId) || REPORT_TEMPLATES[0];
  }, [selectedReportId]);

  const compiledRawRows = useMemo(() => {
    return activeTemplate.compile({
      shifts,
      products,
      customers,
      suppliers,
      standaloneExpenses,
      tanks,
      rateHistory,
      staffFinance,
      attendance,
      staff,
      nozzles,
      cogsRecords
    });
  }, [activeTemplate, shifts, products, customers, suppliers, standaloneExpenses, tanks, rateHistory, staffFinance, attendance, staff, nozzles, cogsRecords]);

  // Apply filters
  const filteredRows = useMemo(() => {
    return compiledRawRows.filter(row => {
      // Date range check
      if (startDate && row.date && row.date < startDate) return false;
      if (endDate && row.date && row.date > endDate) return false;

      // Staff filter check
      if (filterStaffId !== 'all') {
        if (row.staffId && row.staffId !== filterStaffId) return false;
        // fallback match name (heuristic)
        if (!row.staffId && row.staffName && !row.staffName.toLowerCase().includes(filterStaffId.toLowerCase())) {
          const matchedSt = staff.find(s => s.id === filterStaffId);
          if (matchedSt && !row.staffName.toLowerCase().includes(matchedSt.name.toLowerCase())) return false;
        }
      }

      // Product filter check
      if (filterProductId !== 'all' && row.productId && row.productId !== filterProductId) return false;

      // Class / Entity check (customer / supplier name)
      if (filterEntityName !== 'all' && row.entityName && !row.entityName.toLowerCase().includes(filterEntityName.toLowerCase())) {
        return false;
      }

      // Shift type check
      if (filterShiftType !== 'all' && row.shiftType && row.shiftType.toLowerCase() !== filterShiftType.toLowerCase()) return false;

      // Payment Mode check
      if (filterPaymentMode !== 'all' && row.paymentMode && row.paymentMode.toLowerCase() !== filterPaymentMode.toLowerCase()) return false;

      // Text query search
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const strVal = Object.values(row).join(' ').toLowerCase();
        if (!strVal.includes(q)) return false;
      }

      return true;
    });
  }, [compiledRawRows, startDate, endDate, filterStaffId, filterProductId, filterEntityName, filterShiftType, filterPaymentMode, searchQuery, staff]);

  // Apply sorting
  const sortedRows = useMemo(() => {
    if (!sortField) return filteredRows;
    return [...filteredRows].sort((a, b) => {
      const aVal = a[sortField];
      const bVal = b[sortField];

      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortAscending ? aVal - bVal : bVal - aVal;
      }
      const aStr = String(aVal || '').toLowerCase();
      const bStr = String(bVal || '').toLowerCase();
      return sortAscending ? aStr.localeCompare(bStr) : bStr.localeCompare(aStr);
    });
  }, [filteredRows, sortField, sortAscending]);

  // Compute live aggregates of active report
  const tableAggregates = useMemo(() => {
    let sumAmount = 0;
    let recordsCount = sortedRows.length;

    sortedRows.forEach(r => {
      if (typeof r.amount === 'number') {
        sumAmount += r.amount;
      }
    });

    return {
      sumAmount,
      recordsCount
    };
  }, [sortedRows]);


  // Export CSV generator
  const triggerCSVExport = () => {
    if (sortedRows.length === 0) return;
    const headers = activeTemplate.headers.map(h => h.label).join(',');
    const csvLines = sortedRows.map(r => {
      return activeTemplate.headers.map(h => {
        let v = r[h.key as keyof ReportRow] || '';
        // escape string commas
        if (typeof v === 'string') v = `"${v.replace(/"/g, '""')}"`;
        return v;
      }).join(',');
    });
    const built = [headers, ...csvLines].join('\n');
    setCsvContent(built);

    // Simulate direct download
    const blob = new Blob([built], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `FuelPro_Report_${activeTemplate.id}_Export.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setCopiedCSV(true);
    setTimeout(() => setCopiedCSV(false), 3000);
  };

  const REPORT_CATEGORIES = [
    { id: 'A', name: t('Category A: Fuel Sales Reports', 'کیٹیگری A: فیول سیلز رپورٹیں'), icon: Coins },
    { id: 'B', name: t('Category B: Institutional Financials', 'کیٹیگری B: مالیاتی آڈٹ کھاتہ'), icon: TrendingUp },
    { id: 'C', name: t('Category C: Customer Billing Ledgers', 'کیٹیگری C: کسٹمرز بقایا لیجرز'), icon: Users },
    { id: 'D', name: t('Category D: Refinery Suppliers Ledger', 'کیٹیگری D: آئل رِفائنری سپلائر کھاتہ'), icon: Package },
    { id: 'E', name: t('Category E: Operator Attendance & Payroll', 'کیٹیگری E: اسٹاف حاضری اور ایڈوانسز لاگ'), icon: Activity },
    { id: 'F', name: t('Category F: Wet Inventory Stock Audit', 'کیٹیگری F: انوینٹری اور ٹینک آڈٹ رپورٹیں'), icon: Layers },
    { id: 'G', name: t('Category G: Business Operating Expenses', 'کیٹیگری G: کاروباری اخراجات اور بجٹ خلاصہ'), icon: DollarSign },
    { id: 'H', name: t('Category H: System Audits & Trace Overrides', 'کیٹیگری H: سیکیورٹی آڈٹ ٹریل لاگ'), icon: Shield },
    { id: 'I', name: t('Category I: Operational Performance Analysis', 'کیٹیگری I: آپریشنل کارکردگی اور بجٹ'), icon: Sliders }
  ];

  return (
    <div className="space-y-6 pb-20 lg:pb-5">

      {/* HEADER SECTION */}
      <div className="flex flex-col gap-4 sm:flex-row items-center sm:justify-between border-b border-slate-200 pb-4">
        <div>
          <h2 className="font-sans text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <FileBarChart2 className="h-6 w-6 text-orange-600" />
            <span>{t('Certified Master Audit & Reports Module', 'ماسٹر آڈٹ رپورٹس اور گوشوارے')}</span>
          </h2>
          <p className="font-sans text-xs text-slate-500 mt-1">
            {t('Traceable accounting ledger of every shift, customer recovery, refinery purchase and staff advances.', 'ہر ٹرانزیکشن، کسٹمر کی ریکوری اور سپلائر کی ادائیگیاں آڈٹ کرنے کا خودکار نظام۔')}
          </p>
        </div>

        {/* Global Print trigger */}
        <button
          onClick={() => window.print()}
          className="flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-4 py-2 font-sans text-xs font-bold text-slate-700 shadow-xs hover:bg-slate-50 transition-all cursor-pointer self-start sm:self-center"
        >
          <Printer className="h-4 w-4" />
          <span>{t('Print Dashboard Page', 'صفحہ پرنٹ کریں')}</span>
        </button>
      </div>

      {/* TABS SELECTOR */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-0.5">
        {[
          { id: 'corporate_audit', label: '📊 Corporate Audits (50+ Reports)', urdu: '📊 کارپوریٹ آڈٹ لسٹ (50+ رپورٹیں)' },
          { id: 'sales_pnl', label: '📈 Visual Fuel Dashboard', urdu: '📈 گرافیکل سیلز گراف اور چارٹ' },
          { id: 'party_outstanding', label: '👥 Party Outstanding List', urdu: '👥 گاہک بقایا کھاتہ لسٹ' },
          { id: 'inventory_audit', label: '🛢️ Storage Tanks Status', urdu: '🛢️ ٹینکس اسٹاک موازنہ' },
          { id: 'shift_sheets', label: '📋 Finalized Shift Receipts', urdu: '📋 شفٹ فائنل رسیدیں' },
          { id: 'reconciliation', label: '🏦 Bank Reconciliation Tool', urdu: '🏦 بینک اور ڈیجیٹل موازنہ' }
        ].map(tb => (
          <button
            key={tb.id}
            onClick={() => setActiveReportTab(tb.id as any)}
            className={`px-4 py-2.5 font-sans text-xs font-bold transition-all border-b-2 cursor-pointer ${
              activeReportTab === tb.id
                ? 'border-orange-600 text-orange-600 font-extrabold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            {t(tb.label, tb.urdu)}
          </button>
        ))}
      </div>


      {/* ========================================================
          NEW VIEW: 50+ CORPORATE REPORT GENERATION CONSOLE
          ======================================================== */}
      {activeReportTab === 'corporate_audit' && (
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-6 items-start">
          
          {/* LEFT COLUMN: ACTIVE DIRECTORY ACCORDION OF REPORTS */}
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs space-y-3 lg:sticky lg:top-5">
            <span className="font-sans text-[11px] font-bold text-slate-400 uppercase tracking-widest block border-b border-slate-100 pb-1.5">
              {t('Available Directory', 'رپورٹس انڈیکس ڈائریکٹری')}
            </span>

            <div className="space-y-2">
              {REPORT_CATEGORIES.map(cat => {
                const isExpanded = expandedCategory === cat.id;
                const reportsInCat = REPORT_TEMPLATES.filter(r => r.category === cat.id);

                return (
                  <div key={cat.id} className="border border-slate-100 rounded-lg overflow-hidden">
                    <button
                      onClick={() => setExpandedCategory(isExpanded ? '' : cat.id)}
                      className={`w-full flex items-center justify-between p-2.5 font-sans text-xs font-bold text-left transition-colors cursor-pointer ${
                        isExpanded ? 'bg-orange-55/10 text-orange-700' : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <div className="flex items-center gap-1.5">
                        <cat.icon className="h-4 w-4" />
                        <span>{cat.name}</span>
                      </div>
                      {isExpanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                    </button>

                    {isExpanded && (
                      <div className="p-1.5 bg-white space-y-1 divide-y divide-slate-50">
                        {reportsInCat.map(rep => {
                          const isActive = selectedReportId === rep.id;
                          return (
                            <button
                              key={rep.id}
                              onClick={() => setSelectedReportId(rep.id)}
                              className={`w-full text-left p-2 rounded-md font-sans text-[11px] font-semibold transition-all cursor-pointer block ${
                                isActive
                                  ? 'bg-slate-900 text-white font-extrabold'
                                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                              }`}
                            >
                              {isUrdu ? rep.urduName : rep.name}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* RIGHT PANELS: ADVANCED CONTROLS, CHART TIMELINE & TRACEABLE GRID */}
          <div className="lg:col-span-3 space-y-6">
            
            {/* 1. Selected report description panel */}
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs relative">
              <span className="font-mono text-[9px] font-bold text-orange-600 uppercase tracking-widest bg-orange-50 px-2 py-0.5 rounded-sm absolute top-4 right-4">
                Ref Code: {activeTemplate.id}
              </span>
              <h3 className="font-sans text-lg font-extrabold text-slate-800 tracking-tight">
                {t(activeTemplate.name, activeTemplate.urduName)}
              </h3>
              <p className="font-sans text-xs text-slate-450 mt-1 italic">
                {t(activeTemplate.description, activeTemplate.urduDescription)}
              </p>
            </div>

            {/* 2. Global Filter Controls Form */}
            <div className="rounded-xl border border-slate-250 bg-slate-55/40 p-4 space-y-4">
              <div className="flex items-center gap-1 text-xs font-bold text-slate-700">
                <Filter className="h-3.5 w-3.5 text-orange-500" />
                <span>{t('Advanced Query Filter Controls', 'فلٹرز اور آڈٹ سرچ پینل')}</span>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 min-h-[90px] gap-3 sm:grid-cols-4 text-xs font-sans">
                {/* Dates picker */}
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">{t('Start Date', 'شروع تاریخ')}</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="premium-input border p-2 text-[11px] font-semibold text-slate-700 outline-hidden focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">{t('End Date', 'آخری تاریخ')}</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="premium-input border p-2 text-[11px] font-semibold text-slate-700 outline-hidden focus:border-orange-500"
                  />
                </div>

                {/* Staff Select option */}
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">{t('Staff/Crew', 'اسٹاف ممبر')}</label>
                  <select
                    value={filterStaffId}
                    onChange={(e) => setFilterStaffId(e.target.value)}
                    className="premium-input border p-2 text-[11px] font-semibold text-slate-700 outline-hidden focus:border-orange-500"
                  >
                    <option value="all">{t('— All Staff Members —', 'تمام عملہ')}</option>
                    {staff.map(st => (
                      <option key={st.id} value={st.id}>{st.name} ({st.role.toUpperCase()})</option>
                    ))}
                  </select>
                </div>

                {/* Product Select option */}
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">{t('Fuel Product', 'پٹرولیم ایندھن')}</label>
                  <select
                    value={filterProductId}
                    onChange={(e) => setFilterProductId(e.target.value)}
                    className="premium-input border p-2 text-[11px] font-semibold text-slate-700 outline-hidden focus:border-orange-500"
                  >
                    <option value="all">{t('— All Products —', 'تمام مصنوعات')}</option>
                    {products.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 min-h-[90px] gap-3 sm:grid-cols-4 text-xs font-sans pt-1">
                {/* Customer / Supplier selection */}
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">{t('Party Name', 'پارٹی کھاتہ')}</label>
                  <select
                    value={filterEntityName}
                    onChange={(e) => setFilterEntityName(e.target.value)}
                    className="premium-input border p-2 text-[11px] font-semibold text-slate-700 outline-hidden focus:border-orange-500"
                  >
                    <option value="all">{t('— All Accounts —', 'تمام بقایا پارٹیاں')}</option>
                    {customers.map(c => (
                      <option key={c.id} value={c.name}>{c.name}</option>
                    ))}
                    {suppliers.map(s => (
                      <option key={s.id} value={s.name}>{s.name}</option>
                    ))}
                  </select>
                </div>

                {/* Shift types */}
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">{t('Shift Hour Type', 'وقتِ شفٹ')}</label>
                  <select
                    value={filterShiftType}
                    onChange={(e) => setFilterShiftType(e.target.value)}
                    className="premium-input border p-2 text-[11px] font-semibold text-slate-700 outline-hidden focus:border-orange-500"
                  >
                    <option value="all">{t('All Shift types', 'تمام اوقات')}</option>
                    <option value="day">{t('Day (08:00 AM - 04:00 PM)', 'دن')}</option>
                    <option value="night">{t('Night (04:00 PM - 08:00 AM)', 'رات')}</option>
                  </select>
                </div>

                {/* Search query */}
                <div className="sm:col-span-2">
                  <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">{t('Search Inside active report', 'آڈٹ ریسیٹ تلاش کریں')}</label>
                  <div className="relative">
                    <Search className="h-3.5 w-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                    <input
                      type="text"
                      placeholder={t('Type voucher ID, operator, names...', 'آپریٹر، رقم یا واؤچر کوڈ درج کریں...')}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="premium-input pl-8 border p-2 text-[11px] font-semibold text-slate-700 outline-hidden focus:border-orange-500"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* 3. OPTIONAL MINI CHARTS PREVIEW ON TOP OF RESULTS */}
            {sortedRows.length > 0 && (
              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs space-y-3">
                <span className="font-sans text-[10px] font-bold text-slate-400 uppercase tracking-widest block border-b border-slate-100 pb-1.5 flex items-center gap-1.5">
                  <Activity className="h-3.5 w-3.5 text-teal-605" />
                  <span>{t('Transactional Flow Analytics Chart', 'اعداد و شمار چارٹ تجزیہ')}</span>
                </span>
                <div className="h-44 w-full text-xs font-sans">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={sortedRows.slice(0, 15)} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                      <defs>
                        <linearGradient id="rowGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#0EA5E9" stopOpacity={0.25}/>
                          <stop offset="95%" stopColor="#0EA5E9" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                      <XAxis dataKey="date" stroke="#94A3B8" />
                      <YAxis stroke="#94A3B8" />
                      <Tooltip formatter={(val: any) => `Value: ${formatCurrency(Number(val), settings)}`} />
                      <Area type="monotone" dataKey="amount" stroke="#0EA5E9" strokeWidth={2.5} fillOpacity={1} fill="url(#rowGrad)" name={t('Transaction Amount (PKR)', 'رقم کا بہاؤ')} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* 4. RESULTS STATS SUMMARY BAR */}
            <div className="flex flex-col gap-3 sm:flex-row items-center sm:justify-between bg-slate-900 rounded-xl p-4 text-white font-sans text-xs shadow-xs">
              <div className="flex items-center gap-4">
                <div>
                  <span className="text-slate-400 block text-[9px] uppercase tracking-wider">{t('MATCHED RECORDS', 'کل ریکارڈز تعداد')}</span>
                  <span className="font-mono text-sm font-extrabold">{tableAggregates.recordsCount} {t('Rows', 'لائنز')}</span>
                </div>
                {tableAggregates.sumAmount !== 0 && (
                  <div className="border-l border-slate-700 pl-4">
                    <span className="text-slate-400 block text-[9px] uppercase tracking-wider">{t('AGGREGATED SUM (PKR)', 'کل میزان مالیت')}</span>
                    <span className="font-mono text-sm font-extrabold text-teal-400">{formatCurrency(tableAggregates.sumAmount, settings)}</span>
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={generateAIReportAnalysis}
                  disabled={isGeneratingAiAnalysis || sortedRows.length === 0}
                  className={`flex items-center justify-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 font-sans text-xs font-bold text-white shadow-sm hover:bg-indigo-700 transition-colors cursor-pointer ${isGeneratingAiAnalysis ? 'opacity-50' : ''}`}
                >
                  <Sparkles className={`h-4 w-4 ${isGeneratingAiAnalysis ? 'animate-spin' : ''}`} />
                  <span>{t('AI Analysis', 'اے آئی تجزیہ')}</span>
                </button>
                {/* CSV downloads simulation */}
                <button
                  onClick={triggerCSVExport}
                  className="flex items-center justify-center gap-1.5 rounded-lg bg-orange-600 px-4 py-2.5 sm:py-2 min-h-[48px] sm:min-h-[40px] font-sans text-xs font-bold text-white shadow-sm hover:bg-orange-700 transition-colors cursor-pointer"
                >
                  <Download className="h-4 w-4" />
                  <span>{copiedCSV ? t('Downloaded! (CSV)', 'ڈاؤنلوڈ مکمل!') : t('Export CSV', 'ایکسل ڈاؤنلوڈ')}</span>
                </button>
              </div>
            </div>

            {aiAnalysisResult && (
              <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-4 shadow-sm relative">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="h-4 w-4 text-indigo-500" />
                  <span className="font-bold text-indigo-800 text-sm">{t('AI Report Analysis', 'اے آئی رپورٹ کا تجزیہ')}</span>
                </div>
                <div className="prose prose-sm max-w-none text-indigo-900 whitespace-pre-wrap leading-relaxed text-xs">
                  {aiAnalysisResult}
                </div>
              </div>
            )}

            <div className="rounded-xl border border-slate-200 bg-white shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <div className="min-w-full">
                  {sortedRows.length === 0 ? (
                    <div className="py-24 text-center text-slate-400 font-sans italic text-xs bg-white">
                      {t('No ledger records match the query filter selections.', 'آڈٹ فلٹرز یا تلاش کے معیار کے مطابق کوئی ڈیٹا نہیں ملا۔')}
                    </div>
                  ) : (
                    <ResponsiveTable
                      data={sortedRows}
                      columns={activeTemplate.headers.map((h, i) => ({
                        header: (
                          <div
                            onClick={() => {
                              if (sortField === h.key) {
                                setSortAscending(!sortAscending);
                              } else {
                                setSortField(h.key);
                                setSortAscending(true);
                              }
                            }}
                            className={`flex items-center gap-1.5 cursor-pointer ${h.isNumeric ? 'justify-end w-full' : ''}`}
                          >
                            <span>{isUrdu ? h.urduLabel : h.label}</span>
                            <ArrowUpDown className="h-3 w-3 text-slate-400" />
                          </div>
                        ),
                        accessor: (row: any) => {
                          const cellValue = row[h.key];
                          if (h.key === 'amount') {
                            const numericAmount = Number(cellValue || 0);
                            const isPositive = numericAmount >= 0;
                            return (
                              <span className={isPositive ? 'text-slate-900 font-bold' : 'text-red-500 font-bold'}>
                                {formatCurrency(numericAmount, settings)}
                              </span>
                            );
                          }

                          let formattedValue = '';
                          if (cellValue !== null && cellValue !== undefined) {
                            const strValue = String(cellValue);
                            if (strValue.includes('Rs.')) {
                              formattedValue = strValue.replace(/Rs\./g, getCurrencySymbol(settings));
                            } else {
                              formattedValue = strValue;
                            }
                          }
                          return formattedValue;
                        },
                        className: h.isNumeric ? 'text-right font-mono' : 'text-left font-sans',
                        isPrimaryMobile: i === 0,
                        isSecondaryMobile: i === 1,
                      }))}
                      keyExtractor={(row, index) => `${row.id || index}`}
                    />
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          REPORT VIEW 1: SALES & PNL & GRAPHICAL CHARTS
          ======================================================== */}
      {activeReportTab === 'sales_pnl' && (
        <div className="space-y-6">
          
          {/* Bento box summary widgets row with 5 indicators */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:grid-cols-5">
            
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm flex flex-col justify-between">
              <span className="font-sans text-[10px] font-bold text-slate-400 uppercase tracking-widest block leading-snug">{t('Summed Period Sales', 'کل سیشنز فروخت رقم')}</span>
              <strong className="font-mono text-base font-bold text-slate-800 tracking-tight mt-1.5 block">
                {formatCurrency(summaryTotals.totalSales, settings)}
              </strong>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm flex flex-col justify-between">
              <span className="font-sans text-[10px] font-bold text-slate-400 uppercase tracking-widest block leading-snug">{t('Estimated Gross Margin', 'تخمینہ منافع مارجن')}</span>
              <strong className="font-mono text-base font-bold text-emerald-600 tracking-tight mt-1.5 block">
                {formatCurrency(summaryTotals.totalProfit, settings)}
              </strong>
            </div>

            <div className={`rounded-xl border p-4 border-slate-200 bg-white shadow-sm flex flex-col justify-between`}>
              <span className="font-sans text-[10px] font-bold text-slate-400 uppercase tracking-widest block leading-snug">{t('Revaluation Impact', 'ریٹ تبدیلی نفع/نقصان')}</span>
              <strong className={`font-mono text-base font-bold tracking-tight mt-1.5 block ${pricingRevaluationImpact >= 0 ? 'text-teal-605' : 'text-red-500'}`}>
                {pricingRevaluationImpact >= 0 ? '+' : ''}{formatCurrency(pricingRevaluationImpact, settings)}
              </strong>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm flex flex-col justify-between">
              <span className="font-sans text-[10px] font-bold text-slate-400 uppercase tracking-widest block leading-snug">{t('Conjoined Expenses', 'مجموعی اخراجات مع تنخواہ')}</span>
              <strong className="font-mono text-base font-bold text-red-650 tracking-tight mt-1.5 block">
                {formatCurrency(summaryTotals.totalExpense, settings)}
              </strong>
            </div>

            <div className={`rounded-xl border p-4 shadow-sm flex flex-col justify-between ${summaryTotals.netEarning >= 0 ? 'bg-emerald-500/10 border-emerald-200' : 'bg-red-500/10 border-red-200'}`}>
              <span className="font-sans text-[10px] font-bold text-slate-400 uppercase tracking-widest block leading-snug">{t('Net Earnings', 'خالص آمدنی')}</span>
              <strong className={`font-mono text-base font-extrabold tracking-tight mt-1.5 block ${summaryTotals.netEarning >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
                {formatCurrency(summaryTotals.netEarning, settings)}
              </strong>
            </div>

          </div>

          {/* DYNAMICAL CHARTS MATRIX */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 min-h-[90px] gap-3 lg:grid-cols-2">
            
            {/* 1. Daily Sales timeline charts */}
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
              <h3 className="font-sans text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5 border-b border-slate-100 pb-2 mb-3">
                <TrendingUp className="h-4 w-4 text-orange-500" />
                <span>{t('Daily Inflows vs Margin Profit Performance', 'یومیہ آمدنی بمقابلہ منافع گراف')}</span>
              </h3>
              
              {statsTimelineData.length === 0 ? (
                <div className="h-64 flex items-center justify-center text-slate-400 font-sans text-xs">
                  {t('Establish shifts or save expenses to plot visual graphs.', 'چارٹ لوڈ کرنے کے لیے ٹرانزیکشن کارروائی درج کیجئے')}
                </div>
              ) : (
                <div className="h-64 w-full text-xs font-mono">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={statsTimelineData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#FF6B00" stopOpacity={0.2}/>
                          <stop offset="95%" stopColor="#FF6B00" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10B981" stopOpacity={0.2}/>
                          <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                      <XAxis dataKey="date" stroke="#94A3B8" />
                      <YAxis stroke="#94A3B8" />
                      <Tooltip formatter={(value: any) => formatCurrency(Number(value), settings)} />
                      <Legend />
                      <Area type="monotone" dataKey="Sales" stroke="#FF6B00" strokeWidth={2} fillOpacity={1} fill="url(#colorSales)" name={t('Gross Sales', 'فروخت رقم')} />
                      <Area type="monotone" dataKey="Profit" stroke="#10B981" strokeWidth={2} fillOpacity={1} fill="url(#colorProfit)" name={t('Margin Profit', 'تخمینہ منافع')} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            {/* 2. Fuel Volumetric Distributions sold */}
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
              <h3 className="font-sans text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5 border-b border-slate-100 pb-2 mb-3">
                <Package className="h-4 w-4 text-sky-500" />
                <span>{t('Absolute Fuel Litres Volume Pumped', 'کل پمپ شدہ فیول کا حجم بلحاظ لیٹر')}</span>
              </h3>

              {shifts.length === 0 ? (
                <div className="h-64 flex items-center justify-center text-slate-400 font-sans text-xs">
                  {t('No volumetric fuels finalized in shift readings.', 'لیٹر موازنہ گراف لوڈ کرنے کے لیے شفٹ فائنل انٹری کیجئے۔')}
                </div>
              ) : (
                <div className="h-64 w-full text-xs font-sans">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={fuelSalesVolData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                      <XAxis dataKey="name" stroke="#94A3B8" />
                      <YAxis stroke="#94A3B8" />
                      <Tooltip formatter={(v) => `${Number(v).toLocaleString()} Litres`} />
                      <Legend />
                      <Bar dataKey="Litres" fill="#1E293B" radius={[4, 4, 0, 0]} name={t('Sold Litres', 'فروخت لیٹر')} >
                        {fuelSalesVolData.map((entry, index) => (
                           <Cell key={`cell-${index}`} fill={FUEL_COLORS[index % FUEL_COLORS.length]} />
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


      {/* ========================================================
          REPORT VIEW 2: PARTY OUTSTANDING RECEIVABLES
          ======================================================== */}
      {activeReportTab === 'party_outstanding' && (
        <div className="space-y-6">
          
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
            <h3 className="font-sans text-sm font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2 mb-3 flex items-center justify-between">
              <span>{t('Party wise Outstanding Receivable Statement', 'صارفین اور گاہکوں کے بقایاجات کی فہرست')}</span>
              <span className="font-mono text-xs font-bold text-slate-500">
                {t('Total Active Debtors:', 'کل گاہک بقایا کھاتہ دار:')} {customers.length}
              </span>
            </h3>

            <div className="overflow-x-auto rounded-lg border border-slate-105">
              <ResponsiveTable
                data={customers}
                columns={[
                  {
                    header: t('Party Name', 'نام کھاتہ دار'),
                    accessor: (cust) => <span className="font-bold text-slate-800">{t(cust.name, cust.urduName)}</span>,
                    isPrimaryMobile: true
                  },
                  {
                    header: t('Contact Phone', 'موبائل نمبر'),
                    accessor: (cust) => <span className="font-mono font-semibold text-slate-500">{cust.contact}</span>,
                    isSecondaryMobile: true
                  },
                  {
                    header: t('Operational Block Address', 'مقام/پتہ'),
                    accessor: (cust) => <span className="text-slate-400 font-medium">{cust.address || 'Karachi, Pakistan'}</span>
                  },
                  {
                    header: t('Credit Cap Limit', 'قرض مقرر حد'),
                    className: 'text-right',
                    accessor: (cust) => <span className="font-mono text-slate-500">{formatCurrency(cust.creditLimit, settings)}</span>
                  },
                  {
                    header: t('Account Balance', 'بک بقایا رقم'),
                    className: 'text-right',
                    accessor: (cust) => {
                      const isOwed = cust.balance > 0;
                      return <span className={`font-mono font-extrabold ${isOwed ? 'text-red-650' : 'text-emerald-705'}`}>{formatCurrency(cust.balance, settings)}</span>;
                    }
                  }
                ]}
                keyExtractor={(cust) => cust.id}
                emptyMessage={t('No customers registered yet.', 'توجہ فرمائیں! کوئی پارٹی رجسٹر نہیں کی گئی۔')}
              />
            </div>
          </div>

        </div>
      )}


      {/* ========================================================
          REPORT VIEW 3: INVENTORY AUDIT & STORAGE TANK MEASUREMENTS
          ======================================================== */}
      {activeReportTab === 'inventory_audit' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            
            {/* INVENTORY TABLE LEFT PANEL (2/3) */}
            <div className="md:col-span-2 rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
              <h3 className="font-sans text-sm font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2 mb-3">
                {t('Bulk Storage Levels & Status Auditing', 'پٹرولیم ٹینک اور پراڈکٹس اسٹاک والیم')}
              </h3>

              <div className="overflow-x-auto rounded-lg border border-slate-105">
                <ResponsiveTable
                  data={products}
                  columns={[
                    {
                      header: t('Product Grade Name', 'پراڈکٹ ٹائپ'),
                      accessor: (prod) => <span className="font-bold text-slate-800">{t(prod.name, prod.urduName)}</span>,
                      isPrimaryMobile: true
                    },
                    {
                      header: t('Fuel/Lube Category', 'قسم'),
                      accessor: (prod) => <span className="font-semibold text-slate-400 capitalize">{prod.type}</span>,
                      isSecondaryMobile: true
                    },
                    {
                      header: t('Current Active Stock', 'موجودہ اسٹاک والیم'),
                      className: 'text-right',
                      accessor: (prod) => {
                        const isLow = prod.currentStock <= prod.minStock;
                        return <span className={`font-mono font-bold ${isLow ? 'text-rose-600 font-extrabold' : 'text-slate-800'}`}>{prod.currentStock.toLocaleString()} {prod.unit}</span>;
                      }
                    },
                    {
                      header: t('Low Alert Threshold', 'کم سے کم الرٹ حد'),
                      className: 'text-right',
                      accessor: (prod) => <span className="font-mono text-slate-400">{prod.minStock.toLocaleString()} {prod.unit}</span>
                    },
                    {
                      header: t('Max Storage Capacity', 'زیادہ سے زیادہ گنجائش'),
                      className: 'text-right',
                      accessor: (prod) => <span className="font-mono text-slate-500">{prod.capacity ? `${prod.capacity.toLocaleString()} ${prod.unit}` : 'N/A'}</span>
                    },
                    {
                      header: t('Unit rate (PKR)', 'موجودہ ریٹ فی لیٹر'),
                      className: 'text-right',
                      accessor: (prod) => <span className="font-mono font-bold text-emerald-700">{formatCurrency(prod.rate, settings)}</span>
                    }
                  ]}
                  keyExtractor={(prod) => prod.id}
                />
              </div>
            </div>

            {/* STORAGE TANKS FAST SYNC GAUGES SIDE PANEL (1/3) */}
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
              <h3 className="font-sans text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2 mb-3">
                {t('Physical Storage Tanks Status', 'سٹوریج ٹینک مانیٹرنگ')}
              </h3>

              <div className="space-y-4">
                {tanks.length === 0 ? (
                  <p className="py-8 text-center text-slate-400 text-xs font-sans">
                    {t('No tanks configured.', 'کوئی ٹینک کنفیگرڈ نہیں ہے۔')}
                  </p>
                ) : (
                  tanks.map(tnk => {
                    const fillPct = Math.round((tnk.currentStock / tnk.capacity) * 100);
                    const isUnderCritical = tnk.currentStock < tnk.criticalLevel;

                    return (
                      <div key={tnk.id} className="text-xs space-y-1.5 border-b border-slate-50 pb-3">
                        <div className="flex justify-between font-sans">
                          <strong className="text-slate-800 font-extrabold">{tnk.name} ({tnk.physicalLabel || 'General'})</strong>
                          <span className={`font-semibold ${isUnderCritical ? 'text-red-500' : 'text-teal-650'}`}>{fillPct}% Full</span>
                        </div>
                        <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                          <div
                            style={{ width: `${Math.min(100, fillPct)}%` }}
                            className={`h-full rounded-full ${isUnderCritical ? 'bg-red-500' : 'bg-teal-500'}`}
                          />
                        </div>
                        <div className="flex justify-between font-mono text-[10px] text-slate-400 mt-1">
                          <span>Stock: {tnk.currentStock.toLocaleString()} L</span>
                          <span>Cap: {tnk.capacity.toLocaleString()} L</span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

          </div>
        </div>
      )}


      {/* ========================================================
          REPORT VIEW 4: FINALIZED SHIFT STATEMENT INVOICES / RECEIPTS
          ======================================================== */}
      {activeReportTab === 'shift_sheets' && (
        <div className="grid grid-cols-2 gap-6 lg:grid-cols-3">
          
          {/* List of past shifts archived */}
          <div className="space-y-3.5">
            <h4 className="font-sans text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2 block">
              {t('Select Shift session receipt:', 'شفٹ روزنامچہ منتخب کریں:')}
            </h4>

            <div className="space-y-2 max-h-[460px] overflow-y-auto">
              {shifts.length === 0 ? (
                <EmptyState
                  icon={Clock}
                  title={t('No archived shifts found.', 'کوئی فائنل شدہ شفٹ انٹری نہیں ملی۔')}
                  description={t('Shifts appear here once they are started, reconciled, and closed.', 'روزنامچہ کی رپورٹ دیکھنے کے لیے پہلے شفٹ وزرڈ سے ایکٹو شفٹ شروع اور کلوز کریں۔')}
                />
              ) : (
                [...shifts].reverse().map(sh => (
                  <button
                    key={sh.id}
                    onClick={() => setSelectedHistoricalShiftId(sh.id)}
                    className={`w-full text-left rounded-xl border p-4 shadow-xs transition-colors block cursor-pointer ${
                      selectedHistoricalShiftId === sh.id
                        ? 'border-orange-500 bg-orange-50/20'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <strong className="font-sans text-xs font-bold text-slate-800 uppercase">
                        {t(`Shift #${sh.id} Final Slip`, `شفٹ رسید نمبر #${sh.id}`)}
                      </strong>
                      <span className="font-mono text-[10px] text-slate-400 font-semibold uppercase bg-slate-100 px-2 py-0.5 rounded-sm">
                        {sh.type}
                      </span>
                    </div>

                    <span className="font-mono text-[10px] text-slate-400 tracking-tight block mt-2">
                      📆 Date: {sh.date} ({sh.startTime} - {sh.endTime || 'Closed'})
                    </span>
                    <span className="font-sans text-[10px] text-slate-500 font-semibold block mt-1">
                      👤 Operator Count: {sh.status.toUpperCase()}
                    </span>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Graphical custom invoice template render */}
          <div className="lg:col-span-2">
            {activeShiftToReceipt ? (
              <div className="rounded-xl border border-slate-250 bg-white shadow-md p-6 space-y-6 relative" id="print-area">
                
                <div className="flex flex-col items-center justify-center border-b-2 border-slate-900 pb-5 text-center">
                  <h3 className="font-sans text-xl font-bold text-slate-900 uppercase tracking-tight">{settings.stationName}</h3>
                  <h4 className="font-sans text-lg font-semibold text-slate-800 font-urdu mt-1">{settings.stationUrduName}</h4>
                  <p className="font-sans text-[11px] text-slate-400 tracking-tight mt-1">{settings.address} | NTN: {settings.ntn}</p>
                </div>

                {/* Sub Metadata rows */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 border-b border-slate-100 pb-4 text-xs font-sans text-slate-600">
                  <div>
                    <span className="block font-bold">Shift ID: <span className="font-mono font-semibold">#{activeShiftToReceipt.id}</span></span>
                    <span className="block mt-1">Date: <span className="font-semibold">{activeShiftToReceipt.date}</span></span>
                    <span className="block mt-1">Type: <span className="font-semibold uppercase">{activeShiftToReceipt.type}</span></span>
                  </div>
                  <div className="text-right">
                    <span className="block">Start: <span className="font-semibold">{activeShiftToReceipt.startTime}</span></span>
                    <span className="block mt-1">End: <span className="font-semibold">{activeShiftToReceipt.endTime}</span></span>
                    <span className="block mt-1">Status: <span className="font-bold text-emerald-600 uppercase">{activeShiftToReceipt.status.toUpperCase()}</span></span>
                  </div>
                </div>

                {/* Financial reconciles */}
                <div className="space-y-4">
                  <strong className="font-sans text-xs font-bold text-slate-900 uppercase block border-b border-slate-100 pb-2">
                    {t('Final Cash Audit Sheet Summary', 'حتمی کیش گوشوارہ پڑتال')}
                  </strong>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs font-sans">
                    <div className="rounded-lg bg-slate-50 p-3 space-y-1.5 border border-slate-105">
                      <span className="text-slate-400 font-semibold block">{t('EXPECTED COMPUTED CASH:', 'حسابی کیش ہونا چاہیۓ تھا:')}</span>
                      <strong className="font-mono text-sm font-bold text-slate-800">{formatCurrency(activeShiftToReceipt.expectedCash, settings)}</strong>
                    </div>

                    <div className="rounded-lg bg-orange-55/10 p-3 space-y-1.5 border border-orange-100">
                      <span className="text-orange-600 font-semibold block">{t('SUBMITTED PHYSICAL CASH:', 'وصول شدہ فزیکل کیش:')}</span>
                      <strong className="font-mono text-sm font-bold text-orange-700">{formatCurrency(activeShiftToReceipt.submittedCash, settings)}</strong>
                    </div>
                  </div>

                  {activeShiftToReceipt.shortage > 0 ? (
                    <div className="rounded-lg p-3 bg-red-50 border border-red-100 font-sans text-xs text-red-700 font-bold flex items-center gap-2">
                      <span>⚠️ {t(`Operator Shortage Detected: ${formatCurrency(activeShiftToReceipt.shortage, settings)}`, `کیش میں کمی (شارٹیج): ${formatCurrency(activeShiftToReceipt.shortage, settings)}`)}</span>
                    </div>
                  ) : activeShiftToReceipt.overage > 0 ? (
                    <div className="rounded-lg p-3 bg-emerald-50 border border-emerald-100 font-sans text-xs text-emerald-700 font-bold flex items-center gap-2">
                      <span>✅ {t(`Excess Overage Collected: ${formatCurrency(activeShiftToReceipt.overage, settings)}`, `کیش میں زیادتی (فالتو): ${formatCurrency(activeShiftToReceipt.overage, settings)}`)}</span>
                    </div>
                  ) : (
                    <div className="rounded-lg p-3 bg-teal-50 border border-teal-100 font-sans text-xs text-teal-700 font-bold flex items-center gap-2">
                      <span>✅ {t('Shift audit completely tally! Zero discrepancy.', 'کیش موازنہ بالکل برابر ہے۔')}</span>
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t border-slate-100 flex justify-end gap-2">
                  <button
                    onClick={() => {
                      const printContents = document.getElementById('print-area')?.innerHTML;
                      const originalContents = document.body.innerHTML;
                      if (printContents) {
                        document.body.innerHTML = printContents;
                        window.print();
                        document.body.innerHTML = originalContents;
                        window.location.reload();
                      }
                    }}
                    className="flex items-center gap-1.5 rounded-lg bg-slate-800 text-white font-sans text-xs font-bold px-4 py-2 hover:bg-slate-900 transition-colors cursor-pointer"
                  >
                    <Printer className="h-3.5 w-3.5" />
                    <span>{t('Print final shift slip receipt', 'شفٹ بل رسید پرنٹ کریں')}</span>
                  </button>
                </div>

              </div>
            ) : (
              <div className="h-full rounded-xl border border-dashed border-slate-250 py-32 text-center text-slate-450 font-sans text-xs flex flex-col justify-center items-center gap-3 bg-white/20">
                <FileText className="h-10 w-10 text-slate-350" />
                <span>{t('Select an archived finalized shift to render the invoice slip layout.', 'بائیں پینل سے کسی فائنل کردہ شفٹ روزنامچہ رسید کا انتخاب کریں')}</span>
              </div>
            )}
          </div>

        </div>
      )}

      {/* ========================================================
          REPORT VIEW 5: CHANNELS & BANK RECONCILIATION AUDITING CONSOLE
          ======================================================== */}
      {activeReportTab === 'reconciliation' && (
        <div className="space-y-6">
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
            <div>
              <h3 className="font-sans text-sm font-bold text-slate-800 uppercase tracking-wider">
                {t('Double-Entry Bank & Digital reconciliation audit panel', 'ڈبل انٹری بینک اور ڈیجیٹل بقایا تصفیہ اور ریکنسیلیشن')}
              </h3>
              <p className="font-sans text-xs text-slate-400 mt-1">
                {t('Audit shift digital sales against bank cash deposits, spot-check variance logs, and settle discrepancies.', 'موبائل والٹ پر کی گئی ڈیجیٹل سیلز کا بینک میں نقد جمع کرائی گئی رقم کے ساتھ آڈٹ اور تصفیہ کا خودکار نظام۔')}
              </p>
            </div>
          </div>

          {/* Aggregated indicators */}
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block leading-snug">{t('Total Shifts Logged', 'کل شفٹ ریکارڈز')}</span>
              <strong className="font-mono text-lg font-bold text-slate-800 block mt-1">{shifts.length}</strong>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block leading-snug">{t('Reconciled & Settle (✓)', 'تصفیہ شدہ شفٹس')}</span>
              <strong className="font-mono text-lg font-bold text-emerald-600 block mt-1">{reconciledShiftIds.length}</strong>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block leading-snug">{t('Unreconciled Audits (✕)', 'زیر التوا آڈٹس')}</span>
              <strong className="font-mono text-lg font-bold text-amber-600 block mt-1">{shifts.length - reconciledShiftIds.length}</strong>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block leading-snug">{t('Master Bank Balance', 'مجموعی بینک بیلنس')}</span>
              <strong className="font-mono text-lg font-bold text-blue-600 block mt-1">
                {formatCurrency(banks.reduce((sum, b) => sum + b.balance, 0), settings)}
              </strong>
            </div>
          </div>

          {/* Main Reconciliation comparison table */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
            <h4 className="font-sans text-xs font-bold text-slate-550 uppercase tracking-wider border-b border-slate-100 pb-2">
              {t('Shift-by-Shift Cash Verification Sheet', 'برائے شفٹ وار ڈیجیٹل اور بینک کیش آڈٹ شیٹ')}
            </h4>

            {shifts.length === 0 ? (
              <p className="text-center py-10 font-sans text-xs text-slate-400">{t('No finalized shifts recorded in system.', 'سسٹم میں کوئی شفٹ لاگ درج نہیں ملا۔')}</p>
            ) : (
              <div className="w-full">
                <ResponsiveTable
                  data={shifts}
                  columns={[
                    {
                      header: t('Shift Date & ID', 'تاریخ و شفٹ'),
                      accessor: (s) => (
                        <>
                          <span className="font-mono text-[11px] text-slate-400 block">{s.date}</span>
                          <strong className="text-slate-800 text-xs">SH-{s.id}</strong>
                        </>
                      ),
                      isSecondaryMobile: true
                    },
                    {
                      header: t('Supervisor', 'سپروائزر'),
                      accessor: (s) => <span className="text-slate-600 truncate max-w-[120px]" title={s.staffId}>{s.staffId?.toUpperCase()}</span>,
                      isPrimaryMobile: true
                    },
                    {
                      header: t('Shift Digital Payments (A)', 'ڈیجیٹل والٹ وصولی (A)' ),
                      className: 'text-right',
                      accessor: (s) => {
                        const totalDigital = (s.digitalCashEntries || []).reduce((sum, dc) => sum + dc.amount, 0);
                        return <span className="font-mono font-bold text-slate-800">{formatCurrency(totalDigital, settings)}</span>;
                      }
                    },
                    {
                      header: t('Shift Bank Deposits (B)', 'بینک ڈیپازٹ رقم (B)'),
                      className: 'text-right',
                      accessor: (s) => {
                        const totalBank = (s.bankCashEntries || []).reduce((sum, bc) => sum + bc.amount, 0);
                        return <span className="font-mono font-bold text-slate-800">{formatCurrency(totalBank, settings)}</span>;
                      }
                    },
                    {
                      header: t('Audit Gap / Variance (A - B)', 'حساب میں فرق'),
                      className: 'text-right',
                      accessor: (s) => {
                        const totalDigital = (s.digitalCashEntries || []).reduce((sum, dc) => sum + dc.amount, 0);
                        const totalBank = (s.bankCashEntries || []).reduce((sum, bc) => sum + bc.amount, 0);
                        const variance = totalDigital - totalBank;
                        return <span className={`font-mono font-extrabold text-[12px] ${variance === 0 ? 'text-slate-500' : 'text-rose-600'}`}>{formatCurrency(variance, settings)}</span>;
                      }
                    },
                    {
                      header: t('Status', 'اسٹیٹس'),
                      className: 'text-center',
                      accessor: (s) => {
                        const totalDigital = (s.digitalCashEntries || []).reduce((sum, dc) => sum + dc.amount, 0);
                        const totalBank = (s.bankCashEntries || []).reduce((sum, bc) => sum + bc.amount, 0);
                        const variance = totalDigital - totalBank;
                        const isReconciled = reconciledShiftIds.includes(s.id);
                        return isReconciled ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-bold text-emerald-700 leading-none">
                            ✓ {t('Reconciled', 'تصفیہ مکمل')}
                          </span>
                        ) : variance === 0 ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-1 text-[10px] font-bold text-amber-700 leading-none">
                            ⚠ {t('Pending Verification', 'آڈٹ زیر التواء')}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2 py-1 text-[10px] font-bold text-rose-700 leading-none">
                            ✕ {t('Discrepancy Variance', 'حساب میں فرق')}
                          </span>
                        );
                      }
                    },
                    {
                      header: t('Verification Settle', 'آڈٹ ایکشن'),
                      className: 'text-right',
                      accessor: (s) => {
                        const isReconciled = reconciledShiftIds.includes(s.id);
                        return (
                          <button
                            onClick={() => handleToggleReconcile(s.id)}
                            className={`text-[10.5px] font-bold px-3 py-1 rounded-md transition-all cursor-pointer ${
                              isReconciled
                                ? 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                                : 'bg-orange-600 text-white hover:bg-orange-700'
                            }`}
                          >
                            {isReconciled ? t('Un-reconcile', 'دوبارہ آڈٹ کریں') : t('Mark Reconciled', 'توازن منظور کریں')}
                          </button>
                        );
                      }
                    }
                  ]}
                  keyExtractor={(s) => s.id}
                  emptyMessage={t('No finalized shifts recorded in system.', 'سسٹم میں کوئی شفٹ لاگ درج نہیں ملا۔')}
                />
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
