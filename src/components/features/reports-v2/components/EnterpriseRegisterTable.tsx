/**
 * @license SPDX-License-Identifier: Apache-2.0
 *
 * FuelPro Enterprise Reports Platform v3.0 — Enterprise Register Table
 *
 * The operational register: the "trace A→Z" backbone of every report.
 * Urdu-first (big Urdu header, small English beneath) per owner preference,
 * with search, column sort, status badges, currency/number formatting,
 * a totals footer, and honest empty states. No report ever reimplements
 * this — every report's register flows through this one component.
 */

import React, { useMemo, useState } from 'react';
import toast from 'react-hot-toast';

export interface EnterpriseColumnDef {
  id: string;
  header: string;
  headerUr?: string;
  accessor: string;
  isNumeric?: boolean;
  isCurrency?: boolean;
  isDate?: boolean;
  isStatus?: boolean;
  sortable?: boolean;
  filterable?: boolean;
}

export interface EnterpriseRegisterTableProps {
  title?: string;
  titleUr?: string;
  columns: EnterpriseColumnDef[];
  data: Record<string, any>[];
  isLoading?: boolean;
  /** Optional summary row (accessor → total) rendered as a bold footer */
  summaryRow?: Record<string, any>;
  language?: 'en' | 'ur';
  onRowClick?: (row: Record<string, any>) => void;
  onExport?: () => void;
  onPrint?: () => void;
}

// ── Shared cell formatters (bilingual, readable on every theme) ──
function formatCurrency(v: unknown): string {
  const n = typeof v === 'number' ? v : Number(v) || 0;
  return `₨ ${n.toLocaleString('en-PK')}`;
}

function formatNumber(v: unknown): string {
  const n = typeof v === 'number' ? v : Number(v) || 0;
  return n.toLocaleString('en-PK');
}

function formatDate(v: unknown): string {
  if (v === null || v === undefined || v === '') return '—';
  const d = typeof (v as any)?.toDate === 'function' ? (v as any).toDate() : new Date(v as any);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-PK');
}

function statusBadge(value: unknown): { label: string; bg: string; text: string } {
  const s = String(value ?? '').toLowerCase();
  if (['submitted', 'active', 'posted', 'complete', 'approved', 'verified', 'paid', 'in', 'credit', 'success'].includes(s)) {
    return { label: String(value), bg: 'rgba(16,185,129,0.12)', text: '#059669' };
  }
  if (['pending', 'flagged', 'needs_review', 'in_progress', 'partial', 'review', 'warning'].includes(s)) {
    return { label: String(value), bg: 'rgba(245,158,11,0.12)', text: '#d97706' };
  }
  if (['rejected', 'failed', 'overdue', 'out', 'debit', 'danger', 'critical', 'shortage'].includes(s)) {
    return { label: String(value), bg: 'rgba(239,68,68,0.12)', text: '#dc2626' };
  }
  return { label: String(value ?? '—'), bg: 'rgba(100,116,139,0.1)', text: 'var(--text-muted)' };
}

