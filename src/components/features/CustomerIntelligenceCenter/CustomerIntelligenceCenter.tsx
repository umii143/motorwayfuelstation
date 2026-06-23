/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { User } from 'lucide-react';
import { Customer, Shift, Product, GlobalSettings, LubePosSale } from '../../../types';
import { t as translate } from '../../../lib/translations';
import CustomerDirectory from './CustomerDirectory';

interface CustomerIntelligenceCenterProps {
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

export default function CustomerIntelligenceCenter({
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
}: CustomerIntelligenceCenterProps) {
  const [activeTab, setActiveTab] = useState<'directory'>('directory');
  const t = (en: string, ur: string) => translate(en, ur, settings);

  const tabs = [
    { id: 'directory', icon: User, label: 'Profiles & Billing', urdu: 'پروفائلز اور بلنگ' },
    // Expandable in the future
    // { id: 'recovery', icon: Wallet, label: 'Recovery Hub', urdu: 'ریکوری سینٹر' },
    // { id: 'statements', icon: FileText, label: 'Statements', urdu: 'اسٹیٹمنٹس' }
  ];

  return (
    <div className="space-y-6 pb-16 lg:pb-0">
      {/* Navigation Tabs (Optional if only one exists for now, but kept for future scale) */}
      <div className="flex overflow-x-auto no-scrollbar gap-2 pb-2">
        {tabs.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
          <CustomerDirectory
            settings={settings}
            activeStationId={activeStationId}
            customers={customers}
            shifts={shifts}
            products={products}
            lubePosSales={lubePosSales}
            onAddCustomer={onAddCustomer}
            onUpdateCustomer={onUpdateCustomer}
            onDeleteCustomer={onDeleteCustomer}
            onUpdateShift={onUpdateShift}
            onDeleteDebitEntry={onDeleteDebitEntry}
            onDeleteRecoveryEntry={onDeleteRecoveryEntry}
          />
        )}
      </motion.div>
    </div>
  );
}
