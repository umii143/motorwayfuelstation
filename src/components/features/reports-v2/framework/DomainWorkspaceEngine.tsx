/**
 * @license SPDX-License-Identifier: Apache-2.0
 *
 * FuelPro Enterprise Business Operating System v4.0
 * DomainWorkspaceEngine — Single Metadata-Driven Domain Engine
 *
 * Implements Enterprise Rules #130, #131, #132, #133, #134, #135 & #136
 *
 * Provides a unified, process-oriented domain workspace engine (v4.1).
 * any business process page for any domain (Customers, Expenses, Fuel, Inventory,
 * Purchases, Finance, Suppliers, Staff, Pricing, Analytics, Fleet, LPG, Mart, etc.).
 */

import React, { useState, useMemo } from 'react';
import { ReportConfig } from '../../../../lib/reports-v2/engines/types';
import { ReportViewer } from '../ReportViewer';
import { FuelOperationsWorkspaceView } from '../components/workspaces/FuelOperationsWorkspaceView';
import { PurchasesWorkspaceView } from '../components/workspaces/PurchasesWorkspaceView';
import { CustomersWorkspaceView } from '../components/workspaces/CustomersWorkspaceView';
import { InventoryWorkspaceView } from '../components/workspaces/InventoryWorkspaceView';
import { ExpensesWorkspaceView } from '../components/workspaces/ExpensesWorkspaceView';
import { FinanceWorkspaceView } from '../components/workspaces/FinanceWorkspaceView';
import { SuppliersWorkspaceView } from '../components/workspaces/SuppliersWorkspaceView';
import { LedgersWorkspaceView } from '../components/workspaces/LedgersWorkspaceView';
import { StaffWorkspaceView } from '../components/workspaces/StaffWorkspaceView';
import { PricingWorkspaceView } from '../components/workspaces/PricingWorkspaceView';
import { AnalyticsWorkspaceView } from '../components/workspaces/AnalyticsWorkspaceView';

export type BusinessDomainType =
  | 'fuel_operations'
  | 'inventory'
  | 'sales'
  | 'purchases'
  | 'finance'
  | 'expenses'
  | 'ledgers'
  | 'customers'
  | 'suppliers'
  | 'staff'
  | 'pricing'
  | 'analytics'
  | 'fleet'
  | 'lpg'
  | 'lubricants'
  | 'tyre'
  | 'mart'
  | 'payroll'
  | 'compliance'
  | 'custom';

interface DomainWorkspaceEngineProps {
  domain: BusinessDomainType;
  reportId: string;
  config: ReportConfig | null;
  stationId: string;
  orgId: string;
  userId: string;
  role: string;
  lang: 'en' | 'ur';
  onSelectReport?: (reportId: string) => void;
  onDrilldown?: (nextReportId: string, filterContext?: Record<string, any>) => void;
}

interface DomainMeta {
  title: string;
  titleUr: string;
  icon: string;
  color: string;
  localTabs: Array<{ id: string; label: string; labelUr: string; reportId: string }>;
  quickCreates: Array<{ id: string; label: string; labelUr: string; icon: string; targetId: string }>;
}

