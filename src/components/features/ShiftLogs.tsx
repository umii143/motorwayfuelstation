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
  SupplierPayment,
  Nozzle,
  CogsRecord
} from '../../types';
import { useInventoryStore } from '../../stores/useInventoryStore';
import { t as translate } from '../../lib/translations';

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
  
  // Drill-down states
  const [viewDetailType, setViewDetailType] = useState<
    'credits' | 'debits' | 'expenses' | 'supplier' | 'bank' | 'digital' | null
  >(null);

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

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-4 mb-6">
        <div className="flex items-center gap-2 mb-4 text-slate-800 font-semibold">
          <Filter className="w-4 h-4 text-slate-500" />
          {t('Filters', 'فلٹرز')}
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
        />
      )}
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
  setViewDetailType
}: any) {
  const t = (en: string, ur: string) => translate(en, ur, settings);
  const isUrdu = settings.language === 'ur';
  const cogsRecords = useInventoryStore((state) => state.cogsRecords) || [];

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

  // Calculate Profit from COGS Records for this Shift
  const shiftCogs = cogsRecords.filter((c: CogsRecord) => c.shiftId === shift.id);
  const totalLitersSoldCogs = shiftCogs.reduce((sum: number, c: CogsRecord) => sum + c.litersDeducted, 0);
  const totalRevenue = shiftCogs.reduce((sum: number, c: CogsRecord) => sum + c.revenue, 0);
  const totalCogsCost = shiftCogs.reduce((sum: number, c: CogsRecord) => sum + c.cogs, 0);
  const totalNetProfit = shiftCogs.reduce((sum: number, c: CogsRecord) => sum + c.netProfit, 0);
  const totalGrossProfit = shiftCogs.reduce((sum: number, c: CogsRecord) => sum + c.grossProfit, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-6 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full sm:w-[95vw] md:w-[85vw] lg:w-[1200px] max-w-full h-[95vh] bg-slate-50 rounded-t-2xl sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
        
        {/* Drawer Header */}
        <div className="flex-none bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between z-10 shadow-xs">
          <div>
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <History className="w-5 h-5 text-indigo-600" />
              {t(`Shift Audit Log: ${shift.date}`, `شفٹ آڈٹ لاگ: ${shift.date}`)}
            </h2>
            <div className="flex items-center gap-3 mt-1.5 text-sm text-slate-500 font-medium">
              <span className="flex items-center gap-1.5">
                <UserCircle className="w-4 h-4" />
                {getStaffName(shift.staffId)}
              </span>
              <span className="w-1 h-1 rounded-full bg-slate-300" />
              <span>{shift.type === 'day' ? t('Day Shift', 'دن کی شفٹ') : t('Night Shift', 'رات کی شفٹ')}</span>
              <span className="w-1 h-1 rounded-full bg-slate-300" />
              <span>{shift.startTime} to {shift.endTime || 'Present'}</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 text-slate-500 hover:text-slate-700 rounded-full transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Drawer Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8 bg-slate-50/50">
          
          {/* Main Financial Summary Grid */}
          <div>
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 px-1 flex items-center justify-between">
              {t('Financial Summary', 'مالیاتی خلاصہ')}
              <span className="text-xs font-medium text-slate-500 bg-slate-200 px-2.5 py-1 rounded-full flex gap-2">
                <span>Net Profit: {formatCurrency(totalNetProfit)}</span>
                <span>•</span>
                <span>Total Collection: {formatCurrency(totalCashCollected)}</span>
              </span>
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
              <SummaryCard
                title={t('Expected Cash', 'متوقع کیش')}
                amount={shift.expectedCash || 0}
                formatCurrency={formatCurrency}
                className="bg-white border-slate-200"
              />
              <SummaryCard
                title={t('Submitted Cash', 'جمع شدہ کیش')}
                amount={shift.submittedCash || 0}
                formatCurrency={formatCurrency}
                className="bg-indigo-50 border-indigo-100 text-indigo-900"
                valueClassName="text-indigo-700"
              />
              <SummaryCard
                title={t('Shortage', 'کمی')}
                amount={shift.shortage || 0}
                formatCurrency={formatCurrency}
                className="bg-red-50 border-red-100 text-red-900"
                valueClassName="text-red-700"
              />
              <SummaryCard
                title={t('Overage', 'زیادتی')}
                amount={shift.overage || 0}
                formatCurrency={formatCurrency}
                className="bg-emerald-50 border-emerald-100 text-emerald-900"
                valueClassName="text-emerald-700"
              />
            </div>
          </div>

          {/* Fuel Sales Summary Grid */}
          <div>
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 px-1 flex items-center justify-between">
              {t('Fuel Sales Summary', 'فیول سیلز کا خلاصہ')}
              <span className="text-xs font-medium text-slate-500 bg-slate-200 px-2.5 py-1 rounded-full flex gap-2">
                <span>Avg Dealer Margin: {totalLitersSoldCogs > 0 ? formatCurrency(totalGrossProfit / totalLitersSoldCogs) : '0'} /L</span>
                <span>•</span>
                <span>Est. Sales: {formatCurrency(estimatedFuelSalesAmount)}</span>
              </span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <SummaryCard
                title={t('Petrol Sold', 'پٹرول فروخت')}
                amount={petrolSold}
                formatCurrency={(val: number) => `${val.toFixed(2)} L`}
                className="bg-orange-50 border-orange-100 text-orange-900"
                valueClassName="text-orange-700"
              />
              <SummaryCard
                title={t('Diesel Sold', 'ڈیزل فروخت')}
                amount={dieselSold}
                formatCurrency={(val: number) => `${val.toFixed(2)} L`}
                className="bg-blue-50 border-blue-100 text-blue-900"
                valueClassName="text-blue-700"
              />
              <SummaryCard
                title={t('Total Fuel Sold', 'کل فیول فروخت')}
                amount={totalFuelSold}
                formatCurrency={(val: number) => `${val.toFixed(2)} L`}
                className="bg-slate-100 border-slate-200 text-slate-900"
                valueClassName="text-slate-800"
              />
            </div>
          </div>

          {/* Drill Down Sections */}
          <div>
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 px-1">
              {t('Transaction Drill-Downs', 'ٹرانزیکشن کی تفصیلات')}
            </h3>
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
                title={t('Profit Breakdown (COGS)', 'منافع کی تفصیلات')}
                count={shiftCogs.length || 0}
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
            title={t('Profit Breakdown (COGS)', 'منافع کی تفصیلات')}
            onClose={() => setViewDetailType(null)}
            items={shiftCogs || []}
            columns={[
              { key: 'product', label: t('Product', 'پروڈکٹ'), render: (item: CogsRecord) => item.productType },
              { key: 'qty', label: t('Qty Deducted', 'مقدار (لیٹر)'), render: (item: CogsRecord) => `${item.litersDeducted.toFixed(2)} L` },
              { key: 'margin', label: t('D. Margin', 'ڈیلر مارجن'), render: (item: CogsRecord) => formatCurrency(item.dealerMargin) },
              { key: 'cost', label: t('Landed Cost', 'خریداری لاگت'), render: (item: CogsRecord) => formatCurrency(item.landedCostPerLiter) },
              { key: 'pumpPrice', label: t('Pump Price', 'پمپ قیمت'), render: (item: CogsRecord) => formatCurrency(item.ograPumpPrice) },
              { key: 'netProfit', label: t('Net Profit', 'خالص منافع'), render: (item: CogsRecord) => <span className="text-emerald-600 font-bold">{formatCurrency(item.netProfit)}</span> }
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
  return (
    <div 
      onClick={onClick}
      className={`p-5 rounded-xl border shadow-xs cursor-pointer transition-all duration-200 hover:-translate-y-1 ${colorClass}`}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="p-2.5 bg-white/60 backdrop-blur-sm rounded-lg shadow-xs">
          <Icon className="w-5 h-5" />
        </div>
        <div className="text-xs font-bold uppercase tracking-wider px-2 py-1 bg-white/60 rounded-full">
          {count} Entries
        </div>
      </div>
      <div className="text-sm font-bold opacity-80 mb-1">{title}</div>
      <div className="text-2xl font-bold">
        {formatCurrency(amount)}
      </div>
      <div className="mt-4 pt-3 border-t border-current/10 text-xs font-semibold flex items-center justify-between opacity-80 group-hover:opacity-100">
        Click to view detailed log
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
