import React, { useState, useMemo } from "react";
import {
  Tag,
  Search,
  Calendar,
  Filter,
  TrendingDown,
  Users,
  ShieldCheck,
  Download,
  AlertTriangle,
  LineChart,
} from "lucide-react";
import { GlobalSettings, Shift, DiscountEntry, Product } from "../../types";
import { t as translate } from "../../lib/translations";
import { formatCurrency, getCurrencySymbol } from "../../lib/currency";

interface DiscountsHubProps {
  settings: GlobalSettings;
  shifts: Shift[];
  products: Product[];
}

export default function DiscountsHub({
  settings,
  shifts,
  products,
}: DiscountsHubProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFilter, setDateFilter] = useState("all"); // 'all', 'today', 'week', 'month'
  const [typeFilter, setTypeFilter] = useState("all");

  const t = (en: string, ur: string) => translate(en, ur, settings);

  // Compile all discounts from shifts
  const allDiscounts = useMemo(() => {
    let list: (DiscountEntry & {
      shiftId: string;
      date: string;
      shiftType: string;
    })[] = [];
    shifts.forEach((shift) => {
      if (shift.discountEntries && shift.discountEntries.length > 0) {
        shift.discountEntries.forEach((d) => {
          list.push({
            ...d,
            shiftId: shift.id,
            date: shift.date,
            shiftType: shift.type,
          });
        });
      }
    });
    // Sort descending by timestamp
    return list.sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    );
  }, [shifts]);

  // Filter processing
  const filteredDiscounts = useMemo(() => {
    return allDiscounts.filter((d) => {
      const matchSearch =
        searchTerm === "" ||
        d.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.reason.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.approvedBy.toLowerCase().includes(searchTerm.toLowerCase());

      const matchType = typeFilter === "all" || d.type === typeFilter;

      let matchDate = true;
      const today = new Date().toISOString().split("T")[0];
      if (dateFilter === "today") {
        matchDate = d.date === today;
      }
      // Add other date logic if needed

      return matchSearch && matchType && matchDate;
    });
  }, [allDiscounts, searchTerm, typeFilter, dateFilter]);

  // KPIs
  const totalAmount = filteredDiscounts.reduce((sum, d) => sum + d.amount, 0);
  const avgDiscount =
    filteredDiscounts.length > 0 ? totalAmount / filteredDiscounts.length : 0;

  const typeDistribution = filteredDiscounts.reduce(
    (acc, d) => {
      acc[d.type] = (acc[d.type] || 0) + d.amount;
      return acc;
    },
    {} as Record<string, number>,
  );

  return (
    <div className="space-y-6 pb-20">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 md:p-8 shadow-sm flex flex-col md:flex-row gap-6 md:items-center relative overflow-hidden">
        <div className="absolute -top-10 -right-10 p-8 opacity-5">
          <Tag className="w-64 h-64 text-indigo-600" />
        </div>

        <div className="bg-indigo-50 w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 border border-indigo-100 z-10">
          <Tag className="h-8 w-8 text-indigo-600" />
        </div>
        <div className="z-10">
          <h1 className="font-sans text-2xl md:text-3xl font-black tracking-tight text-slate-900 mb-2">
            {t('Central Discounts Hub', 'مرکزی ڈسکاؤنٹ ہب')}
          </h1>
          <p className="font-sans text-sm text-slate-500 max-w-2xl leading-relaxed">
            {t(
              'Master control room for all operational discounts, rebates, and loyalty allowances. Real-time synchronization across all active shifts with comprehensive audit logging.',
              'تمام آپریشنل ڈسکاؤنٹس، چھوٹ، اور وفاداری کے الاؤنسز کے لیے ماسٹر کنٹرول روم۔ جامع آڈٹ لاگنگ کے ساتھ تمام فعال شفٹوں میں ریئل ٹائم ہم آہنگی۔'
            )}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <span className="text-slate-400 text-xs font-bold mb-1 uppercase tracking-wider block">
            {t('Total Discounts Value', 'کل رعیاتی ڈسکاؤنٹ')}
          </span>
          <div className="font-mono text-2xl font-black text-indigo-600">
            {formatCurrency(totalAmount, settings)}
          </div>
          <span className="text-slate-400 text-[10px] mt-1 block">
            {t('In current filter range', 'حالیہ فلٹر رینج')}
          </span>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <span className="text-slate-400 text-xs font-bold mb-1 uppercase tracking-wider block">
            {t('Discounts Issued', 'مجموعی جاری کردہ ڈسکاؤنٹ')}
          </span>
          <div className="font-mono text-2xl font-black text-slate-900">
            {filteredDiscounts.length}
          </div>
          <span className="text-slate-400 text-[10px] mt-1 block">
            {t('Total transactions', 'مجموعی کارروائیاں')}
          </span>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <span className="text-slate-400 text-xs font-bold mb-1 uppercase tracking-wider block">
            {t('Avg. Discount', 'اوسط رعایت')}
          </span>
          <div className="font-mono text-2xl font-black text-emerald-600">
            {formatCurrency(Math.round(avgDiscount), settings)}
          </div>
          <span className="text-slate-400 text-[10px] mt-1 block">
            Per transaction mean
          </span>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm relative overflow-hidden">
          <LineChart className="absolute -right-4 -bottom-4 w-20 h-20 text-slate-50 opacity-50" />
          <span className="text-slate-400 text-xs font-bold mb-1 uppercase tracking-wider block z-10 relative">
            Top Category
          </span>
          <div className="font-sans text-xl font-black text-purple-600 z-10 relative mt-1 truncate">
            {Object.entries(typeDistribution).sort(
              (a, b) => (b[1] as number) - (a[1] as number),
            )[0]?.[0] || "N/A"}
          </div>
          <span className="text-slate-400 text-[10px] mt-1 block z-10 relative">
            By total value
          </span>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex gap-2 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search customers, reasons..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:border-indigo-500 outline-none"
              />
            </div>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm outline-none"
            >
              <option value="all">All Types</option>
              <option value="Percentage">Percentage</option>
              <option value="Fixed Amount">Fixed Amount</option>
              <option value="Volume Based">Volume Based</option>
              <option value="Loyalty Program">Loyalty Program</option>
            </select>
          </div>

          <button className="flex items-center gap-2 px-4 py-2.5 sm:py-2 min-h-[48px] sm:min-h-[40px] border border-slate-300 rounded-lg text-sm font-bold text-slate-600 bg-white hover:bg-slate-50 w-full md:w-auto justify-center cursor-pointer">
            <Download className="w-4 h-4" /> Export CSV
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-indigo-50/30 text-indigo-900 border-b border-indigo-100 font-sans uppercase tracking-wider text-[11px]">
              <tr>
                <th className="p-4 rounded-tl-xl font-bold">{t('Date & Time', 'تاريخ اور وقت')}</th>
                <th className="p-4 font-bold">{t('Customer / Beneficiary', 'صارف / کھاتہ دار')}</th>
                <th className="p-4 font-bold">{t('Type', 'قسم')}</th>
                <th className="p-4 font-bold text-right">{t(`Amount (${getCurrencySymbol(settings)})`, `رقم (${getCurrencySymbol(settings)})`)}</th>
                <th className="p-4 font-bold">{t('Approval Auth', 'تصدیق کنندہ')}</th>
                <th className="p-4 rounded-tr-xl font-bold">{t('Reason', 'وجہ')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredDiscounts.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="p-8 text-center text-slate-400 font-sans text-sm"
                  >
                    No discount records match your filters.
                  </td>
                </tr>
              ) : (
                filteredDiscounts.map((d, i) => (
                  <tr
                    key={d.id}
                    className="hover:bg-slate-50 transition-colors"
                  >
                    <td className="p-4">
                      <div className="font-mono text-slate-900 font-medium">
                        {new Date(d.timestamp).toLocaleDateString()}
                      </div>
                      <div className="font-mono text-[10px] text-slate-400">
                        {new Date(d.timestamp).toLocaleTimeString()}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="font-bold text-slate-800">
                        {d.customerName}
                      </div>
                      <div className="text-[10px] text-slate-500 uppercase">
                        Product:{" "}
                        {d.productId
                          ? products.find((p) => p.id === d.productId)?.name ||
                            d.productId
                          : "Any"}
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-indigo-100 text-indigo-700">
                        {d.type}
                      </span>
                    </td>
                    <td className="p-4 text-right font-mono font-bold text-rose-600">
                      - {formatCurrency(d.amount, settings)}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-1.5 text-xs text-slate-700">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                        {d.approvedBy}
                      </div>
                    </td>
                    <td
                      className="p-4 max-w-full max-w-[200px] truncate text-slate-600"
                      title={d.reason}
                    >
                      {d.reason}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
