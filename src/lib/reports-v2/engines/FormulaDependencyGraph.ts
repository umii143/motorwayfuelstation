/**
 * @license SPDX-License-Identifier: Apache-2.0
 *
 * FuelPro Enterprise — Formula Dependency Graph (PRD v6.1 Addendum A.2)
 *
 * A directed graph tracking which formulas depend on which upstream formulas/tables.
 * When an upstream formula changes version, getDownstreamReports() returns exactly
 * which report_ids must be invalidated — no blind full-system cache flush.
 *
 * Powered by Umar Ali ⚡
 */

import { logger } from '../../logger';
import { FormulaRegistry } from './FormulaRegistry';

// ──────────────────────────────────────────────
// TYPES
// ──────────────────────────────────────────────

export interface DependencyEdge {
  /** The formula that depends on something */
  formulaId: string;
  /** What it depends on — either another formula_id or 'table:tableName' */
  dependsOnId: string;
  /** Type of dependency */
  dependsOnType: 'formula' | 'table';
}

/**
 * Maps formulaIds to the report_ids that use them.
 * This is derived from FormulaRegistry.usedBy fields.
 */
type FormulaToReportMap = Map<string, string[]>;

// ──────────────────────────────────────────────
// DEPENDENCY GRAPH
// ──────────────────────────────────────────────

class FormulaDependencyGraphImpl {
  /** Adjacency list: formulaId → edges that this formula depends on */
  private edges: DependencyEdge[] = [];

  /** Reverse index: dependsOnId → formulaIds that depend on it */
  private reverseIndex: Map<string, Set<string>> = new Map();

  /**
   * Add a dependency edge to the graph.
   */
  addDependency(edge: DependencyEdge): void {
    this.edges.push(edge);

    // Build reverse index
    if (!this.reverseIndex.has(edge.dependsOnId)) {
      this.reverseIndex.set(edge.dependsOnId, new Set());
    }
    this.reverseIndex.get(edge.dependsOnId)!.add(edge.formulaId);

    logger.info(`[DependencyGraph] ${edge.formulaId} depends on ${edge.dependsOnType}:${edge.dependsOnId}`);
  }

  /**
   * Get all formulas that directly depend on a given formulaId or table.
   */
  getDirectDependents(dependsOnId: string): string[] {
    const dependents = this.reverseIndex.get(dependsOnId);
    return dependents ? Array.from(dependents) : [];
  }

  /**
   * Get all formulas that transitively depend on a given formulaId (BFS walk).
   * Returns the full downstream formula chain.
   */
  getAllDownstreamFormulas(formulaId: string): string[] {
    const visited = new Set<string>();
    const queue = [formulaId];

    while (queue.length > 0) {
      const current = queue.shift()!;
      const dependents = this.reverseIndex.get(current);
      if (dependents) {
        for (const dep of dependents) {
          if (!visited.has(dep)) {
            visited.add(dep);
            queue.push(dep);
          }
        }
      }
    }

    return Array.from(visited);
  }

  /**
   * Get all downstream report_ids that must be invalidated when a formula changes.
   * This is the key function for targeted cache invalidation.
   *
   * 1. Walks the dependency graph to find all downstream formulas
   * 2. For each downstream formula, looks up its usedBy reports from FormulaRegistry
   * 3. Also includes reports that directly use the changed formula
   * 4. Returns deduplicated list of report_ids
   */
  getDownstreamReports(formulaId: string): string[] {
    const reportIds = new Set<string>();

    // Include reports that directly use this formula
    const directFormula = this._findFormulaVersions(formulaId);
    for (const fv of directFormula) {
      fv.usedBy.forEach(r => reportIds.add(r));
    }

    // Walk downstream formulas
    const downstreamFormulas = this.getAllDownstreamFormulas(formulaId);
    for (const downFormulaId of downstreamFormulas) {
      const versions = this._findFormulaVersions(downFormulaId);
      for (const fv of versions) {
        fv.usedBy.forEach(r => reportIds.add(r));
      }
    }

    return Array.from(reportIds);
  }

  /**
   * Get all edges in the graph (for debugging / visualization).
   */
  getAllEdges(): DependencyEdge[] {
    return [...this.edges];
  }

  /**
   * Clear the graph (for testing).
   */
  _clear(): void {
    this.edges = [];
    this.reverseIndex.clear();
  }

  /**
   * Internal helper: find all versions of a formula by base formulaId.
   * Tries FormulaRegistry first, falls back to versionedId lookup.
   */
  private _findFormulaVersions(formulaId: string) {
    // Try base formulaId first
    let versions = FormulaRegistry.getAllVersions(formulaId);
    if (versions.length > 0) return versions;

    // Try as versionedId (e.g. 'OGRA_MARGIN_V1')
    const direct = FormulaRegistry.getVersion(formulaId);
    if (direct) return [direct];

    return [];
  }
}

// ──────────────────────────────────────────────
// SINGLETON
// ──────────────────────────────────────────────

export const FormulaDependencyGraph = new FormulaDependencyGraphImpl();

// ──────────────────────────────────────────────
// SEED DATA — Net Profit Dependency Chain (PRD v6.1 A.2)
// ──────────────────────────────────────────────

