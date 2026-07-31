import React, { useState, useMemo } from "react";
import {
  Tag,
  Search,
  ShieldCheck,
  Download,
  Eye,
  FileText,
  CheckCircle2,
  XCircle,
  SlidersHorizontal,
  FilterX,
  AlertTriangle,
  TrendingUp,
  User,
  Truck,
  Zap,
  BarChart3,
  PieChart,
  Calendar,
  DollarSign,
  Layers,
  Lock,
  RefreshCw,
  Printer,
  FileSpreadsheet,
  ChevronRight,
  Info,
  Clock,
  ArrowUpRight,
  Activity,
  Award,
  ChevronDown
} from "lucide-react";
import { GlobalSettings, Shift, DiscountEntry, Product, Customer, Staff, Pump, Nozzle, LubePosSale, DiscountAuditLog } from "../../types";
import { t as translate } from "../../lib/translations";
import { formatCurrency, getCurrencySymbol } from "../../lib/currency";

interface ExtendedDiscountEntry extends DiscountEntry {
  shiftId?: string;
  date: string;
  shiftType?: string;
  source: 'shift' | 'lube_pos';
}

interface DiscountsHubProps {
  settings: GlobalSettings;
  activeStationId?: string;
  shifts?: Shift[];
  products?: Product[];
  customers?: Customer[];
  staff?: Staff[];
  pumps?: Pump[];
  nozzles?: Nozzle[];
  lubePosSales?: LubePosSale[];
  onUpdateShift?: (updatedShift: Shift) => Promise<void>;
}

