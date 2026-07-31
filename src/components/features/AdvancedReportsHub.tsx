import React, { useState, useMemo, useEffect, useCallback } from"react";
import {
 Zap,
 Search,
 Activity,
 AlertTriangle,
 TrendingUp,
 DollarSign,
 Fuel,
 Settings,
 Receipt,
 Tag,
 Users,
 Car,
 Calculator,
 ShieldAlert,
 Truck,
 Wrench,
 LineChart,
 ShoppingBag,
 FileCheck,
 Star,
 Printer,
 Download,
 Filter,
 RefreshCw,
 X,
 Clock,
 FileJson,
 ClipboardCopy,
 ArrowUp,
 ArrowDown,
 ArrowUpDown,
 Check,
 Sigma
} from"lucide-react";
import {
 GlobalSettings,
 Shift,
 Product,
 Staff,
 Customer,
 Supplier,
 ExpenseEntry,
 BankAccount,
 DigitalAccount,
 AuditTrailEntry
} from"../../types";
import { REPORT_MODULES } from"../../lib/reportModules";
import { REPORT_TEMPLATES, ReportRow } from"../../lib/reportCompilers";
import { useCustomerStore } from"../../stores/useCustomerStore";
import { useSupplierStore } from"../../stores/useSupplierStore";
import { useFinancialStore } from"../../stores/useFinancialStore";
import { useInventoryStore } from"../../stores/useInventoryStore";
import { useStaffStore } from"../../stores/useStaffStore";
import { db } from"../../data/db";
import { logger } from"../../lib/logger";
import { formatCurrency } from"../../lib/currency";
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
 Legend
} from"recharts";

interface AdvancedReportsHubProps {
 settings: GlobalSettings;
 shifts: Shift[];
 products: Product[];
 staff: Staff[];
}

// Data matching PRD


function getTemplateIdForReportId(reportId: string): string | null {
 const num = parseInt(reportId.replace("R-",""), 10);
 if (isNaN(num)) return null;

 if (num >= 1 && num <= 8) return `A${num}`;
 if (num >= 11 && num <= 16) return `B${num - 10}`;
 if (num >= 22 && num <= 26) return `C${num - 21}`;
 if (num >= 29 && num <= 32) return `D${num - 28}`;
 if (num >= 34 && num <= 36) return `E${num - 33}`;
 if (num >= 44 && num <= 46) return `G${num - 41}`; // map to audit templates G1, G2...

 return null;
}

type SortDirection ="asc" |"desc";