export function seedDependencyGraph(): void {
  // Net Profit (TRUE_PROFIT) depends on:
  //   - Revenue (table: sales)
  //   - COGS which depends on:
  //       - Landed Cost (formula: LANDED_COST)
  //           - OMC Purchase Rate (table: purchase_orders)
  //           - Freight (table: bowser_deliveries)
  //       - OGRA Margin (formula: OGRA_MARGIN)
  //           - Active Price Circular (table: ogra_circulars)
  //   - Operating Expenses (table: expenses)

  FormulaDependencyGraph.addDependency({
    formulaId: 'TRUE_PROFIT',
    dependsOnId: 'sales',
    dependsOnType: 'table',
  });

  FormulaDependencyGraph.addDependency({
    formulaId: 'TRUE_PROFIT',
    dependsOnId: 'LANDED_COST',
    dependsOnType: 'formula',
  });

  FormulaDependencyGraph.addDependency({
    formulaId: 'TRUE_PROFIT',
    dependsOnId: 'OGRA_MARGIN',
    dependsOnType: 'formula',
  });

  FormulaDependencyGraph.addDependency({
    formulaId: 'TRUE_PROFIT',
    dependsOnId: 'expenses',
    dependsOnType: 'table',
  });

  // Landed Cost depends on:
  FormulaDependencyGraph.addDependency({
    formulaId: 'LANDED_COST',
    dependsOnId: 'purchase_orders',
    dependsOnType: 'table',
  });

  FormulaDependencyGraph.addDependency({
    formulaId: 'LANDED_COST',
    dependsOnId: 'bowser_deliveries',
    dependsOnType: 'table',
  });

  // OGRA Margin depends on:
  FormulaDependencyGraph.addDependency({
    formulaId: 'OGRA_MARGIN',
    dependsOnId: 'ogra_circulars',
    dependsOnType: 'table',
  });

  // DSO depends on:
  FormulaDependencyGraph.addDependency({
    formulaId: 'DSO',
    dependsOnId: 'customer_ledgers',
    dependsOnType: 'table',
  });

  FormulaDependencyGraph.addDependency({
    formulaId: 'DSO',
    dependsOnId: 'sales',
    dependsOnType: 'table',
  });

  // DPO depends on:
  FormulaDependencyGraph.addDependency({
    formulaId: 'DPO',
    dependsOnId: 'supplier_ledgers',
    dependsOnType: 'table',
  });

  FormulaDependencyGraph.addDependency({
    formulaId: 'DPO',
    dependsOnId: 'purchase_orders',
    dependsOnType: 'table',
  });

  // EVAP_LOSS depends on:
  FormulaDependencyGraph.addDependency({
    formulaId: 'EVAP_LOSS',
    dependsOnId: 'dip_readings',
    dependsOnType: 'table',
  });

  FormulaDependencyGraph.addDependency({
    formulaId: 'EVAP_LOSS',
    dependsOnId: 'nozzle_readings',
    dependsOnType: 'table',
  });

  // A.11.3 Cross-Module Dependency Graph
  FormulaDependencyGraph.addDependency({ formulaId: 'SHIFT_CLOSE', dependsOnId: 'METER_READING', dependsOnType: 'formula' });
  FormulaDependencyGraph.addDependency({ formulaId: 'METER_READING', dependsOnId: 'nozzle_readings', dependsOnType: 'table' });
  
  FormulaDependencyGraph.addDependency({ formulaId: 'SALES', dependsOnId: 'SHIFT_CLOSE', dependsOnType: 'formula' });
  
  FormulaDependencyGraph.addDependency({ formulaId: 'TANK_DIP', dependsOnId: 'SALES', dependsOnType: 'formula' });
  FormulaDependencyGraph.addDependency({ formulaId: 'SHIFT_CASH', dependsOnId: 'SALES', dependsOnType: 'formula' });
  
  FormulaDependencyGraph.addDependency({ formulaId: 'INVENTORY_REVALUATION', dependsOnId: 'TANK_DIP', dependsOnType: 'formula' });
  FormulaDependencyGraph.addDependency({ formulaId: 'VAULT_DEPOSIT', dependsOnId: 'SHIFT_CASH', dependsOnType: 'formula' });
  
  FormulaDependencyGraph.addDependency({ formulaId: 'JOURNAL_ENTRY', dependsOnId: 'INVENTORY_REVALUATION', dependsOnType: 'formula' });
  FormulaDependencyGraph.addDependency({ formulaId: 'JOURNAL_ENTRY', dependsOnId: 'VAULT_DEPOSIT', dependsOnType: 'formula' });
  
  FormulaDependencyGraph.addDependency({ formulaId: 'GL_TRIAL_BALANCE', dependsOnId: 'JOURNAL_ENTRY', dependsOnType: 'formula' });
  FormulaDependencyGraph.addDependency({ formulaId: 'EXECUTIVE_ANALYTICS', dependsOnId: 'GL_TRIAL_BALANCE', dependsOnType: 'formula' });

  logger.info('[DependencyGraph] Seed data loaded: Net Profit chain + DSO + DPO + EVAP_LOSS + Cross-Module Chain (A.11.3).');
}
