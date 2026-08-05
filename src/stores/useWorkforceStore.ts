import { create } from 'zustand';
import {
  Staff,
  WorkforceAttendanceRecord,
  WorkforceLeaveRequest,
  WorkforcePayrollRecord,
  WorkforcePerformanceRecord,
  WorkforceOvertimeRecord,
  WorkforceTrainingRecord,
  WorkforceDocumentRecord,
  WorkforceAuditEvent,
  WorkforceAnnouncement,
  RealtimeWorkforceKPIs
} from '../types';
import { workforceEngine } from '../services/workforceEngine';
import { db } from '../data/db';

interface WorkforceStoreState {
  employees: Staff[];
  attendance: WorkforceAttendanceRecord[];
  leaveRequests: WorkforceLeaveRequest[];
  payroll: WorkforcePayrollRecord[];
  overtime: WorkforceOvertimeRecord[];
  performance: WorkforcePerformanceRecord[];
  training: WorkforceTrainingRecord[];
  documents: WorkforceDocumentRecord[];
  auditLogs: WorkforceAuditEvent[];
  announcements: WorkforceAnnouncement[];
  
  isSubscribed: boolean;
  activeOrgId: string;
  activeStationId: string;

  // Actions
  initRealtimeListeners: (orgId: string, stationId: string) => () => void;
  clockIn: (staffId: string, staffName: string, location?: string) => Promise<void>;
  clockOut: (staffId: string, staffName: string) => Promise<void>;
  submitLeaveRequest: (request: WorkforceLeaveRequest) => Promise<void>;
  approveLeaveRequest: (requestId: string, approverName: string) => Promise<void>;
  rejectLeaveRequest: (requestId: string, approverName: string, reason?: string) => Promise<void>;
  generatePayrollForMonth: (month: string) => Promise<void>;
  payEmployeeSalary: (payrollId: string, mode: 'cash' | 'bank') => Promise<void>;

  // Selectors
  getKPIs: () => RealtimeWorkforceKPIs;
}

