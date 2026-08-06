/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * FuelPro Enterprise Reports Platform v2.0 — Report Registry
 *
 * Runtime registry managing report lifecycle, RBAC filtering,
 * and dependency graph lookups.
 *
 * Phase 1: Infrastructure only — zero reports registered.
 */

import type {
  EnterpriseReportManifest,
  IntelligenceLayerId,
  RBACRole,
  FirestoreCollection
} from '../types/enterpriseReportTypes';
import { ManifestRegistry } from '../manifest/manifestRegistry';
import { logger } from '../../logger';

class ReportRegistryImpl {
  /**
   * Register a report manifest through the Manifest Registry with validation.
   */
  registerReport(manifest: EnterpriseReportManifest): { success: boolean; errors: string[] } {
    const result = ManifestRegistry.register(manifest);
    if (result.success) {
      logger.info(`[ReportRegistry] Report ${manifest.id} registered successfully.`);
    }
    return result;
  }

  /**
   * Get a report by ID (type-safe retrieval).
   */
  getReport(id: string): EnterpriseReportManifest | null {
    return ManifestRegistry.get(id);
  }

  /**
   * Get all reports for a specific intelligence layer.
   */
  getReportsByLayer(layerId: IntelligenceLayerId): EnterpriseReportManifest[] {
    return ManifestRegistry.getByLayer(layerId);
  }

  /**
   * Get all reports accessible by a specific RBAC role.
   */
  getReportsByRole(role: RBACRole): EnterpriseReportManifest[] {
    const allManifests = ManifestRegistry.getAll();
    return allManifests.filter(m => m.requiredPermissions.includes(role));
  }

  /**
   * Get all reports that depend on a specific Firebase collection.
   */
  getReportsByCollection(collection: FirestoreCollection): EnterpriseReportManifest[] {
    return ManifestRegistry.getByCollection(collection);
  }

  /**
   * Get total registered report count.
   */
  getReportCount(): number {
    return ManifestRegistry.getCount();
  }

  /**
   * Check if a report exists.
   */
  hasReport(id: string): boolean {
    return ManifestRegistry.has(id);
  }

  /**
   * Validate all registered report manifests.
   */
  validateAllReports(): { valid: number; invalid: number; errors: Map<string, string[]> } {
    return ManifestRegistry.validateAll();
  }

  /**
   * Get reports matching search text (searches name and description).
   */
  searchReports(searchText: string): EnterpriseReportManifest[] {
    const query = searchText.toLowerCase().trim();
    if (!query) return ManifestRegistry.getAll();

    return ManifestRegistry.getAll().filter(m =>
      m.simpleNameEn.toLowerCase().includes(query) ||
      m.simpleNameUr.includes(searchText) ||
      m.enterpriseNameEn.toLowerCase().includes(query) ||
      m.descriptionEn.toLowerCase().includes(query) ||
      m.tags.some(t => t.toLowerCase().includes(query)) ||
      m.id.toLowerCase().includes(query)
    );
  }

  /**
   * Get related reports for a specific report.
   */
  getRelatedReports(reportId: string): EnterpriseReportManifest[] {
    const manifest = ManifestRegistry.get(reportId);
    if (!manifest) return [];

    return manifest.relatedReports
      .map(id => ManifestRegistry.get(id))
      .filter((m): m is EnterpriseReportManifest => m !== null);
  }

  /**
   * Get reports by certification status.
   */
  getReportsByCertification(status: string): EnterpriseReportManifest[] {
    return ManifestRegistry.getAll().filter(m => m.certificationStatus === status);
  }

  /**
   * Seed infrastructure reports (PRD v6.1 A.9)
   */
  seedReports(): void {
    this.registerReport({
      id: 'ANL-05',
      layer: 'audit',
      simpleNameEn: 'Engine Health',
      simpleNameUr: 'انجن ہیلتھ',
      enterpriseNameEn: 'Engine Health Dashboard',
      enterpriseNameUr: 'انجن ہیلتھ ڈیش بورڈ',
      descriptionEn: 'Real-time observability and health monitoring for all reporting engines.',
      descriptionUr: 'رپورٹنگ انجن کی ہیلتھ اور کارکردگی کی نگرانی',
      collections: [],
      formulaIds: [],
      requiredPermissions: ['owner', 'admin'],
      kpis: [],
      charts: [],
      registerColumns: [],
      exports: [],
      drilldownPath: [],
      aiCapabilities: [],
      isRealtime: true,
      version: '1.0.0',
      certificationStatus: 'PRODUCTION',
      readinessScore: 100,
      displayMode: 'advanced',
      tags: ['system', 'health', 'observability'],
      relatedReports: ['ANL-06'],
      parentWorkspace: 'Analytics',
      healthMonitored: true,
      apiVersion: 'v1'
    });

    this.registerReport({
      id: 'ANL-06',
      layer: 'audit',
      simpleNameEn: 'Data Quality',
      simpleNameUr: 'ڈیٹا کوالٹی',
      enterpriseNameEn: 'Data Quality Dashboard',
      enterpriseNameUr: 'ڈیٹا کوالٹی ڈیش بورڈ',
      descriptionEn: 'Automated data integrity checks and anomaly detection.',
      descriptionUr: 'ڈیٹا کی درستگی کی خودکار جانچ',
      collections: [],
      formulaIds: [],
      requiredPermissions: ['owner', 'admin'],
      kpis: [],
      charts: [],
      registerColumns: [],
      exports: [],
      drilldownPath: [],
      aiCapabilities: [],
      isRealtime: false,
      version: '1.0.0',
      certificationStatus: 'PRODUCTION',
      readinessScore: 100,
      displayMode: 'advanced',
      tags: ['system', 'data', 'integrity'],
      relatedReports: ['ANL-05'],
      parentWorkspace: 'Analytics',
      dataQualityChecks: ['DQ_MISSING_READING', 'DQ_NEGATIVE_STOCK', 'DQ_ORPHAN_FORMULA'],
      apiVersion: 'v1'
    });
  }
}

/**
 * Singleton Report Registry instance.
 */
export const ReportRegistry = new ReportRegistryImpl();
