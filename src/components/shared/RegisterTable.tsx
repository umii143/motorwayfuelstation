/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Enterprise Register Table
 * Sticky header/footer, zebra rows, row numbers, search, multi-filter,
 * sorting, running totals, grand totals, CSV export and print.
 */

import React, { useState, useMemo, ReactNode } from 'react';
import { Search, ArrowUpDown, ArrowUp, ArrowDown, Download, Printer, Filter, X, FileBarChart2 } from 'lucide-react';
import { GlobalSettings } from '../../types';
import { formatCurrency } from '../../lib/currency';

export interface RegisterColumn<T> {
  key: string;
  header: string;
  urduHeader?: string;
  isNumeric?: boolean;
  /** accessor returns raw value (string/number) for sort + totals */
  accessor: (row: T) => string | number;
  /** optional custom render (defaults to formatted accessor) */
  render?: (row: T, value: string | number) => ReactNode;
  /** filter options for this column (select). If omitted, no filter chip. */
  filterOptions?: { label: string; value: string }[];
  /** transform raw value into filter bucket value */
  filterValue?: (row: T) => string;
}

interface RegisterTableProps<T> {
  settings: GlobalSettings;
  title: string;
  columns: RegisterColumn<T>[];
  data: T[];
  keyExtractor: (row: T, index: number) => string;
  /** columns whose numeric totals should be summed in footer */
  totalKeys?: string[];
  /** columns that should show a running total column */
  runningTotalKeys?: string[];
  emptyMessage?: string;
  /** max height for scroll area */
  maxHeight?: number;
  /** custom export filename base */
  exportName?: string;
}

