/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * FuelPro Enterprise Reports Platform v2.0
 * Domain: Security
 * Registry: Permission Matrix
 *
 * Centralized RBAC matrix mapping roles to exact enterprise permissions.
 * Rule #126: Single Source of Truth for Permissions.
 */

export type EnterpriseRole = 'OWNER' | 'MANAGER' | 'ACCOUNTANT' | 'OPERATOR' | 'CASHIER' | 'AUDITOR';

export type EnterprisePermission =
  | 'VIEW_EXECUTIVE_DASHBOARD'
  | 'VIEW_FINANCIALS'
  | 'VIEW_INVENTORY'
  | 'EXPORT_REPORTS'
  | 'PRINT_REPORTS'
  | 'APPROVE_TRANSACTIONS'
  | 'EDIT_TRANSACTIONS'
  | 'VIEW_AUDIT_LOGS';

export interface RoleDefinition {
  readonly role: EnterpriseRole;
  readonly nameEn: string;
  readonly nameUr: string;
  readonly allowedPermissions: EnterprisePermission[];
  readonly version: string;
}

class PermissionMatrixImpl {
  private readonly roles: Map<EnterpriseRole, RoleDefinition> = new Map();

  constructor() {
    this.initializeRoles();
  }

  private register(def: RoleDefinition): void {
    this.roles.set(def.role, def);
  }

  get(role: EnterpriseRole): RoleDefinition {
    const r = this.roles.get(role);
    if (!r) throw new Error(`Role not found: ${role}`);
    return r;
  }

  hasPermission(role: EnterpriseRole, permission: EnterprisePermission): boolean {
    const r = this.roles.get(role);
    if (!r) return false;
    return r.allowedPermissions.includes(permission);
  }

  private initializeRoles(): void {
    this.register({
      role: 'OWNER',
      nameEn: 'Owner',
      nameUr: 'مالک',
      allowedPermissions: [
        'VIEW_EXECUTIVE_DASHBOARD', 'VIEW_FINANCIALS', 'VIEW_INVENTORY',
        'EXPORT_REPORTS', 'PRINT_REPORTS', 'APPROVE_TRANSACTIONS',
        'EDIT_TRANSACTIONS', 'VIEW_AUDIT_LOGS'
      ],
      version: '1.0.0'
    });

    this.register({
      role: 'MANAGER',
      nameEn: 'Manager',
      nameUr: 'مینیجر',
      allowedPermissions: [
        'VIEW_FINANCIALS', 'VIEW_INVENTORY', 'EXPORT_REPORTS',
        'PRINT_REPORTS', 'APPROVE_TRANSACTIONS'
      ],
      version: '1.0.0'
    });

    this.register({
      role: 'CASHIER',
      nameEn: 'Cashier',
      nameUr: 'کیشیئر',
      allowedPermissions: ['PRINT_REPORTS'],
      version: '1.0.0'
    });

    this.register({
      role: 'AUDITOR',
      nameEn: 'Auditor',
      nameUr: 'آڈیٹر',
      allowedPermissions: [
        'VIEW_EXECUTIVE_DASHBOARD', 'VIEW_FINANCIALS', 'VIEW_INVENTORY',
        'EXPORT_REPORTS', 'PRINT_REPORTS', 'VIEW_AUDIT_LOGS'
      ],
      version: '1.0.0'
    });
  }
}

export const PermissionMatrix = new PermissionMatrixImpl();