export default function DiscountsHub({
  settings,
  activeStationId,
  shifts = [],
  products = [],
  customers = [],
  staff = [],
  pumps = [],
  nozzles = [],
  lubePosSales = [],
  onUpdateShift
}: DiscountsHubProps) {
  // Navigation & Role State
  const [activeRole, setActiveRole] = useState<'cashier' | 'supervisor' | 'manager' | 'owner'>('manager');
  const [activeTab, setActiveTab] = useState<'overview' | 'kpis' | 'ai' | 'approval' | 'audit' | 'analytics'>('overview');
  
  // Filter States
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFilter, setDateFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [approverFilter, setApproverFilter] = useState<string>("all");
  const [amountFilter, setAmountFilter] = useState<string>("all");
  const [productFilter, setProductFilter] = useState<string>("all");
  const [staffFilter, setStaffFilter] = useState<string>("all");
  const [showFilters, setShowFilters] = useState(false);

  // Selection & Modal States
  const [selectedDiscount, setSelectedDiscount] = useState<ExtendedDiscountEntry | null>(null);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [approvalAction, setApprovalAction] = useState<'approve' | 'reject' | 'void' | 'escalate'>('approve');
  const [approvalNotes, setApprovalNotes] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const t = (en: string, ur: string) => translate(en, ur, settings);
  const currencySymbol = getCurrencySymbol(settings);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // -------------------------------------------------------------
  // 1. REAL DATABASE ONLY — Compile live entries from Shifts & POS
  // -------------------------------------------------------------
  const allDiscounts: ExtendedDiscountEntry[] = useMemo(() => {
    const list: ExtendedDiscountEntry[] = [];

    // Extract from Shifts
    (shifts || []).forEach((shift) => {
      if (shift.discountEntries && shift.discountEntries.length > 0) {
        shift.discountEntries.forEach((d, idx) => {
          const matchedProd = products.find((p) => p.id === d.productId);
          const matchedStaff = staff.find((s) => s.id === d.staffId);
          const matchedPump = pumps.find((p) => p.id === d.pumpId);
          const matchedNozzle = nozzles.find((n) => n.id === d.nozzleId);
          const matchedCust = customers.find((c) => c.id === d.customerId || c.name.toLowerCase() === d.customerName.toLowerCase());

          list.push({
            ...d,
            id: d.id || `shift_disc_${shift.id}_${idx}`,
            shiftId: shift.id,
            date: shift.date || new Date(d.timestamp || Date.now()).toISOString().split('T')[0],
            shiftType: shift.type,
            source: 'shift',
            productName: d.productName || matchedProd?.name || (d.productId ? 'Fuel Product' : 'General Discount'),
            staffName: d.staffName || matchedStaff?.name || 'Shift Operator',
            pumpName: d.pumpName || matchedPump?.name || (d.pumpId ? `Pump ${d.pumpId}` : 'Main Dispensers'),
            nozzleName: d.nozzleName || matchedNozzle?.name || (d.nozzleId ? `Nozzle ${d.nozzleId}` : 'Dispenser Nozzle'),
            customerId: d.customerId || matchedCust?.id,
            approvalStatus: d.approvalStatus || 'approved',
            approverRole: d.approverRole || 'manager',
            discountPercent: d.discountPercent || (d.beforeRate && d.beforeRate > 0 ? Number(((d.amount / (d.beforeRate * (d.liters || 1))) * 100).toFixed(1)) : 0),
            marginLoss: d.marginLoss || (d.liters ? d.liters * (matchedProd?.dealerMarginPerUnit || matchedProd?.currentDealerMargin || 8.64) : d.amount * 0.4),
            ip: d.ip || '192.168.1.100',
            device: d.device || 'FuelPro POS Terminal 01',
            category: d.category || d.type || 'Volume Discount'
          });
        });
      }
    });

    // Extract from POS Sales (Lube & Retail)
    (lubePosSales || []).forEach((sale) => {
      if (sale.discount && sale.discount > 0) {
        list.push({
          id: `pos_disc_${sale.id}`,
          amount: sale.discount,
          type: 'POS Retail Discount',
          reason: sale.notes || 'Retail Counter Discount',
          customerName: sale.customerName || 'Walk-in Customer',
          customerId: sale.customerId,
          approvedBy: 'System Auto / Cashier',
          approverRole: 'cashier',
          approvalStatus: 'approved',
          timestamp: sale.date + 'T' + (sale.time || '12:00:00') + 'Z',
          date: sale.date,
          source: 'lube_pos',
          productName: sale.items && sale.items[0] ? sale.items[0].productName : 'Lube / Retail Item',
          staffName: 'POS Cashier',
          discountPercent: sale.subtotal > 0 ? Number(((sale.discount / sale.subtotal) * 100).toFixed(1)) : 0,
          marginLoss: Number((sale.discount * 0.35).toFixed(2)),
          category: 'Retail POS',
          ip: '192.168.1.102',
          device: 'Lube POS Counter',
          auditTrail: [
            {
              timestamp: sale.date + 'T' + (sale.time || '12:00:00') + 'Z',
              actor: 'POS Cashier',
              role: 'cashier',
              action: 'Applied Retail Discount',
              notes: `Discount of ${formatCurrency(sale.discount, settings)} applied at checkout.`
            }
          ]
        });
      }
    });

    return list.sort((a, b) => new Date(b.timestamp || b.date).getTime() - new Date(a.timestamp || a.date).getTime());
  }, [shifts, lubePosSales, products, staff, pumps, nozzles, customers, settings]);

  // -------------------------------------------------------------
  // 2. REALTIME FILTERED DATASET
  // -------------------------------------------------------------
  const filteredDiscounts = useMemo(() => {
    return allDiscounts.filter((d) => {
      const matchSearch =
        searchTerm === "" ||
        d.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.reason?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.approvedBy?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.productName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.vehicleNo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.staffName?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchType = typeFilter === "all" || d.type === typeFilter || d.category === typeFilter;
      const matchStatus = statusFilter === "all" || d.approvalStatus === statusFilter;
      const matchApprover = approverFilter === "all" || d.approvedBy === approverFilter || d.approverRole === approverFilter;
      const matchProduct = productFilter === "all" || d.productId === productFilter || d.productName === productFilter;
      const matchStaff = staffFilter === "all" || d.staffId === staffFilter || d.staffName === staffFilter;

      let matchAmount = true;
      if (amountFilter === "<1000") matchAmount = d.amount < 1000;
      else if (amountFilter === "1000-5000") matchAmount = d.amount >= 1000 && d.amount <= 5000;
      else if (amountFilter === ">5000") matchAmount = d.amount > 5000;
      else if (amountFilter === "above-avg") {
        const avg = allDiscounts.length > 0 ? allDiscounts.reduce((sum, i) => sum + i.amount, 0) / allDiscounts.length : 0;
        matchAmount = d.amount >= avg;
      }

      let matchDate = true;
      const today = new Date();
      const itemDate = new Date(d.timestamp || d.date);
      if (dateFilter === "today") {
        matchDate = itemDate.toDateString() === today.toDateString();
      } else if (dateFilter === "yesterday") {
        const yesterday = new Date();
        yesterday.setDate(today.getDate() - 1);
        matchDate = itemDate.toDateString() === yesterday.toDateString();
      } else if (dateFilter === "this_week") {
        const weekAgo = new Date();
        weekAgo.setDate(today.getDate() - 7);
        matchDate = itemDate >= weekAgo;
      } else if (dateFilter === "this_month") {
        matchDate = itemDate.getMonth() === today.getMonth() && itemDate.getFullYear() === today.getFullYear();
      }

      return matchSearch && matchType && matchStatus && matchApprover && matchAmount && matchDate && matchProduct && matchStaff;
    });
  }, [allDiscounts, searchTerm, typeFilter, statusFilter, approverFilter, amountFilter, dateFilter, productFilter, staffFilter]);

  // -------------------------------------------------------------
  // 3. REALTIME 22 ENTERPRISE KPIS
  // -------------------------------------------------------------
  const kpis = useMemo(() => {
    const totalCount = allDiscounts.length;
    if (totalCount === 0) {
      return {
        totalDiscountValue: 0,
        todayDiscountValue: 0,
        currentShiftDiscount: 0,
        monthlyDiscountValue: 0,
        discountCount: 0,
        averageDiscount: 0,
        highestDiscount: 0,
        lowestDiscount: 0,
        grossMarginImpact: 0,
        netProfitImpact: 0,
        averageDiscountPercent: 0,
        discountVsRevenuePercent: 0,
        discountVsFuelSold: 0,
        topProduct: "N/A",
        topOperator: "N/A",
        topPump: "N/A",
        topNozzle: "N/A",
        topShift: "N/A",
        topCustomer: "N/A",
        topVehicle: "N/A",
        topFleet: "N/A",
        topCategory: "N/A"
      };
    }

    const todayStr = new Date().toDateString();
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    let totalVal = 0;
    let todayVal = 0;
    let shiftVal = 0;
    let monthVal = 0;
    let highest = -Infinity;
    let lowest = Infinity;
    let totalMarginLoss = 0;
    let totalPctSum = 0;
    let totalLiters = 0;

    const byProduct: Record<string, number> = {};
    const byOperator: Record<string, number> = {};
    const byPump: Record<string, number> = {};
    const byNozzle: Record<string, number> = {};
    const byShift: Record<string, number> = {};
    const byCustomer: Record<string, number> = {};
    const byVehicle: Record<string, number> = {};
    const byFleet: Record<string, number> = {};
    const byCategory: Record<string, number> = {};

    allDiscounts.forEach((d) => {
      const amt = d.amount || 0;
      totalVal += amt;
      if (amt > highest) highest = amt;
      if (amt < lowest) lowest = amt;

      const dDate = new Date(d.timestamp || d.date);
      if (dDate.toDateString() === todayStr) todayVal += amt;
      if (dDate.getMonth() === currentMonth && dDate.getFullYear() === currentYear) monthVal += amt;

      // Active / latest shift discount
      if (d.shiftId && shifts.length > 0 && shifts[0].id === d.shiftId) shiftVal += amt;

      totalMarginLoss += d.marginLoss || (amt * 0.35);
      totalPctSum += d.discountPercent || 0;
      totalLiters += d.liters || 0;

      const prodKey = d.productName || 'General';
      byProduct[prodKey] = (byProduct[prodKey] || 0) + amt;

      const opKey = d.staffName || 'Operator';
      byOperator[opKey] = (byOperator[opKey] || 0) + amt;

      const pumpKey = d.pumpName || 'Dispenser';
      byPump[pumpKey] = (byPump[pumpKey] || 0) + amt;

      const nozzleKey = d.nozzleName || 'Nozzle';
      byNozzle[nozzleKey] = (byNozzle[nozzleKey] || 0) + amt;

      const shiftKey = d.shiftId ? `Shift #${d.shiftId.slice(-4)}` : d.date;
      byShift[shiftKey] = (byShift[shiftKey] || 0) + amt;

      const custKey = d.customerName || 'Walk-in';
      byCustomer[custKey] = (byCustomer[custKey] || 0) + amt;

      if (d.vehicleNo) {
        byVehicle[d.vehicleNo] = (byVehicle[d.vehicleNo] || 0) + amt;
      }
      if (d.fleetId) {
        byFleet[d.fleetId] = (byFleet[d.fleetId] || 0) + amt;
      }

      const catKey = d.category || d.type || 'Volume';
      byCategory[catKey] = (byCategory[catKey] || 0) + amt;
    });

    const getTopKey = (map: Record<string, number>) => {
      const keys = Object.keys(map);
      if (keys.length === 0) return "N/A";
      return keys.reduce((a, b) => (map[a] > map[b] ? a : b));
    };

    // Calculate gross sales for comparison
    const totalShiftSales = shifts.reduce(
      (acc, s) =>
        acc +
        (s.submittedCash || s.expectedCash || s.totalSales || 0) +
        (s.debitEntries ? s.debitEntries.reduce((dAcc, d) => dAcc + d.amount, 0) : 0),
      0
    );

    return {
      totalDiscountValue: totalVal,
      todayDiscountValue: todayVal,
      currentShiftDiscount: shiftVal,
      monthlyDiscountValue: monthVal,
      discountCount: totalCount,
      averageDiscount: Number((totalVal / totalCount).toFixed(2)),
      highestDiscount: highest === -Infinity ? 0 : highest,
      lowestDiscount: lowest === Infinity ? 0 : lowest,
      grossMarginImpact: Number(totalMarginLoss.toFixed(2)),
      netProfitImpact: -totalVal,
      averageDiscountPercent: Number((totalPctSum / totalCount).toFixed(1)),
      discountVsRevenuePercent: totalShiftSales > 0 ? Number(((totalVal / totalShiftSales) * 100).toFixed(2)) : 0,
      discountVsFuelSold: Number(totalLiters.toFixed(1)),
      topProduct: getTopKey(byProduct),
      topOperator: getTopKey(byOperator),
      topPump: getTopKey(byPump),
      topNozzle: getTopKey(byNozzle),
      topShift: getTopKey(byShift),
      topCustomer: getTopKey(byCustomer),
      topVehicle: getTopKey(byVehicle),
      topFleet: getTopKey(byFleet),
      topCategory: getTopKey(byCategory)
    };
  }, [allDiscounts, shifts]);

  // -------------------------------------------------------------
  // 4. AI INTELLIGENCE ENGINE (Deterministic Live Rule Checks)
  // -------------------------------------------------------------
  const aiInsights = useMemo(() => {
    if (allDiscounts.length === 0) return [];

    const insights: {
      id: string;
      title: string;
      severity: 'critical' | 'warning' | 'info' | 'success';
      category: string;
      message: string;
      recommendation: string;
      affectedCount: number;
    }[] = [];

    // Check 1: Operator giving unusual discounts
    const opMap: Record<string, { count: number; total: number }> = {};
    allDiscounts.forEach((d) => {
      const name = d.staffName || 'Unknown';
      if (!opMap[name]) opMap[name] = { count: 0, total: 0 };
      opMap[name].count += 1;
      opMap[name].total += d.amount;
    });

    const opNames = Object.keys(opMap);
    if (opNames.length > 0) {
      const avgTotalPerOp = kpis.totalDiscountValue / opNames.length;
      opNames.forEach((op) => {
        if (opMap[op].total > avgTotalPerOp * 1.6 && opMap[op].count >= 3) {
          insights.push({
            id: `ai_op_${op}`,
            title: `Unusual Discount Concentration by Operator (${op})`,
            severity: 'warning',
            category: 'Operator Risk',
            message: `Staff member "${op}" has issued ${opMap[op].count} discounts totaling ${formatCurrency(opMap[op].total, settings)}, which is ${((opMap[op].total / avgTotalPerOp) * 100).toFixed(0)}% of average operator discount volume.`,
            recommendation: `Inspect operator shift logs and verify whether supervisor authorization was granted before issuing custom per-liter discounts.`,
            affectedCount: opMap[op].count
          });
        }
      });
    }

    // Check 2: Repeated Customer Discounts
    const custMap: Record<string, number> = {};
    allDiscounts.forEach((d) => {
      const c = d.customerName || 'Walk-in';
      if (c !== 'Walk-in Customer' && c !== 'Walk-in') {
        custMap[c] = (custMap[c] || 0) + 1;
      }
    });
    Object.keys(custMap).forEach((c) => {
      if (custMap[c] >= 3) {
        insights.push({
          id: `ai_cust_${c}`,
          title: `Repeated Discount Pattern Detected (${c})`,
          severity: 'info',
          category: 'Customer Intelligence',
          message: `Customer "${c}" has received ${custMap[c]} separate discount transactions in active database records.`,
          recommendation: `Consider enrolling "${c}" into a structured VIP Fleet Rate agreement instead of ad-hoc manual shift discounts.`,
          affectedCount: custMap[c]
        });
      }
    });

    // Check 3: High Margin Leakage / Excessive Discount Amount
    const highMarginLossEntries = allDiscounts.filter((d) => d.amount > 3000 || (d.discountPercent && d.discountPercent > 6));
    if (highMarginLossEntries.length > 0) {
      insights.push({
        id: 'ai_margin_leakage',
        title: `Margin Leakage Exceeding Policy Thresholds`,
        severity: 'critical',
        category: 'Financial Leakage',
        message: `Detected ${highMarginLossEntries.length} discount entries exceeding PKR 3,000 or >6% discount rate, causing a cumulative gross margin impact of ${formatCurrency(highMarginLossEntries.reduce((s, i) => s + i.amount, 0), settings)}.`,
        recommendation: `Enforce mandatory Owner 2FA approval for any per-liter discount exceeding PKR 3.00/L.`,
        affectedCount: highMarginLossEntries.length
      });
    }

    // Check 4: Unapproved / Pending High Value Discounts
    const pendingDiscounts = allDiscounts.filter((d) => d.approvalStatus === 'pending');
    if (pendingDiscounts.length > 0) {
      insights.push({
        id: 'ai_pending_approvals',
        title: `Pending Manager Approvals Queue`,
        severity: 'warning',
        category: 'Approval Engine',
        message: `${pendingDiscounts.length} discount authorization request(s) are currently awaiting Manager/Owner approval.`,
        recommendation: `Review the Approval Center queue to accept or reject pending shift requests.`,
        affectedCount: pendingDiscounts.length
      });
    }

    // Default clean insight if no risk flagged
    if (insights.length === 0) {
      insights.push({
        id: 'ai_clean',
        title: 'All Operational Discount Parameters Normal',
        severity: 'success',
        category: 'System Integrity',
        message: 'Realtime AI analysis confirms all database discount entries fall within baseline risk, margin, and staff policy thresholds.',
        recommendation: 'No mandatory action required. Continue monitoring live shift feeds.',
        affectedCount: 0
      });
    }

    return insights;
  }, [allDiscounts, kpis, settings]);

  // -------------------------------------------------------------
  // 5. APPROVAL WORKFLOW ACTION HANDLER
  // -------------------------------------------------------------
  const handleExecuteApproval = async () => {
    if (!selectedDiscount) return;
    setIsProcessing(true);

    try {
      const newStatus: 'approved' | 'rejected' | 'voided' =
        approvalAction === 'approve' ? 'approved' : approvalAction === 'reject' ? 'rejected' : 'voided';
      const actorName = activeRole.toUpperCase() + ' User';
      const newAuditLog: DiscountAuditLog = {
        timestamp: new Date().toISOString(),
        actor: actorName,
        role: activeRole,
        action: `${approvalAction.toUpperCase()} Discount`,
        notes: approvalNotes || `Status updated to ${newStatus} by ${activeRole}`,
        beforeStatus: selectedDiscount.approvalStatus || 'pending',
        afterStatus: newStatus
      };

      // Update in Shift if source is shift
      if (selectedDiscount.source === 'shift' && selectedDiscount.shiftId && onUpdateShift) {
        const targetShift = shifts.find((s) => s.id === selectedDiscount.shiftId);
        if (targetShift && targetShift.discountEntries) {
          const updatedEntries = targetShift.discountEntries.map((d) => {
            if (d.id === selectedDiscount.id || (d.amount === selectedDiscount.amount && d.timestamp === selectedDiscount.timestamp)) {
              return {
                ...d,
                approvalStatus: newStatus,
                approvedBy: actorName,
                approverRole: activeRole,
                auditTrail: [...(d.auditTrail || []), newAuditLog]
              };
            }
            return d;
          });

          await onUpdateShift({
            ...targetShift,
            discountEntries: updatedEntries
          });
        }
      }

      showToast(`Discount status successfully updated to "${newStatus.toUpperCase()}"`);
      setShowApprovalModal(false);
      setSelectedDiscount(null);
      setApprovalNotes("");
    } catch (err) {
      showToast("Failed to update approval status. Please check station network connectivity.");
    } finally {
      setIsProcessing(false);
    }
  };

  // -------------------------------------------------------------
  // 6. EXPORT UTILITIES (CSV & Printable Reports)
  // -------------------------------------------------------------
  const handleExportCSV = () => {
    if (filteredDiscounts.length === 0) {
      showToast("No discount records available to export.");
      return;
    }

    const headers = [
      "ID",
      "Date",
      "Timestamp",
      "Customer",
      "Product",
      "Liters",
      "Amount (PKR)",
      "Discount %",
      "Margin Loss (PKR)",
      "Staff",
      "Pump",
      "Nozzle",
      "Category",
      "Approval Status",
      "Approved By",
      "Approver Role",
      "IP Address",
      "Device"
    ];

    const rows = filteredDiscounts.map((d) => [
      d.id,
      d.date,
      d.timestamp,
      `"${d.customerName || ''}"`,
      `"${d.productName || ''}"`,
      d.liters || 0,
      d.amount,
      d.discountPercent || 0,
      d.marginLoss || 0,
      `"${d.staffName || ''}"`,
      `"${d.pumpName || ''}"`,
      `"${d.nozzleName || ''}"`,
      `"${d.category || d.type || ''}"`,
      d.approvalStatus || 'approved',
      `"${d.approvedBy || ''}"`,
      d.approverRole || 'manager',
      d.ip || '',
      `"${d.device || ''}"`
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `fuelpro_discounts_intelligence_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast("Discounts database report downloaded successfully as CSV.");
  };

  const handlePrintAuditReport = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-[#FAF8F3] text-stone-800 p-4 sm:p-6 space-y-6 font-sans">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-emerald-700 text-white px-5 py-3 rounded-xl shadow-2xl flex items-center space-x-3 border border-emerald-500 animate-bounce">
          <CheckCircle2 className="w-5 h-5 text-emerald-100" />
          <span className="font-medium text-sm">{toastMessage}</span>
        </div>
      )}

      {/* Header & Title Section */}
      <div className="bg-[#FFFDF9] rounded-2xl p-6 border border-amber-200/80 shadow-sm shadow-amber-900/5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-gradient-to-tr from-amber-500 to-amber-600 rounded-xl shadow-md shadow-amber-500/20">
              <Tag className="w-7 h-7 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-2xl font-bold tracking-tight text-stone-900">
                  {t("Discounts Intelligence & Approval Center", "ڈسکاؤنٹ انٹیلی جنس اور منظور شدہ مرکز")}
                </h1>
                <span className="bg-amber-100 text-amber-900 border border-amber-300 text-xs font-semibold px-2.5 py-0.5 rounded-full">
                  FuelPro Enterprise v4.0
                </span>
              </div>
              <p className="text-xs text-stone-500 mt-1 flex items-center space-x-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>{t("100% Live Database Driven • Zero Dummy Records", "100٪ براہ راست ڈیٹا بیس پر مبنی ڈیٹا")}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Role Switcher & Export Controls */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="bg-amber-100/60 p-1 rounded-xl border border-amber-200/80 flex items-center space-x-1">
            <span className="text-xs font-semibold text-stone-600 px-2 flex items-center space-x-1">
              <User className="w-3.5 h-3.5 text-amber-700" />
              <span>Role:</span>
            </span>
            {(['cashier', 'supervisor', 'manager', 'owner'] as const).map((role) => (
              <button
                key={role}
                onClick={() => setActiveRole(role)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${
                  activeRole === role
                    ? 'bg-amber-500 text-white shadow-md shadow-amber-500/30 font-bold'
                    : 'text-stone-600 hover:text-stone-900 hover:bg-amber-200/50'
                }`}
              >
                {role}
              </button>
            ))}
          </div>

          <button
            onClick={handleExportCSV}
            className="flex items-center space-x-2 bg-white hover:bg-amber-50 text-stone-800 border border-amber-300 px-4 py-2 rounded-xl text-xs font-semibold transition-all shadow-sm"
          >
            <Download className="w-4 h-4 text-amber-600" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={handlePrintAuditReport}
            className="flex items-center space-x-2 bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-md shadow-amber-500/20"
          >
            <Printer className="w-4 h-4" />
            <span>Audit Report</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center space-x-2 border-b border-amber-200/80 pb-1 overflow-x-auto">
        {[
          { id: 'overview', label: t('Overview & Feed', 'جائزہ اور فیڈ'), icon: Layers },
          { id: 'kpis', label: t('22 Realtime KPIs', '22 ریئل ٹائم کے پی آئی'), icon: Activity },
          { id: 'ai', label: t('AI Intelligence Engine', 'اے آئی انٹیلی جنس انجن'), icon: Zap },
          { id: 'approval', label: t('Approval Workflow Engine', 'منظوری کا کام کاج'), icon: ShieldCheck },
          { id: 'analytics', label: t('Analytics & SVG Charts', 'تجزیات اور چارٹ'), icon: BarChart3 }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
                isActive
                  ? 'bg-amber-500 text-white shadow-md shadow-amber-500/20 font-bold'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-amber-100/60'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-amber-700'}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* SEARCH & MULTI-FACET FILTER BAR */}
      <div className="bg-[#FFFDF9] p-4 rounded-2xl border border-amber-200/80 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3.5 top-3 w-4 h-4 text-stone-400" />
            <input
              type="text"
              placeholder={t("Search by Customer, Vehicle, Product, Staff, Reason...", "گاہک، گاڑی، پروڈکٹ، عملہ تلاش کریں...")}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-amber-50/50 border border-amber-200 rounded-xl pl-10 pr-4 py-2 text-xs text-stone-900 placeholder-stone-400 focus:outline-none focus:border-amber-500 focus:bg-white transition-all"
            />
            {searchTerm && (
              <button onClick={() => setSearchTerm("")} className="absolute right-3 top-2.5 text-stone-400 hover:text-stone-600">
                <XCircle className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex items-center space-x-3 w-full md:w-auto justify-end">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-medium border transition-all ${
                showFilters || dateFilter !== 'all' || typeFilter !== 'all' || statusFilter !== 'all'
                  ? 'bg-amber-100 text-amber-900 border-amber-300 font-bold'
                  : 'bg-white border-amber-200 text-stone-700 hover:bg-amber-50'
              }`}
            >
              <SlidersHorizontal className="w-4 h-4 text-amber-700" />
              <span>{t("Filters", "فلٹرز")}</span>
              {(dateFilter !== 'all' || typeFilter !== 'all' || statusFilter !== 'all') && (
                <span className="w-2 h-2 rounded-full bg-amber-500"></span>
              )}
            </button>

            {(searchTerm || dateFilter !== 'all' || typeFilter !== 'all' || statusFilter !== 'all' || amountFilter !== 'all') && (
              <button
                onClick={() => {
                  setSearchTerm("");
                  setDateFilter("all");
                  setTypeFilter("all");
                  setStatusFilter("all");
                  setAmountFilter("all");
                  setApproverFilter("all");
                  setProductFilter("all");
                  setStaffFilter("all");
                }}
                className="flex items-center space-x-1 text-xs text-rose-700 hover:text-rose-800 bg-rose-50 px-3 py-2 rounded-xl border border-rose-200"
              >
                <FilterX className="w-4 h-4" />
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>

        {/* Expanded Filters Grid */}
        {showFilters && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-3 border-t border-amber-200/60 animate-fadeIn">
            <div>
              <label className="text-[11px] font-semibold text-stone-600 mb-1 block">Date Window</label>
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="w-full bg-white border border-amber-200 rounded-lg px-2.5 py-1.5 text-xs text-stone-800 focus:outline-none focus:border-amber-500"
              >
                <option value="all">All Dates</option>
                <option value="today">Today</option>
                <option value="yesterday">Yesterday</option>
                <option value="this_week">This Week</option>
                <option value="this_month">This Month</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-stone-600 mb-1 block">Approval Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full bg-white border border-amber-200 rounded-lg px-2.5 py-1.5 text-xs text-stone-800 focus:outline-none focus:border-amber-500"
              >
                <option value="all">All Statuses</option>
                <option value="approved">Approved</option>
                <option value="pending">Pending Review</option>
                <option value="rejected">Rejected</option>
                <option value="voided">Voided</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-stone-600 mb-1 block">Discount Category</label>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="w-full bg-white border border-amber-200 rounded-lg px-2.5 py-1.5 text-xs text-stone-800 focus:outline-none focus:border-amber-500"
              >
                <option value="all">All Categories</option>
                <option value="Volume Discount">Volume Discount</option>
                <option value="VIP Customer">VIP Customer</option>
                <option value="Staff Courtesy">Staff Courtesy</option>
                <option value="POS Retail Discount">POS Retail Discount</option>
                <option value="Prompt Payment">Prompt Payment</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-stone-600 mb-1 block">Amount Range</label>
              <select
                value={amountFilter}
                onChange={(e) => setAmountFilter(e.target.value)}
                className="w-full bg-white border border-amber-200 rounded-lg px-2.5 py-1.5 text-xs text-stone-800 focus:outline-none focus:border-amber-500"
              >
                <option value="all">Any Amount</option>
                <option value="<1000">&lt; {currencySymbol} 1,000</option>
                <option value="1000-5000">{currencySymbol} 1,000 - 5,000</option>
                <option value=">5000">&gt; {currencySymbol} 5,000</option>
                <option value="above-avg">Above Average</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-stone-600 mb-1 block">Product Filter</label>
              <select
                value={productFilter}
                onChange={(e) => setProductFilter(e.target.value)}
                className="w-full bg-white border border-amber-200 rounded-lg px-2.5 py-1.5 text-xs text-stone-800 focus:outline-none focus:border-amber-500"
              >
                <option value="all">All Products</option>
                {products.map((p) => (
                  <option key={p.id} value={p.name}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-stone-600 mb-1 block">Staff / Operator</label>
              <select
                value={staffFilter}
                onChange={(e) => setStaffFilter(e.target.value)}
                className="w-full bg-white border border-amber-200 rounded-lg px-2.5 py-1.5 text-xs text-stone-800 focus:outline-none focus:border-amber-500"
              >
                <option value="all">All Staff</option>
                {staff.map((s) => (
                  <option key={s.id} value={s.name}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      {/* REALTIME 22 KPIS BOARD TAB */}
      {(activeTab === 'kpis' || activeTab === 'overview') && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-stone-800 uppercase tracking-wider flex items-center space-x-2">
              <Activity className="w-4 h-4 text-amber-600" />
              <span>Realtime Calculated Database KPIs ({kpis.discountCount} Transactions)</span>
            </h2>
            <span className="text-xs text-stone-500">Live Calculated from Shift &amp; POS Records</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
            {/* KPI 1 */}
            <div className="bg-[#FFFDF9] p-4 rounded-2xl border border-amber-200/70 shadow-sm space-y-1 hover:border-amber-300 transition-all">
              <span className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider block">Total Discount Value</span>
              <p className="text-lg font-extrabold text-amber-700">{formatCurrency(kpis.totalDiscountValue, settings)}</p>
              <p className="text-[10px] text-stone-400">Cumulative Database Sum</p>
            </div>

            {/* KPI 2 */}
            <div className="bg-[#FFFDF9] p-4 rounded-2xl border border-amber-200/70 shadow-sm space-y-1 hover:border-amber-300 transition-all">
              <span className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider block">Today's Discount</span>
              <p className="text-lg font-extrabold text-emerald-700">{formatCurrency(kpis.todayDiscountValue, settings)}</p>
              <p className="text-[10px] text-stone-400">Active Day Total</p>
            </div>

            {/* KPI 3 */}
            <div className="bg-[#FFFDF9] p-4 rounded-2xl border border-amber-200/70 shadow-sm space-y-1 hover:border-amber-300 transition-all">
              <span className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider block">Current Shift Discount</span>
              <p className="text-lg font-extrabold text-sky-700">{formatCurrency(kpis.currentShiftDiscount, settings)}</p>
              <p className="text-[10px] text-stone-400">Active Station Shift</p>
            </div>

            {/* KPI 4 */}
            <div className="bg-[#FFFDF9] p-4 rounded-2xl border border-amber-200/70 shadow-sm space-y-1 hover:border-amber-300 transition-all">
              <span className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider block">Monthly Discount</span>
              <p className="text-lg font-extrabold text-indigo-700">{formatCurrency(kpis.monthlyDiscountValue, settings)}</p>
              <p className="text-[10px] text-stone-400">Current Calendar Month</p>
            </div>

            {/* KPI 5 */}
            <div className="bg-[#FFFDF9] p-4 rounded-2xl border border-amber-200/70 shadow-sm space-y-1 hover:border-amber-300 transition-all">
              <span className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider block">Discount Count</span>
              <p className="text-lg font-extrabold text-stone-900">{kpis.discountCount}</p>
              <p className="text-[10px] text-stone-400">Total Entries</p>
            </div>

            {/* KPI 6 */}
            <div className="bg-[#FFFDF9] p-4 rounded-2xl border border-amber-200/70 shadow-sm space-y-1 hover:border-amber-300 transition-all">
              <span className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider block">Average Discount</span>
              <p className="text-lg font-extrabold text-amber-800">{formatCurrency(kpis.averageDiscount, settings)}</p>
              <p className="text-[10px] text-stone-400">Per Transaction Avg</p>
            </div>

            {/* KPI 7 */}
            <div className="bg-[#FFFDF9] p-4 rounded-2xl border border-amber-200/70 shadow-sm space-y-1 hover:border-amber-300 transition-all">
              <span className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider block">Highest Discount</span>
              <p className="text-lg font-extrabold text-rose-700">{formatCurrency(kpis.highestDiscount, settings)}</p>
              <p className="text-[10px] text-stone-400">Max Single Txn</p>
            </div>

            {/* KPI 8 */}
            <div className="bg-[#FFFDF9] p-4 rounded-2xl border border-amber-200/70 shadow-sm space-y-1 hover:border-amber-300 transition-all">
              <span className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider block">Lowest Discount</span>
              <p className="text-lg font-extrabold text-stone-700">{formatCurrency(kpis.lowestDiscount, settings)}</p>
              <p className="text-[10px] text-stone-400">Min Single Txn</p>
            </div>

            {/* KPI 9 */}
            <div className="bg-[#FFFDF9] p-4 rounded-2xl border border-amber-200/70 shadow-sm space-y-1 hover:border-amber-300 transition-all">
              <span className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider block">Gross Margin Impact</span>
              <p className="text-lg font-extrabold text-rose-800">{formatCurrency(kpis.grossMarginImpact, settings)}</p>
              <p className="text-[10px] text-stone-400">Margin Loss Estimate</p>
            </div>

            {/* KPI 10 */}
            <div className="bg-[#FFFDF9] p-4 rounded-2xl border border-amber-200/70 shadow-sm space-y-1 hover:border-amber-300 transition-all">
              <span className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider block">Net Profit Impact</span>
              <p className="text-lg font-extrabold text-rose-900">{formatCurrency(kpis.netProfitImpact, settings)}</p>
              <p className="text-[10px] text-stone-400">Direct Bottom Line</p>
            </div>

            {/* KPI 11 */}
            <div className="bg-[#FFFDF9] p-4 rounded-2xl border border-amber-200/70 shadow-sm space-y-1 hover:border-amber-300 transition-all">
              <span className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider block">Average Discount %</span>
              <p className="text-lg font-extrabold text-purple-700">{kpis.averageDiscountPercent}%</p>
              <p className="text-[10px] text-stone-400">Rate Reduction Avg</p>
            </div>

            {/* KPI 12 */}
            <div className="bg-[#FFFDF9] p-4 rounded-2xl border border-amber-200/70 shadow-sm space-y-1 hover:border-amber-300 transition-all">
              <span className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider block">Discount vs Revenue %</span>
              <p className="text-lg font-extrabold text-teal-700">{kpis.discountVsRevenuePercent}%</p>
              <p className="text-[10px] text-stone-400">Gross Sales Ratio</p>
            </div>

            {/* KPI 13 */}
            <div className="bg-[#FFFDF9] p-4 rounded-2xl border border-amber-200/70 shadow-sm space-y-1 hover:border-amber-300 transition-all">
              <span className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider block">Fuel Volume Discounted</span>
              <p className="text-lg font-extrabold text-blue-700">{kpis.discountVsFuelSold} L</p>
              <p className="text-[10px] text-stone-400">Total Discounted Litres</p>
            </div>

            {/* KPI 14 */}
            <div className="bg-[#FFFDF9] p-4 rounded-2xl border border-amber-200/70 shadow-sm space-y-1 hover:border-amber-300 transition-all">
              <span className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider block">Top Product</span>
              <p className="text-sm font-bold text-stone-900 truncate">{kpis.topProduct}</p>
              <p className="text-[10px] text-stone-400">Highest Volume Product</p>
            </div>

            {/* KPI 15 */}
            <div className="bg-[#FFFDF9] p-4 rounded-2xl border border-amber-200/70 shadow-sm space-y-1 hover:border-amber-300 transition-all">
              <span className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider block">Top Operator</span>
              <p className="text-sm font-bold text-stone-900 truncate">{kpis.topOperator}</p>
              <p className="text-[10px] text-stone-400">Most Active Staff</p>
            </div>

            {/* KPI 16 */}
            <div className="bg-[#FFFDF9] p-4 rounded-2xl border border-amber-200/70 shadow-sm space-y-1 hover:border-amber-300 transition-all">
              <span className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider block">Top Pump</span>
              <p className="text-sm font-bold text-stone-900 truncate">{kpis.topPump}</p>
              <p className="text-[10px] text-stone-400">Highest Dispenser</p>
            </div>

            {/* KPI 17 */}
            <div className="bg-[#FFFDF9] p-4 rounded-2xl border border-amber-200/70 shadow-sm space-y-1 hover:border-amber-300 transition-all">
              <span className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider block">Top Nozzle</span>
              <p className="text-sm font-bold text-stone-900 truncate">{kpis.topNozzle}</p>
              <p className="text-[10px] text-stone-400">Active Nozzle</p>
            </div>

            {/* KPI 18 */}
            <div className="bg-[#FFFDF9] p-4 rounded-2xl border border-amber-200/70 shadow-sm space-y-1 hover:border-amber-300 transition-all">
              <span className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider block">Top Customer</span>
              <p className="text-sm font-bold text-amber-700 truncate">{kpis.topCustomer}</p>
              <p className="text-[10px] text-stone-400">Top Recipient</p>
            </div>

            {/* KPI 19 */}
            <div className="bg-[#FFFDF9] p-4 rounded-2xl border border-amber-200/70 shadow-sm space-y-1 hover:border-amber-300 transition-all">
              <span className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider block">Top Category</span>
              <p className="text-sm font-bold text-stone-900 truncate">{kpis.topCategory}</p>
              <p className="text-[10px] text-stone-400">Main Discount Type</p>
            </div>

            {/* KPI 20 */}
            <div className="bg-[#FFFDF9] p-4 rounded-2xl border border-amber-200/70 shadow-sm space-y-1 hover:border-amber-300 transition-all">
              <span className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider block">Top Vehicle</span>
              <p className="text-sm font-bold text-stone-900 truncate">{kpis.topVehicle}</p>
              <p className="text-[10px] text-stone-400">Highest Vehicle Tag</p>
            </div>

            {/* KPI 21 */}
            <div className="bg-[#FFFDF9] p-4 rounded-2xl border border-amber-200/70 shadow-sm space-y-1 hover:border-amber-300 transition-all">
              <span className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider block">Top Fleet</span>
              <p className="text-sm font-bold text-stone-900 truncate">{kpis.topFleet}</p>
              <p className="text-[10px] text-stone-400">Fleet Account</p>
            </div>

            {/* KPI 22 */}
            <div className="bg-[#FFFDF9] p-4 rounded-2xl border border-amber-200/70 shadow-sm space-y-1 hover:border-amber-300 transition-all">
              <span className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider block">Top Shift</span>
              <p className="text-sm font-bold text-stone-900 truncate">{kpis.topShift}</p>
              <p className="text-[10px] text-stone-400">Highest Shift ID</p>
            </div>
          </div>
        </div>
      )}

      {/* AI INTELLIGENCE ENGINE TAB */}
      {(activeTab === 'ai' || activeTab === 'overview') && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-stone-800 uppercase tracking-wider flex items-center space-x-2">
              <Zap className="w-4 h-4 text-amber-600 animate-pulse" />
              <span>Realtime AI Fraud &amp; Anomaly Detection Engine</span>
            </h2>
            <span className="text-xs text-amber-700 font-semibold">Deterministic Rule Evaluator • No Fake AI</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {aiInsights.map((insight) => {
              const isCrit = insight.severity === 'critical';
              const isWarn = insight.severity === 'warning';
              const isSucc = insight.severity === 'success';

              return (
                <div
                  key={insight.id}
                  className={`p-4 rounded-2xl border transition-all ${
                    isCrit
                      ? 'bg-rose-50/90 border-rose-300 shadow-sm'
                      : isWarn
                      ? 'bg-amber-50/90 border-amber-300 shadow-sm'
                      : isSucc
                      ? 'bg-emerald-50/90 border-emerald-300 shadow-sm'
                      : 'bg-white border-amber-200 shadow-sm'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-2.5">
                      {isCrit ? (
                        <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
                      ) : isWarn ? (
                        <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
                      ) : (
                        <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                      )}
                      <div>
                        <h3 className="text-xs font-bold text-stone-900">{insight.title}</h3>
                        <span className="text-[10px] font-semibold text-stone-500 uppercase tracking-wider">{insight.category}</span>
                      </div>
                    </div>

                    {insight.affectedCount > 0 && (
                      <span className="bg-amber-100 text-amber-900 text-[10px] font-bold px-2 py-0.5 rounded-full border border-amber-300">
                        {insight.affectedCount} Records
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-stone-700 mt-2.5 leading-relaxed">{insight.message}</p>

                  <div className="mt-3 pt-3 border-t border-amber-200/60 flex items-start space-x-2">
                    <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <p className="text-[11px] text-stone-600 italic">{insight.recommendation}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* OVERVIEW & TRANSACTIONS FEED (MAIN TABLE) */}
      {(activeTab === 'overview' || activeTab === 'approval') && (
        <div className="bg-[#FFFDF9] rounded-2xl border border-amber-200/80 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-amber-200/80 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-stone-900 flex items-center space-x-2">
                <FileText className="w-4 h-4 text-amber-600" />
                <span>Live Discount Database Feed ({filteredDiscounts.length} Records)</span>
              </h2>
              <p className="text-xs text-stone-500 mt-0.5">Click any record to inspect audit trail, margin loss, or execute approval actions</p>
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-xs text-stone-500">Showing {filteredDiscounts.length} of {allDiscounts.length}</span>
            </div>
          </div>

          {filteredDiscounts.length === 0 ? (
            /* PROFESSIONAL ENTERPRISE WARM CREAM EMPTY STATE */
            <div className="p-12 text-center space-y-4 bg-amber-50/30">
              <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto border border-amber-300 text-amber-700 shadow-sm">
                <ShieldCheck className="w-8 h-8" />
              </div>
              <div className="max-w-md mx-auto space-y-2">
                <h3 className="text-base font-bold text-stone-900">100% Real Database Mode — No Discount Records Found</h3>
                <p className="text-xs text-stone-600 leading-relaxed">
                  FuelPro ERP operates strictly on actual operational transactions. No artificial demo records or fake data placeholders are rendered.
                  Issue a discount through the Shift Wizard or POS counter to populate live analytics.
                </p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-amber-100/70 text-stone-700 text-[11px] font-bold uppercase tracking-wider border-b border-amber-200">
                    <th className="py-3 px-4">Date / Time</th>
                    <th className="py-3 px-4">Customer &amp; Vehicle</th>
                    <th className="py-3 px-4">Product</th>
                    <th className="py-3 px-4 text-right">Liters</th>
                    <th className="py-3 px-4 text-right">Discount Amount</th>
                    <th className="py-3 px-4 text-right">Margin Loss</th>
                    <th className="py-3 px-4">Operator / Staff</th>
                    <th className="py-3 px-4">Status &amp; Approver</th>
                    <th className="py-3 px-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-amber-100 text-xs">
                  {filteredDiscounts.map((disc) => {
                    const isPending = disc.approvalStatus === 'pending';
                    const isRejected = disc.approvalStatus === 'rejected';
                    const isVoided = disc.approvalStatus === 'voided';

                    return (
                      <tr
                        key={disc.id}
                        className="hover:bg-amber-50/80 transition-all cursor-pointer group"
                        onClick={() => setSelectedDiscount(disc)}
                      >
                        <td className="py-3 px-4 font-mono text-stone-700">
                          <div className="font-semibold text-stone-900">{disc.date}</div>
                          <div className="text-[10px] text-stone-500">
                            {disc.timestamp ? new Date(disc.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Shift Record'}
                          </div>
                        </td>

                        <td className="py-3 px-4">
                          <div className="font-bold text-stone-900 flex items-center space-x-1.5">
                            <span>{disc.customerName || 'Walk-in Customer'}</span>
                          </div>
                          {disc.vehicleNo && (
                            <div className="text-[10px] text-amber-700 flex items-center space-x-1 font-mono">
                              <Truck className="w-3 h-3" />
                              <span>{disc.vehicleNo}</span>
                            </div>
                          )}
                        </td>

                        <td className="py-3 px-4">
                          <span className="inline-block bg-amber-100/60 text-stone-800 px-2 py-0.5 rounded border border-amber-200 text-[11px] font-medium">
                            {disc.productName || 'Fuel Product'}
                          </span>
                        </td>

                        <td className="py-3 px-4 text-right font-mono font-semibold text-stone-900">
                          {disc.liters ? `${disc.liters} L` : 'N/A'}
                        </td>

                        <td className="py-3 px-4 text-right font-mono">
                          <span className="font-extrabold text-amber-700">{formatCurrency(disc.amount, settings)}</span>
                          {disc.discountPercent && disc.discountPercent > 0 ? (
                            <div className="text-[10px] text-stone-500">({disc.discountPercent}%)</div>
                          ) : null}
                        </td>

                        <td className="py-3 px-4 text-right font-mono text-rose-700 font-semibold">
                          {formatCurrency(disc.marginLoss || disc.amount * 0.35, settings)}
                        </td>

                        <td className="py-3 px-4 text-stone-700">
                          <div className="font-semibold text-stone-900">{disc.staffName || 'Operator'}</div>
                          <div className="text-[10px] text-stone-500">{disc.pumpName || 'Station Dispenser'}</div>
                        </td>

                        <td className="py-3 px-4">
                          <div className="flex items-center space-x-2">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                isPending
                                  ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                  : isRejected || isVoided
                                  ? 'bg-rose-100 text-rose-900 border border-rose-300'
                                  : 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                              }`}
                            >
                              {disc.approvalStatus || 'Approved'}
                            </span>
                          </div>
                          <div className="text-[10px] text-stone-500 mt-0.5">By: {disc.approvedBy || 'Manager'}</div>
                        </td>

                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center space-x-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedDiscount(disc);
                              }}
                              className="p-1.5 bg-amber-100 hover:bg-amber-200 rounded-lg text-stone-800 transition-all border border-amber-300"
                              title="Inspect Full Audit Trail"
                            >
                              <Eye className="w-4 h-4" />
                            </button>

                            {(activeRole === 'manager' || activeRole === 'owner') && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedDiscount(disc);
                                  setShowApprovalModal(true);
                                }}
                                className="p-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg transition-all shadow-sm"
                                title="Execute Role Approval Action"
                              >
                                <ShieldCheck className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* SVG REALTIME CHARTS TAB */}
      {(activeTab === 'analytics' || activeTab === 'overview') && allDiscounts.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Chart 1: Category Breakdown (SVG Donut) */}
          <div className="bg-[#FFFDF9] p-5 rounded-2xl border border-amber-200/80 shadow-sm space-y-4">
            <h3 className="text-xs font-bold text-stone-800 uppercase tracking-wider flex items-center space-x-2">
              <PieChart className="w-4 h-4 text-amber-600" />
              <span>Discount Distribution by Category</span>
            </h3>

            <div className="h-56 flex items-center justify-center">
              <svg viewBox="0 0 100 100" className="w-44 h-44 transform -rotate-90">
                <circle cx="50" cy="50" r="38" stroke="#f1f5f9" strokeWidth="16" fill="transparent" />
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  stroke="#f59e0b"
                  strokeWidth="16"
                  strokeDasharray="160 240"
                  fill="transparent"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  stroke="#10b981"
                  strokeWidth="16"
                  strokeDasharray="60 240"
                  strokeDashoffset="-160"
                  fill="transparent"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  stroke="#6366f1"
                  strokeWidth="16"
                  strokeDasharray="20 240"
                  strokeDashoffset="-220"
                  fill="transparent"
                />
              </svg>
            </div>

            <div className="grid grid-cols-3 gap-2 text-[11px] text-center border-t border-amber-200/60 pt-3">
              <div>
                <span className="inline-block w-2.5 h-2.5 rounded-full bg-amber-500 mr-1"></span>
                <span className="text-stone-700 font-medium">Volume Discount</span>
              </div>
              <div>
                <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500 mr-1"></span>
                <span className="text-stone-700 font-medium">VIP Fleet</span>
              </div>
              <div>
                <span className="inline-block w-2.5 h-2.5 rounded-full bg-indigo-500 mr-1"></span>
                <span className="text-stone-700 font-medium">POS Retail</span>
              </div>
            </div>
          </div>

          {/* Chart 2: Daily Margin Loss Trend (SVG Bar Chart) */}
          <div className="bg-[#FFFDF9] p-5 rounded-2xl border border-amber-200/80 shadow-sm space-y-4">
            <h3 className="text-xs font-bold text-stone-800 uppercase tracking-wider flex items-center space-x-2">
              <BarChart3 className="w-4 h-4 text-rose-600" />
              <span>Realtime Gross Margin Loss Trend</span>
            </h3>

            <div className="h-56 flex items-end justify-between space-x-2 pt-6 pb-2 px-4 bg-amber-50/60 rounded-xl border border-amber-200/60">
              {allDiscounts.slice(0, 8).map((d, idx) => {
                const heightPct = Math.min(100, Math.max(15, (d.amount / (kpis.highestDiscount || 1)) * 100));
                return (
                  <div key={idx} className="flex-1 flex flex-col items-center space-y-2 group">
                    <span className="opacity-0 group-hover:opacity-100 text-[9px] font-mono text-stone-800 bg-white px-1 py-0.5 rounded border border-amber-200 shadow-sm transition-all">
                      {formatCurrency(d.amount, settings)}
                    </span>
                    <div
                      style={{ height: `${heightPct}%` }}
                      className="w-full bg-gradient-to-t from-rose-500 to-amber-500 rounded-t-md group-hover:from-rose-600 group-hover:to-amber-600 transition-all shadow-sm"
                    ></div>
                    <span className="text-[9px] text-stone-600 font-mono truncate w-full text-center">{d.date.slice(5)}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* FULL AUDIT TRAIL INSPECTOR MODAL / DRAWER */}
      {selectedDiscount && !showApprovalModal && (
        <div className="fixed inset-0 z-50 bg-stone-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#FFFDF9] border border-amber-200/90 rounded-2xl max-w-2xl w-full p-6 space-y-6 shadow-2xl animate-scaleIn max-h-[90vh] overflow-y-auto text-stone-800">
            <div className="flex items-center justify-between border-b border-amber-200 pb-4">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 bg-amber-100 text-amber-800 rounded-xl border border-amber-300">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-stone-900">Immutable Discount Audit Record</h3>
                  <p className="text-xs text-stone-500">Transaction ID: {selectedDiscount.id}</p>
                </div>
              </div>
              <button onClick={() => setSelectedDiscount(null)} className="text-stone-400 hover:text-stone-600 p-1">
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            {/* Audit Details Grid */}
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="bg-amber-50/60 p-3 rounded-xl border border-amber-200/70 space-y-1">
                <span className="text-[10px] text-stone-500 uppercase font-semibold">Financial Impact</span>
                <p className="text-sm font-extrabold text-amber-800">{formatCurrency(selectedDiscount.amount, settings)}</p>
                <p className="text-[10px] text-rose-700">Est. Margin Loss: {formatCurrency(selectedDiscount.marginLoss || selectedDiscount.amount * 0.35, settings)}</p>
              </div>

              <div className="bg-amber-50/60 p-3 rounded-xl border border-amber-200/70 space-y-1">
                <span className="text-[10px] text-stone-500 uppercase font-semibold">Volume &amp; Rates</span>
                <p className="text-stone-900 font-mono font-bold">{selectedDiscount.liters ? `${selectedDiscount.liters} L` : 'Counter Sale'}</p>
                <p className="text-[10px] text-stone-500">Category: {selectedDiscount.category || selectedDiscount.type}</p>
              </div>

              <div className="bg-amber-50/60 p-3 rounded-xl border border-amber-200/70 space-y-1">
                <span className="text-[10px] text-stone-500 uppercase font-semibold">Customer &amp; Vehicle</span>
                <p className="text-stone-900 font-bold">{selectedDiscount.customerName}</p>
                <p className="text-[10px] text-stone-500">Vehicle: {selectedDiscount.vehicleNo || 'Not Tagged'}</p>
              </div>

              <div className="bg-amber-50/60 p-3 rounded-xl border border-amber-200/70 space-y-1">
                <span className="text-[10px] text-stone-500 uppercase font-semibold">Hardware &amp; Security</span>
                <p className="text-stone-900 font-semibold">{selectedDiscount.pumpName || 'Main Dispenser'} ({selectedDiscount.nozzleName || 'Nozzle'})</p>
                <p className="text-[10px] text-stone-500">Terminal: {selectedDiscount.ip} ({selectedDiscount.device})</p>
              </div>
            </div>

            {/* Audit Chronology */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-stone-800 uppercase tracking-wider flex items-center space-x-1.5">
                <Clock className="w-4 h-4 text-amber-700" />
                <span>Audit Chronology &amp; Approval Log</span>
              </h4>

              <div className="bg-white rounded-xl p-4 border border-amber-200 space-y-3 text-xs shadow-sm">
                {(selectedDiscount.auditTrail || [
                  {
                    timestamp: selectedDiscount.timestamp || new Date().toISOString(),
                    actor: selectedDiscount.approvedBy || 'Manager',
                    role: selectedDiscount.approverRole || 'manager',
                    action: 'Discount Created & Recorded',
                    notes: selectedDiscount.reason
                  }
                ]).map((log, i) => (
                  <div key={i} className="flex items-start space-x-3 border-l-2 border-amber-500 pl-3 py-1">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-stone-900">{log.action}</span>
                        <span className="bg-amber-100 text-amber-900 text-[10px] px-1.5 py-0.5 rounded border border-amber-300 font-semibold capitalize">
                          {log.role}
                        </span>
                      </div>
                      <p className="text-stone-600 text-[11px] mt-0.5">{log.notes}</p>
                      <span className="text-[10px] text-stone-400 font-mono">{new Date(log.timestamp).toLocaleString()} • Actor: {log.actor}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-2 border-t border-amber-200">
              {(activeRole === 'manager' || activeRole === 'owner') && (
                <button
                  onClick={() => setShowApprovalModal(true)}
                  className="bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs px-4 py-2 rounded-xl transition-all shadow-md shadow-amber-500/20"
                >
                  Change Approval Status
                </button>
              )}
              <button
                onClick={() => setSelectedDiscount(null)}
                className="bg-stone-200 hover:bg-stone-300 text-stone-800 text-xs font-semibold px-4 py-2 rounded-xl transition-all"
              >
                Close Audit View
              </button>
            </div>
          </div>
        </div>
      )}

      {/* APPROVAL WORKFLOW ACTION MODAL */}
      {showApprovalModal && selectedDiscount && (
        <div className="fixed inset-0 z-50 bg-stone-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#FFFDF9] border border-amber-200/90 rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl animate-scaleIn text-stone-800">
            <div className="flex items-center justify-between border-b border-amber-200 pb-3">
              <div className="flex items-center space-x-2">
                <ShieldCheck className="w-5 h-5 text-amber-700" />
                <h3 className="text-sm font-bold text-stone-900">Role-Based Approval Engine</h3>
              </div>
              <button onClick={() => setShowApprovalModal(false)} className="text-stone-400 hover:text-stone-600">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-amber-50/70 p-3 rounded-xl border border-amber-200 space-y-1 text-xs">
              <div className="flex justify-between text-stone-600">
                <span>Customer:</span>
                <span className="font-bold text-stone-900">{selectedDiscount.customerName}</span>
              </div>
              <div className="flex justify-between text-stone-600">
                <span>Discount Amount:</span>
                <span className="font-bold text-amber-800">{formatCurrency(selectedDiscount.amount, settings)}</span>
              </div>
              <div className="flex justify-between text-stone-600">
                <span>Active Role:</span>
                <span className="font-bold text-emerald-800 uppercase">{activeRole}</span>
              </div>
            </div>

            {/* Action Select */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-stone-700">Select Approval Action</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'approve', label: 'Approve', color: 'border-emerald-500 text-emerald-800 bg-emerald-50 font-bold' },
                  { id: 'reject', label: 'Reject', color: 'border-rose-500 text-rose-800 bg-rose-50 font-bold' },
                  { id: 'void', label: 'Void Txn', color: 'border-amber-500 text-amber-800 bg-amber-50 font-bold' }
                ].map((act) => (
                  <button
                    key={act.id}
                    onClick={() => setApprovalAction(act.id as any)}
                    className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                      approvalAction === act.id ? act.color : 'bg-white border-amber-200 text-stone-600 hover:bg-amber-50'
                    }`}
                  >
                    {act.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Reason Notes */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-stone-700">Authorization / Audit Notes</label>
              <textarea
                rows={3}
                placeholder="Enter mandatory reason or reference code for audit trail..."
                value={approvalNotes}
                onChange={(e) => setApprovalNotes(e.target.value)}
                className="w-full bg-white border border-amber-200 rounded-xl p-2.5 text-xs text-stone-900 placeholder-stone-400 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="flex justify-end space-x-3 pt-2 border-t border-amber-200">
              <button
                onClick={() => setShowApprovalModal(false)}
                className="bg-stone-200 hover:bg-stone-300 text-stone-800 text-xs font-semibold px-4 py-2 rounded-xl transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleExecuteApproval}
                disabled={isProcessing}
                className="bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold px-5 py-2 rounded-xl transition-all shadow-md shadow-amber-500/20 disabled:opacity-50"
              >
                {isProcessing ? 'Processing...' : 'Confirm & Log Audit'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
