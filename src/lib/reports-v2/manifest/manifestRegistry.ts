/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * FuelPro Enterprise Reports Platform v2.0 — Manifest Registry
 *
 * The SINGLE SOURCE OF TRUTH for every report manifest in the platform.
 * Reports are registered here with full schema validation.
 * Phase 1: Infrastructure only — no reports registered.
 *
 * Rule #125: Every report originates from a validated manifest.
 */

import type { EnterpriseReportManifest, IntelligenceLayerId } from '../types/enterpriseReportTypes';
import { logger } from '../../logger';

/**
 * Validates a manifest has all required fields and structural integrity.
 */
function validateManifest(manifest: EnterpriseReportManifest): string[] {
  const errors: string[] = [];

  if (!manifest.id || manifest.id.trim() === '') {
    errors.push('Manifest ID is required.');
  }
  if (!manifest.layer) {
    errors.push(`Manifest ${manifest.id}: Intelligence layer is required.`);
  }
  if (!manifest.simpleNameEn || manifest.simpleNameEn.trim() === '') {
    errors.push(`Manifest ${manifest.id}: simpleNameEn is required.`);
  }
  if (!manifest.simpleNameUr || manifest.simpleNameUr.trim() === '') {
    errors.push(`Manifest ${manifest.id}: simpleNameUr is required.`);
  }
  if (!manifest.enterpriseNameEn || manifest.enterpriseNameEn.trim() === '') {
    errors.push(`Manifest ${manifest.id}: enterpriseNameEn is required.`);
  }
  if (!manifest.collections || manifest.collections.length === 0) {
    errors.push(`Manifest ${manifest.id}: At least one Firebase collection is required.`);
  }
  if (!manifest.requiredPermissions || manifest.requiredPermissions.length === 0) {
    errors.push(`Manifest ${manifest.id}: At least one RBAC role permission is required.`);
  }
  if (!manifest.exports || manifest.exports.length === 0) {
    errors.push(`Manifest ${manifest.id}: At least one export format is required.`);
  }
  if (manifest.readinessScore < 0 || manifest.readinessScore > 100) {
    errors.push(`Manifest ${manifest.id}: readinessScore must be between 0 and 100.`);
  }
  if (!manifest.version || manifest.version.trim() === '') {
    errors.push(`Manifest ${manifest.id}: version is required.`);
  }

  return errors;
}

class ManifestRegistryImpl {
  private readonly manifests: Map<string, EnterpriseReportManifest> = new Map();
  private readonly validationErrors: Map<string, string[]> = new Map();

  /**
   * Register a report manifest with full schema validation.
   * Rejects manifests that fail validation.
   */
  register(manifest: EnterpriseReportManifest): { success: boolean; errors: string[] } {
    const errors = validateManifest(manifest);

    if (errors.length > 0) {
      this.validationErrors.set(manifest.id, errors);
      logger.error(`[ManifestRegistry] Manifest ${manifest.id} rejected:`, errors);
      return { success: false, errors };
    }

    if (this.manifests.has(manifest.id)) {
      logger.warn(`[ManifestRegistry] Overwriting existing manifest: ${manifest.id}`);
    }

    this.manifests.set(manifest.id, manifest);
    return { success: true, errors: [] };
  }

  /**
   * Retrieve a manifest by ID. Returns null if not found.
   */
  get(id: string): EnterpriseReportManifest | null {
    return this.manifests.get(id) ?? null;
  }

  /**
   * Retrieve all manifests for a given intelligence layer.
   */
  getByLayer(layerId: IntelligenceLayerId): EnterpriseReportManifest[] {
    const result: EnterpriseReportManifest[] = [];
    for (const manifest of this.manifests.values()) {
      if (manifest.layer === layerId) {
        result.push(manifest);
      }
    }
    return result.sort((a, b) => a.id.localeCompare(b.id));
  }

  /**
   * Retrieve all manifests accessible by a given role.
   */
  getByRole(role: string): EnterpriseReportManifest[] {
    const result: EnterpriseReportManifest[] = [];
    for (const manifest of this.manifests.values()) {
      if (manifest.requiredPermissions.includes(role as never)) {
        result.push(manifest);
      }
    }
    return result;
  }

  /**
   * Retrieve all manifests that depend on a specific Firebase collection.
   */
  getByCollection(collection: string): EnterpriseReportManifest[] {
    const result: EnterpriseReportManifest[] = [];
    for (const manifest of this.manifests.values()) {
      if (manifest.collections.includes(collection as never)) {
        result.push(manifest);
      }
    }
    return result;
  }

  /**
   * Get all registered manifests.
   */
  getAll(): EnterpriseReportManifest[] {
    return Array.from(this.manifests.values());
  }

  /**
   * Get total registered manifest count.
   */
  getCount(): number {
    return this.manifests.size;
  }

  /**
   * Validate all registered manifests and return validation results.
   */
  validateAll(): { valid: number; invalid: number; errors: Map<string, string[]> } {
    let valid = 0;
    let invalid = 0;
    const errors = new Map<string, string[]>();

    for (const manifest of this.manifests.values()) {
      const manifestErrors = validateManifest(manifest);
      if (manifestErrors.length > 0) {
        invalid++;
        errors.set(manifest.id, manifestErrors);
      } else {
        valid++;
      }
    }

    return { valid, invalid, errors };
  }

  /**
   * Check if a manifest exists.
   */
  has(id: string): boolean {
    return this.manifests.has(id);
  }

  /**
   * Remove a manifest (for testing/admin purposes).
   */
  unregister(id: string): boolean {
    return this.manifests.delete(id);
  }

  /**
   * Clear all manifests (for testing purposes).
   */
  clear(): void {
    this.manifests.clear();
    this.validationErrors.clear();
  }

  /**
   * Get validation errors for a specific manifest.
   */
  getValidationErrors(id: string): string[] {
    return this.validationErrors.get(id) ?? [];
  }
}

/**
 * Singleton Manifest Registry instance.
 * All report manifests MUST be registered through this registry.
 */
export const ManifestRegistry = new ManifestRegistryImpl();
