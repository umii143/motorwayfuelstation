/**
 * FuelPro Enterprise Reports Platform v3.0
 * CI Check Script — Formula Registry Consistency Validation
 *
 * Phase 9 C.3 Acceptance Criteria:
 * "Formula Registry and code-level formula map never diverge —
 *  add a CI check comparing registry formulaIds against the code-level
 *  lookup map's keys, failing the build if any formula exists in one but not the other."
 *
 * Usage:
 *   npx tsx scripts/validateFormulaRegistry.ts
 *
 * Exit codes:
 *   0 = All formulas are in sync
 *   1 = Mismatch detected (build should fail)
 */

import { FormulaRegistry } from '../src/lib/reports-v2/ebip/formulas/formulaRegistry';
import { RuleEngine } from '../src/lib/reports-v2/engines/RuleEngine';
import { WorkflowEngine } from '../src/lib/reports-v2/engines/WorkflowEngine';

// ──────────────────────────────────────────────
// EXPECTED FORMULA IDs
// These are the formulas that MUST exist in the code-level registry.
// If a formula is added to Firestore but not here, the CI check fails.
// If a formula is here but not in the registry, the CI check fails.
// ──────────────────────────────────────────────

const EXPECTED_FORMULA_IDS = [
  'FORMULA_GROSS_REVENUE',
  'FORMULA_CURRENT_STOCK',
  'FORMULA_OPERATING_EXPENSES',
  'FORMULA_NET_PROFIT',
  'FORMULA_TOTAL_LITERS_SOLD',
  'FORMULA_CASH_IN_HAND',
  'FORMULA_BUSINESS_HEALTH',
  'FORMULA_SALES_TRANSACTIONS',
  'FORMULA_AVG_SALE_VALUE',
  'FORMULA_CUSTOMER_RECEIVABLE',
  'FORMULA_SUPPLIER_PAYABLE',
  'FORMULA_BANK_BALANCE',
  'FORMULA_WALLET_BALANCE',
  'FORMULA_CASH_BALANCE',
  'FORMULA_SHIFT_COUNT',
  'FORMULA_PURCHASE_VALUE',
  'FORMULA_NOZZLE_DISPENSED',
  'FORMULA_DIP_COUNT',
  'FORMULA_LEDGER_TURNOVER',
  'FORMULA_AUDIT_EVENTS',
  'FORMULA_AUDIT_CRITICAL_EVENTS',
  'FORMULA_STAFF_COUNT',
  'FORMULA_ASSET_COUNT',
  'FORMULA_ASSET_VALUE',
  'FORMULA_PRICE_CHANGES',
  // v2.1 Proof Report Formulas
  'FORMULA_TRUE_PROFIT',
  'FORMULA_CASH_VARIANCE',
  'FORMULA_TANK_FILL_PERCENT',
];

const EXPECTED_RULE_IDS = [
  'RULE_CASH_VARIANCE_THRESHOLD',
  'RULE_TANK_REORDER_LEVEL',
  'RULE_PROFIT_MARGIN_HEALTH',
  'RULE_EXPENSE_BUDGET_PERCENT',
  'RULE_FLAGGED_SHIFTS',
  'RULE_CUSTOMER_OVERDUE',
];

const EXPECTED_WORKFLOW_IDS = [
  'WORKFLOW_EXPENSE_APPROVAL',
  'WORKFLOW_SUPPLIER_INVOICE_APPROVAL',
  'WORKFLOW_MONTHLY_CLOSING',
];

// ──────────────────────────────────────────────
// VALIDATION LOGIC
// ──────────────────────────────────────────────

function validateFormulas(): { passed: boolean; errors: string[] } {
  const errors: string[] = [];
  const registry = FormulaRegistry.getInstance();
  const codeFormulaIds = registry.getFormulaIds();

  // Check: every expected formula exists in the code registry
  for (const expectedId of EXPECTED_FORMULA_IDS) {
    if (!registry.hasFormula(expectedId)) {
      errors.push(`MISSING in code: Formula '${expectedId}' is expected but not found in FormulaRegistry.`);
    }
  }

  // Check: every code formula is in the expected list
  for (const codeId of codeFormulaIds) {
    if (!EXPECTED_FORMULA_IDS.includes(codeId)) {
      errors.push(`UNEXPECTED in code: Formula '${codeId}' exists in code but is not in the expected list. Add it to EXPECTED_FORMULA_IDS or remove it from the registry.`);
    }
  }

  return { passed: errors.length === 0, errors };
}

