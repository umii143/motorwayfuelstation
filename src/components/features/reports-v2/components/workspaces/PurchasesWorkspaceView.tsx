/**
 * @license SPDX-License-Identifier: Apache-2.0
 *
 * FuelPro Enterprise Business Operating System v4.0
 * PurchasesWorkspaceView — Procurement & Purchases Domain Workspace Router
 *
 * Implements Enterprise Rules #130, #131, #135, #162, #163, #164 & #168
 * Clean domain router delegating to modular, isolated sub-workspace components.
 */

import React, { useState, useMemo } from 'react';
import { WorkspaceDateFilterMenu, DateFilterState } from '../WorkspaceDateFilterMenu';
import { RightInspectorPanel } from '../RightInspectorPanel';
import { resolveWorkspaceRoute } from '../../../../../lib/reports-v2/config/WorkspaceRegistry';
import { ShoppingCart, Plus } from 'lucide-react';

import { PurchaseOverviewTab } from './purchases/PurchaseOverviewTab';
import { PurchaseRequisitionTab } from './purchases/PurchaseRequisitionTab';
import { ApprovalWorkflowTab } from './purchases/ApprovalWorkflowTab';
import { PurchaseOrdersTab } from './purchases/PurchaseOrdersTab';
import { PurchaseRegisterTab } from './purchases/PurchaseRegisterTab';
import { BowserDeliveriesTab } from './purchases/BowserDeliveriesTab';
import { GRNReceiptsTab } from './purchases/GRNReceiptsTab';
import { InvoiceVerificationTab } from './purchases/InvoiceVerificationTab';
import { SupplierPerformanceTab } from './purchases/SupplierPerformanceTab';

interface PurchasesWorkspaceViewProps {
  reportId: string;
  stationId: string;
  orgId: string;
  userId: string;
  role: string;
  lang: 'en' | 'ur';
  onSelectReport?: (reportId: string) => void;
  onDrilldown?: (nextReportId: string, filterContext?: Record<string, any>) => void;
}

