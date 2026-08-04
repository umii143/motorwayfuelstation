/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * FuelPro EBIP - Formula Registry
 * Isolated math layer. No UI, just business rules.
 */

export interface FormulaDefinition {
  id: string;
  version: string;
  description: string;
  owner: string;
  execute: (inputs: Record<string, any[]>) => number;
}

export class FormulaRegistry {
  private static instance: FormulaRegistry;
  private formulas: Map<string, FormulaDefinition> = new Map();

  private constructor() {
    this.seedFormulas();
  }

  public static getInstance(): FormulaRegistry {
    if (!FormulaRegistry.instance) {
      FormulaRegistry.instance = new FormulaRegistry();
    }
    return FormulaRegistry.instance;
  }

  private register(formula: FormulaDefinition) {
    this.formulas.set(formula.id, formula);
  }

  public getFormulaVersion(id: string): string {
    return this.formulas.get(id)?.version || '1.0.0';
  }

  public executeFormula(id: string, inputs: Record<string, any[]>): number {
    const formula = this.formulas.get(id);
    if (!formula) throw new Error(`[EBIP Formula Registry] Formula ${id} not found.`);
    
    try {
      return formula.execute(inputs);
    } catch (e) {
      console.error(`[EBIP] Formula ${id} execution failed:`, e);
      return 0;
    }
  }

