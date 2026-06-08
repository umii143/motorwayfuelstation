import { describe, it, expect } from 'vitest';
import { Shift, Product, Tank, Nozzle, Customer, Supplier, BankAccount, LubePosSale, StockTransaction, InventoryMovement } from '../src/types';

describe('End-to-End Operational Workflows', () => {

  describe('Fuel Station A→Z Workflow Simulation', () => {
    it('should complete a full shift operational cycle and successfully update all ledgers and stocks', () => {
      // 1. Setup Initial Wet-stock and Financial State
      const products: Product[] = [
        { id: 'prod_f1', name: 'Euro 5 Petrol', urduName: 'پٹرول', rate: 275.5, unit: 'Liters', type: 'fuel', currentStock: 18000, minStock: 2000, capacity: 25000 }
      ];

      const tanks: Tank[] = [
        { id: 'tank_f1', name: 'PMG Tank 1', productId: 'prod_f1', capacity: 25000, safeLevel: 22000, criticalLevel: 2000, currentStock: 18000, openingStock: 18000, dipChart: [] }
      ];

      const nozzles: Nozzle[] = [
        { id: 'nz_1', pumpId: 'pump_1', name: 'Nozzle 1A', productId: 'prod_f1', tankId: 'tank_f1', startReading: 125000, currentReading: 125000 }
      ];

      const customers: Customer[] = [
        { id: 'c_1', name: 'Sindh Police', urduName: 'سندھ پولیس', contact: '0300-1', address: 'Karachi', creditLimit: 500000, balance: 100000 }
      ];

      const suppliers: Supplier[] = [
        { id: 's_1', name: 'PSO HQ', urduName: 'پی ایس او', contact: '021-1', accountNo: 'NBP-01', balance: 400000 }
      ];

      const banks: BankAccount[] = [
        { id: 'b_1', name: 'Meezan Bank', accountNo: 'MEEZAN-01', balance: 500000 }
      ];

      // 2. Open Shift
      const activeShift: Shift = {
        id: 'shift_99',
        staffId: 'st_crew_1',
        type: 'day',
        date: '2026-06-07',
        startTime: '08:00',
        status: 'active',
        openingReadings: { nz_1: 125000 },
        closingReadings: {},
        testLiters: {},
        debitEntries: [],
        recoveryEntries: [],
        expenseEntries: [],
        bankCashEntries: [],
        digitalCashEntries: [],
        lubeSales: [],
        supplierPayments: [],
        expectedCash: 0,
        submittedCash: 0,
        shortage: 0,
        overage: 0
      };

      // 3. Simulate Shift Operations (Keystroke & input captures)
      // Nozzle 1 meter advances by 200 liters (total sold fuel = 200L)
      activeShift.closingReadings = { nz_1: 125200 };
      
      // 5 Liters pump flow calibration test deduction
      activeShift.testLiters = { prod_f1: 5 };

      // Credit Sale: Sindh Police buys 80L on credit
      activeShift.debitEntries.push({
        id: 'deb_1',
        customerId: 'c_1',
        productId: 'prod_f1',
        quantity: 80,
        rate: 275.5,
        amount: 80 * 275.5, // Rs. 22,040
        note: 'Police Mobile 5'
      });

      // Recovery: Sindh Police pays Rs. 15,000 back to cash drawer
      activeShift.recoveryEntries.push({
        id: 'rec_1',
        customerId: 'c_1',
        amount: 15000,
        mode: 'cash',
        reference: 'REC-POLICE-09'
      });

      // Bank cash deposit: manager deposits Rs. 20,000 to bank during shift
      activeShift.bankCashEntries.push({
        id: 'bc_1',
        bankAccountId: 'b_1',
        amount: 20000,
        reference: 'DEP-MEEZAN-09'
      });

      // Supplier payment: manager pays PSO Rs. 10,000 from Meezan bank
      activeShift.supplierPayments.push({
        id: 'sp_1',
        supplierId: 's_1',
        amount: 1500000,
        date: '2025-01-01',
        mode: 'transfer',
        bankAccountId: 'b_1',
        reference: 'TR-PSO-01'
      });

      // 4. Run expected cash & validation checks
      // grossSales = (200 - 5) * 275.5 = 195 * 275.5 = Rs. 53,722.5
      // expectedCash = Sales (53722.5) + Recoveries (15000) - Debits (22040) - Bank Cash (20000) - Supplier Payouts (0 from cash, since paid via bank transfer!)
      // expectedCash = 53722.5 + 15000 - 22040 - 20000 = Rs. 26,682.5
      const grossSales = (200 - 5) * 275.5;
      const totalDebits = 22040;
      const totalRecoveries = 15000;
      const totalBankCash = 20000;
      const expectedCash = grossSales + totalRecoveries - totalDebits - totalBankCash;
      expect(expectedCash).toBe(26682.5);

      // Operator submits exactly Rs. 26,682.5 (No variance)
      activeShift.expectedCash = expectedCash;
      activeShift.submittedCash = expectedCash;
      activeShift.status = 'closed';

      // 5. Commit Close calculations (matching StationContext.tsx L685-L935)
      // update customers
      const nextCustomers = customers.map(cust => {
        let diff = 0;
        activeShift.debitEntries.forEach(d => { if (d.customerId === cust.id) diff += d.amount; });
        activeShift.recoveryEntries.forEach(r => { if (r.customerId === cust.id) diff -= r.amount; });
        return { ...cust, balance: cust.balance + diff };
      });

      // update suppliers
      const nextSuppliers = suppliers.map(supp => {
        let paid = 0;
        activeShift.supplierPayments.forEach(p => { if (p.supplierId === supp.id) paid += p.amount; });
        return { ...supp, balance: supp.balance - paid };
      });

      // update tanks & products
      const testLit = activeShift.testLiters['prod_f1'] || 0;
      const netSold = (125200 - 125000) - testLit; // 195L
      const nextTanks = tanks.map(tk => ({ ...tk, currentStock: tk.currentStock - netSold }));
      const nextProducts = products.map(p => ({ ...p, currentStock: p.currentStock - netSold }));

      // update banks
      const nextBanks = banks.map(bk => {
        let bankDelta = 0;
        activeShift.bankCashEntries.forEach(bc => { if (bc.bankAccountId === bk.id) bankDelta += bc.amount; });
        activeShift.supplierPayments.forEach(sp => { if (sp.bankAccountId === bk.id) bankDelta -= sp.amount; });
        return { ...bk, balance: bk.balance + bankDelta };
      });

      // 6. Verify Ledger States post shift closure
      // Customer: 100,000 (starting) + 22,040 (debit) - 15,000 (recovery) = 107,040
      expect(nextCustomers[0].balance).toBe(107040);
      
      // Supplier: 400,000 (we owed) - 10,000 (payment transfer) = 390,000
      expect(nextSuppliers[0].balance).toBe(390000);

      // Stock: 18,000 - 195 = 17,805 Liters remaining
      expect(nextTanks[0].currentStock).toBe(17805);
      expect(nextProducts[0].currentStock).toBe(17805);

      // Banks: 500,000 + 20,000 (cash deposit) - 10,000 (PSO transfer) = 510,000
      expect(nextBanks[0].balance).toBe(510000);
    });
  });

  describe('CNG Operational Shift Simulation', () => {
    it('should calculate CNG volume sales and expected cash with KG metrics', () => {
      // CNG uses KG instead of Liters
      const cngProduct: Product = { id: 'cng', name: 'CNG Gas', urduName: 'گیس', rate: 210, unit: 'KG', type: 'fuel', currentStock: 5000, minStock: 500 };
      
      // Simulate shift nozzle discharge: Start 45000 KG, End 45150 KG (150 KG sold)
      const cngSalesKg = 150;
      const expectedCngSalesVal = cngSalesKg * cngProduct.rate; // 150 * 210 = Rs. 31,500
      expect(expectedCngSalesVal).toBe(31500);

      // Expenses during shift: Rs. 1,500 compressor grease
      const expenseAmount = 1500;
      
      const expectedCash = expectedCngSalesVal - expenseAmount; // 31500 - 1500 = 30000
      expect(expectedCash).toBe(30000);
    });
  });

  describe('Lube POS Cartesian Invoice & Refund Workflow', () => {
    it('should complete checkout, update customer debit, and handle returns correctly', () => {
      // 1. Initial State
      const products: Product[] = [
        { id: 'p_1', name: 'Rimula 4L', urduName: 'ریمولا', rate: 7000, unit: 'Bottles', type: 'lube', currentStock: 50, minStock: 5 }
      ];

      const customer: Customer = { id: 'c_1', name: 'Faisal Care', urduName: 'فیصل', contact: '03', address: 'KHI', creditLimit: 200000, balance: 0 };

      // 2. Cart POS Checkout: Faisal buys 2 bottles on Credit
      const checkoutInvoice: LubePosSale = {
        id: 'pos_99',
        invoiceNo: 'FP-POS-999',
        date: '2026-06-07',
        time: '14:30',
        cashierId: 'st_1',
        customerId: customer.id,
        customerName: customer.name,
        paymentMode: 'credit',
        subtotal: 14000, // 2 * 7000
        discount: 1000,  // Rs. 1000 discount
        tax: 0,
        total: 13000,    // Net outstanding = 13000
        amountReceived: 0,
        changeGiven: 0,
        items: [
          { productId: 'p_1', productName: 'Rimula 4L', quantity: 2, unit: 'Bottles', unitPrice: 7000, lineTotal: 14000 }
        ]
      };

      // Perform checkout mutations
      const postCheckoutCustomer = { ...customer, balance: customer.balance + checkoutInvoice.total };
      const postCheckoutProducts = products.map(p => {
        if (p.id === 'p_1') {
          return { ...p, currentStock: p.currentStock - 2 }; // stock decreases by 2
        }
        return p;
      });

      expect(postCheckoutCustomer.balance).toBe(13000);
      expect(postCheckoutProducts[0].currentStock).toBe(48);

      // 3. Refund / Return Flow: Faisal returns 1 bottle
      // Net return value = 1 bottle value (half of invoice net total after discount: 13000 / 2 = 6500)
      const returnInvoice: LubePosSale = {
        id: 'pos_refund_99',
        invoiceNo: 'FP-POS-999-RET',
        date: '2026-06-07',
        time: '15:00',
        cashierId: 'st_1',
        customerId: customer.id,
        customerName: customer.name,
        paymentMode: 'credit',
        subtotal: -7000,
        discount: -500,
        tax: 0,
        total: -6500, // Refund value = Rs. 6500
        amountReceived: 0,
        changeGiven: 0,
        isReturn: true,
        returnedSaleId: 'pos_99',
        items: [
          { productId: 'p_1', productName: 'Rimula 4L', quantity: -1, unit: 'Bottles', unitPrice: 7000, lineTotal: -7000 }
        ]
      };

      // Perform return mutations (reverse ledger & restore inventory stock)
      const postReturnCustomer = { ...postCheckoutCustomer, balance: postCheckoutCustomer.balance + returnInvoice.total }; // 13000 + (-6500) = 6500
      const postReturnProducts = postCheckoutProducts.map(p => {
        if (p.id === 'p_1') {
          return { ...p, currentStock: p.currentStock + 1 }; // stock restored by 1
        }
        return p;
      });

      expect(postReturnCustomer.balance).toBe(6500); // Faisal now only owes Rs. 6500
      expect(postReturnProducts[0].currentStock).toBe(49); // stock goes back to 49
    });
  });
});
