/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  LayoutDashboard,
  RefreshCw,
  Users,
  Factory,
  BookOpen,
  Landmark,
  Smartphone,
  Fuel,
  TrendingDown,
  FileBarChart,
  Settings,
  Users2,
  Menu,
  X,
  Languages,
  UserCircle,
  Shield,
  LogOut,
  ChevronDown,
  Plus,
  Trash2,
  Edit,
  Building,
  DollarSign,
  Truck,
  ArrowRightLeft,
  Wrench,
  ShieldAlert,
  Gift,
  LineChart,
  BarChart3,
  Network,
  Camera,
  Link,
  Tag,
  CreditCard,
  Sun,
  Moon,
  Bell,
  HelpCircle,
  Search
} from 'lucide-react';
import { GlobalSettings, Station } from '../../types';
import { t as translate } from '../../lib/translations';
import NavigationBrand from './NavigationBrand';
import HelpGuideModal from '../ui/HelpGuideModal';

interface NavigationProps {
  activeView: string;
  onViewChange: (view: string) => void;
  settings: GlobalSettings;
  onSettingsUpdate: (settings: GlobalSettings) => void;
  user?: any;
  onLogout?: () => void;
  stations?: Station[];
  activeStationId?: string;
  onSwitchStation?: (id: string) => void;
  onAddStation?: (station: Station) => void;
  onEditStation?: (station: Station) => void;
  onDeleteStation?: (stationId: string) => void;
}