  private seedFormulas() {
    // 1. Gross Revenue
    this.register({
      id: 'FORMULA_GROSS_REVENUE',
      version: '1.0.0',
      description: 'Sums the total amount of all sales records.',
      owner: 'FINANCE',
      execute: (inputs) => {
        const sales = inputs['sales'] || [];
        return sales.reduce((sum, s) => sum + (Number(s.totalAmount) || Number(s.amount) || 0), 0);
      }
    });

    // 2. Fuel Stock (schema-tolerant — matches the QueryEngine tank fields)
    this.register({
      id: 'FORMULA_CURRENT_STOCK',
      version: '1.1.0',
      description: 'Sums current volume of all tanks (currentStock || currentLevel || currentVolume).',
      owner: 'INVENTORY',
      execute: (inputs) => {
        const tanks = inputs['tanks'] || [];
        return tanks.reduce((sum, t) => sum + (Number(t.currentStock) || Number(t.currentLevel) || Number(t.currentVolume) || 0), 0);
      }
    });

    // 3. Operating Expenses
    this.register({
      id: 'FORMULA_OPERATING_EXPENSES',
      version: '1.0.0',
      description: 'Sums the total amount of all expense records.',
      owner: 'FINANCE',
      execute: (inputs) => {
        const expenses = inputs['expenses'] || [];
        return expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
      }
    });

    // 4. Net Profit
    this.register({
      id: 'FORMULA_NET_PROFIT',
      version: '1.0.0',
      description: 'Revenue - Expenses (simplified).',
      owner: 'FINANCE',
      execute: (inputs) => {
        const sales = inputs['sales'] || [];
        const expenses = inputs['expenses'] || [];
        const revenue = sales.reduce((sum, s) => sum + (Number(s.totalAmount) || Number(s.amount) || 0), 0);
        const totalExp = expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
        return revenue - totalExp;
      }
    });

    // 5. Total Sales Liters
    this.register({
      id: 'FORMULA_TOTAL_LITERS_SOLD',
      version: '1.0.0',
      description: 'Sums the total quantity (liters) of all sales.',
      owner: 'FUEL_OPS',
      execute: (inputs) => {
        const sales = inputs['sales'] || [];
        return sales.reduce((sum, s) => sum + (Number(s.quantity) || 0), 0);
      }
    });
    
    // 6. Cash in Hand
    this.register({
      id: 'FORMULA_CASH_IN_HAND',
      version: '1.0.0',
      description: 'Returns available cash in safe (Mocked for safety).',
      owner: 'TREASURY',
      execute: (inputs) => {
        const safes = inputs['safes'] || [];
        return safes.reduce((sum, s) => sum + (Number(s.balance) || 0), 0);
      }
    });
    
    // 7. Business Health Score (0-100)
    this.register({
      id: 'FORMULA_BUSINESS_HEALTH',
      version: '1.0.0',
      description: 'Calculates a health score based on revenue and expenses.',
      owner: 'AI',
      execute: (inputs) => {
        const sales = inputs['sales'] || [];
        const expenses = inputs['expenses'] || [];
        
        if (sales.length === 0) return 0;
        
        const revenue = sales.reduce((sum, s) => sum + (Number(s.totalAmount) || Number(s.amount) || 0), 0);
        const totalExp = expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
        
        if (revenue === 0) return 0;
        const margin = ((revenue - totalExp) / revenue) * 100;
        
        // Simple scaling: Margin > 15% is 100 score, Margin < 0 is 0 score
        const score = Math.max(0, Math.min(100, (margin / 15) * 100));
        return Math.round(score);
      }
    });

    // ──────────────────────────────────────────────
    // 8+ Deep Analytics formulas (deterministic, live-data only)
    // Field names mirror the verified QueryEngine/KPIEngine schema.
    // ──────────────────────────────────────────────

    this.register({
      id: 'FORMULA_SALES_TRANSACTIONS',
      version: '1.0.0',
      description: 'Counts sales records in the window.',
      owner: 'FUEL_OPS',
      execute: (inputs) => (inputs['sales'] || []).length
    });

    this.register({
      id: 'FORMULA_AVG_SALE_VALUE',
      version: '1.0.0',
      description: 'Revenue divided by transaction count (guards divide-by-zero).',
      owner: 'FINANCE',
      execute: (inputs) => {
        const sales = inputs['sales'] || [];
        if (sales.length === 0) return 0;
        const revenue = sales.reduce((sum, s) => sum + (Number(s.totalAmount) || Number(s.amount) || 0), 0);
        return Math.round(revenue / sales.length);
      }
    });

    this.register({
      id: 'FORMULA_CUSTOMER_RECEIVABLE',
      version: '1.0.0',
      description: 'Sums outstanding customer balances.',
      owner: 'FINANCE',
      execute: (inputs) => {
        const customers = inputs['customers'] || [];
        return customers.reduce((sum, c) => sum + (Number(c.balance) || Number(c.outstanding) || 0), 0);
      }
    });

    this.register({
      id: 'FORMULA_SUPPLIER_PAYABLE',
      version: '1.0.0',
      description: 'Sums outstanding supplier payables.',
      owner: 'FINANCE',
      execute: (inputs) => {
        const suppliers = inputs['suppliers'] || [];
        return suppliers.reduce((sum, s) => sum + (Number(s.balance) || Number(s.outstanding) || 0), 0);
      }
    });

    this.register({
      id: 'FORMULA_BANK_BALANCE',
      version: '1.0.0',
      description: 'Sums bank account balances.',
      owner: 'TREASURY',
      execute: (inputs) => {
        const banks = inputs['bankAccounts'] || [];
        return banks.reduce((sum, b) => sum + (Number(b.balance) || 0), 0);
      }
    });

    this.register({
      id: 'FORMULA_WALLET_BALANCE',
      version: '1.0.0',
      description: 'Sums digital wallet balances.',
      owner: 'TREASURY',
      execute: (inputs) => {
        const wallets = inputs['wallets'] || [];
        return wallets.reduce((sum, w) => sum + (Number(w.balance) || 0), 0);
      }
    });

    this.register({
      id: 'FORMULA_CASH_BALANCE',
      version: '1.0.0',
      description: 'Net cash movement: IN/credit minus OUT/debit across the cash ledger.',
      owner: 'TREASURY',
      execute: (inputs) => {
        const ledger = inputs['cashLedger'] || [];
        return ledger.reduce((sum, e) => {
          const amount = Number(e.amount) || 0;
          const type = String(e.type || e.direction || '').toLowerCase();
          if (type === 'out' || type === 'debit') return sum - amount;
          return sum + amount; // IN / credit / unknown entries count as inflow
        }, 0);
      }
    });

    this.register({
      id: 'FORMULA_SHIFT_COUNT',
      version: '1.0.0',
      description: 'Counts shift records in the window.',
      owner: 'FUEL_OPS',
      execute: (inputs) => (inputs['shifts'] || []).length
    });

    this.register({
      id: 'FORMULA_PURCHASE_VALUE',
      version: '1.0.0',
      description: 'Sums fuel purchase amounts.',
      owner: 'PROCUREMENT',
      execute: (inputs) => {
        const purchases = inputs['fuelPurchases'] || [];
        return purchases.reduce((sum, p) => sum + (Number(p.amount) || Number(p.totalAmount) || 0), 0);
      }
    });

    this.register({
      id: 'FORMULA_NOZZLE_DISPENSED',
      version: '1.0.0',
      description: 'Sums litres dispensed from nozzle readings.',
      owner: 'FUEL_OPS',
      execute: (inputs) => {
        const readings = inputs['nozzleReadings'] || [];
        return readings.reduce((sum, n) => sum + (Number(n.litres) || (Number(n.closingReading) - Number(n.openingReading)) || 0), 0);
      }
    });

    this.register({
      id: 'FORMULA_DIP_COUNT',
      version: '1.0.0',
      description: 'Counts dip readings in the window.',
      owner: 'FUEL_OPS',
      execute: (inputs) => (inputs['dipReadings'] || []).length
    });

    this.register({
      id: 'FORMULA_LEDGER_TURNOVER',
      version: '1.0.0',
      description: 'Sums general ledger posting amounts.',
      owner: 'FINANCE',
      execute: (inputs) => {
        const ledger = inputs['generalLedger'] || [];
        return ledger.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
      }
    });

    this.register({
      id: 'FORMULA_AUDIT_EVENTS',
      version: '1.0.0',
      description: 'Counts audit log events in the window.',
      owner: 'SECURITY',
      execute: (inputs) => (inputs['auditLogs'] || []).length
    });

    this.register({
      id: 'FORMULA_AUDIT_CRITICAL_EVENTS',
      version: '1.0.0',
      description: 'Counts critical-severity audit events.',
      owner: 'SECURITY',
      execute: (inputs) => (inputs['auditLogs'] || []).filter((e: any) => String(e.severity || '').toLowerCase() === 'critical').length
    });

    this.register({
      id: 'FORMULA_STAFF_COUNT',
      version: '1.0.0',
      description: 'Counts employee records.',
      owner: 'HR',
      execute: (inputs) => (inputs['employees'] || []).length
    });

    this.register({
      id: 'FORMULA_ASSET_COUNT',
      version: '1.0.0',
      description: 'Counts registered enterprise assets.',
      owner: 'OPERATIONS',
      execute: (inputs) => (inputs['assets'] || []).length
    });

    this.register({
      id: 'FORMULA_ASSET_VALUE',
      version: '1.0.0',
      description: 'Sums asset book values.',
      owner: 'OPERATIONS',
      execute: (inputs) => {
        const assets = inputs['assets'] || [];
        return assets.reduce((sum, a) => sum + (Number(a.value) || 0), 0);
      }
    });

    this.register({
      id: 'FORMULA_PRICE_CHANGES',
      version: '1.0.0',
      description: 'Counts fuel price revision records.',
      owner: 'PRICING',
      execute: (inputs) => (inputs['fuelPrices'] || []).length
    });

    // ──────────────────────────────────────────────
    // v2.1 Patch — Phase 9 Proof Report Formulas
    // ──────────────────────────────────────────────

    // True Profit (P1 Report) — the most complex formula
    this.register({
      id: 'FORMULA_TRUE_PROFIT',
      version: '1.0.0',
      description: 'Gross Sales - Purchase Cost - Test Liter Loss - Credit Aging Cost - Operating Expenses.',
      owner: 'FINANCE',
      execute: (inputs) => {
        const sales = inputs['sales'] || [];
        const purchases = inputs['fuelPurchases'] || [];
        const expenses = inputs['expenses'] || [];
        const testLiters = inputs['testLiters'] || [];

        const grossSales = sales.reduce((sum, s) => sum + (Number(s.totalAmount) || Number(s.amount) || 0), 0);
        const purchaseCost = purchases.reduce((sum, p) => sum + (Number(p.amount) || Number(p.totalAmount) || 0), 0);
        const operatingExpenses = expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
        const testLiterLoss = testLiters.reduce((sum, t) => sum + (Number(t.cost) || Number(t.amount) || 0), 0);
        // Credit aging cost — simplified: 2% of outstanding customer balances over 60 days
        const customers = inputs['customers'] || [];
        const creditAgingCost = customers.reduce((sum, c) => {
          const balance = Number(c.balance) || 0;
          const daysOverdue = Number(c.daysOverdue) || 0;
          return sum + (daysOverdue > 60 ? balance * 0.02 : 0);
        }, 0);

        return grossSales - purchaseCost - testLiterLoss - creditAgingCost - operatingExpenses;
      }
    });

    // Cash Variance (C2 Report)
    this.register({
      id: 'FORMULA_CASH_VARIANCE',
      version: '1.0.0',
      description: 'Net cash variance across all shifts (expected - actual).',
      owner: 'FINANCE',
      execute: (inputs) => {
        const shifts = inputs['shifts'] || [];
        return shifts.reduce((sum, s) => sum + (Number(s.varianceAmount) || 0), 0);
      }
    });

    // Tank Fill Percentage (I Report)
    this.register({
      id: 'FORMULA_TANK_FILL_PERCENT',
      version: '1.0.0',
      description: 'Average fill percentage across all tanks.',
      owner: 'INVENTORY',
      execute: (inputs) => {
        const tanks = inputs['tanks'] || [];
        if (tanks.length === 0) return 0;
        const totalPercent = tanks.reduce((sum, t) => {
          const current = Number(t.currentStock) || Number(t.currentLevel) || Number(t.currentVolume) || 0;
          const capacity = Number(t.capacity) || 1;
          return sum + (capacity > 0 ? (current / capacity) * 100 : 0);
        }, 0);
        return Math.round(totalPercent / tanks.length);
      }
    });
  }

