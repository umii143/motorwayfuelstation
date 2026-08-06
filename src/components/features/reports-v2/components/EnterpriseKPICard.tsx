/**
 * @license SPDX-License-Identifier: Apache-2.0
 *
 * FuelPro Enterprise Reports Platform v3.0 — Enterprise KPI Card
 *
 * The "big number first" front door of every report (PRD §1.2):
 *  - High readability & zero text overlap guarantee
 *  - Big value, unit, trend arrow vs previous period
 *  - Colorblind-safe status indicator & left accent border
 *  - Clickable card → drilldown navigation (Level 1 → Level 2)
 */

import React from 'react';

export interface EnterpriseKPICardProps {
  title: string;
  titleUr?: string;
  primaryValue: string | number;
  secondaryValue?: string | number;
  previousPeriodValue?: string | number;
  growthPercentage?: number;
  targetValue?: number;
  progressPercentage?: number;
  status?: 'SUCCESS' | 'WARNING' | 'DANGER' | 'NEUTRAL';
  hasFormula?: boolean;
  hasAI?: boolean;
  isLive?: boolean;
  lang?: 'en' | 'ur';
  onExplain?: () => void;
  onDrilldown?: () => void;
  onExport?: () => void;
  isLoading?: boolean;
  isEmpty?: boolean;
  isError?: boolean;
}

const STATUS_STYLE: Record<string, { accent: string; bg: string; text: string; icon: string }> = {
  SUCCESS: { accent: '#10b981', bg: 'rgba(16,185,129,0.06)', text: '#059669', icon: '✓' },
  WARNING: { accent: '#f59e0b', bg: 'rgba(245,158,11,0.06)', text: '#d97706', icon: '⚠' },
  DANGER: { accent: '#ef4444', bg: 'rgba(239,68,68,0.06)', text: '#dc2626', icon: '✕' },
  NEUTRAL: { accent: '#3b82f6', bg: 'rgba(59,130,246,0.05)', text: '#2563eb', icon: '•' }
};

