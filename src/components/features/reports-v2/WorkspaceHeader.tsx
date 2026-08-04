/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * FuelPro Enterprise Reports Platform v2.0 — Workspace Header
 *
 * Enterprise header with platform version, live database status,
 * role indicator, and station info.
 */

import React from 'react';
import { Shield, Database, Activity, Clock } from 'lucide-react';
import type { PlatformHealthStatus } from '../../../lib/reports-v2';

interface WorkspaceHeaderProps {
  platformVersion: string;
  health: PlatformHealthStatus;
  userRole: string;
  stationName: string;
  language: 'en' | 'ur';
}

export default function WorkspaceHeader({
  platformVersion,
  health,
  userRole,
  stationName,
  language
}: WorkspaceHeaderProps) {
  const isEn = language === 'en';

  return (
    <div
      className="flex items-center justify-between flex-wrap gap-3"
      style={{
        padding: '16px 20px',
        backgroundColor: 'var(--bg-card)',
        borderBottom: '1px solid var(--border-main)',
        borderRadius: '16px 16px 0 0'
      }}
    >
      {/* Title & Version */}
      <div className="flex items-center gap-3">
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: 12,
            background: 'linear-gradient(135deg, var(--primary-accent), var(--color-accent))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <Activity size={20} color="#fff" />
        </div>
        <div>
          <h1
            style={{
              fontSize: 18,
              fontWeight: 700,
              color: 'var(--text-main)',
              margin: 0,
              lineHeight: 1.3
            }}
          >
            {isEn ? 'FuelPro Reports Platform' : 'فیول پرو رپورٹس پلیٹ فارم'}
          </h1>
          <span
            style={{
              fontSize: 12,
              fontWeight: 500,
              color: 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
              gap: 6
            }}
          >
            v{platformVersion} • {isEn ? 'Enterprise Edition' : 'انٹرپرائز ایڈیشن'}
          </span>
        </div>
      </div>

      {/* Status Badges */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* Database Status */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '6px 12px',
            borderRadius: 10,
            fontSize: 12,
            fontWeight: 600,
            backgroundColor: health.databaseConnected
              ? 'rgba(16, 185, 129, 0.1)'
              : 'rgba(239, 68, 68, 0.1)',
            color: health.databaseConnected
              ? 'var(--color-success)'
              : 'var(--color-error)',
            border: `1px solid ${health.databaseConnected
              ? 'rgba(16, 185, 129, 0.2)'
              : 'rgba(239, 68, 68, 0.2)'}`
          }}
        >
          <Database size={13} />
          {health.databaseConnected
            ? (isEn ? 'Live DB' : 'لائیو ڈیٹا بیس')
            : (isEn ? 'Offline' : 'آف لائن')}
        </div>

        {/* Role Badge */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '6px 12px',
            borderRadius: 10,
            fontSize: 12,
            fontWeight: 600,
            backgroundColor: 'rgba(var(--primary-accent), 0.1)',
            color: 'var(--primary-accent)',
            border: '1px solid var(--border-main)'
          }}
        >
          <Shield size={13} />
          {userRole.charAt(0).toUpperCase() + userRole.slice(1)}
        </div>

        {/* Station Name */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '6px 12px',
            borderRadius: 10,
            fontSize: 12,
            fontWeight: 600,
            color: 'var(--text-muted)',
            border: '1px solid var(--border-main)'
          }}
        >
          <Clock size={13} />
          {stationName}
        </div>
      </div>
    </div>
  );
}
