/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * FuelPro Enterprise Reports Platform v2.0
 * Domain: Data
 * Registry: Collection Registry
 *
 * Single Source of Truth for all Firebase Collections.
 * Rule #126: No Component may redefine collection metadata.
 * Rule #127: Versioned Definitions.
 */

export type EnterpriseRetentionTier =
  | 'TIER_A_PERMANENT'
  | 'TIER_B_FINANCIAL_10YR'
  | 'TIER_C_OPERATIONAL_10YR'
  | 'TIER_D_AI_CONFIGURABLE'
  | 'TIER_E_AUDIT_IMMUTABLE';

export interface CollectionDefinition {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly tier: EnterpriseRetentionTier;
  readonly indexes: string[];
  readonly isRealtime: boolean;
  readonly offlineSupport: boolean;
  readonly cacheEnabled: boolean;
  readonly ownerRole: string;
  readonly dependencies: string[];
  readonly version: string;
}

class CollectionRegistryImpl {
  private readonly collections: Map<string, CollectionDefinition> = new Map();

  constructor() {
    this.initializeCollections();
  }

  private register(def: CollectionDefinition): void {
    this.collections.set(def.id, def);
  }

  get(id: string): CollectionDefinition {
    const col = this.collections.get(id);
    if (!col) throw new Error(`Collection not found in registry: ${id}`);
    return col;
  }

  getAll(): CollectionDefinition[] {
    return Array.from(this.collections.values());
  }

  private initializeCollections(): void {
    // Tier A - Master Data
    this.register({
      id: 'stations',
      name: 'Stations',
      description: 'Master list of all fuel stations',
      tier: 'TIER_A_PERMANENT',
      indexes: ['idx_stations_status'],
      isRealtime: true,
      offlineSupport: true,
      cacheEnabled: true,
      ownerRole: 'owner',
      dependencies: [],
      version: '1.0.0'
    });

    this.register({
      id: 'tanks',
      name: 'Tanks',
      description: 'Underground and Above-ground Fuel Tanks',
      tier: 'TIER_A_PERMANENT',
      indexes: ['idx_tanks_stationId'],
      isRealtime: true,
      offlineSupport: true,
      cacheEnabled: true,
      ownerRole: 'manager',
      dependencies: ['stations', 'products'],
      version: '1.0.0'
    });

    this.register({
      id: 'products',
      name: 'Products',
      description: 'Master product catalog (Fuel & Lube)',
      tier: 'TIER_A_PERMANENT',
      indexes: ['idx_products_category'],
      isRealtime: true,
      offlineSupport: true,
      cacheEnabled: true,
      ownerRole: 'manager',
      dependencies: [],
      version: '1.0.0'
    });

    this.register({
      id: 'customers',
      name: 'Customers',
      description: 'Credit and corporate customers',
      tier: 'TIER_A_PERMANENT',
      indexes: ['idx_customers_stationId'],
      isRealtime: true,
      offlineSupport: true,
      cacheEnabled: true,
      ownerRole: 'manager',
      dependencies: ['stations'],
      version: '1.0.0'
    });

    this.register({
      id: 'staff',
      name: 'Staff',
      description: 'Employee and operator records',
      tier: 'TIER_A_PERMANENT',
      indexes: ['idx_staff_stationId'],
      isRealtime: true,
      offlineSupport: true,
      cacheEnabled: true,
      ownerRole: 'manager',
      dependencies: ['stations'],
      version: '1.0.0'
    });

    // Tier B - Financial Data
    this.register({
      id: 'sales',
      name: 'Sales',
      description: 'Financial sales records',
      tier: 'TIER_B_FINANCIAL_10YR',
      indexes: ['idx_sales_date_station', 'idx_sales_customer'],
      isRealtime: true,
      offlineSupport: true,
      cacheEnabled: false,
      ownerRole: 'accountant',
      dependencies: ['stations', 'shifts', 'products'],
      version: '1.0.0'
    });

    this.register({
      id: 'ledger',
      name: 'General Ledger',
      description: 'Double-entry accounting ledger',
      tier: 'TIER_B_FINANCIAL_10YR',
      indexes: ['idx_ledger_date_station', 'idx_ledger_account'],
      isRealtime: true,
      offlineSupport: true,
      cacheEnabled: false,
      ownerRole: 'accountant',
      dependencies: ['stations'],
      version: '1.0.0'
    });

    this.register({
      id: 'expenses',
      name: 'Expenses',
      description: 'Operational and standalone expenses',
      tier: 'TIER_B_FINANCIAL_10YR',
      indexes: ['idx_expenses_date_station'],
      isRealtime: true,
      offlineSupport: true,
      cacheEnabled: false,
      ownerRole: 'manager',
      dependencies: ['stations'],
      version: '1.0.0'
    });

    // Tier C - Operational Data
    this.register({
      id: 'shifts',
      name: 'Shifts',
      description: 'Operator shift logs',
      tier: 'TIER_C_OPERATIONAL_10YR',
      indexes: ['idx_shifts_date_station', 'idx_shifts_operator'],
      isRealtime: true,
      offlineSupport: true,
      cacheEnabled: true,
      ownerRole: 'manager',
      dependencies: ['stations', 'staff'],
      version: '1.0.0'
    });
    
    this.register({
      id: 'stockTransactions',
      name: 'Stock Transactions',
      description: 'Inventory receipts and adjustments',
      tier: 'TIER_C_OPERATIONAL_10YR',
      indexes: ['idx_stocktx_date_station'],
      isRealtime: true,
      offlineSupport: true,
      cacheEnabled: false,
      ownerRole: 'manager',
      dependencies: ['stations', 'products', 'tanks'],
      version: '1.0.0'
    });

    // Tier E - Audit Logs
    this.register({
      id: 'audit_logs',
      name: 'Audit Logs',
      description: 'Immutable system audit trail',
      tier: 'TIER_E_AUDIT_IMMUTABLE',
      indexes: ['idx_audit_timestamp_station', 'idx_audit_report'],
      isRealtime: false,
      offlineSupport: false,
      cacheEnabled: false,
      ownerRole: 'auditor',
      dependencies: [],
      version: '1.0.0'
    });
  }
}

export const CollectionRegistry = new CollectionRegistryImpl();
