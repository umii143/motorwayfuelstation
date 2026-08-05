/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * FuelPro Enterprise Reports Platform v2.0
 * Phase 1.2 — UI Framework
 *
 * Universal Filter Framework.
 * Date-range presets are REAL: they update the workspace dateRange state,
 * which every live report consumes (Rules #7/#100 — filters bind to real
 * state, never fabricated pills).
 *
 * Product/Tank/Pump/Operator filters are real too: the LiveReportRenderer
 * builds them from the actual register data and writes them to the
 * workspace filters state, which the Query Engine applies to every query.
 * This bar displays the ACTIVE filters truthfully and lets the user clear
 * them — it never pretends a filter is applied when it is not.
 */

import React from 'react';
import { useWorkspaceState, ReportDatePreset, ReportFilterKey } from './WorkspaceStateManager';

const PRESETS: { id: ReportDatePreset; labelEn: string; labelUr: string }[] = [
  { id: 'today', labelEn: 'Today', labelUr: 'آج' },
  { id: '7d', labelEn: 'Last 7 Days', labelUr: 'پچھلے 7 دن' },
  { id: '30d', labelEn: 'Last 30 Days', labelUr: 'پچھلے 30 دن' },
  { id: '90d', labelEn: 'Last 90 Days', labelUr: 'پچھلے 90 دن' },
  { id: 'custom', labelEn: 'Custom', labelUr: 'اپنی مرضی' }
];

const FILTER_LABELS: Record<ReportFilterKey, { en: string; ur: string }> = {
  product: { en: 'Product', ur: 'پروڈکٹ' },
  tank: { en: 'Tank', ur: 'ٹینک' },
  pump: { en: 'Pump', ur: 'پمپ' },
  operator: { en: 'Operator', ur: 'آپریٹر' },
  status: { en: 'Status', ur: 'حالت' },
  payment: { en: 'Payment', ur: 'ادائیگی' },
  branch: { en: 'Branch', ur: 'برانچ' }
};

interface FilterPillProps {
  label: string;
  value: string;
}

/** Hoisted outside the component — never created during render (Rules of Hooks). */
function FilterPill({ label, value }: FilterPillProps) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: 2,
      padding: '4px 10px',
      backgroundColor: 'var(--bg-card)',
      border: '1px solid var(--border-main)',
      borderRadius: 6,
      minWidth: 110
    }}>
      <span style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
        {label}
      </span>
      <span style={{ fontSize: 13, color: 'var(--text-main)', fontWeight: 500 }}>
        {value}
      </span>
    </div>
  );
}

export default function UniversalFilterFramework() {
  const { language, dateRange, setDateRange, stationId, filters, clearFilters, setFilter } = useWorkspaceState();
  const isEn = language === 'en';

  const activeFilters = (Object.entries(filters) as [ReportFilterKey, string][]).filter(([, v]) => v !== '' && v !== null && v !== undefined);

  return (
    <div style={{
      padding: '12px 20px',
      backgroundColor: 'var(--bg-subtle)',
      borderBottom: '1px solid var(--border-main)',
      display: 'flex',
      flexDirection: 'column',
      gap: 12
    }}>
      {/* Top Row: Date Range (real, clickable) + Context Chip */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, overflowX: 'auto' }} className="custom-horizontal-scrollbar pb-1" data-horizontal-scroll="true">
        {/* Date Range Presets */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
          <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
            {isEn ? 'Date' : 'تاریخ'}:
          </span>
          {PRESETS.map(p => (
            <button
              key={p.id}
              onClick={() => setDateRange({ preset: p.id })}
              style={{
                padding: '5px 10px',
                borderRadius: 8,
                fontSize: 12,
                fontWeight: 600,
                border: '1px solid',
                cursor: 'pointer',
                transition: 'all 0.15s',
                minHeight: 30,
                minWidth: 'auto',
                backgroundColor: dateRange.preset === p.id ? 'var(--primary-accent)' : 'var(--bg-card)',
                color: dateRange.preset === p.id ? '#fff' : 'var(--text-main)',
                borderColor: dateRange.preset === p.id ? 'var(--primary-accent)' : 'var(--border-main)'
              }}
            >
              {isEn ? p.labelEn : p.labelUr}
            </button>
          ))}
        </div>

        {/* Custom Range Inputs */}
        {dateRange.preset === 'custom' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
            <input
              type="date"
              value={dateRange.startDate || ''}
              onChange={(e) => setDateRange({ preset: 'custom', startDate: e.target.value, endDate: dateRange.endDate })}
              style={{ padding: '5px 8px', borderRadius: 8, border: '1px solid var(--border-main)', backgroundColor: 'var(--bg-card)', color: 'var(--text-main)', fontSize: 12, minHeight: 30 }}
            />
            <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>→</span>
            <input
              type="date"
              value={dateRange.endDate || ''}
              onChange={(e) => setDateRange({ preset: 'custom', startDate: dateRange.startDate, endDate: e.target.value })}
              style={{ padding: '5px 8px', borderRadius: 8, border: '1px solid var(--border-main)', backgroundColor: 'var(--bg-card)', color: 'var(--text-main)', fontSize: 12, minHeight: 30 }}
            />
          </div>
        )}

        <div style={{ width: 1, height: 24, backgroundColor: 'var(--border-main)', margin: '0 4px', flexShrink: 0 }} />

        <FilterPill
          label={isEn ? 'Branch' : 'برانچ'}
          value={stationId ? `Station ${stationId.slice(-6)}` : (isEn ? 'Active Station' : 'فعال اسٹیشن')}
        />
      </div>

      {/* Active Filters Row — truthfully reflects workspace filter state */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, overflowX: 'auto', flexWrap: 'wrap' }} className="custom-horizontal-scrollbar pb-1" data-horizontal-scroll="true">
        {activeFilters.length === 0 ? (
          <span style={{ fontSize: 12, color: 'var(--text-muted)', opacity: 0.7 }}>
            {isEn ? 'No active filters — showing all records. Open a report and use its filter bar to narrow down.' : 'کوئی فلٹر فعال نہیں — تمام ریکارڈز دکھائے جا رہے ہیں۔'}
          </span>
        ) : (
          <>
            <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
              {isEn ? 'Active Filters' : 'فعال فلٹرز'}:
            </span>
            {activeFilters.map(([key, value]) => (
              <span
                key={key}
                onClick={() => setFilter(key, '')}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  padding: '3px 10px', borderRadius: 12, cursor: 'pointer',
                  backgroundColor: 'rgba(59,130,246,0.12)', color: 'var(--color-accent)',
                  border: '1px solid rgba(59,130,246,0.3)', fontSize: 12, fontWeight: 600
                }}
                title={isEn ? `Remove ${FILTER_LABELS[key].en} filter` : `فلٹر ہٹائیں`}
              >
                {FILTER_LABELS[key][isEn ? 'en' : 'ur']}: {value} <span style={{ opacity: 0.7 }}>✕</span>
              </span>
            ))}
            <button
              onClick={clearFilters}
              style={{
                padding: '3px 12px', backgroundColor: 'transparent',
                border: '1px dashed var(--color-danger)', color: 'var(--color-danger)',
                borderRadius: 12, fontSize: 12, cursor: 'pointer', fontWeight: 600
              }}
            >
              {isEn ? '✕ Clear All' : '✕ سب ہٹائیں'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
