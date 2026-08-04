/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * FuelPro Enterprise Reports Platform v2.0 — Global Filters
 *
 * Universal filter bar for date range, station, staff, and product filtering.
 */

import React, { useState, useCallback } from 'react';
import { Calendar, Filter, RotateCcw } from 'lucide-react';
import type { ReportFilters, DateRange } from '../../../lib/reports-v2';

interface GlobalFiltersProps {
  filters: ReportFilters;
  onFiltersChange: (filters: ReportFilters) => void;
  language: 'en' | 'ur';
}

const DATE_PRESETS: { id: string; labelEn: string; labelUr: string; days: number }[] = [
  { id: 'today', labelEn: 'Today', labelUr: 'آج', days: 0 },
  { id: '7d', labelEn: 'Last 7 Days', labelUr: 'پچھلے 7 دن', days: 7 },
  { id: '30d', labelEn: 'Last 30 Days', labelUr: 'پچھلے 30 دن', days: 30 },
  { id: '90d', labelEn: 'Last 90 Days', labelUr: 'پچھلے 90 دن', days: 90 }
];

function getDateRange(days: number): DateRange {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - days);
  return {
    startDate: start.toISOString().split('T')[0],
    endDate: end.toISOString().split('T')[0]
  };
}

export default function GlobalFilters({
  filters,
  onFiltersChange,
  language
}: GlobalFiltersProps) {
  const isEn = language === 'en';
  const [activePreset, setActivePreset] = useState<string>('today');

  const handlePresetClick = useCallback((preset: typeof DATE_PRESETS[0]) => {
    setActivePreset(preset.id);
    const dateRange = getDateRange(preset.days);
    onFiltersChange({
      ...filters,
      dateRange: { ...dateRange, preset: preset.id }
    });
  }, [filters, onFiltersChange]);

  const handleDateChange = useCallback((field: 'startDate' | 'endDate', value: string) => {
    setActivePreset('custom');
    onFiltersChange({
      ...filters,
      dateRange: {
        ...filters.dateRange,
        [field]: value,
        preset: 'custom'
      }
    });
  }, [filters, onFiltersChange]);

  const handleReset = useCallback(() => {
    setActivePreset('today');
    onFiltersChange({
      dateRange: getDateRange(0)
    });
  }, [onFiltersChange]);

  return (
    <div
      style={{
        padding: '12px 20px',
        backgroundColor: 'var(--bg-subtle)',
        borderBottom: '1px solid var(--border-main)',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        flexWrap: 'wrap'
      }}
    >
      {/* Filter Icon */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          color: 'var(--text-muted)',
          fontSize: 13,
          fontWeight: 600,
          minWidth: 'fit-content'
        }}
      >
        <Filter size={14} />
        {isEn ? 'Filters' : 'فلٹرز'}
      </div>

      {/* Date Presets */}
      <div className="flex items-center gap-1 flex-wrap">
        {DATE_PRESETS.map(preset => (
          <button
            key={preset.id}
            onClick={() => handlePresetClick(preset)}
            style={{
              padding: '5px 12px',
              borderRadius: 8,
              fontSize: 12,
              fontWeight: 600,
              border: '1px solid',
              cursor: 'pointer',
              transition: 'all 0.15s',
              minHeight: 32,
              minWidth: 'auto',
              backgroundColor: activePreset === preset.id
                ? 'var(--primary-accent)'
                : 'var(--bg-card)',
              color: activePreset === preset.id
                ? '#fff'
                : 'var(--text-main)',
              borderColor: activePreset === preset.id
                ? 'var(--primary-accent)'
                : 'var(--border-main)'
            }}
          >
            {isEn ? preset.labelEn : preset.labelUr}
          </button>
        ))}
      </div>

      {/* Custom Date Range */}
      <div className="flex items-center gap-2" style={{ marginLeft: 'auto' }}>
        <Calendar size={14} style={{ color: 'var(--text-muted)' }} />
        <input
          type="date"
          value={filters.dateRange?.startDate || ''}
          onChange={(e) => handleDateChange('startDate', e.target.value)}
          style={{
            padding: '5px 10px',
            borderRadius: 8,
            border: '1px solid var(--border-main)',
            backgroundColor: 'var(--bg-card)',
            color: 'var(--text-main)',
            fontSize: 12,
            fontWeight: 500,
            minHeight: 32,
            minWidth: 'auto'
          }}
        />
        <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>→</span>
        <input
          type="date"
          value={filters.dateRange?.endDate || ''}
          onChange={(e) => handleDateChange('endDate', e.target.value)}
          style={{
            padding: '5px 10px',
            borderRadius: 8,
            border: '1px solid var(--border-main)',
            backgroundColor: 'var(--bg-card)',
            color: 'var(--text-main)',
            fontSize: 12,
            fontWeight: 500,
            minHeight: 32,
            minWidth: 'auto'
          }}
        />

        {/* Reset Button */}
        <button
          onClick={handleReset}
          style={{
            padding: '5px 10px',
            borderRadius: 8,
            border: '1px solid var(--border-main)',
            backgroundColor: 'var(--bg-card)',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            fontSize: 12,
            fontWeight: 500,
            minHeight: 32,
            minWidth: 'auto',
            transition: 'all 0.15s'
          }}
          title={isEn ? 'Reset Filters' : 'فلٹرز ری سیٹ کریں'}
        >
          <RotateCcw size={12} />
        </button>
      </div>
    </div>
  );
}