  // ──────────────────────────────────────────────
  // v2.1 Patch — Firestore Sync + CI Check Support
  // ──────────────────────────────────────────────

  /**
   * Returns all registered formula IDs.
   * Used by the CI check script to compare against Firestore registry.
   */
  public getFormulaIds(): string[] {
    return Array.from(this.formulas.keys());
  }

  /**
   * Returns all registered formula definitions (metadata only, no execute function).
   * Used for syncing to Firestore platform/formulaRegistry.
   */
  public getFormulaMetadata(): Array<{ id: string; version: string; description: string; owner: string }> {
    return Array.from(this.formulas.values()).map(f => ({
      id: f.id,
      version: f.version,
      description: f.description,
      owner: f.owner,
    }));
  }

  /**
   * Checks if a formula exists by ID.
   */
  public hasFormula(id: string): boolean {
    return this.formulas.has(id);
  }

  /**
   * v2.1 Patch — Syncs formula metadata to Firestore platform/formulaRegistry.
   * This writes the documentation copy (id, version, description, owner) to Firestore.
   * The code-level execute function remains the execution layer.
   * Called by admin Cloud Function or manual admin action.
   */
  public async syncToFirestore(db: any): Promise<void> {
    const batch = db.batch();
    const colRef = db.collection('platform/formulaRegistry');

    for (const formula of this.formulas.values()) {
      const docRef = colRef.doc(formula.id);
      batch.set(docRef, {
        id: formula.id,
        version: formula.version,
        description: formula.description,
        owner: formula.owner,
        lastSyncedAt: new Date().toISOString(),
      }, { merge: true });
    }

    await batch.commit();
  }
}
