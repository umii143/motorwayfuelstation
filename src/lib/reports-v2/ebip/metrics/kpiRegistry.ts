/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * FuelPro EBIP - KPI Registry
 * Defines metadata, thresholds, and presentation rules for KPIs.
 */

import { UnitOfMeasure } from '../shared/types';

export type KPITrendDirection = 'HIGHER_IS_BETTER' | 'LOWER_IS_BETTER' | 'NEUTRAL';

export interface KPIConfig {
  id: string;
  nameEn: string;
  nameUr: string;
  descriptionEn: string;
  unit: UnitOfMeasure;
  trendDirection: KPITrendDirection;
  precision: number;
  
  // Enterprise Thresholds for Alerting Engine
  thresholds?: {
    warningMin?: number;
    warningMax?: number;
    criticalMin?: number;
    criticalMax?: number;
  };
}

export class KPIRegistry {
  private static instance: KPIRegistry;
  private kpis: Map<string, KPIConfig> = new Map();

  private constructor() {
    this.seedRegistry();
  }

  public static getInstance(): KPIRegistry {
    if (!KPIRegistry.instance) {
      KPIRegistry.instance = new KPIRegistry();
    }
    return KPIRegistry.instance;
  }

  private register(kpi: KPIConfig) {
    this.kpis.set(kpi.id, kpi);
  }

  public getKPI(id: string): KPIConfig {
    const kpi = this.kpis.get(id);
    if (!kpi) throw new Error(`[EBIP KPI Registry] KPI ${id} not found.`);
    return kpi;
  }

  private seedRegistry() {
    this.register({
      id: 'KPI_GROSS_REVENUE',
      nameEn: 'Gross Revenue',
      nameUr: 'کل آمدنی',
      descriptionEn: 'Total revenue generated before any deductions.',
      unit: 'Amount',
      trendDirection: 'HIGHER_IS_BETTER',
      precision: 0,
      thresholds: {
        warningMin: 500000 // Rs. 500k minimum daily expected
      }
    });

    this.register({
      id: 'KPI_NET_PROFIT',
      nameEn: 'Net Profit',
      nameUr: 'خالص منافع',
      descriptionEn: 'Total profit after all expenses and stock costs.',
      unit: 'Amount',
      trendDirection: 'HIGHER_IS_BETTER',
      precision: 0
    });

    this.register({
      id: 'KPI_TANK_VARIANCE',
      nameEn: 'Tank Variance',
      nameUr: 'ٹینک ویرینس',
      descriptionEn: 'Difference between book stock and physical dip.',
      unit: 'Liters',
      trendDirection: 'NEUTRAL',
      precision: 2,
      thresholds: {
        warningMax: 30, // 30L variance warning
        criticalMax: 100 // 100L variance critical
      }
    });
  }
}
