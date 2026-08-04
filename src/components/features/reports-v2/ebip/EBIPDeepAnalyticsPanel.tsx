/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * FuelPro Enterprise Reports Platform v2.0 — EBIP Deep Analytics Panel
 *
 * Generic deep-analytics layer for every report (Phase 3 roadmap).
 * Runs the curated EBIP metric set for the current report's engine type
 * against the REAL tenant context + workspace date window, and compares
 * the current window against the previous equal-length window.
 *
 * Truth contract (AGENTS.md Rules #1, #100, #110, #123–#125, #121):
 *   - Every number is an EBIPQueryEngine ExecutionResult computed by the
 *     Formula Registry from live Firestore records — never fabricated.
 *   - The narrative findings are deterministic rules over verified values
 *     (no LLM, no hidden state). Each finding traces to a metric's
 *     SHA-256 provenance (hash + formula version + source records).
 *   - Point-in-time metrics (stock, balances) honestly show N/A for the
 *     previous window instead of pretending a comparison exists.
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useWorkspaceState, resolveDateRange } from '../framework/WorkspaceStateManager';
import { EBIPQueryEngine, ExecutionResult } from '../../../../lib/reports-v2/ebip/engine/queryEngine';
import { getEBIPMetricsForEngine, formatEBIPValue, EBIPMetricRef } from '../../../../lib/reports-v2/ebip/reports/engineMetricMap';
import { pctDelta, statusFor } from '../../../../lib/reports-v2/ebip/reports/deltaLogic';
import { R001ExplainabilityModal } from './R001/R001ExplainabilityModal';

const engine = new EBIPQueryEngine();

interface MetricRow {
  ref: EBIPMetricRef;
  current: ExecutionResult | null;
  previous: ExecutionResult | null;
  failed: boolean;
}

interface ExplainState {
  isOpen: boolean;
  metricName: string;
  result: ExecutionResult | null;
}

interface Props {
  engineType: string;
  reportId: string;
}

