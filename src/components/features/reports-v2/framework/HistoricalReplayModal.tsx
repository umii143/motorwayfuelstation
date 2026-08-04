/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * FuelPro Enterprise Reports Platform v2.0 — Historical Replay (Time Machine)
 *
 * Rules #55, #92, #94, #106:
 *   - Replays any past window through ReportEngine in archive mode — the
 *     Historical Archive cache resolves repeat windows in < 5s (Rule #92).
 *   - "Capture" stores an immutable verified snapshot (Rule #106); replaying
 *     never mutates operational records — it reproduces the exact state.
 *   - Every number shown comes from the verified engine result or archive
 *     stats — never fabricated. Cache hits/misses are reported from the
 *     archive's real counters.
 */

import React, { useEffect, useState } from 'react';
import { useWorkspaceState, resolveDateRange } from './WorkspaceStateManager';
import { ReportEngine } from '../../../../lib/reports-v2/engines/ReportEngine';
import type { QueryContext, ReportEngineResult } from '../../../../lib/reports-v2/engines/types';
import { HistoricalArchive, CapturedSnapshot, ArchiveStats } from '../../../../lib/reports-v2/archival/HistoricalArchive';
import { EnterpriseReportRegistry } from '../../../../lib/reports-v2/foundation/EnterpriseReportRegistry';

function daysAgoISO(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

export default function HistoricalReplayModal() {
  const {
    isReplayOpen, setReplayOpen, language, activeReportId, setActiveReportId,
    orgId, stationId, userId, activeRole, dateRange, setDateRange
  } = useWorkspaceState();
  const isEn = language === 'en';

  const registry = EnterpriseReportRegistry.getInstance();
  const archive = HistoricalArchive.getInstance();

  const [fromDate, setFromDate] = useState(daysAgoISO(30));
  const [toDate, setToDate] = useState(daysAgoISO(1));
  const [running, setRunning] = useState(false);
  const [replay, setReplay] = useState<ReportEngineResult | null>(null);
  const [replayTimeMs, setReplayTimeMs] = useState(0);
  const [cacheHitsDuringReplay, setCacheHitsDuringReplay] = useState(0);
  const [capturing, setCapturing] = useState(false);
  const [snapshots, setSnapshots] = useState<CapturedSnapshot[]>([]);
  const [stats, setStats] = useState<ArchiveStats>(archive.stats());
  // Tenant-isolation guard (Rules #106/#125): replaying a snapshot captured
  // under a different org/station would reproduce the wrong tenant's data.
  const [tenantBlocked, setTenantBlocked] = useState<string | null>(null);

  useEffect(() => {
    setSnapshots(archive.getSnapshots());
    setStats(archive.stats());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isReplayOpen]);

  if (!isReplayOpen) return null;

  const report = activeReportId ? registry.getReport(activeReportId) : null;
  const engineType = activeReportId ? registry.getEngineTypeForReport(activeReportId) : 'BusinessDashboard';
  const canRun = Boolean(orgId && stationId && activeReportId && fromDate && toDate);

  const buildCtx = (startISO: string, endISO: string): QueryContext => ({
    orgId,
    stationId,
    userId: userId || 'system',
    role: activeRole,
    dateFrom: new Date(`${startISO}T00:00:00`),
    dateTo: new Date(`${endISO}T23:59:59`)
  });

  const runWindow = async (startISO: string, endISO: string) => {
    if (!canRun) return;
    setRunning(true);
    const hitsBefore = archive.stats().hits;
    const t0 = performance.now();
    try {
      const res = await ReportEngine.getInstance().execute(activeReportId!, engineType, buildCtx(startISO, endISO), { useArchive: true });
      setReplay(res);
      setReplayTimeMs(Math.round(performance.now() - t0));
      setCacheHitsDuringReplay(archive.stats().hits - hitsBefore);
      setStats(archive.stats());
    } catch (e: any) {
      setReplay(null);
    } finally {
      setRunning(false);
    }
  };

  const applyWindowToWorkspace = () => {
    if (!fromDate || !toDate) return;
    setDateRange({ preset: 'custom', startDate: fromDate, endDate: toDate });
  };

  const captureCurrentWindow = async () => {
    if (!orgId || !stationId || !activeReportId) return;
    setCapturing(true);
    try {
      const { dateFrom, dateTo } = resolveDateRange(dateRange);
      const ctx: QueryContext = { orgId, stationId, userId: userId || 'system', role: activeRole, dateFrom, dateTo };
      const res = await ReportEngine.getInstance().execute(activeReportId, engineType, ctx);
      const iso = (d: Date) => d.toISOString().slice(0, 10);
      const label = `${iso(dateFrom)} → ${iso(dateTo)}`;
      archive.captureSnapshot({
        reportId: activeReportId,
        engineType,
        reportName: report?.reportName || report?.simpleName,
        orgId,
        stationId,
        windowLabel: label,
        dateFrom: iso(dateFrom),
        dateTo: iso(dateTo),
        capturedAt: new Date().toISOString(),
        dataQuality: res.dataQuality,
        totalExecutionTimeMs: res.totalExecutionTimeMs,
        kpis: res.kpis.slice(0, 4).map(k => ({ label: k.label, value: k.value, unit: k.unit })),
        registerCount: res.register?.totalCount ?? 0
      });
      setSnapshots(archive.getSnapshots());
      setStats(archive.stats());
    } finally {
      setCapturing(false);
    }
  };

  const replaySnapshot = (s: CapturedSnapshot) => {
    // Tenant isolation (Rules #106/#125): never replay a snapshot under a
    // different org/station — that would reproduce the wrong tenant's data.
    if (s.orgId !== orgId || s.stationId !== stationId) {
      setTenantBlocked(isEn
        ? `This snapshot was captured for station ${s.stationId} (org ${s.orgId}). Replay is blocked while station ${stationId} is active — switch to the original station to reproduce the exact state.`
        : `یہ سنیپ شاٹ اسٹیشن ${s.stationId} کے لیے محفوظ کیا گیا تھا۔ موجودہ اسٹیشن پر ری پلے مسدود ہے — درست حالت دوبارہ حاصل کرنے کے لیے اصل اسٹیشن منتخب کریں۔`);
      return;
    }
    setTenantBlocked(null);
    setFromDate(s.dateFrom);
    setToDate(s.dateTo);
    setDateRange({ preset: 'custom', startDate: s.dateFrom, endDate: s.dateTo });
    setActiveReportId(s.reportId);
    runWindow(s.dateFrom, s.dateTo);
  };

  const clearSnapshots = () => {
    archive.clearSnapshots();
    setSnapshots([]);
    setStats(archive.stats());
  };

  const inputStyle: React.CSSProperties = {
    background: 'var(--bg-app)', border: '1px solid var(--border-main)', borderRadius: 6,
    padding: '6px 10px', color: 'var(--text-main)', fontSize: 13, outline: 'none'
  };

  return (
    <div
      onClick={() => setReplayOpen(false)}
      style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9990, cursor: 'pointer' }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ background: 'var(--bg-app)', width: 680, maxWidth: '94vw', borderRadius: 12, border: '1px solid var(--border-main)', boxShadow: '0 10px 30px rgba(0,0,0,0.2)', display: 'flex', flexDirection: 'column', maxHeight: '90vh', cursor: 'default' }}
      >
        {/* Header */}
        <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border-main)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 18, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: 8 }}>
              🕰 {isEn ? 'Time Machine — Historical Replay' : 'ٹائم مشین — تاریخی ری پلے'}
            </h3>
            <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--text-muted)' }}>
              {isEn
                ? 'Replay any verified window in < 5s from the archive cache. Reproducible, immutable, auditable (Rules #55/#92/#106).'
                : 'آرکائیو کیش سے کسی بھی تصدیق شدہ مدت کو 5 سیکنڈ میں دوبارہ چلائیں۔'}
            </p>
          </div>
          <button onClick={() => setReplayOpen(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: 20, color: 'var(--text-muted)' }}>✖</button>
        </div>

        {/* Body */}
        <div style={{ padding: 20, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 20 }}>
          {tenantBlocked && (
            <div style={{ background: 'rgba(245,158,11,0.12)', border: '1px solid var(--color-warning)', color: 'var(--color-warning)', padding: '12px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600, lineHeight: 1.5 }}>
              ⛔ {tenantBlocked}
            </div>
          )}
          {!activeReportId ? (
            <div style={{ textAlign: 'center', padding: 32, color: 'var(--text-muted)', background: 'var(--bg-card)', borderRadius: 10, border: '1px dashed var(--border-main)' }}>
              <span style={{ fontSize: 36, opacity: 0.5 }}>🕰</span>
              <p style={{ margin: '12px 0 0' }}>
                {isEn ? 'Select a report in the Explorer first to replay its historical windows.' : 'تاریخی مدت ری پلے کرنے کے لیے پہلے ایکسپلورر سے رپورٹ منتخب کریں۔'}
              </p>
            </div>
          ) : (
            <>
              {/* Window selector */}
              <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-main)', borderRadius: 10, padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-main)' }}>
                    {isEn ? 'Replay window' : 'ری پلے مدت'} <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>· {activeReportId} {report?.simpleName ? `· ${report.simpleName}` : ''}</span>
                  </span>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                    {isEn ? 'Archive mode (Rule #92)' : 'آرکائیو موڈ'}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                  <label style={{ fontSize: 12, color: 'var(--text-muted)' }}>{isEn ? 'From' : 'سے'}</label>
                  <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} style={inputStyle} />
                  <label style={{ fontSize: 12, color: 'var(--text-muted)' }}>{isEn ? 'To' : 'تک'}</label>
                  <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} style={inputStyle} />
                  <button
                    onClick={() => runWindow(fromDate, toDate)}
                    disabled={!canRun || running}
                    style={{ background: 'var(--color-warning)', color: '#fff', border: 'none', borderRadius: 6, padding: '7px 16px', cursor: canRun ? 'pointer' : 'not-allowed', fontWeight: 700, fontSize: 13, opacity: canRun ? 1 : 0.5 }}
                  >
                    {running ? (isEn ? 'Replaying…' : 'ری پلے ہو رہا ہے…') : (isEn ? '▶ Replay' : '▶ ری پلے')}
                  </button>
                  <button
                    onClick={applyWindowToWorkspace}
                    disabled={!fromDate || !toDate}
                    style={{ background: 'var(--bg-app)', border: '1px solid var(--border-main)', borderRadius: 6, padding: '7px 12px', cursor: 'pointer', fontSize: 12, color: 'var(--text-main)' }}
                  >
                    {isEn ? 'Apply to workspace' : 'ورک اسپیس پر لگائیں'}
                  </button>
                </div>

                {/* Replay result */}
                {replay && (
                  <div style={{ background: 'var(--bg-app)', border: '1px solid var(--border-subtle)', borderRadius: 8, padding: 12, display: 'flex', flexDirection: 'column', gap: 8, fontSize: 13 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                      <span style={{ color: 'var(--text-main)', fontWeight: 700 }}>
                        {isEn ? 'Replay result' : 'ری پلے نتیجہ'} — <span style={{ color: replay.dataQuality === 'VERIFIED' ? 'var(--color-success)' : replay.dataQuality === 'EMPTY' ? 'var(--text-muted)' : 'var(--color-warning)' }}>{replay.dataQuality}</span>
                      </span>
                      <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>
                        {replayTimeMs}ms {cacheHitsDuringReplay > 0 ? `· ${isEn ? 'resolved from archive cache' : 'آرکائیو کیش سے حاصل'} (+${cacheHitsDuringReplay} hits)` : `· ${isEn ? 'live fetch (now cached)' : 'لائیو فیچ (اب کیش)'}`}
                      </span>
                    </div>
                    {replay.kpis.length > 0 && (
                      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                        {replay.kpis.slice(0, 4).map(k => (
                          <span key={k.id} style={{ color: 'var(--text-main)', fontSize: 12 }}>
                            <strong>{typeof k.value === 'number' ? k.value.toLocaleString() : k.value}</strong> {k.unit} <span style={{ color: 'var(--text-muted)' }}>· {isEn ? k.label : k.labelUr}</span>
                          </span>
                        ))}
                      </div>
                    )}
                    <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>
                      {isEn ? 'Records' : 'ریکارڈز'}: {replay.register?.totalCount ?? 0} · {isEn ? 'Engine' : 'انجن'}: {replay.engineType}
                    </span>
                  </div>
                )}
              </div>

              {/* Snapshot capture */}
              <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-main)', borderRadius: 10, padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-main)' }}>
                    {isEn ? 'Immutable snapshots' : 'غیر تبدیل پذیر سنیپ شاٹس'}
                  </span>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      onClick={captureCurrentWindow}
                      disabled={capturing}
                      style={{ background: 'var(--color-accent)', color: '#fff', border: 'none', borderRadius: 6, padding: '6px 14px', cursor: 'pointer', fontWeight: 700, fontSize: 12, opacity: capturing ? 0.6 : 1 }}
                    >
                      {capturing ? '…' : `📸 ${isEn ? 'Capture current window' : 'موجودہ مدت محفوظ کریں'}`}
                    </button>
                    {snapshots.length > 0 && (
                      <button onClick={clearSnapshots} style={{ background: 'var(--bg-app)', border: '1px solid var(--border-main)', borderRadius: 6, padding: '6px 12px', cursor: 'pointer', fontSize: 12, color: 'var(--color-danger)' }}>
                        {isEn ? 'Clear' : 'صاف کریں'}
                      </button>
                    )}
                  </div>
                </div>

                {snapshots.length === 0 ? (
                  <p style={{ margin: 0, fontSize: 12, color: 'var(--text-muted)' }}>
                    {isEn
                      ? 'No snapshots yet. Capture the current window to freeze a verified state that can be replayed any time — even years later.'
                      : 'ابھی کوئی سنیپ شاٹ نہیں۔ تصدیق شدہ حالت منجمد کرنے کے لیے موجودہ مدت محفوظ کریں۔'}
                  </p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 220, overflowY: 'auto' }}>
                    {snapshots.map(s => (
                      <div key={s.id} style={{ background: 'var(--bg-app)', border: '1px solid var(--border-subtle)', borderRadius: 8, padding: '10px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                          <span style={{ fontSize: 13, color: 'var(--text-main)', fontWeight: 600 }}>
                            {s.reportId} · {s.windowLabel}
                            <span style={{ marginLeft: 8, fontSize: 10, fontWeight: 700, color: s.dataQuality === 'VERIFIED' ? 'var(--color-success)' : 'var(--text-muted)', background: `${s.dataQuality === 'VERIFIED' ? 'var(--color-success)' : 'var(--text-muted)'}14`, padding: '1px 7px', borderRadius: 8 }}>
                              {s.dataQuality}
                            </span>
                          </span>
                          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                            {s.kpis.slice(0, 2).map(k => `${k.label}: ${typeof k.value === 'number' ? k.value.toLocaleString() : k.value} ${k.unit}`).join(' · ')}
                            {s.registerCount > 0 ? ` · ${isEn ? 'Records' : 'ریکارڈز'}: ${s.registerCount}` : ''}
                          </span>
                          <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                            {isEn ? 'Captured' : 'محفوظ'}: {new Date(s.capturedAt).toLocaleString()} · {isEn ? 'Station' : 'اسٹیشن'}: {s.stationId}
                          </span>
                        </div>
                        <button onClick={() => replaySnapshot(s)} style={{ background: 'var(--bg-app)', border: '1px solid var(--border-main)', borderRadius: 6, padding: '5px 12px', cursor: 'pointer', fontSize: 12, color: 'var(--color-accent)', fontWeight: 600 }}>
                          {isEn ? 'Replay' : 'ری پلے'}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Archive stats footer */}
        <div style={{ padding: '12px 24px', borderTop: '1px solid var(--border-main)', background: 'var(--bg-app)', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, fontSize: 11, color: 'var(--text-muted)' }}>
          <span>{isEn ? 'Archive window cache' : 'آرکائیو ونڈو کیش'}: <strong style={{ color: 'var(--text-main)' }}>{stats.cachedWindows}</strong></span>
          <span>{isEn ? 'Cache hits' : 'کیش ہٹس'}: <strong style={{ color: 'var(--color-success)' }}>{stats.hits}</strong> · {isEn ? 'Misses' : 'مِسز'}: <strong>{stats.misses}</strong> · {isEn ? 'Evictions' : 'ایویکشنز'}: <strong>{stats.evictions}</strong></span>
          <span>{isEn ? 'Snapshots' : 'سنیپ شاٹس'}: <strong style={{ color: 'var(--text-main)' }}>{stats.snapshots}</strong></span>
        </div>
      </div>
    </div>
  );
}
