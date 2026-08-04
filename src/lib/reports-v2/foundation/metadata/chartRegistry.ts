/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * FuelPro Enterprise Reports Platform v2.0
 * Domain: Metadata
 * Registry: Chart Registry
 *
 * Metadata-driven chart definitions. Never hardcode charts in UI.
 */

export type ChartType = 'BAR' | 'LINE' | 'AREA' | 'PIE' | 'RADAR' | 'SCATTER' | 'COMPOSED';

export interface ChartDefinition {
  readonly id: string;
  readonly type: ChartType;
  readonly nameEn: string;
  readonly nameUr: string;
  readonly dataSourceCollection: string;
  readonly groupingField: string;
  readonly aggregationFields: { field: string; func: 'SUM' | 'AVG' | 'COUNT' }[];
  readonly colorThemeTokens: string[];
  readonly drilldownSupported: boolean;
  readonly exportSupported: boolean;
  readonly printSupported: boolean;
  readonly version: string;
}

class ChartRegistryImpl {
  private readonly charts: Map<string, ChartDefinition> = new Map();

  constructor() {
    this.initializeCharts();
  }

  private register(def: ChartDefinition): void {
    this.charts.set(def.id, def);
  }

  get(id: string): ChartDefinition {
    const chart = this.charts.get(id);
    if (!chart) throw new Error(`Chart not found in registry: ${id}`);
    return chart;
  }

  private initializeCharts(): void {
    this.register({
      id: 'CHART_SALES_TREND_7D',
      type: 'AREA',
      nameEn: '7-Day Sales Trend',
      nameUr: '7 دن کی فروخت کا رجحان',
      dataSourceCollection: 'sales',
      groupingField: 'date',
      aggregationFields: [{ field: 'amount', func: 'SUM' }],
      colorThemeTokens: ['primary', 'accent'],
      drilldownSupported: true,
      exportSupported: true,
      printSupported: true,
      version: '1.0.0'
    });

    this.register({
      id: 'CHART_PRODUCT_MIX',
      type: 'PIE',
      nameEn: 'Product Sales Mix',
      nameUr: 'پروڈکٹ سیلز مکس',
      dataSourceCollection: 'sales',
      groupingField: 'productId',
      aggregationFields: [{ field: 'quantity', func: 'SUM' }],
      colorThemeTokens: ['primary', 'secondary', 'warning', 'success'],
      drilldownSupported: false,
      exportSupported: true,
      printSupported: true,
      version: '1.0.0'
    });
  }
}

export const ChartRegistry = new ChartRegistryImpl();
