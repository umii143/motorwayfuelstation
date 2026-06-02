import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Settings,
  Shield,
  Palette,
  Truck,
  DollarSign,
  HelpCircle,
  RefreshCw,
  Phone,
  FileText,
  Save,
  Globe,
  Database,
  Trash2,
  Layers,
  Activity,
  Plus,
  X,
  ChevronRight,
  Sliders,
  AlertTriangle,
  Lock,
  Fuel
} from 'lucide-react';
import { GlobalSettings, Product, Nozzle, Pump, Tank, RateHistoryEntry, AuditTrailEntry } from '../../types';
import { db } from '../../data/db';

// Modular Child Wizards Imports
import RateWizard from './Settings/RateWizard';
import TankWizard from './Settings/TankWizard';
import NozzleWizard from './Settings/NozzleWizard';
import UnifiedAccountManager from './Settings/UnifiedAccountManager';
import SystemAuditTrail from './Settings/SystemAuditTrail';

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
  
  // Custom enhanced account manager props passed via App case mounting
  banks?: any;
  onUpdateBanks?: any;
  onUpdateProducts?: any;
  onUpdatePumps?: any;
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
  onUpdatePumps
}: SettingsProps) {
  const isUrdu = settings.language === 'ur';
  const t = (en: string, ur: string) => (isUrdu ? ur : en);

  // Unified outer page Tabs state
  const [activeTab, setActiveTab] = useState<'profile' | 'tariff' | 'tanks' | 'nozzles' | 'accounts' | 'audit'>('profile');

  // Business profile inputs
  const [stationName, setStationName] = useState(settings.stationName);
  const [stationUrduName, setStationUrduName] = useState(settings.stationUrduName);
  const [address, setAddress] = useState(settings.address);
  const [ntn, setNtn] = useState(settings.ntn);
  const [ownerContact, setOwnerContact] = useState(settings.ownerContact);

  // Security PIN Reset flow states
  const [showResetModal, setShowResetModal] = useState<boolean>(false);
  const [pinInput, setPinInput] = useState<string>('');
  const [pinError, setPinError] = useState<string>('');

  // Universal audit logging trigger within settings sub-modules
  const handleLogAudit = (category: string, action: string, details: string) => {
    const existing = db.getSettingsAuditTrail(activeStationId);
    const newEntry: AuditTrailEntry = {
      id: 'audit_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
      category,
      action,
      details,
      operator: 'Sajid Mahmood (Manager)'
    };
    db.saveSettingsAuditTrail(activeStationId, [newEntry, ...existing]);
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!stationName) return;

    onUpdateSettings({
      ...settings,
      stationName,
      stationUrduName,
      address,
      ntn,
      ownerContact
    });

    handleLogAudit('System', 'Update Profile', `Profile parameters modified: Name = ${stationName}, address = ${address}`);
    alert(t('Business profile settings saved!', 'کاروباری معلومات کامیابی سے محفوظ ہو گئیں!'));
  };

  const handleLanguageToggle = (lang: 'en' | 'ur' | 'ar' | 'es' | 'zh') => {
    onUpdateSettings({
      ...settings,
      language: lang
    });
    handleLogAudit('System', 'Toggle Language', `Language interface flipped to ${lang.toUpperCase()}`);
  };

  const handleThemeChange = (theme: 'light' | 'dark' | 'blue' | 'emerald' | 'orange') => {
    onUpdateSettings({
      ...settings,
      theme
    });
    handleLogAudit('System', 'Update Theme', `Theme visual environment adjusted to ${theme.toUpperCase()}`);
  };

  const handleCurrencyChange = (currency: string) => {
    onUpdateSettings({
      ...settings,
      currency
    });
    handleLogAudit('System', 'Update Currency', `Business default currency changed to ${currency}`);
  };

  // Safe Factory Reset PIN authentication check
  const handleExecuteFullReset = (e: React.FormEvent) => {
    e.preventDefault();
    if (pinInput !== '1234') {
      setPinError(t('Invalid diagnostic authentication PIN!', 'سیکیورٹی اکاؤنٹ پن غلط ہے!'));
      return;
    }

    // PIN is correct, execute database wipe
    db.resetToDefault();
    handleLogAudit('System', 'Factory Reset', 'Database wipe was authorized using master PIN and resetting to pristine empty states.');
    alert(t('System Database fully reset! Reloading...', 'ڈیٹا بیس کامیابی سے ری سیٹ کر دیا گیا ہے! پیج دوبارہ لوڈ ہو رہا ہے...'));
    window.location.reload();
  };

  return (
    <div className="space-y-6 pb-20 lg:pb-5">
      {/* PAGE HEADER */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-4">
        <div>
          <h2 className="font-sans text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <Settings className="h-6 w-6 text-orange-600" />
            <span>{t('Central Settings & Station Hardware', 'سیٹنگز اور اسٹیشن ہارڈویئر')}</span>
          </h2>
          <p className="font-sans text-xs text-slate-500 mt-1">
            {t(
              'Configure fuel storage tanks, establish nozzle mappings, record certified rate changes and adjust station profile variables.',
              'اسٹوریج ٹینک، نوزل میٹرز، پٹرول ڈیزل کے دفتری ریٹ اور بنیادی سیٹنگز یہاں سے تبدیل کریں۔'
            )}
          </p>
        </div>
      </div>

      {/* HORIZONTAL TABS NAVIGATION BAR */}
      <div className="flex flex-wrap items-center gap-1 border-b border-slate-200 pb-0.5 select-none">
        {[
          { id: 'profile', label: t('🔑 Central Profile', '🔑 دفتری معلومات') },
          { id: 'tariff', label: t('⛽ Pricing Manager', '⛽ فیول ریٹ لاگ') },
          { id: 'tanks', label: t('🛢️ Storage Tanks', '🛢️ اسٹوریج ٹینکس') },
          { id: 'nozzles', label: t('🔌 Nozzles Setup', '🔌 نوزل میٹرز') },
          { id: 'accounts', label: t('🏦 Ledger Accounts', '🏦 پے منٹ اکاؤنٹس') },
          { id: 'audit', label: t('🛡️ System Audit Logs', '🛡️ مرکزی آڈٹ لاگ') }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-3.5 py-2 font-sans text-xs font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === tab.id
                ? 'border-orange-600 text-orange-655 font-extrabold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ======================= TAB 1: STATION PROFILE ======================= */}
      {activeTab === 'profile' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 rounded-xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
            <form onSubmit={handleSaveProfile} className="space-y-4 font-sans text-xs text-slate-650">
              <h3 className="font-bold text-slate-800 uppercase tracking-wider border-b pb-2 text-[11px] flex items-center gap-1">
                <Database className="h-4 w-4 text-orange-600" />
                <span>{t('Station Legal Authority Registry:', 'پیٹرولیم اسٹیشن دفتری رجسٹر:')}</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-bold text-slate-550">{t('Commercial Trading Title (English):', 'تجارتی نام (English):')}</label>
                  <input
                    type="text"
                    required
                    value={stationName}
                    onChange={(e) => setStationName(e.target.value)}
                    className="w-full rounded border border-slate-205 p-2 bg-slate-50/50"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-550">{t('Commercial Trading Title (Urdu):', 'تجارتی نام (Urdu):')}</label>
                  <input
                    type="text"
                    required
                    value={stationUrduName}
                    onChange={(e) => setStationUrduName(e.target.value)}
                    className="w-full rounded border border-slate-205 p-2 bg-slate-50/50"
                  />
                </div>

                <div className="sm:col-span-2 space-y-1">
                  <label className="font-bold text-slate-550">{t('Authorized Mailing Address:', 'اسٹیشن کا پتہ / ایڈریس:')}</label>
                  <input
                    type="text"
                    required
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full rounded border border-slate-205 p-2 bg-slate-50/50"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-550">{t('Tax Registry NTN License / GST:', 'ٹیکس رجسٹریشن نمبر (Licenses / NTN):')}</label>
                  <input
                    type="text"
                    required
                    value={ntn}
                    onChange={(e) => setNtn(e.target.value)}
                    className="w-full rounded border border-slate-205 p-2 bg-slate-50/50"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-550">{t('Owner Emergency Cell Contact:', 'ہنگامی رابطہ نمبر (Owner Phone):')}</label>
                  <input
                    type="text"
                    required
                    value={ownerContact}
                    onChange={(e) => setOwnerContact(e.target.value)}
                    className="w-full rounded border border-slate-205 p-2 bg-slate-50/50"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2 border-t border-slate-100">
                <button
                  type="submit"
                  className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-lg flex items-center gap-1 cursor-pointer shadow-xs uppercase leading-none"
                >
                  <Save className="h-4 w-4" />
                  <span>{t('Save Profile Spec', 'پروفائل محفوظ کریں')}</span>
                </button>
              </div>
            </form>
          </div>

          <div className="space-y-6">
            {/* CENTRAL SYSTEM CUSTOMIZATION & APPEARANCE */}
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs space-y-5">
              <span className="font-sans font-bold text-slate-700 block text-[10px] uppercase tracking-widest flex items-center gap-1">
                <Sliders className="h-4 w-4 text-orange-600" />
                <span>{t('WORKSPACE APPEARANCE & CUSTOMIZATION', 'ایپ ترتیبات اور ظاہری شکل')}</span>
              </span>
              
              {/* 1. Language Sector dropdown select */}
              <div className="space-y-2">
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  {t('Interface Language:', 'سسٹم انٹرفیس زبان:')}
                </label>
                <select
                  value={settings.language || 'en'}
                  onChange={(e) => handleLanguageToggle(e.target.value as any)}
                  className="w-full text-xs font-bold rounded-lg border border-slate-200 p-2 bg-slate-50 cursor-pointer"
                >
                  <option value="en">English (US)</option>
                  <option value="ur">اردو (Urdu)</option>
                  <option value="ar">العربية (Arabic)</option>
                  <option value="es">Español (Spanish)</option>
                  <option value="zh">中文 (Chinese)</option>
                </select>
              </div>

              {/* 2. Theme Customizer select */}
              <div className="space-y-2">
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  {t('Environmental Color Theme:', 'ایپ کا رنگ / تھیم:')}
                </label>
                <select
                  value={settings.theme || 'light'}
                  onChange={(e) => handleThemeChange(e.target.value as any)}
                  className="w-full text-xs font-bold rounded-lg border border-slate-200 p-2 bg-slate-50 cursor-pointer"
                >
                  <option value="light">{t('Light Slate (Default)', 'روشن تھیم')}</option>
                  <option value="dark">{t('Cosmic Dark', 'تاریک نائٹ تھیم')}</option>
                  <option value="blue">{t('Sapphire Blue', 'نیلا کارپوریٹ تھیم')}</option>
                  <option value="emerald">{t('Emerald Green', 'سبز زمرد تھیم')}</option>
                  <option value="orange">{t('Vibrant Orange', 'نارنجی سن سیٹ تھیم')}</option>
                </select>
              </div>

              {/* 3. Base Currency Format select */}
              <div className="space-y-2">
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  {t('Core Business Currency:', 'کاروباری بنیادی کرنسی:')}
                </label>
                <select
                  value={settings.currency || 'PKR'}
                  onChange={(e) => handleCurrencyChange(e.target.value)}
                  className="w-full text-xs font-bold rounded-lg border border-slate-200 p-2 bg-slate-50 cursor-pointer"
                >
                  <option value="PKR">PKR (Rs.) - Pakistani Rupee</option>
                  <option value="USD">USD ($) - United States Dollar</option>
                  <option value="EUR">EUR (€) - Euro Zone</option>
                  <option value="GBP">GBP (£) - British Pound Sterling</option>
                  <option value="AED">AED (د.إ) - United Arab Emirates Dirham</option>
                  <option value="SAR">SAR (ر.س) - Saudi Arabian Riyal</option>
                </select>
              </div>
            </div>

            {/* SAFE SYSTEM HARD DELETION resetting DIAGNOSTICS */}
            <div className="rounded-xl border border-rose-200 bg-rose-50/10 p-5 shadow-xs space-y-3">
              <span className="font-sans font-bold text-rose-700 block text-[10px] uppercase tracking-widest flex items-center gap-1">
                <AlertTriangle className="h-4 w-4" />
                <span>{t('DANGER ZONE & FACTORY WIPE', 'سسٹم ڈیٹا بیس کلیئر کریں')}</span>
              </span>
              <p className="font-sans text-[11px] text-slate-500 leading-normal">
                {t(
                  'Permanent delete of all registered tanks calibrations, mapped nozzle gears, staff attendance archives, and supplier transactions logs.',
                  'ہنگامی ری سیٹ کرنے اور فیکٹری ڈیفالٹ حالت میں لانے کیلئے نیچے کلک کریں۔ تمام محفوظ کھاتے حذف ہو جائیں گے۔'
                )}
              </p>
              <button
                type="button"
                onClick={() => setShowResetModal(true)}
                className="w-full py-2 bg-red-650 bg-red-650 bg-red-605 bg-red-600 hover:bg-red-750 hover:bg-red-700 text-white font-sans text-xs font-extrabold rounded-lg flex items-center justify-center gap-1 shadow-xs cursor-pointer select-none uppercase"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                <span>{t('Execute Factory Reset', 'فیکٹری ری سیٹ کریں')}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================= TAB 2: PRICING MANAGER (WIZARDS) ======================= */}
      {activeTab === 'tariff' && (
        <RateWizard
          products={products}
          tanks={tanks}
          rateHistory={rateHistory}
          language={settings.language}
          onUpdateProductRate={onUpdateProductRate}
          onLogAudit={handleLogAudit}
          onUpdateProducts={onUpdateProducts}
        />
      )}

      {/* ======================= TAB 3: STORAGE TANKS CONFIG (WIZARDS) ======================= */}
      {activeTab === 'tanks' && (
        <TankWizard
          tanks={tanks}
          products={products}
          language={settings.language}
          onAddTank={onAddTank}
          onUpdateTank={onUpdateTank}
          onDeleteTank={onDeleteTank}
          onLogAudit={handleLogAudit}
        />
      )}

      {/* ======================= TAB 4: DISPENSER NOZZLES (WIZARDS) ======================= */}
      {activeTab === 'nozzles' && (
        <NozzleWizard
          nozzles={nozzles}
          pumps={pumps}
          tanks={tanks}
          products={products}
          language={settings.language}
          onAddNozzle={onAddNozzle}
          onUpdateNozzle={onUpdateNozzle}
          onDeleteNozzle={onDeleteNozzle}
          onLogAudit={handleLogAudit}
        />
      )}

      {/* ======================= TAB 5: UNIFIED ACCOUNTS MANAGER ======================= */}
      {activeTab === 'accounts' && (
        <UnifiedAccountManager
          products={products}
          banks={banks}
          pumps={pumps}
          language={settings.language}
          onUpdateProducts={onUpdateProducts}
          onUpdateBanks={onUpdateBanks}
          onUpdatePumps={onUpdatePumps}
          onLogAudit={handleLogAudit}
        />
      )}

      {/* ======================= TAB 6: AUDIT TIME TRAIL GRID ======================= */}
      {activeTab === 'audit' && (
        <SystemAuditTrail language={settings.language} stationId={activeStationId} />
      )}

      {/* ======================= EMERGENCY FACTORY RESET PIN VERIFICATION MODAL ======================= */}
      <AnimatePresence>
        {showResetModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs select-none"
          >
            <motion.div
              initial={{ scale: 0.95, y: 15, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 15, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 350 }}
              className="bg-white border border-slate-200 rounded-xl w-full max-w-sm overflow-hidden p-5 space-y-4 shadow-xl font-sans text-xs text-slate-600"
            >
              <div className="flex justify-between items-center border-b pb-2.5">
                <strong className="text-red-600 text-[11px] uppercase tracking-wider flex items-center gap-1">
                  <Lock className="h-4 w-4" />
                  <span>{t('Security pin Authentication', 'سیکیورٹی اکاؤنٹ آتھنٹیکیشن')}</span>
                </strong>
                <button onClick={() => { setShowResetModal(false); setPinInput(''); setPinError(''); }} className="text-slate-400 font-bold hover:text-slate-650 cursor-pointer">×</button>
              </div>

              <form onSubmit={handleExecuteFullReset} className="space-y-3">
                <p className="leading-relaxed text-slate-500">
                  {t(
                    'This operation deletes all database state tables. Type diagnostics master PIN code "1234" to execute:',
                    'اس سرگرمی سے کھاتے مٹ جائیں گے، لامتناہی ری سیٹ تصدیق کرنے کیلئے ڈیفالٹ لاگ پن کوڈ "1234" درج کریں:'
                  )}
                </p>

                <div>
                  <label className="block text-[11px] font-bold text-slate-650 mb-1">{t('Enter PIN Passcode:', 'تصدیقی پاس کوڈپن (PIN):')}</label>
                  <input
                    type="password"
                    required
                    placeholder="e.g. 1234"
                    value={pinInput}
                    onChange={(e) => { setPinInput(e.target.value); setPinError(''); }}
                    className="w-full bg-slate-50 border border-slate-205 rounded p-2 text-center font-mono font-bold tracking-widest text-lg outline-hidden focus:border-red-500"
                  />
                </div>

                {pinError && <span className="block text-[10px] text-red-500 font-sans font-bold text-center">{pinError}</span>}

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => { setShowResetModal(false); setPinInput(''); setPinError(''); }}
                    className="bg-slate-100 text-slate-600 px-3 py-1 text-xs font-bold uppercase rounded hover:bg-slate-200 cursor-pointer"
                  >
                    {t('Cancel', 'کینسل')}
                  </button>
                  
                  <button
                    type="submit"
                    className="bg-red-655 bg-red-600 hover:bg-red-700 text-white px-4 py-1.5 text-xs font-extrabold uppercase rounded shadow-xs cursor-pointer"
                  >
                    {t('DESTRUCT ALL DATA AND RE-INITIALIZE', 'ڈیٹا ڈیلیٹ کریں')}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
