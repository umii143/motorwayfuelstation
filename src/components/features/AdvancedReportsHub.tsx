import React, { useState, useMemo } from "react";
import {
  Zap,
  Search,
  Activity,
  Calendar,
  AlertTriangle,
  TrendingUp,
  DollarSign,
  Fuel,
  Settings,
  Receipt,
  Tag,
  Users,
  Car,
  Calculator,
  ShieldAlert,
  Truck,
  Wrench,
  LineChart,
  ShoppingBag,
  FileCheck,
  Star,
  ChevronRight,
  TrendingDown,
} from "lucide-react";
import {
  GlobalSettings,
  Shift,
  Product,
  Tank,
  RateHistoryEntry,
  Staff,
} from "../../types";

interface AdvancedReportsHubProps {
  settings: GlobalSettings;
  shifts: Shift[];
  products: Product[];
  staff: Staff[];
}

// Data matching PRD
const REPORT_MODULES = [
  {
    id: "sales",
    icon: DollarSign,
    name: "1. Sales & Revenue Reports",
    reports: [
      {
        id: "R-01",
        name: "Live Sales Dashboard",
        desc: "Real-time total sales by fuel grade, time slot, and pump. Updates every 60 seconds.",
        tags: ["rt", "kpi"],
      },
      {
        id: "R-02",
        name: "Daily Revenue Summary",
        desc: "Total revenue by fuel type, shop sales, and services. Shift-wise breakdown.",
        tags: ["daily", "kpi"],
      },
      {
        id: "R-03",
        name: "Hourly Sales Trend",
        desc: "Sales volume and revenue per hour to identify peak and low traffic periods.",
        tags: ["daily"],
      },
      {
        id: "R-04",
        name: "Week-over-Week Revenue Comparison",
        desc: "Compare this week vs last week revenue with % change and trend arrows.",
        tags: ["weekly", "kpi"],
      },
      {
        id: "R-05",
        name: "Monthly P&L Statement",
        desc: "Full profit & loss: gross revenue, cost of goods, operating expenses, net profit.",
        tags: ["monthly", "kpi"],
      },
      {
        id: "R-06",
        name: "Fuel Grade Revenue Split",
        desc: "Revenue contribution per fuel type: petrol, diesel, hi-octane, CNG, EV.",
        tags: ["daily"],
      },
      {
        id: "R-07",
        name: "Year-to-Date Revenue Report",
        desc: "Cumulative revenue vs budget with monthly breakdown and growth rate.",
        tags: ["monthly"],
      },
      {
        id: "R-08",
        name: "Pump-wise Real-Time Sales",
        desc: "Live view of each pump's current transaction volume, liters dispensed, and revenue.",
        tags: ["rt"],
      },
    ],
  },
  {
    id: "inventory",
    icon: Fuel,
    name: "2. Fuel Inventory & Tank Reports",
    reports: [
      {
        id: "R-09",
        name: "Live Tank Level Monitor",
        desc: "Real-time tank levels for each product with low-level alerts and reorder triggers.",
        tags: ["rt", "alert"],
      },
      {
        id: "R-10",
        name: "Daily Stock Reconciliation",
        desc: "Opening stock + received – dispensed = closing. Variance flagged automatically.",
        tags: ["daily", "kpi"],
      },
      {
        id: "R-11",
        name: "Wet Stock Variance Report",
        desc: "ATG measured vs system calculated. Identifies unexplained losses or gains.",
        tags: ["daily", "alert"],
      },
      {
        id: "R-12",
        name: "Fuel Delivery & Receipt Log",
        desc: "All tanker deliveries: quantity ordered, received, dip test, supplier, timestamp.",
        tags: ["weekly"],
      },
      {
        id: "R-13",
        name: "Monthly Stock Loss Analysis",
        desc: "Total evaporation, spillage, theft, and meter error losses with cost impact.",
        tags: ["monthly", "kpi"],
      },
      {
        id: "R-14",
        name: "Leak Detection Alert Report",
        desc: "Triggers when ATG detects unusual volume drop not matching dispensing records.",
        tags: ["alert"],
      },
      {
        id: "R-15",
        name: "Dip Test vs ATG Comparison",
        desc: "Manual dip measurements vs automatic gauge readings. Discrepancy report.",
        tags: ["daily"],
      },
      {
        id: "R-16",
        name: "Inventory Turnover Report",
        desc: "How fast each fuel type sells. Days of stock remaining at current consumption rate.",
        tags: ["weekly", "kpi"],
      },
    ],
  },
  {
    id: "pump",
    icon: Settings,
    name: "3. Pump & Dispenser Reports",
    reports: [
      {
        id: "R-17",
        name: "Pump Status Dashboard",
        desc: "Live status: active, idle, fault, suspended. With downtime duration per pump.",
        tags: ["rt"],
      },
      {
        id: "R-18",
        name: "Pump Performance Report",
        desc: "Volume dispensed, transaction count, revenue, and efficiency score per pump per day.",
        tags: ["daily", "kpi"],
      },
      {
        id: "R-19",
        name: "Meter Calibration Deviation Report",
        desc: "Detects pump meter drift. Flags pumps needing calibration to avoid revenue loss.",
        tags: ["weekly", "alert"],
      },
      {
        id: "R-20",
        name: "Pump Downtime Log",
        desc: "Every fault event: pump ID, fault type, duration, resolution, and revenue lost.",
        tags: ["daily"],
      },
      {
        id: "R-21",
        name: "Nozzle-wise Sales Report",
        desc: "Sales per nozzle across all pumps. Identifies underutilized or high-demand nozzles.",
        tags: ["monthly"],
      },
      {
        id: "R-22",
        name: "Unauthorized Pump Access Alert",
        desc: "Flags dispenser activity outside authorized hours or without active POS transaction.",
        tags: ["alert"],
      },
    ],
  },
  {
    id: "pos",
    icon: Receipt,
    name: "4. Transaction & POS Reports",
    reports: [
      {
        id: "R-23",
        name: "Live Transaction Feed",
        desc: "Every transaction as it happens: product, quantity, price, payment mode, cashier.",
        tags: ["rt"],
      },
      {
        id: "R-24",
        name: "Daily Transaction Summary",
        desc: "Total transactions, average ticket size, payment breakdown: cash/card/digital/credit.",
        tags: ["daily", "kpi"],
      },
      {
        id: "R-25",
        name: "Void & Refund Report",
        desc: "All cancelled/refunded transactions with reason, cashier ID, and manager approval log.",
        tags: ["daily", "alert"],
      },
      {
        id: "R-26",
        name: "Cash Shortage / Overage Report",
        desc: "End-of-shift cash drawer vs expected. Flags discrepancies for investigation.",
        tags: ["daily", "alert"],
      },
      {
        id: "R-27",
        name: "Payment Mode Analysis",
        desc: "Revenue split: cash, debit, credit, fleet card, mobile wallet, credit account.",
        tags: ["weekly"],
      },
      {
        id: "R-28",
        name: "Suspicious Transaction Report",
        desc: "Flags unusually large discounts, back-to-back voids, or odd-hour transactions.",
        tags: ["daily", "alert"],
      },
      {
        id: "R-29",
        name: "Monthly Transaction Volume Trend",
        desc: "Month-wise transaction count with growth rate and forecasted next month volume.",
        tags: ["monthly", "kpi"],
      },
      {
        id: "R-30",
        name: "No-Sale & Drive-Off Report",
        desc: "Pump activations with zero payment recorded. Investigation trigger for fuel theft.",
        tags: ["daily", "alert"],
      },
    ],
  },
  {
    id: "pricing",
    icon: Tag,
    name: "5. Price Management Reports",
    reports: [
      {
        id: "R-31",
        name: "Current Pump Price Board",
        desc: "Active prices for all fuel grades, including time-of-day dynamic pricing status.",
        tags: ["rt", "kpi"],
      },
      {
        id: "R-32",
        name: "Gross Margin per Liter Report",
        desc: "Buy price vs sell price margin per fuel grade. Tracks margin erosion or improvement.",
        tags: ["daily", "kpi"],
      },
      {
        id: "R-33",
        name: "Price Change History Log",
        desc: "All pricing changes: who changed, old price, new price, timestamp, reason.",
        tags: ["weekly"],
      },
      {
        id: "R-34",
        name: "Competitor Price Comparison",
        desc: "Your prices vs nearest 3 competitors. Opportunity alerts for pricing adjustments.",
        tags: ["weekly", "kpi"],
      },
      {
        id: "R-35",
        name: "Price Elasticity Report",
        desc: "How volume changes when price changes. Optimal pricing sweet-spot analysis.",
        tags: ["monthly"],
      },
      {
        id: "R-36",
        name: "Below-Cost Sale Alert",
        desc: "Triggers if any transaction records sale price below procurement cost. Stops losses.",
        tags: ["alert"],
      },
    ],
  },
  {
    id: "staff",
    icon: Users,
    name: "6. Staff & Shift Management Reports",
    reports: [
      {
        id: "R-37",
        name: "Shift-wise Sales Report",
        desc: "Revenue, liters sold, and transactions per shift and per cashier.",
        tags: ["daily", "kpi"],
      },
      {
        id: "R-38",
        name: "Cashier Performance Report",
        desc: "Voids, refunds, cash errors, and shortages per cashier. Ranks performance.",
        tags: ["daily", "alert"],
      },
      {
        id: "R-39",
        name: "Attendance & Punctuality Report",
        desc: "Staff check-in/out vs scheduled shift. Late arrivals and early departures flagged.",
        tags: ["weekly"],
      },
      {
        id: "R-40",
        name: "Staff Productivity Report",
        desc: "Revenue generated per staff member per hour. Identifies high and low performers.",
        tags: ["monthly", "kpi"],
      },
      {
        id: "R-41",
        name: "Overtime & Payroll Cost Report",
        desc: "Actual hours worked vs contracted. Overtime cost vs revenue correlation.",
        tags: ["monthly"],
      },
      {
        id: "R-42",
        name: "Shift Handover Discrepancy Report",
        desc: "Opening vs closing readings between shifts. Catches handover losses.",
        tags: ["daily", "alert"],
      },
    ],
  },
  {
    id: "customer",
    icon: Car,
    name: "7. Customer & Fleet Account Reports",
    reports: [
      {
        id: "R-43",
        name: "Top 20 Fleet Customers Report",
        desc: "Highest-volume fleet accounts by liters and revenue. Retention risk flagging.",
        tags: ["weekly", "kpi"],
      },
      {
        id: "R-44",
        name: "Fleet Credit Limit Report",
        desc: "Outstanding balances vs approved credit limits. Overdue and near-limit alerts.",
        tags: ["monthly", "alert"],
      },
      {
        id: "R-45",
        name: "Loyalty Points Summary",
        desc: "Points earned, redeemed, expired. Loyalty ROI and program effectiveness.",
        tags: ["monthly", "kpi"],
      },
      {
        id: "R-46",
        name: "New vs Returning Customer Report",
        desc: "Tracks customer acquisition and retention. Identifies loyalty trends.",
        tags: ["weekly"],
      },
      {
        id: "R-47",
        name: "Fleet Overspend Alert",
        desc: "Flags fleet vehicles fueling more than usual volume in a single fill. Theft indicator.",
        tags: ["daily", "alert"],
      },
      {
        id: "R-48",
        name: "Customer Lifetime Value Report",
        desc: "Total spend per customer since first visit. High-value customer identification.",
        tags: ["monthly"],
      },
    ],
  },
  {
    id: "finance",
    icon: Calculator,
    name: "8. Accounts & Finance Reports",
    reports: [
      {
        id: "R-49",
        name: "Daily Cash Flow Report",
        desc: "Cash in (sales) vs cash out (expenses, purchases). Net cash position at day end.",
        tags: ["daily", "kpi"],
      },
      {
        id: "R-50",
        name: "Accounts Receivable Aging",
        desc: "Fleet/credit dues by 0-30, 31-60, 61-90, 90+ days. Overdue escalation list.",
        tags: ["monthly", "kpi"],
      },
      {
        id: "R-51",
        name: "Accounts Payable Report",
        desc: "Supplier payment dues, due dates, and early payment discount opportunities.",
        tags: ["monthly"],
      },
      {
        id: "R-52",
        name: "Bank Reconciliation Report",
        desc: "POS receipts vs bank statement. Identifies undeposited cash or payment failures.",
        tags: ["monthly", "kpi"],
      },
      {
        id: "R-53",
        name: "Expense Category Report",
        desc: "All expenses: rent, utilities, salaries, maintenance, consumables by category.",
        tags: ["monthly"],
      },
      {
        id: "R-54",
        name: "Gross Profit Margin Report",
        desc: "Gross margin % per product category: fuel, shop, carwash, services.",
        tags: ["weekly", "kpi"],
      },
      {
        id: "R-55",
        name: "Budget vs Actual Variance",
        desc: "Every expense and revenue line vs monthly budget. Over/under budget analysis.",
        tags: ["monthly", "kpi"],
      },
      {
        id: "R-56",
        name: "Tax Liability Report",
        desc: "Sales tax, withholding tax, import levy collected and payable per period.",
        tags: ["monthly"],
      },
    ],
  },
  {
    id: "loss",
    icon: ShieldAlert,
    name: "9. Loss Prevention & Fraud Detection Reports",
    reports: [
      {
        id: "R-57",
        name: "Real-Time Shrinkage Monitor",
        desc: "Continuous comparison of dispensed fuel (pump meter) vs sold (POS). Gap alert.",
        tags: ["rt", "alert"],
      },
      {
        id: "R-58",
        name: "Cashier Fraud Pattern Report",
        desc: "Detects patterns: selective voiding, phantom discounts, currency manipulation.",
        tags: ["daily", "alert"],
      },
      {
        id: "R-59",
        name: "Fuel Theft Detection Report",
        desc: "Drive-offs, unauthorized pump access, tanker delivery short-fills combined report.",
        tags: ["daily", "alert"],
      },
      {
        id: "R-60",
        name: "Weekly Loss Summary",
        desc: "Total measurable losses: stock variance, cash shorts, voids, refunds. PKR value.",
        tags: ["weekly", "kpi"],
      },
      {
        id: "R-61",
        name: "Loss-to-Revenue Ratio Report",
        desc: "Total losses as % of revenue. Benchmark vs industry standard to gauge severity.",
        tags: ["monthly", "kpi"],
      },
      {
        id: "R-62",
        name: "Supplier Short-Delivery Alert",
        desc: "Compares ordered quantity vs dip test vs ATG on delivery. Flags short fills.",
        tags: ["alert"],
      },
      {
        id: "R-63",
        name: "After-Hours Activity Report",
        desc: "Any system activity outside operational hours: POS logins, pump access, entries.",
        tags: ["daily", "alert"],
      },
      {
        id: "R-64",
        name: "CCTV Incident Correlation",
        desc: "Links CCTV timestamps to transaction anomalies for visual evidence trails.",
        tags: ["weekly"],
      },
    ],
  },
  {
    id: "procurement",
    icon: Truck,
    name: "10. Procurement & Supply Chain Reports",
    reports: [
      {
        id: "R-65",
        name: "Supplier Performance Scorecard",
        desc: "On-time deliveries, quantity accuracy, quality issues per supplier. Rating score.",
        tags: ["weekly", "kpi"],
      },
      {
        id: "R-66",
        name: "Procurement Cost Analysis",
        desc: "Cost per liter by supplier vs market. Identifies better negotiation opportunities.",
        tags: ["monthly", "kpi"],
      },
      {
        id: "R-67",
        name: "Reorder Point Alert",
        desc: "Triggers purchase order request when tank falls to reorder level. Auto-calculated.",
        tags: ["rt", "alert"],
      },
      {
        id: "R-68",
        name: "Purchase Order Tracker",
        desc: "All POs: status (ordered/in-transit/received), expected date, quantity, cost.",
        tags: ["weekly"],
      },
      {
        id: "R-69",
        name: "Supply Chain Cost vs Revenue",
        desc: "Total procurement cost as % of fuel revenue. Tracks whether margins are squeezed.",
        tags: ["monthly"],
      },
    ],
  },
  {
    id: "maintenance",
    icon: Wrench,
    name: "11. Maintenance & Equipment Reports",
    reports: [
      {
        id: "R-70",
        name: "Scheduled Maintenance Tracker",
        desc: "Due maintenance tasks: pumps, ATG, generators, carwash. Overdue items flagged red.",
        tags: ["weekly", "alert"],
      },
      {
        id: "R-71",
        name: "Maintenance Cost Report",
        desc: "All repair and maintenance spend by equipment category vs budget.",
        tags: ["monthly", "kpi"],
      },
      {
        id: "R-72",
        name: "Equipment Lifecycle Report",
        desc: "Age, service history, and replacement forecast for all major equipment assets.",
        tags: ["monthly"],
      },
      {
        id: "R-73",
        name: "Generator & Power Failure Log",
        desc: "Power outage events, generator activation, duration, and fuel consumed.",
        tags: ["daily", "alert"],
      },
      {
        id: "R-74",
        name: "Equipment Uptime Report",
        desc: "Availability % for pumps, compressors, carwash, ATG. Downtime cost calculation.",
        tags: ["monthly", "kpi"],
      },
    ],
  },
  {
    id: "analytics",
    icon: LineChart,
    name: "12. Business Intelligence & Growth Analytics",
    reports: [
      {
        id: "R-75",
        name: "Executive KPI Dashboard",
        desc: "One-page summary: revenue, margin, loss %, customer count, volume sold, staff cost.",
        tags: ["monthly", "kpi"],
      },
      {
        id: "R-76",
        name: "Demand Forecast Report",
        desc: "Predicted volume for next 7/30 days based on historical trend and seasonal data.",
        tags: ["monthly", "kpi"],
      },
      {
        id: "R-77",
        name: "Best & Worst Day Analysis",
        desc: "Highest and lowest revenue days with factors: weather, events, holidays, pricing.",
        tags: ["weekly", "kpi"],
      },
      {
        id: "R-78",
        name: "Seasonal Trend Report",
        desc: "Volume and revenue patterns by month, week, and time of day across past 12 months.",
        tags: ["monthly"],
      },
      {
        id: "R-79",
        name: "Revenue Growth Rate Report",
        desc: "Month-on-month and year-on-year growth for each business segment.",
        tags: ["monthly", "kpi"],
      },
      {
        id: "R-80",
        name: "Product Mix Analysis",
        desc: "Revenue share: fuel vs convenience store vs carwash vs services. Rebalance strategy.",
        tags: ["weekly"],
      },
      {
        id: "R-81",
        name: "Break-Even Analysis Report",
        desc: "Daily liters needed to cover all costs. Tracks how many days hit break-even.",
        tags: ["monthly", "kpi"],
      },
      {
        id: "R-82",
        name: "Multi-Site Comparative Report",
        desc: "Side-by-side performance of all stations in the network. Best/worst performers.",
        tags: ["monthly"],
      },
    ],
  },
  {
    id: "shop",
    icon: ShoppingBag,
    name: "13. Convenience Store & Ancillary Services",
    reports: [
      {
        id: "R-83",
        name: "Shop Daily Sales Report",
        desc: "Revenue, units sold, top 10 products, and category breakdown for in-store sales.",
        tags: ["daily", "kpi"],
      },
      {
        id: "R-84",
        name: "Shop Inventory Shrinkage",
        desc: "Theoretical stock vs physical count. Theft, damage, and expiry loss flagged.",
        tags: ["weekly", "alert"],
      },
      {
        id: "R-85",
        name: "Shop Margin Report",
        desc: "Gross margin % per product category. Identifies high-margin and loss-making items.",
        tags: ["monthly", "kpi"],
      },
      {
        id: "R-86",
        name: "Slow-Moving Products Report",
        desc: "Items with low turnover for more than 30 days. Enables clearance or discontinuation.",
        tags: ["weekly"],
      },
      {
        id: "R-87",
        name: "Carwash Revenue Report",
        desc: "Daily carwash transactions, package mix, revenue, and machine utilization %.",
        tags: ["daily", "kpi"],
      },
      {
        id: "R-88",
        name: "Ancillary Revenue Contribution",
        desc: "% of total revenue from non-fuel: shop, carwash, oil change, air, ATM fees.",
        tags: ["monthly"],
      },
    ],
  },
  {
    id: "compliance",
    icon: FileCheck,
    name: "14. Regulatory & Compliance Reports",
    reports: [
      {
        id: "R-89",
        name: "License & Permit Expiry Tracker",
        desc: "All operating licenses with expiry dates and renewal reminders 60/30/7 days out.",
        tags: ["monthly", "alert"],
      },
      {
        id: "R-90",
        name: "Environmental Compliance Report",
        desc: "Soil/water test results, tank inspection dates, spill incident log, EPA filings.",
        tags: ["monthly"],
      },
      {
        id: "R-91",
        name: "Tax Filing Summary",
        desc: "Sales tax, GST, and other levies collected vs filed vs paid. Reconciliation proof.",
        tags: ["monthly", "kpi"],
      },
      {
        id: "R-92",
        name: "Weights & Measures Compliance",
        desc: "Pump meter calibration certificates, test dates, and regulatory inspection history.",
        tags: ["weekly"],
      },
      {
        id: "R-93",
        name: "HSE Incident Log",
        desc: "All safety incidents: near-misses, injuries, fire events, spills with action taken.",
        tags: ["monthly"],
      },
    ],
  },
  {
    id: "extra",
    icon: Star,
    name: "15. Additional High-Value Reports",
    reports: [
      {
        id: "R-94",
        name: "Owner Morning Briefing Report",
        desc: "Auto-sent at 8 AM: yesterday's revenue, top issues, alerts, and today's forecast.",
        tags: ["rt", "kpi"],
      },
      {
        id: "R-95",
        name: "Manager End-of-Day Report",
        desc: "Complete day summary: sales, incidents, staff issues, inventory, cash position.",
        tags: ["daily", "kpi"],
      },
      {
        id: "R-96",
        name: "Critical Alert Escalation Report",
        desc: "High-severity events sent via SMS/WhatsApp/email: leaks, theft, system failures.",
        tags: ["rt", "alert"],
      },
      {
        id: "R-97",
        name: "Return on Investment Report",
        desc: "Net profit vs total capital invested. Payback period and ROI % for the station.",
        tags: ["monthly", "kpi"],
      },
      {
        id: "R-98",
        name: "User Access & Audit Trail",
        desc: "Every system login, data edit, report access, and setting change with user ID.",
        tags: ["weekly"],
      },
      {
        id: "R-99",
        name: "Customer Complaint Log",
        desc: "All complaints received, category, resolution time, and recurring issue patterns.",
        tags: ["monthly"],
      },
      {
        id: "R-100",
        name: "Annual Business Performance Report",
        desc: "Full-year P&L, growth vs prior year, KPI scorecard, goals achieved, next year plan.",
        tags: ["monthly", "kpi"],
      },
      {
        id: "R-101",
        name: "Digital Channel Revenue Report",
        desc: "Sales via mobile app, pre-ordering, e-wallet. Growth of digital vs physical sales.",
        tags: ["weekly", "kpi"],
      },
      {
        id: "R-102",
        name: "Price Override Abuse Report",
        desc: "All manual price overrides at POS: who, when, how much deviation, approved or not.",
        tags: ["daily", "alert"],
      },
      {
        id: "R-103",
        name: "Fuel Quality Assurance Report",
        desc: "Lab test results, density checks, adulteration test log for each fuel batch received.",
        tags: ["monthly", "kpi"],
      },
      {
        id: "R-104",
        name: "Strategic Growth Scorecard",
        desc: "10 key growth metrics tracked monthly: volume growth, new customers, margin trend, loss reduction progress.",
        tags: ["monthly", "kpi"],
      },
    ],
  },
];

