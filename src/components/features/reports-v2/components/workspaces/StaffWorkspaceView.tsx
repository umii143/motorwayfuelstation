/**
 * @license SPDX-License-Identifier: Apache-2.0
 *
 * FuelPro Enterprise Business Operating System v4.0
 * StaffWorkspaceView — Dedicated Workforce & HR Management Control Center
 *
 * Implements Enterprise Rules #130, #131, #135, #140, #143 & STRICT Rule #170
 * 3-Layer Component & Data Isolation delegating to 12 modular sub-workspace tabs.
 * Distinct Deep Teal & Indigo Workforce Theme.
 */

import React, { useState, useMemo } from 'react';
import { RightInspectorPanel } from '../RightInspectorPanel';
import { QueryContext } from '../../../../../lib/reports-v2/engines/types';
import { useWorkspaceFirebaseData } from '../../hooks/useWorkspaceFirebaseData';
import {
  Users, Plus, Clock, Play, Square, DollarSign, FileText, Calendar, Megaphone, ShieldCheck
} from 'lucide-react';

import { StaffOverviewTab } from './staff/StaffOverviewTab';
import { EmployeeRegisterTab } from './staff/EmployeeRegisterTab';
import { StaffAttendanceTab } from './staff/StaffAttendanceTab';
import { ShiftManagementTab } from './staff/ShiftManagementTab';
import { StaffPerformanceTab } from './staff/StaffPerformanceTab';
import { StaffPayrollTab } from './staff/StaffPayrollTab';
import { StaffLeaveTab } from './staff/StaffLeaveTab';
import { StaffOvertimeTab } from './staff/StaffOvertimeTab';
import { StaffIncentivesTab } from './staff/StaffIncentivesTab';
import { StaffTrainingTab } from './staff/StaffTrainingTab';
import { StaffDocumentsTab } from './staff/StaffDocumentsTab';
import { StaffAuditTrailTab } from './staff/StaffAuditTrailTab';

export type StaffTabId =
  | 'overview'
  | 'employees'
  | 'attendance'
  | 'shifts'
  | 'performance'
  | 'payroll'
  | 'leaves'
  | 'overtime'
  | 'incentives'
  | 'training'
  | 'documents'
  | 'audit';

interface StaffWorkspaceViewProps {
  reportId: string;
  stationId: string;
  orgId: string;
  userId: string;
  role: string;
  lang: 'en' | 'ur';
  onSelectReport?: (reportId: string) => void;
  onDrilldown?: (nextReportId: string, filterContext?: Record<string, any>) => void;
}

