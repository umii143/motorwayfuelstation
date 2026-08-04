/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * FuelPro Enterprise Reports Platform v2.0
 * Phase 1.3 — Enterprise Component Library Framework
 *
 * Enterprise Comparison Widget.
 * UI to display Period A vs Period B.
 */

import React from 'react';
import { EnterpriseComponentRegistry } from '../EnterpriseComponentRegistry';

EnterpriseComponentRegistry.getInstance().register({
  id: 'ECL-COMPARISON',
  version: '1.0.0',
  owner: 'ECL Core Team',
  category: 'ANALYTICS',
  status: 'PRODUCTION',
  accessibility: 'WCAG_AA',
  themeSupport: true
});

export function EnterpriseComparisonWidget() {
  return (
    <div style={{ display: 'flex', gap: 20, padding: 20, backgroundColor: 'var(--bg-card)', borderRadius: 8, border: '1px solid var(--border-main)' }}>
      <div style={{ flex: 1 }}>
        <h5 style={{ margin: 0, color: 'var(--text-muted)' }}>Period A (This Month)</h5>
        <div style={{ fontSize: 24, fontWeight: 'bold', marginTop: 8 }}>$45,000</div>
      </div>
      <div style={{ width: 1, backgroundColor: 'var(--border-main)' }} />
      <div style={{ flex: 1 }}>
        <h5 style={{ margin: 0, color: 'var(--text-muted)' }}>Period B (Last Month)</h5>
        <div style={{ fontSize: 24, fontWeight: 'bold', marginTop: 8 }}>$42,000</div>
      </div>
      <div style={{ width: 1, backgroundColor: 'var(--border-main)' }} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
        <h5 style={{ margin: 0, color: 'var(--text-muted)' }}>Variance</h5>
        <div style={{ fontSize: 20, fontWeight: 'bold', color: 'var(--color-success)', marginTop: 8 }}>+ 7.1% ▲</div>
      </div>
    </div>
  );
}
