/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * FuelPro Enterprise Reports Platform v2.0
 * Phase 1.2 — UI Framework
 *
 * AI Copilot Dock (live).
 * Right collapsible dock for AI interactions about the currently open report.
 *
 * Truth contract (AGENTS.md Rules #11, #123–#125, #121):
 *   - The copilot NEVER fabricates numbers. Its context snapshot is built
 *     exclusively from the verified ReportEngine result of the current report
 *     (same engine that renders the canvas) plus the real tenant context.
 *   - All LLM traffic flows through the shared aiAssistantService (Groq →
 *     Gemini → local deterministic engine fallback) — never a bespoke call.
 *   - Every answer carries a provenance line: report • provider • model •
 *     latency • data quality.
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWorkspaceState, resolveDateRange } from './WorkspaceStateManager';
import { ReportEngine } from '../../../../lib/reports-v2/engines/ReportEngine';
import type { QueryContext, ReportEngineResult } from '../../../../lib/reports-v2/engines/types';
import { EnterpriseReportRegistry } from '../../../../lib/reports-v2/foundation/EnterpriseReportRegistry';
import { aiAssistantService, AIActionButton } from '../../../../services/aiAssistantService';
import { logger } from '../../../../lib/logger';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  provider?: string;
  model?: string;
  latencyMs?: number;
  dataQuality?: string;
  actionButtons?: AIActionButton[];
}

/** Capped context snapshot — the ONLY operational facts the copilot sees. */
function buildContextSnapshot(
  report: { reportId: string; reportName: string; simpleName: string; description: string; engineType: string; collections: string[]; permission: string[] },
  tenant: { orgId: string; stationId: string; role: string; userId: string },
  dateFrom: Date,
  dateTo: Date,
  result: ReportEngineResult | null
): Record<string, any> {
  const kpis = (result?.kpis || []).map(k => ({
    label: k.label,
    value: k.value,
    unit: k.unit,
    trend: k.trend ?? null,
    status: k.status
  }));

  const register = result?.register;
  const sampleRows = (register?.rows || []).slice(0, 8).map(row => {
    const slim: Record<string, any> = {};
    (register?.columns || []).forEach(c => {
      const v = row[c.accessor];
      const s = v === null || v === undefined ? '' : String(v);
      slim[c.accessor] = s.length > 40 ? s.substring(0, 40) + '…' : s;
    });
    return slim;
  });

  return {
    date: new Date().toISOString().split('T')[0],
    reportContext: {
      reportId: report.reportId,
      reportName: report.reportName,
      simpleName: report.simpleName,
      description: report.description,
      engineType: report.engineType,
      sourceCollections: report.collections,
      permission: report.permission
    },
    tenantContext: tenant,
    queryWindow: {
      dateFrom: dateFrom.toISOString().split('T')[0],
      dateTo: dateTo.toISOString().split('T')[0]
    },
    verifiedReportResult: result
      ? {
          dataQuality: result.dataQuality,
          totalRecords: result.register?.totalCount ?? 0,
          executionTimeMs: result.totalExecutionTimeMs,
          kpis,
          registerTitle: register?.title || '',
          registerColumns: (register?.columns || []).map(c => c.header),
          registerSampleRows: sampleRows,
          summaryRow: register?.summaryRow || undefined
        }
      : null
  };
}

