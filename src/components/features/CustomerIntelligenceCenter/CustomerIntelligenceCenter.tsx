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
import { CreditRiskControlCenter } from './CreditRiskControlCenter';
import { ShieldAlert } from 'lucide-react';

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
 const [activeTab, setActiveTab] = useState<'risk_center' | 'directory'>('risk_center');
 const t = (en: string, ur: string) => translate(en, ur, settings);

 const tabs = [
 { id: 'risk_center', icon: ShieldAlert, label: 'Credit Risk & Control Center', urdu: 'کریڈٹ رسک اور کنٹرول سینٹر' },
 { id: 'directory', icon: User, label: 'Customer Profiles & Khata', urdu: 'پروفائلز اور کھاتہ' }
 ];

 return (
 <div className="space-y-6 pb-16 lg:pb-0">
 {/* Navigation Tabs */}
 <div className="flex overflow-x-auto no-scrollbar gap-2 pb-2">
 {tabs.map(tab => {
 const Icon = tab.icon;
 const isActive = activeTab === tab.id;
 return (
 <button
 key={tab.id}
 onClick={() => setActiveTab(tab.id as any)}
 className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-sans text-sm font-bold transition-all whitespace-nowrap cursor-pointer${
 isActive 
 ? 'bg-card text-white shadow-md' 
 : 'bg-card text-slate-600 hover:bg-slate-50 dark:bg-card/5 border border-border'
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
 {activeTab === 'risk_center' && (
 <CreditRiskControlCenter
 settings={settings}
 customers={customers}
 shifts={shifts}
 />
 )}

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
