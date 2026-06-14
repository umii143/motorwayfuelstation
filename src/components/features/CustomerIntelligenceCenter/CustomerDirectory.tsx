/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState, useMemo } from 'react';
import { ResponsiveTable, TableColumn } from '../../shared/ResponsiveTable';
import { motion, AnimatePresence } from 'motion/react';
import { useStation } from '../../../contexts/StationContext';
import {
  Search,
  Plus,
  UserPlus,
  ArrowUpRight,
  ArrowDownRight,
  MessageSquare,
  FileText,
  User,
  Phone,
  MapPin,
  ShieldAlert,
  ChevronRight,
  FileBarChart2,
  Trash2,
  PlusCircle,
  Coins,
  Sparkles
} from 'lucide-react';
import EmptyState from '../../ui/EmptyState';
import { ModuleSearchBar } from '../../shared/ModuleSearchBar';
import { ExportToolbar } from '../../shared/ExportToolbar';
import PartyLedgerModal, { LedgerEntry, PartyInfo } from '../../ui/PartyLedgerModal';
import { Customer, Shift, Product, GlobalSettings, DebitEntry, RecoveryEntry, LubePosSale } from '../../../types';
import { formatCurrency, getCurrencySymbol } from '../../../lib/currency';
import { t as translate } from '../../../lib/translations';
import { fetchWithAuth } from '../../../lib/api';
import CustomerCreditDrillDownModal from '../ExecutiveDashboard/CustomerCreditDrillDownModal';

interface CustomersProps {
  settings: GlobalSettings;
  activeStationId: string;
  customers: Customer[];
  shifts: Shift[];
  products: Product[];
  lubePosSales: LubePosSale[];
  onAddCustomer: (customer: Customer) => void;
  onUpdateCustomer: (customer: Customer) => void;
  onDeleteCustomer: (customerId: string) => void;
  onUpdateShift: (shift: Shift) => void;
  onDeleteDebitEntry: (shiftId: string, entryId: string) => void;
  onDeleteRecoveryEntry: (shiftId: string, entryId: string) => void;
}

interface CustomerCardProps {
  cust: Customer;
  idx: number;
  isSelected: boolean;
  settings: GlobalSettings;
  t: (en: string, ur: string) => string;
  onSelect: (id: string) => void;
  onOpenLedger: (cust: Customer) => void;
}

const MemoizedCustomerCard = React.memo(({
  cust,
  idx,
  isSelected,
  settings,
  t,
  onSelect,
  onOpenLedger
}: CustomerCardProps) => {
  const outstanding = cust.balance;
  const isOwed = outstanding > 0;
  const isAdv = outstanding < 0;

  let stateColorBar = 'bg-slate-300';
  if (isOwed) stateColorBar = 'bg-rose-500';
  else if (isAdv) stateColorBar = 'bg-emerald-500';

  return (
    <motion.button
      onClick={() => onSelect(cust.id)}
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: Math.min(idx * 0.04, 0.4) }}
      className={`relative w-full text-left rounded-xl border p-4 shadow-xs transition-all flex items-center justify-between cursor-pointer ${
        isSelected
          ? 'border-orange-500 bg-orange-50/20'
          : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-md'
      }`}
    >
      <div className={`absolute top-0 bottom-0 left-0 w-1.5 rounded-l-md ${stateColorBar}`}></div>

      <div className="pl-2.5 flex-1 min-w-0">
        <h4 className="font-sans text-sm font-bold text-slate-800">
          {t(cust.name, cust.urduName)}
        </h4>
        <span className="font-mono text-[10px] text-slate-400 mt-1 block tracking-tight">
          📞 {cust.contact}
        </span>
      </div>

      <div className="flex flex-col items-end gap-1.5 shrink-0">
        <span className={`font-mono text-xs font-bold block ${isOwed ? 'text-rose-600' : isAdv ? 'text-emerald-700' : 'text-slate-400'}`}>
          {isOwed ? `${formatCurrency(outstanding, settings)}` : isAdv ? `- ${formatCurrency(Math.abs(outstanding), settings)}` : 'Balanced'}
        </span>
        <span className="font-sans text-[9px] text-slate-400 uppercase tracking-widest block">
          {isOwed ? t('Receivable', 'واجب الوصول') : isAdv ? t('Advance', 'ایڈوانس بقایا') : t('Settled', 'بے باق')}
        </span>
        <button
          onClick={e => { e.stopPropagation(); onOpenLedger(cust); }}
          className="flex items-center gap-1 rounded-md bg-slate-800 px-2 py-0.5 font-sans text-[10px] font-bold text-white hover:bg-slate-900 transition-colors cursor-pointer mt-1"
        >
          <FileBarChart2 className="h-3 w-3" />
          <span>View Ledger</span>
        </button>
      </div>
    </motion.button>
  );
}, (prev, next) => {
  return prev.cust.id === next.cust.id && 
         prev.cust.balance === next.cust.balance &&
         prev.isSelected === next.isSelected &&
         prev.settings.language === next.settings.language;
});


