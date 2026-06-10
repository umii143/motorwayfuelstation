/**
 * FuelPro EOC — Core Services Index
 * Single barrel export for all EOC engines.
 * Import from '@/services/core' for clean imports across the app.
 * Powered by Umar Ali ⚡
 */

export * from './journalEngine';
export * from './ledgerEngine';
export * from './treasuryEngine';
export * from './approvalEngine';
export * from './reversalEngine';
export * from './reconciliationEngine';
export * from './integrityEngine';
export * from './fraudEngine';
export * from './eventBus';
export * from './auditEngine';
export * from './periodEngine';
export * from './snapshotEngine';
export * from './analyticsEngine';
export * as OperationalCore from './operationalCore';

// Re-export the most commonly used functions directly
export {
  processCreditSale,
  processRecovery,
  processExpense,
  processBankDeposit,
  processDigitalPayment,
  processSupplierPayment,
  processDiscount,
  processLubeSale,
  processReversal,
  processShiftOpen,
  processShiftClose,
  getShiftTransactions,
  getPendingTransactions,
} from './operationalCore';
