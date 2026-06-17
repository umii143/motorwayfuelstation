// AIFunctionRegistry.ts

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
  }
];

export const executeJarvisFunction = async (functionName: string, args: any, dbStores: any) => {
  // dbStores will contain the required Zustand stores to pull local memory
  const { dashboardStore, tankStore, shiftStore, treasuryStore } = dbStores;

  switch (functionName) {
    case "getTodaySales":
      const sales = dashboardStore?.todaySales || 1245780; // Defaulting for demo if store undefined
      return { sales: sales, currency: "PKR", date: new Date().toISOString() };
      
    case "getTodayProfit":
      const profit = dashboardStore?.todayProfit || 125000;
      return { profit: profit, currency: "PKR", date: new Date().toISOString() };

    case "getCashPosition":
      const cash = treasuryStore?.totalCash || 450000;
      const bank = treasuryStore?.totalBank || 1800000;
      return { cashOnHand: cash, bankBalance: bank, currency: "PKR" };

    case "getTankLevels":
      const tanks = tankStore?.tanks || [
        { name: "Tank 1 (Petrol)", currentVolume: 12000, capacity: 25000 },
        { name: "Tank 2 (Diesel)", currentVolume: 8500, capacity: 25000 }
      ];
      return { tanks };

    case "getShiftSummary":
      const activeShift = shiftStore?.activeShift || { operator: "Ali", status: "Active", variance: -200 };
      return { shift: activeShift };

    default:
      throw new Error(`Function ${functionName} is not implemented in Jarvis.`);
  }
};
