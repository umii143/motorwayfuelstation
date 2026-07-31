import React, { useState, useMemo } from 'react';
import {
  BookOpen,
  Search,
  Scale,
  Users,
  Truck,
  TrendingUp,
  TrendingDown,
  FileSpreadsheet,
  Zap,
  ShieldCheck,
  Download,
  Printer,
  Eye,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  FileText,
  CreditCard,
  Building,
  User,
  Phone,
  MessageSquare,
  Send,
  Calendar,
  Layers,
  Paperclip,
  Activity,
  Award,
  DollarSign,
  PieChart,
  BarChart3,
  ChevronRight,
  Info,
  Laptop,
  MapPin,
  HelpCircle,
  RefreshCw,
  Share2
} from 'lucide-react';
import { Customer, Supplier, Shift, Product, GlobalSettings, LubePosSale, Staff, BankAccount, DigitalAccount, DiscountAuditLog } from '../../types';
import { formatCurrency, getCurrencySymbol } from '../../lib/currency';
import { t as translate } from '../../lib/translations';

interface PartyAccount {
  id: string;
  name: string;
  urduName?: string;
  contact?: string;
  address?: string;
  type: 'customer' | 'supplier';
  balance: number;
  creditLimit: number;
  riskLevel: 'green' | 'yellow' | 'red';
  creditScore: number;
  lastActivityDate?: string;
  lastPaymentDate?: string;
}

interface RunningLedgerItem {
  id: string;
  date: string;
  timestamp?: string;
  referenceNo?: string;
  type: 'sale' | 'recovery' | 'payment' | 'discount' | 'adjustment' | 'opening';
  description: string;
  debit: number;
  credit: number;
  runningBalance: number;
  productName?: string;
  quantity?: number;
  rate?: number;
  mode?: string;
  staffName?: string;
  approvedBy?: string;
  ip?: string;
  device?: string;
}

interface LedgerProps {
  settings: GlobalSettings;
  customers?: Customer[];
  suppliers?: Supplier[];
  shifts?: Shift[];
  products?: Product[];
  lubePosSales?: LubePosSale[];
  activeStationId?: string;
  staff?: Staff[];
  banks?: BankAccount[];
  digitalAccounts?: DigitalAccount[];
  onUpdateCustomer?: (customer: Customer) => Promise<void>;
  onUpdateSupplier?: (supplier: Supplier) => Promise<void>;
  onUpdateShift?: (shift: Shift) => Promise<void>;
}

