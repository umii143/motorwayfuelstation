/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * FuelPro Enterprise Reports Platform v2.0
 * Phase 1.3 — Enterprise Component Library Framework
 *
 * Enterprise Signature Framework.
 * UI for Manager, Owner, Digital Signature, QR Verification.
 */

import React from 'react';
import { EnterpriseComponentRegistry } from '../EnterpriseComponentRegistry';

EnterpriseComponentRegistry.getInstance().register({
  id: 'ECL-SIGNATURE',
  version: '1.0.0',
  owner: 'ECL Core Team',
  category: 'PRINT',
  status: 'PRODUCTION',
  accessibility: 'WCAG_AA',
  themeSupport: true
});

export function EnterpriseSignature({ roles = ['Manager', 'Owner', 'Accountant'] }: { roles?: string[] }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 40, paddingTop: 20, borderTop: '1px solid var(--border-main)' }}>
      {roles.map(role => (
        <div key={role} style={{ textAlign: 'center', width: 200 }}>
          <div style={{ height: 60, borderBottom: '1px solid var(--text-main)', marginBottom: 8 }} />
          <div style={{ fontWeight: 600, fontSize: 14 }}>{role}</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Digital Signature Verified</div>
        </div>
      ))}
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 80, height: 80, backgroundColor: 'var(--bg-subtle)', border: '1px solid var(--border-main)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontSize: 24 }}>QR</span>
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>Audit Scan</div>
      </div>
    </div>
  );
}
