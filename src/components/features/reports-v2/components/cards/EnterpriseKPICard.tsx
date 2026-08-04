/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * FuelPro Enterprise Reports Platform v2.0
 * Phase 1.3 — Enterprise Component Library Framework
 *
 * Enterprise KPI Card Framework.
 * Pure UI Framework. No business logic.
 */

import React from 'react';
import { EnterpriseComponentRegistry } from '../EnterpriseComponentRegistry';

EnterpriseComponentRegistry.getInstance().register({
  id: 'ECL-KPI-CARD',
  version: '1.0.0',
  owner: 'ECL Core Team',
  category: 'CARD',
  status: 'PRODUCTION',
  accessibility: 'WCAG_AA',
  themeSupport: true
});

export interface EnterpriseKPICardProps {
  title: string;
  primaryValue: string;
  secondaryValue?: string;
  trend?: 'UP' | 'DOWN' | 'NEUTRAL';
  trendValue?: string;
  target?: string;
  achievementPercent?: number;
  status?: 'SUCCESS' | 'WARNING' | 'CRITICAL' | 'NEUTRAL';
  lastRefresh?: string;
  badges?: ('AI' | 'AUDIT' | 'FORMULA')[];
  onDrilldown?: () => void;
  onExport?: () => void;
  sparklineData?: number[]; // Placeholder array
}

export function EnterpriseKPICard({
  title,
  primaryValue,
  secondaryValue,
  trend,
  trendValue,
  target,
  achievementPercent,
  status = 'NEUTRAL',
  lastRefresh,
  badges = [],
  onDrilldown,
  onExport,
  sparklineData
}: EnterpriseKPICardProps) {
  
  const getStatusColor = () => {
    switch (status) {
      case 'SUCCESS': return 'var(--color-success)';
      case 'WARNING': return 'var(--color-warning)';
      case 'CRITICAL': return 'var(--color-error)';
      default: return 'var(--text-main)';
    }
  };

  return (
    <div style={{
      backgroundColor: 'var(--bg-card)',
      border: '1px solid var(--border-main)',
      borderRadius: 'var(--radius-lg, 12px)',
      padding: 'var(--spacing-lg, 20px)',
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--spacing-md, 12px)',
      boxShadow: 'var(--shadow-sm)',
      position: 'relative'
    }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h4 style={{ margin: 0, fontSize: 14, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
          {title}
        </h4>
        <div style={{ display: 'flex', gap: 4 }}>
          {badges.map(b => (
            <span key={b} style={{ fontSize: 10, padding: '2px 6px', backgroundColor: 'var(--bg-subtle)', borderRadius: 12, fontWeight: 'bold' }}>
              {b}
            </span>
          ))}
        </div>
      </div>

      {/* Primary Value */}
      <div style={{ fontSize: 32, fontWeight: 800, color: getStatusColor(), fontFamily: 'monospace' }}>
        {primaryValue}
      </div>

      {/* Secondary & Trend */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13 }}>
        {secondaryValue && <span style={{ color: 'var(--text-muted)' }}>{secondaryValue}</span>}
        {trendValue && (
          <div style={{ 
            display: 'flex', alignItems: 'center', gap: 4,
            color: trend === 'UP' ? 'var(--color-success)' : trend === 'DOWN' ? 'var(--color-error)' : 'var(--text-muted)'
          }}>
            <span>{trend === 'UP' ? '▲' : trend === 'DOWN' ? '▼' : '▬'}</span>
            <span style={{ fontWeight: 600 }}>{trendValue}</span>
          </div>
        )}
      </div>

      {/* Target & Achievement Progress Bar */}
      {target !== undefined && achievementPercent !== undefined && (
        <div style={{ marginTop: 8 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>
            <span>Target: {target}</span>
            <span>{achievementPercent}%</span>
          </div>
          <div style={{ height: 6, backgroundColor: 'var(--bg-subtle)', borderRadius: 3, overflow: 'hidden' }}>
            <div style={{ 
              height: '100%', 
              width: `${Math.min(100, achievementPercent)}%`, 
              backgroundColor: achievementPercent >= 100 ? 'var(--color-success)' : 'var(--color-accent)'
            }} />
          </div>
        </div>
      )}

      {/* Sparkline Placeholder */}
      {sparklineData && sparklineData.length > 0 && (
        <div style={{ height: 40, width: '100%', marginTop: 8, display: 'flex', alignItems: 'flex-end', gap: 2 }}>
          {sparklineData.map((val, i) => (
            <div key={i} style={{ flex: 1, backgroundColor: 'var(--bg-subtle)', height: `${Math.min(100, val)}%`, borderRadius: '2px 2px 0 0' }} />
          ))}
        </div>
      )}

      {/* Footer Actions */}
      <div style={{ 
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
        marginTop: 'auto', paddingTop: 12, borderTop: '1px solid var(--border-main)', fontSize: 11, color: 'var(--text-muted)' 
      }}>
        <span>{lastRefresh ? `Updated: ${lastRefresh}` : 'Live Data'}</span>
        <div style={{ display: 'flex', gap: 8 }}>
          {onExport && <button onClick={onExport} style={{ background: 'none', border: 'none', cursor: 'pointer' }} title="Export">📤</button>}
          {onDrilldown && <button onClick={onDrilldown} style={{ background: 'none', border: 'none', cursor: 'pointer' }} title="Drilldown">🔍</button>}
        </div>
      </div>
    </div>
  );
}
