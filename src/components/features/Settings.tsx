import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Settings, Shield, Palette, Truck, DollarSign, HelpCircle, RefreshCw, Phone,
  FileText, Save, Globe, Database, Trash2, Layers, Activity, Plus, X,
  ChevronRight, Sliders, AlertTriangle, Lock, Fuel, User, Building, Users,
  Key, Package, Tag, Percent, Landmark, Wallet, Siren, Clock, FileSearch,
  Bell, Link as LinkIcon, DownloadCloud, Wrench, Menu
} from 'lucide-react';
import { GlobalSettings, Product, Nozzle, Pump, Tank, RateHistoryEntry, AuditTrailEntry } from '../../types';
import { db } from '../../data/db';
import { useStation } from '../../contexts/StationContext';
import { useNativeAuth } from '../../contexts/NativeAuthContext';

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
import UsersAndRoles from './Settings/UsersAndRoles';
import TreasurySettings from './Settings/TreasurySettings';
import { SetupBanner } from './ConfigurationHub/SetupBanner';
import { SetupNavigationFooter } from './ConfigurationHub/SetupNavigationFooter';

export type SettingsView = 
  | 'profile' | 'station' | 'users' | 'security' | 'treasury' 
  | 'shift' | 'meter' | 'price' | 'backup' | 'integrity' 
  | 'notifications' | 'integrations' | 'preferences' | 'advanced' 
  | 'factory_reset' | 'tanks' | 'products' | 'nozzles' | 'margins' 
  | 'accounts' | 'audit' | 'license' | 'emergency';

interface SettingsProps {
  activeStationId: string;
  settings: GlobalSettings;
  products: Product[];
  pumps: Pump[];
  nozzles: Nozzle[];
  onUpdateSettings: (settings: GlobalSettings) => void;
  onUpdateProductRate: (
    id: string,
    newRate: number,
    reason?: string,
    changedBy?: string,
    dateStr?: string
  ) => void;
  tanks: Tank[];
  onAddTank: (newTank: Tank) => void;
  onUpdateTank: (updatedTank: Tank) => void;
  onDeleteTank: (id: string) => void;
  onAddNozzle: (newNozzle: Nozzle) => void;
  onUpdateNozzle: (updatedNozzle: Nozzle) => void;
  onDeleteNozzle: (id: string) => void;
  rateHistory: RateHistoryEntry[];
  
  banks?: any;
  onUpdateBanks?: any;
  onUpdateProducts?: any;
  onUpdatePumps?: any;
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
  const isUrdu = settings.language === 'ur';
  const t = (en: string, ur: string) => (isUrdu ? ur : en);

  const isLube = activeStationId === 'st_lube';

  const [activeTab, setActiveTab] = useState<SettingsView>((initialTab as SettingsView) || 'profile');
  
  // Default to showing the sidebar on mobile if they just navigated to general settings
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(() => {
    return initialTab === 'profile' || !initialTab;
  });

  React.useEffect(() => {
    if (initialTab) {
      // Map legacy tariff to price for compatibility
      const tabToSet = initialTab === 'tariff' ? 'price' : (initialTab as SettingsView);
      setActiveTab(tabToSet);
    }
  }, [initialTab]);

  // Universal audit logging trigger within settings sub-modules
  const handleLogAudit = (category: string, action: string, details: string) => {
    const existing = db.getSettingsAuditTrail(activeStationId);
    const newEntry: AuditTrailEntry = {
      id: 'audit_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
      category,
      action,
      details,
      user: 'Owner', // TODO: Fetch current user
      role: 'Owner',
      branch: activeStationId
    };
    db.saveSettingsAuditTrail(activeStationId, [newEntry, ...existing]);
  };

