import re

with open('src/App.tsx', 'r', encoding='utf-8') as f:
    app_code = f.read()

# 1. Extract imports and types
imports_match = re.search(r"import \{(.*?)\} from './types';", app_code, re.DOTALL)
types_import = imports_match.group(1).strip() if imports_match else ""

# 2. Extract state block
start_marker = '// ==========================================\n  // MULTI-STATION (MULTI-BRANCH) ARCHITECTURE\n  // =========================================='
end_marker = '// ==========================================\n  // ROUTING VIEW CONTROLS\n  // =========================================='

start_idx = app_code.find(start_marker)
end_idx = app_code.find(end_marker)
if start_idx == -1 or end_idx == -1:
    print("Could not find markers.")
    exit(1)

extracted_code = app_code[start_idx:end_idx]

# 3. Get all the exported values for the Context Interface
# Find all `const [something, setSomething] = useState`
states = re.findall(r"const \[(\w+), (set\w+)\] = useState(?:<.*?>)?\(", extracted_code)

# Find all mutation handlers (const handleSomething = ...)
handlers = re.findall(r"const (handle\w+) = (.*?)\n\s+const", extracted_code, re.DOTALL)
# Actually it's safer to just explicitly define the handlers or parse them line by line
handler_names = re.findall(r"const (handle\w+) = \([^)]*\) => \{", extracted_code)

interface_parts = [
    "  activeStationId: string;",
    "  stations: Station[];",
    "  settings: GlobalSettings;",
    "  staff: Staff[];",
    "  products: Product[];",
    "  pumps: Pump[];",
    "  nozzles: Nozzle[];",
    "  customers: Customer[];",
    "  suppliers: Supplier[];",
    "  shifts: Shift[];",
    "  banks: BankAccount[];",
    "  digitalAccounts: DigitalAccount[];",
    "  stockTxns: StockTransaction[];",
    "  tanks: Tank[];",
    "  rateHistory: RateHistoryEntry[];",
    "  staffFinance: StaffFinanceEntry[];",
    "  attendance: AttendanceRecord[];",
    "  standaloneExpenses: ExpenseEntry[];",
    "",
    "  setStations: React.Dispatch<React.SetStateAction<Station[]>>;",
    "  setSettings: React.Dispatch<React.SetStateAction<GlobalSettings>>;",
    "  setStaff: React.Dispatch<React.SetStateAction<Staff[]>>;",
    "  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;",
    "  setPumps: React.Dispatch<React.SetStateAction<Pump[]>>;",
    "  setNozzles: React.Dispatch<React.SetStateAction<Nozzle[]>>;",
    "  setCustomers: React.Dispatch<React.SetStateAction<Customer[]>>;",
    "  setSuppliers: React.Dispatch<React.SetStateAction<Supplier[]>>;",
    "  setShifts: React.Dispatch<React.SetStateAction<Shift[]>>;",
    "  setBanks: React.Dispatch<React.SetStateAction<BankAccount[]>>;",
    "  setDigitalAccounts: React.Dispatch<React.SetStateAction<DigitalAccount[]>>;",
    "  setStockTxns: React.Dispatch<React.SetStateAction<StockTransaction[]>>;",
    "  setTanks: React.Dispatch<React.SetStateAction<Tank[]>>;",
    "  setRateHistory: React.Dispatch<React.SetStateAction<RateHistoryEntry[]>>;",
    "  setStaffFinance: React.Dispatch<React.SetStateAction<StaffFinanceEntry[]>>;",
    "  setAttendance: React.Dispatch<React.SetStateAction<AttendanceRecord[]>>;",
    "  setStandaloneExpenses: React.Dispatch<React.SetStateAction<ExpenseEntry[]>>;",
    "",
    "  handleAddStation: (station: Station) => void;",
    "  handleEditStation: (updatedStation: Station) => void;",
    "  handleDeleteStation: (stationId: string) => void;",
    "  handleSwitchStation: (stationId: string) => void;",
    "  handleUpdateSettings: (newSettings: GlobalSettings) => void;",
    "  handleAddStaff: (newStaff: Staff) => void;",
    "  handleUpdateStaff: (updatedMember: Staff) => void;",
    "  handleAddCustomer: (newCustomer: Customer) => void;",
    "  handleUpdateCustomer: (updatedCustomer: Customer) => void;",
    "  handleAddSupplier: (newSupplier: Supplier) => void;",
    "  handleUpdateSupplier: (updatedSupplier: Supplier) => void;",
    "  handleAddShift: (newShift: Shift) => void;",
    "  handleUpdateShift: (updatedShift: Shift) => void;",
    "  handleAddStockReceipt: (txn: StockTransaction) => void;",
    "  handleUpdateProductStock: (productId: string, newStock: number) => void;",
    "  handleUpdateProductRate: (productId: string, newRate: number, reason?: string, changedBy?: string, dateStr?: string) => void;",
    "  handleAddTank: (newTank: Tank) => void;",
    "  handleUpdateTank: (updatedTank: Tank) => void;",
    "  handleDeleteTank: (id: string) => void;",
    "  handleAddNozzle: (newNozzle: Nozzle) => void;",
    "  handleUpdateNozzle: (updatedNozzle: Nozzle) => void;",
    "  handleDeleteNozzle: (id: string) => void;",
    "  handleAddStaffFinance: (newEntry: StaffFinanceEntry) => void;",
    "  handleAddShiftSalaryPayment: (staffId: string, amount: number, note: string, paidFrom: 'cash' | 'bank', date: string, expenseId: string) => void;",
    "  handleDeleteShiftSalaryPayment: (expenseId: string) => void;",
    "  handleAddAttendance: (records: AttendanceRecord[]) => void;",
    "  handleAddStandaloneExpense: (expense: ExpenseEntry) => void;",
    "  handleAddBank: (bank: BankAccount) => void;",
    "  handleUpdateBanks: (updatedBanks: BankAccount[]) => void;",
    "  handleAddDigitalAccount: (acc: DigitalAccount) => void;",
    "  handleUpdateDigitalAccounts: (updatedAccs: DigitalAccount[]) => void;"
]

