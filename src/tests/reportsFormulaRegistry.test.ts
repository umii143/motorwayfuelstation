import { describe, it, expect } from 'vitest';
import { FormulaRegistry } from '../lib/reports-v2/ebip/formulas/formulaRegistry';

const registry = FormulaRegistry.getInstance();

const run = (formulaId: string, inputs: Record<string, any[]>) => registry.executeFormula(formulaId, inputs);

describe('EBIP Formula Registry', () => {
  it('computes gross revenue from sales totalAmount/amount', () => {
    const sales = [{ totalAmount: 1000 }, { amount: 500 }, { totalAmount: '250.5' }];
    expect(run('FORMULA_GROSS_REVENUE', { sales })).toBeCloseTo(1750.5, 2);
  });

  it('computes net profit as revenue minus expenses', () => {
    const sales = [{ totalAmount: 10000 }];
    const expenses = [{ amount: 3000 }, { amount: 1000 }];
    expect(run('FORMULA_NET_PROFIT', { sales, expenses })).toBe(6000);
  });

  it('sums current stock across all tank field variants', () => {
    const tanks = [
      { currentStock: 5000 },
      { currentLevel: 3000 },
      { currentVolume: 2000 },
      {}
    ];
    expect(run('FORMULA_CURRENT_STOCK', { tanks })).toBe(10000);
  });

  it('sums liters sold from quantity', () => {
    const sales = [{ quantity: 100 }, { quantity: 250.5 }];
    expect(run('FORMULA_TOTAL_LITERS_SOLD', { sales })).toBeCloseTo(350.5, 2);
  });

  it('sums operating expenses', () => {
    const expenses = [{ amount: 100 }, { amount: 200 }];
    expect(run('FORMULA_OPERATING_EXPENSES', { expenses })).toBe(300);
  });

  it('returns 0 for business health when there are no sales', () => {
    expect(run('FORMULA_BUSINESS_HEALTH', { sales: [], expenses: [{ amount: 1 }] })).toBe(0);
  });

  it('caps business health score between 0 and 100', () => {
    // 30% margin → (30/15)*100 = 200 → capped at 100
    const healthy = run('FORMULA_BUSINESS_HEALTH', { sales: [{ totalAmount: 1000 }], expenses: [{ amount: 700 }] });
    expect(healthy).toBe(100);
    // -50% margin → clamped to 0
    const loss = run('FORMULA_BUSINESS_HEALTH', { sales: [{ totalAmount: 1000 }], expenses: [{ amount: 1500 }] });
    expect(loss).toBe(0);
  });

  it('counts sales transactions', () => {
    expect(run('FORMULA_SALES_TRANSACTIONS', { sales: [{}, {}, {}] })).toBe(3);
  });

  it('computes average sale value and guards divide-by-zero', () => {
    expect(run('FORMULA_AVG_SALE_VALUE', { sales: [{ totalAmount: 100 }, { totalAmount: 300 }] })).toBe(200);
    expect(run('FORMULA_AVG_SALE_VALUE', { sales: [] })).toBe(0);
  });

  it('sums customer receivables and supplier payables', () => {
    const customers = [{ balance: 500 }, { outstanding: 250 }, {}];
    expect(run('FORMULA_CUSTOMER_RECEIVABLE', { customers })).toBe(750);
    const suppliers = [{ balance: 1000 }, { outstanding: 500 }];
    expect(run('FORMULA_SUPPLIER_PAYABLE', { suppliers })).toBe(1500);
  });

  it('sums bank and wallet balances', () => {
    const bankAccounts = [{ balance: 1000 }, { balance: 500 }];
    expect(run('FORMULA_BANK_BALANCE', { bankAccounts })).toBe(1500);
    const wallets = [{ balance: 250 }];
    expect(run('FORMULA_WALLET_BALANCE', { wallets })).toBe(250);
  });

  it('computes net cash movement IN minus OUT', () => {
    const cashLedger = [
      { type: 'IN', amount: 1000 },
      { type: 'credit', amount: 500 },
      { type: 'OUT', amount: 300 },
      { type: 'debit', amount: 200 },
      { type: 'unknown', amount: 100 } // unknown counts as inflow
    ];
    expect(run('FORMULA_CASH_BALANCE', { cashLedger })).toBe(1100);
  });

  it('counts shifts', () => {
    expect(run('FORMULA_SHIFT_COUNT', { shifts: [{}, {}] })).toBe(2);
  });

  it('sums purchase value', () => {
    const fuelPurchases = [{ amount: 1000 }, { totalAmount: 500 }];
    expect(run('FORMULA_PURCHASE_VALUE', { fuelPurchases })).toBe(1500);
  });

  it('computes litres dispensed from litres or closing-opening', () => {
    const nozzleReadings = [
      { litres: 100 },
      { openingReading: 50, closingReading: 120 }
    ];
    expect(run('FORMULA_NOZZLE_DISPENSED', { nozzleReadings })).toBe(170);
  });

  it('counts dip readings', () => {
    expect(run('FORMULA_DIP_COUNT', { dipReadings: [{}, {}, {}] })).toBe(3);
  });

  it('sums ledger turnover', () => {
    const generalLedger = [{ amount: 100 }, { amount: 200 }];
    expect(run('FORMULA_LEDGER_TURNOVER', { generalLedger })).toBe(300);
  });

  it('counts audit events and critical ones (case-insensitive)', () => {
    const auditLogs = [
      { severity: 'CRITICAL' },
      { severity: 'critical' },
      { severity: 'info' }
    ];
    expect(run('FORMULA_AUDIT_EVENTS', { auditLogs })).toBe(3);
    expect(run('FORMULA_AUDIT_CRITICAL_EVENTS', { auditLogs })).toBe(2);
  });

  it('counts staff and assets, and sums asset value', () => {
    expect(run('FORMULA_STAFF_COUNT', { employees: [{}, {}] })).toBe(2);
    const assets = [{ value: 1000 }, { value: 500 }, {}];
    expect(run('FORMULA_ASSET_COUNT', { assets })).toBe(3);
    expect(run('FORMULA_ASSET_VALUE', { assets })).toBe(1500);
  });

  it('counts price revisions', () => {
    expect(run('FORMULA_PRICE_CHANGES', { fuelPrices: [{}, {}] })).toBe(2);
  });

  it('is deterministic — same inputs always produce identical output', () => {
    const sales = [{ totalAmount: 1234 }, { totalAmount: 5678 }];
    const a = run('FORMULA_GROSS_REVENUE', { sales });
    const b = run('FORMULA_GROSS_REVENUE', { sales });
    expect(a).toBe(b);
  });
});
