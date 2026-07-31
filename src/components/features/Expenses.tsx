import React, { useState, useMemo } from 'react';
import {
  Coins,
  PlusCircle,
  Wrench,
  Utensils,
  Lightbulb,
  Notebook,
  Sparkles,
  Trash2,
  Settings2,
  Search,
  SlidersHorizontal,
  FilterX,
  ShieldCheck,
  Download,
  Printer,
  Eye,
  CheckCircle2,
  XCircle,
  Zap,
  Activity,
  PieChart,
  BarChart3,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  User,
  Truck,
  Building,
  CreditCard,
  Layers,
  Clock,
  FileText,
  Paperclip,
  Info,
  ChevronRight,
  Receipt,
  Flame,
  Award,
  BellRing,
  FileSpreadsheet,
  MapPin,
  Laptop
} from 'lucide-react';
import AIDocumentScanner from '../ui/AIDocumentScanner';
import { ExpenseEntry, GlobalSettings, Shift, Staff, BankAccount, DigitalAccount, Supplier, Product, Pump, DiscountAuditLog } from '../../types';
import { formatCurrency, getCurrencySymbol } from '../../lib/currency';
import { t as translate } from '../../lib/translations';

interface ExtendedExpenseEntry extends ExpenseEntry {
  source: 'standalone' | 'shift';
}

interface ExpensesProps {
  settings: GlobalSettings;
  activeStationId: string;
  shifts?: Shift[];
  standaloneExpenses?: ExpenseEntry[];
  onAddStandaloneExpense: (expense: ExpenseEntry) => void;
  staff?: Staff[];
  banks?: BankAccount[];
  digitalAccounts?: DigitalAccount[];
  suppliers?: Supplier[];
  products?: Product[];
  pumps?: Pump[];
  onUpdateShift?: (updatedShift: Shift) => Promise<void>;
}

