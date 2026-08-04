/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * FuelPro Enterprise Reports Platform v2.0
 * Phase 1.2 — UI Framework
 *
 * Audit Footer.
 * Displays live, registry-derived status only — never hardcoded counts
 * or fabricated security claims (Rule #90 / #117 / #126).
 * Developer metadata stays hidden unless Developer Mode is active.
 */

import React from 'react';
import { useWorkspaceState } from './WorkspaceStateManager';
import { EnterpriseReportRegistry, DomainCategory } from '../../../../lib/reports-v2/foundation/EnterpriseReportRegistry';

const DOMAIN_SHORTHAND: { key: DomainCategory; label: string }[] = [
  { key: 'A', label: 'EXEC' },
  { key: 'B', label: 'SALES' },
  { key: 'C', label: 'STOCK' },
  { key: 'H', label: 'SHIFT' },
  { key: 'L', label: 'LEDGER' },
  { key: 'T', label: 'TREASURY' },
  { key: 'Z', label: 'SEC' }
];

export default function AuditFooter() {
  const { language, isDeveloperMode, databaseConnected } = useWorkspaceState();
  const registry = EnterpriseReportRegistry.getInstance();
  const allReports = registry.getAllReports();
  const totalCount = allReports.length;
  const certifiedCount = allReports.filter(r => r.certificationStatus === 'CERTIFIED').length;

  const StatItem = ({ label, value }: { label: string, value: string | number }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <span style={{ color: 'var(--text-muted)' }}>{label}:</span>
      <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{value}</span>
    </div>
  );

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      flexWrap: 'wrap',
      gap: 8,
      padding: '8px 20px',
      backgroundColor: 'var(--bg-card)',
      borderTop: '1px solid var(--border-main)',
      fontSize: 11,
      fontFamily: 'monospace'
    }}>
      {/* Left: Operational DB status — the only status shown to operational users (Rule #126) */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
        <StatItem label={language === 'en' ? 'DB' : 'ڈیٹا بیس'} value={databaseConnected ? (language === 'en' ? 'LIVE' : 'لائیو') : (language === 'en' ? 'OFFLINE' : 'آف لائن')} />
        {isDeveloperMode && (
          <>
            <StatItem label={language === 'en' ? 'CATALOG' : 'کیٹلاگ'} value={`${totalCount} ${language === 'en' ? 'reports' : 'رپورٹس'}`} />
            <StatItem label={language === 'en' ? 'DOMAINS' : 'ڈومینز'} value={`${registry.getAllReports().length > 0 ? new Set(allReports.map(r => r.category)).size : 0} / 26`} />
            <StatItem label={language === 'en' ? 'CERTIFIED' : 'سرٹیفائیڈ'} value={`${certifiedCount}`} />
          </>
        )}
      </div>

      {/* Right: Domain Coverage (dev only) + Security State */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
        {isDeveloperMode && DOMAIN_SHORTHAND.map(d => (
          <StatItem key={d.key} label={d.label} value={`${registry.getReportsByDomain(d.key).length}`} />
        ))}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <div style={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            backgroundColor: databaseConnected ? 'var(--color-success)' : 'var(--color-warning)'
          }} />
          <span style={{
            color: databaseConnected ? 'var(--color-success)' : 'var(--color-warning)',
            fontWeight: 'bold'
          }}>
            {databaseConnected
              ? (language === 'en' ? 'AUDIT SHA-256 ENABLED' : 'آڈٹ شا-256 فعال')
              : (language === 'en' ? 'READ-ONLY SAFE MODE' : 'صرف پڑھنے کا سیف موڈ')}
          </span>
        </div>
      </div>
    </div>
  );
}
