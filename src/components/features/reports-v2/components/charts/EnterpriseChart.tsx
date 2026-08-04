/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * FuelPro Enterprise Reports Platform v2.0
 * Phase 1.3 — Enterprise Component Library Framework
 *
 * Enterprise Chart Framework.
 * Reusable placeholder chart structure.
 */

import React from 'react';
import { EnterpriseComponentRegistry } from '../EnterpriseComponentRegistry';

EnterpriseComponentRegistry.getInstance().register({
  id: 'ECL-CHART',
  version: '1.0.0',
  owner: 'ECL Core Team',
  category: 'CHART',
  status: 'PRODUCTION',
  accessibility: 'WCAG_AA',
  themeSupport: true
});

export type EnterpriseChartType = 'LINE' | 'AREA' | 'BAR' | 'PIE' | 'WATERFALL' | 'SCATTER';

export interface EnterpriseChartProps {
  type: EnterpriseChartType;
  data: any[]; // Framework placeholder for datasets
  title: string;
  height?: number;
}

export function EnterpriseChart({ type, data, title, height = 300 }: EnterpriseChartProps) {
  return (
    <div style={{
      height,
      width: '100%',
      backgroundColor: 'var(--bg-subtle)',
      border: '1px dashed var(--border-main)',
      borderRadius: 'var(--radius-md, 8px)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'var(--text-muted)'
    }}>
      <div style={{ fontSize: 40, opacity: 0.3 }}>
        {type === 'PIE' ? '🥧' : type === 'BAR' ? '📊' : '📈'}
      </div>
      <div style={{ marginTop: 12, fontWeight: 600 }}>{title}</div>
      <div style={{ fontSize: 12, opacity: 0.6 }}>[ {type} Chart Renderer Framework ]</div>
    </div>
  );
}
