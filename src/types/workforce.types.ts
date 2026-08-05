import { TenantDocument } from '../types';

export type WorkforceDutyStatus = 'on_duty' | 'off_duty' | 'break' | 'leave' | 'late';

export type WorkforceLeaveType = 'annual' | 'casual' | 'sick' | 'unpaid';

export type WorkforceLeaveStatus = 'pending' | 'approved' | 'rejected';

export type WorkforcePayrollStatus = 'due' | 'paid' | 'pending';

export type WorkforceDepartment = 
  | 'Fuel Operations'
  | 'Lube POS & Retail'
  | 'CNG Operations'
  | 'Cash & Accounts'
  | 'Station Maintenance'
  | 'Security & Safety'
  | 'Executive Management';

export type WorkforceUserRole = 
  | 'hr_manager'
  | 'payroll_officer'
  | 'supervisor'
  | 'cashier'
  | 'salesman'
  | 'owner'
  | 'manager';

export type WorkforceEventType = 
  | 'CLOCK_IN'
  | 'CLOCK_OUT'
  | 'SHIFT_OPEN'
  | 'SHIFT_CLOSE'
  | 'PAYROLL_APPROVED'
  | 'LEAVE_APPROVED'
  | 'EMPLOYEE_CREATED'
  | 'EMPLOYEE_UPDATED'
  | 'PERFORMANCE_UPDATED'
  | 'NOZZLE_ASSIGNED';

export interface WorkforceNozzleAssignment extends TenantDocument {
  id: string;
  operatorId: string;
  operatorName: string;
  pumpId: string;
  pumpName: string;
  nozzleId: string;
  nozzleName: string;
  fuelType: 'petrol' | 'diesel' | 'kerosene' | 'ldo';
  status: 'running' | 'paused' | 'idle';
  shiftId: string;
  assignedAt: string;
}

export interface WorkforceShiftAssignment {
  employeeId: string;
  role: 'supervisor' | 'cashier' | 'operator' | 'manager';
  locationName: string; // e.g. "Pump 1", "Nozzle 01", "Cash Counter 1", "Tank Area"
  shiftId: string;
  assignedAt: string;
  branchId?: string;
  branchName?: string;
  departmentName?: WorkforceDepartment;
}

export interface WorkforceAttendanceRecord extends TenantDocument {
  id: string;
  employeeId: string;
  branchId?: string;
  branchName?: string;
  departmentName?: WorkforceDepartment;
  date: string; // YYYY-MM-DD
  clockIn: string; // ISO or HH:mm
  clockOut?: string; // ISO or HH:mm
  status: 'present' | 'absent' | 'late' | 'leave' | 'half_day';
  workingHours?: number;
  locationAssigned?: string;
  nozzleAssigned?: string;
  overtimeHours?: number;
  notes?: string;
}

export interface WorkforceLeaveRequest extends TenantDocument {
  id: string;
  employeeId: string;
  employeeName: string;
  branchId?: string;
  branchName?: string;
  departmentName?: WorkforceDepartment;
  leaveType: WorkforceLeaveType;
  startDate: string;
  endDate: string;
  totalDays: number;
  reason: string;
  status: WorkforceLeaveStatus;
  substituteStaffId?: string;
  substituteStaffName?: string;
  approvedBy?: string;
  actionReason?: string;
  createdAt?: any;
}

export interface WorkforcePayrollRecord extends TenantDocument {
  id: string;
  employeeId: string;
  employeeName: string;
  branchId?: string;
  branchName?: string;
  departmentName?: WorkforceDepartment;
  month: string; // YYYY-MM
  baseSalary: number;
  fuelAllowance: number;
  housingAllowance: number;
  commission: number;
  bonus: number;
  overtimePay: number;
  grossSalary: number;
  advancesDeduction: number;
  loanDeduction: number;
  taxDeduction: number; // FBR Tax withholding
  eobiDeduction: number; // EOBI / Social Security contribution
  totalDeductions: number;
  netSalary: number;
  status: WorkforcePayrollStatus;
  paidAt?: string;
  paymentMode?: 'cash' | 'bank';
  transactionRef?: string;
}

export interface WorkforcePerformanceRecord extends TenantDocument {
  id: string;
  employeeId: string;
  employeeName: string;
  branchId?: string;
  branchName?: string;
  departmentName?: WorkforceDepartment;
  transactionsCount: number;
  fuelSoldVolume: number;
  revenueGenerated: number;
  customerRating: number; // 1 to 5
  attendancePercentage: number; // 0 to 100
  punctualityScore: number; // 0 to 100
  cashDifference: number; // 0 (exact), negative (shortage), positive (excess)
  targetAchievementPercent: number; // 0 to 100
  overallScore: number; // 0 to 100
  updatedAt?: any;
}

export interface WorkforceOvertimeRecord extends TenantDocument {
  id: string;
  employeeId: string;
  date: string;
  hours: number;
  ratePerHour: number;
  totalAmount: number;
  approved: boolean;
}

export interface WorkforceTrainingRecord extends TenantDocument {
  id: string;
  employeeId: string;
  title: string;
  category: 'Safety' | 'POS Operation' | 'Customer Service' | 'Compliance';
  completionDate?: string;
  status: 'completed' | 'in_progress' | 'scheduled';
}

export interface WorkforceDocumentRecord extends TenantDocument {
  id: string;
  employeeId: string;
  docName: string;
  docType: 'CNIC' | 'Contract' | 'Medical' | 'DrivingLicense' | 'Other';
  fileUrl?: string;
  issueDate?: string;
  expiryDate?: string;
  status: 'valid' | 'expiring' | 'expired';
}

export interface WorkforceAuditEvent extends TenantDocument {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  userRole?: string;
  branchName?: string;
  eventType: WorkforceEventType;
  details: string;
  impactedRecordId?: string;
}

export interface WorkforceAnnouncement extends TenantDocument {
  id: string;
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  createdAt?: any;
  createdBy?: string;
}

export interface RealtimeWorkforceKPIs {
  totalEmployees: number;
  presentNow: number;
  currentlyOnShift: number;
  lateToday: number;
  overtimeRunning: number;
  payrollDueAmount: number;
  payrollProcessedPercent: number;
  todayAttendancePercent: number;
  averagePerformanceScore: number;
  employeesOnLeave: number;
  absentToday: number;
  topPerformerName: string;
  topPerformerScore: number;
}

export interface WorkforceExpiryAlert {
  id: string;
  employeeId: string;
  employeeName: string;
  alertType: 'cnic_expiry' | 'contract_expiry' | 'license_expiry' | 'late_arrival' | 'payroll_pending';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  details: string;
  expiryDate?: string;
}