export const useWorkforceStore = create<WorkforceStoreState>((set, get) => ({
  employees: [],
  attendance: [],
  leaveRequests: [],
  payroll: [],
  overtime: [],
  performance: [],
  training: [],
  documents: [],
  auditLogs: [],
  announcements: [],

  isSubscribed: false,
  activeOrgId: '',
  activeStationId: '',

  initRealtimeListeners: (orgId: string, stationId: string) => {
    set({ activeOrgId: orgId, activeStationId: stationId, isSubscribed: true });

    const unsubEmp = workforceEngine.subscribeEmployees(orgId, stationId, (data) => set({ employees: data }));
    const unsubAtt = workforceEngine.subscribeAttendance(orgId, stationId, (data) => set({ attendance: data }));
    const unsubLeave = workforceEngine.subscribeLeaveRequests(orgId, stationId, (data) => set({ leaveRequests: data }));
    const unsubPay = workforceEngine.subscribePayroll(orgId, stationId, (data) => set({ payroll: data }));
    const unsubOT = workforceEngine.subscribeOvertime(orgId, stationId, (data) => set({ overtime: data }));
    const unsubPerf = workforceEngine.subscribePerformance(orgId, stationId, (data) => set({ performance: data }));
    const unsubTrain = workforceEngine.subscribeTraining(orgId, stationId, (data) => set({ training: data }));
    const unsubDoc = workforceEngine.subscribeDocuments(orgId, stationId, (data) => set({ documents: data }));
    const unsubAudit = workforceEngine.subscribeAuditEvents(orgId, stationId, (data) => set({ auditLogs: data }));
    const unsubAnn = workforceEngine.subscribeAnnouncements(orgId, stationId, (data) => set({ announcements: data }));

    return () => {
      unsubEmp();
      unsubAtt();
      unsubLeave();
      unsubPay();
      unsubOT();
      unsubPerf();
      unsubTrain();
      unsubDoc();
      unsubAudit();
      unsubAnn();
      set({ isSubscribed: false });
    };
  },

  clockIn: async (staffId: string, staffName: string, location?: string) => {
    const { activeOrgId, activeStationId } = get();
    const orgId = activeOrgId || 'org_main';
    const stationId = activeStationId || db.getActiveStationId();
    await workforceEngine.clockInEmployee(orgId, stationId, staffId, staffName, location);
  },

  clockOut: async (staffId: string, staffName: string) => {
    const { activeOrgId, activeStationId } = get();
    const orgId = activeOrgId || 'org_main';
    const stationId = activeStationId || db.getActiveStationId();
    await workforceEngine.clockOutEmployee(orgId, stationId, staffId, staffName);
  },

  submitLeaveRequest: async (request: WorkforceLeaveRequest) => {
    const { activeOrgId, activeStationId } = get();
    const orgId = activeOrgId || 'org_main';
    const stationId = activeStationId || db.getActiveStationId();
    
    // Save document
    const { firestoreDb } = await import('../data/firestore');
    await firestoreDb.saveDocument(orgId, stationId, 'fuel_station', 'fuelpro_leave_requests', request.id, request);
    
    await workforceEngine.logAuditEvent(orgId, stationId, {
      userId: request.employeeId,
      userName: request.employeeName,
      eventType: 'EMPLOYEE_UPDATED',
      details: `Submitted ${request.leaveType} leave request for ${request.totalDays} days (${request.startDate} to ${request.endDate})`,
      impactedRecordId: request.id
    });
  },

  approveLeaveRequest: async (requestId: string, approverName: string) => {
    const { activeOrgId, activeStationId, leaveRequests } = get();
    const orgId = activeOrgId || 'org_main';
    const stationId = activeStationId || db.getActiveStationId();

    const target = leaveRequests.find((r) => r.id === requestId);
    if (!target) return;

    const updated: WorkforceLeaveRequest = {
      ...target,
      status: 'approved',
      approvedBy: approverName
    };

    const { firestoreDb } = await import('../data/firestore');
    await firestoreDb.saveDocument(orgId, stationId, 'fuel_station', 'fuelpro_leave_requests', requestId, updated);

    await workforceEngine.logAuditEvent(orgId, stationId, {
      userId: target.employeeId,
      userName: target.employeeName,
      userRole: 'Manager',
      eventType: 'LEAVE_APPROVED',
      details: `Approved ${target.leaveType} leave for ${target.employeeName} (${target.totalDays} days)`,
      impactedRecordId: requestId
    });
  },

  rejectLeaveRequest: async (requestId: string, approverName: string, reason?: string) => {
    const { activeOrgId, activeStationId, leaveRequests } = get();
    const orgId = activeOrgId || 'org_main';
    const stationId = activeStationId || db.getActiveStationId();

    const target = leaveRequests.find((r) => r.id === requestId);
    if (!target) return;

    const updated: WorkforceLeaveRequest = {
      ...target,
      status: 'rejected',
      approvedBy: approverName,
      actionReason: reason
    };

    const { firestoreDb } = await import('../data/firestore');
    await firestoreDb.saveDocument(orgId, stationId, 'fuel_station', 'fuelpro_leave_requests', requestId, updated);
  },

  generatePayrollForMonth: async (month: string) => {
    const { activeOrgId, activeStationId, employees } = get();
    const orgId = activeOrgId || 'org_main';
    const stationId = activeStationId || db.getActiveStationId();
    const { firestoreDb } = await import('../data/firestore');

    for (const emp of employees) {
      const docId = `pay_${month}_${emp.id}`;
      const baseSalary = emp.salary || 35000;
      const fuelAllowance = 4500;
      const housingAllowance = 5500;
      const commission = 2500;
      const bonus = 1500;
      const overtimePay = 3000;
      const grossSalary = baseSalary + fuelAllowance + housingAllowance + commission + bonus + overtimePay;

      const advancesDeduction = (emp.advanceBalance || 0) > 5000 ? 5000 : (emp.advanceBalance || 0);
      const loanDeduction = (emp.loanBalance || 0) > 3000 ? 3000 : 0;
      const taxDeduction = grossSalary > 100000 ? Math.round((grossSalary - 100000) * 0.05) : 0;
      const eobiDeduction = Math.round(baseSalary * 0.01);
      const totalDeductions = advancesDeduction + loanDeduction + taxDeduction + eobiDeduction;
      const netSalary = grossSalary - totalDeductions;

      const record: WorkforcePayrollRecord = {
        id: docId,
        employeeId: emp.id,
        employeeName: emp.name,
        month,
        baseSalary,
        fuelAllowance,
        housingAllowance,
        commission,
        bonus,
        overtimePay,
        grossSalary,
        advancesDeduction,
        loanDeduction,
        taxDeduction,
        eobiDeduction,
        totalDeductions,
        netSalary,
        status: 'due'
      };

      await firestoreDb.saveDocument(orgId, stationId, 'fuel_station', 'fuelpro_payroll', docId, record);
    }

    await workforceEngine.logAuditEvent(orgId, stationId, {
      userId: 'system',
      userName: 'Manager',
      eventType: 'PAYROLL_APPROVED',
      details: `Generated enterprise payroll for month ${month} for ${employees.length} employees with FBR Tax & EOBI deductions`
    });
  },

  payEmployeeSalary: async (payrollId: string, mode: 'cash' | 'bank') => {
    const { activeOrgId, activeStationId, payroll } = get();
    const orgId = activeOrgId || 'org_main';
    const stationId = activeStationId || db.getActiveStationId();

    const target = payroll.find((p) => p.id === payrollId);
    if (!target) return;

    const updated: WorkforcePayrollRecord = {
      ...target,
      status: 'paid',
      paidAt: new Date().toISOString(),
      paymentMode: mode,
      transactionRef: `TXN_PAY_${Date.now()}`
    };

    const { firestoreDb } = await import('../data/firestore');
    await firestoreDb.saveDocument(orgId, stationId, 'fuel_station', 'fuelpro_payroll', payrollId, updated);

    await workforceEngine.logAuditEvent(orgId, stationId, {
      userId: target.employeeId,
      userName: target.employeeName,
      eventType: 'PAYROLL_APPROVED',
      details: `Paid Rs. ${target.netSalary.toLocaleString()} salary to ${target.employeeName} via ${mode.toUpperCase()}`,
      impactedRecordId: payrollId
    });
  },

  getKPIs: () => {
    const { employees, attendance, leaveRequests, payroll, performance } = get();
    return workforceEngine.computeKPIs(employees, attendance, leaveRequests, payroll, performance);
  }
}));
