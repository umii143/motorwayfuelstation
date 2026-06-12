/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import {
  History,
  Filter,
  Search,
  Eye,
  Calendar,
  X,
  TrendingDown,
  TrendingUp,
  CreditCard,
  Landmark,
  Smartphone,
  Factory,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Download,
  UserCircle
} from 'lucide-react';
import { ExportToolbar } from '../shared/ExportToolbar';
import { DocumentActionToolbar } from '../shared/DocumentActionToolbar';
import { ShiftReceiptDocument } from '../shared/receipts/ShiftReceipt';
import { useWhatsAppShare } from '../../hooks/useWhatsAppShare';
import { WhatsAppShareModal } from '../shared/WhatsAppShareModal';
import {
  Shift,
  Staff,
  Customer,
  Supplier,
  BankAccount,
  DigitalAccount,
  Product,
  Tank,
  GlobalSettings,
  DebitEntry,
  RecoveryEntry,
  ExpenseEntry,
  BankCashEntry,
  DigitalCashEntry,
  SupplierPayment,
  Nozzle,
  FIFODeduction,
} from '../../types';
import { useInventoryStore } from '../../stores/useInventoryStore';
import { t as translate } from '../../lib/translations';
import ShiftDrillDownModal from './ExecutiveDashboard/ShiftDrillDownModal';

interface ShiftLogsProps {
  shifts: Shift[];
  staff: Staff[];
  customers: Customer[];
  suppliers: Supplier[];
  banks: BankAccount[];
  digitalAccounts: DigitalAccount[];
  products: Product[];
  tanks: Tank[];
  nozzles: Nozzle[];
  settings: GlobalSettings;
}

