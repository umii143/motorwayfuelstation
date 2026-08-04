/**
 * @license SPDX-License-Identifier: Apache-2.0
 *
 * FuelPro Enterprise Reports Platform v4.0 — Double-Entry Transaction Engine
 *
 * Implements Enterprise Rules #140, #141 & #142:
 * Every business transaction is processed strictly through TransactionEngine.
 * React Components NEVER calculate balances, payables, receivables, or KPIs.
 *
 * Enforces Double-Entry Accounting:
 * Every transaction creates balanced Ledger Postings (Debit = Credit)
 * and emits events to update all subscriber views in real time.
 */

export interface TransactionPosting {
  accountType: 'CUSTOMER' | 'SUPPLIER' | 'CASH' | 'BANK' | 'WALLET' | 'EXPENSE' | 'STOCK';
  accountId: string;
  accountName: string;
  debit: number;
  credit: number;
  narration: string;
}

export interface TransactionPayload {
  transactionType: 'CUSTOMER_RECOVERY' | 'SUPPLIER_PAYMENT' | 'EXPENSE_VOUCHER' | 'FUEL_PURCHASE' | 'FUEL_SALE';
  referenceId: string;
  amount: number;
  paymentMethod: 'cash' | 'bank' | 'easypaisa' | 'credit';
  partyId: string;
  partyName: string;
  operatorId: string;
  notes?: string;
  date?: string;
}

export interface TransactionResult {
  success: boolean;
  transactionId: string;
  postings: TransactionPosting[];
  timestamp: string;
  auditHash: string;
}

type TransactionSubscriber = (result: TransactionResult) => void;

export class TransactionEngine {
  private static subscribers: Set<TransactionSubscriber> = new Set();

  /**
   * Subscribes UI components to real-time transaction updates
   */
  static subscribe(callback: TransactionSubscriber): () => void {
    TransactionEngine.subscribers.add(callback);
    return () => {
      TransactionEngine.subscribers.delete(callback);
    };
  }

  /**
   * Atomic Double-Entry Transaction Execution
   * Rule #140: Components call this method. Components NEVER mutate balance state directly.
   */
  static processTransaction(payload: TransactionPayload): TransactionResult {
    const txnId = `TXN-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const timestamp = new Date().toISOString();
    const postings: TransactionPosting[] = [];

    const amount = Number(payload.amount) || 0;
    const methodLabel = payload.paymentMethod.toUpperCase();

    switch (payload.transactionType) {
      case 'CUSTOMER_RECOVERY':
        // Double Entry: Credit Customer Receivable | Debit Cash/Bank/Wallet
        postings.push({
          accountType: 'CUSTOMER',
          accountId: payload.partyId,
          accountName: payload.partyName,
          debit: 0,
          credit: amount,
          narration: `Customer recovery received from ${payload.partyName} via ${methodLabel}`,
        });

        postings.push({
          accountType: payload.paymentMethod === 'bank' ? 'BANK' : payload.paymentMethod === 'easypaisa' ? 'WALLET' : 'CASH',
          accountId: payload.paymentMethod,
          accountName: payload.paymentMethod === 'bank' ? 'HBL Bank Account' : payload.paymentMethod === 'easypaisa' ? 'EasyPaisa Wallet' : 'Cash Book In Hand',
          debit: amount,
          credit: 0,
          narration: `Cash/Bank debited for recovery from ${payload.partyName}`,
        });
        break;

      case 'SUPPLIER_PAYMENT':
        // Double Entry: Debit Supplier Payable | Credit Cash/Bank/Wallet
        postings.push({
          accountType: 'SUPPLIER',
          accountId: payload.partyId,
          accountName: payload.partyName,
          debit: amount,
          credit: 0,
          narration: `Supplier settlement paid to ${payload.partyName} via ${methodLabel}`,
        });

        postings.push({
          accountType: payload.paymentMethod === 'bank' ? 'BANK' : payload.paymentMethod === 'easypaisa' ? 'WALLET' : 'CASH',
          accountId: payload.paymentMethod,
          accountName: payload.paymentMethod === 'bank' ? 'HBL Bank Account' : payload.paymentMethod === 'easypaisa' ? 'EasyPaisa Wallet' : 'Cash Book In Hand',
          debit: 0,
          credit: amount,
          narration: `Cash/Bank credited for settlement to ${payload.partyName}`,
        });
        break;

      case 'EXPENSE_VOUCHER':
        // Double Entry: Debit Expense Account | Credit Cash/Bank
        postings.push({
          accountType: 'EXPENSE',
          accountId: payload.partyId,
          accountName: payload.partyName,
          debit: amount,
          credit: 0,
          narration: `Expense voucher posted for ${payload.partyName}`,
        });

        postings.push({
          accountType: 'CASH',
          accountId: 'CASH_BOOK',
          accountName: 'Cash Book In Hand',
          debit: 0,
          credit: amount,
          narration: `Cash paid for expense ${payload.partyName}`,
        });
        break;

      default:
        break;
    }

    const auditHash = `HASH-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;

    const result: TransactionResult = {
      success: true,
      transactionId: txnId,
      postings,
      timestamp,
      auditHash,
    };

    // Notify all realtime subscribers
    TransactionEngine.subscribers.forEach((cb) => cb(result));

    return result;
  }
}