export function RegisterTable<T>({
  settings,
  title,
  columns,
  data,
  keyExtractor,
  totalKeys = [],
  runningTotalKeys = [],
  emptyMessage = 'No records found.',
  maxHeight = 560,
  exportName
}: RegisterTableProps<T>) {
  const isUrdu = settings.language === 'ur';
  const t = (en: string, ur: string) => (isUrdu ? ur : en);

  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<{ key: string; dir: 'asc' | 'desc' } | null>(null);
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [showFilters, setShowFilters] = useState(false);

  const label = (c: RegisterColumn<T>) => isUrdu && c.urduHeader ? c.urduHeader : c.header;

  // Apply filters
  const filtered = useMemo(() => {
    let rows = data;
    const activeFilters = Object.entries(filters).filter(([, v]) => v && v !== '__all__');
    if (activeFilters.length > 0) {
      rows = rows.filter(row =>
        activeFilters.every(([key, val]) => {
          const col = columns.find(c => c.key === key);
          if (!col) return true;
          const bucket = col.filterValue ? col.filterValue(row) : String(col.accessor(row));
          return bucket === val;
        })
      );
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      rows = rows.filter(row =>
        columns.some(c => String(c.accessor(row)).toLowerCase().includes(q))
      );
    }
    if (sort) {
      const col = columns.find(c => c.key === sort.key);
      if (col) {
        rows = [...rows].sort((a, b) => {
          const av = col.accessor(a);
          const bv = col.accessor(b);
          let cmp = 0;
          if (typeof av === 'number' && typeof bv === 'number') cmp = av - bv;
          else cmp = String(av).localeCompare(String(bv));
          return sort.dir === 'asc' ? cmp : -cmp;
        });
      }
    }
    return rows;
  }, [data, filters, search, sort, columns]);

  const totals = useMemo(() => {
    const sums: Record<string, number> = {};
    totalKeys.forEach(k => {
      const col = columns.find(c => c.key === k);
      if (!col) return;
      sums[k] = filtered.reduce((acc, row) => {
        const v = col.accessor(row);
        return acc + (typeof v === 'number' ? v : Number(String(v).replace(/[^\d.-]/g, '')) || 0);
      }, 0);
    });
    return sums;
  }, [filtered, totalKeys, columns]);

  // running totals per row
  const rowsWithRunning = useMemo(() => {
    if (runningTotalKeys.length === 0) return filtered.map(r => ({ row: r, running: {} as Record<string, number> }));
    const acc: Record<string, number> = {};
    return filtered.map(r => {
      const cur: Record<string, number> = {};
      runningTotalKeys.forEach(k => {
        const col = columns.find(c => c.key === k);
        if (!col) return;
        const v = col.accessor(r);
        const num = typeof v === 'number' ? v : Number(String(v).replace(/[^\d.-]/g, '')) || 0;
        acc[k] = (acc[k] || 0) + num;
        cur[k] = acc[k];
      });
      return { row: r, running: cur };
    });
  }, [filtered, runningTotalKeys, columns]);

  const toggleSort = (key: string) => {
    setSort(prev => {
      if (!prev || prev.key !== key) return { key, dir: 'asc' };
      if (prev.dir === 'asc') return { key, dir: 'desc' };
      return null;
    });
  };

  const hasActiveFilters = Object.values(filters).some(v => v && v !== '__all__');

  const exportCSV = () => {
    const headerCols = columns.map(c => `"${label(c).replace(/"/g, '""')}"`);
    if (runningTotalKeys.length > 0) {
      runningTotalKeys.forEach(k => headerCols.push(`"Running ${label(columns.find(c => c.key === k)!)}"`));
    }
    const headerLine = headerCols.join(',');
    const body = rowsWithRunning.map(({ row, running }) => {
      const cells = columns.map(c => {
        const v = c.accessor(row);
        return `"${String(v).replace(/"/g, '""')}"`;
      });
      if (runningTotalKeys.length > 0) {
        runningTotalKeys.forEach(k => cells.push(`"${String(running[k] ?? 0).replace(/"/g, '""')}"`));
      }
      return cells.join(',');
    });
    const content = [headerLine, ...body].join('\n');
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${exportName || title}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const hasRunning = runningTotalKeys.length > 0;

  return (
    <div className="bg-white dark:bg-[#151521] border border-slate-200 dark:border-white/10 rounded-xl shadow-xs overflow-hidden flex flex-col">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 border-b border-slate-100 dark:border-white/5">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={t('Search register...', 'رجسٹر میں تلاش کریں...')}
            className="w-full pl-9 pr-3 py-2 text-xs font-semibold bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg text-slate-700 dark:text-slate-200 focus:outline-hidden"
          />
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFilters(f => !f)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold border transition-colors ${showFilters || hasActiveFilters ? 'border-orange-500 text-orange-600 bg-orange-50/20' : 'border-slate-200 dark:border-white/10 text-slate-500'}`}
          >
            <Filter className="w-3.5 h-3.5" />
            {t('Filters', 'فلٹرز')}
            {hasActiveFilters && <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />}
          </button>
          <button onClick={exportCSV} className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold border border-slate-200 dark:border-white/10 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors">
            <Download className="w-3.5 h-3.5" /> CSV
          </button>
          <button onClick={() => window.print()} className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold border border-slate-200 dark:border-white/10 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors">
            <Printer className="w-3.5 h-3.5" /> {t('Print', 'پرنٹ')}
          </button>
        </div>
      </div>

      {/* Filter row */}
      {showFilters && (
        <div className="flex flex-wrap gap-2 p-3 border-b border-slate-100 dark:border-white/5 bg-slate-50/40 dark:bg-white/2">
          {columns.filter(c => c.filterOptions).map(c => (
            <select
              key={c.key}
              value={filters[c.key] || '__all__'}
              onChange={e => setFilters(prev => ({ ...prev, [c.key]: e.target.value }))}
              className="bg-white dark:bg-[#0f0f15] border border-slate-200 dark:border-white/10 rounded-lg text-xs px-2 py-1.5 text-slate-700 dark:text-slate-200 outline-none"
            >
              <option value="__all__">{label(c)}: {t('All', 'تمام')}</option>
              {c.filterOptions!.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          ))}
          {hasActiveFilters && (
            <button
              onClick={() => setFilters({})}
              className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10"
            >
              <X className="w-3.5 h-3.5" /> {t('Clear', 'صاف کریں')}
            </button>
          )}
        </div>
      )}

      {/* Table */}
      <div className="overflow-auto" style={{ maxHeight }}>
        <table className="w-full text-left border-collapse text-xs">
          <thead className="sticky top-0 z-10 bg-slate-100 dark:bg-[#191928] text-slate-700 dark:text-slate-200 font-bold">
            <tr>
              <th className="p-2.5 w-[44px] text-center border-b border-slate-200 dark:border-white/10">#</th>
              {columns.map(c => (
                <th
                  key={c.key}
                  onClick={() => c.isNumeric && toggleSort(c.key)}
                  className={`p-2.5 border-b border-slate-200 dark:border-white/10 ${c.isNumeric ? 'text-right cursor-pointer select-none hover:text-orange-600' : ''}`}
                >
                  <span className="inline-flex items-center gap-1">
                    {label(c)}
                    {c.isNumeric && (
                      sort?.key === c.key ? (
                        sort.dir === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                      ) : <ArrowUpDown className="w-3 h-3 opacity-40" />
                    )}
                  </span>
                </th>
              ))}
              {hasRunning && (
                <th className="p-2.5 text-right border-b border-slate-200 dark:border-white/10">{t('Running Total', 'رننگ ٹوٹل')}</th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-white/5 font-semibold">
            {rowsWithRunning.length === 0 ? (
              <tr>
                <td colSpan={columns.length + 1 + (hasRunning ? 1 : 0)} className="p-10 text-center text-slate-400 italic">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              rowsWithRunning.map(({ row, running }, idx) => (
                <tr key={keyExtractor(row, idx)} className="even:bg-slate-50/40 dark:even:bg-white/2 hover:bg-orange-50/10 dark:hover:bg-white/5 transition-colors">
                  <td className="p-2 text-center font-mono text-slate-400 border-r border-slate-100 dark:border-white/5">{idx + 1}</td>
                  {columns.map(c => {
                    const raw = c.accessor(row);
                    const node = c.render ? c.render(row, raw) : (
                      c.isNumeric && typeof raw === 'number'
                        ? formatCurrency(raw, settings)
                        : String(raw)
                    );
                    return (
                      <td key={c.key} className={`p-2 ${c.isNumeric ? 'text-right font-mono text-slate-800 dark:text-slate-200' : 'text-slate-600 dark:text-slate-350'}`}>
                        {node}
                      </td>
                    );
                  })}
                  {hasRunning && (
                    <td className="p-2 text-right font-mono font-bold text-orange-600 dark:text-orange-400">
                      {runningTotalKeys.map(k => formatCurrency(running[k] || 0, settings)).join(' | ')}
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
          {totalKeys.length > 0 && (
            <tfoot className="sticky bottom-0 z-10 bg-slate-900 text-white">
              <tr className="font-black">
                <td className="p-3 text-center">{t('Total', 'کل')}</td>
                {columns.map(c => (
                  <td key={c.key} className={`p-3 ${c.isNumeric ? 'text-right font-mono' : 'text-xs font-bold text-slate-300'}`}>
                    {totalKeys.includes(c.key)
                      ? formatCurrency(totals[c.key] || 0, settings)
                      : (c.key === columns[0].key ? `${filtered.length} ${t('Records', 'ریکارڈز')}` : '')}
                  </td>
                ))}
                {hasRunning && <td className="p-3 text-right" />}
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
}

export default RegisterTable;
