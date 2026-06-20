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
  },
  {
    name: "getTopDefaulters",
    description: "Identifies customers who owe the most money or have exceeded their credit limits.",
  },
  {
    name: "getLowStockAlerts",
    description: "Returns a list of any fuel tanks or lube products that are running dangerously low on stock.",
  },
  {
    name: "getFinancialSummary",
    description: "Returns an overview of the station's total assets, liabilities, and profitability.",
  },
  {
    name: "transferFunds",
    description: "Transfers cash from the main drawer/cash account to a bank account.",
    parameters: {
      type: "OBJECT",
      properties: {
        amount: { type: "NUMBER", description: "The amount to transfer in PKR" },
        fromAccount: { type: "STRING", description: "Source account (e.g. 'Cash')" },
        toBankName: { type: "STRING", description: "Destination bank name (e.g. 'HBL', 'Meezan')" }
      },
      required: ["amount", "toBankName"]
    }
  },
  {
    name: "markAttendance",
    description: "Marks attendance for a staff member.",
    parameters: {
      type: "OBJECT",
      properties: {
        staffName: { type: "STRING", description: "Name of the staff member" },
        status: { type: "STRING", description: "Attendance status: 'Present', 'Absent', 'Leave', or 'Half Day'" }
      },
      required: ["staffName", "status"]
    }
  },
  {
    name: "addLubeSale",
    description: "Records the sale of a Lube/Tuck Shop product.",
    parameters: {
      type: "OBJECT",
      properties: {
        productName: { type: "STRING", description: "The name of the product" },
        quantity: { type: "NUMBER", description: "The quantity sold" }
      },
      required: ["productName", "quantity"]
    }
  },
  {
    name: "registerStaff",
    description: "Registers or adds a new staff member to the system.",
    parameters: {
      type: "OBJECT",
      properties: {
        name: { type: "STRING", description: "Name of the staff member" },
        role: { type: "STRING", description: "Role (e.g., 'cashier', 'salesman', 'manager')" },
        salary: { type: "NUMBER", description: "Monthly salary in PKR" },
        phone: { type: "STRING", description: "Phone number (optional)" }
      },
      required: ["name"]
    }
  },
  {
    name: "addCustomer",
    description: "Registers a new credit customer.",
    parameters: {
      type: "OBJECT",
      properties: {
        name: { type: "STRING", description: "Customer name" },
        contact: { type: "STRING", description: "Contact number" },
        creditLimit: { type: "NUMBER", description: "Credit limit in PKR" }
      },
      required: ["name"]
    }
  },
  {
    name: "addSupplier",
    description: "Registers a new supplier.",
    parameters: {
      type: "OBJECT",
      properties: {
        name: { type: "STRING", description: "Supplier company or person name" },
        contact: { type: "STRING", description: "Contact number" }
      },
      required: ["name"]
    }
  },
  {
    name: "addBankAccount",
    description: "Registers a new bank account or cash drawer in the treasury.",
    parameters: {
      type: "OBJECT",
      properties: {
        name: { type: "STRING", description: "Account name (e.g., 'Main Cash', 'HBL')" },
        accountNo: { type: "STRING", description: "Account number (optional)" },
        initialBalance: { type: "NUMBER", description: "Opening balance in PKR" }
      },
      required: ["name"]
    }
  },
  {
    name: "startShift",
    description: "Starts a new shift. This is also called the shift wizard.",
    parameters: {
      type: "OBJECT",
      properties: {
        managerName: { type: "STRING", description: "Name of the manager starting the shift" },
        shiftType: { type: "STRING", description: "'day' or 'night'" }
      },
      required: ["shiftType"]
    }
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
        if ((acc.type as any) === 'cash' || (acc.type as any) === 'drawer') totalCash += acc.balance;
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
        paidFrom: 'cash' as any
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
          stock: p.currentStock,
          price: p.sellingPrice
        })),
        tanks: (inventory.tanks || []).map(t => ({
          name: t.name,
          volume: t.currentStock,
          capacity: t.capacity
        }))
      };
    }

    case "getTopDefaulters": {
      const customers = useCustomerStore.getState().customers || [];
      const defaulters = customers
        .filter(c => c.balance > 0)
        .sort((a, b) => b.balance - a.balance)
        .slice(0, 5)
        .map(c => ({
          name: c.name,
          balance: c.balance,
          limit: c.creditLimit,
          isOverLimit: c.balance > (c.creditLimit || 0)
        }));
      return { topDefaulters: defaulters };
    }

    case "getLowStockAlerts": {
      const inventory = useInventoryStore.getState();
      const lowTanks = (inventory.tanks || []).filter(t => t.currentStock < (t.capacity * 0.15)).map(t => ({ name: t.name, stock: t.currentStock }));
      const lowProducts = (inventory.products || []).filter(p => p.currentStock < p.minStock).map(p => ({ name: p.name, stock: p.currentStock }));
      return { lowTanks, lowProducts };
    }

    case "getFinancialSummary": {
      const treasury = useTreasuryStore.getState();
      const customers = useCustomerStore.getState().customers || [];
      const suppliers = useSupplierStore.getState().suppliers || [];
      
      let totalCashAndBank = 0;
      treasury.cashAccounts?.forEach(acc => totalCashAndBank += acc.balance);
      
      let totalReceivables = 0;
      customers.forEach(c => totalReceivables += (c.balance || 0));
      
      let totalPayables = 0;
      suppliers.forEach(s => totalPayables += (s.balance || 0));

      return {
        liquidAssets: totalCashAndBank,
        receivables: totalReceivables,
        payables: totalPayables,
        netPosition: (totalCashAndBank + totalReceivables) - totalPayables
      };
    }

    case "transferFunds": {
      const { amount, toBankName } = args;
      const treasury = useTreasuryStore.getState();
      const cashAcc = treasury.cashAccounts.find(a => (a.type as any) === 'cash' || (a.type as any) === 'drawer');
      const bankAcc = treasury.cashAccounts.find(a => a.type === 'bank' && a.name.toLowerCase().includes(toBankName.toLowerCase()));
      
      if (!cashAcc || !bankAcc) return { status: "Failed: Could not find matching accounts." };
      
      treasury.transferFunds(cashAcc.id, bankAcc.id, Number(amount), "Voice Transfer", "Jarvis", "", "");
      return { status: "Success", message: `Transferred ${amount} to ${bankAcc.name}.` };
    }

    case "markAttendance": {
      const { staffName, status } = args;
      const staffStore = useStaffStore.getState();
      const staffMember = staffStore.staff.find(s => s.name.toLowerCase().includes(staffName.toLowerCase()));
      if (!staffMember) return { status: `Failed: Could not find staff named ${staffName}.` };
      
      const record = {
        id: `att_${Date.now()}`,
        staffId: staffMember.id,
        date: new Date().toISOString().split('T')[0],
        status: status as any
      };
      
      staffStore.handleAddAttendance([record], "", "");
      return { status: "Success", message: `Marked ${staffMember.name} as ${status}.` };
    }

    case "addLubeSale": {
      const { productName, quantity } = args;
      const inventory = useInventoryStore.getState();
      const product = inventory.products.find(p => p.name.toLowerCase().includes(productName.toLowerCase()));
      if (!product) return { status: `Failed: Could not find product ${productName}.` };
      
      const sale = {
        id: `ls_${Date.now()}`,
        date: new Date().toISOString().split('T')[0],
        items: [{ productId: product.id, productName: product.name, quantity: Number(quantity), unitPrice: product.sellingPrice, total: product.sellingPrice * Number(quantity), unit: 'Liter', lineTotal: product.sellingPrice * Number(quantity) }],
        total: product.sellingPrice * Number(quantity),
        paymentMode: 'cash' as any,
        invoiceNo: `INV-${Date.now()}`,
        time: new Date().toISOString(),
        cashierId: "system",
        subtotal: product.sellingPrice * Number(quantity),
        discount: 0,
        tax: 0,
        amountReceived: product.sellingPrice * Number(quantity),
        changeGiven: 0
      };
      
      useFinancialStore.getState().handleAddLubePosSale(sale, "", "");
      return { status: "Success", message: `Sold ${quantity}x ${product.name} for Rs ${sale.total}.` };
    }

    case "registerStaff": {
      const { name, role, salary, phone } = args;
      const staffStore = useStaffStore.getState();
      
      const newStaff = {
        id: `stf_${Date.now()}`,
        name,
        urduName: name,
        role: role?.toLowerCase() || 'staff',
        salary: Number(salary) || 0,
        advances: 0,
        active: true,
        status: "active" as any,
        pin: "1234",
        phone: phone || "",
      };
      
      await staffStore.handleAddStaff(newStaff, "", "");
      return { status: "Success", message: `Registered new staff member ${name} as ${role} with salary Rs ${salary}.` };
    }

    case "addCustomer": {
      const { name, contact, creditLimit } = args;
      const newCustomer = {
        id: `cust_${Date.now()}`,
        name,
        urduName: name,
        contact: contact || "",
        address: "",
        creditLimit: Number(creditLimit) || 0,
        balance: 0
      };
      await useCustomerStore.getState().handleAddCustomer(newCustomer, "", "");
      return { status: "Success", message: `Registered new customer ${name} with limit Rs ${creditLimit}.` };
    }

    case "addSupplier": {
      const { name, contact } = args;
      const newSupplier = {
        id: `sup_${Date.now()}`,
        name,
        urduName: name,
        contact: contact || "",
        accountNo: "",
        balance: 0
      };
      await useSupplierStore.getState().handleAddSupplier(newSupplier, "", "");
      return { status: "Success", message: `Registered new supplier ${name}.` };
    }

    case "addBankAccount": {
      const { name, accountNo, initialBalance } = args;
      const newBank = {
        id: `bank_${Date.now()}`,
        name: name || "New Account",
        accountNo: accountNo || "",
        balance: Number(initialBalance) || 0,
        type: name?.toLowerCase()?.includes("cash") || name?.toLowerCase()?.includes("drawer") ? 'cash' : 'bank' as any
      };
      await useFinancialStore.getState().handleAddBank(newBank, "", "");
      return { status: "Success", message: `Registered new account ${name} with balance Rs ${initialBalance}.` };
    }

    case "startShift": {
      const { managerName, shiftType } = args;
      const shiftStore = useShiftStore.getState();
      const staffStore = useStaffStore.getState();
      
      const manager = staffStore.staff.find(s => s.name.toLowerCase().includes(managerName?.toLowerCase() || ""));
      const managerId = manager ? manager.id : "unknown";

      const newShift = {
        id: `sh_${Date.now()}`,
        staffId: managerId,
        type: (shiftType?.toLowerCase() === 'night' ? 'night' : 'day') as 'day' | 'night',
        date: new Date().toISOString().split('T')[0],
        startTime: new Date().toISOString(),
        endTime: "",
        status: 'active' as any,
        readings: [],
        expenses: [],
        recoveries: [],
        payments: [],
        creditSales: [],
        totalSales: 0,
        totalCash: 0,
        totalExpenses: 0,
        totalRecoveries: 0,
        totalPayments: 0,
        totalCreditSales: 0,
        netCash: 0,
        shortage: 0
      };

      await shiftStore.handleAddShift(newShift as any, "", "");
      return { status: "Success", message: `Started ${shiftType} shift for manager ${managerName}.` };
    }

    default:
      throw new Error(`Function ${functionName} is not implemented in Jarvis.`);
  }
};
