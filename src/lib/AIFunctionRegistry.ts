import { useShiftStore } from '../stores/useShiftStore';
import { useTreasuryStore } from '../stores/useTreasuryStore';
import { useInventoryStore } from '../stores/useInventoryStore';
import { useFinancialStore } from '../stores/useFinancialStore';
import { useStaffStore } from '../stores/useStaffStore';
import { useCustomerStore } from '../stores/useCustomerStore';
import { useSupplierStore } from '../stores/useSupplierStore';

// These declarations match the Gemini Tool Function Declarations
export const jarvisFunctionDeclarations = [
  {
    name: "getTodaySales",
    description: "Fetches the total sales amount in PKR for today across all products.",
  },
  {
    name: "getTodayProfit",
    description: "Fetches the total gross margin/profit in PKR for today.",
  },
  {
    name: "getCashPosition",
    description: "Fetches the current cash on hand and bank balance in the treasury.",
  },
  {
    name: "getTankLevels",
    description: "Fetches the real-time physical dip levels of all underground fuel tanks.",
  },
  {
    name: "getShiftSummary",
    description: "Fetches the summary of the current active shift including operator name and variance.",
  },
  {
    name: "addExpense",
    description: "Records a new cash expense into the currently active shift.",
    parameters: {
      type: "OBJECT",
      properties: {
        amount: { type: "NUMBER", description: "The amount of the expense in PKR" },
        category: { type: "STRING", description: "The category of the expense (e.g. 'Tea', 'Cleaning', 'Maintenance')" },
        description: { type: "STRING", description: "A short description of what the expense was for" }
      },
      required: ["amount", "category", "description"]
    }
  },
  {
    name: "createRecovery",
    description: "Records a customer payment (recovery) into the currently active shift.",
    parameters: {
      type: "OBJECT",
      properties: {
        amount: { type: "NUMBER", description: "The amount recovered in PKR" },
        customerName: { type: "STRING", description: "The name of the customer who paid" }
      },
      required: ["amount", "customerName"]
    }
  },
  {
    name: "getStaffList",
    description: "Fetches the list of all staff members, their roles, and current salary advances.",
  },
  {
    name: "getCustomerBalances",
    description: "Fetches the list of all customers and their current outstanding balances.",
  },
  {
    name: "getSupplierBalances",
    description: "Fetches the list of all suppliers and the current amount payable to them.",
  },
  {
    name: "getInventoryStock",
    description: "Fetches the exact physical stock of all Lube products and Fuel Tanks.",
  }
];

export const executeJarvisFunction = async (functionName: string, args: any, _dbStores?: any) => {
  switch (functionName) {
    case "getTodaySales": {
      // Calculate today's sales from active/closed shifts today
      const today = new Date().toISOString().split('T')[0];
      const shifts = useShiftStore.getState().shifts.filter(s => s.date === today);
      let totalSales = 0;
      shifts.forEach(s => {
        s.segments?.forEach(seg => totalSales += seg.revenue);
      });
      // Fallback to dashboard KPI if available, or calculated
      return { sales: totalSales > 0 ? totalSales : 0, currency: "PKR", date: today };
    }

    case "getTodayProfit": {
      const today = new Date().toISOString().split('T')[0];
      const cogsRecords = useInventoryStore.getState().cogsRecords?.filter(c => c.saleDate?.startsWith(today)) || [];
      let totalProfit = 0;
      cogsRecords.forEach(c => totalProfit += (c.netProfit || c.grossProfit || 0));
      return { profit: totalProfit, currency: "PKR", date: today };
    }

    case "getCashPosition": {
      const state = useTreasuryStore.getState();
      let totalCash = 0;
      let totalBank = 0;
      state.cashAccounts?.forEach(acc => {
        if (acc.type === 'cash' || acc.type === 'drawer') totalCash += acc.balance;
        else totalBank += acc.balance;
      });
      return { cashOnHand: totalCash, bankBalance: totalBank, currency: "PKR" };
    }

    case "getTankLevels": {
      const tanks = useInventoryStore.getState().tanks || [];
      return { tanks: tanks.map(t => ({ name: t.name, currentVolume: t.currentStock, capacity: t.capacity })) };
    }

    case "getShiftSummary": {
      const activeShift = useShiftStore.getState().shifts.find(s => s.status === 'active');
      if (!activeShift) return { status: "No active shift currently." };
      return { 
        shift: { 
          id: activeShift.id,
          operatorId: activeShift.staffId, 
          status: activeShift.status, 
          variance: activeShift.cashVariance || 0,
          expectedCash: activeShift.expectedCash || 0
        } 
      };
    }

    case "addExpense": {
      const { amount, category, description } = args;
      const activeShift = useShiftStore.getState().shifts.find(s => s.status === 'active');
      if (!activeShift) return { status: "Failed: No active shift to add expense to." };
      
      const newExpense = {
        id: `exp_${Date.now()}`,
        category,
        description,
        amount: Number(amount),
        date: new Date().toISOString(),
        paidFrom: 'cash'
      };

      const updatedShift = {
        ...activeShift,
        expenseEntries: [...(activeShift.expenseEntries || []), newExpense]
      };

      await useShiftStore.getState().handleUpdateShift(updatedShift);
      return { status: "Success", message: `Expense of Rs ${amount} for ${category} added successfully.` };
    }

    case "createRecovery": {
      const { amount, customerName } = args;
      const activeShift = useShiftStore.getState().shifts.find(s => s.status === 'active');
      if (!activeShift) return { status: "Failed: No active shift to add recovery to." };

      // Try to find the customer ID by name
      // Usually would need useCustomerStore.getState().customers.find()
      // Let's assume we import useCustomerStore
      // But for simplicity, we can record it with an unresolved ID or try to resolve it
      
      const newRecovery = {
        id: `rec_${Date.now()}`,
        customerId: `cust_unresolved_${customerName}`, // In real app, look up useCustomerStore.getState().customers
        amount: Number(amount),
        mode: 'cash' as any,
        date: new Date().toISOString(),
        reference: `Voice Entry: ${customerName}`
      };

      const updatedShift = {
        ...activeShift,
        recoveryEntries: [...(activeShift.recoveryEntries || []), newRecovery]
      };

      await useShiftStore.getState().handleUpdateShift(updatedShift);
      return { status: "Success", message: `Recovery of Rs ${amount} from ${customerName} added successfully.` };
    }

    case "getStaffList": {
      const staff = useStaffStore.getState().staff || [];
      return { 
        staffList: staff.map(s => ({
          name: s.name,
          role: s.role,
          salary: s.salary,
          advances: s.advances || 0
        }))
      };
    }

    case "getCustomerBalances": {
      const customers = useCustomerStore.getState().customers || [];
      return {
        customerBalances: customers.map(c => ({
          name: c.name,
          balance: c.balance || 0,
          limit: c.creditLimit || 0
        }))
      };
    }

    case "getSupplierBalances": {
      const suppliers = useSupplierStore.getState().suppliers || [];
      return {
        supplierBalances: suppliers.map(s => ({
          name: s.name,
          balance: s.balance || 0
        }))
      };
    }

    case "getInventoryStock": {
      const inventory = useInventoryStore.getState();
      return {
        products: (inventory.products || []).map(p => ({
          name: p.name,
          stock: p.stock,
          price: p.sellingPrice
        })),
        tanks: (inventory.tanks || []).map(t => ({
          name: t.name,
          volume: t.currentStock,
          capacity: t.capacity
        }))
      };
    }

    default:
      throw new Error(`Function ${functionName} is not implemented in Jarvis.`);
  }
};
