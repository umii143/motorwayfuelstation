import { describe, it, expect } from 'vitest';
import { Shift, DebitEntry, RecoveryEntry, ExpenseEntry, BankCashEntry, DigitalCashEntry, SupplierPayment, Staff } from '../src/types';

// Extraction of the core Shift Wizard expected cash algebra from ShiftWizard.tsx for validation
export function calculateExpectedCash(params: {
  petrolLiters: number;
  petrolRate: number;
  dieselLiters: number;
  dieselRate: number;
  cngKgs: number;
  cngRate: number;
  lubeSalesSum: number;
  totalRecoveries: number;
  totalDebits: number;
  totalExpenses: number;
  totalSupplierPayments: number;
  totalBankCash: number;
  totalDigitalCash: number;
  totalDiscounts: number;
}) {
  const petrolSalesSum = Math.max(0, params.petrolLiters) * params.petrolRate;
  const dieselSalesSum = Math.max(0, params.dieselLiters) * params.dieselRate;
  const cngSalesSum = Math.max(0, params.cngKgs) * params.cngRate;
  const grossSalesSum = petrolSalesSum + dieselSalesSum + cngSalesSum + params.lubeSalesSum;

  const expectedCash = Math.max(
    0,
    grossSalesSum +
      params.totalRecoveries -
      params.totalDebits -
      params.totalExpenses -
      params.totalSupplierPayments -
      params.totalBankCash -
      params.totalDigitalCash -
      params.totalDiscounts
  );
  return {
    grossSales: grossSalesSum,
    expectedCash
  };
}

describe('Shift Cash Reconciliation Calculations', () => {
  it('should calculate expected cash correctly under standard operational flow', () => {
    // Scenario: Normal day shift
    const result = calculateExpectedCash({
      petrolLiters: 1200,   // Sold 1200L
      petrolRate: 275.5,    // Rs. 275.5 / L
      dieselLiters: 800,    // Sold 800L
      dieselRate: 284.1,    // Rs. 284.1 / L
      cngKgs: 0,
      cngRate: 210,
      lubeSalesSum: 15000,  // Rs. 15,000 engine oil sales
      totalRecoveries: 25000, // Credit customer recovery received in drawer
      totalDebits: 35000,    // Fuel sold on credit (should reduce expected cash)
      totalExpenses: 8000,    // Shift meals and power expense paid in cash
      totalSupplierPayments: 50000, // Small supplier cash payout
      totalBankCash: 20000,   // Cash deposited to bank during shift
      totalDigitalCash: 10000, // POS card payments (digital, not cash in hand)
      totalDiscounts: 2000   // Loyalty discounts given in shift
    });

    // Calculations:
    // petrol sales = 1200 * 275.5 = 330,600
    // diesel sales = 800 * 284.1 = 227,280
    // gross sales = 330,600 + 227,280 + 15,000 = 572,880
    // expected cash = 572,880 + 25,000 (recoveries) - 35,000 (debits) - 8,000 (expenses) - 50,000 (supplier pmts) - 20,000 (bank) - 10,000 (digital) - 2,000 (discounts)
    // expected cash = 572,880 + 25,000 - 125,000 = 472,880
    expect(result.grossSales).toBe(572880);
    expect(result.expectedCash).toBe(472880);
  });

  it('should handle zero transactions and return zero expected cash', () => {
    const result = calculateExpectedCash({
      petrolLiters: 0,
      petrolRate: 275.5,
      dieselLiters: 0,
      dieselRate: 284.1,
      cngKgs: 0,
      cngRate: 210,
      lubeSalesSum: 0,
      totalRecoveries: 0,
      totalDebits: 0,
      totalExpenses: 0,
      totalSupplierPayments: 0,
      totalBankCash: 0,
      totalDigitalCash: 0,
      totalDiscounts: 0
    });
    expect(result.grossSales).toBe(0);
    expect(result.expectedCash).toBe(0);
  });

  it('should prevent expected cash from falling below zero (floor condition)', () => {
    // Scenario where debits/expenses exceed gross sales
    const result = calculateExpectedCash({
      petrolLiters: 100, // 100 * 275.5 = 27,550
      petrolRate: 275.5,
      dieselLiters: 0,
      dieselRate: 284.1,
      cngKgs: 0,
      cngRate: 210,
      lubeSalesSum: 0,
      totalRecoveries: 0,
      totalDebits: 50000, // Rs. 50,000 credit sale (larger than total sales)
      totalExpenses: 5000,
      totalSupplierPayments: 0,
      totalBankCash: 0,
      totalDigitalCash: 0,
      totalDiscounts: 0
    });
    expect(result.expectedCash).toBe(0); // Clamped at 0
  });

  it('should correctly evaluate shortage and overage based on submitted cash', () => {
    const expectedCash = 100000;
    
    // Case A: Shortage
    const submittedCashShort = 98500;
    const shortageVal = expectedCash > submittedCashShort ? expectedCash - submittedCashShort : 0;
    const overageValA = submittedCashShort > expectedCash ? submittedCashShort - expectedCash : 0;
    expect(shortageVal).toBe(1500);
    expect(overageValA).toBe(0);

    // Case B: Overage
    const submittedCashOver = 101200;
    const shortageValB = expectedCash > submittedCashOver ? expectedCash - submittedCashOver : 0;
    const overageValB = submittedCashOver > expectedCash ? submittedCashOver - expectedCash : 0;
    expect(shortageValB).toBe(0);
    expect(overageValB).toBe(1200);
  });

  it('should correctly assign shortage to staff operator advance balances', () => {
    // Initial staff state
    const staffMember: Staff = {
      id: 'st_operator_1',
      name: 'Ali Khan',
      urduName: 'علی خان',
      role: 'salesman',
      salary: 25000,
      advances: 4500, // already took Rs. 4,500 advance
      active: true,
      pin: '5555'
    };

    const shortageDiscrepancy = 2500; // Shift cash shortage of Rs. 2,500
    
    // Core state assignment from StationContext.tsx:
    let staffMemberToUpdate = { ...staffMember };
    if (shortageDiscrepancy > 0) {
      staffMemberToUpdate.advances = (staffMemberToUpdate.advances || 0) + shortageDiscrepancy;
    }

    expect(staffMemberToUpdate.advances).toBe(7000); // 4500 + 2500 = 7000
  });
});