export default function CustomerDirectory({
  settings,
  activeStationId,
  customers,
  shifts,
  products,
  lubePosSales,
  onAddCustomer,
  onUpdateCustomer,
  onDeleteCustomer,
  onUpdateShift,
  onDeleteDebitEntry,
  onDeleteRecoveryEntry
}: CustomersProps) {
  const { showToast, showConfirm, showAlert } = useStation();
  const t = (en: string, ur: string) => translate(en, ur, settings);
  // Single source of truth: use activeStationId, not product-type heuristic
  const isLubeBusiness = activeStationId === 'st_lube';

  // States
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'udhar' | 'advance' | 'regular'>('all');
  const [timeFilter, setTimeFilter] = useState<'all' | 'weekly' | 'monthly' | 'yearly'>('all');

  // Ledger Modal State
  const [ledgerParty, setLedgerParty] = useState<PartyInfo | null>(null);
  const [modalLedgerEntries, setModalLedgerEntries] = useState<LedgerEntry[]>([]);
  const [isLedgerOpen, setIsLedgerOpen] = useState(false);

  // Enterprise Intelligence Modal State
  const [isDrillDownOpen, setIsDrillDownOpen] = useState(false);

  // Open full ledger for a customer
  const openCustomerLedger = (cust: Customer) => {
    const rawEntries: LedgerEntry[] = [];

    // From Shifts: debit sales
    shifts.forEach(sh => {
      sh.debitEntries.forEach(d => {
        if (d.customerId !== cust.id) return;
        const pName = products.find(p => p.id === d.productId)?.name || 'Product';
        rawEntries.push({
          id: `deb_${d.id}`,
          date: sh.date,
          description: `${pName} — ${d.quantity} units @ ${getCurrencySymbol(settings)} ${d.rate.toFixed(2)}${d.note ? ` | ${d.note}` : ''}`,
          debit: d.amount,
          credit: 0,
          balance: 0,
          tag: 'Credit Sale',
        });
      });

      // From Shifts: recovery entries
      sh.recoveryEntries.forEach(r => {
        if (r.customerId !== cust.id) return;
        rawEntries.push({
          id: `rec_${r.id}`,
          date: sh.date,
          description: `Payment Recovery via ${r.mode.toUpperCase()}${r.reference ? ` (Ref: ${r.reference})` : ''}`,
          debit: 0,
          credit: r.amount,
          balance: 0,
          tag: 'Recovery',
        });
      });

      // Bank cash entries linked to customer
      sh.bankCashEntries?.forEach(bc => {
        if (bc.customerId !== cust.id) return;
        rawEntries.push({
          id: `bc_${bc.id}`,
          date: sh.date,
          description: `Direct Bank Deposit${bc.reference ? ` (Ref: ${bc.reference})` : ''}`,
          debit: 0,
          credit: bc.amount,
          balance: 0,
          tag: 'Bank Deposit',
        });
      });
    });

    // From Lube POS sales
    lubePosSales.forEach(sale => {
      if (sale.customerId !== cust.id) return;
      const itemsSummary = sale.items.map(i => `${i.productName} ×${i.quantity}${i.unit}`).join(', ');
      if (sale.isReturn) {
        rawEntries.push({
          id: `lps_ret_${sale.id}`,
          date: sale.date,
          time: sale.time,
          description: `POS Return ${sale.invoiceNo}${itemsSummary ? ` — ${itemsSummary}` : ''}`,
          debit: 0,
          credit: sale.total,
          balance: 0,
          tag: 'Return',
        });
      } else if (sale.paymentMode === 'credit') {
        rawEntries.push({
          id: `lps_${sale.id}`,
          date: sale.date,
          time: sale.time,
          description: `POS Invoice ${sale.invoiceNo}${itemsSummary ? ` — ${itemsSummary}` : ''}`,
          debit: sale.total,
          credit: 0,
          balance: 0,
          tag: 'Credit Sale',
        });
      } else if (sale.isRecovery) {
        rawEntries.push({
          id: `lps_recov_${sale.id}`,
          date: sale.date,
          time: sale.time,
          description: `POS Recovery ${sale.invoiceNo}`,
          debit: 0,
          credit: sale.total,
          balance: 0,
          tag: 'Recovery',
        });
      }
    });

    // Sort ascending, compute running balance
    rawEntries.sort((a, b) => `${a.date}${a.time||''}`.localeCompare(`${b.date}${b.time||''}`));
    let running = 0;
    const withBalance = rawEntries.map(e => {
      running += e.debit - e.credit;
      return { ...e, balance: running };
    });

    // Reverse for latest-first display
    withBalance.reverse();

    const party: PartyInfo = {
      id: cust.id,
      name: cust.name,
      contact: cust.contact,
      address: cust.address,
      creditLimit: cust.creditLimit,
      balance: cust.balance,
      type: 'customer',
    };

    setLedgerParty(party);
    setModalLedgerEntries(withBalance);
    setIsLedgerOpen(true);
  };

  // Time filter checking helper
  const isWithinTimeFilter = (dateStr: string) => {
    if (timeFilter === 'all') return true;
    const baseline = new Date();
    baseline.setHours(0, 0, 0, 0);
    const target = new Date(dateStr);
    if (isNaN(target.getTime())) return true;
    const diffDays = (baseline.getTime() - target.getTime()) / (1000 * 3600 * 24);
    if (timeFilter === 'weekly') return diffDays >= 0 && diffDays <= 7;
    if (timeFilter === 'monthly') return diffDays >= 0 && diffDays <= 30;
    if (timeFilter === 'yearly') return diffDays >= 0 && diffDays <= 365;
    return true;
  };

  // Dynamic KPI metrics for Customer Accounts
  const kpiStats = useMemo(() => {
    // 1. Total receivables (customers with positive/udhar balances)
    const totalReceivables = customers.reduce((sum, c) => (c.balance > 0 ? sum + c.balance : sum), 0);

    // 2. Active Debtors
    const activeDebtorsCount = customers.filter(c => c.balance > 0).length;

    // 3. Credit Extended (sum of debitEntries in shifts matching the time filter)
    let creditExtendedSum = 0;
    // 4. Total Recovery (sum of recoveryEntries in shifts matching the time filter)
    let totalRecoverySum = 0;

    shifts.forEach(sh => {
      if (!isWithinTimeFilter(sh.date)) return;
      sh.debitEntries.forEach(d => {
        creditExtendedSum += d.amount;
      });
      sh.recoveryEntries.forEach(r => {
        totalRecoverySum += r.amount;
      });
    });

    lubePosSales.forEach(sale => {
      if (sale.paymentMode === 'credit' && isWithinTimeFilter(sale.date)) {
        creditExtendedSum += sale.total;
      }
    });

    return {
      totalReceivables,
      activeDebtorsCount,
      creditExtendedSum,
      totalRecoverySum
    };
  }, [customers, shifts, timeFilter, lubePosSales]);
  
  // Create customer Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [addName, setAddName] = useState('');
  const [addUrduName, setAddUrduName] = useState('');
  const [showExport, setShowExport] = useState(false);
  const [addContact, setAddContact] = useState('');
  const [addAddress, setAddAddress] = useState('');
  const [addLimit, setAddLimit] = useState('');
  const [addOpeningBal, setAddOpeningBal] = useState('');

  // Edit Customer Modal state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editCustName, setEditCustName] = useState('');
  const [editCustUrduName, setEditCustUrduName] = useState('');
  const [editCustContact, setEditCustContact] = useState('');
  const [editCustAddress, setEditCustAddress] = useState('');
  const [editCustLimit, setEditCustLimit] = useState('');

  // Active Customer Detail Panel Transaction States
  const [isAddingTxn, setIsAddingTxn] = useState(false);
  const [txnType, setTxnType] = useState<'debit' | 'credit'>('debit');
  const [txnProdId, setTxnProdId] = useState(() => products[0]?.id || '');
  const [txnQty, setTxnQty] = useState('');
  const [txnAmount, setTxnAmount] = useState('');
  const [txnNote, setTxnNote] = useState('');
  const [txnMode, setTxnMode] = useState<'cash' | 'cheque' | 'transfer'>('cash');

  // AI Credit Insights State
  const [isGeneratingAiInsights, setIsGeneratingAiInsights] = useState(false);
  const [aiInsightsResult, setAiInsightsResult] = useState<string | null>(null);

  const generateAICreditInsights = async () => {
    setIsGeneratingAiInsights(true);
    setAiInsightsResult(null);
    try {
      // Limit to max 50 top debtors to avoid token limit
      const topDebtors = [...customers].sort((a, b) => b.balance - a.balance).slice(0, 50);
      const creditContext = {
        totalReceivables: kpiStats.totalReceivables,
        activeDebtors: kpiStats.activeDebtorsCount,
        creditExtendedSum: kpiStats.creditExtendedSum,
        totalRecoverySum: kpiStats.totalRecoverySum,
        topDebtors: topDebtors.map(c => ({ name: c.name, balance: c.balance, limit: c.creditLimit }))
      };

      const response = await fetchWithAuth('/api/ai-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemPrompt: 'You are an AI financial auditor for a fuel station. Analyze the provided credit customer data. Highlight key risks, top debtors, recovery performance, and provide strategic recommendations in 3-4 concise sentences.',
          userMessage: JSON.stringify(creditContext),
          language: settings.language,
          conversationHistory: []
        })
      });

      if (!response.ok) throw new Error('Failed to generate AI insights');
      const data = await response.json();
      setAiInsightsResult(data.reply);
    } catch (error) {
      console.error(error);
      setAiInsightsResult(t("⚠️ Could not generate AI insights.", "⚠️ AI تجزیہ تیار نہیں ہو سکا۔"));
    } finally {
      setIsGeneratingAiInsights(false);
    }
  };

  // Selected customer object lookup
  const currentCustomer = useMemo(() => {
    if (!selectedCustomerId) return null;
    return customers.find(c => c.id === selectedCustomerId) || null;
  }, [selectedCustomerId, customers]);

  useEffect(() => {
    if (!txnProdId && products[0]?.id) {
      setTxnProdId(products[0].id);
      return;
    }

    if (txnProdId && !products.some(product => product.id === txnProdId)) {
      setTxnProdId(products[0]?.id || '');
    }
  }, [products, txnProdId]);

  // Dynamic search/filter trigger
  const filteredCustomers = useMemo(() => {
    return customers.filter(c => {
      const matchesSearch = 
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        c.urduName.includes(searchQuery) ||
        c.contact.includes(searchQuery);

      if (!matchesSearch) return false;

      if (filterType === 'udhar') return c.balance > 0;
      if (filterType === 'advance') return c.balance < 0;
      if (filterType === 'regular') return c.balance === 0;
      return true;
    });
  }, [customers, searchQuery, filterType]);

  const exportColumns = [
    { key: 'name', label: 'Name', urduLabel: 'نام' },
    { key: 'contact', label: 'Contact', urduLabel: 'رابطہ نمبر' },
    { key: 'balance', label: 'Balance', urduLabel: 'بقایا جات' },
    { key: 'creditLimit', label: 'Credit Limit', urduLabel: 'ادھار کی حد' },
    { key: 'address', label: 'Address', urduLabel: 'پتہ' }
  ];

  // Aggregate customer details from shifts (Ledger views)
  const ledgerEntries = useMemo(() => {
    if (!currentCustomer) return [];

    const entries: Array<{
      id: string;
      date: string;
      sortKey: string;
      description: string;
      debit: number;  // Outflowing credit sale to party
      credit: number; // Inflowing collection payments received
      balance: number;
      shiftId?: string;
      entryId?: string;
      type?: 'debit' | 'recovery';
    }> = [];

    // Append Opening Balance if configured
    // Note: Opening balance represents previous outstanding
    let runningBalance = 0;

    // We can compile occurrences of this customer across ALL historical shifts
    shifts.forEach(sh => {
      // Find credit sales (debits)
      sh.debitEntries.forEach(d => {
        if (d.customerId === currentCustomer.id) {
          const pName = products.find(p => p.id === d.productId)?.name || 'Fuel';
          entries.push({
            id: `deb_${d.id}`,
            date: sh.date,
            sortKey: `${sh.date}T23:59`,
            description: `${pName} ${d.quantity}L @ ${getCurrencySymbol(settings)} ${d.rate} ${d.note ? `(${d.note})` : ''}`,
            debit: d.amount,
            credit: 0,
            balance: 0,
            shiftId: sh.id,
            entryId: d.id,
            type: 'debit'
          });
        }
      });

      // Find recovery receipts (credits)
      sh.recoveryEntries.forEach(r => {
        if (r.customerId === currentCustomer.id) {
          entries.push({
            id: `rec_${r.id}`,
            date: sh.date,
            sortKey: `${sh.date}T23:59`,
            description: t(`Payment Recovery via ${r.mode.toUpperCase()} ${r.reference ? `(Ref: ${r.reference})` : ''}`, `${r.mode} کے ذریعے رقم کی وصولی`),
            debit: 0,
            credit: r.amount,
            balance: 0,
            shiftId: sh.id,
            entryId: r.id,
            type: 'recovery'
          });
        }
      });
      
      // Look also for bank collections linked
      sh.bankCashEntries.forEach(bc => {
        if (bc.customerId === currentCustomer.id) {
          entries.push({
            id: `bc_${bc.id}`,
            date: sh.date,
            sortKey: `${sh.date}T23:59`,
            description: t(`Direct Deposit HBL Cash (Ref: ${bc.reference})`, `براہ راست ایچ بی ایل اکاؤنٹ میں کیش جمع کروایا`),
            debit: 0,
            credit: bc.amount,
            balance: 0
          });
        }
      });
    });

    lubePosSales.forEach(sale => {
      if (sale.customerId !== currentCustomer.id) {
        return;
      }

      const itemsSummary = sale.items
        .map(item => `${item.productName} ${item.quantity}${item.unit}`)
        .join(', ');

      if (sale.isReturn) {
        entries.push({
          id: `lps_ret_${sale.id}`,
          date: sale.date,
          sortKey: `${sale.date}T${sale.time || '23:59'}`,
          description: t(
            `Lube POS Return ${sale.invoiceNo}${itemsSummary ? ` - ${itemsSummary}` : ''}`,
            `لیوب پی او ایس واپسی ${sale.invoiceNo}${itemsSummary ? ` - ${itemsSummary}` : ''}`
          ),
          debit: 0,
          credit: sale.total,
          balance: 0
        });
      } else if (sale.isRecovery) {
        entries.push({
          id: `lps_rec_${sale.id}`,
          date: sale.date,
          sortKey: `${sale.date}T${sale.time || '23:59'}`,
          description: t(`Lube POS Recovery: ${sale.invoiceNo}`, `لیوب پی او ایس وصولی: ${sale.invoiceNo}`),
          debit: 0,
          credit: sale.total,
          balance: 0
        });
      } else if (sale.paymentMode === 'credit') {
        entries.push({
          id: `lps_sale_${sale.id}`,
          date: sale.date,
          sortKey: `${sale.date}T${sale.time || '23:59'}`,
          description: t(
            `Lube POS Invoice ${sale.invoiceNo}${itemsSummary ? ` - ${itemsSummary}` : ''}`,
            `لیوب پی او ایس بل ${sale.invoiceNo}${itemsSummary ? ` - ${itemsSummary}` : ''}`
          ),
          debit: sale.total,
          credit: 0,
          balance: 0
        });
      }
    });

    // Sort by Date ascending
    entries.sort((a, b) => a.sortKey.localeCompare(b.sortKey));

    // Formulate cumulative balances log
    let totalBal = 0;
    const computed = entries.map(item => {
      totalBal += item.debit - item.credit;
      return {
        ...item,
        balance: totalBal
      };
    });

    // Include final balance verification matches
    // Reverse sort for timeline view display (latest top)
    return computed.reverse();
  }, [currentCustomer, shifts, products, settings, lubePosSales, t]);


  // ==========================================
  // HANDLERS
  // ==========================================
  
  const handleAddNewCustomerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!addName) {
      showToast(t('Customer name is required.', 'گاہک کا نام لکھنا ضروری ہے۔'), 'error');
      return;
    }

    const newCust: Customer = {
      id: `c_${Date.now()}`,
      name: addName,
      urduName: addUrduName || addName,
      contact: addContact,
      address: addAddress,
      creditLimit: Number(addLimit) || 100000,
      balance: Number(addOpeningBal) || 0
    };

    onAddCustomer(newCust);
    
    // Reset Form
    setAddName('');
    setAddUrduName('');
    setAddContact('');
    setAddAddress('');
    setAddLimit('');
    setAddOpeningBal('');
    setShowAddModal(false);
  };

  const handleManualTransactionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentCustomer) return;

    const amt = Number(txnAmount);
    if (!amt || amt <= 0) {
      showToast(t('Please enter a valid amount.', 'براہ کرم درست رقم درج کریں۔'), 'error');
      return;
    }

    // Compute updated balances
    let newBal = currentCustomer.balance;
    if (txnType === 'debit') {
      newBal += amt;
    } else {
      newBal -= amt;
    }

    const updatedCustomerObj = {
      ...currentCustomer,
      balance: newBal
    };

    onUpdateCustomer(updatedCustomerObj);

    // Dynamic adjustment logged inside a simulated current mock shift for ledger audit trail representation
    // Find active shift or create an adjustments mock shift to keep calculations consistent
    const activeRunning = shifts.find(s => s.status === 'active');
    if (activeRunning) {
      if (txnType === 'debit') {
        const qty = Number(txnQty) || 1;
        const rate = amt / qty;
        const newD: DebitEntry = {
          id: `manual_deb_${Date.now()}`,
          customerId: currentCustomer.id,
          productId: txnProdId,
          quantity: qty,
          rate,
          amount: amt,
          note: txnNote || 'Manual ledger adjust debit'
        };
        onUpdateShift({
          ...activeRunning,
          debitEntries: [...activeRunning.debitEntries, newD]
        });
      } else {
        const newR: RecoveryEntry = {
          id: `manual_rec_${Date.now()}`,
          customerId: currentCustomer.id,
          amount: amt,
          mode: txnMode,
          reference: txnNote || 'Manual ledger adjust credit'
        };
        onUpdateShift({
          ...activeRunning,
          recoveryEntries: [...activeRunning.recoveryEntries, newR]
        });
      }
    } else {
      // Mock log simulation directly on detail view ledger histories if no shift is currently running
      showAlert(
        t('Account Adjusted', 'کھاتہ ایڈجسٹمنٹ'),
        t('Account adjusted! Direct balance updated. Note: To see this in Ledger timelines, register transactions inside a running shift.', 'کھاتہ ایڈجسٹ ہو گیا! براہ راست بیلنس اپ ڈیٹ ہو گیا ہے۔')
      );
    }

    // Reset inputs
    setTxnAmount('');
    setTxnQty('');
    setTxnNote('');
    setIsAddingTxn(false);
  };

  // WhatsApp Message Statement reminder generator
  const triggerWhatsAppReminder = () => {
    if (!currentCustomer) return;
    const isUrduLang = settings.language === 'ur';

    const msgEn = `Respected Custumer ${currentCustomer.name}, this is a reminder from *${settings.stationName}*. Your outstanding balance is *${getCurrencySymbol(settings)} ${currentCustomer.balance.toLocaleString()}*. Please clear dues. Thank you!`;
    const msgUr = `محترم گاہک ${currentCustomer.urduName}، مطلع کیا جاتا ہے کہ *${settings.stationUrduName}* پٹرولیم کھاتے کی فائنل بقایا رقم *${getCurrencySymbol(settings)} ${currentCustomer.balance.toLocaleString()}* ہے۔ مہربانی فرما کر واجب الادا رقم ادا کیجئے ۔ شکریہ!`;

    const encoded = encodeURIComponent(isUrduLang ? msgUr : msgEn);
    const link = `https://wa.me/${currentCustomer.contact.replace(/[^0-9]/g, '')}?text=${encoded}`;
    
    // Fallback sandbox open
    window.open(link, '_blank');
  };

  return (
    <div className="space-y-6 pb-16 lg:pb-0">
      
      {/* HEADER ROW WITH INTEGRATED DYNAMIC TIME FILTER */}
      <div className="flex flex-col gap-4 border-b border-slate-200 pb-4">
        <div className="flex flex-row items-center justify-between gap-4">
          <div className="flex-1 min-w-0">
            <span className="font-mono text-[9px] font-black text-orange-600 uppercase tracking-widest block mb-0.5">OPERATIONS</span>
            <h2 className="font-sans text-xl sm:text-2xl font-black tracking-tight text-slate-900 flex items-center gap-2">
              <User className="h-5 w-5 sm:h-6 sm:w-6 text-orange-600 shrink-0" />
              <span className="truncate">{t('Accounts Receivable', 'گاہکوں کا بقایا کھاتہ')}</span>
            </h2>
            <p className="font-sans text-xs text-slate-500 mt-1 hidden sm:block">
              {t('Manage outstanding credit lines, ledger statement reconciliations, reminders and receipts.', 'صارفین کی بقایاجات، کریڈٹ لمٹس اور واٹس ایپ چالان رسیپٹس کا مکمل کنٹرول۔')}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={generateAICreditInsights}
              disabled={isGeneratingAiInsights || customers.length === 0}
              className={`hidden sm:flex items-center justify-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2.5 font-sans text-xs font-bold text-white shadow-md shadow-indigo-500/10 hover:bg-indigo-700 transition-all cursor-pointer ${isGeneratingAiInsights ? 'opacity-50' : ''}`}
            >
              <Sparkles className={`h-4 w-4 ${isGeneratingAiInsights ? 'animate-spin' : ''}`} />
              <span>{t('AI Insights', 'اے آئی تجزیہ')}</span>
            </button>
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center justify-center gap-1.5 rounded-lg bg-orange-600 px-3 py-2 sm:px-4 sm:py-2.5 font-sans text-xs font-bold text-white shadow-md shadow-orange-500/10 hover:bg-orange-700 transition-all cursor-pointer"
            >
              <UserPlus className="h-4 w-4" />
              <span className="hidden sm:inline">{t('Add Customer', 'نیا گاہک')}</span>
              <span className="sm:hidden">{t('Add', 'نیا')}</span>
            </button>
          </div>
        </div>

        {/* TIME FILTER ROW */}
        <div className="flex bg-slate-100 rounded-lg p-1 border border-slate-200 shadow-sm overflow-x-auto hide-scrollbar sm:w-max">
          {(['all', 'weekly', 'monthly', 'yearly'] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => setTimeFilter(filter)}
              className={`px-3 py-1.5 font-sans text-[11px] font-bold uppercase tracking-wider rounded-md transition-all cursor-pointer whitespace-nowrap ${
                timeFilter === filter
                  ? 'bg-orange-600 text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
              }`}
            >
              {filter === 'all' && t('All-Time', 'کل وقت')}
              {filter === 'weekly' && t('Weekly', 'ہفتہ وار')}
              {filter === 'monthly' && t('Monthly', 'ماہانہ')}
              {filter === 'yearly' && t('Yearly', 'سالانہ')}
            </button>
          ))}
        </div>
      </div>

      {aiInsightsResult && (
        <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-4 shadow-sm relative">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="h-4 w-4 text-indigo-500" />
            <span className="font-bold text-indigo-800 text-sm">{t('AI Credit Insights', 'اے آئی کریڈٹ تجزیہ')}</span>
          </div>
          <div className="prose prose-sm max-w-none text-indigo-900 whitespace-pre-wrap leading-relaxed text-xs">
            {aiInsightsResult}
          </div>
        </div>
      )}

      {/* UNIVERSAL MODULE SEARCH BAR */}
      <ModuleSearchBar
        moduleName={t('Customers', 'گاہک')}
        placeholder={t('Search by name/phone...', 'کھاتہ تلاش کریں...')}
        onSearch={setSearchQuery}
        onFilter={() => setFilterType(prev => prev === 'all' ? 'udhar' : 'all')}
        onExport={() => setShowExport(true)}
      />

      {/* DYNAMIC KPI CARDS SECTION */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
        {/* AMBER CARD - TOTAL RECEIVABLES */}
        <div 
          onClick={() => setIsDrillDownOpen(true)}
          className="rounded-2xl border border-amber-200 bg-amber-50/60 p-5 shadow-xs flex flex-col justify-between min-h-[110px] relative overflow-hidden cursor-pointer hover:shadow-md transition-shadow group"
        >
          <div className="flex items-start justify-between relative z-10">
            <div>
              <span className="font-mono text-[9px] font-black text-amber-800 uppercase tracking-widest block mb-1">TOTAL RECEIVABLES</span>
              <h3 className="font-sans text-2xl font-black text-amber-900 mt-1 truncate group-hover:scale-105 transition-transform origin-left">
                {formatCurrency(kpiStats.totalReceivables, settings)}
              </h3>
            </div>
            <div className="rounded-xl bg-amber-100 p-2 text-amber-700 animate-bounce">
              <Coins className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 flex items-center gap-1 text-[10px] text-amber-700 font-bold">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
            <span>{t('Total active loans outstanding', 'فعال ادھار بیلنس')}</span>
          </div>
        </div>

        {/* GREEN CARD - ACTIVE DEBTORS */}
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-5 shadow-xs flex flex-col justify-between min-h-[110px] relative overflow-hidden">
          <div className="flex items-start justify-between">
            <div>
              <span className="font-mono text-[9px] font-black text-emerald-800 uppercase tracking-widest block mb-1">ACTIVE DEBTORS</span>
              <h3 className="font-sans text-2xl font-black text-emerald-905 mt-1">
                {kpiStats.activeDebtorsCount}
              </h3>
            </div>
            <div className="rounded-xl bg-emerald-100 p-2 text-emerald-700">
              <User className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 flex items-center gap-1 text-[10px] text-emerald-700 font-bold">
            <span>of {customers.length} total active users</span>
          </div>
        </div>

        {/* CRIMSON CARD - CREDIT EXTENDED */}
        <div className="rounded-2xl border border-rose-200 bg-rose-50/60 p-5 shadow-xs flex flex-col justify-between min-h-[110px] relative overflow-hidden">
          <div className="flex items-start justify-between">
            <div>
              <span className="font-mono text-[9px] font-black text-rose-800 uppercase tracking-widest block mb-1">CREDIT EXTENDED</span>
              <h3 className="font-sans text-2xl font-black text-rose-900 mt-1 text-ellipsis overflow-hidden">
                {formatCurrency(kpiStats.creditExtendedSum, settings)}
              </h3>
            </div>
            <div className="rounded-xl bg-rose-100 p-2 text-rose-700">
              <ArrowUpRight className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 flex items-center gap-1 text-[10px] text-rose-700 font-bold">
            <span>{t('New Udhar given in this period', 'اس مدت کے دوران دیا گیا نیا ادھار')}</span>
          </div>
        </div>

        {/* BLUE CARD - TOTAL RECOVERY */}
        <div className="rounded-2xl border border-blue-200 bg-blue-50/60 p-5 shadow-xs flex flex-col justify-between min-h-[110px] relative overflow-hidden">
          <div className="flex items-start justify-between">
            <div>
              <span className="font-mono text-[9px] font-black text-blue-800 uppercase tracking-widest block mb-1">TOTAL RECOVERY</span>
              <h3 className="font-sans text-2xl font-black text-blue-900 mt-1 text-ellipsis overflow-hidden">
                {formatCurrency(kpiStats.totalRecoverySum, settings)}
              </h3>
            </div>
            <div className="rounded-xl bg-blue-100 p-2 text-blue-700">
              <ArrowDownRight className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 flex items-center gap-1 text-[10px] text-blue-700 font-bold">
            <span>{t('Total collection from debtors', 'وصول شدہ کل ادھار رقم')}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        
        {/* LEFT COLUMN: CUSTOMER ACCOUNTS LISTINGS */}
        <div className="space-y-4">
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs space-y-3.5">
            {/* Filter buttons track */}
            <div className="flex flex-wrap gap-1.5">
              {[
                { id: 'all', label: 'All', urdu: 'تمام' },
                { id: 'udhar', label: 'Udhar Only', urdu: 'صرف بقایا' },
                { id: 'advance', label: 'Advance Paid', urdu: 'ایڈوانس' },
                { id: 'regular', label: 'Regular', urdu: 'نامل' }
              ].map(f => (
                <button
                  key={f.id}
                  onClick={() => setFilterType(f.id as any)}
                  className={`rounded-md px-2.5 py-1 text-[11px] font-sans font-bold cursor-pointer transition-colors ${
                    filterType === f.id
                      ? 'bg-orange-600 text-white shadow-xs'
                      : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
                  }`}
                >
                  {t(f.label, f.urdu)}
                </button>
              ))}
            </div>

          </div>

          {/* Cards listing */}
          <div className="space-y-2">
            {customers.length === 0 ? (
              <EmptyState
                icon={User}
                title={t('No customers yet.', 'کوئی کھاتہ دار موجود نہیں ہے۔')}
                description={t('Add your first customer account to begin tracking payments.', 'کھاتہ اور ادھار فروخت ریکارڈ کرنے کے لیے پہلا گاہک شامل کریں۔')}
                actionLabel={t('+ Add First Customer', '+ پہلا گاہک شامل کریں')}
                onAction={() => setShowAddModal(true)}
              />
            ) : filteredCustomers.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-200 py-12 text-center text-slate-400 font-sans text-xs bg-white">
                {t('No customers matched filters.', 'کوئی کھاتہ میچ نہیں ہوا۔')}
              </div>
            ) : (
              <div className="max-h-[500px] overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                {filteredCustomers.map((cust, index) => (
                  <MemoizedCustomerCard
                    key={cust.id}
                    cust={cust}
                    idx={index}
                    isSelected={selectedCustomerId === cust.id}
                    settings={settings}
                    t={t}
                    onSelect={setSelectedCustomerId}
                    onOpenLedger={openCustomerLedger}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN (2/3 WIDTH): DETAILED CLIENT LEDGER Timelines */}
        <div className="lg:col-span-2">
          {currentCustomer ? (
            <div className="rounded-xl border border-slate-200 bg-white shadow-xs p-5 space-y-6">
              
              {/* Client detailed profile row */}
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-4">
                <div className="flex gap-3 items-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-100 text-orange-600">
                    <User className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-sans text-lg font-bold text-slate-900 leading-tight">
                      {t(currentCustomer.name, currentCustomer.urduName)}
                    </h3>
                    <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 font-sans text-xs text-slate-400 font-medium">
                      <span className="flex items-center gap-1"><Phone className="h-3 w-3 text-slate-300" /> {currentCustomer.contact}</span>
                      <span className="flex items-center gap-1"><MapPin className="h-3 w-3 text-slate-300" /> {currentCustomer.address}</span>
                    </div>
                  </div>
                </div>

                {/* WhatsApp Statement & trigger shortcuts */}
                <div className="flex flex-wrap gap-2 self-start sm:self-center">
                  <button
                    onClick={triggerWhatsAppReminder}
                    className="flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 font-sans text-xs font-bold text-emerald-700 hover:bg-emerald-100 transition-colors cursor-pointer"
                  >
                    <MessageSquare className="h-3.5 w-3.5 text-emerald-600" />
                    <span>{t('WhatsApp Statement', 'چالان واٹس ایپ')}</span>
                  </button>

                  <button
                    onClick={() => window.print()}
                    className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 font-sans text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    <FileText className="h-3.5 w-3.5" />
                    <span>{t('Statement PDF', 'اکاؤنٹ لیجر PDF')}</span>
                  </button>

                  <button
                    onClick={() => {
                      setEditCustName(currentCustomer.name);
                      setEditCustUrduName(currentCustomer.urduName);
                      setEditCustContact(currentCustomer.contact);
                      setEditCustAddress(currentCustomer.address);
                      setEditCustLimit(String(currentCustomer.creditLimit));
                      setShowEditModal(true);
                    }}
                    className="flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 font-sans text-xs font-bold text-blue-700 hover:bg-blue-100 transition-colors cursor-pointer"
                  >
                    <span>✏️ {t('Edit', 'ترمیم')}</span>
                  </button>

                  <button
                    onClick={() => {
                      if (currentCustomer.balance !== 0) {
                        showToast(t(
                          `Cannot delete “${currentCustomer.name}” — balance Rs.${currentCustomer.balance.toLocaleString()} must be cleared first.`,
                          `کھاتہ حذف نہیں ہو سکتا ہے کیونکہ بیلنس باقی ہے۔`
                        ), 'error');
                        return;
                      }
                      showConfirm(
                        t('Confirm Customer Deletion', 'کسٹمر حذف کرنے کی تصدیق'),
                        t(
                          `Delete “${currentCustomer.name}”? This cannot be undone.`,
                          `کیا آپ اس کھاتہ دار کو حذف کرنا چاہتے ہیں؟`
                        ),
                        () => {
                          onDeleteCustomer(currentCustomer.id);
                          setSelectedCustomerId(null);
                        }
                      );
                    }}
                    className="flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 font-sans text-xs font-bold text-red-700 hover:bg-red-100 transition-colors cursor-pointer"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>{t('Delete', 'حذف')}</span>
                  </button>
                </div>
              </div>

              {/* Outstanding metrics display & credit limit warning bar */}
              <div className="grid grid-cols-1 sm:grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="rounded-lg p-4 bg-slate-50 border border-slate-100 font-sans text-xs flex flex-col justify-between relative overflow-hidden">
                  <div className="absolute top-0 bottom-0 left-0 w-1 bg-red-400"></div>
                  <span className="text-slate-400 font-bold uppercase tracking-wider">{t('Remaining Credit Space:', 'باقی گنجائش بقایا قرض:')}</span>
                  <div className="mt-2.5 flex items-end justify-between">
                    <div>
                      <strong className="text-sm font-bold text-slate-800">{formatCurrency(Math.max(0, currentCustomer.creditLimit - currentCustomer.balance), settings)}</strong>
                      <span className="text-[10px] text-slate-400 block mt-0.5">{t('Allocated Limit:', 'مقررہ حد کریڈٹ:')} {formatCurrency(currentCustomer.creditLimit, settings)}</span>
                    </div>
                    
                    {/* Limit exhaustion gauge */}
                    <span className="font-mono font-bold text-[10px] text-slate-400 bg-slate-200/55 px-2 py-0.5 rounded-full">
                      {Math.min(100, Math.round((currentCustomer.balance / currentCustomer.creditLimit) * 100))}% Used
                    </span>
                  </div>
                </div>

                <div className="rounded-lg p-4 bg-orange-55/10 border border-orange-100 flex flex-col justify-between">
                  <span className="font-sans text-xs text-orange-600 font-bold uppercase tracking-wider">{t('Total Balance Outstanding Due:', 'حتمی واجب الادا بیلنس رقم:')}</span>
                  <div className="mt-2.5">
                    <strong className="font-mono text-xl font-bold text-orange-700">
                      {formatCurrency(currentCustomer.balance, settings)}
                    </strong>
                    <span className="font-sans text-[10px] text-orange-500 tracking-tight block mt-1">{t('Receivable balance pending collection', 'قرض دھندہ کھاتہ بقایا جات')}</span>
                  </div>
                </div>
              </div>

              {/* Fast Transaction Action Drawer */}
              <div className="border border-slate-200 border-dashed rounded-lg p-4 bg-slate-50/50">
                {!isAddingTxn ? (
                  <button
                    onClick={() => setIsAddingTxn(true)}
                    className="w-full py-2 bg-slate-800 text-white font-sans text-xs font-bold rounded-md hover:bg-slate-900 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <PlusCircle className="h-4 w-4" />
                    <span>{t('ADD MANUAL ADJUSTMENT TRANSACTION', 'کھاتے میں براہ راست فیس/ادائیگی شامل کریں')}</span>
                  </button>
                ) : (
                  <form onSubmit={handleManualTransactionSubmit} className="space-y-4">
                    <div className="flex justify-between items-center border-b border-slate-100 pb-2 mb-3">
                      <strong className="font-sans text-xs font-bold text-slate-700">{t('Direct Ledger Correction Entry:', 'کھاتیدار تصحیح فارم:')}</strong>
                      <button type="button" onClick={() => setIsAddingTxn(false)} className="text-xs font-bold text-slate-400 hover:text-slate-650">Cancel</button>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 min-h-[90px] gap-3.5 sm:grid-cols-2">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">{t('Transaction nature:', 'انٹری کی قسم:')}</label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                          <button
                            type="button"
                            onClick={() => setTxnType('debit')}
                            className={`py-1.5 rounded-md border font-sans text-xs font-bold ${
                              txnType === 'debit' ? 'border-red-500 bg-red-50 text-red-700 shadow-xs font-bold' : 'border-slate-200 text-slate-550'
                            }`}
                          >
                            📈 {t('DEBIT (Credit Sale)', 'قرض / بل فیس')}
                          </button>
                          <button
                            type="button"
                            onClick={() => setTxnType('credit')}
                            className={`py-1.5 rounded-md border font-sans text-xs font-bold ${
                              txnType === 'credit' ? 'border-emerald-500 bg-emerald-50 text-emerald-700 shadow-xs font-bold' : 'border-slate-200 text-slate-550'
                            }`}
                          >
                            📉 {t('CREDIT (Payment Rcvd)', 'ادائیگی وصولی')}
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">{t('Amount (PKR Rupees):', 'رقم (روپے):')}</label>
                        <input
                          type="number"
                          value={txnAmount}
                          required
                          onChange={(e) => setTxnAmount(e.target.value)}
                          placeholder="e.g. 5000"
                          className="w-full rounded-md border border-slate-200 bg-white px-3 py-1 font-mono text-sm focus:border-orange-500"
                        />
                      </div>

                      {txnType === 'debit' ? (
                        <>
                          <div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">{t('Product:', 'پراڈکٹ:')}</label>
                            <select value={txnProdId} onChange={(e) => setTxnProdId(e.target.value)} className="w-full rounded-md border border-slate-200 bg-white px-2 py-1 text-xs">
                              {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                            </select>
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">{t('Litres Volume (Optional):', 'مقدار لیٹر (اختیاری):')}</label>
                            <input
                              type="number"
                              value={txnQty}
                              onChange={(e) => setTxnQty(e.target.value)}
                              placeholder="e.g. 20"
                              className="w-full rounded-md border border-slate-200 bg-white px-3 py-1 font-mono text-xs focus:border-orange-500"
                            />
                          </div>
                        </>
                      ) : (
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">{t('Method:', 'طریقہ:')}</label>
                          <select value={txnMode} onChange={(e) => setTxnMode(e.target.value as any)} className="w-full rounded-md border border-slate-200 bg-white px-2 py-1 text-xs">
                            <option value="cash">Cash</option>
                            <option value="cheque">Cheque</option>
                            <option value="transfer">Bank transfer</option>
                          </select>
                        </div>
                      )}

                      <div className="sm:col-span-2">
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">{t('Narration / Comment Note:', 'تفصیل / نوٹ:')}</label>
                        <input
                          type="text"
                          value={txnNote}
                          onChange={(e) => setTxnNote(e.target.value)}
                          placeholder="e.g. Account adjustment direct balance clearing"
                          className="w-full rounded-md border border-slate-200 bg-white px-3 py-1 font-sans text-xs focus:border-orange-500"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="w-full py-2 bg-orange-600 text-white font-sans text-xs font-bold rounded-md hover:bg-orange-700 cursor-pointer shadow-md shadow-orange-500/10"
                    >
                      {t('SUBMIT ADJUSTMENT INVOICE', 'تصحیح انٹری شامل کریں')}
                    </button>
                  </form>
                )}
              </div>

              {/* Transaction Ledger Timelines */}
              <div className="space-y-3.5 pt-1.5">
                <h4 className="font-sans text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2 mb-3">
                  {t('Comprehensive Ledger History & Ledger Cards', 'تفصیلی کھاتہ کار روزنامچہ')}
                </h4>

                <div className="overflow-x-auto rounded-lg border border-slate-105">
                  <div className="min-w-full">
                    {ledgerEntries.length === 0 ? (
                      <div className="py-8 text-center text-slate-400 font-medium bg-white">
                        {t('No shift transaction ledger cards matched this debtor history.', 'اس گاہک کی پچھلی کوئی انٹری تاحال درج نہیں ہے۔')}
                      </div>
                    ) : (
                      <ResponsiveTable
                        data={ledgerEntries}
                        columns={[
                          {
                            header: t('Session Date', 'تاریخ'),
                            accessor: 'date',
                            className: 'font-mono text-slate-500',
                            isPrimaryMobile: true
                          },
                          {
                            header: t('Description / Narrative', 'تفصیل'),
                            accessor: 'description',
                            className: 'font-medium text-slate-800 max-w-[200px] truncate',
                            isSecondaryMobile: true
                          },
                          {
                            header: t('Debit (Dr (+))', 'ڈیمانڈ / منہا (+)'),
                            accessor: (ent) => ent.debit > 0 ? formatCurrency(ent.debit, settings) : '—',
                            className: 'text-right font-mono font-bold text-rose-500'
                          },
                          {
                            header: t('Credit (Cr (-))', 'وصول / جمع (-)'),
                            accessor: (ent) => ent.credit > 0 ? formatCurrency(ent.credit, settings) : '—',
                            className: 'text-right font-mono font-bold text-emerald-600'
                          },
                          {
                            header: t('Running Balance', 'بقایا حاصل'),
                            accessor: (ent) => formatCurrency(ent.balance, settings),
                            className: 'text-right font-mono font-bold text-slate-900'
                          },
                          {
                            header: t('Actions', 'اقدامات'),
                            className: 'text-center',
                            accessor: (ent) => ent.shiftId && ent.entryId && ent.type ? (
                              <button
                                onClick={() => {
                                  showConfirm(
                                    t('Confirm Entry Deletion', 'انٹری حذف کرنے کی تصدیق'),
                                    t(`Delete this ledger entry? This will revert the transaction and update the customer's balance.`, `کیا آپ واقعی اس انٹری کو حذف کرنا چاہتے ہیں؟ اس سے کسٹمر کا بیلنس بھی تبدیل ہو جائے گا۔`),
                                    () => {
                                      if (ent.type === 'debit') {
                                        onDeleteDebitEntry(ent.shiftId!, ent.entryId!);
                                      } else {
                                        onDeleteRecoveryEntry(ent.shiftId!, ent.entryId!);
                                      }
                                    }
                                  );
                                }}
                                className="text-red-500 hover:text-red-700 font-bold cursor-pointer text-xs p-1 bg-red-50 hover:bg-red-100 rounded-md"
                                title={t('Delete Entry', 'حذف کریں')}
                              >
                                🗑️
                              </button>
                            ) : (
                              <span className="text-slate-300 font-sans text-[10px]">—</span>
                            )
                          }
                        ]}
                        keyExtractor={(ent, idx) => `${ent.shiftId}-${ent.entryId}-${idx}`}
                      />
                    )}
                  </div>
                </div>

              </div>

            </div>
          ) : (
            <div className="h-full rounded-xl border border-dashed border-slate-250 py-32 text-center text-slate-400 font-sans text-sm flex flex-col justify-center items-center gap-3">
              <Coins className="h-10 w-10 text-slate-300" />
              <span>{t('Select a customer account on the left sidebar to display credit profiles and ledger logs.', 'بائیں پینل سے کسی گاہک کا انتخاب کریں تاکہ اس کا لیجر کھاتہ کھل سکے۔')}</span>
            </div>
          )}
        </div>

      </div>

      {/* CREATE NEW CUSTOMER MODAL */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs"
          >
            <motion.div
              initial={{ scale: 0.95, y: 15, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 15, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 350 }}
              className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-xl"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                <h3 className="font-sans text-base font-bold text-slate-900 flex items-center gap-2">
                  <UserPlus className="h-5 w-5 text-orange-600" />
                  <span>{t('Register New Customer Account', 'نیا کھاتیدار گاہک رجسٹر کریں')}</span>
                </h3>
                <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer text-xl">&times;</button>
              </div>

              <form onSubmit={handleAddNewCustomerSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">{t('Customer / Company Name (English):', 'گاہک یا کمپنی کا نام (انگلش):')}</label>
                  <input
                    type="text"
                    required
                    value={addName}
                    onChange={(e) => setAddName(e.target.value)}
                    placeholder="e.g. Umar Ali"
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 font-sans text-sm focus:border-orange-500 outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">{t('Urdu Name Representation (Bilingual):', 'گاہک یا کمپنی کا نام (اردو):')}</label>
                  <input
                    type="text"
                    value={addUrduName}
                    onChange={(e) => setAddUrduName(e.target.value)}
                    placeholder="مثال: حسیب روڈ ملز"
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 font-sans text-sm focus:border-orange-500 outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">{t('WhatsApp Mobile No (WhatsApp Reminder):', 'واٹس ایپ موبائل نمبر (چالان کیلۓ):')}</label>
                  <input
                    type="text"
                    value={addContact}
                    onChange={(e) => setAddContact(e.target.value)}
                    placeholder="e.g. 03168432329"
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 font-mono text-sm focus:border-orange-500 outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">{t('Operational Depot Address:', 'کمپنی کا کامرس پتہ:')}</label>
                  <input
                    type="text"
                    value={addAddress}
                    onChange={(e) => setAddAddress(e.target.value)}
                    placeholder="e.g. Plot 10-A, Korangi, Karachi"
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 font-sans text-sm focus:border-orange-500 outline-hidden"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-1 lg:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">{t(`Credit Limit (${getCurrencySymbol(settings)}):`, 'قرض کی انتہائ حد:')}</label>
                    <input
                      type="number"
                      value={addLimit}
                      onChange={(e) => setAddLimit(e.target.value)}
                      placeholder="e.g. 200000"
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 font-mono text-sm focus:border-orange-500 outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">{t('Opening Balance Dues:', 'ابتدائی بقایا رقم:')}</label>
                    <input
                      type="number"
                      value={addOpeningBal}
                      onChange={(e) => setAddOpeningBal(e.target.value)}
                      placeholder="0"
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 font-mono text-sm focus:border-orange-500 outline-hidden"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-orange-600 hover:bg-orange-700 text-white font-sans text-sm font-bold tracking-wider rounded-lg shadow-md mt-4 cursor-pointer"
                >
                  {t('CREATE ACCOUNT IN LEDGER', 'کھاتہ کھولیں')}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ==========================================
          EDIT CUSTOMER MODAL
          ========================================== */}
      <AnimatePresence>
        {showEditModal && currentCustomer && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4"
          >
            <motion.div
              initial={{ scale: 0.95, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 20, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-5">
                <h3 className="font-sans text-base font-bold text-slate-900 flex items-center gap-2">
                  <User className="h-5 w-5 text-blue-600" />
                  <span>{t('Edit Customer', 'کھاتہ دار ترمیم')}</span>
                </h3>
                <button onClick={() => setShowEditModal(false)} className="text-slate-400 hover:text-slate-700 text-xl font-bold cursor-pointer">&times;</button>
              </div>

              <form onSubmit={(e) => {
                e.preventDefault();
                if (!editCustName) return;
                onUpdateCustomer({
                  ...currentCustomer,
                  name: editCustName,
                  urduName: editCustUrduName || editCustName,
                  contact: editCustContact,
                  address: editCustAddress,
                  creditLimit: Number(editCustLimit) || 0
                });
                setShowEditModal(false);
                showToast(t('Customer profile updated!', 'کھاتہ دار معلومات اپڈیٹ ہو گئی!'), 'success');
              }} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-1 lg:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">{t('Name (English):', 'نام (انگریزی):')}</label>
                    <input type="text" required value={editCustName} onChange={e => setEditCustName(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 font-sans text-sm focus:border-blue-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">{t('Name (Urdu):', 'نام (اردو):')}</label>
                    <input type="text" value={editCustUrduName} onChange={e => setEditCustUrduName(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 font-sans text-sm focus:border-blue-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">{t('Contact:', 'رابطہ:')}</label>
                    <input type="text" value={editCustContact} onChange={e => setEditCustContact(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 font-sans text-sm focus:border-blue-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">{t('Address:', 'پتہ:')}</label>
                    <input type="text" value={editCustAddress} onChange={e => setEditCustAddress(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 font-sans text-sm focus:border-blue-500 outline-none" />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">{t('Credit Limit (Rs):', 'ادھار حد (روپے):')}</label>
                    <input type="number" min="0" value={editCustLimit} onChange={e => setEditCustLimit(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 font-mono text-sm focus:border-blue-500 outline-none" />
                  </div>
                </div>
                <button type="submit" className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-sans text-sm font-bold tracking-wider rounded-lg shadow-md cursor-pointer">
                  {t('SAVE CHANGES', 'تبدیلیاں محفوظ کریں')}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── FULL-SCREEN PARTY LEDGER MODAL ── */}
      <PartyLedgerModal
        isOpen={isLedgerOpen}
        onClose={() => setIsLedgerOpen(false)}
        party={ledgerParty}
        entries={modalLedgerEntries}
        settings={settings}
        debitLabel="Credit Sale (Dr)"
        creditLabel="Recovery (Cr)"
        accentColor="orange"
      />

      {/* CUSTOMER CREDIT INTELLIGENCE DRILL DOWN (ENTERPRISE) */}
      <CustomerCreditDrillDownModal
        isOpen={isDrillDownOpen}
        onClose={() => setIsDrillDownOpen(false)}
        customers={filteredCustomers}
        shifts={shifts}
        settings={settings}
      />

      <ExportToolbar
        isOpen={showExport}
        onClose={() => setShowExport(false)}
        data={filteredCustomers}
        columns={exportColumns}
        title="Customers Report"
        filenamePrefix="customers_report"
      />
    </div>
  );
}
