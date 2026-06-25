/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Shift, Product, Customer, Supplier, ExpenseEntry, Tank, RateHistoryEntry, StaffFinanceEntry, AttendanceRecord, Staff, Nozzle, CogsRecord, AuditTrailEntry } from '../../types';

export interface ReportRow {
  id: string;
  date: string;
  time: string;
  staffName: string;
  role: string;
  sourceRef: string;
  productCategory: string;
  quantity: string;
  rate: string;
  amount: number;
  approvalStatus: string;
  balanceAfter: string;
  // Internal filter helpers
  paymentMode?: string;
  shiftType?: string;
  productId?: string;
  entityName?: string;
  staffId?: string;
}

export interface ReportHeader {
  key: keyof ReportRow | string;
  label: string;
  urduLabel: string;
  isNumeric?: boolean;
}

export interface ReportTemplate {
  id: string;
  category: 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | 'H' | 'I';
  name: string;
  urduName: string;
  description: string;
  urduDescription: string;
  headers: ReportHeader[];
  compile: (data: {
    shifts: Shift[];
    products: Product[];
    customers: Customer[];
    suppliers: Supplier[];
    standaloneExpenses: ExpenseEntry[];
    tanks: Tank[];
    rateHistory: RateHistoryEntry[];
    staffFinance: StaffFinanceEntry[];
    attendance: AttendanceRecord[];
    staff: Staff[];
    nozzles: Nozzle[];
    cogsRecords?: CogsRecord[];
    auditLogs?: AuditTrailEntry[];
  }) => ReportRow[];
}

// ==========================================
