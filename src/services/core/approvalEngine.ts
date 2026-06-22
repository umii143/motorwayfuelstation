/**
 * FuelPro EOC — Approval Engine
 * Approval matrix for transaction-level authorization.
 * No journal posts until approval threshold is satisfied.
 * Powered by Umar Ali ⚡
 */

import { safeGetItem, safeSetItem } from './coreStorage';

// ─── Types ────────────────────────────────────────────────────────────────────

export type ApprovalRole = 'auto' | 'cashier' | 'manager' | 'owner';
export type ApprovalStatus = 'pending' | 'approved' | 'rejected' | 'auto_approved' | 'expired';

export interface ApprovalRule {
  id: string;
  transactionType: string;
  minAmount: number;
  maxAmount: number;            // Infinity for no upper limit
  requiredRole: ApprovalRole;
  requiresJustification: boolean;
  description: string;
}

export interface ApprovalRequest {
  id: string;
  transactionId: string;
  transactionType: string;
  amount: number;
  requestedBy: string;
  requestedAt: string;
  requiredRole: ApprovalRole;
  status: ApprovalStatus;
  reviewedBy?: string;
  reviewedAt?: string;
  justification?: string;
  rejectionReason?: string;
  stationId: string;
  branchId: string;
  expiresAt?: string;           // Auto-expire after 24h
}

export interface ApprovalDecision {
  approved: boolean;
  rule: ApprovalRule;
  request?: ApprovalRequest;
  message: string;
}

// ─── Default Approval Matrix ──────────────────────────────────────────────────

const DEFAULT_RULES: ApprovalRule[] = [
  // Supplier Payments
  { id: 'rule_sup_mgr',   transactionType: 'supplier_payment', minAmount: 0,       maxAmount: 100000,   requiredRole: 'manager',  requiresJustification: false, description: 'Supplier payments up to Rs 100,000 require Manager approval' },
  { id: 'rule_sup_owner', transactionType: 'supplier_payment', minAmount: 100001,  maxAmount: Infinity, requiredRole: 'owner',    requiresJustification: true,  description: 'Supplier payments above Rs 100,000 require Owner approval' },
  // Cash Variance
  { id: 'rule_var_auto',  transactionType: 'cash_variance',    minAmount: 0,       maxAmount: 999,      requiredRole: 'auto',     requiresJustification: false, description: 'Cash variances under Rs 1,000 are auto-approved' },
  { id: 'rule_var_mgr',   transactionType: 'cash_variance',    minAmount: 1000,    maxAmount: 10000,    requiredRole: 'manager',  requiresJustification: true,  description: 'Cash variances Rs 1,000–10,000 require Manager approval' },
  { id: 'rule_var_owner', transactionType: 'cash_variance',    minAmount: 10001,   maxAmount: Infinity, requiredRole: 'owner',    requiresJustification: true,  description: 'Cash variances above Rs 10,000 require Owner approval' },
  // Discounts
  { id: 'rule_disc_mgr',  transactionType: 'discount',         minAmount: 0,       maxAmount: Infinity, requiredRole: 'manager',  requiresJustification: true,  description: 'All discounts require Manager approval' },
  // Owner Drawing
  { id: 'rule_draw_own',  transactionType: 'owner_drawing',    minAmount: 0,       maxAmount: Infinity, requiredRole: 'owner',    requiresJustification: false, description: 'Owner drawings require Owner self-approval' },
  // Period Close
  { id: 'rule_period',    transactionType: 'period_close',     minAmount: 0,       maxAmount: Infinity, requiredRole: 'owner',    requiresJustification: true,  description: 'Accounting period closing requires Owner approval' },
  // Expense (large)
  { id: 'rule_exp_auto',  transactionType: 'expense',          minAmount: 0,       maxAmount: 10000,    requiredRole: 'auto',     requiresJustification: false, description: 'Expenses under Rs 10,000 are auto-approved' },
  { id: 'rule_exp_mgr',   transactionType: 'expense',          minAmount: 10001,   maxAmount: Infinity, requiredRole: 'manager',  requiresJustification: true,  description: 'Expenses above Rs 10,000 require Manager approval' },
];

// ─── Storage Keys ─────────────────────────────────────────────────────────────

const _requestsKey = (stationId: string) => `fuelpro_approval_requests_${stationId}`;
const _rulesKey = (stationId: string) => `fuelpro_approval_rules_${stationId}`;

// ─── Core Functions ───────────────────────────────────────────────────────────

/** Get approval rules for a station (uses defaults if not customized). */
export async function getApprovalRules(stationId: string): Promise<ApprovalRule[]> {
  const raw = await safeGetItem(_rulesKey(stationId));
  if (!raw) return DEFAULT_RULES;
  try { return JSON.parse(raw) ?? DEFAULT_RULES; } catch { return DEFAULT_RULES; }
}