context_file_content = f"""import React, {{ createContext, useContext, useState, useEffect, useRef, ReactNode }} from 'react';
import {{
{types_import}
}} from '../types';
import {{ db }} from '../data/db';

export interface StationContextType {{
{chr(10).join(interface_parts)}
}}

const StationContext = createContext<StationContextType | undefined>(undefined);

export const StationProvider: React.FC<{{ children: ReactNode }}> = ({{ children }}) => {{
{extracted_code}

  const value: StationContextType = {{
    activeStationId,
    stations,
    settings,
    staff,
    products,
    pumps,
    nozzles,
    customers,
    suppliers,
    shifts,
    banks,
    digitalAccounts,
    stockTxns,
    tanks,
    rateHistory,
    staffFinance,
    attendance,
    standaloneExpenses,
    setStations,
    setSettings,
    setStaff,
    setProducts,
    setPumps,
    setNozzles,
    setCustomers,
    setSuppliers,
    setShifts,
    setBanks,
    setDigitalAccounts,
    setStockTxns,
    setTanks,
    setRateHistory,
    setStaffFinance,
    setAttendance,
    setStandaloneExpenses,
    handleAddStation,
    handleEditStation,
    handleDeleteStation,
    handleSwitchStation,
    handleUpdateSettings,
    handleAddStaff,
    handleUpdateStaff,
    handleAddCustomer,
    handleUpdateCustomer,
    handleAddSupplier,
    handleUpdateSupplier,
    handleAddShift,
    handleUpdateShift,
    handleAddStockReceipt,
    handleUpdateProductStock,
    handleUpdateProductRate,
    handleAddTank,
    handleUpdateTank,
    handleDeleteTank,
    handleAddNozzle,
    handleUpdateNozzle,
    handleDeleteNozzle,
    handleAddStaffFinance,
    handleAddShiftSalaryPayment,
    handleDeleteShiftSalaryPayment,
    handleAddAttendance,
    handleAddStandaloneExpense,
    handleAddBank,
    handleUpdateBanks,
    handleAddDigitalAccount,
    handleUpdateDigitalAccounts
  }};

  return (
    <StationContext.Provider value={{value}}>
      {{children}}
    </StationContext.Provider>
  );
}};

export const useStation = () => {{
  const context = useContext(StationContext);
  if (context === undefined) {{
    throw new Error('useStation must be used within a StationProvider');
  }}
  return context;
}};
"""

with open('src/contexts/StationContext.tsx', 'w', encoding='utf-8') as f:
    f.write(context_file_content)

print("StationContext.tsx generated.")

# Now rewrite App.tsx to use this.
# Replace the extracted block with a single useStation destructuring
destructure = """
  const {
    activeStationId,
    stations,
    settings,
    staff,
    products,
    pumps,
    nozzles,
    customers,
    suppliers,
    shifts,
    banks,
    digitalAccounts,
    stockTxns,
    tanks,
    rateHistory,
    staffFinance,
    attendance,
    standaloneExpenses,
    setStations,
    setSettings,
    setStaff,
    setProducts,
    setPumps,
    setNozzles,
    setCustomers,
    setSuppliers,
    setShifts,
    setBanks,
    setDigitalAccounts,
    setStockTxns,
    setTanks,
    setRateHistory,
    setStaffFinance,
    setAttendance,
    setStandaloneExpenses,
    handleAddStation,
    handleEditStation,
    handleDeleteStation,
    handleSwitchStation,
    handleUpdateSettings,
    handleAddStaff,
    handleUpdateStaff,
    handleAddCustomer,
    handleUpdateCustomer,
    handleAddSupplier,
    handleUpdateSupplier,
    handleAddShift,
    handleUpdateShift,
    handleAddStockReceipt,
    handleUpdateProductStock,
    handleUpdateProductRate,
    handleAddTank,
    handleUpdateTank,
    handleDeleteTank,
    handleAddNozzle,
    handleUpdateNozzle,
    handleDeleteNozzle,
    handleAddStaffFinance,
    handleAddShiftSalaryPayment,
    handleDeleteShiftSalaryPayment,
    handleAddAttendance,
    handleAddStandaloneExpense,
    handleAddBank,
    handleUpdateBanks,
    handleAddDigitalAccount,
    handleUpdateDigitalAccounts
  } = useStation();
"""

new_app_code = app_code[:start_idx] + destructure + app_code[end_idx:]

# Also change `export default function App() {` to `function MainApp() {`
new_app_code = new_app_code.replace("export default function App() {", "function MainApp() {")

# Add import for StationProvider and useStation
new_app_code = "import { StationProvider, useStation } from './contexts/StationContext';\n" + new_app_code

# Add export default App at the end
new_app_code += """
export default function App() {
  return (
    <StationProvider>
      <MainApp />
    </StationProvider>
  );
}
"""

with open('src/App.tsx', 'w', encoding='utf-8') as f:
    f.write(new_app_code)

print("App.tsx refactored.")