export default function AdvancedReportsHub({
  settings,
  shifts,
  products,
  staff,
}: AdvancedReportsHubProps) {
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeReport, setActiveReport] = useState<string | null>(null);

  const filters = [
    { id: "all", label: "All (104)" },
    { id: "rt", label: "Real-Time", icon: Zap },
    { id: "daily", label: "Daily" },
    { id: "weekly", label: "Weekly" },
    { id: "monthly", label: "Monthly" },
    { id: "alert", label: "Alerts", icon: AlertTriangle },
    { id: "kpi", label: "KPIs", icon: TrendingUp },
  ];

  const getTagStyle = (tag: string) => {
    switch (tag) {
      case "rt":
        return "bg-emerald-100 text-emerald-800 border-emerald-200";
      case "daily":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "weekly":
        return "bg-amber-100 text-amber-800 border-amber-200";
      case "monthly":
        return "bg-purple-100 text-purple-800 border-purple-200";
      case "alert":
        return "bg-rose-100 text-rose-800 border-rose-200";
      case "kpi":
        return "bg-teal-100 text-teal-800 border-teal-200";
      default:
        return "bg-slate-100 text-slate-800 border-slate-200";
    }
  };

  const getTagLabel = (tag: string) => {
    switch (tag) {
      case "rt":
        return "Real-Time";
      case "daily":
        return "Daily";
      case "weekly":
        return "Weekly";
      case "monthly":
        return "Monthly";
      case "alert":
        return "Alert";
      case "kpi":
        return "KPI";
      default:
        return tag;
    }
  };

  const filteredModules = useMemo(() => {
    return REPORT_MODULES.map((mod) => {
      const filteredReports = mod.reports.filter((r) => {
        const matchesFilter =
          activeFilter === "all" || r.tags.includes(activeFilter);
        const matchesSearch =
          r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          r.desc.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesFilter && matchesSearch;
      });
      return { ...mod, reports: filteredReports };
    }).filter((mod) => mod.reports.length > 0);
  }, [activeFilter, searchQuery]);

  return (
    <div className="space-y-6 pb-20">
      {/* Hyper-Premium Hero Header */}
      <div className="rounded-auth border border-slate-200 bg-white p-6 md:p-8 shadow-sm flex flex-col md:flex-row gap-6 md:items-center relative overflow-hidden rounded-2xl">
        <div className="absolute top-0 right-0 p-8 opacity-5">
          <LineChart className="w-64 h-64 text-orange-600" />
        </div>

        <div className="bg-orange-50 w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 border border-orange-100 z-10">
          <FileCheck className="h-8 w-8 text-orange-600" />
        </div>
        <div className="z-10">
          <h1 className="font-sans text-2xl md:text-3xl font-black tracking-tight text-slate-900 mb-2">
            Enterprise Advanced Reports
          </h1>
          <p className="font-sans text-sm text-slate-500 max-w-3xl leading-relaxed">
            Ultimate data visibility: 104 real-time business reports for owners
            & managers. Track every drop, eliminate losses, detect fraud, and
            generate actionable KPIs to drive station profitability.
          </p>
          <div className="flex flex-wrap gap-2 mt-4">
            <span className="bg-amber-100 text-amber-800 text-[11px] font-bold px-3 py-1 rounded-full flex items-center gap-1 border border-amber-200">
              <Zap className="w-3 h-3" /> 104 Reports Total
            </span>
            <span className="bg-emerald-100 text-emerald-800 text-[11px] font-bold px-3 py-1 rounded-full border border-emerald-200">
              Real-Time + Scheduled
            </span>
            <span className="bg-blue-100 text-blue-800 text-[11px] font-bold px-3 py-1 rounded-full border border-blue-200">
              Loss Detection
            </span>
            <span className="bg-rose-100 text-rose-800 text-[11px] font-bold px-3 py-1 rounded-full border border-rose-200">
              Alert-Driven
            </span>
          </div>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <span className="text-slate-400 text-xs font-bold mb-1 uppercase tracking-wider block">
            Total Reports
          </span>
          <div className="font-mono text-2xl font-black text-slate-900">
            104
          </div>
          <span className="text-slate-400 text-[10px] mt-1 block font-bold">
            Across 15 modules
          </span>
        </div>
        <div className="bg-emerald-50 rounded-xl border border-emerald-100 p-4 shadow-sm">
          <span className="text-emerald-600 text-xs font-bold mb-1 uppercase tracking-wider block">
            Real-Time Reports
          </span>
          <div className="font-mono text-2xl font-black text-emerald-900">
            11
          </div>
          <span className="text-emerald-700 text-[10px] mt-1 block font-bold">
            Live dashboard feeds
          </span>
        </div>
        <div className="bg-rose-50 rounded-xl border border-rose-100 p-4 shadow-sm">
          <span className="text-rose-600 text-xs font-bold mb-1 uppercase tracking-wider block">
            Loss-Prevention
          </span>
          <div className="font-mono text-2xl font-black text-rose-900">14</div>
          <span className="text-rose-700 text-[10px] mt-1 block font-bold">
            Stop leakage instantly
          </span>
        </div>
        <div className="bg-blue-50 rounded-xl border border-blue-100 p-4 shadow-sm">
          <span className="text-blue-600 text-xs font-bold mb-1 uppercase tracking-wider block">
            Profit Trackers
          </span>
          <div className="font-mono text-2xl font-black text-blue-900">32</div>
          <span className="text-blue-700 text-[10px] mt-1 block font-bold">
            Margin & growth KPIs
          </span>
        </div>
        <div className="bg-amber-50 rounded-xl border border-amber-100 p-4 shadow-sm">
          <span className="text-amber-600 text-xs font-bold mb-1 uppercase tracking-wider block">
            Alert Reports
          </span>
          <div className="font-mono text-2xl font-black text-amber-900">20</div>
          <span className="text-amber-700 text-[10px] mt-1 block font-bold">
            Auto-triggered warnings
          </span>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search 100+ reports by name, module, or keyword..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 focus:outline-hidden focus:border-orange-500 shadow-sm transition-colors"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          {filters.map((f) => (
            <button
              key={f.id}
              onClick={() => setActiveFilter(f.id)}
              className={`px-4 py-2 rounded-full text-xs font-bold transition-all border ${
                activeFilter === f.id
                  ? "bg-slate-900 text-white border-slate-900 shadow-sm"
                  : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50 hover:text-slate-700"
              } flex items-center gap-1.5 cursor-pointer`}
            >
              {f.icon && <f.icon className="w-3.5 h-3.5" />}
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Dynamic Report Matrix */}
      {filteredModules.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center shadow-sm">
          <Search className="w-12 h-12 text-slate-200 mx-auto mb-3" />
          <h3 className="text-slate-800 font-bold mb-1">No reports found</h3>
          <p className="text-slate-500 text-sm">
            Try adjusting your search criteria or changing the tag filter.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {filteredModules.map((mod) => (
            <div key={mod.id} className="animate-in fade-in duration-300">
              <h2 className="flex items-center gap-2 font-sans text-sm font-bold text-slate-900 border-b-2 border-slate-100 pb-2 mb-4 uppercase tracking-wider">
                <mod.icon className="w-5 h-5 text-orange-600" />
                {mod.name}
              </h2>

              <div className="grid grid-cols-2 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-3">
                {mod.reports.map((report) => (
                  <div
                    key={report.id}
                    onClick={() => setActiveReport(report.id)}
                    className="bg-white border border-slate-200 rounded-xl p-4 flex gap-3 hover:border-orange-400 hover:shadow-md transition-all cursor-pointer group"
                  >
                    <div className="font-mono text-[11px] font-bold text-slate-400 pt-0.5 min-w-full max-w-[32px]">
                      {report.id}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-sans text-sm font-bold text-slate-900 mb-1 group-hover:text-orange-600 transition-colors truncate">
                        {report.name}
                      </h3>
                      <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed mb-3">
                        {report.desc}
                      </p>
                      <div className="flex flex-wrap gap-1.5 mt-auto">
                        {report.tags.map((tag) => (
                          <span
                            key={tag}
                            className={`px-2 py-0.5 border rounded-full text-[9px] font-bold uppercase tracking-wider ${getTagStyle(tag)}`}
                          >
                            {getTagLabel(tag)}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Report Viewer Modal (Premium Mockup for unimplemented) */}
      {activeReport && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 lg:p-8 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full h-full max-w-7xl flex flex-col overflow-hidden border border-slate-200">
            {/* Modal Header */}
            <div className="h-16 border-b border-slate-200 flex items-center justify-between px-6 bg-slate-50">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-orange-100 border border-orange-200 flex items-center justify-center">
                  <Activity className="w-4 h-4 text-orange-600" />
                </div>
                <div>
                  <h2 className="font-bold font-sans text-slate-900 text-lg">
                    {
                      REPORT_MODULES.flatMap((m) => m.reports).find(
                        (r) => r.id === activeReport,
                      )?.name
                    }
                  </h2>
                  <p className="text-[10px] font-mono text-slate-500 font-bold tracking-widest">
                    {activeReport} // REAL-TIME EXECUTION CONTEXT
                  </p>
                </div>
              </div>
              <button
                onClick={() => setActiveReport(null)}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-200 text-slate-500 transition-colors cursor-pointer font-black text-xl"
              >
                &times;
              </button>
            </div>

            {/* Modal Body - Dynamic Loading Simulator */}
            <div className="flex-1 overflow-auto p-6 bg-slate-50 flex items-center justify-center">
              <div className="max-w-md w-full mx-auto text-center py-12 bg-white border border-slate-200 shadow-sm rounded-2xl">
                <div className="relative w-20 h-20 mx-auto mb-6">
                  <div className="absolute inset-0 rounded-full border-4 border-slate-100"></div>
                  <div className="absolute inset-0 rounded-full border-4 border-orange-500 border-t-transparent animate-spin"></div>
                  <LineChart className="w-8 h-8 text-orange-600 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                </div>
                <h3 className="text-xl font-black text-slate-900 mb-2 tracking-tight">
                  Compiling Data Engine...
                </h3>
                <p className="text-slate-500 text-sm mx-auto mb-6 px-6 leading-relaxed">
                  Loading real-time vectors and applying ML heuristics to
                  populate the enterprise dashboard view. Please wait.
                </p>

                <div className="w-48 h-1.5 bg-slate-100 rounded-full mx-auto overflow-hidden">
                  <div className="h-full bg-orange-500 w-2/3 animate-pulse rounded-full"></div>
                </div>
                <div className="mt-4 text-[10px] text-slate-400 font-mono tracking-widest uppercase">
                  Fetching parameters...
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