/** Find the matching approval rule for a given transaction type + amount. */
export async function findApplicableRule(
  stationId: string,
  transactionType: string,
  amount: number
): Promise<ApprovalRule | null> {
  const rules = await getApprovalRules(stationId);
  return rules.find(r =>
    r.transactionType === transactionType &&
    amount >= r.minAmount &&
    amount <= r.maxAmount
  ) ?? null;
}

/**
 * Check if a transaction requires approval.
 * Returns the decision — auto-approved immediately or needs a request.
 */
export async function checkApprovalRequirement(
  stationId: string,
  branchId: string,
  transactionType: string,
  amount: number,
  requestedBy: string,
  transactionId: string
): Promise<ApprovalDecision> {
  const rule = await findApplicableRule(stationId, transactionType, amount);

  // No rule found = auto-approve (unconstrained transaction type)
  if (!rule) {
    return {
      approved: true,
      rule: { id: 'default', transactionType, minAmount: 0, maxAmount: Infinity, requiredRole: 'auto', requiresJustification: false, description: 'No rule found — auto-approved' },
      message: 'Auto-approved: No approval rule configured for this transaction type.',
    };
  }

  if (rule.requiredRole === 'auto') {
    return { approved: true, rule, message: `Auto-approved: ${rule.description}` };
  }

  // Needs human approval — create a pending request
  const request = await createApprovalRequest(stationId, branchId, transactionId, transactionType, amount, requestedBy, rule);
  return {
    approved: false,
    rule,
    request,
    message: `Approval required from ${rule.requiredRole.toUpperCase()}. Request #${request.id} created.`,
  };
}

/** Create a pending approval request. */
export async function createApprovalRequest(
  stationId: string,
  branchId: string,
  transactionId: string,
  transactionType: string,
  amount: number,
  requestedBy: string,
  rule: ApprovalRule
): Promise<ApprovalRequest> {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();

  const request: ApprovalRequest = {
    id: `apr_${transactionId}`,
    transactionId,
    transactionType,
    amount,
    requestedBy,
    requestedAt: now.toISOString(),
    requiredRole: rule.requiredRole,
    status: 'pending',
    stationId,
    branchId,
    expiresAt,
  };

  const all = await getAllApprovalRequests(stationId);
  all.push(request);
  await _persistRequests(stationId, all);
  return request;
}

/** Approve a transaction request. */
export async function approveTransaction(
  stationId: string,
  requestId: string,
  approvedBy: string,
  justification?: string
): Promise<ApprovalRequest> {
  const all = await getAllApprovalRequests(stationId);
  const idx = all.findIndex(r => r.id === requestId);
  if (idx === -1) throw new Error(`[ApprovalEngine] Request not found: ${requestId}`);

  all[idx] = {
    ...all[idx],
    status: 'approved',
    reviewedBy: approvedBy,
    reviewedAt: new Date().toISOString(),
    justification,
  };
  await _persistRequests(stationId, all);
  return all[idx];
}

/** Reject a transaction request. */
export async function rejectTransaction(
  stationId: string,
  requestId: string,
  rejectedBy: string,
  reason: string
): Promise<ApprovalRequest> {
  const all = await getAllApprovalRequests(stationId);
  const idx = all.findIndex(r => r.id === requestId);
  if (idx === -1) throw new Error(`[ApprovalEngine] Request not found: ${requestId}`);

  all[idx] = {
    ...all[idx],
    status: 'rejected',
    reviewedBy: rejectedBy,
    reviewedAt: new Date().toISOString(),
    rejectionReason: reason,
  };
  await _persistRequests(stationId, all);
  return all[idx];
}

/** Get all pending approvals for a station. */
export async function getPendingApprovals(stationId: string): Promise<ApprovalRequest[]> {
  const all = await getAllApprovalRequests(stationId);
  return all.filter(r => r.status === 'pending');
}

/** Get approval request by transaction ID. */
export async function getApprovalByTxn(
  stationId: string,
  transactionId: string
): Promise<ApprovalRequest | null> {
  const all = await getAllApprovalRequests(stationId);
  return all.find(r => r.transactionId === transactionId) ?? null;
}

/** Check if a specific transaction has been approved. */
export async function isTransactionApproved(
  stationId: string,
  transactionId: string
): Promise<boolean> {
  const request = await getApprovalByTxn(stationId, transactionId);
  if (!request) return true;  // No request = auto-approved
  return request.status === 'approved' || request.status === 'auto_approved';
}

/** Get all approval requests. */
export async function getAllApprovalRequests(stationId: string): Promise<ApprovalRequest[]> {
  const raw = await safeGetItem(_requestsKey(stationId));
  if (!raw) return [];
  try { return JSON.parse(raw) ?? []; } catch { return []; }
}

// ─── Storage Helpers ──────────────────────────────────────────────────────────

async function _persistRequests(stationId: string, requests: ApprovalRequest[]): Promise<void> {
  await safeSetItem(_requestsKey(stationId), JSON.stringify(requests));
}
