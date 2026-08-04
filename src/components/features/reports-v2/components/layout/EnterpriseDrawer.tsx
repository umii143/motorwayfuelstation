/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * FuelPro Enterprise Reports Platform v2.0
 * Phase 1.3 — Enterprise Component Library Framework
 *
 * Enterprise Drawer Framework.
 * Reusable right drawer component.
 */

import React from 'react';
import { EnterpriseComponentRegistry } from '../EnterpriseComponentRegistry';

EnterpriseComponentRegistry.getInstance().register({
  id: 'ECL-DRAWER',
  version: '1.0.0',
  owner: 'ECL Core Team',
  category: 'LAYOUT',
  status: 'PRODUCTION',
  accessibility: 'WCAG_AA',
  themeSupport: true
});

export function EnterpriseDrawer({ title, children, onClose }: any) {
  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.3)', zIndex: 1000,
      display: 'flex', justifyContent: 'flex-end'
    }}>
      <div style={{
        width: 400,
        height: '100%',
        backgroundColor: 'var(--bg-app)',
        boxShadow: '-4px 0 20px rgba(0,0,0,0.1)',
        display: 'flex', flexDirection: 'column'
      }}>
        <div style={{ padding: 20, borderBottom: '1px solid var(--border-main)', display: 'flex', justifyContent: 'space-between' }}>
          <h3 style={{ margin: 0, fontSize: 16, color: 'var(--text-main)' }}>{title}</h3>
          <button onClick={onClose} style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 16 }}>✕</button>
        </div>
        <div style={{ padding: 20, overflowY: 'auto', flex: 1 }}>
          {children}
        </div>
      </div>
    </div>
  );
}