  const SIDEBAR_SECTIONS = [
    {
      title: t('Enterprise Setup', 'انٹرپرائز سیٹ اپ'),
      items: [
        { id: 'profile', label: t('Profile Center', 'پروفائل سینٹر'), icon: User },
        { id: 'station', label: t('Station Identity', 'اسٹیشن کی شناخت'), icon: Building },
        { id: 'users', label: t('Users & Roles', 'یوزرز اور کردار'), icon: Users },
        { id: 'license', label: t('License & Subscription', 'لائسنس اور سبسکرپشن'), icon: Key },
      ]
    },
    {
      title: t('Hardware & Inventory', 'ہارڈویئر اور انوینٹری'),
      items: [
        { id: 'tanks', label: t('Tanks & Storage', 'ٹینک اور اسٹوریج'), icon: Database },
        { id: 'nozzles', label: t('Dispenser Nozzles', 'ڈسپینسر نوزلز'), icon: Fuel },
        { id: 'meter', label: t('Meter Management', 'میٹر مینجمنٹ'), icon: Activity },
        { id: 'products', label: t('Products', 'مصنوعات'), icon: Package },
      ]
    },
    {
      title: t('Financial & Pricing', 'مالیاتی اور قیمتوں کا تعین'),
      items: [
        { id: 'price', label: t('Price Settings', 'قیمت کی ترتیبات'), icon: Tag },
        { id: 'margins', label: t('Dealer Margin', 'ڈیلر مارجن'), icon: Percent },
        { id: 'treasury', label: t('Treasury Settings', 'ٹریژری سیٹنگز'), icon: Landmark },
        { id: 'accounts', label: t('Banks & Wallets', 'بینک اور کیش'), icon: Wallet },
      ]
    },
    {
      title: t('Security & Control', 'سیکیورٹی اور کنٹرول'),
      items: [
        { id: 'security', label: t('Security Center', 'سیکیورٹی سینٹر'), icon: Shield },
        { id: 'emergency', label: t('Emergency Access', 'ہنگامی رسائی'), icon: Siren },
        { id: 'shift', label: t('Shift Settings', 'شفٹ سیٹنگز'), icon: Clock },
        { id: 'integrity', label: t('Data Integrity', 'ڈیٹا کی درستگی'), icon: Activity },
        { id: 'audit', label: t('Settings Audit Center', 'آڈٹ سینٹر'), icon: FileSearch },
      ]
    },
    {
      title: t('System Administration', 'سسٹم ایڈمنسٹریشن'),
      items: [
        { id: 'preferences', label: t('System Preferences', 'سسٹم کی ترجیحات'), icon: Sliders },
        { id: 'notifications', label: t('Notifications', 'اطلاعات'), icon: Bell },
        { id: 'integrations', label: t('Integrations', 'انضمام'), icon: LinkIcon },
        { id: 'backup', label: t('Backup & Recovery', 'بیک اپ اور ریکوری'), icon: DownloadCloud },
        { id: 'advanced', label: t('Advanced Tools', 'ایڈوانسڈ ٹولز'), icon: Wrench },
        { id: 'factory_reset', label: t('Factory Reset', 'فیکٹری ری سیٹ'), icon: AlertTriangle, isDanger: true },
      ]
    }
  ];

  const handleTabChange = async (id: SettingsView) => {
    if (id === 'factory_reset' || id === 'meter' || id === 'security' || id === 'users') {
      const auth = await requireBiometric(`Access ${id}`);
      if (!auth) return;
    }
    setActiveTab(id);
    setIsMobileSidebarOpen(false);
  };

  const renderContent = () => {
    switch (activeTab) {
      // PRE-EXISTING WIZARDS
      case 'products':
        return <ProductWizard products={products} language={settings.language} onUpdateProducts={onUpdateProducts} onLogAudit={handleLogAudit} />;
      case 'price':
        return <RateWizard products={products} tanks={tanks} rateHistory={rateHistory} language={settings.language} settings={settings} onUpdateProductRate={onUpdateProductRate} onLogAudit={handleLogAudit} onUpdateProducts={onUpdateProducts} />;
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
      
      // NEW MODULES
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
      case 'users':
        return <UsersAndRoles settings={settings} />;
      case 'treasury':
        return <TreasurySettings settings={settings} />;
      case 'emergency':
        return <div className="p-12 text-center text-slate-500">Emergency Access module is configured via Security Center.</div>;
      
      // NEW PLACEHOLDERS TO BE IMPLEMENTED
      default:
        return (
          <div className="flex flex-col items-center justify-center h-full text-slate-400 p-12 text-center">
            <Settings className="h-16 w-16 mb-4 text-slate-200" />
            <h2 className="text-xl font-bold text-slate-700 mb-2">Module Under Construction</h2>
            <p className="max-w-md">The {activeTab} module is currently being built as part of the V3.0 Enterprise Command Center upgrade.</p>
          </div>
        );
    }
  };