const DOMAIN_METADATA: Record<BusinessDomainType, DomainMeta> = {
  customers: {
    title: 'Customer Directory & Credit Workspace',
    titleUr: 'گاہک ڈائریکٹری و کریڈٹ ورک اسپیس',
    icon: '👥',
    color: 'emerald',
    localTabs: [
      { id: 'overview', label: 'Overview', labelUr: 'جائزہ', reportId: 'DOMAIN_CUS_HOME' },
      { id: 'register', label: 'Customer Register', labelUr: 'کسٹمر رجسٹر', reportId: 'CUS_REGISTER' },
      { id: 'ledger', label: 'Customer Ledger', labelUr: 'کسٹمر کھاتہ', reportId: 'L1' },
      { id: 'outstanding', label: 'Outstanding', labelUr: 'بقایا جات', reportId: 'CUS_OUTSTANDING' },
      { id: 'recovery', label: 'Recovery Today', labelUr: 'آج کی وصولی', reportId: 'CUS_RECOVERY' },
      { id: 'aging', label: 'Aging Analysis', labelUr: 'ایپنگ تجزیہ', reportId: 'CUS_AGING' },
    ],
    quickCreates: [
      { id: 'new_customer', label: '+ New Customer', labelUr: '+ نیا کسٹمر', icon: '👤', targetId: 'CUS_REGISTER' },
      { id: 'customer_payment', label: '+ Record Payment', labelUr: '+ وصولی اندراج', icon: '💵', targetId: 'CUS_RECOVERY' },
    ],
  },
  fuel_operations: {
    title: 'Fuel Operations Workspace',
    titleUr: 'فیول آپریشنز ورک اسپیس',
    icon: '⛽',
    color: 'blue',
    localTabs: [
      { id: 'overview', label: 'Overview', labelUr: 'جائزہ', reportId: 'DOMAIN_FUEL_HOME' },
      { id: 'sales_reg', label: 'Sales Register', labelUr: 'سیلز رجسٹر', reportId: 'FS_REGISTER' },
      { id: 'shifts', label: 'Shift Sales', labelUr: 'شفٹ سیلز', reportId: 'C2' },
      { id: 'nozzles', label: 'Nozzle Sales', labelUr: 'نوزل سیلز', reportId: 'FS_NOZZLE' },
      { id: 'tanks', label: 'Tank Sales', labelUr: 'ٹینک سیلز', reportId: 'FS_TANK' },
      { id: 'products', label: 'Product Sales', labelUr: 'پروڈکٹ سیلز', reportId: 'FS_PRODUCT' },
    ],
    quickCreates: [
      { id: 'new_shift', label: '+ Open Shift', labelUr: '+ نئی شفٹ', icon: '⏱️', targetId: 'C2' },
      { id: 'new_sale', label: '+ Record Sale', labelUr: '+ سیلز اندراج', icon: '⛽', targetId: 'FS_REGISTER' },
    ],
  },
  sales: {
    title: 'Retail POS & Sales Workspace',
    titleUr: 'سیلز رجسٹر و نوزل ورک اسپیس',
    icon: '💳',
    color: 'emerald',
    localTabs: [
      { id: 'overview', label: 'Overview', labelUr: 'جائزہ', reportId: 'FS_REGISTER' },
      { id: 'master_sales', label: 'Sales Register', labelUr: 'سیلز رجسٹر', reportId: 'FS_REGISTER' },
      { id: 'hourly_sales', label: 'Hourly Demand', labelUr: 'گھنٹہ وار سیلز', reportId: 'C2' },
      { id: 'nozzle_sales', label: 'Nozzle Analytics', labelUr: 'نوزل اینالیٹکس', reportId: 'FS_NOZZLE' },
      { id: 'credit_sales', label: 'Credit Sales', labelUr: 'کریڈٹ سیلز', reportId: 'CUS_OUTSTANDING' },
    ],
    quickCreates: [
      { id: 'new_sale', label: '+ Record Sale', labelUr: '+ نئی سیل', icon: '💳', targetId: 'FS_REGISTER' },
    ],
  },
  inventory: {
    title: 'Inventory & Tank Dip Workspace',
    titleUr: 'انوینٹری و ٹینک ورک اسپیس',
    icon: '🛢️',
    color: 'amber',
    localTabs: [
      { id: 'overview', label: 'Overview', labelUr: 'جائزہ', reportId: 'DOMAIN_INV_HOME' },
      { id: 'tank_reg', label: 'Tank Register', labelUr: 'ٹینک رجسٹر', reportId: 'INV_TANK_REG' },
      { id: 'dips', label: 'Dip Readings', labelUr: 'ڈیپ ریڈنگز', reportId: 'INV_DIP' },
      { id: 'movement', label: 'Stock Movement', labelUr: 'اسٹاک منتقلی', reportId: 'INV_MOVEMENT' },
      { id: 'reconciliation', label: 'Stock Reconciliation', labelUr: 'اسٹاک پڑتال', reportId: 'INV_RECON' },
    ],
    quickCreates: [
      { id: 'record_dip', label: '+ Record Dip', labelUr: '+ ڈیپ اندراج', icon: '📏', targetId: 'INV_DIP' },
      { id: 'stock_adj', label: '+ Stock Adjustment', labelUr: '+ اسٹاک ایڈجسٹمنٹ', icon: '⚖️', targetId: 'INV_RECON' },
    ],
  },
  purchases: {
    title: 'Purchases & Deliveries Workspace',
    titleUr: 'خریداری و باؤزر ڈیلیوری ورک اسپیس',
    icon: '🚛',
    color: 'purple',
    localTabs: [
      { id: 'overview', label: 'Overview', labelUr: 'جائزہ', reportId: 'DOMAIN_PUR_HOME' },
      { id: 'history', label: 'Purchase History', labelUr: 'خریداری ہسٹری', reportId: 'PUR_HISTORY' },
      { id: 'deliveries', label: 'Bowser Deliveries', labelUr: 'باؤزر ڈیلیوریز', reportId: 'PUR_DELIVERIES' },
      { id: 'register', label: 'Purchase Register', labelUr: 'پرچیز رجسٹر', reportId: 'PUR_REGISTER' },
    ],
    quickCreates: [
      { id: 'new_purchase', label: '+ Record Purchase', labelUr: '+ خریداری اندراج', icon: '🧾', targetId: 'PUR_REGISTER' },
    ],
  },
  finance: {
    title: 'Finance & Cash Workspace',
    titleUr: 'مالیات و کیش بک ورک اسپیس',
    icon: '💰',
    color: 'emerald',
    localTabs: [
      { id: 'overview', label: 'Overview', labelUr: 'جائزہ', reportId: 'DOMAIN_FIN_HOME' },
      { id: 'cashbook', label: 'Cash Book', labelUr: 'کیش بک', reportId: 'FIN_CASHBOOK' },
      { id: 'bank', label: 'Bank Ledger', labelUr: 'بینک کھاتہ', reportId: 'B' },
      { id: 'expenses', label: 'Expense Vouchers', labelUr: 'اخراجات واؤچرز', reportId: 'FIN_EXPENSE' },
      { id: 'pnl', label: 'Profit & Loss', labelUr: 'نفع و نقصان', reportId: 'FIN_PNL' },
    ],
    quickCreates: [
      { id: 'new_voucher', label: '+ Expense Voucher', labelUr: '+ اخراجات واؤچر', icon: '💸', targetId: 'FIN_EXPENSE' },
      { id: 'bank_deposit', label: '+ Bank Deposit', labelUr: '+ بینک ڈیپازٹ', icon: '🏦', targetId: 'B' },
    ],
  },
  expenses: {
    title: 'Station Expenses Workspace',
    titleUr: 'اسٹیشن اخراجات ورک اسپیس',
    icon: '💸',
    color: 'orange',
    localTabs: [
      { id: 'overview', label: 'Overview', labelUr: 'جائزہ', reportId: 'FIN_EXPENSE' },
      { id: 'vouchers', label: 'Expense Vouchers', labelUr: 'واؤچرز رجسٹر', reportId: 'FIN_EXPENSE' },
    ],
    quickCreates: [
      { id: 'new_expense', label: '+ Expense Voucher', labelUr: '+ اخراجات واؤچر', icon: '💸', targetId: 'FIN_EXPENSE' },
    ],
  },
  suppliers: {
    title: 'Supplier & Payables Workspace',
    titleUr: 'سپلائر و واجبات ورک اسپیس',
    icon: '🏢',
    color: 'indigo',
    localTabs: [
      { id: 'overview', label: 'Overview', labelUr: 'جائزہ', reportId: 'DOMAIN_SUP_HOME' },
      { id: 'register', label: 'Supplier Register', labelUr: 'سپلائر رجسٹر', reportId: 'SUP_REGISTER' },
      { id: 'ledger', label: 'Supplier Ledger', labelUr: 'سپلائر کھاتہ', reportId: 'LED_SUPPLIER' },
      { id: 'outstanding', label: 'Outstanding Payables', labelUr: 'واجب الادا بقایا', reportId: 'SUP_OUTSTANDING' },
    ],
    quickCreates: [
      { id: 'pay_supplier', label: '+ Settle Payment', labelUr: '+ ادائیگی کریں', icon: '💵', targetId: 'SUP_PAYMENTS' },
    ],
  },
  ledgers: {
    title: 'General Ledgers Workspace',
    titleUr: 'جنرل لیجرز ورک اسپیس',
    icon: '📒',
    color: 'slate',
    localTabs: [
      { id: 'overview', label: 'Overview', labelUr: 'جائزہ', reportId: 'DOMAIN_LEDGER_HOME' },
      { id: 'cus_led', label: 'Customer Ledgers', labelUr: 'کسٹمر کھاتے', reportId: 'L1' },
      { id: 'sup_led', label: 'Supplier Ledgers', labelUr: 'سپلائر کھاتے', reportId: 'LED_SUPPLIER' },
    ],
    quickCreates: [],
  },
  staff: {
    title: 'Staff & Workforce Management Workspace',
    titleUr: 'اسٹاف اور ورک فورس مینیجمنٹ ورک اسپیس',
    icon: '👥',
    color: 'teal',
    localTabs: [
      { id: 'overview', label: 'Overview', labelUr: 'جائزہ', reportId: 'DOMAIN_STF_HOME' },
      { id: 'employees', label: 'Employees Register', labelUr: 'ملازمین رجسٹر', reportId: 'STF_REGISTER' },
      { id: 'attendance', label: 'Attendance', labelUr: 'حاضری', reportId: 'STF_ATTENDANCE' },
      { id: 'shifts', label: 'Shift Management', labelUr: 'شفٹ مینیجمنٹ', reportId: 'SHIFT' },
      { id: 'performance', label: 'Performance', labelUr: 'کارکردگی', reportId: 'STF_PERFORMANCE' },
      { id: 'payroll', label: 'Payroll', labelUr: 'پے رول', reportId: 'STF_PAYROLL' },
      { id: 'leaves', label: 'Leave Management', labelUr: 'رخصت مینیجمنٹ', reportId: 'STF_LEAVE' },
      { id: 'overtime', label: 'Overtime', labelUr: 'اور ٹائم', reportId: 'STF_OVERTIME' },
      { id: 'incentives', label: 'Incentives', labelUr: 'انعامات و کمیشن', reportId: 'STF_INCENTIVE' },
      { id: 'training', label: 'Training & Certs', labelUr: 'تربیت و سرٹیفکیٹس', reportId: 'STF_TRAINING' },
      { id: 'documents', label: 'Documents', labelUr: 'دستاویزات', reportId: 'STF_DOCS' },
      { id: 'audit', label: 'Audit Trail', labelUr: 'آڈٹ ٹریل', reportId: 'STF_AUDIT' },
    ],
    quickCreates: [
      { id: 'add_emp', label: '+ Add Employee', labelUr: '+ نیا ملازم', icon: '👤', targetId: 'STF_REGISTER' },
      { id: 'attendance', label: 'Mark Attendance', labelUr: 'حاضری', icon: '🕒', targetId: 'STF_ATTENDANCE' },
      { id: 'payroll', label: 'Process Payroll', labelUr: 'پے رول', icon: '💰', targetId: 'STF_PAYROLL' },
    ],
  },
  pricing: {
    title: 'Pricing & Fuel Rates Workspace',
    titleUr: 'قیمتیں و فیول ریٹس ورک اسپیس',
    icon: '🏷️',
    color: 'rose',
    localTabs: [
      { id: 'overview', label: 'Overview', labelUr: 'جائزہ', reportId: 'DOMAIN_PRC_HOME' },
      { id: 'price_board', label: 'Current Price Board', labelUr: 'پرائس بورڈ', reportId: 'PRC_RATES' },
      { id: 'price_changes', label: 'Price Change History', labelUr: 'قیمت کی تاریخ', reportId: 'PRC_HISTORY' },
    ],
    quickCreates: [
      { id: 'update_price', label: '+ Update Fuel Price', labelUr: '+ قیمت تبدیل کریں', icon: '🏷️', targetId: 'DOMAIN_PRC_HOME' },
      { id: 'schedule_price', label: 'Schedule Revision', labelUr: 'شیڈول تبدیلی', icon: '📅', targetId: 'DOMAIN_PRC_HOME' },
      { id: 'publish_rates', label: 'Publish Rates', labelUr: 'ریٹس پبلش', icon: '📤', targetId: 'DOMAIN_PRC_HOME' },
    ],
  },
  analytics: {
    title: 'Executive Analytics Workspace',
    titleUr: 'ایگزیکٹو کنٹرول روم',
    icon: '📊',
    color: 'cyan',
    localTabs: [
      { id: 'overview', label: 'Control Room', labelUr: 'کنٹرول روم', reportId: 'DOMAIN_ANL_HOME' },
      { id: 'true_profit', label: 'True Profit Analysis', labelUr: 'اصل منافع', reportId: 'P1' },
    ],
    quickCreates: [],
  },
  fleet: { title: 'Fleet Management Workspace', titleUr: 'فلیکٹ ورک اسپیس', icon: '🚛', color: 'blue', localTabs: [], quickCreates: [] },
  lpg: { title: 'LPG Gas Operations Workspace', titleUr: 'ایل پی جی ورک اسپیس', icon: '🔥', color: 'orange', localTabs: [], quickCreates: [] },
  lubricants: { title: 'Lubricants & Oil Shop Workspace', titleUr: 'لیوب ائل ورک اسپیس', icon: '🛢️', color: 'amber', localTabs: [], quickCreates: [] },
  tyre: { title: 'Tyre Shop Workspace', titleUr: 'ٹائر شاپ ورک اسپیس', icon: '🛞', color: 'stone', localTabs: [], quickCreates: [] },
  mart: { title: 'Convenience Mart Workspace', titleUr: 'مارٹ ورک اسپیس', icon: '🛒', color: 'emerald', localTabs: [], quickCreates: [] },
  payroll: { title: 'Payroll & Salary Workspace', titleUr: 'پے رول ورک اسپیس', icon: '💼', color: 'sky', localTabs: [], quickCreates: [] },
  compliance: { title: 'Audit & Compliance Workspace', titleUr: 'آڈٹ و تعمیل ورک اسپیس', icon: '🛡️', color: 'violet', localTabs: [], quickCreates: [] },
  custom: { title: 'Business Process Workspace', titleUr: 'بزنس پروسیس ورک اسپیس', icon: '⚙️', color: 'slate', localTabs: [], quickCreates: [] },
};

