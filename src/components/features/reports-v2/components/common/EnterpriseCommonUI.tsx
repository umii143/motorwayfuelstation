/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * FuelPro Enterprise Reports Platform v2.0
 * Phase 1.3 — Enterprise Component Library Framework
 *
 * Enterprise Common UI Components.
 * Status Badge, Breadcrumb, Filter Chips, Error, Skeleton, Empty.
 */

import React from 'react';
import { EnterpriseComponentRegistry } from '../EnterpriseComponentRegistry';

// Register all common components
['ECL-FILTER-CHIPS', 'ECL-BREADCRUMB', 'ECL-STATUS-BADGE', 'ECL-EMPTY-WIDGET', 'ECL-SKELETON', 'ECL-ERROR-WIDGET'].forEach(id => {
  EnterpriseComponentRegistry.getInstance().register({
    id,
    version: '1.0.0',
    owner: 'ECL Core Team',
    category: 'COMMON',
    status: 'PRODUCTION',
    accessibility: 'WCAG_AA',
    themeSupport: true
  });
});

export function EnterpriseFilterChips({ filters = [] }: { filters?: string[] }) {
  if (filters.length === 0) return null;
  return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
      {filters.map(f => (
        <span key={f} style={{ padding: '4px 8px', borderRadius: 12, backgroundColor: 'var(--bg-subtle)', border: '1px solid var(--border-main)', fontSize: 11, color: 'var(--text-main)' }}>
          {f} <button style={{ marginLeft: 4, background: 'none', border: 'none', cursor: 'pointer', opacity: 0.5 }}>✕</button>
        </span>
      ))}
    </div>
  );
}

export function EnterpriseBreadcrumb({ path = [] }: { path?: string[] }) {
  return (
    <div style={{ display: 'flex', gap: 8, fontSize: 12, color: 'var(--text-muted)' }}>
      {path.map((p, i) => (
        <React.Fragment key={p}>
          <span style={{ fontWeight: i === path.length - 1 ? 600 : 400, color: i === path.length - 1 ? 'var(--text-main)' : 'inherit' }}>{p}</span>
          {i < path.length - 1 && <span>›</span>}
        </React.Fragment>
      ))}
    </div>
  );
}

export function EnterpriseStatusBadge({ status }: { status: 'LIVE' | 'OFFLINE' | 'CERTIFIED' | 'BETA' | 'ARCHIVED' | 'WARNING' | 'CRITICAL' | 'AI_READY' }) {
  const colors: Record<string, string> = {
    LIVE: 'var(--color-success)',
    CERTIFIED: 'var(--color-success)',
    CRITICAL: 'var(--color-error)',
    WARNING: 'var(--color-warning)',
    AI_READY: 'var(--color-accent)'
  };
  return (
    <span style={{ padding: '2px 6px', borderRadius: 4, backgroundColor: colors[status] || 'var(--bg-subtle)', color: colors[status] ? '#fff' : 'var(--text-main)', fontSize: 10, fontWeight: 'bold' }}>
      {status}
    </span>
  );
}

export function EnterpriseEmptyWidget({ message = "No verified operational records found.", suggestions = [] }: any) {
  return (
    <div style={{ textAlign: 'center', padding: 40, backgroundColor: 'var(--bg-card)', border: '1px dashed var(--border-main)', borderRadius: 12 }}>
      <div style={{ fontSize: 40, opacity: 0.3 }}>📭</div>
      <h4 style={{ margin: '16px 0 8px', color: 'var(--text-main)' }}>{message}</h4>
      {suggestions.length > 0 && (
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, color: 'var(--text-muted)', fontSize: 13, display: 'inline-block', textAlign: 'left' }}>
          {suggestions.map((s: string, i: number) => <li key={i} style={{ marginBottom: 4 }}>• {s}</li>)}
        </ul>
      )}
    </div>
  );
}

export function EnterpriseSkeleton({ type = 'CARD' }: { type?: 'CARD' | 'TABLE' | 'CHART' }) {
  return (
    <div style={{ 
      backgroundColor: 'var(--bg-card)', padding: 20, borderRadius: 12, border: '1px solid var(--border-main)',
      animation: 'pulse 1.5s infinite ease-in-out'
    }}>
      <style>{`@keyframes pulse { 0% { opacity: 1; } 50% { opacity: 0.5; } 100% { opacity: 1; } }`}</style>
      <div style={{ height: 16, width: '40%', backgroundColor: 'var(--bg-subtle)', marginBottom: 16, borderRadius: 4 }} />
      {type === 'CARD' && <div style={{ height: 32, width: '60%', backgroundColor: 'var(--bg-subtle)', borderRadius: 4 }} />}
      {type === 'CHART' && <div style={{ height: 200, width: '100%', backgroundColor: 'var(--bg-subtle)', borderRadius: 4 }} />}
      {type === 'TABLE' && [1, 2, 3, 4].map(i => <div key={i} style={{ height: 24, width: '100%', backgroundColor: 'var(--bg-subtle)', marginBottom: 8, borderRadius: 4 }} />)}
    </div>
  );
}

export function EnterpriseErrorWidget({ error }: { error: string }) {
  return (
    <div style={{ padding: 20, backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid var(--color-error)', borderRadius: 8, color: 'var(--color-error)' }}>
      <div style={{ fontWeight: 'bold', marginBottom: 8 }}>Enterprise System Error</div>
      <div style={{ fontSize: 13 }}>{error}</div>
    </div>
  );
}
