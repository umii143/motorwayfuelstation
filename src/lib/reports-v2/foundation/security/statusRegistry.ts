/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * FuelPro Enterprise Reports Platform v2.0
 * Domain: Security
 * Registry: Status Registry
 *
 * Standardized status enums and definitions across the enterprise.
 * Never use inconsistent status values.
 */

export type EnterpriseStatusId =
  | 'DRAFT'
  | 'PENDING'
  | 'APPROVED'
  | 'REJECTED'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'FAILED'
  | 'VERIFIED'
  | 'ARCHIVED';

export interface StatusDefinition {
  readonly id: EnterpriseStatusId;
  readonly labelEn: string;
  readonly labelUr: string;
  readonly themeToken: string; // E.g. 'success', 'warning', 'danger'
  readonly version: string;
}

class StatusRegistryImpl {
  private readonly statuses: Map<EnterpriseStatusId, StatusDefinition> = new Map();

  constructor() {
    this.initializeStatuses();
  }

  private register(def: StatusDefinition): void {
    this.statuses.set(def.id, def);
  }

  get(id: EnterpriseStatusId): StatusDefinition {
    const s = this.statuses.get(id);
    if (!s) throw new Error(`Status not found: ${id}`);
    return s;
  }

  private initializeStatuses(): void {
    this.register({ id: 'DRAFT', labelEn: 'Draft', labelUr: 'مسودہ', themeToken: 'neutral', version: '1.0.0' });
    this.register({ id: 'PENDING', labelEn: 'Pending', labelUr: 'زیر التواء', themeToken: 'warning', version: '1.0.0' });
    this.register({ id: 'APPROVED', labelEn: 'Approved', labelUr: 'منظور شدہ', themeToken: 'success', version: '1.0.0' });
    this.register({ id: 'REJECTED', labelEn: 'Rejected', labelUr: 'مسترد شدہ', themeToken: 'danger', version: '1.0.0' });
    this.register({ id: 'COMPLETED', labelEn: 'Completed', labelUr: 'مکمل', themeToken: 'success', version: '1.0.0' });
    this.register({ id: 'CANCELLED', labelEn: 'Cancelled', labelUr: 'منسوخ', themeToken: 'danger', version: '1.0.0' });
    this.register({ id: 'FAILED', labelEn: 'Failed', labelUr: 'ناکام', themeToken: 'danger', version: '1.0.0' });
    this.register({ id: 'VERIFIED', labelEn: 'Verified', labelUr: 'تصدیق شدہ', themeToken: 'primary', version: '1.0.0' });
    this.register({ id: 'ARCHIVED', labelEn: 'Archived', labelUr: 'آرکائیو', themeToken: 'muted', version: '1.0.0' });
  }
}

export const StatusRegistry = new StatusRegistryImpl();
