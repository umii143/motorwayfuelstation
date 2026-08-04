/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * FuelPro Enterprise Reports Platform v2.0
 * Domain: Data
 * Registry: Data Dictionary
 *
 * The Master Data Dictionary linking collections, fields, and relationships.
 * Rule #126: Single Source of Truth for Entity Definitions.
 */

import { CollectionRegistry, CollectionDefinition } from './collectionRegistry';
import { FieldRegistry, FieldDefinition } from './fieldRegistry';
import { RelationshipRegistry, RelationshipDefinition } from './relationshipRegistry';

export interface EntityDictionaryEntry {
  readonly collection: CollectionDefinition;
  readonly fields: FieldDefinition[];
  readonly childRelations: RelationshipDefinition[];
  readonly parentRelations: RelationshipDefinition[];
  readonly primaryKey: string;
  readonly softDeleteSupported: boolean;
  readonly archivePolicy: string;
}

class DataDictionaryImpl {
  
  /**
   * Get the complete dictionary definition for an entity by collection ID.
   */
  getEntity(collectionId: string): EntityDictionaryEntry {
    return {
      collection: CollectionRegistry.get(collectionId),
      fields: FieldRegistry.getByCollection(collectionId),
      childRelations: RelationshipRegistry.getChildrenOf(collectionId),
      parentRelations: RelationshipRegistry.getParentsOf(collectionId),
      primaryKey: 'id',
      softDeleteSupported: true,
      archivePolicy: 'ARCHIVE_ONLY_NO_PURGE'
    };
  }

  /**
   * Validate if a field belongs to an entity.
   */
  hasField(collectionId: string, fieldName: string): boolean {
    const fields = FieldRegistry.getByCollection(collectionId);
    return fields.some(f => f.fieldName === fieldName);
  }
}

export const DataDictionary = new DataDictionaryImpl();