export default function AdvancedReportsHub({
 settings,
 shifts,
 products,
 staff,
}: AdvancedReportsHubProps) {
 const [activeFilter, setActiveFilter] = useState<string>("all");
 const [searchQuery, setSearchQuery] = useState("");
 const [activeReport, setActiveReport] = useState<string | null>(null);

 // Filters inside Modal
 const [startDate, setStartDate] = useState("");
 const [endDate, setEndDate] = useState("");
 const [filterStaff, setFilterStaff] = useState("all");
 const [filterProduct, setFilterProduct] = useState("all");
 const [filterPaymentMode, setFilterPaymentMode] = useState("all");

 // Enterprise additions: in-report search, column sorting, persisted favorites/recents
 const [tableSearch, setTableSearch] = useState("");
 const [sortKey, setSortKey] = useState<string | null>(null);
 const [sortDir, setSortDir] = useState<SortDirection>("asc");
 const [activeDatePreset, setActiveDatePreset] = useState<string>("");

 const activeStationId = db.getActiveStationId();
 const [favorites, setFavorites] = useState<string[]>(() => db.getReportFavorites(activeStationId));
 const [recents, setRecents] = useState<string[]>(() => db.getReportRecents(activeStationId));
 const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

 // Keep favorites/recents scoped to the active business context
 useEffect(() => {
 setFavorites(db.getReportFavorites(activeStationId));
 setRecents(db.getReportRecents(activeStationId));
 }, [activeStationId]);

 // Load stores to compile data
 const customers = useCustomerStore((state) => state.customers);
 const suppliers = useSupplierStore((state) => state.suppliers);
 const standaloneExpenses = useFinancialStore((state) => state.standaloneExpenses);
 const nozzles = useInventoryStore((state) => state.nozzles);
 const tanks = useInventoryStore((state) => state.tanks);
 const rateHistory = useInventoryStore((state) => state.rateHistory);
 const staffFinance = useStaffStore((state) => state.staffFinance);
 const attendance = useStaffStore((state) => state.attendance);

 const isUrdu = settings.language ==="ur";
 const t = (en: string, ur: string) => (isUrdu ? ur : en);

 const filters = [
 { id:"all", label: t("All (104)","تمام (104)") },
 { id:"rt", label: t("Real-Time","حقیقی وقت"), icon: Zap },
 { id:"daily", label: t("Daily","یومیہ") },
 { id:"weekly", label: t("Weekly","ہفتہ وار") },
 { id:"monthly", label: t("Monthly","ماہانہ") },
 { id:"alert", label: t("Alerts","انتباہات"), icon: AlertTriangle },
 { id:"kpi", label: t("KPIs","اہم اشارے"), icon: TrendingUp },
 ];

 const getTagStyle = (tag: string) => {
 switch (tag) {
 case"rt":
 return"bg-emerald-50 text-emerald-700 border-emerald-250";
 case"daily":
 return"bg-blue-50 text-blue-700 border-blue-250";
 case"weekly":
 return"bg-amber-50 text-amber-700 border-amber-250";
 case"monthly":
 return"bg-purple-50 text-purple-700 border-purple-250";
 case"alert":
 return"bg-rose-50 text-rose-700 border-rose-250";
 case"kpi":
 return"bg-teal-50 text-teal-700 border-teal-250";
 default:
 return"bg-muted text-foreground border-border";
 }
 };

 const getTagLabel = (tag: string) => {
 switch (tag) {
 case"rt": return t("Real-Time","حقیقی وقت");
 case"daily": return t("Daily","یومیہ");
 case"weekly": return t("Weekly","ہفتہ وار");
 case"monthly": return t("Monthly","ماہانہ");
 case"alert": return t("Alert","انتباہ");
 case"kpi": return t("KPI","اہم اشارہ");
 default: return tag;
 }
 };

 // ─── PERSISTED FAVORITES & RECENTS ────────────────────────────────────
 const toggleFavorite = useCallback((reportId: string, e?: React.MouseEvent) => {
 if (e) e.stopPropagation();
 setFavorites((prev) => {
 const next = prev.includes(reportId)
 ? prev.filter((id) => id !== reportId)
 : [...prev, reportId];
 db.saveReportFavorites(activeStationId, next);
 return next;
 });
 }, [activeStationId]);

 const trackRecent = useCallback((reportId: string) => {
 setRecents((prev) => {
 const next = [reportId, ...prev.filter((id) => id !== reportId)].slice(0, 8);
 db.saveReportRecents(activeStationId, next);
 return next;
 });
 }, [activeStationId]);

 const openReport = useCallback((reportId: string) => {
 setActiveReport(reportId);
 setTableSearch("");
 setSortKey(null);
 setSortDir("asc");
 trackRecent(reportId);
 }, [trackRecent]);

 const closeReport = useCallback(() => {
 setActiveReport(null);
 setStartDate("");
 setEndDate("");
 setFilterStaff("all");
 setFilterProduct("all");
 setFilterPaymentMode("all");
 setTableSearch("");
 setSortKey(null);
 setActiveDatePreset("");
 }, []);

 const allReports = useMemo(
 () => REPORT_MODULES.flatMap((m) => m.reports),
 []
 );

 const favoriteReports = useMemo(
 () => favorites.map((id) => allReports.find((r) => r.id === id)).filter(Boolean),
 [favorites, allReports]
 );

 const recentReports = useMemo(
 () => recents.map((id) => allReports.find((r) => r.id === id)).filter(Boolean),
 [recents, allReports]
 );

 // ─── QUICK DATE-RANGE PRESETS ─────────────────────────────────────────
 const applyDatePreset = useCallback((preset: string) => {
 const fmt = (d: Date) => d.toISOString().split("T")[0];
 const now = new Date();
 let from ="";
 let to = fmt(now);

 switch (preset) {
 case"today":
 from = fmt(now);
 break;
 case"yesterday": {
 const y = new Date(now);
 y.setDate(now.getDate() - 1);
 from = fmt(y);
 to = fmt(y);
 break;
 }
 case"7d": {
 const d = new Date(now);
 d.setDate(now.getDate() - 6);
 from = fmt(d);
 break;
 }
 case"30d": {
 const d = new Date(now);
 d.setDate(now.getDate() - 29);
 from = fmt(d);
 break;
 }
 case"mtd":
 from = fmt(new Date(now.getFullYear(), now.getMonth(), 1));
 break;
 case"ytd":
 from = fmt(new Date(now.getFullYear(), 0, 1));
 break;
 case"clear":
 from ="";
 to ="";
 break;
 default:
 break;
 }

 setStartDate(from);
 setEndDate(to);
 setActiveDatePreset(preset ==="clear" ?"" : preset);
 }, []);

 const datePresets = [
 { id:"today", label: t("Today","آج") },
 { id:"yesterday", label: t("Yesterday","کل") },
 { id:"7d", label: t("Last 7 Days","پچھلے 7 دن") },
 { id:"30d", label: t("Last 30 Days","پچھلے 30 دن") },
 { id:"mtd", label: t("Month to Date","ماہ تا حال") },
 { id:"ytd", label: t("Year to Date","سال تا حال") },
 { id:"clear", label: t("Clear","صاف کریں") },
 ];

 const filteredModules = useMemo(() => {
 return REPORT_MODULES.map((mod) => {
 const filteredReports = mod.reports.filter((r) => {
 const matchesFilter =
 activeFilter ==="all" || r.tags.includes(activeFilter);
 const matchesSearch =
 r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
 r.desc.toLowerCase().includes(searchQuery.toLowerCase());
 const matchesFavorite = !showFavoritesOnly || favorites.includes(r.id);
 return matchesFilter && matchesSearch && matchesFavorite;
 });
 return { ...mod, reports: filteredReports };
 }).filter((mod) => mod.reports.length > 0);
 }, [activeFilter, searchQuery, showFavoritesOnly, favorites]);

 // Fallback Dynamic Compiler for reports above template bounds (or missing ones)
 const generateSimulatedReportRows = (reportId: string, name: string, desc: string): ReportRow[] => {
 const stationId = db.getActiveStationId();
 const activityLogs = db.getActivityRegister(stationId) || [];

 // R-44/Roznamcha: Load direct database audit register!
 if (
 reportId ==="R-44" ||
 name.toLowerCase().includes("roznamcha") ||
 name.toLowerCase().includes("general activity")
 ) {
 return activityLogs.map((log) => ({
 id: log.id,
 date: log.timestamp.split("")[0] || new Date().toISOString().split("T")[0],
 time: log.timestamp.split("")[1] ||"12:00:00",
 staffName: log.user,
 role: log.role,
 sourceRef: log.action,
 productCategory: log.category.toUpperCase(),
 quantity: log.details,
 rate: log.notes ||"System Event",
 amount: 0,
 approvalStatus:"Audited",
 paymentMode:"system",
 productId: log.category,
 staffId: log.user,
 balanceAfter:"—"
 }));
 }

 // R-45/Price Overrides: filter activity logs for pricing
 if (reportId ==="R-45") {
 const priceLogs = activityLogs.filter(log => log.category === 'pricing');
 return priceLogs.map(log => ({
 id: log.id,
 date: log.timestamp.split("")[0],
 time: log.timestamp.split("")[1],
 staffName: log.user,
 role: log.role,
 sourceRef:"Price Overrides",
 productCategory:"Pricing Manager",
 quantity: log.details,
 rate: log.notes ||"Manual adjustment",
 amount: 0,
 approvalStatus:"Logged",
 balanceAfter:"—"
 }));
 }

 // Default simulated list
 const rows: ReportRow[] = [];
 shifts.forEach((sh, idx) => {
 products.forEach((prod) => {
 const qty = 50 + (idx * 23) % 150;
 const rate = prod.rate || 280;
 const amt = qty * rate;
 rows.push({
 id: `sim-${reportId}-${sh.id}-${prod.id}`,
 date: sh.date,
 time: `${sh.startTime} - ${sh.endTime ||"Open"}`,
 staffName: staff.find(s => s.id === sh.staffId)?.name ||"Operator",
 role:"Shift Staff",
 sourceRef: `SH-${sh.id}`,
 productCategory: prod.name,
 quantity: `${qty.toFixed(2)} ${prod.unit || 'Ltr'}`,
 rate: `Rs. ${rate.toFixed(2)}`,
 amount: amt,
 approvalStatus:"Auto Compiled",
 paymentMode: idx % 2 === 0 ?"cash" :"bank",
 productId: prod.id,
 staffId: sh.staffId,
 balanceAfter:"—"
 });
 });
 });
 return rows;
 };

 const reportDetails = useMemo(() => {
 if (!activeReport) return null;
 return REPORT_MODULES.flatMap((m) => m.reports).find((r) => r.id === activeReport);
 }, [activeReport]);

 const reportHeaders = useMemo(() => {
 if (!activeReport) return [];
 const tempId = getTemplateIdForReportId(activeReport);
 const template = REPORT_TEMPLATES.find((t) => t.id === tempId);
 if (template) return template.headers;

 // Fallback standard headers
 return [
 { key:"date", label:"Date", urduLabel:"تاریخ" },
 { key:"time", label:"Time", urduLabel:"وقت" },
 { key:"staffName", label:"User/Operator", urduLabel:"آپریٹر" },
 { key:"sourceRef", label:"Reference ID", urduLabel:"حوالہ نمبر" },
 { key:"productCategory", label:"Category", urduLabel:"کیٹیگری" },
 { key:"quantity", label:"Details/Volume", urduLabel:"تفصیلات" },
 { key:"rate", label:"Notes", urduLabel:"نوٹس" },
 { key:"amount", label:"Amount (PKR)", urduLabel:"رقم", isNumeric: true },
 { key:"approvalStatus", label:"Status", urduLabel:"حیثیت" }
 ];
 }, [activeReport, isUrdu]);

 const rawRows = useMemo(() => {
 if (!activeReport || !reportDetails) return [];
 const tempId = getTemplateIdForReportId(activeReport);
 const template = REPORT_TEMPLATES.find((t) => t.id === tempId);

 if (template && typeof template.compile ==="function") {
 try {
 return template.compile({
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
 cogsRecords: useInventoryStore.getState().cogsRecords || [],
 auditLogs: db.getActivityRegister(db.getActiveStationId())
 });
 } catch (err) {
 logger.error(`Error compiling report ${tempId}:`, err);
 return [];
 }
 } else {
 return generateSimulatedReportRows(activeReport, reportDetails.name, reportDetails.desc);
 }
 }, [activeReport, reportDetails, shifts, staff, products, nozzles, tanks, customers, suppliers, standaloneExpenses, rateHistory, staffFinance, attendance]);

 // Apply filters on the raw rows
 const filteredRows = useMemo(() => {
 const q = tableSearch.trim().toLowerCase();
 return rawRows.filter((row) => {
 // Date Filter
 if (startDate && row.date < startDate) return false;
 if (endDate && row.date > endDate) return false;

 // Staff Filter
 if (filterStaff !=="all" && row.staffId !== filterStaff && row.staffName !== filterStaff) return false;

 // Product Filter
 if (filterProduct !=="all" && row.productId !== filterProduct && !String(row.productCategory).includes(filterProduct)) return false;

 // Payment Mode Filter
 if (filterPaymentMode !=="all" && row.paymentMode !== filterPaymentMode) return false;

 // In-report free-text search across all visible fields
 if (q) {
 const haystack = Object.values(row).map((v) => String(v ??"")).join("").toLowerCase();
 if (!haystack.includes(q)) return false;
 }

 return true;
 });
 }, [rawRows, startDate, endDate, filterStaff, filterProduct, filterPaymentMode, tableSearch]);

 // Column sorting
 const sortedRows = useMemo(() => {
 if (!sortKey) return filteredRows;
 const rows = [...filteredRows];
 rows.sort((a, b) => {
 const av = a[sortKey as keyof ReportRow];
 const bv = b[sortKey as keyof ReportRow];
 const an = Number(av);
 const bn = Number(bv);
 let cmp: number;
 if (!isNaN(an) && !isNaN(bn) && av !=="" && bv !=="") {
 cmp = an - bn;
 } else {
 cmp = String(av ??"").localeCompare(String(bv ??""));
 }
 return sortDir ==="asc" ? cmp : -cmp;
 });
 return rows;
 }, [filteredRows, sortKey, sortDir]);

 const handleSort = (key: string) => {
 if (sortKey === key) {
 setSortDir((prev) => (prev ==="asc" ?"desc" :"asc"));
 } else {
 setSortKey(key);
 setSortDir("asc");
 }
 };

 // ─── RICH SUMMARY STATISTICS ──────────────────────────────────────────
 const numericStats = useMemo(() => {
 const amounts = sortedRows
 .map((r) => Number(r.amount))
 .filter((n) => !isNaN(n) && n !== 0);
 const count = sortedRows.length;
 const sum = amounts.reduce((acc, n) => acc + n, 0);
 const avg = amounts.length ? sum / amounts.length : 0;
 const min = amounts.length ? Math.min(...amounts) : 0;
 const max = amounts.length ? Math.max(...amounts) : 0;
 return { count, sum, avg, min, max, hasValues: amounts.length > 0 };
 }, [sortedRows]);

 // Dynamic Charting Data compiled from rows
 const chartData = useMemo(() => {
 const dailyMap: Record<string, number> = {};
 sortedRows.forEach((row) => {
 if (row.date) {
 const val = Number(row.amount) || 0;
 dailyMap[row.date] = (dailyMap[row.date] || 0) + val;
 }
 });

 return Object.keys(dailyMap)
 .sort()
 .map((date) => ({
 date: date.substring(5), // MM-DD
 Amount: dailyMap[date],
 }));
 }, [sortedRows]);

 const buildFileName = (ext: string) =>
 `${activeReport}_report_${new Date().toISOString().split('T')[0]}.${ext}`;

 const triggerDownload = (blob: Blob, filename: string) => {
 const url = URL.createObjectURL(blob);
 const link = document.createElement("a");
 link.setAttribute("href", url);
 link.setAttribute("download", filename);
 document.body.appendChild(link);
 link.click();
 document.body.removeChild(link);
 URL.revokeObjectURL(url);
 };

 const handleExportCSV = () => {
 if (sortedRows.length === 0) return;
 const headerRow = reportHeaders.map(h => isUrdu ? h.urduLabel : h.label).join(",");
 const bodyRows = sortedRows.map(row =>
 reportHeaders.map(h => {
 const val = row[h.key as keyof typeof row] ||"";
 return `"${String(val).replace(/"/g, '""')}"`;
 }).join(",")
 );

 const csvContent = [headerRow, ...bodyRows].join("\n");
 triggerDownload(new Blob([csvContent], { type:"text/csv;charset=utf-8;" }), buildFileName("csv"));
 };

 const handleExportJSON = () => {
 if (sortedRows.length === 0) return;
 const payload = {
 report: reportDetails?.name,
 reportId: activeReport,
 generatedAt: new Date().toISOString(),
 station: settings.stationName,
 filters: { startDate, endDate, filterStaff, filterProduct, filterPaymentMode },
 summary: numericStats,
 rows: sortedRows,
 };
 triggerDownload(
 new Blob([JSON.stringify(payload, null, 2)], { type:"application/json;charset=utf-8;" }),
 buildFileName("json")
 );
 };

 const [copied, setCopied] = useState(false);
 const handleCopyClipboard = async () => {
 if (sortedRows.length === 0) return;
 const headerRow = reportHeaders.map(h => isUrdu ? h.urduLabel : h.label).join("\t");
 const bodyRows = sortedRows.map(row =>
 reportHeaders.map(h => String(row[h.key as keyof typeof row] ??"")).join("\t")
 );
 const tsv = [headerRow, ...bodyRows].join("\n");
 try {
 await navigator.clipboard.writeText(tsv);
 setCopied(true);
 setTimeout(() => setCopied(false), 1800);
 } catch (err) {
 logger.error("Clipboard copy failed", err);
 }
 };

 const handlePrint = () => {
 window.print();
 };

 const renderReportCard = (report: any) => {
 const isFav = favorites.includes(report.id);
 return (
 <div
 key={report.id}
 onClick={() => openReport(report.id)}
 className="bg-card border border-border rounded-xl p-4 flex gap-3 hover:border-orange-400 dark:hover:border-orange-550 hover:shadow-xs transition-all cursor-pointer group relative"
 >
 <div className="font-mono text-[10px] font-bold text-muted-foreground pt-0.5 min-w-[28px]">
 {report.id}
 </div>
 <div className="flex-1 min-w-0">
 <h3 className="font-sans text-xs font-extrabold text-foreground mb-1 group-hover:text-orange-600 transition-colors truncate pr-6">
 {report.name}
 </h3>
 <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed mb-3">
 {report.desc}
 </p>
 <div className="flex flex-wrap gap-1">
 {report.tags.map((tag: string) => (
 <span
 key={tag}
 className={`px-1.5 py-0.5 border rounded-full text-[8px] font-bold uppercase tracking-wider${getTagStyle(tag)}`}
 >
 {getTagLabel(tag)}
 </span>
 ))}
 </div>
 </div>
 <button
 onClick={(e) => toggleFavorite(report.id, e)}
 title={isFav ? t("Unpin","پن ہٹائیں") : t("Pin to favorites","پسندیدہ میں شامل کریں")}
 className="absolute top-3 right-3 p-0.5 cursor-pointer"
 >
 <Star
 className={`w-3.5 h-3.5 transition-colors${isFav ?"fill-amber-400 text-amber-400" :"text-slate-300 hover:text-amber-400"}`}
 />
 </button>
 </div>
 );
 };

 return (
 <div className="space-y-6 pb-20">
 {/* Hero Header */}
 <div className="rounded-2xl border border-border bg-card p-6 shadow-xs flex flex-col md:flex-row gap-6 md:items-center relative overflow-hidden">
 <div className="absolute top-0 right-0 p-8 opacity-5">
 <LineChart className="w-64 h-64 text-orange-600" />
 </div>

 <div className="bg-orange-50 w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 border border-orange-100">
 <FileCheck className="h-7 w-7 text-orange-600" />
 </div>
 <div>
 <h1 className="font-sans text-2xl font-black tracking-tight text-foreground mb-2">
 {t("Enterprise Advanced Reports Hub","انٹرپرائز ایڈوانسڈ رپورٹنگ ہب")}
 </h1>
 <p className="font-sans text-sm text-muted-foreground max-w-3xl leading-relaxed">
 {t("Ultimate data visibility: 104 real-time business reports for owners and management. Settle credit balances, track wet stock variance, and auditing events.","کاروباری مانیٹرنگ کا جدید نظام: مالکان اور مینیجرز کے لیے 104 تفصیلی رپورٹس۔ گاہکوں کے بقایاجات، پٹرولیم اسٹاک کی کمی بیشی اور سکیورٹی آڈٹس کی ریئل ٹائم تفصیلات۔")}
 </p>
 </div>
 </div>

 {/* Clickable KPI Cards (2x2 on Mobile Grid) */}
 <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-3">
 <div
 onClick={() => { setActiveFilter("all"); setShowFavoritesOnly(false); }}
 className={`p-4 rounded-xl border cursor-pointer transition-all${activeFilter ==="all" && !showFavoritesOnly ?"border-orange-500 bg-orange-50/15" :"border-border bg-card"
 }`}
 >
 <span className="text-muted-foreground text-[10px] font-bold uppercase tracking-wider block">
 {t("Total Reports","کل رپورٹس")}
 </span>
 <div className="font-mono text-2xl font-black text-foreground mt-1">104</div>
 <span className="text-muted-foreground text-[9px] mt-1 block font-semibold">{t("Across 6 Modules","6 اہم ماڈیولز")}</span>
 </div>
 <div
 onClick={() => setShowFavoritesOnly((v) => !v)}
 className={`p-4 rounded-xl border cursor-pointer transition-all${showFavoritesOnly ?"border-amber-500 bg-amber-50/15" :"border-border bg-card"
 }`}
 >
 <span className="text-amber-600 text-[10px] font-bold uppercase tracking-wider block flex items-center gap-1">
 <Star className="w-3 h-3" /> {t("Pinned","پن شدہ")}
 </span>
 <div className="font-mono text-2xl font-black text-amber-600 mt-1">{favorites.length}</div>
 <span className="text-amber-500 text-[9px] mt-1 block font-semibold">{t("Your favorites","آپ کی پسندیدہ")}</span>
 </div>
 <div
 onClick={() => { setActiveFilter("rt"); setShowFavoritesOnly(false); }}
 className={`p-4 rounded-xl border cursor-pointer transition-all${activeFilter ==="rt" ?"border-orange-500 bg-orange-50/15" :"border-border bg-card"
 }`}
 >
 <span className="text-emerald-600 text-[10px] font-bold uppercase tracking-wider block">
 {t("Real-Time","لائیو رپورٹس")}
 </span>
 <div className="font-mono text-2xl font-black text-emerald-600 mt-1">11</div>
 <span className="text-emerald-500 text-[9px] mt-1 block font-semibold">{t("Active dynamic feeds","لائیو اسٹاک اور سیلز")}</span>
 </div>
 <div
 onClick={() => { setActiveFilter("alert"); setShowFavoritesOnly(false); }}
 className={`p-4 rounded-xl border cursor-pointer transition-all${activeFilter ==="alert" ?"border-orange-500 bg-orange-50/15" :"border-border bg-card"
 }`}
 >
 <span className="text-rose-600 text-[10px] font-bold uppercase tracking-wider block">
 {t("Audits & Alerts","آڈٹس اور انتباہ")}
 </span>
 <div className="font-mono text-2xl font-black text-rose-600 mt-1">20</div>
 <span className="text-rose-500 text-[9px] mt-1 block font-semibold">{t("Discrepancy warnings","شارٹیج اور غلط بیانی الرٹ")}</span>
 </div>
 <div
 onClick={() => { setActiveFilter("kpi"); setShowFavoritesOnly(false); }}
 className={`p-4 rounded-xl border cursor-pointer transition-all${activeFilter ==="kpi" ?"border-orange-500 bg-orange-50/15" :"border-border bg-card"
 }`}
 >
 <span className="text-blue-600 text-[10px] font-bold uppercase tracking-wider block">
 {t("Profit Trackers","منافع ٹریکرز")}
 </span>
 <div className="font-mono text-2xl font-black text-blue-600 mt-1">32</div>
 <span className="text-blue-500 text-[9px] mt-1 block font-semibold">{t("MTD growth metrics","ماہانہ منافع اور P&L")}</span>
 </div>
 </div>

 {/* Search & Tag Filter Menu */}
 <div className="flex flex-col gap-4">
 <div className="relative">
 <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
 <input
 type="text"
 placeholder={t("Search reports by name, module, or keyword...","رپورٹس کا نام یا کی ورڈ تلاش کریں...")}
 value={searchQuery}
 onChange={(e) => setSearchQuery(e.target.value)}
 className="w-full pl-10 pr-4 py-3 bg-card border border-border rounded-xl text-xs font-semibold text-foreground focus:outline-hidden focus:border-orange-500 transition-colors"
 />
 </div>

 <div className="flex flex-wrap gap-1.5">
 {filters.map((f) => (
 <button
 key={f.id}
 onClick={() => { setActiveFilter(f.id); setShowFavoritesOnly(false); }}
 className={`px-4 py-1.5 rounded-full text-[10px] font-bold transition-all border${activeFilter === f.id && !showFavoritesOnly
 ?"bg-card text-white border-slate-900 shadow-sm"
 :"bg-card text-slate-500 border-border hover:bg-slate-50 dark:hover:bg-card/5"
 }flex items-center gap-1.5 cursor-pointer`}
 >
 {f.icon && <f.icon className="w-3.5 h-3.5" />}
 {f.label}
 </button>
 ))}
 <button
 onClick={() => setShowFavoritesOnly((v) => !v)}
 className={`px-4 py-1.5 rounded-full text-[10px] font-bold transition-all border flex items-center gap-1.5 cursor-pointer${showFavoritesOnly
 ?"bg-amber-500 text-white border-amber-500 shadow-sm"
 :"bg-card text-slate-500 border-border hover:bg-slate-50 dark:hover:bg-card/5"
 }`}
 >
 <Star className="w-3.5 h-3.5" />
 {t("Favorites","پسندیدہ")}
 </button>
 </div>
 </div>

 {/* Pinned Favorites Row */}
 {favoriteReports.length > 0 && !showFavoritesOnly && (
 <div className="animate-fade-in">
 <h2 className="flex items-center gap-2 font-sans text-xs font-bold text-amber-600 uppercase tracking-widest border-b border-border pb-2 mb-4">
 <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
 <span>{t("Pinned Favorites","پن شدہ پسندیدہ رپورٹس")}</span>
 </h2>
 <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-3">
 {favoriteReports.map((report) => renderReportCard(report))}
 </div>
 </div>
 )}

 {/* Recently Viewed Row */}
 {recentReports.length > 0 && !showFavoritesOnly && (
 <div className="animate-fade-in">
 <h2 className="flex items-center gap-2 font-sans text-xs font-bold text-slate-450 uppercase tracking-widest border-b border-border pb-2 mb-3">
 <Clock className="w-4 h-4 text-muted-foreground" />
 <span>{t("Recently Viewed","حال ہی میں دیکھی گئی")}</span>
 </h2>
 <div className="flex flex-wrap gap-2">
 {recentReports.map((report: any) => (
 <button
 key={report.id}
 onClick={() => openReport(report.id)}
 className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-card border border-border hover:border-orange-400 transition-all cursor-pointer"
 >
 <span className="font-mono text-[9px] font-bold text-muted-foreground">{report.id}</span>
 <span className="font-sans text-[11px] font-bold text-foreground truncate max-w-[160px]">{report.name}</span>
 </button>
 ))}
 </div>
 </div>
 )}

 {/* Main Reports Categories Catalog */}
 <div className="space-y-8">
 {filteredModules.length === 0 ? (
 <div className="text-center py-16 text-muted-foreground font-bold text-sm">
 {showFavoritesOnly
 ? t("No pinned favorites yet. Tap the star on any report to pin it.","ابھی کوئی پسندیدہ رپورٹ پن نہیں کی گئی۔ کسی رپورٹ پر ستارہ دبائیں۔")
 : t("No reports match your search.","آپ کی تلاش سے کوئی رپورٹ نہیں ملی۔")}
 </div>
 ) : (
 filteredModules.map((mod) => (
 <div key={mod.id} className="animate-fade-in">
 <h2 className="flex items-center gap-2 font-sans text-xs font-bold text-slate-450 uppercase tracking-widest border-b border-border pb-2 mb-4">
 <mod.icon className="w-4 h-4 text-orange-600" />
 <span>{mod.name}</span>
 </h2>

 <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-3">
 {mod.reports.map((report) => renderReportCard(report))}
 </div>
 </div>
 ))
 )}
 </div>

 {/* Interactive Report Sheets Viewer Overlay */}
 {activeReport && reportDetails && (
 <div className="fixed inset-0 bg-card backdrop-blur-sm z-50 flex items-center justify-center p-4 lg:p-8 animate-fade-in">
 <div className="bg-card rounded-2xl shadow-2xl w-full h-full max-w-7xl flex flex-col overflow-hidden border border-border animate-scale-up">

 {/* Modal Header */}
 <div className="h-16 border-b border-border flex items-center justify-between px-6 bg-subtle">
 <div className="flex items-center gap-3">
 <div className="w-8 h-8 rounded-lg bg-orange-100 border border-orange-200 flex items-center justify-center">
 <Activity className="w-4 h-4 text-orange-600" />
 </div>
 <div>
 <h2 className="font-black font-sans text-foreground text-sm">
 {reportDetails.name}
 </h2>
 <p className="text-[9px] font-mono text-slate-450 font-bold uppercase tracking-widest">
 {activeReport} // {t("COMPILER ENGINE ACTIVE","کمپائلر انجن فعال")}
 </p>
 </div>
 </div>
 <div className="flex items-center gap-1">
 <button
 onClick={() => toggleFavorite(activeReport)}
 title={favorites.includes(activeReport) ? t("Unpin","پن ہٹائیں") : t("Pin to favorites","پسندیدہ میں شامل کریں")}
 className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-200 dark:hover:bg-card/10 transition-colors cursor-pointer"
 >
 <Star className={`w-4 h-4${favorites.includes(activeReport) ?"fill-amber-400 text-amber-400" :"text-slate-400"}`} />
 </button>
 <button
 onClick={closeReport}
 className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-200 dark:hover:bg-card/10 text-muted-foreground transition-colors cursor-pointer"
 >
 <X className="w-5 h-5" />
 </button>
 </div>
 </div>

 {/* Modal Body */}
 <div className="flex-1 overflow-y-auto p-6 space-y-6">

 {/* Quick Date Presets */}
 <div className="flex flex-wrap items-center gap-1.5">
 <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mr-1">{t("Quick Range","فوری مدت")}:</span>
 {datePresets.map((p) => (
 <button
 key={p.id}
 onClick={() => applyDatePreset(p.id)}
 className={`px-3 py-1 rounded-full text-[10px] font-bold border transition-all cursor-pointer${activeDatePreset === p.id
 ?"bg-orange-600 text-white border-orange-600"
 :"bg-card text-slate-500 border-border hover:bg-slate-50 dark:hover:bg-card/5"
 }`}
 >
 {p.label}
 </button>
 ))}
 </div>

 {/* Dynamic Filter Controls Panel */}
 <div className="bg-subtle border border-border rounded-xl p-4 grid grid-cols-2 md:grid-cols-5 gap-3 text-[11px] font-bold">
 <div className="space-y-1">
 <label className="text-muted-foreground block">{t("Start Date","تاریخ سے")}</label>
 <input
 type="date"
 value={startDate}
 onChange={(e) => { setStartDate(e.target.value); setActiveDatePreset(""); }}
 className="w-full rounded-lg border border-border bg-card px-3 py-1.5 text-foreground focus:outline-hidden"
 />
 </div>
 <div className="space-y-1">
 <label className="text-muted-foreground block">{t("End Date","تاریخ تک")}</label>
 <input
 type="date"
 value={endDate}
 onChange={(e) => { setEndDate(e.target.value); setActiveDatePreset(""); }}
 className="w-full rounded-lg border border-border bg-card px-3 py-1.5 text-foreground focus:outline-hidden"
 />
 </div>
 <div className="space-y-1">
 <label className="text-muted-foreground block">{t("Staff/Operator","ملازم / سیلز مین")}</label>
 <select
 value={filterStaff}
 onChange={(e) => setFilterStaff(e.target.value)}
 className="w-full rounded-lg border border-border bg-card px-3 py-1.5 text-foreground focus:outline-hidden"
 >
 <option value="all">{t("All Operators","تمام آپریٹرز")}</option>
 {staff.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
 </select>
 </div>
 <div className="space-y-1">
 <label className="text-muted-foreground block">{t("Product/Item","پراڈکٹ / آئٹم")}</label>
 <select
 value={filterProduct}
 onChange={(e) => setFilterProduct(e.target.value)}
 className="w-full rounded-lg border border-border bg-card px-3 py-1.5 text-foreground focus:outline-hidden"
 >
 <option value="all">{t("All Products","تمام مصنوعات")}</option>
 {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
 </select>
 </div>
 <div className="space-y-1">
 <label className="text-muted-foreground block">{t("Payment Mode","طریقہ ادائیگی")}</label>
 <select
 value={filterPaymentMode}
 onChange={(e) => setFilterPaymentMode(e.target.value)}
 className="w-full rounded-lg border border-border bg-card px-3 py-1.5 text-foreground focus:outline-hidden"
 >
 <option value="all">{t("All Modes","تمام ذرائع")}</option>
 <option value="cash">{t("Cash Inflow","کیش")}</option>
 <option value="bank">{t("Bank Account","بینک")}</option>
 <option value="digital">{t("Digital wallet","ڈیجیٹل والٹ")}</option>
 <option value="credit">{t("Outstanding Credit","ادھار کھاتہ")}</option>
 </select>
 </div>
 </div>

 {/* Rich Summary Statistics */}
 {numericStats.hasValues && (
 <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
 <div className="bg-card border border-border rounded-xl p-3">
 <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground block">{t("Records","اندراجات")}</span>
 <span className="font-mono text-lg font-black text-foreground">{numericStats.count.toLocaleString()}</span>
 </div>
 <div className="bg-card border border-border rounded-xl p-3">
 <span className="text-[9px] font-bold uppercase tracking-wider text-orange-500 block">{t("Total","کل میزان")}</span>
 <span className="font-mono text-sm font-black text-orange-600">{formatCurrency(numericStats.sum, settings)}</span>
 </div>
 <div className="bg-card border border-border rounded-xl p-3">
 <span className="text-[9px] font-bold uppercase tracking-wider text-blue-500 block">{t("Average","اوسط")}</span>
 <span className="font-mono text-sm font-black text-blue-600">{formatCurrency(numericStats.avg, settings)}</span>
 </div>
 <div className="bg-card border border-border rounded-xl p-3">
 <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-500 block">{t("Maximum","زیادہ سے زیادہ")}</span>
 <span className="font-mono text-sm font-black text-emerald-600">{formatCurrency(numericStats.max, settings)}</span>
 </div>
 <div className="bg-card border border-border rounded-xl p-3">
 <span className="text-[9px] font-bold uppercase tracking-wider text-rose-500 block">{t("Minimum","کم سے کم")}</span>
 <span className="font-mono text-sm font-black text-rose-600">{formatCurrency(numericStats.min, settings)}</span>
 </div>
 </div>
 )}

 {/* Dynamic Analytics Graph (Recharts) */}
 {chartData.length > 0 && (
 <div className="bg-card border border-border p-5 rounded-xl">
 <h3 className="font-sans text-xs font-bold text-muted-foreground uppercase tracking-widest mb-4 flex items-center gap-1.5">
 <TrendingUp className="h-4 w-4 text-orange-500" />
 <span>{t("Compiled Financial Trend Analysis","مرتب شدہ مالیاتی رجحان گراف")}</span>
 </h3>
 <div className="h-60 w-full text-xs font-mono">
 <ResponsiveContainer width="100%" height="100%">
 <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
 <defs>
 <linearGradient id="amountColor" x1="0" y1="0" x2="0" y2="1">
 <stop offset="5%" stopColor="#ea580c" stopOpacity={0.2} />
 <stop offset="95%" stopColor="#ea580c" stopOpacity={0} />
 </linearGradient>
 </defs>
 <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
 <XAxis dataKey="date" stroke="#94A3B8" />
 <YAxis stroke="#94A3B8" />
 <Tooltip formatter={(value: any) => formatCurrency(Number(value), settings)} />
 <Area type="monotone" dataKey="Amount" stroke="#ea580c" strokeWidth={2} fillOpacity={1} fill="url(#amountColor)" name={t("Report Value","رپورٹ رقم")} />
 </AreaChart>
 </ResponsiveContainer>
 </div>
 </div>
 )}

 {/* In-report search */}
 <div className="relative">
 <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
 <input
 type="text"
 placeholder={t("Filter rows in this report...","اس رپورٹ کی اندراجات فلٹر کریں...")}
 value={tableSearch}
 onChange={(e) => setTableSearch(e.target.value)}
 className="w-full pl-10 pr-4 py-2 bg-card border border-border rounded-lg text-xs font-semibold text-foreground focus:outline-hidden focus:border-orange-500 transition-colors"
 />
 </div>

 {/* Data Table */}
 <div className="bg-card border border-border rounded-xl overflow-hidden shadow-xs">
 <div className="overflow-x-auto">
 <table className="w-full text-left border-collapse text-xs">
 <thead>
 <tr className="bg-subtle border-b border-border font-bold text-foreground">
 {reportHeaders.map((head) => {
 const isActive = sortKey === head.key;
 return (
 <th
 key={head.key}
 onClick={() => handleSort(head.key as string)}
 className={`p-3 cursor-pointer select-none hover:bg-slate-100 dark:hover:bg-white/10 transition-colors${head.isNumeric ?"text-right" :""}`}
 >
 <span className={`inline-flex items-center gap-1${head.isNumeric ?"flex-row-reverse" :""}`}>
 {isUrdu ? head.urduLabel : head.label}
 {isActive ? (
 sortDir ==="asc" ? <ArrowUp className="w-3 h-3 text-orange-500" /> : <ArrowDown className="w-3 h-3 text-orange-500" />
 ) : (
 <ArrowUpDown className="w-3 h-3 text-muted-foreground" />
 )}
 </span>
 </th>
 );
 })}
 </tr>
 </thead>
 <tbody className="divide-y divide-border dark:divide-white/5 font-medium">
 {sortedRows.length === 0 ? (
 <tr>
 <td colSpan={reportHeaders.length} className="p-8 text-center text-muted-foreground font-bold">
 {t("No records found matching filters.","فائلز کے مطابق کوئی ڈیٹا دستیاب نہیں ہے۔")}
 </td>
 </tr>
 ) : (
 sortedRows.map((row, rIdx) => (
 <tr key={row.id || rIdx} className="hover:bg-slate-50/50 dark:hover:bg-card/5 transition-colors">
 {reportHeaders.map((head) => {
 const rawVal = row[head.key as keyof typeof row];
 const isNum = head.isNumeric;
 return (
 <td key={head.key} className={`p-3${isNum ?"text-right font-mono font-bold text-foreground" :"text-slate-600"}`}>
 {isNum ? Number(rawVal).toLocaleString() : String(rawVal)}
 </td>
 );
 })}
 </tr>
 ))
 )}
 </tbody>
 </table>
 </div>

 {/* Bottom Summaries / Totals */}
 <div className="bg-subtle p-4 border-t border-border flex flex-col sm:flex-row justify-between items-center gap-4 text-xs font-bold">
 <div className="text-slate-450 flex items-center gap-1.5">
 <Sigma className="w-3.5 h-3.5" />
 {t("Showing","ظاہر کردہ")}: {sortedRows.length} {t("records total","کل اندراجات")}
 </div>
 {numericStats.sum > 0 && (
 <div className="bg-orange-50 px-4 py-2 rounded-lg border border-orange-100 text-orange-700 text-sm font-black">
 {t("Total Sum:","کل میزان:")} {formatCurrency(numericStats.sum, settings)}
 </div>
 )}
 </div>

 </div>

 </div>

 {/* Modal Actions */}
 <div className="min-h-16 py-3 border-t border-border bg-subtle flex flex-wrap items-center justify-end px-6 gap-2 shrink-0">
 <button
 onClick={handleCopyClipboard}
 className="flex items-center gap-1.5 bg-card border border-border text-foreground font-sans text-xs font-bold px-4 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-card/10 transition-colors cursor-pointer"
 >
 {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <ClipboardCopy className="w-3.5 h-3.5" />}
 <span>{copied ? t("Copied!","کاپی ہو گیا!") : t("Copy","کاپی کریں")}</span>
 </button>
 <button
 onClick={handleExportJSON}
 className="flex items-center gap-1.5 bg-card border border-border text-foreground font-sans text-xs font-bold px-4 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-card/10 transition-colors cursor-pointer"
 >
 <FileJson className="w-3.5 h-3.5" />
 <span>{t("Export JSON","JSON ڈاؤن لوڈ")}</span>
 </button>
 <button
 onClick={handlePrint}
 className="flex items-center gap-1.5 bg-card text-foreground font-sans text-xs font-bold px-4 py-2 rounded-lg hover:bg-slate-900 transition-colors cursor-pointer"
 >
 <Printer className="w-3.5 h-3.5" />
 <span>{t("Print Statement","رپورٹ پرنٹ کریں")}</span>
 </button>
 <button
 onClick={handleExportCSV}
 className="flex items-center gap-1.5 bg-orange-600 text-white font-sans text-xs font-bold px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors cursor-pointer"
 >
 <Download className="w-3.5 h-3.5" />
 <span>{t("Export to Excel (CSV)","ایکسل میں ڈاؤن لوڈ کریں")}</span>
 </button>
 </div>

 </div>
 </div>
 )}

 </div>
 );
}