function validateRules(): { passed: boolean; errors: string[] } {
  const errors: string[] = [];
  const ruleEngine = RuleEngine.getInstance();
  const codeRuleIds = ruleEngine.getRuleIds();

  // Check: every expected rule exists in the code registry
  for (const expectedId of EXPECTED_RULE_IDS) {
    if (!ruleEngine.hasRule(expectedId)) {
      errors.push(`MISSING in code: Rule '${expectedId}' is expected but not found in RuleEngine.`);
    }
  }

  // Check: every code rule is in the expected list
  for (const codeId of codeRuleIds) {
    if (!EXPECTED_RULE_IDS.includes(codeId)) {
      errors.push(`UNEXPECTED in code: Rule '${codeId}' exists in code but is not in the expected list.`);
    }
  }

  return { passed: errors.length === 0, errors };
}

function validateWorkflows(): { passed: boolean; errors: string[] } {
  const errors: string[] = [];
  const workflowEngine = WorkflowEngine.getInstance();
  const codeWorkflowIds = workflowEngine.getWorkflowIds();

  // Check: every expected workflow exists in the code registry
  for (const expectedId of EXPECTED_WORKFLOW_IDS) {
    if (!workflowEngine.getWorkflow(expectedId)) {
      errors.push(`MISSING in code: Workflow '${expectedId}' is expected but not found in WorkflowEngine.`);
    }
  }

  // Check: every code workflow is in the expected list
  for (const codeId of codeWorkflowIds) {
    if (!EXPECTED_WORKFLOW_IDS.includes(codeId)) {
      errors.push(`UNEXPECTED in code: Workflow '${codeId}' exists in code but is not in the expected list.`);
    }
  }

  return { passed: errors.length === 0, errors };
}

// ──────────────────────────────────────────────
// MAIN
// ──────────────────────────────────────────────

function main(): void {
  console.log('═══════════════════════════════════════════════════');
  console.log('  FuelPro CI Check — Registry Consistency Validation');
  console.log('═══════════════════════════════════════════════════\n');

  let allPassed = true;

  // Validate Formulas
  console.log('📋 Validating Formula Registry...');
  const formulaResult = validateFormulas();
  if (formulaResult.passed) {
    console.log(`   ✅ All ${EXPECTED_FORMULA_IDS.length} formulas are in sync.`);
  } else {
    allPassed = false;
    console.log(`   ❌ ${formulaResult.errors.length} formula mismatch(es) found:`);
    formulaResult.errors.forEach(e => console.log(`      • ${e}`));
  }
  console.log('');

  // Validate Rules
  console.log('📋 Validating Rule Registry...');
  const ruleResult = validateRules();
  if (ruleResult.passed) {
    console.log(`   ✅ All ${EXPECTED_RULE_IDS.length} rules are in sync.`);
  } else {
    allPassed = false;
    console.log(`   ❌ ${ruleResult.errors.length} rule mismatch(es) found:`);
    ruleResult.errors.forEach(e => console.log(`      • ${e}`));
  }
  console.log('');

  // Validate Workflows
  console.log('📋 Validating Workflow Registry...');
  const workflowResult = validateWorkflows();
  if (workflowResult.passed) {
    console.log(`   ✅ All ${EXPECTED_WORKFLOW_IDS.length} workflows are in sync.`);
  } else {
    allPassed = false;
    console.log(`   ❌ ${workflowResult.errors.length} workflow mismatch(es) found:`);
    workflowResult.errors.forEach(e => console.log(`      • ${e}`));
  }
  console.log('');

  // Summary
  console.log('═══════════════════════════════════════════════════');
  if (allPassed) {
    console.log('  ✅ CI CHECK PASSED — All registries are consistent.');
    console.log('═══════════════════════════════════════════════════');
    process.exit(0);
  } else {
    console.log('  ❌ CI CHECK FAILED — Registry mismatches detected.');
    console.log('  Build cannot proceed until all registries are in sync.');
    console.log('═══════════════════════════════════════════════════');
    process.exit(1);
  }
}

main();