export default function EBIPDeepAnalyticsPanel({ engineType, reportId }: Props) {
  const { language, orgId, stationId, userId, activeRole, dateRange } = useWorkspaceState();
  const isEn = language === 'en';

  const [rows, setRows] = useState<MetricRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [explain, setExplain] = useState<ExplainState>({ isOpen: false, metricName: '', result: null });

  const metricRefs = getEBIPMetricsForEngine(engineType);
  // Keep the last verified rows visible during silent re-runs (no flicker),
  // resetting only when a different report is opened.
  const hasLoadedRef = useRef(false);
  const lastReportIdRef = useRef<string | null>(null);

  const run = useCallback(async () => {
    // Resolve inside the callback — the array reference must stay stable so
    // the effect below never loops on identity changes.
    const refs = getEBIPMetricsForEngine(engineType);
    if (!orgId || !stationId) {
      setError('MISSING_CONTEXT');
      setLoading(false);
      return;
    }
    if (lastReportIdRef.current !== reportId) {
      lastReportIdRef.current = reportId;
      hasLoadedRef.current = false;
    }
    if (!hasLoadedRef.current) setLoading(true);
    setError(null);

    const { dateFrom, dateTo } = resolveDateRange(dateRange);
    const span = dateTo.getTime() - dateFrom.getTime();
    const prevFrom = new Date(dateFrom.getTime() - span);
    const prevTo = new Date(dateFrom.getTime() - 1);

    const ctx = {
      userId: userId || 'system',
      role: (activeRole === 'OWNER' ? 'OWNER' : (activeRole === 'MANAGER' ? 'MANAGER' : 'CASHIER')) as 'OWNER' | 'MANAGER' | 'CASHIER',
      orgId,
      stationId
    };

    const results = await Promise.all(refs.map(async (ref): Promise<MetricRow> => {
      try {
        const current = await engine.executeMetric(ref.metricId, ctx, { start: dateFrom, end: dateTo });
        let previous: ExecutionResult | null = null;
        if (ref.dateAware) {
          try {
            previous = await engine.executeMetric(ref.metricId, ctx, { start: prevFrom, end: prevTo });
          } catch {
            previous = null; // previous-window failure degrades gracefully
          }
        }
        return { ref, current, previous, failed: false };
      } catch (e: any) {
        return { ref, current: null, previous: null, failed: true };
      }
    }));

    setRows(results);
    hasLoadedRef.current = true;
    setLoading(false);
  }, [orgId, stationId, userId, activeRole, dateRange?.preset, dateRange?.startDate, dateRange?.endDate, engineType, reportId]);

  useEffect(() => {
    run();
  }, [run, refreshKey]);

  if (!orgId || !stationId) {
    return (
      <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)', background: 'var(--bg-card)', margin: 24, borderRadius: 12, border: '1px solid var(--border-main)' }}>
        <h2 style={{ color: 'var(--text-main)', marginTop: 0 }}>
          {isEn ? 'No active station context.' : 'کوئی فعال اسٹیشن منتخب نہیں۔'}
        </h2>
        <p>{isEn ? 'Select an active station to run verified deep analytics.' : 'تصدیق شدہ گہرے تجزیات کے لیے ایک فعال اسٹیشن منتخب کریں۔'}</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)' }}>
        <span style={{ fontSize: 24 }}>🔬</span>
        <h2 style={{ color: 'var(--text-main)' }}>{isEn ? 'Running EBIP deep analytics…' : 'ای بی آئی پی گہرے تجزیات چل رہے ہیں…'}</h2>
        <p>{isEn ? `Executing ${metricRefs.length} verified metrics against live operational records.` : 'لائیو آپریشنل ریکارڈز پر تصدیق شدہ میٹرکس چل رہی ہیں۔'}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: 24, textAlign: 'center', background: 'var(--bg-card)', margin: 24, borderRadius: 12, border: '1px solid var(--border-main)' }}>
        <h2 style={{ color: 'var(--color-danger)' }}>❌ {isEn ? 'Analytics Error' : 'تجزیات میں ناکامی'}</h2>
        <p style={{ color: 'var(--text-muted)' }}>{isEn ? error : 'گہرے تجزیات پر عمل نہیں ہو سکا۔'}</p>
      </div>
    );
  }

  const resolvedRows = rows.filter(r => !r.failed);
  const allEmpty = resolvedRows.length === 0 ||
    resolvedRows.every(r => r.current && r.current.value === 0 && r.current.quality.percentage === 0);

  if (allEmpty) {
    return (
      <div style={{ padding: 24 }}>
        <div style={{ padding: 24, textAlign: 'center', background: 'var(--bg-card)', borderRadius: 12, border: '1px dashed var(--border-main)' }}>
          <span style={{ fontSize: 32, opacity: 0.5 }}>🔬</span>
          <h3 style={{ color: 'var(--text-main)', margin: '12px 0 4px' }}>
            {isEn ? 'No verified operational records for deep analytics.' : 'گہرے تجزیات کے لیے کوئی تصدیق شدہ ریکارڈ نہیں۔'}
          </h3>
          <p style={{ color: 'var(--text-muted)', margin: 0 }}>
            {isEn
              ? 'Analytics are 100% live. Create transactions in the selected window to populate verified comparisons.'
              : 'تجزیات مکمل طور پر لائیو ہیں۔ منتخب مدت میں ٹرانزیکشنز بنائیں۔'}
          </p>
          <button
            onClick={() => setRefreshKey(k => k + 1)}
            style={{ marginTop: 16, background: 'var(--bg-app)', border: '1px solid var(--border-main)', borderRadius: 6, padding: '6px 16px', cursor: 'pointer', fontSize: 13, color: 'var(--text-main)' }}
          >
            {isEn ? '↻ Re-run' : '↻ دوبارہ چلائیں'}
          </button>
        </div>
      </div>
    );
  }

  // ── Deterministic narrative findings (Rule #123: every claim is derived) ──
  const findings: { en: string; ur: string; tone: 'GOOD' | 'WARN' | 'INFO' }[] = [];
  const find = (id: string) => resolvedRows.find(r => r.ref.metricId === id);

  const revenue = find('METRIC_GROSS_REVENUE');
  const profit = find('METRIC_NET_PROFIT');
  const expenses = find('METRIC_OPERATING_EXPENSES');

  if (revenue?.current && revenue.previous) {
    const d = pctDelta(revenue.current.value, revenue.previous.value);
    const cur = formatEBIPValue(revenue.current.value, revenue.ref.unit);
    const prev = formatEBIPValue(revenue.previous.value, revenue.ref.unit);
    if (d === null) {
      // Previous window had no recorded revenue — report the fact, never infer a trend.
      findings.push({
        en: `Revenue is ${cur} this window; the previous window had no recorded revenue.`,
        ur: `اس مدت میں آمدنی ${cur} ہے؛ پچھلی مدت میں کوئی ریکارڈ شدہ آمدنی نہیں تھی۔`,
        tone: 'INFO'
      });
    } else if (Math.abs(d) < 0.5) {
      findings.push({
        en: `Revenue is flat vs the previous window (${prev} → ${cur}).`,
        ur: `آمدنی پچھلی مدت کے مقابلے برابر ہے (${prev} → ${cur})۔`,
        tone: 'INFO'
      });
    } else {
      const growing = d > 0;
      findings.push({
        en: `Revenue ${growing ? 'grew' : 'declined'} ${Math.abs(d).toFixed(1)}% vs the previous window (${prev} → ${cur}).`,
        ur: `آمدنی پچھلی مدت کے مقابلے ${Math.abs(d).toFixed(1)}% ${growing ? 'بڑھی' : 'گھٹی'} ہے (${prev} → ${cur})۔`,
        tone: growing ? 'GOOD' : 'WARN'
      });
    }
  }

  if (revenue?.current && profit?.current) {
    const margin = revenue.current.value > 0 ? ((profit.current.value / revenue.current.value) * 100) : 0;
    findings.push({
      en: `Net profit margin is ${margin.toFixed(1)}% of revenue — a ${margin >= 15 ? 'healthy' : margin >= 5 ? 'moderate' : 'thin'} margin.`,
      ur: `خالص منافع مارجن آمدنی کا ${margin.toFixed(1)}% ہے۔`,
      tone: margin >= 15 ? 'GOOD' : margin >= 5 ? 'INFO' : 'WARN'
    });
  }

  if (revenue?.current && expenses?.current && revenue.current.value > 0) {
    const ratio = (expenses.current.value / revenue.current.value) * 100;
    findings.push({
      en: `Operating expenses consume ${ratio.toFixed(1)}% of revenue (Rs ${formatEBIPValue(expenses.current.value, expenses.ref.unit)} vs Rs ${formatEBIPValue(revenue.current.value, revenue.ref.unit)}).`,
      ur: `آپریٹنگ اخراجات آمدنی کا ${ratio.toFixed(1)}% استعمال کرتے ہیں۔`,
      tone: ratio > 70 ? 'WARN' : 'INFO'
    });
  }

  // Period-over-period findings for the remaining date-aware metrics
  resolvedRows
    .filter(r => r.ref.dateAware && r.current && r.previous && r.ref.metricId !== 'METRIC_GROSS_REVENUE')
    .slice(0, 2)
    .forEach(r => {
      const d = pctDelta(r.current!.value, r.previous!.value);
      if (d === null) return;
      const moving = d >= 0 ? 'up' : 'down';
      findings.push({
        en: `${r.ref.label} moved ${moving} ${Math.abs(d).toFixed(1)}% vs the previous window.`,
        ur: `${r.ref.label} پچھلی مدت کے مقابلے ${Math.abs(d).toFixed(1)}% ${d >= 0 ? 'اوپر' : 'نیچے'} ہے۔`,
        tone: r.ref.higherIsBetter ? (d >= 0 ? 'GOOD' : 'WARN') : (d >= 0 ? 'WARN' : 'GOOD')
      });
    });

  // Data quality warnings — never hidden
  resolvedRows
    .filter(r => r.current && r.current.quality.percentage < 100)
    .forEach(r => {
      findings.push({
        en: `Data quality for ${r.ref.label} is ${r.current!.quality.percentage}% (${r.current!.quality.status}) — ${r.current!.quality.issues.join('; ') || 'records incomplete'}.`,
        ur: `${r.ref.label} کی ڈیٹا کوالٹی ${r.current!.quality.percentage}% ہے۔`,
        tone: 'WARN'
      });
    });

  const totalTimeMs = resolvedRows.reduce((s, r) => s + (r.current?.provenance.executionTimeMs || 0) + (r.previous?.provenance.executionTimeMs || 0), 0);
  const minQuality = resolvedRows.length > 0
    ? Math.min(...resolvedRows.map(r => r.current?.quality.percentage ?? 0))
    : 0;
  const hashes = resolvedRows.filter(r => r.current).map(r => r.current!.provenance.hash.substring(0, 10));

  const toneColor: Record<string, string> = { GOOD: 'var(--color-success)', WARN: 'var(--color-warning)', INFO: 'var(--text-main)' };
  const statusColor: Record<string, string> = { UP: 'var(--color-success)', DOWN: 'var(--color-danger)', FLAT: 'var(--text-muted)', NA: 'var(--text-muted)' };

  return (
    <div style={{ padding: '0 24px 24px' }}>
      <div style={{ background: 'var(--bg-card)', borderRadius: 12, border: '1px solid var(--border-main)', overflow: 'hidden' }}>
        {/* Header */}
        <div style={{
          padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8,
          borderBottom: '1px solid var(--border-main)', background: 'rgba(59, 130, 246, 0.04)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 18 }}>🔬</span>
            <h3 style={{ margin: 0, fontSize: 15, color: 'var(--text-main)' }}>
              {isEn ? 'EBIP Deep Analytics' : 'ای بی آئی پی گہرے تجزیات'}
            </h3>
            <span style={{ fontSize: 11, color: 'var(--color-success)', fontWeight: 600, background: 'rgba(16,185,129,0.1)', padding: '2px 8px', borderRadius: 10 }}>
              {isEn ? 'Period Comparison' : 'دورانیہ موازنہ'}
            </span>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{reportId} • {engineType}</span>
            <button
              onClick={() => setRefreshKey(k => k + 1)}
              style={{ background: 'var(--bg-app)', border: '1px solid var(--border-main)', borderRadius: 6, padding: '3px 10px', cursor: 'pointer', fontSize: 11, color: 'var(--text-main)' }}
            >
              {isEn ? '↻ Refresh' : '↻ تازہ کریں'}
            </button>
          </div>
        </div>

        {/* Findings */}
        {findings.length > 0 && (
          <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border-main)', display: 'flex', flexDirection: 'column', gap: 8 }}>
            <p style={{ margin: 0, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: 0.4 }}>
              {isEn ? 'Derived Findings' : 'اخذ کردہ نتائج'}
            </p>
            {findings.slice(0, 5).map((f, i) => (
              <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', fontSize: 13, color: 'var(--text-main)', lineHeight: 1.5 }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: toneColor[f.tone], marginTop: 6, flexShrink: 0 }} />
                <span>{isEn ? f.en : f.ur}</span>
              </div>
            ))}
            <p style={{ margin: 0, fontSize: 10, color: 'var(--text-muted)' }}>
              {isEn
                ? 'All findings are deterministic rules over verified Formula Registry outputs — no AI estimation.'
                : 'تمام نتائج تصدیق شدہ فارمولا رجسٹری آؤٹ پٹ پر قواعد پر مبنی ہیں۔'}
            </p>
          </div>
        )}

        {/* Metric comparison table */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: 'var(--bg-app)' }}>
                <th style={{ textAlign: 'left', padding: '10px 20px', color: 'var(--text-muted)', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.3 }}>
                  {isEn ? 'Metric' : 'میٹرک'}
                </th>
                <th style={{ textAlign: 'right', padding: '10px 12px', color: 'var(--text-muted)', fontSize: 11, fontWeight: 600 }}>
                  {isEn ? 'Current' : 'موجودہ'}
                </th>
                <th style={{ textAlign: 'right', padding: '10px 12px', color: 'var(--text-muted)', fontSize: 11, fontWeight: 600 }}>
                  {isEn ? 'Previous' : 'پچھلا'}
                </th>
                <th style={{ textAlign: 'right', padding: '10px 12px', color: 'var(--text-muted)', fontSize: 11, fontWeight: 600 }}>
                  {isEn ? 'Δ' : 'فرق'}
                </th>
                <th style={{ textAlign: 'center', padding: '10px 12px', color: 'var(--text-muted)', fontSize: 11, fontWeight: 600 }}>
                  {isEn ? 'Status' : 'حالت'}
                </th>
                <th style={{ textAlign: 'right', padding: '10px 20px', color: 'var(--text-muted)', fontSize: 11, fontWeight: 600 }} />
              </tr>
            </thead>
            <tbody>
              {resolvedRows.map((r) => {
                const cur = r.current?.value ?? 0;
                const prev = r.previous?.value;
                const delta = r.ref.dateAware && prev !== null && prev !== undefined ? pctDelta(cur, prev) : null;
                const status = statusFor(delta, r.ref.higherIsBetter);
                return (
                  <tr key={r.ref.metricId} style={{ borderTop: '1px solid var(--border-subtle)' }}>
                    <td style={{ padding: '10px 20px', color: 'var(--text-main)', fontWeight: 500 }}>
                      {isEn ? r.ref.label : r.ref.labelUr}
                    </td>
                    <td style={{ textAlign: 'right', padding: '10px 12px', color: 'var(--text-main)', fontWeight: 700, whiteSpace: 'nowrap' }}>
                      {formatEBIPValue(cur, r.ref.unit)}
                    </td>
                    <td style={{ textAlign: 'right', padding: '10px 12px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                      {prev === null || prev === undefined
                        ? (r.ref.dateAware ? '—' : (isEn ? 'N/A (snapshot)' : 'ناقابل موازنہ'))
                        : formatEBIPValue(prev, r.ref.unit)}
                    </td>
                    <td style={{ textAlign: 'right', padding: '10px 12px', color: delta === null ? 'var(--text-muted)' : (status === 'UP' ? 'var(--color-success)' : status === 'DOWN' ? 'var(--color-danger)' : 'var(--text-muted)'), whiteSpace: 'nowrap', fontWeight: 600 }}>
                      {delta === null ? '—' : `${delta >= 0 ? '+' : ''}${delta.toFixed(1)}%`}
                    </td>
                    <td style={{ textAlign: 'center', padding: '10px 12px' }}>
                      <span style={{ fontSize: 10, fontWeight: 700, color: statusColor[status], background: `${statusColor[status]}14`, padding: '2px 8px', borderRadius: 10 }}>
                        {status}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right', padding: '10px 20px' }}>
                      <button
                        onClick={() => r.current && setExplain({ isOpen: true, metricName: isEn ? r.ref.label : r.ref.labelUr, result: r.current })}
                        disabled={!r.current}
                        style={{ background: 'transparent', border: '1px solid var(--border-main)', borderRadius: 6, padding: '2px 10px', cursor: r.current ? 'pointer' : 'not-allowed', fontSize: 11, color: 'var(--color-accent)' }}
                      >
                        {isEn ? 'Explain' : 'وضاحت'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Provenance footer — derived, never fabricated */}
        <div style={{ padding: '10px 20px', borderTop: '1px solid var(--border-main)', background: 'var(--bg-app)', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, fontSize: 11, color: 'var(--text-muted)' }}>
          <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
            <span><strong>{isEn ? 'Min Data Quality' : 'کم از کم ڈیٹا کوالٹی'}:</strong> <span style={{ color: minQuality >= 90 ? 'var(--color-success)' : 'var(--color-warning)', fontWeight: 700 }}>{minQuality}%</span></span>
            <span><strong>{isEn ? 'Total Query Time' : 'کل کوری ٹائم'}:</strong> {totalTimeMs}ms</span>
            <span><strong>{isEn ? 'Metrics Executed' : 'چلائی گئی میٹرکس'}:</strong> {resolvedRows.length}</span>
          </div>
          <span style={{ fontFamily: 'monospace', fontSize: 10, maxWidth: 420, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            SHA-256: {hashes.join(' · ') || '—'}
          </span>
        </div>
      </div>

      {explain.isOpen && explain.result && (
        <R001ExplainabilityModal
          isOpen={explain.isOpen}
          onClose={() => setExplain({ isOpen: false, metricName: '', result: null })}
          metricName={explain.metricName}
          value={explain.result.value}
          quality={explain.result.quality}
          provenance={explain.result.provenance}
        />
      )}
    </div>
  );
}
