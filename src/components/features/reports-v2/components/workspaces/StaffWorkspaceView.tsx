/**
 * @license SPDX-License-Identifier: Apache-2.0
 *
 * FuelPro Enterprise Business Operating System v4.0
 * StaffWorkspaceView — Dedicated Workforce & HR Management Control Center
 *
 * Implements Enterprise Rules #130, #131, #135, #140, #143 & STRICT Rule #170
 * Upgraded to 10-Layer UX standard (Addendum A.12.1) + Phase A Part 10 Audit
 * Staff & Workforce Management Control Center.
 */

import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useReportExecution } from '../../../../../hooks/useReportExecution';
import { RightInspectorPanel } from '../RightInspectorPanel';
import { DateFilterState } from '../WorkspaceDateFilterMenu';
import { UniversalWorkspaceLayout, WorkspaceLayer, enforceOperationalSSOT } from '../../framework/UniversalWorkspaceLayout';
import { QueryContext } from '../../../../../lib/reports-v2/engines/types';
import { useWorkspaceFirebaseData } from '../../hooks/useWorkspaceFirebaseData';
import { DomainReportsCenterTab } from './reports-center/DomainReportsCenterTab';
import toast from 'react-hot-toast';

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

function formatCurrency(v: number | string): string {
  const n = typeof v === 'number' ? v : Number(v) || 0;
  return `₨ ${n.toLocaleString('en-PK')}`;
}

interface StaffWorkspaceViewProps {
  reportId?: string;
  stationId?: string;
  orgId?: string;
  userId?: string;
  role?: string;
  lang?: 'en' | 'ur';
  onSelectReport?: (reportId: string) => void;
  onDrilldown?: (nextReportId: string, filterContext?: Record<string, any>) => void;
}

