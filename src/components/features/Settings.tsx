import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Settings, Shield, Truck, DollarSign, FileText, Globe, Database,
  ChevronRight, Sliders, AlertTriangle, Lock, Fuel, User, Building,
  Key, Package, Tag, Percent, Landmark, Wallet, Clock, FileSearch,
  Bell, Link as LinkIcon, DownloadCloud, Wrench, Activity, Search,
  ChevronDown, X, Fingerprint
} from 'lucide-react';
import { GlobalSettings, Product, Nozzle, Pump, Tank, RateHistoryEntry, AuditTrailEntry } from '../../types';
import { db } from '../../data/db';
import { useStation } from '../../contexts/StationContext';
import { useNativeAuth } from '../../contexts/NativeAuthContext';
import { useAuth } from '../../contexts/AuthContext';

import RateWizard from './Settings/RateWizard';
import TankWizard from './Settings/TankWizard';
import NozzleWizard from './Settings/NozzleWizard';
import ProductWizard from './Settings/ProductWizard';
import UnifiedAccountManager from './Settings/UnifiedAccountManager';
import SystemAuditTrail from './Settings/SystemAuditTrail';
import DealerMarginWizard from './Settings/DealerMarginWizard';
import ProfileCenter from './Settings/ProfileCenter';
import SecurityCenter from './Settings/SecurityCenter';
import BackupRecovery from './Settings/BackupRecovery';
import MeterManagement from './Settings/MeterManagement';
import DataIntegrity from './Settings/DataIntegrity';
import AdvancedTools from './Settings/AdvancedTools';
import FactoryReset from './Settings/FactoryReset';
import StationIdentity from './Settings/StationIdentity';
import ShiftSettings from './Settings/ShiftSettings';
import NotificationsConfig from './Settings/NotificationsConfig';
import Integrations from './Settings/Integrations';
import SystemPreferences from './Settings/SystemPreferences';
import LicenseSubscription from './Settings/LicenseSubscription';
import TreasurySettings from './Settings/TreasurySettings';
import { SetupBanner } from './ConfigurationHub/SetupBanner';
import { SetupNavigationFooter } from './ConfigurationHub/SetupNavigationFooter';
import { isLubeBusinessStation } from '../../lib/businessScope';

export type SettingsView =
  | 'profile' | 'station' | 'security' | 'treasury'
  | 'shift' | 'meter' | 'price' | 'backup' | 'integrity'
  | 'notifications' | 'integrations' | 'preferences' | 'advanced'
  | 'factory_reset' | 'tanks' | 'products' | 'nozzles' | 'margins'
  | 'accounts' | 'audit' | 'license';

interface SettingsProps {
  activeStationId: string;
  settings: GlobalSettings;
  products: Product[];
  pumps: Pump[];
  nozzles: Nozzle[];
  onUpdateSettings: (settings: GlobalSettings) => void;
  onUpdateProductRate: (id: string, newRate: number, reason?: string, changedBy?: string, dateStr?: string) => void;
  tanks: Tank[];
  onAddTank: (newTank: Tank) => void;
  onUpdateTank: (updatedTank: Tank) => void;
  onDeleteTank: (id: string) => void;
  onAddNozzle: (newNozzle: Nozzle) => void;
  onUpdateNozzle: (updatedNozzle: Nozzle) => void;
  onDeleteNozzle: (id: string) => void;
  rateHistory: RateHistoryEntry[];
  banks?: unknown;
  onUpdateBanks?: unknown;
  onUpdateProducts?: unknown;
  onUpdatePumps?: unknown;
  initialTab?: string;
  onNavigate?: (viewId: string) => void;
}