export const EnterpriseRegisterTable: React.FC<EnterpriseRegisterTableProps> = ({
  title, titleUr, columns, data, isLoading, summaryRow, language = 'en',
  onRowClick, onExport, onPrint
}) => {
  const isEn = language === 'en';
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const visibleColumns = columns.length > 0 ? columns : [{ id: 'empty', header: '', accessor: '' }];

  const rows = useMemo(() => {
    let out = data;
    if (search.trim()) {
      const q = search.toLowerCase();
      out = out.filter(row => Object.values(row).some(v => String(v ?? '').toLowerCase().includes(q)));
    }
    if (sortKey) {
      out = [...out].sort((a, b) => {
        const av = a[sortKey]; const bv = b[sortKey];
        if (av == null) return 1; if (bv == null) return -1;
        if (typeof av === 'number' && typeof bv === 'number') return sortDir === 'asc' ? av - bv : bv - av;
        return sortDir === 'asc' ? String(av).localeCompare(String(bv)) : String(bv).localeCompare(String(av));
      });
    }
    return out;
  }, [data, search, sortKey, sortDir]);

  const handleSort = (col: EnterpriseColumnDef) => {
    if (!col.sortable && !col.isNumeric && !col.isCurrency && !col.isDate) return;
    if (sortKey === col.accessor) setSortDir(d => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortKey(col.accessor); setSortDir('desc'); }
  };

  const headerLabel = isEn ? (title || 'Register') : (titleUr || title || 'رجسٹر');
  const [selectedColumnIds, setSelectedColumnIds] = useState<string[]>(() => columns.map(c => c.id));
  const [showColumnChooser, setShowColumnChooser] = useState(false);

  const activeColumns = useMemo(() => {
    return visibleColumns.filter(c => selectedColumnIds.includes(c.id));
  }, [visibleColumns, selectedColumnIds]);

  const toggleColumn = (id: string) => {
    setSelectedColumnIds(prev => prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]);
  };

  const handleCopyRows = () => {
    try {
      navigator.clipboard.writeText(JSON.stringify(rows, null, 2));
      // Toast instead of native alert — native dialogs block the UI thread and
      // are inconsistently announced by screen readers (Responsiveness/A11y Audit).
      toast.success(isEn ? 'Register data copied to clipboard!' : 'رجسٹر کا ڈیٹا کاپی ہو گیا!');
    } catch {
      toast.error(isEn ? 'Failed to copy register data.' : 'ڈیٹا کاپی نہیں ہو سکا۔');
    }
  };

  return (
    <div style={{
      backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-main)',
      borderRadius: 'var(--radius-lg)', overflow: 'hidden', display: 'flex', flexDirection: 'column'
    }}>
      {/* Header */}
      {(headerLabel || onExport || onPrint) && (
        <div style={{ padding: 'var(--spacing-md)', borderBottom: '1px solid var(--border-main)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
          {(title || titleUr) && (
            <div>
              <h3 style={{ margin: 0, fontSize: 'var(--text-md)', color: 'var(--text-main)' }}>{isEn ? (title || titleUr) : (titleUr || title)}</h3>
            </div>
          )}
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            {/* In-register search (PRD §4 Universal Search) */}
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={isEn ? '🔍 Search register...' : '🔍 رجسٹر تلاش کریں...'}
              style={{
                padding: '6px 10px', borderRadius: 6, border: '1px solid var(--border-main)',
                backgroundColor: 'var(--bg-app)', color: 'var(--text-main)', fontSize: 12, minWidth: 180
              }}
            />
            {/* Column Chooser Toggle */}
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setShowColumnChooser(p => !p)}
                title={isEn ? 'Column Chooser' : 'کالم چزر'}
                style={{ background: 'var(--bg-app)', border: '1px solid var(--border-main)', borderRadius: '4px', cursor: 'pointer', padding: '4px 8px', fontSize: 12, color: 'var(--text-main)' }}
              >
                ⚙️ {isEn ? 'Cols' : 'کالم'}
              </button>
              {showColumnChooser && (
                <div style={{
                  position: 'absolute', right: 0, marginTop: 4, zIndex: 30, backgroundColor: 'var(--bg-card)',
                  border: '1px solid var(--border-main)', borderRadius: 8, padding: 8, boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
                  minWidth: 160, display: 'flex', flexDirection: 'column', gap: 4
                }}>
                  <div style={{ fontSize: 11, fontWeight: 700, borderBottom: '1px solid var(--border-main)', paddingBottom: 4, color: 'var(--text-muted)' }}>
                    {isEn ? 'Select Columns' : 'کالمز منتخب کریں'}
                  </div>
                  {columns.map(c => (
                    <label key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, cursor: 'pointer', color: 'var(--text-main)' }}>
                      <input type="checkbox" checked={selectedColumnIds.includes(c.id)} onChange={() => toggleColumn(c.id)} />
                      <span>{isEn ? c.header : (c.headerUr || c.header)}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
            <button onClick={handleCopyRows} title={isEn ? 'Copy Data' : 'ڈیٹا کاپی کریں'} style={{ background: 'var(--bg-app)', border: '1px solid var(--border-main)', borderRadius: '4px', cursor: 'pointer', padding: '4px 8px', fontSize: 'var(--text-xs)', color: 'var(--text-main)' }}>📋</button>
            {onPrint && <button onClick={onPrint} style={{ background: 'var(--bg-app)', border: '1px solid var(--border-main)', borderRadius: '4px', cursor: 'pointer', padding: '4px 8px', fontSize: 'var(--text-xs)', color: 'var(--text-main)' }}>🖨️</button>}
            {onExport && <button onClick={onExport} style={{ background: 'var(--bg-app)', border: '1px solid var(--border-main)', borderRadius: '4px', cursor: 'pointer', padding: '4px 8px', fontSize: 'var(--text-xs)', color: 'var(--text-main)' }}>📤</button>}
          </div>
        </div>
      )}

      <div style={{ overflowX: 'auto', maxHeight: 'min(72vh, 720px)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead style={{ backgroundColor: 'var(--bg-app)', position: 'sticky', top: 0, zIndex: 5 }}>
            <tr>
              {activeColumns.map(col => {
                const clickable = !!(col.sortable || col.isNumeric || col.isCurrency || col.isDate);
                return (
                  <th
                    key={col.id}
                    onClick={() => handleSort(col)}
                    style={{
                      padding: '10px 16px', borderBottom: '1px solid var(--border-main)',
                      color: 'var(--text-main)', fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap',
                      cursor: clickable ? 'pointer' : 'default', textAlign: col.isNumeric || col.isCurrency ? 'right' : 'left'
                    }}
                  >
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      <span>{col.headerUr || col.header}</span>
                      {col.headerUr && col.header && <span style={{ fontSize: 10, fontWeight: 500, color: 'var(--text-muted)' }}>{col.header}</span>}
                      {clickable && sortKey === col.accessor && <span style={{ fontSize: 10, color: 'var(--color-accent)' }}>{sortDir === 'asc' ? '↑' : '↓'}</span>}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={activeColumns.length} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                <div className="animate-pulse" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 22 }}>⏳</span>
                  <span style={{ fontSize: 12, fontWeight: 600 }}>{isEn ? 'Loading register data…' : 'رجسٹر ڈیٹا لوڈ ہو رہا ہے…'}</span>
                </div>
              </td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan={activeColumns.length} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 24, opacity: 0.6 }}>📭</span>
                  <span style={{ fontSize: 12, fontWeight: 600 }}>{isEn ? 'No records found for the selected criteria.' : 'منتخب معیار کے مطابق کوئی ریکارڈ نہیں ملا۔'}</span>
                </div>
              </td></tr>
            ) : (
              rows.map((row, idx) => (
                <tr
                  key={row._id || idx}
                  onClick={() => onRowClick?.(row)}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = onRowClick ? 'color-mix(in srgb, var(--primary-accent) 7%, transparent)' : e.currentTarget.style.backgroundColor; }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = idx % 2 === 1 ? 'rgba(0,0,0,0.015)' : 'transparent'; }}
                  style={{
                    borderBottom: '1px solid var(--border-subtle)',
                    backgroundColor: idx % 2 === 1 ? 'rgba(0,0,0,0.015)' : 'transparent',
                    cursor: onRowClick ? 'pointer' : 'default',
                    transition: 'background-color 0.15s ease'
                  }}
                >
                  {activeColumns.map(col => {
                    const value = row[col.accessor];
                    let cell: React.ReactNode;
                    if (col.isStatus) {
                      const badge = statusBadge(value);
                      cell = <span style={{ padding: '2px 10px', borderRadius: 12, fontSize: 11, fontWeight: 600, backgroundColor: badge.bg, color: badge.text, whiteSpace: 'nowrap' }}>{badge.label}</span>;
                    } else if (col.isCurrency) {
                      cell = <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>{formatCurrency(value)}</span>;
                    } else if (col.isNumeric) {
                      cell = <span style={{ fontFamily: 'monospace' }}>{formatNumber(value)}</span>;
                    } else if (col.isDate) {
                      cell = <span>{formatDate(value)}</span>;
                    } else {
                      cell = <span>{value === null || value === undefined || value === '' ? '—' : String(value)}</span>;
                    }
                    return (
                      <td key={col.id} style={{ padding: '10px 16px', color: 'var(--text-main)', fontSize: 13, textAlign: col.isNumeric || col.isCurrency ? 'right' : 'left', whiteSpace: col.isNumeric || col.isCurrency || col.isDate ? 'nowrap' : 'normal' }}>
                        {cell}
                      </td>
                    );
                  })}
                </tr>
              ))
            )}
          </tbody>
          {summaryRow && rows.length > 0 && (
            <tfoot>
              <tr style={{ backgroundColor: 'rgba(59,130,246,0.06)', borderTop: '2px solid var(--border-main)' }}>
                {activeColumns.map(col => {
                  const sv = summaryRow[col.accessor];
                  if (sv === undefined) return <td key={col.id} style={{ padding: '10px 16px', color: 'var(--text-muted)' }}>{col.id === activeColumns[0]?.id ? (isEn ? 'Total' : 'کل') : ''}</td>;
                  let text: string;
                  if (col.isCurrency) text = formatCurrency(sv);
                  else if (col.isNumeric) text = formatNumber(sv);
                  else text = String(sv);
                  return <td key={col.id} style={{ padding: '10px 16px', fontWeight: 700, color: 'var(--color-accent)', fontFamily: 'monospace', textAlign: col.isNumeric || col.isCurrency ? 'right' : 'left' }}>{text}</td>;
                })}
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      {/* Footer — honest record count */}
      <div style={{ padding: '8px 16px', borderTop: '1px solid var(--border-main)', fontSize: 11, color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 4 }}>
        <span>{rows.length} {isEn ? (rows.length === 1 ? 'record' : 'records') : 'ریکارڈز'}</span>
        {search && <span>{isEn ? `Filtered by "${search}"` : `"${search}" سے فلٹر`}</span>}
      </div>
    </div>
  );
};