export const EnterpriseKPICard: React.FC<EnterpriseKPICardProps> = ({
  title,
  titleUr,
  primaryValue,
  secondaryValue,
  growthPercentage,
  status = 'NEUTRAL',
  hasFormula,
  hasAI,
  isLive,
  lang = 'en',
  onExplain,
  onDrilldown,
  onExport,
  isLoading,
  isEmpty,
  isError
}) => {
  const isUr = lang === 'ur';

  if (isLoading) {
    return (
      <div className="animate-pulse" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-main)', borderRadius: 16, minHeight: 150, padding: 18, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ width: '45%', height: 12, borderRadius: 6, backgroundColor: 'var(--bg-subtle)' }} />
        <div style={{ width: '75%', height: 26, borderRadius: 8, backgroundColor: 'var(--bg-subtle)' }} />
        <div style={{ width: '55%', height: 10, borderRadius: 6, backgroundColor: 'var(--bg-subtle)' }} />
      </div>
    );
  }

  if (isError) {
    return (
      <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 16, minHeight: 150, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 20, color: 'var(--color-danger)', fontSize: 13, fontWeight: 600 }}>
        <span style={{ fontSize: 22 }}>⚠️</span>
        <span>{isUr ? 'KPI لوڈ کرنے میں خرابی' : 'Error loading KPI'}</span>
      </div>
    );
  }

  if (isEmpty) {
    return (
      <div style={{ backgroundColor: 'var(--bg-card)', border: '1px dashed var(--border-main)', borderRadius: 16, minHeight: 150, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 20, color: 'var(--text-muted)' }}>
        <span style={{ fontSize: 22, opacity: 0.7 }}>📭</span>
        <span style={{ fontSize: 12, fontWeight: 600 }}>{isUr ? 'کوئی آپریشنل ریکارڈ نہیں' : 'No operational records yet'}</span>
      </div>
    );
  }

  const style = STATUS_STYLE[status] || STATUS_STYLE.NEUTRAL;
  const clickable = !!onDrilldown;

  return (
    <div
      onClick={onDrilldown}
      role={clickable ? 'button' : undefined}
      tabIndex={clickable ? 0 : undefined}
      className={clickable ? 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50' : undefined}
      onKeyDown={clickable ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onDrilldown?.(); } } : undefined}
      style={{
        backgroundColor: 'var(--bg-card)',
        border: `1px solid ${style.accent}33`,
        borderLeft: `5px solid ${style.accent}`,
        borderRadius: 16,
        padding: '18px 20px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        cursor: clickable ? 'pointer' : 'default',
        transition: 'all 0.2s ease-in-out',
        backgroundImage: `linear-gradient(135deg, ${style.bg}, transparent 70%)`,
        position: 'relative',
        minHeight: 150,
        justifyContent: 'space-between'
      }}
      onMouseEnter={(e) => {
        if (clickable) {
          e.currentTarget.style.transform = 'translateY(-2px)';
          e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.08)';
        }
      }}
      onMouseLeave={(e) => {
        if (clickable) {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.04)';
        }
      }}
    >
      {/* Top Bar: Icon + Title on Left, Badges on Right */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ color: style.text, fontWeight: 800, fontSize: 15, lineHeight: 1 }}>{style.icon}</span>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-main)', lineHeight: 1.3 }}>
              {isUr ? (titleUr || title) : title}
            </span>
          </div>
        </div>

        {/* Feature Badges */}
        <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
          {isLive && (
            <span style={{ fontSize: '9px', padding: '2px 7px', background: '#059669', color: '#ffffff', borderRadius: 6, fontWeight: 800, letterSpacing: '0.05em' }}>
              LIVE
            </span>
          )}
          {hasAI && (
            <span style={{ fontSize: '9px', padding: '2px 7px', background: '#8b5cf6', color: '#ffffff', borderRadius: 6, fontWeight: 800 }}>
              AI
            </span>
          )}
          {hasFormula && (
            <span style={{ fontSize: '9px', padding: '2px 7px', background: '#2563eb', color: '#ffffff', borderRadius: 6, fontWeight: 800 }}>
              ƒx
            </span>
          )}
        </div>
      </div>

      {/* Main Metric Value & Unit */}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, margin: '4px 0' }}>
        <span style={{ fontSize: 28, fontWeight: 900, color: 'var(--text-main)', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace', letterSpacing: '-0.03em', lineHeight: 1 }}>
          {primaryValue}
        </span>
        {secondaryValue && (
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.02em' }}>
            {secondaryValue}
          </span>
        )}
      </div>

      {/* Trend Percentage Badge */}
      {growthPercentage !== undefined && (
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              padding: '2px 8px',
              borderRadius: 12,
              backgroundColor: growthPercentage >= 0 ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)',
              color: growthPercentage >= 0 ? '#047857' : '#b91c1c',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 3
            }}
          >
            {growthPercentage >= 0 ? '▲' : '▼'} {Math.abs(growthPercentage).toFixed(1)}% vs prev
          </span>
        </div>
      )}

      {/* Bottom Action Footer: Explain Button (Left) | Drilldown Action (Right) */}
      {(onExplain || onDrilldown || onExport) && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingTop: 10,
            marginTop: 4,
            borderTop: '1px solid var(--border-subtle, rgba(0,0,0,0.06))'
          }}
        >
          {onExplain ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onExplain();
              }}
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                fontSize: 12,
                fontWeight: 600,
                color: 'var(--text-muted)',
                padding: 0,
                display: 'flex',
                alignItems: 'center',
                gap: 4
              }}
            >
              <span>🔍</span> {isUr ? 'وضاحت' : 'Explain'}
            </button>
          ) : (
            <span />
          )}

          {onDrilldown && (
            <span
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: style.accent,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4
              }}
            >
              {isUr ? 'تفصیل' : 'Tap for detail'} <span style={{ fontSize: 14 }}>→</span>
            </span>
          )}
        </div>
      )}
    </div>
  );
};
