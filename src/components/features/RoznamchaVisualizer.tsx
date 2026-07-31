import React, { useState, useMemo } from 'react';
import { db } from '../../data/db';
import { GlobalSettings, AuditTrailEntry } from '../../types';
import { Search, Calendar, ShieldAlert, Activity, ArrowRight, Eye, X, Filter } from 'lucide-react';

interface RoznamchaVisualizerProps {
 settings: GlobalSettings;
}

export default function RoznamchaVisualizer({ settings }: RoznamchaVisualizerProps) {
 const isUrdu = settings.language === 'ur';
 const t = (en: string, ur: string) => (isUrdu ? ur : en);

 const activeStationId = db.getActiveStationId();
 const rawLogs = useMemo(() => {
 return db.getActivityRegister(activeStationId) || [];
 }, [activeStationId]);

 // Filters State
 const [searchQuery, setSearchQuery] = useState('');
 const [categoryFilter, setCategoryFilter] = useState('all');
 const [startDate, setStartDate] = useState('');
 const [endDate, setEndDate] = useState('');

 // Selected Log for Diff Modal
 const [selectedLog, setSelectedLog] = useState<AuditTrailEntry | null>(null);

 // Filtered Logs
 const filteredLogs = useMemo(() => {
 return rawLogs.filter((log) => {
 // Search
 const matchesSearch =
 log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
 log.details.toLowerCase().includes(searchQuery.toLowerCase()) ||
 log.user.toLowerCase().includes(searchQuery.toLowerCase()) ||
 (log.notes && log.notes.toLowerCase().includes(searchQuery.toLowerCase()));

 // Category
 const matchesCategory = categoryFilter === 'all' || log.category === categoryFilter;

 // Dates
 const logDate = log.timestamp.split(' ')[0] || '';
 if (startDate && logDate < startDate) return false;
 if (endDate && logDate > endDate) return false;

 return matchesSearch && matchesCategory;
 });
 }, [rawLogs, searchQuery, categoryFilter, startDate, endDate]);

 const categories = [
 { id: 'all', label: t('All Operations', 'تمام سرگرمیاں') },
 { id: 'customers', label: t('Customers', 'گاہک کھاتہ دار') },
 { id: 'suppliers', label: t('Suppliers', 'سپلائرز') },
 { id: 'inventory', label: t('Inventory/Nozzle', 'اسٹاک اور نوزل') },
 { id: 'pricing', label: t('Pricing', 'قیمتیں') },
 { id: 'shifts', label: t('Shifts', 'شفٹ ریکارڈز') },
 { id: 'financials', label: t('Financials/Expenses', 'مالیات اور اخراجات') },
 { id: 'treasury', label: t('Treasury/Safe', 'سیف/خزانہ') }
 ];

 // Helper to parse JSON safely for display
 const renderJsonPretty = (val: any) => {
 if (!val) return '—';
 try {
 const parsed = typeof val === 'string' ? JSON.parse(val) : val;
 return JSON.stringify(parsed, null, 2);
 } catch {
 return String(val);
 }
 };

 return (
 <div className="space-y-6">
 {/* Description */}
 <div className="rounded-xl border border-border bg-card p-5 shadow-xs">
 <h3 className="font-sans text-sm font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
 <ShieldAlert className="h-5 w-5 text-orange-600" />
 <span>{t('Digital Roznamcha Ledger (General Activity Audit)', 'ڈیجیٹل روزنامچہ رجسٹر (سرکاری آڈٹ ریکارڈ)')}</span>
 </h3>
 <p className="font-sans text-xs text-muted-foreground mt-1">
 {t(
 'Immutable chronological business activity log tracking database writes, nozzle price updates, customer recoveries, shift open/close details, safe funds transfers, and operational overrides.',
 'سسٹم میں کی گئی ہر تبدیلی کا مکمل تفصیلی اور ناقابلِ ترمیم ریکارڈ۔ نوزل ریٹس کی تبدیلی، ادھار وصولی، اخراجات کے اندراج اور آڈٹ رولز مانیٹرنگ کی تفصیلی ہسٹری۔'
 )}
 </p>
 </div>

 {/* Query Filters */}
 <div className="bg-subtle border border-border rounded-xl p-4 grid grid-cols-1 md:grid-cols-4 gap-3 text-xs font-semibold">
 <div className="md:col-span-2 space-y-1">
 <label className="text-muted-foreground block">{t('Search Log Actions', 'تلاش کریں')}</label>
 <div className="relative">
 <Search className="h-4 w-4 text-muted-foreground absolute left-3 top-2.5" />
 <input
 type="text"
 placeholder={t('Search by action, details, user name...', 'سرگرمی، صارف کا نام یا تفصیل درج کریں...')}
 value={searchQuery}
 onChange={(e) => setSearchQuery(e.target.value)}
 className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-border bg-card text-foreground focus:outline-hidden"
 />
 </div>
 </div>

 <div className="space-y-1">
 <label className="text-muted-foreground block">{t('Start Date', 'تاریخ سے')}</label>
 <input
 type="date"
 value={startDate}
 onChange={(e) => setStartDate(e.target.value)}
 className="w-full rounded-lg border border-border bg-card px-3 py-1.5 text-foreground focus:outline-hidden"
 />
 </div>

 <div className="space-y-1">
 <label className="text-muted-foreground block">{t('End Date', 'تاریخ تک')}</label>
 <input
 type="date"
 value={endDate}
 onChange={(e) => setEndDate(e.target.value)}
 className="w-full rounded-lg border border-border bg-card px-3 py-1.5 text-foreground focus:outline-hidden"
 />
 </div>
 </div>

 {/* Category Pills Selector */}
 <div className="flex flex-wrap gap-1.5">
 {categories.map((cat) => (
 <button
 key={cat.id}
 onClick={() => setCategoryFilter(cat.id)}
 className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all cursor-pointer ${
  categoryFilter === cat.id
    ? 'bg-orange-600 text-white border-orange-600 shadow-sm'
    : 'bg-muted text-foreground border-border hover:bg-card'
 }`}
 >
 {cat.label}
 </button>
 ))}
 </div>

 {/* Log Entries Chronology List */}
 <div className="bg-card border border-border rounded-xl overflow-hidden shadow-xs">
 <div className="overflow-x-auto">
 <table className="w-full text-left border-collapse text-xs">
 <thead>
 <tr className="bg-subtle border-b border-border font-bold text-foreground">
 <th className="p-3 w-[150px]">{t('Timestamp', 'وقت اور تاریخ')}</th>
 <th className="p-3 w-[120px]">{t('Module/Category', 'شعبہ/قسم')}</th>
 <th className="p-3 w-[120px]">{t('Action', 'کارروائی')}</th>
 <th className="p-3 w-[120px]">{t('User/Role', 'صارف')}</th>
 <th className="p-3">{t('Description', 'تفصیل')}</th>
 <th className="p-3 w-[80px] text-center">{t('Changes', 'تبدیلی')}</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-border dark:divide-white/5 font-medium">
 {filteredLogs.length === 0 ? (
 <tr>
 <td colSpan={6} className="p-8 text-center text-muted-foreground font-bold italic">
 {t('No activity register entries matching criteria.', 'کوئی اندراج ریکارڈ دستیاب نہیں ہے۔')}
 </td>
 </tr>
 ) : (
 filteredLogs.map((log) => {
 const hasDiff = log.oldValue || log.newValue;
 return (
 <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-card/5 transition-colors">
 <td className="p-3 font-mono text-muted-foreground">{log.timestamp}</td>
 <td className="p-3">
 <span className="bg-muted text-foreground px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider">
 {log.category}
 </span>
 </td>
 <td className="p-3 font-bold text-foreground">{log.action}</td>
 <td className="p-3">
 <div className="font-semibold text-foreground">{log.user}</div>
 <div className="text-[10px] text-muted-foreground">{log.role}</div>
 </td>
 <td className="p-3 text-muted-foreground leading-relaxed max-w-sm truncate" title={log.details}>
 {log.details}
 {log.notes && (
 <div className="text-[10px] text-orange-600 font-semibold italic mt-0.5">
 Note: {log.notes}
 </div>
 )}
 </td>
 <td className="p-3 text-center">
 {hasDiff ? (
 <button
 onClick={() => setSelectedLog(log)}
 className="p-1 rounded-md bg-orange-50 hover:bg-orange-100 text-orange-600 transition-colors cursor-pointer inline-flex items-center justify-center"
 title={t('View State Difference', 'بفور/آفٹر تبدیلی دیکھیں')}
 >
 <Eye className="h-4 w-4" />
 </button>
 ) : (
 <span className="text-muted-foreground font-bold">—</span>
 )}
 </td>
 </tr>
 );
 })
 )}
 </tbody>
 </table>
 </div>
 </div>

 {/* JSON Diff Side-by-Side Modal Overlay */}
 {selectedLog && (
 <div className="fixed inset-0 bg-card backdrop-blur-sm z-50 flex items-center justify-center p-4 lg:p-8 animate-fade-in">
 <div className="bg-card rounded-2xl shadow-2xl w-full max-w-4xl h-[550px] flex flex-col overflow-hidden border border-border animate-scale-up">
 {/* Header */}
 <div className="h-14 border-b border-border flex items-center justify-between px-6 bg-subtle">
 <div className="flex items-center gap-2">
 <Activity className="h-5 w-5 text-orange-600" />
 <h3 className="font-extrabold text-sm text-foreground">
 {t('Audit Trail State Changes', 'بفور آفٹر ڈیٹا ہسٹری موازنہ')}
 </h3>
 </div>
 <button
 onClick={() => setSelectedLog(null)}
 className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-200 dark:hover:bg-card/10 text-muted-foreground transition-colors"
 >
 <X className="h-5 w-5" />
 </button>
 </div>

 {/* Content Body */}
 <div className="flex-1 p-6 grid grid-cols-1 md:grid-cols-2 gap-4 overflow-hidden bg-subtle">
 {/* Previous Value */}
 <div className="flex flex-col h-full overflow-hidden border border-red-100 rounded-xl bg-card/60">
 <div className="bg-red-50 border-b border-red-100 p-2 text-xs font-bold text-red-750 flex items-center justify-between">
 <span>{t('Previous Value (Before)', 'پہلی قیمت (پہلے)')}</span>
 <span className="bg-red-200 text-red-800 text-[10px] px-2 py-0.5 rounded-full">Old State</span>
 </div>
 <div className="flex-1 overflow-auto p-4 font-mono text-[10px] leading-relaxed text-red-650 bg-red-50/20 whitespace-pre">
 {renderJsonPretty(selectedLog.oldValue)}
 </div>
 </div>

 {/* New Value */}
 <div className="flex flex-col h-full overflow-hidden border border-emerald-100 rounded-xl bg-card/60">
 <div className="bg-emerald-50 border-b border-emerald-100 p-2 text-xs font-bold text-emerald-705 flex items-center justify-between">
 <span>{t('New Value (After Change)', 'نئی قیمت (بعد میں)')}</span>
 <span className="bg-emerald-255 text-emerald-800 text-[10px] px-2 py-0.5 rounded-full">New State</span>
 </div>
 <div className="flex-1 overflow-auto p-4 font-mono text-[10px] leading-relaxed text-emerald-650 bg-emerald-50/20 whitespace-pre">
 {renderJsonPretty(selectedLog.newValue)}
 </div>
 </div>
 </div>

 {/* Footer Summary Info */}
 <div className="h-12 border-t border-border bg-subtle flex items-center justify-between px-6 text-[10.5px] font-bold text-slate-450">
 <div>
 Action: <span className="text-foreground font-extrabold">{selectedLog.action}</span>
 </div>
 <div>
 User: <span className="text-foreground font-extrabold">{selectedLog.user} ({selectedLog.role})</span>
 </div>
 </div>
 </div>
 </div>
 )}
 </div>
 );
}
