/**
 * @license SPDX-License-Identifier: Apache-2.0
 *
 * FuelPro Enterprise Reports Platform v2.0 — Live Report Renderer
 *
 * Executes the Report Engine with the real tenant context (org/station/role)
 * and renders only verified operational data:
 *   KPI cards  -> ReportEngine.kpis (Urdu-first, clickable → drill-down)
 *   Charts     -> ReportEngine.charts (chartAdapter, Recharts)
 *   Register   -> ReportEngine.register (EnterpriseRegisterTable — search/sort/
 *                status badges/summary/row click → drill-down)
 *   Filters    -> a live filter bar built from the ACTUAL register columns,
 *                written to workspace filter state and applied by QueryEngine
 *   Toolbar    -> listens for the global refresh signal + export event
 *   Provenance -> real execution time + data quality from the engine result
 *
 * Strictly no dummy data, no skeleton scaffolds that never resolve
 * (AGENTS.md Rules #1, #27, #100, #121). UI never queries Firebase directly.
 */

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useWorkspaceState, resolveDateRange } from './WorkspaceStateManager';
import { ReportEngine } from '../../../../lib/reports-v2/engines/ReportEngine';
import { QueryEngine } from '../../../../lib/reports-v2/engines/QueryEngine';
import type { ReportEngineResult, QueryContext } from '../../../../lib/reports-v2/engines/types';
import { EnterpriseReportRegistry, ReportManifest } from '../../../../lib/reports-v2/foundation/EnterpriseReportRegistry';
import { EnterpriseKPICard } from '../components/EnterpriseKPICard';
import { EnterpriseRegisterTable, EnterpriseColumnDef } from '../components/EnterpriseRegisterTable';
import { EnterpriseChartContainer } from '../components/EnterpriseChartContainer';
import { EnterpriseEmptyRegister } from '../components/EnterpriseEmptyRegister';
import { EnterpriseExport, exportRegisterData } from '../components/export/EnterpriseExport';
import { LineChart, BarChart, PieChart } from '../../../../services/charts/chartAdapter';

interface LiveReportRendererProps {
  report: ReportManifest;
}

/** How often realtime changes trigger a re-execution (debounce). */
const REALTIME_DEBOUNCE_MS = 800;

