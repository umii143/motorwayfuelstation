import { describe, it, expect } from 'vitest';
import { getEBIPMetricsForEngine, formatEBIPValue } from '../lib/reports-v2/ebip/reports/engineMetricMap';
import { SemanticLayer } from '../lib/reports-v2/ebip/metrics/semanticLayer';
import type { ReportEngineType } from '../lib/reports-v2/engines/types';

const ALL_ENGINE_TYPES: ReportEngineType[] = [
  'BusinessDashboard', 'SalesRegister', 'StockDashboard', 'ShiftSummary', 'CashSummary',
  'ExpenseRegister', 'CustomerLedger', 'SupplierLedger', 'BankPosition', 'DigitalPayments',
  'LedgerView', 'StaffRegister', 'AssetRegister', 'AuditLog', 'AIIntelligence',
  'TaxReport', 'PurchaseRegister', 'PriceHistory', 'TankDipReport', 'PumpNozzleReport',
  'FleetReport', 'ComplianceReport', 'TreasuryDashboard', 'AnalyticsDashboard', 'BranchComparison'
];

describe('engineMetricMap', () => {
  it('maps every one of the 25 engine types to a non-empty EBIP metric set', () => {
    ALL_ENGINE_TYPES.forEach(engineType => {
      const refs = getEBIPMetricsForEngine(engineType);
      expect(refs.length, `${engineType} should map to metrics`).toBeGreaterThan(0);
    });
  });

  it('falls back to the executive set for unknown engine types', () => {
    const refs = getEBIPMetricsForEngine('NotARealEngine');
    expect(refs.length).toBeGreaterThan(0);
    expect(refs[0].metricId).toBe('METRIC_GROSS_REVENUE');
  });

  it('every mapped metric is registered in the Semantic Layer (no dead references)', () => {
    const layer = SemanticLayer.getInstance();
    ALL_ENGINE_TYPES.forEach(engineType => {
      getEBIPMetricsForEngine(engineType).forEach(ref => {
        expect(() => layer.resolveMetric(ref.metricId), `${ref.metricId} must resolve`).not.toThrow();
      });
    });
  });

  it('every metric ref is fully configured (unit, Urdu label, flags)', () => {
    ALL_ENGINE_TYPES.forEach(engineType => {
      getEBIPMetricsForEngine(engineType).forEach(ref => {
        expect(ref.label.trim().length).toBeGreaterThan(0);
        expect(ref.labelUr.trim().length).toBeGreaterThan(0);
        expect(['PKR', 'L', 'COUNT', 'PERCENT']).toContain(ref.unit);
        expect(typeof ref.dateAware).toBe('boolean');
        expect(typeof ref.higherIsBetter).toBe('boolean');
      });
    });
  });

  it('uses dateAware only for metrics whose collections carry timestamps', () => {
    const salesRegister = getEBIPMetricsForEngine('SalesRegister');
    const revenue = salesRegister.find(r => r.metricId === 'METRIC_GROSS_REVENUE');
    expect(revenue?.dateAware).toBe(true);
    const stock = getEBIPMetricsForEngine('StockDashboard').find(r => r.metricId === 'METRIC_CURRENT_STOCK');
    expect(stock?.dateAware).toBe(false); // point-in-time snapshot, honestly N/A
  });
});

describe('formatEBIPValue', () => {
  it('formats currency with integer grouping', () => {
    expect(formatEBIPValue(1234567.8, 'PKR')).toBe('1,234,568');
  });

  it('formats counts as integers', () => {
    expect(formatEBIPValue(42.7, 'COUNT')).toBe('43');
  });

  it('formats percentages with a percent sign', () => {
    expect(formatEBIPValue(87.3, 'PERCENT')).toBe('87%');
  });

  it('formats liters with grouping', () => {
    expect(formatEBIPValue(12345.6, 'L')).toBe('12,346');
  });
});
