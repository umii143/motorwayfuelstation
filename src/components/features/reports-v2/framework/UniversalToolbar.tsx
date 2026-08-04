/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * FuelPro Enterprise Reports Platform v2.0
 * Phase 1.2 — UI Framework
 *
 * Universal Toolbar.
 * Every action is REAL (no dead buttons, per AGENTS.md Rule #40):
 *   - Refresh  → re-executes the active report via workspace refresh signal
 *   - Print    → window.print()
 *   - Export   → emits 'fuelpro:report-export' — the active LiveReportRenderer
 *                listens and exports its verified register data (CSV/Excel/PDF)
 *   - Favorite → pins/unpins the active report (db.getReportFavorites, per station)
 *   - Bookmark → same pin store, toggled independently
 *   - History  → opens the Time Machine replay modal
 *   - AI Copilot → toggles the right dock
 */

import React from 'react';
import { useWorkspaceState } from './WorkspaceStateManager';

/** Global export trigger — LiveReportRenderer listens and exports real data. */
export function emitReportExport(): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('fuelpro:report-export'));
  }
}

interface ToolbarActionProps {
  icon: string;
  label: string;
  disabled?: boolean;
  onClick?: () => void;
  active?: boolean;
  title?: string;
}

/** Hoisted outside the component — never created during render (Rules of Hooks). */
function ToolbarAction({ icon, label, disabled = false, onClick, active = false, title }: ToolbarActionProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        padding: '6px 12px',
        border: `1px solid ${active ? 'var(--color-accent)' : 'var(--border-main)'}`,
        borderRadius: 6,
        backgroundColor: active ? 'rgba(59,130,246,0.12)' : (disabled ? 'var(--bg-subtle)' : 'var(--bg-card)'),
        color: disabled ? 'var(--text-muted)' : (active ? 'var(--color-accent)' : 'var(--text-main)'),
        cursor: disabled ? 'not-allowed' : 'pointer',
        fontSize: 13,
        fontWeight: 500,
        opacity: disabled ? 0.6 : 1,
        transition: 'all 0.15s'
      }}
    >
      <span>{icon}</span>
      <span>{label}</span>
    </button>
  );
}

export default function UniversalToolbar() {
  const {
    isCopilotExpanded, setCopilotExpanded, isReplayOpen, setReplayOpen,
    language, activeReportId, requestRefresh, favorites, toggleFavorite, isDeveloperMode, setIsDeveloperMode
  } = useWorkspaceState();

  const isEn = language === 'en';
  const isFavorite = activeReportId ? favorites.includes(activeReportId) : false;
  const hasReport = !!activeReportId;

  const actionProps = (icon: string, label: string, opts: Partial<ToolbarActionProps> = {}): ToolbarActionProps => ({
    icon, label, disabled: !hasReport, ...opts
  });

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '8px 20px',
      backgroundColor: 'var(--bg-app)',
      borderBottom: '1px solid var(--border-main)',
      overflowX: 'auto'
    }}>
      {/* Left Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <ToolbarAction {...actionProps('🔄', isEn ? 'Refresh' : 'تازہ کریں', { onClick: requestRefresh, title: isEn ? 'Re-run the report against live data' : 'لائیو ڈیٹا سے رپورٹ دوبارہ چلائیں' })} />
        <ToolbarAction {...actionProps('🖨️', isEn ? 'Print' : 'پرنٹ', { onClick: () => window.print(), title: isEn ? 'Print this report' : 'رپورٹ پرنٹ کریں' })} />
        <ToolbarAction {...actionProps('📤', isEn ? 'Export' : 'ایکسپورٹ', { onClick: emitReportExport, title: isEn ? 'Export as PDF / Excel / CSV / WhatsApp' : 'پی ڈی ایف / ایکسل / سی ایس وی / واٹس ایپ میں ایکسپورٹ' })} />
        <div style={{ width: 1, height: 16, backgroundColor: 'var(--border-main)', margin: '0 4px' }} />
        <ToolbarAction
          {...actionProps(isFavorite ? '⭐' : '☆', isEn ? (isFavorite ? 'Pinned' : 'Favorite') : (isFavorite ? 'پسندیدہ' : 'پسندیدہ بنائیں'), {
            onClick: () => activeReportId && toggleFavorite(activeReportId),
            active: isFavorite,
            title: isEn ? 'Pin this report to your favorites (saved per station)' : 'رپورٹ کو پسندیدہ میں محفوظ کریں'
          })}
        />
      </div>

      {/* Right Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <ToolbarAction
          {...actionProps('🕰', isEn ? 'History' : 'ہسٹری', {
            onClick: () => setReplayOpen(!isReplayOpen),
            active: isReplayOpen,
            title: isEn ? 'Time Machine — replay any past window (Rules #55/#92)' : 'ٹائم مشین — ماضی کی مدت دوبارہ دیکھیں'
          })}
        />
        <ToolbarAction
          {...actionProps('⚙️', isEn ? 'Dev' : 'ڈیولپر', {
            onClick: () => setIsDeveloperMode(!isDeveloperMode),
            active: isDeveloperMode,
            title: isEn ? 'Developer Mode — diagnostics only, hidden from operators (Rule #126)' : 'ڈیولپر موڈ — صرف تشخیص کے لیے'
          })}
        />
        <div style={{ width: 1, height: 16, backgroundColor: 'var(--border-main)', margin: '0 4px' }} />
        <button
          onClick={() => setCopilotExpanded(!isCopilotExpanded)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '6px 12px',
            border: `1px solid ${isCopilotExpanded ? 'var(--color-accent)' : 'var(--border-main)'}`,
            borderRadius: 6,
            backgroundColor: isCopilotExpanded ? 'rgba(59, 130, 246, 0.1)' : 'var(--bg-card)',
            color: isCopilotExpanded ? 'var(--color-accent)' : 'var(--text-main)',
            cursor: 'pointer',
            fontSize: 13,
            fontWeight: 600,
            transition: 'all 0.2s'
          }}
        >
          <span>🤖</span>
          <span>{isEn ? "AI Copilot" : "اے آئی کوپائلٹ"}</span>
        </button>
      </div>
    </div>
  );
}
