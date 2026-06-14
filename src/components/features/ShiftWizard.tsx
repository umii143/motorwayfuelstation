/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from "react";
import { useShallow } from 'zustand/react/shallow';
import { motion, AnimatePresence } from "motion/react";
import { format } from "date-fns";
import { v4 as uuidv4 } from "uuid";
import { useNativeAuth } from '../../contexts/NativeAuthContext';
import {
  Play,
  RotateCcw,
  CheckCircle,
  AlertCircle,
  Plus,
  Trash2,
  Calendar,
  Clock,
  User,
  Activity,
  ArrowRight,
  TrendingUp,
  FileText,
  Share2,
  Check,
  Building,
  ChevronRight,
  Coins,
  Sparkles,
  BarChart2,
  Flame,
  TrendingDown,
  Zap
} from "lucide-react";
import {
  Staff,
  Product,
  Nozzle,
  Pump,
  Customer,
  Supplier,
  Shift,
  BankAccount,
  DebitEntry,
  RecoveryEntry,
  ExpenseEntry,
  BankCashEntry,
  DigitalCashEntry,
  LubeSale,
  SupplierPayment,
  EXPENSE_CATEGORIES,
  GlobalSettings,
} from "../../types";
import ExpenseEntryTab from "./ShiftWizard/ExpenseEntryTab";
import { OpeningReadingsForm, ClosingReadingsForm } from "./ShiftWizard/PumpReadingsForms";
import { ShiftWastage } from "./ShiftWizard/ShiftWastage";
import { ShiftDebtors } from "./ShiftWizard/ShiftDebtors";
import { ShiftNozzleReadings } from "./ShiftWizard/ShiftNozzleReadings";
import { db } from "../../data/db";
import { fetchWithAuth } from "../../lib/api";
import { useStation } from "../../contexts/StationContext";
import AIDocumentScanner from "../ui/AIDocumentScanner";
import { deductFIFO, FIFOResult } from "../../services/fifoEngine";
import { useInventoryStore } from "../../stores/useInventoryStore";
import {
  processCreditSale, processRecovery, processExpense,
  processBankDeposit, processDigitalPayment, processSupplierPayment,
  processDiscount, processLubeSale, processReversal,
  processShiftOpen, processShiftClose as eocShiftClose,
} from "../../services/core/operationalCore";

// Helper to classify fuel product IDs into hardcoded categories expected by the shift closeout logic
const getFuelCategory = (productId: string, products: Product[]): "petrol" | "diesel" | "cng" | null => {
  const p = products.find((prod) => prod.id === productId);
  if (!p) return null;
  if (p.type !== "fuel") return null;

  const idLower = p.id.toLowerCase();
  const nameLower = p.name.toLowerCase();

  if (
    idLower === "petrol" ||
    idLower === "prod_f1" ||
    idLower === "prod_f3" ||
    nameLower.includes("petrol") ||
    nameLower.includes("pmg") ||
    nameLower.includes("hobc") ||
    nameLower.includes("octane") ||
    nameLower.includes("super")
  ) {
    return "petrol";
  }
  if (
    idLower === "diesel" ||
    idLower === "prod_f2" ||
    nameLower.includes("diesel") ||
    nameLower.includes("hsd")
  ) {
    return "diesel";
  }
  if (
    idLower === "cng" ||
    nameLower.includes("cng") ||
    nameLower.includes("gas")
  ) {
    return "cng";
  }
  return null;
};

interface ShiftWizardProps {
  activeStationId: string;
  settings: GlobalSettings;
  staff: Staff[];
  products: Product[];
  pumps: Pump[];
  nozzles: Nozzle[];
  customers: Customer[];
  suppliers: Supplier[];
  banks: BankAccount[];
  shifts: Shift[];
  onAddShift: (shift: Shift) => void;
  onUpdateShift: (shift: Shift) => void;
  onNavigateToView: (view: string) => void;
  onAddCustomer?: (customer: Customer) => void;
  onAddSupplier?: (supplier: Supplier) => void;
  onAddBank?: (bank: BankAccount) => void;
  onAddShiftSalaryPayment?: (
    staffId: string,
    amount: number,
    note: string,
    paidFrom: "cash" | "bank",
    date: string,
    expenseId: string,
  ) => void;
  onDeleteShiftSalaryPayment?: (expenseId: string) => void;
  onNavigate?: (viewId: string) => void;
}

