/**
 * @license SPDX-License-Identifier: Apache-2.0
 *
 * FuelPro Enterprise Business Operating System v4.0
 * WorkspaceDateFilterMenu — Interactive Popover Date Range Picker & Filter Menu
 *
 * Supports Presets: Today, Yesterday, This Week, This Month, Last Month, This Year, Custom Date Range
 */

import React, { useState, useRef, useEffect } from 'react';
import { Calendar, ChevronDown, Check } from 'lucide-react';

export type DatePresetKey = 'today' | 'yesterday' | 'this_week' | 'this_month' | 'last_month' | 'this_year' | 'custom';

export interface DateFilterState {
  preset: DatePresetKey;
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  label: string;
}

interface WorkspaceDateFilterMenuProps {
  value: DateFilterState;
  onChange: (newValue: DateFilterState) => void;
  lang: 'en' | 'ur';
}

export const WorkspaceDateFilterMenu: React.FC<WorkspaceDateFilterMenuProps> = ({
  value,
  onChange,
  lang,
}) => {
  const isEn = lang === 'en';
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const [tempPreset, setTempPreset] = useState<DatePresetKey>(value.preset);
  const [tempStart, setTempStart] = useState(value.startDate || '2025-05-15');
  const [tempEnd, setTempEnd] = useState(value.endDate || '2025-05-15');

  // Close menu on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const presets: { key: DatePresetKey; labelEn: string; labelUr: string }[] = [
    { key: 'today', labelEn: 'Today (May 15, 2025)', labelUr: 'آج' },
    { key: 'yesterday', labelEn: 'Yesterday', labelUr: 'گزشتہ کل' },
    { key: 'this_week', labelEn: 'This Week', labelUr: 'اس ہفتے' },
    { key: 'this_month', labelEn: 'This Month', labelUr: 'اس ماہ' },
    { key: 'last_month', labelEn: 'Last Month', labelUr: 'پچھلے ماہ' },
    { key: 'this_year', labelEn: 'This Year', labelUr: 'اس سال' },
    { key: 'custom', labelEn: 'Custom Date Range...', labelUr: 'حسب ضرورت تاریخ...' },
  ];

  const handleSelectPreset = (key: DatePresetKey) => {
    setTempPreset(key);
    let label = 'May 15, 2025';
    let s = '2025-05-15';
    let e = '2025-05-15';

    if (key === 'today') {
      label = 'May 15, 2025';
      s = '2025-05-15';
      e = '2025-05-15';
    } else if (key === 'yesterday') {
      label = 'May 14, 2025 (Yesterday)';
      s = '2025-05-14';
      e = '2025-05-14';
    } else if (key === 'this_week') {
      label = 'May 11 – May 15, 2025 (This Week)';
      s = '2025-05-11';
      e = '2025-05-15';
    } else if (key === 'this_month') {
      label = 'May 01 – May 15, 2025 (This Month)';
      s = '2025-05-01';
      e = '2025-05-15';
    } else if (key === 'last_month') {
      label = 'Apr 01 – Apr 30, 2025 (Last Month)';
      s = '2025-04-01';
      e = '2025-04-30';
    } else if (key === 'this_year') {
      label = 'Jan 01 – May 15, 2025 (2025 YTD)';
      s = '2025-01-01';
      e = '2025-05-15';
    } else if (key === 'custom') {
      label = `${tempStart} to ${tempEnd}`;
      s = tempStart;
      e = tempEnd;
    }

    if (key !== 'custom') {
      onChange({ preset: key, startDate: s, endDate: e, label });
      setIsOpen(false);
    }
  };

  const handleApplyCustom = () => {
    const label = `${tempStart} to ${tempEnd}`;
    onChange({ preset: 'custom', startDate: tempStart, endDate: tempEnd, label });
    setIsOpen(false);
  };

  return (
    <div className="relative inline-block text-left" ref={menuRef}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3.5 py-2 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200 text-xs font-black text-slate-800 shadow-2xs transition-all cursor-pointer"
      >
        <Calendar size={14} className="text-emerald-700" />
        <span>{value.label}</span>
        <ChevronDown size={14} className={`text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Popover Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl border border-slate-200 shadow-xl z-50 p-3 space-y-2 font-sans text-xs">
          <div className="px-2 py-1 font-black text-slate-400 uppercase tracking-wider text-[10px] border-b border-slate-100 mb-1">
            {isEn ? 'SELECT DATE RANGE' : 'تاریخ منتخب کریں'}
          </div>

          <div className="space-y-1">
            {presets.map((p) => (
              <button
                key={p.key}
                onClick={() => handleSelectPreset(p.key)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl font-bold transition-all text-left cursor-pointer ${
                  value.preset === p.key
                    ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <span>{isEn ? p.labelEn : p.labelUr}</span>
                {value.preset === p.key && <Check size={14} className="text-emerald-700" />}
              </button>
            ))}
          </div>

          {/* Custom Date Pickers */}
          {tempPreset === 'custom' && (
            <div className="pt-2 border-t border-slate-100 space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-black text-slate-400 block mb-0.5">Start Date</label>
                  <input
                    type="date"
                    value={tempStart}
                    onChange={(e) => setTempStart(e.target.value)}
                    className="w-full px-2 py-1 rounded-lg border border-slate-200 text-xs font-bold text-slate-800 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 block mb-0.5">End Date</label>
                  <input
                    type="date"
                    value={tempEnd}
                    onChange={(e) => setTempEnd(e.target.value)}
                    className="w-full px-2 py-1 rounded-lg border border-slate-200 text-xs font-bold text-slate-800 focus:outline-none"
                  />
                </div>
              </div>
              <button
                onClick={handleApplyCustom}
                className="w-full py-2 bg-[#0B5C3D] hover:bg-emerald-800 text-white font-black text-xs rounded-xl shadow-xs transition-all cursor-pointer"
              >
                Apply Custom Range
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