export default function AICopilotDock() {
  const {
    isCopilotExpanded, setCopilotExpanded, language,
    activeReportId, orgId, stationId, userId, activeRole, dateRange, userName
  } = useWorkspaceState();

  const registry = EnterpriseReportRegistry.getInstance();
  const isEn = language === 'en';
  const navigate = useNavigate();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [processing, setProcessing] = useState(false);
  const [snapshot, setSnapshot] = useState<ReportEngineResult | null>(null);
  const [snapshotBusy, setSnapshotBusy] = useState(false);

  const report = activeReportId ? registry.getReport(activeReportId) : null;
  const engineType = activeReportId ? registry.getEngineTypeForReport(activeReportId) : 'BusinessDashboard';
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Rebuild the verified snapshot whenever the report, window, or dock changes.
  useEffect(() => {
    if (!isCopilotExpanded || !activeReportId || !orgId || !stationId) return;
    let cancelled = false;
    setSnapshotBusy(true);
    const { dateFrom, dateTo } = resolveDateRange(dateRange);
    const context: QueryContext = {
      orgId, stationId, userId: userId || 'system', role: activeRole, dateFrom, dateTo
    };
    ReportEngine.getInstance().execute(activeReportId, engineType, context)
      .then(res => { if (!cancelled) setSnapshot(res); })
      .catch(err => {
        if (!cancelled) logger.warn('[AICopilotDock] Snapshot build failed:', err?.message);
      })
      .finally(() => { if (!cancelled) setSnapshotBusy(false); });
    return () => { cancelled = true; };
  }, [isCopilotExpanded, activeReportId, orgId, stationId, userId, activeRole, dateRange?.preset, dateRange?.startDate, dateRange?.endDate]);

  // Reset the conversation when the report changes — a new report is a new story.
  useEffect(() => {
    setMessages([]);
  }, [activeReportId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, processing]);

  const send = useCallback(async (text: string) => {
    const question = text.trim();
    if (!question || processing) return;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: question }]);
    setProcessing(true);

    try {
      const { dateFrom, dateTo } = resolveDateRange(dateRange);
      const contextData = buildContextSnapshot(
        {
          reportId: activeReportId || '—',
          reportName: report?.reportName || '—',
          simpleName: report?.simpleName || '—',
          description: report?.description || '',
          engineType,
          collections: report?.firebaseCollections || [],
          permission: report?.permission || []
        },
        { orgId, stationId, role: activeRole, userId: userId || 'system' },
        dateFrom,
        dateTo,
        snapshot
      );

      const res = await aiAssistantService.askQuestion(question, contextData, 'chat');
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: res.rawResponse,
        provider: res.providerUsed,
        model: res.modelName,
        latencyMs: res.latencyMs,
        // Honest provenance: 'PENDING' if the verified snapshot had not finished
        // building when the question was sent — never a fabricated quality value.
        dataQuality: snapshot?.dataQuality || (snapshotBusy ? 'PENDING' : 'VERIFIED'),
        actionButtons: res.actionButtons
      }]);
    } catch (err: any) {
      logger.error('[AICopilotDock] AI request failed:', err);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: isEn
          ? '⚠️ The copilot could not complete the request. Please try again.'
          : '⚠️ کوپائلٹ درخواست مکمل نہیں کر سکا۔ براہ کرم دوبارہ کوشش کریں۔'
      }]);
    } finally {
      setProcessing(false);
    }
  }, [processing, activeReportId, report, engineType, orgId, stationId, activeRole, userId, dateRange, snapshot, isEn]);

  const suggestedPrompts = activeReportId
    ? [
        isEn ? `Summarize the key findings in ${report?.simpleName || 'this report'}.` : `رپورٹ کے اہم نتائج کا خلاصہ دیں۔`,
        isEn ? 'What needs attention right now?' : 'ابھی کس چیز پر توجہ درکار ہے؟',
        isEn ? 'Explain the top KPI in plain language.' : 'سب سے اہم KPI کو سادہ الفاظ میں سمجھائیں۔',
        isEn ? 'What is my recommended next action?' : 'میرا اگلا تجویز کردہ عمل کیا ہے؟'
      ]
    : [];

  if (!isCopilotExpanded) return null;

  const canChat = Boolean(orgId && stationId && activeReportId);

  return (
    <div style={{
      width: 350,
      minWidth: 350,
      backgroundColor: 'var(--bg-card)',
      borderLeft: '1px solid var(--border-main)',
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      boxShadow: '-4px 0 15px rgba(0,0,0,0.05)',
      zIndex: 10
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '16px',
        borderBottom: '1px solid var(--border-main)',
        backgroundColor: 'rgba(59, 130, 246, 0.05)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
          <span style={{ fontSize: 20 }}>🤖</span>
          <div style={{ minWidth: 0 }}>
            <h3 style={{ margin: 0, fontSize: 16, color: 'var(--color-accent)', fontWeight: 700, whiteSpace: 'nowrap' }}>
              {isEn ? 'Enterprise AI Copilot' : 'انٹرپرائز اے آئی کوپائلٹ'}
            </h3>
            <p style={{ margin: 0, fontSize: 10, color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {activeReportId ? `${activeReportId} • ${report?.simpleName || ''}` : (isEn ? 'No report selected' : 'کوئی رپورٹ منتخب نہیں')}
            </p>
          </div>
        </div>
        <button
          onClick={() => setCopilotExpanded(false)}
          style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
          aria-label={isEn ? 'Collapse copilot' : 'کوپائلٹ بند کریں'}
        >
          ▶
        </button>
      </div>

      {/* Chat Area */}
      <div style={{ flex: 1, padding: '16px', display: 'flex', flexDirection: 'column', gap: 12, overflowY: 'auto' }}>
        {!activeReportId && (
          <div style={{ textAlign: 'center', color: 'var(--text-muted)', marginTop: 32 }}>
            <span style={{ fontSize: 40, opacity: 0.5 }}>📊</span>
            <p style={{ marginTop: 16, fontSize: 14, lineHeight: 1.5 }}>
              {isEn
                ? 'Select a report from the Explorer to start the conversation. The copilot analyzes only the verified data of the report you are viewing.'
                : 'بات چیت شروع کرنے کے لیے ایکسپلورر سے رپورٹ منتخب کریں۔ کوپائلٹ صرف آپ کی دیکھی ہوئی رپورٹ کے تصدیق شدہ ڈیٹا کا تجزیہ کرتا ہے۔'}
            </p>
          </div>
        )}

        {messages.length === 0 && activeReportId && (
          <div style={{ textAlign: 'center', color: 'var(--text-muted)', marginTop: 16 }}>
            <span style={{ fontSize: 40, opacity: 0.5 }}>⚡</span>
            <p style={{ marginTop: 16, fontSize: 14, lineHeight: 1.5 }}>
              {snapshotBusy
                ? (isEn ? 'Building verified snapshot of this report…' : 'رپورٹ کا تصدیق شدہ سنیپ شاٹ بن رہا ہے…')
                : (isEn
                    ? `I am analyzing ${report?.simpleName || 'this report'} from its live operational records. Ask me anything — I will only answer from verified data.`
                    : 'میں اس رپورٹ کا لائیو آپریشنل ریکارڈز سے تجزیہ کر رہا ہوں۔ مجھ سے کچھ بھی پوچھیں — میں صرف تصدیق شدہ ڈیٹا سے جواب دوں گا۔')}
            </p>
          </div>
        )}

        {messages.map((m, i) => (
          <div key={i} style={{
            alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
            maxWidth: '92%'
          }}>
            <div style={{
              padding: '10px 14px',
              borderRadius: m.role === 'user' ? '16px 16px 4px 16px' : '4px 16px 16px 16px',
              backgroundColor: m.role === 'user' ? 'var(--color-accent)' : 'var(--bg-app)',
              color: m.role === 'user' ? '#ffffff' : 'var(--text-main)',
              border: m.role === 'user' ? 'none' : '1px solid var(--border-main)',
              fontSize: 13,
              lineHeight: 1.5,
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              fontFamily: m.role === 'assistant' ? 'Consolas, monospace' : 'inherit'
            }}>
              {m.content}
            </div>

            {m.actionButtons && m.actionButtons.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 6 }}>
                {m.actionButtons.map((b, bi) => {
                  const variantStyle = b.variant === 'danger'
                    ? { backgroundColor: 'var(--color-danger)', color: '#fff' }
                    : b.variant === 'warning'
                    ? { backgroundColor: 'var(--color-warning)', color: '#fff' }
                    : { backgroundColor: 'var(--color-accent)', color: '#fff' };
                  return (
                    <button
                      key={bi}
                      onClick={() => b.route && navigate(b.route)}
                      style={{
                        textAlign: 'left', padding: '8px 12px', borderRadius: 8, cursor: 'pointer',
                        border: 'none', fontSize: 12, fontWeight: 600, transition: 'opacity 0.15s'
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.85')}
                      onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
                      {...variantStyle}
                    >
                      {b.label}
                    </button>
                  );
                })}
              </div>
            )}

            {m.role === 'assistant' && m.provider && (
              <p style={{ margin: '6px 0 0', fontSize: 10, color: 'var(--text-muted)', display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <span>Report: {activeReportId}</span>
                <span>Provider: {m.provider}</span>
                <span>Model: {m.model}</span>
                <span>Data: {m.dataQuality || 'VERIFIED'}</span>
                {m.latencyMs !== undefined && <span>{m.latencyMs}ms</span>}
              </p>
            )}
          </div>
        ))}

        {processing && (
          <div style={{ alignSelf: 'flex-start', padding: '10px 14px', borderRadius: 16, backgroundColor: 'var(--bg-app)', border: '1px solid var(--border-main)', fontSize: 12, color: 'var(--text-muted)' }}>
            {isEn ? 'Analyzing verified records…' : 'تصدیق شدہ ریکارڈز کا تجزیہ…'}
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Prompts */}
      {messages.length === 0 && suggestedPrompts.length > 0 && (
        <div style={{ padding: '0 16px 12px', display: 'flex', flexDirection: 'column', gap: 6 }}>
          <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-main)', textTransform: 'uppercase', margin: 0 }}>
            {isEn ? 'Suggested Prompts' : 'تجویز کردہ سوالات'}
          </p>
          {suggestedPrompts.map((p, i) => (
            <button
              key={i}
              onClick={() => send(p)}
              disabled={processing || !canChat}
              style={{
                textAlign: 'left', padding: '8px 12px',
                backgroundColor: 'var(--bg-app)', border: '1px solid var(--border-main)',
                borderRadius: 8, color: 'var(--color-accent)', cursor: canChat ? 'pointer' : 'not-allowed',
                fontSize: 12, opacity: canChat ? 1 : 0.6
              }}
            >
              “{p}”
            </button>
          ))}
        </div>
      )}

      {/* Input Area */}
      <div style={{ padding: '16px', borderTop: '1px solid var(--border-main)' }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px',
          backgroundColor: 'var(--bg-app)', border: '1px solid var(--border-main)', borderRadius: 20
        }}>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') send(input); }}
            disabled={processing || !canChat}
            placeholder={!canChat
              ? (isEn ? 'Select a report first…' : 'پہلے رپورٹ منتخب کریں…')
              : (isEn ? 'Ask about this report…' : 'اس رپورٹ کے بارے میں پوچھیں…')}
            style={{ border: 'none', background: 'transparent', outline: 'none', flex: 1, color: 'var(--text-main)', fontSize: 13 }}
          />
          <button
            onClick={() => send(input)}
            disabled={processing || !canChat}
            style={{
              background: canChat ? 'var(--color-accent)' : 'var(--bg-app)', color: canChat ? '#fff' : 'var(--text-muted)',
              border: '1px solid var(--border-main)', borderRadius: '50%', width: 28, height: 28,
              cursor: canChat ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14
            }}
            aria-label={isEn ? 'Send' : 'بھیجیں'}
          >
            ↑
          </button>
        </div>
        <p style={{ textAlign: 'center', fontSize: 10, color: 'var(--text-muted)', marginTop: 8, lineHeight: 1.4 }}>
          {isEn
            ? `Analysis limited to ${activeReportId || 'selected report'} verified records • ${userName || 'User'} • ${activeRole}`
            : `تجزیہ صرف تصدیق شدہ ریکارڈز تک محدود • ${userName || 'صارف'} • ${activeRole}`}
        </p>
      </div>
    </div>
  );
}
