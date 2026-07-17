import { DollarSign, Fuel, Calculator, Users, Tag, ShieldAlert } from 'lucide-react';

export const REPORT_MODULES = [
  {
    id: "sales",
    icon: DollarSign,
    name: "1. Sales & Revenue Reports",
    reports: [
      { id: "R-01", name: "Live Sales Dashboard", desc: "Real-time total sales by fuel grade, time slot, and pump.", tags: ["rt", "kpi"] },
      { id: "R-02", name: "Daily Revenue Summary", desc: "Total revenue by fuel type, shop sales, and services.", tags: ["daily", "kpi"] },
      { id: "R-03", name: "Hourly Sales Trend", desc: "Sales volume and revenue per hour to identify peak traffic periods.", tags: ["daily"] },
      { id: "R-04", name: "Week-over-Week Comparison", desc: "Compare this week vs last week revenue with % change.", tags: ["weekly", "kpi"] },
      { id: "R-05", name: "Monthly P&L Statement", desc: "Full profit & loss: gross revenue, cost of goods, operating expenses.", tags: ["monthly", "kpi"] },
      { id: "R-06", name: "Fuel Grade Revenue Split", desc: "Revenue contribution per fuel type: petrol, diesel, hi-octane.", tags: ["daily"] },
      { id: "R-07", name: "Year-to-Date Revenue Report", desc: "Cumulative revenue vs budget with monthly breakdown.", tags: ["monthly"] },
      { id: "R-08", name: "Pump-wise Sales", desc: "Live view of each pump's current transaction volume and revenue.", tags: ["rt"] }
    ]
  },
  {
    id: "inventory",
    icon: Fuel,
    name: "2. Fuel Inventory & Tank Reports",
    reports: [
      { id: "R-11", name: "Wet Stock Reconciliation", desc: "Reconcile physical tank dips vs nozzle sales to spot gains/losses.", tags: ["daily", "alert"] },
      { id: "R-12", name: "Tank Storage Levels", desc: "Current volume, dead stock, safe fill limit, and outage per tank.", tags: ["rt", "kpi"] },
      { id: "R-13", name: "Daily Fuel Loss/Gain Ledger", desc: "Track loss/gain volume and percentage daily for petrol and diesel.", tags: ["daily"] },
      { id: "R-14", name: "Supplier Fuel Delivery Log", desc: "Record of all fuel deliveries: invoice qty, decanted qty, and shortage.", tags: ["daily"] },
      { id: "R-15", name: "Tank Evaporation Trend", desc: "Track daily natural evaporation loss vs temperature patterns.", tags: ["weekly"] },
      { id: "R-16", name: "Critical Low Stock Alerts", desc: "Instant list of tanks/products approaching critical low level.", tags: ["rt", "alert"] }
    ]
  },
  {
    id: "accounting",
    icon: Calculator,
    name: "3. Financial & General Ledger Reports",
    reports: [
      { id: "R-22", name: "General Ledger Statement", desc: "Unified ledger: credit/debit logs chronologically.", tags: ["daily", "kpi"] },
      { id: "R-23", name: "Expense Breakdown", desc: "Detailed business expenses categorized by category and date.", tags: ["daily"] },
      { id: "R-24", name: "Accounts Receivable Aging", desc: "Customer credit outstanding grouped by age (0-30, 31-60, 60+ days).", tags: ["monthly", "kpi"] },
      { id: "R-25", name: "Supplier Payable Ledger", desc: "Current pending payments due to OMC and lube distributors.", tags: ["weekly"] },
      { id: "R-26", name: "Cash flow Statement", desc: "Inflows (cash sales, recoveries) vs outflows (expenses, payments).", tags: ["weekly"] }
    ]
  },
  {
    id: "staff",
    icon: Users,
    name: "4. Staff & Shift Performance Reports",
    reports: [
      { id: "R-29", name: "Staff Cash Discrepancy Log", desc: "Overage/shortage history for each operator across shifts.", tags: ["daily", "alert"] },
      { id: "R-30", name: "Operator Sales Efficiency", desc: "Total liters pumped and revenue collected per operator per hour.", tags: ["weekly"] },
      { id: "R-31", name: "Staff Payroll & Advances Statement", desc: "Advances taken, monthly salary, and pending deductions.", tags: ["monthly"] },
      { id: "R-32", name: "Attendance & Shift Compliance", desc: "On-time arrival, late departures, and absent records.", tags: ["weekly"] }
    ]
  },
  {
    id: "customers",
    icon: Tag,
    name: "5. Customer & Credit Reports",
    reports: [
      { id: "R-34", name: "Top Credit Customers", desc: "Ranking of credit customers by sales volume and outstanding limit.", tags: ["weekly", "kpi"] },
      { id: "R-35", name: "Credit Settle Recovery Log", desc: "Receipt book of customer credit payments collected.", tags: ["daily"] },
      { id: "R-36", name: "Credit Limit Breakers", desc: "Instant alert on customers who exceeded their defined credit limit.", tags: ["rt", "alert"] }
    ]
  },
  {
    id: "audits",
    icon: ShieldAlert,
    name: "6. Security & Audit Register Reports",
    reports: [
      { id: "R-44", name: "General Activity Log (Roznamcha)", desc: "Complete chronology of every system action and data edit.", tags: ["rt", "alert"] },
      { id: "R-45", name: "Price Override Log", desc: "Audit list of all price adjustments, overrides, and deviations.", tags: ["daily", "alert"] },
      { id: "R-46", name: "System Logins & PIN Fails", desc: "IP address, device info, and failed PIN entry attempts.", tags: ["rt", "alert"] }
    ]
  }
];