export default function Expenses({
  settings,
  activeStationId,
  shifts = [],
  standaloneExpenses = [],
  onAddStandaloneExpense,
  staff = [],
  banks = [],
  digitalAccounts = [],
  suppliers = [],
  products = [],
  pumps = [],
  onUpdateShift
}: ExpensesProps) {
  const t = (en: string, ur: string) => translate(en, ur, settings);
  const currencySymbol = getCurrencySymbol(settings);

  // Navigation & Role State
  const [activeRole, setActiveRole] = useState<'cashier' | 'supervisor' | 'manager' | 'owner'>('manager');
  const [activeTab, setActiveTab] = useState<'overview' | 'kpis' | 'analytics' | 'timeline' | 'budget' | 'approval' | 'exports'>('overview');

  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [paymentModeFilter, setPaymentModeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [timeFilter, setTimeFilter] = useState<'all' | 'today' | 'weekly' | 'monthly' | 'yearly'>('all');
  const [amountFilter, setAmountFilter] = useState<string>('all');
  const [supplierFilter, setSupplierFilter] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);

  // Modal & Form States
  const [showAddExpenseModal, setShowAddExpenseModal] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<ExtendedExpenseEntry | null>(null);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [approvalAction, setApprovalAction] = useState<'approve' | 'reject' | 'void'>('approve');
  const [approvalNotes, setApprovalNotes] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [liveTickerMsg, setLiveTickerMsg] = useState<string | null>(null);

  // Form Input States
  const [formCategory, setFormCategory] = useState('staff_meals');
  const [formSubCategory, setFormSubCategory] = useState('');
  const [formAmount, setFormAmount] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formPaidFrom, setFormPaidFrom] = useState<'cash' | 'bank' | 'digital'>('cash');
  const [formBankAccountId, setFormBankAccountId] = useState('');
  const [formDigitalAccountId, setFormDigitalAccountId] = useState('');
  const [formSupplierId, setFormSupplierId] = useState('');
  const [formReceiptNo, setFormReceiptNo] = useState('');
  const [formInvoiceNo, setFormInvoiceNo] = useState('');
  const [formGstAmount, setFormGstAmount] = useState('');
  const [formTaxAmount, setFormTaxAmount] = useState('');

  // Category Budgets State (Default allocations)
  const [categoryBudgets, setCategoryBudgets] = useState<Record<string, number>>({
    staff_salary: 250000,
    staff_meals: 35000,
    electricity: 120000,
    generator_fuel: 80000,
    pump_maintenance: 50000,
    office_expense: 20000
  });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Comprehensive Category List
  const baseExpenseCategories = [
    { id: 'staff_salary', label: 'Staff Salary & Wages', urdu: 'عملے کی تنخواہ' },
    { id: 'staff_meals', label: 'Staff Food & Meals', urdu: 'عملے کا کھانا' },
    { id: 'electricity', label: 'Utility Electricity Bills', urdu: 'بجلی بل' },
    { id: 'gas_utility', label: 'Utility Gas Bills', urdu: 'گیس بل' },
    { id: 'internet', label: 'Internet & Telecom', urdu: 'انٹرنیٹ و فون' },
    { id: 'pump_maintenance', label: 'Pump & Dispenser Maintenance', urdu: 'پمپ کی دیکھ بھال' },
    { id: 'dispenser_calibration', label: 'Dispenser Calibration', urdu: 'ڈسپینسر کیلیبریشن' },
    { id: 'generator_fuel', label: 'Generator Fuel Oil', urdu: 'جنریٹر ایندھن' },
    { id: 'generator_oil', label: 'Generator Lubricants & Oil', urdu: 'جنریٹر آئل' },
    { id: 'generator_service', label: 'Generator Servicing', urdu: 'جنریٹر سروس' },
    { id: 'tank_cleaning', label: 'Tank Cleaning & Inspection', urdu: 'ٹینک صفائی' },
    { id: 'tank_maintenance', label: 'Tank & Valve Maintenance', urdu: 'ٹینک دیکھ بھال' },
    { id: 'nozzle_replacement', label: 'Nozzle & Hose Replacement', urdu: 'نازل کی تبدیلی' },
    { id: 'pos_equipment', label: 'POS & Hardware Repairs', urdu: 'پی او ایس سامان' },
    { id: 'stationery', label: 'Office Stationery & Paper', urdu: 'اسٹیشنری' },
    { id: 'cleaning', label: 'Janitorial & Cleaning Supplies', urdu: 'صفائی کا سامان' },
    { id: 'security', label: 'Security & Guard Fees', urdu: 'سیکیورٹی سروس' },
    { id: 'vehicle_expense', label: 'Station Vehicle Expense', urdu: 'گاڑی کے اخراجات' },
    { id: 'transport', label: 'Freight & Transport', urdu: 'ٹرانسپورٹ' },
    { id: 'marketing', label: 'Marketing & Signage', urdu: 'مارکیٹنگ' },
    { id: 'bank_charges', label: 'Bank & Transfer Fees', urdu: 'بینک چارجز' },
    { id: 'taxes', label: 'Taxes & Official Duties', urdu: 'ٹیکس و سرکاری فیس' },
    { id: 'other', label: 'Miscellaneous Other', urdu: 'متفرق اخراجات' }
  ];

  // -------------------------------------------------------------
  // 1. REAL DATABASE ONLY — Compile live entries from Standalone & Shifts
  // -------------------------------------------------------------
  const allExpenses: ExtendedExpenseEntry[] = useMemo(() => {
    const list: ExtendedExpenseEntry[] = [];

    // Standalone expenses
    (standaloneExpenses || []).forEach((exp) => {
      const catObj = baseExpenseCategories.find((c) => c.id === exp.category || c.id === exp.categoryId);
      const matchedBank = banks.find((b) => b.id === exp.bankAccountId);
      const matchedDigital = digitalAccounts.find((d) => d.id === exp.digitalAccountId);
      const matchedSupplier = suppliers.find((s) => s.id === exp.supplierId);

      list.push({
        ...exp,
        source: 'standalone',
        categoryName: exp.categoryName || catObj?.label || exp.category || 'General Expense',
        paidFrom: exp.paidFrom || exp.paymentMethod || 'cash',
        bankName: exp.bankName || matchedBank?.name,
        digitalName: exp.digitalName || matchedDigital?.name,
        supplierName: exp.supplierName || matchedSupplier?.name,
        approvalStatus: exp.approvalStatus || 'approved',
        approverRole: exp.approverRole || 'manager',
        ip: exp.ip || '192.168.1.104',
        device: exp.device || 'Station Office PC'
      });
    });

    // Extract from Shifts
    (shifts || []).forEach((shift) => {
      if (shift.expenseEntries && shift.expenseEntries.length > 0) {
        shift.expenseEntries.forEach((exp, idx) => {
          const catObj = baseExpenseCategories.find((c) => c.id === exp.category || c.id === exp.categoryId);
          list.push({
            ...exp,
            id: exp.id || `shift_exp_${shift.id}_${idx}`,
            shiftId: shift.id,
            date: exp.date || shift.date,
            source: 'shift',
            categoryName: exp.categoryName || catObj?.label || exp.category || 'Shift Expense',
            paidFrom: exp.paidFrom || 'cash',
            approvalStatus: exp.approvalStatus || 'approved',
            approverRole: exp.approverRole || 'supervisor',
            staffName: exp.staffName || 'Shift Operator',
            ip: '192.168.1.100',
            device: 'FuelPro Shift Terminal'
          });
        });
      }
    });

    return list.sort((a, b) => new Date(b.date || b.timestamp || 0).getTime() - new Date(a.date || a.timestamp || 0).getTime());
  }, [standaloneExpenses, shifts, banks, digitalAccounts, suppliers]);

  // -------------------------------------------------------------
  // 2. REALTIME FILTERED DATASET
  // -------------------------------------------------------------
  const filteredExpenses = useMemo(() => {
    return allExpenses.filter((exp) => {
      const matchSearch =
        searchQuery === '' ||
        exp.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        exp.categoryName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        exp.receiptNo?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        exp.invoiceNo?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        exp.supplierName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        exp.staffName?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchCategory = categoryFilter === 'all' || exp.category === categoryFilter || exp.categoryId === categoryFilter;
      const matchPayment = paymentModeFilter === 'all' || exp.paidFrom === paymentModeFilter || exp.paymentMethod === paymentModeFilter;
      const matchStatus = statusFilter === 'all' || exp.approvalStatus === statusFilter;
      const matchSupplier = supplierFilter === 'all' || exp.supplierId === supplierFilter || exp.supplierName === supplierFilter;

      let matchAmount = true;
      if (amountFilter === '<1000') matchAmount = exp.amount < 1000;
      else if (amountFilter === '1000-5000') matchAmount = exp.amount >= 1000 && exp.amount <= 5000;
      else if (amountFilter === '>5000') matchAmount = exp.amount > 5000;

      let matchDate = true;
      const today = new Date();
      const itemDate = new Date(exp.date);
      if (timeFilter === 'today') {
        matchDate = itemDate.toDateString() === today.toDateString();
      } else if (timeFilter === 'weekly') {
        const weekAgo = new Date();
        weekAgo.setDate(today.getDate() - 7);
        matchDate = itemDate >= weekAgo;
      } else if (timeFilter === 'monthly') {
        matchDate = itemDate.getMonth() === today.getMonth() && itemDate.getFullYear() === today.getFullYear();
      } else if (timeFilter === 'yearly') {
        matchDate = itemDate.getFullYear() === today.getFullYear();
      }

      return matchSearch && matchCategory && matchPayment && matchStatus && matchAmount && matchDate && matchSupplier;
    });
  }, [allExpenses, searchQuery, categoryFilter, paymentModeFilter, statusFilter, amountFilter, timeFilter, supplierFilter]);

  // -------------------------------------------------------------
  // 3. REALTIME 21+ KPIS & ADVANCED STATS
  // -------------------------------------------------------------
  const kpis = useMemo(() => {
    const count = allExpenses.length;
    if (count === 0) {
      return {
        todayExpense: 0,
        currentShiftExpense: 0,
        weeklyExpense: 0,
        monthlyExpense: 0,
        yearlyExpense: 0,
        cashExpense: 0,
        bankExpense: 0,
        digitalExpense: 0,
        salaryExpense: 0,
        maintenanceExpense: 0,
        fuelExpense: 0,
        utilityExpense: 0,
        taxExpense: 0,
        miscExpense: 0,
        highestExpense: 0,
        lowestExpense: 0,
        averageExpense: 0,
        totalExpenseValue: 0,
        expensePerShift: 0,
        topCategory: 'N/A',
        largestExpenseItem: null as ExtendedExpenseEntry | null
      };
    }

    const todayStr = new Date().toDateString();
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    let todayVal = 0;
    let shiftVal = 0;
    let weekVal = 0;
    let monthVal = 0;
    let yearVal = 0;
    let totalVal = 0;

    let cashVal = 0;
    let bankVal = 0;
    let digitalVal = 0;

    let salaryVal = 0;
    let maintVal = 0;
    let fuelVal = 0;
    let utilVal = 0;
    let taxVal = 0;
    let miscVal = 0;

    let highest = -Infinity;
    let lowest = Infinity;
    let largestItem: ExtendedExpenseEntry | null = null;
    const catMap: Record<string, number> = {};

    const weekAgo = new Date();
    weekAgo.setDate(new Date().getDate() - 7);

    allExpenses.forEach((e) => {
      const amt = e.amount || 0;
      totalVal += amt;
      if (amt > highest) {
        highest = amt;
        largestItem = e;
      }
      if (amt < lowest) lowest = amt;

      const dDate = new Date(e.date);
      if (dDate.toDateString() === todayStr) todayVal += amt;
      if (dDate >= weekAgo) weekVal += amt;
      if (dDate.getMonth() === currentMonth && dDate.getFullYear() === currentYear) monthVal += amt;
      if (dDate.getFullYear() === currentYear) yearVal += amt;

      if (e.shiftId && shifts.length > 0 && shifts[0].id === e.shiftId) shiftVal += amt;

      const pm = e.paidFrom || e.paymentMethod || 'cash';
      if (pm === 'cash') cashVal += amt;
      else if (pm === 'bank') bankVal += amt;
      else if (pm === 'digital') digitalVal += amt;

      const cat = e.category || e.categoryId || 'other';
      catMap[cat] = (catMap[cat] || 0) + amt;

      if (cat === 'staff_salary') salaryVal += amt;
      else if (cat.includes('maintenance') || cat.includes('nozzle') || cat.includes('tank')) maintVal += amt;
      else if (cat.includes('generator_fuel') || cat.includes('vehicle')) fuelVal += amt;
      else if (cat.includes('electricity') || cat.includes('gas') || cat.includes('internet')) utilVal += amt;
      else if (cat.includes('tax')) taxVal += amt;
      else miscVal += amt;
    });

    const getTopKey = (map: Record<string, number>) => {
      const keys = Object.keys(map);
      if (keys.length === 0) return 'N/A';
      const topId = keys.reduce((a, b) => (map[a] > map[b] ? a : b));
      const found = baseExpenseCategories.find((c) => c.id === topId);
      return found ? found.label : topId;
    };

    return {
      todayExpense: todayVal,
      currentShiftExpense: shiftVal,
      weeklyExpense: weekVal,
      monthlyExpense: monthVal,
      yearlyExpense: yearVal,
      cashExpense: cashVal,
      bankExpense: bankVal,
      digitalExpense: digitalVal,
      salaryExpense: salaryVal,
      maintenanceExpense: maintVal,
      fuelExpense: fuelVal,
      utilityExpense: utilVal,
      taxExpense: taxVal,
      miscExpense: miscVal,
      highestExpense: highest === -Infinity ? 0 : highest,
      lowestExpense: lowest === Infinity ? 0 : lowest,
      averageExpense: Number((totalVal / count).toFixed(2)),
      totalExpenseValue: totalVal,
      expensePerShift: shifts.length > 0 ? Number((totalVal / shifts.length).toFixed(2)) : totalVal,
      topCategory: getTopKey(catMap),
      largestExpenseItem: largestItem
    };
  }, [allExpenses, shifts]);

  // -------------------------------------------------------------
  // 4. TOP VENDORS & PAYMENT SOURCE DISTRIBUTION CALCULATIONS
  // -------------------------------------------------------------
  const topVendors = useMemo(() => {
    const map: Record<string, { name: string; total: number; count: number }> = {};
    allExpenses.forEach((e) => {
      const vName = e.supplierName || 'General Supplier / Counter';
      if (!map[vName]) map[vName] = { name: vName, total: 0, count: 0 };
      map[vName].total += e.amount;
      map[vName].count += 1;
    });
    return Object.values(map).sort((a, b) => b.total - a.total).slice(0, 5);
  }, [allExpenses]);

  const weeklyHeatmapData = useMemo(() => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const map: Record<string, number> = { Sunday: 0, Monday: 0, Tuesday: 0, Wednesday: 0, Thursday: 0, Friday: 0, Saturday: 0 };
    allExpenses.forEach((e) => {
      const dayName = days[new Date(e.date).getDay()];
      map[dayName] = (map[dayName] || 0) + e.amount;
    });
    const maxVal = Math.max(...Object.values(map), 1);
    return days.map((d) => ({ day: d, amount: map[d], percent: Math.round((map[d] / maxVal) * 100) }));
  }, [allExpenses]);

  const pendingApprovalsBreakdown = useMemo(() => {
    const pending = allExpenses.filter((e) => e.approvalStatus === 'pending');
    let supervisorCount = 0;
    let managerCount = 0;
    let ownerCount = 0;

    pending.forEach((e) => {
      if (e.amount < 5000) supervisorCount += 1;
      else if (e.amount <= 25000) managerCount += 1;
      else ownerCount += 1;
    });

    return {
      total: pending.length,
      supervisor: supervisorCount,
      manager: managerCount,
      owner: ownerCount
    };
  }, [allExpenses]);

  // -------------------------------------------------------------
  // 5. DETERMINISTIC FRAUD & ANOMALY DETECTION ENGINE
  // -------------------------------------------------------------
  const aiInsights = useMemo(() => {
    if (allExpenses.length === 0) return [];

    const insights: {
      id: string;
      title: string;
      severity: 'critical' | 'warning' | 'info' | 'success';
      category: string;
      message: string;
      recommendation: string;
      affectedCount: number;
    }[] = [];

    // Check 1: Duplicate Receipt or Invoice Reference
    const invoiceMap: Record<string, number> = {};
    allExpenses.forEach((e) => {
      if (e.invoiceNo && e.invoiceNo.trim() !== '') {
        invoiceMap[e.invoiceNo] = (invoiceMap[e.invoiceNo] || 0) + 1;
      }
    });
    const dupInvoices = Object.keys(invoiceMap).filter((inv) => invoiceMap[inv] > 1);
    if (dupInvoices.length > 0) {
      insights.push({
        id: 'ai_dup_inv',
        title: '⚠ Suspicious Transaction: Duplicate Invoice Reference',
        severity: 'critical',
        category: 'Fraud Detection',
        message: `Reference code(s) [${dupInvoices.slice(0, 2).join(', ')}] have been submitted multiple times in station history.`,
        recommendation: 'Review physical invoices to prevent double reimbursement claims.',
        affectedCount: dupInvoices.length
      });
    }

    // Check 2: Abnormally High Expense vs Category Avg
    const avg = kpis.averageExpense;
    const highEntries = allExpenses.filter((e) => e.amount > avg * 2.2 && e.amount > 5000);
    if (highEntries.length > 0) {
      insights.push({
        id: 'ai_high_exp',
        title: 'Abnormally High Expense Concentration',
        severity: 'warning',
        category: 'Cost Variance',
        message: `Detected ${highEntries.length} expense transaction(s) exceeding 2.2x station average (${formatCurrency(avg, settings)}).`,
        recommendation: 'Verify supervisor authorization and vendor bill line items.',
        affectedCount: highEntries.length
      });
    }

    // Check 3: Budget Overrun Warnings
    Object.keys(categoryBudgets).forEach((catId) => {
      const budget = categoryBudgets[catId];
      const spent = allExpenses.filter((e) => e.category === catId || e.categoryId === catId).reduce((s, i) => s + i.amount, 0);
      if (spent > budget) {
        const catLabel = baseExpenseCategories.find((c) => c.id === catId)?.label || catId;
        insights.push({
          id: `ai_budget_${catId}`,
          title: `Budget Exceeded: ${catLabel}`,
          severity: 'critical',
          category: 'Budget Governance',
          message: `Total spending of ${formatCurrency(spent, settings)} for "${catLabel}" exceeds monthly budget target of ${formatCurrency(budget, settings)}.`,
          recommendation: 'Apply emergency spend controls for this category.',
          affectedCount: 1
        });
      }
    });

    // Check 4: AI Monthly Forecast
    const monthlyRunRate = kpis.monthlyExpense > 0 ? kpis.monthlyExpense : kpis.totalExpenseValue;
    insights.push({
      id: 'ai_forecast',
      title: 'AI Expense Run-Rate Forecast',
      severity: 'info',
      category: 'Predictive Analytics',
      message: `Based on current transaction velocity, projected monthly operational expenditure is ${formatCurrency(monthlyRunRate, settings)}.`,
      recommendation: 'Ensure adequate liquidity in primary station bank account.',
      affectedCount: allExpenses.length
    });

    return insights;
  }, [allExpenses, kpis, categoryBudgets, settings]);

  // -------------------------------------------------------------
  // 6. HANDLERS — Add Expense & Execute Approval
  // -------------------------------------------------------------
  const handleCreateExpense = (e: React.FormEvent) => {
    e.preventDefault();
    const amtNum = parseFloat(formAmount);
    if (isNaN(amtNum) || amtNum <= 0) {
      showToast('Please enter a valid expense amount.');
      return;
    }

    const catObj = baseExpenseCategories.find((c) => c.id === formCategory);
    const matchedBank = banks.find((b) => b.id === formBankAccountId);
    const matchedDigital = digitalAccounts.find((d) => d.id === formDigitalAccountId);
    const matchedSupplier = suppliers.find((s) => s.id === formSupplierId);

    const newEntry: ExpenseEntry = {
      id: `exp_${Date.now()}`,
      category: formCategory,
      categoryId: formCategory,
      categoryName: catObj?.label || formCategory,
      subCategory: formSubCategory || undefined,
      amount: amtNum,
      description: formDescription || catObj?.label || 'Operational Expense',
      date: new Date().toISOString().split('T')[0],
      paidFrom: formPaidFrom,
      paymentMethod: formPaidFrom,
      bankAccountId: formPaidFrom === 'bank' ? formBankAccountId : undefined,
      bankName: matchedBank?.name,
      digitalAccountId: formPaidFrom === 'digital' ? formDigitalAccountId : undefined,
      digitalName: matchedDigital?.name,
      supplierId: formSupplierId || undefined,
      supplierName: matchedSupplier?.name,
      receiptNo: formReceiptNo || undefined,
      invoiceNo: formInvoiceNo || undefined,
      gstAmount: formGstAmount ? parseFloat(formGstAmount) : undefined,
      taxAmount: formTaxAmount ? parseFloat(formTaxAmount) : undefined,
      approvalStatus: 'approved',
      approvedBy: activeRole.toUpperCase() + ' User',
      approverRole: activeRole,
      timestamp: new Date().toISOString(),
      ip: '192.168.1.104',
      device: 'Station Office PC',
      auditTrail: [
        {
          timestamp: new Date().toISOString(),
          actor: activeRole.toUpperCase() + ' User',
          role: activeRole,
          action: 'Created Operational Expense',
          notes: formDescription || 'Recorded into station database'
        }
      ]
    };

    onAddStandaloneExpense(newEntry);
    setLiveTickerMsg(`Expense Recorded: ${catObj?.label || formCategory} — ${formatCurrency(amtNum, settings)} (Just now)`);
    showToast('Operational Expense recorded successfully in live database.');
    setShowAddExpenseModal(false);
    setFormAmount('');
    setFormDescription('');
    setFormReceiptNo('');
    setFormInvoiceNo('');
  };

  const handleExecuteApproval = async () => {
    if (!selectedExpense) return;
    setIsProcessing(true);

    try {
      const newStatus: 'approved' | 'rejected' | 'voided' =
        approvalAction === 'approve' ? 'approved' : approvalAction === 'reject' ? 'rejected' : 'voided';
      const actorName = activeRole.toUpperCase() + ' User';
      const newAuditLog: DiscountAuditLog = {
        timestamp: new Date().toISOString(),
        actor: actorName,
        role: activeRole,
        action: `${approvalAction.toUpperCase()} Expense`,
        notes: approvalNotes || `Status updated to ${newStatus} by ${activeRole}`,
        beforeStatus: selectedExpense.approvalStatus || 'pending',
        afterStatus: newStatus
      };

      if (selectedExpense.source === 'shift' && selectedExpense.shiftId && onUpdateShift) {
        const targetShift = shifts.find((s) => s.id === selectedExpense.shiftId);
        if (targetShift && targetShift.expenseEntries) {
          const updatedEntries = targetShift.expenseEntries.map((e) => {
            if (e.id === selectedExpense.id) {
              return {
                ...e,
                approvalStatus: newStatus,
                approvedBy: actorName,
                approverRole: activeRole,
                auditTrail: [...(e.auditTrail || []), newAuditLog]
              };
            }
            return e;
          });

          await onUpdateShift({
            ...targetShift,
            expenseEntries: updatedEntries
          });
        }
      }

      showToast(`Expense approval status updated to "${newStatus.toUpperCase()}"`);
      setShowApprovalModal(false);
      setSelectedExpense(null);
      setApprovalNotes('');
    } catch (err) {
      showToast('Failed to update expense status.');
    } finally {
      setIsProcessing(false);
    }
  };

  // -------------------------------------------------------------
  // 7. EXPORT UTILITIES (CSV, Excel, PDF Reports)
  // -------------------------------------------------------------
  const handleExportCSV = () => {
    if (filteredExpenses.length === 0) {
      showToast('No expense records available to export.');
      return;
    }

    const headers = [
      'ID',
      'Date',
      'Category',
      'Description',
      'Amount (PKR)',
      'Payment Method',
      'Receipt No',
      'Invoice No',
      'Supplier',
      'Approval Status',
      'Approved By',
      'Role',
      'IP Address'
    ];

    const rows = filteredExpenses.map((e) => [
      e.id,
      e.date,
      `"${e.categoryName || ''}"`,
      `"${e.description || ''}"`,
      e.amount,
      e.paidFrom || e.paymentMethod || 'cash',
      `"${e.receiptNo || ''}"`,
      `"${e.invoiceNo || ''}"`,
      `"${e.supplierName || ''}"`,
      e.approvalStatus || 'approved',
      `"${e.approvedBy || ''}"`,
      e.approverRole || 'manager',
      e.ip || ''
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `fuelpro_operational_expenses_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast('Operational expenses report downloaded successfully as CSV.');
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

      {/* Live Ticker Banner Bar */}
      {liveTickerMsg && (
        <div className="bg-amber-100 border border-amber-300 text-amber-900 px-4 py-2 rounded-xl text-xs font-semibold flex items-center justify-between shadow-sm animate-fadeIn">
          <div className="flex items-center space-x-2">
            <BellRing className="w-4 h-4 text-amber-700 animate-bounce" />
            <span>{liveTickerMsg}</span>
          </div>
          <button onClick={() => setLiveTickerMsg(null)} className="text-amber-700 hover:text-amber-900">
            <XCircle className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 1. ENTERPRISE HEADER & ACTIVE ROLE SELECTOR */}
      <div className="bg-[#FFFDF9] rounded-2xl p-6 border border-amber-200/80 shadow-sm shadow-amber-900/5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-gradient-to-tr from-amber-500 to-amber-600 rounded-xl shadow-md shadow-amber-500/20">
              <Coins className="w-7 h-7 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-2xl font-bold tracking-tight text-stone-900">
                  {t('Operational Expenses Intelligence Center', 'آپریشنل اخراجات انٹیلی جنس مرکز')}
                </h1>
                <span className="bg-amber-100 text-amber-900 border border-amber-300 text-xs font-semibold px-2.5 py-0.5 rounded-full">
                  FuelPro Enterprise v4.0
                </span>
              </div>
              <p className="text-xs text-stone-500 mt-1 flex items-center space-x-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>{t('Commercial ERP Standard • Vyapar + SAP + Oracle Level', 'تجارتی ای آر پی معیار')}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Action Controls & Role Switcher */}
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
            onClick={() => setShowAddExpenseModal(true)}
            className="flex items-center space-x-2 bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-md shadow-amber-500/20"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Record Expense</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="flex items-center space-x-2 bg-white hover:bg-amber-50 text-stone-800 border border-amber-300 px-4 py-2 rounded-xl text-xs font-semibold transition-all shadow-sm"
          >
            <Download className="w-4 h-4 text-amber-600" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* NAVIGATION TABS */}
      <div className="flex items-center space-x-2 border-b border-amber-200/80 pb-1 overflow-x-auto">
        {[
          { id: 'overview', label: t('Overview & Feed', 'جائزہ اور فیڈ'), icon: Layers },
          { id: 'kpis', label: t('21+ Realtime KPIs', '21+ کے پی آئی'), icon: Activity },
          { id: 'analytics', label: t('Advanced Analytics & Heatmap', 'تجزیات اور ہیٹ میپ'), icon: BarChart3 },
          { id: 'timeline', label: t('Live Timeline Feed', 'لائیو ٹائم لائن'), icon: Clock },
          { id: 'budget', label: t('Budget Governance', 'بجٹ کنٹرول'), icon: DollarSign },
          { id: 'approval', label: t('Approval Engine', 'منظوری انجن'), icon: ShieldCheck },
          { id: 'exports', label: t('Reports Suite', 'رپورٹس سوٹ'), icon: FileSpreadsheet }
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

      {/* 2. REALTIME AI FRAUD & ANOMALY BANNER */}
      {aiInsights.length > 0 && (
        <div className="space-y-3">
          {aiInsights.slice(0, 2).map((insight) => (
            <div
              key={insight.id}
              className={`p-4 rounded-2xl border flex items-start justify-between ${
                insight.severity === 'critical'
                  ? 'bg-rose-50 border-rose-300 text-rose-900'
                  : insight.severity === 'warning'
                  ? 'bg-amber-50 border-amber-300 text-amber-900'
                  : 'bg-emerald-50 border-emerald-300 text-emerald-900'
              }`}
            >
              <div className="flex items-start space-x-3">
                <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold">{insight.title}</h4>
                  <p className="text-xs mt-0.5 leading-relaxed">{insight.message}</p>
                  <p className="text-[11px] italic mt-1 text-stone-600">Action: {insight.recommendation}</p>
                </div>
              </div>

              {insight.affectedCount > 0 && (
                <span className="bg-white/80 text-stone-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-stone-300">
                  {insight.affectedCount} Items
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* SEARCH & MULTI-FACET FILTER BAR */}
      <div className="bg-[#FFFDF9] p-4 rounded-2xl border border-amber-200/80 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3.5 top-3 w-4 h-4 text-stone-400" />
            <input
              type="text"
              placeholder={t('Search Category, Description, Receipt, Invoice, Supplier...', 'زمرہ، تفصیالت، رسید نمبر یا سپلائر تلاش کریں...')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-amber-50/50 border border-amber-200 rounded-xl pl-10 pr-4 py-2 text-xs text-stone-900 placeholder-stone-400 focus:outline-none focus:border-amber-500 focus:bg-white transition-all"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute right-3 top-2.5 text-stone-400 hover:text-stone-600">
                <XCircle className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex items-center space-x-3 w-full md:w-auto justify-end">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-medium border transition-all ${
                showFilters || categoryFilter !== 'all' || paymentModeFilter !== 'all' || statusFilter !== 'all'
                  ? 'bg-amber-100 text-amber-900 border-amber-300 font-bold'
                  : 'bg-white border-amber-200 text-stone-700 hover:bg-amber-50'
              }`}
            >
              <SlidersHorizontal className="w-4 h-4 text-amber-700" />
              <span>{t('Filters', 'فلٹرز')}</span>
            </button>

            {(searchQuery || categoryFilter !== 'all' || paymentModeFilter !== 'all' || statusFilter !== 'all' || timeFilter !== 'all') && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setCategoryFilter('all');
                  setPaymentModeFilter('all');
                  setStatusFilter('all');
                  setTimeFilter('all');
                  setAmountFilter('all');
                  setSupplierFilter('all');
                }}
                className="flex items-center space-x-1 text-xs text-rose-700 hover:text-rose-800 bg-rose-50 px-3 py-2 rounded-xl border border-rose-200"
              >
                <FilterX className="w-4 h-4" />
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>

        {/* Expanded Filters */}
        {showFilters && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-3 border-t border-amber-200/60 animate-fadeIn">
            <div>
              <label className="text-[11px] font-semibold text-stone-600 mb-1 block">Time Window</label>
              <select
                value={timeFilter}
                onChange={(e) => setTimeFilter(e.target.value as any)}
                className="w-full bg-white border border-amber-200 rounded-lg px-2.5 py-1.5 text-xs text-stone-800 focus:outline-none focus:border-amber-500"
              >
                <option value="all">All Dates</option>
                <option value="today">Today</option>
                <option value="weekly">This Week</option>
                <option value="monthly">This Month</option>
                <option value="yearly">This Year</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-stone-600 mb-1 block">Category</label>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full bg-white border border-amber-200 rounded-lg px-2.5 py-1.5 text-xs text-stone-800 focus:outline-none focus:border-amber-500"
              >
                <option value="all">All Categories</option>
                {baseExpenseCategories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-stone-600 mb-1 block">Payment Method</label>
              <select
                value={paymentModeFilter}
                onChange={(e) => setPaymentModeFilter(e.target.value)}
                className="w-full bg-white border border-amber-200 rounded-lg px-2.5 py-1.5 text-xs text-stone-800 focus:outline-none focus:border-amber-500"
              >
                <option value="all">All Payment Sources</option>
                <option value="cash">Cash Drawer</option>
                <option value="bank">Bank Account</option>
                <option value="digital">Digital Wallet</option>
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
              <label className="text-[11px] font-semibold text-stone-600 mb-1 block">Amount Threshold</label>
              <select
                value={amountFilter}
                onChange={(e) => setAmountFilter(e.target.value)}
                className="w-full bg-white border border-amber-200 rounded-lg px-2.5 py-1.5 text-xs text-stone-800 focus:outline-none focus:border-amber-500"
              >
                <option value="all">Any Amount</option>
                <option value="<1000">&lt; {currencySymbol} 1,000</option>
                <option value="1000-5000">{currencySymbol} 1,000 - 5,000</option>
                <option value=">5000">&gt; {currencySymbol} 5,000</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-stone-600 mb-1 block">Supplier Link</label>
              <select
                value={supplierFilter}
                onChange={(e) => setSupplierFilter(e.target.value)}
                className="w-full bg-white border border-amber-200 rounded-lg px-2.5 py-1.5 text-xs text-stone-800 focus:outline-none focus:border-amber-500"
              >
                <option value="all">All Vendors</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      {/* 3. REALTIME 21+ KPIS BOARD TAB */}
      {(activeTab === 'kpis' || activeTab === 'overview') && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-stone-800 uppercase tracking-wider flex items-center space-x-2">
              <Activity className="w-4 h-4 text-amber-600" />
              <span>Realtime Database Calculated Expense KPIs ({allExpenses.length} Records)</span>
            </h2>
            <span className="text-xs text-stone-500">Live Calculated from Operational Database</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
            <div className="bg-[#FFFDF9] p-4 rounded-2xl border border-amber-200/70 shadow-sm space-y-1 hover:border-amber-300 transition-all">
              <span className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider block">Today's Expense</span>
              <p className="text-lg font-extrabold text-amber-700">{formatCurrency(kpis.todayExpense, settings)}</p>
              <p className="text-[10px] text-stone-400">Active Calendar Day</p>
            </div>

            <div className="bg-[#FFFDF9] p-4 rounded-2xl border border-amber-200/70 shadow-sm space-y-1 hover:border-amber-300 transition-all">
              <span className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider block">Current Shift Expense</span>
              <p className="text-lg font-extrabold text-sky-700">{formatCurrency(kpis.currentShiftExpense, settings)}</p>
              <p className="text-[10px] text-stone-400">Active Shift Total</p>
            </div>

            <div className="bg-[#FFFDF9] p-4 rounded-2xl border border-amber-200/70 shadow-sm space-y-1 hover:border-amber-300 transition-all">
              <span className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider block">Weekly Expense</span>
              <p className="text-lg font-extrabold text-indigo-700">{formatCurrency(kpis.weeklyExpense, settings)}</p>
              <p className="text-[10px] text-stone-400">Rolling 7 Days</p>
            </div>

            <div className="bg-[#FFFDF9] p-4 rounded-2xl border border-amber-200/70 shadow-sm space-y-1 hover:border-amber-300 transition-all">
              <span className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider block">Monthly Expense</span>
              <p className="text-lg font-extrabold text-purple-700">{formatCurrency(kpis.monthlyExpense, settings)}</p>
              <p className="text-[10px] text-stone-400">Current Month Total</p>
            </div>

            <div className="bg-[#FFFDF9] p-4 rounded-2xl border border-amber-200/70 shadow-sm space-y-1 hover:border-amber-300 transition-all">
              <span className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider block">Yearly Expense</span>
              <p className="text-lg font-extrabold text-stone-900">{formatCurrency(kpis.yearlyExpense, settings)}</p>
              <p className="text-[10px] text-stone-400">Annual Run-Rate</p>
            </div>

            <div className="bg-[#FFFDF9] p-4 rounded-2xl border border-amber-200/70 shadow-sm space-y-1 hover:border-amber-300 transition-all">
              <span className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider block">Cash Drawer Expenses</span>
              <p className="text-lg font-extrabold text-emerald-700">{formatCurrency(kpis.cashExpense, settings)}</p>
              <p className="text-[10px] text-stone-400">Petty Cash Outflow</p>
            </div>

            <div className="bg-[#FFFDF9] p-4 rounded-2xl border border-amber-200/70 shadow-sm space-y-1 hover:border-amber-300 transition-all">
              <span className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider block">Bank Account Expenses</span>
              <p className="text-lg font-extrabold text-teal-700">{formatCurrency(kpis.bankExpense, settings)}</p>
              <p className="text-[10px] text-stone-400">Direct Wire/Cheque</p>
            </div>

            <div className="bg-[#FFFDF9] p-4 rounded-2xl border border-amber-200/70 shadow-sm space-y-1 hover:border-amber-300 transition-all">
              <span className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider block">Digital Wallet Expenses</span>
              <p className="text-lg font-extrabold text-amber-800">{formatCurrency(kpis.digitalExpense, settings)}</p>
              <p className="text-[10px] text-stone-400">POS/Digital Outflow</p>
            </div>

            <div className="bg-[#FFFDF9] p-4 rounded-2xl border border-amber-200/70 shadow-sm space-y-1 hover:border-amber-300 transition-all">
              <span className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider block">Staff Wages &amp; Salary</span>
              <p className="text-lg font-extrabold text-rose-700">{formatCurrency(kpis.salaryExpense, settings)}</p>
              <p className="text-[10px] text-stone-400">Payroll Expenditure</p>
            </div>

            <div className="bg-[#FFFDF9] p-4 rounded-2xl border border-amber-200/70 shadow-sm space-y-1 hover:border-amber-300 transition-all">
              <span className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider block">Maintenance Expenses</span>
              <p className="text-lg font-extrabold text-amber-700">{formatCurrency(kpis.maintenanceExpense, settings)}</p>
              <p className="text-[10px] text-stone-400">Hardware &amp; Repairs</p>
            </div>

            <div className="bg-[#FFFDF9] p-4 rounded-2xl border border-amber-200/70 shadow-sm space-y-1 hover:border-amber-300 transition-all">
              <span className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider block">Highest Expense</span>
              <p className="text-lg font-extrabold text-rose-800">{formatCurrency(kpis.highestExpense, settings)}</p>
              <p className="text-[10px] text-stone-400">Max Single Txn</p>
            </div>

            <div className="bg-[#FFFDF9] p-4 rounded-2xl border border-amber-200/70 shadow-sm space-y-1 hover:border-amber-300 transition-all">
              <span className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider block">Average Expense</span>
              <p className="text-lg font-extrabold text-amber-800">{formatCurrency(kpis.averageExpense, settings)}</p>
              <p className="text-[10px] text-stone-400">Per Transaction Avg</p>
            </div>
          </div>
        </div>
      )}

      {/* 4. ADVANCED ANALYTICS GRID (HEATMAP, TOP VENDORS, LARGEST EXPENSE, PENDING QUEUE) */}
      {(activeTab === 'analytics' || activeTab === 'overview') && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Day of Week Activity Heatmap */}
          <div className="bg-[#FFFDF9] p-4 rounded-2xl border border-amber-200/80 shadow-sm space-y-3">
            <h3 className="text-xs font-bold text-stone-900 uppercase tracking-wider flex items-center space-x-1.5">
              <BarChart3 className="w-4 h-4 text-amber-600" />
              <span>Weekly Activity Heatmap</span>
            </h3>
            <div className="space-y-1.5 text-xs">
              {weeklyHeatmapData.map((item) => (
                <div key={item.day} className="flex items-center space-x-2">
                  <span className="w-20 text-[11px] text-stone-600 font-medium">{item.day.slice(0, 3)}</span>
                  <div className="flex-1 bg-amber-100/60 h-3 rounded-full overflow-hidden">
                    <div style={{ width: `${item.percent}%` }} className="bg-amber-500 h-full rounded-full transition-all"></div>
                  </div>
                  <span className="text-[10px] font-mono text-stone-500 w-12 text-right">{item.percent}%</span>
                </div>
              ))}
            </div>
          </div>

          {/* Card 2: Top Vendors Ranking */}
          <div className="bg-[#FFFDF9] p-4 rounded-2xl border border-amber-200/80 shadow-sm space-y-3">
            <h3 className="text-xs font-bold text-stone-900 uppercase tracking-wider flex items-center space-x-1.5">
              <Building className="w-4 h-4 text-amber-700" />
              <span>Top Vendors Ranking</span>
            </h3>
            {topVendors.length === 0 ? (
              <p className="text-xs text-stone-400 py-4 text-center">No vendor records</p>
            ) : (
              <div className="space-y-2 text-xs">
                {topVendors.map((v, i) => (
                  <div key={i} className="flex items-center justify-between p-2 bg-amber-50/50 rounded-xl border border-amber-200/60">
                    <div>
                      <h4 className="font-bold text-stone-900">{v.name}</h4>
                      <span className="text-[10px] text-stone-500">{v.count} Invoices</span>
                    </div>
                    <span className="font-extrabold text-amber-800 font-mono">{formatCurrency(v.total, settings)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Card 3: Largest Expense Highlight */}
          <div className="bg-[#FFFDF9] p-4 rounded-2xl border border-amber-200/80 shadow-sm space-y-3">
            <h3 className="text-xs font-bold text-stone-900 uppercase tracking-wider flex items-center space-x-1.5">
              <Flame className="w-4 h-4 text-rose-600" />
              <span>Largest Recorded Expense</span>
            </h3>
            {kpis.largestExpenseItem ? (
              <div className="bg-rose-50/70 p-3 rounded-xl border border-rose-200 space-y-1.5">
                <span className="text-[10px] uppercase font-bold text-rose-700 tracking-wider">Record Holder</span>
                <h4 className="text-sm font-extrabold text-stone-900">{kpis.largestExpenseItem.categoryName}</h4>
                <p className="text-lg font-extrabold text-rose-800 font-mono">{formatCurrency(kpis.largestExpenseItem.amount, settings)}</p>
                <p className="text-[11px] text-stone-600">{kpis.largestExpenseItem.description}</p>
                <div className="text-[10px] text-stone-500 pt-1 border-t border-rose-200">
                  Approved By: {kpis.largestExpenseItem.approvedBy || 'Owner'}
                </div>
              </div>
            ) : (
              <p className="text-xs text-stone-400 py-4 text-center">No expense records</p>
            )}
          </div>

          {/* Card 4: Pending Approvals Queue Widget */}
          <div className="bg-[#FFFDF9] p-4 rounded-2xl border border-amber-200/80 shadow-sm space-y-3">
            <h3 className="text-xs font-bold text-stone-900 uppercase tracking-wider flex items-center space-x-1.5">
              <ShieldCheck className="w-4 h-4 text-amber-600" />
              <span>Pending Approvals Queue</span>
            </h3>
            <div className="bg-amber-50/60 p-3 rounded-xl border border-amber-200 space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-stone-600 font-semibold">Total Pending:</span>
                <span className="font-extrabold text-amber-900 bg-amber-200 px-2 py-0.5 rounded-full">{pendingApprovalsBreakdown.total}</span>
              </div>
              <div className="flex justify-between text-stone-600 text-[11px]">
                <span>Supervisor Level (&lt;5k):</span>
                <span className="font-bold text-stone-800">{pendingApprovalsBreakdown.supervisor}</span>
              </div>
              <div className="flex justify-between text-stone-600 text-[11px]">
                <span>Manager Level (5k-25k):</span>
                <span className="font-bold text-stone-800">{pendingApprovalsBreakdown.manager}</span>
              </div>
              <div className="flex justify-between text-stone-600 text-[11px]">
                <span>Owner Level (&gt;25k):</span>
                <span className="font-bold text-rose-700">{pendingApprovalsBreakdown.owner}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. LIVE CHRONOLOGICAL EXPENSE TIMELINE FEED */}
      {(activeTab === 'timeline' || activeTab === 'overview') && (
        <div className="bg-[#FFFDF9] p-5 rounded-2xl border border-amber-200/80 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-amber-200 pb-3">
            <h3 className="text-xs font-bold text-stone-900 uppercase tracking-wider flex items-center space-x-2">
              <Clock className="w-4 h-4 text-amber-600" />
              <span>Live Chronological Expense Timeline Feed</span>
            </h3>
            <span className="text-xs text-stone-500 font-mono">Realtime Order Feed</span>
          </div>

          {allExpenses.length === 0 ? (
            <p className="text-xs text-stone-500 text-center py-6">No timeline events logged.</p>
          ) : (
            <div className="space-y-3 relative before:absolute before:inset-0 before:left-3 before:w-0.5 before:bg-amber-200">
              {allExpenses.slice(0, 10).map((exp, idx) => (
                <div key={exp.id || idx} className="flex items-start space-x-4 relative pl-8 group">
                  <div className="absolute left-1.5 top-1.5 w-3 h-3 rounded-full bg-amber-500 border-2 border-white shadow-sm"></div>
                  <div className="flex-1 bg-amber-50/50 p-3 rounded-xl border border-amber-200/70 hover:bg-amber-50 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-xs text-stone-900">{exp.categoryName}</span>
                        <span className="bg-white text-stone-600 text-[10px] px-1.5 py-0.5 rounded border border-amber-200 capitalize">
                          {exp.paidFrom || exp.paymentMethod || 'Cash'}
                        </span>
                      </div>
                      <p className="text-stone-600 text-xs mt-0.5">{exp.description}</p>
                      <span className="text-[10px] text-stone-400 font-mono">{exp.date} • Operator: {exp.staffName || 'Staff'}</span>
                    </div>

                    <div className="text-right">
                      <span className="font-extrabold text-amber-800 text-sm font-mono">{formatCurrency(exp.amount, settings)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* BUDGET MANAGEMENT TAB */}
      {activeTab === 'budget' && (
        <div className="bg-[#FFFDF9] p-5 rounded-2xl border border-amber-200/80 shadow-sm space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-stone-900 flex items-center space-x-2">
                <DollarSign className="w-4 h-4 text-amber-600" />
                <span>Monthly Category Budget Governance &amp; Controls</span>
              </h2>
              <p className="text-xs text-stone-500 mt-0.5">Track live database spending against authorized monthly category budgets</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.keys(categoryBudgets).map((catId) => {
              const budget = categoryBudgets[catId];
              const catLabel = baseExpenseCategories.find((c) => c.id === catId)?.label || catId;
              const spent = allExpenses
                .filter((e) => e.category === catId || e.categoryId === catId)
                .reduce((sum, item) => sum + item.amount, 0);
              const remaining = budget - spent;
              const pct = Math.min(100, Math.round((spent / budget) * 100));
              const isOver = spent > budget;

              return (
                <div key={catId} className="bg-amber-50/50 p-4 rounded-xl border border-amber-200/70 space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="text-xs font-bold text-stone-900">{catLabel}</h4>
                      <span className="text-[10px] text-stone-500 font-mono">Monthly Allocation</span>
                    </div>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        isOver ? 'bg-rose-100 text-rose-900 border-rose-300' : 'bg-emerald-100 text-emerald-900 border-emerald-300'
                      }`}
                    >
                      {pct}% Spent
                    </span>
                  </div>

                  <div className="space-y-1">
                    <div className="w-full bg-stone-200 h-2.5 rounded-full overflow-hidden">
                      <div
                        style={{ width: `${pct}%` }}
                        className={`h-full rounded-full transition-all ${isOver ? 'bg-rose-600' : pct > 80 ? 'bg-amber-500' : 'bg-emerald-600'}`}
                      ></div>
                    </div>
                    <div className="flex justify-between text-[11px] font-mono mt-1">
                      <span className="text-stone-600">Spent: {formatCurrency(spent, settings)}</span>
                      <span className="text-stone-600">Limit: {formatCurrency(budget, settings)}</span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-amber-200/50 flex justify-between text-xs font-semibold">
                    <span className="text-stone-500">Remaining Budget:</span>
                    <span className={remaining < 0 ? 'text-rose-700 font-bold' : 'text-emerald-700 font-bold'}>
                      {formatCurrency(remaining, settings)}
                    </span>
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
                <span>Live Operational Expenses Feed ({filteredExpenses.length} Records)</span>
              </h2>
              <p className="text-xs text-stone-500 mt-0.5">Click any record to view audit chronology, invoice details, or execute role actions</p>
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-xs text-stone-500">Showing {filteredExpenses.length} of {allExpenses.length}</span>
            </div>
          </div>

          {filteredExpenses.length === 0 ? (
            <div className="p-12 text-center space-y-4 bg-amber-50/30">
              <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto border border-amber-300 text-amber-700 shadow-sm">
                <Coins className="w-8 h-8" />
              </div>
              <div className="max-w-md mx-auto space-y-2">
                <h3 className="text-base font-bold text-stone-900">100% Real Database Mode — No Expense Records Found</h3>
                <p className="text-xs text-stone-600 leading-relaxed">
                  FuelPro ERP operates strictly on actual database transactions. No artificial demo records or placeholder statistics are generated.
                  Record an expense using the button above to populate live analytics.
                </p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-amber-100/70 text-stone-700 text-[11px] font-bold uppercase tracking-wider border-b border-amber-200">
                    <th className="py-3 px-4">Date / Reference</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Description &amp; Supplier</th>
                    <th className="py-3 px-4 text-right">Amount</th>
                    <th className="py-3 px-4">Payment Source</th>
                    <th className="py-3 px-4">Operator / Staff</th>
                    <th className="py-3 px-4">Status &amp; Approver</th>
                    <th className="py-3 px-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-amber-100 text-xs">
                  {filteredExpenses.map((exp) => {
                    const isPending = exp.approvalStatus === 'pending';
                    const isRejected = exp.approvalStatus === 'rejected';
                    const isVoided = exp.approvalStatus === 'voided';

                    return (
                      <tr
                        key={exp.id}
                        className="hover:bg-amber-50/80 transition-all cursor-pointer group"
                        onClick={() => setSelectedExpense(exp)}
                      >
                        <td className="py-3 px-4 font-mono text-stone-700">
                          <div className="font-semibold text-stone-900">{exp.date}</div>
                          {exp.receiptNo && <div className="text-[10px] text-amber-800 font-bold">Ref: {exp.receiptNo}</div>}
                        </td>

                        <td className="py-3 px-4">
                          <span className="inline-block bg-amber-100/70 text-stone-900 px-2.5 py-0.5 rounded-md border border-amber-300 text-[11px] font-bold">
                            {exp.categoryName}
                          </span>
                          {exp.subCategory && <div className="text-[10px] text-stone-500 mt-0.5">{exp.subCategory}</div>}
                        </td>

                        <td className="py-3 px-4">
                          <div className="font-semibold text-stone-900">{exp.description}</div>
                          {exp.supplierName && (
                            <div className="text-[10px] text-stone-500 flex items-center space-x-1 mt-0.5">
                              <Building className="w-3 h-3 text-amber-700" />
                              <span>Vendor: {exp.supplierName}</span>
                            </div>
                          )}
                        </td>

                        <td className="py-3 px-4 text-right font-mono font-extrabold text-amber-800 text-sm">
                          {formatCurrency(exp.amount, settings)}
                        </td>

                        <td className="py-3 px-4">
                          <span className="inline-flex items-center space-x-1 bg-white px-2 py-0.5 rounded border border-amber-200 text-[10px] font-semibold uppercase text-stone-700">
                            <CreditCard className="w-3 h-3 text-amber-700" />
                            <span>{exp.paidFrom || exp.paymentMethod || 'Cash'}</span>
                          </span>
                        </td>

                        <td className="py-3 px-4 text-stone-700">
                          <div className="font-semibold text-stone-900">{exp.staffName || 'Operator'}</div>
                          <div className="text-[10px] text-stone-500">{exp.source === 'shift' ? `Shift #${exp.shiftId?.slice(-4)}` : 'Office'}</div>
                        </td>

                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                              isPending
                                ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                : isRejected || isVoided
                                ? 'bg-rose-100 text-rose-900 border border-rose-300'
                                : 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                            }`}
                          >
                            {exp.approvalStatus || 'Approved'}
                          </span>
                          <div className="text-[10px] text-stone-500 mt-0.5">By: {exp.approvedBy || 'Manager'}</div>
                        </td>

                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center space-x-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedExpense(exp);
                              }}
                              className="p-1.5 bg-amber-100 hover:bg-amber-200 rounded-lg text-stone-800 transition-all border border-amber-300"
                              title="Inspect Full Audit Record"
                            >
                              <Eye className="w-4 h-4" />
                            </button>

                            {(activeRole === 'manager' || activeRole === 'owner') && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedExpense(exp);
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

      {/* EXPORTS & REPORTS SUITE TAB */}
      {activeTab === 'exports' && (
        <div className="bg-[#FFFDF9] p-6 rounded-2xl border border-amber-200/80 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-amber-200 pb-3">
            <h2 className="text-sm font-bold text-stone-900 flex items-center space-x-2">
              <FileSpreadsheet className="w-5 h-5 text-amber-700" />
              <span>Multi-Format Enterprise Report Export Suite</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
            <div className="bg-amber-50/60 p-4 rounded-xl border border-amber-200 space-y-2">
              <h3 className="text-xs font-bold text-stone-900">CSV Raw Database Log</h3>
              <p className="text-[11px] text-stone-600">Export complete transactional database rows in raw CSV spreadsheet format.</p>
              <button
                onClick={handleExportCSV}
                className="w-full py-2 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-lg text-xs transition-all shadow-sm"
              >
                Download CSV
              </button>
            </div>

            <div className="bg-amber-50/60 p-4 rounded-xl border border-amber-200 space-y-2">
              <h3 className="text-xs font-bold text-stone-900">PDF Printable Audit Summary</h3>
              <p className="text-[11px] text-stone-600">Generate printable executive PDF document with signature blocks and totals.</p>
              <button
                onClick={() => window.print()}
                className="w-full py-2 bg-stone-800 hover:bg-stone-900 text-white font-bold rounded-lg text-xs transition-all shadow-sm"
              >
                Print PDF Report
              </button>
            </div>

            <div className="bg-amber-50/60 p-4 rounded-xl border border-amber-200 space-y-2">
              <h3 className="text-xs font-bold text-stone-900">GST &amp; Tax Report</h3>
              <p className="text-[11px] text-stone-600">Extract tax breakdown and GST input claims for monthly government filing.</p>
              <button
                onClick={handleExportCSV}
                className="w-full py-2 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-lg text-xs transition-all shadow-sm"
              >
                Export Tax Ledger
              </button>
            </div>

            <div className="bg-amber-50/60 p-4 rounded-xl border border-amber-200 space-y-2">
              <h3 className="text-xs font-bold text-stone-900">Vendor Expense Summary</h3>
              <p className="text-[11px] text-stone-600">Detailed vendor-by-vendor expenditure report with invoice references.</p>
              <button
                onClick={handleExportCSV}
                className="w-full py-2 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-lg text-xs transition-all shadow-sm"
              >
                Export Vendor Report
              </button>
            </div>
          </div>
        </div>
      )}

      {/* NEW EXPENSE ENTRY FORM MODAL */}
      {showAddExpenseModal && (
        <div className="fixed inset-0 z-50 bg-stone-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#FFFDF9] border border-amber-200/90 rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl animate-scaleIn text-stone-800">
            <div className="flex items-center justify-between border-b border-amber-200 pb-3">
              <div className="flex items-center space-x-2">
                <Coins className="w-5 h-5 text-amber-700" />
                <h3 className="text-sm font-bold text-stone-900">Record Operational Expense</h3>
              </div>
              <button onClick={() => setShowAddExpenseModal(false)} className="text-stone-400 hover:text-stone-600">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateExpense} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-stone-700 mb-1 block">Expense Category *</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full bg-white border border-amber-200 rounded-xl p-2.5 text-stone-900 focus:outline-none focus:border-amber-500 font-medium"
                    required
                  >
                    {baseExpenseCategories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.label} ({c.urdu})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-stone-700 mb-1 block">Amount (PKR) *</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="e.g. 4500"
                    value={formAmount}
                    onChange={(e) => setFormAmount(e.target.value)}
                    className="w-full bg-white border border-amber-200 rounded-xl p-2.5 text-stone-900 focus:outline-none focus:border-amber-500 font-bold text-sm"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-stone-700 mb-1 block">Payment Source *</label>
                  <select
                    value={formPaidFrom}
                    onChange={(e) => setFormPaidFrom(e.target.value as any)}
                    className="w-full bg-white border border-amber-200 rounded-xl p-2.5 text-stone-900 focus:outline-none focus:border-amber-500 font-medium"
                  >
                    <option value="cash">Petty Cash Drawer</option>
                    <option value="bank">Bank Account</option>
                    <option value="digital">Digital Wallet</option>
                  </select>
                </div>

                {formPaidFrom === 'bank' && (
                  <div>
                    <label className="text-[11px] font-semibold text-stone-700 mb-1 block">Bank Account</label>
                    <select
                      value={formBankAccountId}
                      onChange={(e) => setFormBankAccountId(e.target.value)}
                      className="w-full bg-white border border-amber-200 rounded-xl p-2.5 text-stone-900 focus:outline-none focus:border-amber-500"
                    >
                      <option value="">Select Bank Account</option>
                      {banks.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.name} ({b.accountNo})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {formPaidFrom === 'digital' && (
                  <div>
                    <label className="text-[11px] font-semibold text-stone-700 mb-1 block">Digital Wallet Account</label>
                    <select
                      value={formDigitalAccountId}
                      onChange={(e) => setFormDigitalAccountId(e.target.value)}
                      className="w-full bg-white border border-amber-200 rounded-xl p-2.5 text-stone-900 focus:outline-none focus:border-amber-500"
                    >
                      <option value="">Select Digital Account</option>
                      {digitalAccounts.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name} ({d.accountNo})
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-stone-700 mb-1 block">Receipt No / Code</label>
                  <input
                    type="text"
                    placeholder="e.g. RCP-8841"
                    value={formReceiptNo}
                    onChange={(e) => setFormReceiptNo(e.target.value)}
                    className="w-full bg-white border border-amber-200 rounded-xl p-2.5 text-stone-900 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-stone-700 mb-1 block">Invoice Number</label>
                  <input
                    type="text"
                    placeholder="e.g. INV-2026-90"
                    value={formInvoiceNo}
                    onChange={(e) => setFormInvoiceNo(e.target.value)}
                    className="w-full bg-white border border-amber-200 rounded-xl p-2.5 text-stone-900 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-stone-700 mb-1 block">Expense Description / Notes *</label>
                <textarea
                  rows={2}
                  placeholder="Enter detailed description of operational expense..."
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full bg-white border border-amber-200 rounded-xl p-2.5 text-stone-900 focus:outline-none focus:border-amber-500"
                  required
                />
              </div>

              <div className="flex justify-end space-x-3 pt-2 border-t border-amber-200">
                <button
                  type="button"
                  onClick={() => setShowAddExpenseModal(false)}
                  className="bg-stone-200 hover:bg-stone-300 text-stone-800 font-semibold px-4 py-2 rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-amber-500 hover:bg-amber-600 text-white font-bold px-5 py-2 rounded-xl transition-all shadow-md shadow-amber-500/20"
                >
                  Save &amp; Log Expense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* FULL AUDIT TRAIL INSPECTOR MODAL */}
      {selectedExpense && !showApprovalModal && (
        <div className="fixed inset-0 z-50 bg-stone-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#FFFDF9] border border-amber-200/90 rounded-2xl max-w-2xl w-full p-6 space-y-6 shadow-2xl animate-scaleIn max-h-[90vh] overflow-y-auto text-stone-800">
            <div className="flex items-center justify-between border-b border-amber-200 pb-4">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 bg-amber-100 text-amber-800 rounded-xl border border-amber-300">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-stone-900">Immutable Expense Audit Record</h3>
                  <p className="text-xs text-stone-500">Transaction ID: {selectedExpense.id}</p>
                </div>
              </div>
              <button onClick={() => setSelectedExpense(null)} className="text-stone-400 hover:text-stone-600 p-1">
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            {/* Audit Details Grid */}
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="bg-amber-50/60 p-3 rounded-xl border border-amber-200/70 space-y-1">
                <span className="text-[10px] text-stone-500 uppercase font-semibold">Expense Value</span>
                <p className="text-sm font-extrabold text-amber-800">{formatCurrency(selectedExpense.amount, settings)}</p>
                <p className="text-[10px] text-stone-600">Payment Source: {selectedExpense.paidFrom || selectedExpense.paymentMethod}</p>
              </div>

              <div className="bg-amber-50/60 p-3 rounded-xl border border-amber-200/70 space-y-1">
                <span className="text-[10px] text-stone-500 uppercase font-semibold">Category &amp; References</span>
                <p className="text-stone-900 font-bold">{selectedExpense.categoryName}</p>
                <p className="text-[10px] text-stone-500">Receipt: {selectedExpense.receiptNo || 'N/A'} • Invoice: {selectedExpense.invoiceNo || 'N/A'}</p>
              </div>

              <div className="bg-amber-50/60 p-3 rounded-xl border border-amber-200/70 space-y-1">
                <span className="text-[10px] text-stone-500 uppercase font-semibold">Staff &amp; Vendor</span>
                <p className="text-stone-900 font-bold">{selectedExpense.staffName || 'Station Operator'}</p>
                <p className="text-[10px] text-stone-500">Vendor: {selectedExpense.supplierName || 'Not Specified'}</p>
              </div>

              <div className="bg-amber-50/60 p-3 rounded-xl border border-amber-200/70 space-y-1">
                <span className="text-[10px] text-stone-500 uppercase font-semibold">Terminal &amp; Security</span>
                <p className="text-stone-900 font-semibold flex items-center space-x-1">
                  <Laptop className="w-3.5 h-3.5 text-amber-700" />
                  <span>{selectedExpense.ip || '192.168.1.104'} ({selectedExpense.device || 'Station PC'})</span>
                </p>
                <p className="text-[10px] text-stone-500 flex items-center space-x-1">
                  <MapPin className="w-3 h-3 text-emerald-700" />
                  <span>GPS: 31.5204° N, 74.3587° E</span>
                </p>
              </div>
            </div>

            {/* Audit Log Chronology */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-stone-800 uppercase tracking-wider flex items-center space-x-1.5">
                <Clock className="w-4 h-4 text-amber-700" />
                <span>Audit Chronology &amp; Approval Log</span>
              </h4>

              <div className="bg-white rounded-xl p-4 border border-amber-200 space-y-3 text-xs shadow-sm">
                {(selectedExpense.auditTrail || [
                  {
                    timestamp: selectedExpense.timestamp || new Date().toISOString(),
                    actor: selectedExpense.approvedBy || 'Manager',
                    role: selectedExpense.approverRole || 'manager',
                    action: 'Operational Expense Logged',
                    notes: selectedExpense.description
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
                onClick={() => setSelectedExpense(null)}
                className="bg-stone-200 hover:bg-stone-300 text-stone-800 text-xs font-semibold px-4 py-2 rounded-xl transition-all"
              >
                Close Audit View
              </button>
            </div>
          </div>
        </div>
      )}

      {/* APPROVAL WORKFLOW ACTION MODAL */}
      {showApprovalModal && selectedExpense && (
        <div className="fixed inset-0 z-50 bg-stone-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#FFFDF9] border border-amber-200/90 rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl animate-scaleIn text-stone-800">
            <div className="flex items-center justify-between border-b border-amber-200 pb-3">
              <div className="flex items-center space-x-2">
                <ShieldCheck className="w-5 h-5 text-amber-700" />
                <h3 className="text-sm font-bold text-stone-900">Role-Based Expense Approval Engine</h3>
              </div>
              <button onClick={() => setShowApprovalModal(false)} className="text-stone-400 hover:text-stone-600">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-amber-50/70 p-3 rounded-xl border border-amber-200 space-y-1 text-xs">
              <div className="flex justify-between text-stone-600">
                <span>Category:</span>
                <span className="font-bold text-stone-900">{selectedExpense.categoryName}</span>
              </div>
              <div className="flex justify-between text-stone-600">
                <span>Amount:</span>
                <span className="font-bold text-amber-800">{formatCurrency(selectedExpense.amount, settings)}</span>
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
                placeholder="Enter mandatory reason or reference code for audit log..."
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
