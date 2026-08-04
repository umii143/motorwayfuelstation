/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * FuelPro Enterprise Reports Platform v2.0
 * Domain: Metadata
 * Registry: Drilldown Registry
 *
 * The most critical registry mapping how KPIs navigate to source documents.
 */

export interface DrilldownDefinition {
  readonly id: string;
  readonly targetType: 'VIEW' | 'MODAL' | 'REGISTER' | 'FIREBASE_DOC' | 'JOURNAL';
  readonly targetId: string; // Route ID or Component ID
  readonly requiredParams: string[];
  readonly permissionRequired: string;
  readonly version: string;
}

class DrilldownRegistryImpl {
  private readonly drilldowns: Map<string, DrilldownDefinition> = new Map();

  constructor() {
    this.initializeDrilldowns();
  }

  private register(def: DrilldownDefinition): void {
    this.drilldowns.set(def.id, def);
  }

  get(id: string): DrilldownDefinition {
    const dd = this.drilldowns.get(id);
    if (!dd) throw new Error(`Drilldown not found: ${id}`);
    return dd;
  }

  private initializeDrilldowns(): void {
    this.register({
      id: 'DD_INVOICE_DETAIL',
      targetType: 'MODAL',
      targetId: 'InvoiceViewerModal',
      requiredParams: ['invoiceId', 'stationId'],
      permissionRequired: 'read_sales',
      version: '1.0.0'
    });

    this.register({
      id: 'DD_SALES_LEDGER',
      targetType: 'REGISTER',
      targetId: 'REG_SALES_MASTER',
      requiredParams: ['dateRange', 'stationId'],
      permissionRequired: 'read_sales',
      version: '1.0.0'
    });

    this.register({
      id: 'DD_TANK_DIP_LOGS',
      targetType: 'REGISTER',
      targetId: 'REG_TANK_DIPS',
      requiredParams: ['tankId', 'stationId'],
      permissionRequired: 'read_inventory',
      version: '1.0.0'
    });
  }
}

export const DrilldownRegistry = new DrilldownRegistryImpl();
