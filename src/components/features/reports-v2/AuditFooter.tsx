/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * FuelPro Enterprise Reports Platform v2.0 — Audit Footer
 *
 * Enterprise audit footer showing infrastructure status,
 * engine readiness, and platform health.
 */

import React from 'react';
import { CheckCircle, Database, Clock, Hash, Cpu } from 'lucide-react';
import type { PlatformHealthStatus } from '../../../lib/reports-v2';

interface AuditFooterProps {
  health: PlatformHealthStatus;
  language: 'en' | 'ur';
}

export default function AuditFooter({ health, language }: AuditFooterProps) {
  const isEn = language === 'en';

  const items = [
    {
      icon: Database,
      label: isEn ? 'Registry' : 'رجسٹری',
      value: `${health.registryReportCount} ${isEn ? 'Reports' : 'رپورٹیں'}`,
      ok: health.registryLoaded
    },
    {
      icon: Cpu,
      label: isEn ? 'Formulas' : 'فارمولے',
      value: `${health.formulaCount} ${isEn ? 'Active' : 'فعال'}`,
      ok: health.formulaCount > 0
    },
    {
      icon: CheckCircle,
      label: isEn ? 'Rules' : 'قواعد',
      value: `${health.ruleCount} ${isEn ? 'Loaded' : 'لوڈ'}`,
      ok: health.ruleCount > 0
    },
    {
      icon: Hash,
      label: isEn ? 'Layers' : 'لیئرز',
      value: `${health.layerCount} ${isEn ? 'Active' : 'فعال'}`,
      ok: health.layerCount > 0
    },
    {
      icon: Clock,
      label: isEn ? 'Version' : 'ورژن',
      value: `v${health.platformVersion}`,
      ok: true
    }
  ];

  return (
    <div
      style={{
        padding: '10px 20px',
        backgroundColor: 'var(--bg-card)',
        borderTop: '1px solid var(--border-main)',
        borderRadius: '0 0 16px 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 8
      }}
    >
      {/* Status Items */}
      <div className="flex items-center gap-4 flex-wrap">
        {items.map((item, idx) => (
          <div
            key={idx}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              fontSize: 11,
              fontWeight: 500,
              color: 'var(--text-muted)'
            }}
          >
            <item.icon
              size={12}
              style={{
                color: item.ok ? 'var(--color-success)' : 'var(--color-error)'
              }}
            />
            <span>{item.label}:</span>
            <span
              style={{
                fontWeight: 600,
                color: item.ok ? 'var(--text-main)' : 'var(--color-error)'
              }}
            >
              {item.value}
            </span>
          </div>
        ))}
      </div>

      {/* Platform Status */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          fontSize: 11,
          fontWeight: 600,
          color: health.queryEngineReady && health.auditEngineReady
            ? 'var(--color-success)'
            : 'var(--color-warning)'
        }}
      >
        <div
          style={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            backgroundColor: health.queryEngineReady && health.auditEngineReady
              ? 'var(--color-success)'
              : 'var(--color-warning)'
          }}
        />
        {health.queryEngineReady && health.auditEngineReady
          ? (isEn ? 'All Engines Online' : 'تمام انجنز آن لائن')
          : (isEn ? 'Engines Initializing' : 'انجنز شروع ہو رہے ہیں')}
      </div>
    </div>
  );
}
