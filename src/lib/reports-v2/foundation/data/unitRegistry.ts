/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * FuelPro Enterprise Reports Platform v2.0
 * Domain: Data
 * Registry: Unit Registry
 *
 * Single Source of Truth for all physical and financial units.
 * Rule #126: No Component may hardcode unit labels or symbols.
 * Rule #127: Versioned Definitions.
 */

export type UnitId =
  | 'LITER'
  | 'PKR'
  | 'KG'
  | 'CELSIUS'
  | 'MM'
  | 'CM'
  | 'PERCENT'
  | 'HOURS'
  | 'DAYS'
  | 'PIECES';

export interface UnitDefinition {
  readonly id: UnitId;
  readonly nameEn: string;
  readonly nameUr: string;
  readonly symbol: string;
  readonly type: 'volume' | 'currency' | 'mass' | 'temperature' | 'length' | 'percentage' | 'time' | 'count';
  readonly version: string;
}

class UnitRegistryImpl {
  private readonly units: Map<UnitId, UnitDefinition> = new Map();

  constructor() {
    this.initializeUnits();
  }

  private register(def: UnitDefinition): void {
    this.units.set(def.id, def);
  }

  get(id: UnitId): UnitDefinition {
    const unit = this.units.get(id);
    if (!unit) throw new Error(`Unit not found in registry: ${id}`);
    return unit;
  }

  getAll(): UnitDefinition[] {
    return Array.from(this.units.values());
  }

  private initializeUnits(): void {
    this.register({
      id: 'LITER',
      nameEn: 'Liter',
      nameUr: 'لیٹر',
      symbol: 'L',
      type: 'volume',
      version: '1.0.0'
    });

    this.register({
      id: 'PKR',
      nameEn: 'Pakistani Rupee',
      nameUr: 'روپے',
      symbol: 'Rs.',
      type: 'currency',
      version: '1.0.0'
    });

    this.register({
      id: 'KG',
      nameEn: 'Kilogram',
      nameUr: 'کلوگرام',
      symbol: 'kg',
      type: 'mass',
      version: '1.0.0'
    });

    this.register({
      id: 'CELSIUS',
      nameEn: 'Celsius',
      nameUr: 'سیلسیس',
      symbol: '°C',
      type: 'temperature',
      version: '1.0.0'
    });

    this.register({
      id: 'MM',
      nameEn: 'Millimeter',
      nameUr: 'ملی میٹر',
      symbol: 'mm',
      type: 'length',
      version: '1.0.0'
    });

    this.register({
      id: 'CM',
      nameEn: 'Centimeter',
      nameUr: 'سینٹی میٹر',
      symbol: 'cm',
      type: 'length',
      version: '1.0.0'
    });

    this.register({
      id: 'PERCENT',
      nameEn: 'Percent',
      nameUr: 'فیصد',
      symbol: '%',
      type: 'percentage',
      version: '1.0.0'
    });

    this.register({
      id: 'HOURS',
      nameEn: 'Hours',
      nameUr: 'گھنٹے',
      symbol: 'hrs',
      type: 'time',
      version: '1.0.0'
    });

    this.register({
      id: 'DAYS',
      nameEn: 'Days',
      nameUr: 'دن',
      symbol: 'days',
      type: 'time',
      version: '1.0.0'
    });

    this.register({
      id: 'PIECES',
      nameEn: 'Pieces',
      nameUr: 'عدد',
      symbol: 'pcs',
      type: 'count',
      version: '1.0.0'
    });
  }
}

export const UnitRegistry = new UnitRegistryImpl();
