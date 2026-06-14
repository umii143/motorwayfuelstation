/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Truck, CreditCard, Building2, ShieldAlert, BarChart2 } from 'lucide-react';
import { Supplier, Shift, Product, GlobalSettings, BankAccount } from '../../../types';
import { t as translate } from '../../../lib/translations';
import { useInventoryStore } from '../../../stores/useInventoryStore';
import { useFinancialStore } from '../../../stores/useFinancialStore';

import SupplierDirectory from './SupplierDirectory';
import SupplierPayablesPanel from './SupplierPayablesPanel';
import SupplierPayments from './SupplierPayments';
import SupplierClaimsPanel from './SupplierClaimsPanel';
import SupplierScorecard from './SupplierScorecard';

interface SupplierCommandCenterProps {
  settings: GlobalSettings;
  suppliers: Supplier[];
  shifts: Shift[];
  products: Product[];
  banks: BankAccount[];
  onAddSupplier: (supplier: Supplier) => void;
  onUpdateSupplier: (supplier: Supplier) => void;
  onDeleteSupplier: (supplierId: string) => void;
  onDeleteSupplierPayment: (shiftId: string, entryId: string) => void;
}

export default function SupplierCommandCenter({
  settings,
  suppliers,
  shifts,
  products,
  banks,
  onAddSupplier,
  onUpdateSupplier,
  onDeleteSupplier,
  onDeleteSupplierPayment
}: SupplierCommandCenterProps) {
  const [activeTab, setActiveTab] = useState<'directory' | 'payables' | 'payments' | 'claims' | 'scorecard'>('directory');
  const t = (en: string, ur: string) => translate(en, ur, settings);
  const language = settings.language;

  const batches = useInventoryStore(s => s.stockBatches);
  const supplierClaims: any[] = []; // Default empty if not present in your store
  const payments: any[] = []; // Default empty

  const tabs = [
    { id: 'directory', icon: Truck, label: 'Supplier Directory', urdu: 'سپلائر ڈائریکٹری' },
    { id: 'payables', icon: Building2, label: 'Aging Payables', urdu: 'واجب الادا رقوم' },
    { id: 'payments', icon: CreditCard, label: 'Payment Gateway', urdu: 'ادائیگیاں' },
    { id: 'claims', icon: ShieldAlert, label: 'Claims & Refunds', urdu: 'کلیمز اور ریفنڈز' },
    { id: 'scorecard', icon: BarChart2, label: 'Scorecard', urdu: 'سپلائر کی کارکردگی' }
  ];

  return (
    <div className="space-y-6 pb-16 lg:pb-0">
      {/* Header */}
      <div className="flex flex-row items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-lg">
            <Truck className="h-7 w-7" />
          </div>
          <div>
            <h1 className="font-sans text-2xl font-bold text-slate-900 tracking-tight">
              {t('Supplier Command Center', 'سپلائر کمانڈ سینٹر')}
            </h1>
            <p className="font-sans text-sm text-slate-500 mt-1">
              {t('Unified management for oil vendors, payments, aging payables, and claims.', 'آئل کمپنیوں کے بلز، ادائیگیاں، واجبات اور کلیمز کا مربوط نظام۔')}
            </p>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex overflow-x-auto hide-scrollbar gap-2 pb-2">
        {tabs.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-sans text-sm font-bold transition-all whitespace-nowrap cursor-pointer ${
                isActive 
                  ? 'bg-slate-900 text-white shadow-md' 
                  : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
              }`}
            >
              <Icon className="h-4 w-4" />
              {t(tab.label, tab.urdu)}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
      >
        {activeTab === 'directory' && (
          <SupplierDirectory
            settings={settings}
            suppliers={suppliers}
            shifts={shifts}
            products={products}
            banks={banks}
            onAddSupplier={onAddSupplier}
            onUpdateSupplier={onUpdateSupplier}
            onDeleteSupplier={onDeleteSupplier}
            onDeleteSupplierPayment={onDeleteSupplierPayment}
          />
        )}

        {activeTab === 'payables' && (
          <SupplierPayablesPanel
            suppliers={suppliers}
            batches={batches}
            language={language}
          />
        )}

        {activeTab === 'payments' && (
          <SupplierPayments
            suppliers={suppliers}
            banks={banks}
            settings={settings}
            onClose={() => setActiveTab('directory')}
          />
        )}

        {activeTab === 'claims' && (
          <SupplierClaimsPanel
            batches={batches}
            suppliers={suppliers}
            language={language}
          />
        )}

        {activeTab === 'scorecard' && (
          <SupplierScorecard
            suppliers={suppliers}
            batches={batches}
            supplierClaims={supplierClaims}
            language={language}
          />
        )}
      </motion.div>
    </div>
  );
}