export default function Navigation({
  activeView,
  onViewChange,
  settings,
  onSettingsUpdate,
  user,
  onLogout,
  stations = [],
  activeStationId = 'st_default',
  onSwitchStation,
  onAddStation,
  onEditStation,
  onDeleteStation
}: NavigationProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [stationDropdownOpen, setStationDropdownOpen] = useState(false);
  
  // Modal controllers
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [stationToEdit, setStationToEdit] = useState<Station | null>(null);

  // Form states
  const [formName, setFormName] = useState('');
  const [formUrduName, setFormUrduName] = useState('');
  const [formAddress, setFormAddress] = useState('');
  const [formNtn, setFormNtn] = useState('');
  const [formContact, setFormContact] = useState('');

  const isUrdu = settings.language === 'ur';

  // Translates helper
  const t = (en: string, ur: string) => translate(en, ur, settings);

  const isLube = activeStationId === 'st_lube';

  const menuItems = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard', urdu: 'ڈیش بورڈ' },
    { id: isLube ? 'lube_pos' : 'shift_wizard', icon: RefreshCw, label: isLube ? 'Lube POS Terminal' : 'Shift Wizard', urdu: isLube ? 'لیوب پی او ایس' : 'شفٹ وزرڈ' },
    { id: 'price_management', icon: DollarSign, label: 'Price Management', urdu: 'قیمتیں اور نرخ' },
    { id: 'ledger', icon: BookOpen, label: 'Accounts & Billing', urdu: 'کھاتہ اور بلنگ' },
    { id: 'loyalty', icon: Gift, label: 'Loyalty & Rewards', urdu: 'لائلٹی پروگرام' },
    { id: 'customers', icon: Users, label: 'Customers Khata', urdu: 'گاہکوں کا کھاتہ' },
    { id: 'suppliers', icon: Factory, label: isLube ? 'Suppliers' : 'Suppliers Depot', urdu: isLube ? 'سپلائرز' : 'سپلائرز ڈپو' },
    { id: 'fleet', icon: Truck, label: 'Fleet Accounts', urdu: 'فلیٹ منیجمنٹ' },
    { id: 'tanker_delivery', icon: ArrowRightLeft, label: isLube ? 'Supplier Deliveries' : 'Tankers & Delivery', urdu: isLube ? 'سپلائر ڈیلیوری' : 'ٹینکر شیڈول' },
    { id: 'inventory', icon: isLube ? Wrench : Fuel, label: isLube ? 'Product & Parts Stock' : 'Fuel Stock', urdu: isLube ? 'پروڈکٹ اسٹاک' : 'فیول اسٹاک' },
    { id: 'loss_prevention', icon: ShieldAlert, label: 'Loss Prevention', urdu: 'نقصان کی روک تھام' },
    { id: 'maintenance', icon: Wrench, label: 'Maintenance & Assets', urdu: 'مرمت' },
    { id: 'bank_cash', icon: Landmark, label: 'Bank Cash', urdu: 'بینک کیش' },
    { id: 'digital_cash', icon: Smartphone, label: 'Digital Cash', urdu: 'ڈیجیٹل کیش' },
    { id: 'discounts', icon: Tag, label: 'Discounts', urdu: 'ڈسکاؤنٹس' },
    { id: 'expenses', icon: TrendingDown, label: 'Expenses', urdu: 'اخراجات' },
    { id: 'staff', icon: Users2, label: 'Staff & Payroll', urdu: 'اسٹاف اور تنخواہ' },
    { id: 'bi_analytics', icon: LineChart, label: 'BI Analytics', urdu: 'بی آئی اینالٹکس' },
    { id: 'demand_forecast', icon: BarChart3, label: 'Demand Forecast', urdu: 'ڈیمانڈ' },
    { id: 'erp_integration', icon: Link, label: 'ERP Connect', urdu: 'ای آر پی کنیکٹ' },
    { id: 'cctv', icon: Camera, label: 'CCTV Security', urdu: 'سی سی ٹی وی' },
    { id: 'api_gateway', icon: Network, label: 'API Gateway', urdu: 'اے پی آئی گیٹ وے' },
    { id: 'reports', icon: FileBarChart, label: 'Advanced Reports (104)', urdu: 'ایڈوانسڈ رپورٹس' },
    { id: 'settings', icon: Settings, label: 'Settings', urdu: 'ترتیبات' },
    { id: 'security_hub', icon: Shield, label: 'Security & Roles', urdu: 'سیکیورٹی ہب' },
    { id: 'subscription_hub', icon: CreditCard, label: 'Subscription & Billing', urdu: 'بلنگ اور پلان' }
  ];

  const toggleLanguage = () => {
    const languages: ('en' | 'ur' | 'ar' | 'es' | 'zh')[] = ['en', 'ur', 'ar', 'es', 'zh'];
    const currentIndex = languages.indexOf(settings.language || 'en');
    const nextIndex = (currentIndex + 1) % languages.length;
    const newLang = languages[nextIndex];
    const updated = { ...settings, language: newLang };
    onSettingsUpdate(updated);
  };

  const [isHelpOpen, setIsHelpOpen] = useState(false);

  const handleItemClick = (id: string) => {
    onViewChange(id);
    setMobileMenuOpen(false);
  };

  const toggleTheme = () => {
    const newTheme = settings.theme === 'dark' ? 'light' : 'dark';
    onSettingsUpdate({ ...settings, theme: newTheme });
  };

  // Open add Modal
  const openAddModal = () => {
    setFormName('');
    setFormUrduName('');
    setFormAddress('');
    setFormNtn('');
    setFormContact('');
    setShowAddModal(true);
    setStationDropdownOpen(false);
  };

  const handleCloseAddModal = () => {
    setShowAddModal(false);
  };

  const handleSaveNewStation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    const newStation: Station = {
      id: `st_${Date.now()}`,
      name: formName.trim(),
      urduName: formUrduName.trim() || formName.trim(),
      address: formAddress.trim(),
      ntn: formNtn.trim(),
      ownerContact: formContact.trim()
    };

    if (onAddStation) {
      onAddStation(newStation);
    }
    setShowAddModal(false);
  };

  // Open edit Modal
  const openEditModal = (station: Station, e: React.MouseEvent) => {
    e.stopPropagation(); // prevent switching station when clicking edit button
    setStationToEdit(station);
    setFormName(station.name);
    setFormUrduName(station.urduName);
    setFormAddress(station.address);
    setFormNtn(station.ntn);
    setFormContact(station.ownerContact);
    setShowEditModal(true);
    setStationDropdownOpen(false);
  };

  const handleCloseEditModal = () => {
    setShowEditModal(false);
    setStationToEdit(null);
  };

  const handleSaveEditStation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!stationToEdit || !formName.trim()) return;

    const updated: Station = {
      ...stationToEdit,
      name: formName.trim(),
      urduName: formUrduName.trim() || formName.trim(),
      address: formAddress.trim(),
      ntn: formNtn.trim(),
      ownerContact: formContact.trim()
    };

    if (onEditStation) {
      onEditStation(updated);
    }
    setShowEditModal(false);
    setStationToEdit(null);
  };

  // Handle station switch
  const handlePerformSwitch = (stationId: string) => {
    if (onSwitchStation) {
      onSwitchStation(stationId);
    }
    setStationDropdownOpen(false);
  };

  // Handle station delete
  const handlePerformDelete = (stationId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // prevent switching station when clicking delete button
    if (onDeleteStation) {
      onDeleteStation(stationId);
    }
  };

  return (
    <>
      {/* HEADER BAR */}
      <header className="sticky top-0 z-50 flex items-center justify-between border-b border-border glass px-4 py-3 shadow-md transition-all duration-300">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="rounded-lg p-1.5 text-slate-600 hover:bg-slate-100 lg:hidden font-medium cursor-pointer"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
          
          <div className="flex items-center gap-2">
            <div className={`flex h-10 w-10 items-center justify-center rounded-xl font-bold text-white shadow-md transition-all duration-300 ${
              isLube ? 'bg-blue-600 shadow-blue-500/20' : 'bg-orange-600 shadow-orange-500/20'
            }`}>
              FP
            </div>
            
            {/* STATIONS SWITCHER DROPDOWN */}
            <div className="relative">
              <button
                onClick={() => setStationDropdownOpen(!stationDropdownOpen)}
                className="group flex items-center gap-2 rounded-lg px-2.5 py-1 text-left transition-all hover:bg-slate-50 cursor-pointer focus:outline-hidden"
              >
                <div>
                  <div className="flex items-center gap-1.5">
                    <h1 className="font-sans text-sm md:text-base lg:text-lg font-bold tracking-tight text-slate-900 leading-none group-hover:text-orange-600 transition-colors max-w-[160px] md:max-w-[280px] truncate">
                      {t(settings.stationName, settings.stationUrduName)}
                    </h1>
                    <ChevronDown className="h-4 w-4 text-slate-400 group-hover:text-orange-600 transition-colors shrink-0" />
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="inline-flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span className="font-mono text-[9px] md:text-[10px] text-slate-400">
                      {t('Station Isolation Mode Active', 'مستقل اسٹیشن ڈیٹا سیکیورٹی')}
                    </span>
                  </div>
                </div>
              </button>

              {/* DROPDOWN CARD */}
              {stationDropdownOpen && (
                <div className="absolute left-0 mt-2 w-72 md:w-80 rounded-xl border border-border glass p-2 shadow-2xl ring-1 ring-slate-900/5 focus:outline-hidden z-20 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="px-3 py-1.5 mb-1.5 border-b border-slate-100">
                    <span className="font-sans text-xs font-bold text-slate-500 tracking-wider uppercase">
                      {t('Switch ERP Station', 'دوسرے اسٹیشن پر جائیں')}
                    </span>
                  </div>
                  
                  <div className="max-h-72 overflow-y-auto space-y-1">
                    {stations.map((st) => {
                      const isActive = st.id === activeStationId;
                      return (
                        <div
                          key={st.id}
                          onClick={() => handlePerformSwitch(st.id)}
                          className={`group flex items-center justify-between rounded-lg p-2.5 text-left cursor-pointer transition-colors ${
                            isActive
                              ? 'bg-orange-50/80 border border-orange-200'
                              : 'hover:bg-slate-50 border border-transparent'
                          }`}
                        >
                          <div className="flex items-start gap-2.5 max-w-[80%]">
                            <Building className={`h-4 w-4 mt-0.5 shrink-0 ${isActive ? 'text-orange-600' : 'text-slate-400'}`} />
                            <div className="truncate">
                              <p className={`font-sans text-sm font-semibold truncate ${isActive ? 'text-orange-950' : 'text-slate-900'}`}>
                                {t(st.name, st.urduName)}
                              </p>
                              {st.address && (
                                <p className="font-sans text-[11px] text-slate-400 truncate mt-0.5">
                                  {st.address}
                                </p>
                              )}
                              {st.ntn && (
                                <p className="font-mono text-[9px] text-slate-500 font-bold mt-0.5">
                                  NTN: {st.ntn}
                                </p>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={(e) => openEditModal(st, e)}
                              className="p-1 text-slate-400 hover:text-orange-600 hover:bg-slate-100 rounded-md transition-colors"
                              title={t('Edit Station Info', 'ترمیم کریں')}
                            >
                              <Edit className="h-3.5 w-3.5" />
                            </button>
                            {st.id !== 'st_default' && (
                              <button
                                onClick={(e) => handlePerformDelete(st.id, e)}
                                className="p-1 text-slate-400 hover:text-red-650 hover:bg-slate-100 rounded-md transition-colors text-red-500"
                                title={t('Delete Station Data', 'حذف کریں')}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="mt-2 pt-2 border-t border-slate-100">
                    <button
                      onClick={openAddModal}
                      className={`flex w-full items-center justify-center gap-2 rounded-lg px-3 py-2 text-center font-sans text-xs font-bold text-white transition-colors shadow-xs ${
                        isLube ? 'bg-blue-600 hover:bg-blue-700' : 'bg-orange-600 hover:bg-orange-700'
                      }`}
                    >
                      <Plus className="h-4 w-4" />
                      <span>{t('Register New Station', 'نیا اسٹیشن برانچ شامل کریں')}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* SEGMENTED SLIDER FOR THE TWO INDEPENDENT PRIMARY BUSINESSES */}
            <div className="hidden sm:flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200/80 shrink-0 select-none ml-2">
              <button
                type="button"
                onClick={() => handlePerformSwitch('st_default')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeStationId === 'st_default'
                    ? 'bg-orange-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 font-semibold'
                }`}
              >
                <Fuel className="h-3.5 w-3.5" />
                <span>{t('Fuel Station', 'فیول اسٹیشن')}</span>
              </button>
              <button
                type="button"
                onClick={() => handlePerformSwitch('st_lube')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeStationId === 'st_lube'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 font-semibold'
                }`}
              >
                <Wrench className="h-3.5 w-3.5" />
                <span>{t('Lube Business', 'لیوب بزنس')}</span>
              </button>
            </div>

          </div>
        </div>

        {/* CONTROLS */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <button
            onClick={toggleLanguage}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2 sm:px-3 py-1.5 font-sans text-[10px] sm:text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50 transition-colors shrink-0"
          >
            <Languages className="h-4 w-4 text-orange-600" />
            <span className="hidden sm:inline">
              {settings.language === 'ur' ? 'اردو (Urdu)' :
               settings.language === 'ar' ? 'العربية' :
               settings.language === 'es' ? 'Español' :
               settings.language === 'zh' ? '中文' : 'English'}
            </span>
            <span className="inline sm:hidden">
              {settings.language === 'ur' ? 'اردو' :
               settings.language === 'ar' ? 'العربية' :
               settings.language === 'es' ? 'ES' :
               settings.language === 'zh' ? '中文' : 'EN'}
            </span>
          </button>
          
          <button
            onClick={toggleTheme}
            className="rounded-lg border border-slate-200 bg-white p-1.5 sm:p-2 text-slate-500 hover:bg-slate-50 hover:text-orange-600 transition-colors cursor-pointer shadow-xs"
            title={settings.theme === 'dark' ? t('Switch to Light Mode', 'لائٹ موڈ') : t('Switch to Dark Mode', 'ڈارک موڈ')}
          >
            {settings.theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>

          <button
            className="relative rounded-lg border border-slate-200 bg-white p-1.5 sm:p-2 text-slate-500 hover:bg-slate-50 hover:text-orange-600 transition-colors cursor-pointer shadow-xs"
            title={t('Notifications', 'اطلاعات')}
          >
            <Bell className="h-4 w-4" />
            <span className="absolute -top-1 -right-1 flex h-3 w-3 items-center justify-center rounded-full bg-red-500 text-[8px] font-bold text-white">
              3
            </span>
          </button>

          <button
            onClick={() => setIsHelpOpen(true)}
            className="rounded-lg border border-slate-200 bg-white p-1.5 sm:p-2 text-slate-500 hover:bg-slate-50 hover:text-orange-600 transition-colors cursor-pointer shadow-xs"
            title={t('Help Guide', 'یوزر گائیڈ')}
          >
            <HelpCircle className="h-4 w-4" />
          </button>
          
          {user ? (
            <div className="hidden items-center gap-2 border-l border-slate-200 pl-3 md:flex">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-50 text-orange-600 font-mono font-bold text-xs font-medium">
                {user.role?.substring(0, 2).toUpperCase()}
              </div>
              <div className="flex flex-col text-left">
                <span className="font-sans text-xs font-bold text-slate-800 leading-none truncate max-w-[120px]" title={user.email}>
                  {user.email.split('@')[0]}
                </span>
                <span className="font-mono text-[9px] text-orange-600 font-bold leading-none mt-1">
                  {user.role?.toUpperCase()}
                </span>
              </div>
              {onLogout && (
                <button
                  onClick={onLogout}
                  title={t("Log Out", "لاگ آؤٹ")}
                  className="ml-2 p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-red-500 transition-colors cursor-pointer"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              )}
            </div>
          ) : (
            <div className="hidden items-center gap-2 border-l border-slate-200 pl-3 md:flex">
              <UserCircle className="h-8 w-8 text-slate-400" />
              <div className="flex flex-col text-left">
                <span className="font-sans text-xs font-bold text-slate-800 leading-none">
                  {t('Owner / Admin', 'مالک / ایڈمن')}
                </span>
                <span className="font-mono text-[10px] text-slate-400 leading-none mt-0.5">
                  {settings.ownerContact}
                </span>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* DESKTOP SIDEBAR */}
      <aside className="fixed bottom-0 top-[65px] left-0 z-40 hidden w-64 border-r border-border glass py-4 lg:block animate-fade-in shadow-[4px_0_24px_-12px_rgba(0,0,0,0.1)]">
        <div className="flex flex-col h-full justify-between">
          
          {/* PRIMARY SEGMENTED SWITCH IN SIDEBAR */}
          <div className="px-3 mb-4 shrink-0 select-none">
            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
              <button
                type="button"
                onClick={() => handlePerformSwitch('st_default')}
                className={`flex-1 flex items-center justify-center gap-1 rounded-lg py-1.5 px-1 text-center font-sans text-[11px] font-bold transition-all cursor-pointer ${
                  activeStationId === 'st_default'
                    ? 'bg-orange-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Fuel className="h-3.5 w-3.5 shrink-0" />
                <span>{t('Fuel Station', 'فیول')}</span>
              </button>
              <button
                type="button"
                onClick={() => handlePerformSwitch('st_lube')}
                className={`flex-1 flex items-center justify-center gap-1 rounded-lg py-1.5 px-1 text-center font-sans text-[11px] font-bold transition-all cursor-pointer ${
                  activeStationId === 'st_lube'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Wrench className="h-3.5 w-3.5 shrink-0" />
                <span>{t('Lube Biz', 'لیوب')}</span>
              </button>
            </div>
          </div>

          <nav className="space-y-1 px-3 flex-1 overflow-y-auto">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleItemClick(item.id)}
                  className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 font-sans text-sm font-medium transition-all cursor-pointer ${
                    isActive
                      ? isLube
                        ? 'bg-blue-50 text-blue-600 font-bold border-l-4 border-blue-600 shadow-xs'
                        : 'bg-orange-50 text-orange-600 font-bold border-l-4 border-orange-600 shadow-xs'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <Icon className={`h-5 w-5 ${isActive ? (isLube ? 'text-blue-600' : 'text-orange-600') : 'text-slate-400'}`} />
                  <span className="flex-1 text-left">{t(item.label, item.urdu)}</span>
                </button>
              );
            })}
          </nav>
          
          {onLogout && (
            <div className="p-3 border-t border-slate-100 bg-slate-50/50">
              <button
                onClick={onLogout}
                className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 font-sans text-xs font-bold text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors cursor-pointer"
              >
                <LogOut className="h-4 w-4 text-red-500" />
                <span>{t("Secure Sign Out", "لاگ آؤٹ اور لاگ آف کریں")}</span>
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* MOBILE POPUP DRAWER */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-45 bg-slate-900/40 backdrop-blur-xs lg:hidden">
          <div className="fixed bottom-0 top-[65px] left-0 z-50 w-64 border-r border-slate-200 bg-white py-4 shadow-xl flex flex-col justify-between h-[calc(100vh-65px)]">
            
            {/* MOBILE SEGMENTED SWITCH */}
            <div className="px-3 mb-4 shrink-0 select-none">
              <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
                <button
                  type="button"
                  onClick={() => handlePerformSwitch('st_default')}
                  className={`flex-1 flex items-center justify-center gap-1.5 rounded-lg py-1.5 px-1 text-center font-sans text-xs font-bold transition-all cursor-pointer ${
                    activeStationId === 'st_default'
                      ? 'bg-orange-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Fuel className="h-3.5 w-3.5 shrink-0" />
                  <span>{t('Fuel Station', 'فیول')}</span>
                </button>
                <button
                  type="button"
                  onClick={() => handlePerformSwitch('st_lube')}
                  className={`flex-1 flex items-center justify-center gap-1.5 rounded-lg py-1.5 px-1 text-center font-sans text-xs font-bold transition-all cursor-pointer ${
                    activeStationId === 'st_lube'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Wrench className="h-3.5 w-3.5 shrink-0" />
                  <span>{t('Lube Biz', 'لیوب')}</span>
                </button>
              </div>
            </div>

            <nav className="space-y-1 px-3 flex-1 overflow-y-auto">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeView === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleItemClick(item.id)}
                    className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 font-sans text-sm font-medium transition-all cursor-pointer ${
                      isActive
                        ? isLube
                          ? 'bg-blue-50 text-blue-600 font-bold border-l-4 border-blue-600'
                          : 'bg-orange-50 text-orange-600 font-bold border-l-4 border-orange-600'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    <Icon className={`h-5 w-5 ${isActive ? (isLube ? 'text-blue-600' : 'text-orange-600') : 'text-slate-400'}`} />
                    <span className="flex-1 text-left">{t(item.label, item.urdu)}</span>
                  </button>
                );
              })}
            </nav>
            {onLogout && (
              <div className="p-3 border-t border-slate-100 bg-slate-50">
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onLogout();
                  }}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-bold text-red-600 hover:bg-red-50 cursor-pointer"
                >
                  <LogOut className="h-5 w-5 text-red-500" />
                  <span>{t("Sign Out", "لاگ آؤٹ")}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MOBILE BOTTOM NAVIGATION */}
      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-border glass py-1 shadow-lg lg:hidden">
        <div className="flex justify-around items-center">
          {menuItems.slice(0, 4).concat(menuItems.slice(-1)).map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onViewChange(item.id)}
                className={`flex flex-col items-center justify-center py-1.5 px-3 rounded-lg transition-colors cursor-pointer ${
                  isActive ? 'text-orange-600 font-bold' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Icon className={`h-5 w-5 ${isActive ? 'text-orange-600' : 'text-slate-400'}`} />
                <span className="text-[10px] sm:text-xs mt-1 leading-none">{t(item.label.split(' ')[0], item.urdu.split(' ')[0])}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* REGISTER STATION MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h2 className="font-sans text-lg font-bold text-slate-950">
                {t('Register Independent ERP Station', 'نیا آزادانہ فیول اسٹیشن درج کریں')}
              </h2>
              <button
                onClick={handleCloseAddModal}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveNewStation} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-600 mb-1">
                  {t('Station Name (English) *', 'اسٹیشن کا نام (انگریزی) *')}
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Star Petroleum GT Road"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-orange-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-600 mb-1">
                  {t('Station Name (Urdu)', 'اسٹیشن کا نام (اردو)')}
                </label>
                <input
                  type="text"
                  placeholder="مثال: اسٹار پٹرولیم جی ٹی روڈ"
                  value={formUrduName}
                  onChange={(e) => setFormUrduName(e.target.value)}
                  dir="rtl"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-orange-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-600 mb-1">
                  {t('Address (Karachi, Multan, DHA, etc.)', 'اسٹیشن کا پتہ')}
                </label>
                <input
                  type="text"
                  placeholder="e.g. Plot 104, Main GT Road, Lahore"
                  value={formAddress}
                  onChange={(e) => setFormAddress(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-orange-500 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-slate-600 mb-1">
                    {t('NTN Registration No.', 'این ٹی این نمبر')}
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. NTN-4839210-9"
                    value={formNtn}
                    onChange={(e) => setFormNtn(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-orange-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-slate-600 mb-1">
                    {t('Owner Contact / Phone', 'رابطہ نمبر')}
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 0300-1234567"
                    value={formContact}
                    onChange={(e) => setFormContact(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-orange-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={handleCloseAddModal}
                  className="rounded-lg px-4 py-2 font-sans text-xs font-bold text-slate-500 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  {t('Cancel', 'منسوخ کریں')}
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-orange-600 px-4 py-2 font-sans text-xs font-bold text-white hover:bg-orange-700 transition-colors shadow-xs cursor-pointer"
                >
                  {t('Create Isolated Station', 'نیا آزاد اسٹیشن بنائیں')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT STATION MODAL */}
      {showEditModal && stationToEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h2 className="font-sans text-lg font-bold text-slate-950">
                {t('Modify ERP Station Details', 'اسٹیشن کی معلومات تبدیل کریں')}
              </h2>
              <button
                onClick={handleCloseEditModal}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditStation} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-600 mb-1">
                  {t('Station Name (English) *', 'اسٹیشن کا نام (انگریزی) *')}
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Star Petroleum GT Road"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-orange-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-600 mb-1">
                  {t('Station Name (Urdu)', 'اسٹیشن کا نام (اردو)')}
                </label>
                <input
                  type="text"
                  placeholder="مثال: اسٹار پٹرولیم جی ٹی روڈ"
                  value={formUrduName}
                  onChange={(e) => setFormUrduName(e.target.value)}
                  dir="rtl"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-orange-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-600 mb-1">
                  {t('Address', 'اسٹیشن کا پتہ')}
                </label>
                <input
                  type="text"
                  placeholder="e.g. Plot 104, Main GT Road, Lahore"
                  value={formAddress}
                  onChange={(e) => setFormAddress(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-orange-500 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-slate-600 mb-1">
                    {t('NTN Registration No.', 'این ٹی این نمبر')}
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. NTN-4839210-9"
                    value={formNtn}
                    onChange={(e) => setFormNtn(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-orange-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-slate-600 mb-1">
                    {t('Owner Contact / Phone', 'رابطہ نمبر')}
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 0300-1234567"
                    value={formContact}
                    onChange={(e) => setFormContact(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-orange-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={handleCloseEditModal}
                  className="rounded-lg px-4 py-2 font-sans text-xs font-bold text-slate-500 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  {t('Cancel', 'منسوخ کریں')}
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-orange-600 px-4 py-2 font-sans text-xs font-bold text-white hover:bg-orange-700 transition-colors shadow-xs cursor-pointer"
                >
                  {t('Save Changes', 'تبدیلی محفوظ کریں')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <HelpGuideModal
        isOpen={isHelpOpen}
        onClose={() => setIsHelpOpen(false)}
        settings={settings}
      />
    </>
  );
}
