/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * FuelPro EBIP - Metric Registry & Semantic Layer
 */

export interface MetricDefinition {
  id: string;          // e.g. 'METRIC_REVENUE_TODAY'
  kpiId: string;       // maps to KPI Registry for display config
  formulaId: string;   // maps to Formula Registry for calculation logic
  requiredCollections: string[]; // e.g. ['sales', 'expenses'] (passed to query engine)
}

export class SemanticLayer {
  private static instance: SemanticLayer;
  private metrics: Map<string, MetricDefinition> = new Map();

  private constructor() {
    this.seedMetrics();
  }

  public static getInstance(): SemanticLayer {
    if (!SemanticLayer.instance) {
      SemanticLayer.instance = new SemanticLayer();
    }
    return SemanticLayer.instance;
  }

  private register(def: MetricDefinition) {
    this.metrics.set(def.id, def);
  }

  public resolveMetric(metricId: string): MetricDefinition {
    const m = this.metrics.get(metricId);
    if (!m) throw new Error(`[EBIP Semantic Layer] Metric ${metricId} not found.`);
    return m;
  }

  private seedMetrics() {
    this.register({
      id: 'METRIC_GROSS_REVENUE',
      kpiId: 'KPI_GROSS_REVENUE',
      formulaId: 'FORMULA_GROSS_REVENUE',
      requiredCollections: ['sales']
    });

    this.register({
      id: 'METRIC_NET_PROFIT',
      kpiId: 'KPI_NET_PROFIT',
      formulaId: 'FORMULA_NET_PROFIT',
      requiredCollections: ['sales', 'expenses']
    });

    this.register({
      id: 'METRIC_TOTAL_LITERS',
      kpiId: 'KPI_TOTAL_LITERS',
      formulaId: 'FORMULA_TOTAL_LITERS_SOLD',
      requiredCollections: ['sales']
    });

    this.register({
      id: 'METRIC_CURRENT_STOCK',
      kpiId: 'KPI_CURRENT_STOCK',
      formulaId: 'FORMULA_CURRENT_STOCK',
      requiredCollections: ['tanks']
    });
    
    this.register({
      id: 'METRIC_OPERATING_EXPENSES',
      kpiId: 'KPI_OPERATING_EXPENSES',
      formulaId: 'FORMULA_OPERATING_EXPENSES',
      requiredCollections: ['expenses']
    });
    
    this.register({
      id: 'METRIC_CASH_IN_HAND',
      kpiId: 'KPI_CASH_IN_HAND',
      formulaId: 'FORMULA_CASH_IN_HAND',
      requiredCollections: ['safes']
    });
    
    this.register({
      id: 'METRIC_BUSINESS_HEALTH',
      kpiId: 'KPI_BUSINESS_HEALTH',
      formulaId: 'FORMULA_BUSINESS_HEALTH',
      requiredCollections: ['sales', 'expenses']
    });

    // ──────────────────────────────────────────────
    // Deep Analytics metrics (v2.0) — grounded in the
    // verified QueryEngine/KPIEngine collection schema.
    // ──────────────────────────────────────────────

    this.register({
      id: 'METRIC_SALES_TRANSACTIONS',
      kpiId: 'KPI_SALES_TRANSACTIONS',
      formulaId: 'FORMULA_SALES_TRANSACTIONS',
      requiredCollections: ['sales']
    });

    this.register({
      id: 'METRIC_AVG_SALE_VALUE',
      kpiId: 'KPI_AVG_SALE_VALUE',
      formulaId: 'FORMULA_AVG_SALE_VALUE',
      requiredCollections: ['sales']
    });

    this.register({
      id: 'METRIC_CUSTOMER_RECEIVABLE',
      kpiId: 'KPI_CUSTOMER_RECEIVABLE',
      formulaId: 'FORMULA_CUSTOMER_RECEIVABLE',
      requiredCollections: ['customers']
    });

    this.register({
      id: 'METRIC_SUPPLIER_PAYABLE',
      kpiId: 'KPI_SUPPLIER_PAYABLE',
      formulaId: 'FORMULA_SUPPLIER_PAYABLE',
      requiredCollections: ['suppliers']
    });

    this.register({
      id: 'METRIC_BANK_BALANCE',
      kpiId: 'KPI_BANK_BALANCE',
      formulaId: 'FORMULA_BANK_BALANCE',
      requiredCollections: ['bankAccounts']
    });

    this.register({
      id: 'METRIC_WALLET_BALANCE',
      kpiId: 'KPI_WALLET_BALANCE',
      formulaId: 'FORMULA_WALLET_BALANCE',
      requiredCollections: ['wallets']
    });

    this.register({
      id: 'METRIC_CASH_BALANCE',
      kpiId: 'KPI_CASH_BALANCE',
      formulaId: 'FORMULA_CASH_BALANCE',
      requiredCollections: ['cashLedger']
    });

    this.register({
      id: 'METRIC_SHIFT_COUNT',
      kpiId: 'KPI_SHIFT_COUNT',
      formulaId: 'FORMULA_SHIFT_COUNT',
      requiredCollections: ['shifts']
    });

    this.register({
      id: 'METRIC_PURCHASE_VALUE',
      kpiId: 'KPI_PURCHASE_VALUE',
      formulaId: 'FORMULA_PURCHASE_VALUE',
      requiredCollections: ['fuelPurchases']
    });

    this.register({
      id: 'METRIC_NOZZLE_DISPENSED',
      kpiId: 'KPI_NOZZLE_DISPENSED',
      formulaId: 'FORMULA_NOZZLE_DISPENSED',
      requiredCollections: ['nozzleReadings']
    });

    this.register({
      id: 'METRIC_DIP_COUNT',
      kpiId: 'KPI_DIP_COUNT',
      formulaId: 'FORMULA_DIP_COUNT',
      requiredCollections: ['dipReadings']
    });

    this.register({
      id: 'METRIC_LEDGER_TURNOVER',
      kpiId: 'KPI_LEDGER_TURNOVER',
      formulaId: 'FORMULA_LEDGER_TURNOVER',
      requiredCollections: ['generalLedger']
    });

    this.register({
      id: 'METRIC_AUDIT_EVENTS',
      kpiId: 'KPI_AUDIT_EVENTS',
      formulaId: 'FORMULA_AUDIT_EVENTS',
      requiredCollections: ['auditLogs']
    });

    this.register({
      id: 'METRIC_AUDIT_CRITICAL_EVENTS',
      kpiId: 'KPI_AUDIT_CRITICAL_EVENTS',
      formulaId: 'FORMULA_AUDIT_CRITICAL_EVENTS',
      requiredCollections: ['auditLogs']
    });

    this.register({
      id: 'METRIC_STAFF_COUNT',
      kpiId: 'KPI_STAFF_COUNT',
      formulaId: 'FORMULA_STAFF_COUNT',
      requiredCollections: ['employees']
    });

    this.register({
      id: 'METRIC_ASSET_COUNT',
      kpiId: 'KPI_ASSET_COUNT',
      formulaId: 'FORMULA_ASSET_COUNT',
      requiredCollections: ['assets']
    });

    this.register({
      id: 'METRIC_ASSET_VALUE',
      kpiId: 'KPI_ASSET_VALUE',
      formulaId: 'FORMULA_ASSET_VALUE',
      requiredCollections: ['assets']
    });

    this.register({
      id: 'METRIC_PRICE_CHANGES',
      kpiId: 'KPI_PRICE_CHANGES',
      formulaId: 'FORMULA_PRICE_CHANGES',
      requiredCollections: ['fuelPrices']
    });
  }
}
