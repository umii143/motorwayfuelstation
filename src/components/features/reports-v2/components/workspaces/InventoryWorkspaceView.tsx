/**
 * @license SPDX-License-Identifier: Apache-2.0
 *
 * FuelPro Enterprise Business Operating System v4.0
 * InventoryWorkspaceView — Clean Modular Domain Router & Coordinator
 *
 * Implements Enterprise Rules #144, #145, #146, #147, #148, #149, #150, #151 & #152
 */

import React, { useState, useMemo } from 'react';
import { useReportExecution } from '../../../../../hooks/useReportExecution';
import { RightInspectorPanel } from '../RightInspectorPanel';
import { QueryContext } from '../../../../../lib/reports-v2/engines/types';

import { InventoryOverviewTab } from './inventory/InventoryOverviewTab';
import { InventoryTankRegisterTab } from './inventory/InventoryTankRegisterTab';
import { InventoryPurchaseRecommendationTab } from './inventory/InventoryPurchaseRecommendationTab';
import { InventoryATGMonitoringTab } from './inventory/InventoryATGMonitoringTab';

interface InventoryWorkspaceViewProps {
  reportId: string;
  stationId: string;
  orgId: string;
  userId: string;
  role: string;
  lang: 'en' | 'ur';
  onSelectReport?: (reportId: string) => void;
  onDrilldown?: (nextReportId: string, filterContext?: Record<string, any>) => void;
}

export const InventoryWorkspaceView: React.FC<InventoryWorkspaceViewProps> = ({
  reportId,
  stationId,
  orgId,
  userId,
  role,
  lang,
  onSelectReport,
}) => {
  const isEn = lang === 'en';

  const queryContext: QueryContext = useMemo(
    () => ({ stationId, orgId, userId, role }),
    [stationId, orgId, userId, role]
  );

  // Firestore Live Stream Queries
  const tanksQuery = useReportExecution('INV_TANK_REG', queryContext);
  const dipsQuery = useReportExecution('INV_DIP', queryContext);
  const purchasesQuery = useReportExecution('PUR_REGISTER', queryContext);

  const [selectedRecord, setSelectedRecord] = useState<Record<string, any> | null>(null);
  const [activeTab, setActiveTab] = useState<
    'overview' | 'register' | 'purchaserec' | 'atg' | 'dips' | 'movement' | 'valuation'
  >(
    reportId === 'INV_PURCHASE_REC' ? 'purchaserec' :
    reportId === 'INV_ATG' ? 'atg' :
    reportId === 'INV_TANK_REG' ? 'register' : 'overview'
  );

  const tankRows: Record<string, any>[] = tanksQuery.result?.register?.rows || [];
  const dipRows: Record<string, any>[] = dipsQuery.result?.register?.rows || [];
  const purchaseRows: Record<string, any>[] = purchasesQuery.result?.register?.rows || [];

  return (
    <div className={`space-y-4 font-sans text-slate-800 pb-8 ${lang === 'ur' ? 'rtl' : ''}`}>
      {/* ── MODULAR SUB-NAVIGATION TAB ROUTER (RULE #144) ── */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-2 shadow-xs flex items-center gap-1 overflow-x-auto custom-horizontal-scrollbar" data-horizontal-scroll="true">
        {[
          { id: 'overview', label: 'Overview' },
          { id: 'register', label: '30+ Col Tank Register' },
          { id: 'purchaserec', label: 'AI Purchase Advisor 🤖' },
          { id: 'atg', label: 'ATG Probe Diagnostics 📡' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-2 rounded-xl text-xs font-black whitespace-nowrap transition-all cursor-pointer ${
              activeTab === tab.id
                ? 'bg-[#0B5C3D] text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── SUB-WORKSPACE RENDERING DELEGATION ── */}
      {activeTab === 'overview' && (
        <InventoryOverviewTab
          tanks={tankRows}
          dips={dipRows}
          purchases={purchaseRows}
          lang={lang}
          onSelectReport={onSelectReport}
          onSelectRecord={(r) => setSelectedRecord(r)}
        />
      )}

      {activeTab === 'register' && (
        <InventoryTankRegisterTab
          tanks={tankRows}
          lang={lang}
          onSelectRecord={(r) => setSelectedRecord(r)}
        />
      )}

      {activeTab === 'purchaserec' && (
        <InventoryPurchaseRecommendationTab
          lang={lang}
          onSelectReport={onSelectReport}
        />
      )}

      {activeTab === 'atg' && (
        <InventoryATGMonitoringTab
          lang={lang}
        />
      )}

      {/* ── 7-TAB RIGHT INSPECTOR DRAWER (RULE #147) ── */}
      <RightInspectorPanel
        isOpen={!!selectedRecord}
        onClose={() => setSelectedRecord(null)}
        record={selectedRecord}
        language={lang}
        onNavigateRelated={(repId) => onSelectReport?.(repId)}
      />
    </div>
  );
};
