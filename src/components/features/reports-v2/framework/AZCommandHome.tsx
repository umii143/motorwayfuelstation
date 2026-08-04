/**
 * @license SPDX-License-Identifier: Apache-2.0
 *
 * FuelPro Enterprise Reports Platform v2.0 — A-Z Command Home
 *
 * The landing screen of the Reports Control Room (PRD §1.5):
 *  - "My Frequent Reports" — REAL per-station usage data (db.getReportRecents)
 *  - A search bar ("Kaunsi report chahiye?") filtering the whole A-Z catalog
 *  - Priority quick links covering the owner's day-to-day money questions:
 *    Sales, Shift Logs & Meter Readings, Cash Book/Bank/Digital, Purchasing &
 *    Suppliers & Expenses, Profit/Loss, Current Stock & Tank Readings.
 *  - Urdu-first, role-aware (RBAC from the active session — never a debug picker).
 */

import React, { useMemo, useState } from 'react';
import { useWorkspaceState } from './WorkspaceStateManager';
import { EnterpriseReportRegistry, DOMAINS } from '../../../../lib/reports-v2/foundation/EnterpriseReportRegistry';

const PRIORITY_QUICK_LINKS: { reportId: string; emoji: string; ur: string; en: string }[] = [
  { reportId: 'A-001', emoji: '👑', ur: 'آج کا خلاصہ', en: "Today's Dashboard" },
  { reportId: 'B-001', emoji: '⛽', ur: 'آج کی سیل', en: 'Daily Sales' },
  { reportId: 'H-001', emoji: '🔄', ur: 'شفٹ لاگز', en: 'Shift Logs' },
  { reportId: 'G-002', emoji: '📏', ur: 'میٹر ریڈنگز', en: 'Meter Readings' },
  { reportId: 'I-002', emoji: '💵', ur: 'کیش فرق', en: 'Cash Variance' },
  { reportId: 'J-001', emoji: '🏦', ur: 'بینک کیش', en: 'Bank Cash' },
  { reportId: 'K-001', emoji: '📱', ur: 'ڈیجیٹل کیش', en: 'Digital Cash' },
  { reportId: 'D-001', emoji: '🚛', ur: 'خریداری', en: 'Fuel Purchases' },
  { reportId: 'N-001', emoji: '🤝', ur: 'سپلائر لیجر', en: 'Supplier Ledger' },
  { reportId: 'O-001', emoji: '💸', ur: 'اخراجات', en: 'Expenses' },
  { reportId: 'P-001', emoji: '📊', ur: 'منافع / نقصان', en: 'Profit & Loss' },
  { reportId: 'C-001', emoji: '🛢️', ur: 'موجودہ اسٹاک', en: 'Current Stock' },
  { reportId: 'F-001', emoji: '📏', ur: 'ڈپ رجسٹر', en: 'Tank Dip Register' }
];

