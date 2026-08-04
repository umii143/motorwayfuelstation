/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * FuelPro Enterprise Reports Platform v2.0
 * Domain: Data
 * Registry: Relationship Registry
 *
 * Defines the hierarchical relationship map between entities.
 * Supports deep drill-downs and cascading rules.
 * Rule #126: Single Source of Truth for Entity Relations.
 */

export type RelationshipType = 'ONE_TO_MANY' | 'MANY_TO_ONE' | 'ONE_TO_ONE' | 'MANY_TO_MANY';

export interface RelationshipDefinition {
  readonly id: string; // e.g. 'station_to_tanks'
  readonly parentCollection: string;
  readonly childCollection: string;
  readonly type: RelationshipType;
  readonly foreignKey: string;
  readonly cascadingDelete: boolean;
  readonly drilldownSupported: boolean;
  readonly version: string;
}

class RelationshipRegistryImpl {
  private readonly relations: Map<string, RelationshipDefinition> = new Map();

  constructor() {
    this.initializeRelations();
  }

  private register(def: RelationshipDefinition): void {
    this.relations.set(def.id, def);
  }

  get(id: string): RelationshipDefinition {
    const rel = this.relations.get(id);
    if (!rel) throw new Error(`Relationship not found in registry: ${id}`);
    return rel;
  }

  getChildrenOf(collectionId: string): RelationshipDefinition[] {
    return Array.from(this.relations.values()).filter(r => r.parentCollection === collectionId);
  }

  getParentsOf(collectionId: string): RelationshipDefinition[] {
    return Array.from(this.relations.values()).filter(r => r.childCollection === collectionId);
  }

  private initializeRelations(): void {
    // Station Hierarchy
    this.register({
      id: 'station_to_branches',
      parentCollection: 'stations',
      childCollection: 'stations', // Self-referential for branches
      type: 'ONE_TO_MANY',
      foreignKey: 'parentStationId',
      cascadingDelete: false,
      drilldownSupported: true,
      version: '1.0.0'
    });

    this.register({
      id: 'station_to_tanks',
      parentCollection: 'stations',
      childCollection: 'tanks',
      type: 'ONE_TO_MANY',
      foreignKey: 'stationId',
      cascadingDelete: false,
      drilldownSupported: true,
      version: '1.0.0'
    });

    this.register({
      id: 'station_to_pumps',
      parentCollection: 'stations',
      childCollection: 'pumps',
      type: 'ONE_TO_MANY',
      foreignKey: 'stationId',
      cascadingDelete: false,
      drilldownSupported: true,
      version: '1.0.0'
    });

    // Pump Hierarchy
    this.register({
      id: 'pump_to_nozzles',
      parentCollection: 'pumps',
      childCollection: 'nozzles',
      type: 'ONE_TO_MANY',
      foreignKey: 'pumpId',
      cascadingDelete: true,
      drilldownSupported: true,
      version: '1.0.0'
    });

    // Operational Hierarchy
    this.register({
      id: 'station_to_shifts',
      parentCollection: 'stations',
      childCollection: 'shifts',
      type: 'ONE_TO_MANY',
      foreignKey: 'stationId',
      cascadingDelete: false,
      drilldownSupported: true,
      version: '1.0.0'
    });

    this.register({
      id: 'shift_to_sales',
      parentCollection: 'shifts',
      childCollection: 'sales',
      type: 'ONE_TO_MANY',
      foreignKey: 'shiftId',
      cascadingDelete: false,
      drilldownSupported: true,
      version: '1.0.0'
    });
  }
}

export const RelationshipRegistry = new RelationshipRegistryImpl();
