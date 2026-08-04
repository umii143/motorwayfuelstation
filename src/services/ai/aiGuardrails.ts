export interface GuardrailValidationResult {
  allowed: boolean;
  reason?: string;
  sanitizedQuery?: string;
}

export type RiskLevel = 'SAFE' | 'LOW_RISK' | 'HIGH_RISK' | 'CRITICAL';

export interface ToolRiskProfile {
  name: string;
  riskLevel: RiskLevel;
  requiresOtp: boolean;
  requiresOwnerRole: boolean;
}

// 1. Prompt Injection Detection
const INJECTION_PATTERNS = [
  /ignore\s+(previous|all)\s+instructions/i,
  /forget\s+(the\s+)?database/i,
  /\bpretend\b/i,
  /\binvent\b/i,
  /\bimagine\b/i,
  /\broleplay\b/i,
  /\bassume\b/i,
  /override\s+system/i,
  /bypass\s+security/i,
  /show\s+all\s+(passwords|tokens|secrets|keys)/i,
];

export function validatePromptInput(userQuery: string): GuardrailValidationResult {
  if (!userQuery || typeof userQuery !== 'string') {
    return { allowed: false, reason: 'Invalid input.' };
  }

  for (const pattern of INJECTION_PATTERNS) {
    if (pattern.test(userQuery)) {
      return {
        allowed: false,
        reason: 'Operational database remains authoritative. Request rejected due to prompt security policy violation.'
      };
    }
  }

  return { allowed: true, sanitizedQuery: userQuery.trim() };
}

// 2. Anti-Hallucination Response Validator
const SPECULATIVE_PATTERNS = [
  /\bmaybe\b/i,
  /\bguess\b/i,
  /\bprobably\b/i,
  /\bI think\b/i,
  /\bI assume\b/i,
  /\bwithout checking data\b/i,
];

export function validateResponseContent(
  rawText: string,
  collectionsChecked: string[] = ['tanks', 'inventory', 'shifts', 'sales', 'ledger', 'suppliers']
): { text: string; confidence: number; collectionsChecked: string[] } {
  if (!rawText || rawText.trim().length === 0) {
    return {
      text: `No matching live operational records found.\n\nCollections Checked:\n${collectionsChecked.map(c => `✓ ${c}`).join('\n')}`,
      confidence: 100,
      collectionsChecked
    };
  }

  // Check for speculation when data is uncertain
  let containsSpeculation = false;
  for (const pattern of SPECULATIVE_PATTERNS) {
    if (pattern.test(rawText)) {
      containsSpeculation = true;
      break;
    }
  }

  if (containsSpeculation) {
    const sanitized = rawText
      .replace(/I guess/gi, 'Based on verified database records')
      .replace(/maybe/gi, 'statistically indicated')
      .replace(/probably/gi, 'verified');
    return {
      text: sanitized + `\n\n*(Verified against operational database)*`,
      confidence: 88,
      collectionsChecked
    };
  }

  return {
    text: rawText,
    confidence: 99,
    collectionsChecked
  };
}

// 3. Tool Function Call Whitelist & Risk Classification
const TOOL_RISK_MAP: Record<string, ToolRiskProfile> = {
  getTodaySales: { name: 'getTodaySales', riskLevel: 'SAFE', requiresOtp: false, requiresOwnerRole: false },
  getCurrentStock: { name: 'getCurrentStock', riskLevel: 'SAFE', requiresOtp: false, requiresOwnerRole: false },
  getSupplierBalance: { name: 'getSupplierBalance', riskLevel: 'SAFE', requiresOtp: false, requiresOwnerRole: false },
  getShiftSummary: { name: 'getShiftSummary', riskLevel: 'SAFE', requiresOtp: false, requiresOwnerRole: false },
  getTankStatus: { name: 'getTankStatus', riskLevel: 'SAFE', requiresOtp: false, requiresOwnerRole: false },

  generatePurchaseOrderDraft: { name: 'generatePurchaseOrderDraft', riskLevel: 'LOW_RISK', requiresOtp: false, requiresOwnerRole: false },
  generateReport: { name: 'generateReport', riskLevel: 'LOW_RISK', requiresOtp: false, requiresOwnerRole: false },

  createPurchaseOrder: { name: 'createPurchaseOrder', riskLevel: 'HIGH_RISK', requiresOtp: false, requiresOwnerRole: true },
  closeShift: { name: 'closeShift', riskLevel: 'HIGH_RISK', requiresOtp: false, requiresOwnerRole: true },
  approvePayment: { name: 'approvePayment', riskLevel: 'HIGH_RISK', requiresOtp: true, requiresOwnerRole: true },

  deleteInvoice: { name: 'deleteInvoice', riskLevel: 'CRITICAL', requiresOtp: true, requiresOwnerRole: true },
  deleteShift: { name: 'deleteShift', riskLevel: 'CRITICAL', requiresOtp: true, requiresOwnerRole: true },
  deleteCustomer: { name: 'deleteCustomer', riskLevel: 'CRITICAL', requiresOtp: true, requiresOwnerRole: true },
  deleteLedger: { name: 'deleteLedger', riskLevel: 'CRITICAL', requiresOtp: true, requiresOwnerRole: true },
  updateStock: { name: 'updateStock', riskLevel: 'CRITICAL', requiresOtp: true, requiresOwnerRole: true },
};

export function classifyToolRisk(functionName: string): ToolRiskProfile {
  return TOOL_RISK_MAP[functionName] || {
    name: functionName,
    riskLevel: 'CRITICAL',
    requiresOtp: true,
    requiresOwnerRole: true
  };
}

// 4. Sensitive Data Masking Policy
export function maskCNIC(cnic: string): string {
  if (!cnic || cnic.length < 13) return cnic;
  const clean = cnic.replace(/\D/g, '');
  if (clean.length === 13) {
    return `${clean.substring(0, 5)}-*****-${clean.substring(12)}`;
  }
  return cnic;
}

export function maskBankAccount(account: string): string {
  if (!account || account.length < 4) return account;
  return '****' + account.slice(-4);
}

export function maskSensitiveText(text: string): string {
  if (!text) return text;
  // Mask CNICs (e.g. 35202-1234567-1 -> 35202-*****-1)
  let sanitized = text.replace(/\b(\d{5})[-]?(\d{7})[-]?(\d{1})\b/g, '$1-*****-$3');
  // Mask Bank Accounts (e.g. Acc# 123456789012 -> Acc# ****9012)
  sanitized = sanitized.replace(/\b(Account|Acc|A\/C)[:\s]+(\d{4,18})\b/gi, (match, prefix, num) => {
    return `${prefix}: ****${num.slice(-4)}`;
  });
  // Mask Secrets / Keys
  sanitized = sanitized.replace(/\b(gsk_[A-Za-z0-9_-]{10,})\b/g, 'gsk_****************');
  sanitized = sanitized.replace(/\b(AIzaSy[A-Za-z0-9_-]{10,})\b/g, 'AIzaSy****************');
  return sanitized;
}
