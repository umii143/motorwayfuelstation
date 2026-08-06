/**
 * FuelPro Enterprise — Formula Dependency Graph Tests (PRD v6.1 A.2)
 *
 * Acceptance Proof: getDownstreamReports('OGRA_MARGIN') returns the correct
 * downstream report_ids derived from the graph — not hardcoded.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { FormulaDependencyGraph, seedDependencyGraph } from '../FormulaDependencyGraph';
import { FormulaRegistry, seedFormulaRegistry } from '../FormulaRegistry';

describe('FormulaDependencyGraph (A.2)', () => {
  beforeEach(() => {
    FormulaRegistry._clear();
    FormulaDependencyGraph._clear();
    seedFormulaRegistry();
    seedDependencyGraph();
  });

  it('should seed the dependency graph with edges', () => {
    const edges = FormulaDependencyGraph.getAllEdges();
    expect(edges.length).toBeGreaterThan(0);
  });

  it('getDirectDependents("OGRA_MARGIN") returns TRUE_PROFIT (it depends on OGRA_MARGIN)', () => {
    const dependents = FormulaDependencyGraph.getDirectDependents('OGRA_MARGIN');
    expect(dependents).toContain('TRUE_PROFIT');
  });

  it('getDirectDependents("LANDED_COST") returns TRUE_PROFIT', () => {
    const dependents = FormulaDependencyGraph.getDirectDependents('LANDED_COST');
    expect(dependents).toContain('TRUE_PROFIT');
  });

  it('getDownstreamReports("OGRA_MARGIN") returns reports that use OGRA_MARGIN + TRUE_PROFIT', () => {
    const reports = FormulaDependencyGraph.getDownstreamReports('OGRA_MARGIN');
    // OGRA_MARGIN_V1 usedBy: ['PRC-01', 'INV-01']
    // TRUE_PROFIT_V1 usedBy: ['FO-03', 'PRC-01', 'LED-05'] (depends on OGRA_MARGIN)
    expect(reports).toContain('PRC-01');
    expect(reports).toContain('INV-01');
    expect(reports).toContain('FO-03');
    expect(reports).toContain('LED-05');
    // Should be exactly 4 unique report_ids
    expect(new Set(reports).size).toBe(4);
  });

  it('getDownstreamReports("LANDED_COST") returns reports that use LANDED_COST + TRUE_PROFIT', () => {
    const reports = FormulaDependencyGraph.getDownstreamReports('LANDED_COST');
    // LANDED_COST_V1 usedBy: ['LED-05', 'PRC-03']
    // TRUE_PROFIT_V1 usedBy: ['FO-03', 'PRC-01', 'LED-05']
    expect(reports).toContain('LED-05');
    expect(reports).toContain('PRC-03');
    expect(reports).toContain('FO-03');
    expect(reports).toContain('PRC-01');
  });

  it('getDownstreamReports("DSO") returns only DSO reports (no downstream dependents)', () => {
    const reports = FormulaDependencyGraph.getDownstreamReports('DSO');
    // DSO_V1 usedBy: ['CUS-02']
    expect(reports).toContain('CUS-02');
    expect(reports.length).toBe(1);
  });

  it('getAllDownstreamFormulas("ogra_circulars") returns OGRA_MARGIN + TRUE_PROFIT', () => {
    // ogra_circulars table → OGRA_MARGIN depends on it → TRUE_PROFIT depends on OGRA_MARGIN
    const downstreamFormulas = FormulaDependencyGraph.getAllDownstreamFormulas('ogra_circulars');
    expect(downstreamFormulas).toContain('OGRA_MARGIN');
    expect(downstreamFormulas).toContain('TRUE_PROFIT');
  });

  it('getDownstreamReports for a table "purchase_orders" propagates through LANDED_COST → TRUE_PROFIT', () => {
    // purchase_orders table → LANDED_COST + DPO depend on it
    const downstreamFormulas = FormulaDependencyGraph.getAllDownstreamFormulas('purchase_orders');
    expect(downstreamFormulas).toContain('LANDED_COST');
    expect(downstreamFormulas).toContain('DPO');
    expect(downstreamFormulas).toContain('TRUE_PROFIT'); // via LANDED_COST
  });
});
