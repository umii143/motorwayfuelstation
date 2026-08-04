/**
 * @license SPDX-License-Identifier: Apache-2.0
 *
 * FuelPro Enterprise Business Operating System v4.0
 * BusinessCenterRouter — Enterprise Process Router & Domain Resolver
 *
 * Implements Enterprise Rule #130, #131, #132, #135, #136, #162 & #163
 * Metadata-Driven Routing via WorkspaceRegistry.ts
 */

import React, { useMemo } from 'react';
import { DomainWorkspaceEngine, BusinessDomainType } from './DomainWorkspaceEngine';
import { ReportConfigLoader } from '../../../../lib/reports-v2/engines/ReportConfigLoader';
import { resolveWorkspaceRoute } from '../../../../lib/reports-v2/config/WorkspaceRegistry';

interface BusinessCenterRouterProps {
  reportId: string;
  stationId: string;
  orgId: string;
  userId: string;
  role: string;
  lang: 'en' | 'ur';
  onSelectReport?: (reportId: string) => void;
  onDrilldown?: (nextReportId: string, filterContext?: Record<string, any>) => void;
}

/**
 * Maps process/report IDs to their primary Business Domain via WorkspaceRegistry.ts
 */
export function resolveBusinessDomain(reportId: string): BusinessDomainType {
  const route = resolveWorkspaceRoute(reportId);
  if (route?.workspaceId) {
    return route.workspaceId as BusinessDomainType;
  }

  const upper = reportId.toUpperCase();
  if (upper.startsWith('DOMAIN_FUEL') || upper.startsWith('FS_') || upper === 'A' || upper === 'C2') {
    return 'fuel_operations';
  }
  if (upper.startsWith('DOMAIN_INV') || upper.startsWith('INV_') || upper === 'I' || upper === 'M') {
    return 'inventory';
  }
  if (upper.startsWith('DOMAIN_PUR') || upper.startsWith('PUR_')) {
    return 'purchases';
  }
  if (upper === 'FIN_EXPENSE' || upper === 'E' || upper.includes('EXPENSE')) {
    return 'expenses';
  }
  if (upper.startsWith('DOMAIN_FIN') || upper.startsWith('FIN_') || upper === 'C1' || upper === 'B') {
    return 'finance';
  }
  if (upper.startsWith('DOMAIN_LEDGER') || upper.startsWith('LED_') || upper === 'L1') {
    return 'ledgers';
  }
  if (upper.startsWith('DOMAIN_CUS') || upper.startsWith('CUS_')) {
    return 'customers';
  }
  if (upper.startsWith('DOMAIN_SUP') || upper.startsWith('SUP_')) {
    return 'suppliers';
  }
  if (upper.startsWith('DOMAIN_STF') || upper.startsWith('STF_') || upper === 'SHIFT') {
    return 'staff';
  }
  if (upper.startsWith('DOMAIN_PRC') || upper.startsWith('PRC_')) {
    return 'pricing';
  }
  if (upper.startsWith('DOMAIN_ANL') || upper.startsWith('ANL_') || upper === 'P1') {
    return 'analytics';
  }

  return 'fuel_operations';
}

export const BusinessCenterRouter: React.FC<BusinessCenterRouterProps> = ({
  reportId,
  stationId,
  orgId,
  userId,
  role,
  lang,
  onSelectReport,
  onDrilldown,
}) => {
  const domain = useMemo(() => resolveBusinessDomain(reportId), [reportId]);
  const configLoader = ReportConfigLoader.getInstance();
  const config = useMemo(() => configLoader.getConfig(reportId), [configLoader, reportId]);

  return (
    <DomainWorkspaceEngine
      domain={domain}
      reportId={reportId}
      config={config}
      stationId={stationId}
      orgId={orgId}
      userId={userId}
      role={role}
      lang={lang}
      onSelectReport={onSelectReport}
      onDrilldown={onDrilldown}
    />
  );
};