export default function AZCommandHome() {
  const { language, setActiveReportId, activeRole, recents, favorites } = useWorkspaceState();
  const [search, setSearch] = useState('');
  const isEn = language === 'en';

  const registry = EnterpriseReportRegistry.getInstance();
  // Memoized so the search useMemo below has stable deps (preserve-manual-memoization).
  const allReports = useMemo(
    () => registry.getAllReports().filter(r => r.permission.includes(activeRole)),
    [registry, activeRole]
  );

  // Frequent reports = real recently-opened report IDs (per station, Rule #125)
  const frequentIds = [...new Set([...favorites, ...recents])].slice(0, 8);
  const frequentReports = frequentIds
    .map(id => registry.getReport(id))
    .filter((r): r is NonNullable<typeof r> => !!r && r.permission.includes(activeRole));

  const searchResults = useMemo(() => {
    if (!search.trim()) return [];
    const q = search.toLowerCase();
    return allReports.filter(r =>
      r.reportName.toLowerCase().includes(q) ||
      r.simpleName.toLowerCase().includes(q) ||
      r.reportName.includes(search) ||
      r.reportId.toLowerCase().includes(q) ||
      r.module.toLowerCase().includes(q)
    ).slice(0, 12);
  }, [search, allReports]);

  const renderReportChip = (r: NonNullable<ReturnType<typeof registry.getReport>>) => (
    <button
      key={r.reportId}
      onClick={() => setActiveReportId(r.reportId)}
      style={{
        display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px',
        backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-main)',
        borderRadius: 10, cursor: 'pointer', textAlign: 'left',
        transition: 'all 0.15s', flex: '1 1 220px', maxWidth: 320
      }}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--color-accent)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border-main)'; e.currentTarget.style.transform = 'translateY(0)'; }}
    >
      <span style={{ fontSize: 20 }}>{r.category ? DOMAINS.find(d => d.id === r.category)?.emoji || '📄' : '📄'}</span>
      <span style={{ display: 'flex', flexDirection: 'column', gap: 1, overflow: 'hidden' }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {r.simpleName} <span style={{ fontSize: 10, fontWeight: 500, color: 'var(--text-muted)' }}>({r.reportId})</span>
        </span>
        <span style={{ fontSize: 11, color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.reportName}</span>
      </span>
    </button>
  );

  return (
    <div style={{ flex: 1, backgroundColor: 'var(--bg-app)', overflowY: 'auto', padding: 32 }}>
      <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 32 }}>

        {/* Hero */}
        <div style={{ textAlign: 'center', padding: '24px 0 8px' }}>
          <span style={{ fontSize: 48 }}>🏪</span>
          <h1 style={{ fontSize: 26, color: 'var(--text-main)', margin: '12px 0 6px' }}>
            {isEn ? 'FuelPro Control Room' : 'فیول پرو کنٹرول روم'}
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, lineHeight: 1.6, maxWidth: 620, margin: '0 auto' }}>
            {isEn
              ? 'Every report starts with big numbers. Tap a KPI card to go deeper, and tap rows in the register to trace every rupee to its source.'
              : 'ہر رپورٹ بڑے نمبروں سے شروع ہوتی ہے۔ مزید تفصیل کے لیے کارڈ پر تھپتھپائیں، اور ہر روپیہ کا سراغ لگانے کے لیے رجسٹر کی قطار پر کلک کریں۔'}
          </p>
          {/* Search — "Kaunsi report chahiye?" */}
          <div style={{ maxWidth: 520, margin: '20px auto 0' }}>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={isEn ? '🔍 Which report do you need? Search A–Z...' : '🔍 کونسی رپورٹ چاہیے؟ تلاش کریں...'}
              style={{
                width: '100%', padding: '12px 16px', fontSize: 14, borderRadius: 10,
                backgroundColor: 'var(--bg-card)', color: 'var(--text-main)',
                border: '1px solid var(--border-main)', outline: 'none'
              }}
            />
          </div>
        </div>

        {/* Search results */}
        {search.trim() && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <h3 style={{ fontSize: 14, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5, margin: 0 }}>
              {isEn ? `Results (${searchResults.length})` : `نتائج (${searchResults.length})`}
            </h3>
            {searchResults.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>{isEn ? 'No report matches your search.' : 'آپ کی تلاش سے ملتی جلتی کوئی رپورٹ نہیں۔'}</p>
            ) : (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>{searchResults.map(renderReportChip)}</div>
            )}
          </div>
        )}

        {/* My Frequent Reports — real usage data */}
        {!search.trim() && frequentReports.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <h3 style={{ fontSize: 14, color: 'var(--text-main)', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span>⭐</span> {isEn ? 'My Frequent Reports' : 'میری پسندیدہ رپورٹس'}
            </h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
              {frequentReports.map(renderReportChip)}
            </div>
          </div>
        )}

        {/* Priority quick links — the owner's daily money questions */}
        {!search.trim() && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <h3 style={{ fontSize: 14, color: 'var(--text-main)', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span>🚀</span> {isEn ? 'Quick Access — Your Daily Numbers' : 'فوری رسائی — روزانہ کے نمبر'}
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 10 }}>
              {PRIORITY_QUICK_LINKS
                .map(link => ({ link, report: registry.getReport(link.reportId) }))
                .filter(({ report }) => report && report.permission.includes(activeRole))
                .map(({ link }) => (
                  <button
                    key={link.reportId}
                    onClick={() => setActiveReportId(link.reportId)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px',
                      backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-main)',
                      borderRadius: 12, cursor: 'pointer', textAlign: 'left',
                      transition: 'all 0.15s'
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--color-accent)'; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = 'var(--shadow-md)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border-main)'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
                  >
                    <span style={{ fontSize: 26 }}>{link.emoji}</span>
                    <span style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-main)' }}>{link.ur}</span>
                      <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{link.en} · {link.reportId}</span>
                    </span>
                    <span style={{ marginLeft: 'auto', color: 'var(--text-muted)', fontSize: 16 }}>→</span>
                  </button>
                ))}
            </div>
          </div>
        )}

        {/* A-Z index */}
        {!search.trim() && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <h3 style={{ fontSize: 14, color: 'var(--text-main)', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span>📚</span> {isEn ? 'Browse the Full A–Z Catalog' : 'مکمل اے ٹو زیڈ کیٹلاگ'}
            </h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {DOMAINS.map(d => {
                const count = registry.getReportsByDomain(d.id).filter(r => r.permission.includes(activeRole)).length;
                if (count === 0) return null;
                return (
                  <span
                    key={d.id}
                    title={isEn ? d.nameEn : d.nameUr}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 10px',
                      backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-main)',
                      borderRadius: 8, fontSize: 12, color: 'var(--text-main)', fontWeight: 600
                    }}
                  >
                    <span>{d.emoji}</span>
                    <span>{d.id}</span>
                    <span style={{ color: 'var(--text-muted)', fontSize: 10 }}>{count}</span>
                  </span>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