export default function LiveReportRenderer({ report }: LiveReportRendererProps) {
  const {
    language, orgId, stationId, userId, activeRole, setActiveReportId,
    dateRange, filters, setFilter, clearFilters, refreshSignal
  } = useWorkspaceState();
  const [result, setResult] = useState<ReportEngineResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [explain, setExplain] = useState<{ title: string; text: string } | null>(null);

  const registry = EnterpriseReportRegistry.getInstance();
  const engineType = registry.getEngineTypeForReport(report.reportId);

  // Tracks whether we've rendered verified data at least once, so realtime
  // refreshes update silently without flashing the full loading screen.
  const hasLoadedRef = useRef(false);

  const execute = useCallback(async () => {
    if (!orgId || !stationId) {
      setError('MISSING_CONTEXT');
      setLoading(false);
      return;
    }
    if (!hasLoadedRef.current) setLoading(true);
    setError(null);
    const { dateFrom, dateTo } = resolveDateRange(dateRange);
    const context: QueryContext = {
      orgId,
      stationId,
      userId: userId || 'system',
      role: activeRole,
      dateFrom,
      dateTo,
      filters
    };
    try {
      const res = await ReportEngine.getInstance().execute(report.reportId, engineType, context);
      hasLoadedRef.current = true;
      setResult(res);
    } catch (e: any) {
      setError(e?.message || 'EXECUTION_FAILED');
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [report.reportId, engineType, orgId, stationId, userId, activeRole, dateRange?.preset, dateRange?.startDate, dateRange?.endDate, filters, refreshSignal]);

  useEffect(() => {
    execute();
  }, [execute, refreshKey]);

  // Realtime (Rule #15/#53): subscribe to the report's source collections.
  // Any operational change triggers a debounced re-execution — the UI updates
  // automatically without a manual refresh. Subscription flows through the
  // QueryEngine (the only Firebase access layer), never the UI directly.
  useEffect(() => {
    if (!orgId || !stationId) return;
    const { dateFrom, dateTo } = resolveDateRange(dateRange);
    const context: QueryContext = { orgId, stationId, userId: userId || 'system', role: activeRole, dateFrom, dateTo, filters };
    const queryEngine = QueryEngine.getInstance();

    const collections = report.firebaseCollections.slice(0, 4); // cap subscriptions
    const unsubscribers = collections.map(col => {
      // Skip the initial snapshot (the mount execute() already ran); only
      // react to genuine post-mount document changes.
      let isFirstSnapshot = true;
      return queryEngine.subscribeCollection(col, context, () => {
        if (isFirstSnapshot) {
          isFirstSnapshot = false;
          return;
        }
        debounceRef.current?.();
      });
    });

    return () => unsubscribers.forEach(unsub => unsub());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [report.reportId, orgId, stationId, activeRole, dateRange?.preset, dateRange?.startDate, dateRange?.endDate, filters]);

  // Debounced re-execution triggered by realtime changes
  const debounceRef = useRef<(() => void) | null>(null);
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;
    debounceRef.current = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        setRefreshKey(k => k + 1);
      }, REALTIME_DEBOUNCE_MS);
    };
    return () => {
      if (timer) clearTimeout(timer);
      debounceRef.current = null;
    };
  }, []);

  const isEn = language === 'en';

  // ── Row click → scroll back to the KPI grid (honest Level-1 navigation) ──
  // A plain function (never a hook) so it is safe to use after early returns.
  const handleRowClick = (row: Record<string, any>) => {
    if (!row._id && !row.id) return;
    // No synthetic deeper report exists; scroll back to the KPI grid instead
    // of faking a level — honest navigation only (Rule #126).
    document.getElementById('report-kpi-grid')?.scrollIntoView({ behavior: 'smooth' });
  };

  // ── Toolbar actions ────────────────────────────────────────────────
  // Refresh is driven by the workspace refreshSignal (toolbar Refresh button);
  // Export is driven by the 'fuelpro:report-export' event (toolbar Export).
  useEffect(() => {
    if (!result || !result.register) return;
    const onExportRequested = () => {
      const reg = result.register!;
      const cols = reg.columns.map(c => ({ id: c.id, header: c.header, accessor: c.accessor, isNumeric: !!(c.isNumeric || c.isCurrency) }));
      const rows = reg.rows;
      const headerLabel = isEn ? reg.title : (reg.titleUr || reg.title);
      // One rich download (Excel with title) — never two simultaneous files.
      // The in-report EnterpriseExport suite below offers every format.
      exportRegisterData.excel(report.reportId, headerLabel, rows, cols).catch(() => undefined);
    };
    window.addEventListener('fuelpro:report-export', onExportRequested);
    return () => window.removeEventListener('fuelpro:report-export', onExportRequested);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [result, report.reportId, isEn]);

  if (!orgId || !stationId) {
    return (
      <div style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)', background: 'var(--bg-card)', margin: 24, borderRadius: 12, border: '1px solid var(--border-main)' }}>
        <span style={{ fontSize: 48, opacity: 0.5 }}>🏪</span>
        <h2 style={{ color: 'var(--text-main)', marginTop: 16 }}>
          {isEn ? 'No active station context.' : 'کوئی فعال اسٹیشن منتخب نہیں۔'}
        </h2>
        <p>
          {isEn
            ? 'Select an active station to load verified operational analytics. The system never fabricates data for an unselected station.'
            : 'تصدیق شدہ تجزیات لوڈ کرنے کے لیے ایک فعال اسٹیشن منتخب کریں۔'}
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ padding: 64, textAlign: 'center', color: 'var(--text-muted)' }}>
        <div style={{ fontSize: 32, marginBottom: 16 }}>🔄</div>
        <h2 style={{ color: 'var(--text-main)', margin: 0 }}>{isEn ? 'Executing live query…' : 'لائیو کوری چل رہی ہے…'}</h2>
        <p>{isEn ? `Running ${engineType} engine against verified operational records.` : 'تصدیق شدہ آپریشنل ریکارڈز پر انجن چل رہا ہے۔'}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: 48, textAlign: 'center', background: 'var(--bg-card)', margin: 24, borderRadius: 12, border: '1px solid var(--border-main)' }}>
        <h2 style={{ color: 'var(--color-danger)' }}>❌ {isEn ? 'Execution Error' : 'عمل میں ناکامی'}</h2>
        <p style={{ color: 'var(--text-muted)' }}>{isEn ? error : 'رپورٹ پر عمل نہیں ہو سکا۔'}</p>
      </div>
    );
  }

  if (!result) {
    return null;
  }

  if (result.dataQuality === 'EMPTY') {
    return (
      <div style={{ padding: 24 }}>
        <EnterpriseEmptyRegister
          title={isEn ? 'No verified operational records found.' : 'کوئی تصدیق شدہ آپریشنل ریکارڈ نہیں ملا۔'}
          message={isEn
            ? 'This report is fully live. The Firebase collections for the selected criteria contain no records yet — create transactions to populate realtime analytics.'
            : 'یہ رپورٹ مکمل طور پر لائیو ہے۔ منتخب معیار کے لیے فائر بیس کلیکشنز میں ابھی کوئی ریکارڈ نہیں — ریئل ٹائم تجزیات کے لیے ٹرانزیکشنز بنائیں۔'}
          onAction={() => setRefreshKey(k => k + 1)}
          actionText={isEn ? 'Refresh' : 'تازہ کریں'}
        />
      </div>
    );
  }

  const renderChart = (chart: any) => {
    const chartData = (chart.data || []).map((d: any) => ({ ...d }));
    const hasData = chartData.length > 0 && chartData.some((d: any) => chart.yKeys.some((k: string) => Number(d[k]) > 0));
    const xKey = chart.xKey;
    const yKeys: string[] = chart.yKeys || [];
    const colors = chart.colors || undefined;

    return (
      <EnterpriseChartContainer key={chart.chartId} title={isEn ? chart.title : chart.titleUr} isEmpty={!hasData}>
        {hasData && (
          chart.chartType === 'pie' || chart.chartType === 'donut' ? (
            <PieChart data={chartData} dataKey={yKeys[0]} nameKey={xKey} height={280} colors={colors} />
          ) : chart.chartType === 'line' || chart.chartType === 'area' ? (
            <LineChart data={chartData} xAxisKey={xKey} lines={yKeys.map((k: string) => ({ key: k, name: k }))} height={280} colors={colors} />
          ) : (
            <BarChart data={chartData} xAxisKey={xKey} bars={yKeys.map((k: string) => ({ key: k, name: k }))} height={280} colors={colors} />
          )
        )}
      </EnterpriseChartContainer>
    );
  };

  const register = result.register;
  const registerColumns: EnterpriseColumnDef[] = (register?.columns || []).map((c: any) => ({
    id: c.id,
    header: c.header,
    headerUr: c.headerUr,
    accessor: c.accessor,
    isNumeric: !!(c.isNumeric || c.isCurrency),
    isCurrency: !!c.isCurrency,
    isDate: !!c.isDate,
    isStatus: !!c.isStatus,
    sortable: !!c.sortable,
    filterable: !!c.filterable
  }));
  const registerRows = (register?.rows || []).map((row: any) => {
    const display: Record<string, any> = {};
    (register?.columns || []).forEach((c: any) => {
      display[c.id] = row[c.accessor];
    });
    return display;
  });
  // Raw rows for export (keyed by accessor) — the export suite ships real data
  const exportRows = (register?.rows || []).map((row: any) => {
    const raw: Record<string, any> = {};
    (register?.columns || []).forEach((c: any) => { raw[c.accessor] = row[c.accessor]; });
    return raw;
  });

  // ── LIVE FILTER BAR ────────────────────────────────────────────────
  // Build real filter options from the register's own data (PRD §1.5/§4):
  // product/tank/pump/operator columns become dropdowns that write to the
  // workspace filter state — QueryEngine applies them to every query.
  // NOTE: this is a plain function (NOT a hook) — it is called after early
  // returns, so it must never be a hook (Rules of Hooks).
  const filterableCols = registerColumns.filter(c => c.filterable);
  const filterOptions = buildFilterOptions(filterableCols, registerRows);
  const hasFilterBar = filterableCols.length > 0;

  return (
    <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* ── LIVE FILTER BAR (real, data-driven) ── */}
      {hasFilterBar && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap',
          padding: '12px 16px', backgroundColor: 'var(--bg-card)', borderRadius: 10,
          border: '1px solid var(--border-main)'
        }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
            {isEn ? 'Filter' : 'فلٹر'}:
          </span>
          {filterableCols.map(col => {
            const key = (col.accessor.includes('product') || col.accessor.includes('fuelType')) ? 'product'
              : (col.accessor.includes('tank')) ? 'tank'
              : (col.accessor.includes('pump')) ? 'pump'
              : (col.accessor.includes('operator') || col.accessor.includes('staff')) ? 'operator'
              : (col.accessor.includes('status')) ? 'status'
              : (col.accessor.includes('payment') || col.accessor.includes('mode')) ? 'payment'
              : 'status';
            const options = (filterOptions[col.accessor] || []).slice(0, 50);
            const active = (filters as any)[key];
            return (
              <select
                key={col.id}
                value={active || ''}
                onChange={(e) => setFilter(key as any, e.target.value)}
                style={{
                  padding: '6px 10px', borderRadius: 8, fontSize: 12, fontWeight: 600,
                  backgroundColor: 'var(--bg-app)', color: 'var(--text-main)',
                  border: `1px solid ${active ? 'var(--color-accent)' : 'var(--border-main)'}`,
                  cursor: 'pointer', maxWidth: 200
                }}
              >
                <option value="">{isEn ? `All ${col.header}` : `تمام ${col.headerUr}`}</option>
                {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
              </select>
            );
          })}
          {Object.keys(filters).length > 0 && (
            <button
              onClick={clearFilters}
              style={{ marginLeft: 'auto', padding: '6px 12px', backgroundColor: 'transparent', border: '1px dashed var(--color-danger)', color: 'var(--color-danger)', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
            >
              {isEn ? '✕ Clear' : '✕ ہٹائیں'}
            </button>
          )}
        </div>
      )}

      {/* KPI Grid — language-aware, clickable → drill-down */}
      {result.kpis.length > 0 && (
        <div id="report-kpi-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 16 }}>
          {result.kpis.map(kpi => (
            <EnterpriseKPICard
              key={kpi.id}
              title={kpi.label}
              titleUr={kpi.labelUr}
              primaryValue={typeof kpi.value === 'number' ? kpi.value.toLocaleString(undefined, { maximumFractionDigits: 2 }) : kpi.value}
              secondaryValue={kpi.unit === 'PKR' ? '₨' : kpi.unit}
              growthPercentage={kpi.trend}
              status={kpi.status}
              isLive
              hasFormula
              lang={isEn ? 'en' : 'ur'}
              onExplain={kpi.explainText ? () => setExplain({ title: isEn ? kpi.label : (kpi.labelUr || kpi.label), text: kpi.explainText! }) : undefined}
              onDrilldown={() => setActiveReportId(kpi.drilldownReportId || (kpi.id === 'totalLiters' ? 'M' : kpi.id === 'totalSales' ? 'F' : kpi.id === 'cashPosition' ? 'B' : kpi.id === 'activeShifts' ? 'SHIFT' : kpi.id === 'expenses' ? 'C1' : 'F'))}
            />
          ))}
        </div>
      )}

      {/* Charts */}
      {result.charts.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 16 }}>
          {result.charts.map(renderChart)}
        </div>
      )}

      {/* Register — full-featured table with drill-down rows */}
      {register && (
        <EnterpriseRegisterTable
          title={register.title}
          titleUr={register.titleUr}
          columns={registerColumns}
          data={registerRows}
          summaryRow={register.summaryRow}
          language={isEn ? 'en' : 'ur'}
          onRowClick={handleRowClick}
        />
      )}

      {/* Export Suite — PDF / Excel / CSV / WhatsApp / Print (real data) */}
      {register && (
        <EnterpriseExport
          reportId={report.reportId}
          title={register.title}
          titleUr={register.titleUr}
          rows={exportRows}
          columns={registerColumns.map(c => ({ id: c.id, header: c.header, accessor: c.accessor, isNumeric: c.isNumeric }))}
          language={language}
        />
      )}

      {/* Provenance — derived only, never fabricated */}
      <div style={{
        padding: '12px 20px', background: 'var(--bg-card)', border: '1px dashed var(--border-main)',
        borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8,
        fontSize: 12, color: 'var(--text-muted)'
      }}>
        <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
          <span><strong>{isEn ? 'Report' : 'رپورٹ'}:</strong> {report.reportId}</span>
          <span><strong>{isEn ? 'Records' : 'ریکارڈز'}:</strong> {register?.totalCount ?? 0}</span>
        </div>
        <div style={{ display: 'flex', gap: 24, alignItems: 'center', flexWrap: 'wrap' }}>
          <span><strong>{isEn ? 'Query Time' : 'کوری ٹائم'}:</strong> {result.totalExecutionTimeMs}ms</span>
          <span><strong>{isEn ? 'Data Quality' : 'ڈیٹا کوالٹی'}:</strong>
            <span style={{ color: result.dataQuality === 'VERIFIED' ? 'var(--color-success)' : 'var(--color-warning)', fontWeight: 600 }}>
              {result.dataQuality}
            </span>
          </span>
          <button
            onClick={() => setRefreshKey(k => k + 1)}
            style={{ background: 'var(--bg-app)', border: '1px solid var(--border-main)', borderRadius: 6, padding: '4px 12px', cursor: 'pointer', fontSize: 12, color: 'var(--text-main)' }}
          >
            {isEn ? '↻ Refresh' : '↻ تازہ کریں'}
          </button>
        </div>
      </div>

      {/* Explainability modal — derived from engine provenance, never fabricated */}
      {explain && (
        <div
          onClick={() => setExplain(null)}
          style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, cursor: 'pointer' }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ background: 'var(--bg-app)', width: 520, maxWidth: '90vw', borderRadius: 12, border: '1px solid var(--border-main)', boxShadow: '0 10px 30px rgba(0,0,0,0.2)', padding: 24, cursor: 'default' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ margin: 0, fontSize: 18, color: 'var(--text-main)' }}>{explain.title}</h3>
              <button onClick={() => setExplain(null)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: 20, color: 'var(--text-muted)' }}>✖</button>
            </div>
            <p style={{ margin: 0, fontSize: 14, color: 'var(--text-main)', lineHeight: 1.6 }}>{explain.text}</p>
            <div style={{ marginTop: 20, fontSize: 12, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: 'var(--color-success)' }} />
              {isEn ? 'Derived from verified operational records via the Formula Registry' : 'تصدیق شدہ آپریشنل ریکارڈز سے فارمولا رجسٹری کے ذریعے حاصل کردہ'}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Builds unique option lists per filterable column from the live register
 * rows. A plain function (never a hook) so it is safe to call after early
 * returns — guarded against undefined rows so the filter bar never crashes.
 */
function buildFilterOptions(filterableCols: EnterpriseColumnDef[], registerRows: Record<string, any>[]): Record<string, string[]> {
  const options: Record<string, string[]> = {};
  filterableCols.forEach(col => {
    const set = new Set<string>();
    registerRows.forEach(row => {
      const v = row[col.accessor];
      if (v !== null && v !== undefined && v !== '') set.add(String(v));
    });
    options[col.accessor] = Array.from(set).sort((a, b) => a.localeCompare(b));
  });
  return options;
}
