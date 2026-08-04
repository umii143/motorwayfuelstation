/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * FuelPro Enterprise Reports Platform v2.0
 * Domain: Data
 * Registry: Field Registry
 *
 * Single Source of Truth for all Firebase Fields across the platform.
 * Defines types, units, and validation rules.
 * Rule #126: No Component may redefine field metadata.
 * Rule #127: Versioned Definitions.
 */

import { UnitId } from './unitRegistry';

export type FieldType = 'string' | 'number' | 'boolean' | 'date' | 'timestamp' | 'object' | 'array';

export interface FieldDefinition {
  readonly id: string; // e.g., 'tank.currentVolume'
  readonly collectionId: string;
  readonly fieldName: string;
  readonly type: FieldType;
  readonly unitId?: UnitId;
  readonly isNullable: boolean;
  readonly validation?: (val: any) => boolean;
  readonly descriptionEn: string;
  readonly version: string;
}

class FieldRegistryImpl {
  private readonly fields: Map<string, FieldDefinition> = new Map();

  constructor() {
    this.initializeFields();
  }

  private register(def: FieldDefinition): void {
    this.fields.set(def.id, def);
  }

  get(id: string): FieldDefinition {
    const field = this.fields.get(id);
    if (!field) throw new Error(`Field not found in registry: ${id}`);
    return field;
  }

  getByCollection(collectionId: string): FieldDefinition[] {
    return Array.from(this.fields.values()).filter(f => f.collectionId === collectionId);
  }

  private initializeFields(): void {
    // Tanks
    this.register({
      id: 'tanks.currentVolume',
      collectionId: 'tanks',
      fieldName: 'currentVolume',
      type: 'number',
      unitId: 'LITER',
      isNullable: false,
      validation: (val) => typeof val === 'number' && val >= 0,
      descriptionEn: 'Current fuel volume in tank',
      version: '1.0.0'
    });

    this.register({
      id: 'tanks.waterLevel',
      collectionId: 'tanks',
      fieldName: 'waterLevel',
      type: 'number',
      unitId: 'MM',
      isNullable: false,
      validation: (val) => typeof val === 'number' && val >= 0,
      descriptionEn: 'Water level at bottom of tank',
      version: '1.0.0'
    });

    // Sales
    this.register({
      id: 'sales.amount',
      collectionId: 'sales',
      fieldName: 'amount',
      type: 'number',
      unitId: 'PKR',
      isNullable: false,
      validation: (val) => typeof val === 'number' && val >= 0,
      descriptionEn: 'Total sale amount',
      version: '1.0.0'
    });

    this.register({
      id: 'sales.quantity',
      collectionId: 'sales',
      fieldName: 'quantity',
      type: 'number',
      unitId: 'LITER', // Or pieces for lube
      isNullable: false,
      validation: (val) => typeof val === 'number' && val >= 0,
      descriptionEn: 'Quantity sold',
      version: '1.0.0'
    });

    // Shifts
    this.register({
      id: 'shifts.submittedCash',
      collectionId: 'shifts',
      fieldName: 'submittedCash',
      type: 'number',
      unitId: 'PKR',
      isNullable: false,
      validation: (val) => typeof val === 'number' && val >= 0,
      descriptionEn: 'Cash submitted by operator',
      version: '1.0.0'
    });
  }
}

export const FieldRegistry = new FieldRegistryImpl();
