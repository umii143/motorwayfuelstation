import { 
  SalaryTransaction, 
  StaffLoan, 
  SalaryAdvance, 
  ExpenseEntry, 
  AuditTrailEntry,
  BankCashEntry,
  DigitalCashEntry,
  Staff
} from '../types';

interface PaySalaryParams {
  salaryTx: SalaryTransaction;
  staffMember: Staff;
  paymentSource: string; // 'cash' or a bank account ID
  isBankOrDigital: boolean; // if false, means cash drawer
  expenseDate: string;
}

export const SalaryEngine = {

  // Step 1: Accrue Salary (Draft / Pending Approval)
  accrueSalary: (
    employeeId: string,
    employeeName: string,
    amount: number,
    month: string,
    createdBy: string,
    branchId?: string
  ): SalaryTransaction => {
    return {
      id: `sal_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      employeeId,
      employeeName,
      amount,
      month,
      paymentDate: '',
      paymentMethod: '',
      paymentSource: '',
      status: 'pending_approval',
      createdBy,
      branchId,
      advanceDeduction: 0,
      loanDeduction: 0,
      netPaid: 0
    };
  },

  // Step 2: Approve Salary (Owner Level)
  approveSalary: (
    salaryTx: SalaryTransaction,
    approvedBy: string
  ): SalaryTransaction => {
    return {
      ...salaryTx,
      status: 'approved',
      approvedBy
    };
  },

  // Step 3: Pay Salary (Generates linked transactions)
  paySalary: ({
    salaryTx,
    staffMember,
    paymentSource,
    isBankOrDigital,
    expenseDate
  }: PaySalaryParams) => {
    
    const expenseId = `exp_sal_${Date.now()}`;
    const txId = salaryTx.id;

    // 1. Updated Salary Transaction
    const updatedSalaryTx: SalaryTransaction = {
      ...salaryTx,
      status: 'paid',
      paymentDate: expenseDate,
      paymentMethod: isBankOrDigital ? 'bank' : 'cash',
      paymentSource,
      expenseId,
      netPaid: salaryTx.amount - (salaryTx.advanceDeduction || 0) - (salaryTx.loanDeduction || 0)
    };

    // 2. Linked Expense Entry
    const expenseEntry: ExpenseEntry = {
      id: expenseId,
      categoryId: 'salary',
      categoryName: 'Staff Salary',
      amount: updatedSalaryTx.netPaid || 0, // Only expense the net paid out via cash/bank
      description: `Salary Paid: ${staffMember.name} (${salaryTx.month})`,
      date: expenseDate,
      paidFrom: isBankOrDigital ? 'bank' : 'cash',
      staffId: staffMember.id
    };

    // Note: To be fully accurate, the Gross Salary should be expensed, 
    // and the deductions (Advance/Loan) should reduce their respective receivables.
    // For simplicity and matching cash flow, we will expense the Gross Amount.
    expenseEntry.amount = salaryTx.amount; 

    // 3. Cash/Bank Ledger Entry
    let cashEntry: BankCashEntry | DigitalCashEntry | null = null;
    if (isBankOrDigital) {
      cashEntry = {
        id: `bnk_${Date.now()}`,
        bankAccountId: paymentSource,
        amount: -expenseEntry.amount, // Deduct cash
        reference: `Salary ${salaryTx.month} - ${staffMember.name}`
      } as BankCashEntry;
    }

    // 4. Audit Log
    const auditLog: AuditTrailEntry = {
      id: `audit_sal_${Date.now()}`,
      timestamp: new Date().toISOString(),
      category: 'Finance',
      action: 'Salary Paid',
      details: `Paid ${expenseEntry.amount} to ${staffMember.name} from ${paymentSource}`,
      user: salaryTx.createdBy,
      role: 'System',
      branch: salaryTx.branchId || 'main'
    };

    return {
      updatedSalaryTx,
      expenseEntry,
      cashEntry,
      auditLog
    };
  },

  // Issue Advance
  issueAdvance: (
    employeeId: string,
    employeeName: string,
    amount: number,
    branchId?: string
  ): SalaryAdvance => {
    return {
      id: `adv_${Date.now()}`,
      employeeId,
      employeeName,
      amount,
      dateIssued: new Date().toISOString().split('T')[0],
      status: 'active',
      recoveredAmount: 0,
      branchId
    };
  },

  // Issue Loan
  issueLoan: (
    employeeId: string,
    employeeName: string,
    loanAmount: number,
    monthlyInstallment: number,
    branchId?: string
  ): StaffLoan => {
    return {
      id: `loan_${Date.now()}`,
      employeeId,
      employeeName,
      loanAmount,
      monthlyInstallment,
      remainingBalance: loanAmount,
      dateIssued: new Date().toISOString().split('T')[0],
      status: 'active',
      branchId
    };
  }
};
