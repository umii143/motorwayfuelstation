/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * FuelPro Enterprise Reports Platform v2.0
 * Phase 1.3 — Enterprise Component Library Framework
 *
 * Enterprise KPI Grid.
 * Automatic responsive grid for displaying KPI cards.
 */

import React from 'react';
import { EnterpriseComponentRegistry } from '../EnterpriseComponentRegistry';

EnterpriseComponentRegistry.getInstance().register({
  id: 'ECL-KPI-GRID',
  version: '1.0.0',
  owner: 'ECL Core Team',
  category: 'CARD',
  status: 'PRODUCTION',
  accessibility: 'WCAG_AA',
  themeSupport: true
});

export interface EnterpriseKPIGridProps {
  children: React.ReactNode;
  columns?: 2 | 4 | 6 | 8 | 12;
}

export function EnterpriseKPIGrid({ children, columns = 4 }: EnterpriseKPIGridProps) {
  // Translate requested columns to CSS Grid variables
  const gridTemplateColumns = `repeat(auto-fit, minmax(calc(100% / ${columns} - 20px), 1fr))`;

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns,
      gap: 'var(--spacing-lg, 20px)',
      width: '100%'
    }}>
      {children}
    </div>
  );
}
