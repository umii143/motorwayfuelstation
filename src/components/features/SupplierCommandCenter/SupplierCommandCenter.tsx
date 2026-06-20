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
import SupplierDetailsFullPage from './SupplierDetailsFullPage';

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
  const [currentSupplierId, setCurrentSupplierId] = React.useState<string | null>(() => {
    const path = window.location.pathname;
    if (path.startsWith('/suppliers/') && path.length > 11) {
      return path.split('/')[2];
    }
    return null;
  });

  React.useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname;
      if (path.startsWith('/suppliers/') && path.length > 11) {
        setCurrentSupplierId(path.split('/')[2]);
      } else {
        setCurrentSupplierId(null);
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigateToSupplier = (id: string) => {
    window.history.pushState({}, '', `/suppliers/${id}`);
    setCurrentSupplierId(id);
  };

  const navigateBackToDirectory = () => {
    window.history.pushState({}, '', '/suppliers');
    setCurrentSupplierId(null);
  };

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

  if (currentSupplierId) {
    const supplier = suppliers.find(s => s.id === currentSupplierId);
    if (!supplier) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <ShieldAlert className="w-16 h-16 text-slate-600 mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Supplier Not Found</h2>
          <button onClick={navigateBackToDirectory} className="text-orange-500 hover:underline">Return to Directory</button>
        </div>
      );
    }
    return (
      <SupplierDetailsFullPage 
        supplier={supplier}
        settings={settings}
        shifts={shifts}
        banks={banks}
        batches={batches}
        onBack={navigateBackToDirectory}
      />
    );
  }

  return (
    <div className="space-y-6 pb-16 lg:pb-0">
      {/* Advanced Clean Header */}
      <div className="flex flex-col gap-1 mb-2">
        <h1 className="font-sans text-2xl font-bold dark:text-white text-slate-900 tracking-tight">
          {t('Supplier Management', 'سپلائر مینجمنٹ')}
        </h1>
        <p className="font-sans text-sm dark:text-slate-400 text-slate-500">
          {t('Manage your fuel, lubricant and service suppliers', 'اپنے فیول، لبریکنٹ اور سروس سپلائرز کا انتظام کریں')}
        </p>
      </div>
      {/* Navigation Tabs */}
      <div className="flex overflow-x-auto no-scrollbar gap-2 pb-2">
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
            batches={batches}
            products={products}
            banks={banks}
            onAddSupplier={onAddSupplier}
            onUpdateSupplier={onUpdateSupplier}
            onDeleteSupplier={onDeleteSupplier}
            onDeleteSupplierPayment={onDeleteSupplierPayment}
            onNavigateToSupplier={navigateToSupplier}
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
