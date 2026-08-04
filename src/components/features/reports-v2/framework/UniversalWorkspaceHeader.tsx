/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * FuelPro Enterprise Reports Platform v2.0
 * Phase 1.2 — UI Framework
 *
 * Universal Workspace Header.
 * Reusable header supporting Report Name, Category, Station, Role, DB Indicator.
 * No report-specific code. Framework only.
 */

import React from 'react';
import { useWorkspaceState } from './WorkspaceStateManager';
import { NotificationBadge } from './UniversalNotificationSystem';

interface UniversalWorkspaceHeaderProps {
  stationName: string;
  userRole: string;
  platformVersion: string;
}

export default function UniversalWorkspaceHeader({ 
  stationName, 
  userRole, 
  platformVersion 
}: UniversalWorkspaceHeaderProps) {
  const { lifecycleState, activeReportId, language } = useWorkspaceState();

  const isReady = lifecycleState === 'READY';

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '12px 20px',
      backgroundColor: 'var(--bg-card)',
      borderBottom: '1px solid var(--border-main)'
    }}>
      {/* Left: Branding & Active Context */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 32,
          height: 32,
          backgroundColor: 'var(--primary-main)',
          color: '#fff',
          borderRadius: 8,
          fontWeight: 'bold'
        }}>
          EP
        </div>
        <div>
          <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-main)' }}>
            {activeReportId ? `Report: ${activeReportId}` : (language === 'en' ? 'Enterprise Reports Platform' : 'انٹرپرائز رپورٹس پلیٹ فارم')}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
            <span>{stationName}</span>
            <span>•</span>
            <span style={{ textTransform: 'capitalize' }}>{userRole} Role</span>
            <span>•</span>
            <span>v{platformVersion}</span>
          </div>
        </div>
      </div>

      {/* Right: Status & Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        
        {/* Live DB Indicator */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 6,
          padding: '4px 8px',
          backgroundColor: isReady ? 'rgba(34, 197, 94, 0.1)' : 'rgba(234, 179, 8, 0.1)',
          borderRadius: 12,
          border: `1px solid ${isReady ? 'var(--color-success)' : 'var(--color-warning)'}`
        }}>
          <div style={{
            width: 8, height: 8, borderRadius: '50%',
            backgroundColor: isReady ? 'var(--color-success)' : 'var(--color-warning)'
          }} />
          <span style={{ 
            fontSize: 12, 
            fontWeight: 600, 
            color: isReady ? 'var(--color-success)' : 'var(--color-warning)' 
          }}>
            {isReady ? 'LIVE' : lifecycleState.replace('_', ' ')}
          </span>
        </div>

        <div style={{ width: 1, height: 24, backgroundColor: 'var(--border-main)' }} />

        {/* Universal Notifications */}
        <NotificationBadge />
      </div>
    </div>
  );
}