  return (
    <div className="flex flex-col h-full min-h-[calc(100dvh-120px)] overflow-hidden rounded-2xl border border-slate-200 shadow-sm bg-white">
      {/* HEADER */}
      <div className="flex items-center justify-between border-b border-slate-200 bg-white p-4 shadow-xs shrink-0">
        <div className="flex items-center gap-3">
          <button 
            className="lg:hidden p-2 -ml-2 rounded-lg text-slate-500 hover:bg-slate-100"
            onClick={() => setIsMobileSidebarOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </button>
          <div>
            <h2 className="font-sans text-xl sm:text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
              <Settings className="h-6 w-6 text-orange-600" />
              <span>{t('Enterprise Command Center', 'انٹرپرائز کمانڈ سینٹر')}</span>
            </h2>
            <p className="font-sans text-xs text-slate-500 mt-0.5">
              {t('Secure governance, hardware setup, and business configuration.', 'سیکیورٹی، ہارڈویئر سیٹ اپ اور کاروباری ترتیبات۔')}
            </p>
          </div>
        </div>
      </div>

      <SetupBanner activeViewId={activeTab === 'price' ? 'setup_rates' : activeTab === 'accounts' ? 'setup_accounts' : activeTab === 'audit' ? 'setup_audit' : activeTab === 'margins' ? 'setup_margins' : `setup_${activeTab}`} />

      <div className="flex flex-1 overflow-hidden bg-slate-50 relative">
        {/* SIDEBAR NAVIGATION */}
        <div className={`
          absolute lg:static inset-y-0 left-0 z-40 w-72 bg-white border-r border-slate-200 flex flex-col 
          transform transition-transform duration-300 ease-in-out
          ${isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}>
          <div className="flex items-center justify-between p-4 border-b border-slate-100 lg:hidden">
            <span className="font-bold text-slate-700 text-sm uppercase">Menu</span>
            <button onClick={() => setIsMobileSidebarOpen(false)} className="p-1 rounded-lg hover:bg-slate-100 text-slate-500">
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-6">
            {SIDEBAR_SECTIONS.map((section, idx) => (
              <div key={idx}>
                <h3 className="px-3 mb-2 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">
                  {section.title}
                </h3>
                <ul className="space-y-0.5">
                  {section.items.map(item => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id;
                    const isDanger = item.isDanger;
                    return (
                      <li key={item.id}>
                        <button
                          onClick={() => handleTabChange(item.id as SettingsView)}
                          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-bold transition-all cursor-pointer ${
                            isActive 
                              ? (isDanger ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-orange-50 text-orange-700 border border-orange-200 shadow-xs')
                              : (isDanger ? 'text-slate-600 hover:bg-red-50/50 hover:text-red-600' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900')
                          }`}
                        >
                          <Icon className={`h-4 w-4 ${isActive ? (isDanger ? 'text-red-600' : 'text-orange-600') : 'text-slate-400'}`} />
                          <span className="flex-1 text-left">{item.label}</span>
                          {isActive && <ChevronRight className="h-3 w-3 opacity-50" />}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
          <div className="p-4 border-t border-slate-200 bg-slate-50 text-center text-xs font-bold text-slate-400 uppercase tracking-wider">
            Powered by Umar Ali ⚡
          </div>
        </div>

        {/* MOBILE OVERLAY */}
        {isMobileSidebarOpen && (
          <div 
            className="absolute inset-0 bg-slate-900/20 backdrop-blur-xs z-30 lg:hidden"
            onClick={() => setIsMobileSidebarOpen(false)}
          />
        )}

        {/* MAIN CONTENT AREA */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 lg:p-6 pb-24">
          <div className="max-w-6xl mx-auto h-full">
            {renderContent()}
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
