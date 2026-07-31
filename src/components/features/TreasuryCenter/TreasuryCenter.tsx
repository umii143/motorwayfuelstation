import React, { useState, useEffect } from 'react';
import { Landmark, ArrowRightLeft, UserMinus, Scale, ShieldCheck } from 'lucide-react';
import { useTreasuryStore } from '../../../stores/useTreasuryStore';
import { useAuthStore } from '../../../stores/useAuthStore';
import { useStationStore } from '../../../stores/useStationStore';
import { useShallow } from 'zustand/react/shallow';
import TreasuryDashboard from './TreasuryDashboard';
import FundTransferForm from './FundTransferForm';
import CashReconciliationForm from './CashReconciliationForm';
import OwnerDrawingsForm from './OwnerDrawingsForm';
import BankDepositReconciliation from './BankDepositReconciliation';
import SmartDebtRecovery from './SmartDebtRecovery';
import { Target, CheckCircle2 } from 'lucide-react';

export default function TreasuryCenter() {
 const stationId = useAuthStore(state => state.stationId);
 const settings = useStationStore(state => state.settings);

 const isUrdu = settings?.language === 'ur';
 const t = (en: string, ur: string) => (isUrdu ? ur : en);

 const { loadTreasuryData, cashAccounts, handleAddCashAccount } = useTreasuryStore(useShallow(state => ({
 loadTreasuryData: state.loadTreasuryData,
 cashAccounts: state.cashAccounts,
 handleAddCashAccount: state.handleAddCashAccount
 })));
 const [activeTab, setActiveTab] = useState<'dashboard' | 'transfers' | 'reconciliation' | 'drawings' | 'bank_reconciliation' | 'debt_recovery'>('dashboard');

 useEffect(() => {
 if (stationId) {
 loadTreasuryData(stationId);
 }
 }, [stationId, loadTreasuryData]);

 // Seed default cash accounts if none exist
 useEffect(() => {
 if (cashAccounts.length === 0 && stationId) {
 const seedDefaults = async () => {
 await handleAddCashAccount({
 id: `cash_${Date.now()}_main`,
 name: 'Main Safe',
 type: 'main_safe',
 balance: 0,
 createdAt: Date.now(),
 updatedAt: Date.now()
 }, '', stationId);
 
 await handleAddCashAccount({
 id: `cash_${Date.now()}_owner`,
 name: 'Owner Vault',
 type: 'owner_cash',
 balance: 0,
 createdAt: Date.now(),
 updatedAt: Date.now()
 }, '', stationId);
 };
 seedDefaults();
 }
 }, [cashAccounts.length, stationId, handleAddCashAccount]);

 const renderTab = () => {
 switch (activeTab) {
 case 'dashboard':
 return <TreasuryDashboard />;
 case 'transfers':
 return <FundTransferForm />;
 case 'reconciliation':
 return <CashReconciliationForm />;
 case 'bank_reconciliation':
 return <BankDepositReconciliation />;
 case 'debt_recovery':
 return <SmartDebtRecovery />;
 case 'drawings':
 return <OwnerDrawingsForm />;
 default:
 return <TreasuryDashboard />;
 }
 };

 return (
 <div className="space-y-6">
 <div className="flex items-center justify-between">
 <h1 className="text-2xl font-bold text-foreground flex items-center space-x-3 gap-2">
 <Landmark className="h-8 w-8 text-blue-600" />
 <span>{t('Enterprise Treasury Center', 'انٹرپرائز ٹریژری سینٹر')}</span>
 </h1>
 </div>

 <div className="flex overflow-x-auto premium-card bg-card border border-border p-1.5 rounded-2xl gap-1">
 <button
 onClick={() => setActiveTab('dashboard')}
 className={`flex-1 min-w-[140px] flex items-center justify-center space-x-2 py-3 px-4 rounded-xl transition-all cursor-pointer${
 activeTab === 'dashboard'
 ? 'bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400 font-bold shadow-xs'
 : 'text-muted-foreground hover:bg-slate-50 dark:hover:bg-card/5 hover:text-foreground dark:hover:text-white'
 }`}
 >
 <ShieldCheck className="h-4 w-4 shrink-0" />
 <span>{t('Dashboard & Overview', 'ڈیش بورڈ اور جائزہ')}</span>
 </button>
 <button
 onClick={() => setActiveTab('transfers')}
 className={`flex-1 min-w-[140px] flex items-center justify-center space-x-2 py-3 px-4 rounded-xl transition-all cursor-pointer${
 activeTab === 'transfers'
 ? 'bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400 font-bold shadow-xs'
 : 'text-muted-foreground hover:bg-slate-50 dark:hover:bg-card/5 hover:text-foreground dark:hover:text-white'
 }`}
 >
 <ArrowRightLeft className="h-4 w-4 shrink-0" />
 <span>{t('Fund Transfers', 'فنڈز ٹرانسفر')}</span>
 </button>
 <button
 onClick={() => setActiveTab('reconciliation')}
 className={`flex-1 min-w-[145px] flex items-center justify-center space-x-2 py-3 px-4 rounded-xl transition-all cursor-pointer${
 activeTab === 'reconciliation'
 ? 'bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400 font-bold shadow-xs'
 : 'text-muted-foreground hover:bg-slate-50 dark:hover:bg-card/5 hover:text-foreground dark:hover:text-white'
 }`}
 >
 <Scale className="h-4 w-4 shrink-0" />
 <span>{t('Daily Reconciliation', 'روزانہ مصالحت')}</span>
 </button>
 <button
 onClick={() => setActiveTab('drawings')}
 className={`flex-1 min-w-[140px] flex items-center justify-center space-x-2 py-3 px-4 rounded-xl transition-all cursor-pointer${
 activeTab === 'drawings'
 ? 'bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400 font-bold shadow-xs'
 : 'text-muted-foreground hover:bg-slate-50 dark:hover:bg-card/5 hover:text-foreground dark:hover:text-white'
 }`}
 >
 <UserMinus className="h-4 w-4 shrink-0" />
 <span>{t('Owner Drawings', 'مالک کے ڈرائنگز')}</span>
 </button>
 <button
 onClick={() => setActiveTab('bank_reconciliation')}
 className={`flex-1 min-w-[160px] flex items-center justify-center space-x-2 py-3 px-4 rounded-xl transition-all cursor-pointer${
 activeTab === 'bank_reconciliation'
 ? 'bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400 font-bold shadow-xs'
 : 'text-muted-foreground hover:bg-slate-50 dark:hover:bg-card/5 hover:text-foreground dark:hover:text-white'
 }`}
 >
 <CheckCircle2 className="h-4 w-4 shrink-0" />
 <span>{t('Bank Deposit Matcher', 'بینک ڈپازٹ میچر')}</span>
 </button>
 <button
 onClick={() => setActiveTab('debt_recovery')}
 className={`flex-1 min-w-[165px] flex items-center justify-center space-x-2 py-3 px-4 rounded-xl transition-all cursor-pointer${
 activeTab === 'debt_recovery'
 ? 'bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400 font-bold shadow-xs'
 : 'text-muted-foreground hover:bg-slate-50 dark:hover:bg-card/5 hover:text-foreground dark:hover:text-white'
 }`}
 >
 <Target className="h-4 w-4 shrink-0" />
 <span>{t('Debt Recovery Queue', 'ادھار وصولی کی قطار')}</span>
 </button>
 </div>

 <div className="mt-6">
 {renderTab()}
 </div>
 </div>
 );
}