export const StaffWorkspaceView: React.FC<StaffWorkspaceViewProps> = ({
  reportId,
  stationId,
  orgId,
  userId,
  role,
  lang,
  onSelectReport,
}) => {
  const isEn = lang === 'en';
  const [activeTab, setActiveTab] = useState<StaffTabId>('overview');
  const [selectedRecord, setSelectedRecord] = useState<Record<string, any> | null>(null);

  // Fetch live staff, shifts, attendance, and finance records
  const { data: staffList } = useWorkspaceFirebaseData('STAFF', { orgId, stationId });
  const { data: shifts } = useWorkspaceFirebaseData('SHIFTS', { orgId, stationId });
  const { data: attendance } = useWorkspaceFirebaseData('ATTENDANCE', { orgId, stationId });
  const { data: staffFinance } = useWorkspaceFirebaseData('STAFF_FINANCE', { orgId, stationId });

  return (
    <div className={`space-y-4 font-sans text-slate-800 pb-8 ${lang === 'ur' ? 'rtl' : ''}`}>
      {/* ── 1. WORKSPACE HEADER & HR-ONLY TOP CONTROLS (STRICT RULE #170) ── */}
      <div className="bg-[#0D1F2D] text-white rounded-2xl border border-teal-900/60 p-4 sm:p-5 shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-teal-900/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center text-xl font-bold border border-teal-500/30 shrink-0">
              👥
            </div>
            <div>
              <h1 className="text-lg font-black text-white tracking-tight leading-tight flex items-center gap-2">
                <span>Staff & Workforce Management Control Center</span>
              </h1>
              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-teal-400/20 text-teal-300 text-[10px] font-black border border-teal-400/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse"></span>
                  {isEn ? 'Rule #170 HR & Workforce Engine' : 'ورک فورس اور ایچ آر انجن'}
                </span>
                <span className="text-[10px] font-extrabold text-slate-400">
                  {isEn
                    ? `SAP / NetSuite Standard • ${staffList.length || 12} Employees | ${shifts.length || 2} Shifts Active`
                    : `${staffList.length || 12} کل ملازمین | لائیو ڈیوٹی`}
                </span>
              </div>
            </div>
          </div>

          {/* HR ONLY Quick Action Buttons (STRICT Rule #170: NO Tank Dip, NO Purchases, NO AR) */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setActiveTab('employees')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-black transition-all shadow-2xs cursor-pointer"
            >
              <Plus size={14} />
              <span>{isEn ? '+ Add Employee' : '+ نیا ملازم'}</span>
            </button>

            <button
              onClick={() => setActiveTab('shifts')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black transition-all shadow-2xs cursor-pointer"
            >
              <Play size={13} />
              <span>{isEn ? '🟢 Open Shift' : '🟢 شفٹ کھولیں'}</span>
            </button>

            <button
              onClick={() => setActiveTab('shifts')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-black transition-all shadow-2xs cursor-pointer"
            >
              <Square size={13} />
              <span>{isEn ? '🔴 Close Shift' : '🔴 شفٹ بند کریں'}</span>
            </button>

            <button
              onClick={() => setActiveTab('attendance')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-black transition-all shadow-2xs cursor-pointer"
            >
              <Clock size={14} />
              <span>{isEn ? 'Mark Attendance' : 'حاضری لگائیں'}</span>
            </button>

            <button
              onClick={() => setActiveTab('payroll')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-black transition-all shadow-2xs cursor-pointer"
            >
              <DollarSign size={14} />
              <span>{isEn ? 'Process Payroll' : 'پے رول'}</span>
            </button>
          </div>
        </div>

        {/* ── 2. SUB-HEADER TABS BAR (12 DEDICATED WORKFORCE TABS) ── */}
        <div className="flex items-center gap-1.5 pt-3 overflow-x-auto custom-horizontal-scrollbar pb-1.5" data-horizontal-scroll="true">
          {[
            { id: 'overview', label: 'Overview' },
            { id: 'employees', label: 'Employees Register' },
            { id: 'attendance', label: 'Attendance' },
            { id: 'shifts', label: 'Shift Management' },
            { id: 'performance', label: 'Performance' },
            { id: 'payroll', label: 'Payroll' },
            { id: 'leaves', label: 'Leave Management' },
            { id: 'overtime', label: 'Overtime' },
            { id: 'incentives', label: 'Incentives & Commission' },
            { id: 'training', label: 'Training & Certifications' },
            { id: 'documents', label: 'Documents' },
            { id: 'audit', label: 'Audit Trail' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as StaffTabId)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-teal-500 text-slate-950 font-black shadow-2xs'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── 3. DYNAMIC SUB-WORKSPACE RENDERER (RULE #170 DELEGATED WORKFORCE TABS) ── */}
      {activeTab === 'overview' && (
        <StaffOverviewTab
          staffList={staffList}
          shifts={shifts}
          attendance={attendance}
          staffFinance={staffFinance}
          lang={lang}
          onOpenInspector={(rec) => setSelectedRecord(rec)}
          onSelectTab={(t) => setActiveTab(t)}
        />
      )}

      {activeTab === 'employees' && (
        <EmployeeRegisterTab
          staffList={staffList}
          lang={lang}
          onOpenInspector={(rec) => setSelectedRecord(rec)}
          onOpenAddModal={() => alert('New Employee Account Registration Modal')}
        />
      )}

      {activeTab === 'attendance' && (
        <StaffAttendanceTab
          attendance={attendance}
          lang={lang}
          onOpenInspector={(rec) => setSelectedRecord(rec)}
        />
      )}

      {activeTab === 'shifts' && (
        <ShiftManagementTab
          shifts={shifts}
          lang={lang}
          onOpenInspector={(rec) => setSelectedRecord(rec)}
        />
      )}

      {activeTab === 'performance' && (
        <StaffPerformanceTab
          staffList={staffList}
          lang={lang}
          onOpenInspector={(rec) => setSelectedRecord(rec)}
        />
      )}

      {activeTab === 'payroll' && (
        <StaffPayrollTab
          staffFinance={staffFinance}
          lang={lang}
          onOpenInspector={(rec) => setSelectedRecord(rec)}
        />
      )}

      {activeTab === 'leaves' && (
        <StaffLeaveTab
          lang={lang}
          onOpenInspector={(rec) => setSelectedRecord(rec)}
        />
      )}

      {activeTab === 'overtime' && (
        <StaffOvertimeTab
          lang={lang}
          onOpenInspector={(rec) => setSelectedRecord(rec)}
        />
      )}

      {activeTab === 'incentives' && (
        <StaffIncentivesTab
          lang={lang}
          onOpenInspector={(rec) => setSelectedRecord(rec)}
        />
      )}

      {activeTab === 'training' && (
        <StaffTrainingTab
          lang={lang}
          onOpenInspector={(rec) => setSelectedRecord(rec)}
        />
      )}

      {activeTab === 'documents' && (
        <StaffDocumentsTab
          staffList={staffList}
          lang={lang}
        />
      )}

      {activeTab === 'audit' && (
        <StaffAuditTrailTab
          staffList={staffList}
          lang={lang}
          onOpenInspector={(rec) => setSelectedRecord(rec)}
        />
      )}

      {/* ── RIGHT INSPECTOR DRAWER ── */}
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
