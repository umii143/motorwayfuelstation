import { describe, it, expect } from 'vitest';
import { Customer, Supplier, LubePosSale, Product } from '../src/types';

// Mock function representing customer balance updates during shifts & POS checkouts
export function updateCustomerBalance(customer: Customer, transactions: { type: 'credit_sale' | 'recovery'; amount: number }[]) {
  let balance = customer.balance;
  for (const tx of transactions) {
    if (tx.type === 'credit_sale') {
      // Check credit limit breach before approving
      if (balance + tx.amount > customer.creditLimit) {
        throw new Error(`Credit Limit Breached! Limit: Rs. ${customer.creditLimit}, Current: Rs. ${balance}, Attempted: Rs. ${tx.amount}`);
      }
      balance += tx.amount;
    } else if (tx.type === 'recovery') {
      balance -= tx.amount;
    }
  }
  return balance;
}

// Mock function representing supplier balance changes during decanting (supplies) and bank payments
export function updateSupplierBalance(supplier: Supplier, transactions: { type: 'receive_supply' | 'payment'; amount: number }[]) {
  let balance = supplier.balance; // Cr balance
  for (const tx of transactions) {
    if (tx.type === 'receive_supply') {
      balance += tx.amount; // We owe them more
    } else if (tx.type === 'payment') {
      balance -= tx.amount; // We paid them, reduces what we owe
    }
  }
  return balance;
}

// Profit margins calculation logic (revenue - cost of goods sold)
export function calculateGrossProfit(sales: LubePosSale[], products: Product[]) {
  let totalRevenue = 0;
  let totalCostOfGoodsSold = 0;

  for (const sale of sales) {
    if (sale.isReturn) continue; // Exclude return sales
    
    totalRevenue += sale.total;

    for (const item of sale.items) {
      const product = products.find(p => p.id === item.productId);
      // Fallback: If product cost is not stored, assume 20% margin (80% cost)
      const purchasePrice = (product as any)?.purchasePrice ?? (product?.rate ? product.rate * 0.8 : 0);
      totalCostOfGoodsSold += item.quantity * purchasePrice;
    }
  }

  const grossProfit = totalRevenue - totalCostOfGoodsSold;
  const grossMarginPercentage = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;

  return {
    revenue: totalRevenue,
    cogs: totalCostOfGoodsSold,
    grossProfit,
    marginPercentage: Math.round(grossMarginPercentage * 100) / 100
  };
}

describe('Financial Integrity Calculations', () => {
  describe('Customer Credit Ledger Rules', () => {
    it('should successfully update customer balance for valid credit sales and recoveries', () => {
      const customer: Customer = {
        id: 'c_1',
        name: 'Sindh Police Depot',
        urduName: 'سندھ پولیس',
        contact: '0300-1111111',
        address: 'HQ Karachi',
        creditLimit: 500000,
        balance: 100000 // Dr balance: owes us 100k
      };

      const nextBalance = updateCustomerBalance(customer, [
        { type: 'credit_sale', amount: 50000 },  // credit sale +50k
        { type: 'recovery', amount: 30000 },     // customer pays -30k
        { type: 'credit_sale', amount: 150000 }  // credit sale +150k
      ]);

      expect(nextBalance).toBe(270000); // 100k + 50k - 30k + 150k = 270k
    });

    it('should block credit sales that exceed the credit limit threshold', () => {
      const customer: Customer = {
        id: 'c_2',
        name: 'Local Transport Co',
        urduName: 'ٹرانسپورٹ کمپنی',
        contact: '0300-2222222',
        address: 'Karachi',
        creditLimit: 200000,
        balance: 180000 // already owes 180k
      };

      expect(() => {
        updateCustomerBalance(customer, [
          { type: 'credit_sale', amount: 30000 } // Attempt to add 30k (total 210k > 200k)
        ]);
      }).toThrowError('Credit Limit Breached!');
    });
  });

  describe('Supplier Balances', () => {
    it('should calculate supplier running balance ledger correctly', () => {
      const supplier: Supplier = {
        id: 's_1',
        name: 'Shell Pakistan Distributor',
        urduName: 'شیل پاکستان',
        contact: '021-333333',
        accountNo: 'HBL-0001',
        balance: 450000 // Cr balance: we owe them 450k
      };

      const nextBalance = updateSupplierBalance(supplier, [
        { type: 'payment', amount: 200000 },      // We paid them -200k
        { type: 'receive_supply', amount: 600000 } // Decanted tanker supply +600k
      ]);

      expect(nextBalance).toBe(850000); // 450k - 200k + 600k = 850k
    });
  });

  describe('Profit Margin Analytics', () => {
    const products: Product[] = [
      { id: 'p_1', name: 'Shell Helix 4L', urduName: 'شیل ہیلکس', rate: 9400, unit: 'Bottles', type: 'lube', currentStock: 20, minStock: 2 },
      { id: 'p_2', name: 'Filter Genuine', urduName: 'فلٹر', rate: 1500, unit: 'pcs', type: 'other', currentStock: 50, minStock: 5 }
    ];

    // Append mock purchasePrices to evaluate true GP margins
    (products[0] as any).purchasePrice = 7500; // Rs. 7,500 cost, sells at Rs. 9,400 (Profit = 1900)
    (products[1] as any).purchasePrice = 1100; // Rs. 1,100 cost, sells at Rs. 1,500 (Profit = 400)

    it('should calculate gross profit and margins correctly for completed sales', () => {
      const sales: LubePosSale[] = [
        {
          id: 'inv_1',
          invoiceNo: 'FP-POS-1001',
          date: '2026-06-07',
          time: '12:00',
          cashierId: 'st_1',
          paymentMode: 'cash',
          subtotal: 10900, // 9400 + 1500
          discount: 900,   // Rs. 900 discount
          tax: 0,
          total: 10000,    // Net revenue = 10,000
          amountReceived: 10000,
          changeGiven: 0,
          items: [
            { productId: 'p_1', productName: 'Shell Helix 4L', quantity: 1, unit: 'Bottles', unitPrice: 9400, lineTotal: 9400 },
            { productId: 'p_2', productName: 'Filter Genuine', quantity: 1, unit: 'pcs', unitPrice: 1500, lineTotal: 1500 }
          ]
        }
      ];

      // Cost of goods sold = (1 * 7500) + (1 * 1100) = 8600
      // Net Revenue = 10,000 (after 900 discount)
      // Gross Profit = 10,000 - 8600 = 1400
      // Margin % = (1400 / 10000) * 100 = 14%
      const result = calculateGrossProfit(sales, products);
      expect(result.revenue).toBe(10000);
      expect(result.cogs).toBe(8600);
      expect(result.grossProfit).toBe(1400);
      expect(result.marginPercentage).toBe(14.00);
    });
  });
});
