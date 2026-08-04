/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * FuelPro Enterprise Reports Platform v2.0
 * Domain: Metadata
 * Registry: KPI Registry
 *
 * Single Source of Truth for all KPIs across the platform.
 * Relies on Formula Registry.
 */

export interface KpiDefinition {
  readonly id: string;
  readonly formulaId: string;
  readonly nameEn: string;
  readonly nameUr: string;
  readonly descriptionEn: string;
  readonly sourceCollections: string[];
  readonly refreshStrategy: 'LIVE' | 'CACHE_5M' | 'CACHE_1H' | 'EOD';
  readonly drilldownTargetId: string | null;
  readonly aiExplanationSupport: boolean;
  readonly trendSupport: boolean;
  readonly comparisonSupport: boolean;
  readonly alertThresholdIds: string[];
  readonly ownerRole: string;
  readonly version: string;
}

class KpiRegistryImpl {
  private readonly kpis: Map<string, KpiDefinition> = new Map();

  constructor() {
    this.initializeKpis();
  }

  private register(def: KpiDefinition): void {
    this.kpis.set(def.id, def);
  }

  get(id: string): KpiDefinition {
    const kpi = this.kpis.get(id);
    if (!kpi) throw new Error(`KPI not found in registry: ${id}`);
    return kpi;
  }

  private initializeKpis(): void {
    this.register({
      id: 'KPI_GROSS_PROFIT',
      formulaId: 'GROSS_PROFIT',
      nameEn: 'Gross Profit',
      nameUr: 'مجموعی منافع',
      descriptionEn: 'Total revenue minus COGS',
      sourceCollections: ['sales', 'inventory'],
      refreshStrategy: 'LIVE',
      drilldownTargetId: 'DD_SALES_LEDGER',
      aiExplanationSupport: true,
      trendSupport: true,
      comparisonSupport: true,
      alertThresholdIds: ['ALERT_LOW_MARGIN'],
      ownerRole: 'accountant',
      version: '1.0.0'
    });

    this.register({
      id: 'KPI_WET_STOCK_VARIANCE',
      formulaId: 'WET_STOCK_LOSS',
      nameEn: 'Wet Stock Variance',
      nameUr: 'ویٹ اسٹاک فرق',
      descriptionEn: 'Difference between expected and actual tank dips',
      sourceCollections: ['tanks', 'shifts', 'stockTransactions'],
      refreshStrategy: 'LIVE',
      drilldownTargetId: 'DD_TANK_DIP_LOGS',
      aiExplanationSupport: true,
      trendSupport: true,
      comparisonSupport: false,
      alertThresholdIds: ['ALERT_CRITICAL_LOSS'],
      ownerRole: 'manager',
      version: '1.0.0'
    });
  }
}

export const KpiRegistry = new KpiRegistryImpl();