export default function ShiftWizard({
  activeStationId,
  settings,
  staff,
  products,
  pumps,
  nozzles,
  customers,
  suppliers,
  banks,
  shifts,
  onAddShift,
  onUpdateShift,
  onNavigateToView,
  onAddCustomer,
  onAddSupplier,
  onAddBank,
  onAddShiftSalaryPayment,
  onDeleteShiftSalaryPayment,
  onNavigate,
}: ShiftWizardProps) {
  const { showToast, showConfirm, showAlert, tanks } = useStation();
  const { requireBiometric } = useNativeAuth();
  const isUrdu = settings.language === "ur";
  const t = (en: string, ur: string) => (isUrdu ? ur : en);

  // Active running shift checks
  const activeShift = useMemo(() => {
    return shifts.find((s) => s.status === "active");
  }, [shifts]);

  // Calculate effective customer balances including current active shift entries
  const effectiveCustomers = useMemo(() => {
    return customers.map((c) => {
      let activeBal = c.balance || 0;
      if (activeShift) {
        activeShift.debitEntries.forEach((d) => {
          if (d.customerId === c.id) activeBal += d.amount;
        });
        activeShift.recoveryEntries.forEach((r) => {
          if (r.customerId === c.id) activeBal -= r.amount;
        });
      }
      return { ...c, effectiveBalance: activeBal };
    });
  }, [customers, activeShift]);
  const isLubeBusiness = useMemo(
    () =>
      products.some((p) => p.type === "lube") &&
      !products.some((p) => p.type === "fuel"),
    [products],
  );
  const defaultProductId = products[0]?.id || "general_debit";

  // AI Scanner States
  const [isOpeningScannerOpen, setIsOpeningScannerOpen] = useState(false);
  const [isClosingScannerOpen, setIsClosingScannerOpen] = useState(false);

  const handleOpeningAutoFill = (data: any) => {
    const newOpenings = { ...openingReadings };
    for (const noz of nozzles) {
      const match = data[noz.name] || data[`Nozzle ${noz.name}`] || data[noz.name.replace(/ /g, '')];
      if (match) {
        newOpenings[noz.id] = Number(String(match).replace(/[^0-9.]/g, ''));
      }
    }
    setOpeningReadings(newOpenings);
    setTimeout(() => {
      setIsOpeningScannerOpen(false);
      showToast('Opening readings auto-filled!', 'success');
    }, 1500);
  };

  const handleClosingAutoFill = (data: any) => {
    const newClosings = { ...closingReadings };
    for (const noz of nozzles) {
      const match = data[noz.name] || data[`Nozzle ${noz.name}`] || data[noz.name.replace(/ /g, '')];
      if (match) {
        newClosings[noz.id] = Number(String(match).replace(/[^0-9.]/g, ''));
      }
    }
    setClosingReadings(newClosings);
    setTimeout(() => {
      setIsClosingScannerOpen(false);
      showToast('Closing readings auto-filled!', 'success');
    }, 1500);
  };

  // Wizard flow steps:
  // 1: Setup, 2: Opening Readings, 3: Active Shift Home, 4: Closing Readings, 5: Test Liters, 6: expected Cash matching, 7: Final Summary Receipt
  const [wizardStep, setWizardStep] = useState<number>(() => {
    if (activeShift) return 3; // Jump directly to active operational drawer if outstanding active shift is found
    return 1;
  });

  // ==========================================
  // STEP 1 FORM STATE: SETUP
  // ==========================================
  const [selectedStaffId, setSelectedStaffId] = useState("");
  const [shiftType, setShiftType] = useState<"day" | "night">("day");
  const [shiftDate, setShiftDate] = useState(
    () => new Date().toISOString().split("T")[0],
  );
  const [shiftTime, setShiftTime] = useState(() => {
    const d = new Date();
    return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  });

  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [isGeneratingAiSummary, setIsGeneratingAiSummary] = useState(false);

  // ==========================================
  // STEP 2 FORM STATE: OPENING READINGS
  // ==========================================
  // Pre-load reference from previous closed shift readings (fall back to settings/arbitrary seeds)
  const previousClosingReadings = useMemo(() => {
    const closed = shifts
      .filter((s) => s.status === "closed")
      .sort((a, b) => b.date.localeCompare(a.date));
    if (closed.length > 0) {
      return closed[0].closingReadings;
    }
    // Seeds
    return {
      n_1: 125950,
      n_2: 98380,
      n_3: 45780,
      n_4: 33450,
      n_5: 8535,
      n_6: 51220,
    };
  }, [shifts]);

  const [openingReadings, setOpeningReadings] = useState<Record<string, number>>({});

  // ==========================================
  // STEP 3 OPERATIONAL TABS DRAWERS
  // ==========================================
  const [activeTab, setActiveTab] = useState<
    "debit" | "recovery" | "expense" | "bank" | "digital" | "lube" | "supplier" | "discount" | "rateChange"
  >(() => (isLubeBusiness ? "lube" : "debit"));
  // Quick Add forms state
  const [showQuickCustomer, setShowQuickCustomer] = useState(false);
  const [quickCustomerName, setQuickCustomerName] = useState("");

  const [showQuickSupplier, setShowQuickSupplier] = useState(false);
  const [quickSupplierName, setQuickSupplierName] = useState("");

  const [showQuickBank, setShowQuickBank] = useState(false);
  const [quickBankName, setQuickBankName] = useState("");
  const [quickBankAccNo, setQuickBankAccNo] = useState("");

  // Multi-Form Inputs Inside Step 3
  // Tab 1: Credit Sale (Debit)
  const [debCustId, setDebCustId] = useState("");
  const [debProdId, setDebProdId] = useState(defaultProductId);
  const [debQty, setDebQty] = useState("");
  const [debNote, setDebNote] = useState("");

  // Tab 2: Recovery Collection
  const [recCustId, setRecCustId] = useState("");
  const [recAmount, setRecAmount] = useState("");
  const [recMode, setRecMode] = useState<"cash" | "cheque" | "transfer">(
    "cash",
  );
  const [recRef, setRecRef] = useState("");

  // Tab 3: Shift Operational Expenses
  const [expCategory, setExpCategory] = useState("meals");
  const [expAmount, setExpAmount] = useState("");
  const [expDesc, setExpDesc] = useState("");
  const [expPaidFrom, setExpPaidFrom] = useState<"cash" | "bank">("cash");
  const [expStaffId, setExpStaffId] = useState("");

  // Tab 4: Bank Cash
  const [bankAcctId, setBankAcctId] = useState("");
  const [bankAmount, setBankAmount] = useState("");
  const [bankRef, setBankRef] = useState("");
  const [bankCustId, setBankCustId] = useState("");

  // Tab 5: Electronic/Digital Cash
  const [digMethod, setDigMethod] = useState("EasyPaisa");
  const [digAmount, setDigAmount] = useState("");
  const [digRefId, setDigRefId] = useState("");
  const [digAccountHolder, setDigAccountHolder] = useState("");

  // Tab: Discounts
  const [discAmount, setDiscAmount] = useState("");
  const [discType, setDiscType] = useState("Percentage");
  const [discReason, setDiscReason] = useState("");
  const [discCustomer, setDiscCustomer] = useState("");
  const [discProduct, setDiscProduct] = useState("");
  const [discApprovedBy, setDiscApprovedBy] = useState("");
  const [discNotes, setDiscNotes] = useState("");

  // Tab 6: Lubricant Sales
  const [lubeItemId, setLubeItemId] = useState("");
  const [lubeQty, setLubeQty] = useState("");

  // Tab 7: Wholesale Depot Payments
  const [supId, setSupId] = useState("");
  const [supAmount, setSupAmount] = useState("");
  const [supMode, setSupMode] = useState<"cash" | "cheque" | "transfer">(
    "cash",
  );
  const [supBankAcct, setSupBankAcct] = useState("");
  const [supRef, setSupRef] = useState("");

  // ==========================================
  // STEP 4 FORM STATE: CLOSING READINGS
  // ==========================================
  const [closingReadings, setClosingReadings] = useState<Record<string, number>>({});

  // ==========================================
  // STEP 5 FORM STATE: TESTING / DEDUCTIONS
  // ==========================================
  const [testPetrol, setTestPetrol] = useState("0");
  const [testDiesel, setTestDiesel] = useState("0");
  const [testCNG, setTestCNG] = useState("0");

  // Mid-Shift Price Revision Snapshot State
  const [snapshotReadings, setSnapshotReadings] = useState<{ [nozzleId: string]: string }>({});
  const [snapshotPin, setSnapshotPin] = useState("");
  const [snapshotOverride, setSnapshotOverride] = useState(false);

  // ==========================================
  // STEP 6 FORM STATE: FINAL CASH CALCULATION
  // ==========================================
  const [submittedCash, setSubmittedCash] = useState("");

  // ==========================================
  // FIFO DEDUCTION STATE
  // ==========================================
  const [fifoResults, setFifoResults] = useState<{ productId: string; productName: string; result: FIFOResult }[]>([]);
  const [fifoLoading, setFifoLoading] = useState(false);
  const { stockBatches, supplierClaims: supplierClaimsStore } = useInventoryStore(useShallow(state => ({
    stockBatches: state.stockBatches,
    supplierClaims: state.supplierClaims
  })));

  // ==========================================
  // VALIDATORS / ALERT FLAGS
  // ==========================================
  const [wizardError, setWizardError] = useState("");

  useEffect(() => {
    setActiveTab(isLubeBusiness ? "lube" : "debit");
  }, [isLubeBusiness, activeStationId]);

  useEffect(() => {
    if (debProdId === "general_debit") {
      return;
    }
    if (!products.some((product) => product.id === debProdId)) {
      setDebProdId(defaultProductId);
    }
  }, [debProdId, defaultProductId, products]);

  // Safeguard: Ensure wizardStep is always aligned with activeShift state
  useEffect(() => {
    if (activeShift && wizardStep < 3) {
      // If an active shift exists, user MUST be at least on step 3 (Operational Dashboard)
      setWizardStep(3);
    } else if (!activeShift && wizardStep >= 3) {
      // If no active shift exists, but user is stranded on operational steps, throw back to start
      setWizardStep(1);
    }
  }, [activeShift, wizardStep]);

  // ==========================================
  // DYNAMIC COMPUTATIONS & LOOKUPS
  // ==========================================
  const activeStaffMember = useMemo(() => {
    if (!activeShift) return null;
    return staff.find((st) => st.id === activeShift.staffId);
  }, [activeShift, staff]);

  // Fuel Rates Mapping
  const fuelRates = useMemo(() => {
    const getRate = (cat: "petrol" | "diesel" | "cng", fallback: number) => {
      const prod = products.find((p) => getFuelCategory(p.id, products) === cat);
      return prod ? prod.rate : fallback;
    };
    return {
      petrol: getRate("petrol", 275.5),
      diesel: getRate("diesel", 284.1),
      cng: getRate("cng", 210.0),
    };
  }, [products]);

  // Expected cash calculations based on active settings & transactions
  const expectedTotals = useMemo(() => {
    if (!activeShift) return null;

    // 1. Calculate Fuel Gross Sales from nozzle readings considering Segments
    let petLitersAccum = 0;
    let dieLitersAccum = 0;
    let cngKgsAccum = 0;
    let petrolSalesSum = 0;
    let dieselSalesSum = 0;
    let cngSalesSum = 0;

    nozzles.forEach((nz) => {
      const open = activeShift.openingReadings[nz.id] || 0;
      const close = Number(closingReadings[nz.id] || activeShift.closingReadings[nz.id] || open);
      
      const cat = getFuelCategory(nz.productId, products);
      const currentRate = cat === 'petrol' ? fuelRates.petrol : cat === 'diesel' ? fuelRates.diesel : fuelRates.cng;

      // Find segments for this nozzle
      const nzSegments = (activeShift.segments || []).filter(s => s.nozzleId === nz.id);
      
      let nozzleLiters = 0;
      let nozzleRevenue = 0;

      if (nzSegments.length > 0) {
        // Sum from segments
        nzSegments.forEach(seg => {
          nozzleLiters += seg.litersSold;
          nozzleRevenue += seg.revenue;
        });
        
        // Add remaining from last segment close
        const lastMeterClose = nzSegments[nzSegments.length - 1].meterClose;
        const remainingLiters = Math.max(0, close - lastMeterClose);
        nozzleLiters += remainingLiters;
        nozzleRevenue += remainingLiters * currentRate;
      } else {
        // Normal (No price change)
        nozzleLiters = Math.max(0, close - open);
        nozzleRevenue = nozzleLiters * currentRate;
      }

      if (cat === "petrol") {
        petLitersAccum += nozzleLiters;
        petrolSalesSum += nozzleRevenue;
      } else if (cat === "diesel") {
        dieLitersAccum += nozzleLiters;
        dieselSalesSum += nozzleRevenue;
      } else if (cat === "cng") {
        cngKgsAccum += nozzleLiters;
        cngSalesSum += nozzleRevenue;
      }
    });

    // Deduct test liters at current rate
    const petTestLiters = Number(testPetrol || activeShift.testLiters?.petrol || 0);
    const dieTestLiters = Number(testDiesel || activeShift.testLiters?.diesel || 0);
    const cngTestLiters = Number(testCNG || activeShift.testLiters?.cng || 0);

    const petSaleLiters = Math.max(0, petLitersAccum - petTestLiters);
    petrolSalesSum = Math.max(0, petrolSalesSum - (petTestLiters * fuelRates.petrol));

    const dieSaleLiters = Math.max(0, dieLitersAccum - dieTestLiters);
    dieselSalesSum = Math.max(0, dieselSalesSum - (dieTestLiters * fuelRates.diesel));

    const cngSaleKgs = Math.max(0, cngKgsAccum - cngTestLiters);
    cngSalesSum = Math.max(0, cngSalesSum - (cngTestLiters * fuelRates.cng));

    // Lubricants Gross Sum
    const lubeSalesSum = activeShift.lubeSales.reduce(
      (acc, l) => acc + l.amount,
      0,
    );

    const grossSalesSum =
      petrolSalesSum + dieselSalesSum + cngSalesSum + lubeSalesSum;

    // Recovery, Debit, expense, bank cash lists summing
    const totalDebits = activeShift.debitEntries.reduce(
      (acc, d) => acc + d.amount,
      0,
    );
    const totalRecoveries = activeShift.recoveryEntries.reduce(
      (acc, r) => acc + r.amount,
      0,
    );
    const totalExpenses = activeShift.expenseEntries.reduce(
      (acc, e) => acc + e.amount,
      0,
    );
    const totalSupplierPayments = activeShift.supplierPayments.reduce(
      (acc, sp) => acc + sp.amount,
      0,
    );
    const totalBankCash = activeShift.bankCashEntries.reduce(
      (acc, bc) => acc + bc.amount,
      0,
    );
    const totalDigitalCash = activeShift.digitalCashEntries.reduce(
      (acc, dg) => acc + dg.amount,
      0,
    );
    const totalDiscounts = (activeShift.discountEntries || []).reduce(
      (acc, d) => acc + d.amount,
      0,
    );

    // FORMULATION
    // EXPECTED CASH = Sales + LubeCash + CashRecoveries - CreditSales - ExpensesPaidInCash - SupplierPaymentsPaidInCash - BankDeposits - DigitalPayments - Discounts
    // To represent cash on hand before submitting:
    const expectedCashAmount = Math.max(
      0,
      grossSalesSum +
        totalRecoveries -
        totalDebits -
        totalExpenses -
        totalSupplierPayments -
        totalBankCash -
        totalDigitalCash -
        totalDiscounts,
    );

    return {
      petrolLiters: petSaleLiters,
      petrolSales: petrolSalesSum,
      dieselLiters: dieSaleLiters,
      dieselSales: dieselSalesSum,
      cngKgs: cngSaleKgs,
      cngSales: cngSalesSum,
      lubeSales: lubeSalesSum,
      grossSales: grossSalesSum,
      debits: totalDebits,
      recoveries: totalRecoveries,
      expenses: totalExpenses,
      supplierPmts: totalSupplierPayments,
      bank: totalBankCash,
      digital: totalDigitalCash,
      discounts: totalDiscounts,
      expectedCash: expectedCashAmount,
    };
  }, [
    activeShift,
    closingReadings,
    testPetrol,
    testDiesel,
    testCNG,
    fuelRates,
    nozzles,
  ]);

  // ==========================================
  // ACTIONS / TRANSITIONS
  // ==========================================

  const buildNewShift = (openingSnapshot: { [nozzleId: string]: number }): Shift => ({
    id: `sh_${Date.now()}`,
    staffId: selectedStaffId,
    type: shiftType,
    date: shiftDate,
    startTime: shiftTime,
    status: "active",
    openingReadings: openingSnapshot,
    closingReadings: {},
    testLiters: {},
    debitEntries: [],
    recoveryEntries: [],
    expenseEntries: [],
    bankCashEntries: [],
    digitalCashEntries: [],
    discountEntries: [],
    lubeSales: [],
    supplierPayments: [],
    expectedCash: 0,
    submittedCash: 0,
    shortage: 0,
    overage: 0,
  });

  // Step 1 Trigger -> Save salesman, initialize shift structure
  const handleStartShift = () => {
    if (!selectedStaffId) {
      setWizardError(
        t("Please select a staff member.", "براہ کرم عملے کا ممبر منتخب کریں۔"),
      );
      return;
    }
    setWizardError("");

    // Validate tank stock (block opening shift if any nozzle's tank stock is <= 0)
    let lowStockNozzle = null;
    for (const noz of nozzles) {
      if (noz.tankId) {
        const tank = tanks.find(t => t.id === noz.tankId);
        if (tank && tank.currentStock <= 0) {
          lowStockNozzle = { noz, tank };
          break;
        }
      }
    }
    if (lowStockNozzle) {
      setWizardError(
        t(
          `Cannot open shift. Tank "${lowStockNozzle.tank.name}" connected to nozzle "${lowStockNozzle.noz.name}" has 0 or negative available stock.`,
          `شفٹ شروع نہیں کی جا سکتی۔ نوزل "${lowStockNozzle.noz.name}" سے منسلک ٹینک "${lowStockNozzle.tank.name}" میں ایندھن کا اسٹاک 0 یا اس سے کم ہے۔`
        )
      );
      return;
    }

    if (isLubeBusiness) {
      onAddShift(buildNewShift({}));
      setWizardStep(3);
      return;
    }

    // Fill in standard openings inside localized state variables
    const initialOpenings: { [nozzleId: string]: number } = {};
    nozzles.forEach((noz) => {
      // Map reference values
      const refVal =
        previousClosingReadings[
          noz.id as keyof typeof previousClosingReadings
        ] || noz.currentReading || noz.startReading || 0;
      initialOpenings[noz.id] = Number(refVal);
    });
    setOpeningReadings(initialOpenings);
    setWizardStep(2);
  };

  // Step 2 Trigger -> Commit openings, create shifts record
  const handleConfirmOpenings = () => {
    setWizardError("");

    // Validate tank stock (block opening shift if any nozzle's tank stock is <= 0)
    let lowStockNozzle = null;
    for (const noz of nozzles) {
      if (noz.tankId) {
        const tank = tanks.find(t => t.id === noz.tankId);
        if (tank && tank.currentStock <= 0) {
          lowStockNozzle = { noz, tank };
          break;
        }
      }
    }
    if (lowStockNozzle) {
      setWizardError(
        t(
          `Cannot open shift. Tank "${lowStockNozzle.tank.name}" connected to nozzle "${lowStockNozzle.noz.name}" has 0 or negative available stock.`,
          `شفٹ شروع نہیں کی جا سکتی۔ نوزل "${lowStockNozzle.noz.name}" سے منسلک ٹینک "${lowStockNozzle.tank.name}" میں ایندھن کا اسٹاک 0 یا اس سے کم ہے۔`
        )
      );
      return;
    }

    const openingNum: { [nozzleId: string]: number } = {};
    let hasError = false;

    for (const noz of nozzles) {
      const val = Number(openingReadings[noz.id] || 0);
      if (isNaN(val) || val < 0) {
        setWizardError(
          t(
            `Opening score for ${noz.name} is invalid.`,
            `${noz.name} کی داخل کردہ میٹر ریڈنگ درست نہیں ہے۔`,
          ),
        );
        hasError = true;
        break;
      }
      openingNum[noz.id] = val;
    }

    if (hasError) return;

    onAddShift(buildNewShift(openingNum));
    setWizardStep(3); // Enter operational tabs
  };

  // Step 3 Actions (Tab items additions & deletions with global sync cascades)
  const handleQuickAddCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickCustomerName || !onAddCustomer) return;
    const newCust: Customer = {
      id: `cus_${Date.now()}`,
      name: quickCustomerName,
      urduName: quickCustomerName,
      contact: "",
      address: "",
      creditLimit: 500000,
      balance: 0,
    };
    onAddCustomer(newCust);
    setQuickCustomerName("");
    setShowQuickCustomer(false);

    // Auto select in forms based on active tab
    if (activeTab === "debit") {
      setDebCustId(newCust.id);
    } else if (activeTab === "recovery") {
      setRecCustId(newCust.id);
    }
  };

  const handleQuickAddSupplier = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickSupplierName || !onAddSupplier) return;
    const newSup: Supplier = {
      id: `sup_${Date.now()}`,
      name: quickSupplierName,
      urduName: quickSupplierName,
      contact: "",
      accountNo: "",
      balance: 0,
    };
    onAddSupplier(newSup);
    setQuickSupplierName("");
    setShowQuickSupplier(false);

    if (activeTab === "supplier") {
      setSupId(newSup.id);
    }
  };

  const handleQuickAddBank = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickBankName || !quickBankAccNo || !onAddBank) return;
    const newBank: BankAccount = {
      id: `b_${Date.now()}`,
      name: quickBankName,
      accountNo: quickBankAccNo,
      balance: 0,
    };
    onAddBank(newBank);
    setQuickBankName("");
    setQuickBankAccNo("");
    setShowQuickBank(false);
    setBankAcctId(newBank.id);
  };

  const handleAddDebit = () => {
    if (!activeShift) return;
    if (!debCustId) {
      showToast(t("Please select a customer.", "براہ کرم گاہک کا انتخاب کریں۔"), "error");
      return;
    }
    const qty = Number(debQty);
    if (!qty || qty <= 0) {
      showToast(
        t("Please enter a valid quantity.", "براہ کرم درست تعداد درج کریں۔"),
        "error",
      );
      return;
    }

    const product = products.find((p) => p.id === debProdId);
    if (product) {
      if (product.type === "fuel") {
        const productTanks = tanks.filter((tk) => tk.productId === product.id);
        const totalTankStock = productTanks.reduce((sum, tk) => sum + tk.currentStock, 0);
        if (qty > totalTankStock) {
          showToast(
            t(
              `Insufficient tank stock. Available stock: ${totalTankStock} L. Requested: ${qty} L.`,
              `ٹینک میں اسٹاک کم ہے۔ دستیاب اسٹاک: ${totalTankStock} لیٹر۔ مطلوبہ: ${qty} لیٹر۔`
            ),
            "error"
          );
          return;
        }
      } else {
        if (qty > product.currentStock) {
          showToast(
            t(
              `Insufficient product inventory. Available stock: ${product.currentStock}. Requested: ${qty}.`,
              `پراڈکٹ کا اسٹاک کم ہے۔ دستیاب اسٹاک: ${product.currentStock}۔ مطلوبہ: ${qty}۔`
            ),
            "error"
          );
          return;
        }
      }
    }

    const isGeneralDebit = debProdId === "general_debit";
    const rate = isGeneralDebit
      ? 1
      : products.find((p) => p.id === debProdId)?.rate || 100;
    const amount = qty * rate;

    const customer = customers.find((c) => c.id === debCustId);
    const newDebit: DebitEntry = {
      id: `deb_${Date.now()}`,
      customerId: debCustId,
      productId: debProdId,
      quantity: qty,
      rate,
      amount,
      note: debNote,
    };

    // ── Optimistic UI update ──────────────────────────────────────────────────
    const updated = {
      ...activeShift,
      debitEntries: [...activeShift.debitEntries, newDebit],
    };
    onUpdateShift(updated);

    // ── EOC Pipeline (async, non-blocking) ────────────────────────────────────
    processCreditSale(
      activeShift.id, activeStationId, activeStationId,
      {
        customerId: debCustId,
        customerName: customer?.name ?? debCustId,
        productId: debProdId,
        productName: product?.name ?? debProdId,
        quantity: qty, rate, amount,
        note: debNote,
      },
      activeShift.date
    ).catch((err: Error) => console.warn('[EOC] Credit sale pipeline:', err.message));

    // Reset inputs
    setDebQty("");
    setDebNote("");
  };

  const handleDeleteDebit = (id: string) => {
    if (!activeShift) return;
    showConfirm(
      t("Reverse Entry", "اندراج کو پلٹائیں"),
      t(
        "This entry will be reversed (not deleted). A reversal journal entry will be posted to maintain the audit trail. Continue?",
        "یہ اندراج حذف نہیں ہوگا۔ ایک ریورسل جرنل انٹری پوسٹ کی جائے گی۔ جاری رکھیں؟"
      ),
      () => {
        // ── Optimistic UI update ──────────────────────────────────────────────
        const updated = {
          ...activeShift,
          debitEntries: activeShift.debitEntries.filter((d) => d.id !== id),
        };
        onUpdateShift(updated);
        // ── EOC Reversal Pipeline ─────────────────────────────────────────────
        processReversal(
          id, t("User reversed credit sale entry", "صارف نے کریڈٹ سیل اندراج پلٹایا"),
          activeShift.id, activeStationId, activeStationId, activeShift.date
        ).catch((err: Error) => console.warn('[EOC] Reversal pipeline:', err.message));
      }
    );
  };

  const handleAddRecovery = () => {
    if (!activeShift) return;
    if (!recCustId) {
      showToast(t("Please select a customer.", "براہ کرم گاہک کا انتخاب کریں۔"), "error");
      return;
    }
    const amount = Number(recAmount);
    if (!amount || amount <= 0) {
      showToast(t("Please enter a valid amount.", "براہ کرم درست رقم درج کریں۔"), "error");
      return;
    }

    const customer = customers.find((c) => c.id === recCustId);
    const newRec: RecoveryEntry = {
      id: `rec_${Date.now()}`,
      customerId: recCustId,
      amount,
      mode: recMode,
      reference: recRef,
    };

    // ── Optimistic UI update ──────────────────────────────────────────────────
    const updated = {
      ...activeShift,
      recoveryEntries: [...activeShift.recoveryEntries, newRec],
    };
    onUpdateShift(updated);

    // ── EOC Pipeline ─────────────────────────────────────────────────────────
    processRecovery(
      activeShift.id, activeStationId, activeStationId,
      {
        customerId: recCustId,
        customerName: customer?.name ?? recCustId,
        amount, mode: recMode, reference: recRef,
      },
      activeShift.date
    ).catch((err: Error) => console.warn('[EOC] Recovery pipeline:', err.message));

    // Reset inputs
    setRecAmount("");
    setRecRef("");
  };

  const handleDeleteRecovery = (id: string) => {
    if (!activeShift) return;
    showConfirm(
      t("Reverse Entry", "اندراج کو پلٹائیں"),
      t("This recovery will be reversed with an audit entry. Continue?", "یہ ریکوری ریورسل انٹری کے ساتھ پلٹائی جائے گی۔ جاری رکھیں؟"),
      () => {
        const updated = { ...activeShift, recoveryEntries: activeShift.recoveryEntries.filter((r) => r.id !== id) };
        onUpdateShift(updated);
        processReversal(id, t("User reversed recovery entry", "صارف نے ریکوری اندراج پلٹایا"), activeShift.id, activeStationId, activeStationId, activeShift.date)
          .catch((err: Error) => console.warn('[EOC] Recovery reversal:', err.message));
      }
    );
  };

  const handleAddExpense = () => {
    if (!activeShift) return;
    const amount = Number(expAmount);
    if (!amount || amount <= 0) {
      showToast(
        t("Please enter a valid expense amount.", "براہ کرم درست رقم درج کریں۔"),
        "error",
      );
      return;
    }

    if (expCategory === "salary" && !expStaffId) {
      showToast(
        t(
          "Please select a staff member for salary payment.",
          "براہ کرم تنخواہ کی ادائیگی کے لیے عملے کا ممبر منتخب کریں۔",
        ),
        "error",
      );
      return;
    }

    const staffMember = staff.find((st) => st.id === expStaffId);
    const personLabel = staffMember
      ? settings.language === "ur"
        ? staffMember.urduName
        : staffMember.name
      : "";
    const finalDesc =
      expDesc ||
      (expCategory === "salary" && staffMember
        ? `${t("Salary payout for", "تنخواہ کی ادائیگی برائے")} ${personLabel}`
        : expCategory.toUpperCase().replace("_", " "));

    const newExp: ExpenseEntry = {
      id: `exp_${Date.now()}`,
      category: expCategory,
      amount,
      description: finalDesc,
      date: activeShift.date,
      paidFrom: expPaidFrom,
      staffId: expCategory === "salary" ? expStaffId : undefined,
    };

    if (expCategory === "salary" && expStaffId && onAddShiftSalaryPayment) {
      onAddShiftSalaryPayment(
        expStaffId, amount, finalDesc, expPaidFrom, activeShift.date, newExp.id,
      );
    }

    // ── Optimistic UI update ──────────────────────────────────────────────────
    const updated = {
      ...activeShift,
      expenseEntries: [...activeShift.expenseEntries, newExp],
    };
    onUpdateShift(updated);

    // ── EOC Pipeline ─────────────────────────────────────────────────────────
    processExpense(
      activeShift.id, activeStationId, activeStationId,
      {
        category: expCategory, amount, description: finalDesc,
        paidFrom: expPaidFrom as any,
        staffId: expCategory === "salary" ? expStaffId : undefined,
      },
      activeShift.date
    ).catch((err: Error) => console.warn('[EOC] Expense pipeline:', err.message));

    // Reset inputs
    setExpAmount("");
    setExpDesc("");
    setExpStaffId("");
  };

  const handleDeleteExpense = (id: string) => {
    if (!activeShift) return;

    const expToDelete = activeShift.expenseEntries.find((e) => e.id === id);
    if (expToDelete?.category === "salary" && expToDelete.staffId && onDeleteShiftSalaryPayment) {
      onDeleteShiftSalaryPayment(id);
    }

    showConfirm(
      t("Reverse Entry", "اندراج کو پلٹائیں"),
      t("This expense will be reversed with an audit entry.", "یہ اخراجات ریورسل انٹری کے ساتھ پلٹائے جائیں گے۔"),
      () => {
        const updated = { ...activeShift, expenseEntries: activeShift.expenseEntries.filter((e) => e.id !== id) };
        onUpdateShift(updated);
        processReversal(id, t("User reversed expense entry", "صارف نے اخراجات اندراج پلٹایا"), activeShift.id, activeStationId, activeStationId, activeShift.date)
          .catch((err: Error) => console.warn('[EOC] Expense reversal:', err.message));
      }
    );
  };

  const handleAddBank = () => {
    if (!activeShift) return;
    if (!bankAcctId) {
      showToast(t("Please select a bank account.", "HBL/MCB اکاؤنٹ منتخب کریں۔"), "error");
      return;
    }
    const amount = Number(bankAmount);
    if (!amount || amount <= 0) {
      showToast(
        t("Please enter a valid deposit amount.", "براہ کرم درست رقم درج کریں۔"),
        "error",
      );
      return;
    }

    const bankAccount = banks.find((b) => b.id === bankAcctId);
    const newBank: BankCashEntry = {
      id: `bc_${Date.now()}`,
      bankAccountId: bankAcctId,
      amount,
      reference: bankRef,
      customerId: bankCustId || undefined,
    };

    // ── Optimistic UI update ──────────────────────────────────────────────────
    const updated = {
      ...activeShift,
      bankCashEntries: [...activeShift.bankCashEntries, newBank],
    };
    onUpdateShift(updated);

    // ── EOC Pipeline ─────────────────────────────────────────────────────────
    processBankDeposit(
      activeShift.id, activeStationId, activeStationId,
      { bankAccountId: bankAcctId, bankName: bankAccount?.name ?? bankAcctId, amount, reference: bankRef },
      activeShift.date
    ).catch((err: Error) => console.warn('[EOC] Bank deposit pipeline:', err.message));

    // Reset inputs
    setBankAmount("");
    setBankRef("");
    setBankCustId("");
  };

  const handleDeleteBank = (id: string) => {
    if (!activeShift) return;
    const updated = {
      ...activeShift,
      bankCashEntries: activeShift.bankCashEntries.filter((b) => b.id !== id),
    };
    onUpdateShift(updated);
  };

  const handleAddDigital = () => {
    if (!activeShift) return;
    const amount = Number(digAmount);
    if (!amount || amount <= 0) {
      showToast(t("Please enter a valid amount.", "براہ کرم درست رقم درج کریں۔"), "error");
      return;
    }

    const newDig: DigitalCashEntry = {
      id: `dg_${Date.now()}`,
      method: digMethod,
      amount,
      transactionId: digRefId,
      accountHolder: digAccountHolder,
    };

    // ── Optimistic UI update ──────────────────────────────────────────────────
    const updated = {
      ...activeShift,
      digitalCashEntries: [...activeShift.digitalCashEntries, newDig],
    };
    onUpdateShift(updated);

    // ── EOC Pipeline ─────────────────────────────────────────────────────────
    const methodKey = digMethod.toLowerCase().replace(/\s/g, '') as 'jazzcash' | 'easypaisa' | 'pos';
    processDigitalPayment(
      activeShift.id, activeStationId, activeStationId,
      { method: methodKey === 'jazzcash' ? 'jazzcash' : methodKey === 'pos' ? 'pos' : 'easypaisa', amount, transactionId: digRefId, accountHolder: digAccountHolder },
      activeShift.date
    ).catch((err: Error) => console.warn('[EOC] Digital payment pipeline:', err.message));

    // Reset inputs
    setDigAmount("");
    setDigRefId("");
    setDigAccountHolder("");
  };

  const handleAddDiscount = () => {
    if (!activeShift) return;
    const amount = Number(discAmount);
    if (!amount || amount <= 0) {
      showToast(t("Please enter a valid amount.", "براہ کرم درست رقم درج کریں۔"), "error");
      return;
    }
    if (!discCustomer || !discApprovedBy || !discReason) {
      showToast(
        t(
          "Please fill all required inputs for discount.",
          "ڈسکاؤنٹ کے تمام خانے پر کریں۔",
        ),
        "error",
      );
      return;
    }

    const newDisc = {
      id: `disc_${Date.now()}`,
      amount,
      type: discType,
      reason: discReason,
      customerName: discCustomer,
      productId: discProduct || undefined,
      approvedBy: discApprovedBy,
      notes: discNotes,
      timestamp: new Date().toISOString(),
    };

    const updated = {
      ...activeShift,
      discountEntries: [...(activeShift.discountEntries || []), newDisc],
    };
    onUpdateShift(updated);

    setDiscAmount("");
    setDiscCustomer("");
    setDiscReason("");
    setDiscProduct("");
    setDiscApprovedBy("");
    setDiscNotes("");
  };

  const handleDeleteDiscount = (id: string) => {
    if (!activeShift) return;
    const updated = {
      ...activeShift,
      discountEntries: (activeShift.discountEntries || []).filter(
        (e) => e.id !== id,
      ),
    };
    onUpdateShift(updated);
  };

  const handleDeleteDigital = (id: string) => {
    if (!activeShift) return;
    const updated = {
      ...activeShift,
      digitalCashEntries: activeShift.digitalCashEntries.filter(
        (d) => d.id !== id,
      ),
    };
    onUpdateShift(updated);
  };

  const handleAddLube = () => {
    if (!activeShift) return;
    if (!lubeItemId) {
      showToast(
        t("Please select a lubricant item.", "براہ کرم پراڈکٹ کا انتخاب کریں۔"),
        "error",
      );
      return;
    }
    const qty = Number(lubeQty);
    if (!qty || qty <= 0) {
      showToast(
        t("Please enter a valid quantity.", "براہ کرم درست تعداد درج کریں۔"),
        "error",
      );
      return;
    }

    const product = products.find((p) => p.id === lubeItemId);
    if (product) {
      const alreadyAdded = activeShift.lubeSales
        .filter((l) => l.itemId === lubeItemId)
        .reduce((sum, l) => sum + l.quantity, 0);
      const totalRequested = qty + alreadyAdded;
      if (totalRequested > product.currentStock) {
        showToast(
          t(
            `Insufficient lubricant inventory. Available stock: ${product.currentStock}. Already added: ${alreadyAdded}. Requested: ${qty}.`,
            `لیوب کا اسٹاک کم ہے۔ دستیاب اسٹاک: ${product.currentStock}۔ پہلے سے شامل: ${alreadyAdded}۔ مطلوبہ: ${qty}۔`
          ),
          "error"
        );
        return;
      }
    }

    const price = product?.rate || 1000;
    const amount = qty * price;

    const newLube: LubeSale = {
      id: `lub_${Date.now()}`,
      itemId: lubeItemId,
      quantity: qty,
      price,
      amount,
    };

    // ── Optimistic UI update ──────────────────────────────────────────────────
    const updated = {
      ...activeShift,
      lubeSales: [...activeShift.lubeSales, newLube],
    };
    onUpdateShift(updated);

    // ── EOC Pipeline ─────────────────────────────────────────────────────────
    processLubeSale(
      activeShift.id, activeStationId, activeStationId,
      { itemId: lubeItemId, itemName: product?.name ?? lubeItemId, quantity: qty, price, amount },
      activeShift.date
    ).catch((err: Error) => console.warn('[EOC] Lube sale pipeline:', err.message));

    // Reset inputs
    setLubeQty("");
  };

  const handleDeleteLube = (id: string) => {
    if (!activeShift) return;
    showConfirm(
      t("Reverse Entry", "اندراج کو پلٹائیں"),
      t("This lube sale will be reversed with an audit entry.", "یہ لیوب سیل ریورسل انٹری کے ساتھ پلٹایا جائے گا۔"),
      () => {
        const updated = { ...activeShift, lubeSales: activeShift.lubeSales.filter((l) => l.id !== id) };
        onUpdateShift(updated);
        processReversal(id, t("User reversed lube sale", "صارف نے لیوب سیل پلٹایا"), activeShift.id, activeStationId, activeStationId, activeShift.date)
          .catch((err: Error) => console.warn('[EOC] Lube reversal:', err.message));
      }
    );
  };

  const handleAddSupplier = () => {
    if (!activeShift) return;
    if (!supId) {
      showToast(t("Please select a supplier depot.", "سپلائر کا انتخاب کریں۔"), "error");
      return;
    }
    const amount = Number(supAmount);
    if (!amount || amount <= 0) {
      showToast(t("Please enter a valid payment sum.", "رقم درج کریں۔"), "error");
      return;
    }

    const supplier = suppliers.find((s) => s.id === supId);
    const newSup: SupplierPayment = {
      id: `supp_${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      supplierId: supId,
      amount,
      mode: supMode,
      bankAccountId: supMode === "transfer" ? supBankAcct : undefined,
      reference: supRef,
    };

    // ── Optimistic UI update ──────────────────────────────────────────────────
    const updated = {
      ...activeShift,
      supplierPayments: [...activeShift.supplierPayments, newSup],
    };
    onUpdateShift(updated);

    // ── EOC Pipeline (Approval gate built-in for amounts > Rs 100,000) ────────
    processSupplierPayment(
      activeShift.id, activeStationId, activeStationId,
      {
        supplierId: supId,
        supplierName: supplier?.name ?? supId,
        amount,
        mode: supMode === 'transfer' ? 'transfer' : 'cash',
        bankAccountId: supMode === 'transfer' ? supBankAcct : undefined,
        reference: supRef,
      },
      activeShift.date
    ).then((txn) => {
      if (txn.status === 'pending_approval') {
        showToast(
          t(`Supplier payment of Rs ${amount.toLocaleString()} requires approval. Request sent to Manager/Owner.`,
            `Rs ${amount.toLocaleString()} کی سپلائر ادائیگی کے لیے منظوری درکار ہے۔`),
          'info'
        );
      }
    }).catch((err: Error) => console.warn('[EOC] Supplier payment pipeline:', err.message));

    // Reset inputs
    setSupAmount("");
    setSupRef("");
    setSupBankAcct("");
  };

  const handleDeleteSupplier = (id: string) => {
    if (!activeShift) return;
    showConfirm(
      t("Reverse Entry", "اندراج کو پلٹائیں"),
      t("This supplier payment will be reversed with an audit entry.", "یہ سپلائر ادائیگی ریورسل انٹری کے ساتھ پلٹائی جائے گی۔"),
      () => {
        const updated = { ...activeShift, supplierPayments: activeShift.supplierPayments.filter((s) => s.id !== id) };
        onUpdateShift(updated);
        processReversal(id, t("User reversed supplier payment", "صارف نے سپلائر ادائیگی پلٹائی"), activeShift.id, activeStationId, activeStationId, activeShift.date)
          .catch((err: Error) => console.warn('[EOC] Supplier reversal:', err.message));
      }
    );
  };

  // Step 3 Transition to Step 4 (Configure closings)
  const handleCaptureSnapshot = async (productId: string) => {
    if (!activeShift) return;

    // Validate Auth if override
    if (snapshotOverride) {
      const authorized = await requireBiometric("Price Override Authorization");
      if (!authorized) {
        if (snapshotPin !== settings.security?.priceOverridePin) {
          showToast(
            settings.language === "ur" ? "غلط پن کوڈ" : "Invalid PIN code",
            "error"
          );
          return;
        }
      }
    }

    const { useShiftStore } = await import("../../stores/useShiftStore");
    
    // Pass numeric readings to store
    const numReadings: Record<string, number> = {};
    Object.entries(snapshotReadings).forEach(([nid, val]) => {
      numReadings[nid] = Number(val) || 0;
    });

    try {
      await useShiftStore.getState().handleMidShiftSplit(
        productId,
        numReadings,
        new Date().toISOString(),
        snapshotOverride ? snapshotPin : undefined,
        undefined, // orgId
        undefined  // stationId
      );
      
      showToast(
        settings.language === "ur" ? "سنیپ شاٹ کامیابی سے محفوظ ہو گیا" : "Snapshot saved successfully",
        "success"
      );
      
      setSnapshotReadings({});
      setSnapshotPin("");
      setSnapshotOverride(false);
      
      // If no more pending revisions, switch tab
      const remainingRevs = (activeShift.pendingPriceRevisions || []).filter(r => r.productId !== productId);
      if (remainingRevs.length === 0) {
        setActiveTab("debit");
      }
    } catch (err) {
      console.error(err);
      showToast("Error saving snapshot", "error");
    }
  };

  const handleGoToClosings = () => {
    if (!activeShift) return;
    if (isLubeBusiness) {
      setWizardStep(6);
      return;
    }
    // Pre-populate closing reading fields with initial openings as baseline
    const baselineClosing: { [nozzleId: string]: number } = {};
    nozzles.forEach((noz) => {
      const open = activeShift.openingReadings[noz.id] || 0;
      baselineClosing[noz.id] = Number(open);
    });
    setClosingReadings(baselineClosing);
    setWizardStep(4);
  };

  // Step 4 Trigger: Validate closing readings >= opening
  const handleConfirmClosings = () => {
    if (!activeShift) return;
    setWizardError("");
    const closingNum: { [nozzleId: string]: number } = {};
    let hasError = false;

    for (const noz of nozzles) {
      const open = activeShift.openingReadings[noz.id] || 0;
      const close = Number(closingReadings[noz.id] || 0);

      if (isNaN(close) || close < open) {
        setWizardError(
          t(
            `Closing reading for ${noz.name} must be greater than or equal to its opening reading (${open}).`,
            `${noz.name} کی کلوزنگ ریڈنگ اس کی اوپننگ ریڈنگ (${open}) سے کم نہیں ہو سکتی۔`,
          ),
        );
        hasError = true;
        break;
      }
      closingNum[noz.id] = close;
    }

    if (hasError) return;

    // Validate tank-level discharges against tank stock
    const tankDischarges: { [tankId: string]: number } = {};
    for (const noz of nozzles) {
      if (noz.tankId) {
        const open = activeShift.openingReadings[noz.id] || 0;
        const close = closingNum[noz.id] || 0;
        const discharge = Math.max(0, close - open);
        tankDischarges[noz.tankId] = (tankDischarges[noz.tankId] || 0) + discharge;
      }
    }

    for (const tankId in tankDischarges) {
      const tank = tanks.find((t) => t.id === tankId);
      if (tank) {
        const discharge = tankDischarges[tankId];
        if (discharge > tank.currentStock) {
          setWizardError(
            t(
              `Insufficient tank stock for ${tank.name}. Available stock: ${tank.currentStock} L. Requested sale: ${discharge} L.`,
              `ٹینک "${tank.name}" میں اسٹاک کم ہے۔ دستیاب اسٹاک: ${tank.currentStock} لیٹر۔ مطلوبہ فروخت: ${discharge} لیٹر۔`
            )
          );
          return;
        }
      }
    }

    // Commit closing readings to the active activeShift state
    const updated = {
      ...activeShift,
      closingReadings: closingNum,
    };
    onUpdateShift(updated);
    setWizardStep(5); // Launch test deduction wizard
  };

  // Step 5 Trigger: Confirm tests
  const handleConfirmTests = () => {
    if (!activeShift) return;

    // Save readings and move to step 6 (expected Cash evaluation)
    const updated = {
      ...activeShift,
      testLiters: {
        petrol: Number(testPetrol || 0),
        diesel: Number(testDiesel || 0),
        cng: Number(testCNG || 0),
      },
    };
    onUpdateShift(updated);
    setWizardStep(6);
  };

  // Step 6 Trigger: Expected cash match
  const handleConfirmCashMatch = () => {
    if (!activeShift || !expectedTotals) return;
    setWizardError("");

    const submitted = Number(submittedCash || 0);
    if (isNaN(submitted) || submitted < 0) {
      setWizardError(
        t(
          "Please enter a valid cash sum.",
          "براہ کرم جمع کروائی گئی کیش رقم پُر کریں۔",
        ),
      );
      return;
    }

    const expected = expectedTotals.expectedCash;
    let shortage = 0;
    let overage = 0;

    if (submitted < expected) {
      shortage = expected - submitted;
    } else if (submitted > expected) {
      overage = submitted - expected;
    }

    const updated: Shift = {
      ...activeShift,
      submittedCash: submitted,
      expectedCash: expected,
      shortage,
      overage,
    };

    onUpdateShift(updated);
    setWizardStep(7); // Final summary
  };

  // Step 7 trigger: Finalize shift closeout through EOC pipeline
  const handleFinalShiftSubmission = async () => {
    if (!activeShift || !expectedTotals) return;

    if (activeShift.activeMidShiftAlert) {
      showToast(
        settings.language === "ur" 
          ? "براہ کرم شفٹ بند کرنے سے پہلے قیمت کی تبدیلی کا سنیپ شاٹ محفوظ کریں۔" 
          : "Please capture the pending price revision snapshot before closing the shift.",
        "error"
      );
      return;
    }

    // ── FIFO DEDUCTION (MANDATORY BEFORE CLOSE) ──────────────────────────────
    // Deduct FIFO inventory for each fuel product sold this shift
    setFifoLoading(true);
    const fifoResultsArr: { productId: string; productName: string; result: FIFOResult }[] = [];
    let hasFifoDeficit = false;

    try {
      // Group nozzle sales by product
      const productSales = new Map<string, { liters: number; tankId?: string }>();

      for (const nozzle of nozzles) {
        const openR = activeShift.openingReadings[nozzle.id] || 0;
        const closeR = activeShift.closingReadings[nozzle.id] || openR;
        const sold = Math.max(0, closeR - openR);
        if (sold <= 0) continue;

        const product = products.find(p => p.id === nozzle.productId);
        if (!product || product.type !== 'fuel') continue;

        // Subtract test liters for this product category
        const cat = getFuelCategory(nozzle.productId, products);
        let testLitersForProduct = 0;
        if (cat === 'petrol') testLitersForProduct = Number(testPetrol || activeShift.testLiters?.petrol || 0);
        else if (cat === 'diesel') testLitersForProduct = Number(testDiesel || activeShift.testLiters?.diesel || 0);
        else if (cat === 'cng') testLitersForProduct = Number(testCNG || activeShift.testLiters?.cng || 0);

        const existing = productSales.get(nozzle.productId) || { liters: 0, tankId: nozzle.tankId };
        productSales.set(nozzle.productId, {
          liters: existing.liters + sold,
          tankId: nozzle.tankId || existing.tankId,
        });
      }

      // Run FIFO per product
      for (const [productId, { liters, tankId }] of productSales.entries()) {
        const product = products.find(p => p.id === productId);
        const sellingPrice = product?.rate || 0;
        // Subtract test liters proportionally (already handled above per-product)
        const cat = getFuelCategory(productId, products);
        let testLiters = 0;
        if (cat === 'petrol') testLiters = Number(testPetrol || activeShift.testLiters?.petrol || 0);
        else if (cat === 'diesel') testLiters = Number(testDiesel || activeShift.testLiters?.diesel || 0);
        else if (cat === 'cng') testLiters = Number(testCNG || activeShift.testLiters?.cng || 0);
        const netLiters = Math.max(0, liters - testLiters);

        if (netLiters <= 0) continue;

        // Find tank for this product if not on nozzle
        const resolvedTankId = tankId || '';

        const result = await deductFIFO(
          activeStationId,
          resolvedTankId,
          productId,
          netLiters,
          sellingPrice,
          activeShift.id,
          `${activeShift.id}_${productId}`,
          activeShift.date
        );

        fifoResultsArr.push({ productId, productName: product?.name || productId, result });

        if (result.hasStockDeficit) {
          hasFifoDeficit = true;
        }
      }

      setFifoResults(fifoResultsArr);

      // ── FIFO INTEGRITY GATE ────────────────────────────────────────────────
      if (hasFifoDeficit) {
        const deficitItems = fifoResultsArr
          .filter(r => r.result.hasStockDeficit)
          .map(r => `${r.productName}: ${r.result.deficitLiters.toFixed(0)}L`);
        setFifoLoading(false);
        setWizardError(
          t(
            `⛔ FIFO Stock Deficit — Cannot close shift. Insufficient batches for: ${deficitItems.join(', ')}. Add stock or get Owner Override.`,
            `⛔ FIFO اسٹاک کمی — شفٹ بند نہیں کی جا سکتی۔ کم اسٹاک: ${deficitItems.join(', ')}۔ اسٹاک شامل کریں یا مالک کی اجازت لیں۔`
          )
        );
        return;
      }

      // ── BATCH STATUS INTEGRITY GATE ───────────────────────────────────────
      // Block shift close if any active batch is quarantined or pending QA approval
      const productIdsInShift = Array.from(productSales.keys());
      const blockedBatches = stockBatches.filter(b =>
        productIdsInShift.includes(b.productId) &&
        b.qtyRemaining > 0 &&
        (b.status === 'quarantined' || b.status === 'pending_qa')
      );
      if (blockedBatches.length > 0) {
        const batchNums = blockedBatches.map(b => b.batchNumber).join(', ');
        setFifoLoading(false);
        setWizardError(
          t(
            `🔒 Batch Integrity Block — Cannot close shift. Quarantined/Pending-QA batches detected: ${batchNums}. Resolve batch status before closing.`,
            `🔒 بیچ انٹیگریٹی بلاک — شفٹ بند نہیں کی جا سکتی۔ قرنطینہ/زیر معائنہ بیچ: ${batchNums}۔ بیچ حل کریں۔`
          )
        );
        return;
      }

      // ── CRITICAL CLAIMS GATE ──────────────────────────────────────────────
      // Block if any critical unresolved claim (seal_broken / adulteration) exists for active batches
      const activeBatchIds = new Set(stockBatches.filter(b => productIdsInShift.includes(b.productId) && b.qtyRemaining > 0).map(b => b.id));
      const criticalOpenClaims = (supplierClaimsStore || []).filter(c =>
        activeBatchIds.has(c.batchId) &&
        (c.claimType === 'seal_broken' || c.claimType === 'adulteration') &&
        (c.status === 'pending' || c.status === 'submitted') &&
        c.outstandingClaim > 0
      );
      if (criticalOpenClaims.length > 0) {
        const claimNums = criticalOpenClaims.map(c => c.claimNumber).join(', ');
        setFifoLoading(false);
        setWizardError(
          t(
            `🚨 Critical Claim Block — Cannot close shift. Unresolved seal/adulteration claims: ${claimNums}. Resolve or escalate before shift close.`,
            `🚨 کریٹیکل کلیم بلاک — شفٹ بند نہیں کی جا سکتی۔ غیر حل شدہ سیل/ملاوٹ کلیمز: ${claimNums}۔`
          )
        );
        return;
      }
    } catch (fifoErr: any) {
      console.warn('[FIFO] Deduction error (non-blocking):', fifoErr.message);
      // Non-blocking — log but proceed (owner decision)
    } finally {
      setFifoLoading(false);
    }

    const endT = new Date();
    const formattedEndTime = `${String(endT.getHours()).padStart(2, "0")}:${String(endT.getMinutes()).padStart(2, "0")}`;

    // ── Optimistic UI close ───────────────────────────────────────────────────
    const finalizedShift: Shift = {
      ...activeShift,
      status: "closed",
      endTime: formattedEndTime,
    };

    try {
      await Promise.resolve(onUpdateShift(finalizedShift));

      // ── EOC Shift Close Pipeline (async) ──────────────────────────────────────
      // Runs: lockShiftJournals → reconciliation → fraud analysis → integrity score → snapshot
      eocShiftClose(finalizedShift, activeStationId, activeStationId, nozzles, products)
        .then(({ reconciliationReport, riskScore }) => {
          const scoreLabel = reconciliationReport.integrityScore >= 90 ? '🟢' :
            reconciliationReport.integrityScore >= 70 ? '🟡' : '🔴';
          console.info(
            `[EOC] Shift closed. Integrity: ${scoreLabel} ${reconciliationReport.integrityScore}/100. Risk: ${riskScore.overallRisk.toUpperCase()}`
          );
        })
        .catch((err: Error) => console.warn('[EOC] Shift close pipeline:', err.message));

      onNavigateToView("dashboard");
      const totalFifoMargin = fifoResultsArr.reduce((s, r) => s + r.result.totalMargin, 0);
      showToast(
        t(
          `Shift closed! FIFO deducted. Realized margin: Rs.${totalFifoMargin.toLocaleString()}. Journals locked.`,
          `شفٹ بند! FIFO کٹوتی ہوئی۔ حقیقی منافع: Rs.${totalFifoMargin.toLocaleString()}۔ جرنلز لاک۔`,
        ),
        "success"
      );
    } catch (err: any) {
      console.error("Error during shift close:", err);
      showToast(
        err.message || t("Failed to close shift. Please check tank stocks and try again.", "شفٹ بند کرنے میں خرابی۔ براہ کرم ٹینک کا اسٹاک چیک کریں۔"),
        "error"
      );
    }
  };

  // Cancel running shift trigger
  const handleAbandoneShift = () => {
    if (!activeShift) return;
    showConfirm(
      t("Confirm Abandon Shift", "شفٹ منسوخ کرنے کی تصدیق"),
      t(
        "Are you sure you want to delete and reset this running shift?",
        "کیا آپ واقعتاً جاری شفٹ کو منسوخ اور ختم کرنا چاہتے ہیں؟",
      ),
      () => {
        const cleanShifts = shifts.filter((s) => s.id !== activeShift.id);
        db.saveShifts(activeStationId, cleanShifts);
        window.location.reload();
      }
    );
  };

  const generateAISummary = async () => {
    if (!activeShift || !expectedTotals) return;
    setIsGeneratingAiSummary(true);
    setAiSummary(null);
    try {
      const summaryContext = {
        shiftType: activeShift.type,
        date: activeShift.date,
        time: activeShift.startTime,
        operator: staff.find((s) => s.id === activeShift.staffId)?.name || 'Unknown',
        totals: expectedTotals,
        shortage: activeShift.shortage,
        overage: activeShift.overage,
        submittedCash: activeShift.submittedCash
      };

      const response = await fetchWithAuth('/api/ai-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemPrompt: 'You are an AI financial auditor for a fuel station. Analyze the following shift data. Detect any cash shortages or overages, explain potential variances, and highlight financial risks. Provide a structured, concise executive summary of the performance.',
          userMessage: JSON.stringify(summaryContext),
          language: settings.language,
          conversationHistory: []
        })
      });

      if (!response.ok) throw new Error('Failed to generate AI summary');
      const data = await response.json();
      setAiSummary(data.reply);
    } catch (error) {
      console.error(error);
      setAiSummary("⚠️ Could not generate AI summary at this time.");
    } finally {
      setIsGeneratingAiSummary(false);
    }
  };

  return (
    <div className="space-y-6 pb-16 lg:pb-0">
      {/* HEADER ROW BAR */}
      <div className="flex flex-col gap-4 sm:flex-row items-center sm:justify-between border-b border-slate-200 pb-4">
        <div>
          <h2 className="font-sans text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <RotateCcw className="h-6 w-6 text-orange-600 animate-spin-slow" />
            <span>{t("Operational Shift Wizard", "شفٹ کنٹرول وزرڈ")}</span>
          </h2>
          <p className="font-sans text-xs text-slate-500 mt-1">
            {t(
              "Daily logs, nozzle parameters, debtors recovery, cash reconciliation and summaries.",
              "روزانہ اسٹیشن نوڈ کام، بقایاجات، اور اخراجات کا تفصیلی نظام۔",
            )}
          </p>
        </div>

        {/* Abandon activeShift Button */}
        {activeShift && wizardStep >= 3 && (
          <button
            onClick={handleAbandoneShift}
            className="flex items-center justify-center gap-1 mt-2 sm:mt-0 rounded-lg border border-red-200 bg-red-50 px-3.5 py-1.5 font-sans text-xs font-bold text-red-600 hover:bg-red-100 transition-colors cursor-pointer self-start sm:self-center"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span>{t("Cancel / Abandon Shift", "شفٹ منسوخ کریں")}</span>
          </button>
        )}
      </div>

      {wizardError && (
        <div className="flex items-center gap-3 rounded-lg bg-red-55/15 border border-red-200 p-4 text-red-700 font-sans text-sm shadow-xs animate-shake">
          <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
          <span>{wizardError}</span>
        </div>
      )}

      {/* ==========================================
          STEP 1: SHIFT SETUP & INITIALS
          ========================================== */}
      {wizardStep === 1 && (
        <div className="mx-auto max-w-lg rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4 mb-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-100 text-orange-600">
              <Play className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-sans text-base font-bold text-slate-900">
                {t("Initiate New Shift Session", "نئی کاروباری شفٹ شروع کریں")}
              </h3>
              <p className="font-sans text-xs text-slate-400 mt-0.5">
                {t(
                  "Setup operator name and duty type.",
                  "ڈیوٹی افسر اور شفٹ کی قسم مقرر کریں۔",
                )}
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {/* Salesman selection dropdown */}
            <div>
              <label className="mb-2 block font-sans text-xs font-bold text-slate-500 uppercase tracking-wide">
                {t("Assign Operator / Salesman:", "ڈیوٹی آپریٹر / سیلزمین:")}
              </label>
              <select
                value={selectedStaffId}
                onChange={(e) => setSelectedStaffId(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 font-sans text-sm text-slate-800 shadow-xs focus:border-orange-500 focus:outline-hidden"
              >
                <option value="">
                  {t("-- Select Staff operator --", "-- سیلزمین منتخب کریں --")}
                </option>
                {staff
                  .filter((st) => st.active)
                  .map((st) => (
                    <option key={st.id} value={st.id}>
                      {settings.language === "en" ? st.name : st.urduName} (
                      {t(st.role.toUpperCase(), st.role)})
                    </option>
                  ))}
              </select>
            </div>

            {/* Shift Type Button Toggle */}
            <div>
              <label className="mb-2 block font-sans text-xs font-bold text-slate-500 uppercase tracking-wide">
                {t("Choose Shift Type:", "شفٹ کی قسم:")}
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setShiftType("day")}
                  className={`flex items-center justify-center gap-2 rounded-lg py-3.5 border font-sans text-sm font-bold transition-all cursor-pointer ${
                    shiftType === "day"
                      ? "border-orange-500 bg-orange-50 text-orange-700 shadow-sm"
                      : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  ☀️ {t("Day Shift (Morning)", "دن کی شفٹ")}
                </button>
                <button
                  type="button"
                  onClick={() => setShiftType("night")}
                  className={`flex items-center justify-center gap-2 rounded-lg py-3.5 border font-sans text-sm font-bold transition-all cursor-pointer ${
                    shiftType === "night"
                      ? "border-orange-500 bg-orange-50 text-orange-700 shadow-sm"
                      : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  🌙 {t("Night Shift (Evening)", "رات کی شفٹ")}
                </button>
              </div>
            </div>

            {/* Date and Time Details */}
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 block font-sans text-xs font-bold text-slate-500 uppercase tracking-wide flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-slate-400" />
                  <span>{t("Opening Date:", "آغاز تاریخ:")}</span>
                </label>
                <input
                  type="date"
                  value={shiftDate}
                  onChange={(e) => setShiftDate(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 font-mono text-sm text-slate-800 shadow-xs focus:border-orange-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="mb-2 block font-sans text-xs font-bold text-slate-500 uppercase tracking-wide flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-slate-400" />
                  <span>{t("Opening Start Time:", "آغاز وقت:")}</span>
                </label>
                <input
                  type="time"
                  value={shiftTime}
                  onChange={(e) => setShiftTime(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 font-mono text-sm text-slate-800 shadow-xs focus:border-orange-500 focus:outline-hidden"
                />
              </div>
            </div>

            {/* Launch CTA */}
            <button
              onClick={handleStartShift}
              className="w-full py-4 bg-orange-600 font-sans text-sm font-bold text-white tracking-wide rounded-lg hover:bg-orange-700 shadow-md shadow-orange-500/10 flex items-center justify-center gap-2 mt-2 transition-all cursor-pointer"
            >
              <span>
                {isLubeBusiness
                  ? t("START NEW LUBE SHIFT →", "نئی لیوب شفٹ شروع کریں ←")
                  : t("START NEW SHIFT SESSION →", "نئی کاروباری شفٹ شروع کریں ←")}
              </span>
            </button>
          </div>
        </div>
      )}

      {/* ==========================================
          STEP 2: OPENING NOZZLES METER CORRELATION
          ========================================== */}
      {wizardStep === 2 && (
        <OpeningReadingsForm
          t={t}
          setIsOpeningScannerOpen={setIsOpeningScannerOpen}
          nozzles={nozzles}
          products={products}
          fuelRates={fuelRates}
          previousClosingReadings={previousClosingReadings}
          openingReadings={openingReadings}
          setOpeningReadings={setOpeningReadings}
          setWizardStep={setWizardStep}
          handleConfirmOpenings={handleConfirmOpenings}
        />
      )}

      {/* ==========================================
          STEP 3: ACTIVE SHIFT HUB DRAWERS
          ========================================== */}
      {wizardStep === 3 && activeShift && (
        <div className="grid grid-cols-2 gap-6 lg:grid-cols-3">
          {/* Active Shift Info Sidebar */}
          <div className="space-y-4">
            <div className="rounded-xl border border-orange-200 bg-orange-55/10 p-5 shadow-xs">
              <div className="flex items-center gap-2 font-sans text-xs text-orange-600 font-bold uppercase tracking-wider">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-orange-400 opacity-75"></span>
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-orange-500"></span>
                </span>
                <span>
                  {t("Active Session Running", "کاروباری شفٹ جاری ہے")}
                </span>
              </div>

              <h3 className="font-sans text-lg font-bold text-slate-900 mt-2">
                {activeStaffMember
                  ? settings.language === "en"
                    ? activeStaffMember.name
                    : activeStaffMember.urduName
                  : "Salesman"}
              </h3>
              <p className="font-sans text-xs text-slate-400 mt-0.5">
                {t(
                  `Shift Type: ${activeShift.type.toUpperCase()}`,
                  `شفٹ کی قسم: ${activeShift.type === "day" ? "دن" : "رات"}`,
                )}
              </p>

              <div className="mt-4 divide-y divide-slate-100 border-t border-slate-100 pt-3 text-xs font-sans text-slate-500 space-y-2">
                <div className="flex justify-between pt-1.5">
                  <span>{t("Started on:", "آغاز تاریخ:")}</span>
                  <span className="font-mono font-bold text-slate-800">
                    {activeShift.date}
                  </span>
                </div>
                <div className="flex justify-between pt-1.5">
                  <span>{t("Start Time:", "آغاز کا وقت:")}</span>
                  <span className="font-mono font-bold text-slate-800">
                    {activeShift.startTime}
                  </span>
                </div>
              </div>

              <button
                onClick={handleGoToClosings}
                className="w-full py-3.5 bg-orange-600 text-white font-sans text-xs font-bold rounded-lg hover:bg-orange-700 shadow-lg shadow-orange-500/10 tracking-wider mt-5 flex items-center justify-center gap-1 transition-all cursor-pointer"
              >
                <span>
                  {isLubeBusiness
                    ? t("PROCEED TO CASH CLOSE →", "کیش کلوز پر جائیں ←")
                    : t("PROCEED TO SHIFT CLOSE →", "کلوزنگ ریڈنگز پر جائیں ←")}
                </span>
              </button>
            </div>

            {/* Multi-Tab Running Session Accrual Counters */}
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
              <h4 className="font-sans text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2 mb-3">
                {t("Shift Accrual Stats", "حساب کتاب کی موجودہ پوزیشن")}
              </h4>
              <div className="space-y-3 font-sans text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">
                    {t("Total Customers Debt:", "گاہکوں کا کل ادھار:")}
                  </span>
                  <span className="font-mono font-bold text-rose-500">
                    Rs. {expectedTotals?.debits.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">
                    {t("Total Collect Recovery:", "حاصل شدہ بقایاجات:")}
                  </span>
                  <span className="font-mono font-bold text-emerald-500">
                    Rs. {expectedTotals?.recoveries.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">
                    {t("Expenses Paid Cash:", "کیش میں اخراجات:")}
                  </span>
                  <span className="font-mono font-bold text-red-500">
                    Rs. {expectedTotals?.expenses.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between border-t border-dashed border-slate-105 pt-2.5 font-semibold text-slate-700">
                  <span>
                    {t("Liquid cash expected:", "اندازہ کیش پوزیشن:")}
                  </span>
                  <span className="font-mono font-bold text-indigo-600">
                    Rs. {expectedTotals?.expectedCash.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* CRITICAL PRICE REVISION BANNER */}
          {activeShift?.activeMidShiftAlert && (
            <div className="col-span-1 lg:col-span-3 mb-4 rounded-lg bg-red-50 border-l-4 border-red-500 p-4 shadow-sm flex flex-row items-center justify-between gap-4">
              <div className="flex items-start items-center gap-3">
                <AlertCircle className="w-6 h-6 text-red-600 animate-pulse shrink-0 mt-0.5 sm:mt-0" />
                <div>
                  <h3 className="font-bold text-red-800">
                    {t("CRITICAL: Rate Revision Pending", "اہم: قیمت کی تبدیلی زیر التواء ہے")}
                  </h3>
                  <p className="text-sm text-red-600 mt-1 sm:mt-0">
                    {t("Please capture snapshot readings immediately or use Owner Override.", "براہ کرم فوری طور پر میٹر ریڈنگ درج کریں یا مالک کا پن استعمال کریں۔")}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setActiveTab("rateChange")}
                className="w-full sm:w-auto px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-bold rounded-md shadow-sm transition-colors"
              >
                {t("Capture Snapshot", "ریڈنگ درج کریں")}
              </button>
            </div>
          )}

          {/* Operational Entry Cards (TABS) */}
          <div className="lg:col-span-2 space-y-4">
            {/* Tab selection rail */}
            <div className="flex border border-slate-200 rounded-lg overflow-x-auto bg-white p-1">
              {[
                { id: "debit", label: "Debit (Udhar)", urdu: "ادھار قرض " },
                { id: "recovery", label: "Recovery", urdu: "وصولی رقم " },
                { id: "expense", label: "Expense", urdu: "اخراجات " },
                { id: "bank", label: "Bank", urdu: "بینک " },
                { id: "digital", label: "Digital", urdu: "ڈیجیٹل " },
                { id: "discount", label: "Discounts", urdu: "ڈسکاؤنٹس " },
                { id: "lube", label: "Lubes", urdu: "انجن آئل " },
                { id: "supplier", label: "Supplier", urdu: "سپلائر بل " },
                ...(activeShift?.activeMidShiftAlert ? [{ id: "rateChange", label: "⚡ Rate Change", urdu: "⚡ قیمت تبدیل" }] : []),
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex-shrink-0 px-3 py-2 text-xs font-sans font-bold rounded-md transition-all cursor-pointer whitespace-nowrap ${
                    activeTab === tab.id
                      ? "bg-orange-500 text-white shadow-xs"
                      : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
                  }`}
                >
                  {t(tab.label, tab.urdu)}
                </button>
              ))}
            </div>

            {/* TAB PANELS CONTAINER */}
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              {/* TAB 1: DEBITS (CREDIT SALES) */}
              {activeTab === "debit" && (
                <ShiftDebtors
                  t={t}
                  settings={settings}
                  activeShift={activeShift}
                  customers={customers}
                  effectiveCustomers={effectiveCustomers}
                  products={products}
                  debCustId={debCustId}
                  setDebCustId={setDebCustId}
                  debProdId={debProdId}
                  setDebProdId={setDebProdId}
                  debQty={debQty}
                  setDebQty={setDebQty}
                  debNote={debNote}
                  setDebNote={setDebNote}
                  showQuickCustomer={showQuickCustomer}
                  setShowQuickCustomer={setShowQuickCustomer}
                  quickCustomerName={quickCustomerName}
                  setQuickCustomerName={setQuickCustomerName}
                  onAddCustomer={onAddCustomer}
                  handleQuickAddCustomer={handleQuickAddCustomer}
                  handleAddDebit={handleAddDebit}
                  handleDeleteDebit={handleDeleteDebit}
                />
              )}

              {/* TAB 2: RECOVERIES (CREDIT RECOVERIES) */}
              {activeTab === "recovery" && (
                <div className="space-y-4">
                  <h3 className="font-sans text-sm font-bold text-slate-800 border-b border-slate-100 pb-2 mb-4 flex items-center justify-between">
                    <span>
                      {t(
                        "💚 Customer Outstanding Recovery Collection",
                        "بقایا قرض رقم کی وصولی",
                      )}
                    </span>
                  </h3>

                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-2">
                    <div>
                      <div className="flex justify-between items-center mb-1.5">
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide">
                          {t("Select Outstanding Customer:", "بقایا فیس گاہک:")}
                        </label>
                        {onAddCustomer && (
                          <button
                            onClick={() => setShowQuickCustomer(true)}
                            className="text-[9px] font-bold text-orange-600 uppercase tracking-widest bg-orange-50 px-2 py-0.5 rounded-full hover:bg-orange-100 transition-colors pointer-events-auto"
                          >
                            + {t("Quick Add", "نئی انٹری")}
                          </button>
                        )}
                      </div>
                      {showQuickCustomer ? (
                        <form
                          onSubmit={handleQuickAddCustomer}
                          className="flex gap-2"
                        >
                          <input
                            autoFocus
                            type="text"
                            placeholder={t("Enter Name...", "گاہک کا نام...")}
                            value={quickCustomerName}
                            onChange={(e) =>
                              setQuickCustomerName(e.target.value)
                            }
                            className="w-full rounded-lg border border-orange-300 bg-white px-3 py-2 font-sans text-sm text-slate-800 shadow-xs focus:border-orange-500 outline-none"
                          />
                          <button
                            type="submit"
                            className="bg-orange-600 text-white px-3 py-2 rounded-lg font-bold text-xs uppercase shadow-sm"
                          >
                            {t("Save", "سیو")}
                          </button>
                          <button
                            type="button"
                            onClick={() => setShowQuickCustomer(false)}
                            className="bg-slate-200 text-slate-600 px-3 py-2 rounded-lg font-bold text-xs uppercase"
                          >
                            X
                          </button>
                        </form>
                      ) : (
                        <select
                          value={recCustId}
                          onChange={(e) => setRecCustId(e.target.value)}
                          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 font-sans text-sm text-slate-800 shadow-xs focus:border-orange-500"
                        >
                          <option value="">
                            {t(
                              "-- Select debtor --",
                              "-- بقایا گاہک منتخب کریں --",
                            )}
                          </option>
                          {effectiveCustomers
                            .filter((c) => c.effectiveBalance > 0)
                            .map((c) => (
                              <option key={c.id} value={c.id}>
                                {settings.language === "en"
                                  ? c.name
                                  : c.urduName}{" "}
                                (
                                {t(
                                  `Debt: Rs. ${c.effectiveBalance}`,
                                  `قرض: ${c.effectiveBalance} روپے`,
                                )}
                                )
                              </option>
                            ))}
                        </select>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">
                        {t("Amount Received:", "وصول شدہ کل رقم:")}
                      </label>
                      <input
                        type="number"
                        value={recAmount}
                        onChange={(e) => setRecAmount(e.target.value)}
                        placeholder="e.g. 15000"
                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 font-mono text-sm focus:border-orange-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">
                        {t("Payment Mode / Option:", "طریقہ ادائیگی:")}
                      </label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {["cash", "cheque", "transfer"].map((m) => (
                          <button
                            key={m}
                            type="button"
                            onClick={() => setRecMode(m as any)}
                            className={`py-2 rounded-lg border font-sans text-xs font-bold transition-all cursor-pointer ${
                              recMode === m
                                ? "border-orange-500 bg-orange-50 text-orange-700 font-bold"
                                : "border-slate-200 bg-white text-slate-550"
                            }`}
                          >
                            {t(m.toUpperCase(), m)}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">
                        {t(
                          "Cheque / Online Reference #:",
                          "چیک نمبر / آن لائن ریفرنس:",
                        )}
                      </label>
                      <input
                        type="text"
                        value={recRef}
                        onChange={(e) => setRecRef(e.target.value)}
                        placeholder="e.g. CHQ-993829"
                        disabled={recMode === "cash"}
                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 font-sans text-xs focus:border-orange-500 disabled:bg-slate-50"
                      />
                    </div>
                  </div>

                  <button
                    onClick={handleAddRecovery}
                    className="w-full py-2.5 bg-orange-600 text-white font-sans text-xs font-bold rounded-lg hover:bg-orange-700 cursor-pointer shadow-md shadow-orange-500/10 flex items-center justify-center gap-1.5"
                  >
                    <Plus className="h-4 w-4" />
                    <span>
                      {t("ADD RECOVERY ENTRY", "رقم کی وصولی درج کریں")}
                    </span>
                  </button>

                  {/* Registered Recoveries List */}
                  <div className="mt-4 border-t border-slate-100 pt-4">
                    <h4 className="font-sans text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                      {t("Recovered This Shift:", "اس شفٹ میں وصولیاں:")}
                    </h4>
                    {activeShift.recoveryEntries.length === 0 ? (
                      <p className="text-center py-4 font-sans text-xs text-slate-400 border border-slate-100 border-dashed rounded-lg bg-slate-50/50">
                        {t(
                          "No recovery transactions logged.",
                          "ابھی تک کوئی وصولی درج نہیں۔",
                        )}
                      </p>
                    ) : (
                      <div className="space-y-2 max-h-40 overflow-y-auto">
                        {activeShift.recoveryEntries.map((r) => {
                          const cName =
                            customers.find((c) => c.id === r.customerId)
                              ?.name || "Debtor";
                          return (
                            <div
                              key={r.id}
                              className="flex justify-between items-center text-xs p-2 rounded-lg border border-slate-100 bg-slate-50/20"
                            >
                              <div className="font-sans text-slate-700 pr-4">
                                <span className="font-bold">{cName}</span> —
                                Collected via{" "}
                                <span className="uppercase font-semibold text-orange-600">
                                  {r.mode}
                                </span>{" "}
                                {r.reference && `(${r.reference})`}
                              </div>
                              <div className="flex items-center gap-3">
                                <span className="font-mono font-bold text-emerald-600">
                                  Rs. {r.amount.toLocaleString()}
                                </span>
                                <button
                                  onClick={() => handleDeleteRecovery(r.id)}
                                  className="text-red-500 hover:text-red-700 cursor-pointer"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 3: EXPENSES */}
              {activeTab === "expense" && (
                <ExpenseEntryTab
                  t={t}
                  settings={settings}
                  activeShift={activeShift}
                  activeStationId={activeStationId}
                  staff={staff}
                  EXPENSE_CATEGORIES={EXPENSE_CATEGORIES}
                  showToast={showToast}
                  onUpdateShift={onUpdateShift}
                  processExpense={processExpense}
                  processReversal={processReversal}
                  onAddShiftSalaryPayment={onAddShiftSalaryPayment}
                  onDeleteShiftSalaryPayment={onDeleteShiftSalaryPayment}
                />
              )}

              {/* TAB 4: BANK CASH DEPOSITS */}
              {activeTab === "bank" && (
                <div className="space-y-4">
                  <h3 className="font-sans text-sm font-bold text-slate-800 border-b border-slate-100 pb-2 mb-4 flex items-center justify-between">
                    <span>
                      {t(
                        "🏦 Bank Cash Deposits & Transfers",
                        "بینک جمع شدہ رقم کی انٹری",
                      )}
                    </span>
                  </h3>

                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-2">
                    <div>
                      <div className="flex justify-between items-center mb-1.5">
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide">
                          {t(
                            "Select Bank Name Account:",
                            "بینک اکاؤنٹ منتخب کریں:",
                          )}
                        </label>
                        {onAddBank && (
                          <button
                            onClick={() => setShowQuickBank(true)}
                            className="text-[9px] font-bold text-orange-600 uppercase tracking-widest bg-orange-50 px-2 py-0.5 rounded-full hover:bg-orange-100 transition-colors pointer-events-auto"
                          >
                            + {t("Quick Add Bank", "نیا بینک انٹری")}
                          </button>
                        )}
                      </div>
                      {showQuickBank ? (
                        <div className="space-y-2 border border-orange-300 bg-orange-50/50 p-2.5 rounded-lg">
                          <input
                            autoFocus
                            type="text"
                            placeholder={t(
                              "Enter Bank Name...",
                              "بینک کا نام...",
                            )}
                            value={quickBankName}
                            onChange={(e) => setQuickBankName(e.target.value)}
                            className="w-full rounded-md border border-orange-200 bg-white px-2.5 py-1.5 font-sans text-xs text-slate-800 outline-none focus:border-orange-500"
                          />
                          <input
                            type="text"
                            placeholder={t(
                              "Enter Account No...",
                              "اکاؤنٹ نمبر...",
                            )}
                            value={quickBankAccNo}
                            onChange={(e) => setQuickBankAccNo(e.target.value)}
                            className="w-full rounded-md border border-orange-200 bg-white px-2.5 py-1.5 font-sans text-xs text-slate-800 outline-none focus:border-orange-500"
                          />
                          <div className="flex gap-1.5 justify-end">
                            <button
                              type="button"
                              onClick={handleQuickAddBank}
                              className="bg-orange-600 text-white px-2.5 py-1 rounded font-bold text-[10px] uppercase shadow-sm"
                            >
                              {t("Save", "سیو")}
                            </button>
                            <button
                              type="button"
                              onClick={() => setShowQuickBank(false)}
                              className="bg-slate-200 text-slate-600 px-2.5 py-1 rounded font-bold text-[10px] uppercase"
                            >
                              {t("Cancel", "منسوخ")}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <select
                          value={bankAcctId}
                          onChange={(e) => setBankAcctId(e.target.value)}
                          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 font-sans text-sm text-slate-800 shadow-xs focus:border-orange-500"
                        >
                          <option value="">
                            {t("-- Choose bank --", "-- بینک اکاؤنٹ --")}
                          </option>
                          {banks.map((b) => (
                            <option key={b.id} value={b.id}>
                              {b.name} ({b.accountNo})
                            </option>
                          ))}
                        </select>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">
                        {t("Amount Deposited:", "جمع فیس رقم (روپے):")}
                      </label>
                      <input
                        type="number"
                        value={bankAmount}
                        onChange={(e) => setBankAmount(e.target.value)}
                        placeholder="e.g. 50000"
                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 font-mono text-sm focus:border-orange-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">
                        {t(
                          "Transaction Reference / ID:",
                          "ٹرانزیکشن ریفرنس نمبر / چالان:",
                        )}
                      </label>
                      <input
                        type="text"
                        value={bankRef}
                        onChange={(e) => setBankRef(e.target.value)}
                        placeholder="e.g. FT-9938290"
                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 font-sans text-sm focus:border-orange-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">
                        {t(
                          "Link to Customer (Optional):",
                          "گاہک سے لنک کریں (اختیاری):",
                        )}
                      </label>
                      <select
                        value={bankCustId}
                        onChange={(e) => setBankCustId(e.target.value)}
                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 font-sans text-sm text-slate-800 shadow-xs focus:border-orange-500"
                      >
                        <option value="">
                          {t(
                            "-- None / Direct Deposit --",
                            "-- کوئی گاہک نہیں / براہ راست انٹری --",
                          )}
                        </option>
                        {customers.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <button
                    onClick={handleAddBank}
                    className="w-full py-2.5 bg-orange-600 text-white font-sans text-xs font-bold rounded-lg hover:bg-orange-700 cursor-pointer shadow-md shadow-orange-500/10 flex items-center justify-center gap-1.5"
                  >
                    <Plus className="h-4 w-4" />
                    <span>
                      {t("ADD BANK ENTRY", "بینک جمع شدہ رقم شامل کریں")}
                    </span>
                  </button>

                  <div className="mt-4 border-t border-slate-100 pt-4">
                    <h4 className="font-sans text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                      {t(
                        "Bank Cash Entries Transferred:",
                        "بینک میں منتقل شدہ رقم:",
                      )}
                    </h4>
                    {activeShift.bankCashEntries.length === 0 ? (
                      <p className="text-center py-4 font-sans text-xs text-slate-400 border border-slate-100 border-dashed rounded-lg bg-slate-50/50">
                        {t(
                          "No bank transfers reported yet.",
                          "ابھی تک کوئی بینک انٹری درج نہیں۔",
                        )}
                      </p>
                    ) : (
                      <div className="space-y-2 max-h-40 overflow-y-auto">
                        {activeShift.bankCashEntries.map((b) => {
                          const name =
                            banks.find((bk) => bk.id === b.bankAccountId)
                              ?.name || "Bank";
                          const linkedC = customers.find(
                            (c) => c.id === b.customerId,
                          )?.name;
                          return (
                            <div
                              key={b.id}
                              className="flex justify-between items-center text-xs p-2 rounded-lg border border-slate-100 bg-slate-50/20"
                            >
                              <div className="font-sans text-slate-700 pr-4">
                                <span className="font-bold">{name}</span> — Ref:{" "}
                                {b.reference} {linkedC && `[${linkedC}]`}
                              </div>
                              <div className="flex items-center gap-3">
                                <span className="font-mono font-bold text-indigo-650">
                                  Rs. {b.amount.toLocaleString()}
                                </span>
                                <button
                                  onClick={() => handleDeleteBank(b.id)}
                                  className="text-red-500 hover:text-red-700 cursor-pointer"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 5: DIGITAL CASH */}
              {activeTab === "digital" && (
                <div className="space-y-4">
                  <h3 className="font-sans text-sm font-bold text-slate-800 border-b border-slate-100 pb-2 mb-4 flex items-center justify-between">
                    <span>
                      {t(
                        "📱 EasyPaisa / JazzCash / Card POS Machines",
                        "ڈیجیٹل والٹ اور کارڈ مشین رسیپٹس",
                      )}
                    </span>
                  </h3>

                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-2">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">
                        {t("Digital Method:", "والٹ / کارڈ نیٹ ورک:")}
                      </label>
                      <select
                        value={digMethod}
                        onChange={(e) => setDigMethod(e.target.value)}
                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 font-sans text-sm text-slate-800 shadow-xs focus:border-orange-500"
                      >
                        <option value="EasyPaisa">EasyPaisa</option>
                        <option value="JazzCash">JazzCash</option>
                        <option value="ATM Debit Card">ATM Debit Card</option>
                        <option value="SadaPay/NayaPay">SadaPay/NayaPay</option>
                        <option value="HBL POS Terminal">
                          HBL POS Terminal
                        </option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">
                        {t("Amount Received:", "وصول رقم (روپے):")}
                      </label>
                      <input
                        type="number"
                        value={digAmount}
                        onChange={(e) => setDigAmount(e.target.value)}
                        placeholder="e.g. 5000"
                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 font-mono text-sm focus:border-orange-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">
                        {t(
                          "Transaction ID / Validation:",
                          "والٹ ٹرانزیکشن ID نمبر:",
                        )}
                      </label>
                      <input
                        type="text"
                        value={digRefId}
                        onChange={(e) => setDigRefId(e.target.value)}
                        placeholder="e.g. TR-2839201"
                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 font-sans text-sm focus:border-orange-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">
                        {t(
                          "Account Holder Name (Optional):",
                          "اکاؤنٹ ہولڈر کا نام (اختیاری):",
                        )}
                      </label>
                      <input
                        type="text"
                        value={digAccountHolder}
                        onChange={(e) => setDigAccountHolder(e.target.value)}
                        placeholder="e.g. Umar Ali"
                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 font-sans text-sm focus:border-orange-500"
                      />
                    </div>
                  </div>

                  <button
                    onClick={handleAddDigital}
                    className="w-full py-2.5 bg-orange-600 text-white font-sans text-xs font-bold rounded-lg hover:bg-orange-700 cursor-pointer shadow-md shadow-orange-500/10 flex items-center justify-center gap-1.5"
                  >
                    <Plus className="h-4 w-4" />
                    <span>
                      {t("ADD DIGITAL ENTRY", "ڈیجیٹل رقم شامل کریں")}
                    </span>
                  </button>

                  <div className="mt-4 border-t border-slate-100 pt-4">
                    <h4 className="font-sans text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                      {t(
                        "Digital Receipts Logged:",
                        "موصول شدہ ڈیجیٹل ادائیگیاں:",
                      )}
                    </h4>
                    {activeShift.digitalCashEntries.length === 0 ? (
                      <p className="text-center py-4 font-sans text-xs text-slate-400 border border-slate-100 border-dashed rounded-lg bg-slate-50/50">
                        {t(
                          "No digital receipts logged yet.",
                          "ابھی تک کوئی ڈیجیٹل چالان نہیں لکھی گئی۔",
                        )}
                      </p>
                    ) : (
                      <div className="space-y-2 max-h-40 overflow-y-auto">
                        {activeShift.digitalCashEntries.map((d) => (
                          <div
                            key={d.id}
                            className="flex justify-between items-center text-xs p-2 rounded-lg border border-slate-100 bg-slate-50/20"
                          >
                            <div className="font-sans text-slate-700 pr-4">
                              <span className="font-bold">{d.method}</span> —
                              TXN: {d.transactionId}{" "}
                              {d.accountHolder && `(${d.accountHolder})`}
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="font-mono font-bold text-purple-650">
                                Rs. {d.amount.toLocaleString()}
                              </span>
                              <button
                                onClick={() => handleDeleteDigital(d.id)}
                                className="text-red-500 hover:text-red-700 cursor-pointer"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 8: DISCOUNTS */}
              {activeTab === "discount" && (
                <div className="space-y-4">
                  <h3 className="font-sans text-sm font-bold text-slate-800 border-b border-slate-100 pb-2 mb-4 flex items-center justify-between">
                    <span>
                      {t("📉 Discount Management", "ڈسکاؤنٹ مینجمنٹ")}
                    </span>
                  </h3>

                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-2">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">
                        {t("Discount Amount (Rs.):", "رقم (روپے میں):")}
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={discAmount}
                        onChange={(e) => setDiscAmount(e.target.value)}
                        className="w-full font-mono text-lg font-bold text-orange-600 rounded-lg border border-slate-200 bg-white px-3 py-1.5 focus:border-orange-500 shadow-inner"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">
                        {t("Discount Type:", "ڈسکاؤنٹ کی قسم:")}
                      </label>
                      <select
                        value={discType}
                        onChange={(e) => setDiscType(e.target.value)}
                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 font-sans text-sm text-slate-800 focus:border-orange-500"
                      >
                        <option value="Percentage">Percentage (%)</option>
                        <option value="Fixed Amount">Fixed Amount (Rs.)</option>
                        <option value="Volume Based">
                          Volume Based (Ltrs)
                        </option>
                        <option value="Loyalty Program">Loyalty Program</option>
                        <option value="Other">Other (Special)</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-2">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">
                        {t("Customer Name:", "گاہک کا نام:")}
                      </label>
                      <input
                        type="text"
                        value={discCustomer}
                        onChange={(e) => setDiscCustomer(e.target.value)}
                        placeholder="e.g. Umar Ali"
                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 font-sans text-sm focus:border-orange-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">
                        {t("Approved By:", "اجازت دینے والا:")}
                      </label>
                      <input
                        type="text"
                        value={discApprovedBy}
                        onChange={(e) => setDiscApprovedBy(e.target.value)}
                        placeholder="e.g. Umar Ali"
                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 font-sans text-sm focus:border-orange-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-2">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">
                        {t("Product / Fuel:", "ایندھن کی قسم (آپشنل):")}
                      </label>
                      <select
                        value={discProduct}
                        onChange={(e) => setDiscProduct(e.target.value)}
                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 font-sans text-sm text-slate-800 focus:border-orange-500"
                      >
                        <option value="">
                          {t("-- Any --", "-- کوئی بھی --")}
                        </option>
                        {products.map((product) => (
                          <option key={product.id} value={product.id}>
                            {settings.language === "en" ? product.name : product.urduName}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">
                        {t("Reason:", "وجہ:")}
                      </label>
                      <input
                        type="text"
                        value={discReason}
                        onChange={(e) => setDiscReason(e.target.value)}
                        placeholder="e.g. Corporate Rate"
                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 font-sans text-sm outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">
                      {t("Remarks / Notes:", "ریمارکس:")}
                    </label>
                    <input
                      type="text"
                      value={discNotes}
                      onChange={(e) => setDiscNotes(e.target.value)}
                      placeholder="Optional notes..."
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 font-sans text-sm focus:border-orange-500"
                    />
                  </div>

                  <button
                    onClick={handleAddDiscount}
                    className="w-full py-2.5 bg-orange-600 text-white font-sans text-xs font-bold rounded-lg hover:bg-orange-700 cursor-pointer shadow-md shadow-orange-500/10 flex items-center justify-center gap-1.5"
                  >
                    <Plus className="h-4 w-4" />
                    <span>{t("ADD DISCOUNT LOG", "ڈسکاؤنٹ شامل کریں")}</span>
                  </button>

                  <div className="mt-4 border-t border-slate-100 pt-4">
                    <h4 className="font-sans text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                      {t("Discounts Logged:", "اس شفٹ کے ڈسکاؤنٹس:")}
                    </h4>
                    {!activeShift.discountEntries ||
                    activeShift.discountEntries.length === 0 ? (
                      <p className="text-center py-4 font-sans text-xs text-slate-400 border border-slate-100 border-dashed rounded-lg bg-slate-50/50">
                        {t(
                          "No discounts logged yet.",
                          "ابھی تک کوئی ڈسکاؤنٹ درج نہیں۔",
                        )}
                      </p>
                    ) : (
                      <div className="space-y-2 max-h-40 overflow-y-auto">
                        {activeShift.discountEntries.map((d) => (
                          <div
                            key={d.id}
                            className="flex justify-between items-center text-xs p-2 rounded-lg border border-slate-100 bg-slate-50/20"
                          >
                            <div className="font-sans text-slate-700 pr-4">
                              <span className="font-bold">
                                {d.customerName}
                              </span>{" "}
                              — {d.reason}
                              <span className="text-[10px] text-slate-400 block">
                                Appr: {d.approvedBy}
                              </span>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="font-mono font-bold text-orange-600">
                                Rs. {d.amount.toLocaleString()}
                              </span>
                              <button
                                onClick={() => handleDeleteDiscount(d.id)}
                                className="text-red-500 hover:text-red-700 cursor-pointer"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 6: LUBRICANTS SALE */}
              {activeTab === "lube" && (
                <div className="space-y-4">
                  <h3 className="font-sans text-sm font-bold text-slate-800 border-b border-slate-100 pb-2 mb-4 flex items-center justify-between">
                    <span>
                      {t(
                        "🛢️ Itemized Lubricants Shop Cash Registry",
                        "انجن آئل / موبل آئل کی نقد فروخت",
                      )}
                    </span>
                  </h3>

                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-2">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">
                        {t("Select Lubricant Lube:", "موبل آئل منتخب کریں:")}
                      </label>
                      <select
                        value={lubeItemId}
                        onChange={(e) => setLubeItemId(e.target.value)}
                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 font-sans text-sm text-slate-800 shadow-xs focus:border-orange-500"
                      >
                        <option value="">
                          {t("-- Choose lube --", "-- موبل آئل منتخب کریں --")}
                        </option>
                        {products
                          .filter((p) => p.type === "lube")
                          .map((p) => (
                            <option key={p.id} value={p.id}>
                              {settings.language === "en" ? p.name : p.urduName}{" "}
                              ({t(`Rs. ${p.rate}/${p.unit}`, `${p.rate} روپے`)})
                            </option>
                          ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">
                        {t("Quantity Sold:", "فروخت شدہ تعداد:")}
                      </label>
                      <input
                        type="number"
                        value={lubeQty}
                        onChange={(e) => setLubeQty(e.target.value)}
                        placeholder="e.g. 3"
                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 font-mono text-sm focus:border-orange-500"
                      />
                    </div>
                  </div>

                  <div className="mt-2 flex justify-between items-center bg-slate-50 p-3 rounded-lg border border-slate-200 border-dashed animate-pulse">
                    <span className="font-sans text-xs font-semibold text-slate-500">
                      {t("Auto-calculated price:", "حساب کردہ بننے والی رقم:")}
                    </span>
                    <span className="font-mono text-base font-bold text-slate-800">
                      Rs.{" "}
                      {(
                        (Number(lubeQty) || 0) *
                        (products.find((p) => p.id === lubeItemId)?.rate || 0)
                      ).toLocaleString()}
                    </span>
                  </div>

                  <button
                    onClick={handleAddLube}
                    className="w-full py-2.5 bg-orange-600 text-white font-sans text-xs font-bold rounded-lg hover:bg-orange-700 cursor-pointer shadow-md shadow-orange-500/10 flex items-center justify-center gap-1.5"
                  >
                    <Plus className="h-4 w-4" />
                    <span>
                      {t("ADD LUBRICANT SALE", "انجن آئل فروخت شامل کریں")}
                    </span>
                  </button>

                  <div className="mt-4 border-t border-slate-100 pt-4">
                    <h4 className="font-sans text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                      {t(
                        "Lube Sales This Shift:",
                        "اس شفٹ میں موبل آئل فروخت:",
                      )}
                    </h4>
                    {activeShift.lubeSales.length === 0 ? (
                      <p className="text-center py-4 font-sans text-xs text-slate-400 border border-slate-100 border-dashed rounded-lg bg-slate-50/50">
                        {t(
                          "No lube products listed.",
                          "کوئی انجن آئل فروخت نہیں ہوئی۔",
                        )}
                      </p>
                    ) : (
                      <div className="space-y-2 max-h-40 overflow-y-auto">
                        {activeShift.lubeSales.map((l) => {
                          const name =
                            products.find((p) => p.id === l.itemId)?.name ||
                            "Lube";
                          return (
                            <div
                              key={l.id}
                              className="flex justify-between items-center text-xs p-2 rounded-lg border border-slate-100 bg-slate-50/20"
                            >
                              <div className="font-sans text-slate-700 pr-4">
                                <span className="font-bold">{name}</span> —{" "}
                                {l.quantity} Can(s) sold @ Rs. {l.price}
                              </div>
                              <div className="flex items-center gap-3">
                                <span className="font-mono font-bold text-orange-655">
                                  Rs. {l.amount.toLocaleString()}
                                </span>
                                <button
                                  onClick={() => handleDeleteLube(l.id)}
                                  className="text-red-500 hover:text-red-700 cursor-pointer"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 7: SUPPLIER DEPOT PAYMENTS */}
              {activeTab === "supplier" && (
                <div className="space-y-4">
                  <h3 className="font-sans text-sm font-bold text-slate-800 border-b border-slate-100 pb-2 mb-4 flex items-center justify-between">
                    <span>
                      {t(
                        "🏭 Wholesale Depot Clearings & Payments",
                        "آئل مارکیٹنگ کمپنی سپلائر کا چالان",
                      )}
                    </span>
                  </h3>

                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-2">
                    <div>
                      <div className="flex justify-between items-center mb-1.5">
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide">
                          {t("Select Oil Depot Supplier:", "سپلائر آئل کمپنی:")}
                        </label>
                        {onAddSupplier && (
                          <button
                            onClick={() => setShowQuickSupplier(true)}
                            className="text-[9px] font-bold text-orange-600 uppercase tracking-widest bg-orange-50 px-2 py-0.5 rounded-full hover:bg-orange-100 transition-colors pointer-events-auto"
                          >
                            + {t("Quick Add", "نئی انٹری")}
                          </button>
                        )}
                      </div>
                      {showQuickSupplier ? (
                        <form
                          onSubmit={handleQuickAddSupplier}
                          className="flex gap-2"
                        >
                          <input
                            autoFocus
                            type="text"
                            placeholder={t(
                              "Enter Supplier...",
                              "سپلائر کا نام...",
                            )}
                            value={quickSupplierName}
                            onChange={(e) =>
                              setQuickSupplierName(e.target.value)
                            }
                            className="w-full rounded-lg border border-orange-300 bg-white px-3 py-2 font-sans text-sm text-slate-800 shadow-xs focus:border-orange-500 outline-none"
                          />
                          <button
                            type="submit"
                            className="bg-orange-600 text-white px-3 py-2 rounded-lg font-bold text-xs uppercase shadow-sm"
                          >
                            {t("Save", "سیو")}
                          </button>
                          <button
                            type="button"
                            onClick={() => setShowQuickSupplier(false)}
                            className="bg-slate-200 text-slate-600 px-3 py-2 rounded-lg font-bold text-xs uppercase"
                          >
                            X
                          </button>
                        </form>
                      ) : (
                        <select
                          value={supId}
                          onChange={(e) => setSupId(e.target.value)}
                          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 font-sans text-sm text-slate-800 shadow-xs focus:border-orange-500"
                        >
                          <option value="">
                            {t(
                              "-- Select PSO/Hascol --",
                              "-- کمپنی منتخب کریں --",
                            )}
                          </option>
                          {suppliers.map((s) => (
                            <option key={s.id} value={s.id}>
                              {settings.language === "en" ? s.name : s.urduName}{" "}
                              (
                              {t(
                                `Payable: Rs. ${s.balance}`,
                                `بل: ${s.balance} روپے`,
                              )}
                              )
                            </option>
                          ))}
                        </select>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">
                        {t("Amount Paid:", "ادا رقم (روپے):")}
                      </label>
                      <input
                        type="number"
                        value={supAmount}
                        onChange={(e) => setSupAmount(e.target.value)}
                        placeholder="e.g. 100000"
                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 font-mono text-sm focus:border-orange-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">
                        {t("Clearance Mode:", "طریقہ ادائیگی:")}
                      </label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {["cash", "cheque", "transfer"].map((m) => (
                          <button
                            key={m}
                            type="button"
                            onClick={() => setSupMode(m as any)}
                            className={`py-2 rounded-lg border font-sans text-xs font-bold transition-all cursor-pointer ${
                              supMode === m
                                ? "border-orange-500 bg-orange-50 text-orange-700"
                                : "border-slate-200 bg-white text-slate-500"
                            }`}
                          >
                            {t(m.toUpperCase(), m)}
                          </button>
                        ))}
                      </div>
                    </div>

                    {supMode === "transfer" ? (
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">
                          {t(
                            "Source Station Bank Account:",
                            "سٹیشن بینک اکاؤنٹ:",
                          )}
                        </label>
                        <select
                          value={supBankAcct}
                          onChange={(e) => setSupBankAcct(e.target.value)}
                          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 font-sans text-xs text-slate-800 shadow-xs focus:border-orange-500"
                        >
                          <option value="">
                            {t(
                              "-- Choose account --",
                              "-- اکاؤنٹ منتخب کریں --",
                            )}
                          </option>
                          {banks.map((bk) => (
                            <option key={bk.id} value={bk.id}>
                              {bk.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    ) : (
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">
                          {t(
                            "Cheque / Receipt Reference:",
                            "چیک نمبر / چالان رسید:",
                          )}
                        </label>
                        <input
                          type="text"
                          value={supRef}
                          onChange={(e) => setSupRef(e.target.value)}
                          placeholder="e.g. CHQ-88942"
                          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 font-sans text-sm focus:border-orange-500"
                        />
                      </div>
                    )}
                  </div>

                  <button
                    onClick={handleAddSupplier}
                    className="w-full py-2.5 bg-orange-600 text-white font-sans text-xs font-bold rounded-lg hover:bg-orange-700 cursor-pointer shadow-md shadow-orange-500/10 flex items-center justify-center gap-1.5"
                  >
                    <Plus className="h-4 w-4" />
                    <span>
                      {t("RECORD SUPPLIER PAYMENT", "ادا شدہ بل شامل کریں")}
                    </span>
                  </button>

                  <div className="mt-4 border-t border-slate-100 pt-4">
                    <h4 className="font-sans text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                      {t(
                        "Supplier Payments Settle:",
                        "سپلائر کو کی گئی ادائیگی:",
                      )}
                    </h4>
                    {activeShift.supplierPayments.length === 0 ? (
                      <p className="text-center py-4 font-sans text-xs text-slate-400 border border-slate-100 border-dashed rounded-lg bg-slate-50/50">
                        {t(
                          "No supplier adjustments created.",
                          "کوئی رقم ابھی ادا نہیں ہوئی۔",
                        )}
                      </p>
                    ) : (
                      <div className="space-y-2 max-h-40 overflow-y-auto">
                        {activeShift.supplierPayments.map((s) => {
                          const name =
                            suppliers.find((su) => su.id === s.supplierId)
                              ?.name || "Supplier";
                          return (
                            <div
                              key={s.id}
                              className="flex justify-between items-center text-xs p-2 rounded-lg border border-slate-100 bg-slate-50/20"
                            >
                              <div className="font-sans text-slate-700 pr-4">
                                <span className="font-bold">{name}</span> —
                                Settle via{" "}
                                <span className="uppercase text-red-650 font-semibold">
                                  {s.mode}
                                </span>{" "}
                                {s.reference && `(${s.reference})`}
                              </div>
                              <div className="flex items-center gap-3">
                                <span className="font-mono font-bold text-red-550">
                                  Rs. {s.amount.toLocaleString()}
                                </span>
                                <button
                                  onClick={() => handleDeleteSupplier(s.id)}
                                  className="text-red-500 hover:text-red-700 cursor-pointer"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}
              {/* TAB: RATE CHANGE (MID-SHIFT REVISION) */}
              {activeTab === "rateChange" && activeShift?.pendingPriceRevisions && (
                <ShiftNozzleReadings
                  t={t}
                  activeShift={activeShift}
                  products={products}
                  nozzles={nozzles}
                  snapshotReadings={snapshotReadings}
                  setSnapshotReadings={setSnapshotReadings}
                  snapshotOverride={snapshotOverride}
                  setSnapshotOverride={setSnapshotOverride}
                  snapshotPin={snapshotPin}
                  setSnapshotPin={setSnapshotPin}
                  handleCaptureSnapshot={handleCaptureSnapshot}
                />
              )}
            </div>
          </div>
        </div>
      )}

      {/* ==========================================
          STEP 4: CLOSING NOZZLES METER CORRELATION
          ========================================== */}
      {wizardStep === 4 && activeShift && (
        <ClosingReadingsForm
          t={t}
          setIsClosingScannerOpen={setIsClosingScannerOpen}
          nozzles={nozzles}
          products={products}
          fuelRates={fuelRates}
          activeShift={activeShift}
          closingReadings={closingReadings}
          setClosingReadings={setClosingReadings}
          setWizardStep={setWizardStep}
          handleConfirmClosings={handleConfirmClosings}
        />
      )}

      {/* ==========================================
          STEP 5: WASTAGE / TESTING DEDUCTIONS
          ========================================== */}
      {wizardStep === 5 && activeShift && (
        <ShiftWastage
          t={t}
          testPetrol={testPetrol}
          setTestPetrol={setTestPetrol}
          testDiesel={testDiesel}
          setTestDiesel={setTestDiesel}
          testCNG={testCNG}
          setTestCNG={setTestCNG}
          setWizardStep={setWizardStep}
          handleConfirmTests={handleConfirmTests}
        />
      )}

      {/* ==========================================
          STEP 6: EXPECTED CASH AUDIT RECONCILIATIONS
          ========================================== */}
      {wizardStep === 6 && activeShift && expectedTotals && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-5 items-start">
          {/* Detailed Calculations Columns */}
          <div className="lg:col-span-3 rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
            <h3 className="font-sans text-sm font-bold text-slate-800 border-b border-slate-100 pb-2 mb-4 uppercase tracking-wider flex items-center justify-between">
              <span>
                {t(
                  "📊 Expected Shift Cash Ledger Audit",
                  "متوقع سیشن کیش تفصیلی صراحت",
                )}
              </span>
              <span className="font-mono text-xs rounded-full bg-slate-100 text-slate-500 px-2.5 py-0.5">
                FORMULATION
              </span>
            </h3>

            {/* Sales Accruals Breakdown */}
            <div className="space-y-2 border-b border-dashed border-slate-100 pb-3 font-sans text-xs">
              <strong className="block text-[11px] font-bold text-slate-400 uppercase tracking-wide mb-1.5">
                {t(
                  "A. SALES LIQUID ACCRUANCE:",
                  "الف۔ پمپس سے حاصل شدہ کل فروخت:",
                )}
              </strong>
              {expectedTotals.petrolSales > 0 && (
                <div className="flex justify-between">
                  <span>
                    Petrol Volume sold ({expectedTotals.petrolLiters.toFixed(2)}L)
                  </span>
                  <span className="font-mono">
                    Rs. {expectedTotals.petrolSales.toLocaleString()}
                  </span>
                </div>
              )}
              {expectedTotals.dieselSales > 0 && (
                <div className="flex justify-between">
                  <span>
                    Diesel Volume sold ({expectedTotals.dieselLiters.toFixed(2)}L)
                  </span>
                  <span className="font-mono">
                    Rs. {expectedTotals.dieselSales.toLocaleString()}
                  </span>
                </div>
              )}
              {expectedTotals.cngSales > 0 && (
                <div className="flex justify-between">
                  <span>
                    CNG Volume sold ({expectedTotals.cngKgs.toFixed(2)}KG)
                  </span>
                  <span className="font-mono">
                    Rs. {expectedTotals.cngSales.toLocaleString()}
                  </span>
                </div>
              )}
              {expectedTotals.lubeSales > 0 && (
                <div className="flex justify-between">
                  <span>Lubricants shop cash</span>
                  <span className="font-mono">
                    Rs. {expectedTotals.lubeSales.toLocaleString()}
                  </span>
                </div>
              )}
              <div className="flex justify-between border-t border-slate-100 pt-1.5 font-bold text-slate-700">
                <span>{t("GROSS STATION SALES", "مجموعی فروخت")}</span>
                <span className="font-mono">
                  Rs. {expectedTotals.grossSales.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Subtract Non-Cash Debits */}
            <div className="space-y-2 border-b border-dashed border-slate-100 pb-3 pt-1 font-sans text-xs text-red-650">
              <strong className="block text-[11px] font-bold text-slate-400 uppercase tracking-wide mb-1.5">
                {t(
                  "B. SUBTRACT CREDIT SALES / OUTFLOWS:",
                  "ب۔ منہا کی جانے والی رقم (ادھار/اخراجات):",
                )}
              </strong>
              <div className="flex justify-between">
                <span>(–) Debt/Credit Sales given</span>
                <span className="font-mono">
                  – Rs. {expectedTotals.debits.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span>(–) Operational expenses paid</span>
                <span className="font-mono">
                  – Rs. {expectedTotals.expenses.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span>(–) Supplier cleared payments</span>
                <span className="font-mono">
                  – Rs. {expectedTotals.supplierPmts.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span>(–) Bank cash deposited</span>
                <span className="font-mono">
                  – Rs. {expectedTotals.bank.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span>(–) Digital / POS card sales</span>
                <span className="font-mono">
                  – Rs. {expectedTotals.digital.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Add Recoveries */}
            <div className="space-y-2 border-b border-slate-100 pb-3 pt-1 font-sans text-xs text-emerald-650">
              <strong className="block text-[11px] font-bold text-slate-400 uppercase tracking-wide mb-1.5">
                {t(
                  "C. ADD RECOVERED OUTSTANDINGS:",
                  "ج۔ شامل کیجئے (وصولی نقد فیس):",
                )}
              </strong>
              <div className="flex justify-between">
                <span>(+) Customer recovery cash collected</span>
                <span className="font-mono">
                  + Rs. {expectedTotals.recoveries.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Grand Expected */}
            <div className="bg-indigo-50 border border-indigo-150 rounded-lg p-3.5 flex items-center justify-between font-sans shadow-sm">
              <div>
                <strong className="text-[11px] uppercase text-indigo-600 block tracking-wider leading-none">
                  {t(
                    "D. TOTAL EXPECTED PHYSICAL CASH:",
                    "د۔ حتمی مطلوبہ دراز کیش رقم:",
                  )}
                </strong>
                <span className="text-[10px] text-indigo-500 mt-1 block">
                  Expected = GROSS + RECOV - CREDIT - EXP - DEP - ESCROW
                </span>
              </div>
              <span className="font-mono text-lg font-bold text-indigo-700">
                Rs. {expectedTotals.expectedCash.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Submitted inputs Auditor columns */}
          <div className="lg:col-span-2 rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
            <h3 className="font-sans text-sm font-bold text-slate-800 border-b border-slate-100 pb-2 mb-4 uppercase tracking-wider">
              {t("💰 Operator Cash Submission", "کیش ملان اور تسلیم شد بل")}
            </h3>

            <div className="space-y-4">
              <div>
                <label className="mb-2 block font-sans text-xs font-bold text-slate-500 uppercase tracking-wider">
                  {t(
                    "Amount Submitted by Salesman:",
                    "سیلزمین کی جمع پیش کردہ کیش رقم:",
                  )}
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={submittedCash}
                    onChange={(e) => setSubmittedCash(e.target.value)}
                    placeholder="e.g. 80000"
                    className="w-full rounded-lg border border-slate-200 bg-white py-3 pl-3 pr-10 font-mono text-base font-bold text-slate-800 focus:border-orange-500 focus:outline-hidden"
                  />
                  <span className="absolute inset-y-0 right-0 py-3.5 pr-3 text-slate-450 font-mono text-sm">
                    Rs
                  </span>
                </div>
              </div>

              {/* Real-time Shortage/Overage metrics ticker */}
              {submittedCash !== "" && (
                <div className="rounded-lg p-4 font-sans text-xs space-y-2.5 border">
                  {Number(submittedCash) === expectedTotals.expectedCash ? (
                    <div className="text-center font-bold text-emerald-600 bg-emerald-50 border border-emerald-150 p-2 rounded-md">
                      ✅{" "}
                      {t(
                        "Shift Cash Perfect Balanced",
                        "کیش بالکل پورہ ہے۔ ملان کامیاب!",
                      )}
                    </div>
                  ) : Number(submittedCash) < expectedTotals.expectedCash ? (
                    <div className="space-y-1 font-sans">
                      <div className="flex justify-between text-red-700 font-bold bg-ref bg-red-50 border border-red-150 p-2.5 rounded-md">
                        <span>
                          ⚠️{" "}
                          {t(
                            "SHORTAGE DETECTED (LOSS)",
                            "کیش میں کمی پائی گئی ہے",
                          )}
                        </span>
                        <span className="font-mono">
                          Rs.{" "}
                          {(
                            expectedTotals.expectedCash - Number(submittedCash)
                          ).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 leading-tight pt-1.5 pl-1.5">
                        {t(
                          "Shortages will be assigned to staff advances payroll file as deductible balance.",
                          "کیش کی یہ کمی آپریٹر کے ایڈوانس کھاتے میں شامل ہوگی۔",
                        )}
                      </p>
                    </div>
                  ) : (
                    <div className="flex justify-between text-teal-700 font-bold bg-teal-50 border border-teal-150 p-2.5 rounded-md">
                      <span>
                        ✅{" "}
                        {t(
                          "OVERAGE DETECTED (PROFIT)",
                          "کیش فالتو پایا گیا ہے",
                        )}
                      </span>
                      <span className="font-mono">
                        Rs.{" "}
                        {(
                          Number(submittedCash) - expectedTotals.expectedCash
                        ).toLocaleString()}
                      </span>
                    </div>
                  )}
                </div>
              )}

              <div className="flex gap-2.5 pt-4">
                <button
                  onClick={() => setWizardStep(5)}
                  className="w-1/3 py-3 border border-slate-200 bg-white font-sans text-xs font-bold text-slate-655 rounded-lg hover:bg-slate-50"
                >
                  {t("← Back", "← واپس")}
                </button>
                <button
                  onClick={handleConfirmCashMatch}
                  className="flex-1 py-3 bg-orange-600 hover:bg-orange-700 text-white font-sans text-xs font-bold rounded-lg shadow-md transition-all cursor-pointer"
                >
                  {t("Review Shift Receipt →", "رسیپٹ کا جائزہ لیں →")}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==========================================
          STEP 7: FINAL COMPREHENSIVE SHIFT RECEIPT CARD
          ========================================== */}
      {wizardStep === 7 && activeShift && expectedTotals && (
        <div className="mx-auto max-w-xl rounded-xl border border-slate-200 bg-white shadow-lg overflow-hidden">
          {/* Accent Header */}
          <div className="bg-linear-to-r from-orange-600 to-amber-600 px-6 py-5 text-white flex justify-between items-center">
            <div className="space-y-0.5">
              <span className="text-[10px] tracking-widest font-bold uppercase block text-orange-200">
                PSO PetroBook Receipts
              </span>
              <h3 className="font-sans text-lg font-bold tracking-tight">
                {t("SHIFT CLOSEOUT STATEMENT", "کاروباری شفٹ کا حتمی بل")}
              </h3>
            </div>

            <span className="rounded-md bg-white/20 px-2.5 py-1 font-mono text-[11px] font-bold uppercase tracking-wider">
              {activeShift.type}
            </span>
          </div>

          <div className="p-6 space-y-5 font-sans">
            {/* Metadata Rows */}
            <div className="grid grid-cols-2 sm:grid-cols-2 gap-4 text-xs border-b border-dashed border-slate-100 pb-3 pt-0.5">
              <div>
                <span className="text-slate-400 block">
                  {t("Operator In-charge:", "ڈیوٹی آپریٹر:")}
                </span>
                <strong className="text-slate-800 text-sm">
                  {activeStaffMember
                    ? settings.language === "en"
                      ? activeStaffMember.name
                      : activeStaffMember.urduName
                    : "User"}
                </strong>
              </div>
              <div className="text-right">
                <span className="text-slate-400 block">
                  {t("Record Date & Time:", "تاریخ اور آغاز:")}
                </span>
                <strong className="text-slate-800">
                  {activeShift.date} | {activeShift.startTime}
                </strong>
              </div>
            </div>

            {/* Dynamic sales volumetric summary tables */}
            <div className="space-y-2 border-b border-slate-100 pb-3">
              <strong className="text-[10px] text-slate-450 uppercase font-bold tracking-wider block mb-2">
                {t("PRODUCT VOLUME SALES:", "فیول فروختی حجم کا خلاصہ:")}
              </strong>

              <div className="space-y-1.5 text-xs text-slate-700">
                <div className="flex justify-between">
                  <span>Petrol Super (PMU)</span>
                  <span className="font-mono font-semibold">
                    {expectedTotals.petrolLiters.toFixed(2)} Litre(s) — Rs.{" "}
                    {expectedTotals.petrolSales.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>High Speed Diesel (HSD)</span>
                  <span className="font-mono font-semibold">
                    {expectedTotals.dieselLiters.toFixed(2)} Litre(s) — Rs.{" "}
                    {expectedTotals.dieselSales.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>CNG Gas</span>
                  <span className="font-mono font-semibold">
                    {expectedTotals.cngKgs.toFixed(2)} KG(s) — Rs.{" "}
                    {expectedTotals.cngSales.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Lubricants Stock</span>
                  <span className="font-mono font-semibold">
                    Rs. {expectedTotals.lubeSales.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Outlays balances */}
            <div className="grid grid-cols-2 sm:grid-cols-2 gap-x-6 gap-y-2.5 text-xs border-b border-slate-100 pb-4">
              <div className="flex justify-between">
                <span className="text-slate-450">
                  {t("Debits (Receivables):", "گاہکوں کا بل:")}
                </span>
                <span className="font-mono font-bold text-slate-800">
                  Rs. {expectedTotals.debits.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between pl-4">
                <span className="text-slate-450">
                  {t("Recoveries Collect:", "رقم وصولیاں:")}
                </span>
                <span className="font-mono font-bold text-emerald-600">
                  Rs. {expectedTotals.recoveries.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-450">
                  {t("Expenses Logged:", "موجودہ اخراجات:")}
                </span>
                <span className="font-mono font-bold text-slate-800">
                  Rs. {expectedTotals.expenses.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between pl-4 text-red-600">
                <span className="text-slate-450 font-bold">
                  {t("Discounts Given:", "دیے گئے ڈسکاؤنٹس:")}
                </span>
                <span className="font-mono font-bold">
                  Rs. {expectedTotals.discounts?.toLocaleString() || 0}
                </span>
              </div>
              <div className="flex justify-between pl-4 font-bold text-slate-700">
                <span className="text-slate-450">
                  {t("Deposited Escrow:", "بینک/کارڈ منتقلی:")}
                </span>
                <span className="font-mono">
                  Rs.{" "}
                  {(
                    expectedTotals.bank + expectedTotals.digital
                  ).toLocaleString()}
                </span>
              </div>
            </div>

            {/* Financial Auditing Bottomline */}
            <div className="bg-slate-50 border border-slate-150- rounded-lg p-4 font-mono text-xs space-y-2">
              <div className="flex justify-between text-slate-500">
                <span>{t("EXPECTED DRAWER CASH:", "مطلوبہ دراز کیش:")}</span>
                <span>Rs. {expectedTotals.expectedCash.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-slate-700 font-bold border-b border-dashed border-slate-200 pb-2">
                <span>{t("SUBMITTED CASH:", "سیلزمین کا پیش کردہ کیش:")}</span>
                <span>Rs. {activeShift.submittedCash?.toLocaleString()}</span>
              </div>

              {/* Status Indicator */}
              <div className="flex justify-between items-center text-sm font-semibold pt-1">
                {activeShift.shortage > 0 ? (
                  <>
                    <span className="text-red-650 font-bold">
                      {t("AUDIT DISCREPANCY: -SHORTAGE", "آڈٹ کمی:") +
                        " SHORTAGE ⚠️"}
                    </span>
                    <span className="font-bold text-red-650 bg-red-50 px-2.5 py-0.5 rounded-sm">
                      Rs. {activeShift.shortage.toLocaleString()}
                    </span>
                  </>
                ) : activeShift.overage > 0 ? (
                  <>
                    <span className="text-emerald-650 font-bold">
                      {t("AUDIT ACCRUANCE: +OVERAGE", "آڈٹ آمدنی:") +
                        " OVERAGE ✅"}
                    </span>
                    <span className="font-bold text-emerald-550 bg-emerald-50 px-2.5 py-0.5 rounded-sm">
                      Rs. {activeShift.overage.toLocaleString()}
                    </span>
                  </>
                ) : (
                  <>
                    <span className="text-emerald-650 font-bold">
                      {t("STATEMENT: BALANCED", "سٹیٹمنٹ: بالکل پورہ")}
                    </span>
                    <span className="font-bold text-emerald-555 bg-emerald-50 px-2.5 py-0.5 rounded-sm">
                      Rs. 0
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* ─── SHIFT PROFIT INTELLIGENCE ─────────────────────────────── */}
            {fifoResults.length > 0 && (() => {
              const totalRevenue   = expectedTotals.grossSales;
              const totalCOGS      = fifoResults.reduce((s, r) => s + r.result.totalCOGS, 0);
              const grossProfit    = totalRevenue - totalCOGS;
              const opExpenses     = expectedTotals.expenses;
              const netShiftProfit = grossProfit - opExpenses;
              
              // Sum revaluation gain/loss from unique batches used in this shift
              const uniqueBatchIds = new Set<string>();
              fifoResults.forEach(r => r.result.deductions.forEach(d => uniqueBatchIds.add(d.batchId)));
              const revaluation = Array.from(uniqueBatchIds).reduce((sum, bId) => {
                const b = stockBatches.find(sb => sb.id === bId);
                return sum + (b?.revaluationGainLoss || 0);
              }, 0);
              
              const trueShiftProfit = netShiftProfit + revaluation;
              const grossMarginPct  = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;
              const netMarginPct    = totalRevenue > 0 ? (netShiftProfit / totalRevenue) * 100 : 0;

              const rows = [
                { label: t('Gross Revenue (Sales)',   'مجموعی فروخت'),     value: totalRevenue,    sign: '',  color: 'text-blue-700',    bg: 'bg-blue-50' },
                { label: t('Realized COGS (FIFO)',    'FIFO لاگت'),         value: -totalCOGS,      sign: '−', color: 'text-red-600',     bg: 'bg-red-50' },
                { label: t('Gross Profit',            'مجموعی منافع'),      value: grossProfit,     sign: '=', color: grossProfit >= 0 ? 'text-emerald-700' : 'text-red-700', bg: grossProfit >= 0 ? 'bg-emerald-50' : 'bg-red-50', bold: true },
                { label: t('Operational Expenses',   'آپریشنل اخراجات'), value: -opExpenses,     sign: '−', color: 'text-amber-700',   bg: 'bg-amber-50' },
                { label: t('Net Shift Profit',        'خالص شفٹ منافع'),   value: netShiftProfit,  sign: '=', color: netShiftProfit >= 0 ? 'text-emerald-700' : 'text-red-700', bg: netShiftProfit >= 0 ? 'bg-emerald-50' : 'bg-red-50', bold: true },
              ];

              return (
                <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                  <div className="bg-gradient-to-r from-slate-800 to-slate-900 px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="size-4 text-emerald-400" />
                      <span className="text-xs font-black text-white uppercase tracking-widest">
                        {t('Shift Profit Intelligence', 'شفٹ منافع آگاہی')}
                      </span>
                    </div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">
                      {t('True P&L', 'حقیقی P&L')}
                    </span>
                  </div>
                  <div className="bg-white divide-y divide-slate-50">
                    {rows.map((row, i) => (
                      <div key={i} className={`flex items-center justify-between px-4 py-2.5 ${row.bold ? 'border-t-2 border-dashed border-slate-200' : ''}`}>
                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-black w-4 text-center ${row.color}`}>{row.sign}</span>
                          <span className={`text-xs ${row.bold ? 'font-black text-slate-700' : 'text-slate-500'}`}>{row.label}</span>
                        </div>
                        <span className={`font-mono text-sm font-black ${row.color} ${row.bold ? 'text-base' : ''}`}>
                          Rs.{Math.abs(row.value).toLocaleString('en-PK', { maximumFractionDigits: 0 })}
                        </span>
                      </div>
                    ))}
                  </div>
                  {/* True Profit Banner */}
                  <div className={`px-4 py-3 flex items-center justify-between ${trueShiftProfit >= 0 ? 'bg-gradient-to-r from-emerald-600 to-teal-700' : 'bg-gradient-to-r from-red-600 to-rose-700'}`}>
                    <div>
                      <p className="text-[10px] font-bold text-white/70 uppercase tracking-widest">{t('TRUE SHIFT PROFIT', 'حقیقی شفٹ منافع')}</p>
                      <p className="text-white font-black text-xl font-mono">
                        Rs.{trueShiftProfit.toLocaleString('en-PK', { maximumFractionDigits: 0 })}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-white/70 font-bold uppercase">{t('Gross Margin', 'مجموعی مارجن')}</p>
                      <p className="text-white font-black text-base">{grossMarginPct.toFixed(1)}%</p>
                      <p className="text-[10px] text-white/70 font-bold uppercase mt-0.5">{t('Net Margin', 'خالص مارجن')}</p>
                      <p className="text-white font-black">{netMarginPct.toFixed(1)}%</p>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Auxiliary Printing buttons */}
            <div className="flex gap-2">
              <button
                onClick={() => window.print()}
                className="flex-1 py-2.5 border border-slate-200 text-slate-655 rounded-lg font-sans text-xs font-bold hover:bg-slate-55 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <FileText className="h-4 w-4" />
                <span>{t("Print Statement PDF", "پی ڈی ایف پرنٹ کریں")}</span>
              </button>
              <button
                onClick={() => showToast(t("Summary link copied to clipboard!", "خلاصہ لنک کلپ بورڈ پر کاپی ہو گیا!"), "success")}
                className="px-3.5 border border-slate-200 text-slate-500 rounded-lg hover:bg-slate-50 flex items-center justify-center cursor-pointer"
              >
                <Share2 className="h-4 w-4" />
              </button>
              <button
                onClick={generateAISummary}
                disabled={isGeneratingAiSummary}
                className={`px-4 border border-indigo-200 text-indigo-600 rounded-lg hover:bg-indigo-50 flex items-center justify-center gap-1.5 font-bold text-xs transition-colors cursor-pointer ${isGeneratingAiSummary ? 'opacity-50' : ''}`}
              >
                <Sparkles className={`h-4 w-4 ${isGeneratingAiSummary ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">✨ AI Summary</span>
              </button>
            </div>

            {aiSummary && (
              <div className="bg-indigo-50/50 border border-indigo-100 rounded-lg p-4 font-sans text-sm text-indigo-900 shadow-inner">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="h-4 w-4 text-indigo-500" />
                  <span className="font-bold text-indigo-700">Gemini AI Shift Analysis</span>
                </div>
                <div className="whitespace-pre-wrap leading-relaxed text-xs">
                  {aiSummary}
                </div>
              </div>
            )}

            {/* ─── FIFO BREAKDOWN ─────────────────────────────────────────── */}
            {fifoResults.length > 0 && (
              <div className="border border-indigo-100 rounded-xl overflow-hidden bg-gradient-to-br from-indigo-50 to-slate-50">
                <div className="bg-indigo-600 px-4 py-2 flex items-center gap-2">
                  <BarChart2 className="size-4 text-indigo-200" />
                  <span className="text-xs font-black text-white uppercase tracking-widest">FIFO Realized Margin Breakdown</span>
                </div>
                <div className="p-3 space-y-3">
                  {fifoResults.map(({ productId, productName, result }) => {
                    const avgLandedCost = result.totalLiters > 0 ? result.totalCOGS / result.totalLiters : 0;
                    const avgSellingPrice = result.totalLiters > 0 ? result.totalRevenue / result.totalLiters : 0;
                    const marginPct = result.totalRevenue > 0 ? (result.totalMargin / result.totalRevenue) * 100 : 0;
                    const isPositive = result.totalMargin >= 0;

                    return (
                      <div key={productId} className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                        <div className="px-3 py-2 border-b border-slate-100 flex justify-between items-center">
                          <span className="font-bold text-xs text-slate-700">{productName}</span>
                          <div className="flex items-center gap-2">
                            {result.hasStockDeficit && (
                              <span className="text-[9px] font-black bg-red-100 text-red-700 px-1.5 py-0.5 rounded-full border border-red-200">
                                ⚠️ DEFICIT {result.deficitLiters.toFixed(0)}L
                              </span>
                            )}
                            <span className={`text-xs font-black px-2 py-0.5 rounded-full ${
                              isPositive ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                            }`}>
                              {isPositive ? '▲' : '▼'} Rs.{result.totalMargin.toLocaleString('en-PK', { maximumFractionDigits: 0 })}
                            </span>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-slate-100 text-xs">
                          {[
                            { label: 'Liters', value: `${result.totalLiters.toLocaleString('en-PK', { maximumFractionDigits: 0 })}L`, color: 'text-slate-700' },
                            { label: 'Avg Landed', value: `Rs.${avgLandedCost.toFixed(2)}`, color: 'text-blue-700' },
                            { label: 'Avg Sell', value: `Rs.${avgSellingPrice.toFixed(2)}`, color: 'text-emerald-700' },
                            { label: 'Margin/L', value: `Rs.${result.avgRealizedMarginPerLiter.toFixed(2)}`, color: isPositive ? 'text-emerald-700' : 'text-red-700' },
                          ].map((m, i) => (
                            <div key={i} className="px-2 py-1.5 text-center">
                              <p className="text-slate-400 text-[9px] font-semibold uppercase">{m.label}</p>
                              <p className={`font-black text-xs ${m.color}`}>{m.value}</p>
                            </div>
                          ))}
                        </div>
                        {result.deductions.length > 0 && (
                          <div className="border-t border-slate-50 px-3 py-2">
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Batch Heatmap</p>
                            <div className="space-y-1">
                              {result.deductions.map((d, i) => {
                                const heatPct = result.avgRealizedMarginPerLiter > 0 ? (d.realizedMarginPerLiter / result.avgRealizedMarginPerLiter) * 100 : 50;
                                const isHot = d.realizedMarginPerLiter >= result.avgRealizedMarginPerLiter;
                                return (
                                  <div key={i} className="flex items-center gap-2">
                                    <span className="font-mono text-[9px] text-slate-500 w-28 shrink-0 truncate">{d.batchNumber}</span>
                                    <div className="flex-1 h-3 bg-slate-100 rounded-full overflow-hidden">
                                      <div
                                        className={`h-full rounded-full ${isHot ? 'bg-emerald-400' : 'bg-amber-400'}`}
                                        style={{ width: `${Math.min(100, Math.max(5, heatPct))}%` }}
                                      />
                                    </div>
                                    <span className={`text-[9px] font-black w-20 text-right ${isHot ? 'text-emerald-700' : 'text-amber-700'}`}>
                                      {d.litersDeducted.toFixed(0)}L · Rs.{d.realizedMarginPerLiter.toFixed(2)}/L
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {/* Totals */}
                  <div className="bg-slate-800 rounded-lg p-3 text-white">
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                      {[
                        { label: 'Total Revenue', value: `Rs.${fifoResults.reduce((s,r) => s + r.result.totalRevenue, 0).toLocaleString('en-PK', { maximumFractionDigits: 0 })}`, color: 'text-blue-300' },
                        { label: 'Total COGS', value: `Rs.${fifoResults.reduce((s,r) => s + r.result.totalCOGS, 0).toLocaleString('en-PK', { maximumFractionDigits: 0 })}`, color: 'text-amber-300' },
                        { label: 'Realized Margin', value: `Rs.${fifoResults.reduce((s,r) => s + r.result.totalMargin, 0).toLocaleString('en-PK', { maximumFractionDigits: 0 })}`, color: 'text-emerald-300' },
                      ].map((s, i) => (
                        <div key={i} className="text-center">
                          <p className="text-slate-400 text-[9px] font-semibold uppercase">{s.label}</p>
                          <p className={`font-black text-sm ${s.color}`}>{s.value}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            <button
              onClick={handleFinalShiftSubmission}
              disabled={fifoLoading}
              className={`w-full py-4 text-white font-sans text-sm font-bold tracking-wide rounded-lg flex items-center justify-center gap-2 mt-4 shadow-md transition-all cursor-pointer ${
                fifoLoading ? 'bg-slate-400' : 'bg-orange-600 hover:bg-orange-700'
              }`}
            >
              {fifoLoading ? (
                <><BarChart2 className="h-4 w-4 animate-spin" /><span>{t('Running FIFO Engine...', 'FIFO انجن چل رہا ہے...')}</span></>
              ) : (
                <><Check className="h-4 w-4" /><span>{t("CLOSE & SUBMIT SHIFT SESSION", "شفٹ بند کریں اور لیجرز اپڈیٹ کریں")}</span></>
              )}
            </button>
          </div>
        </div>
      )}

      <AIDocumentScanner
        isOpen={isOpeningScannerOpen}
        onClose={() => setIsOpeningScannerOpen(false)}
        settings={settings}
        extractionPrompt='You are an expert fuel station assistant. Extract the physical meter readings (e.g. 12345.6) for each nozzle shown in the image. Return STRICT JSON where keys are the Nozzle names (e.g. "Nozzle 1", "Nozzle 2") and values are the numeric readings as numbers. Do NOT include markdown backticks.'
        onDataExtracted={handleOpeningAutoFill}
      />

      <AIDocumentScanner
        isOpen={isClosingScannerOpen}
        onClose={() => setIsClosingScannerOpen(false)}
        settings={settings}
        extractionPrompt='You are an expert fuel station assistant. Extract the physical meter readings (e.g. 12345.6) for each nozzle shown in the image. Return STRICT JSON where keys are the Nozzle names (e.g. "Nozzle 1", "Nozzle 2") and values are the numeric readings as numbers. Do NOT include markdown backticks.'
        onDataExtracted={handleClosingAutoFill}
      />
    </div>
  );
}
