/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * FuelPro Enterprise Reports Platform v2.0
 * Domain: Metadata
 * Registry: Naming Standards Registry
 *
 * Enforces Dual Mode naming conventions for reports and modules.
 * Rule #126: Single Source of Truth for Report Names.
 */

export interface DualModeName {
  readonly id: string;
  readonly simpleNameEn: string; // Operator friendly
  readonly simpleNameUr: string;
  readonly enterpriseNameEn: string; // Executive/Enterprise level
  readonly enterpriseNameUr: string;
}

class NamingStandardsRegistryImpl {
  private readonly names: Map<string, DualModeName> = new Map();

  constructor() {
    this.initializeNames();
  }

  private register(def: DualModeName): void {
    this.names.set(def.id, def);
  }

  get(id: string): DualModeName {
    const name = this.names.get(id);
    if (!name) throw new Error(`Name definition not found: ${id}`);
    return name;
  }

  private initializeNames(): void {
    this.register({
      id: 'RPT_TODAY_SALES',
      simpleNameEn: "Today's Sales",
      simpleNameUr: "آج کی فروخت",
      enterpriseNameEn: "Enterprise Revenue Performance Statement",
      enterpriseNameUr: "انٹرپرائز ریونیو پرفارمنس اسٹیٹمنٹ"
    });

    this.register({
      id: 'RPT_STOCK_BALANCE',
      simpleNameEn: "Tank Stock",
      simpleNameUr: "ٹینک اسٹاک",
      enterpriseNameEn: "Consolidated Wet Stock Inventory Valuation",
      enterpriseNameUr: "مجموعی ویٹ اسٹاک انوینٹری ویلیوایشن"
    });
  }
}

export const NamingStandardsRegistry = new NamingStandardsRegistryImpl();