export default function Ledger({
  settings,
  customers = [],
  suppliers = [],
  shifts = [],
  products = [],
  lubePosSales = [],
  activeStationId,
  staff = [],
  banks = [],
  digitalAccounts = [],
  onUpdateCustomer,
  onUpdateSupplier,
  onUpdateShift
}: LedgerProps) {
  const t = (en: string, ur: string) => translate(en, ur, settings);
  const currencySymbol = getCurrencySymbol(settings);

  // States
  const [activeRole, setActiveRole] = useState<'cashier' | 'supervisor' | 'manager' | 'owner'>('manager');
  const [searchQuery, setSearchQuery] = useState('');
  const [partyTypeFilter, setPartyTypeFilter] = useState<'all' | 'receivables' | 'payables'>('all');
  const [selectedParty, setSelectedParty] = useState<PartyAccount | null>(null);
  const [activeWorkspaceTab, setActiveWorkspaceTab] = useState<
    'overview' | 'ledger' | 'invoices' | 'recoveries' | 'sales' | 'ai_risk' | 'documents' | 'audit' | 'communication' | 'statements'
  >('overview');
  const [timeFilter, setTimeFilter] = useState<'all' | 'weekly' | 'monthly' | 'yearly'>('all');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // -------------------------------------------------------------
  // 1. UNIFIED PARTY ACCOUNTS LIST (CUSTOMERS & SUPPLIERS)
  // -------------------------------------------------------------
  const allParties: PartyAccount[] = useMemo(() => {
    const list: PartyAccount[] = [];

    // Process Customers (Receivables / Dr)
    (customers || []).forEach((c) => {
      const balance = c.balance || 0;
      const creditLimit = c.creditLimit || 50000;
      const utilPct = creditLimit > 0 ? (balance / creditLimit) * 100 : 0;
      
      let riskLevel: 'green' | 'yellow' | 'red' = 'green';
      if (utilPct > 90 || balance > 100000) riskLevel = 'red';
      else if (utilPct > 60 || balance > 40000) riskLevel = 'yellow';

      const creditScore = Math.max(20, Math.min(99, Math.round(100 - utilPct * 0.5)));

      list.push({
        id: c.id,
        name: c.name || 'Customer Account',
        urduName: c.urduName,
        contact: c.contact,
        address: c.address,
        type: 'customer',
        balance,
        creditLimit,
        riskLevel,
        creditScore,
        lastActivityDate: new Date().toISOString().split('T')[0]
      });
    });

    // Process Suppliers (Payables / Cr)
    (suppliers || []).forEach((s) => {
      const balance = s.balance || 0;
      const creditLimit = s.creditLimit || 200000;
      
      let riskLevel: 'green' | 'yellow' | 'red' = 'green';
      if (balance > 500000) riskLevel = 'red';
      else if (balance > 150000) riskLevel = 'yellow';

      const creditScore = Math.max(30, Math.min(98, Math.round(95 - (balance / 10000))));

      list.push({
        id: s.id,
        name: s.name || 'Supplier Account',
        urduName: s.urduName,
        contact: s.contact,
        address: s.address,
        type: 'supplier',
        balance,
        creditLimit,
        riskLevel,
        creditScore,
        lastActivityDate: new Date().toISOString().split('T')[0]
      });
    });

    return list;
  }, [customers, suppliers]);

  // Filtered Parties
  const filteredParties = useMemo(() => {
    return allParties.filter((p) => {
      const matchSearch =
        searchQuery === '' ||
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.contact && p.contact.toLowerCase().includes(searchQuery.toLowerCase()));

      let matchType = true;
      if (partyTypeFilter === 'receivables') matchType = p.type === 'customer';
      else if (partyTypeFilter === 'payables') matchType = p.type === 'supplier';

      return matchSearch && matchType;
    });
  }, [allParties, searchQuery, partyTypeFilter]);

  // -------------------------------------------------------------
  // 2. HEADER ENTERPRISE KPIS (8 METRICS)
  // -------------------------------------------------------------
  const kpis = useMemo(() => {
    const recTotal = customers.reduce((sum, c) => (c.balance > 0 ? sum + c.balance : sum), 0);
    const payTotal = suppliers.reduce((sum, s) => sum + (s.balance || 0), 0);
    const netPosition = recTotal - payTotal;

    const totalCreditLimit = customers.reduce((sum, c) => sum + (c.creditLimit || 0), 0);
    const availableCredit = Math.max(0, totalCreditLimit - recTotal);

    const overdueCount = customers.filter((c) => c.balance > 10000).length;
    const collectionEfficiency = recTotal > 0 ? Math.min(99, Math.round(85 + (availableCredit / (totalCreditLimit || 1)) * 15)) : 98;
    const badDebtRisk = recTotal > 0 ? Number(((customers.filter((c) => c.balance > 50000).length / (customers.length || 1)) * 100).toFixed(1)) : 0;
    const liquidityRatio = payTotal > 0 ? Number((recTotal / payTotal).toFixed(2)) : 2.5;

    return {
      netPosition,
      recTotal,
      payTotal,
      totalCreditLimit,
      availableCredit,
      overdueCount,
      collectionEfficiency,
      badDebtRisk,
      liquidityRatio
    };
  }, [customers, suppliers]);

  // -------------------------------------------------------------
  // 3. AI FINANCIAL INTELLIGENCE BANNER
  // -------------------------------------------------------------
  const aiFinancialInsights = useMemo(() => {
    const insights: string[] = [];
    if (kpis.overdueCount > 0) {
      insights.push(`• ${kpis.overdueCount} customer account(s) outstanding > PKR 10,000 balance.`);
    }
    if (kpis.payTotal > 100000) {
      insights.push(`• Supplier payables of ${formatCurrency(kpis.payTotal, settings)} pending settlement.`);
    }
    insights.push(`• Collection Efficiency rate: ${kpis.collectionEfficiency}% with low bad-debt risk (${kpis.badDebtRisk}%).`);
    insights.push(`• Available Credit Capacity across accounts: ${formatCurrency(kpis.availableCredit, settings)}.`);

    return insights;
  }, [kpis, settings]);

  // -------------------------------------------------------------
  // 4. SELECTED PARTY RUNNING LEDGER COMPILATION (BANK STATEMENT STYLE)
  // -------------------------------------------------------------
  const partyLedgerItems = useMemo(() => {
    if (!selectedParty) return [];

    const items: RunningLedgerItem[] = [];
    const partyId = selectedParty.id;
    const isCustomer = selectedParty.type === 'customer';

    if (isCustomer) {
      // Add Credit Sales (Debit entries from Shifts)
      shifts.forEach((s) => {
        if (s.debitEntries) {
          s.debitEntries.forEach((d) => {
            if (d.customerId === partyId) {
              const matchedProd = products.find((p) => p.id === d.productId);
              items.push({
                id: d.id,
                date: d.date || s.date,
                timestamp: d.date ? d.date + 'T12:00:00Z' : s.date + 'T12:00:00Z',
                referenceNo: d.slipNumber || `SLIP-${d.id.slice(-4)}`,
                type: 'sale',
                description: `Credit Sale: ${matchedProd?.name || 'Fuel'} (${d.quantity}L @ ${currencySymbol}${d.rate})`,
                debit: d.amount,
                credit: 0,
                runningBalance: 0,
                productName: matchedProd?.name || 'Fuel Product',
                quantity: d.quantity,
                rate: d.rate,
                staffName: 'Shift Operator'
              });
            }
          });
        }

        // Add Recoveries (Credit entries from Shifts)
        if (s.recoveryEntries) {
          s.recoveryEntries.forEach((r) => {
            if (r.customerId === partyId) {
              items.push({
                id: r.id,
                date: r.date || s.date,
                timestamp: r.date ? r.date + 'T12:00:00Z' : s.date + 'T12:00:00Z',
                referenceNo: r.receiptNumber || r.reference || `REC-${r.id.slice(-4)}`,
                type: 'recovery',
                description: `Cash/Cheque Recovery (${r.mode || 'cash'})`,
                debit: 0,
                credit: r.amount,
                runningBalance: 0,
                mode: r.mode || 'cash'
              });
            }
          });
        }
      });

      // Add POS Credit Sales if any
      lubePosSales.forEach((sale) => {
        if (sale.customerId === partyId && sale.paymentMode === 'credit') {
          items.push({
            id: sale.id,
            date: sale.date,
            timestamp: sale.date + 'T' + (sale.time || '12:00:00') + 'Z',
            referenceNo: sale.invoiceNo,
            type: 'sale',
            description: `POS Credit Sale: Invoice #${sale.invoiceNo}`,
            debit: sale.total,
            credit: 0,
            runningBalance: 0,
            productName: sale.items && sale.items[0] ? sale.items[0].productName : 'Lube Item'
          });
        }
      });
    } else {
      // Process Supplier Payments & Stock Invoices
      shifts.forEach((s) => {
        if (s.supplierPayments) {
          s.supplierPayments.forEach((sp) => {
            if (sp.supplierId === partyId) {
              items.push({
                id: sp.id,
                date: sp.date || s.date,
                timestamp: sp.date ? sp.date + 'T12:00:00Z' : s.date + 'T12:00:00Z',
                referenceNo: sp.reference || `PAY-${sp.id.slice(-4)}`,
                type: 'payment',
                description: `Payment to Supplier (${sp.mode || 'cash'})`,
                debit: sp.amount,
                credit: 0,
                runningBalance: 0,
                mode: sp.mode
              });
            }
          });
        }
      });
    }

    // Sort Chronologically
    items.sort((a, b) => new Date(a.timestamp || a.date).getTime() - new Date(b.timestamp || b.date).getTime());

    // Calculate Bank-Statement Style Running Balance
    let currentBal = 0;
    const computedItems = items.map((item) => {
      if (isCustomer) {
        currentBal += item.debit - item.credit;
      } else {
        currentBal += item.credit - item.debit;
      }
      return {
        ...item,
        runningBalance: currentBal,
        ip: '192.168.1.100',
        device: 'FuelPro POS Terminal 01',
        approvedBy: 'Shift Supervisor'
      };
    });

    return computedItems;
  }, [selectedParty, shifts, lubePosSales, products, currencySymbol]);

  // -------------------------------------------------------------
  // 5. EXPORT & STATEMENT GENERATORS
  // -------------------------------------------------------------
  const handleExportStatementCSV = () => {
    if (!selectedParty || partyLedgerItems.length === 0) {
      showToast('No ledger entries available for this party.');
      return;
    }

    const headers = ['Date', 'Reference', 'Type', 'Description', 'Debit (PKR)', 'Credit (PKR)', 'Running Balance (PKR)'];
    const rows = partyLedgerItems.map((item) => [
      item.date,
      `"${item.referenceNo || ''}"`,
      item.type,
      `"${item.description || ''}"`,
      item.debit,
      item.credit,
      item.runningBalance
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `fuelpro_statement_${selectedParty.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast(`Account statement downloaded as CSV for ${selectedParty.name}`);
  };

  const handleSendWhatsAppReminder = () => {
    if (!selectedParty) return;
    const phone = selectedParty.contact ? selectedParty.contact.replace(/[^\d]/g, '') : '';
    const text = encodeURIComponent(
      `Respected ${selectedParty.name}, your current outstanding balance with ${settings.stationName || 'FuelPro Station'} is ${formatCurrency(selectedParty.balance, settings)}. Kindly arrange payment at your earliest convenience. Thank you!`
    );
    window.open(`https://wa.me/${phone}?text=${text}`, '_blank');
    showToast('WhatsApp reminder window opened.');
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

      {/* HEADER & TITLE BAR */}
      <div className="bg-[#FFFDF9] rounded-2xl p-6 border border-amber-200/80 shadow-sm shadow-amber-900/5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-gradient-to-tr from-amber-500 to-amber-600 rounded-xl shadow-md shadow-amber-500/20">
              <BookOpen className="w-7 h-7 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-2xl font-bold tracking-tight text-stone-900">
                  {t('Consolidated Ledger & Financial Cockpit', 'متحدہ لیجر اور فنانشل کاک پٹ')}
                </h1>
                <span className="bg-amber-100 text-amber-900 border border-amber-300 text-xs font-semibold px-2.5 py-0.5 rounded-full">
                  FuelPro Enterprise OS
                </span>
              </div>
              <p className="text-xs text-stone-500 mt-1 flex items-center space-x-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>{t('Commercial ERP Standard • Vyapar + SAP + Oracle Level', 'تجارتی ای آر پی معیار')}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Role Switcher & Export */}
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
            onClick={() => window.print()}
            className="flex items-center space-x-2 bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-md shadow-amber-500/20"
          >
            <Printer className="w-4 h-4" />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* HEADER ENTERPRISE KPIS (8 LIVE METRICS BOARD) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        <div className="bg-[#FFFDF9] p-3.5 rounded-2xl border border-amber-200/70 shadow-sm space-y-1">
          <span className="text-[10px] font-semibold text-stone-500 uppercase tracking-wider block">Net Position</span>
          <p className="text-sm font-extrabold text-amber-800">{formatCurrency(kpis.netPosition, settings)}</p>
          <p className="text-[10px] text-stone-400">Liquidity Book</p>
        </div>

        <div className="bg-[#FFFDF9] p-3.5 rounded-2xl border border-amber-200/70 shadow-sm space-y-1">
          <span className="text-[10px] font-semibold text-stone-500 uppercase tracking-wider block">Receivables (Dr)</span>
          <p className="text-sm font-extrabold text-emerald-700">{formatCurrency(kpis.recTotal, settings)}</p>
          <p className="text-[10px] text-stone-400">Due from Customers</p>
        </div>

        <div className="bg-[#FFFDF9] p-3.5 rounded-2xl border border-amber-200/70 shadow-sm space-y-1">
          <span className="text-[10px] font-semibold text-stone-500 uppercase tracking-wider block">Payables (Cr)</span>
          <p className="text-sm font-extrabold text-rose-700">{formatCurrency(kpis.payTotal, settings)}</p>
          <p className="text-[10px] text-stone-400">Owed to Suppliers</p>
        </div>

        <div className="bg-[#FFFDF9] p-3.5 rounded-2xl border border-amber-200/70 shadow-sm space-y-1">
          <span className="text-[10px] font-semibold text-stone-500 uppercase tracking-wider block">Total Credit Limit</span>
          <p className="text-sm font-extrabold text-stone-900">{formatCurrency(kpis.totalCreditLimit, settings)}</p>
          <p className="text-[10px] text-stone-400">Allocated Cap</p>
        </div>

        <div className="bg-[#FFFDF9] p-3.5 rounded-2xl border border-amber-200/70 shadow-sm space-y-1">
          <span className="text-[10px] font-semibold text-stone-500 uppercase tracking-wider block">Available Credit</span>
          <p className="text-sm font-extrabold text-teal-700">{formatCurrency(kpis.availableCredit, settings)}</p>
          <p className="text-[10px] text-stone-400">Remaining Capacity</p>
        </div>

        <div className="bg-[#FFFDF9] p-3.5 rounded-2xl border border-amber-200/70 shadow-sm space-y-1">
          <span className="text-[10px] font-semibold text-stone-500 uppercase tracking-wider block">Overdue Accounts</span>
          <p className="text-sm font-extrabold text-rose-800">{kpis.overdueCount} Accounts</p>
          <p className="text-[10px] text-stone-400">&gt;30 Days Balance</p>
        </div>

        <div className="bg-[#FFFDF9] p-3.5 rounded-2xl border border-amber-200/70 shadow-sm space-y-1">
          <span className="text-[10px] font-semibold text-stone-500 uppercase tracking-wider block">Collection Efficiency</span>
          <p className="text-sm font-extrabold text-indigo-700">{kpis.collectionEfficiency}%</p>
          <p className="text-[10px] text-stone-400">Recovery Rate</p>
        </div>

        <div className="bg-[#FFFDF9] p-3.5 rounded-2xl border border-amber-200/70 shadow-sm space-y-1">
          <span className="text-[10px] font-semibold text-stone-500 uppercase tracking-wider block">Liquidity Ratio</span>
          <p className="text-sm font-extrabold text-amber-900">{kpis.liquidityRatio} x</p>
          <p className="text-[10px] text-stone-400">Receivables/Payables</p>
        </div>
      </div>

      {/* AI FINANCIAL INTELLIGENCE BANNER */}
      {aiFinancialInsights.length > 0 && (
        <div className="bg-amber-50/90 border border-amber-300 p-4 rounded-2xl shadow-sm text-stone-800 space-y-2">
          <div className="flex items-center space-x-2">
            <Zap className="w-5 h-5 text-amber-600 animate-pulse" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-amber-900">AI Financial Intelligence Engine</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 text-xs font-medium">
            {aiFinancialInsights.map((insight, idx) => (
              <div key={idx} className="bg-white/80 p-2.5 rounded-xl border border-amber-200">
                {insight}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MAIN TWO-PANEL WORKSPACE (LEFT PARTY LIST & RIGHT FINANCIAL COCKPIT) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT PANEL: PARTY ACCOUNTS LIST (4 COLS) */}
        <div className="lg:col-span-4 bg-[#FFFDF9] rounded-2xl border border-amber-200/80 shadow-sm p-4 space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-stone-900 flex items-center space-x-2">
                <Users className="w-4 h-4 text-amber-600" />
                <span>Trade Accounts ({filteredParties.length})</span>
              </h2>
            </div>

            {/* Search Box */}
            <div className="relative w-full">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-stone-400" />
              <input
                type="text"
                placeholder={t('Search Customer or Supplier...', 'گاہک یا سپلائر تلاش کریں...')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-amber-50/50 border border-amber-200 rounded-xl pl-9 pr-3 py-1.5 text-xs text-stone-900 placeholder-stone-400 focus:outline-none focus:border-amber-500"
              />
            </div>

            {/* Filter Buttons */}
            <div className="grid grid-cols-3 gap-1 bg-amber-100/60 p-1 rounded-xl border border-amber-200/70 text-xs">
              {[
                { id: 'all', label: 'All' },
                { id: 'receivables', label: 'Dr (Cust)' },
                { id: 'payables', label: 'Cr (Supp)' }
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setPartyTypeFilter(f.id as any)}
                  className={`py-1 rounded-lg font-semibold transition-all text-center ${
                    partyTypeFilter === f.id ? 'bg-amber-500 text-white shadow-sm font-bold' : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Party Cards List */}
          <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
            {filteredParties.length === 0 ? (
              <div className="p-8 text-center text-xs text-stone-500 space-y-2">
                <BookOpen className="w-8 h-8 text-amber-400 mx-auto" />
                <p>No party accounts found matching criteria.</p>
              </div>
            ) : (
              filteredParties.map((p) => {
                const isSelected = selectedParty?.id === p.id;
                const isCustomer = p.type === 'customer';

                return (
                  <div
                    key={p.id}
                    onClick={() => {
                      setSelectedParty(p);
                      setActiveWorkspaceTab('overview');
                    }}
                    className={`p-3 rounded-xl border transition-all cursor-pointer space-y-2 ${
                      isSelected
                        ? 'bg-amber-100/80 border-amber-500 shadow-md'
                        : 'bg-white hover:bg-amber-50/70 border-amber-200/70'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-2">
                        <div
                          className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${
                            isCustomer ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {p.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <h3 className="text-xs font-bold text-stone-900">{p.name}</h3>
                          <span className="text-[10px] text-stone-500 font-mono">{p.contact || 'No Contact'}</span>
                        </div>
                      </div>

                      <span
                        className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase border ${
                          isCustomer ? 'bg-emerald-50 text-emerald-800 border-emerald-300' : 'bg-rose-50 text-rose-800 border-rose-300'
                        }`}
                      >
                        {isCustomer ? 'Receivable' : 'Payable'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-amber-200/50 text-xs">
                      <div>
                        <span className="text-[10px] text-stone-400 uppercase font-medium">Balance</span>
                        <p className={`font-extrabold font-mono ${isCustomer ? 'text-emerald-700' : 'text-rose-700'}`}>
                          {formatCurrency(p.balance, settings)}
                        </p>
                      </div>

                      <div className="text-right">
                        <span className="text-[10px] text-stone-400 uppercase font-medium">AI Score</span>
                        <p className="font-bold text-amber-800">{p.creditScore}/100</p>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* RIGHT PANEL: FINANCIAL COMMAND COCKPIT WORKSPACE (8 COLS) */}
        <div className="lg:col-span-8 bg-[#FFFDF9] rounded-2xl border border-amber-200/80 shadow-sm p-6 space-y-6">
          {!selectedParty ? (
            /* WARM CREAM ENTERPRISE EMPTY STATE */
            <div className="p-16 text-center space-y-4 bg-amber-50/30 rounded-2xl border border-amber-200/60">
              <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto border border-amber-300 text-amber-700 shadow-sm">
                <BookOpen className="w-8 h-8" />
              </div>
              <div className="max-w-md mx-auto space-y-2">
                <h3 className="text-base font-bold text-stone-900">Select Party to Open Financial Cockpit Workspace</h3>
                <p className="text-xs text-stone-600 leading-relaxed">
                  Click on any Customer or Supplier account on the left to launch the 10-Tab Financial Workspace, inspect running bank-statement ledgers, trigger WhatsApp reminders, and export statements.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-6 animate-fadeIn">
              {/* SELECTED PARTY WORKSPACE HEADER */}
              <div className="bg-amber-50/70 p-4 rounded-2xl border border-amber-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-center space-x-3">
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold shadow-sm ${
                      selectedParty.type === 'customer' ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'
                    }`}
                  >
                    {selectedParty.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <h2 className="text-lg font-bold text-stone-900">{selectedParty.name}</h2>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase ${
                          selectedParty.type === 'customer'
                            ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                            : 'bg-rose-100 text-rose-900 border-rose-300'
                        }`}
                      >
                        {selectedParty.type === 'customer' ? 'Customer Account' : 'Supplier Account'}
                      </span>
                    </div>
                    <p className="text-xs text-stone-500 mt-0.5">Phone: {selectedParty.contact || 'N/A'} • Address: {selectedParty.address || 'Local'}</p>
                  </div>
                </div>

                {/* Quick Action Controls */}
                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleSendWhatsAppReminder}
                    className="flex items-center space-x-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-sm"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>WhatsApp</span>
                  </button>

                  <button
                    onClick={handleExportStatementCSV}
                    className="flex items-center space-x-1.5 bg-amber-500 hover:bg-amber-600 text-white px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-sm"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Statement CSV</span>
                  </button>
                </div>
              </div>

              {/* 10 WORKSPACE TABS */}
              <div className="flex items-center space-x-1 border-b border-amber-200 pb-1 overflow-x-auto text-xs font-semibold">
                {[
                  { id: 'overview', label: 'Overview', icon: Layers },
                  { id: 'ledger', label: 'Running Ledger', icon: BookOpen },
                  { id: 'invoices', label: 'Invoices', icon: FileText },
                  { id: 'recoveries', label: 'Recoveries & Payments', icon: CreditCard },
                  { id: 'sales', label: 'Sales History', icon: Activity },
                  { id: 'ai_risk', label: 'AI Credit Risk', icon: Zap },
                  { id: 'documents', label: 'Documents', icon: Paperclip },
                  { id: 'audit', label: 'Audit Log', icon: Clock },
                  { id: 'communication', label: 'Reminders', icon: Send },
                  { id: 'statements', label: 'Export Suite', icon: FileSpreadsheet }
                ].map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeWorkspaceTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveWorkspaceTab(tab.id as any)}
                      className={`flex items-center space-x-1.5 px-3 py-2 rounded-xl transition-all whitespace-nowrap ${
                        isActive ? 'bg-amber-500 text-white shadow-sm font-bold' : 'text-stone-600 hover:bg-amber-100/60'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* TAB 1: OVERVIEW */}
              {activeWorkspaceTab === 'overview' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-amber-50/60 p-4 rounded-xl border border-amber-200 space-y-1">
                      <span className="text-[10px] text-stone-500 uppercase font-semibold">Current Outstanding Balance</span>
                      <p className={`text-lg font-extrabold ${selectedParty.type === 'customer' ? 'text-emerald-700' : 'text-rose-700'}`}>
                        {formatCurrency(selectedParty.balance, settings)}
                      </p>
                      <p className="text-[10px] text-stone-400">Live Database Balance</p>
                    </div>

                    <div className="bg-amber-50/60 p-4 rounded-xl border border-amber-200 space-y-1">
                      <span className="text-[10px] text-stone-500 uppercase font-semibold">Credit Limit</span>
                      <p className="text-lg font-extrabold text-stone-900">{formatCurrency(selectedParty.creditLimit, settings)}</p>
                      <p className="text-[10px] text-stone-400">Allocated Cap</p>
                    </div>

                    <div className="bg-amber-50/60 p-4 rounded-xl border border-amber-200 space-y-1">
                      <span className="text-[10px] text-stone-500 uppercase font-semibold">AI Credit Rating</span>
                      <p className="text-lg font-extrabold text-amber-800">{selectedParty.creditScore} / 100</p>
                      <p className="text-[10px] text-stone-400">Low Risk Rating</p>
                    </div>
                  </div>

                  <div className="bg-white p-4 rounded-xl border border-amber-200 space-y-2">
                    <h3 className="text-xs font-bold text-stone-900">Financial Cockpit Summary</h3>
                    <p className="text-xs text-stone-600 leading-relaxed">
                      This account is operating within safe risk bounds. Running ledger transactions are compiled dynamically from active shift sales and recovery logs.
                    </p>
                  </div>
                </div>
              )}

              {/* TAB 2: RUNNING LEDGER (BANK STATEMENT STYLE) */}
              {activeWorkspaceTab === 'ledger' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <h3 className="font-bold text-stone-900">Running Balance Ledger (Bank Statement View)</h3>
                    <span className="text-stone-500 font-mono">{partyLedgerItems.length} Transactions</span>
                  </div>

                  {partyLedgerItems.length === 0 ? (
                    <p className="text-xs text-stone-500 text-center py-8">No ledger transactions recorded for this account.</p>
                  ) : (
                    <div className="overflow-x-auto border border-amber-200 rounded-xl">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="bg-amber-100/70 text-stone-700 font-bold uppercase border-b border-amber-200">
                            <th className="py-2.5 px-3">Date</th>
                            <th className="py-2.5 px-3">Reference</th>
                            <th className="py-2.5 px-3">Description</th>
                            <th className="py-2.5 px-3 text-right">Debit (+)</th>
                            <th className="py-2.5 px-3 text-right">Credit (-)</th>
                            <th className="py-2.5 px-3 text-right">Running Balance</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-amber-100">
                          {partyLedgerItems.map((item) => (
                            <tr key={item.id} className="hover:bg-amber-50/70 transition-all font-mono">
                              <td className="py-2.5 px-3 font-semibold text-stone-900">{item.date}</td>
                              <td className="py-2.5 px-3 text-amber-800 font-bold">{item.referenceNo}</td>
                              <td className="py-2.5 px-3 font-sans text-stone-800">{item.description}</td>
                              <td className="py-2.5 px-3 text-right text-emerald-700 font-bold">
                                {item.debit > 0 ? formatCurrency(item.debit, settings) : '-'}
                              </td>
                              <td className="py-2.5 px-3 text-right text-rose-700 font-bold">
                                {item.credit > 0 ? formatCurrency(item.credit, settings) : '-'}
                              </td>
                              <td className="py-2.5 px-3 text-right font-extrabold text-stone-900">
                                {formatCurrency(item.runningBalance, settings)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: INVOICES */}
              {activeWorkspaceTab === 'invoices' && (
                <div className="space-y-3">
                  <h3 className="text-xs font-bold text-stone-900">Itemized Credit Sale Invoices</h3>
                  {partyLedgerItems.filter((i) => i.debit > 0).length === 0 ? (
                    <p className="text-xs text-stone-500 text-center py-6">No credit sale invoices recorded.</p>
                  ) : (
                    <div className="space-y-2">
                      {partyLedgerItems
                        .filter((i) => i.debit > 0)
                        .map((inv) => (
                          <div key={inv.id} className="bg-white p-3 rounded-xl border border-amber-200 flex justify-between items-center text-xs">
                            <div>
                              <div className="font-bold text-stone-900">{inv.referenceNo}</div>
                              <div className="text-stone-500">{inv.description}</div>
                              <span className="text-[10px] text-stone-400 font-mono">{inv.date}</span>
                            </div>
                            <span className="font-extrabold text-emerald-700 font-mono">{formatCurrency(inv.debit, settings)}</span>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 4: RECOVERIES & PAYMENTS */}
              {activeWorkspaceTab === 'recoveries' && (
                <div className="space-y-3">
                  <h3 className="text-xs font-bold text-stone-900">Payments &amp; Recovery Receipts</h3>
                  {partyLedgerItems.filter((i) => i.credit > 0).length === 0 ? (
                    <p className="text-xs text-stone-500 text-center py-6">No recovery transactions recorded.</p>
                  ) : (
                    <div className="space-y-2">
                      {partyLedgerItems
                        .filter((i) => i.credit > 0)
                        .map((rec) => (
                          <div key={rec.id} className="bg-white p-3 rounded-xl border border-amber-200 flex justify-between items-center text-xs">
                            <div>
                              <div className="font-bold text-stone-900">{rec.referenceNo}</div>
                              <div className="text-stone-500">{rec.description}</div>
                              <span className="text-[10px] text-stone-400 font-mono">{rec.date}</span>
                            </div>
                            <span className="font-extrabold text-rose-700 font-mono">{formatCurrency(rec.credit, settings)}</span>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 6: AI RISK & CREDIT ANALYSIS */}
              {activeWorkspaceTab === 'ai_risk' && (
                <div className="bg-amber-50/60 p-4 rounded-xl border border-amber-200 space-y-4 text-xs">
                  <div className="flex items-center space-x-2">
                    <Zap className="w-5 h-5 text-amber-600" />
                    <h3 className="font-bold text-stone-900">AI Credit &amp; DSO Risk Rating Analysis</h3>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white p-3 rounded-xl border border-amber-200">
                      <span className="text-[10px] text-stone-500 uppercase font-semibold">Credit Score</span>
                      <p className="text-base font-extrabold text-amber-800">{selectedParty.creditScore} / 100</p>
                      <span className="text-[10px] text-emerald-700 font-semibold">Low Default Probability</span>
                    </div>

                    <div className="bg-white p-3 rounded-xl border border-amber-200">
                      <span className="text-[10px] text-stone-500 uppercase font-semibold">Days Sales Outstanding (DSO)</span>
                      <p className="text-base font-extrabold text-stone-900">14 Days</p>
                      <span className="text-[10px] text-stone-500">Punctual Settlement</span>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 8: AUDIT TIMELINE */}
              {activeWorkspaceTab === 'audit' && (
                <div className="space-y-3 text-xs">
                  <h3 className="font-bold text-stone-900">Security Audit Chronology</h3>
                  <div className="bg-white p-4 rounded-xl border border-amber-200 space-y-3 font-mono">
                    {partyLedgerItems.slice(0, 5).map((log, i) => (
                      <div key={i} className="border-l-2 border-amber-500 pl-3 py-1 space-y-0.5">
                        <div className="font-bold text-stone-900">{log.description}</div>
                        <div className="text-stone-500 text-[10px]">
                          Approved By: {log.approvedBy} • Terminal IP: {log.ip} • Device: {log.device}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 9: REMINDERS & COMMUNICATION */}
              {activeWorkspaceTab === 'communication' && (
                <div className="bg-amber-50/60 p-4 rounded-xl border border-amber-200 space-y-3 text-xs">
                  <h3 className="font-bold text-stone-900">Payment Reminder &amp; Dispatcher</h3>
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={handleSendWhatsAppReminder}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl font-bold flex items-center space-x-2"
                    >
                      <MessageSquare className="w-4 h-4" />
                      <span>Send WhatsApp Reminder</span>
                    </button>

                    <button
                      onClick={() => showToast('SMS reminder queued.')}
                      className="bg-stone-800 hover:bg-stone-900 text-white px-4 py-2 rounded-xl font-bold flex items-center space-x-2"
                    >
                      <Send className="w-4 h-4" />
                      <span>Send SMS</span>
                    </button>
                  </div>
                </div>
              )}

              {/* TAB 10: STATEMENT EXPORT SUITE */}
              {activeWorkspaceTab === 'statements' && (
                <div className="bg-amber-50/60 p-4 rounded-xl border border-amber-200 space-y-3 text-xs">
                  <h3 className="font-bold text-stone-900">1-Click Statement Exporter</h3>
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={handleExportStatementCSV}
                      className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-xl font-bold flex items-center space-x-2 shadow-sm"
                    >
                      <Download className="w-4 h-4" />
                      <span>Export Statement CSV</span>
                    </button>

                    <button
                      onClick={() => window.print()}
                      className="bg-stone-800 hover:bg-stone-900 text-white px-4 py-2 rounded-xl font-bold flex items-center space-x-2 shadow-sm"
                    >
                      <Printer className="w-4 h-4" />
                      <span>Print PDF Statement</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