export const PurchasesWorkspaceView: React.FC<PurchasesWorkspaceViewProps> = ({
  reportId,
  stationId,
  orgId,
  userId,
  role,
  lang,
  onSelectReport,
}) => {
  const isEn = lang === 'en';

  const [dateFilter, setDateFilter] = useState<DateFilterState>({
    preset: 'today',
    startDate: '2025-05-15',
    endDate: '2025-05-15',
    label: 'May 15, 2025',
  });

  const [selectedSupplier, setSelectedSupplier] = useState<string>('all');
  const [selectedRecord, setSelectedRecord] = useState<Record<string, any> | null>(null);

  const resolvedRoute = useMemo(() => resolveWorkspaceRoute(reportId), [reportId]);
  const [activeTab, setActiveTab] = useState<string>(resolvedRoute?.tabId || 'overview');

  return (
    <div className={`space-y-4 font-sans text-slate-800 pb-8 ${lang === 'ur' ? 'rtl' : ''}`}>
      {/* ── 1. WORKSPACE HEADER & TOP CONTROLS ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-xs">
        <div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight leading-tight flex items-center gap-2">
            <span>🛒</span>
            <span>Purchases & Procurement Workspace</span>
          </h1>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-[11px] font-black border border-emerald-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Live Stream 📡
            </span>
            <span className="text-xs font-bold text-slate-500">
              Complete purchase lifecycle & supplier management
            </span>
          </div>
        </div>

        {/* Right Top Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          <WorkspaceDateFilterMenu value={dateFilter} onChange={setDateFilter} lang={lang} />
          
          <select
            value={selectedSupplier}
            onChange={(e) => setSelectedSupplier(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:border-[#0B5C3D]"
          >
            <option value="all">All Suppliers ▾</option>
            <option value="pso">PSO</option>
            <option value="shell">Shell</option>
            <option value="attock">Attock</option>
            <option value="total">Total Parco</option>
          </select>

          <button
            onClick={() => setActiveTab('register')}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#0B5C3D] hover:bg-emerald-800 text-white text-xs font-black rounded-xl shadow-xs transition-all cursor-pointer"
          >
            <Plus size={15} />
            <span>+ New Purchase</span>
          </button>
        </div>
      </div>

      {/* ── 2. SUB-HEADER TABS BAR (16 DEDICATED TABS) ── */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-2 shadow-xs flex items-center gap-1 overflow-x-auto custom-horizontal-scrollbar" data-horizontal-scroll="true">
        {[
          { id: 'overview', label: 'Overview' },
          { id: 'requisitions', label: 'Purchase Requisition' },
          { id: 'approvals', label: 'Approval Workflow' },
          { id: 'orders', label: 'Purchase Orders (PO)' },
          { id: 'quotations', label: 'Supplier Quotations' },
          { id: 'rates', label: 'Rate Comparison' },
          { id: 'deliveries', label: 'Bowser Tracking' },
          { id: 'grn', label: 'GRN / Receipts' },
          { id: 'verification', label: 'Invoice Verification (3-Way Match)' },
          { id: 'register', label: 'Purchase Register' },
          { id: 'payments', label: 'Payment Status' },
          { id: 'returns', label: 'Purchase Returns' },
          { id: 'performance', label: 'Supplier Performance' },
          { id: 'analytics', label: 'Purchase Analytics' },
          { id: 'documents', label: 'Documents' },
          { id: 'audit', label: 'Audit Trail' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold whitespace-nowrap transition-all cursor-pointer ${
              activeTab === tab.id
                ? 'bg-[#0B5C3D] text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── 3. DYNAMIC SUB-WORKSPACE RENDERER ── */}
      {activeTab === 'overview' && (
        <PurchaseOverviewTab
          lang={lang}
          onSelectTab={(tab) => setActiveTab(tab)}
          onOpenInspector={(rec) => setSelectedRecord(rec)}
        />
      )}

      {activeTab === 'requisitions' && (
        <PurchaseRequisitionTab
          lang={lang}
          onOpenInspector={(rec) => setSelectedRecord(rec)}
        />
      )}

      {activeTab === 'approvals' && (
        <ApprovalWorkflowTab
          lang={lang}
          onOpenInspector={(rec) => setSelectedRecord(rec)}
        />
      )}

      {activeTab === 'orders' && (
        <PurchaseOrdersTab
          lang={lang}
          onOpenInspector={(rec) => setSelectedRecord(rec)}
        />
      )}

      {activeTab === 'deliveries' && (
        <BowserDeliveriesTab
          lang={lang}
          onOpenInspector={(rec) => setSelectedRecord(rec)}
        />
      )}

      {activeTab === 'grn' && (
        <GRNReceiptsTab
          lang={lang}
          onOpenInspector={(rec) => setSelectedRecord(rec)}
        />
      )}

      {activeTab === 'verification' && (
        <InvoiceVerificationTab
          lang={lang}
          onOpenInspector={(rec) => setSelectedRecord(rec)}
        />
      )}

      {activeTab === 'register' && (
        <PurchaseRegisterTab
          lang={lang}
          onOpenInspector={(rec) => setSelectedRecord(rec)}
        />
      )}

      {activeTab === 'performance' && (
        <SupplierPerformanceTab
          lang={lang}
          onOpenInspector={(rec) => setSelectedRecord(rec)}
        />
      )}

      {/* Fallback for other tabs */}
      {activeTab !== 'overview' &&
        activeTab !== 'requisitions' &&
        activeTab !== 'approvals' &&
        activeTab !== 'orders' &&
        activeTab !== 'deliveries' &&
        activeTab !== 'grn' &&
        activeTab !== 'verification' &&
        activeTab !== 'register' &&
        activeTab !== 'performance' && (
          <PurchaseRegisterTab
            lang={lang}
            onOpenInspector={(rec) => setSelectedRecord(rec)}
          />
        )}

      {/* ── 7-TAB RIGHT INSPECTOR DRAWER ── */}
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
