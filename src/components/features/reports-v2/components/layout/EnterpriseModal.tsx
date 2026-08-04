/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * FuelPro Enterprise Reports Platform v2.0
 * Phase 1.3 — Enterprise Component Library Framework
 *
 * Enterprise Modal Framework.
 * Reusable modal templates (Large, Medium, Small, Fullscreen).
 */

import React from 'react';
import { EnterpriseComponentRegistry } from '../EnterpriseComponentRegistry';

EnterpriseComponentRegistry.getInstance().register({
  id: 'ECL-MODAL',
  version: '1.0.0',
  owner: 'ECL Core Team',
  category: 'LAYOUT',
  status: 'PRODUCTION',
  accessibility: 'WCAG_AA',
  themeSupport: true
});

export function EnterpriseModal({ title, size = 'MEDIUM', children, onClose }: any) {
  const width = size === 'LARGE' ? 800 : size === 'SMALL' ? 400 : size === 'FULLSCREEN' ? '100vw' : 600;

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000,
      display: 'flex', alignItems: 'center', justifyContent: 'center'
    }}>
      <div style={{
        width, 
        height: size === 'FULLSCREEN' ? '100vh' : 'auto',
        maxHeight: '90vh',
        backgroundColor: 'var(--bg-app)',
        borderRadius: size === 'FULLSCREEN' ? 0 : 12,
        display: 'flex', flexDirection: 'column',
        boxShadow: 'var(--shadow-lg)'
      }}>
        <div style={{ padding: 16, borderBottom: '1px solid var(--border-main)', display: 'flex', justifyContent: 'space-between' }}>
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