export const DomainWorkspaceEngine: React.FC<DomainWorkspaceEngineProps> = ({
  domain,
  reportId,
  config,
  stationId,
  orgId,
  userId,
  role,
  lang,
  onSelectReport,
  onDrilldown,
}) => {
  const meta = DOMAIN_METADATA[domain] || DOMAIN_METADATA.custom;
  const isEn = lang === 'en';

  const commonProps = {
    reportId,
    stationId,
    orgId,
    userId,
    role,
    lang,
    onSelectReport,
    onDrilldown,
  };

  switch (domain) {
    case 'fuel_operations':
    case 'sales':
      return <FuelOperationsWorkspaceView {...commonProps} />;
    case 'purchases':
      return <PurchasesWorkspaceView {...commonProps} />;
    case 'customers':
      return <CustomersWorkspaceView {...commonProps} />;
    case 'inventory':
      return <InventoryWorkspaceView {...commonProps} />;
    case 'expenses':
      return <ExpensesWorkspaceView {...commonProps} />;
    case 'finance':
      return <FinanceWorkspaceView {...commonProps} />;
    case 'suppliers':
      return <SuppliersWorkspaceView {...commonProps} />;
    case 'ledgers':
      return <LedgersWorkspaceView {...commonProps} />;
    case 'staff':
      return <StaffWorkspaceView {...commonProps} />;
    case 'pricing':
      return <PricingWorkspaceView {...commonProps} />;
    case 'analytics':
      return <AnalyticsWorkspaceView {...commonProps} />;
    default:
      break;
  }

  const [activeTabReportId, setActiveTabReportId] = useState<string>(reportId);

  // Synchronize active report selection
  const handleTabClick = (targetReportId: string) => {
    setActiveTabReportId(targetReportId);
    if (onSelectReport) onSelectReport(targetReportId);
  };

  return (
    <div className={`space-y-4 font-sans ${lang === 'ur' ? 'rtl' : ''}`}>
      {/* ── ENTERPRISE DOMAIN WORKSPACE HEADER & LOCAL SUB-NAVIGATION ── */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#0B5C3D]/10 text-[#0B5C3D] flex items-center justify-center text-xl font-bold">
              {meta.icon}
            </div>
            <div>
              <h1 className="text-lg font-black text-slate-900 tracking-tight leading-tight">
                {isEn ? meta.title : meta.titleUr}
              </h1>
              <span className="text-[11px] font-bold text-slate-400">
                {isEn ? `Domain: ${domain.toUpperCase()} • Live Firestore Realtime Engine` : `ڈومین: ${domain} • لائیو فائر بیس اسٹریم`}
              </span>
            </div>
          </div>

          {/* Quick Create Launchers */}
          {meta.quickCreates.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              {meta.quickCreates.map((qc) => (
                <button
                  key={qc.id}
                  onClick={() => onSelectReport?.(qc.targetId)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#0B5C3D] text-white hover:bg-emerald-800 rounded-xl text-xs font-black transition-all shadow-xs cursor-pointer active:scale-95"
                >
                  <span>{qc.icon}</span>
                  <span>{isEn ? qc.label : qc.labelUr}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Local Domain Sub-Navigation Tabs */}
        {meta.localTabs.length > 0 && (
          <div className="flex items-center gap-1.5 pt-3 overflow-x-auto custom-horizontal-scrollbar pb-1.5" data-horizontal-scroll="true">
            {meta.localTabs.map((tab) => {
              const isActive = reportId === tab.reportId || activeTabReportId === tab.reportId;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabClick(tab.reportId)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap ${
                    isActive
                      ? 'bg-[#0B5C3D] text-white shadow-xs'
                      : 'bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  {isEn ? tab.label : tab.labelUr}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* ── WORKSPACE PAGE ENGINE (Renders Page Metadata + KPIs + Search + Filters + Register + Inspector) ── */}
      <ReportViewer
        reportId={reportId}
        stationId={stationId}
        orgId={orgId}
        userId={userId}
        role={role}
        onDrilldown={onDrilldown}
        onSelectReport={onSelectReport}
      />
    </div>
  );
};
