/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * FuelPro Enterprise Reports Platform v2.0
 * Domain: Metadata
 * Registry: Register Registry
 *
 * Defines physical registers and tables (Sales Register, Expense Register).
 */

export interface RegisterColumn {
  readonly fieldId: string; // Refers to FieldRegistry
  readonly isSortable: boolean;
  readonly isFilterable: boolean;
  readonly alignment: 'left' | 'center' | 'right';
  readonly isVisibleByDefault: boolean;
}

export interface RegisterDefinition {
  readonly id: string;
  readonly nameEn: string;
  readonly nameUr: string;
  readonly collectionId: string;
  readonly columns: RegisterColumn[];
  readonly defaultSort: { fieldId: string; direction: 'asc' | 'desc' };
  readonly supportedFilters: string[]; // Refers to FilterRegistry
  readonly hasTotalsRow: boolean;
  readonly exportSupported: boolean;
  readonly printSupported: boolean;
  readonly drilldownTargetId: string | null;
  readonly version: string;
}

class RegisterRegistryImpl {
  private readonly registers: Map<string, RegisterDefinition> = new Map();

  constructor() {
    this.initializeRegisters();
  }

  private register(def: RegisterDefinition): void {
    this.registers.set(def.id, def);
  }

  get(id: string): RegisterDefinition {
    const reg = this.registers.get(id);
    if (!reg) throw new Error(`Register not found: ${id}`);
    return reg;
  }

  private initializeRegisters(): void {
    this.register({
      id: 'REG_SALES_MASTER',
      nameEn: 'Master Sales Register',
      nameUr: 'ماسٹر سیلز رجسٹر',
      collectionId: 'sales',
      columns: [
        { fieldId: 'sales.date', isSortable: true, isFilterable: true, alignment: 'left', isVisibleByDefault: true },
        { fieldId: 'sales.amount', isSortable: true, isFilterable: false, alignment: 'right', isVisibleByDefault: true },
        { fieldId: 'sales.quantity', isSortable: true, isFilterable: false, alignment: 'right', isVisibleByDefault: true }
      ],
      defaultSort: { fieldId: 'sales.date', direction: 'desc' },
      supportedFilters: ['FLT_DATE_RANGE', 'FLT_STAFF', 'FLT_PRODUCT'],
      hasTotalsRow: true,
      exportSupported: true,
      printSupported: true,
      drilldownTargetId: 'DD_INVOICE_DETAIL',
      version: '1.0.0'
    });
  }
}

export const RegisterRegistry = new RegisterRegistryImpl();