export const StaffWorkspaceView: React.FC<StaffWorkspaceViewProps> = ({
  stationId = 'st_default',
  orgId = 'org_main',
  userId = 'u_default',
  role = 'owner',
  lang = 'en',
  onSelectReport,
}) => {
  const isEn = lang === 'en';
  const isUr = lang === 'ur';
  const navigate = useNavigate();

  // Global Date Filter State
  const [dateFilter, setDateFilter] = useState<DateFilterState>({
    preset: 'today',
    startDate: '2025-05-15',
    endDate: '2025-05-15',
    label: 'May 15, 2025',
  });

  const queryContext: QueryContext = useMemo(
    () => ({ stationId, orgId, userId, role, dateRange: { startDate: dateFilter.startDate, endDate: dateFilter.endDate } }),
    [stationId, orgId, userId, role, dateFilter]
  );

  const [selectedRecord, setSelectedRecord] = useState<Record<string, any> | null>(null);

  // Fetch live staff, shifts, attendance, and finance records
  const { data: staffList = [] } = useWorkspaceFirebaseData('STAFF', { orgId, stationId });
  const { data: shifts = [] } = useWorkspaceFirebaseData('SHIFTS', { orgId, stationId });
  const { data: attendance = [] } = useWorkspaceFirebaseData('ATTENDANCE', { orgId, stationId });
  const { data: staffFinance = [] } = useWorkspaceFirebaseData('STAFF_FINANCE', { orgId, stationId });

  // Subtab State for Register, Analytics, Workflow, Reports
  const [registerSubTab, setRegisterSubTab] = useState<'employees' | 'shifts'>('employees');
  const [analyticsSubTab, setAnalyticsSubTab] = useState<'performance' | 'attendance'>('performance');
  const [workflowSubTab, setWorkflowSubTab] = useState<'leave' | 'overtime' | 'incentives'>('leave');
  const [reportsSubTab, setReportsSubTab] = useState<'payroll' | 'training'>('payroll');

  // Render 10 Layers Functionally
  const renderLayer = (layer: WorkspaceLayer) => {
    switch (layer) {
      case 'overview':
        return (
          <StaffOverviewTab
            staffList={staffList}
            shifts={shifts}
            attendance={attendance}
            staffFinance={staffFinance}
            lang={lang}
            onOpenInspector={(rec) => setSelectedRecord(rec)}
            onSelectTab={(t) => {
              if (t === 'employees') setRegisterSubTab('employees');
              else if (t === 'payroll') setReportsSubTab('payroll');
            }}
          />
        );

      case 'kpis':
        return (
          <div className="space-y-4">
            <div className="bg-card border border-border rounded-2xl p-5 shadow-2xs space-y-4">
              <h3 className="text-sm font-black text-foreground uppercase tracking-wider">
                {isEn ? 'Workforce & HR Management Scorecard' : 'ورک فورس اسکور کارڈ'}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs font-mono">
                <div className="p-4 rounded-xl bg-muted/40 border border-border space-y-1">
                  <span className="text-muted-foreground font-sans font-bold">Total Staff Registered</span>
                  <div className="text-xl font-black text-foreground">{staffList.length}</div>
                </div>
                <div className="p-4 rounded-xl bg-muted/40 border border-border space-y-1">
                  <span className="text-muted-foreground font-sans font-bold">Active Duty Shifts</span>
                  <div className="text-xl font-black text-teal-600">{shifts.filter(s => s.status === 'open' || !s.closedAt).length}</div>
                </div>
                <div className="p-4 rounded-xl bg-muted/40 border border-border space-y-1">
                  <span className="text-muted-foreground font-sans font-bold">Staff Present Today</span>
                  <div className="text-xl font-black text-blue-600">{attendance.filter(a => a.status === 'PRESENT').length}</div>
                </div>
                <div className="p-4 rounded-xl bg-muted/40 border border-border space-y-1">
                  <span className="text-muted-foreground font-sans font-bold">Monthly Payroll Budget</span>
                  <div className="text-xl font-black text-amber-600">
                    {formatCurrency(staffFinance.reduce((sum, f) => sum + (Number(f.salary || f.amount) || 0), 0))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'register':
        return (
          <div className="space-y-3">
            <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-xl border border-border overflow-x-auto">
              {[
                { id: 'employees', label: 'Master Employees Register' },
                { id: 'shifts', label: 'Shift Roster Management' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setRegisterSubTab(tab.id as any)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                    registerSubTab === tab.id 
                      ? 'bg-teal-600 text-white shadow-2xs' 
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {registerSubTab === 'employees' && (
              <EmployeeRegisterTab
                staffList={staffList}
                lang={lang}
                onOpenInspector={(r) => setSelectedRecord(r)}
                onOpenAddModal={() => enforceOperationalSSOT(navigate, 'Staff Module', '/staff', isEn)}
              />
            )}
            {registerSubTab === 'shifts' && (
              <ShiftManagementTab
                shifts={shifts}
                lang={lang}
                onOpenInspector={(r) => setSelectedRecord(r)}
              />
            )}
          </div>
        );

      case 'analytics':
        return (
          <div className="space-y-3">
            <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-xl border border-border overflow-x-auto">
              {[
                { id: 'performance', label: 'Staff Performance Scorecards' },
                { id: 'attendance', label: 'Attendance Analytics' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setAnalyticsSubTab(tab.id as any)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                    analyticsSubTab === tab.id 
                      ? 'bg-teal-600 text-white shadow-2xs' 
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {analyticsSubTab === 'performance' && <StaffPerformanceTab staffList={staffList} lang={lang} onOpenInspector={(r) => setSelectedRecord(r)} />}
            {analyticsSubTab === 'attendance' && <StaffAttendanceTab attendance={attendance} lang={lang} onOpenInspector={(r) => setSelectedRecord(r)} />}
          </div>
        );

      case 'ai':
        return (
          <div className="bg-card border border-border rounded-2xl p-5 shadow-2xs space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center text-2xl font-bold">
                🤖
              </div>
              <div>
                <h3 className="text-sm font-black text-foreground uppercase tracking-wider">
                  {isEn ? 'AI Attendance Risk & Shift Coverage Advisor' : 'اے آئی ورک فورس مشیر'}
                </h3>
                <p className="text-xs font-bold text-muted-foreground mt-0.5">
                  {isEn ? 'Automated shift coverage optimization & absenteeism risk forecasting.' : 'خودکار شفٹ مینجمنٹ'}
                </p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-muted/40 border border-border text-xs font-bold text-foreground">
              💡 {isEn ? `Recommendation: Shift coverage optimal with ${staffList.length} total staff available.` : 'مشورہ: شفٹ کوریج مکمل ہے۔'}
            </div>
          </div>
        );

      case 'workflow':
        return (
          <div className="space-y-3">
            <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-xl border border-border overflow-x-auto">
              {[
                { id: 'leave', label: 'Leave Management' },
                { id: 'overtime', label: 'Overtime Register' },
                { id: 'incentives', label: 'Sales Commissions' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setWorkflowSubTab(tab.id as any)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                    workflowSubTab === tab.id 
                      ? 'bg-teal-600 text-white shadow-2xs' 
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {workflowSubTab === 'leave' && <StaffLeaveTab lang={lang} onOpenInspector={(r) => setSelectedRecord(r)} />}
            {workflowSubTab === 'overtime' && <StaffOvertimeTab lang={lang} onOpenInspector={(r) => setSelectedRecord(r)} />}
            {workflowSubTab === 'incentives' && <StaffIncentivesTab lang={lang} onOpenInspector={(r) => setSelectedRecord(r)} />}
          </div>
        );

      case 'audit':
        return <StaffAuditTrailTab staffList={staffList} lang={lang} onOpenInspector={(r) => setSelectedRecord(r)} />;

      case 'documents':
        return <StaffDocumentsTab staffList={staffList} lang={lang} />;

      case 'reports':
        return <DomainReportsCenterTab domainName="staff" lang={lang} />;

      case 'settings':
        return (
          <div className="bg-card border border-border rounded-2xl p-5 shadow-2xs space-y-4">
            <h3 className="text-sm font-black text-foreground uppercase tracking-wider">
              {isEn ? 'Attendance Policy & Shift Roster Rules' : 'ورک فورس سیٹنگز'}
            </h3>
            <div className="space-y-3 text-xs font-bold">
              <div className="flex justify-between items-center p-3 rounded-xl bg-muted/40 border border-border">
                <span>{isEn ? 'Standard Shift Duration' : 'شفٹ کا دورانیہ'}</span>
                <span className="font-mono text-teal-600 font-black">8 HOURS / SHIFT</span>
              </div>
              <div className="flex justify-between items-center p-3 rounded-xl bg-muted/40 border border-border">
                <span>{isEn ? 'Overtime Pay Multiplier' : 'اوور ٹائم ملٹی پلائر'}</span>
                <span className="font-mono text-indigo-600 font-black">1.5x BASE RATE</span>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <>
      <UniversalWorkspaceLayout
        lang={lang}
        title="Staff & Workforce Management Control Center"
        titleUr="ورک فورس و ایچ آر کنٹرول سینٹر"
        icon="👥"
        domainName="staff"
        dateFilter={dateFilter}
        onDateFilterChange={setDateFilter}
        renderLayer={renderLayer}
        onNavigateRelated={onSelectReport}
      />

      {/* 7-TAB RIGHT INSPECTOR DRAWER */}
      <RightInspectorPanel
        isOpen={!!selectedRecord}
        onClose={() => setSelectedRecord(null)}
        record={selectedRecord}
        language={lang}
        onNavigateRelated={(repId) => onSelectReport?.(repId)}
      />
    </>
  );
};