export default function ShiftLogs({
  shifts,
  staff,
  customers,
  suppliers,
  banks,
  digitalAccounts,
  products,
  tanks,
  nozzles,
  settings
}: ShiftLogsProps) {
  const t = (en: string, ur: string) => translate(en, ur, settings);
  const isUrdu = settings.language === 'ur';

  // State
  const [filterDateStr, setFilterDateStr] = useState<string>('');
  const [filterStaffId, setFilterStaffId] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'closed'>('all');
  
  const [selectedShift, setSelectedShift] = useState<Shift | null>(null);
  const [showExport, setShowExport] = useState(false);
  
  const whatsappHook = useWhatsAppShare();
  
  // Drill-down states
  const [viewDetailType, setViewDetailType] = useState<
    'credits' | 'debits' | 'expenses' | 'supplier' | 'bank' | 'digital' | null
  >(null);
  
  const [isShiftDrillDownOpen, setIsShiftDrillDownOpen] = useState(false);

  const filteredShifts = useMemo(() => {
    return shifts
      .filter((s) => {
        if (filterStatus !== 'all' && s.status !== filterStatus) return false;
        if (filterStaffId !== 'all' && s.staffId !== filterStaffId) return false;
        if (filterDateStr && s.date !== filterDateStr) return false;
        return true;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [shifts, filterStatus, filterStaffId, filterDateStr]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(isUrdu ? 'ur-PK' : 'en-PK', {
      style: 'currency',
      currency: settings.currency || 'PKR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const getStaffName = (id: string) => {
    const s = staff.find((st) => st.id === id);
    return s ? (isUrdu ? s.urduName : s.name) : 'Unknown';
  };

  const calculateTotalFuelSoldLiters = (shift: Shift) => {
    if (!shift.openingReadings || !shift.closingReadings) return 0;
    return Object.keys(shift.closingReadings).reduce((sum, nozzleId) => {
      const start = shift.openingReadings[nozzleId] || 0;
      const end = shift.closingReadings[nozzleId] || 0;
      return sum + Math.max(0, end - start);
    }, 0);
  };

  return (
    <div className="max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <History className="w-6 h-6 text-indigo-600" />
            {t('Shift Logs & Audit', 'شفٹ لاگز اور آڈٹ')}
          </h1>
          <p className="text-slate-500 mt-1">
            {t('Complete history and centralized audit system for all shifts.', 'تمام شفٹوں کی مکمل تاریخ اور آڈٹ سسٹم۔')}
          </p>
        </div>
      </div>
      
      {/* ENTERPRISE KPI ROW */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div 
          onClick={() => setIsShiftDrillDownOpen(true)}
          className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs cursor-pointer hover:border-indigo-300 hover:bg-indigo-50/30 transition-colors group"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 group-hover:scale-110 transition-transform">
              <History className="h-5 w-5" />
            </div>
            <div>
              <span className="font-sans text-[10px] font-bold text-slate-400 uppercase tracking-widest block group-hover:text-indigo-600 transition-colors">Total Shifts Processed</span>
              <strong className="font-mono text-xl font-bold text-slate-800 tracking-tight mt-1 block">
                {shifts.length}
              </strong>
            </div>
          </div>
        </div>

        <div 
          onClick={() => setIsShiftDrillDownOpen(true)}
          className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs cursor-pointer hover:border-red-300 hover:bg-red-50/30 transition-colors group"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-600 group-hover:scale-110 transition-transform">
              <TrendingDown className="h-5 w-5" />
            </div>
            <div>
              <span className="font-sans text-[10px] font-bold text-slate-400 uppercase tracking-widest block group-hover:text-red-600 transition-colors">Accumulated Shortage</span>
              <strong className="font-mono text-xl font-bold text-red-600 tracking-tight mt-1 block">
                {formatCurrency(shifts.reduce((sum, s) => sum + (s.shortage > 0 ? s.shortage : 0), 0))}
              </strong>
            </div>
          </div>
        </div>

        <div 
          onClick={() => setIsShiftDrillDownOpen(true)}
          className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs cursor-pointer hover:border-emerald-300 hover:bg-emerald-50/30 transition-colors group"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 group-hover:scale-110 transition-transform">
              <TrendingUp className="h-5 w-5" />
            </div>
            <div>
              <span className="font-sans text-[10px] font-bold text-slate-400 uppercase tracking-widest block group-hover:text-emerald-600 transition-colors">Accumulated Overage</span>
              <strong className="font-mono text-xl font-bold text-emerald-600 tracking-tight mt-1 block">
                {formatCurrency(shifts.reduce((sum, s) => sum + (s.overage > 0 ? s.overage : 0), 0))}
              </strong>
            </div>
          </div>
        </div>
      </div>
      
      {/* Export Toolbar */}
      <ExportToolbar
        isOpen={showExport}
        onClose={() => setShowExport(false)}
        data={filteredShifts}
        columns={[
          { key: 'date', label: 'Date', urduLabel: 'تاریخ' },
          { key: 'salesmanId', label: 'Salesman', urduLabel: 'سیلزمین' },
          { key: 'status', label: 'Status', urduLabel: 'سٹیٹس' },
          { key: 'totalSales', label: 'Total Sales', urduLabel: 'کل فروخت' },
          { key: 'totalCash', label: 'Total Cash', urduLabel: 'کل کیش' },
          { key: 'shortage', label: 'Shortage', urduLabel: 'کمی' }
        ]}
        title="Shift Logs Report"
        filenamePrefix="shift_logs"
      />

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-4 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 text-slate-800 font-semibold">
            <Filter className="w-4 h-4 text-slate-500" />
            {t('Filters', 'فلٹرز')}
          </div>
          <button
            onClick={() => setShowExport(true)}
            className="flex items-center gap-2 px-3 py-1.5 bg-indigo-50 text-indigo-700 text-sm font-bold rounded-lg hover:bg-indigo-100 transition-colors cursor-pointer"
          >
            {t('Export', 'ایکسپورٹ')}
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">
              {t('Date', 'تاریخ')}
            </label>
            <input
              type="date"
              value={filterDateStr}
              onChange={(e) => setFilterDateStr(e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">
              {t('Salesman', 'سیلزمین')}
            </label>
            <select
              value={filterStaffId}
              onChange={(e) => setFilterStaffId(e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            >
              <option value="all">{t('All Staff', 'تمام اسٹاف')}</option>
              {staff.map((s) => (
                <option key={s.id} value={s.id}>
                  {isUrdu ? s.urduName : s.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">
              {t('Status', 'سٹیٹس')}
            </label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            >
              <option value="all">{t('All Shifts', 'تمام شفٹیں')}</option>
              <option value="active">{t('Active', 'جاری ہے')}</option>
              <option value="closed">{t('Closed', 'بند ہو گئی')}</option>
            </select>
          </div>
        </div>
        <div className="mt-4 flex justify-end">
          <button
            onClick={() => {
              setFilterDateStr('');
              setFilterStaffId('all');
              setFilterStatus('all');
            }}
            className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
          >
            {t('Clear Filters', 'فلٹرز صاف کریں')}
          </button>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500 font-semibold">
                <th className="p-4">{t('Date & Time', 'تاریخ اور وقت')}</th>
                <th className="p-4">{t('Salesman', 'سیلزمین')}</th>
                <th className="p-4">{t('Fuel Sold (Liters)', 'فروخت شدہ تیل (لیٹر)')}</th>
                <th className="p-4">{t('Cash Submitted', 'جمع شدہ کیش')}</th>
                <th className="p-4">{t('Shortage/Overage', 'کمی/زیادتی')}</th>
                <th className="p-4 text-center">{t('Status', 'سٹیٹس')}</th>
                <th className="p-4 text-right">{t('Actions', 'ایکشنز')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredShifts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500">
                    {t('No shifts found matching the filters.', 'فلٹرز کے مطابق کوئی شفٹ نہیں ملی۔')}
                  </td>
                </tr>
              ) : (
                filteredShifts.map((shift) => (
                  <tr key={shift.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4">
                      <div className="font-medium text-slate-800">{shift.date}</div>
                      <div className="text-xs text-slate-500">
                        {shift.startTime} {shift.endTime ? `- ${shift.endTime}` : ''}
                      </div>
                    </td>
                    <td className="p-4 font-medium text-slate-800">
                      {getStaffName(shift.staffId)}
                      <div className="text-xs text-slate-500 capitalize">{shift.type} Shift</div>
                    </td>
                    <td className="p-4 text-slate-800 font-medium">
                      {calculateTotalFuelSoldLiters(shift).toFixed(2)} L
                    </td>
                    <td className="p-4 text-slate-800 font-medium">
                      {formatCurrency(shift.submittedCash || 0)}
                    </td>
                    <td className="p-4">
                      {shift.shortage > 0 ? (
                        <span className="inline-flex items-center gap-1 text-red-600 font-medium bg-red-50 px-2.5 py-0.5 rounded-full text-sm">
                          <TrendingDown className="w-3.5 h-3.5" />
                          {formatCurrency(shift.shortage)}
                        </span>
                      ) : shift.overage > 0 ? (
                        <span className="inline-flex items-center gap-1 text-emerald-600 font-medium bg-emerald-50 px-2.5 py-0.5 rounded-full text-sm">
                          <TrendingUp className="w-3.5 h-3.5" />
                          {formatCurrency(shift.overage)}
                        </span>
                      ) : (
                        <span className="text-slate-400 font-medium">-</span>
                      )}
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex flex-col items-center gap-1.5">
                        {shift.status === 'active' ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-700">
                            <Clock className="w-3.5 h-3.5" />
                            {t('Active', 'جاری ہے')}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-700">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            {t('Closed', 'بند ہو گئی')}
                          </span>
                        )}
                        {/* Data Integrity Badges */}
                        {shift.status === 'closed' && (
                          shift.shortage > 0 ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-red-100 text-red-700">
                              <AlertTriangle className="w-3 h-3" />
                              {t('Issue Detected', 'مسئلہ پایا گیا')}
                            </span>
                          ) : shift.overage > 0 ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-700">
                              <AlertTriangle className="w-3 h-3" />
                              {t('Review Required', 'جائزہ درکار ہے')}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-700">
                              <CheckCircle2 className="w-3 h-3" />
                              {t('Verified', 'تصدیق شدہ')}
                            </span>
                          )
                        )}
                      </div>
                    </td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => setSelectedShift(shift)}
                        className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-white border border-slate-200 text-indigo-600 font-semibold rounded-lg hover:bg-indigo-50 hover:border-indigo-200 transition-colors shadow-xs"
                      >
                        <Eye className="w-4 h-4" />
                        {t('View Details', 'تفصیلات دیکھیں')}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Selected Shift Drawer Placeholder */}
      {selectedShift && (
        <ShiftAuditDrawer
          shift={selectedShift}
          onClose={() => {
            setSelectedShift(null);
            setViewDetailType(null);
          }}
          settings={settings}
          staff={staff}
          products={products}
          customers={customers}
          suppliers={suppliers}
          banks={banks}
          digitalAccounts={digitalAccounts}
          nozzles={nozzles}
          viewDetailType={viewDetailType}
          setViewDetailType={setViewDetailType}
          whatsappHook={whatsappHook}
        />
      )}

      <WhatsAppShareModal 
        hook={whatsappHook} 
        customers={customers} 
        suppliers={suppliers} 
        staff={staff} 
      />

      <ShiftDrillDownModal 
        isOpen={isShiftDrillDownOpen}
        onClose={() => setIsShiftDrillDownOpen(false)}
        settings={settings}
      />
    </div>
  );
}

// ----------------------------------------------------------------------
// SUB-COMPONENTS FOR DRAWERS AND DRILL DOWNS
// ----------------------------------------------------------------------

function ShiftAuditDrawer({
  shift,
  onClose,
  settings,
  staff,
  products,
  customers,
  suppliers,
  banks,
  digitalAccounts,
  nozzles,
  viewDetailType,
  setViewDetailType,
  whatsappHook
}: any) {
  const t = (en: string, ur: string) => translate(en, ur, settings);
  const isUrdu = settings.language === 'ur';

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(isUrdu ? 'ur-PK' : 'en-PK', {
      style: 'currency',
      currency: settings.currency || 'PKR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const getStaffName = (id: string) => {
    const s = staff.find((st: Staff) => st.id === id);
    return s ? (isUrdu ? s.urduName : s.name) : 'Unknown';
  };

  // Aggregates
  const totalDebits = shift.debitEntries?.reduce((sum: number, d: DebitEntry) => sum + d.amount, 0) || 0;
  const totalRecoveries = shift.recoveryEntries?.reduce((sum: number, r: RecoveryEntry) => sum + r.amount, 0) || 0;
  const totalExpenses = shift.expenseEntries?.reduce((sum: number, e: ExpenseEntry) => sum + e.amount, 0) || 0;
  const totalBank = shift.bankCashEntries?.reduce((sum: number, b: BankCashEntry) => sum + b.amount, 0) || 0;
  const totalDigital = shift.digitalCashEntries?.reduce((sum: number, d: DigitalCashEntry) => sum + d.amount, 0) || 0;
  const totalSupplierPayments = shift.supplierPayments?.reduce((sum: number, s: SupplierPayment) => sum + s.amount, 0) || 0;

  // Compute total cash
  const totalCashCollected = (shift.submittedCash || 0) + totalBank + totalDigital;

  // Compute fuel sold
  let petrolSold = 0;
  let dieselSold = 0;
  if (shift.closingReadings && shift.openingReadings) {
    Object.keys(shift.closingReadings).forEach((nozzleId) => {
      const start = shift.openingReadings![nozzleId] || 0;
      const end = shift.closingReadings![nozzleId] || 0;
      const liters = Math.max(0, end - start);
      
      const nozzle = nozzles.find((n: Nozzle) => n.id === nozzleId);
      if (nozzle) {
        const product = products.find((p: Product) => p.id === nozzle.productId);
        if (product) {
          const nameLower = product.name.toLowerCase();
          if (nameLower.includes('petrol') || nameLower.includes('super') || product.id === 'prod_f1') {
            petrolSold += liters;
          } else if (nameLower.includes('diesel') || nameLower.includes('hsd') || product.id === 'prod_f3') {
            dieselSold += liters;
          }
        }
      }
    });
  }

  const totalFuelSold = petrolSold + dieselSold;
  // Estimate fuel sales amount based on shift rates
  let estimatedFuelSalesAmount = 0;
  if (shift.rates) {
    Object.keys(shift.rates).forEach(productId => {
      const product = products.find((p: Product) => p.id === productId);
      if (product) {
        const nameLower = product.name.toLowerCase();
        if (nameLower.includes('petrol') || nameLower.includes('super') || productId === 'prod_f1') {
          estimatedFuelSalesAmount += (petrolSold * shift.rates![productId]);
        } else if (nameLower.includes('diesel') || nameLower.includes('hsd') || productId === 'prod_f3') {
          estimatedFuelSalesAmount += (dieselSold * shift.rates![productId]);
        }
      }
    });
  }

  // Calculate Profit from FIFO Deductions for this Shift
  const fifoDeductions = useInventoryStore((state) => state.fifoDeductions) || [];
  const shiftDeductions = fifoDeductions.filter((d: FIFODeduction) => d.shiftId === shift.id);
  
  const totalLitersSoldFIFO = shiftDeductions.reduce((sum: number, d: FIFODeduction) => sum + d.litersDeducted, 0);
  const totalRevenue = shiftDeductions.reduce((sum: number, d: FIFODeduction) => sum + d.realizedRevenue, 0);
  const totalCogsCost = shiftDeductions.reduce((sum: number, d: FIFODeduction) => sum + d.realizedCOGS, 0);
  const totalGrossProfit = shiftDeductions.reduce((sum: number, d: FIFODeduction) => sum + d.realizedMargin, 0);
  
  // Revaluation for this shift
  const stockBatches = useInventoryStore((state) => state.stockBatches) || [];
  const uniqueBatchIds = new Set<string>();
  shiftDeductions.forEach((d: FIFODeduction) => uniqueBatchIds.add(d.batchId));
  const shiftRevaluation = Array.from(uniqueBatchIds).reduce((sum, bId) => {
    const b = stockBatches.find(sb => sb.id === bId);
    return sum + (b?.revaluationGainLoss || 0);
  }, 0);

  const totalNetProfit = totalGrossProfit - totalExpenses + shiftRevaluation;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-6 bg-slate-900/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full sm:w-[95vw] md:w-[85vw] lg:w-[1200px] max-w-full h-[95vh] bg-slate-50 rounded-t-2xl sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
        
        {/* ENTERPRISE HEADER */}
        <div className="flex-none bg-slate-900 border-b border-slate-800 px-6 py-5 flex flex-col sm:flex-row items-start sm:items-center justify-between z-10 shadow-2xl relative overflow-hidden">
          {/* Subtle background glow */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>
          
          <div className="relative z-10 mb-4 sm:mb-0">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-500/20 rounded-xl border border-indigo-500/30 shadow-inner">
                <History className="w-6 h-6 text-indigo-400" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-white flex items-center gap-3 tracking-tight">
                  {t(`Shift Intelligence Audit`, `شفٹ آڈٹ لاگ`)}
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30 tracking-widest uppercase flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> {t('Audit Verified', 'تصدیق شدہ')}
                  </span>
                </h2>
                <div className="flex items-center gap-3 mt-1.5 text-sm font-medium">
                  <span className="flex items-center gap-1.5 text-indigo-300">
                    <UserCircle className="w-4 h-4" />
                    {getStaffName(shift.staffId)}
                  </span>
                  <span className="w-1 h-1 rounded-full bg-slate-700" />
                  <span className="text-slate-300 font-bold">{shift.date}</span>
                  <span className="w-1 h-1 rounded-full bg-slate-700" />
                  <span className="text-slate-400">{shift.type === 'day' ? t('Day Shift', 'دن کی شفٹ') : t('Night Shift', 'رات کی شفٹ')}</span>
                  <span className="w-1 h-1 rounded-full bg-slate-700" />
                  <span className="text-slate-400">{shift.startTime} to {shift.endTime || 'Present'}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 relative z-10 w-full sm:w-auto justify-end">
            <div className="bg-slate-800/80 p-1 rounded-lg border border-slate-700 backdrop-blur-sm flex items-center shadow-inner">
              <DocumentActionToolbar 
                pdfDocument={<ShiftReceiptDocument shift={shift} generatedBy="Admin" />}
                pdfFileName={`Shift_Report_${shift.id}.pdf`}
                onPrint={() => window.print()}
                onWhatsAppShare={() => {
                  whatsappHook.openShareModal(
                    'custom',
                    {},
                    undefined,
                    `Shift_Report_${shift.id}.pdf`,
                    <ShiftReceiptDocument shift={shift} generatedBy="Admin" />
                  );
                }}
              />
            </div>
            <button
              onClick={onClose}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-xl border border-slate-700 transition-all cursor-pointer shadow-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Drawer Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8 bg-slate-50/50">
          
          {/* Main Financial Summary Grid */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></div>
                {t('Financial Summary', 'مالیاتی خلاصہ')}
              </h3>
              <span className="text-xs font-bold text-slate-600 bg-white border border-slate-200 px-3 py-1.5 rounded-full shadow-sm flex gap-2">
                <span className="text-slate-400">Net Profit:</span> <span className="text-emerald-600">{formatCurrency(totalNetProfit)}</span>
                <span className="text-slate-300">|</span>
                <span className="text-slate-400">Total Collection:</span> <span className="text-indigo-600">{formatCurrency(totalCashCollected)}</span>
              </span>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
              <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm flex flex-col justify-between">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{t('Expected Cash', 'متوقع کیش')}</span>
                <span className="text-2xl font-black text-slate-800 truncate">{formatCurrency(shift.expectedCash || 0)}</span>
              </div>
              <div className="bg-indigo-50/80 rounded-xl border border-indigo-100 p-5 shadow-sm flex flex-col justify-between">
                <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">{t('Submitted Cash', 'جمع شدہ کیش')}</span>
                <span className="text-2xl font-black text-indigo-700 truncate">{formatCurrency(shift.submittedCash || 0)}</span>
              </div>
              <div className="bg-red-50/80 rounded-xl border border-red-100 p-5 shadow-sm flex flex-col justify-between">
                <span className="text-[10px] font-black text-red-400 uppercase tracking-widest mb-1">{t('Shortage', 'کمی')}</span>
                <span className="text-2xl font-black text-red-700 truncate">{formatCurrency(shift.shortage || 0)}</span>
              </div>
              <div className="bg-emerald-50/80 rounded-xl border border-emerald-100 p-5 shadow-sm flex flex-col justify-between">
                <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-1">{t('Overage', 'زیادتی')}</span>
                <span className="text-2xl font-black text-emerald-700 truncate">{formatCurrency(shift.overage || 0)}</span>
              </div>
            </div>
          </div>

          {/* Fuel Sales Summary Grid */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse"></div>
                {t('Fuel Sales Summary', 'فیول سیلز کا خلاصہ')}
              </h3>
              <span className="text-xs font-bold text-slate-600 bg-white border border-slate-200 px-3 py-1.5 rounded-full shadow-sm flex gap-2">
                <span className="text-slate-400">Avg Margin:</span> <span className="text-orange-600">{totalLitersSoldFIFO > 0 ? formatCurrency(totalGrossProfit / totalLitersSoldFIFO) : '0'} /L</span>
                <span className="text-slate-300">|</span>
                <span className="text-slate-400">Est. Sales:</span> <span className="text-blue-600">{formatCurrency(estimatedFuelSalesAmount)}</span>
              </span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gradient-to-br from-orange-50 to-orange-100/30 rounded-xl border border-orange-200 p-5 shadow-sm flex flex-col justify-between relative overflow-hidden">
                <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-orange-200/50 to-transparent"></div>
                <span className="text-[10px] font-black text-orange-600 uppercase tracking-widest mb-2 relative z-10">{t('Petrol Sold', 'پٹرول فروخت')}</span>
                <span className="text-3xl font-black text-orange-700 truncate relative z-10">{petrolSold.toFixed(2)} L</span>
              </div>
              <div className="bg-gradient-to-br from-blue-50 to-blue-100/30 rounded-xl border border-blue-200 p-5 shadow-sm flex flex-col justify-between relative overflow-hidden">
                <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-blue-200/50 to-transparent"></div>
                <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-2 relative z-10">{t('Diesel Sold', 'ڈیزل فروخت')}</span>
                <span className="text-3xl font-black text-blue-700 truncate relative z-10">{dieselSold.toFixed(2)} L</span>
              </div>
              <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm flex flex-col justify-between relative overflow-hidden">
                <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-slate-100 to-transparent"></div>
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 relative z-10">{t('Total Fuel Sold', 'کل فیول فروخت')}</span>
                <span className="text-3xl font-black text-slate-800 truncate relative z-10">{totalFuelSold.toFixed(2)} L</span>
              </div>
            </div>
          </div>

          {/* Drill Down Sections */}
          <div>
            <div className="flex items-center mb-4">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse"></div>
                {t('Transaction Intelligence Drill-Downs', 'ٹرانزیکشن کی تفصیلات')}
              </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              
              <DrillDownCard
                icon={TrendingUp}
                title={t('Credit Sales (Udhar)', 'ادھار فروخت')}
                count={shift.debitEntries?.length || 0}
                amount={totalDebits}
                formatCurrency={formatCurrency}
                onClick={() => setViewDetailType('debits')}
                colorClass="text-rose-600 bg-rose-50 border-rose-200 hover:border-rose-300"
              />
              
              <DrillDownCard
                icon={TrendingDown}
                title={t('Recoveries (Collection)', 'ادھار وصولی')}
                count={shift.recoveryEntries?.length || 0}
                amount={totalRecoveries}
                formatCurrency={formatCurrency}
                onClick={() => setViewDetailType('credits')}
                colorClass="text-emerald-600 bg-emerald-50 border-emerald-200 hover:border-emerald-300"
              />

              <DrillDownCard
                icon={CreditCard}
                title={t('Expenses', 'اخراجات')}
                count={shift.expenseEntries?.length || 0}
                amount={totalExpenses}
                formatCurrency={formatCurrency}
                onClick={() => setViewDetailType('expenses')}
                colorClass="text-amber-600 bg-amber-50 border-amber-200 hover:border-amber-300"
              />

              <DrillDownCard
                icon={Factory}
                title={t('Supplier Payments', 'سپلائر کی ادائیگیاں')}
                count={shift.supplierPayments?.length || 0}
                amount={totalSupplierPayments}
                formatCurrency={formatCurrency}
                onClick={() => setViewDetailType('supplier')}
                colorClass="text-blue-600 bg-blue-50 border-blue-200 hover:border-blue-300"
              />

              <DrillDownCard
                icon={Landmark}
                title={t('Bank Deposits', 'بینک ڈپازٹ')}
                count={shift.bankCashEntries?.length || 0}
                amount={totalBank}
                formatCurrency={formatCurrency}
                onClick={() => setViewDetailType('bank')}
                colorClass="text-cyan-600 bg-cyan-50 border-cyan-200 hover:border-cyan-300"
              />

              <DrillDownCard
                icon={Smartphone}
                title={t('Digital Payments', 'ڈیجیٹل ادائیگیاں')}
                count={shift.digitalCashEntries?.length || 0}
                amount={totalDigital}
                formatCurrency={formatCurrency}
                onClick={() => setViewDetailType('digital')}
                colorClass="text-violet-600 bg-violet-50 border-violet-200 hover:border-violet-300"
              />

              <DrillDownCard
                icon={TrendingUp}
                title={t('Profit Breakdown (FIFO)', 'منافع کی تفصیلات')}
                count={shiftDeductions.length || 0}
                amount={totalNetProfit}
                formatCurrency={formatCurrency}
                onClick={() => setViewDetailType('cogs')}
                colorClass="text-indigo-600 bg-indigo-50 border-indigo-200 hover:border-indigo-300"
              />

            </div>
          </div>

        </div>

        {/* Drill Down Modals */}
        {viewDetailType === 'debits' && (
          <TransactionModal
            title={t('Credit Sales (Udhar)', 'ادھار فروخت')}
            onClose={() => setViewDetailType(null)}
            items={shift.debitEntries || []}
            columns={[
              { key: 'customer', label: t('Customer', 'گاہک'), render: (item: any) => customers.find((c: Customer) => c.id === item.customerId)?.name || 'Unknown' },
              { key: 'product', label: t('Product', 'پروڈکٹ'), render: (item: any) => products.find((p: Product) => p.id === item.productId)?.name || 'Unknown' },
              { key: 'quantity', label: t('Qty/Liters', 'مقدار'), render: (item: any) => item.quantity },
              { key: 'rate', label: t('Rate', 'ریٹ'), render: (item: any) => formatCurrency(item.rate) },
              { key: 'amount', label: t('Amount', 'رقم'), render: (item: any) => formatCurrency(item.amount) },
              { key: 'note', label: t('Note', 'نوٹ'), render: (item: any) => item.note || '-' }
            ]}
          />
        )}

        {viewDetailType === 'credits' && (
          <TransactionModal
            title={t('Recoveries (Collection)', 'ادھار وصولی')}
            onClose={() => setViewDetailType(null)}
            items={shift.recoveryEntries || []}
            columns={[
              { key: 'customer', label: t('Customer', 'گاہک'), render: (item: any) => customers.find((c: Customer) => c.id === item.customerId)?.name || 'Unknown' },
              { key: 'mode', label: t('Mode', 'طریقہ'), render: (item: any) => item.mode },
              { key: 'amount', label: t('Amount', 'رقم'), render: (item: any) => formatCurrency(item.amount) },
              { key: 'reference', label: t('Reference', 'حوالہ'), render: (item: any) => item.reference || '-' }
            ]}
          />
        )}

        {viewDetailType === 'expenses' && (
          <TransactionModal
            title={t('Expenses', 'اخراجات')}
            onClose={() => setViewDetailType(null)}
            items={shift.expenseEntries || []}
            columns={[
              { key: 'category', label: t('Category', 'زمرہ'), render: (item: any) => item.category },
              { key: 'paidFrom', label: t('Paid From', 'کہاں سے ادا کیا'), render: (item: any) => item.paidFrom },
              { key: 'amount', label: t('Amount', 'رقم'), render: (item: any) => formatCurrency(item.amount) },
              { key: 'description', label: t('Description', 'تفصیل'), render: (item: any) => item.description || '-' }
            ]}
          />
        )}

        {viewDetailType === 'supplier' && (
          <TransactionModal
            title={t('Supplier Payments', 'سپلائر کی ادائیگیاں')}
            onClose={() => setViewDetailType(null)}
            items={shift.supplierPayments || []}
            columns={[
              { key: 'supplier', label: t('Supplier', 'سپلائر'), render: (item: any) => suppliers.find((s: Supplier) => s.id === item.supplierId)?.name || 'Unknown' },
              { key: 'mode', label: t('Mode', 'طریقہ'), render: (item: any) => item.mode },
              { key: 'amount', label: t('Amount', 'رقم'), render: (item: any) => formatCurrency(item.amount) },
              { key: 'reference', label: t('Reference', 'حوالہ'), render: (item: any) => item.reference || '-' }
            ]}
          />
        )}

        {viewDetailType === 'bank' && (
          <TransactionModal
            title={t('Bank Deposits', 'بینک ڈپازٹ')}
            onClose={() => setViewDetailType(null)}
            items={shift.bankCashEntries || []}
            columns={[
              { key: 'bank', label: t('Bank', 'بینک'), render: (item: any) => banks.find((b: BankAccount) => b.id === item.bankAccountId)?.name || 'Unknown' },
              { key: 'amount', label: t('Amount', 'رقم'), render: (item: any) => formatCurrency(item.amount) },
              { key: 'reference', label: t('Reference', 'حوالہ'), render: (item: any) => item.reference || '-' }
            ]}
          />
        )}

        {viewDetailType === 'digital' && (
          <TransactionModal
            title={t('Digital Payments', 'ڈیجیٹل ادائیگیاں')}
            onClose={() => setViewDetailType(null)}
            items={shift.digitalCashEntries || []}
            columns={[
              { key: 'digital', label: t('Account', 'اکاؤنٹ'), render: (item: any) => digitalAccounts.find((d: DigitalAccount) => d.id === item.method)?.name || item.method },
              { key: 'amount', label: t('Amount', 'رقم'), render: (item: any) => formatCurrency(item.amount) },
              { key: 'transactionId', label: t('Txn ID', 'ٹرانزیکشن آئی ڈی'), render: (item: any) => item.transactionId || '-' }
            ]}
          />
        )}

        {viewDetailType === 'cogs' && (
          <TransactionModal
            title={t('Profit Breakdown (FIFO)', 'منافع کی تفصیلات')}
            onClose={() => setViewDetailType(null)}
            items={shiftDeductions || []}
            columns={[
              { 
                key: 'product', 
                label: t('Product', 'پروڈکٹ'), 
                render: (item: FIFODeduction) => {
                  const nozzle = nozzles.find((n: Nozzle) => n.id === item.nozzleId);
                  const product = products.find((p: Product) => p.id === nozzle?.productId);
                  return product?.name || 'Unknown';
                }
              },
              { key: 'qty', label: t('Qty', 'مقدار (لیٹر)'), render: (item: FIFODeduction) => `${item.litersDeducted.toFixed(2)} L` },
              { key: 'cost', label: t('Landed Cost', 'خریداری لاگت'), render: (item: FIFODeduction) => formatCurrency(item.batchLandedCost) },
              { key: 'pumpPrice', label: t('Pump Price', 'پمپ قیمت'), render: (item: FIFODeduction) => formatCurrency(item.sellingPrice) },
              { key: 'margin', label: t('Margin', 'مارجن'), render: (item: FIFODeduction) => formatCurrency(item.realizedMarginPerLiter) },
              { key: 'netProfit', label: t('Realized Profit', 'خالص منافع'), render: (item: FIFODeduction) => <span className="text-emerald-600 font-bold">{formatCurrency(item.realizedMargin)}</span> }
            ]}
          />
        )}

      </div>
    </div>
  );
}

// ----------------------------------------------------------------------
// HELPER COMPONENTS
// ----------------------------------------------------------------------

function SummaryCard({ title, amount, formatCurrency, className = '', valueClassName = '' }: any) {
  return (
    <div className={`p-4 rounded-xl border ${className} shadow-xs`}>
      <div className="text-xs font-bold uppercase tracking-wider opacity-70 mb-1">{title}</div>
      <div className={`text-xl sm:text-2xl font-bold ${valueClassName}`}>
        {formatCurrency(amount)}
      </div>
    </div>
  );
}

function DrillDownCard({ icon: Icon, title, count, amount, formatCurrency, onClick, colorClass }: any) {
  // Map our old colorClass strings to modern gradient logic based on key words
  const isRose = colorClass.includes('rose');
  const isEmerald = colorClass.includes('emerald');
  const isAmber = colorClass.includes('amber');
  const isBlue = colorClass.includes('blue');
  const isCyan = colorClass.includes('cyan');
  const isViolet = colorClass.includes('violet');
  const isIndigo = colorClass.includes('indigo');

  let gradient = 'from-slate-50 to-white border-slate-200 text-slate-600';
  let iconBg = 'bg-slate-100 text-slate-500';
  let valueColor = 'text-slate-800';

  if (isRose) {
    gradient = 'from-rose-50 to-white border-rose-200 text-rose-600';
    iconBg = 'bg-rose-100 text-rose-500';
    valueColor = 'text-rose-700';
  } else if (isEmerald) {
    gradient = 'from-emerald-50 to-white border-emerald-200 text-emerald-600';
    iconBg = 'bg-emerald-100 text-emerald-500';
    valueColor = 'text-emerald-700';
  } else if (isAmber) {
    gradient = 'from-amber-50 to-white border-amber-200 text-amber-600';
    iconBg = 'bg-amber-100 text-amber-500';
    valueColor = 'text-amber-700';
  } else if (isBlue) {
    gradient = 'from-blue-50 to-white border-blue-200 text-blue-600';
    iconBg = 'bg-blue-100 text-blue-500';
    valueColor = 'text-blue-700';
  } else if (isCyan) {
    gradient = 'from-cyan-50 to-white border-cyan-200 text-cyan-600';
    iconBg = 'bg-cyan-100 text-cyan-500';
    valueColor = 'text-cyan-700';
  } else if (isViolet) {
    gradient = 'from-violet-50 to-white border-violet-200 text-violet-600';
    iconBg = 'bg-violet-100 text-violet-500';
    valueColor = 'text-violet-700';
  } else if (isIndigo) {
    gradient = 'from-indigo-50 to-white border-indigo-200 text-indigo-600';
    iconBg = 'bg-indigo-100 text-indigo-500';
    valueColor = 'text-indigo-700';
  }

  return (
    <div 
      onClick={onClick}
      className={`p-5 rounded-2xl border shadow-xs cursor-pointer transition-all duration-300 hover:shadow-md hover:-translate-y-1 bg-gradient-to-br ${gradient} group relative overflow-hidden`}
    >
      <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-white/40 to-transparent"></div>
      
      <div className="flex items-center justify-between mb-4 relative z-10">
        <div className={`p-2.5 rounded-xl shadow-inner ${iconBg}`}>
          <Icon className="w-5 h-5" />
        </div>
        <div className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 bg-white/80 rounded-full shadow-xs border border-white">
          {count} Entries
        </div>
      </div>
      <div className="text-xs font-black uppercase tracking-widest opacity-80 mb-1 relative z-10">{title}</div>
      <div className={`text-2xl font-black relative z-10 ${valueColor}`}>
        {formatCurrency(amount)}
      </div>
      <div className="mt-4 pt-3 border-t border-black/5 text-[10px] font-bold uppercase tracking-widest flex items-center justify-between opacity-60 group-hover:opacity-100 transition-opacity relative z-10">
        <span>Click to deep-dive log</span>
        <Search className="w-3.5 h-3.5" />
      </div>
    </div>
  );
}

function TransactionModal({ title, onClose, items, columns }: any) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-4xl bg-white rounded-2xl shadow-2xl flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-5 border-b border-slate-200">
          <h3 className="text-lg font-bold text-slate-800">{title}</h3>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="overflow-auto p-0">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 sticky top-0 z-10">
              <tr>
                {columns.map((col: any, idx: number) => (
                  <th key={idx} className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className="p-8 text-center text-slate-500">
                    No records found.
                  </td>
                </tr>
              ) : (
                items.map((item: any, idx: number) => (
                  <tr key={item.id || idx} className="hover:bg-slate-50">
                    {columns.map((col: any, colIdx: number) => (
                      <td key={colIdx} className="p-4 text-sm text-slate-800 font-medium">
                        {col.render(item)}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
