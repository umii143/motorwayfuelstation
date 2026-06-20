import { Shift, Staff, DebitEntry, ExpenseEntry, RecoveryEntry, BankCashEntry, DigitalCashEntry } from '../types';

export interface ShiftTimelineEvent {
  id: string;
  timestamp: string;
  type: 'sale' | 'credit' | 'expense' | 'recovery' | 'bank' | 'digital' | 'system';
  title: string;
  description: string;
  amount: number;
  chapter: string;
}

export interface ShiftHealthScore {
  cashIntegrity: number; // 0-100
  inventoryIntegrity: number; // 0-100
  recoveryEfficiency: number; // 0-100
  expenseControl: number; // 0-100
  overallSHI: number; // 0-100
  status: 'Excellent' | 'Good' | 'Needs Investigation' | 'Critical';
  riskLevel: 'Low' | 'Medium' | 'High' | 'Critical';
}

export class InvestigationEngine {
  
  /**
   * Generates a unique "Shift DNA" hash based on core attributes.
   * Ensures that historical records have a verifiable fingerprint.
   */
  static generateShiftDNA(shift: Shift): string {
    const dataStr = `${shift.id}-${shift.staffId}-${shift.date}-${shift.expectedCash}-${shift.submittedCash}`;
    // A simple pseudo-hash generator for demonstration. In production, use crypto.subtle.digest
    let hash = 0;
    for (let i = 0; i < dataStr.length; i++) {
      const char = dataStr.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    const hex = Math.abs(hash).toString(16).toUpperCase();
    return `DNA-${hex.substring(0, 4)}-${hex.substring(4, 8) || '0000'}`;
  }

  /**
   * Evaluates the 5-pillar Health Score of a shift.
   */
  static evaluateShiftHealth(shift: Shift): ShiftHealthScore {
    // 1. Cash Integrity
    const variance = shift.shortage > 0 ? -shift.shortage : shift.overage;
    const expected = shift.expectedCash || 1;
    const variancePercentage = Math.abs(variance) / expected;
    let cashIntegrity = 100 - (variancePercentage * 1000); // 1% variance = -10 points
    if (cashIntegrity < 0) cashIntegrity = 0;
    if (cashIntegrity > 100) cashIntegrity = 100;

    // 2. Recovery Efficiency
    const totalCredit = shift.debitEntries?.reduce((sum, d) => sum + d.amount, 0) || 0;
    const totalRecovery = shift.recoveryEntries?.reduce((sum, r) => sum + r.amount, 0) || 0;
    let recoveryEfficiency = 100;
    if (totalCredit > 0) {
      recoveryEfficiency = Math.min(100, (totalRecovery / totalCredit) * 100);
    } else if (totalRecovery > 0) {
      recoveryEfficiency = 100; // Good
    }

    // 3. Expense Control
    const totalExpenses = shift.expenseEntries?.reduce((sum, e) => sum + e.amount, 0) || 0;
    let expenseControl = 100;
    // Assuming a baseline acceptable expense ratio of 2% of expected cash
    const expenseRatio = totalExpenses / expected;
    if (expenseRatio > 0.02) {
      expenseControl = Math.max(0, 100 - ((expenseRatio - 0.02) * 500));
    }

    // 4. Inventory Integrity (Simplified without live dips)
    const inventoryIntegrity = 100; // Will be fully calculated when linked to dips

    // Overall SHI
    const overallSHI = Math.round((cashIntegrity + recoveryEfficiency + expenseControl + inventoryIntegrity) / 4);

    let status: 'Excellent' | 'Good' | 'Needs Investigation' | 'Critical' = 'Excellent';
    let riskLevel: 'Low' | 'Medium' | 'High' | 'Critical' = 'Low';

    if (overallSHI >= 95) {
      status = 'Excellent';
      riskLevel = 'Low';
    } else if (overallSHI >= 85) {
      status = 'Good';
      riskLevel = 'Medium';
    } else if (overallSHI >= 70) {
      status = 'Needs Investigation';
      riskLevel = 'High';
    } else {
      status = 'Critical';
      riskLevel = 'Critical';
    }

    return {
      cashIntegrity: Math.round(cashIntegrity),
      inventoryIntegrity: Math.round(inventoryIntegrity),
      recoveryEfficiency: Math.round(recoveryEfficiency),
      expenseControl: Math.round(expenseControl),
      overallSHI,
      status,
      riskLevel
    };
  }

  /**
   * Compiles the A to Z Chronological Timeline of events.
   */
  static generateShiftTimeline(shift: Shift): ShiftTimelineEvent[] {
    const events: ShiftTimelineEvent[] = [];

    // System Events
    events.push({
      id: `open-${shift.id}`,
      timestamp: `${shift.date}T${shift.startTime}`,
      type: 'system',
      title: 'Shift Opened',
      description: 'System initialization and opening readings recorded.',
      amount: 0,
      chapter: 'Audit Events'
    });

    if (shift.status === 'closed' && shift.endTime) {
      events.push({
        id: `close-${shift.id}`,
        timestamp: `${shift.date}T${shift.endTime}`,
        type: 'system',
        title: 'Shift Closed',
        description: 'Shift locked and vault records generated.',
        amount: 0,
        chapter: 'Audit Events'
      });
    }

    // Expenses
    shift.expenseEntries?.forEach(e => {
      events.push({
        id: e.id,
        timestamp: `${e.date}T12:00:00`, // Ideally we have exact time in expense
        type: 'expense',
        title: 'Expense Recorded',
        description: `${e.category || 'General'} - ${e.description}`,
        amount: e.amount,
        chapter: 'Expense Events'
      });
    });

    // Credits
    shift.debitEntries?.forEach(d => {
      events.push({
        id: d.id,
        timestamp: `${shift.date}T10:00:00`, // Fallback time
        type: 'credit',
        title: 'Credit Sale Issued',
        description: `Product: ${d.productId} | Note: ${d.note}`,
        amount: d.amount,
        chapter: 'Sales Events'
      });
    });

    // Recoveries
    shift.recoveryEntries?.forEach(r => {
      events.push({
        id: r.id,
        timestamp: `${shift.date}T14:00:00`, // Fallback time
        type: 'recovery',
        title: 'Recovery Collected',
        description: `Mode: ${r.mode} | Ref: ${r.reference}`,
        amount: r.amount,
        chapter: 'Recovery Events'
      });
    });

    // Bank Deposits
    shift.bankCashEntries?.forEach(b => {
      events.push({
        id: b.id,
        timestamp: `${shift.date}T15:00:00`, // Fallback time
        type: 'bank',
        title: 'Bank Deposit',
        description: `Ref: ${b.reference}`,
        amount: b.amount,
        chapter: 'Recovery Events'
      });
    });

    // Sort Chronologically
    return events.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }
}
