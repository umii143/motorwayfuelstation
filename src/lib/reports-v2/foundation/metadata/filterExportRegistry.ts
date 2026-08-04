/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * FuelPro Enterprise Reports Platform v2.0
 * Domain: Metadata
 * Registry: Filter & Export Registries
 */

// ==========================================
// Filter Registry
// ==========================================

export interface FilterDefinition {
  readonly id: string;
  readonly type: 'DATE_RANGE' | 'SELECT' | 'MULTI_SELECT' | 'NUMBER_RANGE' | 'SEARCH';
  readonly fieldId: string;
  readonly labelEn: string;
  readonly labelUr: string;
  readonly version: string;
}

class FilterRegistryImpl {
  private readonly filters: Map<string, FilterDefinition> = new Map();
  constructor() {
    this.filters.set('FLT_DATE_RANGE', {
      id: 'FLT_DATE_RANGE', type: 'DATE_RANGE', fieldId: 'global.date',
      labelEn: 'Date Range', labelUr: 'تاریخ کی حد', version: '1.0.0'
    });
    this.filters.set('FLT_STAFF', {
      id: 'FLT_STAFF', type: 'SELECT', fieldId: 'shifts.operatorId',
      labelEn: 'Staff Member', labelUr: 'عملہ', version: '1.0.0'
    });
    this.filters.set('FLT_PRODUCT', {
      id: 'FLT_PRODUCT', type: 'MULTI_SELECT', fieldId: 'sales.productId',
      labelEn: 'Product', labelUr: 'پروڈکٹ', version: '1.0.0'
    });
  }
  get(id: string) { return this.filters.get(id)!; }
}
export const FilterRegistry = new FilterRegistryImpl();

// ==========================================
// Export Registry
// ==========================================

export type ExportFormatId = 'PDF' | 'EXCEL' | 'CSV' | 'JSON' | 'WHATSAPP' | 'EMAIL' | 'API';

export interface ExportDefinition {
  readonly id: ExportFormatId;
  readonly mimeType: string;
  readonly extension: string;
  readonly requiresBackend: boolean;
  readonly version: string;
}

class ExportRegistryImpl {
  private readonly exports: Map<ExportFormatId, ExportDefinition> = new Map();
  constructor() {
    this.exports.set('PDF', { id: 'PDF', mimeType: 'application/pdf', extension: '.pdf', requiresBackend: false, version: '1.0.0' });
    this.exports.set('EXCEL', { id: 'EXCEL', mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', extension: '.xlsx', requiresBackend: false, version: '1.0.0' });
    this.exports.set('CSV', { id: 'CSV', mimeType: 'text/csv', extension: '.csv', requiresBackend: false, version: '1.0.0' });
    this.exports.set('WHATSAPP', { id: 'WHATSAPP', mimeType: 'text/plain', extension: '.txt', requiresBackend: true, version: '1.0.0' });
  }
  get(id: ExportFormatId) { return this.exports.get(id)!; }
}
export const ExportRegistry = new ExportRegistryImpl();
