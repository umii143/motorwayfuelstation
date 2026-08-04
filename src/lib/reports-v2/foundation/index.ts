/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * FuelPro Enterprise Reports Platform v2.0
 * Phase 1.1 — Enterprise Data Foundation
 *
 * Barrel export for all 19 Enterprise Registries across Data, Metadata, Security, and Theme domains.
 * Rule #126: Every Registry must be the Single Source of Truth.
 * Rule #127: Every Registry must be Versioned.
 */

// Data Domain
// Phase 1.2 & 1.3.5 Ecosystem & Catalog Domains
export * from './EnterpriseModuleRegistry';
export * from './EnterpriseFeatureFlags';
export * from './EnterpriseCommandRegistry';
export * from './EnterpriseEventBus';
export * from './EnterpriseTelemetryFramework';
export * from './EnterpriseInternationalizationFramework';
export * from './EnterpriseLayoutRegistry';
export * from './EnterpriseWorkspaceAPI';
export * from './EnterpriseReportRegistry';
export * from './data/collectionRegistry';
export * from './data/fieldRegistry';
export * from './data/relationshipRegistry';
export * from './data/unitRegistry';
export * from './data/dataDictionary';

// Metadata Domain
export * from './metadata/kpiRegistry';
export * from './metadata/chartRegistry';
export * from './metadata/registerRegistry';
export * from './metadata/drilldownRegistry';
export * from './metadata/filterExportRegistry';
export * from './metadata/alertNotificationWidgetRegistry';
export * from './metadata/namingStandards';

// Security Domain
export * from './security/permissionMatrix';
export * from './security/statusRegistry';
export * from './security/auditMetadata';

// Theme Domain
export * from './theme/themeTokenRegistry';