export default function SettingsPanel({
  activeStationId,
  settings,
  products,
  pumps,
  nozzles,
  onUpdateSettings,
  onUpdateProductRate,
  tanks,
  onAddTank,
  onUpdateTank,
  onDeleteTank,
  onAddNozzle,
  onUpdateNozzle,
  onDeleteNozzle,
  rateHistory,
  banks,
  onUpdateBanks,
  onUpdateProducts,
  onUpdatePumps,
  initialTab = 'profile',
  onNavigate
}: SettingsProps) {
  const { showToast, showAlert, showConfirm } = useStation();
  const { requireBiometric } = useNativeAuth();
  const { isSuperAdmin } = useAuth();
  const isUrdu = settings.language === 'ur';
  const t = (en: string, ur: string) => (isUrdu ? ur : en);
  const isLube = isLubeBusinessStation(activeStationId);

  const [activeTab, setActiveTab] = useState<SettingsView>((initialTab as SettingsView) || 'profile');
  const [prevInitialTab, setPrevInitialTab] = useState(initialTab);
  const [sidebarSearch, setSidebarSearch] = useState('');
  // Track which accordion sections are open on mobile
  const [mobileOpenSections, setMobileOpenSections] = useState<Set<string>>(new Set(['enterprise']));

  if (initialTab !== prevInitialTab) {
    setPrevInitialTab(initialTab);
    if (initialTab) {
      const tabToSet = initialTab === 'tariff' ? 'price' :
                       initialTab === 'users' ? 'security' :   // redirect users → security
                       initialTab === 'emergency' ? 'security' :  // redirect emergency → security
                       (initialTab as SettingsView);
      setActiveTab(tabToSet);
    }
  }

  const handleLogAudit = (category: string, action: string, details: string) => {
    const existing = db.getSettingsAuditTrail(activeStationId);
    const newEntry: AuditTrailEntry = {
      id: 'audit_' + Date.now() + '_' + crypto.randomUUID().split('-')[0],
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
      category,
      action,
      details,
      user: 'Owner',
      role: 'Owner',
      branch: activeStationId
    };
    db.saveSettingsAuditTrail(activeStationId, [newEntry, ...existing]);
  };

  // ─── SIDEBAR SECTIONS ────────────────────────────────────────────────────
  const SIDEBAR_SECTIONS = useMemo(() => [
    {
      id: 'enterprise',
      title: t('Enterprise Setup', 'انٹرپرائز سیٹ اپ'),
      items: [
        { id: 'profile',  label: t('Profile Center', 'پروفائل سینٹر'),           icon: User,          badge: null },
        { id: 'station',  label: t('Station Identity', 'اسٹیشن کی شناخت'),       icon: Building,      badge: null },
        ...(isSuperAdmin ? [{ id: 'license' as SettingsView,  label: t('License & Plan', 'لائسنس اور پلان'),         icon: Key,           badge: null }] : []),
      ]
    },
    ...(!isLube ? [{
      id: 'hardware',
      title: t('Hardware & Inventory', 'ہارڈویئر اور انوینٹری'),
      items: [
        { id: 'products', label: t('Products', 'مصنوعات'),                         icon: Package,       badge: null },
        { id: 'tanks',  label: t('Tanks & Storage', 'ٹینک اور اسٹوریج'),       icon: Database,      badge: null },
        { id: 'nozzles',label: t('Dispenser Nozzles', 'ڈسپینسر نوزلز'),        icon: Fuel,          badge: null },
        { id: 'meter',  label: t('Meter Management', 'میٹر مینجمنٹ'),          icon: Activity,      badge: null },
      ]
    }] : []),
    {
      id: 'financial',
      title: t('Financial & Pricing', 'مالیاتی اور قیمتیں'),
      items: [
        ...(!isLube ? [
          { id: 'price',    label: t('Price Settings', 'قیمت کی ترتیبات'),          icon: Tag,           badge: null },
          { id: 'margins',label: t('Dealer Margin', 'ڈیلر مارجن'),               icon: Percent,       badge: null },
        ] : []),
        { id: 'treasury', label: t('Treasury Config', 'ٹریژری ترتیبات'),          icon: Landmark,      badge: null },
        { id: 'accounts', label: t('Banks & Wallets', 'بینک اور والٹس'),          icon: Wallet,        badge: null },
      ]
    },
    {
      id: 'security',
      title: t('Security & Control', 'سیکیورٹی اور کنٹرول'),
      items: [
        { id: 'security', label: t('Security Center', 'سیکیورٹی سینٹر'),         icon: Shield,        badge: null, biometric: true },
        ...(!isLube ? [
          { id: 'shift',  label: t('Shift Settings', 'شفٹ سیٹنگز'),              icon: Clock,         badge: null },
        ] : []),
        { id: 'integrity',label: t('Data Integrity', 'ڈیٹا کی درستگی'),          icon: Activity,      badge: null },
        { id: 'audit',    label: t('Audit Trail', 'آڈٹ ٹریل'),                    icon: FileSearch,    badge: null },
      ]
    },
    {
      id: 'system',
      title: t('System Administration', 'سسٹم ایڈمنسٹریشن'),
      items: [
        { id: 'preferences',   label: t('Preferences', 'ترجیحات'),               icon: Sliders,       badge: null },
        { id: 'notifications', label: t('Notifications', 'اطلاعات'),              icon: Bell,          badge: null },
        { id: 'integrations',  label: t('Integrations', 'انضمام'),               icon: LinkIcon,      badge: null },
        { id: 'backup',        label: t('Backup & Recovery', 'بیک اپ'),          icon: DownloadCloud, badge: null },
        { id: 'advanced',      label: t('Advanced Tools', 'ایڈوانسڈ ٹولز'),     icon: Wrench,        badge: null },
        { id: 'factory_reset', label: t('Factory Reset', 'فیکٹری ری سیٹ'),      icon: AlertTriangle, badge: null, isDanger: true, biometric: true },
      ]
    },
  ], [t, isSuperAdmin, isLube]);

  // Filtered items for desktop search
  const filteredSections = useMemo(() => {
    const q = sidebarSearch.toLowerCase().trim();
    if (!q) return SIDEBAR_SECTIONS;
    return SIDEBAR_SECTIONS.map(section => ({
      ...section,
      items: section.items.filter(item => item.label.toLowerCase().includes(q))
    })).filter(section => section.items.length > 0);
  }, [SIDEBAR_SECTIONS, sidebarSearch]);

  const allItems = useMemo(() => SIDEBAR_SECTIONS.flatMap(s => s.items), [SIDEBAR_SECTIONS]);
  const activeItem = allItems.find(i => i.id === activeTab);

  const handleTabChange = async (id: SettingsView) => {
    const item = allItems.find(i => i.id === id);
    if ((item as any)?.biometric) {
      const auth = await requireBiometric(`Access ${id}`);
      if (!auth) return;
    }
    setActiveTab(id);
  };

  const toggleMobileSection = (sectionId: string) => {
    setMobileOpenSections(prev => {
      const next = new Set(prev);
      if (next.has(sectionId)) {
        next.delete(sectionId);
      } else {
        next.add(sectionId);
      }
      return next;
    });
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'products':
        return <ProductWizard isLube={isLube} products={products} language={settings.language} onUpdateProducts={onUpdateProducts} onLogAudit={handleLogAudit} />;
      case 'price':
        return <RateWizard isLube={isLube} products={products} tanks={tanks} rateHistory={rateHistory} language={settings.language} settings={settings} onUpdateProductRate={onUpdateProductRate} onLogAudit={handleLogAudit} onUpdateProducts={onUpdateProducts} />;
      case 'margins':
        return <DealerMarginWizard language={settings.language} onLogAudit={handleLogAudit} stationId={activeStationId} />;
      case 'tanks':
        return <TankWizard tanks={tanks} products={products} language={settings.language} onAddTank={onAddTank} onUpdateTank={onUpdateTank} onDeleteTank={onDeleteTank} onLogAudit={handleLogAudit} />;
      case 'nozzles':
        return <NozzleWizard nozzles={nozzles} pumps={pumps} tanks={tanks} products={products} language={settings.language} onAddNozzle={onAddNozzle} onUpdateNozzle={onUpdateNozzle} onDeleteNozzle={onDeleteNozzle} onLogAudit={handleLogAudit} onUpdateProducts={onUpdateProducts} onAddTank={onAddTank} onUpdatePumps={onUpdatePumps} />;
      case 'accounts':
        return <UnifiedAccountManager products={products} banks={banks} pumps={pumps} language={settings.language} onUpdateProducts={onUpdateProducts} onUpdateBanks={onUpdateBanks} onUpdatePumps={onUpdatePumps} onLogAudit={handleLogAudit} />;
      case 'audit':
        return <SystemAuditTrail language={settings.language} stationId={activeStationId} />;
      case 'profile':
        return <ProfileCenter settings={settings} />;
      case 'security':
        return <SecurityCenter settings={settings} onUpdateSettings={onUpdateSettings} />;
      case 'backup':
        return <BackupRecovery settings={settings} activeStationId={activeStationId} />;
      case 'meter':
        return <MeterManagement settings={settings} activeStationId={activeStationId} />;
      case 'integrity':
        return <DataIntegrity settings={settings} activeStationId={activeStationId} onNavigate={onNavigate} />;
      case 'advanced':
        return <AdvancedTools settings={settings} activeStationId={activeStationId} />;
      case 'factory_reset':
        return <FactoryReset settings={settings} activeStationId={activeStationId} />;
      case 'station':
        return <StationIdentity settings={settings} onUpdateSettings={onUpdateSettings} activeStationId={activeStationId} />;
      case 'shift':
        return <ShiftSettings settings={settings} onUpdateSettings={onUpdateSettings} activeStationId={activeStationId} />;
      case 'notifications':
        return <NotificationsConfig settings={settings} onUpdateSettings={onUpdateSettings} activeStationId={activeStationId} />;
      case 'integrations':
        return <Integrations settings={settings} activeStationId={activeStationId} />;
      case 'preferences':
        return <SystemPreferences settings={settings} onUpdateSettings={onUpdateSettings} activeStationId={activeStationId} />;
      case 'license':
        return <LicenseSubscription settings={settings} />;
      case 'treasury':
        return <TreasurySettings settings={settings} onUpdateSettings={onUpdateSettings} activeStationId={activeStationId} />;
      default:
        return (
          <div className="flex flex-col items-center justify-center h-full text-slate-400 p-12 text-center">
            <Settings className="h-16 w-16 mb-4 text-slate-200" />
            <h2 className="text-xl font-bold text-slate-700 mb-2">Module Under Construction</h2>
            <p className="max-w-md text-sm">This module is part of the V3.0 Enterprise Command Center upgrade.</p>
          </div>
        );
    }
  };

  return (
    <div className="flex flex-col h-full min-h-[calc(100dvh-120px)] overflow-hidden rounded-2xl border border-slate-200 shadow-sm bg-white max-w-full">

      {/* ── HEADER ────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3.5 shrink-0 gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-orange-50 shrink-0">
            <Settings className="h-5 w-5 text-orange-600" />
          </div>
          <div className="min-w-0">
            <h2 className="font-sans text-base sm:text-lg font-bold tracking-tight text-slate-900 truncate">
              {isLube ? t('Lube Configuration Center', 'لیوب ترتیبات مرکز') : t('Configuration Center', 'ترتیبات مرکز')}
            </h2>
            <p className="font-sans text-[11px] text-slate-400 hidden sm:block truncate">
              {activeItem ? activeItem.label : t('Select a settings module', 'ترتیبات منتخب کریں')}
            </p>
          </div>
        </div>
        {/* Active tab breadcrumb chip (mobile) */}
        {activeItem && (
          <div className="lg:hidden flex items-center gap-1.5 px-2.5 py-1 bg-orange-50 border border-orange-100 rounded-full shrink-0">
            <activeItem.icon className="h-3.5 w-3.5 text-orange-600" />
            <span className="text-[11px] font-bold text-orange-700 max-w-[100px] truncate">{activeItem.label}</span>
          </div>
        )}
      </div>

      <SetupBanner activeViewId={activeTab === 'price' ? 'setup_rates' : activeTab === 'accounts' ? 'setup_accounts' : activeTab === 'audit' ? 'setup_audit' : activeTab === 'margins' ? 'setup_margins' : `setup_${activeTab}`} />

      <div className="flex flex-1 overflow-hidden bg-slate-50 relative flex-col lg:flex-row">

        {/* ── MOBILE: GROUPED ACCORDION NAV ─────────────────────────────── */}
        <div className="lg:hidden w-full bg-white border-b border-slate-200 shrink-0">
          <div className="divide-y divide-slate-100">
            {SIDEBAR_SECTIONS.map((section) => {
              const isOpen = mobileOpenSections.has(section.id);
              const hasActive = section.items.some(i => i.id === activeTab);
              return (
                <div key={section.id}>
                  {/* Section header */}
                  <button
                    onClick={() => toggleMobileSection(section.id)}
                    className={`w-full flex items-center justify-between px-4 py-2.5 cursor-pointer transition-colors ${
                      hasActive ? 'bg-orange-50' : 'bg-white hover:bg-slate-50'
                    }`}
                  >
                    <span className={`text-xs font-extrabold uppercase tracking-widest ${
                      hasActive ? 'text-orange-600' : 'text-slate-400'
                    }`}>
                      {section.title}
                    </span>
                    <div className="flex items-center gap-2">
                      {hasActive && (
                        <span className="w-2 h-2 rounded-full bg-orange-500" />
                      )}
                      <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
                    </div>
                  </button>

                  {/* Section items */}
                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2, ease: 'easeInOut' }}
                        className="overflow-hidden bg-slate-50"
                      >
                        <div className="flex flex-wrap gap-2 px-3 py-2.5 overflow-hidden">
                          {section.items.map(item => {
                            const Icon = item.icon;
                            const isActive = activeTab === item.id;
                            return (
                              <button
                                key={item.id}
                                onClick={() => handleTabChange(item.id as SettingsView)}
                                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer border max-w-full ${
                                  isActive
                                    ? ((item as any).isDanger
                                        ? 'bg-red-600 text-white border-red-600 shadow-sm'
                                        : 'bg-orange-600 text-white border-orange-600 shadow-sm shadow-orange-200')
                                    : ((item as any).isDanger
                                        ? 'bg-white text-red-600 border-red-200 hover:bg-red-50'
                                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100 hover:border-slate-300')
                                }`}
                              >
                                <Icon className={`h-3.5 w-3.5 shrink-0 ${
                                  isActive ? 'text-white' : ((item as any).isDanger ? 'text-red-500' : 'text-slate-400')
                                }`} />
                                <span className="whitespace-nowrap">{item.label}</span>
                                {(item as any).biometric && !isActive && (
                                  <Fingerprint className="h-3 w-3 text-slate-300" />
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── DESKTOP SIDEBAR ────────────────────────────────────────────── */}
        <div className="hidden lg:flex flex-col w-64 xl:w-72 bg-white border-r border-slate-200 shrink-0">

          {/* Search box */}
          <div className="p-3 border-b border-slate-100">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
              <input
                type="text"
                placeholder={t('Search settings…', 'ترتیبات تلاش کریں…')}
                value={sidebarSearch}
                onChange={e => setSidebarSearch(e.target.value)}
                className="w-full pl-8 pr-8 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 placeholder:text-slate-400 focus:outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-400 transition-all"
              />
              {sidebarSearch && (
                <button
                  onClick={() => setSidebarSearch('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Nav items */}
          <div className="flex-1 overflow-y-auto p-2.5 space-y-4">
            {filteredSections.length === 0 ? (
              <div className="text-center py-8 text-slate-400">
                <Search className="h-8 w-8 mx-auto mb-2 opacity-40" />
                <p className="text-xs font-semibold">{t('No results found', 'کچھ نہیں ملا')}</p>
              </div>
            ) : (
              filteredSections.map((section) => (
                <div key={section.id}>
                  <h3 className="px-2 mb-1 text-[9px] font-extrabold text-slate-400 uppercase tracking-widest">
                    {section.title}
                  </h3>
                  <ul className="space-y-0.5">
                    {section.items.map(item => {
                      const Icon = item.icon;
                      const isActive = activeTab === item.id;
                      return (
                        <li key={item.id}>
                          <button
                            onClick={() => handleTabChange(item.id as SettingsView)}
                            className={`w-full group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                              isActive
                                ? ((item as any).isDanger
                                    ? 'bg-red-50 text-red-700 border border-red-200 shadow-xs'
                                    : 'bg-orange-50 text-orange-800 border border-orange-200 shadow-xs')
                                : ((item as any).isDanger
                                    ? 'text-slate-500 hover:bg-red-50 hover:text-red-600 border border-transparent'
                                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-transparent')
                            }`}
                          >
                            <Icon className={`h-4 w-4 shrink-0 transition-colors ${
                              isActive ? ((item as any).isDanger ? 'text-red-500' : 'text-orange-600') : 'text-slate-400 group-hover:text-slate-600'
                            }`} />
                            <span className="flex-1 text-left truncate">{item.label}</span>
                            {(item as any).biometric && (
                              <Fingerprint className={`h-3.5 w-3.5 shrink-0 ${isActive ? 'opacity-60' : 'opacity-30'}`} />
                            )}
                            {isActive && <ChevronRight className="h-3.5 w-3.5 shrink-0 opacity-40" />}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))
            )}
          </div>

          {/* Sidebar footer — version badge */}
          <div className="p-3 border-t border-slate-100">
            <div className="flex items-center gap-2 px-2 py-2 rounded-lg bg-slate-50">
              <div className="w-6 h-6 rounded-md bg-orange-600 flex items-center justify-center shrink-0">
                <Settings className="h-3.5 w-3.5 text-white" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-bold text-slate-700 leading-none">FuelPro Enterprise</p>
                <p className="text-[10px] text-slate-400 leading-none mt-0.5">v3.0 · {isLubeBusinessStation(activeStationId) ? 'LubeManager' : 'Fuel Station'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* ── MAIN CONTENT AREA ─────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar">
          <div className="max-w-4xl mx-auto p-4 lg:p-6 pb-24 h-full">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.18 }}
              >
                {renderContent()}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>

      {onNavigate && (
        <SetupNavigationFooter
          activeViewId={activeTab === 'price' ? 'setup_rates' : activeTab === 'accounts' ? 'setup_accounts' : activeTab === 'audit' ? 'setup_audit' : activeTab === 'margins' ? 'setup_margins' : `setup_${activeTab}`}
          onNavigate={onNavigate}
        />
      )}
    </div>
  );
}
