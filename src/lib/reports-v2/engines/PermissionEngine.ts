/**
 * @license SPDX-License-Identifier: Apache-2.0
 *
 * FuelPro Enterprise Reports Platform v3.0
 * Permission Engine (Phase 9 C.1 Step 9)
 *
 * A single `visibleTo` filter function applied at the top of the
 * report-rendering pipeline. Enforces RBAC across all reports.
 *
 * P1 (True Profit) is deliberately the single most restricted report —
 * Owner-only, no exceptions.
 *
 * ARCHITECTURAL RULE:
 * No UI. Pure permission check. Reads from ReportConfig.visibleTo array.
 */

import { logger } from '../../logger';
import { ReportConfig } from './types';

// ──────────────────────────────────────────────
// ROLE HIERARCHY
// ──────────────────────────────────────────────

const ROLE_LEVELS: Record<string, number> = {
  'Staff': 0,
  'Cashier': 0,
  'Accountant': 1,
  'Manager': 2,
  'Owner': 3,
  'Admin': 4,
};

// ──────────────────────────────────────────────
// DEFAULT PERMISSION MATRIX
// Mirrors the PRD Part 5 role-based visibility table.
// Report configs can override via visibleTo array.
// ──────────────────────────────────────────────

const DEFAULT_PERMISSIONS: Record<string, string[]> = {
  // Dashboards/Summaries (A, D, K, Q, Y, Z)
  'A': ['Owner', 'Manager', 'Accountant'],
  'D': ['Owner', 'Manager', 'Accountant'],
  'K': ['Owner'],
  'Q': ['Owner'],
  'Y': ['Owner', 'Accountant'],
  'Z': ['Owner', 'Manager', 'Accountant'],

  // Cash/Bank/Digital Ledgers (B, D2, C1)
  'B': ['Owner', 'Manager', 'Accountant'],
  'D2': ['Owner', 'Manager', 'Accountant'],
  'C1': ['Owner', 'Manager', 'Accountant'],

  // Variance/Credit-Given (C2, C3, V)
  'C2': ['Owner', 'Manager'],
  'C3': ['Owner', 'Manager'],
  'V': ['Owner', 'Manager'],

  // Expenses/Manual Entries (E, J)
  'E': ['Owner', 'Manager', 'Accountant'],
  'J': ['Owner', 'Accountant'],

  // Fuel/Stock/Readings/Tank (F, I, M, N, T2, T3)
  'F': ['Owner', 'Manager'],
  'I': ['Owner', 'Manager'],
  'M': ['Owner', 'Manager'],
  'N': ['Owner', 'Manager'],
  'T2': ['Owner', 'Manager'],
  'T3': ['Owner', 'Manager'],

  // General Ledger (G)
  'G': ['Owner', 'Accountant'],

  // Purchase/Supplier Spend (H, P2)
  'H': ['Owner', 'Manager', 'Accountant'],
  'P2': ['Owner', 'Manager', 'Accountant'],

  // Customer Ledger/Udhaar (L1, U)
  'L1': ['Owner', 'Manager', 'Accountant'],
  'U': ['Owner', 'Manager', 'Accountant'],

  // Supplier Ledger/Payments (L2, S3)
  'L2': ['Owner', 'Manager', 'Accountant'],
  'S3': ['Owner', 'Manager', 'Accountant'],

  // Aging (O)
  'O': ['Owner', 'Manager', 'Accountant'],

  // True Profit (P1) — OWNER ONLY, NO EXCEPTIONS
  'P1': ['Owner'],

  // Rate Change History (R1)
  'R1': ['Owner', 'Manager'],

  // Recoveries (R2)
  'R2': ['Owner', 'Manager'],

  // Sales/Shift Logs (S, S2)
  'S': ['Owner', 'Manager', 'Accountant'],
  'S2': ['Owner', 'Manager', 'Accountant'],

  // Staff/Salary (S1, W1)
  'S1': ['Owner', 'Accountant'],
  'W1': ['Owner', 'Accountant'],

  // Tax/OGRA (T1)
  'T1': ['Owner', 'Accountant'],

  // WhatsApp Log (W2)
  'W2': ['Owner', 'Manager'],

  // Live Shift Snapshot (X)
  'X': ['Owner', 'Manager'],
};

export class PermissionEngine {
  private static instance: PermissionEngine;

  private constructor() {}

  static getInstance(): PermissionEngine {
    if (!PermissionEngine.instance) {
      PermissionEngine.instance = new PermissionEngine();
    }
    return PermissionEngine.instance;
  }

  /**
   * Checks if a user role can access a report.
   *
   * Priority:
   * 1. If ReportConfig has visibleTo array, use that
   * 2. Otherwise, fall back to DEFAULT_PERMISSIONS
   * 3. If no permission found, deny access (fail-safe)
   *
   * @param reportId - The report ID (e.g., 'P1', 'A', 'C2')
   * @param role - User's role (Owner, Manager, Cashier, Accountant)
   * @param config - Optional ReportConfig with explicit visibleTo
   * @returns true if the user can access the report
   */
  canAccess(reportId: string, role: string, config?: ReportConfig): boolean {
    const normRole = (role || 'owner').toLowerCase();

    // If config provides visibleTo, use that
    if (config?.visibleTo && config.visibleTo.length > 0) {
      const hasAccess = config.visibleTo.some(r => r.toLowerCase() === normRole);
      if (!hasAccess) {
        logger.info(
          `[PermissionEngine] Access denied: ${role} cannot access report ${reportId} (visibleTo: ${config.visibleTo.join(', ')})`
        );
      }
      return hasAccess;
    }

    // Fall back to default permissions
    const allowedRoles = DEFAULT_PERMISSIONS[reportId];
    if (!allowedRoles) {
      // Unknown report — deny by default (fail-safe)
      logger.warn(`[PermissionEngine] No permission matrix for report ${reportId}. Denying access.`);
      return false;
    }

    const hasAccess = allowedRoles.some(r => r.toLowerCase() === normRole);
    if (!hasAccess) {
      logger.info(
        `[PermissionEngine] Access denied: ${role} cannot access report ${reportId} (allowed: ${allowedRoles.join(', ')})`
      );
    }
    return hasAccess;
  }

  /**
   * Filters a list of report configs to only those the user can access.
   *
   * @param configs - Array of ReportConfig
   * @param role - User's role
   * @returns Filtered array of accessible reports
   */
  filterAccessible(configs: ReportConfig[], role: string): ReportConfig[] {
    return configs.filter(config => this.canAccess(config.reportId, role, config));
  }

  /**
   * Gets the role level for a given role string.
   * Higher number = more permissions.
   */
  getRoleLevel(role: string): number {
    return ROLE_LEVELS[role] ?? -1;
  }

  /**
   * Checks if a role has at least the minimum required level.
   */
  hasMinimumRole(role: string, minRole: string): boolean {
    return this.getRoleLevel(role) >= this.getRoleLevel(minRole);
  }

  /**
   * Returns the default allowed roles for a report ID.
   * Used by Settings UI to show/edit permissions.
   */
  getDefaultAllowedRoles(reportId: string): string[] {
    return DEFAULT_PERMISSIONS[reportId] ?? [];
  }

  /**
   * Returns all report IDs in the permission matrix.
   */
  getAllReportIds(): string[] {
    return Object.keys(DEFAULT_PERMISSIONS);
  }
}