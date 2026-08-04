/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * FuelPro Enterprise Reports Platform v2.0
 * Phase 1.3 — Enterprise Component Library Framework
 *
 * Enterprise Activity Feed.
 * Reusable chronological feed. No operational logic.
 */

import React from 'react';
import { EnterpriseComponentRegistry } from '../EnterpriseComponentRegistry';

EnterpriseComponentRegistry.getInstance().register({
  id: 'ECL-ACTIVITY-FEED',
  version: '1.0.0',
  owner: 'ECL Core Team',
  category: 'TIMELINE',
  status: 'PRODUCTION',
  accessibility: 'WCAG_AA',
  themeSupport: true
});

export function EnterpriseActivityFeed() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {[1, 2].map(i => (
        <div key={i} style={{
          backgroundColor: 'var(--bg-app)',
          padding: 16,
          borderRadius: 8,
          border: '1px solid var(--border-main)'
        }}>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>User Placeholder • Action Placeholder</div>
          <div style={{ fontSize: 14, marginTop: 8, color: 'var(--text-main)' }}>Activity detail payload renders here.</div>
        </div>
      ))}
    </div>
  );
}
