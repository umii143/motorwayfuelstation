/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * FuelPro Enterprise Reports Platform v2.0
 * Phase 1.3 — Enterprise Component Library Framework
 *
 * Enterprise Chart Container.
 * Wraps charts with standard toolbars (Export, Fullscreen).
 */

import React from 'react';
import { EnterpriseComponentRegistry } from '../EnterpriseComponentRegistry';

EnterpriseComponentRegistry.getInstance().register({
  id: 'ECL-CHART-CONTAINER',
  version: '1.0.0',
  owner: 'ECL Core Team',
  category: 'CHART',
  status: 'PRODUCTION',
  accessibility: 'WCAG_AA',
  themeSupport: true
});

export interface EnterpriseChartContainerProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  onExport?: () => void;
  onFullscreen?: () => void;
}

export function EnterpriseChartContainer({ title, subtitle, children, onExport, onFullscreen }: EnterpriseChartContainerProps) {
  return (
    <div style={{
      backgroundColor: 'var(--bg-card)',
      border: '1px solid var(--border-main)',
      borderRadius: 'var(--radius-lg, 12px)',
      padding: 'var(--spacing-lg, 20px)',
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--spacing-md, 16px)'
    }}>
      {/* Container Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h3 style={{ margin: 0, fontSize: 16, color: 'var(--text-main)', fontWeight: 700 }}>{title}</h3>
          {subtitle && <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--text-muted)' }}>{subtitle}</p>}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {onExport && <button onClick={onExport} style={{ border: '1px solid var(--border-main)', background: 'var(--bg-app)', padding: '4px 8px', borderRadius: 6, cursor: 'pointer', fontSize: 12 }}>Export</button>}
          {onFullscreen && <button onClick={onFullscreen} style={{ border: '1px solid var(--border-main)', background: 'var(--bg-app)', padding: '4px 8px', borderRadius: 6, cursor: 'pointer', fontSize: 12 }}>Fullscreen</button>}
        </div>
      </div>

      {/* Chart Payload */}
      <div style={{ flex: 1, minHeight: 200 }}>
        {children}
      </div>
    </div>
  );
}
