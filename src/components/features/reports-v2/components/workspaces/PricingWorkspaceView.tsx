/**
 * @license SPDX-License-Identifier: Apache-2.0
 *
 * FuelPro Enterprise Business Operating System v4.0
 * PricingWorkspaceView — Dedicated Enterprise Pricing & OMC Control Center
 *
 * Implements Rule #172 (Strict Pricing Domain Isolation) & Rule #173 (Pricing Simulation Engine)
 * ZERO operational widgets or actions (No Shifts, No Expenses, No Purchases, No Customer Payments, No Tank Dips).
 */

import React from 'react';
import AdvancedPriceManagement from '../../../PriceManagement/AdvancedPriceManagement';
import { useInventoryStore } from '../../../../../stores/useInventoryStore';
import { GlobalSettings } from '../../../../../types';

interface PricingWorkspaceViewProps {
  reportId: string;
  stationId: string;
  orgId: string;
  userId: string;
  role: string;
  lang: 'en' | 'ur';
  onSelectReport?: (reportId: string) => void;
  onDrilldown?: (nextReportId: string, filterContext?: Record<string, any>) => void;
}

export const PricingWorkspaceView: React.FC<PricingWorkspaceViewProps> = ({
  stationId,
  lang,
}) => {
  const products = useInventoryStore((state) => state.products || []);
  const rateHistory = useInventoryStore((state) => state.rateHistory || []);

  const settings: GlobalSettings = {
    language: lang || 'en',
    currency: 'PKR',
    companyName: 'FuelPro Enterprise',
    theme: 'dark',
    stationName: 'Bakhshali Main Station',
    stationUrduName: 'بخشالی اسٹیشن',
    address: 'Mardan Highway',
    ntn: '1234567-8',
    ownerContact: '+92 300 1234567'
  } as unknown as GlobalSettings;

  return (
    <div className="w-full min-h-screen">
      <AdvancedPriceManagement
        products={products}
        rateHistory={rateHistory}
        settings={settings}
        onOpenUpdateDrawer={() => {}}
      />
    </div>
  );
};
